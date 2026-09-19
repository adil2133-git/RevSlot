import Razorpay from "razorpay";

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env

if( !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET){
    throw new Error("Razorpay env vars are not set (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)")
}

export const razorpay = new Razorpay({
    key_id : RAZORPAY_KEY_ID,
    key_secret : RAZORPAY_KEY_SECRET
})
