import { useNodeRegistration } from '@core/useNodeRegistration'

export type LFONodeProps = {
  id: string
  name?: string
  waveform: 'sine' | 'triangle' | 'square' | 'sawtooth' | 'noise'
  frequency: number
  phase: number
  min: number
  max: number
  enabled: boolean
  syncToTimeline: boolean
}

export function LFONode(props: LFONodeProps) {
  const { id } = props

  // Passive Registration Only
  // The Signals System (Phase 3) will iterate these nodes and compute values
  useNodeRegistration(id, 'LFONode', props)

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
