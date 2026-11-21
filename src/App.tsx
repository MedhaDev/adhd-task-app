import { useState } from 'react'
import { SetPassword } from './auth/SetPassword'
import { SignIn } from './auth/SignIn'
import { useSession } from './auth/useSession'
import { Alert } from './components/Alert'
import { ExportButton } from './components/ExportButton'
import { LaterScreen } from './later/LaterScreen'
import { supabase } from './lib/supabase'
import { routeHref, useRoute } from './lib/useRoute'
import { TodayScreen } from './today/TodayScreen'

function todayLabel(now: Date): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(now)
    .replace(',', '')
}

function App() {
  const session = useSession()
  const route = useRoute()
  const [signOutError, setSignOutError] = useState<string | null>(null)
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
        <span className="label">{todayLabel(new Date())}</span>
        {signedIn ? (
          <a className="nav-link label" href={routeHref(onLater ? 'today' : 'later')}>
            {onLater ? '← Today' : 'Later →'}
          </a>
        ) : null}
      </div>

      <h1 className="wordmark">{onLater ? 'Later' : 'Today'}</h1>

      {session === undefined ? (
        <p className="label" aria-live="polite">
          Loading…
        </p>
      ) : session === null ? (
        <SignIn />
      ) : onLater ? (
        <LaterScreen />
      ) : (
        <TodayScreen />
      )}

      {signedIn ? (
        <footer className="footer">
          {signOutError ? <Alert>{signOutError}</Alert> : null}
          <ExportButton />
          <SetPassword email={session?.user.email ?? ''} />
          <button className="link-button label" type="button" onClick={signOut}>
            Sign out of this device
          </button>
        </footer>
      ) : null}
    </main>
  )
}

export default App
