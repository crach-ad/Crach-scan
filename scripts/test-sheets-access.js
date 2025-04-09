// Test script to verify Google Sheets access
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

// Simple utility to log with timestamp
const log = (message, data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

// Get Google credentials from environment
const getCredentials = () => {
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error('GOOGLE_CREDENTIALS not found in environment');
  }
  
  try {
    return JSON.parse(process.env.GOOGLE_CREDENTIALS);
  } catch (error) {
    console.error('Error parsing GOOGLE_CREDENTIALS:', error);
    throw new Error('Invalid GOOGLE_CREDENTIALS format');
  }
};

// Initialize Google Sheets client
const getGoogleSheetsClient = async () => {
  const credentials = getCredentials();
  log('Using service account:', { email: credentials.client_email });
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  return google.sheets({ version: 'v4', auth: await auth.getClient() });
};

// Main function to test Google Sheets access
const testSheetsAccess = async () => {
  try {
    log('Starting Google Sheets access test');
    
    // Get spreadsheet ID from environment
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID not found in environment');
    }
    
    log('Using spreadsheet ID:', { 
      id: spreadsheetId,
      partial: `...${spreadsheetId.slice(-8)}` 
    });
    
    // Initialize Google Sheets client
    const sheets = await getGoogleSheetsClient();
    log('Successfully initialized Google Sheets client');
    
    // First, test reading from the spreadsheet
    log('Testing read access...');
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Attendance!A:F',
    });
    
    const rows = readResponse.data.values || [];
    log('Successfully read from spreadsheet', { 
      rowCount: rows.length,
      sample: rows.slice(0, 2)  // Show header and first row if available
    });
    
    // Now, test writing to the spreadsheet
    log('Testing write access...');
    const testRecord = [
      `test_${Date.now()}`,  // ID
      'test_session',        // Session ID
      'test_attendee',       // Attendee ID
      'Test User',           // Attendee Name
      new Date().toISOString(), // Timestamp
      'TEST'                 // Method
    ];
    
    log('Attempting to write test record:', { record: testRecord });
    
    const writeResponse = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Attendance!A:F',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [testRecord],
      },
    });
    
    log('Write response:', {
      updatedRange: writeResponse.data.updatedRange,
      updatedRows: writeResponse.data.updates?.updatedRows || 0,
      updatedCells: writeResponse.data.updates?.updatedCells || 0
    });
    
    log('Test completed successfully!');
    return true;
  } catch (error) {
    log('Error during test:', { 
      message: error.message, 
      stack: error.stack,
      details: error.response?.data?.error || 'No additional details'
    });
    return false;
  }
};

// Run the test
testSheetsAccess()
  .then(success => {
    if (success) {
      console.log('\n✅ Google Sheets access test PASSED');
    } else {
      console.log('\n❌ Google Sheets access test FAILED');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
