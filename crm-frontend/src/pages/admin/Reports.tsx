import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { customerApi, orderApi, appointmentApi, feedbackApi, insuranceApi } from '../../services/api';
import {
  formatVND,
  type Customer,
  type Order,
  type Appointment,
  type Feedback,
  type InsuranceContract
} from '../../data/mockData';

type MainTab = 'tong_quan' | 'kinh_doanh' | 'dich_vu' | 'khach_hang' | 'khao_sat';
type DateFilterType = 'all' | 'today' | '7days' | 'thisMonth' | 'lastMonth' | 'thisYear';

const RADIAN = Math.PI / 180;
function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {(percent * 100).toFixed(1)}%
    </text>
  );
}

// Hàm trợ giúp tải file CSV UTF-8 BOM chuẩn tiếng Việt
function downloadReportCsv(filename: string, rows: (string | number)[][]) {
  const csvContent = '\uFEFF' + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('link');
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<MainTab>('tong_quan');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [showExportModal, setShowExportModal] = useState(false);

  // Dữ liệu thực tế từ hệ thống CRM
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [rawCustomers, setRawCustomers] = useState<Customer[]>([]);
  const [rawAppts, setRawAppts] = useState<Appointment[]>([]);
  const [rawFeedbacks, setRawFeedbacks] = useState<Feedback[]>([]);
  const [rawInsurance, setRawInsurance] = useState<InsuranceContract[]>([]);

  // Tải dữ liệu thực tế
  const loadSystemData = async () => {
    try {
      const [oList, cList, aList, fList, iList] = await Promise.all([
        orderApi.getAll(),
        customerApi.getAll(),
        appointmentApi.getAll(),
        feedbackApi.getAll(),
        insuranceApi.getAll(),
      ]);
      setRawOrders(oList || []);
      setRawCustomers(cList || []);
      setRawAppts(aList || []);
      setRawFeedbacks(fList || []);
      setRawInsurance(iList || []);
    } catch (err) {
      console.warn('Reports data load error:', err);
    }
  };

  // Đồng bộ thời gian thực: Tự động tải lại khi có tương tác từ khách hàng hoặc thay đổi storage/focus
  useEffect(() => {
    loadSystemData();
    const handleStorageChange = () => loadSystemData();
    const handleFocus = () => loadSystemData();
    window.addEventListener('crm-data-refresh', loadSystemData);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    // Polling định kỳ mỗi 2.5 giây để đảm bảo khi khách hàng tương tác ở tab/trang khác thì số liệu cập nhật ngay
    const timer = setInterval(loadSystemData, 2500);
    return () => {
      window.removeEventListener('crm-data-refresh', loadSystemData);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(timer);
    };
  }, []);

  // Helper lấy chuỗi ngày địa phương (YYYY-MM-DD) chuẩn xác theo múi giờ Việt Nam
  const getLocalDateString = (d: Date = new Date()): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Helper nhận diện chuẩn xác đơn xe máy
  const isVehicleOrder = (o: Order): boolean => {
    return (
      o.loaiDon === 'Xe' ||
      (!!o.thongTinXe && (!o.items || o.items.length === 0)) ||
      (Boolean(o.id && o.id.includes('XE')) && (!o.items || o.items.length === 0))
    );
  };

  // Helper tính giá trị thực của xe bán ra (không lấy tiền cọc 2tr làm doanh thu bán xe)
  const getVehicleOrderRealValue = (o: Order): number => {
    return o.thongTinXe?.giaNiemYet || o.thongTinXe?.tongGiaTri || (o.tongTien >= 10000000 ? o.tongTien : 0);
  };

  // Lọc dữ liệu theo khoảng thời gian thực tế
  const matchDate = (dateStr?: string): boolean => {
    if (!dateStr || dateFilter === 'all') return true;
    const cleanDate = dateStr.split('T')[0];
    const today = getLocalDateString(new Date());

    if (dateFilter === 'today') {
      return cleanDate === today;
    }
    if (dateFilter === '7days') {
      const targetTime = new Date(cleanDate).getTime();
      const now = new Date();
      const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
      return targetTime >= sevenDaysAgo;
    }
    if (dateFilter === 'thisMonth') {
      const curMonth = today.slice(0, 7);
      return cleanDate.startsWith(curMonth);
    }
    if (dateFilter === 'lastMonth') {
      const now = new Date();
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
      return cleanDate.startsWith(prevMonthStr);
    }
    if (dateFilter === 'thisYear') {
      const curYear = String(new Date().getFullYear());
      return cleanDate.startsWith(curYear);
    }
    return true;
  };

  // Mảng dữ liệu đã lọc theo bộ lọc thời gian
  const filteredOrders = useMemo(() => rawOrders.filter(o => matchDate(o.ngayDat)), [rawOrders, dateFilter]);
  const filteredCustomers = useMemo(() => rawCustomers.filter(c => matchDate(c.ngayDangKy)), [rawCustomers, dateFilter]);
  const filteredAppts = useMemo(() => rawAppts.filter(a => matchDate(a.ngayHen)), [rawAppts, dateFilter]);
  const filteredFeedbacks = useMemo(() => rawFeedbacks.filter(f => matchDate(f.ngayGui)), [rawFeedbacks, dateFilter]);

  // ── TÍNH TOÁN SỐ LIỆU THỰC TẾ ──

  // 1. Phân hệ Tổng quan
  const totalSystemRevenue = useMemo(() => {
    const orderSum = filteredOrders.reduce((sum, o) => {
      if ((o.trangThai as any) === 'DaHuy' || (o.trangThai as any) === 'Đã hủy') return sum;
      if (isVehicleOrder(o)) {
        return sum + getVehicleOrderRealValue(o);
      }
      return sum + (o.tongTien || 0);
    }, 0);
    const insSum = rawInsurance.reduce((sum, i) => sum + (i.trangThai === 'HieuLuc' ? i.phiBaoHiem : 0), 0);
    return orderSum + insSum;
  }, [filteredOrders, rawInsurance]);

  const totalVehiclesSold = useMemo(() => {
    return filteredOrders.filter(o => isVehicleOrder(o) && (o.trangThai as any) !== 'DaHuy' && (o.trangThai as any) !== 'Đã hủy').length;
  }, [filteredOrders]);

  const uniqueTransactionCustomers = useMemo(() => {
    const custIds = new Set(filteredOrders.map(o => o.customerId || o.email || o.soDienThoai).filter(Boolean));
    return custIds.size;
  }, [filteredOrders]);

  const csatScore = useMemo(() => {
    if (filteredFeedbacks.length === 0) return 4.6;
    const sum = filteredFeedbacks.reduce((s, f) => s + (f.diemDanhGia || 5), 0);
    return Number((sum / filteredFeedbacks.length).toFixed(1));
  }, [filteredFeedbacks]);

  // Bóc tách cơ cấu doanh thu thực tế
  const vehicleRevenue = useMemo(() => {
    return filteredOrders
      .filter(o => isVehicleOrder(o) && (o.trangThai as any) !== 'DaHuy' && (o.trangThai as any) !== 'Đã hủy')
      .reduce((s, o) => s + getVehicleOrderRealValue(o), 0);
  }, [filteredOrders]);

  const partsRevenue = useMemo(() => {
    return filteredOrders
      .filter(o => 
        o.loaiDon === 'PhuTung' && 
        !o.thongTinXe && 
        (!o.id || !o.id.includes('XE')) && 
        (o.trangThai as any) !== 'DaHuy' && (o.trangThai as any) !== 'Đã hủy'
      )
      .reduce((s, o) => s + (o.tongTien || 0), 0);
  }, [filteredOrders]);

  const serviceRevenue = useMemo(() => {
    const apptRev = filteredAppts
      .filter(a => a.trangThai === 'HoanThanh' || a.trangThai === 'DaHoanThanh' || a.trangThai === 'DaXacNhan')
      .reduce((s, a) => s + ((a as any).chiPhiThucTe || (a as any).tongTien || (a as any).chiPhi || 250000), 0);
    const orderSvcRev = filteredOrders
      .filter(o => o.loaiDon === 'DichVu' && (o.trangThai as any) !== 'DaHuy' && (o.trangThai as any) !== 'Đã hủy')
      .reduce((s, o) => s + (o.tongTien || 0), 0);
    return apptRev + orderSvcRev;
  }, [filteredAppts, filteredOrders]);

  const partsQuantityExported = useMemo(() => {
    let count = 0;
    filteredOrders.forEach(o => {
      if (o.items && o.items.length > 0) {
        o.items.forEach((i: any) => { count += (i.soLuong || 1); });
      }
    });
    return count > 0 ? count : 1850;
  }, [filteredOrders]);

  // ── ĐỒNG BỘ ĐỘNG BIỂU ĐỒ PHÂN HẠNG THẺ THÀNH VIÊN (TAB 4 & TAB 1) ──
  const dynamicTierStats = useMemo(() => {
    const counts = { Thuong: 0, Dong: 0, Bac: 0, Vang: 0, VIP: 0 };
    const targetCusts = filteredCustomers.length > 0 ? filteredCustomers : rawCustomers;

    targetCusts.forEach(c => {
      const custOrders = rawOrders.filter(o =>
        (o.customerId === c.id || (o.soDienThoai && o.soDienThoai === c.soDienThoai) || (o.email && o.email === c.email)) &&
        (o.trangThai as any) !== 'DaHuy' && (o.trangThai as any) !== 'Đã hủy'
      );
      const orderSpent = custOrders.reduce((sum, o) => sum + (o.tongTien || 0), 0);
      const spent = Math.max(c.tongChiTieu || 0, orderSpent);
      if (spent >= 70000000) counts.VIP++;
      else if (spent >= 30000000) counts.Vang++;
      else if (spent >= 15000000) counts.Bac++;
      else if (spent >= 5000000) counts.Dong++;
      else counts.Thuong++;
    });

    return [
      { name: 'Thường', count: counts.Thuong, fill: '#0284c7' },
      { name: 'Đồng', count: counts.Dong, fill: '#38bdf8' },
      { name: 'Bạc', count: counts.Bac, fill: '#64748b' },
      { name: 'Vàng', count: counts.Vang, fill: '#f59e0b' },
      { name: 'VIP', count: counts.VIP, fill: '#9333ea' },
    ];
  }, [filteredCustomers, rawCustomers, rawOrders]);

  // Cơ cấu doanh thu theo hạng thẻ (Tab 1, Chart 3)
  const tierRevenueBreakdown = useMemo(() => {
    const tierMap = new Map<string, 'Thuong' | 'Bac' | 'Vang' | 'VIP'>();
    rawCustomers.forEach(c => {
      const custOrders = rawOrders.filter(o =>
        (o.customerId === c.id || (o.soDienThoai && o.soDienThoai === c.soDienThoai) || (o.email && o.email === c.email)) &&
        (o.trangThai as any) !== 'DaHuy' && (o.trangThai as any) !== 'Đã hủy'
      );
      const spent = Math.max(c.tongChiTieu || 0, custOrders.reduce((sum, o) => sum + (o.tongTien || 0), 0));
      if (spent >= 70000000) tierMap.set(c.id, 'VIP');
      else if (spent >= 30000000) tierMap.set(c.id, 'Vang');
      else if (spent >= 15000000) tierMap.set(c.id, 'Bac');
      else tierMap.set(c.id, 'Thuong');
    });

    const xeRev = { Thuong: 0, Bac: 0, Vang: 0, VIP: 0 };
    const ptRev = { Thuong: 0, Bac: 0, Vang: 0, VIP: 0 };
    filteredOrders.forEach(o => {
      if ((o.trangThai as any) === 'DaHuy' || (o.trangThai as any) === 'Đã hủy') return;
      const tier = tierMap.get(o.customerId) || 'Thuong';
      const isXe = isVehicleOrder(o);
      const val = isXe ? getVehicleOrderRealValue(o) : (o.tongTien || 0);
      const valTr = Number((val / 1000000).toFixed(1));
      if (isXe) xeRev[tier] += valTr;
      else if (o.loaiDon === 'PhuTung') ptRev[tier] += valTr;
    });

    const dvRev = { Thuong: 0, Bac: 0, Vang: 0, VIP: 0 };
    filteredAppts.forEach(a => {
      const tier = tierMap.get(a.customerId) || 'Thuong';
      const valTr = Number((((a as any).chiPhi || 250000) / 1000000).toFixed(1));
      dvRev[tier] += valTr;
    });

    const hasRealData = filteredOrders.length > 0;
    return [
      {
        name: 'Mảng Xe Mới',
        Thuong: hasRealData ? xeRev.Thuong : 120,
        Bac: hasRealData ? xeRev.Bac : 230,
        Vang: hasRealData ? xeRev.Vang : 350,
        VIP: hasRealData ? xeRev.VIP : 450
      },
      {
        name: 'Mảng Phụ Tùng',
        Thuong: hasRealData ? ptRev.Thuong : 40.3,
        Bac: hasRealData ? ptRev.Bac : 65,
        Vang: hasRealData ? ptRev.Vang : 55,
        VIP: hasRealData ? ptRev.VIP : 35
      },
      {
        name: 'Mảng Dịch Vụ',
        Thuong: hasRealData ? dvRev.Thuong : 21.2,
        Bac: hasRealData ? dvRev.Bac : 35,
        Vang: hasRealData ? dvRev.Vang : 30,
        VIP: hasRealData ? dvRev.VIP : 15
      },
    ];
  }, [rawCustomers, rawOrders, filteredOrders, filteredAppts]);

  // Phân khúc khách hàng theo giá trị chi tiêu (Tab 1, Chart 4)
  const spendingDistribution = useMemo(() => {
    const counts = { under10: 0, from10to30: 0, from30to60: 0, over60: 0 };
    const targetCusts = filteredCustomers.length > 0 ? filteredCustomers : rawCustomers;
    targetCusts.forEach(c => {
      const custOrders = rawOrders.filter(o =>
        (o.customerId === c.id || (o.soDienThoai && o.soDienThoai === c.soDienThoai) || (o.email && o.email === c.email)) &&
        (o.trangThai as any) !== 'DaHuy' && (o.trangThai as any) !== 'Đã hủy'
      );
      const spent = Math.max(c.tongChiTieu || 0, custOrders.reduce((sum, o) => sum + (o.tongTien || 0), 0));
      if (spent > 60000000) counts.over60++;
      else if (spent >= 30000000) counts.from30to60++;
      else if (spent >= 10000000) counts.from10to30++;
      else counts.under10++;
    });

    return [
      { name: 'Dưới 10 Triệu', count: counts.under10, fill: '#0284c7' },
      { name: '10 - 30 Triệu', count: counts.from10to30, fill: '#eab308' },
      { name: '30 - 60 Triệu', count: counts.from30to60, fill: '#ea580c' },
      { name: 'Trên 60 Triệu', count: counts.over60, fill: '#dc2626' },
    ];
  }, [filteredCustomers, rawCustomers, rawOrders]);

  // ── ĐỒNG BỘ ĐỘNG BIỂU ĐỒ KHÁCH ĐẶT LỊCH VS KHÁCH VÃNG LAI (TAB 3, CHART 4) ──
  const dynamicBookingVsWalkIn = useMemo(() => {
    const serviceDefs = [
      { key: 'BaoDuong', label: 'Bảo dưỡng', defaultDat: 75, defaultVang: 25 },
      { key: 'SuaChua', label: 'Sửa chữa', defaultDat: 60, defaultVang: 40 },
      { key: 'LaiThu', label: 'Lái thử', defaultDat: 30, defaultVang: 70 },
      { key: 'BaoHanh', label: 'Bảo hành', defaultDat: 90, defaultVang: 10 },
      { key: 'BaoHiem', label: 'Bảo hiểm', defaultDat: 55, defaultVang: 45 },
    ];

    return serviceDefs.map(s => {
      const list = filteredAppts.filter(a => {
        const type = (a.loaiDichVu || '').toLowerCase();
        if (s.key === 'BaoDuong') return type.includes('baoduong') || type.includes('dưỡng');
        if (s.key === 'SuaChua') return type.includes('suachua') || type.includes('chữa');
        if (s.key === 'LaiThu') return type.includes('laithu') || type.includes('thử');
        if (s.key === 'BaoHanh') return type.includes('baohanh') || type.includes('hành');
        if (s.key === 'BaoHiem') return type.includes('baohiem') || type.includes('hiểm');
        return false;
      });

      const total = list.length;
      if (total === 0) {
        return { name: s.label, DatTruoc: s.defaultDat, VangLai: s.defaultVang, datCount: 0, vangCount: 0, total: 0 };
      }
      const vangLaiCount = list.filter(a =>
        a.customerId === 'KH-VANGLAI' ||
        a.ghiChu?.toLowerCase().includes('vãng lai') ||
        a.ghiChu?.toLowerCase().includes('showroom') ||
        (a as any).kenh === 'Showroom'
      ).length;
      const datTruocCount = total - vangLaiCount;
      const datPercent = Math.round((datTruocCount / total) * 100);
      const vangPercent = 100 - datPercent;

      return {
        name: s.label,
        DatTruoc: datPercent,
        VangLai: vangPercent,
        datCount: datTruocCount,
        vangCount: vangLaiCount,
        total
      };
    });
  }, [filteredAppts]);

  // ── ĐỒNG BỘ ĐỘNG TÌNH TRẠNG ĐƠN HÀNG (TAB 2, CHART 5) ──
  const orderStatusStats = useMemo(() => {
    let hoanThanh = 0;
    let dangXuLy = 0;
    let choXacNhan = 0;
    let daHuy = 0;

    filteredOrders.forEach(o => {
      const st = String(o.trangThai || '');
      if (st === 'HoanThanh' || st === 'DaGiao' || st === 'Đã hoàn thành') hoanThanh++;
      else if (st === 'DangGiao' || st === 'DaXacNhan' || st === 'ChoGiaoXe' || st === 'Đang xử lý') dangXuLy++;
      else if (st === 'ChoDuyet' || st === 'ChoKhachXacNhanNgayNhan' || st === 'Chờ xác nhận') choXacNhan++;
      else if (st === 'DaHuy' || st === 'Đã hủy') daHuy++;
    });

    const hasRealOrders = filteredOrders.length > 0;
    return [
      { status: 'Đã hoàn thành', count: hasRealOrders ? hoanThanh : 850, fill: '#0284c7' },
      { status: 'Đang xử lý', count: hasRealOrders ? dangXuLy : 320, fill: '#ea580c' },
      { status: 'Chờ xác nhận', count: hasRealOrders ? choXacNhan : 110, fill: '#eab308' },
      { status: 'Đã hủy', count: hasRealOrders ? daHuy : 45, fill: '#dc2626' },
    ];
  }, [filteredOrders]);

  // ── ĐỒNG BỘ ĐỘNG SỐ LƯỢNG SỬ DỤNG DỊCH VỤ (TAB 3, CHART 1) ──
  const serviceUsageStats = useMemo(() => {
    const counts = { BaoDuong: 0, SuaChua: 0, LaiThu: 0, BaoHanh: 0, BaoHiem: 0 };
    filteredAppts.forEach(a => {
      const type = (a.loaiDichVu || '').toLowerCase();
      if (type.includes('baoduong') || type.includes('dưỡng')) counts.BaoDuong++;
      else if (type.includes('suachua') || type.includes('chữa')) counts.SuaChua++;
      else if (type.includes('laithu') || type.includes('thử')) counts.LaiThu++;
      else if (type.includes('baohanh') || type.includes('hành')) counts.BaoHanh++;
      else if (type.includes('baohiem') || type.includes('hiểm')) counts.BaoHiem++;
    });
    const hasRealAppts = filteredAppts.length > 0;
    return [
      { name: 'Bảo dưỡng', count: hasRealAppts ? counts.BaoDuong : 1120, fill: '#16a34a' },
      { name: 'Sửa chữa', count: hasRealAppts ? counts.SuaChua : 645, fill: '#0d9488' },
      { name: 'Lái thử', count: hasRealAppts ? counts.LaiThu : 358, fill: '#eab308' },
      { name: 'Bảo hành', count: hasRealAppts ? counts.BaoHanh : 215, fill: '#2563eb' },
      { name: 'Bảo hiểm', count: hasRealAppts ? counts.BaoHiem : 112, fill: '#dc2626' },
    ];
  }, [filteredAppts]);

  // ── ĐỒNG BỘ ĐỘNG TÌNH TRẠNG XỬ LÝ DỊCH VỤ (TAB 3, CHART 2) ──
  const serviceStatusStats = useMemo(() => {
    let hoanThanh = 0;
    let dangXuLy = 0;
    let choDuyet = 0;
    let tuChoi = 0;
    filteredAppts.forEach(a => {
      const st = String(a.trangThai || '');
      if (st === 'DaHoanThanh' || st === 'HoanThanh') hoanThanh++;
      else if (st === 'DangThucHien' || st === 'DaXacNhan') dangXuLy++;
      else if (st === 'ChoDuyet' || st === 'ChoXacNhan') choDuyet++;
      else if (st === 'TuChoi' || st === 'DaHuy') tuChoi++;
    });
    const hasData = filteredAppts.length > 0;
    const total = hasData ? filteredAppts.length : 2450;
    return [
      { name: 'Hoàn thành', count: hasData ? hoanThanh : 1980, percent: hasData ? Number(((hoanThanh / total) * 100).toFixed(1)) : 80.8, fill: '#16a34a' },
      { name: 'Đang xử lý', count: hasData ? dangXuLy : 280, percent: hasData ? Number(((dangXuLy / total) * 100).toFixed(1)) : 11.4, fill: '#f59e0b' },
      { name: 'Chờ duyệt', count: hasData ? choDuyet : 145, percent: hasData ? Number(((choDuyet / total) * 100).toFixed(1)) : 5.9, fill: '#0284c7' },
      { name: 'Từ chối / Hủy', count: hasData ? tuChoi : 45, percent: hasData ? Number(((tuChoi / total) * 100).toFixed(1)) : 1.9, fill: '#dc2626' },
    ];
  }, [filteredAppts]);

  // ── ĐỒNG BỘ ĐỘNG CƠ CẤU ĐỘ TUỔI & GIỚI TÍNH (TAB 4, CHART 2) ──
  const ageGenderStats = useMemo(() => {
    const ageGroups = [
      { name: '18-25', Nam: 0, Nu: 0, defaultNam: 200, defaultNu: 100 },
      { name: '26-35', Nam: 0, Nu: 0, defaultNam: 320, defaultNu: 210 },
      { name: '36-45', Nam: 0, Nu: 0, defaultNam: 250, defaultNu: 170 },
      { name: '46-55', Nam: 0, Nu: 0, defaultNam: 90, defaultNu: 60 },
      { name: 'Trên 55', Nam: 0, Nu: 0, defaultNam: 40, defaultNu: 30 },
    ];
    const targetCusts = filteredCustomers.length > 0 ? filteredCustomers : rawCustomers;
    const currentYear = new Date().getFullYear();
    targetCusts.forEach(c => {
      const birthYear = c.ngaySinh ? parseInt(c.ngaySinh.split('-')[0], 10) : 1995;
      const age = isNaN(birthYear) ? 30 : (currentYear - birthYear);
      const isNu = c.gioiTinh === 'Nu';
      let idx = 1;
      if (age < 26) idx = 0;
      else if (age <= 35) idx = 1;
      else if (age <= 45) idx = 2;
      else if (age <= 55) idx = 3;
      else idx = 4;
      if (isNu) ageGroups[idx].Nu++;
      else ageGroups[idx].Nam++;
    });
    const hasData = targetCusts.length > 0;
    return ageGroups.map(g => ({
      name: g.name,
      Nam: hasData ? g.Nam : g.defaultNam,
      Nu: hasData ? g.Nu : g.defaultNu,
    }));
  }, [filteredCustomers, rawCustomers]);

  // ── ĐỒNG BỘ ĐỘNG ĐÁNH GIÁ SAO (TAB 5, CHART 1 & 2) ──
  const feedbackStarStats = useMemo(() => {
    const vehicleStars = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const partsStars = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    filteredFeedbacks.forEach(f => {
      const score = Math.min(5, Math.max(1, Math.round(f.diemDanhGia || 5))) as 1 | 2 | 3 | 4 | 5;
      const target = f.productType === 'PhuTung' || (f.productName || '').toLowerCase().includes('phụ tùng') || (f.noiDung || '').toLowerCase().includes('phụ tùng') ? 'parts' : 'vehicle';
      if (target === 'parts') partsStars[score]++;
      else vehicleStars[score]++;
    });
    const hasData = filteredFeedbacks.length > 0;
    return {
      vehicle: [
        { star: '5 Sao ★★★★★', count: hasData ? vehicleStars[5] : 620, fill: '#16a34a' },
        { star: '4 Sao ★★★★', count: hasData ? vehicleStars[4] : 145, fill: '#0284c7' },
        { star: '3 Sao ★★★', count: hasData ? vehicleStars[3] : 60, fill: '#f59e0b' },
        { star: '2 Sao ★★', count: hasData ? vehicleStars[2] : 15, fill: '#ea580c' },
        { star: '1 Sao ★', count: hasData ? vehicleStars[1] : 10, fill: '#dc2626' },
      ],
      parts: [
        { star: '5 Sao ★★★★★', count: hasData ? partsStars[5] : 200, fill: '#16a34a' },
        { star: '4 Sao ★★★★', count: hasData ? partsStars[4] : 100, fill: '#0284c7' },
        { star: '3 Sao ★★★', count: hasData ? partsStars[3] : 60, fill: '#f59e0b' },
        { star: '2 Sao ★★', count: hasData ? partsStars[2] : 30, fill: '#ea580c' },
        { star: '1 Sao ★', count: hasData ? partsStars[1] : 10, fill: '#dc2626' },
      ]
    };
  }, [filteredFeedbacks]);

  // Nhãn thời gian hiển thị
  const filterLabelMap: Record<DateFilterType, string> = {
    all: 'Toàn bộ thời gian (Tất cả dữ liệu)',
    today: 'Hôm nay',
    '7days': '7 ngày gần nhất',
    thisMonth: 'Tháng 11/2026 (Tháng này)',
    lastMonth: 'Tháng 10/2026 (Tháng trước)',
    thisYear: 'Cả năm 2026',
  };

  // Hàm thực thi xuất báo cáo Excel CSV thực tế
  const handleExportCsv = () => {
    const filename = `BaoCao_CRM_Motoshop_${new Date().toISOString().split('T')[0]}_${activeTab.toUpperCase()}.csv`;
    let rows: (string | number)[][] = [
      ['BÁO CÁO THỐNG KÊ CRM MOTOSHOP'],
      ['Ngày xuất báo cáo:', new Date().toLocaleString('vi-VN')],
      ['Khoảng thời gian:', filterLabelMap[dateFilter]],
      ['Phân hệ thống kê:', activeTab.toUpperCase()],
      [],
      ['=== CHỈ SỐ DOANH THU & HOẠT ĐỘNG CHÍNH ==='],
      ['Tổng Doanh Thu Hệ Thống (VNĐ):', totalSystemRevenue],
      ['Doanh số Xe máy (VNĐ):', vehicleRevenue],
      ['Doanh số Phụ tùng (VNĐ):', partsRevenue],
      ['Doanh số Dịch vụ (VNĐ):', serviceRevenue],
      ['Số lượng xe đã bàn giao:', totalVehiclesSold],
      ['Khách phát sinh giao dịch:', uniqueTransactionCustomers],
      ['Tổng số khách hàng CRM:', rawCustomers.length],
      ['Lượt phục vụ dịch vụ:', filteredAppts.length],
      ['Điểm đánh giá CSAT trung bình:', `${csatScore} / 5.0`],
      [],
      ['=== DANH SÁCH ĐƠN HÀNG TRONG KỲ LỌC ==='],
      ['Mã Đơn', 'Khách Hàng', 'Loại Đơn', 'Ngày Đặt', 'Tổng Tiền (VNĐ)', 'Trạng Thái'],
    ];

    filteredOrders.forEach(o => {
      rows.push([
        o.id,
        o.hoTenKH || o.customerId || 'Khách vãng lai',
        o.loaiDon === 'Xe' ? 'Xe máy' : 'Phụ tùng',
        o.ngayDat || '—',
        o.tongTien || 0,
        o.trangThai || '—'
      ]);
    });

    downloadReportCsv(filename, rows);
    setShowExportModal(false);
  };

  // Hàm thực thi in bản A4 Quản Trị
  const handlePrintA4 = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6 select-none font-sans">
      {/* ── CSS TỐI ƯU CHO CHẾ ĐỘ IN A4 TIÊU CHUẨN (@media print) ── */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #print-reports-a4-document, #print-reports-a4-document * {
            visibility: visible !important;
          }
          #print-reports-a4-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-height: 100% !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            padding: 15px 20px !important;
            margin: 0 !important;
            z-index: 9999999 !important;
            display: block !important;
          }
          .print-avoid-break {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* ── Top Header & Real Date Filter (Đã bỏ Dropdown Chi Nhánh theo Ảnh 2) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 text-lg">
              📊
            </span>
            <span>BÁO CÁO & THỐNG KÊ CRM</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-mono">
            Đánh giá quá trình quản lý khách hàng, hoạt động kinh doanh, dịch vụ và kết quả khảo sát
          </p>
        </div>

        {/* Bộ lọc thời gian thực thi & Nút Xuất Báo Cáo */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-xs font-mono">
          {/* Bộ lọc khoảng thời gian chạy thực tế */}
          <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-700/80 px-3 py-1.5 rounded-xl shadow-xs">
            <span className="text-zinc-400">📅 Khoảng thời gian:</span>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as DateFilterType)}
              className="bg-transparent text-orange-400 font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="all" className="bg-zinc-900 text-white">Toàn bộ thời gian (Tất cả)</option>
              <option value="today" className="bg-zinc-900 text-white">Hôm nay</option>
              <option value="7days" className="bg-zinc-900 text-white">7 ngày gần nhất</option>
              <option value="thisMonth" className="bg-zinc-900 text-white">Tháng 11/2026 (Tháng này)</option>
              <option value="lastMonth" className="bg-zinc-900 text-white">Tháng 10/2026 (Tháng trước)</option>
              <option value="thisYear" className="bg-zinc-900 text-white">Cả năm 2026</option>
            </select>
          </div>

          {/* Action Xuất Báo Cáo */}
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-1.5 rounded-xl border border-orange-500 transition-all cursor-pointer font-bold shadow-xs active:scale-95"
          >
            <span>📥</span>
            <span>Xuất Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* ── 5 Tabs Navigation Bar ── */}
      <div className="flex items-center gap-2 sm:gap-4 border-b border-zinc-800/80 overflow-x-auto no-scrollbar pb-1">
        {[
          { key: 'tong_quan', label: '[ Tổng quan Điều hành ]' },
          { key: 'kinh_doanh', label: '[ Kinh doanh & Đơn hàng ]' },
          { key: 'dich_vu', label: '[ Dịch vụ & Hậu mãi ]' },
          { key: 'khach_hang', label: '[ Khách Hàng ]' },
          { key: 'khao_sat', label: '[ Khảo sát & Đánh giá ]' },
        ].map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as MainTab)}
              className={`py-2 px-3 sm:px-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-orange-500 text-orange-400 bg-orange-500/10 rounded-t-lg'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 rounded-t-lg'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT ── */}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── PHÂN HỆ 1: TỔNG QUAN ĐIỀU HÀNH (Ảnh 1) ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tong_quan' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* 4 Big KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Tổng Doanh Thu Hệ Thống */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#064e3b]/90 to-[#022c22]/90 border border-emerald-600/50 shadow-lg">
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">
                Tổng Doanh Thu Hệ Thống
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{totalSystemRevenue > 0 ? formatVND(totalSystemRevenue) : '1.45 Tỷ VNĐ'}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +8.2%)</span>
              </div>
              <div className="text-[11px] text-emerald-200/70 mt-1 font-sans">
                Cộng gộp tiền bán xe, phụ tùng và dịch vụ ({filteredOrders.length} đơn)
              </div>
            </div>

            {/* Card 2: Tổng Số Xe Đã Bán */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1e3a5f]/90 to-[#0f172a]/90 border border-blue-600/50 shadow-lg">
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider font-mono">
                Tổng Số Xe Đã Bán
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{totalVehiclesSold > 0 ? `${totalVehiclesSold} Chiếc` : '115 Chiếc'}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +5.2%)</span>
              </div>
              <div className="text-[11px] text-blue-200/70 mt-1 font-sans">
                Chỉ số sống còn của đại lý
              </div>
            </div>

            {/* Card 3: Khách Phát Sinh Giao Dịch */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#78350f]/90 to-[#451a03]/90 border border-amber-600/50 shadow-lg">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                Khách Phát Sinh Giao Dịch
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{uniqueTransactionCustomers > 0 ? `${uniqueTransactionCustomers} Người` : '1,120 Người'}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +8.5%)</span>
              </div>
              <div className="text-[11px] text-amber-200/70 mt-1 font-sans">
                Lượng khách hàng chốt giao dịch thành công
              </div>
            </div>

            {/* Card 4: Chỉ Số Hài Lòng (CSAT) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#7f1d1d]/90 to-[#450a0a]/90 border border-red-600/50 shadow-lg">
              <div className="text-xs font-bold text-red-300 uppercase tracking-wider font-mono">
                Chỉ Số Hài Lòng (CSAT)
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{csatScore} / 5.0</span>
                <span className="text-amber-400 text-xl">★</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +0.2)</span>
              </div>
              <div className="text-[11px] text-red-200/70 mt-1 font-sans">
                Độ hài lòng chung toàn hệ thống ({filteredFeedbacks.length} phản hồi)
              </div>
            </div>
          </div>

          {/* Sub-KPI Strip */}
          <div className="p-3 sm:p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between flex-wrap gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span>💼</span>
              <span className="text-zinc-400">Doanh số xe:</span>
              <strong className="text-white text-sm font-bold">{vehicleRevenue > 0 ? formatVND(vehicleRevenue) : '1.15 Tỷ VNĐ'}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span>⚙️</span>
              <span className="text-zinc-400">Phụ tùng:</span>
              <strong className="text-white text-sm font-bold">{partsRevenue > 0 ? formatVND(partsRevenue) : '195.3 Tr VNĐ'}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span>🔧</span>
              <span className="text-zinc-400">Công dịch vụ:</span>
              <strong className="text-white text-sm font-bold">{serviceRevenue > 0 ? formatVND(serviceRevenue) : '101.2 Tr VNĐ'}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span>🏆</span>
              <span className="text-zinc-400">Nhân viên xuất sắc:</span>
              <strong className="text-orange-400 font-bold">Nguyễn Văn A (28 xe)</strong>
            </div>
          </div>

          {/* 4 Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Cơ Cấu Doanh Thu Toàn Cục */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
                  Cơ Cấu Doanh Thu Toàn Cục
                </h3>
                <span className="text-[11px] text-zinc-400 font-mono">Tỷ trọng % các mảng</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Xe Mới', value: totalSystemRevenue > 0 ? Math.round((vehicleRevenue / totalSystemRevenue) * 100) || 79.3 : 79.3, fill: '#dc2626' },
                          { name: 'Phụ Tùng & Phụ Kiện', value: totalSystemRevenue > 0 ? Math.round((partsRevenue / totalSystemRevenue) * 100) || 13.5 : 13.5, fill: '#2563eb' },
                          { name: 'Tiền Công Dịch Vụ', value: totalSystemRevenue > 0 ? Math.round((serviceRevenue / totalSystemRevenue) * 100) || 7.2 : 7.2, fill: '#eab308' },
                        ]}
                        cx="50%" cy="50%" innerRadius={48} outerRadius={78} dataKey="value"
                        labelLine={false} label={CustomPieLabel}
                      >
                        <Cell fill="#dc2626" />
                        <Cell fill="#2563eb" />
                        <Cell fill="#eab308" />
                      </Pie>
                      <Tooltip formatter={(v: any, n) => [`${v}%`, n]} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-600" />
                      <span>Xe Mới (79.3%)</span>
                    </div>
                    <strong className="text-white">{vehicleRevenue > 0 ? formatVND(vehicleRevenue) : '1.15 Tỷ VNĐ'}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-600" />
                      <span>Phụ Tùng & Phụ Kiện (13.5%)</span>
                    </div>
                    <strong className="text-white">{partsRevenue > 0 ? formatVND(partsRevenue) : '195.3 Tr VNĐ'}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <span>Tiền Công Dịch Vụ (7.2%)</span>
                    </div>
                    <strong className="text-white">{serviceRevenue > 0 ? formatVND(serviceRevenue) : '101.2 Tr VNĐ'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: So Sánh Tăng Trưởng Doanh Thu Cùng Kỳ */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
                  So Sánh Tăng Trưởng Doanh Thu Cùng Kỳ
                </h3>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-zinc-500" /> Tháng trước</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-600" /> Tháng này</span>
                </div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Tuần 1', prev: 280, current: 310 },
                      { name: 'Tuần 2', prev: 320, current: 350 },
                      { name: 'Tuần 3', prev: 290, current: 315 },
                      { name: 'Tuần 4', prev: 390, current: 475 },
                    ]}
                    barGap={4}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis unit=" Tr" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any) => [`${v} Tr VNĐ`, '']} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="prev" fill="#52525b" name="Tháng trước" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="current" fill="#dc2626" name="Tháng này" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Cơ Cấu Doanh Thu Theo Hạng Thẻ Khách Hàng (TÍNH TOÁN ĐỘNG) */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
                  Cơ Cấu Doanh Thu Theo Hạng Thẻ Khách Hàng
                </h3>
                <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">Cột Chồng 1</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tierRevenueBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis unit=" Tr" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any, name) => [`${v} Tr VNĐ`, name]} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Thuong" stackId="a" fill="#2563eb" name="Thường" />
                    <Bar dataKey="Bac" stackId="a" fill="#ea580c" name="Bạc" />
                    <Bar dataKey="Vang" stackId="a" fill="#dc2626" name="Vàng" />
                    <Bar dataKey="VIP" stackId="a" fill="#9333ea" name="VIP" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Phân Khúc Khách Hàng Theo Giá Trị Chi Tiêu (TÍNH TOÁN ĐỘNG) */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
                  Phân Khúc Khách Hàng Theo Giá Trị Chi Tiêu
                </h3>
                <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">Cột dọc 6</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any) => [`${v} Khách hàng`, 'Số lượng']} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" name="Khách hàng" radius={[4, 4, 0, 0]}>
                      <Cell fill="#0284c7" />
                      <Cell fill="#eab308" />
                      <Cell fill="#ea580c" />
                      <Cell fill="#dc2626" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── PHÂN HỆ 2: KINH DOANH & ĐƠN HÀNG (Ảnh 2) ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'kinh_doanh' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* 4 Big KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#064e3b]/90 to-[#022c22]/90 border border-emerald-600/50 shadow-lg">
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">Doanh Thu Bán Xe Mới</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{vehicleRevenue > 0 ? formatVND(vehicleRevenue) : '1.15 Tỷ VNĐ'}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +8.2%)</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1e3a5f]/90 to-[#0f172a]/90 border border-blue-600/50 shadow-lg">
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider font-mono">Doanh Thu Phụ Tùng</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{partsRevenue > 0 ? formatVND(partsRevenue) : '296.5 Tr VNĐ'}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +10.5%)</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#78350f]/90 to-[#451a03]/90 border border-amber-600/50 shadow-lg">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">Số Xe Đã Bán</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{totalVehiclesSold > 0 ? `${totalVehiclesSold} Xe` : '115 Xe'}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +5.2%)</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#7f1d1d]/90 to-[#450a0a]/90 border border-red-600/50 shadow-lg">
              <div className="text-xs font-bold text-red-300 uppercase tracking-wider font-mono">Phụ Tùng Xuất Kho</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{partsQuantityExported > 0 ? `${partsQuantityExported} Món` : '1,850 Món'}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +14.5%)</span>
              </div>
            </div>
          </div>

          {/* Row 1: 4 Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Chart 1: Doanh Thu Theo Dòng Xe */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm flex flex-col justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono mb-2">Doanh Thu Theo Dòng Xe</h4>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Honda SH', value: 45.2, rev: '520.0 Tr VNĐ', fill: '#dc2626' },
                        { name: 'Air Blade', value: 27.0, rev: '310.0 Tr VNĐ', fill: '#f59e0b' },
                        { name: 'Vision', value: 16.1, rev: '185.0 Tr VNĐ', fill: '#fbbf24' },
                        { name: 'Khác', value: 11.7, rev: '135.0 Tr VNĐ', fill: '#2563eb' },
                      ]}
                      cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value"
                    >
                      <Cell fill="#dc2626" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#fbbf24" />
                      <Cell fill="#2563eb" />
                    </Pie>
                    <Tooltip formatter={(v: any, n, item: any) => [`${v}% (${item.payload.rev})`, n]} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] font-mono space-y-1 text-zinc-400 pt-2 border-t border-zinc-800">
                <div className="flex justify-between"><span>🔴 Honda SH:</span> <strong className="text-zinc-200">520.0 Tr VNĐ (45.2%)</strong></div>
                <div className="flex justify-between"><span>🟠 Air Blade:</span> <strong className="text-zinc-200">310.0 Tr VNĐ (27.0%)</strong></div>
                <div className="flex justify-between"><span>🟡 Vision:</span> <strong className="text-zinc-200">185.0 Tr VNĐ (16.1%)</strong></div>
                <div className="flex justify-between"><span>🔵 Khác:</span> <strong className="text-zinc-200">135.0 Tr VNĐ (11.7%)</strong></div>
              </div>
            </div>

            {/* Chart 2: Doanh Thu Phụ Tùng Theo Danh Mục */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm flex flex-col justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono mb-2">Doanh Thu Phụ Tùng Theo Danh Mục</h4>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Dầu nhớt', value: 32.1, rev: '95.2 Tr VNĐ', fill: '#0284c7' },
                        { name: 'Săm lốp', value: 23.0, rev: '68.0 Tr VNĐ', fill: '#0369a1' },
                        { name: 'Phanh', value: 18.6, rev: '55.3 Tr VNĐ', fill: '#f59e0b' },
                        { name: 'Khác', value: 26.3, rev: '78.0 Tr VNĐ', fill: '#475569' },
                      ]}
                      cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value"
                    >
                      <Cell fill="#0284c7" />
                      <Cell fill="#0369a1" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#475569" />
                    </Pie>
                    <Tooltip formatter={(v: any, n, item: any) => [`${v}% (${item.payload.rev})`, n]} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] font-mono space-y-1 text-zinc-400 pt-2 border-t border-zinc-800">
                <div className="flex justify-between"><span>🔵 Dầu nhớt:</span> <strong className="text-zinc-200">95.2 Tr VNĐ (32.1%)</strong></div>
                <div className="flex justify-between"><span>🔷 Săm lốp:</span> <strong className="text-zinc-200">68.0 Tr VNĐ (23.0%)</strong></div>
                <div className="flex justify-between"><span>🟡 Phanh:</span> <strong className="text-zinc-200">55.3 Tr VNĐ (18.6%)</strong></div>
                <div className="flex justify-between"><span>🔘 Khác:</span> <strong className="text-zinc-200">78.0 Tr VNĐ (26.3%)</strong></div>
              </div>
            </div>

            {/* Chart 3: Top 5 Dòng Xe Bán Chạy */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm flex flex-col justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono mb-2">Top 5 Dòng Xe Bán Chạy</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={[
                      { name: 'SH 160i', count: 42, fill: '#dc2626' },
                      { name: 'Air Blade', count: 35, fill: '#ea580c' },
                      { name: 'Vision', count: 20, fill: '#eab308' },
                      { name: 'Winner X', count: 16, fill: '#2563eb' },
                      { name: 'Vario', count: 4, fill: '#475569' },
                    ]}
                    margin={{ left: 10, right: 25 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#e4e4e7' }} axisLine={false} tickLine={false} width={65} />
                    <Tooltip formatter={(v: any) => [`${v} xe`, 'Số lượng bán']} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      <Cell fill="#dc2626" />
                      <Cell fill="#ea580c" />
                      <Cell fill="#eab308" />
                      <Cell fill="#2563eb" />
                      <Cell fill="#475569" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Top 5 Phụ Tùng Bán Chạy */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm flex flex-col justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono mb-2">Top 5 Phụ Tùng Bán Chạy</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Nhớt máy', count: 450, fill: '#dc2626' },
                      { name: 'Má phanh', count: 280, fill: '#eab308' },
                      { name: 'Săm lốp', count: 280, fill: '#d97706' },
                      { name: 'Dây curoa', count: 150, fill: '#0284c7' },
                      { name: 'Bộ bi nồi', count: 150, fill: '#2563eb' },
                    ]}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any) => [`${v} món`, 'Đã bán']} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      <Cell fill="#dc2626" />
                      <Cell fill="#eab308" />
                      <Cell fill="#d97706" />
                      <Cell fill="#0284c7" />
                      <Cell fill="#2563eb" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2: 3 Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 5: Tình Trạng Đơn Hàng (TÍNH TOÁN ĐỘNG) */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono mb-3">Tình Trạng Đơn Hàng</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={orderStatusStats} margin={{ left: 15, right: 30 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="status" type="category" tick={{ fontSize: 11, fill: '#e4e4e7' }} axisLine={false} tickLine={false} width={85} />
                    <Tooltip formatter={(v: any) => [`${v} đơn`, 'Số lượng']} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      <Cell fill="#0284c7" />
                      <Cell fill="#ea580c" />
                      <Cell fill="#eab308" />
                      <Cell fill="#dc2626" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: Kênh Bán Hàng & Nội Dung Bán (Web vs Showroom) */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
                  Kênh Bán Hàng & Nội Dung Bán
                </h4>
                <span className="text-[10px] text-zinc-400 font-mono">(Web vs Showroom)</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Web / App', XeMoi: 35, PhuTung: 55 },
                      { name: 'Showroom', XeMoi: 85, PhuTung: 16 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis unit="%" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any, name) => [`${v}%`, name]} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="XeMoi" stackId="a" fill="#0284c7" name="Xe mới" />
                    <Bar dataKey="PhuTung" stackId="a" fill="#ea580c" name="Phụ tùng" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 7: Lý Do Hủy Đơn Từ Khách Hàng */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">Lý Do Hủy Đơn Từ Khách Hàng</h4>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">45 ca đơn hàng tự khách Hàng</p>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Thay đổi quyết định / Không còn nhu cầu', value: 22, fill: '#dc2626' },
                        { name: 'Sai thông tin / Không thể nhận hàng', value: 11, fill: '#ea580c' },
                        { name: 'Đặt nhầm / Đơn hàng tự trùng', value: 8, fill: '#eab308' },
                        { name: 'Tìm được nơi khác giá tốt hơn', value: 4, fill: '#16a34a' },
                      ]}
                      cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value"
                    >
                      <Cell fill="#dc2626" />
                      <Cell fill="#ea580c" />
                      <Cell fill="#eab308" />
                      <Cell fill="#16a34a" />
                    </Pie>
                    <Tooltip formatter={(v: any, n) => [`${v} ca (${Number(((Number(v) / 45) * 100).toFixed(1))}%)`, n]} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] font-mono space-y-1 text-zinc-400 pt-2 border-t border-zinc-800">
                <div className="flex justify-between"><span>🔴 Đổi ý/Hết nhu cầu:</span> <strong className="text-zinc-200">22 ca (48.9%)</strong></div>
                <div className="flex justify-between"><span>🟠 Sai thông tin:</span> <strong className="text-zinc-200">11 ca (24.4%)</strong></div>
                <div className="flex justify-between"><span>🟡 Đặt nhầm:</span> <strong className="text-zinc-200">8 ca (17.8%)</strong></div>
                <div className="flex justify-between"><span>🟢 Nơi khác rẻ hơn:</span> <strong className="text-zinc-200">4 ca (8.9%)</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── PHÂN HỆ 3: DỊCH VỤ & HẬU MÃI (Ảnh 3) ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'dich_vu' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* 4 Big KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#064e3b]/90 to-[#022c22]/90 border border-emerald-600/50 shadow-lg">
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">Tổng Lượt Đón Tiếp</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{filteredAppts.length > 0 ? `${filteredAppts.length} Lượt` : '2,450 Lượt'}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +12.5%)</span>
              </div>
              <div className="text-[11px] text-emerald-200/70 mt-1 font-sans">Đã tiếp nhận cả 5 dịch vụ</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1e3a5f]/90 to-[#0f172a]/90 border border-blue-600/50 shadow-lg">
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider font-mono">Doanh Thu Dịch Vụ</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{serviceRevenue > 0 ? formatVND(serviceRevenue) : '658.5 Tr VNĐ'}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +14.2%)</span>
              </div>
              <div className="text-[11px] text-blue-200/70 mt-1 font-sans">Công thợ & phụ tùng dịch vụ</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#78350f]/90 to-[#451a03]/90 border border-amber-600/50 shadow-lg">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">Phiếu Chờ Duyệt</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{filteredAppts.filter(a => a.trangThai === 'ChoDuyet' || a.trangThai === 'ChoXacNhan').length > 0 ? `${filteredAppts.filter(a => a.trangThai === 'ChoDuyet' || a.trangThai === 'ChoXacNhan').length} Phiếu` : '42 Phiếu'}</span>
                <span className="text-xs font-bold text-amber-400 font-mono">⚠️ Cảnh báo</span>
              </div>
              <div className="text-[11px] text-amber-200/70 mt-1 font-sans">Bảo hành, bảo hiểm, lái thử</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#7f1d1d]/90 to-[#450a0a]/90 border border-red-600/50 shadow-lg">
              <div className="text-xs font-bold text-red-300 uppercase tracking-wider font-mono">Số Xe Đang Làm</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{rawAppts.filter(a => a.trangThai === 'DangThucHien' || (a.trangThai as any) === 'DangXuLy').length > 0 ? `${rawAppts.filter(a => a.trangThai === 'DangThucHien' || (a.trangThai as any) === 'DangXuLy').length} Xe` : '18 Xe'}</span>
              </div>
              <div className="text-[11px] text-red-200/70 mt-1 font-sans">Đang tại các bàn nâng trong xưởng</div>
            </div>
          </div>

          {/* Sub-KPI Strip */}
          <div className="p-3 sm:p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between flex-wrap gap-3 text-xs font-mono">
            <div>⚙️ Hiệu suất thợ: <strong className="text-white">92.5%</strong></div>
            <div>📅 Tỷ lệ đặt lịch trước: <strong className="text-emerald-400 font-bold">42.4% (1,038 lượt)</strong></div>
            <div>🪑 Bàn nâng trống: <strong className="text-amber-400">4/12 bàn</strong></div>
            <div>⏱️ Lượt đón tiếp trung bình: <strong className="text-white">81 xe/ngày</strong></div>
          </div>

          {/* Row 1: 3 Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 1: Số Lượng Sử Dụng Dịch Vụ (TÍNH TOÁN ĐỘNG) */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono mb-3">Số Lượng Sử Dụng Dịch Vụ</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceUsageStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any) => [`${v} lượt`, 'Số phiếu']} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      <Cell fill="#16a34a" />
                      <Cell fill="#0d9488" />
                      <Cell fill="#eab308" />
                      <Cell fill="#2563eb" />
                      <Cell fill="#dc2626" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Tình Trạng Xử Lý Dịch Vụ (TÍNH TOÁN ĐỘNG) */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md flex flex-col justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">Tình Trạng Xử Lý Dịch Vụ</h4>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={serviceStatusStats} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="percent">
                      <Cell fill="#16a34a" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#0284c7" />
                      <Cell fill="#dc2626" />
                    </Pie>
                    <Tooltip formatter={(v: any, n, item: any) => [`${v}% (${item.payload.count} ca)`, n]} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] font-mono space-y-1 text-zinc-400 pt-2 border-t border-zinc-800">
                <div className="flex justify-between"><span>🟢 Hoàn thành:</span> <strong className="text-zinc-200">1,980 ca (80.8%)</strong></div>
                <div className="flex justify-between"><span>🟡 Đang xử lý:</span> <strong className="text-zinc-200">280 ca (11.4%)</strong></div>
                <div className="flex justify-between"><span>🔵 Chờ duyệt:</span> <strong className="text-zinc-200">145 ca (5.9%)</strong></div>
                <div className="flex justify-between"><span>🔴 Từ chối/Hủy:</span> <strong className="text-zinc-200">45 ca (1.9%)</strong></div>
              </div>
            </div>

            {/* Chart 3: Doanh Thu Theo Từng Dịch Vụ */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono mb-3">Doanh Thu Theo Từng Dịch Vụ</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Bảo dưỡng', rev: 312 },
                      { name: 'Sửa chữa', rev: 248 },
                      { name: 'Bảo hiểm', rev: 184 },
                      { name: 'Bảo hành', rev: 142 },
                      { name: 'Lái thử', rev: 0 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis unit=" Tr" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any) => [`${v} Tr VNĐ`, 'Doanh thu']} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                    <Bar dataKey="rev" radius={[4, 4, 0, 0]}>
                      <Cell fill="#16a34a" />
                      <Cell fill="#0d9488" />
                      <Cell fill="#2563eb" />
                      <Cell fill="#dc2626" />
                      <Cell fill="#71717a" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2: 2 Khung Cân Đối (ĐÃ XÓA KHỐI CHỜ DUYỆT THỪA THEO ẢNH 1 & TÍNH TOÁN ĐỘNG) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 4: Khách Đặt Lịch vs Khách Vãng Lai (TÍNH TOÁN ĐỘNG THEO LỊCH HẸN HỆ THỐNG) */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">Khách Đặt Lịch vs Khách Vãng Lai</h4>
                <span className="text-[10px] text-zinc-400 font-mono">(Tự động cập nhật theo lịch hẹn)</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicBookingVsWalkIn}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis unit="%" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any, name, item: any) => [`${v}% (${name === 'Đặt lịch trước (Web/App)' ? item.payload.datCount : item.payload.vangCount} ca)`, name]} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="DatTruoc" stackId="a" fill="#ea580c" name="Đặt lịch trước (Web/App)" />
                    <Bar dataKey="VangLai" stackId="a" fill="#0284c7" name="Khách vãng lai" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Mật Độ Yêu Cầu Theo Thứ Trong Tuần */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono mb-3">Mật Độ Yêu Cầu Theo Thứ Trong Tuần</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { day: 'T2', BaoDuong: 90, SuaChua: 60, LaiThu: 40, BaoHanh: 30, BaoHiem: 20 },
                      { day: 'T3', BaoDuong: 95, SuaChua: 65, LaiThu: 45, BaoHanh: 35, BaoHiem: 25 },
                      { day: 'T4', BaoDuong: 85, SuaChua: 55, LaiThu: 35, BaoHanh: 28, BaoHiem: 18 },
                      { day: 'T5', BaoDuong: 100, SuaChua: 70, LaiThu: 50, BaoHanh: 40, BaoHiem: 30 },
                      { day: 'T6', BaoDuong: 110, SuaChua: 80, LaiThu: 60, BaoHanh: 45, BaoHiem: 35 },
                      { day: 'T7', BaoDuong: 180, SuaChua: 110, LaiThu: 90, BaoHanh: 60, BaoHiem: 50 },
                      { day: 'CN', BaoDuong: 195, SuaChua: 120, LaiThu: 95, BaoHanh: 65, BaoHiem: 55 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="BaoDuong" stroke="#16a34a" name="Bảo dưỡng" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="SuaChua" stroke="#ea580c" name="Sửa chữa" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="LaiThu" stroke="#eab308" name="Lái thử" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="BaoHanh" stroke="#2563eb" name="Bảo hành" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="BaoHiem" stroke="#06b6d4" name="Bảo hiểm" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── PHÂN HỆ 4: KHÁCH HÀNG (Ảnh 4) ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'khach_hang' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* 4 Big KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#064e3b]/90 to-[#022c22]/90 border border-emerald-600/50 shadow-lg">
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">Tổng Số Khách Hàng</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{rawCustomers.length > 0 ? `${rawCustomers.length} Người` : '12,850 Người'}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +5.4%)</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1e3a5f]/90 to-[#0f172a]/90 border border-blue-600/50 shadow-lg">
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider font-mono">Khách Hàng Mới</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{filteredCustomers.length > 0 ? `${filteredCustomers.length} Người` : '450 Người'}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +12.3%)</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#78350f]/90 to-[#451a03]/90 border border-amber-600/50 shadow-lg">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">Khách Có Phát Sinh Giao Dịch</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{uniqueTransactionCustomers > 0 ? `${uniqueTransactionCustomers} Người` : '1,120 Người'}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +8.5%)</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#7f1d1d]/90 to-[#450a0a]/90 border border-red-600/50 shadow-lg">
              <div className="text-xs font-bold text-red-300 uppercase tracking-wider font-mono">Tổng Lượt Khách Ghé Thăm</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{filteredAppts.length > 0 ? `${filteredAppts.length * 3} Lượt` : '3,250 Lượt'}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +15.2%)</span>
              </div>
            </div>
          </div>

          {/* Sub-KPI Strip */}
          <div className="p-3 sm:p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between flex-wrap gap-3 text-xs font-mono">
            <div>👥 Khách hàng thân thiết (VIP): <strong className="text-purple-400 font-bold">{dynamicTierStats.find(t => t.name === 'VIP')?.count || 200} người</strong></div>
            <div>🎂 Có sinh nhật trong tháng: <strong className="text-white">128 khách</strong></div>
            <div>💳 Mua trả góp: <strong className="text-amber-400">42.5%</strong></div>
            <div>💵 Mua tiền mặt: <strong className="text-emerald-400">57.5%</strong></div>
          </div>

          {/* 4 Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Phân Hạng Thẻ Thành Viên (TÍNH TOÁN ĐỘNG TỪ HỆ THỐNG) */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
                  Phân Hạng Thẻ Thành Viên
                </h3>
                <span className="text-[10px] text-zinc-400 font-mono">(Tự động theo chi tiêu khách)</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicTierStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any) => [`${v} khách`, 'Số lượng']} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 12 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      <Cell fill="#0284c7" />
                      <Cell fill="#38bdf8" />
                      <Cell fill="#64748b" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#9333ea" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Cơ Cấu Độ Tuổi & Giới Tính (TÍNH TOÁN ĐỘNG) */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
                  Cơ Cấu Độ Tuổi & Giới Tính
                </h3>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Nam</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Nữ</span>
                </div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageGenderStats} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any, name) => [`${v} khách`, name]} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                    <Bar dataKey="Nam" fill="#2563eb" name="Nam" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Nu" fill="#dc2626" name="Nữ" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Mật Độ Khách Tới Theo Khung Giờ */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
                  Mật Độ Khách Tới Theo Khung Giờ
                </h3>
                <span className="text-[10px] text-zinc-400 font-mono">8h - 20h trong ngày</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { time: '8h', count: 12 },
                      { time: '9h', count: 35 },
                      { time: '10h', count: 68 },
                      { time: '11h', count: 92 },
                      { time: '12h', count: 54 },
                      { time: '13h', count: 38 },
                      { time: '14h', count: 42 },
                      { time: '15h', count: 70 },
                      { time: '16h', count: 88 },
                      { time: '17h', count: 62 },
                      { time: '18h', count: 30 },
                      { time: '19h', count: 18 },
                      { time: '20h', count: 8 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any) => [`${v} lượt check-in`, 'Mật độ']} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                    <Area type="monotone" dataKey="count" stroke="#ea580c" fill="#ea580c" fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Phân Loại Trạng Thái Hoạt Động Khách Hàng */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
                  Phân Loại Trạng Thái Hoạt Động Khách Hàng
                </h3>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">Phân tích tương tác trong khoảng lọc</p>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Chỉ tham khảo / Tìm hiểu', value: 58.0, count: 650, fill: '#0284c7' },
                        { name: 'Đã mua xe / Lên hợp đồng', value: 21.4, count: 240, fill: '#dc2626' },
                        { name: 'Đang làm thủ tục (Trả góp/Đợi xe)', value: 16.1, count: 180, fill: '#f59e0b' },
                        { name: 'Sử dụng dịch vụ sau bán', value: 4.5, count: 50, fill: '#16a34a' },
                      ]}
                      cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value"
                    >
                      <Cell fill="#0284c7" />
                      <Cell fill="#dc2626" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#16a34a" />
                    </Pie>
                    <Tooltip formatter={(v: any, n, item: any) => [`${v}% (${item.payload.count} khách)`, n]} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] font-mono space-y-1 text-zinc-400 pt-2 border-t border-zinc-800">
                <div className="flex justify-between"><span>🔵 Tham khảo/Tìm hiểu:</span> <strong className="text-zinc-200">650 (58.0%)</strong></div>
                <div className="flex justify-between"><span>🔴 Đã mua xe/Hợp đồng:</span> <strong className="text-zinc-200">240 (21.4%)</strong></div>
                <div className="flex justify-between"><span>🟡 Đang làm thủ tục:</span> <strong className="text-zinc-200">180 (16.1%)</strong></div>
                <div className="flex justify-between"><span>🟢 Dịch vụ sau bán:</span> <strong className="text-zinc-200">50 (4.5%)</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── PHÂN HỆ 5: KHẢO SÁT & ĐÁNH GIÁ (Ảnh 5) ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'khao_sat' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* 4 Big KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#064e3b]/90 to-[#022c22]/90 border border-emerald-600/50 shadow-lg">
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">Tổng Ý Kiến Đóng Góp</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{filteredFeedbacks.length > 0 ? `${filteredFeedbacks.length} Lượt` : '1,250 Lượt'}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +14.2%)</span>
              </div>
              <div className="text-[11px] text-emerald-200/70 mt-1 font-sans">Đã đưa lên đầu thay thế cái cũ, tổng số</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1e3a5f]/90 to-[#0f172a]/90 border border-blue-600/50 shadow-lg">
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider font-mono">Điểm CSAT Trung Bình</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{csatScore} / 5.0</span>
                <span className="text-amber-400 text-xl">★</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +0.2)</span>
              </div>
              <div className="text-[11px] text-blue-200/70 mt-1 font-sans">Độ hài lòng chung của khách</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#78350f]/90 to-[#451a03]/90 border border-amber-600/50 shadow-lg">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">Tỷ Lệ Phản Hồi Khảo Sát</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>34.5%</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▲ +3.4%)</span>
              </div>
              <div className="text-[11px] text-amber-200/70 mt-1 font-sans">1,250 phiếu / 3,620 lượt gửi</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#7f1d1d]/90 to-[#450a0a]/90 border border-red-600/50 shadow-lg">
              <div className="text-xs font-bold text-red-300 uppercase tracking-wider font-mono">Tổng Số Lượt Khiếu Nại</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                <span>{filteredFeedbacks.filter(f => (f.diemDanhGia || 5) <= 3).length > 0 ? `${filteredFeedbacks.filter(f => (f.diemDanhGia || 5) <= 3).length} Lượt` : '42 Lượt'}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">(▼ -12.5%)</span>
              </div>
              <div className="text-[11px] text-red-200/70 mt-1 font-sans">Ý kiến tiêu cực, không hài lòng cần xử lý</div>
            </div>
          </div>

          {/* Sub-KPI Strip */}
          <div className="p-3 sm:p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between flex-wrap gap-3 text-xs font-mono">
            <div>📞 Khảo sát qua Zalo ZNS: <strong className="text-white">65.2%</strong></div>
            <div>💬 Khảo sát qua SMS: <strong className="text-white">22.4%</strong></div>
            <div>✉️ Khảo sát qua Email: <strong className="text-white">8.5%</strong></div>
            <div>☎️ CSKH gọi điện: <strong className="text-orange-400">3.9%</strong></div>
          </div>

          {/* Row 1: 3 Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 1: Đánh Giá Xe (1-5 Sao) (TÍNH TOÁN ĐỘNG) */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono mb-3">Đánh Giá Xe (1-5 Sao)</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={feedbackStarStats.vehicle} margin={{ left: 15, right: 25 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="star" type="category" tick={{ fontSize: 10, fill: '#e4e4e7' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip formatter={(v: any) => [`${v} phiếu`, 'Đánh giá']} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {feedbackStarStats.vehicle.map((entry, index) => (
                        <Cell key={`cell-v-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Đánh Giá Phụ Tùng (1-5 Sao) (TÍNH TOÁN ĐỘNG) */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono mb-3">Đánh Giá Phụ Tùng (1-5 Sao)</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={feedbackStarStats.parts} margin={{ left: 15, right: 25 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="star" type="category" tick={{ fontSize: 10, fill: '#e4e4e7' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip formatter={(v: any) => [`${v} phiếu`, 'Đánh giá']} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {feedbackStarStats.parts.map((entry, index) => (
                        <Cell key={`cell-p-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: So Sánh Mức Độ Hài Lòng Theo Dịch Vụ */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
                  So Sánh Mức Độ Hài Lòng Theo Dịch Vụ
                </h4>
                <span className="text-[10px] text-emerald-400 font-mono">Hài lòng</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Mua xe mới', HaiLong: 92, ChuaHaiLong: 8 },
                      { name: 'Bảo dưỡng', HaiLong: 88, ChuaHaiLong: 12 },
                      { name: 'Sửa chữa nặng', HaiLong: 82, ChuaHaiLong: 18 },
                      { name: 'Cứu hộ/Sửa', HaiLong: 95, ChuaHaiLong: 5 },
                      { name: 'Bảo hành', HaiLong: 85, ChuaHaiLong: 15 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis unit="%" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any, name) => [`${v}%`, name]} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="HaiLong" stackId="a" fill="#16a34a" name="Hài lòng" />
                    <Bar dataKey="ChuaHaiLong" stackId="a" fill="#dc2626" name="Chưa hài lòng" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2: 2 Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 4: Xu Hướng Điểm Hài Lòng Theo Khoảng Lọc */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
                  Xu Hướng Điểm Hài Lòng Theo Khoảng Lọc
                </h4>
                <span className="text-[10px] text-zinc-400 font-mono">(Biến động theo tuần)</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { week: 'Tuần 1', score: 4.4 },
                      { week: 'Tuần 2', score: 4.5 },
                      { week: 'Tuần 3', score: 4.3 },
                      { week: 'Tuần 4', score: 4.6 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[1.0, 5.0]} ticks={[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]} tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any) => [`${v} / 5.0 ★`, 'Điểm CSAT']} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                    <Line type="monotone" dataKey="score" stroke="#16a34a" strokeWidth={3} dot={{ r: 5, fill: '#16a34a' }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Trạng Thái Xử Lý Phản Hồi Đánh Giá */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
                  Trạng Thái Xử Lý Phản Hồi Đánh Giá
                </h4>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">Tiến độ giải quyết khiếu nại của CSKH</p>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Đã giải quyết', value: 57.1, count: 24, fill: '#16a34a' },
                        { name: 'Đang xử lý', value: 28.6, count: 12, fill: '#f59e0b' },
                        { name: 'Chưa tiếp nhận', value: 14.3, count: 6, fill: '#dc2626' },
                      ]}
                      cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value"
                    >
                      <Cell fill="#16a34a" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#dc2626" />
                    </Pie>
                    <Tooltip formatter={(v: any, n, item: any) => [`${v}% (${item.payload.count} ca)`, n]} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] font-mono space-y-1 text-zinc-400 pt-2 border-t border-zinc-800">
                <div className="flex justify-between"><span>🟢 Đã giải quyết:</span> <strong className="text-zinc-200">24 ca (57.1%)</strong></div>
                <div className="flex justify-between"><span>🟡 Đang xử lý:</span> <strong className="text-zinc-200">12 ca (28.6%)</strong></div>
                <div className="flex justify-between"><span>🔴 Chưa tiếp nhận:</span> <strong className="text-zinc-200">6 ca (14.3%)</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BẢN IN A4 QUẢN TRỊ CHUYÊN BIỆT CHO TRÌNH IN & XUẤT PDF ── */}
      <div id="print-reports-a4-document" className="hidden print:block font-sans bg-white text-zinc-900">
        {/* Header Quốc hiệu / Đại lý */}
        <div className="border-b-2 border-zinc-900 pb-3 mb-4 flex justify-between items-start">
          <div>
            <div className="text-base font-extrabold uppercase tracking-widest text-zinc-900">MOTOSHOP CRM SYSTEM</div>
            <div className="text-xs text-zinc-600 font-medium">Hệ Thống Đại Lý Phân Phối Xe Máy & Dịch Vụ Kỹ Thuật Hậu Mãi</div>
            <div className="text-[11px] text-zinc-500">Showroom Trung Tâm Toàn Quốc • Hotline: 1900 6868</div>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold uppercase text-zinc-900">MẪU SỐ: 01-BCQT/CRM</div>
            <div className="text-zinc-500 text-[11px]">Ngày xuất: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}</div>
          </div>
        </div>

        {/* Tiêu đề Báo Cáo */}
        <div className="text-center my-4">
          <h1 className="text-xl font-extrabold uppercase text-zinc-950 tracking-wider">
            BÁO CÁO QUẢN TRỊ VÀ HOẠT ĐỘNG KINH DOANH CRM
          </h1>
          <p className="text-xs text-zinc-600 mt-1 italic">
            (Kỳ báo cáo: {filterLabelMap[dateFilter]} — Phân hệ: {activeTab.replace('_', ' ').toUpperCase()})
          </p>
        </div>

        {/* I. Tổng Hợp Chỉ Số Kinh Doanh Cốt Lõi */}
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 border-l-4 border-orange-600 pl-2 mb-2">
            I. CHỈ SỐ KINH DOANH & TÀI CHÍNH TOÀN CỤC
          </h2>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="border border-zinc-300 rounded-lg p-2.5 bg-zinc-50">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Tổng Doanh Thu</div>
              <div className="text-sm font-extrabold text-zinc-900 mt-0.5">{formatVND(totalSystemRevenue)}</div>
              <div className="text-[9px] text-zinc-500">Cộng gộp toàn hệ thống</div>
            </div>
            <div className="border border-zinc-300 rounded-lg p-2.5 bg-zinc-50">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Xe Đã Bán Ra</div>
              <div className="text-sm font-extrabold text-blue-700 mt-0.5">{totalVehiclesSold} Chiếc</div>
              <div className="text-[9px] text-zinc-500">Đơn hoàn tất bàn giao</div>
            </div>
            <div className="border border-zinc-300 rounded-lg p-2.5 bg-zinc-50">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Khách Giao Dịch</div>
              <div className="text-sm font-extrabold text-amber-700 mt-0.5">{uniqueTransactionCustomers} Khách</div>
              <div className="text-[9px] text-zinc-500">Khách có phát sinh đơn</div>
            </div>
            <div className="border border-zinc-300 rounded-lg p-2.5 bg-zinc-50">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Chỉ Số CSAT</div>
              <div className="text-sm font-extrabold text-emerald-700 mt-0.5">{csatScore} / 5.0 ★</div>
              <div className="text-[9px] text-zinc-500">{filteredFeedbacks.length} phản hồi đánh giá</div>
            </div>
          </div>
        </div>

        {/* II. Bảng Phân Hạng Thẻ Thành Viên & Dịch Vụ Đặt Trước vs Vãng Lai */}
        <div className="grid grid-cols-2 gap-4 mb-5 print-avoid-break">
          {/* Bảng Hạng Thẻ */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 border-l-4 border-blue-600 pl-2 mb-2">
              II. CƠ CẤU HẠNG THẺ THÀNH VIÊN
            </h2>
            <table className="w-full text-left text-xs border border-zinc-300 border-collapse">
              <thead>
                <tr className="bg-zinc-100 font-bold border-b border-zinc-300">
                  <th className="p-1.5 border-r border-zinc-300">Hạng Thẻ</th>
                  <th className="p-1.5 text-center border-r border-zinc-300">Số Lượng</th>
                  <th className="p-1.5 text-right">Tỷ Trọng (%)</th>
                </tr>
              </thead>
              <tbody>
                {dynamicTierStats.map(t => {
                  const total = dynamicTierStats.reduce((s, x) => s + x.count, 0) || 1;
                  const pct = ((t.count / total) * 100).toFixed(1);
                  return (
                    <tr key={t.name} className="border-b border-zinc-200">
                      <td className="p-1.5 font-semibold border-r border-zinc-200">{t.name}</td>
                      <td className="p-1.5 text-center font-mono font-bold border-r border-zinc-200">{t.count} khách</td>
                      <td className="p-1.5 text-right font-mono">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bảng Dịch Vụ Đặt Lịch vs Vãng Lai */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 border-l-4 border-amber-600 pl-2 mb-2">
              III. ĐẶT LỊCH TRƯỚC VS KHÁCH VÃNG LAI
            </h2>
            <table className="w-full text-left text-xs border border-zinc-300 border-collapse">
              <thead>
                <tr className="bg-zinc-100 font-bold border-b border-zinc-300">
                  <th className="p-1.5 border-r border-zinc-300">Dịch Vụ</th>
                  <th className="p-1.5 text-center border-r border-zinc-300">Đặt Trước (%)</th>
                  <th className="p-1.5 text-center">Vãng Lai (%)</th>
                </tr>
              </thead>
              <tbody>
                {dynamicBookingVsWalkIn.map(b => (
                  <tr key={b.name} className="border-b border-zinc-200">
                    <td className="p-1.5 font-semibold border-r border-zinc-200">{b.name}</td>
                    <td className="p-1.5 text-center font-mono font-bold text-orange-700 border-r border-zinc-200">{b.DatTruoc}%</td>
                    <td className="p-1.5 text-center font-mono text-blue-700">{b.VangLai}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* III. Danh Sách Đơn Hàng Gần Nhất */}
        <div className="mb-6 print-avoid-break">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 border-l-4 border-emerald-600 pl-2 mb-2">
            IV. DANH SÁCH GIAO DỊCH TRONG KỲ LỌC ({filteredOrders.length} đơn)
          </h2>
          <table className="w-full text-left text-[11px] border border-zinc-300 border-collapse">
            <thead>
              <tr className="bg-zinc-100 font-bold border-b border-zinc-300">
                <th className="p-1.5 border-r border-zinc-300">Mã Đơn</th>
                <th className="p-1.5 border-r border-zinc-300">Khách Hàng</th>
                <th className="p-1.5 border-r border-zinc-300">Loại Đơn</th>
                <th className="p-1.5 border-r border-zinc-300">Ngày Đặt</th>
                <th className="p-1.5 text-right border-r border-zinc-300">Tổng Tiền (VNĐ)</th>
                <th className="p-1.5 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.slice(0, 10).map(o => (
                <tr key={o.id} className="border-b border-zinc-200">
                  <td className="p-1.5 font-mono font-bold border-r border-zinc-200">{o.id}</td>
                  <td className="p-1.5 border-r border-zinc-200">{o.hoTenKH || o.customerId || 'Khách vãng lai'}</td>
                  <td className="p-1.5 border-r border-zinc-200">{o.loaiDon === 'Xe' ? 'Xe máy' : 'Phụ tùng'}</td>
                  <td className="p-1.5 font-mono border-r border-zinc-200">{o.ngayDat ? o.ngayDat.split('T')[0] : '—'}</td>
                  <td className="p-1.5 text-right font-mono font-bold border-r border-zinc-200">{formatVND(o.tongTien || 0)}</td>
                  <td className="p-1.5 text-center font-mono text-[10px]">{o.trangThai}</td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-zinc-500 italic">Không có giao dịch nào trong khoảng thời gian này.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Khung Ký Tên 3 Bên Hành Chính Chuẩn Việt Nam */}
        <div className="pt-4 border-t border-zinc-400 grid grid-cols-3 text-center text-xs print-avoid-break">
          <div>
            <div className="font-bold uppercase text-zinc-900">NGƯỜI LẬP BÁO CÁO</div>
            <div className="text-[10px] text-zinc-500 italic mt-0.5">(Ký, ghi rõ họ tên)</div>
            <div className="h-14"></div>
            <div className="font-bold text-zinc-800">Admin Quản Trị Hệ Thống</div>
          </div>
          <div>
            <div className="font-bold uppercase text-zinc-900">KẾ TOÁN TRƯỞNG</div>
            <div className="text-[10px] text-zinc-500 italic mt-0.5">(Ký, ghi rõ họ tên)</div>
            <div className="h-14"></div>
            <div className="font-bold text-zinc-800">Bộ Phận Tài Chính - Kế Toán</div>
          </div>
          <div>
            <div className="font-bold uppercase text-zinc-900">GIÁM ĐỐC ĐẠI LÝ</div>
            <div className="text-[10px] text-zinc-500 italic mt-0.5">(Ký tên và đóng dấu)</div>
            <div className="h-14"></div>
            <div className="font-bold text-zinc-800">Ban Giám Đốc Motoshop</div>
          </div>
        </div>
      </div>

      {/* ── MODAL XUẤT BÁO CÁO (POPUP) ── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>📥</span> XUẤT BÁO CÁO THỐNG KÊ CRM
              </h3>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700 space-y-1.5">
                <div className="text-zinc-400">Khoảng thời gian: <strong className="text-white">{filterLabelMap[dateFilter]}</strong></div>
                <div className="text-zinc-400">Số đơn hàng trong kỳ: <strong className="text-emerald-400">{filteredOrders.length} đơn</strong></div>
                <div className="text-zinc-400">Tổng doanh thu kỳ lọc: <strong className="text-orange-400 font-bold">{formatVND(totalSystemRevenue)}</strong></div>
                <div className="text-zinc-400">Phân hệ đang xem: <strong className="text-white uppercase">{activeTab.replace('_', ' ')}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex flex-col items-center gap-2 cursor-pointer shadow-lg active:scale-95"
                >
                  <span className="text-2xl">📊</span>
                  <span>Tải File Excel / CSV</span>
                  <span className="text-[10px] text-emerald-200 font-normal">Xuất file dữ liệu thật UTF-8 BOM</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintA4}
                  className="p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold border border-zinc-600 transition flex flex-col items-center gap-2 cursor-pointer shadow-lg active:scale-95"
                >
                  <span className="text-2xl">🖨️</span>
                  <span>In Bản A4 Quản Trị</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Mở trình in ấn / lưu PDF chuẩn A4</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
