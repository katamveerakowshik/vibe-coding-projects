import React, { useEffect, useRef, useState } from 'react';
import { connectLiveSession, createPCM16Blob, base64ToUint8Array, decodeAudioData, blobToBase64 } from '../services/geminiService';
import { Mic, MicOff, X, Activity, Volume2 } from 'lucide-react';

interface LiveSessionProps {
  onClose: () => void;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [transcript, setTranscript] = useState<{in: string, out: string}>({in: '', out: ''});
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cleanup = false;

    const startSession = async () => {
      try {
        // Output Audio Context (24kHz for Gemini Live)
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // Input Audio Context (16kHz requirement)
        inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

        // Connect Gemini
        const session = await connectLiveSession(
          async (base64Audio) => {
            if (cleanup || !audioContextRef.current) return;
            // Play Audio
            const ctx = audioContextRef.current;
            const uint8 = base64ToUint8Array(base64Audio);
            const audioBuffer = await decodeAudioData(uint8, ctx);
            
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            
            const now = ctx.currentTime;
            // Schedule seamless playback
            const start = Math.max(now, nextStartTimeRef.current);
            source.start(start);
            nextStartTimeRef.current = start + audioBuffer.duration;
            
            visualizeAudio(true);
          },
          (inText, outText) => {
             setTranscript(prev => ({
                 in: inText ? prev.in + ' ' + inText : prev.in,
                 out: outText ? prev.out + ' ' + outText : prev.out
             }));
          },
          () => setIsConnected(false)
        );

        sessionRef.current = session;
        setIsConnected(true);

        // Setup Microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const source = inputContextRef.current.createMediaStreamSource(stream);
        const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = async (e) => {
          if (!micActive || cleanup) return;
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Downsample/Convert to PCM16 Blob
          const pcmBlob = createPCM16Blob(inputData);
          const base64Data = await blobToBase64(pcmBlob);

          session.sendRealtimeInput({ 
              media: { 
                  mimeType: 'audio/pcm;rate=16000', 
                  data: base64Data 
              } 
          });
          visualizeAudio(false);
        };

        source.connect(processor);
        processor.connect(inputContextRef.current.destination); // Required for script processor to run

      } catch (err) {
        console.error("Failed to start Live session", err);
        alert("Could not access microphone or connect to Gemini Live.");
        onClose();
      }
    };

    startSession();

    return () => {
      cleanup = true;
      sessionRef.current?.close(); // No direct close method on sessionPromise, but assuming handling via wrapper or implicit drop
      streamRef.current?.getTracks().forEach(t => t.stop());
      processorRef.current?.disconnect();
      audioContextRef.current?.close();
      inputContextRef.current?.close();
    };
  }, []);

  // Simple visualizer
  const visualizeAudio = (isOutput: boolean) => {
     const ctx = canvasRef.current?.getContext('2d');
     if(!ctx || !canvasRef.current) return;
     
     const w = canvasRef.current.width;
     const h = canvasRef.current.height;
     const color = isOutput ? '#818cf8' : '#38bdf8'; // Indigo vs Sky
     
     ctx.fillStyle = 'rgba(15, 23, 42, 0.1)'; // Fade out
     ctx.fillRect(0,0,w,h);
     
     ctx.beginPath();
     ctx.strokeStyle = color;
     ctx.lineWidth = 2;
     const y = h/2 + (Math.random() - 0.5) * 50;
     ctx.moveTo(0, h/2);
     ctx.lineTo(w, y);
     ctx.stroke();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl">
      <div className="w-full max-w-2xl p-8 flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300">
        
        {/* Visualizer Circle */}
        <div className="relative w-64 h-64 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-nexus-accent to-nexus-glow opacity-20 blur-3xl ${isConnected ? 'animate-pulse-slow' : ''}`}></div>
            <div className="w-48 h-48 bg-nexus-800/80 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl overflow-hidden relative">
               <canvas ref={canvasRef} width={192} height={192} className="absolute inset-0 opacity-60" />
               <Activity className={`w-16 h-16 text-white ${isConnected ? 'animate-pulse' : 'opacity-50'}`} />
            </div>
        </div>

        <div className="text-center space-y-2">
            <h2 className="text-3xl font-light text-white tracking-tight">Nexus Live</h2>
            <p className="text-slate-400">{isConnected ? "Listening..." : "Connecting..."}</p>
        </div>

        {/* Transcripts */}
        <div className="w-full h-32 overflow-y-auto bg-white/5 rounded-xl p-4 border border-white/10 text-sm space-y-2">
            {transcript.in && <p className="text-nexus-accent">You: {transcript.in.slice(-100)}</p>}
            {transcript.out && <p className="text-nexus-glow">Nexus: {transcript.out.slice(-100)}</p>}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
            <button 
                onClick={() => setMicActive(!micActive)}
                className={`p-4 rounded-full transition-all ${micActive ? 'bg-white text-black hover:scale-105' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}
            >
                {micActive ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
            <button 
                onClick={onClose}
                className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10"
            >
                <X size={24} />
            </button>
        </div>
      </div>
    </div>
  );
};