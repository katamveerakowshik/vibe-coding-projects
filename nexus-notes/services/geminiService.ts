import { GoogleGenAI, Type, SchemaType, LiveServerMessage, Modality } from "@google/genai";
import { MODELS, THINKING_BUDGET } from '../constants';

// Initialize AI Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper: Blob/Base64 handling ---
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- 1. Text & Reasoning (Chat, Thinking, Search) ---

export const generateSmartResponse = async (
  prompt: string,
  modelId: string = MODELS.TEXT_PRO,
  useThinking: boolean = false,
  useSearch: boolean = false,
  history: any[] = []
) => {
  
  const config: any = {
    systemInstruction: "You are Nexus, an elite, succinct, and highly intelligent AI assistant embedded in a premium note-taking app.",
  };

  if (useThinking && modelId === MODELS.TEXT_PRO) {
    config.thinkingConfig = { thinkingBudget: THINKING_BUDGET };
  }

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  // If using chat history, we normally use chats.create, but for single-turn 'supercharges' generic generateContent is often easier.
  // Here we will use generateContent for simplicity unless it's a long chat.
  
  const response = await ai.models.generateContent({
    model: modelId,
    contents: [
      ...history,
      { role: 'user', parts: [{ text: prompt }] }
    ],
    config
  });

  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

// --- 2. Image Understanding & Editing ---

export const analyzeImage = async (base64Image: string, prompt: string) => {
  const response = await ai.models.generateContent({
    model: MODELS.TEXT_PRO, // Gemini 3 Pro for complex vision tasks
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    }
  });
  return response.text;
};

export const editImage = async (base64Image: string, prompt: string) => {
  // Using Nano Banana (Flash Image) for editing
  const response = await ai.models.generateContent({
    model: MODELS.IMAGE_EDIT,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        { text: prompt }
      ]
    }
  });
  
  // Find image part
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data; // Base64
    }
  }
  return null;
};

// --- 3. Image Generation (Nano Banana Pro) ---

export const generateProImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K') => {
  const response = await ai.models.generateContent({
    model: MODELS.IMAGE_GEN_PRO,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        imageSize: size,
        aspectRatio: "1:1" // Default square, can be parameterized
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  return null;
}

// --- 4. Veo Video Generation ---

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9', imageBase64?: string) => {
  // Check for API key (Veo requires paid tier usually, assumes env key is valid)
  // In a real app we might check window.aistudio.hasSelectedApiKey() as per instructions, 
  // but we are running in a constrained env where we use process.env.API_KEY.

  let operation;
  
  const commonConfig = {
    numberOfVideos: 1,
    resolution: '720p', // Preview model limit usually
    aspectRatio: aspectRatio
  };

  if (imageBase64) {
    operation = await ai.models.generateVideos({
      model: MODELS.VIDEO_FAST,
      prompt: prompt,
      image: {
        imageBytes: imageBase64,
        mimeType: 'image/png'
      },
      config: commonConfig
    });
  } else {
    operation = await ai.models.generateVideos({
      model: MODELS.VIDEO_FAST,
      prompt: prompt,
      config: commonConfig
    });
  }

  // Polling loop
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed.");

  // Fetch the actual video bytes
  const vidResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  const blob = await vidResponse.blob();
  return URL.createObjectURL(blob);
};


// --- 5. Live API Helpers ---

export const connectLiveSession = async (
  onAudioData: (base64Audio: string) => void,
  onTranscription: (inText: string, outText: string) => void,
  onClose: () => void
) => {
  const session = await ai.live.connect({
    model: MODELS.AUDIO_LIVE,
    callbacks: {
      onopen: () => console.log("Nexus Live Connected"),
      onmessage: (msg: LiveServerMessage) => {
        // Audio Output
        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioData) onAudioData(audioData);

        // Transcriptions
        if (msg.serverContent?.modelTurn?.parts?.[0]?.text) {
             // Sometimes text comes in parts
        }
        
        // Handle explicit transcription fields if configured
        if (msg.serverContent?.outputTranscription) {
           onTranscription("", msg.serverContent.outputTranscription.text || "");
        }
        if (msg.serverContent?.inputTranscription) {
           onTranscription(msg.serverContent.inputTranscription.text || "", "");
        }
        
        if (msg.serverContent?.turnComplete) {
            // Turn complete logic if needed
        }
      },
      onclose: onClose,
      onerror: (e) => console.error("Live Error", e)
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      },
      inputAudioTranscription: { model: "gemini-2.5-flash" }, // Enable input transcription
      outputAudioTranscription: { model: "gemini-2.5-flash" }, // Enable output transcription
      systemInstruction: "You are Nexus, a sophisticated, highly intelligent AI companion. Speak concisely, warmly, and with precision."
    }
  });
  return session;
}

// Audio Utils (from guidelines)
export function createPCM16Blob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = Math.max(-1, Math.min(1, data[i])) * 32767; // Clamp and scale
  }
  return new Blob([int16], { type: 'audio/pcm;rate=16000' }); // Return raw blob, not JSON
}

export function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}