type AuthErrorLike = { status?: number; code?: string; message?: string; name?: string }

export const MIN_PASSWORD_LENGTH = 10

/** Turns a sign-in error into a plain sentence that says what to do next. */
export function friendlyAuthError(error: unknown): string {
  const e = (error ?? {}) as AuthErrorLike
  const text = `${e.code ?? ''} ${e.message ?? ''}`.toLowerCase()

  if (text.includes('invalid_credentials') || text.includes('invalid login credentials')) {
    return "That email and password don't match. Check both, or leave the password empty to get an email link."
  }
  if (text.includes('weak_password') || text.includes('password should')) {
    return `Choose a longer password: at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (text.includes('same_password') || text.includes('different from the old')) {
    return "That's already your password, so nothing changed."
  }
  if (text.includes('reauthentication')) {
    return 'For safety, sign out, sign back in with the email link, then set the password.'
  }
  if (e.status === 429 || text.includes('rate limit')) {
    return 'Too many tries for now. Wait a few minutes, then try again.'
  }
  if (text.includes('expired') || text.includes('invalid') || e.code === 'otp_expired') {
    return "That link didn't work or has expired. Send a new one."
  }
  if (text.includes('signups not allowed') || e.code === 'signup_disabled') {
    return "This email can't sign in here. Check for a typo."
  }
  if (e.name === 'TypeError' || text.includes('fetch') || text.includes('network')) {
    return "Couldn't reach the server. Check your connection and try again."
  }
  return 'Something went wrong. Try again in a moment.'
}

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}
