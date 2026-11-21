import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('./lib/supabase', () => ({ supabase: { auth } }))
vi.mock('./today/TodayScreen', () => ({ TodayScreen: () => <p>today screen</p> }))

const { default: App } = await import('./App')

beforeEach(() => {
  auth.getSession.mockReset()
})

describe('App', () => {
  it('shows the sign-in form when signed out', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } })
    render(<App />)
    expect(await screen.findByText(/sign in to today/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/today/i)
  })

  it('shows Today and a link to Later when signed in', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    render(<App />)
    expect(await screen.findByText('today screen')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /later/i })).toHaveAttribute('href', '#/later')
  })
})
