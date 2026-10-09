import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  mockOrders,
  mockParts,
  mockCustomers,
  formatVND,
  type OrderStatus,
  type PaymentStatus,
  type OrderChannel,
  type OrderType,
  type Order,
  type Part,
  type Customer,
  type StaffAccount,
  type VehicleOrderDetails,
  type VehicleChecklist,
  type Appointment,
} from '../../data/mockData';
import { orderApi, customerApi, partApi, appointmentApi, vehicleApi, insuranceApi } from '../../services/api';
import { showroomVehicles } from '../customer/VehiclesShowroom';

// ── Status Configs ──
const orderStatuses: { key: OrderStatus; label: string; color: string; bg: string }[] = [
  { key: 'ChoDuyet', label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
  { key: 'DaXacNhan', label: 'Đã xác nhận', color: '#0284c7', bg: '#e0f2fe' },
  { key: 'DangGiao', label: 'Đang giao', color: '#2563eb', bg: '#dbeafe' },
  { key: 'ChoGiaoXe', label: 'Chờ giao xe', color: '#0284c7', bg: '#e0f2fe' },
  { key: 'HoanThanh', label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7' },
  { key: 'DaHuy', label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
];

const paymentStatuses: { key: PaymentStatus; label: string; color: string; bg: string }[] = [
  { key: 'ChuaThanhToan', label: 'Chưa thanh toán', color: '#dc2626', bg: '#fee2e2' },
  { key: 'DaCoc', label: 'Đã đặt cọc', color: '#d97706', bg: '#fef3c7' },
  { key: 'DaThanhToan', label: 'Đã thanh toán', color: '#16a34a', bg: '#dcfce7' },
];

const channelConfigs: Record<OrderChannel, { label: string; icon: string; bg: string; color: string }> = {
  TaiQuay: { label: 'Tại quầy', icon: '🏪', bg: '#f4f4f5', color: '#3f3f46' },
  Online: { label: 'Online Web', icon: '🌐', bg: '#eff6ff', color: '#1d4ed8' },
};

function StatusBadge({ status, configs }: { status: string; configs: { key: string; label: string; color: string; bg: string }[] }) {
  const cfg = configs.find(c => c.key === status) ?? { label: status, color: '#71717a', bg: '#f4f4f5' };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-xs font-semibold px-2.5 py-1"
      style={{ background: cfg.bg, color: cfg.color, fontFamily: 'var(--font-mono)' }}
    >
      <span className="rounded-full" style={{ width: 6, height: 6, background: cfg.color, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
}

const thSt: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 11,
  fontWeight: 700,
  textAlign: 'left',
  color: 'var(--color-zinc-500)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontFamily: 'var(--font-mono)',
  whiteSpace: 'nowrap',
};
const tdSt: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: 13,
  color: 'var(--color-zinc-800)',
  borderTop: '1px solid var(--color-zinc-100)',
};

export interface SalesPageProps {
  currentStaff?: StaffAccount | null;
  initialPreFillVehicleOrder?: Appointment | null;
  onClearPreFill?: () => void;
}

export default function SalesPage({
  currentStaff,
  initialPreFillVehicleOrder,
  onClearPreFill,
}: SalesPageProps) {
  // ── ĐH08: Tách danh sách đơn hàng thành 2 Tab riêng biệt ──
  const [activeOrderTypeTab, setActiveOrderTypeTab] = useState<'Xe' | 'PhuTung'>('Xe');

  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [partsList, setPartsList] = useState<Part[]>(mockParts);
  const [customersList, setCustomersList] = useState<Customer[]>(mockCustomers);

  // ── ĐH04: Bộ lọc & Tìm kiếm đơn hàng ──
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [channelFilter, setChannelFilter] = useState<'ALL' | OrderChannel>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'ALL' | 'TienMat' | 'ChuyenKhoan' | 'TraGop'>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dropdown menu "+ Thêm đơn hàng" (ĐH06)
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Highlight đơn hàng khi nhảy từ trung tâm thông báo Admin
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);

  // Modal tạo đơn phụ tùng tại quầy (ĐH06 Option 1)
  const [showCreatePartsModal, setShowCreatePartsModal] = useState(false);

  // Modal tạo đơn bán xe mới (ĐH06 Option 2 & Ảnh 2)
  const [showCreateVehicleModal, setShowCreateVehicleModal] = useState(false);

  // Modal Chi tiết đơn hàng (ĐH07)
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);

  // Modal In hóa đơn (ĐH07)
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

  // Xóa đơn hàng (ĐH05)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Load orders & catalogs
  useEffect(() => {
    let isMounted = true;
    const loadData = () => {
      orderApi.getAll().then(data => {
        if (isMounted && data && data.length > 0) setOrders(data);
      });
      partApi.getAll().then(data => {
        if (isMounted && data && data.length > 0) setPartsList(data);
      });
      customerApi.getAll().then(data => {
        if (isMounted && data && data.length > 0) setCustomersList(data);
      });
    };

    loadData();

    const handleRefresh = (e: any) => {
      const type = e.detail?.type;
      if (!type || type === 'order' || type === 'order_created' || type === 'order_deleted') {
        loadData();
      }
    };

    window.addEventListener('crm-data-refresh', handleRefresh);
    window.addEventListener('crm-admin-notification', handleRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener('crm-data-refresh', handleRefresh);
      window.removeEventListener('crm-admin-notification', handleRefresh);
    };
  }, []);

  // Handle prefill from Appointments (D. BÁN XE -> Chuyển thẳng sang POS)
  useEffect(() => {
    if (initialPreFillVehicleOrder) {
      setActiveOrderTypeTab('Xe');
      setShowCreateVehicleModal(true);
      // Pre-fill state will be handled inside VehicleModal
    }
  }, [initialPreFillVehicleOrder]);

  // Lắng nghe và kích hoạt highlight đối tượng đơn hàng từ Trung tâm thông báo Admin
  useEffect(() => {
    const handleHighlight = (payload?: any) => {
      let data = payload;
      if (!data) {
        try {
          const raw = sessionStorage.getItem('crm_admin_highlight');
          if (raw) data = JSON.parse(raw);
        } catch {}
      }
      if (!data || data.page !== 'sales') return;

      const targetId = (data.targetId || '').trim();
      const keyword = (data.keyword || '').trim();

      const match = orders.find(o =>
        (targetId && o.id.toLowerCase() === targetId.toLowerCase()) ||
        (keyword && (o.id.toLowerCase().includes(keyword.toLowerCase()) || o.hoTenKH.toLowerCase().includes(keyword.toLowerCase())))
      );

      const targetOrder = match || (targetId ? orders.find(o => o.id === targetId) : undefined);

      if (targetOrder) {
        if (targetOrder.loaiDon === 'Xe' || targetOrder.thongTinXe) {
          setActiveOrderTypeTab('Xe');
        } else {
          setActiveOrderTypeTab('PhuTung');
        }
        setOrderSearch(targetOrder.id);
        setHighlightOrderId(targetOrder.id);

        setTimeout(() => {
          const el = document.getElementById(`order-row-${targetOrder.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);

        setTimeout(() => {
          setHighlightOrderId(null);
        }, 7000);
      } else if (targetId) {
        setOrderSearch(targetId);
        setHighlightOrderId(targetId);
        setTimeout(() => setHighlightOrderId(null), 7000);
      }

      sessionStorage.removeItem('crm_admin_highlight');
    };

    handleHighlight();

    const onEvent = (e: any) => handleHighlight(e.detail);
    window.addEventListener('crm-admin-highlight-target', onEvent);
    return () => window.removeEventListener('crm-admin-highlight-target', onEvent);
  }, [orders]);

  // Close add menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Update status directly from table (ĐH05)
  const handleUpdateStatus = (id: string, newStatus: OrderStatus) => {
    const target = orders.find(o => o.id === id);
    if (target && target.trangThai === 'DaHuy') {
      alert('Đơn hàng đã ở trạng thái ĐÃ HỦY. Bắt buộc giữ nguyên trạng thái Đã hủy, không được thay đổi!');
      return;
    }
    orderApi.updateStatus(id, newStatus);
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, trangThai: newStatus } : o)));
    if (selectedOrderForDetail && selectedOrderForDetail.id === id) {
      setSelectedOrderForDetail(prev => (prev ? { ...prev, trangThai: newStatus } : null));
    }
  };

  // Delete order (ĐH05)
  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    await orderApi.delete(orderToDelete.id);
    setOrders(prev => prev.filter(o => o.id !== orderToDelete.id));
    setOrderToDelete(null);
  };

  // Quick date presets (ĐH04)
  const setQuickDate = (preset: 'today' | '7days' | '30days' | 'all') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (preset === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setFromDate(past.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setFromDate(past.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else {
      setFromDate('');
      setToDate('');
    }
  };

  // ── ĐH09: KPI Cards tính toán thời gian thực ──
  const kpiStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(o => o.trangThai !== 'DaHuy')
      .reduce((sum, o) => sum + (o.tongTien || 0), 0);
    const pendingApproval = orders.filter(o => o.trangThai === 'ChoDuyet').length;
    const waitingVehicleDelivery = orders.filter(o => o.loaiDon === 'Xe' && (o.trangThai === 'ChoGiaoXe' || o.trangThai === 'ChoDuyet')).length;
    const waitingDepositOrDeposited = orders.filter(o => o.trangThaiThanhToan === 'DaCoc' || o.trangThaiThanhToan === 'ChuaThanhToan').length;

    return {
      totalOrders,
      totalRevenue,
      pendingApproval,
      waitingVehicleDelivery,
      waitingDepositOrDeposited,
    };
  }, [orders]);

  // Filter orders by active tab (ĐH08) and filters (ĐH04)
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // 1. Phân loại đơn: Xe hoặc Phụ tùng
      const orderType = o.loaiDon || 'PhuTung';
      if (orderType !== activeOrderTypeTab) return false;

      // 2. Trạng thái đơn hàng
      if (orderStatusFilter !== 'ALL' && o.trangThai !== orderStatusFilter) return false;

      // 3. Trạng thái thanh toán
      if (paymentFilter !== 'ALL' && o.trangThaiThanhToan !== paymentFilter) return false;

      // 4. Kênh bán (Tại quầy / Online)
      if (channelFilter !== 'ALL' && (o.kenhBan || 'Online') !== channelFilter) return false;

      // 5. Phương thức thanh toán
      if (paymentMethodFilter !== 'ALL' && o.phuongThucThanhToan !== paymentMethodFilter) return false;

      // 6. Thời gian
      if (fromDate && o.ngayDat < fromDate) return false;
      if (toDate && o.ngayDat > toDate) return false;

      // 7. Ô tìm kiếm: Mã đơn, Khách hàng, SĐT
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const matchId = o.id.toLowerCase().includes(q);
        const matchName = o.hoTenKH.toLowerCase().includes(q);
        const matchPhone = (o.soDienThoai || '').toLowerCase().includes(q);
        const matchVehicle = o.thongTinXe?.tenXe.toLowerCase().includes(q) || false;
        const matchVin = o.thongTinXe?.soKhungVIN?.toLowerCase().includes(q) || false;
        if (!matchId && !matchName && !matchPhone && !matchVehicle && !matchVin) return false;
      }

      return true;
    });
  }, [
    orders,
    activeOrderTypeTab,
    orderStatusFilter,
    paymentFilter,
    channelFilter,
    paymentMethodFilter,
    fromDate,
    toDate,
    orderSearch,
  ]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* ── HEADER & NÚT THÊM ĐƠN HÀNG (ĐH06) ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <h1
              className="text-2xl font-extrabold text-zinc-950 tracking-tight"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
            >
              QUẢN LÝ ĐƠN HÀNG BÁN HÀNG
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Quản lý doanh số, theo dõi đơn bán xe mới và đơn bán phụ tùng tại quầy / trực tuyến.
          </p>
        </div>

        {/* Nút + Thêm đơn hàng với Dropdown Menu (ĐH06) */}
        <div className="relative" ref={addMenuRef}>
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-md shadow-red-700/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+</span>
            <span>Thêm đơn hàng</span>
            <span className="text-[10px]">▼</span>
          </button>

          {showAddMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-zinc-200 py-2 z-50">
              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false);
                  setShowCreatePartsModal(true);
                }}
                className="w-full px-4 py-3 text-left hover:bg-zinc-50 flex items-start gap-3 transition cursor-pointer"
              >
                <span className="text-xl p-1.5 rounded-lg bg-zinc-100">🔧</span>
                <div>
                  <div className="font-bold text-xs text-zinc-900">Bán phụ tùng tại quầy</div>
                  <div className="text-[11px] text-zinc-500">Tạo đơn bán dầu nhớt, lốp xe, phụ kiện</div>
                </div>
              </button>

              <div className="border-t border-zinc-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false);
                  setShowCreateVehicleModal(true);
                }}
                className="w-full px-4 py-3 text-left hover:bg-red-50/50 flex items-start gap-3 transition cursor-pointer"
              >
                <span className="text-xl p-1.5 rounded-lg bg-red-100 text-red-700">🏍️</span>
                <div>
                  <div className="font-bold text-xs text-red-700">Bán xe mới (POS Bán Xe)</div>
                  <div className="text-[11px] text-zinc-500">Hợp đồng bán xe, thuế, biển số, số VIN & bảo hiểm</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── ĐH09: THẺ CHỈ SỐ KPI ĐƠN HÀNG NỔI BẬT ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Doanh thu & Tổng đơn */}
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>TỔNG ĐƠN HÀNG</span>
            <span className="text-base">📊</span>
          </div>
          <div className="text-2xl font-extrabold text-zinc-950 font-mono mt-1">
            {kpiStats.totalOrders} <span className="text-xs font-normal text-zinc-500">đơn</span>
          </div>
          <div className="text-xs font-bold text-emerald-700 font-mono mt-0.5 truncate">
            {formatVND(kpiStats.totalRevenue)}
          </div>
        </div>

        {/* Card 2: Đơn chờ duyệt */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-mono font-bold">
            <span>⏳ ĐƠN CHỜ DUYỆT</span>
            <span className="text-base">⚠️</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono mt-1">
            {kpiStats.pendingApproval}
          </div>
          <div className="text-[11px] text-amber-800 mt-0.5">Cần duyệt & đóng gói</div>
        </div>

        {/* Card 3: Đơn chờ giao xe */}
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-blue-800 font-mono font-bold">
            <span>🏍️ ĐƠN CHỜ GIAO XE</span>
            <span className="text-base">🚀</span>
          </div>
          <div className="text-2xl font-extrabold text-blue-700 font-mono mt-1">
            {kpiStats.waitingVehicleDelivery}
          </div>
          <div className="text-[11px] text-blue-800 mt-0.5">Xe mới chờ đón khách</div>
        </div>

        {/* Card 4: Đơn chờ thanh toán / Đã cọc */}
        <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-purple-800 font-mono font-bold">
            <span>💰 ĐÃ CỌC / CHỜ THU</span>
            <span className="text-base">💳</span>
          </div>
          <div className="text-2xl font-extrabold text-purple-700 font-mono mt-1">
            {kpiStats.waitingDepositOrDeposited}
          </div>
          <div className="text-[11px] text-purple-800 mt-0.5">Cần thu nốt tiền khi giao</div>
        </div>
      </div>

      {/* ── ĐH08: TÁCH 2 TAB RIÊNG BIỆT (ĐƠN HÀNG XE & ĐƠN HÀNG PHỤ TÙNG) ── */}
      <div className="flex border-b border-zinc-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveOrderTypeTab('Xe')}
          className={`pb-3 text-sm font-extrabold uppercase tracking-wider transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeOrderTypeTab === 'Xe'
              ? 'border-red-700 text-red-700'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <span>🏍️</span>
          <span>Đơn Hàng Xe Mới</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-red-100 text-red-700">
            {orders.filter(o => o.loaiDon === 'Xe').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveOrderTypeTab('PhuTung')}
          className={`pb-3 text-sm font-extrabold uppercase tracking-wider transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeOrderTypeTab === 'PhuTung'
              ? 'border-red-700 text-red-700'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <span>🔧</span>
          <span>Đơn Hàng Phụ Tùng & Phụ Kiện</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-zinc-100 text-zinc-700">
            {orders.filter(o => o.loaiDon !== 'Xe').length}
          </span>
        </button>
      </div>

      {/* ── ĐH04: THANH TÌM KIẾM VÀ BỘ LỌC ĐA NĂNG ── */}
      <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Ô tìm kiếm */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-zinc-500 uppercase font-mono mb-1">
              Tìm kiếm đơn hàng
            </label>
            <input
              type="text"
              placeholder="Nhập mã đơn, tên khách hàng, số điện thoại, số VIN..."
              value={orderSearch}
              onChange={e => setOrderSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white"
            />
          </div>

          {/* 2. Trạng thái giao hàng / đơn */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase font-mono mb-1">
              Trạng thái đơn
            </label>
            <select
              value={orderStatusFilter}
              onChange={e => setOrderStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              {orderStatuses.map(s => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Trạng thái thanh toán */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase font-mono mb-1">
              Thanh toán
            </label>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white"
            >
              <option value="ALL">Tất cả thanh toán</option>
              {paymentStatuses.map(p => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Kênh bán */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase font-mono mb-1">
              Kênh bán
            </label>
            <select
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white"
            >
              <option value="ALL">Tất cả kênh bán</option>
              <option value="TaiQuay">🏪 Bán tại quầy</option>
              <option value="Online">🌐 Đặt online qua Web</option>
            </select>
          </div>
        </div>

        {/* Dòng 2: Bộ lọc thời gian & Phương thức thanh toán */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-zinc-100">
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase font-mono mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase font-mono mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase font-mono mb-1">
              Phương thức thanh toán
            </label>
            <select
              value={paymentMethodFilter}
              onChange={e => setPaymentMethodFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white"
            >
              <option value="ALL">Tất cả hình thức</option>
              <option value="TienMat">💵 Tiền mặt</option>
              <option value="ChuyenKhoan">🏦 Chuyển khoản ngân hàng</option>
              <option value="TraGop">📋 Trả góp</option>
            </select>
          </div>

          <div className="flex items-end pb-0.5">
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-zinc-400 font-mono text-[10px]">Nhanh:</span>
              <button
                type="button"
                onClick={() => setQuickDate('today')}
                className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setQuickDate('7days')}
                className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold"
              >
                7 ngày
              </button>
              <button
                type="button"
                onClick={() => setQuickDate('all')}
                className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold"
              >
                Tất cả
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs font-mono text-zinc-500 pt-1">
          <div>
            Đang hiển thị <strong>{filteredOrders.length}</strong> đơn hàng{' '}
            {activeOrderTypeTab === 'Xe' ? 'Xe mới' : 'Phụ tùng'}
          </div>
        </div>
      </div>

      {/* ── ĐH05: BẢNG DỮ LIỆU QUẢN LÝ ĐƠN HÀNG ── */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-zinc-950 text-white">
                <th style={{ ...thSt, color: 'white' }}>MÃ ĐƠN HÀNG</th>
                <th style={{ ...thSt, color: 'white' }}>NGÀY TẠO</th>
                <th style={{ ...thSt, color: 'white' }}>KHÁCH HÀNG</th>
                {activeOrderTypeTab === 'Xe' ? (
                  <>
                    <th style={{ ...thSt, color: 'white' }}>MẪU XE & MÀU</th>
                    <th style={{ ...thSt, color: 'white' }}>SỐ KHUNG (VIN)</th>
                    <th style={{ ...thSt, color: 'white' }}>TIỀN ĐẶT CỌC</th>
                  </>
                ) : (
                  <th style={{ ...thSt, color: 'white' }}>SẢN PHẨM PHỤ TÙNG</th>
                )}
                <th style={{ ...thSt, color: 'white' }}>TỔNG TIỀN</th>
                <th style={{ ...thSt, color: 'white' }}>KÊNH BÁN</th>
                <th style={{ ...thSt, color: 'white' }}>THANH TOÁN</th>
                <th style={{ ...thSt, color: 'white' }}>TRẠNG THÁI</th>
                <th style={{ ...thSt, color: 'white', textAlign: 'center' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={activeOrderTypeTab === 'Xe' ? 10 : 8} className="py-12 text-center text-zinc-400 text-sm">
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isVehicle = order.loaiDon === 'Xe';
                  const chCfg = channelConfigs[order.kenhBan || 'Online'] || channelConfigs.Online;

                  return (
                    <tr
                      key={order.id}
                      id={`order-row-${order.id}`}
                      className={`transition-all duration-300 border-t border-zinc-100 ${
                        highlightOrderId === order.id
                          ? 'bg-amber-100/95 ring-4 ring-red-600 ring-inset shadow-xl animate-pulse font-bold'
                          : 'hover:bg-zinc-50'
                      }`}
                    >
                      {/* Cột 1: Mã đơn */}
                      <td style={tdSt}>
                        <div className="font-mono font-bold text-zinc-900 flex items-center gap-1.5 flex-wrap">
                          <span>#{order.id}</span>
                          {highlightOrderId === order.id && (
                            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider animate-bounce shadow-sm flex items-center gap-0.5">
                              <span>★</span> ĐANG XEM
                            </span>
                          )}
                          {order.maLichHen && (
                            <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                              {order.maLichHen}
                            </span>
                          )}
                        </div>
                        {order.maNV && (
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            NV: {order.tenNV || order.maNV}
                          </div>
                        )}
                      </td>

                      {/* Cột 2: Ngày tạo */}
                      <td style={tdSt}>
                        <div className="font-mono text-zinc-700">{order.ngayDat}</div>
                      </td>

                      {/* Cột 3: Khách hàng */}
                      <td style={tdSt}>
                        <div className="font-bold text-zinc-900">{order.hoTenKH}</div>
                        <div className="text-xs text-zinc-500 font-mono">{order.soDienThoai || 'Chưa có SĐT'}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{order.customerId}</div>
                      </td>

                      {/* Cột đặc thù Xe */}
                      {isVehicle ? (
                        <>
                          <td style={tdSt}>
                            <div className="font-bold text-zinc-900">{order.thongTinXe?.tenXe || 'Xe máy'}</div>
                            <div className="text-xs text-zinc-500">
                              Màu: <strong>{order.thongTinXe?.mauSac || 'Tiêu chuẩn'}</strong>
                            </div>
                            {order.thongTinXe?.phienBan && (
                              <div className="text-[10px] text-zinc-400">{order.thongTinXe.phienBan}</div>
                            )}
                          </td>

                          <td style={tdSt}>
                            {order.thongTinXe?.soKhungVIN ? (
                              <div className="font-mono text-xs font-semibold text-zinc-800 bg-zinc-100 px-2 py-1 rounded inline-block">
                                {order.thongTinXe.soKhungVIN}
                              </div>
                            ) : (
                              <span className="text-xs text-amber-600 font-medium italic">Chưa nhập VIN</span>
                            )}
                          </td>

                          <td style={tdSt}>
                            <div className="font-mono font-bold text-emerald-700 text-xs">
                              {formatVND(order.thongTinXe?.soTienDatCoc || 0)}
                            </div>
                            {order.thongTinXe?.soTienConLai ? (
                              <div className="text-[10px] text-red-700 font-mono">
                                Còn: {formatVND(order.thongTinXe.soTienConLai)}
                              </div>
                            ) : (
                              <div className="text-[10px] text-emerald-700 font-mono">Đã thu 100%</div>
                            )}
                          </td>
                        </>
                      ) : (
                        /* Cột đặc thù Phụ tùng */
                        <td style={tdSt}>
                          <div className="text-xs font-medium text-zinc-900 truncate max-w-[200px]">
                            {order.items && order.items.length > 0
                              ? order.items.map(i => `${i.tenSanPham} (x${i.soLuong})`).join(', ')
                              : 'Phụ tùng chính hãng'}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {order.items?.length || 0} sản phẩm
                          </div>
                        </td>
                      )}

                      {/* Cột Tổng tiền */}
                      <td style={tdSt}>
                        <div className="font-mono font-extrabold text-red-700 text-sm">
                          {formatVND(order.tongTien)}
                        </div>
                      </td>

                      {/* Cột Kênh bán */}
                      <td style={tdSt}>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold font-mono"
                          style={{ background: chCfg.bg, color: chCfg.color }}
                        >
                          <span>{chCfg.icon}</span>
                          <span>{chCfg.label}</span>
                        </span>
                      </td>

                      {/* Cột Trạng thái thanh toán */}
                      <td style={tdSt}>
                        <StatusBadge
                          status={order.trangThaiThanhToan || 'DaThanhToan'}
                          configs={paymentStatuses}
                        />
                      </td>

                      {/* Cột Trạng thái giao hàng */}
                      <td style={tdSt}>
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge status={order.trangThai} configs={orderStatuses} />
                          {/* Đã hủy: KHÓA BẮT BUỘC, không hiển thị dropdown */}
                          {order.trangThai === 'DaHuy' ? (
                            <span className="text-[10px] text-zinc-400 font-mono italic mt-0.5 flex items-center gap-1">
                              🔒 Khóa (Đã hủy)
                            </span>
                          ) : (
                            <select
                              value={order.trangThai}
                              onChange={e => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                              className="text-[11px] p-1 rounded border border-zinc-200 bg-white font-mono mt-1 focus:outline-none cursor-pointer"
                            >
                              {orderStatuses
                                .filter(s => s.key !== 'DaHuy')
                                .map(s => (
                                  <option key={s.key} value={s.key}>
                                    {s.label}
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Cột Thao tác trực tiếp (ĐH05 & ĐH07) */}
                      <td style={{ ...tdSt, textAlign: 'center' }}>
                        <div className="flex items-center gap-1.5 justify-center flex-wrap min-w-[170px]">
                          {/* Nút thao tác chuyển trạng thái nhanh theo quy trình */}
                          {order.trangThai === 'ChoDuyet' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'DaXacNhan')}
                              title="Xác nhận đơn hàng"
                              className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border border-blue-200"
                            >
                              <span>✓</span> Xác nhận
                            </button>
                          )}
                          {order.trangThai === 'DaXacNhan' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'DangGiao')}
                              title="Bắt đầu giao hàng (Tự động khóa hủy phía khách)"
                              className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border border-indigo-200"
                            >
                              <span>🚚</span> Giao hàng
                            </button>
                          )}
                          {order.trangThai === 'DangGiao' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'HoanThanh')}
                              title="Xác nhận đã giao hàng thành công (Chốt doanh thu & trừ kho thực tế)"
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border border-emerald-200"
                            >
                              <span>✅</span> Hoàn tất
                            </button>
                          )}

                          {/* Nút Xem chi tiết (ĐH07) */}
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForDetail(order)}
                            title="Xem chi tiết đơn hàng"
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                          >
                            👁️
                          </button>

                          {/* Nút In hóa đơn (ĐH07) */}
                          <button
                            type="button"
                            onClick={() => setOrderToPrint(order)}
                            title="In hóa đơn bán hàng"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                          >
                            🧾
                          </button>

                          {/* Nút Xóa (ĐH05) */}
                          <button
                            type="button"
                            onClick={() => setOrderToDelete(order)}
                            title="Xóa đơn hàng"
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════ MODAL: TẠO ĐƠN BÁN PHỤ TÙNG TẠI QUẦY (ĐH06 OPTION 1) ══════════ */}
      {showCreatePartsModal && (
        <CreatePartsOrderModal
          customers={customersList}
          parts={partsList}
          currentStaff={currentStaff}
          onClose={() => setShowCreatePartsModal(false)}
          onSuccess={newOrd => {
            setOrders(prev => [newOrd, ...prev]);
            setShowCreatePartsModal(false);
            setOrderToPrint(newOrd); // Mở hóa đơn in ngay sau khi tạo
          }}
        />
      )}

      {/* ══════════ MODAL: TẠO ĐƠN HÀNG BÁN XE CHUẨN ẢNH 2 (ĐH06 OPTION 2) ══════════ */}
      {showCreateVehicleModal && (
        <CreateVehicleOrderModal
          customers={customersList}
          currentStaff={currentStaff}
          preFillAppointment={initialPreFillVehicleOrder}
          onClose={() => {
            setShowCreateVehicleModal(false);
            if (onClearPreFill) onClearPreFill();
          }}
          onSuccess={newOrd => {
            setOrders(prev => [newOrd, ...prev]);
            setShowCreateVehicleModal(false);
            if (onClearPreFill) onClearPreFill();
            setOrderToPrint(newOrd); // Tự động mở hóa đơn để in
          }}
        />
      )}

      {/* ══════════ MODAL: CHI TIẾT ĐƠN HÀNG (ĐH07) ══════════ */}
      {selectedOrderForDetail && (
        <OrderDetailModal
          order={selectedOrderForDetail}
          onClose={() => setSelectedOrderForDetail(null)}
          onUpdateStatus={(newStatus) => {
            handleUpdateStatus(selectedOrderForDetail.id, newStatus);
            setSelectedOrderForDetail(prev => prev ? { ...prev, trangThai: newStatus } : null);
          }}
          onPrint={() => {
            const ord = selectedOrderForDetail;
            setOrderToPrint(ord);
          }}
        />
      )}

      {/* ══════════ MODAL: IN HÓA ĐƠN BÁN HÀNG / BÀN GIAO XE (ĐH07) ══════════ */}
      {orderToPrint && (
        <PrintInvoiceModal order={orderToPrint} onClose={() => setOrderToPrint(null)} />
      )}

      {/* ══════════ MODAL: XÁC NHẬN XÓA ĐƠN HÀNG (ĐH05) ══════════ */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center text-2xl mx-auto">
              🗑️
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-base text-zinc-900">XÁC NHẬN XÓA ĐƠN HÀNG</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng <strong>#{orderToDelete.id}</strong> của khách hàng{' '}
                <strong>{orderToDelete.hoTenKH}</strong>? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800"
              >
                Xóa đơn hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SUB-COMPONENT: MODAL TẠO ĐƠN BÁN PHỤ TÙNG TẠI QUẦY (ĐH06 OPTION 1)
// ────────────────────────────────────────────────────────────
function CreatePartsOrderModal({
  customers,
  parts,
  currentStaff,
  onClose,
  onSuccess,
}: {
  customers: Customer[];
  parts: Part[];
  currentStaff?: StaffAccount | null;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}) {
  const [selectedCustId, setSelectedCustId] = useState<string>(customers[0]?.id || 'KH001');
  const [selectedCust, setSelectedCust] = useState<Customer | undefined>(customers[0]);
  const [cartItems, setCartItems] = useState<{ part: Part; qty: number }[]>([]);
  const [partToAdd, setPartToAdd] = useState<string>(parts[0]?.id || '');
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'TienMat' | 'ChuyenKhoan'>('TienMat');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const c = customers.find(x => x.id === selectedCustId);
    setSelectedCust(c);
  }, [selectedCustId, customers]);

  const handleAddPartToCart = () => {
    const p = parts.find(x => x.id === partToAdd);
    if (!p) return;
    const existing = cartItems.find(x => x.part.id === p.id);
    if (existing) {
      setCartItems(cartItems.map(x => (x.part.id === p.id ? { ...x, qty: x.qty + qtyToAdd } : x)));
    } else {
      setCartItems([...cartItems, { part: p, qty: qtyToAdd }]);
    }
  };

  const handleRemoveItem = (pId: string) => {
    setCartItems(cartItems.filter(x => x.part.id !== pId));
  };

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (item.part.giaKhuyenMai || item.part.giaGoc) * item.qty,
    0
  );

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm phụ tùng!');
      return;
    }
    setSubmitting(true);
    try {
      const res = await orderApi.create({
        customerId: selectedCustId,
        hoTenKH: selectedCust?.hoTen || 'Khách vãng lai',
        soDienThoai: selectedCust?.soDienThoai || '0901234567',
        diaChiGiao: 'Mua trực tiếp tại Showroom (Bán tại quầy)',
        kenhBan: 'TaiQuay',
        trangThaiThanhToan: 'DaThanhToan',
        phuongThucThanhToan: paymentMethod,
        maNV: currentStaff?.id || 'NV01',
        tenNV: currentStaff?.hoTen || 'Nhân viên bán hàng',
        tongTien: totalAmount,
        ghiChu: note,
        items: cartItems.map(i => ({
          maPhuTung: parseInt(i.part.id.replace(/\D/g, ''), 10) || 1,
          tenSanPham: i.part.tenSanPham,
          soLuong: i.qty,
          donGia: i.part.giaKhuyenMai || i.part.giaGoc,
        })),
      });

      if (res.success && res.order) {
        onSuccess(res.order);
      } else {
        alert(res.message || 'Tạo đơn hàng không thành công!');
      }
    } catch (err) {
      alert('Có lỗi khi tạo đơn hàng!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h3 className="font-extrabold text-base text-zinc-900 font-display">
              🔧 TẠO ĐƠN BÁN PHỤ TÙNG TẠI QUẦY (POS)
            </h3>
            <p className="text-xs text-zinc-500 font-mono">
              Nhân viên lập đơn: <strong>{currentStaff?.hoTen || 'Nhân viên bán hàng'}</strong> ({currentStaff?.id || 'ST001'})
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 font-bold text-lg hover:text-zinc-600">
            ✕
          </button>
        </div>

        {/* Khối chọn khách hàng */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
          <label className="block text-xs font-bold text-zinc-700">Chọn khách hàng</label>
          <select
            value={selectedCustId}
            onChange={e => setSelectedCustId(e.target.value)}
            className="w-full p-2 text-xs rounded-xl border border-zinc-300 bg-white"
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.hoTen} - {c.soDienThoai} ({c.id})
              </option>
            ))}
          </select>
          {selectedCust && (
            <div className="text-[11px] text-zinc-500 font-mono">
              Địa chỉ: {selectedCust.diaChi} · Email: {selectedCust.email}
            </div>
          )}
        </div>

        {/* Khối thêm sản phẩm */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
          <label className="block text-xs font-bold text-zinc-700">Thêm sản phẩm phụ tùng</label>
          <div className="flex items-center gap-2">
            <select
              value={partToAdd}
              onChange={e => setPartToAdd(e.target.value)}
              className="flex-1 p-2 text-xs rounded-xl border border-zinc-300 bg-white"
            >
              {parts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.tenSanPham} - {formatVND(p.giaKhuyenMai || p.giaGoc)} (Còn {p.soLuongTon})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={qtyToAdd}
              onChange={e => setQtyToAdd(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 p-2 text-xs rounded-xl border border-zinc-300 bg-white text-center font-mono font-bold"
            />
            <button
              type="button"
              onClick={handleAddPartToCart}
              className="px-3 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition"
            >
              + Thêm
            </button>
          </div>
        </div>

        {/* Danh sách giỏ hàng */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-zinc-700">Chi tiết mặt hàng ({cartItems.length})</label>
          {cartItems.length === 0 ? (
            <div className="text-center py-6 text-zinc-400 text-xs border border-dashed border-zinc-200 rounded-2xl">
              Chưa có sản phẩm nào trong giỏ hàng.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden text-xs">
              {cartItems.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between bg-white">
                  <div>
                    <div className="font-bold text-zinc-900">{item.part.tenSanPham}</div>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      {formatVND(item.part.giaKhuyenMai || item.part.giaGoc)} × {item.qty}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold font-mono text-zinc-900">
                      {formatVND((item.part.giaKhuyenMai || item.part.giaGoc) * item.qty)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.part.id)}
                      className="text-red-600 hover:text-red-800 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Thanh toán & ghi chú */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Phương thức thanh toán</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
              className="w-full p-2 text-xs rounded-xl border border-zinc-300 bg-white"
            >
              <option value="TienMat">💵 Tiền mặt</option>
              <option value="ChuyenKhoan">🏦 Chuyển khoản QR</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Ghi chú</label>
            <input
              type="text"
              placeholder="VD: Khách lấy VAT, lắp tại chỗ..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full p-2 text-xs rounded-xl border border-zinc-300 bg-white"
            />
          </div>
        </div>

        {/* Tổng tiền & Nút chốt */}
        <div className="p-4 rounded-2xl bg-zinc-950 text-white flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase">TỔNG TIỀN THANH TOÁN</div>
            <div className="text-xl font-extrabold font-mono text-red-500">{formatVND(totalAmount)}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-white hover:bg-zinc-700"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || cartItems.length === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-red-700 hover:bg-red-800 text-white transition shadow-md disabled:opacity-50"
            >
              {submitting ? 'Đang tạo...' : 'TẠO ĐƠN & IN HÓA ĐƠN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SUB-COMPONENT: MODAL TẠO ĐƠN BÁN XE CHUẨN 100% ẢNH 2 (ĐH06 OPTION 2)
// ────────────────────────────────────────────────────────────
function CreateVehicleOrderModal({
  customers,
  currentStaff,
  preFillAppointment,
  onClose,
  onSuccess,
}: {
  customers: Customer[];
  currentStaff?: StaffAccount | null;
  preFillAppointment?: Appointment | null;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}) {
  // Tìm kiếm KH
  const [custSearch, setCustSearch] = useState(preFillAppointment?.hoTenKH || '');
  const [customerType, setCustomerType] = useState<'Individual' | 'Business'>('Individual');
  const [selectedCustId, setSelectedCustId] = useState(preFillAppointment?.customerId || customers[0]?.id || 'KH001');
  const [customerName, setCustomerName] = useState(preFillAppointment?.hoTenKH || customers[0]?.hoTen || '');
  const [idCardTax, setIdCardTax] = useState('079090123456');
  const [address, setAddress] = useState('123 Lê Văn Sỹ, P.13, Q.3, TP.HCM');
  const [phone, setPhone] = useState(preFillAppointment?.soDienThoai || customers[0]?.soDienThoai || '');
  const [email, setEmail] = useState(customers[0]?.email || 'khachhang@gmail.com');
  const [customerNotes, setCustomerNotes] = useState('Khách thích xe màu mới, tặng kèm phủ nano bảo vệ sơn');

  // Khối 2: Thông tin xe & VIN
  const [selectedVehicleModel, setSelectedVehicleModel] = useState<string>(
    preFillAppointment?.tenXe || showroomVehicles[0]?.tenXe || 'Honda SH 160i ABS 2025'
  );
  const [specificColor, setSpecificColor] = useState<string>(preFillAppointment?.mauXe || 'Đen mờ');
  const [driveTrain, setDriveTrain] = useState<string>('Bản Thể Thao ABS (156.9cc eSP+)');
  const [vinNumber, setVinNumber] = useState(preFillAppointment?.soKhungVIN || 'RLHKD160CB' + Math.floor(1000000 + Math.random() * 9000000));
  const [engineNumber, setEngineNumber] = useState(preFillAppointment?.soMay || 'KF12E-' + Math.floor(1000000 + Math.random() * 9000000));

  // Khối 3: Phân rã giá trị & Thanh toán
  const basePrice = useMemo(() => {
    const v = showroomVehicles.find(x => x.tenXe.includes(selectedVehicleModel) || selectedVehicleModel.includes(x.tenXe));
    return v ? v.giaNiemYet : 95900000;
  }, [selectedVehicleModel]);

  const [taxPercent, setTaxPercent] = useState<number>(5); // Thuế trước bạ 5% xe máy
  const [plateLocation, setPlateLocation] = useState<'HCM' | 'HN' | 'TINH'>('HCM');
  const plateFee = plateLocation === 'HCM' || plateLocation === 'HN' ? 4000000 : 800000;

  const [insurancePkg, setInsurancePkg] = useState<string>('TNDS_VAT_CHAT');
  const insuranceFee = insurancePkg === 'TNDS_VAT_CHAT' ? 1205000 : insurancePkg === 'TNDS' ? 66000 : 0;

  const [discountAmount, setDiscountAmount] = useState<number>(1000000);

  // Tổng tiền
  const totalAmount = useMemo(() => {
    const taxAmount = (basePrice * taxPercent) / 100;
    return basePrice + taxAmount + plateFee + insuranceFee - discountAmount;
  }, [basePrice, taxPercent, plateFee, insuranceFee, discountAmount]);

  // Đặt cọc
  const [depositAmount, setDepositAmount] = useState<number>(preFillAppointment?.soTienCoc || 2000000);
  const [depositDate, setDepositDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const rawRemainingAmount = Math.max(0, totalAmount - depositAmount);
  // Checkbox: Thu nốt tiền còn thiếu tại quầy (tự động đưa ra số tiền còn thiếu để nhân viên tích vào)
  const [thuNotTienConThieu, setThuNotTienConThieu] = useState<boolean>(preFillAppointment?.daThanhToan100 || false);

  const effectiveRemainingAmount = (thuNotTienConThieu || preFillAppointment?.daThanhToan100) ? 0 : rawRemainingAmount;
  const effectivePaymentStatus: PaymentStatus = effectiveRemainingAmount === 0 ? 'DaThanhToan' : (depositAmount > 0 ? 'DaCoc' : 'ChuaThanhToan');

  const [paymentMethod, setPaymentMethod] = useState<'TienMat' | 'ChuyenKhoan' | 'TraGop'>('ChuyenKhoan');
  const [bankAccount, setBankAccount] = useState('Vietcombank: 1012345678 (DAILYXEMAY SHOWROOM)');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('ChoGiaoXe');

  // Khối 4: Dịch vụ & Giao xe
  const [deliveryMethod, setDeliveryMethod] = useState<'Showroom' | 'HomeDelivery'>('Showroom');
  const [deliveryDate, setDeliveryDate] = useState<string>(preFillAppointment?.ngayHen || new Date().toISOString().split('T')[0]);
  const [deliveryPlace, setDeliveryPlace] = useState('Showroom DailyXeMay - Chi nhánh Trung Tâm');

  // 10 Checklist hoàn tất đơn hàng
  const [checklist, setChecklist] = useState<VehicleChecklist>({
    xacThucKH: true,
    thuThapCCCD: true,
    kyHopDong: true,
    nhapSoKhungVIN: true,
    dangKyBienSo: false,
    thuTienCoc: true,
    hoSoVay: false,
    capBaoHiem: true,
    kiemTraPDI: true,
    banGiaoXe: false,
  });

  const toggleChecklist = (key: keyof VehicleChecklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [submitting, setSubmitting] = useState(false);

  // Handle Search Customer
  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustId(c.id);
    setCustomerName(c.hoTen);
    setPhone(c.soDienThoai);
    setEmail(c.email);
    setAddress(c.diaChi);
    setCustSearch(c.hoTen);
  };

  const handleSubmit = async () => {
    if (!customerName.trim() || !phone.trim()) {
      alert('Vui lòng nhập đầy đủ tên khách hàng và số điện thoại!');
      return;
    }
    setSubmitting(true);
    try {
      const vehicleDetails: VehicleOrderDetails = {
        customerType,
        idCardTaxNo: idCardTax,
        customerNotes,
        tenXe: selectedVehicleModel,
        mauSac: specificColor,
        phienBan: driveTrain,
        dongCo: driveTrain,
        soKhungVIN: vinNumber,
        soMay: engineNumber,
        giaNiemYet: basePrice,
        phiTruocBa: (basePrice * taxPercent) / 100,
        phiDangKyBienSo: plateFee,
        tinhThanhDangKy: plateLocation === 'HCM' ? 'TP. Hồ Chí Minh' : plateLocation === 'HN' ? 'Hà Nội' : 'Tỉnh thành khác',
        goiBaoHiem: insurancePkg === 'TNDS_VAT_CHAT' ? 'TNDS 1 năm + Vật chất xe' : 'TNDS 1 năm',
        phiBaoHiem: insuranceFee,
        khuyenMai: discountAmount,
        tongGiaTri: totalAmount,
        soTienDatCoc: depositAmount,
        ngayDatCoc: depositDate,
        soTienConLai: effectiveRemainingAmount,
        phuongThucThanhToan: paymentMethod,
        taiKhoanNhan: bankAccount,
        trangThaiDonHang: orderStatus,
        hinhThucGiao: deliveryMethod,
        ngayGiaoXe: deliveryDate,
        diaChiGiao: deliveryPlace,
        checklist,
      };

      // 1. Tạo hóa đơn bán xe chính thức
      const res = await orderApi.createVehicleOrder({
        customerId: selectedCustId,
        hoTenKH: customerName,
        soDienThoai: phone,
        email,
        diaChiGiao: deliveryPlace,
        kenhBan: preFillAppointment ? 'Online' : 'TaiQuay',
        trangThaiThanhToan: effectivePaymentStatus,
        trangThai: effectiveRemainingAmount === 0 ? 'HoanThanh' : orderStatus,
        tongTien: totalAmount,
        phuongThucThanhToan: paymentMethod,
        maNV: currentStaff?.id || 'NV01',
        tenNV: currentStaff?.hoTen || 'Nhân viên bán hàng',
        ghiChu: customerNotes,
        maLichHen: preFillAppointment?.maLichHen || `HEN-XE-${Math.floor(1000 + Math.random() * 9000)}`,
        thongTinXe: vehicleDetails,
      });

      // 2. Hồ sơ xe tự động đăng ký vào tài khoản khách hàng (vehicleApi)
      let createdVehicleId = `XE${Date.now().toString().slice(-4)}`;
      try {
        const generatedPlate = plateLocation === 'HCM' ? '59-A1 888.88' : plateLocation === 'HN' ? '29-B1 999.99' : '60-C1 777.77';
        const brand = selectedVehicleModel.includes('Yamaha') ? 'Yamaha' : selectedVehicleModel.includes('Suzuki') ? 'Suzuki' : 'Honda';
        const createdV = await vehicleApi.createSoldVehicle({
          customerId: selectedCustId,
          tenXe: selectedVehicleModel,
          hangXe: brand,
          bienSo: generatedPlate,
          mauSac: specificColor,
          dongCo: driveTrain,
          soKhung: vinNumber,
          soMay: engineNumber,
          namSanXuat: new Date().getFullYear().toString(),
          hanBaoHanh: new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        });
        if (createdV?.id) {
          createdVehicleId = createdV.id;
        }
      } catch (vehErr) {
        console.warn('Tự động tạo hồ sơ xe thất bại:', vehErr);
      }

      // 3. Nếu có mua bảo hiểm -> Tự động kích hoạt hợp đồng bảo hiểm liên kết trực tiếp vào thẻ sở hữu xe
      if (insuranceFee > 0 && insurancePkg !== 'NONE') {
        try {
          const generatedPlate = plateLocation === 'HCM' ? '59-A1 888.88' : plateLocation === 'HN' ? '29-B1 999.99' : '60-C1 777.77';
          insuranceApi.create({
            customerId: selectedCustId,
            hoTenKH: customerName,
            soDienThoai: phone,
            email: email || 'khachhang@motoshop.vn',
            diaChi: address || 'TP. Hồ Chí Minh',
            vehicleId: createdVehicleId,
            tenXe: selectedVehicleModel,
            bienSo: generatedPlate,
            soKhung: vinNumber,
            soMay: engineNumber,
            packageType: insurancePkg === 'TNDS_VAT_CHAT' ? 'TOAN_DIEN' : 'TNDS_BAT_BUOC',
            tenGoi: insurancePkg === 'TNDS_VAT_CHAT' ? 'Bảo hiểm Toàn Diện (TNDS + Vật chất xe)' : 'Bảo hiểm TNDS Bắt Buộc (1 Năm)',
            thoiHanNam: 1,
            phiBaoHiem: insuranceFee,
            nhaBaoHiem: 'Tổng Công ty Bảo hiểm Bảo Việt',
            ngayCap: new Date().toISOString().split('T')[0],
            ngayBatDau: new Date().toISOString().split('T')[0],
            ngayKetThuc: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
            trangThai: 'HieuLuc',
            ghiChu: `Tự động cấp kèm Hóa đơn bán xe #${res.order?.id}`,
          });
        } catch (insErr) {
          console.warn('Tự động tạo hợp đồng bảo hiểm thất bại:', insErr);
        }
      }

      // 4. Nếu tạo từ lịch hẹn, đổi trạng thái lịch hẹn sang Đã hoàn thành và KHÓA CỨNG (D. BÁN XE)
      if (preFillAppointment) {
        await appointmentApi.updateStatus(preFillAppointment.id, 'DaHoanThanh');
      }

      // 5. Phát sự kiện cập nhật toàn hệ thống
      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_order_completed' } }));

      if (res.success && res.order) {
        onSuccess(res.order);
      } else if (!res.success) {
        alert(res.message || 'Không thể tạo hóa đơn bán xe!');
      }
    } catch (err) {
      alert('Có lỗi khi tạo hóa đơn bán xe!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-zinc-200 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl text-red-700">🏍️</span>
              <h2
                className="font-extrabold text-lg text-zinc-950 uppercase"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
              >
                TẠO ĐƠN HÀNG BÁN XE MỚI
              </h2>
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Nhân viên lập đơn: <strong>{currentStaff?.hoTen || 'Nhân viên tư vấn'}</strong> ({currentStaff?.id || 'ST001'})
              {preFillAppointment && (
                <span className="ml-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  ✓ Tự động nạp từ Lịch hẹn #{preFillAppointment.id}
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 font-bold text-xl hover:text-zinc-700">
            ✕
          </button>
        </div>

        {/* ── 1. THÔNG TIN KHÁCH HÀNG (Mở rộng) ── */}
        <div className="rounded-2xl border border-zinc-200 p-4 bg-zinc-50/70 space-y-3">
          <div className="font-extrabold text-xs text-zinc-900 uppercase font-mono tracking-wider flex items-center justify-between">
            <span>1. THÔNG TIN KHÁCH HÀNG (Mở rộng)</span>
            <span className="text-zinc-400 font-normal">Mã KH: {selectedCustId}</span>
          </div>

          {/* Tìm kiếm khách hàng */}
          <div>
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Tìm kiếm Khách hàng (Tên / SĐT / CCCD)..."
                value={custSearch}
                onChange={e => setCustSearch(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-zinc-300 bg-white focus:outline-none focus:border-red-600"
              />
            </div>
            {custSearch.trim() && (
              <div className="max-h-28 overflow-y-auto bg-white border border-zinc-200 rounded-xl mt-1 shadow-sm divide-y divide-zinc-100">
                {customers
                  .filter(
                    c =>
                      c.hoTen.toLowerCase().includes(custSearch.toLowerCase()) ||
                      c.soDienThoai.includes(custSearch) ||
                      c.id.toLowerCase().includes(custSearch.toLowerCase())
                  )
                  .map(c => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="p-2 text-xs hover:bg-red-50/50 cursor-pointer flex justify-between"
                    >
                      <span className="font-semibold">{c.hoTen} ({c.soDienThoai})</span>
                      <span className="font-mono text-zinc-400">{c.id}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Loại khách hàng</label>
              <select
                value={customerType}
                onChange={e => setCustomerType(e.target.value as any)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white"
              >
                <option value="Individual">Cá nhân (Individual)</option>
                <option value="Business">Doanh nghiệp (Business)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Họ và tên KH *</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-zinc-600 font-semibold mb-1">ID Card / CCCD / MST</label>
              <input
                type="text"
                value={idCardTax}
                onChange={e => setIdCardTax(e.target.value)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Địa chỉ đăng ký xe</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Điện thoại *</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Ghi chú sở thích KH</label>
              <input
                type="text"
                value={customerNotes}
                onChange={e => setCustomerNotes(e.target.value)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white"
              />
            </div>
          </div>
        </div>

        {/* ── 2. THÔNG TIN XE & VIN (Chi tiết) ── */}
        <div className="rounded-2xl border border-zinc-200 p-4 bg-zinc-50/70 space-y-3">
          <div className="font-extrabold text-xs text-zinc-900 uppercase font-mono tracking-wider">
            2. THÔNG TIN XE & VIN (Chi tiết)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Chọn xe mẫu</label>
              <select
                value={selectedVehicleModel}
                onChange={e => setSelectedVehicleModel(e.target.value)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white font-semibold"
              >
                {showroomVehicles.map(v => (
                  <option key={v.id} value={v.tenXe}>
                    {v.tenXe} ({formatVND(v.giaNiemYet)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Màu sắc thực tế</label>
              <input
                type="text"
                value={specificColor}
                onChange={e => setSpecificColor(e.target.value)}
                placeholder="VD: Đen mờ, Trắng ngọc, Đỏ đen"
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Động cơ / Phiên bản</label>
              <input
                type="text"
                value={driveTrain}
                onChange={e => setDriveTrain(e.target.value)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-zinc-600 font-semibold mb-1">
                Số khung (VIN) <span className="text-zinc-400 text-[10px]">(Nhập khi giao xe)</span>
              </label>
              <input
                type="text"
                value={vinNumber}
                onChange={e => setVinNumber(e.target.value.toUpperCase())}
                placeholder="VD: RLHKD160CB1234567"
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white font-mono font-bold uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Số máy thực tế</label>
              <input
                type="text"
                value={engineNumber}
                onChange={e => setEngineNumber(e.target.value.toUpperCase())}
                placeholder="VD: KF12E-1234567"
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white font-mono uppercase"
              />
            </div>
            <div className="flex items-end">
              <span className="text-[11px] text-zinc-500 italic pb-2">
                * Có thể cập nhật số khung và số máy chính thức khi khách đến nhận xe tại Showroom.
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. PHÂN RÃ GIÁ TRỊ ĐƠN HÀNG & THANH TOÁN (Chi tiết) ── */}
        <div className="rounded-2xl border border-zinc-200 p-4 bg-zinc-50/70 space-y-3">
          <div className="font-extrabold text-xs text-zinc-900 uppercase font-mono tracking-wider">
            3. PHÂN RÃ GIÁ TRỊ ĐƠN HÀNG & THANH TOÁN (Chi tiết)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-zinc-500 font-mono text-[11px] mb-1">Giá xe niêm yết</label>
              <div className="font-mono font-bold text-zinc-900 p-2 bg-white rounded-xl border border-zinc-200">
                {formatVND(basePrice)}
              </div>
            </div>

            <div>
              <label className="block text-zinc-500 font-mono text-[11px] mb-1">Phí trước bạ ({taxPercent}%)</label>
              <div className="font-mono font-bold text-zinc-900 p-2 bg-white rounded-xl border border-zinc-200">
                {formatVND((basePrice * taxPercent) / 100)}
              </div>
            </div>

            <div>
              <label className="block text-zinc-500 font-mono text-[11px] mb-1">Phí đăng ký biển số</label>
              <select
                value={plateLocation}
                onChange={e => setPlateLocation(e.target.value as any)}
                className="w-full p-2 text-xs rounded-xl border border-zinc-300 bg-white font-mono font-bold"
              >
                <option value="HCM">TP.HCM (4.000.000₫)</option>
                <option value="HN">Hà Nội (4.000.000₫)</option>
                <option value="TINH">Tỉnh khác (800.000₫)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-500 font-mono text-[11px] mb-1">Phí bảo hiểm</label>
              <select
                value={insurancePkg}
                onChange={e => setInsurancePkg(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-zinc-300 bg-white font-mono"
              >
                <option value="TNDS_VAT_CHAT">TNDS + Vật chất (1.205.000₫)</option>
                <option value="TNDS">TNDS Bắt buộc (66.000₫)</option>
                <option value="NONE">Không mua bảo hiểm (0₫)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-500 font-mono text-[11px] mb-1">Khuyến mãi / Giảm giá</label>
              <input
                type="number"
                value={discountAmount}
                onChange={e => setDiscountAmount(parseInt(e.target.value) || 0)}
                className="w-full p-2 text-xs rounded-xl border border-zinc-300 bg-white font-mono text-red-600 font-bold"
              />
            </div>
          </div>

          {/* TỔNG TIỀN NỔI BẬT */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-red-800 uppercase">TỔNG TIỀN ĐƠN HÀNG (LĂN BÁNH)</div>
              <div className="text-2xl font-extrabold font-mono text-red-700 mt-0.5">{formatVND(totalAmount)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-zinc-500">Số tiền còn thiếu phải thu</div>
              <div className={`text-lg font-bold font-mono ${effectiveRemainingAmount === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatVND(effectiveRemainingAmount)}
              </div>
            </div>
          </div>

          {/* KHỐI THU NỐT TIỀN TỰ ĐỘNG (D. BÁN XE) */}
          {rawRemainingAmount > 0 && !preFillAppointment?.daThanhToan100 ? (
            <div className={`p-4 rounded-2xl border transition-all ${
              thuNotTienConThieu 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                : 'bg-amber-50/80 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="font-extrabold text-xs uppercase font-mono flex items-center gap-2">
                    <span>💵</span>
                    <span>THU NỐT TIỀN TẠI QUẦY (ĐỐI CHIẾU TIỀN CÒN THIẾU)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-700 font-bold">
                      Còn thiếu: {formatVND(rawRemainingAmount)}
                    </span>
                  </div>
                  <div className="text-xs mt-1 text-zinc-600">
                    Khách đã thanh toán cọc <strong className="font-mono text-emerald-700">{formatVND(depositAmount)}</strong>. Tích vào ô bên cạnh khi nhân viên đã nhận đủ số tiền còn lại.
                  </div>
                </div>

                <label className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-300 shadow-xs cursor-pointer hover:border-red-600 transition select-none">
                  <input
                    type="checkbox"
                    checked={thuNotTienConThieu}
                    onChange={e => setThuNotTienConThieu(e.target.checked)}
                    className="w-4 h-4 accent-red-700 cursor-pointer"
                  />
                  <span className="text-xs font-extrabold text-zinc-900">
                    ✓ Đã thu nốt số tiền còn thiếu ({formatVND(rawRemainingAmount)})
                  </span>
                </label>
              </div>

              {thuNotTienConThieu ? (
                <div className="mt-2 text-xs font-bold text-emerald-800 flex items-center gap-1.5 pt-2 border-t border-emerald-200">
                  <span>✓</span> Đã xác nhận thu đủ 100% tiền mua xe tại quầy. Đơn hàng sẽ được chốt trạng thái: <span className="underline">ĐÃ THANH TOÁN 100%</span>.
                </div>
              ) : (
                <div className="mt-2 text-xs font-medium text-amber-800 flex items-center gap-1.5 pt-2 border-t border-amber-200">
                  <span>⚠️</span> Chưa tích thu nốt tiền. Đơn hàng sẽ lưu dưới dạng "Đã đặt cọc" và ghi nợ số tiền còn lại.
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <span>✅</span> Khách hàng đã thanh toán 100% tiền mua xe (Số tiền còn lại: 0₫).
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Số tiền đặt cọc</label>
              <input
                type="number"
                value={depositAmount}
                onChange={e => setDepositAmount(parseInt(e.target.value) || 0)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white font-mono font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Ngày đặt cọc</label>
              <input
                type="date"
                value={depositDate}
                onChange={e => setDepositDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Phương thức thanh toán</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white"
              >
                <option value="ChuyenKhoan">🏦 Chuyển khoản ngân hàng</option>
                <option value="TienMat">💵 Tiền mặt</option>
                <option value="TraGop">📋 Trả góp</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Trạng thái đơn hàng</label>
              <select
                value={orderStatus}
                onChange={e => setOrderStatus(e.target.value as any)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white font-semibold"
              >
                <option value="ChoGiaoXe">Chờ giao xe</option>
                <option value="ChoDuyet">Chờ duyệt</option>
                <option value="HoanThanh">Đã hoàn thành</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 4. DỊCH VỤ & GIAO XE (Mới) + 10 CHECKLIST HOÀN TẤT ĐƠN HÀNG ── */}
        <div className="rounded-2xl border border-zinc-200 p-4 bg-zinc-50/70 space-y-4">
          <div className="font-extrabold text-xs text-zinc-900 uppercase font-mono tracking-wider">
            4. DỊCH VỤ & GIAO XE (Mới)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Hình thức giao xe</label>
              <select
                value={deliveryMethod}
                onChange={e => setDeliveryMethod(e.target.value as any)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white"
              >
                <option value="Showroom">Nhận xe tại Showroom</option>
                <option value="HomeDelivery">Giao xe tận nhà</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Ngày hẹn giao xe</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-600 font-semibold mb-1">Nơi giao xe / Chi nhánh</label>
              <input
                type="text"
                value={deliveryPlace}
                onChange={e => setDeliveryPlace(e.target.value)}
                className="w-full p-2 rounded-xl border border-zinc-300 bg-white"
              />
            </div>
          </div>

          {/* CHECKLIST HOÀN TẤT ĐƠN HÀNG (10 CHECKBOX TRỰC QUAN THEO ẢNH 2) */}
          <div className="pt-2 border-t border-zinc-200">
            <div className="text-xs font-bold text-zinc-800 uppercase font-mono mb-2">
              CHECKLIST HOÀN TẤT ĐƠN HÀNG (10 BƯỚC BÀN GIAO)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={checklist.xacThucKH}
                  onChange={() => toggleChecklist('xacThucKH')}
                  className="rounded text-red-600"
                />
                <span className="text-[11px] font-medium">Xác thực khách hàng</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={checklist.thuThapCCCD}
                  onChange={() => toggleChecklist('thuThapCCCD')}
                  className="rounded text-red-600"
                />
                <span className="text-[11px] font-medium">Thu thập CCCD/GPKD</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={checklist.kyHopDong}
                  onChange={() => toggleChecklist('kyHopDong')}
                  className="rounded text-red-600"
                />
                <span className="text-[11px] font-medium">Ký hợp đồng mua bán</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={checklist.nhapSoKhungVIN}
                  onChange={() => toggleChecklist('nhapSoKhungVIN')}
                  className="rounded text-red-600"
                />
                <span className="text-[11px] font-medium">Nhập Số khung VIN</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={checklist.dangKyBienSo}
                  onChange={() => toggleChecklist('dangKyBienSo')}
                  className="rounded text-red-600"
                />
                <span className="text-[11px] font-medium">Đăng ký biển số</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={checklist.thuTienCoc}
                  onChange={() => toggleChecklist('thuTienCoc')}
                  className="rounded text-red-600"
                />
                <span className="text-[11px] font-medium">Thu tiền đặt cọc</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={checklist.hoSoVay}
                  onChange={() => toggleChecklist('hoSoVay')}
                  className="rounded text-red-600"
                />
                <span className="text-[11px] font-medium">Hồ sơ vay vốn (nếu có)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={checklist.capBaoHiem}
                  onChange={() => toggleChecklist('capBaoHiem')}
                  className="rounded text-red-600"
                />
                <span className="text-[11px] font-medium">Cấp giấy bảo hiểm</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={checklist.kiemTraPDI}
                  onChange={() => toggleChecklist('kiemTraPDI')}
                  className="rounded text-red-600"
                />
                <span className="text-[11px] font-medium">Kiểm tra PDI xuất xưởng</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={checklist.banGiaoXe}
                  onChange={() => toggleChecklist('banGiaoXe')}
                  className="rounded text-red-600"
                />
                <span className="text-[11px] font-medium">Bàn giao xe & Hồ sơ</span>
              </label>
            </div>
          </div>
        </div>

        {/* Nút hành động chuẩn Ảnh 2: Hủy bỏ, Lưu nháp, GỬI ĐƠN HÀNG */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-200 hover:bg-zinc-300 text-zinc-800 transition"
          >
            Lưu nháp
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-7 py-2.5 rounded-xl text-xs font-extrabold bg-blue-700 hover:bg-blue-800 text-white transition shadow-lg shadow-blue-700/20 uppercase tracking-wider disabled:opacity-50"
          >
            {submitting ? 'ĐANG XỬ LÝ...' : 'GỬI ĐƠN HÀNG & TẠO HÓA ĐƠN'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SUB-COMPONENT: MODAL CHI TIẾT ĐƠN HÀNG (ĐH07)
// ────────────────────────────────────────────────────────────
function OrderDetailModal({
  order,
  onClose,
  onPrint,
  onUpdateStatus,
}: {
  order: Order;
  onClose: () => void;
  onPrint: () => void;
  onUpdateStatus?: (status: OrderStatus) => void;
}) {
  const isVehicle = order.loaiDon === 'Xe';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-base text-zinc-900 font-display">
                CHI TIẾT ĐƠN HÀNG #{order.id}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 font-mono">
                {isVehicle ? '🏍️ ĐƠN BÁN XE' : '🔧 PHỤ TÙNG'}
              </span>
              <StatusBadge status={order.trangThai} configs={orderStatuses} />
            </div>
            <div className="text-xs text-zinc-500 font-mono mt-0.5">Ngày đặt: {order.ngayDat}</div>
          </div>
          <button onClick={onClose} className="text-zinc-400 font-bold text-lg hover:text-zinc-600 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Banner thông báo quy trình xử lý đơn */}
        {order.trangThai === 'ChoDuyet' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <span className="text-base">⏳</span>
            <div>
              <strong>ĐƠN HÀNG MỚI (CHỜ XÁC NHẬN):</strong> Tồn kho khả dụng của các phụ tùng đã tự động được giữ trước. Khách hàng vẫn có quyền hủy đơn hàng trên Web.
            </div>
          </div>
        )}
        {order.trangThai === 'DaXacNhan' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
            <span className="text-base">✓</span>
            <div>
              <strong>ĐÃ XÁC NHẬN ĐƠN HÀNG:</strong> Đang đóng gói phụ tùng. Vui lòng bấm <b>In hóa đơn (Giao hàng)</b> để kẹp cùng gói hàng cho đơn vị vận chuyển.
            </div>
          </div>
        )}
        {order.trangThai === 'DangGiao' && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 flex items-start gap-2">
            <span className="text-base">🚚</span>
            <div>
              <strong>ĐANG GIAO HÀNG:</strong> Nút hủy đơn phía khách hàng <b>ĐÃ BỊ TỰ ĐỘNG KHÓA</b> để đảm bảo tiến độ vận chuyển.
            </div>
          </div>
        )}
        {order.trangThai === 'ChoGiaoXe' && (
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 flex items-start gap-2">
            <span className="text-base">🏍️</span>
            <div>
              <strong>CHỜ BÀN GIAO XE MỚI:</strong> Xe đã sẵn sàng để trao cho khách hàng. Sau khi hoàn tất bàn giao, hệ thống sẽ tự động gửi bài khảo sát đánh giá đến tài khoản của khách.
            </div>
          </div>
        )}
        {order.trangThai === 'HoanThanh' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
            <span className="text-base">✅</span>
            <div>
              <strong>ĐÃ GIAO HÀNG THÀNH CÔNG (HOÀN TẤT):</strong> Đã trừ tồn kho thực tế và cộng doanh thu đơn hàng vào Quản lý Bán hàng.
            </div>
          </div>
        )}
        {order.trangThai === 'DaHuy' && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-red-900">
              <span>✕</span> ĐƠN HÀNG ĐÃ BỊ HỦY (BẮT BUỘC GIỮ NGUYÊN TRẠNG THÁI)
            </div>
            <div className="text-[11px] text-zinc-700">
              Toàn bộ số lượng phụ tùng đã được tự động hoàn trả lại vào Tồn kho khả dụng. Trạng thái Đã hủy là cố định, hệ thống không cho phép thay đổi trạng thái này nữa.
            </div>
            {(order.lyDoHuy || order.ghiChu) && (
              <div className="text-[11px] bg-white p-2.5 rounded-xl border border-red-200 text-red-900 font-mono mt-1">
                Lý do hủy đơn: <strong>{order.lyDoHuy || order.ghiChu}</strong>
              </div>
            )}
          </div>
        )}

        {/* Thông tin khách hàng & kênh bán */}
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5 text-xs">
          <div className="font-bold text-sm text-zinc-900">{order.hoTenKH}</div>
          <div>SĐT: <strong className="font-mono text-zinc-800">{order.soDienThoai || 'Chưa cập nhật'}</strong> · Email: <span className="font-mono">{order.email || 'khach@gmail.com'}</span></div>
          <div>Địa chỉ nhận hàng: <span className="text-zinc-800 font-medium">{order.diaChiGiao}</span></div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/60 font-mono text-[11px] text-zinc-600">
            <div>Kênh bán: <strong>{order.kenhBan === 'TaiQuay' ? '🏪 Tại quầy Showroom' : '🌐 Đặt online qua Web'}</strong></div>
            <div>Hình thức thanh toán: <strong>{order.phuongThucThanhToan === 'ChuyenKhoan' ? '🏦 Chuyển khoản' : '💵 Tiền mặt / COD'}</strong></div>
            <div>Trạng thái TT: <strong className={order.trangThaiThanhToan === 'DaThanhToan' ? 'text-emerald-700' : 'text-amber-700'}>{order.trangThaiThanhToan === 'DaThanhToan' ? 'Đã thanh toán' : order.trangThaiThanhToan === 'DaCoc' ? 'Đã đặt cọc' : 'Chưa thanh toán'}</strong></div>
            <div>Nhân viên lập đơn: <strong>{order.tenNV || order.maNV || 'Admin'}</strong></div>
          </div>
        </div>

        {/* Chi tiết nội dung đơn hàng */}
        {isVehicle && order.thongTinXe ? (
          <div className="p-4 rounded-2xl bg-red-50/50 border border-red-200 space-y-3 text-xs">
            <div className="font-bold text-zinc-900 text-sm flex items-center justify-between">
              <span>{order.thongTinXe.tenXe}</span>
              <span className="font-mono text-red-700 font-extrabold">{formatVND(order.thongTinXe.giaNiemYet)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-zinc-700">
              <div>Màu sắc: <strong>{order.thongTinXe.mauSac}</strong></div>
              <div>Số khung VIN: <strong className="font-mono">{order.thongTinXe.soKhungVIN || 'Chưa nhập'}</strong></div>
              <div>Phí trước bạ: <strong className="font-mono">{formatVND(order.thongTinXe.phiTruocBa)}</strong></div>
              <div>Phí đăng ký biển: <strong className="font-mono">{formatVND(order.thongTinXe.phiDangKyBienSo)}</strong></div>
              <div>Bảo hiểm: <strong>{order.thongTinXe.goiBaoHiem}</strong></div>
              <div>Giảm giá khuyến mãi: <strong className="font-mono text-emerald-700">-{formatVND(order.thongTinXe.khuyenMai)}</strong></div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-red-200 flex justify-between items-center font-mono">
              <div>
                <span className="text-zinc-500">ĐÃ ĐẶT CỌC: </span>
                <strong className="text-emerald-700">{formatVND(order.thongTinXe.soTienDatCoc)}</strong>
              </div>
              <div>
                <span className="text-zinc-500">CÒN PHẢI THU: </span>
                <strong className="text-red-700 text-sm">{formatVND(order.thongTinXe.soTienConLai)}</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-zinc-200 rounded-2xl overflow-hidden text-xs divide-y divide-zinc-100">
            <div className="bg-zinc-100 px-3 py-2 font-mono font-bold text-zinc-600 flex justify-between">
              <span>DANH SÁCH SẢN PHẨM PHỤ TÙNG</span>
              <span>THÀNH TIỀN</span>
            </div>
            {order.items?.map((item, idx) => (
              <div key={idx} className="p-3 flex justify-between items-center bg-white">
                <div>
                  <div className="font-bold text-zinc-900">{item.tenSanPham}</div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    {formatVND(item.donGia)} × {item.soLuong} cái
                  </div>
                </div>
                <div className="font-mono font-bold text-zinc-900">
                  {formatVND(item.donGia * item.soLuong)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tổng tiền & Hành động */}
        <div className="p-4 rounded-2xl bg-zinc-950 text-white flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase">TỔNG GIÁ TRỊ ĐƠN HÀNG</div>
            <div className="text-xl font-extrabold font-mono text-red-500">{formatVND(order.tongTien)}</div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Nút In hóa đơn (Bắt buộc theo ĐH07 và quy trình giao hàng) */}
            <button
              type="button"
              onClick={onPrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>🧾</span> In hóa đơn (Giao hàng)
            </button>

            {/* Các nút chuyển trạng thái theo quy trình */}
            {order.trangThai === 'DaHuy' ? (
              <span className="px-3.5 py-2 rounded-xl text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 flex items-center gap-1.5">
                🔒 Trạng thái cố định (Đã hủy)
              </span>
            ) : (
              <>
                {order.trangThai === 'ChoDuyet' && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus?.('DaXacNhan')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-zinc-950 flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>✓</span> Xác nhận đơn
                  </button>
                )}

                {(order.trangThai === 'ChoDuyet' || order.trangThai === 'DaXacNhan') && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus?.('DangGiao')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>🚚</span> Bắt đầu giao hàng (Khóa hủy)
                  </button>
                )}

                {(order.trangThai === 'DangGiao' || order.trangThai === 'ChoGiaoXe') && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus?.('HoanThanh')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>✅</span> {isVehicle ? 'Bàn giao xe thành công (Chốt & gửi khảo sát)' : 'Đã giao thành công (Chốt doanh thu)'}
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SUB-COMPONENT: IN HÓA ĐƠN CHUẨN A4 (ĐH07)
// ────────────────────────────────────────────────────────────
function PrintInvoiceModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const isVehicle = order.loaiDon === 'Xe';
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-6 max-h-[94vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧾</span>
            <span className="font-extrabold text-base text-zinc-900 uppercase font-display">
              BẢN XEM TRƯỚC HÓA ĐƠN BÁN HÀNG
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <span>🖨️</span> In ngay (Print)
            </button>
            <button onClick={onClose} className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700">
              Đóng
            </button>
          </div>
        </div>

        {/* KHUNG HÓA ĐƠN IN ẤN (INVOICE PAPER) */}
        <div ref={printRef} className="p-6 sm:p-8 bg-white border border-zinc-300 rounded-2xl text-zinc-900 space-y-6 font-sans">
          {/* Header Cửa Hàng */}
          <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-red-700 font-display">
                HỆ THỐNG SHOWROOM MOTOSHOP CRM
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">Đại lý Phân phối Xe máy & Phụ tùng Chính Hãng</p>
              <p className="text-xs text-zinc-600 mt-1">Địa chỉ: 123 Lê Văn Sỹ, P.13, Q.3, TP. Hồ Chí Minh</p>
              <p className="text-xs text-zinc-600">Hotline: 1900 6868 · Website: dailyxemay.vn</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold font-mono uppercase text-zinc-900">
                {isVehicle ? 'HÓA ĐƠN BÁN XE KIÊM PHIẾU GIAO XE' : 'HÓA ĐƠN BÁN HÀNG'}
              </h2>
              <div className="text-xs font-mono text-zinc-500 mt-1">Số: #{order.id}</div>
              <div className="text-xs font-mono text-zinc-500">Ngày lập: {order.ngayDat}</div>
            </div>
          </div>

          {/* Thông tin Khách hàng */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-xl">
            <div>
              <div className="font-bold text-zinc-500 uppercase text-[10px]">KHÁCH HÀNG:</div>
              <div className="font-bold text-sm text-zinc-900 mt-0.5">{order.hoTenKH}</div>
              <div>Điện thoại: <strong className="font-mono">{order.soDienThoai}</strong></div>
              <div>Địa chỉ: {order.diaChiGiao}</div>
            </div>
            <div>
              <div className="font-bold text-zinc-500 uppercase text-[10px]">THÔNG TIN GIAO DỊCH:</div>
              <div>Kênh bán: <strong>{order.kenhBan === 'TaiQuay' ? 'Tại quầy Showroom' : 'Mua trực tuyến qua Web'}</strong></div>
              <div>Nhân viên phụ trách: <strong>{order.tenNV || 'NV Bán hàng'}</strong></div>
              <div>Hình thức thanh toán: <strong>{order.phuongThucThanhToan || 'Chuyển khoản'}</strong></div>
            </div>
          </div>

          {/* Bảng Chi Tiết Mục Hàng */}
          {isVehicle && order.thongTinXe ? (
            <div className="space-y-3">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-zinc-900 bg-zinc-100 font-mono text-left">
                    <th className="py-2 px-3">MÔ TẢ MẶT HÀNG / DỊCH VỤ</th>
                    <th className="py-2 px-3">ĐƠN VỊ</th>
                    <th className="py-2 px-3 text-right">THÀNH TIỀN (VND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  <tr>
                    <td className="py-2.5 px-3">
                      <div className="font-bold font-sans text-zinc-900">{order.thongTinXe.tenXe}</div>
                      <div className="text-[11px] text-zinc-500">Màu: {order.thongTinXe.mauSac} · Số VIN: {order.thongTinXe.soKhungVIN || 'Đang chờ cấp'}</div>
                    </td>
                    <td className="py-2.5 px-3">Chiếc</td>
                    <td className="py-2.5 px-3 text-right font-bold">{formatVND(order.thongTinXe.giaNiemYet)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Lệ phí trước bạ xe máy</td>
                    <td className="py-2 px-3">Gói</td>
                    <td className="py-2 px-3 text-right">{formatVND(order.thongTinXe.phiTruocBa)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Phí đăng ký & bấm biển số</td>
                    <td className="py-2 px-3">Gói</td>
                    <td className="py-2 px-3 text-right">{formatVND(order.thongTinXe.phiDangKyBienSo)}</td>
                  </tr>
                  {order.thongTinXe.phiBaoHiem > 0 && (
                    <tr>
                      <td className="py-2 px-3">{order.thongTinXe.goiBaoHiem || 'Gói bảo hiểm xe máy'}</td>
                      <td className="py-2 px-3">Hợp đồng</td>
                      <td className="py-2 px-3 text-right">{formatVND(order.thongTinXe.phiBaoHiem)}</td>
                    </tr>
                  )}
                  {order.thongTinXe.khuyenMai > 0 && (
                    <tr className="text-emerald-700">
                      <td className="py-2 px-3">Chiết khấu ưu đãi khuyến mãi</td>
                      <td className="py-2 px-3">Voucher</td>
                      <td className="py-2 px-3 text-right">-{formatVND(order.thongTinXe.khuyenMai)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="p-4 bg-zinc-50 rounded-xl space-y-1.5 text-xs font-mono text-right">
                <div>TỔNG GIÁ TRỊ XE LĂN BÁNH: <strong className="text-base text-red-700">{formatVND(order.tongTien)}</strong></div>
                <div>Số tiền đã đặt cọc: <strong className="text-emerald-700">{formatVND(order.thongTinXe.soTienDatCoc)}</strong></div>
                <div className="text-sm font-bold border-t border-zinc-200 pt-1.5">
                  SỐ TIỀN CÒN PHẢI THU: <span className="text-zinc-900">{formatVND(order.thongTinXe.soTienConLai)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-zinc-900 bg-zinc-100 font-mono text-left">
                    <th className="py-2 px-3">STT</th>
                    <th className="py-2 px-3">TÊN PHỤ TÙNG</th>
                    <th className="py-2 px-3 text-center">SỐ LƯỢNG</th>
                    <th className="py-2 px-3 text-right">ĐƠN GIÁ</th>
                    <th className="py-2 px-3 text-right">THÀNH TIỀN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {order.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 text-zinc-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-zinc-900">{it.tenSanPham}</td>
                      <td className="py-2.5 px-3 text-center">{it.soLuong}</td>
                      <td className="py-2.5 px-3 text-right">{formatVND(it.donGia)}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{formatVND(it.donGia * it.soLuong)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-4 bg-zinc-50 rounded-xl text-right font-mono text-xs mt-3">
                <div>TỔNG TIỀN THANH TOÁN: <strong className="text-base text-red-700">{formatVND(order.tongTien)}</strong></div>
              </div>
            </div>
          )}

          {/* Chữ Ký Khách & Đại Diện */}
          <div className="grid grid-cols-2 gap-8 text-center text-xs pt-8 border-t border-zinc-200">
            <div>
              <div className="font-bold text-zinc-900">NGƯỜI MUA HÀNG</div>
              <div className="text-zinc-400 text-[10px] italic">(Ký và ghi rõ họ tên)</div>
              <div className="h-20" />
              <div className="font-semibold text-zinc-900">{order.hoTenKH}</div>
            </div>
            <div>
              <div className="font-bold text-zinc-900">ĐẠI DIỆN SHOWROOM MOTOSHOP</div>
              <div className="text-zinc-400 text-[10px] italic">(Ký, đóng dấu và ghi rõ họ tên)</div>
              <div className="h-20" />
              <div className="font-semibold text-zinc-900">{order.tenNV || 'Trần Văn Quản Lý'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
