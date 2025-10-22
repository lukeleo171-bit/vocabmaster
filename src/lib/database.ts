import { supabase } from './supabase';
import { Word, Quiz, UserProgress } from './schema';

// Word operations
export async function createWord(word: Omit<Word, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('words')
    .insert([{
      ...word,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getWords() {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getWordById(id: string) {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateWord(id: string, updates: Partial<Word>) {
  const { data, error } = await supabase
    .from('words')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWord(id: string) {
  const { error } = await supabase
    .from('words')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Quiz operations
export async function createQuiz(quiz: Omit<Quiz, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('quizzes')
    .insert([{
      ...quiz,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getQuizzesByWordId(wordId: string) {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('word_id', wordId);

  if (error) throw error;
  return data;
}

// User progress operations
export async function createUserProgress(progress: Omit<UserProgress, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('user_progress')
    .insert([{
      ...progress,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserProgress(userId: string, wordId?: string) {
  let query = supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);

  if (wordId) {
    query = query.eq('word_id', wordId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function updateUserProgress(id: string, updates: Partial<UserProgress>) {
  const { data, error } = await supabase
    .from('user_progress')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
