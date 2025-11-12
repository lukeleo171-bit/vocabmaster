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

    // 1) Get any existing definitions from Supabase first (case-insensitive)
    let existingDefinitions: QuizItem[] = [];
    try {
      if (wordsToFetch.length > 0) {
        // Use case-insensitive search by searching for lowercase versions
        const lowerWords = wordsToFetch.map(w => w.toLowerCase());
        const { data, error } = await supabase
          .from('words')
          .select('word, definition')
          .or(lowerWords.map(w => `word.ilike.${w}`).join(','));
        if (error) {
          console.error('[Supabase] Read(words) failed:', error.message);
        } else if (data) {
          existingDefinitions = data.map(r => ({ word: r.word, definition: r.definition }));
          console.log(`[Supabase] Found ${existingDefinitions.length} existing words in DB`);
        }
      }
    } catch (readErr) {
      console.error('[Supabase] Exception during read:', readErr);
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
    // Only insert NEW definitions (fetchedDefinitions + customDefinitions), not existing ones
    try {
      const newDefinitions = [...customDefinitions, ...fetchedDefinitions];
      if (newDefinitions.length > 0) {
        const rows = newDefinitions.map(d => ({
          word: d.word,
          definition: d.definition,
        }));
        console.log(`[Supabase] Attempting to insert ${rows.length} new words:`, rows.map(r => r.word));
        // Insert new words (use upsert to handle any race conditions)
        const { data, error } = await supabase
          .from('words')
          .upsert(rows, { onConflict: 'word', ignoreDuplicates: true })
          .select();
        if (error) {
          console.error('[Supabase] Insert failed:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
        } else {
          console.log(`[Supabase] Successfully inserted ${data?.length || 0} new words`);
        }
      } else {
        console.log('[Supabase] No new words to insert - all words already exist in database');
      }
    } catch (persistErr) {
      console.error('[Supabase] Exception during persist:', persistErr);
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
