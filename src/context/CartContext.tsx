"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import { Product } from "@/data/products";

export interface CartItem {
  product: Product;
  size: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD"; product: Product; size: string }
  | { type: "REMOVE"; stockNo: string; size: string }
  | { type: "INCREMENT"; stockNo: string; size: string }
  | { type: "DECREMENT"; stockNo: string; size: string }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const key = `${action.product.stockNo}-${action.size}`;
      const existing = state.items.find(
        (i) => i.product.stockNo === action.product.stockNo && i.size === action.size
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.stockNo === action.product.stockNo && i.size === action.size
              ? { ...i, qty: i.qty + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { product: action.product, size: action.size, qty: 1 }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => !(i.product.stockNo === action.stockNo && i.size === action.size)) };
    case "INCREMENT":
      return {
        items: state.items.map((i) =>
          i.product.stockNo === action.stockNo && i.size === action.size ? { ...i, qty: i.qty + 1 } : i
        ),
      };
    case "DECREMENT":
      return {
        items: state.items
          .map((i) =>
            i.product.stockNo === action.stockNo && i.size === action.size ? { ...i, qty: i.qty - 1 } : i
          )
          .filter((i) => i.qty > 0),
      };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, size: string) => void;
  removeItem: (stockNo: string, size: string) => void;
  increment: (stockNo: string, size: string) => void;
  decrement: (stockNo: string, size: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const itemCount = state.items.reduce((s, i) => s + i.qty, 0);
  const subtotal = state.items.reduce((s, i) => s + i.product.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        itemCount,
        subtotal,
        addItem: (product, size) => dispatch({ type: "ADD", product, size }),
        removeItem: (stockNo, size) => dispatch({ type: "REMOVE", stockNo, size }),
        increment: (stockNo, size) => dispatch({ type: "INCREMENT", stockNo, size }),
        decrement: (stockNo, size) => dispatch({ type: "DECREMENT", stockNo, size }),
        clear: () => dispatch({ type: "CLEAR" }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
