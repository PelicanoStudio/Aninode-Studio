// @ts-nocheck - Touch handlers and some vestigial debugging code
/**
 * UIApp - Valtio-Integrated Canvas UI
 * 
 * All state flows through engineStore for centralized orchestration.
 * Uses useSnapshot for reactive reads and storeActions for mutations.
 */

import { definitionToConnection, definitionToNodeData } from '@/ui/adapters/storeAdapters';
import { ConnectionDefinition, engineStore, NodeDefinition, storeActions } from '@core/store';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';

// UI Components
import { CanvasBackground } from '@/ui/components/canvas/CanvasBackground';
import { ConnectionLine } from '@/ui/components/canvas/ConnectionLine';
import { EngineStats } from '@/ui/components/EngineStats';
import { BaseNode, getTypeLabel } from '@/ui/components/nodes/BaseNode';
import { NodeContent } from '@/ui/components/nodes/NodeContent';
import { SidePanel } from '@/ui/components/SidePanel';
import { Header } from '@/ui/components/ui/Header';
import { NodePicker } from '@/ui/components/ui/NodePicker';
import { ShortcutsPanel } from '@/ui/components/ui/ShortcutsPanel';
import { usePinchZoom } from '@/ui/hooks/usePinchZoom';
import { Connection, ConnectionType, NodeData, NodeType } from '@/ui/types';
import { isMobileOrTablet } from '@/ui/utils/deviceDetection';
import { getMenuPosition } from '@/ui/utils/menuPosition';
import { Link as LinkIcon, Unlink } from 'lucide-react';

// Tokens
import { canvasLayout, getWire, interaction, neonPalette, nodeLayout, portLayout, signalActive, suggestConnectionTypeSemantic, zIndex } from '@/tokens';
import { getDefaultPorts } from '@/ui/tokens/ports';

const NEON_PALETTE = neonPalette;
const SNAP_SIZE = canvasLayout.snapSize;

export default function UIApp() {
  // === VALTIO STATE (Read from store) ===
  const snap = useSnapshot(engineStore);
  
  // Derive UI-formatted data from store
  const nodes: NodeData[] = useMemo(() => 
    Object.values(snap.project.nodes).map(def => definitionToNodeData(def as NodeDefinition)),
    [snap.project.nodes]
  );
  
  const connections: Connection[] = useMemo(() =>
    Object.values(snap.project.connections).map(def => definitionToConnection(def as ConnectionDefinition)),
    [snap.project.connections]
  );
  
  const selectedIds = new Set(snap.ui.selectedNodeIds);
  const isDarkMode = snap.ui.isDarkMode;
  const gridType = snap.ui.gridType;
  const viewport = snap.ui.viewport;
  const isNodePickerOpen = snap.ui.isNodePickerOpen;
  const activeMenu = snap.ui.activeMenu;
  const menuData = snap.ui.menuData;
  const historyIndex = snap.ui.historyIndex;
  const historyLength = snap.history.length;

  // === LOCAL STATE (Ephemeral UI interactions) ===
  const containerRef = useRef<HTMLDivElement>(null);
  // Active drag state - only set after threshold exceeded
  const [dragState, setDragState] = useState<{ 
    nodeIds: string[], 
    startPositions: Record<string, {x: number, y: number}>,
    mouseStartX: number, 
    mouseStartY: number 
  } | null>(null);
  // Pending drag - captures mouse down, converts to dragState after threshold
  const [pendingDrag, setPendingDrag] = useState<{
    nodeIds: string[],
    startPositions: Record<string, {x: number, y: number}>,
    mouseStartX: number,
    mouseStartY: number,
    altKey: boolean, // Capture alt key at mouse down for delayed duplication
  } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 });
  const [tempWire, setTempWire] = useState<{ startId: string, startType: 'input' | 'output', mouseX: number, mouseY: number, isHot?: boolean } | null>(null);
  const [propertyTeleportBuffer, setPropertyTeleportBuffer] = useState<{ nodeId: string, propKey: string } | null>(null);
  const [propertyContextMenu, setPropertyContextMenu] = useState<{ x: number, y: number, propKey: string, nodeId: string } | null>(null);
  const [pickerCounts, setPickerCounts] = useState<Record<string, number>>({});
  // Box selection state (right-click drag)
  const [boxSelect, setBoxSelect] = useState<{
    startX: number, // Screen coordinates
    startY: number,
    currentX: number,
    currentY: number,
  } | null>(null);
  const boxSelectJustEnded = useRef(false); // Track if box selection just ended to prevent context menu

  // Pinch zoom hook
  usePinchZoom(viewport, (newViewport) => storeActions.setViewport(newViewport), containerRef);

  // === DERIVED VALUES ===
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return { x: (screenX - viewport.x) / viewport.zoom, y: (screenY - viewport.y) / viewport.zoom };
  }, [viewport]);

  const getNodePosition = useCallback((id: string) => {
    const node = nodes.find(n => n.id === id);
    return node ? node.position : { x: 0, y: 0 };
  }, [nodes]);

  // Node color chains - assign unique colors to ALL chain heads (nodes without incoming connections)
  const nodeColors = useMemo(() => {
    const map = new Map<string, string>();
    const visited = new Set<string>();
    
    // Traverse downstream from a root node, propagating color
    const traverse = (nodeId: string, color: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      map.set(nodeId, color);
      connections.filter(c => c.source === nodeId).map(c => c.target).forEach(childId => traverse(childId, color));
    };
    
    // Find all chain heads: nodes that have NO incoming connections
    const nodesWithIncoming = new Set(connections.map(c => c.target));
    const chainHeads = nodes.filter(n => !nodesWithIncoming.has(n.id));
    
    // Assign colors to chain heads and traverse their chains
    let colorIndex = 0;
    chainHeads.forEach(head => {
      traverse(head.id, NEON_PALETTE[colorIndex % NEON_PALETTE.length]);
      colorIndex++;
    });
    
    // Any remaining unvisited nodes (isolated or in cycles) get their own color
    nodes.forEach(n => {
      if (!map.has(n.id)) {
        map.set(n.id, NEON_PALETTE[colorIndex % NEON_PALETTE.length]);
        colorIndex++;
      }
    });
    
    return map;
  }, [nodes, connections]);

  // Active chain highlighting
  const activeChainIds = useMemo(() => {
    const chain = new Set<string>();
    const primaryId = snap.ui.selectedNodeIds[snap.ui.selectedNodeIds.length - 1];
    if (!primaryId) return chain;
    
    const findParents = (id: string) => { if(chain.has(id)) return; chain.add(id); connections.filter(c => c.target === id).forEach(c => findParents(c.source)); };
    const findChildren = (id: string) => { if(chain.has(id)) return; chain.add(id); connections.filter(c => c.source === id).forEach(c => findChildren(c.target)); };
    
    findParents(primaryId);
    chain.clear(); chain.add(primaryId);
    connections.filter(c => c.target === primaryId).forEach(c => findParents(c.source));
    connections.filter(c => c.source === primaryId).forEach(c => findChildren(c.target));
    return chain;
  }, [snap.ui.selectedNodeIds, connections]);

  // === CONNECTION DATA SYNC ===
  // REMOVED: Previous implementation directly mutated baseProps with connection values,
  // which corrupted the original values and prevented proper reversion.
  // Connection data flow is now handled correctly by:
  // 1. AnimationEngine.processConnections() writes to runtime.overrides
  // 2. resolveProperty() reads override > baseProps
  // 3. SidePanel uses getValue() to display resolved values
  // 4. When connection is disabled, override is cleared and baseProps is preserved

  // === ACTIONS (All mutations go through storeActions) ===
  
  const addNode = (type: NodeType, x?: number, y?: number) => {
    const center = screenToWorld(window.innerWidth/2, window.innerHeight/2);
    const newId = `n_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const nodeDef: NodeDefinition = {
      id: newId,
      type: type,
      name: `New ${getTypeLabel(type)}`,
      position: { x: x ?? center.x - 128, y: y ?? center.y - 50 },
      baseProps: type === NodeType.PICKER 
        ? { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' } 
        : { min: 0, max: 100, step: 1, value: 50, enabled: true },
      timelineConfig: { mode: 'linked', offset: 0, keyframes: {} },
    };
    
    storeActions.addNode(nodeDef);
    return definitionToNodeData(nodeDef);
  };

  const handleNodePickerAdd = () => {
    const startX = viewport.x * -1 + 100;
    const startY = viewport.y * -1 + 100;
    let offset = 0;
    
    Object.entries(pickerCounts).forEach(([type, count]) => {
      for(let i = 0; i < count; i++) {
        addNode(type as NodeType, startX + offset * 50, startY + offset * 50);
        offset++;
      }
    });
    
    storeActions.setNodePickerOpen(false);
    setPickerCounts({});
  };

  const updateNodeConfig = (nodeId: string, key: string, value: any) => {
    storeActions.updateNodeProps(nodeId, { [key]: value });
  };

  // === FIT VIEW ===
  const fitView = (targetIds: string[] = []) => {
    const targets = targetIds.length > 0 
      ? nodes.filter(n => targetIds.includes(n.id))
      : nodes;
    
    if (targets.length === 0) return;

    const padding = 100;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    targets.forEach(n => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + (n.dimensions?.width ?? nodeLayout.width));
      maxY = Math.max(maxY, n.position.y + (n.dimensions?.height ?? 128));
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const zoomX = (screenW - padding * 2) / width;
    const zoomY = (screenH - padding * 2) / height;
    const newZoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.2), 2);

    const centerX = minX + width / 2;
    const centerY = minY + height / 2;

    storeActions.setViewport({
      x: screenW / 2 - centerX * newZoom,
      y: screenH / 2 - centerY * newZoom,
      zoom: newZoom
    });
  };

  // === KEYBOARD SHORTCUTS ===
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus
      if (e.key.toLowerCase() === 'f') {
        if (e.shiftKey) fitView([]);
        else fitView(snap.ui.selectedNodeIds);
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        storeActions.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        storeActions.redo();
      }

      // Copy/Paste
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (snap.ui.selectedNodeIds.length > 0) {
          storeActions.copyNodes(snap.ui.selectedNodeIds);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        storeActions.pasteNodes();
      }

      // Node Picker
      if (e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        storeActions.setNodePickerOpen(!snap.ui.isNodePickerOpen);
        setPickerCounts({});
      }

      // Delete (only Delete key, not Backspace - conflicts with text input)
      if (e.key === 'Delete') {
        snap.ui.selectedNodeIds.forEach(id => storeActions.removeNode(id));
        storeActions.clearSelection();
      }

      // Escape
      if (e.key === 'Escape') {
        storeActions.clearSelection();
        if (tempWire?.isHot) setTempWire(null);
        storeActions.setActiveMenu(null);
        storeActions.setNodePickerOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [snap.ui.selectedNodeIds, snap.ui.isNodePickerOpen, tempWire]);

  // === WIRING HANDLERS ===
  const handlePortDown = (id: string, type: 'input' | 'output', e: React.MouseEvent) => {
    e.stopPropagation();

    // Complete hot wire
    if (tempWire && tempWire.isHot) {
      if (tempWire.startId !== id && tempWire.startType !== type) {
        const sourceId = tempWire.startType === 'output' ? tempWire.startId : id;
        const targetId = tempWire.startType === 'input' ? tempWire.startId : id;
        
        // Check if connection already exists
        if (connections.some(c => c.source === sourceId && c.target === targetId)) {
          setTempWire(null);
          return;
        }
        
        storeActions.setActiveMenu('CONNECTION', { source: sourceId, target: targetId, x: e.clientX, y: e.clientY });
        setTempWire(null);
      }
      return;
    }

    if (e.shiftKey || isMobileOrTablet()) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      setTempWire({ startId: id, startType: type, mouseX: worldPos.x, mouseY: worldPos.y, isHot: true });
      return;
    }
    
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setTempWire({ startId: id, startType: type, mouseX: worldPos.x, mouseY: worldPos.y, isHot: false });
  };

  const handlePortUp = (id: string, type: 'input' | 'output', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tempWire) return;
    if (tempWire.startId === id || tempWire.startType === type) {
      if (!tempWire.isHot) setTempWire(null);
      return;
    }
    
    const sourceId = tempWire.startType === 'output' ? tempWire.startId : id;
    const targetId = tempWire.startType === 'input' ? tempWire.startId : id;
    
    // Check if connection already exists
    if (connections.some(c => c.source === sourceId && c.target === targetId)) {
      setTempWire(null);
      return;
    }

    storeActions.setActiveMenu('CONNECTION', { source: sourceId, target: targetId, x: e.clientX, y: e.clientY });
    setTempWire(null);
  };

  const createConnection = (sourceId: string, targetId: string, type: ConnectionType) => {
    // Look up target node's type to find its default input port
    const targetNode = engineStore.project.nodes[targetId];
    const targetNodeType = targetNode?.type as NodeType | undefined;
    
    // Get the target's default input port (e.g., OSCILLATOR -> 'frequency', TRANSFORM -> 'value')
    let targetProp = 'value'; // Fallback
    if (targetNodeType) {
      const targetPorts = getDefaultPorts(targetNodeType);
      const defaultInput = targetPorts.inputs.find(p => p.isDefault);
      if (defaultInput) {
        targetProp = defaultInput.key;
      }
    }
    
    const connDef: ConnectionDefinition = {
      id: `c_${Date.now()}`,
      sourceNodeId: sourceId,
      sourceProp: 'value', // All sources output on 'value' (from nodeOutputs)
      targetNodeId: targetId,
      targetProp: targetProp, // Now uses target's default input port!
      connectionType: type,
    };
    storeActions.addConnection(connDef);
  };

  // === PROPERTY BINDING (Teleportation) ===
  const handleBindProp = (nodeId: string, propKey: string, action: 'SEND' | 'RECEIVE' | 'UNBIND') => {
    if (action === 'SEND') {
      setPropertyTeleportBuffer({ nodeId, propKey });
    } else if (action === 'RECEIVE' && propertyTeleportBuffer) {
      // Create telepathic connection with STRAIGHT type
      const connDef: ConnectionDefinition = {
        id: `c_tele_${Date.now()}`,
        sourceNodeId: propertyTeleportBuffer.nodeId,
        sourceProp: propertyTeleportBuffer.propKey,
        targetNodeId: nodeId,
        targetProp: propKey,
        connectionType: 'STRAIGHT', // Telepathic connections use STRAIGHT (dashed arrow)
      };
      storeActions.addConnection(connDef);
      
      // Mark the target property as bound in the node's boundProps
      const targetNode = snap.project.nodes[nodeId];
      if (targetNode) {
        storeActions.updateNodeProps(nodeId, {
          boundProps: {
            ...targetNode.baseProps.boundProps,
            [propKey]: {
              sourceNodeId: propertyTeleportBuffer.nodeId,
              sourceProp: propertyTeleportBuffer.propKey,
            }
          }
        });
      }
      
      setPropertyTeleportBuffer(null);
    } else if (action === 'UNBIND') {
      // Find and remove telepathic connection
      Object.values(snap.project.connections).forEach(conn => {
        if (conn.targetNodeId === nodeId && conn.targetProp === propKey) {
          storeActions.removeConnection(conn.id);
        }
      });
      
      // Remove from boundProps
      const targetNode = snap.project.nodes[nodeId];
      if (targetNode?.baseProps.boundProps?.[propKey]) {
        const newBoundProps = { ...targetNode.baseProps.boundProps };
        delete newBoundProps[propKey];
        storeActions.updateNodeProps(nodeId, { boundProps: newBoundProps });
      }
    }
  };

  // === RENDER ===
  return (
    <div 
      id="canvas-bg"
      className={`w-full h-screen overflow-hidden select-none relative ${isDarkMode ? 'bg-black text-white' : 'bg-[#F5F5F5] text-neutral-900'}`}
      onMouseMove={(e) => {
        // PANNING
        if (isPanning) {
          const dx = e.clientX - panStartRef.current.mouseX;
          const dy = e.clientY - panStartRef.current.mouseY;
          storeActions.setViewport({
            x: panStartRef.current.x + dx,
            y: panStartRef.current.y + dy,
            zoom: viewport.zoom
          });
        }
        
        // CHECK PENDING DRAG THRESHOLD
        // Only convert to real drag after mouse moves beyond threshold
        if (pendingDrag && !dragState) {
          const distance = Math.sqrt(
            Math.pow(e.clientX - pendingDrag.mouseStartX, 2) +
            Math.pow(e.clientY - pendingDrag.mouseStartY, 2)
          );
          
          if (distance >= interaction.dragThreshold) {
            // Threshold exceeded - now we know it's a real drag, not a click
            
            // If alt was held at mouse down, duplicate nodes now
            if (pendingDrag.altKey && pendingDrag.nodeIds.length > 0) {
              const oldToNewIdMap: Record<string, string> = {};
              const duplicatedIds: string[] = [];
              
              pendingDrag.nodeIds.forEach(nodeId => {
                const n = nodes.find(node => node.id === nodeId);
                if (!n) return;
                
                const typePrefix = n.type.slice(0, 3).toLowerCase();
                const newId = `${typePrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                oldToNewIdMap[nodeId] = newId;
                duplicatedIds.push(newId);
                
                const newNodeDef: NodeDefinition = {
                  id: newId,
                  type: n.type,
                  name: `${n.label} (copy)`,
                  position: { x: n.position.x, y: n.position.y },
                  baseProps: {
                    ...n.config,
                    boundProps: {},
                    dimensions: n.dimensions,
                    collapsed: n.collapsed,
                  },
                  timelineConfig: { mode: 'linked', offset: 0, keyframes: {} },
                };
                storeActions.addNode(newNodeDef);
              });
              
              // Duplicate connections between selected nodes
              Object.values(snap.project.connections).forEach(conn => {
                if (pendingDrag.nodeIds.includes(conn.sourceNodeId) && 
                    pendingDrag.nodeIds.includes(conn.targetNodeId)) {
                  const newConn: ConnectionDefinition = {
                    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    sourceNodeId: oldToNewIdMap[conn.sourceNodeId],
                    sourceProp: conn.sourceProp,
                    targetNodeId: oldToNewIdMap[conn.targetNodeId],
                    targetProp: conn.targetProp,
                    connectionType: conn.connectionType,
                  };
                  storeActions.addConnection(newConn);
                }
              });
              
              // Switch to dragging the duplicates
              const newStartPositions: Record<string, {x: number, y: number}> = {};
              duplicatedIds.forEach(id => {
                const stored = engineStore.project.nodes[id];
                if (stored) newStartPositions[id] = { x: stored.position.x, y: stored.position.y };
              });
              
              storeActions.selectMultiple(duplicatedIds);
              setDragState({
                nodeIds: duplicatedIds,
                startPositions: newStartPositions,
                mouseStartX: pendingDrag.mouseStartX,
                mouseStartY: pendingDrag.mouseStartY,
              });
            } else {
              // Normal drag (no alt key)
              setDragState({
                nodeIds: pendingDrag.nodeIds,
                startPositions: pendingDrag.startPositions,
                mouseStartX: pendingDrag.mouseStartX,
                mouseStartY: pendingDrag.mouseStartY,
              });
            }
            setPendingDrag(null);
          }
        }
        
        // DRAGGING NODES (only when dragState is active)
        if (dragState) {
          const dx = (e.clientX - dragState.mouseStartX) / viewport.zoom;
          const dy = (e.clientY - dragState.mouseStartY) / viewport.zoom;
          
          dragState.nodeIds.forEach(nodeId => {
            const start = dragState.startPositions[nodeId];
            if (start) {
              storeActions.updateNodePosition(nodeId, start.x + dx, start.y + dy);
            }
          });
        }
        // WIRING
        if (tempWire) {
          const worldPos = screenToWorld(e.clientX, e.clientY);
          setTempWire(prev => prev ? { ...prev, mouseX: worldPos.x, mouseY: worldPos.y } : null);
        }
        // BOX SELECTION - update current position as mouse moves
        if (boxSelect) {
          setBoxSelect(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
        }
      }}
      onMouseUp={(e) => {
        if (isPanning) {
          const dist = Math.sqrt(Math.pow(e.clientX - panStartRef.current.mouseX, 2) + Math.pow(e.clientY - panStartRef.current.mouseY, 2));
          if (dist < interaction.clickThreshold) storeActions.clearSelection();
        }
        setIsPanning(false);
        
        // Clear pending drag - if we get here without converting to dragState,
        // the mouse was released before threshold (was a click, not a drag)
        setPendingDrag(null);
        
        if (dragState) {
          // Snap nodes to grid
          dragState.nodeIds.forEach(nodeId => {
            const node = snap.project.nodes[nodeId];
            if (node) {
              storeActions.updateNodePosition(
                nodeId,
                Math.round(node.position.x / SNAP_SIZE) * SNAP_SIZE,
                Math.round(node.position.y / SNAP_SIZE) * SNAP_SIZE
              );
            }
          });
          storeActions.pushHistory();
          setDragState(null);
        }
        if (tempWire && !tempWire.isHot) setTempWire(null);
        
        // BOX SELECTION - finalize and select intersecting nodes
        if (boxSelect) {
          const boxWidth = Math.abs(boxSelect.currentX - boxSelect.startX);
          const boxHeight = Math.abs(boxSelect.currentY - boxSelect.startY);
          
          // Only select if box is large enough
          if (boxWidth >= interaction.boxSelectMinSize || boxHeight >= interaction.boxSelectMinSize) {
            // Convert screen coordinates to world coordinates
            const boxLeft = Math.min(boxSelect.startX, boxSelect.currentX);
            const boxTop = Math.min(boxSelect.startY, boxSelect.currentY);
            const boxRight = Math.max(boxSelect.startX, boxSelect.currentX);
            const boxBottom = Math.max(boxSelect.startY, boxSelect.currentY);
            
            // Find nodes that intersect with the box
            const selectedNodeIds: string[] = [];
            nodes.forEach(node => {
              // Convert node world position to screen position
              const nodeScreenX = node.position.x * viewport.zoom + viewport.x;
              const nodeScreenY = node.position.y * viewport.zoom + viewport.y;
              const nodeWidth = (node.dimensions?.width || nodeLayout.width) * viewport.zoom;
              const nodeHeight = (node.dimensions?.height || nodeLayout.defaultHeight) * viewport.zoom;
              
              // Check intersection
              if (nodeScreenX < boxRight && 
                  nodeScreenX + nodeWidth > boxLeft &&
                  nodeScreenY < boxBottom &&
                  nodeScreenY + nodeHeight > boxTop) {
                selectedNodeIds.push(node.id);
              }
            });
            
            if (selectedNodeIds.length > 0) {
              storeActions.selectMultiple(selectedNodeIds);
            }
          }
          // Mark that box selection just ended to prevent context menu
          boxSelectJustEnded.current = true;
          setBoxSelect(null);
        }
      }}
      onWheel={(e) => {
        if (isNodePickerOpen) return;
        
        if (e.shiftKey) {
          storeActions.setViewport({ x: viewport.x - e.deltaY, y: viewport.y - e.deltaX, zoom: viewport.zoom });
          return;
        }
        
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        storeActions.zoom(delta, e.clientX, e.clientY);
      }}
      onMouseDown={(e) => {
        setPropertyContextMenu(null);
        
        // Right-click (button 2) starts box selection
        if (e.button === 2) {
          e.preventDefault();
          setBoxSelect({
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
          });
          return;
        }
        
        // Left-click starts panning if not dragging
        if (!dragState && !pendingDrag) {
          setIsPanning(true); 
          panStartRef.current = { x: viewport.x, y: viewport.y, mouseX: e.clientX, mouseY: e.clientY }; 
        }
      }}
      onContextMenu={(e) => {
        // Prevent context menu if box selecting or if box selection just ended
        if (boxSelect || boxSelectJustEnded.current) {
          e.preventDefault();
          boxSelectJustEnded.current = false; // Reset the flag
        }
      }}
    >
      {/* GRID BACKGROUND */}
      <CanvasBackground viewport={viewport} isDarkMode={isDarkMode} gridType={gridType} />

      <div ref={containerRef} className="absolute inset-0 z-10 origin-top-left pointer-events-none" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}>
        {/* WIRES */}
        <svg className="absolute left-0 top-0 overflow-visible pointer-events-none z-10">
          <defs>
            <marker id="arrow-head" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill={getWire('default', isDarkMode)} />
            </marker>
          </defs>
          {connections.map(conn => (
            <ConnectionLine 
              key={conn.id}
              connection={conn}
              sourceNode={nodes.find(n => n.id === conn.source)}
              targetNode={nodes.find(n => n.id === conn.target)}
              viewport={viewport}
              isDarkMode={isDarkMode}
              onDelete={(id) => storeActions.removeConnection(id)}
            />
          ))}
          {tempWire && (
            <path 
              d={`M ${tempWire.startType === 'output' 
                ? getNodePosition(tempWire.startId).x + (nodes.find(n => n.id === tempWire.startId)?.dimensions?.width ?? nodeLayout.width) + 16
                : getNodePosition(tempWire.startId).x + portLayout.inputX} ${getNodePosition(tempWire.startId).y + portLayout.offsetY} L ${tempWire.mouseX} ${tempWire.mouseY}`} 
              stroke={getWire('temp', isDarkMode)} 
              strokeWidth={2 / viewport.zoom} 
              strokeDasharray="5 5" 
              fill="none" 
            />
          )}
        </svg>

        {/* NODES */}
        {nodes.map(node => (
          <BaseNode 
            key={node.id} 
            data={node}
            isSelected={selectedIds.has(node.id)}
            isActiveChain={activeChainIds.has(node.id)}
            accentColor={nodeColors.get(node.id)}
            zoom={viewport.zoom}
            isDarkMode={isDarkMode}
            isHotConnectionSource={tempWire?.startId === node.id}
            onSelect={() => {}}
            onToggleCollapse={(id) => storeActions.updateNodeProps(id, { collapsed: !nodes.find(n => n.id === id)?.collapsed })}
            onToggleEnabled={(id, enabled) => storeActions.updateNodeProps(id, { enabled })}
            onToggleBypassed={(id, bypassed) => storeActions.updateNodeProps(id, { bypassed })}
            onResize={(id, width, height, x, y) => {
              storeActions.updateNodeProps(id, { dimensions: { width, height } });
              if (x !== undefined && y !== undefined) {
                storeActions.updateNodePosition(id, x, y);
              }
            }}
            onPortDown={handlePortDown}
            onPortUp={handlePortUp}
            onPortContextMenu={(id, type, e) => storeActions.setActiveMenu('DISCONNECT', { nodeId: id, type, x: e.clientX, y: e.clientY })}
            onPortDoubleClick={(id, type, e) => storeActions.setActiveMenu('PORT', { nodeId: id, type, x: e.clientX, y: e.clientY })}
            onNodeDown={(e) => { 
              e.stopPropagation();
              
              // Handle selection (shift for multi-select)
              const currentSelected = [...snap.ui.selectedNodeIds];
              let newSelected: string[];
              
              if (e.shiftKey) {
                if (currentSelected.includes(node.id)) {
                  newSelected = currentSelected.filter(id => id !== node.id);
                } else {
                  newSelected = [...currentSelected, node.id];
                }
              } else {
                if (!currentSelected.includes(node.id)) {
                  newSelected = [node.id];
                } else {
                  newSelected = currentSelected;
                }
              }
              
              storeActions.selectMultiple(newSelected);

              // Capture start positions for potential drag
              const startPositions: Record<string, {x: number, y: number}> = {};
              newSelected.forEach(id => {
                const stored = engineStore.project.nodes[id];
                if (stored) startPositions[id] = { x: stored.position.x, y: stored.position.y };
              });
              
              // Set pending drag - will only become real drag after threshold exceeded
              // Alt key is captured here for deferred duplication
              setPendingDrag({ 
                nodeIds: newSelected, 
                startPositions, 
                mouseStartX: e.clientX, 
                mouseStartY: e.clientY,
                altKey: e.altKey, // Capture alt state for deferred alt+copy
              });
            }}
          >
            <NodeContent 
              node={node} 
              isDarkMode={isDarkMode} 
              updateConfig={(key, val) => updateNodeConfig(node.id, key, val)}
              pushHistory={() => storeActions.pushHistory()}
            />
          </BaseNode>
        ))}
      </div>
      
      {/* SIDE PANEL */}
      <SidePanel 
        selectedNode={selectedIds.size === 1 ? nodes.find(n => n.id === Array.from(selectedIds)[0]) || null : null}
        onClose={() => storeActions.clearSelection()}
        onUpdate={(id, newData) => {
          if (newData.label) storeActions.updateNodeName(id, newData.label);
          if (newData.config) storeActions.updateNodeProps(id, newData.config);
        }}
        onBindProp={handleBindProp}
        isDarkMode={isDarkMode}
        boundProps={selectedIds.size === 1 ? nodes.find(n => n.id === Array.from(selectedIds)[0])?.boundProps || {} : {}}
        onContextMenu={(menu) => setPropertyContextMenu(menu)}
        onToggleEnabled={(id, enabled) => storeActions.updateNodeProps(id, { enabled })}
        onToggleBypassed={(id, bypassed) => storeActions.updateNodeProps(id, { bypassed })}
      />

      {/* UI HEADER */}
      <Header 
        isDarkMode={isDarkMode}
        setIsDarkMode={storeActions.setDarkMode}
        gridType={gridType}
        setGridType={storeActions.setGridType}
        historyIndex={historyIndex}
        historyLength={historyLength}
        handleUndo={storeActions.undo}
        handleRedo={storeActions.redo}
        setIsNodePickerOpen={storeActions.setNodePickerOpen}
        setPickerCounts={setPickerCounts}
        showEngineStats={snap.ui.showEngineStats}
        setShowEngineStats={storeActions.setShowEngineStats}
      />

      {/* COMMAND LEGEND */}
      <ShortcutsPanel isDarkMode={isDarkMode} />

      {/* BOX SELECTION RECTANGLE */}
      {boxSelect && (
        <div
          className="fixed pointer-events-none border-2 border-dashed z-50 bg-opacity-10"
          style={{
            left: Math.min(boxSelect.startX, boxSelect.currentX),
            top: Math.min(boxSelect.startY, boxSelect.currentY),
            width: Math.abs(boxSelect.currentX - boxSelect.startX),
            height: Math.abs(boxSelect.currentY - boxSelect.startY),
            borderColor: signalActive,
            backgroundColor: `${signalActive}20`, // 20 = 12% opacity
          }}
        />
      )}

      {/* NODE PICKER MODAL */}
      <NodePicker 
        isOpen={isNodePickerOpen}
        onClose={() => storeActions.setNodePickerOpen(false)}
        isDarkMode={isDarkMode}
        pickerCounts={pickerCounts}
        setPickerCounts={setPickerCounts}
        onAdd={handleNodePickerAdd}
        onSingleAdd={addNode}
      />
      
      {/* CONTEXT MENUS */}
      {activeMenu === 'PORT' && menuData && (
        <div 
          className="fixed w-48 bg-black border border-neutral-800 rounded-lg shadow-xl" 
          style={{ left: menuData.x, top: menuData.y, zIndex: zIndex.contextMenu }} 
          onMouseDown={e => e.stopPropagation()}
        >
          {Object.values(NodeType)
            .filter(type => {
              if (menuData.type === 'output') {
                return [NodeType.TRANSFORM, NodeType.LOGIC, NodeType.OUTPUT].includes(type);
              } else {
                return type !== NodeType.OUTPUT;
              }
            })
            .map(type => (
              <button key={type} className="block w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10" onClick={() => { 
                const pos = getNodePosition(menuData.nodeId);
                const offset = menuData.type === 'output' ? 300 : -300;
                const newNode = addNode(type, pos.x + offset, pos.y);
                
                createConnection(
                  menuData.type === 'output' ? menuData.nodeId : newNode.id,
                  menuData.type === 'output' ? newNode.id : menuData.nodeId,
                  ConnectionType.BEZIER
                );
                storeActions.setActiveMenu(null);
              }}>
                {getTypeLabel(type)}
              </button>
            ))}
        </div>
      )}

      {activeMenu === 'CONNECTION' && menuData && (() => {
        // Auto-assign connection type based on source node semantics
        const sourceNode = nodes.find(n => n.id === menuData.source);
        const autoType = sourceNode 
          ? suggestConnectionTypeSemantic(sourceNode.type, 'value')
          : ConnectionType.BEZIER;
        
        // Create connection immediately with auto-assigned type
        createConnection(menuData.source, menuData.target, autoType);
        storeActions.setActiveMenu(null);
        return null; // Don't render menu
      })()}

      {activeMenu === 'DISCONNECT' && menuData && (
        <div 
          className="fixed w-48 bg-black border border-neutral-800 rounded-lg shadow-xl" 
          style={{ left: menuData.x, top: menuData.y, zIndex: zIndex.contextMenu }} 
          onMouseDown={e => e.stopPropagation()}
        >
          <button className="block w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-white/10" onClick={() => {
            connections.forEach(c => {
              if ((c.target === menuData.nodeId && menuData.type === 'input') || (c.source === menuData.nodeId && menuData.type === 'output')) {
                storeActions.removeConnection(c.id);
              }
            });
            storeActions.setActiveMenu(null);
          }}>
            Disconnect All
          </button>
        </div>
      )}

      {/* PROPERTY TELEPORT MENU */}
      {propertyContextMenu && (() => {
        const menuWidth = 224;
        const menuHeight = propertyTeleportBuffer 
          ? (nodes.find(n => n.id === propertyContextMenu.nodeId)?.boundProps?.[propertyContextMenu.propKey] ? 200 : 170)
          : (nodes.find(n => n.id === propertyContextMenu.nodeId)?.boundProps?.[propertyContextMenu.propKey] ? 130 : 100);
        const safePos = getMenuPosition(propertyContextMenu.x, propertyContextMenu.y, menuWidth, menuHeight);
        
        return (
          <div 
            className="fixed w-56 bg-black border border-neutral-800 rounded-lg shadow-xl overflow-hidden" 
            style={{ left: safePos.left, top: safePos.top, zIndex: zIndex.contextMenu }} 
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="px-3 py-2 text-[10px] font-bold text-neutral-500 border-b border-neutral-800 uppercase tracking-wider">Property: {propertyContextMenu.propKey}</div>
            <button className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-xs text-white hover:bg-white/10 transition-colors" onClick={() => { handleBindProp(propertyContextMenu.nodeId, propertyContextMenu.propKey, 'SEND'); setPropertyContextMenu(null); }}>
              <LinkIcon size={14} className="text-accent-red" />
              <span>Broadcast <span className="text-accent-red font-bold">{propertyContextMenu.propKey}</span></span>
            </button>
            {propertyTeleportBuffer && (
              <button className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-xs text-white hover:bg-white/10 transition-colors border-t border-neutral-800/50" onClick={() => { handleBindProp(propertyContextMenu.nodeId, propertyContextMenu.propKey, 'RECEIVE'); setPropertyContextMenu(null); }}>
                <LinkIcon size={14} className="text-green-500" />
                <div className="flex flex-col">
                  <span>Receive <span className="text-green-500 font-bold">{propertyTeleportBuffer.propKey}</span></span>
                  <span className="text-[10px] text-neutral-500">from <span className="text-neutral-400">{nodes.find(n => n.id === propertyTeleportBuffer.nodeId)?.label}</span></span>
                </div>
              </button>
            )}
            {nodes.find(n => n.id === propertyContextMenu.nodeId)?.boundProps?.[propertyContextMenu.propKey] && (
              <button className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-xs text-red-500 hover:bg-white/10 transition-colors border-t border-neutral-800/50" onClick={() => { handleBindProp(propertyContextMenu.nodeId, propertyContextMenu.propKey, 'UNBIND'); setPropertyContextMenu(null); }}>
                <Unlink size={14} />
                <span>Unbind <span className="font-bold">{propertyContextMenu.propKey}</span></span>
              </button>
            )}
          </div>
        );
      })()}
      
      {/* Debug Stats Overlay */}
      <EngineStats 
        visible={snap.ui.showEngineStats} 
        onClose={() => storeActions.setShowEngineStats(false)} 
      />
    </div>
  );
}
