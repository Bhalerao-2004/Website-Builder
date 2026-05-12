import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[gemini] GEMINI_API_KEY not set — generation calls will fail.');
}

export const ai = new GoogleGenAI({ apiKey: apiKey ?? '' });

export const TEXT_MODEL = 'gemini-2.5-flash';
export const IMAGE_MODEL = 'gemini-2.5-flash-image';

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
  }
}

/**
 * Call Gemini and parse the response as JSON. Strips ```json fences if present.
 */
export async function generateJSON<T>(prompt: string, systemInstruction?: string): Promise<T> {
  try {
    const res = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.9,
      },
    });
    const text = res.text?.trim() ?? '';
    if (!text) throw new GeminiError('Gemini returned empty response');
    return parseJSONLoose<T>(text);
  } catch (err) {
    if (err instanceof GeminiError) throw err;
    const msg = err instanceof Error ? err.message : 'Unknown Gemini error';
    throw new GeminiError(`Text generation failed: ${msg}`);
  }
}

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  try {
    const res = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: { systemInstruction, temperature: 0.9 },
    });
    return res.text?.trim() ?? '';
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown Gemini error';
    throw new GeminiError(`Text generation failed: ${msg}`);
  }
}

export interface GeneratedImage {
  mimeType: string;
  dataBase64: string;
}

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  try {
    const res = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
    });
    const parts = res.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const inlineData = (part as { inlineData?: { mimeType?: string; data?: string } })
        .inlineData;
      if (inlineData?.data) {
        return {
          mimeType: inlineData.mimeType ?? 'image/png',
          dataBase64: inlineData.data,
        };
      }
    }
    throw new GeminiError('Gemini returned no image data');
  } catch (err) {
    if (err instanceof GeminiError) throw err;
    const msg = err instanceof Error ? err.message : 'Unknown Gemini error';
    throw new GeminiError(`Image generation failed: ${msg}`);
  }
}

function parseJSONLoose<T>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  }
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  const start =
    firstBrace === -1
      ? firstBracket
      : firstBracket === -1
        ? firstBrace
        : Math.min(firstBrace, firstBracket);
  if (start > 0) cleaned = cleaned.slice(start);
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new GeminiError(
      `Failed to parse Gemini JSON output: ${err instanceof Error ? err.message : 'parse error'}`,
    );
  }
}
