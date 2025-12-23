# Aninode Developer Quick Reference

> Last Updated: December 22, 2024

## Value Resolution

```typescript
import { resolveProperty } from "@core/resolveProperty";

// Returns: override > baseProps > default
const value = resolveProperty(nodeId, "frequency", 1.0);
```

## Reactive UI Subscription

```typescript
import { useSnapshot } from "valtio";
import { engineStore } from "@core/store";

// In component:
const snap = useSnapshot(engineStore);
const _ = snap.runtime.overrides[nodeId]; // Subscribes to changes
```

## Creating a New Node

### Step 1: Register in `nodeRegistrations.ts`

```typescript
registerNode({
  type: "MY_NODE",
  displayName: "My Node",
  category: "signal",
  defaultTimelineMode: "independent",
  inputs: [{ key: "input", label: "In", type: "number" }],
  outputs: [{ key: "value", label: "Out", type: "number" }],
  defaultProps: { myProp: 1.0, enabled: true, bypassed: false },
  compute: (ctx) => ({
    outputs: { value: resolveProperty(ctx.nodeId, "myProp", 1.0) * ctx.time },
  }),
});
```

### Step 2: Add UI in `NodeContent.tsx`

```typescript
case NodeType.MY_NODE: {
  const val = resolveProperty(node.id, 'myProp', 1.0);
  return <div>{val}</div>;
}
```

## Token Imports

```typescript
import {
  getSurface, // Colors
  signalActive, // Accent color (#FF1F1F)
  staticWaveformLayout, // Waveform box sizes
  waveformIconPaths, // SVG paths for waveforms
} from "@/tokens";
```

## Engine Tick Order

```
1. computeNodes()      → Generate nodeOutputs
2. processConnections() → Write overrides from outputs
```

## Connection Data Flow

```
Source.compute() → nodeOutputs → processConnections() → overrides → resolveProperty() → UI
```

## Common Issues

| Issue               | Check                                             |
| ------------------- | ------------------------------------------------- |
| Values don't update | Add `useSnapshot` subscription                    |
| Values inverted     | Verify tick order (compute before connections)    |
| Values don't revert | Check nothing writes to baseProps during override |
