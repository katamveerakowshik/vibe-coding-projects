import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, Search, Plus, User, Settings, Mic, Image as ImageIcon, 
  Loader2, Sparkles, LogOut, LayoutGrid, Clock, ChevronLeft, ChevronRight, X, Play
} from 'lucide-react';

import { Note, UrgencyLevel, NoteType, UserProfile, AppSnapshot } from './types';
import { getNotes, saveState, getUser, saveUser, getHistory, restoreState } from './services/storageService';
import { formatTextMagic, analyzeAudio, scanImage, generateCoverImage } from './services/geminiService';

import NoteCard from './components/NoteCard';
import CallOverlay from './components/CallOverlay';
import OrbitAssistant from './components/OrbitAssistant';
import RichEditor from './components/RichEditor';

const App = () => {
  // --- Global State ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [history, setHistory] = useState<AppSnapshot[]>([]);
  
  // --- UI State ---
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<Note | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Time Machine State ---
  const [timeIndex, setTimeIndex] = useState(0);
  
  // --- Auth State ---
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');

  // --- Refs ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoTitleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Initialization ---
  useEffect(() => {
    const loadedUser = getUser();
    if (loadedUser) {
        setUser(loadedUser);
        setNotes(getNotes());
        const h = getHistory();
        setHistory(h);
        setTimeIndex(Math.max(0, h.length - 1));
    }
  }, []);

  // Timer Check for Calls
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      notes.forEach(note => {
        if (note.reminderTime && !note.isCompleted) {
          if (now >= note.reminderTime && now < note.reminderTime + 5000) {
             if (!activeCall || activeCall.id !== note.id) {
                 setActiveCall(note);
             }
          }
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [notes, activeCall]);

  // --- Handlers ---
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Date.now().toString();
    const newUser: UserProfile = {
      id,
      email: authEmail,
      name: authEmail.split('@')[0],
      isLoggedIn: true,
      avatarGradient: `linear-gradient(${parseInt(id.slice(-3)) % 360}deg, #D946EF, #6366f1)`
    };
    setUser(newUser);
    saveUser(newUser);
    setNotes(getNotes());
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('dot_os_user_v2');
  };

  const createNewNote = () => {
     const newNote: Note = {
       id: Date.now().toString(),
       title: 'New Idea',
       content: '',
       type: NoteType.TEXT,
       category: 'Inbox',
       tags: [],
       createdAt: Date.now(),
       updatedAt: Date.now(),
       isCompleted: false,
       urgency: UrgencyLevel.MEDIUM
     };
     const updatedNotes = [newNote, ...notes];
     setNotes(updatedNotes);
     saveState(updatedNotes, user!, "Created Note");
     setActiveNoteId(newNote.id);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
     setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
     
     // Auto-Title Logic: If content changed significantly, try to auto-title
     if (updates.content) {
         if (autoTitleTimeoutRef.current) clearTimeout(autoTitleTimeoutRef.current);
         autoTitleTimeoutRef.current = setTimeout(async () => {
             const currentNote = notes.find(n => n.id === id);
             // Only auto-title if title is still default "New Idea" and we have some content
             if (currentNote && currentNote.title === "New Idea" && updates.content!.length > 20) {
                  // Strip HTML for the prompt
                  const cleanText = updates.content!.replace(/<[^>]*>/g, ' ');
                  const result = await formatTextMagic(cleanText);
                  if (result.title && result.title !== "New Idea") {
                      setNotes(curr => curr.map(n => n.id === id ? { ...n, title: result.title! } : n));
                      // Once titled, maybe trigger image gen? 
                      // The prompt implies "automatically generate a title... and generate an image"
                      // We will do image gen only if explicit or Magic button to save resources, 
                      // but the user said "when we paste... generate title" so we did that.
                  }
             }
         }, 2000); // 2 second debounce
     }
  };

  const saveNoteAndHistory = () => {
     if (user) {
         saveState(notes, user, "Updated Notes");
         setHistory(getHistory());
     }
  };

  const deleteNote = (id: string) => {
     const updatedNotes = notes.filter(n => n.id !== id);
     setNotes(updatedNotes);
     saveState(updatedNotes, user!, "Deleted Note");
  };

  const handleMagicFormat = async (note: Note) => {
    const rawText = new DOMParser().parseFromString(note.content, 'text/html').body.textContent || "";
    if (!rawText) return;

    const result = await formatTextMagic(rawText);
    if (result) {
        // Also generate cover image
        let coverUrl = note.coverImageUrl;
        if (result.title) {
            const generated = await generateCoverImage(result.title, '1K');
            if (generated) coverUrl = generated;
        }

        updateNote(note.id, {
            title: result.title || note.title,
            tags: result.tags || note.tags,
            urgency: result.urgency || note.urgency,
            content: result.content || note.content,
            coverImageUrl: coverUrl
        });
    }
  };

  const handleTimeTravel = (e: React.ChangeEvent<HTMLInputElement>) => {
      const idx = parseInt(e.target.value);
      setTimeIndex(idx);
      const snapshot = history[idx];
      if (snapshot) {
          const restoredNotes = restoreState(snapshot);
          setNotes(restoredNotes);
      }
  };

  // --- Render Helpers ---
  const activeNote = notes.find(n => n.id === activeNoteId);
  const uniqueTags = Array.from(new Set(notes.flatMap(n => n.tags)));

  const filteredNotes = notes.filter(n => {
     const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           n.content.toLowerCase().includes(searchQuery.toLowerCase());
     const matchesTag = filterTag ? n.tags.includes(filterTag) : true;
     return matchesSearch && matchesTag;
  });

  if (!user) {
     return (
       <div className="h-screen w-full bg-[#050505] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black animate-pulse-purple"></div>
          <div className="glass-panel-heavy p-8 rounded-3xl w-full max-w-md z-10 flex flex-col items-center border border-[#D946EF]/20 shadow-[0_0_50px_rgba(217,70,239,0.15)]">
             <div className="w-16 h-16 rounded-full bg-[#D946EF] flex items-center justify-center mb-6 shadow-[0_0_20px_#D946EF]">
                <Sparkles className="text-white" size={32} />
             </div>
             <h1 className="text-3xl font-bold text-white mb-2 neon-text">DOT OS</h1>
             <p className="text-white/40 mb-8 text-center">Cognitive Intelligence System</p>
             <form onSubmit={handleAuth} className="w-full space-y-4">
                <input type="email" required placeholder="user@orbit.net" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#D946EF] focus:outline-none" />
                <input type="password" required placeholder="••••••••" value={authPass} onChange={e => setAuthPass(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#D946EF] focus:outline-none" />
                <button type="submit" className="w-full bg-[#D946EF] text-white font-bold py-3 rounded-xl hover:shadow-[0_0_20px_#D946EF] transition-all">INITIALIZE</button>
             </form>
          </div>
       </div>
     );
  }

  return (
    <div className="flex h-screen bg-[#050505] text-white font-inter overflow-hidden">
      
      {/* --- Sidebar --- */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#0A0A0C] border-r border-white/5 transition-all duration-300 flex flex-col z-20 flex-shrink-0`}>
        <div className="p-6 flex items-center gap-3">
           <div className="w-10 h-10 flex-shrink-0 relative">
               {/* Creative Logo in Sidebar */}
               <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]">
                  <path d="M50 10 A40 40 0 0 1 90 50" stroke="#D946EF" strokeWidth="5" fill="none" className="animate-[spin_4s_linear_infinite]" style={{transformOrigin: '50px 50px'}} />
                  <path d="M50 90 A40 40 0 0 1 10 50" stroke="#6366f1" strokeWidth="5" fill="none" className="animate-[spin_4s_linear_infinite]" style={{transformOrigin: '50px 50px'}} />
                  <circle cx="50" cy="50" r="10" fill="white" className="animate-pulse" />
               </svg>
           </div>
           {sidebarOpen && <h1 className="text-2xl font-bold tracking-tight text-white neon-text">DOT</h1>}
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto text-white/30 hover:text-white">
             {sidebarOpen ? <ChevronLeft size={18}/> : <ChevronRight size={18}/>}
           </button>
        </div>

        {/* User & Nav */}
        <div className="px-4 mb-6">
           <div className={`p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
              <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: user.avatarGradient }} />
              {sidebarOpen && <div className="overflow-hidden"><p className="text-sm font-medium truncate">{user.name}</p></div>}
           </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
           <div onClick={() => setFilterTag(null)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${!filterTag ? 'bg-[#D946EF]/20 text-[#D946EF]' : 'text-white/60 hover:bg-white/5'}`}>
              <LayoutGrid size={18} /> {sidebarOpen && <span>All Notes</span>}
           </div>
           {uniqueTags.map(tag => (
              <div key={tag} onClick={() => setFilterTag(tag)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${filterTag === tag ? 'bg-[#D946EF]/20 text-[#D946EF]' : 'text-white/60 hover:bg-white/5'}`}>
                 <div className="w-2 h-2 rounded-full bg-white/20" /> {sidebarOpen && <span>#{tag}</span>}
              </div>
           ))}
        </nav>

        <div className="p-4 border-t border-white/5">
           <button onClick={() => setShowSettings(true)} className="flex items-center gap-3 text-white/50 hover:text-white w-full p-2 hover:bg-white/5 rounded-lg"><Settings size={18} /> {sidebarOpen && <span>Config</span>}</button>
           <button onClick={handleLogout} className="flex items-center gap-3 text-red-500/50 hover:text-red-500 w-full p-2 hover:bg-red-500/10 rounded-lg mt-1"><LogOut size={18} /> {sidebarOpen && <span>Disconnect</span>}</button>
        </div>
      </aside>

      {/* --- Main Area --- */}
      <main className="flex-1 flex flex-col relative min-w-0">
         <header className="h-16 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md flex items-center px-6 justify-between z-10">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
               <Search className="text-white/30" size={18} />
               <input type="text" placeholder="Query neural database..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none focus:outline-none text-white w-full placeholder:text-white/20" />
            </div>
            <button onClick={createNewNote} className="bg-[#D946EF] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] transition-all">
               <Plus size={18} /> <span className="hidden sm:inline">Create Entry</span>
            </button>
         </header>

         <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
               {filteredNotes.map(note => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    onDelete={deleteNote}
                    onClick={() => setActiveNoteId(note.id)}
                    onPlayAudio={(url) => { if (audioRef.current) { audioRef.current.src = url; audioRef.current.play(); } }}
                  />
               ))}
            </div>
         </div>
      </main>

      {/* --- Editor Modal --- */}
      {activeNote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
           <div className="bg-[#0f0f11] w-full h-full md:w-[90%] md:h-[90%] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden relative border border-white/10">
              <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0f0f11]">
                 <input 
                    value={activeNote.title}
                    onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                    className="bg-transparent text-xl font-bold text-white focus:outline-none w-full"
                    placeholder="Untitled Entry"
                 />
                 <div className="flex items-center gap-3">
                    <button onClick={() => handleMagicFormat(activeNote)} className="p-2 hover:bg-white/10 rounded-lg text-[#D946EF]" title="AI Analyze"><Sparkles size={20} /></button>
                    <div className="h-6 w-px bg-white/10"></div>
                    <button onClick={() => { setActiveNoteId(null); saveNoteAndHistory(); }} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white"><X size={24} /></button>
                 </div>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col bg-[#0A0A0C]">
                 <RichEditor 
                    initialContent={activeNote.content}
                    noteTitle={activeNote.title}
                    onChange={(html) => updateNote(activeNote.id, { content: html })}
                    onAudioRecord={async () => {
                         try {
                           const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                           const mediaRecorder = new MediaRecorder(stream);
                           const chunks: Blob[] = [];
                           mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
                           mediaRecorder.onstop = async () => {
                               const blob = new Blob(chunks, { type: 'audio/wav' });
                               const reader = new FileReader();
                               reader.readAsDataURL(blob);
                               reader.onloadend = async () => {
                                   const base64 = (reader.result as string).split(',')[1];
                                   const analysis = await analyzeAudio(base64);
                                   // Insert visible audio block + summary
                                   const audioBlock = `
                                     <div class="my-4 p-4 rounded-xl bg-[#D946EF]/10 border border-[#D946EF]/30 flex items-center gap-4">
                                        <div class="w-10 h-10 rounded-full bg-[#D946EF] flex items-center justify-center text-white"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg></div>
                                        <div>
                                            <div class="font-bold text-[#D946EF] text-sm">Audio Note Recorded</div>
                                            <div class="text-[10px] text-white/50">Urgency: ${analysis.urgency}</div>
                                        </div>
                                     </div>
                                     <h3 class="text-[#D946EF] font-bold text-lg mt-4">Summary</h3>
                                     ${analysis.summaryPoints}
                                   `;
                                   
                                   updateNote(activeNote.id, { 
                                       content: activeNote.content + audioBlock,
                                       urgency: analysis.urgency,
                                       type: NoteType.AUDIO,
                                       mediaUrl: reader.result as string
                                   });
                               };
                           };
                           mediaRecorder.start();
                           setTimeout(() => mediaRecorder.stop(), 4000); 
                           alert("Recording...");
                         } catch(e) { alert("Mic Error"); }
                    }}
                    onSetReminder={(time) => updateNote(activeNote.id, { reminderTime: time })}
                    onUpdateCover={(url) => updateNote(activeNote.id, { coverImageUrl: url })}
                    reminderTime={activeNote.reminderTime}
                 />
              </div>
           </div>
        </div>
      )}

      {/* --- Settings / Time Machine --- */}
      {showSettings && (
         <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8">
            <div className="w-full max-w-3xl glass-panel-heavy rounded-2xl p-8 border border-[#D946EF]/30 relative">
               <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={24}/></button>
               <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 neon-text"><Clock className="text-[#D946EF]" /> Time Machine</h2>
               <div className="mb-12">
                  <div className="flex items-center gap-4">
                     <span className="text-xs font-mono text-[#D946EF]">PAST</span>
                     <input type="range" min="0" max={Math.max(history.length - 1, 0)} value={timeIndex} onChange={handleTimeTravel} className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" disabled={history.length === 0} />
                     <span className="text-xs font-mono text-[#D946EF]">NOW</span>
                  </div>
               </div>
            </div>
         </div>
      )}

      {activeCall && <CallOverlay note={activeCall} onDismiss={() => setActiveCall(null)} onAnswer={() => {}} />}
      <audio ref={audioRef} className="hidden" />
      <OrbitAssistant notes={notes} />
    </div>
  );
};

export default App;