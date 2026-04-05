/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ExamType = 
  | 'SSC CGL' | 'SSC CHSL' | 'GATE CS' | 'GATE EC' | 'GATE ME' | 'GATE EE' | 'GATE CE'
  | 'CAT' | 'NIMCET' | 'NEET' | 'JEE Main' | 'JEE Advanced' | 'UPSC' | 'CLAT' | 'CUET' | 'Custom';

export type SessionType = 'Full Day Study' | 'Revision' | 'Mock Test' | 'New Topics' | 'Mixed';

export interface Habit {
  id: string;
  name: string;
  category: 'Study' | 'Health' | 'Mindset' | 'Custom' | string;
  color?: string;
  tags?: string[];
  targetDurationHours?: number;
  targetDurationMinutes?: number;
  frequency: 'Daily' | 'Weekdays' | 'Custom';
  customDays?: number[]; // 0-6
  reminderTime?: string;
  targetDuration?: number;
  createdAt: number;
  completions: string[]; // ISO dates
  streak: number;
  bestStreak: number;
}

export interface Task {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  method: string;
  completed: boolean;
  checkpoints: { time: string; completed: boolean }[];
  notes?: string;
  tips?: string;
}

export interface Session {
  id: string;
  date: string;
  goal: string;
  exam: ExamType;
  plan: Task[];
  notes: Record<string, string>;
  analytics: any;
  completionRate: number;
}

export interface Note {
  id: string;
  topicId?: string;
  sessionId?: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  modifiedAt: number;
  isStarred: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  imageUrl?: string;
  imageCaption?: string;
  createdAt: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export interface User {
  name: string;
  avatar: string;
  exam: ExamType;
  examDate: string;
  level: number;
  xp: number;
  streak: number;
  lastLogin: string;
  dailyHoursGoal: number;
  achievements: Achievement[];
}

export interface SyllabusNode {
  id: string;
  name: string;
  children?: SyllabusNode[];
  checked: boolean;
  stopped?: boolean;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  weightage?: number;
  estimatedHours?: number;
  notes?: string;
}

export interface AppState {
  user: User | null;
  habits: Habit[];
  sessions: Session[];
  syllabus: Record<string, SyllabusNode[]>;
  notes: Note[];
  settings: {
    apiKey: string;
    theme: 'Dark Neon' | 'Midnight Blue' | 'Forest Green' | 'Solar Orange';
    notifications: boolean;
  };
}
