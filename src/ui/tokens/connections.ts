/**
 * Connection Type Rules & Semantics
 * Defines the visual and functional meaning of each wire type
 */

import { ConnectionType } from '@/ui/types';

/**
 * Connection Type Semantics
 * Each wire type has a specific meaning in the Aninode system
 */
export const connectionRules = {
  /**
   * BEZIER (Simple Bezier)
   * Single parameter flow - one value traveling from source to target
   * Use case: Connecting a single output property to a single input
   * Visual: Smooth curved line
   */
  [ConnectionType.BEZIER]: {
    name: 'Single Parameter',
    description: 'One value flows from source to target',
    useCase: 'Connect single output property to single input',
    dataType: 'single',
    isAnimated: false,
    defaultColor: 'default',
  },
  
  /**
   * DOUBLE (Double Bezier)
   * List/Array data flow - multiple values as a collection
   * Use case: Passing arrays, object lists, or batch data
   * Visual: Thick line with inner stroke (like a pipe)
   */
  [ConnectionType.DOUBLE]: {
    name: 'List / Array',
    description: 'Multiple values as a collection',
    useCase: 'Pass arrays, object lists, or batch data',
    dataType: 'list',
    isAnimated: false,
    defaultColor: 'default',
  },
  
  /**
   * DOTTED (Double Bezier Dotted)
   * Dynamic/Live data - real-time streaming values
   * Use case: LFO signals, continuous animations, live feeds
   * Visual: Dashed curved line suggesting motion/flow
   */
  [ConnectionType.DOTTED]: {
    name: 'Dynamic / Live',
    description: 'Real-time streaming values',
    useCase: 'LFO signals, continuous animations, live feeds',
    dataType: 'stream',
    isAnimated: true,
    defaultColor: 'default',
  },
  
  /**
   * STEP (Orthogonal Step)
   * Logic/Control flow - conditional or boolean signals
   * Use case: If/else triggers, state changes, control signals
   * Visual: Right-angled line suggesting digital/logic gates
   */
  [ConnectionType.STEP]: {
    name: 'Logic / Control',
    description: 'Conditional or boolean signals',
    useCase: 'If/else triggers, state changes, control signals',
    dataType: 'boolean',
    isAnimated: false,
    defaultColor: 'default',
  },
  
  /**
   * STRAIGHT (Telepathic Arrow)
   * Wireless/Remote data binding - property teleportation
   * Use case: Non-adjacent property binding, action-at-distance
   * Visual: Dashed arrow suggesting remote connection
   */
  [ConnectionType.STRAIGHT]: {
    name: 'Telepathic / Wireless',
    description: 'Remote property binding without physical connection',
    useCase: 'Non-adjacent property binding, action-at-distance',
    dataType: 'any',
    isAnimated: false,
    defaultColor: 'telepathic',
  },
} as const;

/**
 * Get the appropriate connection type based on data characteristics
 */
export function suggestConnectionType(
  sourceDataType: 'single' | 'list' | 'stream' | 'boolean' | 'any',
  isRemote: boolean = false
): ConnectionType {
  if (isRemote) return ConnectionType.STRAIGHT;
  
  switch (sourceDataType) {
    case 'list': return ConnectionType.DOUBLE;
    case 'stream': return ConnectionType.DOTTED;
    case 'boolean': return ConnectionType.STEP;
    default: return ConnectionType.BEZIER;
  }
}

/**
 * Validate if a connection type is appropriate for the data
 */
export function validateConnectionType(
  type: ConnectionType,
  sourceDataType: string
): { valid: boolean; warning?: string } {
  const rule = connectionRules[type];
  
  if (rule.dataType === 'any') {
    return { valid: true };
  }
  
  if (rule.dataType !== sourceDataType) {
    return {
      valid: true, // Allow but warn
      warning: `Connection type "${rule.name}" is typically used for ${rule.dataType} data, but source provides ${sourceDataType} data.`
    };
  }
  
  return { valid: true };
}

/**
 * Get all connection types with their display info
 */
export function getConnectionTypeOptions() {
  return Object.entries(connectionRules).map(([type, rule]) => ({
    type: type as ConnectionType,
    name: rule.name,
    description: rule.description,
    useCase: rule.useCase,
  }));
}

/** Export connection type enum values for convenience */
export { ConnectionType };
