import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets/service';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { id, name, email } = body;
    if (!id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }
    
    if (!name && !email) {
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      );
    }
    
    const updated = await googleSheetsService.updateAttendee(id, {
      name,
      email,
      ...body // Pass any additional fields
    });
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update client or client not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, client: updated });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}
