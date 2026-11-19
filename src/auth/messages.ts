type AuthErrorLike = { status?: number; code?: string; message?: string; name?: string }

/** Turns a sign-in error into a plain sentence that says what to do next. */
export function friendlyAuthError(error: unknown): string {
  const e = (error ?? {}) as AuthErrorLike
  const text = `${e.code ?? ''} ${e.message ?? ''}`.toLowerCase()

  if (e.status === 429 || text.includes('rate limit')) {
    return 'Too many sign-in emails for now. Wait a few minutes, then try again.'
  }
  if (text.includes('expired') || text.includes('invalid') || e.code === 'otp_expired') {
    return "That code didn't work or has expired. Use the newest email, or send a new one."
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

/** Supabase sends 6-digit codes by default; allow up to 10 in case that changes. */
export function looksLikeCode(value: string): boolean {
  return /^\d{6,10}$/.test(value.trim())
}
