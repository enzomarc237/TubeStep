import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_NAME, SYSTEM_INSTRUCTION, GUIDE_SCHEMA } from "../constants";
import { Guide } from "../types";

// Helper to extract Video ID from standard YouTube URLs
export const extractVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const generateGuideFromVideo = async (
  videoUrl: string
): Promise<Partial<Guide>> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    I need a step-by-step guide based on this YouTube video URL: ${videoUrl}.
    
    Since you cannot directly watch the video, use the Google Search tool to find information about this specific video title or its likely content based on the ID/URL context.
    If exact video details are unavailable, generate a best-effort guide for the likely topic inferred from the URL context or title if accessible.
    
    The guide must be practical, actionable, and formatted strictly according to the requested JSON schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: GUIDE_SCHEMA,
        tools: [{ googleSearch: {} }], // Use Search Grounding to find video context
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from Gemini.");
    }

    const jsonResponse = JSON.parse(text);

    // If Search Grounding was used, we could log the sources here (available in response.candidates[0].groundingMetadata)
    // For this app, we just return the generated content.
    
    return jsonResponse;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};