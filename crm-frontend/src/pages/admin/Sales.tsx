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
import { orderApi, customerApi, partApi, appointmentApi, vehicleApi, insuranceApi, catalogVehicleApi, DEFAULT_CATALOG_VEHICLES, type CatalogVehicle } from '../../services/api';
import { showroomVehicles } from '../customer/VehiclesShowroom';
import { matchVietnameseSearch } from '../../utils/vietnameseSearch';

// ── Status Configs ──
const orderStatuses: { key: OrderStatus; label: string; color: string; bg: string }[] = [
  { key: 'ChoDuyet', label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
  { key: 'ChoKhachXacNhanNgayNhan', label: 'Chờ KH xác nhận ngày đặt xe', color: '#ea580c', bg: '#ffedd5' },
  { key: 'DaXacNhan', label: 'Đã xác nhận', color: '#0284c7', bg: '#e0f2fe' },
  { key: 'DangGiao', label: 'Đang giao', color: '#2563eb', bg: '#dbeafe' },
  { key: 'DaGiao', label: 'Đã giao', color: '#059669', bg: '#d1fae5' },
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
  onCancelPreFill?: () => void;
}

export default function SalesPage({
  currentStaff,
  initialPreFillVehicleOrder,
  onClearPreFill,
  onCancelPreFill,
}: SalesPageProps) {
  // ── ĐH08: Tách danh sách đơn hàng thành 2 Tab riêng biệt ──
  const [activeOrderTypeTab, setActiveOrderTypeTab] = useState<'TatCa' | 'Xe' | 'PhuTung'>('TatCa');

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
      if (!type || type.includes('order') || type === 'vehicle_order_completed' || type === 'vehicle' || type === 'order_payment' || type === 'order_payment_updated') {
        loadData();
      }
    };

    window.addEventListener('crm-data-refresh', handleRefresh);
    window.addEventListener('crm-admin-notification', handleRefresh);
    window.addEventListener('storage', handleRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener('crm-data-refresh', handleRefresh);
      window.removeEventListener('crm-admin-notification', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
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
  const handleUpdateStatus = async (id: string, newStatus: OrderStatus) => {
    const targetNum = parseInt(id.replace(/\D/g, ''), 10);
    const target = orders.find(o => o.id === id || (!isNaN(targetNum) && parseInt(o.id.replace(/\D/g, ''), 10) === targetNum && o.id.includes('XE') === id.includes('XE')));
    if (target && target.trangThai === 'DaHuy') {
      alert('Đơn hàng đã ở trạng thái ĐÃ HỦY. Bắt buộc giữ nguyên trạng thái Đã hủy, không được thay đổi!');
      return;
    }
    if (target && target.trangThai === 'HoanThanh') {
      alert('Đơn hàng đã ở trạng thái ĐÃ HOÀN THÀNH. Tiến trình đã được khóa cứng, không thể thay đổi trạng thái!');
      return;
    }

    const isVehicle = target && (target.loaiDon === 'Xe' || !!target.thongTinXe || target.id.includes('XE'));
    const isHomeDelivery = Boolean(isVehicle && (target?.thongTinXe?.hinhThucGiao === 'HomeDelivery' || target?.ghiChu?.includes('GIAO TẬN NƠI')));
    const remaining = target?.thongTinXe?.soTienConLai || 0;
    const isNotFullyPaid = isVehicle && remaining > 0 && target?.trangThaiThanhToan !== 'DaThanhToan';

    // Ràng buộc thu đủ 100% tiền trước khi hoàn tất đơn xe đặt cọc (Mục 1.2 đặc tả)
    if (newStatus === 'HoanThanh' && isNotFullyPaid) {
      const confirmPaid = window.confirm(
        `⚠️ ĐƠN HÀNG XE ĐẶT CỌC CHƯA THU ĐỦ TIỀN!\n\nĐơn xe #${target?.id} hiện mới thanh toán tiền cọc, CÒN THIẾU ${formatVND(remaining)}.\n\nTheo quy tắc nghiệp vụ, bắt buộc phải thu đủ 100% tiền trước khi phát hành hóa đơn và hoàn tất đơn hàng.\n\nBạn có xác nhận KHÁCH HÀNG ĐÃ NỘP ĐỦ 100% TIỀN TẠI QUẦY không?`
      );
      if (!confirmPaid) {
        return;
      }
    }

    const finalStatus: OrderStatus = (newStatus === 'DaGiao' && !isHomeDelivery) ? 'HoanThanh' : newStatus;

    // Cập nhật Optimistic UI ngay lập tức cho tất cả các bản ghi khớp ID
    setOrders(prev => prev.map(o => {
      const oNum = parseInt(o.id.replace(/\D/g, ''), 10);
      const isMatch = o.id === id || (!isNaN(targetNum) && !isNaN(oNum) && targetNum === oNum && o.id.includes('XE') === id.includes('XE'));
      return isMatch
        ? {
            ...o,
            trangThai: finalStatus,
            ...(finalStatus === 'ChoGiaoXe' || finalStatus === 'HoanThanh' || finalStatus === 'DaGiao' ? { daXacNhanNgayNhan: true } : {}),
            ...(finalStatus === 'HoanThanh' ? { trangThaiThanhToan: 'DaThanhToan' as const } : {}),
            ...(finalStatus === 'HoanThanh' && o.thongTinXe ? { thongTinXe: { ...o.thongTinXe, soTienConLai: 0, daXacNhanNgayNhan: true } } : {})
          }
        : o;
    }));
    if (selectedOrderForDetail && (selectedOrderForDetail.id === id || parseInt(selectedOrderForDetail.id.replace(/\D/g, ''), 10) === targetNum)) {
      setSelectedOrderForDetail(prev => (prev ? {
        ...prev,
        trangThai: finalStatus,
        ...(finalStatus === 'ChoGiaoXe' || finalStatus === 'HoanThanh' || finalStatus === 'DaGiao' ? { daXacNhanNgayNhan: true } : {}),
        ...(finalStatus === 'HoanThanh' ? { trangThaiThanhToan: 'DaThanhToan' as const } : {}),
        ...(finalStatus === 'HoanThanh' && prev.thongTinXe ? { thongTinXe: { ...prev.thongTinXe, soTienConLai: 0, daXacNhanNgayNhan: true } } : {})
      } : null));
    }

    await orderApi.updateStatus(id, finalStatus);
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'order_status_updated', orderId: id, status: finalStatus } }));
  };

  // Xác nhận / Cập nhật trạng thái thanh toán (COD / Chuyển khoản)
  const handleUpdatePaymentStatus = async (id: string, newPaymentStatus: PaymentStatus = 'DaThanhToan') => {
    // Cập nhật Optimistic UI ngay lập tức
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, trangThaiThanhToan: newPaymentStatus } : o)));
    if (selectedOrderForDetail && selectedOrderForDetail.id === id) {
      setSelectedOrderForDetail(prev => (prev ? { ...prev, trangThaiThanhToan: newPaymentStatus } : null));
    }

    await orderApi.updatePaymentStatus(id, newPaymentStatus);
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'order_payment_updated', orderId: id, paymentStatus: newPaymentStatus } }));
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
    const list = orders.filter(o => {
      // 1. Phân loại đơn: Xe hoặc Phụ tùng
      const orderType = o.loaiDon || 'PhuTung';
      if (activeOrderTypeTab !== 'TatCa' && orderType !== activeOrderTypeTab) return false;

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
        const matchId = matchVietnameseSearch(o.id, orderSearch);
        const matchName = matchVietnameseSearch(o.hoTenKH, orderSearch);
        const matchPhone = matchVietnameseSearch(o.soDienThoai || '', orderSearch);
        const matchVehicle = o.thongTinXe ? matchVietnameseSearch(o.thongTinXe.tenXe, orderSearch) : false;
        const matchVin = o.thongTinXe?.soKhungVIN ? matchVietnameseSearch(o.thongTinXe.soKhungVIN, orderSearch) : false;
        if (!matchId && !matchName && !matchPhone && !matchVehicle && !matchVin) return false;
      }

      return true;
    });

    // Tự động sắp xếp đơn hàng:
    // - Ưu tiên các đơn hàng chưa hoàn thành (Chờ xử lý, Đang xử lý, Đang giao, Chờ giao xe...) hiển thị ở phía trên
    // - Các đơn hàng đã hoàn thành (HoanThanh, DaGiao) hoặc đã hủy (DaHuy) tự động chuyển xuống cuối danh sách
    return list.sort((a, b) => {
      const isDoneA = a.trangThai === 'HoanThanh' || a.trangThai === 'DaGiao' || a.trangThai === 'DaHuy';
      const isDoneB = b.trangThai === 'HoanThanh' || b.trangThai === 'DaGiao' || b.trangThai === 'DaHuy';

      if (isDoneA !== isDoneB) {
        return isDoneA ? 1 : -1; // Đơn hoàn thành chuyển xuống cuối
      }

      // Trong cùng nhóm: Sắp xếp theo ngày đặt mới nhất lên đầu
      const dateA = new Date(a.ngayDat).getTime() || 0;
      const dateB = new Date(b.ngayDat).getTime() || 0;
      if (dateB !== dateA) return dateB - dateA;

      return b.id.localeCompare(a.id);
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

      {/* ── ĐH08: TÁCH TAB (TẤT CẢ / ĐƠN HÀNG XE / ĐƠN HÀNG PHỤ TÙNG) ── */}
      <div className="flex border-b border-zinc-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveOrderTypeTab('TatCa')}
          className={`pb-3 text-sm font-extrabold uppercase tracking-wider transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeOrderTypeTab === 'TatCa'
              ? 'border-red-700 text-red-700'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <span>📋</span>
          <span>Tất Cả Đơn Hàng</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-zinc-100 text-zinc-700">
            {orders.length}
          </span>
        </button>

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
            {activeOrderTypeTab === 'TatCa' ? 'tất cả' : activeOrderTypeTab === 'Xe' ? 'Xe mới' : 'Phụ tùng'}
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
                ) : activeOrderTypeTab === 'PhuTung' ? (
                  <th style={{ ...thSt, color: 'white' }}>SẢN PHẨM PHỤ TÙNG</th>
                ) : (
                  <>
                    <th style={{ ...thSt, color: 'white' }}>LOẠI ĐƠN</th>
                    <th style={{ ...thSt, color: 'white' }}>MẶT HÀNG / XE</th>
                  </>
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
                  <td colSpan={activeOrderTypeTab === 'Xe' ? 11 : activeOrderTypeTab === 'PhuTung' ? 9 : 10} className="py-12 text-center text-zinc-400 text-sm">
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

                      {/* Các cột đặc thù theo Tab - Khớp 100% với thead (Ảnh 1) */}
                      {activeOrderTypeTab === 'Xe' ? (
                        <>
                          <td style={tdSt}>
                            <div className="font-bold text-zinc-900">{order.thongTinXe?.tenXe || 'Xe máy'}</div>
                            <div className="text-xs text-zinc-500">
                              Màu: <strong>{order.thongTinXe?.mauSac || 'Tiêu chuẩn'}</strong>
                            </div>
                            {order.thongTinXe?.phienBan && (
                              <div className="text-[10px] text-zinc-400">{order.thongTinXe.phienBan}</div>
                            )}
                            {(order.thongTinXe?.ngayNhanXacNhan || order.thongTinXe?.ngayGiaoXe) && (
                              <div className="mt-1 text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1">
                                <span>📅 Nhận:</span>
                                <span>{order.thongTinXe.ngayNhanXacNhan || order.thongTinXe.ngayGiaoXe}</span>
                                {order.thongTinXe.gioNhanXacNhan || order.thongTinXe.khungGioGiao ? (
                                  <span>({order.thongTinXe.gioNhanXacNhan || order.thongTinXe.khungGioGiao})</span>
                                ) : null}
                              </div>
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
                      ) : activeOrderTypeTab === 'PhuTung' ? (
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
                      ) : (
                        /* activeOrderTypeTab === 'TatCa': Khớp chuẩn 2 cột thead (LOẠI ĐƠN & MẶT HÀNG / XE) */
                        <>
                          <td style={tdSt}>
                            {isVehicle ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <span>🏍️</span> Xe máy
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <span>📦</span> Phụ tùng
                              </span>
                            )}
                          </td>
                          <td style={tdSt}>
                            {isVehicle ? (
                              <div>
                                <div className="font-bold text-zinc-900">{order.thongTinXe?.tenXe || 'Xe máy'}</div>
                                <div className="text-xs text-zinc-500">
                                  Màu: <strong>{order.thongTinXe?.mauSac || 'Tiêu chuẩn'}</strong>
                                  {order.thongTinXe?.soKhungVIN && (
                                    <span className="ml-2 font-mono text-[11px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700">
                                      VIN: {order.thongTinXe.soKhungVIN}
                                    </span>
                                  )}
                                </div>
                                {order.thongTinXe?.soTienDatCoc !== undefined && (
                                  <div className="text-[11px] text-emerald-700 font-mono">
                                    Cọc: {formatVND(order.thongTinXe.soTienDatCoc)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="text-xs font-medium text-zinc-900 truncate max-w-[200px]">
                                  {order.items && order.items.length > 0
                                    ? order.items.map(i => `${i.tenSanPham} (x${i.soLuong})`).join(', ')
                                    : 'Phụ tùng chính hãng'}
                                </div>
                                <div className="text-[10px] text-zinc-400 font-mono">
                                  {order.items?.length || 0} sản phẩm
                                </div>
                              </div>
                            )}
                          </td>
                        </>
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
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge
                            status={order.trangThaiThanhToan || 'DaThanhToan'}
                            configs={paymentStatuses}
                          />
                          {order.trangThaiThanhToan === 'ChuaThanhToan' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Xác nhận đã nhận đủ tiền thanh toán cho đơn hàng #${order.id}?`)) {
                                  handleUpdatePaymentStatus(order.id, 'DaThanhToan');
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 mt-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition cursor-pointer shadow-xs whitespace-nowrap"
                              title="Xác nhận đã thu tiền cho đơn hàng này"
                            >
                              💵 Đã thu tiền
                            </button>
                          )}
                          {order.trangThaiThanhToan === 'DaCoc' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Xác nhận đã thu đủ 100% tiền cho đơn hàng #${order.id}?`)) {
                                  handleUpdatePaymentStatus(order.id, 'DaThanhToan');
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 mt-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 transition cursor-pointer shadow-xs whitespace-nowrap"
                              title="Xác nhận đã thu đủ số tiền còn lại"
                            >
                              💵 Thu đủ 100%
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Cột Trạng thái giao hàng */}
                      <td style={tdSt}>
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge status={order.trangThai} configs={orderStatuses} />
                          {/* Đã hủy hoặc Hoàn thành / Đã giao: KHÓA BẮT BUỘC, không hiển thị dropdown */}
                          {(order.trangThai === 'HoanThanh' || order.trangThai === 'DaGiao') ? (
                            <span className="text-[10px] text-emerald-700 font-bold font-mono mt-0.5 flex items-center gap-1">
                              🔒 Đã hoàn thành (Khóa cứng)
                            </span>
                          ) : order.trangThai === 'DaHuy' ? (
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
                                .filter(s => {
                                  if (s.key === 'DaHuy' || s.key === 'HoanThanh') return false;
                                  const isVehicle = order.loaiDon === 'Xe' || !!order.thongTinXe || (order.id && order.id.includes('XE'));
                                  const isHomeDelivery = isVehicle && (order.thongTinXe?.hinhThucGiao === 'HomeDelivery' || order.ghiChu?.includes('GIAO TẬN NƠI'));
                                  if (isVehicle) {
                                    if (isHomeDelivery) {
                                      return s.key === 'ChoDuyet' || s.key === 'ChoKhachXacNhanNgayNhan' || s.key === 'DangGiao' || s.key === 'DaGiao';
                                    }
                                    return s.key === 'ChoDuyet' || s.key === 'ChoKhachXacNhanNgayNhan' || s.key === 'ChoGiaoXe';
                                  } else {
                                    return s.key === 'ChoDuyet' || s.key === 'DaXacNhan' || s.key === 'DangGiao' || s.key === 'DaGiao';
                                  }
                                })
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
                          {(() => {
                            const isVehicle = order.loaiDon === 'Xe' || !!order.thongTinXe || (order.id && order.id.includes('XE'));
                            const isHomeDelivery = isVehicle && (order.thongTinXe?.hinhThucGiao === 'HomeDelivery' || order.ghiChu?.includes('GIAO TẬN NƠI'));
                            if (isVehicle) {
                              return (
                                <>
                                  {order.trangThai === 'ChoDuyet' && (
                                    <div className="flex items-center gap-1 flex-wrap justify-center">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(order.id, 'ChoKhachXacNhanNgayNhan')}
                                        title="Duyệt đơn đặt xe (Chờ khách hàng xác nhận ngày đặt/nhận xe)"
                                        className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                                      >
                                        <span>✓</span> Duyệt đơn xe
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(order.id, isHomeDelivery ? 'DangGiao' : 'ChoGiaoXe')}
                                        title={isHomeDelivery ? "Duyệt và chuyển thẳng sang Đang giao xe" : "Duyệt và chuyển thẳng sang Chờ giao xe"}
                                        className="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                                      >
                                        <span>{isHomeDelivery ? '🚚' : '🏎️'}</span> {isHomeDelivery ? 'Đang giao xe' : 'Chờ giao xe'}
                                      </button>
                                    </div>
                                  )}
                                  {order.trangThai === 'ChoKhachXacNhanNgayNhan' && (
                                    <div className="flex items-center gap-1 flex-wrap justify-center">
                                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold flex items-center gap-1">
                                        <span>⏳</span> Chờ KH xác nhận ngày nhận
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(order.id, isHomeDelivery ? 'DangGiao' : 'ChoGiaoXe')}
                                        title={isHomeDelivery ? "Admin xác nhận thay KH và chuyển sang Đang giao xe" : "Admin hỗ trợ xác nhận thay khách hàng để chuyển sang Chờ giao xe"}
                                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                                      >
                                        <span>✓</span> {isHomeDelivery ? 'Điều phối giao xe' : 'Chuyển Chờ giao xe'}
                                      </button>
                                    </div>
                                  )}
                                  {order.trangThai === 'ChoGiaoXe' && (
                                    <>
                                      {isHomeDelivery ? (
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateStatus(order.id, 'DangGiao')}
                                          title="Bắt đầu vận chuyển giao xe tận nhà cho khách hàng"
                                          className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                                        >
                                          <span>🚚</span> Đang giao xe
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setOrderToPrint(order)}
                                          title="Mở hóa đơn & thu tiền bàn giao xe tại Showroom"
                                          className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                                        >
                                          <span>🏎️</span> Bàn giao xe
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(order.id, 'HoanThanh')}
                                        title="Xác nhận giao xe thành công, kích hoạt xe vào tài khoản khách & gửi khảo sát xe mới"
                                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                                      >
                                        <span>✅</span> Giao xe thành công
                                      </button>
                                    </>
                                  )}
                                  {order.trangThai === 'DangGiao' && (
                                    <div className="flex items-center gap-1 flex-wrap justify-center">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(order.id, 'DaGiao')}
                                        title="Xác nhận xe đã giao tới địa chỉ khách hàng"
                                        className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                                      >
                                        <span>📦</span> Đã giao tới nhà
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(order.id, 'HoanThanh')}
                                        title="Hoàn tất đơn hàng giao xe tận nhà"
                                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                                      >
                                        <span>✅</span> Hoàn thành
                                      </button>
                                    </div>
                                  )}
                                  {order.trangThai === 'DaGiao' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(order.id, 'HoanThanh')}
                                      title="Khách đã nhận xe, hoàn tất đơn hàng và gửi khảo sát xe mới"
                                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                                    >
                                      <span>✅</span> Hoàn tất đơn hàng
                                    </button>
                                  )}
                                </>
                              );
                            }

                            // Đơn phụ tùng thông thường
                            return (
                              <>
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
                                    title="Xác nhận đã giao hàng thành công (Khóa cứng hoàn tất)"
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                                  >
                                    <span>✅</span> Đã giao (Khóa cứng)
                                  </button>
                                )}
                                {order.trangThai === 'DaGiao' && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(order.id, 'HoanThanh')}
                                    title="Hoàn tất đơn hàng"
                                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                                  >
                                    <span>✅</span> Hoàn tất
                                  </button>
                                )}
                              </>
                            );
                          })()}

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

                          {/* Nút Xóa (ĐH05) - Chỉ hiển thị khi đơn chưa hoàn thành và chưa hủy */}
                          {order.trangThai !== 'HoanThanh' && order.trangThai !== 'DaGiao' && order.trangThai !== 'DaHuy' && (
                            <button
                              type="button"
                              onClick={() => setOrderToDelete(order)}
                              title="Xóa đơn hàng"
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                            >
                              🗑️
                            </button>
                          )}
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

      {/* ══════════ MODAL: TẠO ĐƠN HÀNG BÁN XE CHUẨN ẢNH 2 (ĐH06 OPTION 2, LH28, LH29, LH30, LH31) ══════════ */}
      {showCreateVehicleModal && (
        <CreateVehicleOrderModal
          customers={customersList}
          currentStaff={currentStaff}
          preFillAppointment={initialPreFillVehicleOrder}
          orders={orders}
          onClose={() => {
            setShowCreateVehicleModal(false);
            if (onCancelPreFill) onCancelPreFill();
            else if (onClearPreFill) onClearPreFill();
          }}
          onSuccess={newOrd => {
            setOrders(prev => {
              const exists = prev.some(o => o.id === newOrd.id || parseInt(o.id.replace(/\D/g, ''), 10) === parseInt(newOrd.id.replace(/\D/g, ''), 10));
              if (exists) {
                return prev.map(o => (o.id === newOrd.id || parseInt(o.id.replace(/\D/g, ''), 10) === parseInt(newOrd.id.replace(/\D/g, ''), 10)) ? newOrd : o);
              }
              return [newOrd, ...prev];
            });
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
          onUpdatePaymentStatus={(newPayStatus) => {
            handleUpdatePaymentStatus(selectedOrderForDetail.id, newPayStatus);
          }}
          onPrint={() => {
            const ord = selectedOrderForDetail;
            setOrderToPrint(ord);
          }}
        />
      )}

      {/* ══════════ MODAL: IN HÓA ĐƠN BÁN HÀNG / BÀN GIAO XE (ĐH07) ══════════ */}
      {orderToPrint && (
        <PrintInvoiceModal
          order={orderToPrint}
          onClose={() => setOrderToPrint(null)}
          onCompleteOrder={(id) => handleUpdateStatus(id, 'HoanThanh')}
        />
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
// SUB-COMPONENT: MODAL TẠO ĐƠN BÁN XE CHUẨN 100% ẢNH 2 (ĐH06, LH28, LH29, LH30, LH31, LH32, LH33)
// ────────────────────────────────────────────────────────────
function CreateVehicleOrderModal({
  customers,
  currentStaff,
  preFillAppointment,
  orders = [],
  onClose,
  onSuccess,
}: {
  customers: Customer[];
  currentStaff?: StaffAccount | null;
  preFillAppointment?: Appointment | null;
  orders?: Order[];
  onClose: () => void;
  onSuccess: (order: Order) => void;
}) {
  // LH32: Quản lý 2 bước: Nhập thông tin (EDIT_FORM) và Xem trước hóa đơn (PREVIEW_INVOICE)
  const [modalStep, setModalStep] = useState<'EDIT_FORM' | 'PREVIEW_INVOICE'>('EDIT_FORM');

  // LH30: Key lưu nháp gắn liền với lịch hẹn hoặc đơn mới
  const draftKey = `crm_draft_vehicle_order_${preFillAppointment?.id || 'manual'}`;
  const [draftBanner, setDraftBanner] = useState<string | null>(null);
  const [saveDraftToast, setSaveDraftToast] = useState<string | null>(null);

  // LH28: Validation errors inline
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Danh mục 50 xe chuẩn từ API
  const catalogVehicles = useMemo<CatalogVehicle[]>(() => {
    try {
      const list = catalogVehicleApi.getAllSync();
      if (list && list.length > 0) return list;
    } catch {}
    return (DEFAULT_CATALOG_VEHICLES && DEFAULT_CATALOG_VEHICLES.length > 0)
      ? DEFAULT_CATALOG_VEHICLES
      : (showroomVehicles as any);
  }, []);

  // Popup tìm kiếm 50 xe mẫu (Ảnh 2)
  const [showVehicleSearchModal, setShowVehicleSearchModal] = useState<boolean>(false);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState<string>('');
  const [vehicleBrandFilter, setVehicleBrandFilter] = useState<string>('Tất cả');

  // Dò tìm đơn hàng xe liên kết nếu có preFillAppointment (từ nút Nhận xe mới)
  const linkedOrder = useMemo(() => {
    if (!preFillAppointment) return null;
    if (preFillAppointment.maDonHangXe) {
      const found = orders.find(o => o.id === preFillAppointment.maDonHangXe);
      if (found) return found;
    }
    if (preFillAppointment.maLichHen) {
      const found = orders.find(o => o.maLichHen === preFillAppointment.maLichHen);
      if (found) return found;
    }
    if (preFillAppointment.customerId) {
      const found = orders.find(o => o.customerId === preFillAppointment.customerId && o.loaiDon === 'Xe' && o.trangThai !== 'DaHuy');
      if (found) return found;
    }
    return null;
  }, [preFillAppointment, orders]);

  // Dò tìm thông tin khách hàng từ customers list
  const matchedCustomer = useMemo(() => {
    const custId = preFillAppointment?.customerId || linkedOrder?.customerId;
    if (custId) {
      const c = customers.find(x => x.id === custId);
      if (c) return c;
    }
    const phoneNum = preFillAppointment?.soDienThoai || linkedOrder?.soDienThoai;
    if (phoneNum) {
      const c = customers.find(x => x.soDienThoai === phoneNum);
      if (c) return c;
    }
    return null;
  }, [preFillAppointment, linkedOrder, customers]);

  // Initial values computed safely (Đồng bộ tuyệt đối dữ liệu xe khách đã đặt và khách hàng thực tế)
  const initialCustomerName = preFillAppointment?.hoTenKH || linkedOrder?.hoTenKH || matchedCustomer?.hoTen || customers[0]?.hoTen || '';
  const initialCustId = preFillAppointment?.customerId || linkedOrder?.customerId || matchedCustomer?.id || customers[0]?.id || 'KH001';
  const initialPhone = preFillAppointment?.soDienThoai || linkedOrder?.soDienThoai || matchedCustomer?.soDienThoai || customers[0]?.soDienThoai || '';
  const initialEmail = linkedOrder?.email || matchedCustomer?.email || (matchedCustomer as any)?.email || customers[0]?.email || 'khachhang@gmail.com';
  const initialIdCard = (matchedCustomer as any)?.soCCCD || (matchedCustomer as any)?.idCard || (matchedCustomer as any)?.cccd || linkedOrder?.thongTinXe?.idCardTaxNo || '079090123456';
  const initialAddress = linkedOrder?.diaChiGiao || preFillAppointment?.diaChiGiao || matchedCustomer?.diaChi || '123 Lê Văn Sỹ, P.13, Q.3, TP.HCM';
  const initialNotes = linkedOrder?.ghiChu || preFillAppointment?.ghiChu || 'Khách nhận xe mới tại showroom';

  const initialVehicleModel = preFillAppointment?.tenXe || linkedOrder?.thongTinXe?.tenXe || catalogVehicles[0]?.tenXe || 'Honda SH 160i ABS 2025';
  const initialColor = preFillAppointment?.mauXe || linkedOrder?.thongTinXe?.mauSac || 'Đen mờ';
  const initialDriveTrain = preFillAppointment?.phienBan || linkedOrder?.thongTinXe?.dongCo || linkedOrder?.thongTinXe?.phienBan || 'Bản Thể Thao ABS (156.9cc eSP+)';
  const initialVin = preFillAppointment?.soKhungVIN || linkedOrder?.thongTinXe?.soKhungVIN || ('RLHKD160CB' + Math.floor(1000000 + Math.random() * 9000000));
  const initialEngine = preFillAppointment?.soMay || linkedOrder?.thongTinXe?.soMay || ('KF12E-' + Math.floor(1000000 + Math.random() * 9000000));

  const isPaid100 = Boolean(
    preFillAppointment?.daThanhToan100 ||
    linkedOrder?.trangThaiThanhToan === 'DaThanhToan' ||
    (linkedOrder?.thongTinXe && linkedOrder.thongTinXe.soTienConLai === 0)
  );

  const initialDeposit = preFillAppointment?.soTienCoc !== undefined
    ? preFillAppointment.soTienCoc
    : (linkedOrder?.thongTinXe?.soTienDatCoc !== undefined ? linkedOrder.thongTinXe.soTienDatCoc : (isPaid100 ? (linkedOrder?.tongTien || 95900000) : 2000000));

  const hasPrePaidDeposit = Boolean(
    (preFillAppointment && preFillAppointment.soTienCoc !== undefined && preFillAppointment.soTienCoc > 0) ||
    (linkedOrder && linkedOrder.thongTinXe?.soTienDatCoc && linkedOrder.thongTinXe.soTienDatCoc > 0) ||
    isPaid100
  );

  // LH33: Tìm kiếm KH không có giá trị mặc định nào
  const [custSearch, setCustSearch] = useState('');
  const [customerType, setCustomerType] = useState<'Individual' | 'Business'>('Individual');
  const [selectedCustId, setSelectedCustId] = useState(initialCustId);
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [idCardTax, setIdCardTax] = useState(initialIdCard);
  const [address, setAddress] = useState(initialAddress);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [customerNotes, setCustomerNotes] = useState(initialNotes);

  // Khối 2: Thông tin xe & VIN
  const [selectedVehicleModel, setSelectedVehicleModel] = useState<string>(initialVehicleModel);
  const [specificColor, setSpecificColor] = useState<string>(initialColor);
  const [driveTrain, setDriveTrain] = useState<string>(initialDriveTrain);
  const [vinNumber, setVinNumber] = useState<string>(initialVin);
  const [engineNumber, setEngineNumber] = useState<string>(initialEngine);

  // Khối 3: Phân rã giá trị & Thanh toán (Ưu tiên giá niêm yết từ đơn đặt hoặc tra cứu 50 xe)
  const basePrice = useMemo(() => {
    if (linkedOrder?.thongTinXe?.giaNiemYet && (
      linkedOrder.thongTinXe.tenXe.toLowerCase().trim() === selectedVehicleModel.toLowerCase().trim() ||
      preFillAppointment?.tenXe?.toLowerCase().trim() === selectedVehicleModel.toLowerCase().trim()
    )) {
      return linkedOrder.thongTinXe.giaNiemYet;
    }
    const matched = catalogVehicles.find(x =>
      x.tenXe.toLowerCase().trim() === selectedVehicleModel.toLowerCase().trim() ||
      x.tenXe.toLowerCase().includes(selectedVehicleModel.toLowerCase()) ||
      selectedVehicleModel.toLowerCase().includes(x.tenXe.toLowerCase())
    );
    if (matched) return matched.giaNiemYet;
    return linkedOrder?.tongTien || 95900000;
  }, [selectedVehicleModel, catalogVehicles, linkedOrder, preFillAppointment]);

  const [taxPercent, setTaxPercent] = useState<number>(5); // Thuế trước bạ 5% xe máy
  const [plateLocation, setPlateLocation] = useState<'HCM' | 'HN' | 'TINH'>('HCM');
  const plateFee = plateLocation === 'HCM' || plateLocation === 'HN' ? 4000000 : 800000;

  const [insurancePkg, setInsurancePkg] = useState<string>('TNDS_VAT_CHAT');
  const insuranceFee = insurancePkg === 'TNDS_VAT_CHAT' ? 1205000 : insurancePkg === 'TNDS' ? 66000 : 0;

  // LH29: Khuyến mãi 2 hình thức (VNĐ và %)
  const [discountType, setDiscountType] = useState<'VND' | 'PERCENT'>('VND');
  const [discountInput, setDiscountInput] = useState<number>(1000000);

  const subtotalBeforeDiscount = useMemo(() => {
    const taxAmount = (basePrice * taxPercent) / 100;
    return basePrice + taxAmount + plateFee + insuranceFee;
  }, [basePrice, taxPercent, plateFee, insuranceFee]);

  const discountAmount = useMemo(() => {
    if (discountType === 'PERCENT') {
      const pct = Math.max(0, Math.min(100, Number(discountInput) || 0));
      return Math.round((subtotalBeforeDiscount * pct) / 100);
    } else {
      const val = Math.max(0, Number(discountInput) || 0);
      return Math.min(val, subtotalBeforeDiscount);
    }
  }, [discountType, discountInput, subtotalBeforeDiscount]);

  // Tổng tiền
  const totalAmount = useMemo(() => {
    return Math.max(0, subtotalBeforeDiscount - discountAmount);
  }, [subtotalBeforeDiscount, discountAmount]);

  // LH28: Đặt cọc (Nếu đã cọc từ lịch hẹn hoặc thanh toán 100% thì khóa cứng)
  const [depositAmount, setDepositAmount] = useState<number>(() => {
    if (isPaid100) {
      return (initialDeposit && initialDeposit > 2000000) ? initialDeposit : totalAmount;
    }
    return initialDeposit || 2000000;
  });
  const [depositDate, setDepositDate] = useState<string>(preFillAppointment?.ngayHen || new Date().toISOString().split('T')[0]);

  const rawRemainingAmount = isPaid100 ? 0 : Math.max(0, totalAmount - depositAmount);
  // Checkbox: Thu nốt tiền còn thiếu tại quầy
  const [thuNotTienConThieu, setThuNotTienConThieu] = useState<boolean>(isPaid100);

  const effectiveRemainingAmount = (thuNotTienConThieu || isPaid100) ? 0 : rawRemainingAmount;
  const effectivePaymentStatus: PaymentStatus = effectiveRemainingAmount === 0 ? 'DaThanhToan' : (depositAmount > 0 ? 'DaCoc' : 'ChuaThanhToan');

  const [paymentMethod, setPaymentMethod] = useState<'TienMat' | 'ChuyenKhoan' | 'TraGop'>('ChuyenKhoan');
  const [bankAccount, setBankAccount] = useState('Vietcombank: 1012345678 (DAILYXEMAY SHOWROOM)');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('ChoGiaoXe');

  // Khối 4: Dịch vụ & Giao xe (Tự động nạp lựa chọn Giao tận nơi hoặc Tại Showroom của khách)
  const [deliveryMethod, setDeliveryMethod] = useState<'Showroom' | 'HomeDelivery'>(() => {
    if (preFillAppointment?.hinhThucGiao) return preFillAppointment.hinhThucGiao;
    if (preFillAppointment?.ghiChu?.includes('GIAO XE TẬN NƠI')) return 'HomeDelivery';
    return 'Showroom';
  });
  const [deliveryDate, setDeliveryDate] = useState<string>(preFillAppointment?.ngayHen || new Date().toISOString().split('T')[0]);
  const [deliveryPlace, setDeliveryPlace] = useState<string>(() => {
    if (preFillAppointment?.diaChiGiao) return preFillAppointment.diaChiGiao;
    if (preFillAppointment?.hinhThucGiao === 'HomeDelivery' || preFillAppointment?.ghiChu?.includes('GIAO XE TẬN NƠI')) {
      return preFillAppointment?.ghiChu?.match(/GIAO XE TẬN NƠI tại:\s*([^.]+)/)?.[1]?.trim() || address || 'Địa chỉ giao tận nơi của khách hàng';
    }
    return 'Showroom Chính Motoshop: 123 Lê Văn Sỹ, P.13, Q.3, TP.HCM';
  });

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

  // Danh sách xe lọc theo hãng và từ khóa (Ảnh 2)
  const filteredVehicles = useMemo(() => {
    return catalogVehicles.filter(v => {
      const matchBrand = vehicleBrandFilter === 'Tất cả' || v.hang.toLowerCase() === vehicleBrandFilter.toLowerCase();
      const matchQuery =
        !vehicleSearchQuery.trim() ||
        matchVietnameseSearch(v.tenXe, vehicleSearchQuery) ||
        matchVietnameseSearch(v.hang, vehicleSearchQuery) ||
        (v.phanKhuc ? matchVietnameseSearch(v.phanKhuc, vehicleSearchQuery) : false) ||
        (v.dungTichXiLanh ? matchVietnameseSearch(v.dungTichXiLanh, vehicleSearchQuery) : false) ||
        matchVietnameseSearch(v.id, vehicleSearchQuery);
      return matchBrand && matchQuery;
    });
  }, [catalogVehicles, vehicleBrandFilter, vehicleSearchQuery]);

  // LH30: Tự động khôi phục dữ liệu từ bản nháp (Auto Restore Draft)
  useEffect(() => {
    // Nếu mở từ Lịch hẹn (Nhận xe mới): Ưu tiên tuyệt đối dữ liệu xe khách đã đặt
    if (preFillAppointment) {
      setSelectedCustId(initialCustId);
      setCustomerName(initialCustomerName);
      setPhone(initialPhone);
      setEmail(initialEmail);
      setIdCardTax(initialIdCard);
      setAddress(initialAddress);
      setSelectedVehicleModel(initialVehicleModel);
      setSpecificColor(initialColor);
      setDriveTrain(initialDriveTrain);
      setVinNumber(initialVin);
      setEngineNumber(initialEngine);
      if (initialDeposit !== undefined) setDepositAmount(initialDeposit);
      setThuNotTienConThieu(isPaid100);
      return;
    }

    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        if (d.customerType) setCustomerType(d.customerType);
        if (d.selectedCustId) setSelectedCustId(d.selectedCustId);
        if (d.customerName) setCustomerName(d.customerName);
        if (d.idCardTax) setIdCardTax(d.idCardTax);
        if (d.address) setAddress(d.address);
        if (d.phone) setPhone(d.phone);
        if (d.email) setEmail(d.email);
        if (d.customerNotes !== undefined) setCustomerNotes(d.customerNotes);

        if (d.selectedVehicleModel) setSelectedVehicleModel(d.selectedVehicleModel);
        if (d.specificColor) setSpecificColor(d.specificColor);
        if (d.driveTrain) setDriveTrain(d.driveTrain);
        if (d.vinNumber) setVinNumber(d.vinNumber);
        if (d.engineNumber) setEngineNumber(d.engineNumber);

        if (d.taxPercent !== undefined) setTaxPercent(d.taxPercent);
        if (d.plateLocation) setPlateLocation(d.plateLocation);
        if (d.insurancePkg) setInsurancePkg(d.insurancePkg);
        if (d.discountType) setDiscountType(d.discountType);
        if (d.discountInput !== undefined) setDiscountInput(d.discountInput);

        if (!hasPrePaidDeposit && d.depositAmount !== undefined) setDepositAmount(d.depositAmount);
        if (!hasPrePaidDeposit && d.depositDate) setDepositDate(d.depositDate);
        if (d.paymentMethod) setPaymentMethod(d.paymentMethod);
        if (d.bankAccount) setBankAccount(d.bankAccount);
        if (d.orderStatus) setOrderStatus(d.orderStatus);
        if (d.thuNotTienConThieu !== undefined) setThuNotTienConThieu(d.thuNotTienConThieu);

        if (d.deliveryMethod) setDeliveryMethod(d.deliveryMethod);
        if (d.deliveryDate) setDeliveryDate(d.deliveryDate);
        if (d.deliveryPlace) setDeliveryPlace(d.deliveryPlace);
        if (d.checklist) setChecklist(d.checklist);

        setDraftBanner(`Đã tự động khôi phục dữ liệu từ bản nháp lúc ${d.savedAt || 'trước đó'}.`);
      }
    } catch (e) {
      console.warn('Lỗi đọc bản nháp:', e);
    }
  }, [draftKey, preFillAppointment, hasPrePaidDeposit]);

  // LH30: Hàm Lưu nháp
  const handleSaveDraft = () => {
    const nowStr = new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN');
    const draftData = {
      savedAt: nowStr,
      customerType,
      selectedCustId,
      customerName,
      idCardTax,
      address,
      phone,
      email,
      customerNotes,
      selectedVehicleModel,
      specificColor,
      driveTrain,
      vinNumber,
      engineNumber,
      taxPercent,
      plateLocation,
      insurancePkg,
      discountType,
      discountInput,
      depositAmount,
      depositDate,
      paymentMethod,
      bankAccount,
      orderStatus,
      thuNotTienConThieu,
      deliveryMethod,
      deliveryDate,
      deliveryPlace,
      checklist,
    };
    try {
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setDraftBanner(`Đã lưu bản nháp lúc ${nowStr}.`);
      setSaveDraftToast(`✓ Đã lưu bản nháp thành công (${nowStr})!`);
      setTimeout(() => setSaveDraftToast(null), 3500);
    } catch (err) {
      alert('Không thể lưu bản nháp vào bộ nhớ trình duyệt!');
    }
  };

  // LH30: Hàm Xóa nháp & Nhập mới
  const handleClearDraft = () => {
    localStorage.removeItem(draftKey);
    setDraftBanner(null);
    setErrors({});
    setCustSearch('');
    setCustomerType('Individual');
    setSelectedCustId(initialCustId);
    setCustomerName(initialCustomerName);
    setIdCardTax(initialIdCard);
    setAddress(initialAddress);
    setPhone(initialPhone);
    setEmail(initialEmail);
    setCustomerNotes(initialNotes);
    setSelectedVehicleModel(initialVehicleModel);
    setSpecificColor(initialColor);
    setDriveTrain(initialDriveTrain);
    setVinNumber(initialVin);
    setEngineNumber(initialEngine);
    setTaxPercent(5);
    setPlateLocation('HCM');
    setInsurancePkg('TNDS_VAT_CHAT');
    setDiscountType('VND');
    setDiscountInput(1000000);
    setDepositAmount(initialDeposit);
    setDepositDate(preFillAppointment?.ngayHen || new Date().toISOString().split('T')[0]);
    setThuNotTienConThieu(isPaid100);
    setPaymentMethod('ChuyenKhoan');
    setOrderStatus('ChoGiaoXe');
    setDeliveryMethod(preFillAppointment?.hinhThucGiao || 'Showroom');
    setDeliveryDate(preFillAppointment?.ngayHen || new Date().toISOString().split('T')[0]);
    setDeliveryPlace(initialAddress || 'Showroom DailyXeMay - Chi nhánh Trung Tâm');
    setChecklist({
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
  };

  // Handle Search Customer
  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustId(c.id);
    setCustomerName(c.hoTen);
    setPhone(c.soDienThoai);
    setEmail(c.email || '');
    setAddress(c.diaChi || '');
    if ((c as any).soCCCD || (c as any).idCard || (c as any).cccd) {
      setIdCardTax((c as any).soCCCD || (c as any).idCard || (c as any).cccd);
    }
    setCustSearch(''); // Làm sạch ô tìm kiếm sau khi chọn
    setErrors(prev => ({ ...prev, customerName: '', phone: '', email: '', address: '', idCardTax: '' }));
  };

  // LH28: Validate Form
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    // 1. Họ và tên: Bắt buộc, không chỉ khoảng trắng, không số, không ký tự đặc biệt
    const rawName = customerName.trim();
    const sanitizedName = rawName.replace(/\s+/g, ' ');
    const nameRegex = /^[a-zA-ZàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s]+$/;
    if (!sanitizedName) {
      errs.customerName = 'Họ và tên bắt buộc nhập, không được để trống hoặc chỉ chứa khoảng trắng!';
    } else if (!nameRegex.test(sanitizedName)) {
      errs.customerName = 'Họ và tên không hợp lệ! Chỉ được chứa chữ cái, không được chứa số hoặc ký tự đặc biệt.';
    }

    // 2. CCCD: Bắt buộc, đúng 12 chữ số
    const cccd = idCardTax.trim();
    if (!cccd) {
      errs.idCardTax = 'Số CCCD bắt buộc nhập!';
    } else if (!/^\d{12}$/.test(cccd)) {
      errs.idCardTax = 'Số CCCD phải gồm đúng 12 chữ số (không chứa chữ hoặc ký tự đặc biệt)!';
    }

    // 3. Địa chỉ đăng ký xe: Bắt buộc, 5 - 255 ký tự
    const addr = address.trim();
    if (!addr) {
      errs.address = 'Địa chỉ đăng ký xe bắt buộc nhập!';
    } else if (addr.length < 5 || addr.length > 255) {
      errs.address = 'Địa chỉ đăng ký xe phải từ 5 đến 255 ký tự!';
    }

    // 4. Số điện thoại: Bắt buộc, đúng 10 số bắt đầu bằng 0
    const p = phone.trim();
    if (!p) {
      errs.phone = 'Số điện thoại bắt buộc nhập!';
    } else if (!/^0\d{9}$/.test(p)) {
      errs.phone = 'Số điện thoại không hợp lệ! Phải gồm đúng 10 chữ số và bắt đầu bằng số 0 (VD: 0901234567).';
    }

    // 5. Email: Bắt buộc, đúng định dạng
    const mail = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!mail) {
      errs.email = 'Email bắt buộc nhập!';
    } else if (!emailRegex.test(mail)) {
      errs.email = 'Email sai định dạng! Ví dụ hợp lệ: abc@gmail.com';
    }

    // 6. Khuyến mãi: VNĐ hoặc %
    if (discountType === 'VND') {
      if (discountInput < 0) {
        errs.discount = 'Số tiền giảm giá không được âm!';
      } else if (discountInput > subtotalBeforeDiscount) {
        errs.discount = `Số tiền giảm không được vượt quá tổng tiền trước giảm (${formatVND(subtotalBeforeDiscount)})!`;
      }
    } else {
      if (discountInput < 0 || discountInput > 100) {
        errs.discount = 'Tỷ lệ giảm giá theo phần trăm phải nằm trong khoảng từ 0% đến 100%!';
      }
    }

    // 7. Đặc biệt: Bắt buộc tick thu nốt tiền nếu còn tiền thiếu
    // NGOẠI TRỪ: Lịch hẹn nhận xe tại Showroom (Kịch bản 2A cọc 2tr: sẽ thu nốt tiền ở bước 5 khi in hóa đơn bàn giao tại showroom)
    const isShowroomAppt = Boolean(preFillAppointment && (deliveryMethod === 'Showroom' || preFillAppointment.hinhThucGiao === 'Showroom'));
    if (!isShowroomAppt && rawRemainingAmount > 0 && !preFillAppointment?.daThanhToan100) {
      if (!thuNotTienConThieu) {
        errs.thuNotTien = '⚠️ Bắt buộc phải xác nhận "✓ Đã thu nốt số tiền còn thiếu" trước khi tạo hóa đơn!';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // LH32: Xử lý chuyển sang bước xem trước hóa đơn
  const handleGoToPreview = () => {
    if (!validateForm()) {
      return;
    }
    setModalStep('PREVIEW_INVOICE');
  };

  // LH32: Xử lý Xác nhận chính thức tạo hóa đơn
  const handleSubmit = async () => {
    if (!validateForm()) {
      setModalStep('EDIT_FORM');
      return;
    }

    const sanitizedCustomerName = customerName.trim().replace(/\s+/g, ' ');
    setCustomerName(sanitizedCustomerName);

    setSubmitting(true);
    try {
      const catMatch = catalogVehicleApi.getAllSync().find((c: CatalogVehicle) =>
        c.tenXe.toLowerCase().trim() === selectedVehicleModel.toLowerCase().trim() ||
        selectedVehicleModel.toLowerCase().trim().includes(c.tenXe.toLowerCase().trim())
      );
      const vehicleDetails: VehicleOrderDetails = {
        customerType,
        idCardTaxNo: idCardTax.trim(),
        customerNotes,
        tenXe: selectedVehicleModel,
        bienSo: 'Chưa có biển số',
        mauSac: specificColor,
        phienBan: driveTrain,
        dongCo: driveTrain,
        hinhAnh: catMatch?.hinhAnh || '',
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

      const isHomeDel = deliveryMethod === 'HomeDelivery' || preFillAppointment?.hinhThucGiao === 'HomeDelivery';
      // Đơn giao tận nơi: bắt đầu ở trạng thái DangGiao. Đơn Showroom hoặc Mua tại quầy: bắt đầu ở trạng thái ChoGiaoXe
      const initialVehicleOrderStatus: OrderStatus = isHomeDel
        ? 'DangGiao'
        : 'ChoGiaoXe';

      let resOrder: Order | undefined;
      const existingOrderId = preFillAppointment?.maDonHangXe || linkedOrder?.id;

      if (existingOrderId) {
        // CẬP NHẬT ĐƠN XE ĐÃ CÓ (KHÁCH ĐÃ ĐẶT ONLINE), TUYỆT ĐỐI KHÔNG TẠO MỚI ĐỂ TRÁNH DOUBLE ĐƠN HÀNG
        await orderApi.updateStatus(existingOrderId, orderStatus || 'HoanThanh');
        try {
          const cached = localStorage.getItem('crm_orders_cache');
          if (cached) {
            let list: Order[] = JSON.parse(cached);
            const idx = list.findIndex(o => o.id === existingOrderId);
            if (idx !== -1) {
              list[idx] = {
                ...list[idx],
                trangThai: orderStatus || 'HoanThanh',
                trangThaiThanhToan: effectivePaymentStatus,
                tongTien: totalAmount,
                maNV: currentStaff?.id || 'NV01',
                tenNV: currentStaff?.hoTen || 'Nhân viên bán hàng',
                thongTinXe: {
                  ...list[idx].thongTinXe,
                  ...vehicleDetails,
                },
              };
              localStorage.setItem('crm_orders_cache', JSON.stringify(list));
              resOrder = list[idx];
            }
          }
        } catch {}
      } else {
        // 1. Tạo hóa đơn bán xe chính thức (cho khách mua tại quầy)
        const res = await orderApi.createVehicleOrder({
          customerId: selectedCustId,
          hoTenKH: sanitizedCustomerName,
          soDienThoai: phone.trim(),
          email: email.trim(),
          diaChiGiao: address.trim(),
          kenhBan: 'TaiQuay',
          trangThaiThanhToan: effectivePaymentStatus,
          trangThai: initialVehicleOrderStatus,
          tongTien: totalAmount,
          phuongThucThanhToan: paymentMethod,
          maNV: currentStaff?.id || 'NV01',
          tenNV: currentStaff?.hoTen || 'Nhân viên bán hàng',
          ghiChu: customerNotes,
          maLichHen: `HEN-XE-${Math.floor(1000 + Math.random() * 9000)}`,
          thongTinXe: vehicleDetails,
        });
        resOrder = res.order;
      }

      // 2. Hồ sơ xe & Bảo hiểm: CHỈ ĐĂNG KÝ VÀO TÀI KHOẢN KHÁCH KHI MUA TRỰC TIẾP TẠI QUẦY & ĐÃ HOÀN TẤT
      // Các đơn Online (Giao tận nơi hoặc nhận tại Showroom) thì CHƯA ĐĂNG KÝ XE cho đến khi đơn chuyển sang Hoàn thành (khi khách nhận xe)!
      const isDirectStoreCompleted = !preFillAppointment && !isHomeDel && (orderStatus === 'HoanThanh');
      let createdVehicleId = `XE${Date.now().toString().slice(-4)}`;

      if (isDirectStoreCompleted) {
        try {
          const brand = selectedVehicleModel.includes('Yamaha') ? 'Yamaha' : selectedVehicleModel.includes('Suzuki') ? 'Suzuki' : 'Honda';
          const createdV = await vehicleApi.createSoldVehicle({
            customerId: selectedCustId,
            tenXe: selectedVehicleModel,
            hangXe: brand,
            bienSo: 'Chưa có biển số',
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
            insuranceApi.create({
              customerId: selectedCustId,
              hoTenKH: sanitizedCustomerName,
              soDienThoai: phone.trim(),
              email: email.trim() || 'khachhang@motoshop.vn',
              diaChi: address.trim() || 'TP. Hồ Chí Minh',
              vehicleId: createdVehicleId,
              tenXe: selectedVehicleModel,
              bienSo: 'Chưa có biển số',
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
              ghiChu: `Tự động cấp kèm Hóa đơn bán xe #${resOrder?.id || existingOrderId || 'DH-XE-001'}`,
            });
          } catch (insErr) {
            console.warn('Tự động tạo hợp đồng bảo hiểm thất bại:', insErr);
          }
        }
      }

      // 4. Nếu tạo từ lịch hẹn, đổi trạng thái lịch hẹn sang Đã hoàn thành và KHÓA CỨNG (D. BÁN XE)
      if (preFillAppointment) {
        await appointmentApi.updateStatus(preFillAppointment.id, 'DaHoanThanh');
      }

      // 5. LH30: Tạo đơn thành công -> Xóa bản nháp trong localStorage
      localStorage.removeItem(draftKey);

      // 6. Phát sự kiện cập nhật toàn hệ thống
      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_order_completed' } }));

      if (resOrder) {
        onSuccess(resOrder);
      } else {
        alert('Có lỗi khi tạo hóa đơn bán xe!');
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
                {modalStep === 'PREVIEW_INVOICE' ? 'XEM TRƯỚC HÓA ĐƠN BÁN XE (BẢN KIỂM TRA)' : 'TẠO ĐƠN HÀNG BÁN XE MỚI'}
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
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 font-bold text-xl hover:text-zinc-700 transition cursor-pointer p-1 rounded-lg hover:bg-zinc-100"
            title="Đóng / Hủy bỏ"
          >
            ✕
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════════════ */}
        {/* BƯỚC 1: FORM NHẬP THÔNG TIN ĐƠN HÀNG (EDIT_FORM)                           */}
        {/* ════════════════════════════════════════════════════════════════════════════ */}
        {modalStep === 'EDIT_FORM' && (
          <>
            {/* LH30: Banner bản nháp nếu được khôi phục */}
            {draftBanner && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-base">📋</span>
                  <span>{draftBanner}</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="px-2.5 py-1 text-[11px] font-bold text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition cursor-pointer shadow-xs"
                >
                  ✕ Xóa nháp & Nhập mới
                </button>
              </div>
            )}

            {/* LH30: Toast thông báo lưu nháp */}
            {saveDraftToast && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
                <span>💾</span>
                <span>{saveDraftToast}</span>
              </div>
            )}

            {/* Banner đồng bộ từ lịch hẹn nhận xe mới (Ảnh 2) */}
            {preFillAppointment && (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-300 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
                <span className="text-3xl">🎁</span>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-2 flex-wrap text-sm">
                    <span>Đã đồng bộ dữ liệu từ Lịch hẹn #{preFillAppointment.maLichHen || preFillAppointment.id}</span>
                    {linkedOrder && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold">
                        Đơn online #{linkedOrder.id}
                      </span>
                    )}
                  </div>
                  <div className="text-emerald-800 mt-1.5 flex flex-wrap gap-x-5 gap-y-1">
                    <span>Mẫu xe: <strong className="text-zinc-900">{selectedVehicleModel}</strong></span>
                    <span>Màu: <strong className="text-zinc-900">{specificColor}</strong></span>
                    <span>Đã đặt cọc: <strong className="text-emerald-700 font-mono">{formatVND(depositAmount)}</strong></span>
                    {isPaid100 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-black">
                        ✓ ĐÃ THANH TOÁN 100% ONLINE
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* LH33: THANH TÌM KIẾM KHÁCH HÀNG ĐẶT PHÍA TRÊN KHUNG 1 - KHÔNG CÓ GIÁ TRỊ MẶC ĐỊNH */}
            <div className="rounded-2xl border border-zinc-200 p-4 bg-zinc-50/70 space-y-2">
              <div className="font-extrabold text-xs text-zinc-900 uppercase font-mono tracking-wider flex items-center justify-between">
                <span>🔍 TÌM KIẾM & CHỌN KHÁCH HÀNG</span>
                {selectedCustId && (
                  <span className="text-zinc-500 font-normal">
                    Đang chọn: <strong className="font-mono text-zinc-900 font-bold">{selectedCustId}</strong> - {customerName || 'Chưa nhập tên'}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm khách hàng (tên, sđt, email)"
                  value={custSearch}
                  onChange={e => setCustSearch(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-300 bg-white focus:outline-none focus:border-red-600 shadow-2xs font-medium"
                />
                {custSearch.trim() && (
                  <button
                    type="button"
                    onClick={() => setCustSearch('')}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 font-bold text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
              {custSearch.trim() && (
                <div className="max-h-36 overflow-y-auto bg-white border border-zinc-200 rounded-xl mt-1 shadow-md divide-y divide-zinc-100 z-10 relative">
                  {customers
                    .filter(
                      c =>
                        matchVietnameseSearch(c.hoTen, custSearch) ||
                        matchVietnameseSearch(c.soDienThoai, custSearch) ||
                        (c.email ? matchVietnameseSearch(c.email, custSearch) : false) ||
                        matchVietnameseSearch(c.id, custSearch)
                    )
                    .map(c => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className="p-2.5 text-xs hover:bg-red-50/60 cursor-pointer flex items-center justify-between transition"
                      >
                        <div>
                          <span className="font-bold text-zinc-900">{c.hoTen}</span>
                          <span className="text-zinc-500 ml-2 font-mono">({c.soDienThoai})</span>
                          {c.email && <span className="text-zinc-400 ml-2">· {c.email}</span>}
                        </div>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-bold">{c.id}</span>
                      </div>
                    ))}
                  {customers.filter(
                    c =>
                      c.hoTen.toLowerCase().includes(custSearch.toLowerCase()) ||
                      c.soDienThoai.includes(custSearch) ||
                      (c.email && c.email.toLowerCase().includes(custSearch.toLowerCase())) ||
                      c.id.toLowerCase().includes(custSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="p-3 text-center text-xs text-zinc-400 italic">
                      Không tìm thấy khách hàng phù hợp. Bạn có thể tự do nhập thông tin khách hàng mới bên dưới.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 1. THÔNG TIN KHÁCH HÀNG (Mở rộng) ── */}
            <div className="rounded-2xl border border-zinc-200 p-4 bg-zinc-50/70 space-y-3">
              <div className="font-extrabold text-xs text-zinc-900 uppercase font-mono tracking-wider flex items-center justify-between">
                <span>1. THÔNG TIN KHÁCH HÀNG (Mở rộng)</span>
                <span className="text-zinc-400 font-normal">Mã KH: {selectedCustId}</span>
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
                    onChange={e => {
                      setCustomerName(e.target.value);
                      if (errors.customerName) setErrors(prev => ({ ...prev, customerName: '' }));
                    }}
                    placeholder="VD: Nguyễn Văn An"
                    className={`w-full p-2 rounded-xl border ${
                      errors.customerName ? 'border-red-500 bg-red-50' : 'border-zinc-300 bg-white'
                    } font-semibold`}
                  />
                  {errors.customerName && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">⚠️ {errors.customerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">CCCD (12 chữ số) *</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={idCardTax}
                    onChange={e => {
                      setIdCardTax(e.target.value);
                      if (errors.idCardTax) setErrors(prev => ({ ...prev, idCardTax: '' }));
                    }}
                    placeholder="079090123456"
                    className={`w-full p-2 rounded-xl border ${
                      errors.idCardTax ? 'border-red-500 bg-red-50' : 'border-zinc-300 bg-white'
                    } font-mono`}
                  />
                  {errors.idCardTax && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">⚠️ {errors.idCardTax}</p>
                  )}
                </div>

                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Địa chỉ đăng ký xe *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => {
                      setAddress(e.target.value);
                      if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                    }}
                    placeholder="123 Lê Văn Sỹ, P.13, Q.3, TP.HCM"
                    className={`w-full p-2 rounded-xl border ${
                      errors.address ? 'border-red-500 bg-red-50' : 'border-zinc-300 bg-white'
                    }`}
                  />
                  {errors.address && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">⚠️ {errors.address}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Điện thoại *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    placeholder="0901234567"
                    className={`w-full p-2 rounded-xl border ${
                      errors.phone ? 'border-red-500 bg-red-50' : 'border-zinc-300 bg-white'
                    } font-mono font-bold`}
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">⚠️ {errors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    placeholder="abc@gmail.com"
                    className={`w-full p-2 rounded-xl border ${
                      errors.email ? 'border-red-500 bg-red-50' : 'border-zinc-300 bg-white'
                    } font-mono`}
                  />
                  {errors.email && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">⚠️ {errors.email}</p>
                  )}
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

            {/* ── 2. THÔNG TIN XE & VIN (Chi tiết - Chuẩn Ảnh 2) ── */}
            <div className="rounded-2xl border border-zinc-200 p-4 bg-zinc-50/70 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 flex-wrap gap-2">
                <div className="font-extrabold text-xs text-zinc-900 uppercase font-mono tracking-wider flex items-center gap-2">
                  <span>🏍️ 2. THÔNG TIN XE & VIN (Chi tiết)</span>
                  {preFillAppointment && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Đồng bộ từ lịch hẹn {preFillAppointment.maLichHen || preFillAppointment.id}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowVehicleSearchModal(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>🔍</span>
                  <span>Tìm kiếm xe mẫu ({catalogVehicles.length} xe)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-zinc-600 font-semibold">Chọn xe mẫu</label>
                    <button
                      type="button"
                      onClick={() => setShowVehicleSearchModal(true)}
                      className="text-[11px] text-red-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>🔍 Tra cứu</span>
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <select
                      value={selectedVehicleModel}
                      onChange={e => {
                        const val = e.target.value;
                        setSelectedVehicleModel(val);
                        const matched = catalogVehicles.find(v => v.tenXe === val);
                        if (matched) {
                          if (matched.mauSac) {
                            setSpecificColor(matched.mauSac.split(',')[0].trim());
                          }
                          const spec = matched.dungTichXiLanh
                            ? `${matched.phanKhuc || 'Bản Tiêu Chuẩn'} (${matched.dungTichXiLanh})`
                            : (matched.loaiDongCo || matched.dongCo || matched.phanKhuc || 'Tiêu chuẩn');
                          setDriveTrain(spec);
                        }
                      }}
                      className="w-full p-2 rounded-xl border border-zinc-300 bg-white font-semibold text-xs text-zinc-900"
                    >
                      {/* Đảm bảo nếu xe được đồng bộ từ lịch hẹn/đơn hàng mà chưa có trong catalogVehicles thì vẫn luôn hiển thị */}
                      {selectedVehicleModel && !catalogVehicles.some(v => v.tenXe.toLowerCase().trim() === selectedVehicleModel.toLowerCase().trim()) && (
                        <option value={selectedVehicleModel}>
                          ★ {selectedVehicleModel} (Xe khách đã đặt)
                        </option>
                      )}
                      {catalogVehicles.map(v => (
                        <option key={v.id} value={v.tenXe}>
                          {v.hang} - {v.tenXe} ({formatVND(v.giaNiemYet)})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowVehicleSearchModal(true)}
                      className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition cursor-pointer"
                      title="Mở bảng tra cứu 50 xe có ảnh thật và lọc theo hãng"
                    >
                      🔍
                    </button>
                  </div>
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

                {/* LH28 + LH29: Khuyến mãi hỗ trợ VNĐ hoặc % */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-500 font-mono text-[11px]">Khuyến mãi</label>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          if (discountType !== 'VND') {
                            setDiscountType('VND');
                            setDiscountInput(1000000);
                            if (errors.discount) setErrors(prev => ({ ...prev, discount: '' }));
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                          discountType === 'VND' ? 'bg-red-700 text-white' : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
                        }`}
                      >
                        VNĐ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (discountType !== 'PERCENT') {
                            setDiscountType('PERCENT');
                            setDiscountInput(2);
                            if (errors.discount) setErrors(prev => ({ ...prev, discount: '' }));
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                          discountType === 'PERCENT' ? 'bg-red-700 text-white' : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={discountType === 'PERCENT' ? 100 : subtotalBeforeDiscount}
                      value={discountInput}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setDiscountInput(isNaN(val) ? 0 : val);
                        if (errors.discount) setErrors(prev => ({ ...prev, discount: '' }));
                      }}
                      className={`w-full p-2 text-xs rounded-xl border ${
                        errors.discount ? 'border-red-500 bg-red-50' : 'border-zinc-300 bg-white'
                      } font-mono text-red-600 font-bold`}
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-bold text-zinc-400">
                      {discountType === 'PERCENT' ? '%' : '₫'}
                    </span>
                  </div>
                  {discountType === 'PERCENT' && (
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      Quy đổi: -{formatVND(discountAmount)}
                    </div>
                  )}
                  {errors.discount && (
                    <p className="text-[10px] text-red-600 font-semibold mt-0.5">⚠️ {errors.discount}</p>
                  )}
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

              {/* Huy hiệu xác nhận nếu khách đã thanh toán 100% online */}
              {isPaid100 && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between flex-wrap gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">💳</span>
                    <div>
                      <div className="font-extrabold text-xs uppercase text-emerald-900 font-mono">
                        ĐÃ THANH TOÁN 100% ONLINE TRỰC TUYẾN
                      </div>
                      <div className="text-xs text-emerald-700">
                        Khách hàng đã thanh toán toàn bộ chi phí lăn bánh trực tuyến qua ngân hàng.
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs font-mono shadow-xs">
                    ✓ ĐÃ THU ĐỦ (CÒN LẠI 0₫)
                  </span>
                </div>
              )}

              {/* KHỐI THU NỐT TIỀN TỰ ĐỘNG (D. BÁN XE) */}
              {rawRemainingAmount > 0 && !preFillAppointment?.daThanhToan100 ? (
                <div className={`p-4 rounded-2xl border transition-all ${
                  thuNotTienConThieu 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                    : errors.thuNotTien ? 'bg-red-50 border-red-400 text-red-950' : 'bg-amber-50/80 border-amber-300 text-amber-950'
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

                    <label className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border ${
                      errors.thuNotTien ? 'border-red-500 ring-2 ring-red-200' : 'border-zinc-300'
                    } shadow-xs cursor-pointer hover:border-red-600 transition select-none`}>
                      <input
                        type="checkbox"
                        checked={thuNotTienConThieu}
                        onChange={e => {
                          setThuNotTienConThieu(e.target.checked);
                          if (errors.thuNotTien) setErrors(prev => ({ ...prev, thuNotTien: '' }));
                        }}
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
                  ) : errors.thuNotTien ? (
                    <div className="mt-2 text-xs font-bold text-red-700 flex items-center gap-1.5 pt-2 border-t border-red-200">
                      <span>🛑</span> {errors.thuNotTien}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs font-medium text-amber-800 flex items-center gap-1.5 pt-2 border-t border-amber-200">
                      <span>⚠️</span> Bắt buộc phải xác nhận đã thu nốt tiền trước khi tạo hóa đơn bán xe.
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <span>✅</span> Khách hàng đã thanh toán 100% tiền mua xe (Số tiền còn lại: 0₫).
                </div>
              )}

              {/* LH28: Đặt cọc (Khóa sửa nếu đã thanh toán cọc từ trước) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">
                    Số tiền đặt cọc {hasPrePaidDeposit && <span className="text-[10px] text-amber-700">(Đã khóa)</span>}
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    disabled={hasPrePaidDeposit}
                    onChange={e => setDepositAmount(parseInt(e.target.value) || 0)}
                    className={`w-full p-2 rounded-xl border border-zinc-300 font-mono font-bold ${
                      hasPrePaidDeposit ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : 'bg-white text-emerald-700'
                    }`}
                  />
                  {hasPrePaidDeposit && (
                    <p className="text-[10px] text-zinc-500 mt-0.5">🔒 Đã cố định theo lịch hẹn, không thể chỉnh sửa</p>
                  )}
                </div>
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">
                    Ngày đặt cọc {hasPrePaidDeposit && <span className="text-[10px] text-amber-700">(Đã khóa)</span>}
                  </label>
                  <input
                    type="date"
                    value={depositDate}
                    disabled={hasPrePaidDeposit}
                    onChange={e => setDepositDate(e.target.value)}
                    className={`w-full p-2 rounded-xl border border-zinc-300 font-mono ${
                      hasPrePaidDeposit ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : 'bg-white'
                    }`}
                  />
                  {hasPrePaidDeposit && (
                    <p className="text-[10px] text-zinc-500 mt-0.5">🔒 Đã ghi nhận theo ngày thực tế</p>
                  )}
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
                    onChange={e => {
                      const val = e.target.value as any;
                      setDeliveryMethod(val);
                      if (val === 'HomeDelivery' && (deliveryPlace.includes('Showroom') || !deliveryPlace.trim())) {
                        setDeliveryPlace(address || 'Địa chỉ giao tận nơi của khách hàng');
                      } else if (val === 'Showroom' && !deliveryPlace.includes('Showroom')) {
                        setDeliveryPlace('Showroom Chính Motoshop: 123 Lê Văn Sỹ, P.13, Q.3, TP.HCM');
                      }
                    }}
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

            {/* LH32: Footer của Form nhập liệu - Đổi nút thành "Xem trước hóa đơn" */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-200 hover:bg-zinc-300 text-zinc-800 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>💾</span>
                <span>Lưu nháp</span>
              </button>
              <button
                type="button"
                onClick={handleGoToPreview}
                className="px-7 py-2.5 rounded-xl text-xs font-extrabold bg-blue-700 hover:bg-blue-800 text-white transition shadow-lg shadow-blue-700/20 uppercase tracking-wider cursor-pointer flex items-center gap-2"
              >
                <span>👁️</span>
                <span>XEM TRƯỚC HÓA ĐƠN</span>
              </button>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════════════ */}
        {/* BƯỚC 2: MÀN HÌNH XEM TRƯỚC HÓA ĐƠN & XÁC NHẬN (LH32)                       */}
        {/* ════════════════════════════════════════════════════════════════════════════ */}
        {modalStep === 'PREVIEW_INVOICE' && (
          <div className="space-y-6">
            {/* Banner cảnh báo bản xem trước */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 font-medium">
                <span className="text-lg">⚠️</span>
                <span>
                  <strong>BẢN XEM TRƯỚC HÓA ĐƠN:</strong> Vui lòng kiểm tra kỹ các thông tin chi tiết trước khi xác nhận. Nhấn <strong>"Quay về"</strong> nếu cần chỉnh sửa thông tin.
                </span>
              </div>
            </div>

            {/* Khung Hóa Đơn Xem Trước Giả Lập Giấy In (Preview Invoice Paper) */}
            <div className="p-6 sm:p-8 bg-white border border-zinc-300 rounded-3xl text-zinc-900 space-y-6 font-sans shadow-sm">
              {/* Header Đại lý */}
              <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-red-700 font-display">
                    HỆ THỐNG SHOWROOM MOTOSHOP CRM
                  </h1>
                  <p className="text-xs text-zinc-500 mt-0.5">Đại lý Phân phối Xe máy & Dịch vụ Chính Hãng</p>
                  <p className="text-xs text-zinc-600 mt-1">Địa chỉ: 123 Lê Văn Sỹ, P.13, Q.3, TP. Hồ Chí Minh</p>
                  <p className="text-xs text-zinc-600">Hotline: 1900 6868 · Website: dailyxemay.vn</p>
                </div>
                <div className="text-right">
                  <h2 className="text-base font-bold font-mono uppercase text-zinc-900">
                    HÓA ĐƠN BÁN XE KIÊM BIÊN BẢN BÀN GIAO
                  </h2>
                  <div className="inline-block px-2.5 py-0.5 mt-1 rounded bg-amber-100 text-amber-800 text-[11px] font-bold font-mono">
                    [ BẢN XEM TRƯỚC - CHƯA LƯU ]
                  </div>
                  <div className="text-xs font-mono text-zinc-500 mt-1">
                    Ngày lập: {new Date().toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Thông tin Khách hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                <div className="space-y-1">
                  <div className="font-bold text-zinc-500 uppercase text-[10px] tracking-wider">THÔNG TIN KHÁCH HÀNG:</div>
                  <div className="font-bold text-sm text-zinc-900">{customerName}</div>
                  <div className="text-zinc-600">Loại khách: <strong>{customerType === 'Individual' ? 'Cá nhân' : 'Doanh nghiệp'}</strong> (Mã: {selectedCustId})</div>
                  <div className="text-zinc-600 font-mono">CCCD/MST: <strong>{idCardTax}</strong></div>
                  <div className="text-zinc-600 font-mono">Điện thoại: <strong>{phone}</strong></div>
                  <div className="text-zinc-600 font-mono">Email: <strong>{email}</strong></div>
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-zinc-500 uppercase text-[10px] tracking-wider">ĐỊA CHỈ & GHI CHÚ:</div>
                  <div className="text-zinc-700">Địa chỉ đăng ký: <strong>{address}</strong></div>
                  <div className="text-zinc-700">Hình thức nhận xe: <strong className="text-zinc-900">{deliveryMethod === 'Showroom' ? '🏢 Nhận tại Showroom' : '🚚 Giao xe tận nơi (Giao tận nhà)'}</strong></div>
                  <div className="text-zinc-700">Địa điểm bàn giao: <strong>{deliveryPlace}</strong></div>
                  <div className="text-zinc-700">Ngày hẹn bàn giao: <strong>{deliveryDate}</strong></div>
                  {customerNotes && <div className="text-zinc-500 italic mt-1">Ghi chú: "{customerNotes}"</div>}
                </div>
              </div>

              {/* Thông tin Xe & Kỹ thuật */}
              <div className="space-y-2">
                <div className="font-bold text-xs uppercase font-mono text-zinc-700 tracking-wider">
                  CHI TIẾT PHƯƠNG TIỆN BÁN RA:
                </div>
                <table className="w-full text-xs border border-zinc-200 rounded-xl overflow-hidden">
                  <thead className="bg-zinc-100 text-zinc-700 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="p-2.5 text-left border-b border-zinc-200">Mẫu xe & Phiên bản</th>
                      <th className="p-2.5 text-left border-b border-zinc-200">Màu sắc</th>
                      <th className="p-2.5 text-left border-b border-zinc-200">Số khung (VIN)</th>
                      <th className="p-2.5 text-left border-b border-zinc-200">Số máy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    <tr>
                      <td className="p-2.5">
                        <div className="font-bold text-zinc-900">{selectedVehicleModel}</div>
                        <div className="text-[11px] text-zinc-500">{driveTrain}</div>
                      </td>
                      <td className="p-2.5 font-medium">{specificColor}</td>
                      <td className="p-2.5 font-mono font-bold text-zinc-800 uppercase">{vinNumber}</td>
                      <td className="p-2.5 font-mono uppercase">{engineNumber}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bảng Chiết tính Tài chính & Lăn bánh */}
              <div className="space-y-2">
                <div className="font-bold text-xs uppercase font-mono text-zinc-700 tracking-wider">
                  CHIẾT TÍNH GIÁ TRỊ & THANH TOÁN (LĂN BÁNH):
                </div>
                <table className="w-full text-xs border border-zinc-200 rounded-xl overflow-hidden">
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    <tr>
                      <td className="p-2.5 text-zinc-600">1. Giá niêm yết xe (đã bao gồm VAT)</td>
                      <td className="p-2.5 text-right font-mono font-bold text-zinc-900">{formatVND(basePrice)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-zinc-600">2. Lệ phí trước bạ ({taxPercent}%)</td>
                      <td className="p-2.5 text-right font-mono text-zinc-900">{formatVND((basePrice * taxPercent) / 100)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-zinc-600">
                        3. Lệ phí cấp biển số ({plateLocation === 'HCM' ? 'TP. Hồ Chí Minh' : plateLocation === 'HN' ? 'Hà Nội' : 'Tỉnh thành khác'})
                      </td>
                      <td className="p-2.5 text-right font-mono text-zinc-900">{formatVND(plateFee)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-zinc-600">
                        4. Bảo hiểm xe ({insurancePkg === 'TNDS_VAT_CHAT' ? 'TNDS 1 năm + Vật chất' : insurancePkg === 'TNDS' ? 'TNDS Bắt buộc 1 năm' : 'Không tham gia'})
                      </td>
                      <td className="p-2.5 text-right font-mono text-zinc-900">{formatVND(insuranceFee)}</td>
                    </tr>
                    {discountAmount > 0 && (
                      <tr className="bg-emerald-50/50">
                        <td className="p-2.5 text-emerald-800 font-semibold">
                          5. Khuyến mãi / Giảm trừ ({discountType === 'PERCENT' ? `${discountInput}%` : 'Số tiền cố định'})
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">-{formatVND(discountAmount)}</td>
                      </tr>
                    )}
                    <tr className="bg-red-50/70 border-t-2 border-red-200">
                      <td className="p-3 text-sm font-extrabold text-red-900 uppercase">TỔNG GIÁ TRỊ LĂN BÁNH:</td>
                      <td className="p-3 text-right text-base font-extrabold font-mono text-red-700">{formatVND(totalAmount)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-zinc-600">
                        Số tiền đã đặt cọc ({depositDate})
                        {hasPrePaidDeposit && <span className="ml-2 text-[10px] text-amber-700 font-bold">(Đã thanh toán trước)</span>}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">{formatVND(depositAmount)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-zinc-600">Số tiền còn thiếu phải thu tại quầy:</td>
                      <td className="p-2.5 text-right font-mono font-bold text-red-700">{formatVND(rawRemainingAmount)}</td>
                    </tr>
                    <tr className="bg-zinc-50">
                      <td className="p-2.5 text-zinc-800 font-bold">Trạng thái thanh toán chốt đơn:</td>
                      <td className="p-2.5 text-right font-bold text-xs">
                        {thuNotTienConThieu || preFillAppointment?.daThanhToan100 ? (
                          <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">✓ ĐÃ THANH TOÁN 100% (ĐỦ TIỀN)</span>
                        ) : (
                          <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded">⚠️ ĐÃ ĐẶT CỌC (CÒN THIẾU {formatVND(rawRemainingAmount)})</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Ký tên nhân viên & khách hàng */}
              <div className="grid grid-cols-2 pt-6 text-center text-xs">
                <div>
                  <div className="font-bold text-zinc-700 uppercase">KHÁCH HÀNG MUA XE</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16 flex items-end justify-center font-bold text-zinc-800">{customerName}</div>
                </div>
                <div>
                  <div className="font-bold text-zinc-700 uppercase">ĐẠI DIỆN SHOWROOM</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">(Nhân viên tư vấn lập đơn)</div>
                  <div className="h-16 flex items-end justify-center font-bold text-zinc-800">
                    {currentStaff?.hoTen || 'Nhân viên tư vấn'} ({currentStaff?.id || 'ST001'})
                  </div>
                </div>
              </div>
            </div>

            {/* LH32: Footer Màn hình Xem trước hóa đơn: "Quay về", "Hủy bỏ", "Xác nhận tạo hóa đơn" */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setModalStep('EDIT_FORM')}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>←</span>
                <span>Quay về (Chỉnh sửa)</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-200 hover:bg-zinc-300 text-zinc-700 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-7 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-lg shadow-emerald-600/20 uppercase tracking-wider disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <span>✓</span>
                  <span>
                    {submitting
                      ? 'ĐANG XỬ LÝ...'
                      : deliveryMethod === 'HomeDelivery'
                      ? '📦 XUẤT HÓA ĐƠN ĐỂ DÁN LÊN ĐƠN HÀNG'
                      : preFillAppointment
                      ? '📅 GỬI LỊCH HẸN NHẬN XE'
                      : 'XÁC NHẬN TẠO HÓA ĐƠN'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ MODAL TRA CỨU XE MẪU SHOWROOM (50 MẪU XE CÓ ẢNH THẬT & BỘ LỌC HÃNG) ══════════ */}
        {showVehicleSearchModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-zinc-200 max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header Modal Tra Cứu */}
              <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <span>🏍️</span>
                    <span>TRA CỨU & CHỌN XE MẪU SHOWROOM</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold">
                      {catalogVehicles.length} Mẫu xe
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Chọn mẫu xe từ danh mục để tự động đồng bộ giá niêm yết, thông số kỹ thuật, động cơ và màu sắc
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVehicleSearchModal(false)}
                  className="text-zinc-400 hover:text-white text-2xl font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Thanh Tìm Kiếm & Bộ Lọc Nhanh */}
              <div className="p-4 bg-zinc-50 border-b border-zinc-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">🔍</span>
                    <input
                      type="text"
                      value={vehicleSearchQuery}
                      onChange={e => setVehicleSearchQuery(e.target.value)}
                      placeholder="Tìm theo tên xe (VD: SH 160, PG-1, Air Blade, Vespa Sprint, Exciter...)"
                      className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-zinc-300 text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                      autoFocus
                    />
                    {vehicleSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setVehicleSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div>
                    <select
                      value={vehicleBrandFilter}
                      onChange={e => setVehicleBrandFilter(e.target.value)}
                      className="w-full p-2 bg-white rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700"
                    >
                      <option value="Tất cả">Tất cả hãng xe</option>
                      <option value="Honda">Honda</option>
                      <option value="Yamaha">Yamaha</option>
                      <option value="Suzuki">Suzuki</option>
                      <option value="Vespa">Vespa</option>
                      <option value="Piaggio">Piaggio</option>
                      <option value="SYM">SYM</option>
                    </select>
                  </div>
                </div>

                {/* Quick Brand Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-zinc-500 font-medium text-[11px]">Hãng phổ biến:</span>
                  {['Tất cả', 'Honda', 'Yamaha', 'Suzuki', 'Vespa', 'Piaggio', 'SYM'].map(brand => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setVehicleBrandFilter(brand)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        vehicleBrandFilter === brand
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-white text-zinc-600 hover:bg-zinc-200 border border-zinc-200'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danh sách xe / Grid kết quả */}
              <div className="p-4 overflow-y-auto max-h-[58vh] flex-1">
                {filteredVehicles.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400">
                    <div className="text-4xl mb-2">🔍</div>
                    <div className="text-sm font-semibold">Không tìm thấy mẫu xe nào phù hợp</div>
                    <div className="text-xs text-zinc-400 mt-1">Thử đổi từ khóa tìm kiếm hoặc chọn hãng xe khác</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredVehicles.map(v => {
                      const isCurrent = selectedVehicleModel.toLowerCase().trim() === v.tenXe.toLowerCase().trim();
                      return (
                        <div
                          key={v.id}
                          className={`p-3 rounded-2xl border transition-all flex gap-3.5 items-center hover:border-red-400 hover:shadow-md bg-white ${
                            isCurrent
                              ? 'border-red-600 ring-2 ring-red-500/30 bg-red-50/20'
                              : 'border-zinc-200'
                          }`}
                        >
                          <div className="w-24 h-20 bg-zinc-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1 border border-zinc-100">
                            {v.hinhAnh ? (
                              <img
                                src={v.hinhAnh}
                                alt={v.tenXe}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="text-2xl">🏍️</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700">
                                {v.hang}
                              </span>
                              {v.phanKhuc && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                                  {v.phanKhuc}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-zinc-900 truncate mt-1" title={v.tenXe}>
                              {v.tenXe}
                            </h4>
                            <div className="text-xs text-zinc-500 truncate">
                              {v.dungTichXiLanh || v.dongCo || v.loaiDongCo || 'Tiêu chuẩn'} · Màu: {v.mauSac || 'Tiêu chuẩn'}
                            </div>
                            <div className="font-mono font-extrabold text-red-600 text-sm mt-0.5">
                              {formatVND(v.giaNiemYet)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVehicleModel(v.tenXe);
                              if (v.mauSac) {
                                setSpecificColor(v.mauSac.split(',')[0].trim());
                              }
                              const spec = v.dungTichXiLanh
                                ? `${v.phanKhuc || 'Bản Tiêu Chuẩn'} (${v.dungTichXiLanh})`
                                : (v.loaiDongCo || v.dongCo || v.phanKhuc || 'Tiêu chuẩn');
                              setDriveTrain(spec);
                              setShowVehicleSearchModal(false);
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                            }`}
                          >
                            {isCurrent ? '✓ Đang chọn' : 'Chọn xe này'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Modal Tra Cứu */}
              <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center text-xs text-zinc-500 font-mono">
                <div>
                  Đang hiển thị <strong>{filteredVehicles.length}</strong> / {catalogVehicles.length} mẫu xe
                </div>
                <button
                  type="button"
                  onClick={() => setShowVehicleSearchModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
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
  onUpdatePaymentStatus,
}: {
  order: Order;
  onClose: () => void;
  onPrint: () => void;
  onUpdateStatus?: (status: OrderStatus) => void;
  onUpdatePaymentStatus?: (paymentStatus: PaymentStatus) => void;
}) {
  const isVehicle = order.loaiDon === 'Xe';

  // Helper lấy ảnh thumbnail phụ tùng
  const getPartThumbnail = (item: { tenSanPham: string; maPhuTung?: number; hinhAnh?: string }) => {
    if (item.hinhAnh) return item.hinhAnh;
    if (item.maPhuTung) {
      const num = item.maPhuTung;
      const pIdStr = num < 10 ? `PT00${num}` : `PT0${num}`;
      const p = mockParts.find(x => x.id === pIdStr);
      if (p?.hinhAnh) return p.hinhAnh;
    }
    const match = mockParts.find(x => 
      x.tenSanPham.toLowerCase().includes(item.tenSanPham.toLowerCase()) || 
      item.tenSanPham.toLowerCase().includes(x.tenSanPham.toLowerCase())
    );
    if (match?.hinhAnh) return match.hinhAnh;
    return '/images/phutung/motul_7100.png';
  };

  // NẾU LÀ ĐƠN PHỤ TÙNG: HIỂN THỊ GIAO DIỆN DARK THEME THEO ĐÚNG CHUẨN ẢNH 2
  if (!isVehicle) {
    const statusCfg = order.trangThai === 'HoanThanh' || order.trangThai === 'DaGiao'
      ? { label: 'Đã giao hàng', bg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' }
      : order.trangThai === 'DangGiao'
      ? { label: 'Đang giao hàng', bg: 'bg-blue-600/30 text-blue-400 border border-blue-500/40' }
      : order.trangThai === 'DaXacNhan'
      ? { label: 'Đã xác nhận', bg: 'bg-sky-500/20 text-sky-400 border border-sky-500/40' }
      : order.trangThai === 'DaHuy'
      ? { label: 'Đã hủy', bg: 'bg-red-500/20 text-red-400 border border-red-500/40' }
      : { label: 'Chờ duyệt', bg: 'bg-amber-500/20 text-amber-400 border border-amber-500/40' };

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#121316] text-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-red-500/30 space-y-4 max-h-[92vh] overflow-y-auto">
          
          {/* Header (Theo Ảnh 2) */}
          <div className="flex items-start justify-between border-b border-zinc-800 pb-3.5">
            <div>
              <h3 className="font-extrabold text-base uppercase text-white font-display tracking-wide">
                CHI TIẾT ĐƠN HÀNG #{order.id}
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-1 flex-wrap">
                <span>Ngày đặt: {order.ngayDat}</span>
                <span>•</span>
                <span>10:30 AM</span>
                <span>•</span>
                <span>Trạng thái:</span>
                <span className={`px-2.5 py-0.5 rounded font-semibold text-xs ${statusCfg.bg}`}>
                  {statusCfg.label}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer font-bold text-lg"
            >
              ✕
            </button>
          </div>

          {/* 2-Column Info Grid (Theo Ảnh 2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Cột trái: THÔNG TIN KHÁCH HÀNG & GIAO NHẬN */}
            <div className="p-4 rounded-2xl bg-[#1c1d22] border border-zinc-800 text-xs space-y-2 text-zinc-300">
              <div className="font-bold text-xs uppercase text-zinc-200 tracking-wide font-mono mb-2">
                THÔNG TIN KHÁCH HÀNG & GIAO NHẬN
              </div>
              <div className="flex items-center gap-2 text-zinc-200">
                <span className="text-zinc-400">👤</span>
                <span>Người nhận: <strong className="text-white font-bold">{order.hoTenKH}</strong></span>
              </div>
              <div>
                SĐT: <strong className="font-mono text-zinc-100">{order.soDienThoai || '0879179243'}</strong>
              </div>
              <div>
                Địa chỉ: <span className="text-zinc-200">{order.diaChiGiao}</span>
              </div>
              <div>
                Phương thức thanh toán: <span className="text-zinc-200">{order.phuongThucThanhToan === 'ChuyenKhoan' ? 'Chuyển khoản Online' : 'Tiền mặt khi nhận hàng (COD)'} ({order.trangThaiThanhToan === 'DaThanhToan' ? 'đã xác nhận' : 'chưa xác nhận'})</span>
              </div>
              <div>
                Ghi chú: <span className="text-zinc-300 italic">{order.ghiChu || 'Giao giờ hành chính, gọi trước khi giao.'}</span>
              </div>
            </div>

            {/* Cột phải: CHI TIẾT THANH TOÁN */}
            {(() => {
              const itemSubtotal = (order.items && order.items.length > 0)
                ? order.items.reduce((s, it) => s + ((it.donGia || 0) * (it.soLuong || 1)), 0)
                : Math.max(0, order.tongTien - 30000);
              const shippingFee = (order.tongTien > itemSubtotal)
                ? (order.tongTien - itemSubtotal)
                : (order.kenhBan === 'TaiQuay' ? 0 : 30000);
              const displayTotal = order.tongTien > 0 ? order.tongTien : (itemSubtotal + shippingFee);

              return (
                <div className="p-4 rounded-2xl bg-[#1c1d22] border border-zinc-800 text-xs flex flex-col justify-between space-y-2">
                  <div className="font-bold text-xs uppercase text-zinc-200 tracking-wide font-mono mb-1">
                    CHI TIẾT THANH TOÁN
                  </div>
                  <div className="space-y-1.5 text-zinc-300">
                    <div className="flex justify-between">
                      <span>Tạm tính:</span>
                      <span className="font-mono text-white font-bold">{formatVND(itemSubtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí vận chuyển:</span>
                      <span className="font-mono text-zinc-200 font-bold">
                        {shippingFee > 0 ? formatVND(shippingFee) : '0 đ (Miễn phí)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Giảm giá (Voucher):</span>
                      <span className="font-mono text-zinc-400">0 đ</span>
                    </div>
                  </div>
                  <div className="border-t border-zinc-800/90 pt-2.5 flex justify-between items-center">
                    <span className="font-extrabold uppercase text-xs text-zinc-200">TỔNG TIỀN</span>
                    <strong className="text-lg font-black text-red-500 font-mono">
                      {formatVND(displayTotal)}
                    </strong>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Bảng DANH SÁCH PHỤ TÙNG (Theo Ảnh 2) */}
          <div className="rounded-2xl bg-[#1c1d22] border border-zinc-800 overflow-hidden text-xs">
            <div className="px-4 pt-3 pb-2 font-bold text-xs uppercase text-zinc-300 font-mono tracking-wide">
              DANH SÁCH PHỤ TÙNG
            </div>
            <div className="grid grid-cols-12 px-4 py-2 bg-zinc-900/80 border-b border-t border-zinc-800 text-[11px] font-mono text-zinc-400 font-bold">
              <div className="col-span-6">Sản phẩm</div>
              <div className="col-span-2 text-center">Số lượng</div>
              <div className="col-span-2 text-right">Đơn giá</div>
              <div className="col-span-2 text-right">Thành tiền</div>
            </div>
            <div className="divide-y divide-zinc-800/60 max-h-56 overflow-y-auto">
              {order.items?.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-zinc-900/40 transition">
                  <div className="col-span-6 flex items-center gap-3">
                    <img
                      src={getPartThumbnail(item)}
                      alt={item.tenSanPham}
                      className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 object-contain p-1 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/phutung/motul_7100.png';
                      }}
                    />
                    <div className="font-bold text-zinc-100 text-xs leading-snug">
                      {item.tenSanPham}
                    </div>
                  </div>
                  <div className="col-span-2 text-center font-mono text-zinc-200">
                    {item.soLuong}
                  </div>
                  <div className="col-span-2 text-right font-mono text-zinc-300">
                    {formatVND(item.donGia)}
                  </div>
                  <div className="col-span-2 text-right font-mono font-bold text-white">
                    {formatVND(item.donGia * item.soLuong)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions Footer (Theo Ảnh 2: Đóng, In hóa đơn màu đỏ, Cập nhật trạng thái màu xanh) */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs cursor-pointer transition"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer transition flex items-center gap-1.5"
            >
              <span>🧾</span> In hóa đơn
            </button>

            {/* Nút xác nhận thu tiền COD */}
            {order.trangThaiThanhToan !== 'DaThanhToan' && onUpdatePaymentStatus && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Xác nhận đã nhận đủ tiền thanh toán cho đơn hàng #${order.id}?`)) {
                    onUpdatePaymentStatus('DaThanhToan');
                  }
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <span>💵</span> Xác nhận đã thu tiền
              </button>
            )}

            {/* Cập nhật trạng thái theo quy trình 3 bước Xác nhận -> Giao hàng -> Đã giao */}
            {order.trangThai === 'ChoDuyet' && (
              <button
                type="button"
                onClick={() => onUpdateStatus?.('DaXacNhan')}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <span>✓</span> Cập nhật trạng thái (Xác nhận đơn)
              </button>
            )}

            {order.trangThai === 'DaXacNhan' && (
              <button
                type="button"
                onClick={() => onUpdateStatus?.('DangGiao')}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <span>🚚</span> Cập nhật trạng thái (Giao hàng)
              </button>
            )}

            {order.trangThai === 'DangGiao' && (
              <button
                type="button"
                onClick={() => onUpdateStatus?.('HoanThanh')}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <span>✅</span> Cập nhật trạng thái (Hoàn tất đơn)
              </button>
            )}

            {(order.trangThai === 'HoanThanh' || order.trangThai === 'DaGiao') && (
              <span className="px-4 py-2 rounded-xl text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 flex items-center gap-1.5">
                🔒 Đã giao thành công (Khóa hoàn tất)
              </span>
            )}

            {order.trangThai === 'DaHuy' && (
              <span className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 flex items-center gap-1.5">
                🔒 Trạng thái cố định (Đã hủy)
              </span>
            )}
          </div>

        </div>
      </div>
    );
  }

  // TRƯỜNG HỢP ĐƠN XE: GIỮ NGUYÊN GIAO DIỆN BÁN XE ĐẦY ĐỦ THỦ TỤC
  const isHomeDelivery = Boolean(order.thongTinXe?.hinhThucGiao === 'HomeDelivery' || order.ghiChu?.includes('GIAO TẬN NƠI') || order.ghiChu?.includes('GIAO XE TẬN NƠI'));

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
                🏍️ ĐƠN BÁN XE
              </span>
              <StatusBadge status={order.trangThai} configs={orderStatuses} />
            </div>
            <div className="text-xs text-zinc-500 font-mono mt-0.5">Ngày đặt: {order.ngayDat}</div>
          </div>
          <button onClick={onClose} className="text-zinc-400 font-bold text-lg hover:text-zinc-600 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Thông tin khách hàng & kênh bán */}
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5 text-xs">
          <div className="font-bold text-sm text-zinc-900">{order.hoTenKH}</div>
          <div>SĐT: <strong className="font-mono text-zinc-800">{order.soDienThoai || 'Chưa cập nhật'}</strong> · Email: <span className="font-mono">{order.email || 'khach@gmail.com'}</span></div>
          <div>Địa chỉ nhận hàng: <span className="text-zinc-800 font-medium">{order.diaChiGiao}</span></div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/60 font-mono text-[11px] text-zinc-600">
            <div>Kênh bán: <strong>{order.kenhBan === 'TaiQuay' ? '🏪 Tại quầy Showroom' : '🌐 Đặt online qua Web'}</strong></div>
            <div>Hình thức thanh toán: <strong>{order.phuongThucThanhToan === 'ChuyenKhoan' ? '🏦 Chuyển khoản' : '💵 Tiền mặt / COD'}</strong></div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>Trạng thái TT:</span>
              <strong className={order.trangThaiThanhToan === 'DaThanhToan' ? 'text-emerald-700' : 'text-amber-700'}>
                {order.trangThaiThanhToan === 'DaThanhToan' ? 'Đã thanh toán' : order.trangThaiThanhToan === 'DaCoc' ? 'Đã đặt cọc' : 'Chưa thanh toán'}
              </strong>
            </div>
            <div>Nhân viên lập đơn: <strong>{order.tenNV || order.maNV || 'Admin'}</strong></div>
          </div>
        </div>

        {/* Chi tiết nội dung xe */}
        {order.thongTinXe && (
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
        )}

        {/* Tổng tiền & Hành động */}
        <div className="p-4 rounded-2xl bg-zinc-950 text-white flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase">TỔNG GIÁ TRỊ ĐƠN HÀNG</div>
            <div className="text-xl font-extrabold font-mono text-red-500">{formatVND(order.tongTien)}</div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {order.trangThai === 'ChoDuyet' && (
              <>
                <button
                  type="button"
                  onClick={() => onUpdateStatus?.('ChoKhachXacNhanNgayNhan')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>✓</span> Duyệt đơn xe (Chờ KH xác nhận)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStatus?.('ChoGiaoXe')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>🏎️</span> Duyệt & Chuyển Chờ giao xe
                </button>
              </>
            )}

            {order.trangThai === 'ChoKhachXacNhanNgayNhan' && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-500/40">
                  ⏳ Chờ khách hàng xác nhận ngày đặt xe
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateStatus?.(isHomeDelivery ? 'DangGiao' : 'ChoGiaoXe')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>✓</span> {isHomeDelivery ? 'Bắt đầu giao xe' : 'Chuyển Chờ giao xe (Xác nhận thay KH)'}
                </button>
              </div>
            )}

            {order.trangThai === 'DangGiao' && (
              <button
                type="button"
                onClick={() => onUpdateStatus?.('DaGiao')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>📦</span> Đã giao tới nhà
              </button>
            )}

            {order.trangThai === 'DaGiao' && (
              <button
                type="button"
                onClick={() => onUpdateStatus?.('HoanThanh')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>✅</span> Hoàn tất đơn hàng (Gửi khảo sát)
              </button>
            )}

            <button
              type="button"
              onClick={onPrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>🧾</span> In hóa đơn (Giao xe)
            </button>

            {order.trangThai === 'ChoGiaoXe' && (
              <button
                type="button"
                onClick={() => onUpdateStatus?.('HoanThanh')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>✅</span> Bàn giao xe thành công (Chốt & gửi khảo sát)
              </button>
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
function PrintInvoiceModal({
  order,
  onClose,
  onCompleteOrder,
}: {
  order: Order;
  onClose: () => void;
  onCompleteOrder?: (orderId: string) => void;
}) {
  const isVehicle = order.loaiDon === 'Xe';
  const printRef = useRef<HTMLDivElement>(null);
  const remainingAmount = order.thongTinXe?.soTienConLai || 0;
  const hasRemainingBalance = isVehicle && remainingAmount > 0 && order.trangThaiThanhToan !== 'DaThanhToan';
  const [daThuDuTien, setDaThuDuTien] = useState(!hasRemainingBalance);
  const [hasPrinted, setHasPrinted] = useState(false);
  const [printError, setPrintError] = useState('');

  const handlePrint = () => {
    if (hasRemainingBalance && !daThuDuTien) {
      setPrintError('⚠️ Bắt buộc phải tích xác nhận "Đã thu nốt số tiền còn thiếu" trước khi in hóa đơn bàn giao!');
      return;
    }
    setPrintError('');
    window.print();
    setHasPrinted(true);
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
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              disabled={hasRemainingBalance && !daThuDuTien}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition ${
                hasRemainingBalance && !daThuDuTien
                  ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                  : 'bg-red-700 hover:bg-red-800 text-white cursor-pointer'
              }`}
            >
              <span>🖨️</span> In ngay (Print)
            </button>
            {isVehicle && hasPrinted && (
              <button
                type="button"
                onClick={() => {
                  if (hasRemainingBalance && !daThuDuTien) {
                    setPrintError('⚠️ Bắt buộc phải tích xác nhận "Đã thu nốt số tiền còn thiếu"!');
                    return;
                  }
                  onCompleteOrder?.(order.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <span>✅</span> Xác nhận hoàn tất đơn hàng
              </button>
            )}
            <button onClick={onClose} className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700 cursor-pointer">
              Đóng
            </button>
          </div>
        </div>

        {/* Cảnh báo và bắt buộc tích Đã thu nốt số tiền còn thiếu (Kịch bản 2A) */}
        {hasRemainingBalance && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-extrabold flex items-center gap-1.5 text-amber-900 text-sm">
                <span>💰</span> <span>SỐ TIỀN CÒN THIẾU CẦN THU NỐT:</span>{' '}
                <strong className="text-red-700 font-mono text-base">{formatVND(remainingAmount)}</strong>
              </div>
              <div className="text-[11px] text-amber-800 mt-0.5">
                Khách đã cọc {formatVND(order.thongTinXe?.soTienDatCoc || 2000000)}. Nhân viên phải thu nốt số tiền còn thiếu và tích xác nhận bên cạnh mới được phép in hóa đơn bàn giao xe!
              </div>
            </div>
            <label className="flex items-center gap-2 font-black cursor-pointer bg-white px-3.5 py-2.5 rounded-xl border-2 border-amber-400 shrink-0 text-emerald-800 shadow-sm hover:bg-emerald-50 transition">
              <input
                type="checkbox"
                checked={daThuDuTien}
                onChange={e => {
                  setDaThuDuTien(e.target.checked);
                  if (e.target.checked) setPrintError('');
                }}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
              <span>✓ ĐÃ THU NỐT TIỀN CÒN THIẾU</span>
            </label>
          </div>
        )}
        {printError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 font-bold text-xs flex items-center gap-1.5 animate-bounce">
            <span>⚠️</span> <span>{printError}</span>
          </div>
        )}

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
