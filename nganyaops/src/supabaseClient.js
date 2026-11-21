import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const globalForSupabase = globalThis

function createSupabaseClient() {
  const safeFetch = async (input, init) => {
    const response = await globalThis.fetch(input, init)
    const url = typeof input === 'string' ? input : input?.url || ''

    // Clear stale local session immediately if Supabase rejects a refresh token
    // so proactive refresh retries don't keep failing with 400 in a loop.
    if (
      response.status === 400 &&
      url.includes('/auth/v1/token') &&
      url.includes('grant_type=refresh_token')
    ) {
      try {
        for (const key of Object.keys(globalThis.localStorage)) {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            globalThis.localStorage.removeItem(key)
          }
        }
      } catch {
        // Ignore storage errors in restricted contexts.
      }
    }

    return response
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: { fetch: safeFetch },
  })
}

export const supabase =
  globalForSupabase.__nganyaSupabase ??
  (globalForSupabase.__nganyaSupabase = createSupabaseClient())
