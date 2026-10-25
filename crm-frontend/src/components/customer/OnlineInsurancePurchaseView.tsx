import React, { useState, useMemo } from 'react';
import type { Vehicle, Customer, InsuranceContract } from '../../data/mockData';
import {
  INSURANCE_PACKAGES,
  formatVND,
} from '../../data/mockData';
import { insuranceApi } from '../../services/api';

interface OnlineInsurancePurchaseViewProps {
  customer: Customer | null;
  vehicles: Vehicle[];
  initialVehicle?: Vehicle | null;
  onAddNewVehicle: () => void;
  onCancel: () => void;
  onSuccess: (newContract: InsuranceContract) => void;
}

export default function OnlineInsurancePurchaseView({
  customer,
  vehicles,
  initialVehicle,
  onAddNewVehicle,
  onCancel,
  onSuccess,
}: OnlineInsurancePurchaseViewProps) {
  // 1. Thông tin người mua
  const [buyerName, setBuyerName] = useState(customer?.hoTen || 'Nguyễn Văn A');
  const [buyerPhone, setBuyerPhone] = useState(customer?.soDienThoai || '0987 654 321');
  const [buyerEmail, setBuyerEmail] = useState(customer?.email || 'nguyenvana@gmail.com');
  const [isEditingBuyer, setIsEditingBuyer] = useState(false);

  // 2. Phương tiện chọn mua
  const [selectedVehId, setSelectedVehId] = useState<string>(
    initialVehicle ? initialVehicle.id : vehicles.length > 0 ? vehicles[0].id : ''
  );

  // 3. Gói bảo hiểm
  const [selectedPkgId, setSelectedPkgId] = useState<'TNDS_BAT_BUOC' | 'TNDS_NGUOI_NGOI' | 'VAT_CHAT_TOAN_DIEN'>(
    'VAT_CHAT_TOAN_DIEN'
  );

  // 4. Thời gian hiệu lực & Ưu đãi
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [durationYears, setDurationYears] = useState<number>(1);
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Modal Hợp đồng Demo & Thanh toán QR
  const [showDemoContract, setShowDemoContract] = useState<boolean>(false);
  const [showPaymentQr, setShowPaymentQr] = useState<boolean>(false);
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  // Xe đang được chọn
  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehId) || vehicles[0];
  }, [vehicles, selectedVehId]);

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

  // Xác nhận mở popup Hợp đồng demo (Bắt buộc phải có xe mới được mua bảo hiểm)
  const handleOpenDemoContract = () => {
    // BH09: Chặn nếu tài khoản bị khóa
    if (customer?.trangThai === 'BiKhoa') {
      alert('⚠️ TÀI KHOẢN BỊ KHÓA: Tài khoản của quý khách đang bị tạm khóa bởi Quản trị viên. Quý khách không thể thực hiện đăng ký mua bảo hiểm mới!');
      return;
    }

    if (!selectedVehicle || vehicles.length === 0) {
      alert('⚠️ YÊU CẦU: Bạn phải có ít nhất 1 phương tiện liên kết với tài khoản để mua bảo hiểm! Vui lòng đăng ký phương tiện trước.');
      onAddNewVehicle();
      return;
    }

    // BH08: Chặn ngày bắt đầu trong quá khứ
    const todayStr = new Date().toISOString().split('T')[0];
    if (startDate < todayStr) {
      alert(`⚠️ Ngày bắt đầu hiệu lực (${startDate.split('-').reverse().join('/')}) không được nhỏ hơn ngày hôm nay (${todayStr.split('-').reverse().join('/')})!`);
      return;
    }

    // BH04: Kiểm tra trùng gói bảo hiểm còn hiệu lực
    const allContracts = insuranceApi.getAll();
    const normPlate = (selectedVehicle.bienSo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const duplicate = allContracts.find(c => {
      if (c.trangThai !== 'HieuLuc') return false;
      if (c.packageType !== selectedPkgId) return false;
      const cPlateNorm = (c.bienSo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchVeh = (selectedVehicle.id && c.vehicleId === selectedVehicle.id) ||
        (normPlate && cPlateNorm && normPlate === cPlateNorm);
      if (!matchVeh) return false;
      return c.ngayKetThuc >= startDate;
    });

    if (duplicate) {
      alert(`⚠️ PHƯƠNG TIỆN ĐÃ CÓ BẢO HIỂM CÙNG LOẠI:\n\nXe "${selectedVehicle.tenXe}" (${selectedVehicle.bienSo || 'Chưa có biển'}) hiện đã có hợp đồng "${duplicate.tenGoi}" (Số GCN: ${duplicate.soGCN}) đang còn hiệu lực đến ngày ${duplicate.ngayKetThuc.split('-').reverse().join('/')}.\n\nHệ thống không cho phép mua trùng gói bảo hiểm còn hạn. Vui lòng chọn gói khác hoặc sử dụng chức năng "Gia hạn hợp đồng" tại mục "Bảo hiểm của tôi"!`);
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
    if (!customer || !selectedVehicle) return;
    setSubmittingPayment(true);

    try {
      const newContract = insuranceApi.create({
        customerId: customer.id,
        hoTenKH: buyerName,
        soDienThoai: buyerPhone,
        email: buyerEmail,
        diaChi: customer.diaChi || 'Toàn quốc',
        vehicleId: selectedVehicle.id,
        tenXe: selectedVehicle.tenXe,
        bienSo: selectedVehicle.bienSo || 'Chưa có biển số',
        soKhung: selectedVehicle.soKhung || 'Chưa cập nhật',
        soMay: 'Đang cập nhật',
        packageType: selectedPkgId,
        tenGoi: selectedPackage.tenGoi,
        thoiHanNam: durationYears,
        phiBaoHiem: basePrice,
        thueVAT: vatAmount,
        tongTien: totalAmount,
        maGiamGia: appliedCoupon || undefined,
        phuongThucThanhToan: 'ChuyenKhoan',
        nhaBaoHiem: 'Tổng Công ty Bảo hiểm Bảo Việt',
        ngayCap: new Date().toISOString().split('T')[0],
        ngayBatDau: startDate,
        ngayKetThuc: endDate,
        trangThai: 'HieuLuc',
        ghiChu: `Hợp đồng mua online. Đã thanh toán chuyển khoản qua VietQR.`,
      });

      setSubmittingPayment(false);
      setShowPaymentQr(false);
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
          <span className="text-zinc-950 font-bold font-mono">Đăng ký mua online</span>
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
        <h1
          className="text-2xl sm:text-3xl font-black text-zinc-950 uppercase tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          MUA BẢO HIỂM PHƯƠNG TIỆN ONLINE
        </h1>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 self-start sm:self-auto font-mono">
          BẢO HIỂM ĐIỆN TỬ CHÍNH HÃNG
        </span>
      </div>

      {/* BH09: Banner cảnh báo nếu tài khoản khách hàng bị khóa */}
      {customer?.trangThai === 'BiKhoa' && (
        <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-700 flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <div className="font-bold text-sm uppercase">Tài khoản hiện đang bị khóa</div>
            <div className="text-xs text-red-600 mt-0.5">
              Tài khoản của bạn đã bị khóa bởi Quản trị viên. Bạn không thể thực hiện giao dịch đăng ký hoặc thanh toán bảo hiểm trực tuyến. Vui lòng liên hệ bộ phận hỗ trợ chăm sóc khách hàng.
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Cột trái Form (8 cols) & Cột phải Tóm tắt đơn hàng (4 cols) - Chuẩn Ảnh 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI: FORM ĐIỀN THÔNG TIN (CHUẨN 100% ẢNH 1) */}
        <div className="lg:col-span-8 space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm">
          {/* 1. THÔNG TIN NGƯỜI MUA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wide text-zinc-900 font-mono">
                1. THÔNG TIN NGƯỜI MUA <span className="text-zinc-400 font-normal text-[11px]">(Được tự động điền từ tài khoản, có thể chỉnh sửa)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsEditingBuyer(!isEditingBuyer)}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>{isEditingBuyer ? '✓ Xong' : '✏️ Chỉnh sửa'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Họ và tên</label>
                <div className="relative">
                  <input
                    type="text"
                    value={buyerName}
                    readOnly={!isEditingBuyer}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className={`w-full p-2.5 pr-8 rounded-xl border text-xs font-bold ${
                      isEditingBuyer
                        ? 'border-blue-500 bg-white text-zinc-900 focus:outline-none'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-800'
                    }`}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">✏️</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Số điện thoại</label>
                <div className="relative">
                  <input
                    type="text"
                    value={buyerPhone}
                    readOnly={!isEditingBuyer}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className={`w-full p-2.5 pr-8 rounded-xl border text-xs font-bold font-mono ${
                      isEditingBuyer
                        ? 'border-blue-500 bg-white text-zinc-900 focus:outline-none'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-800'
                    }`}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">✏️</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={buyerEmail}
                    readOnly={!isEditingBuyer}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className={`w-full p-2.5 pr-8 rounded-xl border text-xs font-bold ${
                      isEditingBuyer
                        ? 'border-blue-500 bg-white text-zinc-900 focus:outline-none'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-800'
                    }`}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">✏️</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 italic">
              *Thông tin được tự động điền từ tài khoản của bạn. Bạn có thể thay đổi nếu mua hộ cho người khác.
            </p>
          </div>

          {/* 2. CHỌN PHƯƠNG TIỆN CẦN MUA BẢO HIỂM */}
          <div className="space-y-3 pt-3 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wide text-zinc-900 font-mono">
                2. CHỌN PHƯƠNG TIỆN CẦN MUA BẢO HIỂM <span className="text-zinc-400 font-normal text-[11px]">(Chỉ hiển thị xe đã liên kết với tài khoản)</span>
              </label>
            </div>

            {vehicles.length === 0 ? (
              <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-xs text-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-black text-red-800 uppercase flex items-center gap-1.5 font-mono">
                    <span>⚠️</span> BẮT BUỘC PHẢI CÓ XE ĐỂ MUA BẢO HIỂM
                  </div>
                  <p className="text-[11px] text-red-700 mt-0.5 font-medium">
                    Tài khoản của bạn hiện chưa có phương tiện nào. Vui lòng đăng ký phương tiện trước khi mua bảo hiểm.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onAddNewVehicle}
                  className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold cursor-pointer shrink-0 shadow-sm transition"
                >
                  + Đăng ký xe mới ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicles.map((v) => {
                  const isChecked = selectedVehId === v.id;
                  const isCar = v.tenXe.toLowerCase().includes('ô tô') || v.tenXe.toLowerCase().includes('mazda') || v.tenXe.toLowerCase().includes('cx-5');

                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVehId(v.id)}
                      className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{isCar ? '🚗' : '🛵'}</span>
                        <div className="text-xs">
                          <div className="font-black text-zinc-950">
                            {isCar ? 'Ô tô:' : 'Xe máy:'} {v.tenXe}
                          </div>
                          <div className="text-zinc-500 font-mono text-[11px]">
                            Biển số: <strong className="text-zinc-800">{v.bienSo || 'Chưa gắn biển'}</strong>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white text-xs font-black'
                            : 'border-zinc-300 bg-white'
                        }`}
                      >
                        {isChecked && '✓'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={onAddNewVehicle}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span>
              <span>Thêm phương tiện mới</span>
            </button>
          </div>

          {/* 3. CHỌN GÓI BẢO HIỂM */}
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
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 text-[9px] font-bold">Mất cắp bộ phận</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. THỜI GIAN HIỆU LỰC & ƯU ĐÃI */}
          <div className="space-y-3 pt-3 border-t border-zinc-100">
            <label className="text-xs font-black uppercase tracking-wide text-zinc-900 font-mono">
              4. THỜI GIAN HIỆU LỰC & ƯU ĐÃI
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Ngày bắt đầu hiệu lực</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-blue-600"
                />
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
                  (từ {startDate.split('-').reverse().join('/')} đến {endDate.split('-').reverse().join('/')})
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

        {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG (STICKY SIDEBAR CHUẨN 100% ẢNH 1) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-sm space-y-4">
            <h3
              className="text-sm font-black uppercase tracking-wider text-zinc-950 font-mono border-b border-zinc-100 pb-3"
            >
              TÓM TẮT ĐƠN HÀNG
            </h3>

            <div className="space-y-2.5 text-xs text-zinc-700">
              <div className="flex justify-between">
                <span className="text-zinc-500">Khách hàng:</span>
                <strong className="text-zinc-900 uppercase">{buyerName}</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">Phương tiện:</span>
                <span className="font-bold text-zinc-900 text-right">
                  {selectedVehicle ? `${selectedVehicle.tenXe} (${selectedVehicle.bienSo || 'Chưa gắn biển'})` : 'Chưa chọn'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">Gói bảo hiểm:</span>
                <strong className="text-blue-700">{selectedPackage.tenGoi}</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">Phí bảo hiểm:</span>
                <span className="font-mono">{formatVND(basePrice)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">Thuế VAT (10%):</span>
                <span className="font-mono">{formatVND(vatAmount)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">Giảm giá:</span>
                <span className="font-mono text-emerald-600">
                  {discountAmount > 0 ? `-${formatVND(discountAmount)}` : '0 đ'}
                </span>
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-between items-baseline">
                <span className="font-bold text-zinc-900 uppercase font-mono">TỔNG TIỀN THANH TOÁN:</span>
                <strong className="text-xl font-black text-red-700 font-display">
                  {formatVND(totalAmount)}
                </strong>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleOpenDemoContract}
                disabled={vehicles.length === 0 || !selectedVehicle || customer?.trangThai === 'BiKhoa'}
                className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                  customer?.trangThai === 'BiKhoa'
                    ? 'bg-red-100 text-red-500 border border-red-300 cursor-not-allowed opacity-80'
                    : vehicles.length > 0 && selectedVehicle
                    ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-md hover:shadow-lg cursor-pointer'
                    : 'bg-zinc-300 text-zinc-500 cursor-not-allowed opacity-80'
                }`}
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
              >
                <span>
                  {customer?.trangThai === 'BiKhoa'
                    ? '🔒 TÀI KHOẢN BỊ KHÓA - KHÔNG THỂ MUA BẢO HIỂM'
                    : vehicles.length > 0 && selectedVehicle
                    ? 'XÁC NHẬN & THANH TOÁN ONLINE'
                    : '⚠️ BẮT BUỘC PHẢI CÓ XE ĐỂ MUA BẢO HIỂM'}
                </span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
              >
                HỦY
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          POPUP 1: HỢP ĐỒNG BẢO HIỂM DEMO (XEM TRƯỚC HỢP ĐỒNG TRƯỚC KHI THANH TOÁN)
          ========================================================================= */}
      {showDemoContract && (
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

            {/* Nội dung hợp đồng demo - BH03: Đổi màu chữ sang màu đen rõ ràng */}
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
                <div className="text-black font-semibold">Biển số xe: <strong className="text-black font-extrabold">{selectedVehicle?.bienSo || 'Chưa gắn biển'}</strong></div>
                <div className="text-black font-semibold">Tên phương tiện: <strong className="text-black font-extrabold">{selectedVehicle?.tenXe || 'Chưa chọn'}</strong></div>
                <div className="text-black font-semibold">Số khung: <strong className="text-black font-extrabold">{selectedVehicle?.soKhung || 'Đang cập nhật'}</strong></div>
                <div className="text-black font-semibold">Thời hạn: <strong className="text-black font-extrabold">{durationYears} năm (đến {endDate})</strong></div>
              </div>

              <div className="space-y-1.5 text-black">
                <div className="font-extrabold text-black uppercase">Quyền lợi và phạm vi bảo hiểm:</div>
                <div className="text-black font-medium">• {selectedPackage.tenGoi} - Mức trách nhiệm: <strong className="text-black font-bold">{selectedPackage.mucTrachNhiem}</strong></div>
                <div className="text-black font-medium">• Chi tiết: {selectedPackage.quyenLoi.join(', ')}</div>
                <div className="text-black font-medium">• Phương thức thanh toán bắt buộc: <strong className="text-black font-bold">Chuyển khoản ngân hàng (VietQR)</strong></div>
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

      {/* =========================================================================
          POPUP 2: THANH TOÁN CHUYỂN KHOẢN (BẮT BUỘC CHUYỂN KHOẢN THEO YÊU CẦU)
          ========================================================================= */}
      {showPaymentQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 my-8 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
              <div>
                <h3 className="font-black text-base text-zinc-950 uppercase tracking-tight font-display">
                  THANH TOÁN BẢO HIỂM ĐIỆN TỬ
                </h3>
                <p className="text-xs text-zinc-500 font-mono">Phương thức: Chuyển khoản VietQR</p>
              </div>
              <button
                onClick={() => setShowPaymentQr(false)}
                className="text-zinc-400 hover:text-zinc-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-3">
              <div className="w-44 h-44 mx-auto bg-white p-2 rounded-2xl border border-zinc-300 shadow-xs flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MOTOSHOP-INSURANCE-${selectedVehId}-${totalAmount}`}
                  alt="Mã QR Chuyển khoản"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-xs text-zinc-700 font-mono space-y-0.5">
                <div>Ngân hàng: <strong>Vietcombank (VCB)</strong></div>
                <div>Số tài khoản: <strong>9988 7766 5544</strong></div>
                <div>Chủ tài khoản: <strong>CONG TY MOTOSHOP VIET NAM</strong></div>
                <div>Số tiền: <strong className="text-red-700 text-sm">{formatVND(totalAmount)}</strong></div>
                <div>Nội dung: <strong>BH {selectedVehicle?.bienSo || selectedVehId} {buyerPhone}</strong></div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCompletePayment}
                disabled={submittingPayment}
                className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-emerald-700 hover:bg-emerald-800 disabled:bg-zinc-400 text-white shadow-md cursor-pointer transition flex items-center justify-center gap-2 font-display"
              >
                <span>{submittingPayment ? 'ĐANG KÍCH HOẠT HỢP ĐỒNG...' : 'XÁC NHẬN ĐÃ CHUYỂN KHOẢN THÀNH CÔNG'}</span>
                <span>✓</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPaymentQr(false)}
                className="w-full py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
