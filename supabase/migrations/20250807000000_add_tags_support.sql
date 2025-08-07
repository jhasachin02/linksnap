/*
  # Add tags support to bookmarks table

  1. Changes
    - Add `tags` column to `bookmarks` table as text array
    - Create GIN index for efficient tag searches
    - Update existing bookmarks to have empty tags array
*/

-- Add tags column to bookmarks table
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create index for tag searches using GIN index for array operations
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags ON bookmarks USING GIN (tags);

-- Update existing bookmarks to have empty tags array (in case column was added as NULL)
UPDATE bookmarks SET tags = '{}' WHERE tags IS NULL;
