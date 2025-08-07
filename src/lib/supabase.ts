import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your Netlify environment variables.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

const fallbackUrl = supabaseUrl || 'https://your-project.supabase.co';
const fallbackKey = supabaseAnonKey || 'your-anon-key';

export const supabase = createClient(fallbackUrl, fallbackKey);