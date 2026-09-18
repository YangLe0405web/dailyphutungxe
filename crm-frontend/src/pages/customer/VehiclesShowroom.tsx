import React, { useState } from 'react';
import { formatVND } from '../../data/mockData';

export interface ShowroomVehicle {
  id: string;
  tenXe: string;
  hang: string;
  phanKhuc: string;
  giaNiemYet: number;
  mauSac: string;
  moTa: string;
  hinhAnh?: string;
  coTheLaiThu: boolean;
  dongCo?: string;
  congSuat?: string;
}

export const showroomVehicles: ShowroomVehicle[] = [
  {
    id: 'XM001',
    tenXe: 'Honda SH 160i ABS 2025',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 95900000,
    mauSac: 'Đen mờ, Trắng bạc, Đỏ đen',
    moTa: 'Dòng xe tay ga cao cấp hàng đầu với phanh ABS 2 kênh, động cơ eSP+ 4 van thế hệ mới và khóa thông minh Smartkey.',
    coTheLaiThu: true,
    dongCo: '156.9cc eSP+ 4 van',
    congSuat: '16.6 HP / 8.500 rpm',
    hinhAnh: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM002',
    tenXe: 'Honda PCX 160 ABS',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 75900000,
    mauSac: 'Xanh mờ, Đỏ nhám, Đen tuyền',
    moTa: 'Tay ga thể thao Cruiser đường trường thoải mái, hộc chứa đồ 30L siêu rộng và cổng sạc USB tích hợp.',
    coTheLaiThu: true,
    dongCo: '156.9cc eSP+',
    congSuat: '15.8 HP / 8.500 rpm',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM003',
    tenXe: 'Yamaha Exciter 155 VVA',
    hang: 'Yamaha',
    phanKhuc: 'Côn tay',
    giaNiemYet: 56990000,
    mauSac: 'Xanh GP, Đỏ trắng, Đen nhám',
    moTa: 'Ông vua đường phố với công nghệ van biến thiên VVA, bộ ly hợp trượt hỗ trợ A&S và thiết kế khí động học YZF-R1.',
    coTheLaiThu: true,
    dongCo: '155cc VVA 4 thì',
    congSuat: '17.7 HP / 9.500 rpm',
    hinhAnh: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM004',
    tenXe: 'Honda Air Blade 160 ABS',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 56690000,
    mauSac: 'Đỏ đen, Xanh xám, Đen vàng',
    moTa: 'Thiết kế thể thao thon gọn, phanh ABS an toàn, khung xe eSAF thế hệ mới tăng độ ổn định.',
    coTheLaiThu: true,
    dongCo: '156.9cc eSP+',
    congSuat: '15.0 HP / 8.000 rpm',
    hinhAnh: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM005',
    tenXe: 'Yamaha Grande Hybrid',
    hang: 'Yamaha',
    phanKhuc: 'Tay ga',
    giaNiemYet: 58990000,
    mauSac: 'Hồng pastel, Xanh lam, Trắng ngọc',
    moTa: 'Động cơ trợ lực điện Hybrid siêu tiết kiệm nhiên liệu (1.66 lít/100km), kiểu dáng châu Âu thanh lịch.',
    coTheLaiThu: true,
    dongCo: '125cc Blue Core Hybrid',
    congSuat: '8.3 HP / 6.500 rpm',
    hinhAnh: 'https://images.unsplash.com/photo-1525160354320-d8e92641c563?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM006',
    tenXe: 'Honda Vision 110 Smartkey',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 33490000,
    mauSac: 'Đen bóng, Trắng ngọc, Xanh dương',
    moTa: 'Mẫu xe tay ga quốc dân với thiết kế thời trang, khối lượng nhẹ, vận hành linh hoạt trong đô thị.',
    coTheLaiThu: false,
    dongCo: '109.5cc eSP',
    congSuat: '8.8 HP / 7.500 rpm',
    hinhAnh: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM007',
    tenXe: 'Honda Wave Alpha 110',
    hang: 'Honda',
    phanKhuc: 'Xe số',
    giaNiemYet: 18790000,
    mauSac: 'Đỏ đen, Xanh đen, Trắng đen',
    moTa: 'Xe số bền bỉ theo thời gian, chi phí vận hành siêu rẻ và phụ tùng dễ thay thế.',
    coTheLaiThu: false,
    dongCo: '109.1cc 4 thì',
    congSuat: '8.2 HP / 7.500 rpm',
    hinhAnh: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM008',
    tenXe: 'Yamaha Janus 125 Smartkey',
    hang: 'Yamaha',
    phanKhuc: 'Tay ga',
    giaNiemYet: 30990000,
    mauSac: 'Tím pastel, Đỏ nhám, Trắng',
    moTa: 'Xe tay ga trẻ trung cho gen Z, trang bị hệ thống ngắt động cơ tạm thời Stop & Start System.',
    coTheLaiThu: false,
    dongCo: '125cc Blue Core',
    congSuat: '9.5 HP / 8.000 rpm',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80',
  },
];

interface Props {
  onBookTestDrive: (vehicleId: string) => void;
}

export default function VehiclesShowroom({ onBookTestDrive }: Props) {
  const [search, setSearch] = useState('');
  const [selectedHang, setSelectedHang] = useState<string>('ALL');
  const [selectedPhanKhuc, setSelectedPhanKhuc] = useState<string>('ALL');
  const [onlyTestDrive, setOnlyTestDrive] = useState<boolean>(false);
  const [detailVehicle, setDetailVehicle] = useState<ShowroomVehicle | null>(null);

  const filteredVehicles = showroomVehicles.filter(v => {
    const matchSearch = v.tenXe.toLowerCase().includes(search.toLowerCase()) || v.hang.toLowerCase().includes(search.toLowerCase());
    const matchHang = selectedHang === 'ALL' || v.hang === selectedHang;
    const matchPhanKhuc = selectedPhanKhuc === 'ALL' || v.phanKhuc === selectedPhanKhuc;
    const matchTestDrive = !onlyTestDrive || v.coTheLaiThu;
    return matchSearch && matchHang && matchPhanKhuc && matchTestDrive;
  });

  return (
    <div className="pb-16" style={{ background: 'var(--color-zinc-50)', minHeight: '100vh' }}>
      {/* ── Banner Header ── */}
      <div className="relative overflow-hidden py-12 px-6" style={{ background: 'var(--color-zinc-950)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 80% 20%, rgba(185,28,28,0.25) 0%, transparent 60%)',
        }} />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-700 mb-3"
              style={{ background: 'var(--color-red-900)', color: 'white', fontFamily: 'var(--font-mono)' }}>
              🔥 SHOWROOM XE MÁY CHÍNH HÃNG 2025
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, color: 'white', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              DÒNG XE NỔI BẬT & ĐĂNG KÝ LÁI THỬ
            </h1>
            <p className="mt-2 text-sm max-w-xl" style={{ color: 'var(--color-zinc-400)' }}>
              Trải nghiệm cảm giác lái chân thực các dòng xe mới nhất từ Honda, Yamaha, Suzuki. Đăng ký lái thử miễn phí ngay tại Showroom gần nhất!
            </p>
          </div>
          <div className="flex items-center gap-4 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
            <div className="text-center px-4">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--color-red-500)' }}>08+</div>
              <div className="text-xs" style={{ color: 'var(--color-zinc-400)' }}>Mẫu xe HOT</div>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="text-center px-4">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'white' }}>100%</div>
              <div className="text-xs" style={{ color: 'var(--color-zinc-400)' }}>Lái thử FREE</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters & Content Container ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-8 p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm mẫu xe, tên xe…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:border-red-600"
            />
            <svg className="absolute left-3.5 top-3 text-zinc-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Hãng */}
            <select
              value={selectedHang}
              onChange={e => setSelectedHang(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-zinc-300 text-sm bg-white focus:outline-none focus:border-red-600"
            >
              <option value="ALL">Tất cả hãng</option>
              <option value="Honda">Honda</option>
              <option value="Yamaha">Yamaha</option>
              <option value="Suzuki">Suzuki</option>
            </select>

            {/* Phân khúc */}
            <select
              value={selectedPhanKhuc}
              onChange={e => setSelectedPhanKhuc(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-zinc-300 text-sm bg-white focus:outline-none focus:border-red-600"
            >
              <option value="ALL">Tất cả phân khúc</option>
              <option value="Tay ga">Tay ga</option>
              <option value="Côn tay">Côn tay</option>
              <option value="Xe số">Xe số</option>
            </select>

            {/* Checkbox Chỉ xe có lái thử */}
            <label className="flex items-center gap-2 text-sm font-600 text-zinc-700 cursor-pointer px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition">
              <input
                type="checkbox"
                checked={onlyTestDrive}
                onChange={e => setOnlyTestDrive(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
              />
              <span>Chỉ xe có lái thử</span>
            </label>
          </div>
        </div>

        {/* ── Vehicle Grid ── */}
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200">
            <div className="text-4xl mb-3">🛵</div>
            <h3 className="text-lg font-bold text-zinc-800">Không tìm thấy mẫu xe phù hợp</h3>
            <p className="text-sm text-zinc-500 mt-1">Vui lòng thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVehicles.map(v => (
              <div key={v.id} className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                {/* Image & Badge */}
                <div className="relative h-48 bg-zinc-100 overflow-hidden flex items-center justify-center">
                  <img
                    src={v.hinhAnh}
                    alt={v.tenXe}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="px-2.5 py-1 rounded-md bg-zinc-900/80 backdrop-blur text-white text-xs font-700 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                      {v.hang}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    {v.coTheLaiThu ? (
                      <span className="px-2.5 py-1 rounded-full bg-red-700 text-white text-xs font-700 shadow-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                        ✓ Có thể lái thử
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-zinc-500 text-white text-xs font-700 shadow-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                        Không lái thử
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-600 text-zinc-500 mb-1">{v.phanKhuc}</div>
                    <h3 className="font-bold text-zinc-900 text-base leading-snug group-hover:text-red-700 transition-colors">
                      {v.tenXe}
                    </h3>
                    <div className="mt-2 text-lg font-800 text-red-700" style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatVND(v.giaNiemYet)}
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {v.moTa}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center gap-2">
                    <button
                      onClick={() => setDetailVehicle(v)}
                      className="flex-1 py-2 rounded-xl text-xs font-700 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 transition text-center"
                    >
                      Chi tiết
                    </button>
                    {v.coTheLaiThu && (
                      <button
                        onClick={() => onBookTestDrive(v.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-700 bg-red-700 text-white hover:bg-red-800 transition text-center shadow-sm"
                      >
                        Đăng ký lái thử →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {detailVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-zinc-200">
            <div className="relative h-56 bg-zinc-900">
              <img src={detailVehicle.hinhAnh} alt={detailVehicle.tenXe} className="w-full h-full object-cover opacity-90" />
              <button
                onClick={() => setDetailVehicle(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition text-lg"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <div className="text-xs font-700 text-red-400 uppercase tracking-wider mb-1">{detailVehicle.hang} • {detailVehicle.phanKhuc}</div>
                <h2 className="text-2xl font-bold">{detailVehicle.tenXe}</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100">
                <div>
                  <div className="text-xs text-zinc-400">Giá niêm yết chính hãng</div>
                  <div className="text-2xl font-800 text-red-700" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatVND(detailVehicle.giaNiemYet)}
                  </div>
                </div>
                <div>
                  {detailVehicle.coTheLaiThu ? (
                    <span className="px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-700">
                      ✓ Sẵn sàng xe lái thử
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-700">
                      Chưa hỗ trợ lái thử
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm text-zinc-600 mb-6">
                <div>
                  <span className="font-600 text-zinc-900">Màu sắc có sẵn: </span>
                  {detailVehicle.mauSac}
                </div>
                {detailVehicle.dongCo && (
                  <div>
                    <span className="font-600 text-zinc-900">Động cơ: </span>
                    {detailVehicle.dongCo} ({detailVehicle.congSuat})
                  </div>
                )}
                <div>
                  <span className="font-600 text-zinc-900">Mô tả chi tiết: </span>
                  <p className="mt-1 text-xs text-zinc-500 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                    {detailVehicle.moTa}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDetailVehicle(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-600 bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                >
                  Đóng
                </button>
                {detailVehicle.coTheLaiThu && (
                  <button
                    onClick={() => {
                      const id = detailVehicle.id;
                      setDetailVehicle(null);
                      onBookTestDrive(id);
                    }}
                    className="px-6 py-2.5 rounded-xl text-sm font-700 bg-red-700 text-white hover:bg-red-800 shadow-md"
                  >
                    Đăng ký lái thử ngay →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
