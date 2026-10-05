import { useState, useMemo, useEffect } from 'react';
import { mockParts, formatVND, Part, mockProductReviews, ProductReview, Customer, mockOrders, countWords } from '../../data/mockData';
import { useCart } from '../../contexts/CartContext';
import { matchVietnameseSearch } from '../../utils/vietnameseSearch';
import { feedbackApi } from '../../services/api';

const categories = ['Tất cả', 'Nhớt', 'Lọc', 'Phanh', 'Bugi', 'Đèn', 'Lốp xe', 'Phụ kiện', 'Trang trí', 'Truyền động', 'Thân máy'];

const categoryIcons: Record<string, string> = {
  'Tất cả': '🏍️',
  'Nhớt': '🛢️',
  'Lọc': '🔘',
  'Phanh': '🛑',
  'Bugi': '⚡',
  'Đèn': '💡',
  'Lốp xe': '⭕',
  'Phụ kiện': '🧰',
  'Trang trí': '✨',
  'Truyền động': '⚙️',
  'Thân máy': '🔩',
};

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5 text-amber-500 text-xs">
        {[1, 2, 3, 4, 5].map(s => (
          <span key={s}>{s <= Math.round(rating) ? '★' : '☆'}</span>
        ))}
      </div>
      <span className="text-[11px] text-zinc-500 font-mono">({count})</span>
    </div>
  );
}

interface Props {
  currentCustomer?: Customer | null;
  onRequireLogin?: () => void;
}

export default function PartsStore({ currentCustomer, onRequireLogin }: Props = {}) {
  const { add, updateQty, items } = useCart();

  // Navigation & Page View State: null = Store Home, Part = Dedicated Product Detail Page (TC04)
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  // Search & Filter State (TC05)
  const [cat, setCat] = useState('Tất cả');
  const [selectedBrand, setSelectedBrand] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'default' | 'priceAsc' | 'priceDesc' | 'rating'>('default');
  const [priceRange, setPriceRange] = useState<'ALL' | 'under200k' | '200kTo500k' | '500kTo1m' | 'above1m'>('ALL');

  // Interactive & Feedback State
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [detailQty, setDetailQty] = useState(1);
  const [detailTab, setDetailTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  // Flash Sale Countdown Timer (TC06)
  const [countdown, setCountdown] = useState({ hours: 5, minutes: 24, seconds: 38 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 5, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Review states (ĐG04, ĐG05, ĐG09, ĐG16)
  const [allReviews, setAllReviews] = useState<ProductReview[]>([...mockProductReviews]);
  const [newReviewAuthor, setNewReviewAuthor] = useState(currentCustomer?.hoTen || '');
  const [newReviewPhone, setNewReviewPhone] = useState(currentCustomer?.soDienThoai || '');
  const [newReviewStars, setNewReviewStars] = useState(5);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [reviewMediaFiles, setReviewMediaFiles] = useState<string[]>([]);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewToast, setReviewToast] = useState<string | null>(null);

  // Sync reviews from feedbackApi (ĐG04, ĐG09)
  useEffect(() => {
    const syncReviews = async () => {
      try {
        const feedbacks = await feedbackApi.getAll();
        const partFeedbacks: ProductReview[] = feedbacks
          .filter(f => f.productType === 'PhuTung' || f.productId?.startsWith('PT'))
          .map(f => ({
            id: f.id,
            targetId: f.productId || '',
            customerId: f.customerId,
            tenKhachHang: f.hoTen,
            soDienThoai: f.soDienThoai,
            soSao: f.diemDanhGia,
            ngayDanhGia: f.ngayGui,
            noiDung: f.noiDung,
            daMua: true,
            editCount: f.editCount || 0,
            productName: f.productName,
            hinhAnhDinhKem: f.hinhAnhDinhKem || [],
          }));

        setAllReviews(prev => {
          const merged = [...prev];
          partFeedbacks.forEach(pf => {
            const idx = merged.findIndex(m => m.id === pf.id);
            if (idx !== -1) {
              merged[idx] = { ...merged[idx], ...pf };
            } else if (pf.targetId) {
              merged.unshift(pf);
            }
          });
          return merged;
        });
      } catch (err) {
        console.warn('Sync part reviews error:', err);
      }
    };

    syncReviews();
    window.addEventListener('crm-data-refresh', syncReviews);
    return () => window.removeEventListener('crm-data-refresh', syncReviews);
  }, []);

  useEffect(() => {
    if (currentCustomer) {
      setNewReviewAuthor(currentCustomer.hoTen);
      setNewReviewPhone(currentCustomer.soDienThoai);
    } else {
      setNewReviewAuthor('');
      setNewReviewPhone('');
    }
  }, [currentCustomer]);

  // Check if currentCustomer has purchased selectedPart (ĐG03)
  const hasPurchased = useMemo(() => {
    if (!currentCustomer || !selectedPart) return false;
    return mockOrders.some(order => {
      const isMyOrder =
        order.customerId === currentCustomer.id ||
        order.hoTenKH.toLowerCase().trim() === currentCustomer.hoTen.toLowerCase().trim();
      if (!isMyOrder) return false;
      return order.items.some(it =>
        it.tenSanPham.toLowerCase().includes(selectedPart.tenSanPham.toLowerCase()) ||
        selectedPart.tenSanPham.toLowerCase().includes(it.tenSanPham.toLowerCase())
      );
    });
  }, [currentCustomer, selectedPart]);

  // Extract all unique brands dynamically
  const brands = useMemo(() => {
    const list = Array.from(new Set(mockParts.map(p => p.thuongHieu))).sort();
    return ['Tất cả', ...list];
  }, []);

  // Filtered store catalog
  const filtered = useMemo(() => {
    let list = mockParts.filter(p => {
      const q = search.toLowerCase().trim();
      const matchCat = cat === 'Tất cả' || p.danhMuc === cat;
      const matchBrand = selectedBrand === 'Tất cả' || p.thuongHieu === selectedBrand;
      const matchSearch =
        !search.trim() ||
        matchVietnameseSearch(p.tenSanPham, search) ||
        matchVietnameseSearch(p.thuongHieu, search) ||
        (p.dongXePhuHop ? matchVietnameseSearch(p.dongXePhuHop, search) : false) ||
        matchVietnameseSearch(p.danhMuc, search);

      const effectivePrice = p.giaKhuyenMai ?? p.giaGoc;
      let matchPrice = true;
      if (priceRange === 'under200k') matchPrice = effectivePrice < 200000;
      else if (priceRange === '200kTo500k') matchPrice = effectivePrice >= 200000 && effectivePrice <= 500000;
      else if (priceRange === '500kTo1m') matchPrice = effectivePrice > 500000 && effectivePrice <= 1000000;
      else if (priceRange === 'above1m') matchPrice = effectivePrice > 1000000;

      return matchCat && matchBrand && matchSearch && matchPrice;
    });

    if (sort === 'priceAsc') list = [...list].sort((a, b) => (a.giaKhuyenMai ?? a.giaGoc) - (b.giaKhuyenMai ?? b.giaGoc));
    if (sort === 'priceDesc') list = [...list].sort((a, b) => (b.giaKhuyenMai ?? b.giaGoc) - (a.giaKhuyenMai ?? a.giaGoc));
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);

    return list;
  }, [cat, selectedBrand, search, sort, priceRange]);

  // TC12: Phân trang 10 sản phẩm/trang
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [cat, selectedBrand, search, sort, priceRange]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedParts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Flash Sale Items (TC06): Items with promotion discount
  const flashSaleItems = useMemo(() => {
    return mockParts.filter(p => p.giaKhuyenMai !== null).slice(0, 4);
  }, []);

  // Best Seller Items (TC06): Top rated with highest ratings & reviews
  const bestSellers = useMemo(() => {
    return [...mockParts]
      .sort((a, b) => (b.rating * (b.luotDanh || 10)) - (a.rating * (a.luotDanh || 10)))
      .slice(0, 4);
  }, []);

  // Related parts when viewing details
  const relatedParts = useMemo(() => {
    if (!selectedPart) return [];
    return mockParts
      .filter(p => p.id !== selectedPart.id && (p.danhMuc === selectedPart.danhMuc || p.thuongHieu === selectedPart.thuongHieu))
      .slice(0, 4);
  }, [selectedPart]);

  // Handle Add to cart with TC03 auth check
  function handleAdd(p: Part, qty = 1, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (!currentCustomer) {
      if (onRequireLogin) onRequireLogin();
      else window.dispatchEvent(new CustomEvent('crm-open-login'));
      return;
    }
    const existing = items.find(i => i.part.id === p.id);
    if (existing) {
      updateQty(p.id, existing.soLuong + qty);
    } else {
      add(p);
      if (qty > 1) updateQty(p.id, qty);
    }
    setAdded(prev => new Set(prev).add(p.id));
    setTimeout(() => setAdded(prev => { const n = new Set(prev); n.delete(p.id); return n; }), 1400);
  }

  // Handle Buy Now (TC03)
  function handleBuyNow(p: Part, qty = 1) {
    if (!currentCustomer) {
      if (onRequireLogin) onRequireLogin();
      else window.dispatchEvent(new CustomEvent('crm-open-login'));
      return;
    }
    handleAdd(p, qty);
    window.location.hash = '#cart';
  }

  // Check if currentCustomer has already reviewed selectedPart (ĐG05)
  const existingReview = useMemo(() => {
    if (!currentCustomer || !selectedPart) return null;
    return allReviews.find(r =>
      r.targetId === selectedPart.id &&
      (
        r.customerId === currentCustomer.id ||
        (r.soDienThoai && currentCustomer.soDienThoai && r.soDienThoai.replace(/\D/g, '') === currentCustomer.soDienThoai.replace(/\D/g, '')) ||
        r.tenKhachHang.toLowerCase().trim() === currentCustomer.hoTen.toLowerCase().trim()
      )
    ) || null;
  }, [currentCustomer, selectedPart, allReviews]);

  // Handle Submit Review (ĐG04, ĐG05, ĐG09: Media đính kèm, ĐG16: Giới hạn 200 từ)
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart || !currentCustomer || !newReviewAuthor.trim() || !newReviewContent.trim()) return;

    // ĐG16: Giới hạn mỗi lần đánh giá không quá 200 từ và cảnh báo chống spam
    const words = countWords(newReviewContent);
    if (words > 200) {
      alert(`Đánh giá không được vượt quá 200 từ (Hiện tại: ${words} từ). Vui lòng rút gọn nội dung để đảm bảo tính xác thực và phòng chống spam!`);
      return;
    }

    if (existingReview) {
      // ĐG05: Chỉnh sửa đánh giá hiện có (Tối đa 1 lần sửa)
      if ((existingReview.editCount || 0) >= 1) {
        alert('Bạn đã sử dụng hết lượt chỉnh sửa đánh giá (tối đa 1 lần).');
        return;
      }

      await feedbackApi.update(existingReview.id, {
        diemDanhGia: newReviewStars,
        noiDung: newReviewContent.trim(),
        hinhAnhDinhKem: reviewMediaFiles,
      });

      setAllReviews(prev => prev.map(r => r.id === existingReview.id ? {
        ...r,
        soSao: newReviewStars,
        noiDung: newReviewContent.trim(),
        hinhAnhDinhKem: reviewMediaFiles,
        editCount: (r.editCount || 0) + 1,
      } : r));

      setIsEditingReview(false);
      setReviewToast('✓ Đã cập nhật đánh giá thành công! Bạn đã hoàn thành lượt chỉnh sửa.');
      setTimeout(() => setReviewToast(null), 4000);
      return;
    }

    // ĐG04 & ĐG09: Gửi đánh giá mới lên Backend và lưu kèm media ảnh/video
    const res = await feedbackApi.create({
      customerId: currentCustomer.id,
      hoTen: newReviewAuthor.trim(),
      soDienThoai: currentCustomer.soDienThoai,
      email: currentCustomer.email,
      diaChi: currentCustomer.diaChi,
      noiDung: newReviewContent.trim(),
      diemDanhGia: newReviewStars,
      loaiDanhGia: 'SanPham',
      loaiNhan: newReviewStars <= 3 ? 'KhieuNai' : 'DanhGia',
      productId: selectedPart.id,
      productName: selectedPart.tenSanPham,
      productImage: selectedPart.hinhAnh,
      productType: 'PhuTung',
      hinhAnhDinhKem: reviewMediaFiles,
    });

    const newRev: ProductReview = {
      id: res.feedback.id,
      targetId: selectedPart.id,
      customerId: currentCustomer.id,
      tenKhachHang: newReviewAuthor.trim(),
      soDienThoai: currentCustomer.soDienThoai
        ? currentCustomer.soDienThoai.slice(0, 4) + '***' + currentCustomer.soDienThoai.slice(-3)
        : '091***' + Math.floor(100 + Math.random() * 900),
      soSao: newReviewStars,
      ngayDanhGia: new Date().toISOString().split('T')[0],
      noiDung: newReviewContent.trim(),
      daMua: true,
      dongXeDaMua: selectedPart.dongXePhuHop ? selectedPart.dongXePhuHop.split(',')[0] : 'Xe máy',
      editCount: 0,
      productName: selectedPart.tenSanPham,
      productImage: selectedPart.hinhAnh,
      productType: 'PhuTung',
      hinhAnhDinhKem: reviewMediaFiles,
    };

    setAllReviews(prev => [newRev, ...prev]);
    setNewReviewContent('');
    setReviewMediaFiles([]);
    setReviewSubmitted(true);
    setReviewToast('✓ Đánh giá phụ tùng kèm hình ảnh đã được lưu và cập nhật đồng bộ!');
    setTimeout(() => {
      setReviewSubmitted(false);
      setReviewToast(null);
    }, 4000);
  };

  const selectedPartReviews = selectedPart
    ? allReviews.filter(r => r.targetId === selectedPart.id)
    : [];

  // ─────────────────────────────────────────────────────────────
  // 1. DEDICATED PRODUCT DETAIL PAGE VIEW (TC04)
  // ─────────────────────────────────────────────────────────────
  if (selectedPart) {
    const effectivePrice = selectedPart.giaKhuyenMai ?? selectedPart.giaGoc;
    const hasDiscount = selectedPart.giaKhuyenMai !== null;
    const discountPct = hasDiscount
      ? Math.round(((selectedPart.giaGoc - selectedPart.giaKhuyenMai!) / selectedPart.giaGoc) * 100)
      : 0;
    const isAdded = added.has(selectedPart.id);

    return (
      <div className="bg-zinc-50 min-h-screen pb-16">
        {/* Sticky Breadcrumb Bar */}
        <div className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono overflow-x-auto whitespace-nowrap">
              <button
                onClick={() => setSelectedPart(null)}
                className="text-red-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>←</span> Cửa hàng phụ tùng
              </button>
              <span>/</span>
              <span className="text-zinc-700">{selectedPart.danhMuc}</span>
              <span>/</span>
              <span className="text-zinc-900 font-bold truncate max-w-xs">{selectedPart.tenSanPham}</span>
            </div>

            <button
              onClick={() => {
                setSelectedPart(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>✕</span> Quay lại danh sách
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
          {/* Main 2-Column Product Detail Layout (Shopee / Tiki style) */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Big Image & Guarantees */}
              <div className="lg:col-span-5 space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 aspect-square flex items-center justify-center p-4 group">
                  <img
                    src={selectedPart.hinhAnh}
                    alt={selectedPart.tenSanPham}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                  />
                  {hasDiscount && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-md uppercase tracking-wider font-mono">
                      GIẢM {discountPct}%
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs text-zinc-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-zinc-200 shadow-xs font-mono">
                    ✓ 100% Chính hãng
                  </div>
                </div>

                {/* Service Perks Box */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center gap-2.5">
                    <span className="text-xl">🛡️</span>
                    <div>
                      <div className="font-bold text-zinc-900">Bảo hành chính hãng</div>
                      <div className="text-[10px] text-zinc-500">{selectedPart.baoHanh || '12 tháng điện tử'}</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center gap-2.5">
                    <span className="text-xl">🔄</span>
                    <div>
                      <div className="font-bold text-zinc-900">Đổi trả miễn phí</div>
                      <div className="text-[10px] text-zinc-500">Trong 7 ngày nếu lỗi NSX</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center gap-2.5">
                    <span className="text-xl">🔧</span>
                    <div>
                      <div className="font-bold text-zinc-900">Lắp ráp miễn phí</div>
                      <div className="text-[10px] text-zinc-500">Tại trạm dịch vụ showroom</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center gap-2.5">
                    <span className="text-xl">🚚</span>
                    <div>
                      <div className="font-bold text-zinc-900">Giao hàng hỏa tốc</div>
                      <div className="text-[10px] text-zinc-500">Nhận trong 2H nội thành</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Title, Ratings, Shopee-style Price Box, Actions */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold font-mono uppercase tracking-wider">
                      {selectedPart.thuongHieu}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-semibold">
                      {selectedPart.danhMuc}
                    </span>
                    {selectedPart.xuatXu && (
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                        Xuất xứ: {selectedPart.xuatXu}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
                    {selectedPart.tenSanPham}
                  </h1>

                  {/* Rating & Sold count */}
                  <div className="flex items-center gap-4 text-xs flex-wrap pb-2 border-b border-zinc-100">
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <span className="font-bold text-sm text-zinc-900 underline">{selectedPart.rating}</span>
                      <span>★★★★★</span>
                    </div>
                    <span className="text-zinc-300">|</span>
                    <span className="text-zinc-600">
                      <strong className="text-zinc-900">{selectedPartReviews.length || selectedPart.luotDanh}</strong> Đánh giá
                    </span>
                    <span className="text-zinc-300">|</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span>✓</span> Đã bán {(selectedPart.luotDanh || 10) * 8} sản phẩm
                    </span>
                  </div>

                  {/* Shopee-style Highlight Price Container */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-50/90 via-orange-50/50 to-red-50/90 border border-red-200/80 space-y-2">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-extrabold text-red-700 font-mono tracking-tight">
                        {formatVND(effectivePrice)}
                      </span>
                      {hasDiscount && (
                        <>
                          <span className="text-base text-zinc-400 line-through font-mono">
                            {formatVND(selectedPart.giaGoc)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-xs font-extrabold font-mono uppercase">
                            Tiết kiệm {formatVND(selectedPart.giaGoc - effectivePrice)} (-{discountPct}%)
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-red-800/80 font-medium flex items-center gap-1.5">
                      <span>🎁</span> Ưu đãi độc quyền: Tặng voucher kiểm tra và tra dầu nhớt miễn phí tại hệ thống showroom!
                    </div>
                  </div>

                  {/* Specs Quick Pill */}
                  {selectedPart.dongXePhuHop && (
                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between">
                      <span className="text-zinc-500">Dòng xe phù hợp:</span>
                      <strong className="text-blue-700 font-semibold">{selectedPart.dongXePhuHop}</strong>
                    </div>
                  )}

                  {/* Quantity selector */}
                  <div className="flex items-center gap-4 pt-2">
                    <span className="text-xs font-semibold text-zinc-600">Số lượng:</span>
                    <div className="flex items-center border border-zinc-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                        className="px-3.5 py-1.5 text-zinc-600 hover:bg-zinc-100 font-bold transition cursor-pointer text-sm"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={selectedPart.soLuongTon}
                        value={detailQty}
                        onChange={e => setDetailQty(Math.max(1, Math.min(selectedPart.soLuongTon, parseInt(e.target.value) || 1)))}
                        className="w-14 text-center text-xs font-bold font-mono focus:outline-none py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() => setDetailQty(Math.min(selectedPart.soLuongTon, detailQty + 1))}
                        className="px-3.5 py-1.5 text-zinc-600 hover:bg-zinc-100 font-bold transition cursor-pointer text-sm"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">
                      (Còn <strong className="text-zinc-900">{selectedPart.soLuongTon}</strong> sản phẩm trong kho)
                    </span>
                  </div>
                </div>

                {/* Big Action Buttons (TC03: Auth check) */}
                <div className="pt-4 border-t border-zinc-100 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAdd(selectedPart, detailQty)}
                      className={`py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 border-2 ${
                        isAdded
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-red-50 hover:bg-red-100/80 border-red-700 text-red-700'
                      }`}
                    >
                      <span className="text-base">{isAdded ? '✓' : '🛒'}</span>
                      <span>{isAdded ? 'Đã thêm vào giỏ hàng!' : 'Thêm vào giỏ hàng'}</span>
                    </button>

                    <button
                      onClick={() => handleBuyNow(selectedPart, detailQty)}
                      className="py-3.5 px-6 rounded-2xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-red-700/30 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>⚡</span> Mua ngay với giá ưu đãi
                    </button>
                  </div>

                  {!currentCustomer && (
                    <div className="text-center text-[11px] text-zinc-500 font-sans">
                      🔒 Chưa đăng nhập? Nhấn nút trên hệ thống sẽ mở form đăng nhập để bảo vệ đơn hàng của bạn.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Product Tabs: Description / Technical Specs / Reviews (TC01) */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-zinc-200 bg-zinc-50/70 px-6 gap-6">
              <button
                onClick={() => setDetailTab('desc')}
                className={`py-4 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer ${
                  detailTab === 'desc'
                    ? 'border-red-600 text-red-700'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                📖 Mô tả chi tiết & Hướng dẫn
              </button>
              <button
                onClick={() => setDetailTab('specs')}
                className={`py-4 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer ${
                  detailTab === 'specs'
                    ? 'border-red-600 text-red-700'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                ⚙️ Bảng thông số kỹ thuật
              </button>
              <button
                onClick={() => setDetailTab('reviews')}
                className={`py-4 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer flex items-center gap-2 ${
                  detailTab === 'reviews'
                    ? 'border-red-600 text-red-700'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <span>⭐ Đánh giá khách hàng</span>
                <span className="px-2 py-0.2 rounded-full bg-zinc-200 text-zinc-700 text-[10px] font-mono">
                  {selectedPartReviews.length}
                </span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 lg:p-8">
              {detailTab === 'desc' && (
                <div className="space-y-4 max-w-4xl text-xs text-zinc-700 leading-relaxed">
                  <h3 className="text-sm font-bold text-zinc-900 uppercase font-mono">
                    Giới thiệu sản phẩm {selectedPart.tenSanPham}
                  </h3>
                  <p>{selectedPart.moTa}</p>
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                    <div className="font-bold text-zinc-900 uppercase font-mono text-[11px]">
                      🔧 Hướng dẫn sử dụng & Khuyến nghị lắp đặt:
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-zinc-600">
                      <li>Khuyến cáo kiểm tra xe định kỳ và lắp ráp tại đại lý ủy quyền để đảm bảo độ chuẩn xác kỹ thuật.</li>
                      <li>Vệ sinh sạch vị trí lắp đặt trước khi thay thế phụ tùng mới.</li>
                      <li>Sau khi lắp đặt, kỹ thuật viên sẽ kiểm tra áp suất, lực siết ốc và test vận hành trước khi bàn giao xe.</li>
                    </ul>
                  </div>
                </div>
              )}

              {detailTab === 'specs' && (
                <div className="max-w-2xl">
                  <div className="rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-200 text-xs">
                    <div className="grid grid-cols-2 p-3 bg-zinc-50/80 font-medium">
                      <span className="text-zinc-500">Mã phụ tùng (SKU)</span>
                      <strong className="text-zinc-900 font-mono">{selectedPart.id}</strong>
                    </div>
                    <div className="grid grid-cols-2 p-3 bg-white font-medium">
                      <span className="text-zinc-500">Thương hiệu</span>
                      <strong className="text-zinc-900">{selectedPart.thuongHieu}</strong>
                    </div>
                    <div className="grid grid-cols-2 p-3 bg-zinc-50/80 font-medium">
                      <span className="text-zinc-500">Danh mục sản phẩm</span>
                      <strong className="text-zinc-900">{selectedPart.danhMuc}</strong>
                    </div>
                    <div className="grid grid-cols-2 p-3 bg-white font-medium">
                      <span className="text-zinc-500">Dòng xe tương thích</span>
                      <strong className="text-blue-700">{selectedPart.dongXePhuHop || 'Nhiều dòng xe'}</strong>
                    </div>
                    <div className="grid grid-cols-2 p-3 bg-zinc-50/80 font-medium">
                      <span className="text-zinc-500">Xuất xứ</span>
                      <strong className="text-zinc-900">{selectedPart.xuatXu || 'Chính hãng'}</strong>
                    </div>
                    <div className="grid grid-cols-2 p-3 bg-white font-medium">
                      <span className="text-zinc-500">Chính sách bảo hành</span>
                      <strong className="text-emerald-700">{selectedPart.baoHanh || '12 tháng điện tử'}</strong>
                    </div>
                    <div className="grid grid-cols-2 p-3 bg-zinc-50/80 font-medium">
                      <span className="text-zinc-500">Tình trạng kho hàng</span>
                      <strong className="text-zinc-900">{selectedPart.soLuongTon} sản phẩm có sẵn</strong>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Rating Overview */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl font-extrabold text-zinc-900 font-mono">4.9</div>
                      <div>
                        <div className="flex text-amber-500 text-sm">★★★★★</div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          Dựa trên {selectedPartReviews.length || 2} nhận xét thực tế từ khách mua hàng
                        </div>
                      </div>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                      ✓ 100% Khách hàng hài lòng
                    </span>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-3">
                    {selectedPartReviews.length === 0 ? (
                      <div className="p-6 text-center text-zinc-500 text-xs">
                        Chưa có đánh giá nào cho phụ tùng này. Hãy là người đầu tiên chia sẻ cảm nhận!
                      </div>
                    ) : (
                      selectedPartReviews.map(r => (
                        <div key={r.id} className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                                {r.tenKhachHang[0]}
                              </span>
                              <div>
                                <span className="font-bold text-zinc-900">{r.tenKhachHang}</span>
                                {r.soDienThoai && (
                                  <span className="text-[10px] text-zinc-400 font-mono ml-2">({r.soDienThoai})</span>
                                )}
                              </div>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                                ✓ Đã mua hàng chính hãng
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-mono">{r.ngayDanhGia}</span>
                          </div>

                          <div className="flex text-amber-500 text-xs">
                            {'★'.repeat(r.soSao)}{'☆'.repeat(5 - r.soSao)}
                          </div>

                          <p className="text-xs text-zinc-700 leading-relaxed">{r.noiDung}</p>

                          {/* ĐG09: Hiển thị hình ảnh & video đính kèm của review phụ tùng */}
                          {r.hinhAnhDinhKem && r.hinhAnhDinhKem.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {r.hinhAnhDinhKem.map((imgUrl, i) => {
                                const isVid = imgUrl.includes('data:video') || imgUrl.endsWith('.mp4') || imgUrl.endsWith('.webm');
                                if (isVid) {
                                  return (
                                    <video
                                      key={i}
                                      src={imgUrl}
                                      controls
                                      className="w-28 h-20 rounded-xl object-cover border border-zinc-200 bg-black shadow-2xs"
                                    />
                                  );
                                }
                                return (
                                  <img
                                    key={i}
                                    src={imgUrl}
                                    alt={`Ảnh review phụ tùng ${i + 1}`}
                                    onClick={() => setPreviewZoomImage(imgUrl)}
                                    className="w-16 h-16 rounded-xl object-cover border border-zinc-200 cursor-pointer hover:opacity-90 hover:scale-105 transition shadow-2xs bg-white"
                                    title="Bấm để xem ảnh phóng to"
                                  />
                                );
                              })}
                            </div>
                          )}

                          {r.phanHoiShowroom && (
                            <div className="mt-2 p-2.5 rounded-xl bg-zinc-50 border-l-2 border-red-600 text-[11px] text-zinc-600">
                              <span className="font-bold text-red-700 block">Phản hồi từ Showroom:</span>
                              {r.phanHoiShowroom}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Review Form (TC01: Blocked when unauth, ĐG03: Blocked when unpurchased, ĐG01 & ĐG02: Responsive & Account Display) */}
                  {!currentCustomer ? (
                    <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-2.5">
                      <div className="text-3xl">🔒</div>
                      <div className="text-xs font-bold text-amber-900 uppercase font-mono tracking-wider">
                        ĐĂNG NHẬP ĐỂ VIẾT ĐÁNH GIÁ
                      </div>
                      <p className="text-xs text-amber-700 max-w-md mx-auto">
                        Chỉ khách hàng đã đăng nhập tài khoản và đã từng mua phụ tùng này tại hệ thống mới có thể gửi đánh giá và nhận xét.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (onRequireLogin) onRequireLogin();
                          else window.dispatchEvent(new CustomEvent('crm-open-login'));
                        }}
                        className="mt-2 px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                      >
                        Đăng nhập để đánh giá ngay →
                      </button>
                    </div>
                  ) : !hasPurchased ? (
                    /* ĐG03: Khách hàng chưa mua sản phẩm */
                    <div className="p-6 rounded-3xl bg-amber-50/80 border border-amber-200 text-center space-y-3">
                      <div className="text-3xl">🛍️</div>
                      <div className="text-xs font-bold text-amber-900 uppercase font-mono tracking-wider">
                        BẠN CHƯA MUA SẢN PHẨM NÀY
                      </div>
                      <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
                        Theo chính sách đánh giá minh bạch, chỉ những khách hàng đã mua phụ tùng <strong>"{selectedPart.tenSanPham}"</strong> tại đại lý mới có thể gửi nhận xét thực tế về sản phẩm.
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleBuyNow(selectedPart, 1)}
                          className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-2"
                        >
                          <span>⚡</span> Mua ngay với giá ưu đãi
                        </button>
                      </div>
                    </div>
                  ) : existingReview && !isEditingReview ? (
                    /* ĐG05: Đã đánh giá - Hiển thị đánh giá của khách hàng và nút sửa (tối đa 1 lần) */
                    <div className="p-5 sm:p-6 rounded-3xl bg-zinc-50 border border-zinc-200 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-zinc-200">
                        <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono flex items-center gap-2">
                          <span>✓</span> ĐÁNH GIÁ CỦA BẠN VỀ SẢN PHẨM NÀY
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {(existingReview.editCount || 0) >= 1 ? 'Đã hết lượt sửa (tối đa 1 lần)' : 'Còn 1 lượt chỉnh sửa'}
                        </span>
                      </div>

                      {reviewToast && (
                        <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                          <span>✓</span> {reviewToast}
                        </div>
                      )}

                      <div className="p-4 rounded-2xl bg-white border border-zinc-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                              {currentCustomer.hoTen[0]}
                            </span>
                            <span className="font-bold text-xs text-zinc-900">{currentCustomer.hoTen}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">{existingReview.ngayDanhGia}</span>
                        </div>

                        <div className="flex text-amber-500 text-sm">
                          {'★'.repeat(existingReview.soSao)}{'☆'.repeat(5 - existingReview.soSao)}
                        </div>

                        <p className="text-xs text-zinc-700 leading-relaxed">{existingReview.noiDung}</p>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                        <div className="text-[11px] text-zinc-500">
                          {(existingReview.editCount || 0) >= 1 ? (
                            <span className="text-emerald-700 font-medium">✓ Bạn đã hoàn thành đánh giá và sử dụng lượt chỉnh sửa duy nhất.</span>
                          ) : (
                            <span>Mỗi tài khoản được gửi đánh giá 1 lần và sửa 1 lần duy nhất.</span>
                          )}
                        </div>

                        {(existingReview.editCount || 0) < 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingReview(true);
                              setNewReviewStars(existingReview.soSao);
                              setNewReviewContent(existingReview.noiDung);
                              setReviewMediaFiles(existingReview.hinhAnhDinhKem || []);
                            }}
                            className="px-4 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <span>✏️</span> Chỉnh sửa đánh giá (Còn 1 lần sửa)
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ĐG01, ĐG02, ĐG05: Khung nhập / sửa đánh giá */
                    <form onSubmit={handleAddReview} className="p-5 sm:p-6 rounded-3xl bg-zinc-50 border border-zinc-200 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-zinc-200">
                        <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono flex items-center gap-2">
                          <span>{isEditingReview ? '✏️' : '✍️'}</span> {isEditingReview ? 'CHỈNH SỬA ĐÁNH GIÁ (LƯỢT SỬA DUY NHẤT)' : 'VIẾT NHẬN XÉT & ĐÁNH GIÁ PHỤ TÙNG'}
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {isEditingReview ? '⚠️ Còn 1 lần sửa' : '✓ Đã xác minh mua hàng tại đại lý'}
                        </span>
                      </div>

                      {reviewToast && (
                        <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                          <span>✓</span> {reviewToast}
                        </div>
                      )}

                      {/* ĐG02: Hiển thị thông tin tài khoản đang đánh giá */}
                      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-zinc-200">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm font-mono shrink-0">
                          {currentCustomer.hoTen.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-zinc-900">{currentCustomer.hoTen}</span>
                            <span className="text-[10px] font-mono text-zinc-500 font-semibold bg-zinc-100 px-2 py-0.5 rounded-md">
                              {currentCustomer.soDienThoai}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            Email: {currentCustomer.email || 'Chưa cập nhật'} · Khách hàng Motoshop
                          </div>
                        </div>
                      </div>

                      {/* ĐG01: Khung nhập đánh giá responsive */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Họ và tên người đánh giá *</label>
                          <input
                            type="text"
                            required
                            value={newReviewAuthor}
                            onChange={e => setNewReviewAuthor(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white text-xs focus:outline-none focus:border-red-600 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Số điện thoại liên hệ *</label>
                          <input
                            type="text"
                            required
                            value={newReviewPhone}
                            onChange={e => setNewReviewPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white text-xs focus:outline-none focus:border-red-600 font-mono font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs pt-1 flex-wrap">
                        <span className="font-semibold text-zinc-700">Mức độ hài lòng:</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReviewStars(star)}
                              className="text-xl text-amber-500 hover:scale-110 transition cursor-pointer p-0.5"
                            >
                              {star <= newReviewStars ? '★' : '☆'}
                            </button>
                          ))}
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-600 ml-1">
                          {newReviewStars === 5 ? 'Tuyệt vời (5 sao)' : newReviewStars === 4 ? 'Hài lòng (4 sao)' : newReviewStars === 3 ? 'Bình thường (3 sao)' : 'Chưa hài lòng'}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                          Chia sẻ chi tiết trải nghiệm sử dụng phụ tùng (Tối đa 200 từ) *
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Chia sẻ chất lượng sản phẩm, độ bền, cảm giác sử dụng sau khi lắp đặt vào xe..."
                          required
                          value={newReviewContent}
                          onChange={e => setNewReviewContent(e.target.value)}
                          className={`w-full px-4 py-3 rounded-2xl border bg-white text-xs focus:outline-none leading-relaxed transition ${
                            countWords(newReviewContent) > 200 ? 'border-red-500 focus:border-red-600' : 'border-zinc-300 focus:border-red-600'
                          }`}
                        />
                        {/* ĐG16: Bộ đếm từ và cảnh báo chống spam */}
                        <div className="flex items-center justify-between text-xs mt-1.5 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold ${
                              countWords(newReviewContent) > 200 ? 'text-red-600' : countWords(newReviewContent) > 0 ? 'text-emerald-700' : 'text-zinc-500'
                            }`}>
                              📝 {countWords(newReviewContent)} / 200 từ
                            </span>
                            {countWords(newReviewContent) > 200 ? (
                              <span className="text-red-600 font-bold text-[11px] animate-pulse">
                                ⚠️ Vượt quá 200 từ! Vui lòng rút gọn nội dung để tránh spam.
                              </span>
                            ) : countWords(newReviewContent) > 0 ? (
                              <span className="text-emerald-600 text-[11px] font-medium">
                                ✓ Độ dài hợp lệ (tối đa 200 từ)
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {newReviewContent.length} ký tự
                          </span>
                        </div>
                      </div>

                      {/* ĐG09: Đính kèm hình ảnh hoặc video khi đánh giá phụ tùng */}
                      <div className="space-y-2 p-3.5 rounded-2xl bg-white border border-zinc-200">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5 uppercase font-mono">
                            <span>📷</span> ĐÍNH KÈM HÌNH ẢNH HOẶC VIDEO PHỤ TÙNG ({reviewMediaFiles.length})
                          </label>
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 cursor-pointer transition flex items-center gap-1 shadow-2xs">
                              <span>📁 Chọn tệp từ máy</span>
                              <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={e => {
                                  const files = Array.from(e.target.files || []);
                                  files.forEach(file => {
                                    const reader = new FileReader();
                                    reader.onload = ev => {
                                      if (ev.target?.result) {
                                        setReviewMediaFiles(prev => [...prev, ev.target!.result as string]);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  });
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setReviewMediaFiles(prev => [
                                  ...prev,
                                  selectedPart.hinhAnh || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80'
                                ]);
                              }}
                              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl border border-zinc-200 cursor-pointer transition flex items-center gap-1"
                              title="Thêm nhanh ảnh chụp thực tế phụ tùng"
                            >
                              <span>📷 + Ảnh mẫu</span>
                            </button>
                          </div>
                        </div>

                        {reviewMediaFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2.5 pt-1">
                            {reviewMediaFiles.map((mUrl, idx) => {
                              const isVid = mUrl.includes('data:video') || mUrl.endsWith('.mp4');
                              return (
                                <div key={idx} className="relative group rounded-xl overflow-hidden border border-zinc-300 w-20 h-20 bg-zinc-900 shadow-2xs">
                                  {isVid ? (
                                    <video src={mUrl} className="w-full h-full object-cover" />
                                  ) : (
                                    <img src={mUrl} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setReviewMediaFiles(prev => prev.filter((_, i) => i !== idx))}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-700 transition cursor-pointer shadow"
                                    title="Xóa tệp đính kèm này"
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        {isEditingReview && (
                          <button
                            type="button"
                            onClick={() => setIsEditingReview(false)}
                            className="px-4 py-3 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-xs font-bold text-zinc-700 transition cursor-pointer"
                          >
                            Hủy bỏ
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={countWords(newReviewContent) > 200 || countWords(newReviewContent) === 0}
                          className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold transition shadow-md ${
                            countWords(newReviewContent) > 200 || countWords(newReviewContent) === 0
                              ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed shadow-none'
                              : 'bg-red-700 text-white hover:bg-red-800 cursor-pointer shadow-red-700/20'
                          }`}
                        >
                          {isEditingReview ? 'Lưu cập nhật đánh giá' : 'Gửi đánh giá phụ tùng ngay'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Products Recommendation Row */}
          {relatedParts.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 uppercase font-mono tracking-tight">
                    🔗 Phụ tùng cùng loại & Gợi ý cho bạn
                  </h3>
                  <p className="text-xs text-zinc-500">Các sản phẩm cùng hãng {selectedPart.thuongHieu} hoặc cùng danh mục</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedParts.map(rp => (
                  <div
                    key={rp.id}
                    onClick={() => {
                      setSelectedPart(rp);
                      setDetailQty(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-white rounded-2xl border border-zinc-200 p-4 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                  >
                    <div className="aspect-square bg-zinc-100 rounded-xl overflow-hidden mb-3 p-2 flex items-center justify-center">
                      <img src={rp.hinhAnh} alt={rp.tenSanPham} className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-zinc-400 font-mono">{rp.thuongHieu}</div>
                      <div className="text-xs font-bold text-zinc-900 line-clamp-1">{rp.tenSanPham}</div>
                      <div className="text-sm font-bold text-red-700 font-mono">
                        {formatVND(rp.giaKhuyenMai ?? rp.giaGoc)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. MAIN STORE VIEW (TC04, TC05, TC06)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-zinc-50 min-h-screen pb-16 space-y-8">
      {/* ── TC06: PROMO HERO BANNER & SERVICE PERKS ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-950 via-zinc-900 to-red-950 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.25),transparent_50%)]" />
        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-mono font-bold uppercase tracking-wider">
            <span>✨</span> SIÊU THỊ PHỤ TÙNG & PHỤ KIỆN CHÍNH HÃNG 2025
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight uppercase max-w-3xl leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            CHĂM SÓC & NÂNG CẤP CHIẾC XE CỦA BẠN
          </h1>
          <p className="text-zinc-300 text-xs sm:text-sm max-w-2xl font-sans leading-relaxed">
            100% Phụ tùng nhập khẩu & chính hãng Honda, Motul, Brembo, Michelin, NGK, Bando, D.I.D. Hỗ trợ tra cứu nhanh theo dòng xe, miễn phí công lắp đặt tại đại lý!
          </p>

          {/* Highlights Badges */}
          <div className="flex items-center gap-3 pt-2 flex-wrap text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-zinc-200">
              🏷️ Giảm tới 30% phụ tùng phanh & nhớt
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-zinc-200">
              🔧 Miễn phí công lắp ráp tại xưởng
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-zinc-200">
              ⚡ Giao hàng hỏa tốc trong 2H
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Service Perks Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <div className="text-xs font-bold text-zinc-900">100% Chính Hãng</div>
              <div className="text-[10px] text-zinc-500">Cam kết nguồn gốc xuất xứ</div>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex items-center gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <div className="text-xs font-bold text-zinc-900">Đổi Trả 7 Ngày</div>
              <div className="text-[10px] text-zinc-500">1 đổi 1 nếu lỗi từ nhà sản xuất</div>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="text-xs font-bold text-zinc-900">Giao Hàng 2 Giờ</div>
              <div className="text-[10px] text-zinc-500">Hỏa tốc khu vực nội thành</div>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex items-center gap-3">
            <span className="text-2xl">👨‍🔧</span>
            <div>
              <div className="text-xs font-bold text-zinc-900">Kỹ Thuật Chuyên Nghiệp</div>
              <div className="text-[10px] text-zinc-500">Lắp ráp & bảo dưỡng tại xưởng</div>
            </div>
          </div>
        </div>

        {/* ── TC06: FLASH SALE GIỜ VÀNG SECTION ── */}
        <div className="rounded-3xl p-6 bg-gradient-to-r from-red-900 via-zinc-900 to-red-950 border border-red-800 text-white shadow-lg space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-pulse">⚡</span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide font-display text-amber-400">
                  GIỜ VÀNG FLASH SALE
                </h2>
                <p className="text-xs text-zinc-300">Ưu đãi giảm giá phụ tùng cực sốc số lượng có hạn</p>
              </div>
            </div>

            {/* Countdown Badges */}
            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs text-zinc-300 mr-1 hidden sm:inline">Kết thúc trong:</span>
              <div className="px-2.5 py-1.5 rounded-xl bg-zinc-950/80 border border-red-500/40 font-bold text-amber-400 text-sm">
                {String(countdown.hours).padStart(2, '0')}
              </div>
              <span className="font-bold text-amber-400">:</span>
              <div className="px-2.5 py-1.5 rounded-xl bg-zinc-950/80 border border-red-500/40 font-bold text-amber-400 text-sm">
                {String(countdown.minutes).padStart(2, '0')}
              </div>
              <span className="font-bold text-amber-400">:</span>
              <div className="px-2.5 py-1.5 rounded-xl bg-zinc-950/80 border border-red-500/40 font-bold text-amber-400 text-sm">
                {String(countdown.seconds).padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* Flash Sale Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {flashSaleItems.map(p => {
              const discountPct = Math.round(((p.giaGoc - p.giaKhuyenMai!) / p.giaGoc) * 100);
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPart(p);
                    setDetailQty(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white rounded-2xl p-4 text-zinc-900 group hover:-translate-y-1 transition duration-200 cursor-pointer flex flex-col justify-between shadow"
                >
                  <div className="relative aspect-square rounded-xl bg-zinc-100 p-2 mb-3 flex items-center justify-center overflow-hidden">
                    <img src={p.hinhAnh} alt={p.tenSanPham} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition" />
                    <div className="absolute top-2 left-2 bg-red-600 text-white font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow">
                      -{discountPct}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{p.thuongHieu}</div>
                    <div className="text-xs font-bold text-zinc-900 line-clamp-1 group-hover:text-red-700 transition">
                      {p.tenSanPham}
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-red-700 font-mono">
                        {formatVND(p.giaKhuyenMai!)}
                      </span>
                      <span className="text-[11px] text-zinc-400 line-through font-mono">
                        {formatVND(p.giaGoc)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                        <span>🔥 Đã bán {p.luotDanh * 3}</span>
                        <span className="text-red-700 font-bold">Sắp hết</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-red-600 rounded-full w-4/5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── TC06: SẢN PHẨM BÁN CHẠY NHẤT (BEST SELLERS) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-zinc-950 uppercase tracking-tight font-display flex items-center gap-2">
                <span>👑</span> SẢN PHẨM BÁN CHẠY NHẤT THÁNG
              </h2>
              <p className="text-xs text-zinc-500 font-sans">Được người tiêu dùng đánh giá cao nhất và lắp đặt nhiều nhất</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bestSellers.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedPart(p);
                  setDetailQty(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-white rounded-2xl border border-zinc-200 p-4 hover:border-red-400 hover:shadow-sm transition cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-lg bg-amber-400 text-zinc-950 text-[10px] font-mono font-bold shadow-xs">
                  #{idx + 1} Best Seller
                </div>

                <div className="aspect-square rounded-xl bg-zinc-50 p-2 mb-3 flex items-center justify-center overflow-hidden">
                  <img src={p.hinhAnh} alt={p.tenSanPham} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 font-mono">{p.thuongHieu}</span>
                    <span className="text-amber-500 font-bold">★ {p.rating}</span>
                  </div>
                  <div className="text-xs font-bold text-zinc-900 line-clamp-1 group-hover:text-red-700 transition">
                    {p.tenSanPham}
                  </div>
                  <div className="text-sm font-bold text-red-700 font-mono">
                    {formatVND(p.giaKhuyenMai ?? p.giaGoc)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TC05: UNIFIED SEARCH & FILTER CONTAINER (CÙNG MỘT KHUNG ĐIỀU KHIỂN) ── */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
            <div className="text-sm font-bold text-zinc-900 uppercase font-mono flex items-center gap-2">
              <span>🔍</span> BỘ LỌC TÌM KIẾM PHỤ TÙNG TẬP TRUNG
            </div>
            <div className="text-xs text-zinc-500 font-mono">
              Hiển thị <strong className="text-zinc-900">{filtered.length}</strong> / {mockParts.length} sản phẩm
            </div>
          </div>

          {/* Row 1: Search Input & Dropdown Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input (5 cols) */}
            <div className="lg:col-span-5 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm tên phụ tùng, thương hiệu, dòng xe (SH, Exciter, Motul)..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:border-red-600 bg-zinc-50/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Brand Dropdown (2 cols) */}
            <div className="lg:col-span-2">
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-xs bg-white text-zinc-700 focus:outline-none focus:border-red-600 cursor-pointer font-mono"
              >
                <option value="Tất cả">Hãng: Tất cả</option>
                {brands.filter(b => b !== 'Tất cả').map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Price Range Dropdown (2 cols) */}
            <div className="lg:col-span-2">
              <select
                value={priceRange}
                onChange={e => setPriceRange(e.target.value as typeof priceRange)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-xs bg-white text-zinc-700 focus:outline-none focus:border-red-600 cursor-pointer font-mono"
              >
                <option value="ALL">Khoảng giá: Tất cả</option>
                <option value="under200k">Dưới 200.000 đ</option>
                <option value="200kTo500k">200.000 - 500.000 đ</option>
                <option value="500kTo1m">500.000 - 1.000.000 đ</option>
                <option value="above1m">Trên 1.000.000 đ</option>
              </select>
            </div>

            {/* Sort Dropdown (3 cols) */}
            <div className="lg:col-span-3">
              <select
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-xs bg-white text-zinc-700 focus:outline-none focus:border-red-600 cursor-pointer font-mono"
              >
                <option value="default">Sắp xếp: Mặc định</option>
                <option value="priceAsc">Giá: Thấp đến Cao ↑</option>
                <option value="priceDesc">Giá: Cao đến Thấp ↓</option>
                <option value="rating">Đánh giá sao cao nhất ★</option>
              </select>
            </div>
          </div>

          {/* Row 2: Category Filter Chips Bar */}
          <div className="space-y-2 pt-2 border-t border-zinc-100">
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
              DANH MỤC PHỤ TÙNG:
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none items-center">
              {categories.map(c => {
                const isSelected = cat === c;
                const icon = categoryIcons[c] || '📦';
                return (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-2xs'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{c}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Status & Reset */}
          {(cat !== 'Tất cả' || selectedBrand !== 'Tất cả' || search || priceRange !== 'ALL' || sort !== 'default') && (
            <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 font-mono border-t border-zinc-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span>Đang lọc:</span>
                {cat !== 'Tất cả' && <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">{cat}</span>}
                {selectedBrand !== 'Tất cả' && <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">{selectedBrand}</span>}
                {priceRange !== 'ALL' && <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">Khoảng giá</span>}
                {search && <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">Từ khóa: "{search}"</span>}
              </div>

              <button
                onClick={() => {
                  setCat('Tất cả');
                  setSelectedBrand('Tất cả');
                  setSearch('');
                  setPriceRange('ALL');
                  setSort('default');
                }}
                className="text-red-700 font-bold hover:underline cursor-pointer flex items-center gap-1 ml-auto"
              >
                <span>✕</span> Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* ── TC04 & TC12: PRODUCT GRID LISTING WITH 20 ITEMS/PAGE PAGINATION ── */}
        <div id="parts-listing-anchor" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-extrabold text-zinc-950 uppercase tracking-tight font-display">
              TẤT CẢ PHỤ TÙNG & PHỤ KIỆN
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800 font-bold">
                Trang {currentPage} / {totalPages}
              </span>
              <span>({filtered.length} sản phẩm)</span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center space-y-3">
              <div className="text-4xl">🔍</div>
              <div className="text-sm font-bold text-zinc-900">Không tìm thấy sản phẩm phụ tùng nào!</div>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Không có sản phẩm nào phù hợp với từ khóa hoặc bộ lọc đã chọn. Hãy thử xóa bớt tiêu chí lọc.
              </p>
              <button
                onClick={() => {
                  setCat('Tất cả');
                  setSelectedBrand('Tất cả');
                  setSearch('');
                  setPriceRange('ALL');
                }}
                className="px-4 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 transition cursor-pointer"
              >
                Xóa bộ lọc để xem tất cả
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {paginatedParts.map(p => {
                const price = p.giaKhuyenMai ?? p.giaGoc;
                const hasDiscount = p.giaKhuyenMai !== null;
                const discountPct = hasDiscount
                  ? Math.round(((p.giaGoc - p.giaKhuyenMai!) / p.giaGoc) * 100)
                  : 0;
                const isAdded = added.has(p.id);

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs hover:shadow-md hover:border-zinc-300 transition duration-200 flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Top image section */}
                    <div
                      onClick={() => {
                        setSelectedPart(p);
                        setDetailQty(1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="relative aspect-square bg-zinc-100/70 p-4 flex items-center justify-center cursor-pointer overflow-hidden"
                    >
                      <img
                        src={p.hinhAnh}
                        alt={p.tenSanPham}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                      />
                      {hasDiscount && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-xs uppercase">
                          -{discountPct}%
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-2xs text-[10px] font-bold text-zinc-700 px-2 py-0.5 rounded-md border border-zinc-200">
                        {p.danhMuc}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-zinc-500 uppercase">{p.thuongHieu}</span>
                          <StarRow rating={p.rating} count={p.luotDanh} />
                        </div>

                        <h3
                          onClick={() => {
                            setSelectedPart(p);
                            setDetailQty(1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-xs font-bold text-zinc-900 line-clamp-2 hover:text-red-700 transition cursor-pointer leading-snug"
                        >
                          {p.tenSanPham}
                        </h3>

                        {p.dongXePhuHop && (
                          <div className="text-[10px] text-blue-700 font-medium truncate">
                            🏍️ {p.dongXePhuHop}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-zinc-100">
                        {/* Price */}
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-extrabold text-red-700 font-mono tracking-tight">
                              {formatVND(price)}
                            </span>
                            {hasDiscount && (
                              <span className="text-[11px] text-zinc-400 line-through font-mono">
                                {formatVND(p.giaGoc)}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-mono font-semibold">
                            ✓ Còn {p.soLuongTon} sản phẩm có sẵn
                          </div>
                        </div>

                        {/* Action buttons (TC04 & TC03) */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPart(p);
                              setDetailQty(1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="py-2 px-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-semibold text-[11px] transition cursor-pointer text-center"
                          >
                            Chi tiết
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleAdd(p, 1, e)}
                            className={`py-2 px-2.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              isAdded
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-red-700 hover:bg-red-800 text-white shadow-xs shadow-red-700/20'
                            }`}
                          >
                            <span>{isAdded ? '✓' : '+'}</span>
                            <span>{isAdded ? 'Đã thêm' : 'Thêm giỏ'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TC12: Phân trang 20 sản phẩm/trang controls */}
            {totalPages > 1 && (
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200">
                <div className="text-xs text-zinc-500 font-mono">
                  Hiển thị từ {((currentPage - 1) * ITEMS_PER_PAGE) + 1} đến {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} trên tổng số {filtered.length} sản phẩm (10 sản phẩm/trang)
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* First */}
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(1);
                      document.getElementById('parts-listing-anchor')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      currentPage === 1 ? 'opacity-40 cursor-not-allowed bg-zinc-100 text-zinc-400' : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 cursor-pointer shadow-2xs'
                    }`}
                  >
                    « Đầu
                  </button>

                  {/* Prev */}
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(p => Math.max(1, p - 1));
                      document.getElementById('parts-listing-anchor')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      currentPage === 1 ? 'opacity-40 cursor-not-allowed bg-zinc-100 text-zinc-400' : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 cursor-pointer shadow-2xs'
                    }`}
                  >
                    ‹ Trước
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        document.getElementById('parts-listing-anchor')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-red-700 text-white shadow-md'
                          : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {/* Next */}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage(p => Math.min(totalPages, p + 1));
                      document.getElementById('parts-listing-anchor')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      currentPage === totalPages ? 'opacity-40 cursor-not-allowed bg-zinc-100 text-zinc-400' : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 cursor-pointer shadow-2xs'
                    }`}
                  >
                    Sau ›
                  </button>

                  {/* Last */}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage(totalPages);
                      document.getElementById('parts-listing-anchor')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      currentPage === totalPages ? 'opacity-40 cursor-not-allowed bg-zinc-100 text-zinc-400' : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 cursor-pointer shadow-2xs'
                    }`}
                  >
                    Cuối »
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* ĐG09: Lightbox modal for previewing enlarged review photos */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-pointer"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-4 right-4 bg-zinc-900/90 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm hover:bg-black cursor-pointer shadow-lg z-10"
            >
              ✕
            </button>
            <img src={previewZoomImage} alt="Xem ảnh phóng to" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl mx-auto border border-white/20" />
          </div>
        </div>
      )}
    </div>
  );
}
