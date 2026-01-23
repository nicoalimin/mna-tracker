import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a placeholder client that will work at build time
// but throw helpful errors if used without proper configuration
let supabase: SupabaseClient<Database>;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
} else {
  // During build time or when env vars are not set, create a dummy client
  // This prevents build errors but will fail at runtime if actually used
  const dummyUrl = 'https://placeholder.supabase.co';
  const dummyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDk5NTMwMzAsImV4cCI6MTk2NTUyOTAzMH0.placeholder';
  
  supabase = createClient<Database>(dummyUrl, dummyKey);
  
  if (typeof window !== 'undefined') {
    console.warn('Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export { supabase };
