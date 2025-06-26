import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Clone the request to read the body multiple times
    const clonedReq = req;
    const rawBody = await req.text(); // Get raw body for signature verification
    
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      console.error("Invalid JSON in request body:", error);
      return NextResponse.json(
        { success: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    console.log("Request body:", body);
    
    // Check if this is a webhook request (has event field) or payment verification request
    if (body.event) {
      // This is a webhook request - use raw body for signature verification
      return handleWebhook(clonedReq, body, rawBody);
    } else {
      // This is a payment verification request from frontend
      return handlePaymentVerification(body);
    }
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}

// Handle webhook from Razorpay
async function handleWebhook(req: NextRequest, body: any, rawBody: string) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }
    
    const signature = req.headers.get("x-razorpay-signature") || "";
    
    if (!signature) {
      console.log("Missing webhook signature");
      return new Response("Missing signature", { status: 400 });
    }
    
    // Generate expected signature using raw body
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    
    if (expectedSignature !== signature) {
      console.log("Invalid webhook signature");
      console.log("Expected:", expectedSignature);
      console.log("Received:", signature);
      return new Response("Invalid signature", { status: 400 });
    }
    
    console.log("Webhook signature verified successfully");
    
    if (body.event === "payment.captured") {
      const payment = body.payload.payment.entity;
      console.log("webhook verification",payment.id)
     await prisma.order.update({
        where:{id:payment.order_id},
        data:{paid:true}
      })

      // Extract cart items if they exist in the payload
      // Note: Razorpay webhooks don't typically contain custom cart data
      // You might need to fetch this from your database using the order_id
      if (body.payload.payment.entity.notes) {
        console.log("Payment notes:", body.payload.payment.entity.notes);
      }
      
      // Here you can update your database with payment status
      // Example: await updateOrderStatus(payment.order_id, 'paid', payment);
      
      return new Response("Payment processed successfully", { status: 200 });
    }
    
    if (body.event === "payment.authorized") {
      const payment = body.payload.payment.entity;
      console.log("Payment authorized:", payment.id);
      
      // Handle authorized payment - you might want to capture it
      // Example: await handleAuthorizedPayment(payment);
      
      return new Response("Payment authorized", { status: 200 });
    }
    
    if (body.event === "payment.failed") {
      const payment = body.payload.payment.entity;
      console.log("Payment failed:", payment.id);
      console.log("Failure reason:", payment.error_reason);
      
      // Handle failed payment
      // Example: await handleFailedPayment(payment);
      
      return new Response("Payment failure processed", { status: 200 });
    }
    
    console.log(`Unhandled webhook event: ${body.event}`);
    return new Response("Event received", { status: 200 });
    
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}

// Handle payment verification from frontend
async function handlePaymentVerification(body: any) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      // Add any additional data you want to store
    
    } = body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing required payment details" },
        { status: 400 }
      );
    }
    
    const secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is not configured");
      return NextResponse.json(
        { success: false, error: "Payment verification configuration error" },
        { status: 500 }
      );
    }
    
    // Verify the payment signature
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
    
    if (generated_signature !== razorpay_signature) {
      console.log("Payment signature verification failed");
      console.log("Generated:", generated_signature);
      console.log("Received:", razorpay_signature);
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }
    
    // Payment is verified successfully
    console.log("Payment verified successfully:", razorpay_payment_id);
    console.log("Order ID:", razorpay_order_id);
    
    // Here you can update your database with payment confirmation
    // Example: await confirmPayment(razorpay_order_id, razorpay_payment_id, { cartItems, userDetails });
    
    return NextResponse.json(
      { 
        success: true, 
        message: "Payment verified successfully",
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}



async function getPhoneNumberByOrderId(orderId: string): Promise<string> {
  try {
    const order = (await prisma.order.findUnique as any)({
      where: { id: orderId },
      include: { user: true },
    });
    
    if (!order) {
      throw new Error("Order not found");
    }
    
    return order.user.phone;
  } catch (error) {
    console.error("Error fetching phone number:", error);
    throw error;
  }
}