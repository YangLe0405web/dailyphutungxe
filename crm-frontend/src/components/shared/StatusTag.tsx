import type { CustomerStatus } from '../../data/mockData';

export function StatusTag({ status }: { status: CustomerStatus }) {
  const active = status === 'HoatDong';
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full text-xs font-600 px-2.5 py-1"
      style={{ background: active ? '#dcfce7' : '#fee2e2', color: active ? '#16a34a' : 'var(--color-red-700)', fontFamily: 'var(--font-mono)' }}>
      <span className="rounded-full" style={{ width: 5, height: 5, background: 'currentColor', display: 'inline-block' }} />
      {active ? 'Hoạt động' : 'Bị khóa'}
    </span>
  );
}

export function WarrantyTag({ status }: { status: 'ConHan' | 'HetHan' | 'ChuaCo' | 'KhongApDung' }) {
  if (status === 'KhongApDung') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full text-xs font-600 px-2.5 py-1"
        style={{ background: '#f4f4f5', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
        <span className="rounded-full" style={{ width: 5, height: 5, background: 'currentColor', display: 'inline-block' }} />
        ⚪ Không áp dụng
      </span>
    );
  }
  if (status === 'ChuaCo') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full text-xs font-600 px-2.5 py-1"
        style={{ background: '#fef3c7', color: '#b45309', fontFamily: 'var(--font-mono)' }}>
        <span className="rounded-full" style={{ width: 5, height: 5, background: 'currentColor', display: 'inline-block' }} />
        ⚠️ Chưa kích hoạt
      </span>
    );
  }
  const valid = status === 'ConHan';
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full text-xs font-600 px-2.5 py-1"
      style={{ background: valid ? '#dcfce7' : '#fee2e2', color: valid ? '#16a34a' : 'var(--color-red-700)', fontFamily: 'var(--font-mono)' }}>
      {valid ? '✓ Còn hạn' : '✕ Hết hạn'}
    </span>
  );
}

export function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24"
          fill={s <= rating ? '#f59e0b' : 'none'}
          stroke={s <= rating ? '#f59e0b' : 'var(--color-zinc-300)'}
          strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}
