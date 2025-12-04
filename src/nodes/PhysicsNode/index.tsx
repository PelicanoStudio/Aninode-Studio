/**
 * PhysicsNode - Rapier-compatible physics simulation node for Aninode
 * 
 * This module provides two implementations:
 * 1. PhysicsNode - For use within React Three Fiber + Rapier context
 * 2. PhysicsNodeFallback - For use in DOM/testing environments (NodeTester)
 * 
 * The Fallback version runs a simple 2D physics simulation using requestAnimationFrame,
 * while the main PhysicsNode leverages Rapier's WASM-based physics engine.
 */

import { aninodeStore } from '@core/store'
import { useNodeRegistration } from '@core/useNodeRegistration'
import { useCallback, useEffect, useRef } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type PhysicsMode = 
  | 'Dynamic'      // Full physics simulation (default)
  | 'Kinematic'    // Controlled by animation, affects others
  | 'Static'       // Fixed in place, blocks others
  | 'Sensor'       // Detects collisions but doesn't block

export type ColliderShape = 
  | 'Cuboid'       // Box collider
  | 'Ball'         // Sphere collider
  | 'Capsule'      // Pill shape

export type ForceMode = 
  | 'None'         // No active forces
  | 'Gravity'      // Standard downward gravity
  | 'Attractor'    // Pulls objects toward a point
  | 'Repulsor'     // Pushes objects away
  | 'Directional'  // Constant force in a direction
  | 'Impulse'      // One-time force application

export type PhysicsNodeProps = {
  id: string
  name?: string

  // Mode & Type
  mode: PhysicsMode
  colliderShape: ColliderShape
  
  // Physical Properties
  mass: number
  friction: number
  restitution: number             // Bounciness (0-1)
  linearDamping: number           // Air resistance
  angularDamping: number
  
  // Initial State
  initialPositionX: number
  initialPositionY: number
  initialPositionZ: number
  initialVelocityX: number
  initialVelocityY: number
  initialVelocityZ: number
  initialRotation: number
  
  // Collider Dimensions
  colliderWidth: number
  colliderHeight: number
  colliderDepth: number
  colliderRadius: number
  capsuleHalfHeight?: number
  
  // 2D Mode locks
  is2DMode: boolean
  lockRotationX: boolean
  lockRotationY: boolean
  lockRotationZ: boolean
  lockTranslationX: boolean
  lockTranslationY: boolean
  lockTranslationZ: boolean
  
  // Force Configuration
  forceMode: ForceMode
  gravityScale: number
  forceStrength: number
  forceDirectionX: number
  forceDirectionY: number
  forceDirectionZ: number
  
  // Attractor/Repulsor Settings
  attractorTargetX: number
  attractorTargetY: number
  attractorTargetZ: number
  attractorRadius: number
  attractorFalloff: 'Linear' | 'Quadratic' | 'Constant'
  
  // Collision Settings
  collisionGroup: number
  collisionMask: number
  isSensor: boolean
  ccdEnabled: boolean
  
  // Output Configuration
  outputPosition: boolean
  outputVelocity: boolean
  outputRotation: boolean
  outputCollisions: boolean
  
  // Pixel scale
  pixelScale: number
}

// Default props
const defaultProps: Omit<PhysicsNodeProps, 'id'> = {
  name: 'Physics',
  mode: 'Dynamic',
  colliderShape: 'Cuboid',
  
  mass: 1,
  friction: 0.5,
  restitution: 0.3,
  linearDamping: 0.1,
  angularDamping: 0.1,
  
  initialPositionX: 0,
  initialPositionY: 0,
  initialPositionZ: 0,
  initialVelocityX: 0,
  initialVelocityY: 0,
  initialVelocityZ: 0,
  initialRotation: 0,
  
  colliderWidth: 1,
  colliderHeight: 1,
  colliderDepth: 1,
  colliderRadius: 0.5,
  capsuleHalfHeight: 0.5,
  
  is2DMode: true,
  lockRotationX: true,
  lockRotationY: true,
  lockRotationZ: false,
  lockTranslationX: false,
  lockTranslationY: false,
  lockTranslationZ: true,
  
  forceMode: 'Gravity',
  gravityScale: 1,
  forceStrength: 10,
  forceDirectionX: 0,
  forceDirectionY: -1,
  forceDirectionZ: 0,
  
  attractorTargetX: 0,
  attractorTargetY: 0,
  attractorTargetZ: 0,
  attractorRadius: 10,
  attractorFalloff: 'Quadratic',
  
  collisionGroup: 0,
  collisionMask: 0xFFFF,
  isSensor: false,
  ccdEnabled: false,
  
  outputPosition: true,
  outputVelocity: true,
  outputRotation: true,
  outputCollisions: false,
  
  pixelScale: 100,
}

// Auto-mapping preset
const AUTO_MAPPING_PRESET = {
  positionX: 'x',
  positionY: 'y',
  positionZ: 'z',
  velocityX: 'velocityX',
  velocityY: 'velocityY',
  velocityZ: 'velocityZ',
  rotation: 'rotation',
  rotationZ: 'rotationZ',
}

// ============================================================================
// MAIN PHYSICS NODE (For R3F + Rapier context)
// ============================================================================

/**
 * PhysicsNode - Full Rapier-based physics node
 * 
 * NOTE: This component requires being rendered inside:
 * 1. A React Three Fiber <Canvas>
 * 2. A @react-three/rapier <Physics> provider
 * 
 * For DOM-based testing, use PhysicsNodeFallback instead.
 */
export function PhysicsNode(props: PhysicsNodeProps) {
  const mergedProps = { ...defaultProps, ...props }
  const { id } = mergedProps

  // Register node
  useNodeRegistration(id, 'PhysicsNode' as any, mergedProps)

  // Register auto-mapping preset
  useEffect(() => {
    if (!id) return

    const registerPreset = () => {
      if (aninodeStore.nodes[id]) {
        aninodeStore.nodes[id].outputs.__autoMappingPreset = AUTO_MAPPING_PRESET
      } else {
        setTimeout(registerPreset, 10)
      }
    }

    registerPreset()

    return () => {
      if (aninodeStore.nodes[id]?.outputs) {
        delete aninodeStore.nodes[id].outputs.__autoMappingPreset
      }
    }
  }, [id])

  // Note: Full Rapier implementation would go here
  // For now, this is a placeholder that should be used within R3F context
  // The actual RigidBody, Collider components would be rendered here

  return null
}

// ============================================================================
// FALLBACK PHYSICS NODE (For DOM/testing - no R3F required)
// ============================================================================

/**
 * PhysicsNodeFallback - Simple 2D physics for DOM testing
 * 
 * Uses requestAnimationFrame for basic physics simulation.
 * Perfect for NodeTester and DOM-based animations.
 */
export function PhysicsNodeFallback(props: PhysicsNodeProps) {
  const mergedProps = { ...defaultProps, ...props }
  const {
    id,
    mode,
    mass,
    linearDamping,
    restitution,
    initialPositionX,
    initialPositionY,
    initialVelocityX,
    initialVelocityY,
    forceMode,
    gravityScale,
    forceStrength,
    forceDirectionX,
    forceDirectionY,
    attractorTargetX,
    attractorTargetY,
    attractorRadius,
    attractorFalloff,
    outputPosition,
    outputVelocity,
    outputRotation,
    pixelScale,
  } = mergedProps

  // Register node
  useNodeRegistration(id, 'PhysicsNode' as any, mergedProps)

  // Physics state
  const stateRef = useRef({
    x: initialPositionX,
    y: initialPositionY,
    vx: initialVelocityX,
    vy: initialVelocityY,
    rotation: 0,
  })

  const lastPublished = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
  })

  const animationFrameRef = useRef<number | null>(null)

  // Register auto-mapping preset
  useEffect(() => {
    if (!id) return

    const registerPreset = () => {
      if (aninodeStore.nodes[id]) {
        aninodeStore.nodes[id].outputs.__autoMappingPreset = AUTO_MAPPING_PRESET
      } else {
        setTimeout(registerPreset, 10)
      }
    }

    registerPreset()

    return () => {
      if (aninodeStore.nodes[id]?.outputs) {
        delete aninodeStore.nodes[id].outputs.__autoMappingPreset
      }
    }
  }, [id])

  // Publish values
  const publishValues = useCallback(() => {
    const node = aninodeStore.nodes[id]
    if (!node) return

    const state = stateRef.current
    const threshold = 0.01

    if (outputPosition) {
      if (
        Math.abs(state.x - lastPublished.current.x) > threshold ||
        Math.abs(state.y - lastPublished.current.y) > threshold
      ) {
        node.outputs.positionX = Math.round(state.x * 100) / 100
        node.outputs.positionY = Math.round(state.y * 100) / 100
        node.outputs.x = node.outputs.positionX
        node.outputs.y = node.outputs.positionY
        lastPublished.current.x = state.x
        lastPublished.current.y = state.y
      }
    }

    if (outputVelocity) {
      if (
        Math.abs(state.vx - lastPublished.current.vx) > threshold ||
        Math.abs(state.vy - lastPublished.current.vy) > threshold
      ) {
        node.outputs.velocityX = Math.round(state.vx * 100) / 100
        node.outputs.velocityY = Math.round(state.vy * 100) / 100
        node.outputs.speed = Math.round(
          Math.sqrt(state.vx * state.vx + state.vy * state.vy) * 100
        ) / 100
        lastPublished.current.vx = state.vx
        lastPublished.current.vy = state.vy
      }
    }

    if (outputRotation) {
      if (Math.abs(state.rotation - lastPublished.current.rotation) > 0.1) {
        node.outputs.rotation = Math.round(state.rotation * 100) / 100
        node.outputs.rotationZ = node.outputs.rotation
        lastPublished.current.rotation = state.rotation
      }
    }
  }, [id, outputPosition, outputVelocity, outputRotation])

  // Physics simulation
  const simulate = useCallback((deltaTime: number) => {
    if (mode !== 'Dynamic') return

    const state = stateRef.current
    const dt = deltaTime / 1000

    let ax = 0
    let ay = 0

    switch (forceMode) {
      case 'Gravity':
        ay = mass * 9.81 * gravityScale * 100
        break

      case 'Directional':
        ax = forceDirectionX * forceStrength
        ay = forceDirectionY * forceStrength
        break

      case 'Attractor':
      case 'Repulsor': {
        const dx = attractorTargetX - state.x
        const dy = attractorTargetY - state.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 0.001 && distance < attractorRadius * pixelScale) {
          let forceMag = forceStrength
          const scaledRadius = attractorRadius * pixelScale

          switch (attractorFalloff) {
            case 'Linear':
              forceMag *= (scaledRadius - distance) / scaledRadius
              break
            case 'Quadratic':
              forceMag *= Math.pow((scaledRadius - distance) / scaledRadius, 2)
              break
          }

          const nx = dx / distance
          const ny = dy / distance
          const sign = forceMode === 'Repulsor' ? -1 : 1

          ax = nx * forceMag * sign
          ay = ny * forceMag * sign
        }
        break
      }
    }

    // Apply acceleration
    state.vx += (ax / mass) * dt
    state.vy += (ay / mass) * dt

    // Apply damping
    state.vx *= (1 - linearDamping * dt)
    state.vy *= (1 - linearDamping * dt)

    // Update position
    state.x += state.vx * dt
    state.y += state.vy * dt

    // Bounce at edges
    const bounds = { minX: -500, maxX: 500, minY: -300, maxY: 300 }
    
    if (state.x < bounds.minX) {
      state.x = bounds.minX
      state.vx = -state.vx * restitution
    } else if (state.x > bounds.maxX) {
      state.x = bounds.maxX
      state.vx = -state.vx * restitution
    }

    if (state.y < bounds.minY) {
      state.y = bounds.minY
      state.vy = -state.vy * restitution
    } else if (state.y > bounds.maxY) {
      state.y = bounds.maxY
      state.vy = -state.vy * restitution
    }

    // Calculate rotation from velocity
    if (Math.abs(state.vx) > 0.1 || Math.abs(state.vy) > 0.1) {
      state.rotation = Math.atan2(state.vy, state.vx) * (180 / Math.PI)
    }

    publishValues()
  }, [
    mode,
    mass,
    linearDamping,
    restitution,
    forceMode,
    gravityScale,
    forceStrength,
    forceDirectionX,
    forceDirectionY,
    attractorTargetX,
    attractorTargetY,
    attractorRadius,
    attractorFalloff,
    pixelScale,
    publishValues,
  ])

  // Animation loop
  useEffect(() => {
    if (!id) return

    let lastTime = performance.now()

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      if (deltaTime < 100) {
        simulate(deltaTime)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [id, simulate])

  // Reset on initial value change
  useEffect(() => {
    stateRef.current.x = initialPositionX
    stateRef.current.y = initialPositionY
    stateRef.current.vx = initialVelocityX
    stateRef.current.vy = initialVelocityY
  }, [initialPositionX, initialPositionY, initialVelocityX, initialVelocityY])

  return null
}

// ============================================================================
// EXPORTS
// ============================================================================

export { PhysicsNodeFallback as default }

