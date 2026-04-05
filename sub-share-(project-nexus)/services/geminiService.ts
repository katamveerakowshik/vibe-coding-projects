import { GoogleGenAI, Type } from "@google/genai";
import { Group, VerificationResult, AIOptimizationResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// 1. Semantic Search
export const searchSubscriptions = async (query: string, allPlans: Group[]): Promise<string[]> => {
  if (!query) return allPlans.map(p => p.id);
  try {
    const model = "gemini-2.5-flash-lite"; 
    const prompt = `
      You are an intelligent subscription broker.
      User Query: "${query}"
      Available Plans: ${JSON.stringify(allPlans.map(p => ({ 
        id: p.id, 
        name: p.name, 
        tags: [p.type, p.planName, p.description], 
        cost: p.totalCost / p.maxSlots 
      })))}
      Return a JSON array of plan IDs that match the user's intent. 
    `;
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return allPlans.map(p => p.id); 
  }
};

// 2. Multimodal Payment Verification
export const verifyPaymentScreenshot = async (base64Image: string, expectedAmount: number): Promise<VerificationResult> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    const model = "gemini-3-pro-preview"; 
    const prompt = `
      Analyze this UPI payment screenshot.
      Expected Amount: ~${expectedAmount}
      Return JSON with validation status and a markdown summary.
    `;
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
         responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            amount: { type: Type.NUMBER },
            transactionId: { type: Type.STRING },
            reason: { type: Type.STRING },
            analysis: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || '{"isValid": false}');
  } catch (e) {
    return { isValid: false, reason: "Verification service unavailable." };
  }
};

// 3. The Oracle (Updated with Maps)
export const askOracle = async (query: string, context: string): Promise<string> => {
  try {
    const model = "gemini-2.5-flash"; 
    
    const systemPrompt = `
      You are 'The Oracle', the AI core of SubShare.
      
      DATA ACCESS:
      You have access to the app's current state and available groups via the 'Context' below.
      The context contains a list of active subscription groups in JSON format.
      
      INSTRUCTIONS:
      1. IF the user asks about available groups, prices, or services:
         - PARSE the JSON data in the context.
         - Answer specific details (e.g., "There are 2 Netflix groups available...").
      
      2. IF the user asks about LOCATIONS (e.g. "Where can I eat?", "Gyms nearby"):
         - Use the 'googleMaps' tool.
         
      3. IF the user asks general questions:
         - Use the 'googleSearch' tool.
      
      4. Keep answers concise, futuristic, and helpful.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: `
        Context: ${context}
        User Question: ${query}
      `,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {}, googleMaps: {} }],
      }
    });

    let text = response.text || "I couldn't find an answer.";
    const grounding = response.candidates?.[0]?.groundingMetadata;
    
    // Extract both Web and Maps sources
    if (grounding?.groundingChunks) {
        const sources = grounding.groundingChunks
          .map((c: any) => {
             if (c.web?.uri) return `[${c.web.title}](${c.web.uri})`;
             if (c.maps?.title) return `[${c.maps.title} - Maps](${c.maps.uri || '#'})`;
             return '';
          })
          .filter((s: string) => s)
          .join(', ');
          
        if (sources) {
            text += `\n\n*Sources: ${sources}*`;
        }
    }
    return text;
  } catch (e) {
    console.error("Oracle Error:", e);
    return "The Oracle is currently disconnected from the grid.";
  }
};

// 4. Safety Check
export const checkChatSafety = async (message: string): Promise<boolean> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: `Analyze message: "${message}". Return { "unsafe": boolean } if toxic.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}").unsafe === true;
  } catch (e) {
    return false;
  }
}

// 5. AI Marketing Polish
export const optimizeGroupDetails = async (rawTitle: string, category: string): Promise<AIOptimizationResult> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      You are a world-class copywriter for a sharing economy app.
      
      User Input: "${rawTitle}"
      Category: "${category}"
      
      Task:
      1. Create a catchy, premium Title (max 40 chars).
      2. Write an impactful, persuasive Description (max 150 chars) that makes people want to join this group.
      
      Return JSON: { "title": string, "description": string }
    `;
    
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             title: { type: Type.STRING },
             description: { type: Type.STRING }
          }
        }
      }
    });
    
    return JSON.parse(response.text || '{"title": "", "description": ""}');
  } catch (e) {
    return { title: rawTitle, description: "Join my group!" };
  }
}

// 6. Generate Group Cover Image (New)
export const generateGroupImage = async (description: string): Promise<string | null> => {
  try {
    const model = "gemini-2.5-flash-image";
    const prompt = `Generate a cinematic, futuristic 3D abstract cover art for a subscription group described as: "${description}". Use neon lighting, glassmorphism style, high quality, 4k. No text.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: { aspectRatio: "1:1" }
        }
    });

    // Iterate parts to find image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    return null;
  } catch (e) {
    console.error("Image Gen Error", e);
    return null;
  }
}
