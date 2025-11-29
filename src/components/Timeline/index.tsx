import { useSnapshot } from 'valtio'
import { aninodeStore, storeActions } from '@core/store'
import styles from './Timeline.module.css'

export function Timeline() {
  const snap = useSnapshot(aninodeStore)
  const timeline = snap.timeline.default

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * timeline.fps)
    return `${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    const time = percent * timeline.duration
    storeActions.setCurrentTime(time)
  }

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button
          className={styles.playButton}
          onClick={() => storeActions.setPlaying(!timeline.isPlaying)}
        >
          {timeline.isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className={styles.controlButton}
          onClick={() => storeActions.setCurrentTime(0)}
        >
          ⏮
        </button>
        <span className={styles.timeDisplay}>
          {formatTime(timeline.currentTime)} / {formatTime(timeline.duration)}
        </span>
      </div>

      <div className={styles.timelineWrapper}>
        <div className={styles.ruler}>
          {Array.from({ length: Math.ceil(timeline.duration) + 1 }).map((_, i) => (
            <div key={i} className={styles.tick}>
              <span>{i}s</span>
            </div>
          ))}
        </div>

        <div className={styles.timeline} onClick={handleSeek}>
          <div
            className={styles.playhead}
            style={{
              left: `${(timeline.currentTime / timeline.duration) * 100}%`,
            }}
          />

          {/* Placeholder for keyframes/layers */}
          <div className={styles.tracks}>
            {Object.values(snap.nodes).map((node) => (
              <div key={node.id} className={styles.track}>
                <div className={styles.trackLabel}>{node.name}</div>
                <div className={styles.trackContent}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
