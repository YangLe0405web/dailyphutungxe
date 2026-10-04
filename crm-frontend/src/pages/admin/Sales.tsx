import { useState, useEffect } from 'react';
import { mockOrders, mockAppointments, formatVND, type OrderStatus, type AppointmentStatus, type Order, type Appointment } from '../../data/mockData';
import { orderApi, appointmentApi } from '../../services/api';

const orderStatuses: { key: OrderStatus; label: string; color: string; bg: string }[] = [
  { key: 'ChoDuyet', label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
  { key: 'DangGiao', label: 'Đang giao', color: '#2563eb', bg: '#dbeafe' },
  { key: 'HoanThanh', label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7' },
  { key: 'DaHuy', label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
];

const apptStatuses: { key: AppointmentStatus; label: string }[] = [
  { key: 'ChoDuyet', label: 'Chờ duyệt' },
  { key: 'DaXacNhan', label: 'Đã xác nhận' },
  { key: 'DangThucHien', label: 'Đang thực hiện' },
  { key: 'HoanThanh', label: 'Hoàn thành' },
  { key: 'DaHuy', label: 'Đã hủy' },
];

function StatusBadge({ status, configs }: { status: string; configs: { key: string; label: string; color: string; bg: string }[] }) {
  const cfg = configs.find(c => c.key === status) ?? { label: status, color: '#71717a', bg: '#f4f4f5' };
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full text-xs font-600 px-2.5 py-1"
      style={{ background: cfg.bg, color: cfg.color, fontFamily: 'var(--font-mono)' }}>
      <span className="rounded-full" style={{ width: 5, height: 5, background: cfg.color, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
}

const thSt: React.CSSProperties = { padding: '10px 16px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'var(--color-zinc-500)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' };
const tdSt: React.CSSProperties = { padding: '14px 16px', fontSize: 13, color: 'var(--color-zinc-800)', borderTop: '1px solid var(--color-zinc-100)' };

export interface SalesPageProps {
  activeTab?: 'orders' | 'appointments';
  onTabChange?: (tab: 'orders' | 'appointments') => void;
}

export default function SalesPage({ activeTab: controlledTab, onTabChange }: SalesPageProps = {}) {
  const [internalTab, setInternalTab] = useState<'orders' | 'appointments'>('orders');
  const activeTab = controlledTab ?? internalTab;

  function handleTabChange(tab: 'orders' | 'appointments') {
    setInternalTab(tab);
    onTabChange?.(tab);
  }

  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);

  // Filter state for Orders (ĐH02)
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Filter state for Appointments
  const [apptSearch, setApptSearch] = useState('');
  const [apptStatusFilter, setApptStatusFilter] = useState<'ALL' | AppointmentStatus>('ALL');
  const [apptSvcFilter, setApptSvcFilter] = useState<'ALL' | 'BaoDuong' | 'SuaChua' | 'LaiThu'>('ALL');
  const [apptFromDate, setApptFromDate] = useState('');
  const [apptToDate, setApptToDate] = useState('');

  // Load live orders and appointments from Backend API
  useEffect(() => {
    let isMounted = true;
    const fetchSalesData = () => {
      orderApi.getAll().then(data => {
        if (isMounted && data && data.length > 0) setOrders(data);
      });
      appointmentApi.getAll().then(data => {
        if (isMounted && data && data.length > 0) setAppointments(data);
      });
    };

    fetchSalesData();

    const handleRefresh = (e: any) => {
      const type = e.detail?.type;
      if (!type || type === 'order' || type === 'order_created' || type === 'appointment_booked') {
        fetchSalesData();
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

  function updateOrderStatus(id: string, status: OrderStatus) {
    const numId = parseInt(id.replace(/\D/g, ''), 10);
    const label = orderStatuses.find(s => s.key === status)?.label || status;
    if (!isNaN(numId)) {
      orderApi.updateStatus(numId, label);
    } else {
      orderApi.updateStatus(id, label);
    }
    setOrders(os => os.map(o => o.id === id ? { ...o, trangThai: status } : o));
  }

  function updateApptStatus(id: string, status: AppointmentStatus) {
    const numId = parseInt(id.replace(/\D/g, ''), 10);
    if (!isNaN(numId)) {
      const label = apptStatuses.find(s => s.key === status)?.label || status;
      appointmentApi.updateStatus(numId, label);
    }
    setAppointments(as => as.map(a => a.id === id ? { ...a, trangThai: status } : a));
  }

  // Quick date presets for ĐH02
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

  const resetOrderFilters = () => {
    setOrderSearch('');
    setOrderStatusFilter('ALL');
    setFromDate('');
    setToDate('');
  };

  // Quick date presets for Appointments
  const setQuickApptDate = (preset: 'today' | '7days' | '30days' | 'all') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setApptFromDate(todayStr);
      setApptToDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setApptFromDate(past.toISOString().split('T')[0]);
      setApptToDate(todayStr);
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setApptFromDate(past.toISOString().split('T')[0]);
      setApptToDate(todayStr);
    } else {
      setApptFromDate('');
      setApptToDate('');
    }
  };

  const resetApptFilters = () => {
    setApptSearch('');
    setApptStatusFilter('ALL');
    setApptSvcFilter('ALL');
    setApptFromDate('');
    setApptToDate('');
  };

  // Filtered appointments list with full multi-criteria & date range support
  const filteredAppts = appointments.filter(a => {
    // Search
    if (apptSearch.trim()) {
      const q = apptSearch.toLowerCase();
      const matchName = a.hoTenKH.toLowerCase().includes(q);
      const matchPhone = a.soDienThoai.toLowerCase().includes(q);
      const matchVehicle = (a.tenXe || '').toLowerCase().includes(q);
      const matchPlate = (a.bienSo || '').toLowerCase().includes(q);
      const matchNote = (a.ghiChu || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchVehicle && !matchPlate && !matchNote) return false;
    }
    // Status
    if (apptStatusFilter !== 'ALL' && a.trangThai !== apptStatusFilter) {
      return false;
    }
    // Service type
    if (apptSvcFilter !== 'ALL' && a.loaiDichVu !== apptSvcFilter) {
      return false;
    }
    // Date from/to - handles same-day correctly
    if (apptFromDate && a.ngayHen < apptFromDate) {
      return false;
    }
    if (apptToDate && a.ngayHen > apptToDate) {
      return false;
    }
    return true;
  });

  // Filtered orders list - handles same-day correctly (ĐH02)
  const filteredOrders = orders.filter(o => {
    // Search
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchName = o.hoTenKH.toLowerCase().includes(q);
      const matchAddr = o.diaChiGiao.toLowerCase().includes(q);
      const matchItem = o.items.some(it => it.tenSanPham.toLowerCase().includes(q));
      if (!matchId && !matchName && !matchAddr && !matchItem) return false;
    }
    // Status
    if (orderStatusFilter !== 'ALL' && o.trangThai !== orderStatusFilter) {
      return false;
    }
    // Date from/to - handles fromDate === toDate without issue
    if (fromDate && o.ngayDat < fromDate) {
      return false;
    }
    if (toDate && o.ngayDat > toDate) {
      return false;
    }
    return true;
  });

  const statusCfgWithColor = orderStatuses;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {activeTab === 'orders' ? 'QUẢN LÝ ĐƠN HÀNG' : 'LỊCH HẸN DỊCH VỤ'}
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--color-zinc-500)' }}>
          {activeTab === 'orders' ? 'Theo dõi, tra cứu, lọc ngày và cập nhật trạng thái các đơn đặt hàng phụ tùng' : 'Quản lý, tra cứu, lọc ngày và duyệt lịch hẹn bảo dưỡng, sửa chữa, lái thử xe của khách hàng'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'orders', label: `📦 Đơn hàng (${filteredOrders.length}/${orders.length})` }, 
          { key: 'appointments', label: `📅 Lịch hẹn (${filteredAppts.length}/${appointments.length})` }
        ].map(t => (
          <button key={t.key} onClick={() => handleTabChange(t.key as 'orders' | 'appointments')}
            className="px-5 py-2.5 rounded-xl text-sm font-600 transition-all"
            style={{
              background: activeTab === t.key ? 'var(--color-zinc-950)' : 'white',
              color: activeTab === t.key ? 'white' : 'var(--color-zinc-600)',
              border: activeTab === t.key ? '1px solid var(--color-zinc-950)' : '1px solid var(--color-zinc-200)',
              cursor: 'pointer',
            }}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter Bar (ĐH02) */}
          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search */}
              <div className="md:col-span-4 relative">
                <input
                  type="text"
                  placeholder="🔍 Tìm mã đơn, khách hàng, phụ tùng..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Status */}
              <div className="md:col-span-3">
                <select
                  value={orderStatusFilter}
                  onChange={e => setOrderStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 bg-white focus:outline-none focus:border-red-600"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  {orderStatuses.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* From Date */}
              <div className="md:col-span-2.5 flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500 shrink-0 font-medium">Từ:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-xl border border-zinc-300 bg-white focus:outline-none focus:border-red-600 font-mono"
                />
              </div>

              {/* To Date */}
              <div className="md:col-span-2.5 flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500 shrink-0 font-medium">Đến:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-xl border border-zinc-300 bg-white focus:outline-none focus:border-red-600 font-mono"
                />
              </div>
            </div>

            {/* Quick date presets & status info */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-zinc-100 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-zinc-500 font-medium text-[11px]">Lọc nhanh:</span>
                <button
                  type="button"
                  onClick={() => setQuickDate('today')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    fromDate && toDate && fromDate === toDate && fromDate === new Date().toISOString().split('T')[0]
                      ? 'bg-red-700 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('7days')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition"
                >
                  7 ngày qua
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('30days')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition"
                >
                  30 ngày qua
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('all')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition"
                >
                  Tất cả thời gian
                </button>

                {(orderSearch || orderStatusFilter !== 'ALL' || fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={resetOrderFilters}
                    className="ml-2 text-red-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    ✕ Đặt lại
                  </button>
                )}
              </div>

              <div className="text-[11px] font-mono text-zinc-500">
                Hiển thị <strong className="text-zinc-800">{filteredOrders.length}</strong> / {orders.length} đơn hàng
                {fromDate && toDate && fromDate === toDate && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    Lọc trong ngày: {fromDate}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: 'var(--color-zinc-50)' }}>
                    <th style={thSt}>Mã đơn</th>
                    <th style={thSt}>Khách hàng</th>
                    <th style={thSt}>Ngày đặt</th>
                    <th style={thSt}>Sản phẩm</th>
                    <th style={thSt}>Tổng tiền</th>
                    <th style={thSt}>Trạng thái</th>
                    <th style={{ ...thSt, textAlign: 'center' }}>Cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-zinc-400 text-sm">
                        Không tìm thấy đơn hàng nào phù hợp với bộ lọc ngày hoặc từ khóa.
                      </td>
                    </tr>
                  ) : filteredOrders.map(o => (
                  <tr key={o.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-zinc-50)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                    style={{ transition: 'background 0.1s' }}>
                    <td style={tdSt}><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-zinc-400)' }}>#{o.id}</span></td>
                    <td style={tdSt}>
                      <div className="font-500">{o.hoTenKH}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-zinc-400)', marginTop: 2 }}>{o.diaChiGiao.slice(0, 30)}…</div>
                    </td>
                    <td style={{ ...tdSt, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-zinc-500)' }}>{o.ngayDat}</td>
                    <td style={tdSt}>
                      <div style={{ fontSize: 12 }}>
                        {o.items.slice(0, 2).map((it, i) => <div key={i} style={{ color: 'var(--color-zinc-600)' }}>{it.tenSanPham} ×{it.soLuong}</div>)}
                        {o.items.length > 2 && <div style={{ color: 'var(--color-zinc-400)', fontSize: 11 }}>+{o.items.length - 2} thêm...</div>}
                      </div>
                    </td>
                    <td style={tdSt}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--color-red-700)', letterSpacing: '0.02em' }}>{formatVND(o.tongTien)}</span>
                    </td>
                    <td style={tdSt}><StatusBadge status={o.trangThai} configs={statusCfgWithColor} /></td>
                    <td style={{ ...tdSt, textAlign: 'center' }}>
                      <select value={o.trangThai}
                        onChange={e => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                        style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--color-zinc-200)', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-zinc-700)', background: 'white', cursor: 'pointer', outline: 'none' }}>
                        {orderStatuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {/* Filter Bar for Appointments */}
          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search */}
              <div className="md:col-span-4 relative">
                <input
                  type="text"
                  placeholder="🔍 Tìm khách hàng, SĐT, xe, biển số, ghi chú..."
                  value={apptSearch}
                  onChange={e => setApptSearch(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Service Type */}
              <div className="md:col-span-2.5">
                <select
                  value={apptSvcFilter}
                  onChange={e => setApptSvcFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 bg-white focus:outline-none focus:border-red-600 font-medium"
                >
                  <option value="ALL">Tất cả dịch vụ</option>
                  <option value="BaoDuong">🔧 Bảo dưỡng</option>
                  <option value="SuaChua">⚙️ Sửa chữa</option>
                  <option value="LaiThu">🏍️ Lái thử</option>
                </select>
              </div>

              {/* Status */}
              <div className="md:col-span-2.5">
                <select
                  value={apptStatusFilter}
                  onChange={e => setApptStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 bg-white focus:outline-none focus:border-red-600"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  {apptStatuses.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* From Date */}
              <div className="md:col-span-1.5 flex items-center gap-1">
                <span className="text-[11px] text-zinc-500 shrink-0 font-medium">Từ:</span>
                <input
                  type="date"
                  value={apptFromDate}
                  onChange={e => setApptFromDate(e.target.value)}
                  className="w-full px-2 py-2 text-xs rounded-xl border border-zinc-300 bg-white focus:outline-none focus:border-red-600 font-mono"
                />
              </div>

              {/* To Date */}
              <div className="md:col-span-1.5 flex items-center gap-1">
                <span className="text-[11px] text-zinc-500 shrink-0 font-medium">Đến:</span>
                <input
                  type="date"
                  value={apptToDate}
                  onChange={e => setApptToDate(e.target.value)}
                  className="w-full px-2 py-2 text-xs rounded-xl border border-zinc-300 bg-white focus:outline-none focus:border-red-600 font-mono"
                />
              </div>
            </div>

            {/* Quick date presets & status info */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-zinc-100 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-zinc-500 font-medium text-[11px]">Lọc nhanh:</span>
                <button
                  type="button"
                  onClick={() => setQuickApptDate('today')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    apptFromDate && apptToDate && apptFromDate === apptToDate && apptFromDate === new Date().toISOString().split('T')[0]
                      ? 'bg-red-700 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => setQuickApptDate('7days')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition"
                >
                  7 ngày qua
                </button>
                <button
                  type="button"
                  onClick={() => setQuickApptDate('30days')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition"
                >
                  30 ngày qua
                </button>
                <button
                  type="button"
                  onClick={() => setQuickApptDate('all')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition"
                >
                  Tất cả thời gian
                </button>

                {(apptSearch || apptStatusFilter !== 'ALL' || apptSvcFilter !== 'ALL' || apptFromDate || apptToDate) && (
                  <button
                    type="button"
                    onClick={resetApptFilters}
                    className="ml-2 text-red-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    ✕ Đặt lại
                  </button>
                )}
              </div>

              <div className="text-[11px] font-mono text-zinc-500">
                Hiển thị <strong className="text-zinc-800">{filteredAppts.length}</strong> / {appointments.length} lịch hẹn
                {apptFromDate && apptToDate && apptFromDate === apptToDate && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    Lọc trong ngày: {apptFromDate}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: 'var(--color-zinc-50)' }}>
                    <th style={thSt}>Khách hàng</th>
                    <th style={thSt}>Dịch vụ</th>
                    <th style={thSt}>Ngày & Giờ</th>
                    <th style={thSt}>Xe</th>
                    <th style={thSt}>Ghi chú</th>
                    <th style={thSt}>Trạng thái</th>
                    <th style={{ ...thSt, textAlign: 'center' }}>Duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-zinc-400 text-sm">
                        Không tìm thấy lịch hẹn nào phù hợp với bộ lọc ngày hoặc từ khóa.
                      </td>
                    </tr>
                  ) : filteredAppts.map(a => {
                    const svcLabel = a.loaiDichVu === 'BaoDuong' ? 'Bảo dưỡng' : a.loaiDichVu === 'SuaChua' ? 'Sửa chữa' : 'Lái thử';
                    const svcCfg = [
                      { key: 'ChoDuyet', label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
                      { key: 'DaXacNhan', label: 'Đã xác nhận', color: '#2563eb', bg: '#dbeafe' },
                      { key: 'DangThucHien', label: 'Đang thực hiện', color: 'var(--color-red-700)', bg: '#fee2e2' },
                      { key: 'HoanThanh', label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7' },
                      { key: 'DaHuy', label: 'Đã hủy', color: '#71717a', bg: '#f4f4f5' },
                    ];
                    return (
                      <tr key={a.id}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-zinc-50)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                        style={{ transition: 'background 0.1s' }}>
                        <td style={tdSt}>
                          <div className="font-500">{a.hoTenKH}</div>
                          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-zinc-400)', marginTop: 2 }}>{a.soDienThoai}</div>
                        </td>
                        <td style={tdSt}>
                          <span className="inline-flex px-2 py-1 rounded-lg text-xs font-600"
                            style={{ background: a.loaiDichVu === 'BaoDuong' ? 'var(--color-zinc-100)' : a.loaiDichVu === 'SuaChua' ? 'var(--color-red-50)' : '#dbeafe', color: a.loaiDichVu === 'BaoDuong' ? 'var(--color-zinc-700)' : a.loaiDichVu === 'SuaChua' ? 'var(--color-red-800)' : '#1d4ed8', fontFamily: 'var(--font-mono)' }}>
                            {svcLabel}
                          </span>
                        </td>
                        <td style={{ ...tdSt, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          <div style={{ color: 'var(--color-zinc-700)' }}>{a.ngayHen}</div>
                          <div style={{ color: 'var(--color-red-700)', fontWeight: 600 }}>{a.gioHen}</div>
                        </td>
                        <td style={tdSt}>
                          {a.tenXe ? (
                            <>
                              <div style={{ fontSize: 12 }}>{a.tenXe}</div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-zinc-400)' }}>{a.bienSo}</div>
                            </>
                          ) : <span style={{ color: 'var(--color-zinc-300)' }}>—</span>}
                        </td>
                        <td style={{ ...tdSt, maxWidth: 180 }}>
                          <div style={{ fontSize: 12, color: 'var(--color-zinc-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.ghiChu || '—'}</div>
                        </td>
                        <td style={tdSt}><StatusBadge status={a.trangThai} configs={svcCfg} /></td>
                        <td style={{ ...tdSt, textAlign: 'center' }}>
                          {a.trangThai === 'ChoDuyet' ? (
                            <div className="flex gap-1.5 justify-center">
                              <button onClick={() => updateApptStatus(a.id, 'DaXacNhan')}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-600"
                                style={{ background: '#dcfce7', color: '#16a34a', border: 'none', cursor: 'pointer' }}>✓ Duyệt</button>
                              <button onClick={() => updateApptStatus(a.id, 'DaHuy')}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-600"
                                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer' }}>✕ Hủy</button>
                            </div>
                          ) : (
                            <select value={a.trangThai}
                              onChange={e => updateApptStatus(a.id, e.target.value as AppointmentStatus)}
                              style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--color-zinc-200)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-zinc-700)', background: 'white', cursor: 'pointer', outline: 'none' }}>
                              {apptStatuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
