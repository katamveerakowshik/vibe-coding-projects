import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Target, 
  Lightbulb, 
  Brain, 
  Clock, 
  BookOpen, 
  Layers, 
  Search, 
  PenTool,
  Network
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StudyMethod {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
  scenarios: string;
  tips: string;
}

const studyMethods: StudyMethod[] = [
  {
    id: 'pomodoro',
    name: 'Pomodoro Technique',
    icon: Clock,
    color: 'text-neon-pink',
    description: 'A time management method that uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks.',
    scenarios: 'Best for maintaining focus during long study sessions and preventing burnout.',
    tips: 'During the 5-minute break, step away from your screen. Stretch, hydrate, or take a quick walk.'
  },
  {
    id: 'active_recall',
    name: 'Active Recall',
    icon: Brain,
    color: 'text-neon-green',
    description: 'Testing yourself on the material you are learning, rather than just re-reading it. It forces your brain to retrieve information.',
    scenarios: 'Essential for memorizing facts, formulas, and complex concepts for competitive exams.',
    tips: 'Close your book and try to write down everything you remember about a topic from scratch.'
  },
  {
    id: 'spaced_repetition',
    name: 'Spaced Repetition',
    icon: Layers,
    color: 'text-neon-purple',
    description: 'Reviewing information at increasing intervals (e.g., 1 day, 3 days, 7 days, 14 days) to move it from short-term to long-term memory.',
    scenarios: 'Perfect for vocabulary, historical dates, or any large volume of information.',
    tips: 'Use flashcards or a digital tool like Anki to automate the scheduling of your reviews.'
  },
  {
    id: 'feynman',
    name: 'Feynman Technique',
    icon: Lightbulb,
    color: 'text-neon-orange',
    description: 'Explaining a concept in simple terms as if you were teaching it to a child. If you can\'t explain it simply, you don\'t understand it well enough.',
    scenarios: 'Best for mastering difficult theoretical concepts or complex processes.',
    tips: 'Identify the gaps in your explanation and go back to the source material to fill them.'
  },
  {
    id: 'cornell',
    name: 'Cornell Notes',
    icon: PenTool,
    color: 'text-neon-cyan',
    description: 'A systematic format for condensing and organizing notes. Divide your page into three sections: Cues, Notes, and Summary.',
    scenarios: 'Ideal for taking structured notes during lectures or while reading textbooks.',
    tips: 'Use the "Cues" section to write questions that the notes answer, then use them for active recall.'
  },
  {
    id: 'mind_mapping',
    name: 'Mind Mapping',
    icon: Network,
    color: 'text-neon-green',
    description: 'A visual way to organize information, showing the relationships between different concepts using branches and keywords.',
    scenarios: 'Great for brainstorming, planning essays, or visualizing the structure of a whole subject.',
    tips: 'Use different colors for different branches to help your brain categorize information visually.'
  },
  {
    id: 'interleaving',
    name: 'Interleaving',
    icon: Target,
    color: 'text-neon-purple',
    description: 'Mixing different topics or types of problems within a single study session, rather than focusing on just one thing for a long time.',
    scenarios: 'Highly effective for math and science subjects where you need to choose the right formula for a problem.',
    tips: 'Don\'t solve 20 problems of the same type. Mix 5 types of problems to force your brain to distinguish between them.'
  },
  {
    id: 'retrieval_practice',
    name: 'Retrieval Practice',
    icon: Search,
    color: 'text-neon-cyan',
    description: 'The act of recalling information from memory. It is a powerful way to strengthen memory and understanding.',
    scenarios: 'Use this at the end of every study session to consolidate what you\'ve learned.',
    tips: 'Before starting a new topic, spend 5 minutes recalling what you learned in the previous session.'
  },
  {
    id: 'elaborative_interrogation',
    name: 'Elaborative Interrogation',
    icon: BookOpen,
    color: 'text-neon-orange',
    description: 'Asking "why" and "how" questions about the facts you are learning to connect them to your existing knowledge.',
    scenarios: 'Best for deep understanding of causal relationships and logical sequences.',
    tips: 'Try to explain why a particular fact is true based on other things you already know.'
  }
];

export const StudyMethods: React.FC<{ onApply: (method: string) => void }> = ({ onApply }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-syne flex items-center gap-3">
          <Zap className="text-neon-cyan" /> STUDY METHODS
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {studyMethods.map((method) => (
          <div 
            key={method.id}
            className={cn(
              "glass-card transition-all duration-500 overflow-hidden",
              expandedId === method.id ? "neon-border-cyan ring-1 ring-neon-cyan/20" : "border-white/5 hover:border-white/20"
            )}
          >
            <button 
              onClick={() => setExpandedId(expandedId === method.id ? null : method.id)}
              className="w-full flex items-center gap-4 p-6 text-left"
            >
              <div className={cn("p-3 rounded-xl bg-white/5", method.color)}>
                <method.icon size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-syne font-bold">{method.name}</h3>
                <p className="text-xs text-text-muted line-clamp-1">{method.description}</p>
              </div>
              {expandedId === method.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            <AnimatePresence>
              {expandedId === method.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6 space-y-4"
                >
                  <div className="h-px bg-white/5" />
                  
                  <div className="space-y-2">
                    <p className="text-sm text-text-primary leading-relaxed">
                      {method.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl border-l-2 border-neon-cyan">
                      <h4 className="text-[10px] font-bold text-neon-cyan uppercase mb-1">When to use</h4>
                      <p className="text-xs text-text-muted">{method.scenarios}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border-l-2 border-neon-green">
                      <h4 className="text-[10px] font-bold text-neon-green uppercase mb-1">Pro Tip</h4>
                      <p className="text-xs text-text-muted">{method.tips}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => onApply(method.name)}
                    className="w-full btn-neon btn-neon-green py-3 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Zap size={14} /> APPLY TO MY PLAN
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};
