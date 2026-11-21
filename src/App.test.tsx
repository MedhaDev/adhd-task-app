import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  signInWithOtp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
}))
vi.mock('./lib/supabase', () => ({ supabase: { auth } }))
vi.mock('./today/TodayScreen', () => ({ TodayScreen: () => <p>today screen</p> }))

const { default: App } = await import('./App')

const signedIn = { data: { session: { user: { id: 'u1', email: 'name@example.com' } } } }

beforeEach(() => {
  auth.getSession.mockReset()
  window.location.hash = ''
})

afterEach(() => {
  window.location.hash = ''
})

describe('App', () => {
  it('shows the sign-in form when signed out', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } })
    render(<App />)
    expect(await screen.findByText(/sign in to today/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/today/i)
    expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument()
  })

  it('shows Today with links to Later and Settings when signed in', async () => {
    auth.getSession.mockResolvedValue(signedIn)
    render(<App />)
    expect(await screen.findByText('today screen')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /later/i })).toHaveAttribute('href', '#/later')
    expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute('href', '#/settings')
  })

  it('keeps the rarely used options off Today', async () => {
    auth.getSession.mockResolvedValue(signedIn)
    render(<App />)
    await screen.findByText('today screen')
    expect(screen.queryByText(/download my data/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/set a password/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/sign out/i)).not.toBeInTheDocument()
  })

  it('puts them on the Settings page instead', async () => {
    auth.getSession.mockResolvedValue(signedIn)
    render(<App />)
    await screen.findByText('today screen')
    await act(async () => {
      window.location.hash = '#/settings'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/settings/i)
    expect(screen.getByRole('button', { name: /download my data/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /set a password/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out of this device/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /today/i })).toHaveAttribute('href', '#/')
  })
})
