import gsap from 'gsap';
import '../core/nodeRegistrations'; // Ensure all nodes are registered
import { getNodeDefinition, type ComputeContext } from '../core/nodeRegistry';
import { resolveProperty } from '../core/resolveProperty';
import { engineStore } from '../core/store';
import { getProcessingOrder } from '../core/topoSort';

/**
 * ANIMATION ENGINE
 * Single Source of Truth for Time and Computed Values
 */
export class AnimationEngine {
  private static _instance: AnimationEngine
  
  // Real elapsed time - accumulates regardless of timeline state
  // Used for Independent mode nodes (LFOs, infinite loops, etc.)
  private realElapsedTime: number = 0
  
  // FPS Stats for debug window
  private frameCount: number = 0
  private lastFpsUpdate: number = 0
  private _currentFps: number = 60
  private _frameTime: number = 16.67
  
  // Public stats getter
  public get stats() {
    return {
      fps: this._currentFps,
      frameTime: this._frameTime,
      realElapsedTime: this.realElapsedTime,
      nodeCount: Object.keys(engineStore.project.nodes).length,
      outputCount: Object.keys(engineStore.runtime.nodeOutputs).length,
      connectionCount: Object.keys(engineStore.project.connections).length,
    }
  }
  
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
    
    // ALWAYS accumulate real elapsed time (for Independent mode nodes)
    const deltaSeconds = deltaTime / 1000
    this.realElapsedTime += deltaSeconds
    
    // Update FPS stats (every frame)
    this.frameCount++
    this._frameTime = deltaTime
    const now = performance.now()
    if (now - this.lastFpsUpdate >= 1000) {
      this._currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate))
      this.frameCount = 0
      this.lastFpsUpdate = now
    }

    // 1. MASTER TIME LOGIC (only advances when playing)
    if (state.isPlaying) {
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

    // 2. COMPUTE SIGNALS & NODES FIRST (generates nodeOutputs)
    // Pass realElapsedTime for Independent mode nodes
    this.computeNodes(state.masterTime, this.realElapsedTime)
    
    // 3. PROCESS CONNECTIONS AFTER - propagates fresh outputs to overrides
    // When source is disabled, clears the override so next frame uses baseProps
    this.processConnections()
  }
  
  /**
   * PROCESS CONNECTIONS
   * Reads from runtime.nodeOutputs and writes to runtime.overrides
   * This is the critical data flow step that makes connections work
   */
  private processConnections() {
    const connections = engineStore.project.connections
    const nodeOutputs = engineStore.runtime.nodeOutputs
    const nodes = engineStore.project.nodes
    
    Object.values(connections).forEach(conn => {
      const sourceNode = nodes[conn.sourceNodeId]
      const isSourceEnabled = sourceNode?.baseProps?.enabled !== false
      
      if (isSourceEnabled) {
        // Source is enabled - propagate value to target's overrides
        const sourceOutput = nodeOutputs[conn.sourceNodeId]
        const value = sourceOutput?.[conn.sourceProp]
        
        if (value !== undefined) {
          // Initialize target override object if needed
          if (!engineStore.runtime.overrides[conn.targetNodeId]) {
            engineStore.runtime.overrides[conn.targetNodeId] = {}
          }
          // Write the value to target's overrides
          engineStore.runtime.overrides[conn.targetNodeId][conn.targetProp] = value
        }
      } else {
        // Source is disabled - CLEAR the override (revert to baseProps per 3-Level Hierarchy)
        if (engineStore.runtime.overrides[conn.targetNodeId]) {
          delete engineStore.runtime.overrides[conn.targetNodeId][conn.targetProp]
        }
      }
    })
  }

  /**
   * COMPUTE NODE WITH REGISTRY
   * Uses the Node Registry to compute a node's outputs.
   * Supports enable/bypass toggles.
   */
  private computeNodeWithRegistry(
    nodeId: string, 
    node: any, 
    realElapsedTime: number, 
    masterTime: number
  ): boolean {
    const def = getNodeDefinition(node.type)
    if (!def || !def.compute) return false
    
    // Check enabled state
    const enabled = node.baseProps?.enabled !== false // Default to enabled
    if (!enabled) {
      // Node is disabled - clear outputs
      engineStore.runtime.nodeOutputs[nodeId] = {}
      return true // Handled
    }
    
    // Check bypass state
    const bypassed = node.baseProps?.bypassed === true
    if (bypassed) {
      // Bypass - pass first input directly to first output
      const firstInputKey = def.inputs[0]?.key
      const firstOutputKey = def.outputs[0]?.key
      if (firstInputKey && firstOutputKey) {
        const inputValue = resolveProperty(nodeId, firstInputKey, 0)
        engineStore.runtime.nodeOutputs[nodeId] = { [firstOutputKey]: inputValue }
      }
      return true // Handled
    }
    
    // Resolve time based on timeline mode
    const timelineMode = def.defaultTimelineMode || 'independent'
    const time = timelineMode === 'independent' 
      ? realElapsedTime 
      : this.resolveLocalTime(masterTime, node)
    
    // Gather inputs from overrides
    const inputs: Record<string, any> = {}
    for (const inputPort of def.inputs) {
      inputs[inputPort.key] = resolveProperty(nodeId, inputPort.key, undefined)
    }
    
    // Build compute context
    const ctx: ComputeContext = {
      nodeId,
      time,
      realElapsedTime,
      masterTime,
      inputs,
      baseProps: node.baseProps || {},
      store: engineStore
    }
    
    // Execute compute function
    const result = def.compute(ctx)
    
    // Write outputs to runtime
    if (result?.outputs) {
      engineStore.runtime.nodeOutputs[nodeId] = result.outputs
    }
    
    return true // Node was handled by registry
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
   * @param masterTime - Timeline time (for Linked mode)
   * @param realElapsedTime - Real wall-clock time (for Independent mode)
   */
  private computeNodes(masterTime: number, realElapsedTime: number) {
     const project = engineStore.project
     
     // Get nodes in topologically sorted order (dependencies before dependents)
     const sortedNodeIds = getProcessingOrder()
     
     // STEP 1: Compute all nodes using registry (with enable/bypass support)
     sortedNodeIds.forEach(nodeId => {
       const node = project.nodes[nodeId]
       if (!node) return // Node may have been deleted
       
       // Try registry-based compute first (supports enable/bypass)
       const handledByRegistry = this.computeNodeWithRegistry(nodeId, node, realElapsedTime, masterTime)
       
       // If not handled by registry, use legacy fallback
       if (!handledByRegistry) {
         // Legacy LFO handling (for nodes not yet in registry)
         if (node.type === 'LFONode' || node.type === 'OSCILLATOR') {
           const time = realElapsedTime
           const frequency = resolveProperty(nodeId, 'frequency', 1)
           const min = resolveProperty(nodeId, 'min', 0)
           const max = resolveProperty(nodeId, 'max', 100)
           const phase = resolveProperty(nodeId, 'phase', 0)
           const waveform = resolveProperty(nodeId, 'waveform', 'sine')
           const amplitude = resolveProperty(nodeId, 'amplitude', 1)
           
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
             case 'inverted-sawtooth':
               value = 1 - (t_simple % 1)
               break
             case 'noise':
               value = Math.random()
               break
           }
           
           const outputValue = min + (value * amplitude) * (max - min)
           if (!engineStore.runtime.nodeOutputs[nodeId]) engineStore.runtime.nodeOutputs[nodeId] = {}
           engineStore.runtime.nodeOutputs[nodeId].value = outputValue
         }
         
         // Legacy SLIDER/NUMBER/BOOLEAN handling
         if (node.type === 'SLIDER' || node.type === 'NUMBER' || node.type === 'BOOLEAN') {
           const value = resolveProperty(nodeId, 'value', node.type === 'BOOLEAN' ? false : 50)
           if (!engineStore.runtime.nodeOutputs[nodeId]) engineStore.runtime.nodeOutputs[nodeId] = {}
           engineStore.runtime.nodeOutputs[nodeId].value = value
         }
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

    // STEP 3: Process Connections (Wire data between nodes)
    // For each connection, read source node's output and write to target node's overrides
    Object.values(project.connections).forEach(connection => {
      const sourceNodeId = connection.sourceNodeId
      const sourceProp = connection.sourceProp || 'value'
      const targetNodeId = connection.targetNodeId
      const targetProp = connection.targetProp || 'value'
      
      // Get value from source node's outputs
      const sourceOutputs = engineStore.runtime.nodeOutputs[sourceNodeId]
      if (sourceOutputs && sourceOutputs[sourceProp] !== undefined) {
        // Write to target node's overrides
        if (!engineStore.runtime.overrides[targetNodeId]) {
          engineStore.runtime.overrides[targetNodeId] = {}
        }
        engineStore.runtime.overrides[targetNodeId][targetProp] = sourceOutputs[sourceProp]
      }
    })
  }
}

// Initialize immediately
export const engine = AnimationEngine.getInstance()
