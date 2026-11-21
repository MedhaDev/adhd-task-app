import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ updateUser: vi.fn() }))
vi.mock('../lib/supabase', () => ({ supabase: { auth } }))

const { SetPassword } = await import('./SetPassword')

function open() {
  render(<SetPassword email="name@example.com" />)
  fireEvent.click(screen.getByRole('button', { name: /change password/i }))
}

function type(password: string, again = password) {
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: password } })
  fireEvent.change(screen.getByLabelText('Type it again'), { target: { value: again } })
  fireEvent.click(screen.getByRole('button', { name: /save password/i }))
}

beforeEach(() => {
  auth.updateUser.mockReset()
})

describe('SetPassword', () => {
  it('saves a password and confirms it', async () => {
    auth.updateUser.mockResolvedValue({ error: null })
    open()
    type('a long enough password')
    await waitFor(() => expect(auth.updateUser).toHaveBeenCalledWith({ password: 'a long enough password' }))
    expect(await screen.findByText('Password saved')).toBeInTheDocument()
  })

  it('refuses a short password before sending anything', () => {
    open()
    type('short')
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 10 characters/i)
    expect(auth.updateUser).not.toHaveBeenCalled()
  })

  it('refuses when the two passwords differ', () => {
    open()
    type('a long enough password', 'a different password')
    expect(screen.getByRole('alert')).toHaveTextContent(/don't match/i)
    expect(auth.updateUser).not.toHaveBeenCalled()
  })

  it('says so visibly if saving fails', async () => {
    auth.updateUser.mockResolvedValue({ error: { code: 'reauthentication_needed', message: 'reauthentication needed' } })
    open()
    type('a long enough password')
    expect(await screen.findByRole('alert')).toHaveTextContent(/sign back in/i)
  })

  it('lets the iPhone Keychain suggest and save a strong password', () => {
    open()
    expect(screen.getByLabelText('New password')).toHaveAttribute('autocomplete', 'new-password')
  })
})
