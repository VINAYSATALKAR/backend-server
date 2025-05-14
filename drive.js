import crypto from "crypto";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config(); // ✅ Load environment variables

const drive = google.drive({
    version: "v3",
    auth: process.env.GOOGLE_DRIVE_API_KEY,
});

// Store temporary access tokens
const activeLinks = new Map(); 

// ✅ Get Secure File Link
export async function getSecureFileLink(fileId) {
    try {
        console.log("📁 Fetching File ID:", fileId); // Debugging line

        const result = await drive.files.get({
            fileId,
            fields: "webViewLink",
        });

        console.log("✅ Secure Link Generated:", result.data.webViewLink); // Debugging line

        return result.data.webViewLink; // Secure Drive link
    } catch (error) {
        console.error("❌ Error fetching file:", error);
        return null;
    }
}

// ✅ Generate Expiring Access Link (Valid for 5 Minutes)
export function generateExpiringLink(fileId, email) {
    console.log("🔎 Storing File ID for Expiring Link:", fileId); // Debugging line

    const token = crypto.randomBytes(16).toString("hex");
    const expirationTime = Date.now() + 5 * 60 * 1000; // Link valid for 5 mins

    // Store token with expiration time
    activeLinks.set(token, { fileId, email, expirationTime });

    // ✅ Return the correct Google Drive download link instead of localhost
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

// ✅ Validate Token for Secure Download
export function validateToken(token) {
    const linkData = activeLinks.get(token);

    console.log("🔎 Checking Token:", token);
    console.log("🔎 Link Data:", linkData);

    if (!linkData || Date.now() > linkData.expirationTime) {
        console.log("❌ Token Expired or Invalid");
        return null; // Token is invalid or expired
    }

    console.log("✅ Token Valid! Returning file ID:", linkData.fileId);
    return linkData.fileId;
}
