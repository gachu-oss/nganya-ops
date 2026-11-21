import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Auth from '../components/Auth'
import { supabase } from '../supabaseClient'

const mockAuthState = {
  user: null,
  loading: false,
  authError: '',
  logoutMessage: '',
  clearAuthMessages: vi.fn(),
}

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
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
    mockAuthState.user = null
    mockAuthState.loading = false
    mockAuthState.authError = ''
    mockAuthState.logoutMessage = ''
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

  it('triggers Google OAuth when clicking Continue with Google and shows OAuth error if returned', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValueOnce({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' },
      error: null,
    })

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('Continue with Google'))

    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      })
    })
  })

  it('registers a new account and shows confirmation feedback', async () => {
    supabase.auth.signUp.mockResolvedValueOnce({ error: null })

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'newop@nganyaops.co.ke' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => {
      expect(
        screen.getByText('Registration successful! Check your email or log in now.')
      ).toBeInTheDocument()
    })
  })

  it('shows Google OAuth callback errors, logout feedback, and loading screen', () => {
    mockAuthState.loading = true
    const { rerender } = render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    )
    expect(screen.getByText('Completing sign-in...')).toBeInTheDocument()

    mockAuthState.loading = false
    mockAuthState.authError = 'Access denied'
    rerender(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    )
    expect(screen.getByText('Access denied')).toBeInTheDocument()

    mockAuthState.authError = ''
    mockAuthState.logoutMessage = 'You have been logged out.'
    rerender(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    )
    expect(screen.getByText('You have been logged out.')).toBeInTheDocument()
  })
})
