import prisma from "@/lib/prisma";

type FinalizePaidOrderInput = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
};

const orderInclude = {
  orderItems: {
    include: {
      product: true,
      yarnAccessory: true,
    },
  },
} as const;

export async function finalizePaidOrder({
  razorpayOrderId,
  razorpayPaymentId,
}: FinalizePaidOrderInput) {
  // ---------------------------------------------------------------------
  // STEP 1: Claim the order as paid.
  //
  // This is its OWN statement, not part of the stock-decrement transaction.
  // Razorpay has already captured real money by the time this function is
  // called, so "paid" must never be rolled back just because stock ran out.
  //
  // The `where: { paid: false }` clause makes this idempotent: if the
  // frontend verification call and the webhook both arrive for the same
  // order, only the first one actually claims it (count === 1), and the
  // second one sees count === 0 and just returns current state below.
  // ---------------------------------------------------------------------
  const claimedOrder = await prisma.order.updateMany({
    where: {
      id: razorpayOrderId,
      paid: false,
    },
    data: {
      paymentid: razorpayPaymentId,
      paid: true,
    },
  });

  if (claimedOrder.count === 0) {
    // Either already claimed by a concurrent call, or the order doesn't
    // exist. Distinguish those two cases for the caller.
    const existing = await prisma.order.findUnique({
      where: { id: razorpayOrderId },
      include: orderInclude,
    });

    if (!existing) {
      throw new Error(`Order not found: ${razorpayOrderId}`);
    }

    return existing;
  }

  // ---------------------------------------------------------------------
  // STEP 2: Decrement stock and mark the order complete.
  //
  // This runs in its own transaction, AFTER paid has already been
  // committed. If stock is insufficient for any item, this transaction
  // rolls back and the order is left in a `paid: true, complete: false`
  // state — which is recoverable (refund / restock / notify) instead of
  // silently losing the fact that the customer was charged.
  // ---------------------------------------------------------------------
  try {
    return await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: razorpayOrderId },
        include: orderInclude,
      });

      if (!existingOrder) {
        // Shouldn't happen (we just claimed it above), but guard anyway.
        throw new Error(`Order disappeared during finalize: ${razorpayOrderId}`);
      }

      for (const orderItem of existingOrder.orderItems) {
        if (orderItem.productId) {
          // Atomic conditional decrement: only succeeds if stock is
          // currently >= requested quantity. No read-then-check race,
          // no possibility of ending up with negative stock.
          const result = await tx.product.updateMany({
            where: {
              id: orderItem.productId,
              stock: { gte: orderItem.quantity },
            },
            data: { stock: { decrement: orderItem.quantity } },
          });

          if (result.count === 0) {
            throw new Error(
              `Insufficient stock for product ${orderItem.product?.pname ?? orderItem.productId}.`
            );
          }
        } else if (orderItem.yarnAccessoryId) {
          const result = await tx.yarnAccessory.updateMany({
            where: {
              id: orderItem.yarnAccessoryId,
              stock: { gte: orderItem.quantity },
            },
            data: { stock: { decrement: orderItem.quantity } },
          });

          if (result.count === 0) {
            throw new Error(
              `Insufficient stock for accessory ${orderItem.yarnAccessory?.name ?? orderItem.yarnAccessoryId}.`
            );
          }
        }
      }

      return tx.order.update({
        where: { id: razorpayOrderId },
        data: { complete: true },
        include: orderInclude,
      });
    });
  } catch (err) {
    // paid remains true here — payment was captured and the claim above
    // already committed. Surface this loudly so it gets reconciled
    // (refund via Razorpay, restock, or manual fulfillment) rather than
    // silently disappearing.
    console.error(
      `⚠️ Payment captured but stock decrement failed for order ${razorpayOrderId} (payment ${razorpayPaymentId}):`,
      err
    );
    throw err;
  }
}