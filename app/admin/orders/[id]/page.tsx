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
import { decodeAddress } from "@/utils/address"

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
    <MarkToComplete prop={{id,phone:order.user.phone}}/>
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
             <div className="flex justify-between items-center">
    <span className="text-sm font-medium">Mode of Delivery</span>
    <span className="font-semibold">
      {order.delivered ? "Delivery" : "In-store Checkout"}
    </span>
  </div>
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
                  {(() => {
                    const addr = decodeAddress(order.user.Address);
                    return (
                      <>
                        <p>{addr.street || order.user.Address}</p>
                        {(addr.city || addr.state) && (
                          <p className="text-sm">{[addr.city, addr.state].filter(Boolean).join(', ')} — {order.user.pincode}</p>
                        )}
                        {!addr.city && <p className="text-sm text-muted-foreground">PIN: {order.user.pincode}</p>}
                        {addr.landmark && (
                          <p className="text-xs text-muted-foreground">📍 {addr.landmark}</p>
                        )}
                      </>
                    );
                  })()}
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
            {order.orderItems.map((item: any, index: number) => {
              const isProduct = !!item.product;
              const itemImage = isProduct ? item.product.irul : item.yarnAccessory?.imageUrl;
              const itemName = isProduct ? item.product.pname : item.yarnAccessory?.name;
              const itemCategory = isProduct ? item.product.category : item.yarnAccessory?.category;
              const itemPrice = isProduct ? item.product.discountedPrice : item.yarnAccessory?.discountedPrice;
              const itemBrand = isProduct ? item.product.brand?.name : null;
              const itemColor = isProduct ? item.product.color : null;
              const itemWeight = isProduct ? item.product.y_weight : null;

              return (
              <div key={item.id}>
                <div className="flex items-center gap-4 p-4 rounded-lg border">
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                    {itemImage ? (
                      <Image
                        src={itemImage}
                        alt={itemName || "Product Image"}
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
                    <h3 className="font-semibold text-lg">{itemName || "Unknown Product"}</h3>
                    {itemBrand && <p className="text-sm text-muted-foreground">Brand: {itemBrand}</p>}
                    <p className="text-sm text-muted-foreground">Category: {itemCategory || "N/A"}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {itemColor && (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: itemColor }}
                        />
                        <span className="text-sm">{itemColor}</span>
                      </div>
                      )}
                      {itemWeight && <span className="text-sm">Weight: {itemWeight}</span>}
                    </div>
                  </div>

                  {/* Quantity and Price */}
                  <div className="text-right">
                    <div className="text-lg font-semibold">₹{(itemPrice || 0).toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                    <div className="text-sm font-medium">
                      Total: ₹{((itemPrice || 0) * item.quantity).toLocaleString()}
                    </div>
                  </div>
                </div>
                {index < order.orderItems.length - 1 && <Separator className="my-2" />}
              </div>
            )})}
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