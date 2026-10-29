import { useState, useEffect, useMemo } from 'react';
import { matchVietnameseSearch } from '../../utils/vietnameseSearch';
import {
  mockCustomers,
  mockVehicles,
  mockOrders,
  mockAppointments,
  formatVND,
  getCustomerTier,
  computeSurveyStatus,
  formatSurveyDateTime,
  surveyStatusLabels,
  MOTORBIKE_BRANDS,
  ENGINE_CAPACITIES,
  formatVietnameseLicensePlate,
  isValidLicensePlate,
  INSURANCE_PACKAGES,
  PRESET_CUSTOMER_AVATARS,
  type OrderStatus,
  type AppointmentStatus,
  type Vehicle,
  type Customer,
  type Survey,
  type Order,
  type Appointment,
  type InsuranceContract,
  type InsurancePackageType,
  type InsuranceStatus,
  WARRANTY_BRANCHES,
  WARRANTY_ISSUES_LIST,
  EXTENDED_WARRANTY_PACKAGES,
  type WarrantyRecord,
  type Feedback,
  type Part,
  mockParts,
} from '../../data/mockData';
import {
  customerApi,
  vehicleApi,
  feedbackApi,
  surveyApi,
  orderApi,
  appointmentApi,
  insuranceApi,
  warrantyApi,
  addAdminNotification,
  chatApi,
  formatCustomerId,
  type PinnedChatContext,
  DEFAULT_CATALOG_VEHICLES,
  partApi,
} from '../../services/api';
import ImageUploader from '../../components/shared/ImageUploader';
import { WarrantyDetailView, WarrantyClaimFormView, ExtendedWarrantyModal } from '../../components/customer/WarrantyViews';
import WarrantyExtensionWizard from '../../components/customer/WarrantyExtensionWizard';
import OnlineInsurancePurchaseView from '../../components/customer/OnlineInsurancePurchaseView';
import RenewInsuranceModal from '../../components/customer/RenewInsuranceModal';
import { showroomVehicles } from './VehiclesShowroom';
import { useCart } from '../../contexts/CartContext';

interface CustomerDashboardProps {
  currentCustomer: Customer | null;
  onNavigateToShowroom?: () => void;
  onNavigateToSurvey?: () => void;
  onNavigateToCheckout?: () => void;
  onNavigateToStore?: () => void;
  onCustomerChange?: (c: Customer | null) => void;
}

const SVC_LABELS: Record<string, string> = {
  BaoDuong: 'Bảo dưỡng',
  SuaChua: 'Sửa chữa',
  LaiThu: 'Lái thử xe',
  BaoHanh: 'Bảo hành',
  NhanXe: 'Nhận xe mới',
};

const orderStatusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  ChoDuyet: { label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
  ChoKhachXacNhanNgayNhan: { label: 'Chờ bạn xác nhận ngày nhận', color: '#ea580c', bg: '#ffedd5' },
  DaXacNhan: { label: 'Đã xác nhận', color: '#0284c7', bg: '#e0f2fe' },
  DangGiao: { label: 'Đang giao', color: '#2563eb', bg: '#dbeafe' },
  DaGiao: { label: 'Đã giao tới nhà', color: '#059669', bg: '#d1fae5' },
  ChoGiaoXe: { label: 'Chờ giao xe', color: '#0284c7', bg: '#e0f2fe' },
  HoanThanh: { label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7' },
  DaHuy: { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
};

const apptStatusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  ChoXacNhan: { label: 'Chờ xác nhận', color: '#d97706', bg: '#fef3c7' },
  DaXacNhan: { label: 'Đã xác nhận', color: '#2563eb', bg: '#dbeafe' },
  TuChoi: { label: 'Từ chối', color: '#dc2626', bg: '#fee2e2' },
  DaHoanThanh: { label: 'Đã hoàn thành', color: '#16a34a', bg: '#dcfce7' },
  DaHuy: { label: 'Đã hủy', color: '#71717a', bg: '#f4f4f5' },
  ChoDuyet: { label: 'Chờ xác nhận', color: '#d97706', bg: '#fef3c7' },
  DangThucHien: { label: 'Đang thực hiện', color: '#2563eb', bg: '#dbeafe' },
  HoanThanh: { label: 'Đã hoàn thành', color: '#16a34a', bg: '#dcfce7' },
};

const insStatusConfig: Record<InsuranceStatus, { label: string; color: string; bg: string }> = {
  HieuLuc: { label: 'Còn hiệu lực', color: '#16a34a', bg: '#dcfce7' },
  ChoDuyet: { label: 'Chờ duyệt hồ sơ', color: '#d97706', bg: '#fef3c7' },
  HetHan: { label: 'Hết hạn', color: '#71717a', bg: '#f4f4f5' },
  TuChoi: { label: 'Bị từ chối', color: '#dc2626', bg: '#fee2e2' },
};

/* ── Status Badge ── */
function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-xs font-semibold px-2.5 py-1"
      style={{ background: bg, color, fontFamily: 'monospace' }}
    >
      <span className="rounded-full" style={{ width: 6, height: 6, background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* ── COMPONENT: KHẢO SÁT HỆ THỐNG DYNAMIC (KS01 - KS08) ── */
/* ──────────────────────────────────────────────────────────── */
interface DynamicSurveyTabProps {
  customer: Customer;
  myOrders?: Order[];
  myAppts?: Appointment[];
  myVehicles?: Vehicle[];
  highlightTarget?: { type: string; id?: string } | null;
}

function DynamicSurveyTab({
  customer,
  myOrders = [],
  myAppts = [],
  myVehicles = [],
  highlightTarget = null,
}: DynamicSurveyTabProps) {
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [answersMap, setAnswersMap] = useState<Record<string, Record<string, string>>>({});
  const [unansweredMap, setUnansweredMap] = useState<Record<string, string[]>>({});
  const [surveyToast, setSurveyToast] = useState<{ show: boolean; title: string; countdown: number } | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const loadSurveys = () => {
    const all = surveyApi.getAll();
    const custTier = getCustomerTier(customer.tongChiTieu).tier;
    const now = Date.now();

    // KS02: Hiển thị bài khảo sát mà khách đủ điều kiện theo ngữ cảnh
    const eligible = all.filter(s => {
      // KS08: Khảo sát phải đang diễn ra, chưa hết hạn và đã đến ngày bắt đầu
      const liveStatus = s.status || computeSurveyStatus(s);
      if (liveStatus !== 'DangDienRa') return false;
      if (s.endDate && new Date(s.endDate).getTime() < now) return false;
      if (s.startDate && new Date(s.startDate).getTime() > now) return false;

      const cNum = parseInt(customer.id.replace(/\D/g, ''), 10);
      if (s.targetCustomerId && s.targetCustomerId !== 'ALL') {
        const sNum = parseInt(s.targetCustomerId.replace(/\D/g, ''), 10);
        const matchId = s.targetCustomerId === customer.id || (!isNaN(cNum) && !isNaN(sNum) && cNum === sNum);
        const matchIds = s.targetCustomerIds && s.targetCustomerIds.some(id => id === customer.id || parseInt(id.replace(/\D/g, ''), 10) === cNum);
        return matchId || !!matchIds;
      }
      if (s.targetCustomerIds && s.targetCustomerIds.length > 0) {
        return s.targetCustomerIds.some(id => id === customer.id || parseInt(id.replace(/\D/g, ''), 10) === cNum);
      }
      if (s.targetCustomerId === 'ALL' || !s.targetCustomerId) {
        // Kiểm tra nếu bài khảo sát gắn với mã đơn hàng cụ thể trong tiêu đề (#DH-...)
        const orderMatch = (s.title + ' ' + (s.description || '')).match(/#(DH-[A-Z0-9-]+)/i);
        if (orderMatch && orderMatch[1]) {
          const ordId = orderMatch[1];
          const hasThisOrder = myOrders.some(o => o.id === ordId);
          if (!hasThisOrder) return false;
        }

        // Kiểm tra nếu bài khảo sát gắn với mã lịch hẹn cụ thể trong tiêu đề (#LH-...)
        const apptMatch = (s.title + ' ' + (s.description || '')).match(/#(LH-[A-Z0-9-]+)/i);
        if (apptMatch && apptMatch[1]) {
          const apptId = apptMatch[1];
          const hasThisAppt = myAppts.some(a => a.id === apptId || (a as any).maLichHen === apptId);
          if (!hasThisAppt) return false;
        }

        if (s.targetCustomerTier && s.targetCustomerTier !== 'ALL' && s.targetCustomerTier !== custTier) {
          return false;
        }

        // Kiểm tra ngữ cảnh trải nghiệm dịch vụ của khách
        const lower = (s.title + ' ' + (s.description || '')).toLowerCase();
        const isBaoDuong = lower.includes('bảo dưỡng') || lower.includes('sửa chữa') || lower.includes('kỹ thuật') || lower.includes('bảo hành');
        const isMuaXe = lower.includes('mua xe') || lower.includes('bàn giao xe') || lower.includes('xe mới');

        // KS01: Khảo sát bảo dưỡng CHỈ hiển thị sau khi khách hàng đã hoàn tất dịch vụ bảo dưỡng/sửa chữa
        if (isBaoDuong) {
          const hasCompletedMaintenance = myAppts.some(a =>
            (a.trangThai === 'DaHoanThanh' || a.trangThai === 'HoanThanh') &&
            (a.loaiDichVu === 'BaoDuong' || a.loaiDichVu === 'SuaChua' || a.loaiDichVu === 'BaoHanh')
          );
          if (!hasCompletedMaintenance) return false;
        }

        if (isMuaXe) {
          const hasXeOrder = myOrders.some(o => (o.loaiDon === 'Xe' || !!o.thongTinXe) && (o.trangThai === 'HoanThanh' || o.trangThai === 'DaGiao'));
          const hasDeliveryAppt = myAppts.some(a => a.loaiDichVu === 'NhanXe' && (a.trangThai === 'DaHoanThanh' || a.trangThai === 'HoanThanh'));
          if (!hasXeOrder && !hasDeliveryAppt) return false;
        }

        return true;
      }
      return false;
    });

    setActiveSurveys(eligible);

    const responses = surveyApi.getResponses();
    const custPhone = customer.soDienThoai ? customer.soDienThoai.replace(/\D/g, '') : '';
    const done = responses
      .filter(r => r.customerId === customer.id || (custPhone && r.soDienThoai && r.soDienThoai.replace(/\D/g, '') === custPhone))
      .map(r => r.surveyId);
    setCompletedIds(done);
  };

  useEffect(() => {
    loadSurveys();
    window.addEventListener('crm-data-refresh', loadSurveys);
    return () => window.removeEventListener('crm-data-refresh', loadSurveys);
  }, [customer.id, myOrders.length, myAppts.length, myVehicles.length]);

  // KS01: Tự động đếm ngược 4s và đóng khung cảm ơn
  useEffect(() => {
    if (!surveyToast) return;
    if (surveyToast.countdown <= 0) {
      setSurveyToast(null);
      return;
    }
    const timer = setInterval(() => {
      setSurveyToast(prev => {
        if (!prev) return null;
        if (prev.countdown <= 1) return null;
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [surveyToast?.show, surveyToast?.countdown]);

  const handleSelectAnswer = (surveyId: string, questionId: string, option: string) => {
    setAnswersMap(prev => ({
      ...prev,
      [surveyId]: {
        ...(prev[surveyId] || {}),
        [questionId]: option,
      },
    }));

    // KS04: Bỏ cảnh báo đỏ khi đã chọn đáp án
    setUnansweredMap(prev => {
      const currentList = prev[surveyId] || [];
      const updated = currentList.filter(id => id !== questionId);
      return { ...prev, [surveyId]: updated };
    });
    if (errorToast) setErrorToast(null);
  };

  const handleSubmitSurvey = (survey: Survey) => {
    // KS08: Kiểm tra trạng thái bài khảo sát
    const liveStatus = computeSurveyStatus(survey);
    if (liveStatus !== 'DangDienRa') {
      const statusInfo = surveyStatusLabels[liveStatus] || { label: liveStatus };
      setErrorToast(`⚠️ Cuộc khảo sát hiện tại chưa bắt đầu hoặc đã kết thúc (${statusInfo.label})!`);
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }

    // KS04: Bắt buộc chọn đáp án tất cả câu hỏi
    const sAnswers = answersMap[survey.id] || {};
    const missing = survey.questions
      .filter(q => !sAnswers[q.id] || !sAnswers[q.id].trim())
      .map(q => q.id);

    if (missing.length > 0) {
      setUnansweredMap(prev => ({ ...prev, [survey.id]: missing }));
      setErrorToast(`⚠️ Vui lòng hoàn thành tất cả câu hỏi trước khi gửi khảo sát! (Còn thiếu ${missing.length}/${survey.questions.length} câu)`);
      setTimeout(() => setErrorToast(null), 4000);

      const firstMissingEl = document.getElementById(`survey-${survey.id}-q-${missing[0]}`);
      if (firstMissingEl) {
        firstMissingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    surveyApi.submitResponse({
      surveyId: survey.id,
      customerId: customer.id,
      customerName: customer.hoTen,
      answers: sAnswers,
    });

    setCompletedIds(prev => [...prev, survey.id]);
    setSurveyToast({ show: true, title: survey.title, countdown: 4 });
  };

  return (
    <div className="space-y-6">
      {/* KS01: Khung cảm ơn tự đóng sau 4s */}
      {surveyToast && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="font-bold text-sm">CẢM ƠN BẠN ĐÃ GỬI PHẢN HỒI KHẢO SÁT!</div>
              <div className="text-xs text-emerald-400">
                Bài khảo sát <span className="font-bold underline">{surveyToast.title}</span> đã được ghi nhận. (Tự đóng sau {surveyToast.countdown}s)
              </div>
            </div>
          </div>
          <button onClick={() => setSurveyToast(null)} className="text-emerald-400 hover:text-white font-bold cursor-pointer">✕</button>
        </div>
      )}

      {errorToast && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{errorToast}</span>
          <button onClick={() => setErrorToast(null)} className="text-red-400 hover:text-white font-bold cursor-pointer">✕</button>
        </div>
      )}

      {activeSurveys.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#141417] border border-zinc-800 text-zinc-400">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-white font-bold text-base mb-1">Hiện không có khảo sát nào</h3>
          <p className="text-xs text-zinc-500">Các cuộc khảo sát mới từ hệ thống sẽ hiển thị tại đây khi bạn đủ điều kiện.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeSurveys.map(survey => {
            const isDone = completedIds.includes(survey.id);
            const liveStatus = computeSurveyStatus(survey);
            const isOngoing = liveStatus === 'DangDienRa';
            const isHighlighted = highlightTarget?.type === 'survey' && (
              !highlightTarget.id ||
              survey.id === highlightTarget.id ||
              survey.id.toLowerCase().includes((highlightTarget.id || '').toLowerCase())
            );

            return (
              <div
                key={survey.id}
                id={`target-survey-${survey.id}`}
                className={`p-6 rounded-3xl bg-[#141417] border space-y-4 transition ${
                  isHighlighted
                    ? 'ring-2 ring-red-500 bg-red-950/20 shadow-lg shadow-red-900/30 animate-pulse border-red-500'
                    : 'border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        MÃ: {survey.id}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        📅 {formatSurveyDateTime(survey.startDate)} - {formatSurveyDateTime(survey.endDate)}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white uppercase">{survey.title}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{survey.description}</p>
                  </div>
                  {isDone ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      ✓ ĐÃ HOÀN THÀNH
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800">
                      CHƯA HOÀN THÀNH
                    </span>
                  )}
                </div>

                {!isDone && isOngoing && (
                  <div className="space-y-4 pt-1">
                    {survey.questions.map((q, idx) => {
                      const curAnswer = answersMap[survey.id]?.[q.id];
                      const isUnans = unansweredMap[survey.id]?.includes(q.id);

                      return (
                        <div
                          key={q.id}
                          id={`survey-${survey.id}-q-${q.id}`}
                          className={`p-4 rounded-2xl border transition-all ${
                            isUnans ? 'border-red-500 bg-red-950/20' : 'border-zinc-800 bg-[#18181b]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="text-xs font-bold text-white">
                              <span className="text-red-500 mr-1.5 font-bold">Câu {idx + 1}.</span> {q.text}
                            </div>
                            {isUnans && (
                              <span className="text-[10px] font-bold text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800">
                                ⚠️ Chưa chọn đáp án
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.opts?.map((opt: string) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleSelectAnswer(survey.id, q.id, opt)}
                                className={`p-2.5 rounded-xl text-xs text-left transition border cursor-pointer ${
                                  curAnswer === opt
                                    ? 'bg-red-950/80 border-red-600 text-white font-bold shadow-xs'
                                    : 'bg-[#121214] border-zinc-800 text-zinc-300 hover:border-zinc-700'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleSubmitSurvey(survey)}
                        className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-md cursor-pointer"
                      >
                        GỬI CÂU TRẢ LỜI KHẢO SÁT ➔
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* ── MODAL: CHỈNH SỬA THÔNG TIN CÁ NHÂN (H01, H02) ── */
/* ──────────────────────────────────────────────────────────── */
function EditProfileModal({
  customer,
  onClose,
  onSave,
}: {
  customer: Customer;
  onClose: () => void;
  onSave: (updated: Customer) => void;
}) {
  const [form, setForm] = useState({
    hoTen: customer.hoTen,
    email: customer.email,
    soDienThoai: customer.soDienThoai,
    diaChi: customer.diaChi,
    ngaySinh: customer.ngaySinh,
    gioiTinh: customer.gioiTinh,
    avatar: customer.avatar || '',
    soThich: customer.soThich || 'Xe tay ga cao cấp',
  });
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.hoTen.trim() || !form.email.trim() || !form.soDienThoai.trim()) {
      setErr('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    // H01: Validate ngày sinh (>= 16 tuổi, không lớn hơn ngày hiện tại)
    if (form.ngaySinh) {
      const birthDate = new Date(form.ngaySinh);
      const today = new Date();
      if (birthDate > today) {
        setErr('Ngày sinh không hợp lệ! Không thể chọn ngày trong tương lai.');
        return;
      }
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < 16) {
        setErr(`Khách hàng phải từ đủ 16 tuổi trở lên (hiện tại ${age} tuổi)!`);
        return;
      }
    }

    onSave({
      ...customer,
      ...form,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#18181b] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-800 my-8 text-white">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="font-extrabold text-base uppercase text-white tracking-wide">
              ✏️ THAY ĐỔI THÔNG TIN CÁ NHÂN
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Mã KH: {customer.id}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-bold text-lg cursor-pointer">✕</button>
        </div>

        {err && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{err}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Họ và tên *</label>
            <input
              type="text"
              required
              value={form.hoTen}
              onChange={e => setForm({ ...form, hoTen: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Số điện thoại *</label>
              <input
                type="tel"
                required
                value={form.soDienThoai}
                onChange={e => setForm({ ...form, soDienThoai: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Địa chỉ giao hàng / cư trú</label>
            <input
              type="text"
              value={form.diaChi}
              onChange={e => setForm({ ...form, diaChi: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Ngày sinh (Đủ 16 tuổi)</label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={form.ngaySinh}
                onChange={e => setForm({ ...form, ngaySinh: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Giới tính</label>
              <select
                value={form.gioiTinh}
                onChange={e => setForm({ ...form, gioiTinh: e.target.value as 'Nam' | 'Nu' })}
                className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
              >
                <option value="Nam">Nam</option>
                <option value="Nu">Nữ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Sở thích phương tiện</label>
            <input
              type="text"
              placeholder="VD: Xe tay ga cao cấp, phượt thể thao..."
              value={form.soThich}
              onChange={e => setForm({ ...form, soThich: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
            />
          </div>

          {/* H02: Chọn Avatar Mẫu Có Sẵn */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Ảnh đại diện Avatar (Chọn mẫu nhanh hoặc tải lên)</label>
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
              {PRESET_CUSTOMER_AVATARS.map((presetUrl, idx) => {
                const isSelected = form.avatar === presetUrl;
                return (
                  <button
                    key={presetUrl}
                    type="button"
                    onClick={() => setForm({ ...form, avatar: presetUrl })}
                    className={`w-10 h-10 rounded-full shrink-0 overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                      isSelected ? 'border-red-600 ring-2 ring-red-400 scale-105' : 'border-zinc-700 hover:border-zinc-500 opacity-70 hover:opacity-100'
                    }`}
                    title={`Mẫu Avatar ${idx + 1}`}
                  >
                    <img src={presetUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover rounded-full" />
                  </button>
                );
              })}
            </div>
            <ImageUploader
              value={form.avatar}
              onChange={url => setForm({ ...form, avatar: url })}
              label="Hoặc tải ảnh đại diện từ máy / URL"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* ── MODAL: ĐỔI MẬT KHẨU KHÁCH HÀNG (TB04) ── */
/* ──────────────────────────────────────────────────────────── */
function ChangeCustomerPasswordModal({
  customer,
  onClose,
  onSuccess,
}: {
  customer: Customer;
  onClose: () => void;
  onSuccess: (newPass: string) => void;
}) {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    const actualOld = customer.matKhau || '123456';
    if (oldPass !== actualOld && oldPass !== '123456') {
      setErr('Mật khẩu hiện tại không chính xác!');
      return;
    }

    if (newPass.length < 8) {
      setErr('Mật khẩu mới phải có ít nhất 8 ký tự!');
      return;
    }
    const hasUpper = /[A-Z]/.test(newPass);
    const hasLower = /[a-z]/.test(newPass);
    const hasDigit = /[0-9]/.test(newPass);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPass);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setErr('Mật khẩu mới phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (VD: MatKhau@123)!');
      return;
    }
    if (newPass !== confirmPass) {
      setErr('Xác nhận mật khẩu mới không trùng khớp!');
      return;
    }

    setLoading(true);
    try {
      await customerApi.changePassword(customer.email, newPass);
      onSuccess(newPass);
      onClose();
    } catch (error: any) {
      setErr(error?.message || 'Đổi mật khẩu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#18181b] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 text-white">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="font-extrabold text-base uppercase tracking-wide">
              🔑 ĐỔI MẬT KHẨU TÀI KHOẢN
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{customer.email}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-bold text-lg cursor-pointer">✕</button>
        </div>

        {err && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-semibold">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Mật khẩu hiện tại *</label>
            <input
              type="password"
              required
              placeholder="Nhập mật khẩu hiện tại (mặc định 123456)"
              value={oldPass}
              onChange={e => setOldPass(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Mật khẩu mới *</label>
            <input
              type="password"
              required
              placeholder="Tối thiểu 8 ký tự, gồm hoa, thường, số, ký tự đặc biệt"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
            />
            <div className="text-[10px] text-zinc-400 mt-1">VD: MatKhau@123, Bikers#2026</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Xác nhận mật khẩu mới *</label>
            <input
              type="password"
              required
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* ── MODAL: HỦY ĐƠN HÀNG (PT-FLOW-03, XM-FIX-03) ── */
/* ──────────────────────────────────────────────────────────── */
function CancelOrderModal({
  order,
  onClose,
  onConfirm,
}: {
  order: Order;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const defaultReasons = [
    'Tôi muốn thay đổi địa chỉ nhận hàng / Số điện thoại',
    'Tôi muốn đổi sang sản phẩm hoặc phân loại khác',
    'Tôi đặt nhầm sản phẩm / số lượng',
    'Tìm thấy nơi khác có giá hoặc ưu đãi tốt hơn',
    'Thời gian giao hàng quá lâu hoặc không còn nhu cầu',
    'Lý do khác',
  ];
  const [selectedReason, setSelectedReason] = useState(defaultReasons[0]);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalReason = selectedReason;
    if (selectedReason === 'Lý do khác') {
      if (!customReason.trim()) {
        alert('Vui lòng nhập chi tiết lý do hủy đơn hàng!');
        return;
      }
      finalReason = customReason.trim();
    } else if (customReason.trim()) {
      finalReason = `${selectedReason} (${customReason.trim()})`;
    }
    setIsSubmitting(true);
    onConfirm(finalReason);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#18181b] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 space-y-4 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl p-1.5 rounded-lg bg-red-950 text-red-400 border border-red-800">✕</span>
            <div>
              <h3 className="font-bold text-base uppercase">HỦY ĐƠN HÀNG #{order.id}</h3>
              <p className="text-[11px] text-zinc-400">Số lượng sản phẩm / xe sẽ được hoàn trả lại tồn kho khả dụng</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 font-bold text-lg hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">
              Vui lòng chọn lý do hủy đơn:
            </label>
            <div className="space-y-2">
              {defaultReasons.map(r => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    selectedReason === r
                      ? 'border-red-600 bg-red-950/40 font-semibold text-white'
                      : 'border-zinc-800 bg-[#121214] hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="accent-red-600"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
              {selectedReason === 'Lý do khác' ? 'Nhập chi tiết lý do *' : 'Ghi chú thêm (tùy chọn)'}
            </label>
            <textarea
              rows={2}
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="Nhập lý do cụ thể..."
              required={selectedReason === 'Lý do khác'}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-[#121214] text-white focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
            >
              Giữ lại đơn hàng
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* ── MODAL: QR CODE NHẬN XE TẠI SHOWROOM (D. BÁN XE) ── */
/* ──────────────────────────────────────────────────────────── */
function VehiclePickupQrModal({
  data,
  onClose,
}: {
  data: {
    maLichHen: string;
    maDonHang?: string;
    tenXe?: string;
    mauXe?: string;
    phienBan?: string;
    ngayHen?: string;
    gioHen?: string;
    hoTenKH?: string;
    soDienThoai?: string;
    qrCodeUrl?: string;
    soTienCoc?: number;
    daThanhToan100?: boolean;
    soTienConLai?: number;
    tongTien?: number;
  };
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const qrUrl =
    data.qrCodeUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      `${data.maLichHen}|${data.soDienThoai || ''}|${data.tenXe || ''}`
    )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#18181b] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 space-y-5 text-center text-white">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏍️</span>
            <h3 className="font-extrabold text-base uppercase font-mono tracking-wide">
              MÃ NHẬN XE TẠI SHOWROOM
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold flex items-center justify-center cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] font-mono text-zinc-400 uppercase font-bold">MÃ LỊCH HẸN ĐÓN TIẾP</div>
          <div className="text-2xl font-extrabold font-mono text-red-500 tracking-wider">
            {data.maLichHen}
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(data.maLichHen);
              setCopied(true);
              setTimeout(() => setCopied(false), 3000);
            }}
            className="text-xs text-zinc-400 hover:text-red-400 font-semibold underline cursor-pointer inline-flex items-center gap-1 mt-1"
          >
            {copied ? '✓ Đã sao chép mã' : '📋 Sao chép mã lịch hẹn'}
          </button>
        </div>

        {/* QR Code image */}
        <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center">
          <img src={qrUrl} alt={data.maLichHen} className="w-48 h-48 object-contain" />
          <p className="text-[11px] text-zinc-600 font-mono mt-2">
            Xuất trình mã QR này tại quầy để tra cứu hồ sơ bàn giao xe
          </p>
        </div>

        {/* Info */}
        <div className="text-xs text-left bg-[#121214] p-3.5 rounded-2xl border border-zinc-800 space-y-1.5 font-sans">
          {data.maDonHang && (
            <div className="flex justify-between">
              <span className="text-zinc-400">Mã đơn hàng:</span>
              <strong className="font-mono text-white">#{data.maDonHang}</strong>
            </div>
          )}
          {data.tenXe && (
            <div className="flex justify-between">
              <span className="text-zinc-400">Mẫu xe:</span>
              <strong className="text-white">{data.tenXe} {data.mauXe ? `(${data.mauXe})` : ''}</strong>
            </div>
          )}
          {data.ngayHen && (
            <div className="flex justify-between">
              <span className="text-zinc-400">Thời gian nhận:</span>
              <strong className="text-red-400 font-mono">{data.gioHen || '09:00'} ngày {data.ngayHen}</strong>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-400">Địa điểm:</span>
            <strong className="text-zinc-200">Showroom Chính Motoshop (123 Lê Văn Sỹ, Q.3)</strong>
          </div>
          {data.soTienCoc !== undefined && (
            <div className="flex justify-between pt-1 border-t border-zinc-800">
              <span className="text-zinc-400">Thanh toán:</span>
              <strong className="text-emerald-400 font-mono">
                {data.daThanhToan100 ? 'Đã thanh toán 100%' : `Đã đặt cọc ${formatVND(data.soTienCoc)}`}
              </strong>
            </div>
          )}
          {data.soTienConLai !== undefined && data.soTienConLai > 0 && (
            <div className="flex justify-between text-amber-400 font-bold">
              <span>Còn lại tại Showroom:</span>
              <span className="font-mono">{formatVND(data.soTienConLai)}</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
        >
          Đóng cửa sổ
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* ── MAIN COMPONENT: CUSTOMER DASHBOARD (TOÀN DIỆN 6 TAB) ── */
/* ──────────────────────────────────────────────────────────── */
export default function CustomerDashboard({
  currentCustomer,
  onNavigateToShowroom,
  onNavigateToSurvey,
  onNavigateToCheckout,
  onNavigateToStore,
  onCustomerChange,
}: CustomerDashboardProps) {
  const { add: addToCart, clear: clearCart } = useCart();
  const [reorderToast, setReorderToast] = useState<{ show: boolean; message: string; count: number } | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  // Helper lấy ảnh đại diện phụ tùng
  const getPartThumbnail = (item: { tenSanPham: string; maPhuTung?: number; hinhAnh?: string }) => {
    if (item.hinhAnh) return item.hinhAnh;
    if (item.maPhuTung) {
      const num = item.maPhuTung;
      const pIdStr = num < 10 ? `PT00${num}` : `PT0${num}`;
      const p = mockParts.find(x => x.id === pIdStr);
      if (p?.hinhAnh) return p.hinhAnh;
    }
    const match = mockParts.find(x => 
      x.tenSanPham.toLowerCase().includes(item.tenSanPham.toLowerCase()) || 
      item.tenSanPham.toLowerCase().includes(x.tenSanPham.toLowerCase())
    );
    if (match?.hinhAnh) return match.hinhAnh;
    return '/images/phutung/motul_7100.png';
  };

  // Hàm xử lý Mua lại đơn hàng phụ tùng: Thêm sản phẩm vào giỏ hàng -> Chuyển đến trang thanh toán để đặt hàng bình thường
  const [reorderLoading, setReorderLoading] = useState(false);

  const handleReorder = (order: Order) => {
    if (!order.items || order.items.length === 0) {
      alert('Đơn hàng không có sản phẩm phụ tùng nào để mua lại.');
      return;
    }

    setReorderLoading(true);
    try {
      // 1. Làm sạch giỏ hàng cũ trước khi nạp đơn mua lại này
      clearCart();
      try {
        sessionStorage.removeItem('crm_direct_checkout_item');
      } catch {}

      const allFreshParts = partApi.getAllSync();
      let addedCount = 0;

      for (const it of order.items) {
        let matchedPart = allFreshParts.find(p =>
          (it.maPhuTung && parseInt(p.id.replace(/\D/g, ''), 10) === it.maPhuTung) ||
          p.tenSanPham.toLowerCase() === it.tenSanPham.toLowerCase() ||
          p.tenSanPham.toLowerCase().includes(it.tenSanPham.toLowerCase()) ||
          it.tenSanPham.toLowerCase().includes(p.tenSanPham.toLowerCase())
        );

        if (!matchedPart) {
          const safeNum = (it.maPhuTung && it.maPhuTung > 0 && it.maPhuTung < 1000) ? it.maPhuTung : 1;
          const fallbackId = safeNum < 10 ? `PT00${safeNum}` : `PT0${safeNum}`;
          matchedPart = {
            id: fallbackId,
            tenSanPham: it.tenSanPham || 'Phụ tùng chính hãng',
            thuongHieu: 'Chính hãng',
            giaGoc: it.donGia || 50000,
            giaKhuyenMai: null,
            soLuongTon: 99,
            danhMuc: 'Phụ tùng thay thế',
            moTa: it.tenSanPham || 'Phụ tùng chính hãng',
            hinhAnh: '/images/phutung/motul_7100.png',
            rating: 5,
            luotDanh: 10,
          };
        }

        if (matchedPart) {
          const success = addToCart(matchedPart, it.soLuong || 1);
          if (success) addedCount += (it.soLuong || 1);
        }
      }

      if (addedCount > 0) {
        // Đóng modal chi tiết nếu đang mở
        setSelectedOrderDetail(null);

        // Hiển thị thông báo Toast nổi
        setReorderToast({
          show: true,
          message: `✓ Đã thêm ${addedCount} món phụ tùng từ đơn #${order.id} vào giỏ hàng! Đang chuyển đến trang thanh toán...`,
          count: addedCount,
        });

        // Tự động chuyển khách hàng đến trang Giỏ hàng / Thanh toán (Checkout)
        setTimeout(() => {
          setReorderToast(null);
          if (onNavigateToCheckout) {
            onNavigateToCheckout();
          } else {
            window.dispatchEvent(new CustomEvent('crm-navigate-checkout'));
          }
        }, 700);
      } else {
        alert('Không thể thêm sản phẩm vào giỏ hàng do lỗi tồn kho hoặc sản phẩm không khả dụng!');
      }
    } catch (err) {
      console.error('Lỗi khi thực hiện mua lại:', err);
      alert('Có lỗi xảy ra khi chuẩn bị giỏ hàng mua lại. Vui lòng thử lại!');
    } finally {
      setReorderLoading(false);
    }
  };

    // Helper lấy đúng ảnh phương tiện từ xe hoặc catalog đại lý
  const getVehicleDisplayImage = (v: Vehicle) => {
    if (v.hinhAnh) return v.hinhAnh;
    try {
      const cachedCat = localStorage.getItem('crm_catalog_vehicles');
      const catList: any[] = cachedCat ? JSON.parse(cachedCat) : (DEFAULT_CATALOG_VEHICLES || []);
      const cleanName = (v.tenXe || '').toLowerCase().trim();
      const found = catList.find(c => {
        const cName = (c.tenXe || '').toLowerCase().trim();
        return cleanName && cName && (cleanName.includes(cName) || cName.includes(cleanName));
      });
      if (found?.hinhAnh) return found.hinhAnh;
    } catch {}
    return 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80';
  };

  // Helper tìm hợp đồng bảo hiểm khớp với xe (5 cấp độ nhận diện)
  const findMatchingInsurance = (v: Vehicle, insurances: InsuranceContract[]): InsuranceContract | undefined => {
    if (!v || !insurances || insurances.length === 0) return undefined;
    
    // 1. Trùng ID xe
    const matchById = insurances.find(ins => ins.vehicleId === v.id);
    if (matchById) return matchById;

    // 2. Trùng số khung (VIN)
    if (v.soKhung && v.soKhung.trim()) {
      const vVin = v.soKhung.trim().toUpperCase();
      const matchByVin = insurances.find(ins => ins.soKhung && ins.soKhung.trim().toUpperCase() === vVin);
      if (matchByVin) return matchByVin;
    }

    // 3. Trùng biển số xe thực tế
    const cleanPlate = (plate?: string) => {
      if (!plate) return '';
      const upper = plate.trim().toUpperCase();
      if (upper.includes('CHƯA') || upper.includes('CHỜ') || upper.includes('BẤM') || upper.includes('CHUA CO')) return '';
      return upper.replace(/[^A-Z0-9]/g, '');
    };
    const vPlate = cleanPlate(v.bienSo || v.bienSoChoDuyet);
    if (vPlate) {
      const matchByPlate = insurances.find(ins => cleanPlate(ins.bienSo) === vPlate);
      if (matchByPlate) return matchByPlate;
    }

    // 4. Trùng tên dòng xe
    const vName = (v.tenXe || '').toLowerCase().trim();
    if (vName) {
      const matchByName = insurances.find(ins => {
        const insName = (ins.tenXe || '').toLowerCase().trim();
        return insName && (insName.includes(vName) || vName.includes(insName));
      });
      if (matchByName) return matchByName;
    }

    // 5. Tự động liên kết nếu khách chỉ có 1 xe và 1 hợp đồng bảo hiểm hiệu lực
    const activeInsList = insurances.filter(ins => ins.trangThai !== 'HetHan' && ins.trangThai !== 'TuChoi');
    if (activeInsList.length === 1 && myVehicles.length === 1) {
      return activeInsList[0];
    }

    return undefined;
  };
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>(mockOrders);
  const [allAppts, setAllAppts] = useState<Appointment[]>(mockAppointments);
  const [myInsurances, setMyInsurances] = useState<InsuranceContract[]>([]);

  // Sub-tabs
  const [ordersSubTab, setOrdersSubTab] = useState<'TatCa' | 'Xe' | 'PhuTung'>('TatCa');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'TatCa' | 'ChoDuyet' | 'DangGiao' | 'HoanThanh' | 'DaHuy'>('TatCa');
  const [orderTimeFilter, setOrderTimeFilter] = useState<string>('30days');

  const [apptsSubTab, setApptsSubTab] = useState<'Tong' | 'NhanXe' | 'SuaChua' | 'BaoDuong' | 'LaiThu' | 'BaoHanh'>('Tong');
  const [serviceHistSubTab, setServiceHistSubTab] = useState<'TatCa' | 'BaoDuong' | 'SuaChua' | 'LaiThu' | 'BaoHanh' | 'NhanXe'>('TatCa');
  const [serviceSearch, setServiceSearch] = useState('');

  const [surveySubTab, setSurveySubTab] = useState<'ChoDanhGia' | 'DaDanhGia' | 'KhaoSatHeThong'>('ChoDanhGia');
  const [waitingTypeFilter, setWaitingTypeFilter] = useState<'All' | 'XeMau' | 'PhuTung'>('All');

  // Bộ lọc đánh giá của khách hàng (ĐG - Người dùng: số sao, hình ảnh, phân loại)
  const [myReviewRatingFilter, setMyReviewRatingFilter] = useState<'All' | 5 | 4 | 3 | 2 | 1>('All');
  const [myReviewHasImageFilter, setMyReviewHasImageFilter] = useState<boolean>(false);
  const [myReviewTypeFilter, setMyReviewTypeFilter] = useState<'All' | 'PhuTung' | 'XeMau' | 'DichVu'>('All');

  // LH06 & LH07: Xem chi tiết & Hủy lịch hẹn khách hàng
  const [selectedApptDetail, setSelectedApptDetail] = useState<Appointment | null>(null);
  const [selectedServiceInvoice, setSelectedServiceInvoice] = useState<Appointment | null>(null); // LSLH02: Modal xem & in hóa đơn dịch vụ
  const [cancelConfirmAppt, setCancelConfirmAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Thay đổi kế hoạch cá nhân');
  const [customCancelReason, setCustomCancelReason] = useState<string>('');
  const [isCancellingAppt, setIsCancellingAppt] = useState(false);

  // LH11: Bộ lọc ngày trên Calendar & Modal liên hệ showroom (Chuẩn Ảnh 2)
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
  const [contactModalAppt, setContactModalAppt] = useState<Appointment | null>(null);

  // Xác nhận ngày nhận xe & Đổi ngày nhận xe (Luồng Showroom)
  const [confirmedPickupOrderIds, setConfirmedPickupOrderIds] = useState<Record<string, boolean>>({});
  const [changingDateOrder, setChangingDateOrder] = useState<Order | null>(null);
  const [newPickupDateInput, setNewPickupDateInput] = useState<string>('');

  // Modals state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordToast, setPasswordToast] = useState<string | null>(null);

  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState<'TatCa' | 'CuaHang' | 'NgoaiHeThong' | 'DangBaoHanh' | 'CoBaoHiem'>('TatCa');
  const [selectedDetailVehicle, setSelectedDetailVehicle] = useState<Vehicle | null>(null);
  const [vehicleDetailViewMode, setVehicleDetailViewMode] = useState<'info' | 'serviceHistory'>('info');
  const [vehicleServiceMonthFilter, setVehicleServiceMonthFilter] = useState<string>('ALL');
  const [vehicleServiceTypeFilter, setVehicleServiceTypeFilter] = useState<string>('ALL');
  const [vehicleServicePage, setVehicleServicePage] = useState<number>(1);

  const handleOpenVehicleDetail = (v: Vehicle) => {
    setSelectedDetailVehicle(v);
    setVehicleDetailViewMode('info');
    setVehicleServiceMonthFilter('ALL');
    setVehicleServiceTypeFilter('ALL');
    setVehicleServicePage(1);
  };
  const [selectedWarrantyVehicle, setSelectedWarrantyVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicleWarrantyDetail, setSelectedVehicleWarrantyDetail] = useState<Vehicle | null>(null);
  const [warrantyRecords, setWarrantyRecords] = useState<WarrantyRecord[]>([]);

  // Form đăng ký xe ngoài
  const [regForm, setRegForm] = useState({
    hangXe: 'Honda',
    dongXe: 'Wave Alpha',
    customDongXe: '',
    dongCo: '110cc',
    bienSo: '',
    soKhung: '',
    soMay: '',
    mauSac: 'Đen bóng',
    namSanXuat: '2025',
    anhCaVet: '',
    hinhAnh: '',
  });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  // Cập nhật biển số & cà vẹt
  const [updatingPlateVehicle, setUpdatingPlateVehicle] = useState<Vehicle | null>(null);
  const [newPlateInput, setNewPlateInput] = useState('');
  const [newPlateCaVetImg, setNewPlateCaVetImg] = useState('');
  const [plateUpdateError, setPlateUpdateError] = useState<string | null>(null);
  const [plateUpdateSubmitting, setPlateUpdateSubmitting] = useState(false);
  const [plateUpdateToast, setPlateUpdateToast] = useState<string | null>(null);

  // Bảo hành: claim & care+ wizard
  const [requestingWarrantyVehicle, setRequestingWarrantyVehicle] = useState<Vehicle | null>(null);
  const [claimIssues, setClaimIssues] = useState<string[]>(['Động cơ / Động cơ kêu to']);
  const [claimDesc, setClaimDesc] = useState('');
  const [claimOdo, setClaimOdo] = useState<number>(12500);
  const [claimImages, setClaimImages] = useState<string[]>([]);
  const [claimDate, setClaimDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [claimTime, setClaimTime] = useState('08:30');
  const [claimBranch, setClaimBranch] = useState(WARRANTY_BRANCHES[0]);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccessToast, setClaimSuccessToast] = useState<string | null>(null);

  const [extendingWarrantyVehicle, setExtendingWarrantyVehicle] = useState<Vehicle | null>(null);
  const [selectedExtPkgId, setSelectedExtPkgId] = useState<string>('CARE_PLUS_1Y');
  const [extSubmitting, setExtSubmitting] = useState(false);
  const [extSuccessToast, setExtSuccessToast] = useState<string | null>(null);

  // Đơn hàng: QR & Hủy đơn & Đánh giá
  const [viewingQrData, setViewingQrData] = useState<{
    maLichHen: string;
    maDonHang?: string;
    tenXe?: string;
    mauXe?: string;
    phienBan?: string;
    ngayHen?: string;
    gioHen?: string;
    hoTenKH?: string;
    soDienThoai?: string;
    qrCodeUrl?: string;
    soTienCoc?: number;
    daThanhToan100?: boolean;
    soTienConLai?: number;
    tongTien?: number;
  } | null>(null);

  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [orderCancelToast, setOrderCancelToast] = useState<string | null>(null);

  // Review modal
  const [reviewModalPart, setReviewModalPart] = useState<{ partName: string; orderId: string; productId?: string; productType?: 'PhuTung' | 'XeMau' | 'DichVu'; fromTab?: number } | null>(null);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewToast, setReviewToast] = useState<string | null>(null);
  const [myCustomerFeedbacks, setMyCustomerFeedbacks] = useState<Feedback[]>([]);

  // Bảo hiểm
  const [isBuyingOnlineInsurance, setIsBuyingOnlineInsurance] = useState(false);
  const [buyingInsuranceInitialVehicle, setBuyingInsuranceInitialVehicle] = useState<Vehicle | null>(null);
  const [renewingInsuranceContract, setRenewingInsuranceContract] = useState<InsuranceContract | null>(null);
  const [viewingInsuranceContract, setViewingInsuranceContract] = useState<InsuranceContract | null>(null);
  const [renewToast, setRenewToast] = useState<string | null>(null);

  // Highlight mục tiêu khi nhấp vào thông báo (TC10, TB01, KH04)
  const [highlightTarget, setHighlightTarget] = useState<{ type: string; id?: string } | null>(null);

  // Khóa tài khoản: tự động logout nếu Admin khóa
  useEffect(() => {
    if (currentCustomer?.trangThai === 'BiKhoa') {
      alert('⚠️ Tài khoản của quý khách hiện đang BỊ KHÓA do yêu cầu quản trị hoặc bảo mật!');
      localStorage.removeItem('crm_current_customer');
      onCustomerChange?.(null);
    }
  }, [currentCustomer?.trangThai, onCustomerChange]);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const cached = localStorage.getItem('crm_custom_customers');
        if (cached && currentCustomer) {
          const list: Customer[] = JSON.parse(cached);
          const found = list.find(c => c.id === currentCustomer.id || c.email === currentCustomer.email);
          if (found && found.trangThai === 'BiKhoa') {
            alert('⚠️ Tài khoản của quý khách vừa bị KHÓA bởi Quản trị viên. Phiên đăng nhập sẽ kết thúc!');
            localStorage.removeItem('crm_current_customer');
            onCustomerChange?.(null);
          }
        }
      } catch {}
    };

    window.addEventListener('crm-data-refresh', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('crm-data-refresh', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentCustomer, onCustomerChange]);

  // Load customer full data
  const loadCustomerData = () => {
    if (!currentCustomer) return;

    // BH05, KH01: Đồng bộ dữ liệu chi tiêu và thông tin mới nhất từ localStorage
    try {
      const curRaw = localStorage.getItem('crm_current_customer');
      if (curRaw) {
        const cur = JSON.parse(curRaw);
        if (cur.id === currentCustomer.id || cur.email === currentCustomer.email) {
          if (cur.email && /@gmail\.com@gmail\.com/i.test(cur.email)) {
            cur.email = cur.email.replace(/@gmail\.com@gmail\.com/gi, '@gmail.com');
            localStorage.setItem('crm_current_customer', JSON.stringify(cur));
          }
          if (
            cur.tongChiTieu !== currentCustomer.tongChiTieu ||
            cur.avatar !== currentCustomer.avatar ||
            cur.trangThai !== currentCustomer.trangThai
          ) {
            onCustomerChange?.(cur);
          }
        }
      }
    } catch {}

    orderApi.getAll().then(orders => {
      if (orders && orders.length > 0) {
        setAllOrders(orders);
        setSelectedOrderDetail(prev => {
          if (!prev) return null;
          const matched = orders.find(o => o.id === prev.id || (parseInt(o.id.replace(/\D/g, ''), 10) === parseInt(prev.id.replace(/\D/g, ''), 10) && o.id.includes('XE') === prev.id.includes('XE')));
          return matched ? { ...prev, ...matched } : prev;
        });
      }
      appointmentApi.getAll().then(data => {
        if (data && data.length > 0) {
          const completedOrderIds = new Set(
            (orders || [])
              .filter(o => o.trangThai === 'HoanThanh' || o.trangThai === 'DaGiao')
              .map(o => o.id)
          );
          const completedLichHenCodes = new Set(
            (orders || [])
              .filter(o => o.trangThai === 'HoanThanh' || o.trangThai === 'DaGiao')
              .map(o => o.maLichHen || o.thongTinXe?.maLichHen)
              .filter(Boolean)
          );

          const uncompletedOrderIds = new Set(
            (orders || [])
              .filter(o => o.trangThai !== 'HoanThanh' && o.trangThai !== 'DaGiao')
              .map(o => o.id)
          );
          const uncompletedLichHenCodes = new Set(
            (orders || [])
              .filter(o => o.trangThai !== 'HoanThanh' && o.trangThai !== 'DaGiao')
              .map(o => o.maLichHen || o.thongTinXe?.maLichHen)
              .filter(Boolean)
          );

          const syncedAppts = data.map(a => {
            if (a.loaiDichVu === 'NhanXe') {
              const isPendingOrder =
                (a.maDonHangXe && uncompletedOrderIds.has(a.maDonHangXe)) ||
                (a.maLichHen && uncompletedLichHenCodes.has(a.maLichHen));

              if (isPendingOrder && a.trangThai === 'DaHoanThanh') {
                // Đơn xe chưa hoàn thành -> Lịch hẹn nhận xe tuyệt đối không thể là Đã hoàn thành, đưa về Chờ xác nhận
                return { ...a, trangThai: 'ChoXacNhan' as const };
              }

              if (a.trangThai !== 'DaHoanThanh') {
                const isMatchedCompleted =
                  (a.maDonHangXe && completedOrderIds.has(a.maDonHangXe)) ||
                  (a.maLichHen && completedLichHenCodes.has(a.maLichHen));
                if (isMatchedCompleted) {
                  return { ...a, trangThai: 'DaHoanThanh' as const };
                }
              }
            }
            return a;
          });
          setAllAppts(syncedAppts);
        }
      });
    });
    try {
      const allIns = insuranceApi.getAll();
      const cIdNum = parseInt(currentCustomer.id.replace(/\D/g, ''), 10);
      const custPhone = currentCustomer.soDienThoai ? currentCustomer.soDienThoai.replace(/\D/g, '') : '';
      const insList = allIns.filter(c => {
        if (c.customerId === currentCustomer.id) return true;
        const cNum = parseInt(c.customerId.replace(/\D/g, ''), 10);
        if (!isNaN(cIdNum) && !isNaN(cNum) && cIdNum === cNum) return true;
        if (custPhone && c.soDienThoai && c.soDienThoai.replace(/\D/g, '') === custPhone) return true;
        return false;
      });
      setMyInsurances(insList);
    } catch {}
    vehicleApi.getAll().then(data => {
      if (data) {
        const cIdNum = parseInt(currentCustomer.id.replace(/\D/g, ''), 10);
        const custPhone = currentCustomer.soDienThoai ? currentCustomer.soDienThoai.replace(/\D/g, '') : '';
        // Lấy danh sách các đơn hàng xe của khách hàng này để kiểm tra tiến trình bàn giao
        const curOrders = orderApi.getAllSync();
        const pendingVehicleOrders = curOrders.filter(o => {
          const oCustNum = parseInt(o.customerId.replace(/\D/g, ''), 10);
          const matchCust = o.customerId === currentCustomer.id || (!isNaN(cIdNum) && !isNaN(oCustNum) && cIdNum === oCustNum);
          const isXeOrder = o.loaiDon === 'Xe' || !!o.thongTinXe || (o.id && o.id.includes('XE'));
          return matchCust && isXeOrder && o.trangThai !== 'HoanThanh' && o.trangThai !== 'DaGiao';
        });

        // Tự động dọn dẹp khỏi cache crm_customer_vehicles nếu xe của đơn chưa hoàn thành bị lọt vào
        if (pendingVehicleOrders.length > 0) {
          try {
            const rawV = localStorage.getItem('crm_customer_vehicles');
            if (rawV) {
              const vAll: Vehicle[] = JSON.parse(rawV);
              const cleaned = vAll.filter(cv => {
                const isBad = pendingVehicleOrders.some(pOrd => {
                  const matchCust = cv.customerId === pOrd.customerId || parseInt(cv.customerId.replace(/\D/g, ''), 10) === parseInt(pOrd.customerId.replace(/\D/g, ''), 10);
                  const vinMatch = pOrd.thongTinXe?.soKhungVIN && cv.soKhung && pOrd.thongTinXe.soKhungVIN === cv.soKhung;
                  const nameMatch = pOrd.thongTinXe?.tenXe && (cv.tenXe || '').toLowerCase().trim() === pOrd.thongTinXe.tenXe.toLowerCase().trim();
                  const isChuaCoBien = !cv.bienSo || cv.bienSo === 'Chưa có biển số' || cv.bienSo.includes('Chưa có') || cv.bienSo.startsWith('TAM-');
                  return matchCust && (vinMatch || (nameMatch && isChuaCoBien));
                });
                return !isBad;
              });
              if (cleaned.length !== vAll.length) {
                localStorage.setItem('crm_customer_vehicles', JSON.stringify(cleaned));
              }
            }
          } catch {}
        }

        let vList = data.filter(v => {
          const plate = (v.bienSo || v.bienSoChoDuyet || '').toUpperCase();
          const name = (v.tenXe || '').toUpperCase();
          if (plate.includes('LÁI-THỬ') || plate.includes('LAI-THU') || plate.includes('XE-LÁI') || name.includes('LÁI THỬ') || name.includes('LAI THU')) {
            return false;
          }
          let belongsToCustomer = false;
          if (v.customerId === currentCustomer.id) belongsToCustomer = true;
          const vNum = parseInt(v.customerId.replace(/\D/g, ''), 10);
          if (!isNaN(cIdNum) && !isNaN(vNum) && cIdNum === vNum) belongsToCustomer = true;
          if (currentCustomer.soXe && currentCustomer.soXe === v.id) belongsToCustomer = true;
          if (custPhone && (v as any).soDienThoai && (v as any).soDienThoai.replace(/\D/g, '') === custPhone) belongsToCustomer = true;
          if (!belongsToCustomer) return false;

          // QUY TẮC BẢO VỆ: Nếu xe thuộc đơn mua trực tuyến nhưng đơn đó CHƯA HOÀN THÀNH (đang Chờ duyệt / Chờ giao xe / Đã hủy) -> ẨN KHỎI "Phương tiện của tôi"
          if (v.nguonGoc === 'CuaHang') {
            const isUnfinishedOrderBike = pendingVehicleOrders.some(pOrd => {
              const vinMatch = pOrd.thongTinXe?.soKhungVIN && v.soKhung && pOrd.thongTinXe.soKhungVIN === v.soKhung;
              const nameMatch = pOrd.thongTinXe?.tenXe && (v.tenXe || '').toLowerCase().trim() === pOrd.thongTinXe.tenXe.toLowerCase().trim();
              const isChuaCoBien = !v.bienSo || v.bienSo === 'Chưa có biển số' || v.bienSo.includes('Chưa có') || v.bienSo.startsWith('TAM-');
              return vinMatch || (nameMatch && isChuaCoBien);
            });
            if (isUnfinishedOrderBike) return false;
          }

          return true;
        });

        // Chống hiển thị trùng lặp phương tiện của khách hàng (deduplication)
        const seenV = new Set<string>();
        const dedupedVList = vList.filter(v => {
          const plate = (v.bienSo || v.bienSoChoDuyet || '').trim().toUpperCase();
          const name = (v.tenXe || '').trim().toUpperCase();
          const color = (v.mauSac || '').trim().toUpperCase();
          const vin = (v.soKhung || '').trim().toUpperCase();
          const key = vin
            ? `VIN_${vin}`
            : (plate && plate !== 'CHƯA CÓ BIỂN SỐ' && !plate.includes('CHUA CO'))
            ? `PLATE_${plate}`
            : `NAME_${name}_${color}`;
          if (seenV.has(key)) return false;
          seenV.add(key);
          return true;
        });

        // Tự động cấp bảo hiểm cho xe mua từ Showroom nếu chưa có hợp đồng trong danh sách
        try {
          const cachedAllIns = insuranceApi.getAll();
          let allInsList = [...cachedAllIns];
          let myInsList = insuranceApi.getByCustomerId(currentCustomer.id);
          let hasNewIns = false;

          dedupedVList.forEach(veh => {
            if (veh.nguonGoc === 'CuaHang') {
              const matchedIns = findMatchingInsurance(veh, myInsList);
              if (!matchedIns) {
                const matchedOrder = curOrders.find(o => {
                  const oCustNum = parseInt(o.customerId.replace(/\D/g, ''), 10);
                  const isMyOrder = o.customerId === currentCustomer.id || (!isNaN(cIdNum) && !isNaN(oCustNum) && cIdNum === oCustNum);
                  const isCar = (o.thongTinXe?.tenXe || '').toLowerCase().includes((veh.tenXe || '').toLowerCase()) || (veh.tenXe || '').toLowerCase().includes((o.thongTinXe?.tenXe || '').toLowerCase());
                  return isMyOrder && isCar;
                });

                const insName = matchedOrder?.thongTinXe?.goiBaoHiem || 'Bảo hiểm TNDS Bắt Buộc (1 Năm)';
                const is2Y = insName.includes('2 Năm');
                const isToanDien = insName.includes('Toàn Diện');
                const todayDate = new Date();
                const endDate = new Date(todayDate);
                endDate.setFullYear(todayDate.getFullYear() + (is2Y ? 2 : 1));

                const autoContract: InsuranceContract = {
                  id: `HD-INS-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 1000)}`,
                  soGCN: `GCN-${Math.floor(100000 + Math.random() * 900000)}`,
                  vehicleId: veh.id,
                  customerId: currentCustomer.id,
                  hoTenKH: currentCustomer.hoTen,
                  soDienThoai: currentCustomer.soDienThoai,
                  email: currentCustomer.email || 'khachhang@motoshop.vn',
                  diaChi: currentCustomer.diaChi || 'TP.HCM',
                  tenXe: veh.tenXe,
                  bienSo: veh.bienSo || 'Chưa có biển số',
                  soKhung: veh.soKhung || '',
                  soMay: veh.soMay || '',
                  tenGoi: insName,
                  packageType: isToanDien ? 'VAT_CHAT_TOAN_DIEN' : 'TNDS_BAT_BUOC',
                  thoiHanNam: is2Y ? 2 : 1,
                  nhaBaoHiem: 'Bảo hiểm Quân Đội (MIC)',
                  ngayBatDau: todayDate.toISOString().split('T')[0],
                  ngayKetThuc: endDate.toISOString().split('T')[0],
                  phiBaoHiem: matchedOrder?.thongTinXe?.phiBaoHiem || (isToanDien ? 450000 : is2Y ? 132000 : 66000),
                  trangThai: 'HieuLuc',
                  ghiChu: `Hợp đồng bảo hiểm điện tử cấp kèm xe mua tại Showroom Motoshop`,
                  ngayCap: todayDate.toISOString().split('T')[0],
                };

                myInsList.unshift(autoContract);
                allInsList.unshift(autoContract);
                hasNewIns = true;
              }
            }
          });

          if (hasNewIns) {
            localStorage.setItem('crm_insurance_contracts', JSON.stringify(allInsList));
            setMyInsurances(myInsList);
          }
        } catch (err) {
          console.warn('Auto backfill insurance error:', err);
        }

        setMyVehicles(dedupedVList);
      }
    });

    feedbackApi.getAll().then(allFb => {
      if (allFb) {
        const cIdNum = parseInt(currentCustomer.id.replace(/\D/g, ''), 10);
        const custPhone = currentCustomer.soDienThoai ? currentCustomer.soDienThoai.replace(/\D/g, '') : '';
        const myFb = allFb.filter(f => {
          if (f.customerId === currentCustomer.id) return true;
          const fNum = parseInt((f.customerId || '').replace(/\D/g, ''), 10);
          if (!isNaN(cIdNum) && !isNaN(fNum) && cIdNum === fNum) return true;
          if (custPhone && f.soDienThoai && f.soDienThoai.replace(/\D/g, '') === custPhone) return true;
          return false;
        });
        setMyCustomerFeedbacks(myFb);
      }
    });
  };

  useEffect(() => {
    if (!currentCustomer) {
      setMyVehicles([]);
      setAllOrders([]);
      setAllAppts([]);
      setMyInsurances([]);
      setMyCustomerFeedbacks([]);
      return;
    }
    loadCustomerData();
    const handleRefresh = () => loadCustomerData();
    window.addEventListener('crm-data-refresh', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    return () => {
      window.removeEventListener('crm-data-refresh', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, [currentCustomer]);

  // Highlight check
  useEffect(() => {
    const checkHighlight = () => {
      const raw = sessionStorage.getItem('crm_client_highlight');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setHighlightTarget(parsed);
          if (parsed.type === 'vehicle') setActiveTab(0);
          else if (parsed.type === 'order') setActiveTab(1);
          else if (parsed.type === 'appointment') {
            setActiveTab(2);
            if (parsed.id) {
              const matched = allAppts.find(a => a.id === parsed.id || a.maLichHen === parsed.id);
              if (matched) setSelectedApptDetail(matched);
            }
          }
          else if (parsed.type === 'insurance') setActiveTab(4);
          else if (parsed.type === 'review') {
            setActiveTab(5);
            setSurveySubTab('ChoDanhGia');
          }
          else if (parsed.type === 'survey') {
            setActiveTab(5);
            setSurveySubTab('KhaoSatHeThong');
          }
          sessionStorage.removeItem('crm_client_highlight');
          setTimeout(() => setHighlightTarget(null), 7000);
        } catch {}
      }
    };

    checkHighlight();
    const handleTrigger = (e: any) => {
      if (e.detail) {
        setHighlightTarget(e.detail);
        if (e.detail.type === 'vehicle') setActiveTab(0);
        else if (e.detail.type === 'order') setActiveTab(1);
        else if (e.detail.type === 'appointment') {
          setActiveTab(2);
          if (e.detail.id) {
            const matched = allAppts.find(a => a.id === e.detail.id || a.maLichHen === e.detail.id);
            if (matched) setSelectedApptDetail(matched);
          }
        }
        else if (e.detail.type === 'insurance') setActiveTab(4);
        else if (e.detail.type === 'review') {
          setActiveTab(5);
          setSurveySubTab('ChoDanhGia');
        }
        else if (e.detail.type === 'survey') {
          setActiveTab(5);
          setSurveySubTab('KhaoSatHeThong');
        }
        setTimeout(() => setHighlightTarget(null), 7000);
      }
    };

    window.addEventListener('crm-client-highlight-trigger', handleTrigger);
    return () => window.removeEventListener('crm-client-highlight-trigger', handleTrigger);
  }, []);

  // Filtered orders
  const myOrders = useMemo(() => {
    if (!currentCustomer) return [];
    const custNum = parseInt(currentCustomer.id.replace(/\D/g, ''), 10);
    const custPhone = currentCustomer.soDienThoai ? currentCustomer.soDienThoai.replace(/\D/g, '') : '';
    const custName = currentCustomer.hoTen ? currentCustomer.hoTen.trim().toLowerCase() : '';

    return allOrders.filter(o => {
      if (o.customerId === currentCustomer.id) return true;
      const orderCustNum = parseInt(o.customerId.replace(/\D/g, ''), 10);
      if (!isNaN(custNum) && !isNaN(orderCustNum) && custNum === orderCustNum) return true;
      if (custPhone && (o as any).soDienThoai && (o as any).soDienThoai.replace(/\D/g, '') === custPhone) return true;
      if (custName && o.hoTenKH && o.hoTenKH.trim().toLowerCase() === custName) return true;
      return false;
    });
  }, [allOrders, currentCustomer]);

  // Filtered appointments
  const myAppts = useMemo(() => {
    if (!currentCustomer) return [];
    const custNum = parseInt(currentCustomer.id.replace(/\D/g, ''), 10);
    const custPhone = currentCustomer.soDienThoai ? currentCustomer.soDienThoai.replace(/\D/g, '') : '';
    const custName = currentCustomer.hoTen ? currentCustomer.hoTen.trim().toLowerCase() : '';

    return allAppts.filter(a => {
      let isMine = false;
      if (a.customerId === currentCustomer.id) isMine = true;
      const aCustNum = parseInt(a.customerId.replace(/\D/g, ''), 10);
      if (!isNaN(custNum) && !isNaN(aCustNum) && custNum === aCustNum) isMine = true;
      if (custPhone && a.soDienThoai && a.soDienThoai.replace(/\D/g, '') === custPhone) isMine = true;
      if (!isMine) return false;

      // Nghiệp vụ Lịch nhận xe mới:
      if (a.loaiDichVu === 'NhanXe') {
        // 1. Sau khi hoàn tất (bàn giao xe thành công) -> Tự động biến mất khỏi Tab Lịch hẹn
        if (a.trangThai === 'DaHoanThanh' || a.trangThai === 'HoanThanh') {
          return false;
        }

        // 2. Nếu đơn hàng xe tương ứng đang Chờ duyệt hoặc Chờ khách xác nhận ngày nhận (hoặc chưa xác nhận)
        // -> CHƯA HIỂN THỊ trong mục Lịch hẹn cho đến khi khách hàng xác nhận!
        const matchedOrder = myOrders.find(o =>
          (a.maDonHangXe && a.maDonHangXe === o.id) ||
          (a.maLichHen && (a.maLichHen === o.maLichHen || a.maLichHen === o.thongTinXe?.maLichHen))
        );
        if (matchedOrder) {
          if (matchedOrder.trangThai === 'ChoDuyet' || matchedOrder.trangThai === 'ChoKhachXacNhanNgayNhan') {
            return false;
          }
          if (matchedOrder.trangThai === 'HoanThanh' || matchedOrder.trangThai === 'DaGiao' || matchedOrder.trangThai === 'DaHuy') {
            return false;
          }
        }
      }

      return true;
    });
  }, [allAppts, currentCustomer, myOrders]);

  // Upcoming appointments (LH14)
  const upcomingAppts = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    return myAppts.filter(a =>
      (a.trangThai === 'ChoXacNhan' || a.trangThai === 'DaXacNhan' || a.trangThai === 'ChoDuyet') &&
      (a.ngayHen === todayStr || a.ngayHen === tomorrowStr)
    );
  }, [myAppts]);

  // Real spending & CLV (BH05: Tích lũy cả chi tiêu đơn hàng và bảo hiểm)
  const realCustomerSpending = useMemo(() => {
    if (!currentCustomer) return 0;
    let baseSpent = currentCustomer.tongChiTieu || 0;
    try {
      const curRaw = localStorage.getItem('crm_current_customer');
      if (curRaw) {
        const parsed = JSON.parse(curRaw);
        if (parsed.id === currentCustomer.id && typeof parsed.tongChiTieu === 'number') {
          baseSpent = Math.max(baseSpent, parsed.tongChiTieu);
        }
      }
    } catch {}

    const completedOrders = myOrders.filter(o => o.trangThai === 'HoanThanh' || (o.trangThai as any) === 'DaHoanThanh');
    const totalOrderSpent = completedOrders.reduce((sum, o) => sum + (o.tongTien || 0), 0);
    const totalInsuranceSpent = myInsurances
      .filter(ins => ins.trangThai !== 'TuChoi')
      .reduce((sum, ins) => sum + (ins.tongTien || ins.phiBaoHiem || 0), 0);
    return Math.max(baseSpent, totalOrderSpent + totalInsuranceSpent);
  }, [myOrders, myInsurances, currentCustomer]);

  // Sync back spending
  useEffect(() => {
    if (currentCustomer && realCustomerSpending > (currentCustomer.tongChiTieu || 0)) {
      const updated = { ...currentCustomer, tongChiTieu: realCustomerSpending };
      onCustomerChange?.(updated);
      localStorage.setItem('crm_current_customer', JSON.stringify(updated));
    }
  }, [realCustomerSpending, currentCustomer]);

  // Displayed vehicles by filter
  const displayedVehicles = useMemo(() => {
    const filtered = myVehicles.filter(v => {
      const plate = (v.bienSo || v.bienSoChoDuyet || '').toUpperCase();
      const name = (v.tenXe || '').toUpperCase();
      if (plate.includes('LÁI-THỬ') || plate.includes('LAI-THU') || plate.includes('XE-LÁI') || name.includes('LÁI THỬ') || name.includes('LAI THU')) {
        return false;
      }
      if (vehicleFilter === 'CuaHang') return v.nguonGoc === 'CuaHang';
      if (vehicleFilter === 'NgoaiHeThong') return v.nguonGoc === 'NgoaiHeThong';
      if (vehicleFilter === 'DangBaoHanh') return v.nguonGoc === 'CuaHang' && v.trangThaiBaoHanh === 'ConHan';
      if (vehicleFilter === 'CoBaoHiem') {
        const ins = findMatchingInsurance(v, myInsurances);
        return !!ins && ins.trangThai !== 'HetHan' && ins.trangThai !== 'TuChoi';
      }
      return true;
    });

    const seen = new Set<string>();
    return filtered.filter(v => {
      const vin = (v.soKhung || '').trim().toUpperCase();
      const plate = (v.bienSo || v.bienSoChoDuyet || '').trim().toUpperCase();
      const name = (v.tenXe || '').trim().toUpperCase();
      const key = vin
        ? 'VIN_' + vin
        : (plate && plate !== 'CHƯA CÓ BIỂN SỐ' && !plate.includes('CHUA CO'))
        ? 'PLATE_' + plate
        : 'NAME_' + name + '_' + (v.mauSac || '').toUpperCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [myVehicles, vehicleFilter, myInsurances]);

  // Handlers
  const handleSaveProfile = async (updated: Customer) => {
    const maKhInt = parseInt(updated.id.replace(/\D/g, ''), 10);
    if (!isNaN(maKhInt) && maKhInt > 0) {
      await customerApi.update(maKhInt, updated);
    }
    const idx = mockCustomers.findIndex(c => c.id === updated.id);
    if (idx !== -1) mockCustomers[idx] = updated;

    try {
      const cached = localStorage.getItem('crm_custom_customers');
      let list: Customer[] = cached ? JSON.parse(cached) : [...mockCustomers];
      const i = list.findIndex(c => c.id === updated.id);
      if (i !== -1) list[i] = { ...list[i], ...updated };
      else list.push(updated);
      localStorage.setItem('crm_custom_customers', JSON.stringify(list));
    } catch {}

    localStorage.setItem('crm_current_customer', JSON.stringify(updated));
    onCustomerChange?.(updated);
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'customer_updated' } }));
  };

  const handlePasswordChangeSuccess = (newPass: string) => {
    if (currentCustomer) {
      const updated = { ...currentCustomer, matKhau: newPass };
      onCustomerChange?.(updated);
      localStorage.setItem('crm_current_customer', JSON.stringify(updated));
    }
    setPasswordToast('🎉 Đổi mật khẩu tài khoản thành công!');
    setTimeout(() => setPasswordToast(null), 4000);
  };

  const handleRegisterVehicle = async () => {
    if (!currentCustomer) return;
    const errors: Record<string, string> = {};
    if (!regForm.hangXe) errors.hangXe = 'Vui lòng chọn hãng xe';
    const effectiveDongXe = regForm.dongXe === 'Khác' ? regForm.customDongXe.trim() : regForm.dongXe.trim();
    if (!effectiveDongXe) errors.dongXe = 'Vui lòng chọn hoặc nhập tên dòng xe';
    if (!regForm.dongCo) errors.dongCo = 'Vui lòng chọn phân khối';
    const rawPlate = regForm.bienSo.trim();
    if (!rawPlate) {
      errors.bienSo = 'Vui lòng nhập biển số xe';
    } else if (!isValidLicensePlate(rawPlate)) {
      errors.bienSo = 'Biển số không đúng định dạng VN (VD: 51K-123.45)';
    }
    if (!regForm.anhCaVet) {
      errors.anhCaVet = 'Vui lòng tải lên ảnh Cà vẹt xe để đối chiếu!';
    }
    if (regForm.namSanXuat) {
      const yStr = String(regForm.namSanXuat).trim();
      const yNum = Number(yStr);
      const currY = new Date().getFullYear();
      if (yStr.length !== 4 || isNaN(yNum) || yNum < 1980 || yNum > currY + 1) {
        errors.namSanXuat = `Năm sản xuất không hợp lệ! Vui lòng chỉ nhập đúng 4 chữ số từ 1980 đến ${currY + 1}.`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }
    setRegErrors({});

    const formattedPlate = formatVietnameseLicensePlate(rawPlate);
    const fullVehicleName = `${regForm.hangXe} ${effectiveDongXe} ${regForm.dongCo}`.trim();

    try {
      const newV = await vehicleApi.registerVehicle({
        customerId: currentCustomer.id,
        tenXe: fullVehicleName,
        bienSo: formattedPlate,
        namSanXuat: Number(regForm.namSanXuat) || new Date().getFullYear(),
        hanBaoHanh: 'Chưa kích hoạt',
        mauSac: regForm.mauSac.trim() || 'Tiêu chuẩn',
        trangThaiBaoHanh: 'ChuaCo',
        soKhung: regForm.soKhung.trim() || undefined,
        soMay: regForm.soMay.trim() || undefined,
        trangThaiDuyet: 'ChoDuyet',
        anhCaVet: regForm.anhCaVet,
        hinhAnh: regForm.hinhAnh || regForm.anhCaVet,
      });

      const updatedCust: Customer = { ...currentCustomer, soXe: newV.id };
      localStorage.setItem('crm_current_customer', JSON.stringify(updatedCust));
      onCustomerChange?.(updatedCust);

      setMyVehicles(prev => [newV, ...prev]);
      setShowAddVehicleModal(false);
      setRegForm({
        hangXe: 'Honda',
        dongXe: 'Wave Alpha',
        customDongXe: '',
        dongCo: '110cc',
        bienSo: '',
        soKhung: '',
        soMay: '',
        mauSac: 'Đen bóng',
        namSanXuat: String(new Date().getFullYear()),
        anhCaVet: '',
        hinhAnh: '',
      });
      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_registered' } }));
    } catch (err) {
      console.error(err);
      setRegErrors({ form: 'Có lỗi xảy ra khi lưu xe. Vui lòng thử lại!' });
    }
  };

  const handleSubmitPlateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingPlateVehicle) return;
    setPlateUpdateError(null);

    const rawPlate = newPlateInput.trim();
    if (!rawPlate || !isValidLicensePlate(rawPlate)) {
      setPlateUpdateError('Biển số không đúng định dạng VN (VD: 59F1-123.45)!');
      return;
    }
    if (!newPlateCaVetImg) {
      setPlateUpdateError('Vui lòng tải ảnh Cà vẹt xe làm căn cứ đối chiếu!');
      return;
    }

    setPlateUpdateSubmitting(true);
    try {
      const formatted = formatVietnameseLicensePlate(rawPlate);
      await vehicleApi.requestLicensePlateUpdate(updatingPlateVehicle.id, formatted, newPlateCaVetImg);
      setMyVehicles(prev =>
        prev.map(v =>
          v.id === updatingPlateVehicle.id
            ? { ...v, bienSoChoDuyet: formatted, anhCaVet: newPlateCaVetImg, trangThaiDuyetBienSo: 'ChoDuyet' }
            : v
        )
      );
      setPlateUpdateToast(`Đã gửi biển số ${formatted} và ảnh Cà vẹt xe thành công!`);
      setTimeout(() => setPlateUpdateToast(null), 5000);
      setUpdatingPlateVehicle(null);
      setNewPlateInput('');
      setNewPlateCaVetImg('');
    } catch (err) {
      setPlateUpdateError('Có lỗi khi gửi yêu cầu cập nhật biển số.');
    } finally {
      setPlateUpdateSubmitting(false);
    }
  };

  // Warranty claim submit
  const handleSendWarrantyClaim = async () => {
    if (!requestingWarrantyVehicle || !currentCustomer) return;
    if (claimIssues.length === 0) {
      alert('Vui lòng chọn ít nhất 1 vấn đề xe gặp phải!');
      return;
    }
    if (!claimDesc.trim()) {
      alert('Vui lòng nhập mô tả chi tiết tình trạng xe!');
      return;
    }

    setClaimSubmitting(true);
    try {
      const res = await warrantyApi.createAppointment({
        customerId: currentCustomer.id,
        hoTenKH: currentCustomer.hoTen,
        soDienThoai: currentCustomer.soDienThoai,
        vehicleId: requestingWarrantyVehicle.id,
        tenXe: requestingWarrantyVehicle.tenXe,
        bienSo: requestingWarrantyVehicle.bienSo,
        odoKhachBao: Number(claimOdo) || 0,
        vanDeGapPhai: claimIssues,
        moTaChiTiet: claimDesc.trim(),
        hinhAnhKhachHang: claimImages,
        ngayHen: claimDate,
        gioHen: claimTime,
        chiNhanh: claimBranch,
      });

      if (res.success) {
        setClaimSuccessToast(`Đã gửi yêu cầu kiểm tra bảo hành ${res.appointment.id} thành công!`);
        setTimeout(() => setClaimSuccessToast(null), 6000);
        setRequestingWarrantyVehicle(null);
        setClaimDesc('');
        setClaimImages([]);
        appointmentApi.getAll().then(d => { if (d) setAllAppts(d); });
      }
    } catch (err) {
      alert('Có lỗi khi gửi yêu cầu bảo hành.');
    } finally {
      setClaimSubmitting(false);
    }
  };

  // Cancel order confirm
  const handleConfirmCancelOrder = async (orderId: string, reason: string) => {
    const res = await orderApi.cancelOrder(orderId, reason);
    if (res.success) {
      setOrderCancelToast(res.message);
      setTimeout(() => setOrderCancelToast(null), 4000);
      setAllOrders(prev => prev.map(o => (o.id === orderId || parseInt(o.id.replace(/\D/g, ''), 10) === parseInt(orderId.replace(/\D/g, ''), 10)) ? { ...o, trangThai: 'DaHuy', lyDoHuy: reason } : o));
      if (selectedOrderDetail && (selectedOrderDetail.id === orderId || parseInt(selectedOrderDetail.id.replace(/\D/g, ''), 10) === parseInt(orderId.replace(/\D/g, ''), 10))) {
        setSelectedOrderDetail(prev => prev ? { ...prev, trangThai: 'DaHuy', lyDoHuy: reason } : null);
      }
      setOrderToCancel(null);
      loadCustomerData();
      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'order_cancelled', orderId } }));
      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'order', orderId } }));
      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle' } }));
    } else {
      alert(res.message);
    }
  };

  // LH06: Hủy lịch hẹn khách hàng (đồng bộ Admin và cập nhật trạng thái)
  const handleConfirmCancelAppointment = async () => {
    if (!cancelConfirmAppt) return;
    setIsCancellingAppt(true);
    const finalReason = cancelReason === 'Khác' ? (customCancelReason.trim() || 'Lý do khác') : cancelReason;
    try {
      await appointmentApi.updateStatus(cancelConfirmAppt.id, 'DaHuy', `Khách hàng hủy: ${finalReason}`);
      setAllAppts(prev => prev.map(a => a.id === cancelConfirmAppt.id ? { ...a, trangThai: 'DaHuy', lyDoTuChoi: finalReason } : a));
      if (selectedApptDetail && selectedApptDetail.id === cancelConfirmAppt.id) {
        setSelectedApptDetail(prev => prev ? { ...prev, trangThai: 'DaHuy', lyDoTuChoi: finalReason } : null);
      }
      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'appointment' } }));
      alert(`✓ Lịch hẹn #${cancelConfirmAppt.id} đã được hủy thành công.`);
      setCancelConfirmAppt(null);
      setCustomCancelReason('');
    } catch (err) {
      alert('Không thể thực hiện hủy lịch hẹn vào lúc này. Vui lòng liên hệ tổng đài 1900 6868.');
    } finally {
      setIsCancellingAppt(false);
    }
  };

  // Open renew insurance modal with validation (BH09 & Chặn gia hạn khi còn hiệu lực)
  const handleOpenRenewInsuranceModal = (c: InsuranceContract) => {
    if (currentCustomer?.trangThai === 'BiKhoa') {
      alert('⚠️ TÀI KHOẢN BỊ KHÓA: Tài khoản của quý khách đang bị tạm khóa bởi Quản trị viên. Quý khách không thể thực hiện gia hạn bảo hiểm!');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (c.trangThai === 'HieuLuc' && c.ngayKetThuc >= todayStr) {
      alert(`⚠️ KHÔNG THỂ GIA HẠN: Hợp đồng ${c.soGCN} (${c.tenGoi}) của xe ${c.bienSo} vẫn đang CÒN HIỆU LỰC đến ngày ${c.ngayKetThuc.split('-').reverse().join('/')}. Theo quy định, chỉ được phép gia hạn khi hợp đồng đã hết hiệu lực!`);
      return;
    }
    setRenewingInsuranceContract(c);
  };

  // Renew insurance confirm
  const handleConfirmRenewInsurance = (c: InsuranceContract, years: number, paymentMethod: 'ChuyenKhoan' | 'TienMat' = 'ChuyenKhoan') => {
    const res = insuranceApi.renewContract(c.id, years, paymentMethod);
    if (res.success) {
      setRenewToast(res.message);
      setTimeout(() => setRenewToast(null), 5000);
      setRenewingInsuranceContract(null);
      // BH05: Cập nhật ngay thông tin khách hàng từ localStorage
      try {
        const curRaw = localStorage.getItem('crm_current_customer');
        if (curRaw) {
          const cur = JSON.parse(curRaw);
          onCustomerChange?.(cur);
        }
      } catch {}
      loadCustomerData();
    } else {
      alert(res.message);
    }
  };

  // Sync records on warranty detail view
  useEffect(() => {
    if (selectedVehicleWarrantyDetail) {
      const recs = warrantyApi.getWarrantyRecords(selectedVehicleWarrantyDetail.id);
      setWarrantyRecords(recs);
    }
  }, [selectedVehicleWarrantyDetail]);

  // Unauthenticated screen
  if (!currentCustomer) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center bg-[#0e0e10]">
        <div className="max-w-md w-full bg-[#141416] rounded-3xl p-8 shadow-xl border border-zinc-800 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-red-950 flex items-center justify-center text-4xl mb-5 text-red-500 border border-red-800">
            👤
          </div>
          <h2 className="text-xl font-extrabold text-white mb-2 uppercase tracking-wide">
            VUI LÒNG ĐĂNG NHẬP
          </h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Bạn cần đăng nhập tài khoản để xem trang cá nhân, quản lý xe, theo dõi bảo hành điện tử và bảo hiểm.
          </p>
          {onNavigateToShowroom && (
            <button
              onClick={onNavigateToShowroom}
              className="w-full py-3 rounded-xl font-bold text-xs bg-red-700 text-white hover:bg-red-800 transition shadow cursor-pointer"
            >
              🏍️ XEM XE MẪU TRONG SHOWROOM
            </button>
          )}
        </div>
      </div>
    );
  }

  const tier = getCustomerTier(realCustomerSpending);
  const percentToNext = tier.nextTierSpending
    ? Math.min(100, Math.round((realCustomerSpending / (realCustomerSpending + tier.nextTierSpending)) * 100))
    : 100;

  // Tổng số lượt dịch vụ đã hoàn tất (bao gồm cả các hồ sơ bảo hành đóng từ Admin)
  const completedServicesCount = useMemo(() => {
    const baseCount = myAppts.filter(a => a.trangThai === 'DaHoanThanh' || a.trangThai === 'HoanThanh').length;
    let extraCount = 0;
    try {
      const adminClaims = warrantyApi.getAdminClaims();
      const myCompleted = adminClaims.filter(c => {
        if (c.trangThai !== 'HoanThanh' || !currentCustomer) return false;
        if (c.customerId && c.customerId === currentCustomer.id) return true;
        const custNum = parseInt(currentCustomer.id.replace(/\D/g, ''), 10);
        const cNum = c.customerId ? parseInt(c.customerId.replace(/\D/g, ''), 10) : NaN;
        if (!isNaN(custNum) && !isNaN(cNum) && custNum === cNum) return true;
        const custPhone = currentCustomer.soDienThoai ? currentCustomer.soDienThoai.replace(/\D/g, '') : '';
        const cPhone = c.soDienThoai ? c.soDienThoai.replace(/\D/g, '') : '';
        if (custPhone && cPhone && custPhone === cPhone) return true;
        if (c.khachHang && currentCustomer.hoTen && c.khachHang.trim().toLowerCase() === currentCustomer.hoTen.trim().toLowerCase()) return true;
        if (c.id === 'YCBH00156' && (currentCustomer.id === 'KH001' || custNum === 1)) return true;
        return false;
      });
      extraCount = myCompleted.filter(c => 
        !myAppts.some(a => (a.trangThai === 'DaHoanThanh' || a.trangThai === 'HoanThanh') && (a.id === c.id || a.id === c.maLichHen || (c.maLichHen && a.maLichHen === c.maLichHen)))
      ).length;
    } catch {}
    return baseCount + extraCount;
  }, [myAppts, currentCustomer]);

  const sidebarNavItems = [
    { id: 0, label: 'Phương tiện của tôi', count: myVehicles.length, icon: '🏍️' },
    { id: 1, label: 'Đơn mua hàng', count: myOrders.length, icon: '🛍️' },
    { id: 2, label: 'Lịch hẹn', count: myAppts.filter(a => a.trangThai !== 'DaHoanThanh' && a.trangThai !== 'HoanThanh' && a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi').length, icon: '📅' },
    { id: 3, label: 'Lịch sử dịch vụ', count: completedServicesCount, icon: '🕒' },
    { id: 4, label: 'Bảo hiểm', count: myInsurances.length, icon: '🛡️' },
    { id: 5, label: 'Khảo sát & Đánh giá', count: 0, icon: '📝' },
  ];

  return (
    <div className="min-h-screen bg-[#0e0e10] text-zinc-100 font-sans pb-16">
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Top LH14 Banner: Nhắc lịch hẹn sắp tới */}
        {upcomingAppts.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-950/70 border border-blue-600/60 flex items-center justify-between flex-wrap gap-3 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⏰</span>
              <div>
                <div className="text-xs font-bold text-blue-300 uppercase font-mono tracking-wide">
                  NHẮC LỊCH HẸN DỊCH VỤ SẮP TỚI
                </div>
                <div className="text-xs text-blue-100 mt-0.5">
                  Bạn có <strong>{upcomingAppts.length} lịch hẹn</strong> ({SVC_LABELS[upcomingAppts[0].loaiDichVu] || upcomingAppts[0].loaiDichVu}) cho xe{' '}
                  <strong>{upcomingAppts[0].tenXe || 'của bạn'}</strong> vào lúc <strong className="font-mono text-red-400">{upcomingAppts[0].gioHen}</strong> ngày <strong className="font-mono text-blue-300">{upcomingAppts[0].ngayHen}</strong>{' '}
                  ({upcomingAppts[0].ngayHen === new Date().toISOString().split('T')[0] ? 'Hôm nay' : 'Ngày mai'}).
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {upcomingAppts.map((appt, idx) => (
                <button
                  key={appt.id || idx}
                  onClick={() => {
                    setActiveTab(2);
                    setSelectedApptDetail(appt);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-sm"
                >
                  {upcomingAppts.length > 1 ? `Xem #${appt.id || idx + 1} (${appt.gioHen}) →` : 'Xem chi tiết lịch hẹn →'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2-Column Dashboard Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ── LEFT SIDEBAR: PROFILE & NAV MENU ── */}
          <div className="w-full lg:w-72 shrink-0 space-y-4">
            {/* Profile Card */}
            <div className="p-5 rounded-3xl bg-[#141416] border border-zinc-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-red-600/80 bg-zinc-900 shrink-0">
                  {currentCustomer.avatar ? (
                    <img src={currentCustomer.avatar} alt={currentCustomer.hoTen} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl text-zinc-400 font-bold">
                      {currentCustomer.hoTen.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-white uppercase truncate">{currentCustomer.hoTen}</h3>
                  <div className="text-[11px] font-mono text-red-400 font-bold">Mã KH: {currentCustomer.id}</div>
                  <div className="text-[11px] text-zinc-400 truncate">{currentCustomer.soDienThoai}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-[#1d1d21] hover:bg-zinc-800 text-[11px] font-bold text-zinc-300 transition flex items-center justify-center gap-1 cursor-pointer border border-zinc-700"
                >
                  <span>✏️ Sửa hồ sơ</span>
                </button>
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="py-1.5 px-2 rounded-xl bg-[#1d1d21] hover:bg-zinc-800 text-[11px] font-bold text-zinc-300 transition flex items-center justify-center gap-1 cursor-pointer border border-zinc-700"
                  title="Đổi mật khẩu"
                >
                  <span>🔑 MK</span>
                </button>
              </div>
            </div>

            {/* Membership & CLV Card */}
            <div className="p-5 rounded-3xl bg-linear-to-br from-[#1c1417] to-[#141416] border border-red-950/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-bold text-zinc-400">HẠNG THÀNH VIÊN</span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono"
                  style={{ background: tier.badgeBg, color: tier.badgeColor, border: `1px solid ${tier.badgeBorder}` }}
                >
                  {tier.tier === 'VIP' ? '👑 ' : ''}{tier.label}
                </span>
              </div>
              <div className="text-xs font-semibold text-zinc-300">{tier.description}</div>

              {/* Spending progress */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span>Chi tiêu tích lũy:</span>
                  <strong className="text-red-400 font-bold">{formatVND(realCustomerSpending)}</strong>
                </div>
                {tier.nextTierSpending ? (
                  <>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-600 h-full rounded-full transition-all duration-500" style={{ width: `${percentToNext}%` }} />
                    </div>
                    <div className="text-[10px] text-zinc-400 text-right font-mono">
                      Còn thiếu {formatVND(tier.nextTierSpending)} để lên {tier.nextTierLabel}
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] text-purple-400 font-mono text-center pt-1 font-bold">
                    ✨ ĐẠT HẠNG CAO NHẤT
                  </div>
                )}
              </div>
            </div>

            {/* Nav Menu */}
            <div className="p-2 rounded-3xl bg-[#141416] border border-zinc-800 space-y-1">
              {sidebarNavItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsBuyingOnlineInsurance(false);
                      setSelectedVehicleWarrantyDetail(null);
                      setRequestingWarrantyVehicle(null);
                      setExtendingWarrantyVehicle(null);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-red-950/60 text-red-400 border border-red-800/80 shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.count > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isActive ? 'bg-red-900 text-red-200' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT MAIN CONTENT AREA ── */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Header stats bar (Chuẩn Ảnh 1) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-3xl bg-[#141416] border border-zinc-800 text-center">
              <div className="p-2">
                <div className="text-xs text-zinc-400 font-mono">Tổng chi tiêu</div>
                <div className="text-base sm:text-lg font-black text-red-400 font-mono mt-0.5">{formatVND(realCustomerSpending)}</div>
              </div>
              <div className="p-2">
                <div className="text-xs text-zinc-400 font-mono">Phương tiện</div>
                <div className="text-base sm:text-lg font-black text-white font-mono mt-0.5">0{myVehicles.length}</div>
              </div>
              <div className="p-2">
                <div className="text-xs text-zinc-400 font-mono">Đơn hàng</div>
                <div className="text-base sm:text-lg font-black text-white font-mono mt-0.5">0{myOrders.length}</div>
              </div>
              <div className="p-2">
                <div className="text-xs text-zinc-400 font-mono">Bảo hiểm</div>
                <div className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-0.5">0{myInsurances.length}</div>
              </div>
              <div className="p-2">
                <div className="text-xs text-zinc-400 font-mono">Bảo hành</div>
                <div className="text-base sm:text-lg font-black text-white font-mono mt-0.5">
                  0{myVehicles.filter(v => v.nguonGoc === 'CuaHang' && v.trangThaiBaoHanh === 'ConHan').length}
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════ */}
            {/* ── TAB 0: PHƯƠNG TIỆN CỦA TÔI & BẢO HÀNH ── */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 0 && (
              extendingWarrantyVehicle ? (
                <WarrantyExtensionWizard
                  vehicle={extendingWarrantyVehicle}
                  customer={currentCustomer}
                  onClose={() => setExtendingWarrantyVehicle(null)}
                  onSuccess={() => {
                    setExtSuccessToast('Gia hạn bảo hành mở rộng Care+ thành công!');
                    setTimeout(() => setExtSuccessToast(null), 6000);
                    loadCustomerData();
                  }}
                />
              ) : requestingWarrantyVehicle ? (
                <WarrantyClaimFormView
                  vehicle={requestingWarrantyVehicle}
                  customer={currentCustomer}
                  claimIssues={claimIssues}
                  setClaimIssues={setClaimIssues}
                  claimDesc={claimDesc}
                  setClaimDesc={setClaimDesc}
                  claimOdo={claimOdo}
                  setClaimOdo={setClaimOdo}
                  claimImages={claimImages}
                  setClaimImages={setClaimImages}
                  claimDate={claimDate}
                  setClaimDate={setClaimDate}
                  claimTime={claimTime}
                  setClaimTime={setClaimTime}
                  claimBranch={claimBranch}
                  setClaimBranch={setClaimBranch}
                  claimSubmitting={claimSubmitting}
                  onSubmit={handleSendWarrantyClaim}
                  onBack={() => setRequestingWarrantyVehicle(null)}
                />
              ) : selectedVehicleWarrantyDetail ? (
                <WarrantyDetailView
                  vehicle={selectedVehicleWarrantyDetail}
                  customer={currentCustomer}
                  records={warrantyRecords}
                  onRequestClaim={() => setRequestingWarrantyVehicle(selectedVehicleWarrantyDetail)}
                  onExtendWarranty={() => setExtendingWarrantyVehicle(selectedVehicleWarrantyDetail)}
                  onBack={() => setSelectedVehicleWarrantyDetail(null)}
                  toastMessage={claimSuccessToast || extSuccessToast}
                  onClearToast={() => { setClaimSuccessToast(null); setExtSuccessToast(null); }}
                />
              ) : (
                <div className="space-y-6">
                  {/* Top action row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                        PHƯƠNG TIỆN CỦA TÔI
                      </h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Quản lý sổ bảo hành điện tử chính hãng, bảo hiểm xe máy và đặt lịch hẹn
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddVehicleModal(true)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow transition flex items-center justify-center gap-2 cursor-pointer shrink-0 uppercase tracking-wider"
                    >
                      <span className="text-sm font-black">+</span>
                      <span>THÊM PHƯƠNG TIỆN</span>
                    </button>
                  </div>

                  {/* Filter chips bar */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {[
                      { key: 'TatCa', label: `Tất cả (${myVehicles.length})` },
                      { key: 'CuaHang', label: `✓ Mua tại cửa hàng (${myVehicles.filter(v => v.nguonGoc === 'CuaHang').length})` },
                      { key: 'NgoaiHeThong', label: `Xe mua ngoài (${myVehicles.filter(v => v.nguonGoc === 'NgoaiHeThong').length})` },
                      { key: 'DangBaoHanh', label: `Đang bảo hành (${myVehicles.filter(v => v.nguonGoc === 'CuaHang' && v.trangThaiBaoHanh === 'ConHan').length})` },
                      { key: 'CoBaoHiem', label: `Có bảo hiểm (${myVehicles.filter(v => {
                        const ins = findMatchingInsurance(v, myInsurances);
                        return !!ins && ins.trangThai !== 'HetHan' && ins.trangThai !== 'TuChoi';
                      }).length})` },
                    ].map(f => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setVehicleFilter(f.key as any)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                          vehicleFilter === f.key
                            ? 'bg-red-700 text-white border-red-700 shadow-xs'
                            : 'bg-[#141416] text-zinc-400 hover:text-white border-zinc-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Toast cập nhật biển số */}
                  {plateUpdateToast && (
                    <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in">
                      <span>🎉 {plateUpdateToast}</span>
                      <button onClick={() => setPlateUpdateToast(null)} className="text-emerald-400 font-bold">✕</button>
                    </div>
                  )}

                  {/* Vehicles Grid */}
                  {displayedVehicles.length === 0 ? (
                    <div className="p-12 text-center rounded-3xl bg-[#141416] border border-zinc-800 text-zinc-400">
                      <div className="text-4xl mb-3">🏍️</div>
                      <h3 className="font-bold text-white text-base mb-1">Chưa có phương tiện nào trong danh mục này</h3>
                      <p className="text-xs text-zinc-500 mb-4">Bạn có thể tự đăng ký xe hoặc xe mới mua tại đại lý sẽ hiển thị tại đây.</p>
                      <button
                        onClick={() => setShowAddVehicleModal(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 cursor-pointer shadow"
                      >
                        + Thêm phương tiện mới
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {displayedVehicles.map(v => {
                        const isCuaHang = v.nguonGoc === 'CuaHang';
                        // Kiểm tra hạn bảo hành thực tế: phải là xe cửa hàng, trangThaiBaoHanh là 'ConHan' và ngày hanBaoHanh chưa hết hạn
                        const isBaoHanhConHan = (() => {
                          if (!isCuaHang || v.trangThaiBaoHanh !== 'ConHan') return false;
                          if (!v.hanBaoHanh || v.hanBaoHanh === 'Không áp dụng' || v.hanBaoHanh.includes('Hết')) return false;
                          try {
                            const parts = v.hanBaoHanh.includes('/') ? v.hanBaoHanh.split('/') : v.hanBaoHanh.split('-');
                            const expiry = parts.length === 3
                              ? (v.hanBaoHanh.includes('/')
                                  ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
                                  : new Date(v.hanBaoHanh))
                              : new Date(v.hanBaoHanh);
                            return expiry.getTime() >= new Date().setHours(0, 0, 0, 0);
                          } catch {
                            return false;
                          }
                        })();
                        const curIns = findMatchingInsurance(v, myInsurances);
                        const hasValidIns = !!curIns && curIns.trangThai !== 'HetHan' && curIns.trangThai !== 'TuChoi';
                        const fallbackImg = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80';

                        const isVehicleHighlighted = highlightTarget?.type === 'vehicle' && (
                          !highlightTarget.id ||
                          highlightTarget.id === v.id ||
                          v.id.toLowerCase().includes((highlightTarget.id || '').toLowerCase()) ||
                          (v.bienSo && v.bienSo === highlightTarget.id)
                        );

                        return (
                          <div
                            key={v.id}
                            id={`veh-card-${v.id}`}
                            className={`rounded-3xl bg-[#141416] border overflow-hidden transition flex flex-col justify-between ${
                              isVehicleHighlighted
                                ? 'border-red-600 ring-4 ring-red-500 ring-offset-2 ring-offset-[#0e0e10] animate-pulse'
                                : 'border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div>
                              {/* Top Bar: Badge & Plate */}
                              <div className="p-4 pb-2">
                                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                                  {isCuaHang ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                      ✓ Mua tại hệ thống
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                                      Xe mua ngoài hệ thống
                                    </span>
                                  )}

                                  {v.trangThaiDuyet === 'ChoDuyet' && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 animate-pulse">
                                      ⏳ Chờ duyệt xe
                                    </span>
                                  )}
                                  {v.trangThaiDuyetBienSo === 'ChoDuyet' && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 animate-pulse">
                                      ⏳ Đang chờ duyệt biển số
                                    </span>
                                  )}
                                </div>

                                <div className="w-full h-40 rounded-2xl overflow-hidden bg-zinc-900 relative group">
                                  <img
                                    src={getVehicleDisplayImage(v)}
                                    alt={v.tenXe}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={e => { e.currentTarget.src = fallbackImg; }}
                                  />
                                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-xs text-white text-[11px] font-mono font-bold">
                                    {v.trangThaiDuyetBienSo === 'ChoDuyet' && v.bienSoChoDuyet ? (
                                      <span className="text-amber-400">⏳ Chờ duyệt: {v.bienSoChoDuyet}</span>
                                    ) : v.trangThaiDuyetBienSo === 'TuChoi' ? (
                                      <span className="text-red-400 font-bold">⛔ Bị từ chối: {v.bienSoChoDuyet || v.bienSo}</span>
                                    ) : (
                                      v.bienSo || 'Chưa có biển'
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Vehicle Title */}
                              <div className="px-5 pt-1 pb-3">
                                <h3 className="font-extrabold text-base text-white uppercase truncate">{v.tenXe}</h3>
                                <div className="text-xs text-zinc-400 font-mono mt-0.5">
                                  {v.trangThaiDuyetBienSo === 'ChoDuyet' && v.bienSoChoDuyet ? (
                                    <span className="text-amber-400 font-bold">{v.bienSoChoDuyet} (Đang chờ duyệt)</span>
                                  ) : v.trangThaiDuyetBienSo === 'TuChoi' ? (
                                    <span className="text-red-400 font-bold">{v.bienSoChoDuyet || v.bienSo} (⛔ Bị từ chối)</span>
                                  ) : (
                                    v.bienSo
                                  )} · {v.mauSac || 'Tiêu chuẩn'} · {v.namSanXuat}
                                </div>
                              </div>

                              {/* Banner bị từ chối duyệt biển số kèm lý do */}
                              {isCuaHang && v.trangThaiDuyetBienSo === 'TuChoi' && (
                                <div className="mx-5 mb-3 p-3 rounded-2xl bg-red-950/50 border border-red-700/80 text-xs shadow-md">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="text-red-300 font-bold flex items-center gap-1.5">
                                      <span>⛔ Yêu cầu cấp biển số bị từ chối</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/90 text-red-200 border border-red-700">
                                      Bị từ chối
                                    </span>
                                  </div>
                                  {v.lyDoTuChoiBienSo ? (
                                    <div className="p-2 rounded-xl bg-black/40 text-red-200 text-[11px] mb-2 border border-red-800/40">
                                      <strong>Lý do từ chối:</strong> {v.lyDoTuChoiBienSo}
                                    </div>
                                  ) : null}
                                  <button
                                    onClick={() => {
                                      setUpdatingPlateVehicle(v);
                                      setNewPlateInput(v.bienSoChoDuyet || '');
                                      setNewPlateCaVetImg(v.anhCaVet || '');
                                      setPlateUpdateError(null);
                                    }}
                                    className="w-full py-1.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs cursor-pointer shadow transition flex items-center justify-center gap-1"
                                  >
                                    <span>🔄 Cập nhật và gửi lại Biển số & Cà vẹt</span>
                                  </button>
                                </div>
                              )}

                              {/* Banner đang chờ duyệt biển số */}
                              {isCuaHang && v.trangThaiDuyetBienSo === 'ChoDuyet' && (
                                <div className="mx-5 mb-3 p-3 rounded-2xl bg-amber-950/40 border border-amber-700/60 text-xs">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="text-amber-300 font-bold flex items-center gap-1.5">
                                      <span>⏳ Đang chờ duyệt biển số</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/80 text-amber-200 border border-amber-700">
                                      Chờ Admin duyệt
                                    </span>
                                  </div>
                                  <div className="text-zinc-300 text-[11px]">
                                    Biển số yêu cầu: <strong className="text-white font-mono">{v.bienSoChoDuyet}</strong> (Kèm ảnh Cà vẹt xe)
                                  </div>
                                </div>
                              )}

                              {/* Banner cập nhật biển số nếu xe mua cửa hàng chưa có biển và chưa gửi duyệt */}
                              {isCuaHang && v.trangThaiDuyetBienSo !== 'ChoDuyet' && v.trangThaiDuyetBienSo !== 'DaDuyet' && (v.trangThaiDuyetBienSo === 'ChoCapNhat' || !v.bienSo || v.bienSo === 'Chưa có biển số') && (
                                <div className="mx-5 mb-3 p-3 rounded-2xl bg-amber-950/40 border border-amber-700/60 text-xs">
                                  <div className="text-amber-200 mb-2 font-semibold">
                                    🎉 Chúc mừng bạn đã nhận xe! Vui lòng cập nhật biển số và ảnh cà vẹt xe để duyệt hồ sơ.
                                  </div>
                                  <button
                                    onClick={() => {
                                      setUpdatingPlateVehicle(v);
                                      setNewPlateInput('');
                                      setNewPlateCaVetImg('');
                                      setPlateUpdateError(null);
                                    }}
                                    className="w-full py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow"
                                  >
                                    📋 Cập nhật Biển số & Cà vẹt
                                  </button>
                                </div>
                              )}

                              {/* 2 Blocks: Warranty & Insurance */}
                              <div className="px-5 space-y-2.5 pb-3">
                                <div className="p-3 rounded-2xl bg-[#18181b] border border-zinc-800 text-xs">
                                  <div className="text-[10px] font-mono uppercase font-bold text-zinc-500">BẢO HÀNH ĐIỆN TỬ</div>
                                  {isBaoHanhConHan ? (
                                    <div className="text-emerald-400 font-bold mt-0.5">✓ Đang trong hạn bảo hành (36 tháng)</div>
                                  ) : (
                                    <div className="text-zinc-500 font-medium mt-0.5">⚪ Không áp dụng / Đã hết hạn</div>
                                  )}
                                </div>

                                <div className="p-3 rounded-2xl bg-[#18181b] border border-zinc-800 text-xs">
                                  <div className="text-[10px] font-mono uppercase font-bold text-zinc-500">BẢO HIỂM XE MÁY</div>
                                  {hasValidIns ? (
                                    <div className="text-blue-400 font-bold mt-0.5">🔵 {curIns.tenGoi} · {curIns.nhaBaoHiem}</div>
                                  ) : (
                                    <div className="text-zinc-500 font-medium mt-0.5">⚪ Chưa có bảo hiểm</div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions Grid */}
                            <div className="p-4 pt-0 border-t border-zinc-800/80 mt-2">
                              <div className={`grid gap-2 mt-3 text-xs ${isBaoHanhConHan ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenVehicleDetail(v)}
                                  className="py-2 px-2 rounded-xl font-bold bg-[#1e1e24] hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition cursor-pointer"
                                >
                                  🔍 Chi tiết
                                </button>

                                {/* CHỈ KHI CÒN HẠN BẢO HÀNH THÌ MỚI HIỆN NÚT BẢO HÀNH (ẢNH 2) */}
                                {isBaoHanhConHan && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedVehicleWarrantyDetail(v)}
                                    className="py-2 px-2 rounded-xl font-bold bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 transition cursor-pointer"
                                  >
                                    📅 Bảo hành
                                  </button>
                                )}

                                {hasValidIns ? (
                                  <button
                                    type="button"
                                    onClick={() => setViewingInsuranceContract(curIns)}
                                    className="py-2 px-2 rounded-xl font-bold bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 transition cursor-pointer"
                                  >
                                    🛡️ Bảo hiểm
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBuyingInsuranceInitialVehicle(v);
                                      setIsBuyingOnlineInsurance(true);
                                      setActiveTab(4);
                                    }}
                                    className="py-2 px-2 rounded-xl font-bold bg-red-700 hover:bg-red-800 text-white shadow transition cursor-pointer"
                                  >
                                    🛡️ Mua BH
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setActiveTab(2)}
                                  className="py-2 px-2 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer"
                                >
                                  📅 Đặt lịch
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* ── TAB 1: ĐƠN MUA HÀNG (XE & PHỤ TÙNG - BỔ SUNG ĐÁNH GIÁ) ── */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 1 && (
              <div className="space-y-6">
                {/* Header & Sub-tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                      ĐƠN MUA HÀNG
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Theo dõi tiến độ giao xe, lịch nhận xe showroom và đơn phụ tùng
                    </p>
                  </div>

                  {/* Sub-tabs: Tất cả vs Xe vs Phụ Tùng */}
                  <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#141416] border border-zinc-800 self-start sm:self-auto">
                    <button
                      onClick={() => setOrdersSubTab('TatCa')}
                      className={`px-5 py-2 rounded-xl text-xs font-extrabold uppercase transition cursor-pointer ${
                        ordersSubTab === 'TatCa' ? 'bg-red-700 text-white shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      📋 Tất cả ({myOrders.length})
                    </button>
                    <button
                      onClick={() => setOrdersSubTab('Xe')}
                      className={`px-5 py-2 rounded-xl text-xs font-extrabold uppercase transition cursor-pointer ${
                        ordersSubTab === 'Xe' ? 'bg-red-700 text-white shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      🏍️ Xe ({myOrders.filter(o => o.loaiDon === 'Xe' || o.thongTinXe).length})
                    </button>
                    <button
                      onClick={() => setOrdersSubTab('PhuTung')}
                      className={`px-5 py-2 rounded-xl text-xs font-extrabold uppercase transition cursor-pointer ${
                        ordersSubTab === 'PhuTung' ? 'bg-red-700 text-white shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      📦 Phụ tùng ({myOrders.filter(o => o.loaiDon !== 'Xe' && !o.thongTinXe).length})
                    </button>
                  </div>
                </div>

                {/* Filter bar */}
                <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-[#141416] border border-zinc-800 text-xs">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-zinc-500 font-mono">Lọc:</span>
                    {(['TatCa', 'ChoDuyet', 'DangGiao', 'HoanThanh', 'DaHuy'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setOrderStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                          orderStatusFilter === st
                            ? 'bg-zinc-800 text-white border-zinc-600'
                            : 'bg-[#121214] text-zinc-400 hover:text-white border-zinc-800'
                        }`}
                      >
                        {st === 'TatCa' ? 'Tất cả' : orderStatusConfig[st as OrderStatus]?.label || st}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={orderTimeFilter}
                      onChange={e => setOrderTimeFilter(e.target.value)}
                      className="p-2 rounded-xl bg-[#121214] border border-zinc-800 text-zinc-300 font-mono text-xs focus:outline-none"
                    >
                      <option value="30days">30 ngày qua</option>
                      <option value="6months">6 tháng qua</option>
                      <option value="year">Năm nay (2026)</option>
                    </select>
                  </div>
                </div>

                {/* Orders List */}
                {(() => {
                  const filtered = myOrders.filter(o => {
                    const isXe = o.loaiDon === 'Xe' || !!o.thongTinXe;
                    if (ordersSubTab === 'Xe' && !isXe) return false;
                    if (ordersSubTab === 'PhuTung' && isXe) return false;
                    if (orderStatusFilter !== 'TatCa' && o.trangThai !== orderStatusFilter) return false;
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-12 text-center rounded-3xl bg-[#141416] border border-zinc-800 text-zinc-400">
                        <div className="text-4xl mb-3">🛍️</div>
                        <h3 className="font-bold text-white text-base mb-1">Chưa có đơn hàng nào phù hợp</h3>
                        <p className="text-xs text-zinc-500">Các đơn hàng mua xe và phụ tùng của bạn sẽ hiển thị tại đây.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {filtered.map(order => {
                        const isXe = order.loaiDon === 'Xe' || !!order.thongTinXe;
                        const isCompleted = order.trangThai === 'HoanThanh' || order.trangThai === 'DaGiao' || (isXe && (order.thongTinXe as any)?.daNhanXe);
                        const cfg = orderStatusConfig[order.trangThai] || { label: order.trangThai, color: '#71717a', bg: '#27272a' };

                        return (
                          <div
                            key={order.id}
                            className="p-5 rounded-3xl bg-[#141416] border border-zinc-800 space-y-4 hover:border-zinc-700 transition"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-zinc-800">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-red-950 text-red-400 border border-red-800">
                                  #{order.id}
                                </span>
                                <span className="text-xs text-zinc-400 font-mono">📅 Ngày đặt: {order.ngayDat}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border font-mono ${order.trangThaiThanhToan === 'DaThanhToan' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : order.trangThaiThanhToan === 'DaCoc' ? 'bg-amber-950/80 text-amber-400 border-amber-800' : 'bg-zinc-900 text-zinc-400 border-zinc-700'}`}>
                                  {order.trangThaiThanhToan === 'DaThanhToan' ? '💵 Đã thanh toán' : order.trangThaiThanhToan === 'DaCoc' ? '💵 Đã đặt cọc' : '⏳ Chưa thanh toán (COD)'}
                                </span>
                                <StatusBadge {...cfg} />
                              </div>
                            </div>

                            {/* Xe vs Phụ Tùng content */}
                            {isXe ? (
                              <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#18181b] border border-zinc-800">
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-mono uppercase font-bold text-red-400">🏍️ MẪU XE CHÍNH HÃNG</span>
                                    <h4 className="text-base font-extrabold text-white">{order.thongTinXe?.tenXe || 'Mẫu xe chính hãng'}</h4>
                                    <div className="text-xs text-zinc-400 font-mono">
                                      Màu: <strong>{order.thongTinXe?.mauSac || 'Tiêu chuẩn'}</strong> · Phiên bản: <strong>{order.thongTinXe?.phienBan || 'Tiêu chuẩn'}</strong>
                                    </div>
                                    {order.thongTinXe?.ngayGiaoXe && (
                                      <div className="text-xs text-red-400 font-mono pt-1">
                                        📅 Lịch nhận xe: <strong>{order.thongTinXe?.khungGioGiao || '09:00'} ngày {order.thongTinXe?.ngayGiaoXe}</strong>
                                      </div>
                                    )}
                                  </div>

                                  {order.trangThai !== 'HoanThanh' && order.trangThai !== 'DaHuy' ? (
                                    <button
                                      type="button"
                                      onClick={() => setViewingQrData({
                                        maLichHen: order.maLichHen || `HEN-XE-${order.id.slice(-4)}`,
                                        maDonHang: order.id,
                                        tenXe: order.thongTinXe?.tenXe || 'Xe máy chính hãng',
                                        mauXe: order.thongTinXe?.mauSac,
                                        phienBan: order.thongTinXe?.phienBan,
                                        ngayHen: order.thongTinXe?.ngayGiaoXe || order.ngayDat,
                                        gioHen: order.thongTinXe?.khungGioGiao || '09:00',
                                        hoTenKH: order.hoTenKH,
                                        soDienThoai: order.soDienThoai,
                                        qrCodeUrl: order.qrCodeUrl,
                                        soTienCoc: order.thongTinXe?.soTienDatCoc,
                                        daThanhToan100: !order.thongTinXe?.soTienConLai,
                                        soTienConLai: order.thongTinXe?.soTienConLai,
                                        tongTien: order.tongTien,
                                      })}
                                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition cursor-pointer shadow flex items-center gap-2 whitespace-nowrap"
                                    >
                                      <span>📱 Mã Nhận Xe & QR Code</span>
                                    </button>
                                  ) : (
                                    <div className="px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
                                      <span>✓</span> <span>Đã nhận xe thành công</span>
                                    </div>
                                  )}
                                </div>

                                {/* Khách hàng xác nhận ngày nhận xe hoặc đổi ngày nhận xe tại Showroom */}
                                {isXe && (order.trangThai === 'ChoKhachXacNhanNgayNhan' || order.trangThai === 'ChoGiaoXe' || order.trangThai === 'DaXacNhan') && (
                                  <div className={`p-4 rounded-2xl border text-xs space-y-3 ${order.trangThai === 'ChoKhachXacNhanNgayNhan' ? 'bg-amber-950/70 border-amber-600/80 text-amber-200 shadow-md' : 'bg-sky-950/60 border-sky-800 text-sky-200'}`}>
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <div className={`font-extrabold flex items-center gap-1.5 ${order.trangThai === 'ChoKhachXacNhanNgayNhan' ? 'text-amber-300 text-sm' : 'text-sky-300'}`}>
                                        <span>{order.trangThai === 'ChoKhachXacNhanNgayNhan' ? '🎉' : '🏢'}</span>
                                        <span>{order.trangThai === 'ChoKhachXacNhanNgayNhan' ? 'ĐƠN XE ĐÃ ĐƯỢC DUYỆT - MỜI XÁC NHẬN NGÀY NHẬN XE' : 'LỊCH HẸN NHẬN XE TẠI SHOWROOM'}</span>
                                      </div>
                                      <span className="text-[11px] font-mono text-zinc-300">
                                        Ngày nhận dự kiến: <strong className="text-amber-400">{order.thongTinXe?.ngayGiaoXe || 'Sắp tới'}</strong> ({order.thongTinXe?.khungGioGiao || '09:00'})
                                      </span>
                                    </div>
                                    {order.trangThai === 'ChoKhachXacNhanNgayNhan' ? (
                                      <>
                                        <p className="text-[11px] text-amber-100/90 leading-relaxed">
                                          Showroom Motoshop đã duyệt đơn mua xe <strong>{order.thongTinXe?.tenXe || 'của bạn'}</strong>! Quý khách vui lòng bấm <strong>Xác nhận ngày nhận xe</strong> bên dưới để Showroom kích hoạt lịch hẹn và chuẩn bị bàn giao xe:
                                        </p>
                                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              const pickupDate = order.thongTinXe?.ngayGiaoXe || new Date(Date.now() + 86400000).toISOString().split('T')[0];
                                              const pickupTime = order.thongTinXe?.khungGioGiao || '09:00';
                                              setConfirmedPickupOrderIds(prev => ({ ...prev, [order.id]: true }));
                                              await orderApi.confirmVehiclePickupDate(order.id, pickupDate, pickupTime);
                                              setAllOrders(orderApi.getAllSync());
                                              appointmentApi.getAll().then(d => { if (d) setAllAppts(d); });
                                              alert(`✓ Bạn đã xác nhận ngày nhận xe thành công (${pickupDate} lúc ${pickupTime})!\nLịch hẹn nhận xe đã xuất hiện trong mục "Lịch hẹn" của bạn và Lịch biểu Showroom.`);
                                            }}
                                            className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow transition cursor-pointer flex items-center gap-1.5"
                                          >
                                            <span>✓</span> <span>Xác nhận ngày nhận xe ({order.thongTinXe?.ngayGiaoXe || 'Ngày mai'})</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setChangingDateOrder(order);
                                              setNewPickupDateInput(order.thongTinXe?.ngayGiaoXe || new Date().toISOString().split('T')[0]);
                                            }}
                                            className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition cursor-pointer flex items-center gap-1.5"
                                          >
                                            <span>📅</span> <span>Đổi ngày khác</span>
                                          </button>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-xs space-y-1.5 shadow-sm">
                                        <div className="flex items-center gap-2 font-bold text-emerald-300">
                                          <span>✓</span> <span>Quý khách đã chốt ngày nhận xe: <strong>{order.thongTinXe?.ngayNhanXacNhan || order.thongTinXe?.ngayGiaoXe || 'Sắp tới'}</strong> ({order.thongTinXe?.gioNhanXacNhan || order.thongTinXe?.khungGioGiao || '09:00'})</span>
                                        </div>
                                        <p className="text-[11px] text-emerald-100/80 leading-relaxed">
                                          Lịch hẹn nhận xe đã được đồng bộ vào hệ thống Showroom. Theo quy định, ngày nhận xe không thể tự thay đổi bằng thao tác thông thường. Nếu có việc bận đột xuất cần đổi lịch, quý khách vui lòng liên hệ Hotline <strong>1900-8888</strong> hoặc nhắn tin CSKH để được nhân viên hỗ trợ đổi lịch.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {order.items.map((it, idx) => {
                                  // DG01: Chuẩn hóa productId phụ tùng dưới dạng chuỗi (PT001, PT002...)
                                  const ptIdNum = it.maPhuTung || (it as any).id;
                                  let pIdStr: string = '';
                                  if (ptIdNum) {
                                    const num = parseInt(String(ptIdNum).replace(/\D/g, ''), 10);
                                    if (!isNaN(num) && num > 0) {
                                      pIdStr = num < 10 ? `PT00${num}` : `PT0${num}`;
                                    }
                                  }
                                  if (!pIdStr) {
                                    const matchedP = mockParts.find(p => p.tenSanPham.toLowerCase().includes(it.tenSanPham.toLowerCase()) || it.tenSanPham.toLowerCase().includes(p.tenSanPham.toLowerCase()));
                                    pIdStr = matchedP?.id || 'PT001';
                                  }

                                  // Kiểm tra xem phụ tùng này của đơn hàng đã được đánh giá chưa
                                  const existingReview = myCustomerFeedbacks.find(f =>
                                    (f.orderId && f.orderId === order.id && (f.productName?.toLowerCase().trim() === it.tenSanPham.toLowerCase().trim() || f.productId === pIdStr)) ||
                                    (f.productId && f.productId === pIdStr && f.orderId === order.id) ||
                                    (f.productName && f.productName.toLowerCase().trim() === it.tenSanPham.toLowerCase().trim() && (f.orderId === order.id || !f.orderId))
                                  );

                                  return (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 border-b border-zinc-800/60 last:border-none gap-2">
                                      <span className="text-zinc-200 font-medium">
                                        {it.tenSanPham} <span className="text-zinc-500 font-mono">×{it.soLuong}</span>
                                      </span>
                                      <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                                        <span className="font-mono font-bold text-white">{formatVND(it.donGia * it.soLuong)}</span>
                                        {isCompleted && (
                                          existingReview ? (
                                            <div className="flex items-center gap-1.5">
                                              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 shadow-2xs font-mono">
                                                <span>✓</span> <span>Đã đánh giá ({existingReview.diemDanhGia}⭐)</span>
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setReviewModalPart({
                                                    partName: it.tenSanPham,
                                                    orderId: order.id,
                                                    productId: pIdStr,
                                                    productType: 'PhuTung',
                                                    fromTab: 1,
                                                  });
                                                  setReviewStars(existingReview.diemDanhGia);
                                                  setReviewContent(existingReview.noiDung);
                                                  setReviewImages(existingReview.hinhAnhDinhKem || []);
                                                                                                  }}
                                                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer border border-zinc-700"
                                                title="Xem hoặc sửa lại đánh giá"
                                              >
                                                ✏️ Sửa
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const custId = currentCustomer ? formatCustomerId(currentCustomer.id) : 'KH032';
                                                  const pinned: PinnedChatContext = {
                                                    title: '📌 BẠN ĐANG HỎI VỀ SẢN PHẨM ĐÃ MUA',
                                                    productName: it.tenSanPham,
                                                    productImage: '/images/phutung/motul_7100.png',
                                                    orderId: `Đơn hàng: #${order.id} · SP: ${it.tenSanPham}`,
                                                    rating: existingReview?.diemDanhGia || 5,
                                                    comment: `Đã mua x${it.soLuong}. Đánh giá: "${existingReview?.noiDung || 'Hài lòng'}"`,
                                                  };
                                                  chatApi.syncPinnedContext(custId, pinned);
                                                  window.dispatchEvent(new CustomEvent('crm-open-chat', {
                                                    detail: {
                                                      pinnedContext: pinned,
                                                      prefillMessage: `Dạ chào Shop, em muốn trao đổi về sản phẩm "${it.tenSanPham}" trong đơn hàng #${order.id} ạ!`,
                                                    }
                                                  }));
                                                }}
                                                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer flex items-center gap-1"
                                                title="Nhắn tin với CSKH về sản phẩm này"
                                              >
                                                <span>💬</span> <span>Tư vấn</span>
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setReviewModalPart({
                                                  partName: it.tenSanPham,
                                                  orderId: order.id,
                                                  productId: pIdStr,
                                                  productType: 'PhuTung',
                                                  fromTab: 1,
                                                });
                                                setReviewStars(5);
                                                setReviewContent('');
                                                setReviewImages([]);
                                                                                              }}
                                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                            >
                                              <span>⭐ Đánh giá</span>
                                            </button>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Bottom row: Total & Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800 text-xs">
                              <div className="text-zinc-400">📍 Giao tới: {order.diaChiGiao}</div>
                              <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
                                <div className="text-sm font-black font-mono text-red-400 mr-2">
                                  {formatVND(order.tongTien)}
                                </div>

                                {/* Nút MUA LẠI: Hiển thị nổi bật trên tất cả đơn phụ tùng (Theo yêu cầu ảnh 3) */}
                                {!isXe && (
                                  <button
                                    type="button"
                                    disabled={reorderLoading}
                                    onClick={() => handleReorder(order)}
                                    className="px-3.5 py-1.5 rounded-xl font-bold bg-[#27272a] hover:bg-[#3f3f46] text-zinc-200 border border-zinc-700 transition cursor-pointer flex items-center gap-1.5 shadow-sm text-xs disabled:opacity-50"
                                    title="Mua lại các sản phẩm trong đơn hàng này"
                                  >
                                    <span>🔄</span> {reorderLoading ? 'Đang gửi...' : 'Mua lại'}
                                  </button>
                                )}

                                {/* Nút Liên hệ hỗ trợ */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    window.dispatchEvent(new CustomEvent('crm-open-chat', {
                                      detail: {
                                        prefillMessage: `Dạ chào Shop, em cần hỗ trợ về đơn hàng #${order.id} ạ!`,
                                      }
                                    }));
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl font-bold bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 border border-zinc-700 transition cursor-pointer flex items-center gap-1.5 text-xs shadow-sm"
                                  title="Liên hệ CSKH về đơn hàng này"
                                >
                                  <span>💬</span> Liên hệ hỗ trợ
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderDetail(order)}
                                  className="px-3.5 py-1.5 rounded-xl font-bold bg-[#27272a] hover:bg-[#3f3f46] text-zinc-200 transition cursor-pointer border border-zinc-700 text-xs shadow-sm"
                                >
                                  Xem chi tiết
                                </button>

                                {/* Khóa hủy đơn: Khách chỉ được hủy đơn khi đang ở trạng thái Chờ duyệt. Khi đã xuất hóa đơn hoặc gửi lịch hẹn thì không hủy được */}
                                {order.trangThai === 'ChoDuyet' && (
                                  <button
                                    type="button"
                                    onClick={() => setOrderToCancel(order)}
                                    className="px-3 py-1.5 rounded-xl font-bold bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 transition cursor-pointer"
                                    title="Chỉ được hủy đơn khi đang ở trạng thái Chờ duyệt"
                                  >
                                    ✕ Hủy đơn
                                  </button>
                                )}

                                {isCompleted && isXe && (() => {
                                  const vName = order.thongTinXe?.tenXe || 'Xe máy chính hãng';
                                  const matchedV = showroomVehicles.find(v => v.tenXe.toLowerCase().includes(vName.toLowerCase()) || vName.toLowerCase().includes(v.tenXe.toLowerCase()));
                                  const vId = matchedV?.id || (order.thongTinXe as any)?.vehicleId || 'XM-HD01';
                                  const existingXeReview = myCustomerFeedbacks.find(f =>
                                    (f.orderId && f.orderId === order.id) ||
                                    (f.productId && f.productId === vId && f.orderId === order.id) ||
                                    (f.productName && f.productName.toLowerCase().trim() === vName.toLowerCase().trim() && (f.orderId === order.id || !f.orderId))
                                  );

                                  if (existingXeReview) {
                                    return (
                                      <div className="flex items-center gap-1.5">
                                        <span className="px-3 py-1.5 rounded-xl font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs flex items-center gap-1 shadow font-mono">
                                          <span>✓</span> <span>Đã đánh giá ({existingXeReview.diemDanhGia}⭐)</span>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReviewModalPart({
                                              partName: vName,
                                              orderId: order.id,
                                              productId: vId,
                                              productType: 'XeMau',
                                              fromTab: 1,
                                            });
                                            setReviewStars(existingXeReview.diemDanhGia);
                                            setReviewContent(existingXeReview.noiDung);
                                            setReviewImages(existingXeReview.hinhAnhDinhKem || []);
                                                                                      }}
                                          className="px-2.5 py-1.5 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition cursor-pointer border border-zinc-700"
                                        >
                                          ✏️ Sửa
                                        </button>
                                      </div>
                                    );
                                  }

                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReviewModalPart({
                                          partName: vName,
                                          orderId: order.id,
                                          productId: vId,
                                          productType: 'XeMau',
                                          fromTab: 1,
                                        });
                                        setReviewStars(5);
                                        setReviewContent('');
                                        setReviewImages([]);
                                                                              }}
                                      className="px-3 py-1.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer flex items-center gap-1 shadow"
                                    >
                                      <span>⭐ Đánh giá xe</span>
                                    </button>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* ── TAB 2: LỊCH HẸN (XEM LỊCH TỔNG & TỪNG DỊCH VỤ) ── */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 2 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                      LỊCH HẸN DỊCH VỤ
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Theo dõi lịch bảo dưỡng, sửa chữa, lái thử và lịch nhận xe
                    </p>
                  </div>

                  {/* 5 Sub-tabs: Tổng & từng loại */}
                  <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#141416] border border-zinc-800 overflow-x-auto self-start sm:self-auto">
                    {[
                      { key: 'Tong', label: '📅 Xem lịch tổng' },
                      { key: 'NhanXe', label: '🎁 Nhận xe mới' },
                      { key: 'SuaChua', label: '🟠 Sửa chữa' },
                      { key: 'BaoDuong', label: '🔵 Bảo dưỡng' },
                      { key: 'LaiThu', label: '🟢 Lái thử' },
                      { key: 'BaoHanh', label: '🔴 Bảo hành' },
                    ].map(st => (
                      <button
                        key={st.key}
                        onClick={() => setApptsSubTab(st.key as any)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase transition whitespace-nowrap cursor-pointer ${
                          apptsSubTab === st.key ? 'bg-red-700 text-white shadow' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main View: Lịch tổng vs Từng dịch vụ */}
                {apptsSubTab === 'Tong' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar visual (Left 2 cols) - Chuẩn Ảnh 2 LH11 */}
                    <div className="lg:col-span-2 p-6 rounded-3xl bg-[#141416] border border-zinc-800 space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                        <div className="font-extrabold text-sm sm:text-base text-white uppercase tracking-tight">THÁNG 10 / 2026</div>
                        <div className="text-xs text-zinc-400 font-mono">Showroom Motoshop</div>
                      </div>

                      <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                          <div key={d} className="font-bold text-red-500 py-1">{d}</div>
                        ))}
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                          // LH06 & LH11: Loại trừ lịch hủy/từ chối, hiển thị rõ ràng từng loại lịch
                          const dayAppts = myAppts.filter(a => {
                            // LH12: Calendar chỉ hiển thị các lịch hẹn Đã xác nhận (DaXacNhan)
                            if (a.trangThai !== 'DaXacNhan') return false;
                            const dNum = parseInt((a.ngayHen || '').split('-')[2] || '0', 10);
                            return dNum === day;
                          });
                          const hasAppt = dayAppts.length > 0;
                          const isSelected = selectedCalendarDay === day;

                          return (
                            <div
                              key={day}
                              onClick={() => setSelectedCalendarDay(isSelected ? null : day)}
                              className={`p-2 rounded-2xl border text-xs font-bold transition flex flex-col justify-start min-h-[74px] sm:min-h-[82px] relative cursor-pointer select-none ${
                                isSelected
                                  ? 'bg-red-950/60 border-red-500 ring-2 ring-red-500/40 text-white shadow-md'
                                  : hasAppt
                                  ? 'bg-[#1e1416] border-red-600/90 hover:border-red-500 text-white shadow-xs'
                                  : 'bg-[#18181b] border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={hasAppt ? 'text-white font-extrabold text-xs' : 'text-zinc-400 text-xs'}>{day}</span>
                                {hasAppt && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                )}
                              </div>

                              {/* LH11: Hiển thị badge các loại lịch đã đặt trong ngày */}
                              {hasAppt && (
                                <div className="w-full space-y-1 mt-1.5 overflow-hidden">
                                  {dayAppts.map(appt => {
                                    let badgeClass = 'bg-red-950/80 border-red-600/70 text-red-300';
                                    let shortLabel = 'Lái thử';
                                    if (appt.loaiDichVu === 'BaoDuong') {
                                      badgeClass = 'bg-amber-950/80 border-amber-600/70 text-amber-300';
                                      shortLabel = 'Bảo dưỡng';
                                    } else if (appt.loaiDichVu === 'SuaChua') {
                                      badgeClass = 'bg-blue-950/80 border-blue-600/70 text-blue-300';
                                      shortLabel = 'Sửa chữa';
                                    } else if (appt.loaiDichVu === 'BaoHanh') {
                                      badgeClass = 'bg-rose-950/80 border-rose-600/70 text-rose-300';
                                      shortLabel = 'Bảo hành';
                                    } else if (appt.loaiDichVu === 'NhanXe') {
                                      badgeClass = 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300';
                                      shortLabel = 'Nhận xe';
                                    }

                                    return (
                                      <div
                                        key={appt.id}
                                        title={`${shortLabel} lúc ${appt.gioHen || '08:30'} - ${appt.tenXe || ''}`}
                                        className={`text-[9px] sm:text-[10px] font-mono px-1 py-0.5 rounded border truncate text-center leading-tight shadow-2xs ${badgeClass}`}
                                      >
                                        {shortLabel} - {appt.gioHen || '08:30'}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[11px] text-zinc-500 italic pt-2">
                        * Lịch chỉ hiển thị các yêu cầu đã được xác nhận (Không bị từ chối)
                      </div>
                    </div>

                    {/* Right summary column - DANH SÁCH LỊCH HẸN Chuẩn Ảnh 2 */}
                    <div className="p-6 rounded-3xl bg-[#141416] border border-zinc-800 space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                        <div className="font-extrabold text-sm sm:text-base text-red-500 uppercase tracking-wide">
                          DANH SÁCH LỊCH HẸN
                        </div>
                        {selectedCalendarDay !== null && (
                          <button
                            type="button"
                            onClick={() => setSelectedCalendarDay(null)}
                            className="text-[11px] font-mono text-zinc-400 hover:text-white underline cursor-pointer"
                          >
                            Xem tất cả ({myAppts.filter(a => a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi' && a.trangThai !== 'DaHoanThanh' && a.trangThai !== 'HoanThanh').length})
                          </button>
                        )}
                      </div>

                      {(() => {
                        const validAppts = myAppts.filter(a => a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi' && a.trangThai !== 'DaHoanThanh' && a.trangThai !== 'HoanThanh');
                        const displayedAppts = selectedCalendarDay !== null
                          ? validAppts.filter(a => parseInt((a.ngayHen || '').split('-')[2] || '0', 10) === selectedCalendarDay)
                          : validAppts;

                        if (displayedAppts.length === 0) {
                          return (
                            <div className="text-center py-10 text-zinc-500 text-xs space-y-2">
                              <span className="text-2xl block">📅</span>
                              <div>
                                {selectedCalendarDay !== null
                                  ? `Không có lịch hẹn vào ngày ${selectedCalendarDay}/10/2026.`
                                  : 'Chưa có lịch hẹn nào được ghi nhận.'}
                              </div>
                              {selectedCalendarDay !== null && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedCalendarDay(null)}
                                  className="text-xs text-red-400 hover:underline font-bold mt-2"
                                >
                                  ← Hiển thị toàn bộ lịch hẹn
                                </button>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
                            {displayedAppts.map(a => {
                              const isLaiThu = a.loaiDichVu === 'LaiThu';
                              const isBaoDuong = a.loaiDichVu === 'BaoDuong';
                              const isSuaChua = a.loaiDichVu === 'SuaChua';

                              let title = 'LỊCH HẸN DỊCH VỤ';
                              if (isLaiThu) title = 'LÁI THỬ XE';
                              else if (isBaoDuong) title = 'BẢO DƯỠNG XE';
                              else if (isSuaChua) title = 'SỬA CHỮA';
                              else if (a.loaiDichVu === 'BaoHanh') title = 'BẢO HÀNH XE';
                              else if (a.loaiDichVu === 'NhanXe') title = 'BÀN GIAO NHẬN XE MỚI';

                              const apptTime = new Date(`${a.ngayHen}T${a.gioHen || '08:00'}:00`).getTime();
                              const hoursLeft = (apptTime - Date.now()) / (1000 * 60 * 60);
                              const canCancel = (a.trangThai === 'ChoXacNhan' || a.trangThai === 'DaXacNhan') && hoursLeft >= 48;

                              return (
                                <div key={a.id} className="p-4 rounded-2xl bg-[#18181b] border border-zinc-800 text-xs space-y-2.5 shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="font-black text-red-500 text-sm tracking-wide uppercase">
                                      {title}
                                    </span>
                                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                      #{a.id}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-zinc-200 font-mono text-xs">
                                    <span>🗓</span>
                                    <span>{a.ngayHen} lúc {a.gioHen || '08:30'}</span>
                                  </div>

                                  <div className="text-zinc-300">
                                    <span className="text-zinc-400">Xe: </span>
                                    <span className="font-semibold text-white">{a.tenXe || 'Xe máy'}</span>
                                    {a.bienSo && a.bienSo !== 'XE-LÁI-THỬ' && <span className="text-zinc-400 font-mono"> ({a.bienSo})</span>}
                                  </div>

                                  <div className="flex items-center gap-2 pt-0.5">
                                    <span className="text-zinc-400">Trạng thái: </span>
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${
                                      a.trangThai === 'TuChoi'
                                        ? 'bg-rose-950/80 text-rose-400 border-rose-500/40'
                                        : a.trangThai === 'DaHuy'
                                        ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                        : a.trangThai === 'DaXacNhan'
                                        ? 'bg-blue-950/80 text-blue-400 border-blue-500/40'
                                        : a.trangThai === 'DaHoanThanh'
                                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                                        : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                                    }`}>
                                      {a.trangThai === 'DaXacNhan' ? 'Đã xác nhận' : a.trangThai === 'ChoXacNhan' ? 'Chờ xác nhận' : a.trangThai === 'TuChoi' ? 'Bị từ chối' : a.trangThai === 'DaHuy' ? 'Đã hủy' : a.trangThai === 'DaHoanThanh' ? 'Đã hoàn thành' : a.trangThai}
                                    </span>
                                  </div>

                                  {/* LH25: Hiển thị lý do từ chối nếu có */}
                                  {a.trangThai === 'TuChoi' && (
                                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 mt-1">
                                      <div className="font-bold flex items-center gap-1.5 text-rose-400">
                                        <span>⚠️</span> Lý do từ chối:
                                      </div>
                                      <div className="mt-0.5 text-rose-200/90 pl-5 font-medium">
                                        {a.lyDoTuChoi || 'Cửa hàng không thể tiếp nhận trong khung giờ này hoặc dịch vụ tạm ngưng.'}
                                      </div>
                                    </div>
                                  )}

                                  {/* Buttons row: [👁 Xem chi tiết] [📞 Liên hệ] [🗑 Hủy lịch] */}
                                  <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedApptDetail(a)}
                                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer flex items-center gap-1.5 border border-zinc-700"
                                    >
                                      <span>👁</span> Xem chi tiết
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setContactModalAppt(a)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5 ${
                                        isLaiThu ? 'bg-red-700 hover:bg-red-800' : 'bg-cyan-800 hover:bg-cyan-700'
                                      }`}
                                    >
                                      <span>📞</span> Liên hệ
                                    </button>

                                    {a.trangThai !== 'DaHuy' && a.trangThai !== 'TuChoi' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!canCancel) {
                                            alert('Chỉ được tự hủy lịch trước giờ hẹn ít nhất 48 tiếng. Vui lòng liên hệ Hotline 1900 6868 để được nhân viên hỗ trợ trực tiếp.');
                                            return;
                                          }
                                          setCancelConfirmAppt(a);
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                          canCancel
                                            ? 'bg-red-700 hover:bg-red-800 text-white'
                                            : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-400 border border-zinc-700'
                                        }`}
                                        title={!canCancel ? 'Chỉ được tự hủy lịch trước ít nhất 48 tiếng' : 'Hủy lịch hẹn'}
                                      >
                                        <span>🗑</span> Hủy lịch
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const filtered = myAppts.filter(a => {
                        // Loại trừ các lịch đã hoàn tất hoặc đã hủy/từ chối khỏi Tab 2 Lịch hẹn
                        if (a.trangThai === 'DaHoanThanh' || a.trangThai === 'HoanThanh' || a.trangThai === 'DaHuy' || a.trangThai === 'TuChoi') return false;
                        if (apptsSubTab === 'NhanXe' && a.loaiDichVu !== 'NhanXe') return false;
                        if (apptsSubTab === 'SuaChua' && a.loaiDichVu !== 'SuaChua') return false;
                        if (apptsSubTab === 'BaoDuong' && a.loaiDichVu !== 'BaoDuong') return false;
                        if (apptsSubTab === 'LaiThu' && a.loaiDichVu !== 'LaiThu') return false;
                        if (apptsSubTab === 'BaoHanh' && a.loaiDichVu !== 'BaoHanh') return false;
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="p-12 text-center rounded-3xl bg-[#141416] border border-zinc-800 text-zinc-400">
                            <div className="text-4xl mb-3">📅</div>
                            <h3 className="font-bold text-white text-base mb-1">Chưa có lịch hẹn cho dịch vụ này</h3>
                            <p className="text-xs text-zinc-500">Bạn có thể đặt lịch hẹn mới tại showroom bất kỳ lúc nào.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {filtered.map(appt => {
                            const cfg = apptStatusConfig[appt.trangThai] || { label: appt.trangThai, color: '#71717a', bg: '#27272a' };
                            const apptTime = new Date(`${appt.ngayHen}T${appt.gioHen || '08:00'}:00`).getTime();
                            const hoursLeft = (apptTime - Date.now()) / (1000 * 60 * 60);
                            const canCancel = (appt.trangThai === 'ChoXacNhan' || appt.trangThai === 'DaXacNhan') && hoursLeft >= 48;

                            return (
                              <div key={appt.id} className="p-5 rounded-3xl bg-[#141416] border border-zinc-800 space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-white text-sm uppercase">{SVC_LABELS[appt.loaiDichVu] || appt.loaiDichVu}</span>
                                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">#{appt.id}</span>
                                  </div>
                                  <StatusBadge {...cfg} />
                                </div>
                                <div className="text-xs text-zinc-300 font-mono">
                                  📅 Thời gian: <strong className="text-white">{appt.ngayHen}</strong> lúc <strong className="text-red-400">{appt.gioHen}</strong>
                                </div>
                                {appt.tenXe && (
                                  <div className="text-xs text-zinc-400">
                                    🏍️ Phương tiện: <strong className="text-zinc-200">{appt.tenXe}</strong> (Biển số: {appt.bienSo || 'Chưa có'})
                                  </div>
                                )}
                                {appt.ghiChu && (
                                  <div className="p-2.5 rounded-xl bg-[#18181b] text-xs text-zinc-400 border border-zinc-800">
                                    💬 {appt.ghiChu}
                                  </div>
                                )}
                                {/* LH25: Hiển thị lý do từ chối trên thẻ lịch hẹn */}
                                {appt.trangThai === 'TuChoi' && (
                                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200">
                                    <div className="font-bold flex items-center gap-1.5 text-rose-400">
                                      <span>⚠️</span> Lý do từ chối:
                                    </div>
                                    <div className="mt-0.5 text-rose-200/90 pl-5 font-medium">
                                      {appt.lyDoTuChoi || 'Cửa hàng không thể tiếp nhận trong khung giờ này hoặc dịch vụ tạm ngưng.'}
                                    </div>
                                  </div>
                                )}
                                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between flex-wrap gap-2">
                                  <div className="text-[11px] text-zinc-500 font-mono">
                                    KTV: <span className="text-zinc-300">{appt.nhanVienPhuTrach || 'Đang điều phối'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setContactModalAppt(appt)}
                                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-300 hover:text-white hover:bg-cyan-950/60 border border-cyan-800/60 transition cursor-pointer flex items-center gap-1"
                                    >
                                      <span>📞</span> Liên hệ
                                    </button>
                                    {canCancel && (
                                      <button
                                        type="button"
                                        onClick={() => setCancelConfirmAppt(appt)}
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:text-white hover:bg-red-950/60 border border-red-900/60 transition cursor-pointer flex items-center gap-1"
                                      >
                                        <span>✕</span> Hủy lịch
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedApptDetail(appt)}
                                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer flex items-center gap-1.5"
                                    >
                                      <span>🔍</span> Xem chi tiết
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* ── TAB 3: LỊCH SỬ DỊCH VỤ (TUYỆT ĐỐI BỎ ĐÁNH GIÁ) ── */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 3 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                      LỊCH SỬ DỊCH VỤ
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Tra cứu hồ sơ bảo dưỡng, sửa chữa và biên bản bàn giao xe
                    </p>
                  </div>

                  {/* 5 Sub-tabs */}
                  <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#141416] border border-zinc-800 overflow-x-auto self-start sm:self-auto">
                    {[
                      { key: 'TatCa', label: '📋 Tất cả' },
                      { key: 'BaoDuong', label: '⚙️ Bảo dưỡng' },
                      { key: 'SuaChua', label: '🛠️ Sửa chữa' },
                      { key: 'LaiThu', label: '🏍️ Lái thử' },
                      { key: 'BaoHanh', label: '🛡️ Bảo hành' },
                      { key: 'NhanXe', label: '🎁 Nhận xe mới' },
                    ].map(st => (
                      <button
                        key={st.key}
                        onClick={() => setServiceHistSubTab(st.key as any)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase transition whitespace-nowrap cursor-pointer ${
                          serviceHistSubTab === st.key ? 'bg-red-700 text-white shadow' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter / Search input */}
                <div className="p-4 rounded-2xl bg-[#141416] border border-zinc-800">
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm theo biển số, dòng xe, mã phiếu..."
                    value={serviceSearch}
                    onChange={e => setServiceSearch(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#121214] border border-zinc-700 text-white text-xs focus:outline-none focus:border-red-600"
                  />
                </div>

                {/* Completed Services list */}
                {(() => {
                  const baseCompleted = myAppts.filter(a => a.trangThai === 'DaHoanThanh' || a.trangThai === 'HoanThanh');
                  const completedAppts = [...baseCompleted];

                  // Đồng bộ thêm các hồ sơ bảo hành đã hoàn tất từ Admin Claims (nếu chưa có trong list)
                  try {
                    const adminClaims = warrantyApi.getAdminClaims();
                    const myCompletedClaims = adminClaims.filter(c => {
                      if (c.trangThai !== 'HoanThanh') return false;
                      if (!currentCustomer) return false;
                      if (c.customerId && c.customerId === currentCustomer.id) return true;
                      const custNum = parseInt(currentCustomer.id.replace(/\D/g, ''), 10);
                      const cNum = c.customerId ? parseInt(c.customerId.replace(/\D/g, ''), 10) : NaN;
                      if (!isNaN(custNum) && !isNaN(cNum) && custNum === cNum) return true;
                      const custPhone = currentCustomer.soDienThoai ? currentCustomer.soDienThoai.replace(/\D/g, '') : '';
                      const cPhone = c.soDienThoai ? c.soDienThoai.replace(/\D/g, '') : '';
                      if (custPhone && cPhone && custPhone === cPhone) return true;
                      return false;
                    });

                    myCompletedClaims.forEach(claim => {
                      const alreadyInList = completedAppts.some(a => 
                        a.id === claim.id || 
                        a.id === claim.maLichHen || 
                        (claim.maLichHen && a.maLichHen === claim.maLichHen)
                      );
                      if (!alreadyInList) {
                        completedAppts.unshift({
                          id: claim.maLichHen || claim.id,
                          customerId: currentCustomer.id,
                          hoTenKH: claim.khachHang || currentCustomer.hoTen,
                          soDienThoai: claim.soDienThoai || currentCustomer.soDienThoai,
                          loaiDichVu: 'BaoHanh',
                          ngayHen: claim.ngayHen || claim.ngayGui || new Date().toISOString().split('T')[0],
                          gioHen: claim.gioHen || '09:00',
                          trangThai: 'DaHoanThanh',
                          ghiChu: claim.noiDung || claim.b2_chiTietLoi || 'Bảo hành sửa chữa xe',
                          tenXe: claim.xeBienSo?.split('-')[0]?.trim() || 'Xe máy',
                          bienSo: claim.b1_bienSoThucTe || claim.xeBienSo?.split('-')[1]?.trim() || '29F1-234.56',
                          nhanVienPhuTrach: claim.nhanVienPhuTrach || claim.b3_ktvPhuTrach || 'Nguyễn Văn Hùng',
                          createdDate: claim.ngayGui,
                          maLichHen: claim.maLichHen,
                        });
                      }
                    });
                  } catch {}

                  const filtered = completedAppts.filter(a => {
                    if (serviceHistSubTab === 'BaoDuong' && a.loaiDichVu !== 'BaoDuong') return false;
                    if (serviceHistSubTab === 'SuaChua' && a.loaiDichVu !== 'SuaChua') return false;
                    if (serviceHistSubTab === 'LaiThu' && a.loaiDichVu !== 'LaiThu') return false;
                    if (serviceHistSubTab === 'BaoHanh' && a.loaiDichVu !== 'BaoHanh') return false;
                    if (serviceHistSubTab === 'NhanXe' && a.loaiDichVu !== 'NhanXe') return false;
                    if (serviceSearch.trim()) {
                      const matchPlate = matchVietnameseSearch(a.bienSo || '', serviceSearch);
                      const matchName = matchVietnameseSearch(a.tenXe || '', serviceSearch);
                      const matchId = matchVietnameseSearch(a.id || '', serviceSearch);
                      if (!matchPlate && !matchName && !matchId) return false;
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-12 text-center rounded-3xl bg-[#141416] border border-zinc-800 text-zinc-400">
                        <div className="text-4xl mb-3">🕒</div>
                        <h3 className="font-bold text-white text-base mb-1">Chưa có lịch sử dịch vụ hoàn thành nào</h3>
                        <p className="text-xs text-zinc-500">Các lượt dịch vụ đã hoàn tất tại showroom sẽ hiển thị chi tiết tại đây.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {filtered.map(item => (
                        <div key={item.id} className="p-5 rounded-3xl bg-[#141416] border border-zinc-800 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-zinc-800">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-red-400 uppercase font-mono">#{item.id}</span>
                              <span className="font-extrabold text-white text-sm uppercase">{SVC_LABELS[item.loaiDichVu] || item.loaiDichVu}</span>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                              ✓ ĐÃ HOÀN THÀNH
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-300 font-mono">
                            <div>📅 Ngày: <strong className="text-white">{item.ngayHen}</strong></div>
                            <div>🏍️ Xe: <strong className="text-white">{item.tenXe || 'Xe máy'}</strong> ({item.bienSo})</div>
                            <div>👨‍🔧 KTV: <strong className="text-zinc-200">{item.nhanVienPhuTrach || 'KTV Xưởng dịch vụ'}</strong></div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                            <span className="text-zinc-400">Cơ sở: Showroom Chính Motoshop</span>
                            <div className="flex items-center gap-2">
                              {/* LSLH01: Mở modal chi tiết lịch hẹn */}
                              <button
                                type="button"
                                onClick={() => setSelectedApptDetail(item)}
                                className="px-3 py-1.5 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer flex items-center gap-1"
                              >
                                <span>👁️</span> Chi tiết
                              </button>
                              {/* LSLH02: Mở modal xem và in hóa đơn dịch vụ */}
                              <button
                                type="button"
                                onClick={() => setSelectedServiceInvoice(item)}
                                className="px-3 py-1.5 rounded-xl font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 transition cursor-pointer flex items-center gap-1"
                              >
                                <span>📄</span> Xem hóa đơn / Biên bản
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* ── TAB 4: BẢO HIỂM (QUẢN LÝ THEO TỪNG XE & ONLINE BUY) ── */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 4 && (
              isBuyingOnlineInsurance ? (
                <OnlineInsurancePurchaseView
                  customer={currentCustomer}
                  vehicles={myVehicles}
                  initialVehicle={buyingInsuranceInitialVehicle}
                  onAddNewVehicle={() => setShowAddVehicleModal(true)}
                  onCancel={() => setIsBuyingOnlineInsurance(false)}
                  onSuccess={(newContract) => {
                    setIsBuyingOnlineInsurance(false);
                    setRenewToast(`Đăng ký bảo hiểm ${newContract.tenGoi} thành công! Số GCN: ${newContract.soGCN}`);
                    setTimeout(() => setRenewToast(null), 6000);
                    // BH05: Đồng bộ ngay thông tin và chi tiêu khách hàng mới nhất
                    try {
                      const curRaw = localStorage.getItem('crm_current_customer');
                      if (curRaw) {
                        const cur = JSON.parse(curRaw);
                        onCustomerChange?.(cur);
                      }
                    } catch {}
                    loadCustomerData();
                  }}
                />
              ) : (
                <div className="space-y-6">
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                        QUẢN LÝ BẢO HIỂM THEO TỪNG XE
                      </h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Theo dõi hợp đồng, tái tục bảo hiểm và xuất trình Giấy chứng nhận điện tử
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        // BH09: Chặn nếu tài khoản bị khóa
                        if (currentCustomer?.trangThai === 'BiKhoa') {
                          alert('⚠️ TÀI KHOẢN BỊ KHÓA: Tài khoản của quý khách đang bị tạm khóa bởi Quản trị viên. Quý khách không thể đăng ký mua bảo hiểm mới!');
                          return;
                        }
                        if (myVehicles.length === 0) {
                          alert('⚠️ YÊU CẦU: Bạn phải có ít nhất 1 phương tiện liên kết với tài khoản để mua bảo hiểm! Vui lòng đăng ký phương tiện của bạn trước.');
                          setShowAddVehicleModal(true);
                          return;
                        }
                        setBuyingInsuranceInitialVehicle(null);
                        setIsBuyingOnlineInsurance(true);
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow transition cursor-pointer uppercase tracking-wider shrink-0"
                    >
                      + ĐĂNG KÝ BẢO HIỂM MỚI
                    </button>
                  </div>

                  {/* Toast gia hạn */}
                  {renewToast && (
                    <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 flex items-center justify-between text-xs font-semibold animate-in fade-in">
                      <span>🎉 {renewToast}</span>
                      <button onClick={() => setRenewToast(null)} className="text-emerald-400 font-bold">✕</button>
                    </div>
                  )}

                  {/* Grouped by Owned Vehicles (Chuẩn Ảnh 7) */}
                  {(() => {
                    const unlinkedInsurances = myInsurances.filter(
                      ins => !myVehicles.some(veh => veh.id === ins.vehicleId || findMatchingInsurance(veh, myInsurances)?.id === ins.id)
                    );

                    if (myVehicles.length === 0 && unlinkedInsurances.length === 0) {
                      return (
                        <div className="p-12 text-center rounded-3xl bg-[#141416] border border-zinc-800 text-zinc-400">
                          <div className="text-4xl mb-3">🛡️</div>
                          <h3 className="font-bold text-white text-base mb-1">Chưa có phương tiện nào để cấp bảo hiểm</h3>
                          <p className="text-xs text-zinc-500 mb-4">Vui lòng đăng ký phương tiện của bạn trước khi mua bảo hiểm.</p>
                          <button
                            onClick={() => setShowAddVehicleModal(true)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 cursor-pointer"
                          >
                            + Thêm phương tiện mới
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        {/* 1. Các phương tiện trong hồ sơ */}
                        {myVehicles.map(veh => {
                          const vehInsurances = myInsurances.filter(
                            ins => ins.vehicleId === veh.id || findMatchingInsurance(veh, myInsurances)?.id === ins.id
                          );

                          return (
                            <div
                              key={veh.id}
                              className="p-6 rounded-3xl bg-[#141416] border border-zinc-800 space-y-4"
                            >
                              {/* Vehicle Header & Buy button */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-12 rounded-xl overflow-hidden bg-zinc-900 shrink-0">
                                    <img
                                      src={getVehicleDisplayImage(veh)}
                                      alt={veh.tenXe}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h3 className="font-extrabold text-base text-white uppercase">{veh.tenXe}</h3>
                                    <div className="text-xs font-mono text-red-400 font-bold">Biển số: {veh.bienSo || 'Chưa có'}</div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    // BH09: Chặn nếu tài khoản bị khóa
                                    if (currentCustomer?.trangThai === 'BiKhoa') {
                                      alert('⚠️ TÀI KHOẢN BỊ KHÓA: Tài khoản của quý khách đang bị tạm khóa bởi Quản trị viên. Quý khách không thể thực hiện mua bảo hiểm!');
                                      return;
                                    }
                                    setBuyingInsuranceInitialVehicle(veh);
                                    setIsBuyingOnlineInsurance(true);
                                  }}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                                >
                                  <span>+ MUA BẢO HIỂM CHO XE NÀY</span>
                                </button>
                              </div>

                              {/* Contracts list under vehicle */}
                              {vehInsurances.length === 0 ? (
                                <div className="p-4 rounded-2xl bg-[#18181b] border border-zinc-800 text-xs text-zinc-500 text-center">
                                  Phương tiện này hiện chưa có hợp đồng bảo hiểm nào.
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {vehInsurances.map(c => {
                                    const cfg = insStatusConfig[c.trangThai] || { label: c.trangThai, color: '#71717a', bg: '#27272a' };
                                    const isStillValid = c.trangThai === 'HieuLuc' && c.ngayKetThuc >= new Date().toISOString().split('T')[0];
                                    return (
                                      <div
                                        key={c.id}
                                        className="p-4 rounded-2xl bg-[#18181b] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                      >
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-sm text-white">{c.tenGoi}</span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold">
                                              #{c.id}
                                            </span>
                                            <StatusBadge {...cfg} />
                                          </div>
                                          <div className="text-xs text-zinc-400 font-mono">
                                            Số GCN: <strong className="text-zinc-200">{c.soGCN}</strong> · Đơn vị: {c.nhaBaoHiem}
                                          </div>
                                          <div className="text-xs text-zinc-400 font-mono">
                                            Thời hạn: {c.ngayBatDau} ➔ {c.ngayKetThuc} ({c.thoiHanNam} năm)
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                          <button
                                            type="button"
                                            onClick={() => setViewingInsuranceContract(c)}
                                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
                                          >
                                            📄 Xem & In GCN
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenRenewInsuranceModal(c)}
                                            title={isStillValid ? 'Hợp đồng đang còn hiệu lực' : 'Gia hạn bảo hiểm'}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                              isStillValid
                                                ? 'bg-zinc-800/80 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                                                : 'bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800'
                                            }`}
                                          >
                                            🔄 Gia hạn ngay
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* 2. BH07: Các hợp đồng bảo hiểm đăng ký tại quầy POS */}
                        {unlinkedInsurances.length > 0 && (
                          <div className="p-6 rounded-3xl bg-[#141416] border border-amber-600/30 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                              <div>
                                <h3 className="font-extrabold text-base text-amber-400 flex items-center gap-2">
                                  <span>🏪</span> BẢO HIỂM ĐĂNG KÝ TẠI QUẦY (POS)
                                </h3>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  Các hợp đồng bảo hiểm đã cấp tại đại lý cho phương tiện của bạn
                                </p>
                              </div>
                              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                                {unlinkedInsurances.length} hợp đồng
                              </span>
                            </div>

                            <div className="space-y-3">
                              {unlinkedInsurances.map(c => {
                                const cfg = insStatusConfig[c.trangThai] || { label: c.trangThai, color: '#71717a', bg: '#27272a' };
                                return (
                                  <div
                                    key={c.id}
                                    className="p-4 rounded-2xl bg-[#18181b] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-sm text-white">{c.tenGoi}</span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold">
                                          #{c.id}
                                        </span>
                                        <StatusBadge {...cfg} />
                                      </div>
                                      <div className="text-xs text-zinc-300">
                                        🏍️ Xe: <strong className="text-white">{c.tenXe}</strong> (Biển số: <strong className="text-red-400 font-mono">{c.bienSo}</strong>)
                                      </div>
                                      <div className="text-xs text-zinc-400 font-mono">
                                        Số GCN: <strong className="text-zinc-200">{c.soGCN}</strong> · Thời hạn: {c.ngayBatDau} ➔ {c.ngayKetThuc}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                      <button
                                        type="button"
                                        onClick={() => setViewingInsuranceContract(c)}
                                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
                                      >
                                        📄 Xem & In GCN
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRenewInsuranceModal(c)}
                                        title={c.trangThai === 'HieuLuc' && c.ngayKetThuc >= new Date().toISOString().split('T')[0] ? 'Hợp đồng đang còn hiệu lực' : 'Gia hạn bảo hiểm'}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                          c.trangThai === 'HieuLuc' && c.ngayKetThuc >= new Date().toISOString().split('T')[0]
                                            ? 'bg-zinc-800/80 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                                            : 'bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800'
                                        }`}
                                      >
                                        🔄 Gia hạn ngay
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* ── TAB 5: KHẢO SÁT & ĐÁNH GIÁ (CHUẨN 3 SUB-TABS ẢNH 8) ── */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 5 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                      KHẢO SÁT & ĐÁNH GIÁ
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Góp ý chất lượng dịch vụ và tham gia các cuộc khảo sát ý kiến
                    </p>
                  </div>

                  {/* 3 Sub-tabs */}
                  <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#141416] border border-zinc-800 overflow-x-auto self-start sm:self-auto">
                    {[
                      { key: 'ChoDanhGia', label: '✍️ Chờ đánh giá xe & phụ tùng' },
                      { key: 'DaDanhGia', label: '☑️ Đã đánh giá' },
                      { key: 'KhaoSatHeThong', label: '📋 Khảo sát dịch vụ bảo dưỡng' },
                    ].map(st => (
                      <button
                        key={st.key}
                        onClick={() => setSurveySubTab(st.key as any)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase transition whitespace-nowrap cursor-pointer ${
                          surveySubTab === st.key ? 'bg-red-700 text-white shadow' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-tab 1: Chờ đánh giá (Chỉ đơn hàng mua trên Website) */}
                {surveySubTab === 'ChoDanhGia' && (() => {
                  const waitingReviews: Array<{
                    id: string;
                    orderId: string;
                    badge: string;
                    badgeColor: string;
                    title: string;
                    subTitle: string;
                    type: 'PhuTung' | 'XeMau' | 'DichVu';
                    productId?: string;
                    image: string;
                  }> = [];

                  // Chỉ lấy những đơn hàng mua trên Website (loại bỏ đơn tạo tại quầy offline)
                  const isOnlineOrder = (o: any) => {
                    const kb = (o.kenhBan || (o as any).channel || '').toLowerCase();
                    if (kb === 'taiquay' || kb === 'cuahang' || kb === 'offline') return false;
                    return true;
                  };

                  // Đơn mua xe hoặc phụ tùng đã HOÀN THÀNH / ĐÃ GIAO (mua trên website)
                  myOrders
                    .filter(o => isOnlineOrder(o) && (o.trangThai === 'HoanThanh' || o.trangThai === 'DaGiao' || (o as any).trangThaiDonHang === 'HoanThanh'))
                    .forEach(o => {
                      if (o.thongTinXe) {
                        const name = o.thongTinXe.tenXe || 'Mẫu xe mới';
                        const already = myCustomerFeedbacks.some(f => 
                          (f.orderId && f.orderId === o.id) ||
                          (f.productId && (f.productId === o.id || f.productId === (o.thongTinXe as any)?.vehicleId || f.productId === (o.thongTinXe as any)?.maXe))
                        );
                        if (!already) {
                          const xeImg = o.thongTinXe.hinhAnh || (name.toLowerCase().includes('air') ? '/images/Xe/honda_air_blade_160_abs.jpg' : '/images/Xe/honda_sh_160i_abs_2024.jpg');
                          waitingReviews.push({
                            id: `order-xe-${o.id}`,
                            orderId: o.id,
                            badge: 'XE MÁY CHÍNH HÃNG',
                            badgeColor: 'text-purple-400',
                            title: name,
                            subTitle: `Đơn hàng #${o.id} · ${o.trangThai === 'HoanThanh' || o.trangThai === 'DaGiao' ? 'Giao nhận xe thành công' : 'Đã mua thành công'}`,
                            type: 'XeMau',
                            image: xeImg,
                          });
                        }
                      }
                      if (o.items && o.items.length > 0) {
                        o.items.forEach((it: any, idx: number) => {
                          const name = it.tenSanPham || it.tenPhuTung || `Phụ tùng #${idx + 1}`;
                          const partId = (it as any).id || (it as any).maPhuTung || undefined;
                          const already = myCustomerFeedbacks.some(f => 
                            (f.orderId && f.orderId === o.id && (f.productId === partId || !f.productId)) ||
                            (f.orderId && f.orderId === o.id && f.productName && f.productName.toLowerCase().trim() === name.toLowerCase().trim())
                          );
                          if (!already) {
                            const partImg = it.hinhAnh || (name.toLowerCase().includes('nhớt') ? 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500' : (name.toLowerCase().includes('phanh') ? 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500' : '/images/phutung/dan_ao_ab_125_den_nham.webp'));
                            waitingReviews.push({
                              id: `order-pt-${o.id}-${idx}`,
                              orderId: o.id,
                              badge: 'SẢN PHẨM PHỤ TÙNG',
                              badgeColor: 'text-blue-400',
                              title: name,
                              subTitle: `Đơn hàng #${o.id} · Đặt mua ngày ${o.ngayDat || 'gần đây'}`,
                              type: 'PhuTung',
                              productId: partId,
                              image: partImg,
                            });
                          }
                        });
                      }
                    });

                  const countWaitingXe = waitingReviews.filter(w => w.type === 'XeMau').length;
                  const countWaitingPt = waitingReviews.filter(w => w.type === 'PhuTung').length;

                  const displayedWaiting = waitingReviews.filter(w => {
                    if (waitingTypeFilter === 'XeMau') return w.type === 'XeMau';
                    if (waitingTypeFilter === 'PhuTung') return w.type === 'PhuTung';
                    return true;
                  });

                  if (waitingReviews.length === 0) {
                    return (
                      <div className="py-12 text-center rounded-3xl bg-[#141416] border border-zinc-800 text-zinc-500">
                        <div className="text-4xl mb-2">⭐</div>
                        <h4 className="text-sm font-bold text-zinc-300">Bạn chưa có đơn hàng nào chờ đánh giá</h4>
                        <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                          Chỉ những đơn hàng mua trên Website khi hoàn tất giao hàng thành công sẽ hiển thị tại đây để bạn gửi đánh giá.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* Phân chia 2 phần: Đánh giá Xe & Đánh giá Phụ Tùng */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setWaitingTypeFilter('All')}
                          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs border ${
                            waitingTypeFilter === 'All'
                              ? 'bg-red-700 text-white border-red-600 shadow-sm'
                              : 'bg-[#18181b] text-zinc-400 hover:text-white border-zinc-800'
                          }`}
                        >
                          Tất cả ({waitingReviews.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setWaitingTypeFilter('XeMau')}
                          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs border flex items-center gap-1.5 ${
                            waitingTypeFilter === 'XeMau'
                              ? 'bg-red-700 text-white border-red-600 shadow-sm'
                              : 'bg-[#18181b] text-zinc-400 hover:text-white border-zinc-800'
                          }`}
                        >
                          <span>🏍️</span> Đánh giá xe ({countWaitingXe})
                        </button>
                        <button
                          type="button"
                          onClick={() => setWaitingTypeFilter('PhuTung')}
                          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs border flex items-center gap-1.5 ${
                            waitingTypeFilter === 'PhuTung'
                              ? 'bg-red-700 text-white border-red-600 shadow-sm'
                              : 'bg-[#18181b] text-zinc-400 hover:text-white border-zinc-800'
                          }`}
                        >
                          <span>⚙️</span> Đánh giá phụ tùng ({countWaitingPt})
                        </button>
                      </div>

                      {displayedWaiting.length === 0 ? (
                        <div className="py-8 text-center rounded-2xl bg-[#141416] border border-zinc-800 text-zinc-500 text-xs">
                          Không có sản phẩm nào thuộc mục này chờ đánh giá.
                        </div>
                      ) : (
                        displayedWaiting.map(item => {
                          const isReviewHighlighted = highlightTarget?.type === 'review' && (
                            !highlightTarget.id ||
                            item.id === highlightTarget.id ||
                            item.orderId === highlightTarget.id ||
                            (highlightTarget.id && item.id.includes(highlightTarget.id))
                          );

                          return (
                            <div
                              key={item.id}
                              id={`waiting-review-${item.id}`}
                              className={`p-5 rounded-3xl bg-[#141416] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                                isReviewHighlighted
                                  ? 'ring-2 ring-amber-500 bg-amber-950/25 border-amber-500 shadow-lg shadow-amber-500/20 animate-pulse'
                                  : 'border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-14 h-14 rounded-2xl object-contain bg-zinc-900 border border-zinc-700/80 p-1 shrink-0 shadow-sm"
                                />
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] font-mono font-bold uppercase ${item.badgeColor}`}>
                                      {item.badge}
                                    </span>
                                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                      Đã mua trên website
                                    </span>
                                  </div>
                                  <h4 className="font-extrabold text-base text-white truncate">{item.title}</h4>
                                  <div className="text-xs text-zinc-400">{item.subTitle}</div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  let pId = item.productId || item.orderId;
                                  if (item.type === 'XeMau') {
                                    const matchedV = showroomVehicles.find(v => v.tenXe.toLowerCase().includes(item.title.toLowerCase()) || item.title.toLowerCase().includes(v.tenXe.toLowerCase()));
                                    if (matchedV) pId = matchedV.id;
                                  } else if (item.type === 'PhuTung') {
                                    const matchedP = mockParts.find(p => p.tenSanPham.toLowerCase().includes(item.title.toLowerCase()) || item.title.toLowerCase().includes(p.tenSanPham.toLowerCase()));
                                    if (matchedP) pId = matchedP.id;
                                  }
                                  setReviewModalPart({
                                    partName: item.title,
                                    orderId: item.orderId || '',
                                    productId: pId,
                                    productType: item.type,
                                  });
                                  setReviewStars(5);
                                  setReviewContent('');
                                  setReviewImages([]);
                                                                  }}
                                className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase transition cursor-pointer shadow shrink-0"
                              >
                                VIẾT ĐÁNH GIÁ (5★)
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })()}

                {/* Sub-tab 2: Đã đánh giá (Có hình ảnh, Phân loại Xe & Phụ tùng, và Phản hồi của Shop) */}
                {surveySubTab === 'DaDanhGia' && (() => {
                  if (myCustomerFeedbacks.length === 0) {
                    return (
                      <div className="py-12 text-center rounded-3xl bg-[#141416] border border-zinc-800 text-zinc-500">
                        <div className="text-4xl mb-2">📝</div>
                        <h4 className="text-sm font-bold text-zinc-300">Bạn chưa gửi đánh giá nào</h4>
                        <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                          Những đánh giá bạn gửi cho sản phẩm và dịch vụ đã mua trên website sẽ được lưu trữ và hiển thị tại đây.
                        </p>
                      </div>
                    );
                  }

                  const countDaXe = myCustomerFeedbacks.filter(f => f.productType === 'XeMau' || f.xeDangDung || f.productName?.toLowerCase().includes('honda') || f.productName?.toLowerCase().includes('sh') || f.productName?.toLowerCase().includes('xe')).length;
                  const countDaPt = myCustomerFeedbacks.filter(f => f.productType === 'PhuTung' || (!f.xeDangDung && !f.productType) || f.productName?.toLowerCase().includes('nhớt') || f.productName?.toLowerCase().includes('phụ')).length;

                  const filteredFeedbacks = myCustomerFeedbacks.filter(f => {
                    if (myReviewRatingFilter !== 'All' && (f.diemDanhGia || 5) !== myReviewRatingFilter) return false;
                    if (myReviewHasImageFilter && (!f.hinhAnhDinhKem || f.hinhAnhDinhKem.length === 0)) return false;
                    if (myReviewTypeFilter !== 'All') {
                      if (myReviewTypeFilter === 'PhuTung') {
                        const isPart = f.productType === 'PhuTung' || f.productId?.startsWith('PT') || f.productName?.toLowerCase().includes('nhớt') || f.productName?.toLowerCase().includes('lọc') || f.productName?.toLowerCase().includes('bugi') || f.productName?.toLowerCase().includes('phanh');
                        if (!isPart) return false;
                      } else if (myReviewTypeFilter === 'XeMau') {
                        const isVehicle = f.productType === 'XeMau' || f.productId?.startsWith('XM') || f.productId?.startsWith('V') || f.xeDangDung || f.productName?.toLowerCase().includes('honda') || f.productName?.toLowerCase().includes('yamaha') || f.productName?.toLowerCase().includes('sh') || f.productName?.toLowerCase().includes('vision') || f.productName?.toLowerCase().includes('air blade');
                        if (!isVehicle) return false;
                      } else if (myReviewTypeFilter === 'DichVu') {
                        const isService = f.loaiDanhGia === 'DichVu' || f.productType === 'DichVu';
                        if (!isService) return false;
                      }
                    }
                    return true;
                  });

                  return (
                    <div className="space-y-4">
                      {/* BỘ LỌC ĐÁNH GIÁ (Số sao 1-5, Có hình ảnh, Phân loại Xe & Phụ tùng) */}
                      <div className="p-4 rounded-2xl bg-[#141416] border border-zinc-800 space-y-3 shadow-md">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                          <span className="font-bold text-zinc-300 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                            <span>🔍</span> BỘ LỌC ĐÁNH GIÁ CỦA TÔI
                          </span>
                          {(myReviewRatingFilter !== 'All' || myReviewHasImageFilter || myReviewTypeFilter !== 'All') && (
                            <button
                              type="button"
                              onClick={() => {
                                setMyReviewRatingFilter('All');
                                setMyReviewHasImageFilter(false);
                                setMyReviewTypeFilter('All');
                              }}
                              className="text-[11px] text-red-400 hover:text-red-300 font-mono underline cursor-pointer"
                            >
                              ✕ Xóa tất cả bộ lọc
                            </button>
                          )}
                        </div>

                        {/* Hàng 1: Lọc theo Số sao (1 - 5 sao) */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                          <span className="text-[11px] text-zinc-500 font-mono shrink-0">Số sao:</span>
                          <button
                            type="button"
                            onClick={() => setMyReviewRatingFilter('All')}
                            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap text-xs border ${
                              myReviewRatingFilter === 'All'
                                ? 'bg-red-700 text-white border-red-600 shadow-sm'
                                : 'bg-[#18181b] text-zinc-400 hover:text-white border-zinc-800'
                            }`}
                          >
                            Tất cả ({myCustomerFeedbacks.length})
                          </button>
                          {[5, 4, 3, 2, 1].map(stars => {
                            const count = myCustomerFeedbacks.filter(f => (f.diemDanhGia || 5) === stars).length;
                            return (
                              <button
                                key={stars}
                                type="button"
                                onClick={() => setMyReviewRatingFilter(stars as any)}
                                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap text-xs flex items-center gap-1 border ${
                                  myReviewRatingFilter === stars
                                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-sm font-extrabold'
                                    : 'bg-[#18181b] text-zinc-400 hover:text-white border-zinc-800'
                                }`}
                              >
                                <span>{stars}★</span>
                                <span className="font-mono text-[11px]">({count})</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Hàng 2: Lọc Có hình ảnh & Loại sản phẩm (Đánh giá xe / Phụ tùng) */}
                        <div className="flex items-center gap-2 flex-wrap text-xs pt-2 border-t border-zinc-800/60">
                          <span className="text-[11px] text-zinc-500 font-mono shrink-0">Tiêu chí:</span>
                          <button
                            type="button"
                            onClick={() => setMyReviewHasImageFilter(!myReviewHasImageFilter)}
                            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs flex items-center gap-1.5 border ${
                              myReviewHasImageFilter
                                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                                : 'bg-[#18181b] text-zinc-400 hover:text-white border-zinc-800'
                            }`}
                          >
                            <span>📷</span>
                            <span>Có hình ảnh</span>
                            <span className="font-mono text-[11px]">
                              ({myCustomerFeedbacks.filter(f => f.hinhAnhDinhKem && f.hinhAnhDinhKem.length > 0).length})
                            </span>
                          </button>

                          <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block" />

                          <span className="text-[11px] text-zinc-500 font-mono shrink-0">Phân loại:</span>
                          {[
                            { key: 'All', label: `Tất cả (${myCustomerFeedbacks.length})` },
                            { key: 'XeMau', label: `🏍️ Đánh giá xe (${countDaXe})` },
                            { key: 'PhuTung', label: `⚙️ Đánh giá phụ tùng (${countDaPt})` },
                          ].map(t => (
                            <button
                              key={t.key}
                              type="button"
                              onClick={() => setMyReviewTypeFilter(t.key as any)}
                              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs border ${
                                myReviewTypeFilter === t.key
                                  ? 'bg-zinc-200 text-zinc-950 border-zinc-100 font-extrabold shadow'
                                  : 'bg-[#18181b] text-zinc-400 hover:text-white border-zinc-800'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hiển thị kết quả rỗng khi lọc không khớp */}
                      {filteredFeedbacks.length === 0 ? (
                        <div className="py-12 text-center rounded-3xl bg-[#141416] border border-zinc-800 text-zinc-500">
                          <div className="text-3xl mb-2">🔍</div>
                          <h4 className="text-sm font-bold text-zinc-300">Không tìm thấy đánh giá nào phù hợp</h4>
                          <button
                            type="button"
                            onClick={() => {
                              setMyReviewRatingFilter('All');
                              setMyReviewHasImageFilter(false);
                              setMyReviewTypeFilter('All');
                            }}
                            className="mt-3 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer"
                          >
                            Xóa bộ lọc
                          </button>
                        </div>
                      ) : (
                        filteredFeedbacks.map(f => {
                          const isHighlighted = highlightTarget?.type === 'review' && (
                            !highlightTarget.id ||
                            f.id === highlightTarget.id ||
                            f.id.toLowerCase().includes((highlightTarget.id || '').toLowerCase())
                          );

                          const isXe = f.productType === 'XeMau' || (f.productName && f.productName.toLowerCase().includes('xe')) || (f.xeDangDung && !f.productType);
                          const thumbnail = f.productImage || (isXe ? '/images/Xe/honda_sh_160i_abs_2024.jpg' : (f.productName?.toLowerCase().includes('nhớt') ? 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500' : (f.productName?.toLowerCase().includes('phanh') ? 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500' : '/images/phutung/dan_ao_ab_125_den_nham.webp')));

                          return (
                            <div
                              key={f.id}
                              id={`target-review-${f.id}`}
                              className={`p-5 rounded-3xl bg-[#141416] border space-y-3.5 transition-all duration-300 ${
                                isHighlighted
                                  ? 'ring-4 ring-red-500 bg-red-950/30 shadow-2xl shadow-red-900/40 border-red-500 animate-pulse'
                                  : 'border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              {/* Thông tin sản phẩm + Đã mua trên website */}
                              <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <img
                                    src={thumbnail}
                                    alt={f.productName || 'Sản phẩm'}
                                    className="w-14 h-14 rounded-2xl object-contain bg-zinc-900 border border-zinc-700/80 p-1 shrink-0 shadow-sm"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                        isXe ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                      }`}>
                                        {isXe ? '🏍️ XE MÁY' : '📦 PHỤ TÙNG'}
                                      </span>
                                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        Đã mua trên website
                                      </span>
                                    </div>
                                    <h4 className="font-extrabold text-sm text-white mt-1 truncate">{f.productName || 'Sản phẩm Motoshop'}</h4>
                                    <div className="text-[11px] text-zinc-500 font-mono">
                                      Mã phản hồi: #{f.id} · Gửi ngày: {f.ngayGui || 'Hôm nay'}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-amber-400 text-sm tracking-wider">
                                  {'⭐'.repeat(f.diemDanhGia || 5)}
                                </div>
                              </div>

                              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed bg-[#18181b] p-3.5 rounded-2xl border border-zinc-800/80 font-sans">
                                "{f.noiDung}"
                              </p>

                              {/* Media hình ảnh đính kèm nếu có */}
                              {f.hinhAnhDinhKem && f.hinhAnhDinhKem.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Hình ảnh đính kèm ({f.hinhAnhDinhKem.length}):</span>
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {f.hinhAnhDinhKem.map((img, i) => (
                                      <a
                                        key={i}
                                        href={img}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block w-16 h-16 rounded-xl overflow-hidden border border-zinc-700 hover:border-red-500 transition cursor-pointer"
                                      >
                                        <img src={img} alt="review" className="w-full h-full object-cover" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Phản hồi từ Showroom / Shop (Nổi bật) */}
                              {(f.phanHoiCuaShop || f.ghiChuXuLy) && (
                                <div className="p-3.5 rounded-2xl bg-red-950/25 border border-red-500/35 text-xs text-red-200 shadow-sm">
                                  <div className="font-bold flex items-center justify-between gap-1.5 text-red-400 mb-1">
                                    <span className="flex items-center gap-1.5 uppercase font-mono tracking-wider">
                                      <span>🏢</span> PHẢN HỒI TỪ SHOWROOM MOTOSHOP ({f.nhanVienXuLy || 'CSKH Motoshop'}):
                                    </span>
                                    {(f.ngayPhanHoi || f.ngayXuLy) && (
                                      <span className="text-[10px] text-zinc-400 font-mono font-normal">
                                        {f.ngayPhanHoi || f.ngayXuLy}
                                      </span>
                                    )}
                                  </div>
                                  <div className="pl-4 text-zinc-100 leading-relaxed font-sans">{f.phanHoiCuaShop || f.ghiChuXuLy}</div>
                                </div>
                              )}

                              {/* Nút liên hệ tư vấn trao đổi về đánh giá */}
                              <div className="pt-2 flex items-center justify-between flex-wrap gap-2 border-t border-zinc-800/60">
                                <span className="text-[11px] text-zinc-500 font-mono">
                                  Cần hỗ trợ tư vấn thêm về đơn hàng hoặc đánh giá này?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const custId = currentCustomer ? formatCustomerId(currentCustomer.id) : 'KH032';
                                    const pinned: PinnedChatContext = {
                                      title: '📌 ĐANG THẢO LUẬN VỀ ĐÁNH GIÁ CỦA BẠN',
                                      productName: f.productName || 'Phụ tùng / Dịch vụ Motoshop',
                                      productImage: thumbnail,
                                      orderId: f.orderId ? `Đơn hàng: #${f.orderId}` : `Mã phản hồi: #${f.id}`,
                                      rating: f.diemDanhGia || 5,
                                      comment: f.noiDung || '',
                                    };
                                    chatApi.syncPinnedContext(custId, pinned);
                                    window.dispatchEvent(new CustomEvent('crm-open-chat', {
                                      detail: {
                                        pinnedContext: pinned,
                                        prefillMessage: `Dạ chào Showroom, em cần trao đổi thêm về phản hồi/đánh giá mã #${f.id} của em ạ!`,
                                      }
                                    }));
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                                >
                                  <span>💬</span>
                                  <span>Liên hệ trao đổi với Showroom</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })()}

                {/* Sub-tab 3: Khảo sát hệ thống (KS02: DynamicSurveyTab có bộ lọc lịch sử) */}
                {surveySubTab === 'KhaoSatHeThong' && (
                  <DynamicSurveyTab
                    customer={currentCustomer}
                    myOrders={myOrders}
                    myAppts={myAppts}
                    myVehicles={myVehicles}
                    highlightTarget={highlightTarget}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── GLOBAL MODALS & DRAWERS ── */}
      {/* ────────────────────────────────────────────────────────── */}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal
          customer={currentCustomer}
          onClose={() => setShowEditProfile(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangeCustomerPasswordModal
          customer={currentCustomer}
          onClose={() => setShowChangePassword(false)}
          onSuccess={handlePasswordChangeSuccess}
        />
      )}

      {/* Register Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#18181b] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-800 max-h-[90vh] overflow-y-auto text-white">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-extrabold text-base uppercase">🏍️ ĐĂNG KÝ PHƯƠNG TIỆN CỦA TÔI</h3>
                <p className="text-[11px] text-zinc-400">Chuẩn hóa thông tin xe để quản lý hồ sơ và đặt lịch dịch vụ</p>
              </div>
              <button onClick={() => setShowAddVehicleModal(false)} className="text-zinc-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            {regErrors.form && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-xs text-red-200 font-semibold">
                ⚠️ {regErrors.form}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-300">Hãng xe *</label>
                  <select
                    value={regForm.hangXe}
                    onChange={e => {
                      const newBrand = e.target.value;
                      const brandData = MOTORBIKE_BRANDS.find(b => b.brand === newBrand);
                      const defaultModel = brandData && brandData.models.length > 0 ? brandData.models[0] : 'Khác';
                      setRegForm({ ...regForm, hangXe: newBrand, dongXe: defaultModel, customDongXe: '' });
                    }}
                    className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
                  >
                    {MOTORBIKE_BRANDS.map(b => (
                      <option key={b.brand} value={b.brand}>{b.brand}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-300">Dòng xe *</label>
                  <select
                    value={regForm.dongXe}
                    onChange={e => setRegForm({ ...regForm, dongXe: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
                  >
                    {((MOTORBIKE_BRANDS.find(b => b.brand === regForm.hangXe)?.models) || []).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="Khác">Khác (tự nhập)...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-300">Phân khối *</label>
                  <select
                    value={regForm.dongCo}
                    onChange={e => setRegForm({ ...regForm, dongCo: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
                  >
                    {ENGINE_CAPACITIES.map(cap => (
                      <option key={cap} value={cap}>{cap}</option>
                    ))}
                  </select>
                </div>
              </div>

              {regForm.dongXe === 'Khác' && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-300">Nhập tên dòng xe *</label>
                  <input
                    type="text"
                    placeholder="VD: Click 125i, Dylan..."
                    value={regForm.customDongXe}
                    onChange={e => setRegForm({ ...regForm, customDongXe: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-300">Biển số xe *</label>
                <input
                  type="text"
                  placeholder="VD: 51K-123.45 hoặc 59F1-234.56"
                  value={regForm.bienSo}
                  onChange={e => {
                    const formatted = formatVietnameseLicensePlate(e.target.value);
                    setRegForm({ ...regForm, bienSo: formatted });
                  }}
                  className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs font-mono uppercase focus:outline-none focus:border-red-600"
                />
                {regErrors.bienSo && <p className="text-[11px] text-red-400 mt-1 font-semibold">⚠️ {regErrors.bienSo}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-300">Số khung (VIN)</label>
                  <input
                    type="text"
                    placeholder="VD: RLHKC110JA1234567"
                    value={regForm.soKhung}
                    onChange={e => setRegForm({ ...regForm, soKhung: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs font-mono uppercase focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-300">Số máy (Engine No.)</label>
                  <input
                    type="text"
                    placeholder="VD: JF51E1234567"
                    value={regForm.soMay}
                    onChange={e => setRegForm({ ...regForm, soMay: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs font-mono uppercase focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-300">Màu sắc</label>
                  <input
                    type="text"
                    value={regForm.mauSac}
                    onChange={e => setRegForm({ ...regForm, mauSac: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-300">Năm sản xuất</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="VD: 2024"
                    value={regForm.namSanXuat}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setRegForm({ ...regForm, namSanXuat: val });
                      if (regErrors.namSanXuat) {
                        setRegErrors(prev => {
                          const n = { ...prev };
                          delete n.namSanXuat;
                          return n;
                        });
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-white text-xs font-mono focus:outline-none focus:border-red-600 ${
                      regErrors.namSanXuat ? 'border-red-500 bg-red-950/20' : 'border-zinc-700 bg-[#121214]'
                    }`}
                  />
                  {regErrors.namSanXuat && (
                    <p className="text-[11px] text-red-400 mt-1 font-semibold">{regErrors.namSanXuat}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-200 uppercase mb-1 font-mono">
                    ẢNH CHỤP PHƯƠNG TIỆN THỰC TẾ (ẢNH XE) <span className="text-zinc-400 font-normal">(Tùy chọn)</span>
                  </label>
                  <ImageUploader
                    value={regForm.hinhAnh}
                    onChange={url => setRegForm({ ...regForm, hinhAnh: url })}
                    label="Tải ảnh chụp thực tế xe máy của bạn"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-200 uppercase mb-1 font-mono">
                    ẢNH CHỤP CÀ VẸT XE (GIẤY ĐĂNG KÝ XE) <span className="text-red-500">*</span>
                  </label>
                  <ImageUploader
                    value={regForm.anhCaVet}
                    onChange={url => setRegForm({ ...regForm, anhCaVet: url })}
                    label="Tải ảnh Cà vẹt xe để đối chiếu"
                  />
                  {regErrors.anhCaVet && <p className="text-[11px] text-red-400 mt-1 font-semibold">⚠️ {regErrors.anhCaVet}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAddVehicleModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRegisterVehicle}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow cursor-pointer"
              >
                Xác nhận đăng ký
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cập nhật biển số */}
      {updatingPlateVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181b] rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-zinc-800 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold uppercase">📋 CẬP NHẬT BIỂN SỐ & CÀ VẸT</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Xe: {updatingPlateVehicle.tenXe}</p>
              </div>
              <button onClick={() => setUpdatingPlateVehicle(null)} className="text-zinc-400 hover:text-white font-bold">✕</button>
            </div>

            {plateUpdateError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-semibold">
                ⚠️ {plateUpdateError}
              </div>
            )}

            <form onSubmit={handleSubmitPlateUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase mb-1 font-mono">Biển số được cấp *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: 59P1-123.45"
                  value={newPlateInput}
                  onChange={e => setNewPlateInput(formatVietnameseLicensePlate(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs font-mono uppercase focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase mb-1 font-mono">Ảnh chụp Cà vẹt xe *</label>
                <ImageUploader
                  value={newPlateCaVetImg}
                  onChange={url => setNewPlateCaVetImg(url)}
                  label="Tải ảnh Cà vẹt xe làm căn cứ đối chiếu"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setUpdatingPlateVehicle(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={plateUpdateSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow cursor-pointer"
                >
                  {plateUpdateSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu duyệt biển số'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Helper mở chi tiết xe chuẩn 2 chế độ (Ảnh 2 & Ảnh 3) */}
      {selectedDetailVehicle && (() => {
        // Helpers tính toán thông số xe
        const getVehicleEngineSpec = (v: Vehicle): string => {
          if ((v as any).dongCo) return (v as any).dongCo;
          const name = (v.tenXe || '').toLowerCase();
          if (name.includes('điện') || name.includes('electric') || name.includes('vinfast') || name.includes('klara') || name.includes('felis') || name.includes('evo') || name.includes('vf')) {
            return 'Electric (Động cơ điện)';
          }
          if (name.includes('160')) return '156.9 cm³ eSP+ 4 van, làm mát bằng dung dịch';
          if (name.includes('150') || name.includes('155')) return '155 cm³ 4 kỳ, SOHC, VVA';
          if (name.includes('125')) return '124.8 cm³ eSP, 4 kỳ, 1 xi-lanh';
          if (name.includes('110')) return '109.2 cm³ eSP, 4 kỳ, làm mát bằng không khí';
          return 'Xăng 4 kỳ, 1 xi-lanh, phun xăng điện tử PGM-FI';
        };

        const getVehicleVin = (v: Vehicle): string => {
          if (v.soKhung && v.soKhung.trim()) return v.soKhung.trim();
          const cleanId = (v.id || '').replace(/\D/g, '') || '88';
          return `VN7P${cleanId.padStart(13, '8')}`;
        };

        const getVehicleOdometer = (v: Vehicle): string => {
          if ((v as any).soKm !== undefined) return `${Number((v as any).soKm).toLocaleString('vi-VN')} km`;
          if ((v as any).odometer) return `${(v as any).odometer} km`;
          if ((v as any).soKmDaDi) return `${Number((v as any).soKmDaDi).toLocaleString('vi-VN')} km`;
          const plate = (v.bienSo || '').toUpperCase().trim();
          const isChuaBien = !plate || plate === 'CHƯA CÓ BIỂN SỐ' || plate.includes('CHUA CO') || plate.includes('TAM-');
          if (isChuaBien) return '0 km';
          const seed = (v.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 137) % 25000 + 8000;
          return `${seed.toLocaleString('vi-VN')} km`;
        };

        // Danh sách dịch vụ xe chuẩn: CHỈ hiển thị lịch sử dịch vụ của CHÍNH XE ĐÓ
        const getVehicleServicesList = (v: Vehicle) => {
          const list: any[] = [];
          const cleanVPlate = (v.bienSo || '').toUpperCase().replace(/[\s\-\.]/g, '');
          const isChuaCoBien = !cleanVPlate || cleanVPlate === 'CHUACOBIENSO' || cleanVPlate.includes('CHUACO') || cleanVPlate.startsWith('TAM');
          const vName = (v.tenXe || '').toLowerCase().trim();

          // 1. Từ lịch hẹn hoàn thành của khách hàng (Khớp chính xác xe)
          myAppts.forEach(a => {
            if (a.trangThai !== 'DaHoanThanh' && a.trangThai !== 'HoanThanh') return;
            const cleanAPlate = (a.bienSo || '').toUpperCase().replace(/[\s\-\.]/g, '');
            const aName = (a.tenXe || '').toLowerCase().trim();
            const matchPlate = !isChuaCoBien && cleanAPlate && cleanVPlate === cleanAPlate;
            const matchVehId = (a as any).vehicleId === v.id;
            const matchVin = v.soKhung && (a as any).soKhung && v.soKhung === (a as any).soKhung;
            const matchOrderXe = isChuaCoBien && (a as any).maDonHangXe && myOrders.some(o => o.id === (a as any).maDonHangXe && o.thongTinXe?.tenXe?.toLowerCase().trim() === vName);

            if (matchVehId || matchPlate || matchVin || matchOrderXe) {
              const d = a.ngayHen ? new Date(a.ngayHen) : new Date();
              const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
              const monthYear = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
              
              let loaiBadgeText = 'Bảo dưỡng định kỳ';
              let loaiKey = a.loaiDichVu || 'BaoDuong';
              if (a.loaiDichVu === 'BaoDuong') loaiBadgeText = 'Bảo dưỡng (Định kỳ)';
              else if (a.loaiDichVu === 'SuaChua') loaiBadgeText = 'Sửa chữa phụ tùng';
              else if (a.loaiDichVu === 'BaoHanh') loaiBadgeText = 'Bảo hành';
              else if (a.loaiDichVu === 'LaiThu') loaiBadgeText = 'Lái thử';
              else if (a.loaiDichVu === 'NhanXe') loaiBadgeText = 'Nhận xe mới';

              list.push({
                id: a.id,
                ngayDichVu: formattedDate,
                monthYear,
                loaiDichVu: loaiKey,
                loaiBadgeText,
                nhanVien: a.nhanVienPhuTrach || 'Nguyễn Văn An',
                chiPhi: (a as any).tongTien || (a.loaiDichVu === 'BaoHanh' ? 0 : 2500000),
                noiDung: a.ghiChu || 'Kiểm tra và thực hiện dịch vụ xe.',
                rawDate: d.getTime(),
              });
            }
          });

          // 2. Từ hồ sơ bảo hành hoàn thành của chính xe này
          try {
            const adminClaims = warrantyApi.getAdminClaims();
            adminClaims.forEach(c => {
              if (c.trangThai !== 'HoanThanh') return;
              const cleanCPlate = (c.xeBienSo || c.b1_bienSoThucTe || '').toUpperCase().replace(/[\s\-\.]/g, '');
              const matchVehId = (c as any).vehicleId === v.id;
              const matchPlate = !isChuaCoBien && cleanCPlate && cleanCPlate.includes(cleanVPlate);
              if (matchVehId || matchPlate) {
                const d = c.ngayGui ? new Date(c.ngayGui) : new Date();
                const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                const monthYear = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                list.push({
                  id: c.id,
                  ngayDichVu: formattedDate,
                  monthYear,
                  loaiDichVu: 'BaoHanh',
                  loaiBadgeText: 'Bảo hành',
                  nhanVien: c.nhanVienPhuTrach || c.b3_ktvPhuTrach || 'Lê Văn Cường',
                  chiPhi: 0,
                  noiDung: c.noiDung || c.b2_chiTietLoi || 'Thay thế phụ tùng bảo hành chính hãng.',
                  rawDate: d.getTime(),
                });
              }
            });
          } catch {}

          // 3. CHỈ hiển thị 5 mốc lịch sử dịch vụ mẫu cho ĐÚNG chiếc xe Honda SH 160i nguyên bản có sẵn của KH001 (biển 29-E1 888.88)
          // TUYỆT ĐỐI KHÔNG inject vào các xe khác hoặc xe mới mua!
          if (cleanVPlate.includes('29E188888') || cleanVPlate.includes('29E18888') || v.id === 'XE001' || v.id === 'XE01') {
            const defaultMilestones = [
              {
                id: `svc-${v.id}-1`,
                ngayDichVu: '15/05/2024',
                monthYear: '05/2024',
                loaiDichVu: 'BaoDuong',
                loaiBadgeText: 'Bảo dưỡng (30k km)',
                nhanVien: 'Nguyễn Văn An',
                chiPhi: 2500000,
                noiDung: 'Thay dầu, lọc gió, kiểm tra phanh.',
                rawDate: new Date('2024-05-15').getTime(),
              },
              {
                id: `svc-${v.id}-2`,
                ngayDichVu: '22/03/2024',
                monthYear: '03/2024',
                loaiDichVu: 'SuaChua',
                loaiBadgeText: 'Sửa chữa (Tai nạn nhỏ)',
                nhanVien: 'Trần Thị Bình',
                chiPhi: 15800000,
                noiDung: 'Thay cản trước, (Insurance claim).',
                rawDate: new Date('2024-03-22').getTime(),
              },
              {
                id: `svc-${v.id}-3`,
                ngayDichVu: '10/01/2024',
                monthYear: '01/2024',
                loaiDichVu: 'BaoHanh',
                loaiBadgeText: 'Bảo hành',
                nhanVien: 'Lê Văn Cường',
                chiPhi: 0,
                noiDung: 'Thay thế cảm biến áp suất lốp.',
                rawDate: new Date('2024-01-10').getTime(),
              },
              {
                id: `svc-${v.id}-4`,
                ngayDichVu: '20/10/2023',
                monthYear: '10/2023',
                loaiDichVu: 'BaoDuong',
                loaiBadgeText: 'Bảo dưỡng (20k km)',
                nhanVien: 'Hoàng Thị Dung',
                chiPhi: 4200000,
                noiDung: 'Cấp 2: Thay dầu, lọc dầu, bugi...',
                rawDate: new Date('2023-10-20').getTime(),
              },
              {
                id: `svc-${v.id}-5`,
                ngayDichVu: '05/08/2023',
                monthYear: '08/2023',
                loaiDichVu: 'SuaChua',
                loaiBadgeText: 'Sửa chữa (Hệ thống treo)',
                nhanVien: 'Phạm Minh Đức',
                chiPhi: 3500000,
                noiDung: 'Thay giảm xóc sau bên trái.',
                rawDate: new Date('2023-08-05').getTime(),
              },
            ];

            defaultMilestones.forEach(def => {
              if (!list.some(it => it.ngayDichVu === def.ngayDichVu)) {
                list.push(def);
              }
            });
          }

          return list.sort((a, b) => b.rawDate - a.rawDate);
        };

        const allServices = getVehicleServicesList(selectedDetailVehicle);

        // Danh sách các tháng có dịch vụ
        const availableMonths = Array.from(new Set(allServices.map(s => s.monthYear))).filter(Boolean);

        // Lọc theo tháng và loại dịch vụ
        const filteredServices = allServices.filter(s => {
          if (vehicleServiceMonthFilter !== 'ALL' && s.monthYear !== vehicleServiceMonthFilter) return false;
          if (vehicleServiceTypeFilter !== 'ALL' && s.loaiDichVu !== vehicleServiceTypeFilter) return false;
          return true;
        });

        const pageSize = 5;
        const totalServicePages = Math.max(1, Math.ceil(filteredServices.length / pageSize));
        const pagedServices = filteredServices.slice((vehicleServicePage - 1) * pageSize, vehicleServicePage * pageSize);

        // Xuất báo cáo in sao kê
        const handleExportVehicleHistoryReport = () => {
          const printWin = window.open('', '_blank');
          if (!printWin) return;
          const rowsHtml = filteredServices.map(s => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace;">${s.ngayDichVu}</td>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${s.loaiBadgeText}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${s.nhanVien}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-family: monospace;">${s.chiPhi === 0 ? '0 VND' : s.chiPhi.toLocaleString('vi-VN') + ' VND'}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${s.noiDung}</td>
            </tr>
          `).join('');

          printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Báo cáo Lịch sử Dịch vụ - ${selectedDetailVehicle.tenXe} (${selectedDetailVehicle.bienSo || 'Xe máy'})</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 24px; color: #111; line-height: 1.5; }
                h1 { margin-bottom: 4px; font-size: 20px; text-transform: uppercase; color: #dc2626; }
                .info-table td { padding: 4px 8px; }
                table.data-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
                table.data-table th { background: #f4f4f5; padding: 8px; border: 1px solid #ddd; text-align: left; }
                .footer { margin-top: 40px; display: flex; justify-content: space-between; }
              </style>
            </head>
            <body>
              <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #dc2626; padding-bottom: 12px; margin-bottom: 20px;">
                <div>
                  <h1>SHOWROOM MOTOSHOP SERVICE</h1>
                  <p style="margin: 0; font-size: 13px; color: #666;">Hệ thống Chăm sóc & Bảo dưỡng Xe máy Chuyên nghiệp</p>
                </div>
                <div style="text-align: right; font-size: 12px; color: #666;">
                  <p style="margin: 0;">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</p>
                  <p style="margin: 0;">Hotline: 1900 6868</p>
                </div>
              </div>

              <h2 style="font-size: 16px; text-transform: uppercase; margin-bottom: 12px;">BÁO CÁO SAO KÊ LỊCH SỬ DỊCH VỤ PHƯƠNG TIỆN</h2>
              
              <table class="info-table" style="margin-bottom: 16px; font-size: 13px;">
                <tr>
                  <td><strong>Tên phương tiện:</strong></td>
                  <td>${selectedDetailVehicle.tenXe}</td>
                  <td style="padding-left: 32px;"><strong>Biển số:</strong></td>
                  <td><span style="color: #0284c7; font-weight: bold;">${selectedDetailVehicle.bienSo || 'Chưa gắn biển'}</span></td>
                </tr>
                <tr>
                  <td><strong>Số khung (VIN):</strong></td>
                  <td>${getVehicleVin(selectedDetailVehicle)}</td>
                  <td style="padding-left: 32px;"><strong>Năm sản xuất:</strong></td>
                  <td>${selectedDetailVehicle.namSanXuat}</td>
                </tr>
                <tr>
                  <td><strong>Động cơ:</strong></td>
                  <td>${getVehicleEngineSpec(selectedDetailVehicle)}</td>
                  <td style="padding-left: 32px;"><strong>Odometer:</strong></td>
                  <td>${getVehicleOdometer(selectedDetailVehicle)}</td>
                </tr>
                <tr>
                  <td><strong>Chủ xe:</strong></td>
                  <td>${currentCustomer?.hoTen || 'Khách hàng'}</td>
                  <td style="padding-left: 32px;"><strong>Số điện thoại:</strong></td>
                  <td>${currentCustomer?.soDienThoai || 'Chưa cập nhật'}</td>
                </tr>
              </table>

              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ngày dịch vụ</th>
                    <th>Loại dịch vụ</th>
                    <th>Nhân viên phụ trách</th>
                    <th style="text-align: right;">Chi phí</th>
                    <th>Nội dung thực hiện</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>

              <div class="footer">
                <div style="text-align: center;">
                  <p style="margin-bottom: 60px;"><strong>Khách hàng xác nhận</strong></p>
                  <p style="color: #888;">(Ký và ghi rõ họ tên)</p>
                </div>
                <div style="text-align: center;">
                  <p style="margin-bottom: 60px;"><strong>Đại diện Showroom Motoshop</strong></p>
                  <p style="color: #888;">(Ký tên và đóng dấu)</p>
                </div>
              </div>
            </body>
            </html>
          `);
          printWin.document.close();
          printWin.focus();
          setTimeout(() => {
            printWin.print();
          }, 400);
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            {vehicleDetailViewMode === 'info' ? (
              /* ── ẢNH 2: GIAO DIỆN CHI TIẾT XE CHUẨN 2 CỘT ── */
              <div className="bg-[#18181b] rounded-3xl w-full max-w-2xl p-6 shadow-2xl border border-zinc-800 space-y-5 text-white">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚗</span>
                    <h3 className="font-black text-sm sm:text-base uppercase tracking-wider text-white">
                      CHI TIẾT XE - {selectedDetailVehicle.tenXe.toUpperCase()} ({selectedDetailVehicle.namSanXuat})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDetailVehicle(null)}
                    className="text-zinc-400 hover:text-white font-bold p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                    title="Đóng"
                  >
                    ✕
                  </button>
                </div>

                {/* Body 2 Cột */}
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-stretch">
                  {/* Cột trái: Ảnh xe */}
                  <div className="w-full sm:w-[45%] flex items-center justify-center p-3 rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden group">
                    <img
                      src={getVehicleDisplayImage(selectedDetailVehicle)}
                      alt={selectedDetailVehicle.tenXe}
                      className="w-full h-52 sm:h-64 object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Cột phải: Thông số chi tiết */}
                  <div className="flex-1 space-y-2.5 text-xs text-zinc-300 justify-center flex flex-col">
                    <div className="flex items-baseline justify-between py-1.5 border-b border-zinc-800/80">
                      <span className="text-zinc-400 font-medium">Tên xe:</span>
                      <strong className="text-white text-right font-bold">{selectedDetailVehicle.tenXe}</strong>
                    </div>

                    <div className="flex items-baseline justify-between py-1.5 border-b border-zinc-800/80">
                      <span className="text-zinc-400 font-medium">Biển số:</span>
                      <div className="text-right">
                        <strong className="text-[#38bdf8] font-mono text-sm font-black tracking-wide">
                          {selectedDetailVehicle.bienSo || 'Chưa có biển số'}
                        </strong>
                        {selectedDetailVehicle.trangThaiDuyetBienSo === 'ChoDuyet' && (
                          <span className="block text-[10px] text-amber-400 font-semibold mt-0.5">⏳ Đang chờ duyệt</span>
                        )}
                        {selectedDetailVehicle.trangThaiDuyetBienSo === 'TuChoi' && (
                          <span className="block text-[10px] text-red-400 font-semibold mt-0.5">⛔ Bị từ chối</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between py-1.5 border-b border-zinc-800/80">
                      <span className="text-zinc-400 font-medium">VIN:</span>
                      <span className="text-zinc-200 font-mono text-xs font-semibold">{getVehicleVin(selectedDetailVehicle)}</span>
                    </div>

                    <div className="flex items-baseline justify-between py-1.5 border-b border-zinc-800/80">
                      <span className="text-zinc-400 font-medium">Động cơ:</span>
                      <span className="text-zinc-200 text-right font-medium">{getVehicleEngineSpec(selectedDetailVehicle)}</span>
                    </div>

                    <div className="flex items-baseline justify-between py-1.5 border-b border-zinc-800/80">
                      <span className="text-zinc-400 font-medium">Số khung:</span>
                      <span className="text-zinc-200 font-mono text-xs">{selectedDetailVehicle.soKhung || getVehicleVin(selectedDetailVehicle)}</span>
                    </div>

                    <div className="flex items-baseline justify-between py-1.5 border-b border-zinc-800/80">
                      <span className="text-zinc-400 font-medium">Năm sản xuất:</span>
                      <span className="text-zinc-200 font-mono font-semibold">{selectedDetailVehicle.namSanXuat}</span>
                    </div>

                    <div className="flex items-baseline justify-between py-1.5 border-b border-zinc-800/80">
                      <span className="text-zinc-400 font-medium">Nguồn gốc:</span>
                      <span className="text-zinc-200 font-medium">
                        {selectedDetailVehicle.nguonGoc === 'CuaHang' ? 'Xe mua tại cửa hàng' : 'Xe ngoài hệ thống'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setVehicleDetailViewMode('serviceHistory');
                      setVehicleServicePage(1);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer"
                  >
                    <span>⚡</span>
                    <span>Lịch sử dịch vụ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDetailVehicle(null)}
                    className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs border border-zinc-700 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>✕</span>
                    <span>Đóng</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ── ẢNH 3: GIAO DIỆN LỊCH SỬ DỊCH VỤ CỦA XE ĐÓ ── */
              <div className="bg-[#18181b] rounded-3xl w-full max-w-4xl p-6 shadow-2xl border border-zinc-800 space-y-4 text-white">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚗</span>
                    <h3 className="font-black text-sm sm:text-base uppercase tracking-wider text-white">
                      LỊCH SỬ DỊCH VỤ - {selectedDetailVehicle.tenXe.toUpperCase()} ({selectedDetailVehicle.bienSo || 'CHƯA GẮN BIỂN'})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDetailVehicle(null)}
                    className="text-zinc-400 hover:text-white font-bold p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                    title="Đóng"
                  >
                    ✕
                  </button>
                </div>

                {/* Summary Info Header */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-zinc-300 font-mono py-1">
                  <div>Tên xe: <strong className="text-white ml-1">{selectedDetailVehicle.tenXe} ({selectedDetailVehicle.namSanXuat})</strong></div>
                  <div>Biển số: <strong className="text-[#38bdf8] font-bold ml-1">{selectedDetailVehicle.bienSo || 'Chưa gắn biển'}</strong></div>
                  <div>Odometer: <strong className="text-emerald-400 font-bold ml-1">{getVehicleOdometer(selectedDetailVehicle)}</strong></div>
                </div>

                {/* Filter Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#121214] border border-zinc-800/80">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Tháng dịch vụ */}
                    <div className="relative">
                      <select
                        value={vehicleServiceMonthFilter}
                        onChange={e => {
                          setVehicleServiceMonthFilter(e.target.value);
                          setVehicleServicePage(1);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#18181b] border border-zinc-700 text-xs text-zinc-200 font-mono focus:outline-none focus:border-red-600 cursor-pointer"
                      >
                        <option value="ALL">Tháng dịch vụ: Tất cả 📅</option>
                        {availableMonths.map(m => (
                          <option key={m} value={m}>Tháng dịch vụ {m} 📅</option>
                        ))}
                      </select>
                    </div>

                    {/* Loại dịch vụ */}
                    <div className="relative">
                      <select
                        value={vehicleServiceTypeFilter}
                        onChange={e => {
                          setVehicleServiceTypeFilter(e.target.value);
                          setVehicleServicePage(1);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#18181b] border border-zinc-700 text-xs text-zinc-200 font-mono focus:outline-none focus:border-red-600 cursor-pointer"
                      >
                        <option value="ALL">Loại dịch vụ: Tất cả</option>
                        <option value="BaoDuong">Bảo dưỡng định kỳ</option>
                        <option value="SuaChua">Sửa chữa phụ tùng</option>
                        <option value="BaoHanh">Bảo hành</option>
                        <option value="LaiThu">Lái thử</option>
                        <option value="NhanXe">Bàn giao xe mới</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-400 font-mono">
                    Đang hiển thị <strong>{filteredServices.length}</strong> / {allServices.length} lượt dịch vụ
                  </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-[#121214]">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-[#18181b] text-zinc-400 uppercase text-[11px] font-mono border-b border-zinc-800">
                      <tr>
                        <th className="py-3 px-3.5 font-semibold">Ngày dịch vụ</th>
                        <th className="py-3 px-3.5 font-semibold">Loại dịch vụ</th>
                        <th className="py-3 px-3.5 font-semibold">Nhân viên phụ trách</th>
                        <th className="py-3 px-3.5 font-semibold text-right">Chi phí</th>
                        <th className="py-3 px-3.5 font-semibold">Nội dung</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80">
                      {pagedServices.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-zinc-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <span className="text-3xl">🛠️</span>
                              <p className="font-bold text-white text-sm">
                                {allServices.length === 0
                                  ? 'Xe chưa có lịch sử dịch vụ bảo dưỡng hoặc sửa chữa nào'
                                  : 'Không có lượt dịch vụ nào phù hợp với bộ lọc đã chọn.'}
                              </p>
                              {allServices.length === 0 && (
                                <p className="text-xs text-zinc-500 max-w-md">
                                  Xe mới hoặc chưa từng phát sinh dịch vụ nào tại xưởng Motoshop. Hãy đặt lịch bảo dưỡng định kỳ mốc đầu tiên (1.000 km) để đảm bảo quyền lợi bảo hành chính hãng!
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pagedServices.map((svc, idx) => {
                          let badgeClass = 'bg-[#14532d]/40 text-[#4ade80] border-[#22c55e]/40';
                          if (svc.loaiDichVu === 'SuaChua') {
                            badgeClass = 'bg-[#7c2d12]/40 text-[#fb923c] border-[#f97316]/40';
                          } else if (svc.loaiDichVu === 'BaoHanh') {
                            badgeClass = 'bg-[#1e3a8a]/40 text-[#60a5fa] border-[#3b82f6]/40';
                          } else if (svc.loaiDichVu === 'LaiThu') {
                            badgeClass = 'bg-[#581c87]/40 text-[#c084fc] border-[#a855f7]/40';
                          }

                          return (
                            <tr key={idx} className="hover:bg-zinc-800/40 transition">
                              <td className="py-3 px-3.5 font-mono text-zinc-200 whitespace-nowrap">
                                {svc.ngayDichVu}
                              </td>
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block ${badgeClass}`}>
                                  {svc.loaiBadgeText}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 font-medium text-white whitespace-nowrap">
                                {svc.nhanVien}
                              </td>
                              <td className="py-3 px-3.5 font-mono font-bold text-white text-right whitespace-nowrap">
                                {svc.chiPhi === 0 ? '0 VND' : `${svc.chiPhi.toLocaleString('vi-VN')} VND`}
                              </td>
                              <td className="py-3 px-3.5 text-zinc-300 text-[11px] max-w-xs">
                                {svc.noiDung}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalServicePages > 1 && (
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1">
                    <button
                      type="button"
                      disabled={vehicleServicePage <= 1}
                      onClick={() => setVehicleServicePage(p => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 cursor-pointer"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalServicePages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setVehicleServicePage(p)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                            vehicleServicePage === p ? 'bg-blue-600 text-white shadow' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={vehicleServicePage >= totalServicePages}
                      onClick={() => setVehicleServicePage(p => Math.min(totalServicePages, p + 1))}
                      className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setVehicleDetailViewMode('info')}
                    className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <span>◀</span>
                    <span>Trở về thông tin xe</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportVehicleHistoryReport}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs border border-zinc-700 transition cursor-pointer flex items-center gap-1.5 shadow"
                    >
                      <span>📄</span>
                      <span>Xuất báo cáo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDetailVehicle(null)}
                      className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs border border-zinc-700 transition cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Modal Xem chi tiết đơn hàng (Phụ tùng / Xe) theo chuẩn giao diện Ảnh 4 */}
      {selectedOrderDetail && (() => {
        const isXe = selectedOrderDetail.loaiDon === 'Xe' || !!selectedOrderDetail.thongTinXe;
        const stepIdx = (selectedOrderDetail.trangThai === 'HoanThanh' || selectedOrderDetail.trangThai === 'DaGiao')
          ? 3
          : selectedOrderDetail.trangThai === 'DangGiao'
          ? 2
          : selectedOrderDetail.trangThai === 'DaXacNhan'
          ? 1
          : 0;

        const steps = [
          { key: 'ChoDuyet', label: 'Đã đặt hàng' },
          { key: 'DaXacNhan', label: 'Đã xác nhận' },
          { key: 'DangGiao', label: 'Đang giao hàng' },
          { key: 'DaGiao', label: 'Đã giao hàng' },
        ];

        const statusLabel = selectedOrderDetail.trangThai === 'DaHuy'
          ? 'ĐƠN HÀNG ĐÃ HỦY'
          : selectedOrderDetail.trangThai === 'HoanThanh' || selectedOrderDetail.trangThai === 'DaGiao'
          ? 'ĐÃ GIAO HÀNG THÀNH CÔNG'
          : selectedOrderDetail.trangThai === 'DangGiao'
          ? 'ĐANG GIAO HÀNG'
          : selectedOrderDetail.trangThai === 'DaXacNhan'
          ? 'ĐÃ XÁC NHẬN'
          : 'CHỜ XÁC NHẬN';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#18181b] rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-zinc-800 space-y-4 text-white max-h-[92vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-zinc-800 pb-3.5">
                <div>
                  <h3 className="font-extrabold text-base uppercase text-white font-display tracking-wide">
                    CHI TIẾT ĐƠN HÀNG #{selectedOrderDetail.id}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Ngày đặt: {selectedOrderDetail.ngayDat}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetail(null)}
                  className="text-zinc-400 hover:text-white font-bold text-lg p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Progress Stepper (Theo Ảnh 4) */}
              <div className="py-2">
                <div className="text-center font-black text-sm tracking-widest uppercase text-white font-display mb-4">
                  {statusLabel}
                </div>

                <div className="relative flex items-center justify-between px-2 sm:px-6">
                  {/* Connecting lines */}
                  <div className="absolute left-8 right-8 top-3 h-0.5 bg-zinc-700 -z-0">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: selectedOrderDetail.trangThai === 'DaHuy'
                          ? '0%'
                          : stepIdx === 0
                          ? '0%'
                          : stepIdx === 1
                          ? '33.33%'
                          : stepIdx === 2
                          ? '66.66%'
                          : '100%',
                      }}
                    />
                  </div>

                  {steps.map((st, sIdx) => {
                    const isPassed = sIdx < stepIdx;
                    const isCurrent = sIdx === stepIdx;
                    return (
                      <div key={st.key} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                            isPassed
                              ? 'bg-emerald-500 text-white'
                              : isCurrent
                              ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                          }`}
                        >
                          {isPassed ? (
                            '✓'
                          ) : isCurrent ? (
                            <span className="w-2 h-2 rounded-full bg-white inline-block" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 inline-block" />
                          )}
                        </div>
                        <span
                          className={`text-xs mt-2 font-medium tracking-tight whitespace-nowrap ${
                            isPassed || isCurrent ? 'text-zinc-200 font-bold' : 'text-zinc-500'
                          }`}
                        >
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2-Column Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {/* Cột trái: THÔNG TIN Giao hàng */}
                <div className="p-4 rounded-2xl bg-[#121214] border border-zinc-800 text-xs space-y-2 text-zinc-300">
                  <div className="font-bold text-xs uppercase text-zinc-200 tracking-wide font-mono mb-2">
                    THÔNG TIN Giao hàng
                  </div>
                  <div>
                    + Người nhận: <strong className="text-white font-bold">{selectedOrderDetail.hoTenKH}</strong>
                  </div>
                  <div>
                    + SĐT: <strong className="font-mono text-zinc-100">{selectedOrderDetail.soDienThoai || '0879179243'}</strong>
                  </div>
                  <div>
                    + Địa chỉ: <span className="text-zinc-200">{selectedOrderDetail.diaChiGiao}</span>
                  </div>
                  <div>
                    + Thanh toán: <span className="text-zinc-200">{selectedOrderDetail.phuongThucThanhToan === 'ChuyenKhoan' ? 'Chuyển khoản Online' : 'Tiền mặt khi nhận hàng (COD)'} ({selectedOrderDetail.trangThaiThanhToan === 'DaThanhToan' ? 'đã thanh toán' : 'chưa thanh toán'})</span>
                  </div>
                </div>

                {/* Cột phải: CHI TIẾT THANH TOÁN */}
                {(() => {
                  const itemSubtotal = (selectedOrderDetail.items && selectedOrderDetail.items.length > 0)
                    ? selectedOrderDetail.items.reduce((s, it) => s + ((it.donGia || 0) * (it.soLuong || 1)), 0)
                    : Math.max(0, selectedOrderDetail.tongTien - 30000);
                  const shippingFee = (selectedOrderDetail.tongTien > itemSubtotal)
                    ? (selectedOrderDetail.tongTien - itemSubtotal)
                    : (selectedOrderDetail.kenhBan === 'TaiQuay' ? 0 : 30000);
                  const displayTotal = selectedOrderDetail.tongTien > 0 ? selectedOrderDetail.tongTien : (itemSubtotal + shippingFee);

                  return (
                    <div className="p-4 rounded-2xl bg-[#121214] border border-zinc-800 text-xs flex flex-col justify-between space-y-2">
                      <div className="font-bold text-xs uppercase text-zinc-200 tracking-wide font-mono mb-1">
                        CHI TIẾT THANH TOÁN
                      </div>
                      <div className="space-y-1.5 text-zinc-300">
                        <div className="flex justify-between">
                          <span>+ Tạm tính:</span>
                          <span className="font-mono text-white font-bold">{formatVND(itemSubtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>+ Phí vận chuyển:</span>
                          <span className="font-mono text-zinc-200 font-bold">
                            {shippingFee > 0 ? formatVND(shippingFee) : '0 đ (Miễn phí)'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>+ Giảm giá:</span>
                          <span className="font-mono text-zinc-400">0 đ</span>
                        </div>
                      </div>
                      <div className="border-t border-zinc-800/90 pt-2.5 flex justify-between items-center">
                        <span className="font-extrabold uppercase text-xs text-zinc-200">TỔNG TIỀN:</span>
                        <strong className="text-lg font-black text-red-500 font-mono">
                          {formatVND(displayTotal)}
                        </strong>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Bảng DANH SÁCH PHỤ TÙNG */}
              <div className="space-y-2 pt-1">
                <div className="font-bold text-xs uppercase text-zinc-300 font-mono tracking-wide">
                  {isXe ? 'THÔNG TIN PHƯƠNG TIỆN' : 'DANH SÁCH PHỤ TÙNG'}
                </div>

                {isXe && selectedOrderDetail.thongTinXe ? (
                  <div className="p-3.5 rounded-2xl bg-[#121214] border border-zinc-800 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-white text-sm">{selectedOrderDetail.thongTinXe.tenXe}</div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        Màu: {selectedOrderDetail.thongTinXe.mauSac} · {selectedOrderDetail.thongTinXe.phienBan}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-red-400 text-sm">
                      {formatVND(selectedOrderDetail.tongTien)}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#121214] border border-zinc-800 overflow-hidden text-xs">
                    <div className="grid grid-cols-12 px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-mono text-zinc-400 font-bold">
                      <div className="col-span-6">Bảng chi tiết</div>
                      <div className="col-span-2 text-center">Số lượng</div>
                      <div className="col-span-2 text-right">Đơn giá</div>
                      <div className="col-span-2 text-right">Thành tiền</div>
                    </div>
                    <div className="divide-y divide-zinc-800/60 max-h-56 overflow-y-auto">
                      {selectedOrderDetail.items?.map((it, idx) => (
                        <div key={idx} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-zinc-900/40 transition">
                          <div className="col-span-6 flex items-center gap-3">
                            <img
                              src={getPartThumbnail(it)}
                              alt={it.tenSanPham}
                              className="w-11 h-11 rounded-lg bg-zinc-900 border border-zinc-800 object-contain p-1 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/phutung/motul_7100.png';
                              }}
                            />
                            <div>
                              <div className="font-bold text-zinc-100 text-xs leading-snug">{it.tenSanPham}</div>
                              <div className="text-[11px] text-zinc-400 font-mono mt-0.5">Số lượng: {it.soLuong}</div>
                            </div>
                          </div>
                          <div className="col-span-2 text-center font-mono text-zinc-200">
                            {it.soLuong}
                          </div>
                          <div className="col-span-2 text-right font-mono text-zinc-300">
                            {formatVND(it.donGia)}
                          </div>
                          <div className="col-span-2 text-right font-mono font-bold text-white">
                            {formatVND(it.donGia * it.soLuong)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer (Theo Ảnh 4) */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800 flex-wrap gap-2.5">
                <div className="flex items-center gap-2">
                  {!isXe && (
                    <button
                      type="button"
                      disabled={reorderLoading}
                      onClick={() => handleReorder(selectedOrderDetail)}
                      className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span>🔄</span> {reorderLoading ? 'Đang gửi...' : 'Mua lại'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedOrderDetail(null)}
                    className="px-6 py-2.5 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-zinc-200 font-bold text-xs transition cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('crm-open-chat', {
                      detail: {
                        prefillMessage: `Dạ chào Shop, em cần hỗ trợ về đơn hàng #${selectedOrderDetail.id} ạ!`,
                      }
                    }));
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 border border-zinc-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span>💬</span> Liên hệ hỗ trợ
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Cancel Order Modal */}
      {orderToCancel && (
        <CancelOrderModal
          order={orderToCancel}
          onClose={() => setOrderToCancel(null)}
          onConfirm={reason => handleConfirmCancelOrder(orderToCancel.id, reason)}
        />
      )}

      {/* Vehicle Pickup QR Modal */}
      {viewingQrData && (
        <VehiclePickupQrModal
          data={viewingQrData}
          onClose={() => setViewingQrData(null)}
        />
      )}

      {/* Modal Đổi ngày nhận xe tại Showroom */}
      {changingDateOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#18181b] rounded-3xl max-w-sm w-full p-6 border border-zinc-700 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="font-extrabold text-sm text-white uppercase flex items-center gap-1.5">
                <span>📅</span> <span>ĐỔI NGÀY NHẬN XE TẠI SHOWROOM</span>
              </h3>
              <button onClick={() => setChangingDateOrder(null)} className="text-zinc-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-zinc-300 font-semibold">Chọn ngày nhận xe mới:</label>
              <input
                type="date"
                value={newPickupDateInput}
                onChange={e => setNewPickupDateInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-red-600"
              />
              <p className="text-[11px] text-zinc-400">
                Showroom mở cửa đón tiếp khách hàng từ 08:00 - 18:00 các ngày trong tuần.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setChangingDateOrder(null)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (newPickupDateInput) {
                    await orderApi.confirmVehiclePickupDate(changingDateOrder.id, newPickupDateInput, '09:00');
                    setAllOrders(orderApi.getAllSync());
                    appointmentApi.getAll().then(d => { if (d) setAllAppts(d); });
                    setChangingDateOrder(null);
                    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'appointment_updated' } }));
                    alert('✓ Đã cập nhật và xác nhận ngày nhận xe mới: ' + newPickupDateInput + '. Lịch hẹn và Lịch biểu Showroom đã được đồng bộ!');
                  }
                }}
                className="px-4 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold cursor-pointer"
              >
                ✓ Lưu ngày mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181b] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-extrabold text-sm uppercase">⭐ ĐÁNH GIÁ SẢN PHẨM</h3>
                <p className="text-xs text-zinc-400 font-mono">{reviewModalPart.partName}</p>
              </div>
              <button onClick={() => setReviewModalPart(null)} className="text-zinc-400 hover:text-white font-bold">✕</button>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">Số sao:</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewStars(s)}
                    className="text-2xl cursor-pointer hover:scale-110 transition"
                  >
                    {s <= reviewStars ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">Nhận xét:</label>
              <textarea
                rows={3}
                required
                value={reviewContent}
                onChange={e => setReviewContent(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
              />
            </div>

            {/* ĐG01: Khu vực đính kèm hình ảnh (tối đa 6 ảnh) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-300 uppercase">
                  Hình ảnh đính kèm (tối đa 6 ảnh):
                </label>
                <span className={`text-[11px] font-mono font-bold ${reviewImages.length > 6 ? 'text-red-400' : 'text-zinc-400'}`}>
                  {reviewImages.length}/6 ảnh tối đa
                </span>
              </div>

              {/* Thông báo cảnh báo vượt quá 6 ảnh */}
              {reviewImages.length > 6 && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-xs flex items-center gap-2 animate-pulse shadow-md">
                  <span className="text-base">⚠️</span>
                  <span><strong>Không được thêm quá 6 ảnh!</strong> Bạn đã chọn {reviewImages.length} ảnh. Vui lòng nhấn nút ✕ để xóa bớt {reviewImages.length - 6} ảnh trước khi gửi đánh giá.</span>
                </div>
              )}

              <div>
                {/* Bug 3: Chỉ chấp nhận tải ảnh trực tiếp từ thiết bị qua input file, không cho phép nhập URL */}
                <label className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold cursor-pointer border border-dashed border-zinc-700 hover:border-red-500/60 flex items-center justify-center gap-2 transition group shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-red-500 transition">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>📁 Tải ảnh trực tiếp từ thiết bị (tối đa 6 ảnh)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setReviewImages(prev => [...prev, ev.target!.result as string]);
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              {/* Thumbnails preview */}
              {reviewImages.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {reviewImages.map((img, idx) => (
                    <div key={idx} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-zinc-700 bg-black">
                      <img src={img} alt="review" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 hover:bg-red-600 text-white text-[10px] flex items-center justify-center font-bold transition cursor-pointer"
                        title="Xóa ảnh"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setReviewModalPart(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={reviewSubmitting || !reviewContent.trim() || reviewImages.length > 6}
                title={reviewImages.length > 6 ? 'Không được thêm quá 6 ảnh' : undefined}
                onClick={async () => {
                  if (!currentCustomer || !reviewModalPart) return;
                  setReviewSubmitting(true);
                  try {
                    const res = await feedbackApi.create({
                      customerId: currentCustomer.id,
                      hoTen: currentCustomer.hoTen,
                      soDienThoai: currentCustomer.soDienThoai,
                      noiDung: reviewContent.trim(),
                      diemDanhGia: reviewStars,
                      productName: reviewModalPart.partName,
                      productId: reviewModalPart.productId,
                      productType: reviewModalPart.productType || 'PhuTung',
                      orderId: reviewModalPart.orderId,
                      hinhAnhDinhKem: reviewImages,
                    });

                    // TB02: Bắn thông báo cho Admin kèm id chuẩn xác
                    addAdminNotification({
                      category: 'review',
                      type: 'review_submitted',
                      title: `⭐ Đánh giá ${reviewStars} sao mới`,
                      message: `${currentCustomer.hoTen} vừa gửi đánh giá cho "${reviewModalPart.partName}": "${reviewContent.trim().slice(0, 50)}..."`,
                      linkPage: 'feedback',
                      meta: {
                        id: res.feedback.id,
                        feedbackId: res.feedback.id,
                        customerId: currentCustomer.id,
                        productName: reviewModalPart.partName,
                      },
                    });

                    // Cập nhật ngay lập tức vào state đánh giá cá nhân để phản ánh tức thì
                    setMyCustomerFeedbacks(prev => [res.feedback, ...prev.filter(f => f.id !== res.feedback.id)]);

                    // DG01: Nếu gửi từ Tab 1 (Đơn mua hàng), giữ khách ở Tab 1 và hiển thị trạng thái đã đánh giá ngay trên đơn hàng
                    if (reviewModalPart.fromTab === 1) {
                      setReviewToast(`🎉 Đã gửi đánh giá cho sản phẩm "${reviewModalPart.partName}" thành công!`);
                    } else {
                      // Nếu gửi từ Tab 5 (Khảo sát & Đánh giá), chuyển sang Sub-tab "Đã đánh giá"
                      setActiveTab(5);
                      setSurveySubTab('DaDanhGia');
                      setReviewToast('🎉 Cảm ơn bạn đã gửi đánh giá thành công!');
                    }

                    setTimeout(() => setReviewToast(null), 4000);
                    setReviewModalPart(null);
                    setReviewImages([]);
                                        loadCustomerData();

                    // Đồng bộ dữ liệu real-time tới Admin và Showroom
                    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'feedback', id: res.feedback.id } }));
                  } catch (err: any) {
                    console.error('Lỗi gửi đánh giá:', err);
                    alert(`Gửi đánh giá không thành công: ${err?.message || 'Vui lòng kiểm tra lại.'}`);
                  } finally {
                    setReviewSubmitting(false);
                  }
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow cursor-pointer disabled:opacity-50"
              >
                {reviewSubmitting ? 'Đang gửi...' : 'GỬI ĐÁNH GIÁ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Insurance Modal */}
      {renewingInsuranceContract && (
        <RenewInsuranceModal
          contract={renewingInsuranceContract}
          isAdmin={false}
          onClose={() => setRenewingInsuranceContract(null)}
          onConfirm={(years, method) => handleConfirmRenewInsurance(renewingInsuranceContract, years, method)}
        />
      )}

      {/* Viewing Insurance Contract Modal (GCN) */}
      {viewingInsuranceContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-[#18181b] rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-800 p-6 sm:p-8 space-y-6 text-white print:text-black print:bg-white print:border-none print:shadow-none print:p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 print:hidden">
              <div className="font-mono text-xs text-red-400 font-bold">Số GCN: {viewingInsuranceContract.soGCN}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 text-white hover:bg-zinc-700 cursor-pointer"
                >
                  🖨️ In / Tải PDF
                </button>
                <button
                  onClick={() => setViewingInsuranceContract(null)}
                  className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Certificate Body */}
            <div className="border-2 border-red-600/60 rounded-2xl p-6 bg-[#141416] print:bg-white print:border-red-700 space-y-4 text-xs">
              <div className="text-center pb-3 border-b border-zinc-800">
                <div className="text-[11px] font-bold text-zinc-400 uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="text-base font-extrabold text-red-500 uppercase mt-1">GIẤY CHỨNG NHẬN BẢO HIỂM XE MÁY ĐIỆN TỬ</div>
                <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Số: {viewingInsuranceContract.soGCN}</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-zinc-400">Đơn vị cấp:</span> <strong className="text-white">{viewingInsuranceContract.nhaBaoHiem}</strong></div>
                <div className="flex justify-between"><span className="text-zinc-400">Chủ xe:</span> <strong className="text-white">{viewingInsuranceContract.hoTenKH}</strong></div>
                <div className="flex justify-between"><span className="text-zinc-400">Phương tiện:</span> <strong className="text-white">{viewingInsuranceContract.tenXe} ({viewingInsuranceContract.bienSo})</strong></div>
                <div className="flex justify-between"><span className="text-zinc-400">Gói bảo hiểm:</span> <strong className="text-white">{viewingInsuranceContract.tenGoi}</strong></div>
                <div className="flex justify-between"><span className="text-zinc-400">Thời hạn:</span> <strong className="text-white font-mono">{viewingInsuranceContract.ngayBatDau} ➔ {viewingInsuranceContract.ngayKetThuc}</strong></div>
                <div className="flex justify-between pt-2 border-t border-zinc-800"><span className="text-zinc-400">Phí bảo hiểm:</span> <strong className="text-red-400 font-mono text-sm">{formatVND(viewingInsuranceContract.phiBaoHiem)}</strong></div>
              </div>

              <div className="text-center pt-2 text-[10px] text-zinc-500 font-mono">
                [ĐÃ KÝ ĐIỆN TỬ VÀ XÁC THỰC HỢP CHUẨN NGHỊ ĐỊNH 67/2023/NĐ-CP]
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Toast */}
      {passwordToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom">
          <span>✅</span>
          <span>{passwordToast}</span>
        </div>
      )}

      {/* Order cancel Toast */}
      {orderCancelToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-zinc-700 flex items-center gap-3 animate-bounce">
          <span className="text-xl">✅</span>
          <div className="text-xs">
            <strong className="font-bold block text-emerald-400">Đã cập nhật đơn hàng</strong>
            <span className="text-zinc-300">{orderCancelToast}</span>
          </div>
        </div>
      )}

      {/* Review Toast */}
      {reviewToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom">
          <span>✓</span>
          <span>{reviewToast}</span>
        </div>
      )}

      {/* ── MODAL: CHI TIẾT LỊCH HẸN (LH06 & LH07) ── */}
      {selectedApptDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#18181b] rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-800 p-6 space-y-5 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📅</span>
                <div>
                  <h3 className="font-extrabold text-base uppercase tracking-tight">CHI TIẾT LỊCH HẸN #{selectedApptDetail.id}</h3>
                  <div className="text-[11px] text-zinc-400 font-mono">Tạo lúc: {selectedApptDetail.createdDate || 'Gần đây'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge {...(apptStatusConfig[selectedApptDetail.trangThai] || { label: selectedApptDetail.trangThai, color: '#71717a', bg: '#27272a' })} />
                <button
                  onClick={() => setSelectedApptDetail(null)}
                  className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Thông tin dịch vụ & Thời gian */}
            <div className="p-4 rounded-2xl bg-[#141416] border border-zinc-800 space-y-2.5 text-xs">
              <div className="text-[11px] font-bold text-red-400 uppercase font-mono tracking-wider">
                1. THÔNG TIN DỊCH VỤ & THỜI GIAN
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Dịch vụ:</span>
                  <strong className="text-white text-sm uppercase">{SVC_LABELS[selectedApptDetail.loaiDichVu] || selectedApptDetail.loaiDichVu}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Thời gian hẹn:</span>
                  <strong className="text-red-400 font-mono text-sm">📅 {selectedApptDetail.ngayHen} lúc {selectedApptDetail.gioHen}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-zinc-500 block text-[11px]">Địa điểm tiếp nhận:</span>
                  <span className="text-zinc-300">Showroom & Trung tâm Dịch vụ Motoshop (08:00 - 17:00, Thứ 2 - Thứ 7)</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-zinc-500 block text-[11px]">Kỹ thuật viên tiếp nhận:</span>
                  <span className="text-zinc-200 font-mono font-semibold">{selectedApptDetail.nhanVienPhuTrach || 'Đang điều phối kỹ thuật viên'}</span>
                </div>
              </div>
            </div>

            {/* Thông tin phương tiện */}
            <div className="p-4 rounded-2xl bg-[#141416] border border-zinc-800 space-y-2.5 text-xs">
              <div className="text-[11px] font-bold text-blue-400 uppercase font-mono tracking-wider">
                2. PHƯƠNG TIỆN THỰC HIỆN
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Tên xe:</span>
                  <strong className="text-white">{selectedApptDetail.tenXe || 'Xe máy'}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Biển số:</span>
                  <strong className="text-white font-mono">{selectedApptDetail.bienSo || 'Chưa có biển số'}</strong>
                </div>
                {selectedApptDetail.soKhungVIN && (
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Số khung (VIN):</span>
                    <span className="text-zinc-300 font-mono">{selectedApptDetail.soKhungVIN}</span>
                  </div>
                )}
                {selectedApptDetail.soMay && (
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Số máy:</span>
                    <span className="text-zinc-300 font-mono">{selectedApptDetail.soMay}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin khách hàng & Ghi chú */}
            <div className="p-4 rounded-2xl bg-[#141416] border border-zinc-800 space-y-2.5 text-xs">
              <div className="text-[11px] font-bold text-emerald-400 uppercase font-mono tracking-wider">
                3. NGƯỜI ĐẶT LỊCH & GHI CHÚ
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Họ tên khách:</span>
                  <strong className="text-white">{selectedApptDetail.hoTenKH || currentCustomer?.hoTen}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Số điện thoại:</span>
                  <strong className="text-white font-mono">{selectedApptDetail.soDienThoai || currentCustomer?.soDienThoai}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-zinc-500 block text-[11px]">Yêu cầu / Ghi chú cho thợ:</span>
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 italic">
                    {selectedApptDetail.ghiChu ? `"${selectedApptDetail.ghiChu}"` : 'Không có ghi chú thêm.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin hủy nếu đã hủy */}
            {selectedApptDetail.trangThai === 'DaHuy' && (
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700 space-y-1.5 text-xs">
                <div className="font-bold text-zinc-300 flex items-center gap-1.5 font-mono uppercase">
                  <span>🚫</span> TRẠNG THÁI: ĐÃ HỦY LỊCH HẸN
                </div>
                <div className="text-zinc-400">
                  Lý do hủy: <strong className="text-zinc-200">{selectedApptDetail.lyDoTuChoi || 'Khách hàng yêu cầu hủy'}</strong>
                </div>
              </div>
            )}

            {/* LH25: Thông tin từ chối nếu bị từ chối */}
            {selectedApptDetail.trangThai === 'TuChoi' && (
              <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-800/80 space-y-1.5 text-xs">
                <div className="font-bold text-rose-400 flex items-center gap-1.5 font-mono uppercase">
                  <span>⚠️</span> TRẠNG THÁI: LỊCH HẸN BỊ TỪ CHỐI
                </div>
                <div className="text-rose-200">
                  Lý do từ chối: <strong className="text-white font-semibold">{selectedApptDetail.lyDoTuChoi || 'Cửa hàng không thể tiếp nhận trong khung giờ này hoặc dịch vụ tạm ngưng.'}</strong>
                </div>
              </div>
            )}

            {/* Footer actions: Nút hủy lịch hẹn theo quy tắc 48h (LH06) */}
            {(() => {
              const isEligibleStatus = selectedApptDetail.trangThai === 'ChoXacNhan' || selectedApptDetail.trangThai === 'DaXacNhan';
              if (!isEligibleStatus) {
                return (
                  <div className="flex justify-end pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setSelectedApptDetail(null)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 text-white hover:bg-zinc-700 cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                );
              }

              const apptTime = new Date(`${selectedApptDetail.ngayHen}T${selectedApptDetail.gioHen || '08:00'}:00`).getTime();
              const hoursLeft = (apptTime - Date.now()) / (1000 * 60 * 60);
              const canCancel = hoursLeft >= 48;

              return (
                <div className="pt-3 border-t border-zinc-800 space-y-3">
                  {canCancel ? (
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="text-xs text-emerald-400 font-mono">
                        ✓ Đủ điều kiện hủy (còn {Math.round(hoursLeft)}h, quy định ≥ 48h)
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedApptDetail(null)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                        >
                          Đóng
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCancelConfirmAppt(selectedApptDetail);
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          <span>✕</span> HỦY LỊCH HẸN
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-start gap-2.5">
                        <span className="text-base">⚠️</span>
                        <div>
                          <strong className="block font-bold text-amber-300">Không thể tự hủy lịch hẹn trên hệ thống:</strong>
                          <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                            Thời gian tới giờ hẹn chỉ còn <strong>{Math.max(0, Math.round(hoursLeft))} giờ</strong> (Quy định của đại lý yêu cầu hủy trước tối thiểu <strong>48 giờ</strong> để kịp sắp xếp lại kỹ thuật viên). Nếu quý khách có việc đột xuất không thể đến, vui lòng liên hệ hotline <strong className="text-white underline">1900 6868</strong> để được hỗ trợ.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedApptDetail(null)}
                          className="px-5 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-white hover:bg-zinc-700 cursor-pointer"
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── MODAL: XEM HÓA ĐƠN & BIÊN BẢN DỊCH VỤ (LSLH02) ── */}
      {selectedServiceInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          {/* Scoped print styling */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #motoshop-service-invoice-print, #motoshop-service-invoice-print * {
                visibility: visible !important;
              }
              #motoshop-service-invoice-print {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 20px !important;
                background: white !important;
                color: black !important;
                border: none !important;
                box-shadow: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div
            id="motoshop-service-invoice-print"
            className="bg-[#18181b] rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-800 p-6 sm:p-8 space-y-6 text-white my-auto print:bg-white print:text-black"
          >
            {/* Header / Invoice Branding */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 print:border-zinc-300 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl text-red-600 font-black">MOTOSHOP</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-red-950/80 text-red-400 font-bold border border-red-800/50 print:bg-zinc-100 print:text-zinc-800 print:border-zinc-300">
                    SERVICE CRM
                  </span>
                </div>
                <p className="text-xs text-zinc-400 print:text-zinc-600 mt-1">
                  Trung tâm dịch vụ kỹ thuật & Chăm sóc xe máy chuyên nghiệp
                </p>
                <p className="text-[11px] text-zinc-500 print:text-zinc-600">
                  Địa chỉ: 123 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh · Hotline: 1900 6868
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-3 py-1 rounded-full uppercase inline-block print:bg-zinc-100 print:text-black print:border-zinc-400">
                  ✓ ĐÃ HOÀN TẤT & NGHIỆM THU
                </span>
                <div className="text-xs font-mono text-zinc-300 print:text-zinc-700 mt-2">
                  Số HĐ: <strong className="text-white print:text-black font-bold">#HD-DV-{selectedServiceInvoice.id}</strong>
                </div>
                <div className="text-[11px] text-zinc-400 print:text-zinc-600 font-mono">
                  Ngày lập: {selectedServiceInvoice.ngayHen}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center py-1">
              <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-white print:text-black">
                HÓA ĐƠN DỊCH VỤ & BIÊN BẢN BÀN GIAO
              </h2>
              <p className="text-xs text-zinc-400 print:text-zinc-600 font-mono">
                Mã lịch hẹn gốc: #{selectedServiceInvoice.id}
              </p>
            </div>

            {/* Customer & Vehicle Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#141416] print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 text-xs">
              <div className="space-y-1.5">
                <div className="font-bold text-red-400 print:text-zinc-800 uppercase font-mono tracking-wider text-[11px]">
                  THÔNG TIN KHÁCH HÀNG
                </div>
                <div>
                  <span className="text-zinc-400 print:text-zinc-600">Họ và tên: </span>
                  <strong className="text-white print:text-black">{selectedServiceInvoice.hoTenKH || currentCustomer?.hoTen}</strong>
                </div>
                <div>
                  <span className="text-zinc-400 print:text-zinc-600">Số điện thoại: </span>
                  <span className="text-white print:text-black font-mono">{selectedServiceInvoice.soDienThoai || currentCustomer?.soDienThoai}</span>
                </div>
                <div>
                  <span className="text-zinc-400 print:text-zinc-600">Mã khách hàng: </span>
                  <span className="text-zinc-300 print:text-zinc-700 font-mono">{selectedServiceInvoice.customerId || currentCustomer?.id}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-blue-400 print:text-zinc-800 uppercase font-mono tracking-wider text-[11px]">
                  THÔNG TIN PHƯƠNG TIỆN
                </div>
                <div>
                  <span className="text-zinc-400 print:text-zinc-600">Phương tiện: </span>
                  <strong className="text-white print:text-black">{selectedServiceInvoice.tenXe || 'Xe máy'}</strong>
                </div>
                <div>
                  <span className="text-zinc-400 print:text-zinc-600">Biển số đăng ký: </span>
                  <strong className="text-white print:text-black font-mono">{selectedServiceInvoice.bienSo || 'Chưa bấm biển'}</strong>
                </div>
                {selectedServiceInvoice.soKhungVIN && (
                  <div>
                    <span className="text-zinc-400 print:text-zinc-600">Số khung (VIN): </span>
                    <span className="text-zinc-300 print:text-zinc-700 font-mono">{selectedServiceInvoice.soKhungVIN}</span>
                  </div>
                )}
                {selectedServiceInvoice.soMay && (
                  <div>
                    <span className="text-zinc-400 print:text-zinc-600">Số máy: </span>
                    <span className="text-zinc-300 print:text-zinc-700 font-mono">{selectedServiceInvoice.soMay}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Service & Work Details Table */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-zinc-300 print:text-zinc-800 uppercase font-mono text-[11px]">
                  CHI TIẾT HẠNG MỤC DỊCH VỤ & BÀN GIAO
                </div>
                <div className="text-[11px] text-zinc-400 print:text-zinc-600">
                  KTV thực hiện: <strong className="text-white print:text-black">{selectedServiceInvoice.nhanVienPhuTrach || 'KTV Xưởng Dịch Vụ Motoshop'}</strong>
                </div>
              </div>

              <div className="border border-zinc-800 print:border-zinc-300 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 print:bg-zinc-100 text-zinc-300 print:text-zinc-800 border-b border-zinc-800 print:border-zinc-300 font-mono">
                      <th className="py-2.5 px-3">STT</th>
                      <th className="py-2.5 px-3">Nội dung công việc / Vật tư phụ tùng</th>
                      <th className="py-2.5 px-3 text-center">ĐVT</th>
                      <th className="py-2.5 px-3 text-center">SL</th>
                      <th className="py-2.5 px-3 text-right">Đơn giá</th>
                      <th className="py-2.5 px-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 print:divide-zinc-200 text-zinc-200 print:text-zinc-800">
                    <tr>
                      <td className="py-2.5 px-3 text-center font-mono">01</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white print:text-black">
                          {SVC_LABELS[selectedServiceInvoice.loaiDichVu] || selectedServiceInvoice.loaiDichVu}
                        </div>
                        <div className="text-[11px] text-zinc-400 print:text-zinc-600">
                          {selectedServiceInvoice.ghiChu || 'Kiểm tra tổng quát, vệ sinh và cân chỉnh các bộ phận vận hành an toàn'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">Gói</td>
                      <td className="py-2.5 px-3 text-center font-mono">1</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {selectedServiceInvoice.loaiDichVu === 'BaoHanh' ? '0 đ' : '200.000 đ'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {selectedServiceInvoice.loaiDichVu === 'BaoHanh' ? '0 đ' : '200.000 đ'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-center font-mono">02</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white print:text-black">Dầu nhớt động cơ chính hãng / Vật tư phụ</div>
                        <div className="text-[11px] text-zinc-400 print:text-zinc-600">
                          {selectedServiceInvoice.loaiDichVu === 'BaoHanh' ? 'Miễn phí theo chế độ bảo hành xe' : 'Nhớt máy cao cấp 4T Motul / Castrol 0.8L'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">Chai</td>
                      <td className="py-2.5 px-3 text-center font-mono">1</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {selectedServiceInvoice.loaiDichVu === 'BaoHanh' ? '0 đ' : '150.000 đ'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {selectedServiceInvoice.loaiDichVu === 'BaoHanh' ? '0 đ' : '150.000 đ'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-center font-mono">03</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white print:text-black">Kiểm tra áp suất lốp, phanh và rửa xe tiêu chuẩn</div>
                        <div className="text-[11px] text-zinc-400 print:text-zinc-600">Gói ưu đãi chăm sóc khách hàng Motoshop VIP</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">Lần</td>
                      <td className="py-2.5 px-3 text-center font-mono">1</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400 print:text-emerald-700">Miễn phí</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 print:text-emerald-700">0 đ</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-900/60 print:bg-zinc-100 font-bold border-t border-zinc-800 print:border-zinc-300">
                      <td colSpan={5} className="py-3 px-3 text-right uppercase tracking-wider font-mono">
                        TỔNG CỘNG THANH TOÁN:
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-red-400 print:text-red-700 text-sm">
                        {selectedServiceInvoice.loaiDichVu === 'BaoHanh' ? '0 đ' : '350.000 đ'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Signatures for handover */}
            <div className="grid grid-cols-2 gap-4 pt-4 text-center text-xs print:pt-8">
              <div className="space-y-10">
                <div className="font-bold uppercase text-zinc-300 print:text-zinc-800">KHÁCH HÀNG NHẬN XE</div>
                <div className="text-[11px] text-zinc-400 print:text-zinc-600 italic">
                  (Ký và ghi rõ họ tên)<br />
                  <strong className="text-white print:text-black not-italic mt-2 block font-medium">
                    {selectedServiceInvoice.hoTenKH || currentCustomer?.hoTen}
                  </strong>
                </div>
              </div>
              <div className="space-y-10">
                <div className="font-bold uppercase text-zinc-300 print:text-zinc-800">ĐẠI DIỆN TRUNG TÂM DỊCH VỤ</div>
                <div className="text-[11px] text-zinc-400 print:text-zinc-600 italic">
                  (Kỹ thuật viên ký xác nhận bàn giao)<br />
                  <strong className="text-white print:text-black not-italic mt-2 block font-medium">
                    {selectedServiceInvoice.nhanVienPhuTrach || 'KTV Xưởng Motoshop'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Actions: In & Đóng */}
            <div className="pt-4 border-t border-zinc-800 print:border-zinc-300 flex items-center justify-between no-print">
              <span className="text-[11px] text-zinc-500 italic">
                * Hóa đơn điện tử có giá trị tra cứu và bảo hành dịch vụ tại toàn bộ hệ thống đại lý.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-700 hover:bg-cyan-600 text-white shadow-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>🖨️</span> In hóa đơn / Lưu PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedServiceInvoice(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: XÁC NHẬN HỦY LỊCH HẸN (LH06) ── */}
      {cancelConfirmAppt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#18181b] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <h3 className="font-extrabold text-sm uppercase text-red-400">XÁC NHẬN HỦY LỊCH HẸN #{cancelConfirmAppt.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelConfirmAppt(null)}
                className="text-zinc-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#141416] border border-zinc-800 text-xs space-y-1">
              <div>Dịch vụ: <strong className="text-white">{SVC_LABELS[cancelConfirmAppt.loaiDichVu] || cancelConfirmAppt.loaiDichVu}</strong></div>
              <div>Phương tiện: <strong className="text-zinc-200">{cancelConfirmAppt.tenXe || 'Xe máy'}</strong> ({cancelConfirmAppt.bienSo || 'Chưa biển'})</div>
              <div className="text-red-400 font-mono">Thời gian: {cancelConfirmAppt.ngayHen} lúc {cancelConfirmAppt.gioHen}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">
                Vui lòng chọn lý do hủy lịch:
              </label>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600"
              >
                <option value="Thay đổi kế hoạch cá nhân">Thay đổi kế hoạch cá nhân</option>
                <option value="Bận công việc đột xuất">Bận công việc đột xuất</option>
                <option value="Muốn đổi sang ngày hoặc khung giờ khác">Muốn đổi sang ngày hoặc khung giờ khác</option>
                <option value="Đã tự khắc phục xong sự cố xe">Đã tự khắc phục xong sự cố xe</option>
                <option value="Khác">Lý do khác...</option>
              </select>
            </div>

            {cancelReason === 'Khác' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Chi tiết lý do khác:</label>
                <textarea
                  rows={2}
                  value={customCancelReason}
                  onChange={e => setCustomCancelReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể..."
                  className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs focus:outline-none focus:border-red-600 resize-none"
                />
              </div>
            )}

            <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/50 text-[11px] text-red-300">
              ℹ️ Lịch hẹn sau khi hủy sẽ chuyển sang trạng thái <strong>"Đã hủy"</strong> và tự động xóa khỏi danh sách tiếp nhận trên hệ thống.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCancelConfirmAppt(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="button"
                disabled={isCancellingAppt}
                onClick={handleConfirmCancelAppointment}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {isCancellingAppt ? 'Đang hủy...' : 'Xác nhận hủy lịch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: LIÊN HỆ SHOWROOM HỖ TRỢ LỊCH HẸN (LH11 - Chuẩn Ảnh 2) ── */}
      {contactModalAppt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#18181b] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <span className="text-xl p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/80">📞</span>
                <div>
                  <h3 className="font-extrabold text-sm uppercase text-cyan-400">LIÊN HỆ HỖ TRỢ LỊCH HẸN</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">Phiếu #{contactModalAppt.id} · {contactModalAppt.tenXe || 'Xe máy'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContactModalAppt(null)}
                className="text-zinc-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#141416] border border-zinc-800 space-y-3 text-xs">
              <div>
                <span className="text-zinc-400 block text-[11px]">Showroom tiếp nhận xe:</span>
                <span className="font-bold text-white text-sm">Motoshop Showroom & Service Center</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">📍 123 Nguyễn Văn Cừ, Phường 2, Quận 5, TP. Hồ Chí Minh</p>
              </div>

              <div className="pt-2.5 border-t border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-zinc-400 block text-[11px]">Tổng đài hỗ trợ 24/7:</span>
                  <span className="font-mono font-extrabold text-red-500 text-lg">1900 6868</span>
                  <span className="text-[10px] text-zinc-500 block">Thời gian: 08:00 - 18:00 (T2 - T7)</span>
                </div>
                <a
                  href="tel:19006868"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📞</span> GỌI NGAY
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setContactModalAppt(null);
                  window.dispatchEvent(new CustomEvent('crm-open-chat', { detail: { apptId: contactModalAppt.id } }));
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer flex items-center justify-center gap-1.5 border border-zinc-700"
              >
                <span>💬</span> Nhắn tin CSKH trực tuyến
              </button>
              <button
                type="button"
                onClick={() => setContactModalAppt(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast thông báo Mua lại thành công */}
      {reorderToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-emerald-500/50 text-white shadow-2xl animate-slideUp">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base">
            ✓
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-400">Thành công!</div>
            <div className="text-xs text-zinc-300">{reorderToast.message}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setReorderToast(null);
              if (onNavigateToCheckout) onNavigateToCheckout();
              else window.dispatchEvent(new CustomEvent('crm-navigate-checkout'));
            }}
            className="ml-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md whitespace-nowrap"
          >
            Đến giỏ hàng ➔
          </button>
          <button
            type="button"
            onClick={() => setReorderToast(null)}
            className="text-zinc-500 hover:text-zinc-300 font-bold text-sm ml-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
