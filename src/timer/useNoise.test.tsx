import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const player = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(), close: vi.fn(), setVolume: vi.fn() }))
vi.mock('./noise', () => ({
  noiseSupported: () => true,
  NoisePlayer: class {
    start = player.start
    stop = player.stop
    close = player.close
    setVolume = player.setVolume
  },
}))

const { useNoise } = await import('./useNoise')
const { NoiseControls } = await import('./NoiseControls')

function Harness({ playing }: { playing: boolean }) {
  const noise = useNoise(playing)
  return <NoiseControls noise={noise} />
}

beforeEach(() => {
  Object.values(player).forEach((fn) => fn.mockReset())
  window.localStorage.clear()
})

describe('background noise', () => {
  it('is off until you pick a sound', () => {
    render(<Harness playing />)
    expect(screen.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-pressed', 'true')
    expect(player.start).not.toHaveBeenCalled()
  })

  it('plays brown noise while the timer runs', () => {
    render(<Harness playing />)
    fireEvent.click(screen.getByRole('button', { name: 'Brown' }))
    expect(player.start).toHaveBeenLastCalledWith('brown', 0.4)
    expect(screen.getByRole('slider', { name: /volume/i })).toBeInTheDocument()
  })

  it('goes quiet when time is up', () => {
    const view = render(<Harness playing />)
    fireEvent.click(screen.getByRole('button', { name: 'White' }))
    player.stop.mockClear()
    view.rerender(<Harness playing={false} />)
    expect(player.stop).toHaveBeenCalled()
  })

  it('remembers the choice for the next timer on this device', () => {
    const first = render(<Harness playing />)
    fireEvent.click(screen.getByRole('button', { name: 'Brown' }))
    first.unmount()
    player.start.mockClear()
    render(<Harness playing />)
    expect(player.start).toHaveBeenCalledWith('brown', 0.4)
  })

  it('changes the volume', () => {
    render(<Harness playing />)
    fireEvent.click(screen.getByRole('button', { name: 'Brown' }))
    fireEvent.change(screen.getByRole('slider', { name: /volume/i }), { target: { value: '0.7' } })
    expect(player.start).toHaveBeenLastCalledWith('brown', 0.7)
  })
})
