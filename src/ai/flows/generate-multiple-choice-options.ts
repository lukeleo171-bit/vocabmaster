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

Generate three incorrect definitions that could plausibly be the right answer. Do not include the correct definition in your output.`,
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
