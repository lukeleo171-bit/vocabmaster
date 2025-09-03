"use server";

import {
  enhanceDefinitionExplanations,
} from "@/ai/flows/enhanced-definition-explanations";
import {
  generateQuizDefinitions,
} from "@/ai/flows/generate-quiz-definitions";
import type { EnhancementType, QuizItem } from "@/types/quiz";

export async function getQuizDefinitionsAction(
  words: string[]
): Promise<QuizItem[]> {
  try {
    if (words.length === 0) return [];
    const result = await generateQuizDefinitions({ words });
    // Ensure the order matches the input words
    return words.map(word => {
        const found = result.definitions.find(d => d.word.toLowerCase() === word.toLowerCase());
        return found || { word, definition: "Could not find a definition for this word." };
    });
  } catch (error) {
    console.error("Error generating quiz definitions:", error);
    throw new Error("Failed to generate quiz. Please try again.");
  }
}

export async function getEnhancedExplanationAction(
  word: string,
  definition: string,
  enhancementType: EnhancementType
): Promise<string> {
  try {
    const result = await enhanceDefinitionExplanations({
      word,
      definition,
      enhancementType,
      userDetails: "A student preparing for a vocabulary test.",
    });
    return result.enhancedDefinition;
  } catch (error) {
    console.error("Error enhancing definition:", error);
    throw new Error("Failed to get enhancement. Please try again.");
  }
}
