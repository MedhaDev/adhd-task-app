import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
}))
vi.mock('../lib/supabase', () => ({ supabase: { auth } }))

const { SignIn } = await import('./SignIn')

function typeEmail(value: string) {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: /email me a sign-in link/i }))
}

beforeEach(() => {
  auth.signInWithOtp.mockReset()
  auth.verifyOtp.mockReset()
})

describe('SignIn', () => {
  it('asks for a real email before sending anything', () => {
    render(<SignIn />)
    typeEmail('not-an-email')
    expect(screen.getByRole('alert')).toHaveTextContent(/enter your email address/i)
    expect(auth.signInWithOtp).not.toHaveBeenCalled()
  })

  it('sends the email, then asks for the code', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null })
    render(<SignIn />)
    typeEmail('name@example.com')

    await screen.findByText(/click the link, or type the code/i)
    expect(auth.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'name@example.com',
        options: expect.objectContaining({ shouldCreateUser: true }),
      }),
    )
  })

  it('shows a visible message when sending fails', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: { status: 429, message: 'rate limit' } })
    render(<SignIn />)
    typeEmail('name@example.com')

    expect(await screen.findByRole('alert')).toHaveTextContent(/wait a few minutes/i)
  })

  it('verifies the code with the same email', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null })
    auth.verifyOtp.mockResolvedValue({ error: null })
    render(<SignIn />)
    typeEmail('name@example.com')
    await screen.findByText(/click the link, or type the code/i)

    fireEvent.change(screen.getByLabelText(/code/i), { target: { value: '12 34 56' } })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() =>
      expect(auth.verifyOtp).toHaveBeenCalledWith({
        email: 'name@example.com',
        token: '123456',
        type: 'email',
      }),
    )
  })

  it('shows a visible message for a wrong code', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null })
    auth.verifyOtp.mockResolvedValue({ error: { code: 'otp_expired', message: 'expired' } })
    render(<SignIn />)
    typeEmail('name@example.com')
    await screen.findByText(/click the link, or type the code/i)

    fireEvent.change(screen.getByLabelText(/code/i), { target: { value: '000000' } })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/newest email/i)
  })
})
