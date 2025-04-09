# Attendance Tracker

*Ready for Vercel deployment - 2025-04-09*

A modern attendance tracking system with QR code scanning capabilities built with Next.js.

## Features

- **QR Code Scanning**: Quickly scan QR codes to mark attendance
- **Client Management**: Add, view, and edit client information
- **Session Scheduling**: Create and manage regular and recurring sessions
- **Google Sheets Integration**: All data is stored in Google Sheets for easy access and manipulation
- **Mobile-Friendly UI**: Modern, responsive interface that works on both desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Database**: Google Sheets API for serverless data storage
- **Authentication**: Custom session management
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Google account with API access

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
GOOGLE_CREDENTIALS={"type":"service_account","project_id":"..."}
GOOGLE_SHEET_ID=your_google_sheet_id
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```

## Deployment

This application is configured for easy deployment to Vercel:

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure the environment variables in Vercel
4. Deploy!

## Project Structure

- `/app`: Next.js app router pages and layouts
- `/components`: Reusable UI components
- `/lib`: Utility functions and service integrations
- `/public`: Static assets

## License

MIT
