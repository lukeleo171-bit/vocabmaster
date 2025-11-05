import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchWord = searchParams.get('word') || '';

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('words')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to count words',
        details: countError,
      }, { status: 500 });
    }

    // Get recent words
    const { data: recentWords, error: recentError } = await supabase
      .from('words')
      .select('word, definition, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (recentError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch recent words',
        details: recentError,
      }, { status: 500 });
    }

    // Search for specific word if provided
    let searchResult = null;
    if (searchWord) {
      const { data: foundWords, error: searchError } = await supabase
        .from('words')
        .select('word, definition, created_at')
        .ilike('word', `%${searchWord}%`);

      if (searchError) {
        searchResult = { error: searchError.message };
      } else {
        searchResult = foundWords;
      }
    }

    return NextResponse.json({
      success: true,
      totalWords: totalCount || 0,
      recentWords: recentWords || [],
      searchResult: searchWord ? searchResult : null,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
