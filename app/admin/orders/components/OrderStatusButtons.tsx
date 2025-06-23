// app/(admin)/orders/_components/OrderStatusButtons.tsx
"use client"

import { Button } from "@/components/ui/button"
import { updateOrderStatus, updatePaymentStatus} from "../_actions/order"
import { useTransition } from "react"
import { toast } from "sonner" // or your preferred toast library

interface OrderStatusButtonsProps {
  orderId: string
  currentComplete: boolean
  currentPaid: boolean
}

export function OrderStatusButtons({ 
  orderId, 
  currentComplete, 
  currentPaid 
}: OrderStatusButtonsProps) {
  const [isPending, startTransition] = useTransition()

  const handleOrderStatusChange = () => {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, !currentComplete)
      if (result.success) {
        toast.success(`Order marked as ${!currentComplete ? 'complete' : 'pending'}`)
      } else {
        toast.error("Failed to update order status")
      }
    })
  }

  const handlePaymentStatusChange = () => {
    startTransition(async () => {
      const result = await updatePaymentStatus(orderId, !currentPaid)
      if (result.success) {
        toast.success(`Payment marked as ${!currentPaid ? 'paid' : 'unpaid'}`)
      } else {
        toast.error("Failed to update payment status")
      }
    })
  }

  return (
    <div className="flex gap-2">
      <Button
        variant={currentComplete ? "destructive" : "default"}
        onClick={handleOrderStatusChange}
        disabled={isPending}
      >
        Mark as {currentComplete ? "Pending" : "Complete"}
      </Button>
      <Button
        variant={currentPaid ? "outline" : "default"}
        onClick={handlePaymentStatusChange}
        disabled={isPending}
      >
        Mark as {currentPaid ? "Unpaid" : "Paid"}
      </Button>
    </div>
  )
}