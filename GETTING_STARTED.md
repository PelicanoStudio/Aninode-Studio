# Getting Started with Aninode MVP

## What's Been Built

Your Aninode MVP now has a solid GSAP-powered foundation:

### Completed

1. **Project Structure**
   - Modern React + TypeScript + Vite setup
   - Organized folder structure with path aliases
   - All necessary dependencies configured

2. **Core Engine**
   - Valtio state management system
   - Node registration system
   - Property resolution (3-level hierarchy)
   - Type definitions for all core concepts

3. **Animation Engine: GSAP**
   - All nodes migrated from Framer Motion to GSAP
   - Frame-perfect timeline seeking capability
   - Ready for video export pipeline
   - Smaller bundle size for exports

4. **Working Nodes**
   - **RotationNode**: Static/Animated/Controlled modes, GSAP-powered
   - **ScaleNode**: Uniform/non-uniform, multiple easings
   - **OpacityNode**: fadeIn, fadeOut, pulse, blink effects
   - **LFONode**: sine, triangle, square, sawtooth, noise waveforms

5. **UI Layout**
   - Professional 4-panel layout
   - Node Tester playground for testing nodes
   - Multi-node support with LFO connections

---

## Quick Start

### 1. Install Dependencies

```bash
cd aninode-mvp
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### 3. Test Nodes

Navigate to the Node Tester (`/tester` or click the test button):
1. Click node type buttons to add nodes (Rotation, Scale, Opacity, LFO)
2. Select a node from the chips to edit its properties
3. Watch the preview box animate
4. Try connecting LFO to other nodes via "Controlled" mode

---

## Architecture

### Animation Engine

**GSAP** is the sole animation engine. All nodes use GSAP tweens:

```typescript
// Example: Creating a GSAP tween in a node
const tweenRef = useRef<gsap.core.Tween | null>(null)

useEffect(() => {
  tweenRef.current = gsap.to(stateRef.current, {
    rotation: 360,
    duration: 2,
    repeat: -1,  // Infinite
    ease: 'none',
    onUpdate: () => {
      aninodeStore.nodes[id].outputs.rotation = stateRef.current.rotation
    }
  })

  return () => tweenRef.current?.kill()
}, [dependencies])
```

### Why GSAP?

| Feature | Benefit |
|---------|---------|
| Timeline seeking | Frame-perfect video export |
| PixiPlugin | Native WebGL integration |
| No React runtime | Smaller export bundles |
| Industry standard | Production-proven |

---

## Creating New Nodes

### Basic Template

```typescript
// src/nodes/MyNode/index.tsx
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { aninodeStore } from '@core/store'
import { useNodeRegistration } from '@core/useNodeRegistration'

export type MyNodeProps = {
  id: string
  name?: string
  mode: 'Static' | 'Animated' | 'Controlled'
  // ... your props
}

export function MyNode({ id, name = 'MyNode', mode, ...props }: MyNodeProps) {
  // 1. Register node
  useNodeRegistration(id, 'MyNode' as any, { id, name, mode, ...props })

  // 2. State for GSAP (plain object, not React state)
  const stateRef = useRef({ value: 0 })
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  // 3. Animation logic
  useEffect(() => {
    // Kill previous tween
    if (tweenRef.current) {
      tweenRef.current.kill()
      tweenRef.current = null
    }

    // Publish helper
    const publish = (value: number) => {
      if (aninodeStore.nodes[id]) {
        aninodeStore.nodes[id].outputs.value = value
      }
    }

    // MODE: Static
    if (mode === 'Static') {
      publish(props.staticValue)
      return
    }

    // MODE: Animated
    if (mode === 'Animated') {
      tweenRef.current = gsap.to(stateRef.current, {
        value: props.endValue,
        duration: props.duration,
        ease: 'power2.inOut',
        repeat: props.loop ? -1 : 0,
        yoyo: props.yoyo,
        onUpdate: () => publish(stateRef.current.value),
      })

      return () => tweenRef.current?.kill()
    }

    // MODE: Controlled
    if (mode === 'Controlled' && props.inputNodeId) {
      const interval = setInterval(() => {
        const input = aninodeStore.nodes[props.inputNodeId]?.outputs[props.inputProperty]
        if (input !== undefined) {
          const result = input * props.multiplier + props.offset
          publish(result)
        }
      }, 16)

      return () => clearInterval(interval)
    }
  }, [id, mode, /* other deps */])

  return null // Headless
}
```

---

## GSAP Quick Reference

### Easing Names

```typescript
const GSAP_EASING = {
  linear: 'none',
  easeIn: 'power2.in',
  easeOut: 'power2.out',
  easeInOut: 'power2.inOut',
  spring: 'elastic.out(1, 0.3)',
  bounce: 'bounce.out',
  back: 'back.out(1.7)',
}
```

### Common Patterns

```typescript
// Infinite loop
gsap.to(obj, { x: 100, repeat: -1 })

// Ping-pong (yoyo)
gsap.to(obj, { x: 100, repeat: -1, yoyo: true })

// Delayed start
gsap.to(obj, { x: 100, delay: 0.5 })

// Stagger (multiple targets)
gsap.to('.item', { x: 100, stagger: 0.1 })

// Timeline
const tl = gsap.timeline()
tl.to(obj, { x: 100, duration: 1 })
tl.to(obj, { y: 100, duration: 1 })

// Seeking (for video export)
tl.seek(1.5)  // Jump to 1.5 seconds
tl.progress(0.5)  // Jump to 50%
```

---

## Project Structure

```
src/
├── core/                    # Engine core
│   ├── store.ts            # Valtio state
│   ├── useNodeRegistration.ts
│   └── resolveProperty.ts
│
├── nodes/                   # Animation nodes
│   ├── RotationNode/       # GSAP rotation
│   ├── ScaleNode/          # GSAP scaling
│   ├── OpacityNode/        # GSAP opacity
│   └── LFONode/            # RAF oscillator
│
├── components/              # UI
│   ├── Layout/
│   ├── Viewport/
│   └── ...
│
├── pages/
│   └── NodeTester.tsx      # Testing playground
│
└── App.tsx
```

---

## What's Next?

### Immediate Next Steps

1. **More Nodes**
   - PositionNode (X/Y animation)
   - DeformationNode (squash, stretch, skew)
   - ColorNode (tint, color animation)

2. **Scene Integration**
   - ObjectPickerNode (select layers)
   - SceneAnimatorNode (apply nodes to scene)

3. **Visual Node Editor**
   - Install React Flow
   - Drag-and-drop nodes
   - Visual connections

### Future Features

- GSAP Timeline UI with scrubbing
- Video export (FFmpeg.wasm)
- PixiJS renderer integration
- Sprite atlas support
- MIDI/trigger input nodes

---

## Common Issues

### Infinite Re-render Loop

**Problem**: Node causes "Maximum update depth exceeded"

**Solution**: Don't use `useSnapshot` for 60fps values. Use RAF polling:

```typescript
// BAD
const snap = useSnapshot(aninodeStore)
const value = snap.nodes[id]?.outputs.value

// GOOD
const [value, setValue] = useState(0)
useEffect(() => {
  let rafId: number
  const update = () => {
    setValue(aninodeStore.nodes[id]?.outputs.value ?? 0)
    rafId = requestAnimationFrame(update)
  }
  rafId = requestAnimationFrame(update)
  return () => cancelAnimationFrame(rafId)
}, [id])
```

### Tween Not Stopping

**Problem**: Animation continues after component unmount

**Solution**: Always kill tweens in cleanup:

```typescript
useEffect(() => {
  const tween = gsap.to(...)
  return () => tween.kill()
}, [])
```

---

## Resources

- **GSAP Docs**: https://greensock.com/docs/
- **GSAP Easing Visualizer**: https://greensock.com/docs/v3/Eases
- **Valtio Docs**: https://valtio.pmnd.rs/
- **React Flow**: https://reactflow.dev/

---

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npx tsc --noEmit  # Type check
```

---

*Updated: 2024-12-01*
*Animation Engine: GSAP*
