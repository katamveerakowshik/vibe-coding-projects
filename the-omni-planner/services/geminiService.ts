import { GoogleGenAI, Type } from "@google/genai";
import { Note } from "../types";

// In a real app, this would be a secure backend call or strictly env var.
// For this demo, we assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GeminiService = {
  /**
   * Transforms raw brain dump text into structured notes/tasks.
   */
  processBrainDump: async (text: string): Promise<Partial<Note>[]> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze this "Brain Dump" text. Break it down into distinct, actionable items.
        
        Text: "${text}"
        
        Rules:
        1. If a task is vague or broad (e.g., "Plan vacation", "Launch website"), set 'type' to 'checklist' and automatically generate 3-5 subtasks in the 'checklistItems' array.
        2. If a task is simple, set 'type' to 'text'.
        
        Return a JSON Array of objects.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['text', 'checklist'] },
                checklistItems: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      done: { type: Type.BOOLEAN }
                    }
                  }
                },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['title', 'content', 'type']
            }
          }
        }
      });

      const json = JSON.parse(response.text || "[]");
      // Post-process to ensure checklist items have IDs
      return json.map((item: any) => ({
        ...item,
        checklistItems: item.checklistItems?.map((ci: any) => ({ ...ci, id: Math.random().toString(36).substr(2, 9) })) || []
      }));
    } catch (error) {
      console.error("Gemini Brain Dump Error:", error);
      return [];
    }
  },

  /**
   * Generates a checklist for a specific task title.
   */
  generateChecklist: async (taskTitle: string): Promise<{ text: string, done: boolean }[]> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Create a concise 3-5 item checklist to complete this task: "${taskTitle}". Return JSON only.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    done: { type: Type.BOOLEAN }
                }
            }
          }
        }
      });

      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Gemini Checklist Error:", error);
      return [];
    }
  }
};