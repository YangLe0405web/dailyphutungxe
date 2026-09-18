import React, { useState } from 'react';
import type { ReactNode } from 'react';

type NavGroup = { group: string; items: { key: string; label: string; icon: ReactNode }[] };

const nav: NavGroup[] = [
  {
    group: 'Tổng quan',
    items: [{ key: 'dashboard', label: 'Dashboard', icon: <I icon="grid" /> }],
  },
  {
    group: 'Bán hàng',
    items: [
      { key: 'sales', label: 'Quản lý đơn hàng', icon: <I icon="package" /> },
      { key: 'appointments', label: 'Lịch hẹn dịch vụ', icon: <I icon="calendar" /> },
    ],
  },
  {
    group: 'CRM',
    items: [
      { key: 'customers', label: 'Khách hàng', icon: <I icon="users" /> },
      { key: 'feedback', label: 'Phản hồi & Khiếu nại', icon: <I icon="message" /> },
    ],
  },
  {
    group: 'Phân tích',
    items: [{ key: 'reports', label: 'Báo cáo thống kê', icon: <I icon="chart" /> }],
  },
];

interface AdminLayoutProps {
  children: ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function AdminLayout({ children, activePage, onNavigate }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col shrink-0 transition-all duration-300"
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
          {nav.map(group => (
            <div key={group.group} className="mb-4">
              {!collapsed && (
                <div className="px-4 mb-1 text-xs font-600" style={{ color: 'var(--color-zinc-600)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {group.group}
                </div>
              )}
              {group.items.map(item => {
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
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid var(--color-zinc-800)' }}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="flex items-center justify-center rounded-full text-sm font-700 shrink-0"
                style={{ width: 32, height: 32, background: 'var(--color-red-700)', color: 'white', fontFamily: 'var(--font-display)' }}>A</div>
              <div>
                <div className="text-sm font-500" style={{ color: 'white' }}>Quản trị viên</div>
                <div className="text-xs" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>admin@motoshop.vn</div>
              </div>
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

      {/* Main */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--color-zinc-100)' }}>
        {children}
      </main>
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
  };
  return d[icon] ?? null;
}
