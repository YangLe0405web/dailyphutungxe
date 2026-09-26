import { useState } from 'react';
import { mockFeedbacks, mockSurveys, mockSurveyResponses, mockCustomers, type Feedback, type Survey } from '../../data/mockData';

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
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(mockFeedbacks);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'DanhGia' | 'KhieuNai'>('All');
  const [ratingFilter, setRatingFilter] = useState<number | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'DichVu' | 'SanPham' | 'BaoHanh'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ChoXuLy' | 'DaXuLy'>('All');

  // Survey state
  const [surveys, setSurveys] = useState<Survey[]>(mockSurveys);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSurveyTitle, setNewSurveyTitle] = useState('');
  const [newSurveyDesc, setNewSurveyDesc] = useState('');
  const [targetCustId, setTargetCustId] = useState<string>('ALL');
  const [questions, setQuestions] = useState<Array<{ id: string; text: string; opts: string[] }>>([
    { id: 'q1', text: 'Bạn đánh giá thế nào về chất lượng dịch vụ?', opts: ['Rất tốt', 'Tốt', 'Bình thường', 'Cần cải thiện'] },
  ]);
  const [toast, setToast] = useState<string | null>(null);

  // Multi-criteria filter logic
  const filteredFeedbacks = feedbacks.filter(f => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.hoTen.toLowerCase().includes(q);
      const matchContent = f.noiDung.toLowerCase().includes(q);
      if (!matchName && !matchContent) return false;
    }

    // Type filter
    if (typeFilter !== 'All' && f.loaiNhan !== typeFilter) return false;

    // Rating filter
    if (ratingFilter !== 'All' && f.diemDanhGia !== Number(ratingFilter)) return false;

    // Category filter
    if (categoryFilter !== 'All' && f.loaiDanhGia !== categoryFilter) return false;

    // Status filter
    if (statusFilter !== 'All' && f.trangThai !== statusFilter) return false;

    return true;
  });

  function resolveFeedback(id: string) {
    setFeedbacks(fs => fs.map(f => f.id === id ? { ...f, trangThai: 'DaXuLy' } : f));
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

    const targetCustomer = mockCustomers.find(c => c.id === targetCustId);

    const newS: Survey = {
      id: `KS${Date.now().toString().slice(-4)}`,
      title: newSurveyTitle.trim(),
      description: newSurveyDesc.trim() || 'Khảo sát ý kiến đóng góp của khách hàng',
      targetCustomerId: targetCustId,
      targetCustomerName: targetCustomer ? targetCustomer.hoTen : undefined,
      createdDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      questions: questions.filter(q => q.text.trim().length > 0).map(q => ({
        id: q.id,
        text: q.text.trim(),
        opts: q.opts.filter(o => o.trim().length > 0)
      }))
    };

    mockSurveys.unshift(newS);
    setSurveys(prev => [newS, ...prev]);
    setShowCreateModal(false);
    setNewSurveyTitle('');
    setNewSurveyDesc('');
    setTargetCustId('ALL');
    setQuestions([{ id: 'q1', text: 'Bạn đánh giá thế nào về chất lượng dịch vụ?', opts: ['Rất tốt', 'Tốt', 'Bình thường', 'Cần cải thiện'] }]);

    setToast(`🎉 Đã tạo & gửi cuộc khảo sát "${newS.title}" tới ${targetCustId === 'ALL' ? 'TẤT CẢ KHÁCH HÀNG' : targetCustomer?.hoTen}!`);
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
            💬 Phản hồi & Khiếu nại ({pending > 0 ? `${pending} mới` : '0'})
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

      {/* ── TAB 1: FEEDBACK & COMPLAINTS ── */}
      {activeMainTab === 'feedback' && (
        <div>
          {/* Multi-criteria Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 mb-5 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <input
                  type="text"
                  placeholder="🔍 Tìm theo tên khách hàng, nội dung..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:border-red-600"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2 text-zinc-400 text-xs font-bold">✕</button>
                )}
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-zinc-300 text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
                >
                  <option value="All">Loại: Tất cả</option>
                  <option value="DanhGia">⭐ Đánh giá</option>
                  <option value="KhieuNai">⚠️ Khiếu nại</option>
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
              filteredFeedbacks.map(f => (
                <div key={f.id} className="rounded-2xl p-5" style={{ background: 'white', border: `1px solid ${f.trangThai === 'ChoXuLy' && f.loaiNhan === 'KhieuNai' ? 'var(--color-red-300)' : 'var(--color-zinc-200)'}` }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-full font-700"
                        style={{ width: 40, height: 40, background: f.loaiNhan === 'KhieuNai' ? 'var(--color-red-100)' : 'var(--color-zinc-100)', color: f.loaiNhan === 'KhieuNai' ? 'var(--color-red-700)' : 'var(--color-zinc-700)', fontFamily: 'var(--font-display)', fontSize: 16 }}>
                        {f.hoTen[0]}
                      </div>
                      <div>
                        <div className="font-600 text-sm" style={{ color: 'var(--color-zinc-900)' }}>{f.hoTen}</div>
                        <div className="text-xs" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>{f.ngayGui}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Stars r={f.diemDanhGia} />
                      <span className="text-xs font-600 rounded-full px-2.5 py-1"
                        style={{ background: f.loaiNhan === 'KhieuNai' ? '#fee2e2' : '#dcfce7', color: f.loaiNhan === 'KhieuNai' ? 'var(--color-red-700)' : '#16a34a', fontFamily: 'var(--font-mono)' }}>
                        {f.loaiNhan === 'KhieuNai' ? '⚠️ Khiếu nại' : '⭐ Đánh giá'}
                      </span>
                      <span className="text-xs font-600 rounded-full px-2.5 py-1"
                        style={{ background: f.trangThai === 'ChoXuLy' ? '#fef3c7' : '#f4f4f5', color: f.trangThai === 'ChoXuLy' ? '#92400e' : 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>
                        {f.trangThai === 'ChoXuLy' ? 'Chờ xử lý' : 'Đã xử lý'}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-zinc-700)' }}>{f.noiDung}</p>

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

                      {/* Vehicle */}
                      {f.xeDangDung && (
                        <div className="flex items-center gap-1.5 text-zinc-600">
                          <span className="text-zinc-400">🏍️ Xe sở hữu:</span>
                          <span className="font-semibold text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200">
                            {f.xeDangDung}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick Call / Email buttons */}
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${f.soDienThoai || '0901234567'}`}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg transition border border-red-200 flex items-center gap-1"
                      >
                        <span>📞</span> Gọi khách
                      </a>
                      <a
                        href={`mailto:${f.email || 'khachhang@motoshop.vn'}?subject=Phản hồi từ Showroom Motoshop`}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition border border-blue-200 flex items-center gap-1"
                      >
                        <span>✉️</span> Gửi mail
                      </a>
                    </div>
                  </div>

                  {f.ghiChuXuLy && (
                    <div className="mt-2.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs border border-emerald-200 flex items-center gap-2">
                      <span className="font-bold">✓ Ghi chú xử lý:</span>
                      <span>{f.ghiChuXuLy}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-zinc-100)' }}>
                    <div className="text-xs" style={{ color: 'var(--color-zinc-400)', fontFamily: 'var(--font-mono)' }}>
                      Mã KH: <strong>{f.customerId}</strong> · Danh mục: {f.loaiDanhGia === 'DichVu' ? 'Dịch vụ' : f.loaiDanhGia === 'SanPham' ? 'Sản phẩm' : 'Bảo hành'}
                    </div>
                    {f.trangThai === 'ChoXuLy' && (
                      <button onClick={() => resolveFeedback(f.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600 transition-colors"
                        style={{ background: '#dcfce7', color: '#16a34a', border: 'none', cursor: 'pointer' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Đánh dấu đã xử lý
                      </button>
                    )}
                  </div>
                </div>
              ))
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
              const responses = mockSurveyResponses.filter(r => r.surveyId === s.id);
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
                      onClick={() => alert(`Khảo sát "${s.title}" hiện có ${responses.length} lượt hoàn thành.\n\n` + (responses.length > 0 ? responses.map(r => `- ${r.customerName} (${r.submittedDate}): ${JSON.stringify(r.answers)}`).join('\n') : 'Chưa có lượt phản hồi nào.'))}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    >
                      Xem chi tiết phản hồi
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
                      {mockCustomers.map(c => (
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
        </div>
      )}
    </div>
  );
}
