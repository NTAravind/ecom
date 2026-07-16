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

    const body = await req.json();
    const { phoneno, cartitems, pincode, delivery, userId } = body;

    if (!phoneno || !cartitems || !Array.isArray(cartitems) || cartitems.length === 0 || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (delivery && !pincode) {
      return NextResponse.json({ error: "Pincode required for delivery" }, { status: 400 });
    }

    const productIds = cartitems.filter((item: any) => item.productId).map((item: any) => item.productId);
    const accessoryIds = cartitems.filter((item: any) => item.yarnAccessoryId).map((item: any) => item.yarnAccessoryId);

    // --- Fetch prices AND stock in a single query ---
    const [products, accessories] = await Promise.all([
      productIds.length > 0
        ? prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, pname: true, discountedPrice: true, stock: true },
          })
        : Promise.resolve([]),
      accessoryIds.length > 0
        ? prisma.yarnAccessory.findMany({
            where: { id: { in: accessoryIds } },
            select: { id: true, name: true, discountedPrice: true, stock: true },
          })
        : Promise.resolve([]),
    ]);

    // --- Server-side stock check BEFORE creating any order ---
    const stockErrors: Array<{ id: string; name: string; requested: number; available: number }> = [];

    for (const cartItem of cartitems) {
      if (cartItem.productId) {
        const product = products.find((p: any) => p.id === cartItem.productId);
        if (!product) {
          return NextResponse.json({ error: `Product not found: ${cartItem.productId}` }, { status: 404 });
        }
        if (!Number.isInteger(cartItem.qty) || cartItem.qty <= 0) {
          return NextResponse.json({ error: "Invalid quantity for item" }, { status: 400 });
        }
        if (cartItem.qty > product.stock) {
          stockErrors.push({
            id: product.id,
            name: product.pname,
            requested: cartItem.qty,
            available: product.stock,
          });
        }
      } else if (cartItem.yarnAccessoryId) {
        const accessory = accessories.find((a: any) => a.id === cartItem.yarnAccessoryId);
        if (!accessory) {
          return NextResponse.json({ error: `Accessory not found: ${cartItem.yarnAccessoryId}` }, { status: 404 });
        }
        if (!Number.isInteger(cartItem.qty) || cartItem.qty <= 0) {
          return NextResponse.json({ error: "Invalid quantity for item" }, { status: 400 });
        }
        if (cartItem.qty > accessory.stock) {
          stockErrors.push({
            id: accessory.id,
            name: accessory.name,
            requested: cartItem.qty,
            available: accessory.stock,
          });
        }
      } else {
        return NextResponse.json({ error: "Invalid cart item format" }, { status: 400 });
      }
    }

    if (stockErrors.length > 0) {
      console.log("❌ Stock check failed:", stockErrors);
      return NextResponse.json(
        { success: false, outOfStock: true, errors: stockErrors },
        { status: 409 }
      );
    }

    // --- Calculate total amount ---
    const amount = cartitems.reduce((total: number, orderItem: any) => {
      if (orderItem.productId) {
        const product = products.find((p: any) => p.id === orderItem.productId)!;
        return total + (product as any).discountedPrice * orderItem.qty;
      } else {
        const accessory = accessories.find((a: any) => a.id === orderItem.yarnAccessoryId)!;
        return total + (accessory as any).discountedPrice * orderItem.qty;
      }
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

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
    });

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
