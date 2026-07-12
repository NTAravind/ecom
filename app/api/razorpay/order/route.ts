import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

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
    const { phoneno, cartitems, pincode, delivery, userId } = body;

    // This endpoint only creates unpaid Razorpay/DB orders.
    // Paid completion now happens in /api/razorpay/verify via the shared finalizer.
    if (!phoneno || !cartitems || !Array.isArray(cartitems) || cartitems.length === 0 || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (delivery && !pincode) {
      return NextResponse.json({ error: "Pincode required for delivery" }, { status: 400 });
    }

    const productIds = cartitems.filter((item: any) => item.productId).map((item: any) => item.productId);
    const accessoryIds = cartitems.filter((item: any) => item.yarnAccessoryId).map((item: any) => item.yarnAccessoryId);

    const [products, accessories] = await Promise.all([
      productIds.length > 0
        ? prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, discountedPrice: true } })
        : Promise.resolve([]),
      accessoryIds.length > 0
        ? prisma.yarnAccessory.findMany({ where: { id: { in: accessoryIds } }, select: { id: true, discountedPrice: true } })
        : Promise.resolve([]),
    ]);

    const amount = cartitems.reduce((total: number, orderItem: any) => {
      let itemData;

      if (orderItem.productId) {
        itemData = products.find((product: any) => product.id === orderItem.productId);
        if (!itemData) throw new Error(`Product not found: ${orderItem.productId}`);
      } else if (orderItem.yarnAccessoryId) {
        itemData = accessories.find((accessory: any) => accessory.id === orderItem.yarnAccessoryId);
        if (!itemData) throw new Error(`Accessory not found: ${orderItem.yarnAccessoryId}`);
      } else {
        throw new Error("Invalid cart item format");
      }

      if (!Number.isInteger(orderItem.qty) || orderItem.qty <= 0) {
        throw new Error("Invalid quantity for item");
      }

      return total + itemData.discountedPrice * orderItem.qty;
    }, 0);

    const deliveryCharge = delivery && amount < 999 ? 60 : 0;
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
      notes: {
        phone: phoneno,
        delivery_mode: delivery ? "delivery" : "pickup",
        pincode: pincode || "N/A",
        date: Date.now(),
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);
    console.log("✅ Razorpay order created:", razorpayOrder.id);

    const dbOrder = await prisma.order.create({
      data: {
        id: razorpayOrder.id,
        pricepaid: totalAmount,
        paymentid: razorpayOrder.id,
        paid: false,
        complete: false,
        delivered: delivery || false,
        user: { connect: { id: userId } },
        orderItems: {
          create: cartitems.map((cartItem: any) => ({
            quantity: cartItem.qty,
            ...(cartItem.productId ? { product: { connect: { id: cartItem.productId } } } : {}),
            ...(cartItem.yarnAccessoryId ? { yarnAccessory: { connect: { id: cartItem.yarnAccessoryId } } } : {}),
          })),
        },
      },
      include: { orderItems: { include: { product: true, yarnAccessory: true } } },
    });

    console.log("✅ Unpaid order created:", dbOrder.id);

    return NextResponse.json(
      {
        success: true,
        orderId: razorpayOrder.id,
        amount: totalAmount,
        breakdown: { subtotal: amount, deliveryCharge, taxes, total: totalAmount },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ Order error:", err);
    if (err.code === "P2002") {
      return NextResponse.json({ success: false, error: "Order or payment already exists" }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "Order processing failed" }, { status: 500 });
  }
}
