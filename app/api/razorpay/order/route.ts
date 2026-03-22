import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/auth";
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
      
      if (!phoneno || !cartitems || !Array.isArray(cartitems) || cartitems.length === 0 || !userId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      if (delivery && !pincode) {
        return NextResponse.json({ error: "Pincode required for delivery" }, { status: 400 });
      }

      const productIds = cartitems.filter((item: any) => item.productId).map((item: any) => item.productId);
      const accessoryIds = cartitems.filter((item: any) => item.yarnAccessoryId).map((item: any) => item.yarnAccessoryId);
      
      const [products, accessories] = await Promise.all([
        productIds.length > 0 ? prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, discountedPrice: true } }) : Promise.resolve([]),
        accessoryIds.length > 0 ? prisma.yarnAccessory.findMany({ where: { id: { in: accessoryIds } }, select: { id: true, discountedPrice: true } }) : Promise.resolve([])
      ]);

      const amount = cartitems.reduce((total: number, orderItem: any) => {
        let itemData;
        
        if (orderItem.productId) {
          itemData = products.find((p: any) => p.id === orderItem.productId);
          if (!itemData) throw new Error(`Product not found: ${orderItem.productId}`);
        } else if (orderItem.yarnAccessoryId) {
          itemData = accessories.find((a: any) => a.id === orderItem.yarnAccessoryId);
          if (!itemData) throw new Error(`Accessory not found: ${orderItem.yarnAccessoryId}`);
        } else {
           throw new Error(`Invalid cart item format`);
        }
        
        if (!Number.isInteger(orderItem.qty) || orderItem.qty <= 0) {
          throw new Error(`Invalid quantity for item`);
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
        notes: { phone: phoneno, delivery_mode: delivery ? "delivery" : "pickup", pincode: pincode || "N/A",date: Date.now() },
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
              ...(cartItem.yarnAccessoryId ? { yarnAccessory: { connect: { id: cartItem.yarnAccessoryId } } } : {})
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
      // ORDER 
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

      const productIds = cartitems.filter((item: any) => item.productId).map((item: any) => item.productId);
      const accessoryIds = cartitems.filter((item: any) => item.yarnAccessoryId).map((item: any) => item.yarnAccessoryId);
      
      const [serverProducts, serverAccessories] = await Promise.all([
        productIds.length > 0 ? prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, discountedPrice: true } }) : Promise.resolve([]),
        accessoryIds.length > 0 ? prisma.yarnAccessory.findMany({ where: { id: { in: accessoryIds } }, select: { id: true, discountedPrice: true } }) : Promise.resolve([])
      ]);

      let serverCalculatedTotal = 0;
      for (const cartItem of cartitems) {
        let serverItem;
        if (cartItem.productId) {
          serverItem = serverProducts.find((p: any) => p.id === cartItem.productId);
          if (!serverItem) {
            return NextResponse.json({ success: false, error: `Product not found: ${cartItem.productId}` }, { status: 400 });
          }
        } else if (cartItem.yarnAccessoryId) {
          serverItem = serverAccessories.find((a: any) => a.id === cartItem.yarnAccessoryId);
          if (!serverItem) {
            return NextResponse.json({ success: false, error: `Accessory not found: ${cartItem.yarnAccessoryId}` }, { status: 400 });
          }
        }
        
        if (!Number.isInteger(cartItem.qty) || cartItem.qty <= 0) {
          return NextResponse.json({ success: false, error: `Invalid quantity details` }, { status: 400 });
        }
        serverCalculatedTotal += serverItem.discountedPrice * cartItem.qty;
      }

      const serverDeliveryCharge = delivery && serverCalculatedTotal < 999 ? 60 : 0;
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
          if (orderItem.productId) {
            const updatedProduct = await tx.product.update({
              where: { id: orderItem.productId },
              data: { stock: { decrement: orderItem.quantity } },
              select: { stock: true, pname: true },
            });

            if (updatedProduct.stock < 0) {
              throw new Error(`Insufficient stock for product ${updatedProduct.pname}.`);
            }
          } else if (orderItem.yarnAccessoryId) {
            const updatedAccessory = await tx.yarnAccessory.update({
              where: { id: orderItem.yarnAccessoryId },
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