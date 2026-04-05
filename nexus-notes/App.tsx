import React, { useState, useEffect, useRef } from 'react';
import { NexusView, Note, ModelTier } from './types';
import { SAMPLE_NOTES, MODELS, THINKING_BUDGET } from './constants';
import { 
    generateSmartResponse, 
    analyzeImage, 
    generateProImage, 
    editImage, 
    blobToBase64 
} from './services/geminiService';
import { LiveSession } from './components/LiveSession';
import { VeoStudio } from './components/VeoStudio';
import { 
    Layout, 
    Sparkles, 
    Mic, 
    Image as ImageIcon, 
    Search, 
    BrainCircuit, 
    Send, 
    Plus, 
    ArrowLeft, 
    FileText, 
    MoreVertical,
    Wand2,
    Eye,
    Loader2
} from 'lucide-react';

// --- Sidebar Component ---
const Sidebar = ({ view, setView }: { view: NexusView, setView: (v: NexusView) => void }) => (
  <div className="w-20 lg:w-64 border-r border-white/10 bg-nexus-900/50 backdrop-blur-xl flex flex-col justify-between py-6">
    <div className="space-y-8">
      <div className="px-4 lg:px-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nexus-accent to-nexus-glow flex items-center justify-center shadow-lg shadow-nexus-accent/20">
          <Sparkles className="text-white" size={20} />
        </div>
        <span className="hidden lg:block text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Nexus</span>
      </div>

      <nav className="space-y-2 px-2">
        <NavItem icon={<FileText />} label="Notes" active={view === NexusView.NOTES || view === NexusView.EDITOR} onClick={() => setView(NexusView.NOTES)} />
        <NavItem icon={<Mic />} label="Live Voice" active={view === NexusView.LIVE_VOICE} onClick={() => setView(NexusView.LIVE_VOICE)} />
        <NavItem icon={<Wand2 />} label="Veo Studio" active={view === NexusView.VEO_STUDIO} onClick={() => setView(NexusView.VEO_STUDIO)} />
      </nav>
    </div>

    <div className="px-4">
        <div className="hidden lg:block p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
            <h4 className="text-sm font-semibold text-white mb-1">Pro Status</h4>
            <p className="text-xs text-slate-400">Gemini 3 Pro Active</p>
        </div>
    </div>
  </div>
);

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-3 lg:px-6 rounded-xl transition-all ${active ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
  >
    {React.cloneElement(icon, { size: 20 })}
    <span className="hidden lg:block font-medium">{label}</span>
  </button>
);

// --- Chat/Assistant Component ---
const AIChatOverlay = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [msg, setMsg] = useState('');
    const [history, setHistory] = useState<{role: 'user'|'model', text: string, grounding?: any[]}[]>([]);
    const [loading, setLoading] = useState(false);
    const [useThinking, setUseThinking] = useState(false);
    const [useSearch, setUseSearch] = useState(false);

    const handleSend = async () => {
        if(!msg.trim()) return;
        const userMsg = msg;
        setMsg('');
        setHistory(prev => [...prev, {role: 'user', text: userMsg}]);
        setLoading(true);

        try {
            const histForApi = history.map(h => ({role: h.role, parts: [{text: h.text}]}));
            const model = useThinking ? MODELS.TEXT_PRO : MODELS.TEXT_FAST;
            
            const res = await generateSmartResponse(userMsg, model, useThinking, useSearch, histForApi);
            
            setHistory(prev => [...prev, {
                role: 'model', 
                text: res.text || "I couldn't generate a response.",
                grounding: res.grounding
            }]);
        } catch(e) {
            setHistory(prev => [...prev, {role: 'model', text: "Error connecting to Nexus Intelligence."}]);
        } finally {
            setLoading(false);
        }
    };

    if(!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-nexus-900 border-l border-white/10 shadow-2xl p-6 flex flex-col z-40 transform transition-transform animate-in slide-in-from-right">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BrainCircuit className="text-nexus-glow" /> Nexus AI
                </h3>
                <button onClick={onClose}><ArrowLeft className="text-slate-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {history.map((h, i) => (
                    <div key={i} className={`p-3 rounded-lg text-sm ${h.role === 'user' ? 'bg-white/10 ml-8' : 'bg-nexus-accent/10 mr-8 border border-nexus-accent/20'}`}>
                        <p className="text-slate-200 whitespace-pre-wrap">{h.text}</p>
                        {h.grounding && (
                            <div className="mt-2 pt-2 border-t border-white/10 text-xs space-y-1">
                                <span className="text-nexus-accent font-semibold flex items-center gap-1"><Search size={10}/> Sources:</span>
                                {h.grounding.map((chunk: any, idx: number) => (
                                    chunk.web?.uri && <a key={idx} href={chunk.web.uri} target="_blank" className="block truncate text-slate-400 hover:text-white underline">{chunk.web.title || chunk.web.uri}</a>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {loading && <div className="flex items-center gap-2 text-nexus-accent text-sm"><Loader2 className="animate-spin" size={14} /> Processing...</div>}
            </div>

            <div className="space-y-3">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setUseThinking(!useThinking)}
                        className={`flex-1 text-xs py-2 rounded border transition-all ${useThinking ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'border-white/10 text-slate-500'}`}
                    >
                        Thinking Mode (Pro)
                    </button>
                    <button 
                        onClick={() => setUseSearch(!useSearch)}
                        className={`flex-1 text-xs py-2 rounded border transition-all ${useSearch ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'border-white/10 text-slate-500'}`}
                    >
                        Google Search
                    </button>
                </div>
                <div className="relative">
                    <input 
                        value={msg}
                        onChange={e => setMsg(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pr-10 text-sm focus:outline-none focus:border-nexus-accent text-white"
                        placeholder="Ask Nexus..."
                    />
                    <button onClick={handleSend} className="absolute right-2 top-2 p-1 text-nexus-accent hover:text-white"><Send size={16}/></button>
                </div>
            </div>
        </div>
    );
};

// --- Note Editor ---
const Editor = ({ note, onSave, onBack }: { note: Note, onSave: (n: Note) => void, onBack: () => void }) => {
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const [loadingAction, setLoadingAction] = useState<string|null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editMode, setEditMode] = useState<'analyze'|'edit'|'generate'|null>(null);
    const [prompt, setPrompt] = useState('');

    const handleAction = async () => {
        setLoadingAction(editMode);
        try {
            if (editMode === 'analyze' && fileInputRef.current?.files?.[0]) {
                const b64 = await blobToBase64(fileInputRef.current.files[0]);
                const analysis = await analyzeImage(b64, prompt || "Analyze this image in detail.");
                setContent(prev => prev + '\n\n**Analysis:**\n' + analysis);
            } 
            else if (editMode === 'edit' && fileInputRef.current?.files?.[0]) {
                const b64 = await blobToBase64(fileInputRef.current.files[0]);
                const resultB64 = await editImage(b64, prompt);
                if(resultB64) {
                     // In real app, upload to storage. Here, simple data URI append
                     setContent(prev => prev + `\n\n![Edited Image](data:image/png;base64,${resultB64})`);
                }
            }
            else if (editMode === 'generate') {
                const resultB64 = await generateProImage(prompt, '1K');
                if(resultB64) {
                    setContent(prev => prev + `\n\n![Generated Image](data:image/png;base64,${resultB64})`);
                }
            }
        } catch(e) {
            alert("AI Action Failed. Try again.");
        } finally {
            setLoadingAction(null);
            setEditMode(null);
        }
    };

    // Auto-save debounce
    useEffect(() => {
        const t = setTimeout(() => {
            onSave({ ...note, title, content, updatedAt: Date.now() });
        }, 1000);
        return () => clearTimeout(t);
    }, [title, content]);

    return (
        <div className="h-full flex flex-col bg-nexus-900 text-white overflow-hidden relative">
            {/* Toolbar */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-nexus-900/80 backdrop-blur z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><ArrowLeft size={20} /></button>
                    <input 
                        value={title} 
                        onChange={e => setTitle(e.target.value)}
                        className="bg-transparent text-xl font-bold focus:outline-none placeholder-slate-600 w-full lg:w-96"
                        placeholder="Untitled Note"
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setEditMode('generate')} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20">
                        <ImageIcon size={14}/> Generate Img
                    </button>
                    <div className="relative group">
                         <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-nexus-accent/10 text-nexus-accent border border-nexus-accent/20 hover:bg-nexus-accent/20">
                            <Sparkles size={14}/> AI Tools
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-nexus-800 border border-white/10 rounded-xl shadow-xl overflow-hidden hidden group-hover:block">
                            <button onClick={() => setEditMode('analyze')} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-slate-300">Analyze Image</button>
                            <button onClick={() => setEditMode('edit')} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-slate-300">Edit Image</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-4xl mx-auto w-full">
                <textarea 
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full h-full bg-transparent resize-none focus:outline-none text-lg leading-relaxed text-slate-300 placeholder-slate-700 font-sans"
                    placeholder="Start writing..."
                />
            </div>

            {/* AI Modal Overlay */}
            {editMode && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-nexus-800 p-6 rounded-2xl w-96 border border-white/10 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold capitalize">{editMode} Image</h3>
                        
                        {(editMode === 'analyze' || editMode === 'edit') && (
                            <input type="file" ref={fileInputRef} accept="image/*" className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"/>
                        )}
                        
                        <textarea 
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder={editMode === 'analyze' ? "Ask something about the image..." : "Describe the change or image generation..."}
                            className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-nexus-accent focus:outline-none"
                        />

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditMode(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                            <button 
                                onClick={handleAction} 
                                disabled={loadingAction !== null}
                                className="px-4 py-2 text-sm bg-nexus-accent text-black font-bold rounded-lg hover:bg-nexus-accent/80 flex items-center gap-2"
                            >
                                {loadingAction ? <Loader2 className="animate-spin" size={14}/> : 'Run'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main App ---
export default function App() {
  const [view, setView] = useState<NexusView>(NexusView.NOTES);
  const [notes, setNotes] = useState<Note[]>(SAMPLE_NOTES);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleNoteSave = (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      content: '',
      type: 'text',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setView(NexusView.EDITOR);
  };

  return (
    <div className="flex h-screen bg-black text-white selection:bg-nexus-accent/30 selection:text-nexus-accent">
      <Sidebar view={view} setView={(v) => {
          setView(v);
          setActiveNoteId(null);
      }} />

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b border-white/10 bg-nexus-900/50 backdrop-blur-md flex items-center justify-between px-6 z-20">
             <div className="flex-1 max-w-xl relative hidden md:block">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-nexus-accent/50 transition-all" placeholder="Semantic search..."/>
             </div>
             <button onClick={() => setShowChat(!showChat)} className="ml-4 p-2 text-slate-400 hover:text-white bg-white/5 rounded-full border border-white/5 hover:border-nexus-accent/50 transition-all">
                <BrainCircuit size={20} />
             </button>
        </header>

        {/* Content Views */}
        <div className="flex-1 relative overflow-hidden">
            {view === NexusView.NOTES && !activeNoteId && (
                <div className="p-8 h-full overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <button onClick={createNote} className="group h-64 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:border-nexus-accent/50 hover:bg-nexus-accent/5 transition-all">
                            <div className="p-4 rounded-full bg-white/5 group-hover:bg-nexus-accent/20 text-slate-400 group-hover:text-nexus-accent transition-all mb-4">
                                <Plus size={32} />
                            </div>
                            <span className="font-medium">New Note</span>
                        </button>
                        {notes.map(note => (
                            <div key={note.id} onClick={() => { setActiveNoteId(note.id); setView(NexusView.EDITOR); }} className="h-64 bg-nexus-800/50 border border-white/5 rounded-2xl p-6 hover:shadow-[0_0_20px_rgba(56,189,248,0.1)] hover:border-nexus-accent/30 transition-all cursor-pointer group flex flex-col">
                                <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-nexus-accent transition-colors">{note.title || 'Untitled'}</h3>
                                <p className="text-slate-400 text-sm line-clamp-4 flex-1">{note.content}</p>
                                <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
                                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                                    {note.type !== 'text' && <span className="px-2 py-1 rounded bg-white/5 capitalize">{note.type}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === NexusView.EDITOR && activeNoteId && (
                <Editor 
                    note={notes.find(n => n.id === activeNoteId)!} 
                    onSave={handleNoteSave}
                    onBack={() => { setActiveNoteId(null); setView(NexusView.NOTES); }}
                />
            )}

            {view === NexusView.VEO_STUDIO && <VeoStudio />}
            
            {view === NexusView.LIVE_VOICE && <LiveSession onClose={() => setView(NexusView.NOTES)} />}
        </div>
      </main>

      {/* Chat Overlay */}
      <AIChatOverlay isOpen={showChat} onClose={() => setShowChat(false)} />
    </div>
  );
}