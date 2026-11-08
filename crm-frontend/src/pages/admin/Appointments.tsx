import { matchVietnameseSearch } from '../../utils/vietnameseSearch';
import React, { useState, useEffect, useMemo } from 'react';
import {
  mockAppointments,
  mockParts,
  mockCustomers,
  mockVehicles,
  type AppointmentStatus,
  type ServiceType,
  type Appointment,
  type AppointmentTimelineItem,
  type StaffAccount,
  type Customer,
  type Part,
  type Order,
  type OrderItem,
  formatVND,
} from '../../data/mockData';
import {
  appointmentApi,
  orderApi,
  surveyApi,
  addCustomerNotification,
  normalizeDateStr,
  catalogVehicleApi,
  DEFAULT_CATALOG_VEHICLES,
  type CatalogVehicle
} from '../../services/api';

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

export const isTestDriveAppt = (a?: Appointment | { loaiDichVu?: string } | null): boolean => {
  if (!a) return false;
  const ldv = String(a.loaiDichVu || '').toLowerCase().trim();
  return ldv === 'laithu' || ldv.includes('lái') || ldv.includes('lai') || ldv.includes('test');
};

export interface AppointmentsPageProps {
  currentStaff?: StaffAccount | null;
  onNavigateToCreateVehicleOrder?: (appt: Appointment) => void;
  moduleType?: 'calendar' | 'maintenance' | 'test-drives' | 'all';
}

export default function AppointmentsPage({
  currentStaff,
  onNavigateToCreateVehicleOrder,
  moduleType = 'all',
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
  const [apptViewMode, setApptViewMode] = useState<'table' | 'calendar'>(moduleType === 'calendar' ? 'calendar' : 'table');
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());

  // Lái thử vãng lai tại Showroom: Modal tạo hóa đơn / ghi nhận khách vãng lai
  const [showWalkInTestDriveModal, setShowWalkInTestDriveModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    hoTenKH: '',
    soDienThoai: '',
    tenXe: 'Honda SH 160i ABS 2025',
    nhanVienPhuTrach: currentStaff?.hoTen || 'Trần Văn Quản Lý',
    soGPLX: '',
    ghiChu: 'Khách hàng vãng lai trực tiếp tại Showroom đăng ký lái thử',
  });
  const [walkInErrors, setWalkInErrors] = useState<Record<string, string>>({});

  const testDriveVehicles = useMemo(() => {
    try {
      const list = catalogVehicleApi.getAllSync();
      if (list && list.length > 0) return list.filter(v => v.coTheLaiThu !== false && v.trangThaiHienThi !== 'An');
    } catch {}
    return DEFAULT_CATALOG_VEHICLES.filter(v => v.coTheLaiThu !== false && v.trangThaiHienThi !== 'An');
  }, []);

  // ── FIX 104: TẠO HÓA ĐƠN DỊCH VỤ (BẢO DƯỠNG & SỬA CHỮA) CHUẨN 4 MOCKUP ──
  const [showServiceInvoiceModal, setShowServiceInvoiceModal] = useState<boolean>(false);
  const [activeInvoiceType, setActiveInvoiceType] = useState<'BaoDuong' | 'SuaChua'>('BaoDuong');
  const [invoiceSourceAppt, setInvoiceSourceAppt] = useState<Appointment | null>(null);

  // Thông tin khách hàng & xe
  const [isNewCustomerMode, setIsNewCustomerMode] = useState<boolean>(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [invoiceCustomerId, setInvoiceCustomerId] = useState<string>('');
  const [invoiceCustomerName, setInvoiceCustomerName] = useState<string>('');
  const [invoicePhone, setInvoicePhone] = useState<string>('');
  const [invoiceVehicleName, setInvoiceVehicleName] = useState<string>('Honda Vision 2024');
  const [invoiceLicensePlate, setInvoiceLicensePlate] = useState<string>('59-A1 888.88');
  const [invoiceDiagnosis, setInvoiceDiagnosis] = useState<string>('');

  // Gói bảo dưỡng
  const maintenancePackagesList = useMemo(() => [
    { id: 'PKG-STANDARD', tenGoi: 'Gói Tiêu Chuẩn (Cấp 1)', gia: 150000, moTa: 'Thay nhớt, kiểm tra bugi, áp suất lốp, phanh cơ bản' },
    { id: 'PKG-ADVANCED', tenGoi: 'Gói Chuyên Sâu (Cấp 2)', gia: 350000, moTa: 'Bao gồm Cấp 1 + Vệ sinh kim phun, bộ nồi, lọc gió' },
    { id: 'PKG-VIP', tenGoi: 'Gói Toàn Diện VIP (Cấp 3)', gia: 650000, moTa: 'Bao gồm Cấp 2 + Súc buồng đốt, tra mỡ toàn bộ 18 hạng mục' },
    { id: 'PKG-SPA', tenGoi: 'Gói Spa Chăm Sóc Toàn Diện', gia: 120000, moTa: 'Rửa xe bọt tuyết, dưỡng dàn áo bóng sơn, vệ sinh chi tiết' },
    { id: 'PKG-2YEAR', tenGoi: 'Gói Bảo Dưỡng Toàn Diện (2 Năm)', gia: 600000, moTa: 'Gói chăm sóc toàn diện 2 năm chuẩn hãng' },
  ], []);
  const [invoiceMaintenancePackage, setInvoiceMaintenancePackage] = useState(maintenancePackagesList[4]);
  const [showPackageSelector, setShowPackageSelector] = useState<boolean>(false);

  // Phụ tùng phát sinh / thay thế
  const [partSearchQuery, setPartSearchQuery] = useState<string>('');
  const [invoiceParts, setInvoiceParts] = useState<Array<{
    id: string;
    partId?: string;
    sku: string;
    tenSanPham: string;
    soLuong: number;
    donGia: number;
    hinhAnh?: string;
  }>>([]);

  // Tiền công thợ (Cho Sửa chữa)
  const [invoiceLaborFees, setInvoiceLaborFees] = useState<Array<{
    id: string;
    noiDung: string;
    tienCong: number;
  }>>([
    { id: 'LB-1', noiDung: 'Công vá/thay ruột, thay má phanh', tienCong: 100000 }
  ]);

  // Modal in hóa đơn (Print Receipt Modal)
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [printReceiptData, setPrintReceiptData] = useState<any>(null);

  // Load appointments from API / storage
  useEffect(() => {
    let isMounted = true;
    const loadData = () => {
      appointmentApi.getAll().then(data => {
        if (isMounted && data && data.length > 0) {
          let ktvMap: Record<string, any> = {};
          try {
            const raw = localStorage.getItem('crm_order_ktv_map');
            if (raw) ktvMap = JSON.parse(raw);
          } catch {}

          const resolved = data.map(a => {
            if (a.loaiDichVu === 'NhanXe' || a.maDonHangXe) {
              const oId = a.maDonHangXe || (a.ghiChu?.match(/#([A-Za-z0-9-]+)/)?.[1]);
              const numId = oId ? oId.replace(/\D/g, '') : '';
              const mapped = oId ? (ktvMap[oId]?.hoTen || (numId ? ktvMap[numId]?.hoTen : undefined)) : undefined;
              if (mapped && (!a.nhanVienPhuTrach || a.nhanVienPhuTrach.includes('Showroom') || a.nhanVienPhuTrach === 'Chưa phân công')) {
                return { ...a, nhanVienPhuTrach: mapped };
              }
            }
            return a;
          });
          setAppointments(resolved);
        }
      });
    };

    loadData();

    const handleRefresh = (e: any) => {
      const isStorage = e instanceof StorageEvent || Boolean(e?.key);
      if (isStorage) {
        if (!e.key || e.key.includes('appointment') || e.key.includes('order') || e.key.includes('notif')) {
          loadData();
        }
        return;
      }
      const type = e?.detail?.type;
      if (!type || type.includes('appointment') || type.includes('order') || type.includes('notif')) {
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

  // Tự động reset và cố định bộ lọc khi chuyển sang phân hệ Lái thử xe
  useEffect(() => {
    if (moduleType === 'test-drives') {
      setApptSvcFilter('ALL');
    }
  }, [moduleType]);

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
      if (!data || (data.page !== 'appointments' && data.page !== 'test-drives' && data.page !== 'calendar' && data.page !== 'maintenance')) return;

      const targetId = (data.targetId || '').trim();
      const keyword = (data.keyword || '').trim();

      const match = appointments.find(a =>
        (targetId && a.id.toLowerCase() === targetId.toLowerCase()) ||
        (keyword && (a.id.toLowerCase().includes(keyword.toLowerCase()) || a.hoTenKH.toLowerCase().includes(keyword.toLowerCase())))
      );

      const targetAppt = match || (targetId ? appointments.find(a => a.id === targetId) : undefined);

      if (targetAppt) {
        if (moduleType !== 'calendar') setApptViewMode('table');
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
        if (moduleType !== 'calendar') setApptViewMode('table');
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

    // Đang ở "Đã xác nhận": chỉ được tiến sang "Đã hoàn thành", "Đã hủy", hoặc "DangThucHien" (Khách đã đến)
    if (current === 'DaXacNhan') {
      if (target === 'DaHoanThanh' || target === 'DaHuy' || target === 'DangThucHien' || (target as any) === 'KhachDaDen') {
        return { allowed: true };
      }
      return {
        allowed: false,
        message: 'Lịch hẹn đã được xác nhận tiếp nhận chỉ có thể chuyển sang "Đã hoàn thành", "Đã hủy" hoặc "Khách đã đến", KHÔNG ĐƯỢC PHÉP quay lùi về "Chờ xác nhận" hoặc "Từ chối"!',
      };
    }

    if (current === 'DangThucHien' || (current as any) === 'KhachDaDen') {
      if (target === 'DaHoanThanh' || target === 'DaHuy') {
        return { allowed: true };
      }
      return {
        allowed: false,
        message: 'Xe đang thực hiện tại xưởng dịch vụ chỉ có thể chuyển sang "Đã hoàn thành" hoặc "Đã hủy"!',
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

  // Ghi nhận và tạo hóa đơn cho khách hàng vãng lai lái thử trực tiếp tại Showroom
  const handleSaveWalkInTestDrive = (proceedToInvoice = false) => {
    const errs: Record<string, string> = {};
    if (!walkInForm.hoTenKH.trim()) {
      errs.hoTenKH = 'Vui lòng nhập họ và tên khách hàng!';
    }
    const cleanPhone = walkInForm.soDienThoai.replace(/\D/g, '');
    if (!cleanPhone) {
      errs.soDienThoai = 'Vui lòng nhập số điện thoại!';
    } else if (cleanPhone.length !== 10 || !cleanPhone.startsWith('0')) {
      errs.soDienThoai = 'Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0!';
    }

    if (Object.keys(errs).length > 0) {
      setWalkInErrors(errs);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toTimeString().slice(0, 5);
    const newId = `LH-VL-${Date.now().toString().slice(-4)}`;

    const newAppt: Appointment = {
      id: newId,
      customerId: 'KH-VANGLAI',
      hoTenKH: walkInForm.hoTenKH.trim(),
      soDienThoai: cleanPhone,
      loaiDichVu: 'LaiThu',
      tenXe: walkInForm.tenXe,
      bienSo: 'XE-LAI-THU',
      ngayHen: todayStr,
      gioHen: nowTimeStr,
      trangThai: 'DaXacNhan',
      nhanVienPhuTrach: walkInForm.nhanVienPhuTrach || currentStaff?.hoTen || 'Trần Văn Quản Lý',
      ghiChu: `${walkInForm.ghiChu.trim()}${walkInForm.soGPLX ? ` (GPLX: ${walkInForm.soGPLX.trim()})` : ''} - [Khách vãng lai tại Showroom]`,
      createdDate: todayStr,
    };

    appointmentApi.create(newAppt);
    setAppointments(prev => [newAppt, ...prev]);
    setShowWalkInTestDriveModal(false);

    if (proceedToInvoice && onNavigateToCreateVehicleOrder) {
      onNavigateToCreateVehicleOrder(newAppt);
    }
  };

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
    const cancelReason = cancelReasonInput.trim() || 'Nhân viên showroom hủy lịch';
    updateApptStatus(cancelModalAppt.id, 'DaHuy', cancelReason, 'Nhân viên Showroom', cancelReason);
    setCancelModalAppt(null);

    // Đồng bộ tức thì thông báo sang trang người dùng
    window.dispatchEvent(new CustomEvent('crm-customer-notification', {
      detail: { customerId: cancelModalAppt.customerId, apptId: cancelModalAppt.id, status: 'DaHuy' }
    }));
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'appointment_updated' } }));
  }

  // ── FIX 104: XỬ LÝ "KHÁCH ĐÃ ĐẾN" VÀ "KHÁCH KHÔNG ĐẾN" ──
  function handleCustomerArrived(a: Appointment) {
    const currentTimeline = getApptTimeline(a);
    const newTlItem: AppointmentTimelineItem = {
      id: 'TL-' + Date.now(),
      trangThai: 'DangThucHien',
      tieuDe: 'Khách hàng đã đến showroom',
      thoiGian: getNowDateTimeString(),
      nguoiThucHien: currentStaff?.hoTen || 'Lễ tân / Tiếp nhận dịch vụ',
      ghiChu: `Khách hàng ${a.hoTenKH} đã mang xe ${a.tenXe} (${a.bienSo}) đến quầy tiếp nhận dịch vụ.`,
    };
    const updated = {
      ...a,
      khachDaDen: true,
      trangThai: 'DangThucHien' as AppointmentStatus,
      timeline: [...currentTimeline, newTlItem],
    };
    appointmentApi.updateStatus(a.id, 'DangThucHien' as any);
    setAppointments(as => as.map(item => item.id === a.id ? updated : item));
    setSelectedApptForDetail(prev => prev?.id === a.id ? updated : prev);
  }

  function handleCustomerNoShow(a: Appointment) {
    if (!confirm(`Xác nhận khách hàng "${a.hoTenKH}" không đến showroom theo lịch hẹn #${a.id}?`)) return;
    const currentTimeline = getApptTimeline(a);
    const newTlItem: AppointmentTimelineItem = {
      id: 'TL-' + Date.now(),
      trangThai: 'DaHuy',
      tieuDe: 'Khách không đến theo lịch hẹn',
      thoiGian: getNowDateTimeString(),
      nguoiThucHien: currentStaff?.hoTen || 'Admin',
      ghiChu: 'Khách hàng vắng mặt, cuộc hẹn tự động chuyển sang trạng thái Đã hủy.',
    };
    updateApptStatus(a.id, 'DaHuy', 'Khách không đến theo lịch hẹn', currentStaff?.hoTen, 'Khách hàng không đến theo lịch hẹn đã xác nhận');
  }

  // ── FIX 104 & FIX 105: MỞ MODAL TẠO HÓA ĐƠN DỊCH VỤ TỪ LỊCH HẸN HOẶC BÊN NGOÀI ──
  function handleOpenInvoiceModalForAppt(a: Appointment) {
    const isRepair = a.loaiDichVu === 'SuaChua';
    setActiveInvoiceType(isRepair ? 'SuaChua' : 'BaoDuong');
    setInvoiceSourceAppt(a);
    setIsNewCustomerMode(false);
    setCustomerSearchQuery(a.hoTenKH);
    setInvoiceCustomerId(a.customerId || '');
    setInvoiceCustomerName(a.hoTenKH);
    setInvoicePhone(a.soDienThoai);
    setInvoiceVehicleName(a.tenXe || 'Honda Vision 2024');
    setInvoiceLicensePlate(a.bienSo || '59-A1 888.88');
    setInvoiceDiagnosis(a.ghiChu || '');

    // Nhận diện gói bảo dưỡng chính xác theo ghi chú lịch hẹn (tiêu chuẩn / chuyên sâu / VIP / Spa / 2 năm)
    const noteLower = (a.ghiChu || '').toLowerCase();
    let matchedPkg = maintenancePackagesList[0];
    if (noteLower.includes('tiêu chuẩn') || noteLower.includes('tieu chuan') || noteLower.includes('cấp 1') || noteLower.includes('150.000') || noteLower.includes('150000')) {
      matchedPkg = maintenancePackagesList.find(p => p.id === 'PKG-STANDARD') || maintenancePackagesList[0];
    } else if (noteLower.includes('chuyên sâu') || noteLower.includes('chuyen sau') || noteLower.includes('cấp 2') || noteLower.includes('350.000') || noteLower.includes('350000')) {
      matchedPkg = maintenancePackagesList.find(p => p.id === 'PKG-ADVANCED') || maintenancePackagesList[1];
    } else if (noteLower.includes('toàn diện vip') || noteLower.includes('toan dien vip') || noteLower.includes('cấp 3') || noteLower.includes('650.000') || noteLower.includes('650000')) {
      matchedPkg = maintenancePackagesList.find(p => p.id === 'PKG-VIP') || maintenancePackagesList[2];
    } else if (noteLower.includes('spa') || noteLower.includes('chăm sóc') || noteLower.includes('120.000') || noteLower.includes('120000')) {
      matchedPkg = maintenancePackagesList.find(p => p.id === 'PKG-SPA') || maintenancePackagesList[3];
    } else if (noteLower.includes('2 năm') || noteLower.includes('600.000') || noteLower.includes('600000')) {
      matchedPkg = maintenancePackagesList.find(p => p.id === 'PKG-2YEAR') || maintenancePackagesList[4];
    } else {
      const matchPkg = maintenancePackagesList.find(p => noteLower.includes(p.tenGoi.toLowerCase()) || noteLower.includes(p.id.toLowerCase()));
      if (matchPkg) matchedPkg = matchPkg;
    }
    setInvoiceMaintenancePackage(matchedPkg);
    setShowPackageSelector(false);

    // Bóc tách phụ tùng đã chọn từ ghi chú hoặc mặc định theo loại
    const initialParts: Array<{
      id: string;
      partId?: string;
      sku: string;
      tenSanPham: string;
      soLuong: number;
      donGia: number;
      hinhAnh?: string;
    }> = [];

    mockParts.forEach(mp => {
      const partSku = (mp as any).maSKU || '';
      if (noteLower.includes(mp.tenSanPham.toLowerCase()) || (partSku && noteLower.includes(partSku.toLowerCase()))) {
        initialParts.push({
          id: mp.id,
          partId: mp.id,
          sku: (mp as any).maSKU || mp.id,
          tenSanPham: mp.tenSanPham,
          soLuong: 1,
          donGia: mp.giaKhuyenMai ?? mp.giaGoc,
          hinhAnh: mp.hinhAnh,
        });
      }
    });

    if (initialParts.length === 0) {
      if (isRepair) {
        // Mặc định cho sửa chữa theo mockup: Ruột xe [Săm] IRC 14 inch (90k) & Bố thắng Vision (150k)
        const partIrc = mockParts.find(p => p.id === 'PT-IRC14' || p.tenSanPham.includes('Ruột xe') || p.tenSanPham.includes('Săm'));
        const partBt = mockParts.find(p => p.id === 'PT-BTVS' || p.tenSanPham.includes('Bố thắng') || p.tenSanPham.includes('Má phanh'));
        if (partIrc) {
          initialParts.push({
            id: partIrc.id,
            partId: partIrc.id,
            sku: (partIrc as any).maSKU || 'IRC-14-R',
            tenSanPham: partIrc.tenSanPham,
            soLuong: 1,
            donGia: partIrc.giaKhuyenMai ?? partIrc.giaGoc,
            hinhAnh: partIrc.hinhAnh,
          });
        }
        if (partBt) {
          initialParts.push({
            id: partBt.id,
            partId: partBt.id,
            sku: (partBt as any).maSKU || 'BT-VS-TR',
            tenSanPham: partBt.tenSanPham,
            soLuong: 1,
            donGia: partBt.giaKhuyenMai ?? partBt.giaGoc,
            hinhAnh: partBt.hinhAnh,
          });
        }
      } else {
        // Mặc định cho bảo dưỡng: Nhớt Motul 300V (350k)
        const partMotul = mockParts.find(p => p.id === 'PT-MT300V' || p.tenSanPham.includes('Motul 300V'));
        if (partMotul) {
          initialParts.push({
            id: partMotul.id,
            partId: partMotul.id,
            sku: (partMotul as any).maSKU || 'MT300V',
            tenSanPham: partMotul.tenSanPham,
            soLuong: 1,
            donGia: partMotul.giaKhuyenMai ?? partMotul.giaGoc,
            hinhAnh: partMotul.hinhAnh,
          });
        }
      }
    }

    setInvoiceParts(initialParts);
    setPartSearchQuery('');

    if (isRepair) {
      setInvoiceLaborFees([
        { id: 'LB-1', noiDung: 'Công vá/thay ruột, thay má phanh', tienCong: 100000 }
      ]);
    } else {
      setInvoiceLaborFees([]);
    }

    setShowServiceInvoiceModal(true);
  }

  function handleOpenOutsideInvoiceModal(type: 'BaoDuong' | 'SuaChua') {
    setActiveInvoiceType(type);
    setInvoiceSourceAppt(null);
    setIsNewCustomerMode(false);
    setCustomerSearchQuery('');
    setInvoiceCustomerId('KH001');
    setInvoiceCustomerName('Nguyễn Văn A');
    setInvoicePhone('0909123456');
    setInvoiceVehicleName('Honda Vision 2024');
    setInvoiceLicensePlate('59-A1 888.88');
    setInvoiceDiagnosis(type === 'SuaChua' ? 'Lủng lốp sau, má phanh mòn kêu xẹt xẹt khi bóp...' : '');

    const defaultPkg = maintenancePackagesList.find(p => p.id === 'PKG-2YEAR') || maintenancePackagesList[0];
    setInvoiceMaintenancePackage(defaultPkg);
    setShowPackageSelector(false);

    const initialParts: Array<{
      id: string;
      partId?: string;
      sku: string;
      tenSanPham: string;
      soLuong: number;
      donGia: number;
      hinhAnh?: string;
    }> = [];

    if (type === 'SuaChua') {
      const partIrc = mockParts.find(p => p.id === 'PT-IRC14' || p.tenSanPham.includes('Ruột xe') || p.tenSanPham.includes('Săm'));
      const partBt = mockParts.find(p => p.id === 'PT-BTVS' || p.tenSanPham.includes('Bố thắng') || p.tenSanPham.includes('Má phanh'));
      if (partIrc) {
        initialParts.push({
          id: partIrc.id,
          partId: partIrc.id,
          sku: (partIrc as any).maSKU || 'IRC-14-R',
          tenSanPham: partIrc.tenSanPham,
          soLuong: 1,
          donGia: partIrc.giaKhuyenMai ?? partIrc.giaGoc,
          hinhAnh: partIrc.hinhAnh,
        });
      }
      if (partBt) {
        initialParts.push({
          id: partBt.id,
          partId: partBt.id,
          sku: (partBt as any).maSKU || 'BT-VS-TR',
          tenSanPham: partBt.tenSanPham,
          soLuong: 1,
          donGia: partBt.giaKhuyenMai ?? partBt.giaGoc,
          hinhAnh: partBt.hinhAnh,
        });
      }
      setInvoiceLaborFees([
        { id: 'LB-1', noiDung: 'Công vá/thay ruột, thay má phanh', tienCong: 100000 }
      ]);
    } else {
      const partMotul = mockParts.find(p => p.id === 'PT-MT300V' || p.tenSanPham.includes('Motul 300V'));
      if (partMotul) {
        initialParts.push({
          id: partMotul.id,
          partId: partMotul.id,
          sku: (partMotul as any).maSKU || 'MT300V',
          tenSanPham: partMotul.tenSanPham,
          soLuong: 1,
          donGia: partMotul.giaKhuyenMai ?? partMotul.giaGoc,
          hinhAnh: partMotul.hinhAnh,
        });
      }
      setInvoiceLaborFees([]);
    }

    setInvoiceParts(initialParts);
    setPartSearchQuery('');
    setShowServiceInvoiceModal(true);
  }

  function handleSelectCustomer(c: Customer) {
    setInvoiceCustomerId(c.id);
    setInvoiceCustomerName(c.hoTen);
    setInvoicePhone(c.soDienThoai);
    const userVehicles = mockVehicles.filter(v => v.customerId === c.id);
    const bike = userVehicles[0]?.tenXe || (c as any).danhSachXe?.[0]?.tenXe || (c as any).xeDangDung || 'Honda Vision 2024';
    const plate = userVehicles[0]?.bienSo || (c as any).danhSachXe?.[0]?.bienSo || '59-A1 888.88';
    setInvoiceVehicleName(bike);
    setInvoiceLicensePlate(plate);
    setCustomerSearchQuery(c.hoTen);
  }

  function handleAddPartToInvoice(part: Part) {
    setInvoiceParts(prev => {
      const existing = prev.find(p => p.id === part.id);
      if (existing) {
        return prev.map(p => p.id === part.id ? { ...p, soLuong: p.soLuong + 1 } : p);
      }
      return [...prev, {
        id: part.id,
        partId: part.id,
        sku: (part as any).maSKU || part.id,
        tenSanPham: part.tenSanPham,
        soLuong: 1,
        donGia: part.giaKhuyenMai ?? part.giaGoc,
        hinhAnh: part.hinhAnh,
      }];
    });
    setPartSearchQuery('');
  }

  function handleAddCustomPart(name: string, price = 100000) {
    const cleanName = name.trim() || 'Phụ tùng phát sinh khác';
    const customId = 'PT-CUSTOM-' + Date.now().toString().slice(-4);
    setInvoiceParts(prev => [
      ...prev,
      {
        id: customId,
        sku: 'SKU-CUSTOM',
        tenSanPham: cleanName,
        soLuong: 1,
        donGia: price,
        hinhAnh: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80',
      }
    ]);
    setPartSearchQuery('');
  }

  function handleAddLaborFee() {
    setInvoiceLaborFees(prev => [
      ...prev,
      {
        id: 'LB-' + Date.now(),
        noiDung: 'Công thợ kỹ thuật bổ sung',
        tienCong: 50000,
      }
    ]);
  }

  const invoicePartsTotal = useMemo(() => {
    return invoiceParts.reduce((sum, p) => sum + p.donGia * p.soLuong, 0);
  }, [invoiceParts]);

  const invoiceLaborTotal = useMemo(() => {
    return invoiceLaborFees.reduce((sum, lb) => sum + lb.tienCong, 0);
  }, [invoiceLaborFees]);

  const serviceInvoiceTotal = useMemo(() => {
    if (activeInvoiceType === 'BaoDuong') {
      return (invoiceMaintenancePackage?.gia || 0) + invoicePartsTotal;
    }
    return invoicePartsTotal + invoiceLaborTotal;
  }, [activeInvoiceType, invoiceMaintenancePackage, invoicePartsTotal, invoiceLaborTotal]);

  const matchedCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return [];
    const q = customerSearchQuery.toLowerCase();
    const all = mockCustomers || [];
    return all.filter(c =>
      c.hoTen.toLowerCase().includes(q) ||
      c.soDienThoai.includes(q)
    ).slice(0, 5);
  }, [customerSearchQuery]);

  async function handleSaveAndPrintServiceInvoice() {
    if (!invoiceCustomerName.trim()) {
      alert('Vui lòng nhập họ tên khách hàng!');
      return;
    }
    if (!invoicePhone.trim()) {
      alert('Vui lòng nhập số điện thoại khách hàng!');
      return;
    }

    const invoiceId = `HD-DV-${Math.floor(100000 + Math.random() * 900000)}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const targetCust = mockCustomers.find(c =>
      c.id === invoiceCustomerId ||
      (invoicePhone && c.soDienThoai === invoicePhone) ||
      (invoiceCustomerName && c.hoTen.toLowerCase() === invoiceCustomerName.toLowerCase())
    );
    const targetCustomerId = targetCust?.id || invoiceCustomerId || invoiceSourceAppt?.customerId || 'KH001';

    const orderItems: OrderItem[] = [];
    if (activeInvoiceType === 'BaoDuong') {
      orderItems.push({
        tenSanPham: invoiceMaintenancePackage.tenGoi,
        soLuong: 1,
        donGia: invoiceMaintenancePackage.gia,
      });
    }
    invoiceParts.forEach(p => {
      orderItems.push({
        tenSanPham: p.tenSanPham,
        soLuong: p.soLuong,
        donGia: p.donGia,
        partId: p.partId,
        hinhAnh: p.hinhAnh,
      });
    });
    if (activeInvoiceType === 'SuaChua') {
      invoiceLaborFees.forEach(lb => {
        orderItems.push({
          tenSanPham: `[Công thợ] ${lb.noiDung}`,
          soLuong: 1,
          donGia: lb.tienCong,
        });
      });
    }

    const newOrder: Order = {
      id: invoiceId,
      customerId: targetCustomerId,
      hoTenKH: invoiceCustomerName,
      soDienThoai: invoicePhone,
      ngayDat: todayStr,
      trangThai: 'HoanThanh',
      trangThaiThanhToan: 'DaThanhToan',
      kenhBan: 'TaiQuay',
      loaiDon: 'DichVu',
      tongTien: serviceInvoiceTotal,
      diaChiGiao: 'Tại quầy Showroom Motoshop',
      items: orderItems,
      ghiChu: activeInvoiceType === 'BaoDuong'
        ? `Hóa đơn bảo dưỡng xe: ${invoiceVehicleName} (${invoiceLicensePlate}) - ${invoiceMaintenancePackage.tenGoi}`
        : `Hóa đơn sửa chữa xe: ${invoiceVehicleName} (${invoiceLicensePlate}) - Yêu cầu: ${invoiceDiagnosis || 'Khắc phục sự cố'}`,
      thongTinXe: {
        tenXe: invoiceVehicleName,
        bienSo: invoiceLicensePlate,
        checklist: {} as any,
      } as any,
      maLichHen: invoiceSourceAppt ? invoiceSourceAppt.id : undefined,
      nhanVienPhuTrach: invoiceSourceAppt?.nhanVienPhuTrach || currentStaff?.hoTen || 'KTV. Trần Minh Long',
      tenNV: invoiceSourceAppt?.nhanVienPhuTrach || currentStaff?.hoTen || 'KTV. Trần Minh Long',
    };

    try {
      const existingRaw = localStorage.getItem('crm_orders');
      const ordersList = existingRaw ? JSON.parse(existingRaw) : [];
      ordersList.unshift(newOrder);
      localStorage.setItem('crm_orders', JSON.stringify(ordersList));
      localStorage.setItem('crm_orders_cache', JSON.stringify(ordersList));
    } catch {}

    // Cập nhật tổng chi tiêu khách hàng
    try {
      const rawCusts = localStorage.getItem('crm_customers');
      if (rawCusts) {
        const custs = JSON.parse(rawCusts);
        const updated = custs.map((c: any) => c.id === targetCustomerId ? { ...c, tongChiTieu: (c.tongChiTieu || 0) + serviceInvoiceTotal } : c);
        localStorage.setItem('crm_customers', JSON.stringify(updated));
      }
    } catch {}

    // 1. Tự động kích hoạt Khảo sát chất lượng Dịch vụ (Bảo dưỡng KS-BD- hoặc Sửa chữa KS-SC-)
    if (activeInvoiceType === 'BaoDuong') {
      surveyApi.createMaintenanceSurvey({
        id: invoiceSourceAppt?.id || invoiceId,
        customerId: targetCustomerId,
        tenXe: invoiceVehicleName,
        bienSo: invoiceLicensePlate,
        loaiDichVu: 'BaoDuong',
        nhanVienPhuTrach: invoiceSourceAppt?.nhanVienPhuTrach || 'KTV. Trần Minh Long',
        ngayHen: todayStr,
        gioHen: '09:00',
        trangThai: 'DaHoanThanh',
        hoTenKH: invoiceCustomerName,
        soDienThoai: invoicePhone,
      } as any, targetCust || { id: targetCustomerId, hoTen: invoiceCustomerName, soDienThoai: invoicePhone } as any);
    } else {
      surveyApi.createRepairSurvey({
        id: invoiceSourceAppt?.id || invoiceId,
        customerId: targetCustomerId,
        tenXe: invoiceVehicleName,
        bienSo: invoiceLicensePlate,
        loaiDichVu: 'SuaChua',
        nhanVienPhuTrach: invoiceSourceAppt?.nhanVienPhuTrach || 'KTV. Trần Minh Long',
        ngayHen: todayStr,
        gioHen: '09:00',
        trangThai: 'DaHoanThanh',
        hoTenKH: invoiceCustomerName,
        soDienThoai: invoicePhone,
      } as any, targetCust || { id: targetCustomerId, hoTen: invoiceCustomerName, soDienThoai: invoicePhone } as any);
    }

    // 2. Gửi thông báo đến trang khách hàng
    addCustomerNotification({
      customerId: targetCustomerId,
      category: 'survey',
      icon: '📋',
      title: activeInvoiceType === 'BaoDuong' ? '📋 Khảo sát chất lượng Dịch vụ Bảo dưỡng' : '📋 Khảo sát chất lượng Dịch vụ Sửa chữa',
      message: `Hóa đơn dịch vụ xe ${invoiceVehicleName} (${invoiceLicensePlate}) đã hoàn tất. Vui lòng dành 1 phút đánh giá chất lượng tại mục Khảo sát.`,
      page: 'dashboard',
      tab: 'surveys',
      targetId: invoiceSourceAppt?.id || invoiceId,
    });

    window.dispatchEvent(new CustomEvent('crm-customer-notification', {
      detail: {
        customerId: targetCustomerId,
        category: 'survey',
        tab: 'surveys',
        targetId: invoiceSourceAppt?.id || invoiceId,
      }
    }));

    if (invoiceSourceAppt) {
      const currentTimeline = getApptTimeline(invoiceSourceAppt);
      const newTlItem: AppointmentTimelineItem = {
        id: 'TL-' + Date.now(),
        trangThai: 'DaHoanThanh',
        tieuDe: `Hoàn tất & Lập hóa đơn ${invoiceId}`,
        thoiGian: getNowDateTimeString(),
        nguoiThucHien: currentStaff?.hoTen || 'KTV Phụ trách',
        ghiChu: `Đã hoàn tất dịch vụ, lập hóa đơn ${formatVND(serviceInvoiceTotal)} và bàn giao xe cho khách hàng.`,
      };
      await appointmentApi.updateStatus(invoiceSourceAppt.id, 'DaHoanThanh');

      try {
        const cached = localStorage.getItem('crm_appointments_cache');
        if (cached) {
          const list = JSON.parse(cached);
          const updatedList = list.map((a: any) => a.id === invoiceSourceAppt.id ? {
            ...a,
            trangThai: 'DaHoanThanh',
            chiPhiThucTe: serviceInvoiceTotal,
            maHoaDon: invoiceId,
            nhanVienPhuTrach: invoiceSourceAppt.nhanVienPhuTrach || currentStaff?.hoTen || a.nhanVienPhuTrach,
            timeline: [...currentTimeline, newTlItem],
          } : a);
          localStorage.setItem('crm_appointments_cache', JSON.stringify(updatedList));
        }
      } catch {}

      setAppointments(as => as.map(item => item.id === invoiceSourceAppt.id ? {
        ...item,
        trangThai: 'DaHoanThanh',
        chiPhiThucTe: serviceInvoiceTotal,
        maHoaDon: invoiceId,
        timeline: [...currentTimeline, newTlItem]
      } : item));
      setSelectedApptForDetail(prev => prev?.id === invoiceSourceAppt.id ? {
        ...prev,
        trangThai: 'DaHoanThanh',
        chiPhiThucTe: serviceInvoiceTotal,
        maHoaDon: invoiceId,
        timeline: [...currentTimeline, newTlItem]
      } : prev);
    }

    setPrintReceiptData(newOrder);
    setShowServiceInvoiceModal(false);
    setShowReceiptModal(true);

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'order-created' } }));
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
      // Phân hệ chuyên biệt theo moduleType
      if (moduleType === 'maintenance' && a.loaiDichVu !== 'BaoDuong' && a.loaiDichVu !== 'SuaChua') return false;
      if (moduleType === 'test-drives' && !isTestDriveAppt(a)) return false;

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
      if (moduleType !== 'test-drives' && apptSvcFilter !== 'ALL' && a.loaiDichVu !== apptSvcFilter) return false;
      
      const aDate = normalizeDateStr(a.ngayHen);
      if (apptFromDate && aDate && aDate < apptFromDate) return false;
      if (apptToDate && aDate && aDate > apptToDate) return false;
      if (apptSearch.trim()) {
        const matchId = matchVietnameseSearch(a.id, apptSearch);
        const matchName = matchVietnameseSearch(a.hoTenKH, apptSearch);
        const matchPhone = matchVietnameseSearch(a.soDienThoai, apptSearch);
        const matchVehicle = matchVietnameseSearch(a.tenXe || '', apptSearch);
        const matchPlate = matchVietnameseSearch(a.bienSo || '', apptSearch);
        const matchLich = matchVietnameseSearch(a.maLichHen || '', apptSearch);
        const matchDonXe = matchVietnameseSearch((a as any).maDonHangXe || '', apptSearch);
        if (!matchId && !matchName && !matchPhone && !matchVehicle && !matchPlate && !matchLich && !matchDonXe) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      // 1. Ưu tiên cao nhất: Chờ xác nhận (ChoXacNhan) luôn hiển thị ở đầu
      if (a.trangThai === 'ChoXacNhan' && b.trangThai !== 'ChoXacNhan') return -1;
      if (a.trangThai !== 'ChoXacNhan' && b.trangThai === 'ChoXacNhan') return 1;

      // 2. Tiếp theo: Sắp xếp theo ngày hẹn mới nhất
      const aDate = normalizeDateStr(a.ngayHen);
      const bDate = normalizeDateStr(b.ngayHen);
      if (bDate !== aDate) {
        return bDate.localeCompare(aDate);
      }
      return (b.gioHen || '').localeCompare(a.gioHen || '');
    });
  }, [appointments, apptStatusFilter, apptSvcFilter, apptFromDate, apptToDate, apptSearch, allOrders, moduleType]);

  // Hợp nhất toàn bộ lịch hẹn kỹ thuật (Bảo dưỡng, Lái thử, Sửa chữa) VỚI toàn bộ lịch nhận xe từ Quản lý đơn hàng (allOrders)
  const calendarAppointments = useMemo(() => {
    const list: Appointment[] = [...appointments];
    const existingOrderIds = new Set(appointments.filter(a => a.maDonHangXe).map(a => a.maDonHangXe!));

    allOrders.forEach(o => {
      const isVehicle = o.loaiDon !== 'PhuTung' && (o.loaiDon === 'Xe' || (!!o.thongTinXe && (!o.items || o.items.length === 0)) || (o.id && o.id.includes('XE') && (!o.items || o.items.length === 0)));
      if (!isVehicle) return;
      if (existingOrderIds.has(o.id)) return;

      const pickupDate = o.thongTinXe?.ngayNhanXacNhan || o.thongTinXe?.ngayGiaoXe;
      if (!pickupDate) return;
      if (o.trangThai === 'DaHuy') return;

      const isConfirmed = o.daXacNhanNgayNhan || o.thongTinXe?.daXacNhanNgayNhan || o.trangThai === 'ChoGiaoXe' || o.trangThai === 'HoanThanh' || o.trangThai === 'DaGiao' || o.trangThai === 'DaXacNhan';
      if (!isConfirmed) return;

      const isCompleted = o.trangThai === 'HoanThanh' || o.trangThai === 'DaGiao';

      list.push({
        id: `APPT-${o.id}`,
        customerId: o.customerId,
        hoTenKH: o.hoTenKH,
        soDienThoai: o.soDienThoai || '',
        loaiDichVu: 'NhanXe',
        ngayHen: pickupDate,
        gioHen: o.thongTinXe?.gioNhanXacNhan || o.thongTinXe?.khungGioGiao || '09:00',
        tenXe: o.thongTinXe?.tenXe || 'Xe máy chính hãng',
        bienSo: o.thongTinXe?.bienSo || 'Showroom bàn giao',
        mauXe: o.thongTinXe?.mauSac || 'Tiêu chuẩn',
        trangThai: isCompleted ? 'DaHoanThanh' : 'DaXacNhan',
        nhanVienPhuTrach: (() => {
          let ktv = o.tenKTV || (o.thongTinXe as any)?.ktvPhuTrach;
          if (!ktv) {
            try {
              const km = localStorage.getItem('crm_order_ktv_map');
              if (km) {
                const parsed = JSON.parse(km);
                ktv = parsed[o.id]?.hoTen || parsed[o.id.replace(/\D/g, '')]?.hoTen;
              }
            } catch {}
          }
          return ktv || 'Trần Kỹ Thuật';
        })(),
        ghiChu: `Lịch nhận xe theo đơn hàng #${o.id}. Trạng thái: ${isCompleted ? 'Đã hoàn tất' : 'Chờ giao xe'}`,
        maDonHangXe: o.id,
        maLichHen: o.maLichHen || `HEN-${o.id}`,
      });
    });

    return list;
  }, [appointments, allOrders]);

  const currentMonthCalendarAppts = useMemo(() => {
    const calMonth = currentCalendarDate.getMonth() + 1;
    const calYear = currentCalendarDate.getFullYear();
    return calendarAppointments.filter(a => {
      const norm = normalizeDateStr(a.ngayHen);
      if (!norm) return false;
      const [y, m] = norm.split('-').map(v => parseInt(v, 10));
      return y === calYear && m === calMonth;
    });
  }, [calendarAppointments, currentCalendarDate]);

  const totalCalendarCount = currentMonthCalendarAppts.length;
  const pickupCalendarCount = currentMonthCalendarAppts.filter(a => a.loaiDichVu === 'NhanXe').length;
  const testDriveCalendarCount = currentMonthCalendarAppts.filter(a => isTestDriveAppt(a)).length;
  const maintenanceCalendarCount = currentMonthCalendarAppts.filter(a => a.loaiDichVu === 'BaoDuong' || a.loaiDichVu === 'SuaChua').length;

  // KPI stats (chỉ đếm lịch hẹn đang hoạt động, không bao gồm lịch nhận xe đã hoàn tất)
  const activeAppts = useMemo(() => {
    return appointments.filter(a => {
      if (moduleType === 'maintenance' && a.loaiDichVu !== 'BaoDuong' && a.loaiDichVu !== 'SuaChua') return false;
      if (moduleType === 'test-drives' && !isTestDriveAppt(a)) return false;

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
  }, [appointments, allOrders, moduleType]);

  const totalCount = activeAppts.length;
  const pendingCount = activeAppts.filter(a => a.trangThai === 'ChoXacNhan').length;
  const confirmedCount = activeAppts.filter(a => a.trangThai === 'DaXacNhan').length;
  const pickupCount = activeAppts.filter(a => a.loaiDichVu === 'NhanXe').length;
  const completedCount = appointments.filter(a => {
    if (moduleType === 'maintenance' && a.loaiDichVu !== 'BaoDuong' && a.loaiDichVu !== 'SuaChua') return false;
    if (moduleType === 'test-drives' && !isTestDriveAppt(a)) return false;
    return a.trangThai === 'DaHoanThanh' || a.trangThai === 'HoanThanh';
  }).length;

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
            {moduleType === 'calendar'
              ? 'LỊCH BIỂU SHOWROOM'
              : moduleType === 'maintenance'
              ? 'QUẢN LÝ BẢO DƯỠNG XE'
              : moduleType === 'test-drives'
              ? 'QUẢN LÝ LÁI THỬ XE'
              : 'QUẢN LÝ LỊCH HẸN'}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {moduleType === 'calendar'
              ? 'Điều phối tập trung toàn bộ lịch đón tiếp nhận xe mới, lái thử và dịch vụ kỹ thuật bảo dưỡng tại showroom.'
              : moduleType === 'maintenance'
              ? 'Tiếp nhận xe, phân công kỹ thuật viên, theo dõi tiến độ bảo dưỡng & sửa chữa và bàn giao xe cho khách hàng.'
              : moduleType === 'test-drives'
              ? 'Tiếp nhận yêu cầu lái thử của khách hàng, phân công nhân viên tư vấn đồng hành và hỗ trợ chuyển đổi đơn hàng xe mới.'
              : 'Theo dõi, điều phối lịch hẹn sửa chữa, bảo dưỡng, lái thử và lịch đón tiếp khách nhận xe mới tại showroom.'}
          </p>
        </div>

        {/* View toggle (Table vs Calendar) */}
        {moduleType !== 'calendar' && (
          <div className="flex items-center gap-2 flex-wrap">
            {moduleType === 'test-drives' && (
              <button
                type="button"
                onClick={() => {
                  setWalkInErrors({});
                  setWalkInForm({
                    hoTenKH: '',
                    soDienThoai: '',
                    tenXe: testDriveVehicles[0]?.tenXe || 'Honda SH 160i ABS 2025',
                    nhanVienPhuTrach: currentStaff?.hoTen || 'Trần Văn Quản Lý',
                    soGPLX: '',
                    ghiChu: 'Khách hàng vãng lai trực tiếp tại Showroom đăng ký lái thử',
                  });
                  setShowWalkInTestDriveModal(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer"
                title="Ghi nhận khách hàng vãng lai tại showroom và tạo hóa đơn bán xe ngay"
              >
                <span>🧾</span> <span>Tạo hóa đơn cho khách vãng lai</span>
              </button>
            )}
            {(moduleType === 'maintenance' || moduleType === 'all') && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenOutsideInvoiceModal('BaoDuong')}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white shadow-xs hover:shadow transition flex items-center gap-1.5 cursor-pointer"
                  title="Tạo hóa đơn dịch vụ bảo dưỡng cho khách hàng có sẵn hoặc khách mới"
                >
                  <span>🔧</span> <span>+ Tạo Hóa Đơn Bảo Dưỡng</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenOutsideInvoiceModal('SuaChua')}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-800 text-white shadow-xs hover:shadow transition flex items-center gap-1.5 cursor-pointer"
                  title="Tạo hóa đơn dịch vụ sửa chữa phụ tùng & tiền công thợ"
                >
                  <span>⚙️</span> <span>+ Tạo Hóa Đơn Sửa Chữa</span>
                </button>
              </div>
            )}
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
        )}
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {moduleType === 'calendar' ? (
          <>
            <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs">
              <div className="text-xs text-zinc-500 font-mono">📅 TỔNG LỊCH TOÀN SHOWROOM</div>
              <div className="text-2xl font-extrabold text-zinc-950 font-mono mt-1">{totalCalendarCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 shadow-2xs">
              <div className="text-xs text-amber-800 font-mono font-bold">🏎️ BÀN GIAO XE MỚI</div>
              <div className="text-2xl font-extrabold text-amber-700 font-mono mt-1">{pickupCalendarCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80 shadow-2xs">
              <div className="text-xs text-purple-800 font-mono font-bold">🏍️ LÁI THỬ XE</div>
              <div className="text-2xl font-extrabold text-purple-700 font-mono mt-1">{testDriveCalendarCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 shadow-2xs">
              <div className="text-xs text-blue-800 font-mono font-bold">🔧 BẢO DƯỠNG & SỬA CHỮA</div>
              <div className="text-2xl font-extrabold text-blue-700 font-mono mt-1">{maintenanceCalendarCount}</div>
            </div>
          </>
        ) : moduleType === 'maintenance' ? (
          <>
            <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs">
              <div className="text-xs text-zinc-500 font-mono">TỔNG BẢO DƯỠNG & SỬA CHỮA</div>
              <div className="text-2xl font-extrabold text-zinc-950 font-mono mt-1">{totalCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 shadow-2xs">
              <div className="text-xs text-amber-800 font-mono font-bold">⏳ CHỜ TIẾP NHẬN</div>
              <div className="text-2xl font-extrabold text-amber-700 font-mono mt-1">{pendingCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 shadow-2xs">
              <div className="text-xs text-blue-800 font-mono font-bold">🔧 ĐÃ XÁC NHẬN / PHÂN CÔNG</div>
              <div className="text-2xl font-extrabold text-blue-700 font-mono mt-1">{confirmedCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 shadow-2xs">
              <div className="text-xs text-emerald-800 font-mono font-bold">✓ ĐÃ HOÀN TẤT DỊCH VỤ</div>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">{completedCount}</div>
            </div>
          </>
        ) : moduleType === 'test-drives' ? (
          <>
            <div
              onClick={() => setApptStatusFilter('ALL')}
              className={`p-4 rounded-2xl border shadow-2xs transition cursor-pointer select-none ${
                apptStatusFilter === 'ALL'
                  ? 'bg-zinc-950 text-white border-zinc-800 shadow-md ring-2 ring-zinc-700'
                  : 'bg-white text-zinc-900 border-zinc-200/80 hover:border-zinc-300'
              }`}
            >
              <div className={`text-xs font-mono font-bold ${apptStatusFilter === 'ALL' ? 'text-zinc-300' : 'text-zinc-500'}`}>TỔNG YÊU CẦU LÁI THỬ</div>
              <div className="text-2xl font-extrabold font-mono mt-1">{totalCount}</div>
            </div>
            <div
              onClick={() => setApptStatusFilter('ChoXacNhan')}
              className={`p-4 rounded-2xl border shadow-2xs transition cursor-pointer select-none ${
                apptStatusFilter === 'ChoXacNhan'
                  ? 'bg-amber-900 text-white border-amber-700 shadow-md ring-2 ring-amber-500'
                  : 'bg-amber-50/80 text-amber-900 border-amber-200/80 hover:border-amber-300'
              }`}
            >
              <div className={`text-xs font-mono font-bold ${apptStatusFilter === 'ChoXacNhan' ? 'text-amber-200' : 'text-amber-800'}`}>⏳ CHỜ TIẾP NHẬN</div>
              <div className={`text-2xl font-extrabold font-mono mt-1 ${apptStatusFilter === 'ChoXacNhan' ? 'text-amber-100' : 'text-amber-700'}`}>{pendingCount}</div>
            </div>
            <div
              onClick={() => setApptStatusFilter('DaXacNhan')}
              className={`p-4 rounded-2xl border shadow-2xs transition cursor-pointer select-none ${
                apptStatusFilter === 'DaXacNhan'
                  ? 'bg-purple-900 text-white border-purple-700 shadow-md ring-2 ring-purple-500'
                  : 'bg-purple-50/80 text-purple-900 border-purple-200/80 hover:border-purple-300'
              }`}
            >
              <div className={`text-xs font-mono font-bold ${apptStatusFilter === 'DaXacNhan' ? 'text-purple-200' : 'text-purple-800'}`}>🏍️ ĐÃ XÁC NHẬN LÁI THỬ</div>
              <div className={`text-2xl font-extrabold font-mono mt-1 ${apptStatusFilter === 'DaXacNhan' ? 'text-purple-100' : 'text-purple-700'}`}>{confirmedCount}</div>
            </div>
            <div
              onClick={() => setApptStatusFilter('DaHoanThanh')}
              className={`p-4 rounded-2xl border shadow-2xs transition cursor-pointer select-none ${
                apptStatusFilter === 'DaHoanThanh'
                  ? 'bg-emerald-900 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500'
                  : 'bg-emerald-50/80 text-emerald-900 border-emerald-200/80 hover:border-emerald-300'
              }`}
            >
              <div className={`text-xs font-mono font-bold ${apptStatusFilter === 'DaHoanThanh' ? 'text-emerald-200' : 'text-emerald-800'}`}>✓ ĐÃ HOÀN TẤT LÁI THỬ</div>
              <div className={`text-2xl font-extrabold font-mono mt-1 ${apptStatusFilter === 'DaHoanThanh' ? 'text-emerald-100' : 'text-emerald-700'}`}>{completedCount}</div>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* ── THANH CHUYỂN TAB DỊCH VỤ CHUYÊN BIỆT (TÁCH RIÊNG TỪNG DỊCH VỤ - ÁP DỤNG CẢ DANH SÁCH & LỊCH BIỂU) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
        {(moduleType === 'calendar' ? [
          { key: 'ALL', label: 'Tất cả lịch toàn showroom', icon: '📅', count: totalCalendarCount },
          { key: 'NhanXe', label: 'Bàn giao nhận xe mới', icon: '🏎️', count: pickupCalendarCount },
          { key: 'LaiThu', label: 'Lái thử xe mới', icon: '🏍️', count: testDriveCalendarCount },
          { key: 'BaoDuong', label: 'Bảo dưỡng định kỳ', icon: '🔧', count: calendarAppointments.filter(a => a.loaiDichVu === 'BaoDuong').length },
          { key: 'SuaChua', label: 'Sửa chữa phụ tùng', icon: '⚙️', count: calendarAppointments.filter(a => a.loaiDichVu === 'SuaChua').length },
        ] : moduleType === 'maintenance' ? [
          { key: 'ALL', label: 'Tất cả dịch vụ kỹ thuật', icon: '🔧', count: appointments.filter(a => (a.loaiDichVu === 'BaoDuong' || a.loaiDichVu === 'SuaChua') && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
          { key: 'BaoDuong', label: 'Bảo dưỡng định kỳ', icon: '🔧', count: appointments.filter(a => a.loaiDichVu === 'BaoDuong' && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
          { key: 'SuaChua', label: 'Sửa chữa phụ tùng', icon: '⚙️', count: appointments.filter(a => a.loaiDichVu === 'SuaChua' && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
        ] : moduleType === 'test-drives' ? [
          { key: 'ALL', label: 'Tất cả yêu cầu lái thử', icon: '🏍️', count: appointments.filter(a => isTestDriveAppt(a) && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
        ] : [
          { key: 'ALL', label: 'Tất cả dịch vụ', icon: '📋', count: appointments.filter(a => a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
          { key: 'NhanXe', label: 'Bàn giao nhận xe mới', icon: '🎁', count: appointments.filter(a => a.loaiDichVu === 'NhanXe' && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
          { key: 'LaiThu', label: 'Lái thử xe mới', icon: '🏍️', count: appointments.filter(a => isTestDriveAppt(a) && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
          { key: 'BaoDuong', label: 'Bảo dưỡng định kỳ', icon: '🔧', count: appointments.filter(a => a.loaiDichVu === 'BaoDuong' && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
          { key: 'BaoHanh', label: 'Bảo hành điện tử', icon: '🛡️', count: appointments.filter(a => a.loaiDichVu === 'BaoHanh' && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
          { key: 'SuaChua', label: 'Sửa chữa phụ tùng', icon: '⚙️', count: appointments.filter(a => a.loaiDichVu === 'SuaChua' && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length },
        ]).map(tab => {
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

      {/* ── THANH TÌM KIẾM & BỘ LỌC NHANH (Chỉ dùng cho Danh sách dịch vụ & kỹ thuật) ── */}
      {moduleType !== 'calendar' && (
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
      )}

      {/* ── CHẾ ĐỘ 1: BẢNG DANH SÁCH (Chỉ hiển thị cho Quản lý Bảo dưỡng & Lái thử xe) ── */}
      {apptViewMode === 'table' && moduleType !== 'calendar' && (
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
                        {isTestDriveAppt(a) && (
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
                        {a.loaiDichVu !== 'SuaChua' && a.loaiDichVu !== 'BaoDuong' && !isTestDriveAppt(a) && a.loaiDichVu !== 'NhanXe' && a.loaiDichVu !== 'BaoHanh' && (
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
                          {(isNhanXe || isTestDriveAppt(a)) && !isCompleted && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi' && onNavigateToCreateVehicleOrder && (
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
                              {/* Nút Hoàn tất lái thử chuyên biệt cho phân hệ lái thử xe */}
                              {isTestDriveAppt(a) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Xác nhận hoàn tất buổi lái thử xe ${a.tenXe || ''} cho khách hàng ${a.hoTenKH}?`)) {
                                      updateApptStatus(a.id, 'DaHoanThanh', undefined, a.nhanVienPhuTrach || 'Tư vấn bán hàng', 'Khách hàng đã hoàn tất buổi lái thử trải nghiệm xe thành công.');
                                    }
                                  }}
                                  className="col-span-2 w-full px-2.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer mb-1"
                                  title="Xác nhận khách hàng đã lái thử xong và hoàn tất dịch vụ"
                                >
                                  <span>✓</span> <span>Hoàn tất lái thử</span>
                                </button>
                              )}

                              {/* FIX 104: Phân hệ Bảo dưỡng & Sửa chữa -> 2 nút "Khách đã đến" & "Khách không đến" */}
                              {(a.loaiDichVu === 'BaoDuong' || a.loaiDichVu === 'SuaChua') && (
                                (a as any).khachDaDen ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenInvoiceModalForAppt(a)}
                                    className="col-span-2 w-full px-2.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer mb-1"
                                    title="Tạo và in hóa đơn dịch vụ"
                                  >
                                    <span>🧾</span> <span>Tạo hóa đơn</span>
                                  </button>
                                ) : (
                                  <div className="col-span-2 flex gap-1 mb-1">
                                    <button
                                      type="button"
                                      onClick={() => handleCustomerArrived(a)}
                                      className="flex-1 px-2 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                      title="Khách hàng đã có mặt tại showroom và bàn giao xe"
                                    >
                                      <span>🙋</span> <span>Khách đã đến</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCustomerNoShow(a)}
                                      className="px-2 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition flex items-center justify-center gap-1 cursor-pointer"
                                      title="Khách hàng vắng mặt / không đến theo lịch hẹn"
                                    >
                                      <span>🚶</span> <span>Khách không đến</span>
                                    </button>
                                  </div>
                                )
                              )}

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
                              {/* Nếu đang thực hiện tại xưởng hoặc khách đã đến nhưng chưa lập hóa đơn */}
                              {(a.trangThai === 'DangThucHien' || (a as any).khachDaDen) && a.trangThai !== 'DaHoanThanh' && a.trangThai !== 'DaHuy' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenInvoiceModalForAppt(a)}
                                  className="col-span-2 w-full px-2.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer mb-1"
                                  title="Tạo và in hóa đơn dịch vụ"
                                >
                                  <span>🧾</span> <span>Tạo hóa đơn</span>
                                </button>
                              )}
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
      {(apptViewMode === 'calendar' || moduleType === 'calendar') && (
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
              const dayAppts = calendarAppointments.filter(a => {
                if (normalizeDateStr(a.ngayHen) !== cell.dateStr) return false;
                if (moduleType === 'maintenance' && a.loaiDichVu !== 'BaoDuong' && a.loaiDichVu !== 'SuaChua') return false;
                if (moduleType === 'test-drives' && !isTestDriveAppt(a)) return false;
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
                  if (matchedOrder && !matchedOrder.daXacNhanNgayNhan && a.trangThai !== 'DaXacNhan' && (matchedOrder.trangThai === 'ChoDuyet' || matchedOrder.trangThai === 'ChoKhachXacNhanNgayNhan')) {
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
              {(() => {
                const isLinkedOrderCompleted = (selectedApptForDetail.loaiDichVu === 'NhanXe' || selectedApptForDetail.maDonHangXe) && allOrders.some(o => {
                  const matchId = (selectedApptForDetail.maDonHangXe && selectedApptForDetail.maDonHangXe === o.id) ||
                    (selectedApptForDetail.maLichHen && (o.maLichHen === selectedApptForDetail.maLichHen || o.thongTinXe?.maLichHen === selectedApptForDetail.maLichHen)) ||
                    (selectedApptForDetail.id && parseInt(o.id.replace(/\D/g, ''), 10) === parseInt(selectedApptForDetail.id.replace(/\D/g, ''), 10)) ||
                    (selectedApptForDetail.soDienThoai && o.soDienThoai && selectedApptForDetail.soDienThoai.replace(/\D/g, '') === o.soDienThoai.replace(/\D/g, ''));
                  return matchId && (o.trangThai === 'HoanThanh' || o.trangThai === 'DaGiao');
                });
                const detailEffectiveStatus = isLinkedOrderCompleted ? 'DaHoanThanh' : selectedApptForDetail.trangThai;

                return (
                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-zinc-900 text-sm">{selectedApptForDetail.hoTenKH}</div>
                      <StatusBadge status={detailEffectiveStatus} configs={apptStatuses} />
                    </div>
                    {detailEffectiveStatus === 'DaHoanThanh' && (
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                        <span>✓</span> <span>Lịch hẹn đã hoàn thành (Xe đã được bàn giao thành công cho khách hàng)</span>
                      </div>
                    )}
                    <div>
                      SĐT: <strong className="font-mono text-zinc-800">{selectedApptForDetail.soDienThoai}</strong> · Mã KH: <span className="font-mono">{selectedApptForDetail.customerId}</span>
                    </div>
                    <div>
                      Phương tiện: <strong className="text-zinc-900">{selectedApptForDetail.tenXe}</strong> (Biển số: <strong className="font-mono">{selectedApptForDetail.bienSo || 'Chưa bấm biển'}</strong>)
                    </div>
                    {(() => {
                      const matchedOrder = allOrders.find(o =>
                        (selectedApptForDetail.maDonHangXe && (o.id === selectedApptForDetail.maDonHangXe || o.id.replace(/\D/g, '') === selectedApptForDetail.maDonHangXe.replace(/\D/g, ''))) ||
                        (selectedApptForDetail.maLichHen && (o.maLichHen === selectedApptForDetail.maLichHen || o.thongTinXe?.maLichHen === selectedApptForDetail.maLichHen)) ||
                        (selectedApptForDetail.tenXe && o.thongTinXe?.tenXe && (
                          o.thongTinXe.tenXe.toLowerCase().includes(selectedApptForDetail.tenXe.toLowerCase()) ||
                          selectedApptForDetail.tenXe.toLowerCase().includes(o.thongTinXe.tenXe.toLowerCase())
                        ))
                      );
                      const resolvedKtv = (selectedApptForDetail.nhanVienPhuTrach && !selectedApptForDetail.nhanVienPhuTrach.includes('Showroom bàn giao'))
                        ? selectedApptForDetail.nhanVienPhuTrach
                        : (matchedOrder?.tenKTV || (matchedOrder?.thongTinXe as any)?.ktvPhuTrach || selectedApptForDetail.nhanVienPhuTrach || 'KTV. Trần Minh Long');
                      return (
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-600">Kỹ thuật viên phụ trách:</span>
                          <strong className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {resolvedKtv}
                          </strong>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

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
              {isTestDriveAppt(selectedApptForDetail) && onNavigateToCreateVehicleOrder && (
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

                {/* LH27 & LaiThu: Nút hoàn tất lái thử ngay trong modal chi tiết */}
                {isTestDriveAppt(selectedApptForDetail) && selectedApptForDetail.trangThai === 'DaXacNhan' && (
                  <button
                    type="button"
                    onClick={() => {
                      const appt = selectedApptForDetail;
                      if (confirm(`Xác nhận hoàn tất buổi lái thử xe ${appt.tenXe || ''} cho khách hàng ${appt.hoTenKH}?`)) {
                        updateApptStatus(appt.id, 'DaHoanThanh', undefined, appt.nhanVienPhuTrach || 'Tư vấn bán hàng', 'Khách hàng đã hoàn tất buổi lái thử trải nghiệm xe thành công.');
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-sm transition cursor-pointer flex items-center gap-1.5"
                    title="Xác nhận khách hàng đã hoàn tất buổi lái thử"
                  >
                    <span>✓</span> <span>Hoàn tất lái thử</span>
                  </button>
                )}

                {/* LH27 & NhanXe: Thao tác chuyển sang nhận xe mới ở footer */}
                {(selectedApptForDetail.loaiDichVu === 'NhanXe' || isTestDriveAppt(selectedApptForDetail)) &&
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

                {/* Nút bấm nhanh xác nhận đã bàn giao xe hoàn tất */}
                {selectedApptForDetail.loaiDichVu === 'NhanXe' && selectedApptForDetail.trangThai !== 'DaHoanThanh' && selectedApptForDetail.trangThai !== 'DaHuy' && (
                  <button
                    type="button"
                    onClick={async () => {
                      await appointmentApi.updateStatus(selectedApptForDetail.id, 'DaHoanThanh');
                      setAppointments(prev => prev.map(a => a.id === selectedApptForDetail.id ? { ...a, trangThai: 'DaHoanThanh' } : a));
                      setSelectedApptForDetail(prev => prev ? { ...prev, trangThai: 'DaHoanThanh' } : null);
                      alert(`✓ Đã xác nhận hoàn thành lịch bàn giao xe #${selectedApptForDetail.id}!`);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer flex items-center gap-1"
                  >
                    <span>✓</span> <span>Xác nhận đã bàn giao xe</span>
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

      {/* ── MODAL: TẠO HÓA ĐƠN CHO KHÁCH HÀNG VÃNG LAI LÁI THỬ (YÊU CẦU LÁI THỬ ADMIN) ── */}
      {showWalkInTestDriveModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-red-100 text-red-700 rounded-xl text-lg">🧾</span>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 uppercase font-display">
                    TẠO HÓA ĐƠN CHO KHÁCH HÀNG VÃNG LAI
                  </h3>
                  <p className="text-xs text-zinc-500">Tiếp nhận khách hàng trực tiếp tại Showroom lái thử & lập đơn bán xe</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWalkInTestDriveModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Họ tên */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Họ và tên khách hàng <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn Khách"
                  value={walkInForm.hoTenKH}
                  onChange={e => {
                    setWalkInForm({ ...walkInForm, hoTenKH: e.target.value });
                    if (walkInErrors.hoTenKH) setWalkInErrors({ ...walkInErrors, hoTenKH: '' });
                  }}
                  className={`w-full p-2.5 rounded-xl border font-medium ${
                    walkInErrors.hoTenKH ? 'border-red-500 bg-red-50/20' : 'border-zinc-300 focus:border-red-600'
                  }`}
                />
                {walkInErrors.hoTenKH && <p className="text-[11px] text-red-600 mt-1 font-semibold">{walkInErrors.hoTenKH}</p>}
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Số điện thoại liên hệ <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Ví dụ: 0912345678 (10 chữ số)"
                  value={walkInForm.soDienThoai}
                  onChange={e => {
                    setWalkInForm({ ...walkInForm, soDienThoai: e.target.value.replace(/\D/g, '').slice(0, 10) });
                    if (walkInErrors.soDienThoai) setWalkInErrors({ ...walkInErrors, soDienThoai: '' });
                  }}
                  className={`w-full p-2.5 rounded-xl border font-mono ${
                    walkInErrors.soDienThoai ? 'border-red-500 bg-red-50/20' : 'border-zinc-300 focus:border-red-600'
                  }`}
                />
                {walkInErrors.soDienThoai && <p className="text-[11px] text-red-600 mt-1 font-semibold">{walkInErrors.soDienThoai}</p>}
              </div>

              {/* Chọn xe lái thử */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Mẫu xe khách chọn lái thử <span className="text-red-600">*</span>
                </label>
                <select
                  value={walkInForm.tenXe}
                  onChange={e => setWalkInForm({ ...walkInForm, tenXe: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 bg-white font-medium focus:border-red-600"
                >
                  {testDriveVehicles.map(v => (
                    <option key={v.id} value={v.tenXe}>
                      {v.tenXe} ({v.hang} - {formatVND(v.giaNiemYet)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Số GPLX & Nhân viên */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Số GPLX (Nếu có)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 790123456789"
                    value={walkInForm.soGPLX}
                    onChange={e => setWalkInForm({ ...walkInForm, soGPLX: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Nhân viên tư vấn
                  </label>
                  <select
                    value={walkInForm.nhanVienPhuTrach}
                    onChange={e => setWalkInForm({ ...walkInForm, nhanVienPhuTrach: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 bg-white font-medium"
                  >
                    <option value={currentStaff?.hoTen || 'Trần Văn Quản Lý'}>
                      {currentStaff?.hoTen || 'Trần Văn Quản Lý'}
                    </option>
                    {technicianList.filter(t => t !== 'Chưa phân công').map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Ghi chú yêu cầu / Trải nghiệm
                </label>
                <textarea
                  rows={2}
                  value={walkInForm.ghiChu}
                  onChange={e => setWalkInForm({ ...walkInForm, ghiChu: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 font-sans"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowWalkInTestDriveModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleSaveWalkInTestDrive(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-900 text-white transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>✓</span> Ghi nhận lái thử
              </button>
              <button
                type="button"
                onClick={() => handleSaveWalkInTestDrive(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white shadow-md shadow-red-700/20 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🧾</span> Lưu & Tạo hóa đơn bán xe ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FIX 104: MODAL TẠO HÓA ĐƠN DỊCH VỤ (BẢO DƯỠNG & SỬA CHỮA) CHUẨN 4 MOCKUP ── */}
      {showServiceInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#18191f] text-white rounded-3xl border border-zinc-700/80 shadow-2xl p-5 sm:p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-700/80">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center text-xl font-black">
                  {activeInvoiceType === 'BaoDuong' ? '🔧' : '⚙️'}
                </div>
                <div>
                  <h3 className="text-base font-extrabold uppercase tracking-wide text-white font-mono flex items-center gap-2">
                    {activeInvoiceType === 'BaoDuong' ? 'TẠO HÓA ĐƠN BẢO DƯỠNG' : 'TẠO HÓA ĐƠN SỬA CHỮA'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {activeInvoiceType === 'BaoDuong'
                      ? 'Nhập thông tin gói bảo dưỡng và phụ tùng phát sinh để tạo và in hóa đơn'
                      : 'Nhập thông tin tiếp nhận, phụ tùng thay thế và tiền công dịch vụ'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowServiceInvoiceModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1. THÔNG TIN KHÁCH HÀNG / THÔNG TIN TIẾP NHẬN */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-zinc-300 font-mono tracking-wider flex items-center gap-2">
                  <span>1. {activeInvoiceType === 'SuaChua' && invoiceSourceAppt ? 'THÔNG TIN TIẾP NHẬN' : 'THÔNG TIN KHÁCH HÀNG'}</span>
                  {invoiceSourceAppt ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 font-mono">
                      Từ lịch hẹn: #{invoiceSourceAppt.id}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 font-normal lowercase">
                      {isNewCustomerMode ? '(Nhập khách mới)' : '(Tự động điền)'}
                    </span>
                  )}
                </span>
                {!invoiceSourceAppt && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewCustomerMode(prev => !prev);
                      if (!isNewCustomerMode) {
                        setCustomerSearchQuery('');
                        setInvoiceCustomerName('');
                        setInvoicePhone('');
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>{isNewCustomerMode ? '🔍 Tìm khách có sẵn' : '+ Khách mới'}</span>
                  </button>
                )}
              </div>

              {!invoiceSourceAppt && !isNewCustomerMode && (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">🔍</span>
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={e => {
                      setCustomerSearchQuery(e.target.value);
                      setInvoiceCustomerName(e.target.value);
                    }}
                    placeholder="Tìm theo tên hoặc số điện thoại khách hàng trên hệ thống..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                  {matchedCustomers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden divide-y divide-zinc-700/60">
                      {matchedCustomers.map(c => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="p-2 hover:bg-zinc-700/80 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <strong className="text-white">{c.hoTen}</strong>
                            <span className="text-zinc-400 ml-2 font-mono">{c.soDienThoai}</span>
                          </div>
                          <span className="text-[11px] text-zinc-400">{(c as any).danhSachXe?.[0]?.tenXe || (c as any).xeDangDung || 'Xe máy'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Khách hàng:</label>
                  <input
                    type="text"
                    value={invoiceCustomerName}
                    onChange={e => setInvoiceCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Số điện thoại:</label>
                  <input
                    type="text"
                    value={invoicePhone}
                    onChange={e => setInvoicePhone(e.target.value)}
                    placeholder="0909123456"
                    className="w-full p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Tên xe:</label>
                  <input
                    type="text"
                    value={invoiceVehicleName}
                    onChange={e => setInvoiceVehicleName(e.target.value)}
                    placeholder="Honda Vision 2024"
                    className="w-full p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Biển số:</label>
                  <input
                    type="text"
                    value={invoiceLicensePlate}
                    onChange={e => setInvoiceLicensePlate(e.target.value.toUpperCase())}
                    placeholder="59-A1 888.88"
                    className="w-full p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-amber-400 font-mono uppercase"
                  />
                </div>
              </div>

              {activeInvoiceType === 'SuaChua' && (
                <div className="pt-1">
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Tình trạng xe / Yêu cầu sửa chữa:
                  </label>
                  <textarea
                    rows={2}
                    value={invoiceDiagnosis}
                    onChange={e => setInvoiceDiagnosis(e.target.value)}
                    placeholder="VD: Lủng lốp sau, má phanh mòn kêu xẹt xẹt khi bóp..."
                    className="w-full p-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              )}
            </div>

            {/* 2. GÓI BẢO DƯỠNG (Đối với Bảo Dưỡng) */}
            {activeInvoiceType === 'BaoDuong' && (
              <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-zinc-300 font-mono tracking-wider">
                    2. GÓI BẢO DƯỠNG <span className="text-[10px] text-zinc-400 font-normal lowercase">(Thay thế phần phụ tùng cũ bằng dịch vụ bảo dưỡng)</span>
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-r from-red-950/40 to-zinc-900 border border-red-900/50 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-white">{invoiceMaintenancePackage.tenGoi}</div>
                    <div className="text-sm font-extrabold text-red-400 font-mono">{formatVND(invoiceMaintenancePackage.gia)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPackageSelector(prev => !prev)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <span>✏️</span> <span>Thay đổi gói</span>
                  </button>
                </div>

                {showPackageSelector && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {maintenancePackagesList.map(pkg => (
                      <div
                        key={pkg.id}
                        onClick={() => {
                          setInvoiceMaintenancePackage(pkg);
                          setShowPackageSelector(false);
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          invoiceMaintenancePackage.id === pkg.id
                            ? 'bg-red-900/30 border-red-500 text-white'
                            : 'bg-zinc-800/80 border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{pkg.tenGoi}</div>
                          <div className="text-[10px] text-zinc-400 line-clamp-1">{pkg.moTa}</div>
                        </div>
                        <span className="text-xs font-mono font-bold text-red-400">{formatVND(pkg.gia)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. PHỤ TÙNG PHÁT SINH / THAY THẾ */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-zinc-300 font-mono tracking-wider">
                  {activeInvoiceType === 'BaoDuong' ? '3. PHỤ TÙNG PHÁT SINH' : '2. PHỤ TÙNG THAY THẾ'}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {invoiceParts.length} món đã chọn
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt('Nhập tên phụ tùng phát sinh khác:');
                      if (name && name.trim()) {
                        const priceStr = prompt('Nhập đơn giá (VNĐ):', '100000');
                        const price = priceStr ? parseInt(priceStr.replace(/\D/g, '')) || 0 : 100000;
                        handleAddCustomPart(name.trim(), price);
                      }
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer flex items-center gap-1"
                    title="Thêm phụ tùng không có sẵn trong danh mục"
                  >
                    <span>+</span> <span>Thêm phụ tùng khác</span>
                  </button>
                </div>
              </div>

              {/* Ô tìm kiếm phụ tùng */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">🔍</span>
                <input
                  type="text"
                  value={partSearchQuery}
                  onChange={e => setPartSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm nhanh phụ tùng, phụ kiện..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
                {partSearchQuery.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-zinc-700/60">
                    {mockParts
                      .filter(p => matchVietnameseSearch(p.tenSanPham, partSearchQuery) || p.id.toLowerCase().includes(partSearchQuery.toLowerCase()))
                      .slice(0, 6)
                      .map(part => (
                        <div
                          key={part.id}
                          onClick={() => handleAddPartToInvoice(part)}
                          className="p-2 hover:bg-zinc-700 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <img src={part.hinhAnh} alt="" className="w-7 h-7 object-cover rounded-lg bg-zinc-700" />
                            <div>
                              <div className="text-white font-semibold">{part.tenSanPham}</div>
                              <div className="text-[10px] text-zinc-400 font-mono">SKU: {(part as any).maSKU || part.id} · Còn {part.soLuongTon} món</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-red-400 font-mono font-bold">{formatVND(part.giaKhuyenMai ?? part.giaGoc)}</div>
                            <span className="text-[10px] text-emerald-400 font-semibold">+ Thêm</span>
                          </div>
                        </div>
                      ))}
                    <div
                      onClick={() => handleAddCustomPart(partSearchQuery)}
                      className="p-2.5 bg-red-950/40 hover:bg-red-900/50 text-red-300 font-semibold cursor-pointer flex items-center justify-between text-xs border-t border-zinc-700/60"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>➕</span> <span>Thêm phụ tùng phát sinh khác: <strong className="text-white">"{partSearchQuery}"</strong></span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">(Tùy chỉnh giá)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Danh sách phụ tùng đã chọn */}
              {invoiceParts.length > 0 && (
                <div className="rounded-xl border border-zinc-700/80 overflow-hidden divide-y divide-zinc-700/60 bg-zinc-800/40">
                  <div className="grid grid-cols-12 gap-2 p-2 text-[10px] font-bold text-zinc-400 uppercase font-mono">
                    <div className="col-span-5">Tên phụ tùng/dịch vụ</div>
                    <div className="col-span-3 text-center">Số lượng</div>
                    <div className="col-span-2 text-right">Đơn giá</div>
                    <div className="col-span-2 text-right">Thành tiền</div>
                  </div>
                  {invoiceParts.map(item => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 p-2 items-center text-xs">
                      <div className="col-span-5 flex items-center gap-2">
                        {item.hinhAnh && (
                          <img src={item.hinhAnh} alt="" className="w-8 h-8 rounded-lg object-cover bg-zinc-700 shrink-0" />
                        )}
                        <div className="truncate">
                          <div className="text-white font-medium truncate">{item.tenSanPham}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">SKU: {item.sku}</div>
                        </div>
                      </div>
                      <div className="col-span-3 flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.soLuong > 1) {
                              setInvoiceParts(prev => prev.map(p => p.id === item.id ? { ...p, soLuong: p.soLuong - 1 } : p));
                            } else {
                              setInvoiceParts(prev => prev.filter(p => p.id !== item.id));
                            }
                          }}
                          className="w-5 h-5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-white">{item.soLuong}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setInvoiceParts(prev => prev.map(p => p.id === item.id ? { ...p, soLuong: p.soLuong + 1 } : p));
                          }}
                          className="w-5 h-5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                      <div className="col-span-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="5000"
                          value={item.donGia}
                          onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setInvoiceParts(prev => prev.map(p => p.id === item.id ? { ...p, donGia: val } : p));
                          }}
                          className="w-full text-right bg-zinc-900/80 border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-200 font-mono text-[11px] focus:outline-none focus:border-red-500"
                          title="Chỉnh sửa đơn giá phụ tùng"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1.5">
                        <span className="font-mono font-bold text-red-400 text-[11px]">
                          {formatVND(item.donGia * item.soLuong)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setInvoiceParts(prev => prev.filter(p => p.id !== item.id))}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Xóa phụ tùng này"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeInvoiceType === 'BaoDuong' && (
                <div className="flex items-center justify-end gap-4 text-xs font-mono text-zinc-400 pt-1">
                  <span>Gói bảo dưỡng: <strong className="text-white">{formatVND(invoiceMaintenancePackage.gia)}</strong></span>
                  <span>Phụ tùng phát sinh: <strong className="text-white">{formatVND(invoicePartsTotal)}</strong></span>
                </div>
              )}
            </div>

            {/* 4. TIỀN CÔNG DỊCH VỤ (Đối với Sửa Chữa) */}
            {activeInvoiceType === 'SuaChua' && (
              <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-zinc-300 font-mono tracking-wider">
                    3. TIỀN CÔNG DỊCH VỤ
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLaborFee}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/40 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>+</span> <span>Thêm công thợ</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {invoiceLaborFees.map(lb => (
                    <div key={lb.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="text"
                        value={lb.noiDung}
                        onChange={e => {
                          const val = e.target.value;
                          setInvoiceLaborFees(prev => prev.map(item => item.id === lb.id ? { ...item, noiDung: val } : item));
                        }}
                        placeholder="Tên công việc / công thợ..."
                        className="flex-1 p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs"
                      />
                      <input
                        type="number"
                        value={lb.tienCong}
                        onChange={e => {
                          const val = Number(e.target.value) || 0;
                          setInvoiceLaborFees(prev => prev.map(item => item.id === lb.id ? { ...item, tienCong: val } : item));
                        }}
                        className="w-28 p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono text-xs text-right"
                      />
                      <button
                        type="button"
                        onClick={() => setInvoiceLaborFees(prev => prev.filter(item => item.id !== lb.id))}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Xóa công thợ"
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-4 text-xs font-mono text-zinc-400 pt-1 border-t border-zinc-800">
                  <span>Tổng phụ tùng ({invoiceParts.length}): <strong className="text-white">{formatVND(invoicePartsTotal)}</strong></span>
                  <span>Tổng tiền công: <strong className="text-white">{formatVND(invoiceLaborTotal)}</strong></span>
                </div>
              </div>
            )}

            {/* Footer Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-800">
              <div className="text-sm font-bold text-zinc-300">
                Tổng thanh toán: <span className="text-lg font-black text-red-400 font-mono">{formatVND(serviceInvoiceTotal)}</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowServiceInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndPrintServiceInvoice}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white shadow-lg shadow-red-700/30 transition cursor-pointer flex items-center gap-2"
                >
                  <span>🖨️</span> <span>Tạo & In Hóa Đơn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FIX 104: MODAL IN HÓA ĐƠN DỊCH VỤ A4 (PRINT RECEIPT MODAL) ── */}
      {showReceiptModal && printReceiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-8 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧾</span>
                <div>
                  <h3 className="text-base font-extrabold uppercase font-mono text-zinc-900">
                    {printReceiptData.ghiChu?.toLowerCase().includes('bảo dưỡng') ? 'HÓA ĐƠN DỊCH VỤ BẢO DƯỠNG XE' : 'HÓA ĐƠN DỊCH VỤ SỬA CHỮA XE'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">Mã hóa đơn: #{printReceiptData.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Document Content */}
            <div id="print-service-invoice" className="space-y-4 text-xs font-sans">
              <div className="flex justify-between items-start border-b border-zinc-200 pb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-red-700">MOTOSHOP SHOWROOM & SERVICE</h4>
                  <p className="text-zinc-500 text-[11px]">Đại lý Ủy Quyền Xe Máy & Phụ Tùng Chính Hãng</p>
                  <p className="text-zinc-500 text-[11px]">Hotline: 1900 1234 · Địa chỉ: TP. Hồ Chí Minh</p>
                </div>
                <div className="text-right font-mono text-[11px] text-zinc-600">
                  <p>Ngày lập: {printReceiptData.ngayDat}</p>
                  <p>Kênh: Bán tại quầy</p>
                  <p className="text-emerald-700 font-bold">✓ ĐÃ THANH TOÁN</p>
                </div>
              </div>

              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>Khách hàng: <strong>{printReceiptData.hoTenKH}</strong></div>
                  <div>SĐT: <strong className="font-mono">{printReceiptData.soDienThoai}</strong></div>
                  <div>Phương tiện: <strong>{printReceiptData.thongTinXe?.tenXe}</strong></div>
                  <div>Biển số: <strong className="font-mono text-amber-700">{printReceiptData.thongTinXe?.bienSo}</strong></div>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 font-mono text-[11px] border-b border-zinc-200">
                    <tr>
                      <th className="p-2">Hạng mục / Dịch vụ</th>
                      <th className="p-2 text-center">SL</th>
                      <th className="p-2 text-right">Đơn giá</th>
                      <th className="p-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {printReceiptData.items?.map((it: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">{it.tenSanPham}</td>
                        <td className="p-2 text-center font-mono">{it.soLuong}</td>
                        <td className="p-2 text-right font-mono">{formatVND(it.donGia)}</td>
                        <td className="p-2 text-right font-mono font-bold">{formatVND(it.donGia * it.soLuong)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-zinc-200">
                <span>TỔNG TIỀN THANH TOÁN:</span>
                <span className="text-base text-red-700 font-mono font-black">{formatVND(printReceiptData.tongTien)}</span>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[11px] text-zinc-600">
                <div>
                  <p className="font-bold">Khách hàng</p>
                  <p className="italic text-[10px] text-zinc-400">(Ký và ghi rõ họ tên)</p>
                  <div className="h-14"></div>
                  <p className="font-semibold">{printReceiptData.hoTenKH}</p>
                </div>
                <div>
                  <p className="font-bold">Kỹ thuật viên</p>
                  <p className="italic text-[10px] text-zinc-400">(Kiểm tra và xác nhận)</p>
                  <div className="h-14"></div>
                  <p className="font-semibold">KTV. Trần Minh Long</p>
                </div>
                <div>
                  <p className="font-bold">Người lập hóa đơn</p>
                  <p className="italic text-[10px] text-zinc-400">(Ký xác nhận thu tiền)</p>
                  <div className="h-14"></div>
                  <p className="font-semibold">{currentStaff?.hoTen || 'Thu ngân Showroom'}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-md shadow-red-700/20 cursor-pointer flex items-center gap-1.5"
              >
                <span>🖨️</span> In Hóa Đơn (A4)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
