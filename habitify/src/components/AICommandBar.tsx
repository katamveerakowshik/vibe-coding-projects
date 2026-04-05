import React, { useState, useEffect } from 'react';
import { Search, Sparkles, X, ChevronDown, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../services/geminiService';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AICommandBarProps {
  onCommand?: (cmd: string, args: string) => Promise<void>;
}

export const AICommandBar: React.FC<AICommandBarProps> = ({ onCommand }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('ai-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse(null);
    try {
      const lowerQuery = query.toLowerCase();
      
      if (onCommand) {
        if (lowerQuery.startsWith('/syllabus') || lowerQuery.includes('generate syllabus for')) {
          const exam = query.split(' ').pop() || 'GATE CS';
          await onCommand('syllabus', exam);
          setResponse(`Initializing trajectory for ${exam}...`);
          setQuery('');
          return;
        }
        if (lowerQuery.startsWith('/plan') || lowerQuery.includes('plan my day for')) {
          const goal = query.replace('/plan', '').replace('plan my day for', '').trim() || 'Study';
          await onCommand('plan', goal);
          setResponse(`Architecting study plan for ${goal}...`);
          setQuery('');
          return;
        }
        if (lowerQuery.startsWith('/habit') || lowerQuery.includes('add habit')) {
          const habit = query.replace('/habit', '').replace('add habit', '').trim() || 'New Habit';
          await onCommand('habit', habit);
          setResponse(`Protocol established: ${habit}`);
          setQuery('');
          return;
        }
      }

      const stream = geminiService.generateContentStream(query, "You are a world-class performance architect. Provide deep, actionable, and highly structured insights.");
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setResponse(fullText);
      }
    } catch (err) {
      setResponse("Connection interrupted. Please verify your credentials in settings.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full z-50 p-4 flex flex-col items-center pointer-events-none">
      <div className="w-full max-w-2xl pointer-events-auto">
        <form 
          onSubmit={handleSubmit}
          className={cn(
            "glass-card flex items-center px-6 py-3 transition-all duration-500 border border-white/5",
            isFocused ? 'neon-border-cyan shadow-glow-cyan scale-[1.01] bg-white/5' : 'bg-white/2'
          )}
        >
          <div className="relative">
            <Search className={cn("transition-all duration-300", isFocused ? "text-neon-cyan scale-110" : "text-text-muted")} size={20} />
            {isFocused && <motion.div layoutId="search-glow" className="absolute inset-0 bg-neon-cyan/20 blur-lg rounded-full" />}
          </div>
          <input
            id="ai-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search or execute protocol..."
            className="bg-transparent border-none outline-none flex-1 text-text-primary placeholder:text-text-muted/20 py-2 px-4 text-lg font-syne tracking-tight"
          />
          <div className="flex items-center gap-3">
            {!query && (
              <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-white/5 rounded border border-white/5 text-[10px] text-text-muted font-mono">
                <Command size={10} /> K
              </div>
            )}
            <button 
              type="submit"
              disabled={isLoading}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-500 disabled:opacity-50",
                query.trim() ? "bg-neon-cyan text-bg-void shadow-glow-cyan scale-105" : "bg-white/5 text-text-muted"
              )}
            >
              <Sparkles size={18} className={cn(isLoading && "animate-spin")} />
            </button>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {(isLoading || response) && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="mt-3 glass-card p-8 neon-border-cyan max-h-[70vh] overflow-y-auto relative group shadow-2xl backdrop-blur-xl"
            >
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button 
                  onClick={() => {
                    if (response) {
                      navigator.clipboard.writeText(response);
                      alert("Protocol copied to clipboard.");
                    }
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all text-text-muted hover:text-neon-cyan"
                  title="Copy to clipboard"
                >
                  <Command size={18} />
                </button>
                <button 
                  onClick={() => setResponse(null)} 
                  className="p-2 hover:bg-white/10 rounded-lg transition-all text-text-muted hover:text-neon-pink"
                >
                  <X size={18} />
                </button>
              </div>
              
              {isLoading ? (
                <div className="space-y-4 pt-2">
                  <div className="h-2 bg-white/10 rounded-full w-1/3 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-2 bg-white/5 rounded-full w-full animate-pulse" />
                    <div className="h-2 bg-white/5 rounded-full w-5/6 animate-pulse" />
                    <div className="h-2 bg-white/5 rounded-full w-4/6 animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="markdown-body prose prose-invert max-w-none">
                  <Markdown>{response}</Markdown>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
