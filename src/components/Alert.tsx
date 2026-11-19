import type { ReactNode } from 'react'

/** The one visible way the app says something went wrong. */
export function Alert({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="alert" role="alert">
      <span className="alert-mark" aria-hidden="true">
        !
      </span>
      <span className="alert-text">{children}</span>
      {action}
    </div>
  )
}
