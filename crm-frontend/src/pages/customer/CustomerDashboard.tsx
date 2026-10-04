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
  type OrderStatus,
  type AppointmentStatus,
  type Vehicle,
  type Customer,
  type Survey,
  type Order,
  type Appointment,
} from '../../data/mockData';
import { customerApi, vehicleApi, feedbackApi, surveyApi, orderApi, appointmentApi } from '../../services/api';
import ImageUploader from '../../components/shared/ImageUploader';

interface CustomerDashboardProps {
  currentCustomer: Customer | null;
  onNavigateToShowroom?: () => void;
  onCustomerChange?: (c: Customer | null) => void;
}

const orderStatusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  ChoDuyet: { label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
  DangGiao: { label: 'Đang giao', color: '#2563eb', bg: '#dbeafe' },
  HoanThanh: { label: 'Hoàn thành', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  DaHuy: { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
};

const apptStatusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  ChoDuyet: { label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
  DaXacNhan: { label: 'Đã xác nhận', color: '#2563eb', bg: '#dbeafe' },
  DangThucHien: { label: 'Đang thực hiện', color: 'var(--color-red-700)', bg: 'var(--color-red-100)' },
  HoanThanh: { label: 'Hoàn thành', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  DaHuy: { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
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

export default function CustomerDashboard({ currentCustomer, onNavigateToShowroom, onCustomerChange }: CustomerDashboardProps) {
  const [tab, setTab] = useState<0 | 1 | 2>(0);
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [activeVehicleIndex, setActiveVehicleIndex] = useState(0);

  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [packageChoice, setPackageChoice] = useState('12');
  const [requestSent, setRequestSent] = useState(false);

  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [regForm, setRegForm] = useState({ tenXe: '', bienSo: '', soKhung: '', mauSac: '', namSanXuat: '2025' });

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
    vehicleApi.getAll().then(data => {
      if (data) {
        const cIdNum = parseInt(currentCustomer.id.replace(/\D/g, ''), 10);
        const vList = data.filter(v => {
          if (v.customerId === currentCustomer.id) return true;
          const vNum = parseInt(v.customerId.replace(/\D/g, ''), 10);
          return !isNaN(cIdNum) && !isNaN(vNum) && cIdNum === vNum;
        });
        setMyVehicles(vList);
      }
    });
  };

  useEffect(() => {
    loadCustomerData();
    const handleRefresh = (e: any) => {
      loadCustomerData();
    };
    window.addEventListener('crm-data-refresh', handleRefresh);
    window.addEventListener('crm-admin-notification', handleRefresh);
    return () => {
      window.removeEventListener('crm-data-refresh', handleRefresh);
      window.removeEventListener('crm-admin-notification', handleRefresh);
    };
  }, [currentCustomer?.id]);

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

  const currentVehicle = myVehicles[activeVehicleIndex] || myVehicles[0];

  const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  const warrantyDays = currentVehicle ? daysUntil(currentVehicle.hanBaoHanh) : 0;

  const tabs = [
    { label: `Đơn mua hàng (${myOrders.length})`, icon: '📦' },
    { label: `Lịch hẹn (${myAppts.length})`, icon: '📅' },
    { label: `Khảo sát (${pendingSurveysCount > 0 ? `${pendingSurveysCount} mới` : '0'})`, icon: '⭐' },
  ];

  // TC13: Khách hàng đăng ký xe mới -> Trạng thái 'ChoDuyet' chờ cửa hàng kiểm tra và duyệt
  const handleRegisterVehicle = async () => {
    if (!regForm.tenXe.trim() || !regForm.bienSo.trim()) return;
    const newV = await vehicleApi.registerVehicle({
      customerId: currentCustomer.id,
      tenXe: regForm.tenXe.trim(),
      bienSo: regForm.bienSo.trim(),
      namSanXuat: Number(regForm.namSanXuat) || 2025,
      hanBaoHanh: new Date(Date.now() + 3 * 365 * 86400000).toISOString().split('T')[0],
      mauSac: regForm.mauSac.trim() || 'Đen bóng',
      trangThaiBaoHanh: 'ConHan',
      soKhung: regForm.soKhung.trim() || `RLH${Date.now().toString().slice(-8)}`,
      trangThaiDuyet: 'ChoDuyet',
    });

    setMyVehicles(prev => [newV, ...prev]);
    setActiveVehicleIndex(0);
    setShowAddVehicleModal(false);
    setRegForm({ tenXe: '', bienSo: '', soKhung: '', mauSac: '', namSanXuat: '2025' });
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

  return (
    <div style={{ background: 'var(--color-zinc-50)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="py-8" style={{ background: 'linear-gradient(135deg, var(--color-zinc-950) 0%, #3b0606 60%, var(--color-zinc-950) 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8 flex items-center justify-between gap-5 flex-wrap">
          <div className="flex items-center gap-5">
            {currentCustomer.avatar ? (
              <img src={currentCustomer.avatar} alt={currentCustomer.hoTen} className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-red-600 shadow-md" />
            ) : (
              <div className="flex items-center justify-center rounded-full text-2xl font-800 shrink-0"
                style={{ width: 60, height: 60, background: 'var(--color-red-700)', color: 'white', fontFamily: 'var(--font-display)' }}>
                {currentCustomer.hoTen[0]}
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
              onClick={() => setTab(2)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow transition"
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
                    {currentVehicle.soKhung}
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
                </div>
              </div>
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'var(--color-zinc-200)' }}>
              {[
                { label: 'Đơn hàng', value: myOrders.length, color: 'var(--color-zinc-900)' },
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
            <button key={i} onClick={() => setTab(i as 0 | 1 | 2)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-600 transition-all relative"
              style={{
                background: tab === i ? 'white' : 'transparent',
                color: tab === i ? 'var(--color-zinc-900)' : 'var(--color-zinc-500)',
                border: 'none', cursor: 'pointer',
                boxShadow: tab === i ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}>
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
              {i === 2 && pendingSurveysCount > 0 && (
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

        {tab === 1 && (
          <div className="flex flex-col gap-4">
            {myAppts.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 bg-white rounded-2xl border border-zinc-200">Chưa có lịch hẹn nào</div>
            ) : myAppts.map(appt => {
              const cfg = apptStatusConfig[appt.trangThai];
              return (
                <div key={appt.id} className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-700" style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {SVC_LABELS[appt.loaiDichVu]}
                        </span>
                        <StatusBadge {...cfg} />
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-zinc-600)' }}>
                        📅 {appt.ngayHen} lúc {appt.gioHen}
                      </div>
                      {appt.tenXe && <div className="text-sm mt-1" style={{ color: 'var(--color-zinc-500)' }}>🏍️ {appt.tenXe} · {appt.bienSo}</div>}
                      {appt.ghiChu && (
                        <div className="mt-2 text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--color-zinc-50)', color: 'var(--color-zinc-600)', border: '1px solid var(--color-zinc-200)' }}>
                          💬 "{appt.ghiChu}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 2 && <DynamicSurveyTab customer={currentCustomer} />}
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

      {/* Register Vehicle Modal for Customer */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base text-zinc-900" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                ĐĂNG KÝ PHƯƠNG TIỆN CỦA TÔI
              </h3>
              <button onClick={() => setShowAddVehicleModal(false)} className="text-zinc-400 hover:text-zinc-600 font-bold text-lg">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-700">Tên mẫu xe *</label>
                <input
                  type="text"
                  placeholder="VD: Honda Wave Alpha 110cc"
                  value={regForm.tenXe}
                  onChange={e => setRegForm({ ...regForm, tenXe: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-700">Biển số xe *</label>
                <input
                  type="text"
                  placeholder="VD: 51K-12345"
                  value={regForm.bienSo}
                  onChange={e => setRegForm({ ...regForm, bienSo: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-700">Số khung (VIN) *</label>
                <input
                  type="text"
                  placeholder="VD: RLHKC110JA1234567"
                  value={regForm.soKhung}
                  onChange={e => setRegForm({ ...regForm, soKhung: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700">Màu sắc</label>
                  <input
                    type="text"
                    placeholder="VD: Đỏ đen"
                    value={regForm.mauSac}
                    onChange={e => setRegForm({ ...regForm, mauSac: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700">Năm sản xuất</label>
                  <input
                    type="number"
                    placeholder="VD: 2025"
                    value={regForm.namSanXuat}
                    onChange={e => setRegForm({ ...regForm, namSanXuat: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddVehicleModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              >
                Hủy
              </button>
              <button
                onClick={handleRegisterVehicle}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow-md"
              >
                Xác nhận đăng ký
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
