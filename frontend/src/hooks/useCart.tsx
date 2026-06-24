'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { MAX_PER_ORDER } from '@/lib/constants';

export interface CartItem {
  /** New spec field — same value as id */
  productId: string;
  /** Backward-compat alias for productId */
  id: string;
  title: string;
  /** Price in cents (new spec) */
  price_cents: number;
  /** Price in dollars (backward-compat for CartDrawer) */
  price: number;
  image: string;
  slug: string;
  sku: string;
  quantity: number;
  /** Optional backward-compat fields used by CartDrawer */
  category?: string;
  make?: string;
  model?: string;
  /** Per-product cap on quantity per order. Falls back to global MAX_PER_ORDER. */
  maxPerOrder?: number;
}

interface UseCartReturn {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'id' | 'price'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  /** Total in cents */
  total: number;
  /** Alias for total — backward compat */
  subtotal: number;
  itemCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isInCart: (productId: string) => boolean;
}

const CART_STORAGE_KEY = 'jdm_cart';

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CartContext = createContext<UseCartReturn | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveCart(items);
    }
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity' | 'id' | 'price'>, qty = 1) => {
      setItems((prev) => {
        const cap = Math.max(1, item.maxPerOrder ?? MAX_PER_ORDER);
        const existing = prev.find((i) => i.productId === item.productId);
        if (existing) {
          if (existing.quantity >= cap) return prev;
          return prev.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: Math.min(existing.quantity + qty, cap), maxPerOrder: cap }
              : i,
          );
        }
        const newItem: CartItem = {
          ...item,
          id: item.productId,
          price: item.price_cents / 100,
          quantity: Math.min(qty, cap),
          maxPerOrder: cap,
        };
        return [...prev, newItem];
      });
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) =>
      prev.filter((i) => i.productId !== productId && i.id !== productId),
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) =>
        prev.filter((i) => i.productId !== productId && i.id !== productId),
      );
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId !== productId && i.id !== productId) return i;
        const cap = Math.max(1, i.maxPerOrder ?? MAX_PER_ORDER);
        return { ...i, quantity: Math.min(quantity, cap) };
      }),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback(
    (productId: string) =>
      items.some((i) => i.productId === productId || i.id === productId),
    [items],
  );

  const total = items.reduce(
    (sum, item) => sum + item.price_cents * item.quantity,
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const value: UseCartReturn = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    subtotal: total,
    itemCount,
    isOpen,
    setIsOpen,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): UseCartReturn {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
