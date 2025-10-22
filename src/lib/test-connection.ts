import { supabase } from './supabase';

export async function testDatabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('words')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Database connection successful!');
    return { success: true, data };
  } catch (err) {
    console.error('Connection test failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Test function for development
export async function testDatabaseOperations() {
  try {
    console.log('Testing database operations...');
    
    // Test reading words
    const { data: words, error: wordsError } = await supabase
      .from('words')
      .select('*')
      .limit(5);

    if (wordsError) {
      console.error('Error reading words:', wordsError);
      return { success: false, error: wordsError.message };
    }

    console.log('✅ Successfully read words:', words?.length || 0, 'words found');
    return { success: true, data: words };
  } catch (err) {
    console.error('Database operations test failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
