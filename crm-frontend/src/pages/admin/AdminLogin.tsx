import React, { useState } from 'react';
import { mockStaffAccounts, type StaffAccount } from '../../data/mockData';

interface AdminLoginProps {
  onLoginSuccess: (staff: StaffAccount) => void;
  onBackHome: () => void;
}

export default function AdminLoginPage({ onLoginSuccess, onBackHome }: AdminLoginProps) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const input = emailOrPhone.trim().toLowerCase();
    if (!input) {
      setErrorMsg('Vui lòng nhập Email hoặc Số điện thoại đăng nhập.');
      return;
    }

    const foundStaff = mockStaffAccounts.find(
      s => s.email.toLowerCase() === input || s.soDienThoai === input || s.id.toLowerCase() === input
    );

    if (!foundStaff) {
      setErrorMsg('Tài khoản nhân viên không tồn tại trong hệ thống CRM.');
      return;
    }

    if (foundStaff.trangThai === 'BiKhoa') {
      setErrorMsg('⚠️ Tài khoản này hiện đang BỊ KHÓA. Vui lòng liên hệ Super Admin để mở khóa.');
      return;
    }

    // Success login
    onLoginSuccess(foundStaff);
  };

  const handleQuickDemo = (email: string) => {
    setErrorMsg(null);
    const staff = mockStaffAccounts.find(s => s.email === email);
    if (!staff) return;

    if (staff.trangThai === 'BiKhoa') {
      setErrorMsg('⚠️ Tài khoản demo này đang BỊ KHÓA (Phạm Văn Hỗ Trợ).');
      return;
    }

    setEmailOrPhone(staff.email);
    setPassword('******');
    onLoginSuccess(staff);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--color-zinc-950)', fontFamily: 'var(--font-sans)' }}
    >
      {/* Background styling */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(185,28,28,0.15) 0%, transparent 70%)',
        }}
      />
      <div className="absolute top-0 left-0 w-2 h-full bg-red-700" />
      <div className="absolute bottom-0 right-0 w-full h-1 bg-red-700" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Back button */}
        <div className="flex justify-between items-center">
          <button
            onClick={onBackHome}
            className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition"
          >
            ← Quay lại Trang chủ
          </button>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-red-950 text-red-400 border border-red-800/50 uppercase font-bold">
            CRM ADMIN SYSTEM
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-red-700 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-red-900/40">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1
            className="text-2xl font-extrabold text-white tracking-wide uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ĐĂNG NHẬP QUẢN TRỊ
          </h1>
          <p className="text-xs text-zinc-400">
            Dành cho Ban quản lý & Nhân viên Đại lý Motoshop
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs font-semibold leading-relaxed flex items-start justify-between gap-2 shadow font-mono">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white font-bold">✕</button>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1.5 uppercase font-mono">
              Email / Số điện thoại nhân viên *
            </label>
            <input
              type="text"
              required
              placeholder="VD: admin@motoshop.vn hoặc 0909999888"
              value={emailOrPhone}
              onChange={e => setEmailOrPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 font-mono text-xs transition"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1.5 uppercase font-mono">
              Mật khẩu *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 font-mono text-xs transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 text-xs font-mono"
              >
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-900/30 transition duration-200 mt-2 cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            🔐 VÀO HỆ THỐNG QUẢN TRỊ
          </button>
        </form>

        {/* Demo Quick Accounts */}
        <div className="pt-4 border-t border-zinc-800 space-y-2.5">
          <div className="text-[11px] font-mono text-zinc-400 text-center uppercase tracking-wider">
            ⚡ ĐĂNG NHẬP NHANH TÀI KHOẢN DEMO
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin@motoshop.vn')}
              className="w-full p-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer"
            >
              <div>
                <div className="font-bold text-red-400">👑 Super Admin</div>
                <div className="text-[10px] text-zinc-500 font-mono">admin@motoshop.vn</div>
              </div>
              <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Vào ngay →</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('sale@motoshop.vn')}
              className="w-full p-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer"
            >
              <div>
                <div className="font-bold text-blue-400">💼 NV Bán Hàng & CRM</div>
                <div className="text-[10px] text-zinc-500 font-mono">sale@motoshop.vn</div>
              </div>
              <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Vào ngay →</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('kythuat@motoshop.vn')}
              className="w-full p-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer"
            >
              <div>
                <div className="font-bold text-emerald-400">🔧 NV Kỹ Thuật & Kho</div>
                <div className="text-[10px] text-zinc-500 font-mono">kythuat@motoshop.vn</div>
              </div>
              <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Vào ngay →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
