/*
  # Add sort_order support to bookmarks table for drag-and-drop

  1. Changes
    - Add `sort_order` column to `bookmarks` table as integer
    - Create index for efficient sorting
    - Update existing bookmarks with incremental sort order
*/

-- Add sort_order column
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Update existing bookmarks with incremental sort order
UPDATE bookmarks SET sort_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 as rn
  FROM bookmarks
) AS sub
WHERE bookmarks.id = sub.id;

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_bookmarks_sort_order ON bookmarks(user_id, sort_order);
