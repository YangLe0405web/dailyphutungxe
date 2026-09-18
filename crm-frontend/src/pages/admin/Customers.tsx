import { useState, useMemo } from 'react';
import { mockCustomers, mockVehicles, renewVehicleWarranty, type Customer, type CustomerStatus, type Vehicle, formatVND } from '../../data/mockData';
import ImageUploader from '../../components/shared/ImageUploader';

const PAGE_SIZE = 8;

/* ── Modal Thêm khách hàng ── */
function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Customer) => void }) {
  const [form, setForm] = useState({
    hoTen: '', email: '', soDienThoai: '', diaChi: '', ngaySinh: '', gioiTinh: 'Nam' as 'Nam' | 'Nu', avatar: '',
    tenXe: '', bienSo: '', soKhung: '', mauSac: 'Đen bóng', namSanXuat: '2025', hinhAnhXe: '',
  });
  const [err, setErr] = useState<Partial<typeof form>>({});

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.hoTen.trim()) e.hoTen = 'Bắt buộc';
    if (!form.email.includes('@')) e.email = 'Email không hợp lệ';
    if (form.soDienThoai.length < 10) e.soDienThoai = 'Số điện thoại không hợp lệ';
    if (!form.diaChi.trim()) e.diaChi = 'Bắt buộc';
    if (!form.ngaySinh) e.ngaySinh = 'Bắt buộc';
    setErr(e);
    return !Object.keys(e).length;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const newCustId = `KH${Date.now().toString().slice(-4)}`;

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

    onAdd({
      id: newCustId,
      hoTen: form.hoTen,
      email: form.email,
      soDienThoai: form.soDienThoai,
      diaChi: form.diaChi,
      ngaySinh: form.ngaySinh,
      gioiTinh: form.gioiTinh,
      avatar: form.avatar || undefined,
      trangThai: 'HoatDong',
      ngayDangKy: new Date().toISOString().split('T')[0],
      soXe: '',
      tongChiTieu: 0,
    });
    onClose();
  }

  const inputSt: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-zinc-200)', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--color-zinc-900)', background: 'white', outline: 'none' };

  const field = (label: string, key: keyof typeof form, type = 'text', extra?: React.ReactNode) => (
    <div>
      <label className="block text-xs font-600 mb-1.5" style={{ color: 'var(--color-zinc-600)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {extra ?? <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ ...inputSt, borderColor: err[key] ? 'var(--color-red-500)' : 'var(--color-zinc-200)' }} />}
      {err[key] && <p className="text-xs mt-1" style={{ color: 'var(--color-red-600)' }}>{err[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(9,9,11,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-lg my-8 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-zinc-200)', background: 'var(--color-zinc-950)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase' }}>THÊM KHÁCH HÀNG</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>Điền đầy đủ thông tin cá nhân & xe</div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white bg-zinc-800 rounded-lg w-8 h-8 flex items-center justify-center font-bold text-lg">✕</button>
        </div>
        <form onSubmit={submit} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {field('Họ và tên *', 'hoTen')}
            {field('Ngày sinh *', 'ngaySinh', 'date')}
          </div>
          {field('Email *', 'email', 'email')}
          {field('Số điện thoại *', 'soDienThoai', 'tel')}
          {field('Địa chỉ *', 'diaChi')}
          {field('Giới tính', 'gioiTinh', 'text',
            <select value={form.gioiTinh} onChange={e => setForm(f => ({...f, gioiTinh: e.target.value as 'Nam' | 'Nu'}))} style={{ ...inputSt, cursor: 'pointer' }}>
              <option value="Nam">Nam</option><option value="Nu">Nữ</option>
            </select>
          )}

          <ImageUploader
            value={form.avatar}
            onChange={url => setForm(f => ({ ...f, avatar: url }))}
            label="Ảnh đại diện Avatar tài khoản"
          />

          {/* Optional Vehicle Registration */}
          <div className="pt-3 border-t border-zinc-200">
            <div className="text-xs font-bold text-zinc-900 mb-2 uppercase flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
              <span>🏍️ THÔNG TIN XE SỞ HỮU (TÙY CHỌN)</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-zinc-600)' }}>TÊN XE / MẪU XE</label>
                <input
                  type="text"
                  placeholder="VD: Honda SH 160i ABS"
                  value={form.tenXe}
                  onChange={e => setForm(f => ({ ...f, tenXe: e.target.value }))}
                  style={inputSt}
                />
              </div>
              <div>
                <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-zinc-600)' }}>BIỂN SỐ XE</label>
                <input
                  type="text"
                  placeholder="VD: 51K-12345"
                  value={form.bienSo}
                  onChange={e => setForm(f => ({ ...f, bienSo: e.target.value }))}
                  style={inputSt}
                />
              </div>
              <div>
                <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-zinc-600)' }}>SỐ KHUNG (VIN)</label>
                <input
                  type="text"
                  placeholder="VD: RLHKC110JA..."
                  value={form.soKhung}
                  onChange={e => setForm(f => ({ ...f, soKhung: e.target.value }))}
                  style={inputSt}
                />
              </div>
              <div>
                <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-zinc-600)' }}>MÀU SẮC</label>
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

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--color-zinc-200)', background: 'white', color: 'var(--color-zinc-700)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Hủy</button>
            <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--color-red-700)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>THÊM KHÁCH HÀNG</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal Sửa thông tin khách hàng ── */
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

  const inputSt: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-zinc-200)', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--color-zinc-900)', background: 'white', outline: 'none' };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.hoTen.trim() || !form.email.trim() || !form.soDienThoai.trim()) return;
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
          <button onClick={onClose} className="text-zinc-400 hover:text-white bg-zinc-800 rounded-lg w-8 h-8 flex items-center justify-center font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Họ và tên *</label>
              <input type="text" required value={form.hoTen} onChange={e => setForm({ ...form, hoTen: e.target.value })} style={inputSt} />
            </div>
            <div>
              <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Ngày sinh</label>
              <input type="date" value={form.ngaySinh} onChange={e => setForm({ ...form, ngaySinh: e.target.value })} style={inputSt} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Email *</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputSt} />
            </div>
            <div>
              <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Số điện thoại *</label>
              <input type="tel" required value={form.soDienThoai} onChange={e => setForm({ ...form, soDienThoai: e.target.value })} style={inputSt} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-600 mb-1 text-zinc-600 uppercase">Địa chỉ</label>
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
                <option value="BiKhoa">Bị khóa</option>
              </select>
            </div>
          </div>

          <ImageUploader
            value={form.avatar}
            onChange={url => setForm(f => ({ ...f, avatar: url }))}
            label="Ảnh đại diện Avatar tài khoản"
          />

          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 bg-white">Hủy</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-800 shadow transition" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
              CẬP NHẬT THÔNG TIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState(mockCustomers);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<CustomerStatus | 'All'>('All');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [deletingCustId, setDeletingCustId] = useState<string | null>(null);
  const [selectedCustForVehicle, setSelectedCustForVehicle] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(c =>
      (filterStatus === 'All' || c.trangThai === filterStatus) &&
      (!q || c.hoTen.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.soDienThoai.includes(q))
    );
  }, [customers, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleStatus(id: string) {
    setCustomers(cs => {
      const updated = cs.map(c => c.id === id ? { ...c, trangThai: c.trangThai === 'HoatDong' ? ('BiKhoa' as CustomerStatus) : ('HoatDong' as CustomerStatus) } : c);
      const target = updated.find(x => x.id === id);
      const originalMock = mockCustomers.find(x => x.id === id);
      if (originalMock && target) {
        originalMock.trangThai = target.trangThai;
      }
      return updated;
    });
  }

  function handleSaveEdit(updated: Customer) {
    setCustomers(cs => cs.map(c => c.id === updated.id ? updated : c));
    const idx = mockCustomers.findIndex(c => c.id === updated.id);
    if (idx !== -1) {
      mockCustomers[idx] = updated;
    }
  }

  function handleDeleteCustomer(id: string) {
    setCustomers(cs => cs.filter(c => c.id !== id));
    const idx = mockCustomers.findIndex(c => c.id === id);
    if (idx !== -1) {
      mockCustomers.splice(idx, 1);
    }
    setDeletingCustId(null);
  }

  const thSt: React.CSSProperties = { padding: '10px 16px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'var(--color-zinc-500)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' };
  const tdSt: React.CSSProperties = { padding: '13px 16px', fontSize: 13, color: 'var(--color-zinc-800)', borderTop: '1px solid var(--color-zinc-100)' };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>QUẢN LÝ CRM KHÁCH HÀNG</div>
        <p className="text-sm mt-1" style={{ color: 'var(--color-zinc-500)' }}>Danh sách tài khoản khách hàng, sửa xóa & quản lý bảo hành điện tử</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Tổng khách hàng', value: customers.length, color: 'var(--color-zinc-900)' },
          { label: 'Đang hoạt động', value: customers.filter(c => c.trangThai === 'HoatDong').length, color: '#16a34a' },
          { label: 'Bị khóa', value: customers.filter(c => c.trangThai === 'BiKhoa').length, color: 'var(--color-red-700)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-5 py-4 bg-white border border-zinc-200 shadow-sm">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '0.02em' }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-zinc-400)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Tìm tên, email, SĐT..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 8, border: '1.5px solid var(--color-zinc-200)', background: 'white', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--color-zinc-900)', outline: 'none' }} />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as CustomerStatus | 'All'); setPage(1); }}
          style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-zinc-200)', background: 'white', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-zinc-700)', outline: 'none', cursor: 'pointer' }}>
          <option value="All">Tất cả trạng thái</option>
          <option value="HoatDong">Hoạt động</option>
          <option value="BiKhoa">Bị khóa</option>
        </select>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-700 text-white bg-red-700 hover:bg-red-800 transition shadow"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
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
                <th style={thSt}>Chi tiêu</th>
                <th style={thSt}>Ngày đăng ký</th>
                <th style={thSt}>Trạng thái</th>
                <th style={{ ...thSt, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} style={{ ...tdSt, textAlign: 'center', color: 'var(--color-zinc-400)', padding: 40 }}>Không tìm thấy khách hàng</td></tr>
              ) : paginated.map(c => (
                <tr key={c.id}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-zinc-50)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  style={{ transition: 'background 0.1s' }}>
                  <td style={tdSt}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-zinc-400)' }}>{c.id}</span></td>
                  <td style={tdSt}>
                    <div className="flex items-center gap-3">
                      {c.avatar ? (
                        <img src={c.avatar} alt={c.hoTen} className="w-8 h-8 rounded-full object-cover shrink-0 border border-zinc-200" />
                      ) : (
                        <div className="flex items-center justify-center rounded-full text-sm font-700 shrink-0"
                          style={{ width: 34, height: 34, background: 'var(--color-red-700)', color: 'white', fontFamily: 'var(--font-display)' }}>
                          {c.hoTen[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-500">{c.hoTen}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-zinc-400)' }}>{c.gioiTinh} · {c.ngaySinh}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdSt}>
                    <div style={{ fontSize: 12 }}>{c.email}</div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-zinc-500)' }}>{c.soDienThoai}</div>
                  </td>
                  <td style={tdSt}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--color-red-700)', letterSpacing: '0.02em' }}>{formatVND(c.tongChiTieu)}</span>
                  </td>
                  <td style={{ ...tdSt, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-zinc-500)' }}>{c.ngayDangKy}</td>
                  <td style={tdSt}>
                    <span className="inline-flex items-center gap-1.5 rounded-full text-xs font-600 px-2.5 py-1"
                      style={{ background: c.trangThai === 'HoatDong' ? '#dcfce7' : '#fee2e2', color: c.trangThai === 'HoatDong' ? '#16a34a' : 'var(--color-red-700)', fontFamily: 'var(--font-mono)' }}>
                      <span className="rounded-full" style={{ width: 5, height: 5, background: 'currentColor', display: 'inline-block' }} />
                      {c.trangThai === 'HoatDong' ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </td>
                  <td style={{ ...tdSt, textAlign: 'center' }}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => setSelectedCustForVehicle(c)}
                        className="rounded-lg px-2 py-1 text-xs font-600 bg-zinc-100 text-zinc-800 border border-zinc-200 hover:bg-zinc-200 transition"
                        title="Xe & Bảo hành"
                      >
                        🏍️ Xe
                      </button>
                      <button onClick={() => setEditingCust(c)}
                        className="rounded-lg px-2 py-1 text-xs font-600 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
                        title="Sửa thông tin khách hàng"
                      >
                        ✏️ Sửa
                      </button>
                      <button onClick={() => toggleStatus(c.id)}
                        className="rounded-lg px-2 py-1 text-xs font-600 transition-colors"
                        style={{ background: c.trangThai === 'HoatDong' ? '#fef3c7' : '#dcfce7', color: c.trangThai === 'HoatDong' ? '#b45309' : '#16a34a' }}
                        title={c.trangThai === 'HoatDong' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        {c.trangThai === 'HoatDong' ? '🔒 Khóa' : '🔓 Mở'}
                      </button>
                      <button onClick={() => setDeletingCustId(c.id)}
                        className="rounded-lg px-2 py-1 text-xs font-600 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition"
                        title="Xóa tài khoản"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200">
          <span className="text-xs text-zinc-500 font-mono">{filtered.length} khách hàng · trang {page}/{Math.max(totalPages, 1)}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded text-sm bg-zinc-100 border border-zinc-200 disabled:opacity-50">←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded text-sm font-600 border ${p === page ? 'bg-red-700 text-white border-red-700' : 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded text-sm bg-zinc-100 border border-zinc-200 disabled:opacity-50">→</button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={c => setCustomers(cs => [c, ...cs])} />}
      
      {/* Edit Modal */}
      {editingCust && (
        <EditModal customer={editingCust} onClose={() => setEditingCust(null)} onSave={handleSaveEdit} />
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
              <button onClick={() => setDeletingCustId(null)} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700">Hủy</button>
              <button onClick={() => handleDeleteCustomer(deletingCustId)} className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-700 text-white shadow">Xóa ngay</button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {selectedCustForVehicle && (
        <VehicleModal customer={selectedCustForVehicle} onClose={() => setSelectedCustForVehicle(null)} />
      )}
    </div>
  );
}

function VehicleModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => mockVehicles.filter(v => v.customerId === customer.id));
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleRenew = (vId: string, years: number) => {
    const updated = renewVehicleWarranty(vId, years);
    if (updated) {
      setVehicles(prev => prev.map(x => x.id === vId ? { ...updated } : x));
      setToastMsg(`Gia hạn thành công ${years * 12} tháng cho xe ${updated.tenXe} (${updated.bienSo})!`);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(9,9,11,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-xl bg-white overflow-hidden border border-zinc-200">
        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-zinc-200)', background: 'var(--color-zinc-950)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              🏍️ XE SỞ HỮU & BẢO HÀNH ĐIỆN TỬ
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-zinc-400)', fontFamily: 'var(--font-mono)' }}>
              Khách hàng: {customer.hoTen} ({customer.soDienThoai})
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg w-8 h-8 flex items-center justify-center text-zinc-400 bg-zinc-800 hover:text-white transition font-bold text-lg">✕</button>
        </div>

        <div className="p-6">
          {toastMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
              <span>{toastMsg}</span>
              <button onClick={() => setToastMsg(null)} className="text-emerald-600 font-bold">✕</button>
            </div>
          )}

          {vehicles.length === 0 ? (
            <div className="text-center py-10 text-zinc-400 text-sm">
              Khách hàng chưa đăng ký phương tiện nào trên hệ thống
            </div>
          ) : (
            <div className="space-y-4">
              {vehicles.map(v => {
                const isConHan = v.trangThaiBaoHanh === 'ConHan';
                return (
                  <div key={v.id} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-zinc-900 text-base">{v.tenXe}</div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{v.bienSo} • Màu: {v.mauSac} • Đời: {v.namSanXuat}</div>
                        <div className="text-xs text-zinc-400 font-mono mt-0.5">Số khung (VIN): {v.soKhung}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${isConHan ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {isConHan ? '✓ Còn hiệu lực' : '✕ Đã hết hạn'}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-zinc-200 flex items-center justify-between flex-wrap gap-2">
                      <div className="text-xs text-zinc-600 font-mono">
                        Hạn bảo hành: <strong className={isConHan ? 'text-zinc-900' : 'text-red-600'}>{v.hanBaoHanh}</strong>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRenew(v.id, 1)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow-sm transition"
                        >
                          + Gia hạn 12 tháng
                        </button>
                        <button
                          onClick={() => handleRenew(v.id, 2)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm transition"
                        >
                          + Gia hạn 24 tháng
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-200 text-zinc-800 hover:bg-zinc-300"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

