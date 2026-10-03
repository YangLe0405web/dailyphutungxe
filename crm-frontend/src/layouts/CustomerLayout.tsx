import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../contexts/CartContext';
import { mockCustomers, type Customer } from '../data/mockData';
import { customerApi } from '../services/api';
import { VIETNAM_LOCATIONS } from '../data/vietnamLocations';

type CustomerPage = 'store' | 'vehicles' | 'booking' | 'dashboard' | 'checkout';

interface Props {
  children: React.ReactNode;
  activePage: CustomerPage;
  onNavigate: (p: CustomerPage) => void;
  onHome: () => void;
  currentCustomer?: Customer | null;
  onCustomerChange?: (c: Customer | null) => void;
}

const navItems = [
  { key: 'vehicles', label: 'Xem xe mẫu', icon: <IcoBike /> },
  { key: 'store', label: 'Phụ tùng', icon: <IcoStore /> },
  { key: 'booking', label: 'Đặt lịch', icon: <IcoCalendar /> },
  { key: 'dashboard', label: 'Cá nhân', icon: <IcoUser /> },
] as const;

export default function CustomerLayout({ children, activePage, onNavigate, onHome, currentCustomer = null, onCustomerChange }: Props) {
  const { count, items, total, remove, updateQty, isSelected, toggleSelect, selectAll, deselectAll, selectedCount, selectedTotal, selectedIds } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Customer Notification Center states (TC10)
  const [customerNotifOpen, setCustomerNotifOpen] = useState(false);
  const [customerNotifCat, setCustomerNotifCat] = useState<'all' | 'order' | 'appointment' | 'review' | 'system'>('all');
  const customerNotifTabsRef = useRef<HTMLDivElement>(null);

  const scrollCustomerNotifTabs = (direction: 'left' | 'right') => {
    if (customerNotifTabsRef.current) {
      customerNotifTabsRef.current.scrollBy({
        left: direction === 'left' ? -120 : 120,
        behavior: 'smooth',
      });
    }
  };
  const [customerNotifs, setCustomerNotifs] = useState<{
    id: string;
    category: string;
    icon: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    page: CustomerPage;
  }[]>([
    {
      id: 'cn-1',
      category: 'order',
      icon: '📦',
      title: 'Đơn hàng #DH001 đang vận chuyển',
      message: 'Đơn hàng phụ tùng Nhớt Motul 7100 của bạn đã được bàn giao cho đơn vị vận chuyển hỏa tốc.',
      time: '15 phút trước',
      read: false,
      page: 'dashboard',
    },
    {
      id: 'cn-2',
      category: 'appointment',
      icon: '📅',
      title: 'Nhắc lịch hẹn bảo dưỡng xe',
      message: 'Lịch bảo dưỡng định kỳ xe Honda SH 160i vào 09:00 ngày mai tại showroom 12 Lý Thường Kiệt.',
      time: '1 giờ trước',
      read: false,
      page: 'booking',
    },
    {
      id: 'cn-3',
      category: 'review',
      icon: '⭐',
      title: 'Mời bạn đánh giá dịch vụ & phụ tùng',
      message: 'Bạn vừa hoàn thành bảo dưỡng xe. Đánh giá chất lượng dịch vụ ngay để nhận mã giảm giá 10%!',
      time: '1 ngày trước',
      read: true,
      page: 'store',
    },
    {
      id: 'cn-4',
      category: 'system',
      icon: '🎁',
      title: 'Ưu đãi thành viên mới: Giảm 15% phụ tùng',
      message: 'Mã giảm giá MOTONEW15 đã sẵn sàng trong ví của bạn. Áp dụng cho mọi đơn hàng phụ tùng.',
      time: '2 ngày trước',
      read: true,
      page: 'store',
    },
  ]);

  useEffect(() => {
    const handleOpenLogin = () => {
      setAuthMode('login');
      setAuthOpen(true);
    };
    window.addEventListener('crm-open-login', handleOpenLogin);
    return () => window.removeEventListener('crm-open-login', handleOpenLogin);
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-zinc-50)', fontFamily: 'var(--font-sans)' }}>
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40" style={{ background: 'var(--color-zinc-950)', borderBottom: '2px solid var(--color-red-700)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={onHome} className="flex items-center gap-3 shrink-0" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: 'var(--color-red-700)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17V7l2-2h5l4 6h1a2 2 0 0 1 0 4h-1"/></svg>
            </div>
            <div className="text-left">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'white', lineHeight: 1, letterSpacing: '0.04em' }}>MOTOSHOP</div>
              <div style={{ fontSize: 9, color: 'var(--color-red-500)', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>ĐẠI LÝ CHÍNH HÃNG</div>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const active = activePage === item.key;
              return (
                <button key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 transition-all"
                  style={{
                    background: active ? 'var(--color-red-700)' : 'transparent',
                    color: active ? 'white' : 'var(--color-zinc-400)',
                    border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget.style.color = 'white'); }}
                  onMouseLeave={e => { if (!active) (e.currentTarget.style.color = 'var(--color-zinc-400)'); }}
                >
                  {item.icon}<span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: account auth + cart + mobile menu */}
          <div className="flex items-center gap-2">
            {currentCustomer ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white">
                  {currentCustomer.avatar ? (
                    <img src={currentCustomer.avatar} alt={currentCustomer.hoTen} className="w-5 h-5 rounded-full object-cover shrink-0 border border-zinc-700" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                  <span className="font-bold max-w-[120px] truncate">{currentCustomer.hoTen}</span>
                </div>
                <button
                  onClick={() => onCustomerChange?.(null)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-600 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                  title="Đăng xuất"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setAuthMode('register'); setAuthOpen(true); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-700 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700 transition"
                >
                  Đăng ký
                </button>
                <button
                  onClick={() => { setAuthMode('login'); setAuthOpen(true); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-700 bg-red-700 text-white hover:bg-red-800 shadow transition"
                >
                  Đăng nhập
                </button>
              </div>
            )}

            {/* Trung tâm thông báo (TC10) */}
            <div className="relative">
              <button
                onClick={() => setCustomerNotifOpen(!customerNotifOpen)}
                className="relative flex items-center justify-center rounded-lg p-2 transition-all cursor-pointer bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700"
                title="Trung tâm thông báo"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {customerNotifs.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-red-600 min-w-[17px] h-[17px] px-1 shadow animate-pulse font-mono">
                    {customerNotifs.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Popover Trung tâm thông báo khách hàng */}
              {customerNotifOpen && (
                <div className="absolute right-0 mt-2 w-[90vw] sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-zinc-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-4 pb-2.5 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-zinc-900 uppercase font-mono tracking-wider">
                        🔔 TRUNG TÂM THÔNG BÁO
                      </span>
                      {customerNotifs.filter(n => !n.read).length > 0 && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          {customerNotifs.filter(n => !n.read).length} mới
                        </span>
                      )}
                    </div>
                    {customerNotifs.filter(n => !n.read).length > 0 && (
                      <button
                        onClick={() => setCustomerNotifs(prev => prev.map(n => ({ ...n, read: true })))}
                        className="text-[11px] text-red-700 hover:text-red-800 font-bold transition cursor-pointer"
                      >
                        Đã đọc tất cả
                      </button>
                    )}
                  </div>

                  {/* Category Filter Chips with Horizontal Scroll Navigation */}
                  <div className="relative px-2 py-1.5 border-b border-zinc-100 flex items-center gap-1 bg-zinc-50/50">
                    <button
                      type="button"
                      onClick={() => scrollCustomerNotifTabs('left')}
                      className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 shadow-2xs transition cursor-pointer"
                      title="Cuộn sang trái"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>

                    <div
                      ref={customerNotifTabsRef}
                      className="flex-1 flex items-center gap-1.5 overflow-x-auto scroll-smooth py-1 px-1"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 transparent',
                      }}
                    >
                      {[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'order', label: '📦 Đơn hàng' },
                        { key: 'appointment', label: '📅 Lịch hẹn' },
                        { key: 'review', label: '⭐ Đánh giá' },
                        { key: 'system', label: '🎁 Ưu đãi' },
                      ].map(c => (
                        <button
                          key={c.key}
                          onClick={() => setCustomerNotifCat(c.key as any)}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition shrink-0 cursor-pointer border select-none ${
                            customerNotifCat === c.key
                              ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => scrollCustomerNotifTabs('right')}
                      className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 shadow-2xs transition cursor-pointer"
                      title="Cuộn sang phải"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>

                  {/* List */}
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-100">
                    {customerNotifs
                      .filter(n => customerNotifCat === 'all' || n.category === customerNotifCat)
                      .map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setCustomerNotifs(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                            onNavigate(n.page);
                            setCustomerNotifOpen(false);
                          }}
                          className={`p-3 hover:bg-zinc-50 transition cursor-pointer flex gap-3 ${!n.read ? 'bg-red-50/30' : ''}`}
                        >
                          <span className="text-lg shrink-0 pt-0.5">{n.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-xs truncate ${!n.read ? 'font-extrabold text-zinc-900' : 'font-semibold text-zinc-700'}`}>
                                {n.title}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono shrink-0">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-zinc-600 line-clamp-2 mt-0.5 leading-snug">{n.message}</p>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="px-4 pt-2 border-t border-zinc-100 flex justify-end">
                    <button
                      onClick={() => setCustomerNotifOpen(false)}
                      className="text-xs font-bold text-zinc-700 hover:text-zinc-900 px-3 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cart button */}
            <button onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
              style={{ background: count > 0 ? 'var(--color-red-700)' : 'var(--color-zinc-800)', color: 'white', border: 'none', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span className="text-sm font-600 hidden sm:block">Giỏ hàng</span>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full text-xs font-700"
                  style={{ width: 20, height: 20, background: 'white', color: 'var(--color-red-700)', fontFamily: 'var(--font-mono)' }}>
                  {count}
                </span>
              )}
            </button>

            {/* Mobile menu */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden flex items-center justify-center rounded-lg p-2"
              style={{ background: 'var(--color-zinc-800)', color: 'white', border: 'none', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t" style={{ borderColor: 'var(--color-zinc-800)', background: 'var(--color-zinc-900)' }}>
            {navItems.map(item => (
              <button key={item.key} onClick={() => { onNavigate(item.key); setMobileOpen(false); }}
                className="flex items-center gap-3 w-full px-6 py-3 text-sm font-500 transition-colors"
                style={{ background: activePage === item.key ? 'var(--color-red-900)' : 'transparent', color: activePage === item.key ? 'white' : 'var(--color-zinc-400)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                {item.icon}{item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main>{children}</main>

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1" style={{ background: 'rgba(9,9,11,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setCartOpen(false)} />
          <div className="flex flex-col w-full max-w-md" style={{ background: 'white', boxShadow: '-8px 0 40px rgba(0,0,0,0.2)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--color-zinc-200)', background: 'var(--color-zinc-950)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '0.04em' }}>GIỎ HÀNG</div>
                <div className="text-xs" style={{ color: 'var(--color-zinc-400)', fontFamily: 'var(--font-mono)' }}>
                  {count} sản phẩm · Đã chọn: <strong className="text-amber-400">{selectedCount}</strong>
                </div>
              </div>
              <button onClick={() => setCartOpen(false)} style={{ background: 'var(--color-zinc-800)', border: 'none', color: 'var(--color-zinc-300)', cursor: 'pointer', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>×</button>
            </div>

            {/* Select All Bar (TC09) */}
            {items.length > 0 && (
              <div className="px-5 py-3 bg-zinc-100/90 border-b border-zinc-200 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-800 select-none">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedIds.size === items.length}
                    onChange={(e) => {
                      if (e.target.checked) selectAll();
                      else deselectAll();
                    }}
                    className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                  />
                  <span>Chọn tất cả ({items.length} món)</span>
                </label>
                {selectedCount > 0 && (
                  <button
                    onClick={deselectAll}
                    className="text-[11px] text-zinc-500 hover:text-red-700 transition cursor-pointer"
                  >
                    Bỏ chọn tất cả
                  </button>
                )}
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-zinc-300)" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  <div className="text-center">
                    <div className="font-600" style={{ color: 'var(--color-zinc-700)' }}>Giỏ hàng trống</div>
                    <div className="text-sm mt-1" style={{ color: 'var(--color-zinc-400)' }}>Thêm sản phẩm từ cửa hàng</div>
                  </div>
                  <button onClick={() => { setCartOpen(false); onNavigate('store'); }}
                    className="px-5 py-2.5 rounded-lg text-sm font-600 text-white"
                    style={{ background: 'var(--color-red-700)', border: 'none', cursor: 'pointer' }}>
                    Đến cửa hàng
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {items.map(item => {
                    const price = item.part.giaKhuyenMai ?? item.part.giaGoc;
                    const checked = isSelected(item.part.id);

                    return (
                      <div
                        key={item.part.id}
                        className={`flex items-center gap-3 rounded-2xl p-3 border transition-all ${
                          checked
                            ? 'bg-white border-zinc-300 shadow-2xs'
                            : 'bg-zinc-50/70 border-zinc-200 opacity-60'
                        }`}
                      >
                        {/* TC09 Checkbox for each item */}
                        <div className="shrink-0 flex items-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelect(item.part.id)}
                            className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                          />
                        </div>

                        <img src={item.part.hinhAnh} alt={item.part.tenSanPham}
                          className="rounded-xl object-contain shrink-0 mix-blend-multiply"
                          style={{ width: 60, height: 60, background: 'var(--color-zinc-100)', padding: 4 }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-snug line-clamp-1" style={{ color: 'var(--color-zinc-900)' }}>{item.part.tenSanPham}</div>
                          <div className="text-[10px] mt-0.5 text-zinc-400 font-mono">{item.part.thuongHieu}</div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="font-bold text-red-700 font-mono text-xs">{fmt(price * item.soLuong)}</div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateQty(item.part.id, item.soLuong - 1)}
                                style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--color-zinc-200)', background: 'white', cursor: 'pointer', fontWeight: 700, color: 'var(--color-zinc-700)', fontSize: 12 }}>-</button>
                              <span className="text-xs font-semibold w-5 text-center font-mono">{item.soLuong}</span>
                              <button onClick={() => updateQty(item.part.id, item.soLuong + 1)}
                                style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--color-zinc-200)', background: 'white', cursor: 'pointer', fontWeight: 700, color: 'var(--color-zinc-700)', fontSize: 12 }}>+</button>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => remove(item.part.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-zinc-400)', alignSelf: 'flex-start', padding: 4, fontSize: 16 }}>×</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer (TC09: Chỉ tính tiền các sản phẩm được chọn) */}
            {items.length > 0 && (
              <div className="border-t p-5 bg-zinc-50" style={{ borderColor: 'var(--color-zinc-200)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-zinc-600">Đã chọn mua:</span>
                  <span className="text-xs font-mono font-bold text-zinc-900">{selectedCount} / {count} sản phẩm</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-sm text-zinc-900">Tổng thanh toán:</span>
                  <span className="text-2xl font-extrabold text-red-700 font-mono">{fmt(selectedTotal)}</span>
                </div>
                <button
                  disabled={selectedCount === 0}
                  onClick={() => {
                    setCartOpen(false);
                    onNavigate('checkout');
                  }}
                  className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md ${
                    selectedCount === 0
                      ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed shadow-none'
                      : 'bg-red-700 hover:bg-red-800 text-white cursor-pointer shadow-red-700/20'
                  }`}
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
                >
                  {selectedCount === 0 ? 'VUI LÒNG CHỌN SẢN PHẨM' : `THANH TOÁN (${selectedCount}) →`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {authOpen && (
        <CustomerAuthModal
          initialMode={authMode}
          onClose={() => setAuthOpen(false)}
          onSuccess={(c) => onCustomerChange?.(c)}
        />
      )}
    </div>
  );
}

function CustomerAuthModal({
  initialMode,
  onClose,
  onSuccess,
}: {
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
}) {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [loginInput, setLoginInput] = useState('nguyenvanan@gmail.com');
  const [loginPass, setLoginPass] = useState('123456');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginErr, setLoginErr] = useState<string | null>(null);

  // State cho chức năng Quên mật khẩu (ĐN02)
  const [forgotStep, setForgotStep] = useState<'check' | 'otp' | 'new_password'>('check');
  const [forgotInput, setForgotInput] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotUserOtp, setForgotUserOtp] = useState('');
  const [forgotTimer, setForgotTimer] = useState(120);
  const [forgotErr, setForgotErr] = useState<string | null>(null);
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmNewPass, setShowConfirmNewPass] = useState(false);

  // Form đăng ký
  const [form, setForm] = useState({
    hoTen: '',
    email: '',
    soDienThoai: '',
    ngaySinh: '2000-01-01',
    gioiTinh: 'Nam',
    province: VIETNAM_LOCATIONS[0].name,
    district: VIETNAM_LOCATIONS[0].districts[0].name,
    ward: VIETNAM_LOCATIONS[0].districts[0].wards[0],
    streetAddress: '',
    matKhau: '',
    xacNhanMatKhau: '',
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [registerErr, setRegisterErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Bước đăng ký: 'form' hoặc 'otp' (ĐK05)
  const [regStep, setRegStep] = useState<'form' | 'otp'>('form');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [userOtp, setUserOtp] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState<number>(120);
  const [otpErr, setOtpErr] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Timer cho OTP đăng ký
  useEffect(() => {
    let interval: any = null;
    if (regStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [regStep, otpTimer]);

  // Timer cho OTP Quên mật khẩu (ĐN02)
  useEffect(() => {
    let interval: any = null;
    if (activeTab === 'forgot' && forgotStep === 'otp' && forgotTimer > 0) {
      interval = setInterval(() => {
        setForgotTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTab, forgotStep, forgotTimer]);

  // Danh sách Quận/Huyện theo Tỉnh/TP đã chọn (ĐK03)
  const currentProvinceObj = VIETNAM_LOCATIONS.find(p => p.name === form.province) || VIETNAM_LOCATIONS[0];
  const availableDistricts = currentProvinceObj.districts;
  const currentDistrictObj = availableDistricts.find(d => d.name === form.district) || availableDistricts[0];
  const availableWards = currentDistrictObj ? currentDistrictObj.wards : [];

  const handleProvinceChange = (provinceName: string) => {
    const prov = VIETNAM_LOCATIONS.find(p => p.name === provinceName) || VIETNAM_LOCATIONS[0];
    const firstDist = prov.districts[0];
    setForm(prev => ({
      ...prev,
      province: provinceName,
      district: firstDist.name,
      ward: firstDist.wards[0] || '',
    }));
  };

  const handleDistrictChange = (districtName: string) => {
    const dist = availableDistricts.find(d => d.name === districtName) || availableDistricts[0];
    setForm(prev => ({
      ...prev,
      district: districtName,
      ward: dist ? (dist.wards[0] || '') : '',
    }));
  };

  // Kiểm tra quy chuẩn mật khẩu (ĐK06)
  const pass = form.matKhau;
  const passLengthValid = pass.length >= 8;
  const passUpperValid = /[A-Z]/.test(pass);
  const passLowerValid = /[a-z]/.test(pass);
  const passNumberValid = /[0-9]/.test(pass);
  const passSpecialValid = /[^A-Za-z0-9]/.test(pass);
  const passMatch = pass.length > 0 && pass === form.xacNhanMatKhau;
  const isPasswordValid = passLengthValid && passUpperValid && passLowerValid && passNumberValid && passSpecialValid && passMatch;

  // Tiêu chí mật khẩu mới cho Quên mật khẩu (ĐN02)
  const newPassLengthValid = newPass.length >= 8;
  const newPassUpperValid = /[A-Z]/.test(newPass);
  const newPassLowerValid = /[a-z]/.test(newPass);
  const newPassNumberValid = /[0-9]/.test(newPass);
  const newPassSpecialValid = /[^A-Za-z0-9]/.test(newPass);
  const newPassMatch = newPass.length > 0 && newPass === confirmNewPass;
  const isNewPasswordValid = newPassLengthValid && newPassUpperValid && newPassLowerValid && newPassNumberValid && newPassSpecialValid && newPassMatch;

  // Kiểm tra định dạng số điện thoại (ĐK01)
  const isPhoneValid = /^0\d{9}$/.test(form.soDienThoai.trim());

  // Kiểm tra định dạng email
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  // Xử lý đăng nhập kết nối trực tiếp Backend (ĐN01)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr(null);
    setIsSubmitting(true);

    try {
      const customer = await customerApi.login(loginInput.trim(), loginPass);
      setToast(`🎉 Đăng nhập thành công! Chào mừng trở lại, ${customer.hoTen}`);
      setTimeout(() => {
        onSuccess(customer);
        onClose();
      }, 1000);
    } catch (err: any) {
      setLoginErr(err?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── XỬ LÝ QUÊN MẬT KHẨU (ĐN02) ──
  // Bước 1: Kiểm tra tài khoản & gửi OTP
  const handleForgotCheckAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErr(null);
    if (!forgotInput.trim()) {
      setForgotErr('Vui lòng nhập Email hoặc Số điện thoại!');
      return;
    }

    setIsSubmitting(true);
    try {
      await customerApi.checkAccount(forgotInput.trim());
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setForgotOtp(otp);
      setForgotUserOtp('');
      setForgotTimer(120);
      setForgotStep('otp');
    } catch (err: any) {
      setForgotErr(err?.message || 'Không tìm thấy tài khoản với thông tin này!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bước 2: Xác nhận OTP quên mật khẩu
  const handleForgotVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErr(null);
    if (forgotUserOtp.trim() !== forgotOtp) {
      setForgotErr('Mã OTP không chính xác. Vui lòng kiểm tra lại!');
      return;
    }
    if (forgotTimer <= 0) {
      setForgotErr('Mã OTP đã hết hiệu lực. Vui lòng gửi lại mã!');
      return;
    }
    setForgotStep('new_password');
  };

  // Bước 3: Đặt lại mật khẩu mới & Đăng nhập
  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErr(null);

    if (!isNewPasswordValid) {
      setForgotErr('Mật khẩu mới chưa đáp ứng đầy đủ tiêu chuẩn bảo mật hoặc chưa trùng khớp!');
      return;
    }

    setIsSubmitting(true);
    try {
      await customerApi.resetPassword(forgotInput.trim(), newPass);
      // Tự động đăng nhập luôn sau khi đổi mật khẩu
      const customer = await customerApi.login(forgotInput.trim(), newPass);
      setToast(`🎉 Đặt lại mật khẩu thành công! Chào mừng ${customer.hoTen} đã đăng nhập.`);
      setTimeout(() => {
        onSuccess(customer);
        onClose();
      }, 1200);
    } catch (err: any) {
      setForgotErr(err?.message || 'Đặt lại mật khẩu thất bại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bước 1: Chuyển sang xác thực OTP (ĐK05)
  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterErr(null);

    if (!form.hoTen.trim()) {
      setRegisterErr('Vui lòng nhập họ và tên!');
      return;
    }

    if (!isEmailValid) {
      setRegisterErr('Địa chỉ Email không đúng định dạng!');
      return;
    }

    // ĐK01
    if (!isPhoneValid) {
      setRegisterErr('Số điện thoại không hợp lệ! Phải gồm đúng 10 chữ số và bắt đầu bằng số 0.');
      return;
    }

    // ĐK04
    if (!form.ngaySinh) {
      setRegisterErr('Vui lòng chọn ngày sinh!');
      return;
    }

    // ĐK06
    if (!isPasswordValid) {
      setRegisterErr('Mật khẩu chưa đáp ứng đầy đủ yêu cầu bảo mật hoặc chưa trùng khớp!');
      return;
    }

    // Tạo mã OTP 6 chữ số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setUserOtp('');
    setOtpTimer(120);
    setOtpErr(null);
    setRegStep('otp');
  };

  // Gửi lại mã OTP
  const handleResendOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setUserOtp('');
    setOtpTimer(120);
    setOtpErr(null);
  };

  // Bước 2: Hoàn tất đăng ký sau khi xác thực OTP thành công
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpErr(null);

    if (userOtp.trim() !== generatedOtp) {
      setOtpErr('Mã OTP không chính xác. Vui lòng kiểm tra lại!');
      return;
    }

    if (otpTimer <= 0) {
      setOtpErr('Mã OTP đã hết hiệu lực. Vui lòng bấm gửi lại mã!');
      return;
    }

    setIsSubmitting(true);
    const fullAddress = `${form.streetAddress.trim() ? form.streetAddress.trim() + ', ' : ''}${form.ward}, ${form.district}, ${form.province}`;

    try {
      const res = await customerApi.create({
        hoTen: form.hoTen.trim(),
        email: form.email.trim(),
        soDienThoai: form.soDienThoai.trim(),
        diaChi: fullAddress,
        ngaySinh: `${form.ngaySinh}T00:00:00`,
        gioiTinh: form.gioiTinh,
        tenDangNhap: form.email.trim(),
        matKhau: form.matKhau,
      });

      setToast(`🎉 Chúc mừng ${res.customer.hoTen}! Tài khoản đã được tạo thành công.`);
      setTimeout(() => {
        onSuccess(res.customer);
        onClose();
      }, 1500);
    } catch (err: any) {
      // ĐK02: Bắt lỗi nếu trùng sđt / email
      setRegStep('form');
      setRegisterErr(err?.message || 'Đăng ký thất bại! Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-zinc-200 overflow-hidden">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-100 shrink-0">
          <h3 className="font-extrabold text-base text-zinc-900" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            {activeTab === 'login' ? 'ĐĂNG NHẬP KHÁCH HÀNG' : (activeTab === 'forgot' ? 'KHÔI PHỤC MẬT KHẨU' : (regStep === 'otp' ? 'XÁC THỰC MÃ OTP' : 'ĐĂNG KÝ TÀI KHOẢN MỚI'))}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 font-bold text-lg p-1">✕</button>
        </div>

        {toast ? (
          <div className="py-12 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <div className="text-base font-bold text-zinc-900">{toast}</div>
            <p className="text-xs text-zinc-500 mt-2">Hệ thống đang tự động đăng nhập cho bạn...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1">
            {/* Tabs */}
            {activeTab !== 'forgot' && (
              <div className="flex gap-2 mb-4 p-1 bg-zinc-100 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setRegStep('form'); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'login' ? 'bg-white shadow text-zinc-900' : 'text-zinc-500'}`}
                >
                  🔑 Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'register' ? 'bg-white shadow text-zinc-900' : 'text-zinc-500'}`}
                >
                  📝 Đăng ký mới
                </button>
              </div>
            )}

            {/* TAB LOGIN (ĐN01) */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Email hoặc Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: nguyenvanan@gmail.com hoặc 0901234567"
                    value={loginInput}
                    onChange={e => setLoginInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-zinc-700">Mật khẩu *</label>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('forgot'); setForgotStep('check'); setForgotErr(null); setForgotInput(loginInput); }}
                      className="text-[11px] text-red-700 hover:underline font-semibold"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPass ? 'text' : 'password'}
                      required
                      placeholder="Mật khẩu của bạn"
                      value={loginPass}
                      onChange={e => setLoginPass(e.target.value)}
                      className="w-full p-2.5 pr-8 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass(!showLoginPass)}
                      className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs"
                    >
                      {showLoginPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {loginErr && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{loginErr}</p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition ${isSubmitting ? 'bg-zinc-400 cursor-not-allowed' : 'bg-red-700 hover:bg-red-800'}`}
                  >
                    {isSubmitting ? 'Đang xác thực...' : 'ĐĂNG NHẬP NGAY →'}
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Thử tài khoản mẫu có sẵn xe:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginInput('0901234567');
                      setLoginPass('123456');
                    }}
                    className="text-red-700 font-bold hover:underline"
                  >
                    Điền nhanh Nguyễn Văn An
                  </button>
                </div>
              </form>
            )}

            {/* TAB QUÊN MẬT KHẨU (ĐN02) */}
            {activeTab === 'forgot' && (
              <div className="space-y-4 py-1">
                {forgotStep === 'check' && (
                  <form onSubmit={handleForgotCheckAccount} className="space-y-3.5">
                    <p className="text-xs text-zinc-600">
                      Nhập Email hoặc Số điện thoại tài khoản của bạn để nhận mã xác minh OTP đặt lại mật khẩu:
                    </p>

                    {forgotErr && (
                      <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{forgotErr}</p>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Email hoặc Số điện thoại *</label>
                      <input
                        type="text"
                        required
                        placeholder="VD: 0988665544 hoặc baongoc@gmail.com"
                        value={forgotInput}
                        onChange={e => setForgotInput(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => { setActiveTab('login'); setForgotErr(null); }}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      >
                        ← Quay lại Đăng nhập
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !forgotInput.trim()}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition ${isSubmitting || !forgotInput.trim() ? 'bg-zinc-400 cursor-not-allowed' : 'bg-red-700 hover:bg-red-800'}`}
                      >
                        {isSubmitting ? 'Đang kiểm tra...' : 'Tiếp tục nhận OTP →'}
                      </button>
                    </div>
                  </form>
                )}

                {forgotStep === 'otp' && (
                  <form onSubmit={handleForgotVerifyOtp} className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <span>📲</span>
                        <span>Mã xác thực OTP đã được gửi</span>
                      </div>
                      <p className="text-zinc-600 text-[11px] leading-relaxed">
                        Mã OTP 6 số đã được gửi tới <strong>{forgotInput}</strong> để xác minh yêu cầu đặt lại mật khẩu.
                      </p>
                      <div className="mt-2 p-2 bg-white rounded-lg border border-blue-200 flex items-center justify-between">
                        <span className="font-mono font-bold text-sm tracking-widest text-red-600">{forgotOtp}</span>
                        <button
                          type="button"
                          onClick={() => setForgotUserOtp(forgotOtp)}
                          className="text-[11px] bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold px-2 py-1 rounded"
                        >
                          ⚡ Tự động điền OTP
                        </button>
                      </div>
                    </div>

                    {forgotErr && (
                      <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{forgotErr}</p>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1.5 text-center">
                        Nhập mã OTP 6 chữ số:
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="• • • • • •"
                        value={forgotUserOtp}
                        onChange={e => setForgotUserOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center tracking-widest font-mono font-bold text-xl py-2.5 rounded-xl border-2 border-zinc-300 focus:border-red-600 focus:outline-none bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                      <span>
                        {forgotTimer > 0 ? (
                          <>Mã còn hiệu lực: <strong className="text-red-600 font-mono">{Math.floor(forgotTimer / 60)}:{String(forgotTimer % 60).padStart(2, '0')}</strong></>
                        ) : (
                          <span className="text-red-600 font-semibold">Mã OTP đã hết hạn!</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const otp = Math.floor(100000 + Math.random() * 900000).toString();
                          setForgotOtp(otp);
                          setForgotUserOtp('');
                          setForgotTimer(120);
                          setForgotErr(null);
                        }}
                        className="text-red-700 hover:underline font-bold"
                      >
                        Gửi lại mã OTP
                      </button>
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-2 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => setForgotStep('check')}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      >
                        ← Quay lại
                      </button>
                      <button
                        type="submit"
                        disabled={forgotUserOtp.length !== 6}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition ${forgotUserOtp.length !== 6 ? 'bg-zinc-400 cursor-not-allowed' : 'bg-red-700 hover:bg-red-800'}`}
                      >
                        Xác nhận OTP →
                      </button>
                    </div>
                  </form>
                )}

                {forgotStep === 'new_password' && (
                  <form onSubmit={handleForgotResetPassword} className="space-y-3.5">
                    <p className="text-xs text-zinc-600">
                      Thiết lập mật khẩu mới cho tài khoản <strong>{forgotInput}</strong>:
                    </p>

                    {forgotErr && (
                      <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{forgotErr}</p>
                    )}

                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2.5">
                      <div>
                        <span className="text-[10px] font-semibold text-zinc-500">Mật khẩu mới *</span>
                        <div className="relative mt-1">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            required
                            placeholder="Mật khẩu mới của bạn"
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            className="w-full p-2 pr-8 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600 text-xs"
                          >
                            {showNewPass ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-zinc-500">Xác nhận mật khẩu mới *</span>
                        <div className="relative mt-1">
                          <input
                            type={showConfirmNewPass ? 'text' : 'password'}
                            required
                            placeholder="Nhập lại mật khẩu mới"
                            value={confirmNewPass}
                            onChange={e => setConfirmNewPass(e.target.value)}
                            className="w-full p-2 pr-8 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmNewPass(!showConfirmNewPass)}
                            className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600 text-xs"
                          >
                            {showConfirmNewPass ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>

                      {/* Tiêu chí mật khẩu mạnh */}
                      <div className="text-[10px] space-y-1 bg-white p-2.5 rounded-lg border border-zinc-200">
                        <div className="font-semibold text-zinc-700 mb-1">Tiêu chuẩn mật khẩu:</div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                          <div className={newPassLengthValid ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                            {newPassLengthValid ? '✓' : '○'} Tối thiểu 8 ký tự
                          </div>
                          <div className={newPassUpperValid ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                            {newPassUpperValid ? '✓' : '○'} Có chữ hoa (A-Z)
                          </div>
                          <div className={newPassLowerValid ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                            {newPassLowerValid ? '✓' : '○'} Có chữ thường (a-z)
                          </div>
                          <div className={newPassNumberValid ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                            {newPassNumberValid ? '✓' : '○'} Có chữ số (0-9)
                          </div>
                          <div className={newPassSpecialValid ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                            {newPassSpecialValid ? '✓' : '○'} Có ký tự đặc biệt (!@#$)
                          </div>
                          <div className={newPassMatch ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                            {newPassMatch ? '✓' : '○'} Mật khẩu trùng khớp
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-2 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => { setActiveTab('login'); setForgotErr(null); }}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      >
                        ← Hủy & Về Đăng nhập
                      </button>
                      <button
                        type="submit"
                        disabled={!isNewPasswordValid || isSubmitting}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition ${(!isNewPasswordValid || isSubmitting) ? 'bg-zinc-400 cursor-not-allowed' : 'bg-red-700 hover:bg-red-800'}`}
                      >
                        {isSubmitting ? 'Đang lưu...' : 'Lưu mật khẩu mới & Đăng nhập 🎉'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB ĐĂNG KÝ MỚI (ĐK01 -> ĐK06) */}
            {activeTab === 'register' && (
              regStep === 'form' ? (
                <form onSubmit={handleProceedToOtp} className="space-y-3.5">
                  {registerErr && (
                    <div className="text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-300 flex items-start gap-2">
                      <span className="font-bold">⚠️</span>
                      <span>{registerErr}</span>
                    </div>
                  )}

                  {/* Họ và tên */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Họ và tên *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Văn Hoàng"
                      value={form.hoTen}
                      onChange={e => setForm({ ...form, hoTen: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                    />
                  </div>

                  {/* Email & Số điện thoại (ĐK01 & ĐK02) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="hoang@gmail.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none ${form.email && !isEmailValid ? 'border-red-500 focus:border-red-600' : 'border-zinc-300 focus:border-red-600'}`}
                      />
                      {form.email && !isEmailValid && (
                        <p className="text-[11px] text-red-600 mt-1">Email không đúng định dạng</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Số điện thoại *</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="0987654321"
                        value={form.soDienThoai}
                        onChange={e => setForm({ ...form, soDienThoai: e.target.value.replace(/\D/g, '') })}
                        className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none ${form.soDienThoai && !isPhoneValid ? 'border-red-500 focus:border-red-600' : 'border-zinc-300 focus:border-red-600'}`}
                      />
                      {form.soDienThoai && !isPhoneValid ? (
                        <p className="text-[11px] text-red-600 mt-1">SĐT phải đủ 10 số và bắt đầu bằng số 0</p>
                      ) : (
                        <p className="text-[10px] text-zinc-400 mt-1">Ví dụ: 0901234567 (10 số)</p>
                      )}
                    </div>
                  </div>

                  {/* Ngày sinh & Giới tính (ĐK04) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Ngày sinh *</label>
                      <input
                        type="date"
                        required
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
                        value={form.ngaySinh}
                        onChange={e => setForm({ ...form, ngaySinh: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Giới tính *</label>
                      <select
                        value={form.gioiTinh}
                        onChange={e => setForm({ ...form, gioiTinh: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>

                  {/* Địa chỉ phân cấp Tỉnh/TP - Quận/Huyện - Phường/Xã (ĐK03) */}
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2.5">
                    <label className="block text-xs font-bold text-zinc-800">Địa chỉ cư trú</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-zinc-500">Tỉnh / Thành phố *</span>
                        <select
                          value={form.province}
                          onChange={e => handleProvinceChange(e.target.value)}
                          className="w-full mt-1 p-2 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                        >
                          {VIETNAM_LOCATIONS.map(p => (
                            <option key={p.name} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-zinc-500">Quận / Huyện *</span>
                        <select
                          value={form.district}
                          onChange={e => handleDistrictChange(e.target.value)}
                          className="w-full mt-1 p-2 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                        >
                          {availableDistricts.map(d => (
                            <option key={d.name} value={d.name}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-zinc-500">Phường / Xã *</span>
                        <select
                          value={form.ward}
                          onChange={e => setForm({ ...form, ward: e.target.value })}
                          className="w-full mt-1 p-2 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                        >
                          {availableWards.map(w => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-zinc-500">Số nhà, tên đường</span>
                      <input
                        type="text"
                        placeholder="VD: 123 Lê Lợi"
                        value={form.streetAddress}
                        onChange={e => setForm({ ...form, streetAddress: e.target.value })}
                        className="w-full mt-1 p-2 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>

                  {/* Thiết lập mật khẩu mạnh (ĐK06) */}
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2.5">
                    <label className="block text-xs font-bold text-zinc-800">Thiết lập mật khẩu</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-zinc-500">Mật khẩu mới *</span>
                        <div className="relative mt-1">
                          <input
                            type={showPass ? 'text' : 'password'}
                            required
                            placeholder="Mật khẩu của bạn"
                            value={form.matKhau}
                            onChange={e => setForm({ ...form, matKhau: e.target.value })}
                            className="w-full p-2 pr-8 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600 text-xs"
                          >
                            {showPass ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-zinc-500">Xác nhận mật khẩu *</span>
                        <div className="relative mt-1">
                          <input
                            type={showConfirmPass ? 'text' : 'password'}
                            required
                            placeholder="Nhập lại mật khẩu"
                            value={form.xacNhanMatKhau}
                            onChange={e => setForm({ ...form, xacNhanMatKhau: e.target.value })}
                            className="w-full p-2 pr-8 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600 text-xs"
                          >
                            {showConfirmPass ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tiêu chí mật khẩu mạnh */}
                    <div className="text-[10px] space-y-1 bg-white p-2.5 rounded-lg border border-zinc-200">
                      <div className="font-semibold text-zinc-700 mb-1">Tiêu chuẩn mật khẩu an toàn:</div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                        <div className={passLengthValid ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                          {passLengthValid ? '✓' : '○'} Tối thiểu 8 ký tự
                        </div>
                        <div className={passUpperValid ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                          {passUpperValid ? '✓' : '○'} Có chữ hoa (A-Z)
                        </div>
                        <div className={passLowerValid ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                          {passLowerValid ? '✓' : '○'} Có chữ thường (a-z)
                        </div>
                        <div className={passNumberValid ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                          {passNumberValid ? '✓' : '○'} Có chữ số (0-9)
                        </div>
                        <div className={passSpecialValid ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                          {passSpecialValid ? '✓' : '○'} Có ký tự đặc biệt (!@#$)
                        </div>
                        <div className={passMatch ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                          {passMatch ? '✓' : '○'} Mật khẩu trùng khớp
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={!isPasswordValid || !isPhoneValid || !isEmailValid}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition ${(!isPasswordValid || !isPhoneValid || !isEmailValid) ? 'bg-zinc-400 cursor-not-allowed opacity-70' : 'bg-red-700 hover:bg-red-800'}`}
                    >
                      Tiếp tục xác thực OTP →
                    </button>
                  </div>
                </form>
              ) : (
                /* BƯỚC XÁC MINH OTP (ĐK05) */
                <form onSubmit={handleFinalSubmit} className="space-y-4 py-2">
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <span>📲</span>
                      <span>Mô phỏng gửi mã OTP xác nhận</span>
                    </div>
                    <p className="text-zinc-600 text-[11px] leading-relaxed">
                      Hệ thống đã gửi mã OTP 6 số đến Email/SĐT: <strong>{form.soDienThoai}</strong> / <strong>{form.email}</strong>.
                    </p>
                    <div className="mt-2.5 p-2 bg-white rounded-lg border border-blue-200 flex items-center justify-between">
                      <span className="font-mono font-bold text-sm tracking-widest text-red-600">{generatedOtp}</span>
                      <button
                        type="button"
                        onClick={() => setUserOtp(generatedOtp)}
                        className="text-[11px] bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold px-2 py-1 rounded"
                      >
                        ⚡ Tự động điền OTP
                      </button>
                    </div>
                  </div>

                  {otpErr && (
                    <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-300">
                      {otpErr}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1.5 text-center">
                      Nhập mã OTP 6 chữ số:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="• • • • • •"
                      value={userOtp}
                      onChange={e => setUserOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-widest font-mono font-bold text-xl py-3 rounded-xl border-2 border-zinc-300 focus:border-red-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                    <span>
                      {otpTimer > 0 ? (
                        <>Mã còn hiệu lực: <strong className="text-red-600 font-mono">{Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}</strong></>
                      ) : (
                        <span className="text-red-600 font-semibold">Mã OTP đã hết hạn!</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-red-700 hover:underline font-bold"
                    >
                      Gửi lại mã OTP
                    </button>
                  </div>

                  <div className="flex justify-between items-center gap-2 pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setRegStep('form')}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    >
                      ← Quay lại sửa thông tin
                    </button>
                    <button
                      type="submit"
                      disabled={userOtp.length !== 6 || isSubmitting}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition ${userOtp.length !== 6 || isSubmitting ? 'bg-zinc-400 cursor-not-allowed opacity-70' : 'bg-red-700 hover:bg-red-800'}`}
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Xác nhận & Hoàn tất 🎉'}
                    </button>
                  </div>
                </form>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IcoStore() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IcoBike() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 0 0-1 1v11.5"/><path d="M9 7l1.5 5.5h6l-3-5.5H9z"/></svg>; }
function IcoCalendar() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function IcoUser() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
