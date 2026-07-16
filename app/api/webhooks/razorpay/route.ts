import { NextRequest } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
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
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  if (expectedSignature !== signature) {
    console.log("❌ Invalid webhook signature");
    return new Response("Invalid signature", { status: 400 });
  }

  console.log("✅ Webhook signature verified");

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // ── payment.captured ───────────────────────────────────────────────────────
  // Backup recovery path: fires when Razorpay captures payment.
  // finalizePaidOrder is idempotent — safe to call even if the frontend
  // verify handler already ran first.
  if (body.event === "payment.captured") {
    const payment = body.payload?.payment?.entity;
    if (!payment?.id || !payment?.order_id) {
      console.error("❌ Malformed payment.captured payload");
      return new Response("Malformed payload", { status: 400 });
    }

    try {
      const razorpay = getRazorpayClient();
      const razorpayPayment = await razorpay.payments.fetch(payment.id);

      if (razorpayPayment.order_id !== payment.order_id) {
        throw new Error(`Payment ${payment.id} does not belong to order ${payment.order_id}`);
      }

      const order = await prisma.order.findUnique({
        where: { id: payment.order_id },
        select: { id: true, pricepaid: true },
      });

      if (!order) {
        // Order may not exist if it was created outside our system — ignore
        console.warn(`⚠️ Webhook: order ${payment.order_id} not found — skipping`);
        return new Response("Order not found", { status: 200 });
      }

      const razorpayAmountPaise = Number(razorpayPayment.amount);
      const expectedAmountPaise = Math.round(order.pricepaid * 100);
      if (razorpayAmountPaise !== expectedAmountPaise) {
        console.error(
          `❌ Amount mismatch for order ${payment.order_id}: Razorpay=${razorpayAmountPaise}, DB=${expectedAmountPaise}`
        );
        // Return 200 so Razorpay doesn't retry — this needs manual reconciliation
        return new Response("Amount mismatch — manual review required", { status: 200 });
      }

      await finalizePaidOrder({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
      });

      console.log(`✅ Order finalized via webhook: ${payment.order_id}`);
      return new Response("Accepted", { status: 200 });
    } catch (err: any) {
      console.error(`❌ Webhook finalization error for order ${payment.order_id}:`, err);
      // Return 500 so Razorpay retries this webhook
      return new Response("Internal error", { status: 500 });
    }
  }

  // ── payment.failed ─────────────────────────────────────────────────────────
  // No stock was ever decremented (stock only changes on captured payments),
  // so there is nothing to reverse. Order remains paid: false in the DB.
  if (body.event === "payment.failed") {
    const payment = body.payload?.payment?.entity;
    console.log(`ℹ️ Payment failed: ${payment?.id} for order ${payment?.order_id}`);
    return new Response("Accepted", { status: 200 });
  }

  // ── unhandled events ───────────────────────────────────────────────────────
  console.log(`ℹ️ Unhandled webhook event: ${body.event}`);
  return new Response("Event received", { status: 200 });
}
