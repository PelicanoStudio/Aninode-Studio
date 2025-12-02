import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { aninodeStore } from '@core/store'
import { useNodeRegistration } from '@core/useNodeRegistration'

export type PhysicsNodeProps = {
  id: string
  name?: string

  // Mode selection
  mode: 'Gravity' | 'Bounce' | 'Parabola' | 'Collision' | 'Attractor' | 'RandomPath'

  // Gravity mode
  gravityEnabled: boolean
  gravityStrength: number // pixels per second squared
  gravityDirection: 'Down' | 'Up' | 'Left' | 'Right' | 'Custom'
  customGravityX?: number
  customGravityY?: number

  // Bounce mode
  bounceEnabled: boolean
  bounceStrength: number // 0-1 multiplier for bounce
  bounceDecay: number // 0-1 multiplier per bounce
  elasticity: number // 0-1, how much energy is preserved

  // Parabola mode
  parabolaEnabled: boolean
  initialVelocityX: number // pixels per second
  initialVelocityY: number // pixels per second
  airResistance: number // drag coefficient

  // Collision mode
  collisionEnabled: boolean
  collisionObjects: string[] // IDs of objects to check collision with
  repulsionStrength: number // force multiplier when colliding
  attractionStrength: number // force multiplier when near

  // Attractor mode
  attractorEnabled: boolean
  attractorObjects: string[] // IDs of objects to attract
  attractorStrength: number // force multiplier
  attractorRadius: number // distance at which attraction occurs

  // Random path mode
  randomPathEnabled: boolean
  randomness: number // 0-1, how much the path deviates
  pathComplexity: number // number of waypoints in path
  movementSpeed: number // overall speed of movement

  // Object properties
  mass: number // affects how forces impact this object
  friction: number // resistance to movement
  positionX: number // starting X position
  positionY: number // starting Y position
  velocityX: number // starting velocity X
  velocityY: number // starting velocity Y

  // Output configuration
  outputPosition: boolean
  outputVelocity: boolean
  outputAcceleration: boolean
}

// Auto-mapping preset for ObjectPicker
const AUTO_MAPPING_PRESET = {
  positionX: 'x',
  positionY: 'y',
  velocityX: 'velocityX',
  velocityY: 'velocityY',
  accelerationX: 'accelerationX',
  accelerationY: 'accelerationY',
}

export function PhysicsNode({
  id,
  name = 'Physics',
  mode = 'Gravity',
  gravityEnabled = true,
  gravityStrength = 9.8,
  gravityDirection = 'Down',
  customGravityX = 0,
  customGravityY = 0,
  bounceEnabled = false,
  bounceStrength = 0.8,
  bounceDecay = 0.95,
  elasticity = 0.7,
  parabolaEnabled = false,
  initialVelocityX = 0,
  initialVelocityY = 0,
  airResistance = 0.01,
  collisionEnabled = false,
  collisionObjects = [],
  repulsionStrength = 1,
  attractionStrength = 1,
  attractorEnabled = false,
  attractorObjects = [],
  attractorStrength = 1,
  attractorRadius = 100,
  randomPathEnabled = false,
  randomness = 0.5,
  pathComplexity = 5,
  movementSpeed = 1,
  mass = 1,
  friction = 0.1,
  positionX = 0,
  positionY = 0,
  velocityX = initialVelocityX,
  velocityY = initialVelocityY,
  outputPosition = true,
  outputVelocity = true,
  outputAcceleration = false,
}: PhysicsNodeProps) {
  // Reconstruct props for registration
  const baseProps = {
    id,
    name,
    mode,
    gravityEnabled,
    gravityStrength,
    gravityDirection,
    customGravityX,
    customGravityY,
    bounceEnabled,
    bounceStrength,
    bounceDecay,
    elasticity,
    parabolaEnabled,
    initialVelocityX,
    initialVelocityY,
    airResistance,
    collisionEnabled,
    collisionObjects,
    repulsionStrength,
    attractionStrength,
    attractorEnabled,
    attractorObjects,
    attractorStrength,
    attractorRadius,
    randomPathEnabled,
    randomness,
    pathComplexity,
    movementSpeed,
    mass,
    friction,
    positionX,
    positionY,
    velocityX,
    velocityY,
    outputPosition,
    outputVelocity,
    outputAcceleration,
  }

  // Register node
  useNodeRegistration(id, 'PhysicsNode' as any, baseProps)

  // Physics state - using plain object for GSAP compatibility
  const stateRef = useRef({
    positionX,
    positionY,
    velocityX,
    velocityY,
    accelerationX: 0,
    accelerationY: 0,
  })
  
  const lastPublishedValues = useRef({
    positionX: 0,
    positionY: 0,
    velocityX: 0,
    velocityY: 0,
    accelerationX: 0,
    accelerationY: 0,
  })

  // Animation loop reference
  const animationFrameRef = useRef<number | null>(null)

  // Publish auto-mapping preset
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

  // Publish values with anti-jitter
  const publishPhysicsValues = () => {
    const node = aninodeStore.nodes[id]
    if (!node) return

    if (outputPosition) {
      // Round to 2 decimal places to reduce jitter
      const roundedX = Math.round(stateRef.current.positionX * 100) / 100
      const roundedY = Math.round(stateRef.current.positionY * 100) / 100
      
      if (roundedX !== lastPublishedValues.current.positionX || 
          roundedY !== lastPublishedValues.current.positionY) {
        node.outputs.positionX = roundedX
        node.outputs.positionY = roundedY
        lastPublishedValues.current.positionX = roundedX
        lastPublishedValues.current.positionY = roundedY
      }
    }

    if (outputVelocity) {
      const roundedVelX = Math.round(stateRef.current.velocityX * 100) / 100
      const roundedVelY = Math.round(stateRef.current.velocityY * 100) / 100
      
      if (roundedVelX !== lastPublishedValues.current.velocityX || 
          roundedVelY !== lastPublishedValues.current.velocityY) {
        node.outputs.velocityX = roundedVelX
        node.outputs.velocityY = roundedVelY
        lastPublishedValues.current.velocityX = roundedVelX
        lastPublishedValues.current.velocityY = roundedVelY
      }
    }

    if (outputAcceleration) {
      const roundedAccX = Math.round(stateRef.current.accelerationX * 100) / 100
      const roundedAccY = Math.round(stateRef.current.accelerationY * 100) / 100
      
      if (roundedAccX !== lastPublishedValues.current.accelerationX || 
          roundedAccY !== lastPublishedValues.current.accelerationY) {
        node.outputs.accelerationX = roundedAccX
        node.outputs.accelerationY = roundedAccY
        lastPublishedValues.current.accelerationX = roundedAccX
        lastPublishedValues.current.accelerationY = roundedAccY
      }
    }
  }

  // Main physics simulation
  const simulatePhysics = (deltaTime: number) => {
    const state = stateRef.current
    const dt = deltaTime / 1000 // Convert to seconds
    
    // Reset acceleration each frame
    state.accelerationX = 0
    state.accelerationY = 0
    
    // Apply gravity based on mode
    if (gravityEnabled && mode === 'Gravity') {
      let gravityX = 0
      let gravityY = 0
      
      switch (gravityDirection) {
        case 'Down':
          gravityY = gravityStrength
          break
        case 'Up':
          gravityY = -gravityStrength
          break
        case 'Left':
          gravityX = -gravityStrength
          break
        case 'Right':
          gravityX = gravityStrength
          break
        case 'Custom':
          gravityX = customGravityX || 0
          gravityY = customGravityY || 0
          break
      }
      
      state.accelerationX += gravityX
      state.accelerationY += gravityY
    }
    
    // Apply parabolic motion
    if (parabolaEnabled && mode === 'Parabola') {
      state.accelerationX -= state.velocityX * airResistance
      state.accelerationY -= state.velocityY * airResistance
    }
    
    // Apply attractor forces
    if (attractorEnabled && mode === 'Attractor') {
      for (const targetId of attractorObjects) {
        const targetNode = aninodeStore.nodes[targetId]
        if (targetNode) {
          const dx = targetNode.outputs.positionX - state.positionX || 0
          const dy = targetNode.outputs.positionY - state.positionY || 0
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance > 0 && distance < attractorRadius) {
            const force = (attractorStrength * (attractorRadius - distance)) / attractorRadius
            state.accelerationX += (dx / distance) * force
            state.accelerationY += (dy / distance) * force
          }
        }
      }
    }
    
    // Apply collision forces
    if (collisionEnabled && mode === 'Collision') {
      for (const objId of collisionObjects) {
        const objNode = aninodeStore.nodes[objId]
        if (objNode) {
          const dx = objNode.outputs.positionX - state.positionX || 0
          const dy = objNode.outputs.positionY - state.positionY || 0
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 50) { // Collision threshold
            // Apply repulsion force
            if (distance > 0) {
              const force = (repulsionStrength * (50 - distance)) / 50
              state.accelerationX -= (dx / distance) * force
              state.accelerationY -= (dy / distance) * force
            }
          }
        }
      }
    }
    
    // Apply random path movement
    if (randomPathEnabled && mode === 'RandomPath') {
      // Add some randomness to the movement
      state.accelerationX += (Math.random() - 0.5) * randomness
      state.accelerationY += (Math.random() - 0.5) * randomness
    }
    
    // Update velocity based on acceleration
    state.velocityX += state.accelerationX * dt
    state.velocityY += state.accelerationY * dt
    
    // Apply friction
    state.velocityX *= (1 - friction * dt)
    state.velocityY *= (1 - friction * dt)
    
    // Update position based on velocity
    state.positionX += state.velocityX * dt
    state.positionY += state.velocityY * dt
    
    // Apply bounce if needed (simple boundary bounce)
    if (bounceEnabled && mode === 'Bounce') {
      // In a real implementation, you'd check against boundaries/collision objects
      // For now, we'll just make it bounce at arbitrary boundaries
      if (state.positionX < 0 || state.positionX > 1000) {
        state.velocityX = -state.velocityX * bounceStrength * bounceDecay
        state.positionX = Math.max(0, Math.min(1000, state.positionX))
      }
      
      if (state.positionY < 0 || state.positionY > 600) {
        state.velocityY = -state.velocityY * bounceStrength * bounceDecay
        state.positionY = Math.max(0, Math.min(600, state.positionY))
      }
    }
    
    // Publish the updated values
    publishPhysicsValues()
  }

  // Animation loop
  useEffect(() => {
    if (!id) return

    let lastTime = performance.now()
    
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime
      
      if (deltaTime < 100) { // Prevent large jumps if tab was inactive
        simulatePhysics(deltaTime)
      }
      
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    
    animationFrameRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [
    id,
    mode,
    gravityEnabled,
    gravityStrength,
    gravityDirection,
    customGravityX,
    customGravityY,
    bounceEnabled,
    bounceStrength,
    bounceDecay,
    elasticity,
    parabolaEnabled,
    initialVelocityX,
    initialVelocityY,
    airResistance,
    collisionEnabled,
    collisionObjects,
    repulsionStrength,
    attractionStrength,
    attractorEnabled,
    attractorObjects,
    attractorStrength,
    attractorRadius,
    randomPathEnabled,
    randomness,
    pathComplexity,
    movementSpeed,
    mass,
    friction,
    outputPosition,
    outputVelocity,
    outputAcceleration,
  ])

  // Reset position when mode changes significantly
  useEffect(() => {
    stateRef.current.positionX = positionX
    stateRef.current.positionY = positionY
    stateRef.current.velocityX = velocityX
    stateRef.current.velocityY = velocityY
  }, [positionX, positionY, velocityX, velocityY])

  return null // Headless node
}