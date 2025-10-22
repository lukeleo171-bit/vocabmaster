import { NextResponse } from 'next/server';
import { testDatabaseConnection, testDatabaseOperations } from '@/lib/test-connection';

export async function GET() {
  try {
    // Test basic connection
    const connectionTest = await testDatabaseConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database connection failed', 
          error: connectionTest.error 
        },
        { status: 500 }
      );
    }

    // Test database operations
    const operationsTest = await testDatabaseOperations();
    
    if (!operationsTest.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database operations failed', 
          error: operationsTest.error 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection and operations successful!',
      data: operationsTest.data
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Test failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
