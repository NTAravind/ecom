import { Product } from "../generated/prisma";
import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  item: Product;
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
}

const ProductCart = create<CartState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      
      AddProduct: (newItem: CartItem) => set((state) => {
        const existingItemIndex = state.cartItems.findIndex(
          cartItem => cartItem.item.id === newItem.item.id
        );
        
        if (existingItemIndex >= 0) {
          // Item exists, update quantity
          const updatedItems = [...state.cartItems];
          updatedItems[existingItemIndex].qty += newItem.qty;
          return { cartItems: updatedItems };
        } else {
          // Item doesn't exist, add new item
          return { cartItems: [...state.cartItems, newItem] };
        }
      }),
      
      RemoveProduct: (id: string) => set((state) => ({
        cartItems: state.cartItems.filter(cartItem => cartItem.item.id !== id)
      })),
      
      ClearBasket: () => set({ cartItems: [] }),
      
      getTotalPrice: () => {
        const { cartItems } = get();
        return cartItems.reduce((total, cartItem) => {
          return total + (cartItem.item.price * cartItem.qty);
        }, 0);
      },
      
      getBasketCount: () => {
        const { cartItems } = get();
        return cartItems.reduce((total, cartItem) => total + cartItem.qty, 0);
      },
      getItemQuantity: (id:string)=>{
        const {cartItems} = get();
        const item = cartItems.find(cartiem => cartiem.item.id == id)
        return item ? item.qty : 0;
      },
   
      SetItemQuantity: (id: string, qty: number) => {
        set((state) => {
          const existingItemIndex = state.cartItems.findIndex(
            (cartItem) => cartItem.item.id === id
          );

          if (existingItemIndex >= 0) {
            // Create a new array to ensure immutability
            const updatedItems = [...state.cartItems];
            // Create a new item object to update the quantity
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              qty: qty,
            };
            return { cartItems: updatedItems };
          }
          // If item not found, you might want to handle it (e.g., do nothing, or add it with the new quantity)
          // For now, if not found, we do nothing.
          return { cartItems: state.cartItems };
        });
      },

    }
  
  
  ),
  {
      name: "Cart",
      storage: createJSONStorage(() => localStorage)
    }
  )
);

export default ProductCart;