import React, { useState } from 'react';
import { Plus, Link, X, AlertCircle } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import { validateUrl, validateAndSanitizeText } from '../utils/validation';
import { getErrorMessage, BookmarkError } from '../utils/errors';

interface AddBookmarkFormProps {
  onClose?: () => void;
}

export const AddBookmarkForm: React.FC<AddBookmarkFormProps> = ({ onClose }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    url?: string;
    title?: string;
  }>({});
  
  const { addBookmark } = useBookmarks();

  const validateForm = () => {
    const errors: { url?: string; title?: string } = {};

    const urlValidation = validateUrl(url);
    if (!urlValidation.isValid) {
      errors.url = urlValidation.error;
    }

    const titleValidation = validateAndSanitizeText(title, 200);
    if (!titleValidation.isValid) {
      errors.title = titleValidation.error;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await addBookmark({
        url: url.trim(),
        title: title.trim() || undefined,
      });

      if (result.error) {
        if (result.error instanceof BookmarkError) {
          setError(result.error.message);
        } else {
          setError(getErrorMessage(result.error));
        }
      } else {
        setUrl('');
        setTitle('');
        setValidationErrors({});
        setIsOpen(false);
        onClose?.();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 z-50"
        aria-label="Add new bookmark"
        title="Add new bookmark"
      >
        <Plus className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add Bookmark
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close dialog"
            title="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL *
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                  validationErrors.url 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="https://example.com"
              />
            </div>
            {validationErrors.url && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.url}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title (optional)
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                validationErrors.title 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Custom title (optional)"
              maxLength={200}
            />
            {validationErrors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.title}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            >
              {loading ? 'Adding...' : 'Add Bookmark'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};