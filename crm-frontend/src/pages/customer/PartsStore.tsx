import { useState, useMemo } from 'react';
import { mockParts, formatVND } from '../../data/mockData';
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
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'default' | 'priceAsc' | 'priceDesc' | 'rating'>('default');
  const [added, setAdded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = mockParts.filter(p => {
      const q = search.toLowerCase();
      return (cat === 'Tất cả' || p.danhMuc === cat) &&
        (!q || p.tenSanPham.toLowerCase().includes(q) || p.thuongHieu.toLowerCase().includes(q));
    });
    if (sort === 'priceAsc') list = [...list].sort((a, b) => (a.giaKhuyenMai ?? a.giaGoc) - (b.giaKhuyenMai ?? b.giaGoc));
    if (sort === 'priceDesc') list = [...list].sort((a, b) => (b.giaKhuyenMai ?? b.giaGoc) - (a.giaKhuyenMai ?? a.giaGoc));
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [cat, search, sort]);

  function handleAdd(p: typeof mockParts[0]) {
    add(p);
    setAdded(prev => new Set(prev).add(p.id));
    setTimeout(() => setAdded(prev => { const n = new Set(prev); n.delete(p.id); return n; }), 1200);
  }

  return (
    <div style={{ background: 'var(--color-zinc-50)', minHeight: '100vh' }}>
      {/* Hero banner */}
      <div className="py-10" style={{ background: 'linear-gradient(135deg, var(--color-zinc-950) 0%, var(--color-red-900) 60%, var(--color-zinc-950) 100%)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800, color: 'white', lineHeight: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            CỬA HÀNG PHỤ TÙNG
          </div>
          <div className="mt-2 text-sm" style={{ color: 'var(--color-zinc-400)' }}>Phụ tùng chính hãng · Giao hàng tận nơi · Bảo hành chính hãng</div>

          {/* Search bar */}
          <div className="relative mt-5 max-w-lg">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-zinc-400)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm phụ tùng, thương hiệu..."
              style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6">
        {/* Filters */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className="px-3 py-1.5 rounded-full text-xs font-600 transition-all"
                style={{
                  background: cat === c ? 'var(--color-red-700)' : 'white',
                  color: cat === c ? 'white' : 'var(--color-zinc-600)',
                  border: cat === c ? '1px solid var(--color-red-700)' : '1px solid var(--color-zinc-200)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>
                {c}
              </button>
            ))}
          </div>
          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-zinc-200)', background: 'white', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--color-zinc-700)', outline: 'none', cursor: 'pointer' }}>
            <option value="default">Mặc định</option>
            <option value="priceAsc">Giá tăng dần</option>
            <option value="priceDesc">Giá giảm dần</option>
            <option value="rating">Đánh giá cao</option>
          </select>
        </div>

        <div className="text-sm mb-4" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>
          {filtered.length} sản phẩm{cat !== 'Tất cả' ? ` · ${cat}` : ''}
        </div>

        {/* Product grid */}
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {filtered.map(p => {
            const price = p.giaKhuyenMai ?? p.giaGoc;
            const discounted = p.giaKhuyenMai !== null;
            const isAdded = added.has(p.id);
            return (
              <div key={p.id}
                className="rounded-2xl overflow-hidden flex flex-col group"
                style={{ background: 'white', border: '1px solid var(--color-zinc-200)', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'); (e.currentTarget.style.borderColor = 'var(--color-red-200)'); }}
                onMouseLeave={e => { (e.currentTarget.style.boxShadow = 'none'); (e.currentTarget.style.borderColor = 'var(--color-zinc-200)'); }}
              >
                {/* Image */}
                <div className="relative overflow-hidden" style={{ height: 160, background: 'var(--color-zinc-100)' }}>
                  <img src={p.hinhAnh} alt={p.tenSanPham}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  {discounted && (
                    <div className="absolute top-2 left-2 rounded-full text-white text-xs font-700 px-2 py-0.5"
                      style={{ background: 'var(--color-red-700)', fontFamily: 'var(--font-mono)' }}>
                      -{Math.round((1 - p.giaKhuyenMai! / p.giaGoc) * 100)}%
                    </div>
                  )}
                  {p.soLuongTon <= 5 && (
                    <div className="absolute top-2 right-2 rounded-full text-white text-xs font-600 px-2 py-0.5"
                      style={{ background: 'var(--color-warning)', fontFamily: 'var(--font-mono)' }}>
                      Còn {p.soLuongTon}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1 p-4">
                  <div className="text-xs font-600 mb-1" style={{ color: 'var(--color-zinc-400)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.thuongHieu}</div>
                  <div className="font-600 text-sm leading-snug mb-2" style={{ color: 'var(--color-zinc-900)' }}>{p.tenSanPham}</div>
                  <div className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--color-zinc-500)' }}>{p.moTa.slice(0, 65)}…</div>
                  <StarRow rating={p.rating} count={p.luotDanh} />

                  <div className="flex items-end justify-between mt-auto pt-3">
                    <div>
                      <div className="font-700" style={{ color: 'var(--color-red-700)', fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.02em' }}>
                        {formatVND(price)}
                      </div>
                      {discounted && <div className="text-xs line-through" style={{ color: 'var(--color-zinc-400)' }}>{formatVND(p.giaGoc)}</div>}
                    </div>
                    <button onClick={() => handleAdd(p)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-700 transition-all"
                      style={{
                        background: isAdded ? 'var(--color-success)' : 'var(--color-zinc-950)',
                        color: 'white', border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                      }}>
                      {isAdded
                        ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Đã thêm</>
                        : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Thêm</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <div className="font-600" style={{ color: 'var(--color-zinc-600)' }}>Không tìm thấy sản phẩm phù hợp</div>
            <button onClick={() => { setSearch(''); setCat('Tất cả'); }} className="mt-3 text-sm" style={{ color: 'var(--color-red-700)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Xóa bộ lọc</button>
          </div>
        )}
      </div>
    </div>
  );
}
