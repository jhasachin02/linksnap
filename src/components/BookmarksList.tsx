import React from 'react';
import { BookmarkCard } from './BookmarkCard';
import { AddBookmarkForm } from './AddBookmarkForm';
import { TagFilter } from './TagFilter';
import { useBookmarks } from '../hooks/useBookmarks';
import { Bookmark, Search, Plus } from 'lucide-react';

export const BookmarksList: React.FC = () => {
  const { bookmarks, loading, getAllTags } = useBookmarks();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bookmark.summary && bookmark.summary.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => bookmark.tags?.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Bookmarks
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>

        {bookmarks.length > 0 && (
          <TagFilter
            availableTags={getAllTags()}
            selectedTags={selectedTags}
            onChange={setSelectedTags}
          />
        )}

        {bookmarks.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
            />
          </div>
        )}
      </div>

      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-full w-16 h-16 mx-auto mb-4">
            <Bookmark className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            {bookmarks.length === 0 ? 'No bookmarks yet' : 'No matching bookmarks'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {bookmarks.length === 0 
              ? 'Start building your bookmark collection with AI-powered summaries'
              : 'Try adjusting your search terms'
            }
          </p>
          {bookmarks.length === 0 && (
            <div className="inline-flex">
              <AddBookmarkForm />
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          {filteredBookmarks.map((bookmark) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} />
          ))}
        </div>
      )}

      {bookmarks.length > 0 && <AddBookmarkForm />}
    </div>
  );
};