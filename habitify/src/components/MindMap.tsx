import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Brain, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export const MindMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = 600;
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw connections
      ctx.strokeStyle = '#00d4ff33';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;

      const nodes = [
        { x: centerX - 200, y: centerY - 100, label: 'Data Structures', color: '#00ff88' },
        { x: centerX + 200, y: centerY - 100, label: 'Algorithms', color: '#00d4ff' },
        { x: centerX - 200, y: centerY + 100, label: 'Operating Systems', color: '#a855f7' },
        { x: centerX + 200, y: centerY + 100, label: 'Databases', color: '#ff6b35' },
      ];

      nodes.forEach(node => {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
      });

      // Draw central node
      ctx.setLineDash([]);
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00d4ff';
      ctx.fillStyle = '#12121a';
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#f0f0ff';
      ctx.font = 'bold 14px Syne';
      ctx.textAlign = 'center';
      ctx.fillText('GATE CS', centerX, centerY + 5);

      // Draw branch nodes
      nodes.forEach(node => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = node.color;
        ctx.fillStyle = '#12121a';
        ctx.strokeStyle = node.color;
        ctx.beginPath();
        ctx.roundRect(node.x - 70, node.y - 20, 140, 40, 10);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#f0f0ff';
        ctx.font = '12px DM Sans';
        ctx.fillText(node.label, node.x, node.y + 5);
      });
    };

    window.addEventListener('resize', resize);
    resize();

    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-syne flex items-center gap-3">
          <Brain className="text-neon-cyan" /> MIND MAP
        </h2>
        <div className="flex gap-2">
          <button className="p-2 glass-card hover:bg-white/5"><ZoomIn size={18} /></button>
          <button className="p-2 glass-card hover:bg-white/5"><ZoomOut size={18} /></button>
          <button className="p-2 glass-card hover:bg-white/5"><Maximize2 size={18} /></button>
          <button className="btn-neon btn-neon-green text-xs flex items-center gap-2">
            <Download size={14} /> EXPORT PNG
          </button>
        </div>
      </div>

      <div className="glass-card p-4 neon-border-cyan relative overflow-hidden h-[600px]">
        <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        
        <div className="absolute bottom-6 left-6 glass-card p-4 text-[10px] space-y-2">
          <p className="font-bold uppercase text-text-muted mb-2">Legend</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-green" /> Core Subjects
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-cyan" /> Mathematics
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-purple" /> Aptitude
          </div>
        </div>
      </div>
    </div>
  );
};
