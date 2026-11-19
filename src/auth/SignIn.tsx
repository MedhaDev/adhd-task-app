import { useState, type FormEvent } from 'react'
import { Alert } from '../components/Alert'
import { supabase } from '../lib/supabase'
import { friendlyAuthError, looksLikeCode, looksLikeEmail } from './messages'

type Step = 'email' | 'code'

function redirectUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString()
}

/**
 * Sign in once per device: we email a link (for laptops) and a code (for the
 * iPhone Home Screen app, where email links open in Safari instead).
 */
export function SignIn() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendEmail(event: FormEvent) {
    event.preventDefault()
    if (!looksLikeEmail(email)) {
      setError('Enter your email address, like name@example.com.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { error: sendError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true, emailRedirectTo: redirectUrl() },
      })
      if (sendError) setError(friendlyAuthError(sendError))
      else setStep('code')
    } catch (caught) {
      setError(friendlyAuthError(caught))
    } finally {
      setBusy(false)
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault()
    if (!looksLikeCode(code)) {
      setError('Enter the code from the email: numbers only.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
      })
      // On success the session listener in App takes over.
      if (verifyError) setError(friendlyAuthError(verifyError))
    } catch (caught) {
      setError(friendlyAuthError(caught))
    } finally {
      setBusy(false)
    }
  }

  function startOver() {
    setStep('email')
    setCode('')
    setError(null)
  }

  const alert = error ? <Alert>{error}</Alert> : null

  if (step === 'email') {
    return (
      <form className="panel" onSubmit={sendEmail} noValidate>
        <span className="label">Sign in · once per device</span>
        {/* Non-breaking hyphen keeps "sign‑in" on one line. */}
        <h2 className="panel-title">Where should the sign‑in email go?</h2>
        <label className="field-label">
          <span className="label">Email</span>
          <input
            className="field"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError(null)
            }}
          />
        </label>
        {alert}
        <button className="button" type="submit" aria-busy={busy} disabled={busy}>
          {busy ? 'Sending…' : 'Email me a sign-in link'}
        </button>
        <p className="muted-note">You'll stay signed in on this device after that.</p>
      </form>
    )
  }

  return (
    <form className="panel" onSubmit={verifyCode} noValidate>
      <span className="label">Check your email</span>
      <h2 className="panel-title">Click the link in the email.</h2>
      <p>
        Sent to <strong>{email.trim()}</strong>. The link signs you in on this device.
      </p>
      <label className="field-label">
        <span className="label">Or type a code, if your email has one</span>
        <input
          className="field field-code"
          type="text"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={10}
          placeholder="123456"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ''))
            if (error) setError(null)
          }}
        />
      </label>
      {alert}
      <button className="button" type="submit" aria-busy={busy} disabled={busy}>
        {busy ? 'Checking…' : 'Sign in'}
      </button>
      <button className="link-button" type="button" onClick={startOver}>
        Use a different email
      </button>
    </form>
  )
}
