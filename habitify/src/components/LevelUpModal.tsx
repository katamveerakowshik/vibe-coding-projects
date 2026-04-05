import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Zap } from 'lucide-react';

interface LevelUpModalProps {
  level: number;
  title: string;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ level, title, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-bg-void/90 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-card p-12 max-w-lg w-full neon-border-green text-center space-y-8 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-neon-green/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse" />

        <div className="relative">
          <motion.div
            initial={{ rotate: -10, scale: 0.5 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="w-32 h-32 bg-neon-green rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow-green"
          >
            <Trophy size={64} className="text-bg-void" fill="currentColor" />
          </motion.div>

          <h2 className="text-5xl font-syne font-bold mb-2 tracking-tighter">LEVEL UP!</h2>
          <p className="text-neon-green font-bold text-xl uppercase tracking-widest mb-6">New Rank: {title}</p>
          
          <div className="flex justify-center items-center gap-4 mb-8">
            <div className="h-px w-12 bg-white/10" />
            <div className="text-6xl font-syne font-black text-white">
              {level}
            </div>
            <div className="h-px w-12 bg-white/10" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 justify-center text-text-muted">
              <Star size={18} className="text-gold" fill="currentColor" />
              <span>Unlocked New Study Techniques</span>
            </div>
            <div className="flex items-center gap-3 justify-center text-text-muted">
              <Zap size={18} className="text-neon-cyan" fill="currentColor" />
              <span>Increased Focus Capacity</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full btn-neon btn-neon-green py-4 text-lg font-bold"
        >
          CONTINUE MISSION
        </button>
      </motion.div>
    </motion.div>
  );
};
