import { CartItem } from "@/app/store/store";
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/auth";
import { GetProductPrice } from "@/lib/actions";

// Razorpay config
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const aut = await auth();
  if (!aut?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const body = await req.json();
    const { phoneno, cartitems, pincode, delivery } = body;

    // Validate required fields
    if (!phoneno || !cartitems || cartitems.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: phoneno and cartitems are required" },
        { status: 400 }
      );
    }

    // If delivery mode is selected, pincode should be provided
    if (delivery && !pincode) {
      return NextResponse.json(
        { error: "Pincode is required for delivery orders" },
        { status: 400 }
      );
    }

    // Calculate product total
    const productIds = cartitems.map((item: any) => item.productId);
    
    // Get product prices from server
    const products = await GetProductPrice(productIds);
    
    // Calculate total amount
    const amount = cartitems.reduce((total: number, orderItem: any) => {
      // Find the corresponding product from server data
      const product = products.find((p: any) => p.id === orderItem.productId);
      
      if (!product) {
        throw new Error(`Product not found: ${orderItem.productId}`);
      }
      
      // Use discountedPrice from server and multiply by quantity
      return total + product.discountedPrice * orderItem.qty;
    
    }, 0);

    // Calculate delivery charge based on delivery mode
    let deliveryCharge = 0;
    if (delivery) {
      // For delivery orders, apply delivery charge
      deliveryCharge = 60; // Fixed delivery charge
      
      // You can add more complex logic here based on pincode if needed
      // For example:
      // deliveryCharge = await calculateDeliveryCharge(pincode);
    }
    // For pickup orders, delivery charge remains 0

    // Add taxes (if any)
    const taxes = 4;
    
    // Calculate final total
    const totalAmount = amount + deliveryCharge + taxes;
    if (totalAmount > 10000){  return NextResponse.json(
      { error: "Please prefer bulk order" },
      { status: 501 }
    );}
    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: totalAmount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: "receipt_" + phoneno + "_" + Date.now(),
      notes: {
        phone: phoneno,
        delivery_mode: delivery ? "delivery" : "pickup",
        pincode: pincode || "N/A",
        item_count: cartitems.length
      }
    });

    return NextResponse.json(
      { 
        orderId: order.id, 
        amount: totalAmount,
        breakdown: {
          subtotal: amount,
          deliveryCharge,
          taxes,
          total: totalAmount
        }
      },
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