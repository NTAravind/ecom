import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Await the params since they're now a Promise
  const { orderId } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        paid: true,
        complete: true,
        pricepaid: true,
        delivered: true,
        userId: true,
        orderItems: { include: { product: true, yarnAccessory: true } },
      },
    });

    if (!order) {
      console.error(`❌ Order ${orderId} not found`);
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // session.user.id is the phone number (set by verifyOtp returning { id: phone }).
    // order.userId is the Prisma User UUID — resolve it before comparing.
    const dbUser = await prisma.user.findUnique({
      where: { phone: session.user.id as string },
      select: { id: true },
    });

    if (!dbUser || order.userId !== dbUser.id) {
      console.error(`❌ Unauthorized access to order ${orderId}`);
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    console.log(`✅ Order status checked: ${orderId}, Paid: ${order.paid}, Complete: ${order.complete}`);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        paid: order.paid,
        complete: order.complete,
        pricepaid: order.pricepaid,
        delivered: order.delivered,
        orderItems: order.orderItems.map(item => ({
          productId: item.product?.id || item.yarnAccessory?.id,
          productName: item.product?.pname || item.yarnAccessory?.name || "Unknown item",
          quantity: item.quantity,
        })),
      },
    }, { status: 200 });
  } catch (error) {
    console.error(`❌ Error checking order ${orderId}:`, error);
    return NextResponse.json({ success: false, error: "Failed to check order status" }, { status: 500 });
  }
}
