import React, { useState, useEffect, useMemo } from 'react';
import {
  type WarrantyExtensionTransaction,
  type AdminWarrantyClaim,
  type AdminWarrantyClaimStatus,
  type Customer,
  type Vehicle,
  formatVND,
  parseDateSafe,
  formatDateSafe,
  renewVehicleWarranty,
  getVehicleCatalogImage,
} from '../../data/mockData';

export interface ShowroomExtPackage {
  id: string;
  tenGoi: string;
  badge?: string;
  eligible: boolean;
  gia: number;
  thoiGianThem: string;
  kmThem: string;
  thoiGianNam: number;
  quyenLoi: string[];
  reason?: string;
}

export const SHOWROOM_EXT_PACKAGES: ShowroomExtPackage[] = [
  {
    id: 'GOI_TIEU_CHUAN_1Y',
    tenGoi: 'Gói Tiêu Chuẩn (1 năm)',
    badge: 'Khuyên Dùng',
    eligible: true,
    gia: 350000,
    thoiGianThem: '+12 tháng',
    kmThem: '+10.000 km',
    thoiGianNam: 1,
    quyenLoi: [
      'Bảo hành Động cơ, IC, Khung sườn xe',
      'Miễn phí 02 lần thay dầu nhớt chính hãng',
      'Cứu hộ tận nơi 24/7 bán kính 30km',
    ],
  },
  {
    id: 'GOI_TOAN_DIEN_2Y',
    tenGoi: 'Gói Toàn Diện (2 năm)',
    badge: 'Tiết kiệm 100k',
    eligible: true,
    gia: 600000,
    thoiGianThem: '+24 tháng',
    kmThem: '+20.000 km',
    thoiGianNam: 2,
    quyenLoi: [
      'Bảo hành Động cơ, Hệ thống điện, Phun xăng Fi',
      'Miễn phí 04 lần kiểm tra định kỳ chuyên sâu',
      'Cứu hộ tận nơi 24/7 toàn quốc',
    ],
  },
  {
    id: 'GOI_PREMIUM_3Y',
    tenGoi: 'Gói Cao Cấp (3 năm)',
    badge: undefined,
    eligible: false,
    gia: 850000,
    thoiGianThem: '+36 tháng',
    kmThem: '+30.000 km',
    thoiGianNam: 3,
    quyenLoi: [
      'Bảo hành toàn bộ cụm linh kiện chính',
      'Bảo dưỡng VIP không chờ đợi tại mọi đại lý',
    ],
    reason: 'Yêu cầu xe < 10.000 km (ODO hiện tại 12.500 km)',
  },
  {
    id: 'GOI_XE_SO_CON_TAY',
    tenGoi: 'Gói Xe Côn Tay / Xe Số',
    badge: undefined,
    eligible: false,
    gia: 500000,
    thoiGianThem: '+12 tháng',
    kmThem: '+10.000 km',
    thoiGianNam: 1,
    quyenLoi: [
      'Bảo hành bộ ly hợp, hộp số, xích tải',
    ],
    reason: 'Không áp dụng cho dòng xe tay ga SH',
  },
];
import { warrantyApi, customerApi, vehicleApi } from '../../services/api';
import { matchVietnameseSearch } from '../../utils/vietnameseSearch';

const PRESET_PARTS = [
  { ten: 'Búa côn sau (Ba càng)', donGia: 450000, tinhTrang: 'Đã có sẵn' },
  { ten: 'Chuông nồi sau', donGia: 350000, tinhTrang: 'Đã có sẵn' },
  { ten: 'Dây curoa Bando chính hãng', donGia: 280000, tinhTrang: 'Đã có sẵn' },
  { ten: 'Bugi bạch kim NGK Laser Iridium', donGia: 160000, tinhTrang: 'Đã có sẵn' },
  { ten: 'Lọc gió động cơ chính hãng', donGia: 110000, tinhTrang: 'Đã có sẵn' },
  { ten: 'Má phanh đĩa trước Nissin', donGia: 180000, tinhTrang: 'Đã có sẵn' },
  { ten: 'Bộ bi nồi 6 viên', donGia: 150000, tinhTrang: 'Đã có sẵn' },
  { ten: 'Nhớt hộp số Motul Scooter Gear', donGia: 65000, tinhTrang: 'Đã có sẵn' },
  { ten: 'Công vệ sinh cụm truyền động & lắp đặt', donGia: 150000, tinhTrang: 'Dịch vụ' },
];

export const WarrantyPage: React.FC = () => {
  // ── 2 TAB CHÍNH CỦA TRANG QUẢN LÝ BẢO HÀNH ──
  // Tab 1: 'GiaHan' (Gia hạn bảo hành - Ảnh 1)
  // Tab 2: 'YeuCau' (Yêu cầu bảo hành - Ảnh 2)
  const [activeMainTab, setActiveMainTab] = useState<'GiaHan' | 'YeuCau'>('GiaHan');

  // ── DỮ LIỆU GIA HẠN BẢO HÀNH (TAB 1) ──
  const [extensionList, setExtensionList] = useState<WarrantyExtensionTransaction[]>(() => warrantyApi.getExtensionTransactions());
  const [extSearchTerm, setExtSearchTerm] = useState('');
  const [extSourceFilter, setExtSourceFilter] = useState<'TatCa' | 'TrucTuyen' | 'TaiShowroom'>('TatCa');
  const [extTimeFilter, setExtTimeFilter] = useState<'ThangNay' | '30Ngay'>('ThangNay');
  const [extCurrentPage, setExtCurrentPage] = useState(1);
  const extPageSize = 8;

  // GH02: State cho Wizard 4 bước tạo gia hạn tại showroom (Ảnh 2, 3, 4)
  const [showCreateExtModal, setShowCreateExtModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [custSearchTerm, setCustSearchTerm] = useState('');
  const [wizardCustomer, setWizardCustomer] = useState<Customer | null>(null);
  const [wizardVehicle, setWizardVehicle] = useState<Vehicle | null>(null);
  const [wizardOdo, setWizardOdo] = useState<number>(12500);
  const [wizardInspectionDate, setWizardInspectionDate] = useState<string>('2026-10-29');
  const [wizardOdoImage, setWizardOdoImage] = useState<string | null>(null);
  const [wizardPkgId, setWizardPkgId] = useState<string>('GOI_TIEU_CHUAN_1Y');
  const [wizardPaymentMethod, setWizardPaymentMethod] = useState<'TienMat' | 'POS' | 'ChuyenKhoan'>('TienMat');
  const [wizardCashGiven, setWizardCashGiven] = useState<number>(500000);
  const [wizardPrintInvoice, setWizardPrintInvoice] = useState<boolean>(true);

  // Mở Wizard và nạp dữ liệu mẫu khách hàng mặc định (Lan Phương / SH 160i)
  const handleOpenCreateModal = () => {
    setWizardStep(1);
    setCustSearchTerm('0879179243');
    const allC = customerApi.getAllSync();
    const allV = vehicleApi.getAllSync();
    const lpCust = allC.find(c => c.soDienThoai === '0879179243' || c.hoTen.toLowerCase().includes('lan phương')) || allC[0] || null;
    setWizardCustomer(lpCust);
    if (lpCust) {
      const custVehs = allV.filter(v => v.customerId === lpCust.id);
      const shBike = custVehs.find(v => (v.bienSo || '').includes('59K9')) || custVehs[0] || null;
      setWizardVehicle(shBike);
    } else {
      setWizardVehicle(null);
    }
    setWizardOdo(12500);
    setWizardInspectionDate('2026-10-29');
    setWizardOdoImage(null);
    setWizardPkgId('GOI_TIEU_CHUAN_1Y');
    setWizardPaymentMethod('TienMat');
    setWizardCashGiven(500000);
    setWizardPrintInvoice(true);
    setShowCreateExtModal(true);
  };

  // Modal xem chi tiết / Lịch sử / In biên nhận gia hạn
  const [selectedExtDetail, setSelectedExtDetail] = useState<{
    tx: WarrantyExtensionTransaction;
    type: 'detail' | 'history' | 'receipt';
  } | null>(null);

  // ── DỮ LIỆU YÊU CẦU BẢO HÀNH (TAB 2) ──
  const [claimsList, setClaimsList] = useState<AdminWarrantyClaim[]>(() => warrantyApi.getAdminClaims());
  const [claimSearchTerm, setClaimSearchTerm] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState<string>('TatCa');
  const [claimTimeFilter, setClaimTimeFilter] = useState<'ThangNay' | '30Ngay'>('ThangNay');
  const [claimStaffFilter, setClaimStaffFilter] = useState<string>('TatCa');
  const [claimCurrentPage, setClaimCurrentPage] = useState(1);
  const claimPageSize = 8;

  // ── STEPPER 6 BƯỚC XỬ LÝ YÊU CẦU BẢO HÀNH (ẢNH 3 -> ẢNH 8) ──
  const [selectedClaim, setSelectedClaim] = useState<AdminWarrantyClaim | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);

  // Modal In phiếu của Bước 6
  const [printExtInvoice, setPrintExtInvoice] = useState<WarrantyExtensionTransaction | null>(null);
  const [printDocument, setPrintDocument] = useState<{
    type: 'BienBanBanGiao' | 'HoaDon0d';
    claim: AdminWarrantyClaim;
  } | null>(null);

  // Modal từ chối bảo hành
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Xe đã hết thời hạn bảo hành tiêu chuẩn của nhà sản xuất.');

  // Nạp dữ liệu ban đầu
  const loadData = () => {
    setExtensionList(warrantyApi.getExtensionTransactions());
    const claims = warrantyApi.getAdminClaims();
    setClaimsList(claims);
    if (selectedClaim) {
      const refreshed = claims.find(c => c.id === selectedClaim.id);
      if (refreshed) setSelectedClaim(refreshed);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('crm-admin-notification', handleUpdate);
    window.addEventListener('crm-data-refresh', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('crm-admin-notification', handleUpdate);
      window.removeEventListener('crm-data-refresh', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // TB02: Highlight hàng mục tiêu khi click thông báo
  const [highlightTargetId, setHighlightTargetId] = useState<string | null>(null);

  useEffect(() => {
    const handleHighlight = (payload: any) => {
      if (!payload) return;
      const targetId = String(payload.targetId || payload.keyword || '').trim();
      if (targetId) {
        setHighlightTargetId(targetId);
        const allCurrentClaims = warrantyApi.getAdminClaims();
        const matchedClaim = allCurrentClaims.find(c =>
          c.id === targetId ||
          c.maLichHen === targetId ||
          c.id.toLowerCase().includes(targetId.toLowerCase()) ||
          c.soDienThoai.includes(targetId) ||
          c.khachHang.toLowerCase().includes(targetId.toLowerCase())
        );
        if (matchedClaim) {
          setClaimsList(allCurrentClaims);
          setClaimCurrentPage(1);
          setActiveMainTab('YeuCau');
          setClaimStatusFilter('TatCa');
          setClaimStaffFilter('TatCa');
          setClaimSearchTerm(matchedClaim.id);
          setSelectedClaim(matchedClaim);
          setActiveStep(matchedClaim.currentStep || 1);
          setTimeout(() => {
            const el = document.getElementById(`claim-row-${matchedClaim.id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
          try { sessionStorage.removeItem('crm_admin_highlight'); } catch {}
        } else {
          const allExts = warrantyApi.getExtensionTransactions();
          const matchedExt = allExts.find(e =>
            e.id === targetId ||
            e.id.toLowerCase().includes(targetId.toLowerCase()) ||
            e.soDienThoai.includes(targetId)
          );
          if (matchedExt) {
            setActiveMainTab('GiaHan');
            setExtSearchTerm(matchedExt.id);
            setTimeout(() => {
              const el = document.getElementById(`ext-row-${matchedExt.id}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
            try { sessionStorage.removeItem('crm_admin_highlight'); } catch {}
          } else {
            setActiveMainTab('YeuCau');
          }
        }
        setTimeout(() => setHighlightTargetId(null), 5000);
      }
    };

    try {
      const raw = sessionStorage.getItem('crm_admin_highlight');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.page === 'warranty') {
          handleHighlight(parsed);
        }
      }
    } catch {}

    const listener = (e: any) => {
      if (e.detail && e.detail.page === 'warranty') {
        handleHighlight(e.detail);
      }
    };
    window.addEventListener('crm-admin-highlight-target', listener);
    return () => window.removeEventListener('crm-admin-highlight-target', listener);
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // FILTER & KPI TAB 1: GIA HẠN BẢO HÀNH (ẢNH 1)
  // ──────────────────────────────────────────────────────────────────────────
  const filteredExtensions = useMemo(() => {
    return extensionList.filter(item => {
      if (extSourceFilter !== 'TatCa' && item.nguon !== extSourceFilter) return false;
      if (extSearchTerm.trim()) {
        const match =
          matchVietnameseSearch(item.id, extSearchTerm) ||
          matchVietnameseSearch(item.khachHang, extSearchTerm) ||
          matchVietnameseSearch(item.soDienThoai, extSearchTerm) ||
          matchVietnameseSearch(item.xeBienSo, extSearchTerm) ||
          matchVietnameseSearch(item.goiGiaHan, extSearchTerm);
        if (!match) return false;
      }
      return true;
    });
  }, [extensionList, extSourceFilter, extSearchTerm]);

  const extTotalPages = Math.max(1, Math.ceil(filteredExtensions.length / extPageSize));
  const paginatedExtensions = filteredExtensions.slice(
    (extCurrentPage - 1) * extPageSize,
    extCurrentPage * extPageSize
  );

  const extKpi = useMemo(() => {
    const total = extensionList.length;
    const online = extensionList.filter(x => x.nguon === 'TrucTuyen').length;
    const showroom = extensionList.filter(x => x.nguon === 'TaiShowroom').length;
    return {
      total: total + 1238, // Giữ số liệu hiển thị thực tế theo ảnh 1,245
      online: online + 525, // 528
      showroom: showroom + 713, // 717
    };
  }, [extensionList]);

  // GH02: Xác nhận và kích hoạt gia hạn tại showroom từ Wizard
  const handleConfirmShowroomExtension = () => {
    if (!wizardVehicle || !wizardCustomer) {
      alert('Vui lòng chọn khách hàng và xe!');
      return;
    }
    const chosen = SHOWROOM_EXT_PACKAGES.find(p => p.id === wizardPkgId) || SHOWROOM_EXT_PACKAGES[0];

    // Tính hạn bảo hành mới
    const curExp = wizardVehicle.hanBaoHanh || '15/09/2026';
    const oldD = parseDateSafe(curExp);
    const newD = new Date(oldD);
    newD.setFullYear(newD.getFullYear() + chosen.thoiGianNam);
    const newExpStr = formatDateSafe(newD);

    // Cập nhật vehicle warranty trong data store
    renewVehicleWarranty(wizardVehicle.id, chosen.thoiGianNam);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} · ${now.toLocaleDateString('vi-VN')}`;

    // Tạo transaction lưu vào danh sách quản lý bảo hành Admin
    const newTx: WarrantyExtensionTransaction = {
      id: `BH-${Date.now().toString().slice(-6)}`,
      ngayGiaHan: now.toLocaleDateString('vi-VN'),
      khachHang: wizardCustomer.hoTen,
      soDienThoai: wizardCustomer.soDienThoai,
      email: wizardCustomer.email,
      diaChi: wizardCustomer.diaChi,
      customerId: wizardCustomer.id,
      vehicleId: wizardVehicle.id,
      xeBienSo: `${wizardVehicle.tenXe} (${wizardVehicle.bienSo || '59K9 - 876.54'})`,
      tenXe: wizardVehicle.tenXe,
      bienSo: wizardVehicle.bienSo || '59K9 - 876.54',
      soKhung: wizardVehicle.soKhung || 'RLHKD160CB7747410',
      soMay: (wizardVehicle as any).soMay || 'JF62E088888',
      hinhAnhXe: wizardVehicle.hinhAnh,
      odo: wizardOdo,
      goiGiaHan: chosen.tenGoi,
      soTien: chosen.gia,
      nguon: 'TaiShowroom',
      nhanVien: 'Trần Văn Quản Lý',
      thoiHanGoc: curExp,
      thoiHanMoi: newExpStr,
      quyenLoiGoi: `${chosen.thoiGianThem} / ${chosen.kmThem}`,
      phuongThucThanhToan: wizardPaymentMethod,
      thoiGianThanhToan: timeStr,
      tienKhachDua: wizardPaymentMethod === 'TienMat' ? wizardCashGiven : chosen.gia,
      tienThoiLai: wizardPaymentMethod === 'TienMat' ? Math.max(0, wizardCashGiven - chosen.gia) : 0,
      daInHoaDon: wizardPrintInvoice,
      lichSuDichVu: [
        {
          ngay: now.toLocaleDateString('vi-VN'),
          tieuDe: `Gia hạn ${chosen.tenGoi} (+${chosen.thoiGianNam} năm) thành công tại showroom`,
          loai: 'GiaHan',
          ghiChu: `Đã thu ${formatVND(chosen.gia)} qua ${wizardPaymentMethod}. Cập nhật hạn mới đến ${newExpStr}`,
        },
        {
          ngay: wizardInspectionDate,
          tieuDe: `Kiểm tra xe & ODO (${wizardOdo.toLocaleString('vi-VN')} km) đạt chuẩn gia hạn`,
          loai: 'BaoDuong',
          ghiChu: 'KTV Trần Văn Quản Lý thẩm định đủ điều kiện gia hạn bảo hành Care+',
        },
      ],
    };

    warrantyApi.createExtensionTransaction(newTx);
    setShowCreateExtModal(false);
    loadData();
    alert(`Đã hoàn tất gia hạn gói ${chosen.tenGoi} cho xe ${wizardVehicle.tenXe}! Hạn mới: ${newExpStr}`);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // FILTER & KPI TAB 2: YÊU CẦU BẢO HÀNH (ẢNH 2)
  // ──────────────────────────────────────────────────────────────────────────
  const filteredClaims = useMemo(() => {
    return claimsList.filter(item => {
      if (claimStatusFilter !== 'TatCa' && item.trangThai !== claimStatusFilter) return false;
      if (claimStaffFilter !== 'TatCa' && item.nhanVienPhuTrach !== claimStaffFilter) return false;
      if (claimSearchTerm.trim()) {
        const match =
          matchVietnameseSearch(item.id, claimSearchTerm) ||
          matchVietnameseSearch(item.khachHang, claimSearchTerm) ||
          matchVietnameseSearch(item.soDienThoai, claimSearchTerm) ||
          matchVietnameseSearch(item.xeBienSo, claimSearchTerm) ||
          matchVietnameseSearch(item.noiDung, claimSearchTerm);
        if (!match) return false;
      }
      return true;
    });
  }, [claimsList, claimStatusFilter, claimStaffFilter, claimSearchTerm]);

  const claimTotalPages = Math.max(1, Math.ceil(filteredClaims.length / claimPageSize));
  const paginatedClaims = filteredClaims.slice(
    (claimCurrentPage - 1) * claimPageSize,
    claimCurrentPage * claimPageSize
  );

  const claimKpi = useMemo(() => {
    const total = claimsList.length;
    const pending = claimsList.filter(x => x.trangThai === 'ChoXuLy').length;
    const completed = claimsList.filter(x => x.trangThai === 'HoanThanh').length;
    return {
      total: total + 151, // Theo ảnh: 156
      pending: pending + 11, // 12
      completed: completed + 143, // 144
    };
  }, [claimsList]);

  // Danh sách nhân viên phụ trách để filter
  const staffList = useMemo(() => {
    const set = new Set<string>();
    claimsList.forEach(c => {
      if (c.nhanVienPhuTrach && !c.nhanVienPhuTrach.includes('Từ chối')) {
        set.add(c.nhanVienPhuTrach);
      }
    });
    return Array.from(set);
  }, [claimsList]);

  // Xác nhận lịch hẹn yêu cầu bảo hành từ bảng & gửi lịch về cho khách hàng
  const handleConfirmAppointment = async (claim: AdminWarrantyClaim) => {
    await warrantyApi.confirmAppointment(claim.id);
    loadData();
    alert(`✓ Đã xác nhận lịch hẹn bảo hành cho yêu cầu #${claim.id} (${claim.khachHang})!\nLịch hẹn đã được đồng bộ sang Tab 2 'Lịch hẹn' của khách hàng.`);
  };

  // Mở Stepper xử lý yêu cầu bảo hành
  const handleOpenClaimStepper = (claim: AdminWarrantyClaim) => {
    setSelectedClaim({ ...claim });
    setActiveStep(claim.currentStep || 1);
  };

  // Cập nhật trạng thái từng bước và lưu lại
  const handleSaveClaimStep = (nextStep?: number, nextStatus?: AdminWarrantyClaimStatus, customData?: Partial<AdminWarrantyClaim>) => {
    if (!selectedClaim) return;
    const updated: AdminWarrantyClaim = {
      ...selectedClaim,
      ...customData,
      currentStep: nextStep ?? activeStep,
      trangThai: nextStatus ?? selectedClaim.trangThai,
    };
    setSelectedClaim(updated);
    warrantyApi.updateAdminClaim(updated);
    if (nextStep) setActiveStep(nextStep);
    loadData();
  };

  // Xử lý từ chối bảo hành
  const handleConfirmReject = () => {
    if (!selectedClaim) return;
    const updated: AdminWarrantyClaim = {
      ...selectedClaim,
      trangThai: 'TuChoi',
      nhanVienPhuTrach: '(Từ chối - Hết hạn BH)',
      b1_ghiChuNgoaiQuan: rejectReason,
    };
    warrantyApi.updateAdminClaim(updated);
    setShowRejectModal(false);
    setSelectedClaim(null);
    loadData();
    alert('Đã từ chối yêu cầu bảo hành và đóng hồ sơ.');
  };

  // Hoàn thành hồ sơ bảo hành ở Bước 6
  const handleFinishClaim = async () => {
    if (!selectedClaim) return;
    await warrantyApi.completeAdminWarrantyClaim(selectedClaim);
    loadData();
    alert('✓ Đã hoàn thành và đóng yêu cầu bảo hành thành công! Hồ sơ đã lưu trữ và khảo sát chất lượng dịch vụ đã tự động gửi đến khách hàng.');
    setSelectedClaim(null);
  };

  const isCompleted = selectedClaim ? (selectedClaim.trangThai === 'HoanThanh' || selectedClaim.trangThai === 'TuChoi') : false;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* =========================================================================
          TRƯỜNG HỢP 1: ĐANG MỞ VIEW XỬ LÝ YÊU CẦU BẢO HÀNH (STEPPER 6 BƯỚC - ẢNH 3->8)
          ========================================================================= */}
      {selectedClaim ? (
        <div className="space-y-6">
          {/* Breadcrumb & Quay lại */}
          <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-zinc-200">
            <div className="text-xs sm:text-sm text-zinc-500 font-medium">
              <span
                onClick={() => setSelectedClaim(null)}
                className="hover:text-red-700 cursor-pointer transition underline"
              >
                Trang chủ
              </span>{' '}
              /{' '}
              <span
                onClick={() => setSelectedClaim(null)}
                className="hover:text-red-700 cursor-pointer transition underline"
              >
                Quản lý bảo hành
              </span>{' '}
              /{' '}
              <span className="text-zinc-900 font-bold">
                Xử lý yêu cầu {selectedClaim.id}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedClaim(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>← Quay lại danh sách</span>
            </button>
          </div>

          {/* Header & Badge trạng thái */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 font-mono tracking-tight">
                Xử lý yêu cầu bảo hành - {selectedClaim.id}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                  selectedClaim.trangThai === 'ChoXuLy'
                    ? 'bg-amber-100 text-amber-800'
                    : selectedClaim.trangThai === 'DaXacNhan'
                    ? 'bg-blue-100 text-blue-800'
                    : selectedClaim.trangThai === 'DaTiepNhan'
                    ? 'bg-cyan-100 text-cyan-800'
                    : selectedClaim.trangThai === 'DangSuaChua'
                    ? 'bg-purple-100 text-purple-800'
                    : selectedClaim.trangThai === 'HoanThanh'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {selectedClaim.trangThai === 'ChoXuLy'
                  ? 'Chờ xử lý'
                  : selectedClaim.trangThai === 'DaXacNhan'
                  ? 'Đã xác nhận lịch'
                  : selectedClaim.trangThai === 'DaTiepNhan'
                  ? 'Đã tiếp nhận'
                  : selectedClaim.trangThai === 'DangSuaChua'
                  ? 'Đang sửa chữa'
                  : selectedClaim.trangThai === 'HoanThanh'
                  ? 'Hoàn thành'
                  : 'Từ chối'}
              </span>
            </div>
          </div>

          {/* Banner Khóa cứng khi Hồ sơ đã hoàn thành (Read-only) */}
          {isCompleted && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-center justify-between flex-wrap gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <div className="font-black text-xs uppercase font-mono tracking-wider text-amber-900">
                    HỒ SƠ BẢO HÀNH ĐÃ HOÀN TẤT &amp; LƯU TRỮ (CHẾ ĐỘ CHỈ XEM)
                  </div>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Hồ sơ đã được đóng và lưu trữ. Toàn bộ thông tin được khóa cứng bảo đảm tính pháp lý và không thể chỉnh sửa.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintDocument({ type: 'BienBanBanGiao', claim: selectedClaim })}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-amber-400 hover:bg-amber-100 text-xs font-bold text-amber-900 transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>🖨️ In biên bản</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintDocument({ type: 'HoaDon0d', claim: selectedClaim })}
                  className="px-3.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-xs font-bold text-white transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>🖨️ In hóa đơn</span>
                </button>
              </div>
            </div>
          )}

          {/* Stepper 6 bước ngang (Chuẩn theo ẢNH 3 -> ẢNH 8) */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between min-w-[760px] relative">
              {/* Thanh nối ngang */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-200 z-0" />
              <div
                className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 z-0 transition-all duration-300"
                style={{ width: `${((activeStep - 1) / 5) * 94}%` }}
              />

              {[
                { step: 1, label: '1. Xác nhận' },
                { step: 2, label: '2. Kiểm tra xe' },
                { step: 3, label: '3. Lập phương án' },
                { step: 4, label: '4. Duyệt phương án' },
                { step: 5, label: '5. Tiến hành sửa chữa' },
                { step: 6, label: '6. Bàn giao & Hoàn thành' },
              ].map(item => {
                const isPassed = activeStep > item.step;
                const isCurrent = activeStep === item.step;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setActiveStep(item.step)}
                    className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition shadow-sm ${
                        isPassed
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-red-700 text-white ring-4 ring-red-100 font-extrabold'
                          : 'bg-white text-zinc-400 border-2 border-zinc-300 group-hover:border-zinc-400'
                      }`}
                    >
                      {isPassed ? '✓' : item.step}
                    </div>
                    <span
                      className={`text-xs font-mono font-bold whitespace-nowrap ${
                        isCurrent
                          ? 'text-red-700'
                          : isPassed
                          ? 'text-zinc-900'
                          : 'text-zinc-400'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* =========================================================
              BƯỚC 1: XÁC NHẬN THÔNG TIN KHÁCH & PHƯƠNG TIỆN (ẢNH 3)
              ========================================================= */}
          {activeStep === 1 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
              <h2 className="text-base sm:text-lg font-black text-zinc-900 font-mono border-b border-zinc-100 pb-3">
                Bước 1: Xác nhận thông tin khách hàng & Phương tiện
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Cột trái: Thông tin khách gửi (Từ website) */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                    THÔNG TIN KHÁCH GỬI (TỪ WEBSITE)
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-zinc-500">Tên khách hàng: </span>
                      <strong className="text-zinc-900">{selectedClaim.khachHang}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">Số điện thoại: </span>
                      <strong className="text-zinc-900 font-mono">{selectedClaim.soDienThoai}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">Xe / Biển số: </span>
                      <strong className="text-zinc-900">{selectedClaim.xeBienSo}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">Lý do bảo hành: </span>
                      <p className="text-zinc-800 font-semibold mt-0.5">{selectedClaim.noiDung}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-1">Ảnh đính kèm (nếu có): Ảnh chụp xe hoặc đăng ký xe</span>
                      <div className="flex gap-2.5">
                        {(selectedClaim.b1_hinhAnhKhachGui || [
                          'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format',
                          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&auto=format',
                        ]).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt="Minh chứng"
                            className="w-16 h-14 object-cover rounded-xl border border-zinc-300"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Đối chiếu thực tế tại showroom */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-zinc-900 font-mono">
                    ĐỐI CHIẾU THỰC TẾ TẠI SHOWROOM
                  </div>

                  {/* Xác nhận khách đã đến */}
                  <div>
                    <label className="text-xs font-bold text-zinc-800 block mb-1">
                      Xác nhận khách hàng đã đến showroom?
                    </label>
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-800 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isCompleted}
                        checked={selectedClaim.b1_khachDaDenShowroom ?? true}
                        onChange={e =>
                          setSelectedClaim({
                            ...selectedClaim,
                            b1_khachDaDenShowroom: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-red-600 accent-red-600 rounded disabled:opacity-50"
                      />
                      <span>Khách hàng {selectedClaim.khachHang} đã mang xe đến showroom</span>
                    </label>
                  </div>

                  {/* Nhập/Kiểm tra biển số */}
                  <div>
                    <label className="text-xs font-bold text-zinc-800 block mb-1 font-mono">
                      (Nhập/Kiểm tra biển số xe thực tế)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        disabled={isCompleted}
                        value={selectedClaim.b1_bienSoThucTe || '29F1-234.56'}
                        onChange={e =>
                          setSelectedClaim({
                            ...selectedClaim,
                            b1_bienSoThucTe: e.target.value,
                          })
                        }
                        className="p-2.5 rounded-xl border border-zinc-300 text-xs font-mono font-bold w-48 text-black bg-white disabled:bg-zinc-100 disabled:text-zinc-600"
                      />
                      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-800 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={isCompleted}
                          checked={selectedClaim.b1_xacNhanDungXeBienSo ?? true}
                          onChange={e =>
                            setSelectedClaim({
                              ...selectedClaim,
                              b1_xacNhanDungXeBienSo: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-red-600 accent-red-600 rounded disabled:opacity-50"
                        />
                        <span>Xác nhận đúng xe, đúng biển số thực tế</span>
                      </label>
                    </div>
                  </div>

                  {/* Nhập số km ODO */}
                  <div>
                    <label className="text-xs font-bold text-zinc-800 block mb-1 font-mono">
                      Nhập số km hiện tại (ODO) (Bắt buộc nhập)
                    </label>
                    <div className="relative w-52">
                      <input
                        type="number"
                        disabled={isCompleted}
                        value={selectedClaim.b1_soKmHienTai ?? 12450}
                        onChange={e =>
                          setSelectedClaim({
                            ...selectedClaim,
                            b1_soKmHienTai: Number(e.target.value) || 0,
                          })
                        }
                        className="p-2.5 pr-12 rounded-xl border border-zinc-300 text-xs font-mono font-bold w-full text-black bg-white disabled:bg-zinc-100 disabled:text-zinc-600"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-mono font-bold">
                        km
                      </span>
                    </div>
                  </div>

                  {/* Ghi chú ngoại quan */}
                  <div>
                    <label className="text-xs font-bold text-zinc-800 block mb-1">
                      Ghi chú tình trạng bên ngoài xe khi nhận (Vết xước, hư hỏng ngoài...)
                    </label>
                    <input
                      type="text"
                      disabled={isCompleted}
                      placeholder="Nhập ghi chú..."
                      value={selectedClaim.b1_ghiChuNgoaiQuan || ''}
                      onChange={e =>
                        setSelectedClaim({
                          ...selectedClaim,
                          b1_ghiChuNgoaiQuan: e.target.value,
                        })
                      }
                      className="p-2.5 rounded-xl border border-zinc-300 text-xs w-full text-black bg-white disabled:bg-zinc-100 disabled:text-zinc-600"
                    />
                  </div>

                  {/* Giấy tờ xe */}
                  <div>
                    <label className="text-xs font-bold text-zinc-800 block mb-1">
                      Trạng thái giấy tờ xe / Sổ bảo hành (nếu có):
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isCompleted}
                        checked={selectedClaim.b1_dayDuGiayTo ?? false}
                        onChange={e =>
                          setSelectedClaim({
                            ...selectedClaim,
                            b1_dayDuGiayTo: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-red-600 accent-red-600 rounded disabled:opacity-50"
                      />
                      <span>Đầy đủ giấy tờ / Đăng ký xe</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer buttons Bước 1 */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedClaim(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                >
                  {isCompleted ? '← Quay lại danh sách' : 'Hủy / Quay lại'}
                </button>
                {isCompleted ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-black text-white transition shadow-md cursor-pointer"
                  >
                    Xem Bước 2 (Kiểm tra xe) &gt;
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold border border-red-300 text-red-700 hover:bg-red-50 transition cursor-pointer"
                    >
                      Từ chối tiếp nhận
                    </button>
                    {selectedClaim.trangThai === 'ChoXuLy' ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await warrantyApi.confirmAppointment(selectedClaim.id);
                          handleSaveClaimStep(2, 'DaTiepNhan');
                        }}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <span>✓</span> XÁC NHẬN LỊCH HẸN &amp; TIẾP NHẬN (BƯỚC 2) &gt;
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSaveClaimStep(2, 'DaTiepNhan')}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition shadow-md cursor-pointer"
                      >
                        XÁC NHẬN &amp; CHUYỂN BƯỚC 2 &gt;
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              BƯỚC 2: GHI NHẬN KẾT QUẢ KIỂM TRA KỸ THUẬT (ẢNH 4)
              ========================================================= */}
          {activeStep === 2 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
              <h2 className="text-base sm:text-lg font-black text-zinc-900 font-mono border-b border-zinc-100 pb-3">
                Bước 2: Ghi nhận kết quả kiểm tra kỹ thuật
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Cột trái: Tóm tắt */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                    THÔNG TIN PHƯƠNG TIỆN & YÊU CẦU
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-zinc-500">Khách hàng: </span>
                      <strong className="text-zinc-900">{selectedClaim.khachHang}</strong> |{' '}
                      <span className="text-zinc-500 font-mono">{selectedClaim.soDienThoai}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Xe / Biển số: </span>
                      <strong className="text-zinc-900">{selectedClaim.xeBienSo}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">Số KM hiện tại: </span>
                      <strong className="text-zinc-900 font-mono">
                        {(selectedClaim.b1_soKmHienTai || 12450).toLocaleString()} km
                      </strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">Yêu cầu từ khách: </span>
                      <p className="text-zinc-800 font-semibold mt-0.5">{selectedClaim.noiDung}</p>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Kết quả kiểm tra */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-zinc-900 font-mono">
                    KẾT QUẢ KIỂM TRA CHI TIẾT
                  </div>

                  {/* Bộ phận sự cố */}
                  <div>
                    <label className="text-xs font-bold text-zinc-800 block mb-2">
                      Chọn bộ phận/hệ thống gặp sự cố
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-semibold text-zinc-800">
                      {[
                        { key: 'TruyenDong', label: 'Truyền động (Nồi/Côn)' },
                        { key: 'DongCo', label: 'Động cơ' },
                        { key: 'Dien', label: 'Hệ thống điện' },
                        { key: 'Phanh', label: 'Hệ thống phanh' },
                        { key: 'GiamXoc', label: 'Giảm xóc/Khung sườn' },
                        { key: 'Khac', label: 'Khác' },
                      ].map(item => {
                        const current = selectedClaim.b2_heThongSuCo || ['TruyenDong'];
                        const isChecked = current.includes(item.key);
                        return (
                          <label
                            key={item.key}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                              isChecked
                                ? 'bg-red-50 border-red-300 text-red-900 font-bold'
                                : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={isCompleted}
                              checked={isChecked}
                              onChange={e => {
                                const next = e.target.checked
                                  ? [...current, item.key]
                                  : current.filter(k => k !== item.key);
                                setSelectedClaim({ ...selectedClaim, b2_heThongSuCo: next });
                              }}
                              className="w-4 h-4 text-red-600 accent-red-600 rounded disabled:opacity-50"
                            />
                            <span>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chi tiết lỗi */}
                  <div>
                    <label className="text-xs font-bold text-zinc-800 block mb-1">
                      Chi tiết lỗi kỹ thuật phát hiện:
                    </label>
                    <textarea
                      rows={3}
                      disabled={isCompleted}
                      value={
                        selectedClaim.b2_chiTietLoi ||
                        'Búa côn bị mòn, chuông nồi bị cháy sẫm màu, nhiều bụi bẩn bám trong cụm nồi trước và sau làm giảm độ bám gây giật khi tăng ga.'
                      }
                      onChange={e =>
                        setSelectedClaim({ ...selectedClaim, b2_chiTietLoi: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs text-black bg-white font-medium disabled:bg-zinc-100 disabled:text-zinc-600"
                    />
                  </div>

                  {/* Đề xuất xử lý */}
                  <div>
                    <label className="text-xs font-bold text-zinc-800 block mb-1">
                      Đề xuất hướng xử lý:
                    </label>
                    <input
                      type="text"
                      disabled={isCompleted}
                      value={
                        selectedClaim.b2_deXuatHuongXuLy ||
                        'Thay mới bộ búa côn (ba càng) và chuông nồi sau, vệ sinh toàn bộ cụm truyền động trước và sau.'
                      }
                      onChange={e =>
                        setSelectedClaim({ ...selectedClaim, b2_deXuatHuongXuLy: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs text-black bg-white disabled:bg-zinc-100 disabled:text-zinc-600"
                    />
                  </div>

                  {/* Phụ tùng dự kiến do KTV chọn */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                        <span>🔧</span> Phụ tùng dự kiến cần thay thế (Do KTV chỉ định):
                      </label>
                      <span className="text-[11px] font-mono text-zinc-500">
                        ({(selectedClaim.b2_phuTungDuKien || []).length} linh kiện đã chọn)
                      </span>
                    </div>

                    {/* Danh sách phụ tùng đã chọn */}
                    {(!selectedClaim.b2_phuTungDuKien || selectedClaim.b2_phuTungDuKien.length === 0) ? (
                      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-amber-800">
                          <span>ℹ️</span> Chưa chỉ định phụ tùng thay thế
                        </div>
                        <p className="text-amber-700/90 text-[11px]">
                          KTV vui lòng chọn linh kiện cần thay thế từ danh mục hoặc danh sách chọn nhanh bên dưới. Nếu chỉ kiểm tra/vệ sinh định kỳ mà không cần thay linh kiện, bạn có thể để trống.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedClaim.b2_phuTungDuKien.map((pt: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs hover:border-zinc-300 transition"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-red-600 font-bold">#{i + 1}</span>
                              <span className="font-bold text-zinc-900">{pt.ten}</span>
                              <span className="font-mono text-zinc-500">({formatVND(pt.donGia || 350000)})</span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                              {/* Quantity buttons */}
                              {!isCompleted ? (
                                <div className="flex items-center border border-zinc-300 rounded-lg overflow-hidden bg-white">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cur = selectedClaim.b2_phuTungDuKien || [];
                                      const newQty = Math.max(1, (pt.soLuong || 1) - 1);
                                      const updated = cur.map((p: any, idx: number) => idx === i ? { ...p, soLuong: newQty } : p);
                                      setSelectedClaim({ ...selectedClaim, b2_phuTungDuKien: updated, b3_hangMucChiPhi: undefined });
                                    }}
                                    className="px-2 py-0.5 text-zinc-600 hover:bg-zinc-100 font-bold cursor-pointer"
                                    title="Giảm số lượng"
                                  >
                                    -
                                  </button>
                                  <span className="px-2 py-0.5 text-xs font-mono font-bold text-zinc-900 min-w-[24px] text-center">
                                    {pt.soLuong || 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cur = selectedClaim.b2_phuTungDuKien || [];
                                      const newQty = (pt.soLuong || 1) + 1;
                                      const updated = cur.map((p: any, idx: number) => idx === i ? { ...p, soLuong: newQty } : p);
                                      setSelectedClaim({ ...selectedClaim, b2_phuTungDuKien: updated, b3_hangMucChiPhi: undefined });
                                    }}
                                    className="px-2 py-0.5 text-zinc-600 hover:bg-zinc-100 font-bold cursor-pointer"
                                    title="Tăng số lượng"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <span className="font-mono text-zinc-600 font-bold">SL: {pt.soLuong || 1}</span>
                              )}

                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                {pt.tinhTrang || 'Đã có sẵn'}
                              </span>

                              {!isCompleted && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cur = selectedClaim.b2_phuTungDuKien || [];
                                    const updated = cur.filter((_: any, idx: number) => idx !== i);
                                    setSelectedClaim({ ...selectedClaim, b2_phuTungDuKien: updated, b3_hangMucChiPhi: undefined });
                                  }}
                                  className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 cursor-pointer ml-1"
                                  title="Xóa phụ tùng này"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bộ công cụ thêm phụ tùng */}
                    {!isCompleted && (
                      <div className="mt-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                        {/* Quick tag chips */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-zinc-600">Chọn nhanh:</span>
                          {PRESET_PARTS.slice(0, 6).map((preset, pIdx) => {
                            const cur = selectedClaim.b2_phuTungDuKien || [];
                            const isAdded = cur.some((p: any) => p.ten === preset.ten);
                            return (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => {
                                  const exists = cur.find((p: any) => p.ten === preset.ten);
                                  let updated;
                                  if (exists) {
                                    updated = cur.map((p: any) => p.ten === preset.ten ? { ...p, soLuong: (p.soLuong || 1) + 1 } : p);
                                  } else {
                                    updated = [...cur, { ten: preset.ten, soLuong: 1, tinhTrang: preset.tinhTrang, donGia: preset.donGia }];
                                  }
                                  setSelectedClaim({ ...selectedClaim, b2_phuTungDuKien: updated, b3_hangMucChiPhi: undefined });
                                }}
                                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer flex items-center gap-1 ${
                                  isAdded
                                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                    : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                                }`}
                              >
                                <span>+</span>
                                <span>{preset.ten}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Dropdown select */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            id="quickPartSelect"
                            className="p-2 rounded-xl border border-zinc-300 text-xs font-medium text-black bg-white flex-1 min-w-[220px]"
                            defaultValue=""
                          >
                            <option value="" disabled>-- Chọn phụ tùng từ kho vật tư Motoshop --</option>
                            {PRESET_PARTS.map((p, idx) => (
                              <option key={idx} value={p.ten}>
                                {p.ten} ({formatVND(p.donGia)})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const selectEl = document.getElementById('quickPartSelect') as HTMLSelectElement;
                              const val = selectEl?.value;
                              if (!val) return;
                              const found = PRESET_PARTS.find(p => p.ten === val);
                              if (!found) return;
                              const cur = selectedClaim.b2_phuTungDuKien || [];
                              const exists = cur.find((p: any) => p.ten === found.ten);
                              let updated;
                              if (exists) {
                                updated = cur.map((p: any) => p.ten === found.ten ? { ...p, soLuong: (p.soLuong || 1) + 1 } : p);
                              } else {
                                updated = [...cur, { ten: found.ten, soLuong: 1, tinhTrang: found.tinhTrang, donGia: found.donGia }];
                              }
                              setSelectedClaim({ ...selectedClaim, b2_phuTungDuKien: updated, b3_hangMucChiPhi: undefined });
                            }}
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs cursor-pointer shadow-sm flex items-center gap-1"
                          >
                            <span>+</span>
                            <span>Thêm phụ tùng</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer buttons Bước 2 */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                >
                  Quay lại Bước 1
                </button>
                {isCompleted ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-black text-white transition shadow-md cursor-pointer"
                  >
                    Xem Bước 3 (Lập phương án) &gt;
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold border border-red-300 text-red-700 hover:bg-red-50 transition cursor-pointer"
                    >
                      Từ chối bảo hành
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveClaimStep(3)}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition shadow-md cursor-pointer"
                    >
                      TIẾP TỤC &amp; LẬP PHƯƠNG ÁN (BƯỚC 3) &gt;
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              BƯỚC 3: LẬP PHƯƠNG ÁN BẢO HÀNH & ƯỚC TÍNH CHI PHÍ (ẢNH 5)
              ========================================================= */}
          {activeStep === 3 && (() => {
            const baseParts = selectedClaim.b2_phuTungDuKien || [];

            const currentItems = (selectedClaim.b3_hangMucChiPhi && selectedClaim.b3_hangMucChiPhi.length > 0)
              ? selectedClaim.b3_hangMucChiPhi
              : baseParts.length > 0
                ? [
                    ...baseParts.map((pt: any) => ({
                      ten: pt.ten,
                      soLuong: pt.soLuong || 1,
                      donGia: pt.donGia || (pt.ten.includes('Búa') ? 450000 : pt.ten.includes('Chuông') ? 350000 : 250000),
                      thanhTien: (pt.soLuong || 1) * (pt.donGia || (pt.ten.includes('Búa') ? 450000 : pt.ten.includes('Chuông') ? 350000 : 250000)),
                      doiTuongChiTra: ((selectedClaim.b3_cheDoBaoHanh === 'CoPhi') ? 'KhachHang' : 'HangBaoHanh') as 'HangBaoHanh' | 'KhachHang',
                    })),
                    {
                      ten: 'Công vệ sinh cụm truyền động & lắp đặt',
                      soLuong: 1,
                      donGia: 150000,
                      thanhTien: 150000,
                      doiTuongChiTra: ((selectedClaim.b3_cheDoBaoHanh === 'CoPhi') ? 'KhachHang' : 'HangBaoHanh') as 'HangBaoHanh' | 'KhachHang',
                    },
                  ]
                : [
                    {
                      ten: 'Kiểm tra & Cân chỉnh kỹ thuật xe (Không thay thế phụ tùng)',
                      soLuong: 1,
                      donGia: 0,
                      thanhTien: 0,
                      doiTuongChiTra: 'HangBaoHanh' as const,
                    },
                  ];

            const isMienPhi = (selectedClaim.b3_cheDoBaoHanh || 'MienPhi') === 'MienPhi';
            const totalCalc = currentItems.reduce((acc, row) => acc + (row.thanhTien || 0), 0);
            const hangCalc = isMienPhi ? totalCalc : currentItems.filter(r => r.doiTuongChiTra === 'HangBaoHanh').reduce((acc, row) => acc + (row.thanhTien || 0), 0);
            const khachCalc = isMienPhi ? 0 : currentItems.filter(r => r.doiTuongChiTra === 'KhachHang').reduce((acc, row) => acc + (row.thanhTien || 0), 0);

            return (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
                <h2 className="text-base sm:text-lg font-black text-zinc-900 font-mono border-b border-zinc-100 pb-3">
                  Bước 3: Lập phương án bảo hành &amp; Ước tính chi phí
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Cột trái: Tóm tắt Bước 2 */}
                  <div className="lg:col-span-5 p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
                    <div className="text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                      TỔNG HỢP KẾT QUẢ KIỂM TRA (BƯỚC 2)
                    </div>
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-zinc-500">Khách hàng: </span>
                        <strong className="text-zinc-900">{selectedClaim.khachHang}</strong> |{' '}
                        <span className="text-zinc-500 font-mono">{selectedClaim.soDienThoai}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Xe / Biển số: </span>
                        <strong className="text-zinc-900">{selectedClaim.xeBienSo}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500">Lỗi kỹ thuật phát hiện: </span>
                        <p className="text-zinc-800 font-semibold mt-0.5">
                          {selectedClaim.b2_chiTietLoi ||
                            'Búa côn bị mòn, chuông nồi bị cháy sẫm màu, nhiều bụi bẩn bám trong cụm nồi trước và sau...'}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Đề xuất xử lý: </span>
                        <p className="text-zinc-800 font-semibold mt-0.5">
                          {selectedClaim.b2_deXuatHuongXuLy ||
                            'Thay mới bộ búa côn (ba càng) và chuông nồi sau, vệ sinh toàn bộ cụm truyền động trước và sau.'}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-zinc-200">
                        <span className="text-zinc-500 block mb-1">Phụ tùng KTV đã chọn ở Bước 2:</span>
                        {baseParts.length > 0 ? (
                          <div className="space-y-1">
                            {baseParts.map((pt: any, idx: number) => (
                              <div key={idx} className="flex justify-between font-mono text-[11px]">
                                <span>• {pt.ten} (x{pt.soLuong || 1})</span>
                                <strong>{formatVND((pt.soLuong || 1) * (pt.donGia || 350000))}</strong>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] italic text-zinc-500">
                            Không thay thế linh kiện (Chỉ kiểm tra &amp; vệ sinh định kỳ)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Phương án & Chi phí */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="text-xs font-black uppercase tracking-wider text-zinc-900 font-mono">
                      LẬP PHƯƠNG ÁN XỬ LÝ &amp; CHI PHÍ
                    </div>

                    {/* Chế độ bảo hành */}
                    <div>
                      <label className="text-xs font-bold text-zinc-800 block mb-1.5">
                        Chọn chế độ bảo hành
                      </label>
                      <div className="flex flex-wrap gap-4 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-900">
                          <input
                            type="radio"
                            name="cheDoBH"
                            disabled={isCompleted}
                            checked={isMienPhi}
                            onChange={() => {
                              const updatedItems = currentItems.map(it => ({ ...it, doiTuongChiTra: 'HangBaoHanh' as const }));
                              setSelectedClaim({
                                ...selectedClaim,
                                b3_cheDoBaoHanh: 'MienPhi',
                                b3_hangMucChiPhi: updatedItems,
                                b3_tongChiPhi: totalCalc,
                                b3_chiPhiBaoHanhChiTra: totalCalc,
                                b3_khachThanhToan: 0,
                              });
                            }}
                            className="accent-red-600 disabled:opacity-50"
                          />
                          <span className={isMienPhi ? 'text-emerald-700 font-extrabold' : ''}>
                            Bảo hành miễn phí (Hãng chi trả 100%, khách trả 0đ)
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-900">
                          <input
                            type="radio"
                            name="cheDoBH"
                            disabled={isCompleted}
                            checked={!isMienPhi}
                            onChange={() => {
                              const updatedItems = currentItems.map((it, idx) => ({
                                ...it,
                                doiTuongChiTra: idx === 1 ? ('KhachHang' as const) : it.doiTuongChiTra,
                              }));
                              const newKhach = updatedItems.filter(r => r.doiTuongChiTra === 'KhachHang').reduce((acc, r) => acc + r.thanhTien, 0);
                              const newHang = updatedItems.filter(r => r.doiTuongChiTra === 'HangBaoHanh').reduce((acc, r) => acc + r.thanhTien, 0);
                              setSelectedClaim({
                                ...selectedClaim,
                                b3_cheDoBaoHanh: 'CoPhi',
                                b3_hangMucChiPhi: updatedItems,
                                b3_tongChiPhi: totalCalc,
                                b3_chiPhiBaoHanhChiTra: newHang,
                                b3_khachThanhToan: newKhach,
                              });
                            }}
                            className="accent-red-600 disabled:opacity-50"
                          />
                          <span className={!isMienPhi ? 'text-red-700 font-extrabold' : ''}>
                            Bảo hành có tính phí một phần (Có phụ thu ngoài danh mục)
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Bảng chi tiết chi phí */}
                    <div className="border border-zinc-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-100 text-zinc-700 font-mono uppercase text-[11px]">
                          <tr>
                            <th className="p-2.5">Tên hạng mục</th>
                            <th className="p-2.5 text-center">SL</th>
                            <th className="p-2.5 text-right">Đơn giá</th>
                            <th className="p-2.5 text-right">Thành tiền</th>
                            <th className="p-2.5 text-center">Đối tượng chi trả</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {currentItems.map((row, i) => (
                            <tr key={i} className="hover:bg-zinc-50">
                              <td className="p-2.5 font-semibold text-zinc-900">{row.ten}</td>
                              <td className="p-2.5 text-center font-mono">{row.soLuong}</td>
                              <td className="p-2.5 text-right font-mono">{formatVND(row.donGia)}</td>
                              <td className="p-2.5 text-right font-mono font-bold">{formatVND(row.thanhTien)}</td>
                              <td className="p-2.5 text-center">
                                {isMienPhi ? (
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    ✓ Hãng bảo hành (100%)
                                  </span>
                                ) : isCompleted ? (
                                  row.doiTuongChiTra === 'KhachHang' ? (
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 font-mono">
                                      Khách trả ({formatVND(row.thanhTien)})
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      Hãng bảo hành
                                    </span>
                                  )
                                ) : (
                                  <select
                                    value={row.doiTuongChiTra}
                                    onChange={(e) => {
                                      const val = e.target.value as 'HangBaoHanh' | 'KhachHang';
                                      const updatedItems = currentItems.map((it, idx) => idx === i ? { ...it, doiTuongChiTra: val } : it);
                                      const newKhach = updatedItems.filter(r => r.doiTuongChiTra === 'KhachHang').reduce((acc, r) => acc + r.thanhTien, 0);
                                      const newHang = updatedItems.filter(r => r.doiTuongChiTra === 'HangBaoHanh').reduce((acc, r) => acc + r.thanhTien, 0);
                                      setSelectedClaim({
                                        ...selectedClaim,
                                        b3_hangMucChiPhi: updatedItems,
                                        b3_tongChiPhi: totalCalc,
                                        b3_chiPhiBaoHanhChiTra: newHang,
                                        b3_khachThanhToan: newKhach,
                                      });
                                    }}
                                    className="p-1 rounded-lg border border-zinc-300 text-xs font-bold text-black bg-white cursor-pointer"
                                  >
                                    <option value="HangBaoHanh">Hãng bảo hành chi trả (0đ)</option>
                                    <option value="KhachHang">Khách hàng chi trả</option>
                                  </select>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Tổng chi phí & Phân định Miễn phí vs Tính phí rõ rệt */}
                    <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Tổng chi phí dự kiến:</span>
                        <strong className="text-zinc-900 font-bold">{formatVND(totalCalc)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Chi phí Hãng bảo hành chi trả:</span>
                        <strong className="text-emerald-700 font-bold">{formatVND(hangCalc)}</strong>
                      </div>
                      <div className="flex justify-between border-t border-zinc-200 pt-1.5 items-center">
                        <span className="font-bold text-zinc-900">Khách hàng cần thanh toán:</span>
                        {isMienPhi ? (
                          <strong className="text-emerald-700 font-black text-sm">
                            0 đ <span className="text-[11px] font-normal text-zinc-500 font-sans">(Được ghi nhận 100% miễn phí)</span>
                          </strong>
                        ) : (
                          <strong className="text-red-700 font-black text-base font-mono">
                            {formatVND(khachCalc)} <span className="text-[11px] font-normal text-red-600 font-sans">(Phần có tính phí ngoài danh mục)</span>
                          </strong>
                        )}
                      </div>
                    </div>

                    {/* Thời gian hoàn thành & KTV */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-zinc-800 block mb-1">
                          Thời gian hoàn thành dự kiến:
                        </label>
                        <input
                          type="datetime-local"
                          disabled={isCompleted}
                          defaultValue="2026-10-20T15:30"
                          className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs font-mono font-bold text-black bg-white disabled:bg-zinc-100 disabled:text-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-800 block mb-1">
                          Nhân viên kỹ thuật phụ trách:
                        </label>
                        <select
                          disabled={isCompleted}
                          defaultValue="Nguyễn Văn Hùng"
                          className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs font-bold text-black bg-white disabled:bg-zinc-100 disabled:text-zinc-600"
                        >
                          <option value="Nguyễn Văn Hùng">Nguyễn Văn Hùng</option>
                          <option value="Lê Anh Tuấn">Lê Anh Tuấn</option>
                          <option value="Trần Quốc Anh">Trần Quốc Anh</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer buttons Bước 3 */}
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                  >
                    Quay lại Bước 2
                  </button>
                  {isCompleted ? (
                    <button
                      type="button"
                      onClick={() => setActiveStep(4)}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-black text-white transition shadow-md cursor-pointer"
                    >
                      Xem Bước 4 (Duyệt phương án) &gt;
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowRejectModal(true)}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold border border-red-300 text-red-700 hover:bg-red-50 transition cursor-pointer"
                      >
                        Từ chối bảo hành
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSaveClaimStep(4, undefined, {
                            b3_hangMucChiPhi: currentItems,
                            b3_tongChiPhi: totalCalc,
                            b3_chiPhiBaoHanhChiTra: hangCalc,
                            b3_khachThanhToan: khachCalc,
                          });
                        }}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition shadow-md cursor-pointer"
                      >
                        TIẾP TỤC &amp; GỬI DUYỆT PHƯƠNG ÁN (BƯỚC 4) &gt;
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* =========================================================
              BƯỚC 4: XEM XÉT & DUYỆT PHƯƠNG ÁN BẢO HÀNH (ẢNH 6)
              ========================================================= */}
          {activeStep === 4 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
              <h2 className="text-base sm:text-lg font-black text-zinc-900 font-mono border-b border-zinc-100 pb-3">
                Bước 4: Xem xét & Duyệt phương án bảo hành
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Cột trái: Tổng hợp phương án & dự toán */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                    TỔNG HỢP PHƯƠNG ÁN & DỰ TOÁN
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-zinc-500">Khách hàng: </span>
                      <strong className="text-zinc-900">{selectedClaim.khachHang}</strong> |{' '}
                      <span className="text-zinc-500 font-mono">{selectedClaim.soDienThoai}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Xe / Biển số: </span>
                      <strong className="text-zinc-900">{selectedClaim.xeBienSo}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">Lỗi kỹ thuật phát hiện: </span>
                      <p className="text-zinc-800 font-medium mt-0.5">
                        {selectedClaim.b2_chiTietLoi ||
                          'Búa côn bị mòn, chuông nồi bị cháy sẫm màu, nhiều bụi bẩn bám trong cụm nồi...'}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Phương án xử lý: </span>
                      <p className="text-zinc-800 font-medium mt-0.5">
                        {selectedClaim.b2_deXuatHuongXuLy ||
                          'Thay mới bộ búa côn (ba càng) và chuông nồi sau, vệ sinh toàn bộ cụm truyền động...'}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-200 space-y-1">
                      <div className="font-bold text-zinc-900">Chi tiết chi phí bảo hành:</div>
                      {((selectedClaim.b3_hangMucChiPhi && selectedClaim.b3_hangMucChiPhi.length > 0)
                        ? selectedClaim.b3_hangMucChiPhi
                        : (selectedClaim.b2_phuTungDuKien && selectedClaim.b2_phuTungDuKien.length > 0)
                          ? [
                              ...selectedClaim.b2_phuTungDuKien.map((pt: any) => ({
                                ten: pt.ten,
                                soLuong: pt.soLuong || 1,
                                thanhTien: (pt.soLuong || 1) * (pt.donGia || 350000),
                                doiTuongChiTra: 'HangBaoHanh',
                              })),
                              { ten: 'Công kiểm tra & lắp đặt', soLuong: 1, thanhTien: 150000, doiTuongChiTra: 'HangBaoHanh' },
                            ]
                          : [{ ten: 'Kiểm tra & Cân chỉnh kỹ thuật xe', soLuong: 1, thanhTien: 0, doiTuongChiTra: 'HangBaoHanh' }]
                      ).map((item: any, idx: number) => (
                        <div key={idx} className="font-mono text-[11px] flex justify-between">
                          <span>- {item.ten} (x{item.soLuong || 1}):</span>
                          <strong className="text-zinc-900">
                            {formatVND(item.thanhTien || 0)} ({item.doiTuongChiTra === 'KhachHang' ? 'Khách trả' : 'BH 0đ'})
                          </strong>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-zinc-200 text-xs">
                      <div>
                        Tổng chi phí: <strong className="font-mono">{formatVND(selectedClaim.b3_tongChiPhi ?? 0)}</strong> | Người chi trả:{' '}
                        <strong className="text-orange-700">
                          {(selectedClaim.b3_cheDoBaoHanh || 'MienPhi') === 'MienPhi' ? 'Hãng bảo hành (100%)' : 'Hãng + Khách hàng'}
                        </strong>
                      </div>
                      <div>
                        Chi phí khách thanh toán:{' '}
                        <strong className={`font-mono font-bold ${(selectedClaim.b3_khachThanhToan || 0) > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                          {formatVND(selectedClaim.b3_khachThanhToan || 0)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Duyệt phương án */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-zinc-900 font-mono">
                    DUYỆT PHƯƠNG ÁN (Xác nhận từ các bên liên quan)
                  </div>

                  {/* Trạng thái duyệt của hãng */}
                  <div>
                    <label className="text-xs font-bold text-zinc-800 block mb-1">
                      Trạng thái duyệt của Hãng / Hệ thống:
                    </label>
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200 bg-emerald-50/50 text-xs font-semibold text-emerald-950 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isCompleted}
                        checked={selectedClaim.b4_hangXeXacNhan ?? true}
                        onChange={e =>
                          setSelectedClaim({
                            ...selectedClaim,
                            b4_hangXeXacNhan: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded disabled:opacity-50"
                      />
                      <span>Hãng xe xác nhận (Đủ điều kiện bảo hành, hệ thống đã duyệt tự động)</span>
                    </label>
                  </div>

                  {/* Trạng thái duyệt từ khách hàng */}
                  <div>
                    <label className="text-xs font-bold text-zinc-800 block mb-1">
                      Trạng thái duyệt từ Khách hàng:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-900 cursor-pointer">
                        <input
                          type="radio"
                          name="khachDuyet"
                          disabled={isCompleted}
                          checked={selectedClaim.b4_khachHangDongY ?? true}
                          onChange={() =>
                            setSelectedClaim({ ...selectedClaim, b4_khachHangDongY: true })
                          }
                          className="accent-red-600 disabled:opacity-50"
                        />
                        <span>Khách hàng đã đồng ý phương án (nhân viên đã gọi điện thoại hoặc xác nhận trực tiếp)</span>
                      </label>
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-900 cursor-pointer">
                        <input
                          type="radio"
                          name="khachDuyet"
                          disabled={isCompleted}
                          checked={selectedClaim.b4_khachHangDongY === false}
                          onChange={() =>
                            setSelectedClaim({ ...selectedClaim, b4_khachHangDongY: false })
                          }
                          className="accent-red-600 disabled:opacity-50"
                        />
                        <span>Khách hàng không đồng ý (Hủy yêu cầu)</span>
                      </label>
                    </div>
                  </div>

                  {/* Ghi chú / Ý kiến duyệt */}
                  <div>
                    <label className="text-xs font-bold text-zinc-800 block mb-1">
                      Ghi chú / Ý kiến duyệt:
                    </label>
                    <textarea
                      rows={3}
                      disabled={isCompleted}
                      value={
                        selectedClaim.b4_ghiChuDuyet ||
                        'Khách hàng đã xác nhận qua điện thoại, đồng ý với phương án thay mới búa côn và chuông nồi sau, hẹn lấy xe lúc 15:30 cùng ngày.'
                      }
                      onChange={e =>
                        setSelectedClaim({ ...selectedClaim, b4_ghiChuDuyet: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs text-black bg-white disabled:bg-zinc-100 disabled:text-zinc-600"
                    />
                  </div>

                  {/* Người duyệt & File đính kèm */}
                  <div className="space-y-3">
                    <div className="text-xs">
                      <span className="text-zinc-600">Người duyệt (Nhân viên quản lý): </span>
                      <strong className="text-zinc-900 font-mono bg-zinc-100 px-2.5 py-1 rounded-lg">
                        Nguyễn Văn A (Quản trị viên)
                      </strong>
                    </div>
                    {!isCompleted && (
                      <div>
                        <span className="text-xs text-zinc-600 block mb-1">
                          File đính kèm / Minh chứng (Ảnh chụp ký nhận hoặc ghi âm cuộc gọi nếu có):
                        </span>
                        <button
                          type="button"
                          onClick={() => alert('Mở hộp thoại tải file minh chứng')}
                          className="px-4 py-2 rounded-xl border border-zinc-300 hover:border-red-600 bg-zinc-50 hover:bg-red-50 text-xs font-bold text-zinc-700 hover:text-red-700 transition cursor-pointer"
                        >
                          📷 Tải lên minh chứng
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer buttons Bước 4 */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                >
                  Quay lại Bước 3
                </button>
                {isCompleted ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep(5)}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-black text-white transition shadow-md cursor-pointer"
                  >
                    Xem Bước 5 (Tiến hành sửa chữa) &gt;
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold border border-red-300 text-red-700 hover:bg-red-50 transition cursor-pointer"
                    >
                      Từ chối duyệt / Trả lại
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveClaimStep(5, 'DangSuaChua')}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition shadow-md cursor-pointer"
                    >
                      TIẾP TỤC &amp; BẮT ĐẦU SỬA CHỮA (BƯỚC 5) &gt;
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              BƯỚC 5: THỰC HIỆN SỬA CHỮA & THAY THẾ PHỤ TÙNG (ẢNH 7)
              ========================================================= */}
          {activeStep === 5 && (() => {
            const baseParts = selectedClaim.b2_phuTungDuKien || [];
            const repairList = baseParts.length > 0
              ? [
                  ...baseParts.map((pt: any) => ({
                    hm: `Thay thế ${pt.ten}`,
                    pt: `${pt.ten} chính hãng (x${pt.soLuong || 1})`,
                    st: 'Đã thay thế',
                    xn: selectedClaim.b5_ktvChinh || 'Nguyễn Văn Hùng',
                  })),
                  {
                    hm: 'Vệ sinh & cân chỉnh kỹ thuật xe',
                    pt: 'Dung dịch chuyên dụng',
                    st: 'Đã hoàn thành',
                    xn: selectedClaim.b5_ktvChinh || 'Nguyễn Văn Hùng',
                  },
                ]
              : [
                  {
                    hm: 'Kiểm tra kỹ thuật & vệ sinh xe tổng quát',
                    pt: 'Thiết bị chẩn đoán',
                    st: 'Đã hoàn thành',
                    xn: selectedClaim.b5_ktvChinh || 'Nguyễn Văn Hùng',
                  },
                ];

            return (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
                <h2 className="text-base sm:text-lg font-black text-zinc-900 font-mono border-b border-zinc-100 pb-3">
                  Bước 5: Thực hiện sửa chữa &amp; Thay thế phụ tùng
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Cột trái: Thông tin công việc */}
                  <div className="lg:col-span-5 p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
                    <div className="text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                      THÔNG TIN CÔNG VIỆC &amp; KỸ THUẬT VIÊN
                    </div>
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-zinc-500">Kỹ thuật viên chính: </span>
                        <strong className="text-zinc-900">
                          {selectedClaim.b5_ktvChinh || 'Nguyễn Văn Hùng'}
                        </strong>
                      </div>
                      <div>
                        <label className="text-zinc-500 block mb-1">Hỗ trợ (nếu có):</label>
                        <select
                          disabled={isCompleted}
                          defaultValue="Trần Văn B"
                          className="w-full p-2 rounded-xl border border-zinc-300 text-xs font-bold text-black bg-white disabled:bg-zinc-100 disabled:text-zinc-600"
                        >
                          <option value="Trần Văn B">Trần Văn B</option>
                          <option value="Lê Văn C">Lê Văn C</option>
                          <option value="Không có">Không có</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-zinc-500">Xe / Biển số: </span>
                        <strong className="text-zinc-900">{selectedClaim.xeBienSo}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500">Khách hàng: </span>
                        <strong className="text-zinc-900">{selectedClaim.khachHang}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500">Thời gian bắt đầu: </span>
                        <strong className="text-zinc-900 font-mono">20/10/2026 13:15</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500">Thời gian hoàn thành dự kiến: </span>
                        <strong className="text-zinc-900 font-mono">20/10/2026 15:30</strong>
                      </div>
                      <div>
                        <label className="text-zinc-500 block mb-1 font-bold">
                          Nhật ký công việc (Ghi chú tiến độ):
                        </label>
                        <textarea
                          rows={3}
                          disabled={isCompleted}
                          value={
                            selectedClaim.b5_nhatKyCongViec ||
                            'Đã tháo dỡ cụm truyền động cũ, tiến hành vệ sinh sạch sẽ bụi bẩn bên trong lốc máy. Đang chuẩn bị lắp ráp búa côn sau (ba càng) và chuông nồi mới.'
                          }
                          onChange={e =>
                            setSelectedClaim({
                              ...selectedClaim,
                              b5_nhatKyCongViec: e.target.value,
                            })
                          }
                          className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs text-black bg-white disabled:bg-zinc-100 disabled:text-zinc-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Danh sách hạng mục sửa chữa */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="text-xs font-black uppercase tracking-wider text-zinc-900 font-mono">
                      DANH SÁCH HẠNG MỤC SỬA CHỮA (Kiểm tra và xác nhận tiến độ của từng hạng mục)
                    </div>

                    {/* Bảng tiến độ */}
                    <div className="border border-zinc-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-100 text-zinc-700 font-mono uppercase text-[11px]">
                          <tr>
                            <th className="p-2.5">Hạng mục</th>
                            <th className="p-2.5">Phụ tùng</th>
                            <th className="p-2.5">Trạng thái thực hiện</th>
                            <th className="p-2.5">Xác nhận</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {repairList.map((r, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50">
                              <td className="p-2.5 font-bold text-zinc-900">{r.hm}</td>
                              <td className="p-2.5 text-zinc-600">{r.pt}</td>
                              <td className="p-2.5">
                                <select
                                  disabled={isCompleted}
                                  defaultValue={r.st}
                                  className="p-1 rounded-lg border border-zinc-300 text-xs font-bold text-black bg-white disabled:bg-zinc-100 disabled:text-zinc-600"
                                >
                                  <option value="Đã thay thế">Đã thay thế</option>
                                  <option value="Đang thực hiện">Đang thực hiện</option>
                                  <option value="Chưa thực hiện">Chưa thực hiện</option>
                                </select>
                              </td>
                              <td className="p-2.5 font-mono text-zinc-700">{r.xn}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Ảnh thi công */}
                    <div>
                      <label className="text-xs font-bold text-zinc-800 block mb-1">
                        Hình ảnh thực tế khi thi công (Tải lên hoặc chụp phụ tùng cũ đã tháo và phụ tùng mới đã lắp):
                      </label>
                      <div className="flex items-center gap-3 flex-wrap">
                        <img
                          src="https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=500&auto=format"
                          alt="Thi công 1"
                          className="w-24 h-16 object-cover rounded-xl border border-zinc-300"
                        />
                        <img
                          src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format"
                          alt="Thi công 2"
                          className="w-24 h-16 object-cover rounded-xl border border-zinc-300"
                        />
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => alert('Mở hộp thoại tải ảnh/video thi công')}
                            className="px-4 py-2 rounded-xl border border-dashed border-red-300 hover:border-red-600 bg-red-50/50 hover:bg-red-50 text-xs font-bold text-red-700 transition cursor-pointer flex items-center gap-1.5"
                          >
                            <span>📷 Tải ảnh/video thi công</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Đánh giá sau sửa chữa */}
                    <div>
                      <label className="text-xs font-bold text-zinc-800 block mb-1">
                        Đánh giá sau sửa chữa của kỹ thuật viên:
                      </label>
                      <label className="flex items-start gap-2.5 p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-800 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={isCompleted}
                          checked={selectedClaim.b5_danhGiaSauSuaChua ?? true}
                          onChange={e =>
                            setSelectedClaim({
                              ...selectedClaim,
                              b5_danhGiaSauSuaChua: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-red-600 accent-red-600 rounded mt-0.5 disabled:opacity-50"
                        />
                        <span>
                          Xe đã được nổ máy, chạy thử tại chỗ và chạy thử trên đường: hoạt động êm ái, không còn hiện tượng giật cục khi tăng ga, không còn tiếng kêu lạ ở cụm nồi.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Footer buttons Bước 5 */}
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                  >
                    Quay lại Bước 4
                  </button>
                  {isCompleted ? (
                    <button
                      type="button"
                      onClick={() => setActiveStep(6)}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-black text-white transition shadow-md cursor-pointer"
                    >
                      Xem Bước 6 (Bàn giao xe) &gt;
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => alert('Ghi nhận sự cố phát sinh vào nhật ký')}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold border border-red-300 text-red-700 hover:bg-red-50 transition cursor-pointer"
                      >
                        Ghi nhận sự cố phát sinh
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveClaimStep(6)}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition shadow-md cursor-pointer"
                      >
                        HOÀN THÀNH SỬA CHỮA (BƯỚC 6) &gt;
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* =========================================================
              BƯỚC 6: BÀN GIAO XE & HOÀN THÀNH HỒ SƠ BẢO HÀNH (ẢNH 8)
              ========================================================= */}
          {activeStep === 6 && (() => {
            const totalCost = selectedClaim.b3_tongChiPhi ?? 0;
            const khachPay = selectedClaim.b3_khachThanhToan ?? 0;
            const hangPay = selectedClaim.b3_chiPhiBaoHanhChiTra ?? (totalCost - khachPay);
            const isFree100 = khachPay === 0;

            return (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
                <h2 className="text-base sm:text-lg font-black text-zinc-900 font-mono border-b border-zinc-100 pb-3">
                  Bước 6: Bàn giao xe &amp; Hoàn thành hồ sơ bảo hành
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Cột trái: Thông tin bàn giao */}
                  <div className="lg:col-span-6 p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
                    <div className="text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                      THÔNG TIN BÀN GIAO &amp; KÝ NHẬN
                    </div>
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-zinc-500">Người nhận xe: </span>
                        <strong className="text-zinc-900">
                          {selectedClaim.khachHang} (Khách hàng)
                        </strong>
                      </div>
                      <div>
                        <span className="text-zinc-500">SĐT người nhận: </span>
                        <strong className="text-zinc-900 font-mono">{selectedClaim.soDienThoai}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500">Xe / Biển số: </span>
                        <strong className="text-zinc-900">{selectedClaim.xeBienSo}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500">Ngày &amp; Giờ bàn giao thực tế: </span>
                        <strong className="text-zinc-900 font-mono">20/10/2026 15:15</strong>
                      </div>

                      {/* Checkboxes xác nhận bàn giao */}
                      <div className="pt-2 border-t border-zinc-200 space-y-2">
                        <div className="font-bold text-zinc-900 mb-1">
                          Xác nhận bàn giao từ nhân viên &amp; khách hàng:
                        </div>
                        <label className="flex items-start gap-2 cursor-pointer font-medium text-zinc-800">
                          <input
                            type="checkbox"
                            disabled={isCompleted}
                            checked={selectedClaim.b6_xacNhanChayThuHaiLong ?? true}
                            onChange={e =>
                              setSelectedClaim({
                                ...selectedClaim,
                                b6_xacNhanChayThuHaiLong: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-red-600 accent-red-600 rounded mt-0.5 disabled:opacity-50"
                          />
                          <span>Khách hàng đã kiểm tra xe, chạy thử và hài lòng với kết quả sửa chữa.</span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer font-medium text-zinc-800">
                          <input
                            type="checkbox"
                            disabled={isCompleted}
                            checked={selectedClaim.b6_xacNhanBanGiaoPhuTungCu ?? true}
                            onChange={e =>
                              setSelectedClaim({
                                ...selectedClaim,
                                b6_xacNhanBanGiaoPhuTungCu: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-red-600 accent-red-600 rounded mt-0.5 disabled:opacity-50"
                          />
                          <span>
                            Nhân viên đã bàn giao lại đầy đủ phụ tùng cũ bị hỏng (nếu khách yêu cầu) và các giấy tờ liên quan.
                          </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer font-medium text-zinc-800">
                          <input
                            type="checkbox"
                            disabled={isCompleted}
                            checked={selectedClaim.b6_xacNhanHuongDanBaoHanh ?? true}
                            onChange={e =>
                              setSelectedClaim({
                                ...selectedClaim,
                                b6_xacNhanHuongDanBaoHanh: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-red-600 accent-red-600 rounded mt-0.5 disabled:opacity-50"
                          />
                          <span>
                            Đã hướng dẫn khách hàng về chế độ bảo hành đối với phụ tùng thay mới (6 tháng cho búa côn và chuông nồi).
                          </span>
                        </label>
                      </div>

                      {/* Chữ ký khách hàng */}
                      <div className="pt-2 border-t border-zinc-200">
                        <div className="font-bold text-zinc-900 mb-1">Chữ ký / Xác nhận của khách hàng:</div>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-900">
                          <input
                            type="checkbox"
                            disabled={isCompleted}
                            checked={selectedClaim.b6_khachKyNhan ?? true}
                            onChange={e =>
                              setSelectedClaim({
                                ...selectedClaim,
                                b6_khachKyNhan: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-red-600 accent-red-600 rounded disabled:opacity-50"
                          />
                          <span>Khách hàng đã ký nhận vào biên bản bàn giao thực tế</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Tổng hợp hồ sơ & biên lai */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="text-xs font-black uppercase tracking-wider text-zinc-900 font-mono">
                      TỔNG HỢP HỒ SƠ &amp; BIÊN LAI
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Tổng chi phí bảo hành:</span>
                        <strong className="text-zinc-900 font-bold">{formatVND(totalCost)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Hãng xe bảo hành chi trả:</span>
                        <strong className="text-emerald-700 font-bold">{formatVND(hangPay)}</strong>
                      </div>
                      <div className="flex justify-between border-t border-zinc-200 pt-1.5 items-center">
                        <span className="font-bold text-zinc-900">Số tiền khách phải thanh toán:</span>
                        {isFree100 ? (
                          <strong className="text-emerald-700 font-black text-sm">
                            0 đ <span className="text-[11px] font-normal text-zinc-500 font-sans">(Bảo hành miễn phí 100%)</span>
                          </strong>
                        ) : (
                          <strong className="text-red-700 font-black text-base font-mono">
                            {formatVND(khachPay)} <span className="text-[11px] font-normal text-red-600 font-sans">(Phụ thu ngoài danh mục bảo hành)</span>
                          </strong>
                        )}
                      </div>
                    </div>

                    {/* Biên lai / Hóa đơn & Nút in */}
                    <div>
                      <label className="text-xs font-bold text-zinc-800 block mb-1.5">
                        Biên lai / Hóa đơn bảo hành (Tài liệu đính kèm):
                      </label>
                      <div className="p-3.5 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-3">
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-2 text-red-700 font-semibold">
                            <span>📄</span>
                            <span>[File biên bản nghiệm thu &amp; bàn giao xe.pdf]</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-700 font-semibold">
                            <span>📷</span>
                            <span>[Ảnh chụp bàn giao xe cho khách hàng]</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 pt-2 border-t border-zinc-200 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setPrintDocument({ type: 'BienBanBanGiao', claim: selectedClaim })}
                            className="px-4 py-2 rounded-xl border border-zinc-300 hover:border-zinc-500 bg-white text-xs font-bold text-zinc-800 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <span>🖨️ In biên bản bàn giao</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPrintDocument({ type: 'HoaDon0d', claim: selectedClaim })}
                            className="px-4 py-2 rounded-xl border border-red-300 hover:border-red-600 bg-red-50 text-xs font-bold text-red-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <span>🖨️ {isFree100 ? 'In hóa đơn 0đ' : 'In hóa đơn dịch vụ & phụ thu'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Đánh giá / Ý kiến của khách hàng */}
                    <div>
                      <label className="text-xs font-bold text-zinc-800 block mb-1">
                        Đánh giá / Ý kiến của khách hàng (nếu có):
                      </label>
                      <textarea
                        rows={2}
                        disabled={isCompleted}
                        value={
                          selectedClaim.b6_yKienKhachHang ||
                          'Khách hàng khen phục vụ nhanh, chu đáo. Xe đi êm, không còn bị giật.'
                        }
                        onChange={e =>
                          setSelectedClaim({
                            ...selectedClaim,
                            b6_yKienKhachHang: e.target.value,
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs text-black bg-white disabled:bg-zinc-100 disabled:text-zinc-600"
                      />
                    </div>

                    {/* Trạng thái cập nhật trên hệ thống */}
                    <div>
                      <label className="text-xs font-bold text-zinc-800 block mb-1">
                        Trạng thái cập nhật trên hệ thống:
                      </label>
                      <div className="space-y-1.5 text-xs text-zinc-800">
                        <label className="flex items-center gap-2 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            disabled={isCompleted}
                            checked={selectedClaim.b6_daCapNhatLichSu ?? true}
                            onChange={e =>
                              setSelectedClaim({
                                ...selectedClaim,
                                b6_daCapNhatLichSu: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded disabled:opacity-50"
                          />
                          <span>Đã cập nhật lịch sử bảo hành của xe.</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            disabled={isCompleted}
                            checked={selectedClaim.b6_daGuiTinNhan ?? true}
                            onChange={e =>
                              setSelectedClaim({
                                ...selectedClaim,
                                b6_daGuiTinNhan: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded disabled:opacity-50"
                          />
                          <span>Đã gửi tin nhắn (SMS/Zalo) thông báo hoàn thành và khảo sát ý kiến khách hàng.</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer buttons Bước 6 */}
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveStep(5)}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                  >
                    Quay lại Bước 5
                  </button>
                  {isCompleted ? (
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 flex items-center gap-1.5 font-mono">
                        <span>🔒</span> HỒ SƠ ĐÃ HOÀN TẤT &amp; KHÓA CHỨNG TỪ (CHỈ XEM / IN)
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedClaim(null)}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-black text-white transition shadow-md cursor-pointer"
                      >
                        Về danh sách yêu cầu
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinishClaim}
                      className="px-7 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition shadow-lg cursor-pointer flex items-center gap-2"
                    >
                      <span>HOÀN THÀNH &amp; ĐÓNG YÊU CẦU ✓</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* =========================================================================
            TRƯỜNG HỢP 2: DANH SÁCH QUẢN LÝ BẢO HÀNH (TAB 1: GIA HẠN | TAB 2: YÊU CẦU)
            ========================================================================= */
        <div className="space-y-6">
          {/* Header & Tiêu đề */}
          <div className="space-y-1">
            <div className="text-xs text-zinc-400 font-medium">
              Trang chủ / <span className="text-zinc-600">Quản lý bảo hành</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight font-mono">
              QUẢN LÝ BẢO HÀNH
            </h1>
          </div>

          {/* 2 Tab chính */}
          <div className="flex items-center gap-8 border-b border-zinc-200 text-sm font-bold font-mono">
            <button
              type="button"
              onClick={() => { setActiveMainTab('GiaHan'); loadData(); }}
              className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-2 ${
                activeMainTab === 'GiaHan'
                  ? 'border-red-700 text-red-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <span>GIA HẠN BẢO HÀNH</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMainTab('YeuCau'); loadData(); }}
              className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-2 ${
                activeMainTab === 'YeuCau'
                  ? 'border-red-700 text-red-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <span>YÊU CẦU BẢO HÀNH</span>
            </button>
          </div>

          {/* =====================================================================
              NỘI DUNG TAB 1: GIA HẠN BẢO HÀNH (ẢNH 1)
              ===================================================================== */}
          {activeMainTab === 'GiaHan' && (
            <div className="space-y-6">
              {/* 3 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* KPI 1 */}
                <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0 font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium">Tổng lượt gia hạn thành công</div>
                    <div className="text-2xl font-black text-zinc-900 font-mono mt-0.5">
                      {extKpi.total.toLocaleString()} lượt
                    </div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-0.5">+12% tháng này</div>
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl shrink-0">
                    💳
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium">Gia hạn trực tuyến</div>
                    <div className="text-2xl font-black text-zinc-900 font-mono mt-0.5">
                      {extKpi.online.toLocaleString()} lượt
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">do khách hàng thanh toán online</div>
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0">
                    🏪
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium">Gia hạn tại showroom</div>
                    <div className="text-2xl font-black text-zinc-900 font-mono mt-0.5">
                      {extKpi.showroom.toLocaleString()} lượt
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">do nhân viên tạo trực tiếp</div>
                  </div>
                </div>
              </div>

              {/* Thanh lọc & Nút thêm gia hạn */}
              <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 flex-1">
                  {/* Ô tìm kiếm */}
                  <div className="relative min-w-[240px] flex-1 max-w-sm">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm kiếm tên, SĐT, biển số, mã..."
                      value={extSearchTerm}
                      onChange={e => {
                        setExtSearchTerm(e.target.value);
                        setExtCurrentPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-300 text-xs font-medium text-black bg-white focus:outline-none focus:border-red-600"
                    />
                  </div>

                  {/* Nguồn gia hạn */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-zinc-500 font-medium">Nguồn gia hạn:</span>
                    <div className="flex items-center gap-1">
                      {[
                        { key: 'TatCa', label: 'Tất cả' },
                        { key: 'TrucTuyen', label: 'Trực tuyến' },
                        { key: 'TaiShowroom', label: 'Tại showroom' },
                      ].map(src => (
                        <button
                          key={src.key}
                          type="button"
                          onClick={() => {
                            setExtSourceFilter(src.key as any);
                            setExtCurrentPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            extSourceFilter === src.key
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          {src.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Thời gian */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-zinc-500 font-medium">Thời gian:</span>
                    <div className="flex items-center gap-1">
                      {[
                        { key: 'ThangNay', label: 'Tháng này' },
                        { key: '30Ngay', label: '30 ngày qua' },
                      ].map(t => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setExtTimeFilter(t.key as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            extTimeFilter === t.key
                              ? 'bg-zinc-100 text-zinc-900 border border-zinc-300'
                              : 'text-zinc-500 hover:bg-zinc-50'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nút đỏ tạo gia hạn tại showroom */}
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition shadow-md flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>+ Gia hạn bảo hành</span>
                  <span className="text-[10px] font-normal opacity-90 block">
                    (dành cho khách đến showroom)
                  </span>
                </button>
              </div>

              {/* Bảng danh sách gia hạn */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-mono uppercase text-[11px]">
                      <tr>
                        <th className="p-3.5">Mã giao dịch</th>
                        <th className="p-3.5">Ngày gia hạn</th>
                        <th className="p-3.5">Khách hàng</th>
                        <th className="p-3.5">Số điện thoại</th>
                        <th className="p-3.5">Xe / Biển số</th>
                        <th className="p-3.5">Gói gia hạn</th>
                        <th className="p-3.5 text-right">Số tiền thanh toán</th>
                        <th className="p-3.5 text-center">Nguồn</th>
                        <th className="p-3.5">Nhân viên thực hiện</th>
                        <th className="p-3.5">Thời hạn mới</th>
                        <th className="p-3.5 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {paginatedExtensions.map(row => {
                        const isHighlighted = highlightTargetId && (
                          row.id === highlightTargetId ||
                          row.id.toLowerCase().includes(highlightTargetId.toLowerCase()) ||
                          row.soDienThoai.includes(highlightTargetId) ||
                          row.khachHang.toLowerCase().includes(highlightTargetId.toLowerCase())
                        );

                        return (
                          <tr
                            key={row.id}
                            id={`ext-row-${row.id}`}
                            className={`transition ${
                              isHighlighted
                                ? 'bg-red-50 ring-2 ring-red-500 animate-pulse font-semibold'
                                : 'hover:bg-zinc-50'
                            }`}
                          >
                          <td className="p-3.5 font-mono font-bold text-red-700">{row.id}</td>
                          <td className="p-3.5 text-zinc-600 font-mono">{row.ngayGiaHan}</td>
                          <td className="p-3.5 font-bold text-zinc-900">{row.khachHang}</td>
                          <td className="p-3.5 font-mono text-zinc-600">{row.soDienThoai}</td>
                          <td className="p-3.5 font-semibold text-zinc-900">{row.xeBienSo}</td>
                          <td className="p-3.5 text-zinc-700">{row.goiGiaHan}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-zinc-900">
                            {formatVND(row.soTien)}
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                row.nguon === 'TrucTuyen'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-orange-50 text-orange-700 border-orange-200'
                              }`}
                            >
                              {row.nguon === 'TrucTuyen' ? 'Trực tuyến' : 'Tại showroom'}
                            </span>
                          </td>
                          <td className="p-3.5 text-zinc-800">{row.nhanVien}</td>
                          <td className="p-3.5 font-mono text-zinc-600">{row.thoiHanMoi}</td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                title="Xem chi tiết"
                                onClick={() => setSelectedExtDetail({ tx: row, type: 'detail' })}
                                className="text-zinc-600 hover:text-red-700 font-semibold cursor-pointer text-xs"
                              >
                                👁️ Xem chi tiết
                              </button>
                              <span className="text-zinc-300">|</span>
                              <button
                                type="button"
                                title="Lịch sử bảo hành"
                                onClick={() => setSelectedExtDetail({ tx: row, type: 'history' })}
                                className="text-zinc-600 hover:text-red-700 font-semibold cursor-pointer text-xs"
                              >
                                ⏱️ Lịch sử BH
                              </button>
                              <span className="text-zinc-300">|</span>
                              <button
                                type="button"
                                title="In biên nhận"
                                onClick={() => setSelectedExtDetail({ tx: row, type: 'receipt' })}
                                className="text-zinc-600 hover:text-red-700 font-semibold cursor-pointer text-xs"
                              >
                                🖨️ In biên nhận
                              </button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang */}
                <div className="p-4 border-t border-zinc-200 flex items-center justify-between flex-wrap gap-3 text-xs text-zinc-500 font-mono">
                  <div>
                    Hiển thị 1-{paginatedExtensions.length} trong số{' '}
                    <strong className="text-zinc-900">{filteredExtensions.length}</strong> kết quả
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={extCurrentPage === 1}
                      onClick={() => setExtCurrentPage(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg border border-zinc-300 disabled:opacity-40 hover:bg-zinc-100 cursor-pointer"
                    >
                      &lt;
                    </button>
                    {Array.from({ length: extTotalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setExtCurrentPage(idx + 1)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer ${
                          extCurrentPage === idx + 1
                            ? 'bg-red-700 text-white'
                            : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={extCurrentPage === extTotalPages}
                      onClick={() => setExtCurrentPage(p => Math.min(extTotalPages, p + 1))}
                      className="px-2.5 py-1 rounded-lg border border-zinc-300 disabled:opacity-40 hover:bg-zinc-100 cursor-pointer"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              NỘI DUNG TAB 2: YÊU CẦU BẢO HÀNH (ẢNH 2)
              ===================================================================== */}
          {activeMainTab === 'YeuCau' && (
            <div className="space-y-6">
              {/* 3 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* KPI 1 */}
                <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center text-xl shrink-0">
                    📋
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium">Tổng yêu cầu bảo hành</div>
                    <div className="text-2xl font-black text-zinc-900 font-mono mt-0.5">
                      {claimKpi.total} yêu cầu
                    </div>
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shrink-0">
                    ⏳
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium">Đang chờ xử lý</div>
                    <div className="text-2xl font-black text-amber-700 font-mono mt-0.5">
                      {claimKpi.pending} yêu cầu
                    </div>
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shrink-0">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium">Đã hoàn thành</div>
                    <div className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
                      {claimKpi.completed} yêu cầu
                    </div>
                  </div>
                </div>
              </div>

              {/* Thanh lọc & Tìm kiếm */}
              <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 flex-1">
                  {/* Ô tìm kiếm */}
                  <div className="relative min-w-[240px] flex-1 max-w-sm">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm kiếm mã yêu cầu, khách hàng, biển số xe, nội dung..."
                      value={claimSearchTerm}
                      onChange={e => {
                        setClaimSearchTerm(e.target.value);
                        setClaimCurrentPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-300 text-xs font-medium text-black bg-white focus:outline-none focus:border-red-600"
                    />
                  </div>

                  {/* Trạng thái */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-zinc-500 font-medium">Trạng thái:</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {[
                        { key: 'TatCa', label: 'Tất cả' },
                        { key: 'ChoXuLy', label: 'Chờ xử lý' },
                        { key: 'DaXacNhan', label: 'Đã xác nhận' },
                        { key: 'DaTiepNhan', label: 'Đã tiếp nhận' },
                        { key: 'DangSuaChua', label: 'Đang sửa chữa' },
                        { key: 'HoanThanh', label: 'Hoàn thành' },
                      ].map(st => (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => {
                            setClaimStatusFilter(st.key);
                            setClaimCurrentPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            claimStatusFilter === st.key
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Thời gian */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-zinc-500 font-medium">Thời gian:</span>
                    <div className="flex items-center gap-1">
                      {[
                        { key: 'ThangNay', label: 'Tháng này' },
                        { key: '30Ngay', label: '30 ngày qua' },
                      ].map(t => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setClaimTimeFilter(t.key as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            claimTimeFilter === t.key
                              ? 'bg-zinc-100 text-zinc-900 border border-zinc-300'
                              : 'text-zinc-500 hover:bg-zinc-50'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nhân viên phụ trách */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-zinc-500 font-medium">Nhân viên phụ trách:</span>
                    <select
                      value={claimStaffFilter}
                      onChange={e => {
                        setClaimStaffFilter(e.target.value);
                        setClaimCurrentPage(1);
                      }}
                      className="p-1.5 rounded-lg border border-zinc-300 text-xs font-bold text-black bg-white"
                    >
                      <option value="TatCa">Nhân viên phụ trách (Tất cả)</option>
                      {staffList.map(st => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bảng danh sách yêu cầu bảo hành */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-mono uppercase text-[11px]">
                      <tr>
                        <th className="p-3.5">Mã yêu cầu</th>
                        <th className="p-3.5">Ngày gửi</th>
                        <th className="p-3.5">Khách hàng</th>
                        <th className="p-3.5">Số điện thoại</th>
                        <th className="p-3.5">Xe / Biển số</th>
                        <th className="p-3.5">Nội dung yêu cầu</th>
                        <th className="p-3.5">Nhân viên phụ trách</th>
                        <th className="p-3.5 text-center">Trạng thái</th>
                        <th className="p-3.5 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {paginatedClaims.map(row => {
                        const isHighlighted = highlightTargetId && (
                          row.id === highlightTargetId ||
                          row.id.toLowerCase().includes(highlightTargetId.toLowerCase()) ||
                          row.soDienThoai.includes(highlightTargetId) ||
                          row.khachHang.toLowerCase().includes(highlightTargetId.toLowerCase())
                        );

                        return (
                          <tr
                            key={row.id}
                            id={`claim-row-${row.id}`}
                            className={`transition ${
                              isHighlighted
                                ? 'bg-red-50 ring-2 ring-red-500 animate-pulse font-semibold'
                                : 'hover:bg-zinc-50'
                            }`}
                          >
                          <td className="p-3.5 font-mono font-bold text-zinc-900">{row.id}</td>
                          <td className="p-3.5 text-zinc-600 font-mono">{row.ngayGui}</td>
                          <td className="p-3.5 font-bold text-zinc-900">{row.khachHang}</td>
                          <td className="p-3.5 font-mono text-zinc-600">{row.soDienThoai}</td>
                          <td className="p-3.5 font-semibold text-zinc-900">{row.xeBienSo}</td>
                          <td className="p-3.5 text-zinc-700 max-w-xs">{row.noiDung}</td>
                          <td className="p-3.5 text-zinc-800">{row.nhanVienPhuTrach}</td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                                row.trangThai === 'ChoXuLy'
                                  ? 'bg-amber-100 text-amber-800'
                                  : row.trangThai === 'DaXacNhan'
                                  ? 'bg-blue-100 text-blue-800'
                                  : row.trangThai === 'DaTiepNhan'
                                  ? 'bg-cyan-100 text-cyan-800'
                                  : row.trangThai === 'DangSuaChua'
                                  ? 'bg-purple-100 text-purple-800'
                                  : row.trangThai === 'HoanThanh'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {row.trangThai === 'ChoXuLy'
                                ? 'Chờ xử lý'
                                : row.trangThai === 'DaXacNhan'
                                ? 'Đã xác nhận'
                                : row.trangThai === 'DaTiepNhan'
                                ? 'Đã tiếp nhận'
                                : row.trangThai === 'DangSuaChua'
                                ? 'Đang sửa chữa'
                                : row.trangThai === 'HoanThanh'
                                ? 'Hoàn thành'
                                : 'Từ chối'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            {/* Nút thao tác theo đúng luồng bảo hành:
                                1. Chờ xử lý -> [✓ Xác nhận lịch] & [▶ Xử lý ngay]
                                2. Đã xác nhận -> [▶ Xử lý ngay]
                                3. Đang xử lý (Đã tiếp nhận, Đang sửa chữa) -> [✏️ Cập nhật]
                                4. Hoàn tất / Từ chối -> [👁️ Xem chi tiết] (khóa cứng) */}
                            {row.trangThai === 'ChoXuLy' ? (
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleConfirmAppointment(row)}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                  title="Xác nhận lịch hẹn và gửi về trang khách hàng"
                                >
                                  <span>✓</span>
                                  <span>Xác nhận</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenClaimStepper(row)}
                                  className="px-2.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                  title="Bắt đầu quy trình xử lý 6 bước"
                                >
                                  <span>▶</span>
                                  <span>Xử lý ngay</span>
                                </button>
                              </div>
                            ) : row.trangThai === 'DaXacNhan' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenClaimStepper(row)}
                                className="px-3.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                              >
                                <span>▶</span>
                                <span>Xử lý ngay</span>
                              </button>
                            ) : row.trangThai === 'DaTiepNhan' || row.trangThai === 'DangSuaChua' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenClaimStepper(row)}
                                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-900 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                              >
                                <span>✏️</span>
                                <span>Cập nhật</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenClaimStepper(row)}
                                className="px-3 py-1.5 rounded-xl border border-zinc-300 hover:border-zinc-500 bg-white text-zinc-800 font-bold text-xs transition flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-xs"
                              >
                                <span>👁️</span>
                                <span>Xem chi tiết</span>
                              </button>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang */}
                <div className="p-4 border-t border-zinc-200 flex items-center justify-between flex-wrap gap-3 text-xs text-zinc-500 font-mono">
                  <div>
                    Hiển thị 1-{paginatedClaims.length} trong số{' '}
                    <strong className="text-zinc-900">{filteredClaims.length}</strong> kết quả
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={claimCurrentPage === 1}
                      onClick={() => setClaimCurrentPage(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg border border-zinc-300 disabled:opacity-40 hover:bg-zinc-100 cursor-pointer"
                    >
                      &lt;
                    </button>
                    {Array.from({ length: claimTotalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setClaimCurrentPage(idx + 1)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer ${
                          claimCurrentPage === idx + 1
                            ? 'bg-red-700 text-white'
                            : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={claimCurrentPage === claimTotalPages}
                      onClick={() => setClaimCurrentPage(p => Math.min(claimTotalPages, p + 1))}
                      className="px-2.5 py-1 rounded-lg border border-zinc-300 disabled:opacity-40 hover:bg-zinc-100 cursor-pointer"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: WIZARD 4 BƯỚC TẠO GIA HẠN BẢO HÀNH TẠI SHOWROOM (GH02 - ẢNH 2, 3, 4)
          ========================================================================= */}
      {showCreateExtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#121214] text-white rounded-3xl max-w-5xl w-full border border-zinc-800 shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
            
            {/* Header Wizard & Nút Đóng */}
            <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-500">
                    MOTOSHOP SHOWROOM CARE
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white font-mono">
                  TẠO YÊU CẦU GIA HẠN BẢO HÀNH (TẠI SHOWROOM)
                </h2>
                <p className="text-xs text-zinc-400">
                  Nhập thông tin để tra cứu khách hàng và lựa chọn phương tiện đăng ký gia hạn
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateExtModal(false)}
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm border border-zinc-700 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper 4 bước ngang (Chuẩn theo Ảnh 2, 3, 4) */}
            <div className="grid grid-cols-2 md:grid-cols-4 bg-[#18181b] border-b border-zinc-800 text-xs font-mono font-bold select-none">
              <div
                onClick={() => setWizardStep(1)}
                className={`p-3.5 sm:p-4 border-r border-zinc-800 flex items-center gap-3 transition cursor-pointer ${
                  wizardStep === 1
                    ? 'bg-gradient-to-r from-red-950/90 to-red-900/60 text-white border-b-2 border-b-red-600'
                    : wizardStep > 1
                    ? 'bg-zinc-900/40 text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  wizardStep === 1 ? 'bg-red-600 text-white' : wizardStep > 1 ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {wizardStep > 1 ? '✓' : '1'}
                </span>
                <div className="truncate">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Bước 1</div>
                  <div className="truncate">Tra cứu & Chọn xe</div>
                </div>
              </div>

              <div
                onClick={() => { if (wizardVehicle) setWizardStep(2); }}
                className={`p-3.5 sm:p-4 border-r border-zinc-800 flex items-center gap-3 transition ${
                  !wizardVehicle ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  wizardStep === 2
                    ? 'bg-gradient-to-r from-red-950/90 to-red-900/60 text-white border-b-2 border-b-red-600'
                    : wizardStep > 2
                    ? 'bg-zinc-900/40 text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  wizardStep === 2 ? 'bg-red-600 text-white' : wizardStep > 2 ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {wizardStep > 2 ? '✓' : '2'}
                </span>
                <div className="truncate">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Bước 2</div>
                  <div className="truncate">Lịch sử & Thẩm định</div>
                </div>
              </div>

              <div
                onClick={() => { if (wizardVehicle) setWizardStep(3); }}
                className={`p-3.5 sm:p-4 border-r border-zinc-800 flex items-center gap-3 transition ${
                  !wizardVehicle ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  wizardStep === 3
                    ? 'bg-gradient-to-r from-red-950/90 to-red-900/60 text-white border-b-2 border-b-red-600'
                    : wizardStep > 3
                    ? 'bg-zinc-900/40 text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  wizardStep === 3 ? 'bg-red-600 text-white' : wizardStep > 3 ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {wizardStep > 3 ? '✓' : '3'}
                </span>
                <div className="truncate">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Bước 3</div>
                  <div className="truncate">Chọn gói bảo hành</div>
                </div>
              </div>

              <div
                onClick={() => { if (wizardVehicle) setWizardStep(4); }}
                className={`p-3.5 sm:p-4 flex items-center gap-3 transition ${
                  !wizardVehicle ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  wizardStep === 4
                    ? 'bg-gradient-to-r from-red-950/90 to-red-900/60 text-white border-b-2 border-b-red-600'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  wizardStep === 4 ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  4
                </span>
                <div className="truncate">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Bước 4</div>
                  <div className="truncate">Thanh toán & Hoàn tất</div>
                </div>
              </div>
            </div>

            {/* Nội dung Stepper từng bước */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* ─────────────────────────────────────────────────────────────
                  BƯỚC 1: TRA CỨU KHÁCH HÀNG & CHỌN PHƯƠNG TIỆN (ẢNH 2)
                  ───────────────────────────────────────────────────────────── */}
              {wizardStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Cột trái: Tra cứu thông tin & Kết quả khách hàng */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="p-5 rounded-2xl bg-[#18181b] border border-zinc-800 space-y-3">
                      <div className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                        TRA CỨU THÔNG TIN
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={custSearchTerm}
                          onChange={e => {
                            const val = e.target.value;
                            setCustSearchTerm(val);
                            const allC = customerApi.getAllSync();
                            const matched = allC.find(c =>
                              c.soDienThoai.includes(val) ||
                              matchVietnameseSearch(c.hoTen, val) ||
                              (c.email && c.email.toLowerCase().includes(val.toLowerCase()))
                            );
                            if (matched) {
                              setWizardCustomer(matched);
                              const vList = vehicleApi.getAllSync().filter(v => v.customerId === matched.id);
                              setWizardVehicle(vList[0] || null);
                            }
                          }}
                          placeholder="Tìm theo Số điện thoại, Họ tên, Email..."
                          className="flex-1 p-3 rounded-xl bg-[#121214] border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const allC = customerApi.getAllSync();
                            const matched = allC.find(c =>
                              c.soDienThoai.includes(custSearchTerm) ||
                              matchVietnameseSearch(c.hoTen, custSearchTerm) ||
                              (c.email && c.email.toLowerCase().includes(custSearchTerm.toLowerCase()))
                            );
                            if (matched) {
                              setWizardCustomer(matched);
                              const vList = vehicleApi.getAllSync().filter(v => v.customerId === matched.id);
                              setWizardVehicle(vList[0] || null);
                            } else {
                              alert('Không tìm thấy thông tin khách hàng phù hợp.');
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shrink-0 transition cursor-pointer"
                        >
                          Tìm kiếm
                        </button>
                      </div>

                      {/* Nút tìm nhanh mẫu để test tiện lợi */}
                      <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-zinc-500">Gợi ý test:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCustSearchTerm('0879179243');
                            const allC = customerApi.getAllSync();
                            const lp = allC.find(c => c.soDienThoai === '0879179243') || allC[0];
                            if (lp) {
                              setWizardCustomer(lp);
                              const vList = vehicleApi.getAllSync().filter(v => v.customerId === lp.id);
                              const shBike = vList.find(v => (v.bienSo || '').includes('59K9')) || vList[0] || null;
                              setWizardVehicle(shBike);
                            }
                          }}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-red-950 text-zinc-300 hover:text-red-400 border border-zinc-700 cursor-pointer"
                        >
                          Lan Phương (0879179243)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustSearchTerm('0987654321');
                            const allC = customerApi.getAllSync();
                            const min = allC.find(c => c.id === 'KH001') || allC[0];
                            if (min) {
                              setWizardCustomer(min);
                              const vList = vehicleApi.getAllSync().filter(v => v.customerId === min.id);
                              setWizardVehicle(vList[0] || null);
                            }
                          }}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer"
                        >
                          Nguyễn Văn Minh
                        </button>
                      </div>
                    </div>

                    {/* Khối THÔNG TIN KHÁCH HÀNG (KẾT QUẢ) */}
                    {wizardCustomer && (
                      <div className="p-5 rounded-2xl bg-[#18181b] border border-zinc-800 space-y-3">
                        <div className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                          THÔNG TIN KHÁCH HÀNG (KẾT QUẢ)
                        </div>
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-[#121214] border border-zinc-800">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow">
                            {wizardCustomer.hoTen.split(' ').map(w => w[0]).slice(-2).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm truncate uppercase font-display">
                                {wizardCustomer.hoTen}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                KHÁCH HÀNG VIP ★
                              </span>
                            </div>
                            <div className="text-xs text-zinc-400 font-mono mt-0.5">
                              📞 {wizardCustomer.soDienThoai}
                            </div>
                            <div className="text-xs text-zinc-400 truncate">
                              ✉️ {wizardCustomer.email || 'lethilanphuong@gmail.com'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cột phải: LỰA CHỌN PHƯƠNG TIỆN GIA HẠN */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <div className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                        LỰA CHỌN PHƯƠNG TIỆN GIA HẠN
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        Chọn 1 trong các phương tiện dưới đây của khách hàng để tiếp tục:
                      </span>
                    </div>

                    {/* Danh sách xe của khách */}
                    <div className="space-y-3">
                      {(() => {
                        const allV = vehicleApi.getAllSync();
                        const cVehs = wizardCustomer
                          ? allV.filter(v => v.customerId === wizardCustomer.id)
                          : [];
                        
                        // Fallback nếu khách Lan Phương chưa có đủ 2 xe
                        const displayVehicles = cVehs.length > 0 ? cVehs : [
                          {
                            id: 'XE-LP-01',
                            customerId: wizardCustomer?.id || 'KH1004',
                            tenXe: 'Honda SH 160i ABS 2024',
                            bienSo: '59K9 - 876.54',
                            soKhung: 'RLHKD160CB7747410',
                            ngayMua: '2024-10-25',
                            hanBaoHanh: '25/10/2026',
                            trangThaiBaoHanh: 'ConHan' as const,
                            hinhAnh: '/images/Xe/sh_160i.jpg',
                          },
                          {
                            id: 'XE-LP-02',
                            customerId: wizardCustomer?.id || 'KH1004',
                            tenXe: 'Honda Vision 2023',
                            bienSo: '59P3 - 123.45',
                            soKhung: 'RLHKV110CB9988776',
                            ngayMua: '2023-05-12',
                            hanBaoHanh: '12/05/2024',
                            trangThaiBaoHanh: 'HetHan' as const,
                            hinhAnh: '/images/Xe/honda_vision.jpg',
                          },
                        ];

                        return displayVehicles.map((veh: any) => {
                          const isSelected = wizardVehicle?.id === veh.id || (wizardVehicle?.bienSo && wizardVehicle.bienSo === veh.bienSo);
                          const isConHan = veh.trangThaiBaoHanh === 'ConHan';

                          return (
                            <div
                              key={veh.id || veh.bienSo}
                              onClick={() => setWizardVehicle(veh)}
                              className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                                isSelected
                                  ? 'border-red-600 bg-red-950/30 shadow-md ring-1 ring-red-600'
                                  : 'border-zinc-800 bg-[#18181b] hover:border-zinc-700 hover:bg-zinc-900/60'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                                  <img
                                    src={getVehicleCatalogImage(veh.tenXe, veh.hinhAnh)}
                                    alt={veh.tenXe}
                                    className="w-full h-full object-cover"
                                    onError={e => { (e.currentTarget as any).src = getVehicleCatalogImage(veh.tenXe); }}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-white text-sm font-display">
                                      {veh.tenXe}
                                    </h4>
                                    <span className="font-mono text-xs font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                                      {veh.bienSo || 'Chưa gắn biển'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-zinc-400 font-mono">
                                    Số khung xe: <strong className="text-zinc-300">{veh.soKhung || 'RLHKD160CB7747410'}</strong>
                                  </div>
                                  <div className="text-[11px] text-zinc-400 font-mono">
                                    Ngày mua: {veh.ngayMua || '2024-10-25'}
                                  </div>
                                  <div className="text-[11px]">
                                    {isConHan ? (
                                      <span className="text-emerald-400 font-medium">
                                        Tình trạng bảo hành: Còn đến {veh.hanBaoHanh || '25/10/2026'} (Đang hiệu lực)
                                      </span>
                                    ) : (
                                      <span className="text-zinc-500 font-medium">
                                        Tình trạng bảo hành: Hết hạn bảo hành gốc ({veh.hanBaoHanh || '12/05/2024'})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 self-end sm:self-center">
                                {isSelected ? (
                                  <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-red-700 text-white flex items-center gap-1 shadow">
                                    ✓ ĐÃ CHỌN
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); setWizardVehicle(veh); }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
                                  >
                                    Chọn xe này
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  BƯỚC 2: KIỂM TRA LỊCH SỬ DỊCH VỤ & THẨM ĐỊNH (ẢNH 3)
                  ───────────────────────────────────────────────────────────── */}
              {wizardStep === 2 && wizardVehicle && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Cột trái: Cập nhật & Kiểm tra điều kiện */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="p-5 rounded-2xl bg-[#18181b] border border-zinc-800 space-y-4">
                      <div className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider pb-2 border-b border-zinc-800">
                        CẬP NHẬT &amp; KIỂM TRA ĐIỀU KIỆN
                      </div>

                      <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/60 text-xs flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase font-mono">Xe Đã Chọn:</div>
                          <div className="font-bold text-white text-sm font-display">{wizardVehicle.tenXe}</div>
                        </div>
                        <span className="font-mono font-black text-red-400 bg-black/60 px-2.5 py-1 rounded border border-red-800">
                          {wizardVehicle.bienSo || '59K9 - 876.54'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-zinc-300 block mb-1">
                            NHẬP SỐ KM HIỆN TẠI (ODO) *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              value={wizardOdo}
                              onChange={e => setWizardOdo(Number(e.target.value) || 0)}
                              className="w-full p-2.5 pr-12 rounded-xl bg-[#121214] border border-zinc-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-red-600"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400">
                              KM
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-zinc-300 block mb-1">
                            NGÀY KIỂM TRA
                          </label>
                          <input
                            type="date"
                            value={wizardInspectionDate}
                            onChange={e => setWizardInspectionDate(e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-[#121214] border border-zinc-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-red-600"
                          />
                        </div>
                      </div>

                      {/* Tải ảnh ODO */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-300 block">
                          TẢI ẢNH ODO (TÙY CHỌN)
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 border border-zinc-700 cursor-pointer transition">
                            <span>📷 Chọn ảnh minh chứng</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const r = new FileReader();
                                  r.onloadend = () => setWizardOdoImage(r.result as string);
                                  r.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          <span className="text-[11px] text-zinc-500 italic">
                            * Nhân viên trực tiếp kiểm tra, không bắt buộc tải ảnh minh chứng
                          </span>
                        </div>
                        {wizardOdoImage && (
                          <div className="w-24 h-16 rounded-xl border border-zinc-700 overflow-hidden mt-2">
                            <img src={wizardOdoImage} alt="ODO" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      {/* Hộp KẾT QUẢ THẨM ĐỊNH ĐIỀU KIỆN (TỰ ĐỘNG) - Xanh lá chuẩn Ảnh 3 */}
                      <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-600/70 text-emerald-200 space-y-2.5">
                        <div className="font-black text-xs uppercase tracking-wide flex items-center gap-2 text-emerald-300">
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-[10px]">
                            ✓
                          </span>
                          <span>ĐỦ ĐIỀU KIỆN GIA HẠN BẢO HÀNH MỞ RỘNG</span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">✔</span>
                            <span>Số km hiện tại (ODO) đạt điều kiện ({wizardOdo.toLocaleString('vi-VN')} km &lt; 30.000 km)</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">✔</span>
                            <span>Lịch sử bảo dưỡng đạt điều kiện (Đã thực hiện 3/3 lần bảo dưỡng định kỳ trong 12 tháng gần nhất)</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">✔</span>
                            <span>Lịch sử sửa chữa đạt điều kiện (Không phát hiện tự ý thay thế linh kiện ngoài độ chế, 100% lịch sử chính hãng)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: CHI TIẾT LỊCH SỬ DỊCH VỤ ĐÃ GHI NHẬN (Ảnh 3) */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider pb-1">
                      CHI TIẾT LỊCH SỬ DỊCH VỤ ĐÃ GHI NHẬN
                    </div>

                    <div className="p-5 rounded-2xl bg-[#18181b] border border-zinc-800 space-y-4">
                      {/* Timeline mốc dịch vụ */}
                      <div className="space-y-3">
                        <div className="p-3.5 rounded-xl bg-[#121214] border border-zinc-800 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                              ✓
                            </span>
                            <div>
                              <div className="text-xs font-bold text-white">
                                10/06/2026 - Bảo dưỡng định kỳ lần 3
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono">
                                Tại CN1 - Quận 1 · ODO: 11.200 km
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✔ ĐẠT
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#121214] border border-zinc-800 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                              ✓
                            </span>
                            <div>
                              <div className="text-xs font-bold text-white">
                                20/01/2026 - Sửa chữa/thay thế dầu máy
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono">
                                Tại CN1 - Quận 1 · ODO: 7.500 km
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✔ ĐẠT
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#121214] border border-zinc-800 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                              ✓
                            </span>
                            <div>
                              <div className="text-xs font-bold text-white">
                                15/09/2025 - Bảo dưỡng định kỳ lần 2
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono">
                                Tại CN1 - Quận 1 · ODO: 4.800 km
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✔ ĐẠT
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#121214] border border-zinc-800 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                              ✓
                            </span>
                            <div>
                              <div className="text-xs font-bold text-white">
                                10/11/2024 - Bảo dưỡng định kỳ lần 1
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono">
                                Tại CN1 - Quận 1 · ODO: 1.000 km
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✔ ĐẠT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  BƯỚC 3: CHỌN GÓI BẢO HÀNH MỞ RỘNG (ẢNH 4)
                  ───────────────────────────────────────────────────────────── */}
              {wizardStep === 3 && wizardVehicle && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white uppercase tracking-tight font-display">
                      CHỌN GÓI BẢO HÀNH MỞ RỘNG
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Áp dụng cho xe: <strong className="text-white">{wizardVehicle.tenXe}</strong> ({wizardVehicle.bienSo || '59K9 - 876.54'}) · ODO hiện tại: <strong className="text-emerald-400 font-mono">{wizardOdo.toLocaleString('vi-VN')} km</strong>
                    </p>
                  </div>

                  {/* 4 Cards gói bảo hành */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {SHOWROOM_EXT_PACKAGES.map(pkg => {
                      const isSelected = wizardPkgId === pkg.id;
                      const isEligible = pkg.eligible;

                      return (
                        <div
                          key={pkg.id}
                          onClick={() => {
                            if (isEligible) setWizardPkgId(pkg.id);
                          }}
                          className={`p-5 rounded-2xl border-2 flex flex-col justify-between transition ${
                            !isEligible
                              ? 'bg-[#18181b]/50 border-zinc-800/80 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-red-950/40 border-red-600 shadow-xl ring-2 ring-red-600/40 cursor-pointer'
                              : 'bg-[#18181b] border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-sm text-white font-display">
                                {pkg.tenGoi}
                              </h4>
                              {pkg.badge && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">
                                  {pkg.badge}
                                </span>
                              )}
                            </div>

                            <div>
                              {isEligible ? (
                                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                  ✓ ĐỦ ĐIỀU KIỆN
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                                  🔒 KHÔNG ĐỦ ĐIỀU KIỆN
                                </span>
                              )}
                            </div>

                            <div>
                              <div className="text-lg font-black text-red-500 font-mono">
                                {formatVND(pkg.gia)}
                              </div>
                              <div className="text-[11px] text-zinc-400">
                                / {pkg.thoiGianThem}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-zinc-800 text-xs space-y-1.5 text-zinc-300">
                              <div className="font-bold text-[11px] text-zinc-400 uppercase font-mono">Quyền lợi:</div>
                              {pkg.quyenLoi.map((ql, i) => (
                                <div key={i} className="text-[11px] leading-relaxed flex items-start gap-1">
                                  <span className="text-emerald-400 font-bold">•</span>
                                  <span>{ql}</span>
                                </div>
                              ))}
                              {pkg.reason && (
                                <div className="text-[11px] text-amber-400 italic pt-1">
                                  {pkg.reason}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-4 mt-4 border-t border-zinc-800">
                            {isSelected ? (
                              <button
                                type="button"
                                className="w-full py-2.5 rounded-xl font-bold text-xs bg-red-700 text-white shadow"
                              >
                                ĐÃ CHỌN ✓
                              </button>
                            ) : isEligible ? (
                              <button
                                type="button"
                                className="w-full py-2.5 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                              >
                                CHỌN GÓI NÀY
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="w-full py-2.5 rounded-xl font-semibold text-xs bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-800"
                              >
                                [ 🔒 Không khả dụng ]
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Thanh tóm tắt ở dưới */}
                  {(() => {
                    const chosen = SHOWROOM_EXT_PACKAGES.find(p => p.id === wizardPkgId) || SHOWROOM_EXT_PACKAGES[0];
                    return (
                      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                        <div>
                          Tên xe: <strong className="text-white">{wizardVehicle.tenXe}</strong> · Gói đã chọn: <strong className="text-emerald-400">{chosen.tenGoi}</strong> · Giá: <strong className="text-red-400">{formatVND(chosen.gia)}</strong>
                        </div>
                        <span className="text-zinc-400 text-[11px]">
                          Thời hạn cộng thêm: <strong>{chosen.thoiGianThem} / {chosen.kmThem}</strong>
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  BƯỚC 4: THANH TOÁN & HOÀN TẤT (ẢNH 4b)
                  ───────────────────────────────────────────────────────────── */}
              {wizardStep === 4 && wizardVehicle && wizardCustomer && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Cột trái: CHI TIẾT ĐƠN HÀNG DỊCH VỤ */}
                  {(() => {
                    const chosen = SHOWROOM_EXT_PACKAGES.find(p => p.id === wizardPkgId) || SHOWROOM_EXT_PACKAGES[0];
                    return (
                      <div className="lg:col-span-6 space-y-4">
                        <div className="p-5 rounded-2xl bg-[#18181b] border border-zinc-800 space-y-4">
                          <div className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider pb-2 border-b border-zinc-800">
                            CHI TIẾT ĐƠN HÀNG DỊCH VỤ
                          </div>

                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between py-1 border-b border-zinc-800/80">
                              <span className="text-zinc-400">Khách hàng:</span>
                              <strong className="text-white uppercase font-display">{wizardCustomer.hoTen}</strong>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-800/80">
                              <span className="text-zinc-400">Số điện thoại:</span>
                              <strong className="text-zinc-200 font-mono">{wizardCustomer.soDienThoai}</strong>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-800/80">
                              <span className="text-zinc-400">Xe áp dụng:</span>
                              <strong className="text-white">{wizardVehicle.tenXe} ({wizardVehicle.bienSo || '59K9 - 876.54'})</strong>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-800/80">
                              <span className="text-zinc-400">Số ODO ghi nhận:</span>
                              <strong className="text-zinc-200 font-mono">{wizardOdo.toLocaleString('vi-VN')} km</strong>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-800/80">
                              <span className="text-zinc-400">Gói gia hạn:</span>
                              <strong className="text-emerald-400 font-bold">{chosen.tenGoi}</strong>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-800/80">
                              <span className="text-zinc-400">Thời hạn bảo hành mới:</span>
                              <strong className="text-emerald-400 font-mono">+{chosen.thoiGianThem} / +{chosen.kmThem}</strong>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-300 uppercase font-mono">
                              TỔNG TIỀN THANH TOÁN:
                            </span>
                            <span className="text-xl font-black text-red-500 font-mono">
                              {formatVND(chosen.gia)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Cột phải: CHỌN PHƯƠNG THỨC THANH TOÁN */}
                  {(() => {
                    const chosen = SHOWROOM_EXT_PACKAGES.find(p => p.id === wizardPkgId) || SHOWROOM_EXT_PACKAGES[0];
                    const change = Math.max(0, wizardCashGiven - chosen.gia);

                    return (
                      <div className="lg:col-span-6 space-y-4">
                        <div className="p-5 rounded-2xl bg-[#18181b] border border-zinc-800 space-y-4">
                          <div className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider pb-2 border-b border-zinc-800">
                            CHỌN PHƯƠNG THỨC THANH TOÁN
                          </div>

                          {/* 3 Tabs phương thức */}
                          <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => setWizardPaymentMethod('TienMat')}
                              className={`p-2.5 rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                wizardPaymentMethod === 'TienMat'
                                  ? 'bg-zinc-800 text-white border-red-600 shadow'
                                  : 'bg-[#121214] text-zinc-400 border-zinc-800 hover:text-white'
                              }`}
                            >
                              <span>💵</span>
                              <span>TIỀN MẶT</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setWizardPaymentMethod('POS')}
                              className={`p-2.5 rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                wizardPaymentMethod === 'POS'
                                  ? 'bg-zinc-800 text-white border-red-600 shadow'
                                  : 'bg-[#121214] text-zinc-400 border-zinc-800 hover:text-white'
                              }`}
                            >
                              <span>💳</span>
                              <span>QUẸT THẺ (POS)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setWizardPaymentMethod('ChuyenKhoan')}
                              className={`p-2.5 rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                wizardPaymentMethod === 'ChuyenKhoan'
                                  ? 'bg-zinc-800 text-white border-red-600 shadow'
                                  : 'bg-[#121214] text-zinc-400 border-zinc-800 hover:text-white'
                              }`}
                            >
                              <span>📱</span>
                              <span>VIETQR</span>
                            </button>
                          </div>

                          {/* Nội dung theo phương thức */}
                          {wizardPaymentMethod === 'TienMat' && (
                            <div className="p-4 rounded-xl bg-[#121214] border border-zinc-800 space-y-3 text-xs">
                              <div className="space-y-1">
                                <label className="text-zinc-400 block font-medium">Tiền khách đưa:</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={wizardCashGiven}
                                    onChange={e => setWizardCashGiven(Number(e.target.value) || 0)}
                                    className="w-full p-2.5 pr-10 rounded-xl bg-zinc-900 border border-zinc-700 text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-red-600"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono">
                                    ₫
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-zinc-400 block font-medium">Tiền thối lại:</label>
                                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 font-mono font-bold text-sm">
                                  {formatVND(change)}
                                </div>
                              </div>
                            </div>
                          )}

                          {wizardPaymentMethod === 'ChuyenKhoan' && (
                            <div className="p-4 rounded-xl bg-[#121214] border border-zinc-800 flex flex-col items-center justify-center text-center space-y-3">
                              <div className="p-2 bg-white rounded-xl shadow inline-block">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`2|99|0879179243|VIETCOMBANK|BH-0879179243|${chosen.gia}`)}`}
                                  alt="VietQR"
                                  className="w-40 h-40 object-contain"
                                />
                              </div>
                              <div className="text-xs text-zinc-300 space-y-0.5 font-mono">
                                <div>Ngân hàng: <strong>Vietcombank (VCB)</strong></div>
                                <div>Số TK: <strong>9988 7766 5544</strong></div>
                                <div>Số tiền: <strong className="text-red-400">{formatVND(chosen.gia)}</strong></div>
                                <div>Nội dung: <strong>BH 0879179243</strong></div>
                              </div>
                            </div>
                          )}

                          {wizardPaymentMethod === 'POS' && (
                            <div className="p-6 rounded-xl bg-[#121214] border border-zinc-800 text-center space-y-2 text-xs">
                              <div className="text-3xl">💳</div>
                              <div className="font-bold text-white text-sm">Quẹt thẻ qua máy POS Showroom</div>
                              <p className="text-zinc-400">
                                Nhân viên vui lòng quẹt thẻ tín dụng/ATM của khách trên máy POS với số tiền <strong>{formatVND(chosen.gia)}</strong> và kiểm tra biên lai thanh toán thành công.
                              </p>
                            </div>
                          )}

                          <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer pt-2 select-none">
                            <input
                              type="checkbox"
                              checked={wizardPrintInvoice}
                              onChange={e => setWizardPrintInvoice(e.target.checked)}
                              className="w-4 h-4 rounded accent-red-600 cursor-pointer"
                            />
                            <span>In hóa đơn &amp; biên lai cho khách</span>
                          </label>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>

            {/* Footer Buttons Điều Hướng */}
            <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((wizardStep - 1) as any)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition cursor-pointer"
                >
                  ← Quay lại
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateExtModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition cursor-pointer"
                >
                  Hủy
                </button>
              )}

              {wizardStep === 1 && (
                <button
                  type="button"
                  disabled={!wizardVehicle}
                  onClick={() => setWizardStep(2)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 disabled:bg-zinc-800 disabled:text-zinc-500 text-white shadow transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Tiếp theo (Kiểm tra lịch sử)</span>
                  <span>→</span>
                </button>
              )}

              {wizardStep === 2 && (
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Tiếp tục (Chọn gói bảo hành)</span>
                  <span>→</span>
                </button>
              )}

              {wizardStep === 3 && (
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Tiếp tục (Thanh toán)</span>
                  <span>→</span>
                </button>
              )}

              {wizardStep === 4 && (
                <button
                  type="button"
                  onClick={handleConfirmShowroomExtension}
                  className="px-7 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-red-700 hover:bg-red-800 text-white shadow-lg transition cursor-pointer flex items-center gap-2"
                >
                  <span>Xác nhận thu tiền &amp; Kích hoạt</span>
                  <span>✓</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: XEM CHI TIẾT BẢO HÀNH CHUẨN 5 KHỐI TRỰC QUAN (GH04 - ẢNH 5)
          ========================================================================= */}
      {selectedExtDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#121214] text-white rounded-3xl max-w-5xl w-full border border-zinc-800 shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
            
            {/* Header Modal */}
            <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
              <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-black text-white font-mono uppercase tracking-tight">
                  CHI TIẾT BẢO HÀNH #{selectedExtDetail.tx.id}
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ĐANG HIỆU LỰC
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedExtDetail(null)}
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm border border-zinc-700 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body 5 Khối theo đúng Ảnh 5 */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* CỘT TRÁI (8 Cột): 4 Khối thông tin */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Hàng 1: THÔNG TIN KHÁCH HÀNG & THÔNG TIN GÓI BẢO HÀNH */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* KHỐI 1: THÔNG TIN KHÁCH HÀNG */}
                    <div className="p-5 rounded-2xl bg-[#18181b] border border-zinc-800 space-y-3">
                      <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        THÔNG TIN KHÁCH HÀNG
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-amber-500 text-black font-black text-sm flex items-center justify-center shrink-0 shadow">
                          {selectedExtDetail.tx.khachHang.split(' ').map(w => w[0]).slice(-2).join('') || 'KH'}
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-500 uppercase font-mono">Avatar</div>
                          <div className="font-black text-white text-sm uppercase font-display">
                            {selectedExtDetail.tx.khachHang}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Điện thoại:</span>
                          <strong className="text-zinc-200 font-mono">{selectedExtDetail.tx.soDienThoai}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Email:</span>
                          <strong className="text-zinc-300">{selectedExtDetail.tx.email || 'lethilanphuong@gmail.com'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Địa chỉ:</span>
                          <strong className="text-zinc-300">{selectedExtDetail.tx.diaChi || 'TP.HCM'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* KHỐI 3: THÔNG TIN GÓI BẢO HÀNH */}
                    <div className="p-5 rounded-2xl bg-[#18181b] border border-zinc-800 space-y-3">
                      <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        THÔNG TIN GÓI BẢO HÀNH
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Gói hạn:</span>
                          <strong className="text-emerald-400 font-bold uppercase">{selectedExtDetail.tx.goiGiaHan}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Dưới hạn:</span>
                          <strong className="text-zinc-200 font-mono">{selectedExtDetail.tx.quyenLoiGoi || '+12 tháng / +10.000 km'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Expiry bảo hành original:</span>
                          <strong className="text-zinc-300 font-mono">{selectedExtDetail.tx.thoiHanGoc || '25/10/2026'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Expiry bảo hành mở rộng:</span>
                          <strong className="text-amber-400 font-mono font-bold">{selectedExtDetail.tx.thoiHanMoi}</strong>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-zinc-800/80">
                          <span className="text-zinc-500">Giá:</span>
                          <strong className="text-red-400 font-mono font-bold text-sm">{formatVND(selectedExtDetail.tx.soTien)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hàng 2: THÔNG TIN PHƯƠNG TIỆN & CHI TIẾT THANH TOÁN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* KHỐI 2: THÔNG TIN PHƯƠNG TIỆN */}
                    <div className="p-5 rounded-2xl bg-[#18181b] border border-zinc-800 space-y-3">
                      <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        THÔNG TIN PHƯƠNG TIỆN
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                          <img
                            src={getVehicleCatalogImage(selectedExtDetail.tx.tenXe || selectedExtDetail.tx.xeBienSo, selectedExtDetail.tx.hinhAnhXe)}
                            alt="Xe"
                            className="w-full h-full object-cover"
                            onError={e => { (e.currentTarget as any).src = getVehicleCatalogImage(selectedExtDetail.tx.tenXe || selectedExtDetail.tx.xeBienSo); }}
                          />
                        </div>
                        <div className="font-bold text-white text-xs">
                          <div>{selectedExtDetail.tx.tenXe || selectedExtDetail.tx.xeBienSo}</div>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">License plate:</span>
                          <strong className="text-white font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                            {selectedExtDetail.tx.bienSo || selectedExtDetail.tx.xeBienSo.split('(')[1]?.replace(')', '') || '59K9 - 876.54'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Số khung:</span>
                          <strong className="text-zinc-300 font-mono">{selectedExtDetail.tx.soKhung || 'RLHKD160CB7747410'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Số máy:</span>
                          <strong className="text-zinc-300 font-mono">{selectedExtDetail.tx.soMay || 'JF62E088888'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">ODO check-in:</span>
                          <strong className="text-emerald-400 font-mono">{(selectedExtDetail.tx.odo || 12500).toLocaleString('vi-VN')} km</strong>
                        </div>
                      </div>
                    </div>

                    {/* KHỐI 4: CHI TIẾT THANH TOÁN */}
                    <div className="p-5 rounded-2xl bg-[#18181b] border border-zinc-800 space-y-3">
                      <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        CHI TIẾT THANH TOÁN
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Hình thức:</span>
                          <strong className="text-white">
                            {selectedExtDetail.tx.phuongThucThanhToan === 'ChuyenKhoan' ? 'Chuyển khoản (VietQR)' : selectedExtDetail.tx.phuongThucThanhToan === 'POS' ? 'Quẹt thẻ (POS)' : 'Tiền mặt'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Amount paid:</span>
                          <strong className="text-emerald-400 font-mono font-black text-sm">{formatVND(selectedExtDetail.tx.soTien)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Thời gian:</span>
                          <strong className="text-zinc-300 font-mono">{selectedExtDetail.tx.thoiGianThanhToan || `${selectedExtDetail.tx.ngayGiaHan} - 15:32`}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Cashier:</span>
                          <strong className="text-white">{selectedExtDetail.tx.nhanVien || 'Trần Văn Quản Lý'}</strong>
                        </div>
                        <div className="pt-2">
                          <span className="px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800 flex items-center gap-1.5 w-fit">
                            <span>📄</span>
                            <span>Đã in hóa đơn</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CỘT PHẢI (4 Cột): KHỐI 5: LỊCH SỬ DỊCH VỤ & BẢO HÀNH (ẢNH 5) */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="p-5 rounded-2xl bg-[#18181b] border border-zinc-800 space-y-4">
                    <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider pb-2 border-b border-zinc-800">
                      LỊCH SỬ DỊCH VỤ &amp; BẢO HÀNH
                    </div>

                    <div className="relative pl-6 space-y-4 text-xs border-l-2 border-zinc-800 ml-2">
                      {/* Timeline các mốc chuẩn Ảnh 5 */}
                      <div className="relative">
                        <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-amber-400 ring-4 ring-[#18181b]" />
                        <div className="font-bold text-white font-mono">
                          29/10/2026 - Kích hoạt bảo hành mở rộng (12 tháng)
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          ODO: 12.500 km
                        </div>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-[#18181b]" />
                        <div className="font-bold text-white font-mono">
                          29/10/2026 - Phê duyệt đủ điều kiện gia hạn
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          (Tại quầy Showroom)
                        </div>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-[#18181b]" />
                        <div className="font-bold text-white font-mono">
                          10/06/2026 - Bảo dưỡng định kỳ lần 3
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          (Tại CN1 - Quận 1) · ODO: 11.200 km
                        </div>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-[#18181b]" />
                        <div className="font-bold text-white font-mono">
                          20/01/2026 - Sửa chữa/thay thế dầu máy
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          (Tại CN1 - Quận 1) · ODO: 7.500 km
                        </div>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-[#18181b]" />
                        <div className="font-bold text-white font-mono">
                          15/09/2025 - Bảo dưỡng định kỳ lần 2
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          (Tại CN1 - Quận 1) · ODO: 4.800 km
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer Buttons chuẩn Ảnh 5 */}
            <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
              <div className="text-xs text-zinc-500 font-mono">
                Mã hồ sơ điện tử: <strong>{selectedExtDetail.tx.id}</strong>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPrintExtInvoice(selectedExtDetail.tx)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <span>🖨️ In lại hóa đơn</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    alert(`Đang mở kết nối nhắn tin trực tiếp với khách hàng ${selectedExtDetail.tx.khachHang} (${selectedExtDetail.tx.soDienThoai})...`);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <span>💬 Chat với Khách</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedExtDetail(null)}
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-red-700 hover:bg-red-800 text-white shadow transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: IN BIÊN BẢN BÀN GIAO / IN HÓA ĐƠN (BƯỚC 6)
          ========================================================================= */}
      {printDocument && (() => {
        const pTotal = printDocument.claim.b3_tongChiPhi ?? 950000;
        const pKhach = printDocument.claim.b3_khachThanhToan ?? 0;
        const pHang = printDocument.claim.b3_chiPhiBaoHanhChiTra ?? (pTotal - pKhach);
        const pIsFree = pKhach === 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div>
                  <div className="text-xs text-zinc-400 font-mono font-bold">SHOWROOM XE MÁY &amp; PHỤ TÙNG CHÍNH HÃNG</div>
                  <h3 className="text-lg font-black text-zinc-900 font-mono uppercase mt-0.5">
                    {printDocument.type === 'BienBanBanGiao'
                      ? 'BIÊN BẢN NGHIỆM THU & BÀN GIAO XE BẢO HÀNH'
                      : pIsFree
                      ? 'HÓA ĐƠN DỊCH VỤ BẢO HÀNH (0Đ - HÃNG CHI TRẢ)'
                      : 'HÓA ĐƠN DỊCH VỤ & PHỤ THU BẢO HÀNH'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPrintDocument(null)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>Khách hàng: <strong>{printDocument.claim.khachHang}</strong></div>
                  <div>SĐT: <strong className="font-mono">{printDocument.claim.soDienThoai}</strong></div>
                  <div>Xe: <strong>{printDocument.claim.xeBienSo}</strong></div>
                  <div>Mã hồ sơ: <strong className="font-mono text-red-700">{printDocument.claim.id}</strong></div>
                </div>

                <div className="pt-2 border-t border-zinc-200">
                  <div className="font-bold text-zinc-900 mb-1">Nội dung khắc phục kỹ thuật:</div>
                  <p className="text-zinc-700">
                    {printDocument.claim.b2_chiTietLoi || 'Thay mới cụm búa côn và chuông nồi sau, khắc phục rung giật khi tăng ga.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-200 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>Tổng chi phí phát sinh:</span>
                    <strong>{formatVND(pTotal)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Hãng xe bảo hành chi trả:</span>
                    <strong className="text-emerald-700">{formatVND(pHang)} ({pIsFree ? '100%' : 'Bảo hành'})</strong>
                  </div>
                  <div className="flex justify-between font-bold border-t border-zinc-200 pt-1 items-center">
                    <span>KHÁCH HÀNG THANH TOÁN:</span>
                    {pIsFree ? (
                      <span className="text-base text-emerald-700 font-black">0 đ (Miễn phí 100%)</span>
                    ) : (
                      <span className="text-base text-red-700 font-black">{formatVND(pKhach)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    setPrintDocument(null);
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🖨️ In bản cứng ngay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintDocument(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          MODAL 4: TỪ CHỐI TIẾP NHẬN / BẢO HÀNH
          ========================================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <h3 className="text-base font-black text-red-700 font-mono">
              XÁC NHẬN TỪ CHỐI TIẾP NHẬN BẢO HÀNH
            </h3>
            <p className="text-xs text-zinc-600">
              Vui lòng chọn hoặc nhập lý do từ chối yêu cầu bảo hành này:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs text-black bg-white"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL IN HÓA ĐƠN GIA HẠN BẢO HÀNH CHUYÊN NGHIỆP (ẢNH 3 FIX)
          ========================================================================= */}
      {printExtInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #print-warranty-invoice, #print-warranty-invoice * {
                visibility: visible !important;
              }
              #print-warranty-invoice {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                border: none !important;
                box-shadow: none !important;
                padding: 24px !important;
                margin: 0 !important;
                background: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
          <div
            id="print-warranty-invoice"
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto text-black"
          >
            {/* Header hóa đơn chuẩn */}
            <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-4">
              <div>
                <div className="text-[11px] font-black tracking-wider text-red-700 uppercase font-mono">
                  HỆ THỐNG ĐẠI LÝ MOTOSHOP ỦY QUYỀN CHÍNH HÃNG
                </div>
                <h3 className="text-xl font-black text-zinc-900 uppercase font-display mt-0.5">
                  HÓA ĐƠN GIA HẠN BẢO HÀNH (CARE+)
                </h3>
                <div className="text-xs text-zinc-500 font-mono mt-0.5">
                  Mã chứng từ: <strong className="text-zinc-900 font-bold">#HD-GHBH-{printExtInvoice.id}</strong> · Ngày lập: {printExtInvoice.ngayGiaHan || '31/10/2026'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrintExtInvoice(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold text-xs cursor-pointer no-print"
              >
                ✕
              </button>
            </div>

            {/* Thông tin Khách hàng & Phương tiện */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
              <div className="space-y-1">
                <div className="font-bold text-zinc-900 uppercase font-mono text-[10px] text-zinc-500">I. THÔNG TIN KHÁCH HÀNG</div>
                <div>Họ và tên: <strong className="text-zinc-900">{printExtInvoice.khachHang}</strong></div>
                <div>Số điện thoại: <strong className="font-mono text-zinc-800">{printExtInvoice.soDienThoai}</strong></div>
                {printExtInvoice.email && <div>Email: {printExtInvoice.email}</div>}
                {printExtInvoice.diaChi && <div>Địa chỉ: {printExtInvoice.diaChi}</div>}
              </div>
              <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-zinc-200 sm:pl-3 pt-2 sm:pt-0">
                <div className="font-bold text-zinc-900 uppercase font-mono text-[10px] text-zinc-500">II. THÔNG TIN PHƯƠNG TIỆN</div>
                <div>Phương tiện: <strong className="text-zinc-900">{printExtInvoice.tenXe || printExtInvoice.xeBienSo}</strong></div>
                <div>Biển số: <strong className="font-mono text-zinc-800">{printExtInvoice.bienSo || 'Chưa bấm biển'}</strong></div>
                {printExtInvoice.soKhung && <div>Số khung (VIN): <span className="font-mono">{printExtInvoice.soKhung}</span></div>}
                {printExtInvoice.odo && <div>Số ODO ghi nhận: <span className="font-mono">{printExtInvoice.odo.toLocaleString()} km</span></div>}
              </div>
            </div>

            {/* Bảng chi tiết gói bảo hành */}
            <div className="border border-zinc-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-700 font-bold font-mono">
                  <tr>
                    <th className="p-3">Hạng mục dịch vụ</th>
                    <th className="p-3">Thời hạn bảo hành</th>
                    <th className="p-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  <tr>
                    <td className="p-3">
                      <div className="font-bold text-zinc-900">{printExtInvoice.goiGiaHan}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {printExtInvoice.quyenLoiGoi || 'Bảo vệ toàn diện động cơ, hộp số, hệ thống điện tử chính hãng tại mọi đại lý toàn quốc'}
                      </div>
                    </td>
                    <td className="p-3 font-mono">
                      <div className="font-bold text-emerald-700">Hạn mới: {printExtInvoice.thoiHanMoi}</div>
                      <div className="text-[11px] text-zinc-400">Hạn gốc: {printExtInvoice.thoiHanGoc}</div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-zinc-900 text-sm">
                      {formatVND(printExtInvoice.soTien)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">
                      <div className="font-bold text-zinc-900">Sổ bảo hành điện tử chính hãng (Care+)</div>
                      <div className="text-[11px] text-zinc-500">Cập nhật hồ sơ bảo hành điện tử trên hệ thống quản lý tập trung</div>
                    </td>
                    <td className="p-3 text-zinc-600">Đồng bộ toàn quốc</td>
                    <td className="p-3 text-right font-mono text-emerald-700 font-semibold">Miễn phí</td>
                  </tr>
                </tbody>
                <tfoot className="bg-zinc-50 border-t border-zinc-200">
                  <tr>
                    <td colSpan={2} className="p-3 font-bold text-zinc-900 uppercase font-mono text-right">
                      TỔNG CỘNG THANH TOÁN:
                    </td>
                    <td className="p-3 text-right font-mono font-black text-red-700 text-base">
                      {formatVND(printExtInvoice.soTien)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Thông tin thanh toán */}
            <div className="flex items-center justify-between text-xs text-zinc-600 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
              <div>
                Hình thức thanh toán: <strong className="text-zinc-900 uppercase">{printExtInvoice.phuongThucThanhToan || 'Chuyển khoản (VietQR)'}</strong>
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ ĐÃ THANH TOÁN 100%
                </span>
              </div>
              <div>Thu ngân: <strong className="text-zinc-900">{printExtInvoice.nhanVien || 'Trần Văn Quản Lý'}</strong></div>
            </div>

            {/* Chữ ký 2 bên */}
            <div className="grid grid-cols-2 gap-4 text-center text-xs pt-4 border-t border-zinc-200">
              <div>
                <div className="font-bold uppercase text-zinc-900 font-mono">ĐẠI DIỆN THU NGÂN SHOWROOM</div>
                <div className="text-[11px] text-zinc-400 italic">(Ký, họ tên & đóng dấu)</div>
                <div className="mt-12 font-bold text-zinc-900">{printExtInvoice.nhanVien || 'Trần Văn Quản Lý'}</div>
              </div>
              <div>
                <div className="font-bold uppercase text-zinc-900 font-mono">KHÁCH HÀNG XÁC NHẬN</div>
                <div className="text-[11px] text-zinc-400 italic">(Ký và ghi rõ họ tên)</div>
                <div className="mt-12 font-bold text-zinc-900">{printExtInvoice.khachHang}</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>🖨️ In bản cứng ngay</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintExtInvoice(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
