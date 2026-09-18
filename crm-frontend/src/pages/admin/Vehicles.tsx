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
    tenXe: 'Honda SH 160i ABS',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 95900000,
    mauSac: 'Đen mờ, Trắng bạc, Đỏ đen',
    moTa: 'Flagship tay ga cao cấp',
    hinhAnh: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&h=300&fit=crop&auto=format',
    coTheLaiThu: true,
  },
  {
    id: 'XM002',
    tenXe: 'Honda PCX 160 ABS',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 75900000,
    mauSac: 'Xanh, Đỏ, Đen',
    moTa: 'Tay ga thể thao tiết kiệm',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=300&fit=crop&auto=format',
    coTheLaiThu: true,
  },
  {
    id: 'XM003',
    tenXe: 'Yamaha Exciter 155 VVA',
    hang: 'Yamaha',
    phanKhuc: 'Côn tay',
    giaNiemYet: 56990000,
    mauSac: 'Xanh đen, Đỏ trắng',
    moTa: 'Côn tay thể thao VVA',
    hinhAnh: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&h=300&fit=crop&auto=format',
    coTheLaiThu: true,
  },
  {
    id: 'XM004',
    tenXe: 'Honda Air Blade 125 Smart',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 50490000,
    mauSac: 'Đỏ, Xanh, Đen',
    moTa: 'Tay ga phổ thông cao cấp',
    hinhAnh: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=400&h=300&fit=crop&auto=format',
    coTheLaiThu: true,
  },
  {
    id: 'XM005',
    tenXe: 'Yamaha Grande Hybrid',
    hang: 'Yamaha',
    phanKhuc: 'Tay ga',
    giaNiemYet: 58990000,
    mauSac: 'Hồng, Xanh lam, Trắng',
    moTa: 'Hybrid Smart Motor Generator',
    hinhAnh: 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=400&h=300&fit=crop&auto=format',
    coTheLaiThu: true,
  },
  {
    id: 'XM006',
    tenXe: 'Honda Vision 110 Smart',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 33490000,
    mauSac: 'Đen bóng, Trắng ngọc',
    moTa: 'Tay ga phổ thông thanh lịch',
    hinhAnh: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=400&h=300&fit=crop&auto=format',
    coTheLaiThu: false,
  },
  {
    id: 'XM007',
    tenXe: 'Honda Wave Alpha 110',
    hang: 'Honda',
    phanKhuc: 'Xe số',
    giaNiemYet: 18790000,
    mauSac: 'Đỏ đen, Xanh đen',
    moTa: 'Xe số phổ thông bền bỉ',
    hinhAnh: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=400&h=300&fit=crop&auto=format',
    coTheLaiThu: false,
  },
  {
    id: 'XM008',
    tenXe: 'Yamaha Janus 125',
    hang: 'Yamaha',
    phanKhuc: 'Tay ga',
    giaNiemYet: 30990000,
    mauSac: 'Tím, Hồng, Trắng',
    moTa: 'Tay ga thiết kế nữ tính',
    hinhAnh: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&h=300&fit=crop&auto=format',
    coTheLaiThu: false,
  },
];

const hangOptions = ['Honda', 'Yamaha', 'Suzuki', 'SYM', 'Piaggio'];
const phanKhucOptions = ['Xe số', 'Tay ga', 'Côn tay', 'Xe điện'];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([...initialVehicles]);
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
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={filterHang}
              onChange={e => setFilterHang(e.target.value)}
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
              onChange={e => setFilterSegment(e.target.value)}
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
              onChange={e => setFilterTestDrive(e.target.value as any)}
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
              onChange={e => setFilterPrice(e.target.value as any)}
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
              filtered.map((v, idx) => (
                <tr key={v.id} className="hover:bg-zinc-50 transition">
                  <td className="p-3 text-center font-mono text-xs text-zinc-500">{idx + 1}</td>
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
                      className="px-2.5 py-1 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
