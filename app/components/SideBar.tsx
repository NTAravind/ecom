"use client"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ShoppingCart } from "lucide-react"
import Cart from "../(Customerside)/cart/cart"

export default function CartSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="p-2 rounded-full hover:bg-gray-200">
          <ShoppingCart className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <Cart/>
        </div>
      </SheetContent>
    </Sheet>
  )
}