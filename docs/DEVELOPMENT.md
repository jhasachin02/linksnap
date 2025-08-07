# Development Guide

## Project Structure

```
BookmarkAI/
├── docs/                   # Documentation
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Library configurations
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── test/              # Test files
├── supabase/
│   ├── functions/         # Edge Functions
│   └── migrations/        # Database migrations
└── [config files]         # Various configuration files
```

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

### 3. Database Setup
Apply migrations to your Supabase project:
```bash
supabase db reset
```

### 4. Start Development Server
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint

## Code Quality

### ESLint Configuration
The project uses ESLint with TypeScript and React rules:
```javascript
// eslint.config.js
export default tseslint.config({
  // Configuration
});
```

### Testing Strategy
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: Hook and service testing
- **Test Setup**: Vitest with React Testing Library

### TypeScript Configuration
- Strict mode enabled
- Path aliases configured
- Separate configs for app and Node.js

## Git Workflow

### Branch Naming
- `main` - Production branch
- `develop` - Development branch
- `feature/feature-name` - Feature branches
- `hotfix/fix-name` - Hotfix branches

### Commit Messages
Use conventional commits:
```
feat: add new bookmark feature
fix: resolve authentication issue
docs: update API documentation
test: add bookmark validation tests
```

## Deployment

### Netlify (Frontend)
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables

### Supabase (Backend)
1. Create project
2. Apply database migrations
3. Deploy Edge Functions
4. Configure authentication

## Performance Guidelines

### Frontend Optimization
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Lazy load components when possible
- Optimize images and assets

### Database Optimization
- Use appropriate indexes
- Implement pagination for large datasets
- Use RLS policies for security
- Regular database maintenance

## Security Considerations

### Input Validation
- Validate all user inputs
- Sanitize data before storage
- Use DOMPurify for XSS prevention
- Implement rate limiting

### Authentication
- Use Supabase Auth for security
- Implement proper session management
- Use RLS policies for data access
- Regular security audits

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Check TypeScript errors
   - Verify environment variables
   - Clear node_modules and reinstall

2. **Database Issues**
   - Verify Supabase connection
   - Check RLS policies
   - Review migration status

3. **API Issues**
   - Check network connectivity
   - Verify API keys
   - Review CORS settings

### Debug Tips
- Use React Developer Tools
- Check browser console for errors
- Use Supabase dashboard for database debugging
- Monitor network requests in DevTools
