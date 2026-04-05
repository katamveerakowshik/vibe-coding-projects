import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Note, UrgencyLevel, NoteType } from "../types";

// Helper to get AI instance safely
const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API Key is missing");
        throw new Error("API Key is missing");
    }
    return new GoogleGenAI({ apiKey });
};

// Helper to clean Markdown stars to HTML
const cleanMarkdown = (text: string): string => {
    if (!text) return "";
    // Replace **bold** with <b>bold</b>
    let clean = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Replace * List item or - List item with HTML bullets if not already HTML
    if (!clean.includes('<ul>') && (clean.includes('* ') || clean.includes('- '))) {
        clean = '<ul>' + clean.split('\n').map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                return `<li>${trimmed.substring(2)}</li>`;
            }
            return trimmed ? `<p>${trimmed}</p>` : '';
        }).join('') + '</ul>';
    }
    return clean;
};

// 1. One-Tap Magic: Format text & Generate Title
export const formatTextMagic = async (rawText: string): Promise<Partial<Note>> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this raw text.
            Raw Text: "${rawText}"
            
            Tasks:
            1. Create a short, catchy Title (max 5 words).
            2. Format the content into clear HTML <ul><li> list items. Do NOT use markdown stars (*).
            3. Extract entities as tags.
            4. Infer urgency.
            
            Return JSON.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        urgency: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] }
                    }
                }
            }
        });
        
        if (response.text) {
             const data = JSON.parse(response.text);
             return {
                 ...data,
                 content: cleanMarkdown(data.content)
             };
        }
        return {};
    } catch (e) {
        console.error("Format Magic Error", e);
        return { content: rawText, title: "Quick Note", urgency: UrgencyLevel.LOW, tags: [] };
    }
};

// 2. Audio Analysis: Transcript + Bullet Points (No Markdown)
export const analyzeAudio = async (base64Audio: string): Promise<{transcript: string, urgency: UrgencyLevel, summaryPoints: string}> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: "audio/wav",
                            data: base64Audio
                        }
                    },
                    {
                        text: "Transcribe this audio. Analyze the TONE (panicked/fast = CRITICAL). Then provide a summary as a list of key points. Do NOT use markdown symbols like *. Return pure text or HTML <li> tags."
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        transcript: { type: Type.STRING },
                        urgency: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
                        summaryPoints: { type: Type.STRING, description: "HTML formatted list items of key points" }
                    }
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(response.text);
            return {
                transcript: data.transcript || "Audio note",
                urgency: (data.urgency as UrgencyLevel) || UrgencyLevel.MEDIUM,
                summaryPoints: cleanMarkdown(data.summaryPoints || "")
            };
        }
    } catch (e) {
        console.error("Audio Analysis Error", e);
    }
    return { transcript: "", urgency: UrgencyLevel.MEDIUM, summaryPoints: "" };
};

// 3. Omni-Scanner: Image to Text
export const scanImage = async (base64Image: string): Promise<Partial<Note>> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', 
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: base64Image } },
                    { text: "Analyze this image. Extract text and objects. Return a Title and a Description (formatted as HTML lines, no markdown stars)." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING },
                        urgency: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] }
                    }
                }
            }
        });
         if (response.text) {
             const data = JSON.parse(response.text);
             return { ...data, content: cleanMarkdown(data.content) };
        }
    } catch (e) {
        console.error("Image Scan Error", e);
    }
    return {};
};

// 4. Visual Memory: Nano Banana Pro (Gemini 3 Pro Image)
export const generateCoverImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K'): Promise<string | null> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [{ text: `Create a cinematic, digital art illustration for the title: "${prompt}". Use a glowing purple/neon theme on a dark background. High detail.` }]
            },
            config: {
                imageConfig: {
                    imageSize: size,
                    aspectRatio: "16:9"
                }
            }
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    } catch (e) {
        console.error("Image Gen Error", e);
    }
    return null;
};

// 5. Orbit: Fast AI Responses
export const orbitChat = async (message: string, contextNotes: Note[]): Promise<{text: string, action?: any}> => {
    try {
        const ai = getAI();
        const notesContext = contextNotes.map(n => `[${n.category}] ${n.title}: ${n.content} (Urgency: ${n.urgency})`).join('\n');
        
        const systemPrompt = `You are ORBIT, an AI for 'DOT'. 
        User's Notes:
        ${notesContext}
        Answer concisely. Do not use Markdown stars (*) for lists, use dashes or numbers.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite', 
            contents: message,
            config: {
                systemInstruction: systemPrompt,
            }
        });
        
        if (response.text) {
            return { text: response.text };
        }
    } catch (e) {
        console.error("Orbit Error", e);
        return { text: "Connection unstable." };
    }
    return { text: "System offline." };
};

// 6. Web Search Grounding
export const searchWeb = async (query: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: query,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        let text = response.text || "No results found.";
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            const sources = chunks
                .map((c: any) => c.web?.uri ? `<br/><a href="${c.web.uri}" target="_blank" class="text-[#D946EF] underline text-xs">[${c.web.title || 'Source'}]</a>` : null)
                .filter(Boolean)
                .join(' ');
            if (sources) {
                text += `<br/><br/><div class="text-xs opacity-50 border-t border-white/10 pt-2">Sources: ${sources}</div>`;
            }
        }
        return cleanMarkdown(text);
    } catch (e) {
        console.error("Search Error", e);
        return "Unable to access global network.";
    }
};

// 7. Text to Speech
export const generateSpeech = async (text: string): Promise<string | null> => {
    try {
        const ai = getAI();
        // Clean text for speech (remove HTML)
        const cleanText = text.replace(/<[^>]*>/g, '');
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text: cleanText }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            }
        });
        
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioData) {
            return audioData; 
        }
    } catch (e) {
        console.error("TTS Error", e);
    }
    return null;
}
