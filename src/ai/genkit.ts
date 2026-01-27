import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const apiKey =
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLEAI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  '';

// Initialize Genkit
// Note: During build, if API key is missing, Genkit will still initialize
// but API calls will fail at runtime (which is expected)
export const ai = genkit({
  plugins: [googleAI({ apiKey })],
  model: 'googleai/gemini-2.5-flash',
});
