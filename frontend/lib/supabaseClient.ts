// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
const isSupabaseConfigured = url && url.startsWith('http') && anonKey && anonKey.length > 20

// Log warning if using mock client
if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase credentials not configured. Using mock client.')
  console.warn('📝 To fix: Update .env.local with real Supabase credentials')
  console.warn('📚 See: SUPABASE_SETUP.md for setup instructions')
}

// Create client with valid URL or use mock
export const supabase = isSupabaseConfigured 
  ? createClient(url, anonKey)
  : createClient('https://mock.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock')
