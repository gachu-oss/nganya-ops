import { useState, useRef } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

function Auth() {
  const {
    user,
    loading: authLoading,
    authError,
    logoutMessage,
    clearAuthMessages,
  } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const emailInputRef = useRef(null)

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 text-sm text-gray-600">
        Completing sign-in...
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const visibleError = errorMsg || authError
  const visibleInfo = infoMsg || logoutMessage

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setInfoMsg('')
    clearAuthMessages?.()

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setErrorMsg(error.message)
      } else {
        setInfoMsg('Registration successful! Check your email or log in now.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setErrorMsg(error.message)
      }
    }

    setLoading(false)
  }

  async function handleGoogleLogin() {
    setErrorMsg('')
    setInfoMsg('')
    clearAuthMessages?.()
    setOauthLoading(true)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })

    if (error) {
      setErrorMsg(error.message)
      setOauthLoading(false)
    } else if (!data?.url) {
      setOauthLoading(false)
    }
  }

  function handleToggleMode() {
    setIsSignUp(!isSignUp)
    setErrorMsg('')
    setInfoMsg('')
    clearAuthMessages?.()
    emailInputRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white border border-gray-300 p-5 sm:p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">
            {isSignUp ? 'Create NganyaOps Account' : 'Sign In to NganyaOps'}
          </h1>
          <Link to="/" className="text-xs text-gray-600 underline hover:text-gray-900 shrink-0 py-1">
            Back
          </Link>
        </div>

        {visibleError && (
          <div role="alert" className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 text-xs">
            {visibleError}
          </div>
        )}

        {visibleInfo && (
          <div role="status" className="bg-green-50 border border-green-300 text-green-700 px-3 py-2 text-xs">
            {visibleInfo}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
              Email Address
            </label>
            <input
              ref={emailInputRef}
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@nganyaops.co.ke"
              className="w-full border border-gray-300 px-3 py-2.5 sm:py-2 text-base sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full border border-gray-300 px-3 py-2.5 sm:py-2 text-base sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading || oauthLoading}
            className="w-full bg-gray-900 text-white py-2.5 sm:py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Register' : 'Sign In'}
          </button>
        </form>

        <div className="border-t border-gray-200 pt-3">
          <button
            type="button"
            disabled={loading || oauthLoading}
            onClick={handleGoogleLogin}
            className="w-full border border-gray-300 bg-white text-gray-800 py-2.5 sm:py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {oauthLoading ? 'Redirecting to Google...' : 'Continue with Google'}
          </button>
        </div>

        <p className="text-xs text-center text-gray-600">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={handleToggleMode}
            className="underline font-semibold text-gray-900 py-1"
          >
            {isSignUp ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default Auth
