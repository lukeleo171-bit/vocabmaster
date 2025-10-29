'use server';

import {
  enhanceDefinitionExplanations,
} from '@/ai/flows/enhanced-definition-explanations';
import {
  generateQuizDefinitions,
} from '@/ai/flows/generate-quiz-definitions';
import {
  generateMultipleChoiceOptions,
} from '@/ai/flows/generate-multiple-choice-options';
import type {EnhancementType, QuizItem} from '@/types/quiz';
import { supabase } from '@/lib/supabase';
import {
  evaluateAnswer,
  type EvaluateAnswerInput,
  type EvaluateAnswerOutput,
} from '@/ai/flows/evaluate-answer';

export async function getQuizDefinitionsAction(
  words: (string | QuizItem)[]
): Promise<QuizItem[]> {
  try {
    if (words.length === 0) return [];
    
    const wordsToFetch = words.filter(w => typeof w === 'string') as string[];
    const customDefinitions = words.filter(w => typeof w !== 'string') as QuizItem[];

    // 1) Get any existing definitions from Supabase first
    let existingDefinitions: QuizItem[] = [];
    try {
      if (wordsToFetch.length > 0) {
        const { data, error } = await supabase
          .from('words')
          .select('word, definition')
          .in('word', wordsToFetch);
        if (error) {
          console.error('Supabase read(words) failed:', error.message);
        } else if (data) {
          existingDefinitions = data.map(r => ({ word: r.word, definition: r.definition }));
        }
      }
    } catch (readErr) {
      console.error('Failed to read existing words from Supabase:', readErr);
    }

    // Determine which words still need AI definitions
    const existingWordsLower = new Set(existingDefinitions.map(d => d.word.toLowerCase()));
    const wordsNeedingAi = wordsToFetch.filter(w => !existingWordsLower.has(w.toLowerCase()));

    // 2) Only call AI for words that don't already exist
    let fetchedDefinitions: QuizItem[] = [];
    if (wordsNeedingAi.length > 0) {
      const result = await generateQuizDefinitions({words: wordsNeedingAi});
      fetchedDefinitions = result.definitions;
    }
    
    const allDefinitions = [
      ...customDefinitions,
      ...existingDefinitions,
      ...fetchedDefinitions,
    ];

    // Persist to Supabase (best-effort, non-blocking for user experience)
    try {
      if (allDefinitions.length > 0) {
        const rows = allDefinitions.map(d => ({
          word: d.word,
          definition: d.definition,
          difficulty: 'medium',
        }));
        // Upsert on unique word constraint but do not overwrite existing definitions
        const { error } = await supabase
          .from('words')
          .upsert(rows, { onConflict: 'word', ignoreDuplicates: true });
        if (error) {
          console.error('Supabase upsert(words) failed:', error.message);
        }
      }
    } catch (persistErr) {
      console.error('Failed to persist words to Supabase:', persistErr);
      // Do not throw; persistence failure should not block quiz generation
    }

    // Ensure the order matches the original input words array structure
    return words.map(wordOrItem => {
      if(typeof wordOrItem !== 'string') {
        return wordOrItem;
      }
      const found = allDefinitions.find(d => d.word.toLowerCase() === wordOrItem.toLowerCase());
      return found || { word: wordOrItem, definition: 'Could not find a definition for this word.' };
    });

  } catch (error) {
    console.error('Error generating quiz definitions:', error);
    throw new Error('Failed to generate quiz. Please try again.');
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
      userDetails: 'A student preparing for a vocabulary test.',
    });
    return result.enhancedDefinition;
  } catch (error) {
    console.error('Error enhancing definition:', error);
    throw new Error('Failed to get enhancement. Please try again.');
  }
}

export async function evaluateAnswerAction(
  input: EvaluateAnswerInput
): Promise<EvaluateAnswerOutput> {
  try {
    return await evaluateAnswer(input);
  } catch (error) {
    console.error('Error evaluating answer:', error);
    throw new Error('Failed to evaluate answer. Please try again.');
  }
}

export async function getMultipleChoiceOptionsAction(
  word: string,
  correctDefinition: string
): Promise<string[]> {
  try {
    const result = await generateMultipleChoiceOptions({
      word,
      correctDefinition,
    });
    return result.options;
  } catch (error) {
    console.error('Error generating multiple choice options:', error);
    throw new Error('Failed to generate multiple choice options.');
  }
}
