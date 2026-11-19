import { useEffect, useState } from 'react'

export type Route = 'today' | 'later'

/** Hash-based routes (#/later) so links work on GitHub Pages without server setup. */
export function readRoute(hash: string = window.location.hash): Route {
  return hash.replace(/^#\/?/, '') === 'later' ? 'later' : 'today'
}

export function routeHref(route: Route): string {
  return route === 'later' ? '#/later' : '#/'
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => readRoute())
  useEffect(() => {
    const onChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
