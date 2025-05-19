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
export async function logDownload(email, subject, examPeriod) {
    try {
        const sheets = await getSheetsClient(); // Assuming you have a function to get Sheets API client
        const values = [[new Date().toISOString(), email, subject, examPeriod]]; // Add examPeriod

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SHEETS_ID,
            range: "Transactions!A:D", // Adjust columns accordingly
            valueInputOption: "RAW",
            requestBody: { values }
        });

        console.log(`📊 Logged: ${email} -> ${subject} | Exam Period: ${examPeriod}`);
    } catch (error) {
        console.error("❌ Error logging download:", error);
    }
}

