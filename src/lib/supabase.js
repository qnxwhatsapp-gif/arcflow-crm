import { createClient } from '@supabase/supabase-js'

// Fallback to hardcoded values if Vercel env vars are not configured.
// The URL and anon key are safe to be public (anon key is scoped by RLS).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hdpgqrvlvvpgrxkkzylo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcGdxcnZsdnZwZ3J4a2t6eWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzAyNjUsImV4cCI6MjA5NTgwNjI2NX0.DZEkImw5z7vDvWZXzqGCugjNjgsgdnesOQ8t9SKZ70s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
