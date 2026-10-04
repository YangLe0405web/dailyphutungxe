import { useState, useEffect } from 'react';
import { mockOrders, mockAppointments, formatVND, type OrderStatus, type AppointmentStatus, type Order, type Appointment } from '../../data/mockData';
import { orderApi, appointmentApi } from '../../services/api';

const orderStatuses: { key: OrderStatus; label: string; color: string; bg: string }[] = [
  { key: 'ChoDuyet', label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
  { key: 'DangGiao', label: 'Đang giao', color: '#2563eb', bg: '#dbeafe' },
  { key: 'HoanThanh', label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7' },
  { key: 'DaHuy', label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
];

const apptStatuses: { key: AppointmentStatus; label: string; color: string; bg: string }[] = [
  { key: 'ChoXacNhan', label: 'Chờ xác nhận', color: '#d97706', bg: '#fef3c7' },
  { key: 'DaXacNhan', label: 'Đã xác nhận', color: '#2563eb', bg: '#dbeafe' },
  { key: 'TuChoi', label: 'Từ chối', color: '#dc2626', bg: '#fee2e2' },
  { key: 'DaHoanThanh', label: 'Đã hoàn thành', color: '#16a34a', bg: '#dcfce7' },
  { key: 'DaHuy', label: 'Đã hủy', color: '#71717a', bg: '#f4f4f5' },
];

const technicianList = [
  'Chưa phân công',
  'KTV. Nguyễn Văn Toàn',
  'KTV. Trần Minh Long',
  'KTV. Lê Hoàng Nam',
  'KTV. Phạm Quốc Hưng',
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

const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getMonthDaysGrid = (currentDate: Date) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0, Sun = 6
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];
  const todayKey = toDateKey(new Date());

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    const prevDate = new Date(year, month - 1, dayNum);
    cells.push({
      dateStr: toDateKey(prevDate),
      dayNum,
      isCurrentMonth: false,
      isToday: toDateKey(prevDate) === todayKey,
    });
  }

  for (let d = 1; d <= totalDays; d++) {
    const curDate = new Date(year, month, d);
    cells.push({
      dateStr: toDateKey(curDate),
      dayNum: d,
      isCurrentMonth: true,
      isToday: toDateKey(curDate) === todayKey,
    });
  }

  const remaining = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d);
    cells.push({
      dateStr: toDateKey(nextDate),
      dayNum: d,
      isCurrentMonth: false,
      isToday: toDateKey(nextDate) === todayKey,
    });
  }

  return cells;
};

const getWeekDaysArray = (baseDate: Date) => {
  const current = new Date(baseDate);
  const day = current.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + diff);

  const days: { date: Date; dateStr: string; dayName: string; isToday: boolean }[] = [];
  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  const todayKey = toDateKey(new Date());

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = toDateKey(d);
    days.push({
      date: d,
      dateStr,
      dayName: dayNames[i],
      isToday: dateStr === todayKey,
    });
  }
  return days;
};

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

  // Appointment sub-features (LH05, LH06, LH07, LH08, LH09)
  const [selectedApptForDetail, setSelectedApptForDetail] = useState<Appointment | null>(null);
  const [selectedApptForEdit, setSelectedApptForEdit] = useState<Appointment | null>(null);
  const [selectedApptForReject, setSelectedApptForReject] = useState<Appointment | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [selectedApptForContact, setSelectedApptForContact] = useState<Appointment | null>(null);
  const [copiedContactMsg, setCopiedContactMsg] = useState(false);

  // Calendar View state (LH09)
  const [apptViewMode, setApptViewMode] = useState<'table' | 'calendar'>('table');
  const [calendarViewType, setCalendarViewType] = useState<'month' | 'week' | 'day'>('month');
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());

  function updateApptStatus(id: string, status: AppointmentStatus, lyDoTuChoi?: string) {
    appointmentApi.updateStatus(id, status, lyDoTuChoi);
    setAppointments(as => as.map(a => a.id === id ? { ...a, trangThai: status, ...(lyDoTuChoi ? { lyDoTuChoi } : {}) } : a));
    setSelectedApptForDetail(prev => prev && prev.id === id ? { ...prev, trangThai: status, ...(lyDoTuChoi ? { lyDoTuChoi } : {}) } : prev);
  }

  async function handleAssignTechnician(apptId: string, staffName: string) {
    await appointmentApi.assignStaff(apptId, staffName);
    setAppointments(as => as.map(a => a.id === apptId ? { ...a, nhanVienPhuTrach: staffName } : a));
    setSelectedApptForDetail(prev => prev && prev.id === apptId ? { ...prev, nhanVienPhuTrach: staffName } : prev);
  }

  function handleConfirmReject() {
    if (!selectedApptForReject) return;
    if (!rejectReasonInput.trim()) {
      alert('Vui lòng nhập lý do từ chối lịch hẹn!');
      return;
    }
    updateApptStatus(selectedApptForReject.id, 'TuChoi', rejectReasonInput.trim());
    setSelectedApptForReject(null);
    setRejectReasonInput('');
  }

  async function handleSaveEditedAppt(edited: Appointment) {
    await appointmentApi.updateDetails(edited.id, edited);
    if (edited.trangThai) {
      await appointmentApi.updateStatus(edited.id, edited.trangThai, edited.lyDoTuChoi);
    }
    setAppointments(as => as.map(a => a.id === edited.id ? { ...edited } : a));
    setSelectedApptForEdit(null);
    if (selectedApptForDetail && selectedApptForDetail.id === edited.id) {
      setSelectedApptForDetail(edited);
    }
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
          {/* Header Switcher: Bảng danh sách vs Lịch biểu (LH09) */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 border border-zinc-200">
              <button
                type="button"
                onClick={() => setApptViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  apptViewMode === 'table' ? 'bg-white text-zinc-900 shadow-2xs font-extrabold' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>📋</span>
                <span>Bảng danh sách</span>
              </button>
              <button
                type="button"
                onClick={() => setApptViewMode('calendar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  apptViewMode === 'calendar' ? 'bg-white text-zinc-900 shadow-2xs font-extrabold' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>📅</span>
                <span>Lịch biểu (Calendar View)</span>
              </button>
            </div>

            <div className="text-xs text-zinc-500 font-medium">
              Tổng số: <strong className="text-zinc-900 font-bold">{appointments.length}</strong> lịch hẹn
            </div>
          </div>

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

              {/* Status (LH04: 5 Standard Statuses) */}
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

          {/* ══════════ CHẾ ĐỘ 1: BẢNG DANH SÁCH (TABLE VIEW) ══════════ */}
          {apptViewMode === 'table' && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ background: 'var(--color-zinc-50)' }}>
                      <th style={thSt}>Mã & Khách hàng</th>
                      <th style={thSt}>Dịch vụ</th>
                      <th style={thSt}>Thời gian</th>
                      <th style={thSt}>Phương tiện</th>
                      <th style={thSt}>KTV Phụ trách</th>
                      <th style={thSt}>Trạng thái</th>
                      <th style={{ ...thSt, textAlign: 'center' }}>Thao tác</th>
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
                      const svcLabel = a.loaiDichVu === 'BaoDuong' ? '🔧 Bảo dưỡng' : a.loaiDichVu === 'SuaChua' ? '⚙️ Sửa chữa' : '🏍️ Lái thử';
                      const isCompleted = a.trangThai === 'DaHoanThanh';
                      const isPending = a.trangThai === 'ChoXacNhan' || a.trangThai === 'ChoDuyet';

                      return (
                        <tr key={a.id}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-zinc-50)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                          style={{ transition: 'background 0.1s' }}>
                          {/* Khách hàng */}
                          <td style={tdSt}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
                                #{a.id}
                              </span>
                              <span className="font-bold text-zinc-900">{a.hoTenKH}</span>
                            </div>
                            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-zinc-500)' }}>
                              📞 {a.soDienThoai}
                            </div>
                          </td>

                          {/* Dịch vụ */}
                          <td style={tdSt}>
                            <span className="inline-flex px-2 py-1 rounded-lg text-xs font-semibold"
                              style={{
                                background: a.loaiDichVu === 'BaoDuong' ? 'var(--color-zinc-100)' : a.loaiDichVu === 'SuaChua' ? 'var(--color-red-50)' : '#dbeafe',
                                color: a.loaiDichVu === 'BaoDuong' ? 'var(--color-zinc-800)' : a.loaiDichVu === 'SuaChua' ? 'var(--color-red-800)' : '#1d4ed8'
                              }}>
                              {svcLabel}
                            </span>
                          </td>

                          {/* Thời gian */}
                          <td style={{ ...tdSt, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                            <div style={{ color: 'var(--color-zinc-800)', fontWeight: 600 }}>📅 {a.ngayHen}</div>
                            <div style={{ color: 'var(--color-red-700)', fontWeight: 700 }}>⏰ {a.gioHen}</div>
                          </td>

                          {/* Xe & Biển số */}
                          <td style={tdSt}>
                            {a.tenXe ? (
                              <>
                                <div style={{ fontSize: 12, fontWeight: 500 }}>{a.tenXe}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-zinc-500)' }}>{a.bienSo || '—'}</div>
                              </>
                            ) : <span style={{ color: 'var(--color-zinc-300)' }}>—</span>}
                          </td>

                          {/* LH08: Phân công nhân viên phụ trách */}
                          <td style={tdSt}>
                            <select
                              value={a.nhanVienPhuTrach || 'Chưa phân công'}
                              disabled={isCompleted}
                              onChange={e => handleAssignTechnician(a.id, e.target.value)}
                              className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 focus:outline-none focus:border-red-600 disabled:bg-zinc-100 disabled:text-zinc-400 cursor-pointer text-zinc-800"
                            >
                              {technicianList.map(tech => (
                                <option key={tech} value={tech}>{tech}</option>
                              ))}
                            </select>
                          </td>

                          {/* LH04 & LH13: Trạng thái & Khóa khi hoàn thành */}
                          <td style={tdSt}>
                            <div className="flex flex-col gap-1 items-start">
                              <StatusBadge status={a.trangThai} configs={apptStatuses} />
                              {isCompleted && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-semibold flex items-center gap-1 border border-emerald-200">
                                  🔒 Đã khóa
                                </span>
                              )}
                            </div>
                          </td>

                          {/* LH05, LH06, LH07, LH13: Thao tác hành động */}
                          <td style={{ ...tdSt, textAlign: 'center' }}>
                            <div className="flex items-center gap-1.5 justify-center flex-wrap min-w-[200px]">
                              {/* LH06: Nút Xem chi tiết */}
                              <button
                                type="button"
                                onClick={() => setSelectedApptForDetail(a)}
                                title="Xem đầy đủ chi tiết lịch hẹn"
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                              >
                                🔍 Chi tiết
                              </button>

                              {/* LH07: Nút Sửa lịch hẹn */}
                              <button
                                type="button"
                                onClick={() => setSelectedApptForEdit(a)}
                                title="Chỉnh sửa ngày giờ, xe, ghi chú"
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                              >
                                ✏️ Sửa
                              </button>

                              {/* LH05: Xác nhận & Từ chối nếu đang chờ */}
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => updateApptStatus(a.id, 'DaXacNhan')}
                                    title="Xác nhận tiếp nhận lịch hẹn"
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition cursor-pointer"
                                  >
                                    ✓ Xác nhận
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setSelectedApptForReject(a); setRejectReasonInput(''); }}
                                    title="Từ chối lịch hẹn kèm lý do"
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 transition cursor-pointer"
                                  >
                                    ✕ Từ chối
                                  </button>
                                </>
                              )}

                              {/* LH13: Dropdown đổi trạng thái (bị khóa nếu đã hoàn thành) */}
                              {!isPending && (
                                <select
                                  value={a.trangThai}
                                  disabled={isCompleted}
                                  onChange={e => {
                                    const nextStatus = e.target.value as AppointmentStatus;
                                    if (nextStatus === 'TuChoi') {
                                      setSelectedApptForReject(a);
                                      setRejectReasonInput('');
                                    } else {
                                      updateApptStatus(a.id, nextStatus);
                                    }
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    border: '1px solid var(--color-zinc-200)',
                                    fontSize: 11,
                                    fontFamily: 'var(--font-mono)',
                                    color: isCompleted ? 'var(--color-zinc-400)' : 'var(--color-zinc-700)',
                                    background: isCompleted ? 'var(--color-zinc-100)' : 'white',
                                    cursor: isCompleted ? 'not-allowed' : 'pointer',
                                    outline: 'none',
                                  }}
                                  title={isCompleted ? 'Lịch hẹn đã hoàn thành và được khóa trạng thái' : 'Đổi trạng thái'}
                                >
                                  {apptStatuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                </select>
                              )}

                              {/* LH05: Nút Liên hệ khách hàng */}
                              <button
                                type="button"
                                onClick={() => { setSelectedApptForContact(a); setCopiedContactMsg(false); }}
                                title="Gọi điện hoặc gửi tin nhắn cho khách"
                                className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                              >
                                📞 Liên hệ
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════ CHẾ ĐỘ 2: LỊCH BIỂU (CALENDAR VIEW - LH09) ══════════ */}
          {apptViewMode === 'calendar' && (
            <div className="rounded-2xl p-5 bg-white border border-zinc-200 shadow-2xs space-y-4">
              {/* Calendar Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(currentCalendarDate);
                      if (calendarViewType === 'month') d.setMonth(d.getMonth() - 1);
                      else if (calendarViewType === 'week') d.setDate(d.getDate() - 7);
                      else d.setDate(d.getDate() - 1);
                      setCurrentCalendarDate(d);
                    }}
                    className="w-8 h-8 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold transition cursor-pointer"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentCalendarDate(new Date())}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition cursor-pointer"
                  >
                    Hôm nay
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(currentCalendarDate);
                      if (calendarViewType === 'month') d.setMonth(d.getMonth() + 1);
                      else if (calendarViewType === 'week') d.setDate(d.getDate() + 7);
                      else d.setDate(d.getDate() + 1);
                      setCurrentCalendarDate(d);
                    }}
                    className="w-8 h-8 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold transition cursor-pointer"
                  >
                    ▶
                  </button>

                  <h3 className="ml-2 font-extrabold text-sm sm:text-base text-zinc-900 font-mono tracking-wide">
                    {calendarViewType === 'month' && `Tháng ${currentCalendarDate.getMonth() + 1}, Năm ${currentCalendarDate.getFullYear()}`}
                    {calendarViewType === 'week' && `Tuần: ${getWeekDaysArray(currentCalendarDate)[0].dateStr} → ${getWeekDaysArray(currentCalendarDate)[6].dateStr}`}
                    {calendarViewType === 'day' && `Ngày: ${toDateKey(currentCalendarDate)}`}
                  </h3>
                </div>

                {/* Switcher Month / Week / Day */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 border border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setCalendarViewType('month')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      calendarViewType === 'month' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarViewType('week')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      calendarViewType === 'week' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Tuần
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarViewType('day')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      calendarViewType === 'day' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Ngày
                  </button>
                </div>
              </div>

              {/* 2A. CALENDAR VIEW: THÁNG (MONTH) */}
              {calendarViewType === 'month' && (
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-7 bg-zinc-50 border-b border-zinc-200 text-center py-2 text-xs font-bold text-zinc-600 uppercase font-mono">
                    <div>Thứ 2</div>
                    <div>Thứ 3</div>
                    <div>Thứ 4</div>
                    <div>Thứ 5</div>
                    <div>Thứ 6</div>
                    <div>Thứ 7</div>
                    <div className="text-red-600">Chủ nhật</div>
                  </div>
                  <div className="grid grid-cols-7 auto-rows-fr bg-zinc-100 gap-px">
                    {getMonthDaysGrid(currentCalendarDate).map((cell, idx) => {
                      const dayAppts = filteredAppts.filter(a => a.ngayHen === cell.dateStr);

                      return (
                        <div
                          key={idx}
                          className={`min-h-[105px] p-1.5 flex flex-col justify-between transition ${
                            cell.isCurrentMonth ? 'bg-white' : 'bg-zinc-50/70 text-zinc-400'
                          } ${cell.isToday ? 'ring-2 ring-red-600/50 bg-red-50/20' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                                cell.isToday
                                  ? 'bg-red-700 text-white font-extrabold'
                                  : cell.isCurrentMonth
                                  ? 'text-zinc-800'
                                  : 'text-zinc-400'
                              }`}
                            >
                              {cell.dayNum}
                            </span>
                            {dayAppts.length > 0 && (
                              <span className="text-[10px] font-bold text-red-700 font-mono">
                                {dayAppts.length} hẹn
                              </span>
                            )}
                          </div>

                          <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px]">
                            {dayAppts.map(appt => {
                              const isCompleted = appt.trangThai === 'DaHoanThanh';
                              const isConfirmed = appt.trangThai === 'DaXacNhan';
                              const isPending = appt.trangThai === 'ChoXacNhan' || appt.trangThai === 'ChoDuyet';

                              return (
                                <div
                                  key={appt.id}
                                  onClick={() => setSelectedApptForDetail(appt)}
                                  className={`p-1 rounded-md text-[10px] font-semibold truncate cursor-pointer transition border shadow-2xs ${
                                    isCompleted
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                      : isConfirmed
                                      ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                                      : isPending
                                      ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                                      : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                                  }`}
                                  title={`${appt.gioHen} - ${appt.hoTenKH} (${appt.tenXe || ''})`}
                                >
                                  <span className="font-mono font-bold mr-1">{appt.gioHen}</span>
                                  <span>{appt.hoTenKH}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2B. CALENDAR VIEW: TUẦN (WEEK) */}
              {calendarViewType === 'week' && (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                  {getWeekDaysArray(currentCalendarDate).map((dayCol, idx) => {
                    const dayAppts = filteredAppts.filter(a => a.ngayHen === dayCol.dateStr);

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border p-3 flex flex-col min-h-[320px] ${
                          dayCol.isToday ? 'border-red-600 bg-red-50/15 ring-1 ring-red-600/30' : 'border-zinc-200 bg-zinc-50/40'
                        }`}
                      >
                        <div className="pb-2 mb-2 border-b border-zinc-200 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-zinc-900 uppercase font-mono">{dayCol.dayName}</div>
                            <div className="text-[11px] font-mono text-zinc-500">{dayCol.dateStr.slice(5)}</div>
                          </div>
                          {dayCol.isToday && (
                            <span className="px-1.5 py-0.5 rounded bg-red-700 text-white text-[10px] font-bold">Hôm nay</span>
                          )}
                        </div>

                        <div className="flex-1 space-y-2 overflow-y-auto">
                          {dayAppts.length === 0 ? (
                            <div className="text-center py-6 text-zinc-400 text-xs italic">Trống lịch</div>
                          ) : (
                            dayAppts.map(appt => (
                              <div
                                key={appt.id}
                                onClick={() => setSelectedApptForDetail(appt)}
                                className="p-2.5 rounded-xl bg-white border border-zinc-200 hover:border-red-600 hover:shadow-md transition cursor-pointer space-y-1"
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-red-700 font-mono">⏰ {appt.gioHen}</span>
                                  <span className="text-[10px] font-mono font-bold text-zinc-500">#{appt.id}</span>
                                </div>
                                <div className="text-xs font-bold text-zinc-900 truncate">{appt.hoTenKH}</div>
                                {appt.tenXe && (
                                  <div className="text-[11px] text-zinc-600 truncate">🏍️ {appt.tenXe}</div>
                                )}
                                <div className="pt-1 flex items-center justify-between">
                                  <StatusBadge status={appt.trangThai} configs={apptStatuses} />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2C. CALENDAR VIEW: NGÀY (DAY) */}
              {calendarViewType === 'day' && (
                <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 space-y-3">
                  <div className="font-bold text-xs text-zinc-700 uppercase font-mono">
                    Danh sách lịch hẹn trong ngày: <strong className="text-zinc-900">{toDateKey(currentCalendarDate)}</strong>
                  </div>

                  {(() => {
                    const selectedDayStr = toDateKey(currentCalendarDate);
                    const dayAppts = filteredAppts.filter(a => a.ngayHen === selectedDayStr);

                    if (dayAppts.length === 0) {
                      return (
                        <div className="text-center py-12 text-zinc-400 text-sm bg-white rounded-xl border border-zinc-200">
                          Không có lịch hẹn nào được đặt trong ngày này.
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dayAppts.map(appt => (
                          <div
                            key={appt.id}
                            onClick={() => setSelectedApptForDetail(appt)}
                            className="p-4 rounded-xl bg-white border border-zinc-200 hover:border-red-600 hover:shadow-md transition cursor-pointer space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-extrabold text-red-700 font-mono">⏰ {appt.gioHen}</span>
                              <StatusBadge status={appt.trangThai} configs={apptStatuses} />
                            </div>
                            <div className="text-sm font-bold text-zinc-900">{appt.hoTenKH} - {appt.soDienThoai}</div>
                            <div className="text-xs text-zinc-600">🏍️ {appt.tenXe || 'Chưa cập nhật'} · {appt.bienSo || '—'}</div>
                            <div className="text-xs text-zinc-500">👨‍🔧 KTV: {appt.nhanVienPhuTrach || 'Chưa phân công'}</div>
                            {appt.ghiChu && (
                              <div className="text-xs text-zinc-500 bg-zinc-50 p-2 rounded-lg truncate">💬 {appt.ghiChu}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ══════════ 3. MODAL CHI TIẾT LỊCH HẸN (LH06) ══════════ */}
          {selectedApptForDetail && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto space-y-5">
                <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-lg text-zinc-900" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                        CHI TIẾT LỊCH HẸN #{selectedApptForDetail.id}
                      </h3>
                      <StatusBadge status={selectedApptForDetail.trangThai} configs={apptStatuses} />
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 font-mono">
                      Thời điểm tạo lịch: {selectedApptForDetail.createdDate || 'Đã ghi nhận trong hệ thống'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedApptForDetail(null)}
                    className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* Khách hàng */}
                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                    <div className="text-zinc-500 font-semibold uppercase font-mono text-[10px]">Thông tin khách hàng</div>
                    <div className="text-sm font-bold text-zinc-900">{selectedApptForDetail.hoTenKH}</div>
                    <div className="font-mono text-zinc-700">📞 SĐT: <strong>{selectedApptForDetail.soDienThoai}</strong></div>
                    <div className="font-mono text-zinc-500">Mã KH: {selectedApptForDetail.customerId || 'KH001'}</div>
                  </div>

                  {/* Dịch vụ */}
                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                    <div className="text-zinc-500 font-semibold uppercase font-mono text-[10px]">Loại dịch vụ</div>
                    <div className="text-sm font-bold text-red-700">
                      {selectedApptForDetail.loaiDichVu === 'BaoDuong' ? '🔧 Bảo dưỡng định kỳ' : selectedApptForDetail.loaiDichVu === 'SuaChua' ? '⚙️ Sửa chữa hỏng hóc' : '🏍️ Lái thử xe mới'}
                    </div>
                    <div className="text-zinc-700">Phương tiện: <strong>{selectedApptForDetail.tenXe || 'Chưa cập nhật'}</strong></div>
                    <div className="font-mono text-zinc-500">Biển số: {selectedApptForDetail.bienSo || '—'}</div>
                  </div>

                  {/* Thời gian hẹn */}
                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                    <div className="text-zinc-500 font-semibold uppercase font-mono text-[10px]">Thời gian hẹn làm dịch vụ</div>
                    <div className="text-sm font-extrabold text-zinc-900 font-mono">📅 Ngày: {selectedApptForDetail.ngayHen}</div>
                    <div className="text-sm font-extrabold text-red-700 font-mono">⏰ Giờ: {selectedApptForDetail.gioHen}</div>
                  </div>

                  {/* Nhân viên phụ trách */}
                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                    <div className="text-zinc-500 font-semibold uppercase font-mono text-[10px]">Kỹ thuật viên phụ trách</div>
                    <div className="text-sm font-bold text-zinc-900">{selectedApptForDetail.nhanVienPhuTrach || 'Chưa phân công'}</div>
                    <div className="text-zinc-500 text-[11px]">Có thể đổi trực tiếp trong phần chỉnh sửa</div>
                  </div>
                </div>

                {/* Nếu bị từ chối, hiển thị lý do */}
                {selectedApptForDetail.trangThai === 'TuChoi' && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                    <div className="font-bold flex items-center gap-1 uppercase font-mono text-[11px]">
                      <span>⚠️ Lý do từ chối lịch hẹn:</span>
                    </div>
                    <div>{selectedApptForDetail.lyDoTuChoi || 'Cửa hàng hiện tại đã kín lịch hoặc xe không phù hợp.'}</div>
                  </div>
                )}

                {/* Ghi chú chi tiết từ khách hàng */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs">
                  <div className="font-semibold text-zinc-700 uppercase font-mono text-[10px]">Chi tiết yêu cầu & Ghi chú từ khách hàng:</div>
                  <div className="text-zinc-800 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-zinc-200">
                    {selectedApptForDetail.ghiChu || 'Không có ghi chú thêm từ khách hàng.'}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const appt = selectedApptForDetail;
                        setSelectedApptForDetail(null);
                        setSelectedApptForEdit(appt);
                      }}
                      className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold transition cursor-pointer"
                    >
                      ✏️ Chỉnh sửa thông tin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const appt = selectedApptForDetail;
                        setSelectedApptForDetail(null);
                        setSelectedApptForContact(appt);
                        setCopiedContactMsg(false);
                      }}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer"
                    >
                      📞 Liên hệ khách
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {(selectedApptForDetail.trangThai === 'ChoXacNhan' || selectedApptForDetail.trangThai === 'ChoDuyet') && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            updateApptStatus(selectedApptForDetail.id, 'DaXacNhan');
                            setSelectedApptForDetail(null);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer"
                        >
                          ✓ Xác nhận lịch
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const appt = selectedApptForDetail;
                            setSelectedApptForDetail(null);
                            setSelectedApptForReject(appt);
                            setRejectReasonInput('');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition cursor-pointer"
                        >
                          ✕ Từ chối
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedApptForDetail(null)}
                      className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold transition cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ 4. MODAL CHỈNH SỬA LỊCH HẸN (LH07 & LH13) ══════════ */}
          {selectedApptForEdit && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto space-y-4">
                <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                      CHỈNH SỬA LỊCH HẸN #{selectedApptForEdit.id}
                    </h3>
                    <div className="text-xs text-zinc-500">Khách hàng: <strong>{selectedApptForEdit.hoTenKH}</strong> ({selectedApptForEdit.soDienThoai})</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedApptForEdit(null)}
                    className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const form = e.target as any;
                    const updatedDate = form.ngayHen.value;
                    const year = parseInt(updatedDate.split('-')[0], 10);
                    if (isNaN(year) || year < 2024 || year > 2030) {
                      alert('Vui lòng nhập năm hẹn 4 chữ số hợp lệ (VD: 2026)!');
                      return;
                    }

                    handleSaveEditedAppt({
                      ...selectedApptForEdit,
                      ngayHen: updatedDate,
                      gioHen: form.gioHen.value,
                      loaiDichVu: form.loaiDichVu.value,
                      tenXe: form.tenXe.value.trim(),
                      bienSo: form.bienSo.value.trim(),
                      nhanVienPhuTrach: form.nhanVienPhuTrach.value,
                      trangThai: selectedApptForEdit.trangThai === 'DaHoanThanh' ? 'DaHoanThanh' : form.trangThai.value,
                      ghiChu: form.ghiChu.value.trim(),
                    });
                  }}
                  className="space-y-3.5 text-xs"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Ngày hẹn (YYYY-MM-DD):</label>
                      <input
                        type="date"
                        name="ngayHen"
                        defaultValue={selectedApptForEdit.ngayHen}
                        required
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs font-mono bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Giờ hẹn (HH:mm):</label>
                      <input
                        type="time"
                        name="gioHen"
                        defaultValue={selectedApptForEdit.gioHen}
                        required
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs font-mono bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Loại dịch vụ:</label>
                      <select
                        name="loaiDichVu"
                        defaultValue={selectedApptForEdit.loaiDichVu}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                      >
                        <option value="BaoDuong">🔧 Bảo dưỡng</option>
                        <option value="SuaChua">⚙️ Sửa chữa</option>
                        <option value="LaiThu">🏍️ Lái thử</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">KTV Phụ trách (LH08):</label>
                      <select
                        name="nhanVienPhuTrach"
                        defaultValue={selectedApptForEdit.nhanVienPhuTrach || 'Chưa phân công'}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                      >
                        {technicianList.map(tech => (
                          <option key={tech} value={tech}>{tech}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Tên xe:</label>
                      <input
                        type="text"
                        name="tenXe"
                        defaultValue={selectedApptForEdit.tenXe || ''}
                        placeholder="VD: Honda SH 160i ABS"
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Biển số:</label>
                      <input
                        type="text"
                        name="bienSo"
                        defaultValue={selectedApptForEdit.bienSo || ''}
                        placeholder="VD: 51K-999.99"
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs font-mono bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>

                  {/* LH13: Khóa trạng thái nếu đã hoàn thành */}
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Trạng thái lịch hẹn:</label>
                    {selectedApptForEdit.trangThai === 'DaHoanThanh' ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center justify-between">
                        <span>🔒 Đã hoàn thành (Trạng thái đã khóa hoàn tất)</span>
                        <input type="hidden" name="trangThai" value="DaHoanThanh" />
                      </div>
                    ) : (
                      <select
                        name="trangThai"
                        defaultValue={selectedApptForEdit.trangThai}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                      >
                        {apptStatuses.map(s => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Ghi chú & Yêu cầu:</label>
                    <textarea
                      name="ghiChu"
                      rows={3}
                      defaultValue={selectedApptForEdit.ghiChu || ''}
                      placeholder="Ghi chú chi tiết về dịch vụ..."
                      className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setSelectedApptForEdit(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow-sm cursor-pointer"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ══════════ 5. MODAL TỪ CHỐI KÈM LÝ DO (LH05) ══════════ */}
          {selectedApptForReject && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
                <div className="flex items-start justify-between pb-2 border-b border-zinc-100">
                  <div>
                    <h3 className="font-extrabold text-base text-red-700" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                      TỪ CHỐI LỊCH HẸN #{selectedApptForReject.id}
                    </h3>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      Khách: <strong>{selectedApptForReject.hoTenKH}</strong> · {selectedApptForReject.ngayHen} ({selectedApptForReject.gioHen})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedApptForReject(null)}
                    className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold flex items-center justify-center cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                    Nhập lý do từ chối (Bắt buộc để gửi thông báo cho khách hàng):
                  </label>
                  <textarea
                    rows={4}
                    value={rejectReasonInput}
                    onChange={e => setRejectReasonInput(e.target.value)}
                    placeholder="VD: Showroom hiện đã kín lịch kỹ thuật viên trong khung giờ này / Tạm hết phụ tùng thay thế..."
                    className="w-full p-3 rounded-2xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600 resize-none"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedApptForReject(null)}
                    className="px-4 py-2 rounded-xl font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReject}
                    disabled={!rejectReasonInput.trim()}
                    className="px-5 py-2 rounded-xl font-bold bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white shadow-sm cursor-pointer"
                  >
                    Xác nhận từ chối
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ 6. MODAL LIÊN HỆ KHÁCH HÀNG (LH05) ══════════ */}
          {selectedApptForContact && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
                <div className="flex items-start justify-between pb-2 border-b border-zinc-100">
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                      LIÊN HỆ KHÁCH HÀNG #{selectedApptForContact.id}
                    </h3>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      Khách hàng: <strong className="text-zinc-800">{selectedApptForContact.hoTenKH}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedApptForContact(null)}
                    className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold flex items-center justify-center cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Quick Call */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-emerald-800 uppercase font-mono">Số điện thoại khách hàng</div>
                    <div className="text-base font-extrabold text-emerald-950 font-mono">{selectedApptForContact.soDienThoai}</div>
                  </div>
                  <a
                    href={`tel:${selectedApptForContact.soDienThoai}`}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                  >
                    <span>📞</span>
                    <span>Gọi ngay</span>
                  </a>
                </div>

                {/* Quick SMS / Zalo message template */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                    <span>Mẫu tin nhắn xác nhận SMS / Zalo:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const msg = `Kính gửi Quý khách ${selectedApptForContact.hoTenKH}, Showroom MOTOSHOP xin xác nhận lịch hẹn ${
                          selectedApptForContact.loaiDichVu === 'BaoDuong' ? 'bảo dưỡng' : selectedApptForContact.loaiDichVu === 'SuaChua' ? 'sửa chữa' : 'lái thử'
                        } xe ${selectedApptForContact.tenXe || ''} (${selectedApptForContact.bienSo || ''}) lúc ${selectedApptForContact.gioHen} ngày ${selectedApptForContact.ngayHen}. Mọi hỗ trợ xin liên hệ hotline: 0901 234 567. Trân trọng!`;
                        navigator.clipboard.writeText(msg);
                        setCopiedContactMsg(true);
                        setTimeout(() => setCopiedContactMsg(false), 2000);
                      }}
                      className="text-red-700 font-bold hover:underline cursor-pointer"
                    >
                      {copiedContactMsg ? '✓ Đã sao chép!' : '📋 Sao chép tin nhắn'}
                    </button>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 leading-relaxed font-mono">
                    Kính gửi Quý khách {selectedApptForContact.hoTenKH}, Showroom MOTOSHOP xin xác nhận lịch hẹn {
                      selectedApptForContact.loaiDichVu === 'BaoDuong' ? 'bảo dưỡng' : selectedApptForContact.loaiDichVu === 'SuaChua' ? 'sửa chữa' : 'lái thử'
                    } xe {selectedApptForContact.tenXe || ''} ({selectedApptForContact.bienSo || ''}) lúc {selectedApptForContact.gioHen} ngày {selectedApptForContact.ngayHen}. Hotline hỗ trợ: 0901 234 567. Trân trọng!
                  </div>
                </div>

                {/* Email shortcut */}
                <div>
                  <a
                    href={`mailto:khachhang@motoshop.vn?subject=Xác nhận lịch hẹn MOTOSHOP %23${selectedApptForContact.id}&body=Kính gửi Quý khách ${encodeURIComponent(selectedApptForContact.hoTenKH)},`}
                    className="w-full py-2.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <span>✉️</span>
                    <span>Mở ứng dụng gửi Email cho khách</span>
                  </a>
                </div>

                <div className="flex justify-end pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setSelectedApptForContact(null)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
