import dotenv from "dotenv";
import cors from "cors";
import crypto from "crypto";
import express from "express";
import { generateExpiringLink } from "./drive.js";
import path from "path";
import { fileURLToPath } from "url";
import { logDownload } from "./sheets.js"; // ✅ Google Sheets Logging
import fs from "fs";

dotenv.config();
const app = express();

// ✅ Middleware Setup
app.use(cors({
  origin: ["http://localhost:5173", "https://www.pyqspot.com"], 
  methods: "GET,POST",
  allowedHeaders: ["Content-Type"],
  credentials: true
}));
app.use(express.json());
app.use("/razorpay-webhook", express.raw({ type: "application/json" })); // Ensure webhook raw body handling

// ✅ Load Subject-to-File Mapping
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const subjectData = JSON.parse(fs.readFileSync(path.join(__dirname, "subjectdata.json"), "utf8"));

// ✅ Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ✅ Razorpay Webhook: Verify Payment & Grant PDF Access
app.post("/razorpay-webhook", express.raw({ type: "application/json" }), async (req, res) => {
    try {
        console.log("🔎 Payment Webhook Received");

        let parsedBody;
        try {
            const rawBody = req.body;
            parsedBody = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
        } catch (error) {
            console.error("❌ Error parsing webhook JSON:", error);
            return res.status(400).json({ error: "Invalid webhook format" });
        }

        console.log("✅ Parsed Webhook Data:", parsedBody);

        // ✅ Ensure only `payment.captured` events are logged
        const eventType = parsedBody.event;
        if (eventType !== "payment.captured") {
            console.log(`⚠️ Skipping logging for event type: ${eventType}`);
            return res.status(200).json({ message: `Skipped logging for event type: ${eventType}` });
        }

        const payment = parsedBody.payload.payment.entity;
        const email = payment.email;
        const year = payment.notes?.year;
        const subject = payment.notes?.subject;
        const examType = payment.notes?.examType;
        const examPeriod = payment.notes?.examPeriod;

        console.log("🔎 User Paid For:", { email, year, subject, examType, examPeriod });

        if (!email || !year || !subject || !examType || !examPeriod) {
            return res.status(400).json({ error: "Invalid Payment Data" });
        }

        const fileId = subjectData[year]?.[subject]?.[examType]?.[examPeriod];

        if (!fileId) {
            return res.status(404).json({ error: "File Not Found" });
        }

        console.log("✅ Payment Verified, Generating Expiring Link...");
        const expiringLink = generateExpiringLink(fileId, email);
        console.log("✅ Expiring Link Generated:", expiringLink);

        // ✅ Log User Download to Google Sheets
        try {
            await logDownload(email, subject);
            console.log(`📊 Successfully logged: ${email} -> ${subject}`);
        } catch (loggingError) {
            console.error("⚠️ Warning: Failed to log user download in Google Sheets", loggingError);
        }

        res.json({ success: true, link: expiringLink });
    } catch (error) {
        console.error("❌ Error processing webhook:", error);
        res.status(500).send("Internal Server Error");
    }
});

// ✅ Razorpay Order Creation Route
app.post("/razorpay-order", async (req, res) => {
    console.log("🔎 Razorpay Order Request Received:", req.body);

    const { amount, currency, year, subject, examType, examPeriod } = req.body;

    if (!amount || !currency || !year || !subject || !examType || !examPeriod) {
        return res.status(400).json({ error: "Invalid Payment Request Data", details: req.body });
    }

    try {
        const response = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
            },
            body: JSON.stringify({ amount: amount * 100, currency, notes: { year, subject, examType, examPeriod } })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Razorpay API Error:", errorText);
            return res.status(500).json({ error: "Order creation failed", details: errorText });
        }

        const orderData = await response.json();
        console.log("✅ Razorpay Order Created:", orderData);
        res.json({ success: true, order: orderData });

    } catch (error) {
        console.error("❌ Error Creating Razorpay Order:", error);
        res.status(500).json({ error: "Order creation failed", details: error.message });
    }
});
