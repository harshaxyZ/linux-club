import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://noaucjjnhpxuyyskzihl.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vYXVjampuaHB4dXl5c2t6aWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzAyNjEsImV4cCI6MjEwNTE0NjI2MX0.Dj2dM-4lci_wiCgsBMyihjWA1Bg2VzdRanY4ZnDLtWw';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

