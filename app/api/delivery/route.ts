import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";// adjust path if needed
export const dynamic = 'force-dynamic'; // for Next.js App Router + Prisma

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
      console.log(body)
    const { userId, cartItems, pricepaid ,paymentid,order_id} = body;
  
    if (!userId || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        id: order_id,
        pricepaid,
        user: { connect: { id: userId } },
        orderItems: {
          create: cartItems.map((cartItem: any) => ({
            quantity: cartItem.qty,
            product: {
              connect: { id: cartItem.item.id },
            },
            
          }
        
        )),
        },
        paymentid: paymentid,
      },
    });

    return NextResponse.json({ success: true, order }, { status: 200 });

  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
