import { CartItem } from "@/app/store/store";
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/auth";
import { GetProductPrice } from "@/lib/actions";
import prisma from "@/lib/prisma";
import crypto from "crypto";

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
      
      // Get product prices from server (SECURITY: Always verify prices server-side)
      const products = await GetProductPrice(productIds);
      
      // Calculate total amount (SECURITY: Server-side calculation only)
      const amount = cartitems.reduce((total: number, orderItem: any) => {
        const product = products.find((p: any) => p.id === orderItem.productId);
        
        if (!product) {
          throw new Error(`Product not found: ${orderItem.productId}`);
        }
        
        // Validate quantity is positive integer
        if (!Number.isInteger(orderItem.qty) || orderItem.qty <= 0) {
          throw new Error(`Invalid quantity for product: ${orderItem.productId}`);
        }
        
        return total + product.discountedPrice * orderItem.qty;
      }, 0);

      // Calculate delivery charge based on delivery mode
      let deliveryCharge = 0;
      if (delivery) {
        if(amount >= 2000) {
          deliveryCharge = 0;
        } else {
          deliveryCharge = 60;
        }
      }

      const taxes = 4;
      const totalAmount = amount + deliveryCharge + taxes;
      
      if (totalAmount > 10000) {
        return NextResponse.json(
          { error: "Please prefer bulk order" },
          { status: 501 }
        );
      }

      if (totalAmount <= 0) {
        return NextResponse.json(
          { error: "Invalid order amount" },
          { status: 400 }
        );
      }

      console.log("💰 Creating order with amount:", totalAmount);

      const orderOptions = {
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${phoneno}_${Date.now()}`,
        notes: {
          phone: phoneno,
          delivery_mode: delivery ? "delivery" : "pickup",
          pincode: pincode || "N/A",
          item_count: cartitems.length.toString()
        }
      };

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
      // ORDER COMPLETION FLOW - SECURE IMPLEMENTATION
      
      const { userId, cartItems, pricepaid, order_id } = body;

      // SECURITY: Validate all required fields
      if (!userId || !Array.isArray(cartItems) || cartItems.length === 0 || !order_id) {
        return NextResponse.json({ 
          success: false, 
          error: "Invalid request - missing required fields" 
        }, { status: 400 });
      }

      // SECURITY: Validate payment signature FIRST (Critical!)
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return NextResponse.json({ 
          success: false, 
          error: "Missing payment verification data" 
        }, { status: 400 });
      }

      // SECURITY: Verify payment signature before processing
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        console.error(`❌ Payment signature verification failed for order: ${order_id}`);
        console.error(`Expected: ${expectedSignature}`);
        console.error(`Received: ${razorpay_signature}`);
        
        return NextResponse.json({ 
          success: false, 
          error: "Payment verification failed - invalid signature" 
        }, { status: 400 });
      }

      console.log(`✅ Payment signature verified for order: ${order_id}`);

      // SECURITY: Verify the order exists in Razorpay and is paid
      try {
        const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
        const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

        // SECURITY: Verify order status
        if (razorpayOrder.status !== 'paid' && razorpayPayment.status !== 'captured') {
          return NextResponse.json({ 
            success: false, 
            error: "Payment not confirmed by Razorpay" 
          }, { status: 400 });
        }

        // SECURITY: Verify amount matches (protect against tampering)
        const expectedAmount = Math.round(pricepaid * 100); // Convert to paise
        if (razorpayOrder.amount !== expectedAmount) {
          console.error(`❌ Amount mismatch for order ${order_id}`);
          console.error(`Expected: ${expectedAmount}, Razorpay: ${razorpayOrder.amount}`);
          
          return NextResponse.json({ 
            success: false, 
            error: "Payment amount verification failed" 
          }, { status: 400 });
        }

        console.log(`✅ Razorpay order verification passed for: ${order_id}`);

      } catch (razorpayError: any) {
        console.error(`❌ Razorpay verification failed:`, razorpayError);
        return NextResponse.json({ 
          success: false, 
          error: "Payment verification with Razorpay failed" 
        }, { status: 400 });
      }

      // SECURITY: Server-side price validation (prevent price manipulation)
      const productIds = cartItems.map((item: any) => item.item.id);
      const serverProducts = await GetProductPrice(productIds);
      
      let serverCalculatedTotal = 0;
      for (const cartItem of cartItems) {
        const serverProduct = serverProducts.find(p => p.id === cartItem.item.id);
        if (!serverProduct) {
          return NextResponse.json({ 
            success: false, 
            error: `Product validation failed: ${cartItem.item.id}` 
          }, { status: 400 });
        }
        
        // Validate quantities
        if (!Number.isInteger(cartItem.qty) || cartItem.qty <= 0) {
          return NextResponse.json({ 
            success: false, 
            error: `Invalid quantity for product: ${cartItem.item.id}` 
          }, { status: 400 });
        }
        
        serverCalculatedTotal += serverProduct.discountedPrice * cartItem.qty;
      }

      // Add delivery and taxes (same logic as order creation)
      let serverDeliveryCharge = 0;
      if (delivery) {
        serverDeliveryCharge = serverCalculatedTotal >= 2000 ? 0 : 60;
      }
      
      const serverTotalAmount = serverCalculatedTotal + serverDeliveryCharge + 4;
      
      // SECURITY: Verify the paid amount matches server calculation
      if (Math.abs(pricepaid - serverTotalAmount) > 0.01) { // Allow for small floating point differences
        console.error(`❌ Price tampering detected for order ${order_id}`);
        console.error(`Client sent: ${pricepaid}, Server calculated: ${serverTotalAmount}`);
        
        return NextResponse.json({ 
          success: false, 
          error: "Price verification failed" 
        }, { status: 400 });
      }

      console.log(`✅ Server-side price validation passed for order: ${order_id}`);

      // Check if order already exists (prevent duplicates)
      const existingOrder = await prisma.order.findUnique({
        where: { id: order_id }
      });

      if (existingOrder) {
        console.log(`⚠️ Order ${order_id} already exists, returning existing order`);
        return NextResponse.json({ 
          success: true, 
          order: existingOrder,
          message: "Order already exists" 
        }, { status: 200 });
      }

      // SECURITY: Check for duplicate payment IDs
      const existingPayment = await prisma.order.findFirst({
        where: { paymentid: razorpay_payment_id }
      });

      if (existingPayment) {
        console.log(`⚠️ Payment ${razorpay_payment_id} already used for order ${existingPayment.id}`);
        return NextResponse.json({ 
          success: false, 
          error: "Payment already processed" 
        }, { status: 409 });
      }

      console.log(`🚀 Creating secure order in database: ${order_id}`);

      // Create order with all security validations passed
      const result = await prisma.$transaction(async (tx) => {
        // Create the order - payment is already verified and captured
        const order = await tx.order.create({
          data: {
            id: order_id,
            pricepaid: serverTotalAmount, // Use server-calculated amount
            delivered: delivery,
            paid: true, // Payment is verified and captured
            complete: true, // Order is complete
            user: { connect: { id: userId } },
            orderItems: {
              create: cartItems.map((cartItem: any) => ({
                quantity: cartItem.qty,
                product: {
                  connect: { id: cartItem.item.id },
                },
              })),
            },
            paymentid: razorpay_payment_id,
          },
        });

        console.log(`✅ Secure order ${order_id} created successfully`);

        // Update product stock
        for (const cartItem of cartItems) {
          const updatedProduct = await tx.product.update({
            where: { id: cartItem.item.id },
            data: {
              stock: {
                decrement: cartItem.qty,
              },
            },
            select: { stock: true, pname: true }
          });

          // SECURITY: Check for negative stock
          if (updatedProduct.stock < 0) {
            throw new Error(`Insufficient stock for product: ${updatedProduct.pname}`);
          }
        }

        return order;
      });

      console.log(`✅ Secure order completed successfully: ${order_id}`);

      return NextResponse.json({ 
        success: true, 
        order: result,
        message: "Order created successfully with full security validation" 
      }, { status: 200 });
    }
    
  } catch (err: any) {
    console.error("❌ Secure order operation failed:", err);
    
    // Handle specific Prisma errors
    if (err.code === 'P2002') {
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
    
    // Razorpay specific errors
    if (err.statusCode === 401) {
      console.error("🔐 Razorpay authentication failed");
      return NextResponse.json(
        { error: "Payment service authentication failed" },
        { status: 500 }
      );
    }
    
    if (err.statusCode === 400) {
      console.error("📋 Razorpay bad request");
      return NextResponse.json(
        { error: "Invalid payment parameters" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong while processing secure order" },
      { status: 500 }
    );
  }
}