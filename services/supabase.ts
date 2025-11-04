import { createClient } from '@supabase/supabase-js';

// =================================================================================
// IMPORTANT: INSTRUCTIONS
// 1. Go to your Supabase project dashboard.
// 2. Navigate to Project Settings > API.
// 3. Find your Project URL and the `anon` (public) API Key.
// 4. Replace the placeholder strings below with your actual credentials.
// =================================================================================

// FIX: Explicitly type as string to prevent TypeScript from inferring a literal type,
// which causes an "unintentional comparison" error in the isSupabaseConfigured check.
const supabaseUrl: string = 'https://aaakmseqlrhqkkimqagy.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhYWttc2VxbHJocWtraW1xYWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTU0MjEsImV4cCI6MjA3Nzc3MTQyMX0.Q1PAvh8I4cYtyQejEx5M-UZfWCxxjIw8qC2aYWUm7FU';

// This flag is used by the app to check if you've configured the credentials.
// It should check against the original placeholder values.
export const isSupabaseConfigured = 
    supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

if (!isSupabaseConfigured) {
    console.warn(
        'Supabase URL or Anon Key is not configured. Please update services/supabase.ts with your project credentials.'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);