
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        valid: false,
        errors: [{ productId: '', productName: 'Unknown', requested: 0, available: 0, message: 'Invalid or empty items list' }],
      });
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
      return res.status(400).json({ valid: false, errors });
    }

    return res.status(200).json({ valid: true, errors: [] });
  } catch (err) {
    console.error('Stock check error:', err);
    return res.status(500).json({
      valid: false,
      errors: [{ productId: '', productName: 'Unknown', requested: 0, available: 0, message: 'Server error during stock check' }],
    });
  }
}
