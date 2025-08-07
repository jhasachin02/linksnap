# Tag System Implementation Guide

## Database Migration

Add tags support to the bookmarks table:

```sql
-- Add tags column to bookmarks table
ALTER TABLE bookmarks ADD COLUMN tags text[] DEFAULT '{}';

-- Create index for tag searches
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags ON bookmarks USING GIN (tags);
```

## Updated Types

```typescript
// src/types/index.ts
export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string;
  favicon?: string;
  summary?: string;
  tags: string[]; // Add this
  created_at: string;
  updated_at: string;
}

export interface BookmarkInput {
  url: string;
  title?: string;
  tags?: string[]; // Add this
}
```

## Tag Input Component

```tsx
// src/components/TagInput.tsx
import React, { useState } from 'react';
import { X, Tag } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ tags, onChange, placeholder = "Add tags..." }) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            <Tag className="w-3 h-3 mr-1" />
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        onBlur={() => inputValue && addTag(inputValue)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      />
    </div>
  );
};
```

## Tag Filter Component

```tsx
// src/components/TagFilter.tsx
import React from 'react';
import { Tag, X } from 'lucide-react';

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export const TagFilter: React.FC<TagFilterProps> = ({
  availableTags,
  selectedTags,
  onChange,
}) => {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const clearAllTags = () => {
    onChange([]);
  };

  if (availableTags.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <Tag className="w-4 h-4 mr-2" />
          Filter by tags
        </h3>
        {selectedTags.length > 0 && (
          <button
            onClick={clearAllTags}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedTags.includes(tag)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {tag}
            {selectedTags.includes(tag) && (
              <X className="w-3 h-3 ml-1" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
```

## Updated useBookmarks Hook

```typescript
// Add to useBookmarks.ts
const getAllTags = () => {
  const allTags = bookmarks.flatMap(bookmark => bookmark.tags || []);
  return [...new Set(allTags)].sort();
};

// Update filtering logic in BookmarksList.tsx
const filteredBookmarks = bookmarks.filter(bookmark => {
  const matchesSearch = bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bookmark.summary && bookmark.summary.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const matchesTags = selectedTags.length === 0 || 
    selectedTags.every(tag => bookmark.tags?.includes(tag));
  
  return matchesSearch && matchesTags;
});
```
