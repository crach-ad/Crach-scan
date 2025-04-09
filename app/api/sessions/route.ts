import { NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets/service';

/**
 * GET /api/sessions
 * Returns all sessions from the Google Sheet
 */
export async function GET() {
  try {
    const sessions = await googleSheetsService.getSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
