import React from 'react';
import { motion } from 'motion/react';
import { Book, ExternalLink, Star, Zap, BookOpen, Search, Brain, Clock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Resources: React.FC = () => {
  const books = [
    { title: 'Introduction to Algorithms', author: 'CLRS', rating: 4.9, tags: ['Algorithms', 'Core'] },
    { title: 'Operating System Concepts', author: 'Silberschatz', rating: 4.7, tags: ['OS', 'Core'] },
    { title: 'Database System Concepts', author: 'Korth', rating: 4.8, tags: ['DBMS', 'Core'] },
    { title: 'Computer Networking', author: 'Kurose', rating: 4.6, tags: ['Networking', 'Core'] },
  ];

  const methods = [
    { name: 'Pomodoro', desc: '25m study + 5m break. Keeps focus sharp.', icon: Zap, color: 'text-neon-cyan' },
    { name: 'Active Recall', desc: 'Test yourself before you study. High retention.', icon: Brain, color: 'text-neon-green' },
    { name: 'Spaced Repetition', desc: 'Review at increasing intervals.', icon: Clock, color: 'text-neon-purple' },
    { name: 'Feynman Technique', desc: 'Explain it to a child to master it.', icon: BookOpen, color: 'text-neon-orange' },
  ];

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-syne flex items-center gap-3">
            <Book className="text-neon-green" /> RECOMMENDED BOOKS
          </h2>
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <Search size={16} className="text-text-muted" />
            <input type="text" placeholder="Search resources..." className="bg-transparent border-none outline-none text-xs" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.map((book, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="glass-card p-6 neon-border-green group"
            >
              <div className="aspect-[3/4] bg-gradient-to-br from-bg-elevated to-bg-void rounded-xl mb-4 flex items-center justify-center border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-neon-green/5 opacity-0 group-hover:opacity-100 transition-all" />
                <Book size={48} className="text-text-muted opacity-20" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[10px] font-bold text-neon-green uppercase mb-1">Top Rated</p>
                  <p className="text-sm font-bold truncate">{book.title}</p>
                </div>
              </div>
              <h3 className="font-syne font-bold mb-1">{book.title}</h3>
              <p className="text-xs text-text-muted mb-3">by {book.author}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-gold text-xs font-bold">
                  <Star size={12} fill="currentColor" /> {book.rating}
                </div>
                <button className="text-neon-green text-xs font-bold flex items-center gap-1 hover:underline">
                  GET <ExternalLink size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-syne flex items-center gap-3">
          <Zap className="text-neon-cyan" /> STUDY METHODS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {methods.map((method, i) => (
            <motion.div
              key={i}
              className="glass-card p-6 neon-border-cyan flex gap-6 items-start"
            >
              <div className={cn("p-4 rounded-2xl bg-white/5", method.color)}>
                <method.icon size={32} />
              </div>
              <div>
                <h3 className="text-xl font-syne mb-2">{method.name}</h3>
                <p className="text-sm text-text-muted mb-4">{method.desc}</p>
                <button className="text-neon-cyan text-xs font-bold hover:underline">LEARN TECHNIQUE →</button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
