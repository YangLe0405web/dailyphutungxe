import { useState, useMemo } from 'react';
import { mockCustomers, type Customer, type CustomerStatus, formatVND } from '../../data/mockData';

const PAGE_SIZE = 8;

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Customer) => void }) {
  const [form, setForm] = useState({ hoTen: '', email: '', soDienThoai: '', diaChi: '', ngaySinh: '', gioiTinh: 'Nam' as 'Nam' | 'Nu' });
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
    onAdd({ id: `KH${Date.now().toString().slice(-4)}`, ...form, trangThai: 'HoatDong', ngayDangKy: new Date().toISOString().split('T')[0], soXe: '', tongChiTieu: 0 });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(9,9,11,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-lg" style={{ background: 'white' }}>
        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-zinc-200)', background: 'var(--color-zinc-950)', borderRadius: '16px 16px 0 0' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase' }}>THÊM KHÁCH HÀNG</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>Điền đầy đủ thông tin</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--color-zinc-800)', border: 'none', color: 'var(--color-zinc-400)', cursor: 'pointer', borderRadius: 8, width: 32, height: 32, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
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
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--color-zinc-200)', background: 'white', color: 'var(--color-zinc-700)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Hủy</button>
            <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--color-red-700)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>THÊM KHÁCH HÀNG</button>
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
    setCustomers(cs => cs.map(c => c.id === id ? { ...c, trangThai: c.trangThai === 'HoatDong' ? 'BiKhoa' : 'HoatDong' } : c));
  }

  const thSt: React.CSSProperties = { padding: '10px 16px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'var(--color-zinc-500)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' };
  const tdSt: React.CSSProperties = { padding: '13px 16px', fontSize: 13, color: 'var(--color-zinc-800)', borderTop: '1px solid var(--color-zinc-100)' };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>QUẢN LÝ CRM</div>
        <p className="text-sm mt-1" style={{ color: 'var(--color-zinc-500)' }}>Danh sách khách hàng và thông tin tài khoản</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Tổng khách hàng', value: customers.length, color: 'var(--color-zinc-900)' },
          { label: 'Đang hoạt động', value: customers.filter(c => c.trangThai === 'HoatDong').length, color: '#16a34a' },
          { label: 'Bị khóa', value: customers.filter(c => c.trangThai === 'BiKhoa').length, color: 'var(--color-red-700)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-5 py-4" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
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
          <option value="All">Tất cả</option>
          <option value="HoatDong">Hoạt động</option>
          <option value="BiKhoa">Bị khóa</option>
        </select>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-700 text-white"
          style={{ background: 'var(--color-red-700)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          + THÊM KHÁCH HÀNG
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
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
                      <div className="flex items-center justify-center rounded-full text-sm font-700 shrink-0"
                        style={{ width: 34, height: 34, background: 'var(--color-red-700)', color: 'white', fontFamily: 'var(--font-display)' }}>
                        {c.hoTen[0]}
                      </div>
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
                    <button onClick={() => toggleStatus(c.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-600 transition-colors"
                      style={{ background: c.trangThai === 'HoatDong' ? '#fee2e2' : '#dcfce7', color: c.trangThai === 'HoatDong' ? 'var(--color-red-700)' : '#16a34a', border: 'none', cursor: 'pointer' }}>
                      {c.trangThai === 'HoatDong' ? '🔒 Khóa' : '🔓 Mở khóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: 'var(--color-zinc-200)' }}>
          <span className="text-xs" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>{filtered.length} khách hàng · trang {page}/{Math.max(totalPages, 1)}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded text-sm" style={{ background: 'var(--color-zinc-100)', color: page === 1 ? 'var(--color-zinc-300)' : 'var(--color-zinc-700)', border: '1px solid var(--color-zinc-200)', cursor: page === 1 ? 'default' : 'pointer' }}>←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className="w-8 h-8 rounded text-sm font-600"
                style={{ background: p === page ? 'var(--color-red-700)' : 'var(--color-zinc-100)', color: p === page ? 'white' : 'var(--color-zinc-700)', border: '1px solid var(--color-zinc-200)', cursor: 'pointer' }}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded text-sm" style={{ background: 'var(--color-zinc-100)', color: page >= totalPages ? 'var(--color-zinc-300)' : 'var(--color-zinc-700)', border: '1px solid var(--color-zinc-200)', cursor: page >= totalPages ? 'default' : 'pointer' }}>→</button>
          </div>
        </div>
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={c => setCustomers(cs => [c, ...cs])} />}
    </div>
  );
}
