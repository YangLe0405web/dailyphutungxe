import { useState } from 'react';
import { mockCustomers, mockVehicles, mockOrders, mockAppointments, formatVND, type OrderStatus, type AppointmentStatus } from '../../data/mockData';
import { RatingStars } from '../../components/shared/StatusTag';

const customer = mockCustomers[0];
const vehicle = mockVehicles.find(v => v.customerId === customer.id)!;
const myOrders = mockOrders.filter(o => o.customerId === customer.id);
const myAppts = mockAppointments.filter(a => a.customerId === customer.id);

const orderStatusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  ChoDuyet: { label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
  DangGiao: { label: 'Đang giao', color: '#2563eb', bg: '#dbeafe' },
  HoanThanh: { label: 'Hoàn thành', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  DaHuy: { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
};

const apptStatusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  ChoDuyet: { label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
  DaXacNhan: { label: 'Đã xác nhận', color: '#2563eb', bg: '#dbeafe' },
  DangThucHien: { label: 'Đang thực hiện', color: 'var(--color-red-700)', bg: 'var(--color-red-100)' },
  HoanThanh: { label: 'Hoàn thành', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  DaHuy: { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
};

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full text-xs font-600 px-2.5 py-1"
      style={{ background: bg, color, fontFamily: 'var(--font-mono)' }}>
      <span className="rounded-full" style={{ width: 6, height: 6, background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

const SVC_LABELS: Record<string, string> = { BaoDuong: 'Bảo dưỡng', SuaChua: 'Sửa chữa', LaiThu: 'Lái thử xe' };

/* ── Survey ── */
const surveyQuestions = [
  { id: 'q1', text: 'Bạn hài lòng với dịch vụ sau bán hàng của đại lý?', opts: ['Rất hài lòng', 'Hài lòng', 'Bình thường', 'Không hài lòng'] },
  { id: 'q2', text: 'Bạn có muốn trải nghiệm mẫu xe Honda SH 160i 2025?', opts: ['Có, rất muốn', 'Có thể', 'Chưa cần thiết'] },
  { id: 'q3', text: 'Tính năng nào bạn mong muốn nhất ở xe mới?', opts: ['Tiết kiệm xăng', 'Thiết kế đẹp', 'Công nghệ AI/kết nối', 'Giá phải chăng'] },
];

function SurveyTab() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🎉</div>
        <div className="text-xl font-700 mb-2" style={{ color: 'var(--color-zinc-900)' }}>Cảm ơn bạn đã phản hồi!</div>
        <div className="text-sm" style={{ color: 'var(--color-zinc-500)' }}>Ý kiến của bạn đã được ghi nhận và sẽ giúp chúng tôi cải thiện dịch vụ.</div>
      </div>
    );
  }

  const active = hovered || rating;
  const starLabels = ['', 'Rất không hài lòng', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng'];

  return (
    <div className="flex flex-col gap-6">
      {/* Survey */}
      <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-5 rounded-full" style={{ background: 'var(--color-red-700)' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-zinc-900)' }}>KHẢO SÁT TRẢI NGHIỆM</div>
        </div>
        <div className="flex flex-col gap-5">
          {surveyQuestions.map((q, qi) => (
            <div key={q.id}>
              <div className="text-sm font-600 mb-3" style={{ color: 'var(--color-zinc-900)' }}>
                <span style={{ color: 'var(--color-red-700)', marginRight: 6 }}>{qi + 1}.</span>{q.text}
              </div>
              <div className="flex flex-wrap gap-2">
                {q.opts.map(opt => {
                  const sel = answers[q.id] === opt;
                  return (
                    <button key={opt} type="button" onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                      className="rounded-lg px-3.5 py-2 text-sm font-500 transition-all"
                      style={{
                        border: sel ? '1.5px solid var(--color-red-700)' : '1.5px solid var(--color-zinc-200)',
                        background: sel ? 'var(--color-red-700)' : 'white',
                        color: sel ? 'white' : 'var(--color-zinc-700)',
                        cursor: 'pointer',
                      }}>{opt}</button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Star rating feedback */}
      <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-5 rounded-full" style={{ background: 'var(--color-red-700)' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-zinc-900)' }}>GỬI ĐÁNH GIÁ / KHIẾU NẠI</div>
        </div>

        <div className="flex justify-center gap-3 mb-3">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} type="button" onClick={() => setRating(s)}
              onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', transform: active >= s ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.1s' }}>
              <svg width="40" height="40" viewBox="0 0 24 24"
                fill={active >= s ? '#f59e0b' : 'none'}
                stroke={active >= s ? '#f59e0b' : 'var(--color-zinc-200)'}
                strokeWidth="1.5"
                style={{ filter: active >= s ? 'drop-shadow(0 2px 6px rgba(245,158,11,0.4))' : 'none', transition: 'all 0.15s' }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          ))}
        </div>
        {active > 0 && (
          <div className="text-center text-sm font-600 mb-4"
            style={{ color: active >= 4 ? 'var(--color-success)' : active === 3 ? '#d97706' : 'var(--color-red-700)' }}>
            {starLabels[active]}
          </div>
        )}

        <textarea rows={4} value={review} onChange={e => setReview(e.target.value)}
          placeholder="Chia sẻ trải nghiệm, góp ý hoặc khiếu nại của bạn..."
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--color-zinc-200)', fontSize: 14, fontFamily: 'var(--font-sans)', resize: 'none', outline: 'none', color: 'var(--color-zinc-900)' }} />

        <button
          onClick={() => rating > 0 && setSubmitted(true)}
          disabled={rating === 0}
          className="w-full mt-4 py-3 rounded-xl font-700 text-white transition-all"
          style={{
            background: rating > 0 ? 'var(--color-red-700)' : 'var(--color-zinc-300)',
            border: 'none', cursor: rating > 0 ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
          {rating === 0 ? 'Chọn số sao trước' : 'GỬI PHẢN HỒI'}
        </button>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const [tab, setTab] = useState<0 | 1 | 2>(0);

  const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  const warrantyDays = daysUntil(vehicle.hanBaoHanh);

  const tabs = [
    { label: 'Đơn mua hàng', icon: '📦' },
    { label: 'Lịch hẹn', icon: '📅' },
    { label: 'Khảo sát & Đánh giá', icon: '⭐' },
  ];

  return (
    <div style={{ background: 'var(--color-zinc-50)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="py-8 px-6" style={{ background: 'linear-gradient(135deg, var(--color-zinc-950) 0%, #3b0606 60%, var(--color-zinc-950) 100%)' }}>
        <div className="max-w-5xl mx-auto flex items-center gap-5">
          <div className="flex items-center justify-center rounded-full text-2xl font-800"
            style={{ width: 60, height: 60, background: 'var(--color-red-700)', color: 'white', fontFamily: 'var(--font-display)' }}>
            {customer.hoTen[0]}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {customer.hoTen}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-zinc-400)' }}>{customer.email} · {customer.soDienThoai}</div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Vehicle + Warranty card */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
          <div className="p-6" style={{ background: 'linear-gradient(135deg, var(--color-zinc-950) 0%, #1a0505 100%)' }}>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs font-600 mb-2" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  🏍️ XE ĐANG SỞ HỮU
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: '0.04em' }}>
                  {vehicle.tenXe}
                </div>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--color-zinc-400)', letterSpacing: '0.1em' }}>{vehicle.bienSo}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-zinc-500)' }}>{vehicle.mauSac} · {vehicle.namSanXuat}</span>
                </div>
              </div>
              {/* Digital warranty card */}
              <div className="rounded-xl p-4 min-w-48" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                <div className="text-xs font-600 mb-2" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  🔐 BẢO HÀNH ĐIỆN TỬ
                </div>
                <div className="font-700 text-sm mb-1" style={{ color: warrantyDays > 0 ? '#4ade80' : 'var(--color-red-400)' }}>
                  {vehicle.trangThaiBaoHanh === 'ConHan' ? '✓ Còn hiệu lực' : '✕ Đã hết hạn'}
                </div>
                <div className="text-xs" style={{ color: 'var(--color-zinc-400)', fontFamily: 'var(--font-mono)' }}>HSD: {vehicle.hanBaoHanh}</div>
                {warrantyDays > 0 && (
                  <div className="mt-1 text-xs font-600" style={{ color: warrantyDays < 90 ? '#fbbf24' : '#4ade80' }}>
                    còn {warrantyDays} ngày
                  </div>
                )}
                <div className="mt-2 text-xs" style={{ color: 'var(--color-zinc-600)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                  {vehicle.soKhung}
                </div>
              </div>
            </div>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'var(--color-zinc-200)' }}>
            {[
              { label: 'Đơn hàng', value: myOrders.length, color: 'var(--color-zinc-900)' },
              { label: 'Lịch hẹn', value: myAppts.length, color: 'var(--color-zinc-900)' },
              { label: 'Chi tiêu', value: formatVND(customer.tongChiTieu), color: 'var(--color-red-700)' },
            ].map((s, i) => (
              <div key={i} className="px-5 py-4 text-center">
                <div className="text-xl font-700" style={{ color: s.color, fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'var(--color-zinc-200)' }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i as 0 | 1 | 2)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-600 transition-all"
              style={{
                background: tab === i ? 'white' : 'transparent',
                color: tab === i ? 'var(--color-zinc-900)' : 'var(--color-zinc-500)',
                border: 'none', cursor: 'pointer',
                boxShadow: tab === i ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}>
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 0 && (
          <div className="flex flex-col gap-4">
            {myOrders.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">Chưa có đơn hàng nào</div>
            ) : myOrders.map(order => {
              const cfg = orderStatusConfig[order.trangThai];
              return (
                <div key={order.id} className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
                  <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-zinc-100)' }}>
                    <div>
                      <div className="font-600 text-sm" style={{ color: 'var(--color-zinc-900)' }}>Đơn hàng #{order.id}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>{order.ngayDat}</div>
                    </div>
                    <StatusBadge {...cfg} />
                  </div>
                  <div className="px-5 py-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-1.5" style={{ borderBottom: i < order.items.length - 1 ? '1px solid var(--color-zinc-100)' : 'none' }}>
                        <span style={{ color: 'var(--color-zinc-700)' }}>{item.tenSanPham} <span style={{ color: 'var(--color-zinc-400)', fontFamily: 'var(--font-mono)' }}>×{item.soLuong}</span></span>
                        <span className="font-600" style={{ color: 'var(--color-zinc-900)' }}>{formatVND(item.donGia * item.soLuong)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'var(--color-zinc-100)', background: 'var(--color-zinc-50)' }}>
                    <div className="text-xs" style={{ color: 'var(--color-zinc-500)' }}>📍 {order.diaChiGiao}</div>
                    <div className="font-700" style={{ color: 'var(--color-red-700)', fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.02em' }}>{formatVND(order.tongTien)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 1 && (
          <div className="flex flex-col gap-4">
            {myAppts.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">Chưa có lịch hẹn nào</div>
            ) : myAppts.map(appt => {
              const cfg = apptStatusConfig[appt.trangThai];
              return (
                <div key={appt.id} className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-700" style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {SVC_LABELS[appt.loaiDichVu]}
                        </span>
                        <StatusBadge {...cfg} />
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-zinc-600)' }}>
                        📅 {appt.ngayHen} lúc {appt.gioHen}
                      </div>
                      {appt.tenXe && <div className="text-sm mt-1" style={{ color: 'var(--color-zinc-500)' }}>🏍️ {appt.tenXe} · {appt.bienSo}</div>}
                      {appt.ghiChu && (
                        <div className="mt-2 text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--color-zinc-50)', color: 'var(--color-zinc-600)', border: '1px solid var(--color-zinc-200)' }}>
                          💬 "{appt.ghiChu}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 2 && <SurveyTab />}
      </div>
    </div>
  );
}
