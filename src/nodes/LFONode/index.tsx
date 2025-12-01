import { useEffect, useRef } from 'react'
import { aninodeStore } from '@core/store'
import { useNodeRegistration } from '@core/useNodeRegistration'

export type LFONodeProps = {
  id: string
  name?: string

  // Waveform
  waveform: 'sine' | 'triangle' | 'square' | 'sawtooth' | 'noise'

  // Timing
  frequency: number // Hz (cycles per second)
  phase: number // 0-360 degrees offset

  // Output range
  min: number // minimum output value
  max: number // maximum output value

  // Controls
  enabled: boolean
  syncToTimeline: boolean // sync to global timeline
}

// Seeded random for reproducible noise
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

// Smooth interpolation (ease in-out)
const smoothstep = (t: number): number => t * t * (3 - 2 * t)

// Waveform functions (input: 0-1 normalized time, output: 0-1)
const waveforms = {
  sine: (t: number) => (Math.sin(t * Math.PI * 2) + 1) / 2,
  triangle: (t: number) => {
    const period = t % 1
    return period < 0.5 ? period * 2 : 2 - period * 2
  },
  square: (t: number) => (t % 1 < 0.5 ? 1 : 0),
  sawtooth: (t: number) => t % 1,
  // Noise that respects frequency: interpolates between random values per cycle
  noise: (t: number) => {
    const cycleIndex = Math.floor(t)
    const cycleProgress = t - cycleIndex
    // Get two consecutive random values based on cycle index
    const value1 = seededRandom(cycleIndex)
    const value2 = seededRandom(cycleIndex + 1)
    // Smooth interpolation between them
    return value1 + (value2 - value1) * smoothstep(cycleProgress)
  },
}

export function LFONode({
  id,
  name = 'LFO',
  waveform = 'sine',
  frequency = 1,
  phase = 0,
  min = 0,
  max = 1,
  enabled = true,
  syncToTimeline = false,
}: LFONodeProps) {
  // Reconstruct props for registration
  const baseProps = {
    id,
    name,
    waveform,
    frequency,
    phase,
    min,
    max,
    enabled,
    syncToTimeline,
  }

  // Register node
  useNodeRegistration(id, 'LFONode' as any, baseProps)

  // Refs for animation loop
  const startTimeRef = useRef<number>(0)
  const lastPublishedRef = useRef<number>(0)
  const rafIdRef = useRef<number>()

  // Main LFO logic
  useEffect(() => {
    if (!id || !enabled) {
      // Publish 0 when disabled
      if (aninodeStore.nodes[id]) {
        aninodeStore.nodes[id].outputs.value = min
        aninodeStore.nodes[id].outputs.normalized = 0
      }
      return
    }

    startTimeRef.current = performance.now()

    const update = () => {
      const now = performance.now()
      const elapsed = (now - startTimeRef.current) / 1000 // seconds

      // Calculate time with phase offset
      const phaseOffset = phase / 360
      const t = elapsed * frequency + phaseOffset

      // Get waveform value (0-1)
      const waveformFn = waveforms[waveform] || waveforms.sine
      const normalized = waveformFn(t)

      // Map to output range
      const value = min + normalized * (max - min)
      const rounded = Math.round(value * 1000) / 1000

      // Publish (always for LFO - it's a signal generator)
      if (rounded !== lastPublishedRef.current || waveform === 'noise') {
        lastPublishedRef.current = rounded

        if (aninodeStore.nodes[id]) {
          aninodeStore.nodes[id].outputs.value = rounded
          aninodeStore.nodes[id].outputs.normalized = Math.round(normalized * 1000) / 1000
          aninodeStore.nodes[id].outputs.phase = (t % 1) * 360
        }
      }

      rafIdRef.current = requestAnimationFrame(update)
    }

    rafIdRef.current = requestAnimationFrame(update)

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [id, waveform, frequency, phase, min, max, enabled, syncToTimeline])

  return null
}

// Utility: Create common LFO presets
export const LFO_PRESETS = {
  breathe: { waveform: 'sine', frequency: 0.5, min: 0.8, max: 1 },
  pulse: { waveform: 'sine', frequency: 2, min: 0.5, max: 1 },
  wobble: { waveform: 'sine', frequency: 3, min: -5, max: 5 },
  flicker: { waveform: 'noise', frequency: 10, min: 0.7, max: 1 },
  pendulum: { waveform: 'sine', frequency: 0.8, min: -30, max: 30 },
  heartbeat: { waveform: 'triangle', frequency: 1.2, min: 0.9, max: 1.1 },
} as const
