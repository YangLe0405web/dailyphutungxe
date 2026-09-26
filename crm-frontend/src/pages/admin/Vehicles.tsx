import React, { useState } from 'react';
import { formatVND } from '../../data/mockData';
import ImageUploader from '../../components/shared/ImageUploader';

interface Vehicle {
  id: string;
  tenXe: string;
  hang: string;
  phanKhuc: string;
  giaNiemYet: number;
  mauSac: string;
  moTa?: string;
  hinhAnh?: string;
  coTheLaiThu: boolean;
}

const initialVehicles: Vehicle[] = [
  {
    id: 'XM001',
    tenXe: 'Honda SH 160i ABS 2025',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 95900000,
    mauSac: 'Đen mờ, Đỏ đen, Xám xi măng, Trắng bạc',
    moTa: 'Flagship tay ga cao cấp của Honda với phanh ABS 2 kênh, động cơ 156.9cc eSP+ 4 van, Smart Key',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
  },
  {
    id: 'XM002',
    tenXe: 'Honda Air Blade 160 ABS',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 56690000,
    mauSac: 'Đỏ đen, Xanh xám, Đen vàng đồng',
    moTa: 'Tay ga thể thao mạnh mẽ, động cơ eSP+ 160cc, cốp rộng 23.2L tích hợp cổng sạc USB',
    hinhAnh: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
  },
  {
    id: 'XM003',
    tenXe: 'Honda Lead 125cc (Bản Đặc Biệt)',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 42790000,
    mauSac: 'Bạc nhám, Đen mờ, Trắng ngọc',
    moTa: 'Cốp xe siêu lớn 37L đựng 2 mũ bảo hiểm, cổng sạc USB, động cơ eSP+ 4 van êm ái',
    hinhAnh: 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
  },
  {
    id: 'XM004',
    tenXe: 'Honda Vision 110 Thể Thao',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 36612000,
    mauSac: 'Xám xi măng, Đen bóng, Xanh dương',
    moTa: 'Xe tay ga quốc dân nhỏ gọn thanh lịch, vành đúc 16 inch cao ráo, Smart Key, siêu tiết kiệm xăng',
    hinhAnh: 'https://images.unsplash.com/photo-1525160354320-d8e92641c563?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: false,
  },
  {
    id: 'XM005',
    tenXe: 'Honda Winner X 150 ABS',
    hang: 'Honda',
    phanKhuc: 'Côn tay',
    giaNiemYet: 50560000,
    mauSac: 'Đỏ đen xanh thể thao, Đen nhám bạc',
    moTa: 'Côn tay thể thao trang bị ly hợp chống trượt Assist & Slipper, xích phốt O-ring, phanh ABS trước',
    hinhAnh: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
  },
  {
    id: 'XM006',
    tenXe: 'Honda Wave Alpha 110 Cổ Điển',
    hang: 'Honda',
    phanKhuc: 'Xe số',
    giaNiemYet: 19290000,
    mauSac: 'Xám cổ điển, Vàng trắng, Đỏ đen',
    moTa: 'Xe số bền bỉ tiết kiệm nhiên liệu số 1, chi phí vận hành cực thấp, phụ tùng thay thế sẵn có',
    hinhAnh: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: false,
  },
  {
    id: 'XM007',
    tenXe: 'Yamaha Exciter 155 VVA ABS',
    hang: 'Yamaha',
    phanKhuc: 'Côn tay',
    giaNiemYet: 55000000,
    mauSac: 'Xanh GP Monster, Đen nhám, Đỏ bạc',
    moTa: 'Ông vua đường phố van biến thiên VVA 155cc, 4 bản đồ đánh lửa, phanh đĩa trước 2 piston có ABS',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
  },
  {
    id: 'XM008',
    tenXe: 'Yamaha Grande Hybrid Tiêu Chuẩn',
    hang: 'Yamaha',
    phanKhuc: 'Tay ga',
    giaNiemYet: 46047000,
    mauSac: 'Hồng pastel, Trắng ngọc trai, Đỏ mận',
    moTa: 'Tay ga tiết kiệm xăng số 1 Việt Nam (1.66L/100km), công nghệ trợ lực điện Blue Core Hybrid, cốp 27L',
    hinhAnh: 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
  },
  {
    id: 'XM009',
    tenXe: 'Yamaha NVX 155 VVA Maxi-Scooter',
    hang: 'Yamaha',
    phanKhuc: 'Tay ga',
    giaNiemYet: 55500000,
    mauSac: 'Đen vàng, Xám ánh xanh, Đỏ đen',
    moTa: 'Tay ga hầm hố lốp sau 140mm, giảm xóc dầu bình phụ thể thao, kết nối Y-Connect, phanh ABS',
    hinhAnh: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
  },
  {
    id: 'XM010',
    tenXe: 'Yamaha PG-1 115cc Scrambler',
    hang: 'Yamaha',
    phanKhuc: 'Xe số',
    giaNiemYet: 30437000,
    mauSac: 'Vàng sa mạc, Cam rực rỡ, Xanh rêu bụi',
    moTa: 'Phong cách Scrambler địa hình phượt bụi, lốp gai to đa dụng, ghi đông trần cá tính',
    hinhAnh: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
  },
  {
    id: 'XM011',
    tenXe: 'Yamaha MT-15 Naked Streetfighter',
    hang: 'Yamaha',
    phanKhuc: 'Côn tay',
    giaNiemYet: 69000000,
    mauSac: 'Xanh đen thể thao, Xám tem đỏ, Đen nhám',
    moTa: 'Naked bike 155cc VVA, phuộc Upside Down vàng thể thao, đèn pha LED thấu kính Transformer',
    hinhAnh: 'https://images.unsplash.com/photo-1558980359-a99ad4205530?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
  },
  {
    id: 'XM012',
    tenXe: 'Suzuki Raider R150 Fi (DOHC)',
    hang: 'Suzuki',
    phanKhuc: 'Côn tay',
    giaNiemYet: 51190000,
    mauSac: 'Đỏ đen, Xanh mờ MotoGP, Đen cam',
    moTa: 'Vua tốc độ DOHC 4 van két nước lớn, công suất 18.5 HP mạnh nhất phân khúc 150cc',
    hinhAnh: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
  },
  {
    id: 'XM013',
    tenXe: 'Suzuki Burgman Street 125',
    hang: 'Suzuki',
    phanKhuc: 'Tay ga',
    giaNiemYet: 48600000,
    mauSac: 'Đen mờ, Xám titan, Vàng đồng',
    moTa: 'Maxi-scooter sang trọng phong cách Châu Âu, sàn để chân rộng rãi, cổng sạc điện thoại tiện lợi',
    hinhAnh: 'https://images.unsplash.com/photo-1558981420-87aa9dad1c89?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: false,
  },
  {
    id: 'XM014',
    tenXe: 'Vespa Sprint S 150 TFT',
    hang: 'Piaggio',
    phanKhuc: 'Tay ga',
    giaNiemYet: 97800000,
    mauSac: 'Đen nhám, Đồng nhám, Trắng ánh kim',
    moTa: 'Khung thép liền khối kinh điển, màn hình TFT màu thông minh kết nối Vespa MIA, động cơ i-Get 150cc',
    hinhAnh: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
  },
];

const hangOptions = ['Honda', 'Yamaha', 'Suzuki', 'SYM', 'Piaggio'];
const phanKhucOptions = ['Xe số', 'Tay ga', 'Côn tay', 'Xe điện'];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([...initialVehicles]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [filterHang, setFilterHang] = useState('');
  const [filterSegment, setFilterSegment] = useState('');
  const [filterTestDrive, setFilterTestDrive] = useState<'All' | 'Yes' | 'No'>('All');
  const [filterPrice, setFilterPrice] = useState<'All' | 'Under30' | '30To60' | '60To90' | 'Above90'>('All');

  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<Partial<Vehicle>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = vehicles.filter(v => {
    // Search
    const matchSearch = !search.trim() || v.tenXe.toLowerCase().includes(search.toLowerCase()) || v.mauSac.toLowerCase().includes(search.toLowerCase());
    // Hang
    const matchHang = !filterHang || v.hang === filterHang;
    // Segment
    const matchSeg = !filterSegment || v.phanKhuc === filterSegment;
    // Test drive
    const matchTest = filterTestDrive === 'All' ? true : filterTestDrive === 'Yes' ? v.coTheLaiThu : !v.coTheLaiThu;
    // Price range
    const matchPrice = filterPrice === 'All'
      ? true
      : filterPrice === 'Under30'
      ? v.giaNiemYet < 30000000
      : filterPrice === '30To60'
      ? (v.giaNiemYet >= 30000000 && v.giaNiemYet <= 60000000)
      : filterPrice === '60To90'
      ? (v.giaNiemYet > 60000000 && v.giaNiemYet <= 90000000)
      : v.giaNiemYet > 90000000;

    return matchSearch && matchHang && matchSeg && matchTest && matchPrice;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pagedVehicles = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const validate = (data: Partial<Vehicle>) => {
    const err: Record<string, string> = {};
    if (!data.tenXe?.trim()) err.tenXe = 'Tên xe không được để trống';
    if (!data.hang?.trim()) err.hang = 'Hãng không được để trống';
    if (!data.phanKhuc?.trim()) err.phanKhuc = 'Phân khúc không được để trống';
    if (data.giaNiemYet == null || data.giaNiemYet <= 0) err.giaNiemYet = 'Giá niêm yết phải > 0';
    if (!data.mauSac?.trim()) err.mauSac = 'Màu sắc không được để trống';
    return err;
  };

  const handleSave = () => {
    const err = validate(form);
    if (Object.keys(err).length) {
      setErrors(err);
      return;
    }
    if (editVehicle) {
      setVehicles(prev =>
        prev.map(v => (v.id === editVehicle.id ? { ...editVehicle, ...form } as Vehicle : v))
      );
    } else {
      const newVehicle: Vehicle = {
        id: 'XM' + Date.now(),
        tenXe: form.tenXe!.trim(),
        hang: form.hang!.trim(),
        phanKhuc: form.phanKhuc!.trim(),
        giaNiemYet: Number(form.giaNiemYet),
        mauSac: form.mauSac!.trim(),
        moTa: form.moTa?.trim() ?? '',
        hinhAnh: form.hinhAnh?.trim() ?? '',
        coTheLaiThu: !!form.coTheLaiThu,
      };
      setVehicles(prev => [newVehicle, ...prev]);
    }
    setShowModal(false);
    setEditVehicle(null);
    setForm({});
    setErrors({});
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditVehicle(vehicle);
    setForm({ ...vehicle });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mẫu xe này?')) {
      setVehicles(prev => prev.filter(v => v.id !== id));
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold uppercase" style={{ fontFamily: 'var(--font-display)' }}>QUẢN LÝ XE MẪU SHOWROOM</h1>
          <p className="text-xs text-zinc-500 mt-1">Danh mục các dòng xe máy, phân khúc và cấu hình lái thử</p>
        </div>
        <button
          onClick={() => {
            setEditVehicle(null);
            setForm({});
            setShowModal(true);
          }}
          className="px-4 py-2 bg-red-700 text-white text-xs font-bold rounded-xl hover:bg-red-800 transition shadow"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          + THÊM XE MỚI
        </button>
      </div>

      {/* Multi-criteria filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 mb-5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-1 relative">
            <input
              type="text"
              placeholder="🔍 Tìm theo tên xe, màu..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={filterHang}
              onChange={e => { setFilterHang(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
            >
              <option value="">Hãng sản xuất: Tất cả</option>
              {hangOptions.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* Segment Filter */}
          <div>
            <select
              value={filterSegment}
              onChange={e => { setFilterSegment(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
            >
              <option value="">Phân khúc: Tất cả</option>
              {phanKhucOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Test Drive Filter */}
          <div>
            <select
              value={filterTestDrive}
              onChange={e => { setFilterTestDrive(e.target.value as any); setCurrentPage(1); }}
              className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
            >
              <option value="All">Lái thử: Tất cả</option>
              <option value="Yes">✅ Có thể lái thử</option>
              <option value="No">❌ Không cho lái thử</option>
            </select>
          </div>

          {/* Price Filter */}
          <div>
            <select
              value={filterPrice}
              onChange={e => { setFilterPrice(e.target.value as any); setCurrentPage(1); }}
              className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
            >
              <option value="All">Khoảng giá: Tất cả</option>
              <option value="Under30">Dưới 30 triệu</option>
              <option value="30To60">30 - 60 triệu</option>
              <option value="60To90">60 - 90 triệu</option>
              <option value="Above90">Trên 90 triệu</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs text-zinc-500">
          <div>
            Hiển thị <strong>{filtered.length}</strong> / {vehicles.length} xe mẫu
          </div>
          {(search || filterHang || filterSegment || filterTestDrive !== 'All' || filterPrice !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setFilterHang('');
                setFilterSegment('');
                setFilterTestDrive('All');
                setFilterPrice('All');
              }}
              className="text-red-700 font-bold hover:underline"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl border border-zinc-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-950 text-white font-mono text-xs uppercase">
            <tr>
              <th className="p-3 text-center">STT</th>
              <th className="p-3 text-center">Ảnh</th>
              <th className="p-3 text-left">Tên xe</th>
              <th className="p-3 text-left">Hãng</th>
              <th className="p-3 text-left">Phân khúc</th>
              <th className="p-3 text-right">Giá niêm yết</th>
              <th className="p-3 text-left">Màu sắc</th>
              <th className="p-3 text-center">Lái thử</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-zinc-500 text-xs">
                  Không tìm thấy xe mẫu nào phù hợp.
                </td>
              </tr>
            ) : (
              pagedVehicles.map((v, idx) => {
                const serialNum = (currentPage - 1) * pageSize + idx + 1;
                return (
                  <tr key={v.id} className="hover:bg-zinc-50 transition">
                    <td className="p-3 text-center font-mono text-xs text-zinc-500">{serialNum}</td>
                    <td className="p-3 text-center">
                      {v.hinhAnh ? (
                        <img src={v.hinhAnh} alt={v.tenXe} className="h-10 w-12 object-cover rounded-lg mx-auto border border-zinc-200" />
                      ) : (
                        <div className="h-10 w-12 bg-zinc-100 rounded-lg flex items-center justify-center text-[10px] text-zinc-400 mx-auto font-mono">N/A</div>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-zinc-900">{v.tenXe}</td>
                    <td className="p-3 font-mono text-xs text-zinc-600">{v.hang}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 font-mono">
                        {v.phanKhuc}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-xs font-bold text-red-700">{formatVND(v.giaNiemYet)}</td>
                    <td className="p-3 text-xs text-zinc-600">{v.mauSac}</td>
                    <td className="p-3 text-center">
                      {v.coTheLaiThu ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold font-mono">
                          ✓ Có lái thử
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-zinc-100 text-zinc-500 rounded-full text-xs font-medium font-mono">
                          Chưa hỗ trợ
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center space-x-1.5">
                      <button
                        onClick={() => handleEdit(v)}
                        className="px-2.5 py-1 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 cursor-pointer"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 cursor-pointer"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-white border-t border-zinc-200">
            <div className="text-xs text-zinc-500 font-mono">
              Hiển thị <strong>{(currentPage - 1) * pageSize + 1}</strong> - <strong>{Math.min(currentPage * pageSize, filtered.length)}</strong> trên tổng số <strong>{filtered.length}</strong> xe mẫu (Trang {currentPage}/{totalPages})
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 font-mono cursor-pointer"
              >
                « Đầu
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs rounded-lg border border-zinc-200 text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 font-mono cursor-pointer"
              >
                ‹ Trước
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 text-xs font-bold rounded-lg transition font-mono cursor-pointer ${
                    currentPage === i + 1
                      ? 'bg-red-700 text-white shadow-sm'
                      : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs rounded-lg border border-zinc-200 text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 font-mono cursor-pointer"
              >
                Tiếp ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 font-mono cursor-pointer"
              >
                Cuối »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-200">
              <h2 className="text-base font-extrabold uppercase text-zinc-900" style={{ fontFamily: 'var(--font-display)' }}>
                {editVehicle ? 'SỬA XE MẪU' : 'THÊM XE MẪU MỚI'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600 font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Tên xe *</label>
                <input
                  type="text"
                  value={form.tenXe ?? ''}
                  onChange={e => setForm({ ...form, tenXe: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                />
                {errors.tenXe && <p className="text-[11px] text-red-600 mt-0.5">{errors.tenXe}</p>}
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Hãng sản xuất *</label>
                <select
                  value={form.hang ?? ''}
                  onChange={e => setForm({ ...form, hang: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-semibold"
                >
                  <option value="">Chọn hãng</option>
                  {hangOptions.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                {errors.hang && <p className="text-[11px] text-red-600 mt-0.5">{errors.hang}</p>}
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Phân khúc *</label>
                <select
                  value={form.phanKhuc ?? ''}
                  onChange={e => setForm({ ...form, phanKhuc: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-semibold"
                >
                  <option value="">Chọn phân khúc</option>
                  {phanKhucOptions.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                {errors.phanKhuc && <p className="text-[11px] text-red-600 mt-0.5">{errors.phanKhuc}</p>}
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Giá niêm yết (VNĐ) *</label>
                <input
                  type="number"
                  min="0"
                  value={form.giaNiemYet ?? ''}
                  onChange={e => setForm({ ...form, giaNiemYet: Number(e.target.value) })}
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                />
                {errors.giaNiemYet && <p className="text-[11px] text-red-600 mt-0.5">{errors.giaNiemYet}</p>}
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-zinc-700 mb-1">Các phiên bản màu sắc *</label>
                <input
                  type="text"
                  placeholder="VD: Đen nhám, Trắng ngọc, Đỏ đen"
                  value={form.mauSac ?? ''}
                  onChange={e => setForm({ ...form, mauSac: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                />
                {errors.mauSac && <p className="text-[11px] text-red-600 mt-0.5">{errors.mauSac}</p>}
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-zinc-700 mb-1">Mô tả đặc điểm</label>
                <textarea
                  rows={2}
                  value={form.moTa ?? ''}
                  onChange={e => setForm({ ...form, moTa: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                />
              </div>
              <div className="col-span-2">
                <ImageUploader
                  value={form.hinhAnh ?? ''}
                  onChange={url => setForm({ ...form, hinhAnh: url })}
                  label="Hình ảnh xe mẫu"
                />
              </div>
              <div className="col-span-2 flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="coTheLaiThu"
                  checked={!!form.coTheLaiThu}
                  onChange={e => setForm({ ...form, coTheLaiThu: e.target.checked })}
                  className="w-4 h-4 accent-red-700"
                />
                <label htmlFor="coTheLaiThu" className="text-xs font-semibold text-zinc-800 cursor-pointer">
                  Cho phép khách hàng đăng ký LÁI THỬ xe này tại showroom
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-4 space-x-2 pt-3 border-t border-zinc-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 shadow"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
