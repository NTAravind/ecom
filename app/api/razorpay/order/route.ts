import { CartItem } from "@/app/store/store";
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/auth";
// Razorpay config
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    const aut = await auth();
    if(!aut?.user){return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });}
  try {
    const body = await req.json();
    const { phoneno, cartitems, pincode } = body;

    // Calculate product total
    const amount = cartitems.reduce((total: number, cartItem: CartItem) => {
      return total + cartItem.item.price * cartItem.qty;
    }, 0);

    // Fetch delivery charge from /api/price (hosted on Vercel)
   

   
    const charge = 60 + 4;
    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: (amount + charge) * 100,
      currency: "INR",
      receipt: "receipt_" + phoneno + "_" + Math.random().toString(),
    });

    return NextResponse.json(
      { orderId: order.id, amount: amount + charge },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Order creation failed:", err);
    return NextResponse.json(
      { error: "Something went wrong while creating order" },
      { status: 500 }
    );
  }
}
