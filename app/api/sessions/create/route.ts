import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets/service';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    console.log('Creating session with data:', body);
    
    // Validate required fields
    const { title, date, time } = body;
    
    if (!title || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields (title, date, time)' },
        { status: 400 }
      );
    }
    
    // Optional recurring fields
    const isRecurring = body.isRecurring === true;
    const recurringWeeks = isRecurring ? parseInt(body.recurringWeeks, 10) : undefined;
    const recurringInterval = isRecurring ? parseInt(body.recurringInterval, 10) || 7 : undefined;
    
    // Validate recurring parameters if it's a recurring session
    if (isRecurring && (!recurringWeeks || recurringWeeks <= 0)) {
      return NextResponse.json(
        { error: 'For recurring sessions, recurringWeeks must be a positive number' },
        { status: 400 }
      );
    }
    
    // Create the session
    const session = await googleSheetsService.createSession({
      title,
      date,
      time,
      isRecurring,
      recurringWeeks,
      recurringInterval
    });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: isRecurring 
        ? `Created recurring session "${title}" with ${recurringWeeks} instances` 
        : `Created session "${title}"`,
      session
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
