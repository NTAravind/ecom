import prisma from "@/lib/prisma";

type FinalizePaidOrderInput = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
};

export async function finalizePaidOrder({
  razorpayOrderId,
  razorpayPaymentId,
}: FinalizePaidOrderInput) {
  return prisma.$transaction(async (tx) => {
    const existingOrder = await tx.order.findUnique({
      where: { id: razorpayOrderId },
      include: {
        orderItems: {
          include: {
            product: true,
            yarnAccessory: true,
          },
        },
      },
    });

    if (!existingOrder) {
      throw new Error(`Order not found: ${razorpayOrderId}`);
    }

    // Idempotency guard: only the first caller can claim this unpaid order.
    // If frontend verification and webhook arrive together, stock is decremented once.
    const claimedOrder = await tx.order.updateMany({
      where: {
        id: razorpayOrderId,
        paid: false,
      },
      data: {
        paymentid: razorpayPaymentId,
        paid: true,
        complete: true,
      },
    });

    if (claimedOrder.count === 0) {
      return tx.order.findUnique({
        where: { id: razorpayOrderId },
        include: {
          orderItems: {
            include: {
              product: true,
              yarnAccessory: true,
            },
          },
        },
      });
    }

    for (const orderItem of existingOrder.orderItems) {
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

    return tx.order.findUnique({
      where: { id: razorpayOrderId },
      include: {
        orderItems: {
          include: {
            product: true,
            yarnAccessory: true,
          },
        },
      },
    });
  });
}
