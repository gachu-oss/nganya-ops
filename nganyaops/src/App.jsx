import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import LandingPage from './components/LandingPage'
import Auth from './components/Auth'
import FleetList from './components/FleetList'

function App() {
  const [session, setSession] = useState(null)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    if (showAuth) {
      return <Auth onBack={() => setShowAuth(false)} />
    }
    return <LandingPage onEnterApp={() => setShowAuth(true)} />
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-lg">NganyaOps</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-xs text-gray-600 hover:text-gray-900 underline"
          >
            Log Out ({session.user.email})
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <FleetList />
      </main>
    </div>
  )
}

export default App
