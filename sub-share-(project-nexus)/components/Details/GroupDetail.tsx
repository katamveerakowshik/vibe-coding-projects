import React, { useState, useEffect, useRef } from 'react';
import { Group, ChatMessage, User } from '../../types';
import { verifyPaymentScreenshot, checkChatSafety } from '../../services/geminiService';
import { ArrowLeft, Send, ShieldCheck, AlertTriangle, Loader2, CheckCircle, Lock, CreditCard, Share2, FileText, QrCode, X } from 'lucide-react';

interface Props {
  group: Group;
  currentUser: User;
  onBack: () => void;
}

const GroupDetail: React.FC<Props> = ({ group, currentUser, onBack }) => {
  const costPerHead = group.totalCost / group.maxSlots;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'sys-1',
      senderId: 'system',
      senderName: 'SubShare Core',
      text: `Welcome to ${group.name}. Verified Plan: ${group.planName}. Pay ₹${costPerHead.toFixed(0)} to join.`,
      timestamp: Date.now(),
      isSystem: true
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Safety Agent Check
    const isUnsafe = await checkChatSafety(newMsg.text);
    if (isUnsafe) {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, isBlurred: true } : m));
      addSystemMessage("Safety Alert: Offline payment attempts are not protected. Message blurred.", true);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        text: 'Payment Proof Uploaded',
        attachment: base64,
        timestamp: Date.now(),
        verificationStatus: 'pending'
      };
      
      setMessages(prev => [...prev, userMsg]);
      setIsVerifying(true);

      const result = await verifyPaymentScreenshot(base64, costPerHead);
      
      setIsVerifying(false);
      
      if (result.isValid) {
        setMessages(prev => prev.map(m => m.id === userMsg.id ? { 
          ...m, 
          verificationStatus: 'verified',
          analysisDetails: result.analysis 
        } : m));
        addSystemMessage(`Payment Verified. TxID: ${result.transactionId || 'XXXX'}. Credentials Unlocked.`);
        setIsUnlocked(true);
      } else {
        setMessages(prev => prev.map(m => m.id === userMsg.id ? { 
          ...m, 
          verificationStatus: 'failed',
          analysisDetails: result.analysis || result.reason 
        } : m));
        addSystemMessage(`Verification Failed: ${result.reason || "Invalid Screenshot"}. Try again.`, true);
      }
    };
    reader.readAsDataURL(file);
  };

  const addSystemMessage = (text: string, isError = false) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: 'system',
      senderName: 'SubShare Core',
      text,
      timestamp: Date.now(),
      isSystem: true
    }]);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-black/40 backdrop-blur-xl md:rounded-3xl md:h-[90vh] md:my-auto md:border md:border-white/10 overflow-hidden shadow-2xl">
      
      {/* QR Code Modal */}
      {showQr && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center relative">
              <button onClick={() => setShowQr(false)} className="absolute top-4 right-4 text-black/50 hover:text-black">
                 <X size={24} />
              </button>
              <h3 className="text-xl font-bold text-black mb-2">Scan to Pay</h3>
              <p className="text-sm text-gray-500 mb-4">Send ₹{Math.ceil(costPerHead)} to {group.creatorName}</p>
              
              <div className="bg-gray-100 p-4 rounded-xl mx-auto mb-4 border-2 border-dashed border-gray-300">
                {group.qrCodeUrl ? (
                   <img src={group.qrCodeUrl} alt="QR Code" className="w-full mix-blend-multiply" />
                ) : (
                   <div className="w-full h-48 flex items-center justify-center text-gray-400 italic">No QR available</div>
                )}
              </div>
              
              <p className="text-xs text-gray-400">Supported: GPay, PhonePe, Paytm</p>
           </div>
        </div>
      )}

      {/* Header */}
      <div 
        className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md z-20 relative overflow-hidden"
      >
        {/* Background Image Overlay if present */}
        {group.imageUrl && (
            <div 
                className="absolute inset-0 opacity-40 z-[-1]"
                style={{ background: `url(${group.imageUrl}) center/cover` }}
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80 z-[-1]" />

        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center relative z-10">
          <h2 className="text-white font-bold text-sm drop-shadow-lg">{group.name}</h2>
          <span className="text-[10px] text-white/70">{group.filledSlots}/{group.maxSlots} Members • {group.planName}</span>
        </div>
        <button 
          onClick={() => setShowQr(true)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-cyan-400"
          title="Show QR"
        >
          <QrCode size={20} />
        </button>
      </div>

      {/* Credentials Card */}
      <div className={`
        mx-4 mt-4 p-4 rounded-xl border transition-all duration-700
        ${isUnlocked 
          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/50' 
          : 'bg-white/5 border-white/10 opacity-70'}
      `}>
        <div className="flex items-center gap-3 mb-2">
          {isUnlocked ? <CheckCircle className="text-emerald-400" size={20} /> : <Lock className="text-white/40" size={20} />}
          <span className={`text-sm font-bold uppercase tracking-wider ${isUnlocked ? 'text-emerald-400' : 'text-white/40'}`}>
            {isUnlocked ? 'Credentials Unlocked' : 'Credentials Locked'}
          </span>
        </div>
        
        {isUnlocked ? (
          <div className="space-y-1 animate-in fade-in slide-in-from-top-4 duration-700">
            <p className="text-xs text-white/60">Email: <span className="text-white font-mono select-all">share_{group.id}@gmail.com</span></p>
            <p className="text-xs text-white/60">Pass: <span className="text-white font-mono select-all">SafeShare#{new Date().getFullYear()}</span></p>
          </div>
        ) : (
          <p className="text-xs text-white/40">Verify payment of ₹{Math.ceil(costPerHead)} to unlock access.</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`
                max-w-[80%] rounded-2xl p-3 text-sm relative
                ${msg.isSystem ? 'bg-blue-500/10 border border-blue-500/20 text-blue-200 self-center text-center w-full animate-slide-up-fade' : 
                  isMe ? 'bg-white/10 text-white rounded-tr-none border border-white/10 animate-scale-in' : 
                  'bg-black/40 text-white/80 rounded-tl-none border border-white/5 animate-slide-up-fade'}
              `}>
                {msg.isBlurred ? (
                  <div className="filter blur-sm select-none opacity-50">{msg.text}</div>
                ) : (
                  msg.text
                )}

                {msg.attachment && (
                  <div className="mt-2 space-y-2">
                    <div className="relative rounded-lg overflow-hidden border border-white/10">
                      <img src={msg.attachment} alt="proof" className="w-full h-32 object-cover" />
                      {msg.verificationStatus === 'pending' && (
                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2">
                           <Loader2 className="animate-spin text-cyan-400" size={20} />
                           <span className="text-xs text-cyan-400 font-bold">Checking...</span>
                         </div>
                      )}
                      {msg.verificationStatus === 'verified' && (
                        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                          <ShieldCheck className="text-emerald-400" size={32} />
                        </div>
                      )}
                    </div>
                    {msg.analysisDetails && (
                       <div className="bg-black/40 rounded-lg p-3 text-xs text-white/80 border border-white/5">
                          <div className="whitespace-pre-line">{msg.analysisDetails}</div>
                       </div>
                    )}
                  </div>
                )}
              </div>
              {!msg.isSystem && <span className="text-[10px] text-white/30 mt-1 px-1">{msg.senderName}</span>}
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-black/20 backdrop-blur-xl border-t border-white/10 z-20">
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleImageUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-cyan-400 border border-white/5 transition-colors"
          >
            {isVerifying ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={20} />}
          </button>
          
          <div className="flex-1 relative">
             <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type message..."
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <button 
            onClick={handleSendMessage}
            className="p-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-xl border border-cyan-500/50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
