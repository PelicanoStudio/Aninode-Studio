/**
 * WAVEFORM TOKENS
 * 
 * Visual styling for waveform visualization in LFO/Oscillator nodes.
 * All animation curve visualizations will inherit from this token set.
 */

// Waveform type enumeration (extends base oscillator types)
export type WaveformType = 
  | 'sine' 
  | 'triangle' 
  | 'square' 
  | 'sawtooth' 
  | 'inverted-sawtooth' 
  | 'noise'

// === WAVEFORM COLORS ===

export const waveformColors = {
  dark: {
    wave: '#FF1F1F',           // Main wave color (accent red)
    waveDim: '#FF1F1F80',      // Semi-transparent wave
    grid: '#333333',           // Grid lines
    gridMinMax: '#444444',     // Min/max guide lines (softer)
    background: '#0a0a0a',     // Canvas background
    zero: '#555555',           // Zero line
  },
  light: {
    wave: '#D91919',           // Slightly darker for light mode
    waveDim: '#D9191980',
    grid: '#E0E0E0',
    gridMinMax: '#CCCCCC',
    background: '#FAFAFA',
    zero: '#AAAAAA',
  }
} as const

// === WAVEFORM DIMENSIONS ===

export const waveformLayout = {
  height: 64,                 // Visualizer height in px
  padding: 8,                 // Internal padding
  gridLineCount: 5,           // Number of horizontal grid lines
  strokeWidth: {
    wave: 2,                  // Main wave stroke
    grid: 0.5,                // Grid line stroke
    minMaxGuide: 0.5,         // Min/max guide stroke
    zero: 1,                  // Zero line stroke
  },
  resolution: 100,            // Number of points to sample per wave
} as const

// === WAVEFORM ANIMATION ===

export const waveformAnimation = {
  refreshRate: 60,            // FPS for animation
  scrollSpeed: 0.5,           // Speed of wave scroll (cycles per second visual)
} as const

// === STATIC WAVEFORM ICONS (SVG paths for node display) ===

/**
 * SVG path data for static waveform icons (viewBox: 0 0 48 32)
 * Used in node body when showing static preview instead of animation
 */
export const waveformIconPaths: Record<WaveformType, string> = {
  'sine': 'M4,16 C12,4 20,4 24,16 S36,28 44,16',
  'triangle': 'M4,24 L16,8 L28,24 L40,8 L44,12',
  'square': 'M4,24 L4,8 L16,8 L16,24 L28,24 L28,8 L40,8 L40,24 L44,24',
  'sawtooth': 'M4,24 L20,8 L20,24 L36,8 L36,24 L44,16',
  'inverted-sawtooth': 'M4,8 L20,24 L20,8 L36,24 L36,8 L44,16',
  'noise': 'M4,16 L8,12 L12,20 L16,8 L20,24 L24,14 L28,18 L32,10 L36,22 L40,14 L44,16',
}

/**
 * Static waveform display layout (for node body two-box design)
 */
export const staticWaveformLayout = {
  iconBoxSize: 48,           // Icon box width/height in px
  valueBoxMinWidth: 52,      // Frequency value box minimum width
  boxGap: 8,                 // Gap between boxes
  borderRadius: 8,           // Corner radius
  padding: 8,                // Internal padding
  fontSize: {
    value: 14,               // Frequency value font size
    label: 10,               // Small label font size
  },
} as const

// === HELPER FUNCTIONS ===

/**
 * Get waveform color by key for current mode
 */
export function getWaveformColor(
  key: keyof typeof waveformColors.dark, 
  isDarkMode: boolean
): string {
  return isDarkMode ? waveformColors.dark[key] : waveformColors.light[key]
}

/**
 * Calculate Y position for a waveform at time t
 */
export function calculateWaveformY(
  waveform: WaveformType,
  t: number,
  min: number,
  max: number,
  amplitude: number,
  phase: number
): number {
  const tWithPhase = t + phase
  let normalized = 0 // 0 to 1 range

  switch (waveform) {
    case 'sine':
      normalized = (Math.sin(tWithPhase * Math.PI * 2) + 1) / 2
      break
    case 'triangle':
      normalized = Math.abs((tWithPhase % 1) * 2 - 1)
      break
    case 'square':
      normalized = Math.sin(tWithPhase * Math.PI * 2) > 0 ? 1 : 0
      break
    case 'sawtooth':
      normalized = tWithPhase % 1
      break
    case 'inverted-sawtooth':
      normalized = 1 - (tWithPhase % 1)
      break
    case 'noise':
      // Seeded pseudo-random based on t for consistency
      normalized = Math.abs(Math.sin(tWithPhase * 12.9898) * 43758.5453 % 1)
      break
  }

  // Apply amplitude
  const scaled = normalized * amplitude

  // Map to min/max range
  return min + scaled * (max - min)
}

/**
 * Get display name for waveform type
 */
export function getWaveformLabel(waveform: WaveformType): string {
  const labels: Record<WaveformType, string> = {
    'sine': 'Sine (Smooth)',
    'triangle': 'Triangle',
    'square': 'Square (On/Off)',
    'sawtooth': 'Sawtooth',
    'inverted-sawtooth': 'Inv. Sawtooth',
    'noise': 'Noise (Random)',
  }
  return labels[waveform] || waveform
}
