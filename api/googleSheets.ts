// Google Sheets API configuration
export const GOOGLE_SHEETS_CONFIG = {
  SPREADSHEET_ID: process.env.VITE_GOOGLE_SPREADSHEET_ID || '',
  API_KEY: process.env.VITE_GOOGLE_API_KEY || '',
  SHEET_NAME: 'Users', // Name of the sheet tab
};

// Google Sheets API URL
const SHEETS_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID}`;

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  registrationDate: string;
}

// Function to append data to Google Sheets
export async function appendToGoogleSheets(data: UserData): Promise<boolean> {
  try {
    const values = [
      [
        data.firstName,
        data.lastName,
        data.email,
        data.phone || '',
        data.password, // Note: In production, never store plain text passwords
        data.registrationDate,
        'Active' // Status column
      ]
    ];

    const response = await fetch(
      `${SHEETS_API_URL}/values/${GOOGLE_SHEETS_CONFIG.SHEET_NAME}:append?valueInputOption=RAW&key=${GOOGLE_SHEETS_CONFIG.API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Sheets API Error:', errorData);
      throw new Error(`Google Sheets API Error: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error appending to Google Sheets:', error);
    return false;
  }
}

// Function to check if email already exists
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${SHEETS_API_URL}/values/${GOOGLE_SHEETS_CONFIG.SHEET_NAME}!C:C?key=${GOOGLE_SHEETS_CONFIG.API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Google Sheets API Error: ${response.status}`);
    }

    const data = await response.json();
    const emails = data.values || [];
    
    // Check if email exists (case-insensitive)
    return emails.some((row: string[]) => 
      row[0] && row[0].toLowerCase() === email.toLowerCase()
    );
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false;
  }
}

// Function to authenticate user (for login)
export async function authenticateUser(email: string, password: string): Promise<UserData | null> {
  try {
    const response = await fetch(
      `${SHEETS_API_URL}/values/${GOOGLE_SHEETS_CONFIG.SHEET_NAME}!A:G?key=${GOOGLE_SHEETS_CONFIG.API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Google Sheets API Error: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];
    
    // Skip header row and find matching user
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[2] && row[4] && 
          row[2].toLowerCase() === email.toLowerCase() && 
          row[4] === password && // Note: In production, use proper password hashing
          row[6] === 'Active') {
        return {
          firstName: row[0] || '',
          lastName: row[1] || '',
          email: row[2] || '',
          phone: row[3] || '',
          password: '', // Don't return password
          registrationDate: row[5] || ''
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

// Function to initialize the Google Sheet with headers
export async function initializeSheet(): Promise<boolean> {
  try {
    const headers = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Password', 'Registration Date', 'Status']
    ];

    const response = await fetch(
      `${SHEETS_API_URL}/values/${GOOGLE_SHEETS_CONFIG.SHEET_NAME}!A1:G1?valueInputOption=RAW&key=${GOOGLE_SHEETS_CONFIG.API_KEY}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: headers
        })
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error initializing sheet:', error);
    return false;
  }
}