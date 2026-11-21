import { useState } from 'react'
import { SetPassword } from '../auth/SetPassword'
import { Alert } from '../components/Alert'
import { ExportButton } from '../components/ExportButton'
import { supabase } from '../lib/supabase'

/** The rarely used things, kept off Today and Later so they don't sit under your tasks. */
export function SettingsScreen({ email }: { email: string }) {
  const [signOutError, setSignOutError] = useState<string | null>(null)

  async function signOut() {
    setSignOutError(null)
    const { error } = await supabase.auth.signOut()
    if (error) setSignOutError("Couldn't sign out. Check your connection and try again.")
  }

  return (
    <section className="settings" aria-label="Settings">
      <ul className="task-list">
        <li className="task-row">
          <ExportButton />
        </li>
        <li className="task-row">
          <SetPassword email={email} />
        </li>
        <li className="task-row">
          <button className="link-button label" type="button" onClick={() => void signOut()}>
            Sign out of this device
          </button>
          {signOutError ? <Alert>{signOutError}</Alert> : null}
        </li>
      </ul>
    </section>
  )
}
