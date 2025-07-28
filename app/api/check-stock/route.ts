
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();
    
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          valid: false,
          errors: [{ productId: '', productName: 'Unknown', requested: 0, available: 0, message: 'Invalid or empty items list' }],
        },
        { status: 400 }
      );
    }

    const errors: Array<{ productId: string; productName: string; requested: number; available: number; message: string }> = [];

    // Batch query to fetch all products in one go
    const productIds = items.map((item: { productId: string }) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, pname: true, stock: true },
    });

    // Map products to a lookup for efficient access
    const productMap = new Map(products.map(product => [product.id, product]));

    for (const { productId, qty } of items) {
      const product = productMap.get(productId);
      if (!product) {
        errors.push({
          productId,
          productName: 'Unknown Product',
          requested: qty,
          available: 0,
          message: 'Product not found',
        });
        continue;
      }

      const availableStock = product.stock || 0;
      if (qty > availableStock) {
        errors.push({
          productId,
          productName: product.pname || 'Unknown Product',
          requested: qty,
          available: availableStock,
          message: `Only ${availableStock} unit${availableStock !== 1 ? 's' : ''} available`,
        });
      }
    }

    if (errors.length > 0) {
      console.warn('Stock validation failed:', errors);
      return NextResponse.json({ valid: false, errors }, { status: 400 });
    }

    return NextResponse.json({ valid: true, errors: [] });
  } catch (err) {
    console.error('Stock check error:', err);
    return NextResponse.json(
      {
        valid: false,
        errors: [{ productId: '', productName: 'Unknown', requested: 0, available: 0, message: 'Server error during stock check' }],
      },
      { status: 500 }
    );
  }
}
