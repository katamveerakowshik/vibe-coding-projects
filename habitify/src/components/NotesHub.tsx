import React, { useState, useEffect } from 'react';
import { Search, Plus, Star, Tag, Clock, FileText, Trash2, X, Maximize2, Save, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactQuill from 'react-quill-new';
import { Note } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NotesHubProps {
  notes: Note[];
  onAddNote: () => string;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onToggleStar: (id: string) => void;
}

export const NotesHub: React.FC<NotesHubProps> = ({ notes, onAddNote, onUpdateNote, onDeleteNote, onToggleStar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'starred'>('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'starred' && note.isStarred);
    return matchesSearch && matchesFilter;
  });

  const handleAddNote = () => {
    const newId = onAddNote();
    setSelectedNoteId(newId);
  };

  const handleUpdate = (updates: Partial<Note>) => {
    if (selectedNoteId) {
      onUpdateNote(selectedNoteId, updates);
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'clean']
    ],
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-syne">NOTES HUB</h2>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="glass-card flex items-center px-4 py-2 flex-1 md:w-64">
            <Search size={18} className="text-text-muted mr-2" />
            <input 
              type="text" 
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
          <button 
            onClick={handleAddNote}
            className="bg-neon-green text-bg-void px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-glow-green"
          >
            <Plus size={18} /> NEW NOTE
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={() => setFilter('all')}
          className={cn(
            "px-4 py-2 rounded-full text-xs font-bold transition-all",
            filter === 'all' ? "bg-neon-cyan text-bg-void" : "bg-white/5 text-text-muted hover:text-white"
          )}
        >
          ALL NOTES
        </button>
        <button 
          onClick={() => setFilter('starred')}
          className={cn(
            "px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2",
            filter === 'starred' ? "bg-neon-purple text-bg-void" : "bg-white/5 text-text-muted hover:text-white"
          )}
        >
          <Star size={12} fill={filter === 'starred' ? 'currentColor' : 'none'} /> STARRED
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              layoutId={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "glass-card p-6 neon-border-cyan group relative hover:scale-[1.02] transition-all cursor-pointer",
                selectedNoteId === note.id && "neon-border-active"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-neon-cyan/10 rounded-lg text-neon-cyan">
                  <FileText size={20} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleStar(note.id); }}
                    className={cn("p-2 rounded-lg transition-all", note.isStarred ? "text-gold" : "text-text-muted hover:text-gold")}
                  >
                    <Star size={18} fill={note.isStarred ? 'currentColor' : 'none'} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                    className="p-2 text-text-muted hover:text-neon-pink transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-syne mb-2 group-hover:text-neon-cyan transition-all">{note.title}</h3>
              <div 
                className="text-sm text-text-muted line-clamp-3 mb-4 prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />

              <div className="flex flex-wrap gap-2 mb-4">
                {note.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full text-text-muted flex items-center gap-1">
                    <Tag size={8} /> {tag}
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                  <Clock size={10} /> {new Date(note.modifiedAt).toLocaleDateString()}
                </div>
                <div className="text-neon-cyan text-xs font-bold flex items-center gap-1">
                  EDIT <Maximize2 size={12} />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredNotes.length === 0 && (
          <div className="col-span-full py-20 text-center text-text-muted">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <p>No notes found. Create your first one!</p>
          </div>
        )}
      </div>

      {/* Expanded Editor Overlay */}
      <AnimatePresence>
        {selectedNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-bg-void/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-8"
          >
            <motion.div
              layoutId={selectedNote.id}
              className="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden neon-border-active"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex-1 mr-4">
                  <input 
                    type="text"
                    value={selectedNote.title}
                    onChange={(e) => handleUpdate({ title: e.target.value })}
                    className="bg-transparent border-none outline-none text-2xl font-syne w-full text-white placeholder:text-white/20"
                    placeholder="Note Title..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    {isSaving ? (
                      <span className="flex items-center gap-1 text-neon-cyan">
                        <Check size={14} /> SAVED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> AUTO-SAVING
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => setSelectedNoteId(null)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all text-text-muted hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <ReactQuill 
                  theme="snow"
                  value={selectedNote.content}
                  onChange={(content) => handleUpdate({ content })}
                  modules={modules}
                  placeholder="Start writing your thoughts..."
                />
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap gap-2">
                  {selectedNote.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-neon-cyan/10 text-neon-cyan rounded-full text-xs font-bold flex items-center gap-2">
                      <Tag size={12} /> {tag}
                    </span>
                  ))}
                  <button className="px-3 py-1 bg-white/5 text-text-muted rounded-full text-xs font-bold hover:text-white transition-all">
                    + ADD TAG
                  </button>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => onToggleStar(selectedNote.id)}
                    className={cn(
                      "btn-neon px-4 py-2 text-sm",
                      selectedNote.isStarred ? "bg-gold text-bg-void" : "bg-white/5 text-text-muted"
                    )}
                  >
                    <Star size={16} fill={selectedNote.isStarred ? 'currentColor' : 'none'} /> 
                    {selectedNote.isStarred ? 'STARRED' : 'STAR'}
                  </button>
                  <button 
                    onClick={() => setSelectedNoteId(null)}
                    className="btn-neon btn-neon-cyan px-8 py-2 text-sm"
                  >
                    DONE
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
