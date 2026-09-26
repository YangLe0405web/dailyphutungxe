import React, { useState } from 'react';
import {
  type Supplier,
  type PurchaseReceipt,
  type ReceiptItem,
  mockSuppliers,
  mockPurchaseReceipts,
  mockParts,
  formatVND,
} from '../../data/mockData';

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'receipts'>('suppliers');

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierCategoryFilter, setSupplierCategoryFilter] = useState('All');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Receipts state
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>(mockPurchaseReceipts);
  const [receiptSearch, setReceiptSearch] = useState('');
  const [receiptStatusFilter, setReceiptStatusFilter] = useState('All');
  const [selectedReceipt, setSelectedReceipt] = useState<PurchaseReceipt | null>(null);
  const [showNewReceiptModal, setShowNewReceiptModal] = useState(false);

  // New receipt form state
  const [newNccId, setNewNccId] = useState(mockSuppliers[0]?.id || '');
  const [newNguoiLap, setNewNguoiLap] = useState('Lê Văn Kỹ Thuật');
  const [newNguoiGiao, setNewNguoiGiao] = useState('');
  const [newSdtGiao, setNewSdtGiao] = useState('');
  const [newGhiChu, setNewGhiChu] = useState('');
  const [newItems, setNewItems] = useState<{
    maSanPham: string;
    tenSanPham: string;
    loai: 'PhuTung' | 'XeMay';
    donViTinh: string;
    soLuong: number;
    donGiaNhap: number;
  }[]>([
    {
      maSanPham: mockParts[0]?.id || 'PT001',
      tenSanPham: mockParts[0]?.tenSanPham || 'Nhớt Motul 7100 4T 10W40',
      loai: 'PhuTung',
      donViTinh: 'Chai',
      soLuong: 20,
      donGiaNhap: 220000,
    },
  ]);

  // Form supplier input state
  const [supplierFormData, setSupplierFormData] = useState<Partial<Supplier>>({
    tenNhaCungCap: '',
    maSoThue: '',
    nguoiLienHe: '',
    soDienThoai: '',
    email: '',
    diaChi: '',
    nhomHang: ['Phụ tùng thay thế định kỳ'],
    chietKhau: 15,
    danhGia: 5.0,
    trangThai: 'DangHopTac',
    ghiChu: '',
  });

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter(s => {
    const matchSearch =
      s.tenNhaCungCap.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.maSoThue.includes(supplierSearch) ||
      s.nguoiLienHe.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.soDienThoai.includes(supplierSearch);
    const matchCat =
      supplierCategoryFilter === 'All' ||
      s.nhomHang.some(nh => nh.toLowerCase().includes(supplierCategoryFilter.toLowerCase()));
    return matchSearch && matchCat;
  });

  // Filtered receipts
  const filteredReceipts = receipts.filter(r => {
    const matchSearch =
      r.id.toLowerCase().includes(receiptSearch.toLowerCase()) ||
      r.tenNhaCungCap.toLowerCase().includes(receiptSearch.toLowerCase()) ||
      r.nguoiLap.toLowerCase().includes(receiptSearch.toLowerCase()) ||
      (r.nguoiGiaoHang && r.nguoiGiaoHang.toLowerCase().includes(receiptSearch.toLowerCase()));
    const matchStatus = receiptStatusFilter === 'All' || r.trangThai === receiptStatusFilter;
    return matchSearch && matchStatus;
  });

  // Calculation metrics
  const totalSuppliersCount = suppliers.length;
  const activeSuppliersCount = suppliers.filter(s => s.trangThai === 'DangHopTac').length;
  const totalReceiptsValue = receipts.reduce((sum, r) => sum + r.tongTien, 0);
  const completedReceiptsCount = receipts.filter(r => r.trangThai === 'DaNhapKho').length;
  const pendingReceiptsCount = receipts.filter(r => r.trangThai === 'ChoDuyet').length;

  // Supplier modal handlers
  function openAddSupplierModal() {
    setEditingSupplier(null);
    setSupplierFormData({
      tenNhaCungCap: '',
      maSoThue: '',
      nguoiLienHe: '',
      soDienThoai: '',
      email: '',
      diaChi: '',
      nhomHang: ['Phụ tùng thay thế định kỳ'],
      chietKhau: 15,
      danhGia: 5.0,
      trangThai: 'DangHopTac',
      ghiChu: '',
    });
    setShowSupplierModal(true);
  }

  function openEditSupplierModal(s: Supplier) {
    setEditingSupplier(s);
    setSupplierFormData(s);
    setShowSupplierModal(true);
  }

  function handleSaveSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierFormData.tenNhaCungCap || !supplierFormData.soDienThoai) {
      alert('Vui lòng điền đầy đủ Tên nhà cung cấp và Số điện thoại!');
      return;
    }

    if (editingSupplier) {
      setSuppliers(prev =>
        prev.map(s => (s.id === editingSupplier.id ? ({ ...s, ...supplierFormData } as Supplier) : s))
      );
    } else {
      const newId = `NCC00${suppliers.length + 1}`;
      const newSupplier: Supplier = {
        id: newId,
        tenNhaCungCap: supplierFormData.tenNhaCungCap || '',
        maSoThue: supplierFormData.maSoThue || '0100000000',
        nguoiLienHe: supplierFormData.nguoiLienHe || 'Người đại diện',
        soDienThoai: supplierFormData.soDienThoai || '',
        email: supplierFormData.email || 'contact@supplier.vn',
        diaChi: supplierFormData.diaChi || 'TP. Hồ Chí Minh',
        nhomHang: supplierFormData.nhomHang || ['Phụ tùng chính hãng'],
        chietKhau: Number(supplierFormData.chietKhau) || 10,
        danhGia: Number(supplierFormData.danhGia) || 5.0,
        trangThai: (supplierFormData.trangThai as 'DangHopTac' | 'TamNgung') || 'DangHopTac',
        ghiChu: supplierFormData.ghiChu || '',
        soLuongMatHang: 5,
      };
      setSuppliers(prev => [newSupplier, ...prev]);
    }
    setShowSupplierModal(false);
  }

  function handleDeleteSupplier(id: string) {
    if (confirm('Bạn có chắc chắn muốn xóa đối tác / nhà cung cấp này?')) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
    }
  }

  // New receipt handlers
  function handleAddReceiptRow() {
    setNewItems(prev => [
      ...prev,
      {
        maSanPham: 'PT' + Math.floor(Math.random() * 900 + 100),
        tenSanPham: 'Phụ tùng / Linh kiện bổ sung',
        loai: 'PhuTung',
        donViTinh: 'Bộ',
        soLuong: 10,
        donGiaNhap: 150000,
      },
    ]);
  }

  function handleRemoveReceiptRow(idx: number) {
    if (newItems.length <= 1) {
      alert('Phiếu nhập phải có ít nhất 1 mặt hàng!');
      return;
    }
    setNewItems(prev => prev.filter((_, i) => i !== idx));
  }

  function handleCreateReceipt(e: React.FormEvent) {
    e.preventDefault();
    const targetNcc = suppliers.find(s => s.id === newNccId) || suppliers[0];
    const total = newItems.reduce((sum, item) => sum + item.soLuong * item.donGiaNhap, 0);

    const newReceipt: PurchaseReceipt = {
      id: `PN-202500${receipts.length + 1}`,
      nhaCungCapId: targetNcc.id,
      tenNhaCungCap: targetNcc.tenNhaCungCap,
      ngayLap: new Date().toISOString().replace('T', ' ').slice(0, 16),
      ngayNhap: new Date().toISOString().replace('T', ' ').slice(0, 16),
      nguoiLap: newNguoiLap,
      nguoiGiaoHang: newNguoiGiao || 'Đại diện kho vận',
      soDienThoaiGiao: newSdtGiao || targetNcc.soDienThoai,
      tongTien: total,
      trangThai: 'DaNhapKho',
      ghiChu: newGhiChu || 'Nhập kho phục vụ bán lẻ và xưởng dịch vụ',
      chiTiet: newItems.map((item, idx) => ({
        id: `CT-NEW-${Date.now()}-${idx}`,
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
    setSelectedReceipt(newReceipt); // Open view modal directly to inspect
  }

  function handleApproveReceipt(id: string) {
    setReceipts(prev =>
      prev.map(r => (r.id === id ? { ...r, trangThai: 'DaNhapKho' as const } : r))
    );
    if (selectedReceipt && selectedReceipt.id === id) {
      setSelectedReceipt(prev => (prev ? { ...prev, trangThai: 'DaNhapKho' } : null));
    }
  }

  const thSt: React.CSSProperties = {
    padding: '11px 16px',
    fontSize: 11,
    fontWeight: 700,
    textAlign: 'left',
    color: 'var(--color-zinc-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontFamily: 'var(--font-mono)',
    whiteSpace: 'nowrap',
    background: 'var(--color-zinc-50)',
  };

  const tdSt: React.CSSProperties = {
    padding: '13px 16px',
    fontSize: 13,
    color: 'var(--color-zinc-800)',
    borderTop: '1px solid var(--color-zinc-100)',
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
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
            ĐỐI TÁC & CHUỖI CUNG ỨNG
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--color-zinc-500)' }}>
            Quản lý nhà phân phối xe, hãng phụ tùng chính hãng và lịch sử phiếu nhập kho
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
              onClick={() => setShowNewReceiptModal(true)}
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

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-500 font-mono">TỔNG NHÀ CUNG CẤP</div>
          <div className="text-2xl font-black text-zinc-900 mt-1 font-display">
            {totalSuppliersCount} <span className="text-xs font-semibold text-emerald-600">({activeSuppliersCount} đang hoạt động)</span>
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
            {completedReceiptsCount} <span className="text-xs font-semibold text-zinc-400">đợt hàng</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-500 font-mono">CHỜ DUYỆT KIỂM KHO</div>
          <div className="text-2xl font-black text-amber-500 mt-1 font-display">
            {pendingReceiptsCount} <span className="text-xs font-semibold text-zinc-400">cần nghiệm thu</span>
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
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2"
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
            <polyline points="10 9 9 9 8 9" />
          </svg>
          📑 Quản lý Phiếu nhập kho ({receipts.length})
        </button>
      </div>

      {/* ───────────────────────── TAB 1: NHÀ CUNG CẤP ───────────────────────── */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Tìm theo tên NCC, MST, người liên hệ..."
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
              <span className="text-xs text-zinc-500 font-mono whitespace-nowrap">Ngành hàng:</span>
              <select
                value={supplierCategoryFilter}
                onChange={e => setSupplierCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-zinc-50 border border-zinc-200 focus:outline-none cursor-pointer font-sans"
              >
                <option value="All">Tất cả ngành hàng</option>
                <option value="Xe máy">Xe máy nguyên chiếc</option>
                <option value="Dầu nhớt">Dầu nhớt & Phụ gia</option>
                <option value="Lốp xe">Lốp xe máy</option>
                <option value="Phanh">Hệ thống phanh</option>
                <option value="Bugi">Bugi & Dây curoa</option>
              </select>
            </div>
          </div>

          {/* Suppliers Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map(s => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                      #{s.id}
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono"
                      style={{
                        background: s.trangThai === 'DangHopTac' ? '#dcfce7' : '#fee2e2',
                        color: s.trangThai === 'DangHopTac' ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {s.trangThai === 'DangHopTac' ? '● Đang hợp tác' : '○ Tạm ngưng'}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-zinc-900 leading-snug mb-1">
                    {s.tenNhaCungCap}
                  </h3>
                  <div className="text-xs text-zinc-500 font-mono mb-3">
                    MST: <span className="font-semibold text-zinc-700">{s.maSoThue}</span> · Chiết khấu:{' '}
                    <span className="font-bold text-emerald-600">{s.chietKhau}%</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3.5">
                    {s.nhomHang.map((nh, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-md text-[11px] font-medium"
                      >
                        {nh}
                      </span>
                    ))}
                  </div>

                  {/* Contact details */}
                  <div className="space-y-1.5 text-xs text-zinc-600 border-t border-zinc-100 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">👤 Đại diện:</span>
                      <span className="font-medium text-zinc-800">{s.nguoiLienHe}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">📞 Hotline:</span>
                      <a href={`tel:${s.soDienThoai}`} className="text-red-700 font-mono font-semibold hover:underline">
                        {s.soDienThoai}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">✉️ Email:</span>
                      <a href={`mailto:${s.email}`} className="text-zinc-700 truncate hover:underline">
                        {s.email}
                      </a>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-500 text-[11px] line-clamp-1">
                      <span className="text-zinc-400 shrink-0">📍 Kho:</span>
                      <span className="truncate">{s.diaChi}</span>
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <div className="text-xs text-zinc-400 font-mono">
                    ⭐ <span className="font-bold text-zinc-700">{s.danhGia}</span>/5.0
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditSupplierModal(s)}
                      className="px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg cursor-pointer transition"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(s.id)}
                      className="px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────── TAB 2: PHIẾU NHẬP KHO ───────────────────────── */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Tìm mã phiếu, nhà cung cấp, người lập..."
                value={receiptSearch}
                onChange={e => setReceiptSearch(e.target.value)}
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
                value={receiptStatusFilter}
                onChange={e => setReceiptStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-zinc-50 border border-zinc-200 focus:outline-none cursor-pointer font-sans"
              >
                <option value="All">Tất cả trạng thái</option>
                <option value="DaNhapKho">Đã nhập kho</option>
                <option value="ChoDuyet">Chờ duyệt</option>
                <option value="DaHuy">Đã hủy</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden bg-white border border-zinc-200 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th style={thSt}>MÃ PHIẾU</th>
                    <th style={thSt}>NHÀ CUNG CẤP</th>
                    <th style={thSt}>NGÀY NHẬP</th>
                    <th style={thSt}>NGƯỜI LẬP / THỦ KHO</th>
                    <th style={thSt}>MẶT HÀNG</th>
                    <th style={thSt}>TỔNG TIỀN</th>
                    <th style={thSt}>TRẠNG THÁI</th>
                    <th style={{ ...thSt, textAlign: 'center' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map(r => (
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
                        <span className="px-2 py-0.5 bg-zinc-100 rounded-md text-xs font-mono font-semibold text-zinc-700">
                          {r.chiTiet.length} sản phẩm
                        </span>
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
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white transition cursor-pointer flex items-center gap-1"
                          >
                            👁️ Xem chi tiết
                          </button>
                          {r.trangThai === 'ChoDuyet' && (
                            <button
                              onClick={() => handleApproveReceipt(r.id)}
                              title="Xác nhận duyệt nhập kho"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                            >
                              ✓ Duyệt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────── MODAL 1: XEM CHI TIẾT & IN BIÊN BẢN PHIẾU NHẬP ───────────────────────── */}
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
                      background: selectedReceipt.trangThai === 'DaNhapKho' ? '#dcfce7' : '#fef3c7',
                      color: selectedReceipt.trangThai === 'DaNhapKho' ? '#15803d' : '#b45309',
                    }}
                  >
                    {selectedReceipt.trangThai === 'DaNhapKho' ? '✓ ĐÃ NHẬP KHO' : '⏳ CHỜ DUYỆT'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mt-2 font-display uppercase tracking-wider">
                  BIÊN BẢN NHẬP KHO KIÊM GIAO NHẬN HÀNG HÓA
                </h2>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  Ngày lập phiếu: {selectedReceipt.ngayLap} · Ngày nhập kho: {selectedReceipt.ngayNhap}
                </p>
              </div>

              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 flex items-center justify-center text-sm font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Voucher Details */}
            <div className="p-6 space-y-6">
              {/* Delivery and Receiver Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
                {/* Bên Giao */}
                <div className="space-y-1.5">
                  <div className="font-bold text-zinc-900 font-mono uppercase tracking-wider text-[11px] text-red-700">
                    BÊN GIAO HÀNG (ĐỐI TÁC CUNG ỨNG)
                  </div>
                  <div className="font-semibold text-zinc-800 text-sm">
                    {selectedReceipt.tenNhaCungCap}
                  </div>
                  <div>
                    Người giao:{' '}
                    <span className="font-medium text-zinc-700">
                      {selectedReceipt.nguoiGiaoHang || 'Tài xế giao vận'}
                    </span>
                  </div>
                  <div>
                    SĐT giao hàng:{' '}
                    <span className="font-mono text-zinc-700">
                      {selectedReceipt.soDienThoaiGiao || '—'}
                    </span>
                  </div>
                </div>

                {/* Bên Nhận */}
                <div className="space-y-1.5 sm:border-l sm:border-zinc-200 sm:pl-4">
                  <div className="font-bold text-zinc-900 font-mono uppercase tracking-wider text-[11px] text-red-700">
                    BÊN NHẬN HÀNG (ĐẠI LÝ MOTOSHOP)
                  </div>
                  <div className="font-semibold text-zinc-800 text-sm">
                    HỆ THỐNG ĐẠI LÝ XE MÁY & PHỤ TÙNG CHÍNH HÃNG MOTOSHOP
                  </div>
                  <div>
                    Thủ kho / Người nhận:{' '}
                    <span className="font-medium text-zinc-700">{selectedReceipt.nguoiLap}</span>
                  </div>
                  <div>
                    Địa điểm nhập: <span className="text-zinc-700">Kho Trung Tâm - MOTOSHOP Q. Tân Bình, TP.HCM</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-600 mb-2">
                  CHI TIẾT MẶT HÀNG NHẬP KHO ({selectedReceipt.chiTiet.length} SẢN PHẨM)
                </h4>
                <div className="rounded-xl overflow-hidden border border-zinc-200">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-zinc-100 font-mono text-zinc-600 uppercase text-[11px]">
                      <tr>
                        <th className="p-3 w-12 text-center">STT</th>
                        <th className="p-3">Mã SKU</th>
                        <th className="p-3">Tên sản phẩm / phụ tùng</th>
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
                          <td className="p-3">
                            <div className="font-semibold text-zinc-900">{it.tenSanPham}</div>
                            <div className="text-[11px] text-zinc-400">
                              Phân loại: {it.loai === 'XeMay' ? 'Xe máy nguyên chiếc' : 'Phụ tùng chính hãng'}
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono">{it.donViTinh}</td>
                          <td className="p-3 text-right font-mono font-bold text-zinc-800">
                            {it.soLuong}
                          </td>
                          <td className="p-3 text-right font-mono text-zinc-600">
                            {formatVND(it.donGiaNhap)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-red-700">
                            {formatVND(it.thanhTien)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-50 font-bold border-t border-zinc-200">
                      <tr>
                        <td colSpan={4} className="p-3 text-right uppercase font-mono text-zinc-600">
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

              {/* 4 Signatures area for real documents */}
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
                  <div className="font-bold text-zinc-800 font-mono">GIÁM ĐỐC / KẾ TOÁN</div>
                  <div className="text-[11px] text-zinc-400 italic mt-0.5">(Ký, đóng dấu)</div>
                  <div className="mt-14 font-semibold text-zinc-700">Trần Văn Quản Lý</div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-zinc-200 flex items-center justify-between bg-zinc-50 rounded-b-2xl">
              <div className="text-xs text-zinc-400 font-mono">
                MOTOSHOP ERP & CRM VOUCHER SYSTEM
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  🖨️ In biên bản / Xuất PDF
                </button>
                {selectedReceipt.trangThai === 'ChoDuyet' && (
                  <button
                    onClick={() => handleApproveReceipt(selectedReceipt.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-sm"
                  >
                    ✓ Xác nhận duyệt nhập kho
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

      {/* ───────────────────────── MODAL 2: TẠO PHIẾU NHẬP KHO MỚI ───────────────────────── */}
      {showNewReceiptModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(3px)' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 font-display uppercase tracking-wider">
                  LẬP PHIẾU NHẬP KHO MỚI
                </h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">
                  Chọn nhà cung cấp và nhập thông tin các mặt hàng thực tế về kho
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
              {/* Top Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold font-mono text-zinc-700 mb-1">
                    NHÀ CUNG CẤP / PHÂN PHỐI *
                  </label>
                  <select
                    value={newNccId}
                    onChange={e => setNewNccId(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs bg-zinc-50 border border-zinc-200 font-sans focus:outline-none focus:border-red-600 cursor-pointer"
                    required
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.tenNhaCungCap} ({s.nhomHang[0]})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono text-zinc-700 mb-1">
                    NGƯỜI LẬP PHIẾU / THỦ KHO *
                  </label>
                  <input
                    type="text"
                    value={newNguoiLap}
                    onChange={e => setNewNguoiLap(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs bg-zinc-50 border border-zinc-200 font-sans focus:outline-none focus:border-red-600"
                    required
                  />
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

              {/* Items Lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold font-mono text-zinc-700">
                    DANH SÁCH MẶT HÀNG NHẬP KHO ({newItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddReceiptRow}
                    className="px-3 py-1 rounded-lg text-xs font-bold font-mono text-red-700 bg-red-50 hover:bg-red-100 transition cursor-pointer"
                  >
                    + Thêm dòng sản phẩm
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {newItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Tên sản phẩm / phụ tùng"
                          value={item.tenSanPham}
                          onChange={e => {
                            const val = e.target.value;
                            setNewItems(prev =>
                              prev.map((it, i) => (i === idx ? { ...it, tenSanPham: val } : it))
                            );
                          }}
                          className="w-full p-2 rounded-lg bg-white border border-zinc-200 text-xs focus:outline-none"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={item.donViTinh}
                          onChange={e => {
                            const val = e.target.value;
                            setNewItems(prev =>
                              prev.map((it, i) => (i === idx ? { ...it, donViTinh: val } : it))
                            );
                          }}
                          className="w-full p-2 rounded-lg bg-white border border-zinc-200 text-xs focus:outline-none"
                        >
                          <option value="Chai">Chai</option>
                          <option value="Bộ">Bộ</option>
                          <option value="Cái">Cái</option>
                          <option value="Chiếc">Chiếc</option>
                          <option value="Sợi">Sợi</option>
                          <option value="Hộp">Hộp</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="SL"
                          min="1"
                          value={item.soLuong}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setNewItems(prev =>
                              prev.map((it, i) => (i === idx ? { ...it, soLuong: val } : it))
                            );
                          }}
                          className="w-full p-2 rounded-lg bg-white border border-zinc-200 text-xs focus:outline-none font-mono"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Đơn giá"
                          min="0"
                          step="1000"
                          value={item.donGiaNhap}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setNewItems(prev =>
                              prev.map((it, i) => (i === idx ? { ...it, donGiaNhap: val } : it))
                            );
                          }}
                          className="w-full p-2 rounded-lg bg-white border border-zinc-200 text-xs focus:outline-none font-mono"
                          required
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveReceiptRow(idx)}
                          className="text-red-500 hover:text-red-700 font-bold p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total estimate */}
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-red-900 font-mono">TỔNG GIÁ TRỊ NHẬP KHO:</span>
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
                  placeholder="Ghi chú số hóa đơn đỏ, tình trạng niêm phong thùng hàng..."
                  className="w-full p-2.5 rounded-xl text-xs bg-zinc-50 border border-zinc-200 font-sans focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
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
                  ✓ Xác nhận lập & Lưu phiếu nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────── MODAL 3: THÊM / SỬA NHÀ CUNG CẤP ───────────────────────── */}
      {showSupplierModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(3px)' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 font-display uppercase tracking-wider">
                  {editingSupplier ? 'CẬP NHẬT NHÀ CUNG CẤP' : 'THÊM NHÀ CUNG CẤP MỚI'}
                </h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">
                  Nhập thông tin pháp nhân đối tác phân phối hoặc hãng phụ tùng
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
                  TÊN DOANH NGHIỆP / NHÀ CUNG CẤP *
                </label>
                <input
                  type="text"
                  placeholder="VD: Công ty TNHH Honda Việt Nam"
                  value={supplierFormData.tenNhaCungCap || ''}
                  onChange={e => setSupplierFormData({ ...supplierFormData, tenNhaCungCap: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold font-mono text-zinc-700 mb-1">MÃ SỐ THUẾ *</label>
                  <input
                    type="text"
                    placeholder="VD: 0303889123"
                    value={supplierFormData.maSoThue || ''}
                    onChange={e => setSupplierFormData({ ...supplierFormData, maSoThue: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold font-mono text-zinc-700 mb-1">CHIẾT KHẤU ĐẠI LÝ (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={supplierFormData.chietKhau || 0}
                    onChange={e => setSupplierFormData({ ...supplierFormData, chietKhau: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold font-mono text-zinc-700 mb-1">NGƯỜI LIÊN HỆ ĐẠI DIỆN</label>
                  <input
                    type="text"
                    placeholder="Họ tên người phụ trách"
                    value={supplierFormData.nguoiLienHe || ''}
                    onChange={e => setSupplierFormData({ ...supplierFormData, nguoiLienHe: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block font-bold font-mono text-zinc-700 mb-1">HOTLINE ĐẶT HÀNG *</label>
                  <input
                    type="text"
                    placeholder="SĐT liên hệ"
                    value={supplierFormData.soDienThoai || ''}
                    onChange={e => setSupplierFormData({ ...supplierFormData, soDienThoai: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold font-mono text-zinc-700 mb-1">EMAIL BÁO GIÁ</label>
                  <input
                    type="email"
                    placeholder="sales@supplier.com"
                    value={supplierFormData.email || ''}
                    onChange={e => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block font-bold font-mono text-zinc-700 mb-1">TRẠNG THÁI HỢP TÁC</label>
                  <select
                    value={supplierFormData.trangThai || 'DangHopTac'}
                    onChange={e => setSupplierFormData({ ...supplierFormData, trangThai: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600"
                  >
                    <option value="DangHopTac">Đang hợp tác</option>
                    <option value="TamNgung">Tạm ngưng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold font-mono text-zinc-700 mb-1">ĐỊA CHỈ TRỤ SỞ / KHO HÀNG</label>
                <input
                  type="text"
                  placeholder="Địa chỉ trụ sở hoặc kho hàng"
                  value={supplierFormData.diaChi || ''}
                  onChange={e => setSupplierFormData({ ...supplierFormData, diaChi: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block font-bold font-mono text-zinc-700 mb-1">GHI CHÚ / CHÍNH SÁCH BẢO HÀNH</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thời hạn công nợ, quy định đổi trả linh kiện hỏng..."
                  value={supplierFormData.ghiChu || ''}
                  onChange={e => setSupplierFormData({ ...supplierFormData, ghiChu: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-red-600"
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
                  className="px-5 py-2 rounded-xl font-bold bg-red-700 hover:bg-red-800 text-white transition cursor-pointer shadow-md"
                >
                  {editingSupplier ? '✓ Lưu thay đổi' : '+ Thêm nhà cung cấp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
