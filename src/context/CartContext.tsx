"use client";

import { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { Product, products as allProducts } from "@/data/products";
import { BootAddons, GiftDetails, addonsKey, addonsSurcharge, giftKey, takesAddons } from "@/lib/bootAddons";

export interface CartItem {
  /** Stable line identity: stockNo + size + add-ons + gift details. */
  lineId: string;
  product: Product;
  size: string;
  addons?: BootAddons;
  /** Optional personalisation for gift cards. */
  gift?: GiftDetails;
  qty: number;
}

/** Unit price including any paid add-ons (speedhooks / toe bumpers). */
export function itemUnitPrice(item: CartItem): number {
  return item.product.price + addonsSurcharge(item.addons);
}

function makeLineId(stockNo: string, size: string, addons?: BootAddons, gift?: GiftDetails): string {
  return `${stockNo}__${size}__${addonsKey(addons)}__${giftKey(gift)}`;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD"; product: Product; size: string; addons?: BootAddons; gift?: GiftDetails }
  | { type: "REMOVE"; lineId: string }
  | { type: "INCREMENT"; lineId: string }
  | { type: "DECREMENT"; lineId: string }
  | { type: "SET_ADDONS"; lineId: string; addons: BootAddons }
  | { type: "CLEAR" }
  | { type: "LOAD"; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "LOAD":
      return { items: action.items };
    case "ADD": {
      // Only boots carry add-ons; apparel ignores them. Gift details ride on gift-card lines only.
      const addons = takesAddons(action.product.category) ? action.addons : undefined;
      const gift = action.product.category === "Gift Cards" ? action.gift : undefined;
      const lineId = makeLineId(action.product.stockNo, action.size, addons, gift);
      if (state.items.some((i) => i.lineId === lineId)) {
        return { items: state.items.map((i) => (i.lineId === lineId ? { ...i, qty: i.qty + 1 } : i)) };
      }
      return { items: [...state.items, { lineId, product: action.product, size: action.size, addons, gift, qty: 1 }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.lineId !== action.lineId) };
    case "INCREMENT":
      return { items: state.items.map((i) => (i.lineId === action.lineId ? { ...i, qty: i.qty + 1 } : i)) };
    case "DECREMENT":
      return {
        items: state.items
          .map((i) => (i.lineId === action.lineId ? { ...i, qty: i.qty - 1 } : i))
          .filter((i) => i.qty > 0),
      };
    case "SET_ADDONS": {
      const target = state.items.find((i) => i.lineId === action.lineId);
      if (!target) return state;
      const newLineId = makeLineId(target.product.stockNo, target.size, action.addons);
      if (newLineId === action.lineId) return state;
      // If a line with the new config already exists, fold this line's qty into it.
      const dupe = state.items.find((i) => i.lineId === newLineId);
      if (dupe) {
        return {
          items: state.items
            .filter((i) => i.lineId !== action.lineId)
            .map((i) => (i.lineId === newLineId ? { ...i, qty: i.qty + target.qty } : i)),
        };
      }
      return {
        items: state.items.map((i) =>
          i.lineId === action.lineId ? { ...i, lineId: newLineId, addons: action.addons } : i
        ),
      };
    }
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

const STORAGE_KEY = "lf_cart";

// Persist only stockNo+size+addons+qty, rehydrate full Product from catalog
type PersistedItem = { stockNo: string; size: string; qty: number; addons?: BootAddons; gift?: GiftDetails };

function save(items: CartItem[]) {
  try {
    const slim: PersistedItem[] = items.map((i) => ({ stockNo: i.product.stockNo, size: i.size, qty: i.qty, addons: i.addons, gift: i.gift }));
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
      const addons = takesAddons(product.category) ? i.addons : undefined;
      const gift = product.category === "Gift Cards" ? i.gift : undefined;
      return [{ lineId: makeLineId(i.stockNo, i.size, addons, gift), product, size: i.size, addons, gift, qty: i.qty }];
    });
  } catch {
    return [];
  }
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, size: string, addons?: BootAddons, gift?: GiftDetails) => void;
  removeItem: (lineId: string) => void;
  increment: (lineId: string) => void;
  decrement: (lineId: string) => void;
  setAddons: (lineId: string, addons: BootAddons) => void;
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
  const subtotal = state.items.reduce((s, i) => s + itemUnitPrice(i) * i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        itemCount,
        subtotal,
        addItem: (product, size, addons, gift) => dispatch({ type: "ADD", product, size, addons, gift }),
        removeItem: (lineId) => dispatch({ type: "REMOVE", lineId }),
        increment: (lineId) => dispatch({ type: "INCREMENT", lineId }),
        decrement: (lineId) => dispatch({ type: "DECREMENT", lineId }),
        setAddons: (lineId, addons) => dispatch({ type: "SET_ADDONS", lineId, addons }),
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
