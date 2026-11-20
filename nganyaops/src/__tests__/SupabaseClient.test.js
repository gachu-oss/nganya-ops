import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('supabaseClient singleton & refresh-token cleanup', () => {
  beforeEach(() => {
    vi.resetModules()
    delete globalThis.__nganyaSupabase
    localStorage.clear()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    delete globalThis.__nganyaSupabase
    localStorage.clear()
  })

  it('reuses a single Supabase client instance across module reloads', async () => {
    const first = await import('../supabaseClient')
    vi.resetModules()
    const second = await import('../supabaseClient')

    expect(second.supabase).toBe(first.supabase)
  })

  it('clears stale sb-*-auth-token storage when refresh_token returns 400', async () => {
    localStorage.setItem('sb-example-auth-token', '{"refresh_token":"stale"}')
    localStorage.setItem('unrelated-key', 'keep-me')

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid_grant' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', mockFetch)

    const { supabase } = await import('../supabaseClient')
    await supabase.auth.refreshSession({ refresh_token: 'stale' })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('sb-example-auth-token')).toBeNull()
    expect(localStorage.getItem('unrelated-key')).toBe('keep-me')
  })
})
