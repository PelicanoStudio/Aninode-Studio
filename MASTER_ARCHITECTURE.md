# Aninode Master Architecture v4.1

## Complete Vision Integration

This document consolidates ALL features from:

- `Proceso_Aninode_ideas_dispersas.txt`
- `otras_ideillas.txt`
- `MASTER_NODE_CATALOG.md`
- `MIGRATION_PLAN.md`
- `Physics Node System Architecture.txt`
- `README.md`
- `quick_reference/aninode-design-system`
- `quick_reference/AudioTimeline.tsx`

---

## Philosophy & Business Model

### Local-First & Free-to-Use

```
┌────────────────────────────────────────────────────────────────────────┐
│  ANINODE IS LOCAL-FIRST AND COMPLETELY FREE TO USE                     │
│  All core functionality runs entirely in your browser.                 │
│  No account required. No telemetry. Your data stays yours.             │
└────────────────────────────────────────────────────────────────────────┘
```

**Core Principle**: Zero friction between creativity and technical barriers.

### Future Pro Plans (Optional)

| Tier          | Features                                    | Use Case            |
| ------------- | ------------------------------------------- | ------------------- |
| **Free**      | Full local engine, all nodes, all exports   | Individual creators |
| **Pro Cloud** | AI tools (Nano Banana, SAM3), cloud storage | Advanced workflows  |
| **Team**      | Collaboration, version control, comments    | Studios             |

**Pro AI Tools** (require cloud):

- **Nano Banana**: Pose generation, in-painting, asset manipulation
- **SAM3**: Scene segmentation (Segment Anything Model)

---

## Security

### Import Sanitization

All imported assets pass through security validation:

| Asset Type      | Security Checks                                       |
| --------------- | ----------------------------------------------------- |
| **SVG**         | Strip `<script>`, `onclick`, `onerror`, external URLs |
| **Images**      | Validate format headers, strip EXIF/metadata          |
| **JSON**        | Schema validation, no executable code                 |
| **URLs**        | Allowlist domains, CORS validation                    |
| **Video/Audio** | Format validation, no embedded executables            |

---

## Deployment Strategy

### Primary Target: PWA (Progressive Web App)

```
┌────────────────────────────────────────────────────────────────────────┐
│  INSTALLABLE FROM BROWSER ADDRESS BAR                                  │
│  • Works offline after first load                                      │
│  • File System Access API for local file management                   │
│  • Native-like experience on desktop                                   │
│  • Chrome/Edge: "Install" button in address bar                       │
└────────────────────────────────────────────────────────────────────────┘
```

### Future (Long-term): Native Touch Wrapper

- iPad/Tablet native app via PWA wrapper (Capacitor/Electron)
- **NOT a priority** - parallel ecosystems too complex to maintain now

---

## The Three Inviolable Laws

```
┌────────────────────────────────────────────────────────────────────────┐
│  1. NODES ARE CONFIG PROVIDERS (publish to store, have RICH UI)       │
│  2. ENGINES COMPUTE (physics, audio, animation → write to store)      │
│  3. RENDERERS DRAW (read computed values → display)                   │
└────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT] > **Nodes are NOT headless!** They have embedded visual feedback (waveforms, animated points, radial timers) and live within a custom node playground. The design system is in `quick_reference/aninode-design-system`.

---

## AI Workflow Integration (Pro Cloud)

### Nano Banana Pro

**Pose Generation**: Create different poses for a single asset for:

- Frame-by-frame animation
- Mixed animation (procedural + frame-by-frame)
- Pure procedural with SVG pattern identification

### SAM3 (Segment Anything Model)

**Scene Segmentation**: Import a flat scene without hierarchy, then:

1. Run SAM3 to auto-segment all elements
2. Fill gaps with in-painting (Nano Banana)
3. Get clean, layered assets ready for animation

**Goal**: Reduce context switching between external software.

---

## Tree-Shakeable Stack

| Module            | Size     | When Included        |
| ----------------- | -------- | -------------------- |
| **Valtio**        | ~3KB     | Always (core)        |
| **GSAP Core**     | ~24KB    | Always (core)        |
| **GSAP Plugins**  | Variable | Per plugin usage     |
| **Rapier 2D**     | ~200KB   | If physics nodes     |
| **Rapier 3D**     | ~400KB   | If 3D physics        |
| **Three.js**      | ~150KB   | If 3D renderer       |
| **PixiJS**        | ~100KB   | If 2D WebGL renderer |
| **DOM/CSS**       | ~0KB     | Default renderer     |
| **mp4-wasm**      | ~500KB   | If video export      |
| **FFmpeg.wasm**   | ~25MB    | Advanced export      |
| **Web Workers**   | ~0KB     | Heavy computation    |
| **TensorFlow.js** | ~500KB   | If CV nodes          |

### Export Profiles

```
"micro"        → GSAP + DOM                     (~30KB)
"standard"     → GSAP + PixiJS                  (~130KB)
"physics"      → GSAP + PixiJS + Rapier2D       (~330KB)
"cinematic"    → GSAP + Three.js                (~180KB)
"interactive"  → GSAP + PixiJS + Rapier + Input (~400KB)
"full"         → Everything except CV           (~600KB)
"ai-enabled"   → Full + TensorFlow.js           (~1.1MB)
```

---

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ANINODE ENGINE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     LAYER 1: INPUT SOURCES                          │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  Scene Import    │  User Input      │  External API    │  Hardware  │    │
│  │  ├─ PSD/JSON     │  ├─ Mouse/Touch  │  ├─ FetchNode    │  ├─ MIDI   │    │
│  │  ├─ Affinity     │  ├─ Keyboard     │  ├─ WebSocket    │  ├─ DMX    │    │
│  │  ├─ Illustrator  │  ├─ Scroll       │  ├─ InputNode    │  ├─ OSC    │    │
│  │  ├─ GLTF/OBJ     │  ├─ Gamepad      │  │  (Exposed API)│  ├─ Sensors│    │
│  │  └─ SVG/Video    │  └─ CV Detection │  └─ CustomEvents │  └─ Laser  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     LAYER 2: NODE GRAPH (RICH UI)                   │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  Transform    │ Signal      │ Physics    │ Visual     │ Control    │    │
│  │  ├─Rotation   │ ├─LFO       │ ├─Body     │ ├─Opacity  │ ├─Trigger  │    │
│  │  ├─Scale      │ ├─Curve     │ ├─Force    │ ├─Color    │ ├─Timeline │    │
│  │  ├─Position   │ ├─Noise     │ ├─Collision│ ├─Shadow   │ ├─Camera   │    │
│  │  ├─Deform     │ ├─Random    │ ├─Constraint│├─Mask     │ ├─Delay    │    │
│  │  └─Skeleton   │ └─Audio     │ └─Attractor│ └─Effects  │ └─Logic    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     LAYER 3: COMPUTE ENGINES                        │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  Animation Engine │ Physics Engine │ Audio Engine │ CV Engine      │    │
│  │  (GSAP - always)  │ (Rapier)       │ (Web Audio)  │ (TensorFlow)   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     LAYER 4: TARGET OBJECTS (Store)                 │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  { id, assetType, base: {...}, computed: {...}, physics: {...} }   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     LAYER 5: RENDERERS                              │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  DOM/CSS        │  PixiJS          │  Three.js       │  Raw WebGL  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     LAYER 6: EXPORT                                 │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  Web Bundle   │ Video (MP4/WebM) │ Hybrid HTML+Video │ PNG Sequence │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## COMPLETE NODE TAXONOMY

### System 1: SCENE IMPORT & ASSETS

| Node                  | Purpose                               | Key Properties                          |
| --------------------- | ------------------------------------- | --------------------------------------- |
| **SceneImporterNode** | Load PSD/Affinity/Illustrator exports | `source`, `format`, `layerMapping`      |
| **SpriteAtlasNode**   | Load texture atlases                  | `atlasJSON`, `atlasImage`, `animations` |
| **FrameSequenceNode** | PNG sequence loading                  | `frames[]`, `fps`, `loop`               |
| **VideoNode**         | Video texture                         | `src`, `syncToTimeline`, `loop`         |
| **AudioNode**         | Audio file + analysis                 | `src`, `transientDetection`, `volume`   |
| **SVGImporterNode**   | Vector import                         | `src`, `preserveStrokes`                |
| **GLTFImporterNode**  | 3D model import                       | `src`, `animations`, `materials`        |
| **FetchNode**         | External data                         | `url`, `method`, `refreshInterval`      |

### System 2: OBJECT SELECTION & LAYER MANAGEMENT

| Node                 | Purpose                | Key Properties                              | Visual Feedback                                                                            |
| -------------------- | ---------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **ObjectPickerNode** | Select targets         | `selectionMode`, `targets[]`, `branchColor` | **Embedded mini-preview window** showing selected objects, group/ungroup, property readout |
| **CherryPickerNode** | Multi-source selection | `sources[]`, `outputList[]`                 | List of picked objects                                                                     |
| **LayerManagerNode** | Panel UI component     | `hierarchy`, `visibility`, `locks`          | Photoshop-style tree                                                                       |
| **GroupNode**        | Collapse node chains   | `children[]`, `collapsed`                   | Expandable group                                                                           |
| **CloneNode**        | Instance objects       | `source`, `count`, `offsetList[]`           | Clone count badge                                                                          |
| **RelocateNode**     | Batch positioning      | `targets[]`, `coordinates[]`                | Position markers                                                                           |

### System 3: TRANSFORM NODES

| Node                    | Purpose               | Key Properties                              |
| ----------------------- | --------------------- | ------------------------------------------- |
| **PositionNode**        | X/Y/Z movement        | `x`, `y`, `z`, `motionPath`, `easing`       |
| **RotationNode**        | Angular rotation      | `angle`, `anchorX/Y`, `continuous`, `speed` |
| **ScaleNode**           | Size transform        | `scaleX/Y`, `uniform`, `anchorX/Y`          |
| **DeformationNode**     | Squash & stretch      | `squashAxis`, `stretchAmount`, `elasticity` |
| **PivotPointNode**      | Transform origin      | `pivotX/Y`, `mode` (pixels/percent)         |
| **SkeletonNode**        | Rigging               | `joints[]`, `constraints[]`, `IKEnabled`    |
| **AnchorNode**          | Deformation points    | `anchorPoints[]`, `weights[]`               |
| **ParallaxHelperNode**  | Depth-based movement  | `depthLayers[]`, `scrollFactor`             |
| **PerspectiveGridNode** | 2.5D depth simulation | `vanishingPoint`, `depthScale`, `blur`      |
| **LoopHelperNode**      | Infinite background   | `target`, `direction`, `seamless`           |

### System 4: SIGNAL GENERATORS

| Node                   | Purpose        | Key Properties                                | Visual Feedback                      |
| ---------------------- | -------------- | --------------------------------------------- | ------------------------------------ |
| **LFONode**            | Oscillator     | `waveform`, `frequency`, `amplitude`, `phase` | **Animated waveform canvas** (60fps) |
| **AnimationCurveNode** | Custom curves  | `type`, `points[]`                            | **Editable curve graph**             |
| **NoiseNode**          | Perlin/Simplex | `type`, `scale`, `octaves`                    | Noise visualization                  |
| **RandomNode**         | Random values  | `min`, `max`, `seed`                          | Distribution preview                 |
| **WaveGeneratorNode**  | Advanced waves | `harmonics[]`, `pulseWidth`                   | Complex wave display                 |
| **BPMSyncNode**        | Beat matching  | `bpm`, `beatDivision`, `tapTempo`             | Beat indicator                       |
| **AudioReactiveNode**  | Sound-driven   | `frequencyBands[]`, `smoothing`               | Spectrum analyzer                    |

### System 5: PHYSICS (4 Core Nodes + Extensions)

| Node                    | Purpose               | Key Properties                                             |
| ----------------------- | --------------------- | ---------------------------------------------------------- |
| **BodyNode**            | Physical identity     | `type`, `mass`, `friction`, `bounciness`, `drag`, `shape`  |
| **ForceFieldNode**      | Forces & gravity      | `mode`, `direction`, `strength`, `falloff`, `radius`       |
| **CollisionNode**       | Surface behavior      | `surfaceType`, `groups`, `mask`, `adhesion`, `onCollision` |
| **ConstraintNode**      | Physical links        | `type`, `connectedTo`, `stiffness`, `damping`, `limits`    |
| **AttractorChainNode**  | Sequential attraction | `points[]`, `order`, `strength`                            |
| **ParticleEmitterNode** | Particle system       | `rate`, `lifetime`, `velocity`, `spread`                   |
| **ParticlePathNode**    | Particle along path   | `path`, `spacing`, `behavior`                              |

### System 6: VISUAL & APPEARANCE

| Node                    | Purpose            | Key Properties                               |
| ----------------------- | ------------------ | -------------------------------------------- |
| **OpacityNode**         | Transparency       | `opacity`, `blendMode`, `effect`             |
| **ColorNode**           | Color manipulation | `tint`, `saturation`, `brightness`, `hue`    |
| **SmartShadowNode**     | Dynamic shadows    | `lightSource`, `colorExtraction`, `rimLight` |
| **LightControllerNode** | Light sources      | `type`, `color`, `intensity`, `position`     |
| **VisualPropsNode**     | Effect stack       | `filters[]`, `masks[]`, `blendModes[]`       |
| **MaskNode**            | Layer masking      | `shape`, `gradient`, `animatable`            |
| **DepthMapNode**        | Fake 3D lighting   | `depthTexture`, `lightResponse`              |
| **ClippingPlaneNode**   | Line-based crop    | `lines[]`, `normals[]`, `targets[]`          |

### System 7: MORPHING & FRAME-BY-FRAME

| Node                  | Purpose                 | Key Properties                             |
| --------------------- | ----------------------- | ------------------------------------------ |
| **FrameAnimatorNode** | Frame sequence playback | `frames[]` OR `spriteSheet`, `fps`, `loop` |
| **TransitorNode**     | Cross-morphing          | `stateA`, `stateB`, `method`               |
| **MorphNode**         | Shape morphing          | `pathA`, `pathB`, `interpolation`          |
| **AniCaptureNode**    | Record to frames        | `duration`, `fps`, `exportFormat`          |
| **OnionSkinNode**     | Preview overlay         | `framesBefore`, `framesAfter`, `opacity`   |

> [!IMPORTANT] > **FrameAnimatorNode accepts BOTH:**
>
> 1. Pre-made sprite sheet (`spriteSheet`, `cols`, `rows`)
> 2. Individual images (`frames[]`) - reorderable in editor
>
> On export, individual images are auto-packed into optimized sprite sheets.

### System 8: TIMELINE & CONTROL

| Node                       | Purpose              | Key Properties                             |
| -------------------------- | -------------------- | ------------------------------------------ |
| **MasterTimelineNode**     | Global playhead      | `duration`, `fps`, `loop`, `scrubPosition` |
| **MiniTimelineNode**       | Node-local keyframes | `keyframes[]`, `linkedToMaster`, `offset`  |
| **PlaybackControllerNode** | Transport controls   | `play`, `pause`, `reverse`, `timeScale`    |
| **TriggerDelayNode**       | Timed triggers       | `delay`, `once`, `linkedToMaster`          |
| **DelayArrayNode**         | Staggered triggers   | `delays[]`, `stagger`, `targets[]`         |
| **ShotManagerNode**        | Scene/take control   | `shots[]`, `transitions[]`, `currentShot`  |
| **HandOverrideNode**       | Manual intervention  | `timestamp`, `property`, `value`           |

### System 9: TRIGGERS & INPUT

| Node                  | Purpose           | Key Properties                         |
| --------------------- | ----------------- | -------------------------------------- |
| **TriggerNode**       | User interaction  | `type`, `target`, `preventDefault`     |
| **KeyboardNode**      | Key detection     | `keys[]`, `combo`, `onPress/onRelease` |
| **ScrollTriggerNode** | Scroll-based      | `start`, `end`, `scrub`, `pin`         |
| **GamepadNode**       | Controller input  | `buttons[]`, `axes[]`, `deadzone`      |
| **GestureNode**       | Touch gestures    | `type`, `threshold`                    |
| **HoverNode**         | Mouse interaction | `enter`, `leave`, `duration`           |

> [!NOTE] > **TriggerNode types**: `click`, `hover`, `scroll`, `keyboard`, `touch`, `gamepad`, `time`, `collision`
>
> **Future CV triggers**: `pose`, `face`, `object` - output numerical or boolean data

### System 10: EXTERNAL I/O & API

| Node                   | Purpose          | Key Properties                         |
| ---------------------- | ---------------- | -------------------------------------- |
| **InputNode**          | Exposed API port | `portName`, `dataType`, `defaultValue` |
| **OutputNode**         | Emit events      | `eventName`, `payload`                 |
| **FetchNode**          | HTTP requests    | `url`, `method`, `headers`, `interval` |
| **WebSocketNode**      | Realtime data    | `url`, `protocol`, `reconnect`         |
| **MIDINode**           | MIDI input       | `channel`, `cc`, `note`, `velocity`    |
| **OSCNode**            | OSC protocol     | `address`, `port`, `args[]`            |
| **DMXNode**            | Lighting control | `universe`, `channels[]`, `values[]`   |
| **HardwareBridgeNode** | Generic hardware | `protocol`, `config`                   |

### System 11: CAMERA & VIEWPORT

| Node                     | Purpose          | Key Properties                               |
| ------------------------ | ---------------- | -------------------------------------------- |
| **CameraNode**           | Virtual camera   | `zoom`, `panX/Y`, `rotation`, `followTarget` |
| **CameraPresetsNode**    | Saved views      | `presets[]`, `transitionDuration`            |
| **MultiDisplayNode**     | Multiple outputs | `displays[]`, `mapping[]`                    |
| **ProjectionMapperNode** | Surface warping  | `corners[]`, `mode`                          |
| **FullscreenNode**       | Display control  | `display`, `cursor`, `escapeDisabled`        |

### System 12: COMPUTER VISION (AI)

| Node                    | Purpose            | Key Properties                       |
| ----------------------- | ------------------ | ------------------------------------ |
| **PoseDetectionNode**   | Body tracking      | `model`, `keypoints[]`, `confidence` |
| **FaceDetectionNode**   | Face tracking      | `landmarks[]`, `expressions[]`       |
| **ObjectDetectionNode** | Object recognition | `model`, `classes[]`, `threshold`    |
| **SegmentationNode**    | Background removal | `model`, `smoothing`                 |

### System 13: EXPORT & OPTIMIZATION

| Node                    | Purpose            | Key Properties                             |
| ----------------------- | ------------------ | ------------------------------------------ |
| **ExportNode**          | Bundle generation  | `profile`, `minify`, `treeshake`           |
| **VideoExportNode**     | Render to video    | `format`, `fps`, `quality`, `alpha`        |
| **HybridExportNode**    | HTML + Video mix   | `interactiveSections[]`, `bakedSections[]` |
| **SequenceExportNode**  | PNG sequence       | `fps`, `format`, `naming`                  |
| **WeightEstimatorNode** | Size analysis      | `breakdown[]`, `suggestions[]`             |
| **AtlasGeneratorNode**  | Sprite packing     | `algorithm`, `maxSize`, `padding`          |
| **LODManagerNode**      | Resolution scaling | `thresholds[]`, `proxies[]`                |
| **StaticZoneAnalyzer**  | Optimization hints | `staticRegions[]`, `animatedRegions[]`     |

### System 14: UTILITIES & WORKFLOW

| Node              | Purpose           | Key Properties                       |
| ----------------- | ----------------- | ------------------------------------ |
| **ValueListNode** | Number arrays     | `values[]`, `autoCount`              |
| **LogicNode**     | Comparators       | `operator`, `valueA`, `valueB`       |
| **MapperNode**    | Value remapping   | `inputRange`, `outputRange`, `curve` |
| **ScriptNode**    | Custom JS         | `code`, `inputs[]`, `outputs[]`      |
| **ConsoleNode**   | AniType scripting | `script`, `autoComplete`             |
| **CommentNode**   | Documentation     | `text`, `timestamp`, `author`        |
| **PreviewNode**   | Mini viewport     | `target`, `showAnimation`            |
| **SnapshotNode**  | State capture     | `properties[]`, `restore()`          |

### System 15: SVG & VECTOR TOOLS

| Node               | Purpose          | Key Properties                   |
| ------------------ | ---------------- | -------------------------------- |
| **PrimitiveNode**  | Basic shapes     | `type`, `params`                 |
| **PathDrawerNode** | Pen tool         | `points[]`, `closed`, `smooth`   |
| **BooleanNode**    | Shape operations | `operation`                      |
| **StrokeNode**     | Line styling     | `width`, `cap`, `join`, `dash[]` |
| **GradientNode**   | Fill gradients   | `type`, `stops[]`, `angle`       |
| **PatternNode**    | Repeating fills  | `tile`, `spacing`, `rotation`    |

### System 16: VJ & GENERATIVE

| Node                 | Purpose             | Key Properties                       |
| -------------------- | ------------------- | ------------------------------------ |
| **StrobeNode**       | Flash effects       | `frequency`, `dutyCycle`, `colors[]` |
| **KaleidoscopeNode** | Mirror effects      | `segments`, `rotation`, `offset`     |
| **FeedbackNode**     | Trail/echo          | `decay`, `blend`, `offset`           |
| **FractalNode**      | Generative patterns | `type`, `iterations`, `zoom`         |
| **DisplacementNode** | Warp effects        | `map`, `intensity`, `scale`          |
| **OffsetNode**       | Echo/delay visual   | `copies`, `offsetX/Y`, `fadeOut`     |

### System 17: DEBUG & RAPID INPUT

| Node                 | Purpose            | Key Properties                          | Visual Feedback                                |
| -------------------- | ------------------ | --------------------------------------- | ---------------------------------------------- |
| **DebugOverlayNode** | Visual ID display  | `showBoundingBoxes`, `showIDs`, `color` | Colored bounding boxes + ID labels in viewport |
| **NumericFieldNode** | Quick number input | `value`, `range`, `step`                | Floating number input                          |
| **SwitchNode**       | Boolean toggle     | `value`                                 | Floating toggle button                         |
| **SliderNode**       | Range input        | `value`, `min`, `max`, `step`           | Floating slider                                |
| **InfoPanelNode**    | Raw data display   | `source`, `format`                      | Grasshopper-style data inspector               |

---

## RICH UI NODE SYSTEM

Nodes are **NOT headless**. They feature embedded visual feedback:

| Node Type              | Visual Feedback                     |
| ---------------------- | ----------------------------------- |
| **LFONode**            | 60fps animated waveform canvas      |
| **AnimationCurveNode** | Editable Bezier curve graph         |
| **PositionNode**       | Animated point on Cartesian plane   |
| **ScaleNode**          | Live readout numbers                |
| **RotationNode**       | Radial angle indicator              |
| **ObjectPickerNode**   | Mini preview window with thumbnails |
| **TimelineNode**       | Mini scrubber with keyframe dots    |

### Design System

The custom node UI is built on the Aninode Design System (`quick_reference/aninode-design-system`):

| Feature     | Implementation                                      |
| ----------- | --------------------------------------------------- |
| Theme       | OLED Black with neon accents                        |
| Canvas      | Infinite pan/zoom with physics                      |
| Wires       | Bezier, Straight (telepathic), Step, Double, Dotted |
| Connections | Smart bi-directional, type conversion               |
| Mobile      | Pinch zoom, tap-to-connect, long-press menus        |

---

## CONNECTION SYSTEM ARCHITECTURE

### Property Publishing (Node Communication)

> [!IMPORTANT]
> Nodes don't communicate directly. All data flows through the **central store** (`aninodeStore`). When we say a node "publishes" to another, we mean it writes to the store, and the target reads from the store.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               NODE PROPERTY EXPOSURE PATTERN                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────┐     ┌────────────────┐     ┌────────────────┐          │
│  │   LFO Node     │     │  Scale Node    │     │  Target Asset  │          │
│  │                │     │                │     │                │          │
│  │ outputs:       │────▶│ overrides:     │────▶│ computed:      │          │
│  │  { value: 1.5 }│     │ { scaleX: 1.5 }│     │ { scale: 1.5 } │          │
│  │                │     │                │     │                │          │
│  │ [No preset -   │     │ [Publishes     │     │ [Rendered]     │          │
│  │  raw output]   │     │  transform     │     │                │          │
│  │                │     │  properties]   │     │                │          │
│  └────────────────┘     └────────────────┘     └────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Modifier Hierarchy (Processing Order)

Signal generators (LFO, Noise, Curve) process **BEFORE** modifier nodes because modifiers may consume their outputs.

| Layer       | Node Types        | Behavior                                                  |
| ----------- | ----------------- | --------------------------------------------------------- |
| **Layer 0** | Signal Generators | LFO, Noise, Curve → output raw values                     |
| **Layer 1** | Modifiers         | Scale, Rotation, Opacity → read signals, apply to targets |
| **Layer 2** | Assets            | Scene objects → receive computed transforms               |

### Connection Workflows

When nodes are wired together, the target node can **select which properties** to map:

#### Workflow A: Modifier → Asset (Direct)

```
ScaleNode → Asset
           │
           ├─ Default: Apply uniform scale to center
           └─ Custom Mapping Panel:
                ├─ Override scaleX only
                ├─ Override scaleY only
                └─ Override both (uniform/non-uniform)
```

#### Workflow B: Signal → Modifier (Indirect)

```
LFONode → ScaleNode
          │
          ├─ LFO has no preset (doesn't know what to target)
          ├─ Reads Scale's published properties
          └─ Side Panel Options:
               ├─ Text field: "startScale, endScale"
               └─ Dropdown: [startScale] [endScale] [duration]
```

#### Workflow C: Signal → Asset (Future - Direct Override)

```
LFONode → Asset (bypass modifier layer)
          │
          ├─ LFO reads asset's properties
          └─ Maps directly:
               ├─ x, y (position)
               ├─ scaleX, scaleY
               └─ rotation
```

### Property Mapping UI

| Mode           | When to Use          | UI                                       |
| -------------- | -------------------- | ---------------------------------------- |
| **Text Input** | Quick, power users   | Comma-separated: `scaleX, scaleY`        |
| **Dropdown**   | Discovery, beginners | Select from published properties         |
| **Auto-Map**   | Simple 1:1           | LFO.value → target.speed (single output) |

### Multi-Object Control

| Node                 | Purpose                           |
| -------------------- | --------------------------------- |
| **ObjectPickerNode** | Select single or multiple targets |
| **GrouperNode**      | Create reusable target groups     |
| **CherryPickerNode** | Select from multiple sources      |

When controlling many objects, connect via Picker/Grouper instead of direct wiring:

```
┌──────────┐     ┌──────────────┐     ┌────────────────┐
│   LFO    │────▶│  ScaleNode   │────▶│  ObjectPicker  │
│          │     │              │     │                │
│          │     │              │     │  targets: [    │
│          │     │              │     │    obj1,       │
│          │     │              │     │    obj2,       │
│          │     │              │     │    obj3        │
│          │     │              │     │  ]             │
└──────────┘     └──────────────┘     └────────────────┘
```

---

## ANIMATION CONTROL MODES

### Speed vs Duration

Transform nodes support two timing modes depending on use case:

| Mode         | Property           | Use Case                    | Example                       |
| ------------ | ------------------ | --------------------------- | ----------------------------- |
| **Speed**    | `rotations/sec`    | Ambient, independent motion | "Spin at 0.5 rot/s forever"   |
| **Duration** | `seconds/rotation` | Choreography, timeline sync | "Complete 1 rotation in 2.5s" |

```
┌─────────────────────────────────────────────────────────────────┐
│  Timing Mode: [ Speed ▼ ]                                       │
│                                                                 │
│  Speed Mode:                                                    │
│  ├─ Speed: [1.0] rotations/second                              │
│  ├─ Direction: [Clockwise ▼]                                   │
│  └─ Loops infinitely until stopped                             │
│                                                                 │
│  Duration Mode:                                                 │
│  ├─ Duration: [2.5] seconds per rotation                       │
│  ├─ Iterations: [3] or [Infinite]                              │
│  └─ Syncs to MasterTimeline if linked                          │
└─────────────────────────────────────────────────────────────────┘
```

### When to Use Each Mode

| Scenario                 | Mode                 | Reason                       |
| ------------------------ | -------------------- | ---------------------------- |
| Background spinning logo | Speed                | Continuous, no end point     |
| Loading spinner          | Speed                | Rate matters, not timing     |
| Choreographed sequence   | Duration             | Must finish at specific time |
| Audio-synced animation   | Duration             | Beat-matched with timeline   |
| LFO controlling rotation | Speed                | Varying rate dynamically     |
| LFO controlling angle    | Duration→staticAngle | Oscillate between positions  |

> [!TIP]
> When LFO modulates rotation, use **Duration mode with staticAngle** for smooth oscillation. Using LFO on Speed causes erratic behavior due to continuous derivative changes. Square waves work with Speed mode for instant state changes.

---

## TIMELINE SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MASTER TIMELINE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  0s ─────────────── 10s ─────────────── 20s ─────────────── 30s            │
│  ├─ Audio Track ──────────────────────────────────────────────             │
│  ├─ Shot 1 ────────│─ Shot 2 ──────────│─ Shot 3 ─────────────             │
│  │                                                                          │
│  │  ┌─ MiniTimeline (Node A) ─────────┐                                    │
│  │  │  Keyframes: ●───●───●───●       │                                    │
│  │  └─────────────────────────────────┘                                    │
│  │                                                                          │
│  │  ┌─ MiniTimeline (Node B) ─────────────────────┐                        │
│  │  │  Keyframes:    ●─────●────●                 │                        │
│  │  └─────────────────────────────────────────────┘                        │
│  │                                                                          │
│  │  ┌─ Infinite Loop (Node C) ─────∞                                       │
│  │  │  Not connected to master, runs independently                         │
│  │  └───────────────────────────────────────────────────                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Timeline Features (from AudioTimeline.tsx reference)

| Feature          | Description                              |
| ---------------- | ---------------------------------------- |
| **Clips**        | Draggable, trimmable via edge handles    |
| **Waveforms**    | Audio waveform visualization             |
| **Scrubbing**    | Click-to-seek, real-time playhead        |
| **Keyboard**     | Space = play/pause, Delete = remove clip |
| **Snap to Grid** | Configurable grid snapping               |
| **Transport**    | Play, Pause, Stop controls               |

### Timeline Modes

| Mode             | Description                                            |
| ---------------- | ------------------------------------------------------ |
| **Linked**       | Node follows master timeline position                  |
| **Offset**       | Node starts at master time + offset                    |
| **Independent**  | Node runs its own clock (infinite loops, interactions) |
| **Event-Driven** | Node only activates on triggers, no time dependency    |

### Bidirectional Sync

```
Node Keyframes ←→ Timeline

• Setting keyframes in node → appears on timeline
• Dragging clip on timeline → updates node's time fields
• Selecting node → highlights corresponding timeline track
• Selecting track → highlights node in graph
```

---

## INPUT NODE (EXPOSED API)

For exported projects, users can connect their own UI:

```typescript
window.AninodeAPI = {
  play: () => void,
  pause: () => void,
  seek: (time: number) => void,
  goToShot: (shotId: string) => void,

  // Custom inputs (defined by InputNodes)
  inputs: {
    'character-mood': (value: 'happy' | 'sad' | 'angry') => void,
    'scroll-position': (value: number) => void,
  },

  // Events (defined by OutputNodes)
  on: (event: string, callback: Function) => void,
}
```

---

## FILE STRUCTURE

```
src/
├── core/                      # ALWAYS INCLUDED (~5KB)
│   ├── engineStore.ts               # Valtio (nodes, targets, timeline)
│   ├── useNodeRegistration.ts
│   ├── types.ts
│   └── ModifierChain.ts
│
├── nodes/                     # TREE-SHAKEABLE
│   ├── transform/
│   ├── signal/
│   ├── physics/
│   ├── visual/
│   ├── timeline/
│   ├── trigger/
│   ├── io/
│   ├── camera/
│   ├── cv/
│   ├── vj/
│   ├── debug/                 # NEW: DebugOverlayNode, InfoPanelNode
│   └── export/
│
├── engines/                   # TREE-SHAKEABLE
│   ├── AnimationEngine.ts
│   ├── PhysicsEngine.ts
│   ├── AudioEngine.ts
│   └── CVEngine.ts
│
├── renderers/                 # SELECT ONE
│   ├── DOMRenderer.ts
│   ├── PixiRenderer.ts
│   └── ThreeRenderer.ts
│
├── timeline/                  # TREE-SHAKEABLE
│   ├── MasterTimeline.ts
│   ├── MiniTimeline.ts
│   └── TimelineSync.ts
│
├── importers/                 # TREE-SHAKEABLE
│   ├── PSDImporter.ts
│   ├── AffinityImporter.ts
│   ├── IllustratorImporter.ts
│   └── GLTFImporter.ts
│
├── exporters/                 # TREE-SHAKEABLE
│   ├── WebExporter.ts
│   ├── VideoExporter.ts
│   ├── HybridExporter.ts
│   └── SequenceExporter.ts
│
└── ui/                        # EDITOR ONLY
    ├── NodeEditor/
    ├── Timeline/
    ├── LayerManager/
    ├── PropertiesPanel/
    └── Viewport/
```

---

## IMPLEMENTATION PHASES

### Phase 1: MVP Core (Weeks 1-4)

- [ ] PositionNode, RotationNode, ScaleNode, OpacityNode
- [ ] LFONode, AnimationCurveNode
- [ ] SceneImporterNode (PSD JSON)
- [ ] ObjectPickerNode with mini-preview
- [ ] Basic DOM Renderer
- [ ] Store with base/computed separation

### Phase 2: Timeline & Control (Weeks 5-8)

- [ ] MasterTimelineNode
- [ ] MiniTimelineNode
- [ ] PlaybackControllerNode
- [ ] TriggerNode (click, hover, keyboard)
- [ ] DelayArrayNode
- [ ] CameraNode

### Phase 3: Physics (Weeks 9-12)

- [ ] BodyNode
- [ ] ForceFieldNode
- [ ] CollisionNode
- [ ] ConstraintNode
- [ ] PhysicsEngine (Rapier integration)

### Phase 4: Visuals & Effects (Weeks 13-16)

- [ ] ColorNode
- [ ] SmartShadowNode
- [ ] LightControllerNode
- [ ] MaskNode
- [ ] VisualPropsNode
- [ ] FrameAnimatorNode (with auto sprite packing)

### Phase 5: Export System (Weeks 17-20)

- [ ] ExportNode (web bundle)
- [ ] VideoExportNode
- [ ] HybridExportNode
- [ ] WeightEstimatorNode
- [ ] LODManagerNode

### Phase 6: Advanced I/O (Weeks 21-24)

- [ ] InputNode (Exposed API)
- [ ] FetchNode
- [ ] MIDINode, OSCNode, DMXNode
- [ ] WebSocketNode

### Phase 7: VJ & Live (Weeks 25-28)

- [ ] BPMSyncNode
- [ ] StrobeNode, FeedbackNode
- [ ] MultiDisplayNode
- [ ] ProjectionMapperNode
- [ ] AudioReactiveNode

### Phase 8: AI/CV (Weeks 29-32)

- [ ] PoseDetectionNode
- [ ] FaceDetectionNode
- [ ] ObjectDetectionNode

### Phase 9: Collaboration (Weeks 33-36)

- [ ] Cloud storage integration
- [ ] Comment system
- [ ] Version control
- [ ] Multi-language support

---

## NON-DESTRUCTIVE WORKFLOW

```
Original Asset (IMMUTABLE)
    ↓
┌─────────────────────────────────────────────────────────┐
│               MODIFIER CHAIN (Cumulative)               │
├─────────────────────────────────────────────────────────┤
│  BodyNode → adds physics position offset               │
│  RotationNode → adds rotation delta                    │
│  LFONode → modulates rotation                          │
│  ScaleNode → adds scale multiplier                     │
│  ParallaxNode → adds scroll-based position             │
└─────────────────────────────────────────────────────────┘
    ↓
COMPUTED TRANSFORM = base + Σ(modifiers)
    ↓
Renderer displays computed values

★ Disconnect any node → its contribution is removed
★ Original asset never changes
```

---

## LOCALIZATION

All UI strings use i18next with language packs:

- English, Spanish, German, French, Japanese, Portuguese, Chinese

Layer name recognition in importers supports:

- `camera_1`, `camara_1`, `カメラ_1`
- `joint_arm`, `articulacion_brazo`
- Case insensitive, accent tolerant

---

_Version: 4.1 - Complete Vision Integration with Clarifications_
_Status: Master Reference Document_
