import { matchVietnameseSearch } from '../../utils/vietnameseSearch';
import React, { useState, useEffect, useMemo } from 'react';
import {
  mockAppointments,
  type AppointmentStatus,
  type ServiceType,
  type Appointment,
  type AppointmentTimelineItem,
  type StaffAccount,
  formatVND,
} from '../../data/mockData';
import { appointmentApi, orderApi } from '../../services/api';

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

  // LH20: Modal Tiếp nhận & Phân công Kỹ thuật viên (Bắt buộc chọn KTV)
  const [acceptModalAppt, setAcceptModalAppt] = useState<Appointment | null>(null);
  const [assignedKtv, setAssignedKtv] = useState<string>('KTV. Trần Minh Long');
  const [assignError, setAssignError] = useState<string>('');

  // LH20: Modal Đổi KTV / Hủy lịch khi đã xác nhận
  const [changeKtvModalAppt, setChangeKtvModalAppt] = useState<Appointment | null>(null);
  const [newKtv, setNewKtv] = useState<string>('');
  const [cancelModalAppt, setCancelModalAppt] = useState<Appointment | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>('Khách hàng yêu cầu hủy lịch');

  // LH19: Toggle bộ lọc & Phân trang
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // LH21: Ràng buộc lỗi form chỉnh sửa lịch hẹn
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // LH23: Đã liên kết trực tiếp sang Trung tâm CSKH Trực tuyến (Live Chat) của AdminLayout

  // LH24: Modal Xem tất cả lịch hẹn trong 1 ngày trên Calendar
  const [selectedDayApptsModal, setSelectedDayApptsModal] = useState<{ dateStr: string; dayNum: number; appts: Appointment[] } | null>(null);

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

  // ── LH22: KIỂM SOÁT QUY TRÌNH CHUYỂN TRẠNG THÁI MỘT CHIỀU (KHÔNG CHO PHÉP QUAY LÙI) ──
  function canTransitionApptStatus(current: AppointmentStatus, target: AppointmentStatus): { allowed: boolean; message?: string } {
    if (current === target) return { allowed: true };

    if (current === 'DaHoanThanh') {
      return {
        allowed: false,
        message: 'Lịch hẹn đã hoàn thành và bàn giao xe! Hồ sơ đã khóa cứng trên hệ thống, không thể chuyển sang trạng thái khác.',
      };
    }

    if (current === 'TuChoi') {
      return {
        allowed: false,
        message: 'Lịch hẹn đã bị từ chối tiếp nhận, không thể phục hồi hoặc chuyển lùi về trạng thái trước đó.',
      };
    }

    if (current === 'DaHuy') {
      return {
        allowed: false,
        message: 'Lịch hẹn đã hủy, không thể phục hồi hoặc chuyển lùi về trạng thái trước đó.',
      };
    }

    // Đang ở "Đã xác nhận": chỉ được tiến sang "Đã hoàn thành" hoặc "Đã hủy"
    if (current === 'DaXacNhan') {
      if (target === 'DaHoanThanh' || target === 'DaHuy') {
        return { allowed: true };
      }
      return {
        allowed: false,
        message: 'Lịch hẹn đã được xác nhận tiếp nhận chỉ có thể chuyển sang "Đã hoàn thành" hoặc "Đã hủy", KHÔNG ĐƯỢC PHÉP quay lùi về "Chờ xác nhận" hoặc "Từ chối"!',
      };
    }

    // Đang ở "Chờ xác nhận": chỉ được sang "Đã xác nhận" (Tiếp nhận) hoặc "Từ chối"
    if (current === 'ChoXacNhan') {
      if (target === 'DaXacNhan' || target === 'TuChoi') {
        return { allowed: true };
      }
      return {
        allowed: false,
        message: 'Lịch hẹn đang chờ xác nhận chỉ có thể chuyển sang "Đã xác nhận" hoặc "Từ chối"!',
      };
    }

    return { allowed: false, message: 'Thao tác chuyển trạng thái không hợp lệ theo quy trình nghiệp vụ!' };
  }

  // ── LH22: KHỞI TẠO VÀ LẤY TIMELINE LỊCH HẸN ──
  function getApptTimeline(appt: Appointment): AppointmentTimelineItem[] {
    if (appt.timeline && appt.timeline.length > 0) {
      return appt.timeline;
    }
    const baseDate = appt.createdDate || '20/10/2026';
    const initial: AppointmentTimelineItem[] = [
      {
        id: 'TL-1-' + appt.id,
        trangThai: 'ChoXacNhan',
        tieuDe: 'Đặt lịch hẹn trực tuyến',
        thoiGian: `${baseDate} 08:30`,
        nguoiThucHien: appt.hoTenKH,
        ghiChu: 'Khách hàng gửi yêu cầu đặt lịch tiếp nhận phương tiện',
      },
    ];

    if (appt.trangThai === 'DaXacNhan' || appt.trangThai === 'DaHoanThanh') {
      initial.push({
        id: 'TL-2-' + appt.id,
        trangThai: 'DaXacNhan',
        tieuDe: 'Tiếp nhận lịch & Phân công KTV',
        thoiGian: `${baseDate} 09:15`,
        nguoiThucHien: 'Admin Điều phối',
        ghiChu: `Phân công kỹ thuật viên: ${appt.nhanVienPhuTrach || 'KTV. Trần Minh Long'}`,
      });
    }

    if (appt.trangThai === 'DaHoanThanh') {
      initial.push({
        id: 'TL-3-' + appt.id,
        trangThai: 'DaHoanThanh',
        tieuDe: 'Hoàn tất dịch vụ & Bàn giao xe',
        thoiGian: `${baseDate} 11:30`,
        nguoiThucHien: appt.nhanVienPhuTrach || 'KTV Phụ trách',
        ghiChu: 'Xe đã kiểm tra chất lượng và bàn giao thành công cho khách hàng',
      });
    }

    if (appt.trangThai === 'TuChoi') {
      initial.push({
        id: 'TL-reject-' + appt.id,
        trangThai: 'TuChoi',
        tieuDe: 'Từ chối tiếp nhận lịch hẹn',
        thoiGian: `${baseDate} 09:00`,
        nguoiThucHien: 'Admin Quản trị',
        ghiChu: appt.lyDoTuChoi || 'Cửa hàng kín lịch khung giờ này',
      });
    }

    if (appt.trangThai === 'DaHuy') {
      initial.push({
        id: 'TL-cancel-' + appt.id,
        trangThai: 'DaHuy',
        tieuDe: 'Hủy lịch hẹn',
        thoiGian: `${baseDate} 10:00`,
        nguoiThucHien: 'Khách hàng / Admin',
        ghiChu: 'Yêu cầu hủy lịch hẹn',
      });
    }

    return initial;
  }

  function getNowDateTimeString(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function updateApptStatus(id: string, status: AppointmentStatus, lyDoTuChoi?: string, customActor?: string, customNote?: string) {
    const targetAppt = appointments.find(a => a.id === id);
    if (targetAppt) {
      const check = canTransitionApptStatus(targetAppt.trangThai, status);
      if (!check.allowed) {
        alert(check.message);
        return;
      }
    }

    const currentTimeline = targetAppt ? getApptTimeline(targetAppt) : [];
    const newTlItem: AppointmentTimelineItem = {
      id: 'TL-' + Date.now(),
      trangThai: status,
      tieuDe:
        status === 'DaXacNhan'
          ? 'Tiếp nhận lịch & Phân công KTV'
          : status === 'DaHoanThanh'
          ? 'Hoàn tất dịch vụ & Bàn giao xe'
          : status === 'TuChoi'
          ? 'Từ chối tiếp nhận lịch hẹn'
          : status === 'DaHuy'
          ? 'Hủy lịch hẹn'
          : 'Cập nhật trạng thái',
      thoiGian: getNowDateTimeString(),
      nguoiThucHien: customActor || 'Admin Quản trị',
      ghiChu: lyDoTuChoi || customNote || undefined,
    };
    const updatedTimeline = [...currentTimeline, newTlItem];

    appointmentApi.updateStatus(id, status, lyDoTuChoi);

    // Đồng bộ trạng thái đơn hàng nếu là lịch nhận xe mới
    const targetA = appointments.find(a => a.id === id);
    if (targetA && (targetA.loaiDichVu === 'NhanXe' || targetA.maDonHangXe)) {
      const matchedO = allOrders.find(o =>
        (targetA.maDonHangXe && o.id === targetA.maDonHangXe) ||
        (targetA.maLichHen && (o.maLichHen === targetA.maLichHen || o.thongTinXe?.maLichHen === targetA.maLichHen)) ||
        (targetA.id && parseInt(o.id.replace(/\D/g, ''), 10) === parseInt(targetA.id.replace(/\D/g, ''), 10))
      );
      if (matchedO) {
        if (status === 'DaXacNhan' && (matchedO.trangThai === 'ChoDuyet' || matchedO.trangThai === 'ChoKhachXacNhanNgayNhan')) {
          orderApi.updateStatus(matchedO.id, 'ChoGiaoXe');
        } else if (status === 'DaHoanThanh' && matchedO.trangThai !== 'HoanThanh') {
          orderApi.updateStatus(matchedO.id, 'HoanThanh');
        }
      }
    }
    setAppointments(as =>
      as.map(a =>
        a.id === id
          ? { ...a, trangThai: status, timeline: updatedTimeline, ...(lyDoTuChoi ? { lyDoTuChoi } : {}) }
          : a
      )
    );
    setSelectedApptForDetail(prev =>
      prev && prev.id === id
        ? { ...prev, trangThai: status, timeline: updatedTimeline, ...(lyDoTuChoi ? { lyDoTuChoi } : {}) }
        : prev
    );
  }

  async function handleAssignTechnician(apptId: string, staffName: string) {
    await appointmentApi.assignStaff(apptId, staffName);
    const targetAppt = appointments.find(a => a.id === apptId);
    const currentTimeline = targetAppt ? getApptTimeline(targetAppt) : [];
    const newTlItem: AppointmentTimelineItem = {
      id: 'TL-' + Date.now(),
      trangThai: targetAppt?.trangThai || 'DaXacNhan',
      tieuDe: `Điều phối KTV phụ trách: ${staffName}`,
      thoiGian: getNowDateTimeString(),
      nguoiThucHien: 'Admin Điều phối',
      ghiChu: `Chuyển giao phương tiện cho ${staffName} phụ trách kỹ thuật`,
    };
    const updatedTimeline = [...currentTimeline, newTlItem];

    setAppointments(as => as.map(a => (a.id === apptId ? { ...a, nhanVienPhuTrach: staffName, timeline: updatedTimeline } : a)));
    setSelectedApptForDetail(prev => (prev && prev.id === apptId ? { ...prev, nhanVienPhuTrach: staffName, timeline: updatedTimeline } : prev));
  }

  // LH20: Xử lý Tiếp nhận (Giao tận nơi không bắt buộc chọn KTV, Nhận tại Showroom bắt buộc phân công KTV)
  async function handleConfirmAccept() {
    if (!acceptModalAppt) return;
    const isHomeDel = acceptModalAppt.hinhThucGiao === 'HomeDelivery' || acceptModalAppt.ghiChu?.includes('GIAO XE TẬN NƠI');
    const finalStaff = isHomeDel ? (assignedKtv || 'Đội vận chuyển giao tận nơi') : assignedKtv;
    if (!isHomeDel && (!assignedKtv || assignedKtv === 'Chưa phân công')) {
      setAssignError('Vui lòng chọn Kỹ thuật viên phụ trách trước khi tiếp nhận lịch hẹn!');
      return;
    }
    const check = canTransitionApptStatus(acceptModalAppt.trangThai, 'DaXacNhan');
    if (!check.allowed) {
      alert(check.message);
      return;
    }

    const currentTimeline = getApptTimeline(acceptModalAppt);
    const newTlItem: AppointmentTimelineItem = {
      id: 'TL-' + Date.now(),
      trangThai: 'DaXacNhan',
      tieuDe: isHomeDel ? 'Tiếp nhận đơn giao xe tận nơi' : `Tiếp nhận lịch & Phân công ${finalStaff}`,
      thoiGian: getNowDateTimeString(),
      nguoiThucHien: 'Admin Điều phối',
      ghiChu: isHomeDel ? 'Đã tiếp nhận lịch giao xe tận nhà cho khách hàng' : `Đã xác nhận thời gian đón tiếp và gán KTV phụ trách chính`,
    };
    const updatedTimeline = [...currentTimeline, newTlItem];

    await appointmentApi.updateStatus(acceptModalAppt.id, 'DaXacNhan');
    await appointmentApi.assignStaff(acceptModalAppt.id, finalStaff);

    // Nếu là lịch hẹn nhận xe mới, đồng bộ trạng thái đơn hàng tương ứng sang "Chờ giao xe"
    if (acceptModalAppt.loaiDichVu === 'NhanXe' || acceptModalAppt.maDonHangXe) {
      const matchedO = allOrders.find(o =>
        (acceptModalAppt.maDonHangXe && o.id === acceptModalAppt.maDonHangXe) ||
        (acceptModalAppt.maLichHen && (o.maLichHen === acceptModalAppt.maLichHen || o.thongTinXe?.maLichHen === acceptModalAppt.maLichHen)) ||
        (acceptModalAppt.id && parseInt(o.id.replace(/\D/g, ''), 10) === parseInt(acceptModalAppt.id.replace(/\D/g, ''), 10))
      );
      if (matchedO && (matchedO.trangThai === 'ChoDuyet' || matchedO.trangThai === 'ChoKhachXacNhanNgayNhan')) {
        await orderApi.updateStatus(matchedO.id, 'ChoGiaoXe');
      }
    }
    setAppointments(as =>
      as.map(a =>
        a.id === acceptModalAppt.id
          ? { ...a, trangThai: 'DaXacNhan', nhanVienPhuTrach: finalStaff, timeline: updatedTimeline }
          : a
      )
    );
    setSelectedApptForDetail(prev =>
      prev && prev.id === acceptModalAppt.id
        ? { ...prev, trangThai: 'DaXacNhan', nhanVienPhuTrach: finalStaff, timeline: updatedTimeline }
        : prev
    );
    setAcceptModalAppt(null);
    setAssignError('');
  }

  // LH20 & LH22: Đổi KTV cho lịch hẹn đã xác nhận
  async function handleConfirmChangeKtv() {
    if (!changeKtvModalAppt || !newKtv || newKtv === 'Chưa phân công') return;
    await appointmentApi.assignStaff(changeKtvModalAppt.id, newKtv);
    const currentTimeline = getApptTimeline(changeKtvModalAppt);
    const newTlItem: AppointmentTimelineItem = {
      id: 'TL-' + Date.now(),
      trangThai: changeKtvModalAppt.trangThai,
      tieuDe: `Điều phối KTV: ${newKtv}`,
      thoiGian: getNowDateTimeString(),
      nguoiThucHien: 'Admin Điều phối',
      ghiChu: `Thay đổi kỹ thuật viên phụ trách từ ${changeKtvModalAppt.nhanVienPhuTrach || 'Chưa gán'} sang ${newKtv}`,
    };
    const updatedTimeline = [...currentTimeline, newTlItem];

    setAppointments(as => as.map(a => (a.id === changeKtvModalAppt.id ? { ...a, nhanVienPhuTrach: newKtv, timeline: updatedTimeline } : a)));
    setSelectedApptForDetail(prev => (prev && prev.id === changeKtvModalAppt.id ? { ...prev, nhanVienPhuTrach: newKtv, timeline: updatedTimeline } : prev));
    setChangeKtvModalAppt(null);
  }

  // LH22: Hoàn tất dịch vụ
  function handleCompleteAppointment(id: string) {
    const target = appointments.find(a => a.id === id);
    if (!target) return;
    const check = canTransitionApptStatus(target.trangThai, 'DaHoanThanh');
    if (!check.allowed) {
      alert(check.message);
      return;
    }
    if (confirm(`Xác nhận hoàn tất dịch vụ cho lịch hẹn #${id} của khách hàng ${target.hoTenKH}?`)) {
      updateApptStatus(id, 'DaHoanThanh', undefined, target.nhanVienPhuTrach || 'KTV Phụ trách', 'Dịch vụ đã hoàn tất và kiểm tra chất lượng đạt tiêu chuẩn.');
    }
  }

  // Hủy lịch hẹn
  function handleConfirmCancel() {
    if (!cancelModalAppt) return;
    const check = canTransitionApptStatus(cancelModalAppt.trangThai, 'DaHuy');
    if (!check.allowed) {
      alert(check.message);
      return;
    }
    updateApptStatus(cancelModalAppt.id, 'DaHuy', cancelReasonInput.trim() || 'Hủy lịch', 'Khách hàng / Admin', cancelReasonInput.trim());
    setCancelModalAppt(null);
  }

  function handleConfirmReject() {
    if (!selectedApptForReject) return;
    if (!rejectReasonInput.trim()) {
      alert('Vui lòng nhập lý do từ chối lịch hẹn!');
      return;
    }
    const check = canTransitionApptStatus(selectedApptForReject.trangThai, 'TuChoi');
    if (!check.allowed) {
      alert(check.message);
      return;
    }
    updateApptStatus(selectedApptForReject.id, 'TuChoi', rejectReasonInput.trim(), 'Admin Quản trị', rejectReasonInput.trim());
    setSelectedApptForReject(null);
    setRejectReasonInput('');
  }

  // ── LH21: KIỂM TRA RÀNG BUỘC TẤT CẢ CÁC TRƯỜNG KHI CHỈNH SỬA ──
  function validateEditForm(appt: Appointment): boolean {
    const errors: Record<string, string> = {};

    // 1. Khách hàng
    if (!appt.hoTenKH || !appt.hoTenKH.trim()) {
      errors.hoTenKH = 'Vui lòng nhập họ và tên khách hàng!';
    } else if (appt.hoTenKH.trim().length < 2) {
      errors.hoTenKH = 'Họ tên khách hàng phải có tối thiểu 2 ký tự!';
    }

    // 2. Số điện thoại (10 chữ số, bắt đầu bằng 0)
    if (!appt.soDienThoai || !appt.soDienThoai.trim()) {
      errors.soDienThoai = 'Vui lòng nhập số điện thoại khách hàng!';
    } else if (!/^0\d{9}$/.test(appt.soDienThoai.trim())) {
      errors.soDienThoai = 'Số điện thoại không hợp lệ! Phải gồm 10 chữ số và bắt đầu bằng số 0.';
    }

    // 3. Thông tin xe / Phương tiện
    if (!appt.tenXe || !appt.tenXe.trim()) {
      errors.tenXe = 'Vui lòng nhập tên dòng xe / phương tiện!';
    }

    // 4. Loại dịch vụ
    if (!appt.loaiDichVu) {
      errors.loaiDichVu = 'Vui lòng chọn loại dịch vụ tiếp nhận!';
    }

    // 5. Ngày hẹn
    if (!appt.ngayHen || !appt.ngayHen.trim()) {
      errors.ngayHen = 'Vui lòng chọn ngày hẹn đón tiếp!';
    }

    // 6. Giờ hẹn (07:30 - 18:00)
    if (!appt.gioHen || !appt.gioHen.trim()) {
      errors.gioHen = 'Vui lòng chọn giờ hẹn!';
    } else if (appt.gioHen < '07:30' || appt.gioHen > '18:00') {
      errors.gioHen = 'Giờ hẹn phải nằm trong khung giờ làm việc của showroom (07:30 - 18:00)!';
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSaveEditedAppt(edited: Appointment) {
    const original = appointments.find(a => a.id === edited.id);
    if (original?.trangThai === 'DaHoanThanh') {
      alert('Lịch hẹn này đã hoàn tất và xuất hóa đơn bàn giao xe, được khóa cứng trên hệ thống không thể sửa đổi!');
      setSelectedApptForEdit(null);
      return;
    }

    // Ràng buộc tính hợp lệ trước khi lưu (LH21)
    if (!validateEditForm(edited)) {
      return;
    }

    const currentTimeline = getApptTimeline(original || edited);
    const newTlItem: AppointmentTimelineItem = {
      id: 'TL-' + Date.now(),
      trangThai: edited.trangThai,
      tieuDe: 'Chỉnh sửa thông tin lịch hẹn',
      thoiGian: getNowDateTimeString(),
      nguoiThucHien: 'Admin Quản trị',
      ghiChu: `Cập nhật: ${edited.tenXe} · ${edited.ngayHen} (${edited.gioHen})`,
    };
    const updatedWithTimeline: Appointment = {
      ...edited,
      timeline: [...currentTimeline, newTlItem],
    };

    await appointmentApi.updateDetails(edited.id, updatedWithTimeline);
    setAppointments(as => as.map(a => (a.id === edited.id ? updatedWithTimeline : a)));
    setSelectedApptForEdit(null);
    setEditErrors({});
    if (selectedApptForDetail && selectedApptForDetail.id === edited.id) {
      setSelectedApptForDetail(updatedWithTimeline);
    }
  }

  // ── LH23: KÍCH HOẠT MỞ TRUNG TÂM CSKH TRỰC TUYẾN (LIVE CHAT) TOÀN CỤC ──
  function handleOpenGlobalLiveChat(appt: Appointment) {
    setSelectedApptForContact(null);
    window.dispatchEvent(
      new CustomEvent('crm-open-admin-livechat', {
        detail: {
          customerId: appt.customerId || 'KH001',
          customerName: appt.hoTenKH,
          phone: appt.soDienThoai,
          prefillMessage: `Showroom Motoshop xin chào anh/chị ${appt.hoTenKH}. Showroom liên hệ xác nhận lịch hẹn dịch vụ #${appt.id} (${appt.gioHen} ngày ${appt.ngayHen}) cho xe ${appt.tenXe} của anh/chị ạ!`,
        },
      })
    );
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

  // LH19: Reset trang khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [apptSearch, apptStatusFilter, apptSvcFilter, apptFromDate, apptToDate]);

  const allOrders = useMemo(() => {
    try {
      return orderApi.getAllSync();
    } catch {
      return [];
    }
  }, [appointments]);

  // Filtered & Sorted Appointments (Ưu tiên cuộc hẹn 'ChoXacNhan' lên đầu danh sách)
  const filteredAppointments = useMemo(() => {
    const list = appointments.filter(a => {
      // Nghiệp vụ Lịch hẹn nhận xe mới:
      if (a.loaiDichVu === 'NhanXe') {
        if (a.trangThai === 'DaHuy') return false;
        // Chỉ ẩn khi ở tab "Tất cả dịch vụ" và chưa lọc trạng thái cụ thể
        if (apptStatusFilter === 'ALL' && apptSvcFilter === 'ALL') {
          if (a.trangThai === 'DaHoanThanh' || a.trangThai === 'HoanThanh') return false;
          const matchedOrder = allOrders.find(o =>
            (a.maDonHangXe && a.maDonHangXe === o.id) ||
            (a.maLichHen && (a.maLichHen === o.maLichHen || a.maLichHen === o.thongTinXe?.maLichHen)) ||
            (o.id && a.id && parseInt(o.id.replace(/\D/g, ''), 10) === parseInt(a.id.replace(/\D/g, ''), 10))
          );
          if (matchedOrder && (matchedOrder.trangThai === 'HoanThanh' || matchedOrder.trangThai === 'DaGiao' || matchedOrder.trangThai === 'DaHuy')) {
            return false;
          }
        }
      }

      if (apptStatusFilter !== 'ALL' && a.trangThai !== apptStatusFilter) return false;
      if (apptSvcFilter !== 'ALL' && a.loaiDichVu !== apptSvcFilter) return false;
      if (apptFromDate && a.ngayHen < apptFromDate) return false;
      if (apptToDate && a.ngayHen > apptToDate) return false;
      if (apptSearch.trim()) {
        const matchId = matchVietnameseSearch(a.id, apptSearch);
        const matchName = matchVietnameseSearch(a.hoTenKH, apptSearch);
        const matchPhone = matchVietnameseSearch(a.soDienThoai, apptSearch);
        const matchVehicle = matchVietnameseSearch(a.tenXe || '', apptSearch);
        const matchPlate = matchVietnameseSearch(a.bienSo || '', apptSearch);
        const matchLich = matchVietnameseSearch(a.maLichHen || '', apptSearch);
        if (!matchId && !matchName && !matchPhone && !matchVehicle && !matchPlate && !matchLich) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      // 1. Ưu tiên cao nhất: Chờ xác nhận (ChoXacNhan) luôn hiển thị ở đầu
      if (a.trangThai === 'ChoXacNhan' && b.trangThai !== 'ChoXacNhan') return -1;
      if (a.trangThai !== 'ChoXacNhan' && b.trangThai === 'ChoXacNhan') return 1;

      // 2. Tiếp theo: Sắp xếp theo ngày hẹn mới nhất
      if (b.ngayHen !== a.ngayHen) {
        return b.ngayHen.localeCompare(a.ngayHen);
      }
      return (b.gioHen || '').localeCompare(a.gioHen || '');
    });
  }, [appointments, apptStatusFilter, apptSvcFilter, apptFromDate, apptToDate, apptSearch, allOrders]);

  // KPI stats (chỉ đếm lịch hẹn đang hoạt động, không bao gồm lịch nhận xe đã hoàn tất)
  const activeAppts = useMemo(() => {
    return appointments.filter(a => {
      if (a.loaiDichVu === 'NhanXe') {
        if (a.trangThai === 'DaHoanThanh' || a.trangThai === 'HoanThanh' || a.trangThai === 'DaHuy') return false;
        const matchedOrder = allOrders.find(o =>
          (a.maDonHangXe && a.maDonHangXe === o.id) ||
          (a.maLichHen && (a.maLichHen === o.maLichHen || a.maLichHen === o.thongTinXe?.maLichHen)) ||
          (o.id && a.id && parseInt(o.id.replace(/\D/g, ''), 10) === parseInt(a.id.replace(/\D/g, ''), 10))
        );
        if (matchedOrder && (matchedOrder.trangThai === 'HoanThanh' || matchedOrder.trangThai === 'DaGiao' || matchedOrder.trangThai === 'DaHuy')) {
          return false;
        }
      }
      return true;
    });
  }, [appointments, allOrders]);

  const totalCount = activeAppts.length;
  const pendingCount = activeAppts.filter(a => a.trangThai === 'ChoXacNhan').length;
  const confirmedCount = activeAppts.filter(a => a.trangThai === 'DaXacNhan').length;
  const pickupCount = activeAppts.filter(a => a.loaiDichVu === 'NhanXe').length;

  // LH19: Tính toán phân trang
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAppointments.slice(start, start + pageSize);
  }, [filteredAppointments, currentPage, pageSize]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header (Chuẩn Ảnh 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-extrabold text-zinc-950 tracking-tight"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}
          >
            QUẢN LÝ LỊCH HẸN
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Theo dõi, điều phối lịch hẹn sửa chữa, bảo dưỡng, lái thử và lịch đón tiếp khách nhận xe mới tại showroom.
          </p>
        </div>

        {/* View toggle (Table vs Calendar) */}
        <div className="flex items-center gap-2">
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

      {/* ── THANH CHUYỂN TAB DỊCH VỤ CHUYÊN BIỆT (TÁCH RIÊNG TỪNG DỊCH VỤ - ÁP DỤNG CẢ DANH SÁCH & LỊCH BIỂU) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
        {[
          { key: 'ALL', label: 'Tất cả dịch vụ', icon: '📋', count: appointments.filter(a => a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
          { key: 'NhanXe', label: 'Bàn giao nhận xe mới', icon: '🎁', count: appointments.filter(a => a.loaiDichVu === 'NhanXe' && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
          { key: 'LaiThu', label: 'Lái thử xe mới', icon: '🏍️', count: appointments.filter(a => a.loaiDichVu === 'LaiThu' && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
          { key: 'BaoDuong', label: 'Bảo dưỡng định kỳ', icon: '🔧', count: appointments.filter(a => a.loaiDichVu === 'BaoDuong' && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
          { key: 'BaoHanh', label: 'Bảo hành điện tử', icon: '🛡️', count: appointments.filter(a => a.loaiDichVu === 'BaoHanh' && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
          { key: 'SuaChua', label: 'Sửa chữa phụ tùng', icon: '⚙️', count: appointments.filter(a => a.loaiDichVu === 'SuaChua' && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
        ].map(tab => {
          const isAct = apptSvcFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setApptSvcFilter(tab.key as any);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                isAct
                  ? 'bg-red-700 text-white border-red-700 shadow-sm'
                  : 'bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isAct ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── THANH TÌM KIẾM & BỘ LỌC NHANH (Chuẩn Ảnh 2) ── */}
      <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Ô tìm kiếm chính */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm tên, số điện thoại, biển số xe, mã lịch..."
              value={apptSearch}
              onChange={e => setApptSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white"
            />
            {apptSearch && (
              <button
                type="button"
                onClick={() => setApptSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Nút Bộ lọc nhanh toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              showFilters
                ? 'bg-zinc-100 text-zinc-900 border-zinc-300'
                : 'bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200'
            }`}
          >
            <span>≡</span>
            <span>Bộ lọc nhanh</span>
            <span className="text-[10px]">{showFilters ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* Khung bộ lọc mở rộng */}
        {showFilters && (
          <div className="pt-3 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in">
            {/* Loại dịch vụ */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase font-mono mb-1">Loại dịch vụ</label>
              <select
                value={apptSvcFilter}
                onChange={e => setApptSvcFilter(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white"
              >
                <option value="ALL">Tất cả loại dịch vụ</option>
                <option value="NhanXe">🎁 Bàn giao nhận xe mới</option>
                <option value="LaiThu">🏍️ Lái thử xe mới</option>
                <option value="BaoHanh">🛡️ Kiểm tra bảo hành</option>
                <option value="BaoDuong">🔧 Bảo dưỡng định kỳ</option>
              </select>
            </div>

            {/* Trạng thái */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase font-mono mb-1">Trạng thái</label>
              <select
                value={apptStatusFilter}
                onChange={e => setApptStatusFilter(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white"
              >
                <option value="ALL">Tất cả trạng thái</option>
                {apptStatuses.map(s => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Thời gian */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-zinc-500 uppercase font-mono mb-1">Khoảng thời gian hẹn</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <input
                  type="date"
                  value={apptFromDate}
                  onChange={e => setApptFromDate(e.target.value)}
                  className="px-2 py-1 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white font-mono flex-1 min-w-[120px]"
                />
                <span className="text-zinc-400 text-xs">-</span>
                <input
                  type="date"
                  value={apptToDate}
                  onChange={e => setApptToDate(e.target.value)}
                  className="px-2 py-1 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-red-600 bg-white font-mono flex-1 min-w-[120px]"
                />
                <button
                  type="button"
                  onClick={() => setQuickDate('today')}
                  className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('7days')}
                  className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold"
                >
                  7 ngày
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('all')}
                  className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold"
                >
                  Tất cả
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CHẾ ĐỘ 1: BẢNG DANH SÁCH (LH19 & LH20: 6 Cột chuẩn, không cuộn ngang, giao diện chuẩn Ảnh 2) ── */}
      {apptViewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-zinc-950 text-white">
                <th className="py-3.5 px-4 text-left text-xs font-mono font-bold tracking-wider uppercase text-white w-[20%]">KHÁCH HÀNG</th>
                <th className="py-3.5 px-4 text-center text-xs font-mono font-bold tracking-wider uppercase text-white w-[16%]">LOẠI DỊCH VỤ</th>
                <th className="py-3.5 px-4 text-left text-xs font-mono font-bold tracking-wider uppercase text-white w-[18%]">THÔNG TIN XE</th>
                <th className="py-3.5 px-4 text-left text-xs font-mono font-bold tracking-wider uppercase text-white w-[14%]">NGÀY & GIỜ HẸN</th>
                <th className="py-3.5 px-4 text-left text-xs font-mono font-bold tracking-wider uppercase text-white w-[16%]">TRẠNG THÁI</th>
                <th className="py-3.5 px-4 text-center text-xs font-mono font-bold tracking-wider uppercase text-white w-[16%]">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {paginatedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 text-sm">
                    Không tìm thấy lịch hẹn nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedAppointments.map((a: Appointment) => {
                  const isPending = a.trangThai === 'ChoXacNhan';
                  const isConfirmed = a.trangThai === 'DaXacNhan';
                  const isCompleted = a.trangThai === 'DaHoanThanh';
                  const isNhanXe = a.loaiDichVu === 'NhanXe';
                  const isHighlighted = highlightApptId === a.id;

                  return (
                    <tr
                      key={a.id}
                      id={`appt-row-${a.id}`}
                      className={`transition-all duration-300 ${
                        isHighlighted
                          ? 'bg-amber-100/95 ring-4 ring-red-600 ring-inset shadow-xl animate-pulse font-bold'
                          : 'hover:bg-zinc-50/80'
                      }`}
                    >
                      {/* 1. KHÁCH HÀNG */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-zinc-900 text-sm leading-tight">{a.hoTenKH}</div>
                        <div className="text-xs text-zinc-600 font-mono mt-0.5">{a.soDienThoai}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">#{a.id}</div>
                      </td>

                      {/* 2. LOẠI DỊCH VỤ - Chuẩn Ảnh 2 (Badge Oval bo tròn mềm mại) */}
                      <td className="py-3.5 px-4 align-middle text-center">
                        {a.loaiDichVu === 'SuaChua' && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/90 text-amber-900 border border-amber-200/60 shadow-2xs">
                            <span className="text-sm">⚙️</span>
                            <div className="text-left leading-tight">
                              <span className="text-xs font-bold block">Sửa chữa</span>
                              <span className="text-[10px] text-amber-700 block">phụ tùng</span>
                            </div>
                          </div>
                        )}
                        {a.loaiDichVu === 'BaoDuong' && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/90 text-emerald-900 border border-emerald-200/60 shadow-2xs">
                            <span className="text-sm">🔧</span>
                            <div className="text-left leading-tight">
                              <span className="text-xs font-bold block">Bảo dưỡng</span>
                              <span className="text-[10px] text-emerald-700 block">định kỳ</span>
                            </div>
                          </div>
                        )}
                        {a.loaiDichVu === 'LaiThu' && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/90 text-blue-900 border border-blue-200/60 shadow-2xs">
                            <span className="text-sm">🏍️</span>
                            <div className="text-left leading-tight">
                              <span className="text-xs font-bold block">Lái thử</span>
                              <span className="text-[10px] text-blue-700 block">xe mới</span>
                            </div>
                          </div>
                        )}
                        {a.loaiDichVu === 'NhanXe' && (
                          <div className="inline-flex flex-col items-center gap-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100/90 text-purple-900 border border-purple-200/60 shadow-2xs">
                              <span className="text-sm">🎁</span>
                              <div className="text-left leading-tight">
                                <span className="text-xs font-bold block">Bàn giao</span>
                                <span className="text-[10px] text-purple-700 block">xe mới</span>
                              </div>
                            </div>
                            {a.hinhThucGiao === 'HomeDelivery' || a.ghiChu?.includes('GIAO XE TẬN NƠI') ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold">
                                🚚 Giao tận nơi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200 text-[10px] font-bold">
                                🏢 Tại Showroom
                              </span>
                            )}
                          </div>
                        )}
                        {a.loaiDichVu === 'BaoHanh' && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100/90 text-rose-900 border border-rose-200/60 shadow-2xs">
                            <span className="text-sm">🛡️</span>
                            <div className="text-left leading-tight">
                              <span className="text-xs font-bold block">Kiểm tra</span>
                              <span className="text-[10px] text-rose-700 block">bảo hành</span>
                            </div>
                          </div>
                        )}
                        {a.loaiDichVu !== 'SuaChua' && a.loaiDichVu !== 'BaoDuong' && a.loaiDichVu !== 'LaiThu' && a.loaiDichVu !== 'NhanXe' && a.loaiDichVu !== 'BaoHanh' && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-semibold">
                            <span>📌</span> {a.loaiDichVu}
                          </div>
                        )}
                      </td>

                      {/* 3. THÔNG TIN XE */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-zinc-900 text-sm">{a.tenXe || 'Xe máy'}</div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">
                          Biển: <strong className="text-zinc-800">{a.bienSo || 'Chưa bấm biển'}</strong>
                        </div>
                        {(a.hinhThucGiao === 'HomeDelivery' || a.ghiChu?.includes('GIAO XE TẬN NƠI')) && (
                          <div className="text-[10px] text-purple-700 font-medium mt-1 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 line-clamp-1" title={a.diaChiGiao || a.ghiChu}>
                            📍 {a.diaChiGiao || 'Giao tận nơi theo địa chỉ khách'}
                          </div>
                        )}
                      </td>

                      {/* 4. NGÀY & GIỜ HẸN */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold font-mono text-zinc-900 text-xs">{a.ngayHen}</div>
                        <div className="text-xs font-mono font-bold text-red-600 mt-0.5">{a.gioHen}</div>
                      </td>

                      {/* 5. TRẠNG THÁI - Chuẩn Ảnh 2 (Hiển thị KTV khi đã xác nhận) */}
                      <td className="py-3.5 px-4 align-middle">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100/90 text-amber-800 border border-amber-200/60">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Chờ xác nhận
                          </span>
                        )}
                        {isConfirmed && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-200/60">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đã xác nhận
                            </span>
                            <div className="text-[11px] text-zinc-700 font-medium font-sans">
                              KTV: <strong className="text-zinc-950 font-bold">{a.nhanVienPhuTrach || 'Trần Minh Long'}</strong>
                            </div>
                          </div>
                        )}
                        {a.trangThai === 'TuChoi' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                            <span className="w-2 h-2 rounded-full bg-zinc-400"></span> Đã từ chối
                          </span>
                        )}
                        {a.trangThai === 'DaHuy' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100/80 text-red-700 border border-red-200">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Đã hủy
                          </span>
                        )}
                        {a.trangThai === 'DaHoanThanh' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100/80 text-blue-800 border border-blue-200">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Đã hoàn tất
                          </span>
                        )}
                      </td>

                      {/* 6. THAO TÁC - Chuẩn Ảnh 2 (LH20: Tiếp nhận mở popup chọn KTV bắt buộc) */}
                      <td className="py-3 px-4 align-middle">
                        <div className="grid grid-cols-2 gap-1.5 items-center justify-center">
                          {/* Nút Nhận xe mới / Lập đơn xe trực tiếp cho Lịch hẹn Nhận xe & Lái thử */}
                          {(isNhanXe || a.loaiDichVu === 'LaiThu') && !isCompleted && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi' && onNavigateToCreateVehicleOrder && (
                            <button
                              type="button"
                              onClick={() => onNavigateToCreateVehicleOrder(a)}
                              className="col-span-2 w-full px-2.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer mb-0.5"
                              title={isNhanXe ? "Chuyển ngay sang POS Bán Xe để bàn giao xe & hoàn tất đơn hàng" : "Chuyển sang lập đơn bán xe sau khi lái thử"}
                            >
                              <span>🎁</span> <span>{isNhanXe ? 'Nhận xe mới' : 'Lập đơn mua xe'}</span>
                            </button>
                          )}

                          {/* Trạng thái Chờ xác nhận */}
                          {isPending && (
                            <>
                              <div className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedApptForDetail(a)}
                                  className="w-full px-2 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <span>🔍</span> <span>Chi tiết</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAcceptModalAppt(a);
                                    const isHomeDel = a.hinhThucGiao === 'HomeDelivery' || a.ghiChu?.includes('GIAO XE TẬN NƠI');
                                    setAssignedKtv(isHomeDel ? 'Đội giao nhận / Vận chuyển' : 'KTV. Trần Minh Long');
                                    setAssignError('');
                                  }}
                                  className="w-full px-2 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                  title="Tiếp nhận lịch hẹn"
                                >
                                  <span>✓</span> <span>Tiếp nhận</span>
                                </button>
                                <span className="text-[9px] text-zinc-400 block text-center leading-none">
                                  {(a.hinhThucGiao === 'HomeDelivery' || a.ghiChu?.includes('GIAO XE TẬN NƠI'))
                                    ? 'Không cần KTV (Giao tận nơi)'
                                    : 'Bắt buộc chọn KTV'}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedApptForEdit(a)}
                                  className="w-full px-2 py-1 rounded-lg text-xs font-medium bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <span>✏️</span> <span>Sửa</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedApptForReject(a);
                                    setRejectReasonInput('');
                                  }}
                                  className="w-full px-2 py-1 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/60 transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <span>✕</span> <span>Từ chối</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedApptForContact(a);
                                    setCopiedContactMsg(false);
                                  }}
                                  className="w-full px-2 py-1 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <span>📞</span> <span>Liên hệ</span>
                                </button>
                              </div>
                            </>
                          )}

                          {/* Trạng thái Đã xác nhận */}
                          {isConfirmed && (
                            <>
                              <div className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedApptForDetail(a)}
                                  className="w-full px-2 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <span>🔍</span> <span>Chi tiết</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChangeKtvModalAppt(a);
                                    setNewKtv(a.nhanVienPhuTrach || 'KTV. Trần Minh Long');
                                  }}
                                  className="w-full px-2 py-1.5 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition flex items-center justify-center gap-1 cursor-pointer"
                                  title="Đổi kỹ thuật viên phụ trách hoặc sửa lịch"
                                >
                                  <span>✏️</span> <span>Đổi KTV / Sửa</span>
                                </button>
                              </div>

                              <div className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancelModalAppt(a);
                                    setCancelReasonInput('Khách hàng yêu cầu hủy lịch');
                                  }}
                                  className="w-full px-2 py-1 rounded-lg text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <span>🗑</span> <span>Hủy lịch</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedApptForContact(a);
                                    setCopiedContactMsg(false);
                                  }}
                                  className="w-full px-2 py-1 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <span>📞</span> <span>Liên hệ</span>
                                </button>
                              </div>
                            </>
                          )}

                          {/* Trạng thái Đã hoàn thành hoặc khác */}
                          {!isPending && !isConfirmed && (
                            <>
                              <div className="col-span-2 flex flex-col gap-1 items-stretch">
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedApptForDetail(a)}
                                    className="flex-1 px-2 py-1 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
                                  >
                                    🔍 Chi tiết
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedApptForContact(a);
                                      setCopiedContactMsg(false);
                                    }}
                                    className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 cursor-pointer"
                                  >
                                    📞
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Phân trang dưới bảng (LH19 & Chuẩn Ảnh 2) */}
          <div className="py-3 px-4 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-600 bg-white">
            <span className="font-mono">
              Trang <strong>{currentPage}</strong> / {totalPages} (Tổng <strong>{filteredAppointments.length}</strong> cuộc hẹn)
            </span>
            <div className="flex items-center gap-1 font-mono">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
              >
                ‹ Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-zinc-400">...</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1 rounded-lg border text-xs font-bold cursor-pointer ${
                        currentPage === p
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                          : 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
              >
                Sau ›
              </button>
            </div>
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
              // LH06: Tự động xóa/ẩn lịch hẹn đã hủy hoặc từ chối trên Calendar
              // LH12: Calendar hiển thị theo Tab dịch vụ và hiện lịch nhận xe khi đã xác nhận ngày; sau khi hoàn tất vẫn hiện nhưng làm mờ
              const dayAppts = appointments.filter(a => {
                if (a.ngayHen !== cell.dateStr) return false;
                // Áp dụng chặt chẽ theo Tab dịch vụ đang chọn
                if (apptSvcFilter !== 'ALL' && a.loaiDichVu !== apptSvcFilter) return false;
                if (a.trangThai === 'DaHuy' || a.trangThai === 'TuChoi') return false;

                // Nghiệp vụ Nhận xe mới:
                if (a.loaiDichVu === 'NhanXe') {
                  const matchedOrder = allOrders.find(o =>
                    (a.maDonHangXe && a.maDonHangXe === o.id) ||
                    (a.maLichHen && (a.maLichHen === o.maLichHen || a.maLichHen === o.thongTinXe?.maLichHen)) ||
                    (o.id && a.id && parseInt(o.id.replace(/\D/g, ''), 10) === parseInt(a.id.replace(/\D/g, ''), 10))
                  );
                  // Chỉ hiển thị trên lịch sau khi khách hàng xác nhận ngày nhận xe (đơn chuyển ChoGiaoXe, DaXacNhan, hoặc HoanThanh)
                  if (matchedOrder && (matchedOrder.trangThai === 'ChoDuyet' || matchedOrder.trangThai === 'ChoKhachXacNhanNgayNhan')) {
                    return false;
                  }
                  // Sau khi hoàn thành đơn: VẪN HIỆN LÊN LỊCH BIỂU NHƯNG LÀM MỜ
                  return true;
                }

                // Các dịch vụ khác (Bảo dưỡng, Sửa chữa, Lái thử, Bảo hành):
                if (a.trangThai !== 'DaXacNhan' && a.trangThai !== 'DaHoanThanh' && a.trangThai !== 'HoanThanh') return false;
                return true;
              });
              const hasAppts = dayAppts.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (hasAppts) {
                      setSelectedDayApptsModal({ dateStr: cell.dateStr, dayNum: cell.dayNum, appts: dayAppts });
                    }
                  }}
                  className={`min-h-[105px] p-2 rounded-xl border transition flex flex-col justify-between ${
                    cell.isToday
                      ? 'border-red-600 bg-red-50/20'
                      : cell.isCurrentMonth
                      ? 'border-zinc-200 bg-white'
                      : 'border-zinc-100 bg-zinc-50/50 opacity-40'
                  } ${hasAppts ? 'cursor-pointer hover:border-zinc-400 hover:shadow-xs' : ''}`}
                  title={hasAppts ? `Nhấn để xem toàn bộ ${dayAppts.length} lịch hẹn ngày ${cell.dateStr}` : ''}
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

                  <div className="space-y-1 mt-1 overflow-y-auto max-h-[85px]">
                    {dayAppts.slice(0, 3).map(da => {
                      const isCompleted = da.trangThai === 'DaHoanThanh' || da.trangThai === 'HoanThanh' || (
                        da.loaiDichVu === 'NhanXe' && allOrders.some(o =>
                          ((da.maDonHangXe && da.maDonHangXe === o.id) || (da.maLichHen && o.maLichHen === da.maLichHen)) &&
                          (o.trangThai === 'HoanThanh' || o.trangThai === 'DaGiao')
                        )
                      );
                      const svc = serviceTypeConfig[da.loaiDichVu] || { label: da.loaiDichVu, icon: '📌' };

                      return (
                        <div
                          key={da.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApptForDetail(da);
                          }}
                          className={`text-[10px] p-1 rounded truncate cursor-pointer font-medium transition ${
                            isCompleted
                              ? 'opacity-50 line-through bg-zinc-200/90 text-zinc-500 border border-dashed border-zinc-300'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                          }`}
                          title={`${da.gioHen} - ${da.hoTenKH} (${da.tenXe}) ${isCompleted ? '[ĐÃ HOÀN TẤT]' : ''}`}
                        >
                          <span className="mr-1">{svc.icon}</span>
                          <strong>{da.gioHen}</strong> {da.hoTenKH} {isCompleted && <span className="text-[9px] font-bold no-underline text-emerald-700 ml-1">✓</span>}
                        </div>
                      );
                    })}
                    {dayAppts.length > 3 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayApptsModal({ dateStr: cell.dateStr, dayNum: cell.dayNum, appts: dayAppts });
                        }}
                        className="w-full text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 font-mono text-center py-0.5 rounded font-bold cursor-pointer transition border border-blue-200/60 block"
                      >
                        +{dayAppts.length - 3} lịch khác (Xem hết)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL: CHI TIẾT LỊCH HẸN & TIMELINE TIẾN TRÌNH (LH22) ── */}
      {selectedApptForDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 shrink-0">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 font-display">
                  CHI TIẾT LỊCH HẸN #{selectedApptForDetail.id}
                </h3>
                <div className="text-xs text-zinc-500 font-mono">Tạo lúc: {selectedApptForDetail.createdDate || 'Gần đây'}</div>
              </div>
              <button
                onClick={() => setSelectedApptForDetail(null)}
                className="text-zinc-400 hover:text-zinc-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs overflow-y-auto pr-1 flex-1">
              {/* Thẻ khách hàng & Xe */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-zinc-900 text-sm">{selectedApptForDetail.hoTenKH}</div>
                  <StatusBadge status={selectedApptForDetail.trangThai} configs={apptStatuses} />
                </div>
                <div>
                  SĐT: <strong className="font-mono text-zinc-800">{selectedApptForDetail.soDienThoai}</strong> · Mã KH: <span className="font-mono">{selectedApptForDetail.customerId}</span>
                </div>
                <div>
                  Phương tiện: <strong className="text-zinc-900">{selectedApptForDetail.tenXe}</strong> (Biển số: <strong className="font-mono">{selectedApptForDetail.bienSo || 'Chưa bấm biển'}</strong>)
                </div>
                {selectedApptForDetail.nhanVienPhuTrach && (
                  <div>
                    Kỹ thuật viên phụ trách: <strong className="text-emerald-700 font-bold">{selectedApptForDetail.nhanVienPhuTrach}</strong>
                  </div>
                )}
              </div>

              {/* Loại dịch vụ & Thời gian */}
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
                <div className="p-3.5 rounded-2xl bg-red-50/80 border border-red-200 text-red-900 space-y-1.5">
                  <div className="font-extrabold flex items-center justify-between text-red-950">
                    <span className="flex items-center gap-1.5">🏍️ LỊCH HẸN BÀN GIAO XE MỚI</span>
                    {selectedApptForDetail.hinhThucGiao === 'HomeDelivery' || selectedApptForDetail.ghiChu?.includes('GIAO XE TẬN NƠI') ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-[11px] font-bold">
                        🚚 Giao xe tận nơi (Giao tận nhà)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-bold">
                        🏢 Nhận tại Showroom
                      </span>
                    )}
                  </div>
                  <div>Mã lịch hẹn: <strong className="font-mono text-red-700">{selectedApptForDetail.maLichHen || 'HEN-XE-8492'}</strong></div>
                  {(selectedApptForDetail.diaChiGiao || selectedApptForDetail.hinhThucGiao === 'HomeDelivery' || selectedApptForDetail.ghiChu?.includes('GIAO XE TẬN NƠI')) && (
                    <div className="p-2 rounded-xl bg-white border border-red-100 text-xs text-zinc-800">
                      📍 <strong>Địa chỉ nhận xe:</strong> {selectedApptForDetail.diaChiGiao || 'Địa chỉ đăng ký của khách hàng'}
                    </div>
                  )}
                  <div>Màu xe đã chọn: <strong>{selectedApptForDetail.mauXe || 'Theo đơn đặt'}</strong></div>
                  {selectedApptForDetail.soTienCoc && (
                    <div>Số tiền đã cọc: <strong className="font-mono text-emerald-800">{formatVND(selectedApptForDetail.soTienCoc)}</strong></div>
                  )}
                  {selectedApptForDetail.soKhungVIN && (
                    <div>Số VIN khung: <strong className="font-mono">{selectedApptForDetail.soKhungVIN}</strong></div>
                  )}
                  {onNavigateToCreateVehicleOrder &&
                    selectedApptForDetail.trangThai !== 'DaHoanThanh' &&
                    selectedApptForDetail.trangThai !== 'DaHuy' &&
                    selectedApptForDetail.trangThai !== 'TuChoi' && (
                    <div className="pt-2.5 mt-2 border-t border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-[11px] text-red-800 font-medium">
                        Bấm nút để chuyển thẳng sang quy trình POS Bán Xe và bàn giao cho khách hàng:
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const appt = selectedApptForDetail;
                          setSelectedApptForDetail(null);
                          onNavigateToCreateVehicleOrder(appt);
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-black bg-red-700 hover:bg-red-800 text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition"
                      >
                        <span>🎁</span> <span>Nhận xe mới / Lập đơn xe</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* LH27: Lịch hẹn lái thử -> Nút chuyển sang quy trình nhận xe mới */}
              {selectedApptForDetail.loaiDichVu === 'LaiThu' && onNavigateToCreateVehicleOrder && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-extrabold flex items-center gap-1.5 text-amber-900 text-xs">
                      <span>🏍️ LỊCH HẸN LÁI THỬ XE</span>
                    </div>
                    <div className="text-[11px] text-amber-800">
                      Khách hàng lái thử hài lòng và quyết định mua xe? Chuyển ngay sang quy trình tạo đơn hàng và nhận xe mới.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const appt = selectedApptForDetail;
                      setSelectedApptForDetail(null);
                      onNavigateToCreateVehicleOrder(appt);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-red-700 hover:bg-red-800 text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition"
                  >
                    <span>🎁</span> <span>Nhận xe mới / Lập đơn xe</span>
                  </button>
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

              {/* ── LH22: TIMELINE TIẾN TRÌNH & LỊCH SỬ TRẠNG THÁI ── */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-zinc-900 uppercase text-xs flex items-center gap-1.5">
                    <span>📜</span>
                    <span>Lịch sử trạng thái & Timeline tiến trình</span>
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-mono">Quy trình 1 chiều chuẩn</span>
                </div>

                <div className="relative pl-6 space-y-4 border-l-2 border-zinc-200 ml-2">
                  {getApptTimeline(selectedApptForDetail).map((item, tIdx) => {
                    const isLast = tIdx === getApptTimeline(selectedApptForDetail).length - 1;
                    const isSuccess = item.trangThai === 'DaHoanThanh';
                    const isDanger = item.trangThai === 'TuChoi' || item.trangThai === 'DaHuy';
                    const isCurrent = item.trangThai === 'DaXacNhan';

                    return (
                      <div key={item.id} className="relative group">
                        {/* Nút tròn trên trục dọc */}
                        <div
                          className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                            isSuccess
                              ? 'border-emerald-600 ring-2 ring-emerald-100 bg-emerald-600'
                              : isDanger
                              ? 'border-red-600 ring-2 ring-red-100 bg-red-600'
                              : isCurrent
                              ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-600'
                              : 'border-amber-500 bg-amber-500'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-xs ${isLast ? 'text-zinc-950 font-extrabold' : 'text-zinc-800'}`}>
                              {item.tieuDe}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">{item.thoiGian}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                            <span>Người thực hiện:</span>
                            <strong className="text-zinc-700 bg-white px-1.5 py-0.2 rounded border border-zinc-200 font-mono text-[10px]">
                              {item.nguoiThucHien}
                            </strong>
                          </div>
                          {item.ghiChu && <div className="text-[11px] text-zinc-600 italic mt-0.5">"{item.ghiChu}"</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Thao tác chuyển tiếp theo đúng quy trình (LH22) */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {selectedApptForDetail.trangThai === 'ChoXacNhan' && (
                  <button
                    type="button"
                    onClick={() => {
                      const appt = selectedApptForDetail;
                      setSelectedApptForDetail(null);
                      setAcceptModalAppt(appt);
                      setAssignedKtv('KTV. Trần Minh Long');
                      setAssignError('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>✓</span> <span>Tiếp nhận & Phân công KTV</span>
                  </button>
                )}

                {selectedApptForDetail.trangThai === 'DaXacNhan' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCompleteAppointment(selectedApptForDetail.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition cursor-pointer flex items-center gap-1"
                      title="Chuyển sang trạng thái Đã hoàn thành (Không cho phép quay lùi)"
                    >
                      <span>✓</span> <span>Hoàn tất dịch vụ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const appt = selectedApptForDetail;
                        setSelectedApptForDetail(null);
                        setCancelModalAppt(appt);
                        setCancelReasonInput('Khách hàng yêu cầu hủy lịch');
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition cursor-pointer"
                    >
                      <span>🗑 Hủy lịch</span>
                    </button>
                  </>
                )}

                {selectedApptForDetail.trangThai === 'DaHoanThanh' && (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span>🔒</span> <span>Đã hoàn tất (Khóa tiến trình)</span>
                  </span>
                )}

                {/* LH27 & NhanXe: Thao tác chuyển sang nhận xe mới ở footer */}
                {(selectedApptForDetail.loaiDichVu === 'NhanXe' || selectedApptForDetail.loaiDichVu === 'LaiThu') &&
                  selectedApptForDetail.trangThai !== 'DaHoanThanh' &&
                  selectedApptForDetail.trangThai !== 'DaHuy' &&
                  selectedApptForDetail.trangThai !== 'TuChoi' &&
                  onNavigateToCreateVehicleOrder && (
                  <button
                    type="button"
                    onClick={() => {
                      const appt = selectedApptForDetail;
                      setSelectedApptForDetail(null);
                      onNavigateToCreateVehicleOrder(appt);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-red-700 hover:bg-red-800 text-white shadow-sm transition cursor-pointer flex items-center gap-1.5"
                    title="Chuyển sang quy trình lập đơn mua xe và nhận xe mới (POS Bán Xe)"
                  >
                    <span>🎁</span> <span>Nhận xe mới</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedApptForDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CHỈNH SỬA LỊCH HẸN (LH21: RÀNG BUỘC ĐẦY ĐỦ TẤT CẢ CÁC TRƯỜNG) ── */}
      {selectedApptForEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 shrink-0">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 uppercase">
                  CHỈNH SỬA LỊCH HẸN #{selectedApptForEdit.id}
                </h3>
                <span className="text-[11px] text-zinc-400">Kiểm tra hợp lệ trước khi lưu</span>
              </div>
              <button
                onClick={() => {
                  setSelectedApptForEdit(null);
                  setEditErrors({});
                }}
                className="text-zinc-400 hover:text-zinc-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs overflow-y-auto pr-1 flex-1">
              {/* Họ tên khách hàng */}
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Họ và tên khách hàng <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Văn A"
                  value={selectedApptForEdit.hoTenKH}
                  onChange={e => {
                    setSelectedApptForEdit({ ...selectedApptForEdit, hoTenKH: e.target.value });
                    if (editErrors.hoTenKH) setEditErrors({ ...editErrors, hoTenKH: '' });
                  }}
                  className={`w-full p-2.5 rounded-xl border bg-white focus:outline-none ${
                    editErrors.hoTenKH ? 'border-red-500 ring-2 ring-red-500/20' : 'border-zinc-300 focus:border-red-600'
                  }`}
                />
                {editErrors.hoTenKH && (
                  <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                    <span>⚠️</span> {editErrors.hoTenKH}
                  </p>
                )}
              </div>

              {/* SĐT & Loại dịch vụ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-700 font-bold mb-1">
                    Số điện thoại (10 số) <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 0901234567"
                    value={selectedApptForEdit.soDienThoai}
                    onChange={e => {
                      setSelectedApptForEdit({ ...selectedApptForEdit, soDienThoai: e.target.value });
                      if (editErrors.soDienThoai) setEditErrors({ ...editErrors, soDienThoai: '' });
                    }}
                    className={`w-full p-2.5 rounded-xl border bg-white font-mono focus:outline-none ${
                      editErrors.soDienThoai ? 'border-red-500 ring-2 ring-red-500/20' : 'border-zinc-300 focus:border-red-600'
                    }`}
                  />
                  {editErrors.soDienThoai && (
                    <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                      <span>⚠️</span> {editErrors.soDienThoai}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-zinc-700 font-bold mb-1 flex items-center justify-between">
                    <span>Loại dịch vụ tiếp nhận <span className="text-red-600 font-bold">*</span></span>
                    <span className="text-[11px] font-normal text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                      🔒 Cố định theo lịch hẹn
                    </span>
                  </label>
                  {/* LH26: Không được phép chỉnh sửa loại dịch vụ của lịch hẹn */}
                  <select
                    value={selectedApptForEdit.loaiDichVu}
                    disabled
                    className="w-full p-2.5 rounded-xl border border-zinc-300 bg-zinc-100 text-zinc-600 font-semibold cursor-not-allowed shadow-inner focus:outline-none"
                    title="LH26: Loại dịch vụ được cố định từ khi đăng ký lịch hẹn, không được phép thay đổi"
                  >
                    <option value="NhanXe">🎁 Bàn giao nhận xe mới</option>
                    <option value="LaiThu">🏍️ Lái thử xe mới</option>
                    <option value="BaoHanh">🛡️ Kiểm tra bảo hành</option>
                    <option value="BaoDuong">🔧 Bảo dưỡng định kỳ</option>
                    <option value="SuaChua">⚙️ Sửa chữa phụ tùng</option>
                  </select>
                  <p className="text-[11px] text-zinc-500 mt-1 italic">
                    ℹ️ LH26: Loại dịch vụ được cố định từ lúc tạo lịch, chỉ được hiệu chỉnh thông tin khách hàng, xe và thời gian.
                  </p>
                </div>
              </div>

              {/* Thông tin xe & Biển số */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-700 font-bold mb-1">
                    Dòng xe / Phương tiện <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Honda SH 160i ABS"
                    value={selectedApptForEdit.tenXe || ''}
                    onChange={e => {
                      setSelectedApptForEdit({ ...selectedApptForEdit, tenXe: e.target.value });
                      if (editErrors.tenXe) setEditErrors({ ...editErrors, tenXe: '' });
                    }}
                    className={`w-full p-2.5 rounded-xl border bg-white focus:outline-none ${
                      editErrors.tenXe ? 'border-red-500 ring-2 ring-red-500/20' : 'border-zinc-300 focus:border-red-600'
                    }`}
                  />
                  {editErrors.tenXe && (
                    <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                      <span>⚠️</span> {editErrors.tenXe}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-zinc-700 font-bold mb-1">Biển số xe (nếu có)</label>
                  <input
                    type="text"
                    placeholder="VD: 59-P1 999.99"
                    value={selectedApptForEdit.bienSo || ''}
                    onChange={e => setSelectedApptForEdit({ ...selectedApptForEdit, bienSo: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 bg-white font-mono focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Ngày hẹn & Giờ hẹn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-700 font-bold mb-1">
                    Ngày hẹn đón tiếp <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    value={selectedApptForEdit.ngayHen}
                    onChange={e => {
                      setSelectedApptForEdit({ ...selectedApptForEdit, ngayHen: e.target.value });
                      if (editErrors.ngayHen) setEditErrors({ ...editErrors, ngayHen: '' });
                    }}
                    className={`w-full p-2.5 rounded-xl border bg-white font-mono focus:outline-none ${
                      editErrors.ngayHen ? 'border-red-500 ring-2 ring-red-500/20' : 'border-zinc-300 focus:border-red-600'
                    }`}
                  />
                  {editErrors.ngayHen && (
                    <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                      <span>⚠️</span> {editErrors.ngayHen}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-zinc-700 font-bold mb-1">
                    Giờ hẹn (07:30 - 18:00) <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    type="time"
                    value={selectedApptForEdit.gioHen}
                    onChange={e => {
                      setSelectedApptForEdit({ ...selectedApptForEdit, gioHen: e.target.value });
                      if (editErrors.gioHen) setEditErrors({ ...editErrors, gioHen: '' });
                    }}
                    className={`w-full p-2.5 rounded-xl border bg-white font-mono focus:outline-none ${
                      editErrors.gioHen ? 'border-red-500 ring-2 ring-red-500/20' : 'border-zinc-300 focus:border-red-600'
                    }`}
                  />
                  {editErrors.gioHen && (
                    <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                      <span>⚠️</span> {editErrors.gioHen}
                    </p>
                  )}
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-zinc-700 font-bold mb-1">Ghi chú & Yêu cầu của khách</label>
                <textarea
                  rows={2}
                  value={selectedApptForEdit.ghiChu}
                  onChange={e => setSelectedApptForEdit({ ...selectedApptForEdit, ghiChu: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 bg-white focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedApptForEdit(null);
                  setEditErrors({});
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditedAppt(selectedApptForEdit)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 transition cursor-pointer shadow-sm"
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

      {/* ── MODAL: LIÊN HỆ KHÁCH HÀNG (LH23: CÓ TÙY CHỌN NHẮN TIN TRỰC TIẾP TRÊN WEB) ── */}
      {selectedApptForContact && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="font-extrabold text-base text-zinc-900">LIÊN HỆ KHÁCH HÀNG</h3>
              <button
                onClick={() => setSelectedApptForContact(null)}
                className="text-zinc-400 hover:text-zinc-700 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
              <div className="font-bold text-zinc-900 text-sm">{selectedApptForContact.hoTenKH}</div>
              <div className="font-mono text-zinc-700">
                SĐT: <strong>{selectedApptForContact.soDienThoai}</strong>
              </div>
              <div>
                Lịch hẹn: <strong>{selectedApptForContact.ngayHen}</strong> lúc <strong className="text-red-700 font-mono">{selectedApptForContact.gioHen}</strong>
              </div>
              <div className="text-zinc-500">Phương tiện: {selectedApptForContact.tenXe}</div>
            </div>

            <div className="flex flex-col gap-2">
              {/* LH23: Nút Nhắn tin liên kết trực tiếp sang Trung tâm CSKH Trực tuyến (Live Chat) */}
              <button
                type="button"
                onClick={() => handleOpenGlobalLiveChat(selectedApptForContact)}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white text-center transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>💬</span>
                <span>Nhắn tin trực tiếp trên Web (Live Chat)</span>
              </button>

              <a
                href={`tel:${selectedApptForContact.soDienThoai}`}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-center transition flex items-center justify-center gap-1.5 cursor-pointer"
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
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition cursor-pointer"
              >
                {copiedContactMsg ? '✓ Đã copy tin nhắn mẫu!' : '📋 Copy tin nhắn SMS xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: TẤT CẢ LỊCH HẸN TRONG NGÀY TRÊN CALENDAR (LH24) ── */}
      {selectedDayApptsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl p-2 rounded-xl bg-red-100 text-red-700 font-bold">📅</span>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 uppercase">
                    DANH SÁCH LỊCH HẸN NGÀY {selectedDayApptsModal.dateStr}
                  </h3>
                  <div className="text-xs text-zinc-500 font-mono">
                    Tổng cộng: <strong>{selectedDayApptsModal.appts.length}</strong> cuộc hẹn tiếp nhận trong ngày
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayApptsModal(null)}
                className="text-zinc-400 hover:text-zinc-700 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Danh sách cuộn toàn bộ lịch hẹn trong ngày */}
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {selectedDayApptsModal.appts.map(a => {
                const svc = serviceTypeConfig[a.loaiDichVu] || { label: a.loaiDichVu, icon: '📌', color: '#0284c7', bg: '#e0f2fe' };
                const isCompleted = a.trangThai === 'DaHoanThanh' || a.trangThai === 'HoanThanh' || (
                  a.loaiDichVu === 'NhanXe' && allOrders.some(o =>
                    ((a.maDonHangXe && a.maDonHangXe === o.id) || (a.maLichHen && o.maLichHen === a.maLichHen)) &&
                    (o.trangThai === 'HoanThanh' || o.trangThai === 'DaGiao')
                  )
                );

                return (
                  <div
                    key={a.id}
                    className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCompleted
                        ? 'border-zinc-300 bg-zinc-100/80 opacity-60'
                        : 'border-zinc-200 bg-zinc-50/70 hover:bg-white hover:border-zinc-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-lg border font-mono font-bold text-xs ${
                          isCompleted
                            ? 'bg-zinc-200 border-zinc-300 text-zinc-600 line-through'
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          ⏰ {a.gioHen}
                        </span>
                        <span className={`font-bold text-sm ${isCompleted ? 'line-through text-zinc-600' : 'text-zinc-900'}`}>{a.hoTenKH}</span>
                        <span className="text-zinc-500 font-mono text-xs">({a.soDienThoai})</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: svc.bg, color: svc.color }}>
                          {svc.icon} {svc.label}
                        </span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Đã hoàn thành
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-600 flex items-center gap-3">
                        <span>Phương tiện: <strong className="text-zinc-800">{a.tenXe}</strong> ({a.bienSo || 'Chưa bấm biển'})</span>
                        {a.nhanVienPhuTrach && (
                          <span>KTV: <strong className="text-emerald-700 font-semibold">{a.nhanVienPhuTrach}</strong></span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const target = a;
                          setSelectedDayApptsModal(null);
                          setSelectedApptForDetail(target);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-950 text-white hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <span>🔍 Xem chi tiết</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDayApptsModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
              >
                Đóng danh sách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: TIẾP NHẬN LỊCH HẸN & PHÂN CÔNG KTV (LH20 - Bắt buộc chọn KTV) ── */}
      {acceptModalAppt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="text-xl p-2 rounded-xl bg-emerald-100 text-emerald-700">✓</span>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 uppercase">TIẾP NHẬN & PHÂN CÔNG KTV</h3>
                  <div className="text-[11px] text-zinc-500 font-mono">Phiếu #{acceptModalAppt.id} · {acceptModalAppt.ngayHen} ({acceptModalAppt.gioHen})</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAcceptModalAppt(null);
                  setAssignError('');
                }}
                className="text-zinc-400 hover:text-zinc-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Thông tin tóm tắt lịch hẹn */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Khách hàng:</span>
                <span className="font-bold text-zinc-900">{acceptModalAppt.hoTenKH} ({acceptModalAppt.soDienThoai})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Phương tiện:</span>
                <span className="font-bold text-zinc-900">{acceptModalAppt.tenXe} {acceptModalAppt.bienSo ? `(${acceptModalAppt.bienSo})` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Dịch vụ tiếp nhận:</span>
                <span className="font-bold text-red-700 uppercase">{serviceTypeConfig[acceptModalAppt.loaiDichVu]?.label || acceptModalAppt.loaiDichVu}</span>
              </div>
            </div>

            {/* Tiếp nhận: Nếu là Giao tận nơi thì không bắt buộc KTV, nếu nhận tại Showroom thì bắt buộc chọn KTV */}
            {(acceptModalAppt.hinhThucGiao === 'HomeDelivery' || acceptModalAppt.ghiChu?.includes('GIAO XE TẬN NƠI')) ? (
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 text-xs space-y-2">
                <div className="font-extrabold flex items-center gap-1.5 text-purple-900">
                  <span>🚚</span> <span>HÌNH THỨC: GIAO XE TẬN NƠI (KHÔNG CẦN KTV SHOWROOM)</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Đơn hàng giao xe tận nhà. Hệ thống tự động phân bổ cho Đội giao nhận & vận chuyển chuyên dụng mà không yêu cầu phân công Kỹ thuật viên bảo dưỡng tại showroom.
                </p>
                {acceptModalAppt.diaChiGiao && (
                  <div className="text-[11px] bg-white p-2.5 rounded-xl border border-purple-200 text-zinc-800">
                    📍 <strong>Địa chỉ giao xe:</strong> {acceptModalAppt.diaChiGiao}
                  </div>
                )}
              </div>
            ) : (
              /* Chọn Kỹ thuật viên (Bắt buộc cho Nhận tại Showroom & Dịch vụ bảo dưỡng) */
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-800 uppercase">
                  Chọn kỹ thuật viên phụ trách chuẩn bị xe (PDI) <span className="text-red-600 font-bold">*</span>:
                </label>
                <select
                  value={assignedKtv}
                  onChange={e => {
                    setAssignedKtv(e.target.value);
                    if (e.target.value && e.target.value !== 'Chưa phân công') {
                      setAssignError('');
                    }
                  }}
                  className={`w-full p-2.5 rounded-xl border text-xs bg-white font-medium focus:outline-none ${
                    assignError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-zinc-300 focus:border-red-600'
                  }`}
                >
                  <option value="">-- Vui lòng chọn kỹ thuật viên (Bắt buộc) --</option>
                  {technicianList.filter(t => t !== 'Chưa phân công').map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {assignError ? (
                  <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                    <span>⚠️</span> {assignError}
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-500 mt-1">
                    ℹ️ Lịch hẹn sau khi tiếp nhận sẽ chuyển sang trạng thái <strong>"Đã xác nhận"</strong> và gán kỹ thuật viên chuẩn bị xe PDI.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => {
                  setAcceptModalAppt(null);
                  setAssignError('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition cursor-pointer flex items-center gap-1"
              >
                <span>✓</span>
                <span>Xác nhận tiếp nhận</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ĐỔI KỸ THUẬT VIÊN PHỤ TRÁCH (LH20) ── */}
      {changeKtvModalAppt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="text-xl p-2 rounded-xl bg-amber-100 text-amber-800">✏️</span>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 uppercase">ĐỔI KỸ THUẬT VIÊN PHỤ TRÁCH</h3>
                  <div className="text-[11px] text-zinc-500 font-mono">Phiếu #{changeKtvModalAppt.id} · {changeKtvModalAppt.hoTenKH}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChangeKtvModalAppt(null)}
                className="text-zinc-400 hover:text-zinc-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
              <div>KTV hiện tại: <strong className="text-zinc-900">{changeKtvModalAppt.nhanVienPhuTrach || 'Chưa phân công'}</strong></div>
              <div>Lịch hẹn: {changeKtvModalAppt.ngayHen} lúc {changeKtvModalAppt.gioHen}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 uppercase mb-1.5">
                Chọn KTV điều phối mới:
              </label>
              <select
                value={newKtv}
                onChange={e => setNewKtv(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white font-medium focus:outline-none focus:border-red-600"
              >
                {technicianList.filter(t => t !== 'Chưa phân công').map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setChangeKtvModalAppt(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmChangeKtv}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-md transition cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: HỦY LỊCH HẸN (LH20) ── */}
      {cancelModalAppt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <h3 className="font-extrabold text-base text-red-700 uppercase">HỦY LỊCH HẸN #{cancelModalAppt.id}</h3>
            <p className="text-xs text-zinc-500">
              Xác nhận hủy lịch hẹn của khách hàng <strong>{cancelModalAppt.hoTenKH}</strong>? Lịch hẹn sẽ chuyển sang trạng thái "Đã hủy".
            </p>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Lý do hủy lịch:</label>
              <textarea
                rows={2}
                value={cancelReasonInput}
                onChange={e => setCancelReasonInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalAppt(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-700 cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow-md cursor-pointer"
              >
                Xác nhận hủy lịch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
