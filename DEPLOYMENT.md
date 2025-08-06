# Netlify Deployment Guide

## Quick Fix for Current Issue

Your app is showing a blank page because:
1. Missing Netlify configuration (now fixed)
2. Missing environment variables in Netlify

## Steps to Fix:

### 1. Set Environment Variables in Netlify

1. Go to your Netlify dashboard: https://app.netlify.com/
2. Select your site (link-snaps)
3. Go to Site settings > Environment variables
4. Add these variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

### 2. Get Your Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project (or create one)
3. Go to Settings > API
4. Copy:
   - Project URL (for VITE_SUPABASE_URL)
   - Anon key (for VITE_SUPABASE_ANON_KEY)

### 3. Redeploy

After setting the environment variables:
1. In Netlify, go to Deploys
2. Click "Trigger deploy" > "Deploy site"

## Files Added/Modified:

- ✅ `netlify.toml` - Netlify configuration
- ✅ `public/_redirects` - SPA routing fix
- ✅ `src/components/ErrorBoundary.tsx` - Better error handling
- ✅ Updated `vite.config.ts` - Better build config
- ✅ Updated `src/lib/supabase.ts` - Non-breaking error handling
- ✅ Updated `src/main.tsx` - Added error boundary

## Alternative: Quick Demo Setup

If you want to see the app working immediately without setting up Supabase:

1. Create a demo Supabase project at https://supabase.com/
2. Follow the database setup in the README.md
3. Set the environment variables in Netlify
4. Redeploy

The app should now load properly!
