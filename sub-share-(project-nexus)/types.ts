export type CategoryType = 'ENTERTAINMENT' | 'BUSINESS' | 'FOOD' | 'PRODUCT' | 'ADS';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon?: string;
}

export interface Group {
  id: string;
  categoryId: string; // Links to Category
  type: CategoryType;
  name: string; // Title
  description: string; // AI Enhanced Description
  imageUrl?: string; // AI Generated Cover Image
  planName: string; // e.g., "Premium 4K" or "5-Course Set"
  totalCost: number;
  maxSlots: number;
  filledSlots: number;
  currency: string;
  creatorId: string;
  creatorName: string;
  qrCodeUrl?: string; 
  status: 'OPEN' | 'FILLED' | 'CLOSED';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isBlurred?: boolean;
  attachment?: string;
  verificationStatus?: 'pending' | 'verified' | 'failed' | 'none';
  analysisDetails?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarGradient: string; 
  avatarUrl?: string; 
  walletBalance: number;
  isAuthenticated: boolean;
}

export type ViewState = 'HOME' | 'LISTING' | 'DETAIL' | 'SEARCH';

export interface VerificationResult {
  isValid: boolean;
  amount?: number;
  transactionId?: string;
  reason?: string;
  analysis?: string;
}

export interface AIOptimizationResult {
  title: string;
  description: string;
  suggestedPrice?: number;
}
