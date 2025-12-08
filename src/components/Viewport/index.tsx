import { engineStore } from '@core/store'
import { useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import styles from './Viewport.module.css'

export function Viewport() {
  const snap = useSnapshot(engineStore)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Temporary UI state (since we nuked the UI store for now)
  const [zoom, setZoom] = useState(1)

  // Auto-scale canvas (Simplified)
  // Note: 'scene' is gone, we check 'project.assets' or 'project.timeline'
  const canvasWidth = 800 // Default for now
  const canvasHeight = 600

  // Render Loop:
  // Iterate Assets (Definition) -> Apply Computed State (Runtime)
  const assets = Object.values(snap.project.assets)
  const computed = snap.runtime.computedObjects

  if (assets.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📁</div>
          <h3>No Assets</h3>
          <p>Import assets to start engine</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.viewport}>
        <div
          className={styles.canvas}
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            position: 'relative',
            backgroundColor: '#111'
          }}
        >
          {assets.map((asset) => {
             // Get computed state or fallback to initial
             // Note: Computed state might strictly required in Phase 3, 
             // but for Phase 1 we might just use initial if loose.
             // However, Axiom 2: "Engine WRITES to store. Viewport READS."
             // If engine hasn't written, it might be undefined.
             // We fallback to asset.initial for now to avoid invisible objects.
             const state = computed[asset.id] || asset.initial

             return (
              <div
                key={asset.id}
                style={{
                  position: 'absolute',
                  left: 0, // Using transform for performance? Or top/left?
                  top: 0,  // Standard says absolute DIVs based on data.
                  // Let's use transform for everything to be like a game engine
                  transform: `translate(${state.x}px, ${state.y}px) rotate(${state.rotation}deg) scale(${state.scaleX}, ${state.scaleY})`,
                  width: asset.initial?.scaleX ? 'auto' : '100px', // Fallback sizing logic needed if width/height not in state
                  opacity: state.opacity,
                  // Image specific
                  backgroundImage: `url(${asset.src})`,
                  backgroundSize: 'cover',
                  pointerEvents: 'none' // "Dumb Viewport" - selection handled elsewhere ideally
                }}
              >
                {/* Debug ID */}
                <span style={{ fontSize: 10, color: 'lime' }}>{asset.id}</span>
              </div>
            )
          })}
        </div>
      </div>

       {/* Simple Zoom Controls */}
       <div className={styles.controls}>
        <button onClick={() => setZoom(z => z - 0.1)}>−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => z + 0.1)}>+</button>
      </div>
    </div>
  )
}
