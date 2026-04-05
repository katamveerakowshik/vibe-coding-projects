import React from 'react';

interface Props {
  service: string; // The specific ID or Name
  color: string;
  className?: string;
}

const BrandLogo: React.FC<Props> = ({ service, color, className }) => {
  
  const renderPath = () => {
    // Normalize input
    const key = service.toLowerCase();

    // Specific Brands
    if (key.includes('netflix')) {
      return <path d="M8 3V21M16 3V21M8 3L16 21" stroke={color} strokeWidth="3.5" strokeLinecap="square" strokeLinejoin="bevel" fill="none" />;
    }
    if (key.includes('prime')) {
      return <path d="M3 14C3 14 6 19 12 19C17 19 21 15 21 15M16 19L21 15L19 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>;
    }
    if (key.includes('spotify')) {
      return (
        <>
          <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" fill="none" />
          <path d="M7 11.5C10 10.5 14.5 10.5 17.5 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M8 15C10.5 14 14 14 16.5 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </>
      );
    }
    if (key.includes('adobe')) {
      return <path d="M15 2H21V22H15V13L12 5.5L9 13V22H3V2L9 22" stroke={color} strokeWidth="2" strokeLinejoin="round" fill="none" />; 
    }

    // Generic Categories (Fallback by ID or Name content)
    
    // Food / Dining
    if (key.includes('dining') || key.includes('food')) {
       return (
         <>
           <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" stroke={color} strokeWidth="2" />
           <path d="M7 11v11" stroke={color} strokeWidth="2" />
           <path d="M21 15V2v19" stroke={color} strokeWidth="2" />
           <path d="M21 15a4 4 0 0 1-4-4V2" stroke={color} strokeWidth="2" />
         </>
       );
    }

    // Business / Briefcase
    if (key.includes('business') || key.includes('office') || key.includes('agency')) {
       return (
         <>
           <rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke={color} strokeWidth="2" fill="none" />
           <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke={color} strokeWidth="2" />
         </>
       );
    }

    // Ads / Megaphone
    if (key.includes('ad') || key.includes('marketing')) {
       return (
         <>
            <path d="M3 11l18-5v12l-18-5v-2z" stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round" />
            <path d="M11.6 16.8L14 22" stroke={color} strokeWidth="2" />
         </>
       );
    }

    // Product / Tag
    if (key.includes('product') || key.includes('bulk') || key.includes('shop')) {
       return (
         <>
           <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke={color} strokeWidth="2" fill="none" />
           <line x1="7" y1="7" x2="7.01" y2="7" stroke={color} strokeWidth="2" />
         </>
       );
    }

    // Default Hex
    return (
        <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round" />
    );
  };

  return (
    <svg viewBox="0 0 24 24" className={`w-12 h-12 ${className}`} style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}>
      {renderPath()}
    </svg>
  );
};

export default BrandLogo;
