import React, { useState, useMemo } from 'react';
import type { Vehicle, Customer, InsuranceContract } from '../../data/mockData';
import {
  INSURANCE_PACKAGES,
  formatVND,
} from '../../data/mockData';
import { insuranceApi, isNoPlate } from '../../services/api';

interface OnlineInsurancePurchaseViewProps {
  customer: Customer | null;
  vehicles: Vehicle[];
  initialVehicle?: Vehicle | null;
  flowMode?: 'FLOW_1_BUY_FOR_VEHICLE' | 'FLOW_2_REGISTER_NEW';
  onAddNewVehicle: () => void;
  onCancel: () => void;
  onSuccess: (newContract: InsuranceContract) => void;
}

export default function OnlineInsurancePurchaseView({
  customer,
  vehicles,
  initialVehicle,
  flowMode,
  onAddNewVehicle,
  onCancel,
  onSuccess,
}: OnlineInsurancePurchaseViewProps) {
  // Xác định rõ 2 luồng độc lập theo yêu cầu BHX01 & BHX02
  const isFlow1 = flowMode === 'FLOW_1_BUY_FOR_VEHICLE' || (!flowMode && !!initialVehicle);
  const isFlow2 = !isFlow1;

  // 1. Thông tin người mua
  const [buyerName, setBuyerName] = useState(customer?.hoTen || 'Nguyễn Văn A');
  const [buyerPhone, setBuyerPhone] = useState(customer?.soDienThoai || '0987 654 321');
  const [buyerEmail, setBuyerEmail] = useState(customer?.email || 'nguyenvana@gmail.com');

  // 2. Phương tiện chọn mua (Flow 1: Cố định theo xe đã chọn; Flow 2: Chỉ thêm xe mới)
  const [selectedVehId, setSelectedVehId] = useState<string>(
    initialVehicle ? initialVehicle.id : vehicles.length > 0 ? vehicles[0].id : ''
  );

  // State xe mới cho Flow 2 (BHX02)
  const [newVehicle, setNewVehicle] = useState<Vehicle | null>(null);
  const [newVehForm, setNewVehForm] = useState({
    tenXe: '',
    hangXe: 'Honda',
    bienSo: '',
    soKhung: '',
    soMay: '',
  });
  const [newVehError, setNewVehError] = useState<string | null>(null);

  // 3. Gói bảo hiểm
  const [selectedPkgId, setSelectedPkgId] = useState<'TNDS_BAT_BUOC' | 'TNDS_NGUOI_NGOI' | 'VAT_CHAT_TOAN_DIEN'>(
    'VAT_CHAT_TOAN_DIEN'
  );

  // 4. Thời gian hiệu lực & Ưu đãi (BHX03: Cố định ngày bắt đầu hiệu lực = ngày đăng ký thực tế)
  const startDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [durationYears, setDurationYears] = useState<number>(1);
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Modal Hợp đồng Demo & Thanh toán QR
  const [showDemoContract, setShowDemoContract] = useState<boolean>(false);
  const [showPaymentQr, setShowPaymentQr] = useState<boolean>(false);
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  // Xe đang được chọn (Flow 1 dùng xe cố định, Flow 2 dùng xe mới vừa thêm)
  const activeVehicle: Vehicle | null = useMemo(() => {
    if (isFlow1) {
      if (initialVehicle) return initialVehicle;
      return vehicles.find(v => v.id === selectedVehId) || vehicles[0] || null;
    }
    // Flow 2: Chỉ sử dụng xe mới thêm
    return newVehicle;
  }, [isFlow1, initialVehicle, vehicles, selectedVehId, newVehicle]);

  // Gói đang được chọn
  const selectedPackage = useMemo(() => {
    return INSURANCE_PACKAGES.find(p => p.id === selectedPkgId) || INSURANCE_PACKAGES[0];
  }, [selectedPkgId]);

  // Tính toán chi phí
  const basePrice = useMemo(() => {
    if (selectedPkgId === 'TNDS_BAT_BUOC') {
      return durationYears === 1 ? 66000 : durationYears === 2 ? 120000 : 180000;
    }
    if (selectedPkgId === 'TNDS_NGUOI_NGOI') {
      return durationYears === 1 ? 150000 : durationYears === 2 ? 280000 : 400000;
    }
    return durationYears === 1 ? 1250000 : durationYears === 2 ? 2300000 : 3300000;
  }, [selectedPkgId, durationYears]);

  const vatAmount = Math.round(basePrice * 0.1);
  const discountAmount = appliedCoupon ? Math.round(basePrice * 0.1) : 0;
  const totalAmount = basePrice + vatAmount - discountAmount;

  // Tính ngày kết thúc
  const endDate = useMemo(() => {
    const d = new Date(startDate);
    d.setFullYear(d.getFullYear() + durationYears);
    return d.toISOString().split('T')[0];
  }, [startDate, durationYears]);

  // Áp dụng mã giảm giá
  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'MOTOCARE10' || couponCode.trim().toUpperCase() === 'VIP') {
      setAppliedCoupon(couponCode.trim().toUpperCase());
      alert('Áp dụng mã giảm giá 10% thành công!');
    } else if (couponCode.trim()) {
      alert('Mã giảm giá không hợp lệ hoặc đã hết hạn! Thử mã "MOTOCARE10"');
    }
  };

  // Xử lý xác nhận thêm xe mới trong Flow 2 (BHX02)
  const handleConfirmNewVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setNewVehError(null);

    const name = newVehForm.tenXe.trim();
    if (!name) {
      setNewVehError('Vui lòng nhập tên dòng xe máy!');
      return;
    }

    const cleanInputPlate = newVehForm.bienSo.trim().replace(/[\s-.]/g, '').toUpperCase();
    const cleanInputVin = newVehForm.soKhung.trim().toUpperCase();

    // Kiểm tra trùng phương tiện đã tồn tại của người dùng (BHX02)
    if (cleanInputPlate && !isNoPlate(cleanInputPlate)) {
      const isPlateExists = vehicles.some(v =>
        v.bienSo &&
        !isNoPlate(v.bienSo) &&
        v.bienSo.replace(/[\s-.]/g, '').toUpperCase() === cleanInputPlate
      );
      if (isPlateExists) {
        setNewVehError(`⚠️ Phương tiện mang biển số "${newVehForm.bienSo}" đã tồn tại trong danh sách của bạn! Flow 2 chỉ dành cho phương tiện mới.`);
        return;
      }
    }

    if (cleanInputVin) {
      const isVinExists = vehicles.some(v =>
        v.soKhung && v.soKhung.trim().toUpperCase() === cleanInputVin
      );
      if (isVinExists) {
        setNewVehError(`⚠️ Số khung VIN "${newVehForm.soKhung}" đã tồn tại trong danh sách phương tiện của bạn!`);
        return;
      }
    }

    const newObj: Vehicle = {
      id: `XE-NEW-${Date.now()}`,
      customerId: customer?.id || 'KH01',
      tenXe: name,
      hangXe: newVehForm.hangXe,
      bienSo: newVehForm.bienSo.trim().toUpperCase() || 'Chưa có biển số',
      soKhung: cleanInputVin || `RLHKD160CB${Date.now().toString().slice(-7)}`,
      soMay: newVehForm.soMay.trim().toUpperCase() || `KF12E-${Date.now().toString().slice(-7)}`,
      namSanXuat: new Date().getFullYear(),
      hanBaoHanh: `${new Date().getFullYear() + 3}-12-31`,
      trangThaiBaoHanh: 'ConHan',
      mauSac: 'Tiêu chuẩn',
      trangThaiDuyet: 'DaDuyet',
      ngayMua: new Date().toISOString().split('T')[0],
      nguonGoc: 'NgoaiHeThong',
    };

    setNewVehicle(newObj);
    setSelectedVehId(newObj.id);
  };

  // Xác nhận mở popup Hợp đồng demo
  const handleOpenDemoContract = () => {
    // Chặn nếu tài khoản bị khóa
    if (customer?.trangThai === 'BiKhoa') {
      alert('⚠️ TÀI KHOẢN BỊ KHÓA: Tài khoản của quý khách đang bị tạm khóa bởi Quản trị viên. Quý khách không thể thực hiện đăng ký mua bảo hiểm mới!');
      return;
    }

    // Kiểm tra phương tiện
    if (isFlow1 && (!activeVehicle || vehicles.length === 0)) {
      alert('⚠️ YÊU CẦU: Bạn phải có ít nhất 1 phương tiện liên kết với tài khoản để mua bảo hiểm!');
      onAddNewVehicle();
      return;
    }

    if (isFlow2 && !newVehicle) {
      alert('⚠️ YÊU CẦU BƯỚC 2: Vui lòng nhập và bấm "Xác nhận thêm xe mới" trước khi tiếp tục mua bảo hiểm!');
      return;
    }

    const targetVeh = activeVehicle;
    if (!targetVeh) {
      alert('Vui lòng chọn phương tiện cần mua bảo hiểm!');
      return;
    }

    // Kiểm tra trùng gói bảo hiểm còn hiệu lực
    const allContracts = insuranceApi.getAll();
    const normPlate = (targetVeh.bienSo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const duplicate = allContracts.find(c => {
      if (c.trangThai !== 'HieuLuc') return false;
      if (c.packageType !== selectedPkgId) return false;
      const cPlateNorm = (c.bienSo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchVeh = (targetVeh.id && c.vehicleId === targetVeh.id) ||
        (normPlate && cPlateNorm && normPlate !== 'chuacobienso' && normPlate === cPlateNorm);
      if (!matchVeh) return false;
      return c.ngayKetThuc >= startDate;
    });

    if (duplicate) {
      alert(`⚠️ PHƯƠNG TIỆN ĐÃ CÓ BẢO HIỂM CÙNG LOẠI:\n\nXe "${targetVeh.tenXe}" (${targetVeh.bienSo || 'Chưa có biển'}) hiện đã có hợp đồng "${duplicate.tenGoi}" (Số GCN: ${duplicate.soGCN}) đang còn hiệu lực đến ngày ${duplicate.ngayKetThuc.split('-').reverse().join('/')}.\n\nHệ thống không cho phép mua trùng gói bảo hiểm còn hạn. Vui lòng chọn gói khác hoặc sử dụng chức năng "Gia hạn hợp đồng" tại mục "Bảo hiểm của tôi"!`);
      return;
    }

    setShowDemoContract(true);
  };

  // Tiến hành chuyển khoản QR
  const handleProceedToPayment = () => {
    setShowDemoContract(false);
    setShowPaymentQr(true);
  };

  // Hoàn tất thanh toán thành công
  const handleCompletePayment = async () => {
    const finalVehicle = activeVehicle;
    if (!customer || !finalVehicle) return;
    setSubmittingPayment(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Nếu là Flow 2 và đã nhập xe mới: lưu vào danh sách xe của khách
      if (isFlow2 && newVehicle) {
        try {
          const cached = localStorage.getItem('crm_customer_vehicles');
          const list: Vehicle[] = cached ? JSON.parse(cached) : [];
          if (!list.some(v => v.id === newVehicle.id || (v.soKhung && newVehicle.soKhung && v.soKhung === newVehicle.soKhung))) {
            list.unshift(newVehicle);
            localStorage.setItem('crm_customer_vehicles', JSON.stringify(list));
            window.dispatchEvent(new CustomEvent('crm-vehicles-updated'));
          }
        } catch (e) {
          console.warn('[OnlineInsurancePurchaseView] Lỗi lưu xe mới:', e);
        }
      }

      // Tạo hợp đồng bảo hiểm chính thức
      const newContract = insuranceApi.create({
        customerId: customer.id,
        hoTenKH: isFlow1 ? (customer.hoTen || buyerName) : buyerName.trim(),
        soDienThoai: isFlow1 ? (customer.soDienThoai || buyerPhone) : buyerPhone.trim(),
        email: isFlow1 ? (customer.email || buyerEmail) : buyerEmail.trim(),
        diaChi: customer.diaChi || 'Toàn quốc',
        vehicleId: finalVehicle.id,
        tenXe: finalVehicle.tenXe,
        bienSo: finalVehicle.bienSo || 'Chưa có biển số',
        soKhung: finalVehicle.soKhung || 'Chưa cập nhật',
        soMay: (finalVehicle as any).soMay || 'Đang cập nhật',
        packageType: selectedPkgId,
        tenGoi: selectedPackage.tenGoi,
        thoiHanNam: durationYears,
        phiBaoHiem: basePrice,
        thueVAT: vatAmount,
        tongTien: totalAmount,
        maGiamGia: appliedCoupon || undefined,
        phuongThucThanhToan: 'ChuyenKhoan',
        nhaBaoHiem: 'Tổng Công ty Bảo hiểm Bảo Việt',
        ngayCap: todayStr,
        ngayBatDau: todayStr, // BHX03: Cố định ngày bắt đầu = ngày đăng ký
        ngayKetThuc: endDate,
        trangThai: 'HieuLuc',
        ghiChu: `Hợp đồng mua online (${isFlow1 ? 'Flow 1: Mua cho xe đã chọn' : 'Flow 2: Đăng ký xe mới'}). Đã thanh toán chuyển khoản qua VietQR.`,
      });

      setSubmittingPayment(false);
      setShowPaymentQr(false);
      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'insurance_contracts' } }));
      onSuccess(newContract);
    } catch {
      setSubmittingPayment(false);
      alert('Có lỗi xảy ra khi tạo hợp đồng bảo hiểm. Vui lòng thử lại!');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header breadcrumb & title */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-200">
        <nav className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
          <button
            type="button"
            onClick={onCancel}
            className="hover:text-red-700 transition flex items-center gap-1 cursor-pointer font-bold text-zinc-700"
          >
            <span>← Quay lại bảo hiểm của tôi</span>
          </button>
          <span>/</span>
          <span className="text-zinc-950 font-bold font-mono">
            {isFlow1 ? 'Mua bảo hiểm xe đã chọn (Flow 1)' : 'Đăng ký bảo hiểm mới (Flow 2)'}
          </span>
        </nav>

        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
        >
          ✕ Hủy
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-black text-zinc-950 uppercase tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isFlow1 ? 'MUA BẢO HIỂM CHO XE ĐÃ CHỌN' : 'ĐĂNG KÝ BẢO HIỂM XE MỚI'}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isFlow1
              ? 'Thông tin chủ xe và phương tiện được cố định ở chế độ chỉ đọc từ hồ sơ xe của bạn'
              : 'Đăng ký bảo hiểm cho phương tiện mới, nhập thông tin xe và cấp GCN điện tử tức thì'}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 self-start sm:self-auto font-mono">
          BẢO HIỂM ĐIỆN TỬ CHÍNH HÃNG
        </span>
      </div>

      {/* Banner cảnh báo nếu tài khoản khách hàng bị khóa */}
      {customer?.trangThai === 'BiKhoa' && (
        <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-700 flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <div className="font-bold text-sm uppercase">Tài khoản hiện đang bị khóa</div>
            <div className="text-xs text-red-600 mt-0.5">
              Tài khoản của bạn đã bị khóa bởi Quản trị viên. Bạn không thể thực hiện giao dịch đăng ký hoặc thanh toán bảo hiểm trực tuyến.
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Cột trái Form (8 cols) & Cột phải Tóm tắt đơn hàng (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI: FORM ĐIỀN THÔNG TIN */}
        <div className="lg:col-span-8 space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm">
          
          {/* ────────────────────────────────────────────────────────── */}
          {/* 1. THÔNG TIN NGƯỜI MUA (BHX01) */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wide text-zinc-900 font-mono flex items-center gap-2">
                <span>1. THÔNG TIN NGƯỜI MUA</span>
                {isFlow1 ? (
                  <span className="text-[11px] font-normal text-zinc-500">
                    (🔒 Chế độ chỉ đọc từ hồ sơ chủ xe)
                  </span>
                ) : (
                  <span className="text-[11px] font-normal text-blue-700">
                    (✏️ Nhấn trực tiếp vào ô để chỉnh sửa)
                  </span>
                )}
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                  Họ và tên {isFlow2 && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={buyerName}
                  readOnly={isFlow1}
                  disabled={isFlow1}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Nhập họ tên chủ xe..."
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold transition ${
                    isFlow1
                      ? 'border-zinc-200 bg-zinc-100 text-zinc-700 cursor-not-allowed select-none'
                      : 'border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                  Số điện thoại {isFlow2 && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={buyerPhone}
                  readOnly={isFlow1}
                  disabled={isFlow1}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="Nhập số điện thoại..."
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold font-mono transition ${
                    isFlow1
                      ? 'border-zinc-200 bg-zinc-100 text-zinc-700 cursor-not-allowed select-none'
                      : 'border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                  Email {isFlow2 && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="email"
                  value={buyerEmail}
                  readOnly={isFlow1}
                  disabled={isFlow1}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="Nhập email nhận GCN..."
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold transition ${
                    isFlow1
                      ? 'border-zinc-200 bg-zinc-100 text-zinc-700 cursor-not-allowed select-none'
                      : 'border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs'
                  }`}
                />
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 italic">
              {isFlow1
                ? '*Theo quy tắc Flow 1: Thông tin chủ xe và phương tiện đã được xác định được cố định ở chế độ chỉ đọc, không thể chỉnh sửa.'
                : '*Theo quy tắc Flow 2: Bạn có thể nhấn trực tiếp vào các ô để chỉnh sửa thông tin người đứng tên bảo hiểm.'}
            </p>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* 2. CHỌN / THÊM PHƯƠNG TIỆN BẢO HIỂM (BHX02) */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="space-y-3 pt-3 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wide text-zinc-900 font-mono">
                {isFlow1
                  ? '2. PHƯƠNG TIỆN CẦN MUA BẢO HIỂM (ĐƯỢC CỐ ĐỊNH TỪ XE ĐÃ CHỌN)'
                  : '2. THÊM PHƯƠNG TIỆN MỚI ĐĂNG KÝ BẢO HIỂM'}
              </label>
            </div>

            {/* FLOW 1: Khóa cứng đúng xe đã chọn, không hiển thị danh sách xe khác, không thêm xe */}
            {isFlow1 && (
              <div>
                {activeVehicle ? (
                  <div className="p-4 rounded-2xl border-2 border-blue-600 bg-blue-50/50 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <span className="text-3xl">🛵</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-zinc-950 uppercase">
                            {activeVehicle.tenXe}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            🔒 Xe đã chọn
                          </span>
                        </div>
                        <div className="text-zinc-600 font-mono text-xs mt-0.5">
                          Biển số: <strong className="text-red-700 font-bold">{activeVehicle.bienSo || 'Chưa có biển số'}</strong>
                          {activeVehicle.soKhung && (
                            <span> · Số khung: <strong className="text-zinc-800">{activeVehicle.soKhung}</strong></span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1">
                          *Mặc định phương tiện là xe bạn đã chọn tại thao tác &quot;Mua bảo hiểm xe này&quot;. Không yêu cầu chọn lại.
                        </div>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      ✓
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 text-xs">
                    Không tìm thấy thông tin xe đã chọn. Vui lòng quay lại danh sách bảo hiểm.
                  </div>
                )}
              </div>
            )}

            {/* FLOW 2: Chỉ cho phép thêm xe mới, không hiển thị xe cũ để chọn lại (BHX02) */}
            {isFlow2 && (
              <div className="space-y-4">
                {newVehicle ? (
                  // Đã thêm xe mới thành công -> Hiển thị thẻ xe đã thêm
                  <div className="p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/50 shadow-xs flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-3.5">
                      <span className="text-3xl">✨</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-zinc-950 uppercase">
                            {newVehicle.tenXe}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Xe mới đã xác nhận
                          </span>
                        </div>
                        <div className="text-zinc-600 font-mono text-xs mt-0.5">
                          Hãng: <strong className="text-zinc-900">{newVehicle.hangXe}</strong> · Biển số: <strong className="text-red-700 font-bold">{newVehicle.bienSo}</strong>
                          {newVehicle.soKhung && <span> · VIN: <strong className="text-zinc-800">{newVehicle.soKhung}</strong></span>}
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                          Phương tiện này sẽ được cấp hợp đồng bảo hiểm và tự động liên kết vào tài khoản của bạn.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewVehicle(null)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 transition cursor-pointer shrink-0"
                    >
                      ✏️ Nhập lại xe
                    </button>
                  </div>
                ) : (
                  // Form nhập thông tin xe mới
                  <form onSubmit={handleConfirmNewVehicle} className="p-5 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/20 space-y-3.5">
                    <div className="text-xs font-bold text-zinc-800 flex items-center justify-between">
                      <span className="uppercase text-blue-900">Nhập thông tin phương tiện mới cần đăng ký bảo hiểm:</span>
                      <span className="text-[11px] font-normal text-zinc-500">Flow 2: Đăng ký xe mới</span>
                    </div>

                    {newVehError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{newVehError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                          Tên dòng xe máy <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newVehForm.tenXe}
                          onChange={(e) => setNewVehForm({ ...newVehForm, tenXe: e.target.value })}
                          placeholder="Ví dụ: Honda Air Blade 160, Yamaha Grande..."
                          className="w-full p-2.5 rounded-xl border border-zinc-300 bg-white text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                          Hãng sản xuất <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={newVehForm.hangXe}
                          onChange={(e) => setNewVehForm({ ...newVehForm, hangXe: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-zinc-300 bg-white text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Honda">Honda</option>
                          <option value="Yamaha">Yamaha</option>
                          <option value="Suzuki">Suzuki</option>
                          <option value="SYM">SYM</option>
                          <option value="Piaggio & Vespa">Piaggio & Vespa</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                          Biển số đăng ký (hoặc để trống nếu chưa có biển)
                        </label>
                        <input
                          type="text"
                          value={newVehForm.bienSo}
                          onChange={(e) => setNewVehForm({ ...newVehForm, bienSo: e.target.value.toUpperCase() })}
                          placeholder="VD: 59-P1 999.99..."
                          className="w-full p-2.5 rounded-xl border border-zinc-300 bg-white text-xs font-bold font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                          Số khung (VIN)
                        </label>
                        <input
                          type="text"
                          value={newVehForm.soKhung}
                          onChange={(e) => setNewVehForm({ ...newVehForm, soKhung: e.target.value.toUpperCase() })}
                          placeholder="VD: RLHKD160CB..."
                          className="w-full p-2.5 rounded-xl border border-zinc-300 bg-white text-xs font-bold font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-zinc-500 italic">
                        *Lưu ý: Không thể thêm trùng biển số hoặc số khung với các xe đã có trong hồ sơ của bạn.
                      </span>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>✓</span>
                        <span>Xác nhận thông tin xe mới này</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* 3. CHỌN GÓI BẢO HIỂM */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="space-y-3 pt-3 border-t border-zinc-100">
            <label className="text-xs font-black uppercase tracking-wide text-zinc-900 font-mono">
              3. CHỌN GÓI BẢO HIỂM
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Gói 1: Cơ bản */}
              <div
                onClick={() => setSelectedPkgId('TNDS_BAT_BUOC')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 ${
                  selectedPkgId === 'TNDS_BAT_BUOC'
                    ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs uppercase text-zinc-900 font-display">
                      GÓI CƠ BẢN
                    </span>
                    {selectedPkgId === 'TNDS_BAT_BUOC' && <span className="text-blue-600 font-bold text-xs">✓</span>}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-medium">(TNDS Bắt Buộc)</div>
                  <div className="text-base font-black text-red-700 font-display mt-2">
                    66.000 đ/năm
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    Quyền lợi cơ bản theo quy định nhà nước
                  </p>
                </div>
              </div>

              {/* Gói 2: Nâng cao */}
              <div
                onClick={() => setSelectedPkgId('TNDS_NGUOI_NGOI')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 ${
                  selectedPkgId === 'TNDS_NGUOI_NGOI'
                    ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs uppercase text-zinc-900 font-display">
                      GÓI NÂNG CAO
                    </span>
                    {selectedPkgId === 'TNDS_NGUOI_NGOI' && <span className="text-blue-600 font-bold text-xs">✓</span>}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-medium">(TNDS + Người ngồi)</div>
                  <div className="text-base font-black text-red-700 font-display mt-2">
                    150.000 đ/năm
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    TNDS + Người ngồi trên xe
                  </p>
                </div>
              </div>

              {/* Gói 3: Toàn diện */}
              <div
                onClick={() => setSelectedPkgId('VAT_CHAT_TOAN_DIEN')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 ${
                  selectedPkgId === 'VAT_CHAT_TOAN_DIEN'
                    ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs uppercase text-zinc-900 font-display">
                      GÓI TOÀN DIỆN
                    </span>
                    {selectedPkgId === 'VAT_CHAT_TOAN_DIEN' && <span className="text-blue-600 font-bold text-xs">✓</span>}
                  </div>
                  <div className="text-base font-black text-red-700 font-display mt-2">
                    1.250.000 đ/năm
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 text-[9px] font-bold">Đền bù va quẹt</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 text-[9px] font-bold">Thủy kích</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 text-[9px] font-bold">Cứu hộ 24/7</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 text-[9px] font-bold">Mất cắp</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* 4. THỜI GIAN HIỆU LỰC & ƯU ĐÃI (BHX03) */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="space-y-3 pt-3 border-t border-zinc-100">
            <label className="text-xs font-black uppercase tracking-wide text-zinc-900 font-mono">
              4. THỜI GIAN HIỆU LỰC & ƯU ĐÃI
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1 flex items-center justify-between">
                  <span>Ngày bắt đầu hiệu lực</span>
                  <span className="text-[10px] text-zinc-400 font-normal">🔒 Cố định</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  readOnly
                  disabled
                  className="w-full p-2.5 rounded-xl border border-zinc-200 bg-zinc-100 text-xs font-bold text-zinc-600 font-mono cursor-not-allowed select-none shadow-2xs"
                />
                <div className="text-[10px] text-zinc-400 mt-1">
                  *Cố định theo ngày đăng ký thực tế ({startDate.split('-').reverse().join('/')})
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Thời hạn</label>
                <select
                  value={durationYears}
                  onChange={(e) => setDurationYears(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value={1}>Chọn 1 năm</option>
                  <option value={2}>Chọn 2 năm (Tiết kiệm)</option>
                  <option value={3}>Chọn 3 năm (Ưu đãi tối đa)</option>
                </select>
                <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                  (Từ {startDate.split('-').reverse().join('/')} đến {endDate.split('-').reverse().join('/')})
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Mã giảm giá (nếu có)</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="[Nhập mã...]"
                    className="flex-1 p-2.5 rounded-xl border border-zinc-300 text-xs font-bold uppercase font-mono text-black bg-white placeholder:text-zinc-400 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-black cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG (STICKY SIDEBAR) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950 font-mono border-b border-zinc-100 pb-3">
              TÓM TẮT ĐƠN HÀNG
            </h3>

            <div className="space-y-2.5 text-xs text-zinc-700">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Luồng đăng ký:</span>
                <span className="font-bold text-zinc-900 font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                  {isFlow1 ? 'Flow 1 (Xe đã chọn)' : 'Flow 2 (Xe mới)'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Chủ xe:</span>
                <span className="font-bold text-zinc-900">{buyerName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Phương tiện:</span>
                <span className="font-bold text-zinc-900 truncate max-w-[160px]" title={activeVehicle?.tenXe || 'Chưa có'}>
                  {activeVehicle?.tenXe || (isFlow2 ? 'Chờ thêm xe mới' : 'Chưa chọn')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Biển số:</span>
                <span className="font-mono font-bold text-red-700">
                  {activeVehicle?.bienSo || 'Chưa gắn biển'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Gói bảo hiểm:</span>
                <span className="font-bold text-zinc-900">{selectedPackage.tenGoi}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Thời hạn:</span>
                <span className="font-bold text-zinc-900">{durationYears} năm</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Hiệu lực:</span>
                <span className="font-mono text-[11px] text-zinc-800">
                  {startDate.split('-').reverse().join('/')} ➔ {endDate.split('-').reverse().join('/')}
                </span>
              </div>

              <div className="pt-2 border-t border-zinc-100 space-y-1.5">
                <div className="flex justify-between items-center text-zinc-500">
                  <span>Phí gốc ({durationYears} năm):</span>
                  <span className="font-mono font-semibold">{formatVND(basePrice)}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-500">
                  <span>Thuế VAT (10%):</span>
                  <span className="font-mono font-semibold">+{formatVND(vatAmount)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-emerald-600 font-semibold">
                    <span>Mã giảm giá ({appliedCoupon}):</span>
                    <span className="font-mono font-bold">-{formatVND(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                  <span className="font-extrabold text-sm text-zinc-900 uppercase">Tổng cộng:</span>
                  <span className="text-lg font-black text-red-700 font-display">
                    {formatVND(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenDemoContract}
              disabled={isFlow2 && !newVehicle}
              className="w-full py-3.5 rounded-2xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-extrabold uppercase tracking-wider text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 font-display"
            >
              <span>XEM BẢN THẢO & THANH TOÁN →</span>
            </button>

            {isFlow2 && !newVehicle && (
              <p className="text-[11px] text-amber-700 text-center font-medium">
                ⚠️ Vui lòng nhập và bấm &quot;Xác nhận thông tin xe mới&quot; ở Bước 2 để tiếp tục.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* POPUP 1: BẢN THẢO XEM TRƯỚC HỢP ĐỒNG */}
      {showDemoContract && activeVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 my-8 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 font-mono">
                  DEMO BẢN THẢO XEM TRƯỚC
                </span>
                <h3 className="font-black text-lg text-zinc-950 uppercase tracking-tight mt-1 font-display">
                  HỢP ĐỒNG BẢO HIỂM PHƯƠNG TIỆN ĐIỆN TỬ
                </h3>
              </div>
              <button
                onClick={() => setShowDemoContract(false)}
                className="text-zinc-400 hover:text-zinc-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Nội dung hợp đồng demo */}
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-black space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto">
              <div className="text-center font-bold text-black border-b border-zinc-200 pb-2">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />
                Độc lập - Tự do - Hạnh phúc
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-white text-black p-3.5 rounded-xl border border-zinc-300">
                <div className="text-black font-semibold">Số GCN dự kiến: <strong className="text-black font-extrabold">GCN-BV-2026-DEMO</strong></div>
                <div className="text-black font-semibold">Đơn vị bảo hiểm: <strong className="text-black font-extrabold">Bảo hiểm Bảo Việt</strong></div>
                <div className="text-black font-semibold">Chủ phương tiện: <strong className="text-black font-extrabold">{buyerName}</strong></div>
                <div className="text-black font-semibold">Số điện thoại: <strong className="text-black font-extrabold">{buyerPhone}</strong></div>
                <div className="text-black font-semibold">Biển số xe: <strong className="text-black font-extrabold">{activeVehicle.bienSo || 'Chưa gắn biển'}</strong></div>
                <div className="text-black font-semibold">Tên phương tiện: <strong className="text-black font-extrabold">{activeVehicle.tenXe}</strong></div>
                <div className="text-black font-semibold">Số khung: <strong className="text-black font-extrabold">{activeVehicle.soKhung || 'Đang cập nhật'}</strong></div>
                <div className="text-black font-semibold">Thời hạn: <strong className="text-black font-extrabold">{durationYears} năm (đến {endDate})</strong></div>
              </div>

              <div className="space-y-1.5 text-black">
                <div className="font-extrabold text-black uppercase">Quyền lợi và phạm vi bảo hiểm:</div>
                <div className="text-black font-medium">• {selectedPackage.tenGoi} - Mức trách nhiệm: <strong className="text-black font-bold">{selectedPackage.mucTrachNhiem}</strong></div>
                <div className="text-black font-medium">• Chi tiết: {selectedPackage.quyenLoi.join(', ')}</div>
                <div className="text-black font-medium">• Phương thức thanh toán: <strong className="text-black font-bold">Chuyển khoản ngân hàng (VietQR)</strong></div>
              </div>

              <div className="text-zinc-700 text-[11px] italic font-medium">
                Lưu ý: Hợp đồng chính thức sẽ được ký số điện tử và cấp mã QR Giấy chứng nhận ngay khi quý khách chuyển khoản thanh toán thành công.
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowDemoContract(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
              >
                Chỉnh sửa lại
              </button>
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-700 hover:bg-blue-800 text-white transition shadow-md cursor-pointer flex items-center gap-1.5 font-display"
              >
                <span>ĐỒNG Ý VÀ CHUYỂN KHOẢN THANH TOÁN →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: THANH TOÁN CHUYỂN KHOẢN VIETQR */}
      {showPaymentQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 my-8 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
              <div>
                <h3 className="font-black text-base text-zinc-950 uppercase tracking-tight font-display">
                  THANH TOÁN BẢO HIỂM VIETQR
                </h3>
                <span className="text-[11px] text-zinc-500">Chuyển khoản ngân hàng 24/7 tự động xác nhận</span>
              </div>
              <button
                onClick={() => setShowPaymentQr(false)}
                className="text-zinc-400 hover:text-zinc-600 font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col items-center space-y-3">
              <div className="p-3 bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center">
                <img
                  src={`https://api.vietqr.io/image/970422-0901234567-compact2.jpg?amount=${totalAmount}&addInfo=BH%20${customer?.id || 'KH'}&accountName=CONG%20TY%20TNHH%20MOTOCARE`}
                  alt="VietQR Chuyển khoản bảo hiểm"
                  className="w-48 h-48 object-contain rounded-xl"
                />
                <span className="text-[10px] text-zinc-400 font-mono mt-1">Mã QR tạo động theo giao dịch</span>
              </div>

              <div className="w-full text-xs space-y-1.5 bg-white p-3 rounded-xl border border-zinc-200">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Số tiền:</span>
                  <span className="font-mono font-black text-red-700 text-sm">{formatVND(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nội dung:</span>
                  <span className="font-mono font-bold text-zinc-900">BH {customer?.id || 'KH'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Ngân hàng:</span>
                  <span className="font-bold text-zinc-900">MB Bank (Quân Đội)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">STK:</span>
                  <span className="font-mono font-bold text-zinc-900">0901234567</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentQr(false)}
                className="w-1/3 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleCompletePayment}
                disabled={submittingPayment}
                className="w-2/3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {submittingPayment ? (
                  <span>Đang khởi tạo hợp đồng...</span>
                ) : (
                  <span>✓ ĐÃ CHUYỂN KHOẢN XONG</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
