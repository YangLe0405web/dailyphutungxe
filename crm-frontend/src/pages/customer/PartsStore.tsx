import { useState, useMemo } from 'react';
import { mockParts, formatVND, Part } from '../../data/mockData';
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

  function handleAdd(p: Part, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    add(p);
    setAdded(prev => new Set(prev).add(p.id));
    setTimeout(() => setAdded(prev => { const n = new Set(prev); n.delete(p.id); return n; }), 1200);
  }

  return (
    <div style={{ background: 'var(--color-zinc-50)', minHeight: '100vh' }}>
      {/* Hero banner */}
      <div className="py-10" style={{ background: 'linear-gradient(135deg, var(--color-zinc-950) 0%, var(--color-red-900) 60%, var(--color-zinc-950) 100%)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: 'white', lineHeight: 1.1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            CỬA HÀNG PHỤ TÙNG & PHỤ KIỆN
          </div>
          <div className="mt-2 text-sm text-zinc-300">
            100% Phụ tùng chính hãng · Honda, Motul, Brembo, Michelin, NGK, Bando, D.I.D · Bảo hành tận tâm
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
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: selectedBrand === b ? 'var(--color-zinc-950)' : 'white',
                  color: selectedBrand === b ? 'white' : 'var(--color-zinc-700)',
                  border: selectedBrand === b ? '1px solid var(--color-zinc-950)' : '1px solid var(--color-zinc-200)',
                  cursor: 'pointer',
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
                className="px-3 py-1.5 rounded-full text-xs font-600 transition-all"
                style={{
                  background: cat === c ? 'var(--color-red-700)' : 'white',
                  color: cat === c ? 'white' : 'var(--color-zinc-600)',
                  border: cat === c ? '1px solid var(--color-red-700)' : '1px solid var(--color-zinc-200)',
                  cursor: 'pointer',
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

            return (
              <div
                key={p.id}
                onClick={() => setViewingPart(p)}
                className="rounded-2xl overflow-hidden flex flex-col group cursor-pointer"
                style={{
                  background: 'white',
                  border: '1px solid var(--color-zinc-200)',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = 'var(--color-red-300)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--color-zinc-200)';
                  e.currentTarget.style.transform = 'translateY(0)';
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
                      className="text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 uppercase tracking-wider"
                      style={{ fontFamily: 'var(--font-mono)' }}
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

                  <StarRow rating={p.rating} count={p.luotDanh} />

                  {/* Price & Add to Cart button */}
                  <div className="flex items-end justify-between mt-auto pt-4 border-t border-zinc-100">
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
                      className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-sm"
                      style={{
                        background: isAdded ? '#10b981' : 'var(--color-zinc-950)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
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
              className="mt-4 px-4 py-2 bg-red-700 text-white text-xs font-bold rounded-xl hover:bg-red-800 transition"
            >
              Đặt lại tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* QUICK VIEW / DETAIL MODAL */}
      {viewingPart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setViewingPart(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-zinc-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Product Image */}
              <div className="relative bg-zinc-100 h-64 md:h-full min-h-[280px]">
                <img
                  src={viewingPart.hinhAnh}
                  alt={viewingPart.tenSanPham}
                  className="w-full h-full object-cover"
                />
                {viewingPart.giaKhuyenMai && (
                  <div className="absolute top-4 left-4 bg-red-700 text-white font-bold text-xs px-2.5 py-1 rounded-md shadow">
                    GIẢM {Math.round((1 - viewingPart.giaKhuyenMai / viewingPart.giaGoc) * 100)}%
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                    {viewingPart.thuongHieu}
                  </span>
                  <button
                    onClick={() => setViewingPart(null)}
                    className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 font-bold transition"
                  >
                    ✕
                  </button>
                </div>

                <h2 className="text-lg font-bold text-zinc-900 leading-snug mb-2">
                  {viewingPart.tenSanPham}
                </h2>

                <div className="mb-3">
                  <StarRow rating={viewingPart.rating} count={viewingPart.luotDanh} />
                </div>

                <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 mb-4 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Danh mục:</span>
                    <span className="font-semibold text-zinc-800">{viewingPart.danhMuc}</span>
                  </div>
                  {viewingPart.xuatXu && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Xuất xứ:</span>
                      <span className="font-semibold text-zinc-800">{viewingPart.xuatXu}</span>
                    </div>
                  )}
                  {viewingPart.dongXePhuHop && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Tương thích:</span>
                      <span className="font-semibold text-blue-700 text-right">{viewingPart.dongXePhuHop}</span>
                    </div>
                  )}
                  {viewingPart.baoHanh && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Bảo hành:</span>
                      <span className="font-semibold text-emerald-700">{viewingPart.baoHanh}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Tồn kho sẵn có:</span>
                    <span className="font-bold text-zinc-900">{viewingPart.soLuongTon} sản phẩm</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed mb-6">
                  {viewingPart.moTa}
                </p>

                <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-zinc-400 font-medium">Giá bán niêm yết:</div>
                    <div className="text-2xl font-bold text-red-700" style={{ fontFamily: 'var(--font-display)' }}>
                      {formatVND(viewingPart.giaKhuyenMai ?? viewingPart.giaGoc)}
                    </div>
                    {viewingPart.giaKhuyenMai && (
                      <div className="text-xs line-through text-zinc-400">
                        {formatVND(viewingPart.giaGoc)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      handleAdd(viewingPart);
                      setViewingPart(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-red-700/20"
                  >
                    + Thêm vào giỏ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
