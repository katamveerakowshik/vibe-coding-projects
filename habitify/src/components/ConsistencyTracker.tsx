import React from 'react';
import { motion } from 'motion/react';
import { Flame, Calendar, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ConsistencyTracker: React.FC = () => {
  const days = Array.from({ length: 365 }, (_, i) => {
    const intensity = Math.floor(Math.random() * 5);
    return intensity;
  });

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0: return 'bg-white/5';
      case 1: return 'bg-neon-green/20';
      case 2: return 'bg-neon-green/40';
      case 3: return 'bg-neon-green/60';
      case 4: return 'bg-neon-green shadow-glow-green';
      default: return 'bg-white/5';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-syne flex items-center gap-3">
          <Flame className="text-neon-orange" /> CONSISTENCY
        </h2>
        <div className="flex gap-4">
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <Trophy className="text-gold" size={16} />
            <span className="text-xs font-bold">BEST STREAK: 24 DAYS</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 neon-border-green overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/5 rounded-lg"><ChevronLeft size={18} /></button>
            <span className="font-syne font-bold">2026</span>
            <button className="p-2 hover:bg-white/5 rounded-lg"><ChevronRight size={18} /></button>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-text-muted">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className={cn("w-3 h-3 rounded-sm", getIntensityColor(i))} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>

        <div className="grid grid-flow-col grid-rows-7 gap-1 min-w-[800px]">
          {days.map((intensity, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.001 }}
              className={cn(
                "w-3 h-3 rounded-sm transition-all hover:scale-150 hover:z-10 cursor-pointer",
                getIntensityColor(intensity)
              )}
              title={`Day ${i + 1}: ${intensity * 25}% productivity`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-l-4 border-neon-green">
          <h3 className="text-xs font-bold text-text-muted uppercase mb-2">Current Streak</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-syne font-bold">12</span>
            <span className="text-sm text-neon-green mb-1 font-bold">DAYS</span>
          </div>
        </div>
        <div className="glass-card p-6 border-l-4 border-neon-cyan">
          <h3 className="text-xs font-bold text-text-muted uppercase mb-2">Study Days</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-syne font-bold">248</span>
            <span className="text-sm text-neon-cyan mb-1 font-bold">TOTAL</span>
          </div>
        </div>
        <div className="glass-card p-6 border-l-4 border-neon-purple">
          <h3 className="text-xs font-bold text-text-muted uppercase mb-2">Consistency</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-syne font-bold">92%</span>
            <span className="text-sm text-neon-purple mb-1 font-bold">SCORE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
