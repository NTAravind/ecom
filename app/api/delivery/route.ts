import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";// adjust path if needed
import { auth } from "@/auth";
export const dynamic = 'force-dynamic'; // for Next.js App Router + Prisma

export async function POST(req: NextRequest) {
  const aut = await auth();
  if(!aut?.user){return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });}
  try {
    const body = await req.json();
   
    const { userId, cartItems, pricepaid ,paymentid,order_id,delivery} = body;
   
    if (!userId || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
// In /api/delivery
const order = await prisma.$transaction(async (prisma) => {
  // Create order
  const newOrder = await prisma.order.create({
    data: {
      id: order_id,
      pricepaid,
      delivered: delivery,
      paid: false, // Will be updated by webhook
      user: { connect: { id: userId } },
      orderItems: {
        create: cartItems.map((cartItem) => ({
          quantity: cartItem.qty,
          product: { connect: { id: cartItem.item.id } }
        }))
      },
      paymentid: paymentid,
    }
  });

  // Update stock atomically
  for (const cartItem of cartItems) {
    await prisma.product.update({
      where: { id: cartItem.item.id },
      data: { stock: { decrement: cartItem.qty } }
    });
  }

  return newOrder;
});
for (const cartItem of cartItems) {
  await prisma.product.update({
    where: { id: cartItem.item.id },
    data: {
      stock: {
        decrement: cartItem.qty,
      },
    },
  });
}
    return NextResponse.json({ success: true, order }, { status: 200 });

  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
