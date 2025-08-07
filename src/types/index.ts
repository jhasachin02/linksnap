export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string;
  favicon?: string;
  summary?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface BookmarkInput {
  url: string;
  title?: string;
  tags?: string[];
}