import { config } from 'dotenv';
config();

import '@/ai/flows/generate-quiz-definitions.ts';
import '@/ai/flows/enhanced-definition-explanations.ts';
import '@/ai/flows/evaluate-answer.ts';
import '@/ai/flows/generate-multiple-choice-options.ts';
