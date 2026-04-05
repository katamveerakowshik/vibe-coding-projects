import { Category, Group } from "./types";

export const CATEGORIES: Category[] = [
  // Entertainment
  { id: 'netflix', name: 'Netflix', type: 'ENTERTAINMENT', color: '#E50914' },
  { id: 'prime', name: 'Prime', type: 'ENTERTAINMENT', color: '#00A8E1' },
  { id: 'spotify', name: 'Spotify', type: 'ENTERTAINMENT', color: '#1DB954' },
  
  // Business
  { id: 'adobe', name: 'Adobe CC', type: 'BUSINESS', color: '#FF0000' },
  { id: 'office', name: 'MS Office', type: 'BUSINESS', color: '#EA3E23' },
  { id: 'ads', name: 'Ad Space', type: 'ADS', color: '#FFD700' },
  
  // Lifestyle
  { id: 'dining', name: 'Fine Dining', type: 'FOOD', color: '#F59E0B' },
  { id: 'bulk', name: 'Bulk Buy', type: 'PRODUCT', color: '#8B5CF6' }
];

export const MOCK_GROUPS: Group[] = [
  // --- OTT ---
  {
    id: 'g1',
    categoryId: 'netflix',
    type: 'ENTERTAINMENT',
    name: "Netflix Premium 4K Clan",
    description: "Experience cinema-quality streaming. Looking for reliable members for a long-term Ultra HD share.",
    planName: 'Premium Ultra HD',
    totalCost: 649,
    maxSlots: 4,
    filledSlots: 3,
    currency: '₹',
    creatorId: 'u1',
    creatorName: 'Rahul K.',
    status: 'OPEN',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=rahul@upi'
  },
  {
    id: 'g2',
    categoryId: 'spotify',
    type: 'ENTERTAINMENT',
    name: "Spotify Audiofiles",
    description: "Ad-free music for the audiophile family. Join now for uninterrupted listening.",
    planName: 'Family Premium',
    totalCost: 179,
    maxSlots: 6,
    filledSlots: 2,
    currency: '₹',
    creatorId: 'u3',
    creatorName: 'Amit B.',
    status: 'OPEN'
  },
  
  // --- BUSINESS ---
  {
    id: 'b1',
    categoryId: 'adobe',
    type: 'BUSINESS',
    name: "Design Agency Collective",
    description: "Sharing an Adobe Creative Cloud All Apps Teams license. Perfect for freelancers needing the full suite.",
    planName: 'Creative Cloud Teams',
    totalCost: 5400,
    maxSlots: 2,
    filledSlots: 1,
    currency: '₹',
    creatorId: 'u5',
    creatorName: 'DesignPro_X',
    status: 'OPEN'
  },
  {
    id: 'b2',
    categoryId: 'ads',
    type: 'ADS',
    name: "Times Square Billboard Split",
    description: "15-second slot on a digital billboard in Mumbai High Street. Splitting the 1-hour block cost among 4 brands.",
    planName: 'Prime Hour Slot',
    totalCost: 25000,
    maxSlots: 5,
    filledSlots: 2,
    currency: '₹',
    creatorId: 'u6',
    creatorName: 'GrowthHackers',
    status: 'OPEN'
  },

  // --- FOOD ---
  {
    id: 'f1',
    categoryId: 'dining',
    type: 'FOOD',
    name: "Omakase Experience Group",
    description: "Table for 4 at 'Wasabi' requires full booking. Join us for a 7-course tasting menu at a group discount.",
    planName: '7-Course Tasting',
    totalCost: 12000,
    maxSlots: 4,
    filledSlots: 1,
    currency: '₹',
    creatorId: 'u7',
    creatorName: 'Foodie_Jane',
    status: 'OPEN'
  },

  // --- PRODUCT ---
  {
    id: 'p1',
    categoryId: 'bulk',
    type: 'PRODUCT',
    name: "Whey Protein Bulk Order",
    description: "Buying 10KG tub of Gold Standard Whey to split 5 ways. Massive savings compared to 1KG packs.",
    planName: '2KG Share',
    totalCost: 18000,
    maxSlots: 5,
    filledSlots: 4,
    currency: '₹',
    creatorId: 'u8',
    creatorName: 'GymRat99',
    status: 'OPEN'
  }
];

export const USER_STORAGE_KEY = 'subshare_user_v3';

export const generateGradient = (name: string) => {
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const c1 = `hsl(${hash % 360}, 70%, 50%)`;
  const c2 = `hsl(${(hash + 180) % 360}, 70%, 50%)`;
  return `linear-gradient(135deg, ${c1}, ${c2})`;
};
