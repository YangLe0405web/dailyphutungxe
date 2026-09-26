import { useState } from 'react';
import { formatVND } from '../../data/mockData';

export interface ShowroomVehicle {
  id: string;
  tenXe: string;
  hang: 'Honda' | 'Yamaha' | 'Suzuki' | 'Piaggio & Vespa';
  phanKhuc: 'Tay ga' | 'Côn tay' | 'Xe số' | 'Scrambler' | 'Hyper-underbone';
  giaNiemYet: number;
  mauSac: string;
  moTa: string;
  hinhAnh: string;
  coTheLaiThu: boolean;
  dongCo: string;
  congSuat: string;
  tieuHaoNhienLieu?: string;
  phanh?: string;
}

export const showroomVehicles: ShowroomVehicle[] = [
  // ── HONDA ──
  {
    id: 'XM-HD01',
    tenXe: 'Honda SH 160i ABS 2025',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 95900000,
    mauSac: 'Đen mờ, Đỏ đen, Xám xi măng, Trắng bạc',
    moTa: 'Mẫu xe tay ga cao cấp đầu bảng của Honda với phanh ABS 2 kênh, hệ thống kiểm soát lực kéo HSTC, chìa khóa thông minh Smartkey và kết nối Bluetooth My Honda+.',
    coTheLaiThu: true,
    dongCo: '156.9cc eSP+ 4 van',
    congSuat: '16.6 HP / 8.500 rpm',
    tieuHaoNhienLieu: '2.24 L/100km',
    phanh: 'Đĩa trước & sau, ABS 2 kênh',
    hinhAnh: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-HD02',
    tenXe: 'Honda Air Blade 160 ABS',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 56690000,
    mauSac: 'Đỏ đen, Xanh xám, Đen vàng đồng',
    moTa: 'Dòng xe tay ga thể thao bán chạy nhất Việt Nam, khung xe eSAF thế hệ mới, cốp xe 23.2L tích hợp cổng sạc USB và phanh ABS bánh trước.',
    coTheLaiThu: true,
    dongCo: '156.9cc eSP+ 4 van',
    congSuat: '15.0 HP / 8.000 rpm',
    tieuHaoNhienLieu: '2.30 L/100km',
    phanh: 'Đĩa trước có ABS, đùm sau',
    hinhAnh: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-HD03',
    tenXe: 'Honda Vision 110 Thể Thao',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 36612000,
    mauSac: 'Đen bóng, Xám xi măng, Xanh dương',
    moTa: '"Xe tay ga quốc dân" kiểu dáng trẻ trung năng động, vành đúc 16 inch cao ráo, khóa thông minh Smartkey và động cơ eSP siêu tiết kiệm xăng.',
    coTheLaiThu: false,
    dongCo: '109.5cc eSP 4 thì',
    congSuat: '8.8 HP / 7.500 rpm',
    tieuHaoNhienLieu: '1.85 L/100km',
    phanh: 'Đĩa trước CBS, tang trống sau',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-HD04',
    tenXe: 'Honda Winner X 150 ABS',
    hang: 'Honda',
    phanKhuc: 'Côn tay',
    giaNiemYet: 50560000,
    mauSac: 'Đỏ đen xanh thể thao, Đen nhám bạc',
    moTa: 'Côn tay thể thao thế hệ mới trang bị bộ ly hợp chống trượt hai chiều (Assist & Slipper Clutch), xích phốt O-ring và phanh ABS bánh trước an toàn tuyệt đối.',
    coTheLaiThu: true,
    dongCo: '149.1cc DOHC 6 số',
    congSuat: '15.4 HP / 9.000 rpm',
    tieuHaoNhienLieu: '1.98 L/100km',
    phanh: 'Đĩa trước có ABS, đĩa sau',
    hinhAnh: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-HD05',
    tenXe: 'Honda Wave Alpha 110 Cổ Điển',
    hang: 'Honda',
    phanKhuc: 'Xe số',
    giaNiemYet: 19290000,
    mauSac: 'Xám cổ điển, Vàng trắng, Đỏ đen',
    moTa: 'Mẫu xe số quốc dân bền bỉ qua năm tháng, chi phí vận hành siêu tiết kiệm và phụ tùng dễ thay thế ở mọi cung đường.',
    coTheLaiThu: false,
    dongCo: '109.1cc 4 thì làm mát gió',
    congSuat: '8.2 HP / 7.500 rpm',
    tieuHaoNhienLieu: '1.72 L/100km',
    phanh: 'Tang trống trước & sau',
    hinhAnh: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&auto=format&fit=crop&q=80',
  },

  // ── YAMAHA ──
  {
    id: 'XM-YM01',
    tenXe: 'Yamaha Exciter 155 VVA ABS',
    hang: 'Yamaha',
    phanKhuc: 'Côn tay',
    giaNiemYet: 55000000,
    mauSac: 'Xanh GP Monster, Đen nhám, Đỏ bạc',
    moTa: '"Ông vua đường phố" trang bị công nghệ van biến thiên VVA, 4 bản đồ đánh lửa tùy chỉnh theo từng cấp số, phanh đĩa trước 2 piston kèm ABS.',
    coTheLaiThu: true,
    dongCo: '155cc VVA SOHC 4 van',
    congSuat: '17.7 HP / 9.500 rpm',
    tieuHaoNhienLieu: '2.09 L/100km',
    phanh: 'Đĩa trước ABS 2 piston, đĩa sau',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-YM02',
    tenXe: 'Yamaha Grande Hybrid Tiêu Chuẩn',
    hang: 'Yamaha',
    phanKhuc: 'Tay ga',
    giaNiemYet: 46047000,
    mauSac: 'Hồng pastel, Trắng ngọc trai, Đỏ mận',
    moTa: 'Xe tay ga tiết kiệm nhiên liệu số 1 Việt Nam với công nghệ trợ lực điện Blue Core Hybrid, cốp xe 27L siêu lớn có đèn LED chiếu sáng bên trong.',
    coTheLaiThu: true,
    dongCo: '125cc Blue Core Hybrid',
    congSuat: '8.3 HP / 6.500 rpm',
    tieuHaoNhienLieu: '1.66 L/100km',
    phanh: 'Đĩa trước thủy lực, tang trống sau',
    hinhAnh: 'https://images.unsplash.com/photo-1525160354320-d8e92641c563?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-YM03',
    tenXe: 'Yamaha NVX 155 VVA Maxi-Scooter',
    hang: 'Yamaha',
    phanKhuc: 'Tay ga',
    giaNiemYet: 55500000,
    mauSac: 'Đen vàng, Xám ánh xanh, Đỏ đen',
    moTa: 'Tay ga thể thao phong cách Maxi-scooter hầm hố, lốp sau bản rộng 140mm bám đường, giảm xóc dầu bình phụ thể thao và kết nối điện thoại Y-Connect.',
    coTheLaiThu: true,
    dongCo: '155cc Blue Core VVA',
    congSuat: '15.4 HP / 8.000 rpm',
    tieuHaoNhienLieu: '2.17 L/100km',
    phanh: 'Đĩa trước có ABS, đùm sau',
    hinhAnh: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-YM04',
    tenXe: 'Yamaha PG-1 115cc Scrambler',
    hang: 'Yamaha',
    phanKhuc: 'Scrambler',
    giaNiemYet: 30437000,
    mauSac: 'Vàng sa mạc, Cam rực rỡ, Xanh rêu bụi',
    moTa: 'Mẫu xe số địa hình phong cách Scrambler ghi đông trần cá tính, lốp gai to đa dụng vượt mọi địa hình phượt dã ngoại của giới trẻ.',
    coTheLaiThu: true,
    dongCo: '113.7cc 4 thì SOHC',
    congSuat: '8.8 HP / 7.000 rpm',
    tieuHaoNhienLieu: '1.96 L/100km',
    phanh: 'Đĩa trước thủy lực, đùm sau',
    hinhAnh: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&auto=format&fit=crop&q=80',
  },

  // ── SUZUKI ──
  {
    id: 'XM-SZ01',
    tenXe: 'Suzuki Raider R150 Fi (DOHC)',
    hang: 'Suzuki',
    phanKhuc: 'Hyper-underbone',
    giaNiemYet: 51190000,
    mauSac: 'Đỏ đen, Xanh mờ MotoGP, Đen cam',
    moTa: '"Vua tốc độ" phân khúc 150cc với động cơ DOHC 4 van Twin-Cam công suất cực đại 18.5 HP mạnh nhất phân khúc, kiểu dáng Hyper-underbone thuần chất đường đua.',
    coTheLaiThu: true,
    dongCo: '147.3cc DOHC 4 van làm mát nước',
    congSuat: '18.5 HP / 10.000 rpm',
    tieuHaoNhienLieu: '2.40 L/100km',
    phanh: 'Đĩa trước & sau hình cánh hoa',
    hinhAnh: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-SZ02',
    tenXe: 'Suzuki Satria F150 Fi Nhập Khẩu',
    hang: 'Suzuki',
    phanKhuc: 'Hyper-underbone',
    giaNiemYet: 53490000,
    mauSac: 'Trắng đỏ thể thao, Xanh đen, Đen mờ',
    moTa: 'Nhập khẩu nguyên chiếc từ Suzuki Indonesia, trang bị hệ thống khởi động nhanh 1 chạm Suzuki Easy Start System và cụm đồng hồ LCD kỹ thuật số toàn phần.',
    coTheLaiThu: true,
    dongCo: '147.3cc DOHC Fi nguyên bản',
    congSuat: '18.5 HP / 10.000 rpm',
    tieuHaoNhienLieu: '2.42 L/100km',
    phanh: 'Đĩa trước & đĩa sau',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-SZ03',
    tenXe: 'Suzuki Burgman Street 125',
    hang: 'Suzuki',
    phanKhuc: 'Tay ga',
    giaNiemYet: 48600000,
    mauSac: 'Xám mờ thời thượng, Vàng đồng, Đen tuyền',
    moTa: 'Mẫu xe tay ga đường trường phong cách Maxi sang trọng đẳng cấp châu Âu, sàn để chân kép linh hoạt thay đổi tư thế ngồi lái thoải mái suốt hành trình.',
    coTheLaiThu: false,
    dongCo: '124.3cc SEP tiết kiệm nhiên liệu',
    congSuat: '8.7 HP / 6.750 rpm',
    tieuHaoNhienLieu: '1.96 L/100km',
    phanh: 'Đĩa trước kết hợp phanh CBS',
    hinhAnh: 'https://images.unsplash.com/photo-1525160354320-d8e92641c563?w=800&auto=format&fit=crop&q=80',
  },

  // ── PIAGGIO & VESPA ──
  {
    id: 'XM-VP01',
    tenXe: 'Vespa Sprint S 150 i-Get ABS',
    hang: 'Piaggio & Vespa',
    phanKhuc: 'Tay ga',
    giaNiemYet: 97800000,
    mauSac: 'Xám Titan, Vàng nhám, Trắng tuyết',
    moTa: 'Biểu tượng phong cách thời trang Ý huyền thoại với đèn pha LED lục giác góc cạnh, thân xe bằng thép liền khối dập nổi tinh xảo và phanh ABS chống trượt.',
    coTheLaiThu: true,
    dongCo: '155cc i-Get 3 van phun xăng điện tử',
    congSuat: '12.7 HP / 7.750 rpm',
    tieuHaoNhienLieu: '2.60 L/100km',
    phanh: 'Đĩa trước có phanh ABS, đùm sau',
    hinhAnh: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-VP02',
    tenXe: 'Piaggio Liberty 125 S ABS',
    hang: 'Piaggio & Vespa',
    phanKhuc: 'Tay ga',
    giaNiemYet: 57700000,
    mauSac: 'Đỏ bóng thể thao, Trắng bóng, Xám xi măng',
    moTa: 'Tay ga bánh lớn 16 inch an toàn vượt trội trên đường đô thị, động cơ i-Get êm ái cùng hệ thống khóa từ chống trộm Piaggio Immobilizer bảo mật tuyệt đối.',
    coTheLaiThu: true,
    dongCo: '124.5cc i-Get 3 van',
    congSuat: '10.2 HP / 7.500 rpm',
    tieuHaoNhienLieu: '2.38 L/100km',
    phanh: 'Đĩa trước ABS 240mm, đùm sau',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
  },
];

interface Props {
  onBookTestDrive: (vehicleId: string) => void;
}

const brandMeta: Record<string, { label: string; color: string; bg: string; badge: string }> = {
  Honda: { label: 'Honda', color: '#dc2626', bg: '#fef2f2', badge: '🔴 Honda' },
  Yamaha: { label: 'Yamaha', color: '#2563eb', bg: '#eff6ff', badge: '🔵 Yamaha' },
  Suzuki: { label: 'Suzuki', color: '#d97706', bg: '#fffbeb', badge: '🟡 Suzuki' },
  'Piaggio & Vespa': { label: 'Piaggio & Vespa', color: '#059669', bg: '#ecfdf5', badge: '🟢 Vespa Ý' },
};

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
              DÒNG XE CHÍNH HÃNG & ĐĂNG KÝ LÁI THỬ
            </h1>
            <p className="mt-2 text-sm max-w-2xl text-zinc-400">
              Khám phá danh mục xe máy chính hãng được phân chia theo từng thương hiệu hàng đầu: 
              <strong> Honda, Yamaha, Suzuki, Piaggio & Vespa</strong>. Giá niêm yết chuẩn thị trường, hỗ trợ đăng ký lái thử miễn phí!
            </p>
          </div>
          <div className="flex items-center gap-4 bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 shrink-0">
            <div className="text-center px-4">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--color-red-500)' }}>14+</div>
              <div className="text-xs text-zinc-400">Mẫu xe 2025</div>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="text-center px-4">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'white' }}>4 HÃNG</div>
              <div className="text-xs text-zinc-400">Chính hãng</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Brand Selection Tabs ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedHang('ALL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 cursor-pointer ${
              selectedHang === 'ALL'
                ? 'bg-zinc-950 text-white shadow-sm'
                : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            <span>🏍️</span> Tất cả các hãng ({showroomVehicles.length})
          </button>

          {(['Honda', 'Yamaha', 'Suzuki', 'Piaggio & Vespa'] as const).map(b => {
            const count = showroomVehicles.filter(v => v.hang === b).length;
            const meta = brandMeta[b];
            const isSelected = selectedHang === b;

            return (
              <button
                key={b}
                onClick={() => setSelectedHang(b)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'border-transparent text-white shadow-sm'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
                style={{
                  background: isSelected ? meta.color : undefined,
                }}
              >
                <span>{meta.badge}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filters & Search Container ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-8 p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="🔍 Tìm theo tên xe, dòng xe, thông số..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Phân khúc */}
            <select
              value={selectedPhanKhuc}
              onChange={e => setSelectedPhanKhuc(e.target.value)}
              className="px-3 py-2 rounded-xl border border-zinc-300 text-xs font-medium bg-white focus:outline-none focus:border-red-600"
            >
              <option value="ALL">Tất cả phân khúc</option>
              <option value="Tay ga">Xe Tay ga</option>
              <option value="Côn tay">Xe Côn tay</option>
              <option value="Xe số">Xe Số phổ thông</option>
              <option value="Scrambler">Dòng Scrambler phượt</option>
              <option value="Hyper-underbone">Hyper-underbone tốc độ</option>
            </select>

            {/* Checkbox Lái thử */}
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-50 hover:bg-zinc-100 px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700">
              <input
                type="checkbox"
                checked={onlyTestDrive}
                onChange={e => setOnlyTestDrive(e.target.checked)}
                className="w-4 h-4 text-red-700 rounded-sm focus:ring-red-600 accent-red-700"
              />
              <span>Chỉ xem xe có Lái thử</span>
            </label>

            {(search || selectedHang !== 'ALL' || selectedPhanKhuc !== 'ALL' || onlyTestDrive) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedHang('ALL');
                  setSelectedPhanKhuc('ALL');
                  setOnlyTestDrive(false);
                }}
                className="text-xs text-red-700 font-bold hover:underline cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* ── Vehicle Cards Grid ── */}
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
            <div className="text-4xl mb-3">🏍️</div>
            <div className="text-lg font-bold text-zinc-800">Không tìm thấy mẫu xe nào phù hợp</div>
            <p className="text-xs text-zinc-500 mt-1">Vui lòng thử chọn lại hãng xe hoặc từ khóa tìm kiếm khác</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map(v => {
              const meta = brandMeta[v.hang] || { color: '#dc2626', bg: '#fef2f2', badge: v.hang };
              return (
                <div
                  key={v.id}
                  className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Image container */}
                  <div className="relative h-52 bg-zinc-950 overflow-hidden">
                    <img
                      src={v.hinhAnh}
                      alt={v.tenXe}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                    {/* Brand Pill */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-extrabold font-mono shadow"
                        style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}40` }}
                      >
                        {v.hang}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-zinc-900/90 text-zinc-200 border border-zinc-700 shadow">
                        {v.phanKhuc}
                      </span>
                    </div>

                    {/* Test Drive badge */}
                    {v.coTheLaiThu && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow">
                        ✓ Có xe lái thử
                      </span>
                    )}

                    {/* Price bottom overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-mono text-zinc-300 font-bold">Giá niêm yết chính hãng</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '0.02em', lineHeight: 1 }}>
                          {formatVND(v.giaNiemYet)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-extrabold text-base text-zinc-900 group-hover:text-red-700 transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                        {v.tenXe}
                      </h3>
                      <p className="text-xs text-zinc-600 line-clamp-2 mt-1.5 leading-relaxed">
                        {v.moTa}
                      </p>

                      {/* Specs pills */}
                      <div className="mt-3 pt-3 border-t border-zinc-100 grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                          <span className="text-zinc-400 block text-[9px] uppercase font-bold">Động cơ</span>
                          <span className="font-semibold text-zinc-800">{v.dongCo}</span>
                        </div>
                        <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                          <span className="text-zinc-400 block text-[9px] uppercase font-bold">Công suất</span>
                          <span className="font-semibold text-zinc-800">{v.congSuat}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-zinc-500 font-mono">
                        <span className="text-zinc-400">Màu sắc: </span>
                        <span>{v.mauSac}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => setDetailVehicle(v)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold border border-zinc-300 text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
                      >
                        Thông số kỹ thuật
                      </button>
                      {v.coTheLaiThu ? (
                        <button
                          onClick={() => onBookTestDrive(v.id)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition cursor-pointer shadow-sm flex items-center justify-center gap-1"
                        >
                          <span>🏍️</span> Lái thử ngay
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 py-2 rounded-xl text-xs font-medium bg-zinc-100 text-zinc-400 cursor-not-allowed"
                        >
                          Chưa có xe mẫu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail Specifications Modal ── */}
      {detailVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-zinc-200 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-red-50 text-red-700 border border-red-200">
                  {detailVehicle.hang} · {detailVehicle.phanKhuc}
                </span>
                <h3 className="font-extrabold text-lg text-zinc-900 mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {detailVehicle.tenXe}
                </h3>
              </div>
              <button
                onClick={() => setDetailVehicle(null)}
                className="text-zinc-400 hover:text-zinc-700 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden h-48 bg-zinc-950">
              <img src={detailVehicle.hinhAnh} alt={detailVehicle.tenXe} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500 font-mono">Giá niêm yết hãng:</span>
                <strong className="text-red-700 text-sm font-bold font-display">{formatVND(detailVehicle.giaNiemYet)}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500 font-mono">Động cơ:</span>
                <strong className="text-zinc-900 font-mono">{detailVehicle.dongCo}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500 font-mono">Công suất tối đa:</span>
                <strong className="text-zinc-900 font-mono">{detailVehicle.congSuat}</strong>
              </div>
              {detailVehicle.tieuHaoNhienLieu && (
                <div className="flex justify-between py-1.5 border-b border-zinc-100">
                  <span className="text-zinc-500 font-mono">Tiêu thụ nhiên liệu:</span>
                  <strong className="text-emerald-700 font-mono">{detailVehicle.tieuHaoNhienLieu}</strong>
                </div>
              )}
              {detailVehicle.phanh && (
                <div className="flex justify-between py-1.5 border-b border-zinc-100">
                  <span className="text-zinc-500 font-mono">Hệ thống phanh:</span>
                  <strong className="text-zinc-900 font-mono">{detailVehicle.phanh}</strong>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500 font-mono">Màu sắc phân phối:</span>
                <strong className="text-zinc-900">{detailVehicle.mauSac}</strong>
              </div>
              <div className="pt-1">
                <span className="text-zinc-500 font-mono block mb-1">Mô tả chi tiết:</span>
                <p className="text-zinc-700 bg-zinc-50 p-3 rounded-xl border border-zinc-100 leading-relaxed">
                  {detailVehicle.moTa}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
              <button
                onClick={() => setDetailVehicle(null)}
                className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200 cursor-pointer"
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
                  className="px-5 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 shadow cursor-pointer flex items-center gap-1.5"
                >
                  <span>🏍️</span> Đăng ký Lái thử xe này
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
