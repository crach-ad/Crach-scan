# Google Sheets Integration Guide

This document serves as a comprehensive guide for integrating Google Sheets as a database for web applications. It addresses common connectivity issues, best practices, and debugging techniques based on the experiences from the Attendance Tracker project.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Data Structure Considerations](#data-structure-considerations)
3. [Handling Evolving Data Models](#handling-evolving-data-models)
4. [Common Connectivity Issues](#common-connectivity-issues)
5. [Best Practices](#best-practices)
6. [Debugging Toolkit](#debugging-toolkit)

## Initial Setup

### Google Sheets Configuration

1. **Service Account Setup**:
   - Create a Google Cloud project
   - Enable Google Sheets API
   - Create a service account with appropriate permissions
   - Download service account key (JSON format)

2. **Environment Configuration**:
   - Store service account credentials as environment variables
   - Use proper encoding for JSON-based credentials
   - Never hardcode spreadsheet IDs or credentials in the codebase

3. **Spreadsheet Preparation**:
   - Create sheets with clear, descriptive names
   - Add header rows to each sheet
   - Define range names for easier reference
   - Consider freezing header rows

### Code Structure

```typescript
// Config file structure
import { GoogleAuth } from 'google-auth-library';
import { google, sheets_v4 } from 'googleapis';

// Environment handling
const getEnvCredentials = () => {
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error('Google credentials not found');
  }
  
  try {
    return JSON.parse(process.env.GOOGLE_CREDENTIALS);
  } catch (error) {
    throw new Error('Invalid Google credentials format');
  }
};

// Sheets client initialization
export const getGoogleSheetsClient = async (): Promise<sheets_v4.Sheets> => {
  const credentials = getEnvCredentials();
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client as any });
};

// Constants for configuration
export const SPREADSHEET_CONFIG = {
  SPREADSHEET_ID: process.env.GOOGLE_SHEET_ID || '',
  RANGES: {
    DATA_1: 'Sheet1!A:Z',  // Use ranges wide enough for model evolution
    DATA_2: 'Sheet2!A:Z',  
  }
};
```

## Data Structure Considerations

1. **Data Model Definition**:
   - Define clear interfaces for all data types
   - Document field types and purposes
   - Include optional fields for future expansion

2. **Column Planning**:
   - Plan for more columns than initially needed
   - Include metadata columns like timestamps and IDs
   - Document the purpose of each column

3. **String Representation**:
   - Always convert non-string values to strings
   - Handle null/undefined values gracefully
   - Use consistent date/time formatting

## Handling Evolving Data Models

When your data model evolves (adding fields, changing structure), follow these steps:

1. **Update Data Interfaces**:
   - Add new fields to TypeScript interfaces
   - Consider using optional fields for backward compatibility

2. **Update Range References**:
   - Expand range references to include new columns
   - Use explicit ranges like 'Sheet1!A:K' instead of relying on configuration

3. **Standardize Row Structure**:
   - Always create complete rows with all possible columns
   - Use empty strings for undefined values
   - Maintain consistent ordering of columns

4. **Example: Evolution-Safe Writing**:

```typescript
// Evolution-safe approach to writing data
const createRow = (data) => {
  // Create a complete row with explicit handling for all columns
  return [
    data.id || generateId(),                  // Column A: ID
    data.name || '',                          // Column B: Name
    data.date || new Date().toISOString(),    // Column C: Date
    data.status || 'pending',                 // Column D: Status
    data.field5 || '',                        // Column E: Future field
    data.field6 || '',                        // Column F: Future field
    data.field7 || '',                        // Column G: Future field
    data.field8 || '',                        // Column H: Future field
    // Additional columns for future expansion
  ];
};

const appendToSheet = async (sheetName, data) => {
  const row = createRow(data);
  
  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_CONFIG.SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,  // Use wide range for future expansion
    valueInputOption: 'RAW',
    requestBody: {
      values: [row]
    }
  });
};
```

## Common Connectivity Issues

1. **Authentication Problems**:
   - Expired credentials
   - Missing scopes
   - Invalid service account JSON

2. **Permission Issues**:
   - Service account not having access to the spreadsheet
   - Spreadsheet ID errors
   - Range access issues

3. **Data Format Problems**:
   - Range references not matching sheet structure
   - Incorrect data types (require string conversion)
   - Changes to sheet structure not reflected in code

4. **API Limitations**:
   - Rate limiting (too many requests)
   - Maximum write size limits
   - Response timeouts

## Best Practices

1. **Error Handling**:
   - Implement comprehensive try/catch blocks
   - Log specific Google Sheets API errors
   - Provide user-friendly error messages

2. **Range Management**:
   - Use consistent range naming conventions
   - Always include room for model expansion (use wider ranges)
   - Document range purpose and column contents

3. **Performance Optimization**:
   - Batch operations when possible
   - Cache frequently accessed data
   - Minimize unnecessary reads/writes

4. **Testing**:
   - Create a separate test spreadsheet
   - Implement integration tests
   - Test with varying data volumes

5. **Monitoring**:
   - Log all Google Sheets operations
   - Track API usage and performance
   - Implement alerting for critical failures

## Debugging Toolkit

1. **Diagnostic API Endpoint**:

Create a dedicated API endpoint for connectivity testing:

```typescript
export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envStatus = {
      hasGoogleCredentials: !!process.env.GOOGLE_CREDENTIALS,
      hasSheetId: !!process.env.GOOGLE_SHEET_ID,
    };
    
    if (!envStatus.hasGoogleCredentials || !envStatus.hasSheetId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required environment variables',
        details: envStatus,
      }, { status: 500 });
    }
    
    // Attempt to initialize Google Sheets client
    const sheetsClient = await getGoogleSheetsClient();
    
    // Try to access the spreadsheet
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_CONFIG.SPREADSHEET_ID,
      range: 'A1:A1',  // Just test a single cell
    });
    
    // Try to write a test value
    const testData = [['DEBUG_TEST', new Date().toISOString()]];
    const appendResponse = await sheetsClient.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_CONFIG.SPREADSHEET_ID,
      range: 'TestSheet!A:B',  // Use a dedicated testing sheet
      valueInputOption: 'RAW',
      requestBody: { values: testData },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Google Sheets connection is working',
      details: {
        canRead: !!response.data,
        canWrite: !!appendResponse.data,
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
```

2. **Enhanced Logging**:

```typescript
// Add detailed logging to Google Sheets service operations
async createRecord(data) {
  console.log('Creating record with data:', JSON.stringify(data, null, 2));
  console.log('Using spreadsheet ID:', this.spreadsheetId);
  console.log('Using range:', SPREADSHEET_CONFIG.RANGES.DATA);
  
  try {
    const sheetsClient = await this.getSheetsClient();
    console.log('Successfully got Sheets client');
    
    const row = this.formatRowData(data);
    console.log('Formatted row data:', JSON.stringify(row, null, 2));
    
    const response = await sheetsClient.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: SPREADSHEET_CONFIG.RANGES.DATA,
      valueInputOption: 'RAW',
      requestBody: { values: [row] }
    });
    
    console.log('Google Sheets API response:', {
      status: response.status,
      statusText: response.statusText
    });
    
    return true;
  } catch (error) {
    console.error('Error creating record:', error);
    return false;
  }
}
```

3. **Schema Validation**:

```typescript
// Validate data against expected schema before sending to Google Sheets
function validateData(data, schema) {
  const errors = [];
  
  for (const field of schema.requiredFields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  for (const [field, expectedType] of Object.entries(schema.fieldTypes)) {
    if (data[field] && typeof data[field] !== expectedType) {
      errors.push(`Invalid type for ${field}: expected ${expectedType}, got ${typeof data[field]}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

4. **Connectivity Test Script**:

```typescript
// Command-line script for testing Google Sheets connectivity
async function testGoogleSheetsConnectivity() {
  try {
    console.log('Testing Google Sheets connectivity...');
    
    // Check environment variables
    if (!process.env.GOOGLE_CREDENTIALS) {
      throw new Error('GOOGLE_CREDENTIALS environment variable is not set');
    }
    
    if (!process.env.GOOGLE_SHEET_ID) {
      throw new Error('GOOGLE_SHEET_ID environment variable is not set');
    }
    
    // Parse credentials
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    console.log('Successfully parsed credentials');
    
    // Initialize sheets client
    const sheetsClient = await getGoogleSheetsClient();
    console.log('Successfully initialized Google Sheets client');
    
    // Test read access
    const getResponse = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A1:A1',
    });
    console.log('Successfully read from sheet');
    
    // Test write access
    const appendResponse = await sheetsClient.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'TestSheet!A:A',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['TEST', new Date().toISOString()]]
      }
    });
    console.log('Successfully wrote to sheet');
    
    console.log('All tests passed! Google Sheets connectivity is working.');
  } catch (error) {
    console.error('Connectivity test failed:', error);
  }
}

// Run the test
testGoogleSheetsConnectivity();
```

---

By following this guide, you can implement robust Google Sheets integration that handles evolving data models and provides clear visibility into connectivity issues.
