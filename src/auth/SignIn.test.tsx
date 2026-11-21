import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  signInWithPassword: vi.fn(),
}))
vi.mock('../lib/supabase', () => ({ supabase: { auth } }))

const { SignIn } = await import('./SignIn')

function fill(email: string, password = '') {
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: email } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } })
}

beforeEach(() => {
  auth.signInWithOtp.mockReset()
  auth.signInWithPassword.mockReset()
})

describe('SignIn', () => {
  it('asks for a real email before doing anything', () => {
    render(<SignIn />)
    fill('not-an-email')
    fireEvent.click(screen.getByRole('button', { name: /email me a sign-in link/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/enter your email address/i)
    expect(auth.signInWithOtp).not.toHaveBeenCalled()
  })

  it('without a password, emails a link', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null })
    render(<SignIn />)
    fill('name@example.com')
    fireEvent.click(screen.getByRole('button', { name: /email me a sign-in link/i }))
    expect(await screen.findByText(/click the link in the email/i)).toBeInTheDocument()
    expect(auth.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'name@example.com', options: expect.objectContaining({ shouldCreateUser: true }) }),
    )
    expect(auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('with a password, signs in directly (no email needed)', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null })
    render(<SignIn />)
    fill('name@example.com', 'correct horse battery')
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    await waitFor(() =>
      expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'name@example.com', password: 'correct horse battery' }),
    )
    expect(auth.signInWithOtp).not.toHaveBeenCalled()
  })

  it('explains a wrong password plainly', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials', message: 'Invalid login credentials' } })
    render(<SignIn />)
    fill('name@example.com', 'wrong password')
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/don't match/i)
  })

  it('shows a visible message when the email limit is hit', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: { status: 429, message: 'rate limit' } })
    render(<SignIn />)
    fill('name@example.com')
    fireEvent.click(screen.getByRole('button', { name: /email me a sign-in link/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/wait a few minutes/i)
  })

  it('offers the password and lets the browser fill it', () => {
    render(<SignIn />)
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('autocomplete', 'current-password')
    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('autocomplete', 'username')
  })
})
