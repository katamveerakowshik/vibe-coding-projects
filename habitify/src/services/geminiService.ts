import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateContent(prompt: string, systemInstruction?: string, responseSchema?: any) {
    if (!this.ai) throw new Error("API Key not set");

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction + " Provide answers in a professional, structured format using Markdown with clear headings, subheadings, and bullet points. Avoid mentioning you are an AI or a large language model. Act as a top-tier human performance coach.",
          responseMimeType: responseSchema ? "application/json" : "text/plain",
          responseSchema,
        },
      });

      if (responseSchema) {
        return JSON.parse(response.text || "{}");
      }
      return response.text;
    } catch (error) {
      console.error("Service Error:", error);
      throw error;
    }
  }

  async *generateContentStream(prompt: string, systemInstruction?: string) {
    if (!this.ai) throw new Error("API Key not set");

    try {
      const response = await this.ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: (systemInstruction || "") + " Provide answers in a professional, structured format using Markdown with clear headings, subheadings, and bullet points. Avoid mentioning you are an AI or a large language model. Act as a top-tier human performance coach.",
        },
      });

      for await (const chunk of response) {
        yield chunk.text;
      }
    } catch (error) {
      console.error("Stream Error:", error);
      throw error;
    }
  }

  async generateStudyPlan(goal: string, exam: string, hours: number, currentTime: string) {
    const systemInstruction = `You are a world-class productivity architect. 
    Mission Start Time: ${currentTime}. Total Available Duration: ${hours} hours. 
    Goal: ${goal}. Exam: ${exam}. 
    Generate a complete, realistic, time-stamped study plan using Pomodoro 
    technique (25 min study + 5 min break, long break after 4 sessions). 
    Include: exact start/end times starting strictly from ${currentTime}, topic names, 
    study methods (active recall, spaced repetition, mind mapping, etc.), 
    short breaks with activity suggestions, meals if full day, 
    motivational micro-goals. 
    
    Format: JSON array of tasks. Each task should have: id, title, startTime, endTime, duration (in minutes), method, tips.
    Ensure durations are accurate and add up to the total requested time.`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          startTime: { type: Type.STRING },
          endTime: { type: Type.STRING },
          duration: { type: Type.NUMBER },
          method: { type: Type.STRING },
          tips: { type: Type.STRING },
          checkpoints: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                completed: { type: Type.BOOLEAN },
              },
              required: ["time", "completed"],
            },
          },
        },
        required: ["id", "title", "startTime", "endTime", "duration", "method", "checkpoints"],
      },
    };

    return this.generateContent(`Generate a study plan for: ${goal}`, systemInstruction, schema);
  }

  async generateSyllabus(exam: string) {
    const systemInstruction = `You are a world-class educational content architect. 
    Your task is to generate a FULL, ACCURATE, PRODUCTION-GRADE syllabus for the subject: ${exam}.
    
    CRITICAL INSTRUCTIONS:
    1. Fetch and intelligently synthesize content from authoritative sources like W3Schools, GeeksForGeeks, MDN, or official documentation.
    2. The syllabus must be 100% accurate and reflect the actual topic breakdown used in professional preparation.
    3. Structure the data as a nested JSON hierarchy.
    4. For subjects like "CAT", include Quantitative Aptitude, Logical Reasoning, Data Interpretation, and Verbal Ability with all their standard sub-topics.
    5. For subjects like "Python", follow the standard learning path from basics (variables, types) to advanced (decorators, generators, async).`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
          weightage: { type: Type.NUMBER },
          estimatedHours: { type: Type.NUMBER },
          checked: { type: Type.BOOLEAN },
          children: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
                weightage: { type: Type.NUMBER },
                estimatedHours: { type: Type.NUMBER },
                checked: { type: Type.BOOLEAN },
              },
              required: ["id", "name", "difficulty", "weightage", "estimatedHours", "checked"],
            },
          },
        },
        required: ["id", "name", "difficulty", "weightage", "estimatedHours", "checked"],
      },
    };

    return this.generateContent(`Generate the most complete and accurate syllabus for ${exam}`, systemInstruction, schema);
  }

  async getBookRecommendations(exam: string) {
    const systemInstruction = `Recommend the top 10 books and study materials for ${exam}, including author, why it's recommended, which topics it covers, difficulty level, and where to get it. 
    Format as JSON array of objects.`;

    return this.generateContent(`Recommend books for ${exam}`, systemInstruction);
  }

  async generateImageCaption(base64Image: string, mimeType: string): Promise<string> {
    if (!this.ai) throw new Error("API Key not set");

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64Image,
                  mimeType: mimeType
                }
              },
              {
                text: "Analyze this image and provide a concise, engaging caption for a study community. If it's a study setup, mention the vibe. If it's notes, summarize the topic. Keep it under 20 words."
              }
            ]
          }
        ]
      });
      return response.text || "A new update from the community!";
    } catch (error) {
      console.error("Caption Generation Error:", error);
      return "A new update from the community!";
    }
  }
}

export const geminiService = new GeminiService();
