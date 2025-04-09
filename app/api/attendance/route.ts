import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets/service';

/**
 * POST /api/attendance
 * Records a new attendance entry when an attendee is scanned or manually added
 */
export async function POST(request: NextRequest) {
  console.log('ATTENDANCE API: POST request received');
  
  try {
    // Parse the request body
    const body = await request.json();
    console.log('ATTENDANCE API: Request body:', body);
    
    // Validate request data
    const { sessionId, attendeeId, method } = body;
    
    if (!sessionId || !attendeeId || !method) {
      console.error('ATTENDANCE API: Missing fields', { sessionId, attendeeId, method });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate method type
    if (method !== 'QR_SCAN' && method !== 'MANUAL') {
      console.error('ATTENDANCE API: Invalid method', { method });
      return NextResponse.json(
        { error: 'Invalid method type' },
        { status: 400 }
      );
    }
    
    // IMPORTANT: Check if this attendee is already logged for this session
    // This is a server-side duplicate prevention mechanism
    const existingRecords = await googleSheetsService.getAttendanceRecords();
    
    // Filter to find records for this session and attendee
    const alreadyLoggedToday = existingRecords.some(record => {
      const recordDate = new Date(record.timestamp).toDateString();
      const today = new Date().toDateString();
      
      return (
        record.sessionId === sessionId && 
        record.attendeeId === attendeeId &&
        recordDate === today
      );
    });
    
    // If already logged today, return a specific response
    if (alreadyLoggedToday) {
      console.log('ATTENDANCE API: Attendee already logged for this session today');
      return NextResponse.json(
        { 
          success: true, 
          message: 'Attendance already recorded for this session today',
          alreadyLogged: true
        },
        { status: 200 }
      );
    }
    
    console.log('ATTENDANCE API: Looking up attendee:', attendeeId);
    
    // Find attendee name first
    const attendee = await googleSheetsService.findAttendeeById(attendeeId);
    
    if (attendee) {
      console.log('ATTENDANCE API: Found attendee:', attendee.name);
    } else {
      console.warn('ATTENDANCE API: Attendee not found for ID:', attendeeId);
    }
    
    // Create a direct standalone record for the spreadsheet
    const attendanceRecord = {
      id: `att_${Date.now()}`,
      sessionId,
      attendeeId,
      attendeeName: attendee?.name || 'Unknown Attendee',
      timestamp: new Date().toISOString(),
      method
    };
    
    console.log('ATTENDANCE API: Logging attendance with record:', attendanceRecord);
    
    // Log attendance to Google Sheets with the name explicitly included
    const success = await googleSheetsService.logAttendance(
      attendanceRecord.sessionId,
      attendanceRecord.attendeeId,
      attendanceRecord.method as 'QR_SCAN' | 'MANUAL',
      attendanceRecord.attendeeName
    );
    
    if (!success) {
      console.error('ATTENDANCE API: Failed to log attendance');
      return NextResponse.json(
        { error: 'Failed to log attendance' },
        { status: 500 }
      );
    }
    
    console.log('ATTENDANCE API: Successfully logged attendance!');
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Attendance logged successfully',
        record: attendanceRecord
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in attendance API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/attendance
 * Retrieves attendance records from Google Sheets
 */
export async function GET() {
  try {
    const records = await googleSheetsService.getAttendanceRecords();
    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
}
