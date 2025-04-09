import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { name, email } = body;
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    const client = await googleSheetsService.createAttendee({
      name,
      email,
      ...body // Pass any additional fields
    });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
