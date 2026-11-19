import { describe, expect, it } from 'vitest'
import { makeNoiseSamples } from './noise'

function seeded(seed = 42) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32
    return s / 2 ** 32
  }
}

function averageJump(samples: Float32Array): number {
  let total = 0
  for (let i = 1; i < samples.length; i++) total += Math.abs(samples[i] - samples[i - 1])
  return total / (samples.length - 1)
}

describe('makeNoiseSamples', () => {
  it.each(['brown', 'white'] as const)('%s noise stays within the safe range', (kind) => {
    const samples = makeNoiseSamples(kind, 44_100, seeded())
    expect(Math.max(...samples)).toBeLessThanOrEqual(1)
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(-1)
  })

  it('brown noise is much smoother (deeper) than white noise', () => {
    const brown = averageJump(makeNoiseSamples('brown', 44_100, seeded()))
    const white = averageJump(makeNoiseSamples('white', 44_100, seeded()))
    expect(brown).toBeLessThan(white / 5)
  })
})
