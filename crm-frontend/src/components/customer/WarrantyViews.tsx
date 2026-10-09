import React, { useState, useRef } from 'react';
import type { Vehicle, Customer, WarrantyRecord } from '../../data/mockData';
import {
  WARRANTY_BRANCHES,
  WARRANTY_ISSUES_LIST,
  EXTENDED_WARRANTY_PACKAGES,
  formatVND,
} from '../../data/mockData';

/* =========================================================================
   1. VIEW 2: TRANG CHI TIẾT BẢO HÀNH (CHUẨN 100% THEO ẢNH 1 - media_1791439256831)
   ========================================================================= */
interface WarrantyDetailViewProps {
  vehicle: Vehicle;
  customer: Customer | null;
  records: WarrantyRecord[];
  onRequestClaim: () => void;
  onExtendWarranty: () => void;
  onBack: () => void;
  toastMessage?: string | null;
  onClearToast?: () => void;
}

export function WarrantyDetailView({
  vehicle,
  customer,
  records,
  onRequestClaim,
  onExtendWarranty,
  onBack,
  toastMessage,
  onClearToast,
}: WarrantyDetailViewProps) {
  const [downloadingBooklet, setDownloadingBooklet] = useState(false);

  // Xử lý tải / in Sổ bảo hành điện tử (Nút 3 trên Ảnh 1)
  const handleDownloadBooklet = () => {
    setDownloadingBooklet(true);
    const content = `================================================================
           SỔ BẢO HÀNH ĐIỆN TỬ CHÍNH HÃNG
================================================================
MÃ PHƯƠNG TIỆN: ${vehicle.id}
TÊN XE: ${vehicle.tenXe}
BIỂN SỐ: ${vehicle.bienSo || 'Chưa gắn biển'}
SỐ KHUNG (VIN): ${vehicle.soKhung || 'Đang cập nhật'}
NGÀY MUA XE: ${vehicle.ngayMua || '15/09/2025'}
THỜI HẠN BẢO HÀNH: ${vehicle.hanBaoHanh || '15/09/2028'} (36 Tháng)
TRẠNG THÁI HIỆN TẠI: ${vehicle.trangThaiBaoHanh === 'ConHan' ? 'CÒN HIỆU LỰC BẢO HÀNH' : 'HẾT HẠN BẢO HÀNH'}

CHỦ SỞ HỮU: ${customer?.hoTen || 'Khách hàng'}
SỐ ĐIỆN THOẠI: ${customer?.soDienThoai || 'Chưa có'}
ĐỊA CHỈ: ${customer?.diaChi || 'Toàn quốc'}

ĐƠN VỊ CUNG CẤP BẢO HÀNH:
Hệ Thống Phân Phối Xe Máy & Phụ Tùng Chính Hãng Việt Nam
Hotline Kỹ thuật & Cứu hộ 24/7: 1900 8888
Website: https://dailyphutungxe.vn

----------------------------------------------------------------
LỊCH SỬ KIỂM TRA & BẢO HÀNH ĐÃ THỰC HIỆN (${records.length} LẦN):
----------------------------------------------------------------
${
  records.length === 0
    ? 'Chưa có lịch sử bảo hành nào phát sinh.'
    : records
        .map(
          (r, idx) =>
            `[${idx + 1}] MÃ PHIẾU: ${r.id}
     Ngày thực hiện: ${r.ngayThucHien}
     Chi nhánh: ${r.chiNhanh || 'Chi nhánh trung tâm'}
     Odo: ${(r.soKm || 12000).toLocaleString('vi-VN')} km | KTV: ${r.kyThuatVien || 'Kỹ thuật viên chính'}
     Nội dung: ${r.noiDung}
     Chi phí: ${r.chiPhi === 0 ? '0 đ (Miễn phí 100% theo diện Bảo hành)' : r.chiPhi.toLocaleString('vi-VN') + ' đ'}
     Trạng thái: Hoàn tất
----------------------------------------------------------------`
        )
        .join('\n')
}

CAM KẾT CHÍNH HÃNG:
Mọi linh kiện thay thế trong quá trình bảo hành đều là linh kiện chính hãng 100%.
Phiếu này có giá trị xác nhận điện tử trên toàn hệ thống showroom.
================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SoBaoHanhDienTu_${vehicle.bienSo ? vehicle.bienSo.replace(/[^a-zA-Z0-9]/g, '_') : vehicle.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloadingBooklet(false), 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-200">
        <nav className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-red-700 transition flex items-center gap-1 cursor-pointer font-bold text-zinc-700"
          >
            <span>← Phương tiện của tôi</span>
          </button>
          <span>/</span>
          <span className="text-zinc-400">Chi tiết bảo hành</span>
          <span>/</span>
          <span className="text-zinc-950 font-bold font-mono">{vehicle.bienSo || vehicle.id}</span>
        </nav>

        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition cursor-pointer flex items-center gap-1"
        >
          <span>Quay lại</span>
        </button>
      </div>

      {/* Toast thông báo nếu có */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎉</span>
            <div className="text-xs font-semibold">{toastMessage}</div>
          </div>
          {onClearToast && (
            <button
              type="button"
              onClick={onClearToast}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* CARD 1: TRẠNG THÁI BẢO HÀNH CHÍNH (CHUẨN ẢNH 1) */}
      <div className="rounded-3xl bg-white border border-zinc-200 shadow-sm overflow-hidden">
        {/* Banner header xe */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ✓ ĐANG TRONG HẠN BẢO HÀNH
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white/10 text-zinc-200 border border-white/10">
                {vehicle.id}
              </span>
            </div>

            <h1
              className="text-2xl sm:text-3xl font-black tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {vehicle.tenXe}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="text-zinc-500">Biển số:</span>
                <strong className="text-white text-sm bg-zinc-800 px-2.5 py-0.5 rounded border border-zinc-700">
                  {vehicle.bienSo || 'Chưa gắn biển'}
                </strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-zinc-500">Số khung:</span>
                <strong className="text-zinc-200">{vehicle.soKhung || 'Đang cập nhật'}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-zinc-500">Màu sắc:</span>
                <strong className="text-zinc-200">{vehicle.mauSac || 'Tiêu chuẩn'}</strong>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-3xl">
              🛡️
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold font-mono">GÓI DỊCH VỤ</div>
              <div className="text-sm font-black text-white font-display">BẢO HÀNH CHÍNH HÃNG 36T</div>
              <div className="text-[11px] text-emerald-400 font-medium">Toàn quốc · Miễn phí phụ tùng</div>
            </div>
          </div>
        </div>

        {/* 2 Thanh tiến trình Bảo hành (Thời gian & Quãng đường) */}
        <div className="p-6 sm:p-8 bg-zinc-50/50 border-b border-zinc-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thanh 1: Thời gian */}
            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-zinc-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span>⏳</span> THỜI HẠN BẢO HÀNH (36 THÁNG)
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Còn 18 tháng
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-zinc-100 overflow-hidden p-0.5 border border-zinc-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                  style={{ width: '50%' }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>Bắt đầu: {vehicle.ngayMua || '15/09/2025'}</span>
                <span>Hết hạn: {vehicle.hanBaoHanh || '15/09/2028'}</span>
              </div>
            </div>

            {/* Thanh 2: Quãng đường */}
            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-zinc-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span>🛣️</span> GIỚI HẠN QUÃNG ĐƯỜNG (30.000 KM)
                </span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 font-mono">
                  Đã đi: 12.500 km (41%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-zinc-100 overflow-hidden p-0.5 border border-zinc-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                  style={{ width: '41%' }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>0 km</span>
                <span>Còn lại: 17.500 km</span>
                <span>30.000 km</span>
              </div>
            </div>
          </div>

          {/* 3 NÚT HÀNH ĐỘNG CHÍNH (CHUẨN 100% THEO ẢNH 1) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6">
            {/* Nút 1: Gia hạn bảo hành */}
            <button
              type="button"
              onClick={onExtendWarranty}
              className="py-3.5 px-4 rounded-2xl text-xs font-bold bg-white hover:bg-zinc-100 text-zinc-900 border-2 border-zinc-300 hover:border-zinc-400 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
            >
              <span className="text-base">🛡️</span>
              <span>GIA HẠN BẢO HÀNH</span>
            </button>

            {/* Nút 2: Yêu cầu bảo hành (Primary) */}
            <button
              type="button"
              onClick={onRequestClaim}
              className="py-3.5 px-4 rounded-2xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
            >
              <span className="text-base">🔧</span>
              <span>YÊU CẦU BẢO HÀNH</span>
            </button>

            {/* Nút 3: Tải sổ bảo hành điện tử */}
            <button
              type="button"
              onClick={handleDownloadBooklet}
              disabled={downloadingBooklet}
              className="py-3.5 px-4 rounded-2xl text-xs font-bold bg-zinc-900 hover:bg-black text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
            >
              <span className="text-base">📄</span>
              <span>{downloadingBooklet ? 'ĐANG XUẤT SỔ...' : 'TẢI SỔ BẢO HÀNH ĐIỆN TỬ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* CARD 2: LỊCH SỬ BẢO HÀNH (TIMELINE CHUẨN ẢNH 1) */}
      <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-4">
          <div>
            <h2
              className="text-lg sm:text-xl font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span>📋</span> LỊCH SỬ BẢO HÀNH & KIỂM TRA ĐỊNH KỲ
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Toàn bộ hồ sơ kiểm tra, sửa chữa và thay thế linh kiện chính hãng của phương tiện
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200 self-start sm:self-auto font-mono">
            {records.length} lượt đã ghi nhận
          </span>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <div className="text-4xl mb-2">🛡️</div>
            <div className="text-sm font-bold text-zinc-800">Chưa có lượt bảo hành nào phát sinh</div>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              Khi bạn gửi yêu cầu và hoàn tất quy trình kiểm tra tại showroom, toàn bộ phiếu bảo hành và lịch sử thay thế linh kiện sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-red-200 space-y-6">
            {records.map((rec) => (
              <div key={rec.id} className="relative group">
                {/* Node icon trên trục timeline */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-red-700 text-white flex items-center justify-center text-[10px] font-black shadow-sm ring-4 ring-white">
                  ✓
                </div>

                {/* Card nội dung đợt bảo hành */}
                <div className="p-5 rounded-2xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 transition space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-zinc-900 text-white">
                        {rec.id}
                      </span>
                      <span className="text-xs font-bold text-zinc-800 font-mono">
                        📅 {rec.ngayThucHien}
                      </span>
                      <span className="text-xs text-zinc-500">· {rec.chiNhanh || 'Chi nhánh trung tâm'}</span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✓ ĐÃ HOÀN TẤT
                    </span>
                  </div>

                  <div className="text-sm font-bold text-zinc-900">
                    {rec.noiDung}
                  </div>

                  {rec.chiTietLinhKien && rec.chiTietLinhKien.length > 0 && (
                    <div className="p-3 rounded-xl bg-white border border-zinc-200 text-xs space-y-1">
                      <div className="font-extrabold text-zinc-500 uppercase tracking-widest text-[10px] font-mono">
                        LINH KIỆN THAY THẾ CHÍNH HÃNG:
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rec.chiTietLinhKien.map((part: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200 font-medium text-[11px]"
                          >
                            ⚙️ {part}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200 text-xs text-zinc-600 font-mono">
                    <div className="flex items-center gap-3">
                      <span>Odo lúc nhận: <strong>{(rec.soKm || 12000).toLocaleString('vi-VN')} km</strong></span>
                      <span>·</span>
                      <span>KTV phụ trách: <strong>{rec.kyThuatVien || 'KTV Showroom'}</strong></span>
                    </div>

                    <div className="text-right">
                      <span className="text-zinc-500 mr-1.5">Chi phí thanh toán:</span>
                      <strong className={rec.chiPhi === 0 ? 'text-emerald-700 text-sm' : 'text-zinc-900 text-sm'}>
                        {rec.chiPhi === 0 ? '0 đ (Miễn phí bảo hành)' : formatVND(rec.chiPhi)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CARD 3: GÓI BẢO HÀNH MỞ RỘNG (GÓI CARE+ CHUẨN ẢNH 1) */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-red-500/5 to-white border-2 border-amber-400/40 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <h2
                className="text-lg sm:text-xl font-black text-zinc-950 uppercase tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                GÓI BẢO HÀNH MỞ RỘNG CARE+
              </h2>
            </div>
            <p className="text-xs text-zinc-600 mt-1">
              Bảo vệ xe tối ưu sau khi hết thời hạn bảo hành chính hãng. An tâm trên mọi cung đường.
            </p>
          </div>

          <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950 shadow-xs self-start sm:self-auto font-mono">
            ƯU ĐÃI ĐỘC QUYỀN SHOWROOM
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {EXTENDED_WARRANTY_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="p-6 rounded-2xl bg-white border border-amber-200/80 hover:border-amber-400 shadow-sm transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-base text-zinc-950 uppercase font-display">
                    {pkg.tenGoi}
                  </h3>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    +{pkg.thoiGianThem}
                  </span>
                </div>

                <div className="text-2xl font-black text-red-700 font-display">
                  {formatVND(pkg.giaUuDai)}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5 line-through">
                  Giá gốc: {formatVND(pkg.giaGoc)}
                </div>
                <div className="text-xs text-zinc-600 mt-0.5 font-medium">
                  Giới hạn thêm: +{pkg.kmThem}
                </div>

                <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 text-xs text-zinc-700">
                  {pkg.quyenLoi.map((ql, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{ql}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={onExtendWarranty}
                className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-zinc-950 hover:bg-red-700 text-white transition cursor-pointer shadow-xs"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                ĐĂNG KÝ GÓI {pkg.tenGoi}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CARD 4: ĐIỀU KIỆN & CHÍNH SÁCH BẢO HÀNH (CHUẨN ẢNH 1) */}
      <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2
          className="text-base sm:text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span>📜</span> ĐIỀU KIỆN & CHÍNH SÁCH BẢO HÀNH CHÍNH HÃNG
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-600">
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="font-extrabold text-zinc-900 flex items-center gap-1.5">
              <span>✅</span> PHẠM VI BẢO HÀNH
            </div>
            <p className="leading-relaxed">
              Áp dụng cho tất cả hư hỏng do khuyết tật vật liệu hoặc lỗi lắp ráp chế tạo của nhà sản xuất trong điều kiện vận hành bình thường.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="font-extrabold text-zinc-900 flex items-center gap-1.5">
              <span>⛔</span> TRƯỜNG HỢP TỪ CHỐI
            </div>
            <p className="leading-relaxed">
              Xe đã qua độ chế kết cấu máy móc, tự ý đấu nối dây điện, hư hỏng do tai nạn ngập nước, hoặc không bảo dưỡng định kỳ đúng hạn.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="font-extrabold text-zinc-900 flex items-center gap-1.5">
              <span>⏱️</span> QUY TRÌNH TIẾP NHẬN
            </div>
            <p className="leading-relaxed">
              Tiếp nhận xe trong 15 phút, kỹ thuật viên giám định và thông báo phương án xử lý ngay trong ngày. Hoàn tất bàn giao phiếu bảo hành điện tử.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. VIEW 3: FORM YÊU CẦU KIỂM TRA BẢO HÀNH (CHUẨN 100% THEO ẢNH 3 - media_1791439256835)
   ========================================================================= */
interface WarrantyClaimFormViewProps {
  vehicle: Vehicle;
  customer: Customer | null;
  claimIssues: string[];
  setClaimIssues: React.Dispatch<React.SetStateAction<string[]>>;
  claimDesc: string;
  setClaimDesc: (v: string) => void;
  claimOdo: number;
  setClaimOdo: (v: number) => void;
  claimImages: string[];
  setClaimImages: React.Dispatch<React.SetStateAction<string[]>>;
  claimDate: string;
  setClaimDate: (v: string) => void;
  claimTime: string;
  setClaimTime: (v: string) => void;
  claimBranch: string;
  setClaimBranch: (v: string) => void;
  claimSubmitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

export function WarrantyClaimFormView({
  vehicle,
  customer,
  claimIssues,
  setClaimIssues,
  claimDesc,
  setClaimDesc,
  claimOdo,
  setClaimOdo,
  claimImages,
  setClaimImages,
  claimDate,
  setClaimDate,
  claimTime,
  setClaimTime,
  claimBranch,
  setClaimBranch,
  claimSubmitting,
  onSubmit,
  onBack,
}: WarrantyClaimFormViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const toggleIssue = (issue: string) => {
    if (claimIssues.includes(issue)) {
      setClaimIssues(claimIssues.filter((i) => i !== issue));
    } else {
      setClaimIssues([...claimIssues, issue]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh dung lượng dưới 5MB!');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        if (claimImages.length >= 4) {
          alert('Tối đa tải lên 4 ảnh minh họa!');
          return;
        }
        setClaimImages([...claimImages, reader.result]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (claimImages.length >= 4) {
      alert('Tối đa tải lên 4 ảnh minh họa!');
      return;
    }
    setClaimImages([...claimImages, url]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setClaimImages(claimImages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Form */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold text-red-700 hover:text-red-800 transition flex items-center gap-1 cursor-pointer mb-1"
          >
            <span>← Quay lại chi tiết bảo hành</span>
          </button>
          <h1
            className="text-2xl sm:text-3xl font-black text-zinc-950 uppercase tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            YÊU CẦU KIỂM TRA BẢO HÀNH
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Gửi thông tin tình trạng xe để được kiểm tra và xử lý bảo hành nhanh chóng
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-zinc-100 text-zinc-700 border border-zinc-200 self-start sm:self-auto">
          Mã xe: {vehicle.id}
        </span>
      </div>

      {/* Grid 2 cột: Cột trái Form (8 cols) & Cột phải Thẻ thông tin xe (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: FORM ĐIỀN THÔNG TIN (CHUẨN ẢNH 3) */}
        <div className="lg:col-span-8 space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm">
          {/* MỤC 1: VẤN ĐỀ XE ĐANG GẶP PHẢI */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wide text-zinc-900 font-mono flex items-center gap-1">
                <span>1. VẤN ĐỀ XE ĐANG GẶP PHẢI</span>
                <span className="text-red-600">*</span>
              </label>
              <span className="text-[11px] text-zinc-500">Chọn một hoặc nhiều vấn đề</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {WARRANTY_ISSUES_LIST.map((issue) => {
                const checked = claimIssues.includes(issue);
                return (
                  <label
                    key={issue}
                    onClick={() => toggleIssue(issue)}
                    className={`p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition flex items-center gap-3 select-none ${
                      checked
                        ? 'border-red-600 bg-red-50/70 text-red-950 font-bold shadow-2xs'
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}} // Đã xử lý ở label onClick
                      className="w-4 h-4 rounded text-red-600 accent-red-600 cursor-pointer shrink-0"
                    />
                    <span className="truncate">{issue}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* MỤC 2: MÔ TẢ CHI TIẾT TÌNH TRẠNG */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wide text-zinc-900 font-mono flex items-center gap-1">
              <span>2. MÔ TẢ CHI TIẾT TÌNH TRẠNG</span>
              <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={4}
              value={claimDesc}
              onChange={(e) => setClaimDesc(e.target.value)}
              placeholder="Mô tả cụ thể triệu chứng, thời điểm xuất hiện, tần suất (VD: Xe bị giật khi tăng tốc ở dải tốc độ 30-40km/h sau khi đi mưa, động cơ có tiếng gõ kim loại nhỏ ở đầu bò)..."
              className="w-full p-4 rounded-2xl border border-zinc-200 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition resize-none leading-relaxed"
            />
            <div className="text-[11px] text-zinc-400">
              Càng mô tả chi tiết, kỹ thuật viên sẽ chuẩn bị phụ tùng và xử lý nhanh chóng hơn.
            </div>
          </div>

          {/* MỤC 3: SỐ KM HIỆN TẠI (ODO) */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wide text-zinc-900 font-mono flex items-center gap-1">
              <span>3. SỐ KM HIỆN TẠI (ODO)</span>
              <span className="text-red-600">*</span>
            </label>
            <div className="relative max-w-xs">
              <input
                type="number"
                min={0}
                value={claimOdo}
                onChange={(e) => setClaimOdo(Number(e.target.value) || 0)}
                placeholder="12500"
                className="w-full p-3.5 pr-14 rounded-2xl border border-zinc-200 text-sm font-bold font-mono text-zinc-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 font-mono">
                KM
              </span>
            </div>
          </div>

          {/* MỤC 4: HÌNH ẢNH / VIDEO MINH HỌA */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold uppercase tracking-wide text-zinc-900 font-mono flex items-center gap-1">
              <span>4. HÌNH ẢNH / VIDEO MINH HỌA</span>
              <span className="text-zinc-400 font-normal">(Không bắt buộc - Tối đa 4 ảnh)</span>
            </label>

            {/* Danh sách ảnh đã chọn */}
            {claimImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {claimImages.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-zinc-200 aspect-video bg-zinc-100 flex items-center justify-center">
                    <img src={img} alt={`Minh họa ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shadow-md opacity-90 hover:opacity-100 cursor-pointer"
                      title="Xóa ảnh này"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Công cụ tải ảnh */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={claimImages.length >= 4}
                className="px-4 py-2.5 rounded-xl border border-dashed border-zinc-300 hover:border-red-600 bg-zinc-50 hover:bg-red-50/40 text-xs font-bold text-zinc-700 hover:text-red-700 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>📷</span>
                <span>Chọn ảnh từ thiết bị</span>
              </button>

              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Hoặc dán URL ảnh tại đây..."
                  disabled={claimImages.length >= 4}
                  className="flex-1 p-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-red-600 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={!imageUrlInput.trim() || claimImages.length >= 4}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-black disabled:bg-zinc-300 transition cursor-pointer"
                >
                  Thêm
                </button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400">
              Tải lên ảnh chụp đồng hồ hiển thị lỗi, vị trí rò rỉ hoặc dàn áo kêu để KTV chuẩn bị linh kiện trước.
            </p>
          </div>

          {/* MỤC 5: LỊCH HẸN TIẾP NHẬN XE */}
          <div className="space-y-3 pt-3 border-t border-zinc-100">
            <label className="text-xs font-extrabold uppercase tracking-wide text-zinc-900 font-mono flex items-center gap-1">
              <span>5. LỊCH HẸN TIẾP NHẬN XE TẠI SHOWROOM</span>
              <span className="text-red-600">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Ngày tiếp nhận *</label>
                <input
                  type="date"
                  value={claimDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setClaimDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Khung giờ tiếp nhận *</label>
                <select
                  value={claimTime}
                  onChange={(e) => setClaimTime(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-red-600 bg-white"
                >
                  <option value="08:30">08:30 - 09:30 (Sáng sớm)</option>
                  <option value="09:30">09:30 - 10:30</option>
                  <option value="10:30">10:30 - 11:30</option>
                  <option value="13:30">13:30 - 14:30 (Đầu giờ chiều)</option>
                  <option value="14:30">14:30 - 15:30</option>
                  <option value="15:30">15:30 - 16:30</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Chi nhánh tiếp nhận *</label>
                <select
                  value={claimBranch}
                  onChange={(e) => setClaimBranch(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-red-600 bg-white"
                >
                  {WARRANTY_BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* MỤC 6: THÔNG TIN LIÊN HỆ */}
          <div className="space-y-3 pt-3 border-t border-zinc-100">
            <label className="text-xs font-extrabold uppercase tracking-wide text-zinc-900 font-mono">
              6. THÔNG TIN KHÁCH HÀNG LIÊN HỆ
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <div className="text-[10px] text-zinc-500 font-mono uppercase">Họ và tên</div>
                <div className="text-xs font-bold text-zinc-900 mt-0.5">{customer?.hoTen || 'Khách hàng'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <div className="text-[10px] text-zinc-500 font-mono uppercase">Số điện thoại tiếp nhận</div>
                <div className="text-xs font-bold text-zinc-900 font-mono mt-0.5">{customer?.soDienThoai || 'Chưa có'}</div>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-zinc-200 space-y-3">
            <button
              type="button"
              onClick={onSubmit}
              disabled={claimSubmitting}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-white bg-red-700 hover:bg-red-800 disabled:bg-zinc-400 transition shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span>{claimSubmitting ? 'ĐANG GỬI THÔNG TIN LỊCH HẸN...' : 'GỬI YÊU CẦU KIỂM TRA BẢO HÀNH'}</span>
              <span>→</span>
            </button>

            <div className="text-center text-[11px] text-zinc-500">
              🔒 Thông tin được bảo mật theo chính sách bảo hành. Showroom sẽ xác nhận lịch hẹn trong 30 phút làm việc.
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: THẺ THÔNG TIN XE (STICKY SIDEBAR CHUẨN ẢNH 3) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-sm space-y-4">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 font-mono">
              THÔNG TIN PHƯƠNG TIỆN YÊU CẦU
            </div>

            <div className="space-y-1">
              <h3
                className="text-lg font-black text-zinc-950 font-display"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {vehicle.tenXe}
              </h3>
              <div className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 inline-block">
                {vehicle.bienSo || 'Chưa gắn biển'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Mã xe:</span>
                <span className="font-mono font-bold text-zinc-800">{vehicle.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Số khung:</span>
                <span className="font-mono text-zinc-800">{vehicle.soKhung || 'Đang cập nhật'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Màu sắc:</span>
                <span className="text-zinc-800 font-medium">{vehicle.mauSac || 'Tiêu chuẩn'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Hạn bảo hành:</span>
                <span className="font-bold text-emerald-700 font-mono">{vehicle.hanBaoHanh || '15/09/2028'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1.5 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <span>🛡️</span> BẢO HÀNH CHÍNH HÃNG 100%
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Phương tiện đang trong hạn bảo hành hợp lệ. Toàn bộ tiền công kiểm tra và phụ tùng thay thế được miễn phí nếu phát sinh lỗi do nhà sản xuất.
              </p>
            </div>

            <div className="text-[11px] text-zinc-500 text-center font-mono pt-2 border-t border-zinc-100">
              Tổng đài hỗ trợ kỹ thuật: <strong className="text-zinc-900">1900 8888</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   3. MODAL GIA HẠN BẢO HÀNH MỞ RỘNG (GÓI CARE+)
   ========================================================================= */
interface ExtendedWarrantyModalProps {
  vehicle: Vehicle;
  selectedPkgId: string;
  onSelectPkg: (id: string) => void;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ExtendedWarrantyModal({
  vehicle,
  selectedPkgId,
  onSelectPkg,
  submitting,
  onConfirm,
  onClose,
}: ExtendedWarrantyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
          <div>
            <h3
              className="font-black text-lg text-zinc-950 uppercase tracking-tight flex items-center gap-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span>🛡️</span> GIA HẠN BẢO HÀNH CARE+
            </h3>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Xe: {vehicle.tenXe} · {vehicle.bienSo || vehicle.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-bold text-zinc-700 uppercase font-mono">
            CHỌN GÓI BẢO HÀNH MỞ RỘNG:
          </div>

          <div className="space-y-3">
            {EXTENDED_WARRANTY_PACKAGES.map((pkg) => {
              const active = selectedPkgId === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => onSelectPkg(pkg.id)}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-2 ${
                    active
                      ? 'border-red-600 bg-red-50/50 shadow-sm'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={active}
                        onChange={() => {}}
                        className="accent-red-600 w-4 h-4"
                      />
                      <span className="font-black text-sm text-zinc-900 font-display">
                        {pkg.tenGoi}
                      </span>
                    </div>
                    <span className="font-black text-base text-red-700 font-display">
                      {formatVND(pkg.giaUuDai)}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-600 pl-6">
                    Thêm +{pkg.thoiGianThem} / +{pkg.kmThem} vào hạn bảo hành xe
                  </div>

                  <div className="pl-6 space-y-1 text-[11px] text-zinc-500">
                    {pkg.quyenLoi.map((ql, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{ql}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-1">
          <div className="font-bold text-zinc-900">Lưu ý khi kích hoạt:</div>
          <div>• Hạn bảo hành mới sẽ được tự động cộng nối tiếp thời hạn hiện tại.</div>
          <div>• Cập nhật ngay lập tức vào Sổ bảo hành điện tử của phương tiện.</div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-red-700 hover:bg-red-800 disabled:bg-zinc-400 text-white transition shadow-md cursor-pointer flex items-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {submitting ? 'ĐANG KÍCH HOẠT...' : 'XÁC NHẬN GIA HẠN'}
          </button>
        </div>
      </div>
    </div>
  );
}
