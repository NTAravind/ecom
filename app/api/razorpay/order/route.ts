import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/auth";
import { GetProductPrice } from "@/lib/actions";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { number } from "zod/v4";

export async function POST(req: NextRequest) {
  const aut = await auth();
  if (!aut?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Payment service configuration error" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
    });

    const body = await req.json();
    const { phoneno, cartitems, pincode, delivery, userId, razorpay_payment_id, razorpay_order_id, razorpay_signature, pricepaid } = body;

    const isOrderCompletion = razorpay_payment_id && razorpay_order_id && razorpay_signature;

    if (!isOrderCompletion) {
      // ORDER CREATION
      if (!phoneno || !cartitems || !Array.isArray(cartitems) || cartitems.length === 0 || !userId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      if (delivery && !pincode) {
        return NextResponse.json({ error: "Pincode required for delivery" }, { status: 400 });
      }

      const productIds = cartitems.map((item: any) => item.productId);
      const products = await GetProductPrice(productIds);

      const amount = cartitems.reduce((total: number, orderItem: any) => {
        const product = products.find((p: any) => p.id === orderItem.productId);
        if (!product) throw new Error(`Product not found: ${orderItem.productId}`);
        if (!Number.isInteger(orderItem.qty) || orderItem.qty <= 0) {
          throw new Error(`Invalid quantity for product: ${orderItem.productId}`);
        }
        return total + product.discountedPrice * orderItem.qty;
      }, 0);

      const deliveryCharge = delivery && amount < 2000 ? 60 : 0;
      const taxes = 4;
      const totalAmount = amount + deliveryCharge + taxes;

      if (totalAmount > 10000) {
        return NextResponse.json({ error: "Please prefer bulk order" }, { status: 501 });
      }

      if (totalAmount <= 0) {
        return NextResponse.json({ error: "Invalid order amount" }, { status: 400 });
      }

      const orderOptions = {
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${phoneno}_${Date.now()}`,
        notes: { phone: phoneno, delivery_mode: delivery ? "delivery" : "pickup", pincode: pincode || "N/A",date: Date.now() },
      };

      const razorpayOrder = await razorpay.orders.create(orderOptions);
      console.log("✅ Razorpay order created:", razorpayOrder.id);

      const dbOrder = await prisma.order.create({
        data: {
          id: razorpayOrder.id,
          pricepaid: totalAmount,
          paymentid: "",
          paid: false,
          complete: false,
          delivered: delivery || false,
          user: { connect: { id: userId } },
          orderItems: {
            create: cartitems.map((cartItem: any) => ({
              quantity: cartItem.qty,
              product: { connect: { id: cartItem.productId } },
            })),
          },
        },
        include: { orderItems: { include: { product: true } } },
      });

      console.log("✅ Unpaid order created:", dbOrder.id);

      return NextResponse.json({
        success: true,
        orderId: razorpayOrder.id,
        amount: totalAmount,
        breakdown: { subtotal: amount, deliveryCharge, taxes, total: totalAmount },
      }, { status: 200 });
    } else {
      // ORDER COMPLETION
      if (!userId || !cartitems || !Array.isArray(cartitems) || cartitems.length === 0 || !pricepaid) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
      }

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        console.error(`❌ Signature verification failed for order: ${razorpay_order_id}`);
        return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
      }

      const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
      const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

      if (razorpayOrder.status !== "paid" || razorpayPayment.status !== "captured") {
        return NextResponse.json({ success: false, error: "Payment not confirmed" }, { status: 400 });
      }

      if (razorpayOrder.amount !== Math.round(pricepaid * 100)) {
        console.error(`❌ Amount mismatch for order ${razorpay_order_id}`);
        return NextResponse.json({ success: false, error: "Amount verification failed" }, { status: 400 });
      }

      const existingOrder = await prisma.order.findUnique({
        where: { id: razorpay_order_id },
        include: { orderItems: { include: { product: true } } },
      });

      if (!existingOrder) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }

      if (existingOrder.paid) {
        console.log(`✅ Order ${razorpay_order_id} already paid`);
        return NextResponse.json({ success: true, order: existingOrder, message: "Order already completed" }, { status: 200 });
      }

      const productIds = cartitems.map((item: any) => item.productId);
      const serverProducts = await GetProductPrice(productIds);

      let serverCalculatedTotal = 0;
      for (const cartItem of cartitems) {
        const serverProduct = serverProducts.find((p: any) => p.id === cartItem.productId);
        if (!serverProduct) {
          return NextResponse.json({ success: false, error: `Product not found: ${cartItem.productId}` }, { status: 400 });
        }
        if (!Number.isInteger(cartItem.qty) || cartItem.qty <= 0) {
          return NextResponse.json({ success: false, error: `Invalid quantity for product: ${cartItem.productId}` }, { status: 400 });
        }
        serverCalculatedTotal += serverProduct.discountedPrice * cartItem.qty;
      }

      const serverDeliveryCharge = delivery && serverCalculatedTotal < 2000 ? 60 : 0;
      const serverTotalAmount = serverCalculatedTotal + serverDeliveryCharge + 4;

      if (Math.abs(pricepaid - serverTotalAmount) > 0.01) {
        console.error(`❌ Price tampering detected for order ${razorpay_order_id}`);
        return NextResponse.json({ success: false, error: "Price verification failed" }, { status: 400 });
      }

      const completedOrder = await prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: { id: razorpay_order_id },
          data: { paymentid: razorpay_payment_id, paid: true, complete: true },
          include: { orderItems: { include: { product: true } } },
        });

        for (const orderItem of updatedOrder.orderItems) {
          const updatedProduct = await tx.product.update({
            where: { id: orderItem.product.id },
            data: { stock: { decrement: orderItem.quantity } },
            select: { stock: true, pname: true },
          });

          if (updatedProduct.stock < 0) {
            throw new Error(`Insufficient stock for ${updatedProduct.pname}.`);
          }
        }

        return updatedOrder;
      });

      console.log(`✅ Order completed: ${razorpay_order_id}`);

      return NextResponse.json({
        success: true,
        order: completedOrder,
        message: "Order completed successfully",
      }, { status: 200 });
    }
  } catch (err: any) {
    console.error("❌ Order error:", err);
    if (err.code === "P2002") {
      return NextResponse.json({ success: false, error: "Order or payment already exists" }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "Order processing failed" }, { status: 500 });
  }
}