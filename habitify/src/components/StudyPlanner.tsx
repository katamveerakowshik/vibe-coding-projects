import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, Zap, BookOpen, Coffee, Brain, Target } from 'lucide-react';
import { Task } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StudyPlannerProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onRegenerate: () => void;
  onOpenModal: () => void;
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({ tasks, onToggleTask, onRegenerate, onOpenModal }) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-syne">TODAY'S MISSION</h2>
        <div className="flex gap-4">
          {tasks.length > 0 && (
            <>
              <button className="btn-neon btn-neon-green text-xs" onClick={onRegenerate}>REGENERATE PLAN</button>
              <button className="glass-card px-4 py-2 text-xs font-bold hover:bg-white/5" onClick={() => alert("Adjusting your plan based on current progress...")}>ADJUST PLAN</button>
            </>
          )}
        </div>
      </div>

      <div className="relative pl-8 space-y-8">
        {/* Timeline Line with Progress */}
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-white/5" />
        <motion.div 
          className="absolute left-[11px] top-0 w-0.5 bg-gradient-to-b from-neon-cyan via-neon-purple to-neon-pink shadow-glow-cyan z-0"
          initial={{ height: 0 }}
          animate={{ 
            height: tasks.length > 0 
              ? `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` 
              : 0 
          }}
          transition={{ duration: 0.8, ease: "circOut" }}
        />

        {tasks.length > 0 ? (
          tasks.map((task, index) => {
            const isCurrent = !task.completed && (index === 0 || tasks[index - 1]?.completed);
            const isCompleted = task.completed;
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "relative glass-card p-6 transition-all duration-500 group",
                  isCurrent ? "neon-border-cyan scale-[1.01] shadow-glow-cyan/5 bg-white/5" : "border-white/5",
                  isCompleted && "opacity-60 border-neon-green/20"
                )}
              >
                {/* Timeline Dot */}
                <div className={cn(
                  "absolute -left-[29px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 bg-bg-void z-20 transition-all duration-500",
                  isCompleted ? "border-neon-green bg-neon-green shadow-glow-green scale-110" :
                  isCurrent ? "border-neon-cyan shadow-glow-cyan animate-pulse-glow" : "border-white/20"
                )} />

                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] font-mono font-bold text-neon-cyan">
                        <Clock size={12} />
                        {task.startTime} - {task.endTime} 
                        <span className="text-text-muted ml-1">({task.duration}m)</span>
                      </div>
                      {isCurrent && (
                        <motion.span 
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="text-[9px] font-bold text-bg-void bg-neon-cyan px-2 py-0.5 rounded uppercase tracking-tighter shadow-glow-cyan"
                        >
                          Active Protocol
                        </motion.span>
                      )}
                    </div>
                    
                    <h3 className={cn(
                      "text-xl font-syne tracking-tight transition-all duration-500",
                      isCompleted ? "text-text-muted line-through opacity-50" : "text-white"
                    )}>
                      {task.title}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] px-3 py-1 bg-white/5 rounded-lg text-text-muted flex items-center gap-2 border border-white/5 group-hover:border-neon-purple/30 transition-colors">
                        <Brain size={12} className="text-neon-purple" /> {task.method}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                      {task.checkpoints?.map((cp, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-7 h-7 rounded-lg border flex items-center justify-center transition-all text-[10px] font-bold",
                            cp.completed ? "bg-neon-green/20 border-neon-green text-neon-green shadow-glow-green/20" : "border-white/10 text-text-muted"
                          )}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className={cn(
                        "w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 active:scale-90",
                        isCompleted 
                          ? "bg-neon-green border-neon-green text-bg-void shadow-glow-green" 
                          : "border-white/10 hover:border-neon-green/50 text-text-muted hover:text-neon-green bg-white/2"
                      )}
                    >
                      <CheckCircle2 size={28} className={cn("transition-all duration-500", isCompleted ? "scale-110 rotate-0" : "scale-90 opacity-50")} />
                    </button>
                  </div>
                </div>

                {task.tips && (
                  <div className="mt-5 p-4 bg-white/2 rounded-xl border-l-2 border-neon-cyan/30 backdrop-blur-sm group-hover:bg-white/5 transition-colors">
                    <p className="text-xs text-text-muted leading-relaxed flex items-start gap-3">
                      <Zap size={14} className="text-neon-cyan shrink-0 mt-0.5" /> 
                      <span className="font-medium">{task.tips}</span>
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
              <Target size={48} className="text-text-muted opacity-50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-syne">NO MISSION ACTIVE</h3>
              <p className="text-text-muted max-w-xs mx-auto">Your mission for today is not yet defined. Launch your trajectory now.</p>
            </div>
            <button 
              onClick={onOpenModal}
              className="btn-neon btn-neon-green px-8 py-4 text-lg flex items-center gap-3"
            >
              <Zap size={20} /> PLAN MY MISSION
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
