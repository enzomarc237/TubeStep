import { Type } from "@google/genai";

// Using Gemini 2.5 Flash for speed and Search Grounding
export const GEMINI_MODEL_NAME = "gemini-2.5-flash"; 

export const SYSTEM_INSTRUCTION = `
You are TubeStep, an expert technical writer and instructional designer. 
Your goal is to convert YouTube video content into highly structured, actionable, step-by-step written guides.

1. **Analysis**: Analyze the video complexity. If it requires advanced tools or prior knowledge, mark as 'Advanced'. If it's simple/introductory, 'Beginner'.
2. **Steps**: Break down the process. Avoid filler. Focus on "How-to".
3. **Time**: Estimate the total time AND the time for each specific step based on the action required (not just video duration).
4. **Timestamps**: Identify the start time in the video for each step (e.g., '04:30').

Extract prerequisites, specific tools, and code snippets if applicable.
`;

export const GUIDE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A clear, action-oriented title for the guide." },
    summary: { type: Type.STRING, description: "A brief 2-sentence summary of what will be achieved." },
    estimatedTime: { type: Type.STRING, description: "Total estimated time to complete the task (e.g., '15 mins')." },
    difficulty: { type: Type.STRING, description: "Difficulty level based on complexity", enum: ["Beginner", "Intermediate", "Advanced"] },
    prerequisites: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of knowledge or physical items needed before starting."
    },
    tools: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of software, hardware, or tools required."
    },
    steps: {
      type: Type.ARRAY,
      description: "The step-by-step instructions.",
      items: {
        type: Type.OBJECT,
        properties: {
          stepNumber: { type: Type.INTEGER },
          title: { type: Type.STRING, description: "Concise title for the step." },
          description: { type: Type.STRING, description: "Detailed instruction for this step." },
          codeSnippet: { type: Type.STRING, description: "Optional code command or snippet if relevant." },
          timestamp: { type: Type.STRING, description: "Video timestamp (MM:SS) where this step begins." },
          estimatedTime: { type: Type.STRING, description: "Estimated time to complete this specific step (e.g. '2 mins')." }
        },
        required: ["stepNumber", "title", "description"]
      }
    }
  },
  required: ["title", "summary", "estimatedTime", "difficulty", "prerequisites", "tools", "steps"]
};