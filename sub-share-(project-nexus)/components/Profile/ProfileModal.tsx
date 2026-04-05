import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { X, User as UserIcon, Save, Camera, Mail, ShieldCheck, Wallet, Plus, CreditCard } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (updatedUser: Partial<User>) => void;
}

const ProfileModal: React.FC<Props> = ({ isOpen, onClose, user, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [balance, setBalance] = useState(user.walletBalance);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdate({
      name,
      email,
      avatarUrl,
      walletBalance: balance
    });
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addMoney = () => {
    setBalance(prev => prev + 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#0f0a1e] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[100%] bg-gradient-to-b from-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-2">
             <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
               <ShieldCheck size={16} className="text-emerald-400" />
             </div>
             <h3 className="text-lg font-bold text-white tracking-wide">Verified Identity</h3>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-8 relative z-10 max-h-[70vh] overflow-y-auto">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div 
                className="w-24 h-24 rounded-full border-4 border-[#1a1527] shadow-xl flex items-center justify-center overflow-hidden"
                style={{ 
                  background: avatarUrl ? `url(${avatarUrl}) center/cover` : user.avatarGradient 
                }}
              >
                {!avatarUrl && <UserIcon size={40} className="text-white/50" />}
              </div>
              
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
              
              {/* Online Indicator */}
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#0f0a1e] rounded-full flex items-center justify-center">
                 <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0f0a1e]" />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
            <p className="mt-2 text-xs text-white/40">Tap to update photo</p>
          </div>

          {/* Identity Fields */}
          <div className="space-y-4">
            <div className="group">
               <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1 block">Display Name</label>
               <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-cyan-500/50 transition-colors">
                  <UserIcon size={18} className="text-white/30 group-focus-within:text-cyan-400" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent border-none text-white focus:outline-none w-full font-medium"
                  />
               </div>
            </div>

            <div className="group">
               <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1 block">Email Address</label>
               <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-cyan-500/50 transition-colors">
                  <Mail size={18} className="text-white/30 group-focus-within:text-cyan-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-transparent border-none text-white focus:outline-none w-full font-medium"
                  />
               </div>
            </div>
          </div>

          {/* Wallet Section */}
          <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-2xl p-5 border border-white/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Wallet size={100} />
             </div>
             
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-2">
                 <span className="text-xs text-white/60">SubShare Wallet</span>
                 <CreditCard size={16} className="text-white/40" />
               </div>
               <div className="text-3xl font-bold text-white mb-4 font-mono">
                 ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
               </div>
               
               <button 
                 onClick={addMoney}
                 className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-xs font-bold text-white border border-white/10 transition-colors"
               >
                 <Plus size={14} /> Add Funds
               </button>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/20">
          <button 
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileModal;
