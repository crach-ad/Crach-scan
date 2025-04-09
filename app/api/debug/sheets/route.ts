import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient, SPREADSHEET_CONFIG } from '@/lib/google-sheets/config';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envStatus = {
      hasGoogleCredentials: !!process.env.GOOGLE_CREDENTIALS,
      hasSheetId: !!process.env.GOOGLE_SHEET_ID,
      sheetsRange: SPREADSHEET_CONFIG.RANGES.SESSIONS,
    };
    
    console.log('Environment status:', envStatus);
    
    if (!envStatus.hasGoogleCredentials || !envStatus.hasSheetId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required environment variables',
        details: envStatus,
      }, { status: 500 });
    }
    
    // Attempt to initialize Google Sheets client
    console.log('Attempting to initialize Google Sheets client...');
    const sheetsClient = await getGoogleSheetsClient();
    console.log('Successfully initialized Google Sheets client');
    
    // Try to access the spreadsheet
    console.log('Attempting to access the Sessions sheet...');
    const spreadsheetId = SPREADSHEET_CONFIG.SPREADSHEET_ID;
    
    // Just try to read a single cell to verify access
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: 'A1:A1',
    });
    
    console.log('Successfully accessed Google Sheet');
    
    // Try to append a test value to the Sessions sheet
    const testData = [['DEBUG_TEST', 'Connectivity Test', new Date().toISOString(), 'Test Time', new Date().toISOString()]];
    const appendResponse = await sheetsClient.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sessions!A:E',  // Use the minimal columns in Sessions that we know should exist
      valueInputOption: 'RAW',
      requestBody: { values: testData },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Google Sheets connection is working',
      details: {
        canRead: !!response.data,
        canWrite: !!appendResponse.data,
        spreadsheetId: spreadsheetId?.slice(-8) || null, // Only show last 8 chars for security
        sessionsRange: SPREADSHEET_CONFIG.RANGES.SESSIONS,
      }
    });
  } catch (error) {
    console.error('Diagnostics error:', error);
    
    return NextResponse.json({
      success: false, 
      error: 'Failed to connect to Google Sheets',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
