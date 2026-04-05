import React, { useState, useRef, useEffect } from 'react';
import { orbitChat, searchWeb } from '../services/geminiService';
import { Note } from '../types';
import { Send, X, Globe, Database } from 'lucide-react';

interface OrbitProps {
  notes: Note[];
}

const OrbitAssistant: React.FC<OrbitProps> = ({ notes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'orbit', text: string}[]>([
    { role: 'orbit', text: 'Orbit Neural Link Active.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useWeb, setUseWeb] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    let responseText = "";
    if (useWeb) {
        responseText = await searchWeb(userMsg);
    } else {
        const result = await orbitChat(userMsg, notes);
        responseText = result.text;
    }

    setMessages(prev => [...prev, { role: 'orbit', text: responseText }]);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Orb - Unique Creative Logo */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 flex items-center justify-center z-50 group"
        >
           {/* New Wow Factor Logo: The "Cosmic Eye" */}
           <div className="relative w-full h-full">
               {/* Pulse Ring */}
               <div className="absolute inset-0 bg-[#D946EF] blur-xl opacity-30 rounded-full animate-pulse-purple"></div>
               
               <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(217,70,239,0.9)]">
                  {/* Outer Triangle Rotating */}
                  <path d="M50 10 L90 80 L10 80 Z" stroke="#6366f1" strokeWidth="2" fill="none" className="animate-[spin_6s_linear_infinite]" style={{transformOrigin: '50px 50px'}} />
                  
                  {/* Inner Circle pulsating */}
                  <circle cx="50" cy="50" r="25" stroke="#D946EF" strokeWidth="3" fill="none" className="animate-[pulse_2s_ease-in-out_infinite]" />
                  
                  {/* Core Eye */}
                  <circle cx="50" cy="50" r="10" fill="#fff" className="animate-bounce" />
               </svg>
           </div>
           
           <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-[#0A0A0C] border border-[#D946EF]/30 text-[#D946EF] text-xs px-2 py-1 rounded shadow-lg backdrop-blur font-bold">ORBIT</span>
        </button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] flex flex-col glass-panel-heavy rounded-2xl z-50 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-[#D946EF]/20 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0A0A0C]/90">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D946EF] to-[#6366f1] flex items-center justify-center">
                   <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
               </div>
               <div>
                  <h3 className="font-bold tracking-widest text-white text-sm">ORBIT</h3>
                  <p className="text-[10px] text-[#D946EF]">FLASH LITE ENABLED</p>
               </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/30 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                   className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-[#1a1a1a] text-white border border-white/10' 
                      : 'bg-[#D946EF]/10 text-white border border-[#D946EF]/20 shadow-[0_0_15px_rgba(217,70,239,0.05)]'
                   }`}
                   dangerouslySetInnerHTML={{ __html: m.text }} 
                />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                 <div className="flex items-center gap-1 text-[#D946EF] text-xs pl-2">
                   <span className="w-1 h-1 bg-[#D946EF] rounded-full animate-ping"></span>
                   <span className="w-1 h-1 bg-[#D946EF] rounded-full animate-ping delay-75"></span>
                   <span className="w-1 h-1 bg-[#D946EF] rounded-full animate-ping delay-150"></span>
                 </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10 bg-[#0A0A0C]">
             <div className="flex justify-center mb-2">
                <div className="flex bg-black/50 p-1 rounded-full border border-white/5">
                    <button 
                       onClick={() => setUseWeb(false)}
                       className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${!useWeb ? 'bg-[#D946EF] text-white' : 'text-white/40 hover:text-white'}`}
                    >
                        <Database size={12} /> Notes
                    </button>
                    <button 
                       onClick={() => setUseWeb(true)}
                       className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${useWeb ? 'bg-[#D946EF] text-white' : 'text-white/40 hover:text-white'}`}
                    >
                        <Globe size={12} /> Search
                    </button>
                </div>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={useWeb ? "Search the web..." : "Query your notes..."}
                className="flex-1 bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D946EF] transition-colors placeholder:text-white/20"
              />
              <button 
                onClick={handleSend}
                disabled={loading}
                className="bg-gradient-to-r from-[#D946EF] to-[#6366f1] text-white p-3 rounded-xl hover:shadow-[0_0_15px_#D946EF] disabled:opacity-50 transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrbitAssistant;
