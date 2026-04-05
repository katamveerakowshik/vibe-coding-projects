import React, { useState, useRef, useEffect } from 'react';
import { askOracle } from '../../services/geminiService';
import { Send, X, Globe, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  appContext: string;
}

const Oracle: React.FC<Props> = ({ isOpen, onClose, onOpen, appContext }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse('');
    
    const answer = await askOracle(query, appContext);
    setResponse(answer);
    setLoading(false);
  };

  // Custom Eye Logo for Button
  const OracleEye = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 5V3M12 21v-2M5 12H3M21 12h-2" opacity="0.5" />
    </svg>
  );

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={onOpen}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#0f0a1e] border border-cyan-500/50 rounded-full flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-110 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 group"
        >
          <div className="group-hover:animate-pulse">
             <OracleEye />
          </div>
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center sm:p-4 pointer-events-none">
          <div className="pointer-events-auto w-full sm:max-w-lg h-[80vh] sm:h-auto bg-[#0f0a1e] border-t sm:border border-cyan-500/30 sm:rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
            
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-cyan-900/20 to-purple-900/20">
              <div className="flex items-center gap-3">
                <div className="text-cyan-400">
                  <OracleEye />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg tracking-wide">The Oracle</h3>
                  <p className="text-[10px] text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                    <Globe size={10} /> Search Grounded
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto min-h-[300px]">
              {!response && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-white/30 text-center space-y-4">
                    <Sparkles size={40} className="opacity-50" />
                    <p>I see all. Ask me anything.</p>
                </div>
              )}

              {loading && (
                <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                </div>
              )}

              {response && (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="whitespace-pre-wrap">{response}</div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                  placeholder="Ask The Oracle..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button 
                  onClick={handleAsk}
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Oracle;
