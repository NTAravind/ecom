'use client'

import ProductCart from "@/app/store/store"
import CartCard from "./cartCard"
import { fcurrency } from "@/utils/utils"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function Cart() {
  const router = useRouter()
  const { cartItems, ClearBasket, getTotalPrice, getBasketCount } = ProductCart()
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Ensure client-side hydration is complete
  useEffect(() => {
    setIsClient(true)
    // Add a small delay to ensure store is fully hydrated
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  // Force re-render when cart items change
  useEffect(() => {
    if (isClient) {
      console.log('Cart items updated:', cartItems)
      console.log('Cart count:', getBasketCount())
    }
  }, [cartItems, getBasketCount, isClient])

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!")
      return 
    }
    router.push("/checkout") 
  }

  // Show loading during hydration
  if (!isClient || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ) 
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-600">Add some items to get started!</p>
        </div>
        
        <Button
          onClick={() => router.push("/products")}
          variant="outline"
          className="w-full sm:w-auto h-12 px-6"
        >
          Continue Shopping
        </Button>
      </div>
    ) 
  }

  // Cart with items
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl scroll-smooth">
      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        {cartItems.map((item, index) => (
          <CartCard 
            prop={item} 
            key={`${item.item.id}-${index}-${item.qty}`} // More unique key
          />
        ))}
      </div>

      {/* Cart Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-semibold">
            Total: {fcurrency(getTotalPrice())}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {getBasketCount()} item{getBasketCount() !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleCheckout}
          className="w-full h-12 px-6"
        >
          <span className="block sm:hidden">
            Go to Checkout - {fcurrency(getTotalPrice())}
          </span>
          <span className="hidden sm:block">
            Checkout - {fcurrency(getTotalPrice())}
          </span>
        </Button>
        <Button
          onClick={ClearBasket}
          variant="outline"
          className="w-full h-12 px-6"
        >
          Clear Cart
        </Button>
      </div>
    </div>
  )
}