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
        <Loader2 className="size-24 animate-spin text-gray-400" />
      </div>
    )
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold mb-2 text-gray-700">Your cart is empty</h2>
        <p className="text-gray-500 mb-4">Add some items to get started!</p>
        <Button 
          onClick={() => router.push("/products")} // Assuming you have a products page
          variant="outline"
        >
          Continue Shopping
        </Button>
      </div>
    )
  }

  // Cart with items
  return (
    <div className="space-y-4 p-4">
      {/* Cart Items */}
      <div className="space-y-4">
        {cartItems.map((item) => (
          <CartCard prop={item} key={item.item.id} />
        ))}
      </div>
      
      {/* Cart Summary */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              Total: {fcurrency(getTotalPrice())}
            </h1>
            <p className="text-sm text-gray-600">
              {getBasketCount()} item{getBasketCount() !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleCheckout}
            className="flex-1"
            size="lg"
          >
            Go to Checkout - {fcurrency(getTotalPrice())}
          </Button>
          
          <Button 
            onClick={ClearBasket}
            variant="outline"
            size="lg"
          >
            Clear Cart
          </Button>
        </div>
      </div>
    </div>
  )
}