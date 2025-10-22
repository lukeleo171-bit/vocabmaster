'use server';
/**
 * @fileOverview An AI agent that evaluates a user's answer for a definition.
 *
 * - evaluateAnswer - A function that evaluates a user's answer.
 * - EvaluateAnswerInput - The input type for the evaluateAnswer function.
 * - EvaluateAnswerOutput - The return type for the evaluateAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateAnswerInputSchema = z.object({
  word: z.string().describe('The vocabulary word.'),
  userAnswer: z
    .string()
    .describe("The user's provided definition for the word."),
  correctDefinition: z.string().describe('The correct definition of the word.'),
});
export type EvaluateAnswerInput = z.infer<typeof EvaluateAnswerInputSchema>;

const EvaluateAnswerOutputSchema = z.object({
  isCorrect: z
    .boolean()
    .describe(
      'Whether the user answer is correct. Be lenient, as long as the user understands the main idea.'
    ),
  feedback: z.string().describe('A short, helpful feedback for the user.'),
});
export type EvaluateAnswerOutput = z.infer<typeof EvaluateAnswerOutputSchema>;

export async function evaluateAnswer(
  input: EvaluateAnswerInput
): Promise<EvaluateAnswerOutput> {
  return evaluateAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateAnswerPrompt',
  input: {schema: EvaluateAnswerInputSchema},
  output: {schema: EvaluateAnswerOutputSchema},
  prompt: `You are a helpful quiz assistant. Your task is to evaluate a user's answer for a vocabulary word. Be lenient in your evaluation. As long as the user captures the main idea of the definition, mark it as correct.

Word: {{word}}
Correct Definition: {{correctDefinition}}
User's Answer: {{userAnswer}}

Based on this, is the user's answer correct? Provide short, helpful feedback.`,
});

const evaluateAnswerFlow = ai.defineFlow(
  {
    name: 'evaluateAnswerFlow',
    inputSchema: EvaluateAnswerInputSchema,
    outputSchema: EvaluateAnswerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
