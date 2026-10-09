import React, { useState, useEffect, useMemo } from 'react';
import { formatVND, Part } from '../../data/mockData';
import { partApi, promotionApi } from '../../services/api';
import ImageUploader from '../../components/shared/ImageUploader';

// Danh mục chuẩn hóa
const CATEGORY_OPTIONS = ['Nhớt', 'Lọc', 'Phanh', 'Bugi', 'Đèn', 'Lốp xe', 'Phụ kiện', 'Trang trí', 'Truyền động', 'Thân máy'];

// PT06: Danh sách Nhà cung cấp chuẩn hóa
const SUPPLIER_OPTIONS = [
  'Honda Việt Nam',
  'Yamaha Motor Việt Nam',
  'Motul Asia Pacific',
  'Michelin Việt Nam',
  'NGK Spark Plugs VN',
  'Bando Chemical Industries',
  'Castrol BP Petco',
  'Brembo SpA Italy',
  'RCB Racing Boy',
  'Công ty Phụ Tùng Xe Máy Thành Đạt',
  'Công ty TNHH Linh Kiện Tân Phát',
];

// PT07: Thuộc tính sản phẩm chuyển sang Dropdown chuẩn hóa
const BRAND_OPTIONS = ['Honda', 'Yamaha', 'Motul', 'Michelin', 'NGK', 'Brembo', 'Castrol', 'Bando', 'RCB', 'Shinko', 'Koso', 'Chính hãng khác'];

const VEHICLE_OPTIONS = [
  'Dùng chung cho nhiều dòng xe',
  'Honda SH 125i/150i/160i',
  'Honda Air Blade 125/160',
  'Honda Vision 110',
  'Honda Lead 125',
  'Honda Winner X 150',
  'Honda Wave Alpha / RSX',
  'Yamaha Exciter 150/155 VVA',
  'Yamaha Grande Hybrid',
  'Yamaha NVX 155',
  'Yamaha Sirius 110',
  'Xe tay ga cao cấp',
  'Xe côn tay thể thao',
  'Xe số phổ thông',
];

const ORIGIN_OPTIONS = [
  'Việt Nam',
  'Nhật Bản',
  'Thái Lan',
  'Indonesia',
  'Pháp',
  'Ý',
  'Đức',
  'Đài Loan',
  'Malaysia',
  'Mỹ',
];

const WARRANTY_OPTIONS = [
  'Không bảo hành',
  '1 tháng',
  '3 tháng',
  '6 tháng',
  '12 tháng (1 năm)',
  '24 tháng (2 năm)',
  '36 tháng (3 năm)',
  '5.000 km',
  '10.000 km',
  '20.000 km',
];

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>(() => partApi.getAllSync());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync data
  const reloadParts = () => {
    setParts(partApi.getAllSync());
  };

  useEffect(() => {
    reloadParts();
    const handleRefresh = () => reloadParts();
    window.addEventListener('crm-data-refresh', handleRefresh);
    return () => window.removeEventListener('crm-data-refresh', handleRefresh);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStock, setFilterStock] = useState<'All' | 'InStock' | 'LowStock' | 'OutOfStock'>('All');
  const [filterVisibility, setFilterVisibility] = useState<'All' | 'Hien' | 'An'>('All');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editPart, setEditPart] = useState<Part | null>(null);
  const [detailPart, setDetailPart] = useState<Part | null>(null);

  // Form State
  const [form, setForm] = useState<Partial<Part>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // PT11: Thống kê KPI Cards đầu trang
  const stats = useMemo(() => {
    const total = parts.length;
    const activeSelling = parts.filter(p => p.trangThaiHienThi !== 'An').length;
    const lowStock = parts.filter(p => p.soLuongTon > 0 && p.soLuongTon <= 10).length; // PT10: <= 10
    const outOfStock = parts.filter(p => p.soLuongTon === 0).length;
    return { total, activeSelling, lowStock, outOfStock };
  }, [parts]);

  // Filtered Parts
  const filtered = useMemo(() => {
    return parts.filter(p => {
      // Search by ID, Name, Brand, Supplier
      const matchSearch =
        !search.trim() ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.tenSanPham.toLowerCase().includes(search.toLowerCase()) ||
        p.thuongHieu.toLowerCase().includes(search.toLowerCase()) ||
        (p.nhaCungCap && p.nhaCungCap.toLowerCase().includes(search.toLowerCase()));

      const matchCat = !filterCat || p.danhMuc === filterCat;
      const matchBrand = !filterBrand || p.thuongHieu === filterBrand;
      const matchSupplier = !filterSupplier || p.nhaCungCap === filterSupplier;

      // PT10: LowStock <= 10
      const matchStock =
        filterStock === 'All'
          ? true
          : filterStock === 'InStock'
          ? p.soLuongTon > 10
          : filterStock === 'LowStock'
          ? p.soLuongTon > 0 && p.soLuongTon <= 10
          : p.soLuongTon === 0;

      // PT12: Filter visibility
      const matchVisibility =
        filterVisibility === 'All'
          ? true
          : filterVisibility === 'Hien'
          ? p.trangThaiHienThi !== 'An'
          : p.trangThaiHienThi === 'An';

      return matchSearch && matchCat && matchBrand && matchSupplier && matchStock && matchVisibility;
    });
  }, [parts, search, filterCat, filterBrand, filterSupplier, filterStock, filterVisibility]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pagedParts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCat, filterBrand, filterSupplier, filterStock, filterVisibility]);

  // Validate form (PT03, PT04, PT05, PT06, PT07)
  const validate = (data: Partial<Part>) => {
    const err: Record<string, string> = {};
    if (!data.tenSanPham?.trim()) err.tenSanPham = 'Tên sản phẩm không được để trống';
    if (!data.thuongHieu?.trim()) err.thuongHieu = 'Vui lòng chọn thương hiệu';
    if (!data.danhMuc) err.danhMuc = 'Vui lòng chọn danh mục';

    // PT06: Nhà cung cấp
    if (!data.nhaCungCap) err.nhaCungCap = 'Vui lòng chọn nhà cung cấp';

    // PT03: Định dạng & kiểm tra giá (>= 1.000 VNĐ, không cho phép nhập số như 4)
    if (data.giaGoc == null || isNaN(data.giaGoc) || data.giaGoc < 1000) {
      err.giaGoc = 'Giá sản phẩm phải từ 1.000 VNĐ trở lên (không được nhập giá bất thường như 4)';
    }

    // PT04: Giá khuyến mãi không được lớn hơn hoặc bằng giá gốc
    if (data.giaKhuyenMai != null && data.giaKhuyenMai > 0) {
      if (data.giaGoc != null && data.giaKhuyenMai >= data.giaGoc) {
        err.giaKhuyenMai = `Giá khuyến mãi phải nhỏ hơn giá gốc (${formatVND(data.giaGoc)})`;
      }
    }

    // PT05: Khi tạo mới sản phẩm, số lượng bắt buộc phải là số nguyên dương > 0
    if (!editPart) {
      if (data.soLuongTon == null || isNaN(data.soLuongTon) || data.soLuongTon <= 0) {
        err.soLuongTon = 'Số lượng sản phẩm khi tạo mới phải là số nguyên dương lớn hơn 0';
      }
    } else {
      if (data.soLuongTon == null || isNaN(data.soLuongTon) || data.soLuongTon < 0) {
        err.soLuongTon = 'Số lượng tồn kho không được âm';
      }
    }

    if (!data.hinhAnh?.trim()) err.hinhAnh = 'Vui lòng cung cấp hình ảnh sản phẩm';
    return err;
  };

  // PT01 & PT08: Lưu thêm mới hoặc sửa phụ tùng
  const handleSave = () => {
    const err = validate(form);
    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }

    if (editPart) {
      // PT08: Cập nhật phụ tùng
      const updated = partApi.update(editPart.id, {
        tenSanPham: form.tenSanPham!.trim(),
        thuongHieu: form.thuongHieu!,
        danhMuc: form.danhMuc!,
        nhaCungCap: form.nhaCungCap!,
        dongXePhuHop: form.dongXePhuHop || 'Dùng chung cho nhiều dòng xe',
        xuatXu: form.xuatXu || 'Việt Nam',
        baoHanh: form.baoHanh || '12 tháng (1 năm)',
        giaGoc: Number(form.giaGoc),
        giaKhuyenMai: form.giaKhuyenMai ? Number(form.giaKhuyenMai) : null,
        soLuongTon: Number(form.soLuongTon),
        moTa: form.moTa?.trim() || '',
        hinhAnh: form.hinhAnh!.trim(),
        trangThaiHienThi: form.trangThaiHienThi || 'Hien',
      });

      if (updated) {
        showToast(`✅ Đã cập nhật thành công phụ tùng "${updated.tenSanPham}" (${updated.id})`);
      }
    } else {
      // PT01: Tạo phụ tùng mới
      const newPart = partApi.create({
        tenSanPham: form.tenSanPham!.trim(),
        thuongHieu: form.thuongHieu!,
        danhMuc: form.danhMuc!,
        nhaCungCap: form.nhaCungCap!,
        dongXePhuHop: form.dongXePhuHop || 'Dùng chung cho nhiều dòng xe',
        xuatXu: form.xuatXu || 'Việt Nam',
        baoHanh: form.baoHanh || '12 tháng (1 năm)',
        giaGoc: Number(form.giaGoc),
        giaKhuyenMai: form.giaKhuyenMai ? Number(form.giaKhuyenMai) : null,
        soLuongTon: Number(form.soLuongTon),
        moTa: form.moTa?.trim() || '',
        hinhAnh: form.hinhAnh!.trim(),
        trangThaiHienThi: form.trangThaiHienThi || 'Hien',
        rating: 5.0,
        luotDanh: 0,
      });

      showToast(`🎉 Đã tạo thành công phụ tùng mới "${newPart.tenSanPham}" (${newPart.id})`);
    }

    reloadParts();
    setShowModal(false);
    setEditPart(null);
    setForm({});
    setErrors({});
  };

  const handleOpenCreate = () => {
    setEditPart(null);
    setForm({
      tenSanPham: '',
      thuongHieu: BRAND_OPTIONS[0],
      danhMuc: CATEGORY_OPTIONS[0],
      nhaCungCap: SUPPLIER_OPTIONS[0],
      dongXePhuHop: VEHICLE_OPTIONS[0],
      xuatXu: ORIGIN_OPTIONS[0],
      baoHanh: WARRANTY_OPTIONS[4], // 12 tháng
      giaGoc: 250000,
      giaKhuyenMai: null,
      soLuongTon: 10,
      moTa: '',
      hinhAnh: 'https://images.unsplash.com/photo-1635773054018-22c6630f9a2e?w=500',
      trangThaiHienThi: 'Hien',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (p: Part) => {
    setEditPart(p);
    setForm({ ...p });
    setErrors({});
    setShowModal(true);
  };

  // PT08: Xóa phụ tùng
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa phụ tùng "${name}" (Mã: ${id}) khỏi hệ thống?`)) {
      const ok = partApi.delete(id);
      if (ok) {
        reloadParts();
        showToast(`🗑️ Đã xóa phụ tùng ${id} thành công.`);
      }
    }
  };

  // PT12: Bật/tắt Ẩn/Hiện trên Web
  const handleToggleVisibility = (id: string) => {
    const updated = partApi.toggleVisibility(id);
    if (updated) {
      reloadParts();
      const statusText = updated.trangThaiHienThi === 'An' ? 'Đã ẨN khỏi Website' : 'Đang HIỂN THỊ trên Website';
      showToast(`👁️ Phụ tùng ${id}: ${statusText}`);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-zinc-950 text-white border border-zinc-700 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-red-700 text-white rounded-xl shadow-xs">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </span>
            <div>
              <h1 className="text-2xl font-800 text-zinc-950 uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Quản Lý Phụ Tùng & Phụ Kiện
              </h1>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                Quản lý kho hàng, nhà cung cấp, tồn kho và trạng thái hiển thị web (PT01 ➔ PT12)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
        >
          <span className="text-base leading-none">+</span>
          <span>Thêm phụ tùng mới</span>
        </button>
      </div>

      {/* ── PT11: 4 KPI Cards ở đầu trang ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng phụ tùng */}
        <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-2xs">
          <div className="text-xs font-semibold text-zinc-500 font-mono">Tổng phụ tùng</div>
          <div className="text-2xl font-800 text-zinc-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">Tất cả sản phẩm trong kho</div>
        </div>

        {/* Card 2: Đang kinh doanh (PT12) */}
        <div className="p-4 bg-white rounded-2xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <div className="text-xs font-semibold text-blue-700 font-mono flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            Đang kinh doanh
          </div>
          <div className="text-2xl font-800 text-blue-900 mt-1">{stats.activeSelling}</div>
          <div className="text-[11px] text-blue-600 mt-1 font-mono">Hiển thị trên website bán lẻ</div>
        </div>

        {/* Card 3: Sắp hết hàng (PT10 & PT11) */}
        <div className="p-4 bg-white rounded-2xl border border-amber-300 bg-amber-50/40 shadow-2xs">
          <div className="text-xs font-semibold text-amber-800 font-mono flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            ⚠️ Sắp hết hàng (&le; 10)
          </div>
          <div className="text-2xl font-800 text-amber-900 mt-1">{stats.lowStock}</div>
          <div className="text-[11px] text-amber-700 mt-1 font-mono">Cần lập kế hoạch nhập thêm</div>
        </div>

        {/* Card 4: Hết hàng */}
        <div className="p-4 bg-white rounded-2xl border border-red-200 bg-red-50/30 shadow-2xs">
          <div className="text-xs font-semibold text-red-700 font-mono flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-600"></span>
            ⛔ Hết hàng (0)
          </div>
          <div className="text-2xl font-800 text-red-900 mt-1">{stats.outOfStock}</div>
          <div className="text-[11px] text-red-600 mt-1 font-mono">Tồn kho bằng 0</div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm theo Mã phụ tùng (PT...), tên sản phẩm, thương hiệu, nhà cung cấp..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-red-600 font-medium"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-600 font-semibold bg-white"
            >
              <option value="">Tất cả danh mục</option>
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={filterBrand}
              onChange={e => setFilterBrand(e.target.value)}
              className="border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-600 font-semibold bg-white"
            >
              <option value="">Tất cả thương hiệu</option>
              {BRAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            <select
              value={filterSupplier}
              onChange={e => setFilterSupplier(e.target.value)}
              className="border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-600 font-semibold bg-white"
            >
              <option value="">Tất cả nhà cung cấp</option>
              {SUPPLIER_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* PT10: Lọc nhanh tồn kho */}
            <select
              value={filterStock}
              onChange={e => setFilterStock(e.target.value as any)}
              className="border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-600 font-semibold bg-white"
            >
              <option value="All">Tất cả tồn kho</option>
              <option value="InStock">Đủ hàng (&gt; 10)</option>
              <option value="LowStock">⚠️ Sắp hết hàng (&le; 10)</option>
              <option value="OutOfStock">⛔ Hết hàng (= 0)</option>
            </select>

            {/* PT12: Lọc trạng thái hiển thị web */}
            <select
              value={filterVisibility}
              onChange={e => setFilterVisibility(e.target.value as any)}
              className="border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-600 font-semibold bg-white"
            >
              <option value="All">Tất cả trạng thái Web</option>
              <option value="Hien">🟢 Đang hiển thị</option>
              <option value="An">👁️‍🗨️ Đang ẩn</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── PT02: Bảng Phụ Tùng (thay STT bằng MÃ PHỤ TÙNG ID) ── */}
      <div className="overflow-x-auto bg-white rounded-2xl border border-zinc-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-950 text-white font-mono text-xs uppercase">
            <tr>
              {/* PT02: Thay STT bằng Mã sản phẩm */}
              <th className="p-3 text-center">Mã SP</th>
              <th className="p-3 text-center">Ảnh</th>
              <th className="p-3 text-left">Tên sản phẩm</th>
              <th className="p-3 text-left">Thương hiệu</th>
              <th className="p-3 text-left">Nhà cung cấp</th>
              <th className="p-3 text-left">Danh mục</th>
              <th className="p-3 text-right">Giá gốc</th>
              <th className="p-3 text-right">Giá KM</th>
              {/* PT10: Cảnh báo tồn kho */}
              <th className="p-3 text-center">Tồn kho</th>
              {/* PT12: Trạng thái hiển thị */}
              <th className="p-3 text-center">Hiển thị Web</th>
              {/* PT09: Thao tác (Xem, Sửa, Xóa) */}
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-zinc-500 text-xs">
                  Không tìm thấy phụ tùng nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              pagedParts.map((p) => {
                // PT10: Cảnh báo tồn kho thấp (<= 10)
                const isOutOfStock = p.soLuongTon === 0;
                const isLowStock = p.soLuongTon > 0 && p.soLuongTon <= 10;

                // Tính giá KM từ promotionApi
                const activeDisc = promotionApi.calculateDiscount(p);
                const displayPromoPrice = p.giaKhuyenMai || (activeDisc ? activeDisc.giaKhuyenMai : null);

                return (
                  <tr key={p.id} className="hover:bg-zinc-50 transition">
                    {/* PT02: Hiển thị ID sản phẩm thay vì STT */}
                    <td className="p-3 text-center">
                      <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {p.id}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <img
                        src={p.hinhAnh}
                        alt={p.tenSanPham}
                        className="h-10 w-10 object-cover rounded-lg mx-auto border border-zinc-200"
                      />
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-zinc-900 leading-tight">{p.tenSanPham}</div>
                      <div className="flex flex-wrap gap-2 items-center text-[11px] text-zinc-400 mt-1">
                        {p.dongXePhuHop && (
                          <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                            Xe: {p.dongXePhuHop}
                          </span>
                        )}
                        {p.xuatXu && <span>Xuất xứ: {p.xuatXu}</span>}
                        {p.baoHanh && <span>· BH: {p.baoHanh}</span>}
                      </div>
                    </td>

                    <td className="p-3 font-mono text-xs text-zinc-700 font-semibold">{p.thuongHieu}</td>

                    {/* PT06: Nhà cung cấp */}
                    <td className="p-3 text-xs text-zinc-600">
                      {p.nhaCungCap || <span className="text-zinc-400 italic">Chưa gán</span>}
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 font-mono">
                        {p.danhMuc}
                      </span>
                    </td>

                    {/* Giá gốc */}
                    <td className="p-3 text-right font-mono text-xs text-zinc-700 font-medium">
                      {formatVND(p.giaGoc)}
                    </td>

                    {/* Giá khuyến mãi */}
                    <td className="p-3 text-right font-mono text-xs">
                      {displayPromoPrice ? (
                        <div>
                          <div className="font-bold text-red-700">{formatVND(displayPromoPrice)}</div>
                          {activeDisc && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-50 text-red-700 font-mono border border-red-200" title={activeDisc.promotionName}>
                              🏷️ {activeDisc.mucGiamText}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-400 font-mono">-</span>
                      )}
                    </td>

                    {/* PT10: Cảnh báo phụ tùng sắp hết hàng (MÀU ĐỎ TRỰC QUAN) */}
                    <td className="p-3 text-center">
                      {isOutOfStock ? (
                        <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-red-100 text-red-800 border border-red-300 font-mono flex items-center justify-center gap-1">
                          <span>⛔</span> 0 (Hết hàng)
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-red-50 text-red-700 border border-red-400 font-mono animate-pulse flex items-center justify-center gap-1 shadow-2xs">
                          <span>⚠️</span> {p.soLuongTon} (Sắp hết)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800 font-mono">
                          {p.soLuongTon}
                        </span>
                      )}
                    </td>

                    {/* PT12: Ẩn/Hiện trên Web */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleVisibility(p.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                          p.trangThaiHienThi === 'An'
                            ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
                        }`}
                        title="Bấm để bật/tắt hiển thị sản phẩm trên website khách hàng"
                      >
                        {p.trangThaiHienThi === 'An' ? '👁️‍🗨️ Đang ẩn' : '🟢 Đang hiển thị'}
                      </button>
                    </td>

                    {/* PT09 & PT08: Thao tác (Xem chi tiết, Sửa, Xóa) */}
                    <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                      {/* PT09: Nút Xem chi tiết */}
                      <button
                        onClick={() => setDetailPart(p)}
                        className="px-2 py-1 bg-zinc-100 text-zinc-800 text-xs font-semibold rounded-lg hover:bg-zinc-200 border border-zinc-300 cursor-pointer"
                        title="Xem chi tiết đầy đủ thông tin"
                      >
                        👁️ Xem
                      </button>

                      {/* Sửa */}
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="px-2 py-1 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 cursor-pointer"
                      >
                        Sửa
                      </button>

                      {/* Xóa */}
                      <button
                        onClick={() => handleDelete(p.id, p.tenSanPham)}
                        className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 cursor-pointer"
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
              Hiển thị <strong>{(currentPage - 1) * pageSize + 1}</strong> - <strong>{Math.min(currentPage * pageSize, filtered.length)}</strong> trên tổng số <strong>{filtered.length}</strong> sản phẩm (Trang {currentPage}/{totalPages})
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-zinc-200 text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 cursor-pointer"
              >
                &laquo;
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-zinc-200 text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 cursor-pointer"
              >
                &lsaquo;
              </button>
              <span className="px-3 py-1 text-xs font-mono font-bold text-zinc-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-zinc-200 text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 cursor-pointer"
              >
                &rsaquo;
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-zinc-200 text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 cursor-pointer"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Thêm / Sửa Phụ Tùng (PT01, PT03, PT04, PT05, PT06, PT07) ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-950 text-white rounded-t-2xl">
              <div>
                <h2 className="text-base font-bold font-mono uppercase tracking-wide">
                  {editPart ? `Chỉnh sửa phụ tùng: ${editPart.id}` : 'Thêm phụ tùng mới vào kho'}
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Chuẩn hóa thông tin giá, nhà cung cấp và thuộc tính linh kiện
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white text-2xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Tên sản phẩm */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Tên sản phẩm phụ tùng *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lọc nhớt chính hãng Honda SH 150/160..."
                  value={form.tenSanPham ?? ''}
                  onChange={e => setForm({ ...form, tenSanPham: e.target.value })}
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-semibold"
                />
                {errors.tenSanPham && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.tenSanPham}</p>}
              </div>

              {/* PT07: Dropdown Thương hiệu & Danh mục */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Thương hiệu * (PT07)</label>
                  <select
                    value={form.thuongHieu ?? BRAND_OPTIONS[0]}
                    onChange={e => setForm({ ...form, thuongHieu: e.target.value })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-semibold bg-white"
                  >
                    {BRAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {errors.thuongHieu && <p className="text-[11px] text-red-600 mt-1">{errors.thuongHieu}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Danh mục phụ tùng *</label>
                  <select
                    value={form.danhMuc ?? CATEGORY_OPTIONS[0]}
                    onChange={e => setForm({ ...form, danhMuc: e.target.value })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-semibold bg-white"
                  >
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.danhMuc && <p className="text-[11px] text-red-600 mt-1">{errors.danhMuc}</p>}
                </div>
              </div>

              {/* PT06: Nhà cung cấp */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Nhà cung cấp phụ tùng * (PT06)</label>
                <select
                  value={form.nhaCungCap ?? SUPPLIER_OPTIONS[0]}
                  onChange={e => setForm({ ...form, nhaCungCap: e.target.value })}
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-semibold bg-white"
                >
                  {SUPPLIER_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.nhaCungCap && <p className="text-[11px] text-red-600 mt-1">{errors.nhaCungCap}</p>}
              </div>

              {/* PT03 & PT04 & PT05: Giá gốc, Giá khuyến mãi, Số lượng */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
                {/* PT03: Giá gốc định dạng VNĐ */}
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Giá gốc (VNĐ) *</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    placeholder="VD: 250000"
                    value={form.giaGoc ?? ''}
                    onChange={e => setForm({ ...form, giaGoc: Number(e.target.value) })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-mono font-bold"
                  />
                  {form.giaGoc && form.giaGoc >= 1000 ? (
                    <div className="text-[11px] text-emerald-600 font-mono mt-1">
                      ➔ {formatVND(form.giaGoc)}
                    </div>
                  ) : null}
                  {errors.giaGoc && <p className="text-[11px] text-red-600 mt-1">{errors.giaGoc}</p>}
                </div>

                {/* PT04: Giá khuyến mãi (bắt buộc < Giá gốc) */}
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Giá khuyến mãi (tùy chọn)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Để trống nếu không giảm"
                    value={form.giaKhuyenMai ?? ''}
                    onChange={e => setForm({ ...form, giaKhuyenMai: e.target.value ? Number(e.target.value) : null })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-mono"
                  />
                  {form.giaKhuyenMai && form.giaKhuyenMai > 0 ? (
                    <div className="text-[11px] text-red-600 font-mono mt-1">
                      ➔ {formatVND(form.giaKhuyenMai)}
                    </div>
                  ) : null}
                  {errors.giaKhuyenMai && <p className="text-[11px] text-red-600 mt-1">{errors.giaKhuyenMai}</p>}
                </div>

                {/* PT05: Số lượng tồn kho (khi tạo mới bắt buộc > 0) */}
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Số lượng kho * {editPart ? '' : '(> 0)'}
                  </label>
                  <input
                    type="number"
                    min={editPart ? 0 : 1}
                    value={form.soLuongTon ?? ''}
                    onChange={e => setForm({ ...form, soLuongTon: Number(e.target.value) })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-mono font-bold"
                  />
                  {errors.soLuongTon && <p className="text-[11px] text-red-600 mt-1">{errors.soLuongTon}</p>}
                </div>
              </div>

              {/* PT07: Dropdown Dòng xe, Xuất xứ, Bảo hành */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Dòng xe tương thích *</label>
                  <select
                    value={form.dongXePhuHop ?? VEHICLE_OPTIONS[0]}
                    onChange={e => setForm({ ...form, dongXePhuHop: e.target.value })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 bg-white"
                  >
                    {VEHICLE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Xuất xứ *</label>
                  <select
                    value={form.xuatXu ?? ORIGIN_OPTIONS[0]}
                    onChange={e => setForm({ ...form, xuatXu: e.target.value })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 bg-white"
                  >
                    {ORIGIN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Thời hạn bảo hành *</label>
                  <select
                    value={form.baoHanh ?? WARRANTY_OPTIONS[4]}
                    onChange={e => setForm({ ...form, baoHanh: e.target.value })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 bg-white"
                  >
                    {WARRANTY_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              {/* PT12: Trạng thái hiển thị trên Web */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Trạng thái hiển thị Website (PT12)</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="trangThaiHienThi"
                      checked={form.trangThaiHienThi !== 'An'}
                      onChange={() => setForm({ ...form, trangThaiHienThi: 'Hien' })}
                    />
                    <span className="font-semibold text-emerald-700">🟢 Hiển thị trên Web (Khách có thể mua)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="trangThaiHienThi"
                      checked={form.trangThaiHienThi === 'An'}
                      onChange={() => setForm({ ...form, trangThaiHienThi: 'An' })}
                    />
                    <span className="font-semibold text-zinc-600">👁️‍🗨️ Tạm ẩn khỏi Web (Chỉ quản lý nội bộ)</span>
                  </label>
                </div>
              </div>

              {/* Hình ảnh */}
              <div>
                <ImageUploader
                  label="Hình ảnh phụ tùng *"
                  value={form.hinhAnh ?? ''}
                  onChange={url => setForm({ ...form, hinhAnh: url })}
                  placeholder="Nhập URL ảnh hoặc tải ảnh lên từ máy..."
                />
                {errors.hinhAnh && <p className="text-[11px] text-red-600 mt-1">{errors.hinhAnh}</p>}
              </div>

              {/* Mô tả */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Mô tả sản phẩm</label>
                <textarea
                  rows={2}
                  placeholder="Thông số kỹ thuật, quy cách đóng gói hoặc hướng dẫn sử dụng..."
                  value={form.moTa ?? ''}
                  onChange={e => setForm({ ...form, moTa: e.target.value })}
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-zinc-200 bg-zinc-50 rounded-b-2xl flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-zinc-300 rounded-xl text-zinc-700 font-semibold text-xs hover:bg-zinc-100 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                {editPart ? 'Lưu thay đổi' : 'Lưu & Thêm phụ tùng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PT09: Modal Xem Chi Tiết Phụ Tùng ── */}
      {detailPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 my-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-950 text-white rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-red-700 text-white px-2 py-0.5 rounded">
                    {detailPart.id}
                  </span>
                  <h2 className="text-base font-bold font-mono uppercase tracking-wide">
                    Chi Tiết Phụ Tùng
                  </h2>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">
                  Xem toàn bộ thông số kỹ thuật, nhà cung cấp và thông tin bán hàng
                </p>
              </div>
              <button
                onClick={() => setDetailPart(null)}
                className="text-zinc-400 hover:text-white text-2xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <img
                  src={detailPart.hinhAnh}
                  alt={detailPart.tenSanPham}
                  className="w-full sm:w-48 h-48 object-cover rounded-2xl border border-zinc-200 shrink-0 shadow-sm"
                />
                <div className="space-y-2 flex-1">
                  <div className="text-lg font-bold text-zinc-950 leading-snug">
                    {detailPart.tenSanPham}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 font-mono font-semibold text-zinc-700">
                      Thương hiệu: {detailPart.thuongHieu}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-100 font-mono font-semibold text-zinc-700">
                      Danh mục: {detailPart.danhMuc}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1.5 mt-2">
                    <div className="flex justify-between font-mono">
                      <span className="text-zinc-500">Giá gốc niêm yết:</span>
                      <strong className="text-zinc-900">{formatVND(detailPart.giaGoc)}</strong>
                    </div>
                    {detailPart.giaKhuyenMai && (
                      <div className="flex justify-between font-mono">
                        <span className="text-red-600">Giá khuyến mãi:</span>
                        <strong className="text-red-700 font-bold">{formatVND(detailPart.giaKhuyenMai)}</strong>
                      </div>
                    )}
                    <div className="flex justify-between font-mono">
                      <span className="text-zinc-500">Số lượng tồn kho:</span>
                      <strong className={detailPart.soLuongTon <= 10 ? 'text-red-700 font-bold' : 'text-emerald-700'}>
                        {detailPart.soLuongTon} sản phẩm {detailPart.soLuongTon <= 10 ? '(⚠️ Sắp hết)' : ''}
                      </strong>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-zinc-500">Trạng thái Website:</span>
                      <span className={detailPart.trangThaiHienThi === 'An' ? 'text-zinc-500 font-semibold' : 'text-emerald-700 font-bold'}>
                        {detailPart.trangThaiHienThi === 'An' ? '👁️‍🗨️ Đang ẩn' : '🟢 Đang hiển thị'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin mở rộng */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200">
                <div className="p-2.5 bg-zinc-50 rounded-xl">
                  <span className="text-zinc-500 block mb-0.5 font-medium">Nhà cung cấp:</span>
                  <span className="font-semibold text-zinc-900 font-mono">{detailPart.nhaCungCap || 'Chưa cập nhật'}</span>
                </div>
                <div className="p-2.5 bg-zinc-50 rounded-xl">
                  <span className="text-zinc-500 block mb-0.5 font-medium">Dòng xe tương thích:</span>
                  <span className="font-semibold text-zinc-900">{detailPart.dongXePhuHop || 'Dùng chung'}</span>
                </div>
                <div className="p-2.5 bg-zinc-50 rounded-xl">
                  <span className="text-zinc-500 block mb-0.5 font-medium">Xuất xứ:</span>
                  <span className="font-semibold text-zinc-900">{detailPart.xuatXu || 'Việt Nam'}</span>
                </div>
                <div className="p-2.5 bg-zinc-50 rounded-xl">
                  <span className="text-zinc-500 block mb-0.5 font-medium">Thời hạn bảo hành:</span>
                  <span className="font-semibold text-zinc-900">{detailPart.baoHanh || '12 tháng'}</span>
                </div>
              </div>

              {/* Mô tả */}
              {detailPart.moTa && (
                <div className="pt-2 border-t border-zinc-200">
                  <span className="text-zinc-500 block mb-1 font-medium">Mô tả sản phẩm:</span>
                  <p className="text-zinc-700 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    {detailPart.moTa}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-zinc-200 bg-zinc-50 rounded-b-2xl flex items-center justify-between">
              <button
                onClick={() => setDetailPart(null)}
                className="px-4 py-2 border border-zinc-300 rounded-xl text-zinc-700 font-semibold text-xs hover:bg-zinc-100 transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const target = detailPart;
                  setDetailPart(null);
                  handleOpenEdit(target);
                }}
                className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Chỉnh sửa phụ tùng này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
