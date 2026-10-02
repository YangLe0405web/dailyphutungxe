import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { mockCustomers, type Customer } from '../data/mockData';
import { customerApi } from '../services/api';
import { VIETNAM_LOCATIONS } from '../data/vietnamLocations';

type CustomerPage = 'store' | 'vehicles' | 'booking' | 'dashboard' | 'checkout';

interface Props {
  children: React.ReactNode;
  activePage: CustomerPage;
  onNavigate: (p: CustomerPage) => void;
  onHome: () => void;
  currentCustomer?: Customer | null;
  onCustomerChange?: (c: Customer | null) => void;
}

const navItems = [
  { key: 'vehicles', label: 'Xem xe mẫu', icon: <IcoBike /> },
  { key: 'store', label: 'Phụ tùng', icon: <IcoStore /> },
  { key: 'booking', label: 'Đặt lịch', icon: <IcoCalendar /> },
  { key: 'dashboard', label: 'Cá nhân', icon: <IcoUser /> },
] as const;

export default function CustomerLayout({ children, activePage, onNavigate, onHome, currentCustomer = null, onCustomerChange }: Props) {
  const { count, items, total, remove, updateQty } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-zinc-50)', fontFamily: 'var(--font-sans)' }}>
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40" style={{ background: 'var(--color-zinc-950)', borderBottom: '2px solid var(--color-red-700)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={onHome} className="flex items-center gap-3 shrink-0" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: 'var(--color-red-700)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17V7l2-2h5l4 6h1a2 2 0 0 1 0 4h-1"/></svg>
            </div>
            <div className="text-left">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'white', lineHeight: 1, letterSpacing: '0.04em' }}>MOTOSHOP</div>
              <div style={{ fontSize: 9, color: 'var(--color-red-500)', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>ĐẠI LÝ CHÍNH HÃNG</div>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const active = activePage === item.key;
              return (
                <button key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 transition-all"
                  style={{
                    background: active ? 'var(--color-red-700)' : 'transparent',
                    color: active ? 'white' : 'var(--color-zinc-400)',
                    border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget.style.color = 'white'); }}
                  onMouseLeave={e => { if (!active) (e.currentTarget.style.color = 'var(--color-zinc-400)'); }}
                >
                  {item.icon}<span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: account auth + cart + mobile menu */}
          <div className="flex items-center gap-2">
            {currentCustomer ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white">
                  {currentCustomer.avatar ? (
                    <img src={currentCustomer.avatar} alt={currentCustomer.hoTen} className="w-5 h-5 rounded-full object-cover shrink-0 border border-zinc-700" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                  <span className="font-bold max-w-[120px] truncate">{currentCustomer.hoTen}</span>
                </div>
                <button
                  onClick={() => onCustomerChange?.(null)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-600 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                  title="Đăng xuất"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setAuthMode('register'); setAuthOpen(true); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-700 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700 transition"
                >
                  Đăng ký
                </button>
                <button
                  onClick={() => { setAuthMode('login'); setAuthOpen(true); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-700 bg-red-700 text-white hover:bg-red-800 shadow transition"
                >
                  Đăng nhập
                </button>
              </div>
            )}

            {/* Cart button */}
            <button onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
              style={{ background: count > 0 ? 'var(--color-red-700)' : 'var(--color-zinc-800)', color: 'white', border: 'none', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span className="text-sm font-600 hidden sm:block">Giỏ hàng</span>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full text-xs font-700"
                  style={{ width: 20, height: 20, background: 'white', color: 'var(--color-red-700)', fontFamily: 'var(--font-mono)' }}>
                  {count}
                </span>
              )}
            </button>

            {/* Mobile menu */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden flex items-center justify-center rounded-lg p-2"
              style={{ background: 'var(--color-zinc-800)', color: 'white', border: 'none', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t" style={{ borderColor: 'var(--color-zinc-800)', background: 'var(--color-zinc-900)' }}>
            {navItems.map(item => (
              <button key={item.key} onClick={() => { onNavigate(item.key); setMobileOpen(false); }}
                className="flex items-center gap-3 w-full px-6 py-3 text-sm font-500 transition-colors"
                style={{ background: activePage === item.key ? 'var(--color-red-900)' : 'transparent', color: activePage === item.key ? 'white' : 'var(--color-zinc-400)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                {item.icon}{item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main>{children}</main>

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1" style={{ background: 'rgba(9,9,11,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setCartOpen(false)} />
          <div className="flex flex-col w-full max-w-md" style={{ background: 'white', boxShadow: '-8px 0 40px rgba(0,0,0,0.2)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--color-zinc-200)', background: 'var(--color-zinc-950)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '0.04em' }}>GIỎ HÀNG</div>
                <div className="text-xs" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>{count} sản phẩm</div>
              </div>
              <button onClick={() => setCartOpen(false)} style={{ background: 'var(--color-zinc-800)', border: 'none', color: 'var(--color-zinc-300)', cursor: 'pointer', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>×</button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-zinc-300)" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  <div className="text-center">
                    <div className="font-600" style={{ color: 'var(--color-zinc-700)' }}>Giỏ hàng trống</div>
                    <div className="text-sm mt-1" style={{ color: 'var(--color-zinc-400)' }}>Thêm sản phẩm từ cửa hàng</div>
                  </div>
                  <button onClick={() => { setCartOpen(false); onNavigate('store'); }}
                    className="px-5 py-2.5 rounded-lg text-sm font-600 text-white"
                    style={{ background: 'var(--color-red-700)', border: 'none', cursor: 'pointer' }}>
                    Đến cửa hàng
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {items.map(item => {
                    const price = item.part.giaKhuyenMai ?? item.part.giaGoc;
                    return (
                      <div key={item.part.id} className="flex gap-3 rounded-xl p-3" style={{ background: 'var(--color-zinc-50)', border: '1px solid var(--color-zinc-200)' }}>
                        <img src={item.part.hinhAnh} alt={item.part.tenSanPham}
                          className="rounded-lg object-cover shrink-0"
                          style={{ width: 64, height: 64, background: 'var(--color-zinc-200)' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-600 leading-snug" style={{ color: 'var(--color-zinc-900)' }}>{item.part.tenSanPham}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--color-zinc-500)' }}>{item.part.thuongHieu}</div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="font-700" style={{ color: 'var(--color-red-700)', fontSize: 14 }}>{fmt(price * item.soLuong)}</div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateQty(item.part.id, item.soLuong - 1)}
                                style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--color-zinc-200)', background: 'white', cursor: 'pointer', fontWeight: 700, color: 'var(--color-zinc-700)' }}>-</button>
                              <span className="text-sm font-600 w-6 text-center" style={{ fontFamily: 'var(--font-mono)' }}>{item.soLuong}</span>
                              <button onClick={() => updateQty(item.part.id, item.soLuong + 1)}
                                style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--color-zinc-200)', background: 'white', cursor: 'pointer', fontWeight: 700, color: 'var(--color-zinc-700)' }}>+</button>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => remove(item.part.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-zinc-400)', alignSelf: 'flex-start', padding: 4, fontSize: 16 }}>×</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t p-5" style={{ borderColor: 'var(--color-zinc-200)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-600" style={{ color: 'var(--color-zinc-700)' }}>Tổng cộng</span>
                  <span className="text-xl font-700" style={{ color: 'var(--color-red-700)', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>{fmt(total)}</span>
                </div>
                <button onClick={() => { setCartOpen(false); onNavigate('checkout'); }}
                  className="w-full py-3.5 rounded-xl text-base font-700 text-white"
                  style={{ background: 'var(--color-red-700)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                  THANH TOÁN →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {authOpen && (
        <CustomerAuthModal
          initialMode={authMode}
          onClose={() => setAuthOpen(false)}
          onSuccess={(c) => onCustomerChange?.(c)}
        />
      )}
    </div>
  );
}

function CustomerAuthModal({
  initialMode,
  onClose,
  onSuccess,
}: {
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
}) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);
  const [loginInput, setLoginInput] = useState('nguyenvanan@gmail.com');
  const [loginPass, setLoginPass] = useState('123456');
  const [loginErr, setLoginErr] = useState<string | null>(null);

  // Form đăng ký
  const [form, setForm] = useState({
    hoTen: '',
    email: '',
    soDienThoai: '',
    ngaySinh: '2000-01-01',
    gioiTinh: 'Nam',
    province: VIETNAM_LOCATIONS[0].name,
    district: VIETNAM_LOCATIONS[0].districts[0].name,
    ward: VIETNAM_LOCATIONS[0].districts[0].wards[0],
    streetAddress: '',
    matKhau: '',
    xacNhanMatKhau: '',
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [registerErr, setRegisterErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Bước đăng ký: 'form' hoặc 'otp' (ĐK05)
  const [regStep, setRegStep] = useState<'form' | 'otp'>('form');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [userOtp, setUserOtp] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState<number>(120);
  const [otpErr, setOtpErr] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Timer cho OTP
  useEffect(() => {
    let interval: any = null;
    if (regStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [regStep, otpTimer]);

  // Danh sách Quận/Huyện theo Tỉnh/TP đã chọn (ĐK03)
  const currentProvinceObj = VIETNAM_LOCATIONS.find(p => p.name === form.province) || VIETNAM_LOCATIONS[0];
  const availableDistricts = currentProvinceObj.districts;
  const currentDistrictObj = availableDistricts.find(d => d.name === form.district) || availableDistricts[0];
  const availableWards = currentDistrictObj ? currentDistrictObj.wards : [];

  const handleProvinceChange = (provinceName: string) => {
    const prov = VIETNAM_LOCATIONS.find(p => p.name === provinceName) || VIETNAM_LOCATIONS[0];
    const firstDist = prov.districts[0];
    setForm(prev => ({
      ...prev,
      province: provinceName,
      district: firstDist.name,
      ward: firstDist.wards[0] || '',
    }));
  };

  const handleDistrictChange = (districtName: string) => {
    const dist = availableDistricts.find(d => d.name === districtName) || availableDistricts[0];
    setForm(prev => ({
      ...prev,
      district: districtName,
      ward: dist ? (dist.wards[0] || '') : '',
    }));
  };

  // Kiểm tra quy chuẩn mật khẩu (ĐK06)
  const pass = form.matKhau;
  const passLengthValid = pass.length >= 8;
  const passUpperValid = /[A-Z]/.test(pass);
  const passLowerValid = /[a-z]/.test(pass);
  const passNumberValid = /[0-9]/.test(pass);
  const passSpecialValid = /[^A-Za-z0-9]/.test(pass);
  const passMatch = pass.length > 0 && pass === form.xacNhanMatKhau;
  const isPasswordValid = passLengthValid && passUpperValid && passLowerValid && passNumberValid && passSpecialValid && passMatch;

  // Kiểm tra định dạng số điện thoại (ĐK01)
  const isPhoneValid = /^0\d{9}$/.test(form.soDienThoai.trim());

  // Kiểm tra định dạng email
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr(null);
    const found = mockCustomers.find(c => c.email.toLowerCase() === loginInput.trim().toLowerCase() || c.soDienThoai === loginInput.trim());
    if (found) {
      onSuccess(found);
      onClose();
    } else {
      setLoginErr('Không tìm thấy tài khoản với Email/SĐT này. Vui lòng thử đăng ký mới.');
    }
  };

  // Bước 1: Chuyển sang xác thực OTP (ĐK05)
  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterErr(null);

    if (!form.hoTen.trim()) {
      setRegisterErr('Vui lòng nhập họ và tên!');
      return;
    }

    if (!isEmailValid) {
      setRegisterErr('Địa chỉ Email không đúng định dạng!');
      return;
    }

    // ĐK01
    if (!isPhoneValid) {
      setRegisterErr('Số điện thoại không hợp lệ! Phải gồm đúng 10 chữ số và bắt đầu bằng số 0.');
      return;
    }

    // ĐK04
    if (!form.ngaySinh) {
      setRegisterErr('Vui lòng chọn ngày sinh!');
      return;
    }

    // ĐK06
    if (!isPasswordValid) {
      setRegisterErr('Mật khẩu chưa đáp ứng đầy đủ yêu cầu bảo mật hoặc chưa trùng khớp!');
      return;
    }

    // Tạo mã OTP 6 chữ số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setUserOtp('');
    setOtpTimer(120);
    setOtpErr(null);
    setRegStep('otp');
  };

  // Gửi lại mã OTP
  const handleResendOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setUserOtp('');
    setOtpTimer(120);
    setOtpErr(null);
  };

  // Bước 2: Hoàn tất đăng ký sau khi xác thực OTP thành công
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpErr(null);

    if (userOtp.trim() !== generatedOtp) {
      setOtpErr('Mã OTP không chính xác. Vui lòng kiểm tra lại!');
      return;
    }

    if (otpTimer <= 0) {
      setOtpErr('Mã OTP đã hết hiệu lực. Vui lòng bấm gửi lại mã!');
      return;
    }

    setIsSubmitting(true);
    const fullAddress = `${form.streetAddress.trim() ? form.streetAddress.trim() + ', ' : ''}${form.ward}, ${form.district}, ${form.province}`;

    try {
      const res = await customerApi.create({
        hoTen: form.hoTen.trim(),
        email: form.email.trim(),
        soDienThoai: form.soDienThoai.trim(),
        diaChi: fullAddress,
        ngaySinh: `${form.ngaySinh}T00:00:00`,
        gioiTinh: form.gioiTinh,
        tenDangNhap: form.email.trim(),
        matKhau: form.matKhau,
      });

      setToast(`🎉 Chúc mừng ${res.customer.hoTen}! Tài khoản đã được tạo thành công.`);
      setTimeout(() => {
        onSuccess(res.customer);
        onClose();
      }, 1500);
    } catch (err: any) {
      // ĐK02: Bắt lỗi nếu trùng sđt / email
      setRegStep('form');
      setRegisterErr(err?.message || 'Đăng ký thất bại! Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-zinc-200 overflow-hidden">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-100 shrink-0">
          <h3 className="font-extrabold text-base text-zinc-900" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            {activeTab === 'login' ? 'ĐĂNG NHẬP KHÁCH HÀNG' : (regStep === 'otp' ? 'XÁC THỰC MÃ OTP' : 'ĐĂNG KÝ TÀI KHOẢN MỚI')}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 font-bold text-lg p-1">✕</button>
        </div>

        {toast ? (
          <div className="py-12 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <div className="text-base font-bold text-zinc-900">{toast}</div>
            <p className="text-xs text-zinc-500 mt-2">Hệ thống đang tự động đăng nhập cho bạn...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1">
            {/* Tabs */}
            <div className="flex gap-2 mb-4 p-1 bg-zinc-100 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setRegStep('form'); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'login' ? 'bg-white shadow text-zinc-900' : 'text-zinc-500'}`}
              >
                🔑 Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'register' ? 'bg-white shadow text-zinc-900' : 'text-zinc-500'}`}
              >
                📝 Đăng ký mới
              </button>
            </div>

            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Email hoặc Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: nguyenvanan@gmail.com hoặc 0901234567"
                    value={loginInput}
                    onChange={e => setLoginInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Mật khẩu *</label>
                  <input
                    type="password"
                    required
                    placeholder="Mật khẩu của bạn"
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                  />
                </div>

                {loginErr && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{loginErr}</p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow-md transition"
                  >
                    ĐĂNG NHẬP NGAY →
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Thử tài khoản mẫu có sẵn xe:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const demo = mockCustomers[0]; // Nguyễn Văn An
                      onSuccess(demo);
                      onClose();
                    }}
                    className="text-red-700 font-bold hover:underline"
                  >
                    Login Demo (Nguyễn Văn An)
                  </button>
                </div>
              </form>
            ) : (
              /* FORM ĐĂNG KÝ MỚI (ĐK01 -> ĐK06) */
              regStep === 'form' ? (
                <form onSubmit={handleProceedToOtp} className="space-y-3.5">
                  {registerErr && (
                    <div className="text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-300 flex items-start gap-2">
                      <span className="font-bold">⚠️</span>
                      <span>{registerErr}</span>
                    </div>
                  )}

                  {/* Họ và tên */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Họ và tên *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Văn Hoàng"
                      value={form.hoTen}
                      onChange={e => setForm({ ...form, hoTen: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                    />
                  </div>

                  {/* Email & Số điện thoại (ĐK01 & ĐK02) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="hoang@gmail.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none ${form.email && !isEmailValid ? 'border-red-500 focus:border-red-600' : 'border-zinc-300 focus:border-red-600'}`}
                      />
                      {form.email && !isEmailValid && (
                        <p className="text-[11px] text-red-600 mt-1">Email không đúng định dạng</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Số điện thoại *</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="0987654321"
                        value={form.soDienThoai}
                        onChange={e => setForm({ ...form, soDienThoai: e.target.value.replace(/\D/g, '') })}
                        className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none ${form.soDienThoai && !isPhoneValid ? 'border-red-500 focus:border-red-600' : 'border-zinc-300 focus:border-red-600'}`}
                      />
                      {form.soDienThoai && !isPhoneValid ? (
                        <p className="text-[11px] text-red-600 mt-1">SĐT phải đủ 10 số và bắt đầu bằng số 0</p>
                      ) : (
                        <p className="text-[10px] text-zinc-400 mt-1">Ví dụ: 0901234567 (10 số)</p>
                      )}
                    </div>
                  </div>

                  {/* Ngày sinh & Giới tính (ĐK04) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Ngày sinh *</label>
                      <input
                        type="date"
                        required
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
                        value={form.ngaySinh}
                        onChange={e => setForm({ ...form, ngaySinh: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Giới tính *</label>
                      <select
                        value={form.gioiTinh}
                        onChange={e => setForm({ ...form, gioiTinh: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>

                  {/* Địa chỉ phân cấp Tỉnh/TP - Quận/Huyện - Phường/Xã (ĐK03) */}
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2.5">
                    <label className="block text-xs font-bold text-zinc-800">Địa chỉ cư trú</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-zinc-500">Tỉnh / Thành phố *</span>
                        <select
                          value={form.province}
                          onChange={e => handleProvinceChange(e.target.value)}
                          className="w-full mt-1 p-2 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                        >
                          {VIETNAM_LOCATIONS.map(p => (
                            <option key={p.name} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-zinc-500">Quận / Huyện *</span>
                        <select
                          value={form.district}
                          onChange={e => handleDistrictChange(e.target.value)}
                          className="w-full mt-1 p-2 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                        >
                          {availableDistricts.map(d => (
                            <option key={d.name} value={d.name}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-zinc-500">Phường / Xã *</span>
                        <select
                          value={form.ward}
                          onChange={e => setForm({ ...form, ward: e.target.value })}
                          className="w-full mt-1 p-2 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                        >
                          {availableWards.map(w => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-zinc-500">Số nhà, tên đường</span>
                      <input
                        type="text"
                        placeholder="VD: 123 Lê Lợi"
                        value={form.streetAddress}
                        onChange={e => setForm({ ...form, streetAddress: e.target.value })}
                        className="w-full mt-1 p-2 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>

                  {/* Thiết lập mật khẩu mạnh (ĐK06) */}
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2.5">
                    <label className="block text-xs font-bold text-zinc-800">Thiết lập mật khẩu</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-zinc-500">Mật khẩu mới *</span>
                        <div className="relative mt-1">
                          <input
                            type={showPass ? 'text' : 'password'}
                            required
                            placeholder="Mật khẩu của bạn"
                            value={form.matKhau}
                            onChange={e => setForm({ ...form, matKhau: e.target.value })}
                            className="w-full p-2 pr-8 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600 text-xs"
                          >
                            {showPass ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-zinc-500">Xác nhận mật khẩu *</span>
                        <div className="relative mt-1">
                          <input
                            type={showConfirmPass ? 'text' : 'password'}
                            required
                            placeholder="Nhập lại mật khẩu"
                            value={form.xacNhanMatKhau}
                            onChange={e => setForm({ ...form, xacNhanMatKhau: e.target.value })}
                            className="w-full p-2 pr-8 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600 text-xs"
                          >
                            {showConfirmPass ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tiêu chí mật khẩu mạnh */}
                    <div className="text-[10px] space-y-1 bg-white p-2.5 rounded-lg border border-zinc-200">
                      <div className="font-semibold text-zinc-700 mb-1">Tiêu chuẩn mật khẩu an toàn:</div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                        <div className={passLengthValid ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                          {passLengthValid ? '✓' : '○'} Tối thiểu 8 ký tự
                        </div>
                        <div className={passUpperValid ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                          {passUpperValid ? '✓' : '○'} Có chữ hoa (A-Z)
                        </div>
                        <div className={passLowerValid ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                          {passLowerValid ? '✓' : '○'} Có chữ thường (a-z)
                        </div>
                        <div className={passNumberValid ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                          {passNumberValid ? '✓' : '○'} Có chữ số (0-9)
                        </div>
                        <div className={passSpecialValid ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                          {passSpecialValid ? '✓' : '○'} Có ký tự đặc biệt (!@#$)
                        </div>
                        <div className={passMatch ? 'text-green-600 font-medium' : 'text-zinc-400'}>
                          {passMatch ? '✓' : '○'} Mật khẩu trùng khớp
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={!isPasswordValid || !isPhoneValid || !isEmailValid}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition ${(!isPasswordValid || !isPhoneValid || !isEmailValid) ? 'bg-zinc-400 cursor-not-allowed opacity-70' : 'bg-red-700 hover:bg-red-800'}`}
                    >
                      Tiếp tục xác thực OTP →
                    </button>
                  </div>
                </form>
              ) : (
                /* BƯỚC XÁC MINH OTP (ĐK05) */
                <form onSubmit={handleFinalSubmit} className="space-y-4 py-2">
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <span>📲</span>
                      <span>Mô phỏng gửi mã OTP xác nhận</span>
                    </div>
                    <p className="text-zinc-600 text-[11px] leading-relaxed">
                      Hệ thống đã gửi mã OTP 6 số đến Email/SĐT: <strong>{form.soDienThoai}</strong> / <strong>{form.email}</strong>.
                    </p>
                    <div className="mt-2.5 p-2 bg-white rounded-lg border border-blue-200 flex items-center justify-between">
                      <span className="font-mono font-bold text-sm tracking-widest text-red-600">{generatedOtp}</span>
                      <button
                        type="button"
                        onClick={() => setUserOtp(generatedOtp)}
                        className="text-[11px] bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold px-2 py-1 rounded"
                      >
                        ⚡ Tự động điền OTP
                      </button>
                    </div>
                  </div>

                  {otpErr && (
                    <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-300">
                      {otpErr}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1.5 text-center">
                      Nhập mã OTP 6 chữ số:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="• • • • • •"
                      value={userOtp}
                      onChange={e => setUserOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-widest font-mono font-bold text-xl py-3 rounded-xl border-2 border-zinc-300 focus:border-red-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                    <span>
                      {otpTimer > 0 ? (
                        <>Mã còn hiệu lực: <strong className="text-red-600 font-mono">{Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}</strong></>
                      ) : (
                        <span className="text-red-600 font-semibold">Mã OTP đã hết hạn!</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-red-700 hover:underline font-bold"
                    >
                      Gửi lại mã OTP
                    </button>
                  </div>

                  <div className="flex justify-between items-center gap-2 pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setRegStep('form')}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    >
                      ← Quay lại sửa thông tin
                    </button>
                    <button
                      type="submit"
                      disabled={userOtp.length !== 6 || isSubmitting}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition ${userOtp.length !== 6 || isSubmitting ? 'bg-zinc-400 cursor-not-allowed opacity-70' : 'bg-red-700 hover:bg-red-800'}`}
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Xác nhận & Hoàn tất 🎉'}
                    </button>
                  </div>
                </form>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IcoStore() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IcoBike() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 0 0-1 1v11.5"/><path d="M9 7l1.5 5.5h6l-3-5.5H9z"/></svg>; }
function IcoCalendar() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function IcoUser() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
