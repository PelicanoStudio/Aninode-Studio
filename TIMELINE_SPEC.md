# Aninode Timeline System Specification

## Overview

The timeline system is a **mixed ecosystem** where:

- Audio tracks live directly on the Master Timeline
- Nodes can be connected OR independent of the timeline
- Bidirectional synchronization between node keyframes and timeline clips
- Mini-timelines provide local keyframe sequences within nodes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TIMELINE SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     MASTER TIMELINE                                  │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  Playhead  │  Audio Tracks  │  Shot/Scene Management  │  Global FPS │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      ↓↑                                      │
│                         BIDIRECTIONAL SYNC                                   │
│                                      ↓↑                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     MINI-TIMELINES (per node)                        │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  Linked Mode  │  Offset Mode  │  Independent Mode  │  Event Mode   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     NODE TRIGGERS                                    │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  Time-based  │  Event-based  │  Loop-based  │  External Input      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Master Timeline

### Core Properties

| Property      | Type         | Description                                        |
| ------------- | ------------ | -------------------------------------------------- |
| `duration`    | number       | Total timeline duration in seconds                 |
| `fps`         | number       | Frames per second (24, 30, 60, etc.)               |
| `currentTime` | number       | Current playhead position (seconds)                |
| `isPlaying`   | boolean      | Playback state                                     |
| `timeScale`   | number       | Playback speed multiplier (0.5 = half, 2 = double) |
| `loop`        | boolean      | Whether to loop at end                             |
| `loopRegion`  | [start, end] | Optional loop in/out points                        |

### Audio Track Integration

Audio files can be placed directly on the Master Timeline:

```typescript
interface AudioTrack {
  id: string;
  src: string; // Audio file URL
  audioBuffer: AudioBuffer; // Decoded audio data
  startTime: number; // Position on timeline (seconds)
  trimStart: number; // Trim from start of audio
  trimEnd: number; // Trim from end of audio
  duration: number; // Original audio duration
  volume: number; // 0.0 - 1.0
  muted: boolean;
  color: string; // Track visual color
  name: string; // Display name
}
```

### Shot/Scene Management

Scenes (Shots) divide the timeline into logical segments:

```typescript
interface Shot {
  id: string;
  name: string; // "Intro", "Scene 1", etc.
  startTime: number;
  endTime: number;
  color: string;
  transition?: {
    type: "cut" | "fade" | "dissolve" | "wipe";
    duration: number;
  };
}
```

---

## Mini-Timelines

Each node can have an embedded mini-timeline for local keyframe sequences.

### Structure

```typescript
interface MiniTimeline {
  nodeId: string; // Parent node
  keyframes: Keyframe[]; // Time-value pairs
  mode: TimelineMode; // How it syncs with master
  offset: number; // Offset from master (if Offset mode)
  duration: number; // Local duration
  loop: boolean; // Loop independently
}

interface Keyframe {
  time: number; // Time in seconds (local to mini-timeline)
  value: any; // Property value at this keyframe
  easing: EasingFunction; // Interpolation curve
}

type TimelineMode = "linked" | "offset" | "independent" | "event";
```

### Timeline Modes

| Mode            | Behavior                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------- |
| **Linked**      | Mini-timeline follows Master Timeline 1:1. When master plays, mini-timeline plays.          |
| **Offset**      | Mini-timeline starts at `masterTime + offset`. Useful for staggered animations.             |
| **Independent** | Mini-timeline runs its own clock. Unaffected by master play/pause. Used for infinite loops. |
| **Event**       | No time dependency. Keyframes triggered by external events (click, collision, etc.)         |

---

## Bidirectional Synchronization

The core innovation: changes in either direction propagate automatically.

### Node → Timeline

When keyframes are set in a node:

1. Node emits `keyframeChange` event
2. TimelineSync service receives event
3. Corresponding track on Master Timeline updates
4. Timeline UI re-renders

```typescript
// Example: Setting keyframe in node
node.setKeyframe(2.5, { rotation: 45 });
// → Timeline shows keyframe dot at 2.5s on this node's track
```

### Timeline → Node

When clips/keyframes are edited on the timeline:

1. Timeline emits `trackChange` event
2. TimelineSync service identifies target node
3. Node's mini-timeline/keyframes update
4. Node re-renders with new values

```typescript
// Example: Dragging keyframe on timeline from 2.5s to 3.0s
timeline.moveKeyframe(nodeId, oldTime: 2.5, newTime: 3.0);
// → Node's internal keyframe moves to 3.0s
```

### Selection Highlighting

| User Action                | Result                                                     |
| -------------------------- | ---------------------------------------------------------- |
| Select node in Node Editor | Timeline track for that node highlights                    |
| Select track in Timeline   | Corresponding node highlights in Node Editor               |
| Click keyframe in Timeline | Node scrolls into view, property panel shows that keyframe |
| Click keyframe in Node     | Timeline playhead moves to that time                       |

---

## Timeline UI Components

### Master Timeline Panel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [◀][▶][⏹] │ 00:15.30 / 01:00.00 │ [🔁 Loop] [⏱ 1.0x]                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ⌛ Shots  │ Shot 1 ──────────│ Shot 2 ──────────│ Shot 3 ──────────────   │
├─────────────────────────────────────────────────────────────────────────────┤
│  🎵 Audio │ ▓▓▓░░░▓▓▓░░░▓▓▓ (waveform) ────────────────────────            │
├─────────────────────────────────────────────────────────────────────────────┤
│  🔄 Rot   │ ●───────●───────●                                              │
│  📐 Scale │      ●─────●                                                   │
│  📍 Pos   │ ●─────────────●──────●                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  0s        5s        10s       15s       20s       25s       30s           │
│  |         |         |         |▼        |         |         |             │
└─────────────────────────────────────────────────────────────────────────────┘
                                  ↑ Playhead
```

### Track Types

| Track Type       | Icon        | Content                                 |
| ---------------- | ----------- | --------------------------------------- |
| **Shot Track**   | ⌛          | Scene segments with transitions         |
| **Audio Track**  | 🎵          | Waveform visualization, trimmable clips |
| **Node Track**   | 🔄📐📍 etc. | Keyframe dots, connecting lines         |
| **Marker Track** | 📍          | Named timestamps, beat markers          |

### Interactions (from AudioTimeline.tsx reference)

| Action                | Behavior                                             |
| --------------------- | ---------------------------------------------------- |
| **Click on timeline** | Move playhead to that position                       |
| **Drag clip**         | Move clip horizontally (time) and vertically (track) |
| **Drag clip edge**    | Trim start or end of clip                            |
| **Space**             | Toggle play/pause                                    |
| **Delete**            | Remove selected clip/keyframe                        |
| **Scroll wheel**      | Zoom in/out of timeline                              |
| **Alt + Scroll**      | Vertical zoom (track height)                         |
| **Shift + Drag**      | Snap to grid                                         |

---

## Keyframe Input in Nodes

Nodes can define trigger times directly in their properties:

```typescript
// Example: RotationNode keyframes field
interface RotationNodeConfig {
  angle: number;
  speed: number;
  keyframes: KeyframeField; // Editable in side panel
}

interface KeyframeField {
  entries: Array<{
    time: number; // When to trigger
    value: number; // What value to animate to
    easing: string; // Easing function
  }>;
}
```

When user edits `keyframes` in the side panel:

1. Values update in node config
2. Bidirectional sync sends changes to timeline
3. Timeline track updates with new keyframe positions

---

## Store Structure

```typescript
interface TimelineStore {
  // Master Timeline
  master: {
    duration: number;
    fps: number;
    currentTime: number;
    isPlaying: boolean;
    timeScale: number;
    loop: boolean;
    loopRegion: [number, number] | null;
  };

  // Tracks
  audioTracks: Map<string, AudioTrack>;
  shots: Map<string, Shot>;

  // Node-to-Timeline mapping
  nodeTimelines: Map<string, MiniTimeline>;

  // Selection state
  selectedTrackIds: string[];
  selectedKeyframes: Array<{ nodeId: string; time: number }>;

  // UI state
  zoom: number; // Pixels per second
  scrollX: number; // Horizontal scroll position
  snapToGrid: boolean;
  gridSize: number; // Grid subdivision
}
```

---

## GSAP Integration

The timeline system uses GSAP for actual animation execution:

```typescript
// Master Timeline maps to GSAP global timeline
const masterTimeline = gsap.timeline({
  paused: true,
  onUpdate: () => {
    store.master.currentTime = masterTimeline.time();
  },
});

// Seeking
function seek(time: number) {
  masterTimeline.seek(time);
  store.master.currentTime = time;
}

// Play/Pause
function play() {
  masterTimeline.play();
  store.master.isPlaying = true;
}

function pause() {
  masterTimeline.pause();
  store.master.isPlaying = false;
}

// Time scale
function setTimeScale(scale: number) {
  masterTimeline.timeScale(scale);
  store.master.timeScale = scale;
}
```

### Node Animation Registration

When a node is connected (Linked/Offset mode):

```typescript
// Add node's animation to master timeline
masterTimeline.add(
  gsap.to(targetRef, {
    rotation: node.config.angle,
    duration: node.config.duration,
    ease: node.config.easing,
  }),
  node.miniTimeline.offset // Start position on master
);
```

When a node is independent:

```typescript
// Separate timeline, not added to master
const independentTl = gsap.timeline({
  repeat: -1, // Infinite loop
  yoyo: node.config.yoyo,
});
```

---

## Events API

```typescript
// Timeline events
timelineStore.on("play", () => {});
timelineStore.on("pause", () => {});
timelineStore.on("seek", (time: number) => {});
timelineStore.on("timeUpdate", (time: number) => {});
timelineStore.on("shotChange", (shot: Shot) => {});

// Sync events
timelineStore.on("keyframeAdd", (nodeId, time, value) => {});
timelineStore.on("keyframeMove", (nodeId, oldTime, newTime) => {});
timelineStore.on("keyframeRemove", (nodeId, time) => {});
timelineStore.on("trackSelect", (nodeId) => {});
```

---

## Implementation Phases

### Phase 1: Core Timeline (Week 5)

- [ ] TimelineStore with Valtio
- [ ] MasterTimelineNode component
- [ ] Basic playhead and transport controls
- [ ] GSAP integration for playback

### Phase 2: Node Tracks (Week 6)

- [ ] MiniTimeline per node
- [ ] Keyframe visualization
- [ ] Bidirectional sync service
- [ ] Track selection highlighting

### Phase 3: Audio (Week 7)

- [ ] Audio track import
- [ ] Waveform visualization (canvas)
- [ ] Audio clip trimming
- [ ] Volume/mute controls

### Phase 4: Polish (Week 8)

- [ ] Zoom/scroll interactions
- [ ] Grid snapping
- [ ] Shot management
- [ ] Keyboard shortcuts

---

## File Structure

```
src/
├── timeline/
│   ├── TimelineStore.ts        # Valtio store
│   ├── MasterTimeline.tsx      # Main timeline component
│   ├── TimelineTrack.tsx       # Individual track row
│   ├── AudioTrack.tsx          # Audio waveform track
│   ├── KeyframeTrack.tsx       # Node keyframe track
│   ├── Playhead.tsx            # Playhead component
│   ├── TransportControls.tsx   # Play/pause/stop
│   ├── TimelineSync.ts         # Bidirectional sync service
│   └── hooks/
│       ├── useTimelineZoom.ts
│       ├── usePlayhead.ts
│       └── useKeyframeDrag.ts
```

---

_Version: 1.0_
_Status: Specification Document_
