import React, { useState, useEffect, useMemo } from 'react';
import {
  type Customer,
  type Survey,
  getCustomerTier,
  computeSurveyStatus,
  formatSurveyDateTime,
  surveyStatusLabels,
} from '../../data/mockData';
import { surveyApi, feedbackApi } from '../../services/api';

interface SurveyTakingProps {
  currentCustomer: Customer | null;
  onBack: () => void;
  onNavigateToDashboard?: () => void;
  onRequireLogin?: () => void;
}

export default function SurveyTaking({
  currentCustomer,
  onBack,
  onNavigateToDashboard,
  onRequireLogin,
}: SurveyTakingProps) {
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [answersMap, setAnswersMap] = useState<Record<string, Record<string, string>>>({});
  const [unansweredMap, setUnansweredMap] = useState<Record<string, string[]>>({});
  const [surveyToast, setSurveyToast] = useState<{ show: boolean; title: string; countdown: number } | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [showCompletedList, setShowCompletedList] = useState(false);

  // Star rating feedback state
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState('');
  const [feedbackToast, setFeedbackToast] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const starLabels: Record<number, string> = {
    1: 'Rất không hài lòng',
    2: 'Chưa hài lòng',
    3: 'Bình thường',
    4: 'Hài lòng',
    5: 'Rất hài lòng',
  };

  const loadSurveys = () => {
    if (!currentCustomer) return;
    const all = surveyApi.getAll();
    const custTier = getCustomerTier(currentCustomer.tongChiTieu).tier;

    // KS02: Hiển thị đầy đủ các bài khảo sát mà khách hàng đủ điều kiện tham gia
    const eligible = all.filter(s => {
      if (s.targetCustomerId === currentCustomer.id) return true;
      if (s.targetCustomerIds && s.targetCustomerIds.includes(currentCustomer.id)) return true;
      if (s.targetCustomerId === 'ALL' || !s.targetCustomerId) {
        if (!s.targetCustomerTier || s.targetCustomerTier === 'ALL') return true;
        if (s.targetCustomerTier === custTier) return true;
      }
      return false;
    });

    setActiveSurveys(eligible);

    const responses = surveyApi.getResponses();
    const done = responses
      .filter(r => r.customerId === currentCustomer.id)
      .map(r => r.surveyId);
    setCompletedIds(done);
  };

  useEffect(() => {
    loadSurveys();
    const handleRefresh = () => loadSurveys();
    window.addEventListener('crm-data-refresh', handleRefresh);
    return () => window.removeEventListener('crm-data-refresh', handleRefresh);
  }, [currentCustomer?.id]);

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

    // KS04: Bỏ cảnh báo lỗi nếu người dùng đã vừa chọn đáp án
    setUnansweredMap(prev => {
      const currentList = prev[surveyId] || [];
      const updated = currentList.filter(id => id !== questionId);
      return { ...prev, [surveyId]: updated };
    });
    if (errorToast) setErrorToast(null);
  };

  const handleSubmitSurvey = (survey: Survey) => {
    if (!currentCustomer) {
      onRequireLogin?.();
      return;
    }

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
    const missing: string[] = [];
    survey.questions.forEach(q => {
      if (!sAnswers[q.id]) missing.push(q.id);
    });

    if (missing.length > 0) {
      setUnansweredMap(prev => ({ ...prev, [survey.id]: missing }));
      setErrorToast(
        `⚠️ Vui lòng hoàn thành tất cả câu hỏi trước khi gửi khảo sát! (Còn thiếu ${missing.length}/${survey.questions.length} câu)`
      );
      const firstMissingEl = document.getElementById(`survey-${survey.id}-q-${missing[0]}`);
      if (firstMissingEl) {
        firstMissingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => setErrorToast(null), 5000);
      return;
    }

    // Gửi khảo sát
    surveyApi.submitResponse({
      surveyId: survey.id,
      customerId: currentCustomer.id,
      customerName: currentCustomer.hoTen,
      answers: sAnswers,
    });

    setCompletedIds(prev => [...prev, survey.id]);
    setSurveyToast({ show: true, title: survey.title, countdown: 4 });
    setErrorToast(null);
  };

  const handleSendFeedback = async () => {
    if (rating === 0 || !currentCustomer) return;
    setSubmittingFeedback(true);
    try {
      await feedbackApi.create({
        customerId: currentCustomer.id,
        hoTen: currentCustomer.hoTen,
        soDienThoai: currentCustomer.soDienThoai,
        email: currentCustomer.email,
        noiDung: review.trim() || `Khách hàng đánh giá ${rating}/5 sao cho trải nghiệm tổng thể tại showroom.`,
        diemDanhGia: rating,
        loaiDanhGia: 'DichVu',
        loaiNhan: rating < 3 ? 'KhieuNai' : 'DanhGia',
        xeDangDung: 'Khách hàng Motoshop',
      });
      setFeedbackToast(true);
      setReview('');
      setRating(0);
      setTimeout(() => setFeedbackToast(false), 5000);
    } catch {
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Phân chia danh sách khảo sát: Chưa làm vs Đã làm
  const pendingSurveys = useMemo(
    () => activeSurveys.filter(s => !completedIds.includes(s.id)),
    [activeSurveys, completedIds]
  );
  const doneSurveys = useMemo(
    () => activeSurveys.filter(s => completedIds.includes(s.id)),
    [activeSurveys, completedIds]
  );

  const active = hovered || rating;

  // Unauthenticated screen
  if (!currentCustomer) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center" style={{ background: 'var(--color-zinc-50)' }}>
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-zinc-200 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-4xl mb-5 text-amber-600">
            📋
          </div>
          <h2 className="text-xl font-extrabold text-zinc-900 mb-2 uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            KHẢO SÁT Ý KIẾN KHÁCH HÀNG
          </h2>
          <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
            Bạn cần đăng nhập để xem và làm các bài khảo sát chăm sóc khách hàng, đóng góp ý kiến cũng như nhận các phần quà ưu đãi độc quyền từ Đại lý.
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={onRequireLogin}
              className="w-full py-3 rounded-xl font-bold text-xs bg-red-700 text-white hover:bg-red-800 transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
            >
              <span>🔑 ĐĂNG NHẬP ĐỂ LÀM KHẢO SÁT</span>
            </button>

            <button
              onClick={onBack}
              className="w-full py-2.5 rounded-xl font-semibold text-xs bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition cursor-pointer"
            >
              ← Quay lại Showroom xe
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{ background: 'var(--color-zinc-50)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Navigation & Breadcrumb Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>←</span>
              <span>Quay lại Showroom</span>
            </button>
            {onNavigateToDashboard && (
              <button
                onClick={onNavigateToDashboard}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition cursor-pointer"
              >
                👤 Trang cá nhân
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-zinc-400">
            Khách hàng: <strong className="text-zinc-800">{currentCustomer.hoTen}</strong>
          </div>
        </div>

        {/* Hero Title Card */}
        <div className="rounded-3xl p-6 sm:p-8 mb-6 text-white shadow-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--color-zinc-950) 0%, #450a0a 60%, var(--color-zinc-950) 100%)' }}>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-600/30 text-red-300 border border-red-500/40 mb-3">
              <span>⭐</span>
              <span>CỔNG KHẢO SÁT & Ý KIẾN KHÁCH HÀNG</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              ĐÓNG GÓP Ý KIẾN CÙNG MOTOSHOP
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              Mỗi ý kiến đóng góp của bạn là động lực giúp chúng tôi không ngừng cải tiến chất lượng dịch vụ bảo dưỡng, phụ tùng và chăm sóc khách hàng tốt hơn mỗi ngày.
            </p>
          </div>
          <div className="absolute right-6 -bottom-6 text-8xl opacity-10 pointer-events-none select-none">
            📋
          </div>
        </div>

        {/* Global Error Banner */}
        {errorToast && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-500 text-red-800 text-xs font-bold shadow-md animate-in fade-in slide-in-from-top-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>{errorToast}</span>
            </div>
            <button onClick={() => setErrorToast(null)} className="text-red-500 hover:text-red-800 font-bold px-2 py-1">✕</button>
          </div>
        )}

        {/* KS01: Khung cảm ơn tự động đếm ngược 4s */}
        {surveyToast && (
          <div className="mb-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-sm flex items-center justify-between flex-wrap gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <div className="text-sm font-bold text-emerald-950">
                  CẢM ƠN BẠN ĐÃ GỬI PHẢN HỒI KHẢO SÁT!
                </div>
                <div className="text-xs text-emerald-800 mt-0.5">
                  Bài khảo sát: <span className="font-bold underline">{surveyToast.title}</span> đã được ghi nhận thành công.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                ⏱ Tự đóng sau {surveyToast.countdown}s
              </span>
              <button
                type="button"
                onClick={() => setSurveyToast(null)}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-200/60 hover:bg-emerald-200 px-3 py-1 rounded-lg transition"
              >
                Đóng ngay
              </button>
            </div>
          </div>
        )}

        {/* Main Survey Form Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm mb-6">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-200 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full bg-red-700" />
              <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                BÀI KHẢO SÁT DÀNH CHO BẠN
              </h2>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
              Có {pendingSurveys.length} bài cần thực hiện
            </span>
          </div>

          {/* KS02: Danh sách các bài khảo sát chưa làm */}
          {pendingSurveys.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <div className="text-5xl mb-3">✅</div>
              <h3 className="text-base font-bold text-zinc-900 mb-1">
                {doneSurveys.length > 0 ? 'Bạn đã hoàn thành tất cả các bài khảo sát hiện có!' : 'Hiện chưa có cuộc khảo sát nào dành cho bạn.'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                Cảm ơn bạn đã luôn đồng hành cùng Motoshop. Chúng tôi sẽ thông báo ngay khi có bài khảo sát mới hoặc chương trình ưu đãi mới!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {pendingSurveys.map(s => {
                const liveStatus = computeSurveyStatus(s);
                const statusCfg = surveyStatusLabels[liveStatus] || surveyStatusLabels.DangDienRa;
                const sAnswers = answersMap[s.id] || {};
                const answeredCount = Object.keys(sAnswers).length;
                const isAllAnswered = answeredCount === s.questions.length;
                const missingForThis = unansweredMap[s.id] || [];

                return (
                  <div
                    key={s.id}
                    className="p-5 sm:p-6 rounded-2xl border-2 transition-all duration-200"
                    style={{
                      borderColor: missingForThis.length > 0 ? '#ef4444' : 'var(--color-zinc-200)',
                      background: missingForThis.length > 0 ? '#fef2f2' : 'white',
                    }}
                  >
                    {/* Header bài khảo sát */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 pb-3 border-b border-zinc-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                            style={{ background: statusCfg.bg, color: statusCfg.text, borderColor: statusCfg.border }}
                          >
                            ● {statusCfg.label}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500 font-bold">MÃ: {s.id}</span>
                        </div>
                        <h3 className="font-extrabold text-base sm:text-lg text-zinc-900">
                          {s.title}
                        </h3>
                        {s.description && (
                          <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{s.description}</p>
                        )}
                      </div>

                      {/* KS06: Hiển thị thời gian khảo sát */}
                      {(s.startDate || s.endDate) && (
                        <div className="text-right shrink-0 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 text-[11px] font-mono text-zinc-600">
                          <div>📅 <span className="font-semibold text-zinc-800">Bắt đầu:</span> {formatSurveyDateTime(s.startDate)}</div>
                          <div className="text-red-700 font-bold mt-0.5">⏳ <span className="font-semibold text-zinc-800">Kết thúc:</span> {formatSurveyDateTime(s.endDate)}</div>
                        </div>
                      )}
                    </div>

                    {/* Danh sách câu hỏi */}
                    <div className="space-y-4">
                      {s.questions.map((q, qi) => {
                        const isMissing = missingForThis.includes(q.id);
                        return (
                          <div
                            key={q.id}
                            id={`survey-${s.id}-q-${q.id}`}
                            className={`p-4 rounded-xl transition-all duration-200 ${
                              isMissing
                                ? 'border-2 border-red-500 bg-red-50/60 shadow-xs'
                                : 'border border-zinc-200/80 bg-zinc-50/50 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-3">
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
                            <div className="flex flex-wrap gap-2.5">
                              {q.opts.map(opt => {
                                const sel = sAnswers[q.id] === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleSelectAnswer(s.id, q.id, opt)}
                                    className="rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer"
                                    style={{
                                      border: sel ? '1.5px solid var(--color-red-700)' : '1.5px solid var(--color-zinc-300)',
                                      background: sel ? 'var(--color-red-700)' : 'white',
                                      color: sel ? 'white' : 'var(--color-zinc-800)',
                                      boxShadow: sel ? '0 2px 6px rgba(185, 28, 28, 0.25)' : 'none',
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
                    <div className="pt-4 mt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs font-mono text-zinc-600">
                        Tiến độ hoàn thành: <strong className={isAllAnswered ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>{answeredCount}/{s.questions.length}</strong> câu
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSubmitSurvey(s)}
                        className={`w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
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

          {/* KS01: Lịch sử khảo sát đã hoàn thành */}
          {doneSurveys.length > 0 && (
            <div className="mt-8 pt-5 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setShowCompletedList(!showCompletedList)}
                className="text-xs font-bold text-zinc-700 hover:text-zinc-900 flex items-center gap-2 cursor-pointer"
              >
                <span>{showCompletedList ? '▼' : '▶'}</span>
                <span>LỊCH SỬ KHẢO SÁT ĐÃ HOÀN THÀNH ({doneSurveys.length})</span>
              </button>
              {showCompletedList && (
                <div className="mt-3 space-y-2.5 animate-in fade-in duration-200">
                  {doneSurveys.map(ds => (
                    <div key={ds.id} className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-zinc-800">{ds.title}</span>
                        <span className="text-[10px] font-mono text-zinc-500 ml-2">({ds.id})</span>
                      </div>
                      <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded text-[11px]">
                        ✓ Đã hoàn thành
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Star rating feedback form */}
        <div className="rounded-3xl p-6 sm:p-8 bg-white border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 rounded-full bg-red-700" />
            <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
              GỬI ĐÁNH GIÁ TRỰC TIẾP TỚI BAN QUẢN LÝ
            </h2>
          </div>

          {feedbackToast ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-base font-bold text-zinc-900">Cảm ơn đánh giá của bạn!</div>
              <p className="text-xs text-zinc-500 mt-1">Phản hồi của bạn đã được chuyển trực tiếp tới Ban Quản lý Đại lý để cải tiến chất lượng phục vụ.</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-zinc-500 mb-4">
                Nếu bạn có ý kiến đóng góp tổng quan, trải nghiệm ghé thăm showroom hoặc các phản hồi khác, hãy chấm điểm và chia sẻ cùng chúng tôi:
              </p>

              <div className="flex justify-center gap-3 mb-3">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    className="p-1 cursor-pointer transition-transform duration-100"
                    style={{
                      transform: active >= s ? 'scale(1.2)' : 'scale(1)',
                    }}
                  >
                    <svg
                      width="38"
                      height="38"
                      viewBox="0 0 24 24"
                      fill={active >= s ? '#f59e0b' : 'none'}
                      stroke={active >= s ? '#f59e0b' : '#d4d4d8'}
                      strokeWidth="1.5"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                ))}
              </div>

              {active > 0 && (
                <div
                  className="text-center text-sm font-semibold mb-4"
                  style={{ color: active >= 4 ? '#16a34a' : active === 3 ? '#d97706' : '#dc2626' }}
                >
                  {starLabels[active]}
                </div>
              )}

              <textarea
                rows={4}
                value={review}
                onChange={e => setReview(e.target.value)}
                placeholder="Chia sẻ trải nghiệm, góp ý hoặc khiếu nại của bạn về dịch vụ showroom..."
                className="w-full p-3.5 rounded-2xl border border-zinc-200 text-xs text-zinc-900 bg-white focus:outline-none focus:border-red-600 resize-none"
              />

              <button
                type="button"
                onClick={handleSendFeedback}
                disabled={rating === 0 || submittingFeedback}
                className="w-full mt-4 py-3 rounded-xl font-bold text-white transition-all shadow cursor-pointer"
                style={{
                  background: rating > 0 ? 'var(--color-red-700)' : 'var(--color-zinc-300)',
                  cursor: rating > 0 ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.04em',
                }}
              >
                {submittingFeedback ? 'Đang gửi phản hồi...' : rating === 0 ? 'Vui lòng chọn số sao' : 'GỬI ĐÁNH GIÁ ĐÓNG GÓP'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
