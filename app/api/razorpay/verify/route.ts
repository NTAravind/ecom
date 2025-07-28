import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Clone the request to read the body multiple times
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
      return handleWebhook(req, body, rawBody);
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

// Handle webhook from Razorpay - IMPROVED VERSION
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
    
    console.log("✅ Webhook signature verified successfully");
    
    if (body.event === "payment.captured") {
      const payment = body.payload.payment.entity;
      console.log("🔔 Payment Captured Webhook - Payment ID:", payment.id);
      console.log("🔔 Payment Captured Webhook - Order ID:", payment.order_id);
      console.log("🔔 Payment Status:", payment.status);
      console.log("🔔 Payment Amount:", payment.amount);
      
      try {
        // IMPROVED: Retry logic for race condition handling
        let existingOrder = null;
        const maxRetries = 5; // Increased retries
        const retryDelay = 1000; // 1 second
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          existingOrder = await prisma.order.findUnique({
            where: { id: payment.order_id },
            select: { 
              id: true, 
              paid: true, 
              paymentid: true,
              complete: true,
              pricepaid: true
            }
          });

          if (existingOrder) {
            console.log(`✅ Order found on attempt ${attempt}: ${payment.order_id}`);
            console.log(`📊 Current order status - Paid: ${existingOrder.paid}, Complete: ${existingOrder.complete}`);
            break;
          }

          if (attempt < maxRetries) {
            console.log(`⏳ Order not found on attempt ${attempt}/${maxRetries}, retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }

        if (!existingOrder) {
          console.error(`❌ Order not found after ${maxRetries} attempts: ${payment.order_id}`);
          // Return 500 to make Razorpay retry later
          return new Response("Order not found after retries - will retry", { status: 500 });
        }

        // Check if already processed with same payment ID or already marked as paid
        if (existingOrder.paid) {
          if (existingOrder.paymentid === payment.id) {
            console.log(`✅ Order ${payment.order_id} already processed with payment ${payment.id}`);
          } else {
            console.log(`✅ Order ${payment.order_id} already marked as paid (frontend handled it)`);
          }
          return new Response("Payment already processed", { status: 200 });
        }

        // Only update if the order exists but is not marked as paid
        // This handles edge cases where frontend processing failed
        console.log(`🔄 Webhook updating unpaid order ${payment.order_id}...`);
        
        const updatedOrder = await prisma.order.update({
          where: { id: payment.order_id },
          data: { 
            paid: true,              // EXPLICITLY SET TO TRUE
            paymentid: payment.id,   // Store the payment ID
            complete: true           // Mark order as complete
          },
          select: {
            id: true,
            paid: true,
            complete: true,
            paymentid: true,
            pricepaid: true
          }
        });

        console.log(`✅ Order ${payment.order_id} SUCCESSFULLY updated:`);
        console.log(`   - Paid: ${updatedOrder.paid}`);
        console.log(`   - Complete: ${updatedOrder.complete}`);
        console.log(`   - Payment ID: ${updatedOrder.paymentid}`);
        console.log(`   - Price Paid: ${updatedOrder.pricepaid}`);

        // Verify the update worked
        const verificationOrder = await prisma.order.findUnique({
          where: { id: payment.order_id },
          select: { paid: true, complete: true, paymentid: true }
        });

        if (verificationOrder?.paid) {
          console.log(`✅ VERIFICATION SUCCESS: Order ${payment.order_id} is marked as PAID`);
        } else {
          console.error(`❌ VERIFICATION FAILED: Order ${payment.order_id} is NOT marked as paid`);
          return new Response("Payment update verification failed", { status: 500 });
        }
        
        return new Response("Payment processed successfully", { status: 200 });
        
      } catch (dbError: any) {
        console.error("❌ Database error while updating order:", dbError);
        console.error("Error details:", {
          code: dbError.code,
          message: dbError.message,
          meta: dbError.meta
        });
        
        // Check if it's a unique constraint violation on paymentid
        if (dbError.code === 'P2002' && dbError.meta?.target?.includes('paymentid')) {
          console.log("⚠️ Payment ID already exists - payment may have been processed already");
          return new Response("Payment already processed", { status: 200 });
        }
        
        // For other database errors, return 500 so Razorpay will retry
        return new Response("Database error processing payment", { status: 500 });
      }
    }
    
    if (body.event === "payment.authorized") {
      const payment = body.payload.payment.entity;
      console.log("🔔 Payment authorized:", payment.id);
      console.log("🔔 Order ID:", payment.order_id);
      
      try {
        // Check if order exists before updating
        const existingOrder = await prisma.order.findUnique({
          where: { id: payment.order_id },
          select: { id: true, paid: true, paymentid: true }
        });

        if (existingOrder) {
          // Only update if not already marked as paid
          if (!existingOrder.paid) {
            await prisma.order.update({
              where: { id: payment.order_id },
              data: { 
                paymentid: payment.id
                // Don't mark as paid yet - wait for capture
              }
            });
            console.log(`✅ Order ${payment.order_id} updated with authorized payment`);
          } else {
            console.log(`✅ Order ${payment.order_id} already processed`);
          }
        } else {
          console.log(`⚠️ Order ${payment.order_id} not found for authorized payment`);
        }
      } catch (error) {
        console.error("❌ Error updating authorized payment:", error);
      }
      
      return new Response("Payment authorized", { status: 200 });
    }
    
    if (body.event === "payment.failed") {
      const payment = body.payload.payment.entity;
      console.log("❌ Payment failed:", payment.id);
      console.log("❌ Order ID:", payment.order_id);
      console.log("❌ Failure reason:", payment.error_reason);
      
      try {
        // Check if order exists and update if needed
        const existingOrder = await prisma.order.findUnique({
          where: { id: payment.order_id },
          select: { id: true, paid: true }
        });

        if (existingOrder && !existingOrder.paid) {
          // Mark order as failed or take other appropriate actions
          console.log(`⚠️ Payment failed for order ${payment.order_id}`);
          
          // Optional: Update order status to reflect failed payment
          await prisma.order.update({
            where: { id: payment.order_id },
            data: {
              // You might want to add a 'status' field to track failed payments
              // status: 'payment_failed'
            }
          });
        }
      } catch (error) {
        console.error("❌ Error handling failed payment:", error);
      }
      
      return new Response("Payment failure processed", { status: 200 });
    }
    
    console.log(`ℹ️ Unhandled webhook event: ${body.event}`);
    return new Response("Event received", { status: 200 });
    
  } catch (error) {
    console.error("❌ Webhook error:", error);
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
      console.log("❌ Payment signature verification failed");
      console.log("Generated:", generated_signature);
      console.log("Received:", razorpay_signature);
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }
    
    // Payment is verified successfully
    console.log("✅ Payment verified successfully:", razorpay_payment_id);
    console.log("✅ Order ID:", razorpay_order_id);
    
    // Check if order exists in database and update if needed
    try {
      const order = await prisma.order.findUnique({
        where: { id: razorpay_order_id },
        select: { id: true, paid: true, paymentid: true }
      });

      if (order) {
        console.log(`📊 Order ${razorpay_order_id} exists, paid status: ${order.paid}`);
        
        // If order exists but not marked as paid, update it
        if (!order.paid) {
          console.log(`🔄 Updating order ${razorpay_order_id} to paid status...`);
          
          const updatedOrder = await prisma.order.update({
            where: { id: razorpay_order_id },
            data: {
              paid: true,
              complete: true,
              paymentid: razorpay_payment_id
            }
          });
          
          console.log(`✅ Order ${razorpay_order_id} marked as paid via verification`);
        }
      } else {
        console.log(`⚠️ Order ${razorpay_order_id} not found in database during verification`);
      }
    } catch (error) {
      console.error("❌ Error checking/updating order status:", error);
    }
    
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
    console.error("❌ Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}

// Helper function to get phone number by order ID (if needed)
async function getPhoneNumberByOrderId(orderId: string): Promise<string> {
  try {
    const order = await prisma.order.findUnique({
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