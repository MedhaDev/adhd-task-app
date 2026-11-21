import { useState, type FormEvent } from 'react'
import { Alert } from '../components/Alert'
import { supabase } from '../lib/supabase'
import { friendlyAuthError, looksLikeEmail } from './messages'

type Step = 'form' | 'sent'

function redirectUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString()
}

/**
 * Sign in once per device, either way:
 * - with a password (needed on the iPhone Home Screen app, where email links
 *   open in Safari instead of the app), or
 * - with an emailed link (easiest on a laptop).
 */
export function SignIn() {
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const usingPassword = password.length > 0

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!looksLikeEmail(email)) {
      setError('Enter your email address, like name@example.com.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      if (usingPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        // On success the session listener in App takes over.
        if (signInError) setError(friendlyAuthError(signInError))
      } else {
        const { error: sendError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: true, emailRedirectTo: redirectUrl() },
        })
        if (sendError) setError(friendlyAuthError(sendError))
        else setStep('sent')
      }
    } catch (caught) {
      setError(friendlyAuthError(caught))
    } finally {
      setBusy(false)
    }
  }

  if (step === 'sent') {
    return (
      <div className="panel">
        <span className="label">Check your email</span>
        <h2 className="panel-title">Click the link in the email.</h2>
        <p>
          Sent to <strong>{email.trim()}</strong>. The link signs you in on this device.
        </p>
        <p className="muted-note">
          On the iPhone Home Screen app, links open in Safari instead. Use your password there.
        </p>
        <button className="link-button" type="button" onClick={() => setStep('form')}>
          Back
        </button>
      </div>
    )
  }

  return (
    <form className="panel" onSubmit={submit} noValidate>
      <span className="label">Sign in · once per device</span>
      <h2 className="panel-title">Sign in to Today</h2>
      <label className="field-label">
        <span className="label">Email</span>
        <input
          className="field"
          type="email"
          name="email"
          autoComplete="username"
          inputMode="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError(null)
          }}
        />
      </label>
      <label className="field-label">
        <span className="label">Password · if you've set one</span>
        <input
          className="field"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (error) setError(null)
          }}
        />
      </label>
      {error ? <Alert>{error}</Alert> : null}
      <button className="button" type="submit" aria-busy={busy} disabled={busy}>
        {busy ? (usingPassword ? 'Signing in…' : 'Sending…') : usingPassword ? 'Sign in' : 'Email me a sign-in link'}
      </button>
      <p className="muted-note">You'll stay signed in on this device after that.</p>
    </form>
  )
}
