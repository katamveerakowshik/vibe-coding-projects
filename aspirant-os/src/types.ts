import { Timestamp } from 'firebase/firestore';

export type Persona = 'Warrior' | 'Scholar' | 'Grinder' | 'Strategist';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  persona?: Persona;
  goalTitle?: string;
  goalDeadline?: string; // YYYY-MM-DD
  streak?: number;
  lastActive?: Timestamp;
  cohortId?: string;
  rank?: number;
  totalStudyHours?: number;
  role?: 'admin' | 'user';
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  createdAt: Timestamp;
}

export interface DailyLog {
  userId: string;
  date: string; // YYYY-MM-DD
  studyHours: number;
  tasksCompleted: number;
  tasksTotal: number;
}

export interface Cohort {
  id: string;
  name: string;
  goalType: string;
  memberCount: number;
}

export interface JourneyPost {
  id: string;
  userId: string;
  content: string;
  timestamp: Timestamp;
  reactions: number;
  persona: Persona;
  displayName?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'file';
}
