// update-attendance-schema.js
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

async function updateAttendanceSchema() {
  try {
    console.log('🔄 Updating Attendance sheet schema...');

    // Check for required environment variables
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const credentials = process.env.GOOGLE_CREDENTIALS;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID not found in .env.local');
    }

    if (!credentials) {
      throw new Error('GOOGLE_CREDENTIALS not found in .env.local');
    }

    // Parse credentials
    const parsedCredentials = JSON.parse(credentials);

    // Create auth client
    const auth = new GoogleAuth({
      credentials: parsedCredentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Create Google Sheets client
    const authClient = await auth.getClient();
    const sheets = google.sheets({ 
      version: 'v4', 
      auth: authClient
    });

    // Check if Attendance sheet exists
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const existingSheets = spreadsheetInfo.data.sheets?.map(
      (sheet) => sheet.properties?.title
    ) || [];

    if (!existingSheets.includes('Attendance')) {
      console.log('❌ Attendance sheet not found. Please run setup-sheet.js first.');
      return;
    }

    // Get current header row from Attendance sheet
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Attendance!A1:F1',
    });

    const headerValues = headerResponse.data.values ? headerResponse.data.values[0] : [];
    
    // Check if name column already exists
    if (headerValues.includes('attendeeName')) {
      console.log('✅ Attendance sheet already has attendeeName column.');
      return;
    }

    // Update header row to include attendeeName
    const newHeaderRow = ['id', 'sessionId', 'attendeeId', 'attendeeName', 'timestamp', 'method'];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Attendance!A1:F1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [newHeaderRow],
      },
    });

    console.log('✅ Attendance sheet schema updated successfully!');
    console.log('Added attendeeName column to make tracking easier.');
    
  } catch (error) {
    console.error('❌ Error updating Attendance schema:', error);
    process.exit(1);
  }
}

// Run the update
updateAttendanceSchema();
