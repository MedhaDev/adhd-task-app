import { useState, type FormEvent } from 'react'
import { Alert } from '../components/Alert'
import { supabase } from '../lib/supabase'
import { friendlyAuthError, MIN_PASSWORD_LENGTH } from './messages'

/**
 * Set (or change) a password while signed in, so the iPhone Home Screen app
 * can sign in once without an email link.
 */
export function SetPassword({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Choose a longer password: at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== again) {
      setError("The two passwords don't match.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(friendlyAuthError(updateError))
      } else {
        setSaved(true)
        setOpen(false)
        setPassword('')
        setAgain('')
      }
    } catch (caught) {
      setError(friendlyAuthError(caught))
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <div className="set-password">
        <button
          type="button"
          className="link-button label"
          onClick={() => {
            setOpen(true)
            setSaved(false)
          }}
        >
          Set a password for the iPhone app
        </button>
        {saved ? (
          <span className="muted label" role="status">
            Password saved
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <form className="set-password-form" onSubmit={submit} noValidate>
      <span className="label">New password · use it to sign in on the iPhone app</span>
      {/* A hidden username helps iPhone Keychain save the password with the right email. */}
      <input type="email" name="email" autoComplete="username" hidden readOnly value={email} />
      <label className="field-label">
        <span className="sr-only">New password</span>
        <input
          className="field"
          type="password"
          name="new-password"
          autoComplete="new-password"
          placeholder="New password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (error) setError(null)
          }}
        />
      </label>
      <label className="field-label">
        <span className="sr-only">Type it again</span>
        <input
          className="field"
          type="password"
          name="new-password-again"
          autoComplete="new-password"
          placeholder="Type it again"
          value={again}
          onChange={(e) => {
            setAgain(e.target.value)
            if (error) setError(null)
          }}
        />
      </label>
      <p className="muted-note">At least {MIN_PASSWORD_LENGTH} characters. Use one you don't use anywhere else.</p>
      {error ? <Alert>{error}</Alert> : null}
      <div className="actions">
        <button className="button" type="submit" aria-busy={busy} disabled={busy}>
          {busy ? 'Saving…' : 'Save password'}
        </button>
        <button className="link-button" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  )
}
