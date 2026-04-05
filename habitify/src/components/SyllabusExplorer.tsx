import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2, StopCircle, Info, BookOpen, Clock, Star, Map, Zap, Search, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SyllabusNode } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SyllabusExplorerProps {
  syllabus: SyllabusNode[];
  currentExam: string;
  onToggle: (id: string) => void;
  onStop: (node: SyllabusNode) => void;
  onGenerate: (exam: string) => void;
  isGenerating: boolean;
}

const SyllabusItem: React.FC<{
  node: SyllabusNode;
  level: number;
  onToggle: (id: string) => void;
  onStop: (node: SyllabusNode) => void;
}> = ({ node, level, onToggle, onStop }) => {
  const [isExpanded, setIsExpanded] = useState(level < 1);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-3 py-3 px-4 rounded-xl transition-all group",
          node.checked ? "bg-neon-green/5 opacity-60" : "hover:bg-white/5",
          node.stopped && "border-l-4 border-neon-orange"
        )}
      >
        <div 
          className="cursor-pointer text-text-muted hover:text-white"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />
          ) : (
            <div className="w-[18px]" />
          )}
        </div>

        <button
          onClick={() => onToggle(node.id)}
          className={cn(
            "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
            node.checked ? "bg-neon-green border-neon-green text-bg-void" : "border-white/10 hover:border-neon-green/50"
          )}
        >
          {node.checked && <CheckCircle2 size={14} />}
        </button>

        <div className="flex-1 flex items-center gap-3">
          <span className={cn("font-bold text-sm", node.checked && "line-through")}>
            {node.name}
          </span>
          {node.difficulty && (
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
              node.difficulty === 'Easy' ? "bg-neon-green/10 text-neon-green" :
              node.difficulty === 'Medium' ? "bg-neon-cyan/10 text-neon-cyan" :
              "bg-neon-pink/10 text-neon-pink"
            )}>
              {node.difficulty}
            </span>
          )}
          {node.weightage && (
            <span className="text-[10px] text-text-muted flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              <Sparkles size={10} className="text-neon-green" /> {node.weightage}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button 
            onClick={() => onStop(node)}
            className={cn(
              "p-2 rounded-lg transition-all",
              node.stopped ? "bg-neon-orange text-bg-void" : "text-neon-orange hover:bg-neon-orange/10"
            )}
            title="Mark as Study Boundary"
          >
            <StopCircle size={16} />
          </button>
          <button className="p-2 text-neon-cyan hover:bg-neon-cyan/10 rounded-lg">
            <BookOpen size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-6 border-l border-white/5 overflow-hidden"
          >
            {node.children!.map(child => (
              <SyllabusItem 
                key={child.id} 
                node={child} 
                level={level + 1} 
                onToggle={onToggle} 
                onStop={onStop} 
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SyllabusExplorer: React.FC<SyllabusExplorerProps> = ({ syllabus, currentExam, onToggle, onStop, onGenerate, isGenerating }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onGenerate(searchValue.trim());
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-syne flex items-center gap-3">
            <Map className="text-neon-purple" /> SYLLABUS MAP
          </h2>
          <p className="text-text-muted text-sm mt-1">Currently tracking: <span className="text-neon-purple font-bold">{currentExam}</span></p>
        </div>
        
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search for any subject, exam, or skill..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 outline-none focus:neon-border-purple transition-all font-bold"
          />
          <button 
            type="submit"
            disabled={isGenerating}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neon-purple hover:scale-110 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
            ) : (
              <ChevronRight size={24} />
            )}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 glass-card p-6 neon-border-purple min-h-[600px]">
          <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
            <div className="flex gap-6">
              <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                <div className="w-3 h-3 bg-neon-green rounded-full shadow-glow-green" /> COMPLETED
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                <div className="w-3 h-3 bg-neon-orange rounded-full shadow-glow-orange" /> BOUNDARY
              </div>
            </div>
            <div className="text-xs font-bold text-text-muted uppercase tracking-widest">
              {syllabus.length} MAIN MODULES
            </div>
          </div>

          <div className="space-y-2">
            {syllabus.length > 0 ? (
              syllabus.map(node => (
                <SyllabusItem 
                  key={node.id} 
                  node={node} 
                  level={0} 
                  onToggle={onToggle} 
                  onStop={onStop} 
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-text-muted">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                >
                  <Map size={64} className="mb-6 opacity-20" />
                </motion.div>
                <p className="text-lg font-syne">NO SYLLABUS DETECTED</p>
                <p className="text-sm opacity-60 mt-2">Enter a subject above to initialize your learning path.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 neon-border-cyan">
            <h3 className="font-syne text-lg mb-4 flex items-center gap-2">
              <Info size={18} className="text-neon-cyan" /> PERFORMANCE INSIGHTS
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-xs text-text-muted uppercase font-bold mb-2">Completion Progress</p>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-syne text-neon-cyan">
                    {Math.round((syllabus.filter(n => n.checked).length / (syllabus.length || 1)) * 100)}%
                  </span>
                  <span className="text-xs text-text-muted mb-1">Overall</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-neon-cyan shadow-glow-cyan transition-all duration-1000" 
                    style={{ width: `${(syllabus.filter(n => n.checked).length / (syllabus.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-xs text-text-muted uppercase font-bold mb-2">Mastery Level</p>
                <p className="text-sm">You are currently a <span className="text-neon-cyan font-bold">Novice</span> in {currentExam}. Complete more modules to level up!</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 neon-border-green">
            <h3 className="font-syne text-lg mb-4 flex items-center gap-2">
              <Clock size={18} className="text-neon-green" /> ESTIMATED TIME
            </h3>
            <div className="text-center py-4">
              <p className="text-4xl font-syne text-neon-green">
                {syllabus.reduce((acc, node) => acc + (node.estimatedHours || 0), 0)}h
              </p>
              <p className="text-xs text-text-muted uppercase font-bold mt-2">Total Study Required</p>
            </div>
          </div>

          <div className="glass-card p-6 neon-border-purple">
            <h3 className="font-syne text-lg mb-4 flex items-center gap-2">
              <Zap size={18} className="text-neon-purple" /> DIFFICULTY
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Easy', color: 'bg-neon-green', count: syllabus.filter(n => n.difficulty === 'Easy').length },
                { label: 'Medium', color: 'bg-neon-cyan', count: syllabus.filter(n => n.difficulty === 'Medium').length },
                { label: 'Hard', color: 'bg-neon-pink', count: syllabus.filter(n => n.difficulty === 'Hard').length }
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-text-muted uppercase">{item.label}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full", item.color)} 
                      style={{ width: `${(item.count / (syllabus.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
