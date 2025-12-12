import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL_NAME, SYSTEM_INSTRUCTION, GUIDE_SCHEMA } from "../constants";
import { Guide } from "../types";

// Helper to extract Video ID from standard YouTube URLs
export const extractVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Helper to extract Playlist ID
export const extractPlaylistId = (url: string): string | null => {
  const regExp = /[?&]list=([^#\&\?]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

// Helper to clean markdown from JSON string
const cleanJsonText = (text: string): string => {
  return text.replace(/```json\n?|```/g, '').trim();
};

// Retrieve videos from playlist using Gemini + Search (since we lack YT Data API)
export const getVideosFromPlaylist = async (playlistId: string): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  // Limit to first 5 to ensure reliability and speed in this demo
  const prompt = `Find the YouTube video URLs for the first 5 videos in this playlist: https://www.youtube.com/playlist?list=${playlistId}. 
  Return ONLY a raw JSON array of valid YouTube watch URLs (strings). Do not include markdown formatting.`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        // responseMimeType and responseSchema are NOT supported with tools
        tools: [{ googleSearch: {} }]
      }
    });
    
    const text = response.text;
    if (text) {
      try {
        return JSON.parse(cleanJsonText(text));
      } catch (e) {
        console.error("Failed to parse playlist JSON:", e);
        return [];
      }
    }
    return [];
  } catch (error) {
    console.error("Playlist Fetch Error:", error);
    return [];
  }
};

export const generateGuideFromVideo = async (
  videoUrl: string
): Promise<Partial<Guide>> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Since we cannot use responseSchema with tools, we must inject the schema into the prompt.
  const prompt = `
    I need a step-by-step guide based on this YouTube video URL: ${videoUrl}.
    
    Since you cannot directly watch the video, use the Google Search tool to find information about this specific video title or its likely content based on the ID/URL context.
    If exact video details are unavailable, generate a best-effort guide for the likely topic inferred from the URL context or title if accessible.
    
    The output MUST be a valid JSON object matching this schema structure:
    ${JSON.stringify(GUIDE_SCHEMA, null, 2)}

    Ensure the "steps" array contains objects with:
    - stepNumber (integer)
    - title (string)
    - description (string)
    - estimatedTime (string, e.g. "2 mins")
    - timestamp (string, e.g. "04:30")
    
    Return ONLY the raw JSON. Do not include markdown formatting or explanations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // responseMimeType: "application/json" is NOT supported with tools
        // responseSchema is NOT supported with tools
        tools: [{ googleSearch: {} }], 
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from Gemini.");
    }

    try {
      const jsonResponse = JSON.parse(cleanJsonText(text));
      return jsonResponse;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw Text:", text);
      throw new Error("Failed to parse Gemini response as JSON.");
    }

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};