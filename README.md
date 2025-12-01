# Aninode MVP - Token Optimization Manual

> **Purpose**: Enable efficient AI-assisted development by providing structured project maps, conventions, and quick-reference guides.

---

## Project Structure Map

```
aninode-mvp/
├── src/
│   ├── core/                    # Engine core systems
│   │   ├── store.ts             # Valtio state (aninodeStore, storeActions)
│   │   ├── useNodeRegistration.ts  # Node lifecycle hook
│   │   └── resolveProperty.ts   # 3-Level Hierarchy resolver
│   │
│   ├── types/                   # TypeScript definitions
│   │   └── index.ts             # All shared types (NodeState, Connection, etc.)
│   │
│   ├── nodes/                   # Animation nodes (the heart of Aninode)
│   │   ├── RotationNode/        # GSAP-powered rotation
│   │   ├── ScaleNode/           # GSAP-powered scaling
│   │   ├── OpacityNode/         # GSAP-powered opacity effects
│   │   └── LFONode/             # Signal generator (RAF-based)
│   │
│   ├── components/              # UI components
│   │   ├── Layout/              # App shell (Left/Center/Right/Bottom)
│   │   ├── TopBar/              # Header toolbar
│   │   ├── NodeEditor/          # Visual node graph (future: React Flow)
│   │   ├── Viewport/            # Scene preview (future: PixiJS/Three.js)
│   │   ├── PropertiesPanel/     # Node property editor
│   │   └── Timeline/            # Animation timeline (future: GSAP scrubbing)
│   │
│   ├── pages/                   # Full-page views
│   │   └── NodeTester.tsx       # Node testing playground
│   │
│   └── App.tsx                  # Root component + view switcher
│
├── tsconfig.json                # TypeScript config (path aliases)
├── vite.config.ts               # Vite config (aliases, server)
└── package.json                 # Dependencies
```

---

## Architecture Overview

### Engine Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      ANINODE ENGINE v2                           │
│                    (GSAP-Centric Architecture)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   NODES      │───▶│    STORE     │───▶│   RENDERER   │       │
│  │ (Headless)   │    │  (Valtio)    │    │ (Pluggable)  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                    │               │
│         ▼                   ▼                    ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │RotationNode  │    │ NodeState    │    │  DOM/CSS     │       │
│  │ScaleNode     │    │ Connections  │    │  PixiJS      │       │
│  │OpacityNode   │    │ Timeline     │    │  Three.js    │       │
│  │LFONode       │    │ Presets      │    │  Raw WebGL   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
│  Animation Engine: GSAP (all tweens, timelines, seeking)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3-Level Property Hierarchy

```
Priority 1 (Highest): OVERRIDES     ← From node connections
Priority 2:           PRESETS       ← Named reusable configs
Priority 3 (Lowest):  BASE PROPS    ← UI-set defaults
```

### Node Data Flow

```
Node Props → useNodeRegistration → aninodeStore.nodes[id]
                                          ↓
                                   GSAP Tween/RAF Loop
                                          ↓
                                   aninodeStore.nodes[id].outputs
                                          ↓
                                   Connected Nodes / Renderer
```

---

## Tech Stack

### Development Environment
| Layer | Technology | Purpose |
|-------|------------|---------|
| UI Framework | React 18 | Component system (dev only) |
| Language | TypeScript | Type safety |
| State | Valtio | Proxy-based reactivity |
| **Animation** | **GSAP** | All animation (tweens, timelines) |
| 2D Render | PixiJS (planned) | WebGL sprites |
| 3D Render | Three.js / R3F | 3D/2.5D scenes |
| Node Editor | React Flow (planned) | Visual programming |
| Build | Vite | Fast bundling |

### Export Profiles (Tree-Shakeable)
```
"e-learning"     → GSAP + DOM           (~30KB)
"web-animation"  → GSAP + PixiJS        (~80KB)
"3d-scene"       → GSAP + Three.js      (~150KB)
"projection"     → GSAP + WebGL Raw     (~40KB)
"short-film"     → GSAP + Full Stack    (~200KB)
```

---

## Naming Conventions

### Files
| Type | Pattern | Example |
|------|---------|---------|
| Node | `{Name}Node/index.tsx` | `RotationNode/index.tsx` |
| Component | `{Name}/index.tsx` | `Viewport/index.tsx` |
| Hook | `use{Name}.ts` | `useNodeRegistration.ts` |
| Types | `types/index.ts` | Central type exports |
| Styles | `{Name}.module.css` | `Layout.module.css` |

### Code
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `RotationNode`, `TopBar` |
| Hooks | camelCase, `use` prefix | `useNodeRegistration` |
| Store | camelCase | `aninodeStore`, `storeActions` |
| Types | PascalCase | `NodeState`, `RotationNodeProps` |
| Constants | UPPER_SNAKE | `AUTO_MAPPING_PRESET` |
| CSS classes | camelCase (modules) | `styles.container` |

---

## Key Types Reference

```typescript
// Node in the graph
type NodeState = {
  id: string
  type: NodeType
  name: string
  position: { x: number; y: number }
  baseProps: Record<string, any>      // Level 1
  overrides: Record<string, any>      // Level 3
  outputs: Record<string, any>        // Published values
  connectedInputs: Record<string, ConnectedInput | null>
}

// Node types
type NodeType = 'RotationNode' | 'ScaleNode' | 'OpacityNode' | 'LFONode' | ...

// Connection between nodes
type Connection = {
  id: string
  sourceNodeId: string
  sourceOutput: string
  targetNodeId: string
  targetInput: string
}
```

---

## Common Patterns

### Creating a New Node (GSAP)

```typescript
// src/nodes/{NodeName}/index.tsx
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { aninodeStore } from '@core/store'
import { useNodeRegistration } from '@core/useNodeRegistration'

export function MyNode({ id, name = 'MyNode', ...props }: MyNodeProps) {
  useNodeRegistration(id, 'MyNode', { id, name, ...props })

  const stateRef = useRef({ value: 0 })
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    // Kill existing tween on prop change
    if (tweenRef.current) tweenRef.current.kill()

    // Create GSAP animation
    tweenRef.current = gsap.to(stateRef.current, {
      value: 100,
      duration: 2,
      repeat: -1,
      yoyo: true,
      onUpdate: () => {
        if (aninodeStore.nodes[id]) {
          aninodeStore.nodes[id].outputs.value = stateRef.current.value
        }
      }
    })

    return () => {
      if (tweenRef.current) tweenRef.current.kill()
    }
  }, [id, /* dependencies */])

  return null // Headless
}
```

### GSAP Easing Map

```typescript
const GSAP_EASING_MAP: Record<string, string> = {
  linear: 'none',
  easeIn: 'power2.in',
  easeOut: 'power2.out',
  easeInOut: 'power2.inOut',
  spring: 'elastic.out(1, 0.3)',
}
```

### Reading Node Outputs (Without Re-render Loop)

```typescript
// ✅ GOOD: Poll with requestAnimationFrame
useEffect(() => {
  let rafId: number
  const update = () => {
    const node = aninodeStore.nodes[id]
    if (node) setValue(node.outputs.value)
    rafId = requestAnimationFrame(update)
  }
  rafId = requestAnimationFrame(update)
  return () => cancelAnimationFrame(rafId)
}, [id])
```

---

## Node Inventory

### Transform Nodes
| Node | Status | Outputs | Animation Engine |
|------|--------|---------|------------------|
| `RotationNode` | ✅ Working | `rotation`, `anchorX`, `anchorY` | GSAP |
| `ScaleNode` | ✅ Working | `scaleX`, `scaleY`, `anchorX`, `anchorY` | GSAP |
| `PositionNode` | 🔜 Planned | `x`, `y` | GSAP |
| `DeformNode` | 🔜 Planned | `skewX`, `skewY`, `squash`, `stretch` | GSAP |

### Appearance Nodes
| Node | Status | Outputs | Animation Engine |
|------|--------|---------|------------------|
| `OpacityNode` | ✅ Working | `opacity` | GSAP |
| `ColorNode` | 🔜 Planned | `color`, `tint` | GSAP |

### Signal Generators
| Node | Status | Outputs | Animation Engine |
|------|--------|---------|------------------|
| `LFONode` | ✅ Working | `value`, `normalized`, `phase` | RAF (native) |
| `CurveNode` | 🔜 Planned | `value` | GSAP CustomEase |
| `TriggerNode` | 🔜 Planned | `triggered`, `value` | Events |

### Media Nodes (Planned)
| Node | Purpose |
|------|---------|
| `SpriteNode` | PixiJS animated sprites |
| `FrameAnimNode` | Frame-by-frame animation |
| `VideoNode` | Video texture playback |
| `SubtitleNode` | Timed text overlay |

### Export Nodes (Planned)
| Node | Purpose |
|------|---------|
| `VideoExportNode` | MP4/WebM rendering |
| `AudioExportNode` | Track compilation |
| `StaticZoneAnalyzer` | Optimization detection |

---

## Path Aliases

| Alias | Path |
|-------|------|
| `@core/*` | `./src/core/*` |
| `@components/*` | `./src/components/*` |
| `@nodes/*` | `./src/nodes/*` |
| `@types/*` | `./src/types/*` |
| `@pages/*` | `./src/pages/*` |

---

## Error Solutions Reference

### TypeScript Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot find module '*.module.css'` | Missing CSS module types | Add to `vite-env.d.ts`: `declare module '*.module.css'` |
| `Cannot import type declaration files '@types/index'` | Wrong import syntax | Use relative: `from '../types'` not `from '@types/index'` |
| `Cannot find module 'path'` | Missing Node types | `npm install -D @types/node` |

### Runtime Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Maximum update depth exceeded` | Infinite re-render loop | Use RAF polling, not useSnapshot for 60fps values |
| Node register/unregister spam | useEffect deps wrong | Don't include animated values in deps |

### GSAP-Specific

| Pattern | Correct Usage |
|---------|---------------|
| Cleanup | Always call `tween.kill()` in useEffect cleanup |
| Repeat | Use `-1` for infinite (not `Infinity`) |
| Yoyo | Use `yoyo: true` property (not repeatType) |
| Easing | Use GSAP names: `'power2.inOut'`, `'none'`, `'elastic.out(1, 0.3)'` |

---

## Commands

```bash
npm run dev       # Dev server :3000
npm run build     # Production build
npx tsc --noEmit  # Type check all
```

---

## Communication Protocol

**New Node:**
```
Create {NodeName}: props={list}, modes={list}, outputs={list}
```

**Bug Report:**
```
Error: {file}:{line} - {message}
```

**Feature:**
```
Add {feature} to {file}
```

---

*Updated: 2024-12-01*
*Animation Engine: GSAP (Framer Motion removed)*
