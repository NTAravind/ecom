"use client"; // This directive is often needed for client-side components in Next.js

import ProductCart, { CartItem } from "@/app/store/store"; // Using the alias path from your existing CartCard
import Image from "next/image";
import React, { useEffect, useState } from "react"; // Import useState and useEffect
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription} from "@/components/ui/card"; // Added CardDescription, CardFooter for more structure
import { Input } from "@/components/ui/input"; // Import Input for the quantity counter

export default function CartCard({ prop }: { prop: CartItem }) {
  const { RemoveProduct, SetItemQuantity } = ProductCart();

  // Local state to manage the quantity displayed in the input field for THIS specific cart item
  const [quantity, setQuantity] = useState<number>(prop.qty);

  // Effect to synchronize local quantity state with the global cart state
  // This runs on mount and when `prop.item.id` or `prop.qty` changes (e.g., if cart is loaded or updated elsewhere)
  useEffect(() => {
    setQuantity(prop.qty); // Initialize or update with the prop's quantity
  }, [prop.qty]); // Depend on prop.qty to update when the cart item's quantity changes in the store

  // Handle incrementing the quantity
  const handleIncrement = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity); // Update local state
    SetItemQuantity(prop.item.id, newQuantity); // Update cart store
  };

  // Handle decrementing the quantity
  const handleDecrement = () => {
    if (quantity > 1) { // Prevent quantity from going below one via decrement button
      const newQuantity = quantity - 1;
      setQuantity(newQuantity); // Update local state
      SetItemQuantity(prop.item.id, newQuantity); // Update cart store
    } else {
      // If quantity is 1 and user tries to decrement, remove the product
      RemoveProduct(prop.item.id);
    }
  };

  // Handle manual input changes
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const newQuantity = Math.max(0, parseInt(value, 10) || 0); // Ensure non-negative number

    setQuantity(newQuantity); // Update local state
    if (newQuantity === 0) {
      RemoveProduct(prop.item.id); // If manually set to 0, remove item
    } else {
      SetItemQuantity(prop.item.id, newQuantity); // Update cart store
    }
  };

  return (
    <Card className="flex flex-col sm:flex-row gap-4 p-4 items-center sm:items-start max-w-2xl mx-auto border-2 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 m-5">
      {/* Product Image */}
      <div className="flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 relative rounded-lg overflow-hidden border">
        <Image
          src={prop.item.irul}
          alt={prop.item.pname}
          layout="fill" // Use layout="fill" for responsive images
          objectFit="cover"
          className="rounded-lg" // Rounded corners for the image
          unoptimized // If you're handling optimization externally or don't need Next.js Image optimization
        />
      </div>

      {/* Product Details and Controls */}
      <div className="flex flex-col justify-between w-full sm:flex-grow">
        <CardHeader className="p-0 pb-2">
          <h3 className="text-xl font-bold text-gray-800">{prop.item.pname}</h3>
          <CardDescription className="text-base text-gray-600">
            Price: ₹{prop.item.price.toFixed(2)} {/* Format price to 2 decimal places */}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 flex flex-col gap-3 mt-2">
          {/* Quantity Counter */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleDecrement}
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-gray-300 hover:bg-gray-100"
              disabled={quantity <= 0} // Disable if quantity is 0
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              </svg>
              <span className="sr-only">Decrease quantity</span>
            </Button>

            <Input
              type="number"
              value={quantity}
              onChange={handleInputChange}
              min={0}
              className="w-20 text-center text-lg font-medium appearance-none [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              aria-label={`Quantity of ${prop.item.pname}`}
            />

            <Button
              onClick={handleIncrement}
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-gray-300 hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="sr-only">Increase quantity</span>
            </Button>
          </div>

          {/* Remove Button - remains separate for explicit removal */}
          <Button
            variant="destructive"
            size="sm"
            className="mt-3 w-fit rounded-md shadow-sm hover:shadow-md transition-shadow"
            onClick={() => RemoveProduct(prop.item.id)}
          >
            Remove Item
          </Button>
        </CardContent>
      </div>
    </Card>
  );
}
