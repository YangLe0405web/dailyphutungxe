import React from 'react';
import type { InsuranceContract } from '../../data/mockData';
import { formatVND } from '../../data/mockData';

interface InsuranceCertificateModalProps {
  contract: InsuranceContract | null;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function InsuranceCertificateModal({
  contract,
  onClose,
  isAdmin = false,
}: InsuranceCertificateModalProps) {
  if (!contract) return null;

  const vat = contract.thueVAT ?? Math.round(contract.phiBaoHiem * 0.1);
  const discount = contract.maGiamGia ? Math.round(contract.phiBaoHiem * 0.1) : 0;
  const total = contract.tongTien ?? (contract.phiBaoHiem + vat - discount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white print:fixed print:inset-0 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[94vh] overflow-y-auto shadow-2xl border border-zinc-200 p-6 sm:p-8 space-y-6 text-zinc-900 print:text-black print:bg-white print:border-none print:shadow-none print:p-6">
        
        {/* Header Toolbar (Ẩn khi in ấn) */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <span className="font-mono text-xs text-red-700 font-bold">
              Số GCN: {contract.soGCN} · Mã HĐ: #{contract.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-black cursor-pointer shadow-xs transition flex items-center gap-1.5"
            >
              <span>🖨️</span>
              <span>In / Tải PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-black flex items-center justify-center font-bold text-sm cursor-pointer transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Certificate Body (Chuẩn mẫu Giấy chứng nhận & Hóa đơn điện tử) */}
        <div className="border-2 border-red-700/80 rounded-2xl p-6 bg-white space-y-4 text-xs shadow-2xs">
          
          {/* Header Quốc hiệu */}
          <div className="text-center space-y-1 pb-4 border-b border-zinc-200">
            <div className="text-[11px] font-bold tracking-wider text-zinc-800 uppercase font-sans">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="text-[10px] font-semibold text-zinc-600">Độc lập - Tự do - Hạnh phúc</div>
            <div className="pt-2">
              <div
                className="text-lg sm:text-xl font-extrabold text-red-700 uppercase"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
              >
                GIẤY CHỨNG NHẬN BẢO HIỂM XE MÁY ĐIỆN TỬ
              </div>
              <div className="text-xs text-zinc-500 font-mono mt-0.5">
                Số GCN: <strong className="text-zinc-900 font-bold">{contract.soGCN}</strong>
              </div>
            </div>
          </div>

          {/* 1. ĐƠN VỊ BẢO HIỂM PHÁT HÀNH */}
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Đơn vị phát hành:</span>
              <div className="font-extrabold text-zinc-900 text-xs sm:text-sm">
                {contract.nhaBaoHiem || 'Tổng Công ty Bảo hiểm Bảo Việt'}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              HỢP CHUẨN NĐ 67/2023/NĐ-CP
            </span>
          </div>

          {/* 2. THÔNG TIN CHỦ PHƯƠNG TIỆN */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-zinc-900">
            <div className="text-[11px] font-bold text-red-800 uppercase font-mono tracking-wider">
              I. THÔNG TIN CHỦ PHƯƠNG TIỆN
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                Họ và tên: <strong className="text-black font-extrabold">{contract.hoTenKH}</strong>
              </div>
              <div>
                Số điện thoại: <strong className="text-black font-mono font-extrabold">{contract.soDienThoai}</strong>
              </div>
              <div>
                Email: <span className="text-zinc-700 font-medium">{contract.email || 'Chưa cập nhật'}</span>
              </div>
              <div>
                Địa chỉ: <span className="text-zinc-700 font-medium">{contract.diaChi || 'Toàn quốc'}</span>
              </div>
            </div>
          </div>

          {/* 3. THÔNG TIN XE ĐƯỢC BẢO HIỂM */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-zinc-900">
            <div className="text-[11px] font-bold text-red-800 uppercase font-mono tracking-wider">
              II. THÔNG TIN XE ĐƯỢC BẢO HIỂM
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                Dòng xe: <strong className="text-black font-extrabold">{contract.tenXe}</strong>
              </div>
              <div>
                Biển số đăng ký:{' '}
                <strong className="text-red-700 font-mono font-extrabold">{contract.bienSo || 'Chưa có biển số'}</strong>
              </div>
              <div>
                Số khung (VIN): <span className="font-mono text-black font-bold">{contract.soKhung || 'Chưa cập nhật'}</span>
              </div>
              <div>
                Số máy: <span className="font-mono text-black font-bold">{contract.soMay || 'Theo giấy tờ xe'}</span>
              </div>
            </div>
          </div>

          {/* 4. NỘI DUNG VÀ THỜI HẠN BẢO HIỂM & BẢNG PHÍ HÓA ĐƠN */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-zinc-900">
            <div className="text-[11px] font-bold text-red-800 uppercase font-mono tracking-wider">
              III. NỘI DUNG VÀ THỜI HẠN BẢO HIỂM
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                Gói bảo hiểm: <strong className="text-black font-extrabold">{contract.tenGoi}</strong>
              </div>
              <div>
                Thời hạn bảo hiểm: <strong className="text-black font-extrabold">{contract.thoiHanNam || 1} năm</strong>
              </div>
              <div>
                Ngày bắt đầu: <strong className="text-black font-mono font-bold">{contract.ngayBatDau}</strong>
              </div>
              <div>
                Ngày kết thúc: <strong className="text-black font-mono font-bold">{contract.ngayKetThuc}</strong>
              </div>
            </div>

            {/* Chi tiết tài chính / Hóa đơn */}
            <div className="pt-2 border-t border-zinc-200 space-y-1.5">
              <div className="flex justify-between text-zinc-600">
                <span>Phí bảo hiểm theo biểu phí quy định:</span>
                <span className="font-mono font-bold text-zinc-900">{formatVND(contract.phiBaoHiem)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Thuế giá trị gia tăng (VAT 10%):</span>
                <span className="font-mono font-bold text-zinc-900">+{formatVND(vat)}</span>
              </div>
              {contract.maGiamGia && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Ưu đãi áp dụng ({contract.maGiamGia}):</span>
                  <span className="font-mono font-bold">-{formatVND(discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1.5 border-t border-zinc-300">
                <span className="font-extrabold text-xs uppercase text-zinc-900">Tổng thanh toán:</span>
                <strong className="text-sm font-extrabold text-red-700 font-mono">
                  {formatVND(total)}
                </strong>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 pt-0.5">
                <span>Phương thức thanh toán:</span>
                <span className="font-medium text-zinc-700">
                  {contract.phuongThucThanhToan === 'TienMat' ? '💵 Tiền mặt tại quầy' : '💳 Chuyển khoản VietQR'}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code & Dấu điện tử xác thực */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-between flex-wrap gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-zinc-900 text-white flex flex-col items-center justify-center p-1 font-mono text-[9px] text-center shadow">
                <span className="text-lg">📱</span>
                <span>QR CHỨNG NHẬN</span>
              </div>
              <div className="text-left text-[10px] text-zinc-500">
                <div>Quét mã để tra cứu trên Cổng Dịch vụ công</div>
                <div className="font-mono font-bold text-zinc-700">Tra cứu: crm.dailyxemay.vn/gcn</div>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="text-[10px] text-zinc-500 font-mono">Ngày cấp: {contract.ngayCap}</div>
              <div className="text-[11px] font-bold text-red-700 mt-1 uppercase font-serif tracking-wider">
                [ĐÃ KÝ ĐIỆN TỬ VÀ ĐÓNG DẤU MỘC SỐ]
              </div>
            </div>
          </div>

        </div>

        {/* Modal Action footer (Khách hàng) */}
        {!isAdmin && (
          <div className="flex items-center justify-end gap-2 pt-2 print:hidden">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 cursor-pointer transition"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
