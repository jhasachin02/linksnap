import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Bookmark, BookmarkInput } from '../types';
import { validateUrl, validateAndSanitizeText, BookmarkError, getErrorMessage, logError, withRetry } from '../utils';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return { data, error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { data, error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  return { user, loading, signUp, signIn, signOut, resetPassword };
};

export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  return { darkMode, toggleDarkMode };
};

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBookmarks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [user]);

  const addBookmark = async (bookmarkData: BookmarkInput) => {
    if (!user) {
      return { error: new BookmarkError('AUTH_SESSION_EXPIRED', 'User not authenticated', 'high') };
    }

    try {
      const urlValidation = validateUrl(bookmarkData.url);
      if (!urlValidation.isValid) {
        return { 
          error: new BookmarkError('BOOKMARK_INVALID_URL', urlValidation.error || 'Invalid URL', 'low'),
          data: null 
        };
      }

      const titleValidation = validateAndSanitizeText(bookmarkData.title || '', 200);
      if (!titleValidation.isValid) {
        return { 
          error: new BookmarkError('VALIDATION_TOO_LONG', titleValidation.error || 'Invalid title', 'low'),
          data: null 
        };
      }

      const sanitizedUrl = urlValidation.sanitized!;
      const sanitizedTitle = titleValidation.sanitized || '';

      const { data: existingBookmark } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('url', sanitizedUrl)
        .single();

      if (existingBookmark) {
        return { 
          error: new BookmarkError('BOOKMARK_DUPLICATE_URL', 'This URL has already been bookmarked', 'low'),
          data: null 
        };
      }

      const { title, favicon } = await withRetry(() => extractMetadata(sanitizedUrl), 2, 1000);
      
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          url: sanitizedUrl,
          title: sanitizedTitle || title || new URL(sanitizedUrl).hostname,
          favicon,
          tags: bookmarkData.tags || [],
        })
        .select()
        .single();

      if (error) {
        throw new BookmarkError('BOOKMARK_SAVE_FAILED', getErrorMessage(error), 'medium');
      }

      try {
        await generateSummary(data.id);
      } catch (summaryError) {
        logError(summaryError as Error, { bookmarkId: data.id, url: sanitizedUrl });
      }
      
      await fetchBookmarks();
      return { data, error: null };
    } catch (error) {
      const bookmarkError = error instanceof BookmarkError 
        ? error 
        : new BookmarkError('BOOKMARK_SAVE_FAILED', getErrorMessage(error), 'medium');
      
      logError(bookmarkError, { url: bookmarkData.url });
      return { error: bookmarkError, data: null };
    }
  };

  const deleteBookmark = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchBookmarks();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const generateSummary = async (bookmarkId: string) => {
    try {
      const response = await fetch(`/.netlify/functions/generate-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarkId }),
      });

      if (!response.ok) {
        throw new BookmarkError(
          'SUMMARY_GENERATION_FAILED', 
          `Failed to generate summary: ${response.status}`, 
          'low'
        );
      }

      await fetchBookmarks();
    } catch (error) {
      logError(error as Error, { bookmarkId });
      throw error;
    }
  };

  const extractMetadata = async (url: string) => {
    try {
      const urlObject = new URL(url);
      const domain = urlObject.hostname;
      const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      
      const cleanDomain = domain.replace(/^www\./, '').replace(/\.[^.]*$/, '');
      const title = cleanDomain.charAt(0).toUpperCase() + cleanDomain.slice(1);
      
      return { title, favicon };
    } catch (error) {
      logError(error as Error, { url });
      return { 
        title: 'Bookmark', 
        favicon: 'https://www.google.com/s2/favicons?domain=example.com&sz=32' 
      };
    }
  };

  const getAllTags = () => {
    const allTags = bookmarks.flatMap(bookmark => bookmark.tags || []);
    return [...new Set(allTags)].sort();
  };

  const updateBookmarkOrder = async (bookmarks: Bookmark[]) => {
    if (!user) return;
    try {
      const updates = bookmarks.map((bookmark, index) => ({
        id: bookmark.id,
        sort_order: index,
      }));
      const { error } = await supabase
        .from('bookmarks')
        .upsert(updates, { onConflict: 'id' });
      if (error) throw error;
      setBookmarks(bookmarks);
    } catch (error) {
      console.error('Error updating bookmark order:', error);
      await fetchBookmarks();
    }
  };

  return {
    bookmarks,
    loading,
    addBookmark,
    deleteBookmark,
    refetch: fetchBookmarks,
    getAllTags,
    updateBookmarkOrder,
  };
};
