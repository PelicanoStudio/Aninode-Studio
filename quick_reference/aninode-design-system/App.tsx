import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { NodeData, Connection, NodeType, ConnectionType, GridType } from './types';
import { BaseNode, getTypeLabel } from './components/nodes/BaseNode';
import { SidePanel } from './components/SidePanel';
import { isMobileOrTablet } from './utils/deviceDetection';
import { NEON_PALETTE, SNAP_SIZE } from './constants';
import { getRayBoxIntersection } from './utils/geometry';
import { getMenuPosition } from './utils/menuPosition';
import { ShortcutsPanel } from './components/ui/ShortcutsPanel';
import { Header } from './components/ui/Header';
import { NodePicker } from './components/ui/NodePicker';
import { CanvasBackground } from './components/canvas/CanvasBackground';
import { ConnectionLine } from './components/canvas/ConnectionLine';
import { NodeContent } from './components/nodes/NodeContent';
import { usePinchZoom } from './hooks/usePinchZoom';
import { Link as LinkIcon, Unlink } from 'lucide-react';

// History State Interface
interface HistoryState {
    nodes: NodeData[];
    connections: Connection[];
}

export default function App() {
  // --- STATE ---
  const [nodes, setNodes] = useState<NodeData[]>([
     { id: 'init_lfo', type: NodeType.OSCILLATOR, label: 'Master LFO', position: { x: 100, y: 100 }, config: { frequency: 1, amplitude: 1 } },
  ]);
  const [connections, setConnections] = useState<Connection[]>([]);
  
  // Selection & Clipboard
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [clipboard, setClipboard] = useState<NodeData[]>([]);

  // History
  const [history, setHistory] = useState<HistoryState[]>([{ nodes: [
     { id: 'init_lfo', type: NodeType.OSCILLATOR, label: 'Master LFO', position: { x: 100, y: 100 }, config: { frequency: 1, amplitude: 1 } },
  ], connections: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Appearance
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [gridType, setGridType] = useState<GridType>('CROSS');

  // Menus & Modals
  const [activeMenu, setActiveMenu] = useState<'MAIN' | 'CONNECTION' | 'DISCONNECT' | 'PORT' | null>(null);
  const [menuData, setMenuData] = useState<any>(null);
  const [isNodePickerOpen, setIsNodePickerOpen] = useState(false);
  const [pickerCounts, setPickerCounts] = useState<Record<string, number>>({});

  // Canvas
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction
  const [dragState, setDragState] = useState<{ 
      nodeIds: string[], 
      startPositions: Record<string, {x: number, y: number}>,
      mouseStartX: number, 
      mouseStartY: number 
  } | null>(null);
  
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 });

  // Wiring
  const [tempWire, setTempWire] = useState<{ startId: string, startType: 'input' | 'output', mouseX: number, mouseY: number, isHot?: boolean } | null>(null);
  const [propertyTeleportBuffer, setPropertyTeleportBuffer] = useState<{ nodeId: string, propKey: string } | null>(null);
  const [propertyContextMenu, setPropertyContextMenu] = useState<{ x: number, y: number, propKey: string, nodeId: string } | null>(null);

  // Hooks
  usePinchZoom(viewport, setViewport, containerRef);

  // Update HTML class for Tailwind dark mode
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // --- HISTORY MANAGEMENT ---
  const pushHistory = (newNodes: NodeData[] = nodes, newConnections: Connection[] = connections) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ nodes: newNodes, connections: newConnections });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
      if (historyIndex > 0) {
          const prev = history[historyIndex - 1];
          setNodes(prev.nodes);
          setConnections(prev.connections);
          setHistoryIndex(historyIndex - 1);
          // Update selection if selected nodes don't exist anymore
          setSelectedIds(new Set()); 
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          const next = history[historyIndex + 1];
          setNodes(next.nodes);
          setConnections(next.connections);
          setHistoryIndex(historyIndex + 1);
          setSelectedIds(new Set());
      }
  };

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
      return { x: (screenX - viewport.x) / viewport.zoom, y: (screenY - viewport.y) / viewport.zoom };
  }, [viewport]);

  const getNodePosition = useCallback((id: string) => {
      // If dragging, return tentative position
      if (dragState && dragState.nodeIds.includes(id)) {
          const startPos = dragState.startPositions[id];
          if (startPos) {
             const deltaX = (dragState.mouseStartX - dragState.mouseStartX) / viewport.zoom; // Wait, this is 0. 
             // We need current mouse pos. But we don't have it in callback.
             // Actually, we update nodes in real-time during drag? 
             // No, App_OLD updated dragState.currentX/Y.
             // Here we have multiple nodes.
             // Let's use the node's position from state, which we update during drag.
             const node = nodes.find(n => n.id === id);
             return node ? node.position : { x: 0, y: 0 };
          }
      }
      const node = nodes.find(n => n.id === id);
      return node ? node.position : { x: 0, y: 0 };
  }, [nodes, dragState]);

  // --- FOCUS LOGIC ---
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
          maxX = Math.max(maxX, n.position.x + 256); // Width
          maxY = Math.max(maxY, n.position.y + 128); // Height
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

      setViewport({
          x: screenW / 2 - centerX * newZoom,
          y: screenH / 2 - centerY * newZoom,
          zoom: newZoom
      });
  };

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          // Focus
          if (e.key.toLowerCase() === 'f') {
              if (e.shiftKey) fitView([]); // Focus All
              else fitView(Array.from(selectedIds)); // Focus Selected
          }

          // Undo/Redo
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
              e.preventDefault();
              handleUndo();
          }
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
              e.preventDefault();
              handleRedo();
          }

          // Copy/Paste
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
              const selected = nodes.filter(n => selectedIds.has(n.id));
              if (selected.length > 0) setClipboard(selected);
          }
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
              if (clipboard.length > 0) {
                  const newNodes: NodeData[] = [];
                  const idMap = new Map<string, string>();
                  
                  // Calculate center of clipboard nodes
                  let minX = Infinity, minY = Infinity;
                  clipboard.forEach(n => { minX = Math.min(minX, n.position.x); minY = Math.min(minY, n.position.y); });
                  
                  // Paste at mouse position? Or center of screen? Center of screen for now.
                  const center = screenToWorld(window.innerWidth/2, window.innerHeight/2);
                  const offsetX = center.x - minX - 100; // Offset slightly
                  const offsetY = center.y - minY - 100;

                  clipboard.forEach(node => {
                      const newId = `n_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                      idMap.set(node.id, newId);
                      newNodes.push({
                          ...node,
                          id: newId,
                          position: { x: node.position.x + offsetX, y: node.position.y + offsetY },
                          label: node.label + ' (Copy)',
                          // Clear bindings on paste
                          boundProps: {} 
                      });
                  });

                  const updatedNodes = [...nodes, ...newNodes];
                  setNodes(updatedNodes);
                  setSelectedIds(new Set(newNodes.map(n => n.id)));
                  pushHistory(updatedNodes, connections);
              }
          }

          if (e.shiftKey && e.key === 'Tab') {
              e.preventDefault();
              setIsNodePickerOpen(prev => !prev);
              setPickerCounts({});
          }
          if (e.key === 'Delete' || e.key === 'Backspace') {
             if (selectedIds.size > 0) {
                 const newNodes = nodes.filter(n => !selectedIds.has(n.id));
                 const newConnections = connections.filter(c => !selectedIds.has(c.source) && !selectedIds.has(c.target));
                 setNodes(newNodes);
                 setConnections(newConnections);
                 setSelectedIds(new Set());
                 pushHistory(newNodes, newConnections);
             }
          }
          if (e.key === 'Escape') {
              setSelectedIds(new Set());
              if (tempWire?.isHot) setTempWire(null);
              setActiveMenu(null);
              setIsNodePickerOpen(false);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, clipboard, nodes, connections, historyIndex, viewport]);

  // --- NODE OPERATIONS ---
  const addNode = (type: NodeType, x?: number, y?: number) => {
      const center = screenToWorld(window.innerWidth/2, window.innerHeight/2);
      const newNode: NodeData = {
           id: `n_${Date.now()}_${Math.random()}`,
           type,
           label: `New ${getTypeLabel(type)}`,
           position: { x: x ?? center.x - 128, y: y ?? center.y - 50 },
           config: type === NodeType.PICKER ? { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' } : { min: 0, max: 100, step: 1, value: 50, enabled: true }
      };
      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      pushHistory(newNodes, connections);
      return newNode;
  };

  const handleNodePickerAdd = () => {
      const startX = viewport.x * -1 + 100;
      const startY = viewport.y * -1 + 100;
      let offset = 0;
      const newNodes = [...nodes];
      Object.entries(pickerCounts).forEach(([type, count]) => {
          for(let i=0; i<(count as number); i++) {
              newNodes.push({
                  id: `n_${Date.now()}_${Math.random()}`,
                  type: type as NodeType,
                  label: `New ${getTypeLabel(type as NodeType)}`,
                  position: { x: startX + offset * 50, y: startY + offset * 50 },
                  config: type === NodeType.PICKER ? { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' } : { min: 0, max: 100, step: 1, value: 50, enabled: true }
              });
              offset++;
          }
      });
      setNodes(newNodes);
      pushHistory(newNodes, connections);
      setIsNodePickerOpen(false);
  };

  const handleBindProp = (nodeId: string, propKey: string, action: 'SEND' | 'RECEIVE' | 'UNBIND') => {
      if (action === 'SEND') {
          setPropertyTeleportBuffer({ nodeId, propKey });
      } else if (action === 'RECEIVE' && propertyTeleportBuffer) {
          const targetNode = nodes.find(n => n.id === nodeId);
          if (!targetNode) return;

          // Store original value for restoration
          const originalValue = targetNode.config[propKey];

          const connId = `c_tele_${Date.now()}`;
          const newConnections = [...connections, { id: connId, source: propertyTeleportBuffer.nodeId, target: nodeId, type: ConnectionType.STRAIGHT }];
          
          const newNodes = nodes.map(n => n.id === nodeId ? { 
              ...n, 
              boundProps: { 
                  ...n.boundProps, 
                  [propKey]: { 
                      targetNodeId: propertyTeleportBuffer.nodeId, 
                      targetProp: propertyTeleportBuffer.propKey,
                      originalValue: originalValue // Save original
                  } 
              } 
          } : n);

          setConnections(newConnections);
          setNodes(newNodes);
          pushHistory(newNodes, newConnections);
          setPropertyTeleportBuffer(null);

      } else if (action === 'UNBIND') {
          const targetNode = nodes.find(n => n.id === nodeId);
          if (!targetNode || !targetNode.boundProps?.[propKey]) return;

          const binding = targetNode.boundProps[propKey];
          
          // Restore original value
          const restoredConfig = { ...targetNode.config };
          if (binding.originalValue !== undefined) {
              restoredConfig[propKey] = binding.originalValue;
          }

          const { [propKey]: removed, ...remainingProps } = targetNode.boundProps;
          
          const newNodes = nodes.map(n => n.id === nodeId ? { 
              ...n, 
              config: restoredConfig,
              boundProps: remainingProps 
          } : n);

          // Remove telepathic connection
          const newConnections = connections.filter(c => !(c.type === ConnectionType.STRAIGHT && c.target === nodeId && c.source === binding.targetNodeId));

          setNodes(newNodes);
          setConnections(newConnections);
          pushHistory(newNodes, newConnections);
      }
  };

  // --- WIRING HANDLERS ---
  const handlePortDown = (id: string, type: 'input' | 'output', e: React.MouseEvent) => {
      e.stopPropagation();

      // Check if we are COMPLETING a hot wire
      if (tempWire && tempWire.isHot) {
          if (tempWire.startId !== id && tempWire.startType !== type) {
               const sourceId = tempWire.startType === 'output' ? tempWire.startId : id;
               const targetId = tempWire.startType === 'input' ? tempWire.startId : id;
               
               // Check if connection already exists
               if (connections.some(c => c.source === sourceId && c.target === targetId)) {
                   setTempWire(null);
                   return;
               }
               
               setMenuData({ source: sourceId, target: targetId, x: e.clientX, y: e.clientY });
               setActiveMenu('CONNECTION');
               setTempWire(null);
          }
          return;
      }

      // Ctrl+Alt+Drag from Output -> Clone Node
      if ((e.ctrlKey || e.metaKey) && e.altKey && type === 'output') {
          const sourceNode = nodes.find(n => n.id === id);
          if (sourceNode) {
              const newNode = addNode(sourceNode.type, sourceNode.position.x + 50, sourceNode.position.y + 50);
              const newConns = [...connections, { 
                  id: `c_${Date.now()}`, 
                  source: id, 
                  target: newNode.id, 
                  type: ConnectionType.BEZIER 
              }];
              setConnections(newConns);
              pushHistory(nodes, newConns);
              
              // Start dragging the new node immediately
              const startPositions: Record<string, {x: number, y: number}> = {};
              startPositions[newNode.id] = { x: newNode.position.x, y: newNode.position.y };
              setDragState({ 
                  nodeIds: [newNode.id], 
                  startPositions, 
                  mouseStartX: e.clientX, 
                  mouseStartY: e.clientY 
              });
              setSelectedIds(new Set([newNode.id]));
              return;
          }
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
      // Valid connection attempt
      const sourceId = tempWire.startType === 'output' ? tempWire.startId : id;
      const targetId = tempWire.startType === 'input' ? tempWire.startId : id;
      
      // Check if connection already exists
      if (connections.some(c => c.source === sourceId && c.target === targetId)) {
          setTempWire(null);
          return;
      }

      setMenuData({ source: sourceId, target: targetId, x: e.clientX, y: e.clientY });
      setActiveMenu('CONNECTION'); 
      setTempWire(null);
  };

  const nodeColors = useMemo(() => {
    const map = new Map<string, string>();
    const visited = new Set<string>();
    const traverse = (nodeId: string, color: string) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        map.set(nodeId, color);
        connections.filter(c => c.source === nodeId).map(c => c.target).forEach(childId => traverse(childId, color));
    };
    let colorIndex = 0;
    nodes.filter(n => n.type === NodeType.PICKER).forEach(picker => {
        traverse(picker.id, NEON_PALETTE[colorIndex % NEON_PALETTE.length]);
        colorIndex++;
    });
    return map;
  }, [nodes, connections]);

  const activeChainIds = useMemo(() => {
    const chain = new Set<string>();
    const primarySelected = Array.from(selectedIds).pop();
    if (!primarySelected) return chain;
    const primaryId = primarySelected as string;
    
    const findParents = (id: string) => { if(chain.has(id)) return; chain.add(id); connections.filter(c => c.target === id).forEach(c => findParents(c.source)); };
    const findChildren = (id: string) => { if(chain.has(id)) return; chain.add(id); connections.filter(c => c.source === id).forEach(c => findChildren(c.target)); };
    
    findParents(primaryId);
    chain.clear(); chain.add(primaryId);
    connections.filter(c => c.target === primaryId).forEach(c => findParents(c.source));
    connections.filter(c => c.source === primaryId).forEach(c => findChildren(c.target));
    return chain;
  }, [selectedIds, connections]);

  // Synchronize property values for telepathic connections
  useEffect(() => {
      let changed = false;
      const newNodes = nodes.map(targetNode => {
          if (!targetNode.boundProps) return targetNode;
          
          const updatedConfig = { ...targetNode.config };
          let nodeChanged = false;

          Object.entries(targetNode.boundProps).forEach(([propKey, binding]: [string, any]) => {
              const sourceNode = nodes.find(n => n.id === binding.targetNodeId);
              if (sourceNode) {
                  let sourceValue = sourceNode.config[binding.targetProp];
                  
                  // Boolean/Decimal -> Percentage Logic
                  const maxVal = targetNode.config.max ?? 100;
                  const isPercentageTarget = 
                      (targetNode.type === NodeType.SLIDER && maxVal === 100) ||
                      (targetNode.type === NodeType.TRANSFORM && propKey === 'scale');

                  if (isPercentageTarget) {
                      if (typeof sourceValue === 'boolean') {
                          sourceValue = sourceValue ? 100 : 0;
                      } else if (typeof sourceValue === 'number' && sourceValue >= 0 && sourceValue <= 1) {
                          sourceValue = sourceValue * 100;
                      }
                  } else if (typeof sourceValue === 'boolean') {
                      sourceValue = sourceValue ? 1 : 0;
                  }

                  if (updatedConfig[propKey] !== sourceValue) {
                      updatedConfig[propKey] = sourceValue;
                      nodeChanged = true;
                  }
              }
          });
          
          if (nodeChanged) {
              changed = true;
              return { ...targetNode, config: updatedConfig };
          }
          return targetNode;
      });

      if (changed) {
          setNodes(newNodes);
      }
  }, [nodes]);

  return (
    <div 
      id="canvas-bg"
      className={`w-full h-screen overflow-hidden select-none relative ${isDarkMode ? 'bg-black text-white' : 'bg-[#F5F5F5] text-neutral-900'}`}
      onMouseMove={(e) => {
          // PANNING
          if (isPanning) {
              const dx = e.clientX - panStartRef.current.mouseX;
              const dy = e.clientY - panStartRef.current.mouseY;
              setViewport(prev => ({
                  ...prev,
                  x: panStartRef.current.x + dx,
                  y: panStartRef.current.y + dy
              }));
          }
          // DRAGGING NODES
          if (dragState) {
              const dx = (e.clientX - dragState.mouseStartX) / viewport.zoom;
              const dy = (e.clientY - dragState.mouseStartY) / viewport.zoom;
              
              setNodes(prev => prev.map(n => {
                  if (dragState.nodeIds.includes(n.id)) {
                      const start = dragState.startPositions[n.id];
                      return { ...n, position: { x: start.x + dx, y: start.y + dy } };
                  }
                  return n;
              }));
          }
          // WIRING
          if (tempWire) {
              const worldPos = screenToWorld(e.clientX, e.clientY);
              setTempWire(prev => prev ? { ...prev, mouseX: worldPos.x, mouseY: worldPos.y } : null);
          }
      }}
      onMouseUp={(e) => {
          if (isPanning) {
             const dist = Math.sqrt(Math.pow(e.clientX - panStartRef.current.mouseX, 2) + Math.pow(e.clientY - panStartRef.current.mouseY, 2));
             if (dist < 5) setSelectedIds(new Set());
          }
          setIsPanning(false);
          
          if (dragState) {
              // Snap all dragged nodes
              const newNodes = nodes.map(n => {
                  if (dragState.nodeIds.includes(n.id)) {
                      return { 
                          ...n, 
                          position: { 
                              x: Math.round(n.position.x / SNAP_SIZE) * SNAP_SIZE, 
                              y: Math.round(n.position.y / SNAP_SIZE) * SNAP_SIZE 
                          } 
                      };
                  }
                  return n;
              });
              setNodes(newNodes);
              pushHistory(newNodes, connections);
              setDragState(null);
          }
          if (tempWire && !tempWire.isHot) setTempWire(null);
      }}
      onWheel={(e) => {
        // Don't zoom if node picker is open
        if (isNodePickerOpen) return;
        
        if (e.shiftKey) { setViewport(prev => ({ ...prev, x: prev.x - e.deltaY, y: prev.y - e.deltaX })); return; }
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newZoom = Math.min(Math.max(viewport.zoom + delta, 0.2), 3);
        const worldX = (e.clientX - viewport.x) / viewport.zoom;
        const worldY = (e.clientY - viewport.y) / viewport.zoom;
        const newX = e.clientX - worldX * newZoom;
        const newY = e.clientY - worldY * newZoom;
        setViewport({ x: newX, y: newY, zoom: newZoom });
      }}
      onMouseDown={(e) => {
          setPropertyContextMenu(null);
          if (!dragState) {
              setIsPanning(true); 
              panStartRef.current = { x: viewport.x, y: viewport.y, mouseX: e.clientX, mouseY: e.clientY }; 
          }
      }}
    >
        {/* GRID BACKGROUND */}
        <CanvasBackground viewport={viewport} isDarkMode={isDarkMode} gridType={gridType} />

      <div ref={containerRef} className="absolute inset-0 z-10 origin-top-left pointer-events-none" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}>
        {/* WIRES */}
        <svg className="absolute left-0 top-0 overflow-visible pointer-events-none z-10">
            <defs>
                 <marker id="arrow-head" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill={isDarkMode ? "#666" : "#999"} /></marker>
            </defs>
            {connections.map(conn => (
                <ConnectionLine 
                    key={conn.id}
                    connection={conn}
                    sourceNode={nodes.find(n => n.id === conn.source)}
                    targetNode={nodes.find(n => n.id === conn.target)}
                    viewport={viewport}
                    isDarkMode={isDarkMode}
                    onDelete={(id) => {
                        setConnections(prev => prev.filter(c => c.id !== id));
                        pushHistory(nodes, connections.filter(c => c.id !== id));
                    }}
                />
            ))}
             {tempWire && (
                <path d={`M ${tempWire.startType === 'output' ? getNodePosition(tempWire.startId).x + 272 : getNodePosition(tempWire.startId).x - 16} ${getNodePosition(tempWire.startId).y + 40} L ${tempWire.mouseX} ${tempWire.mouseY}`} stroke={isDarkMode ? "#666" : "#999"} strokeWidth={2 / viewport.zoom} strokeDasharray="5 5" fill="none" />
            )}
        </svg>

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
                onSelect={(id) => {
                    // Handled in onNodeDown mostly, but here for click
                    // If not dragging, this fires.
                    // But we handle selection in onNodeDown to allow drag-select.
                }}
                onToggleCollapse={(id) => setNodes(p => p.map(n => n.id === id ? { ...n, collapsed: !n.collapsed } : n))}
                onPortDown={handlePortDown}
                onPortUp={handlePortUp}
                onPortContextMenu={(id, type, e) => { setMenuData({ nodeId: id, type, x: e.clientX, y: e.clientY }); setActiveMenu('DISCONNECT'); }}
                onPortDoubleClick={(id, type, e) => { 
                    setMenuData({ nodeId: id, type, x: e.clientX, y: e.clientY }); 
                    setActiveMenu('PORT'); 
                }}
                onNodeDown={(e) => { 
                    e.stopPropagation(); 
                    
                    let newSelected = new Set(selectedIds);
                    if (e.shiftKey) {
                        if (newSelected.has(node.id)) newSelected.delete(node.id);
                        else newSelected.add(node.id);
                    } else {
                        if (!newSelected.has(node.id)) {
                            newSelected = new Set([node.id]);
                        }
                    }
                    setSelectedIds(newSelected);

                    // Alt+Drag: Duplicate
                    if (e.altKey) {
                        const nodesToDuplicate = nodes.filter(n => newSelected.has(n.id));
                        const newNodes: NodeData[] = [];
                        const idMap = new Map<string, string>();

                        nodesToDuplicate.forEach(n => {
                            const newId = `n_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                            idMap.set(n.id, newId);
                            newNodes.push({
                                ...n,
                                id: newId,
                                label: n.label + ' (Copy)',
                                position: { x: n.position.x + 50, y: n.position.y + 50 },
                                boundProps: { ...n.boundProps }
                            });
                        });

                        const updatedNodes = [...nodes, ...newNodes];
                        setNodes(updatedNodes);
                        
                        // Copy INPUT connections for duplicated nodes
                        const newConns: Connection[] = [];
                        nodesToDuplicate.forEach(n => {
                            const inputs = connections.filter(c => c.target === n.id);
                            inputs.forEach(c => {
                                newConns.push({
                                    ...c,
                                    id: `c_${Date.now()}_${Math.random()}`,
                                    target: idMap.get(n.id)!
                                });
                            });
                        });
                        
                        const updatedConns = [...connections, ...newConns];
                        setConnections(updatedConns);
                        pushHistory(updatedNodes, updatedConns);

                        const newSelection = new Set(newNodes.map(n => n.id));
                        setSelectedIds(newSelection);

                        // Start Dragging New Nodes
                        const startPositions: Record<string, {x: number, y: number}> = {};
                        newNodes.forEach(n => startPositions[n.id] = { x: n.position.x, y: n.position.y });
                        setDragState({ nodeIds: Array.from(newSelection), startPositions, mouseStartX: e.clientX, mouseStartY: e.clientY });

                    } else {
                        // Start Dragging Selected Nodes
                        const startPositions: Record<string, {x: number, y: number}> = {};
                        nodes.filter(n => newSelected.has(n.id)).forEach(n => startPositions[n.id] = { x: n.position.x, y: n.position.y });
                        setDragState({ nodeIds: Array.from(newSelected), startPositions, mouseStartX: e.clientX, mouseStartY: e.clientY });
                    }
                }}
            >
                <NodeContent 
                    node={node} 
                    isDarkMode={isDarkMode} 
                    updateConfig={(key, val) => {
                        const newNodes = nodes.map(n => n.id === node.id ? { ...n, config: { ...n.config, [key]: val } } : n);
                        setNodes(newNodes);
                    }}
                    pushHistory={() => pushHistory(nodes, connections)}
                />
            </BaseNode>
        ))}
      </div>
      
      {/* SIDE PANEL */}
      <SidePanel 
          selectedNode={selectedIds.size === 1 ? nodes.find(n => n.id === Array.from(selectedIds)[0]) || null : null}
          onClose={() => setSelectedIds(new Set())}
          onUpdate={(id, newData) => {
              const newNodes = nodes.map(n => n.id === id ? { ...n, ...newData } : n);
              setNodes(newNodes);
              pushHistory(newNodes, connections);
          }}
          onBindProp={handleBindProp}
          isDarkMode={isDarkMode}
          boundProps={selectedIds.size === 1 ? nodes.find(n => n.id === Array.from(selectedIds)[0])?.boundProps || {} : {}}
          onContextMenu={(menu) => setPropertyContextMenu(menu)}
      />

      {/* UI HEADER */}
      <Header 
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        gridType={gridType}
        setGridType={setGridType}
        historyIndex={historyIndex}
        historyLength={history.length}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        setIsNodePickerOpen={setIsNodePickerOpen}
        setPickerCounts={setPickerCounts}
      />

      {/* COMMAND LEGEND */}
      <ShortcutsPanel isDarkMode={isDarkMode} />

      {/* NODE PICKER MODAL */}
      <NodePicker 
        isOpen={isNodePickerOpen}
        onClose={() => setIsNodePickerOpen(false)}
        isDarkMode={isDarkMode}
        pickerCounts={pickerCounts}
        setPickerCounts={setPickerCounts}
        onAdd={handleNodePickerAdd}
        onSingleAdd={addNode}
      />
      
      {/* MENUS */}
      {activeMenu === 'PORT' && menuData && (
          <div className="fixed z-[100] w-48 bg-black border border-neutral-800 rounded-lg shadow-xl" style={{ left: menuData.x, top: menuData.y }} onMouseDown={e => e.stopPropagation()}>
              {Object.values(NodeType)
                .filter(type => {
                    // Filter logic:
                    // If source is Output, target must have Input.
                    // If source is Input, target must have Output.
                    if (menuData.type === 'output') {
                        // Exclude generators that typically don't have inputs (Picker, Oscillator, Slider, Number, Boolean)
                        // Include Transform, Logic, Output
                        return [NodeType.TRANSFORM, NodeType.LOGIC, NodeType.OUTPUT].includes(type);
                    } else {
                        // Exclude Output node (no output)
                        return type !== NodeType.OUTPUT;
                    }
                })
                .map(type => (
                  <button key={type} className="block w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10" onClick={() => { 
                      const pos = getNodePosition(menuData.nodeId); 
                      // Place to Right if Output, Left if Input
                      const offset = menuData.type === 'output' ? 300 : -300;
                      const newNode = addNode(type, pos.x + offset, pos.y); 
                      
                      const newConns = [...connections, { 
                          id: `c_${Date.now()}`, 
                          source: menuData.type === 'output' ? menuData.nodeId : newNode.id, 
                          target: menuData.type === 'output' ? newNode.id : menuData.nodeId, 
                          type: ConnectionType.BEZIER 
                      }];
                      setConnections(newConns);
                      pushHistory(nodes, newConns);
                      setActiveMenu(null);
                  }}>
                      {getTypeLabel(type)}
                  </button>
              ))}
          </div>
      )}

      {activeMenu === 'CONNECTION' && menuData && (
          <div className="fixed z-[100] w-48 bg-black border border-neutral-800 rounded-lg shadow-xl" style={{ left: menuData.x, top: menuData.y }} onMouseDown={e => e.stopPropagation()}>
              <div className="px-4 py-2 text-xs font-bold text-neutral-500 border-b border-neutral-800">Connection Type</div>
              {Object.values(ConnectionType).map(type => (
                  <button key={type} className="block w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10" onClick={() => {
                      const newConns = [...connections, { id: `c_${Date.now()}`, source: menuData.source, target: menuData.target, type }];
                      setConnections(newConns);
                      pushHistory(nodes, newConns);
                      setActiveMenu(null);
                  }}>
                      {type}
                  </button>
              ))}
          </div>
      )}

      {activeMenu === 'DISCONNECT' && menuData && (
          <div className="fixed z-[100] w-48 bg-black border border-neutral-800 rounded-lg shadow-xl" style={{ left: menuData.x, top: menuData.y }} onMouseDown={e => e.stopPropagation()}>
              <button className="block w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-white/10" onClick={() => {
                  const newConns = connections.filter(c => !(c.target === menuData.nodeId && menuData.type === 'input') && !(c.source === menuData.nodeId && menuData.type === 'output'));
                  setConnections(newConns);
                  pushHistory(nodes, newConns);
                  setActiveMenu(null);
              }}>
                  Disconnect All
              </button>
          </div>
      )}

      {/* PROPERTY TELEPORT MENU */}
      {propertyContextMenu && (() => {
          // Calculate safe menu position
          const menuWidth = 224; // w-56 = 14rem = 224px
          const menuHeight = propertyTeleportBuffer 
              ? (nodes.find(n => n.id === propertyContextMenu.nodeId)?.boundProps?.[propertyContextMenu.propKey] ? 200 : 170)
              : (nodes.find(n => n.id === propertyContextMenu.nodeId)?.boundProps?.[propertyContextMenu.propKey] ? 130 : 100);
          const safePos = getMenuPosition(propertyContextMenu.x, propertyContextMenu.y, menuWidth, menuHeight);
          
          return (
              <div className="fixed z-[100] w-56 bg-black border border-neutral-800 rounded-lg shadow-xl overflow-hidden" style={{ left: safePos.left, top: safePos.top }} onMouseDown={e => e.stopPropagation()}>
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
    </div>
  );
}
