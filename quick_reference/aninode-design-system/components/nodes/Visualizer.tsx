import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  type: 'sine' | 'square' | 'noise';
  frequency: number;
  amplitude: number;
  active: boolean;
  isDarkMode: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ type, frequency, amplitude, active, isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resizeCanvas = () => {
        const { clientWidth, clientHeight } = container;
        canvas.width = clientWidth;
        canvas.height = clientHeight;
    };

    const resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
    });
    
    resizeObserver.observe(container);
    resizeCanvas(); // Initial size

    const draw = () => {
      if (!ctx || !canvas) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear with transparency
      ctx.clearRect(0, 0, width, height);
      
      const centerY = height / 2;

      // Define time factor t outside the loop
      const t = time * frequency * 0.05;

      ctx.beginPath();
      // Line Color: Dark Grey in Light Mode, Dark Grey in Dark Mode (inactive), Red (Active)
      const baseColor = isDarkMode ? '#333333' : '#E0E0E0';
      const activeColor = active ? '#FF1F1F' : baseColor;
      
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2;

      for (let x = 0; x < width; x++) {
        const xPos = x;
        let yPos = centerY;

        // Scaling amplitude based on height availability to prevent clipping but maintain visibility
        // Max amplitude is 40% of height
        const scaledAmp = Math.min(amplitude * 20, height * 0.4);

        if (type === 'sine') {
          yPos = centerY + Math.sin(x * 0.05 * frequency + t) * scaledAmp;
        } else if (type === 'square') {
           yPos = centerY + (Math.sin(x * 0.05 * frequency + t) > 0 ? 1 : -1) * scaledAmp;
        }

        if (x === 0) ctx.moveTo(xPos, yPos);
        else ctx.lineTo(xPos, yPos);
      }

      ctx.stroke();

      // Draw active point
      if (active) {
        const currentX = width / 2;
        let currentY = centerY;
        const scaledAmp = Math.min(amplitude * 20, height * 0.4);

        if (type === 'sine') {
           currentY = centerY + Math.sin(currentX * 0.05 * frequency + t) * scaledAmp;
        } else if (type === 'square') {
           currentY = centerY + (Math.sin(currentX * 0.05 * frequency + t) > 0 ? 1 : -1) * scaledAmp;
        }
        
        ctx.beginPath();
        ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#FF1F1F';
        ctx.arc(currentX, currentY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow
        ctx.shadowColor = '#FF1F1F';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      time++;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [type, frequency, amplitude, active, isDarkMode]);

  return (
    <div 
        ref={containerRef}
        className={`w-full h-full min-h-[64px] border rounded overflow-hidden relative flex-1 ${isDarkMode ? 'bg-black border-neutral-900' : 'bg-white border-neutral-200'}`}
    >
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: `linear-gradient(${isDarkMode ? '#282828ff' : '#eaeaeaff'} 2px, transparent 2px), linear-gradient(90deg, ${isDarkMode ? '#333' : '#DDD'} 1px, transparent 1px)`, 
               backgroundSize: '10px 10px' 
             }}>
        </div>
        <canvas 
            ref={canvasRef} 
            className="w-full h-full relative z-10 block"
        />
    </div>
  );
};