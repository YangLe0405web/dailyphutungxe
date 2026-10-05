import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import {
  type Customer,
  type Order,
  type InsuranceContract,
  INSURANCE_PACKAGES,
  serviceDistribution,
  dailyRevenueData,
  weeklyRevenueData,
  monthlyRevenueData,
  yearlyRevenueData,
  revenueBySource,
  formatVND
} from '../../data/mockData';
import { customerApi, orderApi, insuranceApi } from '../../services/api';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

const RADIAN = Math.PI / 180;
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.07) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>{(percent * 100).toFixed(0)}%</text>;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [insContracts, setInsContracts] = useState<InsuranceContract[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [cList, oList, iList] = await Promise.all([
          customerApi.getAll(),
          orderApi.getAll(),
          insuranceApi.getAll(),
        ]);
        setCustomers(cList);
        setOrders(oList);
        setInsContracts(iList);
      } catch (err) {
        console.warn('Reports load error:', err);
      }
    };
    load();
    window.addEventListener('crm-data-refresh', load);
    return () => window.removeEventListener('crm-data-refresh', load);
  }, []);

  // Tính toán tỷ lệ độ tuổi thực tế từ danh sách khách hàng CRM
  const ageDistributionData = useMemo(() => {
    if (customers.length === 0) return [
      { name: 'Dưới 25 tuổi', value: 25, fill: '#dc2626' },
      { name: '25 – 40 tuổi', value: 55, fill: '#2563eb' },
      { name: 'Trên 40 tuổi', value: 20, fill: '#16a34a' },
    ];

    const currentYear = new Date().getFullYear();
    let under25 = 0;
    let from25to40 = 0;
    let over40 = 0;

    customers.forEach(c => {
      const bYear = c.ngaySinh ? new Date(c.ngaySinh).getFullYear() : 1995;
      const age = currentYear - (isNaN(bYear) ? 1995 : bYear);
      if (age < 25) under25++;
      else if (age <= 40) from25to40++;
      else over40++;
    });

    const total = customers.length;
    const u25Pct = Math.round((under25 / total) * 100);
    const midPct = Math.round((from25to40 / total) * 100);
    const o40Pct = Math.max(0, 100 - u25Pct - midPct);

    return [
      { name: `Dưới 25 tuổi (${under25} KH)`, value: u25Pct, fill: '#dc2626' },
      { name: `25 – 40 tuổi (${from25to40} KH)`, value: midPct, fill: '#2563eb' },
      { name: `Trên 40 tuổi (${over40} KH)`, value: o40Pct, fill: '#16a34a' },
    ];
  }, [customers]);

  // Tính toán tỷ lệ sở thích & nhu cầu từ thông tin sở thích khách hàng
  const preferenceDistributionData = useMemo(() => {
    if (customers.length === 0) return [
      { name: 'Tiết kiệm / Đi làm', value: 42, fill: '#2563eb' },
      { name: 'Thể thao / Đi phượt', value: 33, fill: '#dc2626' },
      { name: 'Tay ga cao cấp', value: 17, fill: '#d97706' },
      { name: 'Xe điện thông minh', value: 8, fill: '#10b981' },
    ];

    let commuteCount = 0;
    let sportCount = 0;
    let scooterCount = 0;
    let electricCount = 0;

    customers.forEach(c => {
      const st = (c.soThich || '').toLowerCase();
      if (st.includes('điện') || st.includes('công nghệ') || st.includes('xanh')) electricCount++;
      else if (st.includes('phượt') || st.includes('thể thao') || st.includes('côn tay') || st.includes('độ')) sportCount++;
      else if (st.includes('tay ga') || st.includes('cao cấp') || st.includes('thời trang') || st.includes('ý')) scooterCount++;
      else commuteCount++;
    });

    const total = customers.length;
    const commutePct = Math.max(5, Math.round((commuteCount / total) * 100));
    const sportPct = Math.max(5, Math.round((sportCount / total) * 100));
    const scooterPct = Math.max(5, Math.round((scooterCount / total) * 100));
    const electricPct = Math.max(0, 100 - commutePct - sportPct - scooterPct);

    return [
      { name: `Tiết kiệm / Đi làm (${commuteCount} KH)`, value: commutePct, fill: '#2563eb' },
      { name: `Thể thao / Đi phượt (${sportCount} KH)`, value: sportPct, fill: '#dc2626' },
      { name: `Tay ga cao cấp (${scooterCount} KH)`, value: scooterPct, fill: '#d97706' },
      { name: `Xe điện thông minh (${electricCount} KH)`, value: electricPct, fill: '#10b981' },
    ];
  }, [customers]);

  const chartData = period === 'daily'
    ? dailyRevenueData
    : period === 'weekly'
    ? weeklyRevenueData
    : period === 'monthly'
    ? monthlyRevenueData
    : yearlyRevenueData;

  const currentTotalRevenue = chartData.reduce((sum, d) => sum + d.doanhThu, 0);

  // BHX05: Thống kê & Báo cáo doanh thu Bảo hiểm xe
  const insuranceMetrics = useMemo(() => {
    const activeContracts = insContracts.filter(c => c.trangThai === 'HieuLuc');
    const totalRevenue = activeContracts.reduce((sum, c) => sum + c.phiBaoHiem, 0);
    const activeCount = activeContracts.length;
    const pendingCount = insContracts.filter(c => c.trangThai === 'ChoDuyet').length;
    const avgContractValue = activeCount > 0 ? Math.round(totalRevenue / activeCount) : 0;

    // Phân bổ doanh thu theo gói bảo hiểm (Pie Chart)
    const packageColors: Record<string, string> = {
      TNDS_BAT_BUOC: '#dc2626',
      VAT_CHAT_XE: '#2563eb',
      TAI_NAN_NGUOI: '#16a34a',
      TOAN_DIEN: '#d97706',
    };

    const packageStats = INSURANCE_PACKAGES.map(pkg => {
      const pkgContracts = activeContracts.filter(c => c.packageType === pkg.id);
      const rev = pkgContracts.reduce((sum, c) => sum + c.phiBaoHiem, 0);
      const count = pkgContracts.length;
      const pct = totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0;
      return {
        key: pkg.id,
        name: pkg.tenGoi,
        giaGoc: pkg.phi1Nam,
        revenue: rev,
        count,
        value: pct,
        fill: packageColors[pkg.id] || '#71717a',
      };
    });

    // Doanh thu bảo hiểm theo chu kỳ thời gian (Line Chart)
    const timelineData = period === 'daily'
      ? [
          { label: 'T2', doanhThu: 132000 },
          { label: 'T3', doanhThu: 450000 },
          { label: 'T4', doanhThu: 198000 },
          { label: 'T5', doanhThu: 520000 },
          { label: 'T6', doanhThu: 264000 },
          { label: 'T7', doanhThu: 970000 },
          { label: 'CN', doanhThu: 652000 },
        ]
      : period === 'weekly'
      ? [
          { label: 'Tuần 1', doanhThu: 1250000 },
          { label: 'Tuần 2', doanhThu: 1890000 },
          { label: 'Tuần 3', doanhThu: 1420000 },
          { label: 'Tuần 4', doanhThu: 2180000 },
        ]
      : period === 'monthly'
      ? [
          { label: 'Tháng 1', doanhThu: 3500000 },
          { label: 'Tháng 2', doanhThu: 4200000 },
          { label: 'Tháng 3', doanhThu: 5800000 },
          { label: 'Tháng 4', doanhThu: 4900000 },
          { label: 'Tháng 5', doanhThu: 6800000 },
          { label: 'Tháng 6', doanhThu: 7500000 },
          { label: 'Tháng 7', doanhThu: 8200000 },
        ]
      : [
          { label: '2023', doanhThu: 35000000 },
          { label: '2024', doanhThu: 58000000 },
          { label: '2025', doanhThu: 79500000 },
        ];

    return {
      totalRevenue,
      activeCount,
      pendingCount,
      avgContractValue,
      packageStats,
      timelineData,
    };
  }, [insContracts, period]);

  const periodLabelMap: Record<PeriodType, string> = {
    daily: '7 ngày qua',
    weekly: '4 tuần gần đây',
    monthly: '7 tháng gần đây',
    yearly: '3 năm qua',
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header with period toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            BÁO CÁO THỐNG KÊ & PHÂN TÍCH DOANH THU
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--color-zinc-500)' }}>
            Số liệu thống kê doanh số bán xe, phụ tùng, dịch vụ và phân tích hồ sơ nhân khẩu học khách hàng CRM
          </p>
        </div>

        {/* Period Selector Buttons */}
        <div className="inline-flex rounded-xl p-1 bg-zinc-100 border border-zinc-200">
          {(['daily', 'weekly', 'monthly', 'yearly'] as PeriodType[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-600 transition-all cursor-pointer ${
                period === p ? 'bg-red-700 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {p === 'daily' ? 'Theo Ngày' : p === 'weekly' ? 'Theo Tuần' : p === 'monthly' ? 'Theo Tháng' : 'Theo Năm'}
            </button>
          ))}
        </div>
      </div>

      {/* Breakdown by Revenue Source */}
      <div className="rounded-2xl p-5 bg-white border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            CƠ CẤU DOANH THU THEO NGUỒN ({periodLabelMap[period].toUpperCase()})
          </div>
          <div className="text-xs font-mono text-zinc-500 font-bold">
            Tổng cộng: <strong className="text-red-700 text-sm font-display">{formatVND(currentTotalRevenue)}</strong>
          </div>
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

      {/* Charts row 1: Revenue Line Chart + Service Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Line chart — 2/3 */}
        <div className="lg:col-span-2 rounded-2xl p-6 bg-white border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                BIỂU ĐỒ DOANH THU CHI TIẾT
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

        {/* Pie — 1/3: Service Distribution */}
        <div className="rounded-2xl p-6 bg-white border border-zinc-200 shadow-sm">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>
            TỶ LỆ DỊCH VỤ BẢO HÀNH & SỬA CHỮA
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>Tỷ lệ các loại dịch vụ khách đặt nhiều nhất</p>
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

      {/* Charts row 2: CRM CUSTOMER ANALYTICS (Tỷ lệ độ tuổi & Sở thích) */}
      <div className="rounded-2xl p-6 bg-white border border-zinc-200 shadow-sm space-y-4">
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            🎯 BÁO CÁO PHÂN KHÚC KHÁCH HÀNG: ĐỘ TUỔI & SỞ THÍCH PHƯƠNG TIỆN
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Dữ liệu tổng hợp từ {customers.length} khách hàng đăng ký trong hệ thống CRM
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Chart 1: Age Distribution */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold font-mono text-zinc-800 uppercase">1. Phân bố độ tuổi khách hàng</h4>
              <span className="text-[11px] font-mono text-zinc-500 bg-white px-2 py-0.5 rounded-full border border-zinc-200">Đơn vị: %</span>
            </div>
            <p className="text-[11px] text-zinc-500 mb-3">Tính toán tự động theo năm sinh của khách hàng trong hệ thống CRM</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={ageDistributionData} cx="50%" cy="50%" outerRadius={75} dataKey="value" labelLine={false} label={PieLabel}>
                  {ageDistributionData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, 'Tỷ lệ']} contentStyle={{ fontFamily: 'var(--font-sans)', borderRadius: 10, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-sans)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Customer Preferences */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold font-mono text-zinc-800 uppercase">2. Cơ cấu sở thích & nhu cầu dòng xe</h4>
              <span className="text-[11px] font-mono text-zinc-500 bg-white px-2 py-0.5 rounded-full border border-zinc-200">Đơn vị: %</span>
            </div>
            <p className="text-[11px] text-zinc-500 mb-3">Thống kê theo khảo sát và lịch sử tư vấn chọn mua xe của khách hàng</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={preferenceDistributionData} cx="50%" cy="50%" outerRadius={75} dataKey="value" labelLine={false} label={PieLabel}>
                  {preferenceDistributionData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, 'Tỷ lệ']} contentStyle={{ fontFamily: 'var(--font-sans)', borderRadius: 10, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-sans)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── BÁO CÁO DOANH THU & HỢP ĐỒNG BẢO HIỂM XE (BHX05) ── */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 bg-white border border-zinc-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 18,
                color: 'var(--color-zinc-900)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              🛡️ BÁO CÁO DOANH THU & HỢP ĐỒNG BẢO HIỂM XE
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-mono">
              Doanh thu từ phí bảo hiểm TNDS & vật chất xe máy theo {periodLabelMap[period]}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-red-100 text-red-800 font-bold border border-red-200">
              Tổng {insContracts.length} Hợp đồng
            </span>
          </div>
        </div>

        {/* 4 KPI cards for Insurance */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-red-50/50 border border-red-200/80">
            <div className="text-[10px] font-mono uppercase font-bold text-red-800">Doanh thu bảo hiểm</div>
            <div className="text-xl font-extrabold text-red-700 font-mono mt-1">
              {formatVND(insuranceMetrics.totalRevenue)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Hợp đồng đã thu phí</div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
            <div className="text-[10px] font-mono uppercase font-bold text-emerald-800">HĐ còn hiệu lực</div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono mt-1">
              {insuranceMetrics.activeCount} <span className="text-xs font-normal text-zinc-500">HĐ</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Đã cấp Giấy chứng nhận</div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80">
            <div className="text-[10px] font-mono uppercase font-bold text-amber-800">Chờ duyệt cấp GCN</div>
            <div className="text-xl font-extrabold text-amber-600 font-mono mt-1">
              {insuranceMetrics.pendingCount} <span className="text-xs font-normal text-zinc-500">HĐ</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Khách hàng vừa gửi yêu cầu</div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80">
            <div className="text-[10px] font-mono uppercase font-bold text-blue-800">Doanh thu TB / HĐ</div>
            <div className="text-xl font-extrabold text-blue-700 font-mono mt-1">
              {formatVND(insuranceMetrics.avgContractValue)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Giá trị hợp đồng bình quân</div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Chart 1: Revenue Timeline (2 cols) */}
          <div className="lg:col-span-2 p-4 rounded-xl border border-zinc-200 bg-zinc-50/40">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold font-mono text-zinc-800 uppercase">
                1. Xu hướng doanh thu bảo hiểm ({periodLabelMap[period]})
              </h4>
              <span className="text-[11px] font-mono text-zinc-500 bg-white px-2 py-0.5 rounded-full border border-zinc-200">
                Đơn vị: VNĐ
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mb-4">Dòng tiền phí bảo hiểm thực thu theo chu kỳ</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={insuranceMetrics.timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-zinc-100)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={v => [formatVND(Number(v)), 'Doanh thu BH']}
                  contentStyle={{ borderRadius: 10, border: '1px solid var(--color-zinc-200)', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="doanhThu"
                  name="Doanh thu BH"
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  dot={{ fill: '#dc2626', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Package Revenue Breakdown (1 col) */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/40">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold font-mono text-zinc-800 uppercase">
                2. Tỷ trọng doanh thu theo gói
              </h4>
              <span className="text-[11px] font-mono text-zinc-500 bg-white px-2 py-0.5 rounded-full border border-zinc-200">
                Đơn vị: %
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mb-3">Tỷ lệ đóng góp doanh thu của từng gói bảo hiểm</p>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={insuranceMetrics.packageStats}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="revenue"
                  labelLine={false}
                  label={PieLabel}
                >
                  {insuranceMetrics.packageStats.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name, item) => [formatVND(Number(v)), item.payload.name]}
                  contentStyle={{ borderRadius: 10, fontSize: 12 }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="border border-zinc-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950 text-white font-mono uppercase text-[11px]">
                <th className="p-3">Gói bảo hiểm</th>
                <th className="p-3 text-right">Phí tiêu chuẩn</th>
                <th className="p-3 text-center">Số HĐ đã cấp</th>
                <th className="p-3 text-right">Tổng doanh thu</th>
                <th className="p-3 text-right">Tỷ trọng (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {insuranceMetrics.packageStats.map(pkg => (
                <tr key={pkg.key} className="hover:bg-zinc-50 transition">
                  <td className="p-3 font-semibold text-zinc-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: pkg.fill }} />
                    <span>{pkg.name}</span>
                  </td>
                  <td className="p-3 text-right font-mono text-zinc-700">
                    {formatVND(pkg.giaGoc)}/năm
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-zinc-800">
                    {pkg.count} HĐ
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-red-700">
                    {formatVND(pkg.revenue)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-zinc-700">
                    {pkg.value}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
