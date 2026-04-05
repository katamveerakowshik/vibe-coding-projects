import React, { useEffect, useRef } from 'react';
import { UrgencyLevel } from '../types';

interface WaveProps {
  isPlaying: boolean;
  urgency: UrgencyLevel;
  className?: string;
}

const WaveVisualizer: React.FC<WaveProps> = ({ isPlaying, urgency, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let step = 0;

    const color = urgency === UrgencyLevel.CRITICAL ? '#FF3B30' : '#39FF14';
    const jaggedness = urgency === UrgencyLevel.CRITICAL ? 20 : 5;

    const draw = () => {
      if (!isPlaying) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Draw flat line
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.strokeStyle = '#333';
          ctx.stroke();
          return;
      }
      
      step += 0.1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.beginPath();

      const width = canvas.width;
      const height = canvas.height;
      const amplitude = height / 4;
      const frequency = 0.05;

      for (let x = 0; x < width; x++) {
        const y = height / 2 + Math.sin(x * frequency + step) * amplitude * Math.sin(step * 0.5) 
                  + (Math.random() - 0.5) * jaggedness; // Add noise for urgency
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, urgency]);

  return (
    <canvas ref={canvasRef} width={300} height={60} className={className} />
  );
};

export default WaveVisualizer;
