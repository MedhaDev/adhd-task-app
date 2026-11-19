import { describe, expect, it, vi } from 'vitest'

// The module creates a client on import; stub it so tests stay offline.
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => ({})) }))
vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test')

const { readSupabaseConfig } = await import('./supabase')

describe('readSupabaseConfig', () => {
  it('accepts a publishable key', () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc',
      }),
    ).toEqual({ url: 'https://example.supabase.co', key: 'sb_publishable_abc' })
  })

  it('refuses a secret key', () => {
    expect(() =>
      readSupabaseConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_abc',
      }),
    ).toThrow(/SECRET key/)
  })

  it('explains what to do when settings are missing', () => {
    expect(() => readSupabaseConfig({})).toThrow(/\.env\.local/)
  })
})
