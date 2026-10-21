// config/gemini.ts

import { GoogleGenAI } from "@google/genai";

const Gemini_Api_Key = process.env.GEMINI_API_KEY;

if (!Gemini_Api_Key) {
  throw new Error("GEMINI_API_KEY is not defined in .env.local");
}

export const gemini = new GoogleGenAI({
  apiKey: Gemini_Api_Key,
});

export async function askGemini(prompt: string) {
  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
}