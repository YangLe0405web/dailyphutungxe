import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Part, CartItem } from '../data/mockData';

interface CartCtx {
  items: CartItem[];
  total: number;
  count: number;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  isSelected: (id: string) => boolean;
  selectedTotal: number;
  selectedCount: number;
  selectedItems: CartItem[];
  add: (part: Part) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartCtx>({
  items: [],
  total: 0,
  count: 0,
  selectedIds: new Set(),
  toggleSelect: () => {},
  selectAll: () => {},
  deselectAll: () => {},
  isSelected: () => true,
  selectedTotal: 0,
  selectedCount: 0,
  selectedItems: [],
  add: () => {},
  remove: () => {},
  updateQty: () => {},
  clear: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const add = useCallback((part: Part) => {
    setItems(prev => {
      const existing = prev.find(i => i.part.id === part.id);
      if (existing) return prev.map(i => i.part.id === part.id ? { ...i, soLuong: i.soLuong + 1 } : i);
      return [...prev, { part, soLuong: 1 }];
    });
    // Automatically select newly added items
    setSelectedIds(prev => new Set(prev).add(part.id));
  }, []);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.part.id !== id));
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => i.part.id === id ? { ...i, soLuong: qty } : i));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(i => i.part.id)));
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const total = items.reduce((s, i) => s + (i.part.giaKhuyenMai ?? i.part.giaGoc) * i.soLuong, 0);
  const count = items.reduce((s, i) => s + i.soLuong, 0);

  const selectedItems = useMemo(() => {
    return items.filter(i => selectedIds.has(i.part.id));
  }, [items, selectedIds]);

  const selectedTotal = useMemo(() => {
    return selectedItems.reduce((s, i) => s + (i.part.giaKhuyenMai ?? i.part.giaGoc) * i.soLuong, 0);
  }, [selectedItems]);

  const selectedCount = useMemo(() => {
    return selectedItems.reduce((s, i) => s + i.soLuong, 0);
  }, [selectedItems]);

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        count,
        selectedIds,
        toggleSelect,
        selectAll,
        deselectAll,
        isSelected,
        selectedTotal,
        selectedCount,
        selectedItems,
        add,
        remove,
        updateQty,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
