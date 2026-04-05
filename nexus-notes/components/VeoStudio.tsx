import React, { useState } from 'react';
import { generateVideo, blobToBase64 } from '../services/geminiService';
import { Video, Loader2, Upload, Play, Film } from 'lucide-react';

export const VeoStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [aspect, setAspect] = useState<'16:9' | '9:16'>('16:9');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setVideoUrl(null);
    try {
      let base64Img = undefined;
      if (referenceImage) {
        base64Img = await blobToBase64(referenceImage);
      }
      const url = await generateVideo(prompt, aspect, base64Img);
      setVideoUrl(url);
    } catch (e) {
      console.error(e);
      alert("Veo generation failed. Please try again or check API limits.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 h-full p-8 overflow-y-auto bg-gradient-to-br from-nexus-900 to-black text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
            <div className="p-3 bg-nexus-accent/20 rounded-xl text-nexus-accent">
                <Film size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Veo Studio</h1>
                <p className="text-slate-400">Cinematic video generation powered by Google Veo 3.1</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Controls */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Prompt</label>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A neon hologram of a cat driving at top speed..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 h-32 focus:ring-2 focus:ring-nexus-accent focus:outline-none transition-all resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setAspect('16:9')}
                        className={`p-3 rounded-lg border text-sm transition-all ${aspect === '16:9' ? 'bg-nexus-accent/20 border-nexus-accent text-nexus-accent' : 'border-white/10 hover:bg-white/5'}`}
                    >
                        Landscape (16:9)
                    </button>
                    <button 
                        onClick={() => setAspect('9:16')}
                        className={`p-3 rounded-lg border text-sm transition-all ${aspect === '9:16' ? 'bg-nexus-accent/20 border-nexus-accent text-nexus-accent' : 'border-white/10 hover:bg-white/5'}`}
                    >
                        Portrait (9:16)
                    </button>
                </div>

                <div className="space-y-2">
                     <label className="text-sm font-medium text-slate-300">Reference Image (Optional)</label>
                     <div className="border border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/5 transition-all relative">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setReferenceImage(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Upload className="mx-auto mb-2 text-slate-400" size={20} />
                        <p className="text-xs text-slate-500">{referenceImage ? referenceImage.name : "Drop image to animate"}</p>
                     </div>
                </div>

                <button 
                    disabled={loading || !prompt}
                    onClick={handleGenerate}
                    className="w-full py-4 bg-gradient-to-r from-nexus-accent to-nexus-glow rounded-xl font-bold text-black shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Video />}
                    Generate Video
                </button>
            </div>

            {/* Preview */}
            <div className="bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center min-h-[400px] relative overflow-hidden group">
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                        <Loader2 className="w-12 h-12 text-nexus-accent animate-spin mb-4" />
                        <p className="text-nexus-accent animate-pulse">Dreaming up frames...</p>
                        <p className="text-xs text-slate-500 mt-2">This may take a minute</p>
                    </div>
                )}
                
                {videoUrl ? (
                    <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                ) : (
                    <div className="text-center text-slate-600">
                        <Film size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No video generated yet.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};