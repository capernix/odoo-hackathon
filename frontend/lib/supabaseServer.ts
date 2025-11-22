// lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const isSupabaseConfigured = url && url.startsWith('http') && serviceKey && serviceKey.length > 20

export function getServerSupabase() {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase server credentials not configured. Using mock client.')
    return createClient('https://mock.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock')
  }
  return createClient(url, serviceKey)
}
