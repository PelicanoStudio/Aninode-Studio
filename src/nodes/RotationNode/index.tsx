import { useEffect, useRef } from 'react'
import { useMotionValue, animate } from 'framer-motion'
import { aninodeStore } from '@core/store'
import { useNodeRegistration } from '@core/useNodeRegistration'

export type RotationNodeProps = {
  id: string
  name?: string

  // Mode
  mode: 'Static' | 'Animated' | 'Controlled'

  // Static mode
  staticAngle: number // degrees

  // Animated mode
  animationEnabled: boolean
  startAngle: number // degrees
  endAngle: number // degrees (for limited rotation)
  speed: number // rotations per second
  direction: 'CW' | 'CCW' // Clockwise or Counter-clockwise
  continuous: boolean // If true, rotates infinitely
  duration: number // seconds (for non-continuous)
  loop: boolean
  yoyo: boolean // reverse direction on loop

  // Controlled mode (receives input from other nodes)
  inputNodeId?: string
  inputProperty?: string
  multiplier: number // multiply input value
  offset: number // add to result

  // Transform origin (pivot point)
  anchorX: number // 0-100 (percentage)
  anchorY: number // 0-100 (percentage)
}

// Auto-mapping preset for ObjectPicker
const AUTO_MAPPING_PRESET = {
  rotation: 'rotation',
  anchorX: 'rotationAnchorX',
  anchorY: 'rotationAnchorY',
}

export function RotationNode({
  id,
  name = 'Rotation',
  mode = 'Static',
  staticAngle = 0,
  animationEnabled = true,
  startAngle = 0,
  endAngle = 360,
  speed = 1,
  direction = 'CW',
  continuous = true,
  duration = 2,
  loop = false,
  yoyo = false,
  inputNodeId,
  inputProperty,
  multiplier = 1,
  offset = 0,
  anchorX = 50,
  anchorY = 50,
}: RotationNodeProps) {
  // Reconstruct props for registration
  const baseProps = {
    id,
    name,
    mode,
    staticAngle,
    animationEnabled,
    startAngle,
    endAngle,
    speed,
    direction,
    continuous,
    duration,
    loop,
    yoyo,
    inputNodeId,
    inputProperty,
    multiplier,
    offset,
    anchorX,
    anchorY,
  }

  // Register node
  useNodeRegistration(id, 'RotationNode' as any, baseProps)

  // Animation state
  const rotation = useMotionValue(staticAngle)
  const lastPublishedValue = useRef<number>(staticAngle)

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

  // Main rotation logic
  useEffect(() => {
    if (!id) return

    // Helper: Publish rotation value (with anti-jitter)
    const publishRotation = (value: number) => {
      const rounded = Math.round(value * 100) / 100 // Round to 2 decimals
      if (rounded !== lastPublishedValue.current) {
        lastPublishedValue.current = rounded
        if (aninodeStore.nodes[id]) {
          aninodeStore.nodes[id].outputs.rotation = rounded
          aninodeStore.nodes[id].outputs.anchorX = anchorX
          aninodeStore.nodes[id].outputs.anchorY = anchorY
        }
      }
    }

    // MODE 1: Static
    if (mode === 'Static') {
      rotation.set(staticAngle)
      publishRotation(staticAngle)
      return
    }

    // MODE 2: Animated
    if (mode === 'Animated' && animationEnabled) {
      const directionMultiplier = direction === 'CW' ? 1 : -1

      if (continuous) {
        // Infinite rotation
        const animDuration = 1 / Math.abs(speed) // Time for one full rotation

        rotation.set(startAngle)

        const controls = animate(rotation, startAngle + 360 * directionMultiplier, {
          duration: animDuration,
          ease: 'linear',
          repeat: Infinity,
          onUpdate: (latest) => publishRotation(latest),
        })

        return () => {
          controls.stop()
        }
      } else {
        // Limited rotation (from startAngle to endAngle)
        rotation.set(startAngle)

        const controls = animate(rotation, endAngle, {
          duration: duration,
          ease: 'linear',
          repeat: loop ? Infinity : 0,
          repeatType: yoyo ? 'reverse' : 'loop',
          onUpdate: (latest) => publishRotation(latest),
        })

        return () => {
          controls.stop()
        }
      }
    }

    // MODE 3: Controlled (from other node)
    if (mode === 'Controlled' && inputNodeId && inputProperty) {
      // Subscribe to input node changes
      const unsubscribe = rotation.onChange((latest) => {
        publishRotation(latest)
      })

      // Update based on input node
      const updateFromInput = () => {
        const inputNode = aninodeStore.nodes[inputNodeId]
        if (!inputNode) return

        const inputValue = inputNode.outputs[inputProperty]
        if (inputValue !== undefined) {
          const result = inputValue * multiplier + offset
          rotation.set(result)
        }
      }

      // Initial update
      updateFromInput()

      // Watch for changes (simple polling for now)
      const interval = setInterval(updateFromInput, 16) // ~60fps

      return () => {
        unsubscribe()
        clearInterval(interval)
      }
    }

    // Fallback: publish current value
    publishRotation(rotation.get())
  }, [
    id,
    mode,
    staticAngle,
    animationEnabled,
    startAngle,
    endAngle,
    speed,
    direction,
    continuous,
    duration,
    loop,
    yoyo,
    inputNodeId,
    inputProperty,
    multiplier,
    offset,
    anchorX,
    anchorY,
    // DON'T include 'rotation' here - it causes infinite loops!
  ])

  // Invisible component (headless node)
  return null
}
