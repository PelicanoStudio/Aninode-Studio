/**
 * PhysicsTestObject - R3F component for physics test objects in NodeTester
 * 
 * Uses @react-three/rapier for real physics simulation.
 * Syncs physics state back to aninodeStore.
 */

import { aninodeStore } from '@core/store'
import { useFrame } from '@react-three/fiber'
import { BallCollider, CuboidCollider, RigidBody } from '@react-three/rapier'
import { useRef } from 'react'

export type PhysicsTestObjectProps = {
  id: string
  type: 'floor' | 'ball' | 'box'
  initialPosition: [number, number, number]
  size: [number, number]
  color: string
  isStatic: boolean
  isSelected: boolean
  // Node configurations (from attached nodes)
  physicsConfig?: {
    mass?: number
    linearDamping?: number
    angularDamping?: number
    gravityScale?: number
    mode?: string
  }
  collisionConfig?: {
    shape?: string
    bounciness?: number
    friction?: number
    surfaceType?: string
    isSensor?: boolean
  }
  // Callbacks
  onPositionUpdate?: (x: number, y: number) => void
  onSelect?: () => void
  // For pausing physics
  isPaused?: boolean
  // Physics node ID for output publishing
  physicsNodeId?: string
}

export function PhysicsTestObject({
  id,
  type,
  initialPosition,
  size,
  color,
  isStatic,
  isSelected,
  physicsConfig,
  collisionConfig,
  onPositionUpdate,
  onSelect,
  physicsNodeId,
}: PhysicsTestObjectProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rigidBodyRef = useRef<any>(null)
  const lastPublished = useRef({ x: 0, y: 0 })

  // Determine body type
  const bodyType = isStatic || physicsConfig?.mode === 'Static' 
    ? 'fixed' 
    : physicsConfig?.mode === 'Kinematic' 
      ? 'kinematicPosition' 
      : 'dynamic'

  // Physics properties
  const mass = physicsConfig?.mass ?? 1
  const linearDamping = physicsConfig?.linearDamping ?? 0.1
  const angularDamping = physicsConfig?.angularDamping ?? 0.1
  const gravityScale = physicsConfig?.gravityScale ?? 1

  // Collision properties
  const restitution = collisionConfig?.bounciness ?? 0.3
  const friction = collisionConfig?.friction ?? 0.5
  const isSensor = collisionConfig?.surfaceType === 'Trigger' || collisionConfig?.isSensor

  // Determine collider shape
  const isCircle = type === 'ball' || collisionConfig?.shape === 'Circle'

  // Sync physics position back to parent
  useFrame(() => {
    if (!rigidBodyRef.current || bodyType === 'fixed') return

    const pos = rigidBodyRef.current.translation()
    const vel = rigidBodyRef.current.linvel()

    // Only publish if changed significantly
    const threshold = 0.01
    if (
      Math.abs(pos.x - lastPublished.current.x) > threshold ||
      Math.abs(pos.y - lastPublished.current.y) > threshold
    ) {
      // Convert back to pixel coordinates (Rapier uses meters)
      const pixelX = pos.x * 100
      const pixelY = -pos.y * 100

      onPositionUpdate?.(pixelX, pixelY)
      lastPublished.current = { x: pos.x, y: pos.y }

      // Publish to the attached physics node if specified
      if (physicsNodeId && aninodeStore.nodes[physicsNodeId]) {
        const node = aninodeStore.nodes[physicsNodeId]
        if (node.outputs) {
          node.outputs.positionX = pixelX
          node.outputs.positionY = pixelY
          node.outputs.x = pixelX
          node.outputs.y = pixelY
          node.outputs.velocityX = vel.x * 100
          node.outputs.velocityY = -vel.y * 100
          node.outputs.speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y) * 100
        }
      }
    }
  })

  // Visual dimensions (in Rapier units - meters)
  const width = size[0] / 100
  const height = size[1] / 100
  const depth = 0.2 // Thin for 2D

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={initialPosition}
      type={bodyType}
      mass={mass}
      linearDamping={linearDamping}
      angularDamping={angularDamping}
      gravityScale={gravityScale}
      restitution={restitution}
      friction={friction}
      sensor={isSensor}
      // Lock Z axis for 2D
      enabledTranslations={[true, true, false]}
      enabledRotations={[false, false, true]}
    >
      {/* Collider */}
      {isCircle ? (
        <BallCollider args={[width / 2]} />
      ) : (
        <CuboidCollider args={[width / 2, height / 2, depth / 2]} />
      )}

      {/* Visual mesh */}
      <mesh onClick={onSelect}>
        {isCircle ? (
          <sphereGeometry args={[width / 2, 32, 32]} />
        ) : (
          <boxGeometry args={[width, height, depth]} />
        )}
        <meshStandardMaterial 
          color={color}
          emissive={isSelected ? '#667eea' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>

      {/* Label */}
      {/* Note: We could add a Text component from @react-three/drei but keeping it simple for now */}
    </RigidBody>
  )
}

export default PhysicsTestObject
