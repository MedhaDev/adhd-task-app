import { useState } from 'react'
import { SignIn } from './auth/SignIn'
import { useSession } from './auth/useSession'
import { VibeToggle } from './components/VibeToggle'
import { supabase } from './lib/supabase'
import { useVibe } from './theme/vibe'

function todayLabel(now: Date): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(now)
    .replace(',', '')
}

function App() {
  const session = useSession()
  const [vibe, toggleVibe] = useVibe()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const now = new Date()

  async function signOut() {
    setSignOutError(null)
    const { error } = await supabase.auth.signOut()
    if (error) setSignOutError("Couldn't sign out. Check your connection and try again.")
  }

  return (
    <main className="page">
      <div className="topbar">
        <span className="label">{todayLabel(now)}</span>
        <VibeToggle vibe={vibe} onToggle={toggleVibe} />
      </div>

      <h1 className="wordmark">
        <span className="wordmark-script">Today</span>
        <span className="wordmark-number">no.{now.getDate()}</span>
      </h1>

      {session === undefined ? (
        <p className="label" aria-live="polite">
          Loading…
        </p>
      ) : session === null ? (
        <SignIn />
      ) : (
        <>
          <p className="empty-state">Your 3 tasks for today will land here.</p>
          {signOutError ? (
            <div className="alert" role="alert">
              <span className="alert-mark" aria-hidden="true">
                !
              </span>
              <span>{signOutError}</span>
            </div>
          ) : null}
          <button className="link-button label" type="button" onClick={signOut}>
            Sign out of this device
          </button>
        </>
      )}
    </main>
  )
}

export default App
