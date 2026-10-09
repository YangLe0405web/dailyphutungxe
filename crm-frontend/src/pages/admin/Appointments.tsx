import React, { useState, useEffect } from 'react';
import {
  mockAppointments,
  type AppointmentStatus,
  type ServiceType,
  type Appointment,
  type StaffAccount,
  formatVND,
} from '../../data/mockData';
import { appointmentApi } from '../../services/api';

const apptStatuses: { key: AppointmentStatus; label: string; color: string; bg: string }[] = [
  { key: 'ChoXacNhan', label: 'Chờ xác nhận', color: '#d97706', bg: '#fef3c7' },
  { key: 'DaXacNhan', label: 'Đã xác nhận', color: '#2563eb', bg: '#dbeafe' },
  { key: 'TuChoi', label: 'Từ chối', color: '#dc2626', bg: '#fee2e2' },
  { key: 'DaHoanThanh', label: 'Đã hoàn thành', color: '#16a34a', bg: '#dcfce7' },
  { key: 'DaHuy', label: 'Đã hủy', color: '#71717a', bg: '#f4f4f5' },
];

const serviceTypeConfig: Record<ServiceType, { label: string; icon: string; color: string; bg: string }> = {
  BaoDuong: { label: 'Bảo dưỡng định kỳ', icon: '🔧', color: '#0284c7', bg: '#e0f2fe' },
  SuaChua: { label: 'Sửa chữa phụ tùng', icon: '⚙️', color: '#d97706', bg: '#fef3c7' },
  LaiThu: { label: 'Đăng ký lái thử', icon: '🏍️', color: '#7c3aed', bg: '#f3e8ff' },
  NhanXe: { label: 'Đón khách nhận xe mới', icon: '🎉', color: '#dc2626', bg: '#fee2e2' },
  BaoHanh: { label: 'Kiểm tra bảo hành', icon: '🛡️', color: '#dc2626', bg: '#fee2e2' },
};

const technicianList = [
  'Chưa phân công',
  'KTV. Nguyễn Văn Toàn',
  'KTV. Trần Minh Long',
  'KTV. Lê Hoàng Nam',
  'KTV. Phạm Quốc Hưng',
  'NVTV. Nguyễn Thị Ánh',
  'NVTV. Trần Minh Hoàng',
];

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

const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getMonthDaysGrid = (currentDate: Date) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
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

export interface AppointmentsPageProps {
  currentStaff?: StaffAccount | null;
  onNavigateToCreateVehicleOrder?: (appt: Appointment) => void;
}

export default function AppointmentsPage({
  currentStaff,
  onNavigateToCreateVehicleOrder,
}: AppointmentsPageProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);

  // Filters
  const [apptSearch, setApptSearch] = useState('');
  const [apptStatusFilter, setApptStatusFilter] = useState<'ALL' | AppointmentStatus>('ALL');
  const [apptSvcFilter, setApptSvcFilter] = useState<'ALL' | ServiceType>('ALL');
  const [apptFromDate, setApptFromDate] = useState('');
  const [apptToDate, setApptToDate] = useState('');

  // Modals & sub-features
  const [selectedApptForDetail, setSelectedApptForDetail] = useState<Appointment | null>(null);
  const [selectedApptForEdit, setSelectedApptForEdit] = useState<Appointment | null>(null);
  const [selectedApptForReject, setSelectedApptForReject] = useState<Appointment | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [selectedApptForContact, setSelectedApptForContact] = useState<Appointment | null>(null);
  const [copiedContactMsg, setCopiedContactMsg] = useState(false);

  // Highlight lịch hẹn từ thông báo Admin
  const [highlightApptId, setHighlightApptId] = useState<string | null>(null);

  // Calendar View mode
  const [apptViewMode, setApptViewMode] = useState<'table' | 'calendar'>('table');
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());

  // Load appointments from API / storage
  useEffect(() => {
    let isMounted = true;
    const loadData = () => {
      appointmentApi.getAll().then(data => {
        if (isMounted && data && data.length > 0) setAppointments(data);
      });
    };

    loadData();

    const handleRefresh = (e: any) => {
      const type = e.detail?.type;
      if (!type || type === 'appointment' || type === 'appointment_booked' || type === 'appointment_updated') {
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

  // Đón nhận highlight lịch hẹn từ thông báo Admin
  useEffect(() => {
    const handleHighlight = (payload?: any) => {
      let data = payload;
      if (!data) {
        try {
          const raw = sessionStorage.getItem('crm_admin_highlight');
          if (raw) data = JSON.parse(raw);
        } catch {}
      }
      if (!data || data.page !== 'appointments') return;

      const targetId = (data.targetId || '').trim();
      const keyword = (data.keyword || '').trim();

      const match = appointments.find(a =>
        (targetId && a.id.toLowerCase() === targetId.toLowerCase()) ||
        (keyword && (a.id.toLowerCase().includes(keyword.toLowerCase()) || a.hoTenKH.toLowerCase().includes(keyword.toLowerCase())))
      );

      const targetAppt = match || (targetId ? appointments.find(a => a.id === targetId) : undefined);

      if (targetAppt) {
        setApptViewMode('table');
        setApptSearch(targetAppt.id);
        setHighlightApptId(targetAppt.id);

        setTimeout(() => {
          const el = document.getElementById(`appt-row-${targetAppt.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);

        setTimeout(() => {
          setHighlightApptId(null);
        }, 7000);
      } else if (targetId) {
        setApptViewMode('table');
        setApptSearch(targetId);
        setHighlightApptId(targetId);
        setTimeout(() => setHighlightApptId(null), 7000);
      }

      sessionStorage.removeItem('crm_admin_highlight');
    };

    handleHighlight();

    const onEvent = (e: any) => handleHighlight(e.detail);
    window.addEventListener('crm-admin-highlight-target', onEvent);
    return () => window.removeEventListener('crm-admin-highlight-target', onEvent);
  }, [appointments]);

  function updateApptStatus(id: string, status: AppointmentStatus, lyDoTuChoi?: string) {
    appointmentApi.updateStatus(id, status, lyDoTuChoi);
    setAppointments(as => as.map(a => (a.id === id ? { ...a, trangThai: status, ...(lyDoTuChoi ? { lyDoTuChoi } : {}) } : a)));
    setSelectedApptForDetail(prev => (prev && prev.id === id ? { ...prev, trangThai: status, ...(lyDoTuChoi ? { lyDoTuChoi } : {}) } : prev));
  }

  async function handleAssignTechnician(apptId: string, staffName: string) {
    await appointmentApi.assignStaff(apptId, staffName);
    setAppointments(as => as.map(a => (a.id === apptId ? { ...a, nhanVienPhuTrach: staffName } : a)));
    setSelectedApptForDetail(prev => (prev && prev.id === apptId ? { ...prev, nhanVienPhuTrach: staffName } : prev));
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
    const original = appointments.find(a => a.id === edited.id);
    if (original?.trangThai === 'DaHoanThanh') {
      alert('Lịch hẹn này đã hoàn tất và xuất hóa đơn bàn giao xe, được khóa cứng trên hệ thống không thể sửa đổi!');
      setSelectedApptForEdit(null);
      return;
    }
    await appointmentApi.updateDetails(edited.id, edited);
    if (edited.trangThai) {
      await appointmentApi.updateStatus(edited.id, edited.trangThai, edited.lyDoTuChoi);
    }
    setAppointments(as => as.map(a => (a.id === edited.id ? { ...edited } : a)));
    setSelectedApptForEdit(null);
    if (selectedApptForDetail && selectedApptForDetail.id === edited.id) {
      setSelectedApptForDetail(edited);
    }
  }

  // Quick date presets
  const setQuickDate = (preset: 'today' | '7days' | '30days' | 'all') => {
    const now = new Date();
    const todayStr = toDateKey(now);
    if (preset === 'today') {
      setApptFromDate(todayStr);
      setApptToDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setApptFromDate(toDateKey(past));
      setApptToDate(todayStr);
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setApptFromDate(toDateKey(past));
      setApptToDate(todayStr);
    } else {
      setApptFromDate('');
      setApptToDate('');
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter(a => {
    if (apptStatusFilter !== 'ALL' && a.trangThai !== apptStatusFilter) return false;
    if (apptSvcFilter !== 'ALL' && a.loaiDichVu !== apptSvcFilter) return false;
    if (apptFromDate && a.ngayHen < apptFromDate) return false;
    if (apptToDate && a.ngayHen > apptToDate) return false;
    if (apptSearch.trim()) {
      const q = apptSearch.toLowerCase();
      const matchId = a.id.toLowerCase().includes(q);
      const matchName = a.hoTenKH.toLowerCase().includes(q);
      const matchPhone = a.soDienThoai.toLowerCase().includes(q);
      const matchVehicle = (a.tenXe || '').toLowerCase().includes(q);
      const matchPlate = (a.bienSo || '').toLowerCase().includes(q);
      const matchLich = (a.maLichHen || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchPhone && !matchVehicle && !matchPlate && !matchLich) return false;
    }
    return true;
  });

  // KPI stats
  const totalCount = appointments.length;
  const pendingCount = appointments.filter(a => a.trangThai === 'ChoXacNhan').length;
  const confirmedCount = appointments.filter(a => a.trangThai === 'DaXacNhan').length;
  const pickupCount = appointments.filter(a => a.loaiDichVu === 'NhanXe' && a.trangThai !== 'DaHoanThanh').length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <h1
              className="text-2xl font-extrabold text-zinc-950 tracking-tight"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
            >
              QUẢN LÝ LỊCH HẸN DỊCH VỤ & NHẬN XE
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Theo dõi, điều phối lịch hẹn sửa chữa, bảo dưỡng, lái thử và lịch đón tiếp khách nhận xe mới tại showroom.
          </p>
        </div>

        {/* View toggle (Table vs Calendar) */}
        <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
          <button
            type="button"
            onClick={() => setApptViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              apptViewMode === 'table' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>📋</span> Danh sách
          </button>
          <button
            type="button"
            onClick={() => setApptViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              apptViewMode === 'calendar' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>🗓️</span> Lịch biểu
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs">
          <div className="text-xs text-zinc-500 font-mono">TỔNG LỊCH HẸN</div>
          <div className="text-2xl font-extrabold text-zinc-950 font-mono mt-1">{totalCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 shadow-2xs">
          <div className="text-xs text-amber-800 font-mono font-bold">⏳ CHỜ TIẾP NHẬN</div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono mt-1">{pendingCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 shadow-2xs">
          <div className="text-xs text-blue-800 font-mono font-bold">✓ ĐÃ XÁC NHẬN</div>
          <div className="text-2xl font-extrabold text-blue-700 font-mono mt-1">{confirmedCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/80 shadow-2xs">
          <div className="text-xs text-red-800 font-mono font-bold">🏍️ CHỜ GIAO XE MỚI</div>
          <div className="text-2xl font-extrabold text-red-700 font-mono mt-1">{pickupCount}</div>
        </div>
      </div>

      {/* ── BỘ LỌC TÌM KIẾM ── */}
      <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Tìm kiếm */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase font-mono mb-1">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Mã lịch, Tên KH, SĐT, Mã QR..."
              value={apptSearch}
              onChange={e => setApptSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white"
            />
          </div>

          {/* Loại dịch vụ */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase font-mono mb-1">Loại dịch vụ</label>
            <select
              value={apptSvcFilter}
              onChange={e => setApptSvcFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white"
            >
              <option value="ALL">Tất cả loại dịch vụ</option>
              <option value="NhanXe">🏍️ Đón khách nhận xe mới (D. Bán xe)</option>
              <option value="BaoDuong">🔧 Bảo dưỡng định kỳ</option>
              <option value="SuaChua">⚙️ Sửa chữa phụ tùng</option>
              <option value="LaiThu">🏍️ Lái thử xe mẫu</option>
            </select>
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase font-mono mb-1">Trạng thái</label>
            <select
              value={apptStatusFilter}
              onChange={e => setApptStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              {apptStatuses.map(s => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bộ lọc ngày */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase font-mono mb-1">Thời gian</label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={apptFromDate}
                onChange={e => setApptFromDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white font-mono"
              />
              <span className="text-zinc-400 text-xs">-</span>
              <input
                type="date"
                value={apptToDate}
                onChange={e => setApptToDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Nút lọc nhanh */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-zinc-100 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-zinc-400 font-mono text-[11px]">Chọn nhanh:</span>
            <button
              type="button"
              onClick={() => setQuickDate('today')}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setQuickDate('7days')}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold"
            >
              7 ngày qua
            </button>
            <button
              type="button"
              onClick={() => setQuickDate('30days')}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold"
            >
              30 ngày qua
            </button>
            <button
              type="button"
              onClick={() => setQuickDate('all')}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold"
            >
              Tất cả
            </button>
          </div>

          <div className="text-zinc-500 font-mono text-[11px]">
            Hiển thị: <strong>{filteredAppointments.length}</strong> / {appointments.length} cuộc hẹn
          </div>
        </div>
      </div>

      {/* ── CHẾ ĐỘ 1: BẢNG DANH SÁCH ── */}
      {apptViewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-950 text-white">
                  <th style={{ ...thSt, color: 'white' }}>MÃ LỊCH / QR</th>
                  <th style={{ ...thSt, color: 'white' }}>KHÁCH HÀNG</th>
                  <th style={{ ...thSt, color: 'white' }}>LOẠI DỊCH VỤ</th>
                  <th style={{ ...thSt, color: 'white' }}>THÔNG TIN XE</th>
                  <th style={{ ...thSt, color: 'white' }}>NGÀY & GIỜ HẸN</th>
                  <th style={{ ...thSt, color: 'white' }}>PHỤ TRÁCH</th>
                  <th style={{ ...thSt, color: 'white' }}>TRẠNG THÁI</th>
                  <th style={{ ...thSt, color: 'white', textAlign: 'center' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-400 text-sm">
                      Không tìm thấy lịch hẹn nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map(a => {
                    const isPending = a.trangThai === 'ChoXacNhan';
                    const isCompleted = a.trangThai === 'DaHoanThanh';
                    const isNhanXe = a.loaiDichVu === 'NhanXe';
                    const svcInfo = serviceTypeConfig[a.loaiDichVu] || {
                      label: a.loaiDichVu,
                      icon: '📌',
                      color: '#0284c7',
                      bg: '#e0f2fe',
                    };

                    const isHighlighted = highlightApptId === a.id;

                    return (
                      <tr
                        key={a.id}
                        id={`appt-row-${a.id}`}
                        className={`transition-all duration-300 border-t border-zinc-100 ${
                          isHighlighted
                            ? 'bg-amber-100/95 ring-4 ring-red-600 ring-inset shadow-xl animate-pulse font-bold'
                            : 'hover:bg-zinc-50'
                        }`}
                      >
                        {/* Cột 1: Mã lịch */}
                        <td style={tdSt}>
                          <div className="font-mono font-bold text-zinc-900 flex items-center gap-1.5 flex-wrap">
                            <span>#{a.id}</span>
                            {isHighlighted && (
                              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider animate-bounce shadow-sm flex items-center gap-0.5">
                                <span>★</span> ĐANG XEM
                              </span>
                            )}
                            {a.maLichHen && (
                              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                                {a.maLichHen}
                              </span>
                            )}
                          </div>
                          {a.createdDate && <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{a.createdDate}</div>}
                        </td>

                        {/* Cột 2: Khách hàng */}
                        <td style={tdSt}>
                          <div className="font-bold text-zinc-900">{a.hoTenKH}</div>
                          <div className="text-xs text-zinc-500 font-mono">{a.soDienThoai}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{a.customerId}</div>
                        </td>

                        {/* Cột 3: Loại dịch vụ */}
                        <td style={tdSt}>
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono"
                            style={{ background: svcInfo.bg, color: svcInfo.color }}
                          >
                            <span>{svcInfo.icon}</span>
                            <span>{svcInfo.label}</span>
                          </span>
                          {isNhanXe && a.soTienCoc && (
                            <div className="text-[11px] text-emerald-700 font-mono font-bold mt-1">
                              Đã cọc: {formatVND(a.soTienCoc)}
                            </div>
                          )}
                        </td>

                        {/* Cột 4: Thông tin xe */}
                        <td style={tdSt}>
                          <div className="font-semibold text-zinc-900">{a.tenXe}</div>
                          <div className="text-xs text-zinc-500 font-mono">
                            Biển: <strong>{a.bienSo || 'Chưa bấm biển'}</strong>
                          </div>
                          {a.mauXe && <div className="text-[11px] text-zinc-500">Màu: {a.mauXe}</div>}
                        </td>

                        {/* Cột 5: Ngày giờ hẹn */}
                        <td style={tdSt}>
                          <div className="font-bold font-mono text-zinc-900">{a.ngayHen}</div>
                          <div className="text-xs font-mono text-red-700 font-semibold">{a.gioHen}</div>
                        </td>

                        {/* Cột 6: Người phụ trách */}
                        <td style={tdSt}>
                          <select
                            value={a.nhanVienPhuTrach || 'Chưa phân công'}
                            disabled={isCompleted}
                            onChange={e => handleAssignTechnician(a.id, e.target.value)}
                            className="text-xs p-1 rounded-lg border border-zinc-200 bg-white font-medium focus:outline-none"
                          >
                            {technicianList.map(t => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Cột 7: Trạng thái */}
                        <td style={tdSt}>
                          <div className="flex flex-col gap-1 items-start">
                            <StatusBadge status={a.trangThai} configs={apptStatuses} />
                            {isCompleted && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-semibold border border-emerald-200">
                                🔒 Đã hoàn tất
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Cột 8: Thao tác hành động */}
                        <td style={{ ...tdSt, textAlign: 'center' }}>
                          <div className="flex items-center gap-1.5 justify-center flex-wrap min-w-[200px]">
                            {/* NÚT ĐẶC BIỆT: TẠO HÓA ĐƠN BÁN XE (D. BÁN XE) */}
                            {isNhanXe && !isCompleted && onNavigateToCreateVehicleOrder && (
                              <button
                                type="button"
                                onClick={() => onNavigateToCreateVehicleOrder(a)}
                                title="Chuyển thẳng sang POS Bán Xe với thông tin pre-fill"
                                className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition shadow-sm flex items-center gap-1 cursor-pointer"
                              >
                                <span>⚡</span>
                                <span>Tạo hóa đơn bán xe</span>
                              </button>
                            )}

                            {/* Xem chi tiết */}
                            <button
                              type="button"
                              onClick={() => setSelectedApptForDetail(a)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
                            >
                              🔍 Chi tiết
                            </button>

                            {/* Sửa hoặc hiển thị khóa */}
                            {!isCompleted ? (
                              <button
                                type="button"
                                onClick={() => setSelectedApptForEdit(a)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
                              >
                                ✏️ Sửa
                              </button>
                            ) : (
                              <span
                                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-zinc-100 text-zinc-400 select-none border border-zinc-200"
                                title="Lịch hẹn đã hoàn tất và xuất hóa đơn bàn giao xe, được khóa cứng"
                              >
                                🔒 Đã khóa
                              </span>
                            )}

                            {/* Xác nhận nếu đang chờ */}
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => updateApptStatus(a.id, 'DaXacNhan')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition"
                                >
                                  ✓ Tiếp nhận
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedApptForReject(a);
                                    setRejectReasonInput('');
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 transition"
                                >
                                  ✕ Từ chối
                                </button>
                              </>
                            )}

                            {/* Đổi trạng thái nếu không pending */}
                            {!isPending && (
                              isCompleted ? (
                                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                                  🔒 Đã hoàn tất (Khóa)
                                </span>
                              ) : (
                                <select
                                  value={a.trangThai}
                                  onChange={e => {
                                    const nextStatus = e.target.value as AppointmentStatus;
                                    if (nextStatus === 'TuChoi') {
                                      setSelectedApptForReject(a);
                                      setRejectReasonInput('');
                                    } else {
                                      updateApptStatus(a.id, nextStatus);
                                    }
                                  }}
                                  className="text-xs p-1 rounded-lg border border-zinc-200 bg-white font-mono"
                                >
                                  {apptStatuses.map(s => (
                                    <option key={s.key} value={s.key}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                              )
                            )}

                            {/* Liên hệ khách hàng */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApptForContact(a);
                                setCopiedContactMsg(false);
                              }}
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                            >
                              📞 Liên hệ
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
      )}

      {/* ── CHẾ ĐỘ 2: LỊCH BIỂU (CALENDAR VIEW) ── */}
      {apptViewMode === 'calendar' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(currentCalendarDate);
                  d.setMonth(d.getMonth() - 1);
                  setCurrentCalendarDate(d);
                }}
                className="w-8 h-8 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center font-bold"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => setCurrentCalendarDate(new Date())}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-xs font-semibold"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date(currentCalendarDate);
                  d.setMonth(d.getMonth() + 1);
                  setCurrentCalendarDate(d);
                }}
                className="w-8 h-8 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center font-bold"
              >
                ▶
              </button>
              <h3 className="ml-2 font-extrabold text-base text-zinc-900 font-mono">
                Tháng {currentCalendarDate.getMonth() + 1}, Năm {currentCalendarDate.getFullYear()}
              </h3>
            </div>
          </div>

          {/* Grid tháng */}
          <div className="grid grid-cols-7 gap-2">
            {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map(w => (
              <div key={w} className="text-center font-mono text-xs font-bold text-zinc-500 py-1 bg-zinc-50 rounded-lg">
                {w}
              </div>
            ))}

            {getMonthDaysGrid(currentCalendarDate).map((cell, idx) => {
              const dayAppts = appointments.filter(a => a.ngayHen === cell.dateStr);
              return (
                <div
                  key={idx}
                  className={`min-h-[100px] p-2 rounded-xl border transition flex flex-col justify-between ${
                    cell.isToday
                      ? 'border-red-600 bg-red-50/20'
                      : cell.isCurrentMonth
                      ? 'border-zinc-200 bg-white'
                      : 'border-zinc-100 bg-zinc-50/50 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${cell.isToday ? 'text-red-700' : 'text-zinc-700'}`}>
                      {cell.dayNum}
                    </span>
                    {dayAppts.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-zinc-950 text-white font-mono text-[9px] font-bold">
                        {dayAppts.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-y-auto max-h-[80px]">
                    {dayAppts.slice(0, 3).map(da => (
                      <div
                        key={da.id}
                        onClick={() => setSelectedApptForDetail(da)}
                        className="text-[10px] p-1 rounded bg-zinc-100 hover:bg-zinc-200 truncate cursor-pointer font-medium"
                        title={`${da.gioHen} - ${da.hoTenKH} (${da.tenXe})`}
                      >
                        <strong>{da.gioHen}</strong> {da.hoTenKH}
                      </div>
                    ))}
                    {dayAppts.length > 3 && (
                      <div className="text-[9px] text-zinc-400 font-mono text-center">+{dayAppts.length - 3} lịch khác</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL: CHI TIẾT LỊCH HẸN ── */}
      {selectedApptForDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 font-display">CHI TIẾT LỊCH HẸN #{selectedApptForDetail.id}</h3>
                <div className="text-xs text-zinc-500 font-mono">Tạo lúc: {selectedApptForDetail.createdDate || 'Gần đây'}</div>
              </div>
              <button onClick={() => setSelectedApptForDetail(null)} className="text-zinc-400 hover:text-zinc-600 font-bold text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                <div className="font-bold text-zinc-900 text-sm">{selectedApptForDetail.hoTenKH}</div>
                <div>SĐT: <strong className="font-mono text-zinc-800">{selectedApptForDetail.soDienThoai}</strong> · Mã KH: <span className="font-mono">{selectedApptForDetail.customerId}</span></div>
                <div>Phương tiện: <strong className="text-zinc-900">{selectedApptForDetail.tenXe}</strong> (Biển số: <strong className="font-mono">{selectedApptForDetail.bienSo}</strong>)</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div className="text-zinc-400 text-[10px] font-mono uppercase">Loại dịch vụ</div>
                  <div className="font-bold text-zinc-900 mt-0.5">
                    {serviceTypeConfig[selectedApptForDetail.loaiDichVu]?.label || selectedApptForDetail.loaiDichVu}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div className="text-zinc-400 text-[10px] font-mono uppercase">Thời gian đón tiếp</div>
                  <div className="font-bold text-zinc-900 font-mono mt-0.5">
                    {selectedApptForDetail.ngayHen} · <span className="text-red-700">{selectedApptForDetail.gioHen}</span>
                  </div>
                </div>
              </div>

              {selectedApptForDetail.loaiDichVu === 'NhanXe' && (
                <div className="p-3.5 rounded-2xl bg-red-50/80 border border-red-200 text-red-900 space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5 text-red-950">
                    <span>🏍️ LỊCH HẸN BÀN GIAO XE MỚI</span>
                  </div>
                  <div>Mã lịch hẹn: <strong className="font-mono text-red-700">{selectedApptForDetail.maLichHen || 'HEN-XE-8492'}</strong></div>
                  <div>Màu xe đã chọn: <strong>{selectedApptForDetail.mauXe || 'Theo đơn đặt'}</strong></div>
                  {selectedApptForDetail.soTienCoc && (
                    <div>Số tiền đã cọc: <strong className="font-mono text-emerald-800">{formatVND(selectedApptForDetail.soTienCoc)}</strong></div>
                  )}
                  {selectedApptForDetail.soKhungVIN && (
                    <div>Số VIN khung: <strong className="font-mono">{selectedApptForDetail.soKhungVIN}</strong></div>
                  )}
                </div>
              )}

              {selectedApptForDetail.ghiChu && (
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div className="text-zinc-400 text-[10px] font-mono uppercase">Ghi chú & yêu cầu</div>
                  <div className="text-zinc-700 mt-1">{selectedApptForDetail.ghiChu}</div>
                </div>
              )}

              {selectedApptForDetail.lyDoTuChoi && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800">
                  <div className="font-bold">Lý do từ chối:</div>
                  <div>{selectedApptForDetail.lyDoTuChoi}</div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              {selectedApptForDetail.loaiDichVu === 'NhanXe' && onNavigateToCreateVehicleOrder ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedApptForDetail;
                    setSelectedApptForDetail(null);
                    onNavigateToCreateVehicleOrder(target);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-red-700 text-white hover:bg-red-800 transition flex items-center gap-1.5"
                >
                  <span>⚡ Tạo hóa đơn bán xe ngay</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setSelectedApptForDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CHỈNH SỬA LỊCH HẸN ── */}
      {selectedApptForEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-extrabold text-base text-zinc-900">CHỈNH SỬA LỊCH HẸN #{selectedApptForEdit.id}</h3>
              <button onClick={() => setSelectedApptForEdit(null)} className="text-zinc-400 hover:text-zinc-600 font-bold text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-600 font-semibold mb-1">Khách hàng</label>
                <input
                  type="text"
                  value={selectedApptForEdit.hoTenKH}
                  onChange={e => setSelectedApptForEdit({ ...selectedApptForEdit, hoTenKH: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={selectedApptForEdit.soDienThoai}
                    onChange={e => setSelectedApptForEdit({ ...selectedApptForEdit, soDienThoai: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Loại dịch vụ</label>
                  <select
                    value={selectedApptForEdit.loaiDichVu}
                    onChange={e => setSelectedApptForEdit({ ...selectedApptForEdit, loaiDichVu: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 bg-white"
                  >
                    <option value="BaoDuong">Bảo dưỡng</option>
                    <option value="SuaChua">Sửa chữa</option>
                    <option value="LaiThu">Lái thử</option>
                    <option value="NhanXe">Nhận xe mới</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Ngày hẹn</label>
                  <input
                    type="date"
                    value={selectedApptForEdit.ngayHen}
                    onChange={e => setSelectedApptForEdit({ ...selectedApptForEdit, ngayHen: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Giờ hẹn</label>
                  <input
                    type="time"
                    value={selectedApptForEdit.gioHen}
                    onChange={e => setSelectedApptForEdit({ ...selectedApptForEdit, gioHen: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-600 font-semibold mb-1">Ghi chú</label>
                <textarea
                  rows={3}
                  value={selectedApptForEdit.ghiChu}
                  onChange={e => setSelectedApptForEdit({ ...selectedApptForEdit, ghiChu: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setSelectedApptForEdit(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditedAppt(selectedApptForEdit)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: TỪ CHỐI LỊCH HẸN (LH05) ── */}
      {selectedApptForReject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <h3 className="font-extrabold text-base text-red-700">TỪ CHỐI LỊCH HẸN #{selectedApptForReject.id}</h3>
            <p className="text-xs text-zinc-500">
              Vui lòng nhập lý do từ chối để hệ thống gửi thông báo phản hồi cho khách hàng <strong>{selectedApptForReject.hoTenKH}</strong>.
            </p>
            <textarea
              rows={3}
              placeholder="VD: Cửa hàng đã kín lịch khung giờ này, vui lòng chọn ngày khác..."
              value={rejectReasonInput}
              onChange={e => setRejectReasonInput(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedApptForReject(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: LIÊN HỆ KHÁCH HÀNG ── */}
      {selectedApptForContact && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="font-extrabold text-base text-zinc-900">LIÊN HỆ KHÁCH HÀNG</h3>
              <button onClick={() => setSelectedApptForContact(null)} className="text-zinc-400 font-bold">
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
              <div className="font-bold text-zinc-900 text-sm">{selectedApptForContact.hoTenKH}</div>
              <div className="font-mono text-zinc-700">SĐT: <strong>{selectedApptForContact.soDienThoai}</strong></div>
              <div>Lịch hẹn: {selectedApptForContact.ngayHen} lúc {selectedApptForContact.gioHen}</div>
            </div>

            <div className="flex flex-col gap-2">
              <a
                href={`tel:${selectedApptForContact.soDienThoai}`}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-center transition flex items-center justify-center gap-1.5"
              >
                <span>📞 Gọi điện thoại ngay</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Kính chào quý khách ${selectedApptForContact.hoTenKH}, Motoshop CRM xác nhận lịch hẹn của quý khách vào lúc ${selectedApptForContact.gioHen} ngày ${selectedApptForContact.ngayHen}. Rất hân hạnh được đón tiếp!`
                  );
                  setCopiedContactMsg(true);
                  setTimeout(() => setCopiedContactMsg(false), 3000);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition"
              >
                {copiedContactMsg ? '✓ Đã copy tin nhắn mẫu!' : '📋 Copy tin nhắn SMS xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
