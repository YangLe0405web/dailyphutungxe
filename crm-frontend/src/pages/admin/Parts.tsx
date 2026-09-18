import React, { useState } from 'react';
import { mockParts, formatVND, Part } from '../../data/mockData';
import ImageUploader from '../../components/shared/ImageUploader';

const categoryOptions = ['Nhớt', 'Lọc', 'Phanh', 'Bugi', 'Đèn', 'Lốp xe', 'Phụ kiện', 'Trang trí', 'Truyền động', 'Thân máy'];

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([...mockParts]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStock, setFilterStock] = useState<'All' | 'InStock' | 'LowStock' | 'OutOfStock'>('All');
  const [filterDiscount, setFilterDiscount] = useState<'All' | 'Discounted' | 'Regular'>('All');

  const [showModal, setShowModal] = useState(false);
  const [editPart, setEditPart] = useState<Part | null>(null);
  const [form, setForm] = useState<Partial<Part>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Unique brand list
  const brandOptions = Array.from(new Set(parts.map(p => p.thuongHieu))).sort();

  const filtered = parts.filter(p => {
    // Search
    const matchSearch = !search.trim() || p.tenSanPham.toLowerCase().includes(search.toLowerCase()) || p.thuongHieu.toLowerCase().includes(search.toLowerCase());
    // Category
    const matchCat = !filterCat || p.danhMuc === filterCat;
    // Brand
    const matchBrand = !filterBrand || p.thuongHieu === filterBrand;
    // Stock
    const matchStock = filterStock === 'All'
      ? true
      : filterStock === 'InStock'
      ? p.soLuongTon >= 20
      : filterStock === 'LowStock'
      ? p.soLuongTon > 0 && p.soLuongTon < 20
      : p.soLuongTon === 0;
    // Discount
    const matchDiscount = filterDiscount === 'All'
      ? true
      : filterDiscount === 'Discounted'
      ? (p.giaKhuyenMai !== null && p.giaKhuyenMai < p.giaGoc)
      : p.giaKhuyenMai === null;

    return matchSearch && matchCat && matchBrand && matchStock && matchDiscount;
  });

  const validate = (data: Partial<Part>) => {
    const err: Record<string, string> = {};
    if (!data.tenSanPham?.trim()) err.tenSanPham = 'Tên sản phẩm không được để trống';
    if (!data.thuongHieu?.trim()) err.thuongHieu = 'Thương hiệu không được để trống';
    if (!data.danhMuc) err.danhMuc = 'Vui lòng chọn danh mục';
    if (data.giaGoc == null || data.giaGoc <= 0) err.giaGoc = 'Giá gốc phải > 0';
    if (data.giaKhuyenMai != null && data.giaKhuyenMai <= 0) err.giaKhuyenMai = 'Giá khuyến mãi phải > 0';
    if (data.soLuongTon == null || data.soLuongTon < 0) err.soLuongTon = 'Số lượng tồn không được âm';
    if (!data.hinhAnh?.trim()) err.hinhAnh = 'Hình ảnh không được để trống';
    return err;
  };

  const handleSave = () => {
    const err = validate(form);
    if (Object.keys(err).length) {
      setErrors(err);
      return;
    }
    if (editPart) {
      setParts(prev => prev.map(p => (p.id === editPart.id ? { ...editPart, ...form } as Part : p)));
    } else {
      const newPart: Part = {
        id: 'PT' + Date.now(),
        tenSanPham: form.tenSanPham!.trim(),
        thuongHieu: form.thuongHieu!.trim(),
        danhMuc: form.danhMuc!,
        giaGoc: Number(form.giaGoc),
        giaKhuyenMai: form.giaKhuyenMai ? Number(form.giaKhuyenMai) : null,
        soLuongTon: Number(form.soLuongTon),
        moTa: form.moTa?.trim() ?? '',
        hinhAnh: form.hinhAnh!.trim(),
        rating: 5,
        luotDanh: 0,
      };
      setParts(prev => [newPart, ...prev]);
    }
    setShowModal(false);
    setEditPart(null);
    setForm({});
    setErrors({});
  };

  const handleEdit = (part: Part) => {
    setEditPart(part);
    setForm({ ...part });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phụ tùng này?')) {
      setParts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold uppercase" style={{ fontFamily: 'var(--font-display)' }}>QUẢN LÝ PHỤ TÙNG & PHỤ KIỆN</h1>
          <p className="text-xs text-zinc-500 mt-1">Danh mục sản phẩm, tồn kho và khuyến mãi</p>
        </div>
        <button
          onClick={() => {
            setEditPart(null);
            setForm({});
            setShowModal(true);
          }}
          className="px-4 py-2 bg-red-700 text-white text-xs font-bold rounded-xl hover:bg-red-800 transition shadow"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          + THÊM PHỤ TÙNG MỚI
        </button>
      </div>

      {/* Multi-criteria filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 mb-5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-1 relative">
            <input
              type="text"
              placeholder="🔍 Tìm tên, thương hiệu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
            >
              <option value="">Danh mục: Tất cả</option>
              {categoryOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={filterBrand}
              onChange={e => setFilterBrand(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
            >
              <option value="">Thương hiệu: Tất cả</option>
              {brandOptions.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Stock Level Filter */}
          <div>
            <select
              value={filterStock}
              onChange={e => setFilterStock(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
            >
              <option value="All">Tồn kho: Tất cả</option>
              <option value="InStock">Còn hàng (≥ 20)</option>
              <option value="LowStock">Sắp hết (&lt; 20)</option>
              <option value="OutOfStock">Hết hàng (0)</option>
            </select>
          </div>

          {/* Discount Filter */}
          <div>
            <select
              value={filterDiscount}
              onChange={e => setFilterDiscount(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
            >
              <option value="All">Khuyến mãi: Tất cả</option>
              <option value="Discounted">🔥 Có khuyến mãi</option>
              <option value="Regular">Giá thường</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs text-zinc-500">
          <div>
            Hiển thị <strong>{filtered.length}</strong> / {parts.length} sản phẩm
          </div>
          {(search || filterCat || filterBrand || filterStock !== 'All' || filterDiscount !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setFilterCat('');
                setFilterBrand('');
                setFilterStock('All');
                setFilterDiscount('All');
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
              <th className="p-3 text-left">Tên sản phẩm</th>
              <th className="p-3 text-left">Thương hiệu</th>
              <th className="p-3 text-left">Danh mục</th>
              <th className="p-3 text-right">Giá gốc</th>
              <th className="p-3 text-right">Giá KM</th>
              <th className="p-3 text-center">Tồn kho</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-zinc-500 text-xs">
                  Không tìm thấy sản phẩm phụ tùng nào phù hợp.
                </td>
              </tr>
            ) : (
              filtered.map((p, idx) => (
                <tr key={p.id} className="hover:bg-zinc-50 transition">
                  <td className="p-3 text-center font-mono text-xs text-zinc-500">{idx + 1}</td>
                  <td className="p-3 text-center">
                    <img src={p.hinhAnh} alt={p.tenSanPham} className="h-10 w-10 object-cover rounded-lg mx-auto border border-zinc-200" />
                  </td>
                  <td className="p-3 font-semibold text-zinc-900">{p.tenSanPham}</td>
                  <td className="p-3 font-mono text-xs text-zinc-600">{p.thuongHieu}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 font-mono">
                      {p.danhMuc}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-xs text-zinc-600">{formatVND(p.giaGoc)}</td>
                  <td className="p-3 text-right font-mono text-xs font-bold text-red-700">
                    {p.giaKhuyenMai ? formatVND(p.giaKhuyenMai) : '-'}
                  </td>
                  <td className="p-3 text-center font-mono text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${p.soLuongTon < 20 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {p.soLuongTon}
                    </span>
                  </td>
                  <td className="p-3 text-center space-x-1.5">
                    <button
                      onClick={() => handleEdit(p)}
                      className="px-2.5 py-1 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
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
                {editPart ? 'SỬA PHỤ TÙNG' : 'THÊM PHỤ TÙNG MỚI'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600 font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Tên sản phẩm *</label>
                <input
                  type="text"
                  value={form.tenSanPham ?? ''}
                  onChange={e => setForm({ ...form, tenSanPham: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                />
                {errors.tenSanPham && <p className="text-[11px] text-red-600 mt-0.5">{errors.tenSanPham}</p>}
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Thương hiệu *</label>
                <input
                  type="text"
                  value={form.thuongHieu ?? ''}
                  onChange={e => setForm({ ...form, thuongHieu: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                />
                {errors.thuongHieu && <p className="text-[11px] text-red-600 mt-0.5">{errors.thuongHieu}</p>}
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Danh mục *</label>
                <select
                  value={form.danhMuc ?? ''}
                  onChange={e => setForm({ ...form, danhMuc: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-semibold"
                >
                  <option value="">Chọn danh mục</option>
                  {categoryOptions.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.danhMuc && <p className="text-[11px] text-red-600 mt-0.5">{errors.danhMuc}</p>}
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Giá gốc (VNĐ) *</label>
                <input
                  type="number"
                  min="0"
                  value={form.giaGoc ?? ''}
                  onChange={e => setForm({ ...form, giaGoc: Number(e.target.value) })}
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                />
                {errors.giaGoc && <p className="text-[11px] text-red-600 mt-0.5">{errors.giaGoc}</p>}
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Giá khuyến mãi (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  value={form.giaKhuyenMai ?? ''}
                  onChange={e => setForm({ ...form, giaKhuyenMai: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                />
                {errors.giaKhuyenMai && <p className="text-[11px] text-red-600 mt-0.5">{errors.giaKhuyenMai}</p>}
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Số lượng tồn kho *</label>
                <input
                  type="number"
                  min="0"
                  value={form.soLuongTon ?? ''}
                  onChange={e => setForm({ ...form, soLuongTon: Number(e.target.value) })}
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                />
                {errors.soLuongTon && <p className="text-[11px] text-red-600 mt-0.5">{errors.soLuongTon}</p>}
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-zinc-700 mb-1">Mô tả sản phẩm</label>
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
                  label="Hình ảnh phụ tùng / phụ kiện"
                  error={errors.hinhAnh}
                />
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
