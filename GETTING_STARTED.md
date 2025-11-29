# Getting Started with Aninode MVP

## What's Been Built

Your Aninode MVP now has a solid foundation:

### ✅ Completed

1. **Project Structure**
   - Modern React + TypeScript + Vite setup
   - Organized folder structure with path aliases
   - All necessary dependencies configured

2. **Core Engine**
   - Valtio state management system
   - Node registration system
   - Property resolution (3-level hierarchy)
   - Type definitions for all core concepts

3. **UI Layout**
   - Professional 4-panel layout (Node Editor, Viewport, Properties, Timeline)
   - Responsive design with collapsible panels
   - Top navigation bar with tools and controls
   - Modern dark theme with glassmorphism effects

4. **Components**
   - **Node Editor**: Library of node types + active node list
   - **Viewport**: Scene preview with zoom controls
   - **Properties Panel**: Inspect and edit selected nodes/layers
   - **Timeline**: Playback controls and time navigation
   - **Top Bar**: Global tools and import/export buttons

5. **Features**
   - Scene import from Photoshop JSON exports
   - Node creation and selection
   - Layer visualization
   - Basic timeline playback controls
   - Zoom and pan (partial)

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

### 3. Import a Test Scene

1. Prepare a directory with:
   - `data.json` (scene configuration)
   - Image files (PNG, JPG, etc.)

2. Click "📁 Import" in the top-right
3. Select your scene directory
4. Your scene will load in the viewport

## What's Next?

### Immediate Next Steps (Phase 2)

The MVP foundation is ready. Here's what to build next:

#### 1. **Implement Core Nodes** (2-3 days)
Each node type needs its implementation:

- **LFO Node** (`src/nodes/LFO/index.tsx`)
  - Copy logic from existing `LFO_Node_01-11.tsx`
  - Remove Framer-specific code
  - Hook up to the store

- **SceneAnimator Node** (`src/nodes/SceneAnimator/index.tsx`)
  - Port animation logic from `SceneExporter.tsx`
  - Remove `addPropertyControls` and Framer Motion
  - Use pure Framer Motion library instead
  - Implement path animation
  - Add lighting system

- **ObjectPicker Node** (`src/nodes/ObjectPicker/index.tsx`)
  - Port connection logic
  - Implement data routing

- **LightController Node** (`src/nodes/LightController/index.tsx`)
  - Port light animation
  - Support path-based movement

#### 2. **Visual Node Editor** (2-3 days)
- Install React Flow: `npm install reactflow`
- Create `src/components/NodeGraph` component
- Implement drag-and-drop for nodes
- Add visual connections (cables)
- Hook up to the store

#### 3. **Path Drawing Tools** (2-3 days)
- Extract drawing logic from `WebEnginePrototype.tsx`
- Create `src/components/PathDrawer` component
- Implement Bezier curve editor
- Add keyboard shortcuts (P for draw mode, Enter to save)

#### 4. **Scene Exporter** (1-2 days)
- Create export functionality
- Bundle scene + code + assets
- Generate standalone HTML file
- Test exported projects

### Recommended Development Order

```
Week 1:
├─ Day 1-2: Implement core node types
├─ Day 3-4: Port SceneAnimator with animations
└─ Day 5: Test and debug nodes

Week 2:
├─ Day 1-2: Build visual node editor
├─ Day 3-4: Implement path drawing
└─ Day 5: Connect everything together

Week 3:
├─ Day 1-2: Scene export functionality
├─ Day 3-4: Timeline improvements
└─ Day 5: Testing and polish
```

## Project Architecture

### Folder Structure

```
src/
├── components/          # UI Components
│   ├── Layout/         # Main layout system
│   ├── TopBar/         # Navigation bar
│   ├── NodeEditor/     # Node library sidebar
│   ├── Viewport/       # Scene preview
│   ├── PropertiesPanel/ # Property inspector
│   ├── Timeline/       # Timeline controls
│   └── NodeGraph/      # (TODO) Visual node editor
│
├── nodes/              # Node Type Implementations
│   ├── SceneAnimator/  # (TODO) Main animator
│   ├── LFO/           # (TODO) Oscillator
│   ├── ObjectPicker/  # (TODO) Connection router
│   ├── LightController/ # (TODO) Light animation
│   └── ...            # More node types
│
├── core/               # Core Engine
│   ├── store.ts       # Valtio global state
│   ├── resolveProperty.ts  # Property resolution
│   └── useNodeRegistration.ts  # Node lifecycle
│
├── types/              # TypeScript Types
│   └── index.ts       # All type definitions
│
├── utils/              # Utility Functions
│   └── (TODO)         # Math, helpers, etc.
│
├── App.tsx            # Main app component
└── main.tsx           # Entry point
```

### Key Concepts

#### 1. **The Store** (`src/core/store.ts`)
Central state management using Valtio. Contains:
- `nodes`: All active nodes
- `connections`: Visual connections
- `scene`: Imported scene data
- `timeline`: Playback state
- `ui`: UI state

#### 2. **Node System**
Each node:
- Registers itself on mount
- Has `baseProps` (from UI), `overrides` (from connections), `outputs` (computed values)
- Can be connected to other nodes
- Updates the store reactively

#### 3. **Property Resolution**
3-level hierarchy:
1. **Level 1**: Base props (UI sliders, inputs)
2. **Level 2**: Presets (reusable values)
3. **Level 3**: Overrides (from node connections)

Use `resolveProperty()` to get the final value.

## Common Tasks

### Adding a New Node Type

1. Create `src/nodes/MyNode/index.tsx`:

```tsx
import { useNodeRegistration } from '@core/useNodeRegistration'
import { aninodeStore } from '@core/store'

export function MyNode({ id, ...props }) {
  useNodeRegistration(id, 'MyNode', props)

  // Your node logic here

  return <div>My Node UI</div>
}
```

2. Add to node types in `src/components/NodeEditor/index.tsx`

3. Update `NodeType` in `src/types/index.ts`

### Connecting Nodes

```typescript
// In a node that needs input from another node
const sourceNode = aninodeStore.nodes[sourceNodeId]
const value = sourceNode?.outputs?.someValue

// Or use resolveProperty
const value = resolveProperty(nodeId, 'propName', defaultValue)
```

### Reading Scene Data

```typescript
import { useSnapshot } from 'valtio'
import { aninodeStore } from '@core/store'

function MyComponent() {
  const snap = useSnapshot(aninodeStore)

  if (!snap.scene) return null

  return (
    <div>
      Canvas: {snap.scene.canvas.width} x {snap.scene.canvas.height}
      Layers: {snap.scene.assets.length}
    </div>
  )
}
```

## Tips & Best Practices

1. **Use Snapshots for Reading**
   ```tsx
   const snap = useSnapshot(aninodeStore)
   // Read from snap, not aninodeStore directly
   ```

2. **Direct Assignment for Writing**
   ```tsx
   aninodeStore.ui.zoom = 1.5
   // Valtio will automatically trigger re-renders
   ```

3. **Use Store Actions**
   ```tsx
   import { storeActions } from '@core/store'
   storeActions.addNode(newNode)
   ```

4. **Clean Up Resources**
   ```tsx
   useEffect(() => {
     // Setup
     return () => {
       // Cleanup (e.g., revoke blob URLs)
     }
   }, [])
   ```

## Debugging

### View Store State
```tsx
console.log('Store:', aninodeStore)
console.log('Nodes:', Object.keys(aninodeStore.nodes))
```

### React DevTools
- Install React DevTools browser extension
- Components will show Valtio state

### Check Console
All node registration/unregistration is logged:
```
[Aninode] Node registered: lfo1 (Type: LFO)
[Aninode] Node unregistered: lfo1
```

## Known Issues

- Timeline playback not yet implemented (controls are UI only)
- Path drawing not yet integrated
- Node connections are stored but not visualized
- Export functionality is a placeholder

## Resources

- **Valtio Docs**: https://valtio.pmnd.rs/
- **Framer Motion**: https://www.framer.com/motion/
- **React Flow**: https://reactflow.dev/
- **GSAP**: https://greensock.com/gsap/

## Need Help?

1. Check `MIGRATION_PLAN.md` for detailed architecture
2. Read `README.md` for feature overview
3. Review existing node implementations in parent directory
4. Refer to `Aninode_ideas.txt` for feature inspiration

## Let's Build! 🚀

You now have a solid foundation. The architecture is clean, extensible, and ready for the next phase. Start with implementing the core nodes, then move to the visual node editor.

Good luck, and enjoy building Aninode!
