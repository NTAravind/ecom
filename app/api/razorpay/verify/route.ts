import { CartItem } from "@/app/store/store";
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/auth";
import { GetProductPrice } from "@/lib/actions";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const aut = await auth();
  if (!aut?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Validate Razorpay credentials first
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Payment service configuration error" },
        { status: 500 }
      );
    }

    // Initialize Razorpay with explicit credentials
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
    });

    const body = await req.json();
    const { phoneno, cartitems, pincode, delivery, paymentid, razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    // Check if this is order creation or order completion
    const isOrderCompletion = paymentid || razorpay_payment_id;

    if (!isOrderCompletion) {
      // ORDER CREATION FLOW (existing logic)
      
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
        if(amount >= 2000) {
          deliveryCharge = 0;
        } else {
          deliveryCharge = 60; // Fixed delivery charge
        }
      }

      // Add taxes (if any)
      const taxes = 4;
      
      // Calculate final total
      const totalAmount = amount + deliveryCharge + taxes;
      
      if (totalAmount > 10000) {
        return NextResponse.json(
          { error: "Please prefer bulk order" },
          { status: 501 }
        );
      }

      // Validate amount before creating order
      if (totalAmount <= 0) {
        return NextResponse.json(
          { error: "Invalid order amount" },
          { status: 400 }
        );
      }

      console.log("💰 Creating order with amount:", totalAmount);

      // Create Razorpay order with additional error handling
      const orderOptions = {
        amount: Math.round(totalAmount * 100), // Ensure integer value in paise
        currency: "INR",
        receipt: `receipt_${phoneno}_${Date.now()}`,
        notes: {
          phone: phoneno,
          delivery_mode: delivery ? "delivery" : "pickup",
          pincode: pincode || "N/A",
          item_count: cartitems.length.toString()
        }
      };

      console.log("📝 Order options:", orderOptions);

      const order = await razorpay.orders.create(orderOptions);

      console.log("✅ Razorpay order created successfully:", order.id);

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

    } else {
      // ORDER COMPLETION FLOW - FIXED TO PREVENT RACE CONDITIONS
      
      const { userId, cartItems, pricepaid, order_id } = body;

      // Validate required fields for order completion
      if (!userId || !Array.isArray(cartItems) || cartItems.length === 0 || !order_id) {
        return NextResponse.json({ 
          success: false, 
          error: "Invalid request - missing userId, cartItems, or order_id" 
        }, { status: 400 });
      }

      // First verify the payment with Razorpay (if signature provided)
      if (razorpay_signature) {
        const crypto = require('crypto');
        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');

        if (expectedSignature !== razorpay_signature) {
          return NextResponse.json({ 
            success: false, 
            error: "Payment verification failed" 
          }, { status: 400 });
        }
      }

      // Check if order already exists (to prevent duplicate creation)
      const existingOrder = await prisma.order.findUnique({
        where: { id: order_id }
      });

      if (existingOrder) {
        console.log(`Order ${order_id} already exists, skipping creation`);
        return NextResponse.json({ 
          success: true, 
          order: existingOrder,
          message: "Order already exists" 
        }, { status: 200 });
      }

      console.log(`🚀 Creating order in database BEFORE responding: ${order_id}`);

      // Use transaction to ensure atomicity - CREATE ORDER FIRST
      const result = await prisma.$transaction(async (tx) => {
        // Create the order in database IMMEDIATELY
        const order = await tx.order.create({
          data: {
            id: order_id,
            pricepaid,
            delivered: delivery,
            paid: false, // Will be updated by webhook when payment is captured
            complete: false, // Will be updated by webhook
            user: { connect: { id: userId } },
            orderItems: {
              create: cartItems.map((cartItem: any) => ({
                quantity: cartItem.qty,
                product: {
                  connect: { id: cartItem.item.id },
                },
              })),
            },
            paymentid: paymentid || razorpay_payment_id,
          },
        });

        console.log(`✅ Order ${order_id} created in database successfully`);

        // Decrease product quantity
        for (const cartItem of cartItems) {
          await tx.product.update({
            where: { id: cartItem.item.id },
            data: {
              stock: {
                decrement: cartItem.qty,
              },
            },
          });
        }

        return order;
      });

      // Add a small delay to ensure database transaction is fully committed
      // This helps prevent race conditions with webhooks
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log(`✅ Order completed successfully with delay: ${order_id}`);

      return NextResponse.json({ 
        success: true, 
        order: result,
        message: "Order created successfully" 
      }, { status: 200 });
    }
    
  } catch (err: any) {
    console.error("❌ Order operation failed:", err);
    
    // Handle specific Prisma errors
    if (err.code === 'P2002') {
      // Unique constraint violation
      if (err.meta?.target?.includes('id')) {
        return NextResponse.json({ 
          success: false, 
          error: "Order already exists" 
        }, { status: 409 });
      }
      if (err.meta?.target?.includes('paymentid')) {
        return NextResponse.json({ 
          success: false, 
          error: "Payment already processed" 
        }, { status: 409 });
      }
    }
    
    // More detailed error logging for Razorpay errors
    if (err.statusCode === 401) {
      console.error("🔐 Authentication failed - Check your Razorpay credentials");
      return NextResponse.json(
        { error: "Payment service authentication failed. Please check configuration." },
        { status: 500 }
      );
    }
    
    if (err.statusCode === 400) {
      console.error("📋 Bad request - Check order parameters");
      return NextResponse.json(
        { error: "Invalid order parameters" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong while processing order" },
      { status: 500 }
    );
  }
}