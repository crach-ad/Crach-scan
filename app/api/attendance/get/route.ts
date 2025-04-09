import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets/service';

export async function GET(request: NextRequest) {
  try {
    console.log('API: Getting all attendance records');
    
    // Fetch all attendance records from Google Sheets
    const records = await googleSheetsService.getAttendanceRecords();
    
    // Return the records
    return NextResponse.json({ 
      success: true, 
      records 
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
