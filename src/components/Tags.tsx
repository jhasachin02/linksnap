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
      <div className="flex flex-wrap gap-2 min-h-[2rem] p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-md"
          >
            <Tag size={12} />
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-blue-600 dark:hover:text-blue-300"
              title={`Remove ${tag} tag`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          onBlur={() => inputValue && addTag(inputValue)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-900 dark:text-gray-100"
        />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Press Enter or comma to add tags
      </p>
    </div>
  );
};

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
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Tag size={16} />
          Filter by Tags
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
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                isSelected
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Tag size={12} />
              {tag}
              {isSelected && <X size={12} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
