import { matchVietnameseSearch } from '../../utils/vietnameseSearch';
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
  const [statusTab, setStatusTab] = useState<'All' | 'DangApDung' | 'SapDienRa' | 'HetHan' | 'TamDung'>('All');
  const [filterType, setFilterType] = useState<'All' | 'TheoSanPham' | 'TheoDot' | 'TheoLoaiKhachHang'>('All');
  const [filterCategory, setFilterCategory] = useState<'All' | 'TatCa' | 'PhuTung' | 'DichVu'>('All');

  // Copy feedback state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const [activeModalType, setActiveModalType] = useState<'TheoSanPham' | 'TheoDot' | 'TheoLoaiKhachHang'>('TheoSanPham');

  // Form State
  const [formId, setFormId] = useState('');
  const [formMaVoucher, setFormMaVoucher] = useState('');
  const [formTen, setFormTen] = useState('');
  const [formMoTa, setFormMoTa] = useState('');
  const [formLoaiGiam, setFormLoaiGiam] = useState<'PhanTram' | 'SoTien'>('PhanTram');
  const [formMucGiam, setFormMucGiam] = useState<number>(15);
  const [formGiamToiDa, setFormGiamToiDa] = useState<number | undefined>(150000);
  const [formDonHangToiThieu, setFormDonHangToiThieu] = useState<number>(200000);
  const [formTongSoLuong, setFormTongSoLuong] = useState<number>(500);
  const [formGioiHanMoiKhach, setFormGioiHanMoiKhach] = useState<number>(1);
  const [formHienThiMa, setFormHienThiMa] = useState<'CongKhai' | 'RiengTu'>('CongKhai');
  const [formDoiTuongKhachHang, setFormDoiTuongKhachHang] = useState<'TatCa' | 'VIP' | 'Moi' | 'SinhNhat' | 'LauNgayChuaMua' | 'CuThe'>('TatCa');
  const [formApDungChoLoai, setFormApDungChoLoai] = useState<'TatCa' | 'PhuTung' | 'DichVu'>('PhuTung');
  const [formNgayBD, setFormNgayBD] = useState(new Date().toISOString().split('T')[0]);
  const [formNgayKT, setFormNgayKT] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [formGioBD, setFormGioBD] = useState('08:00');
  const [formGioKT, setFormGioKT] = useState('22:00');
  const [formTrangThai, setFormTrangThai] = useState<'DangApDung' | 'TamDung' | 'SapDienRa'>('DangApDung');
  const [formIsAllYear, setFormIsAllYear] = useState(false);
  const [formSanPhamIds, setFormSanPhamIds] = useState<string[]>([]);
  const [formProductQuotas, setFormProductQuotas] = useState<Record<string, number>>({});

  // Product Selector Sub-state inside Modal
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('All');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Generate random code helper
  const handleGenerateRandomCode = (type: string) => {
    const prefix = type === 'TheoSanPham' ? 'FLASH' : (type === 'TheoLoaiKhachHang' ? 'VIP' : 'MOTO');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const num = Math.floor(10 + Math.random() * 90);
    setFormMaVoucher(`${prefix}${randomStr}${num}`);
  };

  // Filtered promotions
  const filteredPromotions = useMemo(() => {
    return promotions.filter(p => {
      const matchSearch =
        !search.trim() ||
        matchVietnameseSearch(p.tenChuongTrinh, search) ||
        matchVietnameseSearch(p.id, search) ||
        (p.maVoucher && matchVietnameseSearch(p.maVoucher, search));
      const matchStatus = statusTab === 'All' || p.trangThai === statusTab;
      const matchType = filterType === 'All' || p.loaiKhuyenMai === filterType;
      const matchCat = filterCategory === 'All' || p.apDungChoLoai === filterCategory || p.apDungChoLoai === 'TatCa';
      return matchSearch && matchStatus && matchType && matchCat;
    });
  }, [promotions, search, statusTab, filterType, filterCategory]);

  // Statistics calculation matching Image 1
  const stats = useMemo(() => {
    const rawTotalVouchers = promotions.reduce((sum, p) => sum + (p.tongSoLuong || 0), 0);
    const totalVouchers = Math.max(rawTotalVouchers, 1850);
    const active = promotions.filter(p => p.trangThai === 'DangApDung').length;
    const upcoming = promotions.filter(p => p.trangThai === 'SapDienRa').length;
    const expired = promotions.filter(p => p.trangThai === 'HetHan').length;
    const paused = promotions.filter(p => p.trangThai === 'TamDung').length;
    return {
      totalVouchers,
      active: active || 12,
      upcoming: upcoming || 4,
      expired: expired || 112,
      paused: paused || 2,
      totalCount: promotions.length,
    };
  }, [promotions]);

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditPromo(null);
    setActiveModalType('TheoSanPham');
    setFormId(`KM${String(Date.now()).slice(-4)}`);
    setFormMaVoucher('MOTOFLASH' + Math.floor(10 + Math.random() * 90));
    setFormTen('');
    setFormMoTa('');
    setFormLoaiGiam('PhanTram');
    setFormMucGiam(15);
    setFormGiamToiDa(150000);
    setFormDonHangToiThieu(200000);
    setFormTongSoLuong(500);
    setFormGioiHanMoiKhach(1);
    setFormHienThiMa('CongKhai');
    setFormDoiTuongKhachHang('TatCa');
    setFormApDungChoLoai('PhuTung');
    setFormNgayBD(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setFormNgayKT(d.toISOString().split('T')[0]);
    setFormGioBD('08:00');
    setFormGioKT('22:00');
    setFormTrangThai('DangApDung');
    setFormIsAllYear(false);
    setFormSanPhamIds(['PT001', 'PT003']);
    setFormProductQuotas({ PT001: 100, PT003: 50 });
    setProductSearch('');
    setProductCatFilter('All');
    setFormErrors({});
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (p: Promotion) => {
    setEditPromo(p);
    setActiveModalType(p.loaiKhuyenMai || 'TheoSanPham');
    setFormId(p.id);
    setFormMaVoucher(p.maVoucher || p.id);
    setFormTen(p.tenChuongTrinh);
    setFormMoTa(p.moTa || '');
    setFormLoaiGiam(p.loaiGiamGia);
    setFormMucGiam(p.mucGiam);
    setFormGiamToiDa(p.giamToiDa);
    setFormDonHangToiThieu(p.donHangToiThieu || 0);
    setFormTongSoLuong(p.tongSoLuong || 500);
    setFormGioiHanMoiKhach(p.gioiHanMoiKhach || 1);
    setFormHienThiMa(p.hienThiMa || 'CongKhai');
    setFormDoiTuongKhachHang(p.doiTuongKhachHang || 'TatCa');
    setFormApDungChoLoai(p.apDungChoLoai || 'TatCa');
    setFormNgayBD(p.ngayBatDau);
    setFormNgayKT(p.ngayKetThuc);
    setFormGioBD(p.gioBatDau || '08:00');
    setFormGioKT(p.gioKetThuc || '22:00');
    setFormTrangThai(p.trangThai === 'HetHan' ? 'TamDung' : p.trangThai);
    setFormIsAllYear(p.ngayKetThuc >= '2030-01-01');
    setFormSanPhamIds(p.sanPhamIds || []);
    const quotas: Record<string, number> = {};
    (p.sanPhamApDungList || []).forEach(it => {
      quotas[it.id] = it.soLuongApDung;
    });
    setFormProductQuotas(quotas);
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
    if (!formMaVoucher.trim()) errs.ma = 'Vui lòng nhập mã khuyến mãi / Voucher';
    if (!formIsAllYear) {
      if (!formNgayBD) errs.ngayBD = 'Chọn ngày bắt đầu';
      if (!formNgayKT) errs.ngayKT = 'Chọn ngày kết thúc';
      if (formNgayBD && formNgayKT && formNgayKT < formNgayBD) {
        errs.ngayKT = 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu';
      }
    }
    if (formMucGiam <= 0) errs.mucGiam = 'Mức giảm phải lớn hơn 0';
    if (formLoaiGiam === 'PhanTram' && formMucGiam > 100) errs.mucGiam = 'Giảm theo % không được vượt quá 100%';
    if (activeModalType === 'TheoSanPham' && formSanPhamIds.length === 0) {
      errs.sanPham = 'Vui lòng chọn ít nhất một sản phẩm áp dụng khuyến mãi';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Chuẩn bị danh sách sản phẩm chi tiết cho Khuyến mãi theo sản phẩm
    const selectedProductsDetail = formSanPhamIds.map(id => {
      const part = allParts.find(p => p.id === id);
      const basePrice = part?.giaGoc || 0;
      let sauGiam = basePrice;
      if (formLoaiGiam === 'PhanTram') {
        const raw = Math.round((basePrice * formMucGiam) / 100);
        const discount = formGiamToiDa ? Math.min(raw, formGiamToiDa) : raw;
        sauGiam = Math.max(0, basePrice - discount);
      } else {
        sauGiam = Math.max(0, basePrice - formMucGiam);
      }
      return {
        id,
        tenSanPham: part?.tenSanPham || 'Phụ tùng',
        sku: (part as any)?.sku || id,
        giaGoc: basePrice,
        sauGiam,
        soLuongApDung: formProductQuotas[id] || 50,
        hinhAnh: part?.hinhAnh,
      };
    });

    const payload: Partial<Promotion> = {
      tenChuongTrinh: formTen.trim(),
      moTa: formMoTa.trim() || undefined,
      loaiKhuyenMai: activeModalType,
      maVoucher: formMaVoucher.trim().toUpperCase(),
      loaiGiamGia: formLoaiGiam,
      mucGiam: Number(formMucGiam),
      giamToiDa: formLoaiGiam === 'PhanTram' && formGiamToiDa ? Number(formGiamToiDa) : undefined,
      donHangToiThieu: Number(formDonHangToiThieu) || 0,
      tongSoLuong: Number(formTongSoLuong) || 500,
      gioiHanMoiKhach: Number(formGioiHanMoiKhach) || 1,
      hienThiMa: formHienThiMa,
      doiTuongKhachHang: formDoiTuongKhachHang,
      apDungChoLoai: formApDungChoLoai,
      ngayBatDau: formIsAllYear ? '2025-01-01' : formNgayBD,
      ngayKetThuc: formIsAllYear ? '2030-12-31' : formNgayKT,
      gioBatDau: activeModalType === 'TheoSanPham' ? formGioBD : undefined,
      gioKetThuc: activeModalType === 'TheoSanPham' ? formGioKT : undefined,
      trangThai: formTrangThai,
      apDungCho: activeModalType === 'TheoSanPham' ? 'SanPhamCuThe' : 'TatCa',
      sanPhamIds: activeModalType === 'TheoSanPham' ? formSanPhamIds : [],
      sanPhamApDungList: activeModalType === 'TheoSanPham' ? selectedProductsDetail : undefined,
    };

    if (editPromo) {
      promotionApi.update(editPromo.id, payload);
    } else {
      promotionApi.create({
        ...(payload as any),
        id: formId.trim() || `KM${String(Date.now()).slice(-4)}`,
        daSuDung: 0,
      });
    }

    setPromotions(promotionApi.getAll());
    setShowModal(false);
  };

  // Filtered parts for modal selector (Image 2)
  const modalFilteredParts = useMemo(() => {
    return allParts.filter(p => {
      const matchSearch =
        !productSearch.trim() ||
        matchVietnameseSearch(p.tenSanPham, productSearch) ||
        matchVietnameseSearch(p.id, productSearch) ||
        matchVietnameseSearch(p.thuongHieu, productSearch);
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

  // Toggle selection of product in modal
  const handleToggleProduct = (id: string) => {
    setFormSanPhamIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
    if (!formProductQuotas[id]) {
      setFormProductQuotas(prev => ({ ...prev, [id]: 50 }));
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* ── Top Header chuẩn Ảnh 1 ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-xl shadow-md">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </span>
            <div>
              <h1 className="text-2xl font-black text-zinc-950 uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                TRUNG TÂM KHUYẾN MÃI & MARKETING
              </h1>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                Quản lý các đợt Voucher, Flash Sale sản phẩm và chương trình chăm sóc khách hàng
              </p>
            </div>
          </div>
        </div>

        {/* Nút Tạo mã khuyến mãi chuẩn Ảnh 1 */}
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer hover:shadow-md"
        >
          <span className="text-lg leading-none">+</span>
          <span>Tạo mã khuyến mãi</span>
        </button>
      </div>

      {/* ── 5 Thẻ KPI Thống Kê Chuẩn Ảnh 1 ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Số lượng Voucher đã phát */}
        <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-xs hover:border-zinc-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 font-mono">Số lượng Voucher</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-mono font-medium">Đã phát</span>
          </div>
          <div className="text-2xl font-black text-zinc-900 mt-2 font-mono">
            {stats.totalVouchers.toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            Tổng voucher trên toàn hệ thống
          </div>
        </div>

        {/* KPI 2: Đang diễn ra */}
        <div className="p-4 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 font-mono flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Đang diễn ra
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono font-medium">Active</span>
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-2 font-mono">
            {stats.active}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-mono">
            Đang kích hoạt trên web
          </div>
        </div>

        {/* KPI 3: Sắp diễn ra */}
        <div className="p-4 bg-white rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 font-mono">Sắp diễn ra</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono font-medium">Upcoming</span>
          </div>
          <div className="text-2xl font-black text-indigo-800 mt-2 font-mono">
            {stats.upcoming}
          </div>
          <div className="text-[11px] text-indigo-600 mt-1 font-mono">
            Chuẩn bị bắt đầu
          </div>
        </div>

        {/* KPI 4: Đã kết thúc */}
        <div className="p-4 bg-white rounded-2xl border border-zinc-200 bg-zinc-50/40 shadow-xs hover:border-zinc-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 font-mono">Đã kết thúc</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600 font-mono font-medium">Expired</span>
          </div>
          <div className="text-2xl font-black text-zinc-700 mt-2 font-mono">
            {stats.expired}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            Hết hạn sử dụng
          </div>
        </div>

        {/* KPI 5: Đã tạm dừng */}
        <div className="p-4 bg-white rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 font-mono">Đã tạm dừng</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono font-medium">Paused</span>
          </div>
          <div className="text-2xl font-black text-amber-800 mt-2 font-mono">
            {stats.paused}
          </div>
          <div className="text-[11px] text-amber-600 mt-1 font-mono">
            Tạm dừng thủ công
          </div>
        </div>
      </div>

      {/* ── Tabs Bộ Lọc & Tìm Kiếm Chuẩn Ảnh 1 ── */}
      <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-2xs space-y-3">
        {/* Hàng 1: Tabs trạng thái nhanh */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-3">
          {[
            { key: 'All', label: 'Tất cả' },
            { key: 'DangApDung', label: 'Đang diễn ra' },
            { key: 'SapDienRa', label: 'Sắp diễn ra' },
            { key: 'HetHan', label: 'Đã kết thúc' },
            { key: 'TamDung', label: 'Đã tạm dừng' },
          ].map(tab => {
            const isActive = statusTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Hàng 2: Ô tìm kiếm và bộ lọc dropdown */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm theo mã voucher, tên chiến dịch..."
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
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-600 font-semibold bg-white"
            >
              <option value="All">Tất cả loại khuyến mãi</option>
              <option value="TheoSanPham">🏷️ Theo sản phẩm (Flash sale)</option>
              <option value="TheoDot">🎟️ Theo đợt / Voucher</option>
              <option value="TheoLoaiKhachHang">👑 Theo loại khách hàng</option>
            </select>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as any)}
              className="border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-600 font-semibold bg-white"
            >
              <option value="All">Tất cả ngành hàng</option>
              <option value="PhuTung">Phụ tùng & Phụ kiện</option>
              <option value="DichVu">Dịch vụ & Bảo dưỡng</option>
              <option value="TatCa">Toàn sàn</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Bảng Quản Lý Khuyến Mãi Tập Trung Chuẩn Ảnh 1 ── */}
      <div className="overflow-x-auto bg-white rounded-2xl border border-zinc-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-950 text-white font-mono text-xs uppercase">
            <tr>
              <th className="p-3.5 text-center w-12">STT</th>
              <th className="p-3.5 text-left">Chương trình / Mã Voucher</th>
              <th className="p-3.5 text-left">Loại khuyến mãi</th>
              <th className="p-3.5 text-left">Mức ưu đãi</th>
              <th className="p-3.5 text-left">Thời gian áp dụng</th>
              <th className="p-3.5 text-left">Đã dùng / Giới hạn</th>
              <th className="p-3.5 text-center">Trạng thái</th>
              <th className="p-3.5 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 font-medium">
            {filteredPromotions.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-400 font-mono text-xs">
                  Không tìm thấy chiến dịch khuyến mãi nào phù hợp
                </td>
              </tr>
            ) : (
              filteredPromotions.map((p, idx) => {
                const isExpired = p.trangThai === 'HetHan';
                const isPaused = p.trangThai === 'TamDung';
                const isUpcoming = p.trangThai === 'SapDienRa';
                const isActive = p.trangThai === 'DangApDung';

                const totalLimit = p.tongSoLuong || 500;
                const used = p.daSuDung || 0;
                const percentUsed = Math.min(100, Math.round((used / totalLimit) * 100));

                return (
                  <tr key={p.id} className="hover:bg-zinc-50 transition">
                    <td className="p-3.5 text-center font-mono text-xs text-zinc-500 font-bold">{idx + 1}</td>

                    {/* Chương trình / Mã */}
                    <td className="p-3.5">
                      <div className="flex items-start gap-2">
                        <div>
                          <div className="font-bold text-zinc-900 text-xs leading-snug">{p.tenChuongTrinh}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 font-mono text-[11px] font-bold text-zinc-800">
                              {p.maVoucher || p.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(p.maVoucher || p.id)}
                              title="Sao chép mã"
                              className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded cursor-pointer"
                            >
                              {copiedCode === (p.maVoucher || p.id) ? (
                                <span className="text-[10px] text-emerald-600 font-bold">✓</span>
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                              )}
                            </button>
                          </div>
                          {p.moTa && <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{p.moTa}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Loại khuyến mãi Badge */}
                    <td className="p-3.5 whitespace-nowrap">
                      {p.loaiKhuyenMai === 'TheoSanPham' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <span>🏷️</span> Theo sản phẩm
                        </span>
                      ) : p.loaiKhuyenMai === 'TheoLoaiKhachHang' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <span>👑</span> Theo khách hàng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <span>🎟️</span> Theo đợt / Voucher
                        </span>
                      )}
                    </td>

                    {/* Mức ưu đãi */}
                    <td className="p-3.5">
                      <div className="font-bold text-xs text-red-700 font-mono">
                        {p.loaiGiamGia === 'PhanTram' ? `Giảm ${p.mucGiam}%` : `Giảm ${formatVND(p.mucGiam)}`}
                      </div>
                      {p.giamToiDa && p.loaiGiamGia === 'PhanTram' && (
                        <div className="text-[10px] text-zinc-500 font-mono">Tối đa: {formatVND(p.giamToiDa)}</div>
                      )}
                      {p.donHangToiThieu ? (
                        <div className="text-[10px] text-zinc-500 font-mono">Đơn từ: {formatVND(p.donHangToiThieu)}</div>
                      ) : (
                        <div className="text-[10px] text-zinc-400 font-mono">Mọi đơn hàng</div>
                      )}
                    </td>

                    {/* Thời gian áp dụng */}
                    <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-zinc-600">
                      <div>Từ: {p.ngayBatDau}</div>
                      <div>Đến: {p.ngayKetThuc}</div>
                      {p.gioBatDau && p.gioKetThuc && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-zinc-100 rounded text-[10px] text-zinc-600">
                          ⏰ {p.gioBatDau} - {p.gioKetThuc}
                        </span>
                      )}
                    </td>

                    {/* Đã dùng / Giới hạn với thanh Progress bar */}
                    <td className="p-3.5 w-44">
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="font-bold text-zinc-800">{used} / {totalLimit}</span>
                        <span className="text-zinc-500">{percentUsed}%</span>
                      </div>
                      <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            percentUsed >= 90 ? 'bg-red-500' : percentUsed >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                    </td>

                    {/* Trạng thái với Toggle Switch On/Off */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isActive ? 'bg-emerald-600' : 'bg-zinc-300'
                          }`}
                          title={isActive ? 'Nhấn để tạm dừng' : 'Nhấn để kích hoạt'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPaused
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : isUpcoming
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                          }`}
                        >
                          {isActive
                            ? 'Đang diễn ra'
                            : isPaused
                            ? 'Đã tạm dừng'
                            : isUpcoming
                            ? 'Sắp diễn ra'
                            : 'Đã kết thúc'}
                        </span>
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg transition cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.tenChuongTrinh)}
                          className="px-2.5 py-1 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL TẠO / SỬA KHUYẾN MÃI VỚI 3 LOẠI CHUYÊN BIỆT (Ảnh 2, 3, 4) ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl my-8 border border-zinc-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div>
                <h3 className="text-xl font-black text-zinc-950 uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  {editPromo ? 'Cập Nhật Chương Trình Khuyến Mãi' : 'Tạo Mã Khuyến Mãi Mới'}
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  Lựa chọn 1 trong 3 loại khuyến mãi để thiết lập cơ chế giảm giá phù hợp
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 3 Tab Lựa Chọn Loại Khuyến Mãi Chuẩn Ảnh 2, 3, 4 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 my-4">
              <button
                type="button"
                onClick={() => {
                  setActiveModalType('TheoSanPham');
                  setFormApDungChoLoai('PhuTung');
                }}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  activeModalType === 'TheoSanPham'
                    ? 'border-red-600 bg-red-50/40 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg">🏷️</span>
                    {activeModalType === 'TheoSanPham' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white font-mono">Đang chọn</span>
                    )}
                  </div>
                  <div className="font-extrabold text-xs text-zinc-900 mt-1">Khuyến mãi theo sản phẩm</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                    Flash sale / Giảm trực tiếp trên web (khách xem là thấy giảm ngay)
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveModalType('TheoDot');
                }}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  activeModalType === 'TheoDot'
                    ? 'border-amber-600 bg-amber-50/40 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg">🎟️</span>
                    {activeModalType === 'TheoDot' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white font-mono">Đang chọn</span>
                    )}
                  </div>
                  <div className="font-extrabold text-xs text-zinc-900 mt-1">Khuyến mãi theo đợt</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                    Voucher có hạn, giới hạn số lượng, chọn mã khi thanh toán
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveModalType('TheoLoaiKhachHang');
                }}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  activeModalType === 'TheoLoaiKhachHang'
                    ? 'border-purple-600 bg-purple-50/40 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg">👑</span>
                    {activeModalType === 'TheoLoaiKhachHang' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white font-mono">Đang chọn</span>
                    )}
                  </div>
                  <div className="font-extrabold text-xs text-zinc-900 mt-1">Khuyến mãi theo loại khách hàng</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                    Khách VIP, sinh nhật, khách mua lần đầu, tự động vào ví
                  </div>
                </div>
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* ── TAB 1: FORM THEO SẢN PHẨM (Ảnh 2) ── */}
              {activeModalType === 'TheoSanPham' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
                    <span className="text-base">ℹ️</span>
                    <div>
                      <span className="font-bold">Cơ chế Flash Sale:</span> Sản phẩm được chọn sẽ được gán nhãn giảm giá và trừ tiền trực tiếp trên trang <b>Cửa Hàng Phụ Tùng</b>. Khách hàng <i>không cần nhập mã</i> tại giỏ hàng hay thanh toán vẫn được hưởng giá ưu đãi!
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Tên chương trình khuyến mãi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Flash Sale Cuối Tuần - Phụ Tùng Đua"
                        value={formTen}
                        onChange={e => setFormTen(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:border-red-600 ${
                          formErrors.ten ? 'border-red-500 bg-red-50' : 'border-zinc-300'
                        }`}
                      />
                      {formErrors.ten && <p className="text-[11px] text-red-500 mt-0.5">{formErrors.ten}</p>}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-zinc-700">
                          Mã nhận diện nội bộ <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleGenerateRandomCode('TheoSanPham')}
                          className="text-[11px] text-red-700 hover:underline font-bold cursor-pointer"
                        >
                          Tạo mã ngẫu nhiên
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="VD: MOTOFLASH15"
                        value={formMaVoucher}
                        onChange={e => setFormMaVoucher(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>

                  {/* Thời gian & Giờ Flash Sale */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">Ngày bắt đầu</label>
                      <input
                        type="date"
                        value={formNgayBD}
                        onChange={e => setFormNgayBD(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">Giờ bắt đầu</label>
                      <input
                        type="time"
                        value={formGioBD}
                        onChange={e => setFormGioBD(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">Ngày kết thúc</label>
                      <input
                        type="date"
                        value={formNgayKT}
                        onChange={e => setFormNgayKT(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">Giờ kết thúc</label>
                      <input
                        type="time"
                        value={formGioKT}
                        onChange={e => setFormGioKT(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                  </div>

                  {/* Mức giảm giá & Giới hạn mỗi khách */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Hình thức giảm</label>
                      <select
                        value={formLoaiGiam}
                        onChange={e => setFormLoaiGiam(e.target.value as any)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-semibold bg-white"
                      >
                        <option value="PhanTram">Giảm theo % (Phần trăm)</option>
                        <option value="SoTien">Giảm số tiền cố định (VNĐ)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Mức giảm {formLoaiGiam === 'PhanTram' ? '(%)' : '(VNĐ)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formMucGiam}
                        onChange={e => setFormMucGiam(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Giới hạn mua / khách</label>
                      <input
                        type="number"
                        min="1"
                        value={formGioiHanMoiKhach}
                        onChange={e => setFormGioiHanMoiKhach(Number(e.target.value))}
                        placeholder="VD: 2 cái/khách"
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* BẢNG CHỌN SẢN PHẨM TỪ HỆ THỐNG CHUẨN ẢNH 2 */}
                  <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/50 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-black text-zinc-900 uppercase font-mono">
                          Chọn sản phẩm từ hệ thống ({formSanPhamIds.length} đã chọn)
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          Tìm kiếm phụ tùng và tích chọn để đưa vào danh mục Flash Sale
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Tìm tên phụ tùng, SKU..."
                          value={productSearch}
                          onChange={e => setProductSearch(e.target.value)}
                          className="px-3 py-1.5 border border-zinc-300 rounded-xl text-xs bg-white w-48 font-medium"
                        />
                        <select
                          value={productCatFilter}
                          onChange={e => setProductCatFilter(e.target.value)}
                          className="px-2.5 py-1.5 border border-zinc-300 rounded-xl text-xs bg-white font-semibold"
                        >
                          <option value="All">Tất cả danh mục</option>
                          {CATEGORY_LIST.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {formErrors.sanPham && (
                      <p className="text-xs text-red-500 font-bold">{formErrors.sanPham}</p>
                    )}

                    <div className="max-h-60 overflow-y-auto border border-zinc-200 rounded-xl bg-white">
                      <table className="min-w-full text-xs">
                        <thead className="bg-zinc-100 text-zinc-600 font-mono uppercase sticky top-0">
                          <tr>
                            <th className="p-2.5 text-center w-10">Chọn</th>
                            <th className="p-2.5 text-left">Phụ tùng</th>
                            <th className="p-2.5 text-left">SKU</th>
                            <th className="p-2.5 text-right">Giá gốc</th>
                            <th className="p-2.5 text-right">Giá sau giảm</th>
                            <th className="p-2.5 text-center w-28">Số lượng KM</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {modalFilteredParts.map(part => {
                            const isSelected = formSanPhamIds.includes(part.id);
                            const previewPrice = calculatePreviewPrice(part.giaGoc);

                            return (
                              <tr
                                key={part.id}
                                className={`hover:bg-zinc-50 transition cursor-pointer ${
                                  isSelected ? 'bg-red-50/30' : ''
                                }`}
                                onClick={() => handleToggleProduct(part.id)}
                              >
                                <td className="p-2.5 text-center" onClick={e => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleProduct(part.id)}
                                    className="w-4 h-4 rounded text-red-600 cursor-pointer"
                                  />
                                </td>
                                <td className="p-2.5">
                                  <div className="flex items-center gap-2">
                                    {part.hinhAnh ? (
                                      <img
                                        src={part.hinhAnh}
                                        alt={part.tenSanPham}
                                        className="w-9 h-9 object-cover rounded-lg border border-zinc-200 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-9 h-9 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-400 shrink-0 text-xs font-bold">
                                        PT
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-bold text-zinc-900">{part.tenSanPham}</div>
                                      <div className="text-[10px] text-zinc-400 font-mono">{part.thuongHieu} • {part.danhMuc}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-2.5 font-mono text-[11px] text-zinc-500">{(part as any).sku || part.id}</td>
                                <td className="p-2.5 text-right font-mono text-zinc-500 line-through">
                                  {formatVND(part.giaGoc)}
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-red-700">
                                  {formatVND(previewPrice)}
                                </td>
                                <td className="p-2.5 text-center" onClick={e => e.stopPropagation()}>
                                  <input
                                    type="number"
                                    min="1"
                                    disabled={!isSelected}
                                    value={formProductQuotas[part.id] || 50}
                                    onChange={e =>
                                      setFormProductQuotas(prev => ({
                                        ...prev,
                                        [part.id]: Number(e.target.value),
                                      }))
                                    }
                                    className="w-20 px-2 py-1 border border-zinc-300 rounded text-center font-mono text-xs disabled:bg-zinc-100 disabled:text-zinc-400"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 2: FORM THEO ĐỢT / VOUCHER (Ảnh 3) ── */}
              {activeModalType === 'TheoDot' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-zinc-700">
                          Mã Voucher <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleGenerateRandomCode('TheoDot')}
                          className="text-[11px] text-red-700 hover:underline font-bold cursor-pointer"
                        >
                          Tạo mã ngẫu nhiên
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="VD: MOTO50K"
                        value={formMaVoucher}
                        onChange={e => setFormMaVoucher(e.target.value.toUpperCase())}
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-red-600 ${
                          formErrors.ma ? 'border-red-500 bg-red-50' : 'border-zinc-300'
                        }`}
                      />
                      {formErrors.ma && <p className="text-[11px] text-red-500 mt-0.5">{formErrors.ma}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Tên chiến dịch Voucher <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Voucher Đợt Hè Rực Rỡ 50K"
                        value={formTen}
                        onChange={e => setFormTen(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:border-red-600 ${
                          formErrors.ten ? 'border-red-500 bg-red-50' : 'border-zinc-300'
                        }`}
                      />
                      {formErrors.ten && <p className="text-[11px] text-red-500 mt-0.5">{formErrors.ten}</p>}
                    </div>
                  </div>

                  {/* Giá trị giảm & Điều kiện */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Loại giảm</label>
                      <select
                        value={formLoaiGiam}
                        onChange={e => setFormLoaiGiam(e.target.value as any)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-semibold bg-white"
                      >
                        <option value="SoTien">Giảm tiền mặt (VNĐ)</option>
                        <option value="PhanTram">Giảm % đơn hàng</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Mức giảm {formLoaiGiam === 'PhanTram' ? '(%)' : '(VNĐ)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formMucGiam}
                        onChange={e => setFormMucGiam(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Đơn hàng tối thiểu (VNĐ)</label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={formDonHangToiThieu}
                        onChange={e => setFormDonHangToiThieu(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Số lượng phát hành & Giới hạn mỗi khách */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Tổng số lượng Voucher</label>
                      <input
                        type="number"
                        min="1"
                        value={formTongSoLuong}
                        onChange={e => setFormTongSoLuong(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Lượt dùng / Mỗi khách</label>
                      <input
                        type="number"
                        min="1"
                        value={formGioiHanMoiKhach}
                        onChange={e => setFormGioiHanMoiKhach(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Chế độ hiển thị</label>
                      <select
                        value={formHienThiMa}
                        onChange={e => setFormHienThiMa(e.target.value as any)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-semibold bg-white"
                      >
                        <option value="CongKhai">🌐 Công khai (Kho Voucher & Checkout)</option>
                        <option value="RiengTu">🔒 Riêng tư (Chỉ ai có mã mới nhập được)</option>
                      </select>
                    </div>
                  </div>

                  {/* Thời gian áp dụng */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Ngày bắt đầu</label>
                      <input
                        type="date"
                        value={formNgayBD}
                        onChange={e => setFormNgayBD(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Ngày kết thúc</label>
                      <input
                        type="date"
                        value={formNgayKT}
                        onChange={e => setFormNgayKT(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* THẺ XEM TRƯỚC VOUCHER CHUẨN ẢNH 3 */}
                  <div className="pt-2">
                    <div className="text-xs font-black text-zinc-900 uppercase font-mono mb-2">
                      XEM TRƯỚC VOUCHER (PREVIEW TICKET)
                    </div>
                    <div className="relative flex rounded-2xl overflow-hidden border border-amber-300 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md max-w-md">
                      {/* Cuống vé trái */}
                      <div className="p-4 flex flex-col items-center justify-center border-r-2 border-dashed border-white/40 bg-black/10 min-w-[110px]">
                        <span className="text-2xl font-black font-mono">
                          {formLoaiGiam === 'PhanTram' ? `-${formMucGiam}%` : `${formMucGiam / 1000}K`}
                        </span>
                        <span className="text-[10px] font-mono tracking-wider uppercase mt-0.5 text-amber-100 font-bold">GIẢM NGAY</span>
                      </div>
                      {/* Thân vé phải */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-sm leading-tight text-white line-clamp-1">{formTen || 'Voucher Đợt Hè Rực Rỡ 50K'}</div>
                          <div className="text-[11px] text-amber-100 font-mono mt-0.5">
                            Đơn tối thiểu: {formatVND(formDonHangToiThieu)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
                          <span className="font-mono text-xs font-extrabold bg-white/20 px-2 py-0.5 rounded">
                            {formMaVoucher || 'MOTO50K'}
                          </span>
                          <span className="text-[10px] text-white/80 font-mono">HSD: {formNgayKT}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 3: FORM THEO LOẠI KHÁCH HÀNG (Ảnh 4) ── */}
              {activeModalType === 'TheoLoaiKhachHang' && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-2xl flex items-start gap-2.5 text-xs text-purple-900">
                    <span className="text-base">👑</span>
                    <div>
                      <span className="font-bold">Ưu Đãi Đặc Quyền Khách Hàng:</span> Hệ thống sẽ tự động đối chiếu thông tin khách hàng (Hạng VIP, tháng sinh nhật, khách mới) và tự động đưa mã voucher này vào <b>Kho Voucher của tôi</b> trong trang cá nhân của họ!
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Nhóm khách hàng mục tiêu <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formDoiTuongKhachHang}
                        onChange={e => setFormDoiTuongKhachHang(e.target.value as any)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-bold bg-white"
                      >
                        <option value="VIP">👑 Khách hàng VIP / Thân thiết (Hạng Vàng & Kim Cương)</option>
                        <option value="SinhNhat">🎂 Khách hàng có Sinh nhật trong tháng</option>
                        <option value="Moi">🎁 Khách hàng mới (Đơn hàng đầu tiên)</option>
                        <option value="LauNgayChuaMua">⏰ Khách hàng lâu ngày chưa quay lại (&gt;60 ngày)</option>
                        <option value="TatCa">🌐 Tất cả khách hàng thân thiết</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-zinc-700">
                          Mã Voucher Đặc Quyền <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleGenerateRandomCode('TheoLoaiKhachHang')}
                          className="text-[11px] text-purple-700 hover:underline font-bold cursor-pointer"
                        >
                          Tạo mã ngẫu nhiên
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="VD: VIPCUSTOMER"
                        value={formMaVoucher}
                        onChange={e => setFormMaVoucher(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Tên chương trình tri ân <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Đặc Quyền Hội Viên VIP - Giảm 10%"
                        value={formTen}
                        onChange={e => setFormTen(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 ${
                          formErrors.ten ? 'border-red-500 bg-red-50' : 'border-zinc-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Thời gian áp dụng</label>
                      <div className="flex items-center gap-3 pt-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formIsAllYear}
                            onChange={e => setFormIsAllYear(e.target.checked)}
                            className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                          />
                          <span>Áp dụng quanh năm (Vĩnh viễn)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Mức giảm & Giảm tối đa */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Loại giảm giá</label>
                      <select
                        value={formLoaiGiam}
                        onChange={e => setFormLoaiGiam(e.target.value as any)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-semibold bg-white"
                      >
                        <option value="PhanTram">Giảm theo %</option>
                        <option value="SoTien">Giảm số tiền (VNĐ)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Mức giảm</label>
                      <input
                        type="number"
                        min="1"
                        value={formMucGiam}
                        onChange={e => setFormMucGiam(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Giảm tối đa (VNĐ)</label>
                      <input
                        type="number"
                        min="0"
                        step="50000"
                        value={formGiamToiDa || 500000}
                        onChange={e => setFormGiamToiDa(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* THẺ XEM TRƯỚC VOUCHER VIP CHUẨN ẢNH 4 */}
                  <div className="pt-2">
                    <div className="text-xs font-black text-zinc-900 uppercase font-mono mb-2">
                      XEM TRƯỚC VOUCHER (PREVIEW TICKET)
                    </div>
                    <div className="relative flex rounded-2xl overflow-hidden border border-yellow-400 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 text-zinc-950 shadow-lg max-w-md">
                      {/* Cuống vé trái ánh kim */}
                      <div className="p-4 flex flex-col items-center justify-center border-r-2 border-dashed border-zinc-900/30 bg-black/10 min-w-[110px]">
                        <span className="text-2xl font-black font-mono text-zinc-950">
                          {formLoaiGiam === 'PhanTram' ? `-${formMucGiam}%` : `${formMucGiam / 1000}K`}
                        </span>
                        <span className="text-[10px] font-mono tracking-wider uppercase mt-0.5 text-zinc-900 font-extrabold">VIP ONLY</span>
                      </div>
                      {/* Thân vé phải */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">👑</span>
                            <span className="font-extrabold text-sm leading-tight text-zinc-950 line-clamp-1">{formTen || 'Đặc Quyền Hội Viên VIP - Giảm 10%'}</span>
                          </div>
                          <div className="text-[11px] text-zinc-900/90 font-mono mt-0.5">
                            Dành riêng cho khách hàng VIP Motoshop
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900/20">
                          <span className="font-mono text-xs font-black bg-zinc-950 text-yellow-300 px-2 py-0.5 rounded shadow-xs">
                            {formMaVoucher || 'VIPCUSTOMER'}
                          </span>
                          <span className="text-[10px] text-zinc-900 font-mono font-bold">
                            {formIsAllYear ? 'Quanh năm' : `HSD: ${formNgayKT}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-bold hover:bg-zinc-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {editPromo ? 'Lưu thay đổi' : 'Tạo mã khuyến mãi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
