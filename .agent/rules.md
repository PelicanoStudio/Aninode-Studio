# Aninode Engine Development Rules

These rules MUST be followed for all engine development. They ensure architectural consistency and maintainability.

---

## 1. Three-Level Hierarchy

The engine uses a strict three-level property resolution:

```
OVERRIDE → PRESET → BASE
```

- **BASE**: Default values from node definition (`nodeDefinition.baseProps`)
- **PRESET**: Export/import configurations
- **OVERRIDE**: Runtime values from connections/LFOs (`engineStore.runtime.overrides`)

**Rule**: Nodes are **non-destructive forward-writers**. They write new values onto assets, not modify source data.

---

## 2. Zero Magic Numbers

**NEVER use raw numbers or colors directly in components.**

❌ Bad:

```tsx
<div style={{ width: 256, borderRadius: 8 }}>
```

✅ Good:

```tsx
import { nodeLayout } from '@/tokens';
<div style={{ width: nodeLayout.width, borderRadius: nodeLayout.borderRadius }}>
```

All values must come from:

- `@/tokens` (design tokens)
- `@/core/store` (Valtio state)
- Props passed from parent

---

## 3. Token Cascade Architecture

```
tokens/
├── colors.ts        → All color definitions
├── layout.ts        → Spacing, dimensions
├── animation.ts     → Durations, easings
├── waveform.ts      → LFO visualization
├── ports.ts         → Port definitions per node
├── nodeSizing.ts    → Size rules, scalability
├── connectionSemantics.ts → Cable meanings
└── index.ts         → Barrel exports
```

**Rule**: If a visual property repeats twice, it needs a token.

---

## 4. State Management with Valtio

All state flows through `engineStore`:

```typescript
// READ: Use useSnapshot for reactive reads
const snap = useSnapshot(engineStore);
const nodes = snap.project.nodes;

// WRITE: Use storeActions for mutations
storeActions.updateNodeProps(nodeId, { frequency: 2 });
storeActions.addConnection(connDef);
```

**Rule**: Never mutate store directly. Always use `storeActions`.

---

## 5. Connection Type Semantics

| Type     | Visual        | Use Case           |
| -------- | ------------- | ------------------ |
| BEZIER   | Smooth curve  | Standard values    |
| DOUBLE   | Thick pipe    | Array/batch data   |
| DOTTED   | Animated dash | Live streams (LFO) |
| STEP     | Orthogonal    | Boolean/logic      |
| STRAIGHT | Dashed arrow  | Telepathic binding |

**Rule**: Connection type must match data semantics.

---

## 6. Node ID Format

```
[type_prefix]_[timestamp]_[random]
```

Examples:

- `osc_1703289600000_x7k2`
- `tra_1703289601234_m4n9`

**Rule**: Always generate unique IDs. Never reuse IDs from copied nodes.

---

## 7. Performance Tiers

The engine adapts visual quality based on `qualityTier`:

- `HIGH`: Full effects, animations, glow
- `MEDIUM`: Reduced glow, animations
- `LOW`: Minimal effects
- `MINIMAL`: Bare rendering

**Rule**: Use `isFeatureEnabled(qualityTier, 'glow')` before expensive renders.

---

## 8. File Organization

```
src/
├── core/          → Store, hooks, engine primitives
├── engines/       → AnimationEngine, computation logic
├── ui/
│   ├── adapters/  → Type bridging (UI ↔ Engine)
│   ├── components/
│   │   ├── canvas/    → Connection, background
│   │   ├── nodes/     → BaseNode, NodeContent
│   │   └── ui/        → Header, inputs
│   ├── hooks/     → Custom React hooks
│   ├── tokens/    → Design tokens
│   └── types.ts   → UI type definitions
└── nodes/         → Legacy node wrappers
```

---

## 9. Responsive Sizing

Use breakpoint-aware dimensions:

```typescript
import { getResponsiveDimension, getResponsiveFontSize } from "@/tokens";

const width = getResponsiveDimension(256);
const fontSize = getResponsiveFontSize("label");
```

---

## 10. Verification Checklist

Before committing changes:

1. `npx tsc --noEmit` passes
2. No lint errors in modified files
3. All values from tokens (no magic numbers)
4. Store mutations via storeActions only
5. New node types registered in all required locations
