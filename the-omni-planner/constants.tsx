import React from 'react';
import { NoteColor, AppRole } from './types';

// --- Color Maps ---
export const COLOR_MAP: Record<NoteColor, string> = {
  [NoteColor.DEFAULT]: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  [NoteColor.RED]: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
  [NoteColor.ORANGE]: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
  [NoteColor.YELLOW]: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
  [NoteColor.GREEN]: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
  [NoteColor.TEAL]: 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800',
  [NoteColor.BLUE]: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  [NoteColor.PURPLE]: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
  [NoteColor.PINK]: 'bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800',
};

// --- Bespoke Icons ---

export const LogoIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5 L95 25 V75 L50 95 L5 75 V25 L50 5 Z" stroke="currentColor" strokeWidth="4" className="text-slate-900 dark:text-white" />
    <path d="M50 5 V50 L95 25" stroke="currentColor" strokeWidth="4" className="text-indigo-500" />
    <path d="M50 50 L5 25" stroke="currentColor" strokeWidth="4" className="text-cyan-500" />
    <path d="M50 50 V95" stroke="currentColor" strokeWidth="4" className="text-purple-500" />
    <circle cx="50" cy="50" r="10" fill="currentColor" className="text-slate-900 dark:text-white" />
  </svg>
);

export const FluxNodeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 9V3M12 21v-6M3 12h6M21 12h-6" />
    <circle cx="12" cy="3" r="1" fill="currentColor" />
    <circle cx="12" cy="21" r="1" fill="currentColor" />
    <circle cx="3" cy="12" r="1" fill="currentColor" />
    <circle cx="21" cy="12" r="1" fill="currentColor" />
  </svg>
);

export const TimePrismIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 22H22L12 2Z" />
    <path d="M12 6V16" />
    <path d="M12 16L7 22" />
    <path d="M12 16L17 22" />
  </svg>
);

export const CortexIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 0v6l4.2 4.2" />
    <circle cx="12" cy="12" r="2" className="text-purple-500 fill-current animate-pulse" />
  </svg>
);

export const DashboardIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

export const ArcadeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 12h4M8 10v4" />
    <circle cx="17" cy="12" r="1.5" />
  </svg>
);

export const ExpandIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

export const ShrinkIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
  </svg>
);

export const EditIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const UndoIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 015.5 5.5v0a5.5 5.5 0 01-5.5 5.5H11" />
  </svg>
);

export const RedoIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 14l5-5-5-5" />
    <path d="M20 9H9.5A5.5 5.5 0 004 14.5v0A5.5 5.5 0 009.5 20H13" />
  </svg>
);

export const GamePadIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 11h4M8 9v4" />
    <circle cx="15.5" cy="9.5" r="1.5" />
    <circle cx="18.5" cy="12.5" r="1.5" />
    <rect x="2" y="6" width="20" height="12" rx="4" />
  </svg>
);

export const BrainIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.55 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.55 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);

export const ROLE_CONFIG: Record<AppRole, { description: string; color: string }> = {
  [AppRole.STUDENT]: { description: "Optimized for assignments, study timers, and quick capture.", color: "text-blue-500" },
  [AppRole.MANAGER]: { description: "Team blocking, delegation views, and high-level strategy.", color: "text-indigo-500" },
  [AppRole.DOCTOR]: { description: "High-contrast, shorthand entry, clinical efficiency.", color: "text-teal-500" },
  [AppRole.CREATIVE]: { description: "Visual moodboarding, flexible grids, and inspiration capture.", color: "text-pink-500" },
  [AppRole.DEFAULT]: { description: "Balanced productivity for everyday mastery.", color: "text-slate-500" },
};