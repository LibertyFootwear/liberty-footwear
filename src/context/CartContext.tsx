"use client";

import { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { Product, products as allProducts } from "@/data/products";

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
  | { type: "CLEAR" }
  | { type: "LOAD"; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "LOAD":
      return { items: action.items };
    case "ADD": {
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

const STORAGE_KEY = "lf_cart";

// Persist only stockNo+size+qty, rehydrate full Product from catalog
type PersistedItem = { stockNo: string; size: string; qty: number };

function save(items: CartItem[]) {
  try {
    const slim: PersistedItem[] = items.map((i) => ({ stockNo: i.product.stockNo, size: i.size, qty: i.qty }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  } catch {}
}

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const slim: PersistedItem[] = JSON.parse(raw);
    return slim.flatMap((i) => {
      const product = allProducts.find((p) => p.stockNo === i.stockNo);
      if (!product) return [];
      return [{ product, size: i.size, qty: i.qty }];
    });
  } catch {
    return [];
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

  // Load from localStorage on mount
  useEffect(() => {
    const saved = load();
    if (saved.length > 0) dispatch({ type: "LOAD", items: saved });
  }, []);

  // Save to localStorage on every change
  useEffect(() => {
    save(state.items);
  }, [state.items]);

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
