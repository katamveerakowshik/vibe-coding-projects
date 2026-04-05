import React from 'react';
import { Category } from '../../types';
import BrandLogo from '../Shared/BrandLogo';

interface Props {
  category: Category;
  activeCount: number; // How many groups exist
  onClick: () => void;
}

const CategoryCard: React.FC<Props> = ({ category, activeCount, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl cursor-pointer group transition-all duration-300 bg-white/5 border border-white/10 backdrop-blur-md shadow-lg hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]"
      style={{ '--pulse-color': category.color } as React.CSSProperties}
    >
      {/* Decorative Top Frame */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />
      <div className="absolute top-0 left-0 w-1 h-full opacity-80" style={{ backgroundColor: category.color }} />

      <div className="p-6 flex flex-col h-40 justify-between relative z-10">
        <div className="flex justify-between items-start">
          <BrandLogo service={category.id} color={category.color} />
          <div className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-white/50">
             {activeCount} Active
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-white tracking-wide truncate">{category.name}</h3>
          <p className="text-white/40 text-[10px] uppercase tracking-widest">{category.type}</p>
        </div>
      </div>
      
      {/* Decorative gradient splash */}
      <div 
        className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-40"
        style={{ backgroundColor: category.color }}
      />
    </div>
  );
};

export default CategoryCard;
