import React, { useState, useMemo, useEffect } from 'react';
import {
  type Supplier,
  type PurchaseReceipt,
  type ReceiptItem,
  type StaffAccount,
  mockSuppliers,
  mockPurchaseReceipts,
  mockParts,
  formatVND,
} from '../../data/mockData';
import { VIETNAM_LOCATIONS } from '../../data/vietnamLocations';
import { catalogVehicleApi, DEFAULT_CATALOG_VEHICLES, partApi } from '../../services/api';

const SUPPLIERS_STORAGE_KEY = 'crm_suppliers';
const RECEIPTS_STORAGE_KEY = 'crm_purchase_receipts';

interface SuppliersPageProps {
  currentStaff?: StaffAccount | null;
}

export default function SuppliersPage({ currentStaff }: SuppliersPageProps) {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'receipts'>('suppliers');

  // Phân quyền: Admin (SuperAdmin hoặc khi không có staff chỉ định) vs Nhân viên
  const isAdmin = !currentStaff || currentStaff.vaiTro === 'SuperAdmin';
  const currentStaffDisplayName = currentStaff
    ? `${currentStaff.hoTen}${currentStaff.chucVu ? ` (${currentStaff.chucVu})` : ''}`
    : 'Lê Văn Kỹ Thuật (Thủ kho)';

  // ─────────────────────────────────────────────────────────────
  // 1. SUPPLIERS STATE & PERSISTENCE
  // ─────────────────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(SUPPLIERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return mockSuppliers;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(suppliers));
    } catch {
      // ignore
    }
  }, [suppliers]);

  // Suppliers Filter
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierStatusFilter, setSupplierStatusFilter] = useState<'All' | 'DangHopTac' | 'TamNgung'>('All');

  // Suppliers Modals
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Supplier Form Data
  const [supplierFormData, setSupplierFormData] = useState<{
    tenNhaCungCap: string;
    maSoThue: string;
    nguoiLienHe: string;
    soDienThoai: string;
    email: string;
    tinhThanh: string;
    quanHuyen: string;
    phuongXa: string;
    soNhaDuong: string;
    nganHang: string;
    soTaiKhoan: string;
    chuKyThanhToan: string;
    nhomHang: string[];
    chietKhau: number;
    danhGia: number;
    trangThai: 'DangHopTac' | 'TamNgung';
    ghiChu: string;
  }>({
    tenNhaCungCap: '',
    maSoThue: '',
    nguoiLienHe: '',
    soDienThoai: '',
    email: '',
    tinhThanh: VIETNAM_LOCATIONS[0]?.name || '',
    quanHuyen: VIETNAM_LOCATIONS[0]?.districts[0]?.name || '',
    phuongXa: VIETNAM_LOCATIONS[0]?.districts[0]?.wards[0] || '',
    soNhaDuong: '',
    nganHang: 'Vietcombank',
    soTaiKhoan: '',
    chuKyThanhToan: '30 ngày',
    nhomHang: ['Phụ tùng chính hãng'],
    chietKhau: 15,
    danhGia: 5.0,
    trangThai: 'DangHopTac',
    ghiChu: '',
  });

  const [supplierErrors, setSupplierErrors] = useState<{
    maSoThue?: string;
    soDienThoai?: string;
    tenNhaCungCap?: string;
  }>({});

  // Cascaded address options
  const selectedProvince = useMemo(() => {
    return VIETNAM_LOCATIONS.find(p => p.name === supplierFormData.tinhThanh) || VIETNAM_LOCATIONS[0];
  }, [supplierFormData.tinhThanh]);

  const districtOptions = useMemo(() => {
    return selectedProvince?.districts || [];
  }, [selectedProvince]);

  const selectedDistrict = useMemo(() => {
    return districtOptions.find(d => d.name === supplierFormData.quanHuyen) || districtOptions[0];
  }, [districtOptions, supplierFormData.quanHuyen]);

  const wardOptions = useMemo(() => {
    return selectedDistrict?.wards || [];
  }, [selectedDistrict]);

  // ─────────────────────────────────────────────────────────────
  // 2. PURCHASE RECEIPTS STATE & PERSISTENCE
  // ─────────────────────────────────────────────────────────────
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>(() => {
    try {
      const saved = localStorage.getItem(RECEIPTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return mockPurchaseReceipts;
  });

  useEffect(() => {
    try {
      localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(receipts));
    } catch {
      // ignore
    }
  }, [receipts]);

  // K04: Advanced Receipts Filters
  const [receiptSearch, setReceiptSearch] = useState('');
  const [receiptSupplierFilter, setReceiptSupplierFilter] = useState('All');
  const [receiptStaffFilter, setReceiptStaffFilter] = useState('All');
  const [receiptTypeFilter, setReceiptTypeFilter] = useState<'All' | 'XeMay' | 'PhuTung' | 'HonHop'>('All');
  const [receiptDateRange, setReceiptDateRange] = useState<'All' | 'Today' | '7Days' | '30Days' | 'Custom'>('All');
  const [receiptFromDate, setReceiptFromDate] = useState('');
  const [receiptToDate, setReceiptToDate] = useState('');
  const [receiptStatusFilter, setReceiptStatusFilter] = useState('All');

  // K05: Sorting state
  const [receiptSortBy, setReceiptSortBy] = useState<'ngayNhap' | 'id' | 'tenNhaCungCap' | 'tongTien'>('ngayNhap');
  const [receiptSortOrder, setReceiptSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selected receipt modal
  const [selectedReceipt, setSelectedReceipt] = useState<PurchaseReceipt | null>(null);
  const [showNewReceiptModal, setShowNewReceiptModal] = useState(false);

  // Available catalogs for K02 & K03
  const availableParts = useMemo(() => {
    try {
      const parts = partApi.getAllSync();
      if (parts && parts.length > 0) return parts;
    } catch {}
    return mockParts;
  }, []);

  const availableVehicles = useMemo(() => {
    try {
      const vehs = catalogVehicleApi.getAllSync();
      if (vehs && vehs.length > 0) return vehs;
    } catch {}
    return DEFAULT_CATALOG_VEHICLES;
  }, []);

  // Form for New Receipt (K01, K02, K03)
  const [newNccId, setNewNccId] = useState(suppliers[0]?.id || 'NCC001');
  const [newNguoiGiao, setNewNguoiGiao] = useState('');
  const [newSdtGiao, setNewSdtGiao] = useState('');
  const [newGhiChu, setNewGhiChu] = useState('');
  const [newItems, setNewItems] = useState<{
    id: string;
    loai: 'PhuTung' | 'XeMay';
    maSanPham: string;
    tenSanPham: string;
    donViTinh: string;
    soLuong: number;
    donGiaNhap: number;
  }[]>([
    {
      id: 'row-1',
      loai: 'PhuTung',
      maSanPham: mockParts[0]?.id || 'PT001',
      tenSanPham: mockParts[0]?.tenSanPham || 'Nhớt Motul 7100 4T 10W40 1L',
      donViTinh: 'Chai',
      soLuong: 20,
      donGiaNhap: 220000,
    },
  ]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. FILTERED & SORTED DATA
  // ─────────────────────────────────────────────────────────────
  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const q = supplierSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.id.toLowerCase().includes(q) ||
        s.tenNhaCungCap.toLowerCase().includes(q) ||
        s.soDienThoai.includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.maSoThue.includes(q);
      const matchStatus = supplierStatusFilter === 'All' || s.trangThai === supplierStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [suppliers, supplierSearch, supplierStatusFilter]);

  // Distinct Staff list from receipts for filter
  const distinctStaffList = useMemo(() => {
    const set = new Set<string>();
    receipts.forEach(r => {
      if (r.nguoiLap) set.add(r.nguoiLap);
    });
    return Array.from(set);
  }, [receipts]);

  // Filtered & Sorted receipts (K04, K05)
  const filteredAndSortedReceipts = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const d7AgoStr = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const d30AgoStr = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const filtered = receipts.filter(r => {
      // 1. Text search
      const q = receiptSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.tenNhaCungCap.toLowerCase().includes(q) ||
        r.nguoiLap.toLowerCase().includes(q) ||
        (r.nguoiGiaoHang && r.nguoiGiaoHang.toLowerCase().includes(q));

      // 2. Supplier
      const matchSupplier = receiptSupplierFilter === 'All' || r.nhaCungCapId === receiptSupplierFilter;

      // 3. Staff
      const matchStaff = receiptStaffFilter === 'All' || r.nguoiLap === receiptStaffFilter;

      // 4. Status
      const matchStatus = receiptStatusFilter === 'All' || r.trangThai === receiptStatusFilter;

      // 5. Item Type (Xe / Phụ tùng / Cả hai)
      let matchType = true;
      if (receiptTypeFilter !== 'All') {
        const hasXe = r.chiTiet.some(it => it.loai === 'XeMay');
        const hasPT = r.chiTiet.some(it => it.loai === 'PhuTung');
        if (receiptTypeFilter === 'XeMay') matchType = hasXe && !hasPT;
        else if (receiptTypeFilter === 'PhuTung') matchType = hasPT && !hasXe;
        else if (receiptTypeFilter === 'HonHop') matchType = hasXe && hasPT;
      }

      // 6. Date Range
      let matchDate = true;
      const rDate = r.ngayNhap.slice(0, 10);
      if (receiptDateRange === 'Today') {
        matchDate = rDate === todayStr;
      } else if (receiptDateRange === '7Days') {
        matchDate = rDate >= d7AgoStr;
      } else if (receiptDateRange === '30Days') {
        matchDate = rDate >= d30AgoStr;
      } else if (receiptDateRange === 'Custom') {
        if (receiptFromDate && rDate < receiptFromDate) matchDate = false;
        if (receiptToDate && rDate > receiptToDate) matchDate = false;
      }

      return matchSearch && matchSupplier && matchStaff && matchStatus && matchType && matchDate;
    });

    // K05: Sorting
    return filtered.sort((a, b) => {
      let cmp = 0;
      if (receiptSortBy === 'ngayNhap') {
        cmp = a.ngayNhap.localeCompare(b.ngayNhap);
      } else if (receiptSortBy === 'id') {
        cmp = a.id.localeCompare(b.id);
      } else if (receiptSortBy === 'tenNhaCungCap') {
        cmp = a.tenNhaCungCap.localeCompare(b.tenNhaCungCap);
      } else if (receiptSortBy === 'tongTien') {
        cmp = a.tongTien - b.tongTien;
      }
      return receiptSortOrder === 'desc' ? -cmp : cmp;
    });
  }, [
    receipts,
    receiptSearch,
    receiptSupplierFilter,
    receiptStaffFilter,
    receiptStatusFilter,
    receiptTypeFilter,
    receiptDateRange,
    receiptFromDate,
    receiptToDate,
    receiptSortBy,
    receiptSortOrder,
  ]);

  // Metrics
  const totalSuppliersCount = suppliers.length;
  const activeSuppliersCount = suppliers.filter(s => s.trangThai === 'DangHopTac').length;
  const totalReceiptsValue = receipts.reduce((sum, r) => sum + r.tongTien, 0);
  const completedReceiptsCount = receipts.filter(r => r.trangThai === 'DaNhapKho').length;
  const pendingReceiptsCount = receipts.filter(r => r.trangThai === 'ChoDuyet').length;

  // ─────────────────────────────────────────────────────────────
  // 4. VALIDATIONS (NCC03 & NCC04)
  // ─────────────────────────────────────────────────────────────
  function validateTaxCode(tax: string, currentId?: string): string | undefined {
    const clean = tax.trim();
    if (!clean) return 'Mã số thuế không được để trống!';
    if (!/^\d+$/.test(clean)) return 'Mã số thuế chỉ được chứa các chữ số!';
    if (clean.length < 10 || clean.length > 13) {
      return 'Mã số thuế phải có từ 10 đến 13 chữ số!';
    }
    const isDuplicate = suppliers.some(s => s.id !== currentId && s.maSoThue.trim() === clean);
    if (isDuplicate) return 'Mã số thuế này đã tồn tại ở nhà cung cấp khác!';
    return undefined;
  }

  function validatePhoneNumber(phone: string, currentId?: string): string | undefined {
    const clean = phone.trim().replace(/\s+/g, '');
    if (!clean) return 'Số điện thoại không được để trống!';
    if (!/^\d+$/.test(clean)) return 'Số điện thoại chỉ được chứa chữ số!';
    if (!/^(03|05|07|08|09)\d{8}$/.test(clean)) {
      return 'SĐT phải đúng 10 số và bắt đầu bằng 03, 05, 07, 08 hoặc 09!';
    }
    const isDuplicate = suppliers.some(
      s => s.id !== currentId && s.soDienThoai.trim().replace(/\s+/g, '') === clean
    );
    if (isDuplicate) return 'Số điện thoại này đã được sử dụng bởi nhà cung cấp khác!';
    return undefined;
  }

  // ─────────────────────────────────────────────────────────────
  // 5. SUPPLIERS CRUD HANDLERS
  // ─────────────────────────────────────────────────────────────
  function openAddSupplierModal() {
    setEditingSupplier(null);
    const defaultProv = VIETNAM_LOCATIONS[0];
    const defaultDist = defaultProv.districts[0];
    const defaultWard = defaultDist.wards[0];

    setSupplierFormData({
      tenNhaCungCap: '',
      maSoThue: '',
      nguoiLienHe: '',
      soDienThoai: '',
      email: '',
      tinhThanh: defaultProv.name,
      quanHuyen: defaultDist.name,
      phuongXa: defaultWard,
      soNhaDuong: '',
      nganHang: 'Vietcombank',
      soTaiKhoan: '',
      chuKyThanhToan: '30 ngày',
      nhomHang: ['Phụ tùng chính hãng'],
      chietKhau: 15,
      danhGia: 5.0,
      trangThai: 'DangHopTac',
      ghiChu: '',
    });
    setSupplierErrors({});
    setShowSupplierModal(true);
  }

  function openEditSupplierModal(s: Supplier) {
    setEditingSupplier(s);
    let prov = VIETNAM_LOCATIONS.find(p => p.name === s.tinhThanh) || VIETNAM_LOCATIONS[0];
    let dist = prov.districts.find(d => d.name === s.quanHuyen) || prov.districts[0];
    let ward = dist.wards.find(w => w === s.phuongXa) || dist.wards[0];

    setSupplierFormData({
      tenNhaCungCap: s.tenNhaCungCap,
      maSoThue: s.maSoThue,
      nguoiLienHe: s.nguoiLienHe,
      soDienThoai: s.soDienThoai,
      email: s.email,
      tinhThanh: s.tinhThanh || prov.name,
      quanHuyen: s.quanHuyen || dist.name,
      phuongXa: s.phuongXa || ward,
      soNhaDuong: s.soNhaDuong || '',
      nganHang: s.nganHang || 'Vietcombank',
      soTaiKhoan: s.soTaiKhoan || '',
      chuKyThanhToan: s.chuKyThanhToan || '30 ngày',
      nhomHang: s.nhomHang || ['Phụ tùng chính hãng'],
      chietKhau: s.chietKhau ?? 15,
      danhGia: s.danhGia ?? 5.0,
      trangThai: s.trangThai || 'DangHopTac',
      ghiChu: s.ghiChu || '',
    });
    setSupplierErrors({});
    setShowSupplierModal(true);
  }

  function handleSaveSupplier(e: React.FormEvent) {
    e.preventDefault();
    const currentId = editingSupplier?.id;
    const mstErr = validateTaxCode(supplierFormData.maSoThue, currentId);
    const sdtErr = validatePhoneNumber(supplierFormData.soDienThoai, currentId);
    let tenErr = undefined;
    if (!supplierFormData.tenNhaCungCap.trim()) {
      tenErr = 'Tên nhà cung cấp không được để trống!';
    }

    if (mstErr || sdtErr || tenErr) {
      setSupplierErrors({ maSoThue: mstErr, soDienThoai: sdtErr, tenNhaCungCap: tenErr });
      return;
    }

    const fullAddress = [
      supplierFormData.soNhaDuong.trim(),
      supplierFormData.phuongXa,
      supplierFormData.quanHuyen,
      supplierFormData.tinhThanh,
    ]
      .filter(Boolean)
      .join(', ');

    if (editingSupplier) {
      const updated: Supplier = {
        ...editingSupplier,
        ...supplierFormData,
        soDienThoai: supplierFormData.soDienThoai.trim().replace(/\s+/g, ''),
        maSoThue: supplierFormData.maSoThue.trim(),
        diaChi: fullAddress,
      };
      setSuppliers(prev => prev.map(s => (s.id === editingSupplier.id ? updated : s)));
      if (detailSupplier && detailSupplier.id === editingSupplier.id) {
        setDetailSupplier(updated);
      }
      showToast(`✓ Cập nhật nhà cung cấp ${updated.tenNhaCungCap} thành công!`);
    } else {
      const maxNum = suppliers.reduce((max, s) => {
        const match = s.id.match(/\d+/);
        return match ? Math.max(max, parseInt(match[0], 10)) : max;
      }, 0);
      const newId = `NCC${String(maxNum + 1).padStart(3, '0')}`;

      const created: Supplier = {
        id: newId,
        tenNhaCungCap: supplierFormData.tenNhaCungCap.trim(),
        maSoThue: supplierFormData.maSoThue.trim(),
        nguoiLienHe: supplierFormData.nguoiLienHe.trim() || 'Người đại diện',
        soDienThoai: supplierFormData.soDienThoai.trim().replace(/\s+/g, ''),
        email: supplierFormData.email.trim() || `contact@${newId.toLowerCase()}.vn`,
        tinhThanh: supplierFormData.tinhThanh,
        quanHuyen: supplierFormData.quanHuyen,
        phuongXa: supplierFormData.phuongXa,
        soNhaDuong: supplierFormData.soNhaDuong.trim(),
        diaChi: fullAddress,
        nganHang: supplierFormData.nganHang,
        soTaiKhoan: supplierFormData.soTaiKhoan.trim(),
        chuKyThanhToan: supplierFormData.chuKyThanhToan,
        ngayHopTac: new Date().toISOString().slice(0, 10),
        nhomHang: supplierFormData.nhomHang.length ? supplierFormData.nhomHang : ['Phụ tùng chính hãng'],
        chietKhau: Number(supplierFormData.chietKhau) || 10,
        danhGia: Number(supplierFormData.danhGia) || 5.0,
        trangThai: supplierFormData.trangThai,
        ghiChu: supplierFormData.ghiChu,
        soLuongMatHang: 5,
      };

      setSuppliers(prev => [created, ...prev]);
      showToast(`✓ Thêm thành công nhà cung cấp mới ${created.tenNhaCungCap} (${created.id})!`);
    }

    setShowSupplierModal(false);
  }

  function handleDeleteSupplier(id: string, name: string) {
    if (confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${name}" (${id})?`)) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
      if (detailSupplier?.id === id) setDetailSupplier(null);
      showToast(`Đã xóa nhà cung cấp ${id}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. RECEIPTS HANDLERS (K01 - K05, NHÂN VIÊN TẠO - ADMIN DUYỆT)
  // ─────────────────────────────────────────────────────────────
  function handleOpenCreateReceiptModal() {
    setNewNccId(suppliers[0]?.id || 'NCC001');
    setNewNguoiGiao('');
    setNewSdtGiao('');
    setNewGhiChu('');
    // Row mặc định
    setNewItems([
      {
        id: `row-${Date.now()}-1`,
        loai: 'PhuTung',
        maSanPham: availableParts[0]?.id || 'PT001',
        tenSanPham: availableParts[0]?.tenSanPham || 'Nhớt Motul 7100 4T 10W40 1L',
        donViTinh: 'Chai',
        soLuong: 20,
        donGiaNhap: Math.round((availableParts[0]?.giaGoc || 290000) * 0.75),
      },
    ]);
    setShowNewReceiptModal(true);
  }

  function handleAddReceiptRow(type: 'PhuTung' | 'XeMay') {
    if (type === 'XeMay') {
      const defaultVeh = availableVehicles[0];
      setNewItems(prev => [
        ...prev,
        {
          id: `row-${Date.now()}-${prev.length + 1}`,
          loai: 'XeMay',
          maSanPham: defaultVeh?.id || 'XM001',
          tenSanPham: defaultVeh?.tenXe || 'Honda SH 160i ABS 2025',
          donViTinh: 'Chiếc',
          soLuong: 1,
          donGiaNhap: Math.round((defaultVeh?.giaNiemYet || 95900000) * 0.85),
        },
      ]);
    } else {
      const defaultPt = availableParts[0];
      setNewItems(prev => [
        ...prev,
        {
          id: `row-${Date.now()}-${prev.length + 1}`,
          loai: 'PhuTung',
          maSanPham: defaultPt?.id || 'PT001',
          tenSanPham: defaultPt?.tenSanPham || 'Nhớt Motul 7100 4T 10W40 1L',
          donViTinh: 'Chai',
          soLuong: 10,
          donGiaNhap: Math.round((defaultPt?.giaGoc || 290000) * 0.75),
        },
      ]);
    }
  }

  function handleRemoveReceiptRow(idx: number) {
    if (newItems.length <= 1) {
      alert('Phiếu nhập phải có ít nhất 1 mặt hàng!');
      return;
    }
    setNewItems(prev => prev.filter((_, i) => i !== idx));
  }

  // K02 & K03: Đổi sản phẩm trong danh mục có sẵn
  function handleChangeItemProduct(idx: number, newId: string, loai: 'PhuTung' | 'XeMay') {
    if (loai === 'XeMay') {
      const veh = availableVehicles.find(v => v.id === newId) || availableVehicles[0];
      setNewItems(prev =>
        prev.map((it, i) =>
          i === idx
            ? {
                ...it,
                loai: 'XeMay',
                maSanPham: veh.id,
                tenSanPham: veh.tenXe,
                donViTinh: 'Chiếc',
                donGiaNhap: Math.round(veh.giaNiemYet * 0.85),
              }
            : it
        )
      );
    } else {
      const pt = availableParts.find(p => p.id === newId) || availableParts[0];
      setNewItems(prev =>
        prev.map((it, i) =>
          i === idx
            ? {
                ...it,
                loai: 'PhuTung',
                maSanPham: pt.id,
                tenSanPham: pt.tenSanPham,
                donViTinh: pt.danhMuc === 'Nhớt' ? 'Chai' : pt.danhMuc === 'Lốp xe' ? 'Cái' : 'Bộ',
                donGiaNhap: Math.round(pt.giaGoc * 0.75),
              }
            : it
        )
      );
    }
  }

  // Tạo phiếu nhập: Nhân viên tạo -> Chờ duyệt
  function handleCreateReceipt(e: React.FormEvent) {
    e.preventDefault();
    const targetNcc = suppliers.find(s => s.id === newNccId) || suppliers[0];
    const total = newItems.reduce((sum, item) => sum + item.soLuong * item.donGiaNhap, 0);

    const now = new Date();
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Tạo mã phiếu tăng dần
    const maxNum = receipts.reduce((max, r) => {
      const m = r.id.match(/\d+/);
      return m ? Math.max(max, parseInt(m[0], 10)) : max;
    }, 2025000);
    const newId = `PN-${maxNum + 1}`;

    const newReceipt: PurchaseReceipt = {
      id: newId,
      nhaCungCapId: targetNcc.id,
      tenNhaCungCap: targetNcc.tenNhaCungCap,
      ngayLap: nowStr,
      ngayNhap: nowStr,
      nguoiLap: currentStaffDisplayName, // K01: Tự động điền theo tài khoản đang đăng nhập
      nguoiGiaoHang: newNguoiGiao || 'Đại diện kho vận',
      soDienThoaiGiao: newSdtGiao || targetNcc.soDienThoai,
      tongTien: total,
      trangThai: 'ChoDuyet', // Nhân viên tạo -> Bắt buộc Chờ duyệt
      ghiChu: newGhiChu || 'Nhập hàng bổ sung theo hợp đồng phân phối',
      chiTiet: newItems.map((item, idx) => ({
        id: `CT-${newId}-${idx + 1}`,
        maSanPham: item.maSanPham,
        tenSanPham: item.tenSanPham,
        loai: item.loai,
        donViTinh: item.donViTinh,
        soLuong: item.soLuong,
        donGiaNhap: item.donGiaNhap,
        thanhTien: item.soLuong * item.donGiaNhap,
      })),
    };

    setReceipts(prev => [newReceipt, ...prev]);
    setShowNewReceiptModal(false);
    setSelectedReceipt(newReceipt);
    showToast(`✓ Đã tạo phiếu nhập ${newReceipt.id} (Trạng thái: ⏳ CHỜ ADMIN DUYỆT)`);
  }

  // Admin Duyệt phiếu: chuyển trạng thái sang DaNhapKho (KHÔNG xử lý tồn kho vì đây là CRM)
  function handleApproveReceipt(id: string) {
    if (!isAdmin) {
      alert('Chỉ tài khoản Quản trị viên (SuperAdmin) mới có quyền phê duyệt phiếu nhập kho!');
      return;
    }

    setReceipts(prev =>
      prev.map(r => (r.id === id ? { ...r, trangThai: 'DaNhapKho' as const } : r))
    );

    if (selectedReceipt && selectedReceipt.id === id) {
      setSelectedReceipt(prev => (prev ? { ...prev, trangThai: 'DaNhapKho' } : null));
    }

    showToast(`✓ Admin đã phê duyệt thành công phiếu nhập kho #${id}!`);
  }

  // Hủy phiếu nhập kho
  function handleCancelReceipt(id: string) {
    if (confirm(`Bạn có chắc chắn muốn hủy phiếu nhập kho #${id}?`)) {
      setReceipts(prev =>
        prev.map(r => (r.id === id ? { ...r, trangThai: 'DaHuy' as const } : r))
      );
      if (selectedReceipt && selectedReceipt.id === id) {
        setSelectedReceipt(prev => (prev ? { ...prev, trangThai: 'DaHuy' } : null));
      }
      showToast(`Đã chuyển phiếu nhập #${id} sang trạng thái Đã hủy.`);
    }
  }

  // K05: Đổi thứ tự sắp xếp theo cột
  function handleToggleSort(column: 'ngayNhap' | 'id' | 'tenNhaCungCap' | 'tongTien') {
    if (receiptSortBy === column) {
      setReceiptSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setReceiptSortBy(column);
      setReceiptSortOrder(column === 'ngayNhap' || column === 'tongTien' ? 'desc' : 'asc');
    }
  }

  // Table styles
  const thSt: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 11,
    fontWeight: 700,
    textAlign: 'left',
    color: 'var(--color-zinc-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontFamily: 'var(--font-mono)',
    whiteSpace: 'nowrap',
    background: 'var(--color-zinc-50)',
    userSelect: 'none',
  };

  const tdSt: React.CSSProperties = {
    padding: '13px 16px',
    fontSize: 13,
    color: 'var(--color-zinc-800)',
    borderTop: '1px solid var(--color-zinc-100)',
    verticalAlign: 'middle',
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Toast notification ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium border border-zinc-700 animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--color-zinc-900)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            QUẢN LÝ NHÀ CUNG CẤP & NHẬP KHO
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--color-zinc-500)' }}>
            Quản lý nhà phân phối, lập phiếu nhập kho (nhân viên tạo, admin duyệt) và tra cứu lịch sử chứng từ
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {activeTab === 'suppliers' ? (
            <button
              onClick={openAddSupplierModal}
              className="px-4 py-2.5 rounded-xl text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md hover:brightness-110"
              style={{ background: 'var(--color-red-700)', fontFamily: 'var(--font-mono)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              + THÊM NHÀ CUNG CẤP
            </button>
          ) : (
            <button
              onClick={handleOpenCreateReceiptModal}
              className="px-4 py-2.5 rounded-xl text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md hover:brightness-110"
              style={{ background: 'var(--color-red-700)', fontFamily: 'var(--font-mono)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              + TẠO PHIẾU NHẬP KHO
            </button>
          )}
        </div>
      </div>

      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-500 font-mono">TỔNG NHÀ CUNG CẤP</div>
          <div className="text-2xl font-black text-zinc-900 mt-1 font-display">
            {totalSuppliersCount}{' '}
            <span className="text-xs font-semibold text-emerald-600">
              ({activeSuppliersCount} đang hợp tác)
            </span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-500 font-mono">TỔNG GIÁ TRỊ NHẬP KHO</div>
          <div className="text-2xl font-black text-red-700 mt-1 font-display">
            {formatVND(totalReceiptsValue)}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-500 font-mono">PHIẾU ĐÃ NHẬP KHO</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-display">
            {completedReceiptsCount} <span className="text-xs font-semibold text-zinc-400">phiếu</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-500 font-mono">CHỜ ADMIN PHÊ DUYỆT</div>
          <div className="text-2xl font-black text-amber-500 mt-1 font-display">
            {pendingReceiptsCount} <span className="text-xs font-semibold text-zinc-400">cần duyệt</span>
          </div>
        </div>
      </div>

      {/* ── Main Navigation Tabs ── */}
      <div className="flex gap-2 border-b border-zinc-200 pb-3">
        <button
          onClick={() => setActiveTab('suppliers')}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2"
          style={{
            background: activeTab === 'suppliers' ? 'var(--color-zinc-950)' : 'white',
            color: activeTab === 'suppliers' ? 'white' : 'var(--color-zinc-600)',
            border: activeTab === 'suppliers' ? '1px solid var(--color-zinc-950)' : '1px solid var(--color-zinc-200)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          🏢 Danh sách Nhà cung cấp ({suppliers.length})
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 relative"
          style={{
            background: activeTab === 'receipts' ? 'var(--color-zinc-950)' : 'white',
            color: activeTab === 'receipts' ? 'white' : 'var(--color-zinc-600)',
            border: activeTab === 'receipts' ? '1px solid var(--color-zinc-950)' : '1px solid var(--color-zinc-200)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          📑 Quản lý Phiếu nhập kho ({receipts.length})
          {pendingReceiptsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-mono font-bold">
              {pendingReceiptsCount}
            </span>
          )}
        </button>
      </div>

      {/* ───────────────────────── TAB 1: NHÀ CUNG CẤP (NCC01 - NCC05) ───────────────────────── */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Tìm theo Mã, Tên nhà cung cấp, SĐT, Email..."
                value={supplierSearch}
                onChange={e => setSupplierSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600 font-sans"
              />
              <svg className="absolute left-3 top-2.5 text-zinc-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-zinc-500 font-mono whitespace-nowrap">Trạng thái:</span>
              <select
                value={supplierStatusFilter}
                onChange={e => setSupplierStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl text-xs bg-zinc-50 border border-zinc-200 focus:outline-none cursor-pointer font-sans"
              >
                <option value="All">Tất cả trạng thái</option>
                <option value="DangHopTac">Đang hợp tác</option>
                <option value="TamNgung">Tạm ngưng</option>
              </select>
            </div>
          </div>

          {/* Table: Exactly 6 columns */}
          <div className="rounded-2xl overflow-hidden bg-white border border-zinc-200 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th style={thSt}>MÃ NCC</th>
                    <th style={thSt}>TÊN NHÀ CUNG CẤP</th>
                    <th style={thSt}>SĐT</th>
                    <th style={thSt}>EMAIL</th>
                    <th style={thSt}>TRẠNG THÁI</th>
                    <th style={{ ...thSt, textAlign: 'center' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-zinc-400 text-sm font-sans">
                        Không tìm thấy nhà cung cấp nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map(s => (
                      <tr
                        key={s.id}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-zinc-50)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                        style={{ transition: 'background 0.1s' }}
                      >
                        <td style={tdSt}>
                          <span className="font-mono text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg inline-block">
                            {s.id}
                          </span>
                        </td>
                        <td style={tdSt}>
                          <div className="font-semibold text-zinc-900">{s.tenNhaCungCap}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                            MST: <span className="text-zinc-600 font-semibold">{s.maSoThue}</span>
                            {s.nguoiLienHe && ` · ĐD: ${s.nguoiLienHe}`}
                          </div>
                        </td>
                        <td style={tdSt}>
                          <a
                            href={`tel:${s.soDienThoai}`}
                            className="font-mono font-medium text-zinc-800 hover:text-red-700 hover:underline"
                          >
                            {s.soDienThoai}
                          </a>
                        </td>
                        <td style={tdSt}>
                          <a
                            href={`mailto:${s.email}`}
                            className="text-zinc-600 hover:text-zinc-900 hover:underline text-xs"
                          >
                            {s.email}
                          </a>
                        </td>
                        <td style={tdSt}>
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-bold font-mono inline-flex items-center gap-1.5"
                            style={{
                              background: s.trangThai === 'DangHopTac' ? '#dcfce7' : '#fee2e2',
                              color: s.trangThai === 'DangHopTac' ? '#15803d' : '#b91c1c',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: s.trangThai === 'DangHopTac' ? '#15803d' : '#b91c1c' }}
                            />
                            {s.trangThai === 'DangHopTac' ? 'Đang hợp tác' : 'Tạm ngưng'}
                          </span>
                        </td>
                        <td style={{ ...tdSt, textAlign: 'center' }}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setDetailSupplier(s)}
                              title="Xem chi tiết nhà cung cấp & lịch sử nhập kho"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              👁️ Xem chi tiết
                            </button>
                            <button
                              onClick={() => openEditSupplierModal(s)}
                              title="Chỉnh sửa thông tin"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                            >
                              ✏️ Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteSupplier(s.id, s.tenNhaCungCap)}
                              title="Xóa nhà cung cấp"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 transition cursor-pointer"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────── TAB 2: QUẢN LÝ PHIẾU NHẬP KHO (K01 - K05) ───────────────────────── */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          {/* K04: Advanced Unified Filter Card */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Tìm mã phiếu (PN-xxx), NCC, người lập..."
                  value={receiptSearch}
                  onChange={e => setReceiptSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600 font-sans"
                />
                <svg className="absolute left-3 top-2.5 text-zinc-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              {/* K05: Sorting Dropdown Control */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-zinc-500 font-mono whitespace-nowrap">Sắp xếp:</span>
                <select
                  value={`${receiptSortBy}-${receiptSortOrder}`}
                  onChange={e => {
                    const [col, ord] = e.target.value.split('-') as [any, any];
                    setReceiptSortBy(col);
                    setReceiptSortOrder(ord);
                  }}
                  className="px-3 py-2 rounded-xl text-xs bg-zinc-50 border border-zinc-200 focus:outline-none cursor-pointer font-sans"
                >
                  <option value="ngayNhap-desc">Ngày nhập: Mới nhất trước (Mặc định)</option>
                  <option value="ngayNhap-asc">Ngày nhập: Cũ nhất trước</option>
                  <option value="tongTien-desc">Tổng tiền: Cao ➔ Thấp</option>
                  <option value="tongTien-asc">Tổng tiền: Thấp ➔ Cao</option>
                  <option value="id-desc">Mã phiếu: Giảm dần</option>
                  <option value="id-asc">Mã phiếu: Tăng dần</option>
                  <option value="tenNhaCungCap-asc">Nhà cung cấp: A ➔ Z</option>
                  <option value="tenNhaCungCap-desc">Nhà cung cấp: Z ➔ A</option>
                </select>
              </div>
            </div>

            {/* K04: Secondary Filters Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-zinc-100 text-xs">
              {/* Filter NCC */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">Nhà cung cấp:</label>
                <select
                  value={receiptSupplierFilter}
                  onChange={e => setReceiptSupplierFilter(e.target.value)}
                  className="w-full p-2 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none cursor-pointer"
                >
                  <option value="All">Tất cả NCC</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.tenNhaCungCap}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Staff */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">Người lập phiếu:</label>
                <select
                  value={receiptStaffFilter}
                  onChange={e => setReceiptStaffFilter(e.target.value)}
                  className="w-full p-2 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none cursor-pointer"
                >
                  <option value="All">Tất cả người lập</option>
                  {distinctStaffList.map(st => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Type (Xe / Phụ tùng) */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">Loại hàng nhập:</label>
                <select
                  value={receiptTypeFilter}
                  onChange={e => setReceiptTypeFilter(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none cursor-pointer"
                >
                  <option value="All">Tất cả loại hàng</option>
                  <option value="XeMay">🏍️ Chỉ Xe máy</option>
                  <option value="PhuTung">📦 Chỉ Phụ tùng</option>
                  <option value="HonHop">🔀 Cả Xe & Phụ tùng</option>
                </select>
              </div>

              {/* Filter Status */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">Trạng thái:</label>
                <select
                  value={receiptStatusFilter}
                  onChange={e => setReceiptStatusFilter(e.target.value)}
                  className="w-full p-2 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none cursor-pointer"
                >
                  <option value="All">Tất cả trạng thái</option>
                  <option value="ChoDuyet">⏳ Chờ duyệt</option>
                  <option value="DaNhapKho">✓ Đã nhập kho</option>
                  <option value="DaHuy">✕ Đã hủy</option>
                </select>
              </div>

              {/* Filter Date Range */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">Thời gian nhập:</label>
                <select
                  value={receiptDateRange}
                  onChange={e => setReceiptDateRange(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none cursor-pointer"
                >
                  <option value="All">Toàn bộ thời gian</option>
                  <option value="Today">Hôm nay</option>
                  <option value="7Days">7 ngày gần nhất</option>
                  <option value="30Days">30 ngày gần nhất</option>
                  <option value="Custom">Tùy chọn ngày...</option>
                </select>
              </div>
            </div>

            {/* Custom Date Picker (if selected) */}
            {receiptDateRange === 'Custom' && (
              <div className="flex items-center gap-3 pt-2 text-xs font-mono">
                <span className="text-zinc-500">Từ ngày:</span>
                <input
                  type="date"
                  value={receiptFromDate}
                  onChange={e => setReceiptFromDate(e.target.value)}
                  className="p-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs"
                />
                <span className="text-zinc-500">Đến ngày:</span>
                <input
                  type="date"
                  value={receiptToDate}
                  onChange={e => setReceiptToDate(e.target.value)}
                  className="p-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs"
                />
              </div>
            )}

            {/* Filter Summary & Reset */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 font-mono">
              <div>
                Đang hiển thị{' '}
                <span className="font-bold text-zinc-800">{filteredAndSortedReceipts.length}</span> /{' '}
                {receipts.length} phiếu nhập kho
              </div>
              {(receiptSearch ||
                receiptSupplierFilter !== 'All' ||
                receiptStaffFilter !== 'All' ||
                receiptTypeFilter !== 'All' ||
                receiptStatusFilter !== 'All' ||
                receiptDateRange !== 'All') && (
                <button
                  onClick={() => {
                    setReceiptSearch('');
                    setReceiptSupplierFilter('All');
                    setReceiptStaffFilter('All');
                    setReceiptTypeFilter('All');
                    setReceiptStatusFilter('All');
                    setReceiptDateRange('All');
                    setReceiptFromDate('');
                    setReceiptToDate('');
                  }}
                  className="text-red-700 hover:underline font-semibold cursor-pointer"
                >
                  ↺ Đặt lại bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Receipts Table (K05: Clickable headers to sort) */}
          <div className="rounded-2xl overflow-hidden bg-white border border-zinc-200 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th
                      style={{ ...thSt, cursor: 'pointer' }}
                      onClick={() => handleToggleSort('id')}
                      title="Click để đổi chiều sắp xếp"
                    >
                      MÃ PHIẾU {receiptSortBy === 'id' ? (receiptSortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th
                      style={{ ...thSt, cursor: 'pointer' }}
                      onClick={() => handleToggleSort('tenNhaCungCap')}
                      title="Click để đổi chiều sắp xếp"
                    >
                      NHÀ CUNG CẤP {receiptSortBy === 'tenNhaCungCap' ? (receiptSortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th
                      style={{ ...thSt, cursor: 'pointer' }}
                      onClick={() => handleToggleSort('ngayNhap')}
                      title="Click để đổi chiều sắp xếp"
                    >
                      NGÀY NHẬP {receiptSortBy === 'ngayNhap' ? (receiptSortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th style={thSt}>NGƯỜI LẬP PHIẾU</th>
                    <th style={thSt}>MẶT HÀNG</th>
                    <th
                      style={{ ...thSt, cursor: 'pointer' }}
                      onClick={() => handleToggleSort('tongTien')}
                      title="Click để đổi chiều sắp xếp"
                    >
                      TỔNG TIỀN {receiptSortBy === 'tongTien' ? (receiptSortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th style={thSt}>TRẠNG THÁI</th>
                    <th style={{ ...thSt, textAlign: 'center' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-zinc-400 text-sm font-sans">
                        Không tìm thấy phiếu nhập kho nào thỏa mãn điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedReceipts.map(r => {
                      const hasXe = r.chiTiet.some(it => it.loai === 'XeMay');
                      const hasPt = r.chiTiet.some(it => it.loai === 'PhuTung');

                      return (
                        <tr
                          key={r.id}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-zinc-50)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                          style={{ transition: 'background 0.1s' }}
                        >
                          <td style={tdSt}>
                            <span className="font-mono font-bold text-red-700">{r.id}</span>
                          </td>
                          <td style={tdSt}>
                            <div className="font-semibold text-zinc-900">{r.tenNhaCungCap}</div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              Tài xế giao: {r.nguoiGiaoHang || 'Đối tác vận chuyển'} ({r.soDienThoaiGiao})
                            </div>
                          </td>
                          <td style={{ ...tdSt, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                            <div>{r.ngayNhap}</div>
                          </td>
                          <td style={tdSt}>
                            <div className="font-medium text-zinc-800">{r.nguoiLap}</div>
                          </td>
                          <td style={tdSt}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 bg-zinc-100 rounded-md text-xs font-mono font-semibold text-zinc-700">
                                {r.chiTiet.length} món
                              </span>
                              {hasXe && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold">
                                  🏍️ Xe máy
                                </span>
                              )}
                              {hasPt && (
                                <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-mono font-bold">
                                  📦 Phụ tùng
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={tdSt}>
                            <span className="font-bold text-red-700 font-display text-sm">
                              {formatVND(r.tongTien)}
                            </span>
                          </td>
                          <td style={tdSt}>
                            <span
                              className="px-2.5 py-1 rounded-full text-xs font-bold font-mono inline-flex items-center gap-1"
                              style={{
                                background:
                                  r.trangThai === 'DaNhapKho'
                                    ? '#dcfce7'
                                    : r.trangThai === 'ChoDuyet'
                                    ? '#fef3c7'
                                    : '#fee2e2',
                                color:
                                  r.trangThai === 'DaNhapKho'
                                    ? '#15803d'
                                    : r.trangThai === 'ChoDuyet'
                                    ? '#b45309'
                                    : '#b91c1c',
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  background:
                                    r.trangThai === 'DaNhapKho'
                                      ? '#15803d'
                                      : r.trangThai === 'ChoDuyet'
                                      ? '#b45309'
                                      : '#b91c1c',
                                }}
                              />
                              {r.trangThai === 'DaNhapKho'
                                ? 'Đã nhập kho'
                                : r.trangThai === 'ChoDuyet'
                                ? 'Chờ duyệt'
                                : 'Đã hủy'}
                            </span>
                          </td>
                          <td style={{ ...tdSt, textAlign: 'center' }}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedReceipt(r)}
                                title="Xem chi tiết và in biên bản giao nhận"
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white transition cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                👁️ Xem
                              </button>

                              {/* Quyền Duyệt: Chỉ Admin mới có quyền duyệt phiếu */}
                              {r.trangThai === 'ChoDuyet' && (
                                isAdmin ? (
                                  <button
                                    onClick={() => handleApproveReceipt(r.id)}
                                    title="Admin phê duyệt nhập kho"
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-2xs"
                                  >
                                    ✓ Duyệt
                                  </button>
                                ) : (
                                  <span
                                    title="Chỉ tài khoản Admin mới có quyền duyệt phiếu này"
                                    className="px-2 py-1 rounded text-[11px] font-mono text-zinc-400 bg-zinc-100 border border-zinc-200"
                                  >
                                    ⏳ Chờ Admin
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────── MODAL CHI TIẾT NHÀ CUNG CẤP (NCC02) ───────────────────────── */}
      {detailSupplier && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(3px)' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200">
            <div className="p-6 border-b border-zinc-200 flex items-start justify-between bg-zinc-50 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-red-100 text-red-700 border border-red-200">
                    {detailSupplier.id}
                  </span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
                    style={{
                      background: detailSupplier.trangThai === 'DangHopTac' ? '#dcfce7' : '#fee2e2',
                      color: detailSupplier.trangThai === 'DangHopTac' ? '#15803d' : '#b91c1c',
                    }}
                  >
                    {detailSupplier.trangThai === 'DangHopTac' ? '● Đang hợp tác' : '○ Tạm ngưng'}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    ⭐ {detailSupplier.danhGia}/5.0 Uy tín
                  </span>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mt-2 font-display uppercase tracking-wide">
                  {detailSupplier.tenNhaCungCap}
                </h2>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  Mã số thuế: <span className="font-bold text-zinc-700">{detailSupplier.maSoThue}</span>
                  {detailSupplier.ngayHopTac && ` · Bắt đầu hợp tác: ${detailSupplier.ngayHopTac}`}
                </p>
              </div>

              <button
                onClick={() => setDetailSupplier(null)}
                className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 flex items-center justify-center text-sm font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5 text-xs">
                  <div className="font-bold text-red-700 font-mono uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-zinc-200 pb-2">
                    🏢 THÔNG TIN PHÁP LÝ & LIÊN HỆ
                  </div>
                  <div>
                    <span className="text-zinc-500">Người đại diện: </span>
                    <span className="font-semibold text-zinc-900">{detailSupplier.nguoiLienHe || '—'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Hotline / SĐT: </span>
                    <a href={`tel:${detailSupplier.soDienThoai}`} className="font-mono font-bold text-red-700 hover:underline">
                      {detailSupplier.soDienThoai}
                    </a>
                  </div>
                  <div>
                    <span className="text-zinc-500">Email liên hệ: </span>
                    <a href={`mailto:${detailSupplier.email}`} className="font-medium text-zinc-800 hover:underline">
                      {detailSupplier.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-zinc-500">Địa chỉ trụ sở / kho: </span>
                    <span className="font-medium text-zinc-900">{detailSupplier.diaChi}</span>
                  </div>
                  {detailSupplier.ghiChu && (
                    <div className="pt-1 text-zinc-600 bg-white p-2.5 rounded-lg border border-zinc-200">
                      <span className="font-semibold text-zinc-700">Ghi chú hợp tác: </span>
                      {detailSupplier.ghiChu}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5 text-xs">
                  <div className="font-bold text-red-700 font-mono uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-zinc-200 pb-2">
                    💳 THANH TOÁN & CHÍNH SÁCH CÔNG NỢ
                  </div>
                  <div>
                    <span className="text-zinc-500">Ngân hàng thụ hưởng: </span>
                    <span className="font-semibold text-zinc-900">{detailSupplier.nganHang || 'Vietcombank'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Số tài khoản (STK): </span>
                    <span className="font-mono font-bold text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200">
                      {detailSupplier.soTaiKhoan || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Chiết khấu đại lý: </span>
                    <span className="font-bold text-emerald-600 text-sm">{detailSupplier.chietKhau}%</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Chu kỳ công nợ: </span>
                    <span className="font-semibold text-zinc-800">{detailSupplier.chuKyThanhToan || '30 ngày'}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-zinc-500 block mb-1.5 font-mono text-[11px]">DANH MỤC HÀNG HÓA:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {detailSupplier.nhomHang.map((nh, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white border border-zinc-200 text-zinc-800 rounded-lg text-xs font-medium">
                          📦 {nh}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lịch sử phiếu nhập */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-700">
                    LỊCH SỬ PHIẾU NHẬP KHO ({receipts.filter(r => r.nhaCungCapId === detailSupplier.id).length} PHIẾU)
                  </h4>
                  <button
                    onClick={() => {
                      setNewNccId(detailSupplier.id);
                      handleOpenCreateReceiptModal();
                    }}
                    className="text-xs font-bold text-red-700 hover:underline font-mono"
                  >
                    + Lập phiếu nhập mới
                  </button>
                </div>

                <div className="rounded-xl overflow-hidden border border-zinc-200">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-zinc-100 font-mono text-zinc-600 uppercase text-[11px]">
                      <tr>
                        <th className="p-3">Mã phiếu</th>
                        <th className="p-3">Ngày nhập</th>
                        <th className="p-3">Người lập</th>
                        <th className="p-3">Số món</th>
                        <th className="p-3 text-right">Tổng tiền</th>
                        <th className="p-3 text-center">Trạng thái</th>
                        <th className="p-3 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {receipts.filter(r => r.nhaCungCapId === detailSupplier.id).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-zinc-400 italic">
                            Chưa có phiếu nhập kho nào được lập cho nhà cung cấp này.
                          </td>
                        </tr>
                      ) : (
                        receipts
                          .filter(r => r.nhaCungCapId === detailSupplier.id)
                          .map(rc => (
                            <tr key={rc.id} className="hover:bg-zinc-50">
                              <td className="p-3 font-mono font-bold text-red-700">{rc.id}</td>
                              <td className="p-3 font-mono text-zinc-600">{rc.ngayNhap}</td>
                              <td className="p-3 text-zinc-800 font-medium">{rc.nguoiLap}</td>
                              <td className="p-3 font-mono text-zinc-600">{rc.chiTiet.length} món</td>
                              <td className="p-3 text-right font-display font-bold text-red-700 text-sm">
                                {formatVND(rc.tongTien)}
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono inline-block"
                                  style={{
                                    background: rc.trangThai === 'DaNhapKho' ? '#dcfce7' : '#fef3c7',
                                    color: rc.trangThai === 'DaNhapKho' ? '#15803d' : '#b45309',
                                  }}
                                >
                                  {rc.trangThai === 'DaNhapKho' ? 'Đã nhập kho' : 'Chờ duyệt'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => setSelectedReceipt(rc)}
                                  className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold cursor-pointer"
                                >
                                  👁️ Xem
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-200 flex items-center justify-between bg-zinc-50 rounded-b-2xl">
              <button
                onClick={() => {
                  const toEdit = detailSupplier;
                  setDetailSupplier(null);
                  openEditSupplierModal(toEdit);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                ✏️ Chỉnh sửa thông tin nhà cung cấp
              </button>
              <button
                onClick={() => setDetailSupplier(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-zinc-200 hover:bg-zinc-300 text-zinc-700 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────── MODAL THÊM / SỬA NHÀ CUNG CẤP (NCC03, NCC04, NCC05) ───────────────────────── */}
      {showSupplierModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(3px)' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 font-display uppercase tracking-wider">
                  {editingSupplier ? `CẬP NHẬT NHÀ CUNG CẤP (${editingSupplier.id})` : 'THÊM NHÀ CUNG CẤP MỚI'}
                </h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">
                  Nhập thông tin pháp lý, mã số thuế (10-13 số), số điện thoại và địa chỉ phân cấp chuẩn
                </p>
              </div>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 flex items-center justify-center text-sm font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold font-mono text-zinc-700 mb-1">
                  TÊN DOANH NGHIỆP / NHÀ CUNG CẤP <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Công ty TNHH Honda Việt Nam"
                  value={supplierFormData.tenNhaCungCap}
                  onChange={e => {
                    const val = e.target.value;
                    setSupplierFormData(prev => ({ ...prev, tenNhaCungCap: val }));
                    if (supplierErrors.tenNhaCungCap) {
                      setSupplierErrors(prev => ({ ...prev, tenNhaCungCap: undefined }));
                    }
                  }}
                  className={`w-full p-2.5 rounded-xl bg-zinc-50 border ${
                    supplierErrors.tenNhaCungCap ? 'border-red-500 bg-red-50/30' : 'border-zinc-200'
                  } focus:outline-none focus:border-red-600 font-sans text-xs`}
                  required
                />
                {supplierErrors.tenNhaCungCap && (
                  <p className="text-[11px] text-red-600 mt-1 font-sans">{supplierErrors.tenNhaCungCap}</p>
                )}
              </div>

              {/* NCC03: MST (10-13 số) & Chiết khấu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold font-mono text-zinc-700 mb-1">
                    MÃ SỐ THUẾ (10 - 13 SỐ) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    placeholder="VD: 0303889123"
                    value={supplierFormData.maSoThue}
                    onChange={e => {
                      const val = e.target.value;
                      setSupplierFormData(prev => ({ ...prev, maSoThue: val }));
                      const err = validateTaxCode(val, editingSupplier?.id);
                      setSupplierErrors(prev => ({ ...prev, maSoThue: err }));
                    }}
                    className={`w-full p-2.5 rounded-xl bg-zinc-50 border ${
                      supplierErrors.maSoThue ? 'border-red-500 bg-red-50/30' : 'border-zinc-200'
                    } focus:outline-none focus:border-red-600 font-mono text-xs`}
                    required
                  />
                  {supplierErrors.maSoThue ? (
                    <p className="text-[11px] text-red-600 mt-1 font-sans font-medium flex items-center gap-1">
                      ⚠️ {supplierErrors.maSoThue}
                    </p>
                  ) : (
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                      Yêu cầu 10 - 13 chữ số và không trùng lặp
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold font-mono text-zinc-700 mb-1">
                    CHIẾT KHẤU ĐẠI LÝ (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={supplierFormData.chietKhau}
                    onChange={e => setSupplierFormData(prev => ({ ...prev, chietKhau: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600 font-mono text-xs"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">Tỷ lệ chiết khấu nhập sỉ</p>
                </div>
              </div>

              {/* NCC04: Người liên hệ & SĐT (10 số, 03/05/07/08/09) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold font-mono text-zinc-700 mb-1">
                    NGƯỜI ĐẠI DIỆN LIÊN HỆ
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Trần Minh Tuấn"
                    value={supplierFormData.nguoiLienHe}
                    onChange={e => setSupplierFormData(prev => ({ ...prev, nguoiLienHe: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold font-mono text-zinc-700 mb-1">
                    HOTLINE / SĐT (10 SỐ) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="VD: 0988112233"
                    value={supplierFormData.soDienThoai}
                    onChange={e => {
                      const val = e.target.value;
                      setSupplierFormData(prev => ({ ...prev, soDienThoai: val }));
                      const err = validatePhoneNumber(val, editingSupplier?.id);
                      setSupplierErrors(prev => ({ ...prev, soDienThoai: err }));
                    }}
                    className={`w-full p-2.5 rounded-xl bg-zinc-50 border ${
                      supplierErrors.soDienThoai ? 'border-red-500 bg-red-50/30' : 'border-zinc-200'
                    } focus:outline-none focus:border-red-600 font-mono text-xs`}
                    required
                  />
                  {supplierErrors.soDienThoai ? (
                    <p className="text-[11px] text-red-600 mt-1 font-sans font-medium flex items-center gap-1">
                      ⚠️ {supplierErrors.soDienThoai}
                    </p>
                  ) : (
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                      Bắt đầu bằng 03, 05, 07, 08, 09 và không trùng lặp
                    </p>
                  )}
                </div>
              </div>

              {/* Email & Trạng thái */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold font-mono text-zinc-700 mb-1">EMAIL LIÊN HỆ / BÁO GIÁ</label>
                  <input
                    type="email"
                    placeholder="sales@supplier.com"
                    value={supplierFormData.email}
                    onChange={e => setSupplierFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold font-mono text-zinc-700 mb-1">TRẠNG THÁI HỢP TÁC</label>
                  <select
                    value={supplierFormData.trangThai}
                    onChange={e => setSupplierFormData(prev => ({ ...prev, trangThai: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600 text-xs cursor-pointer font-sans"
                  >
                    <option value="DangHopTac">Đang hợp tác</option>
                    <option value="TamNgung">Tạm ngưng</option>
                  </select>
                </div>
              </div>

              {/* NCC05: Cascaded Address */}
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                <div className="font-bold text-zinc-800 font-mono text-xs flex items-center justify-between">
                  <span>📍 ĐỊA CHỈ TRỤ SỞ / KHO HÀNG (PHÂN CẤP CHUẨN)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Tỉnh/TP ➔ Quận/Huyện ➔ Phường/Xã</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-600 mb-1">Tỉnh / Thành phố *</label>
                    <select
                      value={supplierFormData.tinhThanh}
                      onChange={e => {
                        const provName = e.target.value;
                        const prov = VIETNAM_LOCATIONS.find(p => p.name === provName);
                        setSupplierFormData(prev => ({
                          ...prev,
                          tinhThanh: provName,
                          quanHuyen: prov?.districts[0]?.name || '',
                          phuongXa: prov?.districts[0]?.wards[0] || '',
                        }));
                      }}
                      className="w-full p-2 rounded-lg bg-white border border-zinc-200 text-xs focus:outline-none focus:border-red-600 cursor-pointer"
                    >
                      {VIETNAM_LOCATIONS.map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-600 mb-1">Quận / Huyện *</label>
                    <select
                      value={supplierFormData.quanHuyen}
                      onChange={e => {
                        const distName = e.target.value;
                        const dist = districtOptions.find(d => d.name === distName);
                        setSupplierFormData(prev => ({
                          ...prev,
                          quanHuyen: distName,
                          phuongXa: dist?.wards[0] || '',
                        }));
                      }}
                      className="w-full p-2 rounded-lg bg-white border border-zinc-200 text-xs focus:outline-none focus:border-red-600 cursor-pointer"
                    >
                      {districtOptions.map(d => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-600 mb-1">Phường / Xã *</label>
                    <select
                      value={supplierFormData.phuongXa}
                      onChange={e => setSupplierFormData(prev => ({ ...prev, phuongXa: e.target.value }))}
                      className="w-full p-2 rounded-lg bg-white border border-zinc-200 text-xs focus:outline-none focus:border-red-600 cursor-pointer"
                    >
                      {wardOptions.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-600 mb-1">
                    Số nhà, tên đường / Khu công nghiệp / Tòa nhà *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Số 25 Liễu Giai, Tòa nhà Honda Tower"
                    value={supplierFormData.soNhaDuong}
                    onChange={e => setSupplierFormData(prev => ({ ...prev, soNhaDuong: e.target.value }))}
                    className="w-full p-2 rounded-lg bg-white border border-zinc-200 text-xs focus:outline-none focus:border-red-600"
                    required
                  />
                </div>

                <div className="text-[11px] text-zinc-600 bg-white p-2 rounded-lg border border-dashed border-zinc-200">
                  <span className="font-semibold text-zinc-700">Xem trước địa chỉ đầy đủ: </span>
                  <span className="text-red-700 font-medium">
                    {[supplierFormData.soNhaDuong.trim(), supplierFormData.phuongXa, supplierFormData.quanHuyen, supplierFormData.tinhThanh]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              </div>

              {/* Ngân hàng & STK */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold font-mono text-zinc-700 mb-1">NGÂN HÀNG THỤ HƯỞNG</label>
                  <select
                    value={supplierFormData.nganHang}
                    onChange={e => setSupplierFormData(prev => ({ ...prev, nganHang: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:outline-none"
                  >
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="BIDV">BIDV</option>
                    <option value="Techcombank">Techcombank</option>
                    <option value="VietinBank">VietinBank</option>
                    <option value="MB Bank">MB Bank</option>
                    <option value="ACB">ACB</option>
                    <option value="VPBank">VPBank</option>
                    <option value="HSBC Việt Nam">HSBC Việt Nam</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold font-mono text-zinc-700 mb-1">SỐ TÀI KHOẢN (STK)</label>
                  <input
                    type="text"
                    placeholder="VD: 0011004567890"
                    value={supplierFormData.soTaiKhoan}
                    onChange={e => setSupplierFormData(prev => ({ ...prev, soTaiKhoan: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold font-mono text-zinc-700 mb-1">CHU KỲ CÔNG NỢ</label>
                  <select
                    value={supplierFormData.chuKyThanhToan}
                    onChange={e => setSupplierFormData(prev => ({ ...prev, chuKyThanhToan: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:outline-none"
                  >
                    <option value="Trả ngay">Trả ngay (COD)</option>
                    <option value="15 ngày">15 ngày</option>
                    <option value="30 ngày">30 ngày</option>
                    <option value="45 ngày">45 ngày</option>
                    <option value="60 ngày">60 ngày</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold font-mono text-zinc-700 mb-1">GHI CHÚ / CHÍNH SÁCH BẢO HÀNH</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú hạn mức công nợ, quy định đổi trả linh kiện hỏng do vận chuyển..."
                  value={supplierFormData.ghiChu}
                  onChange={e => setSupplierFormData(prev => ({ ...prev, ghiChu: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600 text-xs font-sans"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={Boolean(supplierErrors.maSoThue || supplierErrors.soDienThoai || supplierErrors.tenNhaCungCap)}
                  className="px-5 py-2 rounded-xl font-bold bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white transition cursor-pointer shadow-md"
                >
                  {editingSupplier ? '✓ Lưu thay đổi' : '+ Thêm nhà cung cấp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────── MODAL XEM CHI TIẾT & IN BIÊN BẢN PHIẾU NHẬP ───────────────────────── */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(3px)' }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200"
            id="printable-receipt"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-200 flex items-start justify-between bg-zinc-50 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-red-100 text-red-700 border border-red-200">
                    {selectedReceipt.id}
                  </span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
                    style={{
                      background:
                        selectedReceipt.trangThai === 'DaNhapKho'
                          ? '#dcfce7'
                          : selectedReceipt.trangThai === 'ChoDuyet'
                          ? '#fef3c7'
                          : '#fee2e2',
                      color:
                        selectedReceipt.trangThai === 'DaNhapKho'
                          ? '#15803d'
                          : selectedReceipt.trangThai === 'ChoDuyet'
                          ? '#b45309'
                          : '#b91c1c',
                    }}
                  >
                    {selectedReceipt.trangThai === 'DaNhapKho'
                      ? '✓ ĐÃ NHẬP KHO'
                      : selectedReceipt.trangThai === 'ChoDuyet'
                      ? '⏳ CHỜ DUYỆT'
                      : '✕ ĐÃ HỦY'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mt-2 font-display uppercase tracking-wider">
                  BIÊN BẢN NHẬP KHO KIÊM GIAO NHẬN HÀNG HÓA
                </h2>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  Ngày lập: {selectedReceipt.ngayLap} · Ngày nhập kho: {selectedReceipt.ngayNhap}
                </p>
              </div>

              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 flex items-center justify-center text-sm font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
                <div className="space-y-1.5">
                  <div className="font-bold text-zinc-900 font-mono uppercase tracking-wider text-[11px] text-red-700">
                    BÊN GIAO HÀNG (ĐỐI TÁC CUNG ỨNG)
                  </div>
                  <div className="font-semibold text-zinc-800 text-sm">{selectedReceipt.tenNhaCungCap}</div>
                  <div>
                    Người giao:{' '}
                    <span className="font-medium text-zinc-700">
                      {selectedReceipt.nguoiGiaoHang || 'Tài xế giao vận'}
                    </span>
                  </div>
                  <div>
                    SĐT giao hàng:{' '}
                    <span className="font-mono text-zinc-700">{selectedReceipt.soDienThoaiGiao || '—'}</span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:border-l sm:border-zinc-200 sm:pl-4">
                  <div className="font-bold text-zinc-900 font-mono uppercase tracking-wider text-[11px] text-red-700">
                    BÊN NHẬN HÀNG (ĐẠI LÝ MOTOSHOP)
                  </div>
                  <div className="font-semibold text-zinc-800 text-sm">
                    HỆ THỐNG SHOWROOM & TRUNG TÂM PHỤ TÙNG MOTOSHOP
                  </div>
                  <div>
                    Người lập phiếu:{' '}
                    <span className="font-medium text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200">
                      👤 {selectedReceipt.nguoiLap}
                    </span>
                  </div>
                  <div>
                    Địa điểm nhập: <span className="text-zinc-700">Kho Trung Tâm - MOTOSHOP Q. Tân Bình, TP.HCM</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-600 mb-2">
                  CHI TIẾT MẶT HÀNG NHẬP KHO ({selectedReceipt.chiTiet.length} MẶT HÀNG)
                </h4>
                <div className="rounded-xl overflow-hidden border border-zinc-200">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-zinc-100 font-mono text-zinc-600 uppercase text-[11px]">
                      <tr>
                        <th className="p-3 w-12 text-center">STT</th>
                        <th className="p-3">Mã SKU / ID</th>
                        <th className="p-3">Tên sản phẩm</th>
                        <th className="p-3 text-center">Loại</th>
                        <th className="p-3 text-center">ĐVT</th>
                        <th className="p-3 text-right">Số lượng</th>
                        <th className="p-3 text-right">Đơn giá nhập</th>
                        <th className="p-3 text-right font-bold">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {selectedReceipt.chiTiet.map((it, idx) => (
                        <tr key={it.id} className="hover:bg-zinc-50">
                          <td className="p-3 text-center font-mono text-zinc-400">{idx + 1}</td>
                          <td className="p-3 font-mono font-semibold text-zinc-700">{it.maSanPham}</td>
                          <td className="p-3 font-semibold text-zinc-900">{it.tenSanPham}</td>
                          <td className="p-3 text-center">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                              style={{
                                background: it.loai === 'XeMay' ? '#eff6ff' : '#f4f4f5',
                                color: it.loai === 'XeMay' ? '#1d4ed8' : '#3f3f46',
                              }}
                            >
                              {it.loai === 'XeMay' ? '🏍️ Xe máy' : '📦 Phụ tùng'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono">{it.donViTinh}</td>
                          <td className="p-3 text-right font-mono font-bold text-zinc-800">{it.soLuong}</td>
                          <td className="p-3 text-right font-mono text-zinc-600">{formatVND(it.donGiaNhap)}</td>
                          <td className="p-3 text-right font-mono font-bold text-red-700">
                            {formatVND(it.thanhTien)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-50 font-bold border-t border-zinc-200">
                      <tr>
                        <td colSpan={5} className="p-3 text-right uppercase font-mono text-zinc-600">
                          TỔNG CỘNG TIỀN HÀNG:
                        </td>
                        <td className="p-3 text-right font-mono text-zinc-900">
                          {selectedReceipt.chiTiet.reduce((s, i) => s + i.soLuong, 0)} (sản phẩm)
                        </td>
                        <td className="p-3"></td>
                        <td className="p-3 text-right font-display text-base text-red-700">
                          {formatVND(selectedReceipt.tongTien)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Note */}
              <div className="text-xs text-zinc-600 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="font-bold text-amber-800">Ghi chú đợt nhập:</span>{' '}
                {selectedReceipt.ghiChu || 'Hàng mới 100%, nguyên đai nguyên kiện, đầy đủ hóa đơn GTGT.'}
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-4 gap-4 text-center pt-4 border-t border-zinc-200 text-xs">
                <div>
                  <div className="font-bold text-zinc-800 font-mono">NGƯỜI LẬP PHIẾU</div>
                  <div className="text-[11px] text-zinc-400 italic mt-0.5">(Ký, họ tên)</div>
                  <div className="mt-14 font-semibold text-zinc-700">{selectedReceipt.nguoiLap}</div>
                </div>
                <div>
                  <div className="font-bold text-zinc-800 font-mono">NGƯỜI GIAO HÀNG</div>
                  <div className="text-[11px] text-zinc-400 italic mt-0.5">(Ký, họ tên)</div>
                  <div className="mt-14 font-semibold text-zinc-700">
                    {selectedReceipt.nguoiGiaoHang || 'Đại diện bên giao'}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-zinc-800 font-mono">THỦ KHO NHẬN</div>
                  <div className="text-[11px] text-zinc-400 italic mt-0.5">(Ký, họ tên)</div>
                  <div className="mt-14 font-semibold text-zinc-700">Lê Văn Kỹ Thuật</div>
                </div>
                <div>
                  <div className="font-bold text-zinc-800 font-mono">GIÁM ĐỐC / ADMIN DUYỆT</div>
                  <div className="text-[11px] text-zinc-400 italic mt-0.5">(Ký, đóng dấu)</div>
                  <div className="mt-14 font-semibold text-zinc-700">Trần Văn Quản Lý</div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-zinc-200 flex items-center justify-between bg-zinc-50 rounded-b-2xl">
              <div className="text-xs text-zinc-400 font-mono">
                MOTOSHOP CRM & ERP VOUCHER SYSTEM
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  🖨️ In biên bản / PDF
                </button>

                {/* Duyệt phiếu: Chỉ Admin mới có quyền */}
                {selectedReceipt.trangThai === 'ChoDuyet' && (
                  isAdmin ? (
                    <button
                      onClick={() => handleApproveReceipt(selectedReceipt.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-sm"
                    >
                      ✓ Admin xác nhận duyệt phiếu
                    </button>
                  ) : (
                    <span className="px-3 py-2 rounded-xl text-xs font-mono font-medium text-amber-800 bg-amber-100 border border-amber-200 flex items-center gap-1">
                      ⏳ Đang chờ Admin phê duyệt
                    </span>
                  )
                )}

                {/* Nút hủy phiếu */}
                {selectedReceipt.trangThai === 'ChoDuyet' && (
                  <button
                    onClick={() => handleCancelReceipt(selectedReceipt.id)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 transition cursor-pointer"
                  >
                    ✕ Hủy phiếu
                  </button>
                )}

                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-200 hover:bg-zinc-300 text-zinc-700 transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────── MODAL TẠO PHIẾU NHẬP KHO MỚI (K01, K02, K03) ───────────────────────── */}
      {showNewReceiptModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(3px)' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 font-display uppercase tracking-wider">
                  LẬP PHIẾU NHẬP KHO MỚI
                </h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">
                  Nhân viên lập phiếu nhập xe mẫu và phụ tùng từ danh mục hệ thống (Phiếu sẽ được gửi tới Admin phê duyệt)
                </p>
              </div>
              <button
                onClick={() => setShowNewReceiptModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 flex items-center justify-center text-sm font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="p-6 space-y-5">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold font-mono text-zinc-700 mb-1">
                    NHÀ CUNG CẤP / ĐỐI TÁC *
                  </label>
                  <select
                    value={newNccId}
                    onChange={e => setNewNccId(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs bg-zinc-50 border border-zinc-200 font-sans focus:outline-none focus:border-red-600 cursor-pointer"
                    required
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.tenNhaCungCap} ({s.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* K01: Tự động điền theo tài khoản đang đăng nhập & Khóa sửa tay */}
                <div>
                  <label className="block text-xs font-bold font-mono text-zinc-700 mb-1 flex items-center justify-between">
                    <span>NGƯỜI LẬP PHIẾU *</span>
                    <span className="text-[10px] text-emerald-600 font-semibold font-sans">
                      🔒 Tự động theo tài khoản đang đăng nhập
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={currentStaffDisplayName}
                      readOnly
                      disabled
                      className="w-full p-2.5 rounded-xl text-xs bg-zinc-100 border border-zinc-200 font-mono text-zinc-700 cursor-not-allowed select-none pl-8"
                    />
                    <span className="absolute left-2.5 top-2.5 text-zinc-400">👤</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono text-zinc-700 mb-1">
                    TÀI XẾ / NGƯỜI GIAO HÀNG
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Đặng Quốc Huy (Vận tải)"
                    value={newNguoiGiao}
                    onChange={e => setNewNguoiGiao(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs bg-zinc-50 border border-zinc-200 font-sans focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono text-zinc-700 mb-1">
                    SỐ ĐIỆN THOẠI NGƯỜI GIAO
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 0912 345 678"
                    value={newSdtGiao}
                    onChange={e => setNewSdtGiao(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs bg-zinc-50 border border-zinc-200 font-sans focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* K02 & K03: Items List selected from System Catalogs */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div>
                    <label className="text-xs font-bold font-mono text-zinc-800">
                      DANH SÁCH MẶT HÀNG NHẬP KHO ({newItems.length})
                    </label>
                    <p className="text-[11px] text-zinc-400">
                      Chọn sản phẩm từ danh mục hệ thống (cấm nhập text thủ công theo K02 & K03)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddReceiptRow('XeMay')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono text-blue-700 bg-blue-50 hover:bg-blue-100 transition cursor-pointer border border-blue-200"
                    >
                      + 🏍️ Thêm dòng Xe máy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddReceiptRow('PhuTung')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono text-red-700 bg-red-50 hover:bg-red-100 transition cursor-pointer border border-red-200"
                    >
                      + 📦 Thêm dòng Phụ tùng
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {newItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-400">#{idx + 1}</span>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                            style={{
                              background: item.loai === 'XeMay' ? '#eff6ff' : '#f4f4f5',
                              color: item.loai === 'XeMay' ? '#1d4ed8' : '#3f3f46',
                            }}
                          >
                            {item.loai === 'XeMay' ? '🏍️ Xe máy nguyên chiếc' : '📦 Phụ tùng chính hãng'}
                          </span>
                          <span className="font-mono text-zinc-500 text-[11px]">SKU: {item.maSanPham}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveReceiptRow(idx)}
                          className="text-red-500 hover:text-red-700 font-bold px-2 py-0.5 rounded hover:bg-red-50 cursor-pointer text-xs"
                        >
                          ✕ Xóa dòng
                        </button>
                      </div>

                      {/* Dropdown chọn sản phẩm (K02 & K03) */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-12 sm:col-span-6">
                          <label className="block text-[10px] font-mono text-zinc-500 mb-0.5">
                            Chọn sản phẩm từ hệ thống:
                          </label>
                          {item.loai === 'XeMay' ? (
                            <select
                              value={item.maSanPham}
                              onChange={e => handleChangeItemProduct(idx, e.target.value, 'XeMay')}
                              className="w-full p-2 rounded-lg bg-white border border-zinc-200 text-xs focus:outline-none focus:border-red-600 font-medium"
                            >
                              {availableVehicles.map(v => (
                                <option key={v.id} value={v.id}>
                                  [{v.id}] {v.tenXe} - {v.hang} ({formatVND(v.giaNiemYet)})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={item.maSanPham}
                              onChange={e => handleChangeItemProduct(idx, e.target.value, 'PhuTung')}
                              className="w-full p-2 rounded-lg bg-white border border-zinc-200 text-xs focus:outline-none focus:border-red-600 font-medium"
                            >
                              {availableParts.map(p => (
                                <option key={p.id} value={p.id}>
                                  [{p.id}] {p.tenSanPham} - {p.thuongHieu}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                          <label className="block text-[10px] font-mono text-zinc-500 mb-0.5">ĐVT:</label>
                          <input
                            type="text"
                            value={item.donViTinh}
                            readOnly
                            className="w-full p-2 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-mono text-center text-zinc-600 cursor-not-allowed"
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                          <label className="block text-[10px] font-mono text-zinc-500 mb-0.5">Số lượng:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.soLuong}
                            onChange={e => {
                              const val = Math.max(1, Number(e.target.value));
                              setNewItems(prev =>
                                prev.map((it, i) => (i === idx ? { ...it, soLuong: val } : it))
                              );
                            }}
                            className="w-full p-2 rounded-lg bg-white border border-zinc-200 text-xs font-mono focus:outline-none"
                            required
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                          <label className="block text-[10px] font-mono text-zinc-500 mb-0.5">Đơn giá nhập (đ):</label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={item.donGiaNhap}
                            onChange={e => {
                              const val = Math.max(0, Number(e.target.value));
                              setNewItems(prev =>
                                prev.map((it, i) => (i === idx ? { ...it, donGiaNhap: val } : it))
                              );
                            }}
                            className="w-full p-2 rounded-lg bg-white border border-zinc-200 text-xs font-mono focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end text-[11px] text-zinc-500 font-mono pt-1">
                        Thành tiền dòng này:{' '}
                        <span className="font-bold text-red-700 ml-1">
                          {formatVND(item.soLuong * item.donGiaNhap)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Estimate total */}
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-red-900 font-mono">TỔNG GIÁ TRỊ PHIẾU NHẬP:</span>
                  <span className="text-base font-extrabold text-red-700 font-display">
                    {formatVND(newItems.reduce((sum, item) => sum + item.soLuong * item.donGiaNhap, 0))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-zinc-700 mb-1">GHI CHÚ ĐỢT NHẬP</label>
                <textarea
                  rows={2}
                  value={newGhiChu}
                  onChange={e => setNewGhiChu(e.target.value)}
                  placeholder="Ghi chú số hóa đơn đỏ, hợp đồng nguyên tắc, tình trạng kiểm đếm..."
                  className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 font-sans focus:outline-none focus:border-red-600 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-mono">
                  ℹ️ Phiếu tạo xong sẽ ở trạng thái Chờ duyệt.
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewReceiptModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition cursor-pointer shadow-md"
                  >
                    ✓ Xác nhận lập phiếu nhập
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
