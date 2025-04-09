import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets/service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('API: Getting attendee by ID:', params.id);
    
    if (!params.id) {
      return NextResponse.json(
        { error: 'Attendee ID is required' },
        { status: 400 }
      );
    }

    const attendee = await googleSheetsService.findAttendeeById(params.id);
    
    if (!attendee) {
      return NextResponse.json(
        { error: 'Attendee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      attendee 
    });
  } catch (error) {
    console.error('Error finding attendee by ID:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
