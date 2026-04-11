import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware'
import { UnifiedCartItem } from "@/app/types/products";

export interface CartItem {
  item: UnifiedCartItem;
  qty: number;
}

interface CartState {
  cartItems: CartItem[];
  AddProduct: (item: CartItem) => void;
  RemoveProduct: (id: string) => void;
  ClearBasket: () => void;
  getTotalPrice: () => number;
  getBasketCount: () => number;
  getItemQuantity: (id: string) => number;
  SetItemQuantity: (id: string, qty: number) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  isStockAvailable: (id: string, requestedQty: number) => boolean;
}

const ProductCart = create<CartState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      
      AddProduct: (newItem: CartItem) => set((state) => {
        const cartItems = [...state.cartItems];
        const existingItemIndex = cartItems.findIndex(
          (cartItem) => cartItem.item.id === newItem.item.id
        );

        // If item exists in cart
        if (existingItemIndex !== -1) {
          const existingItem = cartItems[existingItemIndex];
          const totalQty = existingItem.qty + newItem.qty;

          if (totalQty > newItem.item.stock) {
            // Don't add if it exceeds stock
            return { cartItems };
          }

          // Update quantity safely
          cartItems[existingItemIndex] = {
            ...existingItem,
            qty: totalQty,
          };

          return { cartItems };
        }

        // If item not in cart, just ensure qty is <= stock
        if (newItem.qty > newItem.item.stock) {
          return { cartItems };
        }

        return { cartItems: [...cartItems, newItem] };
      }),
      
      RemoveProduct: (id: string) => set((state) => ({
        cartItems: state.cartItems.filter(cartItem => cartItem.item.id !== id)
      })),
      
      ClearBasket: () => set({ cartItems: [] }),
      
      getTotalPrice: () => {
        const { cartItems } = get();
        return cartItems.reduce((total, cartItem) => {
          return total + (cartItem.item.discountedPrice * cartItem.qty);
        }, 0);
      },
      
      getBasketCount: () => {
        const { cartItems } = get();
        return cartItems.reduce((total, cartItem) => total + cartItem.qty, 0);
      },
      
      getItemQuantity: (id: string) => {
        const { cartItems } = get();
        const item = cartItems.find(cartItem => cartItem.item.id === id);
        return item ? item.qty : 0;
      },
      
      // Improved SetItemQuantity with stock validation
      SetItemQuantity: (id: string, qty: number) => {
        set((state) => {
          const existingItemIndex = state.cartItems.findIndex(
            (cartItem) => cartItem.item.id === id
          );
          
          if (existingItemIndex >= 0) {
            const item = state.cartItems[existingItemIndex];
            
            // Validate quantity bounds
            if (qty <= 0) {
              // Remove item if quantity is 0 or negative
              return {
                cartItems: state.cartItems.filter(cartItem => cartItem.item.id !== id)
              };
            }
            
            // Check stock availability
            if (qty > item.item.stock) {
              // Don't update if exceeds stock
              return { cartItems: state.cartItems };
            }
            
            // Create a new array to ensure immutability
            const updatedItems = [...state.cartItems];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              qty: qty,
            };
            return { cartItems: updatedItems };
          }
          
          // If item not found, do nothing
          return { cartItems: state.cartItems };
        });
      },
      
      // New helper methods
      incrementQuantity: (id: string) => {
        const { getItemQuantity, SetItemQuantity } = get();
        const currentQty = getItemQuantity(id);
        SetItemQuantity(id, currentQty + 1);
      },
      
      decrementQuantity: (id: string) => {
        const { getItemQuantity, SetItemQuantity } = get();
        const currentQty = getItemQuantity(id);
        if (currentQty > 1) {
          SetItemQuantity(id, currentQty - 1);
        }
      },
      
      isStockAvailable: (id: string, requestedQty: number) => {
        const { cartItems } = get();
        const item = cartItems.find(cartItem => cartItem.item.id === id);
        return item ? requestedQty <= item.item.stock : false;
      },
    }),
    {
      name: "Cart",
      storage: createJSONStorage(() => localStorage)
    }
  )
);

// Utility function for stock checking (improved)
export function CheckStockCount(cartItem: CartItem, qty: number): boolean {
  return qty > 0 && qty <= cartItem.item.stock;
}

export default ProductCart;