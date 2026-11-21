import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import App, { AppRoutes } from '../App'
import { AuthProvider } from '../context/AuthContext'
import FleetList from '../components/FleetList'
import { supabase } from '../supabaseClient'

const mockInsert = vi.fn().mockResolvedValue({ error: null })
let authChangeCallback = null

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: { email: 'manager@nganyaops.co.ke' },
          },
        },
      }),
      onAuthStateChange: vi.fn((cb) => {
        authChangeCallback = cb
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        }
      }),
      signOut: vi.fn(async () => {
        authChangeCallback?.('SIGNED_OUT', null)
        return {}
      }),
    },
    from: () => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        then: (resolve) => resolve({ data: [], error: null }),
        insert: mockInsert,
        update: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        delete: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      }
      return chain
    },
  },
}))

describe('App Navigation, AuthProvider & Form Submission', () => {
  it('renders LandingPage at root route', async () => {
    render(<App />)
    await waitFor(() => {
      expect(
        screen.getByText('Simple Fleet & Daily Operations Tracking for Matatus')
      ).toBeInTheDocument()
    })
  })

  it('renders authenticated layout with user email and navigates across tabs', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('manager@nganyaops.co.ke')).toBeInTheDocument()
      expect(screen.getByText('Operational Overview')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('link', { name: 'Fleet' }))
    await waitFor(() => {
      expect(screen.getByText('Add Matatu to Fleet')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('link', { name: 'Crew' }))
    await waitFor(() => {
      expect(screen.getByText('Register Crew Member')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('link', { name: 'Trips' }))
    await waitFor(() => {
      expect(screen.getByText('Log Daily Trip, Revenue & Expenses')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('link', { name: 'Maintenance' }))
    await waitFor(() => {
      expect(screen.getByText('Log Garage / Maintenance Expense')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Log Out' }))
    await waitFor(() => {
      expect(screen.getByText('You have been logged out.')).toBeInTheDocument()
    })
  })

  it('extracts and clears OAuth error_description from URL on /login', async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } })
    window.history.replaceState({}, '', '/login?error=access_denied&error_description=Google+cancelled')

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login?error=access_denied&error_description=Google+cancelled']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Google cancelled')).toBeInTheDocument()
    })
    expect(window.location.search).toBe('')
  })

  it('submits a new vehicle form in FleetList', async () => {
    render(<FleetList />)

    fireEvent.change(screen.getByPlaceholderText('Plate (e.g. KDG 412X)'), {
      target: { value: 'kdh 777y' },
    })
    fireEvent.change(screen.getByPlaceholderText('Nickname (Optional)'), {
      target: { value: 'Spartan' },
    })
    fireEvent.change(screen.getByPlaceholderText('Route (e.g. CBD - Kikuyu)'), {
      target: { value: 'CBD - Embakasi' },
    })
    fireEvent.change(screen.getByPlaceholderText('Daily Target (KES)'), {
      target: { value: '14000' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save Vehicle' }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([
        {
          plate_number: 'KDH 777Y',
          nickname: 'Spartan', manufacturer: '-', seat_count: 14,
          route: 'CBD - Embakasi',
          daily_target: 14000,
          status: 'Active',
        },
      ])
    })
  })
})
