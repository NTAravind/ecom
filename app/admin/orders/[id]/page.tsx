// app/(admin)/orders/[id]/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, MapPin, Phone, CreditCard, Package, Calendar } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import Image from "next/image"

import { getOrderWithDetails } from "../_actions/order"
import MarkToComplete from "../components/mark"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const order = await getOrderWithDetails(id);

  if (!order) {
    notFound();
  }

  const totalItems = order.orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

  return (
   <div className="container mx-10 py-6 space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold">Order Details</h1>
      <p className="text-muted-foreground">Order ID: {order.id}</p>
    </div>
    <MarkToComplete prop={{id}}/>
  </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Summary
            </CardTitle>
            <CardDescription>
              Order placed on {new Date(order.createdAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Order Status</span>
              <Badge variant={order.complete ? "default" : "secondary"}>
                {order.complete ? "Complete" : "Pending"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Payment Status</span>
              <Badge variant={order.paid ? "default" : "destructive"}>
                {order.paid ? "Paid" : "Unpaid"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Items</span>
              <span className="font-semibold">{totalItems}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Amount</span>
              <span className="text-lg font-bold text-green-600">₹{order.pricepaid.toLocaleString()}</span>
            </div>
            {order.paymentid && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Payment ID</span>
                <span className="font-mono text-sm">{order.paymentid}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.user.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{order.user.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p>{order.user.Address}</p>
                  <p className="text-sm text-muted-foreground">PIN: {order.user.pincode}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Ordered Products</CardTitle>
          <CardDescription>
            {order.orderItems.length} product(s) in this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.orderItems.map((item: any, index: number) => (
              <div key={item.id}>
                <div className="flex items-center gap-4 p-4 rounded-lg border">
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                    {item.product.irul ? (
                      <Image
                        src={item.product.irul}
                        alt={item.product.pname}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      unoptimized />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{item.product.pname}</h3>
                    <p className="text-sm text-muted-foreground">Brand: {item.product.brand}</p>
                    <p className="text-sm text-muted-foreground">Category: {item.product.category}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: item.product.color }}
                        />
                        <span className="text-sm">{item.product.color}</span>
                      </div>
                      <span className="text-sm">Weight: {item.product.y_weight}</span>
                    </div>
                  </div>

                  {/* Quantity and Price */}
                  <div className="text-right">
                    <div className="text-lg font-semibold">₹{item.product.price.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                    <div className="text-sm font-medium">
                      Total: ₹{(item.product.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                </div>
                {index < order.orderItems.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>

          {/* Order Total */}
          <Separator className="my-6" />
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Order Total</span>
            <span className="text-green-600">₹{order.pricepaid.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Order Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Order Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium">Order Placed</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {order.paid && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Payment Received</p>
                  <p className="text-sm text-muted-foreground">Payment ID: {order.paymentid}</p>
                </div>
              </div>
            )}
            {order.complete && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Order Completed</p>
                  <p className="text-sm text-muted-foreground">Order has been fulfilled</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}