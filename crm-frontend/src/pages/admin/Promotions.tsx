import React, { useState, useEffect, useMemo } from 'react';
import { formatVND, mockParts, Part } from '../../data/mockData';
import { promotionApi, partApi, type Promotion } from '../../services/api';

const CATEGORY_LIST = ['Nhớt', 'Lọc', 'Phanh', 'Bugi', 'Đèn', 'Lốp xe', 'Phụ kiện', 'Trang trí', 'Truyền động', 'Thân máy'];

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>(() => promotionApi.getAll());
  const [allParts, setAllParts] = useState<Part[]>([...mockParts]);

  // Load parts list for item selector
  useEffect(() => {
    partApi.getAll().then(data => {
      if (data && data.length > 0) setAllParts(data);
    });
  }, []);

  // Listen to refresh events
  useEffect(() => {
    const handleRefresh = () => {
      setPromotions(promotionApi.getAll());
    };
    window.addEventListener('crm-data-refresh', handleRefresh);
    return () => window.removeEventListener('crm-data-refresh', handleRefresh);
  }, []);

  // Filter States
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'DangApDung' | 'TamDung' | 'HetHan'>('All');
  const [filterType, setFilterType] = useState<'All' | 'PhanTram' | 'SoTien'>('All');
  const [filterScope, setFilterScope] = useState<'All' | 'TatCa' | 'TheoDanhMuc' | 'SanPhamCuThe'>('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);

  // Form State
  const [formId, setFormId] = useState('');
  const [formTen, setFormTen] = useState('');
  const [formMoTa, setFormMoTa] = useState('');
  const [formLoaiGiam, setFormLoaiGiam] = useState<'PhanTram' | 'SoTien'>('PhanTram');
  const [formMucGiam, setFormMucGiam] = useState<number>(10);
  const [formGiamToiDa, setFormGiamToiDa] = useState<number | undefined>(undefined);
  const [formNgayBD, setFormNgayBD] = useState(new Date().toISOString().split('T')[0]);
  const [formNgayKT, setFormNgayKT] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [formTrangThai, setFormTrangThai] = useState<'DangApDung' | 'TamDung'>('DangApDung');
  const [formApDungCho, setFormApDungCho] = useState<'TatCa' | 'TheoDanhMuc' | 'SanPhamCuThe'>('TatCa');
  const [formDanhMuc, setFormDanhMuc] = useState<string[]>([]);
  const [formSanPhamIds, setFormSanPhamIds] = useState<string[]>([]);

  // Product Selector Sub-state inside Modal (KM03)
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('All');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filtered promotions
  const filteredPromotions = useMemo(() => {
    return promotions.filter(p => {
      const matchSearch =
        !search.trim() ||
        p.tenChuongTrinh.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || p.trangThai === filterStatus;
      const matchType = filterType === 'All' || p.loaiGiamGia === filterType;
      const matchScope = filterScope === 'All' || p.apDungCho === filterScope;
      return matchSearch && matchStatus && matchType && matchScope;
    });
  }, [promotions, search, filterStatus, filterType, filterScope]);

  // Statistics
  const stats = useMemo(() => {
    const total = promotions.length;
    const active = promotions.filter(p => p.trangThai === 'DangApDung').length;
    const paused = promotions.filter(p => p.trangThai === 'TamDung').length;
    const expired = promotions.filter(p => p.trangThai === 'HetHan').length;
    return { total, active, paused, expired };
  }, [promotions]);

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditPromo(null);
    setFormId(`KM${String(Date.now()).slice(-4)}`);
    setFormTen('');
    setFormMoTa('');
    setFormLoaiGiam('PhanTram');
    setFormMucGiam(10);
    setFormGiamToiDa(undefined);
    setFormNgayBD(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setFormNgayKT(d.toISOString().split('T')[0]);
    setFormTrangThai('DangApDung');
    setFormApDungCho('TatCa');
    setFormDanhMuc([]);
    setFormSanPhamIds([]);
    setProductSearch('');
    setProductCatFilter('All');
    setFormErrors({});
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (p: Promotion) => {
    setEditPromo(p);
    setFormId(p.id);
    setFormTen(p.tenChuongTrinh);
    setFormMoTa(p.moTa || '');
    setFormLoaiGiam(p.loaiGiamGia);
    setFormMucGiam(p.mucGiam);
    setFormGiamToiDa(p.giamToiDa);
    setFormNgayBD(p.ngayBatDau);
    setFormNgayKT(p.ngayKetThuc);
    setFormTrangThai(p.trangThai === 'HetHan' ? 'TamDung' : p.trangThai);
    setFormApDungCho(p.apDungCho);
    setFormDanhMuc(p.danhMucApDung || []);
    setFormSanPhamIds(p.sanPhamIds || []);
    setProductSearch('');
    setProductCatFilter('All');
    setFormErrors({});
    setShowModal(true);
  };

  // Toggle quick status
  const handleToggleStatus = (id: string) => {
    const updated = promotionApi.toggleStatus(id);
    if (updated) {
      setPromotions(promotionApi.getAll());
    }
  };

  // Delete
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa chương trình khuyến mãi "${name}" (${id})?`)) {
      promotionApi.delete(id);
      setPromotions(promotionApi.getAll());
    }
  };

  // Validate form
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formTen.trim()) errs.ten = 'Vui lòng nhập tên chương trình';
    if (!formNgayBD) errs.ngayBD = 'Chọn ngày bắt đầu';
    if (!formNgayKT) errs.ngayKT = 'Chọn ngày kết thúc';
    if (formNgayBD && formNgayKT && formNgayKT < formNgayBD) {
      errs.ngayKT = 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu';
    }
    if (formMucGiam <= 0) {
      errs.mucGiam = 'Mức giảm phải lớn hơn 0';
    }
    if (formLoaiGiam === 'PhanTram' && formMucGiam > 100) {
      errs.mucGiam = 'Giảm theo phần trăm không được vượt quá 100%';
    }
    if (formApDungCho === 'TheoDanhMuc' && formDanhMuc.length === 0) {
      errs.danhMuc = 'Vui lòng chọn ít nhất 1 danh mục áp dụng';
    }
    if (formApDungCho === 'SanPhamCuThe' && formSanPhamIds.length === 0) {
      errs.sanPham = 'Vui lòng chọn ít nhất 1 sản phẩm áp dụng';
    }
    return errs;
  };

  // Save Modal
  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    const payload = {
      tenChuongTrinh: formTen.trim(),
      moTa: formMoTa.trim() || undefined,
      loaiGiamGia: formLoaiGiam,
      mucGiam: Number(formMucGiam),
      giamToiDa: formLoaiGiam === 'PhanTram' && formGiamToiDa ? Number(formGiamToiDa) : undefined,
      ngayBatDau: formNgayBD,
      ngayKetThuc: formNgayKT,
      trangThai: formTrangThai,
      apDungCho: formApDungCho,
      danhMucApDung: formApDungCho === 'TheoDanhMuc' ? formDanhMuc : [],
      sanPhamIds: formApDungCho === 'SanPhamCuThe' ? formSanPhamIds : [],
    };

    if (editPromo) {
      promotionApi.update(editPromo.id, payload);
    } else {
      promotionApi.create({
        ...payload,
        id: formId.trim() || undefined,
      });
    }

    setPromotions(promotionApi.getAll());
    setShowModal(false);
  };

  // Filtered parts for modal selector (KM03)
  const modalFilteredParts = useMemo(() => {
    return allParts.filter(p => {
      const matchSearch =
        !productSearch.trim() ||
        p.tenSanPham.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.thuongHieu.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat = productCatFilter === 'All' || p.danhMuc === productCatFilter;
      return matchSearch && matchCat;
    });
  }, [allParts, productSearch, productCatFilter]);

  // Calculate preview discounted price for a part
  const calculatePreviewPrice = (basePrice: number) => {
    let discount = 0;
    if (formLoaiGiam === 'PhanTram') {
      const raw = Math.round((basePrice * formMucGiam) / 100);
      discount = formGiamToiDa ? Math.min(raw, formGiamToiDa) : raw;
    } else {
      discount = Math.min(formMucGiam, basePrice);
    }
    return Math.max(0, basePrice - discount);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-red-700 text-white rounded-xl shadow-xs">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </span>
            <div>
              <h1 className="text-2xl font-800 text-zinc-950 uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Chương Trình Khuyến Mãi
              </h1>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                Quản lý chiến dịch giảm giá, chiết khấu phụ tùng & phụ kiện (KM01, KM02, KM03)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
        >
          <span className="text-base leading-none">+</span>
          <span>Tạo chương trình mới</span>
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-2xs">
          <div className="text-xs font-semibold text-zinc-500 font-mono">Tổng chương trình</div>
          <div className="text-2xl font-800 text-zinc-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">Tất cả chiến dịch đã tạo</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-700 font-mono flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Đang áp dụng
          </div>
          <div className="text-2xl font-800 text-emerald-800 mt-1">{stats.active}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-mono">Có hiệu lực trên hệ thống</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="text-xs font-semibold text-amber-700 font-mono">Tạm dừng</div>
          <div className="text-2xl font-800 text-amber-800 mt-1">{stats.paused}</div>
          <div className="text-[11px] text-amber-600 mt-1 font-mono">Chiến dịch chưa kích hoạt</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-zinc-200 bg-zinc-50/50 shadow-2xs">
          <div className="text-xs font-semibold text-zinc-500 font-mono">Đã hết hạn</div>
          <div className="text-2xl font-800 text-zinc-600 mt-1">{stats.expired}</div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">Qua thời gian áp dụng</div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm theo mã KM hoặc tên chương trình..."
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
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-600 font-semibold bg-white"
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="DangApDung">🟢 Đang áp dụng</option>
            <option value="TamDung">🟡 Tạm dừng</option>
            <option value="HetHan">⚪ Đã hết hạn</option>
          </select>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-600 font-semibold bg-white"
          >
            <option value="All">Tất cả hình thức</option>
            <option value="PhanTram">Giảm theo %</option>
            <option value="SoTien">Giảm theo VNĐ</option>
          </select>

          <select
            value={filterScope}
            onChange={e => setFilterScope(e.target.value as any)}
            className="border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-600 font-semibold bg-white"
          >
            <option value="All">Tất cả phạm vi</option>
            <option value="TatCa">Toàn bộ phụ tùng</option>
            <option value="TheoDanhMuc">Theo danh mục</option>
            <option value="SanPhamCuThe">Sản phẩm cụ thể</option>
          </select>
        </div>
      </div>

      {/* ── Promotion Table ── */}
      <div className="overflow-x-auto bg-white rounded-2xl border border-zinc-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-950 text-white font-mono text-xs uppercase">
            <tr>
              <th className="p-3 text-center">STT</th>
              <th className="p-3 text-left">Mã KM & Chương trình</th>
              <th className="p-3 text-left">Thời gian áp dụng</th>
              <th className="p-3 text-center">Hình thức giảm</th>
              <th className="p-3 text-left">Phạm vi áp dụng</th>
              <th className="p-3 text-center">Trạng thái</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {filteredPromotions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-zinc-500 text-xs">
                  Không tìm thấy chương trình khuyến mãi nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredPromotions.map((p, idx) => {
                const today = new Date().toISOString().split('T')[0];
                const isExpired = p.ngayKetThuc < today;

                return (
                  <tr key={p.id} className="hover:bg-zinc-50 transition">
                    <td className="p-3 text-center font-mono text-xs text-zinc-500">{idx + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          {p.id}
                        </span>
                        <div className="font-semibold text-zinc-900">{p.tenChuongTrinh}</div>
                      </div>
                      {p.moTa && <div className="text-xs text-zinc-500 mt-1 max-w-md line-clamp-1">{p.moTa}</div>}
                    </td>
                    <td className="p-3 font-mono text-xs text-zinc-600">
                      <div>{p.ngayBatDau} ➔ {p.ngayKetThuc}</div>
                      {isExpired ? (
                        <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">Đã kết thúc</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Đang trong thời hạn</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-red-700 font-mono text-sm">
                        {p.loaiGiamGia === 'PhanTram' ? `-${p.mucGiam}%` : `-${formatVND(p.mucGiam)}`}
                      </span>
                      {p.loaiGiamGia === 'PhanTram' && p.giamToiDa && (
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Tối đa {formatVND(p.giamToiDa)}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-xs">
                      {p.apDungCho === 'TatCa' && (
                        <span className="px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                          Toàn bộ sản phẩm
                        </span>
                      )}
                      {p.apDungCho === 'TheoDanhMuc' && (
                        <div>
                          <span className="font-semibold text-zinc-800">Theo {p.danhMucApDung?.length || 0} danh mục:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.danhMucApDung?.map(dm => (
                              <span key={dm} className="px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 text-[11px] font-mono">
                                {dm}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {p.apDungCho === 'SanPhamCuThe' && (
                        <div>
                          <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-mono">
                            {p.sanPhamIds?.length || 0} sản phẩm chỉ định
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleStatus(p.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                          p.trangThai === 'DangApDung'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : p.trangThai === 'TamDung'
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                        title="Bấm để bật/tắt nhanh trạng thái"
                      >
                        {p.trangThai === 'DangApDung' ? '🟢 Áp dụng' : p.trangThai === 'TamDung' ? '🟡 Tạm dừng' : '⚪ Hết hạn'}
                      </button>
                    </td>
                    <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="px-2.5 py-1 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 cursor-pointer"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.tenChuongTrinh)}
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
      </div>

      {/* ── Modal Thêm / Sửa Chương trình (KM02 & KM03) ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-950 text-white rounded-t-2xl">
              <div>
                <h2 className="text-base font-bold font-mono uppercase tracking-wide">
                  {editPromo ? 'Cập nhật chương trình khuyến mãi' : 'Tạo chương trình khuyến mãi mới'}
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">
                  Thiết lập thời gian áp dụng, hình thức chiết khấu và danh sách sản phẩm (KM02, KM03)
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
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Row 1: Mã & Tên KM */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Mã chương trình *</label>
                  <input
                    type="text"
                    value={formId}
                    onChange={e => setFormId(e.target.value.toUpperCase())}
                    disabled={!!editPromo}
                    placeholder="VD: KM-TET2026"
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 font-mono uppercase focus:outline-none focus:border-red-600 disabled:bg-zinc-100"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-zinc-700 mb-1">Tên chương trình khuyến mãi *</label>
                  <input
                    type="text"
                    value={formTen}
                    onChange={e => setFormTen(e.target.value)}
                    placeholder="VD: Giảm 15% Dầu nhớt & Bugi chính hãng"
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-semibold"
                  />
                  {formErrors.ten && <p className="text-[11px] text-red-600 mt-1">{formErrors.ten}</p>}
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Mô tả chương trình</label>
                <textarea
                  rows={2}
                  value={formMoTa}
                  onChange={e => setFormMoTa(e.target.value)}
                  placeholder="Ghi chú chi tiết điều kiện hoặc đối tượng áp dụng..."
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Row 2: Thời gian áp dụng & Trạng thái */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Ngày bắt đầu *</label>
                  <input
                    type="date"
                    value={formNgayBD}
                    onChange={e => setFormNgayBD(e.target.value)}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-600 font-mono"
                  />
                  {formErrors.ngayBD && <p className="text-[11px] text-red-600 mt-1">{formErrors.ngayBD}</p>}
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Ngày kết thúc *</label>
                  <input
                    type="date"
                    value={formNgayKT}
                    onChange={e => setFormNgayKT(e.target.value)}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-600 font-mono"
                  />
                  {formErrors.ngayKT && <p className="text-[11px] text-red-600 mt-1">{formErrors.ngayKT}</p>}
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Trạng thái kích hoạt</label>
                  <select
                    value={formTrangThai}
                    onChange={e => setFormTrangThai(e.target.value as any)}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-600 font-semibold bg-white"
                  >
                    <option value="DangApDung">🟢 Đang áp dụng ngay</option>
                    <option value="TamDung">🟡 Tạm dừng (Lưu nháp)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Hình thức giảm giá & Mức giảm */}
              <div className="p-3.5 bg-red-50/40 rounded-xl border border-red-200 space-y-3">
                <div className="font-semibold text-red-950 font-mono text-xs uppercase flex items-center gap-1.5">
                  <span>💰</span> Hình thức & Mức giảm giá
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">Loại giảm giá</label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="loaiGiam"
                          checked={formLoaiGiam === 'PhanTram'}
                          onChange={() => setFormLoaiGiam('PhanTram')}
                        />
                        <span className="font-semibold">Phần trăm (%)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="loaiGiam"
                          checked={formLoaiGiam === 'SoTien'}
                          onChange={() => setFormLoaiGiam('SoTien')}
                        />
                        <span className="font-semibold">Số tiền (VNĐ)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">
                      {formLoaiGiam === 'PhanTram' ? 'Mức giảm (%) *' : 'Số tiền giảm (VNĐ) *'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={formLoaiGiam === 'PhanTram' ? 100 : undefined}
                      value={formMucGiam || ''}
                      onChange={e => setFormMucGiam(Number(e.target.value))}
                      placeholder={formLoaiGiam === 'PhanTram' ? '15' : '50000'}
                      className="w-full border border-zinc-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-600 font-mono font-bold"
                    />
                    {formErrors.mucGiam && <p className="text-[11px] text-red-600 mt-1">{formErrors.mucGiam}</p>}
                  </div>

                  {formLoaiGiam === 'PhanTram' && (
                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">Giảm tối đa (VNĐ, tùy chọn)</label>
                      <input
                        type="number"
                        min="0"
                        value={formGiamToiDa || ''}
                        onChange={e => setFormGiamToiDa(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Để trống nếu không giới hạn"
                        className="w-full border border-zinc-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-600 font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Row 4: PHẠM VI ÁP DỤNG & BỘ CHỌN SẢN PHẨM (KM03) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                  <div className="font-bold text-zinc-900 font-mono uppercase text-xs flex items-center gap-1.5">
                    <span>📦</span> Phạm vi áp dụng & Chọn sản phẩm (KM03)
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    {formApDungCho === 'TatCa' && 'Áp dụng cho toàn bộ phụ tùng'}
                    {formApDungCho === 'TheoDanhMuc' && `Đã chọn ${formDanhMuc.length} danh mục`}
                    {formApDungCho === 'SanPhamCuThe' && `Đã chọn ${formSanPhamIds.length} sản phẩm`}
                  </div>
                </div>

                {/* 3 Scope Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormApDungCho('TatCa')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      formApDungCho === 'TatCa'
                        ? 'border-red-600 bg-red-50/50 text-red-950 font-bold shadow-xs'
                        : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-semibold">1. Toàn bộ sản phẩm</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Áp dụng cho tất cả phụ tùng trong kho</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormApDungCho('TheoDanhMuc')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      formApDungCho === 'TheoDanhMuc'
                        ? 'border-red-600 bg-red-50/50 text-red-950 font-bold shadow-xs'
                        : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-semibold">2. Theo danh mục</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Áp dụng cho các nhóm danh mục chọn lọc</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormApDungCho('SanPhamCuThe')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      formApDungCho === 'SanPhamCuThe'
                        ? 'border-red-600 bg-red-50/50 text-red-950 font-bold shadow-xs'
                        : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-semibold">3. Sản phẩm cụ thể (KM03)</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Chọn từng phụ tùng & xem trước giá giảm</div>
                  </button>
                </div>

                {/* Scope 2 Detail: Chọn Danh Mục */}
                {formApDungCho === 'TheoDanhMuc' && (
                  <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-700">Chọn các danh mục được giảm giá:</span>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => setFormDanhMuc([...CATEGORY_LIST])}
                          className="text-[11px] text-red-700 hover:underline font-bold"
                        >
                          Chọn tất cả
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormDanhMuc([])}
                          className="text-[11px] text-zinc-500 hover:underline"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                      {CATEGORY_LIST.map(cat => {
                        const checked = formDanhMuc.includes(cat);
                        return (
                          <label
                            key={cat}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition text-xs ${
                              checked ? 'bg-red-50 border-red-400 font-bold text-red-950' : 'bg-white border-zinc-200 text-zinc-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={e => {
                                if (e.target.checked) setFormDanhMuc(prev => [...prev, cat]);
                                else setFormDanhMuc(prev => prev.filter(c => c !== cat));
                              }}
                            />
                            <span>{cat}</span>
                          </label>
                        );
                      })}
                    </div>
                    {formErrors.danhMuc && <p className="text-[11px] text-red-600 mt-1">{formErrors.danhMuc}</p>}
                  </div>
                )}

                {/* Scope 3 Detail: BỘ CHỌN SẢN PHẨM CỤ THỂ VÀ XEM TRƯỚC GIÁ (KM03) */}
                {formApDungCho === 'SanPhamCuThe' && (
                  <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Tìm sản phẩm theo tên, mã..."
                          value={productSearch}
                          onChange={e => setProductSearch(e.target.value)}
                          className="px-3 py-1.5 border border-zinc-300 rounded-lg text-xs bg-white focus:outline-none focus:border-red-600 font-medium w-56"
                        />
                        <select
                          value={productCatFilter}
                          onChange={e => setProductCatFilter(e.target.value)}
                          className="px-2 py-1.5 border border-zinc-300 rounded-lg text-xs bg-white font-medium focus:outline-none"
                        >
                          <option value="All">Tất cả danh mục</option>
                          {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-zinc-600 font-semibold">
                          Đã chọn: <strong className="text-red-700">{formSanPhamIds.length}</strong> sản phẩm
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const ids = Array.from(new Set([...formSanPhamIds, ...modalFilteredParts.map(p => p.id)]));
                            setFormSanPhamIds(ids);
                          }}
                          className="px-2 py-1 bg-zinc-900 text-white rounded text-[11px] hover:bg-zinc-800"
                        >
                          Chọn lọc này
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const unselectSet = new Set(modalFilteredParts.map(p => p.id));
                            setFormSanPhamIds(prev => prev.filter(id => !unselectSet.has(id)));
                          }}
                          className="px-2 py-1 border border-zinc-300 bg-white rounded text-[11px] hover:bg-zinc-100"
                        >
                          Bỏ lọc này
                        </button>
                      </div>
                    </div>

                    {/* Danh sách checkbox kèm xem trước giá sau giảm */}
                    <div className="max-h-60 overflow-y-auto border border-zinc-200 rounded-xl bg-white divide-y divide-zinc-100">
                      {modalFilteredParts.length === 0 ? (
                        <div className="p-4 text-center text-zinc-400 text-xs">Không có sản phẩm nào phù hợp</div>
                      ) : (
                        modalFilteredParts.map(p => {
                          const isChecked = formSanPhamIds.includes(p.id);
                          const discountedPrice = calculatePreviewPrice(p.giaGoc);

                          return (
                            <label
                              key={p.id}
                              className={`flex items-center justify-between p-2.5 hover:bg-zinc-50 transition cursor-pointer ${
                                isChecked ? 'bg-red-50/40' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={e => {
                                    if (e.target.checked) setFormSanPhamIds(prev => [...prev, p.id]);
                                    else setFormSanPhamIds(prev => prev.filter(id => id !== p.id));
                                  }}
                                  className="h-4 w-4 rounded accent-red-700"
                                />
                                <img
                                  src={p.hinhAnh}
                                  alt={p.tenSanPham}
                                  className="h-9 w-9 object-cover rounded border border-zinc-200 shrink-0"
                                />
                                <div>
                                  <div className="font-semibold text-zinc-900 text-xs flex items-center gap-1.5">
                                    <span className="font-mono text-[11px] text-zinc-500">{p.id}</span>
                                    <span>{p.tenSanPham}</span>
                                  </div>
                                  <div className="text-[11px] text-zinc-500 font-mono">
                                    {p.thuongHieu} · {p.danhMuc} · Tồn kho: {p.soLuongTon}
                                  </div>
                                </div>
                              </div>

                              {/* Live Price Preview */}
                              <div className="text-right shrink-0 pl-2">
                                <div className="text-zinc-400 line-through text-[11px] font-mono">
                                  {formatVND(p.giaGoc)}
                                </div>
                                <div className="font-bold text-red-700 font-mono text-xs">
                                  {formatVND(discountedPrice)}
                                  <span className="text-[10px] text-red-600 font-semibold ml-1">
                                    ({formLoaiGiam === 'PhanTram' ? `-${formMucGiam}%` : `-${formatVND(formMucGiam)}`})
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                    {formErrors.sanPham && <p className="text-[11px] text-red-600 mt-1">{formErrors.sanPham}</p>}
                  </div>
                )}
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
                {editPromo ? 'Cập nhật chương trình' : 'Lưu & Kích hoạt chương trình'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
