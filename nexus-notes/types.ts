export interface Note {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio';
  tags: string[];
  createdAt: number;
  updatedAt: number;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string; // Base64 or Blob URL
  mimeType: string;
  name?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  groundingUrls?: Array<{uri: string, title: string}>;
}

export enum NexusView {
  NOTES = 'notes',
  EDITOR = 'editor',
  VEO_STUDIO = 'veo',
  LIVE_VOICE = 'live',
  CHAT = 'chat'
}

export enum ModelTier {
  FAST = 'fast',      // Flash 2.5
  PRO = 'pro',        // Pro 3
  THINKING = 'think', // Pro 3 + Budget
  CREATIVE = 'create' // Imagen / Veo
}