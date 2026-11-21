import { SignIn } from './auth/SignIn'
import { useSession } from './auth/useSession'
import { LaterScreen } from './later/LaterScreen'
import { routeHref, useRoute, type Route } from './lib/useRoute'
import { SettingsScreen } from './settings/SettingsScreen'
import { TodayScreen } from './today/TodayScreen'

function todayLabel(now: Date): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(now)
    .replace(',', '')
}

const TITLES: Record<Route, string> = { today: 'Today', later: 'Later', settings: 'Settings' }

function App() {
  const session = useSession()
  const route = useRoute()
  const signedIn = Boolean(session)
  const screen: Route = signedIn ? route : 'today'

  return (
    <main className="page">
      <div className="topbar">
        <span className="label">{todayLabel(new Date())}</span>
        {signedIn ? (
          <a className="nav-link label" href={routeHref(screen === 'today' ? 'later' : 'today')}>
            {screen === 'today' ? 'Later →' : '← Today'}
          </a>
        ) : null}
      </div>

      <h1 className="wordmark">{TITLES[screen]}</h1>

      {session === undefined ? (
        <p className="label" aria-live="polite">
          Loading…
        </p>
      ) : session === null ? (
        <SignIn />
      ) : screen === 'later' ? (
        <LaterScreen />
      ) : screen === 'settings' ? (
        <SettingsScreen email={session.user.email ?? ''} />
      ) : (
        <TodayScreen />
      )}

      {/* Rarely used, so it sits quietly at the very bottom, after everything else. */}
      {signedIn && screen !== 'settings' ? (
        <footer className="page-end">
          <a className="nav-link label nav-more" href={routeHref('settings')} aria-label="Settings">
            ···
          </a>
        </footer>
      ) : null}
    </main>
  )
}

export default App
