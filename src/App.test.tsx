import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('shows the Today heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument()
  })

  it('shows a calm message when there are no tasks yet', () => {
    render(<App />)
    expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument()
  })
})
