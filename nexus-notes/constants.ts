export const MODELS = {
  TEXT_FAST: 'gemini-2.5-flash',
  TEXT_LITE: 'gemini-flash-lite-latest',
  TEXT_PRO: 'gemini-3-pro-preview',
  IMAGE_GEN_PRO: 'gemini-3-pro-image-preview',
  IMAGE_EDIT: 'gemini-2.5-flash-image',
  VIDEO_FAST: 'veo-3.1-fast-generate-preview',
  AUDIO_LIVE: 'gemini-2.5-flash-native-audio-preview-09-2025',
  SEARCH_TOOL: 'gemini-2.5-flash', // Used for search grounding
};

export const THINKING_BUDGET = 32768; // Max for 3 Pro

export const SAMPLE_NOTES = [
  {
    id: '1',
    title: 'Project Zenith Ideas',
    content: '1. Holographic interface prototype.\n2. Neural link integration.\n3. Quantum encryption layer.',
    type: 'text',
    tags: ['work', 'vision'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: '2',
    title: 'Kyoto Trip',
    content: 'Remember to visit Fushimi Inari at dawn.',
    type: 'image',
    tags: ['travel'],
    createdAt: Date.now() - 100000,
    updatedAt: Date.now()
  }
];