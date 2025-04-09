import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function setupGoogleSheet() {
  try {
    console.log('🔄 Setting up Google Sheet structure...');

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
      auth: authClient as any  // Force type casting to avoid TypeScript issue
    });

    // Check if spreadsheet exists and is accessible
    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
      });
      
      console.log(`✅ Connected to spreadsheet: "${spreadsheet.data.properties?.title}"`);
    } catch (error) {
      console.error('❌ Failed to access spreadsheet. Make sure the spreadsheet exists and is shared with the service account.');
      throw error;
    }

    // Get existing sheet names
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const existingSheets = spreadsheetInfo.data.sheets?.map(
      (sheet) => sheet.properties?.title
    ) || [];

    console.log('📊 Existing sheets:', existingSheets.join(', ') || 'None');

    // Define required sheets and their headers
    const requiredSheets = [
      {
        title: 'Attendees',
        headers: ['id', 'name', 'email', 'qrCode', 'createdAt'],
      },
      {
        title: 'Sessions',
        headers: ['id', 'title', 'date', 'time', 'createdAt'],
      },
      {
        title: 'Attendance',
        headers: ['id', 'sessionId', 'attendeeId', 'timestamp', 'method'],
      },
    ];

    // Process each required sheet
    for (const sheet of requiredSheets) {
      if (!existingSheets.includes(sheet.title)) {
        // If sheet doesn't exist, create it
        console.log(`🆕 Creating "${sheet.title}" sheet...`);
        
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheet.title,
                  },
                },
              },
            ],
          },
        });
      } else {
        console.log(`ℹ️ Sheet "${sheet.title}" already exists.`);
      }

      // Add headers to sheet if it's empty
      const range = `${sheet.title}!A1:${String.fromCharCode(65 + sheet.headers.length - 1)}1`;
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const headerValues = headerResponse.data.values;

      if (!headerValues || headerValues.length === 0) {
        // Add headers if the sheet is empty
        console.log(`📝 Adding headers to "${sheet.title}" sheet...`);
        
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: 'RAW',
          requestBody: {
            values: [sheet.headers],
          },
        });
      } else {
        console.log(`ℹ️ Headers already exist in "${sheet.title}" sheet.`);
      }
    }

    // Add sample data for testing (optional)
    const attendeesExist = await checkIfDataExists(sheets, spreadsheetId, 'Attendees!A2:E');
    const sessionsExist = await checkIfDataExists(sheets, spreadsheetId, 'Sessions!A2:E');

    if (!attendeesExist) {
      console.log('📝 Adding sample attendees...');
      
      // Generate some sample attendees with QR codes
      const sampleAttendees = [
        ['att_001', 'John Smith', 'john.smith@example.com', 'QR123456', new Date().toISOString()],
        ['att_002', 'Jane Doe', 'jane.doe@example.com', 'QR789012', new Date().toISOString()],
        ['att_003', 'Alex Johnson', 'alex.j@example.com', 'QR345678', new Date().toISOString()],
      ];
      
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Attendees!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: sampleAttendees,
        },
      });
    }

    if (!sessionsExist) {
      console.log('📝 Adding sample sessions...');
      
      // Generate some sample sessions
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayAfterTomorrow = new Date(now);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      
      const sampleSessions = [
        [
          'sess_001', 
          'Morning Meeting', 
          now.toISOString().split('T')[0], 
          '09:00 AM', 
          now.toISOString()
        ],
        [
          'sess_002', 
          'Team Workshop', 
          tomorrow.toISOString().split('T')[0], 
          '02:00 PM', 
          now.toISOString()
        ],
        [
          'sess_003', 
          'Project Review', 
          dayAfterTomorrow.toISOString().split('T')[0], 
          '10:30 AM', 
          now.toISOString()
        ],
      ];
      
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sessions!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: sampleSessions,
        },
      });
    }

    console.log('✅ Google Sheet setup completed successfully!');
    console.log('🔗 Sheet URL: https://docs.google.com/spreadsheets/d/' + spreadsheetId);
    
  } catch (error) {
    console.error('❌ Error setting up Google Sheet:', error);
    process.exit(1);
  }
}

async function checkIfDataExists(sheets: any, spreadsheetId: string, range: string): Promise<boolean> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return !!(response.data.values && response.data.values.length > 0);
}

// Run the setup
setupGoogleSheet();
