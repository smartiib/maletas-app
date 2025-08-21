
import React, { createContext, useContext } from 'react';

export type CartItem = {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  sku?: string | null;
  productId?: string | number;
  variationId?: number;
  // ... add other fields as needed
};

type CartContextValue = {
  addItemToCart: (item: CartItem) => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

// Simple localStorage-backed add to cart for compatibility
function addItemLocal(item: CartItem) {
  try {
    const key = 'cart';
    const existing = JSON.parse(localStorage.getItem(key) || '[]') as CartItem[];
    existing.push(item);
    localStorage.setItem(key, JSON.stringify(existing));
    console.log('[CartContext] Item added to cart:', item);
  } catch (e) {
    console.warn('[CartContext] Failed to persist cart item:', e);
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value: CartContextValue = {
    addItemToCart: addItemLocal,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Hook works with or without provider (falls back to local implementation)
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (ctx) return ctx;
  return { addItemToCart: addItemLocal };
}
