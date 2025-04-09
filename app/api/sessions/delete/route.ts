import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets/service';

export async function DELETE(request: NextRequest) {
  try {
    // Get the session ID from the URL search params
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('id');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Delete the session
    const success = await googleSheetsService.deleteSession(sessionId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
