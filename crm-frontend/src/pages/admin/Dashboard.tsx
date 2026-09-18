import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import {
  mockCustomers,
  mockOrders,
  mockAppointments,
  serviceDistribution,
  dailyRevenueData,
  weeklyRevenueData,
  monthlyRevenueData,
  yearlyRevenueData,
  revenueBySource,
  formatVND
} from '../../data/mockData';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

function KpiCard({ label, value, sub, accent, icon }: { label: string; value: string | number; sub: string; accent: string; icon: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-2xl">{icon}</div>
        <div className="text-xs font-600 rounded-full px-2.5 py-1" style={{ background: accent + '22', color: accent, fontFamily: 'var(--font-mono)' }}>{sub}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: accent, letterSpacing: '0.02em', lineHeight: 1 }}>{value}</div>
      <div className="mt-1.5 text-sm font-500" style={{ color: 'var(--color-zinc-600)' }}>{label}</div>
    </div>
  );
}

const RADIAN = Math.PI / 180;
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.07) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>{(percent * 100).toFixed(0)}%</text>;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodType>('monthly');

  const pendingOrders = mockOrders.filter(o => o.trangThai === 'ChoDuyet').length;
  const pendingAppts = mockAppointments.filter(a => a.trangThai === 'ChoDuyet').length;

  const chartData = period === 'daily'
    ? dailyRevenueData
    : period === 'weekly'
    ? weeklyRevenueData
    : period === 'monthly'
    ? monthlyRevenueData
    : yearlyRevenueData;

  const currentTotalRevenue = chartData.reduce((sum, d) => sum + d.doanhThu, 0);

  const periodLabelMap: Record<PeriodType, string> = {
    daily: '7 ngày qua',
    weekly: '4 tuần gần đây',
    monthly: '7 tháng gần đây',
    yearly: '3 năm qua',
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header with period toggle */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            DASHBOARD
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--color-zinc-500)' }}>Tổng quan hệ thống & thống kê doanh thu đa dạng</p>
        </div>

        {/* Period Selector Buttons */}
        <div className="inline-flex rounded-xl p-1 bg-zinc-100 border border-zinc-200">
          <button
            onClick={() => setPeriod('daily')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-600 transition-all ${period === 'daily' ? 'bg-red-700 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
          >
            Theo Ngày
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-600 transition-all ${period === 'weekly' ? 'bg-red-700 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
          >
            Theo Tuần
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-600 transition-all ${period === 'monthly' ? 'bg-red-700 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
          >
            Theo Tháng
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-600 transition-all ${period === 'yearly' ? 'bg-red-700 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
          >
            Theo Năm
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Tổng khách hàng" value={mockCustomers.length} sub="Đã đăng ký" accent="var(--color-red-700)" icon="👥" />
        <KpiCard label="Đơn hàng chờ duyệt" value={pendingOrders} sub="Tổng số đơn" accent="#2563eb" icon="📦" />
        <KpiCard label="Lịch hẹn chờ duyệt" value={pendingAppts} sub="Cần xác nhận" accent="#d97706" icon="📅" />
        <KpiCard label={`Doanh thu (${periodLabelMap[period]})`} value={formatVND(currentTotalRevenue)} sub="Tổng doanh thu" accent="var(--color-success)" icon="💰" />
      </div>

      {/* Breakdown by Revenue Source */}
      <div className="mb-6 rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>
          CƠ CẤU DOANH THU THEO NGUỒN NGUỒN
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {revenueBySource.map((item, i) => (
            <div key={i} className="p-4 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--color-zinc-200)', background: 'var(--color-zinc-50)' }}>
              <div>
                <div className="text-xs font-600" style={{ color: 'var(--color-zinc-500)' }}>{item.source}</div>
                <div className="text-lg font-800 mt-1" style={{ color: item.color, fontFamily: 'var(--font-display)' }}>{formatVND(item.amount)}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-700" style={{ background: item.color + '20', color: item.color }}>
                {item.percent}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Line chart — 2/3 */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                BIỂU ĐỒ DOANH THU ({periodLabelMap[period].toUpperCase()})
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>Đơn vị: VNĐ</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-zinc-100)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--color-zinc-500)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => v >= 1000000000 ? `${(v / 1000000000).toFixed(1)}B` : `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--color-zinc-400)' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [formatVND(Number(v)), 'Doanh thu']}
                contentStyle={{ fontFamily: 'var(--font-sans)', borderRadius: 10, border: '1px solid var(--color-zinc-200)', fontSize: 13 }}
              />
              <Line type="monotone" dataKey="doanhThu" name="Doanh thu" stroke="var(--color-red-700)" strokeWidth={2.5} dot={{ fill: 'var(--color-red-700)', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie — 1/3 */}
        <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>
            TỶ LỆ DỊCH VỤ
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>Loại dịch vụ khách đặt nhiều nhất</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={serviceDistribution} cx="50%" cy="50%" outerRadius={85} dataKey="value" labelLine={false} label={PieLabel}>
                {serviceDistribution.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, 'Tỷ lệ']} contentStyle={{ fontFamily: 'var(--font-sans)', borderRadius: 10, fontSize: 13, border: '1px solid var(--color-zinc-200)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-sans)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent orders & appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-zinc-200)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>ĐƠN HÀNG GẦN ĐÂY</div>
            <span className="text-xs font-600 rounded-full px-2 py-1" style={{ background: 'var(--color-red-50)', color: 'var(--color-red-700)' }}>{mockOrders.filter(o => o.trangThai === 'ChoDuyet').length} chờ duyệt</span>
          </div>
          {mockOrders.slice(0, 4).map(o => (
            <div key={o.id} className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--color-zinc-50)' }}>
              <div>
                <div className="text-sm font-500" style={{ color: 'var(--color-zinc-900)' }}>{o.hoTenKH}</div>
                <div className="text-xs" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>#{o.id} · {o.ngayDat}</div>
              </div>
              <div className="text-right">
                <div className="font-700 text-sm" style={{ color: 'var(--color-red-700)', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>{formatVND(o.tongTien)}</div>
                <div className="text-xs rounded-full px-2 py-0.5 mt-1 font-600"
                  style={{ background: o.trangThai === 'ChoDuyet' ? '#fef3c7' : o.trangThai === 'DangGiao' ? '#dbeafe' : '#dcfce7', color: o.trangThai === 'ChoDuyet' ? '#92400e' : o.trangThai === 'DangGiao' ? '#1d4ed8' : '#15803d', fontFamily: 'var(--font-mono)' }}>
                  {o.trangThai === 'ChoDuyet' ? 'Chờ duyệt' : o.trangThai === 'DangGiao' ? 'Đang giao' : 'Hoàn thành'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl" style={{ background: 'white', border: '1px solid var(--color-zinc-200)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-zinc-200)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>LỊCH HẸN GẦN ĐÂY</div>
          </div>
          {mockAppointments.slice(0, 4).map(a => (
            <div key={a.id} className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--color-zinc-50)' }}>
              <div>
                <div className="text-sm font-500" style={{ color: 'var(--color-zinc-900)' }}>{a.hoTenKH}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-zinc-500)' }}>
                  {a.loaiDichVu === 'BaoDuong' ? 'Bảo dưỡng' : a.loaiDichVu === 'SuaChua' ? 'Sửa chữa' : 'Lái thử'} · {a.gioHen}
                </div>
              </div>
              <span className="text-xs font-600 rounded-full px-2.5 py-1"
                style={{ background: a.trangThai === 'ChoDuyet' ? '#fef3c7' : a.trangThai === 'DaXacNhan' ? '#dbeafe' : '#dcfce7', color: a.trangThai === 'ChoDuyet' ? '#92400e' : a.trangThai === 'DaXacNhan' ? '#1d4ed8' : '#15803d', fontFamily: 'var(--font-mono)' }}>
                {a.trangThai === 'ChoDuyet' ? 'Chờ duyệt' : a.trangThai === 'DaXacNhan' ? 'Đã xác nhận' : 'Hoàn thành'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
