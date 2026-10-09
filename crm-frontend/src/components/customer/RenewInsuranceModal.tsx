import { useState } from 'react';
import { type InsuranceContract, formatVND } from '../../data/mockData';

interface RenewInsuranceModalProps {
  contract: InsuranceContract;
  isAdmin?: boolean;
  onClose: () => void;
  onConfirm: (years: number, paymentMethod: 'ChuyenKhoan' | 'TienMat') => void;
}

export default function RenewInsuranceModal({
  contract,
  isAdmin = false,
  onClose,
  onConfirm,
}: RenewInsuranceModalProps) {
  const [durationYears, setDurationYears] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'ChuyenKhoan' | 'TienMat'>(
    isAdmin ? 'TienMat' : 'ChuyenKhoan'
  );
  const [showQrStep, setShowQrStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tính ngày bắt đầu và kết thúc mới
  const oldEndDate = new Date(contract.ngayKetThuc);
  const today = new Date();
  const startNewDate = !isNaN(oldEndDate.getTime()) && oldEndDate > today ? oldEndDate : today;
  
  const endNewDate = new Date(startNewDate);
  endNewDate.setFullYear(endNewDate.getFullYear() + durationYears);

  const startNewStr = startNewDate.toISOString().split('T')[0];
  const endNewStr = endNewDate.toISOString().split('T')[0];

  // Tính chi phí
  const feePerYear = Math.round(contract.phiBaoHiem / (contract.thoiHanNam || 1));
  const baseFee = feePerYear * durationYears;
  const vat = Math.round(baseFee * 0.1);
  const totalAmount = baseFee + vat;

  const handleProceed = () => {
    if (paymentMethod === 'ChuyenKhoan') {
      setShowQrStep(true);
    } else {
      setIsSubmitting(true);
      onConfirm(durationYears, paymentMethod);
    }
  };

  const handleConfirmPaidQr = () => {
    setIsSubmitting(true);
    onConfirm(durationYears, paymentMethod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 my-8 space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl font-bold shadow-xs">
              🔄
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-950 uppercase tracking-tight font-display">
                GIA HẠN HỢP ĐỒNG BẢO HIỂM
              </h3>
              <p className="text-xs text-zinc-500 font-mono">
                Số GCN: <span className="font-bold text-blue-700">{contract.soGCN}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 font-bold text-lg p-1 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {!showQrStep ? (
          /* BƯỚC 1: CHỌN THỜI HẠN & XEM TÍNH PHÍ */
          <div className="space-y-4">
            {/* Tóm tắt hợp đồng cũ */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
              <div className="flex justify-between items-center text-zinc-600">
                <span>Gói bảo hiểm:</span>
                <span className="font-bold text-zinc-900">{contract.tenGoi}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>Phương tiện:</span>
                <span className="font-bold text-zinc-900">{contract.tenXe} ({contract.bienSo})</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>Thời hạn hiện tại:</span>
                <span className="font-mono text-zinc-700">
                  {contract.ngayBatDau.split('-').reverse().join('/')} ➔ {contract.ngayKetThuc.split('-').reverse().join('/')}
                </span>
              </div>
            </div>

            {/* Chọn thời hạn gia hạn */}
            <div>
              <label className="block text-xs font-bold text-zinc-900 uppercase font-mono mb-2">
                Chọn số năm muốn gia hạn:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setDurationYears(y)}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                      durationYears === y
                        ? 'border-blue-600 bg-blue-50/70 text-blue-800 font-bold shadow-xs ring-2 ring-blue-500/20'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-white'
                    }`}
                  >
                    <div className="text-sm font-black font-display">{y} NĂM</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {formatVND(feePerYear * y)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Thời gian hiệu lực dự kiến sau khi gia hạn */}
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
              <span className="text-blue-900 font-medium">Thời hạn hiệu lực mới:</span>
              <span className="font-mono font-bold text-blue-800">
                {startNewStr.split('-').reverse().join('/')} ➔ {endNewStr.split('-').reverse().join('/')}
              </span>
            </div>

            {/* Phương thức thanh toán */}
            <div>
              <label className="block text-xs font-bold text-zinc-900 uppercase font-mono mb-2">
                Phương thức thanh toán:
              </label>
              {isAdmin ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TienMat')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                      paymentMethod === 'TienMat'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50'
                    }`}
                  >
                    <span>💵</span>
                    <span>Tiền mặt tại quầy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ChuyenKhoan')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                      paymentMethod === 'ChuyenKhoan'
                        ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                        : 'border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50'
                    }`}
                  >
                    <span>📱</span>
                    <span>Chuyển khoản VietQR</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-2xl border border-blue-200 bg-blue-50/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-blue-900">
                    <span>📱</span>
                    <span>Chuyển khoản ngân hàng (VietQR)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-200/60 text-blue-800 font-bold">
                    BẮT BUỘC WEB
                  </span>
                </div>
              )}
            </div>

            {/* Chi tiết chi phí */}
            <div className="p-4 rounded-2xl bg-zinc-900 text-white space-y-2 text-xs">
              <div className="flex justify-between text-zinc-300">
                <span>Phí gia hạn ({durationYears} năm):</span>
                <span className="font-mono">{formatVND(baseFee)}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Thuế VAT (10%):</span>
                <span className="font-mono">{formatVND(vat)}</span>
              </div>
              <div className="border-t border-zinc-700 pt-2 flex justify-between items-center">
                <span className="font-bold text-sm">Tổng cộng thanh toán:</span>
                <span className="font-mono font-black text-amber-400 text-base">
                  {formatVND(totalAmount)}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleProceed}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-700 hover:bg-blue-800 text-white transition shadow-md cursor-pointer flex items-center gap-1.5 font-display"
              >
                <span>
                  {paymentMethod === 'ChuyenKhoan'
                    ? 'QUÉT MÃ VIETQR THANH TOÁN →'
                    : 'XÁC NHẬN THU TIỀN VÀ GIA HẠN'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* BƯỚC 2: QUÉT MÃ VIETQR (NẾU CHỌN CHUYỂN KHOẢN) */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-3">
              <div className="w-44 h-44 mx-auto bg-white p-2 rounded-2xl border border-zinc-300 shadow-xs flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GIAHAN-BH-${contract.soGCN}-${totalAmount}`}
                  alt="Mã QR Chuyển khoản Gia hạn"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-xs text-zinc-700 font-mono space-y-0.5">
                <div>Ngân hàng: <strong>Vietcombank (VCB)</strong></div>
                <div>Số tài khoản: <strong>9988 7766 5544</strong></div>
                <div>Chủ tài khoản: <strong>CONG TY MOTOSHOP VIET NAM</strong></div>
                <div>Số tiền: <strong className="text-red-700 text-sm">{formatVND(totalAmount)}</strong></div>
                <div>Nội dung: <strong>GIAHAN {contract.soGCN} {contract.bienSo}</strong></div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmPaidQr}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-emerald-700 hover:bg-emerald-800 disabled:bg-zinc-400 text-white shadow-md cursor-pointer transition flex items-center justify-center gap-2 font-display"
              >
                <span>{isSubmitting ? 'ĐANG CẬP NHẬT GIA HẠN...' : 'XÁC NHẬN ĐÃ CHUYỂN KHOẢN THÀNH CÔNG'}</span>
                <span>✓</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrStep(false)}
                className="w-full py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 transition cursor-pointer"
              >
                ← Quay lại điều chỉnh thời hạn
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
