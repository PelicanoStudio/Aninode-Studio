import { useRef, useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import { motion } from 'framer-motion'
import { aninodeStore, storeActions } from '@core/store'
import styles from './Viewport.module.css'

export function Viewport() {
  const snap = useSnapshot(aninodeStore)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // Auto-scale canvas to fit viewport
  useEffect(() => {
    if (!snap.scene || !containerRef.current) return

    const updateScale = () => {
      const container = containerRef.current!.getBoundingClientRect()
      const margin = 80
      const scaleX = (container.width - margin) / snap.scene!.canvas.width
      const scaleY = (container.height - margin) / snap.scene!.canvas.height
      setScale(Math.min(scaleX, scaleY, 1))
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [snap.scene])

  if (!snap.scene) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📁</div>
          <h3>No Scene Loaded</h3>
          <p>Import a scene to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.viewport}>
        <motion.div
          className={styles.canvas}
          style={{
            width: snap.scene.canvas.width,
            height: snap.scene.canvas.height,
            scale: scale * snap.ui.zoom,
          }}
        >
          {[...snap.scene.assets]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((asset) => (
              <motion.div
                key={asset.id}
                className={`${styles.layer} ${
                  snap.ui.selectedLayerId === asset.id ? styles.selected : ''
                }`}
                style={{
                  left: asset.x,
                  top: asset.y,
                  width: asset.width,
                  height: asset.height,
                  zIndex: asset.zIndex,
                  opacity: asset.opacity,
                  mixBlendMode: asset.blendMode as any,
                }}
                onClick={() => {
                  aninodeStore.ui.selectedLayerId = asset.id
                }}
              >
                <img
                  src={snap.loadedImages[asset.file]}
                  alt={asset.name}
                  draggable={false}
                />
              </motion.div>
            ))}
        </motion.div>
      </div>

      {/* Zoom Controls */}
      <div className={styles.controls}>
        <button
          onClick={() => storeActions.setZoom(snap.ui.zoom - 0.1)}
          className={styles.zoomButton}
        >
          −
        </button>
        <span className={styles.zoomLabel}>
          {Math.round(snap.ui.zoom * 100)}%
        </span>
        <button
          onClick={() => storeActions.setZoom(snap.ui.zoom + 0.1)}
          className={styles.zoomButton}
        >
          +
        </button>
        <button
          onClick={() => storeActions.setZoom(1)}
          className={styles.zoomButton}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
