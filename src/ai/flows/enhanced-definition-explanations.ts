'use server';
/**
 * @fileOverview An AI agent that enhances definition explanations.
 *
 * - enhanceDefinitionExplanations - A function that enhances definition explanations.
 * - EnhanceDefinitionExplanationsInput - The input type for the enhanceDefinitionExplanations function.
 * - EnhanceDefinitionExplanationsOutput - The return type for the enhanceDefinitionExplanations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceDefinitionExplanationsInputSchema = z.object({
  word: z.string().describe('The word to enhance the definition for.'),
  definition: z.string().describe('The current definition of the word.'),
  userDetails: z.string().describe('Details about the user, such as their learning level and goals.'),
  enhancementType: z
    .enum(['more detail', 'examples', 'context'])
    .describe('The type of enhancement to provide for the definition.'),
});
export type EnhanceDefinitionExplanationsInput = z.infer<
  typeof EnhanceDefinitionExplanationsInputSchema
>;

const EnhanceDefinitionExplanationsOutputSchema = z.object({
  enhancedDefinition: z
    .string()
    .describe('The enhanced definition with more detail, examples, or context.'),
});
export type EnhanceDefinitionExplanationsOutput = z.infer<
  typeof EnhanceDefinitionExplanationsOutputSchema
>;

export async function enhanceDefinitionExplanations(
  input: EnhanceDefinitionExplanationsInput
): Promise<EnhanceDefinitionExplanationsOutput> {
  return enhanceDefinitionExplanationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceDefinitionExplanationsPrompt',
  input: {schema: EnhanceDefinitionExplanationsInputSchema},
  output: {schema: EnhanceDefinitionExplanationsOutputSchema},
  prompt: `You are an expert vocabulary tutor.

You are helping a student understand the word '{{word}}'.
The current definition is: {{definition}}

The student wants {{enhancementType}} to better understand the word.
The student's learning level and goals are: {{userDetails}}

Provide an enhanced definition with the requested enhancement type.

Enhanced Definition:`,
});

const enhanceDefinitionExplanationsFlow = ai.defineFlow(
  {
    name: 'enhanceDefinitionExplanationsFlow',
    inputSchema: EnhanceDefinitionExplanationsInputSchema,
    outputSchema: EnhanceDefinitionExplanationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
