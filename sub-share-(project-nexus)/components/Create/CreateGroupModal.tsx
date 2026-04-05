import React, { useState } from 'react';
import { Category, Group, User, CategoryType } from '../../types';
import { optimizeGroupDetails, generateGroupImage } from '../../services/geminiService';
import { X, Sparkles, Wand2, DollarSign, Users, ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react';
import BrandLogo from '../Shared/BrandLogo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currentUser: User;
  onCreate: (newGroup: Group) => void;
}

const CreateGroupModal: React.FC<Props> = ({ isOpen, onClose, categories, currentUser, onCreate }) => {
  const [step, setStep] = useState(1);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalPrice, setTotalPrice] = useState<number | ''>('');
  const [maxSlots, setMaxSlots] = useState<number>(2);
  const [generatedImage, setGeneratedImage] = useState<string>('');
  
  const [isPolishing, setIsPolishing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  if (!isOpen) return null;

  const handlePolish = async () => {
    if (!title) return;
    setIsPolishing(true);
    const result = await optimizeGroupDetails(title, selectedCat?.type || 'General');
    setTitle(result.title);
    setDescription(result.description);
    setIsPolishing(false);
  };

  const handleGenerateImage = async () => {
    if (!title) return;
    setIsGeneratingImage(true);
    const imageBase64 = await generateGroupImage(title + " " + description);
    if (imageBase64) {
      setGeneratedImage(imageBase64);
    }
    setIsGeneratingImage(false);
  };

  const handleCreate = () => {
    if (!selectedCat || !title || !totalPrice) return;
    
    const newGroup: Group = {
      id: `g_${Date.now()}`,
      categoryId: selectedCat.id,
      type: selectedCat.type,
      name: title,
      description: description || `Join ${selectedCat.name} with me!`,
      imageUrl: generatedImage,
      planName: 'Standard Split',
      totalCost: Number(totalPrice),
      maxSlots: maxSlots,
      filledSlots: 1, // Creator
      currency: '₹',
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      status: 'OPEN'
    };
    
    onCreate(newGroup);
    onClose();
  };

  const perHead = totalPrice ? (Number(totalPrice) / maxSlots).toFixed(0) : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[#0f0a1e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {step === 1 ? 'Select Category' : 'Configure Node'}
            <span className="text-xs text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">Step {step}/2</span>
          </h2>
          <button onClick={onClose}><X className="text-white/50 hover:text-white" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* STEP 1: CATEGORY */}
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map(cat => (
                <div 
                  key={cat.id}
                  onClick={() => setSelectedCat(cat)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-105 flex flex-col items-center gap-3 text-center ${selectedCat?.id === cat.id ? 'bg-cyan-500/20 border-cyan-500' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                >
                  <BrandLogo service={cat.id} color={cat.color} />
                  <span className="text-sm font-bold text-white">{cat.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && selectedCat && (
            <div className="space-y-6">
              
              {/* Identity & Image Block */}
              <div className="flex gap-4">
                 <div className="flex-1 p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-4">
                    <BrandLogo service={selectedCat.id} color={selectedCat.color} />
                    <div>
                      <h3 className="text-white font-bold">{selectedCat.name}</h3>
                      <p className="text-xs text-white/50">{selectedCat.type} Protocol</p>
                    </div>
                 </div>
                 
                 {/* Image Generator Preview */}
                 <div className="w-20 h-20 rounded-xl bg-black/40 border border-white/10 overflow-hidden relative group">
                    {generatedImage ? (
                      <img src={generatedImage} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <ImageIcon size={24} />
                      </div>
                    )}
                 </div>
              </div>

              {/* Title & AI */}
              <div className="space-y-2">
                <label className="text-xs uppercase text-white/40 font-bold tracking-wider">Offer Title</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Netflix 4 Screens or Billboard Ad Split"
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none"
                  />
                  <button 
                    onClick={handlePolish}
                    disabled={!title || isPolishing}
                    className="bg-purple-600/20 border border-purple-500/50 text-purple-300 px-3 rounded-xl flex items-center gap-2 hover:bg-purple-600/30 transition-colors disabled:opacity-50"
                    title="Optimize Text"
                  >
                    {isPolishing ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs uppercase text-white/40 font-bold tracking-wider">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the plan details, duration, and benefits..."
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none h-20 resize-none"
                />
              </div>

              {/* Image Gen Button */}
              <button 
                 onClick={handleGenerateImage}
                 disabled={!title || isGeneratingImage}
                 className="w-full py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl text-pink-200 text-sm font-bold flex items-center justify-center gap-2 hover:bg-pink-500/30 transition-all"
              >
                 {isGeneratingImage ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                 Generate AI Cover Art
              </button>

              {/* Pricing Logic */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-xs uppercase text-white/40 font-bold tracking-wider flex items-center gap-1">
                      <DollarSign size={12}/> Total Price (₹)
                    </label>
                    <input 
                      type="number"
                      value={totalPrice}
                      onChange={(e) => setTotalPrice(Number(e.target.value))}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none font-mono text-lg"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs uppercase text-white/40 font-bold tracking-wider flex items-center gap-1">
                      <Users size={12}/> Total Slots
                    </label>
                    <div className="flex items-center bg-black/20 border border-white/10 rounded-xl px-2">
                      <button onClick={() => setMaxSlots(Math.max(2, maxSlots - 1))} className="p-3 text-white/50 hover:text-white">-</button>
                      <span className="flex-1 text-center font-mono text-white text-lg">{maxSlots}</span>
                      <button onClick={() => setMaxSlots(maxSlots + 1)} className="p-3 text-white/50 hover:text-white">+</button>
                    </div>
                 </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/30 rounded-xl flex justify-between items-center">
                 <div>
                   <p className="text-xs text-emerald-400 uppercase tracking-widest">Cost Per Person</p>
                   <p className="text-xs text-white/40">Includes your share</p>
                 </div>
                 <div className="text-3xl font-bold text-white font-mono">
                   ₹{perHead}<span className="text-sm text-white/40">/mo</span>
                 </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/20 flex justify-between">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="text-white/50 hover:text-white px-4">Back</button>
          ) : (
            <div />
          )}
          
          <button 
            onClick={() => step === 1 ? (selectedCat && setStep(2)) : handleCreate()}
            disabled={step === 1 && !selectedCat}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {step === 1 ? 'Next Step' : 'Publish Node'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
