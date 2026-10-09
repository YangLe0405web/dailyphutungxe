import {
  type Customer,
  type Vehicle,
  type Part,
  type Order,
  type OrderStatus,
  type Appointment,
  type AppointmentStatus,
  type ServiceType,
  type VehicleOrderDetails,
  type StaffAccount,
  type Feedback,
  type Survey,
  type SurveyResponse,
  type SurveyStatus,
  type InsuranceContract,
  type InsurancePackage,
  type InsuranceStatus,
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
  mockInsuranceContracts,
  INSURANCE_PACKAGES,
  type WarrantyRecord,
  type WarrantyAppointment,
  type WarrantyAppointmentStatus,
  type TechnicalAssessment,
  type WarrantyDecision,
  type ExtendedWarrantyPackage,
  mockWarrantyRecords,
  mockWarrantyAppointments,
  EXTENDED_WARRANTY_PACKAGES,
  mockVehicleServiceHistories,
  type VehicleServiceHistoryRecord,
} from '../data/mockData';
import { addAdminNotification, addCustomerNotification } from './notifications';
export { addAdminNotification, addCustomerNotification };

export const API_BASE_URL = 'http://localhost:5208/api';

/**
 * Generic fetch wrapper with timeout and fallback
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 2500) {
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
      // 1. Kiểm tra cache localStorage trước
      let customCustomers: Customer[] = [];
      try {
        const cached = localStorage.getItem('crm_custom_customers');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            customCustomers = parsed;
          }
        }
      } catch {}

      const res = await fetchWithTimeout(`${API_BASE_URL}/KhachHang`);
      let backendCustomers: Customer[] = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          backendCustomers = data.map((item: any, idx: number) => {
            const rawId = item.maKH ? formatCustomerId(item.maKH) : `KH${idx + 1}`;
            const customMatch = customCustomers.find(
              m => m.id === rawId || m.soDienThoai === item.soDienThoai || m.email.toLowerCase() === (item.email || '').toLowerCase()
            );
            const mockMatch = mockCustomers.find(
              m => m.id === rawId || m.soDienThoai === item.soDienThoai || m.email.toLowerCase() === (item.email || '').toLowerCase()
            );
            const id = customMatch ? customMatch.id : mockMatch ? mockMatch.id : rawId;
            return {
              id,
              hoTen: item.hoTen || customMatch?.hoTen || mockMatch?.hoTen || 'Khách hàng',
              email: item.email || customMatch?.email || mockMatch?.email || `${item.tenDangNhap || 'khach'}@gmail.com`,
              soDienThoai: item.soDienThoai || customMatch?.soDienThoai || mockMatch?.soDienThoai || '',
              diaChi: item.diaChi || customMatch?.diaChi || mockMatch?.diaChi || 'TP.HCM',
              ngaySinh: item.ngaySinh ? item.ngaySinh.split('T')[0] : (customMatch?.ngaySinh || mockMatch?.ngaySinh || '1995-01-01'),
              gioiTinh: item.gioiTinh === 'Nữ' || item.gioiTinh === 'Nu' ? 'Nu' : 'Nam',
              trangThai: (customMatch?.trangThai || item.trangThai) === 'BiKhoa' ? 'BiKhoa' : 'HoatDong',
              ngayDangKy: item.ngayTao ? item.ngayTao.split('T')[0] : (customMatch?.ngayDangKy || mockMatch?.ngayDangKy || '2023-01-10'),
              soXe: customMatch?.soXe || mockMatch?.soXe || `XE00${item.maKH || 1}`,
              tongChiTieu: customMatch?.tongChiTieu ?? mockMatch?.tongChiTieu ?? 0,
              // H02: Ưu tiên avatar tùy chỉnh đã lưu
              avatar: item.avatar || customMatch?.avatar || mockMatch?.avatar || `/images/KH/kh${item.maKH || 1}.jpg`,
              soThich: item.soThich || customMatch?.soThich || mockMatch?.soThich || 'Xe tay ga cao cấp',
              matKhau: customMatch?.matKhau || mockMatch?.matKhau || '123456',
            };
          });
        }
      }

      // Merge: Bắt đầu từ mockCustomers và customCustomers
      const map = new Map<string, Customer>();
      mockCustomers.forEach(c => map.set(c.id, c));
      customCustomers.forEach(c => map.set(c.id, { ...(map.get(c.id) || {}), ...c }));
      backendCustomers.forEach(c => {
        const existing = map.get(c.id);
        if (existing) {
          map.set(c.id, {
            ...existing,
            ...c,
            avatar: existing.avatar || c.avatar,
            trangThai: existing.trangThai || c.trangThai,
            tongChiTieu: existing.tongChiTieu || c.tongChiTieu,
          });
        } else {
          map.set(c.id, c);
        }
      });

      return Array.from(map.values());
    } catch (err) {
      console.warn('[customerApi.getAll] Failed to fetch from backend, using mockData fallback:', err);
      try {
        const cached = localStorage.getItem('crm_custom_customers');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
      return mockCustomers;
    }
  },

  saveLocal(list: Customer[]) {
    try {
      localStorage.setItem('crm_custom_customers', JSON.stringify(list));
    } catch {}
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
      // Backend endpoint chuẩn: PUT /api/KhachHang/khoa/{maKh}
      await fetchWithTimeout(`${API_BASE_URL}/KhachHang/khoa/${maKhInt}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

    const cId = formatCustomerId(maKhInt);
    // 1. Dọn dẹp mockCustomers
    const idx = mockCustomers.findIndex(c => c.id === cId || parseInt(c.id.replace(/\D/g, ''), 10) === maKhInt);
    if (idx !== -1) mockCustomers.splice(idx, 1);

    // 2. Dọn dẹp localStorage crm_custom_customers
    try {
      const cached = localStorage.getItem('crm_custom_customers');
      if (cached) {
        const list: Customer[] = JSON.parse(cached);
        const filtered = list.filter(c => c.id !== cId && parseInt(c.id.replace(/\D/g, ''), 10) !== maKhInt);
        localStorage.setItem('crm_custom_customers', JSON.stringify(filtered));
      }
    } catch {}

    // 3. Dọn dẹp xe liên quan trong crm_customer_vehicles
    try {
      const cachedVeh = localStorage.getItem('crm_customer_vehicles');
      if (cachedVeh) {
        const list: Vehicle[] = JSON.parse(cachedVeh);
        const filtered = list.filter(v => v.customerId !== cId && parseInt(v.customerId.replace(/\D/g, ''), 10) !== maKhInt);
        localStorage.setItem('crm_customer_vehicles', JSON.stringify(filtered));
      }
    } catch {}

    // 4. Nếu là tài khoản đang đăng nhập hiện tại, xóa phiên
    try {
      const cur = localStorage.getItem('crm_current_customer');
      if (cur) {
        const parsed = JSON.parse(cur);
        if (parsed.id === cId || parseInt(parsed.id.replace(/\D/g, ''), 10) === maKhInt) {
          localStorage.removeItem('crm_current_customer');
        }
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'customer_deleted', customerId: cId } }));
  },

  async login(emailHoacSdt: string, matKhau: string): Promise<Customer> {
    const input = emailHoacSdt.trim().toLowerCase();
    try {
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
      const rawId = raw.maKH ? formatCustomerId(raw.maKH) : 'KH001';
      const mockMatch = mockCustomers.find(
        m => m.id === rawId || m.soDienThoai === raw.soDienThoai || m.email.toLowerCase() === (raw.email || '').toLowerCase()
      );
      const customer: Customer = {
        id: rawId,
        hoTen: raw.hoTen || mockMatch?.hoTen || 'Khách hàng',
        email: raw.email || mockMatch?.email || `${raw.tenDangNhap || 'khach'}@gmail.com`,
        soDienThoai: raw.soDienThoai,
        diaChi: raw.diaChi || mockMatch?.diaChi || 'TP.HCM',
        ngaySinh: raw.ngaySinh ? raw.ngaySinh.split('T')[0] : (mockMatch?.ngaySinh || '2000-01-01'),
        gioiTinh: raw.gioiTinh === 'Nữ' || raw.gioiTinh === 'Nu' ? 'Nu' : 'Nam',
        trangThai: raw.trangThai === 'BiKhoa' ? 'BiKhoa' : 'HoatDong',
        ngayDangKy: raw.ngayTao ? raw.ngayTao.split('T')[0] : (mockMatch?.ngayDangKy || '2024-01-01'),
        soXe: mockMatch?.soXe || `XE00${raw.maKH || 1}`,
        tongChiTieu: mockMatch?.tongChiTieu ?? 0,
        avatar: raw.avatar || mockMatch?.avatar || `/images/KH/kh${raw.maKH || 1}.jpg`,
        soThich: raw.soThich || mockMatch?.soThich || 'Xe máy, phụ tùng chính hãng',
        matKhau: raw.matKhau || mockMatch?.matKhau || '123456',
      };

      if (customer.trangThai === 'BiKhoa') {
        throw new Error('⚠️ Tài khoản của quý khách hiện đang BỊ KHÓA do vi phạm chính sách hoặc theo yêu cầu quản trị. Vui lòng liên hệ Hotline 1900 8888 để được hỗ trợ!');
      }

      const existIdx = mockCustomers.findIndex(c => c.id === customer.id || c.email === customer.email || c.soDienThoai === customer.soDienThoai);
      if (existIdx === -1) {
        mockCustomers.unshift(customer);
      } else {
        mockCustomers[existIdx] = { ...mockCustomers[existIdx], ...customer };
      }

      localStorage.setItem('crm_current_customer', JSON.stringify(customer));
      return customer;
    } catch (err: any) {
      if (err?.message?.includes('BỊ KHÓA')) {
        throw err;
      }

      // Fallback cho tài khoản mẫu offline nếu có sự cố kết nối
      let customCustomers: Customer[] = [];
      try {
        const cached = localStorage.getItem('crm_custom_customers');
        if (cached) customCustomers = JSON.parse(cached);
      } catch {}

      const localMatch = customCustomers.find(
        c => c.email.toLowerCase() === input ||
             c.soDienThoai.replace(/\D/g, '') === input.replace(/\D/g, '') ||
             (input.includes('nguyenvanan') && c.id === 'KH001')
      ) || mockCustomers.find(
        c => c.email.toLowerCase() === input ||
             c.soDienThoai.replace(/\D/g, '') === input.replace(/\D/g, '') ||
             (input.includes('nguyenvanan') && c.id === 'KH001')
      );

      if (localMatch) {
        if (localMatch.trangThai === 'BiKhoa') {
          throw new Error('⚠️ Tài khoản của quý khách hiện đang BỊ KHÓA do vi phạm chính sách hoặc theo yêu cầu quản trị. Vui lòng liên hệ Hotline 1900 8888 để được hỗ trợ!');
        }
        const expectedPass = localMatch.matKhau || '123456';
        if (matKhau === expectedPass) {
          localStorage.setItem('crm_current_customer', JSON.stringify(localMatch));
          return localMatch;
        } else {
          throw new Error('Mật khẩu không chính xác! Vui lòng thử lại.');
        }
      }
      throw err;
    }
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

  async changePasswordWithOld(emailHoacSdt: string, matKhauCu: string, matKhauMoi: string): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/KhachHang/doi-mat-khau`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailHoacSdt, matKhauCu, matKhauMoi }),
      });

      if (!res.ok) {
        let msg = 'Đổi mật khẩu thất bại!';
        try {
          const data = await res.json();
          if (data.message) msg = data.message;
        } catch {}
        throw new Error(msg);
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }
      console.warn('[customerApi.changePasswordWithOld] Backend call failed, applied locally:', err);
    }

    try {
      const cached = localStorage.getItem('crm_custom_customers');
      let list: Customer[] = cached ? JSON.parse(cached) : [...mockCustomers];
      list = list.map(c => {
        if (
          c.email?.toLowerCase() === emailHoacSdt.toLowerCase() ||
          c.soDienThoai === emailHoacSdt ||
          c.id === emailHoacSdt
        ) {
          return { ...c, matKhau: matKhauMoi };
        }
        return c;
      });
      localStorage.setItem('crm_custom_customers', JSON.stringify(list));

      const currentCust = localStorage.getItem('crm_current_customer');
      if (currentCust) {
        const parsed = JSON.parse(currentCust);
        if (
          parsed.email?.toLowerCase() === emailHoacSdt.toLowerCase() ||
          parsed.soDienThoai === emailHoacSdt ||
          parsed.id === emailHoacSdt
        ) {
          localStorage.setItem('crm_current_customer', JSON.stringify({ ...parsed, matKhau: matKhauMoi }));
        }
      }
    } catch {}

    const m = mockCustomers.find(
      c => c.email?.toLowerCase() === emailHoacSdt.toLowerCase() || c.soDienThoai === emailHoacSdt || c.id === emailHoacSdt
    );
    if (m) {
      m.matKhau = matKhauMoi;
    }

    return true;
  },

  async changePassword(emailHoacSdt: string, matKhauMoi: string): Promise<boolean> {
    try {
      await fetchWithTimeout(`${API_BASE_URL}/KhachHang/dat-lai-mat-khau`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailHoacSdt, matKhauMoi }),
      });
    } catch (err) {
      console.warn('[customerApi.changePassword] Backend call failed, applied locally:', err);
    }

    try {
      const cached = localStorage.getItem('crm_custom_customers');
      let list: Customer[] = cached ? JSON.parse(cached) : [...mockCustomers];
      list = list.map(c => {
        if (
          c.email?.toLowerCase() === emailHoacSdt.toLowerCase() ||
          c.soDienThoai === emailHoacSdt ||
          c.id === emailHoacSdt
        ) {
          return { ...c, matKhau: matKhauMoi };
        }
        return c;
      });
      localStorage.setItem('crm_custom_customers', JSON.stringify(list));

      const currentCust = localStorage.getItem('crm_current_customer');
      if (currentCust) {
        const parsed = JSON.parse(currentCust);
        if (
          parsed.email?.toLowerCase() === emailHoacSdt.toLowerCase() ||
          parsed.soDienThoai === emailHoacSdt ||
          parsed.id === emailHoacSdt
        ) {
          localStorage.setItem('crm_current_customer', JSON.stringify({ ...parsed, matKhau: matKhauMoi }));
        }
      }
    } catch {}

    const m = mockCustomers.find(
      c => c.email?.toLowerCase() === emailHoacSdt.toLowerCase() || c.soDienThoai === emailHoacSdt || c.id === emailHoacSdt
    );
    if (m) {
      m.matKhau = matKhauMoi;
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
            let cId = item.maKH ? (item.maKH < 10 ? `KH00${item.maKH}` : `KH0${item.maKH}`) : 'KH001';
            if (item.maKH === 14) cId = 'KH004';
            else if (item.maKH === 15) cId = 'KH006';
            else if (item.maKH === 16) cId = 'KH008';
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
    let newId = `XE${Date.now().toString().slice(-4)}`;

    // Đối với xe do khách hàng đăng ký trên web: mặc định là "xe mua ngoài hệ thống", không áp dụng bảo hành cửa hàng
    const newVehicle: Vehicle = {
      ...data,
      id: newId,
      nguonGoc: 'NgoaiHeThong',
      trangThaiDuyet: 'ChoDuyet',
      trangThaiDuyetBienSo: 'ChoDuyet',
      bienSoChoDuyet: data.bienSo,
      trangThaiBaoHanh: 'KhongApDung',
      hanBaoHanh: 'Không áp dụng',
    };

    // ĐKX02: Gửi request lên backend CrmBackend
    try {
      const maKH = parseInt(data.customerId.replace(/\D/g, ''), 10) || 1;
      const res = await fetchWithTimeout(`${API_BASE_URL}/XeKhachHang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maKH,
          bienSoXe: data.bienSo,
          soKhung: data.soKhung || '',
          soMay: '',
          ngayMua: new Date().toISOString(),
          hanBaoHanh: '1970-01-01T00:00:00Z',
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        const beId = resData.MaXeSoHuu || resData.maXeSoHuu;
        if (beId) {
          newId = beId < 10 ? `XE00${beId}` : `XE0${beId}`;
          newVehicle.id = newId;
        }
      }
    } catch (err) {
      console.warn('[vehicleApi.registerVehicle] Backend call failed, using local cache:', err);
    }

    // ĐKX02: Lưu bền vững vào localStorage
    try {
      const cached = localStorage.getItem('crm_customer_vehicles');
      const list: Vehicle[] = cached ? JSON.parse(cached) : [];
      const existingIdx = list.findIndex(v => v.bienSo === newVehicle.bienSo || v.id === newVehicle.id);
      if (existingIdx !== -1) {
        list[existingIdx] = newVehicle;
      } else {
        list.unshift(newVehicle);
      }
      localStorage.setItem('crm_customer_vehicles', JSON.stringify(list));
    } catch {}

    const mockIdx = mockVehicles.findIndex(v => v.bienSo === newVehicle.bienSo || v.id === newVehicle.id);
    if (mockIdx !== -1) {
      mockVehicles[mockIdx] = newVehicle;
    } else {
      mockVehicles.unshift(newVehicle);
    }

    addAdminNotification({
      type: 'vehicle_registered',
      title: '🏍️ Đăng ký xe mới kèm Cà vẹt chờ duyệt',
      message: `Khách hàng vừa đăng ký xe: ${newVehicle.tenXe} (${newVehicle.bienSo}) kèm ảnh cà vẹt xe. Trạng thái: Chờ duyệt.`,
      linkPage: 'customers',
    });

    addCustomerNotification({
      customerId: newVehicle.customerId,
      icon: '🏍️',
      title: '🏍️ Đã gửi hồ sơ đăng ký phương tiện',
      message: `Hồ sơ đăng ký xe ${newVehicle.tenXe} (${newVehicle.bienSo}) kèm ảnh cà vẹt xe đã được gửi tới showroom. Vui lòng chờ nhân viên kiểm tra xét duyệt.`,
      category: 'order',
      page: 'dashboard',
      tab: 'vehicles',
      targetId: newVehicle.id,
    });

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_registered', vehicle: newVehicle } }));
    return newVehicle;
  },

  async createSoldVehicle(data: {
    customerId: string;
    tenXe: string;
    hangXe?: string;
    bienSo?: string;
    mauSac?: string;
    dongCo?: string;
    soKhung?: string;
    soMay?: string;
    namSanXuat?: string | number;
    hanBaoHanh?: string;
  }): Promise<Vehicle> {
    let newId = `XE${Date.now().toString().slice(-4)}`;
    const hanBH = data.hanBaoHanh || new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const isChuaCoBienSo = !data.bienSo || data.bienSo.trim() === '' || data.bienSo.includes('Chưa có');
    const plate = isChuaCoBienSo ? 'Chưa có biển số' : data.bienSo!;
    const newVehicle: Vehicle = {
      id: newId,
      customerId: data.customerId,
      tenXe: data.tenXe,
      bienSo: plate,
      namSanXuat: typeof data.namSanXuat === 'number' ? data.namSanXuat : (data.namSanXuat ? parseInt(data.namSanXuat, 10) : new Date().getFullYear()),
      hanBaoHanh: hanBH,
      mauSac: data.mauSac || 'Tiêu chuẩn',
      trangThaiBaoHanh: 'ConHan',
      soKhung: data.soKhung || '',
      trangThaiDuyet: 'DaDuyet',
      nguonGoc: 'CuaHang',
      ngayMua: new Date().toISOString().split('T')[0],
      soMay: data.soMay || '',
      trangThaiDuyetBienSo: isChuaCoBienSo ? 'ChoCapNhat' : 'DaDuyet',
    };

    try {
      const maKH = parseInt(data.customerId.replace(/\D/g, ''), 10) || 1;
      const res = await fetchWithTimeout(`${API_BASE_URL}/XeKhachHang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maKH,
          bienSoXe: plate,
          soKhung: data.soKhung || '',
          soMay: data.soMay || '',
          ngayMua: new Date().toISOString(),
          hanBaoHanh: `${hanBH}T00:00:00Z`,
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        const beId = resData.MaXeSoHuu || resData.maXeSoHuu;
        if (beId) {
          newId = beId < 10 ? `XE00${beId}` : `XE0${beId}`;
          newVehicle.id = newId;
        }
      }
    } catch (err) {
      console.warn('[vehicleApi.createSoldVehicle] Backend call failed, using local cache:', err);
    }

    try {
      const cached = localStorage.getItem('crm_customer_vehicles');
      const list: Vehicle[] = cached ? JSON.parse(cached) : [];
      const existingIdx = list.findIndex(v => (plate !== 'Chưa có biển số' && v.bienSo === plate) || v.id === newVehicle.id);
      if (existingIdx !== -1) {
        list[existingIdx] = newVehicle;
      } else {
        list.unshift(newVehicle);
      }
      localStorage.setItem('crm_customer_vehicles', JSON.stringify(list));
    } catch {}

    const mockIdx = mockVehicles.findIndex(v => (plate !== 'Chưa có biển số' && v.bienSo === plate) || v.id === newVehicle.id);
    if (mockIdx !== -1) {
      mockVehicles[mockIdx] = newVehicle;
    } else {
      mockVehicles.unshift(newVehicle);
    }

    // Gán mã xe vào customer nếu chưa có
    const targetCust = mockCustomers.find(c => c.id === data.customerId);
    if (targetCust && !targetCust.soXe) {
      targetCust.soXe = newVehicle.id;
    }

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_created', vehicle: newVehicle } }));
    return newVehicle;
  },

  async requestLicensePlateUpdate(vehicleId: string, bienSo: string, anhCaVet: string): Promise<Vehicle | null> {
    let updatedVehicle: Vehicle | null = null;
    try {
      const cached = localStorage.getItem('crm_customer_vehicles');
      if (cached) {
        const list: Vehicle[] = JSON.parse(cached);
        const match = list.find(v => v.id === vehicleId);
        if (match) {
          match.bienSoChoDuyet = bienSo;
          match.anhCaVet = anhCaVet;
          match.trangThaiDuyetBienSo = 'ChoDuyet';
          updatedVehicle = match;
          localStorage.setItem('crm_customer_vehicles', JSON.stringify(list));
        }
      }
    } catch {}

    const vMatch = mockVehicles.find(v => v.id === vehicleId);
    if (vMatch) {
      vMatch.bienSoChoDuyet = bienSo;
      vMatch.anhCaVet = anhCaVet;
      vMatch.trangThaiDuyetBienSo = 'ChoDuyet';
      if (!updatedVehicle) updatedVehicle = vMatch;
    }

    if (updatedVehicle) {
      addAdminNotification({
        type: 'vehicle_registered',
        title: '🏍️ Yêu cầu duyệt biển số xe & Cà vẹt',
        message: `Khách hàng vừa cập nhật biển số xe "${bienSo}" kèm ảnh cà vẹt cho xe ${updatedVehicle.tenXe}. Vui lòng đối chiếu và phê duyệt.`,
        linkPage: 'customers',
      });

      addCustomerNotification({
        customerId: updatedVehicle.customerId,
        icon: '📋',
        title: '📋 Đã gửi biển số xe & Ảnh cà vẹt',
        message: `Đã gửi biển số ${bienSo} kèm ảnh cà vẹt xe ${updatedVehicle.tenXe}. Showroom đang tiến hành kiểm tra xét duyệt.`,
        category: 'order',
        page: 'dashboard',
        tab: 'vehicles',
        targetId: vehicleId,
      });
    }

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'license_plate_submitted', vehicleId } }));
    return updatedVehicle;
  },

  async approveLicensePlate(vehicleId: string): Promise<boolean> {
    let vehicleName = '';
    let finalPlate = '';
    let custId = '';

    try {
      const cached = localStorage.getItem('crm_customer_vehicles');
      if (cached) {
        const list: Vehicle[] = JSON.parse(cached);
        const match = list.find(v => v.id === vehicleId);
        if (match) {
          if (match.bienSoChoDuyet) {
            match.bienSo = match.bienSoChoDuyet;
          }
          match.trangThaiDuyetBienSo = 'DaDuyet';
          match.trangThaiDuyet = 'DaDuyet';
          match.bienSoChoDuyet = undefined;
          vehicleName = match.tenXe;
          finalPlate = match.bienSo;
          custId = match.customerId;
          localStorage.setItem('crm_customer_vehicles', JSON.stringify(list));
        }
      }
    } catch {}

    const vMatch = mockVehicles.find(v => v.id === vehicleId);
    if (vMatch) {
      if (vMatch.bienSoChoDuyet) {
        vMatch.bienSo = vMatch.bienSoChoDuyet;
      }
      vMatch.trangThaiDuyetBienSo = 'DaDuyet';
      vMatch.trangThaiDuyet = 'DaDuyet';
      vMatch.bienSoChoDuyet = undefined;
      vehicleName = vMatch.tenXe;
      finalPlate = vMatch.bienSo;
      custId = vMatch.customerId;
    }

    if (custId) {
      addCustomerNotification({
        customerId: custId,
        icon: '🏍️',
        title: '🏍️ Biển số xe đã được phê duyệt thành công',
        message: `Biển số chính thức ${finalPlate} của xe ${vehicleName} đã được showroom phê duyệt thành công và hiển thị trên hồ sơ xe của bạn.`,
        category: 'order',
        page: 'dashboard',
        tab: 'vehicles',
        targetId: vehicleId,
      });
    }

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'license_plate_approved', vehicleId } }));
    return true;
  },

  async approveVehicle(id: string): Promise<boolean> {
    let approvedVehicle: Vehicle | null = null;
    try {
      const cached = localStorage.getItem('crm_customer_vehicles');
      if (cached) {
        const list: Vehicle[] = JSON.parse(cached);
        const match = list.find(v => v.id === id);
        if (match) {
          match.trangThaiDuyet = 'DaDuyet';
          match.trangThaiDuyetBienSo = 'DaDuyet';
          if (match.bienSoChoDuyet) match.bienSo = match.bienSoChoDuyet;
          approvedVehicle = match;
          localStorage.setItem('crm_customer_vehicles', JSON.stringify(list));
        }
      }
    } catch {}

    const vMatch = mockVehicles.find(v => v.id === id);
    if (vMatch) {
      vMatch.trangThaiDuyet = 'DaDuyet';
      vMatch.trangThaiDuyetBienSo = 'DaDuyet';
      if (vMatch.bienSoChoDuyet) vMatch.bienSo = vMatch.bienSoChoDuyet;
      if (!approvedVehicle) approvedVehicle = vMatch;
      const cust = mockCustomers.find(c => c.id === vMatch.customerId);
      if (cust && !cust.soXe) {
        cust.soXe = vMatch.id;
      }
      try {
        const cachedCusts = localStorage.getItem('crm_custom_customers');
        if (cachedCusts) {
          const cList: Customer[] = JSON.parse(cachedCusts);
          const cMatch = cList.find(c => c.id === vMatch.customerId);
          if (cMatch && !cMatch.soXe) {
            cMatch.soXe = vMatch.id;
            localStorage.setItem('crm_custom_customers', JSON.stringify(cList));
          }
        }
      } catch {}

      addCustomerNotification({
        customerId: vMatch.customerId,
        icon: '🏍️',
        title: '🏍️ Phương tiện & Cà vẹt đã được đại lý phê duyệt',
        message: `Xe ${vMatch.tenXe} (${vMatch.bienSo}) đã được kiểm tra cà vẹt xe, duyệt thành công và gắn chính thức vào tài khoản của bạn.`,
        category: 'order',
        page: 'dashboard',
        tab: 'vehicles',
        targetId: vMatch.id,
      });
    }

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
// 3. PHỤ TÙNG API (PARTS CATALOG) - PT01, PT08, PT12
// ────────────────────────────────────────────────────────────
const PARTS_STORAGE_KEY = 'crm_parts_data';

export const partApi = {
  getAllSync(): Part[] {
    try {
      const cached = localStorage.getItem(PARTS_STORAGE_KEY);
      if (cached) {
        const parsed: Part[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('partApi.getAll cache read failed:', e);
    }

    // Initial fallback with default nhaCungCap and trangThaiHienThi
    const initialList: Part[] = mockParts.map(p => ({
      ...p,
      nhaCungCap: p.nhaCungCap || (p.thuongHieu === 'Honda' ? 'Honda Việt Nam' : p.thuongHieu === 'Yamaha' ? 'Yamaha Motor VN' : p.thuongHieu === 'Motul' ? 'Motul Asia Pacific' : p.thuongHieu === 'Michelin' ? 'Michelin Việt Nam' : 'Công ty Phụ Tùng Chính Hãng'),
      trangThaiHienThi: p.trangThaiHienThi || 'Hien',
    }));

    try {
      localStorage.setItem(PARTS_STORAGE_KEY, JSON.stringify(initialList));
    } catch {}

    return initialList;
  },

  async getAll(): Promise<Part[]> {
    return Promise.resolve(this.getAllSync());
  },

  getById(id: string): Part | null {
    const list = this.getAllSync();
    return list.find(p => p.id === id) || null;
  },

  create(data: Omit<Part, 'id'> & { id?: string }): Part {
    const list = this.getAllSync();
    const newId = data.id?.trim() || `PT${String(Date.now()).slice(-4)}`;
    const newPart: Part = {
      ...data,
      id: newId,
      trangThaiHienThi: data.trangThaiHienThi || 'Hien',
      nhaCungCap: data.nhaCungCap || 'Chưa xác định',
      rating: data.rating ?? 5.0,
      luotDanh: data.luotDanh ?? 0,
      giaKhuyenMai: data.giaKhuyenMai ?? null,
    };

    list.unshift(newPart);
    localStorage.setItem(PARTS_STORAGE_KEY, JSON.stringify(list));

    // Also sync into mockParts for consistency
    const mIdx = mockParts.findIndex(m => m.id === newPart.id);
    if (mIdx !== -1) mockParts[mIdx] = newPart;
    else mockParts.unshift(newPart);

    addAdminNotification({
      type: 'parts_updated',
      title: '📦 Phụ tùng mới đã tạo',
      message: `Đã thêm sản phẩm "${newPart.tenSanPham}" (${newPart.id}) vào kho hàng.`,
      linkPage: 'parts',
    });

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'part_created', part: newPart } }));
    return newPart;
  },

  update(id: string, patch: Partial<Part>): Part | null {
    const list = this.getAllSync();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const updated = { ...list[idx], ...patch };
    list[idx] = updated;
    localStorage.setItem(PARTS_STORAGE_KEY, JSON.stringify(list));

    const mIdx = mockParts.findIndex(m => m.id === id);
    if (mIdx !== -1) mockParts[mIdx] = updated;

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'part_updated', part: updated } }));
    return updated;
  },

  delete(id: string): boolean {
    const list = this.getAllSync();
    const filtered = list.filter(p => p.id !== id);
    if (filtered.length === list.length) return false;

    localStorage.setItem(PARTS_STORAGE_KEY, JSON.stringify(filtered));

    const mIdx = mockParts.findIndex(m => m.id === id);
    if (mIdx !== -1) mockParts.splice(mIdx, 1);

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'part_deleted', id } }));
    return true;
  },

  toggleVisibility(id: string): Part | null {
    const list = this.getAllSync();
    const target = list.find(p => p.id === id);
    if (!target) return null;

    const nextStatus = target.trangThaiHienThi === 'An' ? 'Hien' : 'An';
    return this.update(id, { trangThaiHienThi: nextStatus });
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
              soDienThoai: item.soDienThoai || mockMatch?.soDienThoai,
              email: mockMatch?.email,
              ngayDat: item.ngayDat ? item.ngayDat.split('T')[0] : '2024-12-01',
              trangThai: tt,
              trangThaiThanhToan: mockMatch?.trangThaiThanhToan || 'DaThanhToan',
              kenhBan: mockMatch?.kenhBan || 'Online',
              loaiDon: mockMatch?.loaiDon || 'PhuTung',
              tongTien: item.tongTien || mockMatch?.tongTien || 0,
              diaChiGiao: mockMatch?.diaChiGiao || 'TP.HCM',
              items: mockMatch?.items || [{ tenSanPham: 'Phụ tùng chính hãng', soLuong: 1, donGia: item.tongTien || 0 }],
              maNV: mockMatch?.maNV,
              tenNV: mockMatch?.tenNV,
              phuongThucThanhToan: mockMatch?.phuongThucThanhToan,
              thongTinXe: mockMatch?.thongTinXe,
              ghiChu: mockMatch?.ghiChu,
              maLichHen: mockMatch?.maLichHen,
              qrCodeUrl: mockMatch?.qrCodeUrl,
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
    mockOrders.forEach(o => combinedMap.set(o.id, { ...o }));
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

    // BẮT BUỘC: Nếu đơn hàng đã bị hủy, khóa vĩnh viễn không cho phép thay đổi trạng thái nữa
    const currentOrder = mockOrders.find(o => o.id === orderIdStr || parseInt(o.id.replace(/\D/g, ''), 10) === numId);
    if (currentOrder && currentOrder.trangThai === 'DaHuy') {
      console.warn(`[orderApi.updateStatus] Đơn hàng #${orderIdStr} đã ở trạng thái ĐÃ HỦY. Bắt buộc giữ nguyên trạng thái Đã hủy, không thể thay đổi.`);
      return;
    }

    let statusKey: OrderStatus = 'ChoDuyet';
    let statusText = 'Chờ xác nhận';
    if (trangThai === 'HoanThanh' || trangThai === 'Hoàn thành') {
      statusKey = 'HoanThanh'; statusText = 'Hoàn thành';
    } else if (trangThai === 'DangGiao' || trangThai === 'Đang giao') {
      statusKey = 'DangGiao'; statusText = 'Đang giao';
    } else if (trangThai === 'DaXacNhan' || trangThai === 'Đã xác nhận') {
      statusKey = 'DaXacNhan'; statusText = 'Đã xác nhận';
    } else if (trangThai === 'ChoGiaoXe' || trangThai === 'Chờ giao xe') {
      statusKey = 'ChoGiaoXe'; statusText = 'Chờ giao xe';
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

    let targetOrder: Order | undefined;

    // Update in-memory mockOrders
    mockOrders.forEach(o => {
      if (o.id === orderIdStr || parseInt(o.id.replace(/\D/g, ''), 10) === numId) {
        o.trangThai = statusKey;
        if (statusKey === 'HoanThanh') {
          o.trangThaiThanhToan = 'DaThanhToan';
        }
        targetOrder = o;
      }
    });

    // Update localStorage cache
    try {
      const cached = localStorage.getItem('crm_orders_cache');
      let list: Order[] = cached ? JSON.parse(cached) : [...mockOrders];
      const matchIdx = list.findIndex(o => o.id === orderIdStr || parseInt(o.id.replace(/\D/g, ''), 10) === numId);
      if (matchIdx !== -1) {
        list[matchIdx].trangThai = statusKey;
        if (statusKey === 'HoanThanh') {
          list[matchIdx].trangThaiThanhToan = 'DaThanhToan';
        }
        targetOrder = list[matchIdx];
      } else {
        const found = mockOrders.find(o => o.id === orderIdStr);
        if (found) {
          const updatedFound = { ...found, trangThai: statusKey, ...(statusKey === 'HoanThanh' ? { trangThaiThanhToan: 'DaThanhToan' as const } : {}) };
          list.unshift(updatedFound);
          targetOrder = updatedFound;
        }
      }
      localStorage.setItem('crm_orders_cache', JSON.stringify(list));
    } catch {}

    // Xử lý thông báo theo trạng thái
    if (statusKey === 'DaXacNhan') {
      addAdminNotification({
        type: 'order_status',
        title: '✓ Đã xác nhận đơn hàng',
        message: `Đơn hàng #${orderIdStr} đã được xác nhận. Vui lòng in hóa đơn và đóng gói chuyển giao.`,
        linkPage: 'sales',
        meta: targetOrder,
      });
      if (targetOrder && targetOrder.customerId) {
        addCustomerNotification({
          customerId: targetOrder.customerId,
          category: 'order',
          icon: '✓',
          title: `Đơn hàng #${orderIdStr} đã được xác nhận`,
          message: `Đơn hàng #${orderIdStr} đã được nhân viên xác nhận và đang được chuẩn bị đóng gói.`,
          page: 'dashboard',
          tab: 'orders',
          targetId: targetOrder.id,
        });
      }
    } else if (statusKey === 'DangGiao') {
      addAdminNotification({
        type: 'order_status',
        title: '🚚 Đơn hàng đang được giao',
        message: `Đơn hàng #${orderIdStr} đã chuyển sang "Đang giao hàng". Nút hủy đơn phía khách hàng đã được khóa tự động.`,
        linkPage: 'sales',
        meta: targetOrder,
      });
      if (targetOrder && targetOrder.customerId) {
        addCustomerNotification({
          customerId: targetOrder.customerId,
          category: 'order',
          icon: '🚚',
          title: `Đơn hàng #${orderIdStr} đang được giao`,
          message: `Đơn hàng #${orderIdStr} đang trên đường vận chuyển đến địa chỉ của quý khách.`,
          page: 'dashboard',
          tab: 'orders',
          targetId: targetOrder.id,
        });
      }
    } else if (statusKey === 'HoanThanh') {
      // Tích lũy chi tiêu cho khách hàng nếu có
      if (targetOrder && targetOrder.customerId && targetOrder.tongTien > 0) {
        const cMatch = mockCustomers.find(c => c.id === targetOrder!.customerId);
        if (cMatch) {
          cMatch.tongChiTieu = (cMatch.tongChiTieu || 0) + targetOrder.tongTien;
        }
        try {
          const cached = localStorage.getItem('crm_custom_customers');
          if (cached) {
            let list: Customer[] = JSON.parse(cached);
            list = list.map(c => c.id === targetOrder!.customerId ? { ...c, tongChiTieu: (c.tongChiTieu || 0) + targetOrder!.tongTien } : c);
            localStorage.setItem('crm_custom_customers', JSON.stringify(list));
          }
        } catch {}
      }

      addAdminNotification({
        type: 'order_status',
        title: '✅ Đơn hàng hoàn thành',
        message: `Đơn hàng #${orderIdStr} đã giao thành công và hoàn tất! Tồn kho thực tế và doanh thu đã được chốt vào Quản lý Bán hàng.`,
        linkPage: 'sales',
        meta: targetOrder,
      });

      // Tự động thông báo cho khách hàng
      if (targetOrder && targetOrder.customerId) {
        addCustomerNotification({
          customerId: targetOrder.customerId,
          category: 'order',
          icon: '✅',
          title: `Đơn hàng #${orderIdStr} đã hoàn tất`,
          message: `Đơn hàng ${targetOrder.loaiDon === 'Xe' ? targetOrder.thongTinXe?.tenXe || 'xe mới' : 'phụ tùng'} đã giao thành công và thanh toán hoàn tất!`,
          page: 'dashboard',
          tab: 'orders',
          targetId: targetOrder.id,
        });

        // NẾU LÀ ĐƠN HÀNG XE: Tự động gửi bài khảo sát xe mua mới cho khách hàng!
        if (targetOrder.loaiDon === 'Xe' || targetOrder.thongTinXe) {
          surveyApi.createVehiclePurchaseSurvey(targetOrder);
        }
      }
    } else if (statusKey === 'DaHuy' && targetOrder) {
      if (targetOrder.customerId) {
        addCustomerNotification({
          customerId: targetOrder.customerId,
          category: 'order',
          icon: '✕',
          title: `Đơn hàng #${orderIdStr} đã hủy`,
          message: `Đơn hàng #${orderIdStr} đã được hủy bỏ thành công.`,
          page: 'dashboard',
          tab: 'orders',
          targetId: targetOrder.id,
        });
      }
      // Tự động hoàn lại số lượng phụ tùng vào tồn kho
      if (targetOrder.loaiDon === 'PhuTung' || (!targetOrder.loaiDon && targetOrder.items && targetOrder.items.length > 0)) {
        try {
          const allParts = partApi.getAllSync();
          targetOrder.items.forEach(it => {
            const pIdStr = it.maPhuTung ? (it.maPhuTung < 10 ? `PT00${it.maPhuTung}` : `PT0${it.maPhuTung}`) : '';
            const found = allParts.find(p => p.id === pIdStr || p.tenSanPham === it.tenSanPham);
            if (found) {
              partApi.update(found.id, { soLuongTon: found.soLuongTon + it.soLuong });
            }
          });
        } catch {}
      }
      // Tự động hoàn lại số lượng xe vào tồn kho
      if (targetOrder.loaiDon === 'Xe' || targetOrder.thongTinXe) {
        try {
          const cached = localStorage.getItem('crm_catalog_vehicles');
          let list: CatalogVehicle[] = cached ? JSON.parse(cached) : [...DEFAULT_CATALOG_VEHICLES];
          const targetTenXe = (targetOrder.thongTinXe?.tenXe || '').toLowerCase().trim();
          const targetMaXe = targetOrder.thongTinXe?.maXe || (targetOrder.thongTinXe as any)?.vehicleId || (targetOrder.thongTinXe as any)?.id;
          const idx = list.findIndex(v => (targetMaXe && v.id === targetMaXe) || (v.tenXe && v.tenXe.toLowerCase().trim() === targetTenXe));
          if (idx !== -1) {
            const curStock = list[idx].soLuong ?? 0;
            list[idx] = { ...list[idx], soLuong: curStock + 1 };
            localStorage.setItem('crm_catalog_vehicles', JSON.stringify(list));
          }
        } catch {}
      }
    }

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'order', orderId: orderIdStr, status: statusKey } }));
  },

  async delete(orderIdOrNum: string | number): Promise<boolean> {
    const orderIdStr = String(orderIdOrNum);
    const numId = parseInt(orderIdStr.replace(/\D/g, ''), 10);

    if (!isNaN(numId) && numId > 0) {
      try {
        await fetchWithTimeout(`${API_BASE_URL}/DonHang/${numId}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('[orderApi.delete] Backend DELETE failed, removed locally:', err);
      }
    }

    const idx = mockOrders.findIndex(o => o.id === orderIdStr || parseInt(o.id.replace(/\D/g, ''), 10) === numId);
    if (idx !== -1) mockOrders.splice(idx, 1);

    try {
      const cached = localStorage.getItem('crm_orders_cache');
      if (cached) {
        let list: Order[] = JSON.parse(cached);
        list = list.filter(o => o.id !== orderIdStr && parseInt(o.id.replace(/\D/g, ''), 10) !== numId);
        localStorage.setItem('crm_orders_cache', JSON.stringify(list));
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'order_deleted', orderId: orderIdStr } }));
    return true;
  },

  async create(data: {
    customerId: string;
    hoTenKH: string;
    soDienThoai: string;
    diaChiGiao: string;
    kenhBan?: 'Online' | 'TaiQuay';
    trangThaiThanhToan?: 'ChuaThanhToan' | 'DaCoc' | 'DaThanhToan';
    phuongThucThanhToan?: 'TienMat' | 'ChuyenKhoan' | 'TraGop';
    maNV?: string;
    tenNV?: string;
    items: {
      maPhuTung?: number;
      tenSanPham: string;
      soLuong: number;
      donGia: number;
    }[];
    tongTien: number;
    ghiChu?: string;
  }): Promise<{ success: boolean; order?: Order; maDon?: number; message?: string }> {
    // 1. Kiểm tra tồn kho khả dụng nghiêm ngặt trước khi tạo đơn:
    const allParts = partApi.getAllSync();
    for (const it of data.items) {
      const pIdStr = it.maPhuTung ? (it.maPhuTung < 10 ? `PT00${it.maPhuTung}` : `PT0${it.maPhuTung}`) : '';
      const found = allParts.find(p => p.id === pIdStr || p.tenSanPham === it.tenSanPham || (it.maPhuTung && p.id.includes(String(it.maPhuTung))));
      if (found) {
        if (found.soLuongTon <= 0) {
          return { success: false, message: `Sản phẩm "${it.tenSanPham}" đã HẾT HÀNG (Tồn kho = 0)! Không thể đặt hàng.` };
        }
        if (it.soLuong > found.soLuongTon) {
          return {
            success: false,
            message: `Sản phẩm "${it.tenSanPham}" chỉ còn ${found.soLuongTon} cái trong kho, không đủ số lượng ${it.soLuong} bạn đặt!`
          };
        }
      }
    }

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
          trangThai: data.kenhBan === 'TaiQuay' ? 'Hoàn thành' : 'Chờ duyệt',
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
      soDienThoai: data.soDienThoai,
      ngayDat: new Date().toISOString().split('T')[0],
      trangThai: data.kenhBan === 'TaiQuay' ? 'HoanThanh' : 'ChoDuyet',
      trangThaiThanhToan: data.trangThaiThanhToan || (data.kenhBan === 'TaiQuay' ? 'DaThanhToan' : 'ChuaThanhToan'),
      kenhBan: data.kenhBan || 'Online',
      loaiDon: 'PhuTung',
      tongTien: data.tongTien,
      diaChiGiao: data.diaChiGiao,
      maNV: data.maNV,
      tenNV: data.tenNV,
      phuongThucThanhToan: data.phuongThucThanhToan || 'TienMat',
      ghiChu: data.ghiChu,
      items: data.items.map(i => ({
        tenSanPham: i.tenSanPham,
        soLuong: i.soLuong,
        donGia: i.donGia,
        maPhuTung: i.maPhuTung,
      })),
    };

    // Tự động trừ tồn kho khả dụng cho từng phụ tùng trong đơn
    try {
      data.items.forEach(it => {
        const pIdStr = it.maPhuTung ? (it.maPhuTung < 10 ? `PT00${it.maPhuTung}` : `PT0${it.maPhuTung}`) : '';
        const found = allParts.find(p => p.id === pIdStr || p.tenSanPham === it.tenSanPham || (it.maPhuTung && p.id.includes(String(it.maPhuTung))));
        if (found) {
          const newQty = Math.max(0, found.soLuongTon - it.soLuong);
          partApi.update(found.id, { soLuongTon: newQty });
        }
      });
    } catch (e) {
      console.warn('Auto deduct part stock failed:', e);
    }

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
      title: '📦 Đơn hàng phụ tùng mới',
      message: `${newOrder.hoTenKH} vừa ${data.kenhBan === 'TaiQuay' ? 'mua tại quầy' : 'đặt online'} đơn #${newOrder.id} - ${newOrder.tongTien.toLocaleString('vi-VN')} đ (${newOrder.items?.length || 0} món).`,
      linkPage: 'sales',
      meta: newOrder,
    });

    return { success: true, order: newOrder, maDon: createdMaDon };
  },

  async cancelOrder(orderId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const list = await this.getAll();
    const order = list.find(o => o.id === orderId);
    if (!order) {
      return { success: false, message: 'Không tìm thấy đơn hàng' };
    }

    // Kiểm tra trạng thái: Không được hủy nếu đã ở trạng thái Đang giao hoặc Hoàn thành
    if (order.trangThai === 'DangGiao' || order.trangThai === 'HoanThanh') {
      return { success: false, message: 'Đơn hàng đang giao hoặc đã hoàn tất, không thể hủy đơn!' };
    }

    if (order.trangThai === 'DaHuy') {
      return { success: false, message: 'Đơn hàng này đã được hủy trước đó!' };
    }

    const cancelReason = reason || 'Khách hàng yêu cầu hủy trên Web';
    order.lyDoHuy = cancelReason;
    if (order.ghiChu) {
      order.ghiChu += ` | [LÝ DO HỦY]: ${cancelReason}`;
    } else {
      order.ghiChu = `[LÝ DO HỦY]: ${cancelReason}`;
    }

    // Cập nhật trạng thái thành Đã hủy
    await this.updateStatus(order.id, 'DaHuy');

    // Cập nhật lại trong localStorage cache
    try {
      const cached = localStorage.getItem('crm_orders_cache');
      let cacheList: Order[] = cached ? JSON.parse(cached) : [...mockOrders];
      const matchIdx = cacheList.findIndex(o => o.id === order.id);
      if (matchIdx !== -1) {
        cacheList[matchIdx].trangThai = 'DaHuy';
        cacheList[matchIdx].lyDoHuy = cancelReason;
        cacheList[matchIdx].ghiChu = order.ghiChu;
        localStorage.setItem('crm_orders_cache', JSON.stringify(cacheList));
      }
    } catch {}

    // Tự động hoàn lại số lượng phụ tùng vào tồn kho
    if (order.loaiDon === 'PhuTung' || (!order.loaiDon && order.items && order.items.length > 0)) {
      try {
        const allParts = partApi.getAllSync();
        order.items.forEach(it => {
          const pIdStr = it.maPhuTung ? (it.maPhuTung < 10 ? `PT00${it.maPhuTung}` : `PT0${it.maPhuTung}`) : '';
          const found = allParts.find(p => p.id === pIdStr || p.tenSanPham === it.tenSanPham);
          if (found) {
            partApi.update(found.id, { soLuongTon: found.soLuongTon + it.soLuong });
          }
        });
      } catch (e) {
        console.warn('Auto restore part stock failed:', e);
      }
    }

    // Tự động hoàn lại số lượng xe vào tồn kho
    if (order.loaiDon === 'Xe' || order.thongTinXe) {
      try {
        const cached = localStorage.getItem('crm_catalog_vehicles');
        let list: CatalogVehicle[] = cached ? JSON.parse(cached) : [...DEFAULT_CATALOG_VEHICLES];
        const targetTenXe = (order.thongTinXe?.tenXe || '').toLowerCase().trim();
        const targetMaXe = order.thongTinXe?.maXe || (order.thongTinXe as any)?.vehicleId || (order.thongTinXe as any)?.id;
        const idx = list.findIndex(v => (targetMaXe && v.id === targetMaXe) || (v.tenXe && v.tenXe.toLowerCase().trim() === targetTenXe));
        if (idx !== -1) {
          const curStock = list[idx].soLuong ?? 0;
          list[idx] = { ...list[idx], soLuong: curStock + 1 };
          localStorage.setItem('crm_catalog_vehicles', JSON.stringify(list));
        }
      } catch (e) {
        console.warn('Auto restore vehicle stock failed:', e);
      }
    }

    addAdminNotification({
      type: 'order_cancelled',
      title: '❌ Khách hàng đã hủy đơn hàng',
      message: `Đơn hàng #${order.id} (${order.hoTenKH}) đã được hủy. Lý do: ${cancelReason}. Số lượng sản phẩm đã được hoàn trả lại kho.`,
      linkPage: 'sales',
      meta: order,
    });

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'order_cancelled', orderId: order.id } }));
    return { success: true, message: 'Hủy đơn hàng thành công và đã hoàn trả tồn kho khả dụng!' };
  },

  async createVehicleOrder(data: {
    customerId: string;
    hoTenKH: string;
    soDienThoai: string;
    email?: string;
    diaChiGiao: string;
    kenhBan: 'Online' | 'TaiQuay';
    trangThaiThanhToan: 'ChuaThanhToan' | 'DaCoc' | 'DaThanhToan';
    trangThai?: OrderStatus;
    tongTien: number;
    phuongThucThanhToan: 'TienMat' | 'ChuyenKhoan' | 'TraGop';
    maNV?: string;
    tenNV?: string;
    ghiChu?: string;
    maLichHen?: string;
    qrCodeUrl?: string;
    thongTinXe: import('../data/mockData').VehicleOrderDetails;
  }): Promise<{ success: boolean; order?: Order; maDon?: number; message?: string }> {
    // 1. Kiểm tra tồn kho khả dụng xe trước khi đặt
    try {
      const cached = localStorage.getItem('crm_catalog_vehicles');
      const list: CatalogVehicle[] = cached ? JSON.parse(cached) : [...DEFAULT_CATALOG_VEHICLES];
      const targetTenXe = (data.thongTinXe?.tenXe || '').toLowerCase().trim();
      const targetMaXe = data.thongTinXe?.maXe || (data.thongTinXe as any)?.vehicleId || (data.thongTinXe as any)?.id;
      const found = list.find(v => (targetMaXe && v.id === targetMaXe) || (v.tenXe && v.tenXe.toLowerCase().trim() === targetTenXe));
      if (found && found.soLuong !== undefined && found.soLuong <= 0) {
        return { success: false, message: `Mẫu xe "${found.tenXe}" hiện đã HẾT HÀNG trong kho (Số lượng = 0)! Không thể đặt hàng.` };
      }
    } catch {}

    let maKH = parseInt(data.customerId.replace(/\D/g, ''), 10);
    if (isNaN(maKH) || maKH <= 0) maKH = 1;

    let createdMaDon: number | undefined;
    let orderId = `DH-XE-${Date.now().toString().slice(-4)}`;

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/DonHang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maKH,
          tongTien: data.tongTien,
          trangThai: data.trangThai === 'HoanThanh' ? 'Hoàn thành' : 'Chờ giao xe',
          items: [],
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        createdMaDon = resData.maDon || resData.MaDon;
        if (createdMaDon) {
          orderId = `DH-XE-${createdMaDon < 10 ? `00${createdMaDon}` : `0${createdMaDon}`}`;
        }
      }
    } catch (err) {
      console.warn('[orderApi.createVehicleOrder] Backend call failed, applied locally:', err);
    }

    const defaultQr = data.maLichHen
      ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.maLichHen)}`
      : undefined;

    const newOrder: Order = {
      id: orderId,
      customerId: data.customerId,
      hoTenKH: data.hoTenKH,
      soDienThoai: data.soDienThoai,
      email: data.email,
      ngayDat: new Date().toISOString().split('T')[0],
      trangThai: data.trangThai || 'ChoGiaoXe',
      trangThaiThanhToan: data.trangThaiThanhToan,
      kenhBan: data.kenhBan,
      loaiDon: 'Xe',
      tongTien: data.tongTien,
      diaChiGiao: data.diaChiGiao,
      items: [],
      maNV: data.maNV,
      tenNV: data.tenNV,
      phuongThucThanhToan: data.phuongThucThanhToan,
      ghiChu: data.ghiChu,
      maLichHen: data.maLichHen,
      qrCodeUrl: data.qrCodeUrl || defaultQr,
      thongTinXe: data.thongTinXe,
    };

    // Tự động trừ tồn kho khả dụng cho xe trong catalog (thực hiện giống mua bán phụ tùng)
    try {
      const cached = localStorage.getItem('crm_catalog_vehicles');
      let list: CatalogVehicle[] = cached ? JSON.parse(cached) : [...DEFAULT_CATALOG_VEHICLES];
      const targetTenXe = (data.thongTinXe?.tenXe || '').toLowerCase().trim();
      const targetMaXe = data.thongTinXe?.maXe || (data.thongTinXe as any)?.vehicleId || (data.thongTinXe as any)?.id;
      const idx = list.findIndex(v => (targetMaXe && v.id === targetMaXe) || (v.tenXe && v.tenXe.toLowerCase().trim() === targetTenXe));
      if (idx !== -1) {
        const curStock = list[idx].soLuong ?? 12;
        list[idx] = { ...list[idx], soLuong: Math.max(0, curStock - 1) };
        localStorage.setItem('crm_catalog_vehicles', JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Auto deduct vehicle stock failed:', e);
    }

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
      title: '🏍️ Đơn hàng bán xe mới',
      message: `${newOrder.hoTenKH} vừa đặt mua xe ${data.thongTinXe.tenXe} (${data.thongTinXe.mauSac}) - Đơn #${newOrder.id} - ${newOrder.tongTien.toLocaleString('vi-VN')} đ (${data.kenhBan === 'Online' ? 'Đặt cọc Online' : 'Bán tại quầy'}).`,
      linkPage: 'sales',
      meta: newOrder,
    });

    if (newOrder.trangThai === 'HoanThanh') {
      try {
        surveyApi.createVehiclePurchaseSurvey(newOrder);
      } catch (sErr) {
        console.warn('Auto create vehicle purchase survey error:', sErr);
      }
    }

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
            else if (item.loaiDichVu?.includes('Nhận') || item.loaiDichVu?.includes('Nhan')) ldv = 'NhanXe';

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
              maLichHen: cachedMatch?.maLichHen || mockMatch?.maLichHen,
              maDonHangXe: cachedMatch?.maDonHangXe || mockMatch?.maDonHangXe,
              mauXe: cachedMatch?.mauXe || mockMatch?.mauXe,
              phienBan: cachedMatch?.phienBan || mockMatch?.phienBan,
              soTienCoc: cachedMatch?.soTienCoc ?? mockMatch?.soTienCoc,
              daThanhToan100: cachedMatch?.daThanhToan100 ?? mockMatch?.daThanhToan100,
              soKhungVIN: cachedMatch?.soKhungVIN || mockMatch?.soKhungVIN,
              soMay: cachedMatch?.soMay || mockMatch?.soMay,
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

    const appt = mockAppointments.find(a => a.id === apptId || parseInt(a.id.replace(/\D/g, ''), 10) === numId);
    if (appt && appt.customerId) {
      let title = `Lịch hẹn #${appt.id} cập nhật trạng thái`;
      let msg = `Lịch hẹn dịch vụ ${appt.loaiDichVu} ngày ${appt.ngayHen} lúc ${appt.gioHen} đã chuyển sang trạng thái: ${status}.`;
      let icon = '📅';
      if (status === 'DaXacNhan') {
        title = `✓ Lịch hẹn #${appt.id} đã được xác nhận`;
        msg = `Đại lý đã tiếp nhận lịch ${appt.loaiDichVu} xe ${appt.tenXe} vào ${appt.gioHen} ngày ${appt.ngayHen}. Hân hạnh đón tiếp quý khách!`;
      } else if (status === 'DaHoanThanh') {
        title = `✅ Dịch vụ #${appt.id} đã hoàn tất`;
        msg = `Xe ${appt.tenXe} của quý khách đã hoàn tất dịch vụ ${appt.loaiDichVu}. Cảm ơn quý khách đã tin tưởng DailyXeMay!`;
      } else if (status === 'TuChoi') {
        title = `⚠️ Lịch hẹn #${appt.id} không thể tiếp nhận`;
        msg = lyDoTuChoi ? `Lý do: ${lyDoTuChoi}` : 'Đại lý chưa thể tiếp nhận lịch hẹn trong khung giờ này.';
        icon = '⚠️';
      }
      addCustomerNotification({
        customerId: appt.customerId,
        category: 'appointment',
        icon,
        title,
        message: msg,
        page: 'dashboard',
        tab: 'appts',
        targetId: appt.id,
      });
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
    loaiDichVu: ServiceType;
    ngayHen: string; // YYYY-MM-DD
    gioHen: string;  // HH:mm
    tenXe?: string;
    bienSo?: string;
    ghiChu?: string;
    nhanVienPhuTrach?: string;
    maLichHen?: string;
    maDonHangXe?: string;
    mauXe?: string;
    phienBan?: string;
    soTienCoc?: number;
    daThanhToan100?: boolean;
    soKhungVIN?: string;
    soMay?: string;
  }): Promise<{ success: boolean; appointment: Appointment; maLich?: number }> {
    let maKH = data.customerId ? parseInt(data.customerId.replace(/\D/g, ''), 10) : 1;
    if (isNaN(maKH) || maKH <= 0) maKH = 1;

    let createdMaLich: number | undefined;
    let apptId = `LH${Date.now().toString().slice(-4)}`;

    const fullDateStr = `${data.ngayHen}T${data.gioHen}:00`;
    let svcLabel = 'Bảo dưỡng định kỳ';
    if (data.loaiDichVu === 'SuaChua') svcLabel = 'Sửa chữa';
    else if (data.loaiDichVu === 'LaiThu') svcLabel = `Lái thử: ${data.tenXe || 'Xe mẫu'}`;
    else if (data.loaiDichVu === 'NhanXe') svcLabel = `Nhận xe mới: ${data.tenXe || 'Xe máy'}`;

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
      maLichHen: data.maLichHen,
      maDonHangXe: data.maDonHangXe,
      mauXe: data.mauXe,
      phienBan: data.phienBan,
      soTienCoc: data.soTienCoc,
      daThanhToan100: data.daThanhToan100,
      soKhungVIN: data.soKhungVIN,
      soMay: data.soMay,
    };

    mockAppointments.unshift(newAppt);

    // Lưu vào cache để không bị mất khi F5 (LH11, LH12)
    try {
      const cached = localStorage.getItem('crm_appointments_cache');
      const list: Appointment[] = cached ? JSON.parse(cached) : [];
      const updatedCache = [newAppt, ...list.filter(a => a.id !== newAppt.id)];
      localStorage.setItem('crm_appointments_cache', JSON.stringify(updatedCache));
    } catch {}

    const titleIcon = data.loaiDichVu === 'NhanXe' ? '🏍️ Lịch hẹn đón khách nhận xe mới' :
      data.loaiDichVu === 'LaiThu' ? '🏍️ Lịch hẹn lái thử mới' : '📅 Lịch dịch vụ sửa chữa / bảo dưỡng mới';
    addAdminNotification({
      type: 'appointment_booked',
      title: titleIcon,
      message: `${newAppt.hoTenKH} (${newAppt.soDienThoai}) đặt hẹn ${svcLabel} lúc ${newAppt.gioHen} ngày ${newAppt.ngayHen}.`,
      linkPage: 'appointments',
      meta: newAppt,
    });

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'appointment', apptId: newAppt.id } }));
    return { success: true, appointment: newAppt, maLich: createdMaLich };
  },
};

// ────────────────────────────────────────────────────────────
// 6. NHÂN VIÊN API (STAFF ACCOUNTS)
// ────────────────────────────────────────────────────────────
export const staffApi = {
  async getAll(): Promise<StaffAccount[]> {
    // 1. Kiểm tra cache localStorage trước
    try {
      const cached = localStorage.getItem('crm_staff_accounts');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    // 2. Fetch từ backend nếu có
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/NhanVien`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return mockStaffAccounts;

      const mapped: StaffAccount[] = data.map((item: any, idx: number) => {
        const id = item.maNV ? (item.maNV < 10 ? `ST00${item.maNV}` : `ST0${item.maNV}`) : `ST${idx}`;
        const mockMatch = mockStaffAccounts.find(m => m.id === id || m.email === item.email);

        return {
          id,
          hoTen: item.hoTen,
          email: item.email,
          soDienThoai: item.soDienThoai,
          chucVu: item.chucVu || mockMatch?.chucVu || 'Chuyên viên Tư vấn & CSKH',
          vaiTro: item.vaiTro || mockMatch?.vaiTro || 'NhanVienBanHang',
          trangThai: item.trangThai === 'BiKhoa' ? 'BiKhoa' : 'HoatDong',
          avatar: item.avatar || mockMatch?.avatar || `/images/NV/nv1.jpg`,
          ngayThamGia: item.ngayThamGia ? item.ngayThamGia.split('T')[0] : (mockMatch?.ngayThamGia || '2023-01-01'),
          gioiTinh: item.gioiTinh || mockMatch?.gioiTinh || 'Nam',
          ngaySinh: item.ngaySinh ? item.ngaySinh.split('T')[0] : (mockMatch?.ngaySinh || '1995-01-01'),
          diaChi: item.diaChi || mockMatch?.diaChi || 'TP. Hồ Chí Minh',
          cccd: item.cccd || mockMatch?.cccd || '079095000000',
          loaiNhanVien: item.loaiNhanVien || mockMatch?.loaiNhanVien || 'Full-time',
          luongCoBan: item.luongCoBan ?? mockMatch?.luongCoBan ?? 15000000,
          nganHang: item.nganHang || mockMatch?.nganHang || 'Vietcombank',
          soTaiKhoan: item.soTaiKhoan || mockMatch?.soTaiKhoan || '1012345678',
          matKhau: item.matKhau || mockMatch?.matKhau || '123456',
        };
      });
      return mapped;
    } catch (err) {
      console.warn('[staffApi.getAll] Failed to fetch from backend, using mockData fallback:', err);
      return mockStaffAccounts;
    }
  },
  saveLocal(list: StaffAccount[]) {
    try {
      localStorage.setItem('crm_staff_accounts', JSON.stringify(list));
    } catch {}
  },
  async changePassword(staffId: string, newPass: string): Promise<boolean> {
    try {
      const cached = localStorage.getItem('crm_staff_accounts');
      let list: StaffAccount[] = cached ? JSON.parse(cached) : [...mockStaffAccounts];
      const idx = list.findIndex(s => s.id === staffId);
      if (idx !== -1) {
        list[idx].matKhau = newPass;
        localStorage.setItem('crm_staff_accounts', JSON.stringify(list));
      }
      const mockIdx = mockStaffAccounts.findIndex(s => s.id === staffId);
      if (mockIdx !== -1) {
        mockStaffAccounts[mockIdx].matKhau = newPass;
      }
    } catch {}

    try {
      const numId = parseInt(staffId.replace(/\D/g, ''), 10);
      if (!isNaN(numId)) {
        await fetchWithTimeout(`${API_BASE_URL}/NhanVien/doi-mat-khau/${numId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matKhauMoi: newPass }),
        });
      }
    } catch {}
    return true;
  },
  async toggleStatus(staffId: string): Promise<boolean> {
    try {
      const numId = parseInt(staffId.replace(/\D/g, ''), 10);
      if (!isNaN(numId)) {
        await fetchWithTimeout(`${API_BASE_URL}/NhanVien/khoa/${numId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (err) {
      console.warn('[staffApi.toggleStatus] Backend call failed:', err);
    }
    return true;
  }
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
  // XM04: Các thuộc tính mở rộng
  soLuong?: number;
  ncc?: string;
  namSanXuat?: number;
  xuatXu?: string;
  vat?: number;
  // XM04 & XM05: Bổ sung các thông số kỹ thuật chi tiết
  loaiDongCo?: string;
  dungTichXiLanh?: string;
  tieuThuNhienLieu?: string;
  khoiLuong?: string;
  kichThuoc?: string;
  doCaoYen?: string;
  dungTichBinhXang?: string;
  heThongPhanh?: string;
  kichCoLop?: string;
  // Các trường tương thích cũ
  dongCo?: string;
  congSuat?: string;
  tieuHaoNhienLieu?: string;
  phanh?: string;
  thongSoKyThuat?: string;
  // XM06 & XM07: Trạng thái & ngày tạo
  trangThaiHienThi?: 'Hien' | 'An';
  trangThaiKinhDoanh?: 'DangKinhDoanh' | 'NgungKinhDoanh';
  ngayTao?: string;
}

const VEHICLE_STORAGE_KEY = 'crm_catalog_vehicles';

export const DEFAULT_CATALOG_VEHICLES: CatalogVehicle[] = [
  {
    id: 'XM001',
    tenXe: 'Honda SH 160i ABS 2025',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 95900000,
    mauSac: 'Đen mờ, Đỏ đen, Xám xi măng, Trắng bạc',
    moTa: 'Flagship tay ga cao cấp của Honda với phanh ABS 2 kênh, động cơ 156.9cc eSP+ 4 van, Smart Key',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    dongCo: '156.9cc eSP+ 4 van',
    congSuat: '16.6 HP / 8.500 rpm',
    tieuHaoNhienLieu: '2.24 L/100km',
    phanh: 'Đĩa trước & sau, ABS 2 kênh',
    thongSoKyThuat: '156.9cc eSP+ 4 van, Phanh ABS 2 kênh, HSTC, Khóa thông minh Smart Key',
  },
  {
    id: 'XM002',
    tenXe: 'Honda Air Blade 160 ABS',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 56690000,
    mauSac: 'Đỏ đen, Xanh xám, Đen vàng đồng',
    moTa: 'Tay ga thể thao mạnh mẽ, động cơ eSP+ 160cc, cốp rộng 23.2L tích hợp cổng sạc USB',
    hinhAnh: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    dongCo: '156.9cc eSP+ 4 van',
    congSuat: '15.0 HP / 8.000 rpm',
    tieuHaoNhienLieu: '2.30 L/100km',
    phanh: 'Đĩa trước có ABS, đùm sau',
    thongSoKyThuat: '156.9cc eSP+, Phanh ABS trước, Cổng sạc USB, Cốp rộng 23.2L',
  },
  {
    id: 'XM003',
    tenXe: 'Honda Lead 125cc (Bản Đặc Biệt)',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 42790000,
    mauSac: 'Bạc nhám, Đen mờ, Trắng ngọc',
    moTa: 'Cốp xe siêu lớn 37L đựng 2 mũ bảo hiểm, cổng sạc USB, động cơ eSP+ 4 van êm ái',
    hinhAnh: 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    dongCo: '124.8cc eSP+ 4 van',
    congSuat: '11.0 HP / 8.500 rpm',
    tieuHaoNhienLieu: '2.16 L/100km',
    phanh: 'Đĩa trước, đùm sau',
    thongSoKyThuat: '124.8cc eSP+, Cốp siêu lớn 37L đựng vừa 2 mũ bảo hiểm, Nắp bình xăng trước',
  },
  {
    id: 'XM004',
    tenXe: 'Honda Vision 110 Thể Thao',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 36612000,
    mauSac: 'Xám xi măng, Đen bóng, Xanh dương',
    moTa: 'Xe tay ga quốc dân nhỏ gọn thanh lịch, vành đúc 16 inch cao ráo, Smart Key, siêu tiết kiệm xăng',
    hinhAnh: 'https://images.unsplash.com/photo-1525160354320-d8e92641c563?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: false,
    dongCo: '109.5cc eSP',
    congSuat: '8.8 HP / 7.500 rpm',
    tieuHaoNhienLieu: '1.85 L/100km',
    phanh: 'Đĩa trước kết hợp CBS',
    thongSoKyThuat: '109.5cc eSP, Khung dập eSAF thế hệ mới siêu nhẹ, Tiết kiệm xăng 1.85L/100km',
  },
  {
    id: 'XM005',
    tenXe: 'Honda Winner X 150 ABS',
    hang: 'Honda',
    phanKhuc: 'Côn tay',
    giaNiemYet: 50560000,
    mauSac: 'Đỏ đen xanh thể thao, Đen nhám bạc',
    moTa: 'Côn tay thể thao trang bị ly hợp chống trượt Assist & Slipper, xích phốt O-ring, phanh ABS trước',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    dongCo: '149.1cc DOHC 6 số',
    congSuat: '15.4 HP / 9.000 rpm',
    tieuHaoNhienLieu: '1.99 L/100km',
    phanh: 'Đĩa trước có ABS, đĩa sau',
    thongSoKyThuat: '149.1cc DOHC 6 cấp số, Phanh đĩa ABS trước, Bộ ly hợp chống trượt 2 chiều',
  },
  {
    id: 'XM006',
    tenXe: 'Honda Wave Alpha 110cc',
    hang: 'Honda',
    phanKhuc: 'Xe số',
    giaNiemYet: 18190000,
    mauSac: 'Đỏ đen, Xanh đen, Trắng bạc',
    moTa: 'Xe số phổ thông bền bỉ, tiết kiệm xăng vượt trội, chi phí vận hành siêu kinh tế',
    hinhAnh: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: false,
    dongCo: '109.1cc 4 kỳ',
    congSuat: '8.2 HP / 7.500 rpm',
    tieuHaoNhienLieu: '1.72 L/100km',
    phanh: 'Cơ trước & sau',
    thongSoKyThuat: '109.1cc làm mát bằng không khí, Động cơ siêu bền bỉ, 1.72L/100km',
  },
  {
    id: 'XM007',
    tenXe: 'Yamaha Exciter 155 VVA ABS',
    hang: 'Yamaha',
    phanKhuc: 'Côn tay',
    giaNiemYet: 54000000,
    mauSac: 'Xanh GP thể thao, Đen nhám, Xám ánh kim',
    moTa: '"Tiểu YZF-R1" với động cơ 155cc VVA van biến thiên, bộ ly hợp chống trượt A&S, phanh ABS 2 piston',
    hinhAnh: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    dongCo: '155.1cc VVA 4 van',
    congSuat: '17.9 HP / 9.500 rpm',
    tieuHaoNhienLieu: '2.09 L/100km',
    phanh: 'Đĩa ABS 2 piston trước, đĩa sau',
    thongSoKyThuat: '155cc 4 van biến thiên VVA, 17.9 mã lực, Phanh ABS 2 piston, Bộ ly hợp A&S',
  },
  {
    id: 'XM008',
    tenXe: 'Yamaha Grande Hybrid',
    hang: 'Yamaha',
    phanKhuc: 'Tay ga',
    giaNiemYet: 49500000,
    mauSac: 'Đỏ mận chín, Trắng ngọc trai, Xanh pastel',
    moTa: 'Xe ga tiết kiệm xăng số 1 Việt Nam với công nghệ trợ lực điện Hybrid thông minh, cốp 27L có đèn LED',
    hinhAnh: 'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    dongCo: '124.9cc Blue Core Hybrid',
    congSuat: '8.3 HP / 6.500 rpm',
    tieuHaoNhienLieu: '1.66 L/100km',
    phanh: 'Đĩa ABS trước, đùm sau',
    thongSoKyThuat: '124.9cc Blue Core Hybrid trợ lực điện, Tiết kiệm xăng số 1 (1.66L/100km), Phanh ABS',
  },
  {
    id: 'XM009',
    tenXe: 'Yamaha MT-15 Naked Bike',
    hang: 'Yamaha',
    phanKhuc: 'Côn tay',
    giaNiemYet: 69000000,
    mauSac: 'Xanh xám dạ quang, Đen bóng đêm',
    moTa: 'Naked bike đậm chất đường phố Dark Side of Japan, phuộc Upside Down thể thao mạ vàng cao cấp',
    hinhAnh: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    dongCo: '155cc VVA làm mát chất lỏng',
    congSuat: '19.0 HP / 10.000 rpm',
    tieuHaoNhienLieu: '2.28 L/100km',
    phanh: 'Đĩa trước & sau',
    thongSoKyThuat: '155cc VVA, Phuộc trước Upside Down vàng thể thao, Đèn pha LED thấu kính',
  },
  {
    id: 'XM010',
    tenXe: 'Yamaha PG-1 Scrambler',
    hang: 'Yamaha',
    phanKhuc: 'Scrambler',
    giaNiemYet: 30437000,
    mauSac: 'Vàng sa mạc, Cam rực rỡ, Xanh rêu bụi',
    moTa: 'Mẫu xe số địa hình phong cách Scrambler ghi đông trần cá tính, lốp gai to đa dụng vượt mọi địa hình',
    hinhAnh: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    dongCo: '113.7cc 4 thì SOHC',
    congSuat: '8.8 HP / 7.000 rpm',
    tieuHaoNhienLieu: '1.96 L/100km',
    phanh: 'Đĩa trước thủy lực, đùm sau',
    thongSoKyThuat: '113.7cc 4 thì SOHC, Phong cách Scrambler ghi đông trần',
  },
  {
    id: 'XM011',
    tenXe: 'Suzuki Raider R150 Fi (DOHC)',
    hang: 'Suzuki',
    phanKhuc: 'Hyper-underbone',
    giaNiemYet: 51190000,
    mauSac: 'Đỏ đen, Xanh mờ MotoGP, Đen cam',
    moTa: '"Vua tốc độ" phân khúc 150cc với động cơ DOHC 4 van Twin-Cam công suất cực đại 18.5 HP mạnh nhất phân khúc',
    hinhAnh: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    dongCo: '147.3cc DOHC 4 van két nước lớn',
    congSuat: '18.5 HP / 10.000 rpm',
    tieuHaoNhienLieu: '2.40 L/100km',
    phanh: 'Đĩa trước & sau hình cánh hoa',
    thongSoKyThuat: '147.3cc DOHC 4 van làm mát két nước lớn, Công suất cực đại 18.5 mã lực',
  },
  {
    id: 'XM012',
    tenXe: 'Suzuki Satria F150 Fi Nhập Khẩu',
    hang: 'Suzuki',
    phanKhuc: 'Hyper-underbone',
    giaNiemYet: 53490000,
    mauSac: 'Trắng đỏ thể thao, Xanh đen, Đen mờ',
    moTa: 'Nhập khẩu nguyên chiếc từ Suzuki Indonesia, khởi động nhanh 1 chạm Suzuki Easy Start System',
    hinhAnh: 'https://images.unsplash.com/photo-1558981420-87aa9dad1c89?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    dongCo: '147.3cc DOHC Fi nguyên bản',
    congSuat: '18.5 HP / 10.000 rpm',
    tieuHaoNhienLieu: '2.42 L/100km',
    phanh: 'Đĩa trước & đĩa sau',
    thongSoKyThuat: '147.3cc DOHC Fi nguyên bản nhập Indonesia, 18.5 HP',
  },
  {
    id: 'XM013',
    tenXe: 'Suzuki Burgman Street 125',
    hang: 'Suzuki',
    phanKhuc: 'Tay ga',
    giaNiemYet: 48600000,
    mauSac: 'Xám mờ thời thượng, Vàng đồng, Đen tuyền',
    moTa: 'Mẫu xe tay ga đường trường phong cách Maxi sang trọng đẳng cấp châu Âu, sàn để chân kép linh hoạt',
    hinhAnh: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: false,
    dongCo: '124.3cc SEP tiết kiệm nhiên liệu',
    congSuat: '8.7 HP / 6.750 rpm',
    tieuHaoNhienLieu: '1.96 L/100km',
    phanh: 'Đĩa trước kết hợp phanh CBS',
    thongSoKyThuat: '124.3cc động cơ SEP, Thiết kế Maxi-Scooter phong cách Châu Âu bề thế',
  },
  {
    id: 'XM014',
    tenXe: 'Vespa Primavera 125 ABS',
    hang: 'Piaggio & Vespa',
    phanKhuc: 'Tay ga',
    giaNiemYet: 77800000,
    mauSac: 'Cam hoàng hôn, Trắng sữa, Xanh búp trà',
    moTa: 'Biểu tượng phong cách nước Ý trường tồn với thời gian, động cơ i-Get 3 van vận hành êm ái, phanh ABS',
    hinhAnh: 'https://images.unsplash.com/photo-1558981854-3e9821d3f9b2?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    dongCo: '124.5cc động cơ i-Get 3 van',
    congSuat: '10.6 HP / 7.700 rpm',
    tieuHaoNhienLieu: '2.14 L/100km',
    phanh: 'Đĩa trước ABS, đùm sau',
    thongSoKyThuat: '124.5cc động cơ i-Get 3 van, Khung thép liền khối kinh điển, Phanh ABS',
  },
  {
    id: 'XM015',
    tenXe: 'Vespa Sprint S 150 i-Get ABS',
    hang: 'Piaggio & Vespa',
    phanKhuc: 'Tay ga',
    giaNiemYet: 97800000,
    mauSac: 'Xám Titan, Vàng nhám, Trắng tuyết',
    moTa: 'Biểu tượng phong cách thời trang Ý với đèn pha LED lục giác góc cạnh, thân xe bằng thép dập nguyên khối',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    dongCo: '155cc i-Get 3 van',
    congSuat: '12.7 HP / 7.750 rpm',
    tieuHaoNhienLieu: '2.25 L/100km',
    phanh: 'Đĩa trước ABS, đùm sau',
    thongSoKyThuat: '155cc i-Get 3 van, Đèn pha LED lục giác, Phanh ABS',
  },
  {
    id: 'XM016',
    tenXe: 'Piaggio Liberty 125 S ABS',
    hang: 'Piaggio & Vespa',
    phanKhuc: 'Tay ga',
    giaNiemYet: 57700000,
    mauSac: 'Đen mờ Nero, Đỏ bóng Rosso, Trắng Bianco',
    moTa: 'Thiết kế bánh lớn 16 inch đậm chất Urban thanh lịch thời thượng, phanh ABS bánh trước an toàn',
    hinhAnh: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    dongCo: '124.5cc động cơ i-Get',
    congSuat: '10.2 HP / 7.600 rpm',
    tieuHaoNhienLieu: '2.19 L/100km',
    phanh: 'Đĩa trước ABS, đùm sau',
    thongSoKyThuat: '124.5cc động cơ i-Get hiện đại, Bánh trước 16 inch vượt chướng ngại vật êm ái',
  },
];

export const catalogVehicleApi = {
  getAllSync(): CatalogVehicle[] {
    try {
      const cached = localStorage.getItem(VEHICLE_STORAGE_KEY);
      if (cached) {
        const parsed: CatalogVehicle[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_CATALOG_VEHICLES;
  },

  async getAll(): Promise<CatalogVehicle[]> {
    // 1. Đọc cache localStorage trước để giữ các thay đổi của người dùng (ẩn/hiện, số lượng tồn kho, trạng thái kinh doanh)
    const localMap = new Map<string, CatalogVehicle>();
    let existingList: CatalogVehicle[] = [];
    try {
      const cached = localStorage.getItem(VEHICLE_STORAGE_KEY);
      if (cached) {
        existingList = JSON.parse(cached);
        if (Array.isArray(existingList)) {
          existingList.forEach(v => {
            if (v.id) localMap.set(v.id, v);
            if (v.tenXe) localMap.set(v.tenXe.toLowerCase().trim(), v);
          });
        }
      }
    } catch {}

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/XeMau`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error('Empty from server');

      const mapped: CatalogVehicle[] = data.map((item: any) => {
        const id = item.maXe ? (item.maXe < 10 ? `XM00${item.maXe}` : `XM0${item.maXe}`) : `XM${Date.now()}`;
        const foundDefault = DEFAULT_CATALOG_VEHICLES.find(
          df => df.id === id || df.tenXe.toLowerCase().trim() === (item.tenXe || '').toLowerCase().trim()
        );
        const local = localMap.get(id) || localMap.get((item.tenXe || '').toLowerCase().trim());

        return {
          id,
          maXe: item.maXe,
          tenXe: item.tenXe,
          hang: item.hangXe || local?.hang || foundDefault?.hang || 'Honda',
          phanKhuc: item.loaiXe || local?.phanKhuc || foundDefault?.phanKhuc || 'Tay ga',
          giaNiemYet: Number(item.giaNiemYet) || local?.giaNiemYet || foundDefault?.giaNiemYet || 0,
          mauSac: item.mauSac || local?.mauSac || foundDefault?.mauSac || 'Đen bóng, Đỏ đen, Trắng bạc',
          moTa: item.thongSoKyThuat || local?.moTa || foundDefault?.moTa || 'Mẫu xe chính hãng phân phối tại Motoshop',
          hinhAnh: item.hinhAnh || local?.hinhAnh || foundDefault?.hinhAnh || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
          coTheLaiThu: local?.coTheLaiThu !== undefined ? local.coTheLaiThu : (item.coTheLaiThu !== false),
          soLuong: local?.soLuong !== undefined ? local.soLuong : (item.soLuong ?? foundDefault?.soLuong ?? 12),
          ncc: local?.ncc || item.ncc || foundDefault?.ncc || `${item.hangXe || foundDefault?.hang || 'Honda'} Việt Nam`,
          namSanXuat: local?.namSanXuat || item.namSanXuat || foundDefault?.namSanXuat || 2025,
          xuatXu: local?.xuatXu || item.xuatXu || foundDefault?.xuatXu || 'Việt Nam',
          vat: local?.vat ?? item.vat ?? foundDefault?.vat ?? 10,
          loaiDongCo: local?.loaiDongCo || item.loaiDongCo || foundDefault?.loaiDongCo || foundDefault?.dongCo || '4 kỳ, 1 xi lanh, làm mát bằng dung dịch',
          dungTichXiLanh: local?.dungTichXiLanh || item.dungTichXiLanh || foundDefault?.dungTichXiLanh || '156.9 cc',
          tieuThuNhienLieu: local?.tieuThuNhienLieu || item.tieuThuNhienLieu || foundDefault?.tieuThuNhienLieu || foundDefault?.tieuHaoNhienLieu || '2.20 L/100km',
          khoiLuong: local?.khoiLuong || item.khoiLuong || foundDefault?.khoiLuong || '130 kg',
          kichThuoc: local?.kichThuoc || item.kichThuoc || foundDefault?.kichThuoc || '2.090 x 739 x 1.129 mm',
          doCaoYen: local?.doCaoYen || item.doCaoYen || foundDefault?.doCaoYen || '790 mm',
          dungTichBinhXang: local?.dungTichBinhXang || item.dungTichBinhXang || foundDefault?.dungTichBinhXang || '7.0 L',
          heThongPhanh: local?.heThongPhanh || item.heThongPhanh || foundDefault?.heThongPhanh || foundDefault?.phanh || 'Phanh đĩa trước & sau, tích hợp ABS',
          kichCoLop: local?.kichCoLop || item.kichCoLop || foundDefault?.kichCoLop || 'Trước: 100/80-16, Sau: 120/80-16',
          dongCo: local?.dongCo || foundDefault?.dongCo || item.thongSoKyThuat?.split(',')[0] || '150cc eSP+',
          congSuat: local?.congSuat || foundDefault?.congSuat || '15 HP / 8.000 rpm',
          tieuHaoNhienLieu: local?.tieuHaoNhienLieu || foundDefault?.tieuHaoNhienLieu || '2.1 L/100km',
          phanh: local?.phanh || foundDefault?.phanh || 'Phanh đĩa ABS trước',
          thongSoKyThuat: item.thongSoKyThuat || local?.thongSoKyThuat || foundDefault?.thongSoKyThuat || '',
          trangThaiHienThi: local?.trangThaiHienThi || item.trangThaiHienThi || foundDefault?.trangThaiHienThi || 'Hien',
          trangThaiKinhDoanh: local?.trangThaiKinhDoanh || item.trangThaiKinhDoanh || foundDefault?.trangThaiKinhDoanh || 'DangKinhDoanh',
          ngayTao: local?.ngayTao || item.ngayTao || foundDefault?.ngayTao || new Date().toISOString().split('T')[0],
        };
      });

      // Hợp nhất danh mục cơ sở với các xe từ backend và giữ các thay đổi trên máy
      const combinedMap = new Map<string, CatalogVehicle>();
      DEFAULT_CATALOG_VEHICLES.forEach(v => {
        const local = localMap.get(v.id) || localMap.get(v.tenXe.toLowerCase().trim());
        combinedMap.set(v.tenXe.toLowerCase().trim(), { ...v, ...(local || {}) });
      });
      mapped.forEach(v => {
        const key = v.tenXe.toLowerCase().trim();
        const existing = combinedMap.get(key);
        combinedMap.set(key, { ...(existing || {}), ...v });
      });
      // Giữ lại các xe người dùng tự thêm mới
      existingList.forEach(v => {
        const key = (v.tenXe || '').toLowerCase().trim();
        if (key && !combinedMap.has(key)) {
          combinedMap.set(key, v);
        }
      });

      const finalCatalog = Array.from(combinedMap.values());
      localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(finalCatalog));
      return finalCatalog;
    } catch (err) {
      console.warn('[catalogVehicleApi.getAll] Fallback to cached or local catalog:', err);
      if (existingList.length > 0) return existingList;
      return DEFAULT_CATALOG_VEHICLES;
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
      soLuong: data.soLuong ?? 10,
      ncc: data.ncc || `${data.hang} Việt Nam`,
      namSanXuat: data.namSanXuat || 2025,
      xuatXu: data.xuatXu || 'Việt Nam',
      vat: data.vat ?? 10,
      loaiDongCo: data.loaiDongCo || data.dongCo || '4 kỳ, 1 xi lanh, làm mát bằng dung dịch',
      dungTichXiLanh: data.dungTichXiLanh || '150 cc',
      tieuThuNhienLieu: data.tieuThuNhienLieu || data.tieuHaoNhienLieu || '2.2 L/100km',
      khoiLuong: data.khoiLuong || '125 kg',
      kichThuoc: data.kichThuoc || '1.950 x 690 x 1.100 mm',
      doCaoYen: data.doCaoYen || '775 mm',
      dungTichBinhXang: data.dungTichBinhXang || '5.5 L',
      heThongPhanh: data.heThongPhanh || data.phanh || 'Phanh đĩa thủy lực',
      kichCoLop: data.kichCoLop || 'Lốp không săm',
      trangThaiHienThi: data.trangThaiHienThi || 'Hien',
      trangThaiKinhDoanh: data.trangThaiKinhDoanh || 'DangKinhDoanh',
      ngayTao: data.ngayTao || new Date().toISOString().split('T')[0],
    };

    try {
      const cached = localStorage.getItem(VEHICLE_STORAGE_KEY);
      const list: CatalogVehicle[] = cached ? JSON.parse(cached) : [...DEFAULT_CATALOG_VEHICLES];
      list.unshift(newVehicle);
      localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(list));
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_catalog' } }));
    return { success: true, vehicle: newVehicle };
  },

  async update(id: string, data: Partial<CatalogVehicle>): Promise<{ success: boolean }> {
    // 1. Cập nhật ngay trong localStorage để phản hồi tức thì
    try {
      const cached = localStorage.getItem(VEHICLE_STORAGE_KEY);
      let list: CatalogVehicle[] = cached ? JSON.parse(cached) : [...DEFAULT_CATALOG_VEHICLES];
      const idx = list.findIndex(v => v.id === id || (v.tenXe && data.tenXe && v.tenXe.toLowerCase().trim() === data.tenXe.toLowerCase().trim()));
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data };
      } else {
        list.push({ id, ...data } as CatalogVehicle);
      }
      localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(list));
    } catch {}

    // 2. Chỉ gửi PUT lên backend nếu có đầy đủ tên xe
    const maXe = data.maXe || parseInt(id.replace(/\D/g, ''), 10);
    if (!isNaN(maXe) && maXe > 0 && data.tenXe) {
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
        console.warn('[catalogVehicleApi.update] Backend call failed, saved locally:', err);
      }
    }

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_catalog', id } }));
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

  createVehiclePurchaseSurvey(order: any, customer?: any): Survey {
    const custId = order.customerId || customer?.id || 'KH001';
    const bikeName = order.thongTinXe?.tenXe || 'Xe máy mới';
    const surveyId = `KS-XE-${order.id}`;

    const existing = surveyApi.getAll().find(s => s.id === surveyId);
    if (existing) return existing;

    const newSurvey = surveyApi.create({
      id: surveyId,
      title: `Khảo sát trải nghiệm bàn giao xe mới: ${bikeName} (#${order.id})`,
      description: `Chúc mừng quý khách đã nhận xe ${bikeName}! DailyXeMay trân trọng mời quý khách dành 1-2 phút đánh giá chất lượng bàn giao để nâng cao chất lượng phục vụ và nhận quà tri ân.`,
      targetCustomerId: custId,
      targetCustomerTier: 'ALL',
      targetCustomerIds: [custId],
      questions: [
        {
          id: 'q1',
          text: 'Mức độ hài lòng của bạn về ngoại quan và tình trạng xe mới khi nhận bàn giao (sơn xe, gương, phụ kiện, số khung/số máy)?',
          opts: ['Rất hài lòng (Xe sạch bóng, nguyên seal, đủ phụ kiện)', 'Hài lòng (Đạt tiêu chuẩn)', 'Bình thường', 'Chưa hài lòng'],
        },
        {
          id: 'q2',
          text: 'Thái độ tư vấn, hỗ trợ thủ tục hồ sơ và đăng ký xe của nhân viên bán hàng?',
          opts: ['Nhiệt tình, chu đáo, rất chuyên nghiệp', 'Tận tâm, đầy đủ thông tin', 'Bình thường', 'Cần cải thiện thái độ phục vụ'],
        },
        {
          id: 'q3',
          text: 'Bạn đã được chuyên viên hướng dẫn chi tiết về Sổ bảo hành điện tử và các mốc bảo dưỡng định kỳ (1.000km đầu)?',
          opts: ['Đã được hướng dẫn rất chi tiết & rõ ràng', 'Đã được giải thích sơ bộ', 'Chưa được hướng dẫn'],
        },
        {
          id: 'q4',
          text: 'Bạn có sẵn lòng giới thiệu Showroom DailyXeMay cho người thân, bạn bè khi có nhu cầu mua xe máy không?',
          opts: ['Chắc chắn sẽ giới thiệu', 'Có thể', 'Chưa chắc chắn'],
        },
      ],
    });

    addCustomerNotification({
      customerId: custId,
      category: 'survey',
      icon: '📋',
      title: `🎉 Khảo sát nhận xe: ${bikeName}`,
      message: `Mời bạn đánh giá buổi lễ bàn giao xe ${bikeName} để giúp Showroom nâng cao chất lượng phục vụ!`,
      page: 'dashboard',
      tab: 'surveys',
      targetId: newSurvey.id,
    });

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

// ────────────────────────────────────────────────────────────
// 10. BẢO HIỂM XE API (MOTORBIKE INSURANCE - BHX01 - BHX05)
// ────────────────────────────────────────────────────────────
export const INSURANCE_STORAGE_KEY = 'crm_insurance_contracts';

export const insuranceApi = {
  getPackages(): InsurancePackage[] {
    return INSURANCE_PACKAGES;
  },

  getAll(): InsuranceContract[] {
    try {
      const cached = localStorage.getItem(INSURANCE_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    localStorage.setItem(INSURANCE_STORAGE_KEY, JSON.stringify(mockInsuranceContracts));
    return mockInsuranceContracts;
  },

  getByCustomerId(customerId: string): InsuranceContract[] {
    const all = insuranceApi.getAll();
    const cIdNum = parseInt(customerId.replace(/\D/g, ''), 10);
    return all.filter(c => {
      if (c.customerId === customerId) return true;
      const cNum = parseInt(c.customerId.replace(/\D/g, ''), 10);
      return !isNaN(cIdNum) && !isNaN(cNum) && cIdNum === cNum;
    });
  },

  create(contract: Omit<InsuranceContract, 'id' | 'soGCN'>): InsuranceContract {
    const all = insuranceApi.getAll();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `BH${(all.length + 1).toString().padStart(3, '0')}`;
    const newGCN = `GCN-BV-2026-${randomSuffix}`;

    const newContract: InsuranceContract = {
      ...contract,
      id: newId,
      soGCN: newGCN,
    };

    all.unshift(newContract);
    localStorage.setItem(INSURANCE_STORAGE_KEY, JSON.stringify(all));

    // Send admin notification
    addAdminNotification({
      type: 'insurance_registered',
      title: contract.trangThai === 'ChoDuyet' ? '🛡️ Yêu cầu đăng ký bảo hiểm mới' : '🛡️ Đã cấp hợp đồng bảo hiểm xe mới',
      message: `${contract.hoTenKH} (${contract.bienSo}) - ${contract.tenGoi}. Phí: ${new Intl.NumberFormat('vi-VN').format(contract.tongTien || contract.phiBaoHiem)}₫.`,
      linkPage: 'insurance',
      meta: newContract,
    });

    // Send customer notification
    if (contract.customerId) {
      addCustomerNotification({
        customerId: contract.customerId,
        category: 'system',
        icon: '🛡️',
        title: 'Đăng ký bảo hiểm thành công',
        message: `Hợp đồng bảo hiểm ${contract.tenGoi} cho xe ${contract.tenXe} (${contract.bienSo}) đã được kích hoạt thành công. Số GCN: ${newGCN}.`,
        page: 'dashboard',
        tab: 'vehicles',
        targetId: newId,
      });
    }

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'insurance_contracts' } }));
    return newContract;
  },

  renewContract(
    oldContractId: string,
    durationYears: number = 1,
    paymentMethod: 'ChuyenKhoan' | 'TienMat' = 'ChuyenKhoan',
    maGiamGia?: string
  ): { success: boolean; message: string; contract?: InsuranceContract } {
    const all = insuranceApi.getAll();
    const old = all.find(c => c.id === oldContractId);
    if (!old) return { success: false, message: 'Không tìm thấy hợp đồng bảo hiểm cũ để gia hạn!' };

    // Tính ngày bắt đầu và kết thúc mới
    let startD = new Date();
    const oldEnd = new Date(old.ngayKetThuc);
    if (!isNaN(oldEnd.getTime()) && oldEnd > startD) {
      startD = oldEnd; // nối tiếp ngày hết hạn cũ
    }
    const endD = new Date(startD);
    endD.setFullYear(endD.getFullYear() + durationYears);

    const startStr = startD.toISOString().split('T')[0];
    const endStr = endD.toISOString().split('T')[0];
    const feePerYear = old.phiBaoHiem / (old.thoiHanNam || 1);
    const baseFee = feePerYear * durationYears;
    const vat = Math.round(baseFee * 0.1);
    const discount = maGiamGia ? Math.round(baseFee * 0.1) : 0;
    const total = baseFee + vat - discount;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `BH${(all.length + 1).toString().padStart(3, '0')}`;
    const newGCN = `GCN-BV-2026-${randomSuffix}`;

    const newContract: InsuranceContract = {
      ...old,
      id: newId,
      soGCN: newGCN,
      thoiHanNam: durationYears,
      phiBaoHiem: baseFee,
      thueVAT: vat,
      tongTien: total,
      maGiamGia: maGiamGia || undefined,
      phuongThucThanhToan: paymentMethod,
      ngayCap: new Date().toISOString().split('T')[0],
      ngayBatDau: startStr,
      ngayKetThuc: endStr,
      trangThai: 'HieuLuc',
      isRenewed: true,
      hopDongGocId: oldContractId,
      ghiChu: `Gia hạn tái tục từ hợp đồng ${old.soGCN}. Hiệu lực thêm ${durationYears} năm.`,
    };

    all.unshift(newContract);
    localStorage.setItem(INSURANCE_STORAGE_KEY, JSON.stringify(all));

    // Send customer notification
    if (newContract.customerId) {
      addCustomerNotification({
        customerId: newContract.customerId,
        category: 'system',
        icon: '🛡️',
        title: 'Gia hạn bảo hiểm thành công',
        message: `Hợp đồng bảo hiểm ${newContract.tenGoi} (${newContract.bienSo}) đã được gia hạn thêm ${durationYears} năm đến ngày ${endStr.split('-').reverse().join('/')}. Số GCN mới: ${newGCN}.`,
        page: 'dashboard',
        tab: 'vehicles',
        targetId: newId,
      });
    }

    addAdminNotification({
      type: 'insurance_updated',
      title: '🔄 Khách hàng gia hạn bảo hiểm xe',
      message: `${newContract.hoTenKH} (${newContract.bienSo}) vừa gia hạn thành công ${newContract.tenGoi} thêm ${durationYears} năm. GCN: ${newGCN}.`,
      linkPage: 'insurance',
      meta: newContract,
    });

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'insurance_contracts' } }));
    return { success: true, message: `Gia hạn bảo hiểm thành công! Hạn mới đến ${endStr.split('-').reverse().join('/')}.`, contract: newContract };
  },

  updateStatus(id: string, status: InsuranceStatus, ghiChu?: string): boolean {
    const all = insuranceApi.getAll();
    const idx = all.findIndex(c => c.id === id);
    if (idx === -1) return false;

    all[idx].trangThai = status;
    if (ghiChu !== undefined) all[idx].ghiChu = ghiChu;
    localStorage.setItem(INSURANCE_STORAGE_KEY, JSON.stringify(all));

    addAdminNotification({
      type: 'insurance_updated',
      title: status === 'HieuLuc' ? '✅ Hợp đồng bảo hiểm đã được phê duyệt' : status === 'TuChoi' ? '❌ Yêu cầu bảo hiểm bị từ chối' : 'ℹ️ Cập nhật trạng thái bảo hiểm',
      message: `Hợp đồng ${all[idx].soGCN} (${all[idx].bienSo}) đã chuyển sang trạng thái "${status}".`,
      linkPage: 'insurance',
      meta: all[idx],
    });

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'insurance_contracts' } }));
    return true;
  },
};

// ────────────────────────────────────────────────────────────
// 12. CHƯƠNG TRÌNH KHUYẾN MÃI (PROMOTIONS) - KM01, KM02, KM03
// ────────────────────────────────────────────────────────────
export interface Promotion {
  id: string; // KM001, KM-XUAN2026...
  tenChuongTrinh: string;
  moTa?: string;
  loaiGiamGia: 'PhanTram' | 'SoTien'; // % hoặc VNĐ
  mucGiam: number; // e.g. 15 (15%) hoặc 50000 (50.000 VNĐ)
  giamToiDa?: number; // tối đa VNĐ khi loại là PhanTram
  ngayBatDau: string; // YYYY-MM-DD
  ngayKetThuc: string; // YYYY-MM-DD
  trangThai: 'DangApDung' | 'TamDung' | 'HetHan';
  apDungCho: 'TatCa' | 'TheoDanhMuc' | 'SanPhamCuThe';
  danhMucApDung?: string[]; // e.g. ['Nhớt', 'Lọc']
  sanPhamIds: string[]; // danh sách mã phụ tùng e.g. ['PT001', 'PT002']
  ngayTao: string;
}

export interface ProductDiscountResult {
  giaKhuyenMai: number;
  promotionId: string;
  promotionName: string;
  discountAmount: number;
  mucGiamText: string;
}

const PROMOTIONS_STORAGE_KEY = 'crm_promotions_data';

export const mockPromotions: Promotion[] = [
  {
    id: 'KM001',
    tenChuongTrinh: 'Giảm 10% Dầu nhớt & Phụ gia động cơ',
    moTa: 'Áp dụng cho toàn bộ danh mục dầu nhớt chính hãng Motul, Castrol, Shell.',
    loaiGiamGia: 'PhanTram',
    mucGiam: 10,
    giamToiDa: 100000,
    ngayBatDau: '2025-01-01',
    ngayKetThuc: '2026-12-31',
    trangThai: 'DangApDung',
    apDungCho: 'TheoDanhMuc',
    danhMucApDung: ['Nhớt'],
    sanPhamIds: [],
    ngayTao: '2025-01-01',
  },
  {
    id: 'KM002',
    tenChuongTrinh: 'Ưu đãi Lọc gió & Bugi Iridium',
    moTa: 'Giảm ngay 30.000đ khi thay thế bộ đôi phụ tùng hao mòn định kỳ.',
    loaiGiamGia: 'SoTien',
    mucGiam: 30000,
    ngayBatDau: '2025-02-01',
    ngayKetThuc: '2026-12-31',
    trangThai: 'DangApDung',
    apDungCho: 'TheoDanhMuc',
    danhMucApDung: ['Lọc', 'Bugi'],
    sanPhamIds: [],
    ngayTao: '2025-02-01',
  },
  {
    id: 'KM003',
    tenChuongTrinh: 'Tri ân khách hàng - Lốp xe & Phanh thể thao',
    moTa: 'Giảm 15% (tối đa 250.000đ) cho các dòng lốp xe và má phanh hiệu suất cao.',
    loaiGiamGia: 'PhanTram',
    mucGiam: 15,
    giamToiDa: 250000,
    ngayBatDau: '2025-03-01',
    ngayKetThuc: '2026-12-31',
    trangThai: 'DangApDung',
    apDungCho: 'TheoDanhMuc',
    danhMucApDung: ['Phanh', 'Lốp xe'],
    sanPhamIds: [],
    ngayTao: '2025-03-01',
  },
  {
    id: 'KM004',
    tenChuongTrinh: 'Flash Sale Xả kho Phụ tùng cuối năm',
    moTa: 'Chương trình flash sale toàn bộ phụ tùng tồn kho đợt cuối năm.',
    loaiGiamGia: 'PhanTram',
    mucGiam: 20,
    giamToiDa: 300000,
    ngayBatDau: '2024-11-01',
    ngayKetThuc: '2024-12-31',
    trangThai: 'HetHan',
    apDungCho: 'TatCa',
    sanPhamIds: [],
    ngayTao: '2024-11-01',
  },
];

export const promotionApi = {
  getAll(): Promotion[] {
    try {
      const raw = localStorage.getItem(PROMOTIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check expiration dates automatically
          const today = new Date().toISOString().split('T')[0];
          return parsed.map(p => {
            if (p.trangThai === 'DangApDung' && p.ngayKetThuc && p.ngayKetThuc < today) {
              return { ...p, trangThai: 'HetHan' as const };
            }
            return p;
          });
        }
      }
    } catch (e) {
      console.warn('promotionApi.getAll error reading cache:', e);
    }
    // Initial fallback
    localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(mockPromotions));
    return [...mockPromotions];
  },

  getById(id: string): Promotion | null {
    const all = this.getAll();
    return all.find(p => p.id === id) || null;
  },

  create(data: Omit<Promotion, 'id' | 'ngayTao'> & { id?: string }): Promotion {
    const all = this.getAll();
    const id = data.id?.trim() || `KM${String(Date.now()).slice(-4)}`;
    const newPromo: Promotion = {
      ...data,
      id,
      ngayTao: new Date().toISOString().split('T')[0],
      danhMucApDung: data.danhMucApDung || [],
      sanPhamIds: data.sanPhamIds || [],
    };
    all.unshift(newPromo);
    localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(all));

    addAdminNotification({
      type: 'promotion_created',
      title: '🏷️ Chương trình khuyến mãi mới',
      message: `Đã tạo chương trình: "${newPromo.tenChuongTrinh}" (${newPromo.loaiGiamGia === 'PhanTram' ? `Giảm ${newPromo.mucGiam}%` : `Giảm ${new Intl.NumberFormat('vi-VN').format(newPromo.mucGiam)}₫`}).`,
      linkPage: 'promotions',
      meta: newPromo,
    });

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'promotion_created', promo: newPromo } }));
    return newPromo;
  },

  update(id: string, patch: Partial<Promotion>): Promotion | null {
    const all = this.getAll();
    const idx = all.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const updated = { ...all[idx], ...patch };
    all[idx] = updated;
    localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(all));

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'promotion_updated', promo: updated } }));
    return updated;
  },

  delete(id: string): boolean {
    const all = this.getAll();
    const filtered = all.filter(p => p.id !== id);
    if (filtered.length === all.length) return false;

    localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'promotion_deleted', id } }));
    return true;
  },

  toggleStatus(id: string): Promotion | null {
    const all = this.getAll();
    const target = all.find(p => p.id === id);
    if (!target) return null;

    let newStatus: Promotion['trangThai'] = 'DangApDung';
    if (target.trangThai === 'DangApDung') newStatus = 'TamDung';
    else if (target.trangThai === 'TamDung') newStatus = 'DangApDung';
    else {
      // HetHan -> TamDung or DangApDung
      newStatus = 'DangApDung';
    }

    return this.update(id, { trangThai: newStatus });
  },

  /**
   * Tính giá khuyến mãi cho một phụ tùng dựa trên tất cả chương trình KM đang có hiệu lực.
   */
  calculateDiscount(part: { id: string; giaGoc: number; danhMuc?: string }): ProductDiscountResult | null {
    if (!part || !part.giaGoc || part.giaGoc <= 0) return null;

    const all = this.getAll();
    const today = new Date().toISOString().split('T')[0];

    const activePromos = all.filter(p => {
      if (p.trangThai !== 'DangApDung') return false;
      if (p.ngayBatDau && p.ngayBatDau > today) return false;
      if (p.ngayKetThuc && p.ngayKetThuc < today) return false;

      if (p.apDungCho === 'TatCa') return true;
      if (p.apDungCho === 'TheoDanhMuc') {
        return !!part.danhMuc && (p.danhMucApDung || []).includes(part.danhMuc);
      }
      if (p.apDungCho === 'SanPhamCuThe') {
        return (p.sanPhamIds || []).includes(part.id);
      }
      return false;
    });

    if (activePromos.length === 0) return null;

    let bestResult: ProductDiscountResult | null = null;
    let maxDiscountAmount = 0;

    for (const promo of activePromos) {
      let discountAmount = 0;
      let mucGiamText = '';

      if (promo.loaiGiamGia === 'PhanTram') {
        const raw = Math.round((part.giaGoc * promo.mucGiam) / 100);
        discountAmount = promo.giamToiDa ? Math.min(raw, promo.giamToiDa) : raw;
        mucGiamText = `-${promo.mucGiam}%`;
      } else {
        discountAmount = Math.min(promo.mucGiam, part.giaGoc);
        mucGiamText = `-${new Intl.NumberFormat('vi-VN').format(promo.mucGiam)}₫`;
      }

      if (discountAmount > maxDiscountAmount) {
        maxDiscountAmount = discountAmount;
        bestResult = {
          giaKhuyenMai: Math.max(0, part.giaGoc - discountAmount),
          promotionId: promo.id,
          promotionName: promo.tenChuongTrinh,
          discountAmount,
          mucGiamText,
        };
      }
    }

    return bestResult;
  },
};

/* ───────────────────────── WARRANTY API (QUẢN LÝ BẢO HÀNH) ───────────────────────── */
const WARRANTY_APPTS_STORAGE_KEY = 'crm_warranty_appointments';
const WARRANTY_RECORDS_STORAGE_KEY = 'crm_warranty_records';

export const warrantyApi = {
  /**
   * Lấy danh sách lịch hẹn bảo hành
   */
  getAppointments(customerId?: string): WarrantyAppointment[] {
    try {
      const raw = localStorage.getItem(WARRANTY_APPTS_STORAGE_KEY);
      let list: WarrantyAppointment[] = raw ? JSON.parse(raw) : mockWarrantyAppointments;
      if (!Array.isArray(list) || list.length === 0) {
        list = mockWarrantyAppointments;
        localStorage.setItem(WARRANTY_APPTS_STORAGE_KEY, JSON.stringify(list));
      }
      if (customerId) {
        return list.filter(a => a.customerId === customerId);
      }
      return list;
    } catch {
      return mockWarrantyAppointments;
    }
  },

  /**
   * Lấy chi tiết lịch hẹn bảo hành theo ID
   */
  getAppointmentById(id: string): WarrantyAppointment | undefined {
    const all = this.getAppointments();
    return all.find(a => a.id.toLowerCase() === id.toLowerCase() || a.id.replace(/\D/g, '') === id.replace(/\D/g, ''));
  },

  /**
   * Khách hàng gửi yêu cầu kiểm tra bảo hành mới (Ảnh 3)
   */
  async createAppointment(data: {
    customerId: string;
    hoTenKH: string;
    soDienThoai: string;
    vehicleId: string;
    tenXe: string;
    bienSo: string;
    odoKhachBao: number;
    vanDeGapPhai: string[];
    moTaChiTiet: string;
    hinhAnhKhachHang?: string[];
    ngayHen: string;
    gioHen: string;
    chiNhanh: string;
  }): Promise<{ success: boolean; appointment: WarrantyAppointment }> {
    const all = this.getAppointments();
    const d = new Date();
    const dateStr = `${d.getDate().toString().padStart(2, '0')}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getFullYear().toString().slice(-2)}`;
    const randomSeq = Math.floor(10 + Math.random() * 90);
    const newId = `#BH-${dateStr}-${randomSeq}`;

    const newAppt: WarrantyAppointment = {
      id: newId,
      customerId: data.customerId,
      hoTenKH: data.hoTenKH,
      soDienThoai: data.soDienThoai,
      vehicleId: data.vehicleId,
      tenXe: data.tenXe,
      bienSo: data.bienSo,
      odoKhachBao: data.odoKhachBao || 0,
      vanDeGapPhai: data.vanDeGapPhai,
      moTaChiTiet: data.moTaChiTiet,
      hinhAnhKhachHang: data.hinhAnhKhachHang || [],
      ngayHen: data.ngayHen,
      gioHen: data.gioHen,
      chiNhanh: data.chiNhanh,
      trangThai: 'ChoTiepNhan',
      ngayTao: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
    };

    const updated = [newAppt, ...all];
    try {
      localStorage.setItem(WARRANTY_APPTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    // Thông báo cho Admin
    addAdminNotification({
      category: 'system',
      type: 'warranty_request_created',
      title: 'Yêu cầu bảo hành mới',
      message: `Khách hàng ${data.hoTenKH} vừa gửi yêu cầu bảo hành ${newId} cho xe ${data.tenXe} (${data.bienSo}).`,
      linkPage: 'warranty',
      meta: { appointmentId: newId },
    });

    // Thông báo cho Khách hàng
    addCustomerNotification({
      customerId: data.customerId,
      category: 'system',
      icon: '🔧',
      title: 'Yêu cầu kiểm tra bảo hành đã gửi',
      message: `Yêu cầu kiểm tra bảo hành ${newId} cho xe ${data.tenXe} đã được gửi thành công. Showroom sẽ sớm liên hệ xác nhận.`,
      page: 'dashboard',
      tab: 'vehicles',
      targetId: newId,
    });

    return { success: true, appointment: newAppt };
  },

  /**
   * Nhân viên xác nhận lịch hẹn (Ảnh 4: Chuyển sang DaXacNhan)
   */
  async confirmAppointment(id: string): Promise<boolean> {
    const all = this.getAppointments();
    const appt = all.find(a => a.id === id);
    if (!appt) return false;

    appt.trangThai = 'DaXacNhan';
    try {
      localStorage.setItem(WARRANTY_APPTS_STORAGE_KEY, JSON.stringify(all));
    } catch {}

    addCustomerNotification({
      customerId: appt.customerId,
      category: 'system',
      icon: '✅',
      title: 'Lịch hẹn bảo hành đã được xác nhận',
      message: `Yêu cầu ${appt.id} đã được xác nhận. Vui lòng mang xe ${appt.tenXe} đến ${appt.chiNhanh} lúc ${appt.gioHen} ngày ${appt.ngayHen}.`,
      page: 'dashboard',
      tab: 'vehicles',
      targetId: appt.id,
    });

    return true;
  },

  /**
   * Showroom tiếp nhận xe (Chuyển sang DaTiepNhan)
   */
  async receiveVehicle(id: string): Promise<boolean> {
    const all = this.getAppointments();
    const appt = all.find(a => a.id === id);
    if (!appt) return false;

    appt.trangThai = 'DaTiepNhan';
    try {
      localStorage.setItem(WARRANTY_APPTS_STORAGE_KEY, JSON.stringify(all));
    } catch {}

    addCustomerNotification({
      customerId: appt.customerId,
      category: 'system',
      icon: '🏍️',
      title: 'Đã tiếp nhận xe vào xưởng dịch vụ',
      message: `Showroom đã tiếp nhận xe ${appt.tenXe} (${appt.bienSo}). Kỹ thuật viên đang chuẩn bị tiến hành kiểm tra xe.`,
      page: 'dashboard',
      tab: 'vehicles',
      targetId: appt.id,
    });

    return true;
  },

  /**
   * Bắt đầu kiểm tra kỹ thuật (Chuyển sang DangKiemTra)
   */
  async startInspection(id: string): Promise<boolean> {
    const all = this.getAppointments();
    const appt = all.find(a => a.id === id);
    if (!appt) return false;

    appt.trangThai = 'DangKiemTra';
    try {
      localStorage.setItem(WARRANTY_APPTS_STORAGE_KEY, JSON.stringify(all));
    } catch {}

    return true;
  },

  /**
   * Cập nhật đánh giá kỹ thuật (Ảnh 5 bên trái)
   */
  async saveAssessment(id: string, assessment: TechnicalAssessment): Promise<boolean> {
    const all = this.getAppointments();
    const appt = all.find(a => a.id === id);
    if (!appt) return false;

    appt.danhGiaKyThuat = assessment;
    try {
      localStorage.setItem(WARRANTY_APPTS_STORAGE_KEY, JSON.stringify(all));
    } catch {}

    return true;
  },

  /**
   * Quyết định phương án xử lý (Ảnh 5 bên phải & Flowchart):
   * 1. DuocBaoHanh -> Chuyển SuaChuaBH
   * 2. TuChoi_DongYSua -> Chuyển SuaCoPhi (Báo giá)
   * 3. TuChoi_KhongSua -> Chuyển DongYeuCau
   */
  async submitDecision(
    id: string,
    decision: WarrantyDecision,
    assessment?: TechnicalAssessment,
    quotePrice?: number
  ): Promise<boolean> {
    const all = this.getAppointments();
    const appt = all.find(a => a.id === id);
    if (!appt) return false;

    if (assessment) {
      appt.danhGiaKyThuat = assessment;
    }
    appt.quyetDinh = decision;

    if (decision === 'DuocBaoHanh') {
      appt.trangThai = 'SuaChuaBH';
      appt.chiPhiThucTe = 0;
      addCustomerNotification({
        customerId: appt.customerId,
        category: 'system',
        icon: '🛡️',
        title: 'Yêu cầu bảo hành ĐƯỢC CHẤP THUẬN',
        message: `Xe ${appt.tenXe} (${appt.bienSo}) đủ điều kiện bảo hành miễn phí 100%. Kỹ thuật viên đang tiến hành sửa chữa bảo hành.`,
        page: 'dashboard',
        tab: 'vehicles',
        targetId: appt.id,
      });
    } else if (decision === 'TuChoi_DongYSua') {
      appt.trangThai = 'SuaCoPhi';
      appt.chiPhiBaoGia = quotePrice || 0;
      appt.chiPhiThucTe = quotePrice || 0;
      addCustomerNotification({
        customerId: appt.customerId,
        category: 'system',
        icon: '⚙️',
        title: 'Khách hàng đồng ý sửa chữa (Có phí)',
        message: `Xe ${appt.tenXe} (${appt.bienSo}) đang được sửa chữa theo thỏa thuận báo giá: ${new Intl.NumberFormat('vi-VN').format(quotePrice || 0)}₫.`,
        page: 'dashboard',
        tab: 'vehicles',
        targetId: appt.id,
      });
    } else if (decision === 'TuChoi_KhongSua') {
      appt.trangThai = 'DongYeuCau';
      appt.chiPhiThucTe = 0;
      appt.inPhieuLoai = 'BienBanTraXe';
      appt.ngayHoanTat = new Date().toLocaleDateString('vi-VN');
      addCustomerNotification({
        customerId: appt.customerId,
        category: 'system',
        icon: '🚪',
        title: 'Yêu cầu bảo hành đã đóng - Bàn giao xe',
        message: `Xe ${appt.tenXe} (${appt.bienSo}) đã được kiểm tra kỹ thuật và hoàn tất thủ tục bàn giao nguyên trạng.`,
        page: 'dashboard',
        tab: 'vehicles',
        targetId: appt.id,
      });
    }

    try {
      localStorage.setItem(WARRANTY_APPTS_STORAGE_KEY, JSON.stringify(all));
    } catch {}

    return true;
  },

  /**
   * Cập nhật trạng thái từng bước của tiến trình
   */
  async updateStep(id: string, nextStatus: WarrantyAppointmentStatus): Promise<boolean> {
    const all = this.getAppointments();
    const appt = all.find(a => a.id === id);
    if (!appt) return false;

    appt.trangThai = nextStatus;
    try {
      localStorage.setItem(WARRANTY_APPTS_STORAGE_KEY, JSON.stringify(all));
    } catch {}

    return true;
  },

  /**
   * Hoàn tất yêu cầu bảo hành & In ấn phiếu
   */
  async completeAppointment(
    id: string,
    inPhieuLoai: 'PhieuBaoHanh' | 'HoaDonSuaChua' | 'BienBanTraXe'
  ): Promise<boolean> {
    const all = this.getAppointments();
    const appt = all.find(a => a.id === id);
    if (!appt) return false;

    appt.trangThai = 'HoanTat';
    appt.inPhieuLoai = inPhieuLoai;
    appt.ngayHoanTat = new Date().toLocaleDateString('vi-VN');

    // Nếu là Phiếu bảo hành (Được bảo hành): Tự động ghi vào lịch sử bảo hành của xe
    if (inPhieuLoai === 'PhieuBaoHanh') {
      const existingRecords = this.getWarrantyRecords(appt.vehicleId);
      const nextLan = existingRecords.length + 1;
      const issuesText = appt.danhGiaKyThuat?.boPhanLoi?.join(', ') || appt.vanDeGapPhai.join(', ') || 'Bảo hành linh kiện chính hãng';

      this.addWarrantyRecord({
        id: `WREC-${Date.now()}`,
        vehicleId: appt.vehicleId,
        lanThu: nextLan,
        ngayThucHien: new Date().toLocaleDateString('vi-VN'),
        noiDung: issuesText,
        chiPhi: 0,
        loaiChiPhi: 'BaoHanh',
        trangThai: 'HoanThanh',
        chiNhanh: appt.chiNhanh,
        maLichHen: appt.id,
      });

      addCustomerNotification({
        customerId: appt.customerId,
        category: 'system',
        icon: '🎉',
        title: 'Bảo hành hoàn tất - Đã xuất Phiếu bảo hành',
        message: `Quy trình bảo hành xe ${appt.tenXe} (#${appt.id}) đã hoàn tất thành công. Sổ bảo hành điện tử của bạn đã được cập nhật lần bảo hành thứ ${nextLan}.`,
        page: 'dashboard',
        tab: 'vehicles',
        targetId: appt.id,
      });
    } else if (inPhieuLoai === 'HoaDonSuaChua') {
      addCustomerNotification({
        customerId: appt.customerId,
        category: 'system',
        icon: '🧾',
        title: 'Sửa chữa hoàn tất - Đã xuất Hóa đơn',
        message: `Xe ${appt.tenXe} (#${appt.id}) đã sửa chữa xong và kiểm tra hoàn tất. Quý khách vui lòng đến showroom nhận xe và thanh toán theo hóa đơn.`,
        page: 'dashboard',
        tab: 'vehicles',
        targetId: appt.id,
      });
    }

    try {
      localStorage.setItem(WARRANTY_APPTS_STORAGE_KEY, JSON.stringify(all));
    } catch {}

    return true;
  },

  /**
   * Lấy lịch sử bảo hành của một xe cụ thể (Ảnh 1: Lịch sử bảo hành)
   */
  getWarrantyRecords(vehicleId: string): WarrantyRecord[] {
    try {
      const raw = localStorage.getItem(WARRANTY_RECORDS_STORAGE_KEY);
      let list: WarrantyRecord[] = raw ? JSON.parse(raw) : mockWarrantyRecords;
      if (!Array.isArray(list) || list.length === 0) {
        list = mockWarrantyRecords;
        localStorage.setItem(WARRANTY_RECORDS_STORAGE_KEY, JSON.stringify(list));
      }
      return list.filter(r => r.vehicleId === vehicleId).sort((a, b) => b.lanThu - a.lanThu);
    } catch {
      return mockWarrantyRecords.filter(r => r.vehicleId === vehicleId);
    }
  },

  /**
   * Thêm bản ghi lịch sử bảo hành mới
   */
  addWarrantyRecord(record: WarrantyRecord): void {
    try {
      const raw = localStorage.getItem(WARRANTY_RECORDS_STORAGE_KEY);
      const list: WarrantyRecord[] = raw ? JSON.parse(raw) : mockWarrantyRecords;
      const updated = [record, ...list];
      localStorage.setItem(WARRANTY_RECORDS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },

  /**
   * Mua gia hạn bảo hành mở rộng Care+ (Ảnh 1: Gói Care+)
   */
  /**
   * Thẩm định điều kiện gia hạn bảo hành mở rộng (Ảnh 2 & Ảnh 3)
   */
  verifyWarrantyExtension(
    vehicleId: string,
    currentOdo: number,
    isSimulateFail: boolean = false
  ): {
    isEligible: boolean;
    criteria: {
      odo: boolean;
      odoText: string;
      maintenance: boolean;
      maintenanceText: string;
      repair: boolean;
      repairText: string;
    };
    history: VehicleServiceHistoryRecord[];
    reason?: string;
  } {
    if (isSimulateFail) {
      const historyFail = mockVehicleServiceHistories['XE001_FAIL'] || [];
      return {
        isEligible: false,
        criteria: {
          odo: currentOdo <= 30000,
          odoText: currentOdo <= 30000 ? `ĐẠT ĐIỀU KIỆN (${currentOdo.toLocaleString('vi-VN')} km / < 30.000 km)` : `KHÔNG ĐẠT (Vượt quá 30.000 km)`,
          maintenance: false,
          maintenanceText: 'KHÔNG ĐẠT (Mới thực hiện 1/3 lần/năm trong 12 tháng qua. Yêu cầu tối thiểu 3 lần/năm)',
          repair: false,
          repairText: 'KHÔNG ĐẠT (Phát hiện có lịch sử sửa chữa tự phát/thay thế phụ tùng ngoài hệ thống)',
        },
        history: historyFail,
        reason: 'Yêu cầu gia hạn bảo hành mở rộng đã bị từ chối do phương tiện không đáp ứng đầy đủ lịch sử bảo dưỡng định kỳ và có ghi nhận sửa chữa không chính hãng. Vui lòng liên hệ hotline hoặc đến trực tiếp đại lý để được hỗ trợ.',
      };
    }

    const historyPass = mockVehicleServiceHistories['XE001'] || [];
    const isOdoOk = currentOdo <= 30000;
    return {
      isEligible: isOdoOk,
      criteria: {
        odo: isOdoOk,
        odoText: isOdoOk ? `Đạt điều kiện (${currentOdo.toLocaleString('vi-VN')} km < 30.000 km)` : `Không đạt (${currentOdo.toLocaleString('vi-VN')} km >= 30.000 km)`,
        maintenance: true,
        maintenanceText: 'Đạt điều kiện (Đã thực hiện bảo dưỡng 3/3 lần/năm đúng định kỳ trong 12 tháng gần nhất)',
        repair: true,
        repairText: 'Đạt điều kiện (Không phát hiện tự ý thay thế linh kiện ngoài hoặc độ chế, 100% lịch sử chính hãng)',
      },
      history: historyPass,
      reason: isOdoOk ? undefined : 'Phương tiện đã chạy vượt quá giới hạn 30.000 km cho phép của gói bảo hành mở rộng.',
    };
  },

  /**
   * Mua gia hạn bảo hành mở rộng (Wizard 4 Bước - Ảnh 4)
   */
  async buyExtendedWarranty(
    customerId: string,
    vehicleId: string,
    packageId: string,
    currentOdo?: number,
    evidenceImages?: string[]
  ): Promise<{ success: boolean; message: string }> {
    const pkg = EXTENDED_WARRANTY_PACKAGES.find(p => p.id === packageId) || EXTENDED_WARRANTY_PACKAGES[0];
    const vehiclesRaw = localStorage.getItem('crm_customer_vehicles');
    let vehicles: Vehicle[] = vehiclesRaw ? JSON.parse(vehiclesRaw) : mockVehicles;

    const vIdx = vehicles.findIndex(v => v.id === vehicleId);
    if (vIdx !== -1) {
      const curVeh = vehicles[vIdx];
      let newDate = new Date();
      if (curVeh.hanBaoHanh && !isNaN(new Date(curVeh.hanBaoHanh).getTime())) {
        newDate = new Date(curVeh.hanBaoHanh);
      }
      let addedYears = 1;
      if (packageId === 'GOI_TOAN_DIEN_2Y' || packageId === 'CARE_PLUS_2Y') addedYears = 2;
      else if (packageId === 'GOI_CAO_CAP_3Y') addedYears = 3;

      newDate.setFullYear(newDate.getFullYear() + addedYears);
      const newHanBaoHanh = newDate.toISOString().split('T')[0];

      vehicles[vIdx] = {
        ...curVeh,
        hanBaoHanh: newHanBaoHanh,
        trangThaiBaoHanh: 'ConHan',
      };

      try {
        localStorage.setItem('crm_customer_vehicles', JSON.stringify(vehicles));
      } catch {}

      // Tự động ghi 1 bản ghi vào lịch sử bảo hành của xe
      const allRecords = warrantyApi.getWarrantyRecords(vehicleId);
      const newRec: WarrantyRecord = {
        id: `WREC-CARE-${Date.now().toString().slice(-4)}`,
        vehicleId,
        lanThu: allRecords.length + 1,
        ngayThucHien: new Date().toLocaleDateString('vi-VN'),
        noiDung: `Kích hoạt ${pkg.tenGoi} (+${pkg.thoiGianThem} / +${pkg.kmThem})`,
        chiPhi: pkg.giaUuDai,
        loaiChiPhi: 'CoPhi',
        trangThai: 'HoanThanh',
        chiNhanh: 'Hệ thống Showroom Ủy Quyền',
        soKm: currentOdo || 12500,
        kyThuatVien: 'Hệ thống tự động kích hoạt',
        chiTietLinhKien: [pkg.tenGoi, 'Sổ bảo hành điện tử đã gia hạn'],
      };
      warrantyApi.addWarrantyRecord(newRec);

      addCustomerNotification({
        customerId,
        category: 'system',
        icon: '🛡️',
        title: 'Kích hoạt Bảo hành mở rộng thành công',
        message: `Bạn đã gia hạn thành công ${pkg.tenGoi} cho xe ${curVeh.tenXe}. Thời hạn bảo hành mới được kéo dài đến ${newHanBaoHanh.split('-').reverse().join('/')}.`,
        page: 'dashboard',
        tab: 'vehicles',
        targetId: vehicleId,
      });

      addAdminNotification({
        type: 'warranty_requested',
        title: '🛡️ Khách hàng gia hạn bảo hành mở rộng',
        message: `${curVeh.tenXe} (${curVeh.bienSo || vehicleId}) vừa gia hạn thành công ${pkg.tenGoi}. Doanh thu: ${new Intl.NumberFormat('vi-VN').format(pkg.giaUuDai)}₫.`,
        linkPage: 'warranty',
        meta: { vehicleId, packageId, currentOdo },
      });

      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'warranty_extended' } }));

      return {
        success: true,
        message: `Chúc mừng bạn đã gia hạn thành công ${pkg.tenGoi}! Thời hạn bảo hành mới đến ngày ${newHanBaoHanh.split('-').reverse().join('/')}.`,
      };
    }

    return { success: false, message: 'Không tìm thấy thông tin phương tiện để gia hạn.' };
  },
};




