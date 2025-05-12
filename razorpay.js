import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function createOrder(amount, currency) {
    try {
        const order = await razorpay.orders.create({
            amount: amount,
            currency: currency,
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1
        });

        return order;
    } catch (error) {
        console.error("❌ Error creating Razorpay order:", error);
        return null;
    }
}

// ✅ Correct ES module export
export { razorpay, createOrder };
