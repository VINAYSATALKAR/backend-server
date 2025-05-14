import { google } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const SERVICE_ACCOUNT_KEY = JSON.parse(fs.readFileSync("your-service-account.json", "utf-8"));
const SHEET_ID = "YOUR_GOOGLE_SHEET_ID"; // Replace with actual sheet ID

const auth = new google.auth.GoogleAuth({
  credentials: SERVICE_ACCOUNT_KEY,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export async function logDownload(email, subject) {
  try {
    const values = [[new Date().toISOString(), email, subject]];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:C",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });

    console.log(`✅ Logged download: ${email} -> ${subject}`);
  } catch (error) {
    console.error("❌ Error logging to Google Sheets:", error);
  }
}
