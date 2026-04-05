import React, { useState } from 'react';
import { User } from '../../types';
import { generateGradient, USER_STORAGE_KEY } from '../../constants';
import { Lock, Mail, User as UserIcon, ArrowRight } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate Auth
    const finalName = name || email.split('@')[0];
    const newUser: User = {
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      name: finalName,
      email: email,
      avatarGradient: generateGradient(finalName),
      walletBalance: 0,
      isAuthenticated: true
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    onLogin(newUser);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-[#0f0f12] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2">{isLogin ? 'Welcome Back' : 'Join SubShare'}</h2>
          <p className="text-white/40 text-sm mb-8">Secure subscription coordination protocol.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="group">
                 <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-cyan-400 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-cyan-500/50 outline-none transition-colors"
                      required
                    />
                 </div>
              </div>
            )}

            <div className="group">
               <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-cyan-400 transition-colors" size={18} />
                  <input 
                    type="email" 
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-cyan-500/50 outline-none transition-colors"
                    required
                  />
               </div>
            </div>

            <div className="group">
               <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-cyan-400 transition-colors" size={18} />
                  <input 
                    type="password" 
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-cyan-500/50 outline-none transition-colors"
                    required
                  />
               </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 mt-6"
            >
              {isLogin ? 'Access Node' : 'Initialize Identity'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an identity? Create one." : "Already verified? Login."}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
