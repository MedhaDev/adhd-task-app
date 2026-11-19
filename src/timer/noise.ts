/**
 * Background noise made by the browser itself: no sound files to download,
 * nothing fetched from anywhere. Brown noise is deeper and softer; white is hiss.
 */
export type NoiseKind = 'brown' | 'white'

/** Builds a few seconds of noise samples, all between -1 and 1. */
export function makeNoiseSamples(kind: NoiseKind, length: number, random: () => number = Math.random): Float32Array {
  const out = new Float32Array(length)
  let last = 0
  for (let i = 0; i < length; i++) {
    const white = random() * 2 - 1
    if (kind === 'white') {
      out[i] = white * 0.5
    } else {
      // Brown noise: each sample drifts a little from the last, which keeps the low rumble.
      last = (last + 0.02 * white) / 1.02
      out[i] = Math.max(-1, Math.min(1, last * 3.5))
    }
  }
  return out
}

type AudioContextLike = typeof AudioContext

function audioContextClass(): AudioContextLike | null {
  const w = window as unknown as { AudioContext?: AudioContextLike; webkitAudioContext?: AudioContextLike }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

export function noiseSupported(): boolean {
  return audioContextClass() !== null
}

const FADE_SECONDS = 0.6
const LOOP_SECONDS = 4

/** Plays a looping noise with gentle fades in and out. */
export class NoisePlayer {
  private ctx: AudioContext | null = null
  private source: AudioBufferSourceNode | null = null
  private gain: GainNode | null = null
  private kind: NoiseKind | null = null

  start(kind: NoiseKind, volume: number): void {
    const Ctx = audioContextClass()
    if (!Ctx) return
    if (this.source && this.kind === kind) {
      this.setVolume(volume)
      return
    }
    this.stop(true)
    this.ctx ??= new Ctx()
    void this.ctx.resume()
    const ctx = this.ctx
    const buffer = ctx.createBuffer(1, ctx.sampleRate * LOOP_SECONDS, ctx.sampleRate)
    buffer.copyToChannel(makeNoiseSamples(kind, buffer.length), 0)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + FADE_SECONDS)
    source.connect(gain).connect(ctx.destination)
    source.start()

    this.source = source
    this.gain = gain
    this.kind = kind
  }

  setVolume(volume: number): void {
    if (!this.ctx || !this.gain) return
    this.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1)
  }

  /** Fades out (or cuts at once when switching sounds). */
  stop(immediately = false): void {
    if (!this.ctx || !this.source || !this.gain) return
    const { source, gain, ctx } = this
    const fade = immediately ? 0.05 : FADE_SECONDS
    gain.gain.cancelScheduledValues(ctx.currentTime)
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + fade)
    source.stop(ctx.currentTime + fade + 0.05)
    this.source = null
    this.gain = null
    this.kind = null
  }

  close(): void {
    this.stop(true)
    void this.ctx?.close()
    this.ctx = null
  }
}
