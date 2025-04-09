import { NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets/service';

/**
 * GET /api/attendees/qrcode/[code]
 * Finds an attendee by their QR code
 */
export async function GET(
  request: Request, 
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    
    if (!code) {
      return NextResponse.json(
        { error: 'QR code is required' },
        { status: 400 }
      );
    }
    
    const attendee = await googleSheetsService.findAttendeeByQrCode(code);
    
    if (!attendee) {
      return NextResponse.json(
        { error: 'Attendee not found for this QR code' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ attendee });
  } catch (error) {
    console.error('Error finding attendee by QR code:', error);
    return NextResponse.json(
      { error: 'Failed to find attendee' },
      { status: 500 }
    );
  }
}
