import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

// ✅ Load credentials from environment variables
const SERVICE_ACCOUNT_KEY = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
const SHEET_ID = process.env.GOOGLE_SHEET_ID; // Sheet ID from env

// ✅ Initialize Google Sheets API authentication
const auth = new google.auth.GoogleAuth({
  credentials: SERVICE_ACCOUNT_KEY,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// ✅ Function to Log Email & Subject in Google Sheets
export async function logDownload(email, subject) {


  try {


    if (!email || !subject) {


      throw new Error("❌ Invalid input: Email and Subject are required.");
    }
   const values = [[new Date().toISOString(), email, subject]];





    const response = await sheets.spreadsheets.values.append({


      spreadsheetId: SHEET_ID,


      range: "Sheet1!A:C", // Column A (Timestamp), B (Email), C (Subject)


      valueInputOption: "RAW",


      insertDataOption: "INSERT_ROWS",


      requestBody: { values },


    });





    console.log(`✅ Successfully logged: ${email} -> ${subject}`);


    return response.data;


  } catch (error) {


    console.error("❌ Error logging to Google Sheets:", error);


    throw error;


  }

} 


