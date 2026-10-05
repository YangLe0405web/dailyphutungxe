import React, { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { AdminRole, StaffAccount } from '../data/mockData';
import {
  getAdminNotifications,
  markAllAsRead,
  markNotificationAsRead,
  clearAllNotifications,
  deleteNotification,
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
  type AdminNotification,
} from '../services/notifications';
import { chatApi, formatCustomerId, type ChatMessage } from '../services/api';

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
      { key: 'insurance', label: 'Bảo hiểm xe', icon: <I icon="shield-check" />, allowedRoles: ['SuperAdmin', 'NhanVienBanHang'] },
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

  const [notifications, setNotifications] = useState<AdminNotification[]>(getAdminNotifications);
  const [notifOpen, setNotifOpen] = useState(false);
  const [liveToast, setLiveToast] = useState<AdminNotification | null>(null);
  const [selectedNotifCategory, setSelectedNotifCategory] = useState<NotificationCategory>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchNotif, setSearchNotif] = useState('');
  const notifTabsRef = useRef<HTMLDivElement>(null);

  const scrollNotifTabs = (direction: 'left' | 'right') => {
    if (notifTabsRef.current) {
      notifTabsRef.current.scrollBy({
        left: direction === 'left' ? -160 : 160,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const handleNewNotif = (e: any) => {
      const newN = e.detail as AdminNotification;
      setNotifications(prev => [newN, ...prev]);
      setLiveToast(newN);
      setTimeout(() => {
        setLiveToast(curr => curr?.id === newN.id ? null : curr);
      }, 7000);
    };

    const handleUpdate = () => {
      setNotifications(getAdminNotifications());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'crm_admin_notifications') {
        setNotifications(getAdminNotifications());
      }
    };

    window.addEventListener('crm-admin-notification', handleNewNotif);
    window.addEventListener('crm-notifications-updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('crm-admin-notification', handleNewNotif);
      window.removeEventListener('crm-notifications-updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Live Chat States (ĐG07)
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatConversations, setChatConversations] = useState<Array<{ customerId: string; customerName: string; lastMessage: string; lastSentAt: string; totalMessages: number; lastSender: string; phone?: string }>>([]);
  const [selectedChatCustId, setSelectedChatCustId] = useState<string>('KH001');
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [unreadChatTotal, setUnreadChatTotal] = useState(0);
  const [unreadByCustomer, setUnreadByCustomer] = useState<Record<string, number>>({});
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const adminChatScrollRef = useRef<HTMLDivElement>(null);

  const refreshConversations = async () => {
    try {
      const convs = await chatApi.getConversations();
      setChatConversations(convs);
      if (convs.length > 0 && !selectedChatCustId) {
        setSelectedChatCustId(convs[0].customerId);
      }
    } catch {}
  };

  useEffect(() => {
    refreshConversations();

    const channel = chatApi.getBroadcastChannel();
    const handleIncomingChat = (msg: ChatMessage) => {
      if (!msg) return;
      refreshConversations();

      const msgCustId = formatCustomerId(msg.customerId);
      const curSelected = formatCustomerId(selectedChatCustId);

      if (msgCustId === curSelected) {
        setActiveChatMessages(prev => {
          if (!prev.some(m => m.id === msg.id)) return [...prev, msg];
          return prev;
        });
        setTimeout(() => adminChatScrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }

      if (msg.sender === 'customer') {
        if (!chatModalOpen || msgCustId !== curSelected) {
          setUnreadByCustomer(prev => ({
            ...prev,
            [msgCustId]: (prev[msgCustId] || 0) + 1,
          }));
          setUnreadChatTotal(c => c + 1);
          setLiveToast({
            id: 'chat-' + msg.id,
            type: 'chat_message',
            category: 'review',
            title: `💬 Tin nhắn từ ${msg.senderName}`,
            message: msg.content,
            time: 'Vừa xong',
            timestamp: Date.now(),
            read: false,
            linkPage: 'feedback',
          });
        }
      }
    };

    if (channel) {
      channel.onmessage = (e) => {
        if (e.data) handleIncomingChat(e.data);
      };
    }

    const handleCustomChat = (e: any) => {
      handleIncomingChat(e.detail as ChatMessage);
    };
    window.addEventListener('crm-chat-update', handleCustomChat);

    const interval = setInterval(async () => {
      refreshConversations();
      if (selectedChatCustId && chatModalOpen) {
        try {
          const cleanId = formatCustomerId(selectedChatCustId);
          const msgs = await chatApi.getMessages(cleanId);
          setActiveChatMessages(prev => {
            const hasNew = msgs.length !== prev.length || msgs.some(m => !prev.some(p => p.id === m.id));
            if (hasNew) return msgs;
            return prev;
          });
        } catch {}
      }
    }, 2000);

    return () => {
      window.removeEventListener('crm-chat-update', handleCustomChat);
      clearInterval(interval);
    };
  }, [selectedChatCustId, chatModalOpen]);

  useEffect(() => {
    if (selectedChatCustId) {
      const cleanId = formatCustomerId(selectedChatCustId);
      chatApi.getMessages(cleanId).then(setActiveChatMessages);
    }
  }, [selectedChatCustId]);

  useEffect(() => {
    if (chatModalOpen) {
      adminChatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChatMessages, chatModalOpen]);

  const handleSelectCustomer = (cId: string) => {
    const cleanId = formatCustomerId(cId);
    setSelectedChatCustId(cleanId);
    setUnreadByCustomer(prev => {
      const count = prev[cleanId] || 0;
      if (count > 0) {
        setUnreadChatTotal(t => Math.max(0, t - count));
      }
      const updated = { ...prev };
      delete updated[cleanId];
      return updated;
    });
    chatApi.getMessages(cleanId).then(setActiveChatMessages);
  };

  const handleAdminSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim() || !selectedChatCustId) return;

    const targetCustId = formatCustomerId(selectedChatCustId);
    const sent = await chatApi.sendMessage({
      customerId: targetCustId,
      sender: 'staff',
      senderName: currentStaff?.hoTen || 'CSKH Showroom Motoshop',
      content: chatInputText.trim(),
    });

    setActiveChatMessages(prev => {
      if (!prev.some(m => m.id === sent.id)) return [...prev, sent];
      return prev;
    });
    setChatInputText('');
    setTimeout(() => {
      adminChatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

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
            {/* Live Chat CSKH Support (ĐG07) */}
            <div className="relative">
              <button
                onClick={() => {
                  setChatModalOpen(!chatModalOpen);
                  if (!chatModalOpen) setUnreadChatTotal(0);
                }}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border transition cursor-pointer text-xs font-bold ${
                  chatModalOpen
                    ? 'bg-red-700 text-white border-red-700 shadow-md'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
                }`}
                title="Hỗ trợ trực tuyến & Tin nhắn khách hàng (Live Chat)"
              >
                <span className="text-sm">💬</span>
                <span className="hidden sm:inline font-mono">Live Chat CSKH</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {unreadChatTotal > 0 && (
                  <span className="bg-amber-400 text-zinc-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                    {unreadChatTotal}
                  </span>
                )}
              </button>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer flex items-center justify-center"
                title="Thông báo hệ thống CRM"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-red-600 px-1 min-w-[18px] h-[18px] shadow animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Popover: TRUNG TÂM THÔNG BÁO (TC10) */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[92vw] sm:w-[480px] md:w-[540px] bg-white rounded-3xl shadow-2xl border border-zinc-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">🔔</span>
                      <div>
                        <div className="font-extrabold text-sm text-zinc-950 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                          TRUNG TÂM THÔNG BÁO
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          Hệ thống quản trị CRM Motoshop
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 ml-1">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            markAllAsRead(selectedNotifCategory);
                            setNotifications(getAdminNotifications());
                          }}
                          className="text-[11px] text-red-700 hover:text-red-800 font-bold transition cursor-pointer px-2 py-1 rounded-lg hover:bg-red-50"
                        >
                          ✓ Đã đọc tất cả
                        </button>
                      )}
                      <button
                        onClick={() => setNotifOpen(false)}
                        className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 font-bold text-xs transition cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Filter Toolbar: Search & Unread toggle */}
                  <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50/60 flex items-center gap-2.5 flex-wrap">
                    <div className="relative flex-1 min-w-[180px]">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">🔍</span>
                      <input
                        type="text"
                        value={searchNotif}
                        onChange={e => setSearchNotif(e.target.value)}
                        placeholder="Tìm theo tiêu đề, nội dung..."
                        className="w-full pl-7 pr-6 py-1.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                      />
                      {searchNotif && (
                        <button
                          onClick={() => setSearchNotif('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-zinc-700 select-none bg-white px-2.5 py-1.5 rounded-xl border border-zinc-200">
                      <input
                        type="checkbox"
                        checked={unreadOnly}
                        onChange={e => setUnreadOnly(e.target.checked)}
                        className="w-3.5 h-3.5 text-red-700 rounded-sm accent-red-700 cursor-pointer"
                      />
                      <span>Chỉ chưa đọc</span>
                    </label>
                  </div>

                  {/* Category Filter Chips with Horizontal Navigation (TC10: Phân loại thông báo) */}
                  <div className="relative px-2 py-1.5 border-b border-zinc-100 flex items-center gap-1 bg-zinc-50/50">
                    <button
                      type="button"
                      onClick={() => scrollNotifTabs('left')}
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 shadow-2xs transition cursor-pointer"
                      title="Cuộn sang trái"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>

                    <div
                      ref={notifTabsRef}
                      className="flex-1 flex items-center gap-1.5 overflow-x-auto scroll-smooth py-1 px-1"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 transparent',
                      }}
                    >
                      {NOTIFICATION_CATEGORIES.map(cat => {
                        const count = cat.key === 'all'
                          ? notifications.length
                          : notifications.filter(n => n.category === cat.key).length;
                        const unreadCat = cat.key === 'all'
                          ? unreadCount
                          : notifications.filter(n => n.category === cat.key && !n.read).length;
                        const isSelected = selectedNotifCategory === cat.key;

                        return (
                          <button
                            key={cat.key}
                            onClick={() => setSelectedNotifCategory(cat.key)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer border select-none ${
                              isSelected
                                ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                            }`}
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                              {count}
                            </span>
                            {unreadCat > 0 && !isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => scrollNotifTabs('right')}
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 shadow-2xs transition cursor-pointer"
                      title="Cuộn sang phải"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-100 flex-1">
                    {(() => {
                      const list = notifications.filter(n => {
                        const matchCat = selectedNotifCategory === 'all' || n.category === selectedNotifCategory;
                        const matchUnread = !unreadOnly || !n.read;
                        const matchSearch = !searchNotif.trim() ||
                          n.title.toLowerCase().includes(searchNotif.toLowerCase()) ||
                          n.message.toLowerCase().includes(searchNotif.toLowerCase());
                        return matchCat && matchUnread && matchSearch;
                      });

                      if (list.length === 0) {
                        return (
                          <div className="py-12 text-center text-zinc-400 space-y-1">
                            <div className="text-3xl mb-1">📭</div>
                            <div className="text-xs font-semibold text-zinc-600">Không có thông báo nào</div>
                            <p className="text-[11px] text-zinc-400">Không tìm thấy thông báo trong danh mục này</p>
                          </div>
                        );
                      }

                      return list.map(n => {
                        const catMeta = NOTIFICATION_CATEGORIES.find(c => c.key === n.category) || {
                          key: 'system',
                          label: 'Hệ thống',
                          icon: '⚙️',
                          color: '#4b5563',
                          bgColor: '#f3f4f6',
                        };

                        return (
                          <div
                            key={n.id}
                            className={`p-3.5 hover:bg-zinc-50/80 transition flex gap-3 group relative ${!n.read ? 'bg-red-50/30' : ''}`}
                          >
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-2xs"
                              style={{ background: catMeta.bgColor, border: `1px solid ${catMeta.color}30` }}
                            >
                              {catMeta.icon}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span
                                    className="px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono uppercase"
                                    style={{ background: catMeta.bgColor, color: catMeta.color }}
                                  >
                                    {catMeta.label}
                                  </span>
                                  <span className={`text-xs truncate ${!n.read ? 'font-extrabold text-zinc-950' : 'font-semibold text-zinc-700'}`}>
                                    {n.title}
                                  </span>
                                </div>
                                <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                                  {n.time}
                                </span>
                              </div>

                              <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>

                              <div className="flex items-center justify-between pt-1">
                                <button
                                  onClick={() => {
                                    markNotificationAsRead(n.id);
                                    setNotifications(getAdminNotifications());
                                    onNavigate(n.linkPage);
                                    setNotifOpen(false);
                                  }}
                                  className="text-[11px] font-mono text-red-700 hover:text-red-800 font-bold cursor-pointer hover:underline flex items-center gap-1"
                                >
                                  <span>Xem chi tiết</span>
                                  <span>→</span>
                                </button>

                                <div className="flex items-center gap-2">
                                  {!n.read && (
                                    <button
                                      onClick={() => {
                                        markNotificationAsRead(n.id);
                                        setNotifications(getAdminNotifications());
                                      }}
                                      className="text-[10px] text-zinc-400 hover:text-zinc-700 cursor-pointer"
                                      title="Đánh dấu đã đọc"
                                    >
                                      ✓ Đã đọc
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      deleteNotification(n.id);
                                      setNotifications(getAdminNotifications());
                                    }}
                                    className="text-[10px] text-zinc-400 hover:text-red-600 cursor-pointer px-1"
                                    title="Xóa thông báo này"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Footer */}
                  <div className="px-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        clearAllNotifications(selectedNotifCategory);
                        setNotifications(getAdminNotifications());
                      }}
                      className="text-zinc-400 hover:text-red-700 transition cursor-pointer text-[11px]"
                    >
                      🗑️ Xóa thông báo ({selectedNotifCategory === 'all' ? 'Tất cả' : NOTIFICATION_CATEGORIES.find(c => c.key === selectedNotifCategory)?.label})
                    </button>
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="font-bold text-zinc-700 hover:text-zinc-950 px-3 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>

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

      {/* Floating live toast */}
      {liveToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-red-500 p-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3">
            <div className="text-2xl shrink-0">
              {liveToast.type === 'customer_registered' ? '🎉' : liveToast.type === 'appointment_booked' ? '🏍️' : '📦'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">
                  {liveToast.title}
                </h4>
                <button
                  onClick={() => setLiveToast(null)}
                  className="text-zinc-400 hover:text-zinc-600 text-sm ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                {liveToast.message}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={() => {
                    onNavigate(liveToast.linkPage);
                    setLiveToast(null);
                  }}
                  className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold rounded-lg transition cursor-pointer shadow-xs"
                >
                  Xem ngay →
                </button>
                <button
                  onClick={() => setLiveToast(null)}
                  className="px-2 py-1 text-zinc-500 hover:text-zinc-700 text-[11px] cursor-pointer"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE CHAT MODAL CHO ADMIN (ĐG07) ── */}
      {chatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[620px] shadow-2xl border border-zinc-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-zinc-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-700 text-white flex items-center justify-center text-lg font-bold shadow-md">
                  💬
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider font-display">
                      TRUNG TÂM CSKH TRỰC TUYẾN (LIVE CHAT)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Đang kết nối Realtime
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Hỗ trợ trao đổi hai chiều tức thời giữa Nhân viên Showroom & Khách hàng
                  </div>
                </div>
              </div>
              <button
                onClick={() => setChatModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content: 2 Columns */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Conversation List */}
              <div className="w-80 border-r border-zinc-200 bg-zinc-50 flex flex-col shrink-0">
                <div className="p-3 border-b border-zinc-200 bg-white">
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc mã KH..."
                    value={chatSearchQuery}
                    onChange={e => setChatSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-red-600 bg-zinc-50 font-medium"
                  />
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
                  {chatConversations.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 text-xs px-4">
                      Chưa có hội thoại nào. Khi khách nhắn tin sẽ xuất hiện tại đây!
                    </div>
                  ) : (
                    chatConversations
                      .filter(c => {
                        if (!chatSearchQuery.trim()) return true;
                        const q = chatSearchQuery.toLowerCase();
                        return c.customerName.toLowerCase().includes(q) || c.customerId.toLowerCase().includes(q);
                      })
                      .map(conv => {
                        const cleanConvId = formatCustomerId(conv.customerId);
                        const isSelected = formatCustomerId(selectedChatCustId) === cleanConvId;
                        const unreadCount = unreadByCustomer[cleanConvId] || 0;
                        return (
                          <button
                            key={conv.customerId}
                            onClick={() => handleSelectCustomer(conv.customerId)}
                            className={`w-full p-3 text-left transition flex items-start gap-3 cursor-pointer ${
                              isSelected ? 'bg-red-50/80 border-l-4 border-red-700' : 'hover:bg-zinc-100'
                            }`}
                          >
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-xs font-mono">
                                {conv.customerName[0] || 'K'}
                              </div>
                              {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`font-bold text-xs truncate ${unreadCount > 0 ? 'text-red-700 font-extrabold' : 'text-zinc-900'}`}>
                                  {conv.customerName}
                                </span>
                                {conv.lastSentAt ? (
                                  <span className="text-[10px] text-zinc-400 font-mono shrink-0 ml-1">
                                    {conv.lastSentAt?.slice(11, 16) || conv.lastSentAt}
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono truncate">
                                Mã: {conv.customerId} {conv.phone ? `· ${conv.phone}` : ''}
                              </div>
                              <div className="text-[11px] text-zinc-600 truncate mt-0.5">
                                {conv.lastSender === 'staff' ? 'Bạn: ' : ''}{conv.lastMessage}
                              </div>
                            </div>
                          </button>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Right Column: Chat Window */}
              <div className="flex-1 flex flex-col bg-white">
                {/* Active Chat Header */}
                <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-red-700 text-white font-bold flex items-center justify-center text-xs font-mono shrink-0">
                      {chatConversations.find(c => formatCustomerId(c.customerId) === formatCustomerId(selectedChatCustId))?.customerName?.[0] || 'K'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900">
                          {chatConversations.find(c => formatCustomerId(c.customerId) === formatCustomerId(selectedChatCustId))?.customerName || `Khách hàng (${selectedChatCustId})`}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] text-emerald-600 font-mono font-bold">Trực tuyến</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        Mã khách hàng: {formatCustomerId(selectedChatCustId)} · Kênh hỗ trợ kỹ thuật & phụ tùng
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-zinc-50/60">
                  {activeChatMessages.length === 0 ? (
                    <div className="text-center py-16 text-zinc-400 text-xs">
                      Chưa có tin nhắn trong hội thoại này. Gửi lời chào để bắt đầu hỗ trợ!
                    </div>
                  ) : (
                    activeChatMessages.map(m => {
                      const isStaff = m.sender === 'staff';
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                        >
                          <div className="text-[10px] text-zinc-400 font-mono mb-0.5 px-1">
                            {m.senderName} · {m.sentAt}
                          </div>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                              isStaff
                                ? 'bg-red-700 text-white rounded-tr-xs shadow-xs'
                                : 'bg-white text-zinc-900 border border-zinc-200 rounded-tl-xs shadow-2xs'
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={adminChatScrollRef} />
                </div>

                {/* Quick Prompts */}
                <div className="px-4 py-2 bg-white border-t border-zinc-100 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 scrollbar-none">
                  {[
                    'Dạ em chào anh/chị ạ!',
                    'Showroom Motoshop xin hỗ trợ mình ngay.',
                    'Dạ phụ tùng chính hãng đang sẵn hàng ạ.',
                    'Em gửi thông tin bảo dưỡng cho mình nhé!',
                  ].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setChatInputText(p)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 shrink-0 transition cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Chat Input Bar */}
                <form onSubmit={handleAdminSendChat} className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Nhập nội dung tư vấn phản hồi tới khách hàng..."
                    value={chatInputText}
                    onChange={e => setChatInputText(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:border-red-600 font-medium"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <span>Gửi</span>
                    <span>➢</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
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
    shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    'shield-check': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  };
  return d[icon] ?? null;
}
