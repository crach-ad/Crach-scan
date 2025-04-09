# Attendance Tracker System

## Project Overview
This is a QR code-based attendance tracking system that connects to Google Sheets as a database. The system allows for:
- QR code scanning for attendance logging
- Manual attendance entry
- Tracking attendance records in a Google Sheet

## Core Components

### Google Sheets Integration
- `lib/google-sheets/config.ts`: Configuration for connecting to the Google Sheets API
- `lib/google-sheets/service.ts`: Service for interacting with the Google Sheets API, including:
  - Getting sessions
  - Getting attendees
  - Logging attendance
  - Searching for attendees

### QR Code Scanning
- `components/qr-scanner/qr-scanner.tsx`: React component for scanning QR codes using the camera

### API Routes
- `/api/sessions`: Get all available sessions
- `/api/sessions/create`: Create new sessions (including recurring sessions)
- `/api/sessions/delete`: Delete existing sessions
- `/api/attendees`: Get all attendees or search for attendees
- `/api/attendees/qrcode/[code]`: Look up an attendee by QR code
- `/api/attendance`: Log attendance records

### UI Pages
- `/app/page.tsx`: Landing page
- `/app/admin/scan/page.tsx`: QR code scanning and manual attendance entry page
- `/app/admin/schedule/page.tsx`: Session management page with calendar and list views
- `/app/admin/attendance/page.tsx`: Attendance records viewing page

## Data Structure in Google Sheets

The system expects a Google Sheet with the following structure:

1. **Attendees Sheet**
   - Columns: id, name, email, qrCode, createdAt
   - Range Name: 'Attendees!A:E'

2. **Sessions Sheet**
   - Columns: id, title, date, time, location, description, isRecurring, recurringWeeks, recurringInterval, parentSessionId, createdAt
   - Range Name: 'Sessions!A:K'

3. **Attendance Sheet**
   - Columns: id, sessionId, attendeeId, attendeeName, timestamp, method
   - Range Name: 'Attendance!A:F'

## Environmental Configuration
The system requires the following environment variables:
- `GOOGLE_CREDENTIALS`: JSON object containing Google service account credentials
- `GOOGLE_SHEET_ID`: ID of the Google Sheet used for data storage

## User Interface Features

### QR Code Scanning
- Visual success feedback when a QR code is successfully scanned
- Green highlight border around the scanner area during successful scans
- Animated success message that appears briefly after a successful scan
- Enhanced success dialog with timestamp information

### Manual Attendance Entry
- Dropdown menu with alphabetically sorted attendee names
- Submit button for confirming attendance
- Clear feedback messages using toast notifications

## Recent Updates

### Duplicate Scan Prevention
- Implemented a 5-second cooldown period between scans of the same QR code
- Added visual feedback when duplicate scans are detected
- Prevented concurrent scan processing to avoid race conditions
- Added system to track recently scanned QR codes and their timestamps

### Visual Feedback for QR Scanning
- Added clear visual indication for successful QR code scans
- Scanner area highlights in green with a border when a scan succeeds
- Added a temporary success message with checkmark that appears after scanning
- Enhanced the success dialog with better visual styling and a timestamp

### Improved Error Handling
- Added detailed logging throughout the attendance tracking process
- Enhanced error messages to pinpoint issues in the scanning process
- Better validation of QR codes with case-insensitive matching

## Recent Changes
- Created Google Sheets integration
- Implemented QR code scanning component
- Created API endpoints for sessions, attendees, and attendance
- Updated the scanning UI to use real QR code scanner
- Connected the frontend to the backend API services
- Added attendee name column to attendance records for easier reference
- Simplified the interface to just two options: QR code scanning and manual attendee selection
- Added alphabetically ordered dropdown for manual attendance entry
- Added duplicate scan prevention to avoid multiple entries for the same person
- Implemented a 5-second cooldown between scans of the same QR code
- Enhanced session management with recurring sessions support
- Added Admin Schedule page for managing session schedules
- Created API endpoints for creating and deleting sessions
- Updated the Session data model to include recurring session properties
- Implemented UI components to show recurring session indicators
- Fixed JSX syntax issues in the schedule page for proper rendering
- Improved component structure with proper conditional rendering patterns
- Fixed Google Sheets connectivity issues with expanded session data model
- Created diagnostic tooling for debugging Google Sheets connectivity issues
- Added comprehensive client management system with QR code generation
- Fixed React hydration warnings and QR scanner console errors
- Prepared the project for GitHub and Vercel deployment
