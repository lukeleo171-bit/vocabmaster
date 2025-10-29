import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const apiKey =
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLEAI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  '';

if (!apiKey) {
  // This will surface clearly in logs if the key is missing in Vercel
  console.error('Missing Google AI API key. Set GOOGLE_API_KEY in environment variables.');
}

export const ai = genkit({
  plugins: [googleAI({ apiKey })],
  model: 'googleai/gemini-2.5-flash',
});
