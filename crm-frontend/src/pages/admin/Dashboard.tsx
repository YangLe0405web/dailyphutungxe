import { useState, useEffect, useMemo } from 'react';
import { type Order, type Appointment, type Customer, type InsuranceContract, formatVND } from '../../data/mockData';
import { orderApi, appointmentApi, customerApi, insuranceApi } from '../../services/api';
import { getAdminNotifications, type AdminNotification } from '../../services/notifications';

export type ActivityType = 'customer' | 'admin' | 'urgent';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  actor: string;
  actorRole: 'KhachHang' | 'SuperAdmin' | 'NhanVienBanHang' | 'NhanVienKyThuat';
  action: string;
  detail?: string;
  time: string;
  tag: string;
  status?: 'pending' | 'success' | 'warning';
  icon: string;
}

const initialActivities: ActivityEvent[] = [
  {
    id: 'ACT-001',
    type: 'customer',
    actor: 'Nguyễn Văn An',
    actorRole: 'KhachHang',
    action: 'vừa đặt mua phụ tùng trực tuyến',
    detail: 'Đơn hàng #DH001: Nhớt Motul 10W-40, Má phanh trước Exciter (185.000đ)',
    time: '2 phút trước',
    tag: '🛒 Mua hàng',
    status: 'pending',
    icon: '📦',
  },
  {
    id: 'ACT-002',
    type: 'admin',
    actor: 'Trần Văn Quản Lý',
    actorRole: 'SuperAdmin',
    action: 'đã phê duyệt đơn hàng #DH002',
    detail: 'Chuyển trạng thái đơn hàng sang "Đang giao" cho khách hàng Trần Thị Bích',
    time: '8 phút trước',
    tag: '✅ Duyệt đơn',
    status: 'success',
    icon: '🚚',
  },
  {
    id: 'ACT-003',
    type: 'customer',
    actor: 'Phạm Thị Dung',
    actorRole: 'KhachHang',
    action: 'đăng ký lịch lái thử xe mẫu',
    detail: 'Xe mẫu: Honda SH 160i ABS 2025 · Hẹn lúc 09:30 ngày mai tại Showroom',
    time: '15 phút trước',
    tag: '🏍️ Lái thử',
    status: 'pending',
    icon: '🛵',
  },
  {
    id: 'ACT-004',
    type: 'customer',
    actor: 'Lê Văn Test',
    actorRole: 'KhachHang',
    action: 'vừa đăng ký tài khoản khách hàng mới',
    detail: 'SĐT: 0999888777 · Địa chỉ: 123 Nguyễn Trãi, Q.5 · Kích hoạt thành công',
    time: '25 phút trước',
    tag: '👤 Đăng ký',
    status: 'success',
    icon: '🎉',
  },
  {
    id: 'ACT-005',
    type: 'admin',
    actor: 'Nguyễn Thị Sale',
    actorRole: 'NhanVienBanHang',
    action: 'đã xác nhận lịch hẹn bảo dưỡng',
    detail: 'Khách hàng: Nguyễn Văn An · Dịch vụ: Thay nhớt & Bảo dưỡng định kỳ #LH001',
    time: '35 phút trước',
    tag: '📅 Lịch hẹn',
    status: 'success',
    icon: '🛠️',
  },
  {
    id: 'ACT-006',
    type: 'customer',
    actor: 'Trần Thị Bích',
    actorRole: 'KhachHang',
    action: 'gửi đánh giá 5 sao cho dịch vụ showroom',
    detail: '"Nhân viên kỹ thuật tư vấn rất nhiệt tình, xe bảo dưỡng xong chạy êm ru!"',
    time: '1 giờ trước',
    tag: '⭐ Đánh giá',
    status: 'success',
    icon: '💬',
  },
  {
    id: 'ACT-007',
    type: 'admin',
    actor: 'Lê Văn Kỹ Thuật',
    actorRole: 'NhanVienKyThuat',
    action: 'cập nhật số lượng tồn kho phụ tùng',
    detail: 'Phụ tùng: Lốc xơ Air Blade 125 · Nhập thêm +30 sản phẩm vào kho',
    time: '1 giờ trước',
    tag: '⚙️ Kho hàng',
    status: 'success',
    icon: '📦',
  },
  {
    id: 'ACT-008',
    type: 'urgent',
    actor: 'Hoàng Văn Nam',
    actorRole: 'KhachHang',
    action: 'gửi khiếu nại về thời gian giao phụ tùng',
    detail: 'Đơn hàng giao trễ 1 ngày · Cần nhân viên CSKH liên hệ phản hồi gấp',
    time: '2 giờ trước',
    tag: '⚠️ Khiếu nại',
    status: 'warning',
    icon: '🚨',
  },
  {
    id: 'ACT-009',
    type: 'admin',
    actor: 'Trần Văn Quản Lý',
    actorRole: 'SuperAdmin',
    action: 'tạo bài khảo sát ý kiến khách hàng mới',
    detail: 'Tiêu đề: "Khảo sát nhu cầu xe tay ga điện thông minh 2026" (gửi tới toàn bộ KH)',
    time: '3 giờ trước',
    tag: '📋 Khảo sát',
    status: 'success',
    icon: '📝',
  },
  {
    id: 'ACT-010',
    type: 'customer',
    actor: 'Bùi Thị Kim',
    actorRole: 'KhachHang',
    action: 'đã hoàn thành bài khảo sát chất lượng',
    detail: 'Gửi kết quả trả lời 3 câu hỏi trắc nghiệm · Đạt mức hài lòng 100%',
    time: '4 giờ trước',
    tag: '✅ Khảo sát',
    status: 'success',
    icon: '📊',
  },
];

export default function DashboardPage() {
  const [filter, setFilter] = useState<'all' | 'customer' | 'admin' | 'urgent'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [insContracts, setInsContracts] = useState<InsuranceContract[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [localAdminActivities, setLocalAdminActivities] = useState<ActivityEvent[]>([]);

  const loadData = async () => {
    try {
      const [ordList, apptList, custList, insList] = await Promise.all([
        orderApi.getAll(),
        appointmentApi.getAll(),
        customerApi.getAll(),
        insuranceApi.getAll(),
      ]);
      setOrders(ordList);
      setAppts(apptList);
      setCustomers(custList);
      setInsContracts(insList);
      setNotifications(getAdminNotifications());
    } catch (err) {
      console.warn('Dashboard load error:', err);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('crm-data-refresh', loadData);
    return () => window.removeEventListener('crm-data-refresh', loadData);
  }, []);

  const pendingOrders = orders.filter(o => o.trangThai === 'ChoDuyet');
  const pendingAppts = appts.filter(a => a.trangThai === 'ChoDuyet');
  const pendingIns = insContracts.filter(c => c.trangThai === 'ChoDuyet');
  const activeIns = insContracts.filter(c => c.trangThai === 'HieuLuc');
  const insuranceRevenue = activeIns.reduce((sum, c) => sum + c.phiBaoHiem, 0);
  const totalRevenue = orders.filter(o => o.trangThai !== 'DaHuy').reduce((sum, o) => sum + (o.tongTien || 0), 0) + insuranceRevenue;

  const activities: ActivityEvent[] = useMemo(() => {
    const list: ActivityEvent[] = [...localAdminActivities];

    // Map notifications to activities
    notifications.forEach(n => {
      let icon = '⚡';
      let type: ActivityType = 'customer';
      let actor = 'Khách hàng';
      let tag = n.title;
      let status: 'pending' | 'success' | 'warning' = 'success';

      if (n.type === 'customer_registered') {
        icon = '👤';
        type = 'customer';
        actor = n.meta?.hoTen || 'Khách hàng';
        tag = '👤 Đăng ký';
      } else if (n.type === 'order_created') {
        icon = '📦';
        type = 'customer';
        actor = n.meta?.hoTenKH || 'Khách hàng';
        tag = '🛒 Mua hàng';
        status = 'pending';
      } else if (n.type === 'appointment_booked') {
        icon = n.meta?.loaiDichVu === 'LaiThu' ? '🏍️' : '📅';
        type = 'customer';
        actor = n.meta?.hoTenKH || 'Khách hàng';
        tag = n.meta?.loaiDichVu === 'LaiThu' ? '🏍️ Lái thử' : '🔧 Lịch hẹn';
        status = 'pending';
      } else if (n.type === 'feedback_received') {
        icon = n.meta?.loaiNhan === 'KhieuNai' ? '⚠️' : '⭐';
        type = n.meta?.loaiNhan === 'KhieuNai' ? 'urgent' : 'customer';
        actor = n.meta?.hoTen || 'Khách hàng';
        tag = n.meta?.loaiNhan === 'KhieuNai' ? '⚠️ Khiếu nại' : '⭐ Đánh giá';
        status = n.meta?.loaiNhan === 'KhieuNai' ? 'warning' : 'success';
      } else if (n.type === 'survey_submitted') {
        icon = '📊';
        type = 'customer';
        actor = n.meta?.customerName || 'Khách hàng';
        tag = '📋 Khảo sát';
      } else if (n.type === 'warranty_extended') {
        icon = '🛡️';
        type = 'customer';
        actor = 'Khách hàng';
        tag = '🛡️ Bảo hành';
      }

      list.push({
        id: n.id,
        type,
        actor,
        actorRole: 'KhachHang',
        action: n.title,
        detail: n.message,
        time: n.time,
        tag,
        status,
        icon,
      });
    });

    // Supplement with orders & appointments
    orders.slice(0, 4).forEach(o => {
      if (!list.some(x => x.detail?.includes(o.id))) {
        list.push({
          id: `ACT-${o.id}`,
          type: 'customer',
          actor: o.hoTenKH,
          actorRole: 'KhachHang',
          action: 'vừa đặt mua phụ tùng trực tuyến',
          detail: `Đơn hàng #${o.id} (${formatVND(o.tongTien)}) · ${o.items.map(i => `${i.tenSanPham} x${i.soLuong}`).join(', ')}`,
          time: o.ngayDat,
          tag: '🛒 Mua hàng',
          status: o.trangThai === 'ChoDuyet' ? 'pending' : 'success',
          icon: '📦',
        });
      }
    });

    appts.slice(0, 4).forEach(a => {
      if (!list.some(x => x.detail?.includes(a.id))) {
        list.push({
          id: `ACT-${a.id}`,
          type: 'customer',
          actor: a.hoTenKH,
          actorRole: 'KhachHang',
          action: a.loaiDichVu === 'LaiThu' ? 'đăng ký lịch lái thử xe mẫu' : 'đặt lịch hẹn bảo dưỡng sửa chữa',
          detail: `${a.loaiDichVu === 'LaiThu' ? 'Lái thử xe' : 'Bảo dưỡng'} lúc ${a.gioHen} ngày ${a.ngayHen} · Xe: ${a.tenXe || ''} (${a.bienSo || ''})`,
          time: a.ngayHen,
          tag: a.loaiDichVu === 'LaiThu' ? '🏍️ Lái thử' : '📅 Lịch hẹn',
          status: a.trangThai === 'ChoDuyet' ? 'pending' : 'success',
          icon: a.loaiDichVu === 'LaiThu' ? '🛵' : '🛠️',
        });
      }
    });

    insContracts.slice(0, 4).forEach(c => {
      if (!list.some(x => x.detail?.includes(c.id))) {
        list.push({
          id: `ACT-${c.id}`,
          type: 'customer',
          actor: c.hoTenKH,
          actorRole: 'KhachHang',
          action: 'vừa đăng ký bảo hiểm xe máy trực tuyến',
          detail: `HĐ #${c.id} (${c.tenGoi} - ${formatVND(c.phiBaoHiem)}) cho xe ${c.tenXe} (${c.bienSo})`,
          time: c.ngayBatDau,
          tag: '🛡️ Bảo hiểm',
          status: c.trangThai === 'ChoDuyet' ? 'pending' : 'success',
          icon: '🛡️',
        });
      }
    });

    // Fill with initial seed activities if sparse
    initialActivities.forEach(ia => {
      if (!list.some(x => x.id === ia.id)) list.push(ia);
    });

    return list;
  }, [notifications, orders, appts, insContracts, localAdminActivities]);

  const filteredEvents = activities.filter(act => {
    if (filter === 'all') return true;
    if (filter === 'customer') return act.type === 'customer';
    if (filter === 'admin') return act.type === 'admin';
    if (filter === 'urgent') return act.type === 'urgent' || act.status === 'warning';
    return true;
  });

  const handleApproveOrder = async (id: string, name: string) => {
    const maDonInt = parseInt(id.replace(/\D/g, ''), 10);
    if (!isNaN(maDonInt) && maDonInt > 0) {
      await orderApi.updateStatus(maDonInt, 'DangGiao');
    }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, trangThai: 'DangGiao' } : o));
    const newAct: ActivityEvent = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      type: 'admin',
      actor: 'Admin',
      actorRole: 'SuperAdmin',
      action: `vừa duyệt đơn hàng #${id}`,
      detail: `Khách hàng: ${name} · Chuyển sang trạng thái Đang giao`,
      time: 'Vừa xong',
      tag: '✅ Duyệt đơn',
      status: 'success',
      icon: '🚚',
    };
    setLocalAdminActivities(prev => [newAct, ...prev]);
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'order' } }));
  };

  const handleConfirmAppointment = async (id: string, name: string) => {
    const maLichInt = parseInt(id.replace(/\D/g, ''), 10);
    if (!isNaN(maLichInt) && maLichInt > 0) {
      await appointmentApi.updateStatus(maLichInt, 'DaXacNhan');
    }
    setAppts(prev => prev.map(a => a.id === id ? { ...a, trangThai: 'DaXacNhan' } : a));
    const newAct: ActivityEvent = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      type: 'admin',
      actor: 'Nhân viên',
      actorRole: 'NhanVienBanHang',
      action: `đã xác nhận lịch hẹn #${id}`,
      detail: `Khách hàng: ${name} · Đã xếp chỗ tại trạm bảo dưỡng`,
      time: 'Vừa xong',
      tag: '📅 Lịch hẹn',
      status: 'success',
      icon: '🛠️',
    };
    setLocalAdminActivities(prev => [newAct, ...prev]);
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'appointment' } }));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              DASHBOARD · HOẠT ĐỘNG HỆ THỐNG
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-sm mt-1 text-zinc-500">
            Dòng thời gian trực tiếp: Theo dõi hành động của Khách hàng và các thao tác xử lý của Ban quản trị
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="inline-flex rounded-xl p-1 bg-zinc-200 border border-zinc-300">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filter === 'all' ? 'bg-zinc-950 text-white shadow-sm' : 'text-zinc-700 hover:text-zinc-950'
            }`}
          >
            Tất cả ({activities.length})
          </button>
          <button
            onClick={() => setFilter('customer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filter === 'customer' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-700 hover:text-blue-700'
            }`}
          >
            👤 Khách hàng ({activities.filter(a => a.type === 'customer').length})
          </button>
          <button
            onClick={() => setFilter('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filter === 'admin' ? 'bg-red-700 text-white shadow-sm' : 'text-zinc-700 hover:text-red-700'
            }`}
          >
            🛡️ Admin / Nhân viên ({activities.filter(a => a.type === 'admin').length})
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filter === 'urgent' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-700 hover:text-amber-700'
            }`}
          >
            ⚠️ Chờ xử lý ({activities.filter(a => a.type === 'urgent' || a.status === 'warning').length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl p-5 bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">💰</span>
            <span className="text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">TỔNG DOANH THU</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--color-red-700)' }}>
            {formatVND(totalRevenue)}
          </div>
          <div className="text-xs text-zinc-500 font-medium mt-1">Đơn hàng & Phí bảo hiểm</div>
        </div>

        <div className="rounded-2xl p-5 bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">👥</span>
            <span className="text-[11px] font-mono font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">KHÁCH HÀNG</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#2563eb' }}>
            {customers.length}
          </div>
          <div className="text-xs text-zinc-500 font-medium mt-1">Khách hàng trong hệ thống CRM</div>
        </div>

        <div className="rounded-2xl p-5 bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📦</span>
            <span className="text-[11px] font-mono font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">ĐƠN HÀNG</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#7c3aed' }}>
            {orders.length}
          </div>
          <div className="text-xs text-zinc-500 font-medium mt-1">Tổng đơn mua phụ tùng & xe</div>
        </div>

        <div className="rounded-2xl p-5 bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🛡️</span>
            <span className="text-[11px] font-mono font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">BẢO HIỂM XE</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--color-red-700)' }}>
            {activeIns.length}
          </div>
          <div className="text-xs text-zinc-500 font-medium mt-1">
            {formatVND(insuranceRevenue)} doanh thu
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white border border-zinc-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">⚠️</span>
            <span className="text-[11px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">CẦN XỬ LÝ</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#d97706' }}>
            {pendingOrders.length + pendingAppts.length + pendingIns.length}
          </div>
          <div className="text-xs text-zinc-500 font-medium mt-1">Đơn ({pendingOrders.length}) · Lịch ({pendingAppts.length}) · BH ({pendingIns.length})</div>
        </div>
      </div>

      {/* Main Content Grid: Activity Stream (Left) + Quick Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Stream (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold font-mono text-zinc-800 uppercase tracking-wider">
              DÒNG SỰ KIỆN THỜI GIAN THỰC ({filteredEvents.length} HOẠT ĐỘNG)
            </h3>
            <span className="text-[11px] text-zinc-400 font-mono">Tự động cập nhật</span>
          </div>

          <div className="space-y-3">
            {filteredEvents.map(evt => {
              const isCust = evt.type === 'customer';
              const isUrgent = evt.type === 'urgent' || evt.status === 'warning';

              return (
                <div
                  key={evt.id}
                  className={`p-4 rounded-2xl bg-white border transition shadow-2xs hover:shadow-xs flex items-start gap-4 ${
                    isUrgent ? 'border-amber-300 bg-amber-50/20' : 'border-zinc-200'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    isUrgent ? 'bg-amber-100 text-amber-800' : isCust ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {evt.icon}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-semibold text-zinc-900">{evt.actor}</strong>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          isCust ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                        }`}>
                          {evt.actorRole === 'KhachHang' ? 'Khách hàng' : evt.actorRole === 'SuperAdmin' ? 'Super Admin' : evt.actorRole === 'NhanVienBanHang' ? 'NV Bán Hàng' : 'NV Kỹ Thuật'}
                        </span>
                        <span className="text-xs text-zinc-600">{evt.action}</span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400 shrink-0">{evt.time}</span>
                    </div>

                    {evt.detail && (
                      <p className="text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 font-mono mt-1">
                        {evt.detail}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-1">
                      <span className="text-[11px] font-semibold text-zinc-500 font-mono">
                        {evt.tag} · Mã: {evt.id}
                      </span>
                      {isUrgent && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          Cần can thiệp
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Quick Action Panels */}
        <div className="space-y-6">
          {/* Action Box 1: Pending Orders */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="font-bold text-sm text-zinc-900 uppercase font-mono flex items-center gap-2">
                <span>📦</span> Đơn Chờ Duyệt ({pendingOrders.length})
              </div>
              <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-bold">Cần gửi hàng</span>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400">
                ✓ Đã duyệt toàn bộ đơn hàng!
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingOrders.map(o => (
                  <div key={o.id} className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-zinc-900">{o.hoTenKH}</div>
                        <div className="text-[10px] font-mono text-zinc-400">#{o.id} · {o.ngayDat}</div>
                      </div>
                      <span className="text-xs font-bold text-red-700 font-mono">{formatVND(o.tongTien)}</span>
                    </div>
                    <button
                      onClick={() => handleApproveOrder(o.id, o.hoTenKH)}
                      className="w-full py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                    >
                      ✓ Phê duyệt đơn hàng
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Box 2: Pending Appointments */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="font-bold text-sm text-zinc-900 uppercase font-mono flex items-center gap-2">
                <span>📅</span> Lịch Hẹn Mới ({pendingAppts.length})
              </div>
              <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">Cần xếp lịch</span>
            </div>

            {pendingAppts.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400">
                ✓ Đã xác nhận toàn bộ lịch hẹn!
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingAppts.map(a => (
                  <div key={a.id} className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-zinc-900">{a.hoTenKH}</div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          {a.loaiDichVu === 'BaoDuong' ? 'Bảo dưỡng' : a.loaiDichVu === 'SuaChua' ? 'Sửa chữa' : 'Lái thử'} · {a.gioHen}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConfirmAppointment(a.id, a.hoTenKH)}
                      className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                    >
                      ✓ Xác nhận lịch hẹn
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
