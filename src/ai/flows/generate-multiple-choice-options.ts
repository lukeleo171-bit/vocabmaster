'use server';
/**
 * @fileOverview An AI agent that generates multiple choice options for a definition.
 *
 * - generateMultipleChoiceOptions - A function that generates multiple choice options.
 * - GenerateMultipleChoiceOptionsInput - The input type for the generateMultipleChoiceOptions function.
 * - GenerateMultipleChoiceOptionsOutput - The return type for the generateMultipleChoiceOptions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMultipleChoiceOptionsInputSchema = z.object({
  word: z.string().describe('The vocabulary word.'),
  correctDefinition: z.string().describe('The correct definition of the word.'),
});
export type GenerateMultipleChoiceOptionsInput = z.infer<
  typeof GenerateMultipleChoiceOptionsInputSchema
>;

const GenerateMultipleChoiceOptionsOutputSchema = z.object({
  options: z
    .array(z.string())
    .length(3)
    .describe('An array of three plausible but incorrect definitions for the word.'),
});
export type GenerateMultipleChoiceOptionsOutput = z.infer<
  typeof GenerateMultipleChoiceOptionsOutputSchema
>;

export async function generateMultipleChoiceOptions(
  input: GenerateMultipleChoiceOptionsInput
): Promise<GenerateMultipleChoiceOptionsOutput> {
  return generateMultipleChoiceOptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMultipleChoiceOptionsPrompt',
  input: {schema: GenerateMultipleChoiceOptionsInputSchema},
  output: {schema: GenerateMultipleChoiceOptionsOutputSchema},
  prompt: `You are a helpful quiz assistant. Your task is to generate three plausible but incorrect multiple-choice options for a vocabulary word's definition.

Word: {{word}}
Correct Definition: {{correctDefinition}}

IMPORTANT REQUIREMENTS:
1. Generate three incorrect definitions that are DISTINCTLY different from the correct answer - they should be clearly wrong but sound plausible
2. DO NOT use other definitions, synonyms, or variations of the word "{{word}}" - these would be too similar and confusing
3. Use definitions from completely different words that are unrelated to "{{word}}"
4. Make each wrong answer clearly distinguishable from the correct definition - avoid subtle differences
5. The wrong answers should be plausible enough to be believable as definitions, but clearly incorrect for this specific word

Generate three incorrect definitions that meet these criteria.`,
});

const generateMultipleChoiceOptionsFlow = ai.defineFlow(
  {
    name: 'generateMultipleChoiceOptionsFlow',
    inputSchema: GenerateMultipleChoiceOptionsInputSchema,
    outputSchema: GenerateMultipleChoiceOptionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
