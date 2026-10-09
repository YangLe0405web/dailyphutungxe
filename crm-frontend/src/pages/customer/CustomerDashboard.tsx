import { useState, useEffect, useMemo } from 'react';
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
} from '../../services/api';
import ImageUploader from '../../components/shared/ImageUploader';
import { WarrantyDetailView, WarrantyClaimFormView, ExtendedWarrantyModal } from '../../components/customer/WarrantyViews';
import WarrantyExtensionWizard from '../../components/customer/WarrantyExtensionWizard';
import OnlineInsurancePurchaseView from '../../components/customer/OnlineInsurancePurchaseView';
import RenewInsuranceModal from '../../components/customer/RenewInsuranceModal';

interface CustomerDashboardProps {
  currentCustomer: Customer | null;
  onNavigateToShowroom?: () => void;
  onNavigateToSurvey?: () => void;
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
  DaXacNhan: { label: 'Đã xác nhận', color: '#0284c7', bg: '#e0f2fe' },
  DangGiao: { label: 'Đang giao', color: '#2563eb', bg: '#dbeafe' },
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
function DynamicSurveyTab({ customer }: { customer: Customer }) {
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [answersMap, setAnswersMap] = useState<Record<string, Record<string, string>>>({});
  const [unansweredMap, setUnansweredMap] = useState<Record<string, string[]>>({});
  const [surveyToast, setSurveyToast] = useState<{ show: boolean; title: string; countdown: number } | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const loadSurveys = () => {
    const all = surveyApi.getAll();
    const custTier = getCustomerTier(customer.tongChiTieu).tier;

    // KS02: Hiển thị đầy đủ bài khảo sát mà khách đủ điều kiện
    const eligible = all.filter(s => {
      if (s.targetCustomerId === customer.id) return true;
      if (s.targetCustomerIds && s.targetCustomerIds.includes(customer.id)) return true;
      if (s.targetCustomerId === 'ALL' || !s.targetCustomerId) {
        if (!s.targetCustomerTier || s.targetCustomerTier === 'ALL') return true;
        if (s.targetCustomerTier === custTier) return true;
      }
      return false;
    });

    setActiveSurveys(eligible);

    const responses = surveyApi.getResponses();
    const done = responses
      .filter(r => r.customerId === customer.id)
      .map(r => r.surveyId);
    setCompletedIds(done);
  };

  useEffect(() => {
    loadSurveys();
    window.addEventListener('crm-data-refresh', loadSurveys);
    return () => window.removeEventListener('crm-data-refresh', loadSurveys);
  }, [customer.id]);

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

            return (
              <div key={survey.id} className="p-6 rounded-3xl bg-[#141417] border border-zinc-800 space-y-4">
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
  onCustomerChange,
}: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>(mockOrders);
  const [allAppts, setAllAppts] = useState<Appointment[]>(mockAppointments);
  const [myInsurances, setMyInsurances] = useState<InsuranceContract[]>([]);

  // Sub-tabs
  const [ordersSubTab, setOrdersSubTab] = useState<'Xe' | 'PhuTung'>('Xe');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'TatCa' | 'ChoDuyet' | 'DangGiao' | 'HoanThanh' | 'DaHuy'>('TatCa');
  const [orderTimeFilter, setOrderTimeFilter] = useState<string>('30days');

  const [apptsSubTab, setApptsSubTab] = useState<'Tong' | 'SuaChua' | 'BaoDuong' | 'LaiThu' | 'BaoHanh'>('Tong');
  const [serviceHistSubTab, setServiceHistSubTab] = useState<'TatCa' | 'BaoDuong' | 'SuaChua' | 'LaiThu' | 'BaoHanh'>('TatCa');
  const [serviceSearch, setServiceSearch] = useState('');

  const [surveySubTab, setSurveySubTab] = useState<'ChoDanhGia' | 'DaDanhGia' | 'KhaoSatHeThong'>('ChoDanhGia');

  // Modals state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordToast, setPasswordToast] = useState<string | null>(null);

  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState<'TatCa' | 'CuaHang' | 'NgoaiHeThong' | 'DangBaoHanh' | 'CoBaoHiem'>('TatCa');
  const [selectedDetailVehicle, setSelectedDetailVehicle] = useState<Vehicle | null>(null);
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
    mauSac: 'Đen bóng',
    namSanXuat: '2025',
    anhCaVet: '',
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
  const [reviewModalPart, setReviewModalPart] = useState<{ partName: string; orderId: string } | null>(null);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewToast, setReviewToast] = useState<string | null>(null);

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
    orderApi.getAll().then(data => {
      if (data && data.length > 0) setAllOrders(data);
    });
    appointmentApi.getAll().then(data => {
      if (data && data.length > 0) setAllAppts(data);
    });
    try {
      const insList = insuranceApi.getByCustomerId(currentCustomer.id);
      if (insList) setMyInsurances(insList);
    } catch {}
    vehicleApi.getAll().then(data => {
      if (data) {
        const cIdNum = parseInt(currentCustomer.id.replace(/\D/g, ''), 10);
        const vList = data.filter(v => {
          if (v.customerId === currentCustomer.id) return true;
          const vNum = parseInt(v.customerId.replace(/\D/g, ''), 10);
          if (!isNaN(cIdNum) && !isNaN(vNum) && cIdNum === vNum) return true;
          if (currentCustomer.soXe && currentCustomer.soXe === v.id) return true;
          return false;
        });
        setMyVehicles(vList);
      }
    });
  };

  useEffect(() => {
    if (!currentCustomer) {
      setMyVehicles([]);
      setAllOrders([]);
      setAllAppts([]);
      setMyInsurances([]);
      return;
    }
    loadCustomerData();
    const handleRefresh = () => loadCustomerData();
    window.addEventListener('crm-data-refresh', handleRefresh);
    return () => window.removeEventListener('crm-data-refresh', handleRefresh);
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
          else if (parsed.type === 'appointment') setActiveTab(2);
          else if (parsed.type === 'insurance') setActiveTab(4);
          else if (parsed.type === 'survey') setActiveTab(5);
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
        else if (e.detail.type === 'appointment') setActiveTab(2);
        else if (e.detail.type === 'insurance') setActiveTab(4);
        else if (e.detail.type === 'survey') setActiveTab(5);
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
      if (a.customerId === currentCustomer.id) return true;
      const aCustNum = parseInt(a.customerId.replace(/\D/g, ''), 10);
      if (!isNaN(custNum) && !isNaN(aCustNum) && custNum === aCustNum) return true;
      if (custPhone && a.soDienThoai && a.soDienThoai.replace(/\D/g, '') === custPhone) return true;
      if (custName && a.hoTenKH && a.hoTenKH.trim().toLowerCase() === custName) return true;
      return false;
    });
  }, [allAppts, currentCustomer]);

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

  // Real spending & CLV
  const realCustomerSpending = useMemo(() => {
    if (!currentCustomer) return 0;
    const completedOrders = myOrders.filter(o => o.trangThai === 'HoanThanh' || (o.trangThai as any) === 'DaHoanThanh');
    const totalOrderSpent = completedOrders.reduce((sum, o) => sum + (o.tongTien || 0), 0);
    return Math.max(currentCustomer.tongChiTieu || 0, totalOrderSpent);
  }, [myOrders, currentCustomer]);

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
    return myVehicles.filter(v => {
      if (vehicleFilter === 'CuaHang') return v.nguonGoc === 'CuaHang';
      if (vehicleFilter === 'NgoaiHeThong') return v.nguonGoc === 'NgoaiHeThong';
      if (vehicleFilter === 'DangBaoHanh') return v.nguonGoc === 'CuaHang' && v.trangThaiBaoHanh === 'ConHan';
      if (vehicleFilter === 'CoBaoHiem') {
        return myInsurances.some(ins => (ins.vehicleId === v.id || (v.bienSo && ins.bienSo === v.bienSo)) && ins.trangThai !== 'HetHan' && ins.trangThai !== 'TuChoi');
      }
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
        trangThaiDuyet: 'ChoDuyet',
        anhCaVet: regForm.anhCaVet,
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
        mauSac: 'Đen bóng',
        namSanXuat: String(new Date().getFullYear()),
        anhCaVet: '',
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
      setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, trangThai: 'DaHuy', lyDoHuy: reason } : o));
      if (selectedOrderDetail && selectedOrderDetail.id === orderId) {
        setSelectedOrderDetail(prev => prev ? { ...prev, trangThai: 'DaHuy', lyDoHuy: reason } : null);
      }
      setOrderToCancel(null);
      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'order' } }));
    } else {
      alert(res.message);
    }
  };

  // Renew insurance confirm
  const handleConfirmRenewInsurance = (c: InsuranceContract, years: number, paymentMethod: 'ChuyenKhoan' | 'TienMat' = 'ChuyenKhoan') => {
    const res = insuranceApi.renewContract(c.id, years, paymentMethod);
    if (res.success) {
      setRenewToast(res.message);
      setTimeout(() => setRenewToast(null), 5000);
      setRenewingInsuranceContract(null);
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

  const sidebarNavItems = [
    { id: 0, label: 'Phương tiện của tôi', count: myVehicles.length, icon: '🏍️' },
    { id: 1, label: 'Đơn mua hàng', count: myOrders.length, icon: '🛍️' },
    { id: 2, label: 'Lịch hẹn', count: myAppts.length, icon: '📅' },
    { id: 3, label: 'Lịch sử dịch vụ', count: myAppts.filter(a => a.trangThai === 'DaHoanThanh' || a.trangThai === 'HoanThanh').length, icon: '🕒' },
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
            <button
              onClick={() => setActiveTab(2)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-sm"
            >
              Xem chi tiết lịch hẹn →
            </button>
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
                      { key: 'CoBaoHiem', label: `Có bảo hiểm (${myVehicles.filter(v => myInsurances.some(ins => (ins.vehicleId === v.id || (v.bienSo && ins.bienSo === v.bienSo)) && ins.trangThai !== 'HetHan')).length})` },
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
                        const isBaoHanhConHan = isCuaHang && v.trangThaiBaoHanh === 'ConHan';
                        const curIns = myInsurances.find(ins => ins.vehicleId === v.id || (v.bienSo && ins.bienSo === v.bienSo));
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
                                      ⏳ Chờ duyệt
                                    </span>
                                  )}
                                </div>

                                <div className="w-full h-40 rounded-2xl overflow-hidden bg-zinc-900 relative group">
                                  <img
                                    src={v.hinhAnh || fallbackImg}
                                    alt={v.tenXe}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={e => { e.currentTarget.src = fallbackImg; }}
                                  />
                                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-xs text-white text-[11px] font-mono font-bold">
                                    {v.bienSo || 'Chưa có biển'}
                                  </div>
                                </div>
                              </div>

                              {/* Vehicle Title */}
                              <div className="px-5 pt-1 pb-3">
                                <h3 className="font-extrabold text-base text-white uppercase truncate">{v.tenXe}</h3>
                                <div className="text-xs text-zinc-400 font-mono mt-0.5">
                                  {v.bienSo} · {v.mauSac || 'Tiêu chuẩn'} · {v.namSanXuat}
                                </div>
                              </div>

                              {/* Banner cập nhật biển số nếu xe mua cửa hàng chưa có biển */}
                              {isCuaHang && (v.trangThaiDuyetBienSo === 'ChoCapNhat' || !v.bienSo || v.bienSo === 'Chưa có biển số') && (
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

                            {/* 4 Actions Grid */}
                            <div className="p-4 pt-0 border-t border-zinc-800/80 mt-2">
                              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDetailVehicle(v)}
                                  className="py-2 px-2 rounded-xl font-bold bg-[#1e1e24] hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition cursor-pointer"
                                >
                                  🔍 Chi tiết
                                </button>

                                {isBaoHanhConHan ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedVehicleWarrantyDetail(v)}
                                    className="py-2 px-2 rounded-xl font-bold bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 transition cursor-pointer"
                                  >
                                    📅 Bảo hành
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="py-2 px-2 rounded-xl font-medium bg-[#141416] text-zinc-600 border border-zinc-800 cursor-not-allowed"
                                  >
                                    🔒 Bảo hành
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

                  {/* Sub-tabs: Xe vs Phụ Tùng */}
                  <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#141416] border border-zinc-800 self-start sm:self-auto">
                    <button
                      onClick={() => setOrdersSubTab('Xe')}
                      className={`px-6 py-2 rounded-xl text-xs font-extrabold uppercase transition cursor-pointer ${
                        ordersSubTab === 'Xe' ? 'bg-red-700 text-white shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      🏍️ Xe ({myOrders.filter(o => o.loaiDon === 'Xe' || o.thongTinXe).length})
                    </button>
                    <button
                      onClick={() => setOrdersSubTab('PhuTung')}
                      className={`px-6 py-2 rounded-xl text-xs font-extrabold uppercase transition cursor-pointer ${
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
                        const isCompleted = order.trangThai === 'HoanThanh';
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
                              <StatusBadge {...cfg} />
                            </div>

                            {/* Xe vs Phụ Tùng content */}
                            {isXe ? (
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
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {order.items.map((it, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-zinc-800/60 last:border-none">
                                    <span className="text-zinc-200">
                                      {it.tenSanPham} <span className="text-zinc-500 font-mono">×{it.soLuong}</span>
                                    </span>
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono font-bold text-white">{formatVND(it.donGia * it.soLuong)}</span>
                                      {isCompleted && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReviewModalPart({ partName: it.tenSanPham, orderId: order.id });
                                            setReviewStars(5);
                                            setReviewContent('');
                                          }}
                                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                        >
                                          <span>⭐ Đánh giá</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Bottom row: Total & Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800 text-xs">
                              <div className="text-zinc-400">📍 Giao tới: {order.diaChiGiao}</div>
                              <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                                <div className="text-sm font-black font-mono text-red-400">
                                  {formatVND(order.tongTien)}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderDetail(order)}
                                  className="px-3 py-1.5 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer border border-zinc-700"
                                >
                                  👁️ Chi tiết
                                </button>

                                {(order.trangThai === 'ChoDuyet' || order.trangThai === 'DaXacNhan' || order.trangThai === 'ChoGiaoXe') && (
                                  <button
                                    type="button"
                                    onClick={() => setOrderToCancel(order)}
                                    className="px-3 py-1.5 rounded-xl font-bold bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 transition cursor-pointer"
                                  >
                                    ✕ Hủy đơn
                                  </button>
                                )}

                                {isCompleted && isXe && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReviewModalPart({ partName: order.thongTinXe?.tenXe || 'Xe máy chính hãng', orderId: order.id });
                                      setReviewStars(5);
                                      setReviewContent('');
                                    }}
                                    className="px-3 py-1.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer flex items-center gap-1 shadow"
                                  >
                                    <span>⭐ Đánh giá xe</span>
                                  </button>
                                )}
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
                    {/* Calendar visual (Left 2 cols) */}
                    <div className="lg:col-span-2 p-6 rounded-3xl bg-[#141416] border border-zinc-800 space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                        <div className="font-extrabold text-sm text-white uppercase">THÁNG 10 / 2026</div>
                        <div className="text-xs text-zinc-400 font-mono">Showroom Motoshop</div>
                      </div>

                      <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                          <div key={d} className="font-bold text-zinc-500 py-1">{d}</div>
                        ))}
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                          const hasAppt = myAppts.some(a => {
                            const dNum = parseInt((a.ngayHen || '').split('-')[2] || '0', 10);
                            return dNum === day;
                          });
                          return (
                            <div
                              key={day}
                              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center ${
                                hasAppt
                                  ? 'bg-red-950/80 border-red-600 text-red-200 shadow-xs'
                                  : 'bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                              }`}
                            >
                              <span>{day}</span>
                              {hasAppt && <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right summary column */}
                    <div className="p-6 rounded-3xl bg-[#141416] border border-zinc-800 space-y-4">
                      <div className="font-extrabold text-sm text-white uppercase border-b border-zinc-800 pb-3">
                        LỊCH HẸN GẦN NHẤT
                      </div>
                      {myAppts.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 text-xs">Chưa có lịch hẹn nào</div>
                      ) : (
                        <div className="space-y-3">
                          {myAppts.slice(0, 3).map(a => (
                            <div key={a.id} className="p-3.5 rounded-2xl bg-[#18181b] border border-zinc-800 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-red-400 uppercase">{SVC_LABELS[a.loaiDichVu] || a.loaiDichVu}</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">#{a.id}</span>
                              </div>
                              <div className="font-mono text-zinc-200">📅 {a.ngayHen} lúc {a.gioHen}</div>
                              <div className="text-zinc-400">Xe: {a.tenXe || 'Xe máy'} ({a.bienSo || 'Chưa có'})</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const filtered = myAppts.filter(a => {
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
                  const completedAppts = myAppts.filter(a => a.trangThai === 'DaHoanThanh' || a.trangThai === 'HoanThanh');
                  const filtered = completedAppts.filter(a => {
                    if (serviceHistSubTab === 'BaoDuong' && a.loaiDichVu !== 'BaoDuong') return false;
                    if (serviceHistSubTab === 'SuaChua' && a.loaiDichVu !== 'SuaChua') return false;
                    if (serviceHistSubTab === 'LaiThu' && a.loaiDichVu !== 'LaiThu') return false;
                    if (serviceHistSubTab === 'BaoHanh' && a.loaiDichVu !== 'BaoHanh') return false;
                    if (serviceSearch.trim()) {
                      const q = serviceSearch.toLowerCase();
                      const matchPlate = (a.bienSo || '').toLowerCase().includes(q);
                      const matchName = (a.tenXe || '').toLowerCase().includes(q);
                      const matchId = (a.id || '').toLowerCase().includes(q);
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
                              <button
                                type="button"
                                onClick={() => alert(`Xem chi tiết dịch vụ #${item.id}`)}
                                className="px-3 py-1.5 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
                              >
                                👁️ Chi tiết
                              </button>
                              <button
                                type="button"
                                onClick={() => window.print()}
                                className="px-3 py-1.5 rounded-xl font-bold bg-[#1e1e24] hover:bg-zinc-800 text-zinc-300 transition cursor-pointer"
                              >
                                📄 Xem hóa đơn / Biên bản
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
                  {myVehicles.length === 0 ? (
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
                  ) : (
                    <div className="space-y-6">
                      {myVehicles.map(veh => {
                        const vehInsurances = myInsurances.filter(
                          ins => ins.vehicleId === veh.id || (veh.bienSo && ins.bienSo === veh.bienSo)
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
                                    src={veh.hinhAnh || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80'}
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
                                          onClick={() => setRenewingInsuranceContract(c)}
                                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 transition cursor-pointer"
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
                    </div>
                  )}
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
                      { key: 'ChoDanhGia', label: '✍️ Chờ đánh giá' },
                      { key: 'DaDanhGia', label: '☑️ Đã đánh giá' },
                      { key: 'KhaoSatHeThong', label: '📊 Khảo sát hệ thống' },
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

                {/* Sub-tab 1: Chờ đánh giá */}
                {surveySubTab === 'ChoDanhGia' && (
                  <div className="space-y-4">
                    <div className="p-5 rounded-3xl bg-[#141416] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">DỊCH VỤ BẢO DƯỠNG</span>
                        <h4 className="font-extrabold text-base text-white">Bảo dưỡng định kỳ 5.000km xe SH 160i</h4>
                        <div className="text-xs text-zinc-400">Đã hoàn thành ngày 12/10/2026 tại Showroom Lê Văn Sỹ</div>
                      </div>
                      <button
                        onClick={() => {
                          setReviewModalPart({ partName: 'Bảo dưỡng định kỳ 5.000km', orderId: 'DV-121026' });
                          setReviewStars(5);
                          setReviewContent('');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase transition cursor-pointer shadow"
                      >
                        VIẾT ĐÁNH GIÁ (5★)
                      </button>
                    </div>

                    <div className="p-5 rounded-3xl bg-[#141416] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">SẢN PHẨM PHỤ TÙNG</span>
                        <h4 className="font-extrabold text-base text-white">Lốp Michelin Pilot Street 2 (Cặp trước/sau)</h4>
                        <div className="text-xs text-zinc-400">Đơn hàng #MS-009842 · Giao hàng thành công</div>
                      </div>
                      <button
                        onClick={() => {
                          setReviewModalPart({ partName: 'Lốp Michelin Pilot Street 2', orderId: 'MS-009842' });
                          setReviewStars(5);
                          setReviewContent('');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase transition cursor-pointer shadow"
                      >
                        VIẾT ĐÁNH GIÁ (5★)
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-tab 2: Đã đánh giá */}
                {surveySubTab === 'DaDanhGia' && (
                  <div className="space-y-4">
                    <div className="p-5 rounded-3xl bg-[#141416] border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-sm text-white">Nhớt Motul 7100 4T 10W40 1L</h4>
                        <div className="text-amber-400 text-sm">⭐⭐⭐⭐⭐</div>
                      </div>
                      <p className="text-xs text-zinc-300">"Nhớt xài rất êm máy, chạy đường dài không bị nóng. Showroom giao hàng nhanh!"</p>
                      <div className="text-[11px] text-zinc-500 font-mono">Đã gửi ngày 05/10/2026</div>
                    </div>
                  </div>
                )}

                {/* Sub-tab 3: Khảo sát hệ thống (DynamicSurveyTab) */}
                {surveySubTab === 'KhaoSatHeThong' && (
                  <DynamicSurveyTab customer={currentCustomer} />
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
                    type="number"
                    value={regForm.namSanXuat}
                    onChange={e => setRegForm({ ...regForm, namSanXuat: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-700 bg-[#121214] text-white text-xs font-mono focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800">
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

      {/* Modal Xem chi tiết phương tiện */}
      {selectedDetailVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181b] rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-zinc-800 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-base uppercase">🏍️ CHI TIẾT PHƯƠNG TIỆN</h3>
              <button onClick={() => setSelectedDetailVehicle(null)} className="text-zinc-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-800"><span className="text-zinc-400">Tên xe:</span> <strong className="text-white">{selectedDetailVehicle.tenXe}</strong></div>
              <div className="flex justify-between py-1 border-b border-zinc-800"><span className="text-zinc-400">Biển số:</span> <strong className="text-red-400 font-mono">{selectedDetailVehicle.bienSo}</strong></div>
              <div className="flex justify-between py-1 border-b border-zinc-800"><span className="text-zinc-400">Số khung:</span> <span className="text-zinc-200 font-mono">{selectedDetailVehicle.soKhung || 'Chưa có'}</span></div>
              <div className="flex justify-between py-1 border-b border-zinc-800"><span className="text-zinc-400">Số máy:</span> <span className="text-zinc-200 font-mono">{selectedDetailVehicle.soMay || 'Chưa có'}</span></div>
              <div className="flex justify-between py-1 border-b border-zinc-800"><span className="text-zinc-400">Năm sản xuất:</span> <span className="text-zinc-200 font-mono">{selectedDetailVehicle.namSanXuat}</span></div>
              <div className="flex justify-between py-1 border-b border-zinc-800"><span className="text-zinc-400">Nguồn gốc:</span> <span className="text-zinc-200">{selectedDetailVehicle.nguonGoc === 'CuaHang' ? 'Mua tại cửa hàng' : 'Xe ngoài hệ thống'}</span></div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => setSelectedDetailVehicle(null)}
                className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem chi tiết đơn hàng */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181b] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-800 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base uppercase">CHI TIẾT ĐƠN HÀNG #{selectedOrderDetail.id}</h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">Ngày đặt: {selectedOrderDetail.ngayDat}</p>
              </div>
              <button onClick={() => setSelectedOrderDetail(null)} className="text-zinc-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="p-3 rounded-2xl bg-[#121214] border border-zinc-800 text-xs space-y-1">
              <div>Người nhận: <strong>{selectedOrderDetail.hoTenKH}</strong></div>
              <div>SĐT: <strong className="font-mono">{selectedOrderDetail.soDienThoai}</strong></div>
              <div>Địa chỉ: {selectedOrderDetail.diaChiGiao}</div>
              <div>Thanh toán: {selectedOrderDetail.phuongThucThanhToan === 'ChuyenKhoan' ? 'Chuyển khoản Online' : 'Tiền mặt (COD)'}</div>
            </div>

            <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-2xl flex justify-between items-center text-xs">
              <span className="font-bold text-zinc-300">TỔNG TIỀN:</span>
              <strong className="text-base font-extrabold text-red-400 font-mono">{formatVND(selectedOrderDetail.tongTien)}</strong>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
                disabled={reviewSubmitting || !reviewContent.trim()}
                onClick={async () => {
                  if (!currentCustomer || !reviewModalPart) return;
                  setReviewSubmitting(true);
                  try {
                    await feedbackApi.create({
                      customerId: currentCustomer.id,
                      hoTen: currentCustomer.hoTen,
                      soDienThoai: currentCustomer.soDienThoai,
                      noiDung: reviewContent.trim(),
                      diemDanhGia: reviewStars,
                      productName: reviewModalPart.partName,
                      productType: 'PhuTung',
                    });
                    setReviewToast('🎉 Cảm ơn bạn đã gửi đánh giá!');
                    setTimeout(() => setReviewToast(null), 4000);
                    setReviewModalPart(null);
                  } catch (err) {
                    alert('Gửi đánh giá không thành công.');
                  } finally {
                    setReviewSubmitting(false);
                  }
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow cursor-pointer disabled:opacity-50"
              >
                {reviewSubmitting ? 'Đang gửi...' : 'Gửi nhận xét'}
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
    </div>
  );
}
