import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AdminRole, StaffAccount } from '../data/mockData';

type NavGroup = { group: string; items: { key: string; label: string; icon: ReactNode; allowedRoles?: AdminRole[] }[] };

const nav: NavGroup[] = [
  {
    group: 'Tổng quan',
    items: [{ key: 'dashboard', label: 'Dashboard', icon: <I icon="grid" /> }],
  },
  {
    group: 'Bán hàng',
    items: [
      { key: 'sales', label: 'Quản lý đơn hàng', icon: <I icon="package" />, allowedRoles: ['SuperAdmin', 'NhanVienBanHang'] },
      { key: 'appointments', label: 'Lịch hẹn dịch vụ', icon: <I icon="calendar" /> },
    ],
  },
  {
    group: 'Kho hàng',
    items: [
      { key: 'parts', label: 'Phụ tùng & Phụ kiện', icon: <I icon="box" />, allowedRoles: ['SuperAdmin', 'NhanVienKyThuat'] },
      { key: 'vehicles', label: 'Quản lý xe mẫu', icon: <I icon="bike" />, allowedRoles: ['SuperAdmin', 'NhanVienBanHang', 'NhanVienKyThuat'] },
    ],
  },
  {
    group: 'Đối tác & Chuỗi cung ứng',
    items: [
      { key: 'suppliers', label: 'Nhà cung cấp & Nhập kho', icon: <I icon="truck" />, allowedRoles: ['SuperAdmin', 'NhanVienBanHang', 'NhanVienKyThuat'] },
    ],
  },
  {
    group: 'CRM',
    items: [
      { key: 'customers', label: 'Khách hàng', icon: <I icon="users" />, allowedRoles: ['SuperAdmin', 'NhanVienBanHang'] },
      { key: 'feedback', label: 'Phản hồi & Khiếu nại', icon: <I icon="message" />, allowedRoles: ['SuperAdmin', 'NhanVienBanHang'] },
    ],
  },
  {
    group: 'Phân tích & Hệ thống',
    items: [
      { key: 'reports', label: 'Báo cáo thống kê', icon: <I icon="chart" />, allowedRoles: ['SuperAdmin'] },
      { key: 'staff', label: 'Phân quyền & Nhân sự', icon: <I icon="shield" />, allowedRoles: ['SuperAdmin'] },
    ],
  },
];

interface AdminLayoutProps {
  children: ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  currentStaff?: StaffAccount | null;
  onLogout?: () => void;
  onHome?: () => void;
  currentRole?: AdminRole;
  onRoleChange?: (role: AdminRole) => void;
}

export default function AdminLayout({
  children,
  activePage,
  onNavigate,
  currentStaff,
  onLogout,
  onHome,
  currentRole,
}: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const activeRole: AdminRole = currentRole || currentStaff?.vaiTro || 'SuperAdmin';

  return (
    <div className="flex min-h-screen" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col shrink-0 transition-all duration-300 z-20"
        style={{
          width: collapsed ? 64 : 248,
          background: 'var(--color-zinc-950)',
          borderRight: '1px solid var(--color-zinc-800)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid var(--color-zinc-800)' }}>
          <div className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 36, height: 36, background: 'var(--color-red-700)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/>
              <path d="M6 17V7l2-2h5l4 6h1a2 2 0 0 1 0 4h-1"/>
            </svg>
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'white', letterSpacing: '0.06em', lineHeight: 1 }}>MOTOSHOP</div>
              <div style={{ fontSize: 9, color: 'var(--color-red-500)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>ADMIN PANEL</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {nav.map(group => {
            // Filter items based on active role
            const visibleItems = group.items.filter(item => !item.allowedRoles || item.allowedRoles.includes(activeRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.group} className="mb-4">
                {!collapsed && (
                  <div className="px-4 mb-1 text-xs font-600" style={{ color: 'var(--color-zinc-600)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {group.group}
                  </div>
                )}
                {visibleItems.map(item => {
                  const active = activePage === item.key;
                  return (
                    <button key={item.key} onClick={() => onNavigate(item.key)}
                      className="flex items-center gap-3 w-full transition-all text-left"
                      style={{
                        padding: collapsed ? '9px 20px' : '9px 16px',
                        background: active ? 'var(--color-red-700)' : 'transparent',
                        color: active ? 'white' : 'var(--color-zinc-400)',
                        borderLeft: active ? '3px solid var(--color-red-400)' : '3px solid transparent',
                        border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: active ? 600 : 400,
                      }}
                      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-zinc-800)'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; } }}
                      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-zinc-400)'; } }}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!collapsed && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid var(--color-zinc-800)' }}>
          {!collapsed && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-full text-xs font-700 shrink-0"
                  style={{ width: 34, height: 34, background: 'var(--color-red-700)', color: 'white', fontFamily: 'var(--font-display)' }}>
                  {currentStaff ? currentStaff.hoTen[0] : 'A'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-white truncate">
                    {currentStaff ? currentStaff.hoTen : 'Quản trị viên'}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono truncate">
                    {currentStaff ? currentStaff.email : 'admin@motoshop.vn'}
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-zinc-300 bg-zinc-900 hover:bg-red-950 hover:text-red-400 border border-zinc-800 transition flex items-center justify-center gap-1.5 cursor-pointer font-mono"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span>Đăng xuất</span>
                </button>
              )}
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-3 transition-colors"
            style={{ background: 'none', border: 'none', color: 'var(--color-zinc-600)', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-zinc-600)')}>
            {collapsed
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            }
          </button>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-zinc-200 px-6 flex items-center justify-between shadow-2xs z-10">
          <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
            <span className="font-semibold text-zinc-800">HỆ THỐNG CRM PHÂN QUYỀN RBAC</span>
            <span>·</span>
            <span>Showroom Motoshop</span>
            {currentStaff && (
              <>
                <span>·</span>
                <span className="text-zinc-600 font-semibold">{currentStaff.hoTen}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Vai trò nhân viên badge (thay cho giả lập vai trò) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase hidden sm:inline">Vai trò:</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono inline-block shadow-2xs"
                style={{
                  background: activeRole === 'SuperAdmin' ? '#fef2f2' : activeRole === 'NhanVienBanHang' ? '#eff6ff' : '#f0fdf4',
                  color: activeRole === 'SuperAdmin' ? '#dc2626' : activeRole === 'NhanVienBanHang' ? '#2563eb' : '#16a34a',
                  border: `1px solid ${activeRole === 'SuperAdmin' ? '#fecaca' : activeRole === 'NhanVienBanHang' ? '#bfdbfe' : '#bbf7d0'}`,
                }}
              >
                {activeRole === 'SuperAdmin' ? '👑 Super Admin' : activeRole === 'NhanVienBanHang' ? '💼 NV Bán Hàng' : '🔧 NV Kỹ Thuật'}
              </span>
            </div>

            {/* Nút về Trang chủ portal gọn gàng trên topbar */}
            {onHome && (
              <button
                onClick={onHome}
                title="Quay lại trang chọn cổng Portal"
                className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer"
              >
                ↩ Trang chủ
              </button>
            )}

            {/* Nút Đăng xuất */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer"
              >
                🚪 Đăng xuất
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--color-zinc-100)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function I({ icon }: { icon: string }) {
  const d: Record<string, React.ReactElement> = {
    grid: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    package: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
    calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    message: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    chart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    box: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
    bike: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 0 0-1 1v11.5"/><path d="M9 7l1.5 5.5h6l-3-5.5H9z"/></svg>,
    truck: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>,
    shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  };
  return d[icon] ?? null;
}
