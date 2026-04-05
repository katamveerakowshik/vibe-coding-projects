import React from 'react';

const MeshBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#0a0510]">
      {/* Orb 1: Deep Purple */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[#1A0B2E] rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob" />
      
      {/* Orb 2: Neon Cyan */}
      <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-[#00F0FF] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-blob animation-delay-2000" />
      
      {/* Orb 3: Hot Pink */}
      <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] bg-[#FF0099] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-blob animation-delay-4000" />

      {/* Noise Texture Overlay for "frosted" realism */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />
    </div>
  );
};

export default MeshBackground;
