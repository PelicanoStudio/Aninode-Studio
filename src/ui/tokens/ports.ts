/**
 * PORT TOKENS
 * 
 * Defines default ports per node type, expose button styling,
 * and port-related visual configurations.
 */

import { NodeType } from '@/ui/types'

// === PORT TYPES ===

export type PortDirection = 'input' | 'output'

export interface PortDefinition {
  key: string           // Property key (e.g., 'frequency', 'value')
  label: string         // Display label
  dataType: 'number' | 'boolean' | 'string' | 'array' | 'object'
  isDefault: boolean    // Is this the "obvious" default port?
}

// === DEFAULT PORTS PER NODE TYPE ===

export const defaultPorts: Record<NodeType, {
  inputs: PortDefinition[]
  outputs: PortDefinition[]
}> = {
  [NodeType.OSCILLATOR]: {
    inputs: [
      { key: 'frequency', label: 'Freq', dataType: 'number', isDefault: true },
    ],
    outputs: [
      { key: 'value', label: 'Value', dataType: 'number', isDefault: true },
    ],
  },
  [NodeType.SLIDER]: {
    inputs: [],
    outputs: [
      { key: 'value', label: 'Value', dataType: 'number', isDefault: true },
    ],
  },
  [NodeType.NUMBER]: {
    inputs: [],
    outputs: [
      { key: 'value', label: 'Value', dataType: 'number', isDefault: true },
    ],
  },
  [NodeType.BOOLEAN]: {
    inputs: [],
    outputs: [
      { key: 'enabled', label: 'State', dataType: 'boolean', isDefault: true },
    ],
  },
  [NodeType.TRANSFORM]: {
    inputs: [
      { key: 'value', label: 'In', dataType: 'number', isDefault: true },
    ],
    outputs: [
      { key: 'scale', label: 'Scale', dataType: 'number', isDefault: true },
    ],
  },
  [NodeType.PICKER]: {
    inputs: [],
    outputs: [
      { key: 'selection', label: 'Selection', dataType: 'object', isDefault: true },
    ],
  },
  [NodeType.OUTPUT]: {
    inputs: [
      { key: 'value', label: 'In', dataType: 'number', isDefault: true },
    ],
    outputs: [],
  },
  [NodeType.LOGIC]: {
    inputs: [
      { key: 'a', label: 'A', dataType: 'number', isDefault: true },
      { key: 'b', label: 'B', dataType: 'number', isDefault: false },
    ],
    outputs: [
      { key: 'result', label: 'Result', dataType: 'number', isDefault: true },
    ],
  },
  [NodeType.CLONE]: {
    inputs: [
      { key: 'source', label: 'Source', dataType: 'object', isDefault: true },
    ],
    outputs: [
      { key: 'clones', label: 'Clones', dataType: 'array', isDefault: true },
    ],
  },
  [NodeType.DEBUG]: {
    inputs: [
      { key: 'value', label: 'In', dataType: 'number', isDefault: true },
    ],
    outputs: [
      { key: 'value', label: 'Out', dataType: 'number', isDefault: true },
    ],
  },
}

// === EXPOSE BUTTON STYLING ===

export const exposeButton = {
  size: 12,                   // Button diameter in px
  margin: 4,                  // Margin from field edge
  opacity: {
    default: 0.3,
    hover: 0.8,
  },
  colors: {
    dark: {
      background: '#333333',
      backgroundHover: '#555555',
      icon: '#888888',
      iconHover: '#FFFFFF',
    },
    light: {
      background: '#E0E0E0',
      backgroundHover: '#CCCCCC',
      icon: '#666666',
      iconHover: '#111111',
    },
  },
} as const

// === TOOLTIPS ===

export const portTooltips = {
  exposeInput: 'Expose as input port',
  exposeOutput: 'Expose as output port',
  unexpose: 'Hide port',
} as const

// === HELPER FUNCTIONS ===

/**
 * Get default ports for a node type
 */
export function getDefaultPorts(nodeType: NodeType) {
  return defaultPorts[nodeType] || { inputs: [], outputs: [] }
}

/**
 * Check if a property is a default exposed port
 */
export function isDefaultPort(nodeType: NodeType, propKey: string, direction: PortDirection): boolean {
  const ports = defaultPorts[nodeType]
  if (!ports) return false
  
  const list = direction === 'input' ? ports.inputs : ports.outputs
  return list.some(p => p.key === propKey && p.isDefault)
}

/**
 * Get expose button color
 */
export function getExposeButtonColor(
  key: 'background' | 'icon',
  isDarkMode: boolean,
  isHover: boolean
): string {
  const colorSet = isDarkMode ? exposeButton.colors.dark : exposeButton.colors.light
  if (isHover) {
    return key === 'background' ? colorSet.backgroundHover : colorSet.iconHover
  }
  return colorSet[key]
}
