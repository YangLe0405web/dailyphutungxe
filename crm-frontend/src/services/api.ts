import {
  type Customer,
  type Vehicle,
  type Part,
  type Order,
  type Appointment,
  type StaffAccount,
  mockCustomers,
  mockVehicles,
  mockParts,
  mockOrders,
  mockAppointments,
  mockStaffAccounts,
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
        const id = item.maKH ? (item.maKH < 10 ? `KH00${item.maKH}` : `KH0${item.maKH}`) : `KH${idx + 1}`;
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
        };
      });
    } catch (err) {
      console.warn('[customerApi.getAll] Failed to fetch from backend, using mockData fallback:', err);
      return mockCustomers;
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
    const defaultUsername = (data.tenDangNhap || data.email.split('@')[0] || data.soDienThoai).replace(/[^a-zA-Z0-9]/g, '');
    let createdMaKH: number | undefined;
    let customerId = `KH${Date.now().toString().slice(-4)}`;

    try {
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

      if (res.ok) {
        const resData = await res.json();
        createdMaKH = resData.maKH || resData.MaKH;
        if (createdMaKH) {
          customerId = createdMaKH < 10 ? `KH00${createdMaKH}` : `KH0${createdMaKH}`;
        }
      }
    } catch (err) {
      console.warn('[customerApi.create] Backend failed or offline, fallback to local:', err);
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
      avatar: `/images/KH/kh${(createdMaKH ? (createdMaKH % 10) + 1 : 1)}.jpg`,
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
};

// ────────────────────────────────────────────────────────────
// 2. XE KHÁCH HÀNG & BẢO HÀNH API (VEHICLES & WARRANTY)
// ────────────────────────────────────────────────────────────
export const vehicleApi = {
  async getAll(): Promise<Vehicle[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/XeKhachHang`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return mockVehicles;

      return data.map((item: any) => {
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
        };
      });
    } catch (err) {
      console.warn('[vehicleApi.getAll] Failed to fetch from backend, using mockData fallback:', err);
      return mockVehicles;
    }
  },

  async renewWarranty(maXeSoHuuInt: number, newDateStr: string) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/XeKhachHang/gia-han/${maXeSoHuuInt}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanBaoHanhMoi: newDateStr }),
      });
      return res.ok;
    } catch (err) {
      console.warn('[vehicleApi.renewWarranty] Backend call failed, applied locally:', err);
      return false;
    }
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
  async getAll(): Promise<Order[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/DonHang`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return mockOrders;

      return data.map((item: any, idx: number) => {
        const id = item.maDon ? (item.maDon < 10 ? `DH00${item.maDon}` : `DH0${item.maDon}`) : `DH${idx + 1}`;
        const cId = item.maKH ? (item.maKH < 10 ? `KH00${item.maKH}` : `KH0${item.maKH}`) : 'KH001';
        const mockMatch = mockOrders.find(m => m.id === id);

        let tt: any = 'ChoDuyet';
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
    } catch (err) {
      console.warn('[orderApi.getAll] Failed to fetch from backend, using mockData fallback:', err);
      return mockOrders;
    }
  },

  async updateStatus(maDonInt: number, trangThaiText: string) {
    try {
      await fetchWithTimeout(`${API_BASE_URL}/DonHang/${maDonInt}/trang-thai`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trangThai: trangThaiText }),
      });
    } catch (err) {
      console.warn('[orderApi.updateStatus] Backend call failed, applied locally:', err);
    }
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
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/LichHen`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return mockAppointments;

      return data.map((item: any, idx: number) => {
        const id = item.maLich ? (item.maLich < 10 ? `LH00${item.maLich}` : `LH0${item.maLich}`) : `LH${idx + 1}`;
        const cId = item.maKH ? (item.maKH < 10 ? `KH00${item.maKH}` : `KH0${item.maKH}`) : 'KH001';
        const mockMatch = mockAppointments.find(m => m.id === id);

        let tt: any = 'ChoDuyet';
        if (item.trangThai === 'Đã xác nhận' || item.trangThai === 'DaXacNhan') tt = 'DaXacNhan';
        else if (item.trangThai === 'Đang thực hiện' || item.trangThai === 'DangThucHien') tt = 'DangThucHien';
        else if (item.trangThai === 'Hoàn thành' || item.trangThai === 'HoanThanh') tt = 'HoanThanh';
        else if (item.trangThai === 'Đã hủy' || item.trangThai === 'DaHuy') tt = 'DaHuy';

        let ldv: any = 'BaoDuong';
        if (item.loaiDichVu?.includes('Sửa') || item.loaiDichVu?.includes('Sua')) ldv = 'SuaChua';
        else if (item.loaiDichVu?.includes('Lái') || item.loaiDichVu?.includes('Lai')) ldv = 'LaiThu';

        let extractedXe = mockMatch?.tenXe || 'Honda SH 160i ABS';
        let extractedBs = mockMatch?.bienSo || '51K-123.45';
        if (item.ghiChu) {
          const xeMatch = item.ghiChu.match(/(?:Phương tiện|Xe):\s*([^-\]]+)/i);
          if (xeMatch && xeMatch[1]) extractedXe = xeMatch[1].trim();
          const bsMatch = item.ghiChu.match(/BS:\s*([^-\]]+)/i);
          if (bsMatch && bsMatch[1]) extractedBs = bsMatch[1].trim();
        }

        return {
          id,
          customerId: cId,
          hoTenKH: item.tenKhachHang || item.TenKhachHang || item.hoTenKH || item.HoTenKH || mockMatch?.hoTenKH || 'Khách hàng',
          soDienThoai: item.soDienThoai || mockMatch?.soDienThoai || '0901234567',
          loaiDichVu: ldv,
          ngayHen: item.ngayHen ? item.ngayHen.split('T')[0] : '2024-12-20',
          gioHen: item.ngayHen && item.ngayHen.includes('T') ? item.ngayHen.split('T')[1].slice(0, 5) : '09:00',
          trangThai: tt,
          ghiChu: item.ghiChu || '',
          tenXe: extractedXe,
          bienSo: extractedBs,
        };
      });
    } catch (err) {
      console.warn('[appointmentApi.getAll] Failed to fetch from backend, using mockData fallback:', err);
      return mockAppointments;
    }
  },

  async updateStatus(maLichInt: number, trangThaiText: string) {
    try {
      await fetchWithTimeout(`${API_BASE_URL}/LichHen/${maLichInt}/trang-thai`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trangThai: trangThaiText }),
      });
    } catch (err) {
      console.warn('[appointmentApi.updateStatus] Backend call failed, applied locally:', err);
    }
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

    const newAppt: Appointment = {
      id: apptId,
      customerId: data.customerId || `KH00${maKH}`,
      hoTenKH: data.hoTenKH,
      soDienThoai: data.soDienThoai,
      loaiDichVu: data.loaiDichVu,
      ngayHen: data.ngayHen,
      gioHen: data.gioHen,
      trangThai: 'ChoDuyet',
      ghiChu: data.ghiChu || '',
      tenXe: data.tenXe || 'Honda Wave Alpha 110cc',
      bienSo: data.bienSo || '51K-123.45',
    };

    mockAppointments.unshift(newAppt);

    const titleIcon = data.loaiDichVu === 'LaiThu' ? '🏍️ Lịch hẹn lái thử mới' : '📅 Lịch dịch vụ sửa chữa / bảo dưỡng mới';
    addAdminNotification({
      type: 'appointment_booked',
      title: titleIcon,
      message: `${newAppt.hoTenKH} (${newAppt.soDienThoai}) đặt hẹn ${svcLabel} lúc ${newAppt.gioHen} ngày ${newAppt.ngayHen}.`,
      linkPage: 'appointments',
      meta: newAppt,
    });

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
      if (cached) {
        const list: CatalogVehicle[] = JSON.parse(cached);
        const idx = list.findIndex(v => v.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...data };
          localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(list));
        }
      }
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

