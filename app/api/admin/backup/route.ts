import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  
  // This is an internal admin route — guard with session check
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [
      brands,
      products,
      yarnAccessories,
      users,
      orders,
      orderItems,
    ] = await Promise.all([
      prisma.brand.findMany(),
      prisma.product.findMany(),
      prisma.yarnAccessory.findMany(),
      prisma.user.findMany(),
      prisma.order.findMany({ include: { orderItems: true } }),
      prisma.orderItem.findMany(),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      metadata: {
        version: "1.0",
        type: "full_database_backup"
      },
      data: {
        brands,
        products,
        yarnAccessories,
        users,
        orders,
        orderItems,
      }
    };

    const fileName = `database_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json({ success: false, error: "Failed to generate backup" }, { status: 500 });
  }
}
