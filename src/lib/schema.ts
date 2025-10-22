import { z } from "zod";

export const wordInputSchema = z.object({
  words: z
    .string()
    .min(1, { message: "Please enter at least one word." })
    .refine((val) => val.trim().length > 0, {
      message: "Please enter at least one word.",
    }),
});

// Database schemas for vocabulary app
export const wordSchema = z.object({
  id: z.string().uuid(),
  word: z.string(),
  definition: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  created_at: z.date(),
  updated_at: z.date(),
});

export const quizSchema = z.object({
  id: z.string().uuid(),
  word_id: z.string().uuid(),
  question: z.string(),
  correct_answer: z.string(),
  options: z.array(z.string()),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  created_at: z.date(),
});

export const userProgressSchema = z.object({
  id: z.string().uuid(),
  word_id: z.string().uuid(),
  user_id: z.string().uuid(),
  score: z.number().min(0).max(100),
  attempts: z.number().min(0),
  last_attempted: z.date(),
  mastered: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date(),
});

export type Word = z.infer<typeof wordSchema>;
export type Quiz = z.infer<typeof quizSchema>;
export type UserProgress = z.infer<typeof userProgressSchema>;
