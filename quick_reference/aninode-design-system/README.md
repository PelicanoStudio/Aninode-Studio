# Aninode Design System

A high-fidelity, node-based UI library designed for next-generation animation engines. This system features an "OLED Black" aesthetic, infinite canvas navigation, and a robust signal flow visualization engine. **Now with full touch and mobile support!**

## 🏗️ Architecture

### Modular Structure

The codebase has been refactored into a clean, maintainable architecture optimized for library packaging:

```
aninode-design-system/
├── components/
│   ├── canvas/           # Canvas-related components
│   │   ├── CanvasBackground.tsx
│   │   └── ConnectionLine.tsx
│   ├── nodes/            # Node components
│   │   ├── BaseNode.tsx
│   │   ├── NodeContent.tsx
│   │   └── Visualizer.tsx
│   ├── ui/               # UI components
│   │   ├── Header.tsx
│   │   ├── NodePicker.tsx
│   │   ├── ShortcutsPanel.tsx
│   │   └── Input.tsx
│   └── SidePanel.tsx     # Property inspector
├── hooks/                # Custom React hooks
│   ├── usePinchZoom.ts  # Touch gesture support
│   └── useLongPress.ts  # Long-press detection
├── utils/                # Utility functions
│   ├── deviceDetection.ts
│   └── geometry.ts
├── constants.ts          # App-wide constants
├── types.ts              # TypeScript definitions
└── App.tsx               # Main orchestrator
```

### Key Design Principles

- **Separation of Concerns**: Canvas logic, UI components, and business logic are cleanly separated
- **Reusability**: All components are self-contained and reusable
- **Type Safety**: Full TypeScript coverage for all components
- **Hook-based Logic**: Custom hooks encapsulate complex interactions (pinch-zoom, long-press)

## Key Features

### Core Architecture

- **Node-Based Workflow**: Modular components for procedural generation and signal processing
- **Infinite Canvas**: Physics-based panning and zooming with infinite workspace
- **Telepathic Connections**: Property-to-property binding system allowing values to be transmitted wirelessly between nodes
- **Signal Flow Visualization**: Dynamic highlighting of upstream and downstream signal chains
- **Touch & Mobile Support**: Full support for touch gestures including pinch-to-zoom and long-press interactions

### Wiring & Connections

- **Smart Connection System**: Bi-directional wiring (Input-to-Output or Output-to-Input) with automatic compatibility filtering
- **Hot Wire Mode**: `Shift + Click` on any port (or tap on mobile) to activate "hot wire" mode for quick connections
- **Cable Types**:
  - **Bezier**: Standard smooth curve for continuous signals
  - **Straight (Telepathic)**: Direct visual link for bound properties
  - **Step**: Orthogonal routing for logic paths
  - **Double**: Dual-strand rendering for complex data types, utilizing a gap-masking technique for visual clarity
  - **Dotted**: Auxiliary control signals
- **Connection Logic**:
  - **One-to-One Restriction**: Prevents duplicate connections between the same ports
  - **Automatic Type Conversion**: Boolean (0/1) and normalized decimal (0.0-1.0) values are automatically converted to percentages (0-100%) when connected to compatible fields (e.g., Sliders, Transform Scale)

### Mobile & Touch Support

- **Device Detection**: Automatically detects mobile/tablet devices without relying on screen size
- **Pinch-to-Zoom**: Native two-finger pinch gesture support for zoom control
- **Tap-to-Connect**: Single tap on ports activates hot wire mode on mobile devices
- **Long-Press Teleportation**: Hold any property field to open the teleportation menu (replaces right-click on desktop)
- **Touch-Optimized UI**: All interactive elements support both mouse and touch events

### Property Teleportation

- **Wireless Property Binding**: Right-click (or long-press on mobile) any property in the side panel to broadcast/receive values
- **Visual Feedback**: Bound properties display a link icon indicator
- **Enhanced Context Menu**:
  - Property name display in header
  - Color-coded icons (red for broadcast, green for receive)
  - Source node label when receiving
  - Clean separation between actions

### Interaction & Controls

- **Multi-Selection**: Select multiple nodes via `Shift + Click`
- **Clipboard Operations**: Copy (`Ctrl + C`) and Paste (`Ctrl + V`) nodes preserving configuration (excluding connections)
- **History Management**: Robust Undo (`Ctrl + Z`) and Redo (`Ctrl + Y`) system for all canvas operations
- **Focus Controls**: Instantly frame selected nodes (`F`) or the entire graph (`Shift + F`)
- **Quick Access**: Rapidly add nodes via the Node Picker (`Shift + Tab`)
- **Quick Clone**: `Ctrl + Alt + Drag` from an output port to instantly clone a node with connection
- **Collapsible Shortcuts**: Shortcut legend panel can be toggled to save screen space

### Visuals & Aesthetics

- **OLED Theme**: Deep black backgrounds with high-contrast neon accents
- **Adaptive Grid**: Context-aware grid system (Dots/Lines/Crosshair) with optimized visibility for both Light and Dark modes
- **Inverse Scaling**: UI elements maintain consistent stroke weights regardless of zoom level
- **Real-time Visualization**: 60fps canvas-based rendering for Oscillator waveforms
- **Property Inspector**: Dedicated side panel for editing node properties with context menu support

## Keyboard Shortcuts

| Action                     | Desktop Shortcut             | Mobile/Touch        |
| :------------------------- | :--------------------------- | :------------------ |
| **Pan Canvas**             | Left Drag (Background)       | One-finger drag     |
| **Zoom**                   | Mouse Wheel                  | Pinch gesture       |
| **Add to Selection**       | `Shift` + Click              | N/A                 |
| **Node Picker**            | `Shift` + `Tab`              | N/A                 |
| **Undo**                   | `Ctrl` + `Z`                 | N/A                 |
| **Redo**                   | `Ctrl` + `Y`                 | N/A                 |
| **Copy**                   | `Ctrl` + `C`                 | N/A                 |
| **Paste**                  | `Ctrl` + `V`                 | N/A                 |
| **Focus Selected**         | `F`                          | N/A                 |
| **Focus All**              | `Shift` + `F`                | N/A                 |
| **Duplicate Node**         | `Alt` + Drag                 | N/A                 |
| **Quick Clone**            | `Ctrl` + `Alt` + Drag (Port) | N/A                 |
| **Delete**                 | `Delete` / `Backspace`       | N/A                 |
| **Disconnect Wire**        | `Alt` + Click Wire           | N/A                 |
| **Hot Wire Mode**          | `Shift` + Click Port         | Tap Port            |
| **Property Teleportation** | Right-click Property         | Long-press Property |
| **Select Node**            | Click Node                   | Tap Node            |

## Technical Stack

- **Framework**: React 19
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Rendering**: Hybrid SVG (wires) and HTML5 Canvas (visualizers)
- **TypeScript**: Full type coverage

## Getting Started

1. **Install dependencies**: `npm install`
2. **Run dev server**: `npm run dev`
3. **Build**: `npm run build`

## Future Library Packaging

This codebase is structured to be easily packaged as a standalone library:

- Modular component architecture allows selective imports
- Custom hooks can be reused in other projects
- Utility functions are framework-agnostic
- Clear separation between core logic and presentation

### Planned as Web App

- iOS/Android deployment via web-based wrapper
- PWA support for offline usage
- Native gesture support already implemented
- Optimized for both desktop and mobile workflows
