export type NotificationItemCategory =
  | 'customer'    // Khách hàng
  | 'review'      // Đánh giá
  | 'survey'      // Khảo sát
  | 'order'       // Đơn hàng
  | 'payment'     // Thanh toán
  | 'inventory'   // Kho hàng
  | 'system';     // Hệ thống

export type NotificationCategory = 'all' | NotificationItemCategory;

export interface CategoryMeta {
  key: NotificationCategory;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const NOTIFICATION_CATEGORIES: CategoryMeta[] = [
  { key: 'all', label: 'Tất cả', icon: '🔔', color: '#18181b', bgColor: '#f4f4f5' },
  { key: 'customer', label: 'Khách hàng', icon: '👤', color: '#2563eb', bgColor: '#eff6ff' },
  { key: 'review', label: 'Đánh giá', icon: '⭐', color: '#d97706', bgColor: '#fef3c7' },
  { key: 'survey', label: 'Khảo sát', icon: '📋', color: '#7c3aed', bgColor: '#f5f3ff' },
  { key: 'order', label: 'Đơn hàng', icon: '📦', color: '#059669', bgColor: '#ecfdf5' },
  { key: 'payment', label: 'Thanh toán', icon: '💳', color: '#0891b2', bgColor: '#ecfeff' },
  { key: 'inventory', label: 'Kho hàng', icon: '🏬', color: '#dc2626', bgColor: '#fef2f2' },
  { key: 'system', label: 'Hệ thống', icon: '⚙️', color: '#4b5563', bgColor: '#f3f4f6' },
];

export interface AdminNotification {
  id: string;
  category: NotificationItemCategory;
  type: string;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  read: boolean;
  linkPage: string;
  meta?: any;
}

const STORAGE_KEY = 'crm_admin_notifications';

const initialMockNotifications: AdminNotification[] = [
  {
    id: 'notif-kh-1',
    category: 'customer',
    type: 'customer_registered',
    title: 'Khách hàng mới đăng ký',
    message: 'Trương Vũ Hoàng Lộc vừa đăng ký tài khoản thành công qua cổng Khách hàng.',
    time: '10 phút trước',
    timestamp: Date.now() - 10 * 60 * 1000,
    read: false,
    linkPage: 'customers',
  },
  {
    id: 'notif-dg-1',
    category: 'review',
    type: 'review_submitted',
    title: 'Đánh giá 5 sao xe Honda SH 160i',
    message: 'Nguyễn Văn An gửi đánh giá: "Xe rất êm, máy bốc, hệ thống phanh ABS an toàn tuyệt đối".',
    time: '25 phút trước',
    timestamp: Date.now() - 25 * 60 * 1000,
    read: false,
    linkPage: 'feedback',
  },
  {
    id: 'notif-ks-1',
    category: 'survey',
    type: 'survey_submitted',
    title: 'Khảo sát CSAT bảo dưỡng mới',
    message: 'Trần Thị Bích hoàn thành khảo sát chất lượng dịch vụ bảo dưỡng Vespa (Đánh giá: 10/10 Rất hài lòng).',
    time: '40 phút trước',
    timestamp: Date.now() - 40 * 60 * 1000,
    read: false,
    linkPage: 'feedback',
  },
  {
    id: 'notif-dh-1',
    category: 'order',
    type: 'order_created',
    title: 'Đơn đặt phụ tùng mới #DH003',
    message: 'Đỗ Khoa Nam đặt mua Bộ nồi trước FCC Honda Lead 125 (Tổng tiền: 1.850.000 đ).',
    time: '1 giờ trước',
    timestamp: Date.now() - 60 * 60 * 1000,
    read: true,
    linkPage: 'sales',
  },
  {
    id: 'notif-tt-1',
    category: 'payment',
    type: 'payment_received',
    title: 'Thanh toán thành công qua VNPay',
    message: 'Đã nhận 1.850.000 đ từ Đỗ Khoa Nam cho đơn hàng #DH003 qua cổng VNPay-QR.',
    time: '1 giờ trước',
    timestamp: Date.now() - 65 * 60 * 1000,
    read: true,
    linkPage: 'sales',
  },
  {
    id: 'notif-kho-1',
    category: 'inventory',
    type: 'inventory_low',
    title: 'Cảnh báo tồn kho thấp',
    message: 'Bugi NGK Iridium CPR8EAIX-9 hiện chỉ còn 3 sản phẩm trong kho. Cần tạo phiếu nhập kho!',
    time: '2 giờ trước',
    timestamp: Date.now() - 120 * 60 * 1000,
    read: false,
    linkPage: 'parts',
  },
  {
    id: 'notif-ht-1',
    category: 'system',
    type: 'system_alert',
    title: 'Sao lưu dữ liệu hệ thống hoàn tất',
    message: 'Hệ thống CRM đã hoàn tất sao lưu cơ sở dữ liệu SQL Server định kỳ lúc 00:00.',
    time: '3 giờ trước',
    timestamp: Date.now() - 180 * 60 * 1000,
    read: true,
    linkPage: 'reports',
  },
];

export function getAdminNotifications(): AdminNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockNotifications));
      return initialMockNotifications;
    }
    const parsed: AdminNotification[] = JSON.parse(raw);
    // Ensure all items have a category
    return parsed.map(n => {
      if (!n.category) {
        if (n.type.includes('customer')) n.category = 'customer';
        else if (n.type.includes('review') || n.type.includes('feedback')) n.category = 'review';
        else if (n.type.includes('survey')) n.category = 'survey';
        else if (n.type.includes('order')) n.category = 'order';
        else if (n.type.includes('payment') || n.type.includes('paid')) n.category = 'payment';
        else if (n.type.includes('inventory') || n.type.includes('stock')) n.category = 'inventory';
        else n.category = 'system';
      }
      return n;
    });
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

export function addAdminNotification(
  item: Omit<AdminNotification, 'id' | 'timestamp' | 'read' | 'time' | 'category'> & { category?: NotificationItemCategory }
): AdminNotification {
  const current = getAdminNotifications();
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} hôm nay`;

  let category: NotificationItemCategory = item.category || 'system';
  if (!item.category) {
    if (item.type.includes('customer')) category = 'customer';
    else if (item.type.includes('review') || item.type.includes('feedback')) category = 'review';
    else if (item.type.includes('survey')) category = 'survey';
    else if (item.type.includes('order')) category = 'order';
    else if (item.type.includes('payment') || item.type.includes('paid')) category = 'payment';
    else if (item.type.includes('inventory') || item.type.includes('stock')) category = 'inventory';
    else category = 'system';
  }

  const newNotif: AdminNotification = {
    ...item,
    category,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: timeStr,
    timestamp: Date.now(),
    read: false,
  };

  const updated = [newNotif, ...current].slice(0, 50); // Giữ tối đa 50 thông báo gần nhất
  saveAdminNotifications(updated);

  window.dispatchEvent(new CustomEvent('crm-admin-notification', { detail: newNotif }));
  window.dispatchEvent(new CustomEvent('crm-notifications-updated'));
  window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: item.type } }));

  return newNotif;
}

export function markAllAsRead(category?: NotificationCategory): AdminNotification[] {
  const current = getAdminNotifications();
  const updated = current.map(n => {
    if (!category || category === 'all' || n.category === category) {
      return { ...n, read: true };
    }
    return n;
  });
  saveAdminNotifications(updated);
  window.dispatchEvent(new CustomEvent('crm-notifications-updated'));
  return updated;
}

export function markNotificationAsRead(id: string): AdminNotification[] {
  const current = getAdminNotifications();
  const updated = current.map(n => (n.id === id ? { ...n, read: true } : n));
  saveAdminNotifications(updated);
  window.dispatchEvent(new CustomEvent('crm-notifications-updated'));
  return updated;
}

export function deleteNotification(id: string): AdminNotification[] {
  const current = getAdminNotifications();
  const updated = current.filter(n => n.id !== id);
  saveAdminNotifications(updated);
  window.dispatchEvent(new CustomEvent('crm-notifications-updated'));
  return updated;
}

export function clearAllNotifications(category?: NotificationCategory): void {
  if (!category || category === 'all') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } else {
    const current = getAdminNotifications();
    const updated = current.filter(n => n.category !== category);
    saveAdminNotifications(updated);
  }
  window.dispatchEvent(new CustomEvent('crm-notifications-updated'));
}
