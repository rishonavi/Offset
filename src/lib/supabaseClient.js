import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// When both env vars are present we run against Supabase (cloud + login).
// Otherwise the app falls back to local "demo mode" (browser storage).
export const hasSupabase = Boolean(url && key)

export const supabase = hasSupabase
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
