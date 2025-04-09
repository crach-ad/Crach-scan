import { getGoogleSheetsClient, SPREADSHEET_CONFIG } from './config';

// Types for our data model
export interface Attendee {
  id: string;
  name: string;
  email: string;
  qrCode: string;
  createdAt: string;
}

export interface Session {
  id: string;
  title: string;
  date: string;
  time: string;
  createdAt: string;
  isRecurring?: boolean;
  recurringWeeks?: number; // Number of weeks the session recurs
  recurringInterval?: number; // Days between recurrences (typically 7 for weekly)
  parentSessionId?: string; // For generated recurring sessions, links back to the original
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  attendeeId: string;
  attendeeName: string;
  timestamp: string;
  method: 'QR_SCAN' | 'MANUAL';
}

// In-memory cache to track recent attendance records and prevent duplicates
// Key format: sessionId:attendeeId:date:method
// By including method, we allow separate locks for QR vs manual entries
const attendanceLocks: Record<string, boolean> = {};

/**
 * Google Sheets Service
 * Handles all interactions with Google Sheets for the attendance system
 */
class GoogleSheetsService {
  // Spreadsheet ID from environment variable
  private spreadsheetId: string = SPREADSHEET_CONFIG.SPREADSHEET_ID;
  
  /**
   * Get an authenticated Google Sheets client
   * @private
   */
  private async getSheetsClient() {
    return await getGoogleSheetsClient();
  }
  /**
   * Get all sessions from the spreadsheet
   */
  async getSessions(): Promise<Session[]> {
    try {
      const sheets = await getGoogleSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_CONFIG.SPREADSHEET_ID,
        range: SPREADSHEET_CONFIG.RANGES.SESSIONS,
      });

      // Handle empty response
      const rows = response.data.values || [];
      
      // Skip header row and map data to Session objects
      return rows.slice(1).map((row) => ({
        id: row[0] || '',
        title: row[1] || '',
        date: row[2] || '',
        time: row[3] || '',
        createdAt: row[4] || '',
      }));
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  /**
   * Get all attendees from the spreadsheet
   */
  async getAttendees(): Promise<Attendee[]> {
    try {
      const sheets = await getGoogleSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_CONFIG.SPREADSHEET_ID,
        range: SPREADSHEET_CONFIG.RANGES.ATTENDEES,
      });

      // Handle empty response
      const rows = response.data.values || [];
      
      // Skip header row and map data to Attendee objects
      return rows.slice(1).map((row) => ({
        id: row[0] || '',
        name: row[1] || '',
        email: row[2] || '',
        qrCode: row[3] || '',
        createdAt: row[4] || '',
      }));
    } catch (error) {
      console.error('Error fetching attendees:', error);
      return [];
    }
  }

  /**
   * Get attendance records from the spreadsheet
   */
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    try {
      const sheets = await getGoogleSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_CONFIG.SPREADSHEET_ID,
        range: SPREADSHEET_CONFIG.RANGES.ATTENDANCE,
      });

      // Handle empty response
      const rows = response.data.values || [];
      
      // Skip header row and map data to AttendanceRecord objects
      return rows.slice(1).map((row) => ({
        id: row[0] || '',
        sessionId: row[1] || '',
        attendeeId: row[2] || '',
        attendeeName: row[3] || '',
        timestamp: row[4] || '',
        method: (row[5] || 'QR_SCAN') as 'QR_SCAN' | 'MANUAL',
      }));
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      return [];
    }
  }

  /**
   * Get all attendance records (alias for getAttendanceRecords)
   * Used by the dashboard to display attendance statistics
   */
  async getAllAttendance(): Promise<AttendanceRecord[]> {
    return this.getAttendanceRecords();
  }

  /**
   * Find an attendee by their QR code
   */
  async findAttendeeByQrCode(qrCode: string): Promise<Attendee | null> {
    try {
      console.log(`Searching for attendee with QR code: ${qrCode}`);
      
      const attendees = await this.getAttendees();
      console.log(`Found ${attendees.length} attendees in database`);
      
      if (attendees.length === 0) {
        console.warn('No attendees found in the database');
        return null;
      }
      
      // Debug: Log the first few QR codes in the database
      console.log('Sample QR codes in database:', 
                 attendees.slice(0, 3).map(a => ({ id: a.id, qrCode: a.qrCode })));
      
      // Case-insensitive search for QR code
      const normalizedQrCode = qrCode.trim().toLowerCase();
      const attendee = attendees.find(a => a.qrCode.toLowerCase() === normalizedQrCode);
      
      if (attendee) {
        console.log(`Found attendee: ${attendee.name} (${attendee.id})`);
        return attendee;
      } else {
        console.warn(`No attendee found with QR code: ${qrCode}`);
        return null;
      }
    } catch (error) {
      console.error('Error finding attendee by QR code:', error);
      return null;
    }
  }

  /**
   * Find an attendee by their ID
   */
  async findAttendeeById(id: string): Promise<Attendee | null> {
    try {
      const attendees = await this.getAttendees();
      return attendees.find(attendee => attendee.id === id) || null;
    } catch (error) {
      console.error('Error finding attendee by ID:', error);
      return null;
    }
  }

  /**
   * Log attendance for an attendee at a session - simplified direct implementation
   */
  async logAttendance(sessionId: string, attendeeId: string, method: 'QR_SCAN' | 'MANUAL', attendeeName?: string): Promise<boolean> {
    console.log('==================================================');
    console.log('DIRECT LOGGING TO SPREADSHEET');
    console.log(`Session: ${sessionId}, Attendee: ${attendeeId}, Method: ${method}`);
    
    // Create a unique lock key - use the date and method so different entry methods don't block each other
    const today = new Date().toISOString().split('T')[0]; // Just the date part YYYY-MM-DD
    const lockKey = `${sessionId}:${attendeeId}:${today}:${method}`;
    
    // Check if we already have a lock for this exact combination today
    if (attendanceLocks[lockKey]) {
      console.log('🔒 DUPLICATE PREVENTION: Already processed attendance for this session/attendee today');
      console.log(`Lock exists for key: ${lockKey}`);
      console.log('==================================================');
      return true; // Return success since we're preventing a duplicate, not failing
    }
    
    // Set the lock immediately to prevent race conditions
    attendanceLocks[lockKey] = true;
    
    // First make sure we have a Google Sheet ID
    if (!SPREADSHEET_CONFIG.SPREADSHEET_ID) {
      // Release lock on error
      delete attendanceLocks[lockKey];
      console.error('CRITICAL ERROR: No Google Sheet ID found in environment');
      return false;
    }
    
    // Check if this attendance was already recorded in the spreadsheet
    try {
      console.log('Checking for existing attendance records today...');
      const records = await this.getAttendanceRecords();
      
      const todayRecords = records.filter(record => {
        const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
        return record.sessionId === sessionId && 
               record.attendeeId === attendeeId && 
               recordDate === today;
      });
      
      if (todayRecords.length > 0) {
        console.log(`DUPLICATE CHECK: Found ${todayRecords.length} existing records for this attendee today`);
        console.log('No new record will be created - returning success');
        console.log('==================================================');
        return true;
      }
      
      console.log('No existing records found, proceeding with new attendance record');
    } catch (err) {
      console.error('Error checking for existing records:', err);
      // Continue with creating a new record as we can't confirm if a duplicate exists
    }
    
    // Generate attendance record
    const id = `att_${Date.now()}`;
    const timestamp = new Date().toISOString();
    let name = attendeeName || 'Unknown';
    
    // If no name was provided, try to find it
    if (!name || name === 'Unknown') {
      try {
        console.log(`Looking up name for attendee ID: ${attendeeId}`);
        const attendee = await this.findAttendeeById(attendeeId);
        if (attendee) {
          name = attendee.name;
          console.log(`Found attendee name: ${name}`);
        }
      } catch (err) {
        console.error('Error finding attendee name:', err);
      }
    }
    
    // Log what we're about to write
    console.log('Writing attendance record to spreadsheet:');
    console.log(JSON.stringify({
      id,
      sessionId,
      attendeeId,
      attendeeName: name,
      timestamp,
      method
    }, null, 2));
    
    try {
      // Get a fresh sheets client
      const sheets = await getGoogleSheetsClient();
      
      // Directly append to the spreadsheet with minimal processing
      const result = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_CONFIG.SPREADSHEET_ID,
        range: 'Attendance!A:F',  // Directly specify the range to avoid issues
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            id,
            sessionId,
            attendeeId,
            name,
            timestamp,
            method
          ]]
        }
      });
      
      // Check the result
      if (result.status === 200) {
        console.log('SUCCESS: Record added to spreadsheet');
        console.log(`Updated range: ${result.data.updatedRange}`);
        console.log(`Updated cells: ${result.data.updates?.updatedCells || 0}`);
        
        // Keep the lock for a short period to prevent accidental duplicates
        // But make it short enough to not interfere with legitimate operations
        setTimeout(() => {
          delete attendanceLocks[lockKey];
          console.log(`Released lock for ${lockKey} after timeout`);
        }, 3000);
        
        console.log('==================================================');
        return true;
      } else {
        // Release lock on error
        delete attendanceLocks[lockKey];
        console.error('ERROR: Unexpected response from Google Sheets API:', result.status);
        console.error(result.statusText);
        console.log('==================================================');
        return false;
      }
    } catch (error) {
      // Release lock on error
      delete attendanceLocks[lockKey];
      console.error('CRITICAL ERROR adding attendance record to spreadsheet:');
      console.error(error);
      console.log('==================================================');
      return false;
    }
  }

  /**
   * Search attendees by name or email
   */
  async searchAttendees(query: string): Promise<Attendee[]> {
    try {
      const attendees = await this.getAttendees();
      query = query.toLowerCase();
      
      return attendees.filter(attendee => 
        attendee.name.toLowerCase().includes(query) || 
        attendee.email.toLowerCase().includes(query)
      );
    } catch (error) {
      console.error('Error searching attendees:', error);
      return [];
    }
  }
  
  /**
   * Generate a unique QR code for an attendee
   * @private
   */
  private generateQrCode(): string {
    // Generate a random 8-character alphanumeric code prefixed with 'QR'
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'QR';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
  
  /**
   * Create a new attendee (client) in the database
   * @param attendeeData The attendee data to create
   * @returns The created attendee or null if creation failed
   */
  async createAttendee(attendeeData: Omit<Attendee, 'id' | 'createdAt' | 'qrCode'>): Promise<Attendee | null> {
    try {
      console.log('Creating attendee with data:', JSON.stringify(attendeeData, null, 2));
      
      const id = `attendee_${Date.now()}`;
      const createdAt = new Date().toISOString();
      const qrCode = this.generateQrCode();
      
      // Create the attendee record
      const attendee: Attendee = {
        id,
        name: attendeeData.name,
        email: attendeeData.email,
        qrCode,
        createdAt
      };
      
      console.log('Creating new attendee record:', JSON.stringify(attendee, null, 2));
      
      // Get the Sheets API client
      const sheetsClient = await this.getSheetsClient();
      
      // Prepare row data
      const rowData = [
        attendee.id,
        attendee.name,
        attendee.email,
        attendee.qrCode,
        attendee.createdAt
      ];
      
      // Append to the Attendees sheet
      const response = await sheetsClient.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: SPREADSHEET_CONFIG.RANGES.ATTENDEES,
        valueInputOption: 'RAW',
        requestBody: {
          values: [rowData]
        }
      });
      
      console.log('Google Sheets append response:', {
        status: response.status,
        statusText: response.statusText
      });
      
      return attendee;
    } catch (error) {
      console.error('Error creating attendee:', error);
      return null;
    }
  }
  
  /**
   * Update an existing attendee (client) in the database
   * @param id The ID of the attendee to update
   * @param attendeeData The updated attendee data
   * @returns The updated attendee or null if update failed
   */
  async updateAttendee(id: string, attendeeData: Partial<Omit<Attendee, 'id' | 'createdAt'>>): Promise<Attendee | null> {
    try {
      console.log(`Updating attendee ${id} with data:`, JSON.stringify(attendeeData, null, 2));
      
      // Get current attendees
      const sheetsClient = await this.getSheetsClient();
      const response = await sheetsClient.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: SPREADSHEET_CONFIG.RANGES.ATTENDEES,
      });
      
      const rows = response.data.values || [];
      
      // Find the index of the attendee to update (skip header row)
      let rowIndex = -1;
      let existingAttendee: Attendee | null = null;
      
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === id) {
          rowIndex = i;
          existingAttendee = {
            id: rows[i][0],
            name: rows[i][1],
            email: rows[i][2],
            qrCode: rows[i][3],
            createdAt: rows[i][4]
          };
          break;
        }
      }
      
      if (rowIndex === -1 || !existingAttendee) {
        console.warn(`Attendee with ID ${id} not found`);
        return null;
      }
      
      // Update the attendee data, keeping existing values where not specified
      const updatedAttendee: Attendee = {
        ...existingAttendee,
        name: attendeeData.name !== undefined ? attendeeData.name : existingAttendee.name,
        email: attendeeData.email !== undefined ? attendeeData.email : existingAttendee.email,
        qrCode: attendeeData.qrCode !== undefined ? attendeeData.qrCode : existingAttendee.qrCode
      };
      
      // Prepare the updated row
      const updatedRow = [
        updatedAttendee.id,
        updatedAttendee.name,
        updatedAttendee.email,
        updatedAttendee.qrCode,
        updatedAttendee.createdAt
      ];
      
      // Update the row in the sheet
      // A1 notation for the range, like 'Attendees!A2:E2' for row 2
      const updateRange = `${SPREADSHEET_CONFIG.RANGES.ATTENDEES.split('!')[0]}!A${rowIndex + 1}:E${rowIndex + 1}`;
      
      const updateResponse = await sheetsClient.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: updateRange,
        valueInputOption: 'RAW',
        requestBody: {
          values: [updatedRow]
        }
      });
      
      console.log('Updated attendee response:', {
        status: updateResponse.status,
        statusText: updateResponse.statusText
      });
      
      return updatedAttendee;
    } catch (error) {
      console.error('Error updating attendee:', error);
      return null;
    }
  }

  /**
   * Create a new session in the spreadsheet
   */
  async createSession(sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<Session | null> {
    try {
      console.log('Creating session with data:', JSON.stringify(sessionData, null, 2));
      console.log('Using spreadsheet ID:', this.spreadsheetId);
      console.log('Using sessions range:', SPREADSHEET_CONFIG.RANGES.SESSIONS);
      
      const id = `session_${Date.now()}`;
      const createdAt = new Date().toISOString();
      
      // Create the basic session record
      const session: Session = {
        id,
        title: sessionData.title,
        date: sessionData.date,
        time: sessionData.time,
        createdAt,
        isRecurring: sessionData.isRecurring || false,
        recurringWeeks: sessionData.recurringWeeks,
        recurringInterval: sessionData.recurringInterval
      };
      
      console.log('Creating new session record:', JSON.stringify(session, null, 2));
      
      // Get the Sheets API client
      console.log('Initializing Google Sheets client...');
      const sheetsClient = await this.getSheetsClient();
      console.log('Successfully got Sheets client');
      
      // Create a complete row with explicit null values for any missing columns
      // Ensure we have exactly the right number of columns for the sheet
      // Format: id, title, date, time, createdAt, isRecurring, recurringWeeks, recurringInterval, parentSessionId
      const rowData = [
        session.id,                                    // id
        session.title,                                // title
        session.date,                                 // date
        session.time,                                 // time
        session.createdAt,                            // createdAt
        session.isRecurring ? 'true' : 'false',       // isRecurring
        session.recurringWeeks?.toString() || '',     // recurringWeeks
        session.recurringInterval?.toString() || '',  // recurringInterval
        ''                                           // parentSessionId (empty for parent sessions)
      ];
      
      console.log('Sending row data to Google Sheets:', JSON.stringify(rowData, null, 2));
      
      // Use a very specific range to avoid any potential issues
      // Only write to the first 9 columns (A through I) for the new row
      const appendResponse = await sheetsClient.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Sessions!A:I',  // Specifically limit to columns A through I
        valueInputOption: 'RAW',
        requestBody: {
          values: [rowData]
        }
      });
      
      console.log('Google Sheets append response:', {
        status: appendResponse.status,
        statusText: appendResponse.statusText
      });
      
      // If this is a recurring session, generate all the recurring instances
      if (session.isRecurring && session.recurringWeeks && session.recurringWeeks > 0) {
        await this.generateRecurringSessions(session);
      }
      
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }
  
  /**
   * Generate recurring sessions based on a parent session
   */
  private async generateRecurringSessions(parentSession: Session): Promise<void> {
    try {
      if (!parentSession.isRecurring || !parentSession.recurringWeeks || !parentSession.recurringInterval) {
        console.error('Cannot generate recurring sessions: missing recurring parameters');
        return;
      }
      
      console.log(`Generating ${parentSession.recurringWeeks} recurring sessions...`);
      
      // Parse the parent session date
      const startDate = new Date(parentSession.date);
      if (isNaN(startDate.getTime())) {
        console.error('Invalid date format for parent session:', parentSession.date);
        return;
      }
      
      // Get the Sheets API client
      const sheetsClient = await this.getSheetsClient();
      
      // Generate each recurring session
      const recurringValues = [];
      
      for (let i = 1; i <= parentSession.recurringWeeks; i++) {
        // Calculate the new date (adding the interval days)
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + (i * (parentSession.recurringInterval || 7)));
        
        // Create a session ID for the recurring instance
        const recurringId = `session_${Date.now()}_rec_${i}`;
        
        // Format the date as yyyy-MM-dd
        const formattedDate = newDate.toISOString().split('T')[0];
        
        // Add the recurring session to our batch
        recurringValues.push([
          recurringId, 
          parentSession.title, 
          formattedDate, 
          parentSession.time, 
          new Date().toISOString(),
          'false', // isRecurring
          '', // recurringWeeks
          '', // recurringInterval
          parentSession.id // parentSessionId
        ]);
        
        console.log(`Generated recurring session ${i}: ${formattedDate}`);
      }
      
      // Append all recurring sessions in one batch operation
      if (recurringValues.length > 0) {
        await sheetsClient.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: SPREADSHEET_CONFIG.RANGES.SESSIONS,
          valueInputOption: 'RAW',
          requestBody: {
            values: recurringValues
          }
        });
        
        console.log(`Successfully added ${recurringValues.length} recurring sessions`);
      }
    } catch (error) {
      console.error('Error generating recurring sessions:', error);
    }
  }
  
  /**
   * Delete a session by ID
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      // First, get all sessions to find the one to delete
      const sessions = await this.getSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) {
        console.error('Session not found for deletion:', sessionId);
        return false;
      }
      
      // Get the Sheets API client
      const sheetsClient = await this.getSheetsClient();
      
      // Get the real index in the sheet (adding 2 because of 0-indexing and header row)
      const sheetRowIndex = sessionIndex + 2;
      
      // Clear the row (we can't truly delete, but we can clear it)
      await sheetsClient.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `Sessions!A${sheetRowIndex}:I${sheetRowIndex}`
      });
      
      console.log('Session deleted successfully:', sessionId);
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }
}

// Export a singleton instance of the service
export const googleSheetsService = new GoogleSheetsService();
