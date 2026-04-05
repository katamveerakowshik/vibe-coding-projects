import { Note, UserProfile, AppSnapshot } from '../types';

const NOTES_KEY = 'dot_os_notes_v2';
const USER_KEY = 'dot_os_user_v2';
const HISTORY_KEY = 'dot_os_time_machine';
const MAX_HISTORY = 50; // Keep last 50 actions

export const getNotes = (): Note[] => {
  try {
    const data = localStorage.getItem(NOTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Storage Error", e);
    return [];
  }
};

export const getUser = (): UserProfile | null => {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) { return null; }
};

export const saveUser = (user: UserProfile) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// --- Time Machine Logic ---

export const getHistory = (): AppSnapshot[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveState = (notes: Note[], user: UserProfile, label: string) => {
  // 1. Save current state persistently
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  
  // 2. Push to History
  const history = getHistory();
  const snapshot: AppSnapshot = {
    timestamp: Date.now(),
    notes,
    user,
    label
  };
  
  // Add new, remove old if limit reached
  const newHistory = [...history, snapshot].slice(-MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
};

export const restoreState = (snapshot: AppSnapshot) => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(snapshot.notes));
    // We don't restore user auth state usually to prevent lockout, but for "State Restore" we restore data
    return snapshot.notes;
};
