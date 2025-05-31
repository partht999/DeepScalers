import { createClient } from '@supabase/supabase-js'

// Your Supabase project URL and anon key
const supabaseUrl = 'https://ogqptvpfnwpdzjaeohbg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncXB0dnBmbndwZHpqYWVvaGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5ODk1NjUsImV4cCI6MjA2MzU2NTU2NX0.rzO484X3BNEsO4oaNzZ5waaMZ7EwXpyPa3fdqqHIFr8'
// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) 