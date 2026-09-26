import { useState } from 'react';
import { mockOrders, mockAppointments, formatVND } from '../../data/mockData';

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
  const [activities, setActivities] = useState<ActivityEvent[]>(initialActivities);
  const [pendingOrders, setPendingOrders] = useState(mockOrders.filter(o => o.trangThai === 'ChoDuyet'));
  const [pendingAppts, setPendingAppts] = useState(mockAppointments.filter(a => a.trangThai === 'ChoDuyet'));

  const filteredEvents = activities.filter(act => {
    if (filter === 'all') return true;
    if (filter === 'customer') return act.type === 'customer';
    if (filter === 'admin') return act.type === 'admin';
    if (filter === 'urgent') return act.type === 'urgent' || act.status === 'warning';
    return true;
  });

  const handleApproveOrder = (id: string, name: string) => {
    setPendingOrders(prev => prev.filter(o => o.id !== id));
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
    setActivities(prev => [newAct, ...prev]);
  };

  const handleConfirmAppointment = (id: string, name: string) => {
    setPendingAppts(prev => prev.filter(a => a.id !== id));
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
    setActivities(prev => [newAct, ...prev]);
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">⚡</span>
            <span className="text-[11px] font-mono font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">24H QUA</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--color-zinc-900)' }}>
            {activities.length}
          </div>
          <div className="text-xs text-zinc-500 font-medium mt-1">Tổng sự kiện ghi nhận</div>
        </div>

        <div className="rounded-2xl p-5 bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">👥</span>
            <span className="text-[11px] font-mono font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">CUSTOMER</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#2563eb' }}>
            {activities.filter(a => a.type === 'customer').length}
          </div>
          <div className="text-xs text-zinc-500 font-medium mt-1">Tương tác từ Khách hàng</div>
        </div>

        <div className="rounded-2xl p-5 bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🛡️</span>
            <span className="text-[11px] font-mono font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">STAFF</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#dc2626' }}>
            {activities.filter(a => a.type === 'admin').length}
          </div>
          <div className="text-xs text-zinc-500 font-medium mt-1">Thao tác của Quản trị viên</div>
        </div>

        <div className="rounded-2xl p-5 bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">⚠️</span>
            <span className="text-[11px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">ACTION</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#d97706' }}>
            {pendingOrders.length + pendingAppts.length}
          </div>
          <div className="text-xs text-zinc-500 font-medium mt-1">Đơn & lịch hẹn cần duyệt</div>
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
