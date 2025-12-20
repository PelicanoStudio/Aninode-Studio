// @ts-nocheck - Touch-specific hook, not priority for desktop-first MVP
import { useEffect, useState } from 'react';

export const usePinchZoom = (
  viewport: { x: number; y: number; zoom: number },
  setViewport: React.Dispatch<React.SetStateAction<{ x: number; y: number; zoom: number }>>,
  containerRef: React.RefObject<HTMLDivElement>
) => {
  const [touchDist, setTouchDist] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        setTouchDist(dist);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchDist !== null) {
        const newDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        
        const delta = newDist - touchDist;
        const zoomSensitivity = 0.005;
        const zoomChange = delta * zoomSensitivity;
        
        const newZoom = Math.min(Math.max(viewport.zoom + zoomChange, 0.2), 3);
        
        // Center of pinch
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        const worldX = (centerX - viewport.x) / viewport.zoom;
        const worldY = (centerY - viewport.y) / viewport.zoom;
        
        const newX = centerX - worldX * newZoom;
        const newY = centerY - worldY * newZoom;

        setViewport({ x: newX, y: newY, zoom: newZoom });
        setTouchDist(newDist);
      }
    };

    const handleTouchEnd = () => {
      setTouchDist(null);
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [viewport, touchDist, setViewport, containerRef]);
};
