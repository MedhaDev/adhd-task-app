import { describe, expect, it } from 'vitest'
import { friendlyAuthError, looksLikeCode, looksLikeEmail } from './messages'

describe('friendlyAuthError', () => {
  it('explains the email rate limit', () => {
    expect(friendlyAuthError({ status: 429, message: 'email rate limit exceeded' })).toMatch(
      /wait a few minutes/i,
    )
  })

  it('explains an expired or wrong code', () => {
    expect(friendlyAuthError({ code: 'otp_expired', message: 'Token has expired or is invalid' })).toMatch(
      /newest email/i,
    )
  })

  it('explains a network failure', () => {
    expect(friendlyAuthError(new TypeError('Failed to fetch'))).toMatch(/connection/i)
  })

  it('never shows a raw error', () => {
    expect(friendlyAuthError({ message: 'weird internal thing' })).toBe(
      'Something went wrong. Try again in a moment.',
    )
  })
})

describe('input checks', () => {
  it('accepts a normal email and rejects junk', () => {
    expect(looksLikeEmail(' name@example.com ')).toBe(true)
    expect(looksLikeEmail('name@')).toBe(false)
  })

  it('accepts 6 to 10 digit codes only', () => {
    expect(looksLikeCode('123456')).toBe(true)
    expect(looksLikeCode('12345')).toBe(false)
    expect(looksLikeCode('12a456')).toBe(false)
  })
})
