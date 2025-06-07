import { createClient } from '@supabase/supabase-js'

// Your Supabase project URL and anon key
const supabaseUrl = 'https://osluoioobflfdsbokjoc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zbHVvaW9vYmZsZmRzYm9ram9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyOTI4MzAsImV4cCI6MjA2NDg2ODgzMH0.i0zjA4zU1C3gtuJOECoVVTvTKLKZnD8ez_E1uAqtA6k'
// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) 