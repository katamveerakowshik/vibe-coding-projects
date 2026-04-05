import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Image as ImageIcon, Sparkles, User, Loader2, Clock, MessageSquare, Trash2, Shield } from 'lucide-react';
import { ChatMessage, User as AppUser } from '../types';
import { firebaseService } from '../services/firebaseService';
import { geminiService } from '../services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CommunityChatProps {
  currentUser: AppUser | null;
  currentUserId: string | null;
  isAdmin?: boolean;
}

export const CommunityChat: React.FC<CommunityChatProps> = ({ currentUser, currentUserId, isAdmin }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToChat((newMessages) => {
      setMessages(newMessages);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !selectedImage) || !currentUserId || !currentUser) return;

    setIsSending(true);
    setError(null);
    try {
      const messageData = {
        userId: currentUserId,
        userName: currentUser.name || 'Scholar',
        userAvatar: currentUser.avatar || '🎓',
        text: inputText.trim() || (selectedImage ? "Shared an image" : ""),
        createdAt: Date.now(),
        ...(selectedImage && { imageUrl: selectedImage.data, imageCaption: "Community Update" })
      };

      // Check for document size limit (rough estimate for base64)
      if (selectedImage && selectedImage.data.length > 800000) {
        throw new Error("Image is too large. Please use a smaller image (max ~600KB).");
      }

      await firebaseService.sendChatMessage(messageData);
      setInputText('');
      setSelectedImage(null);
    } catch (err: any) {
      console.error("Failed to send message:", err);
      let errorMessage = "Failed to send message. Please try again.";
      
      try {
        const parsedError = JSON.parse(err.message);
        if (parsedError.error.includes("insufficient permissions")) {
          errorMessage = "Permission denied. Please ensure you are logged in correctly.";
        } else {
          errorMessage = parsedError.error;
        }
      } catch (e) {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({
          data: reader.result as string,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCaption = async () => {
    if (!selectedImage) return;
    setIsGeneratingCaption(true);
    try {
      const base64Data = selectedImage.data.split(',')[1];
      const caption = await geminiService.generateImageCaption(base64Data, selectedImage.mimeType);
      setInputText(caption);
    } catch (error) {
      console.error("Caption generation failed:", error);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[700px] glass-card overflow-hidden neon-border-cyan">
      {/* Header */}
      <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-cyan/10 rounded-lg text-neon-cyan">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="font-syne font-bold text-lg">COMMUNITY HUB</h2>
            <p className="text-[10px] text-text-muted uppercase tracking-widest">Global Mission Control</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {messages.slice(-3).map((m, i) => (
              <div key={m.id} className="w-6 h-6 rounded-full border-2 border-bg-void bg-white/10 flex items-center justify-center text-[10px] overflow-hidden">
                {m.userAvatar ? <span>{m.userAvatar}</span> : <User size={12} />}
              </div>
            ))}
          </div>
          <span className="text-[10px] font-bold text-neon-cyan ml-2">{messages.length} MESSAGES</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 relative">
        {!currentUserId && (
          <div className="absolute inset-0 z-10 bg-bg-void/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 bg-neon-cyan/10 rounded-full text-neon-cyan mb-4">
              <Shield size={32} />
            </div>
            <h3 className="text-xl font-syne font-bold mb-2">AUTHENTICATION REQUIRED</h3>
            <p className="text-text-muted text-sm max-w-xs mb-6">
              You must be logged into your mission profile to broadcast to the community.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.userId === currentUserId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className="flex-shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2",
                    isMe ? "border-neon-cyan/30 bg-neon-cyan/10" : "border-white/10 bg-white/5"
                  )}>
                    {msg.userAvatar || "👤"}
                  </div>
                </div>
                <div className={cn(
                  "space-y-1",
                  isMe ? "items-end" : "items-start"
                )}>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      {msg.userName}
                    </span>
                    <span className="text-[8px] text-text-muted">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl relative group",
                    isMe 
                      ? "bg-neon-cyan/10 border border-neon-cyan/20 rounded-tr-none text-neon-cyan" 
                      : "bg-white/5 border border-white/10 rounded-tl-none text-text-main"
                  )}>
                    {msg.imageUrl && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-white/10 shadow-2xl">
                        <img src={msg.imageUrl} alt="Shared content" className="max-w-full h-auto" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    
                    {isAdmin && (
                      <button 
                        className="absolute -top-2 -right-2 p-1 bg-red-500/20 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                        title="Delete Message"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/5 border-t border-white/10 space-y-4">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs flex items-center gap-2"
            >
              <Shield size={14} /> {error}
            </motion.div>
          )}
          {selectedImage && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20">
                <img src={selectedImage.data} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-0 right-0 p-1 bg-bg-void/80 text-white hover:text-red-500"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex-1">
                <button
                  onClick={generateCaption}
                  disabled={isGeneratingCaption}
                  className="flex items-center gap-2 text-[10px] font-bold text-neon-cyan hover:text-neon-cyan/80 transition-all"
                >
                  {isGeneratingCaption ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> ANALYZING...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> AUTO-GENERATE CAPTION
                    </>
                  )}
                </button>
                <p className="text-[8px] text-text-muted mt-1 uppercase">Gemini AI Vision Enabled</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSendMessage} className="flex gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-4 bg-white/5 border border-white/10 rounded-2xl text-text-muted hover:text-neon-cyan hover:border-neon-cyan/50 transition-all"
          >
            <ImageIcon size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Broadcast to the community..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:neon-border-cyan outline-none transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || isSending}
            className="p-4 bg-neon-cyan text-bg-void rounded-2xl shadow-glow-cyan hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
        
        <div className="flex justify-center">
          <p className="text-[8px] text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
            <Shield size={8} /> Secure End-to-End Mission Logs
          </p>
        </div>
      </div>
    </div>
  );
};
