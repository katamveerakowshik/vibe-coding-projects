import React, { useState } from 'react';
import { Note, UrgencyLevel, NoteType } from '../types';
import { Play, Pause, AlertCircle, Clock, Trash2, Mic, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import WaveVisualizer from './WaveVisualizer';

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onPlayAudio?: (url: string) => void;
  onClick: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onPlayAudio, onClick }) => {
  const [hover, setHover] = useState(false);

  const urgencyStyles = {
    [UrgencyLevel.LOW]: 'border-white/5 hover:border-white/20',
    [UrgencyLevel.MEDIUM]: 'border-[#D946EF]/20 hover:border-[#D946EF]/50',
    [UrgencyLevel.HIGH]: 'border-[#D946EF]/60 hover:border-[#D946EF] shadow-[0_0_10px_rgba(217,70,239,0.1)]',
    [UrgencyLevel.CRITICAL]: 'border-red-500/60 hover:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  return (
    <div 
      className={`glass-panel rounded-2xl p-4 transition-all duration-300 transform hover:-translate-y-1 ${urgencyStyles[note.urgency]} flex flex-col gap-3 group relative overflow-hidden cursor-pointer h-auto break-inside-avoid mb-6`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      {/* Critical Pulse Overlay */}
      {note.urgency === UrgencyLevel.CRITICAL && (
         <div className="absolute top-0 right-0 p-2 z-20">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
         </div>
      )}

      {/* Header Image */}
      {note.coverImageUrl && (
        <div className="w-full h-32 rounded-lg overflow-hidden mb-2 relative z-10 bg-black/50">
           <img src={note.coverImageUrl} alt="Cover" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
           {note.type === NoteType.VIDEO && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Play className="text-white fill-white" /></div>}
        </div>
      )}

      {/* Meta */}
      <div className="flex justify-between items-start z-10">
        <h3 className="font-bold text-lg leading-tight text-white group-hover:text-[#D946EF] transition-colors">{note.title || "Untitled Note"}</h3>
      </div>

      {/* Content Preview (Strip HTML for card view) */}
      <div className="text-sm text-white/60 line-clamp-3 z-10 min-h-[20px] font-light">
        {stripHtml(note.content) || (note.type === NoteType.AUDIO ? "Audio Recording" : "No content")}
      </div>

      {/* Audio Player Button on Card */}
      {note.audioUrl && (
        <div 
          onClick={(e) => { e.stopPropagation(); onPlayAudio && onPlayAudio(note.audioUrl!); }}
          className="mt-2 bg-[#D946EF]/10 border border-[#D946EF]/20 rounded-lg p-3 flex items-center gap-3 hover:bg-[#D946EF]/20 transition-colors group/audio"
        >
           <div className="w-8 h-8 rounded-full bg-[#D946EF] flex items-center justify-center text-black">
             <Play size={14} fill="black" className="ml-0.5"/>
           </div>
           <div className="flex flex-col">
             <span className="text-xs font-bold text-[#D946EF]">Voice Note</span>
             <span className="text-[10px] text-white/50">Click to listen</span>
           </div>
           <WaveVisualizer isPlaying={false} urgency={note.urgency} className="h-6 w-16 opacity-50" />
        </div>
      )}

      {/* Footer info */}
      <div className="flex justify-between items-center mt-2 z-10 pt-2 border-t border-white/5">
        <div className="flex gap-2 text-[10px] text-white/40 uppercase tracking-wider">
           <span>{note.category}</span>
           {note.reminderTime && (
             <span className="flex items-center gap-1 text-[#D946EF]">
               <Clock size={10} /> {new Date(note.reminderTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
             </span>
           )}
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
          className="text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default NoteCard;
