import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, List, CheckSquare, Type, Undo, Redo, Mic, Image, Calendar, Palette } from 'lucide-react';
import { generateCoverImage } from '../services/geminiService';

interface RichEditorProps {
  initialContent: string;
  noteTitle: string;
  onChange: (html: string) => void;
  onAudioRecord: () => void;
  onSetReminder: (date: number) => void;
  onUpdateCover: (url: string) => void;
  reminderTime?: number;
}

const RichEditor: React.FC<RichEditorProps> = ({ 
  initialContent, noteTitle, onChange, onAudioRecord, onSetReminder, onUpdateCover, reminderTime 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize content securely
  useEffect(() => {
    if (contentRef.current) {
        if (initialContent !== contentRef.current.innerHTML) {
            // Avoid resetting cursor position if the content is just user typing updates
            // Only update if external change (like AI completion)
            if (document.activeElement !== contentRef.current) {
                contentRef.current.innerHTML = initialContent;
            } else if (!contentRef.current.innerHTML) {
                 contentRef.current.innerHTML = initialContent;
            }
        }
    }
  }, [initialContent]);

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (contentRef.current) onChange(contentRef.current.innerHTML);
  };

  const insertCheckbox = () => {
    const id = Date.now();
    const html = `<div class="task-item"><input type="checkbox" id="chk-${id}" onclick="this.parentElement.classList.toggle('checked')"> <label for="chk-${id}">Task Item</label></div><br>`;
    document.execCommand('insertHTML', false, html);
    if (contentRef.current) onChange(contentRef.current.innerHTML);
  };

  const handleInput = () => {
    if (contentRef.current) onChange(contentRef.current.innerHTML);
  };

  const handleGenImage = async (size: '1K' | '2K' | '4K') => {
      setIsGenerating(true);
      // Use title or first 100 chars of content
      const prompt = noteTitle && noteTitle !== "New Idea" ? noteTitle : (contentRef.current?.innerText.slice(0, 100) || "Abstract Idea");
      const url = await generateCoverImage(prompt, size);
      if (url) {
          onUpdateCover(url);
          setShowImageGen(false);
      }
      setIsGenerating(false);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 border-b border-white/10 bg-[#0f0f11] z-10">
        <button onClick={() => exec('bold')} className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-[#D946EF]" title="Bold"><Bold size={16}/></button>
        <button onClick={() => exec('italic')} className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-[#D946EF]" title="Italic"><Italic size={16}/></button>
        <div className="w-px h-4 bg-white/20 mx-1"></div>
        <button onClick={() => exec('formatBlock', 'H2')} className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-[#D946EF]" title="Heading"><Type size={16}/></button>
        <button onClick={() => exec('insertUnorderedList')} className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-[#D946EF]" title="List"><List size={16}/></button>
        <button onClick={insertCheckbox} className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-[#D946EF]" title="Task"><CheckSquare size={16}/></button>
        <div className="w-px h-4 bg-white/20 mx-1"></div>
        <button onClick={() => exec('undo')} className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-[#D946EF]" title="Undo"><Undo size={16}/></button>
        
        <div className="flex-1"></div>
        
        {/* Image Gen Trigger */}
        <button 
            onClick={() => setShowImageGen(!showImageGen)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${showImageGen ? 'border-[#D946EF] text-[#D946EF]' : 'border-white/10 hover:border-white/30 text-white/60'}`}
        >
            <Palette size={14} /> Art
        </button>

        {/* Reminder Trigger */}
        <button 
           onClick={() => setShowDatePicker(!showDatePicker)} 
           className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${reminderTime ? 'border-[#D946EF] text-[#D946EF]' : 'border-white/10 hover:border-white/30 text-white/60'}`}
        >
           <Calendar size={14}/> {reminderTime ? new Date(reminderTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Reminder'}
        </button>

        <button onClick={onAudioRecord} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 border border-red-500/50 text-red-400 rounded hover:bg-red-500/20 text-xs font-medium">
           <Mic size={14}/> Record
        </button>
      </div>

      {/* Popovers */}
      {(showDatePicker || showImageGen) && (
          <div className="absolute top-12 right-2 z-30 bg-[#1a1a1a] border border-white/20 rounded-xl p-3 shadow-2xl flex flex-col gap-2 animate-in slide-in-from-top-2">
             {showDatePicker && (
                <div className="flex flex-col gap-2">
                    <span className="text-xs text-white/40 font-bold">SET ALERT</span>
                    <input 
                      type="datetime-local" 
                      className="bg-black/50 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-[#D946EF] outline-none"
                      onChange={(e) => {
                         if(e.target.value) {
                            onSetReminder(new Date(e.target.value).getTime());
                            setShowDatePicker(false);
                         }
                      }}
                    />
                </div>
             )}
             {showImageGen && (
                 <div className="flex flex-col gap-2 min-w-[150px]">
                     <span className="text-xs text-white/40 font-bold">GENERATE COVER (Nano Banana Pro)</span>
                     {isGenerating ? (
                         <span className="text-xs text-[#D946EF] animate-pulse">Generating...</span>
                     ) : (
                         <div className="flex gap-1">
                             {['1K', '2K', '4K'].map((size) => (
                                 <button 
                                   key={size}
                                   onClick={() => handleGenImage(size as any)}
                                   className="flex-1 bg-white/5 hover:bg-[#D946EF] text-white text-xs py-1 rounded transition-colors border border-white/10"
                                 >
                                     {size}
                                 </button>
                             ))}
                         </div>
                     )}
                 </div>
             )}
          </div>
      )}

      {/* Editable Area */}
      <div 
        ref={contentRef}
        contentEditable
        className="prose-editor flex-1 p-6 overflow-y-auto text-white text-lg focus:outline-none leading-relaxed bg-[#0A0A0C]"
        onInput={handleInput}
        spellCheck={false}
        style={{ caretColor: '#D946EF' }}
      />
    </div>
  );
};

export default RichEditor;
