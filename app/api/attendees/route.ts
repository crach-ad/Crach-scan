import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets/service';

/**
 * GET /api/attendees
 * Returns all attendees or searches for attendees by name/email if query parameter is provided
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    
    if (query) {
      // Search attendees by name or email
      const attendees = await googleSheetsService.searchAttendees(query);
      return NextResponse.json({ attendees });
    } else {
      // Get all attendees
      const attendees = await googleSheetsService.getAttendees();
      return NextResponse.json({ attendees });
    }
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendees' },
      { status: 500 }
    );
  }
}
