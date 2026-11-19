import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Checks the Supabase settings before the app uses them.
 * The browser may only ever hold the PUBLISHABLE key. A secret key would let
 * anyone who opens the app bypass Row Level Security, so we refuse to start.
 */
export function readSupabaseConfig(env: {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_PUBLISHABLE_KEY?: string
}): { url: string; key: string } {
  const url = env.VITE_SUPABASE_URL?.trim()
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env.local and fill in the URL and publishable key.',
    )
  }
  if (key.startsWith('sb_secret_') || key.includes('service_role')) {
    throw new Error(
      'A Supabase SECRET key was found in the browser settings. Use the publishable key instead.',
    )
  }
  return { url, key }
}

const { url, key } = readSupabaseConfig(import.meta.env)

export const supabase = createClient<Database>(url, key, {
  auth: {
    // Stay signed in on this device: the session is kept and refreshed automatically.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
