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

const { default: App } = await import('./App')

beforeEach(() => {
  auth.getSession.mockReset()
})

describe('App', () => {
  it('shows the sign-in form when signed out', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } })
    render(<App />)
    expect(await screen.findByText(/where should the sign.in email go/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/today/i)
  })

  it('shows Today when signed in, with no task count', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    render(<App />)
    expect(await screen.findByText(/your 3 tasks for today will land here/i)).toBeInTheDocument()
    expect(screen.queryByText(/\d+ tasks? (in|left|total)/i)).not.toBeInTheDocument()
  })

  it('has a calm/loud switch', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } })
    render(<App />)
    expect(await screen.findByRole('button', { name: /vibe: loud/i })).toBeInTheDocument()
  })
})
