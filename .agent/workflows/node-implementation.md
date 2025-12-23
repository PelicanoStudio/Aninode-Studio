---
description: Implement a new node type in the Aninode Engine
---

# Node Implementation Workflow

Follow this systematic approach when creating new node types.

## Phase 1: Token Definition

1. Check if node category exists in `src/ui/tokens/nodeSizing.ts`
2. Add entry to `nodeCategories` Record
3. Define default ports in `src/ui/tokens/ports.ts`:
   - Input ports with `isDefault: true` for obvious input
   - Output ports with `isDefault: true` for obvious output

## Phase 2: Type Registration

1. Add to `NodeType` enum in `src/ui/types.ts`
2. Add to `nodeTypeMap` in `src/ui/adapters/storeAdapters.ts`

## Phase 3: Visual Component

1. Add icon mapping in `src/ui/components/nodes/BaseNode.tsx` → `getNodeIcon()`
2. Add label in `getTypeLabel()`
3. Create content component in `src/ui/components/nodes/NodeContent.tsx`

## Phase 4: Engine Logic

1. Add case in `src/engines/AnimationEngine.ts` → `computeNodes()`
2. Define output calculation logic
3. Store results in `engineStore.runtime.nodeOutputs[nodeId]`

## Phase 5: SidePanel Configuration

1. Add config section in `src/ui/components/SidePanel.tsx`
2. Use `renderLabel()` for property labels
3. Wrap in `onContextMenu` for teleportation support

## Phase 6: Verification

// turbo

```bash
npx tsc --noEmit
```

1. Add node via NodePicker
2. Verify SidePanel shows configs
3. Connect to other nodes
4. Check `engineStore.runtime.nodeOutputs` in DevTools
