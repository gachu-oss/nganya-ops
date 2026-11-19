import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './components/LandingPage'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import FleetList from './components/FleetList'
import CrewList from './components/CrewList'
import TripLogs from './components/TripLogs'
import MaintenanceLog from './components/MaintenanceLog'

function LandingWrapper() {
  const navigate = useNavigate()
  return <LandingPage onEnterApp={() => navigate('/login')} />
}

function AppLayout({ children }) {
  const { user, signOut } = useAuth()

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/fleet', label: 'Fleet' },
    { to: '/crew', label: 'Crew' },
    { to: '/trips', label: 'Trips' },
    { to: '/maintenance', label: 'Maintenance' },
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
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 hidden sm:inline">{user?.email}</span>
            <button
              onClick={signOut}
              className="text-xs text-gray-700 hover:text-gray-900 underline"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingWrapper />} />
      <Route path="/login" element={<Auth />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/fleet"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FleetList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/crew"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CrewList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TripLogs />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MaintenanceLog />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
