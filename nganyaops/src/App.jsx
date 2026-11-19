import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import LandingPage from './components/LandingPage'
import Auth from './components/Auth'
import FleetList from './components/FleetList'
import CrewList from './components/CrewList'
import TripLogs from './components/TripLogs'
import MaintenanceLog from './components/MaintenanceLog'

function App() {
  const [session, setSession] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('fleet')

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
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg">NganyaOps</span>
            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab('fleet')}
                className={`px-3 py-1 text-sm font-medium ${
                  activeTab === 'fleet'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Fleet
              </button>
              <button
                onClick={() => setActiveTab('crew')}
                className={`px-3 py-1 text-sm font-medium ${
                  activeTab === 'crew'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Crew
              </button>
              <button
                onClick={() => setActiveTab('trips')}
                className={`px-3 py-1 text-sm font-medium ${
                  activeTab === 'trips'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Trips
              </button>
              <button
                onClick={() => setActiveTab('maintenance')}
                className={`px-3 py-1 text-sm font-medium ${
                  activeTab === 'maintenance'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Maintenance
              </button>
            </nav>
          </div>

          <button
            onClick={() => supabase.auth.signOut()}
            className="text-xs text-gray-600 hover:text-gray-900 underline"
          >
            Log Out ({session.user.email})
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'fleet' && <FleetList />}
        {activeTab === 'crew' && <CrewList />}
        {activeTab === 'trips' && <TripLogs />}
        {activeTab === 'maintenance' && <MaintenanceLog />}
      </main>
    </div>
  )
}

export default App
