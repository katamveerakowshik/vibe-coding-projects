export enum AppRole {
  STUDENT = 'Student',
  MANAGER = 'Manager',
  DOCTOR = 'Doctor',
  CREATIVE = 'Creative',
  DEFAULT = 'General'
}

export enum NoteColor {
  DEFAULT = 'default',
  RED = 'red',
  ORANGE = 'orange',
  YELLOW = 'yellow',
  GREEN = 'green',
  TEAL = 'teal',
  BLUE = 'blue',
  PURPLE = 'purple',
  PINK = 'pink'
}

export interface Note {
  id: string;
  title: string;
  content: string; // HTML/Rich text string
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  tags: string[];
  color: NoteColor;
  createdAt: number;
  updatedAt: number;
  type: 'text' | 'checklist';
  checklistItems?: { id: string; text: string; done: boolean }[];
}

export interface UserProfile {
  uid: string;
  name: string;
  role: AppRole;
  avatarSeed: string;
  mentalSharpnessScore: number;
  themePreference: 'light' | 'dark';
  onboardingComplete: boolean;
}

export interface AnalyticsData {
  notesCreated: number;
  tasksCompleted: number;
  focusMinutes: number;
  dailyActivity: { day: string; count: number }[];
}

export interface GameState {
  highScore: number;
  lastPlayed: number;
}
