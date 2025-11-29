# Aninode MVP - Token Optimization Manual

> **Purpose**: Enable efficient AI-assisted development by providing structured project maps, conventions, and quick-reference guides.

---

## 📁 Project Structure Map

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
│   │   └── RotationNode/
│   │       ├── index.tsx        # Headless node logic
│   │       ├── RotationNodeTester.tsx  # Testing UI
│   │       └── RotationNodeTester.module.css
│   │
│   ├── components/              # UI components
│   │   ├── Layout/              # App shell (Left/Center/Right/Bottom)
│   │   ├── TopBar/              # Header toolbar
│   │   ├── NodeEditor/          # Visual node graph (future)
│   │   ├── Viewport/            # Scene preview (future: PixiJS/Three.js)
│   │   ├── PropertiesPanel/     # Node property editor
│   │   └── Timeline/            # Animation timeline
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

## 🏗️ Architecture Overview

### Core Concepts

```
┌─────────────────────────────────────────────────────────────┐
│                      ANINODE ENGINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   NODES      │───▶│    STORE     │───▶│   RENDERER   │  │
│  │ (Headless)   │    │  (Valtio)    │    │ (PixiJS/CSS) │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                    │          │
│         ▼                   ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │RotationNode  │    │ NodeState    │    │  Viewport    │  │
│  │DeformNode    │    │ Connections  │    │  (Canvas)    │  │
│  │ScaleNode     │    │ Timeline     │    │              │  │
│  │ColorNode     │    │ Presets      │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
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
                                   Node Logic (useEffect)
                                          ↓
                                   aninodeStore.nodes[id].outputs
                                          ↓
                                   Connected Nodes / Renderer
```

---

## 🔤 Naming Conventions

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

## 📦 Key Types Reference

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

// Node types (extend as needed)
type NodeType = 'RotationNode' | 'DeformationNode' | 'ScaleNode' | ...

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

## 🛠️ Common Patterns

### Creating a New Node

```typescript
// src/nodes/{NodeName}/index.tsx
export function {NodeName}({ id, name = '{NodeName}', ...props }: {NodeName}Props) {
  useNodeRegistration(id, '{NodeName}', { id, name, ...props })
  
  useEffect(() => {
    // Publish outputs
    if (aninodeStore.nodes[id]) {
      aninodeStore.nodes[id].outputs.value = computedValue
    }
  }, [id, /* dependencies - NOT motion values */])

  return null // Headless
}
```

### Reading Node Outputs (Without Re-render Loop)

```typescript
// ❌ BAD: useSnapshot causes infinite re-renders with animated values
const snap = useSnapshot(aninodeStore)

// ✅ GOOD: Poll with requestAnimationFrame
useEffect(() => {
  const update = () => {
    const node = aninodeStore.nodes[id]
    if (node) setValue(node.outputs.value)
    rafId = requestAnimationFrame(update)
  }
  let rafId = requestAnimationFrame(update)
  return () => cancelAnimationFrame(rafId)
}, [id])
```

---

## 🗺️ Function Map

| Function | File | Purpose |
|----------|------|---------|
| `useNodeRegistration` | `core/useNodeRegistration.ts` | Register/unregister nodes |
| `resolveProperty` | `core/resolveProperty.ts` | 3-Level hierarchy lookup |
| `storeActions.addNode` | `core/store.ts` | Add node to store |
| `storeActions.removeNode` | `core/store.ts` | Remove node + connections |
| `storeActions.addConnection` | `core/store.ts` | Connect two nodes |

---

## 🎯 Path Aliases

| Alias | Path |
|-------|------|
| `@core/*` | `./src/core/*` |
| `@components/*` | `./src/components/*` |
| `@nodes/*` | `./src/nodes/*` |
| `@types/*` | `./src/types/*` |
| `@pages/*` | `./src/pages/*` |

---

## 📋 Node Inventory

### Transform Nodes
| Node | Status | Outputs | Purpose |
|------|--------|---------|---------|
| `RotationNode` | ✅ Working | `rotation`, `anchorX`, `anchorY` | Rotate layers |
| `ScaleNode` | ✅ Working | `scaleX`, `scaleY`, `anchorX`, `anchorY` | Scale animations |
| `PositionNode` | 🔜 Planned | `x`, `y` | Position animations |

### Appearance Nodes
| Node | Status | Outputs | Purpose |
|------|--------|---------|---------|
| `OpacityNode` | ✅ Working | `opacity` | Fade effects (fadeIn/fadeOut/pulse/blink) |
| `ColorNode` | 🔜 Planned | `color`, `tint` | Color/tint animations |
| `DeformationNode` | 🔜 Planned | `skewX`, `skewY`, `squash`, `stretch` | Squash & stretch |

### Signal Generators
| Node | Status | Outputs | Purpose |
|------|--------|---------|---------|
| `LFONode` | ✅ Working | `value`, `normalized`, `phase` | Oscillator (sine/triangle/square/sawtooth/noise) |
| `CurveNode` | 🔜 Planned | `value` | Custom easing curves |
| `TriggerNode` | 🔜 Planned | `triggered`, `value` | Event triggers |

### Scene Control
| Node | Status | Purpose |
|------|--------|---------|
| `SceneAnimatorNode` | 🔜 Planned | Apply nodes to scene layers |
| `ObjectPickerNode` | 🔜 Planned | Select layers from scene |

---

## 🔧 Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Language | TypeScript | Type safety |
| UI | React 18 | Components |
| State | Valtio | Proxy reactivity |
| Animation | Framer Motion | MotionValues |
| Build | Vite | Fast bundling |
| 2D Render | PixiJS (planned) | WebGL sprites |
| 3D/2.5D | Three.js + R3F | WebGL hybrid scenes |
| Advanced 2D | WebGL shaders | PxlMorpher, effects |

### Rendering Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    RENDER LAYER (Pluggable)                  │
├─────────────────────────────────────────────────────────────┤
│  CSS Renderer     → Simple DOM transforms (current)          │
│  PixiJS Renderer  → 2D sprites, high performance            │
│  Three.js/R3F     → 3D scenes, 2.5D, hybrid                 │
│  WebGL Shaders    → Complex effects (PxlMorpher, distort)   │
└─────────────────────────────────────────────────────────────┘
```

**WebGL serves multiple purposes:**
- Pure 2D sprite rendering (PixiJS)
- 2.5D parallax/depth effects
- 3D scene integration
- Advanced 2D effects requiring shaders (morphing, distortion)

---

## 🐛 Error Solutions Reference

### TypeScript Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot find module '*.module.css'` | Missing CSS module types | Add to `vite-env.d.ts`: `declare module '*.module.css'` |
| `Cannot import type declaration files '@types/index'` | Wrong import syntax | Use relative: `from '../types'` not `from '@types/index'` |
| `Cannot find module 'path'` | Missing Node types | `npm install -D @types/node` |
| `Cannot find name '__dirname'` | ESM doesn't have __dirname | Use `fileURLToPath(import.meta.url)` + `dirname()` |
| `'X' is declared but never read` | Unused variable | Prefix with `_` or remove |
| `Support for defaultProps will be removed` | React 18 deprecation | Use JS default parameters instead |

### Runtime/Console Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Maximum update depth exceeded` | Infinite re-render loop | See patterns below |
| Node register/unregister spam | useEffect dependencies wrong | Don't include MotionValues in deps |
| `useSnapshot` infinite loop | Snapshot triggers on every store change | Use `requestAnimationFrame` polling instead |

### Critical Pattern: Avoiding Infinite Loops

```typescript
// ❌ CAUSES INFINITE LOOP
function NodeTester() {
  const snap = useSnapshot(aninodeStore)  // Re-renders on ANY store change
  const rotation = snap.nodes[id]?.outputs.rotation  // Node updates this 60fps
  // → Re-render → Node remounts → Updates store → Re-render...
}

// ✅ CORRECT: Poll without triggering React re-renders
function NodeTester() {
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    let rafId: number
    const update = () => {
      const node = aninodeStore.nodes[id]  // Direct access, no snapshot
      if (node?.outputs?.rotation !== undefined) {
        setRotation(node.outputs.rotation)
      }
      rafId = requestAnimationFrame(update)
    }
    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [id])
}
```

### Critical Pattern: useEffect Dependencies

```typescript
// ❌ BAD: MotionValue in dependencies causes infinite loop
const rotation = useMotionValue(0)
useEffect(() => {
  // ...animation logic
}, [rotation])  // MotionValue changes trigger effect → effect updates value → loop

// ✅ GOOD: Exclude MotionValues from dependencies
useEffect(() => {
  // ...animation logic using rotation.get() and rotation.set()
}, [id, speed, direction])  // Only include serializable props
```

---

## 💬 Communication Protocol

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

## 🚀 Commands

```bash
npm run dev       # Dev server :3000
npx tsc --noEmit  # Type check all
```

---

*Updated: 2024-11-27*
