import { useState } from 'react'
import { CSV_COLUMNS, eventsToRows, exportFileName, fetchAllEvents, toCsv } from '../data/exportCsv'
import { Alert } from './Alert'

/** Downloads the whole events log as a CSV for the self-experiment. */
export function ExportButton() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function download() {
    setBusy(true)
    setError(null)
    setDone(false)
    try {
      const events = await fetchAllEvents()
      const csv = toCsv(CSV_COLUMNS, eventsToRows(events))
      // A byte-order mark so Excel reads accents and symbols correctly.
      const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = exportFileName()
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setDone(true)
    } catch {
      setError("Couldn't download your data. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="export">
      <button type="button" className="link-button label" onClick={() => void download()} aria-busy={busy} disabled={busy}>
        {busy ? 'Preparing…' : 'Download my data (CSV)'}
      </button>
      {done ? (
        <span className="muted label" role="status">
          Downloaded
        </span>
      ) : null}
      {error ? <Alert>{error}</Alert> : null}
    </div>
  )
}
