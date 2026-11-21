import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

function readOAuthErrorFromUrl() {
  if (typeof window === 'undefined') return ''

  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const errorText =
    searchParams.get('error_description') ||
    hashParams.get('error_description') ||
    searchParams.get('error') ||
    hashParams.get('error')

  if (!errorText) return ''

  let hasChanges = false
  for (const key of ['error', 'error_code', 'error_description']) {
    if (searchParams.has(key)) {
      searchParams.delete(key)
      hasChanges = true
    }
    if (hashParams.has(key)) {
      hashParams.delete(key)
      hasChanges = true
    }
  }

  if (hasChanges) {
    const nextSearch = searchParams.toString()
    const nextHash = hashParams.toString()
    const cleanUrl =
      window.location.pathname +
      (nextSearch ? `?${nextSearch}` : '') +
      (nextHash ? `#${nextHash}` : '')
    window.history.replaceState(window.history.state, '', cleanUrl)
  }

  return errorText
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(() => readOAuthErrorFromUrl())
  const [logoutMessage, setLogoutMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadSession() {
      if (typeof supabase.auth.initialize === 'function') {
        const initResult = await supabase.auth.initialize()
        if (active && initResult?.error) {
          setAuthError((prev) => prev || initResult.error.message)
        }
      }

      const { data, error } = await supabase.auth.getSession()
      if (!active) return

      if (error) {
        await supabase.auth.signOut({ scope: 'local' })
        if (!active) return
        setSession(null)
        setAuthError((prev) => prev || error.message)
      } else {
        setSession(data?.session ?? null)
      }
      setLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) {
        setAuthError('')
        setLogoutMessage('')
      }
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setLogoutMessage('You have been logged out.')
  }

  function clearAuthMessages() {
    setAuthError('')
    setLogoutMessage('')
  }

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    authError,
    logoutMessage,
    clearAuthMessages,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
