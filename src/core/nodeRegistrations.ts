/**
 * NODE REGISTRATIONS
 * 
 * Registers all built-in node types with the Node Registry.
 * Import this file once at app initialization to ensure all nodes are registered.
 */

import { Activity, GitBranch, Hash, Move, Sliders, Terminal, ToggleLeft } from 'lucide-react'
import { registerNodeType, type ComputeContext, type NodeComputeResult } from './nodeRegistry'

// === SIGNAL GENERATORS ===

registerNodeType({
  id: 'OSCILLATOR',
  label: 'LFO',
  icon: Activity,
  category: 'signal',
  
  inputs: [
    { key: 'frequency', label: 'Freq', dataType: 'number', isDefault: true },
  ],
  outputs: [
    { key: 'value', label: 'Value', dataType: 'number', isDefault: true },
  ],
  
  defaultBaseProps: {
    enabled: true,
    bypassed: false,
    frequency: 1,
    min: 0,
    max: 100,
    amplitude: 1,
    phase: 0,
    waveform: 'sine',
  },
  
  defaultTimelineMode: 'independent', // LFOs always run on real time
  
  compute: (ctx: ComputeContext): NodeComputeResult => {
    const { time, baseProps, inputs } = ctx
    
    // Resolve props (inputs override baseProps)
    const frequency = inputs.frequency ?? baseProps.frequency ?? 1
    const min = baseProps.min ?? 0
    const max = baseProps.max ?? 100
    const amplitude = baseProps.amplitude ?? 1
    const phase = baseProps.phase ?? 0
    const waveform = baseProps.waveform ?? 'sine'
    
    // Calculate oscillation
    const t = time * frequency + phase
    let value = 0
    
    switch (waveform) {
      case 'sine':
        value = (Math.sin(t * Math.PI * 2) + 1) / 2
        break
      case 'square':
        value = Math.sin(t * Math.PI * 2) > 0 ? 1 : 0
        break
      case 'triangle':
        value = Math.abs((t % 1) * 2 - 1)
        break
      case 'sawtooth':
        value = t % 1
        break
      case 'inverted-sawtooth':
        value = 1 - (t % 1)
        break
      case 'noise':
        value = Math.random()
        break
    }
    
    const output = min + (value * amplitude) * (max - min)
    
    return { outputs: { value: output } }
  }
})

// === INPUT NODES ===

registerNodeType({
  id: 'SLIDER',
  label: 'Slider',
  icon: Sliders,
  category: 'control',
  
  inputs: [],
  outputs: [
    { key: 'value', label: 'Value', dataType: 'number', isDefault: true },
  ],
  
  defaultBaseProps: {
    enabled: true,
    bypassed: false,
    value: 50,
    min: 0,
    max: 100,
    step: 1,
  },
  
  defaultTimelineMode: 'independent',
  
  compute: (ctx: ComputeContext): NodeComputeResult => {
    const { baseProps } = ctx
    // Slider just outputs its current value
    return { outputs: { value: baseProps.value ?? 50 } }
  }
})

registerNodeType({
  id: 'NUMBER',
  label: 'Number',
  icon: Hash,
  category: 'control',
  
  inputs: [],
  outputs: [
    { key: 'value', label: 'Value', dataType: 'number', isDefault: true },
  ],
  
  defaultBaseProps: {
    enabled: true,
    bypassed: false,
    value: 0,
  },
  
  defaultTimelineMode: 'independent',
  
  compute: (ctx: ComputeContext): NodeComputeResult => {
    return { outputs: { value: ctx.baseProps.value ?? 0 } }
  }
})

registerNodeType({
  id: 'BOOLEAN',
  label: 'Toggle',
  icon: ToggleLeft,
  category: 'control',
  
  inputs: [],
  outputs: [
    { key: 'enabled', label: 'State', dataType: 'boolean', isDefault: true },
  ],
  
  defaultBaseProps: {
    enabled: true,
    bypassed: false,
    value: false,
  },
  
  defaultTimelineMode: 'independent',
  
  compute: (ctx: ComputeContext): NodeComputeResult => {
    return { outputs: { enabled: ctx.baseProps.value ?? false } }
  }
})

// === UTILITY NODES ===

registerNodeType({
  id: 'DEBUG',
  label: 'DEBUG',
  icon: Terminal,
  category: 'special',
  
  inputs: [
    { key: 'value', label: 'In', dataType: 'number', isDefault: true },
  ],
  outputs: [
    { key: 'value', label: 'Out', dataType: 'number', isDefault: true },
  ],
  
  defaultBaseProps: {
    enabled: true,
    bypassed: false,
  },
  
  defaultTimelineMode: 'independent',
  
  // DEBUG passes through its input to output (passthrough node)
  compute: (ctx: ComputeContext): NodeComputeResult => {
    const inputValue = ctx.inputs.value ?? 0
    return { outputs: { value: inputValue } }
  }
})

registerNodeType({
  id: 'TRANSFORM',
  label: 'Transform',
  icon: Move,
  category: 'transform',
  
  inputs: [
    { key: 'value', label: 'In', dataType: 'number', isDefault: true },
  ],
  outputs: [
    { key: 'scale', label: 'Scale', dataType: 'number', isDefault: true },
  ],
  
  defaultBaseProps: {
    enabled: true,
    bypassed: false,
    startScale: 1,
    endScale: 2,
  },
  
  defaultTimelineMode: 'linked',
  
  compute: (ctx: ComputeContext): NodeComputeResult => {
    const { inputs, baseProps } = ctx
    const inputValue = inputs.value ?? 0  // Expect 0-100 from LFO
    const startScale = baseProps.startScale ?? 1
    const endScale = baseProps.endScale ?? 2
    
    // Map input (0-100) to scale range
    const t = inputValue / 100
    const scale = startScale + t * (endScale - startScale)
    
    return { outputs: { scale } }
  }
})

registerNodeType({
  id: 'PICKER',
  label: 'Object Picker',
  icon: GitBranch,
  category: 'special',
  
  inputs: [],
  outputs: [
    { key: 'selection', label: 'Selection', dataType: 'object', isDefault: true },
  ],
  
  defaultBaseProps: {
    enabled: true,
    bypassed: false,
    targets: [],
    mode: 'push', // 'push' or 'pull'
  },
  
  defaultTimelineMode: 'independent',
  
  // Picker logic is handled specially by the UI, not compute
})

// Export for type checking
export { }

