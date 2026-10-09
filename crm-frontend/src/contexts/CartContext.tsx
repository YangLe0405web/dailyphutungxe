import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Part, CartItem } from '../data/mockData';
import { partApi } from '../services/api';

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
  add: (part: Part, qty?: number) => boolean;
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
  add: () => false,
  remove: () => {},
  updateQty: () => {},
  clear: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const add = useCallback((part: Part, qty = 1): boolean => {
    // 1. Kiểm tra tồn kho khả dụng mới nhất từ partApi
    const freshParts = partApi.getAllSync();
    const currentPart = freshParts.find(p => p.id === part.id) || part;
    const maxStock = currentPart.soLuongTon;

    if (maxStock <= 0) {
      alert(`⚠️ Sản phẩm "${currentPart.tenSanPham}" hiện đã HẾT HÀNG (Tồn kho = 0)! Không thể thêm vào giỏ.`);
      return false;
    }

    let success = true;
    setItems(prev => {
      const existing = prev.find(i => i.part.id === part.id);
      if (existing) {
        const nextQty = existing.soLuong + qty;
        if (nextQty > maxStock) {
          alert(`⚠️ Rất tiếc! Sản phẩm "${currentPart.tenSanPham}" chỉ còn ${maxStock} cái trong kho (Bạn đã có ${existing.soLuong} cái trong giỏ).`);
          success = false;
          return prev;
        }
        return prev.map(i => i.part.id === part.id ? { ...i, soLuong: nextQty, part: currentPart } : i);
      } else {
        if (qty > maxStock) {
          alert(`⚠️ Rất tiếc! Bạn chỉ có thể chọn tối đa ${maxStock} cái do tồn kho chỉ còn ${maxStock}.`);
          success = false;
          return [...prev, { part: currentPart, soLuong: maxStock }];
        }
        return [...prev, { part: currentPart, soLuong: qty }];
      }
    });

    if (success) {
      setSelectedIds(prev => new Set(prev).add(part.id));
    }
    return success;
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
    const freshParts = partApi.getAllSync();
    setItems(prev => prev.map(i => {
      if (i.part.id === id) {
        const currentPart = freshParts.find(p => p.id === id) || i.part;
        const maxStock = currentPart.soLuongTon;
        if (maxStock <= 0) {
          alert(`⚠️ Sản phẩm "${currentPart.tenSanPham}" hiện đã HẾT HÀNG!`);
          return { ...i, soLuong: 1, part: currentPart };
        }
        if (qty > maxStock) {
          alert(`⚠️ Số lượng tối đa có thể chọn là ${maxStock} cái do tồn kho có hạn!`);
          return { ...i, soLuong: maxStock, part: currentPart };
        }
        return { ...i, soLuong: qty, part: currentPart };
      }
      return i;
    }));
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
