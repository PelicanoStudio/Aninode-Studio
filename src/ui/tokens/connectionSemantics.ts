/**
 * CONNECTION SEMANTICS TOKENS
 * 
 * Defines the semantic meaning and visual representation
 * for each connection type. This is the single source of truth
 * for cable styling and auto-suggestion logic.
 */

import { ConnectionType } from '@/ui/types'

// === SEMANTIC DEFINITIONS ===

export interface ConnectionSemantic {
  type: ConnectionType
  label: string
  description: string
  visual: string
  useCase: string
  dataFlow: 'single' | 'batch' | 'stream' | 'trigger' | 'bind'
}

export const connectionSemantics: Record<ConnectionType, ConnectionSemantic> = {
  [ConnectionType.BEZIER]: {
    type: ConnectionType.BEZIER,
    label: 'Standard',
    description: 'Smooth curve for single parameter flow',
    visual: 'Smooth curve',
    useCase: 'Standard value connections',
    dataFlow: 'single',
  },
  [ConnectionType.DOUBLE]: {
    type: ConnectionType.DOUBLE,
    label: 'Pipe',
    description: 'Thick pipe for list/array data',
    visual: 'Double stroke',
    useCase: 'Batch data, object lists',
    dataFlow: 'batch',
  },
  [ConnectionType.DOTTED]: {
    type: ConnectionType.DOTTED,
    label: 'Stream',
    description: 'Animated dashes for live/realtime data',
    visual: 'Dashed animated',
    useCase: 'LFO signals, real-time feeds',
    dataFlow: 'stream',
  },
  [ConnectionType.STEP]: {
    type: ConnectionType.STEP,
    label: 'Logic',
    description: 'Orthogonal path for boolean/logic flow',
    visual: 'Right-angle path',
    useCase: 'If/else triggers, state changes',
    dataFlow: 'trigger',
  },
  [ConnectionType.STRAIGHT]: {
    type: ConnectionType.STRAIGHT,
    label: 'Telepathic',
    description: 'Remote property binding (wireless)',
    visual: 'Dashed arrow',
    useCase: 'Broadcast/receive property binding',
    dataFlow: 'bind',
  },
}

// === VISUAL STYLING ===

export const connectionStyles = {
  [ConnectionType.BEZIER]: {
    strokeWidth: 2,
    dashArray: 'none',
    animated: false,
    lineCap: 'round' as const,
    hasArrow: false,
    doubleStroke: false,
  },
  [ConnectionType.DOUBLE]: {
    strokeWidth: 6,
    innerStrokeWidth: 3,
    dashArray: 'none',
    animated: false,
    lineCap: 'round' as const,
    hasArrow: false,
    doubleStroke: true,
  },
  [ConnectionType.DOTTED]: {
    strokeWidth: 2,
    dashArray: '8,4',
    animated: true,
    animationDuration: 0.5,    // seconds per cycle
    lineCap: 'round' as const,
    hasArrow: false,
    doubleStroke: false,
  },
  [ConnectionType.STEP]: {
    strokeWidth: 2,
    dashArray: 'none',
    animated: false,
    lineCap: 'square' as const,
    hasArrow: false,
    doubleStroke: false,
    cornerRadius: 4,
  },
  [ConnectionType.STRAIGHT]: {
    strokeWidth: 1.5,
    dashArray: '6,6',
    animated: true,
    animationDuration: 1,
    lineCap: 'round' as const,
    hasArrow: true,
    arrowSize: 8,
    doubleStroke: false,
  },
}

// === COLORS ===

export const connectionColors = {
  dark: {
    default: '#666666',
    active: '#888888',
    hover: '#AAAAAA',
    selected: '#FF1F1F',
    telepathic: '#00FF88',     // Green for telepathic links
  },
  light: {
    default: '#999999',
    active: '#777777',
    hover: '#555555',
    selected: '#D91919',
    telepathic: '#00AA55',
  },
} as const

// === AUTO-SUGGESTION LOGIC ===

/**
 * Suggest connection type based on source node type
 */
export function suggestConnectionType(
  sourceNodeType: string,
  sourcePortKey: string
): ConnectionType {
  // LFO/Oscillator outputs suggest stream (dotted)
  if (sourceNodeType === 'OSCILLATOR' && sourcePortKey === 'value') {
    return ConnectionType.DOTTED
  }
  
  // Boolean outputs suggest logic (step)
  if (sourceNodeType === 'BOOLEAN') {
    return ConnectionType.STEP
  }
  
  // Picker/Clone outputs (arrays) suggest pipe (double)
  if (sourceNodeType === 'PICKER' || sourceNodeType === 'CLONE') {
    return ConnectionType.DOUBLE
  }
  
  // Default to Bezier
  return ConnectionType.BEZIER
}

/**
 * Get connection color for mode
 */
export function getConnectionColor(
  key: keyof typeof connectionColors.dark,
  isDarkMode: boolean
): string {
  return isDarkMode ? connectionColors.dark[key] : connectionColors.light[key]
}

/**
 * Get style for connection type
 */
export function getConnectionStyle(type: ConnectionType) {
  return connectionStyles[type] || connectionStyles[ConnectionType.BEZIER]
}
