import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if we can import Supabase
    let supabaseStatus = 'Unknown';
    let supabaseError = null;
    
    try {
      const { supabase } = await import('@/lib/supabase');
      supabaseStatus = 'Import successful';
      
      // Try a simple query
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .limit(1);
        
      if (error) {
        supabaseError = error.message;
      }
    } catch (err) {
      supabaseStatus = 'Import failed';
      supabaseError = err instanceof Error ? err.message : 'Unknown error';
    }

    // Check environment variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      NODE_ENV: process.env.NODE_ENV || 'Not set',
    };

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envVars,
      supabase: {
        status: supabaseStatus,
        error: supabaseError,
      },
      message: 'Status check completed'
    });

  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Status check failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
