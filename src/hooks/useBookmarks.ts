import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bookmark, BookmarkInput } from '../types';
import { useAuth } from './useAuth';
import { validateUrl, validateAndSanitizeText } from '../utils/validation';
import { BookmarkError, getErrorMessage, logError, withRetry } from '../utils/errors';

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
      // Validate and sanitize URL
      const urlValidation = validateUrl(bookmarkData.url);
      if (!urlValidation.isValid) {
        return { 
          error: new BookmarkError('BOOKMARK_INVALID_URL', urlValidation.error || 'Invalid URL', 'low'),
          data: null 
        };
      }

      // Validate and sanitize title
      const titleValidation = validateAndSanitizeText(bookmarkData.title || '', 200);
      if (!titleValidation.isValid) {
        return { 
          error: new BookmarkError('VALIDATION_TOO_LONG', titleValidation.error || 'Invalid title', 'low'),
          data: null 
        };
      }

      const sanitizedUrl = urlValidation.sanitized!;
      const sanitizedTitle = titleValidation.sanitized || '';

      // Check for duplicate URLs
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

      // Extract metadata from URL with retry mechanism
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

      // Generate summary with error handling
      try {
        await generateSummary(data.id);
      } catch (summaryError) {
        // Don't fail the entire operation if summary generation fails
        logError(summaryError as Error, { bookmarkId: data.id, url: sanitizedUrl });
      }
      
      await fetchBookmarks();
      return { data, error: null };
    } catch (error) {
      const bookmarkError = error instanceof BookmarkError 
        ? error 
        : new BookmarkError('BOOKMARK_SAVE_FAILED', getErrorMessage(error), 'medium');
      
      logError(bookmarkError, { url: bookmarkData.url });
      return { data: null, error: bookmarkError };
    }
  };

  const deleteBookmark = async (id: string) => {
    if (!user) {
      return { error: new BookmarkError('AUTH_SESSION_EXPIRED', 'User not authenticated', 'high') };
    }

    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own bookmarks

      if (error) {
        throw new BookmarkError('BOOKMARK_DELETE_FAILED', getErrorMessage(error), 'medium');
      }
      
      await fetchBookmarks();
      return { error: null };
    } catch (error) {
      const bookmarkError = error instanceof BookmarkError 
        ? error 
        : new BookmarkError('BOOKMARK_DELETE_FAILED', getErrorMessage(error), 'medium');
      
      logError(bookmarkError, { bookmarkId: id });
      return { error: bookmarkError };
    }
  };

  const generateSummary = async (bookmarkId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
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
      // Log the error but don't throw - summary generation is optional
      logError(error as Error, { bookmarkId });
      throw error;
    }
  };

  const extractMetadata = async (url: string) => {
    try {
      const urlObject = new URL(url);
      const domain = urlObject.hostname;
      const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      
      // Enhanced title extraction - you could improve this with a metadata service
      const cleanDomain = domain.replace(/^www\./, '').replace(/\.[^.]*$/, '');
      const title = cleanDomain.charAt(0).toUpperCase() + cleanDomain.slice(1);
      
      return { title, favicon };
    } catch (error) {
      logError(error as Error, { url });
      return { 
        title: url.length > 50 ? url.substring(0, 50) + '...' : url, 
        favicon: undefined 
      };
    }
  };

  const getAllTags = () => {
    const allTags = bookmarks.flatMap(bookmark => bookmark.tags || []);
    return [...new Set(allTags)].sort();
  };

  return {
    bookmarks,
    loading,
    addBookmark,
    deleteBookmark,
    refetch: fetchBookmarks,
    getAllTags,
  };
};