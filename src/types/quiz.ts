export type QuizItem = {
  word: string;
  definition: string;
};

export type QuizState = "input" | "loading" | "quiz" | "results";

export type QuizAnswerState = "answering" | "evaluating" | "spelling";

export type EnhancementType = "more detail" | "examples" | "context";

export type PastQuiz = {
  words: string[];
  history: { score: number; total: number }[];
};
