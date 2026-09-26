import { useState, useMemo } from 'react';
import { mockParts, formatVND, Part, mockProductReviews, ProductReview } from '../../data/mockData';
import { useCart } from '../../contexts/CartContext';

const categories = ['Tất cả', 'Nhớt', 'Lọc', 'Phanh', 'Bugi', 'Đèn', 'Lốp xe', 'Phụ kiện', 'Trang trí', 'Truyền động', 'Thân máy'];

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(s => (
          <svg key={s} width="11" height="11" viewBox="0 0 24 24"
            fill={s <= Math.round(rating) ? '#f59e0b' : 'none'}
            stroke={s <= Math.round(rating) ? '#f59e0b' : 'var(--color-zinc-300)'}
            strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        ))}
      </div>
      <span style={{ fontSize: 11, color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>({count})</span>
    </div>
  );
}

export default function PartsStore() {
  const { add } = useCart();
  const [cat, setCat] = useState('Tất cả');
  const [selectedBrand, setSelectedBrand] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'default' | 'priceAsc' | 'priceDesc' | 'rating'>('default');
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [viewingPart, setViewingPart] = useState<Part | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'reviews'>('details');

  // Local reviews state
  const [allReviews, setAllReviews] = useState<ProductReview[]>([...mockProductReviews]);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewPhone, setNewReviewPhone] = useState('');
  const [newReviewStars, setNewReviewStars] = useState(5);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Extract all unique brands dynamically
  const brands = useMemo(() => {
    const list = Array.from(new Set(mockParts.map(p => p.thuongHieu))).sort();
    return ['Tất cả', ...list];
  }, []);

  const filtered = useMemo(() => {
    let list = mockParts.filter(p => {
      const q = search.toLowerCase();
      const matchCat = cat === 'Tất cả' || p.danhMuc === cat;
      const matchBrand = selectedBrand === 'Tất cả' || p.thuongHieu === selectedBrand;
      const matchSearch = !q || 
        p.tenSanPham.toLowerCase().includes(q) || 
        p.thuongHieu.toLowerCase().includes(q) ||
        (p.dongXePhuHop && p.dongXePhuHop.toLowerCase().includes(q));
      return matchCat && matchBrand && matchSearch;
    });
    if (sort === 'priceAsc') list = [...list].sort((a, b) => (a.giaKhuyenMai ?? a.giaGoc) - (b.giaKhuyenMai ?? b.giaGoc));
    if (sort === 'priceDesc') list = [...list].sort((a, b) => (b.giaKhuyenMai ?? b.giaGoc) - (a.giaKhuyenMai ?? a.giaGoc));
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [cat, selectedBrand, search, sort]);

  const currentPartReviews = viewingPart
    ? allReviews.filter(r => r.targetId === viewingPart.id)
    : [];

  function handleAdd(p: Part, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    add(p);
    setAdded(prev => new Set(prev).add(p.id));
    setTimeout(() => setAdded(prev => { const n = new Set(prev); n.delete(p.id); return n; }), 1200);
  }

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingPart || !newReviewAuthor.trim() || !newReviewContent.trim()) return;

    const newRev: ProductReview = {
      id: 'RV-PART-' + Date.now(),
      targetId: viewingPart.id,
      tenKhachHang: newReviewAuthor.trim(),
      soDienThoai: newReviewPhone ? newReviewPhone.slice(0, 4) + '***' + newReviewPhone.slice(-3) : '091***' + Math.floor(100 + Math.random() * 900),
      soSao: newReviewStars,
      ngayDanhGia: new Date().toISOString().split('T')[0],
      noiDung: newReviewContent.trim(),
      daMua: true,
      dongXeDaMua: viewingPart.dongXePhuHop ? viewingPart.dongXePhuHop.split(',')[0] : 'Xe máy',
    };

    setAllReviews(prev => [newRev, ...prev]);
    setNewReviewAuthor('');
    setNewReviewPhone('');
    setNewReviewContent('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  return (
    <div style={{ background: 'var(--color-zinc-50)', minHeight: '100vh' }}>
      {/* Hero banner */}
      <div className="py-10" style={{ background: 'linear-gradient(135deg, var(--color-zinc-950) 0%, var(--color-red-900) 60%, var(--color-zinc-950) 100%)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: 'white', lineHeight: 1.1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            CỬA HÀNG PHỤ TÙNG & PHỤ KIỆN
          </div>
          <div className="mt-2 text-sm text-zinc-300">
            100% Phụ tùng chính hãng · Honda, Motul, Brembo, Michelin, NGK, Bando, D.I.D · Đánh giá thực từ người mua
          </div>

          {/* Search bar */}
          <div className="relative mt-5 max-w-xl">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-zinc-400)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên phụ tùng, thương hiệu, hoặc dòng xe (vd: SH, Exciter, Motul)..."
              style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6">
        {/* Brand filter chips */}
        <div className="mb-4">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
            HÃNG SẢN XUẤT / THƯƠNG HIỆU:
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {brands.map(b => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                style={{
                  background: selectedBrand === b ? 'var(--color-zinc-950)' : 'white',
                  color: selectedBrand === b ? 'white' : 'var(--color-zinc-700)',
                  border: selectedBrand === b ? '1px solid var(--color-zinc-950)' : '1px solid var(--color-zinc-200)',
                  boxShadow: selectedBrand === b ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                }}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Category filters & Sort */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6 pt-3 border-t border-zinc-200">
          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className="px-3 py-1.5 rounded-full text-xs font-600 transition-all cursor-pointer"
                style={{
                  background: cat === c ? 'var(--color-red-700)' : 'white',
                  color: cat === c ? 'white' : 'var(--color-zinc-600)',
                  border: cat === c ? '1px solid var(--color-red-700)' : '1px solid var(--color-zinc-200)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value as typeof sort)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--color-zinc-200)',
              background: 'white',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-zinc-700)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="default">Sắp xếp: Mặc định</option>
            <option value="priceAsc">Giá tăng dần</option>
            <option value="priceDesc">Giá giảm dần</option>
            <option value="rating">Đánh giá cao nhất</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-sm mb-4" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>
          <div>
            Hiển thị <strong>{filtered.length}</strong> sản phẩm
            {cat !== 'Tất cả' ? ` · Danh mục: ${cat}` : ''}
            {selectedBrand !== 'Tất cả' ? ` · Hãng: ${selectedBrand}` : ''}
          </div>
          {(cat !== 'Tất cả' || selectedBrand !== 'Tất cả' || search) && (
            <button
              onClick={() => { setCat('Tất cả'); setSelectedBrand('Tất cả'); setSearch(''); }}
              className="text-xs text-red-700 font-bold hover:underline cursor-pointer"
            >
              ✕ Xóa tất cả bộ lọc
            </button>
          )}
        </div>

        {/* Product grid */}
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {filtered.map(p => {
            const price = p.giaKhuyenMai ?? p.giaGoc;
            const discounted = p.giaKhuyenMai !== null;
            const isAdded = added.has(p.id);
            const pReviews = allReviews.filter(r => r.targetId === p.id);

            return (
              <div
                key={p.id}
                onClick={() => {
                  setViewingPart(p);
                  setModalTab('details');
                }}
                className="rounded-2xl overflow-hidden flex flex-col group cursor-pointer hover:-translate-y-1 transition-all"
                style={{
                  background: 'white',
                  border: '1px solid var(--color-zinc-200)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* Image container */}
                <div className="relative overflow-hidden" style={{ height: 180, background: 'var(--color-zinc-100)' }}>
                  <img
                    src={p.hinhAnh}
                    alt={p.tenSanPham}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Promo discount badge */}
                  {discounted && (
                    <div
                      className="absolute top-2 left-2 rounded-md text-white text-xs font-bold px-2 py-0.5 shadow"
                      style={{ background: 'var(--color-red-700)', fontFamily: 'var(--font-mono)' }}
                    >
                      -{Math.round((1 - p.giaKhuyenMai! / p.giaGoc) * 100)}%
                    </div>
                  )}

                  {/* Origin badge */}
                  {p.xuatXu && (
                    <div
                      className="absolute bottom-2 left-2 rounded bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5"
                    >
                      Xuất xứ: {p.xuatXu}
                    </div>
                  )}

                  {/* Stock status badge */}
                  {p.soLuongTon <= 15 ? (
                    <div
                      className="absolute top-2 right-2 rounded-md text-white text-xs font-bold px-2 py-0.5 shadow"
                      style={{ background: '#d97706', fontFamily: 'var(--font-mono)' }}
                    >
                      Còn {p.soLuongTon}
                    </div>
                  ) : (
                    <div
                      className="absolute top-2 right-2 rounded-md bg-emerald-600/90 text-white text-[11px] font-semibold px-2 py-0.5"
                    >
                      Sẵn hàng
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="flex flex-col flex-1 p-4">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 uppercase tracking-wider font-mono"
                    >
                      {p.thuongHieu}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium">
                      {p.danhMuc}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm leading-snug text-zinc-900 group-hover:text-red-700 transition line-clamp-2 mb-1.5">
                    {p.tenSanPham}
                  </h3>

                  {p.dongXePhuHop && (
                    <p className="text-[11px] text-blue-700 font-medium line-clamp-1 mb-2 bg-blue-50 px-2 py-0.5 rounded">
                      Xe: {p.dongXePhuHop}
                    </p>
                  )}

                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-3">
                    {p.moTa}
                  </p>

                  <div className="flex items-center justify-between mb-2">
                    <StarRow rating={p.rating} count={p.luotDanh} />
                    <span className="text-[11px] text-zinc-400 font-mono">
                      💬 {pReviews.length || 2} ĐG
                    </span>
                  </div>

                  {/* Price & Add to Cart button */}
                  <div className="flex items-end justify-between mt-auto pt-3 border-t border-zinc-100">
                    <div>
                      <div
                        className="font-bold text-red-700"
                        style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.01em' }}
                      >
                        {formatVND(price)}
                      </div>
                      {discounted && (
                        <div className="text-xs line-through text-zinc-400 font-medium">
                          {formatVND(p.giaGoc)}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={e => handleAdd(p, e)}
                      className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer"
                      style={{
                        background: isAdded ? '#10b981' : 'var(--color-zinc-950)',
                        color: 'white',
                        border: 'none',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {isAdded ? (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Đã thêm
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          Thêm giỏ
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200 my-6 shadow-sm">
            <div className="text-5xl mb-4">🔍</div>
            <div className="font-bold text-zinc-800 text-lg">Không tìm thấy phụ tùng phù hợp</div>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              Hãy thử tìm kiếm với từ khóa khác hoặc xóa bớt tiêu chí lọc danh mục/thương hiệu.
            </p>
            <button
              onClick={() => { setSearch(''); setCat('Tất cả'); setSelectedBrand('Tất cả'); }}
              className="mt-4 px-4 py-2 bg-red-700 text-white text-xs font-bold rounded-xl hover:bg-red-800 transition cursor-pointer"
            >
              Đặt lại tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* QUICK VIEW / DETAIL & REVIEWS MODAL */}
      {viewingPart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setViewingPart(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 pb-3 border-b border-zinc-200 flex justify-between items-start">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 font-mono">
                  {viewingPart.thuongHieu} · {viewingPart.danhMuc}
                </span>
                <h2 className="text-lg font-extrabold text-zinc-900 leading-snug mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {viewingPart.tenSanPham}
                </h2>
              </div>
              <button
                onClick={() => setViewingPart(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 pt-3 flex gap-4 border-b border-zinc-200">
              <button
                onClick={() => setModalTab('details')}
                className={`pb-2.5 text-xs font-bold font-mono transition cursor-pointer ${
                  modalTab === 'details'
                    ? 'border-b-2 border-red-700 text-red-700'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                ⚙️ CHI TIẾT SẢN PHẨM
              </button>
              <button
                onClick={() => setModalTab('reviews')}
                className={`pb-2.5 text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'reviews'
                    ? 'border-b-2 border-red-700 text-red-700'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <span>💬 ĐÁNH GIÁ & BÌNH LUẬN</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-800 font-mono">
                  {currentPartReviews.length || 2}
                </span>
              </button>
            </div>

            {/* TAB 1: PRODUCT DETAILS */}
            {modalTab === 'details' && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Product Image */}
                <div className="relative bg-zinc-100 rounded-2xl overflow-hidden h-60 md:h-full min-h-[220px]">
                  <img
                    src={viewingPart.hinhAnh}
                    alt={viewingPart.tenSanPham}
                    className="w-full h-full object-cover"
                  />
                  {viewingPart.giaKhuyenMai && (
                    <div className="absolute top-3 left-3 bg-red-700 text-white font-bold text-xs px-2.5 py-1 rounded-md shadow font-mono">
                      GIẢM {Math.round((1 - viewingPart.giaKhuyenMai / viewingPart.giaGoc) * 100)}%
                    </div>
                  )}
                </div>

                {/* Specs Box */}
                <div className="flex flex-col justify-between space-y-4">
                  <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Thương hiệu:</span>
                      <strong className="text-zinc-900">{viewingPart.thuongHieu}</strong>
                    </div>
                    {viewingPart.xuatXu && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Xuất xứ:</span>
                        <strong className="text-zinc-900">{viewingPart.xuatXu}</strong>
                      </div>
                    )}
                    {viewingPart.dongXePhuHop && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Dòng xe phù hợp:</span>
                        <strong className="text-blue-700 text-right">{viewingPart.dongXePhuHop}</strong>
                      </div>
                    )}
                    {viewingPart.baoHanh && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Chính sách BH:</span>
                        <strong className="text-emerald-700">{viewingPart.baoHanh}</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Tình trạng tồn kho:</span>
                      <strong className="text-zinc-900">{viewingPart.soLuongTon} sản phẩm có sẵn</strong>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                    {viewingPart.moTa}
                  </p>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-zinc-400 font-mono">Giá bán niêm yết:</div>
                      <div className="text-2xl font-bold text-red-700" style={{ fontFamily: 'var(--font-display)' }}>
                        {formatVND(viewingPart.giaKhuyenMai ?? viewingPart.giaGoc)}
                      </div>
                      {viewingPart.giaKhuyenMai && (
                        <div className="text-xs line-through text-zinc-400 font-mono">
                          {formatVND(viewingPart.giaGoc)}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        handleAdd(viewingPart);
                        setViewingPart(null);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-red-700/20 cursor-pointer"
                    >
                      + Thêm vào giỏ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: REVIEWS & COMMENTS */}
            {modalTab === 'reviews' && (
              <div className="p-6 space-y-4">
                {/* Rating Overview */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-extrabold text-zinc-900 font-display">4.9</div>
                    <div>
                      <div className="flex text-amber-500 text-sm">★★★★★</div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        Dựa trên {currentPartReviews.length || 2} đánh giá từ khách hàng đã mua
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                    ✓ 100% Khuyên dùng phụ tùng này
                  </span>
                </div>

                {/* Reviews List */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {currentPartReviews.length === 0 ? (
                    <div className="p-4 text-center text-zinc-500 text-xs">
                      Chưa có đánh giá nào cho phụ tùng này. Hãy chia sẻ cảm nhận của bạn!
                    </div>
                  ) : (
                    currentPartReviews.map(r => (
                      <div key={r.id} className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-[10px]">
                              {r.tenKhachHang[0]}
                            </span>
                            <span className="font-bold text-zinc-900">{r.tenKhachHang}</span>
                            {r.soDienThoai && (
                              <span className="text-[10px] text-zinc-400 font-mono">({r.soDienThoai})</span>
                            )}
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold">
                              ✓ Đã mua hàng chính hãng
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">{r.ngayDanhGia}</span>
                        </div>

                        <div className="flex text-amber-500 text-xs">
                          {'★'.repeat(r.soSao)}{'☆'.repeat(5 - r.soSao)}
                        </div>

                        <p className="text-xs text-zinc-700 leading-relaxed">
                          {r.noiDung}
                        </p>

                        {r.phanHoiShowroom && (
                          <div className="mt-2 p-2 rounded-lg bg-zinc-50 border-l-2 border-red-600 text-[11px] text-zinc-600">
                            <span className="font-bold text-red-700 block">Phản hồi từ Showroom:</span>
                            {r.phanHoiShowroom}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Add Review Form */}
                <form onSubmit={handleAddReview} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                  <div className="text-xs font-bold text-zinc-800 uppercase tracking-wider font-mono">
                    ✍️ Viết nhận xét & đánh giá phụ tùng
                  </div>

                  {reviewSubmitted && (
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <span>✓</span> Cảm ơn bạn! Đánh giá đã được gửi và hiển thị thành công.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <input
                        type="text"
                        placeholder="Họ và tên của bạn *"
                        required
                        value={newReviewAuthor}
                        onChange={e => setNewReviewAuthor(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Số điện thoại của bạn"
                        value={newReviewPhone}
                        onChange={e => setNewReviewPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500">Mức độ hài lòng:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReviewStars(star)}
                          className="text-lg text-amber-500 hover:scale-110 transition cursor-pointer"
                        >
                          {star <= newReviewStars ? '★' : '☆'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Chia sẻ chất lượng sản phẩm, độ bền, cảm giác sử dụng sau khi lắp đặt..."
                    required
                    value={newReviewContent}
                    onChange={e => setNewReviewContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs focus:outline-none focus:border-red-600"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 transition cursor-pointer shadow"
                    >
                      Gửi đánh giá phụ tùng
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
