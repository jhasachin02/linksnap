# Drag-and-Drop Reordering Implementation Guide

## Required Dependencies

```bash
npm install react-beautiful-dnd @types/react-beautiful-dnd
```

## Database Migration

Add sort order to bookmarks:

```sql
-- Add sort_order column
ALTER TABLE bookmarks ADD COLUMN sort_order integer DEFAULT 0;

-- Update existing bookmarks with incremental sort order
UPDATE bookmarks SET sort_order = ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at);

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_bookmarks_sort_order ON bookmarks(user_id, sort_order);
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
  tags: string[];
  sort_order: number; // Add this
  created_at: string;
  updated_at: string;
}
```

## DragDropBookmarksList Component

```tsx
// src/components/DragDropBookmarksList.tsx
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { BookmarkCard } from './BookmarkCard';
import { useBookmarks } from '../hooks/useBookmarks';
import { Bookmark } from '../types';

interface DragDropBookmarksListProps {
  bookmarks: Bookmark[];
  onReorder: (bookmarks: Bookmark[]) => void;
}

export const DragDropBookmarksList: React.FC<DragDropBookmarksListProps> = ({
  bookmarks,
  onReorder,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);

    if (!result.destination) {
      return;
    }

    const items = Array.from(bookmarks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order for all affected bookmarks
    const updatedBookmarks = items.map((bookmark, index) => ({
      ...bookmark,
      sort_order: index,
    }));

    onReorder(updatedBookmarks);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <Droppable droppableId="bookmarks">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`grid gap-6 md:grid-cols-2 lg:grid-cols-1 transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
          >
            {bookmarks.map((bookmark, index) => (
              <Draggable key={bookmark.id} draggableId={bookmark.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`transition-transform ${
                      snapshot.isDragging ? 'rotate-2 scale-105 shadow-2xl' : ''
                    }`}
                  >
                    <div
                      {...provided.dragHandleProps}
                      className="relative"
                    >
                      <BookmarkCard bookmark={bookmark} />
                      {/* Drag handle indicator */}
                      <div className="absolute top-2 left-2 opacity-0 hover:opacity-100 transition-opacity">
                        <div className="flex flex-col space-y-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
```

## Updated useBookmarks Hook

```typescript
// Add to useBookmarks.ts
const updateBookmarkOrder = async (bookmarks: Bookmark[]) => {
  if (!user) return;

  try {
    // Update multiple bookmarks with new sort_order
    const updates = bookmarks.map((bookmark, index) => ({
      id: bookmark.id,
      sort_order: index,
    }));

    const { error } = await supabase
      .from('bookmarks')
      .upsert(updates, { onConflict: 'id' });

    if (error) throw error;

    // Update local state
    setBookmarks(bookmarks);
  } catch (error) {
    console.error('Error updating bookmark order:', error);
    // Revert to original order on error
    await fetchBookmarks();
  }
};

// Update fetchBookmarks to sort by sort_order
const fetchBookmarks = async () => {
  if (!user) return;
  
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }); // Fallback for items with same sort_order

    if (error) throw error;
    setBookmarks(data || []);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
  } finally {
    setLoading(false);
  }
};
```

## Updated BookmarksList Component

```tsx
// Update BookmarksList.tsx to use drag-and-drop
import { DragDropBookmarksList } from './DragDropBookmarksList';

// Replace the existing grid with:
{filteredBookmarks.length > 0 ? (
  <DragDropBookmarksList 
    bookmarks={filteredBookmarks}
    onReorder={updateBookmarkOrder}
  />
) : (
  // Empty state component
)}
```

## Additional Features

### Drag Handle Component
```tsx
// src/components/DragHandle.tsx
import React from 'react';
import { GripVertical } from 'lucide-react';

export const DragHandle: React.FC = () => (
  <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-70 transition-opacity cursor-grab active:cursor-grabbing">
    <GripVertical className="w-5 h-5 text-gray-400" />
  </div>
);
```

### Sorting Options
```tsx
// Add sorting controls
const [sortBy, setSortBy] = useState<'manual' | 'created' | 'title'>('manual');

const getSortedBookmarks = () => {
  switch (sortBy) {
    case 'created':
      return [...bookmarks].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case 'title':
      return [...bookmarks].sort((a, b) => a.title.localeCompare(b.title));
    case 'manual':
    default:
      return [...bookmarks].sort((a, b) => a.sort_order - b.sort_order);
  }
};
```
