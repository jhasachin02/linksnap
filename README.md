# BookmarkAI - Link Saver with Auto-Summary

A full-stack web application that allows users to save bookmarks and automatically generates AI-powered summaries for each saved URL using the Jina AI API.

## 🚀 Features

- **User Authentication**: Secure sign up/sign in with Supabase Auth
- **Bookmark Management**: Save, view, search, and delete bookmarks
- **AI-Powered Summaries**: Automatic content summarization using Jina AI API
- **Drag & Drop Reordering**: Organize bookmarks with intuitive drag-and-drop
- **Tag System**: Categorize bookmarks with custom tags
- **Responsive Design**: Modern UI with dark mode support
- **Real-time Updates**: Live bookmark updates and notifications
- **Input Validation**: Comprehensive XSS protection and URL validation
- **Error Handling**: Robust error handling with user-friendly messages
- **Search Functionality**: Search bookmarks by title, URL, or summary content

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Beautiful DnD** for drag and drop functionality

### Backend
- **Supabase** (PostgreSQL database + Auth + Edge Functions)
- **Supabase Edge Functions** (Deno runtime)

### APIs
- **Jina AI Reader API** for content extraction and summarization

### Testing & Quality
- **Vitest** for unit testing
- **React Testing Library** for component testing
- **ESLint** for code quality
- **TypeScript** for type safety

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Modern web browser

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd bookmark-manager
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

The project includes a migration file that will:
- Create the `bookmarks` table
- Set up Row Level Security (RLS) policies
- Create necessary indexes for performance

Run the migration in your Supabase project:
```sql
-- See: supabase/migrations/20250806140945_teal_cell.sql
```

### 5. Deploy Edge Function

Deploy the summary generation function to Supabase:
```bash
# Install Supabase CLI first: https://supabase.com/docs/guides/cli
supabase functions deploy generate-summary
```

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🧪 Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 🔒 Security Features

### Input Validation & Sanitization
- URL validation with protocol checks
- XSS prevention using DOMPurify
- Input length limits
- SQL injection protection via Supabase RLS

### Authentication Security
- Password strength validation
- Email format validation
- Rate limiting on auth attempts
- Secure session management

### URL Safety
- Protocol restriction (HTTP/HTTPS only)
- Private IP address blocking in production
- URL length limits
- Content-Type validation

## 📁 Project Structure

```
BookmarkAI/
├── docs/                    # Project documentation
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── AuthForm.tsx            # Authentication form
│   │   ├── BookmarkCard.tsx        # Individual bookmark display
│   │   ├── BookmarksList.tsx       # Bookmark list with search
│   │   ├── DragDropBookmarksList.tsx # Drag & drop bookmark list
│   │   ├── AddBookmarkForm.tsx     # Add new bookmark modal
│   │   ├── TagInput.tsx            # Tag input component
│   │   ├── TagFilter.tsx           # Tag filtering component
│   │   ├── Layout.tsx              # Main layout wrapper
│   │   └── ErrorBoundary.tsx       # Error boundary component
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts              # Authentication logic
│   │   ├── useBookmarks.ts         # Bookmark CRUD operations
│   │   └── useDarkMode.ts          # Dark mode toggle
│   ├── lib/                 # External service clients
│   │   └── supabase.ts             # Supabase client setup
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts                # App-wide types
│   ├── utils/               # Utility functions
│   │   ├── validation.ts           # Input validation & sanitization
│   │   ├── errors.ts               # Error handling utilities
│   │   └── performance.ts          # Performance utilities
│   └── test/                # Test files
│       ├── setup.ts                # Test environment setup
│       ├── validation.test.ts      # Validation tests
│       ├── errors.test.ts          # Error handling tests
│       └── AuthForm.test.tsx       # Component tests
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── generate-summary/       # AI summary generation
│   │   └── _shared/                # Shared utilities
│   └── migrations/          # Database migrations
└── [config files]          # Various configuration files
```
    ├── setup.ts        # Test environment setup
    ├── validation.test.ts
    ├── errors.test.ts
    └── AuthForm.test.tsx
```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the provided migration to set up the database schema
3. Deploy the Edge Function for summary generation
4. Update environment variables with your project credentials

### Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## 📝 API Documentation

### Edge Function: Generate Summary
**Endpoint**: `POST /functions/v1/generate-summary`

**Request Body**:
```json
{
  "bookmarkId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "summary": "Generated summary text...",
  "bookmarkId": "uuid"
}
```

## 🚨 Error Handling

The application includes comprehensive error handling:

- **Validation Errors**: Client-side validation with user-friendly messages
- **Network Errors**: Retry mechanisms and timeout handling
- **Authentication Errors**: Specific error messages for auth failures
- **Database Errors**: Graceful degradation with fallback behavior
- **API Errors**: Proper error propagation from external services

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Toggle between light and dark themes
- **Loading States**: Visual feedback during operations
- **Error States**: Clear error messages and recovery options
- **Search & Filter**: Real-time search across bookmarks
- **Accessible**: ARIA labels and keyboard navigation support

## 🔄 Performance Optimizations

- **Lazy Loading**: Components and data loaded on demand
- **Optimistic Updates**: UI updates before server confirmation
- **Request Deduplication**: Prevent duplicate API calls
- **Caching**: Local storage for user preferences
- **Database Indexes**: Optimized queries for faster performance

## 🛡 Security Considerations

- **Row Level Security**: Database-level access control
- **Input Sanitization**: All user inputs are validated and sanitized
- **HTTPS Only**: Secure communication enforced
- **CORS Configuration**: Properly configured for cross-origin requests
- **Rate Limiting**: Protection against abuse

## 📈 Future Enhancements

- [ ] Bookmark folders/tags organization
- [ ] Import/export bookmarks
- [ ] Social sharing features
- [ ] Advanced search filters
- [ ] Bookmark analytics and insights
- [ ] PWA (Progressive Web App) support
- [ ] Browser extension

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## � Documentation

For detailed information, check the `/docs` folder:

- **[Development Guide](./docs/DEVELOPMENT.md)** - Setup and development workflow
- **[API Documentation](./docs/API.md)** - API endpoints and database schema
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Netlify and Supabase deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## �🙏 Acknowledgments

- [Supabase](https://supabase.com/) for the backend infrastructure
- [Jina AI](https://jina.ai/) for the content summarization API
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
- [Lucide](https://lucide.dev/) for the icon library
- [React Beautiful DnD](https://github.com/atlassian/react-beautiful-dnd) for drag and drop functionality
