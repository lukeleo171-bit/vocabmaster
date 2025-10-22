import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      POSTGRES_URL: process.env.POSTGRES_URL ? 'Set' : 'Missing',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET ? 'Set' : 'Missing',
      NODE_ENV: process.env.NODE_ENV || 'Not set',
    };

    // Test Supabase import
    let supabaseStatus = 'Unknown';
    try {
      const { supabase } = await import('@/lib/supabase');
      supabaseStatus = 'Import successful';
    } catch (error) {
      supabaseStatus = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    // Test database import
    let dbStatus = 'Unknown';
    try {
      const db = await import('@/lib/db');
      dbStatus = 'Import successful';
    } catch (error) {
      dbStatus = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      imports: {
        supabase: supabaseStatus,
        database: dbStatus,
      },
      message: 'Debug information collected'
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Debug failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
