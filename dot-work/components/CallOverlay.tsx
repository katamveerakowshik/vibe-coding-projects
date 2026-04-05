import React, { useState, useEffect, useRef } from 'react';
import { Note, UrgencyLevel, NoteType } from '../types';
import { Phone, PhoneOff, Video, Mic, Calendar } from 'lucide-react';
import WaveVisualizer from './WaveVisualizer';
import { generateSpeech } from '../services/geminiService';

interface CallProps {
  note: Note;
  onDismiss: () => void;
  onAnswer: () => void;
}

const CallOverlay: React.FC<CallProps> = ({ note, onDismiss, onAnswer }) => {
  const [isAnswered, setIsAnswered] = useState(false);
  const isCritical = note.urgency === UrgencyLevel.CRITICAL;
  
  // Audio Refs
  const ringtoneCtxRef = useRef<AudioContext | null>(null);
  const ringtoneOscRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    // 1. Vibration Loop
    if (navigator.vibrate) {
        const vibrate = () => navigator.vibrate([1000, 500, 1000, 500, 1500]);
        vibrate();
        const interval = setInterval(vibrate, 4000);
        return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    // 2. Ringtone Synthesis (Sine wave pulse)
    try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        ringtoneCtxRef.current = ctx;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        
        // Pulse effect
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        ringtoneOscRef.current = osc;
    } catch (e) {
        console.error("Audio Context Error", e);
    }

    return () => {
        ringtoneOscRef.current?.stop();
        ringtoneCtxRef.current?.close();
    };
  }, []);

  const playRawAudio = async (base64Data: string) => {
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx({ sampleRate: 24000 }); 
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < channelData.length; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
      } catch (e) {
          console.error("Playback Error", e);
      }
  };

  const handleAnswer = async () => {
    setIsAnswered(true);
    onAnswer(); 
    
    // Stop Ringtone/Vibration
    ringtoneOscRef.current?.stop();
    ringtoneCtxRef.current?.close();
    if (navigator.vibrate) navigator.vibrate(0);

    // Play Content
    if (note.type === NoteType.AUDIO && note.mediaUrl) {
         // Play stored recording
         const base64 = note.mediaUrl.replace('data:audio/wav;base64,', ''); 
         const audio = new Audio(`data:audio/wav;base64,${base64}`);
         audio.play();
    } else {
        // TTS the content
        // Strip HTML from content for TTS
        const textContent = new DOMParser().parseFromString(note.content, 'text/html').body.textContent || note.title;
        const ttsData = await generateSpeech(`Reminder: ${note.title}. ${textContent}`);
        if (ttsData) {
            playRawAudio(ttsData);
        }
    }
  };

  if (isAnswered) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
        <button onClick={onDismiss} className="absolute top-6 right-6 text-white/50 hover:text-white">
          <PhoneOff size={32} />
        </button>
        
        {/* Answered Content State */}
        <div className="w-full max-w-2xl text-center space-y-6">
          <h1 className={`text-4xl font-bold ${isCritical ? 'text-red-500' : 'text-[#D946EF]'}`}>
            {note.title}
          </h1>
          
          <div className="flex flex-col items-center gap-4">
             <div className="w-32 h-32 rounded-full bg-[#D946EF]/20 flex items-center justify-center animate-pulse">
                <Mic size={48} className="text-[#D946EF]" />
             </div>
             <p className="text-white/60">Playing {note.type === NoteType.AUDIO ? 'Audio Recording' : 'Voice Assistant'}...</p>
             <WaveVisualizer isPlaying={true} urgency={note.urgency} className="w-full max-w-md h-24" />
          </div>

          <div className="p-8 rounded-2xl border border-white/20 bg-white/5 text-xl max-h-[40vh] overflow-y-auto text-left">
             <div dangerouslySetInnerHTML={{ __html: note.content }} />
          </div>

          <button 
             onClick={onDismiss}
             className="px-8 py-3 bg-[#121212] border border-white/20 hover:bg-white/10 rounded-full text-white mt-8 transition-colors"
          >
            Mark Complete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between py-20 px-6">
      {/* Caller Info */}
      <div className="flex flex-col items-center space-y-4 animate-bounce-slow w-full max-w-md">
        <div className={`w-40 h-40 rounded-full flex items-center justify-center shadow-[0_0_50px_currentColor] ${
            isCritical ? 'bg-red-500/20 text-red-500 animate-pulse-red' : 'bg-[#D946EF]/20 text-[#D946EF] animate-pulse-purple'
        }`}>
           {note.coverImageUrl ? (
               <img src={note.coverImageUrl} className="w-full h-full rounded-full object-cover border-4 border-black" />
           ) : (
               <Calendar size={64} />
           )}
        </div>
        <div className="text-center w-full">
          <h2 className="text-white/60 text-lg uppercase tracking-widest mb-1">Incoming Urgent Call</h2>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">{note.title}</h1>
          <div className="text-white/60 bg-white/5 backdrop-blur-md p-4 rounded-xl text-sm border border-white/10 text-left max-h-32 overflow-hidden relative">
             <div dangerouslySetInnerHTML={{ __html: note.content }} className="line-clamp-3" />
             <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Action Slider / Buttons */}
      <div className="flex gap-16 items-center">
        {/* Decline */}
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={onDismiss}
            className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_30px_rgba(239,68,68,0.4)]"
          >
            <PhoneOff className="text-white" size={32} />
          </button>
          <span className="text-sm font-medium text-white/50">Decline</span>
        </div>

        {/* Accept */}
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={handleAnswer}
            className="w-20 h-20 rounded-full bg-[#39FF14] flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_30px_rgba(57,255,20,0.4)] animate-pulse"
          >
            <Phone className="text-black" size={32} />
          </button>
          <span className="text-sm font-medium text-white/50">Answer</span>
        </div>
      </div>
    </div>
  );
};

export default CallOverlay;
