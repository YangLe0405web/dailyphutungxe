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
} from '../../data/mockData';
import { customerApi, vehicleApi, feedbackApi, surveyApi, orderApi, appointmentApi, insuranceApi } from '../../services/api';
import ImageUploader from '../../components/shared/ImageUploader';

interface CustomerDashboardProps {
  currentCustomer: Customer | null;
  onNavigateToShowroom?: () => void;
  onNavigateToSurvey?: () => void;
  onCustomerChange?: (c: Customer | null) => void;
}

const orderStatusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  ChoDuyet: { label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
  DangGiao: { label: 'Đang giao', color: '#2563eb', bg: '#dbeafe' },
  HoanThanh: { label: 'Hoàn thành', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  DaHuy: { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
};

const apptStatusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  ChoXacNhan: { label: 'Chờ xác nhận', color: '#d97706', bg: '#fef3c7' },
  DaXacNhan: { label: 'Đã xác nhận', color: '#2563eb', bg: '#dbeafe' },
  TuChoi: { label: 'Từ chối', color: '#dc2626', bg: '#fee2e2' },
  DaHoanThanh: { label: 'Đã hoàn thành', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  DaHuy: { label: 'Đã hủy', color: '#71717a', bg: '#f4f4f5' },
  // Backward compatibility
  ChoDuyet: { label: 'Chờ xác nhận', color: '#d97706', bg: '#fef3c7' },
  DangThucHien: { label: 'Đang thực hiện', color: '#2563eb', bg: '#dbeafe' },
  HoanThanh: { label: 'Đã hoàn thành', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
};

const insStatusConfig: Record<InsuranceStatus, { label: string; color: string; bg: string }> = {
  HieuLuc: { label: 'Còn hiệu lực', color: '#16a34a', bg: '#dcfce7' },
  ChoDuyet: { label: 'Chờ duyệt hồ sơ', color: '#d97706', bg: '#fef3c7' },
  HetHan: { label: 'Hết hạn', color: '#71717a', bg: '#f4f4f5' },
  TuChoi: { label: 'Bị từ chối', color: '#dc2626', bg: '#fee2e2' },
};

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full text-xs font-600 px-2.5 py-1"
      style={{ background: bg, color, fontFamily: 'var(--font-mono)' }}>
      <span className="rounded-full" style={{ width: 6, height: 6, background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

const SVC_LABELS: Record<string, string> = { BaoDuong: 'Bảo dưỡng', SuaChua: 'Sửa chữa', LaiThu: 'Lái thử xe' };

/* ── Survey Component for Admin-assigned Surveys (KS01 - KS08) ── */
function DynamicSurveyTab({ customer }: { customer: Customer }) {
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [answersMap, setAnswersMap] = useState<Record<string, Record<string, string>>>({});
  const [unansweredMap, setUnansweredMap] = useState<Record<string, string[]>>({});
  const [surveyToast, setSurveyToast] = useState<{ show: boolean; title: string; countdown: number } | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [showCompletedList, setShowCompletedList] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState('');
  const [feedbackToast, setFeedbackToast] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const loadSurveys = () => {
    const all = surveyApi.getAll();
    const custTier = getCustomerTier(customer.tongChiTieu).tier;

    // KS02: Hiển thị đầy đủ các bài khảo sát mà khách hàng đủ điều kiện tham gia
    const eligible = all.filter(s => {
      // 1. Kiểm tra gửi đích danh cho khách hàng
      if (s.targetCustomerId === customer.id) return true;
      if (s.targetCustomerIds && s.targetCustomerIds.includes(customer.id)) return true;

      // 2. Nếu gửi cho TẤT CẢ (ALL) hoặc không giới hạn khách hàng cụ thể
      if (s.targetCustomerId === 'ALL' || !s.targetCustomerId) {
        // Kiểm tra điều kiện phân hạng
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
        [questionId]: option
      }
    }));

    // KS04: Bỏ cảnh báo lỗi câu hỏi này nếu người dùng đã vừa chọn đáp án
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

    // KS04: Bắt buộc chọn đáp án cho tất cả câu hỏi trước khi gửi
    const sAnswers = answersMap[survey.id] || {};
    const missing = survey.questions
      .filter(q => !sAnswers[q.id] || !sAnswers[q.id].trim())
      .map(q => q.id);

    if (missing.length > 0) {
      setUnansweredMap(prev => ({ ...prev, [survey.id]: missing }));
      setErrorToast(`⚠️ Vui lòng hoàn thành tất cả câu hỏi trước khi gửi khảo sát! (Còn thiếu ${missing.length}/${survey.questions.length} câu)`);
      setTimeout(() => setErrorToast(null), 4000);

      // Cuộn tới câu hỏi đầu tiên chưa trả lời
      const firstMissingEl = document.getElementById(`survey-${survey.id}-q-${missing[0]}`);
      if (firstMissingEl) {
        firstMissingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Gửi câu trả lời
    surveyApi.submitResponse({
      surveyId: survey.id,
      customerId: customer.id,
      customerName: customer.hoTen,
      answers: sAnswers,
    });

    setCompletedIds(prev => [...prev, survey.id]);
    setUnansweredMap(prev => {
      const copy = { ...prev };
      delete copy[survey.id];
      return copy;
    });

    // KS01: Kích hoạt thông báo cảm ơn tạm thời (tự đóng 4s hoặc bấm X)
    setSurveyToast({
      show: true,
      title: survey.title,
      countdown: 4,
    });
  };

  const handleSendFeedback = async () => {
    if (rating === 0) return;
    setSubmittingFeedback(true);
    try {
      await feedbackApi.create({
        customerId: customer.id,
        hoTen: customer.hoTen,
        soDienThoai: customer.soDienThoai,
        email: customer.email,
        diaChi: customer.diaChi,
        noiDung: review.trim() || `Khách hàng gửi đánh giá ${rating} sao cho dịch vụ showroom.`,
        diemDanhGia: rating,
        loaiDanhGia: 'DichVu',
        xeDangDung: customer.soXe,
      });
      setFeedbackToast(true);
      setReview('');
      setRating(0);
    } catch (err) {
      console.warn('Send feedback error:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const active = hovered || rating;
  const starLabels = ['', 'Rất không hài lòng', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng'];

  // Phân chia danh sách khảo sát: Chưa làm vs Đã làm
  const pendingSurveys = activeSurveys.filter(s => !completedIds.includes(s.id));
  const doneSurveys = activeSurveys.filter(s => completedIds.includes(s.id));

  return (
    <div className="flex flex-col gap-6">
      {/* Admin Assigned Surveys */}
      <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: 'var(--color-red-700)' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-zinc-900)' }}>
              KHẢO SÁT TỪ ĐẠI LÝ
            </div>
          </div>
          {pendingSurveys.length > 0 && (
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-red-100 text-red-700">
              Có {pendingSurveys.length} bài khảo sát cần làm
            </span>
          )}
        </div>

        {/* KS01: Khung cảm ơn tự đóng sau 4s hoặc bấm ✕ */}
        {surveyToast && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 shadow-md flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-2xl shrink-0">
                🎉
              </div>
              <div>
                <div className="text-sm font-extrabold text-emerald-950 uppercase tracking-wide">
                  CẢM ƠN BẠN ĐÃ GỬI PHẢN HỒI KHẢO SÁT!
                </div>
                <div className="text-xs text-emerald-800 font-semibold mt-0.5">
                  Bài khảo sát: <span className="font-bold underline">{surveyToast.title}</span> đã được ghi nhận thành công.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded-full border border-emerald-300">
                ⏱ Tự đóng sau {surveyToast.countdown}s
              </span>
              <button
                type="button"
                onClick={() => setSurveyToast(null)}
                className="w-7 h-7 rounded-lg bg-emerald-200 hover:bg-emerald-300 text-emerald-900 font-bold flex items-center justify-center transition cursor-pointer"
                title="Đóng thông báo"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Error Toast for missing answers */}
        {errorToast && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border-2 border-red-300 shadow-sm flex items-center justify-between gap-3 text-red-900 text-xs font-bold animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{errorToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorToast(null)}
              className="text-red-700 hover:text-red-900 font-bold px-2 py-1 rounded hover:bg-red-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* KS02: Danh sách các bài khảo sát chưa làm */}
        {pendingSurveys.length === 0 ? (
          <div className="text-center py-8 px-4 bg-zinc-50 rounded-2xl border border-zinc-200">
            <div className="text-3xl mb-2">✨</div>
            <h4 className="text-sm font-bold text-zinc-800">
              {doneSurveys.length > 0 ? 'Bạn đã hoàn thành tất cả các bài khảo sát hiện có!' : 'Hiện chưa có cuộc khảo sát nào dành cho bạn.'}
            </h4>
            <p className="text-xs text-zinc-500 mt-1">Cảm ơn bạn đã luôn đồng hành và đóng góp ý kiến xây dựng dịch vụ của showroom.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingSurveys.map(s => {
              const liveStatus = computeSurveyStatus(s);
              const statusCfg = surveyStatusLabels[liveStatus] || surveyStatusLabels.DangDienRa;
              const sAnswers = answersMap[s.id] || {};
              const missingForThis = unansweredMap[s.id] || [];
              const answeredCount = s.questions.filter(q => !!sAnswers[q.id]).length;
              const isAllAnswered = answeredCount === s.questions.length;

              return (
                <div key={s.id} className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50/70 shadow-sm space-y-4">
                  <div className="border-b border-zinc-200 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">
                          MÃ: {s.id}
                        </span>
                        <span
                          className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full"
                          style={{ background: statusCfg.bg, color: statusCfg.text, border: `1px solid ${statusCfg.border}` }}
                        >
                          ● {statusCfg.label}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-zinc-900 text-base" style={{ fontFamily: 'var(--font-display)' }}>
                        {s.title}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">{s.description}</p>
                    </div>

                    {/* KS06: Hiển thị thời gian khảo sát */}
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-mono text-zinc-600 bg-white px-3 py-1.5 rounded-xl border border-zinc-200 inline-block shadow-2xs">
                        📅 <span className="font-semibold text-zinc-800">Thời gian:</span> {formatSurveyDateTime(s.startDate)} - {formatSurveyDateTime(s.endDate)}
                      </div>
                    </div>
                  </div>

                  {/* Danh sách câu hỏi */}
                  <div className="space-y-4">
                    {s.questions.map((q, qi) => {
                      const isMissing = missingForThis.includes(q.id);
                      return (
                        <div
                          key={q.id}
                          id={`survey-${s.id}-q-${q.id}`}
                          className={`p-3.5 rounded-xl transition-all duration-200 ${
                            isMissing
                              ? 'border-2 border-red-500 bg-red-50/40 shadow-xs'
                              : 'border border-zinc-200/80 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="text-sm font-bold text-zinc-900">
                              <span className="text-red-700 font-bold mr-1.5">Câu {qi + 1}.</span>
                              {q.text}
                            </div>
                            {isMissing && (
                              <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded shrink-0">
                                ⚠️ Chưa chọn đáp án
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {q.opts.map(opt => {
                              const sel = sAnswers[q.id] === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleSelectAnswer(s.id, q.id, opt)}
                                  className="rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer"
                                  style={{
                                    border: sel ? '1.5px solid var(--color-red-700)' : '1.5px solid var(--color-zinc-200)',
                                    background: sel ? 'var(--color-red-700)' : 'white',
                                    color: sel ? 'white' : 'var(--color-zinc-700)',
                                    boxShadow: sel ? '0 2px 4px rgba(185, 28, 28, 0.2)' : 'none',
                                  }}
                                >
                                  {sel ? '✓ ' : ''}{opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* KS04: Nút gửi câu trả lời khảo sát có validation */}
                  <div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="text-xs font-mono text-zinc-600">
                      Tiến độ hoàn thành: <strong className={isAllAnswered ? 'text-emerald-700' : 'text-red-700'}>{answeredCount}/{s.questions.length}</strong> câu
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSubmitSurvey(s)}
                      className={`w-full md:w-auto px-6 py-2.5 rounded-xl font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer ${
                        isAllAnswered
                          ? 'bg-red-700 text-white hover:bg-red-800'
                          : 'bg-zinc-800 text-white hover:bg-zinc-900'
                      }`}
                      style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
                    >
                      <span>🚀 GỬI CÂU TRẢ LỜI KHẢO SÁT ({answeredCount}/{s.questions.length})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* KS01: Lịch sử khảo sát đã hoàn thành thu gọn, không chiếm chỗ */}
        {doneSurveys.length > 0 && (
          <div className="mt-6 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setShowCompletedList(!showCompletedList)}
              className="text-xs font-bold text-zinc-600 hover:text-zinc-900 flex items-center gap-2 cursor-pointer"
            >
              <span>{showCompletedList ? '▼' : '▶'}</span>
              <span>LỊCH SỬ KHẢO SÁT ĐÃ HOÀN THÀNH ({doneSurveys.length})</span>
            </button>
            {showCompletedList && (
              <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                {doneSurveys.map(ds => (
                  <div key={ds.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-zinc-800">{ds.title}</span>
                      <span className="text-[10px] font-mono text-zinc-500 ml-2">({ds.id})</span>
                    </div>
                    <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                      ✓ Đã hoàn thành
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Star rating feedback */}
      <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-5 rounded-full" style={{ background: 'var(--color-red-700)' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-zinc-900)' }}>GỬI ĐÁNH GIÁ / KHIẾU NẠI</div>
        </div>

        {feedbackToast ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-base font-bold text-zinc-900">Cảm ơn đánh giá của bạn!</div>
            <p className="text-xs text-zinc-500 mt-1">Phản hồi của bạn đã được gửi trực tiếp tới Ban Quản lý Đại lý.</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-center gap-3 mb-3">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)}
                  onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', transform: active >= s ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.1s' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24"
                    fill={active >= s ? '#f59e0b' : 'none'}
                    stroke={active >= s ? '#f59e0b' : 'var(--color-zinc-200)'}
                    strokeWidth="1.5"
                    style={{ filter: active >= s ? 'drop-shadow(0 2px 6px rgba(245,158,11,0.4))' : 'none', transition: 'all 0.15s' }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
              ))}
            </div>
            {active > 0 && (
              <div className="text-center text-sm font-600 mb-4"
                style={{ color: active >= 4 ? 'var(--color-success)' : active === 3 ? '#d97706' : 'var(--color-red-700)' }}>
                {starLabels[active]}
              </div>
            )}

            <textarea rows={4} value={review} onChange={e => setReview(e.target.value)}
              placeholder="Chia sẻ trải nghiệm, góp ý hoặc khiếu nại của bạn..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--color-zinc-200)', fontSize: 14, fontFamily: 'var(--font-sans)', resize: 'none', outline: 'none', color: 'var(--color-zinc-900)' }} />

            <button
              onClick={handleSendFeedback}
              disabled={rating === 0 || submittingFeedback}
              className="w-full mt-4 py-3 rounded-xl font-700 text-white transition-all"
              style={{
                background: rating > 0 ? 'var(--color-red-700)' : 'var(--color-zinc-300)',
                border: 'none', cursor: rating > 0 ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
              {submittingFeedback ? 'Đang gửi phản hồi...' : rating === 0 ? 'Chọn số sao trước' : 'GỬI PHẢN HỒI'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Edit Customer Profile Modal ── */
function EditProfileModal({ customer, onClose, onSave }: { customer: Customer; onClose: () => void; onSave: (updated: Customer) => void }) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hoTen.trim() || !form.email.trim() || !form.soDienThoai.trim()) return;
    onSave({
      ...customer,
      ...form,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-200">
          <h3 className="font-extrabold text-base text-zinc-900 uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            ✏️ THAY ĐỔI THÔNG TIN CÁ NHÂN
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Họ và tên *</label>
            <input
              type="text"
              required
              value={form.hoTen}
              onChange={e => setForm({ ...form, hoTen: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Số điện thoại *</label>
              <input
                type="tel"
                required
                value={form.soDienThoai}
                onChange={e => setForm({ ...form, soDienThoai: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Địa chỉ giao hàng / cư trú</label>
            <input
              type="text"
              value={form.diaChi}
              onChange={e => setForm({ ...form, diaChi: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                value={form.ngaySinh}
                onChange={e => setForm({ ...form, ngaySinh: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Giới tính</label>
              <select
                value={form.gioiTinh}
                onChange={e => setForm({ ...form, gioiTinh: e.target.value as 'Nam' | 'Nu' })}
                className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
              >
                <option value="Nam">Nam</option>
                <option value="Nu">Nữ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Sở thích phương tiện & nhu cầu *</label>
            <input
              type="text"
              placeholder="VD: Xe tay ga cao cấp, phượt thể thao, tiết kiệm xăng..."
              value={form.soThich}
              onChange={e => setForm({ ...form, soThich: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
            />
          </div>

          <ImageUploader
            value={form.avatar}
            onChange={url => setForm({ ...form, avatar: url })}
            label="Ảnh đại diện Avatar tài khoản"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomerDashboard({ currentCustomer, onNavigateToShowroom, onNavigateToSurvey, onCustomerChange }: CustomerDashboardProps) {
  const [tab, setTab] = useState<number>(0);
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [activeVehicleIndex, setActiveVehicleIndex] = useState(0);

  // Insurance state (BHX02, BHX03, BHX04)
  const [myInsurances, setMyInsurances] = useState<InsuranceContract[]>([]);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [viewingInsuranceContract, setViewingInsuranceContract] = useState<InsuranceContract | null>(null);
  const [insFilterStatus, setInsFilterStatus] = useState<InsuranceStatus | 'All'>('All');
  const [insForm, setInsForm] = useState({
    vehicleId: '',
    customTenXe: '',
    customBienSo: '',
    customSoKhung: '',
    customSoMay: '',
    goiBaoHiem: 'TNDS_BAT_BUOC' as InsurancePackageType,
    thoiHanNam: 1,
    nhaBaoHiem: 'Tổng Công ty Bảo hiểm Bảo Việt',
    ghiChu: '',
  });
  const [insFormErrors, setInsFormErrors] = useState<Record<string, string>>({});
  const [insSubmitting, setInsSubmitting] = useState(false);
  const [insSuccessToast, setInsSuccessToast] = useState(false);

  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [packageChoice, setPackageChoice] = useState('12');
  const [requestSent, setRequestSent] = useState(false);

  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [regForm, setRegForm] = useState({
    hangXe: 'Honda',
    dongXe: 'Wave Alpha',
    customDongXe: '',
    dongCo: '110cc',
    bienSo: '',
    soKhung: '',
    mauSac: 'Đen bóng',
    namSanXuat: '2025',
  });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const [showEditProfile, setShowEditProfile] = useState(false);

  const [allOrders, setAllOrders] = useState<Order[]>(mockOrders);
  const [allAppts, setAllAppts] = useState<Appointment[]>(mockAppointments);

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
    const handleRefresh = () => {
      loadCustomerData();
    };
    window.addEventListener('crm-data-refresh', handleRefresh);
    window.addEventListener('crm-admin-notification', handleRefresh);
    return () => {
      window.removeEventListener('crm-data-refresh', handleRefresh);
      window.removeEventListener('crm-admin-notification', handleRefresh);
    };
  }, [currentCustomer]);

  // Unauthenticated Guest Prompt Screen
  if (!currentCustomer) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center" style={{ background: 'var(--color-zinc-50)' }}>
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-zinc-200 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-4xl mb-5 text-red-600">
            👤
          </div>
          <h2 className="text-xl font-extrabold text-zinc-900 mb-2 uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            VUI LÒNG ĐĂNG NHẬP
          </h2>
          <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
            Bạn cần đăng nhập hoặc tạo tài khoản mới để xem trang cá nhân, quản lý xe đang sở hữu, theo dõi bảo hành điện tử và xem lịch sử đơn hàng.
          </p>

          <div className="w-full space-y-3">
            <p className="text-xs text-zinc-400">
              Sử dụng các nút <strong className="text-zinc-700">Đăng nhập</strong> hoặc <strong className="text-zinc-700">Đăng ký</strong> trên góc phải thanh điều hướng.
            </p>

            {onNavigateToShowroom && (
              <button
                onClick={onNavigateToShowroom}
                className="w-full py-3 rounded-xl font-bold text-xs bg-red-700 text-white hover:bg-red-800 transition shadow-md flex items-center justify-center gap-2"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
              >
                <span>🏍️ XEM XE MẪU TRONG SHOWROOM</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Count pending surveys for badge notification
  const pendingSurveysCount = surveyApi.getAll().filter(
    s => s.status === 'Active' &&
         (s.targetCustomerId === 'ALL' || s.targetCustomerId === currentCustomer.id) &&
         !surveyApi.getResponses().some(r => r.surveyId === s.id && r.customerId === currentCustomer.id)
  ).length;

  // Real-time reactive customer orders (ĐH01: Khách hàng thấy tất cả đơn của họ)
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

  // LH14: Lịch hẹn sắp tới (hôm nay hoặc ngày mai)
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

  const currentVehicle = myVehicles[activeVehicleIndex] || myVehicles[0];

  const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  const warrantyDays = currentVehicle ? daysUntil(currentVehicle.hanBaoHanh) : 0;

  const tabs = [
    { label: `Đơn mua hàng (${myOrders.length})`, icon: '📦' },
    { label: `Bảo hiểm xe (${myInsurances.length})`, icon: '🛡️' },
    { label: `Lịch hẹn (${myAppts.length})`, icon: '📅' },
    { label: `Khảo sát (${pendingSurveysCount > 0 ? `${pendingSurveysCount} mới` : '0'})`, icon: '⭐' },
  ];

  // DKX01, DKX02, DKX03: Khách hàng đăng ký xe mới chuẩn hóa dữ liệu, không tự cấp bảo hành, lưu trữ bền vững
  const handleRegisterVehicle = async () => {
    const errors: Record<string, string> = {};
    if (!regForm.hangXe) {
      errors.hangXe = 'Vui lòng chọn hãng xe';
    }
    const effectiveDongXe = regForm.dongXe === 'Khác' ? regForm.customDongXe.trim() : regForm.dongXe.trim();
    if (!effectiveDongXe) {
      errors.dongXe = 'Vui lòng chọn hoặc nhập tên dòng xe';
    }
    if (!regForm.dongCo) {
      errors.dongCo = 'Vui lòng chọn phân khối / động cơ';
    }
    const rawPlate = regForm.bienSo.trim();
    if (!rawPlate) {
      errors.bienSo = 'Vui lòng nhập biển số xe (VD: 51K-123.45 hoặc 59F1-234.56)';
    } else if (!isValidLicensePlate(rawPlate)) {
      errors.bienSo = 'Biển số không đúng định dạng xe máy Việt Nam (VD: 51K-123.45, 59F1-234.56)';
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
      });

      // DKX02: Cập nhật currentCustomer để F5/reload không bị mất
      const updatedCust: Customer = {
        ...currentCustomer,
        soXe: newV.id,
      };
      localStorage.setItem('crm_current_customer', JSON.stringify(updatedCust));
      onCustomerChange?.(updatedCust);

      setMyVehicles(prev => [newV, ...prev]);
      setActiveVehicleIndex(0);
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
      });
      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_registered' } }));
    } catch (err) {
      console.error('Lỗi đăng ký xe:', err);
      setRegErrors({ form: 'Có lỗi xảy ra khi lưu xe vào hệ thống. Vui lòng thử lại!' });
    }
  };

  const handleSaveProfile = async (updated: Customer) => {
    const maKhInt = parseInt(updated.id.replace(/\D/g, ''), 10);
    if (!isNaN(maKhInt) && maKhInt > 0) {
      await customerApi.update(maKhInt, updated);
    }
    const idx = mockCustomers.findIndex(c => c.id === updated.id);
    if (idx !== -1) {
      mockCustomers[idx] = updated;
    }
    localStorage.setItem('crm_current_customer', JSON.stringify(updated));
    onCustomerChange?.(updated);
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'customer_updated' } }));
  };

  const handleConfirmWarrantyRenewal = async () => {
    if (!currentVehicle) return;
    const months = parseInt(packageChoice, 10) || 12;
    const curEnd = new Date(currentVehicle.hanBaoHanh);
    const base = curEnd > new Date() ? curEnd : new Date();
    base.setMonth(base.getMonth() + months);
    const newDateStr = base.toISOString().split('T')[0];

    const maXeSoHuu = parseInt(currentVehicle.id.replace(/\D/g, ''), 10) || 1;
    await vehicleApi.renewWarranty(maXeSoHuu, newDateStr, {
      tenXe: currentVehicle.tenXe,
      bienSo: currentVehicle.bienSo,
      customerName: currentCustomer.hoTen,
      packageMonths: packageChoice,
    });

    currentVehicle.hanBaoHanh = newDateStr;
    currentVehicle.trangThaiBaoHanh = 'ConHan';
    setMyVehicles([...myVehicles]);
    setRequestSent(true);
  };

  const filteredInsurances = useMemo(() => {
    return myInsurances.filter(c => {
      if (insFilterStatus !== 'All' && c.trangThai !== insFilterStatus) return false;
      return true;
    });
  }, [myInsurances, insFilterStatus]);

  const handleOpenRegisterInsurance = (veh?: Vehicle) => {
    const v = veh || currentVehicle;
    if (v) {
      setInsForm({
        vehicleId: v.id,
        customTenXe: v.tenXe,
        customBienSo: v.bienSo,
        customSoKhung: v.soKhung || '',
        customSoMay: '',
        goiBaoHiem: 'TNDS_BAT_BUOC',
        thoiHanNam: 1,
        nhaBaoHiem: 'Tổng Công ty Bảo hiểm Bảo Việt',
        ghiChu: '',
      });
    } else {
      setInsForm({
        vehicleId: 'custom',
        customTenXe: '',
        customBienSo: '',
        customSoKhung: '',
        customSoMay: '',
        goiBaoHiem: 'TNDS_BAT_BUOC',
        thoiHanNam: 1,
        nhaBaoHiem: 'Tổng Công ty Bảo hiểm Bảo Việt',
        ghiChu: '',
      });
    }
    setInsFormErrors({});
    setShowInsuranceModal(true);
  };

  const handleRegisterInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;
    const errors: Record<string, string> = {};

    let effectiveTenXe = '';
    let effectiveBienSo = '';
    let effectiveSoKhung = '';
    let effectiveSoMay = '';

    if (insForm.vehicleId && insForm.vehicleId !== 'custom') {
      const foundV = myVehicles.find(v => v.id === insForm.vehicleId);
      if (foundV) {
        effectiveTenXe = foundV.tenXe;
        effectiveBienSo = foundV.bienSo;
        effectiveSoKhung = foundV.soKhung || '';
      }
    } else {
      if (!insForm.customTenXe.trim()) errors.customTenXe = 'Vui lòng nhập tên xe';
      if (!insForm.customBienSo.trim()) {
        errors.customBienSo = 'Vui lòng nhập biển số xe';
      } else if (!isValidLicensePlate(insForm.customBienSo)) {
        errors.customBienSo = 'Biển số không hợp lệ (VD: 51K-123.45)';
      }
      effectiveTenXe = insForm.customTenXe.trim();
      effectiveBienSo = formatVietnameseLicensePlate(insForm.customBienSo.trim());
      effectiveSoKhung = insForm.customSoKhung.trim();
      effectiveSoMay = insForm.customSoMay.trim();
    }

    if (Object.keys(errors).length > 0) {
      setInsFormErrors(errors);
      return;
    }

    const pkg = INSURANCE_PACKAGES.find(p => p.id === insForm.goiBaoHiem) || INSURANCE_PACKAGES[0];
    const fee = insForm.thoiHanNam === 2 ? pkg.phi2Nam : pkg.phi1Nam * insForm.thoiHanNam;
    const start = new Date();
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + insForm.thoiHanNam);

    setInsSubmitting(true);
    try {
      const newContract = insuranceApi.create({
        customerId: currentCustomer.id,
        vehicleId: insForm.vehicleId !== 'custom' && insForm.vehicleId ? insForm.vehicleId : 'CUSTOM-VEH',
        hoTenKH: currentCustomer.hoTen,
        soDienThoai: currentCustomer.soDienThoai,
        email: currentCustomer.email || 'customer@motoshop.vn',
        diaChi: currentCustomer.diaChi || 'TP. Hồ Chí Minh',
        tenXe: effectiveTenXe,
        bienSo: effectiveBienSo,
        soKhung: effectiveSoKhung || 'RLHKC' + Date.now().toString().slice(-8),
        soMay: effectiveSoMay || 'KC' + Date.now().toString().slice(-7),
        packageType: insForm.goiBaoHiem,
        tenGoi: pkg.tenGoi,
        nhaBaoHiem: insForm.nhaBaoHiem,
        ngayCap: new Date().toISOString().split('T')[0],
        ngayBatDau: start.toISOString().split('T')[0],
        ngayKetThuc: end.toISOString().split('T')[0],
        thoiHanNam: insForm.thoiHanNam,
        phiBaoHiem: fee,
        trangThai: 'ChoDuyet',
        ghiChu: insForm.ghiChu.trim() || undefined,
      });

      setMyInsurances(prev => [newContract, ...prev]);
      setShowInsuranceModal(false);
      setInsSuccessToast(true);
      setTimeout(() => setInsSuccessToast(false), 5000);
      setTab(1); // Switch to Insurance tab
    } catch (err) {
      console.error('Failed to create insurance contract:', err);
    } finally {
      setInsSubmitting(false);
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div style={{ background: 'var(--color-zinc-50)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="py-8" style={{ background: 'linear-gradient(135deg, var(--color-zinc-950) 0%, #3b0606 60%, var(--color-zinc-950) 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8 flex items-center justify-between gap-5 flex-wrap">
          <div className="flex items-center gap-5">
            {currentCustomer.avatar ? (
              <img src={currentCustomer.avatar} alt={currentCustomer.hoTen} className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-red-600 shadow-md" />
            ) : (
              <div className="flex items-center justify-center rounded-full shrink-0 border-2 border-zinc-700 shadow-md bg-zinc-900 text-zinc-400"
                style={{ width: 64, height: 64 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {currentCustomer.hoTen}
                </span>
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-1"
                  title="Chỉnh sửa thông tin tài khoản"
                >
                  <span>✏️ Sửa hồ sơ</span>
                </button>
              </div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--color-zinc-400)' }}>
                {currentCustomer.email} · {currentCustomer.soDienThoai} ·📍 {currentCustomer.diaChi}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAddVehicleModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-700 bg-red-700 text-white hover:bg-red-800 shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <span>🏍️ + ĐĂNG KÝ XE MỚI</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-6">
        {/* LH14: Banner nhắc lịch hẹn dịch vụ sắp tới (hôm nay hoặc ngày mai) */}
        {upcomingAppts.length > 0 && (
          <div className="mb-5 p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between flex-wrap gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⏰</span>
              <div>
                <div className="text-xs font-bold text-blue-950 uppercase font-mono tracking-wide">
                  NHẮC LỊCH HẸN DỊCH VỤ SẮP TỚI
                </div>
                <div className="text-xs text-blue-800 mt-0.5">
                  Bạn có <strong>{upcomingAppts.length} lịch hẹn</strong> ({SVC_LABELS[upcomingAppts[0].loaiDichVu] || upcomingAppts[0].loaiDichVu}) cho xe{' '}
                  <strong>{upcomingAppts[0].tenXe || 'của bạn'}</strong> vào lúc <strong className="font-mono text-red-700">{upcomingAppts[0].gioHen}</strong> ngày <strong className="font-mono text-blue-900">{upcomingAppts[0].ngayHen}</strong>{' '}
                  ({upcomingAppts[0].ngayHen === new Date().toISOString().split('T')[0] ? 'Hôm nay' : 'Ngày mai'}).
                </div>
              </div>
            </div>
            <button
              onClick={() => setTab(2)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-sm"
            >
              Xem chi tiết lịch hẹn →
            </button>
          </div>
        )}

        {/* Survey notification banner if pending */}
        {pendingSurveysCount > 0 && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between flex-wrap gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <div className="text-xs font-bold text-amber-900 uppercase font-mono">THÔNG BÁO KHẢO SÁT MỚI TỪ ĐẠI LÝ</div>
                <div className="text-xs text-amber-700">Bạn có {pendingSurveysCount} cuộc khảo sát ý kiến đang chờ hoàn thành.</div>
              </div>
            </div>
            <button
              onClick={() => (onNavigateToSurvey ? onNavigateToSurvey() : setTab(3))}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow transition cursor-pointer"
            >
              Làm khảo sát ngay →
            </button>
          </div>
        )}

        {/* Vehicle Selector if multiple */}
        {myVehicles.length > 1 && (
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-zinc-500">Chọn xe:</span>
            {myVehicles.map((v, idx) => (
              <button
                key={v.id}
                onClick={() => setActiveVehicleIndex(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${activeVehicleIndex === idx ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-700'}`}
              >
                {v.trangThaiDuyet === 'ChoDuyet' && <span>⏳</span>}
                <span>{v.tenXe} ({v.bienSo})</span>
              </button>
            ))}
          </div>
        )}

        {/* Vehicle + Warranty card */}
        {currentVehicle ? (
          <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
            <div className="p-6" style={{ background: 'linear-gradient(135deg, var(--color-zinc-950) 0%, #1a0505 100%)' }}>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xs font-600 mb-2" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    🏍️ XE ĐANG SỞ HỮU {myVehicles.length > 1 ? `(${activeVehicleIndex + 1}/${myVehicles.length})` : ''}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: '0.04em' }}>
                    {currentVehicle.tenXe}
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--color-zinc-400)', letterSpacing: '0.1em' }}>{currentVehicle.bienSo}</span>
                    <span style={{ fontSize: 13, color: 'var(--color-zinc-500)' }}>{currentVehicle.mauSac} · {currentVehicle.namSanXuat}</span>
                  </div>

                  {/* TC13: Badge hiển thị trạng thái chờ duyệt của xe mới đăng ký */}
                  {currentVehicle.trangThaiDuyet === 'ChoDuyet' && (
                    <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                      <span>⏳ Chờ cửa hàng kiểm tra & duyệt thông tin xe</span>
                    </div>
                  )}
                </div>
                  {/* Digital warranty card */}
                  <div className="rounded-xl p-4 min-w-48" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                    <div className="text-xs font-600 mb-2" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      🔐 BẢO HÀNH ĐIỆN TỬ
                    </div>
                    {currentVehicle.trangThaiBaoHanh === 'ChuaCo' ? (
                      <>
                        <div className="font-700 text-sm mb-1 text-amber-400">
                          ⚠️ Chưa kích hoạt
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">
                          HSD: Chưa kích hoạt
                        </div>
                        <div className="mt-2 text-xs text-zinc-500 font-mono" style={{ fontSize: 10 }}>
                          {currentVehicle.soKhung ? `Số khung: ${currentVehicle.soKhung}` : 'Chưa nhập số khung'}
                        </div>
                        <div className="mt-2.5 text-[11px] text-amber-300/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 leading-relaxed">
                          Mang xe đến showroom kiểm tra để được kích hoạt bảo hành chính hãng.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-700 text-sm mb-1" style={{ color: warrantyDays > 0 ? '#4ade80' : 'var(--color-red-400)' }}>
                          {currentVehicle.trangThaiBaoHanh === 'ConHan' ? '✓ Còn hiệu lực' : '✕ Đã hết hạn'}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-zinc-400)', fontFamily: 'var(--font-mono)' }}>HSD: {currentVehicle.hanBaoHanh}</div>
                        {warrantyDays > 0 && (
                          <div className="mt-1 text-xs font-600" style={{ color: warrantyDays < 90 ? '#fbbf24' : '#4ade80' }}>
                            còn {warrantyDays} ngày
                          </div>
                        )}
                        <div className="mt-2 text-xs" style={{ color: 'var(--color-zinc-600)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                          {currentVehicle.soKhung || 'N/A'}
                        </div>
                        {(warrantyDays <= 0 || currentVehicle.trangThaiBaoHanh === 'HetHan') ? (
                          <button
                            onClick={() => setShowWarrantyModal(true)}
                            className="mt-3 w-full py-1.5 rounded-lg text-xs font-700 bg-red-700 text-white hover:bg-red-800 transition"
                          >
                            ⚡ Gửi yêu cầu gia hạn
                          </button>
                        ) : warrantyDays < 30 ? (
                          <button
                            onClick={() => setShowWarrantyModal(true)}
                            className="mt-3 w-full py-1.5 rounded-lg text-xs font-700 bg-yellow-600 text-white hover:bg-yellow-700 transition"
                          >
                            ⚡ Gia hạn bảo hành
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handleOpenRegisterInsurance(currentVehicle)}
                          className="mt-2 w-full py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>🛡️ Đăng ký bảo hiểm xe</span>
                        </button>
                      </>
                    )}
                  </div>
              </div>
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x border-t border-zinc-200" style={{ borderColor: 'var(--color-zinc-200)' }}>
              {[
                { label: 'Đơn hàng', value: myOrders.length, color: 'var(--color-zinc-900)' },
                { label: 'Bảo hiểm xe', value: myInsurances.length, color: '#16a34a' },
                { label: 'Lịch hẹn', value: myAppts.length, color: 'var(--color-zinc-900)' },
                { label: 'Chi tiêu', value: formatVND(currentCustomer.tongChiTieu), color: 'var(--color-red-700)' },
              ].map((s, i) => (
                <div key={i} className="px-5 py-4 text-center">
                  <div className="text-xl font-700" style={{ color: s.color, fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Customer Tier / CLV Membership Card */}
            {(() => {
              const tier = getCustomerTier(currentCustomer.tongChiTieu);
              const percentToNext = tier.nextTierSpending
                ? Math.min(100, Math.round((currentCustomer.tongChiTieu / (currentCustomer.tongChiTieu + tier.nextTierSpending)) * 100))
                : 100;
              return (
                <div className="p-4 border-t border-zinc-100 bg-zinc-50/80 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: tier.badgeBg, border: `1.5px solid ${tier.badgeBorder}` }}>
                      {tier.tier === 'VIP' ? '👑' : tier.tier === 'ThanThiet' ? '⭐' : '🌱'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900">{tier.label}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: tier.badgeBg, color: tier.badgeColor, border: `1px solid ${tier.badgeBorder}` }}>
                          Ưu đãi {tier.discountPercent > 0 ? `Giảm ${tier.discountPercent}%` : 'Tích điểm'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{tier.description}</p>
                    </div>
                  </div>
                  {tier.nextTierSpending ? (
                    <div className="w-full md:w-56 text-right">
                      <div className="text-[11px] text-zinc-500 font-mono mb-1">
                        Chi tiêu thêm <strong>{formatVND(tier.nextTierSpending)}</strong> để lên <strong>{tier.nextTierLabel}</strong>
                      </div>
                      <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-700 h-full rounded-full transition-all duration-500" style={{ width: `${percentToNext}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold font-mono">
                      ✨ ĐẠT HẠNG CAO NHẤT
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="rounded-2xl p-6 mb-6 bg-white border border-zinc-200 flex flex-col items-center justify-center text-center py-10">
            <div className="text-4xl mb-3">🏍️</div>
            <h3 className="font-bold text-zinc-900 text-base mb-1">Chưa có phương tiện nào</h3>
            <p className="text-xs text-zinc-500 mb-4 max-w-sm">
              Bạn chưa đăng ký phương tiện nào. Đăng ký xe của bạn để theo dõi thông tin bảo hành điện tử và đặt lịch bảo dưỡng dễ dàng.
            </p>
            <button
              onClick={() => setShowAddVehicleModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow transition"
            >
              + ĐĂNG KÝ PHƯƠNG TIỆN CỦA TÔI
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'var(--color-zinc-200)' }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-600 transition-all relative"
              style={{
                background: tab === i ? 'white' : 'transparent',
                color: tab === i ? 'var(--color-zinc-900)' : 'var(--color-zinc-500)',
                border: 'none', cursor: 'pointer',
                boxShadow: tab === i ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}>
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
              {i === 3 && pendingSurveysCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-600 absolute top-2 right-2 animate-ping" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 0 && (
          <div className="flex flex-col gap-4">
            {myOrders.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 bg-white rounded-2xl border border-zinc-200">Chưa có đơn hàng nào</div>
            ) : myOrders.map(order => {
              const cfg = orderStatusConfig[order.trangThai];
              return (
                <div key={order.id} className="rounded-2xl overflow-hidden shadow-2xs" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
                  <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-zinc-100)' }}>
                    <div>
                      <div className="font-700 text-sm" style={{ color: 'var(--color-zinc-900)' }}>Đơn hàng #{order.id}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>Ngày đặt: {order.ngayDat}</div>
                    </div>
                    <StatusBadge {...cfg} />
                  </div>

                  {/* ĐH01: Tình trạng thực tế đơn hàng cho khách hàng */}
                  {order.trangThai === 'DangGiao' && (
                    <div className="mx-5 my-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-blue-900 font-semibold">
                      <span className="text-2xl animate-pulse">🚚</span>
                      <div>
                        <div className="font-bold text-blue-950">ĐƠN HÀNG ĐANG GIAO ĐẾN BẠN</div>
                        <div className="text-[11px] text-blue-700 font-normal">Đang vận chuyển đến: {order.diaChiGiao}</div>
                      </div>
                    </div>
                  )}

                  {order.trangThai === 'HoanThanh' && (
                    <div className="mx-5 my-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
                      <span className="text-xl">✅</span>
                      <div>Đơn hàng đã giao thành công và hoàn tất! Cảm ơn bạn đã mua hàng.</div>
                    </div>
                  )}

                  {order.trangThai === 'ChoDuyet' && (
                    <div className="mx-5 my-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 font-semibold">
                      <span className="text-xl">⏳</span>
                      <div>Đơn hàng đang chờ quản trị viên xác nhận và đóng gói sản phẩm.</div>
                    </div>
                  )}

                  {order.trangThai === 'DaHuy' && (
                    <div className="mx-5 my-3 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-900 font-semibold">
                      <span className="text-xl">✕</span>
                      <div>Đơn hàng đã được hủy.</div>
                    </div>
                  )}

                  <div className="px-5 py-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-1.5" style={{ borderBottom: i < order.items.length - 1 ? '1px solid var(--color-zinc-100)' : 'none' }}>
                        <span style={{ color: 'var(--color-zinc-700)' }}>{item.tenSanPham} <span style={{ color: 'var(--color-zinc-400)', fontFamily: 'var(--font-mono)' }}>×{item.soLuong}</span></span>
                        <span className="font-600" style={{ color: 'var(--color-zinc-900)' }}>{formatVND(item.donGia * item.soLuong)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'var(--color-zinc-100)', background: 'var(--color-zinc-50)' }}>
                    <div className="text-xs" style={{ color: 'var(--color-zinc-500)' }}>📍 {order.diaChiGiao}</div>
                    <div className="font-700" style={{ color: 'var(--color-red-700)', fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.02em' }}>{formatVND(order.tongTien)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB 1: BẢO HIỂM XE (BHX02, BHX03, BHX04) ── */}
        {tab === 1 && (
          <div className="flex flex-col gap-5">
            {/* Action Bar & Summary */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-2xs">
              <div>
                <div className="font-bold text-base text-zinc-900" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}>
                  🛡️ BẢO HIỂM XE MÁY ĐIỆN TỬ
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  Tra cứu hợp đồng, tải Giấy chứng nhận điện tử (GCN) và đăng ký bảo hiểm trực tuyến
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenRegisterInsurance()}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <span>➕ ĐĂNG KÝ BẢO HIỂM MỚI</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
              <span className="text-zinc-500">Trạng thái:</span>
              {(['All', 'HieuLuc', 'ChoDuyet', 'HetHan'] as const).map(st => {
                const count = st === 'All' ? myInsurances.length : myInsurances.filter(c => c.trangThai === st).length;
                const label = st === 'All' ? 'Tất cả' : insStatusConfig[st].label;
                const active = insFilterStatus === st;
                return (
                  <button
                    key={st}
                    onClick={() => setInsFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-medium ${
                      active
                        ? 'bg-zinc-900 text-white shadow-sm'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Contracts List (BHX03) */}
            {filteredInsurances.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col items-center">
                <div className="text-4xl mb-3">🛡️</div>
                <h4 className="font-bold text-zinc-800 text-sm mb-1">Chưa có hợp đồng bảo hiểm nào</h4>
                <p className="text-xs text-zinc-500 max-w-md mb-4">
                  {insFilterStatus !== 'All'
                    ? 'Không có hợp đồng nào phù hợp với bộ lọc này.'
                    : 'Bạn chưa đăng ký hợp đồng bảo hiểm xe máy nào. Đăng ký ngay để nhận Giấy chứng nhận điện tử hợp chuẩn lưu hành giao thông.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenRegisterInsurance()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow transition"
                >
                  + Đăng ký mua bảo hiểm ngay
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInsurances.map(c => {
                  const cfg = insStatusConfig[c.trangThai] || { label: c.trangThai, color: '#71717a', bg: '#f4f4f5' };
                  const daysLeft = Math.ceil((new Date(c.ngayKetThuc).getTime() - Date.now()) / 86400000);
                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl overflow-hidden bg-white border border-zinc-200 shadow-2xs transition hover:border-zinc-300"
                    >
                      {/* Top Bar */}
                      <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold text-lg">
                            🛡️
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 text-sm sm:text-base flex items-center gap-2">
                              <span>{c.tenGoi}</span>
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-bold">
                                #{c.id}
                              </span>
                            </div>
                            <div className="text-xs text-zinc-500 font-mono mt-0.5">
                              Số GCN: <strong className="text-zinc-700 font-bold">{c.soGCN}</strong> · Đơn vị: {c.nhaBaoHiem}
                            </div>
                          </div>
                        </div>

                        <StatusBadge {...cfg} />
                      </div>

                      {/* Content details */}
                      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-zinc-50/50">
                        {/* Column 1: Phương tiện */}
                        <div className="space-y-1.5 p-3 rounded-xl bg-white border border-zinc-200/80">
                          <div className="text-[10px] font-mono uppercase font-bold text-zinc-400">🏍️ Thông tin xe</div>
                          <div className="font-bold text-zinc-900 text-sm">{c.tenXe}</div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-red-700 text-xs px-2 py-0.5 rounded bg-red-50 border border-red-200">
                              {c.bienSo}
                            </span>
                          </div>
                          <div className="text-zinc-500 font-mono text-[11px] truncate">
                            Số khung: {c.soKhung || 'Chưa cập nhật'}
                          </div>
                        </div>

                        {/* Column 2: Thời hạn & Hiệu lực */}
                        <div className="space-y-1.5 p-3 rounded-xl bg-white border border-zinc-200/80">
                          <div className="text-[10px] font-mono uppercase font-bold text-zinc-400">📅 Thời hạn bảo hiểm</div>
                          <div className="font-bold text-zinc-900 text-sm">
                            {c.thoiHanNam} năm
                            {c.trangThai === 'HieuLuc' && (
                              <span className={`ml-2 text-[11px] font-semibold ${daysLeft < 30 ? 'text-amber-600' : 'text-emerald-700'}`}>
                                (còn {daysLeft} ngày)
                              </span>
                            )}
                          </div>
                          <div className="text-zinc-600 font-mono text-[11px]">
                            Từ: <strong>{c.ngayBatDau}</strong>
                          </div>
                          <div className="text-zinc-600 font-mono text-[11px]">
                            Đến: <strong>{c.ngayKetThuc}</strong>
                          </div>
                        </div>

                        {/* Column 3: Chi phí & Hành động (BHX04) */}
                        <div className="space-y-2 p-3 rounded-xl bg-white border border-zinc-200/80 flex flex-col justify-between">
                          <div>
                            <div className="text-[10px] font-mono uppercase font-bold text-zinc-400">💰 Phí bảo hiểm</div>
                            <div className="font-extrabold text-red-700 text-base font-mono">
                              {formatVND(c.phiBaoHiem)}
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              {c.trangThai === 'HieuLuc' ? '✓ Đã thanh toán' : 'Chờ xác nhận'}
                            </div>
                          </div>

                          <div className="pt-2">
                            {c.trangThai === 'HieuLuc' ? (
                              <button
                                type="button"
                                onClick={() => setViewingInsuranceContract(c)}
                                className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <span>📄 Xem & In GCN (PDF)</span>
                              </button>
                            ) : c.trangThai === 'ChoDuyet' ? (
                              <div className="text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 text-[11px] text-center font-medium">
                                ⏳ Đang duyệt hồ sơ cấp GCN
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenRegisterInsurance()}
                                className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <span>🔄 Mua gói bảo hiểm mới</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: LỊCH HẸN DỊCH VỤ ── */}
        {tab === 2 && (
          <div className="flex flex-col gap-4">
            {myAppts.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 bg-white rounded-2xl border border-zinc-200">Chưa có lịch hẹn nào</div>
            ) : myAppts.map(appt => {
              const cfg = apptStatusConfig[appt.trangThai] || { label: appt.trangThai, color: '#71717a', bg: '#f4f4f5' };
              return (
                <div key={appt.id} className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[280px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-700" style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {SVC_LABELS[appt.loaiDichVu] || appt.loaiDichVu}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-bold">
                          #{appt.id}
                        </span>
                        <StatusBadge {...cfg} />
                      </div>
                      <div className="text-sm font-medium" style={{ color: 'var(--color-zinc-700)' }}>
                        📅 Ngày: <strong className="font-mono text-zinc-900">{appt.ngayHen}</strong> · Giờ: <strong className="font-mono text-red-700">{appt.gioHen}</strong>
                      </div>
                      {appt.tenXe && (
                        <div className="text-sm mt-1" style={{ color: 'var(--color-zinc-600)' }}>
                          🏍️ {appt.tenXe} · Biển số: <strong className="font-mono text-zinc-800">{appt.bienSo || 'Chưa có'}</strong>
                        </div>
                      )}
                      <div className="text-xs mt-1 text-zinc-500 flex items-center gap-1.5">
                        <span>👨‍🔧 Kỹ thuật viên:</span>
                        <strong className="text-zinc-800">{appt.nhanVienPhuTrach || 'Đang sắp xếp nhân viên'}</strong>
                      </div>

                      {/* Hiển thị lý do từ chối nếu có */}
                      {appt.trangThai === 'TuChoi' && (
                        <div className="mt-3 text-xs p-3 rounded-xl bg-red-50 text-red-800 border border-red-200">
                          <div className="font-bold mb-0.5 flex items-center gap-1">
                            <span>⚠️ Lý do từ chối từ cửa hàng:</span>
                          </div>
                          <div>{appt.lyDoTuChoi || 'Cửa hàng hiện tại đã kín lịch hoặc xe không phù hợp.'}</div>
                        </div>
                      )}

                      {appt.ghiChu && (
                        <div className="mt-2.5 text-xs px-3 py-2 rounded-xl" style={{ background: 'var(--color-zinc-50)', color: 'var(--color-zinc-600)', border: '1px solid var(--color-zinc-200)' }}>
                          💬 <strong className="text-zinc-700">Yêu cầu/Ghi chú:</strong> {appt.ghiChu}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB 3: KHẢO SÁT & ĐÁNH GIÁ ── */}
        {tab === 3 && (
          <div>
            {onNavigateToSurvey && (
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={onNavigateToSurvey}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Mở trang làm khảo sát riêng</span>
                  <span>↗</span>
                </button>
              </div>
            )}
            <DynamicSurveyTab customer={currentCustomer} />
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal
          customer={currentCustomer}
          onClose={() => setShowEditProfile(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Warranty Renewal Request Modal */}
      {showWarrantyModal && currentVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base text-zinc-900" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                YÊU CẦU GIA HẠN BẢO HÀNH
              </h3>
              <button onClick={() => setShowWarrantyModal(false)} className="text-zinc-400 hover:text-zinc-600 font-bold text-lg">✕</button>
            </div>

            {requestSent ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">✅</div>
                <h4 className="font-bold text-zinc-900 text-lg">Đã gửi yêu cầu gia hạn!</h4>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  Đại lý đã tiếp nhận thông tin yêu cầu gia hạn bảo hành cho xe <strong>{currentVehicle.tenXe}</strong> ({currentVehicle.bienSo}). Nhân viên hỗ trợ sẽ liên hệ xác nhận trong 24h.
                </p>
                <button
                  onClick={() => { setShowWarrantyModal(false); setRequestSent(false); }}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <div>
                <div className="bg-zinc-50 p-3.5 rounded-xl text-xs space-y-1.5 mb-4 border border-zinc-200">
                  <div><span className="font-semibold text-zinc-700">Mẫu xe:</span> {currentVehicle.tenXe}</div>
                  <div><span className="font-semibold text-zinc-700">Biển số:</span> {currentVehicle.bienSo}</div>
                  <div><span className="font-semibold text-zinc-700">Số khung:</span> {currentVehicle.soKhung}</div>
                  <div>
                    <span className="font-semibold text-zinc-700">Hạn bảo hành hiện tại: </span>
                    <span className="font-bold text-red-600">{currentVehicle.hanBaoHanh} ({currentVehicle.trangThaiBaoHanh === 'ConHan' ? 'Còn hạn' : 'Đã hết hạn'})</span>
                  </div>
                </div>

                <label className="block text-xs font-semibold mb-2 text-zinc-700">Chọn gói gia hạn mong muốn:</label>
                <select
                  value={packageChoice}
                  onChange={e => setPackageChoice(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white mb-4 focus:outline-none focus:border-red-600"
                >
                  <option value="12">Gói 12 Tháng (Khuyên dùng) - 490.000₫</option>
                  <option value="24">Gói 24 Tháng (Tiết kiệm 20%) - 790.000₫</option>
                </select>

                <div className="flex justify-end gap-2 mt-5">
                  <button
                    onClick={() => setShowWarrantyModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleConfirmWarrantyRenewal}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow-md cursor-pointer"
                  >
                    Xác nhận gửi yêu cầu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Register Vehicle Modal for Customer - DKX01, DKX02, DKX03 */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-100">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                  🏍️ ĐĂNG KÝ PHƯƠNG TIỆN CỦA TÔI
                </h3>
                <p className="text-[11px] text-zinc-400">Chuẩn hóa thông tin xe để quản lý hồ sơ và đặt lịch dịch vụ</p>
              </div>
              <button onClick={() => setShowAddVehicleModal(false)} className="text-zinc-400 hover:text-zinc-600 font-bold text-lg p-1">✕</button>
            </div>

            {regErrors.form && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                <span>⚠️</span> {regErrors.form}
              </div>
            )}

            <div className="space-y-4">
              {/* 1. Hãng xe, Dòng xe, Động cơ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700">Hãng xe <span className="text-red-600">*</span></label>
                  <select
                    value={regForm.hangXe}
                    onChange={e => {
                      const newBrand = e.target.value;
                      const brandData = MOTORBIKE_BRANDS.find(b => b.brand === newBrand);
                      const defaultModel = brandData && brandData.models.length > 0 ? brandData.models[0] : 'Khác';
                      setRegForm({
                        ...regForm,
                        hangXe: newBrand,
                        dongXe: defaultModel,
                        customDongXe: '',
                      });
                      if (regErrors.hangXe) setRegErrors({ ...regErrors, hangXe: '' });
                    }}
                    className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none focus:border-red-600 ${
                      regErrors.hangXe ? 'border-red-500' : 'border-zinc-300'
                    }`}
                  >
                    {MOTORBIKE_BRANDS.map(b => (
                      <option key={b.brand} value={b.brand}>{b.brand}</option>
                    ))}
                  </select>
                  {regErrors.hangXe && <p className="text-[11px] text-red-600 mt-1 font-semibold">{regErrors.hangXe}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700">Dòng xe <span className="text-red-600">*</span></label>
                  <select
                    value={regForm.dongXe}
                    onChange={e => {
                      setRegForm({ ...regForm, dongXe: e.target.value });
                      if (regErrors.dongXe) setRegErrors({ ...regErrors, dongXe: '' });
                    }}
                    className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none focus:border-red-600 ${
                      regErrors.dongXe ? 'border-red-500' : 'border-zinc-300'
                    }`}
                  >
                    {((MOTORBIKE_BRANDS.find(b => b.brand === regForm.hangXe)?.models) || []).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="Khác">Khác (tự nhập)...</option>
                  </select>
                  {regErrors.dongXe && <p className="text-[11px] text-red-600 mt-1 font-semibold">{regErrors.dongXe}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700">Động cơ / Phân khối <span className="text-red-600">*</span></label>
                  <select
                    value={regForm.dongCo}
                    onChange={e => {
                      setRegForm({ ...regForm, dongCo: e.target.value });
                      if (regErrors.dongCo) setRegErrors({ ...regErrors, dongCo: '' });
                    }}
                    className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none focus:border-red-600 ${
                      regErrors.dongCo ? 'border-red-500' : 'border-zinc-300'
                    }`}
                  >
                    {ENGINE_CAPACITIES.map(cap => (
                      <option key={cap} value={cap}>{cap}</option>
                    ))}
                  </select>
                  {regErrors.dongCo && <p className="text-[11px] text-red-600 mt-1 font-semibold">{regErrors.dongCo}</p>}
                </div>
              </div>

              {/* Tên dòng xe tùy chỉnh nếu chọn Khác */}
              {regForm.dongXe === 'Khác' && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700">Nhập tên dòng xe cụ thể <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    placeholder="VD: Future Neo, Click 125i, Dylan..."
                    value={regForm.customDongXe}
                    onChange={e => {
                      setRegForm({ ...regForm, customDongXe: e.target.value });
                      if (regErrors.dongXe) setRegErrors({ ...regErrors, dongXe: '' });
                    }}
                    className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none focus:border-red-600 ${
                      regErrors.dongXe ? 'border-red-500' : 'border-zinc-300'
                    }`}
                  />
                  {regErrors.dongXe && <p className="text-[11px] text-red-600 mt-1 font-semibold">{regErrors.dongXe}</p>}
                </div>
              )}

              {/* Xem trước tên xe chuẩn hóa */}
              <div className="p-3 bg-red-50/60 rounded-xl border border-red-200/80 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-zinc-500 font-mono">Tên xe hiển thị: </span>
                  <strong className="text-zinc-900 font-bold">
                    {regForm.hangXe} {regForm.dongXe === 'Khác' ? (regForm.customDongXe || '(Chưa nhập tên)') : regForm.dongXe} {regForm.dongCo}
                  </strong>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                  ✓ Chuẩn hóa
                </span>
              </div>

              {/* 2. Biển số xe tự động định dạng */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-zinc-700">Biển số xe <span className="text-red-600">*</span></label>
                  <span className="text-[10px] text-zinc-400 font-mono">Tự động định dạng: 51K - 123.45</span>
                </div>
                <input
                  type="text"
                  placeholder="Gõ biển số: 51k12345 hoặc 59F123456"
                  value={regForm.bienSo}
                  onChange={e => {
                    const formatted = formatVietnameseLicensePlate(e.target.value);
                    setRegForm({ ...regForm, bienSo: formatted });
                    if (regErrors.bienSo) setRegErrors({ ...regErrors, bienSo: '' });
                  }}
                  className={`w-full p-2.5 rounded-xl border text-xs bg-white font-mono uppercase focus:outline-none focus:border-red-600 ${
                    regErrors.bienSo ? 'border-red-500 bg-red-50/20' : 'border-zinc-300'
                  }`}
                />
                {regErrors.bienSo && (
                  <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                    <span>⚠️</span> {regErrors.bienSo}
                  </p>
                )}
              </div>

              {/* 3. Số khung (VIN) - Không bắt buộc */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-zinc-700">Số khung (VIN)</label>
                  <span className="text-[10px] text-zinc-400 font-medium">(Không bắt buộc)</span>
                </div>
                <input
                  type="text"
                  placeholder="VD: RLHKC110JA1234567 (nếu có mang theo giấy tờ)"
                  value={regForm.soKhung}
                  onChange={e => setRegForm({ ...regForm, soKhung: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white font-mono uppercase focus:outline-none focus:border-red-600"
                />
                <p className="text-[10px] text-zinc-400 mt-1 italic">
                  * Khách hàng có thể để trống. Kỹ thuật viên sẽ kiểm tra số khung thực tế khi tiếp nhận xe tại đại lý.
                </p>
              </div>

              {/* 4. Màu sắc & Năm sản xuất */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700">Màu sắc</label>
                  <input
                    type="text"
                    placeholder="VD: Đen nhám, Đỏ đen..."
                    value={regForm.mauSac}
                    onChange={e => setRegForm({ ...regForm, mauSac: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700">Năm sản xuất</label>
                  <input
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    placeholder="VD: 2024"
                    value={regForm.namSanXuat}
                    onChange={e => setRegForm({ ...regForm, namSanXuat: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600 font-mono"
                  />
                </div>
              </div>

              {/* Thông tin giải thích quy trình */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2 leading-relaxed">
                <span className="text-base leading-none">ℹ️</span>
                <div>
                  <strong>Lưu ý về bảo hành chính hãng:</strong> Xe mới thêm sẽ được lưu vào danh sách xe của bạn để đặt lịch bảo dưỡng ngay. Chính sách bảo hành điện tử sẽ được kỹ thuật viên kích hoạt sau khi kiểm tra xe tại showroom.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowAddVehicleModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRegisterVehicle}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow-md transition cursor-pointer"
              >
                Xác nhận đăng ký
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── MODAL ĐĂNG KÝ BẢO HIỂM XE MỚI (BHX02) ── */}
      {/* ────────────────────────────────────────────────────────── */}
      {showInsuranceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200 p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3
                  className="text-base sm:text-lg font-extrabold text-zinc-900 uppercase flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
                >
                  <span>🛡️ ĐĂNG KÝ BẢO HIỂM XE MÁY</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Bảo hiểm điện tử chuẩn NĐ 67/2023/NĐ-CP · Cấp giấy chứng nhận tức thì
                </p>
              </div>
              <button
                onClick={() => setShowInsuranceModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterInsurance} className="space-y-4">
              {/* 1. Chọn phương tiện */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5 font-mono">
                  1. CHỌN PHƯƠNG TIỆN BẢO HIỂM <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  {myVehicles.map(v => (
                    <label
                      key={v.id}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center gap-2.5 ${
                        insForm.vehicleId === v.id
                          ? 'border-red-600 bg-red-50/50 text-red-950 font-semibold'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="insVeh"
                        checked={insForm.vehicleId === v.id}
                        onChange={() => setInsForm({ ...insForm, vehicleId: v.id })}
                        className="text-red-600"
                      />
                      <div>
                        <div className="font-bold">{v.tenXe}</div>
                        <div className="text-[11px] font-mono text-zinc-500">BS: {v.bienSo}</div>
                      </div>
                    </label>
                  ))}

                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center gap-2.5 ${
                      insForm.vehicleId === 'custom' || (!insForm.vehicleId && myVehicles.length === 0)
                        ? 'border-red-600 bg-red-50/50 text-red-950 font-semibold'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="insVeh"
                      checked={insForm.vehicleId === 'custom' || (!insForm.vehicleId && myVehicles.length === 0)}
                      onChange={() => setInsForm({ ...insForm, vehicleId: 'custom' })}
                      className="text-red-600"
                    />
                    <div>
                      <div className="font-bold">+ Nhập xe khác</div>
                      <div className="text-[11px] text-zinc-500">Chưa có trong danh sách sở hữu</div>
                    </div>
                  </label>
                </div>

                {/* Nhập xe tùy chỉnh nếu chọn "custom" */}
                {(insForm.vehicleId === 'custom' || myVehicles.length === 0) && (
                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5 mt-2 animate-in fade-in">
                    <div className="text-[11px] font-bold text-zinc-700 uppercase font-mono">
                      Thông tin xe ngoài danh sách:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Tên xe *</label>
                        <input
                          type="text"
                          placeholder="VD: Honda SH 160i ABS"
                          value={insForm.customTenXe}
                          onChange={e => setInsForm({ ...insForm, customTenXe: e.target.value })}
                          className={`w-full p-2 rounded-lg border text-xs bg-white ${
                            insFormErrors.customTenXe ? 'border-red-500' : 'border-zinc-300'
                          }`}
                        />
                        {insFormErrors.customTenXe && (
                          <span className="text-[10px] text-red-600 font-semibold">{insFormErrors.customTenXe}</span>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Biển số xe *</label>
                        <input
                          type="text"
                          placeholder="VD: 51K-123.45"
                          value={insForm.customBienSo}
                          onChange={e => {
                            const formatted = formatVietnameseLicensePlate(e.target.value);
                            setInsForm({ ...insForm, customBienSo: formatted });
                          }}
                          className={`w-full p-2 rounded-lg border text-xs bg-white font-mono uppercase ${
                            insFormErrors.customBienSo ? 'border-red-500' : 'border-zinc-300'
                          }`}
                        />
                        {insFormErrors.customBienSo && (
                          <span className="text-[10px] text-red-600 font-semibold">{insFormErrors.customBienSo}</span>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Số khung</label>
                        <input
                          type="text"
                          placeholder="Để trống nếu chưa có"
                          value={insForm.customSoKhung}
                          onChange={e => setInsForm({ ...insForm, customSoKhung: e.target.value.toUpperCase() })}
                          className="w-full p-2 rounded-lg border border-zinc-300 text-xs bg-white font-mono uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Số máy</label>
                        <input
                          type="text"
                          placeholder="Để trống nếu chưa có"
                          value={insForm.customSoMay}
                          onChange={e => setInsForm({ ...insForm, customSoMay: e.target.value.toUpperCase() })}
                          className="w-full p-2 rounded-lg border border-zinc-300 text-xs bg-white font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Chọn Gói bảo hiểm */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5 font-mono">
                  2. CHỌN GÓI BẢO HIỂM <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {INSURANCE_PACKAGES.map(pkg => {
                    const sel = insForm.goiBaoHiem === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setInsForm({ ...insForm, goiBaoHiem: pkg.id })}
                        className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition relative flex flex-col justify-between ${
                          sel
                            ? 'border-red-600 bg-red-50/40 shadow-xs ring-1 ring-red-600'
                            : 'border-zinc-200 bg-white hover:border-zinc-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-zinc-900">{pkg.tenGoi}</span>
                            <span className="font-extrabold text-red-700 font-mono text-xs">
                              {formatVND(pkg.phi1Nam)}/năm
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-relaxed mb-2">{pkg.moTa}</p>
                        </div>
                        <div className="text-[10px] text-zinc-600 font-medium pt-2 border-t border-zinc-100 flex items-center justify-between">
                          <span>Quyền lợi: {pkg.quyenLoi[0]}</span>
                          <span className={`font-bold ${sel ? 'text-red-700' : 'text-zinc-400'}`}>
                            {sel ? '✓ Đã chọn' : 'Chọn'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Thời hạn & Đơn vị bảo hiểm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1 font-mono">
                    3. THỜI HẠN BẢO HIỂM
                  </label>
                  <select
                    value={insForm.thoiHanNam}
                    onChange={e => setInsForm({ ...insForm, thoiHanNam: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white font-medium focus:outline-none focus:border-red-600"
                  >
                    <option value={1}>1 năm (Phổ thông)</option>
                    <option value={2}>2 năm (Tiết kiệm thời gian)</option>
                    <option value={3}>3 năm (Dài hạn ưu đãi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1 font-mono">
                    4. ĐƠN VỊ BẢO HIỂM
                  </label>
                  <select
                    value={insForm.nhaBaoHiem}
                    onChange={e => setInsForm({ ...insForm, nhaBaoHiem: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white font-medium focus:outline-none focus:border-red-600"
                  >
                    <option value="Tổng Công ty Bảo hiểm Bảo Việt">Bảo hiểm Bảo Việt (Khuyên dùng)</option>
                    <option value="Tổng Công ty Cổ phần Bảo hiểm PVI">Bảo hiểm PVI</option>
                    <option value="Tổng Công ty Cổ phần Bảo hiểm Bưu điện (PTI)">Bảo hiểm Bưu điện PTI</option>
                    <option value="Tổng Công ty Cổ phần Bảo hiểm Quân đội (MIC)">Bảo hiểm Quân đội MIC</option>
                  </select>
                </div>
              </div>

              {/* 4. Tổng phí tính toán */}
              {(() => {
                const selectedPkg = INSURANCE_PACKAGES.find(p => p.id === insForm.goiBaoHiem) || INSURANCE_PACKAGES[0];
                const totalFee = insForm.thoiHanNam === 2 ? selectedPkg.phi2Nam : selectedPkg.phi1Nam * insForm.thoiHanNam;
                return (
                  <div className="p-4 rounded-2xl bg-zinc-900 text-white flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono text-zinc-400 uppercase">TỔNG PHÍ BẢO HIỂM DỰ KIẾN:</div>
                      <div className="text-xs text-zinc-300 mt-0.5">
                        {selectedPkg.tenGoi} · {insForm.thoiHanNam} năm
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl sm:text-2xl font-extrabold text-red-400 font-mono">
                        {formatVND(totalFee)}
                      </div>
                      <div className="text-[10px] text-zinc-400">Đã bao gồm VAT & lệ phí cấp GCN</div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowInsuranceModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={insSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
                >
                  <span>{insSubmitting ? 'Đang xử lý...' : 'XÁC NHẬN ĐĂNG KÝ BẢO HIỂM ➔'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── MODAL XEM CHI TIẾT & TẢI GCN BẢO HIỂM ĐIỆN TỬ (BHX04) ── */}
      {/* ────────────────────────────────────────────────────────── */}
      {viewingInsuranceContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200 p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:max-w-none print:p-6">
            {/* Top Toolbar (Hide during print) */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-red-700 font-mono font-bold text-xs">HỢP ĐỒNG #{viewingInsuranceContract.id}</span>
                <span className="text-zinc-400 font-mono">|</span>
                <span className="text-zinc-600 font-mono text-xs font-semibold">{viewingInsuranceContract.soGCN}</span>
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
                  onClick={() => setViewingInsuranceContract(null)}
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
                    Số GCN: <strong className="text-zinc-900 font-bold">{viewingInsuranceContract.soGCN}</strong>
                  </div>
                </div>
              </div>

              {/* Thông tin 4 phần chính */}
              <div className="py-5 space-y-4 text-xs">
                {/* 1. ĐƠN VỊ BẢO HIỂM */}
                <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Đơn vị phát hành:</span>
                    <div className="font-extrabold text-zinc-900 text-xs sm:text-sm">{viewingInsuranceContract.nhaBaoHiem}</div>
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
                      Họ và tên: <strong className="text-zinc-900">{viewingInsuranceContract.hoTenKH}</strong>
                    </div>
                    <div>
                      Số điện thoại: <strong className="text-zinc-900 font-mono">{viewingInsuranceContract.soDienThoai}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      Địa chỉ: <span className="text-zinc-800">{viewingInsuranceContract.diaChi}</span>
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
                      Dòng xe: <strong className="text-zinc-900">{viewingInsuranceContract.tenXe}</strong>
                    </div>
                    <div>
                      Biển số đăng ký:{' '}
                      <strong className="text-red-700 font-mono font-extrabold">{viewingInsuranceContract.bienSo}</strong>
                    </div>
                    <div>
                      Số khung: <span className="font-mono text-zinc-900">{viewingInsuranceContract.soKhung}</span>
                    </div>
                    <div>
                      Số máy: <span className="font-mono text-zinc-900">{viewingInsuranceContract.soMay || 'Theo giấy tờ xe'}</span>
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
                      Gói bảo hiểm: <strong className="text-zinc-900">{viewingInsuranceContract.tenGoi}</strong>
                    </div>
                    <div>
                      Thời hạn bảo hiểm: <strong className="text-zinc-900">{viewingInsuranceContract.thoiHanNam} năm</strong>
                    </div>
                    <div>
                      Từ ngày: <strong className="text-zinc-900 font-mono">{viewingInsuranceContract.ngayBatDau}</strong>
                    </div>
                    <div>
                      Đến ngày: <strong className="text-zinc-900 font-mono">{viewingInsuranceContract.ngayKetThuc}</strong>
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between pt-1 border-t border-zinc-200">
                      <span className="font-semibold text-zinc-800">Tổng phí bảo hiểm đã thanh toán:</span>
                      <strong className="text-sm font-extrabold text-red-700 font-mono">
                        {formatVND(viewingInsuranceContract.phiBaoHiem)}
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
                  <div className="text-[10px] text-zinc-500 font-mono">Ngày cấp: {viewingInsuranceContract.ngayCap}</div>
                  <div className="text-[11px] font-bold text-red-700 mt-1 uppercase font-serif tracking-wider">
                    [ĐÃ KÝ ĐIỆN TỬ VÀ ĐÓNG DẤU MỘC SỐ]
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo tạo bảo hiểm thành công */}
      {insSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-zinc-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <span className="text-xl">🎉</span>
          <div className="text-xs">
            <strong className="font-bold block text-emerald-400">Đăng ký bảo hiểm thành công!</strong>
            <span className="text-zinc-300">Hồ sơ đã được gửi. Đại lý sẽ liên hệ kích hoạt cấp Giấy chứng nhận điện tử.</span>
          </div>
        </div>
      )}
    </div>
  );
}
