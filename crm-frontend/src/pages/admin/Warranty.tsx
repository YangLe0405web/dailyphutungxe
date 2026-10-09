import React, { useState, useEffect, useMemo } from 'react';
import {
  type WarrantyAppointment,
  type WarrantyAppointmentStatus,
  type WarrantyDecision,
  type TechnicalAssessment,
  WARRANTY_BRANCHES,
  WARRANTY_ISSUES_LIST,
  formatVND,
} from '../../data/mockData';
import { warrantyApi } from '../../services/api';

type TabKey = 'TatCa' | 'ChoTiepNhan' | 'DaXacNhan' | 'DangXuLy' | 'DaHoanThanh' | 'DaHuy';

const statusConfig: Record<
  WarrantyAppointmentStatus,
  { label: string; color: string; bg: string; tab: TabKey }
> = {
  ChoTiepNhan: { label: 'Chờ tiếp nhận', color: '#b45309', bg: '#fef3c7', tab: 'ChoTiepNhan' },
  DaXacNhan: { label: 'Đã xác nhận', color: '#1d4ed8', bg: '#dbeafe', tab: 'DaXacNhan' },
  DaTiepNhan: { label: 'Đã tiếp nhận', color: '#0369a1', bg: '#e0f2fe', tab: 'DangXuLy' },
  DangKiemTra: { label: 'Đang kiểm tra', color: '#c2410c', bg: '#ffedd5', tab: 'DangXuLy' },
  SuaChuaBH: { label: 'Đang sửa chữa (BH)', color: '#047857', bg: '#d1fae5', tab: 'DangXuLy' },
  KiemTraSauSuaBH: { label: 'Kiểm tra sau sửa', color: '#0f766e', bg: '#ccfbf1', tab: 'DangXuLy' },
  TuChoi: { label: 'Từ chối BH', color: '#be123c', bg: '#ffe4e6', tab: 'DangXuLy' },
  BaoGia: { label: 'Đã báo giá', color: '#7c3aed', bg: '#f3e8ff', tab: 'DangXuLy' },
  SuaCoPhi: { label: 'Đang sửa có phí', color: '#ea580c', bg: '#ffedd5', tab: 'DangXuLy' },
  KiemTraSauSuaCoPhi: { label: 'Kiểm tra sau sửa', color: '#0f766e', bg: '#ccfbf1', tab: 'DangXuLy' },
  DongYeuCau: { label: 'Đã đóng yêu cầu', color: '#4b5563', bg: '#f3f4f6', tab: 'DaHuy' },
  HoanTat: { label: 'Đã hoàn thành', color: '#15803d', bg: '#dcfce7', tab: 'DaHoanThanh' },
  DaHuy: { label: 'Đã hủy', color: '#991b1b', bg: '#fee2e2', tab: 'DaHuy' },
};

export const WarrantyPage: React.FC = () => {
  const [appointments, setAppointments] = useState<WarrantyAppointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<WarrantyAppointment | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('TatCa');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // State cho Form Đánh giá Kỹ thuật & Quyết định (Ảnh 5)
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [odoKm, setOdoKm] = useState<number>(0);
  const [techImages, setTechImages] = useState<string[]>([]);
  const [techNotes, setTechNotes] = useState('');
  const [selectedDecision, setSelectedDecision] = useState<WarrantyDecision>(null);
  const [quotePrice, setQuotePrice] = useState<number>(0);

  // Modal in phiếu
  const [printingAppt, setPrintingAppt] = useState<{
    appt: WarrantyAppointment;
    type: 'PhieuBaoHanh' | 'HoaDonSuaChua' | 'BienBanTraXe';
  } | null>(null);

  // Modal tạo lịch hẹn nhanh tại quầy
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newForm, setNewForm] = useState({
    hoTenKH: '',
    soDienThoai: '',
    tenXe: '',
    bienSo: '',
    odoKhachBao: 10000,
    vanDeGapPhai: ['Động cơ / Động cơ kêu to'],
    moTaChiTiet: '',
    ngayHen: new Date().toISOString().split('T')[0],
    gioHen: '09:00',
    chiNhanh: WARRANTY_BRANCHES[0],
  });

  const loadData = () => {
    const list = warrantyApi.getAppointments();
    setAppointments(list);
    if (selectedAppt) {
      const refreshed = list.find(a => a.id === selectedAppt.id);
      if (refreshed) setSelectedAppt(refreshed);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('crm-admin-notification', handleUpdate);
    return () => window.removeEventListener('crm-admin-notification', handleUpdate);
  }, []);

  // Đồng bộ form kiểm tra khi mở 1 đơn
  useEffect(() => {
    if (selectedAppt) {
      const assessment = selectedAppt.danhGiaKyThuat;
      setSelectedIssues(assessment?.boPhanLoi || selectedAppt.vanDeGapPhai || []);
      setOdoKm(assessment?.soKmThucTe || selectedAppt.odoKhachBao || 0);
      setTechImages(
        assessment?.hinhAnhKyThuat && assessment.hinhAnhKyThuat.length > 0
          ? assessment.hinhAnhKyThuat
          : [
              'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format',
              'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&auto=format',
              'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=500&auto=format',
            ]
      );
      setTechNotes(
        assessment?.yKienKyThuat ||
          'Phát hiện bộ côn bị mòn tự nhiên, lốc máy có vết trầy xước do va đập ngoại lực nhẹ không thuộc phạm vi lỗi nhà sản xuất...'
      );
      setSelectedDecision(selectedAppt.quyetDinh || (selectedAppt.trangThai === 'DangKiemTra' ? 'DuocBaoHanh' : null));
      setQuotePrice(selectedAppt.chiPhiBaoGia || 450000);
    }
  }, [selectedAppt]);

  // Bộ lọc danh sách
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      // Tab filter
      if (activeTab === 'ChoTiepNhan' && a.trangThai !== 'ChoTiepNhan') return false;
      if (activeTab === 'DaXacNhan' && a.trangThai !== 'DaXacNhan') return false;
      if (activeTab === 'DangXuLy' && !['DaTiepNhan', 'DangKiemTra', 'SuaChuaBH', 'KiemTraSauSuaBH', 'TuChoi', 'BaoGia', 'SuaCoPhi', 'KiemTraSauSuaCoPhi'].includes(a.trangThai)) return false;
      if (activeTab === 'DaHoanThanh' && a.trangThai !== 'HoanTat') return false;
      if (activeTab === 'DaHuy' && !['DongYeuCau', 'DaHuy'].includes(a.trangThai)) return false;

      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          a.id.toLowerCase().includes(q) ||
          a.hoTenKH.toLowerCase().includes(q) ||
          a.soDienThoai.includes(q) ||
          a.tenXe.toLowerCase().includes(q) ||
          a.bienSo.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Branch filter
      if (branchFilter !== 'All' && !a.chiNhanh.includes(branchFilter)) return false;

      return true;
    });
  }, [appointments, activeTab, searchTerm, branchFilter]);

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
  const paginatedList = filteredAppointments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Đếm tab
  const counts = useMemo(() => {
    return {
      all: appointments.length,
      choTiepNhan: appointments.filter(a => a.trangThai === 'ChoTiepNhan').length,
      daXacNhan: appointments.filter(a => a.trangThai === 'DaXacNhan').length,
      dangXuLy: appointments.filter(a => ['DaTiepNhan', 'DangKiemTra', 'SuaChuaBH', 'KiemTraSauSuaBH', 'TuChoi', 'BaoGia', 'SuaCoPhi', 'KiemTraSauSuaCoPhi'].includes(a.trangThai)).length,
      hoanThanh: appointments.filter(a => a.trangThai === 'HoanTat').length,
      daHuy: appointments.filter(a => ['DongYeuCau', 'DaHuy'].includes(a.trangThai)).length,
    };
  }, [appointments]);

  // Hành động Admin xác nhận yêu cầu (từ Chờ tiếp nhận -> Đã xác nhận)
  const handleQuickConfirm = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await warrantyApi.confirmAppointment(id);
    loadData();
  };

  // Hành động Submit Đánh giá & Chuyển bước trong Chi tiết (Ảnh 5)
  const handleSaveDecisionAndAdvance = async () => {
    if (!selectedAppt) return;
    const assessment: TechnicalAssessment = {
      boPhanLoi: selectedIssues,
      soKmThucTe: odoKm,
      hinhAnhKyThuat: techImages,
      yKienKyThuat: techNotes,
      ngayDanhGia: new Date().toLocaleDateString('vi-VN'),
      kyThuatVien: 'KTV. Trần Minh Long',
    };

    if (selectedDecision) {
      await warrantyApi.submitDecision(selectedAppt.id, selectedDecision, assessment, quotePrice);
    } else {
      await warrantyApi.saveAssessment(selectedAppt.id, assessment);
    }
    loadData();
    alert('Đã lưu kết quả kiểm tra kỹ thuật & chuyển trạng thái tiếp theo thành công!');
  };

  // Hành động Chuyển bước tiếp theo trong tiến trình
  const handleAdvanceStep = async (nextStep: WarrantyAppointmentStatus) => {
    if (!selectedAppt) return;
    await warrantyApi.updateStep(selectedAppt.id, nextStep);
    loadData();
  };

  // Hành động Hoàn tất và mở Popup In Phiếu
  const handleCompleteAndPrint = async (printType: 'PhieuBaoHanh' | 'HoaDonSuaChua' | 'BienBanTraXe') => {
    if (!selectedAppt) return;
    await warrantyApi.completeAppointment(selectedAppt.id, printType);
    loadData();
    setPrintingAppt({ appt: { ...selectedAppt, trangThai: 'HoanTat', inPhieuLoai: printType }, type: printType });
  };

  // Tạo lịch hẹn bảo hành tại quầy
  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.hoTenKH || !newForm.soDienThoai || !newForm.tenXe) {
      alert('Vui lòng điền đủ thông tin khách hàng và xe!');
      return;
    }
    await warrantyApi.createAppointment({
      customerId: 'KH001',
      hoTenKH: newForm.hoTenKH,
      soDienThoai: newForm.soDienThoai,
      vehicleId: 'XE001',
      tenXe: newForm.tenXe,
      bienSo: newForm.bienSo || '59A1-123.45',
      odoKhachBao: Number(newForm.odoKhachBao) || 0,
      vanDeGapPhai: newForm.vanDeGapPhai,
      moTaChiTiet: newForm.moTaChiTiet || 'Khách đặt lịch bảo hành trực tiếp tại quầy.',
      ngayHen: newForm.ngayHen,
      gioHen: newForm.gioHen,
      chiNhanh: newForm.chiNhanh,
    });
    setShowCreateModal(false);
    loadData();
    alert('Đã tạo lịch hẹn bảo hành thành công!');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ───────────────── VIEW 1: TRANG CHI TIẾT YÊU CẦU BẢO HÀNH (ẢNH 5) ───────────────── */}
      {selectedAppt ? (
        <div className="space-y-6">
          {/* Top Breadcrumb & Return */}
          <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-zinc-200">
            <div className="text-xs sm:text-sm text-zinc-500 font-medium">
              <span
                onClick={() => setSelectedAppt(null)}
                className="hover:text-red-700 cursor-pointer transition underline"
              >
                Yêu cầu bảo hành
              </span>{' '}
              / <span className="text-zinc-900 font-bold">Chi tiết yêu cầu bảo hành {selectedAppt.id}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedAppt(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>← Quay lại danh sách</span>
            </button>
          </div>

          {/* Header Title */}
          <div>
            <h1
              className="text-2xl sm:text-3xl font-black text-zinc-950 uppercase tracking-tight flex items-center gap-3 flex-wrap"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span>CHI TIẾT YÊU CẦU BẢO HÀNH</span>
              <span className="text-blue-700 font-mono text-2xl">{selectedAppt.id}</span>
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm font-medium text-zinc-600 flex-wrap">
              <span className="text-zinc-900 font-bold">{selectedAppt.hoTenKH}</span>
              <span>-</span>
              <span className="text-zinc-800 font-semibold">{selectedAppt.tenXe}</span>
              <span className="font-mono text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200 text-xs">
                {selectedAppt.bienSo}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                ✓ Mua tại cửa hàng
              </span>
            </div>
          </div>

          {/* ── CARD TIMELINE 6 BƯỚC (CHUẨN ẢNH 5) ── */}
          <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-xs space-y-4">
            <div className="text-sm font-black text-zinc-900 uppercase font-mono tracking-wider">Timeline</div>

            {/* Steps Container */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {[
                {
                  step: 1,
                  key: 'DaXacNhan',
                  label: 'Đã xác nhận',
                  sub: selectedAppt.trangThai !== 'ChoTiepNhan' ? 'Đã hoàn thành' : 'Chờ xác nhận',
                  isDone: selectedAppt.trangThai !== 'ChoTiepNhan',
                  isCurrent: selectedAppt.trangThai === 'DaXacNhan',
                },
                {
                  step: 2,
                  key: 'DaTiepNhan',
                  label: 'Đã tiếp nhận',
                  sub: ['DaTiepNhan', 'DangKiemTra', 'SuaChuaBH', 'KiemTraSauSuaBH', 'SuaCoPhi', 'KiemTraSauSuaCoPhi', 'HoanTat', 'DongYeuCau'].includes(selectedAppt.trangThai)
                    ? 'Đã hoàn thành'
                    : 'Chờ xử lý',
                  isDone: ['DaTiepNhan', 'DangKiemTra', 'SuaChuaBH', 'KiemTraSauSuaBH', 'SuaCoPhi', 'KiemTraSauSuaCoPhi', 'HoanTat', 'DongYeuCau'].includes(selectedAppt.trangThai),
                  isCurrent: selectedAppt.trangThai === 'DaTiepNhan',
                },
                {
                  step: 3,
                  key: 'DangKiemTra',
                  label: 'Đang kiểm tra',
                  sub: selectedAppt.trangThai === 'DangKiemTra' ? 'Trạng thái hiện tại' : ['SuaChuaBH', 'KiemTraSauSuaBH', 'SuaCoPhi', 'KiemTraSauSuaCoPhi', 'HoanTat', 'DongYeuCau'].includes(selectedAppt.trangThai) ? 'Đã hoàn thành' : 'Chờ xử lý',
                  isDone: ['SuaChuaBH', 'KiemTraSauSuaBH', 'SuaCoPhi', 'KiemTraSauSuaCoPhi', 'HoanTat', 'DongYeuCau'].includes(selectedAppt.trangThai),
                  isCurrent: selectedAppt.trangThai === 'DangKiemTra',
                },
                {
                  step: 4,
                  key: 'DangSuaChua',
                  label: selectedAppt.quyetDinh === 'TuChoi_DongYSua' || selectedAppt.trangThai === 'SuaCoPhi' ? 'Đang sửa chữa (Có phí)' : 'Đang sửa chữa',
                  sub: ['SuaChuaBH', 'SuaCoPhi'].includes(selectedAppt.trangThai)
                    ? 'Trạng thái hiện tại'
                    : ['KiemTraSauSuaBH', 'KiemTraSauSuaCoPhi', 'HoanTat', 'DongYeuCau'].includes(selectedAppt.trangThai)
                    ? 'Đã hoàn thành'
                    : 'Chờ xử lý',
                  isDone: ['KiemTraSauSuaBH', 'KiemTraSauSuaCoPhi', 'HoanTat', 'DongYeuCau'].includes(selectedAppt.trangThai),
                  isCurrent: ['SuaChuaBH', 'SuaCoPhi'].includes(selectedAppt.trangThai),
                },
                {
                  step: 5,
                  key: 'KiemTraSauSua',
                  label: 'Kiểm tra sau sửa',
                  sub: ['KiemTraSauSuaBH', 'KiemTraSauSuaCoPhi'].includes(selectedAppt.trangThai)
                    ? 'Trạng thái hiện tại'
                    : ['HoanTat', 'DongYeuCau'].includes(selectedAppt.trangThai)
                    ? 'Đã hoàn thành'
                    : 'Chờ xử lý',
                  isDone: ['HoanTat', 'DongYeuCau'].includes(selectedAppt.trangThai),
                  isCurrent: ['KiemTraSauSuaBH', 'KiemTraSauSuaCoPhi'].includes(selectedAppt.trangThai),
                },
                {
                  step: 6,
                  key: 'HoanTat',
                  label: selectedAppt.trangThai === 'DongYeuCau' ? 'Đóng yêu cầu (Trả xe)' : 'Hoàn tất',
                  sub: ['HoanTat', 'DongYeuCau'].includes(selectedAppt.trangThai) ? 'Đã hoàn thành' : 'Chờ xử lý',
                  isDone: ['HoanTat', 'DongYeuCau'].includes(selectedAppt.trangThai),
                  isCurrent: ['HoanTat', 'DongYeuCau'].includes(selectedAppt.trangThai),
                },
              ].map(st => (
                <div
                  key={st.step}
                  className={`p-3 rounded-2xl border transition-all text-center relative ${
                    st.isCurrent
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500 shadow-xs'
                      : st.isDone
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-zinc-200 bg-zinc-50/50'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1.5">
                    {st.isDone ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        ✓
                      </div>
                    ) : st.isCurrent ? (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold animate-pulse ring-4 ring-blue-100">
                        ●
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center text-xs font-bold">
                        {st.step}
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-bold text-zinc-900 truncate" title={st.label}>
                    {st.label}
                  </div>
                  <div
                    className={`text-[10px] font-mono mt-0.5 ${
                      st.isCurrent
                        ? 'text-blue-700 font-bold'
                        : st.isDone
                        ? 'text-emerald-700 font-semibold'
                        : 'text-zinc-400'
                    }`}
                  >
                    {st.sub}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-zinc-500 italic pt-1 border-t border-zinc-100">
              * Tiến trình tiếp theo tự động hiển thị dựa trên phương án được chọn bên dưới
            </div>

            {/* Quick Actions to Advance Step if Already in Work */}
            {selectedAppt.trangThai === 'DaXacNhan' && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between gap-3">
                <span className="text-xs text-amber-900 font-semibold">
                  🚗 Khách đã mang xe đến? Tiếp nhận xe vào xưởng để bắt đầu kiểm tra.
                </span>
                <button
                  type="button"
                  onClick={() => handleAdvanceStep('DaTiepNhan')}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition cursor-pointer"
                >
                  ✓ Tiếp nhận xe
                </button>
              </div>
            )}

            {selectedAppt.trangThai === 'DaTiepNhan' && (
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-between gap-3">
                <span className="text-xs text-blue-900 font-semibold">
                  🔧 Kỹ thuật viên sẵn sàng tiếp nhận đo Odo và thẩm định tình trạng xe.
                </span>
                <button
                  type="button"
                  onClick={() => handleAdvanceStep('DangKiemTra')}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition cursor-pointer"
                >
                  🔧 Bắt đầu kiểm tra xe
                </button>
              </div>
            )}

            {selectedAppt.trangThai === 'SuaChuaBH' && (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3">
                <span className="text-xs text-emerald-900 font-semibold">
                  🛠️ Xe đang sửa chữa bảo hành (0 đ). Sau khi hoàn tất sửa chữa, chuyển sang bước Kiểm tra chất lượng.
                </span>
                <button
                  type="button"
                  onClick={() => handleAdvanceStep('KiemTraSauSuaBH')}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition cursor-pointer"
                >
                  Chuyển sang: Kiểm tra sau sửa chữa →
                </button>
              </div>
            )}

            {selectedAppt.trangThai === 'KiemTraSauSuaBH' && (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3">
                <span className="text-xs text-emerald-900 font-semibold">
                  ✅ Kiểm tra xe sau sửa chữa đạt chuẩn 100%. Sẵn sàng bàn giao và xuất Phiếu bảo hành.
                </span>
                <button
                  type="button"
                  onClick={() => handleCompleteAndPrint('PhieuBaoHanh')}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>🖨️ Hoàn tất & Xuất Phiếu Bảo Hành (0 đ)</span>
                </button>
              </div>
            )}

            {selectedAppt.trangThai === 'SuaCoPhi' && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between gap-3">
                <span className="text-xs text-amber-900 font-semibold">
                  ⚙️ Xe đang sửa chữa theo thỏa thuận báo giá ({formatVND(selectedAppt.chiPhiBaoGia || quotePrice)}).
                </span>
                <button
                  type="button"
                  onClick={() => handleAdvanceStep('KiemTraSauSuaCoPhi')}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition cursor-pointer"
                >
                  Chuyển sang: Kiểm tra sau sửa chữa →
                </button>
              </div>
            )}

            {selectedAppt.trangThai === 'KiemTraSauSuaCoPhi' && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between gap-3">
                <span className="text-xs text-amber-900 font-semibold">
                  ✅ Đã nghiệm thu sửa chữa có phí. Sẵn sàng bàn giao xe và xuất Hóa đơn sửa chữa.
                </span>
                <button
                  type="button"
                  onClick={() => handleCompleteAndPrint('HoaDonSuaChua')}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>🧾 Hoàn tất & Xuất Hóa Đơn Sửa Chữa</span>
                </button>
              </div>
            )}

            {selectedAppt.trangThai === 'HoanTat' && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎉</span>
                  <div className="text-xs font-semibold text-emerald-950">
                    <div>Yêu cầu bảo hành đã hoàn tất thành công!</div>
                    <div className="text-emerald-700 font-normal mt-0.5">
                      Ngày hoàn tất: <strong>{selectedAppt.ngayHoanTat || 'Hôm nay'}</strong> · Loại chứng từ: <strong>{selectedAppt.inPhieuLoai || 'Phiếu bảo hành'}</strong>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPrintingAppt({
                      appt: selectedAppt,
                      type: selectedAppt.inPhieuLoai || 'PhieuBaoHanh',
                    })
                  }
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>🖨️ In lại chứng từ / Phiếu</span>
                </button>
              </div>
            )}

            {selectedAppt.trangThai === 'DongYeuCau' && (
              <div className="p-4 bg-zinc-100 rounded-2xl border border-zinc-300 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs font-semibold text-zinc-700">
                  🚪 Yêu cầu đã đóng do khách không đồng ý sửa chữa có phí. Xe đã bàn giao nguyên trạng.
                </div>
                <button
                  type="button"
                  onClick={() => setPrintingAppt({ appt: selectedAppt, type: 'BienBanTraXe' })}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-white hover:bg-black shadow-sm transition cursor-pointer"
                >
                  📄 In Biên bản bàn giao xe
                </button>
              </div>
            )}
          </div>

          {/* ── 2 COLUMNS: KẾT QUẢ KIỂM TRA (TRÁI) vs QUYẾT ĐỊNH PHƯƠNG ÁN (PHẢI) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CỘT TRÁI: KẾT QUẢ KIỂM TRA & ĐÁNH GIÁ KỸ THUẬT */}
            <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-xs space-y-5">
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-950 uppercase font-mono tracking-wider">
                KẾT QUẢ KIỂM TRA & ĐÁNH GIÁ KỸ THUẬT
              </h3>

              {/* 1. Chọn bộ phận gặp vấn đề */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 block">
                  * Chọn bộ phận gặp vấn đề:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {WARRANTY_ISSUES_LIST.map(issue => {
                    const checked = selectedIssues.includes(issue);
                    return (
                      <label
                        key={issue}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                          checked
                            ? 'bg-blue-50/60 border-blue-400 text-blue-900 font-bold'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            if (e.target.checked) setSelectedIssues([...selectedIssues, issue]);
                            else setSelectedIssues(selectedIssues.filter(i => i !== issue));
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{issue}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 2. Nhập số KM hiện tại */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">
                  * Nhập Số KM hiện tại (Odo):
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    value={odoKm}
                    onChange={e => setOdoKm(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-zinc-300 focus:outline-none focus:border-blue-600 pr-10"
                    placeholder="12500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-zinc-400 font-mono">km</span>
                </div>
              </div>

              {/* 3. Hình ảnh & Video minh họa */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 block">
                  * Hình ảnh & Video minh họa:
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {techImages.map((img, idx) => (
                    <div key={idx} className="w-20 h-20 rounded-2xl overflow-hidden border border-zinc-200 relative group bg-zinc-100 shrink-0">
                      <img src={img} alt={`Tech ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setTechImages(techImages.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const sample =
                        techImages.length % 2 === 0
                          ? 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&auto=format'
                          : 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=500&auto=format';
                      setTechImages([...techImages, sample]);
                    }}
                    className="w-20 h-20 rounded-2xl border-2 border-dashed border-zinc-300 hover:border-blue-500 bg-zinc-50 hover:bg-blue-50/50 flex flex-col items-center justify-center text-zinc-500 text-xs font-bold transition cursor-pointer"
                  >
                    <span className="text-base">+</span>
                    <span className="text-[10px]">Thêm ảnh</span>
                  </button>
                </div>
              </div>

              {/* 4. Ý kiến & Mô tả chi tiết của kỹ thuật viên */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">
                  * Ý kiến & Mô tả chi tiết của kỹ thuật viên:
                </label>
                <textarea
                  rows={4}
                  value={techNotes}
                  onChange={e => setTechNotes(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-blue-600 font-sans"
                  placeholder="Ghi chú thẩm định lỗi, nguyên nhân hỏng hóc, phạm vi bảo hành..."
                />
              </div>
            </div>

            {/* CỘT PHẢI: QUYẾT ĐỊNH PHƯƠNG ÁN (CHUẨN ẢNH 5) */}
            <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm sm:text-base text-zinc-950 uppercase font-mono tracking-wider">
                  QUYẾT ĐỊNH PHƯƠNG ÁN
                </h3>
                <div className="text-xs text-zinc-500 font-medium">
                  Điều kiện chuyển trạng thái tiếp theo dựa trên quyết định thẩm định của kỹ thuật viên:
                </div>

                {/* Bảng chọn phương án */}
                <div className="space-y-3 pt-1">
                  {/* PHƯƠNG ÁN 1: ĐƯỢC BẢO HÀNH */}
                  <div
                    onClick={() => setSelectedDecision('DuocBaoHanh')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
                      selectedDecision === 'DuocBaoHanh'
                        ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                        : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                        selectedDecision === 'DuocBaoHanh' ? 'bg-blue-600 text-white font-bold' : 'border border-zinc-400 bg-white'
                      }`}
                    >
                      {selectedDecision === 'DuocBaoHanh' && '✓'}
                    </div>
                    <div className="flex-1">
                      <div className="inline-block px-3 py-1 rounded-xl text-xs font-extrabold bg-blue-700 text-white mb-1 shadow-2xs">
                        ✓ ĐƯỢC BẢO HÀNH
                      </div>
                      <div className="text-xs text-zinc-700 font-medium mt-1">
                        Tiến trình tiếp theo:{' '}
                        <strong className="text-blue-950 font-bold">
                          Đang sửa chữa → Kiểm tra sau sửa chữa → Hoàn tất
                        </strong>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1">
                        Chi phí bảo hành: <strong className="text-emerald-700">0 đ</strong> (Nhà sản xuất chi trả). Ở bước Hoàn tất sẽ xuất Phiếu bảo hành.
                      </div>
                    </div>
                  </div>

                  {/* PHƯƠNG ÁN 2: TỪ CHỐI BẢO HÀNH */}
                  <div
                    className={`p-4 rounded-2xl border-2 transition space-y-3 ${
                      selectedDecision?.startsWith('TuChoi')
                        ? 'border-amber-500 bg-amber-50/40'
                        : 'border-zinc-200 bg-zinc-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-zinc-200 text-zinc-800">
                        ✕ TỪ CHỐI BẢO HÀNH
                      </span>
                      <span className="text-xs text-zinc-500">(Không thuộc phạm vi bảo hành NSX)</span>
                    </div>

                    {/* Báo giá ước tính */}
                    <div className="p-3 bg-white rounded-xl border border-zinc-200 space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 block">
                        Báo giá sửa chữa có phí ước tính:
                      </label>
                      <div className="relative max-w-xs">
                        <input
                          type="number"
                          value={quotePrice}
                          onChange={e => setQuotePrice(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-zinc-300 focus:outline-none focus:border-amber-600 pr-10"
                          placeholder="450000"
                        />
                        <span className="absolute right-3 top-1.5 text-xs text-zinc-400 font-mono">₫</span>
                      </div>
                    </div>

                    {/* 2 Nhánh con của Từ chối */}
                    <div className="space-y-2 pt-1">
                      {/* Nhánh con A: Khách đồng ý sửa có phí */}
                      <div
                        onClick={() => setSelectedDecision('TuChoi_DongYSua')}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                          selectedDecision === 'TuChoi_DongYSua'
                            ? 'border-amber-600 bg-white ring-2 ring-amber-400 shadow-xs'
                            : 'border-zinc-200 bg-white hover:bg-zinc-50'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                            selectedDecision === 'TuChoi_DongYSua' ? 'bg-amber-600 text-white font-bold' : 'border border-zinc-400'
                          }`}
                        >
                          {selectedDecision === 'TuChoi_DongYSua' && '✓'}
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-zinc-900">🔧 Khách đồng ý sửa chữa (Có phí): </span>
                          <span className="text-zinc-600">Đang sửa chữa (Có phí) → Hoàn tất (In Hóa đơn)</span>
                        </div>
                      </div>

                      {/* Nhánh con B: Khách không đồng ý sửa */}
                      <div
                        onClick={() => setSelectedDecision('TuChoi_KhongSua')}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                          selectedDecision === 'TuChoi_KhongSua'
                            ? 'border-red-600 bg-white ring-2 ring-red-400 shadow-xs'
                            : 'border-zinc-200 bg-white hover:bg-zinc-50'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                            selectedDecision === 'TuChoi_KhongSua' ? 'bg-red-600 text-white font-bold' : 'border border-zinc-400'
                          }`}
                        >
                          {selectedDecision === 'TuChoi_KhongSua' && '✓'}
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-zinc-900">✕ Khách không sửa chữa: </span>
                          <span className="text-zinc-600">Hoàn tất (Trả xe nguyên trạng, không thu phí)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setSelectedAppt(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveDecisionAndAdvance}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Xác nhận & Tiếp tục →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ───────────────── VIEW 2: TRANG DANH SÁCH LỊCH HẸN BẢO HÀNH (ẢNH 4) ───────────────── */
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h1
                className="text-2xl sm:text-3xl font-black text-zinc-950 uppercase tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                QUẢN LÝ LỊCH HẸN BẢO HÀNH
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Theo dõi, xử lý và cập nhật các yêu cầu bảo hành, bảo dưỡng từ khách hàng.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
            >
              <span className="text-base font-bold">+</span>
              <span>ĐẶT LỊCH BẢO HÀNH</span>
            </button>
          </div>

          {/* Filter Tabs Chips (Chuẩn Ảnh 4) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
            {[
              { key: 'TatCa', label: `Tất cả (${counts.all})` },
              { key: 'ChoTiepNhan', label: `Chờ tiếp nhận (${counts.choTiepNhan})` },
              { key: 'DaXacNhan', label: `Đã xác nhận (${counts.daXacNhan})` },
              { key: 'DangXuLy', label: `Đang xử lý (${counts.dangXuLy})` },
              { key: 'DaHoanThanh', label: `Đã hoàn thành (${counts.hoanThanh})` },
              { key: 'DaHuy', label: `Đã hủy (${counts.daHuy})` },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key as TabKey);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap font-bold border ${
                  activeTab === tab.key
                    ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Select Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="🔍 Tìm kiếm mã, tên, SĐT, biển số..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-blue-600 bg-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-700"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value)}
              className="px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-blue-600 bg-white font-medium"
            >
              <option value="All">Thời gian (Tất cả)</option>
              <option value="ThisWeek">Thời gian (Tuần này)</option>
              <option value="ThisMonth">Thời gian (Tháng này)</option>
            </select>

            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-blue-600 bg-white font-medium truncate"
            >
              <option value="All">Tất cả chi nhánh</option>
              <option value="Quận 1">CN 1 - Quận 1</option>
              <option value="Bình Thạnh">CN 2 - Bình Thạnh</option>
              <option value="Quận 7">CN 3 - Quận 7</option>
              <option value="Thủ Đức">CN 4 - Thủ Đức</option>
            </select>
          </div>

          {/* Subtitle Bảng dữ liệu */}
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">
            BẢNG DỮ LIỆU
          </div>

          {/* Table Container */}
          <div className="rounded-3xl bg-white border border-zinc-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                    <th className="py-3.5 px-4">MÃ LỊCH HẸN</th>
                    <th className="py-3.5 px-4">KHÁCH HÀNG</th>
                    <th className="py-3.5 px-4">PHƯƠNG TIỆN</th>
                    <th className="py-3.5 px-4">VẤN ĐỀ CẦN KIỂM TRA</th>
                    <th className="py-3.5 px-4">NGÀY GIỜ HẸN</th>
                    <th className="py-3.5 px-4">CHI NHÁNH</th>
                    <th className="py-3.5 px-4">TRẠNG THÁI</th>
                    <th className="py-3.5 px-4 text-center">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs font-sans">
                  {paginatedList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-400">
                        Không tìm thấy yêu cầu bảo hành nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map(appt => {
                      const cfg = statusConfig[appt.trangThai] || {
                        label: appt.trangThai,
                        color: '#4b5563',
                        bg: '#f3f4f6',
                      };
                      return (
                        <tr
                          key={appt.id}
                          onClick={() => setSelectedAppt(appt)}
                          className="hover:bg-zinc-50/70 transition cursor-pointer group"
                        >
                          {/* Mã lịch hẹn */}
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                            {appt.id}
                          </td>

                          {/* Khách hàng */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-zinc-900">{appt.hoTenKH}</div>
                            <div className="text-[11px] text-zinc-500 font-mono">{appt.soDienThoai}</div>
                          </td>

                          {/* Phương tiện */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-zinc-800">{appt.tenXe}</div>
                            <div className="text-[11px] text-zinc-500 font-mono">
                              ({appt.bienSo})
                            </div>
                          </td>

                          {/* Vấn đề cần kiểm tra */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                              {appt.vanDeGapPhai.slice(0, 2).map((vd, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md text-[10px] bg-zinc-100 text-zinc-700 border border-zinc-200 truncate max-w-[140px]"
                                  title={vd}
                                >
                                  {vd}
                                </span>
                              ))}
                              {appt.vanDeGapPhai.length > 2 && (
                                <span className="text-[10px] text-zinc-400 font-bold">
                                  +{appt.vanDeGapPhai.length - 2}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Ngày giờ hẹn */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-mono text-zinc-900 font-bold">{appt.gioHen} -</div>
                            <div className="text-[11px] text-zinc-500 font-mono">{appt.ngayHen}</div>
                          </td>

                          {/* Chi nhánh */}
                          <td className="py-3.5 px-4 text-zinc-700 font-medium whitespace-nowrap">
                            {appt.chiNhanh.split(' - ')[1] || appt.chiNhanh}
                          </td>

                          {/* Trạng thái */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className="px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5"
                              style={{ backgroundColor: cfg.bg, color: cfg.color }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                              {cfg.label}
                            </span>
                          </td>

                          {/* Thao tác */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {appt.trangThai === 'ChoTiepNhan' && (
                                <button
                                  type="button"
                                  onClick={e => handleQuickConfirm(e, appt.id)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                                  title="Xác nhận lịch hẹn nhanh"
                                >
                                  Xác nhận
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedAppt(appt)}
                                className="px-3 py-1 rounded-lg text-[11px] font-bold bg-zinc-100 group-hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                              >
                                Xem chi tiết
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

            {/* Pagination Footer */}
            <div className="p-4 border-t border-zinc-100 flex items-center justify-between gap-4 text-xs font-mono text-zinc-500 flex-wrap">
              <div>
                Hiển thị {paginatedList.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
                {Math.min(currentPage * pageSize, filteredAppointments.length)} trên {filteredAppointments.length} kết quả
              </div>
              <div className="flex items-center gap-1 font-bold">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-2 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                >
                  ◀
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-7 h-7 rounded-lg border text-center cursor-pointer ${
                      currentPage === i + 1
                        ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                        : 'bg-white text-zinc-700 hover:bg-zinc-100 border-zinc-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-2 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                >
                  ▶
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL IN PHIẾU BẢO HÀNH / HÓA ĐƠN SỬA CHỮA ───────────────── */}
      {printingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs animate-in fade-in print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200 p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
            {/* Header In */}
            <div className="flex items-start justify-between border-b-2 border-red-700 pb-4">
              <div>
                <div className="text-base sm:text-lg font-black text-red-700 tracking-wide font-sans uppercase">
                  {printingAppt.type === 'PhieuBaoHanh'
                    ? 'PHIẾU BẢO HÀNH ĐIỆN TỬ CHÍNH HÃNG'
                    : printingAppt.type === 'HoaDonSuaChua'
                    ? 'HÓA ĐƠN DỊCH VỤ SỬA CHỮA & PHỤ TÙNG'
                    : 'BIÊN BẢN BÀN GIAO & TRẢ XE'}
                </div>
                <div className="text-xs text-zinc-500 font-mono mt-0.5">
                  HỆ THỐNG DAILYXEMAY CRM - {printingAppt.appt.chiNhanh}
                </div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <span>🖨️ In chứng từ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingAppt(null)}
                  className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Thông tin biên nhận */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
              <div>
                <span className="text-zinc-400 block text-[11px]">MÃ CHỨNG TỪ:</span>
                <span className="font-extrabold text-red-700 font-mono text-sm">{printingAppt.appt.id}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[11px]">NGÀY THỰC HIỆN:</span>
                <span className="font-semibold text-zinc-900 font-mono">{printingAppt.appt.ngayHoanTat || '15/10/2026'}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[11px]">KHÁCH HÀNG:</span>
                <span className="font-bold text-zinc-900">{printingAppt.appt.hoTenKH} ({printingAppt.appt.soDienThoai})</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[11px]">PHƯƠNG TIỆN:</span>
                <span className="font-bold text-zinc-900">{printingAppt.appt.tenXe} · BS: {printingAppt.appt.bienSo}</span>
              </div>
            </div>

            {/* Nội dung chi tiết */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-zinc-800 uppercase font-mono border-b pb-1">
                CHI TIẾT HẠNG MỤC THỰC HIỆN
              </div>
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-100 text-[11px] font-mono font-bold text-zinc-600">
                    <tr>
                      <th className="p-2.5 text-left">Hạng mục kiểm tra & sửa chữa</th>
                      <th className="p-2.5 text-left">Đánh giá kỹ thuật</th>
                      <th className="p-2.5 text-right">Chi phí (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <tr>
                      <td className="p-2.5 font-medium">{printingAppt.appt.vanDeGapPhai.join(', ')}</td>
                      <td className="p-2.5 text-zinc-600">
                        {printingAppt.type === 'PhieuBaoHanh'
                          ? 'Thay thế / sửa chữa theo tiêu chuẩn bảo hành chính hãng NSX'
                          : printingAppt.type === 'HoaDonSuaChua'
                          ? 'Sửa chữa có phí theo bảng giá niêm yết'
                          : 'Đã kiểm tra kỹ thuật & bàn giao xe nguyên trạng'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-zinc-900">
                        {printingAppt.type === 'PhieuBaoHanh' || printingAppt.type === 'BienBanTraXe'
                          ? '0 đ (Miễn phí)'
                          : formatVND(printingAppt.appt.chiPhiThucTe || printingAppt.appt.chiPhiBaoGia || 450000)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-zinc-50 border-t border-zinc-200 font-bold">
                    <tr>
                      <td colSpan={2} className="p-2.5 text-right uppercase text-xs">Tổng cộng thanh toán:</td>
                      <td className="p-2.5 text-right font-mono text-sm text-red-700">
                        {printingAppt.type === 'PhieuBaoHanh' || printingAppt.type === 'BienBanTraXe'
                          ? '0 đ'
                          : formatVND(printingAppt.appt.chiPhiThucTe || printingAppt.appt.chiPhiBaoGia || 450000)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Chữ ký */}
            <div className="grid grid-cols-2 gap-4 text-center pt-6 text-xs text-zinc-600">
              <div>
                <div className="font-bold text-zinc-900 mb-12">ĐẠI DIỆN KHÁCH HÀNG</div>
                <div className="font-medium text-zinc-500">(Ký và ghi rõ họ tên)</div>
              </div>
              <div>
                <div className="font-bold text-zinc-900 mb-12">KỸ THUẬT VIÊN TRƯỞNG</div>
                <div className="font-bold text-red-700">KTV. Trần Minh Long</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL ĐẶT LỊCH HẸN BẢO HÀNH NHANH TẠI QUẦY ───────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-zinc-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-zinc-950 uppercase font-mono">
                + ĐẶT LỊCH HẸN BẢO HÀNH TẠI QUẦY
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNew} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Họ tên khách hàng *</label>
                <input
                  type="text"
                  required
                  value={newForm.hoTenKH}
                  onChange={e => setNewForm({ ...newForm, hoTenKH: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={newForm.soDienThoai}
                    onChange={e => setNewForm({ ...newForm, soDienThoai: e.target.value })}
                    placeholder="0987654321"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Tên mẫu xe *</label>
                  <input
                    type="text"
                    required
                    value={newForm.tenXe}
                    onChange={e => setNewForm({ ...newForm, tenXe: e.target.value })}
                    placeholder="Honda Vision 110"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Biển số xe</label>
                  <input
                    type="text"
                    value={newForm.bienSo}
                    onChange={e => setNewForm({ ...newForm, bienSo: e.target.value })}
                    placeholder="59A1-123.45"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Số Odo (km)</label>
                  <input
                    type="number"
                    value={newForm.odoKhachBao}
                    onChange={e => setNewForm({ ...newForm, odoKhachBao: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Ngày hẹn</label>
                  <input
                    type="date"
                    value={newForm.ngayHen}
                    onChange={e => setNewForm({ ...newForm, ngayHen: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Giờ hẹn</label>
                  <input
                    type="time"
                    value={newForm.gioHen}
                    onChange={e => setNewForm({ ...newForm, gioHen: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Chi nhánh tiếp nhận</label>
                <select
                  value={newForm.chiNhanh}
                  onChange={e => setNewForm({ ...newForm, chiNhanh: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300"
                >
                  {WARRANTY_BRANCHES.map(b => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold"
                >
                  Tạo lịch hẹn bảo hành
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
