import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimerProps {
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({ className }) => {
  const [mode, setMode] = useState<'stopwatch' | 'countdown'>('countdown');
  const [timeLeft, setTimeLeft] = useState(25 * 60 * 1000); // 25 mins in ms
  const [isRunning, setIsRunning] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const msecs = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${msecs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (isRunning) return;
    setIsRunning(true);
    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      if (mode === 'countdown') {
        setTimeLeft((prev) => {
          if (prev <= 10) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
            return 0;
          }
          return prev - 10;
        });
      } else {
        setTimeLeft((prev) => prev + 10);
      }
    }, 10);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetTimer = () => {
    pauseTimer();
    setTimeLeft(mode === 'countdown' ? 25 * 60 * 1000 : 0);
  };

  const selectOption = (mins: number) => {
    setMode('countdown');
    setTimeLeft(mins * 60 * 1000);
    setShowOptions(false);
  };

  return (
    <div className={cn("glass-card p-6 neon-border-cyan relative overflow-hidden", className)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-syne flex items-center gap-2">
          {mode === 'countdown' ? <Clock className="text-neon-cyan" /> : <TimerIcon className="text-neon-purple" />}
          {mode.toUpperCase()}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => { setMode('stopwatch'); setTimeLeft(0); setShowOptions(false); }}
            className={cn("p-2 rounded-lg transition-all", mode === 'stopwatch' ? "bg-neon-purple text-white" : "bg-white/5")}
          >
            SW
          </button>
          <button 
            onClick={() => { setMode('countdown'); setShowOptions(true); }}
            className={cn("p-2 rounded-lg transition-all", mode === 'countdown' ? "bg-neon-cyan text-white" : "bg-white/5")}
          >
            CD
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showOptions && mode === 'countdown' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 gap-3"
          >
            {[25, 30, 45, 60].map((m) => (
              <button 
                key={m}
                onClick={() => selectOption(m)}
                className="p-4 glass-card hover:bg-neon-cyan/20 border-neon-cyan/30 transition-all text-center font-bold"
              >
                {m} MINS
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="text-5xl font-mono font-bold text-neon-cyan mb-6 tracking-tighter">
              {formatTime(timeLeft)}
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={isRunning ? pauseTimer : startTimer}
                className="w-16 h-16 rounded-full bg-neon-cyan text-bg-void flex items-center justify-center hover:scale-110 transition-all shadow-glow-cyan"
              >
                {isRunning ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
              </button>
              <button 
                onClick={resetTimer}
                className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <RotateCcw size={32} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Ring */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 border-4 border-neon-cyan/10 rounded-full animate-pulse-glow" />
    </div>
  );
};
