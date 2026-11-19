import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Auth from '../components/Auth'
import { supabase } from '../supabaseClient'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}))

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}))

describe('Auth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign-in form and toggles to registration mode', () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    )

    expect(screen.getByText('Sign In to NganyaOps')).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    expect(screen.getByText('Create NganyaOps Account')).toBeInTheDocument()
  })

  it('shows error message when login fails', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      error: { message: 'Invalid login credentials' },
    })

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@nganyaops.co.ke' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })
  })

  it('triggers Google OAuth when clicking Continue with Google', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValueOnce({ error: null })

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('Continue with Google'))

    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      )
    })
  })
})
