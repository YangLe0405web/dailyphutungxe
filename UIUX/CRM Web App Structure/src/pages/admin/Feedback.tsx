import { useState } from 'react';
import { mockFeedbacks, type Feedback } from '../../data/mockData';

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
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(mockFeedbacks);
  const [filter, setFilter] = useState<'All' | 'DanhGia' | 'KhieuNai'>('All');

  const filtered = filter === 'All' ? feedbacks : feedbacks.filter(f => f.loaiNhan === filter);

  function resolve(id: string) {
    setFeedbacks(fs => fs.map(f => f.id === id ? { ...f, trangThai: 'DaXuLy' } : f));
  }

  const pending = feedbacks.filter(f => f.trangThai === 'ChoXuLy').length;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>PHẢN HỒI & KHIẾU NẠI</div>
        <p className="text-sm mt-1" style={{ color: 'var(--color-zinc-500)' }}>{pending > 0 ? `${pending} khiếu nại chưa xử lý` : 'Tất cả đã được xử lý'}</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {[{ key: 'All', label: 'Tất cả' }, { key: 'DanhGia', label: '⭐ Đánh giá' }, { key: 'KhieuNai', label: '⚠️ Khiếu nại' }].map(opt => (
          <button key={opt.key} onClick={() => setFilter(opt.key as typeof filter)}
            className="px-4 py-2 rounded-xl text-sm font-600 transition-all"
            style={{
              background: filter === opt.key ? 'var(--color-zinc-950)' : 'white',
              color: filter === opt.key ? 'white' : 'var(--color-zinc-600)',
              border: filter === opt.key ? '1px solid var(--color-zinc-950)' : '1px solid var(--color-zinc-200)',
              cursor: 'pointer',
            }}>{opt.label}</button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map(f => (
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

            <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-zinc-100)' }}>
              <div className="text-xs" style={{ color: 'var(--color-zinc-400)', fontFamily: 'var(--font-mono)' }}>
                Loại: {f.loaiDanhGia === 'DichVu' ? 'Dịch vụ' : f.loaiDanhGia === 'SanPham' ? 'Sản phẩm' : 'Bảo hành'}
              </div>
              {f.trangThai === 'ChoXuLy' && (
                <button onClick={() => resolve(f.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600 transition-colors"
                  style={{ background: '#dcfce7', color: '#16a34a', border: 'none', cursor: 'pointer' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Đánh dấu đã xử lý
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
