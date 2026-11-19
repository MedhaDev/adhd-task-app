import { useState } from 'react'
import { SignIn } from './auth/SignIn'
import { useSession } from './auth/useSession'
import { Alert } from './components/Alert'
import { VibeToggle } from './components/VibeToggle'
import { LaterScreen } from './later/LaterScreen'
import { supabase } from './lib/supabase'
import { routeHref, useRoute } from './lib/useRoute'
import { useVibe } from './theme/vibe'

function todayLabel(now: Date): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(now)
    .replace(',', '')
}

function App() {
  const session = useSession()
  const route = useRoute()
  const [vibe, toggleVibe] = useVibe()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const now = new Date()
  const signedIn = Boolean(session)
  const onLater = signedIn && route === 'later'

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

      <div className="title-row">
        <h1 className="wordmark">
          <span className="wordmark-script">{onLater ? 'Later' : 'Today'}</span>
          {onLater ? null : <span className="wordmark-number">no.{now.getDate()}</span>}
        </h1>
        {signedIn ? (
          <a className="nav-link label" href={routeHref(onLater ? 'today' : 'later')}>
            {onLater ? '← Today' : 'Later →'}
          </a>
        ) : null}
      </div>

      {session === undefined ? (
        <p className="label" aria-live="polite">
          Loading…
        </p>
      ) : session === null ? (
        <SignIn />
      ) : onLater ? (
        <LaterScreen />
      ) : (
        <p className="empty-state">Your 3 tasks for today will land here.</p>
      )}

      {signedIn ? (
        <footer className="footer">
          {signOutError ? <Alert>{signOutError}</Alert> : null}
          <button className="link-button label" type="button" onClick={signOut}>
            Sign out of this device
          </button>
        </footer>
      ) : null}
    </main>
  )
}

export default App
