// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview This file defines a Genkit flow that generates definitions for a list of vocabulary words.
 *
 * - generateQuizDefinitions - A function that takes an array of words and returns their definitions.
 * - GenerateQuizDefinitionsInput - The input type for the generateQuizDefinitions function.
 * - GenerateQuizDefinitionsOutput - The return type for the generateQuizDefinitions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizDefinitionsInputSchema = z.object({
  words: z.array(z.string()).describe('An array of vocabulary words to define.'),
});
export type GenerateQuizDefinitionsInput = z.infer<
  typeof GenerateQuizDefinitionsInputSchema
>;

const GenerateQuizDefinitionsOutputSchema = z.object({
  definitions: z.array(
    z.object({
      word: z.string().describe('The vocabulary word.'),
      definition: z.string().describe('The definition of the word.'),
    })
  ).describe('An array of word-definition pairs.'),
});
export type GenerateQuizDefinitionsOutput = z.infer<
  typeof GenerateQuizDefinitionsOutputSchema
>;

export async function generateQuizDefinitions(
  input: GenerateQuizDefinitionsInput
): Promise<GenerateQuizDefinitionsOutput> {
  return generateQuizDefinitionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizDefinitionsPrompt',
  input: {schema: GenerateQuizDefinitionsInputSchema},
  output: {schema: GenerateQuizDefinitionsOutputSchema},
  prompt: `You are an expert vocabulary tutor. Provide clear and concise definitions for the following words:

{{#each words}}
- {{this}}
{{/each}}

Return the definitions in the following JSON format:

{
  "definitions": [
    {
      "word": "word1",
      "definition": "definition1"
    },
    {
      "word": "word2",
      "definition": "definition2"
    }
  ]
}
`,
});

const generateQuizDefinitionsFlow = ai.defineFlow(
  {
    name: 'generateQuizDefinitionsFlow',
    inputSchema: GenerateQuizDefinitionsInputSchema,
    outputSchema: GenerateQuizDefinitionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
