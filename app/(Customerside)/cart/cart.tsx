'use client'
import ProductCart from   "@/app/store/store"
import CartCard from "./cartCard"
import { fcurrency } from "@/utils/utils"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function Cart() {
  const router = useRouter()
  const { cartItems, ClearBasket, getTotalPrice, getBasketCount } = ProductCart()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, []) // Add empty dependency array

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!")
      return
    }
    router.push("/checkout")
  }

  // Loading state
  if (!loaded) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 className="size-16 sm:size-24 animate-spin text-gray-400" />
      </div>
    )
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-700">Your cart is empty</h2>
        <p className="text-gray-500 mb-4">Add some items to get started!</p>
        <Button 
          onClick={() => router.push("/products")} // Assuming you have a products page
          variant="outline"
          className="w-full sm:w-auto"
        >
          Continue Shopping
        </Button>
      </div>
    )
  }

  // Cart with items
  return (
    <div className="space-y-4 p-2 sm:p-4">
      {/* Cart Items */}
      <div className="space-y-3 sm:space-y-4">
        {cartItems.map((item) => (
          <CartCard prop={item} key={item.item.id} />
        ))}
      </div>
      
      {/* Cart Summary */}
      <div className="border-t pt-4 bg-white rounded-lg p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold">
              Total: {fcurrency(getTotalPrice())}
            </h1>
            <p className="text-sm text-gray-600">
              {getBasketCount()} item{getBasketCount() !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleCheckout}
            className="flex-1 w-full sm:w-auto"
            size="lg"
          >
            <span className="hidden sm:inline">Go to Checkout - {fcurrency(getTotalPrice())}</span>
            <span className="sm:hidden">Checkout - {fcurrency(getTotalPrice())}</span>
          </Button>
          
          <Button 
            onClick={ClearBasket}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            Clear Cart
          </Button>
        </div>
      </div>
    </div>
  )
}