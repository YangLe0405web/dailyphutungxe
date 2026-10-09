import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  formatVND,
  getCustomerTier,
  INSURANCE_PACKAGES,
  type Customer,
  type Vehicle,
  type InsuranceContract,
  type InsurancePackage,
  type InsuranceStatus,
  type InsurancePackageType,
} from '../../data/mockData';
import { insuranceApi, customerApi, vehicleApi } from '../../services/api';
import RenewInsuranceModal from '../../components/customer/RenewInsuranceModal';

export default function InsurancePage() {
  const [contracts, setContracts] = useState<InsuranceContract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InsuranceStatus | 'All'>('All');
  const [packageFilter, setPackageFilter] = useState<InsurancePackageType | 'All'>('All');

  // Modal Create state (BHX01 POS)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustId, setSelectedCustId] = useState('');
  const [selectedVehId, setSelectedVehId] = useState('');
  const [selectedPkgType, setSelectedPkgType] = useState<InsurancePackageType>('TNDS_BAT_BUOC');
  const [durationYears, setDurationYears] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'TienMat' | 'ChuyenKhoan'>('TienMat');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [insurer, setInsurer] = useState('Tổng Công ty Bảo hiểm Bảo Việt');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customVeh, setCustomVeh] = useState({
    tenXe: '',
    bienSo: '',
    soKhung: '',
    soMay: '',
  });
  const [createNote, setCreateNote] = useState('');
  const [createErr, setCreateErr] = useState<string | null>(null);

  // Modal View / PDF state (BHX04)
  const [viewingContract, setViewingContract] = useState<InsuranceContract | null>(null);

  // Modal Gia hạn state (Mockup 2)
  const [renewingContract, setRenewingContract] = useState<InsuranceContract | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load contracts, customers, vehicles
  const loadData = async () => {
    try {
      const [cList, custList, vehList] = await Promise.all([
        insuranceApi.getAll(),
        customerApi.getAll(),
        vehicleApi.getAll(),
      ]);
      setContracts(cList);
      setCustomers(custList);
      setVehicles(vehList);
    } catch (err) {
      console.warn('Error loading insurance data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener('crm-data-refresh', handleRefresh);
    return () => window.removeEventListener('crm-data-refresh', handleRefresh);
  }, []);

  // Filter vehicles belonging to the selected customer in Create Modal
  const customerVehicles = useMemo(() => {
    if (!selectedCustId) return [];
    const custNum = parseInt(selectedCustId.replace(/\D/g, ''), 10);
    return vehicles.filter(v => {
      if (v.customerId === selectedCustId) return true;
      const vNum = parseInt(v.customerId.replace(/\D/g, ''), 10);
      return !isNaN(custNum) && !isNaN(vNum) && custNum === vNum;
    });
  }, [selectedCustId, vehicles]);

  // Selected customer object in Create Modal
  const currentSelectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustId);
  }, [selectedCustId, customers]);

  // Search customers by phone or email (Mockup 2)
  const searchedCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const q = customerSearch.toLowerCase().trim();
    return customers.filter(
      c =>
        c.soDienThoai.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.hoTen.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [customerSearch, customers]);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustId(c.id);
    setCustomerSearch('');
    const custNum = parseInt(c.id.replace(/\D/g, ''), 10);
    const vList = vehicles.filter(v => {
      if (v.customerId === c.id) return true;
      const vNum = parseInt(v.customerId.replace(/\D/g, ''), 10);
      return !isNaN(custNum) && !isNaN(vNum) && custNum === vNum;
    });
    if (vList.length > 0) {
      setSelectedVehId(vList[0].id);
      setCustomVeh({
        tenXe: vList[0].tenXe,
        bienSo: vList[0].bienSo,
        soKhung: vList[0].soKhung || '',
        soMay: '',
      });
    } else {
      setSelectedVehId('NEW');
      setCustomVeh({
        tenXe: '',
        bienSo: '',
        soKhung: '',
        soMay: '',
      });
    }
  };

  // Auto-fill vehicle details when choosing an existing vehicle
  useEffect(() => {
    if (selectedVehId && selectedVehId !== 'NEW') {
      const v = customerVehicles.find(x => x.id === selectedVehId);
      if (v) {
        setCustomVeh({
          tenXe: v.tenXe,
          bienSo: v.bienSo,
          soKhung: v.soKhung || '',
          soMay: '',
        });
      }
    }
  }, [selectedVehId, customerVehicles]);

  // Selected package details
  const currentPackageObj = useMemo(() => {
    return INSURANCE_PACKAGES.find(p => p.id === selectedPkgType) || INSURANCE_PACKAGES[0];
  }, [selectedPkgType]);

  const baseCalculatedFee: number = useMemo(() => {
    if (durationYears === 2) return currentPackageObj.phi2Nam || currentPackageObj.phi1Nam * 2;
    if (durationYears === 3) return currentPackageObj.phi1Nam * 3;
    return currentPackageObj.phi1Nam;
  }, [durationYears, currentPackageObj]);

  const vatFee = useMemo(() => Math.round(baseCalculatedFee * 0.1), [baseCalculatedFee]);
  const totalAmount = useMemo(() => Math.max(0, baseCalculatedFee + vatFee - couponDiscount), [baseCalculatedFee, vatFee, couponDiscount]);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const code = couponCode.trim().toUpperCase();
    if (code === 'MOTOCARE10' || code === 'VIP10' || code === 'GIAM10') {
      const disc = Math.round(baseCalculatedFee * 0.1);
      setCouponDiscount(disc);
      alert(`Áp dụng mã ${code} thành công! Giảm ${formatVND(disc)} (10%)`);
    } else {
      alert('Mã giảm giá không hợp lệ hoặc đã hết hạn!');
    }
  };

  // Handle Create Contract Submit (BHX01 POS)
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErr(null);

    if (!selectedCustId) {
      setCreateErr('Vui lòng tìm kiếm và chọn khách hàng!');
      return;
    }

    const tenXe = customVeh.tenXe.trim();
    const bienSo = customVeh.bienSo.trim();
    if (!tenXe || !bienSo) {
      setCreateErr('Vui lòng chọn hoặc nhập đầy đủ Tên xe và Biển số xe!');
      return;
    }

    const cust = currentSelectedCustomer!;
    const end = new Date(startDate);
    end.setFullYear(end.getFullYear() + durationYears);
    const endDateStr = end.toISOString().split('T')[0];

    const newContract = insuranceApi.create({
      customerId: cust.id,
      hoTenKH: cust.hoTen,
      soDienThoai: cust.soDienThoai,
      email: cust.email,
      diaChi: cust.diaChi,
      vehicleId: selectedVehId !== 'NEW' && selectedVehId ? selectedVehId : `XE-NEW-${Date.now().toString().slice(-4)}`,
      tenXe: tenXe,
      bienSo: bienSo,
      soKhung: customVeh.soKhung.trim() || `SK${Date.now().toString().slice(-8)}`,
      soMay: customVeh.soMay.trim() || `SM${Date.now().toString().slice(-8)}`,
      packageType: selectedPkgType,
      tenGoi: currentPackageObj.tenGoi,
      thoiHanNam: durationYears,
      phiBaoHiem: baseCalculatedFee,
      thueVAT: vatFee,
      tongTien: totalAmount,
      maGiamGia: couponCode.trim() || undefined,
      phuongThucThanhToan: paymentMethod,
      kenhDangKy: 'TaiQuay',
      nhaBaoHiem: insurer,
      ngayCap: new Date().toISOString().split('T')[0],
      ngayBatDau: startDate,
      ngayKetThuc: endDateStr,
      trangThai: 'HieuLuc',
      ghiChu: createNote.trim() || `Hợp đồng tạo tại quầy thu ngân (${paymentMethod === 'TienMat' ? 'Tiền mặt' : 'Chuyển khoản VietQR'}).`,
    });

    setShowCreateModal(false);
    setSelectedCustId('');
    setSelectedVehId('');
    setCreateNote('');
    setCouponCode('');
    setCouponDiscount(0);
    loadData();
    setViewingContract(newContract);
  };

  // Handle Confirm Renew Contract (Mockup 2)
  const handleConfirmRenew = (contract: InsuranceContract, years: number, method: 'TienMat' | 'ChuyenKhoan') => {
    const res = insuranceApi.renewContract(contract.id, years, method);
    if (res.success && res.contract) {
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 5000);
      setRenewingContract(null);
      loadData();
      setViewingContract(res.contract);
    } else {
      alert(res.message);
    }
  };

  // Handle Approve or Reject
  const handleUpdateStatus = (id: string, status: InsuranceStatus) => {
    insuranceApi.updateStatus(id, status);
  };

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return contracts.filter(c => {
      const matchSearch =
        !q ||
        c.soGCN.toLowerCase().includes(q) ||
        c.hoTenKH.toLowerCase().includes(q) ||
        c.soDienThoai.includes(q) ||
        c.bienSo.toLowerCase().includes(q) ||
        c.tenXe.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || c.trangThai === statusFilter;
      const matchPackage = packageFilter === 'All' || c.packageType === packageFilter;
      return matchSearch && matchStatus && matchPackage;
    });
  }, [contracts, search, statusFilter, packageFilter]);

  // KPIs
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.trangThai === 'HieuLuc').length;
  const pendingContracts = contracts.filter(c => c.trangThai === 'ChoDuyet').length;
  const totalInsuranceRevenue = contracts
    .filter(c => c.trangThai === 'HieuLuc')
    .reduce((sum, c) => sum + c.phiBaoHiem, 0);

  // Print PDF
  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            QUẢN LÝ BẢO HIỂM XE MÁY
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Cấp mới, thẩm định yêu cầu, tra cứu hợp đồng & giấy chứng nhận bảo hiểm điện tử (BHX01 - BHX05)
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCustId('');
            setCustomerSearch('');
            setSelectedVehId('');
            setCustomVeh({ tenXe: '', bienSo: '', soKhung: '', soMay: '' });
            setSelectedPkgType('TNDS_BAT_BUOC');
            setDurationYears(1);
            setPaymentMethod('TienMat');
            setCouponCode('');
            setCouponDiscount(0);
            setCreateErr(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-red-700 text-white hover:bg-red-800 shadow transition cursor-pointer self-start sm:self-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          + ĐĂNG KÝ BẢO HIỂM TẠI QUẦY (POS)
        </button>
      </div>

      {/* ── KPI STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng hợp đồng', value: totalContracts, sub: 'Toàn hệ thống CRM', color: 'var(--color-zinc-900)', border: 'border-zinc-200' },
          { label: '🟢 Đang hiệu lực', value: activeContracts, sub: 'Bảo vệ phương tiện', color: '#16a34a', border: 'border-green-200' },
          { label: '🟡 Yêu cầu chờ duyệt', value: pendingContracts, sub: 'Cần thẩm định ngay', color: '#d97706', border: 'border-amber-200' },
          { label: '💰 Doanh thu bảo hiểm', value: formatVND(totalInsuranceRevenue), sub: 'Hợp đồng đã thu phí', color: '#dc2626', border: 'border-red-200' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-4 bg-white border ${k.border} shadow-2xs`}>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{k.label}</div>
            <div
              className="text-2xl font-extrabold mt-1 truncate"
              style={{ fontFamily: 'var(--font-display)', color: k.color }}
            >
              {k.value}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1 font-mono">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── TOOLBAR: SEARCH & FILTERS ── */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Tìm biển số xe, tên khách hàng, SĐT, số GCN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-red-700 transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="text-xs px-3 py-2 rounded-xl border border-zinc-200 bg-white font-medium text-zinc-700 focus:outline-none focus:border-red-700 cursor-pointer"
        >
          <option value="All">Tất cả trạng thái</option>
          <option value="HieuLuc">🟢 Đang hiệu lực</option>
          <option value="ChoDuyet">🟡 Chờ phê duyệt</option>
          <option value="HetHan">🔴 Hết hiệu lực</option>
          <option value="TuChoi">❌ Đã từ chối</option>
        </select>

        <select
          value={packageFilter}
          onChange={e => setPackageFilter(e.target.value as any)}
          className="text-xs px-3 py-2 rounded-xl border border-zinc-200 bg-white font-medium text-zinc-700 focus:outline-none focus:border-red-700 cursor-pointer"
        >
          <option value="All">Tất cả gói bảo hiểm</option>
          <option value="TNDS_BAT_BUOC">TNDS Bắt buộc xe máy</option>
          <option value="VAT_CHAT_XE">Vật chất / Thân xe</option>
          <option value="TAI_NAN_NGUOI">Tai nạn người ngồi</option>
          <option value="TOAN_DIEN">Toàn diện 3-trong-1</option>
        </select>
      </div>

      {/* ── TABLE: CONTRACTS LIST ── */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950 text-white font-mono uppercase text-[11px] tracking-wider border-b border-zinc-800">
                <th className="py-3 px-4">Số GCN / Mã HĐ</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Phương tiện</th>
                <th className="py-3 px-4">Gói bảo hiểm</th>
                <th className="py-3 px-4">Thời hạn</th>
                <th className="py-3 px-4">Phí & Thanh toán</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-zinc-400 font-medium">
                    Không tìm thấy hợp đồng bảo hiểm nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c, idx) => {
                  const isPending = c.trangThai === 'ChoDuyet';
                  const isActive = c.trangThai === 'HieuLuc';
                  const isExpired = c.trangThai === 'HetHan';

                  return (
                    <tr key={c.id} className="hover:bg-zinc-50 transition">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-zinc-900">{c.soGCN}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">{c.nhaBaoHiem}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900">{c.hoTenKH}</div>
                        <div className="text-zinc-500 font-mono text-[11px] mt-0.5">{c.soDienThoai}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-800">{c.tenXe}</div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {c.bienSo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900">{c.tenGoi}</div>
                        <div className="text-[10px] text-zinc-400">{c.thoiHanNam} năm</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="text-zinc-700">{c.ngayBatDau}</div>
                        <div className="text-zinc-400">→ {c.ngayKetThuc}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-red-700">{formatVND(c.tongTien || c.phiBaoHiem)}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                          {c.phuongThucThanhToan === 'TienMat' ? (
                            <span className="text-emerald-700 font-semibold">💵 Tiền mặt</span>
                          ) : (
                            <span className="text-blue-700 font-semibold">📱 Chuyển khoản</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : isExpired
                              ? 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isActive && '🟢 Hiệu lực'}
                          {isPending && '🟡 Chờ duyệt'}
                          {isExpired && '🔴 Hết hạn'}
                          {c.trangThai === 'TuChoi' && '❌ Từ chối'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(c.id, 'HieuLuc')}
                                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                                title="Phê duyệt hợp đồng bảo hiểm"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(c.id, 'TuChoi')}
                                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-700 transition cursor-pointer"
                                title="Từ chối yêu cầu"
                              >
                                Hủy
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setViewingContract(c)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition cursor-pointer flex items-center gap-1"
                            title="Xem chi tiết & In giấy chứng nhận (BHX04)"
                          >
                            <span>GCN / PDF</span>
                          </button>
                          <button
                            onClick={() => setRenewingContract(c)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition cursor-pointer flex items-center gap-1"
                            title="Gia hạn thời hạn hợp đồng bảo hiểm này"
                          >
                            <span>🔄 Gia hạn</span>
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
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── MODAL ĐĂNG KÝ BẢO HIỂM TẠI CỬA HÀNG (POS - BHX01) ── */}
      {/* ────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200 p-6 sm:p-7 space-y-5 my-6 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center text-xl font-bold">
                  🛡️
                </div>
                <div>
                  <h3
                    className="text-base font-extrabold text-zinc-900 uppercase"
                    style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
                  >
                    ĐĂNG KÝ BẢO HIỂM TẠI CỬA HÀNG (POS)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Nhân viên trực tiếp tạo đơn & thu ngân cấp Giấy chứng nhận điện tử cho khách hàng
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center font-bold text-sm cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {createErr && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {createErr}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              {/* =========================================================================
                  MỤC 1: TÌM KIẾM TÀI KHOẢN KHÁCH HÀNG (SĐT / EMAIL THEO MOCKUP 2)
                  ========================================================================= */}
              <div className="space-y-2 p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900 uppercase font-mono flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-red-700 text-white flex items-center justify-center text-[11px]">1</span>
                    Tìm kiếm tài khoản khách hàng *
                  </label>
                  {currentSelectedCustomer && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustId('');
                        setSelectedVehId('');
                        setCustomerSearch('');
                      }}
                      className="text-[11px] font-semibold text-red-700 hover:underline cursor-pointer"
                    >
                      ✕ Chọn khách hàng khác
                    </button>
                  )}
                </div>

                {!currentSelectedCustomer ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Nhập số điện thoại hoặc email do khách hàng cung cấp..."
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold focus:outline-none focus:border-red-700 bg-white"
                        autoFocus
                      />
                    </div>

                    {/* Danh sách gợi ý tìm kiếm */}
                    {customerSearch.trim() && (
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg divide-y divide-zinc-100">
                        {searchedCustomers.length === 0 ? (
                          <div className="p-3 text-center text-xs text-zinc-500">
                            Không tìm thấy tài khoản với từ khóa "{customerSearch}".
                          </div>
                        ) : (
                          searchedCustomers.map(c => (
                            <div
                              key={c.id}
                              onClick={() => handleSelectCustomer(c)}
                              className="p-3 hover:bg-red-50/50 cursor-pointer transition flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-bold text-zinc-900">{c.hoTen}</div>
                                <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                                  SĐT: <strong className="text-zinc-800">{c.soDienThoai}</strong> · Email: {c.email}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-700 text-white hover:bg-red-800"
                              >
                                Chọn tài khoản →
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Dropdown danh sách nhanh */}
                    <div className="pt-1">
                      <select
                        value={selectedCustId}
                        onChange={e => {
                          const c = customers.find(x => x.id === e.target.value);
                          if (c) handleSelectCustomer(c);
                        }}
                        className="w-full p-2 rounded-xl border border-zinc-200 text-xs text-zinc-600 bg-white focus:outline-none"
                      >
                        <option value="">-- Hoặc chọn nhanh từ toàn bộ danh sách khách hàng ({customers.length} khách) --</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.hoTen} - {c.soDienThoai} ({c.diaChi})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  /* Đã chọn khách hàng */
                  <div className="p-3 rounded-xl bg-white border border-red-200 shadow-2xs flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-zinc-900">{currentSelectedCustomer.hoTen}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {getCustomerTier(currentSelectedCustomer.tongChiTieu).label}
                        </span>
                      </div>
                      <div className="text-zinc-600 font-mono text-[11px]">
                        📞 <strong>{currentSelectedCustomer.soDienThoai}</strong> · ✉️ {currentSelectedCustomer.email}
                      </div>
                      <div className="text-zinc-500 text-[11px]">
                        📍 {currentSelectedCustomer.diaChi}
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800">
                      ✓ Đã xác thực
                    </span>
                  </div>
                )}
              </div>

              {/* =========================================================================
                  MỤC 2: CHỌN PHƯƠNG TIỆN MUA HÀNG (THUỘC SỞ HỮU CỦA TÀI KHOẢN ĐÓ)
                  ========================================================================= */}
              <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                <label className="text-xs font-bold text-zinc-900 uppercase font-mono flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-700 text-white flex items-center justify-center text-[11px]">2</span>
                  Chọn phương tiện mua bảo hiểm *
                </label>

                {!selectedCustId ? (
                  <div className="p-4 rounded-xl border border-dashed border-zinc-300 text-center text-xs text-zinc-400">
                    Vui lòng tìm và chọn tài khoản khách hàng ở bước 1 để hiển thị danh sách xe sở hữu.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Danh sách xe của khách */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {customerVehicles.map(v => {
                        const isChosen = selectedVehId === v.id;
                        return (
                          <div
                            key={v.id}
                            onClick={() => setSelectedVehId(v.id)}
                            className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                              isChosen
                                ? 'border-red-700 bg-red-50/50 shadow-xs'
                                : 'border-zinc-200 hover:border-zinc-300 bg-white'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-xs text-zinc-900">{v.tenXe}</div>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-zinc-100 text-zinc-800 border border-zinc-200">
                                  {v.bienSo}
                                </span>
                                {v.soKhung && (
                                  <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[120px]">
                                    VIN: {v.soKhung}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isChosen ? 'border-red-700 bg-red-700 text-white text-xs' : 'border-zinc-300'
                            }`}>
                              {isChosen && '✓'}
                            </div>
                          </div>
                        );
                      })}

                      {/* Tùy chọn thêm xe mới */}
                      <div
                        onClick={() => {
                          setSelectedVehId('NEW');
                          setCustomVeh({ tenXe: '', bienSo: '', soKhung: '', soMay: '' });
                        }}
                        className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                          selectedVehId === 'NEW'
                            ? 'border-red-700 bg-red-50/50 shadow-xs'
                            : 'border-dashed border-zinc-300 hover:border-zinc-400 bg-white'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-zinc-800">➕ Phương tiện mới khác</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">Nhập biển số xe chưa lưu trong CRM</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedVehId === 'NEW' ? 'border-red-700 bg-red-700 text-white text-xs' : 'border-zinc-300'
                        }`}>
                          {selectedVehId === 'NEW' && '✓'}
                        </div>
                      </div>
                    </div>

                    {/* Chi tiết thông tin phương tiện */}
                    <div className="p-3 rounded-xl bg-white border border-zinc-200 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Tên xe / Dòng xe *</label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Honda SH 160i ABS"
                          value={customVeh.tenXe}
                          onChange={e => setCustomVeh(prev => ({ ...prev, tenXe: e.target.value }))}
                          className="w-full p-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-red-700"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Biển số đăng ký *</label>
                        <input
                          type="text"
                          placeholder="Ví dụ: 51K-123.45"
                          value={customVeh.bienSo}
                          onChange={e => setCustomVeh(prev => ({ ...prev, bienSo: e.target.value.toUpperCase() }))}
                          className="w-full p-2 text-xs rounded-xl border border-zinc-200 font-mono font-bold focus:outline-none focus:border-red-700"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Số khung (VIN)</label>
                        <input
                          type="text"
                          placeholder="Tùy chọn"
                          value={customVeh.soKhung}
                          onChange={e => setCustomVeh(prev => ({ ...prev, soKhung: e.target.value.toUpperCase() }))}
                          className="w-full p-2 text-xs rounded-xl border border-zinc-200 font-mono focus:outline-none focus:border-red-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Số máy (Engine No.)</label>
                        <input
                          type="text"
                          placeholder="Tùy chọn"
                          value={customVeh.soMay}
                          onChange={e => setCustomVeh(prev => ({ ...prev, soMay: e.target.value.toUpperCase() }))}
                          className="w-full p-2 text-xs rounded-xl border border-zinc-200 font-mono focus:outline-none focus:border-red-700"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* =========================================================================
                  MỤC 3: CHỌN GÓI BẢO HIỂM (3 GÓI THEO MOCKUP)
                  ========================================================================= */}
              <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                <label className="text-xs font-bold text-zinc-900 uppercase font-mono flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-700 text-white flex items-center justify-center text-[11px]">3</span>
                  Chọn gói bảo hiểm & Thời hạn *
                </label>

                {/* 3 cards gói */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {INSURANCE_PACKAGES.map(pkg => {
                    const isSelected = selectedPkgType === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkgType(pkg.id)}
                        className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-red-700 bg-red-50/60 shadow-xs ring-2 ring-red-500/10'
                            : 'border-zinc-200 hover:border-zinc-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xl">{pkg.icon}</span>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                              {pkg.badge}
                            </span>
                          </div>
                          <div className="font-extrabold text-xs text-zinc-900 mt-2">{pkg.tenGoi}</div>
                          <div className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                            {pkg.moTa}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-zinc-100 mt-2">
                          <div className="text-sm font-black text-red-700 font-mono">
                            {formatVND(pkg.phi1Nam)} <span className="text-[10px] font-normal text-zinc-400">/năm</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tùy chọn thời hạn & ngày hiệu lực & mã giảm giá */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Thời hạn hợp đồng</label>
                    <select
                      value={durationYears}
                      onChange={e => setDurationYears(parseInt(e.target.value, 10))}
                      className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 font-bold bg-white text-zinc-800 focus:outline-none focus:border-red-700 cursor-pointer"
                    >
                      <option value={1}>1 Năm ({formatVND(currentPackageObj.phi1Nam)})</option>
                      <option value={2}>2 Năm ({formatVND(currentPackageObj.phi2Nam)} - Ưu đãi)</option>
                      <option value={3}>3 Năm ({formatVND(currentPackageObj.phi1Nam * 3)} - Tối đa)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Ngày bắt đầu hiệu lực</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 font-bold bg-white text-zinc-800 focus:outline-none focus:border-red-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Mã giảm giá (nếu có)</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Mã: MOTOCARE10"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                        className="flex-1 p-2 text-xs rounded-xl border border-zinc-200 font-mono uppercase font-bold focus:outline-none focus:border-red-700 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-2.5 py-2 rounded-xl text-[11px] font-bold bg-zinc-900 text-white hover:bg-black cursor-pointer"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* =========================================================================
                  MỤC 4: PHƯƠNG THỨC THANH TOÁN & BẢNG TÍNH CHI PHÍ (MOCKUP 2)
                  ========================================================================= */}
              <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                <label className="text-xs font-bold text-zinc-900 uppercase font-mono flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-700 text-white flex items-center justify-center text-[11px]">4</span>
                  Phương thức thanh toán & Thu ngân *
                </label>

                {/* Chọn Tiền mặt hoặc Chuyển khoản */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TienMat')}
                    className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-center gap-2 ${
                      paymentMethod === 'TienMat'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <span className="text-xl">💵</span>
                    <div className="text-left">
                      <div className="text-xs font-extrabold">TIỀN MẶT TẠI QUẦY</div>
                      <div className="text-[10px] text-zinc-500">Thu trực tiếp tại quầy thu ngân</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ChuyenKhoan')}
                    className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-center gap-2 ${
                      paymentMethod === 'ChuyenKhoan'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs ring-2 ring-blue-500/20'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <span className="text-xl">📱</span>
                    <div className="text-left">
                      <div className="text-xs font-extrabold">CHUYỂN KHOẢN (VIETQR)</div>
                      <div className="text-[10px] text-zinc-500">Khách quét mã QR tại quầy</div>
                    </div>
                  </button>
                </div>

                {/* Nếu chọn Chuyển khoản VietQR */}
                {paymentMethod === 'ChuyenKhoan' && (
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-24 h-24 bg-white p-1 rounded-xl border border-blue-300 shadow-xs shrink-0 flex items-center justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=POS-INSURANCE-${totalAmount}`}
                        alt="VietQR"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-xs text-zinc-700 font-mono space-y-0.5">
                      <div className="text-blue-900 font-bold font-sans">Thông tin chuyển khoản:</div>
                      <div>Ngân hàng: <strong>Vietcombank (VCB)</strong></div>
                      <div>Số TK: <strong>9988 7766 5544</strong></div>
                      <div>Số tiền: <strong className="text-red-700 text-sm font-bold">{formatVND(totalAmount)}</strong></div>
                      <div>Nội dung: <strong>BH {customVeh.bienSo || 'XEMAY'} {currentSelectedCustomer?.soDienThoai}</strong></div>
                    </div>
                  </div>
                )}

                {/* Tóm tắt chi phí thanh toán */}
                <div className="p-4 rounded-2xl bg-zinc-900 text-white space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-300">
                    <span>Phí bảo hiểm gói ({durationYears} năm):</span>
                    <span className="font-mono">{formatVND(baseCalculatedFee)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Thuế GTGT / VAT (10%):</span>
                    <span className="font-mono">{formatVND(vatFee)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Giảm giá ({couponCode}):</span>
                      <span className="font-mono">-{formatVND(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="border-t border-zinc-700 pt-2 flex justify-between items-center">
                    <span className="font-bold text-sm">TỔNG TIỀN PHẢI THU:</span>
                    <span className="font-mono font-black text-amber-400 text-lg">
                      {formatVND(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-red-700 hover:bg-red-800 text-white transition shadow cursor-pointer font-display"
                >
                  ✓ XÁC NHẬN THANH TOÁN VÀ CẤP HỢP ĐỒNG (POS)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── MODAL XEM CHI TIẾT & TẢI GCN ĐIỆN TỬ PDF (BHX04) ── */}
      {/* ────────────────────────────────────────────────────────── */}
      {viewingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200 p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:max-w-none print:p-6">
            {/* Top Toolbar (Hide during print) */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-red-700 font-mono font-bold text-xs">HỢP ĐỒNG #{viewingContract.id}</span>
                <span className="text-zinc-400 font-mono">|</span>
                <span className="text-zinc-600 font-mono text-xs font-semibold">{viewingContract.soGCN}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintCertificate}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  <span>IN / TẢI GIẤY CHỨNG NHẬN (PDF)</span>
                </button>
                <button
                  onClick={() => setViewingContract(null)}
                  className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* MẪU GIẤY CHỨNG NHẬN BẢO HIỂM ĐIỆN TỬ CHUẨN */}
            <div className="border-2 border-red-700/80 rounded-2xl p-6 sm:p-8 relative bg-linear-to-b from-red-50/20 via-white to-red-50/10">
              {/* Header Quốc hiệu */}
              <div className="text-center space-y-1 pb-4 border-b border-zinc-200">
                <div className="text-[11px] font-bold tracking-wider text-zinc-800 uppercase font-sans">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-[10px] font-semibold text-zinc-600">Độc lập - Tự do - Hạnh phúc</div>
                <div className="pt-2">
                  <div
                    className="text-lg sm:text-xl font-extrabold text-red-700 uppercase"
                    style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
                  >
                    GIẤY CHỨNG NHẬN BẢO HIỂM XE MÁY ĐIỆN TỬ
                  </div>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">
                    Số GCN: <strong className="text-zinc-900 font-bold">{viewingContract.soGCN}</strong>
                  </div>
                </div>
              </div>

              {/* Thông tin 4 phần chính */}
              <div className="py-5 space-y-4 text-xs">
                {/* 1. ĐƠN VỊ BẢO HIỂM */}
                <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Đơn vị phát hành:</span>
                    <div className="font-extrabold text-zinc-900 text-xs sm:text-sm">{viewingContract.nhaBaoHiem}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    HỢP CHUẨN NĐ 67/2023/NĐ-CP
                  </span>
                </div>

                {/* 2. CHỦ XE */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                  <div className="text-[11px] font-bold text-zinc-900 uppercase font-mono tracking-wider">
                    I. THÔNG TIN CHỦ PHƯƠNG TIỆN
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-700">
                    <div>
                      Họ và tên: <strong className="text-zinc-900">{viewingContract.hoTenKH}</strong>
                    </div>
                    <div>
                      Số điện thoại: <strong className="text-zinc-900 font-mono">{viewingContract.soDienThoai}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      Địa chỉ: <span className="text-zinc-800">{viewingContract.diaChi}</span>
                    </div>
                  </div>
                </div>

                {/* 3. PHƯƠNG TIỆN */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                  <div className="text-[11px] font-bold text-zinc-900 uppercase font-mono tracking-wider">
                    II. THÔNG TIN XE ĐƯỢC BẢO HIỂM
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-zinc-700">
                    <div>
                      Dòng xe: <strong className="text-zinc-900">{viewingContract.tenXe}</strong>
                    </div>
                    <div>
                      Biển số đăng ký:{' '}
                      <strong className="text-red-700 font-mono font-extrabold">{viewingContract.bienSo}</strong>
                    </div>
                    <div>
                      Số khung: <span className="font-mono text-zinc-900">{viewingContract.soKhung}</span>
                    </div>
                    <div>
                      Số máy: <span className="font-mono text-zinc-900">{viewingContract.soMay || 'Theo giấy tờ xe'}</span>
                    </div>
                  </div>
                </div>

                {/* 4. GÓI BẢO HIỂM & THỜI HẠN */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                  <div className="text-[11px] font-bold text-zinc-900 uppercase font-mono tracking-wider">
                    III. NỘI DUNG VÀ THỜI HẠN BẢO HIỂM
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-700">
                    <div>
                      Gói bảo hiểm: <strong className="text-zinc-900">{viewingContract.tenGoi}</strong>
                    </div>
                    <div>
                      Thời hạn bảo hiểm: <strong className="text-zinc-900">{viewingContract.thoiHanNam} năm</strong>
                    </div>
                    <div>
                      Từ ngày: <strong className="text-zinc-900 font-mono">{viewingContract.ngayBatDau}</strong>
                    </div>
                    <div>
                      Đến ngày: <strong className="text-zinc-900 font-mono">{viewingContract.ngayKetThuc}</strong>
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between pt-1 border-t border-zinc-200">
                      <span className="font-semibold text-zinc-800">Tổng phí bảo hiểm đã thanh toán:</span>
                      <strong className="text-sm font-extrabold text-red-700 font-mono">
                        {formatVND(viewingContract.phiBaoHiem)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code & Dấu điện tử xác thực */}
              <div className="pt-4 border-t border-zinc-200 flex items-center justify-between flex-wrap gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-zinc-900 text-white flex flex-col items-center justify-center p-1 font-mono text-[9px] text-center shadow">
                    <span className="text-lg">📱</span>
                    <span>QR CHỨNG NHẬN</span>
                  </div>
                  <div className="text-left text-[10px] text-zinc-500">
                    <div>Quét mã để tra cứu trên Cổng Dịch vụ công</div>
                    <div className="font-mono font-bold text-zinc-700">Tra cứu: crm.dailyxemay.vn/gcn</div>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <div className="text-[10px] text-zinc-500 font-mono">Ngày cấp: {viewingContract.ngayCap}</div>
                  <div className="text-[11px] font-bold text-red-700 mt-1 uppercase font-serif tracking-wider">
                    [ĐÃ KÝ ĐIỆN TỬ VÀ ĐÓNG DẤU MỘC SỐ]
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ────────────────────────────────────────────────────────── */}
      {/* ── MODAL GIA HẠN HỢP ĐỒNG BẢO HIỂM TẠI QUẦY (MOCKUP 2) ── */}
      {/* ────────────────────────────────────────────────────────── */}
      {renewingContract && (
        <RenewInsuranceModal
          contract={renewingContract}
          isAdmin={true}
          onClose={() => setRenewingContract(null)}
          onConfirm={(years, method) => handleConfirmRenew(renewingContract, years, method)}
        />
      )}

      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
