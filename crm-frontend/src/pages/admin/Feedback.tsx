import { useState, useEffect, useRef } from 'react';
import {
  type Feedback,
  type Survey,
  type SurveyResponse,
  type Customer,
  type StaffAccount,
  mockStaffAccounts,
  computeSurveyStatus,
  formatSurveyDateTime,
  surveyStatusLabels,
  getCustomerTier,
} from '../../data/mockData';
import { customerApi, feedbackApi, surveyApi, chatApi, formatCustomerId, catalogVehicleApi, type CatalogVehicle, type ChatMessage } from '../../services/api';
import { addCustomerNotification } from '../../services/notifications';
import { matchVietnameseSearch } from '../../utils/vietnameseSearch';

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

interface FeedbackPageProps {
  currentStaff?: StaffAccount | null;
}

export default function FeedbackPage({ currentStaff }: FeedbackPageProps = {}) {
  const [activeMainTab, setActiveMainTab] = useState<'feedback' | 'survey'>('feedback');
  
  // ĐG10: Đồng bộ tài khoản nhân viên đang thao tác để xử lý đánh giá
  const [activeStaff, setActiveStaff] = useState<StaffAccount | null>(() => {
    if (currentStaff) return currentStaff;
    try {
      const saved = localStorage.getItem('crm_current_staff');
      if (saved) return JSON.parse(saved);
    } catch {}
    return mockStaffAccounts[0];
  });

  useEffect(() => {
    if (currentStaff) {
      setActiveStaff(currentStaff);
    } else {
      try {
        const saved = localStorage.getItem('crm_current_staff');
        if (saved) setActiveStaff(JSON.parse(saved));
      } catch {}
    }
  }, [currentStaff]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'crm_current_staff' && e.newValue) {
        try {
          setActiveStaff(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Highlight mục tiêu khi nhấp vào thông báo
  const [highlightTargetId, setHighlightTargetId] = useState<string | null>(null);

  // Tab phân loại: Tất cả vs Đánh giá Xe vs Đánh giá Phụ tùng (Ảnh 2)
  const [productSectionTab, setProductSectionTab] = useState<'All' | 'Xe' | 'PhuTung'>('All');
  // State nhập nội dung phản hồi của shop trên từng thẻ đánh giá
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const isVehicleFeedback = (f: Feedback): boolean => {
    if (f.productType === 'XeMau') return true;
    if (f.productType === 'PhuTung') return false;
    if (f.loaiDanhGia === 'DichVu') return false;
    const str = `${f.productName || ''} ${f.xeDangDung || ''} ${f.productId || ''} ${f.noiDung || ''}`.toLowerCase();
    return str.includes('xe') || str.includes('sh') || str.includes('air') || str.includes('blade') || str.includes('lead') || str.includes('cbr') || str.includes('future') || str.includes('vespa') || str.startsWith('xm');
  };

  const getProductThumbnail = (f: Feedback): string => {
    if (f.productImage && f.productImage.trim()) return f.productImage;
    const isXe = isVehicleFeedback(f);
    const name = (f.productName || f.xeDangDung || '').toLowerCase();
    if (isXe) {
      const allCat = catalogVehicleApi.getAllSync();
      const cleanN = name.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      const found = allCat.find((c: CatalogVehicle) => {
        const cN = c.tenXe.toLowerCase().trim();
        return cleanN.includes(cN) || cN.includes(cleanN);
      });
      if (found?.hinhAnh) return found.hinhAnh;

      if (name.includes('tuscany') || name.includes('sym')) return '/images/Xe/sym_tuscany_150.jpg';
      if (name.includes('winner')) return '/images/Xe/honda_winner_x.jpg';
      if (name.includes('vision')) return '/images/Xe/honda_vision_2024.jpg';
      if (name.includes('exciter')) return '/images/Xe/yamaha_exciter_155_vva.jpg';
      if (name.includes('grande')) return '/images/Xe/yamaha_grande_hybrid.jpg';
      if (name.includes('nvx')) return '/images/Xe/yamaha_nvx_155_vva.jpg';
      if (name.includes('air') || name.includes('blade')) return '/images/Xe/honda_air_blade_160_abs.jpg';
      if (name.includes('lead')) return '/images/Xe/honda_lead_125cc_dac_biet.jpg';
      if (name.includes('cbr')) return '/images/Xe/honda_cbr150r.jpg';
      if (name.includes('future')) return '/images/Xe/honda_future_125_fi.jpg';
      return '/images/Xe/honda_sh_160i_abs_2024.jpg';
    } else {
      if (name.includes('nhớt') || name.includes('motul')) return 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500';
      if (name.includes('phanh') || name.includes('bố')) return 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500';
      return '/images/phutung/dan_ao_ab_125_den_nham.webp';
    }
  };

  const handleSendShopReply = async (feedbackId: string) => {
    const reply = (replyTexts[feedbackId] || '').trim();
    if (!reply) {
      setToast('⚠️ Vui lòng nhập nội dung phản hồi của shop trước khi gửi.');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const staffName = getStaffHandlingName();
    const today = new Date().toISOString().split('T')[0];
    const targetFb = feedbacks.find(x => x.id === feedbackId);

    await feedbackApi.resolve(feedbackId, reply, staffName);

    setFeedbacks(fs => fs.map(f => f.id === feedbackId ? {
      ...f,
      trangThai: 'DaXuLy',
      nhanVienXuLy: staffName,
      ngayXuLy: today,
      ghiChuXuLy: reply,
      phanHoiCuaShop: reply,
      ngayPhanHoi: today,
    } : f));

    // Bắn thông báo đến tài khoản khách hàng
    if (targetFb?.customerId) {
      const prodName = targetFb.productName || targetFb.xeDangDung || 'sản phẩm';
      addCustomerNotification({
        customerId: targetFb.customerId,
        category: 'review',
        icon: '💬',
        title: 'Showroom Motoshop đã phản hồi đánh giá của bạn',
        message: `Shop đã phản hồi về sản phẩm "${prodName}": "${reply}"`,
        page: 'dashboard',
        tab: 'reviews',
        targetId: feedbackId,
      });
    }

    setReplyTexts(prev => ({ ...prev, [feedbackId]: '' }));
    setToast(`✓ Đã gửi phản hồi thành công và gửi thông báo cho khách hàng (${staffName})!`);
    setTimeout(() => setToast(null), 4000);
  };

  const handleResolveDirectly = async (feedbackId: string) => {
    const reply = (replyTexts[feedbackId] || '').trim();
    const note = reply || 'Đã xác nhận và hoàn tất xử lý đánh giá của khách hàng.';
    const staffName = getStaffHandlingName();
    const today = new Date().toISOString().split('T')[0];
    const targetFb = feedbacks.find(x => x.id === feedbackId);

    await feedbackApi.resolve(feedbackId, note, staffName);

    setFeedbacks(fs => fs.map(f => f.id === feedbackId ? {
      ...f,
      trangThai: 'DaXuLy',
      nhanVienXuLy: staffName,
      ngayXuLy: today,
      ghiChuXuLy: note,
      phanHoiCuaShop: reply || f.phanHoiCuaShop,
      ngayPhanHoi: reply ? today : f.ngayPhanHoi,
    } : f));

    if (targetFb?.customerId && reply) {
      const prodName = targetFb.productName || targetFb.xeDangDung || 'sản phẩm';
      addCustomerNotification({
        customerId: targetFb.customerId,
        category: 'review',
        icon: '💬',
        title: 'Showroom Motoshop đã phản hồi đánh giá của bạn',
        message: `Shop đã phản hồi về sản phẩm "${prodName}": "${reply}"`,
        page: 'dashboard',
        tab: 'reviews',
        targetId: feedbackId,
      });
    }

    setReplyTexts(prev => ({ ...prev, [feedbackId]: '' }));
    setToast(`✓ Đã xác nhận xử lý đánh giá thành công! Nhân viên: ${staffName}`);
    setTimeout(() => setToast(null), 4000);
  };

  const getStaffHandlingName = (): string => {
    const staff = activeStaff || currentStaff;
    if (staff?.hoTen) {
      const title = staff.chucVu || (staff.vaiTro === 'SuperAdmin' ? 'Quản lý Hệ thống' : 'Chuyên viên Bán hàng & CSKH');
      return `${staff.hoTen} (${title})`;
    }
    try {
      const saved = localStorage.getItem('crm_current_staff');
      if (saved) {
        const s = JSON.parse(saved);
        if (s?.hoTen) {
          const title = s.chucVu || (s.vaiTro === 'SuperAdmin' ? 'Quản lý Hệ thống' : 'Chuyên viên Bán hàng & CSKH');
          return `${s.hoTen} (${title})`;
        }
      }
    } catch {}
    const def = mockStaffAccounts[0];
    return `${def.hoTen} (${def.chucVu})`;
  };
  
  // Feedback state & multi-criteria filters
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'DanhGiaMoi' | 'DanhGia'>('All');
  const [ratingFilter, setRatingFilter] = useState<number | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'DichVu' | 'SanPham' | 'BaoHanh'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ChoXuLy' | 'DaXuLy'>('All');
  const [previewMedia, setPreviewMedia] = useState<string | null>(null);

  // Survey state (KS01 - KS08)
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [selectedSurveyForStats, setSelectedSurveyForStats] = useState<Survey | null>(null);
  
  // KS03: Redesign survey detail page & full-page sub-tabs (Ảnh 2 & Ảnh 3)
  const [selectedSurveyDetail, setSelectedSurveyDetail] = useState<Survey | null>(null);
  const [detailSubTab, setDetailSubTab] = useState<'stats' | 'responses'>('stats');
  const [selectedResponseItem, setSelectedResponseItem] = useState<SurveyResponse | null>(null);
  const [surveyCallCareModal, setSurveyCallCareModal] = useState<SurveyResponse | null>(null);
  const [surveyCallStatus, setSurveyCallStatus] = useState<'DaNgheMay' | 'HenGoiLai' | 'KhongNgheMay'>('DaNgheMay');
  const [surveyCallNotes, setSurveyCallNotes] = useState('');
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [surveyStatusTab, setSurveyStatusTab] = useState<'ALL' | 'DangDienRa' | 'SapDienRa' | 'DaKetThuc' | 'Nhap'>('ALL');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSurveyTitle, setNewSurveyTitle] = useState('');
  const [newSurveyDesc, setNewSurveyDesc] = useState('');
  // KS05: Đối tượng nhận khảo sát
  const [targetMode, setTargetMode] = useState<'ALL' | 'TIER' | 'CUSTOM'>('ALL');
  const [selectedTier, setSelectedTier] = useState<'ALL' | 'VIP' | 'ThanThiet' | 'PhoThong' | 'New'>('ALL');
  const [selectedCustIds, setSelectedCustIds] = useState<string[]>([]);
  const [custSearchTerm, setCustSearchTerm] = useState('');

  // KS06: Thời gian khảo sát
  const [surveyStartDate, setSurveyStartDate] = useState('');
  const [surveyEndDate, setSurveyEndDate] = useState('');

  // KS07: Thời gian đăng khảo sát
  const [surveyPublishDate, setSurveyPublishDate] = useState('');

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
      setChatMessages(prev => {
        if (!prev.some(m => m.id === newMsg.id)) {
          return [...prev, newMsg];
        }
        return prev;
      });
    };

    if (channel) {
      channel.onmessage = (e) => {
        if (!e.data) return;
        if (e.data.type === 'sync_pinned_context') {
          const syncId = formatCustomerId(e.data.customerId);
          if (chatFeedback && formatCustomerId(chatFeedback.customerId) === syncId) {
            const ctx = e.data.pinnedContext;
            if (ctx) {
              setChatFeedback(prev => prev ? {
                ...prev,
                productName: ctx.productName || prev.productName,
                productImage: ctx.productImage || prev.productImage,
                diemDanhGia: ctx.rating !== undefined ? ctx.rating : prev.diemDanhGia,
                noiDung: ctx.comment || prev.noiDung,
              } : null);
            }
          }
          return;
        }
        handleIncomingMessage(e.data);
      };
    }

    const handleChatUpdate = (e: any) => {
      handleIncomingMessage(e.detail as ChatMessage);
    };
    window.addEventListener('crm-chat-update', handleChatUpdate);

    const handleOpenFeedbackChat = (e: any) => {
      const targetId = formatCustomerId(e.detail?.customerId);
      if (!targetId) return;
      const matched = feedbacks.find(f => formatCustomerId(f.customerId) === targetId);
      if (matched) {
        setChatFeedback(matched);
      } else {
        setChatFeedback({
          id: `PH-CHAT-${targetId}`,
          customerId: targetId,
          hoTen: e.detail?.customerName || `Khách hàng (${targetId})`,
          soDienThoai: e.detail?.phone || '0901234567',
          email: 'khachhang@motoshop.vn',
          xeDangDung: 'Xe máy / Dịch vụ Motoshop',
          noiDung: 'Hỗ trợ khách hàng trực tuyến',
          diemDanhGia: 5,
          ngayGui: new Date().toISOString().split('T')[0],
          loaiDanhGia: 'DichVu',
          trangThai: 'ChoXuLy',
          loaiNhan: 'DanhGia',
        });
      }
      chatApi.getMessages(targetId).then(setChatMessages);
    };
    window.addEventListener('crm-open-feedback-chat', handleOpenFeedbackChat);

    return () => {
      window.removeEventListener('crm-data-refresh', loadData);
      window.removeEventListener('crm-chat-update', handleChatUpdate);
      window.removeEventListener('crm-open-feedback-chat', handleOpenFeedbackChat);
    };
  }, [chatFeedback]);

  // Đón nhận highlight từ thông báo Admin để chuyển đúng tab Khảo sát hoặc Đánh giá
  useEffect(() => {
    const handleHighlight = async (payload?: any) => {
      let data = payload;
      if (!data) {
        try {
          const raw = sessionStorage.getItem('crm_admin_highlight');
          if (raw) data = JSON.parse(raw);
        } catch {}
      }
      if (!data || data.page !== 'feedback') return;

      // Đồng bộ dữ liệu mới nhất từ backend và cache
      await loadData();

      if (data.category === 'survey' || (data.targetId && data.targetId.startsWith('KS'))) {
        setActiveMainTab('survey');
      } else {
        setActiveMainTab('feedback');
        // Reset sạch bộ lọc để đảm bảo đánh giá mới chắc chắn hiển thị trong danh sách
        setTypeFilter('All');
        setStatusFilter('All');
        setRatingFilter('All');
        setCategoryFilter('All');
        setSearchQuery('');

        const tid = data.targetId || data.meta?.id || data.meta?.feedbackId || data.meta?.customerId;
        if (tid) {
          setHighlightTargetId(tid);
        }
      }
      sessionStorage.removeItem('crm_admin_highlight');
    };

    handleHighlight();
    const onEvent = (e: any) => handleHighlight(e.detail);
    window.addEventListener('crm-admin-highlight-target', onEvent);
    return () => window.removeEventListener('crm-admin-highlight-target', onEvent);
  }, []);

  // Tự động cuộn đến phần tử đánh giá mục tiêu khi highlightTargetId thay đổi
  useEffect(() => {
    if (!highlightTargetId) return;
    const tryScroll = () => {
      const el = document.getElementById(`target-feedback-${highlightTargetId}`) ||
                 document.querySelector(`[data-feedback-id="${highlightTargetId}"]`) ||
                 document.querySelector(`[data-customer-id="${highlightTargetId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    tryScroll();
    const t1 = setTimeout(tryScroll, 150);
    const t2 = setTimeout(tryScroll, 500);
    const t3 = setTimeout(tryScroll, 1000);
    const tClear = setTimeout(() => setHighlightTargetId(null), 8000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tClear);
    };
  }, [highlightTargetId, feedbacks]);

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
    const staffName = getStaffHandlingName();
    const today = new Date().toISOString().split('T')[0];
    const statusText = callStatus === 'DaNgheMay' ? 'Đã trao đổi qua điện thoại' : callStatus === 'HenGoiLai' ? 'Hẹn gọi lại sau' : 'Khách không bắt máy';
    const noteText = `[Cuộc gọi - ${statusText}] ${callNotes.trim() || 'Nhân viên CSKH đã liên hệ hỗ trợ khách hàng.'}`;

    await feedbackApi.resolve(callFeedback.id, noteText, staffName);
    setFeedbacks(prev => prev.map(f => f.id === callFeedback.id ? {
      ...f,
      trangThai: 'DaXuLy',
      ghiChuXuLy: noteText,
      nhanVienXuLy: staffName,
      ngayXuLy: today,
    } : f));
    setToast(`✓ Đã lưu lịch sử cuộc gọi với khách hàng ${callFeedback.hoTen}! Nhân viên xử lý: ${staffName}`);
    setTimeout(() => setToast(null), 3500);
    setCallFeedback(null);
  };

  const handleSendEmail = async () => {
    if (!emailFeedback) return;
    const staffName = getStaffHandlingName();
    const today = new Date().toISOString().split('T')[0];
    setSendingEmail(true);
    const noteText = `[Email đã gửi - ${emailSubject}] Nội dung: ${emailBody.slice(0, 80)}...`;

    await feedbackApi.resolve(emailFeedback.id, noteText, staffName);
    setFeedbacks(prev => prev.map(f => f.id === emailFeedback.id ? {
      ...f,
      trangThai: 'DaXuLy',
      ghiChuXuLy: noteText,
      nhanVienXuLy: staffName,
      ngayXuLy: today,
    } : f));

    // Launch email client
    const mailtoUrl = `mailto:${encodeURIComponent(emailFeedback.email || 'khachhang@motoshop.vn')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');

    setSendingEmail(false);
    setToast(`✓ Đã gửi email phản hồi thành công tới ${emailFeedback.email || 'khách hàng'}! Nhân viên xử lý: ${staffName}`);
    setTimeout(() => setToast(null), 3500);
    setEmailFeedback(null);
  };

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatFeedback || !chatInput.trim()) return;

    const pinned = {
      title: '📌 ĐANG THẢO LUẬN VỀ ĐÁNH GIÁ CỦA BẠN',
      productName: chatFeedback.productName || chatFeedback.xeDangDung || 'Phụ tùng / Xe máy Motoshop',
      productImage: chatFeedback.productImage || (chatFeedback.hinhAnhDinhKem && chatFeedback.hinhAnhDinhKem[0]) || '/images/phutung/motul_7100.png',
      orderId: chatFeedback.orderId ? `Đơn hàng: #${chatFeedback.orderId}` : `Mã phản hồi: #${chatFeedback.id}`,
      rating: chatFeedback.diemDanhGia || 5,
      comment: chatFeedback.noiDung || '',
    };

    const sent = await chatApi.sendMessage({
      customerId: formatCustomerId(chatFeedback.customerId),
      sender: 'staff',
      senderName: activeStaff?.hoTen || 'CSKH Showroom Motoshop',
      content: chatInput.trim(),
      pinnedContext: pinned,
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
  const countXe = feedbacks.filter(f => isVehicleFeedback(f)).length;
  const countPhuTung = feedbacks.filter(f => !isVehicleFeedback(f)).length;

  const filteredFeedbacks = feedbacks.filter(f => {
    // Phân loại 2 phần: Xe hoặc Phụ tùng
    if (productSectionTab === 'Xe' && !isVehicleFeedback(f)) return false;
    if (productSectionTab === 'PhuTung' && isVehicleFeedback(f)) return false;
    // Search filter (ĐG14: Tìm theo tên khách hàng, nội dung, tên sản phẩm, mã SP/SKU - không phân biệt chữ hoa thường)
    if (searchQuery.trim()) {
      const matchName = matchVietnameseSearch(f.hoTen, searchQuery);
      const matchContent = matchVietnameseSearch(f.noiDung, searchQuery);
      const matchProductName = matchVietnameseSearch(f.productName || '', searchQuery);
      const matchProductId = matchVietnameseSearch(f.productId || '', searchQuery);
      const matchVehicle = matchVietnameseSearch(f.xeDangDung || '', searchQuery);
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
  }).sort((a, b) => {
    // Bug 1: Tự động chuyển các đánh giá đã xử lý (DaXuLy) xuống cuối danh sách,
    // ưu tiên hiển thị các đánh giá chưa xử lý (ChoXuLy) ở phía trên
    const isPendingA = a.trangThai === 'ChoXuLy' ? 0 : 1;
    const isPendingB = b.trangThai === 'ChoXuLy' ? 0 : 1;
    if (isPendingA !== isPendingB) {
      return isPendingA - isPendingB; // 0 trước 1: ChoXuLy lên đầu, DaXuLy xuống cuối
    }

    // Trong từng nhóm, sắp xếp theo thời gian mới nhất trước
    const dateA = a.ngayGui ? new Date(a.ngayGui).getTime() : 0;
    const dateB = b.ngayGui ? new Date(b.ngayGui).getTime() : 0;
    if (dateB !== dateA) {
      return dateB - dateA;
    }

    // Dự phòng theo số ID giảm dần (ví dụ FB020 trước FB001)
    const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
    return numB - numA;
  });

  // ĐG10 & ĐG13: Nút đã xử lý hoạt động ngay lập tức và lưu thông tin nhân viên xử lý theo tài khoản đăng nhập
  async function resolveFeedback(id: string) {
    const staffName = getStaffHandlingName();
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

  // KS03: Chọn khảo sát để xem chi tiết toàn màn hình theo Ảnh 2 & 3
  const handleSelectSurveyDetail = (survey: Survey) => {
    setSelectedSurveyDetail(survey);
    setDetailSubTab('stats');
    const resps = surveyResponses.filter(r => r.surveyId === survey.id);
    const defResp = resps.find(r => r.id === 'RESP-002') || resps[0] || null;
    setSelectedResponseItem(defResp);
  };

  const handleDeleteSurvey = async (surveyId: string, surveyTitle?: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài khảo sát "${surveyTitle || surveyId}"?\nThao tác này sẽ xóa vĩnh viễn bài khảo sát và các phản hồi liên quan.`)) {
      return;
    }
    await surveyApi.delete(surveyId);
    setSurveys(prev => prev.filter(s => s.id !== surveyId));
    if (selectedSurveyDetail?.id === surveyId) {
      setSelectedSurveyDetail(null);
    }
    setToast(`✓ Đã xóa thành công bài khảo sát ${surveyId}`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleMarkSurveyResponseHandled = async (respId: string) => {
    try {
      if ((surveyApi as any).markResponseHandled) {
        await (surveyApi as any).markResponseHandled(respId);
      }
    } catch {}
    setSurveyResponses(prev => prev.map(r => r.id === respId ? { ...r, daXuLy: true } : r));
    if (selectedResponseItem && selectedResponseItem.id === respId) {
      setSelectedResponseItem(prev => prev ? { ...prev, daXuLy: true } : null);
    }
    setToast('Đã đánh dấu xử lý thành công phản hồi của khách hàng!');
  };

  const handleSaveSurveyCallCare = async () => {
    if (!surveyCallCareModal) return;
    const respId = surveyCallCareModal.id;
    try {
      if ((surveyApi as any).markResponseHandled) {
        await (surveyApi as any).markResponseHandled(respId);
      }
    } catch {}
    setSurveyResponses(prev => prev.map(r => r.id === respId ? { ...r, daXuLy: true, daGoiDien: true } : r));
    if (selectedResponseItem && selectedResponseItem.id === respId) {
      setSelectedResponseItem(prev => prev ? { ...prev, daXuLy: true } : null);
    }
    setToast(`Đã lưu nhật ký gọi điện chăm sóc cho khách hàng ${surveyCallCareModal.customerName}!`);
    setSurveyCallCareModal(null);
    setSurveyCallNotes('');
  };

  const handleOpenCreateModal = () => {
    const now = new Date();
    const nowIso = now.toISOString().slice(0, 16);
    const endIso = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16);
    setSurveyPublishDate(nowIso);
    setSurveyStartDate(nowIso);
    setSurveyEndDate(endIso);
    setTargetMode('ALL');
    setSelectedTier('ALL');
    setSelectedCustIds([]);
    setCustSearchTerm('');
    setShowCreateModal(true);
  };

  const handleCreateSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurveyTitle.trim()) return;

    let targetCustomerId: string = 'ALL';
    let targetCustomerName: string | undefined = undefined;
    let targetCustomerTier: 'ALL' | 'VIP' | 'Gold' | 'Standard' | 'New' = 'ALL';
    let targetCustomerIds: string[] = [];

    if (targetMode === 'ALL') {
      targetCustomerId = 'ALL';
      targetCustomerTier = 'ALL';
    } else if (targetMode === 'TIER') {
      targetCustomerId = 'ALL';
      targetCustomerTier = selectedTier as any;
    } else if (targetMode === 'CUSTOM') {
      if (selectedCustIds.length === 0) {
        setToast('⚠️ Vui lòng chọn ít nhất 1 khách hàng trong danh sách!');
        setTimeout(() => setToast(null), 3000);
        return;
      }
      targetCustomerIds = selectedCustIds;
      if (selectedCustIds.length === 1) {
        targetCustomerId = selectedCustIds[0];
        const c = customers.find(x => x.id === selectedCustIds[0]);
        targetCustomerName = c ? c.hoTen : undefined;
      } else {
        targetCustomerId = 'ALL';
        targetCustomerName = `${selectedCustIds.length} khách hàng được chọn`;
      }
    }

    // Kiểm tra câu hỏi khảo sát trùng lặp trong cùng một bộ khảo sát (KS - Trùng lặp)
    const trimmedQuestions = questions.filter(q => q.text.trim().length > 0);
    if (trimmedQuestions.length === 0) {
      setToast('⚠️ Vui lòng nhập nội dung cho ít nhất 1 câu hỏi khảo sát!');
      setTimeout(() => setToast(null), 3500);
      return;
    }

    const seenQMap = new Map<string, number>();
    for (let i = 0; i < questions.length; i++) {
      const qText = questions[i].text.trim().toLowerCase();
      if (!qText) continue;
      if (seenQMap.has(qText)) {
        const prevIdx = seenQMap.get(qText)!;
        setToast(`⚠️ Không thể tạo: Câu hỏi số ${i + 1} có nội dung trùng lặp với Câu ${prevIdx} ("${questions[i].text.trim()}")! Vui lòng sửa lại câu hỏi.`);
        setTimeout(() => setToast(null), 5000);
        return;
      }
      seenQMap.set(qText, i + 1);
    }

    const pubDate = surveyPublishDate || new Date().toISOString().slice(0, 16);
    const sDate = surveyStartDate || pubDate;
    const eDate = surveyEndDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16);

    const created = surveyApi.create({
      title: newSurveyTitle.trim(),
      description: newSurveyDesc.trim() || 'Khảo sát ý kiến đóng góp của khách hàng',
      targetCustomerId,
      targetCustomerName,
      targetCustomerTier,
      targetCustomerIds,
      publishDate: pubDate,
      startDate: sDate,
      endDate: eDate,
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
    setTargetMode('ALL');
    setSelectedTier('ALL');
    setSelectedCustIds([]);
    setCustSearchTerm('');
    setQuestions([{ id: 'q1', text: 'Bạn đánh giá thế nào về chất lượng dịch vụ?', opts: ['Rất tốt', 'Tốt', 'Bình thường', 'Cần cải thiện'] }]);

    const statusBadge = surveyStatusLabels[created.status]?.label || created.status;
    let targetLabel = 'TẤT CẢ KHÁCH HÀNG';
    if (targetMode === 'TIER') targetLabel = `HẠNG KHÁCH HÀNG ${selectedTier}`;
    else if (targetMode === 'CUSTOM') targetLabel = `${selectedCustIds.length} KHÁCH HÀNG ĐƯỢC CHỌN`;

    setToast(`🎉 Đã tạo cuộc khảo sát "${created.title}" [${statusBadge}] gửi tới ${targetLabel}!`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header - Chuẩn Image 2 */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-2xl font-extrabold tracking-tight text-white uppercase flex items-center gap-2.5">
            <span>PHẢN HỒI & ĐÁNH GIÁ KHÁCH HÀNG</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Lắng nghe ý kiến khách hàng và quản lý đánh giá sản phẩm, dịch vụ
          </p>
        </div>

        {/* Right side: Current Staff Badge & Manage Surveys Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#1c1d22] text-white text-xs border border-zinc-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-zinc-400 text-xs">Nhân viên đang xử lý:</span>
            <span className="font-bold text-red-400">{getStaffHandlingName()}</span>
          </div>

          <button
            onClick={() => setActiveMainTab(activeMainTab === 'survey' ? 'feedback' : 'survey')}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-red-950/40 cursor-pointer"
          >
            {activeMainTab === 'survey' ? (
              <>
                <span>←</span> QUAY LẠI ĐÁNH GIÁ KHÁCH HÀNG
              </>
            ) : (
              <>
                <span className="text-sm font-black">+</span> QUẢN LÝ & TẠO KHẢO SÁT
              </>
            )}
          </button>
        </div>
      </div>

      {toast && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-sm">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-emerald-400 hover:text-white font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* ── TAB 1: FEEDBACK & REVIEWS (CHUẨN 100% THEO ẢNH 2) ── */}
      {activeMainTab === 'feedback' && (
        <div className="space-y-4">
          {/* Top Filter Bar: 2 Big Tabs (Xe vs Phụ Tùng) + 3 Dropdowns */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* 3 Tabs: Tất cả, Xe, Phụ Tùng */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setProductSectionTab('All')}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
                  productSectionTab === 'All'
                    ? 'bg-[#18181b] text-red-400 border-red-600 shadow-md ring-1 ring-red-500/30'
                    : 'bg-[#141416] text-zinc-400 hover:text-zinc-200 border-zinc-800'
                }`}
              >
                <span>📋</span>
                <span>TẤT CẢ ({feedbacks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setProductSectionTab('Xe')}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
                  productSectionTab === 'Xe'
                    ? 'bg-[#18181b] text-red-400 border-red-600 shadow-md ring-1 ring-red-500/30'
                    : 'bg-[#141416] text-zinc-400 hover:text-zinc-200 border-zinc-800'
                }`}
              >
                <span>🏍️</span>
                <span>ĐÁNH GIÁ XE ({countXe})</span>
              </button>

              <button
                type="button"
                onClick={() => setProductSectionTab('PhuTung')}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
                  productSectionTab === 'PhuTung'
                    ? 'bg-[#18181b] text-red-400 border-red-600 shadow-md ring-1 ring-red-500/30'
                    : 'bg-[#141416] text-zinc-400 hover:text-zinc-200 border-zinc-800'
                }`}
              >
                <span>⚙️</span>
                <span>ĐÁNH GIÁ PHỤ TÙNG ({countPhuTung})</span>
              </button>
            </div>

            {/* 3 Dropdown Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
                className="bg-[#141416] border border-zinc-800 text-zinc-300 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="All">Phân loại: Tất cả</option>
                <option value="DanhGiaMoi">✨ Đánh giá mới ({feedbacks.filter(f => f.trangThai === 'ChoXuLy').length})</option>
                <option value="DanhGia">⭐ Đánh giá</option>
              </select>

              {/* Rating Filter */}
              <select
                value={ratingFilter}
                onChange={e => setRatingFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                className="bg-[#141416] border border-zinc-800 text-zinc-300 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="All">Đánh giá: Tất cả sao</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
                <option value="4">⭐⭐⭐⭐ (4 sao)</option>
                <option value="3">⭐⭐⭐ (3 sao)</option>
                <option value="2">⭐⭐ (2 sao)</option>
                <option value="1">⭐ (1 sao)</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as any)}
                className="bg-[#141416] border border-zinc-800 text-zinc-300 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="All">Danh mục: Tất cả</option>
                <option value="SanPham">Sản phẩm</option>
                <option value="DichVu">Dịch vụ</option>
                <option value="BaoHanh">Bảo hành</option>
              </select>
            </div>
          </div>

          {/* Search Bar & Status Filter Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="🔍 Tìm theo tên khách hàng, nội dung, tên sản phẩm, mã SP (SKU)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#141416] text-zinc-200 placeholder-zinc-500 pl-3.5 pr-8 py-2.5 rounded-xl border border-zinc-800 text-xs focus:outline-none focus:border-red-600 shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-zinc-400 font-semibold hidden sm:inline">Trạng thái:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  statusFilter === 'All'
                    ? 'bg-zinc-200 text-zinc-950 border-zinc-100 shadow'
                    : 'bg-[#141416] text-zinc-400 hover:text-white border-zinc-800'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ChoXuLy')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  statusFilter === 'ChoXuLy'
                    ? 'bg-amber-600 text-white border-amber-500 shadow'
                    : 'bg-[#18181b] text-amber-400 hover:text-amber-300 border-amber-900/40'
                }`}
              >
                Chờ xử lý ({feedbacks.filter(f => f.trangThai === 'ChoXuLy').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('DaXuLy')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  statusFilter === 'DaXuLy'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                    : 'bg-[#18181b] text-emerald-400 hover:text-emerald-300 border-emerald-900/40'
                }`}
              >
                Đã xử lý
              </button>
            </div>
          </div>

          {/* Feedbacks Cards List */}
          <div className="flex flex-col gap-4">
            {filteredFeedbacks.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 bg-[#141416] rounded-2xl border border-zinc-800 text-sm">
                Không tìm thấy phản hồi nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              filteredFeedbacks.map(f => {
                const isNewReview = f.trangThai === 'ChoXuLy';
                const isVehicle = isVehicleFeedback(f);
                const cleanProductTitle = (f.productName || f.xeDangDung || (isVehicle ? 'Xe máy chính hãng Motoshop' : 'Phụ tùng chính hãng Motoshop')).replace(/\s*\([^)]*\)/g, '').trim();
                const catMatch = isVehicle ? catalogVehicleApi.getAllSync().find((c: CatalogVehicle) => {
                  const cN = c.tenXe.toLowerCase().trim();
                  const fN = (f.productName || f.xeDangDung || '').toLowerCase().trim();
                  return fN.includes(cN) || cN.includes(fN);
                }) : null;
                const sku = (catMatch?.id || (f.productId && f.productId !== 'XM-HD01' ? f.productId : null)) || (cleanProductTitle.toLowerCase().includes('tuscany') ? 'XM042' : null) || f.productId || (isVehicle ? 'XM001' : 'PT001');
                const thumbnail = getProductThumbnail(f);
                const isHighlighted = highlightTargetId && (
                  f.id === highlightTargetId ||
                  f.customerId === highlightTargetId ||
                  f.id.toLowerCase().includes(highlightTargetId.toLowerCase()) ||
                  highlightTargetId.toLowerCase().includes(f.id.toLowerCase()) ||
                  (f.productName && f.productName.toLowerCase().includes(highlightTargetId.toLowerCase())) ||
                  (highlightTargetId.toLowerCase().includes(f.hoTen.toLowerCase()))
                );

                return (
                  <div
                    key={f.id}
                    id={`target-feedback-${f.id}`}
                    data-feedback-id={f.id}
                    data-customer-id={f.customerId}
                    className={`rounded-2xl p-5 transition-all duration-300 border ${
                      isHighlighted
                        ? 'ring-4 ring-red-500 bg-red-950/40 border-red-500 shadow-xl shadow-red-500/20'
                        : isNewReview
                        ? 'bg-[#141416] border-amber-500/40 shadow-sm'
                        : 'bg-[#141416] border-zinc-800'
                    }`}
                  >
                    {isHighlighted && (
                      <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold shadow-md animate-bounce">
                        <span>🔔</span> Đánh giá vừa chọn từ thông báo (#{f.id})
                      </div>
                    )}

                    {/* Top Row: Customer Info + Badges + Stars + Chat button */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-zinc-800 text-amber-300 border border-zinc-700 uppercase">
                          {f.hoTen ? f.hoTen[0] : 'K'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-zinc-100">{f.hoTen}</span>
                            {f.customerId && <span className="text-xs text-zinc-500 font-mono">({f.customerId})</span>}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{f.ngayGui}</div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                            {isNewReview ? '✨ Đánh giá mới' : '⭐ Đánh giá'}
                          </span>
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full font-mono border ${
                            f.trangThai === 'ChoXuLy'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {f.trangThai === 'ChoXuLy' ? 'Chờ xử lý' : 'Đã xử lý'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Stars r={f.diemDanhGia} />
                        <button
                          type="button"
                          onClick={() => {
                            const pinned = {
                              title: '📌 ĐANG THẢO LUẬN VỀ ĐÁNH GIÁ CỦA BẠN',
                              productName: f.productName || f.xeDangDung || 'Phụ tùng / Xe máy Motoshop',
                              productImage: thumbnail,
                              orderId: f.orderId ? `Đơn hàng: #${f.orderId}` : `Mã phản hồi: #${f.id}`,
                              rating: f.diemDanhGia || 5,
                              comment: f.noiDung || '',
                            };
                            setChatFeedback(f);
                            chatApi.syncPinnedContext(f.customerId, pinned);
                            chatApi.getMessages(formatCustomerId(f.customerId)).then(setChatMessages);
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-blue-500/50 bg-blue-950/30 hover:bg-blue-900/40 text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <span>💬</span> Chat với Khách hàng
                        </button>
                      </div>
                    </div>

                    {/* Product Box: Thumbnail + Tag + SKU + Title + "Đã mua trên website" */}
                    <div className="mt-3.5 p-3.5 rounded-xl bg-[#1c1d22] border border-zinc-800 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={thumbnail}
                          alt={cleanProductTitle}
                          className="w-14 h-14 rounded-xl object-contain bg-[#141416] border border-zinc-700/80 p-1 shrink-0 shadow-sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              isVehicle ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            }`}>
                              {isVehicle ? '🏍️ XE MÁY' : '📦 PHỤ TÙNG'}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono font-semibold">
                              Mã SKU: {sku}
                            </span>
                          </div>
                          <div className="font-extrabold text-sm text-zinc-100 mt-1 truncate">
                            {cleanProductTitle}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold shrink-0">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Đã mua trên website</span>
                      </div>
                    </div>

                    {/* Customer Review Content Box */}
                    <div className="mt-3 text-xs sm:text-sm text-zinc-200 bg-[#1c1d22] p-3.5 rounded-xl border border-zinc-800 leading-relaxed font-sans">
                      {f.noiDung}
                    </div>

                    {/* Customer Media Attachments (if any) */}
                    {f.hinhAnhDinhKem && f.hinhAnhDinhKem.length > 0 && (
                      <div className="mt-3 p-3 rounded-xl bg-[#1c1d22] border border-zinc-800 space-y-2">
                        <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5 font-mono">
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
                                  className="w-32 h-24 rounded-xl object-cover border border-zinc-700 bg-black shadow-xs"
                                />
                              );
                            }
                            return (
                              <img
                                key={mIdx}
                                src={mediaUrl}
                                alt={`Ảnh đính kèm ${mIdx + 1}`}
                                onClick={() => setPreviewMedia(mediaUrl)}
                                className="w-20 h-20 rounded-xl object-cover border border-zinc-700 hover:opacity-90 hover:scale-105 transition cursor-pointer shadow-xs bg-black"
                                title="Bấm để xem ảnh phóng to"
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Customer Contact Details Bar */}
                    <div className="mt-3 p-3 rounded-xl bg-[#18181b] border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-4 text-zinc-300">
                        {/* Phone */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500">📞 SĐT:</span>
                          <a
                            href={`tel:${f.soDienThoai || '0901234567'}`}
                            className="font-bold text-red-400 hover:underline font-mono"
                          >
                            {f.soDienThoai || '0901234567'}
                          </a>
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500">✉️ Email:</span>
                          <a
                            href={`mailto:${f.email || 'khachhang@motoshop.vn'}`}
                            className="font-semibold text-blue-400 hover:underline"
                          >
                            {f.email || 'khachhang@motoshop.vn'}
                          </a>
                        </div>

                        {/* Address */}
                        {f.diaChi && (
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <span className="text-zinc-500">📍 Địa chỉ:</span>
                            <span>{f.diaChi}</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Contact Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCallFeedback(f);
                            setCallNotes(f.ghiChuXuLy || '');
                            setCallStatus('DaNgheMay');
                          }}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-lg transition border border-zinc-700 flex items-center gap-1 cursor-pointer"
                          title="Mở popup gọi điện"
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
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-blue-400 font-bold rounded-lg transition border border-zinc-700 flex items-center gap-1 cursor-pointer"
                          title="Soạn và gửi email phản hồi"
                        >
                          <span>✉️</span> Gửi mail
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const pinned = {
                              title: '📌 ĐANG THẢO LUẬN VỀ ĐÁNH GIÁ CỦA BẠN',
                              productName: f.productName || f.xeDangDung || 'Phụ tùng / Xe máy Motoshop',
                              productImage: thumbnail,
                              orderId: f.orderId ? `Đơn hàng: #${f.orderId}` : `Mã phản hồi: #${f.id}`,
                              rating: f.diemDanhGia || 5,
                              comment: f.noiDung || '',
                            };
                            setChatFeedback(f);
                            chatApi.syncPinnedContext(f.customerId, pinned);
                            chatApi.getMessages(formatCustomerId(f.customerId)).then(setChatMessages);
                          }}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold rounded-lg transition border border-zinc-700 flex items-center gap-1 cursor-pointer"
                          title="Nhắn tin trực tiếp"
                        >
                          <span>💬</span> Nhắn tin
                        </button>
                      </div>
                    </div>

                    {/* Shop Reply Content (If present) */}
                    {(f.phanHoiCuaShop || f.ghiChuXuLy) && (
                      <div className="mt-3 p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-xs">
                        <div className="flex items-center justify-between text-red-400 font-bold uppercase mb-1">
                          <span className="flex items-center gap-1.5 font-mono tracking-wider">
                            <span>🏢</span> Phản hồi từ Showroom Motoshop:
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono font-normal">
                            {f.ngayPhanHoi || f.ngayXuLy || f.ngayGui} {f.nhanVienXuLy ? `• Bởi ${f.nhanVienXuLy}` : ''}
                          </span>
                        </div>
                        <p className="text-zinc-200 leading-relaxed font-sans">{f.phanHoiCuaShop || f.ghiChuXuLy}</p>
                      </div>
                    )}

                    {/* Shop Reply Input Row (Chuẩn Ảnh 2) */}
                    <div className="mt-3 flex items-center gap-2.5">
                      <input
                        type="text"
                        placeholder="Nhập phản hồi của shop..."
                        value={replyTexts[f.id] || ''}
                        onChange={e => setReplyTexts(prev => ({ ...prev, [f.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleSendShopReply(f.id);
                          }
                        }}
                        className="flex-1 bg-[#18181b] border border-zinc-700 text-zinc-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-red-500 placeholder-zinc-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendShopReply(f.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow flex items-center gap-1 shrink-0"
                      >
                        <span>Gửi phản hồi</span>
                      </button>
                      {f.trangThai === 'ChoXuLy' && (
                        <button
                          type="button"
                          onClick={() => handleResolveDirectly(f.id)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow flex items-center gap-1 shrink-0"
                        >
                          <span>✓ Xác nhận đã xử lý</span>
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

      {/* ── TAB 2: SURVEY CREATOR & MANAGEMENT (KS01 - KS08 & KS03 REDESIGN) ── */}
      {activeMainTab === 'survey' && (() => {
        const dangDienRaCount = surveys.filter(s => computeSurveyStatus(s) === 'DangDienRa').length;
        const sapDienRaCount = surveys.filter(s => computeSurveyStatus(s) === 'SapDienRa').length;
        const daKetThucCount = surveys.filter(s => computeSurveyStatus(s) === 'DaKetThuc').length;
        const nhapCount = surveys.filter(s => computeSurveyStatus(s) === 'Nhap').length;

        const displayedSurveys = surveys.filter(s => {
          if (surveyStatusTab === 'ALL') return true;
          return computeSurveyStatus(s) === surveyStatusTab;
        });

        const filteredCustomersForSurvey = customers.filter(c => {
          if (!custSearchTerm.trim()) return true;
          return (
            matchVietnameseSearch(c.hoTen, custSearchTerm) ||
            matchVietnameseSearch(c.soDienThoai, custSearchTerm) ||
            matchVietnameseSearch(c.id, custSearchTerm) ||
            (c.email ? matchVietnameseSearch(c.email, custSearchTerm) : false)
          );
        });

        const handleSelectAllCustomers = () => {
          const allFilteredIds = filteredCustomersForSurvey.map(c => c.id);
          const union = Array.from(new Set([...selectedCustIds, ...allFilteredIds]));
          setSelectedCustIds(union);
        };

        const handleDeselectAllCustomers = () => {
          setSelectedCustIds([]);
        };

        const handleToggleCustomer = (cId: string) => {
          setSelectedCustIds(prev =>
            prev.includes(cId) ? prev.filter(id => id !== cId) : [...prev, cId]
          );
        };

        const formatShortDate = (dtStr?: string): string => {
          if (!dtStr) return '';
          if (dtStr.includes('/')) return dtStr.split(' ')[0];
          const d = new Date(dtStr);
          if (isNaN(d.getTime())) return dtStr;
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        };

        const getSurveyTypeLabel = (s: Survey): string => {
          if (s.id.includes('BD') || s.title.toLowerCase().includes('bảo dưỡng')) return 'Sau bảo dưỡng định kỳ';
          if (s.id.includes('BH') || s.title.toLowerCase().includes('bảo hành')) return 'Bảo hành dịch vụ';
          return 'Bàn giao xe mới';
        };

        // =========================================================================
        // VIEW 2: TRANG CHI TIẾT KHẢO SÁT TOÀN MÀN HÌNH (ẢNH 2 & ẢNH 3)
        // =========================================================================
        if (selectedSurveyDetail) {
          const s = selectedSurveyDetail;
          const liveSt = computeSurveyStatus(s);
          const statusCfg = surveyStatusLabels[liveSt] || surveyStatusLabels.DangDienRa;
          const detailResponses = surveyResponses.filter(r => r.surveyId === s.id);
          const totalTarget = s.targetCount || (detailResponses.length > 0 ? detailResponses.length : 10);
          const totalRespCount = s.responseCount !== undefined ? Math.max(s.responseCount, detailResponses.length) : detailResponses.length;
          const completionPct = totalTarget > 0 ? Math.min(100, (totalRespCount / totalTarget) * 100) : 0;

          // Response đang được chọn để hiển thị ở cột chi tiết phải
          const activeResponse = selectedResponseItem || detailResponses.find(r => r.id === 'RESP-002') || detailResponses[0] || null;

          return (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Breadcrumb & Nút Quay lại danh sách */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setSelectedSurveyDetail(null)}
                    className="text-zinc-500 hover:text-zinc-900 transition cursor-pointer"
                  >
                    Trang chủ
                  </button>
                  <span className="text-zinc-300">/</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSurveyDetail(null)}
                    className="text-zinc-500 hover:text-zinc-900 transition cursor-pointer"
                  >
                    Quản lý khảo sát
                  </button>
                  <span className="text-zinc-300">/</span>
                  <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    Chi tiết khảo sát
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleDeleteSurvey(s.id, s.title)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>🗑️</span>
                    <span>Xóa khảo sát</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSurveyDetail(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>←</span>
                    <span>Quay lại danh sách</span>
                  </button>
                </div>
              </div>

              {/* Header Card Khảo sát chi tiết */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                    {s.id}
                  </span>
                  <span
                    className="text-xs font-bold font-mono px-3 py-1 rounded-full"
                    style={{
                      background: statusCfg.bg,
                      color: statusCfg.text,
                      border: `1px solid ${statusCfg.border}`,
                    }}
                  >
                    ● {statusCfg.label}
                  </span>
                  <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Loại: {getSurveyTypeLabel(s)}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    THỐNG KÊ KẾT QUẢ KHẢO SÁT: {s.title.toUpperCase()}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1 max-w-4xl leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>

              {/* 3 Top KPI Cards (TỔNG PHẢN HỒI, CÂU HỎI ĐÁNH GIÁ, ĐỐI TƯỢNG KHẢO SÁT) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* KPI 1 */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-zinc-500 uppercase font-mono tracking-wider">
                      TỔNG PHẢN HỒI
                    </div>
                    <div className="text-2xl font-black text-zinc-900 font-display mt-1">
                      {totalRespCount}/{totalTarget} KH
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    <div className="w-full h-2.5 rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-600 transition-all duration-500"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-mono text-zinc-500">
                      <span>Tỷ lệ hoàn thành</span>
                      <strong className="text-red-700 font-bold">{completionPct.toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-blue-600 uppercase font-mono tracking-wider">
                      CÂU HỎI ĐÁNH GIÁ
                    </div>
                    <div className="text-2xl font-black text-blue-700 font-display mt-1">
                      {s.questions.length} CÂU HỎI
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500 space-y-1">
                    <div className="font-medium text-zinc-700">Khảo sát trắc nghiệm 4 lựa chọn</div>
                    <div className="font-mono text-zinc-400">Thời gian làm khảo sát: ~2 phút</div>
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-emerald-600 uppercase font-mono tracking-wider">
                      ĐỐI TƯỢNG KHẢO SÁT
                    </div>
                    <div className="text-2xl font-black text-emerald-700 font-display mt-1">
                      {totalTarget} KHÁCH HÀNG
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500 space-y-1">
                    <div className="font-medium text-zinc-700">Khách hàng hoàn tất dịch vụ bảo dưỡng / nhận xe</div>
                    <div className="font-mono text-zinc-400">Áp dụng cho toàn bộ khách hàng nhận bàn giao</div>
                  </div>
                </div>
              </div>

              {/* Sub-tab Navigation (TẬP TRUNG TỐI ƯU: BIỂU ĐỒ THỐNG KÊ vs DANH SÁCH & PHẢN HỒI) */}
              <div className="bg-white p-2 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDetailSubTab('stats')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      detailSubTab === 'stats'
                        ? 'bg-zinc-950 text-white shadow-sm'
                        : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <span>📊</span>
                    <span>BIỂU ĐỒ THỐNG KÊ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDetailSubTab('responses');
                      if (!selectedResponseItem && detailResponses.length > 0) {
                        setSelectedResponseItem(detailResponses.find(r => r.id === 'RESP-002') || detailResponses[0]);
                      }
                    }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      detailSubTab === 'responses'
                        ? 'bg-zinc-950 text-white shadow-sm'
                        : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <span>👥</span>
                    <span>DANH SÁCH & PHẢN HỒI KHÁCH HÀNG</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-red-100 text-red-700 font-bold ml-1">
                      {detailResponses.length}
                    </span>
                  </button>
                </div>

                <div className="text-xs font-mono text-zinc-500 px-3 py-1">
                  Mã KS: <strong className="text-zinc-800">{s.id}</strong>
                </div>
              </div>

              {/* ── SUB-TAB 1: BIỂU ĐỒ THỐNG KÊ CHI TIẾT (ẢNH 2) ── */}
              {detailSubTab === 'stats' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
                    <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider font-mono flex items-center gap-2">
                      <span>📊</span>
                      <span>BIỂU ĐỒ THỐNG KÊ CHI TIẾT THEO TỪNG CÂU HỎI</span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Phân tích tỷ lệ % và số phiếu bình chọn thực tế từ khách hàng
                    </p>
                  </div>

                  <div className="space-y-4">
                    {s.questions.map((q, qIdx) => {
                      const answeredResponses = detailResponses.filter(r => r.answers && r.answers[q.id]);
                      const totalVotesForQ = answeredResponses.length;

                      return (
                        <div key={q.id} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
                          <div className="flex items-start gap-2.5 pb-2 border-b border-zinc-100">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold font-mono bg-red-50 text-red-700 border border-red-200 shrink-0">
                              Câu {qIdx + 1}
                            </span>
                            <h4 className="text-sm font-bold text-zinc-900 leading-snug">
                              {q.text}
                            </h4>
                          </div>

                          <div className="space-y-3 pt-1">
                            {q.opts.map((opt, optIdx) => {
                              const colorPalette = [
                                { bar: 'bg-emerald-500', text: 'text-emerald-700', bgTag: 'bg-emerald-50', border: 'border-emerald-200', defaultPct: 75, defaultCount: 30 },
                                { bar: 'bg-blue-600', text: 'text-blue-700', bgTag: 'bg-blue-50', border: 'border-blue-200', defaultPct: 15, defaultCount: 6 },
                                { bar: 'bg-amber-500', text: 'text-amber-700', bgTag: 'bg-amber-50', border: 'border-amber-200', defaultPct: 5, defaultCount: 2 },
                                { bar: 'bg-red-500', text: 'text-red-700', bgTag: 'bg-red-50', border: 'border-red-200', defaultPct: 5, defaultCount: 2 },
                              ];
                              const color = colorPalette[optIdx % colorPalette.length];

                              const realVotes = answeredResponses.filter(r => r.answers[q.id] === opt).length;
                              let displayPct = color.defaultPct;
                              let displayCount = color.defaultCount;

                              if (totalVotesForQ > 0) {
                                displayPct = Math.round((realVotes / totalVotesForQ) * 100);
                                displayCount = realVotes;
                              }

                              return (
                                <div key={opt} className="space-y-1.5">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${color.bar}`}></span>
                                      <span className="font-semibold text-zinc-800">{opt}</span>
                                    </div>
                                    <span className="font-mono font-bold text-zinc-700 whitespace-nowrap">
                                      {displayPct}% - {displayCount} phiếu
                                    </span>
                                  </div>

                                  <div className="w-full h-2.5 rounded-full bg-zinc-100 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                                      style={{ width: `${displayPct}%` }}
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
                </div>
              )}

              {/* ── SUB-TAB 2: DANH SÁCH & PHẢN HỒI KHÁCH HÀNG (ẢNH 3) ── */}
              {detailSubTab === 'responses' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-in fade-in duration-200">
                  {/* CỘT TRÁI: BẢNG DANH SÁCH KHÁCH HÀNG (7 CỘT) */}
                  <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider font-mono flex items-center gap-2">
                        <span>👥</span>
                        <span>DANH SÁCH KHÁCH HÀNG ĐÃ ĐÁNH GIÁ ({detailResponses.length})</span>
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Nhấp vào từng khách hàng để xem chi tiết câu trả lời bên phải
                      </p>
                    </div>

                    {detailResponses.length === 0 ? (
                      <div className="text-center py-12 text-zinc-400 font-mono text-xs bg-zinc-50 rounded-xl border border-zinc-200">
                        Chưa có khách hàng nào gửi câu trả lời cho khảo sát này.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-zinc-200">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold uppercase font-mono text-[11px]">
                            <tr>
                              <th className="p-3 text-center w-12">STT</th>
                              <th className="p-3">Khách hàng</th>
                              <th className="p-3">Số điện thoại</th>
                              <th className="p-3">Biển số / Mã xe</th>
                              <th className="p-3">Đánh giá chung</th>
                              <th className="p-3">Ngày gửi</th>
                              <th className="p-3 text-center">Hành động</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 font-sans">
                            {detailResponses.map((r, idx) => {
                              const isSelected = activeResponse?.id === r.id;

                              const ratingStr = r.danhGiaChung || 'Rất hài lòng 😊';
                              let ratingBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                              if (ratingStr.includes('Chưa hài lòng')) {
                                ratingBadgeClass = 'bg-red-50 text-red-700 border-red-200';
                              } else if (ratingStr.includes('Bình thường')) {
                                ratingBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                              }

                              return (
                                <tr
                                  key={r.id}
                                  onClick={() => setSelectedResponseItem(r)}
                                  className={`hover:bg-blue-50/50 transition cursor-pointer ${
                                    isSelected ? 'bg-blue-50/70 font-semibold' : ''
                                  }`}
                                >
                                  <td className="p-3 text-center font-mono text-zinc-500">{idx + 1}</td>
                                  <td className="p-3">
                                    <div className="font-bold text-zinc-900">{r.customerName}</div>
                                    <div className="text-[10px] font-mono text-zinc-400">{r.customerId}</div>
                                  </td>
                                  <td className="p-3 font-mono text-zinc-600">{r.soDienThoai || '0901***890'}</td>
                                  <td className="p-3 font-mono font-bold text-zinc-800">{r.bienSoXe || '29K1-123.45'}</td>
                                  <td className="p-3">
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border font-mono whitespace-nowrap ${ratingBadgeClass}`}>
                                      {ratingStr}
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono text-zinc-500 whitespace-nowrap">{r.submittedDate}</td>
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedResponseItem(r);
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer whitespace-nowrap ${
                                        isSelected
                                          ? 'bg-blue-700 text-white ring-2 ring-blue-400'
                                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                                      }`}
                                    >
                                      {isSelected ? 'Đang xem' : 'Xem câu trả lời'}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* CỘT PHẢI: CHI TIẾT CÂU TRẢ LỜI CỦA KHÁCH HÀNG ĐƯỢC CHỌN */}
                  <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-4 sticky top-6">
                    {activeResponse ? (
                      <div className="space-y-4 animate-in fade-in duration-150">
                        {/* Header chi tiết phản hồi */}
                        <div className="pb-3 border-b border-zinc-200">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono font-bold text-zinc-500">
                              MÃ PHẢN HỒI: {activeResponse.id}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-400">
                              Gửi lúc: {activeResponse.submittedDate}
                            </span>
                          </div>
                          <h4 className="text-base font-black text-zinc-900 uppercase mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                            CHI TIẾT CÂU TRẢ LỜI CỦA: {activeResponse.customerName.toUpperCase()}
                          </h4>
                        </div>

                        {/* Thông tin khách hàng */}
                        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Họ và tên:</span>
                            <strong className="text-zinc-900 font-bold">{activeResponse.customerName}</strong>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Số điện thoại:</span>
                            <strong className="text-blue-700 font-mono font-bold">{activeResponse.soDienThoai || '0987***221'}</strong>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Xe & Biển số:</span>
                            <span className="font-mono font-bold text-zinc-800">
                              {activeResponse.tenXe || 'Honda SH 160i ABS 2024'} ({activeResponse.bienSoXe || '59F2-678.90'})
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                            <span className="text-zinc-500">Đánh giá chung:</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono ${
                              activeResponse.danhGiaChung?.includes('Chưa hài lòng')
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : activeResponse.danhGiaChung?.includes('Bình thường')
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {activeResponse.danhGiaChung || 'Rất hài lòng 😊'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Trạng thái xử lý:</span>
                            {activeResponse.daXuLy ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                                ● Đã xử lý
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 font-mono">
                                ● Cần xử lý khiếu nại
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Danh sách câu hỏi và câu trả lời của khách */}
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-zinc-700 uppercase font-mono tracking-wider">
                            CÁC CÂU HỎI ĐÃ ĐÁNH GIÁ:
                          </div>

                          {s.questions.map((q, qIdx) => {
                            const ansText = activeResponse.answers ? activeResponse.answers[q.id] : '';
                            return (
                              <div key={q.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs">
                                <div className="font-bold text-zinc-800">
                                  <span className="text-red-700 font-mono mr-1">Câu {qIdx + 1}:</span>
                                  <span>{q.text}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-900 font-medium">
                                  <span className="text-zinc-500 text-[11px] mr-1">Đáp án:</span>
                                  <strong className="text-zinc-900">{ansText || 'Đã chọn lựa chọn tiêu chuẩn'}</strong>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Hộp Khiếu nại / Ghi chú từ khách hàng (nếu có - Chuẩn Ảnh 3) */}
                        {activeResponse.ghiChu && (
                          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-1">
                            <div className="text-xs font-bold text-red-800 flex items-center gap-1.5 font-mono">
                              <span>⚠️</span>
                              <span>Ý kiến đóng góp & Khiếu nại từ khách hàng:</span>
                            </div>
                            <div className="text-xs text-red-700 italic leading-relaxed bg-white/60 p-2.5 rounded-lg border border-red-100">
                              "{activeResponse.ghiChu}"
                            </div>
                          </div>
                        )}

                        {/* Các nút hành động xử lý (Nút Đỏ Gọi điện + Nút Đánh dấu đã xử lý) */}
                        <div className="pt-2 space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSurveyCallCareModal(activeResponse);
                              setSurveyCallNotes(activeResponse.ghiChu ? `Xử lý khiếu nại: "${activeResponse.ghiChu}"` : '');
                            }}
                            className="w-full py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow-md shadow-red-700/20 transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>📞</span>
                            <span>Gọi điện chăm sóc / Xử lý khiếu nại</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMarkSurveyResponseHandled(activeResponse.id)}
                            className={`w-full py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                              activeResponse.daXuLy
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
                            }`}
                          >
                            <span>✓</span>
                            <span>{activeResponse.daXuLy ? 'Đã hoàn tất xử lý khiếu nại' : 'Đánh dấu đã xử lý'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-zinc-400 font-mono text-xs">
                        Vui lòng chọn một khách hàng từ danh sách bên trái để xem chi tiết.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }

        // =========================================================================
        // VIEW 1: TRANG TỔNG QUẢN LÝ PHẢN HỒI & KHẢO SÁT (CHUẨN ẢNH 1)
        // =========================================================================
        return (
          <div className="space-y-6">
            {/* Header Tổng theo Ảnh 1 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm gap-4">
              <div>
                <h3 className="font-black text-zinc-900 text-xl uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  PHẢN HỒI & KHẢO SÁT
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Hệ thống ghi nhận đánh giá trải nghiệm khách hàng, khiếu nại dịch vụ và quản lý khảo sát chất lượng định kỳ.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-800 shadow-md shadow-red-700/20 transition flex items-center gap-2 cursor-pointer self-start md:self-auto shrink-0 uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span>+ TẠO KHẢO SÁT MỚI</span>
              </button>
            </div>

            {/* KS08: Filter Pills Trạng thái khảo sát tự động */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
              {[
                { id: 'ALL', label: `Tất cả (${surveys.length})` },
                { id: 'DangDienRa', label: `🟢 Đang diễn ra (${dangDienRaCount})` },
                { id: 'SapDienRa', label: `🟡 Sắp diễn ra (${sapDienRaCount})` },
                { id: 'DaKetThuc', label: `⚪ Đã kết thúc (${daKetThucCount})` },
                { id: 'Nhap', label: `🔵 Bản nháp (${nhapCount})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSurveyStatusTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer text-xs ${
                    surveyStatusTab === tab.id
                      ? 'bg-zinc-950 text-white shadow-sm'
                      : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Danh sách 12 Card Khảo sát 2 Cột (Chuẩn Ảnh 1) */}
            {displayedSurveys.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 text-zinc-400 text-xs font-mono">
                Không tìm thấy bài khảo sát nào trong danh mục này.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedSurveys.map(s => {
                  const responses = surveyResponses.filter(r => r.surveyId === s.id);
                  const liveStatus = computeSurveyStatus(s);
                  const statusCfg = surveyStatusLabels[liveStatus] || surveyStatusLabels.DangDienRa;
                  const targetCount = s.targetCount || 10;
                  const respCount = s.responseCount !== undefined ? Math.max(s.responseCount, responses.length) : responses.length;
                  const progressPct = targetCount > 0 ? Math.min(100, Math.round((respCount / targetCount) * 100)) : 0;

                  return (
                    <div
                      key={s.id}
                      className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                    >
                      <div>
                        {/* Header card with Live Status Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-bold border border-zinc-200">
                            {s.id}
                          </span>
                          <span
                            className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full"
                            style={{
                              background: statusCfg.bg,
                              color: statusCfg.text,
                              border: `1px solid ${statusCfg.border}`,
                            }}
                          >
                            ● {statusCfg.label}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-zinc-900 text-base mb-1 line-clamp-1" style={{ fontFamily: 'var(--font-display)' }}>
                          {s.title}
                        </h4>
                        <p className="text-xs text-zinc-500 mb-3 line-clamp-2 leading-relaxed">{s.description}</p>

                        {/* Thanh tiến độ phản hồi: X/Y khách hàng (Z%) */}
                        <div className="space-y-1 mb-3.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-zinc-700">
                              Tiến độ phản hồi: {respCount}/{targetCount} khách hàng ({progressPct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-red-600 transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Khung 4 ô Metadata (📅 Lịch, 📝 Câu hỏi, 👥 Đối tượng, 📅 Lịch tạo) */}
                        <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 grid grid-cols-2 gap-2 text-xs font-mono mb-4">
                          <div>
                            <span className="text-zinc-500">📅 Lịch:</span>{' '}
                            <strong className="text-zinc-800">
                              {formatShortDate(s.startDate)} - {formatShortDate(s.endDate)}
                            </strong>
                          </div>
                          <div>
                            <span className="text-zinc-500">📝 Câu hỏi:</span>{' '}
                            <strong className="text-zinc-800">{s.questions.length} câu hỏi</strong>
                          </div>
                          <div>
                            <span className="text-zinc-500">👥 Đối tượng:</span>{' '}
                            <strong className="text-zinc-800">{targetCount} khách hàng</strong>
                          </div>
                          <div>
                            <span className="text-zinc-500">📅 Lịch tạo:</span>{' '}
                            <strong className="text-zinc-800">{s.createdDate}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Tag xanh 👥 X phản hồi + 2 nút thao tác */}
                      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold font-mono text-xs border border-blue-200 flex items-center gap-1.5">
                          <span>👥</span>
                          <span>{respCount} phản hồi</span>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectSurveyDetail(s)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Xem chi tiết & kết quả</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSurvey(s)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>✏️</span>
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSurvey(s.id, s.title)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center gap-1 cursor-pointer"
                            title="Xóa bài khảo sát này"
                          >
                            <span>🗑️</span>
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Modal Create Survey (KS05, KS06, KS07, KS08) */}
            {showCreateModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-zinc-200 max-h-[92vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-200">
                    <div>
                      <h3 className="font-extrabold text-base text-zinc-900 uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                        TẠO KHẢO SÁT & CÀI ĐẶT LỊCH PHÁT HÀNH
                      </h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Thiết lập thời gian khảo sát, đối tượng nhận và các câu hỏi thăm dò ý kiến
                      </p>
                    </div>
                    <button type="button" onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-600 font-bold text-xl px-2">✕</button>
                  </div>

                  <form onSubmit={handleCreateSurvey} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase">Tiêu đề khảo sát *</label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Khảo sát chất lượng dịch vụ bảo dưỡng định kỳ 2026"
                        value={newSurveyTitle}
                        onChange={e => setNewSurveyTitle(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase">Mô tả cuộc khảo sát</label>
                      <textarea
                        rows={2}
                        placeholder="Mô tả mục đích khảo sát và ý nghĩa đóng góp của khách hàng..."
                        value={newSurveyDesc}
                        onChange={e => setNewSurveyDesc(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>

                    {/* KS06 & KS07: Cài đặt thời gian đăng và thời gian khảo sát */}
                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-red-700 font-bold">📅</span>
                        <span className="text-xs font-bold text-zinc-800 uppercase">Cài đặt thời gian & Lịch đăng (KS06 & KS07)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                            🚀 Ngày giờ đăng (Publish) *
                          </label>
                          <input
                            type="datetime-local"
                            required
                            value={surveyPublishDate}
                            onChange={e => setSurveyPublishDate(e.target.value)}
                            className="w-full p-2 rounded-lg border border-zinc-300 text-xs bg-white font-mono"
                          />
                          <p className="text-[10px] text-zinc-400 mt-1">Trước giờ đăng sẽ ở trạng thái Nháp</p>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                            🟢 Bắt đầu khảo sát (Start) *
                          </label>
                          <input
                            type="datetime-local"
                            required
                            value={surveyStartDate}
                            onChange={e => setSurveyStartDate(e.target.value)}
                            className="w-full p-2 rounded-lg border border-zinc-300 text-xs bg-white font-mono"
                          />
                          <p className="text-[10px] text-zinc-400 mt-1">Thời điểm mở nhận câu trả lời</p>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                            🔴 Kết thúc khảo sát (End) *
                          </label>
                          <input
                            type="datetime-local"
                            required
                            value={surveyEndDate}
                            onChange={e => setSurveyEndDate(e.target.value)}
                            className="w-full p-2 rounded-lg border border-zinc-300 text-xs bg-white font-mono"
                          />
                          <p className="text-[10px] text-zinc-400 mt-1">Quá mốc này chuyển Đã kết thúc</p>
                        </div>
                      </div>
                    </div>

                    {/* KS05: Phân loại đối tượng nhận khảo sát */}
                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-red-700 font-bold">👥</span>
                        <span className="text-xs font-bold text-zinc-800 uppercase">Đối tượng nhận khảo sát (KS05)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setTargetMode('ALL')}
                          className={`p-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                            targetMode === 'ALL'
                              ? 'bg-red-700 text-white border-red-700'
                              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          🌐 Tất cả khách hàng
                        </button>
                        <button
                          type="button"
                          onClick={() => setTargetMode('TIER')}
                          className={`p-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                            targetMode === 'TIER'
                              ? 'bg-red-700 text-white border-red-700'
                              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          👑 Theo Hạng hội viên
                        </button>
                        <button
                          type="button"
                          onClick={() => setTargetMode('CUSTOM')}
                          className={`p-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                            targetMode === 'CUSTOM'
                              ? 'bg-red-700 text-white border-red-700'
                              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          👥 Chọn nhiều KH cụ thể
                        </button>
                      </div>

                      {targetMode === 'TIER' && (
                        <div className="space-y-1.5 pt-2">
                          <label className="block text-[11px] font-semibold text-zinc-600">Chọn Hạng thành viên mục tiêu:</label>
                          <select
                            value={selectedTier}
                            onChange={e => setSelectedTier(e.target.value as any)}
                            className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white font-semibold focus:outline-none focus:border-red-600"
                          >
                            <option value="ALL">🌐 Tất cả các hạng thành viên ({customers.length} khách)</option>
                            <option value="VIP">👑 Khách VIP (Chi tiêu ≥ 10 triệu)</option>
                            <option value="ThanThiet">⭐ Khách Thân thiết (Chi tiêu 4tr - 10tr)</option>
                            <option value="PhoThong">🌱 Khách Phổ thông (Chi tiêu &lt; 4 triệu)</option>
                            <option value="New">🆕 Khách hàng mới (0₫)</option>
                          </select>
                        </div>
                      )}

                      {targetMode === 'CUSTOM' && (
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Tìm kiếm khách hàng theo tên, SĐT, mã KH..."
                              value={custSearchTerm}
                              onChange={e => setCustSearchTerm(e.target.value)}
                              className="flex-1 p-2 rounded-lg border border-zinc-300 text-xs bg-white"
                            />
                            <button
                              type="button"
                              onClick={handleSelectAllCustomers}
                              className="px-2.5 py-2 rounded-lg bg-zinc-200 text-zinc-800 text-xs font-bold hover:bg-zinc-300 cursor-pointer"
                            >
                              Chọn tất cả ({filteredCustomersForSurvey.length})
                            </button>
                            <button
                              type="button"
                              onClick={handleDeselectAllCustomers}
                              className="px-2.5 py-2 rounded-lg bg-zinc-100 text-zinc-600 text-xs font-bold hover:bg-zinc-200 cursor-pointer"
                            >
                              Bỏ chọn
                            </button>
                          </div>

                          <div className="max-h-48 overflow-y-auto border border-zinc-200 rounded-xl divide-y divide-zinc-100 bg-white">
                            {filteredCustomersForSurvey.map(c => {
                              const isChecked = selectedCustIds.includes(c.id);
                              const tier = getCustomerTier(c.tongChiTieu || 0);

                              return (
                                <label
                                  key={c.id}
                                  onClick={() => handleToggleCustomer(c.id)}
                                  className="p-2.5 flex items-center justify-between hover:bg-zinc-50 cursor-pointer text-xs"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="rounded accent-red-700 w-4 h-4 cursor-pointer"
                                    />
                                    <span className="font-mono text-zinc-500 font-bold">{c.id}</span>
                                    <span className="text-zinc-900">{c.hoTen}</span>
                                    <span className="text-zinc-400 font-mono text-[11px]">{c.soDienThoai}</span>
                                  </div>
                                  <span
                                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                                    style={{ background: tier.badgeBg, color: tier.badgeColor, border: `1px solid ${tier.badgeBorder}` }}
                                  >
                                    {tier.shortLabel}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Questions Section */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-zinc-900 uppercase">Danh sách câu hỏi ({questions.length})</label>
                        <button
                          type="button"
                          onClick={handleAddQuestion}
                          className="text-xs font-bold text-red-700 hover:underline cursor-pointer"
                        >
                          + Thêm câu hỏi
                        </button>
                      </div>

                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {questions.map((q, qIdx) => {
                          const dupIdx = questions.findIndex((otherQ, otherIdx) => 
                            otherIdx !== qIdx && 
                            otherQ.text.trim().length > 0 && 
                            q.text.trim().length > 0 && 
                            otherQ.text.trim().toLowerCase() === q.text.trim().toLowerCase()
                          );
                          const isDup = dupIdx !== -1;

                          return (
                          <div key={q.id || qIdx} className={`p-3 bg-zinc-50 rounded-xl border space-y-2 ${isDup ? 'border-red-400 bg-red-50/20' : 'border-zinc-200'}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-red-700">Câu {qIdx + 1}.</span>
                              <input
                                type="text"
                                required
                                placeholder="Nhập nội dung câu hỏi..."
                                value={q.text}
                                onChange={e => handleQuestionTextChange(qIdx, e.target.value)}
                                className={`flex-1 p-2 rounded-lg border text-xs bg-white ${
                                  isDup ? 'border-red-500 bg-red-50/40 text-red-900 focus:outline-red-500' : 'border-zinc-300'
                                }`}
                              />
                              {questions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveQuestion(qIdx)}
                                  className="text-zinc-400 hover:text-red-600 text-xs font-bold px-1 cursor-pointer"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            {isDup && (
                              <div className="pl-6 text-[11px] font-bold text-red-600 flex items-center gap-1">
                                <span>⚠️</span>
                                <span>Nội dung bị trùng lặp với Câu ${dupIdx + 1}! Không thể tạo câu hỏi trùng lặp trong cùng một bộ khảo sát.</span>
                              </div>
                            )}

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
                        );})}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow cursor-pointer"
                      >
                        🚀 PHÁT HÀNH / LƯU KHẢO SÁT
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal Chỉnh sửa Khảo sát */}
            {editingSurvey && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
                    <div>
                      <h3 className="font-extrabold text-base text-zinc-900 uppercase font-mono">
                        CHỈNH SỬA KHẢO SÁT ({(editingSurvey as any).id})
                      </h3>
                      <p className="text-xs text-zinc-500">Cập nhật thông tin tiêu đề và thời hạn khảo sát</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingSurvey(null)}
                      className="text-zinc-400 hover:text-zinc-700 font-bold text-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Tiêu đề</label>
                      <input
                        type="text"
                        value={editingSurvey.title}
                        onChange={e => setEditingSurvey({ ...editingSurvey, title: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Mô tả</label>
                      <textarea
                        rows={2}
                        value={editingSurvey.description}
                        onChange={e => setEditingSurvey({ ...editingSurvey, description: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">Thời gian bắt đầu</label>
                        <input
                          type="datetime-local"
                          value={editingSurvey.startDate || ''}
                          onChange={e => setEditingSurvey({ ...editingSurvey, startDate: e.target.value })}
                          className="w-full p-2 rounded-xl border border-zinc-300 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">Thời gian kết thúc</label>
                        <input
                          type="datetime-local"
                          value={editingSurvey.endDate || ''}
                          onChange={e => setEditingSurvey({ ...editingSurvey, endDate: e.target.value })}
                          className="w-full p-2 rounded-xl border border-zinc-300 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                    <button
                      type="button"
                      onClick={() => setEditingSurvey(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!editingSurvey) return;
                        const es: Survey = editingSurvey;
                        const updated = surveyApi.update(es.id, es);
                        const finalSurvey = updated || es;
                        setSurveys(prev => prev.map(s => s.id === es.id ? finalSurvey : s));
                        if ((selectedSurveyDetail as Survey | null)?.id === es.id) {
                          setSelectedSurveyDetail(finalSurvey);
                        }
                        setToast('Đã cập nhật thông tin khảo sát thành công!');
                        setEditingSurvey(null);
                      }}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Gọi điện chăm sóc / Xử lý khiếu nại khảo sát (ẢNH 3 ACTION) */}
            {surveyCallCareModal && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-red-100 text-red-700 rounded-xl text-lg">📞</span>
                      <div>
                        <h3 className="font-extrabold text-sm text-zinc-900 uppercase font-mono tracking-wider">
                          GỌI ĐIỆN CHĂM SÓC & XỬ LÝ KHIẾU NẠI KHẢO SÁT
                        </h3>
                        <div className="text-[11px] text-zinc-500">Liên hệ trực tiếp để xử lý khiếu nại từ khách hàng</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSurveyCallCareModal(null)}
                      className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 flex items-center justify-center font-bold text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Thông tin khách hàng cần gọi */}
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-zinc-900">{surveyCallCareModal.customerName}</span>
                      <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-200">
                        {surveyCallCareModal.soDienThoai || '0987***221'}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-600">
                      <span>Xe máy: </span>
                      <strong className="text-zinc-800">{surveyCallCareModal.tenXe || 'Honda SH 160i ABS 2024'} ({surveyCallCareModal.bienSoXe || '59F2-678.90'})</strong>
                    </div>
                    {surveyCallCareModal.ghiChu && (
                      <div className="text-xs text-red-700 italic bg-red-50 p-2.5 rounded-xl border border-red-200">
                        "{surveyCallCareModal.ghiChu}"
                      </div>
                    )}
                  </div>

                  {/* Nút bấm quay số trực tiếp */}
                  <div className="flex items-center gap-3">
                    <a
                      href={`tel:${surveyCallCareModal.soDienThoai || '0987654321'}`}
                      className="flex-1 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-2xl text-xs text-center transition shadow-md shadow-red-700/20 flex items-center justify-center gap-2"
                    >
                      <span>📲</span> Nhấn để quay số ({surveyCallCareModal.soDienThoai || '0987***221'})
                    </a>
                  </div>

                  {/* Trạng thái cuộc gọi */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700">Trạng thái cuộc gọi:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'DaNgheMay', label: '✓ Đã nghe máy' },
                        { key: 'HenGoiLai', label: '🕒 Hẹn gọi lại' },
                        { key: 'KhongNgheMay', label: '✕ Không bắt máy' },
                      ].map(item => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setSurveyCallStatus(item.key as any)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                            surveyCallStatus === item.key
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                              : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ghi chú nội dung trao đổi */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700">Ghi chú phương án xử lý:</label>
                    <textarea
                      rows={3}
                      placeholder="VD: Đã trao đổi và hẹn khách hàng mang xe tới showroom để sơn dặm dè trước và siết lại ốc gương miễn phí..."
                      value={surveyCallNotes}
                      onChange={e => setSurveyCallNotes(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-zinc-300 text-xs focus:outline-none focus:border-red-600 leading-relaxed"
                    />
                  </div>

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setSurveyCallCareModal(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSurveyCallCare}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-black text-white transition shadow-sm cursor-pointer"
                    >
                      Lưu nhật ký & Đánh dấu đã xử lý
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col h-[600px] animate-in fade-in zoom-in-95 duration-150">
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

            {/* Quick customer switcher in chat modal */}
            <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center gap-2 text-xs overflow-x-auto scrollbar-none shrink-0">
              <span className="text-zinc-400 font-medium shrink-0">Đổi hội thoại:</span>
              {[
                { id: 'KH032', name: 'Nguyễn Thị Mầu' },
                { id: 'KH030', name: 'Lê Thị Test' },
                { id: 'KH1004', name: 'Lan Phương' },
                { id: 'KH001', name: 'Nguyễn Văn An' },
              ].map(c => {
                const isActive = formatCustomerId(chatFeedback.customerId) === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      const found = feedbacks.find(fb => formatCustomerId(fb.customerId) === c.id);
                      if (found) {
                        setChatFeedback(found);
                      } else {
                        setChatFeedback({
                          id: `PH-SWITCH-${c.id}`,
                          customerId: c.id,
                          hoTen: c.name,
                          soDienThoai: '0911223456',
                          email: 'khachhang@motoshop.vn',
                          xeDangDung: 'Xe máy / Dịch vụ Motoshop',
                          noiDung: 'Trao đổi CSKH trực tuyến',
                          diemDanhGia: 5,
                          ngayGui: new Date().toISOString().split('T')[0],
                          loaiDanhGia: 'DichVu',
                          trangThai: 'ChoXuLy',
                          loaiNhan: 'DanhGia',
                        });
                      }
                      chatApi.getMessages(c.id).then(setChatMessages);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition cursor-pointer ${
                      isActive
                        ? 'bg-red-700 text-white font-bold shadow-xs'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {c.name} ({c.id})
                  </button>
                );
              })}
            </div>

            {/* Rich Product Context Card with Image & Full Details */}
            <div className="p-3 bg-amber-50/80 border-b border-amber-200 shrink-0 text-xs shadow-2xs">
              <div className="flex items-start gap-3">
                <img
                  src={
                    chatFeedback.productImage ||
                    (chatFeedback.hinhAnhDinhKem && chatFeedback.hinhAnhDinhKem[0]) ||
                    (chatFeedback.productName?.toLowerCase().includes('motul') ? '/images/phutung/motul_7100.png' : '/images/phutung/motul_7100.png')
                  }
                  alt={chatFeedback.productName || 'Sản phẩm'}
                  className="w-14 h-14 rounded-xl bg-white p-1 object-contain shrink-0 border border-amber-300 shadow-2xs"
                  onError={(e: any) => { e.target.src = '/images/phutung/motul_7100.png'; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-amber-950 truncate">
                      📌 {chatFeedback.productName || chatFeedback.xeDangDung || 'Phụ tùng / Xe máy Showroom'}
                    </span>
                    <span className="text-amber-500 font-bold text-xs shrink-0">
                      {'★'.repeat(chatFeedback.diemDanhGia || 5)}
                      <span className="text-zinc-300">{'★'.repeat(Math.max(0, 5 - (chatFeedback.diemDanhGia || 5)))}</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5 flex items-center gap-2">
                    <span>Mã: #{chatFeedback.productId || chatFeedback.orderId || chatFeedback.id}</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-semibold">{chatFeedback.loaiDanhGia === 'DichVu' ? 'Dịch vụ bảo dưỡng' : 'Sản phẩm chính hãng'}</span>
                  </div>
                  {chatFeedback.noiDung && (
                    <div className="mt-1 text-[11px] text-zinc-700 italic bg-white/90 p-1.5 rounded-lg border border-amber-200 leading-snug line-clamp-2">
                      💬 "{chatFeedback.noiDung}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-50">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  Chưa có tin nhắn nào. Hãy gửi lời chào để bắt đầu hỗ trợ khách hàng!
                </div>
              ) : (
                chatMessages
                  .filter(m => formatCustomerId(m.customerId) === formatCustomerId(chatFeedback.customerId) || m.customerId === 'ALL')
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
