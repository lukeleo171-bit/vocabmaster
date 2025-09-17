export type QuizItem = {
  word: string;
  definition: string;
  options?: string[];
};

export type QuizState = "input" | "loading" | "quiz" | "results" | "practice";

export type QuizAnswerState = "answering" | "evaluating" | "spelling";

export type EnhancementType = "more detail" | "examples" | "context";

export type PastQuiz = {
  words: string[];
  history: { score: number; total: number }[];
};

export type WordResult = {
  word: string;
  definition: string;
  definitionCorrect: boolean | null;
  spellingCorrect: boolean | null;
};

export type QuizType =
  | 'definition_spelling'
  | 'definition_only'
  | 'multiple_choice'
  | 'matching';
