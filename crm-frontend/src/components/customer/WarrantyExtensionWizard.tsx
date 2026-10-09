import React, { useState, useRef } from 'react';
import type { Vehicle, Customer, ExtendedWarrantyPackage } from '../../data/mockData';
import {
  EXTENDED_WARRANTY_PACKAGES,
  formatVND,
} from '../../data/mockData';
import { warrantyApi } from '../../services/api';

interface WarrantyExtensionWizardProps {
  vehicle: Vehicle;
  customer: Customer | null;
  onClose: () => void;
  onSuccess: (updatedVehicle: Vehicle) => void;
}

export default function WarrantyExtensionWizard({
  vehicle,
  customer,
  onClose,
  onSuccess,
}: WarrantyExtensionWizardProps) {
  // Stepper state: 1, 2, 3, 4
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ── STEP 1: XÁC NHẬN THÔNG TIN & MINH CHỨNG ──
  const [currentOdo, setCurrentOdo] = useState<number>(12500);
  const [requestDate, setRequestDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [evidenceImages, setEvidenceImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=60', // ODO
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500&auto=format&fit=crop&q=60', // Xe nghiêng
    'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=500&auto=format&fit=crop&q=60', // Xe trực diện
  ]);
  const [isCommitChecked, setIsCommitChecked] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── STEP 2: THẨM ĐỊNH LỊCH SỬ DỊCH VỤ ──
  // Cho phép toggle kịch bản để kiểm thử cả TH1 (ĐẠT) và TH2 (KHÔNG ĐẠT) theo ảnh 2 & 3
  const [simulateFail, setSimulateFail] = useState<boolean>(false);
  const assessmentResult = warrantyApi.verifyWarrantyExtension(vehicle.id, currentOdo, simulateFail);

  // ── STEP 3: CHỌN GÓI BẢO HÀNH ──
  const [selectedPkgId, setSelectedPkgId] = useState<string>('GOI_TIEU_CHUAN_1Y');

  // ── STEP 4: THANH TOÁN & HÓA ĐƠN ──
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentMethod, setPaymentMethod] = useState<'ChuyenKhoan' | 'VNPAY'>('ChuyenKhoan');

  // Lấy gói đang chọn
  const selectedPackage = EXTENDED_WARRANTY_PACKAGES.find(p => p.id === selectedPkgId) || EXTENDED_WARRANTY_PACKAGES[0];

  // Xử lý upload ảnh minh chứng
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('Dung lượng file vượt quá 50MB!');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        if (evidenceImages.length >= 4) {
          alert('Tối đa 4 file minh chứng ODO!');
          return;
        }
        setEvidenceImages([...evidenceImages, reader.result]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setEvidenceImages(evidenceImages.filter((_, i) => i !== index));
  };

  // Hoàn tất thanh toán và kích hoạt bảo hành
  const handleConfirmPayment = async () => {
    if (!customer) return;
    setPaymentStatus('processing');
    try {
      const res = await warrantyApi.buyExtendedWarranty(
        customer.id,
        vehicle.id,
        selectedPkgId,
        currentOdo,
        evidenceImages
      );
      if (res.success) {
        setPaymentStatus('success');
      } else {
        setPaymentStatus('failed');
      }
    } catch {
      setPaymentStatus('failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-200">
        <nav className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
          <button
            type="button"
            onClick={onClose}
            className="hover:text-red-700 transition flex items-center gap-1 cursor-pointer font-bold text-zinc-700"
          >
            <span>← Phương tiện của tôi</span>
          </button>
          <span>/</span>
          <span className="text-zinc-400">Gia hạn bảo hành</span>
          <span>/</span>
          <span className="text-zinc-950 font-bold font-mono">{vehicle.bienSo || vehicle.id}</span>
        </nav>

        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
        >
          ✕ Hủy bỏ
        </button>
      </div>

      {/* HEADER TITLE */}
      <div>
        <h1
          className="text-2xl sm:text-3xl font-black text-zinc-950 uppercase tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          GIA HẠN BẢO HÀNH MỞ RỘNG
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Quy trình thẩm định lịch sử dịch vụ và gia hạn bảo hành chính hãng chuẩn mực 4 bước
        </p>
      </div>

      {/* STEPPER PROGRESS BAR (CHUẨN CẢ 4 ẢNH) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-2xs">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition mb-1.5 ${
                currentStep > 1
                  ? 'bg-emerald-600 text-white'
                  : currentStep === 1
                  ? 'bg-red-700 text-white ring-4 ring-red-100'
                  : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <span className={currentStep === 1 ? 'text-red-700' : currentStep > 1 ? 'text-emerald-700' : 'text-zinc-400'}>
              {currentStep > 1 ? '✓ XÁC NHẬN THÔNG TIN' : 'XÁC NHẬN THÔNG TIN'}
            </span>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition mb-1.5 ${
                currentStep > 2
                  ? 'bg-emerald-600 text-white'
                  : currentStep === 2
                  ? 'bg-red-700 text-white ring-4 ring-red-100'
                  : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {currentStep > 2 ? '✓' : '2'}
            </div>
            <span className={currentStep === 2 ? 'text-red-700' : currentStep > 2 ? 'text-emerald-700' : 'text-zinc-400'}>
              KIỂM TRA LỊCH SỬ DỊCH VỤ
            </span>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition mb-1.5 ${
                currentStep > 3
                  ? 'bg-emerald-600 text-white'
                  : currentStep === 3
                  ? 'bg-red-700 text-white ring-4 ring-red-100'
                  : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {currentStep > 3 ? '✓' : '3'}
            </div>
            <span className={currentStep === 3 ? 'text-red-700' : currentStep > 3 ? 'text-emerald-700' : 'text-zinc-400'}>
              CHỌN GÓI BẢO HÀNH
            </span>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition mb-1.5 ${
                paymentStatus === 'success'
                  ? 'bg-emerald-600 text-white'
                  : currentStep === 4
                  ? 'bg-red-700 text-white ring-4 ring-red-100'
                  : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {paymentStatus === 'success' ? '✓' : '4'}
            </div>
            <span className={currentStep === 4 ? 'text-red-700' : paymentStatus === 'success' ? 'text-emerald-700' : 'text-zinc-400'}>
              THANH TOÁN
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BƯỚC 1: XÁC NHẬN THÔNG TIN (CHUẨN 100% THEO ẢNH 1 - media_1791475586412)
          ========================================================================= */}
      {currentStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <div className="text-xs font-extrabold uppercase tracking-wide text-zinc-400 font-mono">
            BƯỚC 1: XÁC NHẬN THÔNG TIN
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cột trái: Thông tin xe & Chủ sở hữu */}
            <div className="lg:col-span-6 space-y-5">
              <div className="text-xs font-black uppercase tracking-wider text-zinc-900 font-mono">
                THÔNG TIN PHƯƠNG TIỆN & CHỦ SỞ HỮU (TỰ ĐỘNG)
              </div>

              {/* Card thông tin xe */}
              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/90 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-28 h-24 shrink-0 rounded-xl overflow-hidden bg-white border border-zinc-200 flex items-center justify-center p-1">
                  <img
                    src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&auto=format&fit=crop&q=80"
                    alt={vehicle.tenXe}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                <div className="space-y-1 text-xs text-zinc-700 flex-1">
                  <div className="font-black text-sm text-zinc-950 font-display">
                    {vehicle.tenXe} ({vehicle.bienSo || '59-A1 888.88'})
                  </div>
                  <div>• Biển số: <strong className="font-mono text-zinc-900">{vehicle.bienSo || '59-A1 888.88'}</strong></div>
                  <div>• Số khung: <span className="font-mono">{vehicle.soKhung || 'RLHND160CB4317993'}</span></div>
                  <div>• Số máy: <span className="font-mono">JF62E088888</span></div>
                  <div>• Ngày mua: <span className="font-mono">{vehicle.ngayMua || '15/10/2023'}</span></div>
                  <div>
                    • Bảo hành hiện tại:{' '}
                    <span className="font-bold text-emerald-700 font-mono">
                      Còn đến {vehicle.hanBaoHanh || '15/10/2026'} (Đang hiệu lực)
                    </span>
                  </div>
                </div>
              </div>

              {/* Card thông tin chủ sở hữu */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-1.5">
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-zinc-500 font-mono">
                  THÔNG TIN CHỦ SỞ HỮU
                </div>
                <div className="font-bold text-zinc-900">
                  Họ và tên: <span className="uppercase">{customer?.hoTen || 'LÊ VĂN BẠN'}</span>
                </div>
                <div className="text-zinc-600 font-mono">
                  Số điện thoại: <strong>{customer?.soDienThoai || '0937865665'}</strong>
                </div>
                <div className="text-zinc-600">
                  Email: <strong>{customer?.email || 'leban@gmail.com'}</strong>
                </div>
              </div>
            </div>

            {/* Cột phải: Cập nhật thông tin thực tế */}
            <div className="lg:col-span-6 space-y-5">
              <div className="text-xs font-black uppercase tracking-wider text-zinc-900 font-mono">
                CẬP NHẬT THÔNG TIN THỰC TẾ
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nhập số KM hiện tại */}
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1 font-mono uppercase">
                    NHẬP SỐ KM HIỆN TẠI (ODO) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={currentOdo}
                      onChange={(e) => setCurrentOdo(Number(e.target.value) || 0)}
                      className="w-full p-3 pr-12 rounded-xl border border-zinc-300 text-sm font-bold font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 font-mono">
                      km
                    </span>
                  </div>
                </div>

                {/* Ngày gửi yêu cầu */}
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1 font-mono uppercase">
                    NGÀY KHÁCH HÀNG GỬI YÊU CẦU
                  </label>
                  <input
                    type="date"
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-zinc-300 text-xs font-bold font-mono focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Hình ảnh/video minh chứng ODO */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-zinc-900 uppercase font-mono">
                    HÌNH ẢNH / VIDEO MINH CHỨNG ODO (*) <span className="text-red-600">(Yêu cầu bắt buộc)</span>
                  </span>
                  <span className="text-[11px] text-zinc-400">(Tối đa 4 file, dưới 50MB, png, jpg, mp4)</span>
                </div>

                {/* Preview thumbnails */}
                <div className="grid grid-cols-3 gap-3">
                  {evidenceImages.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-zinc-200 aspect-video bg-zinc-100 flex items-center justify-center">
                      <img src={img} alt={`Minh chứng ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer hover:bg-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {evidenceImages.length < 4 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl border-2 border-dashed border-zinc-300 hover:border-red-600 bg-zinc-50 hover:bg-red-50/30 text-xs font-bold text-zinc-500 hover:text-red-700 transition flex flex-col items-center justify-center gap-1 aspect-video cursor-pointer"
                    >
                      <span className="text-lg">📷</span>
                      <span>+ Thêm ảnh</span>
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Cam kết thông tin */}
              <label className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 cursor-pointer flex items-start gap-3 select-none">
                <input
                  type="checkbox"
                  checked={isCommitChecked}
                  onChange={(e) => setIsCommitChecked(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 accent-red-600 mt-0.5 shrink-0 cursor-pointer"
                />
                <span className="leading-relaxed">
                  Tôi xin cam kết số km đã khai và hình ảnh/video minh chứng cung cấp là chính xác, trung thực. Nếu có sai sót, tôi hoàn toàn chịu trách nhiệm.
                </span>
              </label>

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                >
                  ✕ Hủy
                </button>
                <button
                  type="button"
                  disabled={!isCommitChecked || currentOdo <= 0 || evidenceImages.length === 0}
                  onClick={() => setCurrentStep(2)}
                  className="px-7 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 disabled:bg-zinc-300 text-white transition shadow-md cursor-pointer flex items-center gap-1.5"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
                >
                  <span>Tiếp theo →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          BƯỚC 2: KIỂM TRA LỊCH SỬ DỊCH VỤ (CHUẨN 100% THEO ẢNH 2 & ẢNH 3)
          ========================================================================= */}
      {currentStep === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wide text-zinc-400 font-mono">
                BƯỚC 2: KIỂM TRA LỊCH SỬ DỊCH VỤ
              </div>
              <h2
                className="text-lg sm:text-xl font-black text-zinc-950 uppercase tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                KẾT QUẢ THẨM ĐỊNH LỊCH SỬ & ĐIỀU KIỆN (Từ hệ thống MOTOSHOP)
              </h2>
            </div>

            {/* Toggle mô phỏng ĐẠT (Ảnh 2) vs KHÔNG ĐẠT (Ảnh 3) để bạn test trực quan */}
            <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl text-xs font-bold">
              <span className="text-[11px] text-zinc-500 pl-2">Mô phỏng:</span>
              <button
                type="button"
                onClick={() => setSimulateFail(false)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  !simulateFail ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                ✔ ĐẠT (Ảnh 2)
              </button>
              <button
                type="button"
                onClick={() => setSimulateFail(true)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  simulateFail ? 'bg-red-600 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                ⛔ KHÔNG ĐẠT (Ảnh 3)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cột trái: Kết quả thẩm định 3 tiêu chí */}
            <div className="lg:col-span-6 space-y-5">
              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-3.5">
                <div>
                  <span className="text-zinc-500">Phương tiện:</span>{' '}
                  <strong className="text-zinc-900">{vehicle.tenXe} ({vehicle.bienSo || '59-A1 888.88'})</strong>
                </div>
                <div>
                  <span className="text-zinc-500">Khách hàng:</span>{' '}
                  <strong className="text-zinc-900 uppercase">{customer?.hoTen || 'LÊ VĂN BẠN'}</strong>
                </div>

                <div className="pt-2 border-t border-zinc-200 space-y-2.5">
                  <div className="font-extrabold text-zinc-900 uppercase font-mono text-[11px]">
                    TRẠNG THÁI KIỂM TRA (3 TIÊU CHÍ):
                  </div>

                  {/* Tiêu chí 1: ODO */}
                  <div className="flex items-start gap-2">
                    <span className={assessmentResult.criteria.odo ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                      {assessmentResult.criteria.odo ? '✔' : '⛔'}
                    </span>
                    <div>
                      <strong>Số km hiện tại (ODO):</strong>{' '}
                      <span className={assessmentResult.criteria.odo ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                        {assessmentResult.criteria.odoText}
                      </span>
                    </div>
                  </div>

                  {/* Tiêu chí 2: Bảo dưỡng định kỳ */}
                  <div className="flex items-start gap-2">
                    <span className={assessmentResult.criteria.maintenance ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                      {assessmentResult.criteria.maintenance ? '✔' : '⛔'}
                    </span>
                    <div>
                      <strong>Bảo dưỡng định kỳ:</strong>{' '}
                      <span className={assessmentResult.criteria.maintenance ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                        {assessmentResult.criteria.maintenanceText}
                      </span>
                    </div>
                  </div>

                  {/* Tiêu chí 3: Lịch sử sửa chữa */}
                  <div className="flex items-start gap-2">
                    <span className={assessmentResult.criteria.repair ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                      {assessmentResult.criteria.repair ? '✔' : '⛔'}
                    </span>
                    <div>
                      <strong>Lịch sử sửa chữa:</strong>{' '}
                      <span className={assessmentResult.criteria.repair ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                        {assessmentResult.criteria.repairText}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kết luận Box */}
              {assessmentResult.isEligible ? (
                /* TH1: HỘP XANH ĐẠT ĐIỀU KIỆN (CHUẨN ẢNH 2) */
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-1">
                  <div className="font-extrabold text-sm flex items-center gap-2">
                    <span className="text-lg">✔</span>
                    <span>PHƯƠNG TIỆN ĐỦ ĐIỀU KIỆN GIA HẠN BẢO HÀNH MỞ RỘNG</span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Xe đáp ứng toàn bộ điều kiện ODO và lịch sử bảo dưỡng chính hãng định kỳ. Bạn có thể chọn gói bảo hành mở rộng ngay bây giờ.
                  </p>
                </div>
              ) : (
                /* TH2: HỘP ĐỎ KHÔNG ĐẠT ĐIỀU KIỆN (CHUẨN ẢNH 3) */
                <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-950 space-y-1.5">
                  <div className="font-extrabold text-sm flex items-center gap-2 text-red-700">
                    <span className="text-lg">⛔</span>
                    <span>PHƯƠNG TIỆN KHÔNG ĐỦ ĐIỀU KIỆN GIA HẠN BẢO HÀNH MỞ RỘNG</span>
                  </div>
                  <p className="text-xs text-red-800 leading-relaxed">
                    {assessmentResult.reason}
                  </p>
                </div>
              )}
            </div>

            {/* Cột phải: Timeline lịch sử dịch vụ */}
            <div className="lg:col-span-6 space-y-4">
              <div className="text-xs font-black uppercase tracking-wider text-zinc-900 font-mono">
                CHI TIẾT LỊCH SỬ DỊCH VỤ ĐÃ GHI NHẬN
              </div>

              <div className="relative pl-6 border-l-2 border-zinc-200 space-y-4">
                {assessmentResult.history.map((h) => (
                  <div key={h.id} className="relative group text-xs">
                    <div
                      className={`absolute -left-[31px] top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-xs ${
                        h.ketQua === 'Dat' ? 'bg-emerald-600' : 'bg-red-600'
                      }`}
                    >
                      {h.ketQua === 'Dat' ? '✔' : '✕'}
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                      <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500">
                        <span>📅 {h.ngayThucHien}</span>
                        <span className={h.ketQua === 'Dat' ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                          {h.ketQua === 'Dat' ? '➔ ✔ ĐẠT' : '➔ ⛔ Phát hiện can thiệp bên ngoài'}
                        </span>
                      </div>
                      <div className="font-bold text-zinc-900">{h.tenDichVu}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        ODO: {h.soKm.toLocaleString('vi-VN')} km
                      </div>
                      {h.ghiChu && (
                        <div className="text-[11px] text-red-700 font-medium pt-0.5">
                          ⚠️ {h.ghiChu}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-zinc-400 font-mono">
                Kiểm tra 100% lịch sử được thực hiện tại hệ thống chi nhánh ủy quyền của MOTOSHOP.
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
            >
              ← Quay lại
            </button>

            {!assessmentResult.isEligible ? (
              <>
                <button
                  type="button"
                  onClick={() => alert('Đang kết nối Hotline kỹ thuật 1900 8888 để được hỗ trợ chuyên sâu...')}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>📞 Liên hệ hỗ trợ</span>
                </button>

                <button
                  type="button"
                  disabled
                  title="Không khả dụng do không đạt điều kiện"
                  className="px-6 py-2.5 rounded-xl text-xs font-medium bg-zinc-200 text-zinc-400 border border-zinc-300 cursor-not-allowed flex items-center gap-1.5"
                >
                  <span>🔒 Tiếp theo →</span>
                  <span className="text-[10px] hidden sm:inline">(Không khả dụng do không đạt điều kiện)</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-7 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition shadow-md cursor-pointer flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
              >
                <span>Tiếp theo →</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          BƯỚC 3: CHỌN GÓI BẢO HÀNH (CHUẨN 100% THEO ẢNH 4 - media_1791475788643)
          ========================================================================= */}
      {currentStep === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <div className="border-b border-zinc-100 pb-3">
            <div className="text-xs font-extrabold uppercase tracking-wide text-zinc-400 font-mono">
              BƯỚC 3: CHỌN GÓI BẢO HÀNH MỞ RỘNG
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Dựa trên thông tin xe <strong>{vehicle.tenXe} ({vehicle.bienSo || '59-A1 888.88'})</strong> và số km{' '}
              <strong>{currentOdo.toLocaleString('vi-VN')} km</strong> đã xác nhận.
            </p>
          </div>

          {/* Lưới 4 Cards gói bảo hành (Chuẩn 100% Ảnh 4) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {EXTENDED_WARRANTY_PACKAGES.slice(0, 4).map((pkg) => {
              const isSelected = selectedPkgId === pkg.id;
              const isEligible = pkg.isEligible !== false;

              return (
                <div
                  key={pkg.id}
                  className={`p-5 rounded-2xl border-2 flex flex-col justify-between transition ${
                    !isEligible
                      ? 'border-zinc-200 bg-zinc-50/60 opacity-70'
                      : isSelected
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-sm'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Badge tiêu đề */}
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-zinc-950 font-display uppercase">
                        {pkg.tenGoi}
                      </span>
                      {pkg.isPopular && isEligible && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-700 text-white font-mono">
                          PHỔ BIẾN
                        </span>
                      )}
                    </div>

                    {/* Huy hiệu Đủ điều kiện / Không đủ điều kiện */}
                    {isEligible ? (
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 font-mono">
                        ✓ ĐỦ ĐIỀU KIỆN
                      </div>
                    ) : (
                      <div className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold flex items-center gap-1">
                        <span>🔒</span>
                        <span>KHÔNG ĐỦ ĐIỀU KIỆN</span>
                      </div>
                    )}

                    {/* Giá tiền */}
                    <div className="space-y-0.5">
                      <div className="text-lg font-black text-red-700 font-display">
                        {formatVND(pkg.giaUuDai)} <span className="text-xs font-normal text-zinc-500">/ {pkg.thoiGianThem}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        (hoặc tối đa {pkg.kmThem} tiếp theo)
                      </div>
                    </div>

                    {/* Quyền lợi hoặc Lý do khóa */}
                    {isEligible ? (
                      <div className="text-xs text-zinc-600 space-y-1 pt-2 border-t border-zinc-100">
                        <div className="font-semibold text-zinc-850 text-[11px]">Quyền lợi:</div>
                        {pkg.quyenLoi.map((ql, i) => (
                          <div key={i} className="text-[11px] leading-tight flex items-start gap-1">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{ql}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-zinc-100 text-[11px] text-zinc-500 leading-tight">
                        {pkg.ineligibleReason}
                      </div>
                    )}
                  </div>

                  {/* Nút chọn hoặc Disabled */}
                  <div className="pt-4 mt-3 border-t border-zinc-100">
                    {isEligible ? (
                      isSelected ? (
                        <button
                          type="button"
                          className="w-full py-2.5 rounded-xl text-xs font-black uppercase bg-emerald-700 text-white shadow-xs cursor-default flex items-center justify-center gap-1.5"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          <span>ĐÃ CHỌN ✔</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedPkgId(pkg.id)}
                          className="w-full py-2.5 rounded-xl text-xs font-bold uppercase border-2 border-red-700 text-red-700 hover:bg-red-50 transition cursor-pointer"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          [ Chọn gói này ]
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 rounded-xl text-xs font-semibold bg-zinc-200 text-zinc-400 cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        <span>[ 🔒 Không khả dụng ]</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Bar Tóm tắt & Chuyển bước */}
          <div className="p-4 rounded-2xl bg-zinc-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <span>Tên xe: <strong className="text-white">{vehicle.tenXe}</strong></span>
              <span>·</span>
              <span>Gói đã chọn: <strong className="text-emerald-400">{selectedPackage.tenGoi}</strong></span>
              <span>·</span>
              <span>Giá: <strong className="text-red-400 text-sm">{formatVND(selectedPackage.giaUuDai)}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
              >
                ← Quay lại
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition shadow-md cursor-pointer"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
              >
                Tiếp theo →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          BƯỚC 4: HÓA ĐƠN & THANH TOÁN (CHUẨN FLOWCHART SƠ ĐỒ)
          ========================================================================= */}
      {currentStep === 4 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <div className="border-b border-zinc-100 pb-3">
            <div className="text-xs font-extrabold uppercase tracking-wide text-zinc-400 font-mono">
              BƯỚC 4: HÓA ĐƠN & THANH TOÁN
            </div>
            <h2
              className="text-lg sm:text-xl font-black text-zinc-950 uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              HÓA ĐƠN GIA HẠN BẢO HÀNH ĐIỆN TỬ
            </h2>
          </div>

          {paymentStatus === 'success' ? (
            /* TRẠNG THÁI: THANH TOÁN THÀNH CÔNG -> KÍCH HOẠT SỔ BẢO HÀNH */
            <div className="p-8 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center text-3xl mx-auto shadow-md">
                ✓
              </div>
              <h3 className="text-2xl font-black text-emerald-950 font-display">
                GIA HẠN BẢO HÀNH THÀNH CÔNG!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-900 max-w-lg mx-auto">
                Hệ thống đã tự động kích hoạt <strong>{selectedPackage.tenGoi}</strong> và cập nhật thời hạn nối tiếp vào <strong>Sổ bảo hành điện tử</strong> của phương tiện.
              </p>

              <div className="p-4 rounded-2xl bg-white border border-emerald-200 max-w-md mx-auto text-xs space-y-2 font-mono text-zinc-700">
                <div className="flex justify-between">
                  <span>Phương tiện:</span>
                  <strong className="text-zinc-900">{vehicle.tenXe} ({vehicle.bienSo || vehicle.id})</strong>
                </div>
                <div className="flex justify-between">
                  <span>Gói kích hoạt:</span>
                  <strong className="text-emerald-700">{selectedPackage.tenGoi}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Thời gian cộng thêm:</span>
                  <strong>+{selectedPackage.thoiGianThem} / +{selectedPackage.kmThem}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Tổng tiền thanh toán:</span>
                  <strong className="text-red-700">{formatVND(selectedPackage.giaUuDai)}</strong>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onSuccess(vehicle);
                    onClose();
                  }}
                  className="px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-wider bg-emerald-700 hover:bg-emerald-800 text-white shadow-md cursor-pointer"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  XEM SỔ BẢO HÀNH ĐIỆN TỬ →
                </button>
              </div>
            </div>
          ) : (
            /* FORM HÓA ĐƠN & THANH TOÁN QR */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Cột trái: Hóa đơn chi tiết */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs">
                  <div className="font-bold text-zinc-900 uppercase font-mono text-[11px] pb-2 border-b border-zinc-200">
                    CHI TIẾT ĐƠN HÀNG DỊCH VỤ
                  </div>

                  <div className="flex justify-between">
                    <span className="text-zinc-500">Khách hàng:</span>
                    <strong className="text-zinc-900 uppercase">{customer?.hoTen || 'LÊ VĂN BẠN'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Số điện thoại:</span>
                    <span className="font-mono text-zinc-900">{customer?.soDienThoai || '0937865665'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Xe áp dụng:</span>
                    <strong className="text-zinc-900">{vehicle.tenXe} ({vehicle.bienSo || '59-A1 888.88'})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Số ODO ghi nhận:</span>
                    <span className="font-mono">{currentOdo.toLocaleString('vi-VN')} km</span>
                  </div>

                  <div className="pt-2 border-t border-zinc-200 flex justify-between">
                    <span className="text-zinc-500">Gói gia hạn:</span>
                    <strong className="text-emerald-700">{selectedPackage.tenGoi}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Thời hạn bảo hành mới:</span>
                    <strong className="text-zinc-900">+{selectedPackage.thoiGianThem} / +{selectedPackage.kmThem}</strong>
                  </div>

                  <div className="pt-3 border-t border-zinc-200 flex justify-between text-sm">
                    <span className="font-bold text-zinc-900 uppercase font-mono">TỔNG TIỀN THANH TOÁN:</span>
                    <strong className="font-black text-red-700 text-base font-display">
                      {formatVND(selectedPackage.giaUuDai)}
                    </strong>
                  </div>
                </div>

                {paymentStatus === 'failed' && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-950 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-red-700">
                      <span>✕</span> THANH TOÁN THẤT BẠI HOẶC BỊ HỦY
                    </div>
                    <p>Hệ thống chưa ghi nhận được khoản chuyển khoản. Vui lòng quét lại mã QR hoặc thử lại phương thức khác.</p>
                  </div>
                )}
              </div>

              {/* Cột phải: Cổng chuyển khoản QR */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-3">
                  <div className="text-xs font-bold text-zinc-900 uppercase font-mono">
                    QUÉT MÃ QR CHUYỂN KHOẢN (VIETQR)
                  </div>

                  {/* QR Image */}
                  <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl border border-zinc-300 shadow-xs flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MOTOSHOP-WARRANTY-${vehicle.id}-${selectedPackage.id}-${selectedPackage.giaUuDai}`}
                      alt="Mã QR thanh toán"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="text-[11px] text-zinc-600 font-mono space-y-0.5">
                    <div>Ngân hàng: <strong>Vietcombank (VCB)</strong></div>
                    <div>Số tài khoản: <strong>9988 7766 5544</strong></div>
                    <div>Số tiền: <strong className="text-red-700">{formatVND(selectedPackage.giaUuDai)}</strong></div>
                    <div>Nội dung: <strong>BH {vehicle.id} {customer?.soDienThoai}</strong></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={paymentStatus === 'processing'}
                    className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-red-700 hover:bg-red-800 disabled:bg-zinc-400 text-white shadow-md cursor-pointer transition flex items-center justify-center gap-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <span>{paymentStatus === 'processing' ? 'ĐANG XỬ LÝ KÍCH HOẠT...' : 'XÁC NHẬN ĐÃ CHUYỂN KHOẢN THÀNH CÔNG'}</span>
                    <span>✓</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentStatus('failed')}
                    className="w-full py-2 rounded-xl text-[11px] font-semibold text-zinc-500 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                  >
                    Mô phỏng: Báo thanh toán thất bại
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
