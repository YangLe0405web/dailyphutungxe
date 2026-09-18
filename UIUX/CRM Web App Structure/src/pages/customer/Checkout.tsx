import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { formatVND } from '../../data/mockData';

export default function Checkout({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const { items, total, clear } = useCart();
  const [form, setForm] = useState({ hoTen: 'Nguyễn Văn An', soDienThoai: '0901234567', diaChi: '12 Lý Thường Kiệt, Q.1, TP.HCM', ghiChu: '' });
  const [pay, setPay] = useState<'cod' | 'transfer'>('cod');
  const [done, setDone] = useState(false);

  const ship = 30000;
  const grand = total + ship;

  function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    setDone(true);
    clear();
    setTimeout(onSuccess, 3000);
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: 'var(--color-zinc-50)' }}>
        <div className="text-center max-w-sm">
          <div className="flex items-center justify-center rounded-full mb-6 mx-auto"
            style={{ width: 80, height: 80, background: 'var(--color-success-bg)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>ĐẶT HÀNG THÀNH CÔNG!</div>
          <p className="text-sm mt-3 mb-8" style={{ color: 'var(--color-zinc-500)' }}>Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ liên hệ xác nhận trong 30 phút.</p>
          <div className="text-sm animate-pulse" style={{ color: 'var(--color-zinc-400)' }}>Đang chuyển hướng…</div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-4xl mb-4">🛒</div>
        <div className="font-600 mb-4">Giỏ hàng trống</div>
        <button onClick={onBack} className="px-6 py-2.5 rounded-lg text-sm font-600 text-white"
          style={{ background: 'var(--color-red-700)', border: 'none', cursor: 'pointer' }}>← Quay lại cửa hàng</button>
      </div>
    );
  }

  const inputSt: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid var(--color-zinc-200)', fontSize: 14,
    fontFamily: 'var(--font-sans)', color: 'var(--color-zinc-900)',
    background: 'white', outline: 'none',
  };

  return (
    <div style={{ background: 'var(--color-zinc-50)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ background: 'var(--color-zinc-950)', borderColor: 'var(--color-zinc-800)' }}>
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-zinc-400)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            THANH TOÁN
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid gap-6" style={{ gridTemplateColumns: 'minmax(0,1fr) 360px' }}>
        {/* Left: form */}
        <form onSubmit={handleOrder} className="flex flex-col gap-5">
          {/* Delivery info */}
          <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full" style={{ background: 'var(--color-red-700)' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', color: 'var(--color-zinc-900)', textTransform: 'uppercase' }}>THÔNG TIN GIAO HÀNG</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Họ và tên *</label>
                <input required value={form.hoTen} onChange={e => setForm(f => ({...f, hoTen: e.target.value}))} style={inputSt} />
              </div>
              <div>
                <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Số điện thoại *</label>
                <input required value={form.soDienThoai} onChange={e => setForm(f => ({...f, soDienThoai: e.target.value}))} style={inputSt} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Địa chỉ giao hàng *</label>
                <input required value={form.diaChi} onChange={e => setForm(f => ({...f, diaChi: e.target.value}))} style={inputSt} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Ghi chú (tùy chọn)</label>
                <textarea rows={2} value={form.ghiChu} onChange={e => setForm(f => ({...f, ghiChu: e.target.value}))}
                  placeholder="Ghi chú đặc biệt cho đơn hàng..."
                  style={{ ...inputSt, resize: 'none' }} />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full" style={{ background: 'var(--color-red-700)' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', color: 'var(--color-zinc-900)', textTransform: 'uppercase' }}>PHƯƠNG THỨC THANH TOÁN</div>
            </div>
            {[
              { key: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: '💵', desc: 'Trả tiền mặt khi nhận hàng' },
              { key: 'transfer', label: 'Chuyển khoản ngân hàng', icon: '🏦', desc: 'VPBank / Vietcombank · Nội dung: DH + SĐT' },
            ].map(opt => (
              <div key={opt.key} onClick={() => setPay(opt.key as typeof pay)}
                className="flex items-start gap-4 rounded-xl p-4 mb-3 cursor-pointer transition-all"
                style={{
                  border: pay === opt.key ? '2px solid var(--color-red-700)' : '2px solid var(--color-zinc-200)',
                  background: pay === opt.key ? 'var(--color-red-50)' : 'var(--color-zinc-50)',
                }}>
                <div className="text-2xl">{opt.icon}</div>
                <div>
                  <div className="font-600 text-sm" style={{ color: 'var(--color-zinc-900)' }}>{opt.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-zinc-500)' }}>{opt.desc}</div>
                </div>
                <div className="ml-auto flex items-center justify-center rounded-full border-2 shrink-0 mt-0.5"
                  style={{ width: 20, height: 20, borderColor: pay === opt.key ? 'var(--color-red-700)' : 'var(--color-zinc-300)', background: pay === opt.key ? 'var(--color-red-700)' : 'white' }}>
                  {pay === opt.key && <div className="rounded-full bg-white" style={{ width: 6, height: 6 }} />}
                </div>
              </div>
            ))}
          </div>

          <button type="submit"
            className="w-full py-4 rounded-xl font-800 text-white"
            style={{ background: 'var(--color-red-700)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            XÁC NHẬN ĐẶT HÀNG
          </button>
        </form>

        {/* Right: order summary */}
        <div className="rounded-2xl p-6 h-fit sticky top-24" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', color: 'var(--color-zinc-900)', textTransform: 'uppercase', marginBottom: 16 }}>ĐƠN HÀNG</div>
          <div className="flex flex-col gap-3 mb-4">
            {items.map(item => {
              const price = item.part.giaKhuyenMai ?? item.part.giaGoc;
              return (
                <div key={item.part.id} className="flex items-center gap-3">
                  <img src={item.part.hinhAnh} alt={item.part.tenSanPham} className="rounded-lg object-cover shrink-0"
                    style={{ width: 48, height: 48, background: 'var(--color-zinc-100)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-500 truncate" style={{ color: 'var(--color-zinc-900)' }}>{item.part.tenSanPham}</div>
                    <div className="text-xs" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>x{item.soLuong}</div>
                  </div>
                  <div className="font-600 text-sm shrink-0" style={{ color: 'var(--color-zinc-900)' }}>{formatVND(price * item.soLuong)}</div>
                </div>
              );
            })}
          </div>
          <div className="border-t pt-4 flex flex-col gap-2" style={{ borderColor: 'var(--color-zinc-200)' }}>
            <div className="flex justify-between text-sm" style={{ color: 'var(--color-zinc-600)' }}>
              <span>Tạm tính</span><span>{formatVND(total)}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: 'var(--color-zinc-600)' }}>
              <span>Phí giao hàng</span><span>{formatVND(ship)}</span>
            </div>
            <div className="flex justify-between font-700 text-lg pt-2 border-t" style={{ borderColor: 'var(--color-zinc-200)', color: 'var(--color-zinc-900)' }}>
              <span>Tổng</span>
              <span style={{ color: 'var(--color-red-700)', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>{formatVND(grand)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
