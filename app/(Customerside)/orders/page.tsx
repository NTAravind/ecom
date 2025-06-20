import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export default async function Orders() {
  const userid = await auth();
  const phone = userid?.user?.name as string;

  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, name: true },
  });

  if (!user) {
    return <p>User not found</p>;
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">
        Your Orders, {user.name}
      </h1>

      {orders.length === 0 ? (
        <p className="text-gray-600">No orders found.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border p-4 rounded-md shadow-sm bg-white"
            >
              <p className="text-sm text-gray-500">
                Order ID: <span className="font-mono">{order.id}</span>
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Date: {new Date(order.createdAt).toLocaleString()}
              </p>

              <div className="space-y-2">
                {order.orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center"
                  >
                    <span>{item.product.pname}</span>
                    <span className="text-sm text-gray-600">
                      ₹{item.product.price} × {item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-right font-semibold text-blue-600">
                Total Paid: ₹{order.pricepaid}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
