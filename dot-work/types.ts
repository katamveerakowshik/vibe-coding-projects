export enum UrgencyLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum NoteType {
  TEXT = 'TEXT',
  AUDIO = 'AUDIO',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export interface Note {
  id: string;
  title: string;
  content: string; // HTML/Rich Text content
  rawText?: string; // For search indexing
  type: NoteType;
  category: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  reminderTime?: number; // Timestamp for alert
  isCompleted: boolean;
  urgency: UrgencyLevel;
  
  // Multimodal Assets
  mediaUrl?: string; 
  coverImageUrl?: string; 
  audioUrl?: string;
  
  // AI Metadata
  aiSummary?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarGradient: string; // CSS background string
  isLoggedIn: boolean;
}

export interface AppSnapshot {
  timestamp: number;
  notes: Note[];
  user: UserProfile;
  label: string; // e.g., "Deleted Note", "Updated Profile"
}

export interface UserSettings {
  theme: 'dark' | 'light';
  notificationsEnabled: boolean;
}
