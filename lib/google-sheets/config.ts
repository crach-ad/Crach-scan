import { GoogleAuth } from 'google-auth-library';
import { google, sheets_v4 } from 'googleapis';

// Environment handling for different deployment environments
const getEnvCredentials = () => {
  // In production, use environment variables
  // In development, you can use a service account key file
  if (!process.env.GOOGLE_CREDENTIALS) {
    console.error('GOOGLE_CREDENTIALS environment variable is not set');
    throw new Error('Google credentials not found in environment variables');
  }

  try {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    
    // Validate that the credentials have the required fields
    if (!credentials.client_email || !credentials.private_key) {
      console.error('Credentials missing required fields', 
                   { hasClientEmail: !!credentials.client_email, hasPrivateKey: !!credentials.private_key });
      throw new Error('Google credentials missing required fields');
    }
    
    return credentials;
  } catch (error) {
    console.error('Error parsing Google credentials:', error);
    throw new Error('Invalid Google credentials format');
  }
};

// Initialize the Google Sheets API
export const getGoogleSheetsClient = async (): Promise<sheets_v4.Sheets> => {
  try {
    const credentials = getEnvCredentials();
    console.log('Using client email:', credentials.client_email);
    
    // Verify spreadsheet ID is set
    if (!SPREADSHEET_CONFIG.SPREADSHEET_ID) {
      console.error('GOOGLE_SHEET_ID environment variable is not set');
      throw new Error('Google Sheet ID not found in environment variables');
    }
    
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    console.log('Successfully initialized Google auth client');
    
    return google.sheets({ version: 'v4', auth: client as any });
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to initialize Google Sheets client: ${errorMessage}`);
  }
};

// Constants for Google Sheets configuration
export const SPREADSHEET_CONFIG = {
  // You'll need to create a Google Sheet and get its ID
  // The ID is in the URL: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
  SPREADSHEET_ID: process.env.GOOGLE_SHEET_ID || '',
  RANGES: {
    ATTENDEES: 'Attendees!A:E',
    SESSIONS: 'Sessions!A:K', // Updated to include recurring session fields (isRecurring, recurringWeeks, recurringInterval, parentSessionId)
    ATTENDANCE: 'Attendance!A:F', // Updated to include attendeeName column
  }
};

// Verify configuration on module load
console.log('Google Sheets configuration:', {
  sheetId: SPREADSHEET_CONFIG.SPREADSHEET_ID ? `...${SPREADSHEET_CONFIG.SPREADSHEET_ID.slice(-8)}` : 'NOT SET',
  ranges: SPREADSHEET_CONFIG.RANGES
});
