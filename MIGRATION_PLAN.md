# Aninode Migration Plan

This document outlines the strategy for migrating your Framer-based nodal animation engine to a standalone React application, with a focus on professional output capabilities.

## Overview

**Goal**: Create a production-ready animation engine capable of delivering:
- Gamified e-learning experiences
- Short films and motion graphics
- Projection mapping installations
- Interactive web experiences

**Approach**: GSAP-centric architecture with pluggable renderers and optimized exports.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANINODE ENGINE v2                             │
│                  (GSAP-Centric Architecture)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    INPUT LAYER                            │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  DOM Events    │ Web MIDI API │ Gamepad │ WebSocket/OSC  │   │
│  │  Keyboard      │ Audio Input  │ Sensors │ Custom Triggers│   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   NODE GRAPH LAYER                        │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Transform Nodes    │ Signal Generators │ Control Nodes  │   │
│  │  ├─ RotationNode    │ ├─ LFONode        │ ├─ TriggerNode │   │
│  │  ├─ ScaleNode       │ ├─ CurveNode      │ ├─ MIDINode    │   │
│  │  ├─ PositionNode    │ ├─ NoiseNode      │ ├─ KeyboardNode│   │
│  │  └─ DeformNode      │ └─ AudioReactive  │ └─ HoverNode   │   │
│  │                                                           │   │
│  │  Media Nodes        │ Analysis Nodes    │ Output Nodes   │   │
│  │  ├─ SpriteNode      │ ├─ StaticZone     │ ├─ Renderer    │   │
│  │  ├─ FrameAnimNode   │ ├─ Performance    │ ├─ VideoExport │   │
│  │  ├─ VideoNode       │ └─ Dependency     │ ├─ AudioExport │   │
│  │  └─ SubtitleNode    │                   │ └─ HTMLExport  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   ANIMATION ENGINE                        │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                       GSAP                                │   │
│  │  ├─ Core             (tweens, timelines)                 │   │
│  │  ├─ MotionPathPlugin (path animation)                    │   │
│  │  ├─ MorphSVGPlugin   (shape morphing)                    │   │
│  │  ├─ PixiPlugin       (PixiJS integration)                │   │
│  │  ├─ DrawSVGPlugin    (line drawing)                      │   │
│  │  ├─ CustomEase       (bezier curves)                     │   │
│  │  └─ ScrollTrigger    (scroll-based, optional)            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   RENDER LAYER                            │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  DOM/CSS       │  PixiJS        │  Three.js    │  Raw GL │   │
│  │  (Simple)      │  (2D WebGL)    │  (3D/2.5D)   │ (Custom)│   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   EXPORT LAYER                            │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Web Package     │ Video Export    │ Standalone HTML     │   │
│  │  ├─ GSAP min     │ ├─ MP4 (h264)   │ ├─ Single file     │   │
│  │  ├─ Plugins      │ ├─ WebM (VP9)   │ ├─ All assets      │   │
│  │  ├─ Renderer     │ ├─ GIF          │ └─ Offline capable │   │
│  │  └─ Assets       │ ├─ PNG Sequence │                     │   │
│  │                  │ └─ Audio (WAV)  │                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Migration Phases

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Set up Vite + React + TypeScript project
- [x] Configure build tools and dependencies
- [x] Port Valtio store system
- [x] Create type definitions
- [x] Implement core hooks (useNodeRegistration)
- [x] Design main layout structure
- [x] Build UI components (TopBar, Layout, panels)

### ✅ Phase 2: Animation Engine Migration (COMPLETED)
- [x] **Replace Framer Motion with GSAP**
  - [x] Remove framer-motion dependency
  - [x] Install GSAP core
  - [x] Migrate RotationNode to GSAP
  - [x] Migrate ScaleNode to GSAP
  - [x] Migrate OpacityNode to GSAP
  - [x] LFONode (already uses requestAnimationFrame)
  - [x] Update Viewport component

### 🚧 Phase 3: Core Node Implementations (IN PROGRESS)
- [x] RotationNode (Static/Animated/Controlled modes)
- [x] ScaleNode (Uniform/Non-uniform, easing)
- [x] OpacityNode (Effects: fadeIn, fadeOut, pulse, blink)
- [x] LFONode (Waveforms: sine, triangle, square, sawtooth, noise)
- [ ] PositionNode (X/Y animation)
- [ ] DeformationNode (Squash, stretch, skew)
- [ ] ColorNode (Tint, color animation)
- [ ] ObjectPickerNode (Layer selection)
- [ ] SceneAnimatorNode (Apply nodes to scene)

### 📋 Phase 4: Visual Node Editor
- [ ] Integrate React Flow for visual node graph
- [ ] Implement drag-and-drop for nodes
- [ ] Create connection system (cables)
- [ ] Add node ports (inputs/outputs)
- [ ] Build context menus for nodes

### 📋 Phase 5: Path & Drawing Tools
- [ ] Port path drawing from WebEnginePrototype
- [ ] GSAP MotionPathPlugin integration
- [ ] Bezier curve editor
- [ ] SVG path import/export

### 📋 Phase 6: Timeline System
- [ ] GSAP Timeline integration
- [ ] Timeline UI with scrubbing
- [ ] Keyframe visualization
- [ ] Layer tracks
- [ ] Playback controls (play, pause, loop, speed)
- [ ] Time markers and regions

### 📋 Phase 7: Media & Sprite System
- [ ] **Sprite Atlas Support**
  - PixiJS Spritesheet integration
  - Texture packing optimization
  - Runtime atlas generation
- [ ] **Frame-by-Frame Animation**
  - AnimatedSprite node
  - GSAP stepped easing
  - FPS control
- [ ] **Video Integration**
  - Video texture support
  - Sync with timeline

### 📋 Phase 8: Export System
- [ ] **Web Export**
  - Tree-shaken GSAP bundle
  - Asset optimization
  - Single HTML file option
- [ ] **Video Rendering**
  - Canvas capture pipeline
  - Frame-by-frame GSAP seeking
  - FFmpeg.wasm integration
  - MP4/WebM/GIF output
- [ ] **Audio Export**
  - Web Audio API rendering
  - OfflineAudioContext for fast export
  - Track compilation
  - Subtitle export (WebVTT)
- [ ] **Static Zone Optimization**
  - Automatic detection of non-animated regions
  - Pre-render static elements
  - Reduce video rendering time

### 📋 Phase 9: Input & Trigger System
- [ ] **Event Nodes**
  - TriggerNode (click, hover, keyboard)
  - MIDIInputNode (CC, notes, velocity)
  - GamepadNode (controller support)
  - WebSocketNode (OSC bridge, external control)
- [ ] **Audio-Reactive**
  - AudioAnalyzerNode
  - Frequency band mapping
  - Beat detection

### 📋 Phase 10: Advanced Effects
- [ ] **Mesh Warping**
  - Three.js/PixiJS mesh deformation
  - PxlMorpher integration
  - SVG morph (MorphSVGPlugin)
- [ ] **Shader Effects**
  - Custom GLSL support
  - Blur, glow, distortion
  - Blend modes

### 📋 Phase 11: Polish & Optimization
- [ ] Performance profiling
- [ ] Memory management
- [ ] Bundle size optimization
- [ ] Browser compatibility
- [ ] Documentation

---

## Tech Stack (Final)

### Development Environment
| Layer | Technology | Purpose |
|-------|------------|---------|
| UI Framework | React 18 | Component system (dev only) |
| Language | TypeScript | Type safety |
| State | Valtio | Proxy-based reactivity |
| Animation | **GSAP** | All animation |
| 2D Render | PixiJS | WebGL sprites |
| 3D Render | Three.js / R3F | 3D/2.5D scenes |
| Node Editor | React Flow | Visual programming |
| Build | Vite | Fast bundling |

### Export Bundles (Tree-Shakeable)
```
EXPORT PROFILES:

"e-learning"     → GSAP + DOM           (~30KB)
"web-animation"  → GSAP + PixiJS        (~80KB)
"3d-scene"       → GSAP + Three.js      (~150KB)
"projection"     → GSAP + WebGL Raw     (~40KB)
"short-film"     → GSAP + Full Stack    (~200KB)
```

### GSAP Plugins Required
| Plugin | Size | Purpose | License |
|--------|------|---------|---------|
| Core | ~24KB | Tweens, timelines | Free |
| MotionPathPlugin | ~8KB | Path animation | Free |
| CustomEase | ~3KB | Bezier curves | Free |
| PixiPlugin | ~5KB | PixiJS integration | Free |
| DrawSVGPlugin | ~4KB | Line drawing | Club |
| MorphSVGPlugin | ~10KB | Shape morphing | Club |
| ScrollTrigger | ~12KB | Scroll animations | Free |

---

## Key Decisions Made

### ✅ Animation Library: GSAP Only
**Removed**: Framer Motion
**Reason**:
- Smaller export bundles (no React runtime needed)
- Frame-perfect timeline seeking for video export
- Native PixiJS/Three.js integration
- Industry standard for film/advertising
- Better tree-shaking

### ✅ Rendering Strategy: Pluggable
Multiple renderers supported:
- **DOM/CSS**: Simple animations, e-learning
- **PixiJS**: 2D sprites, high performance
- **Three.js**: 3D scenes, 2.5D parallax
- **Raw WebGL**: Custom shaders, PxlMorpher

### ✅ Export Strategy: Tree-Shaken
Each export includes only:
- GSAP core + used plugins
- Selected renderer
- Optimized assets
- Generated animation code

---

## Video Rendering Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIDEO EXPORT PIPELINE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. ANALYSIS PHASE                                               │
│     ├─ StaticZoneAnalyzer scans timeline                        │
│     ├─ Identifies non-animated layers                           │
│     └─ Pre-renders static content                               │
│                                                                  │
│  2. RENDER PHASE                                                 │
│     ├─ GSAP timeline.seek(frame / fps)                          │
│     ├─ Renderer draws frame (PixiJS/Three.js)                   │
│     ├─ Canvas captured to ImageData                             │
│     └─ Frame added to buffer                                    │
│                                                                  │
│  3. ENCODE PHASE                                                 │
│     ├─ FFmpeg.wasm encodes frames                               │
│     ├─ Audio track compiled (OfflineAudioContext)               │
│     ├─ Subtitles embedded (WebVTT)                              │
│     └─ Final video output (MP4/WebM)                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Initial Load | < 2 seconds |
| Scene Import | < 1 second |
| Animation FPS | 60fps (simple), 30fps+ (complex) |
| Node Operations | < 16ms |
| Video Export | ~2x realtime |
| Web Export Size | < 100KB (simple), < 300KB (full) |

---

## Browser Support

- **Primary**: Chrome/Edge (latest 2 versions)
- **Secondary**: Firefox, Safari (latest 2 versions)
- **Features requiring polyfills**:
  - File System Access API (fallback to downloads)
  - OfflineAudioContext (fallback to realtime)
  - SharedArrayBuffer (for FFmpeg.wasm)

---

## Success Criteria

### MVP Success
- [ ] Import scene from Photoshop export
- [ ] Create and connect basic nodes
- [ ] Animate objects with GSAP timeline
- [ ] Export standalone web project
- [ ] Export video (MP4)

### Full Release Success
- [ ] All node types implemented
- [ ] Visual node editor working
- [ ] Video export with audio
- [ ] Sprite atlas support
- [ ] Frame-by-frame animation
- [ ] Path drawing tools
- [ ] MIDI/trigger support
- [ ] Performance meets targets

---

## Next Steps

1. ✅ Complete GSAP migration
2. 🚧 Implement remaining core nodes (Position, Deform, Color)
3. Port SceneAnimator for scene integration
4. Build visual node editor (React Flow)
5. Implement timeline UI with GSAP scrubbing
6. Add video export pipeline

---

*Last Updated: 2024-12-01*
*Animation Engine: GSAP (Framer Motion removed)*
