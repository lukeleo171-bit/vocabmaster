export type QuizItem = {
  word: string;
  definition: string;
};

export type QuizState = "input" | "loading" | "quiz" | "results";

export type QuizAnswerState = "answering" | "evaluating";

export type EnhancementType = "more detail" | "examples" | "context";
