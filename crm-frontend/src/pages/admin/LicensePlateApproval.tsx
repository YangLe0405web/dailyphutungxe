import React, { useState, useEffect, useMemo } from 'react';
import { vehicleApi, customerApi } from '../../services/api';
import { matchVietnameseSearch } from '../../utils/vietnameseSearch';
import {
  type Vehicle,
  type Customer,
  mockCustomers,
  mockVehicles,
  formatVND,
} from '../../data/mockData';

export default function LicensePlateApproval() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState<'All' | 'CuaHang' | 'NgoaiHeThong'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'ChoDuyet' | 'DaDuyet' | 'TuChoi'>('ChoDuyet');

  // Modals state
  const [previewCaVetImage, setPreviewCaVetImage] = useState<{ url: string; title: string; plate: string; vin?: string } | null>(null);
  const [rejectingVehicle, setRejectingVehicle] = useState<Vehicle | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingDetailVehicle, setViewingDetailVehicle] = useState<Vehicle | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [vList, cList] = await Promise.all([
        vehicleApi.getAll(),
        customerApi.getAll(),
      ]);
      if (vList) setVehicles(vList);
      if (cList) setCustomers(cList);
    } catch (err) {
      console.warn('Lỗi tải dữ liệu phê duyệt biển số:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener('crm-data-refresh', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    return () => {
      window.removeEventListener('crm-data-refresh', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, []);

  // Lắng nghe highlight từ Trung tâm thông báo Admin
  useEffect(() => {
    const handleHighlight = (payload?: any) => {
      let data = payload;
      if (!data) {
        try {
          const raw = sessionStorage.getItem('crm_admin_highlight');
          if (raw) data = JSON.parse(raw);
        } catch {}
      }
      if (data && (data.page === 'license-plates' || !data.page)) {
        const tid = String(data.targetId || data.keyword || '');
        if (tid) {
          setHighlightId(tid);
          setSearch(tid);
          setTimeout(() => setHighlightId(null), 8000);
        }
      }
    };

    handleHighlight();
    const onEvt = (e: any) => handleHighlight(e.detail);
    window.addEventListener('crm-admin-highlight-target', onEvt);
    return () => window.removeEventListener('crm-admin-highlight-target', onEvt);
  }, []);

  // Map khách hàng nhanh
  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach(c => {
      map.set(c.id, c);
      const num = parseInt(c.id.replace(/\D/g, ''), 10);
      if (!isNaN(num)) map.set(String(num), c);
    });
    return map;
  }, [customers]);

  // Danh sách xe có liên quan đến quy trình cấp / duyệt biển số hoặc xe mới đăng ký
  const plateRecords = useMemo(() => {
    return vehicles.filter(v => {
      // 1. Xe có biển số đang chờ duyệt, đã duyệt hoặc bị từ chối
      if (v.bienSoChoDuyet || v.trangThaiDuyetBienSo === 'ChoDuyet' || v.trangThaiDuyetBienSo === 'DaDuyet' || v.trangThaiDuyetBienSo === 'TuChoi') return true;
      // 2. Xe có trạng thái duyệt xe
      if (v.trangThaiDuyet === 'ChoDuyet' || v.trangThaiDuyet === 'DaDuyet' || v.trangThaiDuyet === 'TuChoi') return true;
      // 3. Xe mua tại cửa hàng đang trong trạng thái chờ cập nhật biển số
      if (v.trangThaiDuyetBienSo === 'ChoCapNhat') return true;
      // 4. Hoặc xe có đính kèm ảnh cà vẹt
      if (v.anhCaVet) return true;
      // 5. Xe ngoài hệ thống
      if (v.nguonGoc === 'NgoaiHeThong') return true;
      // 6. Xe đã có biển số thực tế
      if (v.bienSo && v.bienSo !== 'Chưa có biển số' && !v.bienSo.includes('Chưa có')) return true;
      return false;
    });
  }, [vehicles]);

  // Thống kê KPI Cards
  const stats = useMemo(() => {
    const pendingPlates = plateRecords.filter(v => (v.trangThaiDuyetBienSo === 'ChoDuyet' || Boolean(v.bienSoChoDuyet) || v.trangThaiDuyetBienSo === 'ChoCapNhat') && v.trangThaiDuyetBienSo !== 'DaDuyet' && v.trangThaiDuyetBienSo !== 'TuChoi').length;
    const pendingOutside = plateRecords.filter(v => v.nguonGoc === 'NgoaiHeThong' && ((v.trangThaiDuyet === 'ChoDuyet' || v.trangThaiDuyetBienSo === 'ChoDuyet') && v.trangThaiDuyetBienSo !== 'TuChoi')).length;
    const approvedTotal = plateRecords.filter(v => v.trangThaiDuyetBienSo === 'DaDuyet' || (v.trangThaiDuyet === 'DaDuyet' && v.bienSo && v.bienSo !== 'Chưa có biển số')).length;
    const rejectedTotal = plateRecords.filter(v => v.trangThaiDuyetBienSo === 'TuChoi' || v.trangThaiDuyet === 'TuChoi').length;
    return { pendingPlates, pendingOutside, approvedTotal, rejectedTotal };
  }, [plateRecords]);

  // Lọc danh sách hiển thị
  const filteredRecords = useMemo(() => {
    return plateRecords.filter(v => {
      const cust = customerMap.get(v.customerId) || customerMap.get(String(parseInt(v.customerId.replace(/\D/g, ''), 10)));
      const custName = cust ? cust.hoTen.toLowerCase() : '';
      const custPhone = cust ? cust.soDienThoai : '';
      const q = search.toLowerCase().trim();

      // Search match
      const matchSearch =
        !search.trim() ||
        matchVietnameseSearch(v.id, search) ||
        matchVietnameseSearch(v.tenXe, search) ||
        matchVietnameseSearch(v.bienSo || '', search) ||
        matchVietnameseSearch(v.bienSoChoDuyet || '', search) ||
        matchVietnameseSearch(v.soKhung || '', search) ||
        (custName ? matchVietnameseSearch(custName, search) : false) ||
        (custPhone ? matchVietnameseSearch(custPhone, search) : false);

      // Source match
      const matchSource =
        filterSource === 'All'
          ? true
          : filterSource === 'CuaHang'
          ? v.nguonGoc === 'CuaHang'
          : v.nguonGoc === 'NgoaiHeThong';

      // Status match
      let matchStatus = true;
      if (filterStatus === 'ChoDuyet') {
        matchStatus = (v.trangThaiDuyetBienSo === 'ChoDuyet' || Boolean(v.bienSoChoDuyet) || v.trangThaiDuyetBienSo === 'ChoCapNhat') && v.trangThaiDuyetBienSo !== 'DaDuyet' && v.trangThaiDuyetBienSo !== 'TuChoi';
      } else if (filterStatus === 'DaDuyet') {
        matchStatus = v.trangThaiDuyetBienSo === 'DaDuyet' || Boolean(v.trangThaiDuyet === 'DaDuyet' && v.bienSo && v.bienSo !== 'Chưa có biển số');
      } else if (filterStatus === 'TuChoi') {
        matchStatus = v.trangThaiDuyetBienSo === 'TuChoi' || v.trangThaiDuyet === 'TuChoi';
      }

      return matchSearch && matchSource && matchStatus;
    });
  }, [plateRecords, search, filterSource, filterStatus, customerMap]);

  // Xử lý Phê duyệt biển số
  const handleApprove = async (vehicle: Vehicle) => {
    const proposedPlate = vehicle.bienSoChoDuyet || vehicle.bienSo;
    if (!proposedPlate || proposedPlate === 'Chưa có biển số') {
      alert('Không tìm thấy biển số đề xuất để duyệt!');
      return;
    }

    if (!window.confirm(`Xác nhận phê duyệt biển số chính thức "${proposedPlate}" cho xe "${vehicle.tenXe}"?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await vehicleApi.approveLicensePlate(vehicle.id);
      showToast(`✓ Đã phê duyệt thành công biển số ${proposedPlate} cho xe ${vehicle.tenXe}!`);
      setVehicles(prev =>
        prev.map(v =>
          (v.id === vehicle.id || parseInt(v.id.replace(/\D/g, ''), 10) === parseInt(vehicle.id.replace(/\D/g, ''), 10))
            ? {
                ...v,
                bienSo: proposedPlate,
                bienSoChoDuyet: undefined,
                trangThaiDuyetBienSo: 'DaDuyet',
                trangThaiDuyet: 'DaDuyet',
              }
            : v
        )
      );
      loadData();
    } catch (err: any) {
      showToast(`Lỗi phê duyệt biển số: ${err.message || 'Không thể cập nhật'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý Từ chối biển số
  const handleConfirmReject = async () => {
    if (!rejectingVehicle) return;
    if (!rejectReason.trim()) {
      alert('Vui lòng chọn hoặc nhập lý do từ chối để khách hàng nắm rõ thông tin.');
      return;
    }

    setIsSubmitting(true);
    try {
      await vehicleApi.rejectLicensePlate(rejectingVehicle.id, rejectReason.trim(), rejectingVehicle);
      // Cập nhật ngay lập tức vào state vehicles để phản ánh tức thì trên bảng
      setVehicles(prev =>
        prev.map(v =>
          v.id === rejectingVehicle.id
            ? { ...v, trangThaiDuyetBienSo: 'TuChoi', lyDoTuChoiBienSo: rejectReason.trim() }
            : v
        )
      );
      showToast(`⛔ Đã từ chối biển số của xe ${rejectingVehicle.tenXe} kèm phản hồi lý do tới khách hàng.`);
      setRejectingVehicle(null);
      setRejectReason('');
      loadData();
    } catch (err: any) {
      showToast(`Lỗi khi từ chối: ${err.message || 'Vui lòng thử lại'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickRejectReasons = [
    'Ảnh chụp Cà vẹt bị mờ hoặc bị mất góc, không đọc được số khung/số máy.',
    'Biển số đề xuất không trùng khớp với thông tin ghi trên giấy tờ Cà vẹt.',
    'Số khung (VIN) trên ảnh cà vẹt không trùng khớp với hồ sơ xe trong hệ thống.',
    'Hình ảnh giấy tờ không hợp lệ hoặc đã hết hạn đăng kiểm/sở hữu.',
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-zinc-950 text-white shadow-2xl border border-zinc-800 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="text-xl">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
          </span>
          <span className="text-xs font-semibold">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-zinc-400 hover:text-white cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 text-xs font-mono font-bold uppercase tracking-wider mb-1.5">
            <span>🛡️</span> CRM HỒ SƠ PHƯƠNG TIỆN
          </div>
          <h1 className="text-2xl font-black uppercase text-zinc-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            QUẢN LÝ PHÊ DUYỆT BIỂN SỐ XE & CÀ VẸT
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Kiểm tra giấy tờ cà vẹt, đối chiếu số khung VIN và phê duyệt cấp biển số chính thức cho phương tiện khách hàng
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-xs font-bold text-zinc-700 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Chờ duyệt biển số */}
        <div
          onClick={() => { setFilterStatus('ChoDuyet'); setFilterSource('All'); }}
          className={`p-5 rounded-2xl border transition cursor-pointer select-none ${
            filterStatus === 'ChoDuyet'
              ? 'bg-gradient-to-br from-blue-900 to-blue-950 text-white border-blue-700 shadow-md ring-2 ring-blue-500'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-blue-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${filterStatus === 'ChoDuyet' ? 'text-blue-200' : 'text-blue-700'}`}>
              Đang chờ duyệt biển số
            </span>
            <span className="text-xl">⏳</span>
          </div>
          <div className={`text-3xl font-black mt-2 font-mono ${filterStatus === 'ChoDuyet' ? 'text-white' : 'text-blue-600'}`}>
            {stats.pendingPlates}
          </div>
          <div className={`text-[11px] mt-1 ${filterStatus === 'ChoDuyet' ? 'text-blue-200' : 'text-zinc-500'}`}>
            Hồ sơ khách gửi kèm ảnh cà vẹt
          </div>
        </div>

        {/* Card 2: Xe ngoài hệ thống */}
        <div
          onClick={() => { setFilterSource('NgoaiHeThong'); setFilterStatus('All'); }}
          className={`p-5 rounded-2xl border transition cursor-pointer select-none ${
            filterSource === 'NgoaiHeThong'
              ? 'bg-gradient-to-br from-amber-900 to-amber-950 text-white border-amber-700 shadow-md ring-2 ring-amber-500'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${filterSource === 'NgoaiHeThong' ? 'text-amber-200' : 'text-amber-700'}`}>
              Xe ngoài hệ thống
            </span>
            <span className="text-xl">📋</span>
          </div>
          <div className={`text-3xl font-black mt-2 font-mono ${filterSource === 'NgoaiHeThong' ? 'text-white' : 'text-amber-600'}`}>
            {stats.pendingOutside}
          </div>
          <div className={`text-[11px] mt-1 ${filterSource === 'NgoaiHeThong' ? 'text-amber-200' : 'text-zinc-500'}`}>
            Khách tự đăng ký bảo dưỡng
          </div>
        </div>

        {/* Card 3: Đã phê duyệt */}
        <div
          onClick={() => { setFilterStatus('DaDuyet'); setFilterSource('All'); }}
          className={`p-5 rounded-2xl border transition cursor-pointer select-none ${
            filterStatus === 'DaDuyet'
              ? 'bg-gradient-to-br from-emerald-900 to-emerald-950 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${filterStatus === 'DaDuyet' ? 'text-emerald-200' : 'text-emerald-700'}`}>
              Đã phê duyệt hoàn tất
            </span>
            <span className="text-xl">✅</span>
          </div>
          <div className={`text-3xl font-black mt-2 font-mono ${filterStatus === 'DaDuyet' ? 'text-white' : 'text-emerald-600'}`}>
            {stats.approvedTotal}
          </div>
          <div className={`text-[11px] mt-1 ${filterStatus === 'DaDuyet' ? 'text-emerald-200' : 'text-zinc-500'}`}>
            Đã đồng bộ biển số vào DB
          </div>
        </div>

        {/* Card 4: Bị từ chối */}
        <div
          onClick={() => { setFilterStatus('TuChoi'); setFilterSource('All'); }}
          className={`p-5 rounded-2xl border transition cursor-pointer select-none ${
            filterStatus === 'TuChoi'
              ? 'bg-gradient-to-br from-red-900 to-red-950 text-white border-red-700 shadow-md ring-2 ring-red-500'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-red-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${filterStatus === 'TuChoi' ? 'text-red-200' : 'text-red-700'}`}>
              Đã từ chối hồ sơ
            </span>
            <span className="text-xl">⛔</span>
          </div>
          <div className={`text-3xl font-black mt-2 font-mono ${filterStatus === 'TuChoi' ? 'text-white' : 'text-red-600'}`}>
            {stats.rejectedTotal}
          </div>
          <div className={`text-[11px] mt-1 ${filterStatus === 'TuChoi' ? 'text-red-200' : 'text-zinc-500'}`}>
            Yêu cầu khách gửi lại giấy tờ
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-96 relative">
          <input
            type="text"
            placeholder="🔍 Tìm theo Tên khách, SĐT, Mã xe, Biển số..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:border-red-600 bg-zinc-50/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Nguồn gốc */}
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-zinc-300 text-xs font-semibold bg-white focus:outline-none focus:border-red-600 cursor-pointer"
          >
            <option value="All">Nguồn gốc: Tất cả</option>
            <option value="CuaHang">🏪 Xe mua tại Showroom</option>
            <option value="NgoaiHeThong">🌐 Xe ngoài hệ thống</option>
          </select>

          {/* Trạng thái */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-zinc-300 text-xs font-semibold bg-white focus:outline-none focus:border-red-600 cursor-pointer"
          >
            <option value="All">Trạng thái: Tất cả</option>
            <option value="ChoDuyet">⏳ Chờ phê duyệt ({stats.pendingPlates})</option>
            <option value="DaDuyet">✅ Đã phê duyệt ({stats.approvedTotal})</option>
            <option value="TuChoi">⛔ Bị từ chối ({stats.rejectedTotal})</option>
          </select>

          {(search || filterSource !== 'All' || filterStatus !== 'All') && (
            <button
              onClick={() => { setSearch(''); setFilterSource('All'); setFilterStatus('All'); }}
              className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
            >
              ↺ Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-white border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider">
                <th className="p-3.5 text-center">Mã xe</th>
                <th className="p-3.5">Khách hàng sở hữu</th>
                <th className="p-3.5">Thông tin phương tiện</th>
                <th className="p-3.5 text-center">Nguồn gốc</th>
                <th className="p-3.5 text-center">Biển số cũ ➔ Đề xuất</th>
                <th className="p-3.5 text-center">Ảnh Cà vẹt xe</th>
                <th className="p-3.5 text-center">Trạng thái duyệt</th>
                <th className="p-3.5 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-sans">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-400">
                    <div className="text-3xl mb-2">🏍️</div>
                    <div className="text-sm font-bold text-zinc-600">Không có hồ sơ biển số nào phù hợp</div>
                    <div className="text-xs text-zinc-400 mt-1">Khi khách hàng gửi yêu cầu cấp biển số mới kèm ảnh cà vẹt, hồ sơ sẽ hiển thị tại đây.</div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(v => {
                  const cust = customerMap.get(v.customerId) || customerMap.get(String(parseInt(v.customerId.replace(/\D/g, ''), 10)));
                  const isDaDuyet = v.trangThaiDuyetBienSo === 'DaDuyet';
                  const isTuChoi = v.trangThaiDuyetBienSo === 'TuChoi';
                  const isChoDuyet = !isDaDuyet && !isTuChoi && (v.trangThaiDuyetBienSo === 'ChoDuyet' || Boolean(v.bienSoChoDuyet));
                  const isCuaHang = v.nguonGoc === 'CuaHang';
                  const currentPlate = v.bienSo || 'Chưa có biển số';
                  const proposedPlate = v.bienSoChoDuyet || v.bienSo;

                  const isHighlighted = Boolean(
                    highlightId && (
                      v.id === highlightId ||
                      v.bienSo === highlightId ||
                      v.bienSoChoDuyet === highlightId ||
                      (v.id && highlightId && parseInt(v.id.replace(/\D/g, ''), 10) === parseInt(highlightId.replace(/\D/g, ''), 10))
                    )
                  );

                  return (
                    <tr
                      key={v.id}
                      className={`transition ${
                        isHighlighted
                          ? 'bg-amber-100/90 ring-2 ring-amber-500 font-semibold animate-pulse'
                          : 'hover:bg-zinc-50/80'
                      }`}
                    >
                      {/* Mã xe */}
                      <td className="p-3.5 text-center">
                        <span className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-md text-[11px]">
                          {v.id}
                        </span>
                        <div className="text-[10px] text-zinc-400 font-mono mt-1">
                          {v.ngayMua || '2026-10-25'}
                        </div>
                      </td>

                      {/* Khách hàng */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          {cust?.avatar ? (
                            <img src={cust.avatar} alt={cust.hoTen} className="w-8 h-8 rounded-full object-cover border border-zinc-200" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 font-bold flex items-center justify-center text-xs">
                              {cust?.hoTen ? cust.hoTen.charAt(0) : 'K'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-zinc-900 hover:text-red-700 cursor-pointer" onClick={() => setViewingDetailVehicle(v)}>
                              {cust?.hoTen || 'Khách hàng'}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-mono">
                              📞 {cust?.soDienThoai || 'Chưa có SĐT'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Thông tin phương tiện */}
                      <td className="p-3.5">
                        <div className="font-bold text-zinc-900">{v.tenXe}</div>
                        <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-2 mt-0.5">
                          <span>Màu: {v.mauSac || 'Tiêu chuẩn'}</span>
                          {v.soKhung && <span>• VIN: <strong className="text-zinc-800">{v.soKhung}</strong></span>}
                        </div>
                      </td>

                      {/* Nguồn gốc */}
                      <td className="p-3.5 text-center">
                        {isCuaHang ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            🏪 Showroom
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            🌐 Xe ngoài
                          </span>
                        )}
                      </td>

                      {/* Biển số cũ ➔ Đề xuất */}
                      <td className="p-3.5 text-center font-mono">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <span className="text-zinc-400 line-through text-[11px]">
                            {currentPlate.includes('Chưa có') || currentPlate.includes('TAM-') ? 'Chưa có' : currentPlate}
                          </span>
                          <span className="text-zinc-400 font-bold">➔</span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-zinc-900 text-amber-400 border border-amber-500/40 shadow-2xs">
                            {proposedPlate || 'Chưa có'}
                          </span>
                        </div>
                      </td>

                      {/* Ảnh Cà vẹt */}
                      <td className="p-3.5 text-center">
                        {v.anhCaVet ? (
                          <div className="flex flex-col items-center gap-1">
                            <img
                              src={v.anhCaVet}
                              alt="Ảnh Cà vẹt xe"
                              onClick={() => setPreviewCaVetImage({
                                url: v.anhCaVet!,
                                title: `Cà vẹt xe ${v.tenXe} (${cust?.hoTen || 'Khách hàng'})`,
                                plate: proposedPlate,
                                vin: v.soKhung,
                              })}
                              className="w-14 h-9 object-cover rounded-md border border-zinc-300 shadow-2xs cursor-pointer hover:scale-110 hover:border-red-500 transition duration-200"
                            />
                            <button
                              type="button"
                              onClick={() => setPreviewCaVetImage({
                                url: v.anhCaVet!,
                                title: `Cà vẹt xe ${v.tenXe} (${cust?.hoTen || 'Khách hàng'})`,
                                plate: proposedPlate,
                                vin: v.soKhung,
                              })}
                              className="text-[10px] text-red-600 hover:underline font-bold cursor-pointer"
                            >
                              🔍 Phóng to
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">Chưa có ảnh</span>
                        )}
                      </td>

                      {/* Trạng thái duyệt */}
                      <td className="p-3.5 text-center">
                        {isChoDuyet && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                            <span>⏳ Chờ duyệt</span>
                          </span>
                        )}
                        {isDaDuyet && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span>✓</span> <span>Đã phê duyệt</span>
                          </span>
                        )}
                        {isTuChoi && (
                          <div className="flex flex-col items-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                              ⛔ Bị từ chối
                            </span>
                            {v.lyDoTuChoiBienSo && (
                              <span className="text-[10px] text-zinc-500 max-w-[120px] truncate mt-0.5" title={v.lyDoTuChoiBienSo}>
                                {v.lyDoTuChoiBienSo}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Hành động */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {isChoDuyet && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(v)}
                                disabled={isSubmitting}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition cursor-pointer flex items-center gap-1"
                                title="Phê duyệt biển số chính thức"
                              >
                                <span>✓</span> <span>Duyệt</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingVehicle(v);
                                  setRejectReason(quickRejectReasons[0]);
                                }}
                                disabled={isSubmitting}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-2xs transition cursor-pointer flex items-center gap-1"
                                title="Từ chối yêu cầu và gửi lý do"
                              >
                                <span>✕</span> <span>Từ chối</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setViewingDetailVehicle(v)}
                            className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition cursor-pointer"
                            title="Xem chi tiết xe"
                          >
                            👁️
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

      {/* ══════════ MODAL 1: LIGHTBOX ZOOM XEM ẢNH CÀ VẸT ══════════ */}
      {previewCaVetImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs cursor-pointer animate-in fade-in duration-200"
          onClick={() => setPreviewCaVetImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] bg-zinc-950 rounded-3xl p-5 border border-zinc-800 shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-white mb-3">
              <div>
                <h3 className="font-bold text-sm">{previewCaVetImage.title}</h3>
                <div className="text-xs text-zinc-400 font-mono mt-0.5 flex items-center gap-3">
                  <span>Biển số đề xuất: <strong className="text-amber-400 font-bold text-sm">{previewCaVetImage.plate}</strong></span>
                  {previewCaVetImage.vin && <span>Số khung: <strong className="text-zinc-200">{previewCaVetImage.vin}</strong></span>}
                </div>
              </div>
              <button
                onClick={() => setPreviewCaVetImage(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Ảnh phóng to */}
            <div className="overflow-auto flex-1 flex items-center justify-center p-2 bg-zinc-900 rounded-2xl max-h-[70vh]">
              <img
                src={previewCaVetImage.url}
                alt="Ảnh Cà vẹt xe"
                className="max-w-full max-h-[68vh] object-contain rounded-xl shadow-lg border border-zinc-800"
              />
            </div>

            {/* Footer modal */}
            <div className="flex items-center justify-between pt-3 text-xs text-zinc-400 border-t border-zinc-800 mt-3">
              <span>💡 Mẹo: Quản trị viên đối chiếu số khung và biển số trên ảnh cà vẹt trước khi bấm Duyệt.</span>
              <button
                type="button"
                onClick={() => setPreviewCaVetImage(null)}
                className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL 2: TỪ CHỐI DUYỆT BIỂN SỐ XE ══════════ */}
      {rejectingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                  ⛔ TỪ CHỐI HỒ SƠ BIỂN SỐ XE
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Xe: {rejectingVehicle.tenXe} — Biển số: {rejectingVehicle.bienSoChoDuyet || rejectingVehicle.bienSo}
                </p>
              </div>
              <button
                onClick={() => setRejectingVehicle(null)}
                className="text-zinc-400 hover:text-zinc-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <label className="block font-semibold text-zinc-800">
                Chọn lý do từ chối nhanh hoặc nhập nội dung cụ thể:
              </label>

              <div className="space-y-2">
                {quickRejectReasons.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReason(qr)}
                    className={`w-full text-left p-2.5 rounded-xl border text-[11px] transition cursor-pointer flex items-center gap-2 ${
                      rejectReason === qr
                        ? 'border-red-500 bg-red-50 text-red-900 font-bold'
                        : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <span>{rejectReason === qr ? '🔘' : '⚪'}</span>
                    <span>{qr}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Nội dung phản hồi chi tiết tới khách hàng:</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể để khách hàng chỉnh sửa và chụp lại ảnh..."
                  className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setRejectingVehicle(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer transition flex items-center gap-1.5"
              >
                {isSubmitting ? 'Đang gửi...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL 3: XEM CHI TIẾT HỒ SƠ XE ══════════ */}
      {viewingDetailVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div>
                <span className="font-mono text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                  {viewingDetailVehicle.id}
                </span>
                <h3 className="font-extrabold text-base text-zinc-900 mt-1 uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                  {viewingDetailVehicle.tenXe}
                </h3>
              </div>
              <button
                onClick={() => setViewingDetailVehicle(null)}
                className="text-zinc-400 hover:text-zinc-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Biển số chính thức:</span>
                  <span className="font-mono font-bold text-sm text-zinc-900">{viewingDetailVehicle.bienSo || 'Chưa có biển số'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Biển số đề xuất duyệt:</span>
                  <span className="font-mono font-bold text-sm text-amber-600">{viewingDetailVehicle.bienSoChoDuyet || 'Không có đề xuất'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Số khung (VIN):</span>
                  <span className="font-mono font-semibold text-zinc-800">{viewingDetailVehicle.soKhung || '—'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Số máy:</span>
                  <span className="font-mono font-semibold text-zinc-800">{viewingDetailVehicle.soMay || '—'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Màu sắc:</span>
                  <span className="font-semibold text-zinc-800">{viewingDetailVehicle.mauSac || 'Tiêu chuẩn'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Nguồn gốc xe:</span>
                  <span className="font-semibold text-zinc-800">{viewingDetailVehicle.nguonGoc === 'CuaHang' ? 'Mua tại Showroom' : 'Xe ngoài hệ thống'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Hạn bảo hành chính hãng:</span>
                  <span className="font-mono font-bold text-emerald-700">{viewingDetailVehicle.hanBaoHanh || 'Không áp dụng'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Trạng thái duyệt biển:</span>
                  <span className="font-bold text-zinc-800">{viewingDetailVehicle.trangThaiDuyetBienSo || 'ChoDuyet'}</span>
                </div>
              </div>

              {viewingDetailVehicle.anhCaVet && (
                <div>
                  <label className="block font-bold text-zinc-700 mb-1.5">Ảnh Cà vẹt xe đính kèm:</label>
                  <img
                    src={viewingDetailVehicle.anhCaVet}
                    alt="Cà vẹt"
                    className="w-full max-h-48 object-contain rounded-xl border border-zinc-200 bg-zinc-900"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setViewingDetailVehicle(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
              >
                Đóng
              </button>
              {(!['DaDuyet', 'TuChoi'].includes(viewingDetailVehicle.trangThaiDuyetBienSo || '') && (viewingDetailVehicle.trangThaiDuyetBienSo === 'ChoDuyet' || viewingDetailVehicle.bienSoChoDuyet)) && (
                <button
                  type="button"
                  onClick={() => {
                    handleApprove(viewingDetailVehicle);
                    setViewingDetailVehicle(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow cursor-pointer"
                >
                  Phê duyệt ngay
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
