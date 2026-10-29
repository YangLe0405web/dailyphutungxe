export function isSameCategory(catA?: string, catB?: string): boolean {
  if (!catA || !catB) return false;
  if (catA === catB) return true;
  const a = catA.toLowerCase().trim();
  const b = catB.toLowerCase().trim();
  if (a === b) return true;
  if (a.includes('ga') && b.includes('ga')) return true;
  if ((a.includes('côn') || a.includes('con')) && (b.includes('côn') || b.includes('con'))) return true;
  if ((a.includes('số') || a.includes('so')) && (b.includes('số') || b.includes('so')) && !a.includes('scrambler') && !b.includes('scrambler')) return true;
  if ((a.includes('điện') || a.includes('dien')) && (b.includes('điện') || b.includes('dien'))) return true;
  if (a.includes('scrambler') && b.includes('scrambler')) return true;
  if (a.includes('underbone') && b.includes('underbone')) return true;
  return false;
}

import {
  type Customer,
  type Vehicle,
  type Part,
  type Order,
  type OrderStatus,
  type PaymentStatus,
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
  type WarrantyExtensionTransaction,
  type AdminWarrantyClaim,
  mockWarrantyExtensionTransactions,
  mockAdminWarrantyClaims,
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
export function cleanCustomerEmail(email?: string, username?: string): string {
  let val = (email || '').trim();
  if (!val) {
    const u = (username || '').trim();
    if (u.includes('@')) {
      val = u;
    } else if (u) {
      val = `${u}@gmail.com`;
    } else {
      val = 'khach@gmail.com';
    }
  }
  // Loại bỏ các trường hợp bị trùng đuôi dạng @gmail.com@gmail.com
  while (/@gmail\.com@gmail\.com/i.test(val)) {
    val = val.replace(/@gmail\.com@gmail\.com/gi, '@gmail.com');
  }
  return val;
}

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
              email: cleanCustomerEmail(item.email || customMatch?.email || mockMatch?.email, item.tenDangNhap),
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
      // Đọc thêm tài khoản khách hàng đang đăng nhập nếu có
      let curCust: Customer | null = null;
      try {
        const curRaw = localStorage.getItem('crm_current_customer');
        if (curRaw) curCust = JSON.parse(curRaw);
      } catch {}

      backendCustomers.forEach(c => {
        const existing = map.get(c.id);
        const matchCur = curCust && (curCust.id === c.id || curCust.soDienThoai === c.soDienThoai || curCust.email?.toLowerCase() === c.email?.toLowerCase());
        const bestAvatar = c.avatar || (matchCur ? curCust?.avatar : undefined) || existing?.avatar;
        if (existing) {
          map.set(c.id, {
            ...existing,
            ...c,
            avatar: bestAvatar || existing.avatar,
            trangThai: c.trangThai || existing.trangThai,
            tongChiTieu: Math.max(c.tongChiTieu || 0, existing.tongChiTieu || 0),
          });
        } else {
          map.set(c.id, { ...c, avatar: bestAvatar || c.avatar });
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
          avatar: data.avatar,
        }),
      });

      // KH01: Đồng bộ avatar và thông tin vào local caches và current customer
      try {
        const cached = localStorage.getItem('crm_custom_customers');
        let list: Customer[] = cached ? JSON.parse(cached) : [...mockCustomers];
        const matchIdx = list.findIndex(c => {
          const num = parseInt(c.id.replace(/\D/g, ''), 10);
          return num === maKhInt || (data.id && c.id === data.id) || (data.soDienThoai && c.soDienThoai === data.soDienThoai);
        });
        if (matchIdx !== -1) {
          list[matchIdx] = { ...list[matchIdx], ...data };
          localStorage.setItem('crm_custom_customers', JSON.stringify(list));
        }

        const curRaw = localStorage.getItem('crm_current_customer');
        if (curRaw) {
          const cur: Customer = JSON.parse(curRaw);
          const curNum = parseInt(cur.id.replace(/\D/g, ''), 10);
          if (curNum === maKhInt || (data.id && cur.id === data.id) || (data.soDienThoai && cur.soDienThoai === data.soDienThoai)) {
            const updatedCur = { ...cur, ...data };
            localStorage.setItem('crm_current_customer', JSON.stringify(updatedCur));
          }
        }
      } catch {}

      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'customer_updated' } }));
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
      matKhau: data.matKhau || 'Customer@123',
    };

    const existIdx = mockCustomers.findIndex(c => c.id === newCustomer.id || c.email === newCustomer.email);
    if (existIdx === -1) {
      mockCustomers.unshift(newCustomer);
    } else {
      mockCustomers[existIdx] = newCustomer;
    }

    try {
      const cached = localStorage.getItem('crm_custom_customers');
      let list: Customer[] = cached ? JSON.parse(cached) : [];
      const exIdx = list.findIndex(c => c.id === newCustomer.id || c.email === newCustomer.email || c.soDienThoai === newCustomer.soDienThoai);
      if (exIdx !== -1) list[exIdx] = newCustomer;
      else list.unshift(newCustomer);
      localStorage.setItem('crm_custom_customers', JSON.stringify(list));
    } catch {}

    addAdminNotification({
      type: 'customer_registered',
      title: '🎉 Khách hàng mới đăng ký',
      message: `${newCustomer.hoTen} (${newCustomer.soDienThoai}) vừa tạo tài khoản thành công qua cổng Khách hàng.`,
      linkPage: 'customers',
      meta: newCustomer,
    });

    return { success: true, customer: newCustomer, maKH: createdMaKH };
  },

  async deleteCustomer(maKhInt: number, extraInfo?: { phone?: string; email?: string }) {
    const cId = formatCustomerId(maKhInt);
    let custPhone = extraInfo?.phone || '';
    let custEmail = extraInfo?.email || '';

    // Lấy thông tin khách hàng trước khi xóa để dọn dẹp các liên kết giao dịch
    const foundCust = mockCustomers.find(c => c.id === cId || parseInt(c.id.replace(/\D/g, ''), 10) === maKhInt);
    if (foundCust) {
      if (!custPhone) custPhone = foundCust.soDienThoai;
      if (!custEmail) custEmail = foundCust.email;
    }
    try {
      const cached = localStorage.getItem('crm_custom_customers');
      if (cached) {
        const list: Customer[] = JSON.parse(cached);
        const match = list.find(c => c.id === cId || parseInt(c.id.replace(/\D/g, ''), 10) === maKhInt);
        if (match) {
          if (!custPhone) custPhone = match.soDienThoai;
          if (!custEmail) custEmail = match.email;
        }
      }
    } catch {}

    try {
      await fetchWithTimeout(`${API_BASE_URL}/KhachHang/${maKhInt}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('[customerApi.deleteCustomer] Backend call failed, applied locally:', err);
    }
    // Ghi nhận vào blacklist vĩnh viễn
    try {
      const delCustIds: string[] = JSON.parse(localStorage.getItem('crm_deleted_customer_ids') || '[]');
      if (!delCustIds.includes(cId)) delCustIds.push(cId);
      if (!delCustIds.includes(String(maKhInt))) delCustIds.push(String(maKhInt));
      localStorage.setItem('crm_deleted_customer_ids', JSON.stringify(delCustIds));

      if (custPhone) {
        const delPhones: string[] = JSON.parse(localStorage.getItem('crm_deleted_customer_phones') || '[]');
        if (!delPhones.includes(custPhone)) delPhones.push(custPhone);
        localStorage.setItem('crm_deleted_customer_phones', JSON.stringify(delPhones));
      }
    } catch {}

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

    // 3. Dọn dẹp xe liên quan trong crm_customer_vehicles & mockVehicles
    try {
      const cachedVeh = localStorage.getItem('crm_customer_vehicles');
      if (cachedVeh) {
        const list: Vehicle[] = JSON.parse(cachedVeh);
        const filtered = list.filter(v => v.customerId !== cId && parseInt(v.customerId.replace(/\D/g, ''), 10) !== maKhInt);
        localStorage.setItem('crm_customer_vehicles', JSON.stringify(filtered));
      }
    } catch {}
    for (let i = mockVehicles.length - 1; i >= 0; i--) {
      if (mockVehicles[i].customerId === cId || parseInt(mockVehicles[i].customerId.replace(/\D/g, ''), 10) === maKhInt) {
        mockVehicles.splice(i, 1);
      }
    }

    // 4. Dọn dẹp triệt để lịch sử đơn hàng (crm_orders_cache & mockOrders) của tài khoản bị xóa
    try {
      const cachedOrders = localStorage.getItem('crm_orders_cache');
      if (cachedOrders) {
        const list: Order[] = JSON.parse(cachedOrders);
        const filtered = list.filter(o => {
          const matchCustId = o.customerId === cId || parseInt(o.customerId.replace(/\D/g, ''), 10) === maKhInt;
          const matchPhone = custPhone && (o.soDienThoai === custPhone || ((o as any).soDienThoai && (o as any).soDienThoai.replace(/\D/g, '') === custPhone.replace(/\D/g, '')));
          return !matchCustId && !matchPhone;
        });
        localStorage.setItem('crm_orders_cache', JSON.stringify(filtered));
      }
    } catch {}
    for (let i = mockOrders.length - 1; i >= 0; i--) {
      const o = mockOrders[i];
      if (o.customerId === cId || parseInt(o.customerId.replace(/\D/g, ''), 10) === maKhInt || (custPhone && o.soDienThoai === custPhone)) {
        mockOrders.splice(i, 1);
      }
    }

    // 5. Dọn dẹp triệt để lịch hẹn (crm_appointments_cache & mockAppointments) của tài khoản bị xóa
    const deletedApptIdsToAdd: string[] = [];
    try {
      const cachedAppts = localStorage.getItem('crm_appointments_cache');
      if (cachedAppts) {
        const list: Appointment[] = JSON.parse(cachedAppts);
        const filtered = list.filter(a => {
          const matchCustId = a.customerId === cId || parseInt(a.customerId.replace(/\D/g, ''), 10) === maKhInt;
          const matchPhone = custPhone && (a.soDienThoai === custPhone || (a.soDienThoai && a.soDienThoai.replace(/\D/g, '') === custPhone.replace(/\D/g, '')));
          if (matchCustId || matchPhone) {
            deletedApptIdsToAdd.push(a.id);
            return false;
          }
          return true;
        });
        localStorage.setItem('crm_appointments_cache', JSON.stringify(filtered));
      }
    } catch {}
    for (let i = mockAppointments.length - 1; i >= 0; i--) {
      const a = mockAppointments[i];
      const matchCustId = a.customerId === cId || parseInt(a.customerId.replace(/\D/g, ''), 10) === maKhInt;
      const matchPhone = custPhone && (a.soDienThoai === custPhone || (a.soDienThoai && a.soDienThoai.replace(/\D/g, '') === custPhone.replace(/\D/g, '')));
      if (matchCustId || matchPhone) {
        deletedApptIdsToAdd.push(a.id);
        mockAppointments.splice(i, 1);
      }
    }
    try {
      const storedDelAppts: string[] = JSON.parse(localStorage.getItem('crm_deleted_appointment_ids') || '[]');
      deletedApptIdsToAdd.forEach(id => {
        if (!storedDelAppts.includes(id)) storedDelAppts.push(id);
      });
      localStorage.setItem('crm_deleted_appointment_ids', JSON.stringify(storedDelAppts));
    } catch {}

    // 6. Xóa thông báo và phiên đăng nhập của tài khoản
    try {
      localStorage.removeItem(`crm_customer_notifs_${cId}`);
      if (custPhone) localStorage.removeItem(`crm_customer_notifs_${custPhone}`);
      const cur = localStorage.getItem('crm_current_customer');
      if (cur) {
        const parsed = JSON.parse(cur);
        if (parsed.id === cId || parseInt(parsed.id.replace(/\D/g, ''), 10) === maKhInt || (custPhone && parsed.soDienThoai === custPhone)) {
          localStorage.removeItem('crm_current_customer');
        }
      }
    } catch {}

    // 7. Dọn dẹp triệt để phản hồi/đánh giá (crm_feedbacks_cache & mockFeedbacks) của tài khoản bị xóa
    try {
      const cachedFb = localStorage.getItem('crm_feedbacks_cache');
      if (cachedFb) {
        const list: Feedback[] = JSON.parse(cachedFb);
        const filtered = list.filter(f => {
          const matchCustId = f.customerId === cId || parseInt(f.customerId.replace(/\D/g, ''), 10) === maKhInt;
          const matchPhone = custPhone && (f.soDienThoai === custPhone || (f.soDienThoai && f.soDienThoai.replace(/\D/g, '') === custPhone.replace(/\D/g, '')));
          const matchEmail = custEmail && f.email && f.email.toLowerCase().trim() === custEmail.toLowerCase().trim();
          return !matchCustId && !matchPhone && !matchEmail;
        });
        localStorage.setItem('crm_feedbacks_cache', JSON.stringify(filtered));
      }
    } catch {}
    for (let i = mockFeedbacks.length - 1; i >= 0; i--) {
      const f = mockFeedbacks[i];
      const matchCustId = f.customerId === cId || parseInt(f.customerId.replace(/\D/g, ''), 10) === maKhInt;
      const matchPhone = custPhone && (f.soDienThoai === custPhone || (f.soDienThoai && f.soDienThoai.replace(/\D/g, '') === custPhone.replace(/\D/g, '')));
      const matchEmail = custEmail && f.email && f.email.toLowerCase().trim() === custEmail.toLowerCase().trim();
      if (matchCustId || matchPhone || matchEmail) {
        mockFeedbacks.splice(i, 1);
      }
    }

    // 8. Dọn dẹp triệt để kết quả khảo sát (crm_survey_responses & mockSurveyResponses) của tài khoản bị xóa
    try {
      const cachedResp = localStorage.getItem('crm_survey_responses');
      if (cachedResp) {
        const list: SurveyResponse[] = JSON.parse(cachedResp);
        const filtered = list.filter(r => {
          const matchCustId = r.customerId === cId || parseInt(r.customerId.replace(/\D/g, ''), 10) === maKhInt;
          const matchPhone = custPhone && (r.soDienThoai === custPhone || (r.soDienThoai && r.soDienThoai.replace(/\D/g, '') === custPhone.replace(/\D/g, '')));
          return !matchCustId && !matchPhone;
        });
        localStorage.setItem('crm_survey_responses', JSON.stringify(filtered));
      }
    } catch {}
    for (let i = mockSurveyResponses.length - 1; i >= 0; i--) {
      const r = mockSurveyResponses[i];
      const matchCustId = r.customerId === cId || parseInt(r.customerId.replace(/\D/g, ''), 10) === maKhInt;
      const matchPhone = custPhone && (r.soDienThoai === custPhone || (r.soDienThoai && r.soDienThoai.replace(/\D/g, '') === custPhone.replace(/\D/g, '')));
      if (matchCustId || matchPhone) {
        mockSurveyResponses.splice(i, 1);
      }
    }

    // 9. Dọn dẹp khảo sát nhắm riêng cho khách hàng này (crm_surveys & mockSurveys)
    try {
      const cachedSurveys = localStorage.getItem('crm_surveys');
      if (cachedSurveys) {
        const list: Survey[] = JSON.parse(cachedSurveys);
        const filtered = list.filter(s => s.targetCustomerId !== cId && parseInt((s.targetCustomerId || '').replace(/\D/g, ''), 10) !== maKhInt);
        localStorage.setItem('crm_surveys', JSON.stringify(filtered));
      }
    } catch {}
    for (let i = mockSurveys.length - 1; i >= 0; i--) {
      const s = mockSurveys[i];
      if (s.targetCustomerId === cId || parseInt((s.targetCustomerId || '').replace(/\D/g, ''), 10) === maKhInt) {
        mockSurveys.splice(i, 1);
      }
    }

    // 10. Dọn dẹp hợp đồng bảo hiểm (crm_insurance_contracts & mockInsuranceContracts) của tài khoản bị xóa
    try {
      const cachedIns = localStorage.getItem('crm_insurance_contracts');
      if (cachedIns) {
        const list: InsuranceContract[] = JSON.parse(cachedIns);
        const filtered = list.filter(ins => {
          const matchCustId = ins.customerId === cId || parseInt(ins.customerId.replace(/\D/g, ''), 10) === maKhInt;
          const matchPhone = custPhone && (ins.soDienThoai === custPhone || (ins.soDienThoai && ins.soDienThoai.replace(/\D/g, '') === custPhone.replace(/\D/g, '')));
          return !matchCustId && !matchPhone;
        });
        localStorage.setItem('crm_insurance_contracts', JSON.stringify(filtered));
      }
    } catch {}
    for (let i = mockInsuranceContracts.length - 1; i >= 0; i--) {
      const ins = mockInsuranceContracts[i];
      const matchCustId = ins.customerId === cId || parseInt(ins.customerId.replace(/\D/g, ''), 10) === maKhInt;
      const matchPhone = custPhone && (ins.soDienThoai === custPhone || (ins.soDienThoai && ins.soDienThoai.replace(/\D/g, '') === custPhone.replace(/\D/g, '')));
      if (matchCustId || matchPhone) {
        mockInsuranceContracts.splice(i, 1);
      }
    }

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'customer_deleted', customerId: cId } }));
    window.dispatchEvent(new CustomEvent('crm-customer-notifications-updated'));
    window.dispatchEvent(new CustomEvent('crm-vehicles-updated'));
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
        email: cleanCustomerEmail(raw.email || mockMatch?.email, raw.tenDangNhap),
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
              bienSo: (!item.bienSoXe || item.bienSoXe === 'Chưa có biển số' || item.bienSoXe.includes('Chưa có') || item.bienSoXe.includes('Chua co') || item.bienSoXe.startsWith('TAM-') || item.bienSoXe.startsWith('T?M-')) ? 'Chưa có biển số' : item.bienSoXe,
              hangXe: item.hangXe || (item.tenXe && item.tenXe.includes('Suzuki') ? 'Suzuki' : item.tenXe && item.tenXe.includes('Yamaha') ? 'Yamaha' : item.tenXe && item.tenXe.includes('SYM') ? 'SYM' : 'Honda'),
              namSanXuat: item.ngayMua ? new Date(item.ngayMua).getFullYear() : 2025,
              hanBaoHanh: hanBH,
              mauSac: item.mauSac || 'Tiêu chuẩn',
              hinhAnh: item.hinhAnh || undefined,
              trangThaiBaoHanh: isConHan ? 'ConHan' : 'HetHan',
              soKhung: item.soKhung || '',
              soMay: item.soMay || '',
              nguonGoc: 'CuaHang' as const,
              ngayMua: item.ngayMua ? item.ngayMua.split('T')[0] : new Date().toISOString().split('T')[0],
              trangThaiDuyetBienSo: (!item.bienSoXe || item.bienSoXe === 'Chưa có biển số' || item.bienSoXe.includes('Chưa có') || item.bienSoXe.includes('Chua co') || item.bienSoXe.startsWith('TAM-') || item.bienSoXe.startsWith('T?M-')) ? ('ChoCapNhat' as const) : ('DaDuyet' as const),
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
      if (cached) {
        cachedVehicles = JSON.parse(cached);
        // Tự động dọn dẹp xe mẫu lái thử bị lưu nhầm vào cache
        const cleaned = cachedVehicles.filter(v => {
          const plate = (v.bienSo || v.bienSoChoDuyet || '').toUpperCase();
          const name = (v.tenXe || '').toUpperCase();
          return !plate.includes('LÁI-THỬ') && !plate.includes('LAI-THU') && !plate.includes('XE-LÁI') && !name.includes('LÁI THỬ') && !name.includes('LAI THU');
        });
        if (cleaned.length !== cachedVehicles.length) {
          localStorage.setItem('crm_customer_vehicles', JSON.stringify(cleaned));
          cachedVehicles = cleaned;
        }
      }
    } catch {}

    const vMap = new Map<string, Vehicle>();
    mockVehicles.forEach(v => vMap.set(v.id, v));
    list.forEach(v => vMap.set(v.id, { ...vMap.get(v.id), ...v }));
    cachedVehicles.forEach(v => vMap.set(v.id, { ...vMap.get(v.id), ...v }));

    const rawList = Array.from(vMap.values()).filter(v => {
      const plate = (v.bienSo || v.bienSoChoDuyet || '').toUpperCase();
      const name = (v.tenXe || '').toUpperCase();
      return !plate.includes('LÁI-THỬ') && !plate.includes('LAI-THU') && !plate.includes('XE-LÁI') && !name.includes('LÁI THỬ') && !name.includes('LAI THU');
    });

    // Lọc sạch trùng lặp phương tiện của khách hàng (Deduplication)
    const seenCustVeh = new Set<string>();
    const cleanedResult: Vehicle[] = [];
    for (const v of rawList) {
      const plate = (v.bienSo || v.bienSoChoDuyet || '').toUpperCase().trim();
      const name = (v.tenXe || '').toUpperCase().trim();
      const color = (v.mauSac || '').toUpperCase().trim();
      const vin = (v.soKhung || '').toUpperCase().trim();
      const dedupKey = vin
        ? `VIN_${vin}`
        : (plate && plate !== 'CHƯA CÓ BIỂN SỐ' && !plate.includes('CHUA CO'))
        ? `PLATE_${plate}`
        : `CUST_${v.customerId}_${name}_${color}`;
      if (seenCustVeh.has(dedupKey)) {
        // Hợp nhất dữ liệu biển số đề xuất và ảnh cà vẹt nếu vehicle hiện tại có thông tin
        const existing = cleanedResult.find(ev => {
          const eVin = (ev.soKhung || '').toUpperCase().trim();
          const ePlate = (ev.bienSo || ev.bienSoChoDuyet || '').toUpperCase().trim();
          const eName = (ev.tenXe || '').toUpperCase().trim();
          const eColor = (ev.mauSac || '').toUpperCase().trim();
          const eKey = eVin
            ? `VIN_${eVin}`
            : (ePlate && ePlate !== 'CHƯA CÓ BIỂN SỐ' && !ePlate.includes('CHUA CO'))
            ? `PLATE_${ePlate}`
            : `CUST_${ev.customerId}_${eName}_${eColor}`;
          return eKey === dedupKey;
        });
        if (existing) {
          if (v.bienSoChoDuyet && !existing.bienSoChoDuyet) existing.bienSoChoDuyet = v.bienSoChoDuyet;
          if (v.anhCaVet && !existing.anhCaVet) existing.anhCaVet = v.anhCaVet;
          if (v.trangThaiDuyetBienSo === 'ChoDuyet') existing.trangThaiDuyetBienSo = 'ChoDuyet';
          if (v.lyDoTuChoiBienSo && !existing.lyDoTuChoiBienSo) existing.lyDoTuChoiBienSo = v.lyDoTuChoiBienSo;
        }
        continue;
      }
      seenCustVeh.add(dedupKey);
      cleanedResult.push(v);
    }
    try {
      localStorage.setItem('crm_customer_vehicles', JSON.stringify(cleanedResult));
    } catch {}
    return cleanedResult;
  },

  async registerVehicle(data: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const plateUpper = (data.bienSo || '').toUpperCase();
    if (plateUpper.includes('LÁI-THỬ') || plateUpper.includes('LAI-THU') || plateUpper.includes('XE-LÁI')) {
      console.warn('[vehicleApi.registerVehicle] Blocked registering test drive vehicle as owned vehicle');
      return { ...data, id: 'XE_TEST_DRIVE' } as Vehicle;
    }

    let newId = `XE${Date.now().toString().slice(-4)}`;

    // Đối với xe do khách hàng đăng ký trên web: mặc định là "xe mua ngoài hệ thống", không áp dụng bảo hành cửa hàng
    const newVehicle: Vehicle = {
      ...data,
      id: newId,
      hinhAnh: data.hinhAnh || data.anhCaVet || '',
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
          soMay: data.soMay || '',
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
    hinhAnh?: string;
  }): Promise<Vehicle> {
    let newId = `XE${Date.now().toString().slice(-4)}`;
    const hanBH = data.hanBaoHanh || new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const isChuaCoBienSo = !data.bienSo || data.bienSo.trim() === '' || data.bienSo.includes('Chưa có');
    const plate = isChuaCoBienSo ? 'Chưa có biển số' : data.bienSo!;
    
    // Tự động lấy ảnh chính xác từ catalog nếu không truyền ảnh
    let resolvedImg = data.hinhAnh || '';
    if (!resolvedImg) {
      try {
        const cachedCat = localStorage.getItem('crm_catalog_vehicles');
        const catList: any[] = cachedCat ? JSON.parse(cachedCat) : (DEFAULT_CATALOG_VEHICLES || []);
        const cleanName = (data.tenXe || '').toLowerCase().trim();
        const found = catList.find(c => {
          const cName = (c.tenXe || '').toLowerCase().trim();
          return cleanName && cName && (cleanName.includes(cName) || cName.includes(cleanName));
        });
        if (found?.hinhAnh) resolvedImg = found.hinhAnh;
      } catch {}
    }

    const newVehicle: Vehicle = {
      id: newId,
      customerId: data.customerId,
      tenXe: data.tenXe,
      bienSo: plate,
      hinhAnh: resolvedImg || undefined,
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
          tenXe: data.tenXe,
          hangXe: data.hangXe || (data.tenXe?.includes('SYM') ? 'SYM' : data.tenXe?.includes('Yamaha') ? 'Yamaha' : data.tenXe?.includes('Suzuki') ? 'Suzuki' : 'Honda'),
          mauSac: data.mauSac || 'Tiêu chuẩn',
          hinhAnh: resolvedImg || data.hinhAnh || '',
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
      const existingIdx = list.findIndex(v => {
        if (v.id === newVehicle.id) return true;
        if (data.soKhung && v.soKhung && v.soKhung.trim().toUpperCase() === data.soKhung.trim().toUpperCase()) return true;
        if (plate !== 'Chưa có biển số' && v.bienSo === plate) return true;
        if (v.customerId === newVehicle.customerId && v.tenXe === newVehicle.tenXe && (v.bienSo === 'Chưa có biển số' || !v.bienSo)) {
          return true;
        }
        return false;
      });
      if (existingIdx !== -1) {
        list[existingIdx] = { ...list[existingIdx], ...newVehicle, id: list[existingIdx].id };
      } else {
        list.unshift(newVehicle);
      }
      localStorage.setItem('crm_customer_vehicles', JSON.stringify(list));
    } catch {}

    const mockIdx = mockVehicles.findIndex(v => {
      if (v.id === newVehicle.id) return true;
      if (data.soKhung && v.soKhung && v.soKhung.trim().toUpperCase() === data.soKhung.trim().toUpperCase()) return true;
      if (plate !== 'Chưa có biển số' && v.bienSo === plate) return true;
      if (v.customerId === newVehicle.customerId && v.tenXe === newVehicle.tenXe && (v.bienSo === 'Chưa có biển số' || !v.bienSo)) {
        return true;
      }
      return false;
    });
    if (mockIdx !== -1) {
      mockVehicles[mockIdx] = { ...mockVehicles[mockIdx], ...newVehicle, id: mockVehicles[mockIdx].id };
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
        linkPage: 'license-plates',
        meta: { vehicleId, id: vehicleId, plate: bienSo },
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
    const numId = parseInt(vehicleId.replace(/\D/g, ''), 10);

    const findVeh = (arr: Vehicle[]): Vehicle | undefined => {
      return arr.find(v =>
        v.id === vehicleId ||
        (!isNaN(numId) && numId > 0 && parseInt(v.id.replace(/\D/g, ''), 10) === numId)
      );
    };

    // Lấy biển số dự kiến từ cache hoặc mockVehicles
    let candidatePlate = '';
    try {
      const cached = localStorage.getItem('crm_customer_vehicles');
      if (cached) {
        const list: Vehicle[] = JSON.parse(cached);
        const match = findVeh(list);
        if (match) {
          candidatePlate = match.bienSoChoDuyet || (match.bienSo !== 'Chưa có biển số' ? match.bienSo : '') || '';
          vehicleName = match.tenXe;
          custId = match.customerId;
        }
      }
    } catch {}

    if (!candidatePlate) {
      const vMatch = findVeh(mockVehicles);
      if (vMatch) {
        candidatePlate = vMatch.bienSoChoDuyet || (vMatch.bienSo !== 'Chưa có biển số' ? vMatch.bienSo : '') || '';
        vehicleName = vMatch.tenXe;
        custId = vMatch.customerId;
      }
    }

    finalPlate = candidatePlate;

    // Đồng bộ và kiểm tra tính duy nhất trên Backend C# SQL Server
    if (!isNaN(numId) && numId > 0 && finalPlate && finalPlate !== 'Chưa có biển số') {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/XeKhachHang/duyet-bien-so/${numId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bienSoXe: finalPlate }),
        });
        if (res.status === 400) {
          const errData = await res.json().catch(() => ({}));
          console.warn('[approveLicensePlate] Backend returned 400:', errData.message);
        }
      } catch (beErr: any) {
        console.warn('[approveLicensePlate] Backend sync warning:', beErr);
      }
    }

    try {
      const cached = localStorage.getItem('crm_customer_vehicles');
      if (cached) {
        const list: Vehicle[] = JSON.parse(cached);
        const match = findVeh(list);
        if (match) {
          if (finalPlate) {
            match.bienSo = finalPlate;
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

    const vMatch = findVeh(mockVehicles);
    if (vMatch) {
      if (finalPlate) {
        vMatch.bienSo = finalPlate;
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

    // Tự động đồng bộ biển số sang hợp đồng bảo hiểm kèm theo (nếu có)
    try {
      let allIns: InsuranceContract[] = [];
      const cachedIns = localStorage.getItem(INSURANCE_STORAGE_KEY);
      if (cachedIns) {
        allIns = JSON.parse(cachedIns);
      } else {
        allIns = await insuranceApi.getAll();
      }
      let insChanged = false;
      allIns.forEach(ins => {
        const matchVeh = ins.vehicleId === vehicleId || (!isNaN(numId) && numId > 0 && parseInt((ins.vehicleId || '').replace(/\D/g, ''), 10) === numId);
        const matchCust = ins.customerId === custId || (custId && parseInt(ins.customerId.replace(/\D/g, ''), 10) === parseInt(custId.replace(/\D/g, ''), 10));
        if ((matchVeh || matchCust) && (!ins.bienSo || ins.bienSo === 'Chưa có biển số' || ins.bienSo.includes('Chưa có'))) {
          ins.bienSo = finalPlate;
          insChanged = true;
        }
      });
      if (insChanged) {
        localStorage.setItem(INSURANCE_STORAGE_KEY, JSON.stringify(allIns));
        window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'insurance_contracts' } }));
      }
    } catch (insErr) {
      console.warn('[approveLicensePlate] Insurance sync warning:', insErr);
    }

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'license_plate_approved', vehicleId } }));
    return true;
  },

  async rejectLicensePlate(vehicleId: string, lyDo: string, vehicleData?: Partial<Vehicle>): Promise<boolean> {
    let vehicleName = vehicleData?.tenXe || '';
    let custId = vehicleData?.customerId || '';
    let proposedPlate = vehicleData?.bienSoChoDuyet || vehicleData?.bienSo || '';

    try {
      const cached = localStorage.getItem('crm_customer_vehicles');
      let list: Vehicle[] = cached ? JSON.parse(cached) : [];
      const match = list.find(v => v.id === vehicleId);
      if (match) {
        match.trangThaiDuyetBienSo = 'TuChoi';
        match.lyDoTuChoiBienSo = lyDo;
        if (!vehicleName) vehicleName = match.tenXe;
        if (!custId) custId = match.customerId;
        if (!proposedPlate) proposedPlate = match.bienSoChoDuyet || match.bienSo || '';
      } else if (vehicleData) {
        list.push({
          ...(vehicleData as Vehicle),
          id: vehicleId,
          trangThaiDuyetBienSo: 'TuChoi',
          lyDoTuChoiBienSo: lyDo,
        });
      }
      localStorage.setItem('crm_customer_vehicles', JSON.stringify(list));
    } catch {}

    const vMatch = mockVehicles.find(v => v.id === vehicleId);
    if (vMatch) {
      vMatch.trangThaiDuyetBienSo = 'TuChoi';
      vMatch.lyDoTuChoiBienSo = lyDo;
      if (!vehicleName) vehicleName = vMatch.tenXe;
      if (!custId) custId = vMatch.customerId;
      if (!proposedPlate) proposedPlate = vMatch.bienSoChoDuyet || vMatch.bienSo || '';
    }

    if (custId) {
      addCustomerNotification({
        customerId: custId,
        icon: '⛔',
        title: '⛔ Biển số xe bị từ chối duyệt',
        message: `Yêu cầu duyệt biển số ${proposedPlate ? '"' + proposedPlate + '" ' : ''}cho xe ${vehicleName || 'của bạn'} đã bị từ chối. Lý do: "${lyDo}". Vui lòng cập nhật lại biển số hoặc tải lại ảnh Cà vẹt hợp lệ.`,
        category: 'order',
        page: 'dashboard',
        tab: 'vehicles',
        targetId: vehicleId,
      });
    }

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'license_plate_rejected', vehicleId } }));
    window.dispatchEvent(new CustomEvent('crm-vehicles-updated'));
    return true;
  },

  async approveVehicle(id: string, vehicleData?: Partial<Vehicle>): Promise<boolean> {
    let approvedVehicle: Vehicle | null = (vehicleData as Vehicle) || null;
    let custId = vehicleData?.customerId || '';
    let vehicleName = vehicleData?.tenXe || '';
    let plate = vehicleData?.bienSo || '';

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
          if (!custId) custId = match.customerId;
          if (!vehicleName) vehicleName = match.tenXe;
          if (!plate) plate = match.bienSo || match.bienSoChoDuyet || '';
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
      if (!custId) custId = vMatch.customerId;
      if (!vehicleName) vehicleName = vMatch.tenXe;
      if (!plate) plate = vMatch.bienSo || vMatch.bienSoChoDuyet || '';
      const cust = mockCustomers.find(c => c.id === vMatch.customerId);
      if (cust && !cust.soXe) {
        cust.soXe = vMatch.id;
      }
    }

    try {
      if (custId) {
        const cachedCusts = localStorage.getItem('crm_custom_customers');
        if (cachedCusts) {
          const cList: Customer[] = JSON.parse(cachedCusts);
          const cMatch = cList.find(c => c.id === custId);
          if (cMatch && !cMatch.soXe) {
            cMatch.soXe = id;
            localStorage.setItem('crm_custom_customers', JSON.stringify(cList));
          }
        }
      }
    } catch {}

    // Bắn thông báo phê duyệt xe thành công tới khách hàng
    if (custId) {
      addCustomerNotification({
        customerId: custId,
        icon: '🏍️',
        title: '🏍️ Phương tiện & Cà vẹt đã được đại lý phê duyệt',
        message: `Xe ${vehicleName || 'của bạn'}${plate ? ` (${plate})` : ''} đã được showroom kiểm tra giấy tờ cà vẹt, duyệt thành công và gắn chính thức vào tài khoản của bạn.`,
        category: 'order',
        page: 'dashboard',
        tab: 'vehicles',
        targetId: id,
      });
    }

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_approved', vehicleId: id } }));
    window.dispatchEvent(new CustomEvent('crm-customer-notifications-updated', { detail: { customerId: custId } }));
    window.dispatchEvent(new CustomEvent('crm-vehicles-updated'));
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
          // Tu dong nang cap anh sang noi bo neu dang dung Unsplash
          let hasMigration = false;
          const updated = parsed.map(p => {
            if (p.hinhAnh && p.hinhAnh.includes('unsplash.com')) {
              const mockMatch = mockParts.find(m => m.id === p.id);
              if (mockMatch) {
                hasMigration = true;
                return { ...p, hinhAnh: mockMatch.hinhAnh };
              }
            }
            return p;
          });
          if (hasMigration) {
            localStorage.setItem(PARTS_STORAGE_KEY, JSON.stringify(updated));
            return updated;
          }
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
          // Lấy danh sách cache hiện tại để đối chiếu nhận diện đơn xe
          let currentCached: Order[] = [];
          try {
            const rawCached = localStorage.getItem('crm_orders_cache');
            if (rawCached) currentCached = JSON.parse(rawCached);
          } catch {}

          list = data.map((item: any, idx: number) => {
            const numId = item.maDon;
            // Đối chiếu tìm đơn hàng tương ứng trong cache hoặc mockOrders (chính xác theo mã đơn số numId)
            const matchedExisting = currentCached.find(m =>
              m.id === `DH-XE-${numId < 10 ? `00${numId}` : `0${numId}`}` ||
              m.id === `DH-XE-${numId}` ||
              m.id === `DH00${numId}` ||
              m.id === `DH0${numId}` ||
              m.id === `DH${numId}` ||
              parseInt(m.id.replace(/\D/g, ''), 10) === numId
            ) || mockOrders.find(m =>
              m.id === `DH-XE-${numId < 10 ? `00${numId}` : `0${numId}`}` ||
              parseInt(m.id.replace(/\D/g, ''), 10) === numId
            );

            const isVehicleOrder = matchedExisting?.loaiDon === 'Xe' || !!matchedExisting?.thongTinXe || (matchedExisting?.id && matchedExisting.id.includes('XE'));
            const id = isVehicleOrder
              ? `DH-XE-${numId < 10 ? `00${numId}` : `0${numId}`}`
              : (numId ? (numId < 10 ? `DH00${numId}` : `DH0${numId}`) : (matchedExisting?.id || `DH${idx + 1}`));
            const cId = item.maKH ? (item.maKH < 10 ? `KH00${item.maKH}` : `KH0${item.maKH}`) : (matchedExisting?.customerId || 'KH001');

            let tt: OrderStatus = 'ChoDuyet';
            if (item.trangThai === 'Hoàn thành' || item.trangThai === 'HoanThanh' || item.trangThai === 'Đã giao' || item.trangThai === 'DaGiao') tt = 'HoanThanh';
            else if (item.trangThai === 'Đang giao' || item.trangThai === 'DangGiao') tt = 'DangGiao';
            else if (item.trangThai === 'Đã hủy' || item.trangThai === 'DaHuy') tt = 'DaHuy';
            else if (item.trangThai === 'Chờ giao xe' || item.trangThai === 'ChoGiaoXe') tt = 'ChoGiaoXe';
            else if (item.trangThai === 'Chờ khách xác nhận ngày đặt xe' || item.trangThai === 'ChoKhachXacNhanNgayNhan' || item.trangThai?.includes('xác nhận ngày')) tt = 'ChoKhachXacNhanNgayNhan';
            else if (item.trangThai === 'Đã xác nhận' || item.trangThai === 'DaXacNhan') tt = 'DaXacNhan';
            else if (item.trangThai === 'Chờ duyệt' || item.trangThai === 'ChoDuyet' || item.trangThai === 'Chờ xác nhận') tt = 'ChoDuyet';
            else if (matchedExisting?.trangThai) tt = matchedExisting.trangThai;

            // Nếu trong cache đã được Admin xác nhận (DaXacNhan, ChoKhachXacNhanNgayNhan, ChoGiaoXe, DangGiao, HoanThanh) mà backend chưa kịp cập nhật, ưu tiên giữ trạng thái mới từ cache
            if (matchedExisting?.trangThai && matchedExisting.trangThai !== 'ChoDuyet' && tt === 'ChoDuyet') {
              tt = matchedExisting.trangThai;
            }

            let paymentStatus: PaymentStatus = 'ChuaThanhToan';
            const rawPayment = item.trangThaiThanhToan || matchedExisting?.trangThaiThanhToan;
            if (rawPayment === 'DaThanhToan' || rawPayment === 'Đã thanh toán') paymentStatus = 'DaThanhToan';
            else if (rawPayment === 'DaCoc' || rawPayment === 'Đã đặt cọc') paymentStatus = 'DaCoc';
            else if (tt === 'HoanThanh') paymentStatus = 'DaThanhToan';
            else if (matchedExisting?.trangThaiThanhToan) paymentStatus = matchedExisting.trangThaiThanhToan;

            return {
              id,
              customerId: cId,
              hoTenKH: item.tenKhachHang || matchedExisting?.hoTenKH || 'Khách hàng',
              soDienThoai: item.soDienThoai || matchedExisting?.soDienThoai,
              email: matchedExisting?.email,
              ngayDat: item.ngayDat ? item.ngayDat.split('T')[0] : (matchedExisting?.ngayDat || '2026-10-20'),
              trangThai: tt,
              trangThaiThanhToan: paymentStatus,
              kenhBan: matchedExisting?.kenhBan || 'Online',
              loaiDon: matchedExisting?.loaiDon || (matchedExisting?.thongTinXe ? 'Xe' : 'PhuTung'),
              tongTien: item.tongTien || matchedExisting?.tongTien || 0,
              diaChiGiao: matchedExisting?.diaChiGiao || '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
              items: (item.chiTiet && item.chiTiet.length > 0)
                ? item.chiTiet.map((ct: any) => ({
                    maPhuTung: ct.maPhuTung,
                    tenSanPham: ct.tenPhuTung || 'Phụ tùng chính hãng',
                    soLuong: ct.soLuong || 1,
                    donGia: ct.donGia || 0,
                  }))
                : (matchedExisting?.items && matchedExisting.items.length > 0
                    ? matchedExisting.items
                    : [{ tenSanPham: 'Phụ tùng chính hãng', soLuong: 1, donGia: item.tongTien || 0 }]),
              maNV: matchedExisting?.maNV,
              tenNV: matchedExisting?.tenNV,
              phuongThucThanhToan: item.phuongThucThanhToan || matchedExisting?.phuongThucThanhToan || 'TienMat',
              thongTinXe: matchedExisting?.thongTinXe,
              ghiChu: matchedExisting?.ghiChu,
              maLichHen: matchedExisting?.maLichHen,
              qrCodeUrl: matchedExisting?.qrCodeUrl,
              lyDoHuy: matchedExisting?.lyDoHuy,
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
    list.forEach(o => {
      const existingInCache = combinedMap.get(o.id);
      const isVehicleOrder = o.loaiDon === 'Xe' || !!o.thongTinXe || (o.id && o.id.includes('XE'));

      // BẢO VỆ TIẾN TRÌNH: Trạng thái từ Backend database là nguồn sự thật (Source of Truth)
      let finalTT = o.trangThai;
      if (!isVehicleOrder && existingInCache?.trangThai && existingInCache.trangThai !== 'ChoDuyet' && finalTT === 'ChoDuyet') {
        finalTT = existingInCache.trangThai;
      }

      // Bảo vệ trạng thái thanh toán chuẩn xác
      let finalPayment: PaymentStatus = o.trangThaiThanhToan || 'ChuaThanhToan';
      if (finalTT === 'HoanThanh') {
        finalPayment = 'DaThanhToan';
      } else if (o.trangThaiThanhToan === 'DaCoc' || existingInCache?.trangThaiThanhToan === 'DaCoc') {
        finalPayment = 'DaCoc';
      } else if (existingInCache?.trangThaiThanhToan === 'DaThanhToan' && (o.tongTien > 0 && !o.thongTinXe?.soTienConLai)) {
        finalPayment = 'DaThanhToan';
      } else if (existingInCache?.trangThaiThanhToan && existingInCache.trangThaiThanhToan !== 'DaThanhToan') {
        finalPayment = existingInCache.trangThaiThanhToan;
      }
      combinedMap.set(o.id, { ...existingInCache, ...o, trangThai: finalTT, trangThaiThanhToan: finalPayment });
    });

    let merged = Array.from(combinedMap.values());

    // Chống trùng lặp tuyệt đối theo id
    const finalOrderMap = new Map<string, Order>();
    merged.forEach(o => {
      if (!finalOrderMap.has(o.id)) {
        finalOrderMap.set(o.id, o);
      } else {
        const prev = finalOrderMap.get(o.id)!;
        finalOrderMap.set(o.id, {
          ...prev,
          ...o,
          trangThai: (o.trangThai === 'DaHuy' || prev.trangThai === 'DaHuy') ? 'DaHuy' : o.trangThai,
          lyDoHuy: o.lyDoHuy || prev.lyDoHuy,
        });
      }
    });
    // Dọn dẹp đơn trùng lặp xe DH-XE-025 và DH-XE-026 (giữ đơn hoàn thành DH-XE-026)
    if (finalOrderMap.has('DH-XE-025') && finalOrderMap.has('DH-XE-026')) {
      finalOrderMap.delete('DH-XE-025');
    }
    merged = Array.from(finalOrderMap.values());

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

  getAllSync(): Order[] {
    let cachedList: Order[] = [];
    try {
      const cached = localStorage.getItem('crm_orders_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) cachedList = parsed;
      }
    } catch {}
    const combinedMap = new Map<string, Order>();
    mockOrders.forEach(o => combinedMap.set(o.id, { ...o }));
    cachedList.forEach(o => combinedMap.set(o.id, { ...combinedMap.get(o.id), ...o }));
    return Array.from(combinedMap.values());
  },

  async updateStatus(orderIdOrNum: string | number, trangThai: OrderStatus | string) {
    const orderIdStr = String(orderIdOrNum);
    const numId = parseInt(orderIdStr.replace(/\D/g, ''), 10);

    // BẮT BUỘC: Nếu đơn hàng đã bị hủy, khóa vĩnh viễn không cho phép thay đổi trạng thái nữa
    const currentOrder = mockOrders.find(o => o.id === orderIdStr);
    if (currentOrder && currentOrder.trangThai === 'DaHuy') {
      console.warn(`[orderApi.updateStatus] Đơn hàng #${orderIdStr} đã ở trạng thái ĐÃ HỦY. Bắt buộc giữ nguyên trạng thái Đã hủy, không thể thay đổi.`);
      return;
    }

    let statusKey: OrderStatus = 'ChoDuyet';
    let statusText = 'Chờ xác nhận';
    if (trangThai === 'HoanThanh' || trangThai === 'Hoàn thành' || trangThai === 'DaGiao' || trangThai === 'Đã giao') {
      statusKey = 'HoanThanh'; statusText = 'Hoàn thành';
    } else if (trangThai === 'DangGiao' || trangThai === 'Đang giao') {
      statusKey = 'DangGiao'; statusText = 'Đang giao';
    } else if (trangThai === 'DaXacNhan' || trangThai === 'Đã xác nhận') {
      statusKey = 'DaXacNhan'; statusText = 'Đã xác nhận';
    } else if (trangThai === 'ChoGiaoXe' || trangThai === 'Chờ giao xe') {
      statusKey = 'ChoGiaoXe'; statusText = 'Chờ giao xe';
    } else if (trangThai === 'ChoKhachXacNhanNgayNhan' || trangThai === 'Chờ khách xác nhận ngày đặt xe' || trangThai === 'Chờ khách xác nhận ngày nhận xe') {
      statusKey = 'ChoKhachXacNhanNgayNhan'; statusText = 'Chờ khách xác nhận ngày đặt xe';
    } else if (trangThai === 'DaHuy' || trangThai === 'Đã hủy') {
      statusKey = 'DaHuy'; statusText = 'Đã hủy';
    } else {
      statusKey = 'ChoDuyet'; statusText = 'Chờ xác nhận';
    }

    let targetOrder: Order | undefined;

    // 1. Cập nhật localStorage cache NGAY LẬP TỨC theo ID chính xác
    try {
      const cached = localStorage.getItem('crm_orders_cache');
      let list: Order[] = cached ? JSON.parse(cached) : [...mockOrders];
      let matchIdx = list.findIndex(o => o.id === orderIdStr);
      if (matchIdx === -1 && !isNaN(numId) && numId > 0) {
        const isXe = orderIdStr.includes('XE');
        matchIdx = list.findIndex(o => {
          const oIsXe = o.id.includes('XE') || o.loaiDon === 'Xe';
          return isXe === oIsXe && parseInt(o.id.replace(/\D/g, ''), 10) === numId;
        });
      }
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

    // 2. Cập nhật in-memory mockOrders
    mockOrders.forEach(o => {
      if (o.id === orderIdStr) {
        o.trangThai = statusKey;
        if (statusKey === 'HoanThanh') {
          o.trangThaiThanhToan = 'DaThanhToan';
        }
        targetOrder = o;
      }
    });

    // 3. Gửi PUT đồng bộ lên backend
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
    } else if (statusKey === 'ChoKhachXacNhanNgayNhan') {
      addAdminNotification({
        type: 'order_status',
        title: '📋 Đã duyệt đơn xe - Chờ khách xác nhận ngày nhận',
        message: `Đơn hàng #${orderIdStr} đã được duyệt. Hệ thống đang chờ khách hàng xác nhận ngày nhận xe tại Showroom.`,
        linkPage: 'sales',
        meta: targetOrder,
      });
      if (targetOrder && targetOrder.customerId) {
        addCustomerNotification({
          customerId: targetOrder.customerId,
          category: 'order',
          icon: '📅',
          title: `📅 Mời xác nhận ngày nhận xe #${orderIdStr}`,
          message: `Đơn mua xe #${orderIdStr} đã được Showroom duyệt thành công! Quý khách vui lòng bấm xác nhận ngày và giờ đến nhận xe để Showroom chuẩn bị xe chu đáo nhất.`,
          page: 'dashboard',
          tab: 'orders',
          targetId: targetOrder.id,
        });
      }
    } else if (statusKey === 'ChoGiaoXe') {
      addAdminNotification({
        type: 'order_status',
        title: '🏎️ Đơn xe sẵn sàng bàn giao',
        message: `Đơn hàng #${orderIdStr} đã chuyển sang trạng thái "Chờ giao xe". Lịch hẹn nhận xe đã được kích hoạt!`,
        linkPage: 'sales',
        meta: targetOrder,
      });
      if (targetOrder && targetOrder.customerId) {
        addCustomerNotification({
          customerId: targetOrder.customerId,
          category: 'order',
          icon: '🏎️',
          title: `🏎️ Lịch nhận xe #${orderIdStr} đã sẵn sàng`,
          message: `Đơn xe #${orderIdStr} đã sẵn sàng bàn giao. Quý khách có thể xem lịch hẹn tại mục "Lịch hẹn" của bạn!`,
          page: 'dashboard',
          tab: 'appts',
          targetId: targetOrder.id,
        });
      }
      // Tự động kích hoạt lịch hẹn nhận xe tương ứng sang 'DaXacNhan'
      try {
        const ord = targetOrder;
        if (ord) {
          const allAppts = await appointmentApi.getAll();
          const matchedAppts = allAppts.filter(a =>
            (a.maLichHen && (a.maLichHen === ord.maLichHen || a.maLichHen === ord.thongTinXe?.maLichHen)) ||
            (a.maDonHangXe && a.maDonHangXe === ord.id) ||
            (a.customerId === ord.customerId && a.loaiDichVu === 'NhanXe' && a.trangThai === 'ChoXacNhan')
          );
          for (const ma of matchedAppts) {
            await appointmentApi.updateStatus(ma.id, 'DaXacNhan');
          }
        }
      } catch (apptErr) {
        console.warn('Lỗi đồng bộ lịch hẹn khi chuyển Chờ giao xe:', apptErr);
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

        const isTargetVehicle = targetOrder.loaiDon === 'Xe' || !!targetOrder.thongTinXe || (targetOrder.id && targetOrder.id.includes('XE'));

        // KS01: Nếu là đơn phụ tùng -> Tự động gửi thông báo khảo sát mua sắm phụ tùng
        if (!isTargetVehicle) {
          addCustomerNotification({
            customerId: targetOrder.customerId,
            category: 'survey',
            icon: '📋',
            title: `📋 Khảo sát trải nghiệm mua sắm #${orderIdStr}`,
            message: `Đơn hàng #${orderIdStr} đã hoàn tất. Kính mời quý khách dành 1 phút đánh giá trải nghiệm để nhận mã giảm giá ưu đãi!`,
            page: 'dashboard',
            tab: 'surveys',
            targetId: 'KS002',
          });
        }

        // TB03: NẾU LÀ ĐƠN HÀNG XE -> Tách riêng thông báo "Nhận xe thành công" và "Mời đánh giá xe"
        if (targetOrder && (targetOrder.loaiDon === 'Xe' || targetOrder.thongTinXe || (targetOrder.id && targetOrder.id.includes('XE')))) {
          const bikeName = targetOrder.thongTinXe?.tenXe || 'xe mới';

          // Thông báo 3: Nhận xe thành công
          addCustomerNotification({
            customerId: targetOrder.customerId,
            category: 'order',
            icon: '🎉',
            title: '🎉 Nhận xe thành công',
            message: `Chúc mừng quý khách đã nhận xe ${bikeName} thành công! Hồ sơ xe đã được kích hoạt chính thức vào mục "Phương tiện của tôi". Chúc quý khách vạn dặm bình an!`,
            page: 'dashboard',
            tab: 'vehicles',
            targetId: targetOrder.id,
          });

          // Kèm thông báo mời đánh giá trải nghiệm
          addCustomerNotification({
            customerId: targetOrder.customerId,
            category: 'review',
            icon: '⭐',
            title: `⭐ Mời đánh giá xe ${bikeName}`,
            message: `Chúc mừng bạn đã nhận xe ${bikeName} thành công! Hãy dành 1 phút chia sẻ cảm nhận và đánh giá trải nghiệm xe để nhận ưu đãi từ Motoshop nhé.`,
            page: 'dashboard',
            tab: 'reviews',
            targetId: targetOrder.id,
          });
        }

        // NẾU LÀ ĐƠN HÀNG XE: Tự động kích hoạt xe vào tài khoản khách & gửi bài khảo sát xe mua mới cho khách hàng!
        if (targetOrder && (targetOrder.loaiDon === 'Xe' || targetOrder.thongTinXe || (targetOrder.id && targetOrder.id.includes('XE')))) {
          try {
            const bikeName = targetOrder.thongTinXe?.tenXe || 'Xe máy chính hãng';
            const brand = bikeName.includes('Yamaha') ? 'Yamaha' : bikeName.includes('Suzuki') ? 'Suzuki' : 'Honda';
            const vin = targetOrder.thongTinXe?.soKhungVIN || '';
            const allVehicles = await vehicleApi.getAll();
            const isAlreadyAdded = vin
              ? allVehicles.some((v: any) => v.soKhung === vin)
              : allVehicles.some((v: any) => targetOrder && v.customerId === targetOrder.customerId && (v.tenXe || '').toLowerCase().trim() === bikeName.toLowerCase().trim() && (v.bienSo === 'Chưa có biển số' || !v.bienSo));
            if (!isAlreadyAdded) {
              const createdVeh = await vehicleApi.createSoldVehicle({
                customerId: targetOrder.customerId,
                tenXe: bikeName,
                hangXe: brand,
                bienSo: 'Chưa có biển số',
                mauSac: targetOrder.thongTinXe?.mauSac || 'Tiêu chuẩn',
                dongCo: targetOrder.thongTinXe?.dongCo || '160cc PGM-FI',
                soKhung: vin || ('RLHKD160CB' + Date.now().toString().slice(-7)),
                soMay: targetOrder.thongTinXe?.soMay || ('KF12E-' + Date.now().toString().slice(-7)),
                namSanXuat: new Date().getFullYear().toString(),
                hanBaoHanh: new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
                hinhAnh: targetOrder.thongTinXe?.hinhAnh || (targetOrder.thongTinXe as any)?.productImage,
              });

              // Tự động liên kết hoặc cấp mới hợp đồng bảo hiểm kèm theo xe
              try {
                const curOrder = targetOrder;
                const cachedIns = localStorage.getItem(INSURANCE_STORAGE_KEY);
                let allIns: InsuranceContract[] = cachedIns ? JSON.parse(cachedIns) : [];
                let insUpdated = false;

                allIns.forEach(ins => {
                  const matchCustomer = ins.customerId === curOrder.customerId || parseInt(ins.customerId.replace(/\D/g, ''), 10) === parseInt(curOrder.customerId.replace(/\D/g, ''), 10);
                  const matchOrder = ins.ghiChu?.includes(curOrder.id);
                  const matchVehicleName = (ins.tenXe || '').toLowerCase().includes(bikeName.toLowerCase()) || bikeName.toLowerCase().includes((ins.tenXe || '').toLowerCase());
                  if (matchCustomer && (matchOrder || matchVehicleName || ins.vehicleId === curOrder.thongTinXe?.maXe)) {
                    ins.vehicleId = createdVeh.id;
                    if (createdVeh.soKhung) ins.soKhung = createdVeh.soKhung;
                    if (createdVeh.soMay) ins.soMay = createdVeh.soMay;
                    insUpdated = true;
                  }
                });

                // Nếu chưa có hợp đồng nào gắn xe mà đơn mua có gói bảo hiểm -> Tự động cấp Hợp đồng bảo hiểm điện tử
                const hasInsurance = curOrder.thongTinXe?.checklist?.capBaoHiem || (curOrder.thongTinXe?.goiBaoHiem && !curOrder.thongTinXe.goiBaoHiem.includes('Không mua'));
                if (!insUpdated && hasInsurance) {
                  const insPackageName = curOrder.thongTinXe?.goiBaoHiem || 'Bảo hiểm TNDS Bắt Buộc (1 Năm)';
                  const is2Y = insPackageName.includes('2 Năm');
                  const isToanDien = insPackageName.includes('Toàn Diện');
                  const todayDate = new Date();
                  const endDate = new Date(todayDate);
                  endDate.setFullYear(todayDate.getFullYear() + (is2Y ? 2 : 1));

                  const newContract: InsuranceContract = {
                    id: `HD-INS-${Date.now().toString().slice(-5)}`,
                    soGCN: `GCN-${Math.floor(100000 + Math.random() * 900000)}`,
                    vehicleId: createdVeh.id,
                    customerId: curOrder.customerId,
                    hoTenKH: curOrder.hoTenKH || 'Khách hàng',
                    soDienThoai: curOrder.soDienThoai || '0901234567',
                    email: curOrder.email || 'khachhang@motoshop.vn',
                    diaChi: curOrder.diaChiGiao || 'TP.HCM',
                    tenXe: createdVeh.tenXe,
                    bienSo: createdVeh.bienSo || 'Chưa có biển số',
                    soKhung: createdVeh.soKhung || '',
                    soMay: createdVeh.soMay || '',
                    packageType: isToanDien ? 'VAT_CHAT_TOAN_DIEN' : 'TNDS_BAT_BUOC',
                    tenGoi: insPackageName,
                    thoiHanNam: is2Y ? 2 : 1,
                    nhaBaoHiem: 'Bảo hiểm Quân Đội (MIC)',
                    ngayBatDau: todayDate.toISOString().split('T')[0],
                    ngayKetThuc: endDate.toISOString().split('T')[0],
                    phiBaoHiem: curOrder.thongTinXe?.phiBaoHiem || (isToanDien ? 450000 : is2Y ? 132000 : 66000),
                    trangThai: 'HieuLuc',
                    ghiChu: `Hợp đồng bảo hiểm điện tử cấp kèm theo đơn mua xe #${curOrder.id}`,
                    ngayCap: todayDate.toISOString().split('T')[0],
                  };

                  allIns.unshift(newContract);
                  insUpdated = true;

                  addCustomerNotification({
                    customerId: curOrder.customerId,
                    category: 'order',
                    icon: '🛡️',
                    title: '🛡️ Đã cấp Giấy chứng nhận bảo hiểm điện tử',
                    message: `Bảo hiểm điện tử cho xe ${createdVeh.tenXe} (${insPackageName}) đã được kích hoạt thành công (Số GCN: ${newContract.soGCN})!`,
                    page: 'dashboard',
                    tab: 'vehicles',
                    targetId: newContract.id,
                  });
                }

                if (insUpdated) {
                  localStorage.setItem(INSURANCE_STORAGE_KEY, JSON.stringify(allIns));
                  window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'insurance_contracts' } }));
                }
              } catch (insSyncErr) {
                console.warn('Auto link insurance contract error:', insSyncErr);
              }
            }
          } catch (vehErr) {
            console.warn('Tự động tạo hồ sơ xe khi đơn hàng hoàn tất thất bại:', vehErr);
          }

          // Tự động hoàn tất lịch hẹn nhận xe tương ứng (để biến mất khỏi tab Lịch hẹn của khách hàng)
          try {
            const ord = targetOrder;
            if (ord) {
              const allAppts = await appointmentApi.getAll();
              const matchedAppts = allAppts.filter(a =>
                (a.maLichHen && (a.maLichHen === ord.maLichHen || a.maLichHen === ord.thongTinXe?.maLichHen)) ||
                (a.maDonHangXe && a.maDonHangXe === ord.id) ||
                (a.customerId === ord.customerId && a.loaiDichVu === 'NhanXe' && a.trangThai !== 'DaHoanThanh')
              );
              for (const ma of matchedAppts) {
                await appointmentApi.updateStatus(ma.id, 'DaHoanThanh');
              }
            }
          } catch (apptErr) {
            console.warn('Lỗi đồng bộ lịch hẹn khi hoàn tất đơn hàng:', apptErr);
          }

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

    async updatePaymentStatus(orderIdOrNum: string | number, paymentStatus: PaymentStatus = 'DaThanhToan'): Promise<Order | undefined> {
    const orderIdStr = String(orderIdOrNum);
    const numId = parseInt(orderIdStr.replace(/\D/g, ''), 10);
    const isXe = orderIdStr.includes('XE');
    let targetOrder: Order | undefined;

    // 1. Cập nhật cache crm_orders_cache
    try {
      const cached = localStorage.getItem('crm_orders_cache');
      let list: Order[] = cached ? JSON.parse(cached) : [...mockOrders];
      let matchIdx = list.findIndex(o => o.id === orderIdStr);
      if (matchIdx === -1 && !isNaN(numId) && numId > 0) {
        matchIdx = list.findIndex(o => {
          const oIsXe = o.id.includes('XE');
          return isXe === oIsXe && parseInt(o.id.replace(/\D/g, ''), 10) === numId;
        });
      }
      if (matchIdx !== -1) {
        list[matchIdx].trangThaiThanhToan = paymentStatus;
        targetOrder = list[matchIdx];
      } else {
        const found = mockOrders.find(o => o.id === orderIdStr);
        if (found) {
          const updatedFound = { ...found, trangThaiThanhToan: paymentStatus };
          list.unshift(updatedFound);
          targetOrder = updatedFound;
        }
      }
      localStorage.setItem('crm_orders_cache', JSON.stringify(list));
    } catch {}

    // 2. Cập nhật in-memory mockOrders
    mockOrders.forEach(o => {
      if (o.id === orderIdStr || (parseInt(o.id.replace(/\D/g, ''), 10) === numId && o.id.includes('XE') === isXe)) {
        o.trangThaiThanhToan = paymentStatus;
        targetOrder = o;
      }
    });

    // 2.1. Gửi PUT đồng bộ trạng thái thanh toán lên backend
    if (!isNaN(numId) && numId > 0 && !isXe) {
      try {
        await fetchWithTimeout(`${API_BASE_URL}/DonHang/${numId}/thanh-toan`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trangThaiThanhToan: paymentStatus }),
        });
      } catch (err) {
        console.warn('[orderApi.updatePaymentStatus] Backend call failed, applied locally:', err);
      }
    }

    // 3. Thông báo Admin & Khách hàng khi xác nhận thanh toán
    if (paymentStatus === 'DaThanhToan') {
      addAdminNotification({
        type: 'order_status',
        title: '💵 Đã xác nhận thu tiền',
        message: 'Đơn hàng #' + orderIdStr + ' đã được xác nhận ĐÃ THANH TOÁN thành công.',
        linkPage: 'sales',
        meta: targetOrder,
      });

      if (targetOrder && targetOrder.customerId) {
        addCustomerNotification({
          customerId: targetOrder.customerId,
          category: 'order',
          icon: '💵',
          title: 'Đã xác nhận thanh toán đơn hàng #' + orderIdStr,
          message: 'Khoản thanh toán cho đơn hàng #' + orderIdStr + ' đã được hệ thống ghi nhận thành công!',
          page: 'dashboard',
          tab: 'orders',
          targetId: targetOrder.id,
        });
      }
    }

    // 4. Phát sự kiện toàn cục để các tab / trang đồng bộ
    window.dispatchEvent(new CustomEvent('crm-data-refresh', {
      detail: { type: 'order_payment', orderId: orderIdStr, paymentStatus }
    }));

    return targetOrder;
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
      const payloadItems = data.items.map(it => {
        const safeMaPhuTung = (it.maPhuTung && it.maPhuTung > 0 && it.maPhuTung < 2147483647) ? it.maPhuTung : 1;
        return {
          maPhuTung: safeMaPhuTung,
          soLuong: it.soLuong,
          donGia: it.donGia,
        };
      });

      const res = await fetchWithTimeout(`${API_BASE_URL}/DonHang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maKH,
          tongTien: data.tongTien,
          trangThai: data.kenhBan === 'TaiQuay' ? 'Hoàn thành' : 'Chờ duyệt',
          trangThaiThanhToan: data.trangThaiThanhToan || (data.kenhBan === 'TaiQuay' ? 'DaThanhToan' : 'ChuaThanhToan'),
          phuongThucThanhToan: data.phuongThucThanhToan || 'TienMat',
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

      // THU HỒI / XÓA PHƯƠNG TIỆN VÀ HỢP ĐỒNG BẢO HIỂM GẮN VỚI ĐƠN HÀNG HỦY
      const custId = order.customerId;
      const targetTenXe = (order.thongTinXe?.tenXe || '').toLowerCase().trim();
      const targetVin = (order.thongTinXe?.soKhungVIN || '').toLowerCase().trim();

      // 1. Thu hồi phương tiện trong XeKhachHang
      try {
        const allCustVehicles = await vehicleApi.getAll();
        const matchedVehicles = allCustVehicles.filter(v => {
          if (v.customerId !== custId) {
            const vCustNum = parseInt(v.customerId.replace(/\D/g, ''), 10);
            const oCustNum = parseInt(custId.replace(/\D/g, ''), 10);
            if (isNaN(vCustNum) || isNaN(oCustNum) || vCustNum !== oCustNum) return false;
          }
          if (targetVin && v.soKhung && v.soKhung.toLowerCase().trim() === targetVin) return true;
          if (targetTenXe && v.tenXe && v.tenXe.toLowerCase().trim().includes(targetTenXe)) return true;
          if (order.thongTinXe?.bienSo && v.bienSo === order.thongTinXe.bienSo) return true;
          if (v.bienSo === '59-A1 888.88' || v.bienSo === '29-B1 999.99' || v.bienSo === '60-C1 777.77' || v.bienSo === 'Chưa có biển số') return true;
          return false;
        });

        for (const mv of matchedVehicles) {
          const beId = parseInt(mv.id.replace(/\D/g, ''), 10);
          if (!isNaN(beId) && beId > 0) {
            try {
              await fetchWithTimeout(`${API_BASE_URL}/XeKhachHang/${beId}`, { method: 'DELETE' });
            } catch (delErr) {
              console.warn('[cancelOrder] Delete XeKhachHang backend error:', delErr);
            }
          }
          // Xóa khỏi cache localStorage
          try {
            const cachedV = localStorage.getItem('crm_customer_vehicles');
            if (cachedV) {
              const vList: Vehicle[] = JSON.parse(cachedV);
              const updatedV = vList.filter(v => v.id !== mv.id && v.bienSo !== mv.bienSo);
              localStorage.setItem('crm_customer_vehicles', JSON.stringify(updatedV));
            }
          } catch {}
          // Xóa khỏi mockVehicles
          const mIdx = mockVehicles.findIndex(v => v.id === mv.id || (mv.bienSo && v.bienSo === mv.bienSo));
          if (mIdx !== -1) mockVehicles.splice(mIdx, 1);
        }
      } catch (vehErr) {
        console.warn('[cancelOrder] Auto rollback vehicle failed:', vehErr);
      }

      // 2. Thu hồi / Hủy hợp đồng bảo hiểm
      try {
        const allInsurances = insuranceApi.getAll();
        const updatedInsurances = allInsurances.filter(ins => {
          const isMatchOrder = ins.ghiChu && ins.ghiChu.includes(order.id);
          const isMatchPlate = ins.bienSo && (ins.bienSo === order.thongTinXe?.bienSo || ins.bienSo === '59-A1 888.88' || ins.bienSo === '29-B1 999.99' || ins.bienSo === '60-C1 777.77');
          return !(isMatchOrder || isMatchPlate);
        });
        localStorage.setItem(INSURANCE_STORAGE_KEY, JSON.stringify(updatedInsurances));
      } catch (insErr) {
        console.warn('[cancelOrder] Auto rollback insurance failed:', insErr);
      }
    }

    addAdminNotification({
      type: 'order_cancelled',
      title: '❌ Khách hàng đã hủy đơn hàng',
      message: `Đơn hàng #${order.id} (${order.hoTenKH}) đã được hủy. Lý do: ${cancelReason}. Số lượng sản phẩm / xe đã được hoàn trả lại kho.`,
      linkPage: 'sales',
      meta: order,
    });

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'order_cancelled', orderId: order.id } }));
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'order', orderId: order.id } }));
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle' } }));
    return { success: true, message: 'Hủy đơn hàng thành công và đã hoàn trả tồn kho khả dụng!' };
  },

  async confirmVehiclePickupDate(orderId: string, pickupDate: string, pickupTime: string): Promise<{ success: boolean; message: string }> {
    const orderIdStr = String(orderId);
    const numId = parseInt(orderIdStr.replace(/\D/g, ''), 10);
    const cached = localStorage.getItem('crm_orders_cache');
    let list: Order[] = cached ? JSON.parse(cached) : [...mockOrders];
    let matchIdx = list.findIndex(o => o.id === orderIdStr || (numId > 0 && parseInt(o.id.replace(/\D/g, ''), 10) === numId && (o.id.includes('XE') || o.loaiDon === 'Xe')));
    
    if (matchIdx === -1) {
      return { success: false, message: 'Không tìm thấy đơn hàng!' };
    }

    const order = list[matchIdx];
    order.trangThai = 'ChoGiaoXe';
    order.daXacNhanNgayNhan = true;
    if (order.thongTinXe) {
      order.thongTinXe.daXacNhanNgayNhan = true;
      order.thongTinXe.ngayGiaoXe = pickupDate;
      order.thongTinXe.khungGioGiao = pickupTime;
      order.thongTinXe.ngayNhanXacNhan = pickupDate;
      order.thongTinXe.gioNhanXacNhan = pickupTime;
    }

    localStorage.setItem('crm_orders_cache', JSON.stringify(list));

    // Cập nhật in-memory mockOrders
    mockOrders.forEach(o => {
      if (o.id === order.id) {
        o.trangThai = 'ChoGiaoXe';
        o.daXacNhanNgayNhan = true;
        if (o.thongTinXe) {
          o.thongTinXe.daXacNhanNgayNhan = true;
          o.thongTinXe.ngayGiaoXe = pickupDate;
          o.thongTinXe.khungGioGiao = pickupTime;
        }
      }
    });

    // Gửi cập nhật trạng thái Chờ giao xe lên backend
    if (!isNaN(numId) && numId > 0) {
      try {
        await fetchWithTimeout(`${API_BASE_URL}/DonHang/trang-thai/${numId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trangThai: 'Chờ giao xe' }),
        });
      } catch (err) {
        console.warn('Cập nhật trạng thái Chờ giao xe lên backend:', err);
      }
    }

    // Kích hoạt / cập nhật lịch hẹn nhận xe chính thức
    try {
      const allAppts = await appointmentApi.getAll();
      const matched = allAppts.find(a =>
        (a.maDonHangXe && a.maDonHangXe === order.id) ||
        (a.maLichHen && (a.maLichHen === order.maLichHen || a.maLichHen === order.thongTinXe?.maLichHen)) ||
        (a.customerId === order.customerId && a.loaiDichVu === 'NhanXe')
      );

      if (matched) {
        await appointmentApi.updateDetails(matched.id, {
          ngayHen: pickupDate,
          gioHen: pickupTime.split(' - ')[0] || pickupTime,
          trangThai: 'DaXacNhan',
          ghiChu: `Khách hàng đã xác nhận ngày nhận xe: ${pickupDate} lúc ${pickupTime}`,
        });
      } else {
        const newAppt = await appointmentApi.create({
          customerId: order.customerId,
          hoTenKH: order.hoTenKH,
          soDienThoai: order.soDienThoai || '',
          loaiDichVu: 'NhanXe',
          ngayHen: pickupDate,
          gioHen: pickupTime.split(' - ')[0] || pickupTime,
          tenXe: order.thongTinXe?.tenXe || 'Xe máy chính hãng',
          bienSo: order.thongTinXe?.bienSo || 'Bấm biển tại Showroom',
          mauXe: order.thongTinXe?.mauSac || 'Tiêu chuẩn',
          maLichHen: order.maLichHen || `HEN-XE-${Math.floor(1000 + Math.random() * 9000)}`,
          maDonHangXe: order.id,
          ghiChu: `Khách hàng đã xác nhận lịch nhận xe lúc ${pickupTime} ngày ${pickupDate}`,
        });
        if (newAppt?.appointment?.id) {
          await appointmentApi.updateStatus(newAppt.appointment.id, 'DaXacNhan');
        }
      }
    } catch (err) {
      console.warn('Lỗi kích hoạt lịch hẹn nhận xe:', err);
    }

    // Thông báo cho khách hàng
    addCustomerNotification({
      customerId: order.customerId,
      category: 'order',
      icon: '✅',
      title: '✅ Đã xác nhận lịch nhận xe thành công',
      message: `Quý khách đã xác nhận nhận xe ${order.thongTinXe?.tenXe || ''} vào ngày ${pickupDate} lúc ${pickupTime}. Lịch hẹn đã hiển thị trong mục "Lịch hẹn" của quý khách!`,
      page: 'dashboard',
      tab: 'appts',
      targetId: order.id,
    });

    // Thông báo cho Admin
    addAdminNotification({
      type: 'order_status',
      title: '📅 Khách hàng đã xác nhận ngày nhận xe',
      message: `Khách hàng ${order.hoTenKH} đã xác nhận ngày nhận xe cho đơn #${order.id} vào ngày ${pickupDate} lúc ${pickupTime}. Lịch biểu Showroom đã được cập nhật!`,
      linkPage: 'appointments',
      meta: order,
    });

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'order_status_updated', orderId: order.id, status: 'ChoGiaoXe' } }));
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'appointment' } }));
    return { success: true, message: 'Xác nhận lịch nhận xe thành công!' };
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
    // LH28: Validation máy chủ 2 lớp (Server-side validation)
    const sanitizedName = (data.hoTenKH || '').trim().replace(/\s+/g, ' ');
    const nameRegex = /^[a-zA-ZàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s]+$/;
    if (!sanitizedName || !nameRegex.test(sanitizedName)) {
      return { success: false, message: 'Lỗi kiểm tra máy chủ: Họ và tên không hợp lệ (không được để trống, không chứa số hoặc ký tự đặc biệt)!' };
    }

    const cccd = (data.thongTinXe?.idCardTaxNo || '').trim();
    if (!cccd || !/^\d{12}$/.test(cccd)) {
      return { success: false, message: 'Lỗi kiểm tra máy chủ: Số CCCD không hợp lệ (phải gồm đúng 12 chữ số)!' };
    }

    const phone = (data.soDienThoai || '').trim();
    if (!phone || !/^0\d{9}$/.test(phone)) {
      return { success: false, message: 'Lỗi kiểm tra máy chủ: Số điện thoại không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng số 0)!' };
    }

    const email = (data.email || '').trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      return { success: false, message: 'Lỗi kiểm tra máy chủ: Email không hợp lệ (ví dụ: abc@gmail.com)!' };
    }

    const address = (data.diaChiGiao || data.thongTinXe?.diaChiGiao || '').trim();
    if (!address || address.length < 5 || address.length > 255) {
      return { success: false, message: 'Lỗi kiểm tra máy chủ: Địa chỉ đăng ký xe không hợp lệ (phải từ 5 đến 255 ký tự)!' };
    }

    const discount = data.thongTinXe?.khuyenMai ?? 0;
    if (discount < 0) {
      return { success: false, message: 'Lỗi kiểm tra máy chủ: Khuyến mãi không được là số âm!' };
    }

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
      let backendStatusStr = 'Chờ duyệt';
      if (data.trangThai === 'HoanThanh') backendStatusStr = 'Hoàn thành';
      else if (data.trangThai === 'ChoGiaoXe') backendStatusStr = 'Chờ giao xe';

      const res = await fetchWithTimeout(`${API_BASE_URL}/DonHang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maKH,
          tongTien: data.tongTien,
          trangThai: backendStatusStr,
          trangThaiThanhToan: data.trangThaiThanhToan || 'DaCoc',
          phuongThucThanhToan: data.phuongThucThanhToan || 'ChuyenKhoan',
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
      trangThai: data.trangThai || 'ChoDuyet',
      trangThaiThanhToan: data.trangThaiThanhToan || 'DaCoc',
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
      if (newOrder.customerId) {
        const bikeName = newOrder.thongTinXe?.tenXe || 'xe mới';
        addCustomerNotification({
          customerId: newOrder.customerId,
          category: 'review',
          icon: '⭐',
          title: `⭐ Mời đánh giá xe ${bikeName}`,
          message: `Chúc mừng bạn đã nhận xe ${bikeName} thành công! Hãy dành 1 phút chia sẻ cảm nhận và đánh giá trải nghiệm xe để nhận ưu đãi từ Motoshop nhé.`,
          page: 'dashboard',
          tab: 'reviews',
          targetId: newOrder.id,
        });
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

            // LH04: Chuẩn hóa 5 trạng thái (Ưu tiên trạng thái chính xác từ Backend database)
            let tt: AppointmentStatus = 'ChoXacNhan';
            const statusStr = item.trangThai || cachedMatch?.trangThai || '';
            if (statusStr === 'Đã xác nhận' || statusStr === 'DaXacNhan') tt = 'DaXacNhan';
            else if (statusStr === 'Từ chối' || statusStr === 'TuChoi') tt = 'TuChoi';
            else if (statusStr === 'Đã hoàn thành' || statusStr === 'DaHoanThanh' || statusStr === 'HoanThanh') tt = 'DaHoanThanh';
            else if (statusStr === 'Đã hủy' || statusStr === 'DaHuy') tt = 'DaHuy';
            else tt = 'ChoXacNhan';

            let ldv: any = 'BaoDuong';
            if (item.loaiDichVu?.includes('Sửa') || item.loaiDichVu?.includes('Sua')) ldv = 'SuaChua';
            else if (item.loaiDichVu?.includes('Lái') || item.loaiDichVu?.includes('Lai')) ldv = 'LaiThu';
            else if (item.loaiDichVu?.includes('Nhận') || item.loaiDichVu?.includes('Nhan')) ldv = 'NhanXe';
            else if (item.loaiDichVu?.includes('Bảo hành') || item.loaiDichVu?.includes('BaoHanh')) ldv = 'BaoHanh';

            let extractedXe = cachedMatch?.tenXe || mockMatch?.tenXe;
            if (!extractedXe && item.loaiDichVu?.includes('Nhận xe mới:')) {
              extractedXe = item.loaiDichVu.replace('Nhận xe mới:', '').trim();
            }
            if (!extractedXe && item.ghiChu) {
              const xeMatch = item.ghiChu.match(/(?:Phương tiện|Xe):\s*([^-\]]+)/i);
              if (xeMatch && xeMatch[1]) extractedXe = xeMatch[1].trim();
            }
            if (!extractedXe) extractedXe = 'SYM Shark 50';

            let extractedBs = cachedMatch?.bienSo || mockMatch?.bienSo || 'Chưa có biển số';
            if (item.ghiChu) {
              const bsMatch = item.ghiChu.match(/BS:\s*([^-\]]+)/i);
              if (bsMatch && bsMatch[1]) extractedBs = bsMatch[1].trim();
            }

            let extractedOrderMatch = cachedMatch?.maDonHangXe || mockMatch?.maDonHangXe;
            if (!extractedOrderMatch && item.ghiChu) {
              const oMatch = item.ghiChu.match(/#(DH-XE-\d+|DH\d+|DH-[A-Z0-9]+)/i);
              if (oMatch && oMatch[1]) extractedOrderMatch = oMatch[1];
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
              maLichHen: cachedMatch?.maLichHen || mockMatch?.maLichHen || id,
              maDonHangXe: extractedOrderMatch,
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

    // Loại trừ các lịch hẹn / khách hàng đã bị xóa khỏi hệ thống
    let deletedApptIds: string[] = [];
    let deletedCustIds: string[] = [];
    let deletedPhones: string[] = [];
    try {
      deletedApptIds = JSON.parse(localStorage.getItem('crm_deleted_appointment_ids') || '[]');
      deletedCustIds = JSON.parse(localStorage.getItem('crm_deleted_customer_ids') || '[]');
      deletedPhones = JSON.parse(localStorage.getItem('crm_deleted_customer_phones') || '[]');
    } catch {}

    const isBlacklisted = (a: Appointment) => {
      if (deletedApptIds.includes(a.id)) return true;
      if (a.customerId && deletedCustIds.includes(a.customerId)) return true;
      const numCust = parseInt((a.customerId || '').replace(/\D/g, ''), 10);
      if (!isNaN(numCust) && deletedCustIds.includes(String(numCust))) return true;
      const cleanPhone = (a.soDienThoai || '').replace(/\D/g, '');
      if (cleanPhone && deletedPhones.some(p => p.replace(/\D/g, '') === cleanPhone)) return true;
      return false;
    };

    result = result.filter(a => !isBlacklisted(a));

    // LH10: Luôn sắp xếp lịch hẹn mới nhất lên đầu danh sách
    result.sort((a, b) => {
      const dateA = a.createdDate || `${a.ngayHen} ${a.gioHen}`;
      const dateB = b.createdDate || `${b.ngayHen} ${b.gioHen}`;
      return dateB.localeCompare(dateA);
    });

    localStorage.setItem('crm_appointments_cache', JSON.stringify(result));
    return result;
  },

  getAllSync(): Appointment[] {
    let cachedList: Appointment[] = [];
    try {
      const cached = localStorage.getItem('crm_appointments_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) cachedList = parsed;
      }
    } catch {}
    const mergedMap = new Map<string, Appointment>();
    mockAppointments.forEach(m => mergedMap.set(m.id, { ...m }));
    cachedList.forEach(c => mergedMap.set(c.id, { ...mergedMap.get(c.id), ...c }));
    let result = Array.from(mergedMap.values());

    // Loại trừ các lịch hẹn / khách hàng đã bị xóa khỏi hệ thống
    let deletedApptIds: string[] = [];
    let deletedCustIds: string[] = [];
    let deletedPhones: string[] = [];
    try {
      deletedApptIds = JSON.parse(localStorage.getItem('crm_deleted_appointment_ids') || '[]');
      deletedCustIds = JSON.parse(localStorage.getItem('crm_deleted_customer_ids') || '[]');
      deletedPhones = JSON.parse(localStorage.getItem('crm_deleted_customer_phones') || '[]');
    } catch {}

    const isBlacklisted = (a: Appointment) => {
      if (deletedApptIds.includes(a.id)) return true;
      if (a.customerId && deletedCustIds.includes(a.customerId)) return true;
      const numCust = parseInt((a.customerId || '').replace(/\D/g, ''), 10);
      if (!isNaN(numCust) && deletedCustIds.includes(String(numCust))) return true;
      const cleanPhone = (a.soDienThoai || '').replace(/\D/g, '');
      if (cleanPhone && deletedPhones.some(p => p.replace(/\D/g, '') === cleanPhone)) return true;
      return false;
    };

    result = result.filter(a => !isBlacklisted(a));
    result.sort((a, b) => {
      const dateA = a.createdDate || `${a.ngayHen} ${a.gioHen}`;
      const dateB = b.createdDate || `${b.ngayHen} ${b.gioHen}`;
      return dateB.localeCompare(dateA);
    });
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
        await fetchWithTimeout(`${API_BASE_URL}/LichHen/trang-thai/${numId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ trangThai: backendStatus, ghiChu: lyDoTuChoi ? `[LÝ DO TỪ CHỐI]: ${lyDoTuChoi}` : undefined }),
        });
      } catch (err) {
        console.warn('[appointmentApi.updateStatus] Backend call failed, applied locally:', err);
      }
    }

    const appt = appointmentApi.getAllSync().find(a => a.id === apptId || parseInt(a.id.replace(/\D/g, ''), 10) === numId);
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

      // KS01: Tự động TẠO BÀI KHẢO SÁT BẢO DƯỠNG TỰ ĐỘNG và gửi thông báo nhắc khách làm bài khảo sát
      if (status === 'DaHoanThanh') {
        if (appt.loaiDichVu === 'BaoDuong' || appt.loaiDichVu === 'SuaChua' || appt.loaiDichVu === 'BaoHanh') {
          try {
            surveyApi.createMaintenanceSurvey(appt);
          } catch (mErr) {
            console.warn('Lỗi tự động tạo bài khảo sát bảo dưỡng:', mErr);
          }
        }

        // TB03: NẾU là Nhận xe (NhanXe) -> Tự động gửi thông báo mời đánh giá xe sau khi nhận xe thành công!
        if (appt.loaiDichVu === 'NhanXe') {
          const bikeName = appt.tenXe || 'xe mới';
          addCustomerNotification({
            customerId: appt.customerId,
            category: 'review',
            icon: '⭐',
            title: `⭐ Mời đánh giá xe ${bikeName}`,
            message: `Chúc mừng bạn đã nhận xe ${bikeName} thành công! Hãy dành 1 phút chia sẻ cảm nhận và đánh giá trải nghiệm xe để nhận ưu đãi từ Motoshop nhé.`,
            page: 'dashboard',
            tab: 'reviews',
            targetId: appt.maDonHangXe || appt.id,
          });
        }
      }
    }

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'appointment', apptId, status } }));
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'surveys' } }));
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
    hinhThucGiao?: 'Showroom' | 'HomeDelivery';
    diaChiGiao?: string;
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
      hinhThucGiao: data.hinhThucGiao,
      diaChiGiao: data.diaChiGiao,
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
    "id": "XM001",
    "tenXe": "Honda SH 160i ABS 2024",
    "hang": "Honda",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 95900000,
    "mauSac": "Đen mờ, Đỏ đen, Xám xi măng, Trắng bạc",
    "moTa": "Flagship tay ga cao cấp của Honda với phanh ABS 2 kênh, động cơ 156.9cc eSP+ 4 van, Smart Key",
    "hinhAnh": "/images/Xe/honda_sh_160i_abs_2024.jpg",
    "coTheLaiThu": true,
    "soLuong": 6,
    "dongCo": "156.9cc eSP+ 4 van",
    "congSuat": "16.6 HP / 8.500 rpm",
    "tieuHaoNhienLieu": "2.24 L/100km",
    "phanh": "Đĩa trước & sau, ABS 2 kênh",
    "thongSoKyThuat": "156.9cc eSP+ 4 van, Phanh ABS 2 kênh, HSTC, Khóa thông minh Smart Key",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM002",
    "tenXe": "Honda Air Blade 160 ABS",
    "hang": "Honda",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 56690000,
    "mauSac": "Đỏ đen, Xanh xám, Đen vàng đồng",
    "moTa": "Tay ga thể thao mạnh mẽ, động cơ eSP+ 160cc, cốp rộng 23.2L tích hợp cổng sạc USB tiện lợi",
    "hinhAnh": "/images/Xe/honda_air_blade_160_abs.jpg",
    "coTheLaiThu": true,
    "soLuong": 8,
    "dongCo": "156.9cc eSP+ 4 van",
    "congSuat": "15.0 HP / 8.000 rpm",
    "tieuHaoNhienLieu": "2.30 L/100km",
    "phanh": "Đĩa trước ABS, tang trống sau",
    "thongSoKyThuat": "156.9cc eSP+, Phanh ABS trước, Cổng sạc USB, Cốp rộng 23.2L",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM003",
    "tenXe": "Honda Lead 125cc (Bản Đặc Biệt)",
    "hang": "Honda",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 42790000,
    "mauSac": "Bạc nhám, Đen nhám, Xanh dương",
    "moTa": "Cốp xe siêu rộng 37L đựng vừa 2 mũ bảo hiểm, nắp bình xăng trước tiện lợi không cần mở yên",
    "hinhAnh": "/images/Xe/honda_lead_125cc_dac_biet.jpg",
    "coTheLaiThu": true,
    "soLuong": 10,
    "dongCo": "124.8cc eSP+ 4 van",
    "congSuat": "11.0 HP / 8.500 rpm",
    "tieuHaoNhienLieu": "2.16 L/100km",
    "phanh": "Đĩa trước CBS, tang trống sau",
    "thongSoKyThuat": "124.8cc eSP+, Cốp siêu lớn 37L đựng vừa 2 mũ bảo hiểm, Nắp bình xăng trước",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM004",
    "tenXe": "Honda Vision 110 Thể Thao",
    "hang": "Honda",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 36590000,
    "mauSac": "Đen nhám, Xám xi măng thể thao",
    "moTa": "Mẫu xe ga quốc dân bán chạy nhất, khung dập eSAF thế hệ mới siêu nhẹ và linh hoạt",
    "hinhAnh": "/images/Xe/honda_vision_110_the_thao.jpg",
    "coTheLaiThu": true,
    "soLuong": 12,
    "dongCo": "109.5cc eSP",
    "congSuat": "8.8 HP / 7.500 rpm",
    "tieuHaoNhienLieu": "1.85 L/100km",
    "phanh": "Đĩa trước CBS, tang trống sau",
    "thongSoKyThuat": "109.5cc eSP, Khung dập eSAF thế hệ mới siêu nhẹ, Tiết kiệm xăng 1.85L/100km",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM005",
    "tenXe": "Honda Winner X 150 ABS",
    "hang": "Honda",
    "phanKhuc": "Xe côn tay",
    "giaNiemYet": 50560000,
    "mauSac": "Đỏ đen trắng HRC, Đen vàng đồng",
    "moTa": "Underbone thể thao hàng đầu của Honda với bộ ly hợp chống trượt hai chiều Assist & Slipper clutch",
    "hinhAnh": "/images/Xe/honda_winner_x_150_abs.jpg",
    "coTheLaiThu": true,
    "soLuong": 7,
    "dongCo": "149.1cc DOHC 4 van, 6 cấp số",
    "congSuat": "15.4 HP / 9.000 rpm",
    "tieuHaoNhienLieu": "1.99 L/100km",
    "phanh": "Đĩa trước ABS, đĩa sau",
    "thongSoKyThuat": "149.1cc DOHC 6 cấp số, Phanh đĩa ABS trước, Bộ ly hợp chống trượt 2 chiều",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM006",
    "tenXe": "Honda Wave Alpha 110cc",
    "hang": "Honda",
    "phanKhuc": "Xe số",
    "giaNiemYet": 18190000,
    "mauSac": "Trắng bạc, Xanh dương, Đỏ đô, Đen mờ",
    "moTa": "Xe số bền bỉ huyền thoại, tiết kiệm xăng vượt trội, chi phí sử dụng và bảo dưỡng rẻ nhất",
    "hinhAnh": "/images/Xe/honda_wave_alpha_110_2025.jpg",
    "coTheLaiThu": true,
    "soLuong": 15,
    "dongCo": "109.1cc 4 kỳ làm mát không khí",
    "congSuat": "8.2 HP / 7.500 rpm",
    "tieuHaoNhienLieu": "1.72 L/100km",
    "phanh": "Tang trống trước & sau",
    "thongSoKyThuat": "109.1cc làm mát bằng không khí, Động cơ siêu bền bỉ, 1.72L/100km",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM007",
    "tenXe": "Honda CBR150R",
    "hang": "Honda",
    "phanKhuc": "Xe côn tay",
    "giaNiemYet": 72290000,
    "mauSac": "Đỏ đen HRC, Đen nhám thể thao",
    "moTa": "Sportbike 150cc thuần chất với phuộc trước hành trình ngược Upside Down Showa vàng óng ánh",
    "hinhAnh": "/images/Xe/honda_cbr150r.jpg",
    "coTheLaiThu": true,
    "soLuong": 4,
    "dongCo": "149.2cc DOHC làm mát dung dịch",
    "congSuat": "16.9 HP / 9.000 rpm",
    "tieuHaoNhienLieu": "2.25 L/100km",
    "phanh": "Đĩa trước & sau, ABS 2 kênh",
    "thongSoKyThuat": "149.2cc DOHC, Phanh ABS 2 kênh, Phuộc Showa USD, Ly hợp chống trượt",
    "xuatXu": "Indonesia"
  },
  {
    "id": "XM008",
    "tenXe": "Honda Future 125 Fi",
    "hang": "Honda",
    "phanKhuc": "Xe số",
    "giaNiemYet": 31090000,
    "mauSac": "Trắng vàng đen, Xanh đen, Đỏ đen",
    "moTa": "Xe số cao cấp thiết kế sang trọng lịch lãm, cốp U-box rộng rãi và động cơ cực kỳ tiết kiệm xăng",
    "hinhAnh": "/images/Xe/honda_future_125_fi.jpg",
    "coTheLaiThu": true,
    "soLuong": 6,
    "dongCo": "124.9cc 4 kỳ làm mát không khí",
    "congSuat": "9.1 HP / 7.500 rpm",
    "tieuHaoNhienLieu": "1.54 L/100km",
    "phanh": "Đĩa trước, tang trống sau",
    "thongSoKyThuat": "124.9cc PGM-FI, Đèn pha LED cao cấp, Cốp U-Box đựng mũ bảo hiểm full đầu",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM009",
    "tenXe": "Honda SH Mode 125",
    "hang": "Honda",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 58190000,
    "mauSac": "Đỏ nâu, Bạc đen, Xanh đen, Trắng nâu",
    "moTa": "Dòng xe ga thanh lịch quý phái dành cho phái đẹp, khung gầm eSAF chuẩn Châu Âu",
    "hinhAnh": "/images/Xe/honda_sh_mode_125.png",
    "coTheLaiThu": true,
    "soLuong": 5,
    "dongCo": "124.8cc eSP+ 4 van",
    "congSuat": "11.0 HP / 8.500 rpm",
    "tieuHaoNhienLieu": "2.12 L/100km",
    "phanh": "Đĩa trước ABS, tang trống sau",
    "thongSoKyThuat": "124.8cc eSP+ 4 van, Phanh ABS trước, Khóa SmartKey, Cổng sạc USB trước",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM010",
    "tenXe": "Honda Vario 160",
    "hang": "Honda",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 51990000,
    "mauSac": "Đen nhám, Xanh đen bạc, Đỏ đen",
    "moTa": "Tay ga phong cách đường phố cơ bắp góc cạnh, động cơ 160cc bứt tốc mạnh mẽ vượt trội",
    "hinhAnh": "/images/Xe/honda_vario_160.jpg",
    "coTheLaiThu": true,
    "soLuong": 6,
    "dongCo": "156.9cc eSP+ 4 van",
    "congSuat": "15.1 HP / 8.500 rpm",
    "tieuHaoNhienLieu": "2.20 L/100km",
    "phanh": "Đĩa trước ABS, đĩa sau",
    "thongSoKyThuat": "156.9cc eSP+ 4 van, Phanh đĩa ABS trước, Khung eSAF, Sạc USB",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM011",
    "tenXe": "Yamaha Exciter 155 VVA ABS",
    "hang": "Yamaha",
    "phanKhuc": "Xe côn tay",
    "giaNiemYet": 54000000,
    "mauSac": "Xanh GP, Đen nhám, Đỏ đen, Xám xi măng",
    "moTa": "Vua côn tay đường phố với công nghệ van biến thiên VVA và phanh ABS 2 piston thể thao",
    "hinhAnh": "/images/Xe/yamaha_exciter_155_vva.jpg",
    "coTheLaiThu": true,
    "soLuong": 9,
    "dongCo": "155cc 4 van biến thiên VVA",
    "congSuat": "17.9 HP / 9.500 rpm",
    "tieuHaoNhienLieu": "2.09 L/100km",
    "phanh": "Đĩa trước 2 piston ABS, đĩa sau",
    "thongSoKyThuat": "155cc 4 van biến thiên VVA, 17.9 mã lực, Phanh ABS 2 piston, Bộ ly hợp A&S",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM012",
    "tenXe": "Yamaha Grande Hybrid",
    "hang": "Yamaha",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 49500000,
    "mauSac": "Trắng ngọc trai, Đỏ nhám, Xanh xám",
    "moTa": "Mẫu xe ga tiết kiệm xăng số 1 Việt Nam với công nghệ Hybrid trợ lực điện êm ái nhẹ nhàng",
    "hinhAnh": "/images/Xe/yamaha_grande_hybrid.jpg",
    "coTheLaiThu": true,
    "soLuong": 7,
    "dongCo": "124.9cc Blue Core Hybrid trợ lực điện",
    "congSuat": "8.3 HP / 6.500 rpm",
    "tieuHaoNhienLieu": "1.66 L/100km",
    "phanh": "Đĩa trước ABS, tang trống sau",
    "thongSoKyThuat": "124.9cc Blue Core Hybrid trợ lực điện, Tiết kiệm xăng số 1 (1.66L/100km), Phanh ABS",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM013",
    "tenXe": "Yamaha NVX 155 VVA",
    "hang": "Yamaha",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 55500000,
    "mauSac": "Đen vàng, Xám ánh xanh, Đỏ đen Monster",
    "moTa": "Maxi-scooter thể thao dành cho nam giới, kết nối điện thoại Y-Connect thông minh",
    "hinhAnh": "/images/Xe/yamaha_nvx_155_vva.jpg",
    "coTheLaiThu": true,
    "soLuong": 5,
    "dongCo": "155.1cc Blue Core VVA làm mát két nước",
    "congSuat": "15.1 HP / 8.000 rpm",
    "tieuHaoNhienLieu": "2.23 L/100km",
    "phanh": "Đĩa trước ABS, tang trống sau",
    "thongSoKyThuat": "155.1cc VVA, Phanh ABS trước, Kết nối Y-Connect, Khóa SmartKey",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM014",
    "tenXe": "Yamaha PG-1 Scrambler",
    "hang": "Yamaha",
    "phanKhuc": "Xe số",
    "giaNiemYet": 30437000,
    "mauSac": "Vàng cát, Xanh rêu, Nâu đất, Đen bạc",
    "moTa": "Dòng xe số dã ngoại Scrambler cá tính gây sốt giới trẻ, ghi đông cao lốp gai đa địa hình",
    "hinhAnh": "/images/Xe/yamaha_pg_1.jpg",
    "coTheLaiThu": true,
    "soLuong": 10,
    "dongCo": "113.7cc 4 kỳ làm mát không khí",
    "congSuat": "8.9 HP / 7.000 rpm",
    "tieuHaoNhienLieu": "1.69 L/100km",
    "phanh": "Đĩa trước, tang trống sau",
    "thongSoKyThuat": "113.7cc làm mát không khí, Lốp gai địa hình khối lớn, Yên đôi rời phong cách bụi bặm",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM015",
    "tenXe": "Yamaha Sirius FI",
    "hang": "Yamaha",
    "phanKhuc": "Xe số",
    "giaNiemYet": 21100000,
    "mauSac": "Đỏ đen, Đen nhám, Xám đen, Xanh bạc",
    "moTa": "Xe số quốc dân của Yamaha, tăng tốc nhạy bén và cực kỳ bền bỉ trên mọi nẻo đường",
    "hinhAnh": "/images/Xe/yamaha_sirius_fi.jpg",
    "coTheLaiThu": true,
    "soLuong": 14,
    "dongCo": "115cc phun xăng điện tử FI",
    "congSuat": "8.7 HP / 7.000 rpm",
    "tieuHaoNhienLieu": "1.65 L/100km",
    "phanh": "Đĩa trước, tang trống sau",
    "thongSoKyThuat": "115cc FI phun xăng điện tử, Động cơ bốc, Tiết kiệm nhiên liệu vượt trội",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM016",
    "tenXe": "Yamaha Janus 125",
    "hang": "Yamaha",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 28600000,
    "mauSac": "Xanh đen, Trắng ngọc trai, Đỏ nhung",
    "moTa": "Thiết kế trẻ trung năng động dành cho sinh viên và giới trẻ đô thị năng động",
    "hinhAnh": "/images/Xe/yamaha_janus_125.jpg",
    "coTheLaiThu": true,
    "soLuong": 8,
    "dongCo": "125cc Blue Core 4 thì làm mát không khí",
    "congSuat": "9.4 HP / 8.000 rpm",
    "tieuHaoNhienLieu": "1.87 L/100km",
    "phanh": "Đĩa trước, tang trống sau",
    "thongSoKyThuat": "125cc Blue Core, Khóa thông minh SmartKey, Cốp rộng 14L, Đồng hồ LCD",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM017",
    "tenXe": "Yamaha FreeGo 125",
    "hang": "Yamaha",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 34100000,
    "mauSac": "Đỏ đen, Xám đen nhám, Xanh rêu",
    "moTa": "Tay ga thể thao trang bị phanh ABS giá tốt nhất phân khúc, nắp bình xăng trước tiện lợi",
    "hinhAnh": "/images/Xe/yamaha_freego_125.png",
    "coTheLaiThu": true,
    "soLuong": 6,
    "dongCo": "125cc Blue Core làm mát không khí",
    "congSuat": "9.5 HP / 8.000 rpm",
    "tieuHaoNhienLieu": "2.03 L/100km",
    "phanh": "Đĩa trước ABS, tang trống sau",
    "thongSoKyThuat": "125cc Blue Core, Phanh ABS bánh trước, Cốp 25L, Nắp xăng ngoài tiện lợi",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM018",
    "tenXe": "Yamaha Latte 125",
    "hang": "Yamaha",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 38300000,
    "mauSac": "Trắng tinh khôi, Đỏ đô, Bạc ánh kim",
    "moTa": "Cốp xe cực đại 37L đáy phẳng, khóa thông minh SmartKey cùng trọng lượng nhẹ chỉ 100kg",
    "hinhAnh": "/images/Xe/yamaha_latte_125.jpg",
    "coTheLaiThu": true,
    "soLuong": 5,
    "dongCo": "125cc Blue Core êm ái",
    "congSuat": "8.3 HP / 6.500 rpm",
    "tieuHaoNhienLieu": "1.80 L/100km",
    "phanh": "Đĩa trước, tang trống sau",
    "thongSoKyThuat": "125cc Blue Core, Cốp 37L đáy phẳng cực đại, SmartKey, Nắp xăng trước",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM019",
    "tenXe": "Yamaha Jupiter Finn",
    "hang": "Yamaha",
    "phanKhuc": "Xe số",
    "giaNiemYet": 27700000,
    "mauSac": "Xám bạc, Xanh ánh kim, Đỏ đen",
    "moTa": "Xe số gia đình cao cấp đầu tiên trang bị hệ thống phanh kết hợp UBS chống trượt bánh",
    "hinhAnh": "/images/Xe/yamaha_jupiter_finn.jpg",
    "coTheLaiThu": true,
    "soLuong": 6,
    "dongCo": "113.7cc FI làm mát không khí",
    "congSuat": "9.0 HP / 7.000 rpm",
    "tieuHaoNhienLieu": "1.64 L/100km",
    "phanh": "Phanh kết hợp UBS an toàn",
    "thongSoKyThuat": "113.7cc FI, Phanh kết hợp UBS, Hộc để đồ phía trước, Tiết kiệm xăng 1.64L/100km",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM020",
    "tenXe": "Yamaha YZF-R15 V4",
    "hang": "Yamaha",
    "phanKhuc": "Xe côn tay",
    "giaNiemYet": 78000000,
    "mauSac": "Xanh GP R-Series, Đen bóng Metallic",
    "moTa": "Siêu phẩm sportbike trang bị hệ thống sang số nhanh Quickshifter và kiểm soát lực kéo TCS",
    "hinhAnh": "/images/Xe/yamaha_yzf_r15_v4.jpg",
    "coTheLaiThu": true,
    "soLuong": 4,
    "dongCo": "155cc VVA, 4 van SOHC làm mát chất lỏng",
    "congSuat": "18.4 HP / 10.000 rpm",
    "tieuHaoNhienLieu": "2.30 L/100km",
    "phanh": "Đĩa trước sau, ABS 2 kênh, Quickshifter",
    "thongSoKyThuat": "155cc VVA, Quickshifter 1 chiều, Kiểm soát lực kéo TCS, Phanh ABS 2 kênh",
    "xuatXu": "Indonesia"
  },
  {
    "id": "XM021",
    "tenXe": "Vespa 946 Dragon",
    "hang": "Piaggio & Vespa",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 458000000,
    "mauSac": "Vàng ánh kim họa tiết Rồng huyền thoại",
    "moTa": "Kiệt tác tay ga giới hạn toàn cầu tôn vinh năm Giáp Thìn, thân xe đúc nhôm thủ công tinh xảo",
    "hinhAnh": "/images/Xe/vespa_946_dragon.jpg",
    "coTheLaiThu": true,
    "soLuong": 2,
    "dongCo": "155cc 3V i-Get làm mát gió cưỡng bức",
    "congSuat": "12.7 HP / 7.750 rpm",
    "tieuHaoNhienLieu": "2.40 L/100km",
    "phanh": "Đĩa trước sau, ABS 2 kênh, kiểm soát lực kéo ASR",
    "thongSoKyThuat": "155cc 3V i-Get, Thân xe nguyên khối đúc nhôm thủ công, ABS 2 kênh, Chống trượt ASR",
    "xuatXu": "Nhập khẩu (Ý)"
  },
  {
    "id": "XM022",
    "tenXe": "Vespa GTS Super Sport 150",
    "hang": "Piaggio & Vespa",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 137000000,
    "mauSac": "Trắng Innocente, Cam Tramonto, Đen bóng",
    "moTa": "Khung xe lớn bệ vệ đầm chắc, tem thể thao tương phản cá tính cùng màn hình đồng hồ hiện đại",
    "hinhAnh": "/images/Xe/vespa_gts_super_sport_150.jpg",
    "coTheLaiThu": true,
    "soLuong": 4,
    "dongCo": "155cc i-Get 4 van làm mát dung dịch",
    "congSuat": "15.6 HP / 8.250 rpm",
    "tieuHaoNhienLieu": "2.50 L/100km",
    "phanh": "Đĩa trước sau đường kính lớn, ABS 2 kênh",
    "thongSoKyThuat": "155cc i-Get 4V, Phanh ABS 2 kênh, Khóa thông minh SmartKey, Màn hình LCD",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM023",
    "tenXe": "Vespa GTS Touring 300",
    "hang": "Piaggio & Vespa",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 179000000,
    "mauSac": "Xanh Rêu Foresta, Xám Materia",
    "moTa": "Động cơ HPE 300cc mạnh nhất của Vespa, kính chắn gió và baga chở đồ chuyên đi tour xa",
    "hinhAnh": "/images/Xe/vespa_gts_touring_300.jpg",
    "coTheLaiThu": true,
    "soLuong": 3,
    "dongCo": "278cc HPE hiệu năng cao 4 van",
    "congSuat": "23.8 HP / 8.250 rpm",
    "tieuHaoNhienLieu": "3.20 L/100km",
    "phanh": "Đĩa trước sau ABS 2 kênh, kiểm soát ASR",
    "thongSoKyThuat": "278cc HPE 23.8 mã lực, ABS 2 kênh, Kính chắn gió touring, Baga sau cao cấp",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM024",
    "tenXe": "Vespa Primavera 125 ABS",
    "hang": "Piaggio & Vespa",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 77800000,
    "mauSac": "Trắng mây, Xanh biển sâu, Cam đào, Hồng",
    "moTa": "Biểu tượng thời trang nước Ý với đèn pha tròn cổ điển, thân thép liền khối quyến rũ",
    "hinhAnh": "/images/Xe/vespa_primavera_125.jpg",
    "coTheLaiThu": true,
    "soLuong": 7,
    "dongCo": "124.5cc i-Get 3 van",
    "congSuat": "10.6 HP / 7.700 rpm",
    "tieuHaoNhienLieu": "2.38 L/100km",
    "phanh": "Đĩa trước ABS, tang trống sau",
    "thongSoKyThuat": "124.5cc i-Get 3V, Phanh ABS trước, Đèn Full LED 2 tầng, Cổng sạc USB cốp trước",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM025",
    "tenXe": "Vespa Sei Giorni II",
    "hang": "Piaggio & Vespa",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 199000000,
    "mauSac": "Xám mờ Sei Giorni thể thao số 47",
    "moTa": "Phiên bản kỷ niệm chiến thắng giải đua 6 ngày lịch sử, đèn pha gắn dè trước độc bản",
    "hinhAnh": "/images/Xe/vespa_sei_giorni_ii.jpg",
    "coTheLaiThu": true,
    "soLuong": 2,
    "dongCo": "278cc HPE 4 thì làm mát dung dịch",
    "congSuat": "23.8 HP / 8.250 rpm",
    "tieuHaoNhienLieu": "3.15 L/100km",
    "phanh": "Đĩa trước sau ABS 2 kênh",
    "thongSoKyThuat": "278cc HPE, Đèn pha fano basso dè trước kinh điển, Yên đơn thể thao phong cách cổ",
    "xuatXu": "Nhập khẩu (Ý)"
  },
  {
    "id": "XM026",
    "tenXe": "Vespa Sprint S 125",
    "hang": "Piaggio & Vespa",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 81300000,
    "mauSac": "Đen nhám, Xám xi măng, Vàng mờ, Đỏ bóng",
    "moTa": "Đèn pha lục lăng thể thao góc cạnh nam tính, đường viền đỏ nổi bật phong cách thành thị",
    "hinhAnh": "/images/Xe/vespa_sprint_s_125.jpg",
    "coTheLaiThu": true,
    "soLuong": 9,
    "dongCo": "124.5cc i-Get xi-lanh đơn",
    "congSuat": "10.6 HP / 7.700 rpm",
    "tieuHaoNhienLieu": "2.40 L/100km",
    "phanh": "Đĩa trước ABS, tang trống sau",
    "thongSoKyThuat": "124.5cc i-Get, Phanh ABS trước, Đèn pha lục giác LED, Mâm 12 inch thể thao",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM027",
    "tenXe": "Piaggio Beverly 400",
    "hang": "Piaggio & Vespa",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 235000000,
    "mauSac": "Đen nhám Meteora, Cam Arancio, Bạc Argento",
    "moTa": "Maxi-scooter bánh lớn đẳng cấp thượng lưu, công suất 35.4 mã lực bức phá mọi hành trình",
    "hinhAnh": "/images/Xe/piaggio_beverly_400.jpg",
    "coTheLaiThu": true,
    "soLuong": 3,
    "dongCo": "399cc hpe thế hệ mới",
    "congSuat": "35.4 HP / 7.500 rpm",
    "tieuHaoNhienLieu": "3.70 L/100km",
    "phanh": "Đĩa đôi trước sau ABS & ASR",
    "thongSoKyThuat": "399cc hpe 35.4 HP, Phanh ABS 2 kênh, Khóa Keyless, Đồng hồ 5.5 inch LCD",
    "xuatXu": "Nhập khẩu (Ý)"
  },
  {
    "id": "XM028",
    "tenXe": "Piaggio Liberty 125 S",
    "hang": "Piaggio & Vespa",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 57700000,
    "mauSac": "Xám titan, Trắng tuyết, Đen nhám",
    "moTa": "Mẫu xe ga bánh lớn thanh thoát, phanh ABS chống bó cứng an toàn khi đi trời mưa trơn trượt",
    "hinhAnh": "/images/Xe/piaggio_liberty_125_s.jpg",
    "coTheLaiThu": true,
    "soLuong": 8,
    "dongCo": "124.5cc i-Get 3 van",
    "congSuat": "10.2 HP / 7.600 rpm",
    "tieuHaoNhienLieu": "2.42 L/100km",
    "phanh": "Đĩa trước ABS, tang trống sau",
    "thongSoKyThuat": "124.5cc i-Get 3 van, Phanh ABS bánh trước, Bánh lớn 16 inch vượt chướng ngại êm ái",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM029",
    "tenXe": "Piaggio Medley S 150",
    "hang": "Piaggio & Vespa",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 95300000,
    "mauSac": "Nâu mờ Terra, Đen bóng Lucido, Trắng",
    "moTa": "Tay ga bánh lớn cao cấp trang bị động cơ 16.2 mã lực, cốp cực lớn 36L và hệ thống ngắt Start-Stop",
    "hinhAnh": "/images/Xe/piaggio_medley_s_150.jpg",
    "coTheLaiThu": true,
    "soLuong": 5,
    "dongCo": "155cc i-Get 4 van làm mát dung dịch",
    "congSuat": "16.2 HP / 8.750 rpm",
    "tieuHaoNhienLieu": "2.30 L/100km",
    "phanh": "Đĩa trước sau ABS 2 kênh",
    "thongSoKyThuat": "155cc i-Get 4V 16.2 HP, Phanh ABS 2 kênh, Start-Stop RISS, Kết nối Piaggio MIA",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM030",
    "tenXe": "Piaggio Zip 100",
    "hang": "Piaggio & Vespa",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 36000000,
    "mauSac": "Đỏ tươi, Trắng tinh khôi, Đen bóng",
    "moTa": "Xe ga nhỏ gọn linh hoạt nhất của Piaggio, chiều cao yên điều chỉnh 3 nấc phù hợp phái đẹp",
    "hinhAnh": "/images/Xe/piaggio_zip_100.jpg",
    "coTheLaiThu": true,
    "soLuong": 6,
    "dongCo": "96cc 4 thì làm mát gió",
    "congSuat": "5.7 HP / 6.750 rpm",
    "tieuHaoNhienLieu": "2.20 L/100km",
    "phanh": "Đĩa trước, tang trống sau",
    "thongSoKyThuat": "96cc 4 thì, Yên xe chỉnh 3 mức độ cao, Trọng lượng nhẹ chỉ 89kg luồn lách phố hẹp",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM031",
    "tenXe": "Suzuki Raider R150",
    "hang": "Suzuki",
    "phanKhuc": "Xe côn tay",
    "giaNiemYet": 51190000,
    "mauSac": "Xanh đen MotoGP, Đỏ đen thể thao",
    "moTa": "Ông hoàng tốc độ phân khúc 150cc, động cơ DOHC thuần túy bốc hàng đầu phân khúc",
    "hinhAnh": "/images/Xe/suzuki_raider_r150.jpg",
    "coTheLaiThu": true,
    "soLuong": 8,
    "dongCo": "147.3cc DOHC 4 van két nước lớn",
    "congSuat": "18.5 HP / 10.000 rpm",
    "tieuHaoNhienLieu": "2.27 L/100km",
    "phanh": "Đĩa trước & sau",
    "thongSoKyThuat": "147.3cc DOHC 4 van làm mát két nước lớn, Công suất cực đại 18.5 mã lực",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM032",
    "tenXe": "Suzuki Satria F150",
    "hang": "Suzuki",
    "phanKhuc": "Xe côn tay",
    "giaNiemYet": 53490000,
    "mauSac": "Xanh Titan, Trắng đỏ, Đen mờ",
    "moTa": "Mẫu xe côn tay Hyper Underbone nhập khẩu nguyên chiếc từ Indonesia, gia tốc cực kỳ ấn tượng",
    "hinhAnh": "/images/Xe/suzuki_satria_f150.jpg",
    "coTheLaiThu": true,
    "soLuong": 7,
    "dongCo": "147.3cc DOHC làm mát dung dịch",
    "congSuat": "18.5 HP / 10.000 rpm",
    "tieuHaoNhienLieu": "2.27 L/100km",
    "phanh": "Đĩa trước sau kiểu lượn sóng",
    "thongSoKyThuat": "147.3cc DOHC, Phun xăng điện tử Fi, Đồng hồ kỹ thuật số Full LCD",
    "xuatXu": "Indonesia"
  },
  {
    "id": "XM033",
    "tenXe": "Suzuki Burgman Street 125",
    "hang": "Suzuki",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 48600000,
    "mauSac": "Vàng đồng, Xám mờ, Đen bóng",
    "moTa": "Thiết kế maxi-scooter bệ vệ chuẩn Châu Âu, sàn để chân rộng rãi cho tư thế ngồi duỗi thẳng chân",
    "hinhAnh": "/images/Xe/suzuki_burgman_street_125.jpg",
    "coTheLaiThu": true,
    "soLuong": 5,
    "dongCo": "124.3cc công nghệ SEP siêu êm",
    "congSuat": "8.7 HP / 6.750 rpm",
    "tieuHaoNhienLieu": "1.96 L/100km",
    "phanh": "Đĩa trước CBS, tang trống sau",
    "thongSoKyThuat": "124.3cc động cơ SEP, Thiết kế Maxi-Scooter phong cách Châu Âu bề thế",
    "xuatXu": "Nhập khẩu (Ấn Độ)"
  },
  {
    "id": "XM034",
    "tenXe": "Suzuki GSX-R150",
    "hang": "Suzuki",
    "phanKhuc": "Xe côn tay",
    "giaNiemYet": 71500000,
    "mauSac": "Xanh đen GP Ecstar, Đen vành đỏ",
    "moTa": "Sportbike 150cc mạnh nhất phân khúc với 19.2 mã lực và khóa thông minh chống trộm tiện ích",
    "hinhAnh": "/images/Xe/suzuki_gsx_r150.jpg",
    "coTheLaiThu": true,
    "soLuong": 4,
    "dongCo": "147.3cc DOHC 4 van làm mát két nước",
    "congSuat": "19.2 HP / 10.500 rpm",
    "tieuHaoNhienLieu": "2.43 L/100km",
    "phanh": "Đĩa trước sau ABS, SmartKey",
    "thongSoKyThuat": "147.3cc DOHC 19.2 HP, Phanh ABS trước sau, Khóa thông minh SmartKey, Đèn pha LED",
    "xuatXu": "Indonesia"
  },
  {
    "id": "XM035",
    "tenXe": "Suzuki GSX-S150",
    "hang": "Suzuki",
    "phanKhuc": "Xe côn tay",
    "giaNiemYet": 54400000,
    "mauSac": "Đen mờ Titan, Xanh đen",
    "moTa": "Naked bike đường phố gọn gàng mạnh mẽ, tư thế lái thẳng lưng thoải mái di chuyển trong đô thị",
    "hinhAnh": "/images/Xe/suzuki_gsx_s150.jpg",
    "coTheLaiThu": true,
    "soLuong": 5,
    "dongCo": "147.3cc DOHC làm mát chất lỏng",
    "congSuat": "19.2 HP / 10.500 rpm",
    "tieuHaoNhienLieu": "2.35 L/100km",
    "phanh": "Đĩa trước sau hình lượn sóng",
    "thongSoKyThuat": "147.3cc DOHC 19.2 mã lực, Khung sườn kim cương siêu cứng vững, Màn hình LCD",
    "xuatXu": "Indonesia"
  },
  {
    "id": "XM036",
    "tenXe": "Suzuki V-Strom 250SX",
    "hang": "Suzuki",
    "phanKhuc": "Xe côn tay",
    "giaNiemYet": 132900000,
    "mauSac": "Vàng Champion, Cam Pearl, Đen bóng",
    "moTa": "Mẫu xe phượt Adventure đa dụng, khoảng sáng gầm 205mm vượt địa hình đèo dốc xuất sắc",
    "hinhAnh": "/images/Xe/suzuki_v_strom_250sx.jpg",
    "coTheLaiThu": true,
    "soLuong": 3,
    "dongCo": "249cc SOCS làm mát bằng dầu",
    "congSuat": "26.5 HP / 9.300 rpm",
    "tieuHaoNhienLieu": "3.10 L/100km",
    "phanh": "Đĩa trước sau ABS 2 kênh",
    "thongSoKyThuat": "249cc SOCS làm mát bằng dầu, Phanh ABS 2 kênh, Kính chắn gió cao, Cổng sạc USB",
    "xuatXu": "Nhập khẩu (Ấn Độ)"
  },
  {
    "id": "XM037",
    "tenXe": "Suzuki Address 110",
    "hang": "Suzuki",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 28290000,
    "mauSac": "Đỏ đen, Xanh đen, Trắng bạc",
    "moTa": "Tay ga thanh thoát trọng lượng siêu nhẹ 97kg, cốp chứa đồ 20.6L rộng rãi cho chị em phụ nữ",
    "hinhAnh": "/images/Xe/suzuki_address_110.jpg",
    "coTheLaiThu": true,
    "soLuong": 6,
    "dongCo": "113cc SEP tiết kiệm xăng",
    "congSuat": "9.1 HP / 8.000 rpm",
    "tieuHaoNhienLieu": "1.86 L/100km",
    "phanh": "Đĩa trước, tang trống sau",
    "thongSoKyThuat": "113cc SEP làm mát không khí, Cốp xe 20.6L chứa vừa mũ full-face, Sàn để chân rộng",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM038",
    "tenXe": "Suzuki Avenis 125",
    "hang": "Suzuki",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 39000000,
    "mauSac": "Trắng mờ, Xanh neon thể thao, Đen bóng",
    "moTa": "Mẫu xe ga thể thao góc cạnh, nắp bình xăng đặt ngoài đuôi xe độc đáo không cần mở cốp",
    "hinhAnh": "/images/Xe/suzuki_avenis_125.jpg",
    "coTheLaiThu": true,
    "soLuong": 5,
    "dongCo": "124.3cc SEP thế hệ mới",
    "congSuat": "8.7 HP / 6.750 rpm",
    "tieuHaoNhienLieu": "1.95 L/100km",
    "phanh": "Đĩa trước CBS, tang trống sau",
    "thongSoKyThuat": "124.3cc SEP, Nắp bình xăng phía sau đuôi xe, Đồng hồ điện tử, Đèn LED đôi",
    "xuatXu": "Nhập khẩu (Ấn Độ)"
  },
  {
    "id": "XM039",
    "tenXe": "Suzuki GD110HU",
    "hang": "Suzuki",
    "phanKhuc": "Xe côn tay",
    "giaNiemYet": 27900000,
    "mauSac": "Đen mờ cổ điển, Đỏ đen",
    "moTa": "Dòng xe côn tay backbone cổ điển hoài niệm, bình xăng giọt nước phía trước dễ độ phong cách Cafe Racer",
    "hinhAnh": "/images/Xe/suzuki_gd110hu.jpg",
    "coTheLaiThu": true,
    "soLuong": 6,
    "dongCo": "112.8cc 4 kỳ xi-lanh đơn",
    "congSuat": "8.0 HP / 8.000 rpm",
    "tieuHaoNhienLieu": "1.75 L/100km",
    "phanh": "Tang trống trước sau",
    "thongSoKyThuat": "112.8cc côn tay 4 số, Bình xăng giọt nước 9.2L, Phuộc sau 5 cấp độ tải trọng",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM040",
    "tenXe": "Suzuki Impulse 125",
    "hang": "Suzuki",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 31990000,
    "mauSac": "Xanh mờ, Đen mờ vàng, Trắng xanh",
    "moTa": "Tay ga thể thao phong cách mạnh mẽ, vành đúc 16 inch lớn di chuyển êm ái qua gờ giảm tốc",
    "hinhAnh": "/images/Xe/suzuki_impulse_125.jpg",
    "coTheLaiThu": true,
    "soLuong": 5,
    "dongCo": "124cc phun xăng điện tử DCP-FI",
    "congSuat": "9.2 HP / 8.000 rpm",
    "tieuHaoNhienLieu": "2.34 L/100km",
    "phanh": "Đĩa trước, tang trống sau",
    "thongSoKyThuat": "124cc DCP-FI, Vành đúc 16 inch bề thế, Cốp xe rộng rãi, Đèn đuôi lấy cảm hứng GSX",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM041",
    "tenXe": "SYM Attila 125",
    "hang": "SYM",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 33700000,
    "mauSac": "Trắng thanh lịch, Đỏ mận, Đen mờ",
    "moTa": "Dòng xe ga huyền thoại gắn liền với phụ nữ Việt Nam, nắp bình xăng dời lên trước tiện lợi",
    "hinhAnh": "/images/Xe/sym_attila_125.jpg",
    "coTheLaiThu": true,
    "soLuong": 8,
    "dongCo": "124.6cc E-Power làm mát không khí",
    "congSuat": "10.3 HP / 8.500 rpm",
    "tieuHaoNhienLieu": "1.99 L/100km",
    "phanh": "Đĩa trước CBS, tang trống sau",
    "thongSoKyThuat": "124.6cc E-Power phun xăng điện tử, Đèn LED toàn phần, Cổng sạc USB trước",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM042",
    "tenXe": "SYM Tuscany 150",
    "hang": "SYM",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 45000000,
    "mauSac": "Xanh ngọc, Trắng ngọc trai, Xám xi măng",
    "moTa": "Phong cách cổ điển nước Ý quý phái, khóa thông minh Smartkey cùng màn hình kỹ thuật số sang trọng",
    "hinhAnh": "/images/Xe/sym_tuscany_150.jpg",
    "coTheLaiThu": true,
    "soLuong": 6,
    "dongCo": "149.6cc làm mát không khí",
    "congSuat": "11.5 HP / 8.000 rpm",
    "tieuHaoNhienLieu": "2.45 L/100km",
    "phanh": "Đĩa trước sau CBS an toàn",
    "thongSoKyThuat": "149.6cc 4 thì, Phanh đĩa CBS 2 bánh, Khóa thông minh SmartKey, Màn hình LCD màu",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM043",
    "tenXe": "SYM Shark 50",
    "hang": "SYM",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 24500000,
    "mauSac": "Xanh nhám, Trắng, Đen mờ",
    "moTa": "Xe ga 50cc phong cách thể thao cho học sinh cấp 3, không yêu cầu giấy phép lái xe A1",
    "hinhAnh": "/images/Xe/sym_shark_50.jpg",
    "coTheLaiThu": true,
    "soLuong": 10,
    "dongCo": "49.5cc không cần bằng lái",
    "congSuat": "3.3 HP / 8.000 rpm",
    "tieuHaoNhienLieu": "1.97 L/100km",
    "phanh": "Đĩa trước, tang trống sau",
    "thongSoKyThuat": "49.5cc làm mát không khí, Không cần bằng lái, Nắp bình xăng phía trước, Cốp lớn",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM044",
    "tenXe": "SYM Priti 50",
    "hang": "SYM",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 26000000,
    "mauSac": "Hồng Pastel, Xanh bạc hà, Trắng sữa",
    "moTa": "Dòng xe ga mini dễ thương trọng lượng siêu nhẹ 93kg dành riêng cho các bạn nữ sinh",
    "hinhAnh": "/images/Xe/sym_priti_50.jpg",
    "coTheLaiThu": true,
    "soLuong": 8,
    "dongCo": "49.5cc êm ái bền bỉ",
    "congSuat": "3.3 HP / 8.000 rpm",
    "tieuHaoNhienLieu": "1.81 L/100km",
    "phanh": "Đĩa trước, tang trống sau",
    "thongSoKyThuat": "49.5cc 4 thì siêu êm, Trọng lượng 93kg, Gương xoay thời trang, Cốp xe tiện dụng",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM045",
    "tenXe": "SYM Star SR 170",
    "hang": "SYM",
    "phanKhuc": "Xe côn tay",
    "giaNiemYet": 52400000,
    "mauSac": "Đỏ đen thể thao, Xanh đen",
    "moTa": "Dung tích động cơ 174.5cc lớn nhất phân khúc Underbone phổ thông, trang bị phanh chống bó cứng ABS",
    "hinhAnh": "/images/Xe/sym_star_sr_170.jpg",
    "coTheLaiThu": true,
    "soLuong": 5,
    "dongCo": "174.5cc Ecotech 4 van làm mát dung dịch",
    "congSuat": "15.0 HP / 8.500 rpm",
    "tieuHaoNhienLieu": "2.30 L/100km",
    "phanh": "Đĩa trước ABS, đĩa sau",
    "thongSoKyThuat": "174.5cc Ecotech 4V, Phanh ABS trước, Hộp số 6 cấp, Khung sườn gia cường thể thao",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM046",
    "tenXe": "SYM Galaxy 125",
    "hang": "SYM",
    "phanKhuc": "Xe số",
    "giaNiemYet": 25200000,
    "mauSac": "Đỏ đen, Đen nhám vành đúc",
    "moTa": "Xe số thể thao nam tính với hộc chứa đồ phía trước cùng cốp xe tiện ích",
    "hinhAnh": "/images/Xe/sym_galaxy_125.jpg",
    "coTheLaiThu": true,
    "soLuong": 7,
    "dongCo": "124.6cc E-Power bền bỉ",
    "congSuat": "9.9 HP / 8.500 rpm",
    "tieuHaoNhienLieu": "1.70 L/100km",
    "phanh": "Đĩa trước, tang trống sau",
    "thongSoKyThuat": "124.6cc E-Power, Vành đúc thể thao, Hộc đồ đầu xe, Đèn định vị LED sắc sảo",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM047",
    "tenXe": "SYM Elegant 110",
    "hang": "SYM",
    "phanKhuc": "Xe số",
    "giaNiemYet": 16700000,
    "mauSac": "Đỏ đen, Xanh đen, Đen mờ",
    "moTa": "Mẫu xe số kinh tế giá rẻ nhất thị trường, tiết kiệm xăng bền bỉ cho người lao động",
    "hinhAnh": "/images/Xe/sym_elegant_110.jpg",
    "coTheLaiThu": true,
    "soLuong": 12,
    "dongCo": "110cc làm mát không khí",
    "congSuat": "7.2 HP / 7.500 rpm",
    "tieuHaoNhienLieu": "1.68 L/100km",
    "phanh": "Tang trống trước sau",
    "thongSoKyThuat": "110cc bền bỉ, Tiêu hao 1.68L/100km, Khung sườn thép chịu lực cao",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM048",
    "tenXe": "SYM Passing 125",
    "hang": "SYM",
    "phanKhuc": "Tay ga",
    "giaNiemYet": 26200000,
    "mauSac": "Đen nhám, Đỏ đen thể thao",
    "moTa": "Xe ga đường phố năng động, tay lái linh hoạt và thiết kế đèn pha đôi mắt cú hầm hố",
    "hinhAnh": "/images/Xe/sym_passing_125.jpg",
    "coTheLaiThu": true,
    "soLuong": 6,
    "dongCo": "124.6cc 4 thì làm mát gió",
    "congSuat": "8.8 HP / 8.000 rpm",
    "tieuHaoNhienLieu": "2.10 L/100km",
    "phanh": "Đĩa trước, tang trống sau",
    "thongSoKyThuat": "124.6cc phun xăng điện tử, Đèn pha đôi mắt cú, Cốp rộng, Trọng lượng nhẹ",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM049",
    "tenXe": "SYM Angela 50",
    "hang": "SYM",
    "phanKhuc": "Xe số",
    "giaNiemYet": 17500000,
    "mauSac": "Hồng trắng, Xanh trắng ngọc, Đỏ trắng",
    "moTa": "Xe số nữ tính thanh nhã cho học sinh nữ, cốp xe để vừa nón bảo hiểm nửa đầu",
    "hinhAnh": "/images/Xe/sym_angela_50.jpg",
    "coTheLaiThu": true,
    "soLuong": 9,
    "dongCo": "49.5cc không cần bằng lái A1",
    "congSuat": "2.8 HP / 7.500 rpm",
    "tieuHaoNhienLieu": "1.55 L/100km",
    "phanh": "Tang trống trước sau",
    "thongSoKyThuat": "49.5cc êm ái, Không cần bằng lái A1, Hộc đồ trước tiện lợi, Mức tiêu hao 1.55L/100km",
    "xuatXu": "Việt Nam"
  },
  {
    "id": "XM050",
    "tenXe": "SYM Abelo 110",
    "hang": "SYM",
    "phanKhuc": "Xe số",
    "giaNiemYet": 17200000,
    "mauSac": "Đen đỏ, Xanh bạc, Trắng đen",
    "moTa": "Mẫu xe số gia đình tiện dụng, yên xe êm ái cùng hệ thống đèn halogen chiếu sáng vượt trội",
    "hinhAnh": "/images/Xe/sym_abelo_110.jpg",
    "coTheLaiThu": true,
    "soLuong": 8,
    "dongCo": "110cc 4 kỳ làm mát gió",
    "congSuat": "7.5 HP / 7.500 rpm",
    "tieuHaoNhienLieu": "1.65 L/100km",
    "phanh": "Tang trống trước sau",
    "thongSoKyThuat": "110cc 4 thì, Phuộc giảm xóc dầu êm ái, Đồng hồ hiển thị rõ nét, Tiết kiệm nhiên liệu",
    "xuatXu": "Việt Nam"
  }
];

const DELETED_VEHICLES_KEY = 'crm_catalog_deleted_ids';

function getDeletedVehicleIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_VEHICLES_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function addDeletedVehicleId(id: string, name?: string) {
  try {
    const set = getDeletedVehicleIds();
    set.add(id);
    if (name) set.add(name.toLowerCase().trim());
    localStorage.setItem(DELETED_VEHICLES_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export const catalogVehicleApi = {
  getAllSync(): CatalogVehicle[] {
    const deletedIds = getDeletedVehicleIds();
    try {
      const cached = localStorage.getItem(VEHICLE_STORAGE_KEY);
      if (cached) {
        const parsed: CatalogVehicle[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(v => !deletedIds.has(v.id) && !deletedIds.has((v.tenXe || '').toLowerCase().trim()));
        }
      }
    } catch {}
    return DEFAULT_CATALOG_VEHICLES.filter(v => !deletedIds.has(v.id) && !deletedIds.has((v.tenXe || '').toLowerCase().trim()));
  },

  async getAll(): Promise<CatalogVehicle[]> {
    const deletedIds = getDeletedVehicleIds();
    let localList: CatalogVehicle[] = [];
    try {
      const cached = localStorage.getItem(VEHICLE_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localList = parsed;
        }
      }
    } catch {}

    // Khởi tạo ban đầu nếu cache rỗng
    if (localList.length === 0) {
      localList = [...DEFAULT_CATALOG_VEHICLES];
      try {
        localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(localList));
      } catch {}
    }

    // Lọc bỏ các xe trong blacklist đã bị xóa
    localList = localList.filter(v => !deletedIds.has(v.id) && !deletedIds.has((v.tenXe || '').toLowerCase().trim()));

    // Dọn dẹp triệt để trùng lặp trong localList theo ID và tên xe
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    localList = localList.filter(v => {
      if (seenIds.has(v.id)) return false;
      const cleanName = (v.tenXe || '').toLowerCase().trim();
      if (cleanName && seenNames.has(cleanName)) return false;
      seenIds.add(v.id);
      if (cleanName) seenNames.add(cleanName);
      return true;
    });

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/XeMau`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          let hasChange = false;
          data.forEach((item: any) => {
            const key = (item.tenXe || '').toLowerCase().trim();
            if (deletedIds.has(key)) return;

            // Tìm đối chiếu theo tên hoặc maXe trong localList
            const matched = localList.find(v => {
              if (item.maXe && v.maXe === item.maXe) return true;
              const vKey = (v.tenXe || '').toLowerCase().trim();
              return vKey === key || (key.length > 5 && (vKey.includes(key) || key.includes(vKey)));
            });

            if (matched) {
              if (item.maXe && !matched.maXe) {
                matched.maXe = item.maXe;
                hasChange = true;
              }
            } else {
              // Xe mới hoàn toàn từ Backend -> cấp ID duy nhất không bao giờ trùng XM001-XM050
              const maxNum = localList.reduce((max, v) => {
                const n = parseInt(v.id.replace(/\D/g, ''), 10);
                return isNaN(n) ? max : Math.max(max, n);
              }, 50);
              const newId = `XM${String(maxNum + 1).padStart(3, '0')}`;
              const newVeh: CatalogVehicle = {
                id: newId,
                maXe: item.maXe,
                tenXe: item.tenXe,
                hang: item.hangXe || 'Honda',
                phanKhuc: item.loaiXe || 'Xe ga',
                giaNiemYet: Number(item.giaNiemYet) || 0,
                mauSac: item.mauSac || 'Tiêu chuẩn',
                moTa: item.thongSoKyThuat || 'Mẫu xe chính hãng',
                hinhAnh: (item.hinhAnh && !item.hinhAnh.includes('unsplash')) ? item.hinhAnh : '/images/Xe/honda_vision_2024.jpg',
                coTheLaiThu: item.coTheLaiThu !== false,
                soLuong: 10,
                ncc: `${item.hangXe || 'Honda'} Việt Nam`,
                namSanXuat: 2025,
                xuatXu: 'Việt Nam',
                vat: 10,
                loaiDongCo: '4 kỳ, 1 xi lanh',
                trangThaiHienThi: 'Hien',
                trangThaiKinhDoanh: 'DangKinhDoanh',
                ngayTao: new Date().toISOString().split('T')[0],
              };
              localList.unshift(newVeh);
              hasChange = true;
            }
          });
          if (hasChange) {
            localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(localList));
          }
        }
      }
    } catch {}

    return localList;
  },

  async create(data: Omit<CatalogVehicle, 'id'>): Promise<{ success: boolean; vehicle: CatalogVehicle }> {
    let loaiXeBackend = data.phanKhuc || 'Xe ga';
    if (loaiXeBackend === 'Tay ga') loaiXeBackend = 'Xe ga';
    else if (loaiXeBackend === 'Côn tay') loaiXeBackend = 'Xe côn tay';

    let newMaXe: number | undefined;
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/XeMau`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenXe: data.tenXe,
          hangXe: data.hang,
          loaiXe: loaiXeBackend,
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

    let curList: CatalogVehicle[] = [];
    try {
      const cached = localStorage.getItem(VEHICLE_STORAGE_KEY);
      if (cached) curList = JSON.parse(cached);
    } catch {}
    const maxNum = (curList.length > 0 ? curList : DEFAULT_CATALOG_VEHICLES).reduce((max, v) => {
      const n = parseInt(v.id.replace(/\D/g, ''), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 50);
    const newId = `XM${String(maxNum + 1).padStart(3, '0')}`;
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
      let list: CatalogVehicle[] = cached ? JSON.parse(cached) : [...DEFAULT_CATALOG_VEHICLES];
      list.unshift(newVehicle);
      localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(list));

      const delSet = getDeletedVehicleIds();
      if (delSet.has(newId) || delSet.has((newVehicle.tenXe || '').toLowerCase().trim())) {
        delSet.delete(newId);
        if (newVehicle.tenXe) delSet.delete(newVehicle.tenXe.toLowerCase().trim());
        localStorage.setItem(DELETED_VEHICLES_KEY, JSON.stringify(Array.from(delSet)));
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_catalog' } }));
    return { success: true, vehicle: newVehicle };
  },

  async update(id: string, data: Partial<CatalogVehicle>): Promise<{ success: boolean }> {
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

    const maXe = data.maXe || parseInt(id.replace(/\D/g, ''), 10);
    if (!isNaN(maXe) && maXe > 0 && data.tenXe) {
      let loaiXeBackend = data.phanKhuc || 'Xe ga';
      if (loaiXeBackend === 'Tay ga') loaiXeBackend = 'Xe ga';
      else if (loaiXeBackend === 'Côn tay') loaiXeBackend = 'Xe côn tay';

      try {
        await fetchWithTimeout(`${API_BASE_URL}/XeMau/${maXe}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenXe: data.tenXe,
            hangXe: data.hang,
            loaiXe: loaiXeBackend,
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
    let deletedName = '';
    try {
      const cached = localStorage.getItem(VEHICLE_STORAGE_KEY);
      if (cached) {
        const list: CatalogVehicle[] = JSON.parse(cached);
        const target = list.find(v => v.id === id);
        if (target) deletedName = target.tenXe;
        const filtered = list.filter(v => v.id !== id);
        localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch {}

    addDeletedVehicleId(id, deletedName);

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

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'vehicle_catalog' } }));
    return { success: true };
  },
};

// ────────────────────────────────────────────────────────────
// 8. ĐÁNH GIÁ & PHẢN HỒI API (FEEDBACK & REVIEWS)
// ────────────────────────────────────────────────────────────
const FEEDBACK_STORAGE_KEY = 'crm_feedbacks';
const CHAT_STORAGE_KEY = 'crm_chat_messages';

export interface PinnedChatContext {
  title?: string;
  productName: string;
  productImage?: string;
  orderId?: string;
  rating?: number;
  comment?: string;
  price?: number;
  category?: string;
}

export interface ChatMessage {
  id: string;
  customerId: string;
  sender: 'staff' | 'customer';
  senderName: string;
  content: string;
  sentAt: string;
  pinnedContext?: PinnedChatContext | null;
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
            const mockMatch = mockFeedbacks.find(f => f.id === id);

            const isBikeContent = (item.noiDung || '').toLowerCase().includes('xe') || (item.tenXe != null);
            const isPartContent = (item.noiDung || '').toLowerCase().includes('phụ') || (item.tenPhuTung != null);

            const pName = item.tenPhuTung || item.tenXe || (isBikeContent ? 'Honda SH 160i ABS 2025' : isPartContent ? 'Phụ tùng chính hãng Motoshop' : (item.productName || mockMatch?.productName));
            const pType: 'PhuTung' | 'XeMau' | 'DichVu' = item.tenPhuTung || isPartContent
              ? 'PhuTung'
              : item.tenXe || isBikeContent
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
              phanHoiCuaShop: item.phanHoiCuaShop || item.ghiChuXuLy || mockMatch?.phanHoiCuaShop || mockMatch?.ghiChuXuLy,
              ngayPhanHoi: item.ngayPhanHoi || item.ngayXuLy || mockMatch?.ngayPhanHoi || mockMatch?.ngayXuLy,
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
                const existingIdx = mapped.findIndex(m => m.id === lf.id || (parseInt(m.id.replace(/\D/g, ''), 10) > 0 && parseInt(m.id.replace(/\D/g, ''), 10) === parseInt(lf.id.replace(/\D/g, ''), 10)));
                if (existingIdx !== -1) {
                  mapped[existingIdx] = {
                    ...mapped[existingIdx],
                    ...lf,
                    productName: lf.productName || mapped[existingIdx].productName,
                    productType: lf.productType || mapped[existingIdx].productType,
                    productId: lf.productId || mapped[existingIdx].productId,
                    hinhAnhDinhKem: (lf.hinhAnhDinhKem && lf.hinhAnhDinhKem.length > 0) ? lf.hinhAnhDinhKem : mapped[existingIdx].hinhAnhDinhKem,
                  };
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
    orderId?: string;
    hinhAnhDinhKem?: string[];
  }): Promise<{ success: boolean; feedback: Feedback }> {
    const maKhInt = parseInt(data.customerId.replace(/\D/g, ''), 10) || 1;
    let newMaPH: number | undefined;

    // DG01: Đảm bảo finalProductId luôn là chuỗi ký tự hợp lệ, tránh lỗi .startsWith trên kiểu số
    let finalProductId = data.productId !== undefined && data.productId !== null ? String(data.productId).trim() : undefined;
    let finalProductType = data.productType;

    // Chuẩn hóa nếu productId là số thuần túy (VD: 1 -> PT001)
    if (finalProductId && /^\d+$/.test(finalProductId)) {
      const num = parseInt(finalProductId, 10);
      if (finalProductType === 'XeMau') {
        finalProductId = num < 10 ? `XM00${num}` : `XM0${num}`;
      } else {
        finalProductId = num < 10 ? `PT00${num}` : `PT0${num}`;
      }
    }

    // Tự động phân giải ID xe hoặc phụ tùng nếu chưa có hoặc nếu ID là placeholder (XM-HD01) hoặc chưa đúng định dạng chuẩn
    const isPlaceholderOrUnknown = !finalProductId || finalProductId === 'XM-HD01' || (!finalProductId.startsWith('PT') && !finalProductId.startsWith('XM'));
    if (data.productName) {
      const matchBike = catalogVehicleApi.getAllSync().find(v =>
        v.tenXe.toLowerCase().includes(data.productName!.toLowerCase()) ||
        data.productName!.toLowerCase().includes(v.tenXe.toLowerCase())
      );
      if (matchBike) {
        if (isPlaceholderOrUnknown || finalProductType === 'XeMau') {
          finalProductId = matchBike.id;
          finalProductType = 'XeMau';
        }
        if (!data.productImage) {
          data.productImage = matchBike.hinhAnh;
        }
      } else if (isPlaceholderOrUnknown) {
        const matchPart = mockParts.find(p =>
          p.tenSanPham.toLowerCase().includes(data.productName!.toLowerCase()) ||
          data.productName!.toLowerCase().includes(p.tenSanPham.toLowerCase())
        );
        if (matchPart) {
          finalProductId = matchPart.id;
          finalProductType = 'PhuTung';
          if (!data.productImage) {
            data.productImage = matchPart.hinhAnh;
          }
        }
      }
    }

    const maPhuTung = finalProductType === 'PhuTung' && finalProductId ? parseInt(String(finalProductId).replace(/\D/g, ''), 10) : null;
    const maXe = finalProductType === 'XeMau' && finalProductId ? parseInt(String(finalProductId).replace(/\D/g, ''), 10) : null;

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
          loaiDoiTuong: finalProductType,
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
    const cleanedXe = (data.xeDangDung || (finalProductType === 'XeMau' ? data.productName : undefined))?.replace(/\s*\([^)]*\)/g, '').trim();

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
      loaiDanhGia: data.loaiDanhGia || (finalProductType === 'DichVu' ? 'DichVu' : 'SanPham'),
      trangThai: 'ChoXuLy',
      loaiNhan: data.loaiNhan || (data.diemDanhGia <= 3 ? 'KhieuNai' : 'DanhGia'),
      productId: finalProductId,
      productName: data.productName,
      productImage: data.productImage || (finalProductType === 'PhuTung'
        ? mockParts.find(p => p.id === finalProductId || (data.productName && p.tenSanPham.toLowerCase().includes(data.productName.toLowerCase())))?.hinhAnh
        : catalogVehicleApi.getAllSync().find(v => v.id === finalProductId || (data.productName && v.tenXe.toLowerCase().includes(data.productName.toLowerCase())))?.hinhAnh),
      productType: finalProductType || 'SanPham' as any,
      orderId: data.orderId,
      hinhAnhDinhKem: data.hinhAnhDinhKem || [],
      editCount: 0,
    };

    const existIdx = mockFeedbacks.findIndex(f =>
      f.id === id ||
      (f.customerId === data.customerId && (
        (data.orderId && f.orderId === data.orderId && f.productName?.toLowerCase().trim() === data.productName?.toLowerCase().trim()) ||
        (finalProductId && f.productId === finalProductId)
      ))
    );
    if (existIdx !== -1) {
      mockFeedbacks[existIdx] = {
        ...mockFeedbacks[existIdx],
        ...newFb,
        id: mockFeedbacks[existIdx].id,
        editCount: (mockFeedbacks[existIdx].editCount || 0) + 1,
      };
      newFb.id = mockFeedbacks[existIdx].id;
    } else {
      mockFeedbacks.unshift(newFb);
    }

    try {
      const cached = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      const list: Feedback[] = cached ? JSON.parse(cached) : [...mockFeedbacks];
      const cIdx = list.findIndex(f => f.id === newFb.id || (f.customerId === newFb.customerId && ((newFb.orderId && f.orderId === newFb.orderId) || (newFb.productId && f.productId === newFb.productId))));
      if (cIdx !== -1) {
        list[cIdx] = { ...list[cIdx], ...newFb, id: list[cIdx].id };
      } else {
        list.unshift(newFb);
      }
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(list));
    } catch {}

    const isComplaint = newFb.loaiNhan === 'KhieuNai';
    addAdminNotification({
      category: 'review',
      type: 'feedback_received',
      title: isComplaint ? '⚠️ Khiếu nại từ khách hàng' : '⭐ Đánh giá mới từ khách hàng',
      message: `${newFb.hoTen} (${newFb.diemDanhGia}⭐ - ${newFb.productName || 'Sản phẩm'}): "${newFb.noiDung.slice(0, 50)}${newFb.noiDung.length > 50 ? '...' : ''}"`,
      linkPage: 'feedback',
      meta: {
        ...newFb,
        feedbackId: newFb.id,
      },
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
          body: JSON.stringify({
            trangThai: 'Đã phản hồi',
            nhanVienXuLy: handler,
            phanHoiCuaShop: note || '',
            ghiChuXuLy: note || '',
          }),
        });
      } catch {}
    }

    const f = mockFeedbacks.find(x => x.id === id);
    if (f) {
      f.trangThai = 'DaXuLy';
      f.nhanVienXuLy = handler;
      f.ngayXuLy = resolvedDate;
      if (note) {
        f.ghiChuXuLy = note;
        f.phanHoiCuaShop = note;
        f.ngayPhanHoi = resolvedDate;
      }
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
          if (note) {
            match.ghiChuXuLy = note;
            match.phanHoiCuaShop = note;
            match.ngayPhanHoi = resolvedDate;
          }
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

  syncPinnedContext(customerId: string, pinnedContext: PinnedChatContext | null) {
    const cleanId = formatCustomerId(customerId);
    try {
      if (pinnedContext) {
        localStorage.setItem('crm_pinned_context_' + cleanId, JSON.stringify(pinnedContext));
        localStorage.setItem('crm_chat_pinned_context', JSON.stringify(pinnedContext));
      } else {
        localStorage.removeItem('crm_pinned_context_' + cleanId);
        localStorage.removeItem('crm_chat_pinned_context');
      }
    } catch {}

    const payload = {
      type: 'sync_pinned_context',
      customerId: cleanId,
      pinnedContext,
    };

    if (chatChannel) {
      try {
        chatChannel.postMessage(payload);
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crm-sync-pinned-context', { detail: payload }));
    }
  },

  getPinnedContext(customerId?: string): PinnedChatContext | null {
    try {
      if (customerId) {
        const cleanId = formatCustomerId(customerId);
        const saved = localStorage.getItem('crm_pinned_context_' + cleanId);
        if (saved) return JSON.parse(saved);
      }
      const generic = localStorage.getItem('crm_chat_pinned_context');
      if (generic) return JSON.parse(generic);
    } catch {}
    return null;
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
            pinnedContext: d.pinnedContext || undefined,
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
          senderName: 'Trần Văn Quản Lý',
          content: 'Dạ chào anh An, Motoshop rất xin lỗi về sự cố rỉ nắp nhớt trong quá trình vận chuyển ạ. Showroom xin hỗ trợ đổi mới ngay cho anh ạ. Anh cho em xin lại địa chỉ nhé!',
          sentAt: '00:16',
        },
        {
          id: 'msg-sample-lp-1',
          customerId: 'KH1004',
          sender: 'staff',
          senderName: 'Trần Văn Quản Lý',
          content: 'Dạ chào chị Lan Phương, Motoshop rất xin lỗi về sự cố rỉ nắp nhớt trong quá trình vận chuyển ạ. Showroom xin hỗ trợ đổi mới ngay cho chị ạ. Chị cho em xin lại địa chỉ nhé!',
          sentAt: '00:16',
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
    pinnedContext?: PinnedChatContext | null;
  }): Promise<ChatMessage> {
    const targetCustId = formatCustomerId(msg.customerId);
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      customerId: targetCustId,
      sender: msg.sender,
      senderName: msg.senderName,
      content: msg.content.trim(),
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pinnedContext: msg.pinnedContext !== undefined ? msg.pinnedContext : chatApi.getPinnedContext(targetCustId),
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

// Danh sách các mã khảo sát mock/dummy cần loại bỏ triệt để
const DUMMY_SURVEY_IDS = new Set([
  'KS-XE-DH-XE-001', 'KS-XE-DH-XE-002', 'KS-XE-DH-XE-003', 'KS-XE-DH-XE-004',
  'KS-XE-DH-XE-0003', 'KS-XE-DH-XE-0004', 'KS-BD-LH001', 'KS-BD-LH002', 'KS-BD-LH003'
]);
const DUMMY_RESPONSE_IDS = new Set(['RESP-001', 'RESP-002', 'RESP-003']);

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

    // Thanh lọc triệt để các bài khảo sát mẫu không liên quan khỏi danh sách
    list = list.filter(s => !DUMMY_SURVEY_IDS.has(s.id));

    if (list.length === 0) {
      list = [...mockSurveys.filter(s => !DUMMY_SURVEY_IDS.has(s.id))];
      localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(list));
    } else {
      // Merge any new surveys from mockSurveys if missing
      mockSurveys.forEach(ms => {
        if (DUMMY_SURVEY_IDS.has(ms.id)) return;
        const existing = list.find(s => s.id === ms.id);
        if (!existing) {
          list.push(ms);
        } else {
          // Merge missing dates and fields
          if (!existing.startDate && ms.startDate) existing.startDate = ms.startDate;
          if (!existing.endDate && ms.endDate) existing.endDate = ms.endDate;
          if (ms.publishDate && existing.publishDate !== ms.publishDate) existing.publishDate = ms.publishDate;
          if (!existing.targetCustomerTier && ms.targetCustomerTier) existing.targetCustomerTier = ms.targetCustomerTier;
          if (ms.targetCount !== undefined && (!existing.targetCount || existing.targetCount === 0)) existing.targetCount = ms.targetCount;
          if (ms.responseCount !== undefined && (!existing.responseCount || existing.responseCount === 0)) existing.responseCount = ms.responseCount;
        }
      });
      localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(list));
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

  async getAllAsync(): Promise<Survey[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/KhaoSat`);
      if (res.ok) {
        const beList = await res.json();
        if (Array.isArray(beList) && beList.length > 0) {
          const mapped: Survey[] = beList
            .filter((item: any) => !DUMMY_SURVEY_IDS.has(item.id || item.Id))
            .map((item: any) => ({
            id: item.id || item.Id,
            title: item.title || item.Title,
            description: item.description || item.Description,
            status: item.status || item.Status || 'DangDienRa',
            startDate: item.startDate || item.StartDate,
            endDate: item.endDate || item.EndDate,
            publishDate: item.publishDate || item.PublishDate,
            createdDate: item.createdDate || item.CreatedDate || '26-10-2026',
            targetCustomerId: item.targetCustomerId || item.TargetCustomerId || 'ALL',
            targetCustomerTier: item.targetCustomerTier || item.TargetCustomerTier || 'ALL',
            targetCustomerIds: item.targetCustomerIds || item.TargetCustomerIds || [],
            targetCount: item.targetCount ?? item.TargetCount ?? 10,
            responseCount: item.responseCount ?? item.ResponseCount ?? 0,
            questions: (item.questions || item.Questions || []).map((q: any) => ({
              id: q.id || q.Id,
              text: q.text || q.Text,
              opts: q.opts || q.Opts || []
            }))
          }));
          localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(mapped));
          return mapped.map(s => ({ ...s, status: computeSurveyStatus(s) }));
        }
      }
    } catch (err) {
      console.warn('[surveyApi.getAllAsync] backend unavailable, using local cache:', err);
    }
    return surveyApi.getAll();
  },

  create(survey: Omit<Survey, 'id' | 'createdDate' | 'status'> & { id?: string; status?: SurveyStatus }): Survey {
    const nowIso = new Date().toISOString();
    const createdDate = nowIso.split('T')[0];
    const pubDate = survey.publishDate || nowIso.slice(0, 16);
    const sDate = survey.startDate || nowIso.slice(0, 16);
    const eDate = survey.endDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16);

    // Loại bỏ các câu hỏi trùng lặp nội dung trong cùng một bộ khảo sát
    const uniqueQuestions: typeof survey.questions = [];
    const seenTexts = new Set<string>();
    (survey.questions || []).forEach(q => {
      const norm = q.text.trim().toLowerCase();
      if (norm && !seenTexts.has(norm)) {
        seenTexts.add(norm);
        uniqueQuestions.push(q);
      }
    });

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
      questions: uniqueQuestions,
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

    try {
      fetchWithTimeout(`${API_BASE_URL}/KhaoSat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSurvey),
      }).catch(err => console.warn('[surveyApi.create] backend POST failed:', err));
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'surveys' } }));
    return newSurvey;
  },

  update(id: string, data: Partial<Survey>): Survey | null {
    let list = surveyApi.getAll();
    let targetIdx = list.findIndex(s => s.id === id);
    if (targetIdx === -1) {
      const mIdx = mockSurveys.findIndex(s => s.id === id);
      if (mIdx !== -1) {
        list.push({ ...mockSurveys[mIdx] });
        targetIdx = list.length - 1;
      } else {
        return null;
      }
    }

    const current = list[targetIdx];
    const merged: Survey = {
      ...current,
      ...data,
      id: current.id,
    };

    // KS08: Tự động tính toán lại trạng thái theo thời gian thực dựa vào startDate và endDate mới
    merged.status = computeSurveyStatus(merged);

    list[targetIdx] = merged;
    localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(list));

    const mIdx = mockSurveys.findIndex(s => s.id === id);
    if (mIdx !== -1) {
      mockSurveys[mIdx] = { ...merged };
    }

    try {
      fetchWithTimeout(`${API_BASE_URL}/KhaoSat/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      }).catch(err => console.warn('[surveyApi.update] backend PUT failed:', err));
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'surveys', id } }));
    return merged;
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

  createMaintenanceSurvey(appt: any, customer?: any): Survey {
    const custId = appt.customerId || customer?.id || 'KH001';
    const bikeName = appt.tenXe || 'xe máy';
    const apptId = appt.id || ('LH' + Date.now().toString().slice(-4));
    const surveyId = 'KS-BD-' + apptId;

    const existing = surveyApi.getAll().find(s => s.id === surveyId);
    if (existing) return existing;

    const newSurvey = surveyApi.create({
      id: surveyId,
      title: 'Khảo sát chất lượng dịch vụ bảo dưỡng: ' + bikeName + ' (#' + apptId + ')',
      description: 'Dịch vụ bảo dưỡng xe ' + bikeName + ' của bạn tại Motoshop đã hoàn tất. Chúng tôi trân trọng mời bạn dành 1 phút thực hiện khảo sát tự động để nâng cao chất lượng phục vụ và nhận mã ưu đãi giảm giá!',
      targetCustomerId: custId,
      targetCustomerTier: 'ALL',
      targetCustomerIds: [custId],
      questions: [
        {
          id: 'q1',
          text: 'Bạn đánh giá thế nào về thái độ tiếp đón và tác phong của nhân viên kỹ thuật?',
          opts: ['Rất hài lòng, nhiệt tình chu đáo', 'Hài lòng, đúng quy trình', 'Bình thường', 'Chưa hài lòng'],
        },
        {
          id: 'q2',
          text: 'Thời gian bảo dưỡng và bàn giao xe có đúng với cam kết ban đầu không?',
          opts: ['Nhanh hơn dự kiến', 'Đúng giờ hẹn', 'Chậm trễ một chút (< 15 phút)', 'Chậm nhiều (> 30 phút)'],
        },
        {
          id: 'q3',
          text: 'Chất lượng vận hành và độ êm ái của xe sau khi hoàn tất bảo dưỡng?',
          opts: ['Xe chạy rất êm, máy bốc', 'Tốt, các hạng mục đều hoàn thiện', 'Bình thường', 'Cần kiểm tra lại'],
        },
        {
          id: 'q4',
          text: 'Mức độ minh bạch về chi phí dịch vụ và phụ tùng thay thế định kỳ?',
          opts: ['Rất minh bạch, bảng giá rõ ràng', 'Hợp lý, đúng báo giá', 'Hơi cao so với mặt bằng', 'Chưa rõ ràng'],
        },
      ],
    });

    addCustomerNotification({
      customerId: custId,
      category: 'survey',
      icon: '📋',
      title: '📋 Khảo sát chất lượng dịch vụ bảo dưỡng #' + apptId,
      message: 'Dịch vụ bảo dưỡng cho xe ' + bikeName + ' đã hoàn tất. Kính mời bạn dành 1 phút tham gia khảo sát tự động để nhận ưu đãi!',
      page: 'dashboard',
      tab: 'surveys',
      targetId: newSurvey.id,
    });

    return newSurvey;
  },

  createWarrantyServiceSurvey(claim: any, customerId?: string): Survey {
    const custId = claim.customerId || customerId || 'KH001';
    const bikeName = claim.xeBienSo || 'Xe máy';
    const surveyId = `KS-BH-${claim.id}`;

    const existing = surveyApi.getAll().find(s => s.id === surveyId);
    if (existing) return existing;

    const newSurvey = surveyApi.create({
      id: surveyId,
      title: `Khảo sát chất lượng dịch vụ bảo hành: ${bikeName} (#${claim.id})`,
      description: `Yêu cầu bảo hành #${claim.id} của quý khách đã hoàn tất. Chúng tôi trân trọng mời quý khách dành 1 phút đánh giá chất lượng sửa chữa và thái độ phục vụ của kỹ thuật viên.`,
      targetCustomerId: custId,
      targetCustomerTier: 'ALL',
      targetCustomerIds: [custId],
      questions: [
        {
          id: 'q1',
          text: 'Sau khi nhận lại xe, quý khách đánh giá chất lượng vận hành và khắc phục sự cố thế nào?',
          opts: ['Rất hài lòng - Xe chạy rất êm, dứt điểm sự cố', 'Hài lòng - Sự cố đã được xử lý', 'Tạm ổn', 'Chưa hài lòng - Còn hiện tượng lạ'],
        },
        {
          id: 'q2',
          text: 'Thái độ phục vụ và tay nghề kỹ thuật của kỹ thuật viên phụ trách?',
          opts: ['Nhiệt tình, tay nghề cao, giải thích rõ ràng', 'Lịch sự, chu đáo', 'Bình thường', 'Cần cải thiện thái độ phục vụ'],
        },
        {
          id: 'q3',
          text: 'Thời gian hoàn tất bảo hành và bàn giao xe có đúng như hẹn không?',
          opts: ['Đúng hẹn hoặc sớm hơn dự kiến', 'Chậm trễ một chút nhưng có thông báo', 'Chậm trễ không thông báo'],
        },
        {
          id: 'q4',
          text: 'Quý khách đánh giá chung bao nhiêu điểm / sao cho dịch vụ bảo hành của chúng tôi?',
          opts: ['⭐⭐⭐⭐⭐ (5 sao - Xuất sắc)', '⭐⭐⭐⭐ (4 sao - Tốt)', '⭐⭐⭐ (3 sao - Khá)', '⭐⭐ (2 sao - Cần cải thiện)'],
        },
      ],
    });

    addCustomerNotification({
      customerId: custId,
      category: 'survey',
      icon: '📝',
      title: 'Khảo sát chất lượng dịch vụ bảo hành',
      message: `Mời quý khách đánh giá dịch vụ bảo hành xe ${bikeName} (${claim.id}) để giúp chúng tôi hoàn thiện chất lượng phục vụ.`,
      page: 'dashboard',
      tab: 'surveys',
      targetId: newSurvey.id,
    });

    return newSurvey;
  },

  getResponses(surveyId?: string): SurveyResponse[] {
    try {
      const cached = localStorage.getItem(SURVEY_RESPONSE_KEY);
      let list: SurveyResponse[] = cached ? JSON.parse(cached) : [];
      // Lọc bỏ triệt để phản hồi của các khảo sát mock cũ
      list = list.filter(r => !DUMMY_RESPONSE_IDS.has(r.id) && !DUMMY_SURVEY_IDS.has(r.surveyId));

      if (!Array.isArray(list) || list.length === 0) {
        list = [...mockSurveyResponses.filter(r => !DUMMY_RESPONSE_IDS.has(r.id) && !DUMMY_SURVEY_IDS.has(r.surveyId))];
        localStorage.setItem(SURVEY_RESPONSE_KEY, JSON.stringify(list));
      } else {
        mockSurveyResponses.forEach(mr => {
          if (DUMMY_RESPONSE_IDS.has(mr.id) || DUMMY_SURVEY_IDS.has(mr.surveyId)) return;
          const exists = list.find(r => r.id === mr.id);
          if (!exists) {
            list.push(mr);
          } else {
            if (!exists.soDienThoai && mr.soDienThoai) exists.soDienThoai = mr.soDienThoai;
            if (!exists.bienSoXe && mr.bienSoXe) exists.bienSoXe = mr.bienSoXe;
            if (!exists.tenXe && mr.tenXe) exists.tenXe = mr.tenXe;
            if (!exists.danhGiaChung && mr.danhGiaChung) exists.danhGiaChung = mr.danhGiaChung;
            if (exists.daXuLy === undefined && mr.daXuLy !== undefined) exists.daXuLy = mr.daXuLy;
            if (!exists.ghiChu && mr.ghiChu) exists.ghiChu = mr.ghiChu;
          }
        });
        localStorage.setItem(SURVEY_RESPONSE_KEY, JSON.stringify(list));
      }
      if (surveyId) return list.filter(r => r.surveyId === surveyId);
      return list;
    } catch {
      return mockSurveyResponses.filter(r => !DUMMY_RESPONSE_IDS.has(r.id) && !DUMMY_SURVEY_IDS.has(r.surveyId));
    }
  },

  async getResponsesAsync(surveyId?: string): Promise<SurveyResponse[]> {
    try {
      const url = surveyId ? `${API_BASE_URL}/KhaoSat/${surveyId}/ket-qua` : `${API_BASE_URL}/KhaoSat/ket-qua`;
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        const beList = await res.json();
        if (Array.isArray(beList) && beList.length > 0) {
          const mapped: SurveyResponse[] = beList.map((item: any) => ({
            id: item.id || item.Id,
            surveyId: item.surveyId || item.SurveyId,
            customerId: item.customerId || item.CustomerId,
            customerName: item.customerName || item.CustomerName,
            soDienThoai: item.phoneNumber || item.soDienThoai || item.PhoneNumber,
            bienSoXe: item.vehicleInfo || item.bienSoXe || item.VehicleInfo,
            tenXe: item.tenXe || item.TenXe || 'Honda SH 160i ABS 2024',
            danhGiaChung: item.overallRating || item.danhGiaChung || item.OverallRating || 'Rất hài lòng 😊',
            submittedDate: item.submittedDate || item.SubmittedDate || '26/10/2026',
            daXuLy: item.handled ?? item.daXuLy ?? item.Handled ?? false,
            ghiChu: item.notes || item.ghiChu || item.Notes || '',
            answers: item.answers || item.Answers || {}
          }));
          return mapped;
        }
      }
    } catch (err) {
      console.warn('[surveyApi.getResponsesAsync] backend unavailable, using local responses:', err);
    }
    return surveyApi.getResponses(surveyId);
  },

  async markResponseHandled(responseId: string): Promise<boolean> {
    try {
      await fetchWithTimeout(`${API_BASE_URL}/KhaoSat/ket-qua/${responseId}/xu-ly`, {
        method: 'PUT'
      });
    } catch (err) {
      console.warn('[surveyApi.markResponseHandled] backend PUT failed, updating local state only:', err);
    }
    const all = surveyApi.getResponses();
    const target = all.find(r => r.id === responseId);
    if (target) {
      target.daXuLy = true;
      localStorage.setItem(SURVEY_RESPONSE_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'survey_responses', id: responseId } }));
      return true;
    }
    return false;
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

    // BH05: Tích lũy chi tiêu bảo hiểm vào hồ sơ khách hàng
    if (newContract.customerId && newContract.trangThai === 'HieuLuc') {
      const insPrice = newContract.tongTien || newContract.phiBaoHiem || 0;
      const cIdNum = parseInt(newContract.customerId.replace(/\D/g, ''), 10);
      const custObj = mockCustomers.find(c => {
        if (c.id === newContract.customerId) return true;
        const num = parseInt(c.id.replace(/\D/g, ''), 10);
        return !isNaN(cIdNum) && !isNaN(num) && cIdNum === num;
      });
      if (custObj) {
        custObj.tongChiTieu = (custObj.tongChiTieu || 0) + insPrice;
      }
      try {
        const cached = localStorage.getItem('crm_custom_customers');
        if (cached) {
          const list: Customer[] = JSON.parse(cached);
          const idx = list.findIndex(c => {
            if (c.id === newContract.customerId) return true;
            const num = parseInt(c.id.replace(/\D/g, ''), 10);
            return !isNaN(cIdNum) && !isNaN(num) && cIdNum === num;
          });
          if (idx !== -1) {
            list[idx].tongChiTieu = (list[idx].tongChiTieu || 0) + insPrice;
            localStorage.setItem('crm_custom_customers', JSON.stringify(list));
          }
        }

        // BH05: Cập nhật trực tiếp phiên đăng nhập hiện tại nếu trùng khớp
        const curRaw = localStorage.getItem('crm_current_customer');
        if (curRaw) {
          const cur: Customer = JSON.parse(curRaw);
          const curNum = parseInt(cur.id.replace(/\D/g, ''), 10);
          if (cur.id === newContract.customerId || (!isNaN(cIdNum) && !isNaN(curNum) && cIdNum === curNum) || (cur.soDienThoai && cur.soDienThoai === newContract.soDienThoai)) {
            cur.tongChiTieu = (cur.tongChiTieu || 0) + insPrice;
            localStorage.setItem('crm_current_customer', JSON.stringify(cur));
          }
        }
      } catch {}
    }

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

    // Kiểm tra hợp đồng còn hiệu lực thì KHÔNG CHO GIA HẠN
    const todayStr = new Date().toISOString().split('T')[0];
    if (old.trangThai === 'HieuLuc' && old.ngayKetThuc >= todayStr) {
      return {
        success: false,
        message: `⚠️ KHÔNG THỂ GIA HẠN: Hợp đồng ${old.soGCN} (${old.tenGoi}) của xe ${old.bienSo} vẫn đang CÒN HIỆU LỰC đến ngày ${old.ngayKetThuc.split('-').reverse().join('/')}. Theo quy định, chỉ được phép gia hạn khi hợp đồng đã hết hiệu lực!`
      };
    }

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

    // BH05: Tích lũy chi tiêu gia hạn bảo hiểm vào hồ sơ khách hàng
    if (newContract.customerId) {
      const insPrice = newContract.tongTien || newContract.phiBaoHiem || 0;
      const cIdNum = parseInt(newContract.customerId.replace(/\D/g, ''), 10);
      const custObj = mockCustomers.find(c => {
        if (c.id === newContract.customerId) return true;
        const num = parseInt(c.id.replace(/\D/g, ''), 10);
        return !isNaN(cIdNum) && !isNaN(num) && cIdNum === num;
      });
      if (custObj) {
        custObj.tongChiTieu = (custObj.tongChiTieu || 0) + insPrice;
      }
      try {
        const cached = localStorage.getItem('crm_custom_customers');
        if (cached) {
          const list: Customer[] = JSON.parse(cached);
          const idx = list.findIndex(c => {
            if (c.id === newContract.customerId) return true;
            const num = parseInt(c.id.replace(/\D/g, ''), 10);
            return !isNaN(cIdNum) && !isNaN(num) && cIdNum === num;
          });
          if (idx !== -1) {
            list[idx].tongChiTieu = (list[idx].tongChiTieu || 0) + insPrice;
            localStorage.setItem('crm_custom_customers', JSON.stringify(list));
          }
        }

        // BH05: Cập nhật trực tiếp phiên đăng nhập hiện tại nếu trùng khớp
        const curRaw = localStorage.getItem('crm_current_customer');
        if (curRaw) {
          const cur: Customer = JSON.parse(curRaw);
          const curNum = parseInt(cur.id.replace(/\D/g, ''), 10);
          if (cur.id === newContract.customerId || (!isNaN(cIdNum) && !isNaN(curNum) && cIdNum === curNum) || (cur.soDienThoai && cur.soDienThoai === newContract.soDienThoai)) {
            cur.tongChiTieu = (cur.tongChiTieu || 0) + insPrice;
            localStorage.setItem('crm_current_customer', JSON.stringify(cur));
          }
        }
      } catch {}
    }

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

    // Đồng bộ tức thì sang danh sách Yêu cầu bảo hành bên Admin (Tab 2: YÊU CẦU BẢO HÀNH)
    const existingClaims = this.getAdminClaims();
    const nextSeq = 156 + existingClaims.length + 1;
    const adminClaimId = `YCBH${nextSeq.toString().padStart(5, '0')}`;

    const newAdminClaim: AdminWarrantyClaim = {
      id: adminClaimId,
      ngayGui: `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`,
      khachHang: data.hoTenKH,
      soDienThoai: data.soDienThoai,
      xeBienSo: `${data.tenXe} - ${data.bienSo}`,
      noiDung: data.moTaChiTiet || (data.vanDeGapPhai && data.vanDeGapPhai.join(', ')) || 'Yêu cầu kiểm tra bảo hành xe',
      nhanVienPhuTrach: 'Chờ phân công',
      trangThai: 'ChoXuLy',
      currentStep: 1,
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      maLichHen: newId,
      ngayHen: data.ngayHen,
      gioHen: data.gioHen,
      chiNhanh: data.chiNhanh,

      // Dữ liệu sẵn sàng cho Bước 1 đối chiếu (Ảnh 3)
      b1_khachDaDenShowroom: false,
      b1_xacNhanDungXeBienSo: true,
      b1_bienSoThucTe: data.bienSo,
      b1_soKmHienTai: data.odoKhachBao || 0,
      b1_ghiChuNgoaiQuan: data.moTaChiTiet || '',
      b1_dayDuGiayTo: false,
      b1_hinhAnhKhachGui: data.hinhAnhKhachHang || [],

      // Dữ liệu gợi ý cho Bước 2 (Ảnh 4)
      b2_heThongSuCo: data.vanDeGapPhai || ['Khac'],
      b2_chiTietLoi: data.moTaChiTiet || '',
      b2_deXuatHuongXuLy: 'Tiếp nhận xe, kiểm tra kỹ thuật chi tiết tại xưởng.',
      b2_phuTungDuKien: [],
      b2_hinhAnhKiemTra: data.hinhAnhKhachHang || [],

      // Dữ liệu Bước 3 (Ảnh 5)
      b3_cheDoBaoHanh: 'MienPhi',
      b3_hangMucChiPhi: [],
      b3_tongChiPhi: 0,
      b3_chiPhiBaoHanhChiTra: 0,
      b3_khachThanhToan: 0,
      b3_thoiGianHoanThanhDuKien: `${d.toISOString().split('T')[0]}T17:00`,
      b3_ktvPhuTrach: 'Nguyễn Văn Hùng',
    };

    const updatedClaims = [newAdminClaim, ...existingClaims];
    try {
      localStorage.setItem('crm_admin_warranty_claims', JSON.stringify(updatedClaims));
    } catch {}

    // Lưu một bản ghi lịch hẹn chờ xác nhận vào crm_appointments_cache
    try {
      const cachedRaw = localStorage.getItem('crm_appointments_cache');
      let cachedAppts: any[] = cachedRaw ? JSON.parse(cachedRaw) : [];
      const apptItem = {
        id: newId,
        customerId: data.customerId,
        hoTenKH: data.hoTenKH,
        soDienThoai: data.soDienThoai,
        loaiDichVu: 'BaoHanh',
        ngayHen: data.ngayHen,
        gioHen: data.gioHen,
        trangThai: 'ChoXacNhan',
        ghiChu: data.moTaChiTiet || (data.vanDeGapPhai && data.vanDeGapPhai.join(', ')) || 'Yêu cầu kiểm tra bảo hành xe',
        tenXe: data.tenXe,
        bienSo: data.bienSo,
        nhanVienPhuTrach: 'Chờ phân công',
        createdDate: newAppt.ngayTao,
      };
      cachedAppts = [apptItem, ...cachedAppts.filter(a => a.id !== newId)];
      localStorage.setItem('crm_appointments_cache', JSON.stringify(cachedAppts));
    } catch {}

    window.dispatchEvent(new CustomEvent('crm-admin-notification', { detail: { type: 'warranty_claim_created', claimId: adminClaimId } }));

    // Thông báo cho Admin (TB02)
    addAdminNotification({
      category: 'system',
      type: 'warranty_request_created',
      title: '🛡️ Yêu cầu bảo hành mới',
      message: `Khách hàng ${data.hoTenKH} vừa gửi yêu cầu bảo hành ${newId} cho xe ${data.tenXe} (${data.bienSo}).`,
      linkPage: 'warranty',
      meta: { appointmentId: newId, claimId: adminClaimId, id: adminClaimId },
    });

    // Thông báo cho Khách hàng
    addCustomerNotification({
      customerId: data.customerId,
      category: 'appointment',
      icon: '🔧',
      title: 'Yêu cầu kiểm tra bảo hành đã gửi',
      message: `Yêu cầu kiểm tra bảo hành ${newId} cho xe ${data.tenXe} đã được gửi thành công. Showroom sẽ sớm liên hệ xác nhận.`,
      page: 'dashboard',
      tab: 'appts',
      targetId: newId,
    });

    return { success: true, appointment: newAppt };
  },

  /**
   * Nhân viên xác nhận lịch hẹn (Ảnh 4: Chuyển sang DaXacNhan & gửi lịch về cho khách)
   */
  async confirmAppointment(claimOrApptId: string): Promise<boolean> {
    // 1. Cập nhật trong AdminWarrantyClaims
    const allClaims = this.getAdminClaims();
    const claim = allClaims.find(c => c.id === claimOrApptId || c.maLichHen === claimOrApptId);
    if (claim) {
      claim.trangThai = 'DaXacNhan';
      if (claim.nhanVienPhuTrach === 'Chờ phân công') {
        claim.nhanVienPhuTrach = 'Nguyễn Văn Hùng';
      }
      try {
        localStorage.setItem('crm_admin_warranty_claims', JSON.stringify(allClaims));
      } catch {}
    }

    // 2. Cập nhật trong WarrantyAppointments
    const allAppts = this.getAppointments();
    const appt = allAppts.find(a => a.id === claimOrApptId || (claim && a.id === claim.maLichHen));
    if (appt) {
      appt.trangThai = 'DaXacNhan';
      try {
        localStorage.setItem(WARRANTY_APPTS_STORAGE_KEY, JSON.stringify(allAppts));
      } catch {}
    }

    // 3. Cập nhật trong crm_appointments_cache (Tab 2 Lịch hẹn của khách hàng)
    const targetId = appt?.id || claim?.maLichHen || claimOrApptId;
    try {
      const cachedRaw = localStorage.getItem('crm_appointments_cache');
      let cachedAppts: any[] = cachedRaw ? JSON.parse(cachedRaw) : [];
      let found = false;
      cachedAppts = cachedAppts.map(a => {
        if (a.id === targetId || a.id === claimOrApptId || (claim && a.id === claim.maLichHen)) {
          found = true;
          return { ...a, trangThai: 'DaXacNhan', nhanVienPhuTrach: claim?.nhanVienPhuTrach || 'Nguyễn Văn Hùng' };
        }
        return a;
      });
      if (!found && (appt || claim)) {
        cachedAppts.unshift({
          id: targetId,
          customerId: appt?.customerId || claim?.customerId || 'KH001',
          hoTenKH: appt?.hoTenKH || claim?.khachHang || 'Khách hàng',
          soDienThoai: appt?.soDienThoai || claim?.soDienThoai || '',
          loaiDichVu: 'BaoHanh',
          ngayHen: appt?.ngayHen || claim?.ngayHen || new Date().toISOString().split('T')[0],
          gioHen: appt?.gioHen || claim?.gioHen || '09:00',
          trangThai: 'DaXacNhan',
          ghiChu: appt?.moTaChiTiet || claim?.noiDung || 'Bảo hành sửa chữa xe',
          tenXe: appt?.tenXe || claim?.xeBienSo?.split('-')[0]?.trim() || 'Xe máy',
          bienSo: appt?.bienSo || claim?.b1_bienSoThucTe || claim?.xeBienSo?.split('-')[1]?.trim() || '29F1-234.56',
          nhanVienPhuTrach: claim?.nhanVienPhuTrach || 'Nguyễn Văn Hùng',
        });
      }
      localStorage.setItem('crm_appointments_cache', JSON.stringify(cachedAppts));
    } catch {}

    const custId = appt?.customerId || claim?.customerId || 'KH001';
    const bike = appt?.tenXe || claim?.xeBienSo || 'phương tiện';
    const timeStr = appt ? `${appt.gioHen} ngày ${appt.ngayHen}` : claim?.ngayHen ? `${claim.gioHen || '09:00'} ngày ${claim.ngayHen}` : 'giờ hẹn đã chọn';
    const branch = appt?.chiNhanh || claim?.chiNhanh || 'Showroom Ủy Quyền Motoshop';

    addCustomerNotification({
      customerId: custId,
      category: 'appointment',
      icon: '✅',
      title: 'Lịch hẹn bảo hành đã được xác nhận',
      message: `Yêu cầu bảo hành #${claimOrApptId} cho xe ${bike} đã được xác nhận. Vui lòng mang xe đến ${branch} lúc ${timeStr}.`,
      page: 'dashboard',
      tab: 'appts',
      targetId: claimOrApptId,
    });

    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'appointment_confirmed' } }));
    window.dispatchEvent(new CustomEvent('crm-admin-notification', { detail: { type: 'warranty_claim_updated' } }));

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

  /**
   * Quản lý danh sách giao dịch gia hạn bảo hành (Ảnh 1)
   */
  getExtensionTransactions(): WarrantyExtensionTransaction[] {
    try {
      const raw = localStorage.getItem('crm_admin_warranty_extensions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    localStorage.setItem('crm_admin_warranty_extensions', JSON.stringify(mockWarrantyExtensionTransactions));
    return mockWarrantyExtensionTransactions;
  },

  createExtensionTransaction(tx: Omit<WarrantyExtensionTransaction, 'id'>): WarrantyExtensionTransaction {
    const list = this.getExtensionTransactions();
    const newId = `MĐJ${(list.length + 1).toString().padStart(5, '0')}`;
    const newTx: WarrantyExtensionTransaction = { id: newId, ...tx };
    const updated = [newTx, ...list];
    try {
      localStorage.setItem('crm_admin_warranty_extensions', JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new CustomEvent('crm-admin-notification', { detail: { type: 'warranty_extended_admin' } }));
    return newTx;
  },

  /**
   * Quản lý danh sách yêu cầu bảo hành 6 bước (Ảnh 2 - 8)
   */
  getAdminClaims(): AdminWarrantyClaim[] {
    try {
      const raw = localStorage.getItem('crm_admin_warranty_claims');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    localStorage.setItem('crm_admin_warranty_claims', JSON.stringify(mockAdminWarrantyClaims));
    return mockAdminWarrantyClaims;
  },

  getAdminClaimById(id: string): AdminWarrantyClaim | undefined {
    const all = this.getAdminClaims();
    return all.find(c => c.id.toLowerCase() === id.toLowerCase());
  },

  updateAdminClaim(updatedClaim: AdminWarrantyClaim): void {
    const all = this.getAdminClaims();
    const idx = all.findIndex(c => c.id === updatedClaim.id);
    let updated: AdminWarrantyClaim[];
    if (idx >= 0) {
      updated = [...all];
      updated[idx] = updatedClaim;
    } else {
      updated = [updatedClaim, ...all];
    }
    try {
      localStorage.setItem('crm_admin_warranty_claims', JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new CustomEvent('crm-admin-notification', { detail: { type: 'warranty_claim_updated' } }));
  },

  /**
   * Hoàn tất hồ sơ yêu cầu bảo hành:
   * 1. Cập nhật claim -> HoanThanh
   * 2. Đổi cuộc hẹn bảo hành -> DaHoanThanh (biến mất khỏi Tab 2 Lịch hẹn, xuất hiện ở Tab 3 Lịch sử dịch vụ)
   * 3. Ghi vào Sổ bảo hành điện tử của xe
   * 4. Tự động tạo bài khảo sát dịch vụ bảo hành xe (KS-BH-...)
   * 5. Gửi thông báo đến khách hàng & kích hoạt làm mới giao diện
   */
  async completeAdminWarrantyClaim(claim: AdminWarrantyClaim): Promise<boolean> {
    let resolvedCustomerId = claim.customerId;
    if (!resolvedCustomerId) {
      try {
        const savedCust = localStorage.getItem('crm_current_customer');
        if (savedCust) {
          const parsed = JSON.parse(savedCust);
          if (parsed?.id) resolvedCustomerId = parsed.id;
        }
      } catch {}
    }
    if (!resolvedCustomerId) resolvedCustomerId = 'KH001';

    const updatedClaim: AdminWarrantyClaim = {
      ...claim,
      customerId: resolvedCustomerId,
      trangThai: 'HoanThanh',
      currentStep: 6,
      b6_daCapNhatLichSu: true,
      b6_daGuiTinNhan: true,
    };
    this.updateAdminClaim(updatedClaim);

    // 1. Cập nhật trong crm_appointments_cache (Đổi sang DaHoanThanh)
    try {
      const cachedRaw = localStorage.getItem('crm_appointments_cache');
      let cachedAppts: any[] = cachedRaw ? JSON.parse(cachedRaw) : [];
      let found = false;
      const targetId = claim.maLichHen || claim.id;

      cachedAppts = cachedAppts.map(a => {
        const isMatch =
          a.id === targetId ||
          a.id === claim.maLichHen ||
          a.id === claim.id ||
          (claim.maLichHen && a.maLichHen === claim.maLichHen) ||
          (resolvedCustomerId && a.customerId === resolvedCustomerId && a.loaiDichVu === 'BaoHanh' && a.trangThai !== 'DaHoanThanh');
        if (isMatch) {
          found = true;
          return {
            ...a,
            trangThai: 'DaHoanThanh',
            customerId: resolvedCustomerId,
            nhanVienPhuTrach: claim.nhanVienPhuTrach || claim.b3_ktvPhuTrach || 'Nguyễn Văn Hùng',
          };
        }
        return a;
      });

      if (!found) {
        cachedAppts.unshift({
          id: targetId,
          customerId: resolvedCustomerId,
          hoTenKH: claim.khachHang,
          soDienThoai: claim.soDienThoai,
          loaiDichVu: 'BaoHanh',
          ngayHen: claim.ngayHen || new Date().toISOString().split('T')[0],
          gioHen: claim.gioHen || '09:00',
          trangThai: 'DaHoanThanh',
          ghiChu: claim.noiDung || claim.b2_chiTietLoi || 'Bảo hành sửa chữa xe',
          tenXe: claim.xeBienSo?.split('-')[0]?.trim() || 'Xe máy',
          bienSo: claim.b1_bienSoThucTe || claim.xeBienSo?.split('-')[1]?.trim() || '29F1-234.56',
          nhanVienPhuTrach: claim.nhanVienPhuTrach || claim.b3_ktvPhuTrach || 'Nguyễn Văn Hùng',
          maLichHen: claim.maLichHen,
        });
      }
      localStorage.setItem('crm_appointments_cache', JSON.stringify(cachedAppts));
    } catch {}

    // 2. Cập nhật trong crm_warranty_appointments nếu có
    try {
      const allW = this.getAppointments();
      const matchedW = allW.find(w => w.id === claim.maLichHen || w.id === claim.id);
      if (matchedW) {
        matchedW.trangThai = 'HoanTat';
        matchedW.inPhieuLoai = (claim.b3_khachThanhToan || 0) > 0 ? 'HoaDonSuaChua' : 'PhieuBaoHanh';
        matchedW.ngayHoanTat = new Date().toLocaleDateString('vi-VN');
        localStorage.setItem(WARRANTY_APPTS_STORAGE_KEY, JSON.stringify(allW));
      }
    } catch {}

    // 3. Ghi vào Sổ bảo hành điện tử của xe
    const vehicleId = claim.vehicleId || 'XE001';
    const allRecords = this.getWarrantyRecords(vehicleId);
    this.addWarrantyRecord({
      id: `WREC-${Date.now().toString().slice(-4)}`,
      vehicleId,
      lanThu: allRecords.length + 1,
      ngayThucHien: new Date().toLocaleDateString('vi-VN'),
      noiDung: claim.noiDung || claim.b2_chiTietLoi || 'Bảo hành thay thế linh kiện',
      chiPhi: claim.b3_khachThanhToan || 0,
      loaiChiPhi: (claim.b3_khachThanhToan || 0) > 0 ? 'CoPhi' : 'BaoHanh',
      trangThai: 'HoanThanh',
      chiNhanh: claim.chiNhanh || 'Showroom Ủy Quyền Motoshop',
      maLichHen: claim.maLichHen || claim.id,
      soKm: claim.b1_soKmHienTai || 12450,
      kyThuatVien: claim.nhanVienPhuTrach || claim.b3_ktvPhuTrach || 'Nguyễn Văn Hùng',
      chiTietLinhKien: (claim.b2_phuTungDuKien && claim.b2_phuTungDuKien.length > 0)
        ? claim.b2_phuTungDuKien.map(p => p.ten)
        : ['Búa côn sau (Ba càng)', 'Chuông nồi sau'],
    });

    // 4. Tự động tạo bài khảo sát dịch vụ bảo hành xe (KS-BH-...)
    try {
      surveyApi.createWarrantyServiceSurvey(updatedClaim, claim.customerId);
    } catch (err) {
      console.warn('Lỗi tạo khảo sát bảo hành:', err);
    }

    // 5. Gửi thông báo đến khách hàng (KS01, TB01)
    addCustomerNotification({
      customerId: claim.customerId || 'KH001',
      category: 'survey',
      icon: '📋',
      title: '📋 Khảo sát chất lượng Dịch vụ Bảo hành',
      message: `Hồ sơ bảo hành xe ${claim.xeBienSo} (#${claim.id}) đã hoàn tất. Vui lòng dành 1 phút đánh giá chất lượng tại Tab Khảo sát.`,
      page: 'dashboard',
      tab: 'surveys',
      targetId: claim.id,
    });

    // 6. Phát sự kiện cập nhật
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'warranty_claim_completed' } }));
    window.dispatchEvent(new CustomEvent('crm-admin-notification', { detail: { type: 'warranty_claim_completed', claimId: claim.id } }));

    return true;
  },
};


// ── SYSTEM API (DỌN DẸP & KHÔI PHỤC DỮ LIỆU DEMO 1-CLICK) ──
export const systemApi = {
  async resetDemoData(): Promise<{ success: boolean; message: string; data?: any }> {
    // 1. Dọn dẹp toàn bộ dữ liệu phát sinh trong quá trình demo/test ở localStorage
    const keysToRemove = [
      'crm_orders_cache',
      'crm_appointments_cache',
      'crm_feedbacks',
      'crm_admin_warranty_claims',
      'crm_admin_warranty_extensions',
      'crm_warranty_appointments',
      'crm_chat_messages',
      'crm_live_chat_channel',
      'crm_admin_notifications',
      'crm_survey_responses',
      'crm_insurance_contracts',
      'crm_warranty_records',
      'crm_admin_highlight',
      'crm_client_highlight',
    ];
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });

    // Làm sạch danh sách xe của khách hàng: xóa xe lái thử, giữ lại xe chính chủ chuẩn
    try {
      const vRaw = localStorage.getItem('crm_customer_vehicles');
      if (vRaw) {
        const vList = JSON.parse(vRaw);
        if (Array.isArray(vList)) {
          const cleaned = vList.filter((v: any) => {
            const bs = (v.bienSo || '').toUpperCase();
            return !bs.includes('LÁI-THỬ') && !bs.includes('LAI-THU') && !bs.includes('XE-LÁI');
          });
          localStorage.setItem('crm_customer_vehicles', JSON.stringify(cleaned));
        }
      }
    } catch {}
    // Khôi phục 50 xe mẫu showroom chuẩn hình ảnh local
    try {
      localStorage.setItem('crm_catalog_vehicles', JSON.stringify(DEFAULT_CATALOG_VEHICLES));
    } catch {}

    // 2. Gọi backend reset demo nếu backend đang chạy
    let backendResult: any = null;
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/System/reset-demo`, { method: 'POST' });
      if (res.ok) {
        backendResult = await res.json();
      }
    } catch {
      // Backend offline hoặc chạy chế độ client thuần
    }

    // 3. Bắn event đồng bộ toàn hệ thống
    window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'system_reset' } }));

    return backendResult || {
      success: true,
      message: 'Đã dọn dẹp sạch sẽ dữ liệu rác và khôi phục dữ liệu mẫu chuẩn (Phương án 2) thành công!',
    };
  },
};

