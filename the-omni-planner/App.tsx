import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip as RechartsTooltip } from 'recharts';
import { AppRole, Note, UserProfile, NoteColor } from './types';
import { StorageService } from './services/storage';
import { GeminiService } from './services/geminiService';
import { 
  LogoIcon, FluxNodeIcon, TimePrismIcon, CortexIcon, 
  DashboardIcon, ArcadeIcon, ROLE_CONFIG, COLOR_MAP,
  ExpandIcon, ShrinkIcon, EditIcon, UndoIcon, RedoIcon,
  GamePadIcon, BrainIcon
} from './constants';

// --- Utility Hooks ---
function useUndoRedo<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState(0);

  const setState = (newState: T) => {
    const next = history.slice(0, index + 1);
    next.push(newState);
    setHistory(next);
    setIndex(next.length - 1);
  };

  const undo = () => {
    if (index > 0) setIndex(index - 1);
  };

  const redo = () => {
    if (index < history.length - 1) setIndex(index + 1);
  };

  const setInitialState = (state: T) => {
      setHistory([state]);
      setIndex(0);
  }

  return { 
    state: history[index], 
    setState, 
    undo, 
    redo, 
    canUndo: index > 0, 
    canRedo: index < history.length - 1,
    setInitialState
  };
}

// --- Utility Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }: any) => {
  const baseStyle = "px-4 py-2 rounded-lg font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30",
    secondary: "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20"
  };
  
  return (
    <button className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all scale-100">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- New Features ---

const GeometricAvatar = ({ uid, className = "w-10 h-10" }: { uid: string, className?: string }) => {
  // Deterministic random generator based on UID
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const seed = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = Math.floor(seededRandom(seed) * 360);
  const saturation = 70 + Math.floor(seededRandom(seed + 1) * 30);
  const lightness = 40 + Math.floor(seededRandom(seed + 2) * 20);
  
  const shapeType = Math.floor(seededRandom(seed + 3) * 3); // 0: circle, 1: rect, 2: triangle

  return (
    <div className={`${className} overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 shadow-inner flex items-center justify-center relative`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect width="100" height="100" fill={`hsl(${hue}, ${saturation}%, ${lightness}%)`} />
        {shapeType === 0 && <circle cx="50" cy="50" r="30" fill={`hsl(${(hue + 180) % 360}, ${saturation}%, ${lightness + 20}%)`} opacity="0.6" />}
        {shapeType === 1 && <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" fill={`hsl(${(hue + 120) % 360}, ${saturation}%, ${lightness + 20}%)`} opacity="0.6" />}
        {shapeType === 2 && <path d="M50 20 L80 80 L20 80 Z" fill={`hsl(${(hue + 240) % 360}, ${saturation}%, ${lightness + 20}%)`} opacity="0.6" />}
        <circle cx="20" cy="20" r="10" fill="white" opacity="0.2" />
        <circle cx="80" cy="80" r="15" fill="black" opacity="0.1" />
      </svg>
    </div>
  );
};

const DayCompletionRing = ({ notes }: { notes: Note[] }) => {
  const tasks = notes.filter(n => n.type === 'checklist' || n.type === 'text');
  
  // Calculate completion percentage
  let totalItems = 0;
  let completedItems = 0;

  tasks.forEach(note => {
    if (note.type === 'checklist' && note.checklistItems) {
      totalItems += note.checklistItems.length;
      completedItems += note.checklistItems.filter(i => i.done).length;
    }
  });

  const percentage = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
       {/* Glow Effect */}
       <div className={`absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 transition-all duration-500 ${percentage === 100 ? 'scale-125 opacity-40' : 'scale-100'}`}></div>
       
       <svg className="w-full h-full transform -rotate-90">
         <circle
           className="text-slate-200 dark:text-slate-800"
           strokeWidth="8"
           stroke="currentColor"
           fill="transparent"
           r={radius}
           cx="64"
           cy="64"
         />
         <circle
           className="text-indigo-500 transition-all duration-1000 ease-out"
           strokeWidth="8"
           strokeDasharray={circumference}
           strokeDashoffset={strokeDashoffset}
           strokeLinecap="round"
           stroke="currentColor"
           fill="transparent"
           r={radius}
           cx="64"
           cy="64"
         />
       </svg>
       <div className="absolute flex flex-col items-center">
         <span className="text-2xl font-black text-slate-900 dark:text-white">{percentage}%</span>
         <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Daily</span>
       </div>
    </div>
  );
};

// --- Sub-Features ---

interface NoteCardProps {
  note: Note;
  onUpdate: (n: Note) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onExpand: (note: Note) => void;
  onTagClick?: (tag: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onUpdate, onDelete, onPin, onExpand, onTagClick }) => {
  const [localTitle, setLocalTitle] = useState(note.title);
  const [localContent, setLocalContent] = useState(note.content);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Sync if note changes externally (e.g. expansion update)
  useEffect(() => {
    setLocalTitle(note.title);
    setLocalContent(note.content);
  }, [note]);

  const handleBlur = () => {
    if (localTitle !== note.title || localContent !== note.content) {
      onUpdate({ ...note, title: localTitle, content: localContent });
    }
    setIsEditing(false);
  };

  const handleGenerateChecklist = async () => {
    if (!note.title) return;
    const items = await GeminiService.generateChecklist(note.title);
    if (items.length > 0) {
      onUpdate({ ...note, type: 'checklist', checklistItems: items.map(i => ({ ...i, id: Math.random().toString(36) })) });
    }
  };

  return (
    <div 
      className={`masonry-item relative group rounded-2xl p-5 transition-all duration-300 ${COLOR_MAP[note.color]} ${note.isPinned ? 'ring-2 ring-indigo-500 shadow-indigo-500/20' : 'shadow-sm hover:shadow-xl hover:-translate-y-1'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start mb-3">
        {isEditing ? (
             <input 
             value={localTitle} 
             onChange={(e) => setLocalTitle(e.target.value)}
             onBlur={handleBlur}
             className="bg-transparent font-bold text-lg w-full outline-none placeholder-slate-400 text-slate-900 dark:text-slate-100"
             placeholder="Title"
             autoFocus
           />
        ) : (
            <h3 onClick={() => setIsEditing(true)} className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight cursor-text">{localTitle || "Untitled"}</h3>
        )}
        
        <button 
          onClick={() => onPin(note.id)} 
          className={`transition-colors ${note.isPinned ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600 hover:text-indigo-500'} ${!isHovered && !note.isPinned ? 'opacity-0' : 'opacity-100'}`}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M16 9V4l1 0c0.55 0 1-0.45 1-1s-0.45-1-1-1H7C6.45 2 6 2.45 6 3s0.45 1 1 1l1 0v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" /></svg>
        </button>
      </div>

      <div className="mb-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
        {note.type === 'checklist' && note.checklistItems ? (
          <div className="space-y-2">
            {note.checklistItems.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={item.done} 
                  onChange={() => {
                     const newItems = [...note.checklistItems!];
                     newItems[idx].done = !newItems[idx].done;
                     onUpdate({...note, checklistItems: newItems});
                  }}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                />
                <span className={`transition-all ${item.done ? "line-through text-slate-400" : ""}`}>{item.text}</span>
              </div>
            ))}
          </div>
        ) : (
            isEditing ? (
                <textarea 
                  value={localContent} 
                  onChange={(e) => setLocalContent(e.target.value)}
                  onBlur={handleBlur}
                  className="w-full bg-transparent resize-none outline-none min-h-[100px]"
                  placeholder="Start typing..."
                />
              ) : (
                <div onClick={() => setIsEditing(true)} className="cursor-text min-h-[60px]">
                  {localContent || <span className="text-slate-400 italic">Empty note...</span>}
                </div>
              )
        )}
      </div>

      {/* Tags Display */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {note.tags.map(tag => (
            <span 
              key={tag}
              onClick={(e) => { e.stopPropagation(); onTagClick && onTagClick(tag); }}
              className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded text-xs font-semibold text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-300 transition-colors cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className={`flex justify-between items-center pt-3 border-t border-black/5 dark:border-white/5 transition-opacity duration-200 ${isHovered || isEditing ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex gap-2">
           <button onClick={() => setIsEditing(!isEditing)} className="text-slate-400 hover:text-indigo-500 transition-colors" title="Edit">
                <EditIcon className="w-4 h-4" />
           </button>
           <button onClick={() => onExpand(note)} className="text-slate-400 hover:text-indigo-500 transition-colors" title="Expand">
                <ExpandIcon className="w-4 h-4" />
           </button>
           {note.type === 'text' && (
             <button onClick={handleGenerateChecklist} title="AI Breakdown" className="text-purple-500 hover:text-purple-600">
                <FluxNodeIcon className="w-4 h-4" />
             </button>
           )}
        </div>
        
        <div className="flex gap-2">
          {Object.values(NoteColor).slice(0, 5).map(c => (
            <button 
              key={c} 
              onClick={() => onUpdate({ ...note, color: c })}
              className={`w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 hover:scale-125 transition-transform ${COLOR_MAP[c].split(' ')[0]}`} 
            />
          ))}
          <button onClick={() => onDelete(note.id)} className="ml-2 text-slate-400 hover:text-red-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Expanded Note Modal ---
const ExpandedNoteModal = ({ note, isOpen, onClose, onUpdate }: { note: Note | null, isOpen: boolean, onClose: () => void, onUpdate: (n: Note) => void }) => {
    // We lift state management into the modal to support Undo/Redo cleanly for the session
    const { state: currentNote, setState: setNoteState, undo, redo, canUndo, canRedo } = useUndoRedo<Note | null>(note);
    const [tagInput, setTagInput] = useState("");

    // Sync when prop note changes (e.g. opening)
    useEffect(() => {
        if (note) setNoteState(note);
    }, [note]);

    if (!isOpen || !currentNote) return null;

    const handleSaveAndClose = () => {
        onUpdate(currentNote);
        onClose();
    };

    const handleAddTag = () => {
      if (tagInput.trim() && !currentNote.tags.includes(tagInput.trim())) {
          const newTags = [...currentNote.tags, tagInput.trim()];
          setNoteState({ ...currentNote, tags: newTags });
          setTagInput("");
      }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const newTags = currentNote.tags.filter(t => t !== tagToRemove);
        setNoteState({ ...currentNote, tags: newTags });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`w-full max-w-3xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all ${COLOR_MAP[currentNote.color]}`}>
                
                {/* Toolbar */}
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                    <div className="flex gap-2">
                        <button onClick={undo} disabled={!canUndo} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 transition-colors" title="Undo">
                            <UndoIcon />
                        </button>
                        <button onClick={redo} disabled={!canRedo} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 transition-colors" title="Redo">
                            <RedoIcon />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={handleSaveAndClose} className="hover:bg-black/5 dark:hover:bg-white/5">
                            <ShrinkIcon className="w-5 h-5 mr-2" /> Minimize
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <input 
                        value={currentNote.title} 
                        onChange={(e) => setNoteState({ ...currentNote, title: e.target.value })}
                        className="bg-transparent font-black text-4xl w-full outline-none placeholder-slate-400 text-slate-900 dark:text-white mb-6"
                        placeholder="Title"
                    />

                    {/* Tag Management */}
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                      {currentNote.tags.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-black/5 dark:bg-white/10 rounded-full text-sm font-medium flex items-center gap-2 text-slate-700 dark:text-slate-300">
                              #{tag}
                              <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 rounded-full w-4 h-4 flex items-center justify-center">×</button>
                          </span>
                      ))}
                      <input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                          placeholder="+ Tag"
                          className="bg-transparent text-sm outline-none placeholder-slate-400 dark:placeholder-slate-500 min-w-[60px] text-slate-700 dark:text-slate-300"
                      />
                    </div>
                    
                    {currentNote.type === 'checklist' && currentNote.checklistItems ? (
                         <div className="space-y-4">
                            {currentNote.checklistItems.map((item, idx) => (
                            <div key={item.id} className="flex items-center gap-3">
                                <input 
                                type="checkbox" 
                                checked={item.done} 
                                onChange={() => {
                                    const newItems = [...currentNote.checklistItems!];
                                    newItems[idx].done = !newItems[idx].done;
                                    setNoteState({...currentNote, checklistItems: newItems});
                                }}
                                className="w-6 h-6 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                                />
                                <input
                                    value={item.text}
                                    onChange={(e) => {
                                        const newItems = [...currentNote.checklistItems!];
                                        newItems[idx].text = e.target.value;
                                        setNoteState({...currentNote, checklistItems: newItems});
                                    }}
                                    className={`bg-transparent text-xl w-full outline-none ${item.done ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-200"}`}
                                />
                            </div>
                            ))}
                            <Button variant="ghost" onClick={() => {
                                const newItems = [...currentNote.checklistItems!, { id: Math.random().toString(36), text: '', done: false }];
                                setNoteState({...currentNote, checklistItems: newItems});
                            }}>+ Add Item</Button>
                        </div>
                    ) : (
                        <textarea 
                            value={currentNote.content} 
                            onChange={(e) => setNoteState({ ...currentNote, content: e.target.value })}
                            className="w-full h-full bg-transparent resize-none outline-none text-lg leading-relaxed text-slate-800 dark:text-slate-200"
                            placeholder="Start typing..."
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Brain Dump Modal ---
const BrainDumpModal = ({ isOpen, onClose, onProcess }: any) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!input.trim()) return;
    setLoading(true);
    await onProcess(input);
    setLoading(false);
    setInput("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Cortex Brain Dump">
      <div className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Paste unstructured thoughts. Gemini will convert vague tasks into checklists automatically.
        </p>
        <textarea 
          className="w-full h-40 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          placeholder="e.g. Plan a trip to Japan, Buy groceries, Email boss about Q3 report."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        ></textarea>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleProcess} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <CortexIcon className="animate-spin w-4 h-4" /> Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CortexIcon className="w-4 h-4" /> Organize My Thoughts
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// --- Arcade Sidebar ---

const PatternGame = ({ onComplete }: { onComplete: () => void }) => {
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [level, setLevel] = useState(0);
    const [activeBtn, setActiveBtn] = useState<number | null>(null);

    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];

    const playSequence = async (seq: number[]) => {
        setIsPlaying(true);
        for (let i = 0; i < seq.length; i++) {
            await new Promise(r => setTimeout(r, 500));
            setActiveBtn(seq[i]);
            await new Promise(r => setTimeout(r, 500));
            setActiveBtn(null);
        }
        setIsPlaying(false);
    };

    const startGame = () => {
        const first = Math.floor(Math.random() * 4);
        setSequence([first]);
        setUserSequence([]);
        setLevel(1);
        playSequence([first]);
    };

    const handleBtnClick = (idx: number) => {
        if (isPlaying) return;
        setActiveBtn(idx);
        setTimeout(() => setActiveBtn(null), 200);

        const nextUserSeq = [...userSequence, idx];
        setUserSequence(nextUserSeq);

        if (nextUserSeq[nextUserSeq.length - 1] !== sequence[nextUserSeq.length - 1]) {
            // Fail
            setLevel(0);
            setSequence([]);
            alert("Game Over! Try again."); // Replace with better UI in real app
            return;
        }

        if (nextUserSeq.length === sequence.length) {
            // Level Complete
            onComplete();
            const nextLevel = Math.floor(Math.random() * 4);
            const newSeq = [...sequence, nextLevel];
            setSequence(newSeq);
            setUserSequence([]);
            setLevel(level + 1);
            setTimeout(() => playSequence(newSeq), 1000);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <h3 className="font-mono text-green-400">MEMORY MATRIX: LVL {level}</h3>
            <div className="grid grid-cols-2 gap-4">
                {colors.map((c, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleBtnClick(idx)}
                        className={`w-20 h-20 rounded-xl transition-all duration-100 ${c} ${activeBtn === idx ? 'brightness-150 scale-110 shadow-[0_0_20px_currentColor]' : 'opacity-70 hover:opacity-100'}`}
                    />
                ))}
            </div>
            {level === 0 && (
                <Button onClick={startGame} className="w-full">Start Game</Button>
            )}
        </div>
    );
};

const ReactionGame = ({ onScore }: { onScore: (s: number) => void }) => {
    const [status, setStatus] = useState<'idle' | 'waiting' | 'ready' | 'finished'>('idle');
    const [targetTime, setTargetTime] = useState(0);
    const [result, setResult] = useState(0);

    const start = () => {
        setStatus('waiting');
        const delay = 1000 + Math.random() * 3000;
        setTimeout(() => {
            setTargetTime(Date.now());
            setStatus('ready');
        }, delay);
    };

    const handleClick = () => {
        if (status === 'ready') {
            const diff = Date.now() - targetTime;
            setResult(diff);
            setStatus('finished');
            if (diff < 300) onScore(10);
        } else if (status === 'waiting') {
            setStatus('idle');
            setResult(-1); // Too early
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full">
            <div 
                onClick={handleClick}
                className={`w-full aspect-square rounded-2xl flex items-center justify-center cursor-pointer transition-all ${
                    status === 'idle' ? 'bg-slate-800' :
                    status === 'waiting' ? 'bg-red-500' :
                    status === 'ready' ? 'bg-green-500 animate-pulse' :
                    'bg-blue-600'
                }`}
            >
                {status === 'idle' && <span className="font-mono text-slate-400">TAP TO START</span>}
                {status === 'waiting' && <span className="font-mono font-bold text-white">WAIT FOR GREEN</span>}
                {status === 'ready' && <span className="font-mono font-bold text-white text-2xl">CLICK!</span>}
                {status === 'finished' && <span className="font-mono font-bold text-white text-xl">{result}ms</span>}
            </div>
            {status === 'idle' && <Button onClick={start} className="w-full">Start Test</Button>}
            {status === 'finished' && <Button onClick={start} className="w-full">Retry</Button>}
        </div>
    );
};

const ArcadeSidebar = ({ isOpen, onClose, score, setScore }: any) => {
  const [activeTab, setActiveTab] = useState<'reaction' | 'memory'>('reaction');

  return (
    <div className={`fixed right-0 top-0 h-full w-80 bg-slate-900 text-white shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <ArcadeIcon className="text-green-400" />
            <h2 className="font-bold text-xl font-mono">NEURAL GYM</h2>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
      </div>
      
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex gap-2 mb-8 bg-slate-800 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('reaction')}
                className={`flex-1 py-2 rounded text-xs font-bold uppercase ${activeTab === 'reaction' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}
            >
                Reaction
            </button>
            <button 
                onClick={() => setActiveTab('memory')}
                className={`flex-1 py-2 rounded text-xs font-bold uppercase ${activeTab === 'memory' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}
            >
                Memory
            </button>
        </div>

        <div className="text-center mb-8">
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
                {score}
            </div>
            <div className="text-xs text-slate-500 tracking-widest uppercase">Sharpness Score</div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
            {activeTab === 'reaction' ? (
                <ReactionGame onScore={(points) => setScore((s: number) => s + points)} />
            ) : (
                <PatternGame onComplete={() => setScore((s: number) => s + 5)} />
            )}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'notes'>('notes');
  const [searchTerm, setSearchTerm] = useState("");
  const [isBrainDumpOpen, setBrainDumpOpen] = useState(false);
  const [isArcadeOpen, setArcadeOpen] = useState(false);
  const [analytics, setAnalytics] = useState(StorageService.getAnalytics());
  const [onboardingRole, setOnboardingRole] = useState<AppRole | null>(null);
  const [expandedNote, setExpandedNote] = useState<Note | null>(null);

  // Global Undo/Redo State
  // We cannot use the standard useUndoRedo hook easily because we need to sync with storage side-effects on undo/redo.
  const [notesHistory, setNotesHistory] = useState<Note[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [notes, setNotes] = useState<Note[]>([]); // Displayed notes

  // Initialize
  useEffect(() => {
    const existingUser = StorageService.getUser();
    if (existingUser) {
      setUser(existingUser);
      const loadedNotes = StorageService.getNotes();
      setNotes(loadedNotes);
      setNotesHistory([loadedNotes]);
      setHistoryIndex(0);

      setAnalytics(StorageService.getAnalytics());
      if (existingUser.themePreference === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      setLoading(false);
    } else {
      setLoading(false); // Trigger onboarding
    }
  }, []);

  // Helper to update global notes state and history
  const updateGlobalNotes = (newNotes: Note[]) => {
      const nextHistory = notesHistory.slice(0, historyIndex + 1);
      nextHistory.push(newNotes);
      setNotesHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
      setNotes(newNotes);
      
      // Persist latest state
      StorageService.saveAllNotes(newNotes);
  };

  const globalUndo = () => {
      if (historyIndex > 0) {
          const prevIndex = historyIndex - 1;
          const prevNotes = notesHistory[prevIndex];
          setHistoryIndex(prevIndex);
          setNotes(prevNotes);
          StorageService.saveAllNotes(prevNotes);
      }
  };

  const globalRedo = () => {
      if (historyIndex < notesHistory.length - 1) {
          const nextIndex = historyIndex + 1;
          const nextNotes = notesHistory[nextIndex];
          setHistoryIndex(nextIndex);
          setNotes(nextNotes);
          StorageService.saveAllNotes(nextNotes);
      }
  };

  const handleCompleteOnboarding = (role: AppRole) => {
    const newUser = StorageService.initUser(role);
    setUser(newUser);
    const initialNotes = StorageService.getNotes();
    setNotes(initialNotes);
    setNotesHistory([initialNotes]);
    setHistoryIndex(0);
    if (newUser.themePreference === 'dark') document.documentElement.classList.add('dark');
  };

  const toggleTheme = () => {
    if (!user) return;
    const newTheme: 'light' | 'dark' = user.themePreference === 'dark' ? 'light' : 'dark';
    const updatedUser = { ...user, themePreference: newTheme };
    setUser(updatedUser);
    StorageService.saveUser(updatedUser);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      content: '',
      isPinned: false,
      isArchived: false,
      isDeleted: false,
      tags: [],
      color: NoteColor.DEFAULT,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      type: 'text'
    };
    // Immutable update for history
    const newNotes = [newNote, ...notes];
    updateGlobalNotes(newNotes);
    StorageService.updateAnalytics('notesCreated');
  };

  const handleUpdateNote = (updatedNote: Note) => {
    const newNotes = notes.map(n => n.id === updatedNote.id ? { ...updatedNote, updatedAt: Date.now() } : n);
    updateGlobalNotes(newNotes);
  };

  const handleDeleteNote = (id: string) => {
    const newNotes = notes.filter(n => n.id !== id);
    updateGlobalNotes(newNotes);
  };

  const handlePinNote = (id: string) => {
    const newNotes = notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n);
    updateGlobalNotes(newNotes);
  };

  const handleBrainDumpProcess = async (text: string) => {
    const processedItems = await GeminiService.processBrainDump(text);
    const generatedNotes: Note[] = processedItems.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      title: item.title || "New Task",
      content: item.content || "",
      type: (item.type as 'text' | 'checklist') || 'text',
      checklistItems: item.checklistItems || [],
      isPinned: false,
      isArchived: false,
      isDeleted: false,
      tags: item.tags || [],
      color: NoteColor.BLUE,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    const newNotes = [...generatedNotes, ...notes];
    updateGlobalNotes(newNotes);
  };

  // Filter notes
  const filteredNotes = notes
    .filter(n => !n.isDeleted)
    .filter(n => 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => (b.isPinned === a.isPinned) ? b.updatedAt - a.updatedAt : b.isPinned ? 1 : -1);

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  // Onboarding Screen
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-center p-6">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
                <LogoIcon className="w-12 h-12" />
                <h1 className="text-4xl font-extrabold tracking-tight">The Omni-Planner</h1>
            </div>
            <p className="text-xl text-slate-500 mb-8 leading-relaxed">
              Not just another notes app. A <strong>second brain</strong> tailored to your psychology.
              Combines the speed of rapid capture with the depth of a strategic planner.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-lg">
                 <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                    <CortexIcon />
                 </div>
                 <div>
                    <h3 className="font-bold">AI Cortex</h3>
                    <p className="text-sm text-slate-500">Transform messy brain dumps into clear actions.</p>
                 </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-lg">
                 <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                    <GamePadIcon />
                 </div>
                 <div>
                    <h3 className="font-bold">Neural Gym</h3>
                    <p className="text-sm text-slate-500">Memory & Reaction games to prime focus.</p>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-6">Select Your Role</h2>
            <div className="space-y-3">
              {(Object.keys(ROLE_CONFIG) as AppRole[]).map(role => (
                <button
                  key={role}
                  onClick={() => setOnboardingRole(role)}
                  className={`w-full p-4 rounded-xl text-left border-2 transition-all duration-200 flex items-center justify-between ${onboardingRole === role ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                >
                  <div>
                    <div className={`font-bold ${ROLE_CONFIG[role].color}`}>{role}</div>
                    <div className="text-xs text-slate-500 mt-1">{ROLE_CONFIG[role].description}</div>
                  </div>
                  {onboardingRole === role && <div className="w-4 h-4 rounded-full bg-indigo-500"></div>}
                </button>
              ))}
            </div>
            <Button 
                onClick={() => onboardingRole && handleCompleteOnboarding(onboardingRole)} 
                disabled={!onboardingRole}
                className="w-full mt-8 py-3 text-lg"
            >
                Enter Workspace
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div></div>;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${user.themePreference === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-30 glass-panel border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('notes')}>
                <LogoIcon className="w-8 h-8" />
                <span className="font-bold text-xl hidden md:block">Omni</span>
            </div>
            
            <div className="hidden md:flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
                <button 
                    onClick={() => setView('notes')} 
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'notes' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    Workspace
                </button>
                <button 
                    onClick={() => setView('dashboard')} 
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    Analytics
                </button>
            </div>
            
            {/* Global Undo/Redo */}
            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
                <button 
                    onClick={globalUndo} 
                    disabled={historyIndex <= 0}
                    className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-300"
                    title="Undo (Global)"
                >
                    <UndoIcon className="w-4 h-4" />
                </button>
                <button 
                    onClick={globalRedo}
                    disabled={historyIndex >= notesHistory.length - 1}
                    className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-300"
                    title="Redo (Global)"
                >
                    <RedoIcon className="w-4 h-4" />
                </button>
            </div>
        </div>

        <div className="flex-1 max-w-xl mx-8 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
                type="text" 
                placeholder="Search notes, tags, or memories..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-200/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
        </div>

        <div className="flex items-center gap-4">
            <button onClick={() => setArcadeOpen(true)} className="relative group p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                <ArcadeIcon className="text-green-500" />
                {user.mentalSharpnessScore > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                <div className="absolute right-0 mt-2 w-32 bg-slate-900 text-white text-xs p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                    Neural Gym
                </div>
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                {user.themePreference === 'dark' ? 
                    <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : 
                    <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                }
            </button>
            <GeometricAvatar uid={user.uid} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto min-h-screen">
        
        {view === 'dashboard' ? (
            <div className="animate-in fade-in duration-500">
                <h2 className="text-3xl font-bold mb-8">Productivity Quantum</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Day Completion Ring */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center col-span-1">
                        <DayCompletionRing notes={notes} />
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                        <div className="text-sm text-slate-500 mb-2">Mental Sharpness</div>
                        <div className="text-4xl font-black text-green-500">{user.mentalSharpnessScore}</div>
                        <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${Math.min(user.mentalSharpnessScore, 100)}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                        <div className="text-sm text-slate-500 mb-2">Notes Created</div>
                        <div className="text-4xl font-black text-indigo-500">{analytics.notesCreated}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                        <div className="text-sm text-slate-500 mb-2">Deep Work (Est. Min)</div>
                        <div className="text-4xl font-black text-purple-500">{analytics.focusMinutes}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 h-96">
                    <h3 className="font-bold mb-6">Activity Flow</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={analytics.dailyActivity}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" stroke="#94a3b8" />
                            <RechartsTooltip 
                                contentStyle={{ backgroundColor: user.themePreference === 'dark' ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        ) : (
            <>
                {/* Note Input Area - Replicates Google Keep */}
                <div className="max-w-2xl mx-auto mb-12 relative group z-10">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <div 
                        onClick={handleCreateNote}
                        className="relative bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg cursor-text flex items-center justify-between transition-transform active:scale-[0.99]"
                    >
                        <span className="text-slate-500 font-medium">Take a note...</span>
                        <div className="flex gap-4">
                            <button className="text-slate-400 hover:text-indigo-500 transition-colors" title="New List"><FluxNodeIcon /></button>
                            <button className="text-slate-400 hover:text-indigo-500 transition-colors"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                        </div>
                    </div>
                </div>

                {/* Pinned Section */}
                {pinnedNotes.length > 0 && (
                    <div className="mb-12">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pl-2">Pinned</h4>
                        <div className="masonry-grid">
                            {pinnedNotes.map(note => (
                                <NoteCard 
                                    key={note.id} 
                                    note={note} 
                                    onUpdate={handleUpdateNote} 
                                    onDelete={handleDeleteNote}
                                    onPin={handlePinNote}
                                    onExpand={setExpandedNote}
                                    onTagClick={(tag) => setSearchTerm(tag)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Other Notes */}
                <div className="masonry-grid pb-24">
                     {otherNotes.map(note => (
                        <NoteCard 
                            key={note.id} 
                            note={note} 
                            onUpdate={handleUpdateNote} 
                            onDelete={handleDeleteNote}
                            onPin={handlePinNote}
                            onExpand={setExpandedNote}
                            onTagClick={(tag) => setSearchTerm(tag)}
                        />
                    ))}
                    {otherNotes.length === 0 && pinnedNotes.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 opacity-50">
                            <TimePrismIcon className="w-24 h-24 mb-4" />
                            <p className="text-lg">Your workspace is empty.</p>
                        </div>
                    )}
                </div>
            </>
        )}
      </main>

      {/* Floating Action Button for Brain Dump */}
      <button 
        onClick={() => setBrainDumpOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-all duration-300 z-40 group"
      >
        <CortexIcon className="w-8 h-8 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Modals & Drawers */}
      <BrainDumpModal 
        isOpen={isBrainDumpOpen} 
        onClose={() => setBrainDumpOpen(false)} 
        onProcess={handleBrainDumpProcess}
      />
      
      <ExpandedNoteModal 
        isOpen={!!expandedNote}
        note={expandedNote}
        onClose={() => setExpandedNote(null)}
        onUpdate={handleUpdateNote}
      />

      <ArcadeSidebar 
        isOpen={isArcadeOpen} 
        onClose={() => setArcadeOpen(false)}
        score={user.mentalSharpnessScore}
        setScore={(cb: any) => {
            const newScore = typeof cb === 'function' ? cb(user.mentalSharpnessScore) : cb;
            setUser({...user, mentalSharpnessScore: newScore});
            StorageService.saveUser({...user, mentalSharpnessScore: newScore});
        }}
      />

    </div>
  );
}