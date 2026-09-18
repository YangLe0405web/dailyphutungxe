import { useState } from 'react';
import { mockOrders, mockAppointments, formatVND, type OrderStatus, type AppointmentStatus, type Order, type Appointment } from '../../data/mockData';

const orderStatuses: { key: OrderStatus; label: string; color: string; bg: string }[] = [
  { key: 'ChoDuyet', label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
  { key: 'DangGiao', label: 'Đang giao', color: '#2563eb', bg: '#dbeafe' },
  { key: 'HoanThanh', label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7' },
  { key: 'DaHuy', label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
];

const apptStatuses: { key: AppointmentStatus; label: string }[] = [
  { key: 'ChoDuyet', label: 'Chờ duyệt' },
  { key: 'DaXacNhan', label: 'Đã xác nhận' },
  { key: 'DangThucHien', label: 'Đang thực hiện' },
  { key: 'HoanThanh', label: 'Hoàn thành' },
  { key: 'DaHuy', label: 'Đã hủy' },
];

function StatusBadge({ status, configs }: { status: string; configs: { key: string; label: string; color: string; bg: string }[] }) {
  const cfg = configs.find(c => c.key === status) ?? { label: status, color: '#71717a', bg: '#f4f4f5' };
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full text-xs font-600 px-2.5 py-1"
      style={{ background: cfg.bg, color: cfg.color, fontFamily: 'var(--font-mono)' }}>
      <span className="rounded-full" style={{ width: 5, height: 5, background: cfg.color, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
}

const thSt: React.CSSProperties = { padding: '10px 16px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'var(--color-zinc-500)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' };
const tdSt: React.CSSProperties = { padding: '14px 16px', fontSize: 13, color: 'var(--color-zinc-800)', borderTop: '1px solid var(--color-zinc-100)' };

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'appointments'>('orders');
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);

  function updateOrderStatus(id: string, status: OrderStatus) {
    setOrders(os => os.map(o => o.id === id ? { ...o, trangThai: status } : o));
  }

  function updateApptStatus(id: string, status: AppointmentStatus) {
    setAppointments(as => as.map(a => a.id === id ? { ...a, trangThai: status } : a));
  }

  const statusCfgWithColor = orderStatuses;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>QUẢN LÝ BÁN HÀNG</div>
        <p className="text-sm mt-1" style={{ color: 'var(--color-zinc-500)' }}>Theo dõi đơn hàng và lịch hẹn dịch vụ</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[{ key: 'orders', label: `Đơn hàng (${orders.length})` }, { key: 'appointments', label: `Lịch hẹn (${appointments.length})` }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as typeof activeTab)}
            className="px-5 py-2.5 rounded-xl text-sm font-600 transition-all"
            style={{
              background: activeTab === t.key ? 'var(--color-zinc-950)' : 'white',
              color: activeTab === t.key ? 'white' : 'var(--color-zinc-600)',
              border: activeTab === t.key ? '1px solid var(--color-zinc-950)' : '1px solid var(--color-zinc-200)',
              cursor: 'pointer',
            }}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: 'var(--color-zinc-50)' }}>
                  <th style={thSt}>Mã đơn</th>
                  <th style={thSt}>Khách hàng</th>
                  <th style={thSt}>Ngày đặt</th>
                  <th style={thSt}>Sản phẩm</th>
                  <th style={thSt}>Tổng tiền</th>
                  <th style={thSt}>Trạng thái</th>
                  <th style={{ ...thSt, textAlign: 'center' }}>Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-zinc-50)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                    style={{ transition: 'background 0.1s' }}>
                    <td style={tdSt}><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-zinc-400)' }}>#{o.id}</span></td>
                    <td style={tdSt}>
                      <div className="font-500">{o.hoTenKH}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-zinc-400)', marginTop: 2 }}>{o.diaChiGiao.slice(0, 30)}…</div>
                    </td>
                    <td style={{ ...tdSt, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-zinc-500)' }}>{o.ngayDat}</td>
                    <td style={tdSt}>
                      <div style={{ fontSize: 12 }}>
                        {o.items.slice(0, 2).map((it, i) => <div key={i} style={{ color: 'var(--color-zinc-600)' }}>{it.tenSanPham} ×{it.soLuong}</div>)}
                        {o.items.length > 2 && <div style={{ color: 'var(--color-zinc-400)', fontSize: 11 }}>+{o.items.length - 2} thêm...</div>}
                      </div>
                    </td>
                    <td style={tdSt}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--color-red-700)', letterSpacing: '0.02em' }}>{formatVND(o.tongTien)}</span>
                    </td>
                    <td style={tdSt}><StatusBadge status={o.trangThai} configs={statusCfgWithColor} /></td>
                    <td style={{ ...tdSt, textAlign: 'center' }}>
                      <select value={o.trangThai}
                        onChange={e => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                        style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--color-zinc-200)', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-zinc-700)', background: 'white', cursor: 'pointer', outline: 'none' }}>
                        {orderStatuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: 'var(--color-zinc-50)' }}>
                  <th style={thSt}>Khách hàng</th>
                  <th style={thSt}>Dịch vụ</th>
                  <th style={thSt}>Ngày & Giờ</th>
                  <th style={thSt}>Xe</th>
                  <th style={thSt}>Ghi chú</th>
                  <th style={thSt}>Trạng thái</th>
                  <th style={{ ...thSt, textAlign: 'center' }}>Duyệt</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(a => {
                  const svcLabel = a.loaiDichVu === 'BaoDuong' ? 'Bảo dưỡng' : a.loaiDichVu === 'SuaChua' ? 'Sửa chữa' : 'Lái thử';
                  const svcCfg = [
                    { key: 'ChoDuyet', label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
                    { key: 'DaXacNhan', label: 'Đã xác nhận', color: '#2563eb', bg: '#dbeafe' },
                    { key: 'DangThucHien', label: 'Đang thực hiện', color: 'var(--color-red-700)', bg: '#fee2e2' },
                    { key: 'HoanThanh', label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7' },
                    { key: 'DaHuy', label: 'Đã hủy', color: '#71717a', bg: '#f4f4f5' },
                  ];
                  return (
                    <tr key={a.id}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-zinc-50)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                      style={{ transition: 'background 0.1s' }}>
                      <td style={tdSt}>
                        <div className="font-500">{a.hoTenKH}</div>
                        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-zinc-400)', marginTop: 2 }}>{a.soDienThoai}</div>
                      </td>
                      <td style={tdSt}>
                        <span className="inline-flex px-2 py-1 rounded-lg text-xs font-600"
                          style={{ background: a.loaiDichVu === 'BaoDuong' ? 'var(--color-zinc-100)' : a.loaiDichVu === 'SuaChua' ? 'var(--color-red-50)' : '#dbeafe', color: a.loaiDichVu === 'BaoDuong' ? 'var(--color-zinc-700)' : a.loaiDichVu === 'SuaChua' ? 'var(--color-red-800)' : '#1d4ed8', fontFamily: 'var(--font-mono)' }}>
                          {svcLabel}
                        </span>
                      </td>
                      <td style={{ ...tdSt, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        <div style={{ color: 'var(--color-zinc-700)' }}>{a.ngayHen}</div>
                        <div style={{ color: 'var(--color-red-700)', fontWeight: 600 }}>{a.gioHen}</div>
                      </td>
                      <td style={tdSt}>
                        {a.tenXe ? (
                          <>
                            <div style={{ fontSize: 12 }}>{a.tenXe}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-zinc-400)' }}>{a.bienSo}</div>
                          </>
                        ) : <span style={{ color: 'var(--color-zinc-300)' }}>—</span>}
                      </td>
                      <td style={{ ...tdSt, maxWidth: 180 }}>
                        <div style={{ fontSize: 12, color: 'var(--color-zinc-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.ghiChu || '—'}</div>
                      </td>
                      <td style={tdSt}><StatusBadge status={a.trangThai} configs={svcCfg} /></td>
                      <td style={{ ...tdSt, textAlign: 'center' }}>
                        {a.trangThai === 'ChoDuyet' ? (
                          <div className="flex gap-1.5 justify-center">
                            <button onClick={() => updateApptStatus(a.id, 'DaXacNhan')}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-600"
                              style={{ background: '#dcfce7', color: '#16a34a', border: 'none', cursor: 'pointer' }}>✓ Duyệt</button>
                            <button onClick={() => updateApptStatus(a.id, 'DaHuy')}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-600"
                              style={{ background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer' }}>✕ Hủy</button>
                          </div>
                        ) : (
                          <select value={a.trangThai}
                            onChange={e => updateApptStatus(a.id, e.target.value as AppointmentStatus)}
                            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--color-zinc-200)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-zinc-700)', background: 'white', cursor: 'pointer', outline: 'none' }}>
                            {apptStatuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
