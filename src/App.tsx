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
          <nav className="topbar-nav">
            <a className="nav-link label" href={routeHref(screen === 'today' ? 'later' : 'today')}>
              {screen === 'today' ? 'Later →' : '← Today'}
            </a>
            {screen !== 'settings' ? (
              <a className="nav-link label nav-more" href={routeHref('settings')} aria-label="Settings">
                ···
              </a>
            ) : null}
          </nav>
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
    </main>
  )
}

export default App
