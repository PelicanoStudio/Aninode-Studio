
export enum NodeType {
  PICKER = 'PICKER',
  OSCILLATOR = 'OSCILLATOR',
  TRANSFORM = 'TRANSFORM',
  OUTPUT = 'OUTPUT',
  LOGIC = 'LOGIC',
  SLIDER = 'SLIDER',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  CLONE = 'CLONE',
  DEBUG = 'DEBUG'
}

export enum ConnectionType {
  BEZIER = 'BEZIER',
  STRAIGHT = 'STRAIGHT',
  STEP = 'STEP',
  DOUBLE = 'DOUBLE',
  DOTTED = 'DOTTED'
}

export interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  id: string;
  type: NodeType;
  label: string;
  position: Position;
  collapsed?: boolean;
  value?: any; 
  config: Record<string, any>;
  // Property Teleportation Bindings
  boundProps?: Record<string, { targetNodeId: string, targetProp: string, originalValue?: any }>;
  // Dimensions for resizable nodes
  dimensions?: { width: number; height: number };
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  type: ConnectionType;
}

export type GridType = 'DOTS' | 'LINES' | 'CROSS';
