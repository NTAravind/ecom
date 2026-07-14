import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { finalizePaidOrder } from "@/lib/razorpay/finalize-order";

function getRazorpayClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials not configured");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID.trim(),
    key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body;

    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      console.error("Invalid JSON:", error);
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    if (body.event) {
      return handleWebhook(req, body, rawBody);
    }

    return handlePaymentVerification(body);
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}

async function finalizeCapturedPayment(paymentId: string, orderId: string) {
  const razorpay = getRazorpayClient();
  const razorpayPayment = await razorpay.payments.fetch(paymentId);

  if (razorpayPayment.order_id !== orderId) {
    throw new Error(`Payment ${paymentId} does not belong to order ${orderId}`);
  }

  // Accept both "captured" (auto-capture on) and "authorized" (manual capture)
  if (razorpayPayment.status !== "captured" && razorpayPayment.status !== "authorized") {
    throw new Error(`Payment ${paymentId} has unexpected status: ${razorpayPayment.status}`);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, pricepaid: true },
  });

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // Razorpay SDK can return amount as string or number — coerce before comparing
  const razorpayAmountPaise = Number(razorpayPayment.amount);
  const expectedAmountPaise = Math.round(order.pricepaid * 100);
  if (razorpayAmountPaise !== expectedAmountPaise) {
    console.error(
      `Amount mismatch for order ${orderId}: Razorpay=${razorpayAmountPaise} paise, DB=${expectedAmountPaise} paise`
    );
    throw new Error(`Amount mismatch for order ${orderId}`);
  }

  // This is the only local completion path: mark paid + complete + reduce stock.
  // It is safe for both frontend verification and webhook recovery to call it.
  return finalizePaidOrder({
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
  });
}

async function handleWebhook(req: NextRequest, body: any, rawBody: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const signature = req.headers.get("x-razorpay-signature") || "";
  const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  if (expectedSignature !== signature) {
    console.log("Invalid webhook signature");
    return new Response("Invalid signature", { status: 400 });
  }

  console.log("✅ Webhook signature verified");

  if (body.event === "payment.captured") {
    const payment = body.payload.payment.entity;

    // Webhook is backup recovery, but it uses the same finalizer as the frontend.
    // Razorpay gets 200 only after DB completion succeeds, so failed attempts can retry.
    await finalizeCapturedPayment(payment.id, payment.order_id);

    console.log(`✅ Order completed via webhook: ${payment.order_id}`);
    return new Response("Accepted", { status: 200 });
  }

  if (body.event === "payment.failed") {
    const payment = body.payload.payment.entity;
    console.log("❌ Payment failed:", payment.id);

    const existingOrder = await prisma.order.findUnique({
      where: { id: payment.order_id },
      select: { id: true, paid: true },
    });

    if (existingOrder && !existingOrder.paid) {
      await prisma.order.update({
        where: { id: payment.order_id },
        data: { paid: false },
      });
      console.log(`✅ Marked order ${payment.order_id} as failed`);
    }

    return new Response("Accepted", { status: 200 });
  }

  console.log(`ℹ️ Unhandled webhook event: ${body.event}`);
  return new Response("Event received", { status: 200 });
}

async function handlePaymentVerification(body: any) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing payment details" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET not configured");
      return NextResponse.json({ success: false, error: "Configuration error" }, { status: 500 });
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.log("❌ Payment signature verification failed");
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: razorpay_order_id },
      select: { id: true, userId: true },
    });

    if (!order) {
      console.log(`⚠️ Order ${razorpay_order_id} not found`);
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      console.error(`❌ Unauthorized payment verification for order ${razorpay_order_id}`);
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const completedOrder = await finalizeCapturedPayment(razorpay_payment_id, razorpay_order_id);

    console.log("✅ Payment verified and order completed:", razorpay_payment_id);

    return NextResponse.json(
      {
        success: true,
        message: "Payment verified and order completed successfully",
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        order: completedOrder,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Payment verification error:", error);
    const isStockError = error.message?.includes("Insufficient stock");
    const isPaymentError =
      error.message?.includes("not captured") ||
      error.message?.includes("unexpected status") ||
      error.message?.includes("Amount mismatch") ||
      error.message?.includes("does not belong");

    return NextResponse.json(
      {
        success: false,
        error: isStockError || isPaymentError ? error.message : "Payment verification failed",
      },
      { status: isStockError ? 409 : 500 }
    );
  }
}
