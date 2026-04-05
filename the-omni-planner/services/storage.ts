import { Note, UserProfile, AppRole, NoteColor, AnalyticsData } from '../types';

const STORAGE_KEYS = {
  USER: 'omni_user_v1',
  NOTES: 'omni_notes_v1',
  ANALYTICS: 'omni_analytics_v1',
};

// --- Mock Data Generators ---
const generateId = () => Math.random().toString(36).substr(2, 9);

export const StorageService = {
  // --- User ---
  getUser: (): UserProfile | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  saveUser: (user: UserProfile) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  initUser: (role: AppRole): UserProfile => {
    const newUser: UserProfile = {
      uid: generateId(),
      name: 'Omni User',
      role,
      avatarSeed: generateId(),
      mentalSharpnessScore: 0,
      themePreference: 'dark', // Default to dark for "Silicon Valley" vibe
      onboardingComplete: true
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    
    // Seed some role-specific notes
    const welcomeNotes: Note[] = [
      {
        id: generateId(),
        title: `Welcome, ${role}!`,
        content: `This is your new Omni-Planner. \n\nWe have configured the workspace for **${role}** mode. \n\nTry the "Brain Dump" AI feature in the bottom right!`,
        isPinned: true,
        isArchived: false,
        isDeleted: false,
        tags: ['onboarding', 'system'],
        color: NoteColor.TEAL,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        type: 'text'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(welcomeNotes));
    
    return newUser;
  },

  // --- Notes ---
  getNotes: (): Note[] => {
    const data = localStorage.getItem(STORAGE_KEYS.NOTES);
    return data ? JSON.parse(data) : [];
  },

  // Used for single updates where we want to just push one change
  saveNote: (note: Note) => {
    const notes = StorageService.getNotes();
    const existingIndex = notes.findIndex(n => n.id === note.id);
    if (existingIndex >= 0) {
      notes[existingIndex] = { ...note, updatedAt: Date.now() };
    } else {
      notes.unshift({ ...note, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    StorageService.updateAnalytics('notesCreated');
  },

  // Used for Global Undo/Redo restoration
  saveAllNotes: (notes: Note[]) => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  },

  deleteNote: (id: string) => {
    let notes = StorageService.getNotes();
    // Soft delete (move to bin) or Hard delete if already in bin?
    // Let's implement toggle trash logic in UI, here we just save the state
    notes = notes.map(n => n.id === id ? { ...n, isDeleted: true } : n);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  },
  
  hardDeleteNote: (id: string) => {
    let notes = StorageService.getNotes();
    notes = notes.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  },

  togglePin: (id: string) => {
    const notes = StorageService.getNotes();
    const note = notes.find(n => n.id === id);
    if (note) {
      note.isPinned = !note.isPinned;
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    }
  },

  // --- Analytics ---
  getAnalytics: (): AnalyticsData => {
    const defaultAnalytics: AnalyticsData = {
        notesCreated: 0,
        tasksCompleted: 0,
        focusMinutes: 12,
        dailyActivity: [
            { day: 'Mon', count: 4 },
            { day: 'Tue', count: 7 },
            { day: 'Wed', count: 2 },
            { day: 'Thu', count: 9 },
            { day: 'Fri', count: 5 },
            { day: 'Sat', count: 3 },
            { day: 'Sun', count: 8 },
        ]
    };
    const data = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
    return data ? JSON.parse(data) : defaultAnalytics;
  },

  updateAnalytics: (key: keyof AnalyticsData, value?: any) => {
    const data = StorageService.getAnalytics();
    if (typeof data[key] === 'number') {
        (data[key] as number) += 1;
    }
    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(data));
  }
};