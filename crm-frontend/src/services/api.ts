import {
  type Customer,
  type Vehicle,
  type Part,
  type Order,
  type OrderStatus,
  type Appointment,
  type AppointmentStatus,
  type StaffAccount,
  type Feedback,
  type Survey,
  type SurveyResponse,
  type SurveyStatus,
  computeSurveyStatus,
  mockCustomers,
  mockVehicles,
  mockParts,
  mockOrders,
  mockAppointments,
  mockStaffAccounts,
  mockFeedbacks,
  mockSurveys,
  mockSurveyResponses,
} from '../data/mockData';
import { addAdminNotification } from './notifications';

export const API_BASE_URL = 'http://localhost:5208/api';

/**
 * Generic fetch wrapper with timeout and fallback
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Normalize and format customer ID consistently across frontend and backend
 * e.g., 1 -> KH001, 11 -> KH011, 2004 -> KH2004, "KH02004" -> "KH2004", "kh001" -> "KH001"
 */
export function formatCustomerId(maKH: number | string | undefined | null): string {
  if (!maKH) return 'KH001';
  const str = String(maKH).trim();
  if (!str) return 'KH001';
  if (/^KH\d+$/i.test(str)) {
    const num = parseInt(str.slice(2), 10);
    if (!isNaN(num)) {
      return num < 10 ? `KH00${num}` : num < 100 ? `KH0${num}` : `KH${num}`;
    }
    return str.toUpperCase();
  }
  const digits = str.replace(/\D/g, '');
  const num = parseInt(digits, 10);
  if (!isNaN(num)) {
    return num < 10 ? `KH00${num}` : num < 100 ? `KH0${num}` : `KH${num}`;
  }
  return str.toUpperCase();
}

// ────────────────────────────────────────────────────────────
// 1. KHÁCH HÀNG API (CUSTOMERS)
// ────────────────────────────────────────────────────────────
export const customerApi = {
  async getAll(): Promise<Customer[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/KhachHang`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return mockCustomers;

      return data.map((item: any, idx: number) => {
        const id = item.maKH ? formatCustomerId(item.maKH) : `KH${idx + 1}`;
        const mockMatch = mockCustomers.find(m => m.id === id || m.soDienThoai === item.soDienThoai);
        return {
          id,
          hoTen: item.hoTen,
          email: item.email || mockMatch?.email || `${item.tenDangNhap || 'khach'}@gmail.com`,
          soDienThoai: item.soDienThoai,
          diaChi: item.diaChi || 'TP.HCM',
          ngaySinh: item.ngaySinh ? item.ngaySinh.split('T')[0] : '1995-01-01',
          gioiTinh: item.gioiTinh === 'Nữ' || item.gioiTinh === 'Nu' ? 'Nu' : 'Nam',
          trangThai: item.trangThai === 'BiKhoa' ? 'BiKhoa' : 'HoatDong',
          ngayDangKy: item.ngayTao ? item.ngayTao.split('T')[0] : '2023-01-10',
          soXe: mockMatch?.soXe || `XE00${item.maKH || 1}`,
          tongChiTieu: mockMatch?.tongChiTieu || 0,
          avatar: mockMatch?.avatar || `/images/KH/kh${item.maKH || 1}.jpg`,
          soThich: item.soThich || mockMatch?.soThich || 'Xe tay ga cao cấp',
        };
      });
    } catch (err) {
      console.warn('[customerApi.getAll] Failed to fetch from backend, using mockData fallback:', err);
      return mockCustomers;
    }
  },

  async update(maKhInt: number, data: Partial<Customer>): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/KhachHang/${maKhInt}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoTen: data.hoTen,
          ngaySinh: data.ngaySinh ? `${data.ngaySinh}T00:00:00` : undefined,
          gioiTinh: data.gioiTinh === 'Nu' ? 'Nu' : 'Nam',
          soDienThoai: data.soDienThoai,
          diaChi: data.diaChi,
          soThich: data.soThich,
        }),
      });
      return res.ok;
    } catch (err) {
      console.warn('[customerApi.update] Backend call failed, applied locally:', err);
      return false;
    }
  },

  async toggleStatus(maKhInt: number, currentStatus: string) {
    try {
      const newStatus = currentStatus === 'HoatDong' ? 'BiKhoa' : 'HoatDong';
      await fetchWithTimeout(`${API_BASE_URL}/KhachHang/${maKhInt}/trang-thai`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trangThai: newStatus }),
      });
    } catch (err) {
      console.warn('[customerApi.toggleStatus] Backend call failed, applied locally:', err);
    }
  },

  async create(data: {
    hoTen: string;
    email: string;
    soDienThoai: string;
    diaChi?: string;
    ngaySinh?: string;
    gioiTinh?: string;
    soThich?: string;
    tenDangNhap?: string;
    matKhau?: string;
  }): Promise<{ success: boolean; customer: Customer; maKH?: number }> {
    const defaultUsername = (data.tenDangNhap || data.email || data.soDienThoai).trim();
    let createdMaKH: number | undefined;
    let customerId = `KH${Date.now().toString().slice(-4)}`;

    const res = await fetchWithTimeout(`${API_BASE_URL}/KhachHang`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hoTen: data.hoTen,
        ngaySinh: data.ngaySinh || '2000-01-01T00:00:00',
        gioiTinh: data.gioiTinh || 'Nam',
        soDienThoai: data.soDienThoai,
        diaChi: data.diaChi || 'TP.HCM',
        email: data.email,
        soThich: data.soThich || 'Xe máy, phụ tùng chính hãng',
        tenDangNhap: defaultUsername,
        matKhau: data.matKhau || '123456',
      }),
    });

    if (!res.ok) {
      let errMsg = 'Đăng ký tài khoản không thành công!';
      try {
        const errJson = await res.json();
        if (errJson && errJson.message) errMsg = errJson.message;
      } catch {}
      throw new Error(errMsg);
    }

    const resData = await res.json();
    createdMaKH = resData.maKH || resData.MaKH;
    if (createdMaKH) {
      customerId = formatCustomerId(createdMaKH);
    }

    const newCustomer: Customer = {
      id: customerId,
      hoTen: data.hoTen,
      email: data.email,
      soDienThoai: data.soDienThoai,
      diaChi: data.diaChi || 'TP.HCM',
      ngaySinh: data.ngaySinh ? data.ngaySinh.split('T')[0] : '2000-01-01',
      gioiTinh: data.gioiTinh === 'Nữ' || data.gioiTinh === 'Nu' ? 'Nu' : 'Nam',
      trangThai: 'HoatDong',
      ngayDangKy: new Date().toISOString().split('T')[0],
      soXe: '',
      tongChiTieu: 0,
      avatar: (data as any).avatar || '',
    };

    const existIdx = mockCustomers.findIndex(c => c.id === newCustomer.id || c.email === newCustomer.email);
    if (existIdx === -1) {
      mockCustomers.unshift(newCustomer);
    } else {
      mockCustomers[existIdx] = newCustomer;
    }

    addAdminNotification({
      type: 'customer_registered',
      title: '🎉 Khách hàng mới đăng ký',
      message: `${newCustomer.hoTen} (${newCustomer.soDienThoai}) vừa tạo tài khoản thành công qua cổng Khách hàng.`,
      linkPage: 'customers',
      meta: newCustomer,
    });

    return { success: true, customer: newCustomer, maKH: createdMaKH };
  },

  async deleteCustomer(maKhInt: number) {
    try {
      await fetchWithTimeout(`${API_BASE_URL}/KhachHang/${maKhInt}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('[customerApi.deleteCustomer] Backend call failed, applied locally:', err);
    }
  },

  async login(emailHoacSdt: string, matKhau: string): Promise<Customer> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/KhachHang/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailHoacSdt, matKhau }),
    });

    if (!res.ok) {
      let msg = 'Đăng nhập không thành công!';
      try {
        const data = await res.json();
        if (data.message) msg = data.message;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    const raw = data.customer;
    const cId = raw.maKH ? formatCustomerId(raw.maKH) : 'KH001';

    const customer: Customer = {
      id: cId,
      hoTen: raw.hoTen,
      email: raw.email || `${raw.tenDangNhap || 'khach'}@gmail.com`,
      soDienThoai: raw.soDienThoai,
      diaChi: raw.diaChi || 'TP.HCM',
      ngaySinh: raw.ngaySinh ? raw.ngaySinh.split('T')[0] : '2000-01-01',
      gioiTinh: raw.gioiTinh === 'Nữ' || raw.gioiTinh === 'Nu' ? 'Nu' : 'Nam',
      trangThai: raw.trangThai === 'BiKhoa' ? 'BiKhoa' : 'HoatDong',
      ngayDangKy: raw.ngayTao ? raw.ngayTao.split('T')[0] : '2024-01-01',
      soXe: `XE00${raw.maKH || 1}`,
      tongChiTieu: 0,
      avatar: raw.avatar || mockCustomers.find(c => c.id === cId || c.email === (raw.email || raw.tenDangNhap) || c.soDienThoai === raw.soDienThoai)?.avatar || '',
      soThich: raw.soThich || 'Xe máy, phụ tùng chính hãng',
    };

    const existIdx = mockCustomers.findIndex(c => c.id === customer.id || c.email === customer.email || c.soDienThoai === customer.soDienThoai);
    if (existIdx === -1) {
      mockCustomers.unshift(customer);
    } else {
      mockCustomers[existIdx] = customer;
    }

    return customer;
  },

  async checkAccount(emailHoacSdt: string): Promise<{ success: boolean; hoTen: string; soDienThoai: string; email: string }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/KhachHang/kiem-tra-tai-khoan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailHoacSdt }),
    });

    if (!res.ok) {
      let msg = 'Không tìm thấy tài khoản với thông tin này!';
      try {
        const data = await res.json();
        if (data.message) msg = data.message;
      } catch {}
      throw new Error(msg);
    }

    return await res.json();
  },

  async resetPassword(emailHoacSdt: string, matKhauMoi: string): Promise<boolean> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/KhachHang/dat-lai-mat-khau`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailHoacSdt, matKhauMoi }),
    });

    if (!res.ok) {
      let msg = 'Đặt lại mật khẩu thất bại!';
      try {
        const data = await res.json();
        if (data.message) msg = data.message;
      } catch {}
      throw new Error(msg);
    }

    return true;
  },
};

// ────────────────────────────────────────────────────────────
// 2. XE KHÁCH HÀNG & BẢO HÀNH API (VEHICLES & WARRANTY)
// ────────────────────────────────────────────────────────────
export const vehicleApi = {
  async getAll(): Promise<Vehicle[]> {
    let list: Vehicle[] = [];
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/XeKhachHang`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          list = data.map((item: any) => {
            const cId = item.maKH ? (item.maKH < 10 ? `KH00${item.maKH}` : `KH0${item.maKH}`) : 'KH001';
            const vId = item.maXeSoHuu ? (item.maXeSoHuu < 10 ? `XE00${item.maXeSoHuu}` : `XE0${item.maXeSoHuu}`) : 'XE001';
            const hanBH = item.hanBaoHanh ? item.hanBaoHanh.split('T')[0] : '2026-01-01';
            const isConHan = new Date(hanBH) > new Date();

            return {
              id: vId,
              customerId: cId,
              tenXe: item.tenXe || 'Honda SH 160i ABS',
              bienSo: item.bienSoXe || '51K-123.45',
              namSanXuat: item.ngayMua ? new Date(item.ngayMua).getFullYear() : 2023,
              hanBaoHanh: hanBH,
              mauSac: 'Đen mờ',
              trangThaiBaoHanh: isConHan ? 'ConHan' : 'HetHan',
              soKhung: item.soKhung || 'RLHKD160CB1234567',
              trangThaiDuyet: 'DaDuyet' as const,
            };
          });
        }
      }
    } catch (err) {
      console.warn('[vehicleApi.getAll] Failed to fetch from backend, using mockData fallback:', err);
    }

    // Merge with mockVehicles and localStorage cache
    let cachedVehicles: Vehicle[] = [];
    try {
      const cached = localStorage.getItem('crm_customer_vehicles');
      if (cached) cachedVehicles = JSON.parse(cached);
    } catch {}

    const vMap = new Map<string, Vehicle>();
    mockVehicles.forEach(v => vMap.set(v.id, v));
    list.forEach(v => vMap.set(v.id, { ...vMap.get(v.id), ...v }));
    cachedVehicles.forEach(v => vMap.set(v.id, { ...vMap.get(v.id), ...v }));

    return Array.from(vMap.values());
  },

  async registerVehicle(data: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const newId = `XE${Date.now().toString().slice(-4)}`;
    const newVehicle: Vehicle = {
      ...data,
      id: newId,
      trangThaiDuyet: 'ChoDuyet',
    };

    try {
      const cached = localStorage.getItem('crm_customer_vehicles');
      const list: Vehicle[] = cached ? JSON.parse(cached) : [];
      list.unshift(newVehicle);
      localStorage.setItem('crm_customer_vehicles', JSON.stringify(list));
    } catch {}

    mockVehicles.unshift(newVehicle);

    addAdminNotification({
      type: 'vehicle_registered',
      title: '🏍️ Đăng ký xe mới chờ duyệt',
      message: `Khách hàng vừa đăng ký xe: ${newVehicle.tenXe} (${newVehicle.bienSo}). Trạng thái: Chờ duyệt.`,
      linkPage: 'customers',
    });

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_registered', vehicle: newVehicle } }));
    return newVehicle;
  },

  async approveVehicle(id: string): Promise<boolean> {
    try {
      const cached = localStorage.getItem('crm_customer_vehicles');
      if (cached) {
        const list: Vehicle[] = JSON.parse(cached);
        const match = list.find(v => v.id === id);
        if (match) {
          match.trangThaiDuyet = 'DaDuyet';
          localStorage.setItem('crm_customer_vehicles', JSON.stringify(list));
        }
      }
    } catch {}

    const vMatch = mockVehicles.find(v => v.id === id);
    if (vMatch) vMatch.trangThaiDuyet = 'DaDuyet';

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_approved', vehicleId: id } }));
    return true;
  },

  async renewWarranty(
    maXeSoHuuInt: number,
    newDateStr: string,
    details?: { tenXe?: string; bienSo?: string; customerName?: string; packageMonths?: string }
  ) {
    try {
      await fetchWithTimeout(`${API_BASE_URL}/XeKhachHang/gia-han/${maXeSoHuuInt}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanBaoHanhMoi: newDateStr }),
      });
    } catch (err) {
      console.warn('[vehicleApi.renewWarranty] Backend call failed, applied locally:', err);
    }

    const vId = maXeSoHuuInt < 10 ? `XE00${maXeSoHuuInt}` : `XE0${maXeSoHuuInt}`;
    const vMatch = mockVehicles.find(v => v.id === vId || (details?.bienSo && v.bienSo === details.bienSo));
    if (vMatch) {
      vMatch.hanBaoHanh = newDateStr;
      vMatch.trangThaiBaoHanh = 'ConHan';
    }

    addAdminNotification({
      type: 'warranty_extended',
      title: '🛡️ Yêu cầu gia hạn bảo hành điện tử',
      message: `${details?.customerName || 'Khách hàng'} đã gia hạn gói ${details?.packageMonths || '12'} tháng cho xe ${details?.tenXe || vMatch?.tenXe || 'xe máy'} (${details?.bienSo || vMatch?.bienSo || ''}) đến ngày ${newDateStr}.`,
      linkPage: 'customers',
    });

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'warranty' } }));
    return true;
  },
};

// ────────────────────────────────────────────────────────────
// 3. PHỤ TÙNG API (PARTS CATALOG)
// ────────────────────────────────────────────────────────────
export const partApi = {
  async getAll(): Promise<Part[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/PhuTung`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return mockParts;

      return data.map((item: any, idx: number) => {
        const id = item.maPhuTung ? (item.maPhuTung < 10 ? `PT00${item.maPhuTung}` : `PT0${item.maPhuTung}`) : `PT${idx + 1}`;
        const mockMatch = mockParts.find(m => m.id === id || m.tenSanPham.includes(item.tenPhuTung));

        return {
          id,
          tenSanPham: item.tenPhuTung,
          thuongHieu: mockMatch?.thuongHieu || 'Chính hãng',
          giaGoc: item.donGia || mockMatch?.giaGoc || 250000,
          giaKhuyenMai: mockMatch?.giaKhuyenMai ?? null,
          soLuongTon: mockMatch?.soLuongTon ?? 50,
          danhMuc: item.loaiPhuTung || mockMatch?.danhMuc || 'Phụ tùng',
          moTa: mockMatch?.moTa || `Phụ tùng bảo hành ${item.baoHanhThang || 12} tháng`,
          hinhAnh: mockMatch?.hinhAnh || 'https://images.unsplash.com/photo-1635773054018-22c6630f9a2e?w=500',
          rating: mockMatch?.rating ?? 5.0,
          luotDanh: mockMatch?.luotDanh ?? 42,
          dongXePhuHop: mockMatch?.dongXePhuHop,
          xuatXu: mockMatch?.xuatXu,
          baoHanh: `${item.baoHanhThang || 12} tháng`,
        };
      });
    } catch (err) {
      console.warn('[partApi.getAll] Failed to fetch from backend, using mockData fallback:', err);
      return mockParts;
    }
  },
};

// ────────────────────────────────────────────────────────────
// 4. ĐƠN HÀNG API (ORDERS)
// ────────────────────────────────────────────────────────────
export const orderApi = {
  async getAll(params?: { fromDate?: string; toDate?: string; maKH?: number; trangThai?: string }): Promise<Order[]> {
    let list: Order[] = [];
    try {
      const qs = new URLSearchParams();
      if (params?.fromDate) qs.append('fromDate', params.fromDate);
      if (params?.toDate) qs.append('toDate', params.toDate);
      if (params?.maKH) qs.append('maKH', String(params.maKH));
      if (params?.trangThai) qs.append('trangThai', params.trangThai);
      const url = `${API_BASE_URL}/DonHang${qs.toString() ? `?${qs.toString()}` : ''}`;

      const res = await fetchWithTimeout(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          list = data.map((item: any, idx: number) => {
            const id = item.maDon ? (item.maDon < 10 ? `DH00${item.maDon}` : `DH0${item.maDon}`) : `DH${idx + 1}`;
            const cId = item.maKH ? (item.maKH < 10 ? `KH00${item.maKH}` : `KH0${item.maKH}`) : 'KH001';
            const mockMatch = mockOrders.find(m => m.id === id);

            let tt: OrderStatus = 'ChoDuyet';
            if (item.trangThai === 'Hoàn thành' || item.trangThai === 'HoanThanh') tt = 'HoanThanh';
            else if (item.trangThai === 'Đang giao' || item.trangThai === 'DangGiao') tt = 'DangGiao';
            else if (item.trangThai === 'Đã hủy' || item.trangThai === 'DaHuy') tt = 'DaHuy';

            return {
              id,
              customerId: cId,
              hoTenKH: item.tenKhachHang || mockMatch?.hoTenKH || 'Khách hàng',
              ngayDat: item.ngayDat ? item.ngayDat.split('T')[0] : '2024-12-01',
              trangThai: tt,
              tongTien: item.tongTien || mockMatch?.tongTien || 0,
              diaChiGiao: mockMatch?.diaChiGiao || 'TP.HCM',
              items: mockMatch?.items || [{ tenSanPham: 'Phụ tùng chính hãng', soLuong: 1, donGia: item.tongTien || 0 }],
            };
          });
        }
      }
    } catch (err) {
      console.warn('[orderApi.getAll] Failed to fetch from backend, using fallback:', err);
    }

    // Merge with cached and mockOrders so local/new orders are never lost
    let cachedOrders: Order[] = [];
    try {
      const cachedStr = localStorage.getItem('crm_orders_cache');
      if (cachedStr) cachedOrders = JSON.parse(cachedStr);
    } catch {}

    const combinedMap = new Map<string, Order>();
    mockOrders.forEach(o => combinedMap.set(o.id, o));
    cachedOrders.forEach(o => combinedMap.set(o.id, { ...combinedMap.get(o.id), ...o }));
    list.forEach(o => combinedMap.set(o.id, { ...combinedMap.get(o.id), ...o }));

    let merged = Array.from(combinedMap.values());
    try {
      localStorage.setItem('crm_orders_cache', JSON.stringify(merged));
    } catch {}

    // Apply filtering if params provided
    if (params?.fromDate) {
      merged = merged.filter(o => o.ngayDat >= params.fromDate!);
    }
    if (params?.toDate) {
      merged = merged.filter(o => o.ngayDat <= params.toDate!);
    }
    if (params?.maKH) {
      merged = merged.filter(o => parseInt(o.customerId.replace(/\D/g, ''), 10) === params.maKH);
    }
    if (params?.trangThai) {
      merged = merged.filter(o => o.trangThai === params.trangThai);
    }

    return merged;
  },

  async updateStatus(orderIdOrNum: string | number, trangThai: OrderStatus | string) {
    const orderIdStr = String(orderIdOrNum);
    const numId = parseInt(orderIdStr.replace(/\D/g, ''), 10);

    let statusKey: OrderStatus = 'ChoDuyet';
    let statusText = 'Chờ xác nhận';
    if (trangThai === 'HoanThanh' || trangThai === 'Hoàn thành') {
      statusKey = 'HoanThanh'; statusText = 'Hoàn thành';
    } else if (trangThai === 'DangGiao' || trangThai === 'Đang giao') {
      statusKey = 'DangGiao'; statusText = 'Đang giao';
    } else if (trangThai === 'DaHuy' || trangThai === 'Đã hủy') {
      statusKey = 'DaHuy'; statusText = 'Đã hủy';
    } else {
      statusKey = 'ChoDuyet'; statusText = 'Chờ xác nhận';
    }

    if (!isNaN(numId) && numId > 0) {
      try {
        await fetchWithTimeout(`${API_BASE_URL}/DonHang/trang-thai/${numId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trangThai: statusText }),
        });
      } catch (err) {
        console.warn('[orderApi.updateStatus] Backend call failed, applied locally:', err);
      }
    }

    // Update in-memory mockOrders
    mockOrders.forEach(o => {
      if (o.id === orderIdStr || parseInt(o.id.replace(/\D/g, ''), 10) === numId) {
        o.trangThai = statusKey;
      }
    });

    // Update localStorage cache
    try {
      const cached = localStorage.getItem('crm_orders_cache');
      let list: Order[] = cached ? JSON.parse(cached) : [...mockOrders];
      const matchIdx = list.findIndex(o => o.id === orderIdStr || parseInt(o.id.replace(/\D/g, ''), 10) === numId);
      if (matchIdx !== -1) {
        list[matchIdx].trangThai = statusKey;
      } else {
        const found = mockOrders.find(o => o.id === orderIdStr);
        if (found) list.unshift({ ...found, trangThai: statusKey });
      }
      localStorage.setItem('crm_orders_cache', JSON.stringify(list));
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'order', orderId: orderIdStr, status: statusKey } }));
  },

  async create(data: {
    customerId: string;
    hoTenKH: string;
    soDienThoai: string;
    diaChiGiao: string;
    items: {
      maPhuTung?: number;
      tenSanPham: string;
      soLuong: number;
      donGia: number;
    }[];
    tongTien: number;
    ghiChu?: string;
  }): Promise<{ success: boolean; order: Order; maDon?: number }> {
    let maKH = parseInt(data.customerId.replace(/\D/g, ''), 10);
    if (isNaN(maKH) || maKH <= 0) maKH = 1;

    let createdMaDon: number | undefined;
    let orderId = `DH${Date.now().toString().slice(-4)}`;

    try {
      const payloadItems = data.items.map(it => ({
        maPhuTung: it.maPhuTung && it.maPhuTung > 0 ? it.maPhuTung : 1,
        soLuong: it.soLuong,
        donGia: it.donGia,
      }));

      const res = await fetchWithTimeout(`${API_BASE_URL}/DonHang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maKH,
          tongTien: data.tongTien,
          trangThai: 'Chờ duyệt',
          items: payloadItems,
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        createdMaDon = resData.maDon || resData.MaDon;
        if (createdMaDon) {
          orderId = createdMaDon < 10 ? `DH00${createdMaDon}` : `DH0${createdMaDon}`;
        }
      }
    } catch (err) {
      console.warn('[orderApi.create] Backend failed or offline, fallback to local:', err);
    }

    const newOrder: Order = {
      id: orderId,
      customerId: data.customerId,
      hoTenKH: data.hoTenKH,
      ngayDat: new Date().toISOString().split('T')[0],
      trangThai: 'ChoDuyet',
      tongTien: data.tongTien,
      diaChiGiao: data.diaChiGiao,
      items: data.items.map(i => ({
        tenSanPham: i.tenSanPham,
        soLuong: i.soLuong,
        donGia: i.donGia,
      })),
    };

    mockOrders.unshift(newOrder);
    try {
      const cached = localStorage.getItem('crm_orders_cache');
      const list: Order[] = cached ? JSON.parse(cached) : [...mockOrders];
      if (!list.some(o => o.id === newOrder.id)) list.unshift(newOrder);
      localStorage.setItem('crm_orders_cache', JSON.stringify(list));
    } catch {}
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'order', orderId: newOrder.id } }));

    addAdminNotification({
      type: 'order_created',
      title: '📦 Đơn hàng mới phát sinh',
      message: `${newOrder.hoTenKH} vừa đặt đơn #${newOrder.id} - ${newOrder.tongTien.toLocaleString('vi-VN')} đ (${newOrder.items.length} món).`,
      linkPage: 'sales',
      meta: newOrder,
    });

    return { success: true, order: newOrder, maDon: createdMaDon };
  },
};

// ────────────────────────────────────────────────────────────
// 5. LỊCH HẸN DỊCH VỤ API (APPOINTMENTS)
// ────────────────────────────────────────────────────────────
export const appointmentApi = {
  async getAll(): Promise<Appointment[]> {
    // LH11 & LH12: Persistence qua localStorage
    let cachedList: Appointment[] = [];
    try {
      const cached = localStorage.getItem('crm_appointments_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) cachedList = parsed;
      }
    } catch {}

    let apiList: Appointment[] = [];
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/LichHen`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          apiList = data.map((item: any, idx: number) => {
            const id = item.maLich ? (item.maLich < 10 ? `LH00${item.maLich}` : `LH0${item.maLich}`) : `LH${idx + 1}`;
            const cId = item.maKH ? (item.maKH < 10 ? `KH00${item.maKH}` : `KH0${item.maKH}`) : 'KH001';
            const mockMatch = mockAppointments.find(m => m.id === id);
            const cachedMatch = cachedList.find(c => c.id === id);

            // LH04: Chuẩn hóa 5 trạng thái
            let tt: AppointmentStatus = 'ChoXacNhan';
            const statusStr = cachedMatch?.trangThai || item.trangThai || '';
            if (statusStr === 'Đã xác nhận' || statusStr === 'DaXacNhan') tt = 'DaXacNhan';
            else if (statusStr === 'Từ chối' || statusStr === 'TuChoi') tt = 'TuChoi';
            else if (statusStr === 'Đã hoàn thành' || statusStr === 'DaHoanThanh' || statusStr === 'HoanThanh') tt = 'DaHoanThanh';
            else if (statusStr === 'Đã hủy' || statusStr === 'DaHuy') tt = 'DaHuy';
            else tt = 'ChoXacNhan';

            let ldv: any = 'BaoDuong';
            if (item.loaiDichVu?.includes('Sửa') || item.loaiDichVu?.includes('Sua')) ldv = 'SuaChua';
            else if (item.loaiDichVu?.includes('Lái') || item.loaiDichVu?.includes('Lai')) ldv = 'LaiThu';

            let extractedXe = cachedMatch?.tenXe || mockMatch?.tenXe || 'Honda SH 160i ABS';
            let extractedBs = cachedMatch?.bienSo || mockMatch?.bienSo || '51K-123.45';
            if (item.ghiChu) {
              const xeMatch = item.ghiChu.match(/(?:Phương tiện|Xe):\s*([^-\]]+)/i);
              if (xeMatch && xeMatch[1]) extractedXe = xeMatch[1].trim();
              const bsMatch = item.ghiChu.match(/BS:\s*([^-\]]+)/i);
              if (bsMatch && bsMatch[1]) extractedBs = bsMatch[1].trim();
            }

            return {
              id,
              customerId: cId,
              hoTenKH: cachedMatch?.hoTenKH || item.tenKhachHang || item.TenKhachHang || item.hoTenKH || mockMatch?.hoTenKH || 'Khách hàng',
              soDienThoai: cachedMatch?.soDienThoai || item.soDienThoai || mockMatch?.soDienThoai || '0901234567',
              loaiDichVu: cachedMatch?.loaiDichVu || ldv,
              ngayHen: cachedMatch?.ngayHen || (item.ngayHen ? item.ngayHen.split('T')[0] : '2026-10-06'),
              gioHen: cachedMatch?.gioHen || (item.ngayHen && item.ngayHen.includes('T') ? item.ngayHen.split('T')[1].slice(0, 5) : '09:00'),
              trangThai: tt,
              ghiChu: cachedMatch?.ghiChu || item.ghiChu || '',
              tenXe: extractedXe,
              bienSo: extractedBs,
              nhanVienPhuTrach: cachedMatch?.nhanVienPhuTrach || mockMatch?.nhanVienPhuTrach || 'Chưa phân công',
              lyDoTuChoi: cachedMatch?.lyDoTuChoi || mockMatch?.lyDoTuChoi,
              createdDate: cachedMatch?.createdDate || mockMatch?.createdDate || (item.ngayTao ? item.ngayTao.replace('T', ' ').slice(0, 16) : undefined),
            };
          });
        }
      }
    } catch (err) {
      console.warn('[appointmentApi.getAll] Failed to fetch from backend, using cache/mock:', err);
    }

    // Merge: Kết hợp apiList, cachedList và mockAppointments
    const mergedMap = new Map<string, Appointment>();

    // 1. Initial mock
    mockAppointments.forEach(m => mergedMap.set(m.id, { ...m }));

    // 2. Api list
    apiList.forEach(a => mergedMap.set(a.id, { ...mergedMap.get(a.id), ...a }));

    // 3. Cached list (giữ lại các thay đổi mới nhất của khách và admin)
    cachedList.forEach(c => mergedMap.set(c.id, { ...mergedMap.get(c.id), ...c }));

    let result = Array.from(mergedMap.values());

    // LH10: Luôn sắp xếp lịch hẹn mới nhất lên đầu danh sách
    result.sort((a, b) => {
      const dateA = a.createdDate || `${a.ngayHen} ${a.gioHen}`;
      const dateB = b.createdDate || `${b.ngayHen} ${b.gioHen}`;
      return dateB.localeCompare(dateA);
    });

    localStorage.setItem('crm_appointments_cache', JSON.stringify(result));
    return result;
  },

  async updateStatus(apptIdOrNum: string | number, status: AppointmentStatus, lyDoTuChoi?: string) {
    const apptId = String(apptIdOrNum);
    const numId = parseInt(apptId.replace(/\D/g, ''), 10);
    const backendStatus = status === 'DaXacNhan' ? 'Đã xác nhận' :
      status === 'TuChoi' ? 'Từ chối' :
      status === 'DaHoanThanh' ? 'Hoàn thành' :
      status === 'DaHuy' ? 'Đã hủy' : 'Chờ xác nhận';

    // 1. Update in-memory
    mockAppointments.forEach(a => {
      if (a.id === apptId || parseInt(a.id.replace(/\D/g, ''), 10) === numId) {
        a.trangThai = status;
        if (lyDoTuChoi) a.lyDoTuChoi = lyDoTuChoi;
      }
    });

    // 2. Update localStorage cache (LH11, LH12)
    try {
      const cached = localStorage.getItem('crm_appointments_cache');
      let list: Appointment[] = cached ? JSON.parse(cached) : [...mockAppointments];
      const matchIdx = list.findIndex(a => a.id === apptId || parseInt(a.id.replace(/\D/g, ''), 10) === numId);
      if (matchIdx !== -1) {
        list[matchIdx].trangThai = status;
        if (lyDoTuChoi) list[matchIdx].lyDoTuChoi = lyDoTuChoi;
      } else {
        const found = mockAppointments.find(a => a.id === apptId);
        if (found) list.unshift({ ...found, trangThai: status, lyDoTuChoi });
      }
      localStorage.setItem('crm_appointments_cache', JSON.stringify(list));
    } catch {}

    // 3. Patch backend
    if (!isNaN(numId) && numId > 0) {
      try {
        await fetchWithTimeout(`${API_BASE_URL}/LichHen/${numId}/trang-thai`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trangThai: backendStatus, ghiChu: lyDoTuChoi ? `[LÝ DO TỪ CHỐI]: ${lyDoTuChoi}` : undefined }),
        });
      } catch (err) {
        console.warn('[appointmentApi.updateStatus] Backend call failed, applied locally:', err);
      }
    }

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'appointment', apptId, status } }));
  },

  async updateDetails(apptId: string, updated: Partial<Appointment>) {
    const numId = parseInt(apptId.replace(/\D/g, ''), 10);

    // Update in-memory
    mockAppointments.forEach(a => {
      if (a.id === apptId || parseInt(a.id.replace(/\D/g, ''), 10) === numId) {
        Object.assign(a, updated);
      }
    });

    // Update localStorage cache
    try {
      const cached = localStorage.getItem('crm_appointments_cache');
      let list: Appointment[] = cached ? JSON.parse(cached) : [...mockAppointments];
      const matchIdx = list.findIndex(a => a.id === apptId || parseInt(a.id.replace(/\D/g, ''), 10) === numId);
      if (matchIdx !== -1) {
        list[matchIdx] = { ...list[matchIdx], ...updated };
      }
      localStorage.setItem('crm_appointments_cache', JSON.stringify(list));
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'appointment_updated', apptId, updated } }));
  },

  async assignStaff(apptId: string, staffName: string) {
    await this.updateDetails(apptId, { nhanVienPhuTrach: staffName });
  },

  async create(data: {
    customerId?: string;
    hoTenKH: string;
    soDienThoai: string;
    loaiDichVu: 'BaoDuong' | 'SuaChua' | 'LaiThu';
    ngayHen: string; // YYYY-MM-DD
    gioHen: string;  // HH:mm
    tenXe?: string;
    bienSo?: string;
    ghiChu?: string;
    nhanVienPhuTrach?: string;
  }): Promise<{ success: boolean; appointment: Appointment; maLich?: number }> {
    let maKH = data.customerId ? parseInt(data.customerId.replace(/\D/g, ''), 10) : 1;
    if (isNaN(maKH) || maKH <= 0) maKH = 1;

    let createdMaLich: number | undefined;
    let apptId = `LH${Date.now().toString().slice(-4)}`;

    const fullDateStr = `${data.ngayHen}T${data.gioHen}:00`;
    let svcLabel = 'Bảo dưỡng định kỳ';
    if (data.loaiDichVu === 'SuaChua') svcLabel = 'Sửa chữa';
    else if (data.loaiDichVu === 'LaiThu') svcLabel = `Lái thử: ${data.tenXe || 'Xe mẫu'}`;

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/LichHen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maKH,
          loaiDichVu: svcLabel,
          ngayHen: fullDateStr,
          ghiChu: `${data.ghiChu || ''} [Phương tiện: ${data.tenXe || ''} - BS: ${data.bienSo || ''}]`.trim(),
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        createdMaLich = resData.maLich || resData.MaLich;
        if (createdMaLich) {
          apptId = createdMaLich < 10 ? `LH00${createdMaLich}` : `LH0${createdMaLich}`;
        }
      }
    } catch (err) {
      console.warn('[appointmentApi.create] Backend failed or offline, fallback to local:', err);
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const newAppt: Appointment = {
      id: apptId,
      customerId: data.customerId || `KH00${maKH}`,
      hoTenKH: data.hoTenKH,
      soDienThoai: data.soDienThoai,
      loaiDichVu: data.loaiDichVu,
      ngayHen: data.ngayHen,
      gioHen: data.gioHen,
      trangThai: 'ChoXacNhan', // LH04: Mặc định Chờ xác nhận
      ghiChu: data.ghiChu || '',
      tenXe: data.tenXe || 'Honda Wave Alpha 110cc',
      bienSo: data.bienSo || '51K-123.45',
      nhanVienPhuTrach: data.nhanVienPhuTrach || 'Chưa phân công',
      createdDate: nowStr, // LH10: Thời gian tạo mới nhất
    };

    mockAppointments.unshift(newAppt);

    // Lưu vào cache để không bị mất khi F5 (LH11, LH12)
    try {
      const cached = localStorage.getItem('crm_appointments_cache');
      const list: Appointment[] = cached ? JSON.parse(cached) : [];
      const updatedCache = [newAppt, ...list.filter(a => a.id !== newAppt.id)];
      localStorage.setItem('crm_appointments_cache', JSON.stringify(updatedCache));
    } catch {}

    const titleIcon = data.loaiDichVu === 'LaiThu' ? '🏍️ Lịch hẹn lái thử mới' : '📅 Lịch dịch vụ sửa chữa / bảo dưỡng mới';
    addAdminNotification({
      type: 'appointment_booked',
      title: titleIcon,
      message: `${newAppt.hoTenKH} (${newAppt.soDienThoai}) đặt hẹn ${svcLabel} lúc ${newAppt.gioHen} ngày ${newAppt.ngayHen}.`,
      linkPage: 'appointments',
      meta: newAppt,
    });

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'appointment_created', appointment: newAppt } }));

    return { success: true, appointment: newAppt, maLich: createdMaLich };
  },
};

// ────────────────────────────────────────────────────────────
// 6. NHÂN VIÊN API (STAFF ACCOUNTS)
// ────────────────────────────────────────────────────────────
export const staffApi = {
  async getAll(): Promise<StaffAccount[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/NhanVien`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return mockStaffAccounts;

      return data.map((item: any, idx: number) => {
        const id = item.maNV ? (item.maNV < 10 ? `ST00${item.maNV}` : `ST0${item.maNV}`) : `ST${idx}`;
        const mockMatch = mockStaffAccounts.find(m => m.id === id || m.email === item.email);

        return {
          id,
          hoTen: item.hoTen,
          email: item.email,
          soDienThoai: item.soDienThoai,
          chucVu: item.chucVu || mockMatch?.chucVu || 'Nhân viên Showroom',
          vaiTro: item.vaiTro || mockMatch?.vaiTro || 'NhanVienBanHang',
          trangThai: item.trangThai === 'BiKhoa' ? 'BiKhoa' : 'HoatDong',
          avatar: item.avatar || mockMatch?.avatar || `/images/NV/nv1.jpg`,
          ngayThamGia: item.ngayThamGia ? item.ngayThamGia.split('T')[0] : '2023-01-01',
        };
      });
    } catch (err) {
      console.warn('[staffApi.getAll] Failed to fetch from backend, using mockData fallback:', err);
      return mockStaffAccounts;
    }
  },
};

// ────────────────────────────────────────────────────────────
// 7. XE MẪU SHOWROOM CATALOG API (SHOWROOM VEHICLES)
// ────────────────────────────────────────────────────────────
export interface CatalogVehicle {
  id: string;
  maXe?: number;
  tenXe: string;
  hang: string;
  phanKhuc: string;
  giaNiemYet: number;
  mauSac: string;
  moTa: string;
  hinhAnh: string;
  coTheLaiThu: boolean;
  dongCo?: string;
  congSuat?: string;
  tieuHaoNhienLieu?: string;
  phanh?: string;
  thongSoKyThuat?: string;
}

const VEHICLE_STORAGE_KEY = 'crm_catalog_vehicles';

export const catalogVehicleApi = {
  async getAll(): Promise<CatalogVehicle[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/XeMau`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error('Empty from server');

      const mapped = data.map((item: any) => {
        const id = item.maXe ? (item.maXe < 10 ? `XM00${item.maXe}` : `XM0${item.maXe}`) : `XM${Date.now()}`;
        return {
          id,
          maXe: item.maXe,
          tenXe: item.tenXe,
          hang: item.hangXe || 'Honda',
          phanKhuc: item.loaiXe || 'Tay ga',
          giaNiemYet: Number(item.giaNiemYet) || 0,
          mauSac: item.mauSac || 'Đen bóng, Đỏ đen, Trắng bạc',
          moTa: item.thongSoKyThuat || 'Mẫu xe chính hãng phân phối tại Motoshop',
          hinhAnh: item.hinhAnh || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
          coTheLaiThu: item.coTheLaiThu !== false,
          dongCo: item.thongSoKyThuat?.split(',')[0] || '150cc eSP+',
          congSuat: '15 HP / 8.000 rpm',
          tieuHaoNhienLieu: '2.1 L/100km',
          phanh: 'Phanh đĩa ABS trước',
          thongSoKyThuat: item.thongSoKyThuat || '',
        };
      });

      localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(mapped));
      return mapped;
    } catch (err) {
      console.warn('[catalogVehicleApi.getAll] Fallback to cached or local:', err);
      const cached = localStorage.getItem(VEHICLE_STORAGE_KEY);
      if (cached) {
        try { return JSON.parse(cached); } catch {}
      }
      return [];
    }
  },

  async create(data: Omit<CatalogVehicle, 'id'>): Promise<{ success: boolean; vehicle: CatalogVehicle }> {
    let newMaXe: number | undefined;
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/XeMau`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenXe: data.tenXe,
          hangXe: data.hang,
          loaiXe: data.phanKhuc,
          giaNiemYet: data.giaNiemYet,
          thongSoKyThuat: data.thongSoKyThuat || data.moTa || '',
          mauSac: data.mauSac,
          hinhAnh: data.hinhAnh,
          coTheLaiThu: data.coTheLaiThu,
        }),
      });
      if (res.ok) {
        const resData = await res.json();
        newMaXe = resData.id;
      }
    } catch (err) {
      console.warn('[catalogVehicleApi.create] Backend call failed, saving locally:', err);
    }

    const newId = newMaXe ? (newMaXe < 10 ? `XM00${newMaXe}` : `XM0${newMaXe}`) : `XM${Date.now()}`;
    const newVehicle: CatalogVehicle = {
      ...data,
      id: newId,
      maXe: newMaXe,
    };

    try {
      const cached = localStorage.getItem(VEHICLE_STORAGE_KEY);
      const list: CatalogVehicle[] = cached ? JSON.parse(cached) : [];
      list.unshift(newVehicle);
      localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(list));
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_catalog' } }));
    return { success: true, vehicle: newVehicle };
  },

  async update(id: string, data: Partial<CatalogVehicle>): Promise<{ success: boolean }> {
    const maXe = data.maXe || parseInt(id.replace(/\D/g, ''), 10);
    if (!isNaN(maXe) && maXe > 0) {
      try {
        await fetchWithTimeout(`${API_BASE_URL}/XeMau/${maXe}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenXe: data.tenXe,
            hangXe: data.hang,
            loaiXe: data.phanKhuc,
            giaNiemYet: data.giaNiemYet,
            thongSoKyThuat: data.thongSoKyThuat || data.moTa || '',
            mauSac: data.mauSac,
            hinhAnh: data.hinhAnh,
            coTheLaiThu: data.coTheLaiThu,
          }),
        });
      } catch (err) {
        console.warn('[catalogVehicleApi.update] Backend call failed, saving locally:', err);
      }
    }

    try {
      const cached = localStorage.getItem(VEHICLE_STORAGE_KEY);
      let list: CatalogVehicle[] = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex(v => v.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data };
      } else {
        list.push({ id, ...data } as CatalogVehicle);
      }
      localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(list));
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_catalog' } }));
    return { success: true };
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const maXe = parseInt(id.replace(/\D/g, ''), 10);
    if (!isNaN(maXe) && maXe > 0) {
      try {
        await fetchWithTimeout(`${API_BASE_URL}/XeMau/${maXe}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('[catalogVehicleApi.delete] Backend call failed, deleting locally:', err);
      }
    }

    try {
      const cached = localStorage.getItem(VEHICLE_STORAGE_KEY);
      if (cached) {
        const list: CatalogVehicle[] = JSON.parse(cached);
        const filtered = list.filter(v => v.id !== id);
        localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_catalog' } }));
    return { success: true };
  },
};

// ────────────────────────────────────────────────────────────
// 8. ĐÁNH GIÁ & PHẢN HỒI API (FEEDBACK & REVIEWS)
// ────────────────────────────────────────────────────────────
const FEEDBACK_STORAGE_KEY = 'crm_feedbacks';
const CHAT_STORAGE_KEY = 'crm_chat_messages';

export interface ChatMessage {
  id: string;
  customerId: string;
  sender: 'staff' | 'customer';
  senderName: string;
  content: string;
  sentAt: string;
}

export function getCurrentStaffAccountDisplay(): string {
  try {
    const saved = localStorage.getItem('crm_current_staff');
    if (saved) {
      const staff = JSON.parse(saved);
      if (staff?.hoTen) {
        const title = staff.chucVu || (staff.vaiTro === 'SuperAdmin' ? 'Quản lý Hệ thống' : 'Chuyên viên Tư vấn & CSKH');
        return `${staff.hoTen} (${title})`;
      }
    }
  } catch {}
  const fallback = mockStaffAccounts[0];
  return `${fallback.hoTen} (${fallback.chucVu})`;
}

export const feedbackApi = {
  async getAll(): Promise<Feedback[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/PhanHoi`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: Feedback[] = data.map((item: any, idx: number) => {
            const id = item.maPH ? (item.maPH < 10 ? `PH00${item.maPH}` : `PH0${item.maPH}`) : `PH${idx + 1}`;
            const cId = item.maKH ? (item.maKH < 10 ? `KH00${item.maKH}` : `KH0${item.maKH}`) : 'KH001';
            const mockMatch = mockFeedbacks.find(f => f.id === id || f.customerId === cId);

            const pName = item.tenPhuTung || item.tenXe || item.productName || mockMatch?.productName;
            const pType: 'PhuTung' | 'XeMau' | 'DichVu' = item.tenPhuTung
              ? 'PhuTung'
              : item.tenXe
              ? 'XeMau'
              : mockMatch?.productType || 'DichVu';

            let pImg = item.hinhAnh || mockMatch?.productImage;
            if (!pImg && item.tenPhuTung) {
              const pt = mockParts.find(p => p.tenSanPham.toLowerCase().includes(item.tenPhuTung.toLowerCase()));
              pImg = pt?.hinhAnh;
            }

            // ĐG11: Không lưu và không hiển thị thông tin biển số xe trong phần đánh giá
            const cleanedXe = (item.tenXe || mockMatch?.xeDangDung)?.replace(/\s*\([^)]*\)/g, '').trim();

            return {
              id,
              customerId: cId,
              hoTen: item.hoTenKH || mockMatch?.hoTen || 'Khách hàng',
              soDienThoai: item.soDienThoai || mockMatch?.soDienThoai || '0901234567',
              email: item.email || mockMatch?.email || 'khachhang@motoshop.vn',
              diaChi: item.diaChi || mockMatch?.diaChi || 'TP.HCM',
              xeDangDung: cleanedXe,
              noiDung: item.noiDung || '',
              diemDanhGia: item.diemDanhGia || 5,
              ngayGui: item.ngayGui ? item.ngayGui.split('T')[0] : '2024-12-01',
              loaiDanhGia: pType === 'DichVu' ? 'DichVu' : 'SanPham',
              trangThai: (item.trangThaiXuLy === 'Đã phản hồi' || item.trangThaiXuLy === 'DaXuLy') ? 'DaXuLy' : 'ChoXuLy',
              loaiNhan: (item.diemDanhGia <= 3 || item.noiDung?.toLowerCase().includes('chậm') || item.noiDung?.toLowerCase().includes('lỗi')) ? 'KhieuNai' : 'DanhGia',
              ghiChuXuLy: item.ghiChuXuLy || mockMatch?.ghiChuXuLy,
              // ĐG10: Thông tin nhân viên phụ trách xử lý (đồng bộ theo tài khoản nhân viên đang thao tác)
              nhanVienXuLy: item.nhanVienXuLy || mockMatch?.nhanVienXuLy || ((item.trangThaiXuLy === 'Đã phản hồi' || item.trangThaiXuLy === 'DaXuLy') ? getCurrentStaffAccountDisplay() : undefined),
              ngayXuLy: item.ngayXuLy || mockMatch?.ngayXuLy || ((item.trangThaiXuLy === 'Đã phản hồi' || item.trangThaiXuLy === 'DaXuLy') ? (item.ngayGui ? item.ngayGui.split('T')[0] : '2024-12-05') : undefined),
              // ĐG09: Đính kèm media ảnh hoặc video
              hinhAnhDinhKem: item.hinhAnhDinhKem || mockMatch?.hinhAnhDinhKem || [],
              productId: item.maPhuTung ? `PT00${item.maPhuTung}` : item.maXe ? `XM00${item.maXe}` : mockMatch?.productId,
              productName: pName,
              productImage: pImg,
              productType: pType,
              editCount: item.soLanSua || mockMatch?.editCount || 0,
            };
          });

          // Merge locally added/updated feedbacks from storage
          const cached = localStorage.getItem(FEEDBACK_STORAGE_KEY);
          if (cached) {
            try {
              const localList: Feedback[] = JSON.parse(cached);
              localList.forEach(lf => {
                const existingIdx = mapped.findIndex(m => m.id === lf.id);
                if (existingIdx !== -1) {
                  mapped[existingIdx] = { ...mapped[existingIdx], ...lf };
                } else {
                  mapped.unshift(lf);
                }
              });
            } catch {}
          }
          return mapped;
        }
      }
    } catch (err) {
      console.warn('[feedbackApi.getAll] Fallback to mock/storage:', err);
    }

    const cached = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }
    return mockFeedbacks;
  },

  async create(data: {
    customerId: string;
    hoTen: string;
    soDienThoai?: string;
    email?: string;
    diaChi?: string;
    xeDangDung?: string;
    noiDung: string;
    diemDanhGia: number;
    loaiDanhGia?: 'DichVu' | 'SanPham' | 'BaoHanh';
    loaiNhan?: 'DanhGia' | 'KhieuNai' | 'DanhGiaMoi';
    productId?: string;
    productName?: string;
    productImage?: string;
    productType?: 'PhuTung' | 'XeMau' | 'DichVu';
    hinhAnhDinhKem?: string[];
  }): Promise<{ success: boolean; feedback: Feedback }> {
    const maKhInt = parseInt(data.customerId.replace(/\D/g, ''), 10) || 1;
    let newMaPH: number | undefined;

    const maPhuTung = data.productType === 'PhuTung' && data.productId ? parseInt(data.productId.replace(/\D/g, ''), 10) : null;
    const maXe = data.productType === 'XeMau' && data.productId ? parseInt(data.productId.replace(/\D/g, ''), 10) : null;

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/PhanHoi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maKH: maKhInt,
          maPhuTung,
          maXe,
          diemDanhGia: data.diemDanhGia,
          noiDung: data.noiDung,
          tenSanPham: data.productName,
          loaiDoiTuong: data.productType,
          hinhAnhDinhKem: data.hinhAnhDinhKem || [],
        }),
      });
      if (res.ok) {
        const resData = await res.json();
        newMaPH = resData.id;
      }
    } catch (err) {
      console.warn('[feedbackApi.create] Backend call failed, saving locally:', err);
    }

    const id = newMaPH ? (newMaPH < 10 ? `PH00${newMaPH}` : `PH0${newMaPH}`) : `PH${Date.now().toString().slice(-4)}`;
    
    // ĐG11: Xóa biển số xe khỏi xeDangDung nếu có
    const cleanedXe = (data.xeDangDung || (data.productType === 'XeMau' ? data.productName : undefined))?.replace(/\s*\([^)]*\)/g, '').trim();

    const newFb: Feedback = {
      id,
      customerId: data.customerId,
      hoTen: data.hoTen,
      soDienThoai: data.soDienThoai || '0901234567',
      email: data.email || 'khachhang@motoshop.vn',
      diaChi: data.diaChi || 'TP.HCM',
      xeDangDung: cleanedXe,
      noiDung: data.noiDung,
      diemDanhGia: data.diemDanhGia,
      ngayGui: new Date().toISOString().split('T')[0],
      loaiDanhGia: data.loaiDanhGia || (data.productType ? 'SanPham' : 'DichVu'),
      trangThai: 'ChoXuLy',
      loaiNhan: data.loaiNhan || (data.diemDanhGia <= 3 ? 'KhieuNai' : 'DanhGia'),
      productId: data.productId,
      productName: data.productName,
      productImage: data.productImage,
      productType: data.productType || 'SanPham' as any,
      hinhAnhDinhKem: data.hinhAnhDinhKem || [],
      editCount: 0,
    };

    mockFeedbacks.unshift(newFb);

    try {
      const cached = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      const list: Feedback[] = cached ? JSON.parse(cached) : [...mockFeedbacks];
      if (!list.some(f => f.id === newFb.id)) list.unshift(newFb);
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(list));
    } catch {}

    const isComplaint = newFb.loaiNhan === 'KhieuNai';
    addAdminNotification({
      type: 'feedback_received',
      title: isComplaint ? '⚠️ Khiếu nại từ khách hàng' : '⭐ Đánh giá mới từ khách hàng',
      message: `${newFb.hoTen} (${newFb.diemDanhGia}⭐ - ${newFb.productName || 'Sản phẩm'}): "${newFb.noiDung.slice(0, 50)}${newFb.noiDung.length > 50 ? '...' : ''}"`,
      linkPage: 'feedback',
      meta: newFb,
    });

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'feedback' } }));
    return { success: true, feedback: newFb };
  },

  async update(id: string, data: { diemDanhGia: number; noiDung: string; hinhAnhDinhKem?: string[] }): Promise<boolean> {
    const maPH = parseInt(id.replace(/\D/g, ''), 10);
    if (!isNaN(maPH) && maPH > 0) {
      try {
        await fetchWithTimeout(`${API_BASE_URL}/PhanHoi/${maPH}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            diemDanhGia: data.diemDanhGia,
            noiDung: data.noiDung,
            hinhAnhDinhKem: data.hinhAnhDinhKem || [],
          }),
        });
      } catch (err) {
        console.warn('[feedbackApi.update] Backend call failed:', err);
      }
    }

    const f = mockFeedbacks.find(x => x.id === id);
    if (f) {
      f.diemDanhGia = data.diemDanhGia;
      f.noiDung = data.noiDung;
      if (data.hinhAnhDinhKem) f.hinhAnhDinhKem = data.hinhAnhDinhKem;
      f.editCount = (f.editCount || 0) + 1;
    }

    try {
      const cached = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (cached) {
        const list: Feedback[] = JSON.parse(cached);
        const match = list.find(x => x.id === id);
        if (match) {
          match.diemDanhGia = data.diemDanhGia;
          match.noiDung = data.noiDung;
          if (data.hinhAnhDinhKem) match.hinhAnhDinhKem = data.hinhAnhDinhKem;
          match.editCount = (match.editCount || 0) + 1;
        }
        localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(list));
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'feedback_updated' } }));
    return true;
  },

  // ĐG10 & ĐG13: Nút đã xử lý cập nhật trạng thái ngay lập tức và lưu thông tin nhân viên xử lý
  async resolve(id: string, note?: string, staffName?: string): Promise<boolean> {
    const handler = staffName || getCurrentStaffAccountDisplay();
    const resolvedDate = new Date().toISOString().split('T')[0];

    const maPH = parseInt(id.replace(/\D/g, ''), 10);
    if (!isNaN(maPH) && maPH > 0) {
      try {
        await fetchWithTimeout(`${API_BASE_URL}/PhanHoi/${maPH}/trang-thai`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trangThai: 'Đã phản hồi', nhanVienXuLy: handler }),
        });
      } catch {}
    }

    const f = mockFeedbacks.find(x => x.id === id);
    if (f) {
      f.trangThai = 'DaXuLy';
      f.nhanVienXuLy = handler;
      f.ngayXuLy = resolvedDate;
      if (note) f.ghiChuXuLy = note;
    }

    try {
      const cached = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (cached) {
        const list: Feedback[] = JSON.parse(cached);
        const match = list.find(x => x.id === id);
        if (match) {
          match.trangThai = 'DaXuLy';
          match.nhanVienXuLy = handler;
          match.ngayXuLy = resolvedDate;
          if (note) match.ghiChuXuLy = note;
        }
        localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(list));
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'feedback' } }));
    return true;
  },
};

// ────────────────────────────────────────────────────────────
// 8.1. WEB LIVE CHAT API (ĐG07)
// ────────────────────────────────────────────────────────────
const chatChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('crm_live_chat_channel')
  : null;

export const chatApi = {
  getBroadcastChannel() {
    return chatChannel;
  },

  async getMessages(customerId?: string): Promise<ChatMessage[]> {
    const cleanId = customerId ? formatCustomerId(customerId) : undefined;
    let serverMsgs: ChatMessage[] = [];
    try {
      const url = cleanId
        ? `${API_BASE_URL}/PhanHoi/messages?customerId=${encodeURIComponent(cleanId)}`
        : `${API_BASE_URL}/PhanHoi/messages`;
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          serverMsgs = data.map((d: any) => ({
            id: d.id,
            customerId: formatCustomerId(d.customerId),
            sender: d.sender,
            senderName: d.senderName,
            content: d.content,
            sentAt: d.sentAt ? (typeof d.sentAt === 'string' && d.sentAt.includes('T') ? d.sentAt.replace('T', ' ').slice(0, 16) : String(d.sentAt)) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
        }
      }
    } catch (err) {
      console.warn('[chatApi.getMessages] Backend call failed, using local/cached:', err);
    }

    const cached = localStorage.getItem(CHAT_STORAGE_KEY);
    let localMsgs: ChatMessage[] = [];
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          localMsgs = parsed.map((m: any) => ({
            ...m,
            customerId: formatCustomerId(m.customerId),
          }));
        }
      } catch {}
    }

    const map = new Map<string, ChatMessage>();
    // Default seed messages ONLY when whole system is empty and asking for KH001 or all
    if (serverMsgs.length === 0 && localMsgs.length === 0 && (!cleanId || cleanId === 'KH001')) {
      localMsgs = [
        {
          id: 'msg-sample-1',
          customerId: 'KH001',
          sender: 'customer',
          senderName: 'Nguyễn Văn An',
          content: 'Chào showroom, em vừa bảo dưỡng xe và thay nhớt Motul hôm qua, dịch vụ rất tốt ạ!',
          sentAt: '09:15',
        },
        {
          id: 'msg-sample-2',
          customerId: 'KH001',
          sender: 'staff',
          senderName: 'CSKH Showroom Motoshop',
          content: 'Dạ cảm ơn anh An đã tin tưởng Motoshop! Chúc anh luôn có những hành trình vạn dặm bình an ❤️',
          sentAt: '09:20',
        },
      ];
    }

    serverMsgs.forEach(m => map.set(m.id, m));
    localMsgs.forEach(m => {
      if (!map.has(m.id)) map.set(m.id, m);
    });

    const merged = Array.from(map.values());
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(merged));
    } catch {}

    if (cleanId) {
      return merged.filter(m => formatCustomerId(m.customerId) === cleanId);
    }
    return merged;
  },

  async sendMessage(msg: {
    customerId: string;
    sender: 'staff' | 'customer';
    senderName: string;
    content: string;
  }): Promise<ChatMessage> {
    const targetCustId = formatCustomerId(msg.customerId);
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      customerId: targetCustId,
      sender: msg.sender,
      senderName: msg.senderName,
      content: msg.content.trim(),
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/PhanHoi/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) newMsg.id = data.id;
      }
    } catch (err) {
      console.warn('[chatApi.sendMessage] Backend call failed, saved locally:', err);
    }

    try {
      const cached = localStorage.getItem(CHAT_STORAGE_KEY);
      const list: ChatMessage[] = cached ? JSON.parse(cached) : [];
      if (!list.some(m => m.id === newMsg.id)) {
        list.push(newMsg);
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(list));
      }
    } catch {}

    // Broadcast across all open tabs/windows
    if (chatChannel) {
      try {
        chatChannel.postMessage(newMsg);
      } catch {}
    }

    // Broadcast in current window
    window.dispatchEvent(new CustomEvent('crm-chat-update', { detail: newMsg }));
    return newMsg;
  },

  async getConversations(): Promise<Array<{
    customerId: string;
    customerName: string;
    lastMessage: string;
    lastSentAt: string;
    totalMessages: number;
    lastSender: string;
    unreadCount?: number;
    phone?: string;
  }>> {
    let rawConvs: any[] = [];
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/PhanHoi/conversations`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) rawConvs = data;
      }
    } catch {}

    const allMsgs = await this.getMessages();
    const map = new Map<string, any>();

    // Seed from backend conversations
    rawConvs.forEach(c => {
      const cId = formatCustomerId(c.customerId);
      map.set(cId, {
        customerId: cId,
        customerName: c.customerName || `Khách hàng (${cId})`,
        lastMessage: c.lastMessage || '',
        lastSentAt: c.lastSentAt ? (typeof c.lastSentAt === 'string' && c.lastSentAt.includes('T') ? c.lastSentAt.replace('T', ' ').slice(0, 16) : String(c.lastSentAt)) : '',
        totalMessages: c.totalMessages || 0,
        lastSender: c.lastSender || '',
      });
    });

    // Merge with local/recent messages
    allMsgs.forEach(m => {
      const cId = formatCustomerId(m.customerId);
      const existing = map.get(cId);
      if (!existing) {
        map.set(cId, {
          customerId: cId,
          customerName: m.sender === 'customer' ? m.senderName : `Khách hàng (${cId})`,
          lastMessage: m.content,
          lastSentAt: m.sentAt,
          totalMessages: 1,
          lastSender: m.sender,
        });
      } else {
        existing.totalMessages = Math.max(existing.totalMessages, 1);
        if (!existing.lastMessage) existing.lastMessage = m.content;
        if (!existing.lastSentAt) existing.lastSentAt = m.sentAt;
        if (m.sender === 'customer' && (!existing.customerName || existing.customerName.startsWith('Khách hàng ('))) {
          existing.customerName = m.senderName;
        }
      }
    });

    // Merge with all registered customers so newly created accounts appear in Admin Live Chat console
    try {
      const allCustomers = await customerApi.getAll();
      allCustomers.forEach(cust => {
        const cId = formatCustomerId(cust.id);
        const existing = map.get(cId);
        if (!existing) {
          map.set(cId, {
            customerId: cId,
            customerName: cust.hoTen,
            phone: cust.soDienThoai,
            lastMessage: 'Chưa có tin nhắn',
            lastSentAt: '',
            totalMessages: 0,
            lastSender: '',
          });
        } else {
          existing.customerName = cust.hoTen;
          existing.phone = cust.soDienThoai;
        }
      });
    } catch {}

    const list = Array.from(map.values());
    return list.sort((a, b) => {
      if (a.totalMessages > 0 && b.totalMessages === 0) return -1;
      if (a.totalMessages === 0 && b.totalMessages > 0) return 1;
      if (a.lastSentAt && b.lastSentAt) {
        return b.lastSentAt.localeCompare(a.lastSentAt);
      }
      return a.customerId.localeCompare(b.customerId);
    });
  },
};

// ────────────────────────────────────────────────────────────
// 9. KHẢO SÁT API (SURVEYS & RESPONSES)
// ────────────────────────────────────────────────────────────
const SURVEY_STORAGE_KEY = 'crm_surveys';
const SURVEY_RESPONSE_KEY = 'crm_survey_responses';

export const surveyApi = {
  getAll(): Survey[] {
    let list: Survey[] = [];
    try {
      const cached = localStorage.getItem(SURVEY_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      }
    } catch {}

    if (list.length === 0) {
      list = [...mockSurveys];
      localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(list));
    } else {
      // Merge any new surveys from mockSurveys if missing
      mockSurveys.forEach(ms => {
        const existing = list.find(s => s.id === ms.id);
        if (!existing) {
          list.push(ms);
        } else {
          // Merge missing dates and fields
          if (!existing.startDate && ms.startDate) existing.startDate = ms.startDate;
          if (!existing.endDate && ms.endDate) existing.endDate = ms.endDate;
          if (!existing.publishDate && ms.publishDate) existing.publishDate = ms.publishDate;
          if (!existing.targetCustomerTier && ms.targetCustomerTier) existing.targetCustomerTier = ms.targetCustomerTier;
        }
      });
    }

    // KS08: Tự động cập nhật trạng thái thời gian thực: Nháp -> Sắp diễn ra -> Đang diễn ra -> Đã kết thúc
    return list.map(s => {
      const liveStatus = computeSurveyStatus(s);
      return {
        ...s,
        status: liveStatus,
      };
    });
  },

  create(survey: Omit<Survey, 'id' | 'createdDate' | 'status'> & { id?: string; status?: SurveyStatus }): Survey {
    const nowIso = new Date().toISOString();
    const createdDate = nowIso.split('T')[0];
    const pubDate = survey.publishDate || nowIso.slice(0, 16);
    const sDate = survey.startDate || nowIso.slice(0, 16);
    const eDate = survey.endDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16);

    const tempSurvey: Survey = {
      ...survey,
      id: survey.id || `KS${Date.now().toString().slice(-4)}`,
      createdDate,
      publishDate: pubDate,
      startDate: sDate,
      endDate: eDate,
      status: survey.status || 'DangDienRa',
      targetCustomerId: survey.targetCustomerId || 'ALL',
      targetCustomerTier: survey.targetCustomerTier || 'ALL',
      targetCustomerIds: survey.targetCustomerIds || [],
    };

    const liveStatus = computeSurveyStatus(tempSurvey);
    const newSurvey: Survey = {
      ...tempSurvey,
      status: liveStatus,
    };

    const current = surveyApi.getAll();
    const updated = [newSurvey, ...current.filter(s => s.id !== newSurvey.id)];
    localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(updated));

    mockSurveys.unshift(newSurvey);

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'surveys' } }));
    return newSurvey;
  },

  getResponses(surveyId?: string): SurveyResponse[] {
    try {
      const cached = localStorage.getItem(SURVEY_RESPONSE_KEY);
      const list: SurveyResponse[] = cached ? JSON.parse(cached) : mockSurveyResponses;
      if (surveyId) return list.filter(r => r.surveyId === surveyId);
      return list;
    } catch {
      return mockSurveyResponses;
    }
  },

  submitResponse(response: Omit<SurveyResponse, 'id' | 'submittedDate'>): SurveyResponse {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newResp: SurveyResponse = {
      ...response,
      id: `RSP${Date.now().toString().slice(-4)}`,
      submittedDate: nowStr,
    };

    const all = surveyApi.getResponses();
    all.push(newResp);
    localStorage.setItem(SURVEY_RESPONSE_KEY, JSON.stringify(all));

    const sMatch = surveyApi.getAll().find(s => s.id === response.surveyId);

    addAdminNotification({
      type: 'survey_submitted',
      title: '📊 Khách hàng vừa gửi câu trả lời khảo sát',
      message: `${response.customerName} (${response.customerId}) đã hoàn thành khảo sát "${sMatch?.title || response.surveyId}".`,
      linkPage: 'feedback',
      meta: newResp,
    });

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'survey_responses' } }));
    return newResp;
  },
};


