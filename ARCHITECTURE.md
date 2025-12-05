# Aninode Engine Architecture v3.0

## The Inviolable Foundations

This document establishes the **non-negotiable architectural principles** that all future development must respect. These foundations enable tree-shaking, multi-renderer support, and the non-destructive workflow.

---

## Core Philosophy

```
┌──────────────────────────────────────────────────────────────────────┐
│  "Nodes are CONFIG PROVIDERS. Engines are COMPUTERS. Renderers DRAW." │
└──────────────────────────────────────────────────────────────────────┘
```

**The Three Laws:**

1. **Nodes never render.** They publish configuration and receive computed values.
2. **Engines never display.** They compute (physics, audio, video) and write to store.
3. **Renderers never compute.** They read transforms and draw.

---

## Tree-Shakeable Stack

Each module is **independently includable**. The export system analyzes used nodes and includes only required modules.

| Module           | Purpose                 | Size     | When Included                  |
| ---------------- | ----------------------- | -------- | ------------------------------ |
| **Valtio**       | State management        | ~3KB     | Always (core)                  |
| **GSAP Core**    | Animation tweens        | ~24KB    | Always (core)                  |
| **GSAP Plugins** | MotionPath, Morph, etc. | Variable | If nodes use them              |
| **Rapier 2D**    | 2D physics              | ~200KB   | If BodyNode/CollisionNode used |
| **Rapier 3D**    | 3D physics              | ~400KB   | If 3D physics mode             |
| **Three.js**     | 3D/2.5D rendering       | ~150KB   | If 3D renderer selected        |
| **PixiJS**       | 2D WebGL rendering      | ~100KB   | If 2D renderer selected        |
| **DOM/CSS**      | Simple rendering        | ~0KB     | Default, no dependencies       |
| **mp4-wasm**     | Video encoding          | ~500KB   | If video export                |
| **FFmpeg.wasm**  | Video/audio processing  | ~25MB    | Advanced export only           |
| **Web Workers**  | Parallel processing     | ~0KB     | For heavy computation          |

### Export Profiles (Real Numbers)

```
"micro"        → GSAP + DOM                  (~30KB)   e-learning, banners
"standard"     → GSAP + PixiJS               (~130KB)  web animations
"physics"      → GSAP + PixiJS + Rapier2D    (~330KB)  games, interactive
"cinematic"    → GSAP + Three.js             (~180KB)  2.5D, lighting
"full"         → Everything                  (~600KB)  short films
```

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LAYER 1: NODES                                 │
│                        (Pure Configuration)                              │
├─────────────────────────────────────────────────────────────────────────┤
│  Transform         Signal          Physics           Media              │
│  ├─ RotationNode   ├─ LFONode      ├─ BodyNode       ├─ SpriteNode      │
│  ├─ ScaleNode      ├─ CurveNode    ├─ ForceFieldNode ├─ VideoNode       │
│  ├─ PositionNode   ├─ NoiseNode    ├─ CollisionNode  ├─ AudioNode       │
│  └─ OpacityNode    └─ TriggerNode  └─ ConstraintNode └─ TextNode        │
│                                                                          │
│  ALL NODES:                                                              │
│  • Register in aninodeStore via useNodeRegistration                      │
│  • Publish configuration as outputs (not computed values)                │
│  • Are completely renderer-agnostic                                      │
│  • Return null (headless React components)                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                            ↓               ↓
┌───────────────────────────────┐   ┌───────────────────────────────────┐
│    LAYER 2A: ANIMATION ENGINE │   │    LAYER 2B: PHYSICS ENGINE       │
│           (GSAP)              │   │          (Rapier)                 │
├───────────────────────────────┤   ├───────────────────────────────────┤
│  • Reads node configs         │   │  • Reads BodyNode, CollisionNode  │
│  • Runs tweens/timelines      │   │  • Runs physics simulation        │
│  • Writes computed transforms │   │  • Writes position/velocity/rot   │
│  • Always included (core)     │   │  • Tree-shakeable (optional)      │
└───────────────────────────────┘   └───────────────────────────────────┘
                            ↓               ↓
                            ↓               ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 3: TARGET OBJECTS (Store)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Each asset (PSD layer, SVG, 3D mesh, video) becomes a TargetObject:    │
│                                                                          │
│  {                                                                       │
│    id: "layer_bird",                                                     │
│    assetType: "sprite" | "svg" | "mesh" | "video" | "dom",              │
│                                                                          │
│    // Original asset transforms (NEVER MODIFIED)                         │
│    base: { x, y, z, scaleX, scaleY, rotation, opacity },                │
│                                                                          │
│    // Computed by engines (sum of all modifiers)                         │
│    computed: { x, y, z, scaleX, scaleY, rotation, opacity },            │
│                                                                          │
│    // Physics state (if BodyNode attached)                               │
│    physics: { velocityX, velocityY, angularVelocity, isGrounded },      │
│                                                                          │
│    // Attached nodes (modifier chain)                                    │
│    attachedNodes: ["rotation_1", "physics_1", "lfo_1"]                  │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        LAYER 4: RENDERERS                                │
│                      (Output - Pluggable)                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  DOM/CSS         PixiJS            Three.js          Raw WebGL           │
│  ├─ Read         ├─ Read           ├─ Read           ├─ Read             │
│  │  computed     │  computed       │  computed       │  computed         │
│  │  transforms   │  transforms     │  transforms     │  transforms       │
│  └─ Apply CSS    └─ Apply to       └─ Apply to       └─ Custom           │
│     properties      Sprite            Object3D          shaders          │
│                                                                          │
│  RENDERERS NEVER COMPUTE. They only read and draw.                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Physics System Architecture (4 Core Nodes)

Based on the approved design, physics uses **4 property-cluster nodes**:

### 1. BodyNode — "What this object IS physically"

```typescript
outputs: {
  type: 'Dynamic' | 'Static' | 'Kinematic',
  mass: number,           // 0.1 - 100
  friction: number,       // 0 (ice) - 1 (rubber)
  bounciness: number,     // 0 (dead stop) - 1 (super bouncy)
  drag: number,           // Air resistance
  collisionShape: 'Box' | 'Circle' | 'Hull',
}
```

### 2. ForceFieldNode — "Gravity, Attraction & External Forces"

```typescript
outputs: {
  mode: 'Gravity' | 'Attractor' | 'Repulsor' | 'Wind' | 'Vortex',
  direction: 'Emit' | 'Respond',  // Bidirectional!
  targets: string[],              // Object IDs affected
  strength: number,
  falloff: 'Linear' | 'Quadratic' | 'None',
  radius: number,
}
```

### 3. CollisionNode — "Collision & Surface Behaviors"

```typescript
outputs: {
  surfaceType: 'Solid' | 'Trigger' | 'Platform',
  collisionGroup: number,
  collisionMask: number,
  adhesion: number,       // 0 (none) - 1 (glue)
  onCollision: 'Bounce' | 'Stick' | 'Stop' | 'Event',
}
```

### 4. ConstraintNode — "Physical Connections"

```typescript
outputs: {
  type: 'Spring' | 'Rope' | 'Weld' | 'Hinge' | 'Distance',
  connectedTo: string,    // Target object ID
  stiffness: number,
  damping: number,
  length: number,
  limits: { min: number, max: number },
}
```

### Physics Engine Module (Tree-Shakeable)

```typescript
// src/engines/PhysicsEngine.ts
// Only included if any physics node is used

class PhysicsEngine {
  private world: Rapier.World;
  private bodies: Map<string, Rapier.RigidBody>;

  // Called every frame when physics nodes exist
  step(dt: number) {
    // 1. Read node configurations from store
    // 2. Update Rapier bodies with current configs
    // 3. Step simulation
    // 4. Write computed positions back to store
  }
}
```

---

## Non-Destructive Workflow

```
┌──────────────────────────────────────────────────────────────────────┐
│                     MODIFIER CHAIN (Never Alters Source)             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Original Asset                                                       │
│       ↓                                                               │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐              │
│  │ Body    │ → │ Rotation│ → │ LFO     │ → │ Scale   │              │
│  │ Node    │   │ Node    │   │ (drives │   │ Node    │              │
│  │         │   │         │   │ rotation│   │         │              │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘              │
│       ↓             ↓             ↓             ↓                    │
│  ═══════════════════════════════════════════════════════════════     │
│                    COMPUTED TRANSFORM                                 │
│       ↓                                                               │
│  Renderer applies to visual representation                           │
│                                                                       │
│  AT ANY POINT: Disconnect a node → Object reverts to base values     │
└──────────────────────────────────────────────────────────────────────┘
```

**Key Principle:** `base` values are IMMUTABLE. All modifications are stored in `computed`. When a node is disconnected, its contribution is removed from `computed`.

---

## Asset Type Support

| Asset Type  | Import From      | Rendered By           | Physics Shape |
| ----------- | ---------------- | --------------------- | ------------- |
| **Sprite**  | PSD, PNG, JPEG   | PixiJS, Three.js      | Box, Circle   |
| **SVG**     | SVG file, Editor | DOM, PixiJS, Three.js | Path hull     |
| **3D Mesh** | GLTF, OBJ        | Three.js              | Mesh collider |
| **Video**   | MP4, WebM        | PixiJS, Three.js      | Box           |
| **DOM**     | HTML elements    | DOM                   | Box           |
| **Text**    | Editor           | DOM, PixiJS, Three.js | Box           |

---

## File Structure

```
src/
├── core/                      # ALWAYS INCLUDED
│   ├── store.ts               # Valtio state (TargetObjects, Nodes)
│   ├── useNodeRegistration.ts # Node lifecycle
│   └── types.ts               # Core type definitions
│
├── nodes/                     # TREE-SHAKEABLE (per node)
│   ├── RotationNode/
│   ├── ScaleNode/
│   ├── BodyNode/              # Triggers physics engine inclusion
│   ├── CollisionNode/
│   ├── ForceFieldNode/
│   └── ConstraintNode/
│
├── engines/                   # TREE-SHAKEABLE (per engine)
│   ├── animation/             # GSAP (always included)
│   │   └── AnimationEngine.ts
│   ├── physics/               # Rapier (included if physics nodes used)
│   │   ├── PhysicsEngine.ts
│   │   └── rapier.worker.ts   # Web Worker for physics
│   └── audio/                 # Web Audio (included if audio nodes used)
│       └── AudioEngine.ts
│
├── renderers/                 # TREE-SHAKEABLE (select ONE)
│   ├── DOMRenderer.ts         # Default, no dependencies
│   ├── PixiRenderer.ts        # 2D WebGL
│   └── ThreeRenderer.ts       # 3D / 2.5D
│
├── exporters/                 # TREE-SHAKEABLE (per export type)
│   ├── WebExporter.ts         # Standalone HTML
│   ├── VideoExporter.ts       # mp4-wasm / FFmpeg
│   └── SequenceExporter.ts    # PNG sequence
│
└── workers/                   # Web Workers
    ├── physics.worker.ts      # Rapier simulation
    ├── video.worker.ts        # Video encoding
    └── export.worker.ts       # Bundle generation
```

---

## Implementation Rules

### Rule 1: Nodes are Pure

```typescript
// ✅ CORRECT: Node publishes configuration
export function BodyNode({ id, mass, friction }: BodyNodeProps) {
  useNodeRegistration(id, 'BodyNode', { mass, friction })

  useEffect(() => {
    aninodeStore.nodes[id].outputs = { mass, friction, ... }
  }, [mass, friction])

  return null  // ALWAYS headless
}

// ❌ WRONG: Node runs physics simulation
export function BodyNode({ id }: BodyNodeProps) {
  useEffect(() => {
    // Don't do physics here! That's the physics engine's job.
    rapierWorld.step()
  })
}
```

### Rule 2: Engines Read Configs, Write Results

```typescript
// ✅ CORRECT: Engine reads node outputs, writes computed transforms
class PhysicsEngine {
  step() {
    for (const [id, obj] of targetObjects) {
      const bodyNode = getAttachedNode(obj, "BodyNode");
      if (bodyNode) {
        // Read config
        const { mass, friction } = bodyNode.outputs;
        // Simulate
        const newPos = this.simulate(obj, mass, friction);
        // Write result
        obj.computed.x = newPos.x;
        obj.computed.y = newPos.y;
      }
    }
  }
}
```

### Rule 3: Renderers Only Draw

```typescript
// ✅ CORRECT: Renderer reads computed values and draws
class PixiRenderer {
  render() {
    for (const [id, obj] of targetObjects) {
      const sprite = this.sprites.get(id)
      sprite.x = obj.computed.x
      sprite.y = obj.computed.y
      sprite.rotation = obj.computed.rotation
    }
  }
}

// ❌ WRONG: Renderer computes physics
class PixiRenderer {
  render() {
    // Don't compute here!
    const velocity = lastPos - currentPos...
  }
}
```

---

## Next Steps

1. **Create TargetObject store schema** (asset registry)
2. **Refactor existing nodes** to pure configuration providers
3. **Create PhysicsEngine module** (separate from renderers)
4. **Implement BodyNode** as the first physics node
5. **Restore NodeTester** to DOM-based (for testing without full renderer)
6. **Add tree-shaking markers** to each module

---

_Version: 3.0_
_Status: Foundation Document - Changes require approval_
