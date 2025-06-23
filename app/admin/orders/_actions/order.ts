// app/(admin)/orders/_actions/orders.ts
"use server"

import prisma  from "@/lib/prisma" // Adjust the import path to your Prisma instance
import { revalidatePath } from "next/cache"

export async function getOrderWithDetails(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { 
        id: orderId 
      },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })

    return order
  } catch (error) {
    console.error("Error fetching order details:", error)
    return null
  }
}

export async function updateOrderStatus(orderId: string, complete: boolean) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { complete }
    })
    
    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath('/admin/orders')
    
    return { success: true }
  } catch (error) {
    console.error("Error updating order status:", error)
    return { success: false, error: "Failed to update order status" }
  }
}

export async function updatePaymentStatus(orderId: string, paid: boolean) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { paid }
    })
    
    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath('/admin/orders')
    
    return { success: true }
  } catch (error) {
    console.error("Error updating payment status:", error)
    return { success: false, error: "Failed to update payment status" }
  }
}