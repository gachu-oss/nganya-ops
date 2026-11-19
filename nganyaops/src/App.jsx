import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import LandingPage from './components/LandingPage'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import FleetList from './components/FleetList'
import CrewList from './components/CrewList'
import TripLogs from './components/TripLogs'
import MaintenanceLog from './components/MaintenanceLog'

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-sm text-gray-600">
        Loading NganyaOps...
      </div>
    )
  }

  if (!session) {
    if (showAuth) {
      return <Auth onBack={() => setShowAuth(false)} />
    }
    return <LandingPage onEnterApp={() => setShowAuth(true)} />
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'fleet', label: 'Fleet' },
    { id: 'crew', label: 'Crew' },
    { id: 'trips', label: 'Trips' },
    { id: 'maintenance', label: 'Maintenance' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="font-bold text-lg tracking-tight">NganyaOps</span>
              <span className="ml-2 text-xs text-gray-500">Fleet Ops</span>
            </div>
            <nav className="flex flex-wrap gap-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 hidden sm:inline">
              {session.user.email}
            </span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-xs text-gray-700 hover:text-gray-900 underline"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'fleet' && <FleetList />}
        {activeTab === 'crew' && <CrewList />}
        {activeTab === 'trips' && <TripLogs />}
        {activeTab === 'maintenance' && <MaintenanceLog />}
      </main>
    </div>
  )
}

export default App
