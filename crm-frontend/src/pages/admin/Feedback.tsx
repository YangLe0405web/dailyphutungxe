import { useState, useEffect, useRef } from 'react';
import {
  type Feedback,
  type Survey,
  type SurveyResponse,
  type Customer
} from '../../data/mockData';
import { customerApi, feedbackApi, surveyApi, chatApi, formatCustomerId, type ChatMessage } from '../../services/api';

function Stars({ r }: { r: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s <= r ? '#f59e0b' : 'none'} stroke={s <= r ? '#f59e0b' : 'var(--color-zinc-300)'} strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const [activeMainTab, setActiveMainTab] = useState<'feedback' | 'survey'>('feedback');
  
  // Feedback state & multi-criteria filters
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'DanhGiaMoi' | 'DanhGia'>('All');
  const [ratingFilter, setRatingFilter] = useState<number | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'DichVu' | 'SanPham' | 'BaoHanh'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ChoXuLy' | 'DaXuLy'>('All');
  const [previewMedia, setPreviewMedia] = useState<string | null>(null);

  // Survey state
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [selectedSurveyForStats, setSelectedSurveyForStats] = useState<Survey | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSurveyTitle, setNewSurveyTitle] = useState('');
  const [newSurveyDesc, setNewSurveyDesc] = useState('');
  const [targetCustId, setTargetCustId] = useState<string>('ALL');
  const [questions, setQuestions] = useState<Array<{ id: string; text: string; opts: string[] }>>([
    { id: 'q1', text: 'Bạn đánh giá thế nào về chất lượng dịch vụ?', opts: ['Rất tốt', 'Tốt', 'Bình thường', 'Cần cải thiện'] },
  ]);
  const [toast, setToast] = useState<string | null>(null);

  // ĐG06 & ĐG07 States: Call, Email, and Web Live Chat
  const [callFeedback, setCallFeedback] = useState<Feedback | null>(null);
  const [callNotes, setCallNotes] = useState('');
  const [callStatus, setCallStatus] = useState<'DaNgheMay' | 'KhongNgheMay' | 'HenGoiLai'>('DaNgheMay');

  const [emailFeedback, setEmailFeedback] = useState<Feedback | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const [chatFeedback, setChatFeedback] = useState<Feedback | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const adminChatEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const [cList, fbList] = await Promise.all([
        customerApi.getAll(),
        feedbackApi.getAll(),
      ]);
      setCustomers(cList);
      setFeedbacks(fbList);
      setSurveys(surveyApi.getAll());
      setSurveyResponses(surveyApi.getResponses());
    } catch (err) {
      console.warn('FeedbackPage load error:', err);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('crm-data-refresh', loadData);

    const channel = chatApi.getBroadcastChannel();
    const handleIncomingMessage = (newMsg: ChatMessage) => {
      if (!newMsg) return;
      if (chatFeedback && formatCustomerId(newMsg.customerId) === formatCustomerId(chatFeedback.customerId)) {
        setChatMessages(prev => {
          if (!prev.some(m => m.id === newMsg.id)) {
            return [...prev, newMsg];
          }
          return prev;
        });
      }
    };

    if (channel) {
      channel.onmessage = (e) => {
        if (e.data) handleIncomingMessage(e.data);
      };
    }

    const handleChatUpdate = (e: any) => {
      handleIncomingMessage(e.detail as ChatMessage);
    };
    window.addEventListener('crm-chat-update', handleChatUpdate);

    return () => {
      window.removeEventListener('crm-data-refresh', loadData);
      window.removeEventListener('crm-chat-update', handleChatUpdate);
    };
  }, [chatFeedback]);

  // Real-time polling when chat modal is open
  useEffect(() => {
    if (!chatFeedback) return;
    const cleanId = formatCustomerId(chatFeedback.customerId);
    const interval = setInterval(async () => {
      try {
        const msgs = await chatApi.getMessages(cleanId);
        setChatMessages(prev => {
          const hasNew = msgs.length !== prev.length || msgs.some(m => !prev.some(p => p.id === m.id));
          if (hasNew) return msgs;
          return prev;
        });
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [chatFeedback]);

  useEffect(() => {
    if (chatFeedback) {
      adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatFeedback]);

  // Handlers for Call, Email, Chat (ĐG06, ĐG07)
  const handleSaveCallLog = async () => {
    if (!callFeedback) return;
    const statusText = callStatus === 'DaNgheMay' ? 'Đã trao đổi qua điện thoại' : callStatus === 'HenGoiLai' ? 'Hẹn gọi lại sau' : 'Khách không bắt máy';
    const noteText = `[Cuộc gọi - ${statusText}] ${callNotes.trim() || 'Nhân viên CSKH đã liên hệ hỗ trợ khách hàng.'}`;

    await feedbackApi.resolve(callFeedback.id, noteText);
    setFeedbacks(prev => prev.map(f => f.id === callFeedback.id ? { ...f, trangThai: 'DaXuLy', ghiChuXuLy: noteText } : f));
    setToast(`✓ Đã lưu lịch sử cuộc gọi với khách hàng ${callFeedback.hoTen}!`);
    setTimeout(() => setToast(null), 3500);
    setCallFeedback(null);
  };

  const handleSendEmail = async () => {
    if (!emailFeedback) return;
    setSendingEmail(true);
    const noteText = `[Email đã gửi - ${emailSubject}] Nội dung: ${emailBody.slice(0, 80)}...`;

    await feedbackApi.resolve(emailFeedback.id, noteText);
    setFeedbacks(prev => prev.map(f => f.id === emailFeedback.id ? { ...f, trangThai: 'DaXuLy', ghiChuXuLy: noteText } : f));

    // Launch email client
    const mailtoUrl = `mailto:${encodeURIComponent(emailFeedback.email || 'khachhang@motoshop.vn')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');

    setSendingEmail(false);
    setToast(`✓ Đã gửi email phản hồi thành công tới ${emailFeedback.email || 'khách hàng'}!`);
    setTimeout(() => setToast(null), 3500);
    setEmailFeedback(null);
  };

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatFeedback || !chatInput.trim()) return;

    const sent = await chatApi.sendMessage({
      customerId: formatCustomerId(chatFeedback.customerId),
      sender: 'staff',
      senderName: 'CSKH Showroom Motoshop',
      content: chatInput.trim(),
    });

    setChatMessages(prev => {
      if (!prev.some(m => m.id === sent.id)) return [...prev, sent];
      return prev;
    });
    setChatInput('');
    setTimeout(() => {
      adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Multi-criteria filter logic (ĐG12, ĐG14, ĐG15)
  const filteredFeedbacks = feedbacks.filter(f => {
    // Search filter (ĐG14: Tìm theo tên khách hàng, nội dung, tên sản phẩm, mã SP/SKU)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.hoTen.toLowerCase().includes(q);
      const matchContent = f.noiDung.toLowerCase().includes(q);
      const matchProductName = (f.productName || '').toLowerCase().includes(q);
      const matchProductId = (f.productId || '').toLowerCase().includes(q);
      const matchVehicle = (f.xeDangDung || '').toLowerCase().includes(q);
      if (!matchName && !matchContent && !matchProductName && !matchProductId && !matchVehicle) return false;
    }

    // Type filter (ĐG12 & ĐG15: Đổi 'Khiếu nại' thành 'Đánh giá mới')
    if (typeFilter === 'DanhGiaMoi') {
      const isNewReview = f.trangThai === 'ChoXuLy' || f.loaiNhan === 'KhieuNai' || (f as any).loaiNhan === 'DanhGiaMoi';
      if (!isNewReview) return false;
    } else if (typeFilter === 'DanhGia') {
      if (f.trangThai === 'ChoXuLy') return false;
    }

    // Rating filter
    if (ratingFilter !== 'All' && f.diemDanhGia !== Number(ratingFilter)) return false;

    // Category filter
    if (categoryFilter !== 'All' && f.loaiDanhGia !== categoryFilter) return false;

    // Status filter
    if (statusFilter !== 'All' && f.trangThai !== statusFilter) return false;

    return true;
  });

  // ĐG10 & ĐG13: Nút đã xử lý hoạt động ngay lập tức và lưu thông tin nhân viên xử lý
  async function resolveFeedback(id: string) {
    const staffName = 'Nguyễn Minh Tuấn (Chuyên viên CSKH)';
    const today = new Date().toISOString().split('T')[0];
    await feedbackApi.resolve(id, 'Đã xác nhận và hoàn tất xử lý đánh giá của khách hàng.', staffName);
    setFeedbacks(fs => fs.map(f => f.id === id ? {
      ...f,
      trangThai: 'DaXuLy',
      nhanVienXuLy: staffName,
      ngayXuLy: today,
      ghiChuXuLy: f.ghiChuXuLy || 'Đã xác nhận và hoàn tất xử lý đánh giá của khách hàng.'
    } : f));
    setToast(`✓ Đã xác nhận xử lý thành công! Nhân viên: ${staffName} (${today})`);
    setTimeout(() => setToast(null), 3500);
  }

  const pending = feedbacks.filter(f => f.trangThai === 'ChoXuLy').length;

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      { id: `q${prev.length + 1}`, text: '', opts: ['Có', 'Không', 'Khác'] }
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx: number, val: string) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, text: val } : q));
  };

  const handleQuestionOptChange = (qIdx: number, oIdx: number, val: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === qIdx) {
        const newOpts = [...q.opts];
        newOpts[oIdx] = val;
        return { ...q, opts: newOpts };
      }
      return q;
    }));
  };

  const handleCreateSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurveyTitle.trim()) return;

    const targetCustomer = customers.find(c => c.id === targetCustId);

    const created = surveyApi.create({
      title: newSurveyTitle.trim(),
      description: newSurveyDesc.trim() || 'Khảo sát ý kiến đóng góp của khách hàng',
      targetCustomerId: targetCustId,
      targetCustomerName: targetCustomer ? targetCustomer.hoTen : undefined,
      questions: questions.filter(q => q.text.trim().length > 0).map(q => ({
        id: q.id,
        text: q.text.trim(),
        opts: q.opts.filter(o => o.trim().length > 0)
      }))
    });

    setSurveys(prev => [created, ...prev.filter(s => s.id !== created.id)]);
    setShowCreateModal(false);
    setNewSurveyTitle('');
    setNewSurveyDesc('');
    setTargetCustId('ALL');
    setQuestions([{ id: 'q1', text: 'Bạn đánh giá thế nào về chất lượng dịch vụ?', opts: ['Rất tốt', 'Tốt', 'Bình thường', 'Cần cải thiện'] }]);

    setToast(`🎉 Đã tạo & gửi cuộc khảo sát "${created.title}" tới ${targetCustId === 'ALL' ? 'TẤT CẢ KHÁCH HÀNG' : targetCustomer?.hoTen}!`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            PHẢN HỒI & KHẢO SÁT
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--color-zinc-500)' }}>
            Lắng nghe ý kiến khách hàng và tạo khảo sát chăm sóc khách hàng
          </p>
        </div>

        {/* Top Main Navigation Tabs */}
        <div className="flex p-1 bg-zinc-200 rounded-xl">
          <button
            onClick={() => setActiveMainTab('feedback')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeMainTab === 'feedback' ? 'bg-white text-zinc-900 shadow' : 'text-zinc-600'}`}
          >
            💬 Phản hồi & Đánh giá mới ({pending > 0 ? `${pending} mới` : '0'})
          </button>
          <button
            onClick={() => setActiveMainTab('survey')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeMainTab === 'survey' ? 'bg-white text-zinc-900 shadow' : 'text-zinc-600'}`}
          >
            📝 Quản lý & Tạo Khảo sát
          </button>
        </div>
      </div>

      {toast && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-emerald-600 font-bold">✕</button>
        </div>
      )}

      {/* ── TAB 1: FEEDBACK & REVIEWS (ĐG12: ĐÁNH GIÁ MỚI & XỬ LÝ) ── */}
      {activeMainTab === 'feedback' && (
        <div>
          {/* Multi-criteria Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 mb-5 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search (ĐG14: Tìm theo tên khách hàng, nội dung, tên sản phẩm, mã SP/SKU) */}
              <div className="lg:col-span-2 relative">
                <input
                  type="text"
                  placeholder="🔍 Tìm theo tên khách hàng, nội dung, tên sản phẩm, mã SP (SKU)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:border-red-600"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2 text-zinc-400 text-xs font-bold">✕</button>
                )}
              </div>

              {/* Type Filter (ĐG15: Đổi 'Khiếu nại' thành 'Đánh giá mới') */}
              <div>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-zinc-300 text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
                >
                  <option value="All">Phân loại: Tất cả</option>
                  <option value="DanhGiaMoi">✨ Đánh giá mới ({feedbacks.filter(f => f.trangThai === 'ChoXuLy').length})</option>
                  <option value="DanhGia">⭐ Đánh giá thông thường</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <select
                  value={ratingFilter}
                  onChange={e => setRatingFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-zinc-300 text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
                >
                  <option value="All">Đánh giá: Tất cả sao</option>
                  <option value="5">5 ⭐ (Rất hài lòng)</option>
                  <option value="4">4 ⭐ (Hài lòng)</option>
                  <option value="3">3 ⭐ (Bình thường)</option>
                  <option value="2">2 ⭐ (Chưa tốt)</option>
                  <option value="1">1 ⭐ (Kém)</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-zinc-300 text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
                >
                  <option value="All">Danh mục: Tất cả</option>
                  <option value="DichVu">Dịch vụ</option>
                  <option value="SanPham">Sản phẩm</option>
                  <option value="BaoHanh">Bảo hành</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs text-zinc-500">
              <div>
                Hiển thị <strong>{filteredFeedbacks.length}</strong> / {feedbacks.length} phản hồi
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Trạng thái:</span>
                <button
                  onClick={() => setStatusFilter('All')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusFilter === 'All' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setStatusFilter('ChoXuLy')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusFilter === 'ChoXuLy' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800'}`}
                >
                  Chờ xử lý ({feedbacks.filter(f => f.trangThai === 'ChoXuLy').length})
                </button>
                <button
                  onClick={() => setStatusFilter('DaXuLy')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusFilter === 'DaXuLy' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'}`}
                >
                  Đã xử lý
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {filteredFeedbacks.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 bg-white rounded-2xl border border-zinc-200 text-sm">
                Không tìm thấy phản hồi nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              filteredFeedbacks.map(f => {
                const isNewReview = f.trangThai === 'ChoXuLy';
                const cleanProductTitle = (f.productName || f.xeDangDung || 'Dịch vụ bảo dưỡng & phụ tùng chính hãng').replace(/\s*\([^)]*\)/g, '').trim();

                return (
                <div key={f.id} className="rounded-2xl p-5" style={{ background: 'white', border: `1px solid ${isNewReview ? 'var(--color-amber-300)' : 'var(--color-zinc-200)'}` }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-full font-700"
                        style={{ width: 40, height: 40, background: isNewReview ? 'var(--color-amber-100)' : 'var(--color-zinc-100)', color: isNewReview ? 'var(--color-amber-800)' : 'var(--color-zinc-700)', fontFamily: 'var(--font-display)', fontSize: 16 }}>
                        {f.hoTen[0]}
                      </div>
                      <div>
                        <div className="font-600 text-sm" style={{ color: 'var(--color-zinc-900)' }}>{f.hoTen}</div>
                        <div className="text-xs" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>{f.ngayGui}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Stars r={f.diemDanhGia} />
                      {/* ĐG12 & ĐG15: Đổi 'Khiếu nại' thành 'Đánh giá mới' */}
                      <span className="text-xs font-600 rounded-full px-2.5 py-1"
                        style={{ background: isNewReview ? '#fef3c7' : '#dcfce7', color: isNewReview ? '#92400e' : '#16a34a', fontFamily: 'var(--font-mono)' }}>
                        {isNewReview ? '✨ Đánh giá mới' : '⭐ Đánh giá'}
                      </span>
                      <span className="text-xs font-600 rounded-full px-2.5 py-1"
                        style={{ background: f.trangThai === 'ChoXuLy' ? '#fee2e2' : '#f4f4f5', color: f.trangThai === 'ChoXuLy' ? '#b91c1c' : 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>
                        {f.trangThai === 'ChoXuLy' ? 'Chờ xử lý' : 'Đã xử lý'}
                      </span>
                    </div>
                  </div>

                  {/* Product Information Card (ĐG08 & ĐG11: Không hiển thị biển số xe) */}
                  <div className="mt-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/90 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {f.productImage ? (
                        <img
                          src={f.productImage}
                          alt={f.productName || 'Sản phẩm'}
                          className="w-12 h-12 rounded-xl object-contain bg-white border border-zinc-200 p-1 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 text-xl flex items-center justify-center shrink-0 shadow-2xs">
                          {f.productType === 'XeMau' ? '🏍️' : f.productType === 'PhuTung' ? '📦' : '⚙️'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            f.productType === 'XeMau' ? 'bg-red-100 text-red-700' : f.productType === 'PhuTung' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {f.productType === 'XeMau' ? '🏍️ XE MÁY' : f.productType === 'PhuTung' ? '📦 PHỤ TÙNG' : '⚙️ DỊCH VỤ SHOWROOM'}
                          </span>
                          {f.productId && (
                            <span className="text-[10px] text-zinc-400 font-mono font-semibold">Mã SKU: {f.productId}</span>
                          )}
                        </div>
                        <div className="font-extrabold text-xs text-zinc-900 mt-1">
                          {cleanProductTitle}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-zinc-500 font-mono hidden sm:block">
                      {f.loaiDanhGia === 'SanPham' ? 'Đã mua tại đại lý' : 'Dịch vụ tại showroom'}
                    </div>
                  </div>

                  {/* Feedback Content */}
                  <div className="mt-3 text-xs text-zinc-800 bg-white p-3 rounded-xl border border-zinc-200/60 leading-relaxed font-sans">
                    {f.noiDung}
                  </div>

                  {/* ĐG09: Media Gallery (Hình ảnh & Video đính kèm từ khách hàng) */}
                  {f.hinhAnhDinhKem && f.hinhAnhDinhKem.length > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                      <div className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5 font-mono">
                        <span>📷</span> MEDIA ĐÍNH KÈM CỦA KHÁCH HÀNG ({f.hinhAnhDinhKem.length}):
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {f.hinhAnhDinhKem.map((mediaUrl, mIdx) => {
                          const isVideo = mediaUrl.includes('data:video') || mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm');
                          if (isVideo) {
                            return (
                              <video
                                key={mIdx}
                                src={mediaUrl}
                                controls
                                className="w-32 h-24 rounded-xl object-cover border border-zinc-300 bg-black shadow-xs"
                              />
                            );
                          }
                          return (
                            <img
                              key={mIdx}
                              src={mediaUrl}
                              alt={`Ảnh đính kèm ${mIdx + 1}`}
                              onClick={() => setPreviewMedia(mediaUrl)}
                              className="w-20 h-20 rounded-xl object-cover border border-zinc-300 hover:opacity-90 hover:scale-105 transition cursor-pointer shadow-xs bg-white"
                              title="Bấm để xem ảnh phóng to"
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Customer Contact Details Bar */}
                  <div className="mt-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Phone */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-400">📞 SĐT:</span>
                        <a
                          href={`tel:${f.soDienThoai || '0901234567'}`}
                          className="font-bold text-red-700 hover:underline font-mono"
                        >
                          {f.soDienThoai || '0901234567'}
                        </a>
                      </div>

                      {/* Email */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-400">✉️ Email:</span>
                        <a
                          href={`mailto:${f.email || 'khachhang@motoshop.vn'}`}
                          className="font-semibold text-blue-700 hover:underline"
                        >
                          {f.email || 'khachhang@motoshop.vn'}
                        </a>
                      </div>

                      {/* Address */}
                      {f.diaChi && (
                        <div className="flex items-center gap-1.5 text-zinc-600">
                          <span className="text-zinc-400">📍 Địa chỉ:</span>
                          <span className="font-medium">{f.diaChi}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Call / Email / Chat action buttons (ĐG06 & ĐG07) */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCallFeedback(f);
                          setCallNotes(f.ghiChuXuLy || '');
                          setCallStatus('DaNgheMay');
                        }}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg transition border border-red-200 flex items-center gap-1 cursor-pointer"
                        title="Mở popup gọi điện và lưu nhật ký cuộc gọi"
                      >
                        <span>📞</span> Gọi khách
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEmailFeedback(f);
                          setEmailSubject(`[Motoshop Showroom] Phản hồi đánh giá của Quý khách ${f.hoTen}`);
                          setEmailBody(`Kính gửi Quý khách ${f.hoTen},\n\nShowroom Motoshop xin chân thành cảm ơn Quý khách đã tin tưởng mua sắm và gửi đánh giá cho sản phẩm "${cleanProductTitle}".\n\nNếu Quý khách cần hỗ trợ thêm thông tin hoặc dịch vụ bảo dưỡng, xin vui lòng liên hệ hotline: 1900 6868.\n\nTrân trọng,\nĐội ngũ CSKH Showroom Motoshop.`);
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition border border-blue-200 flex items-center gap-1 cursor-pointer"
                        title="Soạn và gửi email phản hồi trực tiếp"
                      >
                        <span>✉️</span> Gửi mail
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setChatFeedback(f);
                          chatApi.getMessages(f.customerId).then(setChatMessages);
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition border border-emerald-200 flex items-center gap-1 cursor-pointer"
                        title="Nhắn tin trực tiếp với khách hàng trên web"
                      >
                        <span>💬</span> Nhắn tin
                      </button>
                    </div>
                  </div>

                  {/* ĐG10: Thông tin nhân viên phụ trách xử lý đánh giá */}
                  {f.trangThai === 'DaXuLy' && (
                    <div className="mt-2.5 px-3.5 py-2.5 bg-emerald-50 text-emerald-900 rounded-xl text-xs border border-emerald-200 flex items-center justify-between flex-wrap gap-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-emerald-700">👤 Nhân viên xử lý:</span>
                        <span className="font-bold">{f.nhanVienXuLy || 'Nguyễn Minh Tuấn (Chuyên viên CSKH)'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-mono text-[11px]">
                        <span>📅 Ngày xử lý:</span>
                        <span className="font-bold">{f.ngayXuLy || f.ngayGui}</span>
                      </div>
                    </div>
                  )}

                  {f.ghiChuXuLy && (
                    <div className="mt-2.5 px-3 py-1.5 bg-zinc-50 text-zinc-700 rounded-lg text-xs border border-zinc-200 flex items-center gap-2">
                      <span className="font-bold text-zinc-900">📝 Ghi chú:</span>
                      <span>{f.ghiChuXuLy}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-zinc-100)' }}>
                    <div className="text-xs" style={{ color: 'var(--color-zinc-400)', fontFamily: 'var(--font-mono)' }}>
                      Mã KH: <strong>{f.customerId}</strong> · Danh mục: {f.loaiDanhGia === 'DichVu' ? 'Dịch vụ' : f.loaiDanhGia === 'SanPham' ? 'Sản phẩm' : 'Bảo hành'}
                    </div>
                    {/* ĐG13: Nút xác nhận đã xử lý hoạt động ngay lập tức */}
                    {f.trangThai === 'ChoXuLy' && (
                      <button
                        type="button"
                        onClick={() => resolveFeedback(f.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs hover:bg-emerald-200 cursor-pointer"
                        style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}
                        title="Xác nhận đã tiếp nhận và hoàn tất xử lý đánh giá này"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Xác nhận đã xử lý
                      </button>
                    )}
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: SURVEY CREATOR & MANAGEMENT ── */}
      {activeMainTab === 'survey' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
            <div>
              <h3 className="font-extrabold text-zinc-900 text-lg uppercase" style={{ fontFamily: 'var(--font-display)' }}>DANH SÁCH KHẢO SÁT ĐÃ GỬI</h3>
              <p className="text-xs text-zinc-500">Tạo khảo sát mới để gửi câu hỏi trực tiếp vào ứng dụng của khách hàng</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-800 shadow transition flex items-center gap-2"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
            >
              <span>+ TẠO KHẢO SÁT MỚI</span>
            </button>
          </div>

          {/* List of Surveys */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {surveys.map(s => {
              const responses = surveyResponses.filter(r => r.surveyId === s.id);
              return (
                <div key={s.id} className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">{s.id}</span>
                      <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        {s.status === 'Active' ? '✓ Đang hoạt động' : 'Đã đóng'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-zinc-900 text-base mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                      {s.title}
                    </h4>
                    <p className="text-xs text-zinc-500 mb-3 leading-relaxed">{s.description}</p>

                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1 text-xs mb-3 font-mono">
                      <div><span className="text-zinc-500">Đối tượng nhận:</span> <strong className="text-zinc-800">{s.targetCustomerId === 'ALL' ? '🌐 TẤT CẢ KHÁCH HÀNG' : `👤 ${s.targetCustomerName || s.targetCustomerId}`}</strong></div>
                      <div><span className="text-zinc-500">Số câu hỏi:</span> <strong className="text-zinc-800">{s.questions.length} câu</strong></div>
                      <div><span className="text-zinc-500">Ngày tạo:</span> <strong className="text-zinc-800">{s.createdDate}</strong></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-red-700 font-mono">
                      📊 {responses.length} phản hồi từ khách hàng
                    </span>
                    <button
                      onClick={() => setSelectedSurveyForStats(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 cursor-pointer transition"
                    >
                      📊 Xem thống kê kết quả
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Create Survey */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-200">
                  <h3 className="font-extrabold text-base text-zinc-900 uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                    TẠO KHẢO SÁT & GỬI TỚI KHÁCH HÀNG
                  </h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-600 font-bold text-lg">✕</button>
                </div>

                <form onSubmit={handleCreateSurvey} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase">Tiêu đề khảo sát *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Khảo sát dịch vụ thay nhớt chính hãng 2025"
                      value={newSurveyTitle}
                      onChange={e => setNewSurveyTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase">Mô tả cuộc khảo sát</label>
                    <textarea
                      rows={2}
                      placeholder="Mô tả mục đích khảo sát..."
                      value={newSurveyDesc}
                      onChange={e => setNewSurveyDesc(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase">Gửi tới đối tượng khách hàng *</label>
                    <select
                      value={targetCustId}
                      onChange={e => setTargetCustId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600 font-semibold"
                    >
                      <option value="ALL">🌐 TẤT CẢ KHÁCH HÀNG (Gửi toàn hệ thống)</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          👤 {c.hoTen} ({c.soDienThoai} - {c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Questions Section */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-zinc-900 uppercase">Danh sách câu hỏi ({questions.length})</label>
                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="text-xs font-bold text-red-700 hover:underline"
                      >
                        + Thêm câu hỏi
                      </button>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {questions.map((q, qIdx) => (
                        <div key={q.id || qIdx} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-red-700">Câu {qIdx + 1}.</span>
                            <input
                              type="text"
                              required
                              placeholder="Nhập nội dung câu hỏi..."
                              value={q.text}
                              onChange={e => handleQuestionTextChange(qIdx, e.target.value)}
                              className="flex-1 p-2 rounded-lg border border-zinc-300 text-xs bg-white"
                            />
                            {questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(qIdx)}
                                className="text-zinc-400 hover:text-red-600 text-xs font-bold px-1"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          <div className="pl-6 space-y-1">
                            <span className="text-[10px] font-semibold text-zinc-500 uppercase">Các lựa chọn đáp án:</span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {q.opts.map((opt, oIdx) => (
                                <input
                                  key={oIdx}
                                  type="text"
                                  value={opt}
                                  onChange={e => handleQuestionOptChange(qIdx, oIdx, e.target.value)}
                                  className="p-1.5 rounded border border-zinc-200 text-xs bg-white"
                                  placeholder={`Đáp án ${oIdx + 1}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow"
                    >
                      🚀 GỬI KHẢO SÁT NGAY
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Survey Statistics (Rubric 4.1.7) */}
          {selectedSurveyForStats && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto space-y-5">
                <div className="flex justify-between items-start pb-3 border-b border-zinc-200">
                  <div>
                    <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                      MÃ KHẢO SÁT: {selectedSurveyForStats.id}
                    </span>
                    <h3 className="font-extrabold text-lg text-zinc-900 mt-1 uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                      THỐNG KÊ KẾT QUẢ: {selectedSurveyForStats.title}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{selectedSurveyForStats.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSurveyForStats(null)}
                    className="text-zinc-400 hover:text-zinc-700 font-bold text-xl px-2"
                  >
                    ✕
                  </button>
                </div>

                {/* Quick summary stats */}
                {(() => {
                  const sResponses = surveyResponses.filter(r => r.surveyId === selectedSurveyForStats.id);
                  return (
                    <div className="space-y-5">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
                          <div className="text-xl font-extrabold text-zinc-900 font-display">{sResponses.length}</div>
                          <div className="text-[11px] text-zinc-500 uppercase font-mono">Tổng phản hồi</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
                          <div className="text-xl font-extrabold text-blue-700 font-display">{selectedSurveyForStats.questions.length}</div>
                          <div className="text-[11px] text-blue-600 uppercase font-mono">Câu hỏi đánh giá</div>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                          <div className="text-xl font-extrabold text-emerald-700 font-display">
                            {selectedSurveyForStats.targetCustomerId === 'ALL' ? 'Toàn bộ' : selectedSurveyForStats.targetCustomerName || 'Cá nhân'}
                          </div>
                          <div className="text-[11px] text-emerald-700 uppercase font-mono">Đối tượng khảo sát</div>
                        </div>
                      </div>

                      {/* Question-by-question statistical breakdown */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold font-mono text-zinc-800 uppercase tracking-wider">
                          TỶ LỆ LỰA CHỌN THEO TỪNG CÂU HỎI
                        </h4>

                        {selectedSurveyForStats.questions.map((q, qIdx) => {
                          const totalAnswersForQ = sResponses.filter(r => r.answers && r.answers[q.id]).length;

                          return (
                            <div key={q.id} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-3">
                              <div className="text-sm font-bold text-zinc-900 flex items-start gap-2">
                                <span className="text-red-700 font-mono">Câu {qIdx + 1}:</span>
                                <span>{q.text}</span>
                              </div>

                              <div className="space-y-2">
                                {q.opts.map((opt, optIdx) => {
                                  const voteCount = sResponses.filter(r => r.answers && r.answers[q.id] === opt).length;
                                  const pct = totalAnswersForQ > 0 ? Math.round((voteCount / totalAnswersForQ) * 100) : 0;
                                  const colors = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed'];
                                  const barColor = colors[optIdx % colors.length];

                                  return (
                                    <div key={opt} className="space-y-1">
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold text-zinc-700">{opt}</span>
                                        <span className="font-mono text-zinc-500 font-bold">
                                          {voteCount} phiếu ({pct}%)
                                        </span>
                                      </div>
                                      <div className="w-full h-2 rounded-full bg-zinc-200 overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all duration-500"
                                          style={{ width: `${pct}%`, background: barColor }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Respondent list */}
                      <div className="pt-3 border-t border-zinc-200">
                        <h4 className="text-xs font-bold font-mono text-zinc-800 uppercase tracking-wider mb-2">
                          DANH SÁCH KHÁCH HÀNG ĐÃ THAM GIA ({sResponses.length})
                        </h4>
                        {sResponses.length === 0 ? (
                          <div className="text-xs text-zinc-400 py-3 text-center">Chưa có khách hàng nào gửi câu trả lời.</div>
                        ) : (
                          <div className="divide-y divide-zinc-100 max-h-40 overflow-y-auto">
                            {sResponses.map(r => (
                              <div key={r.id} className="py-2 flex items-center justify-between text-xs">
                                <div className="font-semibold text-zinc-900">👤 {r.customerName}</div>
                                <div className="text-zinc-400 font-mono">Ngày gửi: {r.submittedDate}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: CUỘC GỌI & NHẬT KÝ TRAO ĐỔI (ĐG06) ── */}
      {callFeedback && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-red-100 text-red-700 rounded-xl text-lg">📞</span>
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-900 uppercase font-mono tracking-wider">
                    GỌI ĐIỆN CHO KHÁCH HÀNG
                  </h3>
                  <div className="text-[11px] text-zinc-500">Ghi nhận nhật ký liên hệ CSKH trực tiếp</div>
                </div>
              </div>
              <button
                onClick={() => setCallFeedback(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Customer Details Box */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-zinc-900">{callFeedback.hoTen}</span>
                <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-200">
                  {callFeedback.soDienThoai || '0901234567'}
                </span>
              </div>
              <div className="text-xs text-zinc-600">
                <span>Sản phẩm đánh giá: </span>
                <strong className="text-zinc-800">{callFeedback.productName || callFeedback.xeDangDung || 'Dịch vụ Showroom'}</strong>
              </div>
              <div className="text-xs text-zinc-500 italic bg-white p-2.5 rounded-xl border border-zinc-200">
                "{callFeedback.noiDung}"
              </div>
            </div>

            {/* Call Action Link */}
            <div className="flex items-center gap-3">
              <a
                href={`tel:${callFeedback.soDienThoai || '0901234567'}`}
                className="flex-1 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-2xl text-xs text-center transition shadow-md shadow-red-700/20 flex items-center justify-center gap-2"
              >
                <span>📲</span> Nhấn để quay số ({callFeedback.soDienThoai || '0901234567'})
              </a>
            </div>

            {/* Call Status Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-700">Trạng thái cuộc gọi:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'DaNgheMay', label: '✓ Đã nghe máy', color: 'emerald' },
                  { key: 'HenGoiLai', label: '🕒 Hẹn gọi lại', color: 'amber' },
                  { key: 'KhongNgheMay', label: '✕ Không bắt máy', color: 'zinc' },
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCallStatus(item.key as any)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      callStatus === item.key
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Call Notes Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-700">Ghi chú nội dung trao đổi:</label>
              <textarea
                rows={3}
                placeholder="Ghi nhận phản hồi của khách hàng qua cuộc gọi, hướng giải quyết đã thống nhất..."
                value={callNotes}
                onChange={e => setCallNotes(e.target.value)}
                className="w-full p-3 rounded-2xl border border-zinc-300 text-xs focus:outline-none focus:border-red-600 leading-relaxed"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setCallFeedback(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveCallLog}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-black text-white transition shadow-sm"
              >
                Lưu nhật ký & Đánh dấu đã xử lý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: GỬI EMAIL PHẢN HỒI (ĐG06) ── */}
      {emailFeedback && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-100 text-blue-700 rounded-xl text-lg">✉️</span>
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-900 uppercase font-mono tracking-wider">
                    GỬI EMAIL PHẢN HỒI KHÁCH HÀNG
                  </h3>
                  <div className="text-[11px] text-zinc-500">Soạn thư điện tử gửi trực tiếp tới hòm thư khách hàng</div>
                </div>
              </div>
              <button
                onClick={() => setEmailFeedback(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Recipient info */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Gửi tới khách hàng:</span>
                <strong className="text-zinc-900">{emailFeedback.hoTen}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Địa chỉ Email:</span>
                <strong className="text-blue-700 font-mono">{emailFeedback.email || 'khachhang@motoshop.vn'}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Sản phẩm phản hồi:</span>
                <span className="font-semibold text-zinc-800">{emailFeedback.productName || emailFeedback.xeDangDung || 'Dịch vụ'}</span>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-700">Chọn mẫu phản hồi nhanh:</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmailSubject(`[Motoshop Showroom] Cảm ơn Quý khách ${emailFeedback.hoTen} đã đánh giá tích cực`);
                    setEmailBody(`Kính gửi Quý khách ${emailFeedback.hoTen},\n\nShowroom Motoshop xin chân thành cảm ơn Quý khách đã tin tưởng mua sắm và dành tặng đánh giá 5 sao cho sản phẩm "${emailFeedback.productName || 'xe máy/phụ tùng'}".\n\nChúng tôi luôn cam kết đem đến dịch vụ hậu mãi và bảo hành chu đáo nhất cho Quý khách.\n\nTrân trọng,\nBan Quản lý Showroom Motoshop.`);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition"
                >
                  ⭐ Cảm ơn đánh giá 5 sao
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailSubject(`[Motoshop Showroom] Phản hồi xử lý hỗ trợ kỹ thuật cho Quý khách ${emailFeedback.hoTen}`);
                    setEmailBody(`Kính gửi Quý khách ${emailFeedback.hoTen},\n\nShowroom Motoshop đã tiếp nhận phản hồi của Quý khách về sản phẩm "${emailFeedback.productName || ''}".\n\nChúng tôi rất lấy làm tiếc vì sự bất tiện này và mong muốn mời Quý khách ghé đại lý tại địa chỉ gần nhất để kỹ thuật viên kiểm tra và hỗ trợ đổi mới phụ tùng hoàn toàn miễn phí theo chính sách bảo hành 100%.\n\nHotline kỹ thuật: 1900 6868.\nTrân trọng!`);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition"
                >
                  ⚠️ Giải quyết khiếu nại & Đổi mới
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailSubject(`[Motoshop Showroom] Tặng mã ưu đãi tri ân Quý khách ${emailFeedback.hoTen}`);
                    setEmailBody(`Kính gửi Quý khách ${emailFeedback.hoTen},\n\nĐể cảm ơn Quý khách đã đóng góp ý kiến quý báu giúp đại lý cải tiến chất lượng phục vụ, Motoshop xin gửi tặng Quý khách mã Voucher: TRIAN15 (Giảm 15% cho lần mua phụ tùng hoặc bảo dưỡng định kỳ tiếp theo).\n\nChúc Quý khách luôn có những hành trình vạn dặm bình an!`);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition"
                >
                  🎁 Tặng voucher tri ân
                </button>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-700">Tiêu đề email:</label>
              <input
                type="text"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>

            {/* Body */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-700">Nội dung thư:</label>
              <textarea
                rows={5}
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                className="w-full p-3 rounded-2xl border border-zinc-300 text-xs focus:outline-none focus:border-blue-600 leading-relaxed font-sans"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setEmailFeedback(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={sendingEmail}
                onClick={handleSendEmail}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white transition shadow-sm flex items-center gap-1.5"
              >
                <span>✉️</span> {sendingEmail ? 'Đang gửi...' : 'Gửi Email phản hồi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: NHẮN TIN TRỰC TIẾP QUA WEB (ĐG07) ── */}
      {chatFeedback && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col h-[520px] animate-in fade-in zoom-in-95 duration-150">
            {/* Chat Header */}
            <div className="p-4 bg-zinc-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-700 text-white font-bold flex items-center justify-center text-sm font-mono shrink-0">
                  {chatFeedback.hoTen[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{chatFeedback.hoTen}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-emerald-400 font-mono">Online</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Mã KH: {chatFeedback.customerId} · {chatFeedback.soDienThoai}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setChatFeedback(null)}
                className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Context bar */}
            <div className="px-4 py-2 bg-zinc-100 text-[11px] text-zinc-600 border-b border-zinc-200 flex items-center justify-between shrink-0">
              <span className="truncate">
                Đang hỗ trợ về: <strong>{chatFeedback.productName || chatFeedback.xeDangDung || 'Dịch vụ'}</strong>
              </span>
              <span className="font-mono text-zinc-500 shrink-0 ml-2">Đánh giá {chatFeedback.diemDanhGia}⭐</span>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-50">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  Chưa có tin nhắn nào. Hãy gửi lời chào để bắt đầu hỗ trợ khách hàng!
                </div>
              ) : (
                chatMessages
                  .filter(m => m.customerId === chatFeedback.customerId || m.customerId === 'ALL')
                  .map(m => {
                    const isStaff = m.sender === 'staff';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] text-zinc-400 font-mono mb-0.5 px-1">
                          {m.senderName} · {m.sentAt}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                            isStaff
                              ? 'bg-red-700 text-white rounded-tr-xs shadow-xs'
                              : 'bg-white text-zinc-900 border border-zinc-200 rounded-tl-xs shadow-2xs'
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })
              )}
              <div ref={adminChatEndRef} />
            </div>

            {/* Quick replies */}
            <div className="px-3 py-1.5 bg-white border-t border-zinc-100 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 scrollbar-none">
              {[
                'Dạ em chào anh/chị ạ!',
                'Showroom xin hỗ trợ đổi mới ngay ạ.',
                'Dạ anh/chị cần tư vấn thêm gì không ạ?',
                'Cảm ơn anh/chị nhiều ạ!',
              ].map(rep => (
                <button
                  key={rep}
                  type="button"
                  onClick={() => setChatInput(rep)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 shrink-0 transition"
                >
                  {rep}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder="Nhập tin nhắn phản hồi tới khách hàng..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:border-red-600"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center gap-1"
              >
                <span>Gửi</span>
                <span>➢</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ĐG09: Lightbox modal for previewing enlarged photos */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-pointer"
          onClick={() => setPreviewMedia(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewMedia(null)}
              className="absolute top-4 right-4 bg-zinc-900/90 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm hover:bg-black cursor-pointer shadow-lg z-10"
            >
              ✕
            </button>
            <img src={previewMedia} alt="Xem phóng to" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl mx-auto border border-white/20" />
          </div>
        </div>
      )}
    </div>
  );
}
