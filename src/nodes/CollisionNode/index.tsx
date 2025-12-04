/**
 * CollisionNode - Collision behavior and surface properties for Aninode
 * 
 * Part of the physics node system. Handles:
 * - Collision shape definitions (Box, Circle, Auto-hull)
 * - Surface types (Solid, Trigger, Platform)
 * - Collision groups and masks
 * - Surface behaviors (adhesion, bounce response)
 */

import { aninodeStore } from '@core/store'
import { useNodeRegistration } from '@core/useNodeRegistration'
import { useCallback, useEffect, useRef } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type CollisionShape = 'Box' | 'Circle' | 'Capsule' | 'Polygon'
export type SurfaceType = 'Solid' | 'Trigger' | 'Platform'
export type CollisionResponse = 'Bounce' | 'Stick' | 'Stop' | 'Pass'

export type CollisionNodeProps = {
  id: string
  name?: string

  // Collision Shape
  shape: CollisionShape
  shapeWidth: number        // Box width or Circle diameter
  shapeHeight: number       // Box height (ignored for Circle)
  shapeOffsetX: number      // Offset from object center
  shapeOffsetY: number
  autoShape: boolean        // Auto-detect from object bounds

  // Surface Type
  surfaceType: SurfaceType
  platformDirection: 'Up' | 'Down' | 'Left' | 'Right'  // For one-way platforms

  // Collision Groups
  collisionGroup: number    // Which group this object belongs to (bitmask)
  collisionMask: number     // Which groups this object collides with (bitmask)

  // Surface Properties
  friction: number          // 0 = ice, 1 = rubber
  bounciness: number        // Restitution: 0 = no bounce, 1 = full bounce
  adhesion: number          // Stickiness: 0 = none, 1 = glue

  // Collision Response
  onCollisionResponse: CollisionResponse

  // Output options
  outputCollisions: boolean
  outputOverlaps: boolean
}

// Default props
const defaultProps: Omit<CollisionNodeProps, 'id'> = {
  name: 'Collision',
  shape: 'Box',
  shapeWidth: 100,
  shapeHeight: 100,
  shapeOffsetX: 0,
  shapeOffsetY: 0,
  autoShape: true,
  surfaceType: 'Solid',
  platformDirection: 'Up',
  collisionGroup: 1,
  collisionMask: 0xFFFF,
  friction: 0.5,
  bounciness: 0.3,
  adhesion: 0,
  onCollisionResponse: 'Bounce',
  outputCollisions: true,
  outputOverlaps: false,
}

// Auto-mapping preset
const AUTO_MAPPING_PRESET = {
  isColliding: 'isColliding',
  collisionCount: 'collisionCount',
  lastCollisionId: 'lastCollisionId',
  friction: 'friction',
  bounciness: 'bounciness',
}

// ============================================================================
// COLLISION NODE COMPONENT
// ============================================================================

export function CollisionNode(props: CollisionNodeProps) {
  const mergedProps = { ...defaultProps, ...props }
  const {
    id,
    shape,
    shapeWidth,
    shapeHeight,
    shapeOffsetX,
    shapeOffsetY,
    autoShape,
    surfaceType,
    platformDirection,
    collisionGroup,
    collisionMask,
    friction,
    bounciness,
    adhesion,
    onCollisionResponse,
    outputCollisions,
    outputOverlaps,
  } = mergedProps

  // Register node
  useNodeRegistration(id, 'CollisionNode' as any, mergedProps)

  // Collision state
  const collisionStateRef = useRef({
    isColliding: false,
    collisionCount: 0,
    lastCollisionId: null as string | null,
    overlappingIds: [] as string[],
  })

  const lastPublished = useRef({
    isColliding: false,
    collisionCount: 0,
  })

  // Publish collision outputs
  const publishCollisionState = useCallback(() => {
    const node = aninodeStore.nodes[id]
    if (!node) return

    const state = collisionStateRef.current

    if (outputCollisions) {
      // Only publish if changed
      if (
        state.isColliding !== lastPublished.current.isColliding ||
        state.collisionCount !== lastPublished.current.collisionCount
      ) {
        node.outputs.isColliding = state.isColliding
        node.outputs.collisionCount = state.collisionCount
        node.outputs.lastCollisionId = state.lastCollisionId
        
        lastPublished.current.isColliding = state.isColliding
        lastPublished.current.collisionCount = state.collisionCount
      }
    }

    if (outputOverlaps) {
      node.outputs.overlappingIds = [...state.overlappingIds]
    }

    // Always publish surface properties (these are configuration values)
    node.outputs.friction = friction
    node.outputs.bounciness = bounciness
    node.outputs.adhesion = adhesion
    node.outputs.surfaceType = surfaceType
  }, [id, friction, bounciness, adhesion, surfaceType, outputCollisions, outputOverlaps])

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

  // Publish initial state and shape configuration
  useEffect(() => {
    if (!id) return

    const node = aninodeStore.nodes[id]
    if (!node) return

    // Publish shape configuration for physics engine
    node.outputs.collisionShape = shape
    node.outputs.shapeWidth = shapeWidth
    node.outputs.shapeHeight = shapeHeight
    node.outputs.shapeOffsetX = shapeOffsetX
    node.outputs.shapeOffsetY = shapeOffsetY
    node.outputs.autoShape = autoShape

    // Publish collision groups
    node.outputs.collisionGroup = collisionGroup
    node.outputs.collisionMask = collisionMask

    // Publish surface properties
    node.outputs.surfaceType = surfaceType
    node.outputs.platformDirection = platformDirection
    node.outputs.onCollisionResponse = onCollisionResponse

    // Initial state
    publishCollisionState()
  }, [
    id,
    shape,
    shapeWidth,
    shapeHeight,
    shapeOffsetX,
    shapeOffsetY,
    autoShape,
    collisionGroup,
    collisionMask,
    surfaceType,
    platformDirection,
    onCollisionResponse,
    publishCollisionState,
  ])

  // Simulation loop for collision detection
  // Note: In a full implementation, this would interface with Rapier
  // For now, it just maintains the output state
  useEffect(() => {
    if (!id) return

    const checkCollisions = () => {
      // In full implementation, this would:
      // 1. Get collision data from Rapier physics world
      // 2. Update collisionStateRef
      // 3. Publish changes
      
      // For now, just ensure state is published
      publishCollisionState()
    }

    // Initial check
    checkCollisions()

    // Periodic update (would be replaced by event-driven in full impl)
    const interval = setInterval(checkCollisions, 100)

    return () => clearInterval(interval)
  }, [id, publishCollisionState])

  // Headless node
  return null
}

// ============================================================================
// EXPORTS
// ============================================================================

export { CollisionNode as default }
