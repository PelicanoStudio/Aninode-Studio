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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const draw = () => {
      if (!ctx || !canvas) return;
      
      // Clear with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
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
        // Normalized x from 0 to 1
        const xPos = x;
        let yPos = centerY;

        if (type === 'sine') {
          yPos = centerY + Math.sin(x * 0.05 * frequency + t) * (amplitude * 20);
        } else if (type === 'square') {
           yPos = centerY + (Math.sin(x * 0.05 * frequency + t) > 0 ? 1 : -1) * (amplitude * 20);
        }

        if (x === 0) ctx.moveTo(xPos, yPos);
        else ctx.lineTo(xPos, yPos);
      }

      ctx.stroke();

      // Draw active point
      if (active) {
        const currentX = width / 2;
        let currentY = centerY;
        if (type === 'sine') {
           currentY = centerY + Math.sin(currentX * 0.05 * frequency + t) * (amplitude * 20);
        } else if (type === 'square') {
           currentY = centerY + (Math.sin(currentX * 0.05 * frequency + t) > 0 ? 1 : -1) * (amplitude * 20);
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
    };
  }, [type, frequency, amplitude, active, isDarkMode]);

  return (
    <div className={`w-full h-16 border rounded overflow-hidden relative ${isDarkMode ? 'bg-black border-neutral-900' : 'bg-white border-neutral-200'}`}>
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: `linear-gradient(${isDarkMode ? '#282828ff' : '#eaeaeaff'} 2px, transparent 2px), linear-gradient(90deg, ${isDarkMode ? '#333' : '#DDD'} 1px, transparent 1px)`, 
               backgroundSize: '10px 10px' 
             }}>
        </div>
        <canvas 
            ref={canvasRef} 
            width={240} 
            height={64} 
            className="w-full h-full relative z-10"
        />
    </div>
  );
};