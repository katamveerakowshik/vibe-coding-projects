import React from 'react';
import { Category, Group } from '../../types';
import BrandLogo from '../Shared/BrandLogo';
import { ArrowLeft, Plus, Shield } from 'lucide-react';

interface Props {
  category: Category;
  groups: Group[];
  onBack: () => void;
  onSelectGroup: (group: Group) => void;
  onCreateClick: () => void;
}

const GroupListing: React.FC<Props> = ({ category, groups, onBack, onSelectGroup, onCreateClick }) => {
  return (
    <div className="max-w-4xl mx-auto pt-24 px-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 animate-in slide-in-from-left-4 fade-in duration-500">
        <button onClick={onBack} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10">
          <ArrowLeft className="text-white" size={20} />
        </button>
        <div className="flex items-center gap-3">
           <BrandLogo service={category.id} color={category.color} className="w-10 h-10" />
           <div>
             <h1 className="text-3xl font-bold text-white">{category.name}</h1>
             <p className="text-xs text-white/40 uppercase tracking-widest">Active Nodes</p>
           </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm text-white/40 uppercase tracking-widest">{groups.length} Results</span>
        <button 
          onClick={onCreateClick}
          className="flex items-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-2 rounded-lg border border-cyan-500/30 text-cyan-400 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Create {category.name} Node
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => {
           const pricePerHead = group.totalCost / group.maxSlots;

           return (
             <div 
               key={group.id}
               onClick={() => onSelectGroup(group)}
               className="group relative bg-[#121214] border border-white/10 hover:border-cyan-500/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] overflow-hidden min-h-[160px] flex flex-col justify-between"
               style={{ 
                  background: group.imageUrl 
                    ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9)), url(${group.imageUrl}) center/cover` 
                    : undefined 
               }}
             >
               {/* Hover Glow (Only if no image, otherwise image transition) */}
               {!group.imageUrl && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
               )}

               <div className="flex justify-between items-start mb-4 relative z-10">
                 <div className="flex-1 mr-2">
                   <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors truncate drop-shadow-md">{group.name}</h3>
                   <p className="text-xs text-white/70 mt-1 line-clamp-2 h-8 drop-shadow-sm">{group.description}</p>
                 </div>
                 <div 
                    className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg backdrop-blur-md bg-black/30 border border-white/20"
                 >
                    {group.filledSlots}/{group.maxSlots}
                 </div>
               </div>

               <div className="flex items-end justify-between relative z-10 mt-4 border-t border-white/10 pt-4 backdrop-blur-sm bg-black/20 -mx-6 -mb-6 px-6 pb-6">
                 <div>
                   <div className="flex items-center gap-2 mb-1">
                     <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/20" />
                     <span className="text-xs text-white/80">Host: <span className="text-white">{group.creatorName}</span></span>
                   </div>
                 </div>
                 <div className="text-right">
                    <div className="text-2xl font-bold text-white drop-shadow-md">
                      {group.currency}{Math.ceil(pricePerHead)}
                      <span className="text-xs font-normal text-white/60">/p</span>
                    </div>
                 </div>
               </div>
             </div>
           );
        })}

        {groups.length === 0 && (
          <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
             <p className="text-white/40">No active nodes found for {category.name}.</p>
             <button onClick={onCreateClick} className="mt-4 text-cyan-400 hover:underline">Start the first node</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupListing;
