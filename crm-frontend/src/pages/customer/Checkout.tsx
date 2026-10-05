import { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { formatVND, mockCustomers, getCustomerTier, type Customer } from '../../data/mockData';
import { orderApi, customerApi } from '../../services/api';

interface CheckoutProps {
  onBack: () => void;
  onSuccess: () => void;
  currentCustomer?: Customer | null;
  onCustomerChange?: (c: Customer | null) => void;
}

export default function Checkout({ onBack, onSuccess, currentCustomer, onCustomerChange }: CheckoutProps) {
  const { items, total, clear, selectedItems, selectedTotal, selectedCount, remove } = useCart();
  const checkoutItems = selectedCount > 0 ? selectedItems : items;
  const checkoutTotal = selectedCount > 0 ? selectedTotal : total;
  
  // Auth state for non-logged in users
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginInput, setLoginInput] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authErr, setAuthErr] = useState<string | null>(null);
  const [registerForm, setRegisterForm] = useState({
    hoTen: '',
    email: '',
    soDienThoai: '',
    diaChi: '',
    matKhau: '',
  });

  const [form, setForm] = useState({
    hoTen: currentCustomer?.hoTen || '',
    soDienThoai: currentCustomer?.soDienThoai || '',
    diaChi: currentCustomer?.diaChi || '',
    ghiChu: '',
  });

  useEffect(() => {
    if (currentCustomer) {
      setForm(prev => ({
        ...prev,
        hoTen: currentCustomer.hoTen,
        soDienThoai: currentCustomer.soDienThoai,
        diaChi: currentCustomer.diaChi || prev.diaChi || 'TP. Hồ Chí Minh',
      }));
    } else {
      setForm({
        hoTen: '',
        soDienThoai: '',
        diaChi: '',
        ghiChu: '',
      });
    }
  }, [currentCustomer]);

  const [pay, setPay] = useState<'cod' | 'transfer'>('cod');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const ship = 30000;
  const grand = checkoutTotal + ship;

  // Handle inline login
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErr(null);
    const found = mockCustomers.find(
      c => c.email.toLowerCase() === loginInput.trim().toLowerCase() || c.soDienThoai === loginInput.trim()
    );
    if (found) {
      onCustomerChange?.(found);
    } else {
      setAuthErr('Không tìm thấy tài khoản với Email/SĐT này. Vui lòng thử đăng ký mới.');
    }
  };

  // Handle inline register
  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErr(null);
    if (!registerForm.hoTen.trim() || !registerForm.email.trim() || !registerForm.soDienThoai.trim()) {
      setAuthErr('Vui lòng điền đủ Họ tên, Email và Số điện thoại');
      return;
    }

    try {
      const res = await customerApi.create({
        hoTen: registerForm.hoTen.trim(),
        email: registerForm.email.trim(),
        soDienThoai: registerForm.soDienThoai.trim(),
        diaChi: registerForm.diaChi.trim() || 'TP. Hồ Chí Minh',
        tenDangNhap: registerForm.email.split('@')[0],
        matKhau: registerForm.matKhau || '123456',
      });
      if (res.customer) {
        onCustomerChange?.(res.customer);
      }
    } catch (err) {
      setAuthErr('Đăng ký không thành công, vui lòng thử lại.');
    }
  };

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCustomer) {
      alert('Vui lòng đăng nhập hoặc tạo tài khoản trước khi xác nhận đặt hàng!');
      return;
    }
    if (submitting) return;
    setSubmitting(true);

    try {
      await orderApi.create({
        customerId: currentCustomer.id,
        hoTenKH: form.hoTen.trim() || currentCustomer.hoTen,
        soDienThoai: form.soDienThoai.trim() || currentCustomer.soDienThoai,
        diaChiGiao: form.diaChi.trim() || currentCustomer.diaChi || 'TP.HCM',
        items: checkoutItems.map(it => {
          const numId = parseInt(it.part.id.replace(/\D/g, ''), 10) || 1;
          const unitPrice = it.part.giaKhuyenMai ?? it.part.giaGoc;
          return {
            maPhuTung: numId,
            tenSanPham: it.part.tenSanPham,
            soLuong: it.soLuong,
            donGia: unitPrice,
          };
        }),
        tongTien: grand,
        ghiChu: form.ghiChu,
      });
    } catch (err) {
      console.error('Lỗi khi tạo đơn hàng:', err);
    } finally {
      setSubmitting(false);
      setDone(true);
      if (selectedCount > 0) {
        checkoutItems.forEach(it => remove(it.part.id));
      } else {
        clear();
      }
      setTimeout(onSuccess, 3000);
    }
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

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-4xl mb-4">🛒</div>
        <div className="font-600 mb-4">Không có sản phẩm nào được chọn để thanh toán</div>
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

  const tier = currentCustomer ? getCustomerTier(currentCustomer.tongChiTieu) : null;

  return (
    <div style={{ background: 'var(--color-zinc-50)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-0 py-5 border-b" style={{ background: 'var(--color-zinc-950)', borderColor: 'var(--color-zinc-800)' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8 flex items-center gap-4">
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-zinc-400)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            THANH TOÁN ĐƠN HÀNG
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 grid gap-6" style={{ gridTemplateColumns: 'minmax(0,1fr) min(360px, 100%)' }}>
        {/* Left: form */}
        <div className="flex flex-col gap-5">
          {/* STEP 1: CUSTOMER AUTH STATUS */}
          <div className="rounded-2xl p-6 bg-white border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ background: 'var(--color-red-700)' }} />
                <h3 className="font-bold text-base text-zinc-900 uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                  1. TÀI KHOẢN KHÁCH HÀNG
                </h3>
              </div>
              {currentCustomer && (
                <button
                  type="button"
                  onClick={() => onCustomerChange?.(null)}
                  className="text-xs text-zinc-500 hover:text-red-700 underline font-mono"
                >
                  Đổi tài khoản
                </button>
              )}
            </div>

            {currentCustomer ? (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-600 text-white font-bold flex items-center justify-center text-lg">
                    {currentCustomer.hoTen[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <span>{currentCustomer.hoTen}</span>
                      {tier && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold"
                          style={{ background: tier.badgeBg, color: tier.badgeColor, border: `1px solid ${tier.badgeBorder}` }}>
                          {tier.shortLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono mt-0.5">
                      {currentCustomer.soDienThoai} · {currentCustomer.email}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-700 font-mono flex items-center gap-1">
                  ✓ Đã xác thực
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <span>Bạn <strong>chưa đăng nhập</strong>. Vui lòng đăng nhập hoặc tạo tài khoản để đặt hàng & bảo lưu quyền lợi bảo hành điện tử.</span>
                </div>

                <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('login'); setAuthErr(null); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${authTab === 'login' ? 'bg-white shadow text-zinc-900' : 'text-zinc-500'}`}
                  >
                    🔑 Đã có tài khoản (Đăng nhập)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('register'); setAuthErr(null); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${authTab === 'register' ? 'bg-white shadow text-zinc-900' : 'text-zinc-500'}`}
                  >
                    📝 Chưa có tài khoản (Đăng ký nhanh)
                  </button>
                </div>

                {authErr && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{authErr}</p>
                )}

                {authTab === 'login' ? (
                  <form onSubmit={handleInlineLogin} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Email hoặc SĐT *</label>
                        <input
                          type="text"
                          required
                          placeholder="VD: 0901234567 hoặc an@gmail.com"
                          value={loginInput}
                          onChange={e => setLoginInput(e.target.value)}
                          style={inputSt}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Mật khẩu *</label>
                        <input
                          type="password"
                          required
                          placeholder="Mật khẩu"
                          value={loginPass}
                          onChange={e => setLoginPass(e.target.value)}
                          style={inputSt}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs text-zinc-500">
                        Chọn tài khoản mẫu:
                        <button
                          type="button"
                          onClick={() => onCustomerChange?.(mockCustomers[0])}
                          className="text-red-700 font-bold ml-1.5 hover:underline"
                        >
                          Nguyễn Văn An
                        </button>
                      </div>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition"
                      >
                        ĐĂNG NHẬP →
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleInlineRegister} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Họ và tên *</label>
                        <input
                          type="text"
                          required
                          placeholder="Nguyễn Văn A"
                          value={registerForm.hoTen}
                          onChange={e => setRegisterForm(f => ({ ...f, hoTen: e.target.value }))}
                          style={inputSt}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Số điện thoại *</label>
                        <input
                          type="tel"
                          required
                          placeholder="0912345678"
                          value={registerForm.soDienThoai}
                          onChange={e => setRegisterForm(f => ({ ...f, soDienThoai: e.target.value }))}
                          style={inputSt}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Email *</label>
                        <input
                          type="email"
                          required
                          placeholder="khach@gmail.com"
                          value={registerForm.email}
                          onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                          style={inputSt}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Mật khẩu *</label>
                        <input
                          type="password"
                          required
                          placeholder="Tạo mật khẩu"
                          value={registerForm.matKhau}
                          onChange={e => setRegisterForm(f => ({ ...f, matKhau: e.target.value }))}
                          style={inputSt}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition shadow"
                      >
                        TẠO TÀI KHOẢN & TIẾP TỤC →
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: DELIVERY INFO */}
          <form onSubmit={handleOrder} className="flex flex-col gap-5">
            <div className="rounded-2xl p-6 bg-white border border-zinc-200">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-5 rounded-full" style={{ background: 'var(--color-red-700)' }} />
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', color: 'var(--color-zinc-900)', textTransform: 'uppercase' }}>
                  2. THÔNG TIN GIAO HÀNG
                </div>
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
                  <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Ghi chú đơn hàng (tùy chọn)</label>
                  <textarea rows={2} value={form.ghiChu} onChange={e => setForm(f => ({...f, ghiChu: e.target.value}))}
                    placeholder="Ghi chú đặc biệt cho đơn hàng hoặc giờ giao..."
                    style={{ ...inputSt, resize: 'none' }} />
                </div>
              </div>
            </div>

            {/* STEP 3: PAYMENT METHOD */}
            <div className="rounded-2xl p-6 bg-white border border-zinc-200">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-5 rounded-full" style={{ background: 'var(--color-red-700)' }} />
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', color: 'var(--color-zinc-900)', textTransform: 'uppercase' }}>
                  3. PHƯƠNG THỨC THANH TOÁN
                </div>
              </div>
              {[
                { key: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: '💵', desc: 'Trả tiền mặt cho shipper khi nhận phụ tùng' },
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

            <button
              type="submit"
              disabled={!currentCustomer || submitting}
              className="w-full py-4 rounded-xl font-800 text-white transition-all shadow-md"
              style={{
                background: currentCustomer ? 'var(--color-red-700)' : 'var(--color-zinc-400)',
                border: 'none',
                cursor: currentCustomer ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {submitting ? 'ĐANG TẠO ĐƠN HÀNG...' : currentCustomer ? 'XÁC NHẬN ĐẶT HÀNG →' : '🔒 VUI LÒNG ĐĂNG NHẬP ĐỂ ĐẶT HÀNG'}
            </button>
          </form>
        </div>

        {/* Right: order summary */}
        <div className="rounded-2xl p-6 h-fit sticky top-24 bg-white border border-zinc-200">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', color: 'var(--color-zinc-900)', textTransform: 'uppercase', marginBottom: 16 }}>ĐƠN HÀNG</div>
          <div className="flex flex-col gap-3 mb-4 max-h-[350px] overflow-y-auto pr-1">
            {checkoutItems.map(item => {
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
              <span>Tạm tính ({checkoutItems.length} sản phẩm)</span><span>{formatVND(checkoutTotal)}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: 'var(--color-zinc-600)' }}>
              <span>Phí giao hàng</span><span>{formatVND(ship)}</span>
            </div>
            <div className="flex justify-between font-700 text-lg pt-2 border-t" style={{ borderColor: 'var(--color-zinc-200)', color: 'var(--color-zinc-900)' }}>
              <span>Tổng thanh toán</span>
              <span style={{ color: 'var(--color-red-700)', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>{formatVND(grand)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
