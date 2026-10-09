import { useState, useMemo, useEffect } from 'react';
import {
  mockCustomers,
  mockVehicles,
  mockOrders,
  mockAppointments,
  mockFeedbacks,
  renewVehicleWarranty,
  getCustomerTier,
  PRESET_CUSTOMER_AVATARS,
  type Customer,
  type CustomerStatus,
  type CustomerTierType,
  type Vehicle,
  type Order,
  type Appointment,
  type Feedback,
  formatVND,
} from '../../data/mockData';
import { customerApi, vehicleApi, orderApi, appointmentApi, feedbackApi } from '../../services/api';
import ImageUploader from '../../components/shared/ImageUploader';

const PAGE_SIZE = 8;

/* ── Modal Thêm khách hàng (H01, H02, H04) ── */
function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Customer) => void }) {
  const [form, setForm] = useState({
    hoTen: '', email: '', soDienThoai: '', diaChi: '', ngaySinh: '', gioiTinh: 'Nam' as 'Nam' | 'Nu', avatar: '',
    tenXe: '', bienSo: '', soKhung: '', mauSac: 'Đen bóng', namSanXuat: '2025', hinhAnhXe: '',
  });
  const [err, setErr] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.hoTen.trim()) e.hoTen = 'Họ và tên bắt buộc';
    if (!form.email.includes('@')) e.email = 'Email không đúng định dạng';
    if (!/^0\d{9}$/.test(form.soDienThoai.trim())) e.soDienThoai = 'SĐT phải gồm 10 chữ số bắt đầu bằng 0';
    if (!form.diaChi.trim()) e.diaChi = 'Địa chỉ bắt buộc';

    // H01: Kiểm tra ngày sinh (bắt buộc, không chọn ngày tương lai, tuổi >= 16)
    if (!form.ngaySinh) {
      e.ngaySinh = 'Vui lòng chọn ngày sinh';
    } else {
      const bDate = new Date(form.ngaySinh);
      const today = new Date();
      if (bDate > today) {
        e.ngaySinh = 'Ngày sinh không thể lớn hơn ngày hiện tại';
      } else {
        let age = today.getFullYear() - bDate.getFullYear();
        const m = today.getMonth() - bDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) age--;
        if (age < 16) {
          e.ngaySinh = `Khách hàng phải từ đủ 16 tuổi trở lên (hiện tại ${age} tuổi)`;
        }
      }
    }

    setErr(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    let newCustId = `KH${Date.now().toString().slice(-4)}`;

    try {
      const res = await customerApi.create({
        hoTen: form.hoTen.trim(),
        email: form.email.trim(),
        soDienThoai: form.soDienThoai.trim(),
        diaChi: form.diaChi.trim(),
        ngaySinh: form.ngaySinh ? `${form.ngaySinh}T00:00:00` : '2000-01-01T00:00:00',
        gioiTinh: form.gioiTinh === 'Nu' ? 'Nu' : 'Nam',
        tenDangNhap: form.email.split('@')[0],
        matKhau: '123456',
        avatar: form.avatar || undefined,
      } as any);
      if (res.customer) {
        newCustId = res.customer.id;
      }
    } catch (err) {
      console.warn('Backend call failed, creating locally:', err);
    }

    if (form.tenXe.trim() || form.bienSo.trim()) {
      const newV: Vehicle = {
        id: `XE${Date.now().toString().slice(-4)}`,
        customerId: newCustId,
        tenXe: form.tenXe.trim() || 'Honda Wave Alpha 110cc',
        bienSo: form.bienSo.trim() || '51K-99999',
        namSanXuat: Number(form.namSanXuat) || 2025,
        hanBaoHanh: new Date(Date.now() + 3 * 365 * 86400000).toISOString().split('T')[0],
        mauSac: form.mauSac || 'Đen bóng',
        trangThaiBaoHanh: 'ConHan',
        soKhung: form.soKhung.trim() || `RLH${Date.now().toString().slice(-8)}`,
        hinhAnh: form.hinhAnhXe || undefined,
      };
      mockVehicles.push(newV);
    }

    const newCustomer: Customer = {
      id: newCustId,
      hoTen: form.hoTen.trim(),
      email: form.email.trim(),
      soDienThoai: form.soDienThoai.trim(),
      diaChi: form.diaChi.trim(),
      ngaySinh: form.ngaySinh,
      gioiTinh: form.gioiTinh,
      avatar: form.avatar || undefined,
      trangThai: 'HoatDong',
      ngayDangKy: new Date().toISOString().split('T')[0],
      soXe: form.bienSo ? form.bienSo.trim() : '',
      tongChiTieu: 0,
      matKhau: '123456',
    };

    onAdd(newCustomer);
    onClose();
  }

  const inputSt: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-zinc-200)', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--color-zinc-900)', background: 'white', outline: 'none' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(9,9,11,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-lg my-8 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-zinc-200)', background: 'var(--color-zinc-950)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase' }}>THÊM KHÁCH HÀNG MỚI</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-zinc-400)', fontFamily: 'var(--font-mono)' }}>Điền thông tin cá nhân & chọn ảnh đại diện</div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white bg-zinc-800 rounded-lg w-8 h-8 flex items-center justify-center font-bold text-lg cursor-pointer">✕</button>
        </div>
        <form onSubmit={submit} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Họ và tên *</label>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn Nam"
                value={form.hoTen}
                onChange={e => setForm(f => ({ ...f, hoTen: e.target.value }))}
                style={{ ...inputSt, borderColor: err.hoTen ? 'var(--color-red-500)' : 'var(--color-zinc-200)' }}
              />
              {err.hoTen && <p className="text-xs mt-1 text-red-600">{err.hoTen}</p>}
            </div>

            <div>
              <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Ngày sinh (Đủ 16 tuổi) *</label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={form.ngaySinh}
                onChange={e => setForm(f => ({ ...f, ngaySinh: e.target.value }))}
                style={{ ...inputSt, borderColor: err.ngaySinh ? 'var(--color-red-500)' : 'var(--color-zinc-200)' }}
              />
              {err.ngaySinh && <p className="text-xs mt-1 text-red-600">{err.ngaySinh}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Email *</label>
              <input
                type="email"
                placeholder="VD: nam@gmail.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ ...inputSt, borderColor: err.email ? 'var(--color-red-500)' : 'var(--color-zinc-200)' }}
              />
              {err.email && <p className="text-xs mt-1 text-red-600">{err.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Số điện thoại *</label>
              <input
                type="tel"
                placeholder="VD: 0912345678"
                value={form.soDienThoai}
                onChange={e => setForm(f => ({ ...f, soDienThoai: e.target.value }))}
                style={{ ...inputSt, borderColor: err.soDienThoai ? 'var(--color-red-500)' : 'var(--color-zinc-200)' }}
              />
              {err.soDienThoai && <p className="text-xs mt-1 text-red-600">{err.soDienThoai}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Địa chỉ thường trú *</label>
            <input
              type="text"
              placeholder="VD: 123 Nguyễn Trãi, Q.5, TP.HCM"
              value={form.diaChi}
              onChange={e => setForm(f => ({ ...f, diaChi: e.target.value }))}
              style={{ ...inputSt, borderColor: err.diaChi ? 'var(--color-red-500)' : 'var(--color-zinc-200)' }}
            />
            {err.diaChi && <p className="text-xs mt-1 text-red-600">{err.diaChi}</p>}
          </div>

          <div>
            <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Giới tính</label>
            <select value={form.gioiTinh} onChange={e => setForm(f => ({ ...f, gioiTinh: e.target.value as 'Nam' | 'Nu' }))} style={{ ...inputSt, cursor: 'pointer' }}>
              <option value="Nam">Nam</option>
              <option value="Nu">Nữ</option>
            </select>
          </div>

          {/* H02: Ảnh đại diện với mẫu chọn nhanh */}
          <div className="pt-2 border-t border-zinc-200">
            <label className="block text-xs font-600 mb-1.5 text-zinc-700 uppercase">Ảnh đại diện Avatar (Mẫu có sẵn hoặc tải lên)</label>
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
              {PRESET_CUSTOMER_AVATARS.map((presetUrl, idx) => {
                const isSelected = form.avatar === presetUrl;
                return (
                  <button
                    key={presetUrl}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, avatar: presetUrl }))}
                    className={`w-10 h-10 rounded-full shrink-0 overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                      isSelected ? 'border-red-600 ring-2 ring-red-300 scale-105' : 'border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100'
                    }`}
                    title={`Mẫu Avatar ${idx + 1}`}
                  >
                    <img src={presetUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover rounded-full" />
                  </button>
                );
              })}
            </div>
            <ImageUploader
              value={form.avatar}
              onChange={url => setForm(f => ({ ...f, avatar: url }))}
              label="Tải ảnh đại diện từ máy hoặc dán link URL"
            />
          </div>

          {/* Optional Vehicle Registration */}
          <div className="pt-3 border-t border-zinc-200">
            <div className="text-xs font-bold text-zinc-900 mb-2 uppercase flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
              <span>🏍️ THÔNG TIN XE SỞ HỮU (TÙY CHỌN)</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-600 mb-1 text-zinc-600">TÊN XE / MẪU XE</label>
                <input
                  type="text"
                  placeholder="VD: Honda SH 160i ABS"
                  value={form.tenXe}
                  onChange={e => setForm(f => ({ ...f, tenXe: e.target.value }))}
                  style={inputSt}
                />
              </div>
              <div>
                <label className="block text-xs font-600 mb-1 text-zinc-600">BIỂN SỐ XE</label>
                <input
                  type="text"
                  placeholder="VD: 51K-12345"
                  value={form.bienSo}
                  onChange={e => setForm(f => ({ ...f, bienSo: e.target.value }))}
                  style={inputSt}
                />
              </div>
              <div>
                <label className="block text-xs font-600 mb-1 text-zinc-600">SỐ KHUNG (VIN)</label>
                <input
                  type="text"
                  placeholder="VD: RLHKC110JA..."
                  value={form.soKhung}
                  onChange={e => setForm(f => ({ ...f, soKhung: e.target.value }))}
                  style={inputSt}
                />
              </div>
              <div>
                <label className="block text-xs font-600 mb-1 text-zinc-600">MÀU SẮC</label>
                <input
                  type="text"
                  placeholder="VD: Đỏ đen"
                  value={form.mauSac}
                  onChange={e => setForm(f => ({ ...f, mauSac: e.target.value }))}
                  style={inputSt}
                />
              </div>
            </div>
            <ImageUploader
              value={form.hinhAnhXe}
              onChange={url => setForm(f => ({ ...f, hinhAnhXe: url }))}
              label="Ảnh chụp phương tiện"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--color-zinc-200)', background: 'white', color: 'var(--color-zinc-700)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Hủy</button>
            <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--color-red-700)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>THÊM KHÁCH HÀNG</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal Sửa thông tin khách hàng (H01, H02, H04) ── */
function EditModal({ customer, onClose, onSave }: { customer: Customer; onClose: () => void; onSave: (updated: Customer) => void }) {
  const [form, setForm] = useState({
    hoTen: customer.hoTen,
    email: customer.email,
    soDienThoai: customer.soDienThoai,
    diaChi: customer.diaChi,
    ngaySinh: customer.ngaySinh,
    gioiTinh: customer.gioiTinh,
    trangThai: customer.trangThai,
    avatar: customer.avatar || '',
  });
  const [err, setErr] = useState<Record<string, string>>({});

  const inputSt: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-zinc-200)', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--color-zinc-900)', background: 'white', outline: 'none' };

  function validate() {
    const e: Record<string, string> = {};
    if (!form.hoTen.trim()) e.hoTen = 'Họ và tên bắt buộc';
    if (!form.email.includes('@')) e.email = 'Email không hợp lệ';
    if (!/^0\d{9}$/.test(form.soDienThoai.trim())) e.soDienThoai = 'SĐT phải gồm 10 chữ số bắt đầu bằng 0';

    // H01: Kiểm tra ngày sinh nếu có nhập
    if (form.ngaySinh) {
      const bDate = new Date(form.ngaySinh);
      const today = new Date();
      if (bDate > today) {
        e.ngaySinh = 'Ngày sinh không thể lớn hơn ngày hiện tại';
      } else {
        let age = today.getFullYear() - bDate.getFullYear();
        const m = today.getMonth() - bDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) age--;
        if (age < 16) {
          e.ngaySinh = `Khách hàng phải từ đủ 16 tuổi trở lên (hiện tại ${age} tuổi)`;
        }
      }
    }

    setErr(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...customer,
      ...form,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(9,9,11,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-lg bg-white overflow-hidden">
        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-zinc-200)', background: 'var(--color-zinc-950)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase' }}>SỬA THÔNG TIN KHÁCH HÀNG</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-zinc-400)', fontFamily: 'var(--font-mono)' }}>Mã KH: {customer.id}</div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white bg-zinc-800 rounded-lg w-8 h-8 flex items-center justify-center font-bold text-lg cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Họ và tên *</label>
              <input type="text" required value={form.hoTen} onChange={e => setForm({ ...form, hoTen: e.target.value })} style={{ ...inputSt, borderColor: err.hoTen ? 'var(--color-red-500)' : 'var(--color-zinc-200)' }} />
              {err.hoTen && <p className="text-xs mt-1 text-red-600">{err.hoTen}</p>}
            </div>
            <div>
              <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Ngày sinh (Đủ 16 tuổi)</label>
              <input type="date" max={new Date().toISOString().split('T')[0]} value={form.ngaySinh} onChange={e => setForm({ ...form, ngaySinh: e.target.value })} style={{ ...inputSt, borderColor: err.ngaySinh ? 'var(--color-red-500)' : 'var(--color-zinc-200)' }} />
              {err.ngaySinh && <p className="text-xs mt-1 text-red-600">{err.ngaySinh}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Email *</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ ...inputSt, borderColor: err.email ? 'var(--color-red-500)' : 'var(--color-zinc-200)' }} />
              {err.email && <p className="text-xs mt-1 text-red-600">{err.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Số điện thoại *</label>
              <input type="tel" required value={form.soDienThoai} onChange={e => setForm({ ...form, soDienThoai: e.target.value })} style={{ ...inputSt, borderColor: err.soDienThoai ? 'var(--color-red-500)' : 'var(--color-zinc-200)' }} />
              {err.soDienThoai && <p className="text-xs mt-1 text-red-600">{err.soDienThoai}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Địa chỉ thường trú</label>
            <input type="text" value={form.diaChi} onChange={e => setForm({ ...form, diaChi: e.target.value })} style={inputSt} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Giới tính</label>
              <select value={form.gioiTinh} onChange={e => setForm({ ...form, gioiTinh: e.target.value as 'Nam' | 'Nu' })} style={{ ...inputSt, cursor: 'pointer' }}>
                <option value="Nam">Nam</option>
                <option value="Nu">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Trạng thái tài khoản</label>
              <select value={form.trangThai} onChange={e => setForm({ ...form, trangThai: e.target.value as CustomerStatus })} style={{ ...inputSt, cursor: 'pointer' }}>
                <option value="HoatDong">Hoạt động</option>
                <option value="BiKhoa">Bị khóa (Chặn đăng nhập)</option>
              </select>
            </div>
          </div>

          {/* H02: Preset Avatars */}
          <div className="pt-2 border-t border-zinc-200">
            <label className="block text-xs font-600 mb-1.5 text-zinc-700 uppercase">Ảnh đại diện Avatar (Mẫu có sẵn hoặc tải lên)</label>
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
              {PRESET_CUSTOMER_AVATARS.map((presetUrl, idx) => {
                const isSelected = form.avatar === presetUrl;
                return (
                  <button
                    key={presetUrl}
                    type="button"
                    onClick={() => setForm({ ...form, avatar: presetUrl })}
                    className={`w-10 h-10 rounded-full shrink-0 overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                      isSelected ? 'border-red-600 ring-2 ring-red-300 scale-105' : 'border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100'
                    }`}
                    title={`Mẫu Avatar ${idx + 1}`}
                  >
                    <img src={presetUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover rounded-full" />
                  </button>
                );
              })}
            </div>
            <ImageUploader
              value={form.avatar}
              onChange={url => setForm(f => ({ ...f, avatar: url }))}
              label="Tải ảnh đại diện từ máy hoặc dán link URL"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 bg-white cursor-pointer">Hủy</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-800 shadow transition cursor-pointer" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
              CẬP NHẬT THÔNG TIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal Đổi Mật Khẩu Khách Hàng (Admin Reset) ── */
function ResetCustomerPasswordModal({
  customer,
  onClose,
  onSave,
}: {
  customer: Customer;
  onClose: () => void;
  onSave: (newPass: string) => void;
}) {
  const [newPassword, setNewPassword] = useState('MatKhau@123');
  const [confirmPassword, setConfirmPassword] = useState('MatKhau@123');
  const [err, setErr] = useState<string | null>(null);

  const handleGenerate = () => {
    const randomPass = `Crm@${Math.floor(1000 + Math.random() * 9000)}`;
    setNewPassword(randomPass);
    setConfirmPassword(randomPass);
    setErr(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (newPassword.length < 8) {
      setErr('Mật khẩu mới phải có tối thiểu 8 ký tự!');
      return;
    }
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setErr('Mật khẩu phải bao gồm cả chữ hoa, chữ thường, số và ký tự đặc biệt!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr('Xác nhận mật khẩu không trùng khớp!');
      return;
    }

    onSave(newPassword);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-200">
          <div>
            <h3 className="font-extrabold text-base text-zinc-900 uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
              🔑 CẤP LẠI MẬT KHẨU KHÁCH HÀNG
            </h3>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">{customer.hoTen} ({customer.email})</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 font-bold text-lg cursor-pointer">✕</button>
        </div>

        {err && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-700">Mật khẩu mới *</label>
              <button
                type="button"
                onClick={handleGenerate}
                className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
              >
                ⚡ Tạo ngẫu nhiên
              </button>
            </div>
            <input
              type="text"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600 font-mono"
            />
            <p className="text-[10px] text-zinc-400 mt-1">Yêu cầu: ≥ 8 ký tự, có chữ hoa, thường, số, ký tự đặc biệt.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Xác nhận mật khẩu *</label>
            <input
              type="text"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow cursor-pointer"
            >
              Lưu mật khẩu mới
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal Hồ sơ Khách Hàng 360° (H03) ── */
function Customer360Modal({
  customer,
  onClose,
  onEdit,
  onResetPassword,
  onRenewWarranty,
}: {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onRenewWarranty: (vId: string, years: number) => void;
}) {
  const [activeTab, setActiveTab] = useState<'clv' | 'orders' | 'appts' | 'feedback' | 'vehicles'>('clv');
  const [orders, setOrders] = useState<Order[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [approvingVehicleId, setApprovingVehicleId] = useState<string | null>(null);
  const [approvingPlateId, setApprovingPlateId] = useState<string | null>(null);
  const [previewCaVetUrl, setPreviewCaVetUrl] = useState<string | null>(null);

  const handleApproveVehicle = async (vId: string) => {
    setApprovingVehicleId(vId);
    try {
      await vehicleApi.approveVehicle(vId);
      setVehicles(prev => prev.map(x => x.id === vId ? { ...x, trangThaiDuyet: 'DaDuyet', trangThaiDuyetBienSo: 'DaDuyet', bienSo: x.bienSoChoDuyet || x.bienSo } : x));
      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_approved', vehicleId: vId } }));
    } finally {
      setApprovingVehicleId(null);
    }
  };

  const handleApprovePlate = async (vId: string) => {
    setApprovingPlateId(vId);
    try {
      await vehicleApi.approveLicensePlate(vId);
      setVehicles(prev => prev.map(x => x.id === vId ? { ...x, bienSo: x.bienSoChoDuyet || x.bienSo, trangThaiDuyetBienSo: 'DaDuyet', bienSoChoDuyet: undefined } : x));
      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'license_plate_approved', vehicleId: vId } }));
    } finally {
      setApprovingPlateId(null);
    }
  };

  useEffect(() => {
    // 1. Orders
    orderApi.getAll().then(allOrders => {
      const match = (allOrders || mockOrders).filter(
        o => o.customerId === customer.id || o.email?.toLowerCase() === customer.email?.toLowerCase() || o.soDienThoai === customer.soDienThoai
      );
      setOrders(match);
    });

    // 2. Appointments
    appointmentApi.getAll().then(allAppts => {
      const match = (allAppts || mockAppointments).filter(
        a => a.customerId === customer.id || a.soDienThoai === customer.soDienThoai
      );
      setAppts(match);
    });

    // 3. Feedbacks
    feedbackApi.getAll().then(allFeedbacks => {
      const match = (allFeedbacks || mockFeedbacks).filter(
        f => f.customerId === customer.id || f.soDienThoai === customer.soDienThoai
      );
      setFeedbacks(match);
    });

    // 4. Vehicles (Khớp ID chuỗi, ID số và soXe)
    vehicleApi.getAll().then(allVehicles => {
      const cNum = parseInt(customer.id.replace(/\D/g, ''), 10);
      const match = (allVehicles || mockVehicles).filter(v => {
        if (v.customerId === customer.id) return true;
        const vNum = parseInt(v.customerId.replace(/\D/g, ''), 10);
        if (!isNaN(cNum) && !isNaN(vNum) && cNum === vNum) return true;
        if (customer.soXe && (customer.soXe === v.id || customer.soXe === v.bienSo)) return true;
        return false;
      });
      setVehicles(match);
    });
  }, [customer]);

  const tier = getCustomerTier(customer.tongChiTieu);

  // CLV Policies details
  const clvBenefits = {
    VIP: [
      { icon: '🎁', title: 'Chiết khấu đặc quyền 10%', desc: 'Giảm 10% toàn bộ phụ tùng thay thế và tiền công dịch vụ bảo dưỡng' },
      { icon: '🚀', title: 'Ưu tiên tiếp nhận hẹn Số 1', desc: 'Có khoang sửa chữa riêng, kỹ thuật viên tiếp nhận ngay không chờ đợi' },
      { icon: '🎂', title: 'Quà sinh nhật 500.000đ', desc: 'Tặng voucher mua phụ kiện hoặc bảo dưỡng miễn phí nhân dịp sinh nhật' },
      { icon: '🛋️', title: 'Phòng chờ VIP Lounge', desc: 'Khu vực tiếp khách riêng biệt, phục vụ cà phê và đồ uống thượng hạng miễn phí' },
      { icon: '👨‍🔧', title: 'Cố vấn kỹ thuật riêng 1:1', desc: 'Trưởng xưởng kỹ thuật trực tiếp theo dõi lịch sử và tư vấn định kỳ' },
      { icon: '🚚', title: 'Giao nhận xe tận nhà miễn phí', desc: 'Hỗ trợ xe tải cứu hộ giao nhận phương tiện trong bán kính 20km' },
    ],
    ThanThiet: [
      { icon: '💎', title: 'Chiết khấu 5% phụ tùng', desc: 'Giảm 5% hóa đơn mua phụ kiện và phụ tùng chính hãng' },
      { icon: '🪙', title: 'Tích điểm thành viên 1%', desc: 'Tích 1% điểm giá trị đơn hàng để quy đổi quà tặng định kỳ' },
      { icon: '🧼', title: 'Miễn phí rửa xe bọt tuyết', desc: 'Tặng 1 lần rửa xe bọt tuyết cao cấp mỗi khi bảo dưỡng định kỳ' },
      { icon: '⏰', title: 'Ưu tiên đặt hẹn cuối tuần', desc: 'Ưu tiên giữ chỗ khung giờ cao điểm thứ 7 và Chủ nhật' },
      { icon: '🛟', title: 'Hỗ trợ cứu hộ khẩn cấp 10km', desc: 'Hỗ trợ kỹ thuật viên kích bình, vá lốp trong bán kính 10km' },
    ],
    Moi: [
      { icon: '🎟️', title: 'Voucher 50.000đ dịch vụ đầu', desc: 'Áp dụng cho lần bảo dưỡng hoặc mua phụ tùng kế tiếp' },
      { icon: '🏍️', title: 'Nhắc lịch bảo dưỡng 1.000km', desc: 'Hệ thống tự động gửi SMS nhắc mốc bảo dưỡng đầu tiên của xe' },
      { icon: '📞', title: 'Tổng đài hỗ trợ kỹ thuật 24/7', desc: 'Hotline CSKH tư vấn kỹ thuật xe và hướng dẫn vận hành an toàn' },
      { icon: '📋', title: 'Khảo sát hài lòng sau mua 3 ngày', desc: 'Nhân viên gọi điện thăm hỏi và ghi nhận phản hồi đóng góp' },
    ],
  };

  const benefitsList = clvBenefits[tier.tier] || clvBenefits.Moi;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-6 shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-4">
            {customer.avatar ? (
              <img src={customer.avatar} alt={customer.hoTen} className="w-14 h-14 rounded-full object-cover border-2 border-red-600" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-zinc-600 text-zinc-400 flex items-center justify-center text-2xl font-bold">
                {customer.hoTen.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-extrabold uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                  {customer.hoTen}
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono shadow-xs"
                  style={{ background: tier.badgeBg, color: tier.badgeColor, border: `1px solid ${tier.badgeBorder}` }}
                >
                  {tier.shortLabel}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${customer.trangThai === 'HoatDong' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {customer.trangThai === 'HoatDong' ? '✓ Hoạt động' : '🔒 Bị khóa'}
                </span>
              </div>
              <div className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-3">
                <span>Mã: <strong>{customer.id}</strong></span>
                <span>•</span>
                <span>SĐT: <strong>{customer.soDienThoai}</strong></span>
                <span>•</span>
                <span>Email: <strong>{customer.email}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition cursor-pointer"
            >
              ✏️ Sửa hồ sơ
            </button>
            <button
              onClick={onResetPassword}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition cursor-pointer"
            >
              🔑 Đổi MK
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 font-bold text-lg cursor-pointer ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-zinc-200 bg-zinc-50 px-6 gap-2 overflow-x-auto">
          {[
            { key: 'clv', label: '👑 Phân tích CLV & Ưu đãi', count: undefined },
            { key: 'orders', label: '📦 Lịch sử Đơn hàng', count: orders.length },
            { key: 'appts', label: '📅 Lịch sử Đặt hẹn', count: appts.length },
            { key: 'feedback', label: '⭐ Đánh giá & Khảo sát', count: feedbacks.length },
            { key: 'vehicles', label: '🏍️ Xe & Bảo hành', count: vehicles.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === t.key
                  ? 'border-red-600 text-red-700 bg-white shadow-xs rounded-t-lg'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === t.key ? 'bg-red-100 text-red-700' : 'bg-zinc-200 text-zinc-600'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-zinc-50/50">
          {/* TAB 1: CLV */}
          {activeTab === 'clv' && (
            <div className="space-y-6">
              {/* CLV Highlights Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
                  <div className="text-[11px] text-zinc-500 font-semibold uppercase">Tổng chi tiêu tích lũy</div>
                  <div className="text-xl font-extrabold text-red-700 font-display mt-1">{formatVND(customer.tongChiTieu)}</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Xếp hạng: {tier.label}</div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
                  <div className="text-[11px] text-zinc-500 font-semibold uppercase">Tổng đơn hàng đã đặt</div>
                  <div className="text-xl font-extrabold text-zinc-900 font-display mt-1">{orders.length} đơn</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Xe máy & Phụ tùng</div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
                  <div className="text-[11px] text-zinc-500 font-semibold uppercase">Lượt dịch vụ & Đặt hẹn</div>
                  <div className="text-xl font-extrabold text-blue-700 font-display mt-1">{appts.length} lượt</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Bảo dưỡng & sửa chữa</div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
                  <div className="text-[11px] text-zinc-500 font-semibold uppercase">Số xe đang quản lý</div>
                  <div className="text-xl font-extrabold text-emerald-700 font-display mt-1">{vehicles.length} xe</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Bảo hành điện tử</div>
                </div>
              </div>

              {/* Personal Info Bar */}
              <div className="p-4 rounded-xl bg-white border border-zinc-200">
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span>👤</span> <span>THÔNG TIN NHÂN KHẨU HỌC & ĐỊA CHỈ</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div><span className="text-zinc-500">Giới tính:</span> <strong className="text-zinc-800">{customer.gioiTinh === 'Nu' ? 'Nữ' : 'Nam'}</strong></div>
                  <div><span className="text-zinc-500">Ngày sinh:</span> <strong className="text-zinc-800">{customer.ngaySinh || 'Chưa cập nhật'}</strong></div>
                  <div><span className="text-zinc-500">Địa chỉ:</span> <strong className="text-zinc-800">{customer.diaChi}</strong></div>
                  <div><span className="text-zinc-500">Ngày tham gia:</span> <strong className="text-zinc-800 font-mono">{customer.ngayDangKy}</strong></div>
                  <div><span className="text-zinc-500">Sở thích:</span> <strong className="text-zinc-800">{customer.soThich || 'Xe tay ga cao cấp'}</strong></div>
                  <div><span className="text-zinc-500">Mật khẩu CRM:</span> <strong className="text-zinc-800 font-mono">••••••</strong></div>
                </div>
              </div>

              {/* Special Care Policies by CLV */}
              <div className="p-5 rounded-xl bg-white border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-900 uppercase flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                      <span>🌟 CHÍNH SÁCH CHĂM SÓC & ĐẶC QUYỀN THEO HẠNG CLV</span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{tier.description}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold font-mono" style={{ background: tier.badgeBg, color: tier.badgeColor }}>
                    {tier.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {benefitsList.map((b, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-100 transition flex items-start gap-3">
                      <span className="text-2xl shrink-0 p-1 bg-white rounded-lg border border-zinc-200">{b.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">{b.title}</h4>
                        <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 bg-white rounded-xl border border-zinc-200">
                  <div className="text-4xl mb-2">📦</div>
                  <p className="text-sm font-semibold">Khách hàng chưa có đơn hàng nào</p>
                  <p className="text-xs text-zinc-400 mt-1">Đơn mua phụ tùng hoặc xe máy sẽ xuất hiện tại đây</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-100 text-zinc-600 font-mono uppercase text-[11px]">
                        <tr>
                          <th className="p-3">Mã đơn</th>
                          <th className="p-3">Loại đơn</th>
                          <th className="p-3">Ngày đặt</th>
                          <th className="p-3">Sản phẩm / Mẫu xe</th>
                          <th className="p-3 text-right">Tổng tiền</th>
                          <th className="p-3 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {orders.map(o => (
                          <tr key={o.id} className="hover:bg-zinc-50">
                            <td className="p-3 font-mono font-bold text-zinc-900">{o.id}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${o.loaiDon === 'Xe' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {o.loaiDon === 'Xe' ? '🏍️ Mua xe' : '⚙️ Phụ tùng'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-zinc-500">{o.ngayDat}</td>
                            <td className="p-3">
                              {o.thongTinXe?.tenXe ? (
                                <span className="font-semibold text-zinc-900">{o.thongTinXe.tenXe}</span>
                              ) : o.items && o.items.length > 0 ? (
                                <span className="text-zinc-700 truncate max-w-xs block">
                                  {o.items.map(i => `${i.tenSanPham} (x${i.soLuong})`).join(', ')}
                                </span>
                              ) : (
                                <span className="text-zinc-400">Đơn hàng dịch vụ</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-display font-bold text-red-700">{formatVND(o.tongTien)}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-1 rounded-full text-[10px] font-bold font-mono bg-zinc-100 text-zinc-800">
                                {o.trangThai}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: APPOINTMENTS */}
          {activeTab === 'appts' && (
            <div className="space-y-4">
              {appts.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 bg-white rounded-xl border border-zinc-200">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="text-sm font-semibold">Chưa có lịch hẹn nào</p>
                  <p className="text-xs text-zinc-400 mt-1">Lịch bảo dưỡng, sửa chữa hoặc lái thử xe của khách hàng</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-100 text-zinc-600 font-mono uppercase text-[11px]">
                        <tr>
                          <th className="p-3">Mã hẹn</th>
                          <th className="p-3">Dịch vụ</th>
                          <th className="p-3">Thời gian hẹn</th>
                          <th className="p-3">Mẫu xe & Biển số</th>
                          <th className="p-3">Ghi chú</th>
                          <th className="p-3 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {appts.map(a => (
                          <tr key={a.id} className="hover:bg-zinc-50">
                            <td className="p-3 font-mono font-bold text-zinc-900">{a.id}</td>
                            <td className="p-3">
                              <span className="font-semibold text-zinc-800">{a.loaiDichVu}</span>
                            </td>
                            <td className="p-3 font-mono text-zinc-600">
                              <strong className="text-red-700">{a.gioHen}</strong> ngày {a.ngayHen}
                            </td>
                            <td className="p-3 text-zinc-800">
                              {a.tenXe} {a.bienSo && `(${a.bienSo})`}
                            </td>
                            <td className="p-3 text-zinc-500 italic max-w-xs truncate">{a.ghiChu || '—'}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-1 rounded-full text-[10px] font-bold font-mono bg-blue-100 text-blue-800">
                                {a.trangThai}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FEEDBACK */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {feedbacks.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 bg-white rounded-xl border border-zinc-200">
                  <div className="text-4xl mb-2">⭐</div>
                  <p className="text-sm font-semibold">Khách hàng chưa để lại đánh giá nào</p>
                  <p className="text-xs text-zinc-400 mt-1">Các ý kiến nhận xét và mức độ hài lòng dịch vụ sẽ hiển thị tại đây</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map(f => (
                    <div key={f.id} className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500 font-bold text-sm tracking-widest">
                            {'★'.repeat(f.diemDanhGia || 5)}{'☆'.repeat(5 - (f.diemDanhGia || 5))}
                          </span>
                          <span className="text-xs font-bold text-zinc-900">({f.diemDanhGia || 5}/5 sao)</span>
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-mono text-[10px] font-bold">
                            {f.loaiDanhGia || 'Dịch vụ'}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-mono">{f.ngayGui}</span>
                      </div>
                      <p className="text-xs text-zinc-700 leading-relaxed italic bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                        "{f.noiDung}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: VEHICLES & WARRANTY */}
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              {vehicles.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 bg-white rounded-xl border border-zinc-200">
                  <div className="text-4xl mb-2">🏍️</div>
                  <p className="text-sm font-semibold">Chưa có phương tiện đăng ký</p>
                  <p className="text-xs text-zinc-400 mt-1">Khách hàng chưa đăng ký xe máy hoặc bảo hành điện tử</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicles.map(v => {
                    const isCuaHang = v.nguonGoc === 'CuaHang';
                    const isConHan = v.trangThaiBaoHanh === 'ConHan';
                    const isChoDuyet = v.trangThaiDuyet === 'ChoDuyet';

                    return (
                      <div key={v.id} className="p-4 rounded-xl border border-zinc-200 bg-white shadow-xs space-y-3">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-zinc-900 text-base">🏍️ {v.tenXe}</span>
                              {isCuaHang ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                  ✓ Mua tại cửa hàng
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
                                  Xe mua ngoài hệ thống
                                </span>
                              )}
                              {isChoDuyet && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                  ⏳ Chờ duyệt hồ sơ xe
                                </span>
                              )}
                              {v.trangThaiDuyetBienSo === 'ChoDuyet' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">
                                  ⏳ Chờ duyệt biển số ({v.bienSoChoDuyet})
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-600 font-mono mt-1 flex items-center gap-2 flex-wrap">
                              <span>Biển số xe:</span>
                              {v.trangThaiDuyetBienSo === 'ChoDuyet' ? (
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                                  Chờ duyệt: {v.bienSoChoDuyet} (Hiện tại: {v.bienSo})
                                </span>
                              ) : (!v.bienSo || v.bienSo === 'Chưa có biển số' || v.trangThaiDuyetBienSo === 'ChoCapNhat') ? (
                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                                  ⚠️ Chưa có biển số (Chờ khách gửi)
                                </span>
                              ) : (
                                <strong className="text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded font-bold">{v.bienSo}</strong>
                              )}
                              <span>• Màu: {v.mauSac} • Đời: {v.namSanXuat}</span>
                            </div>
                            <div className="text-xs text-zinc-400 font-mono mt-0.5">
                              Số khung (VIN): {v.soKhung || 'Chưa có'} {v.soMay ? `• Số máy: ${v.soMay}` : ''}
                            </div>
                          </div>

                          {/* Cột trạng thái bảo hành */}
                          <div className="text-right">
                            {isCuaHang ? (
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${isConHan ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {isConHan ? '✓ Còn hiệu lực' : '✕ Đã hết hạn'}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-zinc-100 text-zinc-500">
                                ⚪ Không áp dụng BH
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 📄 Hiển thị ảnh Cà vẹt xe nếu có */}
                        {v.anhCaVet ? (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                            <img
                              src={v.anhCaVet}
                              alt="Ảnh Cà vẹt xe"
                              className="w-16 h-12 object-cover rounded-lg border border-zinc-300 cursor-pointer hover:scale-105 transition shrink-0 shadow-2xs"
                              onClick={() => setPreviewCaVetUrl(v.anhCaVet!)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                                <span>📄 ẢNH CÀ VẸT XE (GIẤY ĐĂNG KÝ XE)</span>
                                <button
                                  type="button"
                                  onClick={() => setPreviewCaVetUrl(v.anhCaVet!)}
                                  className="text-[11px] text-red-600 hover:underline font-bold cursor-pointer"
                                >
                                  [Xem ảnh phóng to 🔍]
                                </button>
                              </div>
                              <div className="text-[11px] text-zinc-500 font-mono truncate">
                                Khách hàng đã tải lên hình ảnh giấy đăng ký xe để làm căn cứ xác thực.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-zinc-400 font-mono italic">
                            Chưa có hình ảnh Cà vẹt xe đính kèm.
                          </div>
                        )}

                        {/* Banner 1: Duyệt biển số xe cho xe mua tại cửa hàng */}
                        {isCuaHang && v.trangThaiDuyetBienSo === 'ChoDuyet' && (
                          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between flex-wrap gap-2.5">
                            <div className="text-xs text-blue-950">
                              <strong>Yêu cầu cấp biển số mới:</strong> Khách hàng đề xuất biển số{' '}
                              <strong className="text-red-700 font-mono font-bold text-sm">{v.bienSoChoDuyet}</strong> kèm ảnh cà vẹt xe. Vui lòng đối chiếu thông tin pháp lý trước khi phê duyệt.
                            </div>
                            <button
                              type="button"
                              disabled={approvingPlateId === v.id}
                              onClick={() => handleApprovePlate(v.id)}
                              className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>{approvingPlateId === v.id ? 'Đang duyệt...' : `✓ Phê duyệt biển số (${v.bienSoChoDuyet})`}</span>
                            </button>
                          </div>
                        )}

                        {/* Banner 2: Duyệt xe & Cà vẹt cho xe ngoài hệ thống */}
                        {!isCuaHang && isChoDuyet && (
                          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between flex-wrap gap-2.5">
                            <div className="text-xs text-amber-950">
                              <strong>Hồ sơ xe chờ duyệt:</strong> Xe do khách hàng tự đăng ký trên Web kèm ảnh cà vẹt xe. Nhân viên cần đối chiếu giấy tờ và bấm duyệt để kích hoạt vào tài khoản khách hàng.
                            </div>
                            <button
                              type="button"
                              disabled={approvingVehicleId === v.id}
                              onClick={() => handleApproveVehicle(v.id)}
                              className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>{approvingVehicleId === v.id ? 'Đang duyệt...' : '✓ Duyệt xe & Cà vẹt'}</span>
                            </button>
                          </div>
                        )}

                        {/* Thông tin bảo hành & hành động */}
                        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-2">
                          <div className="text-xs text-zinc-600 font-mono">
                            {isCuaHang ? (
                              <>
                                Hạn bảo hành điện tử: <strong className={isConHan ? 'text-zinc-900' : 'text-red-600'}>{v.hanBaoHanh}</strong>
                              </>
                            ) : (
                              <span className="text-zinc-400 italic">
                                Bảo hành chính hãng không áp dụng cho xe mua ngoài hệ thống
                              </span>
                            )}
                          </div>
                          {isCuaHang && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  onRenewWarranty(v.id, 1);
                                  setVehicles(prev => prev.map(x => x.id === v.id ? { ...x, hanBaoHanh: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0], trangThaiBaoHanh: 'ConHan' } : x));
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow-sm transition cursor-pointer"
                              >
                                + Gia hạn 12 tháng
                              </button>
                              <button
                                onClick={() => {
                                  onRenewWarranty(v.id, 2);
                                  setVehicles(prev => prev.map(x => x.id === v.id ? { ...x, hanBaoHanh: new Date(Date.now() + 2 * 365 * 86400000).toISOString().split('T')[0], trangThaiBaoHanh: 'ConHan' } : x));
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm transition cursor-pointer"
                              >
                                + Gia hạn 24 tháng
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-zinc-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-black text-white transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
        {/* Preview ảnh Cà vẹt xe phóng to */}
        {previewCaVetUrl && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
            onClick={() => setPreviewCaVetUrl(null)}
          >
            <div
              className="relative max-w-2xl w-full bg-white rounded-3xl p-5 shadow-2xl border border-zinc-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-100">
                <span className="text-sm font-extrabold text-zinc-900 uppercase font-mono">
                  📄 ẢNH CÀ VẸT XE (GIẤY ĐĂNG KÝ XE)
                </span>
                <button
                  onClick={() => setPreviewCaVetUrl(null)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="rounded-2xl overflow-hidden bg-zinc-950 flex items-center justify-center max-h-[70vh]">
                <img
                  src={previewCaVetUrl}
                  alt="Ảnh cà vẹt phóng to"
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Trang Quản Lý Khách Hàng (Admin) ── */
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>(mockVehicles);
  const [allOrders, setAllOrders] = useState<Order[]>(mockOrders);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<CustomerStatus | 'All'>('All');
  const [filterTier, setFilterTier] = useState<CustomerTierType | 'All'>('All');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [deletingCustId, setDeletingCustId] = useState<string | null>(null);
  const [selectedCustFor360, setSelectedCustFor360] = useState<Customer | null>(null);
  const [resetPassCust, setResetPassCust] = useState<Customer | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Highlight khách hàng từ thông báo Admin
  const [highlightCustId, setHighlightCustId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load live data from Backend API on mount & on customer creation events
  useEffect(() => {
    let isMounted = true;
    const fetchCustomers = async () => {
      try {
        const [data, ordersData] = await Promise.all([
          customerApi.getAll(),
          orderApi.getAll(),
        ]);
        const ordersList = ordersData || mockOrders;
        if (isMounted) setAllOrders(ordersList);

        const baseList = data && data.length > 0 ? data : mockCustomers;
        const computed = baseList.map(c => {
          const cOrders = ordersList.filter(o =>
            o.customerId === c.id ||
            o.customerId === `KH${c.id}` ||
            (c.soDienThoai && (o as any).soDienThoai === c.soDienThoai) ||
            (c.email && o.email?.toLowerCase() === c.email.toLowerCase())
          );
          const completedSpent = cOrders
            .filter(o => o.trangThai === 'HoanThanh' || (o.trangThai as any) === 'DaHoanThanh' || (o.trangThai as any) === 'Hoàn thành')
            .reduce((sum, o) => sum + (o.tongTien || 0), 0);
          const realSpending = Math.max(c.tongChiTieu || 0, completedSpent);
          return { ...c, tongChiTieu: realSpending };
        });

        if (isMounted) {
          setCustomers(computed);
        }
      } catch (err) {
        console.warn('Lỗi fetchCustomers:', err);
      }
    };

    const fetchVehicles = () => {
      vehicleApi.getAll().then(data => {
        if (isMounted && data && data.length > 0) {
          setAllVehicles(data);
        }
      });
    };

    fetchCustomers();
    fetchVehicles();

    const handleRefresh = (e: any) => {
      if (!e.detail || e.detail.type === 'customer_registered' || e.detail.type === 'customer_updated' || e.detail.type === 'customer_deleted' || e.detail.type === 'order_created' || e.detail.type === 'order_updated') {
        fetchCustomers();
      }
      fetchVehicles();
    };

    window.addEventListener('crm-data-refresh', handleRefresh);
    window.addEventListener('crm-admin-notification', handleRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener('crm-data-refresh', handleRefresh);
      window.removeEventListener('crm-admin-notification', handleRefresh);
    };
  }, []);

  // Đón nhận highlight từ thông báo Admin
  useEffect(() => {
    const handleHighlight = (payload?: any) => {
      let data = payload;
      if (!data) {
        try {
          const raw = sessionStorage.getItem('crm_admin_highlight');
          if (raw) data = JSON.parse(raw);
        } catch {}
      }
      if (!data || data.page !== 'customers') return;

      const targetId = (data.targetId || '').trim();
      const keyword = (data.keyword || '').trim();

      const match = customers.find(c =>
        (targetId && c.id.toLowerCase() === targetId.toLowerCase()) ||
        (keyword && (c.id.toLowerCase().includes(keyword.toLowerCase()) || c.hoTen.toLowerCase().includes(keyword.toLowerCase()) || c.soDienThoai.includes(keyword)))
      );

      const targetCust = match || (targetId ? customers.find(c => c.id === targetId) : undefined);

      if (targetCust) {
        setSearch(targetCust.id);
        setHighlightCustId(targetCust.id);
        setPage(1);

        setTimeout(() => {
          const el = document.getElementById(`cust-row-${targetCust.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);

        setTimeout(() => {
          setHighlightCustId(null);
        }, 7000);
      } else if (targetId) {
        setSearch(targetId);
        setHighlightCustId(targetId);
        setPage(1);
        setTimeout(() => setHighlightCustId(null), 7000);
      }

      sessionStorage.removeItem('crm_admin_highlight');
    };

    handleHighlight();

    const onEvent = (e: any) => handleHighlight(e.detail);
    window.addEventListener('crm-admin-highlight-target', onEvent);
    return () => window.removeEventListener('crm-admin-highlight-target', onEvent);
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(c => {
      const matchStatus = filterStatus === 'All' || c.trangThai === filterStatus;
      const tierInfo = getCustomerTier(c.tongChiTieu);
      const matchTier = filterTier === 'All' || tierInfo.tier === filterTier;
      const matchSearch = !q || c.hoTen.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.soDienThoai.includes(q);
      return matchStatus && matchTier && matchSearch;
    });
  }, [customers, search, filterStatus, filterTier]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Khóa / Mở khóa tài khoản khách hàng
  function toggleStatus(id: string) {
    const target = customers.find(x => x.id === id);
    if (!target) return;
    const nextStatus: CustomerStatus = target.trangThai === 'HoatDong' ? 'BiKhoa' : 'HoatDong';

    const numId = parseInt(id.replace(/\D/g, ''), 10);
    if (!isNaN(numId)) {
      customerApi.toggleStatus(numId, target.trangThai);
    }

    const updatedList = customers.map(c => c.id === id ? { ...c, trangThai: nextStatus } : c);
    setCustomers(updatedList);
    customerApi.saveLocal(updatedList);

    const originalMock = mockCustomers.find(x => x.id === id);
    if (originalMock) {
      originalMock.trangThai = nextStatus;
    }

    // Nếu tài khoản đang được đăng nhập ở phiên client mà bị khóa, cập nhật hoặc xóa phiên đăng nhập
    try {
      const currentCust = localStorage.getItem('crm_current_customer');
      if (currentCust) {
        const parsed = JSON.parse(currentCust);
        if (parsed.id === id || parsed.email === target.email) {
          if (nextStatus === 'BiKhoa') {
            localStorage.setItem('crm_current_customer', JSON.stringify({ ...parsed, trangThai: 'BiKhoa' }));
          } else {
            localStorage.setItem('crm_current_customer', JSON.stringify({ ...parsed, trangThai: 'HoatDong' }));
          }
        }
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'customer_updated' } }));
    showToast(nextStatus === 'BiKhoa' ? `🔒 Đã khóa tài khoản khách hàng ${target.hoTen}!` : `🔓 Đã mở khóa tài khoản khách hàng ${target.hoTen}!`);
  }

  // Thêm khách hàng mới
  function handleAddCustomer(newC: Customer) {
    const updated = [newC, ...customers];
    setCustomers(updated);
    mockCustomers.unshift(newC);
    customerApi.saveLocal(updated);
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'customer_registered' } }));
    showToast(`🎉 Thêm thành công khách hàng ${newC.hoTen}!`);
  }

  // Cập nhật thông tin khách hàng
  function handleSaveEdit(updated: Customer) {
    const numId = parseInt(updated.id.replace(/\D/g, ''), 10);
    if (!isNaN(numId)) {
      customerApi.update(numId, updated);
    }

    const updatedList = customers.map(c => c.id === updated.id ? updated : c);
    setCustomers(updatedList);
    customerApi.saveLocal(updatedList);

    const idx = mockCustomers.findIndex(c => c.id === updated.id);
    if (idx !== -1) {
      mockCustomers[idx] = updated;
    }

    try {
      const cur = localStorage.getItem('crm_current_customer');
      if (cur) {
        const parsed = JSON.parse(cur);
        if (parsed.id === updated.id || parsed.email === updated.email) {
          localStorage.setItem('crm_current_customer', JSON.stringify(updated));
        }
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'customer_updated' } }));
    showToast(`✅ Đã cập nhật thông tin khách hàng ${updated.hoTen}!`);
  }

  // Cấp lại mật khẩu khách hàng
  async function handleResetPassword(newPass: string) {
    if (!resetPassCust) return;
    await customerApi.changePassword(resetPassCust.email, newPass);
    const updatedList = customers.map(c => c.id === resetPassCust.id ? { ...c, matKhau: newPass } : c);
    setCustomers(updatedList);
    customerApi.saveLocal(updatedList);
    showToast(`🔑 Đã cập nhật mật khẩu mới cho ${resetPassCust.hoTen}!`);
    setResetPassCust(null);
  }

  // Xóa vĩnh viễn khách hàng
  async function handleDeleteCustomer(id: string) {
    const numId = parseInt(id.replace(/\D/g, ''), 10);
    if (!isNaN(numId)) {
      await customerApi.deleteCustomer(numId);
    }
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    customerApi.saveLocal(updated);

    const idx = mockCustomers.findIndex(c => c.id === id);
    if (idx !== -1) {
      mockCustomers.splice(idx, 1);
    }

    try {
      const cur = localStorage.getItem('crm_current_customer');
      if (cur) {
        const parsed = JSON.parse(cur);
        if (parsed.id === id) {
          localStorage.removeItem('crm_current_customer');
        }
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'customer_deleted', customerId: id } }));
    setDeletingCustId(null);
    showToast('🗑️ Đã xóa vĩnh viễn khách hàng và các dữ liệu liên quan khỏi hệ thống CRM!');
  }

  // Gia hạn bảo hành từ modal 360
  function handleRenewWarranty(vId: string, years: number) {
    const updated = renewVehicleWarranty(vId, years);
    if (updated) {
      const numVId = parseInt(vId.replace(/\D/g, ''), 10);
      if (!isNaN(numVId)) {
        vehicleApi.renewWarranty(numVId, updated.hanBaoHanh);
      }
      showToast(`🏍️ Đã gia hạn bảo hành ${years * 12} tháng thành công!`);
    }
  }

  const thSt: React.CSSProperties = { padding: '10px 16px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'var(--color-zinc-500)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' };
  const tdSt: React.CSSProperties = { padding: '13px 16px', fontSize: 13, color: 'var(--color-zinc-800)', borderTop: '1px solid var(--color-zinc-100)' };

  return (
    <div className="p-6 lg:p-8">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 bg-zinc-950 text-white rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-zinc-700 animate-in slide-in-from-top">
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="mb-6">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          QUẢN LÝ CRM KHÁCH HÀNG
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--color-zinc-500)' }}>
          Hồ sơ khách hàng 360°, phân loại giá trị vòng đời (CLV), quản lý phương tiện & bảo mật tài khoản
        </p>
      </div>

      {/* KPI strip - Customer CLV Tiers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Tổng khách hàng', count: customers.length, sub: 'Toàn hệ thống CRM', color: 'var(--color-zinc-900)', border: 'border-zinc-200' },
          { label: '👑 Khách VIP (≥ 10tr)', count: customers.filter(c => c.tongChiTieu >= 10000000).length, sub: 'Ưu tiên VIP & giảm 10%', color: '#7c3aed', border: 'border-purple-200' },
          { label: '⭐ Thân thiết (4 - 10tr)', count: customers.filter(c => c.tongChiTieu >= 4000000 && c.tongChiTieu < 10000000).length, sub: 'Tích điểm & giảm 5%', color: '#2563eb', border: 'border-blue-200' },
          { label: '🌱 Khách mới (< 4tr)', count: customers.filter(c => c.tongChiTieu < 4000000).length, sub: 'Cần chăm sóc & khảo sát', color: '#16a34a', border: 'border-green-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl px-5 py-3.5 bg-white border ${s.border} shadow-xs`}>
            <div className="flex items-center justify-between">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: '0.02em' }}>{s.count}</div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-zinc-100)', color: 'var(--color-zinc-600)' }}>
                {customers.length > 0 ? Math.round((s.count / customers.length) * 100) : 0}%
              </span>
            </div>
            <div className="text-xs font-bold mt-1 text-zinc-800">{s.label}</div>
            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-zinc-400)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            placeholder="Tìm tên, email, SĐT..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 8, border: '1.5px solid var(--color-zinc-200)', background: 'white', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--color-zinc-900)', outline: 'none' }}
          />
        </div>
        <select
          value={filterTier}
          onChange={e => { setFilterTier(e.target.value as CustomerTierType | 'All'); setPage(1); }}
          style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-zinc-200)', background: 'white', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-zinc-700)', outline: 'none', cursor: 'pointer' }}
        >
          <option value="All">Tất cả phân hạng CLV</option>
          <option value="VIP">👑 Khách VIP (≥ 10 triệu)</option>
          <option value="ThanThiet">⭐ Thân thiết (4 - 10 triệu)</option>
          <option value="Moi">🌱 Khách mới (&lt; 4 triệu)</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value as CustomerStatus | 'All'); setPage(1); }}
          style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-zinc-200)', background: 'white', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-zinc-700)', outline: 'none', cursor: 'pointer' }}
        >
          <option value="All">Tất cả trạng thái</option>
          <option value="HoatDong">Hoạt động</option>
          <option value="BiKhoa">Bị khóa (Chặn truy cập)</option>
        </select>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-700 text-white bg-red-700 hover:bg-red-800 transition shadow cursor-pointer"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', textTransform: 'uppercase' }}
        >
          + THÊM KHÁCH HÀNG
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden bg-white border border-zinc-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: 'var(--color-zinc-50)' }}>
                <th style={thSt}>Mã KH</th>
                <th style={thSt}>Khách hàng</th>
                <th style={thSt}>Liên hệ</th>
                <th style={thSt}>Chi tiêu & Hạng CLV</th>
                <th style={thSt}>Ngày đăng ký</th>
                <th style={thSt}>Trạng thái</th>
                <th style={{ ...thSt, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} style={{ ...tdSt, textAlign: 'center', color: 'var(--color-zinc-400)', padding: 40 }}>Không tìm thấy khách hàng phù hợp</td></tr>
              ) : paginated.map(c => {
                const custOrders = allOrders.filter(o =>
                  o.customerId === c.id ||
                  o.customerId === `KH${c.id}` ||
                  (c.soDienThoai && (o as any).soDienThoai === c.soDienThoai) ||
                  (c.email && o.email?.toLowerCase() === c.email.toLowerCase())
                );
                const completedSpent = custOrders
                  .filter(o => o.trangThai === 'HoanThanh' || (o.trangThai as any) === 'DaHoanThanh' || (o.trangThai as any) === 'Hoàn thành')
                  .reduce((sum, o) => sum + (o.tongTien || 0), 0);
                const realSpent = Math.max(c.tongChiTieu || 0, completedSpent);
                const tier = getCustomerTier(realSpent);
                return (
                  <tr
                    key={c.id}
                    id={`cust-row-${c.id}`}
                    onMouseEnter={e => {
                      if (highlightCustId !== c.id) e.currentTarget.style.background = 'var(--color-zinc-50)';
                    }}
                    onMouseLeave={e => {
                      if (highlightCustId !== c.id) e.currentTarget.style.background = 'white';
                    }}
                    style={{
                      transition: 'background 0.2s',
                      background: highlightCustId === c.id ? '#fef3c7' : 'white',
                    }}
                    className={highlightCustId === c.id ? 'ring-4 ring-red-600 ring-inset animate-pulse font-bold' : ''}
                  >
                    <td style={tdSt}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-zinc-600)', fontWeight: 700 }}>{c.id}</span>
                        {highlightCustId === c.id && (
                          <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-black uppercase tracking-wider animate-bounce shadow-sm">
                            ★ ĐANG XEM
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={tdSt}>
                      <div className="flex items-center gap-3">
                        {c.avatar ? (
                          <img
                            src={c.avatar}
                            alt={c.hoTen}
                            onError={(e) => {
                              // Fallback on broken image
                              e.currentTarget.src = '/images/KH/kh1.jpg';
                            }}
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-zinc-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-400 flex items-center justify-center shrink-0 font-bold" title="Chưa có avatar">
                            {c.hoTen.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div
                            onClick={() => setSelectedCustFor360(c)}
                            className="font-bold text-zinc-900 hover:text-red-700 cursor-pointer transition"
                            title="Bấm để xem Hồ sơ 360°"
                          >
                            {c.hoTen}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-zinc-400)' }}>
                            {c.gioiTinh === 'Nu' ? 'Nữ' : 'Nam'} · {c.ngaySinh || 'N/A'}
                          </div>

                          {/* Phương tiện khách hàng sở hữu */}
                          {(() => {
                            const cNum = parseInt(c.id.replace(/\D/g, ''), 10);
                            const custVehicles = allVehicles.filter(v => {
                              if (v.customerId === c.id) return true;
                              const vNum = parseInt(v.customerId.replace(/\D/g, ''), 10);
                              if (!isNaN(cNum) && !isNaN(vNum) && cNum === vNum) return true;
                              if (c.soXe && (c.soXe === v.id || c.soXe === v.bienSo)) return true;
                              return false;
                            });

                            if (custVehicles.length === 0) {
                              return <div className="text-[10px] text-zinc-400 italic mt-0.5">Chưa có xe</div>;
                            }

                            return (
                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 font-bold">
                                  🏍️ {custVehicles.length} xe
                                </span>
                                {custVehicles.map(v => (
                                  <span
                                    key={v.id}
                                    className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                      v.nguonGoc === 'CuaHang'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : 'bg-slate-100 text-slate-700 border-slate-300'
                                    }`}
                                    title={`${v.tenXe} (${v.bienSo}) - ${v.nguonGoc === 'CuaHang' ? 'Mua tại cửa hàng' : 'Xe ngoài hệ thống'}`}
                                  >
                                    {v.bienSo}
                                  </span>
                                ))}
                                {custVehicles.some(v => v.trangThaiDuyet === 'ChoDuyet') && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                    ⏳ Chờ duyệt
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </td>
                    <td style={tdSt}>
                      <div style={{ fontSize: 12 }}>{c.email}</div>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-zinc-500)' }}>{c.soDienThoai}</div>
                    </td>
                    <td style={tdSt}>
                      <div className="flex flex-col gap-1">
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--color-red-700)', letterSpacing: '0.02em' }}>
                          {formatVND(realSpent)}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold w-fit shadow-xs"
                          style={{ background: tier.badgeBg, color: tier.badgeColor, border: `1px solid ${tier.badgeBorder}`, fontFamily: 'var(--font-mono)' }}
                          title={`${tier.label}: ${tier.description}`}
                        >
                          {tier.shortLabel}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...tdSt, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-zinc-500)' }}>{c.ngayDangKy}</td>
                    <td style={tdSt}>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full text-xs font-bold px-2.5 py-1"
                        style={{
                          background: c.trangThai === 'HoatDong' ? '#dcfce7' : '#fee2e2',
                          color: c.trangThai === 'HoatDong' ? '#16a34a' : 'var(--color-red-700)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        <span className="rounded-full" style={{ width: 5, height: 5, background: 'currentColor', display: 'inline-block' }} />
                        {c.trangThai === 'HoatDong' ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td style={{ ...tdSt, textAlign: 'center' }}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedCustFor360(c)}
                          className="rounded-lg px-2.5 py-1 text-xs font-bold bg-zinc-900 text-white hover:bg-black transition cursor-pointer shadow-xs"
                          title="Xem hồ sơ 360°, đơn hàng, lịch hẹn, CLV"
                        >
                          👁️ 360°
                        </button>
                        <button
                          onClick={() => setEditingCust(c)}
                          className="rounded-lg px-2 py-1 text-xs font-600 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                          title="Sửa thông tin khách hàng"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          onClick={() => setResetPassCust(c)}
                          className="rounded-lg px-2 py-1 text-xs font-600 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition cursor-pointer"
                          title="Cấp lại mật khẩu tài khoản"
                        >
                          🔑 MK
                        </button>
                        <button
                          onClick={() => toggleStatus(c.id)}
                          className="rounded-lg px-2 py-1 text-xs font-600 transition-colors cursor-pointer"
                          style={{
                            background: c.trangThai === 'HoatDong' ? '#fef3c7' : '#dcfce7',
                            color: c.trangThai === 'HoatDong' ? '#b45309' : '#16a34a',
                          }}
                          title={c.trangThai === 'HoatDong' ? 'Khóa tài khoản (Chặn đăng nhập)' : 'Mở khóa tài khoản'}
                        >
                          {c.trangThai === 'HoatDong' ? '🔒 Khóa' : '🔓 Mở'}
                        </button>
                        <button
                          onClick={() => setDeletingCustId(c.id)}
                          className="rounded-lg px-2 py-1 text-xs font-600 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition cursor-pointer"
                          title="Xóa tài khoản vĩnh viễn"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200">
          <span className="text-xs text-zinc-500 font-mono">{filtered.length} khách hàng · trang {page}/{Math.max(totalPages, 1)}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded text-sm bg-zinc-100 border border-zinc-200 disabled:opacity-50 cursor-pointer"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded text-sm font-600 border cursor-pointer ${
                  p === page ? 'bg-red-700 text-white border-red-700' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded text-sm bg-zinc-100 border border-zinc-200 disabled:opacity-50 cursor-pointer"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={handleAddCustomer} />}

      {/* Edit Modal */}
      {editingCust && (
        <EditModal customer={editingCust} onClose={() => setEditingCust(null)} onSave={handleSaveEdit} />
      )}

      {/* Reset Password Modal */}
      {resetPassCust && (
        <ResetCustomerPasswordModal
          customer={resetPassCust}
          onClose={() => setResetPassCust(null)}
          onSave={handleResetPassword}
        />
      )}

      {/* Customer 360° Modal (H03) */}
      {selectedCustFor360 && (
        <Customer360Modal
          customer={selectedCustFor360}
          onClose={() => setSelectedCustFor360(null)}
          onEdit={() => {
            setEditingCust(selectedCustFor360);
            setSelectedCustFor360(null);
          }}
          onResetPassword={() => {
            setResetPassCust(selectedCustFor360);
            setSelectedCustFor360(null);
          }}
          onRenewWarranty={handleRenewWarranty}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingCustId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl mx-auto mb-3">⚠️</div>
            <h3 className="font-extrabold text-base text-zinc-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>XÁC NHẬN XÓA TÀI KHOẢN</h3>
            <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản khách hàng này khỏi hệ thống CRM không? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingCustId(null)} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 cursor-pointer">Hủy</button>
              <button onClick={() => handleDeleteCustomer(deletingCustId)} className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-700 text-white shadow cursor-pointer">Xóa ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
