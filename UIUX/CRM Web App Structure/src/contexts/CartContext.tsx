import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Part, CartItem } from '../data/mockData';

interface CartCtx {
  items: CartItem[];
  total: number;
  count: number;
  add: (part: Part) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartCtx>({
  items: [], total: 0, count: 0,
  add: () => {}, remove: () => {}, updateQty: () => {}, clear: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = useCallback((part: Part) => {
    setItems(prev => {
      const existing = prev.find(i => i.part.id === part.id);
      if (existing) return prev.map(i => i.part.id === part.id ? { ...i, soLuong: i.soLuong + 1 } : i);
      return [...prev, { part, soLuong: 1 }];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.part.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => i.part.id === id ? { ...i, soLuong: qty } : i));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = items.reduce((s, i) => s + (i.part.giaKhuyenMai ?? i.part.giaGoc) * i.soLuong, 0);
  const count = items.reduce((s, i) => s + i.soLuong, 0);

  return (
    <CartContext.Provider value={{ items, total, count, add, remove, updateQty, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
