import React, { useState, useEffect } from 'react';
import { formatVND } from '../../data/mockData';

type ServiceType = 'BaoDuong' | 'SuaChua' | 'LaiThu';

const services = [
  { key: 'BaoDuong', label: 'Bảo dưỡng định kỳ', icon: '🔧', desc: 'Thay nhớt, lọc gió, kiểm tra tổng thể', time: '60–90 phút' },
  { key: 'SuaChua', label: 'Sửa chữa', icon: '⚙️', desc: 'Sửa hư hỏng, thay thế phụ tùng', time: '2–4 giờ' },
  { key: 'LaiThu', label: 'Lái thử xe mới', icon: '🏍️', desc: 'Trải nghiệm mẫu xe 2025 mới nhất', time: '30 phút' },
] as const;

const demoVehicles = [
  { id: 'XM001', tenXe: 'Honda SH 160i ABS', hang: 'Honda', phanKhuc: 'Tay ga', gia: 95900000, moTa: 'Flagship tay ga cao cấp 2025', icon: '🛵' },
  { id: 'XM002', tenXe: 'Honda PCX 160 ABS', hang: 'Honda', phanKhuc: 'Tay ga', gia: 75900000, moTa: 'Tay ga thể thao tiết kiệm nhiên liệu', icon: '🛵' },
  { id: 'XM003', tenXe: 'Yamaha Exciter 155 VVA', hang: 'Yamaha', phanKhuc: 'Côn tay', gia: 56990000, moTa: 'Côn tay thể thao VVA mạnh mẽ', icon: '🏍️' },
  { id: 'XM004', tenXe: 'Honda Air Blade 160 ABS', hang: 'Honda', phanKhuc: 'Tay ga', gia: 56690000, moTa: 'Tay ga thể thao thon gọn', icon: '🛵' },
  { id: 'XM005', tenXe: 'Yamaha Grande Hybrid', hang: 'Yamaha', phanKhuc: 'Tay ga', gia: 58990000, moTa: 'Hybrid Smart Motor Generator', icon: '🛵' },
];

const timeSlots = ['08:00', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

interface ServiceBookingProps {
  initialVehicleId?: string;
}

export default function ServiceBooking({ initialVehicleId }: ServiceBookingProps) {
  const [svc, setSvc] = useState<ServiceType>(initialVehicleId ? 'LaiThu' : 'BaoDuong');
  const [selectedCar, setSelectedCar] = useState<string>(initialVehicleId || 'XM001');

  useEffect(() => {
    if (initialVehicleId) {
      setSvc('LaiThu');
      setSelectedCar(initialVehicleId);
    }
  }, [initialVehicleId]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [form, setForm] = useState({ hoTen: 'Nguyễn Văn An', soDienThoai: '0901234567', tenXe: 'Honda Wave Alpha 110cc', bienSo: '51K-12345', ghiChu: '' });
  const [submitted, setSubmitted] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: 'var(--color-zinc-50)' }}>
        <div className="rounded-3xl p-10 text-center max-w-sm w-full" style={{ background: 'white', border: '1px solid var(--color-zinc-200)', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-center rounded-full mb-5 mx-auto"
            style={{ width: 72, height: 72, background: 'var(--color-red-50)', border: '3px solid var(--color-red-700)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-red-700)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            ĐẶT LỊCH THÀNH CÔNG!
          </div>
          <div className="mt-3 mb-6 text-sm leading-relaxed" style={{ color: 'var(--color-zinc-500)' }}>
            Chúng tôi đã nhận lịch hẹn của bạn.<br />
            Kỹ thuật viên sẽ xác nhận qua SĐT trong vòng 30 phút.
          </div>
          <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--color-zinc-50)', border: '1px solid var(--color-zinc-200)' }}>
            <div className="flex items-center gap-2 text-sm mb-2">
              <span className="font-600" style={{ color: 'var(--color-zinc-700)' }}>Dịch vụ:</span>
              <span style={{ color: 'var(--color-zinc-900)' }}>{services.find(s => s.key === svc)?.label}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-600" style={{ color: 'var(--color-zinc-700)' }}>Thời gian:</span>
              <span style={{ color: 'var(--color-red-700)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{date} lúc {time}</span>
            </div>
          </div>
          <button onClick={() => setSubmitted(false)}
            className="w-full py-3 rounded-xl font-700 text-white"
            style={{ background: 'var(--color-zinc-950)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ĐẶT LỊCH KHÁC
          </button>
        </div>
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
      {/* Hero */}
      <div className="py-10" style={{ background: 'linear-gradient(135deg, var(--color-zinc-950) 0%, #3b0606 60%, var(--color-zinc-950) 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: 'white', lineHeight: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            ĐẶT LỊCH DỊCH VỤ
          </div>
          <div className="mt-2 text-sm" style={{ color: 'var(--color-zinc-400)' }}>Kỹ thuật viên chuyên nghiệp · Thiết bị hiện đại · Phụ tùng chính hãng</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 sm:px-8 py-8 flex flex-col gap-6">
        {/* Step 1: Service type */}
        <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center rounded-full text-xs font-700"
              style={{ width: 24, height: 24, background: 'var(--color-red-700)', color: 'white', fontFamily: 'var(--font-mono)' }}>1</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-zinc-900)' }}>CHỌN DỊCH VỤ</div>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--color-zinc-500)', marginLeft: 32 }}>Chọn loại dịch vụ bạn cần</p>
          <div className="grid grid-cols-3 gap-3">
            {services.map(s => {
              const active = svc === s.key;
              return (
                <button key={s.key} type="button" onClick={() => setSvc(s.key as ServiceType)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all text-center"
                  style={{
                    border: active ? '2px solid var(--color-red-700)' : '2px solid var(--color-zinc-200)',
                    background: active ? 'var(--color-red-50)' : 'var(--color-zinc-50)',
                    cursor: 'pointer',
                  }}>
                  <span className="text-3xl">{s.icon}</span>
                  <div className="font-700 text-sm" style={{ color: active ? 'var(--color-red-800)' : 'var(--color-zinc-800)' }}>{s.label}</div>
                  <div className="text-xs" style={{ color: 'var(--color-zinc-500)' }}>{s.desc}</div>
                  <div className="text-xs font-600 rounded-full px-2 py-0.5"
                    style={{ background: active ? 'var(--color-red-100)' : 'var(--color-zinc-200)', color: active ? 'var(--color-red-800)' : 'var(--color-zinc-600)', fontFamily: 'var(--font-mono)' }}>
                    ⏱ {s.time}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Choose test drive vehicle (only if service is LaiThu) */}
        {svc === 'LaiThu' && (
          <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center justify-center rounded-full text-xs font-700" style={{ width: 24, height: 24, background: 'var(--color-red-700)', color: 'white', fontFamily: 'var(--font-mono)' }}>2</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-zinc-900)' }}>CHỌN XE LÁI THỬ</div>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--color-zinc-500)', marginLeft: 32 }}>Chọn mẫu xe bạn muốn trải nghiệm</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {demoVehicles.map(v => {
                const active = selectedCar === v.id;
                return (
                  <button key={v.id} type="button" onClick={() => setSelectedCar(v.id)}
                    className="flex flex-col p-4 text-left rounded-xl transition-all"
                    style={{
                      border: active ? '2px solid var(--color-red-700)' : '2px solid var(--color-zinc-200)',
                      background: active ? 'var(--color-red-50)' : 'var(--color-zinc-50)',
                      cursor: 'pointer',
                    }}>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl" style={{ fontFamily: 'var(--font-mono)' }}>{v.icon}</span>
                      {active && <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-xs" style={{ fontFamily: 'var(--font-mono)' }}>✓</span>}
                    </div>
                    <div className="font-700 mt-2" style={{ color: 'var(--color-zinc-900)' }}>{v.tenXe}</div>
                    <div className="text-sm" style={{ color: 'var(--color-zinc-600)' }}>{v.hang} • {v.phanKhuc}</div>
                    <div className="text-sm font-600 mt-1" style={{ color: 'var(--color-red-700)', fontFamily: 'var(--font-mono)' }}>{formatVND(v.gia)}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--color-zinc-500)' }}>{v.moTa}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Date + Time */}
        <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center rounded-full text-xs font-700"
              style={{ width: 24, height: 24, background: 'var(--color-red-700)', color: 'white', fontFamily: 'var(--font-mono)' }}>2</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-zinc-900)' }}>CHỌN NGÀY & GIỜ</div>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--color-zinc-500)', marginLeft: 32 }}>Chúng tôi phục vụ từ 08:00 – 17:00, Thứ 2 – Thứ 7</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Ngày hẹn *</label>
              <input type="date" required min={today}
                value={date} onChange={e => setDate(e.target.value)}
                style={{ ...inputSt, borderColor: !date ? 'var(--color-zinc-200)' : 'var(--color-red-400)' }} />
            </div>
            <div>
              <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Chọn khung giờ *</label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map(t => (
                  <button key={t} type="button" onClick={() => setTime(t)}
                    className="py-2 rounded-lg text-sm font-600 transition-all"
                    style={{
                      border: time === t ? '1.5px solid var(--color-red-700)' : '1.5px solid var(--color-zinc-200)',
                      background: time === t ? 'var(--color-red-700)' : 'white',
                      color: time === t ? 'white' : 'var(--color-zinc-700)',
                      cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12,
                    }}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          {date && time && (
            <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
              style={{ background: 'var(--color-red-50)', border: '1px solid var(--color-red-200)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-red-700)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ color: 'var(--color-red-800)', fontWeight: 600 }}>
                Đã chọn: {date} lúc {time} · {services.find(s => s.key === svc)?.label}
              </span>
            </div>
          )}
        </div>

        {/* Step 3: Vehicle + Contact */}
        <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center rounded-full text-xs font-700"
              style={{ width: 24, height: 24, background: 'var(--color-red-700)', color: 'white', fontFamily: 'var(--font-mono)' }}>3</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-zinc-900)' }}>THÔNG TIN XE & LIÊN HỆ</div>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--color-zinc-500)', marginLeft: 32 }}>Điền thông tin xe và kỹ thuật viên có thể chuẩn bị tốt hơn</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Họ tên *</label>
              <input required value={form.hoTen} onChange={e => setForm(f => ({...f, hoTen: e.target.value}))} style={inputSt} />
            </div>
            <div>
              <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Số điện thoại *</label>
              <input required value={form.soDienThoai} onChange={e => setForm(f => ({...f, soDienThoai: e.target.value}))} style={inputSt} />
            </div>
            <div>
              <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Tên xe</label>
              <input value={form.tenXe} onChange={e => setForm(f => ({...f, tenXe: e.target.value}))} placeholder="Honda Wave Alpha 110cc" style={inputSt} />
            </div>
            <div>
              <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Biển số xe</label>
              <input value={form.bienSo} onChange={e => setForm(f => ({...f, bienSo: e.target.value}))} placeholder="51K-12345" style={{ ...inputSt, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Mô tả tình trạng xe / Ghi chú</label>
              <textarea rows={3} value={form.ghiChu} onChange={e => setForm(f => ({...f, ghiChu: e.target.value}))}
                placeholder="VD: Xe kêu khi tăng ga, phanh trước kém... Hoặc bạn muốn thử mẫu xe nào?"
                style={{ ...inputSt, resize: 'none' }} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={!date || !time}
          className="w-full py-4 rounded-xl font-800 text-white transition-all"
          style={{
            background: date && time ? 'var(--color-red-700)' : 'var(--color-zinc-300)',
            border: 'none', cursor: date && time ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
          XÁC NHẬN ĐẶT LỊCH →
        </button>
      </form>
    </div>
  );
}
