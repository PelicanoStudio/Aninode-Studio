/**
 * @aninode/ui - Layout Tokens
 * Dimension, sizing, and z-index constants for consistent spacing
 */

// =============================================================================
// NODE DIMENSIONS
// =============================================================================
export const node = {
  /** Node default width in pixels */
  width: 256,
  /** Node approximate height (varies with content) */
  defaultHeight: 128,
  /** Node header height */
  headerHeight: 48,
  /** Node body padding */
  bodyPadding: 12,
  /** Node border radius */
  borderRadius: 12, // rounded-xl
} as const;

// =============================================================================
// PORT DIMENSIONS & OFFSETS
// =============================================================================
export const port = {
  /** Outer port circle size */
  size: 12,
  /** Inner port dot size */
  innerSize: 6,
  /** Port hitbox size for interaction */
  hitboxSize: 24,
  
  /** Horizontal offset from node edge */
  offsetX: 24, // -left-6 / -right-6 = 1.5rem = 24px
  /** Vertical offset from node top */
  offsetY: 40, // top-7 + visual centering
  
  /** Output port X position relative to node position */
  outputX: 272, // node.width + 16 (port offset)
  /** Input port X position relative to node position */
  inputX: -16,
} as const;

// =============================================================================
// WIRE/CONNECTION LAYOUT
// =============================================================================
export const wire = {
  /** Bezier curve control point horizontal offset */
  controlPointOffset: 100,
  /** Click hitbox width for wire selection */
  hitboxWidth: 15,
  /** Default dash array gap */
  dashGap: 5,
  /** Dotted wire dash size */
  dottedDash: 10,
} as const;

// =============================================================================
// CANVAS/VIEWPORT
// =============================================================================
export const canvas = {
  /** Grid snap size */
  snapSize: 20,
  /** Minimum zoom level */
  zoomMin: 0.2,
  /** Maximum zoom level */
  zoomMax: 3,
  /** Focus view padding */
  focusPadding: 100,
  /** Zoom sensitivity for wheel events */
  zoomSensitivity: 0.001,
} as const;

// =============================================================================
// PANEL DIMENSIONS
// =============================================================================
export const panel = {
  /** SidePanel width */
  sidePanelWidth: 320, // w-80 = 20rem = 320px
  /** Header height */
  headerHeight: 56, // h-14 = 3.5rem = 56px
  /** Shortcuts panel position from edge */
  shortcutsOffset: 16, // 1rem
  /** Context menu width */
  contextMenuWidth: 192, // w-48 = 12rem = 192px
  /** Teleport menu width */
  teleportMenuWidth: 224, // w-56 = 14rem = 224px
} as const;

// =============================================================================
// Z-INDEX LAYERS
// =============================================================================
export const zIndex = {
  /** Canvas/grid background */
  canvasBackground: 0,
  /** Default node layer */
  node: 10,
  /** Connection wires */
  wires: 10,
  /** Shortcuts panel */
  shortcuts: 40,
  /** Selected node (elevated) */
  nodeSelected: 50,
  /** Header bar */
  header: 50,
  /** Port interaction layer */
  port: 50,
  /** Side panel */
  sidePanel: 60,
  /** Context menus */
  contextMenu: 100,
  /** Node picker modal */
  modal: 150,
} as const;

// =============================================================================
// BORDER SCALING
// =============================================================================
export const borderScale = {
  /** Minimum border scale factor */
  min: 0.5,
  /** Maximum border scale factor */
  max: 3,
  /** Active border minimum scale */
  activeMin: 1,
  /** Active border maximum scale */
  activeMax: 4,
} as const;

// =============================================================================
// ICON SIZES
// =============================================================================
export const icon = {
  /** Small icons (status indicators) */
  xs: 10,
  /** Default icons in UI */
  sm: 14,
  /** Standard icons */
  md: 16,
  /** Large icons */
  lg: 20,
} as const;
