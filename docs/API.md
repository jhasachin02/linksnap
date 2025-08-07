# API Documentation

## Edge Functions

### Generate Summary Function

**Endpoint**: `POST /functions/v1/generate-summary`

**Description**: Generates AI-powered summaries for bookmarked URLs using the Jina AI Reader API.

**Request Body**:
```json
{
  "bookmarkId": "uuid-string"
}
```

**Response**:
```json
{
  "success": true,
  "summary": "Generated summary text...",
  "bookmarkId": "uuid-string"
}
```

**Error Response**:
```json
{
  "error": "Error message",
  "timestamp": "2025-08-07T10:30:00.000Z"
}
```

**Implementation Details**:
- Uses Jina AI Reader API with authentication
- Includes content validation and sanitization
- Implements timeout protection (30 seconds)
- Supports URL safety validation
- Automatically updates bookmark record

## Database Schema

### Bookmarks Table

```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Users can only access their own bookmarks
CREATE POLICY "Users can manage their own bookmarks" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);
```

## Frontend API Hooks

### useBookmarks Hook

```typescript
const {
  bookmarks,
  loading,
  error,
  addBookmark,
  deleteBookmark,
  updateBookmarkOrder,
  fetchBookmarks,
  generateSummary,
  getAllTags
} = useBookmarks();
```

### useAuth Hook

```typescript
const {
  user,
  loading,
  signUp,
  signIn,
  signOut,
  resetPassword
} = useAuth();
```

## Environment Variables

### Frontend (.env)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Edge Functions (Supabase)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
