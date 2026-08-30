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
      prisma.order.findMany(),
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

type BackupRecord = Record<string, unknown>;

const collectionNames = [
  "brands",
  "products",
  "yarnAccessories",
  "users",
  "orders",
  "orderItems",
] as const;

function isRecord(value: unknown): value is BackupRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toDate(value: unknown, field: string) {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${field} date in backup file`);
  }
  return date;
}

function normalizeRecord(record: BackupRecord) {
  const normalized: BackupRecord = { ...record };

  if ("createdAt" in normalized) {
    normalized.createdAt = toDate(normalized.createdAt, "createdAt");
  }
  if ("updatedAt" in normalized) {
    normalized.updatedAt = toDate(normalized.updatedAt, "updatedAt");
  }

  return normalized;
}

function withoutId(record: BackupRecord) {
  const { id: _id, ...data } = record;
  return data;
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload: unknown = await req.json();
    if (!isRecord(payload) || !isRecord(payload.data)) {
      return NextResponse.json(
        { success: false, error: "This is not a valid database backup file." },
        { status: 400 }
      );
    }

    const data = payload.data;
    const collections = Object.fromEntries(
      collectionNames.map((name) => [name, data[name]])
    ) as Record<(typeof collectionNames)[number], unknown>;

    for (const name of collectionNames) {
      if (!Array.isArray(collections[name]) || !collections[name].every(isRecord)) {
        return NextResponse.json(
          { success: false, error: `The backup's ${name} collection is invalid.` },
          { status: 400 }
        );
      }
    }

    const validCollections = collections as Record<(typeof collectionNames)[number], BackupRecord[]>;
    const brands = validCollections.brands.map(normalizeRecord);
    const products = validCollections.products.map(normalizeRecord);
    const yarnAccessories = validCollections.yarnAccessories.map(normalizeRecord);
    const users = validCollections.users.map(normalizeRecord);
    // Older backup files included orderItems nested in every order as well as in
    // their own collection. The standalone collection is the restore source.
    const orders = validCollections.orders.map((record) => {
      const { orderItems: _orderItems, ...order } = record;
      return normalizeRecord(order);
    });
    const orderItems = validCollections.orderItems.map(normalizeRecord);

    const requiredFields: Array<[BackupRecord[], string[]]> = [
      [brands, ["id", "name"]],
      [products, ["id", "brandId"]],
      [yarnAccessories, ["id"]],
      [users, ["id", "phone"]],
      [orders, ["id", "userId"]],
      [orderItems, ["id", "orderId"]],
    ];

    for (const [records, fields] of requiredFields) {
      for (const record of records) {
        if (fields.some((field) => typeof record[field] !== "string" || !record[field])) {
          return NextResponse.json(
            { success: false, error: "The backup is missing required record identifiers." },
            { status: 400 }
          );
        }
      }
    }

    // Use Prisma's batch transaction instead of an interactive transaction. A
    // backup can contain hundreds of records and easily exceed its 5-second
    // interactive timeout when each record is restored one at a time.
    await prisma.$transaction([
      ...brands.map((brand) =>
        prisma.brand.upsert({ where: { id: String(brand.id) }, create: brand as never, update: withoutId(brand) as never })
      ),
      ...users.map((user) =>
        prisma.user.upsert({ where: { id: String(user.id) }, create: user as never, update: withoutId(user) as never })
      ),
      ...products.map((product) =>
        prisma.product.upsert({ where: { id: String(product.id) }, create: product as never, update: withoutId(product) as never })
      ),
      ...yarnAccessories.map((accessory) =>
        prisma.yarnAccessory.upsert({ where: { id: String(accessory.id) }, create: accessory as never, update: withoutId(accessory) as never })
      ),
      ...orders.map((order) =>
        prisma.order.upsert({ where: { id: String(order.id) }, create: order as never, update: withoutId(order) as never })
      ),
      ...orderItems.map((orderItem) =>
        prisma.orderItem.upsert({ where: { id: String(orderItem.id) }, create: orderItem as never, update: withoutId(orderItem) as never })
      ),
    ]);

    return NextResponse.json({
      success: true,
      restored: Object.fromEntries(collectionNames.map((name) => [name, validCollections[name].length])),
    });
  } catch (error) {
    console.error("Restore failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to restore the backup" },
      { status: 500 }
    );
  }
}
