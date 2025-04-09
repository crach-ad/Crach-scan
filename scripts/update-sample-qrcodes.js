// update-sample-qrcodes.js
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const crypto = require('crypto');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// Generate a secure QR code value
function generateQRCodeValue() {
  // Generate a random UUID and return the first 10 characters
  return `ATT-${crypto.randomUUID().substring(0, 10)}`;
}

async function updateSampleQRCodes() {
  try {
    console.log('🔄 Updating sample QR codes...');

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

    // Get existing attendees
    const attendeesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Attendees!A:E',
    });

    const attendees = attendeesResponse.data.values || [];
    
    if (attendees.length <= 1) {
      console.log('No attendees found to update. Please run setup-sheet.js first.');
      return;
    }

    console.log(`Found ${attendees.length - 1} attendees to update with real QR codes.`);

    // Skip header row and update QR codes
    const updatedAttendees = [];
    for (let i = 1; i < attendees.length; i++) {
      const attendee = attendees[i];
      // Generate a real QR code value
      const qrCodeValue = generateQRCodeValue();
      
      // Update the QR code value (column D, index 3)
      attendee[3] = qrCodeValue;
      updatedAttendees.push(attendee);
      
      console.log(`Updated ${attendee[1]} with QR code: ${qrCodeValue}`);
    }

    // Clear existing data (except header)
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Attendees!A2:E',
    });

    // Write updated attendees
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Attendees!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: updatedAttendees,
      },
    });

    console.log('✅ Sample QR codes updated successfully!');
    console.log('🔗 Sheet URL: https://docs.google.com/spreadsheets/d/' + spreadsheetId);
    console.log('📱 Visit http://localhost:3008/qrcodes to view the QR codes');
    console.log('🔍 Visit http://localhost:3008/admin/scan to test scanning these QR codes');
    
  } catch (error) {
    console.error('❌ Error updating sample QR codes:', error);
    process.exit(1);
  }
}

// Run the update
updateSampleQRCodes();
