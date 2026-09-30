export interface AdminNotification {
  id: string;
  type: 'customer_registered' | 'appointment_booked' | 'order_created' | 'warranty_extended' | 'feedback_received' | 'survey_submitted';
  title: string;
  message: string;
  time: string;
  timestamp: number;
  read: boolean;
  linkPage: 'customers' | 'sales' | 'appointments' | 'feedback';
  meta?: any;
}

const STORAGE_KEY = 'crm_admin_notifications';

const initialMockNotifications: AdminNotification[] = [
  {
    id: 'notif-1',
    type: 'customer_registered',
    title: 'Khách hàng mới đăng ký',
    message: 'Trương Vũ Hoàng Lộc vừa đăng ký tài khoản thành công qua cổng Khách hàng.',
    time: '15 phút trước',
    timestamp: Date.now() - 15 * 60 * 1000,
    read: false,
    linkPage: 'customers',
  },
  {
    id: 'notif-2',
    type: 'appointment_booked',
    title: 'Lịch lái thử xe mới',
    message: 'Lê Hoàng Cường đặt lái thử Honda SH 160i ABS vào 10:00 ngày mai.',
    time: '35 phút trước',
    timestamp: Date.now() - 35 * 60 * 1000,
    read: false,
    linkPage: 'appointments',
  },
  {
    id: 'notif-3',
    type: 'order_created',
    title: 'Đơn đặt phụ tùng mới',
    message: 'Đỗ Khoa Nam đặt mua Bộ nồi trước FCC Honda Lead 125 (Tổng: 1.850.000 đ).',
    time: '1 giờ trước',
    timestamp: Date.now() - 60 * 60 * 1000,
    read: true,
    linkPage: 'sales',
  },
];

export function getAdminNotifications(): AdminNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockNotifications));
      return initialMockNotifications;
    }
    return JSON.parse(raw);
  } catch {
    return initialMockNotifications;
  }
}

export function saveAdminNotifications(list: AdminNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save notifications', e);
  }
}

export function addAdminNotification(item: Omit<AdminNotification, 'id' | 'timestamp' | 'read' | 'time'>): AdminNotification {
  const current = getAdminNotifications();
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} hôm nay`;

  const newNotif: AdminNotification = {
    ...item,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: timeStr,
    timestamp: Date.now(),
    read: false,
  };

  const updated = [newNotif, ...current].slice(0, 30); // Giữ tối đa 30 thông báo gần nhất
  saveAdminNotifications(updated);

  // Phát event cho tab hiện tại
  window.dispatchEvent(new CustomEvent('crm-admin-notification', { detail: newNotif }));
  window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: item.type } }));

  return newNotif;
}

export function markAllAsRead(): AdminNotification[] {
  const current = getAdminNotifications();
  const updated = current.map(n => ({ ...n, read: true }));
  saveAdminNotifications(updated);
  window.dispatchEvent(new CustomEvent('crm-notifications-updated'));
  return updated;
}

export function markNotificationAsRead(id: string): AdminNotification[] {
  const current = getAdminNotifications();
  const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
  saveAdminNotifications(updated);
  window.dispatchEvent(new CustomEvent('crm-notifications-updated'));
  return updated;
}

export function clearAllNotifications(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent('crm-notifications-updated'));
}
