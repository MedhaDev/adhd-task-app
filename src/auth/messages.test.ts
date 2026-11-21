import { describe, expect, it } from 'vitest'
import { friendlyAuthError, looksLikeEmail } from './messages'

describe('friendlyAuthError', () => {
  it('explains the rate limit', () => {
    expect(friendlyAuthError({ status: 429, message: 'email rate limit exceeded' })).toMatch(/wait a few minutes/i)
  })

  it('explains a wrong email or password (not as an expired link)', () => {
    expect(friendlyAuthError({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toMatch(
      /don't match/i,
    )
  })

  it('explains a too-short password', () => {
    expect(friendlyAuthError({ code: 'weak_password', message: 'Password should be at least 6 characters' })).toMatch(
      /at least 10 characters/i,
    )
  })

  it('explains an expired link', () => {
    expect(friendlyAuthError({ code: 'otp_expired', message: 'Token has expired or is invalid' })).toMatch(/expired/i)
  })

  it('explains when a fresh sign-in is needed before changing the password', () => {
    expect(friendlyAuthError({ code: 'reauthentication_needed', message: 'reauthentication needed' })).toMatch(
      /sign back in/i,
    )
  })

  it('explains a network failure', () => {
    expect(friendlyAuthError(new TypeError('Failed to fetch'))).toMatch(/connection/i)
  })

  it('never shows a raw error', () => {
    expect(friendlyAuthError({ message: 'weird internal thing' })).toBe('Something went wrong. Try again in a moment.')
  })
})

describe('looksLikeEmail', () => {
  it('accepts a normal email and rejects junk', () => {
    expect(looksLikeEmail(' name@example.com ')).toBe(true)
    expect(looksLikeEmail('name@')).toBe(false)
  })
})
