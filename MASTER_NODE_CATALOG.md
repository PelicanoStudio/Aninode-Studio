# Aninode Master Node Catalog
## Complete Feature List (Roadmap + Ideas.txt Integration)

This document consolidates ALL features from both the roadmap and ideas.txt, organized by priority and implementation phase.

---

## 🚨 CRITICAL MISSING NODES (For Basic Animation - MVP Priority)

### Transform & Deformation Nodes
- **RotationNode** ⚠️ URGENT
  - Properties: angle, anchorX, anchorY, continuous, speed
  - Supports: initial rotation, animated rotation, rotation along path
  - Output: rotation value

- **PivotPointNode** ⚠️ URGENT
  - Properties: pivotX, pivotY (percentage or pixels)
  - Purpose: Set transformation origin for scale/rotation
  - Output: transformOrigin value

- **DeformationNode** (Squash & Stretch) ⚠️ URGENT
  - Properties: squashAxis ("X", "Y", "Both"), stretchAmount, elasticity
  - Modes: "Squash", "Stretch", "Bounce", "Custom"
  - Output: scaleX, scaleY values with inverse compensation

- **AnchorNode** ⚠️ URGENT
  - Properties: anchorPoints (array of {x, y, id})
  - Purpose: Define deformation control points
  - Used with: DeformationNode, SkeletonNode

### Animation Curve Nodes
- **AnimationCurveNode** ⚠️ URGENT (Beyond LFO)
  - Types:
    - **Linear** (constant speed)
    - **Logarithmic** (slow start, fast end)
    - **Gaussian** (bell curve - ease in/out)
    - **Exponential** (fast start, slow end)
    - **Spring** (bounce/elastic)
    - **Custom Bezier** (user-drawn curve)
  - Properties: type, intensity, duration, reverse
  - Output: normalized value (0-1)

- **EasingPresetNode** ⚠️ URGENT
  - Presets: easeIn, easeOut, easeInOut, bounce, elastic, back
  - Visual curve editor (cartesian graph)
  - Output: easing function reference

### Interaction & Trigger Nodes
- **TriggerNode** ⚠️ URGENT (Multi-trigger support)
  - Trigger types:
    - **Keyboard** (key, keyCode, combo)
    - **Mouse Click** (target, button, doubleClick)
    - **Mouse Hover** (enter, leave, duration)
    - **Scroll** (direction, threshold, velocity)
    - **Touch** (tap, swipe, pinch, rotate)
    - **Time** (delay, interval, cron)
    - **Custom Event** (eventName)
  - Properties: enabled, preventDefault, stopPropagation
  - Output: trigger (boolean), event data

- **InputNode** (External UI triggers)
  - Already in roadmap Phase 8
  - Add: keyboard shortcuts, gamepad support

---

## 🎨 VJ & GENERATIVE ART NODES (Live Mapping Priority)

### Generative Nodes
- **NoiseNode** (Perlin/Simplex)
  - Properties: type ("Perlin", "Simplex", "Voronoi"), scale, octaves, persistence
  - Modes: 1D (time), 2D (space), 3D (volume)
  - Output: value (0-1)

- **RandomNode**
  - Properties: min, max, seed, distribution ("Uniform", "Gaussian", "Poisson")
  - Modes: "Once", "On Trigger", "Continuous"
  - Output: random value

- **WaveGeneratorNode** (Beyond LFO)
  - Waveforms: Sine, Saw, Triangle, Square, Pulse, Custom
  - Properties: frequency, amplitude, phase, harmonics
  - Output: value

- **FractalNode**
  - Patterns: Mandelbrot, Julia, Sierpinski, L-System
  - Properties: iterations, complexity, zoom, colorMap
  - Output: texture/pattern data

### VJ Live Nodes
- **BPMSyncNode**
  - Input: BPM (manual or from AudioNode)
  - Output: beat, bar, phrase markers
  - Purpose: Sync animations to music tempo

- **StrobeNode**
  - Properties: frequency, dutyCycle, colorA, colorB
  - Modes: "Flash", "Pulse", "Random"
  - Output: color/opacity value

- **KaleidoscopeNode**
  - Properties: segments, rotation, offset, blend
  - Input: source (image/video/scene)
  - Output: mirrored/repeated pattern

- **FeedbackNode**
  - Properties: decay, blend, offset
  - Purpose: Create echo/trail effects
  - Output: composite image

- **DisplacementMapNode**
  - Input: displacementMap (image/noise)
  - Properties: intensity, scale
  - Purpose: Warp/distort imagery

### Projection Mapping Nodes
- **ProjectionMapperNode**
  - Properties: corners (4-point perspective correction)
  - Modes: "Quad", "Grid", "Mesh"
  - Purpose: Warp output for physical surfaces

- **MultiDisplayNode**
  - Properties: displays (array of {id, x, y, width, height})
  - Purpose: Manage multiple projectors/screens
  - Output: canvas per display

- **FullscreenNode**
  - Properties: display (primary, secondary, all)
  - Purpose: Fullscreen viewport control
  - Output: viewport dimensions

---

## 📦 SPRITE & ATLAS SYSTEM (Your Priority #4)

### Already in Roadmap (Phase 5)
- **FrameAnimatorNode** (Sprite Sheet)
  - Properties: spriteSheetUrl, columns, rows, frameCount, fps
  - Outputs: currentFrame

### Missing from Roadmap (Add to Phase 9)
- **SpriteAtlasNode** ⚠️
  - Purpose: Load and manage sprite atlases
  - Input: atlasJson, atlasImage
  - Properties: spriteId, animation
  - Output: texture coordinates, dimensions

- **SpriteSequenceNode** ⚠️
  - Purpose: Animate sprite sequences
  - Properties: frames (array), fps, loop, pingpong
  - Output: currentFrame, isPlaying

- **SpriteBatchNode** ⚠️
  - Purpose: Render multiple sprites efficiently (WebGL)
  - Properties: sprites (array), sortMode
  - Output: rendered batch

### Export Optimization (Phase 9)
- **AtlasGeneratorNode** (Export-time)
  - Function: Pack all sprites into single atlas
  - Algorithm: Bin packing
  - Output: atlas.png + atlas.json

---

## 🔧 ENHANCED OBJECT PICKER SYSTEM (Critical Workflow)

### Core Concept (Your Description)
The **ObjectPickerNode** is NOT just a wire - it's the **central workflow hub**:

**Selection Methods:**
1. **Type layer names**: `[bird, cloud, tree]`
2. **Select in Layer Manager** → Right-click → "Pick"
3. **Select in Viewport** → Right-click → "Pick"
4. **Nest SceneAnimators**: Select entire animator to nest

**Visual Feedback:**
- **Color-coded branches** for selection history
- **Highlight entire branch** when selecting any part
- **Non-destructive history** - editable at any point

**Layer Manager Integration:**
- Collapsible groups per SceneAnimator
- Each group has unique ID
- Shows all imported assets
- Direct "Pick" action creates branch

### Implementation Requirements
```typescript
// Enhanced ObjectPickerNode properties
type ObjectPickerConfig = {
  // Selection
  selectionMode: 'Manual' | 'LayerManager' | 'Viewport' | 'NestedAnimator'
  targetLayers: string[] // ['bird', 'cloud', 'tree']
  targetAnimatorId?: string // For nesting

  // Visual
  branchColor: string // Unique color for this branch
  highlightOnSelect: boolean

  // History
  selectionHistory: Array<{
    timestamp: number
    layers: string[]
    operation: string
  }>
}
```

**SidePanel UI for ObjectPicker:**
- Layer name text input (comma-separated or array)
- Layer Manager tree view (checkbox selection)
- History timeline (undo/redo selections)
- Branch color picker
- Connection mapping config

---

## 🎬 ANIMATION CAPTURE & RECORDING

### AniCaptureNode (From ideas.txt - Critical!)
- **Purpose**: Record live animation manipulation
- **Function**:
  - User manipulates object properties in real-time
  - Records: translation, rotation, scale changes
  - Generates: keyframe sequence
  - Exports: sprite sheet or keyframe data
- **Properties**: recordButton, duration, fps, recordedChannels
- **Output**: keyframeData, spriteSequence

### LiveCaptureNode (Roadmap Phase 9)
- Similar concept
- Records overrides and bakes them as baseProps

**Integration**: Both should be unified into single **RecordingNode**

---

## 🖼️ LAYER MANAGER (Critical UI Component)

### Not in Roadmap - Add to Phase 8!

**LayerManager Component:**
- **Tree view** of all SceneAnimators
- **Collapsible groups** (per animator)
- **Properties per layer**:
  - Visibility toggle
  - Lock/unlock
  - Solo mode
  - Color tag
  - Z-index indicator
- **Actions**:
  - Right-click → "Pick" (creates ObjectPicker)
  - Drag to reorder z-index
  - Group selection (Shift/Ctrl)
  - Rename layers
- **Search/Filter**:
  - By name
  - By type
  - By animator ID

---

## 📊 COMPLETE NODE TAXONOMY

### By Category & Phase

#### ✅ **IMPLEMENTED (v1.1)**
- SceneExporter
- AnimatingItem
- LFO_Node
- LightController
- ScaleModifier
- ObjectPickerNode (basic)

#### 🎯 **MVP PHASE 1 (Immediate - 2-3 weeks)**
**Core Animation:**
- RotationNode ⚠️
- PivotPointNode ⚠️
- DeformationNode ⚠️
- AnchorNode ⚠️
- AnimationCurveNode (Linear, Log, Gaussian) ⚠️
- EasingPresetNode ⚠️

**Interaction:**
- TriggerNode (Keyboard, Click, Scroll) ⚠️

**Sprites:**
- FrameAnimatorNode (from roadmap Phase 5)
- SpriteAtlasNode ⚠️
- SpriteSequenceNode ⚠️

**Workflow:**
- Enhanced ObjectPickerNode (with Layer Manager integration) ⚠️
- Layer Manager UI Component ⚠️

#### 📈 **MVP PHASE 2 (Logic & Control - 3-4 weeks)**
From Roadmap Phase 3:
- LogicNode (comparators)
- ValueNode
- TriggerDelayNode
- DelayArrayNode

Additional:
- NoiseNode (for randomness)
- RandomNode

#### 🎬 **MVP PHASE 3 (Timeline - 4-5 weeks)**
From Roadmap Phase 4:
- PlaybackControllerNode
- TimelineNode
- CameraNode

Additional:
- RecordingNode (unified AniCapture/LiveCapture)

#### 🎨 **PHASE 4 (Advanced Rendering - 6-8 weeks)**
From Roadmap Phase 5:
- TextAnimatorNode
- AudioNode
- VideoNode
- SvgAnimatorNode
- ReactComponentNode

#### ⚙️ **PHASE 5 (Advanced Modifiers - 8-10 weeks)**
From Roadmap Phase 6:
- AdvancedLightNode
- VisualEffectsNode
- LayerMaskNode
- SkeletonNode
- ParallaxNode
- PerspectiveGridNode

#### 💥 **PHASE 6 (Physics & Particles - 10-12 weeks)**
From Roadmap Phase 7:
- GravityNode/PhysicsNode
- CollisionNode
- InstancerNode
- ParticlePathNode
- AttractorNode

#### ✨ **PHASE 7 (VJ & Generative - 12-14 weeks)**
New nodes:
- WaveGeneratorNode
- FractalNode
- BPMSyncNode
- StrobeNode
- KaleidoscopeNode
- FeedbackNode
- DisplacementMapNode
- ProjectionMapperNode
- MultiDisplayNode
- FullscreenNode

#### 🎭 **PHASE 8 (UI/UX Polish - 14-16 weeks)**
From Roadmap Phase 8:
- React Flow integration
- SidePanel UI
- PresetLibrary
- ClusterNode
- SceneManagerNode
- SubtitleNode
- SnapshotNode

Additional:
- Enhanced Layer Manager
- Branch color coding
- Selection history UI

#### 🚀 **PHASE 9 (Export & Performance - 16-18 weeks)**
From Roadmap Phase 9:
- ExportNode (with atlas generation)
- SceneExporterWebGL
- GsapTimelineNode
- Render to video

Additional:
- AtlasGeneratorNode
- SpriteBatchNode (WebGL optimization)

#### 🎪 **PHASE 10 (Nesting & Import - 18-20 weeks)**
From Roadmap Phase 10:
- SceneImporterNode
- GroupNode

#### 🔒 **PHASE 11 (Platform & Security - 20-22 weeks)**
From Roadmap Phase 11:
- DOMPurify integration
- XSS protection
- Export security

---

## 🎯 REVISED MVP SCOPE (Based on Your Answers)

### Immediate Focus (Next 2-3 weeks):

**1. Core Node Implementation (Without React Flow)**
Get these working with manual targeting (like MVP 1.0):
- ✅ SceneAnimator + AnimatingItem
- ✅ LFO_Node
- ⚠️ RotationNode
- ⚠️ DeformationNode
- ⚠️ AnimationCurveNode (Linear, Gaussian)
- ✅ ObjectPickerNode (basic)
- ✅ LightController

**2. Sprite System (Your Priority #4)**
- ⚠️ FrameAnimatorNode (sprite sheets)
- ⚠️ SpriteAtlasNode

**3. SidePanel UI (Important for property editing)**
- Double-click node to open panel
- Property editors for each node type
- Connection configuration

**4. Basic Testing Environment**
- Simple node addition UI (like current NodeEditor)
- Manual connection via text inputs
- Live preview in Viewport

### After Basic Nodes Work (Weeks 4-6):
- React Flow visual editor
- Layer Manager component
- Enhanced ObjectPicker with branch coloring

---

## 🏗️ DESIGN SYSTEM INTEGRATION (Future Phase)

Noted for future: You have Gemini-designed design systems ready.

**Future Step**: Migrate entire UI to custom design system.
- Wait until: Core functionality stable
- Then: Replace generic components with designed system
- Location: You mentioned a folder with one system (will read when needed)

---

## 📝 ACTION ITEMS

**Immediate (This Week):**
1. Document all missing nodes in roadmap
2. Prioritize: Rotation, Deformation, Curves, Triggers, Sprites
3. Implement first critical node (RotationNode)
4. Create simple testing interface

**Next Week:**
1. Implement DeformationNode
2. Implement AnimationCurveNode
3. Build SidePanel UI
4. Test nodes working together

**Week 3:**
1. Sprite system (FrameAnimator + Atlas)
2. Enhanced ObjectPicker
3. Begin Layer Manager UI

---

## 🤔 Questions for Prioritization

1. **Which single node is MOST critical** for your immediate needs?
   - Rotation?
   - Deformation (squash/stretch)?
   - Animation curves (beyond LFO)?

2. **For sprites**: Do you need **sprite sheet** support first, or **atlas** generation?

3. **For testing**: Should I build a simple "Node Tester" component where you can:
   - Add nodes
   - Set their properties via forms
   - Manually type connection targets
   - See live results?

4. **VJ nodes**: Which generative/VJ node would be most valuable for early demos?
   - Noise?
   - BPM Sync?
   - Projection mapping?

---

This catalog now represents the COMPLETE vision. We won't implement everything in MVP, but everything is documented, acknowledged, and prioritized. 🎯
