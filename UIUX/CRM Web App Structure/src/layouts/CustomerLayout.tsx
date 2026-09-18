import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';

type CustomerPage = 'store' | 'booking' | 'dashboard' | 'checkout';

interface Props {
  children: React.ReactNode;
  activePage: CustomerPage;
  onNavigate: (p: CustomerPage) => void;
  onHome: () => void;
}

const navItems = [
  { key: 'store', label: 'Cửa hàng', icon: <IcoStore /> },
  { key: 'booking', label: 'Đặt lịch', icon: <IcoCalendar /> },
  { key: 'dashboard', label: 'Cá nhân', icon: <IcoUser /> },
] as const;

export default function CustomerLayout({ children, activePage, onNavigate, onHome }: Props) {
  const { count, items, total, remove, updateQty } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

          {/* Right: cart + mobile menu */}
          <div className="flex items-center gap-2">
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
                <div className="text-xs" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>{count} sản phẩm</div>
              </div>
              <button onClick={() => setCartOpen(false)} style={{ background: 'var(--color-zinc-800)', border: 'none', color: 'var(--color-zinc-300)', cursor: 'pointer', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>×</button>
            </div>

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
                <div className="flex flex-col gap-4">
                  {items.map(item => {
                    const price = item.part.giaKhuyenMai ?? item.part.giaGoc;
                    return (
                      <div key={item.part.id} className="flex gap-3 rounded-xl p-3" style={{ background: 'var(--color-zinc-50)', border: '1px solid var(--color-zinc-200)' }}>
                        <img src={item.part.hinhAnh} alt={item.part.tenSanPham}
                          className="rounded-lg object-cover shrink-0"
                          style={{ width: 64, height: 64, background: 'var(--color-zinc-200)' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-600 leading-snug" style={{ color: 'var(--color-zinc-900)' }}>{item.part.tenSanPham}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--color-zinc-500)' }}>{item.part.thuongHieu}</div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="font-700" style={{ color: 'var(--color-red-700)', fontSize: 14 }}>{fmt(price * item.soLuong)}</div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateQty(item.part.id, item.soLuong - 1)}
                                style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--color-zinc-200)', background: 'white', cursor: 'pointer', fontWeight: 700, color: 'var(--color-zinc-700)' }}>-</button>
                              <span className="text-sm font-600 w-6 text-center" style={{ fontFamily: 'var(--font-mono)' }}>{item.soLuong}</span>
                              <button onClick={() => updateQty(item.part.id, item.soLuong + 1)}
                                style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--color-zinc-200)', background: 'white', cursor: 'pointer', fontWeight: 700, color: 'var(--color-zinc-700)' }}>+</button>
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

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t p-5" style={{ borderColor: 'var(--color-zinc-200)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-600" style={{ color: 'var(--color-zinc-700)' }}>Tổng cộng</span>
                  <span className="text-xl font-700" style={{ color: 'var(--color-red-700)', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>{fmt(total)}</span>
                </div>
                <button onClick={() => { setCartOpen(false); onNavigate('checkout'); }}
                  className="w-full py-3.5 rounded-xl text-base font-700 text-white"
                  style={{ background: 'var(--color-red-700)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                  THANH TOÁN →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function IcoStore() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IcoCalendar() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function IcoUser() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
