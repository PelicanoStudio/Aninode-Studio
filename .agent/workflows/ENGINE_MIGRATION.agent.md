---
description: Workflow to a full infinite canvas nodal design system migration to a web animation engine.
---

# ANINODE ENGINE MIGRATION INSTRUCTIONS

# Machine-readable ruleset for agent-driven UI migration

# Version: 1.0 | Target: Animation Engine

## META

source_library: aninode-design-system
target: aninode-mvp
integration: valtio_state_driven
performance: adaptive_quality_system

## PREREQUISITES

install:

- Valtio must be installed in engine project (`valtio` package)
- TypeScript path aliases must be configured

## FILE_PLACEMENT_ROUTING

source_root: aninode-design-system
target_root: [aninode-mvp]/src/ui

### Token Files (COPY ENTIRE DIRECTORY)

```
SOURCE                                    → TARGET
src/tokens/colors.ts                      → src/ui/tokens/colors.ts
src/tokens/layout.ts                      → src/ui/tokens/layout.ts
src/tokens/spacing.ts                     → src/ui/tokens/spacing.ts
src/tokens/responsive.ts                  → src/ui/tokens/responsive.ts
src/tokens/performance.ts                 → src/ui/tokens/performance.ts
src/tokens/animation.ts                   → src/ui/tokens/animation.ts
src/tokens/shortcuts.ts                   → src/ui/tokens/shortcuts.ts
src/tokens/connections.ts                 → src/ui/tokens/connections.ts
src/tokens/theme.tokens.ts                → src/ui/tokens/theme.tokens.ts
src/tokens/engine.contract.ts             → src/ui/tokens/engine.contract.ts
src/tokens/index.ts                       → src/ui/tokens/index.ts
```

### Component Files

```
SOURCE                                    → TARGET
components/nodes/BaseNode.tsx             → src/ui/components/nodes/BaseNode.tsx
components/nodes/NodeContent.tsx          → src/ui/components/nodes/NodeContent.tsx
components/nodes/Visualizer.tsx           → src/ui/components/nodes/Visualizer.tsx
components/canvas/ConnectionLine.tsx      → src/ui/components/canvas/ConnectionLine.tsx
components/canvas/CanvasBackground.tsx    → src/ui/components/canvas/CanvasBackground.tsx
components/ui/Header.tsx                  → src/ui/components/ui/Header.tsx
components/ui/NodePicker.tsx              → src/ui/components/ui/NodePicker.tsx
components/ui/ShortcutsPanel.tsx          → src/ui/components/ui/ShortcutsPanel.tsx
components/ui/Input.tsx                   → src/ui/components/ui/Input.tsx
components/SidePanel.tsx                  → src/ui/components/SidePanel.tsx
```

### Hooks

```
SOURCE                                    → TARGET
hooks/usePinchZoom.ts                     → src/ui/hooks/usePinchZoom.ts
hooks/useLongPress.ts                     → src/ui/hooks/useLongPress.ts
```

### Utils

```
SOURCE                                    → TARGET
utils/deviceDetection.ts                  → src/ui/utils/deviceDetection.ts
utils/geometry.ts                         → src/ui/utils/geometry.ts
utils/menuPosition.ts                     → src/ui/utils/menuPosition.ts
```

### Types (MERGE with existing or copy)

```
SOURCE                                    → TARGET
types.ts                                  → src/ui/types.ts
```

### Agent Instruction Files (Optional - for reference)

```
SOURCE                                    → TARGET
.agent/ROUTING.agent.md                   → src/ui/.agent/ROUTING.agent.md
.agent/ENGINE_MIGRATION.agent.md          → src/ui/.agent/ENGINE_MIGRATION.agent.md
```

## PATH_ALIAS_CONFIGURATION

### vite.config.ts (ADD to existing)

```typescript
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@/ui": path.resolve(__dirname, "./src/ui"),
      "@/tokens": path.resolve(__dirname, "./src/ui/tokens"),
    },
  },
});
```

### tsconfig.json (ADD to compilerOptions.paths)

```json
{
  "compilerOptions": {
    "paths": {
      "@/ui/*": ["./src/ui/*"],
      "@/tokens": ["./src/ui/tokens"],
      "@/tokens/*": ["./src/ui/tokens/*"]
    }
  }
}
```

## IMPORT_PATH_UPDATES

After copying files, the following import paths in copied files need updating:

### In components/\*.tsx files:

```
BEFORE                                    → AFTER
from '../../src/tokens'                   → from '@/tokens'
from '../../types'                        → from '@/ui/types'
from '../../hooks/useLongPress'           → from '@/ui/hooks/useLongPress'
from '../../utils/geometry'               → from '@/ui/utils/geometry'
```

### In tokens/\*.ts files:

```
BEFORE                                    → AFTER
from '../../types'                        → from '@/ui/types'
from './colors'                           → (no change - relative OK)
```

## ENGINE_STORE_INTEGRATION

location: src/core/store.ts
action: EXTEND_EXISTING_STORE

Add to existing Valtio store:

```typescript
import { QualityTier, defaultPerformanceHints } from "@/tokens";

// ADD these properties to existing store:
export const store = proxy({
  // ... existing state ...

  // UI State (ADD)
  ui: {
    isDarkMode: true,
    gridType: "DOTS" as "DOTS" | "LINES" | "CROSS",
  },

  // Performance State (ADD)
  performance: {
    ...defaultPerformanceHints,
    qualityTier: QualityTier.HIGH,
    isInteracting: false,
    visibleNodeCount: 0,
    pauseVisualizers: false,
  },
});
```

## VALTIO_STORE_STRUCTURE

```typescript
import { proxy } from "valtio";
import { QualityTier, defaultPerformanceHints } from "@/tokens";

export const uiStore = proxy({
  // Theme state
  isDarkMode: true,
  gridType: "DOTS" as "DOTS" | "LINES" | "CROSS",

  // Viewport state
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },

  // Performance state (engine monitors and updates)
  performance: {
    ...defaultPerformanceHints,
    qualityTier: QualityTier.HIGH,
    isInteracting: false,
    visibleNodeCount: 0,
    pauseVisualizers: false,
  },

  // Selection state
  selectedNodeIds: [] as string[],
});
```

## PERFORMANCE_MONITOR_INTEGRATION

location: engine_animation_loop
trigger: every_frame_or_throttled

```typescript
import { getRecommendedTier, nodeRenderThresholds } from "@/tokens";

// In animation loop or viewport change handler:
function updatePerformanceState(visibleNodes: NodeData[]) {
  const count = visibleNodes.length;
  const recommendedTier = getRecommendedTier(count);

  // Update Valtio store (direct mutation)
  uiStore.performance.visibleNodeCount = count;
  uiStore.performance.qualityTier = recommendedTier;
}

// During interaction (drag/pan/zoom):
function setInteracting(isInteracting: boolean) {
  uiStore.performance.isInteracting = isInteracting;
  uiStore.performance.pauseVisualizers = isInteracting;
}
```

## COMPONENT_MIGRATION_RULES

### BaseNode

props_to_pass:

- `qualityTier={snapshot.performance.qualityTier}`
- `disableGlow={snapshot.performance.qualityTier !== QualityTier.HIGH}`
- `isDarkMode={snapshot.isDarkMode}`

import_pattern:

```typescript
import { BaseNode } from "@aninode/ui/components/nodes/BaseNode";
import { useSnapshot } from "valtio";
import { uiStore } from "@/store";

const snapshot = useSnapshot(uiStore);

<BaseNode
  data={nodeData}
  isSelected={selectedIds.includes(nodeData.id)}
  isDarkMode={snapshot.isDarkMode}
  qualityTier={snapshot.performance.qualityTier}
  disableGlow={snapshot.performance.visibleNodeCount > 50}
  zoom={snapshot.viewport.zoom}
  // ... other props
/>;
```

### Visualizer

props_to_pass:

- `paused={snapshot.performance.pauseVisualizers || snapshot.performance.isInteracting}`
- `throttleMs={getVisualizerInterval(snapshot.performance.qualityTier, snapshot.performance.isInteracting)}`
- `qualityTier={snapshot.performance.qualityTier}`

import_pattern:

```typescript
import { Visualizer } from "@aninode/ui/components/nodes/Visualizer";
import { getVisualizerInterval } from "@/tokens";

<Visualizer
  type={node.config.waveType}
  frequency={node.config.frequency}
  amplitude={node.config.amplitude}
  active={isActive}
  isDarkMode={snapshot.isDarkMode}
  paused={snapshot.performance.pauseVisualizers}
  throttleMs={getVisualizerInterval(
    snapshot.performance.qualityTier,
    snapshot.performance.isInteracting
  )}
  qualityTier={snapshot.performance.qualityTier}
/>;
```

### ConnectionLine

props_to_pass:

- `qualityTier={snapshot.performance.qualityTier}`

import_pattern:

```typescript
import { ConnectionLine } from "@aninode/ui/components/canvas/ConnectionLine";

<ConnectionLine
  connection={conn}
  sourceNode={sourceNode}
  targetNode={targetNode}
  viewport={snapshot.viewport}
  isDarkMode={snapshot.isDarkMode}
  qualityTier={snapshot.performance.qualityTier}
  onDelete={handleDeleteConnection}
/>;
```

## COLOR_MIGRATION_RULES

pattern: replace_hardcoded_with_token_helper

before:

```typescript
backgroundColor: isDarkMode ? "#000" : "#fff";
borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
```

after:

```typescript
import { getSurface, getBorder } from "@/tokens";

backgroundColor: getSurface("node", isDarkMode);
borderColor: getBorder("default", isDarkMode);
```

surface_variants: [node, panel, canvas, menu, overlay]
border_variants: [default, divider, menuBorder]

## LAYOUT_MIGRATION_RULES

pattern: replace_magic_numbers_with_tokens

before:

```typescript
width: 256;
padding: 12;
zIndex: 50;
```

after:

```typescript
import { nodeLayout, zIndex } from "@/tokens";

width: nodeLayout.width; // 256
padding: nodeLayout.bodyPadding; // 12
zIndex: zIndex.nodeSelected; // 50
```

## SPACING_MIGRATION_RULES

pattern: use_semantic_spacing

before:

```typescript
gap: 8;
padding: 12;
margin: 24;
```

after:

```typescript
import { spacing, nodeSpacing } from "@/tokens";

gap: spacing.sm; // 8
padding: nodeSpacing.bodyPadding; // 12
margin: spacing.xl; // 24
```

## ANIMATION_MIGRATION_RULES

pattern: gsap_compatible_tokens

before:

```typescript
gsap.to(element, { duration: 0.3, ease: "power2.out" });
```

after:

```typescript
import { duration, easing } from "@/tokens";

gsap.to(element, { duration: duration.normal, ease: easing.out });
```

## LOD_IMPLEMENTATION

location: viewport_render_loop
trigger: zoom_change_or_visible_nodes_change

```typescript
import { getLodLevel, lodThresholds } from "@/tokens";

function renderNodes(nodes: NodeData[], viewport: Viewport) {
  const lod = getLodLevel(viewport.zoom);

  return nodes.map((node) => {
    switch (lod) {
      case "ultraFar":
        // Labels only, no content
        return <NodeLabel node={node} />;
      case "far":
        // Collapsed view only
        return <BaseNode data={{ ...node, collapsed: true }} />;
      case "mid":
        // Normal view, reduced quality
        return <BaseNode data={node} qualityTier={QualityTier.LOW} />;
      case "near":
      default:
        // Full quality
        return <BaseNode data={node} qualityTier={QualityTier.HIGH} />;
    }
  });
}
```

## VIEWPORT_CULLING

location: render_loop
trigger: viewport_change

```typescript
function getVisibleNodes(
  nodes: NodeData[],
  viewport: { x: number; y: number; zoom: number },
  viewportWidth: number,
  viewportHeight: number
): NodeData[] {
  const margin = 100; // Extra margin for smooth appearance

  return nodes.filter((node) => {
    const nodeWidth = node.dimensions?.width || nodeLayout.width;
    const nodeHeight = node.dimensions?.height || nodeLayout.defaultHeight;

    // Transform node position to screen space
    const screenX = node.position.x * viewport.zoom + viewport.x;
    const screenY = node.position.y * viewport.zoom + viewport.y;
    const screenWidth = nodeWidth * viewport.zoom;
    const screenHeight = nodeHeight * viewport.zoom;

    // Check if node intersects viewport
    return (
      screenX + screenWidth > -margin &&
      screenX < viewportWidth + margin &&
      screenY + screenHeight > -margin &&
      screenY < viewportHeight + margin
    );
  });
}
```

## INTERACTION_THROTTLING

location: event_handlers
pattern: pause_during_interaction

```typescript
// On drag/pan start
function handleInteractionStart() {
  uiStore.performance.isInteracting = true;
  uiStore.performance.pauseVisualizers = true;
}

// On drag/pan end
function handleInteractionEnd() {
  uiStore.performance.isInteracting = false;
  // Delay resuming visualizers slightly for smoother transition
  setTimeout(() => {
    uiStore.performance.pauseVisualizers = false;
  }, 100);
}
```

## QUALITY_TIER_THRESHOLDS

auto_downgrade:

- HIGH → MEDIUM: visibleNodeCount > 50
- MEDIUM → LOW: visibleNodeCount > 150
- LOW → MINIMAL: visibleNodeCount > 300

feature_flags:
HIGH: [glow, shadows, opacity, animations, waveforms, gradients, blur, antialiasing]
MEDIUM: [shadows, opacity, animations, waveforms, gradients, antialiasing]
LOW: [waveforms(throttled), antialiasing]
MINIMAL: []

## ENGINE_UI_CONFIG_USAGE

pattern: single_accessor_for_all_tokens

```typescript
import { getEngineUIConfig } from "@/tokens";
import { useSnapshot } from "valtio";
import { uiStore } from "@/store";

function useUIConfig() {
  const snapshot = useSnapshot(uiStore);
  return getEngineUIConfig(snapshot.isDarkMode, snapshot.performance);
}

// Returns complete config:
// config.colors.surface.node
// config.layout.node.width
// config.spacing.base.sm
// config.features.glow (boolean based on tier)
// config.visualizerInterval (number based on tier + interaction)
// config.lodLevel ('near' | 'mid' | 'far' | 'ultraFar')
```

## MIGRATION_CHECKLIST

- [ ] Copy token files to engine project
- [ ] Set up path aliases (@/tokens)
- [ ] Create Valtio uiStore with performance state
- [ ] Implement performance monitor in animation loop
- [ ] Update node components with qualityTier props
- [ ] Update visualizers with pause/throttle props
- [ ] Update connection lines with qualityTier prop
- [ ] Implement viewport culling for visible nodes
- [ ] Add interaction start/end handlers for throttling
- [ ] Replace hardcoded colors with token helpers
- [ ] Replace magic numbers with layout tokens
- [ ] Test at all quality tiers (HIGH → MINIMAL)
- [ ] Verify cascading token changes work correctly
