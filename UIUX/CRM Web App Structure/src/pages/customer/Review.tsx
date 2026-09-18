import { useState } from 'react';

const STAR_LABELS = ['', 'Rất không hài lòng', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng'];

export default function ReviewPage({ onBack }: { onBack: () => void }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [loai, setLoai] = useState<'DichVu' | 'SanPham' | 'BaoHanh'>('DichVu');
  const [noiDung, setNoiDung] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const active = hovered || rating;

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: 'var(--color-navy-50)' }}>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-2xl font-700 mb-2" style={{ color: 'var(--color-navy-900)' }}>Cảm ơn bạn!</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--color-navy-400)' }}>Phản hồi của bạn đã được ghi nhận. Chúng tôi sẽ tiếp tục cải thiện dịch vụ.</p>
          <button onClick={onBack}
            className="px-8 py-3 rounded-xl text-sm font-600 text-white"
            style={{ background: 'var(--color-brand-600)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            Quay về trang cá nhân
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-navy-50)' }}>
      <header style={{ background: 'var(--color-navy-900)' }}>
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-navy-300)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          </button>
          <div>
            <div className="text-sm font-700 text-white">Gửi đánh giá</div>
            <div className="text-xs" style={{ color: 'var(--color-navy-400)' }}>Đại lý Xe máy & Phụ tùng</div>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-8">
        {/* Rating */}
        <div className="rounded-2xl p-8 mb-5 text-center" style={{ background: 'white', border: '1px solid var(--color-navy-100)' }}>
          <h2 className="text-lg font-700 mb-2" style={{ color: 'var(--color-navy-900)' }}>Bạn hài lòng đến đâu?</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-navy-400)' }}>Nhấn vào ngôi sao để chấm điểm</p>

          <div className="flex justify-center gap-3 mb-4">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.1s', transform: active >= s ? 'scale(1.15)' : 'scale(1)' }}
              >
                <svg width="44" height="44" viewBox="0 0 24 24"
                  fill={active >= s ? 'var(--color-amber-400)' : 'none'}
                  stroke={active >= s ? 'var(--color-amber-400)' : 'var(--color-navy-200)'}
                  strokeWidth="1.5" style={{ filter: active >= s ? 'drop-shadow(0 2px 6px rgba(251,191,36,0.4))' : 'none', transition: 'all 0.15s' }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            ))}
          </div>

          {active > 0 && (
            <div className="text-sm font-600" style={{ color: active >= 4 ? 'var(--color-success-500)' : active === 3 ? '#d97706' : 'var(--color-danger-500)', minHeight: 20 }}>
              {STAR_LABELS[active]}
            </div>
          )}
        </div>

        {/* Type selector */}
        <div className="rounded-xl p-5 mb-5" style={{ background: 'white', border: '1px solid var(--color-navy-100)' }}>
          <div className="text-sm font-600 mb-3" style={{ color: 'var(--color-navy-700)' }}>Loại đánh giá</div>
          <div className="flex gap-2">
            {([['DichVu', 'Dịch vụ'], ['SanPham', 'Sản phẩm'], ['BaoHanh', 'Bảo hành']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setLoai(val)}
                className="flex-1 py-2 rounded-lg text-sm font-600 transition-colors"
                style={{
                  border: loai === val ? '2px solid var(--color-brand-600)' : '2px solid var(--color-navy-100)',
                  background: loai === val ? 'var(--color-brand-50)' : 'white',
                  color: loai === val ? 'var(--color-brand-600)' : 'var(--color-navy-600)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl p-5 mb-6" style={{ background: 'white', border: '1px solid var(--color-navy-100)' }}>
          <label className="block text-sm font-600 mb-2" style={{ color: 'var(--color-navy-700)' }}>Chia sẻ chi tiết</label>
          <textarea
            rows={5}
            value={noiDung}
            onChange={e => setNoiDung(e.target.value)}
            placeholder="Mô tả trải nghiệm của bạn — điều gì tốt, điều gì cần cải thiện..."
            className="w-full rounded-lg text-sm"
            style={{ padding: '10px 14px', border: '1.5px solid var(--color-navy-100)', fontFamily: 'var(--font-sans)', color: 'var(--color-navy-900)', resize: 'none', outline: 'none', lineHeight: 1.6 }}
          />
          <div className="text-right text-xs mt-1" style={{ color: 'var(--color-navy-400)', fontFamily: 'var(--font-mono)' }}>{noiDung.length}/500</div>
        </div>

        <button
          onClick={() => rating > 0 && setSubmitted(true)}
          disabled={rating === 0}
          className="w-full py-3.5 rounded-xl text-sm font-700 text-white transition-all"
          style={{
            background: rating > 0 ? 'var(--color-brand-600)' : 'var(--color-navy-200)',
            border: 'none', cursor: rating > 0 ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-sans)', letterSpacing: '0.02em',
          }}>
          {rating === 0 ? 'Vui lòng chọn số sao trước' : `Gửi đánh giá ${rating} sao`}
        </button>
      </div>
    </div>
  );
}
