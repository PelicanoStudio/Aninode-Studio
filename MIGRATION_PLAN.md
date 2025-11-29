# Aninode Migration Plan

This document outlines the strategy for migrating your Framer-based nodal animation engine to a standalone React application.

## Overview

**Goal**: Create a production-ready React app that captures all key features of your current Framer prototypes, with a focus on scene import/export and path drawing tools.

**Approach**: Hybrid - New clean architecture with adapted code from existing components.

## Migration Phases

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Set up Vite + React + TypeScript project
- [x] Configure build tools and dependencies
- [x] Port Valtio store system
- [x] Create type definitions
- [x] Implement core hooks (useNodeRegistration)
- [x] Design main layout structure
- [x] Build UI components (TopBar, Layout, panels)

### 🚧 Phase 2: Core Animation Engine (IN PROGRESS)
- [ ] **SceneAnimator Component**
  - Remove Framer Motion dependencies where needed
  - Port path animation logic
  - Implement lighting system
  - Add shadow rendering
  - Support keyframes and easing

- [ ] **Node Implementations**
  - LFO Node (oscillator)
  - ObjectPicker Node (connections)
  - ScaleModifier Node
  - LightController Node
  - PathDrawer Node

### 📋 Phase 3: Visual Node Editor
- [ ] Integrate React Flow for visual node graph
- [ ] Implement drag-and-drop for nodes
- [ ] Create connection system (cables)
- [ ] Add node ports (inputs/outputs)
- [ ] Build context menus for nodes
- [ ] Implement multi-select and grouping

### 📋 Phase 4: Path Drawing Tools
- [ ] Port path drawing from WebEnginePrototype
- [ ] Implement Bezier curve editor
- [ ] Add point manipulation (handles)
- [ ] Support SVG path import/export
- [ ] Keyboard shortcuts (P for draw mode, Enter to save)
- [ ] Path preview overlay

### 📋 Phase 5: Scene Import/Export
- [ ] **Importer**
  - File System Access API integration
  - Parse Photoshop JSON format
  - Load and cache image assets
  - Layer hierarchy support
  - Blend mode compatibility

- [ ] **Exporter**
  - Generate standalone HTML/JS
  - Bundle all assets
  - Minify and optimize code
  - Include Framer Motion runtime
  - Package as ZIP or directory

### 📋 Phase 6: Timeline & Animation
- [ ] Keyframe system
- [ ] Scrubbing functionality
- [ ] Layer tracks
- [ ] Animation curves editor
- [ ] Playback controls (play, pause, loop, speed)
- [ ] Time markers and regions

### 📋 Phase 7: Advanced Features
- [ ] **Mesh Warping**
  - Port pixel warper (Three.js)
  - Port SVG warper
  - Transitor morphing system

- [ ] **Audio Integration**
  - Audio timeline component
  - Waveform visualization
  - Audio-reactive parameters

- [ ] **Effects System**
  - Blur, glow, color adjustments
  - Blend modes
  - Masks and clipping

### 📋 Phase 8: UI/UX Polish
- [ ] Responsive design
- [ ] Dark/light theme
- [ ] Keyboard shortcuts
- [ ] Undo/redo system
- [ ] Context menus
- [ ] Tooltips and help
- [ ] Onboarding flow

### 📋 Phase 9: Testing & Optimization
- [ ] Unit tests for core logic
- [ ] Integration tests
- [ ] Performance profiling
- [ ] Memory leak detection
- [ ] Bundle size optimization
- [ ] Browser compatibility testing

### 📋 Phase 10: Documentation & Release
- [ ] User documentation
- [ ] Video tutorials
- [ ] Example projects
- [ ] API documentation
- [ ] Deployment guide

## Key Migration Decisions

### ✅ Decisions Made
1. **State Management**: Valtio (existing choice, works well)
2. **Animation Library**: Framer Motion (keep for most animations)
3. **Build Tool**: Vite (fast, modern)
4. **Node Editor**: React Flow (industry standard)
5. **3D/Warping**: React Three Fiber + Three.js (existing choice)

### 🤔 Decisions Pending
1. **Export Format**: Static HTML vs. React app?
2. **Backend**: Need server for collaboration features?
3. **Storage**: Local files vs. cloud storage?
4. **Licensing**: Open source vs. proprietary?

## Code Reuse Strategy

### Components to Migrate Directly
- `export_store.ts` → Core store ✅
- `useNodeRegistration.ts` → Node registration ✅
- `resolveProperty.ts` → Property resolution ✅
- `LFO_Node.tsx` → LFO implementation
- `ObjectPicker.tsx` → Picker logic
- `LightController.tsx` → Light controller
- `ScaleModifier.tsx` → Modifier node

### Components to Adapt
- `SceneExporter.tsx` → Remove Framer-specific code, keep animation logic
- `WebEnginePrototype.tsx` → Extract path drawing, adapt for main app
- `morphShader.js` → Use in warper feature
- `AudioTimeline.tsx` → Integrate with main timeline

### Components to Redesign
- Node graph UI (use React Flow instead of Framer canvas)
- Timeline interface (more professional timeline component)
- Export modal (better file management UI)

## Framer Removal Checklist

### Dependencies to Replace
- [ ] `framer` → Remove package
- [ ] `addPropertyControls` → Replace with custom prop panels
- [ ] `ControlType` → Use standard HTML inputs
- [ ] Framer `motion` → Use `framer-motion` library directly ✅
- [ ] Framer canvas → Use standard HTML canvas/SVG

### API Changes Needed
- [ ] Remove `isEditing` checks (Framer environment detection)
- [ ] Replace `window.Framer` checks
- [ ] Remove Framer-specific prop types
- [ ] Update export format (no Framer dependencies)

## Testing Strategy

### Manual Testing Checklist
- [ ] Scene import from Photoshop export
- [ ] Node creation and deletion
- [ ] Node connections and data flow
- [ ] Path drawing and editing
- [ ] Animation playback
- [ ] Timeline scrubbing
- [ ] Export to standalone project
- [ ] Re-import exported project

### Automated Testing
- [ ] Unit tests for store actions
- [ ] Property resolution logic
- [ ] Node registration/unregistration
- [ ] Animation calculations
- [ ] Path generation algorithms

## Performance Targets

- **Initial Load**: < 2 seconds
- **Scene Import**: < 1 second for typical scene
- **Animation FPS**: 60 fps for simple scenes, 30+ for complex
- **Node Operations**: < 16ms (60 fps)
- **Export Time**: < 5 seconds for typical project

## Browser Support

- **Primary**: Chrome/Edge (latest 2 versions)
- **Secondary**: Firefox, Safari (latest 2 versions)
- **Features requiring polyfills**:
  - File System Access API (fallback to downloads)
  - Offscreen Canvas (fallback to main canvas)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Framer Motion incompatibilities | High | Extensive testing, fallbacks |
| File System API browser support | Medium | Provide download alternative |
| Performance with many nodes | High | Virtual scrolling, lazy rendering |
| Export bundle size | Medium | Code splitting, tree shaking |
| Complex animation timing | High | Use battle-tested libraries (GSAP) |

## Success Criteria

### MVP Success
- [ ] Can import scene from Photoshop export
- [ ] Can create and connect basic nodes
- [ ] Can animate objects along paths
- [ ] Can export standalone web project
- [ ] UI is intuitive and responsive
- [ ] No critical bugs

### Full Release Success
- [ ] All major features from ideas.txt implemented
- [ ] Performance meets targets
- [ ] Documentation complete
- [ ] Positive user feedback
- [ ] Export projects work reliably

## Timeline Estimate

- **Phase 1**: 1 day (DONE ✅)
- **Phase 2**: 3-5 days
- **Phase 3**: 2-3 days
- **Phase 4**: 2-3 days
- **Phase 5**: 2-3 days
- **Phase 6**: 3-4 days
- **Phase 7**: 5-7 days
- **Phase 8**: 2-3 days
- **Phase 9**: 3-5 days
- **Phase 10**: 2-3 days

**Total Estimated Time**: 25-40 days (full-time development)

## Next Steps

1. ✅ Complete Phase 1 (Foundation)
2. 🚧 Implement core node types
3. Port SceneAnimator component
4. Build visual node editor
5. Integrate path drawing tools
6. Implement import/export system
