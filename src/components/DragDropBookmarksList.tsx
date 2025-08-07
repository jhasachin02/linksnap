import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { BookmarkCard } from './BookmarkCard';
import { Bookmark } from '../types';

interface DragDropBookmarksListProps {
  bookmarks: Bookmark[];
  onReorder: (bookmarks: Bookmark[]) => void;
}

export const DragDropBookmarksList: React.FC<DragDropBookmarksListProps> = ({
  bookmarks,
  onReorder,
}) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(bookmarks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    onReorder(items);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="bookmarks">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-1"
          >
            {bookmarks.map((bookmark, index) => (
              <Draggable key={bookmark.id} draggableId={bookmark.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <BookmarkCard bookmark={bookmark} />
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
