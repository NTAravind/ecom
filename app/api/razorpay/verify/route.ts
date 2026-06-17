import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import Razorpay from "razorpay";

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
    } else {
      return handlePaymentVerification(body);
    }
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}

// Helper that runs the heavy DB work for a captured payment.
// Isolated so it can be called from setImmediate without async leaking into the response.
async function processCapture(payment: any, body: any) {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const razorpayPayment = await razorpay.payments.fetch(payment.id);
  if (razorpayPayment.status !== "captured") {
    console.error(`❌ Payment ${payment.id} not captured`);
    return;
  }

  // FIX #4: Minimum 6 retries × 1500ms to avoid missing DB record written concurrently by client
  let existingOrder = null;
  const maxRetries = 6;
  const retryDelay = 1500;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    existingOrder = await prisma.order.findUnique({
      where: { id: payment.order_id },
      include: { orderItems: { include: { product: true, yarnAccessory: true } }, user: true },
    });

    if (existingOrder) {
      console.log(`✅ Order found on attempt ${attempt}: ${payment.order_id}`);
      break;
    }

    if (attempt < maxRetries) {
      console.log(`⏳ Order not found, retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  if (!existingOrder) {
    console.error(`❌ Order not found after retries: ${payment.order_id}`);
    try {
      const razorpayOrder = await razorpay.orders.fetch(payment.order_id);
      const { phone, delivery_mode } = razorpayOrder.notes;

      const productIds = body.payload.order?.entity?.items?.map((item: any) => item.id) || [];
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, discountedPrice: true, stock: true, pname: true },
      });

      let serverCalculatedTotal = 0;
      const cartItems = (body.payload.order?.entity?.items || []).map((item: any) => {
        const product = products.find((p: any) => p.id === item.id);
        if (!product) throw new Error(`Product not found: ${item.id}`);
        serverCalculatedTotal += product.discountedPrice * item.quantity;
        return { productId: item.id, qty: item.quantity };
      });

      const serverDeliveryCharge = delivery_mode === "delivery" && serverCalculatedTotal < 2000 ? 60 : 0;
      const serverTotalAmount = serverCalculatedTotal + serverDeliveryCharge + 4;

      await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            id: payment.order_id,
            pricepaid: serverTotalAmount,
            paymentid: payment.id,
            paid: true,
            complete: true,
            delivered: delivery_mode === "delivery",
            user: { connect: { phone: phone.toString() } },
            orderItems: {
              create: cartItems.map((cartItem: any) => ({
                quantity: cartItem.qty,
                product: { connect: { id: cartItem.productId } },
              })),
            },
          },
          include: { orderItems: { include: { product: true } } },
        });

        for (const cartItem of cartItems) {
          const updatedProduct = await tx.product.update({
            where: { id: cartItem.productId },
            data: { stock: { decrement: cartItem.qty } },
            select: { stock: true, pname: true },
          });

          if (updatedProduct.stock < 0) {
            throw new Error(`Insufficient stock for ${updatedProduct.pname}.`);
          }
        }

        return order;
      });

      console.log(`✅ Order created by webhook (orphan recovery): ${payment.order_id}`);
    } catch (createError: any) {
      console.error(`❌ Failed to create orphan order:`, createError);
    }
    return;
  }

  // FIX #7: Idempotency — skip if already paid (webhook + client handler race guard)
  if (existingOrder.paid) {
    console.log(`✅ Order ${payment.order_id} already processed — skipping duplicate`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: payment.order_id },
      data: { paid: true, paymentid: payment.id, complete: true },
      include: { orderItems: { include: { product: true, yarnAccessory: true } } },
    });

    for (const orderItem of existingOrder!.orderItems) {
      if (orderItem.product) {
        // Decrement product stock
        const updatedProduct = await tx.product.update({
          where: { id: orderItem.product.id },
          data: { stock: { decrement: orderItem.quantity } },
          select: { stock: true, pname: true },
        });
        if (updatedProduct.stock < 0) {
          throw new Error(`Insufficient stock for product ${updatedProduct.pname}.`);
        }
      } else if (orderItem.yarnAccessory) {
        // Decrement yarn accessory stock
        const updatedAccessory = await tx.yarnAccessory.update({
          where: { id: orderItem.yarnAccessory.id },
          data: { stock: { decrement: orderItem.quantity } },
          select: { stock: true, name: true },
        });
        if (updatedAccessory.stock < 0) {
          throw new Error(`Insufficient stock for accessory ${updatedAccessory.name}.`);
        }
      }
    }

    return updatedOrder;
  });

  console.log(`✅ Order completed via webhook: ${payment.order_id}`);
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

  // FIX #3: Return 200 IMMEDIATELY after signature check so Razorpay never times out
  // and retries, which would cause duplicate processing. All DB work runs in setImmediate.
  if (body.event === "payment.captured") {
    const payment = body.payload.payment.entity;

    setImmediate(() => {
      processCapture(payment, body).catch((err) => {
        console.error(`❌ Unhandled error in processCapture for ${payment.order_id}:`, err);
      });
    });

    return new Response("Accepted", { status: 200 });
  }

  if (body.event === "payment.failed") {
    const payment = body.payload.payment.entity;
    console.log("❌ Payment failed:", payment.id);

    setImmediate(() => {
      prisma.order.findUnique({
        where: { id: payment.order_id },
        select: { id: true, paid: true },
      }).then((existingOrder) => {
        if (existingOrder && !existingOrder.paid) {
          return prisma.order.update({
            where: { id: payment.order_id },
            data: { paid: false },
          }).then(() => {
            console.log(`✅ Marked order ${payment.order_id} as failed`);
          });
        }
      }).catch((error) => {
        console.error("❌ Error handling failed payment:", error);
      });
    });

    return new Response("Accepted", { status: 200 });
  }

  console.log(`ℹ️ Unhandled webhook event: ${body.event}`);
  return new Response("Event received", { status: 200 });
}

async function handlePaymentVerification(body: any) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing payment details" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET not configured");
      return NextResponse.json({ success: false, error: "Configuration error" }, { status: 500 });
    }

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.log("❌ Payment signature verification failed");
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: razorpay_order_id },
      select: { id: true, paid: true, paymentid: true, complete: true, pricepaid: true },
    });

    if (!order) {
      console.log(`⚠️ Order ${razorpay_order_id} not found`);
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    console.log("✅ Payment verified:", razorpay_payment_id);

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      order,
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Payment verification error:", error);
    return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 500 });
  }
}