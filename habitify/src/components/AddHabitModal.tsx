import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Calendar, Clock, Tag, Palette, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { Habit } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions' | 'streak' | 'bestStreak'>, manualDates: string[]) => void;
}

const PRESET_COLORS = [
  '#00ff88', // Neon Green
  '#00d4ff', // Neon Cyan
  '#a855f7', // Neon Purple
  '#ff006e', // Neon Pink
  '#ff6b35', // Neon Orange
  '#fbbf24', // Amber
];

const CATEGORIES = ['Study', 'Health', 'Mindset', 'Custom'];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Study');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [tags, setTags] = useState('');
  const [frequency, setFrequency] = useState<'Daily' | 'Weekdays' | 'Custom'>('Daily');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [manualDates, setManualDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name,
      category,
      color,
      tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      targetDurationHours: hours,
      targetDurationMinutes: minutes,
      frequency,
      reminderTime,
    }, manualDates);

    // Reset form
    setName('');
    setCategory('Study');
    setColor(PRESET_COLORS[0]);
    setHours(0);
    setMinutes(30);
    setTags('');
    setManualDates([]);
    onClose();
  };

  const toggleDate = (dateStr: string) => {
    setManualDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr) 
        : [...prev, dateStr]
    );
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for first week
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`pad-${i}`} className="h-8 w-8" />);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      const isSelected = manualDates.includes(dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <button
          key={d}
          type="button"
          onClick={() => toggleDate(dateStr)}
          className={cn(
            "h-8 w-8 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center",
            isSelected ? "bg-neon-cyan text-bg-void shadow-glow-cyan" : "hover:bg-white/10 text-text-muted",
            isToday && !isSelected && "border border-neon-cyan/50 text-neon-cyan"
          )}
        >
          {d}
        </button>
      );
    }

    return days;
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-void/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl glass-card p-8 neon-border-cyan overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-syne flex items-center gap-3">
                <Plus className="text-neon-cyan" /> NEW HABIT MISSION
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Basic Info */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-2">Habit Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Deep Work, Morning Run..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:neon-border-cyan outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-2">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                          category === cat ? "bg-neon-cyan text-bg-void shadow-glow-cyan" : "bg-white/5 hover:bg-white/10 text-text-muted"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-2 flex items-center gap-2">
                    <Palette size={14} /> Color Theme
                  </label>
                  <div className="flex gap-3">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all relative",
                          color === c ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-bg-void" : "hover:scale-110"
                        )}
                        style={{ backgroundColor: c }}
                      >
                        {color === c && <Check size={16} className="absolute inset-0 m-auto text-bg-void" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-2 flex items-center gap-2">
                      <Clock size={14} /> Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={hours}
                      onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:neon-border-cyan outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-2 flex items-center gap-2">
                      <Clock size={14} /> Minutes
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={minutes}
                      onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:neon-border-cyan outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-2 flex items-center gap-2">
                    <Tag size={14} /> Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="focus, health, morning..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:neon-border-cyan outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-2 flex items-center gap-2">
                      <Clock size={14} /> Reminder
                    </label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:neon-border-cyan outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-2">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:neon-border-cyan outline-none transition-all text-xs font-bold"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekdays">Weekdays</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Calendar & Manual Entry */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-4 flex items-center gap-2">
                    <Calendar size={14} /> Manual Date Entry
                  </label>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded">
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                      <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={`${d}-${i}`} className="text-[8px] font-bold text-text-muted">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {renderCalendar()}
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted mt-2 italic">
                    * Select dates to mark as already completed
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full btn-neon btn-neon-cyan py-4 text-lg font-syne flex items-center justify-center gap-3"
                  >
                    <Sparkles size={20} /> INITIALIZE MISSION
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
