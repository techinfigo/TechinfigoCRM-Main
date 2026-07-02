// This service will handle interactions with the Google Gemini API.

// FIX: Implement Gemini AI client and service function as per guidelines.
import { GoogleGenAI } from "@google/genai";

// It's recommended to initialize the AI client once and reuse it.
// The API key is assumed to be pre-configured in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates text content using the Gemini API.
 * @param promptText The text prompt to send to the model.
 * @returns The generated text response from the model.
 */
export async function generateTextWithGemini(promptText: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error calling AI."
    return `Error generating text from AI: ${errorMessage}`;
  }
}
