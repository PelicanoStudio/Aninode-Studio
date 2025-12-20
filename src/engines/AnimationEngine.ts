import gsap from 'gsap'
import { resolveProperty } from '../core/resolveProperty'
import { engineStore } from '../core/store'

/**
 * ANIMATION ENGINE
 * Single Source of Truth for Time and Computed Values
 */
export class AnimationEngine {
  private static _instance: AnimationEngine
  
  private constructor() {
    this.startLoop()
  }

  public static getInstance(): AnimationEngine {
    if (!AnimationEngine._instance) {
      AnimationEngine._instance = new AnimationEngine()
    }
    return AnimationEngine._instance
  }

  /**
   * THE HEARTBEAT
   * Runs on every requestAnimationFrame via GSAP Ticker
   */
  private startLoop() {
    // Ensure we don't pile up listeners
    gsap.ticker.remove(this.tick)
    gsap.ticker.add(this.tick)
  }

  /**
   * MAIN LOOP (60fps)
   * 1. Update Master Time
   * 2. Compute Node Signals (LFOs)
   * 3. Compute Modifiers
   * 4. Solve Physics (Phase 3)
   * 5. Update Runtime State
   */
  private tick = (_time: number, deltaTime: number, _frame: number) => {
    const state = engineStore.runtime.timeline
    const definition = engineStore.project.timeline
    
    // 1. MASTER TIME LOGIC
    if (state.isPlaying) {
      // Calculate delta in seconds
      const deltaSeconds = deltaTime / 1000
      
      // Advance time
      let newTime = state.masterTime + (deltaSeconds * state.timeScale)
      
      // Handle Looping
      if (state.loop) {
        if (newTime >= definition.duration) {
          newTime = 0
        } else if (newTime < 0) {
          newTime = definition.duration
        }
      } else {
        // Clamp if not looping
        newTime = Math.max(0, Math.min(newTime, definition.duration))
        if (newTime === definition.duration && state.timeScale > 0) {
            state.isPlaying = false // Stop at end
        }
      }
      
      // Update Store (triggers reactive views)
      state.masterTime = newTime
    }

    // 2. COMPUTE SIGNALS & NODES
    this.computeNodes(state.masterTime)
  }

   /**
   * RESOLVE LOCAL TIME
   * Phase 3.1: Calculate localTime for each node based on timelineConfig
   */
  private resolveLocalTime(time: number, node: any): number {
    const config = node.timelineConfig
    if (!config) return time // Fallback to global time

    let localTime = time

    // 1. Apply Offset (startTime)
    if (config.mode === 'offset' || config.mode === 'independent') {
      localTime = time - (config.offset || 0)
    }

    // 2. Handle Looping (Mini-Timeline)
    if (config.loop && config.duration) {
      if (localTime >= config.duration) {
        localTime = localTime % config.duration
      } else if (localTime < 0) {
        // Handle negative time (if masterTime < offset)
        localTime = config.duration + (localTime % config.duration)
      }
    }
    
    return localTime
  }

  /**
   * PROCESS PASSIVE NODES
   * Reads definitions from Project layer, writes computed values to Runtime layer.
   */
  private computeNodes(masterTime: number) {
     const project = engineStore.project
     
     // STEP 1: Process LFO nodes first (Signal Generators)
     // They write to other nodes' overrides
     Object.entries(project.nodes).forEach(([nodeId, node]) => {
      // Calculate Local Time for this node
      const time = this.resolveLocalTime(masterTime, node)

      // Handle both naming conventions: LFONode (engine) and OSCILLATOR (UI)
      if (node.type === 'LFONode' || node.type === 'OSCILLATOR') {
        const frequency = resolveProperty(nodeId, 'frequency', 1)
        const min = resolveProperty(nodeId, 'min', 0)
        const max = resolveProperty(nodeId, 'max', 1)
        const phase = resolveProperty(nodeId, 'phase', 0)
        const waveform = resolveProperty(nodeId, 'waveform', 'sine')
        // Also support 'amplitude' for UI compatibility
        const amplitude = resolveProperty(nodeId, 'amplitude', 1)
        
        // Calculate time position in oscillation
        const t_simple = time * frequency + phase 

        let value = 0
        
        switch (waveform) {
          case 'sine':
            value = (Math.sin(t_simple * Math.PI * 2) + 1) / 2
            break
          case 'square':
            value = Math.sin(t_simple * Math.PI * 2) > 0 ? 1 : 0
            break
          case 'triangle':
            value = Math.abs((t_simple % 1) * 2 - 1)
            break
          case 'sawtooth':
            value = t_simple % 1
            break
          case 'noise':
            value = Math.random() // Noise is non-deterministic, usually bad for engines, but ok for now
            break
        }
        // Apply amplitude and map to min/max range
        const outputValue = min + (value * amplitude) * (max - min)
        
        // Write to runtime outputs
        if (!engineStore.runtime.nodeOutputs[nodeId]) engineStore.runtime.nodeOutputs[nodeId] = {}
        engineStore.runtime.nodeOutputs[nodeId].value = outputValue
        
        // Write to target node's overrides
        const targetNodeId = node.baseProps.targetNodeId
        const targetProperty = node.baseProps.targetProperty
        if (targetNodeId && targetProperty && engineStore.project.nodes[targetNodeId]) {
          if (!engineStore.runtime.overrides[targetNodeId]) engineStore.runtime.overrides[targetNodeId] = {}
          engineStore.runtime.overrides[targetNodeId][targetProperty] = outputValue
        }
      }
      // Handle SLIDER, NUMBER, BOOLEAN nodes - pass through their 'value' as output
      if (node.type === 'SLIDER' || node.type === 'NUMBER' || node.type === 'BOOLEAN') {
        const value = resolveProperty(nodeId, 'value', node.type === 'BOOLEAN' ? false : 50)
        if (!engineStore.runtime.nodeOutputs[nodeId]) engineStore.runtime.nodeOutputs[nodeId] = {}
        engineStore.runtime.nodeOutputs[nodeId].value = value
      }
    })

    // STEP 2: Process Transform Nodes
    // They read properties (including overrides set above)
    Object.entries(project.nodes).forEach(([nodeId, node]) => {
      // Skip already processed types
      if (node.type === 'LFONode' || node.type === 'OSCILLATOR' || 
          node.type === 'SLIDER' || node.type === 'NUMBER' || node.type === 'BOOLEAN') return
      
      // Calculate Local Time for this node
      const time = this.resolveLocalTime(masterTime, node)

      // Initialize outputs if missing
      if (!engineStore.runtime.nodeOutputs[nodeId]) engineStore.runtime.nodeOutputs[nodeId] = {}
      const outputs = engineStore.runtime.nodeOutputs[nodeId]

      switch (node.type) {
        case 'RotationNode': {
          const mode = resolveProperty(nodeId, 'mode', 'animated')
          if (mode === 'animated') {
            const timingMode = resolveProperty(nodeId, 'timingMode', 'speed')
            const direction = resolveProperty(nodeId, 'direction', 'cw') === 'cw' ? 1 : -1
            
            let angle: number
            if (timingMode === 'speed') {
              const speed = resolveProperty(nodeId, 'speed', 1)
              angle = (time * speed * 360 * direction) % 360
            } else {
              const duration = resolveProperty(nodeId, 'duration', 2)
              const progress = (time % duration) / duration
              angle = progress * 360 * direction
            }
            outputs.rotation = angle
          } else {
            outputs.rotation = resolveProperty(nodeId, 'staticAngle', 0)
          }
          break
        }

        case 'ScaleNode': {
          const mode = resolveProperty(nodeId, 'mode', 'animated')
          if (mode === 'animated') {
            const duration = resolveProperty(nodeId, 'duration', 1)
            const startScale = resolveProperty(nodeId, 'startScale', 1)
            const endScale = resolveProperty(nodeId, 'endScale', 1.5)
            const yoyo = resolveProperty(nodeId, 'yoyo', true)
            
            let t = (time % (duration * 2)) / duration
            if (yoyo && t > 1) t = 2 - t
            
            const scale = startScale + (endScale - startScale) * t
            outputs.scaleX = scale
            outputs.scaleY = scale
          }
          break
        }

        case 'OpacityNode': {
          const mode = resolveProperty(nodeId, 'mode', 'animated')
          if (mode === 'animated') {
            const duration = resolveProperty(nodeId, 'duration', 1)
            const startOpacity = resolveProperty(nodeId, 'startOpacity', 0.3)
            const endOpacity = resolveProperty(nodeId, 'endOpacity', 1)
            const yoyo = resolveProperty(nodeId, 'yoyo', true)
            
            let t = (time % (duration * 2)) / duration
            if (yoyo && t > 1) t = 2 - t
            
            outputs.opacity = startOpacity + (endOpacity - startOpacity) * t
          }
          break
        }

        case 'PositionNode': {
          const mode = resolveProperty(nodeId, 'mode', 'static')
          if (mode === 'animated') {
            const duration = resolveProperty(nodeId, 'duration', 1)
            const startX = resolveProperty(nodeId, 'startX', 0)
            const startY = resolveProperty(nodeId, 'startY', 0)
            const endX = resolveProperty(nodeId, 'endX', 50)
            const endY = resolveProperty(nodeId, 'endY', 0)
            const yoyo = resolveProperty(nodeId, 'yoyo', true)
            
            let t = (time % (duration * 2)) / duration
            if (yoyo && t > 1) t = 2 - t
            
            outputs.offsetX = startX + (endX - startX) * t
            outputs.offsetY = startY + (endY - startY) * t
          } else {
            outputs.offsetX = resolveProperty(nodeId, 'offsetX', 0)
            outputs.offsetY = resolveProperty(nodeId, 'offsetY', 0)
          }
          break
        }

        // UI TRANSFORM node - acts as multi-purpose transform based on config
        case 'TRANSFORM': {
          // Read config to determine what transform to apply
          const scale = resolveProperty(nodeId, 'scale', 1)
          const rotation = resolveProperty(nodeId, 'rotation', 0)
          const opacity = resolveProperty(nodeId, 'opacity', 1)
          const offsetX = resolveProperty(nodeId, 'offsetX', 0)
          const offsetY = resolveProperty(nodeId, 'offsetY', 0)
          
          outputs.scaleX = scale
          outputs.scaleY = scale
          outputs.rotation = rotation
          outputs.opacity = opacity
          outputs.offsetX = offsetX
          outputs.offsetY = offsetY
          break
        }
      }
    })
  }
}

// Initialize immediately
export const engine = AnimationEngine.getInstance()
