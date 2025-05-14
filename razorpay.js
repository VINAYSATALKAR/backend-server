import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function createOrder(amount, currency) {
    if (!amount || isNaN(amount) || amount <= 0) {
        console.error("❌ Invalid amount provided:", amount);
        return null;
    }

    if (!currency || typeof currency !== "string") {
        console.error("❌ Invalid currency provided:", currency);
        return null;
    }

    try {
        const order = await razorpay.orders.create({
            amount: amount * 100, // Razorpay expects amount in paise
            currency: currency.toUpperCase(),
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1
        });

        console.log("✅ Razorpay Order Created:", order);
        return order;
    } catch (error) {
        console.error("❌ Error creating Razorpay order:", error);
        return null;
    }
}


// ✅ Correct ES module export
export { razorpay, createOrder };
