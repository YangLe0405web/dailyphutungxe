import React, { useState, useEffect, useMemo } from 'react';
import {
  mockStaffAccounts,
  type StaffAccount,
  type AdminRole,
  formatVND,
  STANDARD_STAFF_TITLES,
  POPULAR_BANKS,
} from '../../data/mockData';
import { staffApi } from '../../services/api';

interface StaffRolesPageProps {
  currentStaff?: StaffAccount | null;
  onCurrentStaffChange?: (staff: StaffAccount | null) => void;
}

const roleLabels: Record<AdminRole, { label: string; bg: string; color: string; border: string }> = {
  SuperAdmin: { label: '👑 Super Admin (Quản trị viên)', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  NhanVienBanHang: { label: '💼 Nhân viên Bán hàng & CRM', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  NhanVienKyThuat: { label: '🔧 Nhân viên Kỹ thuật & Kho', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
};

const permissionMatrix = [
  { feature: '📊 Thống kê Dashboard & Doanh thu', superAdmin: true, sale: true, tech: true },
  { feature: '👥 Quản lý Khách hàng & Sửa/Xóa TK', superAdmin: true, sale: true, tech: false },
  { feature: '🏍️ Quản lý Xe của Khách & Gia hạn BH', superAdmin: true, sale: false, tech: true },
  { feature: '📦 Quản lý Đơn hàng Phụ tùng', superAdmin: true, sale: true, tech: false },
  { feature: '📅 Quản lý Lịch hẹn (Bảo dưỡng / Sửa chữa)', superAdmin: true, sale: false, tech: true },
  { feature: '🏎️ Quản lý Lịch hẹn Lái thử Xe', superAdmin: true, sale: true, tech: false },
  { feature: '💬 Quản lý Phản hồi & Tạo Khảo sát', superAdmin: true, sale: true, tech: false },
  { feature: '⚙️ Kho Phụ tùng & Phụ kiện', superAdmin: true, sale: false, tech: true },
  { feature: '🛵 Quản lý Xe mẫu & Cấu hình Lái thử', superAdmin: true, sale: true, tech: false },
  { feature: '🔒 Phân quyền Account & Quản lý Nhân sự', superAdmin: true, sale: false, tech: false },
];

const PRESET_AVATARS = [
  '/images/NV/nv1.jpg',
  '/images/NV/nv2.jpg',
  '/images/NV/nv3.jpg',
  '/images/NV/nv4.jpg',
  '/images/NV/nv5.jpg',
  '/images/KT/nvkt1.png',
  '/images/KT/nvkt2.png',
  '/images/KT/nvkt3.png',
  '/images/KT/nvkt4.png',
  '/images/KT/nvkt5.png',
];

interface StaffFormData {
  id?: string;
  hoTen: string;
  gioiTinh: 'Nam' | 'Nu' | 'Khac';
  ngaySinh: string;
  diaChi: string;
  cccd: string;
  soDienThoai: string;
  email: string;
  avatar: string;
  chucVu: string;
  ngayThamGia: string;
  loaiNhanVien: 'Full-time' | 'Part-time';
  luongCoBan: number;
  nganHang: string;
  soTaiKhoan: string;
  vaiTro: AdminRole;
  trangThai: 'HoatDong' | 'BiKhoa';
}

const emptyFormData: StaffFormData = {
  hoTen: '',
  gioiTinh: 'Nam',
  ngaySinh: '1995-01-01',
  diaChi: '',
  cccd: '',
  soDienThoai: '',
  email: '',
  avatar: PRESET_AVATARS[0],
  chucVu: STANDARD_STAFF_TITLES[1],
  ngayThamGia: new Date().toISOString().split('T')[0],
  loaiNhanVien: 'Full-time',
  luongCoBan: 12000000,
  nganHang: POPULAR_BANKS[0],
  soTaiKhoan: '',
  vaiTro: 'NhanVienBanHang',
  trangThai: 'HoatDong',
};

export default function StaffRolesPage({ currentStaff, onCurrentStaffChange }: StaffRolesPageProps) {
  const [staffList, setStaffList] = useState<StaffAccount[]>(mockStaffAccounts);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load live staff accounts from Backend API / localStorage cache
  useEffect(() => {
    let isMounted = true;
    staffApi.getAll().then(data => {
      if (isMounted && data && data.length > 0) {
        setStaffList(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── NV06: Bộ lọc nâng cao (Search & Filter state) ──
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | AdminRole>('All');
  const [titleFilter, setTitleFilter] = useState<'All' | string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'HoatDong' | 'BiKhoa'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Full-time' | 'Part-time'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ── NV07: Sắp xếp (Sort state) ──
  type SortKey = 'name_asc' | 'name_desc' | 'date_desc' | 'date_asc' | 'status_active' | 'status_locked' | 'title_asc' | 'salary_desc' | 'salary_asc';
  const [sortOption, setSortOption] = useState<SortKey>('date_desc');
  const [headerSortField, setHeaderSortField] = useState<'hoTen' | 'chucVu' | 'ngayThamGia' | 'luongCoBan' | 'trangThai' | null>(null);
  const [headerSortAsc, setHeaderSortAsc] = useState<boolean>(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffAccount | null>(null);

  // Đổi mật khẩu nhân viên state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStaff, setPasswordStaff] = useState<StaffAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Form states
  const [formData, setFormData] = useState<StaffFormData>(emptyFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedRole, setSelectedRole] = useState<AdminRole>('NhanVienBanHang');

  const openPasswordModal = (staff: StaffAccount) => {
    setPasswordStaff(staff);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setShowPasswordText(false);
    setShowPasswordModal(true);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordStaff) return;
    if (!newPassword.trim() || newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải gồm từ 6 ký tự trở lên!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không trùng khớp!');
      return;
    }

    await staffApi.changePassword(passwordStaff.id, newPassword.trim());

    // Cập nhật trong danh sách state
    const updatedList = staffList.map(s =>
      s.id === passwordStaff.id ? { ...s, matKhau: newPassword.trim() } : s
    );
    setStaffList(updatedList);
    staffApi.saveLocal(updatedList);

    // Đồng bộ session nếu là chính mình
    if (currentStaff?.id === passwordStaff.id) {
      const updated = { ...currentStaff, matKhau: newPassword.trim() };
      localStorage.setItem('crm_current_staff', JSON.stringify(updated));
      onCurrentStaffChange?.(updated);
    }

    setShowPasswordModal(false);
    setPasswordStaff(null);
    showToast(`🔑 Đã đổi mật khẩu thành công cho nhân viên: ${passwordStaff.hoTen}!`);
  };

  // NV03: Tự động gợi ý Vai trò theo Chức danh
  const suggestRoleFromTitle = (title: string): AdminRole => {
    if (title.includes('Quản lý')) return 'SuperAdmin';
    if (title.includes('Kỹ thuật') || title.includes('Thủ kho')) return 'NhanVienKyThuat';
    return 'NhanVienBanHang';
  };

  const handleTitleChange = (newTitle: string) => {
    const suggestedRole = suggestRoleFromTitle(newTitle);
    setFormData(prev => ({
      ...prev,
      chucVu: newTitle,
      vaiTro: suggestedRole,
    }));
  };

  // ── NV02 & NV04: Validation Engine ──
  const validateStaffForm = (data: StaffFormData, editingId?: string): boolean => {
    const errors: Record<string, string> = {};

    // Họ tên
    if (!data.hoTen.trim()) {
      errors.hoTen = 'Vui lòng nhập họ và tên nhân viên!';
    }

    // NV02: Validate Số điện thoại chuẩn Việt Nam (10 số, đầu 03, 05, 07, 08, 09)
    const phoneTrimmed = data.soDienThoai.trim();
    const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
    if (!phoneTrimmed) {
      errors.soDienThoai = 'Vui lòng nhập số điện thoại!';
    } else if (!phoneRegex.test(phoneTrimmed)) {
      errors.soDienThoai = 'Số điện thoại không hợp lệ! Phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08, 09.';
    }

    // Email
    const emailTrimmed = data.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed) {
      errors.email = 'Vui lòng nhập địa chỉ email!';
    } else if (!emailRegex.test(emailTrimmed)) {
      errors.email = 'Email không hợp lệ (ví dụ: nhanvien@motoshop.vn)!';
    }

    // CCCD (12 chữ số)
    const cccdTrimmed = data.cccd.trim();
    const cccdRegex = /^\d{12}$/;
    if (!cccdTrimmed) {
      errors.cccd = 'Vui lòng nhập số CCCD (Căn cước công dân)!';
    } else if (!cccdRegex.test(cccdTrimmed)) {
      errors.cccd = 'Số CCCD phải gồm đúng 12 chữ số!';
    }

    // Ngày sinh (phải từ 18 tuổi trở lên)
    if (!data.ngaySinh) {
      errors.ngaySinh = 'Vui lòng chọn ngày sinh!';
    } else {
      const birth = new Date(data.ngaySinh);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 18) {
        errors.ngaySinh = `Nhân viên phải từ đủ 18 tuổi trở lên (hiện tại ${age} tuổi)!`;
      }
    }

    // Địa chỉ
    if (!data.diaChi.trim()) {
      errors.diaChi = 'Vui lòng nhập địa chỉ cư trú!';
    }

    // Số tài khoản ngân hàng
    if (!data.soTaiKhoan.trim()) {
      errors.soTaiKhoan = 'Vui lòng nhập số tài khoản ngân hàng!';
    } else if (!/^\d{6,20}$/.test(data.soTaiKhoan.trim())) {
      errors.soTaiKhoan = 'Số tài khoản phải gồm từ 6 đến 20 chữ số!';
    }

    // Lương cơ bản
    if (!data.luongCoBan || data.luongCoBan < 1000000) {
      errors.luongCoBan = 'Lương cơ bản tối thiểu là 1,000,000 đ!';
    }

    // ── NV04: Kiểm tra trùng nhân viên (CCCD, Email, SĐT) ──
    const dupCCCD = staffList.find(s => s.id !== editingId && s.cccd && s.cccd.trim() === cccdTrimmed);
    if (dupCCCD) {
      errors.cccd = `Số CCCD "${cccdTrimmed}" đã tồn tại trên hệ thống (thuộc nhân viên: ${dupCCCD.hoTen} - ${dupCCCD.id})!`;
    }

    const dupEmail = staffList.find(s => s.id !== editingId && s.email.trim().toLowerCase() === emailTrimmed.toLowerCase());
    if (dupEmail) {
      errors.email = `Email "${emailTrimmed}" đã được sử dụng (thuộc nhân viên: ${dupEmail.hoTen} - ${dupEmail.id})!`;
    }

    const dupPhone = staffList.find(s => s.id !== editingId && s.soDienThoai.trim() === phoneTrimmed);
    if (dupPhone) {
      errors.soDienThoai = `Số điện thoại "${phoneTrimmed}" đã được sử dụng (thuộc nhân viên: ${dupPhone.hoTen} - ${dupPhone.id})!`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── NV05: Đồng bộ thông tin nhân sự với phiên đăng nhập hiện tại ──
  const syncLoggedInUserSession = (updatedStaff: StaffAccount) => {
    // Kiểm tra nếu nhân viên vừa sửa trùng khớp với tài khoản hiện tại đang đăng nhập
    const isCurrent =
      (currentStaff && currentStaff.id === updatedStaff.id) ||
      (currentStaff && currentStaff.email.toLowerCase() === updatedStaff.email.toLowerCase());

    if (isCurrent) {
      const merged: StaffAccount = { ...currentStaff, ...updatedStaff };
      localStorage.setItem('crm_current_staff', JSON.stringify(merged));
      onCurrentStaffChange?.(merged);
      window.dispatchEvent(new Event('crm-staff-change'));
      showToast(`⚡ Đã cập nhật & đồng bộ phiên làm việc của tài khoản hiện tại (${updatedStaff.hoTen})!`);
    }
  };

  // ── Thêm Nhân Viên Mới (Submit) ──
  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStaffForm(formData)) return;

    // Generate Mã NV dạng STxxx
    const nextNum = staffList.length + 1;
    const generatedId = nextNum < 10 ? `ST00${nextNum}` : nextNum < 100 ? `ST0${nextNum}` : `ST${nextNum}`;

    const newStaffAccount: StaffAccount = {
      id: generatedId,
      hoTen: formData.hoTen.trim(),
      gioiTinh: formData.gioiTinh,
      ngaySinh: formData.ngaySinh,
      diaChi: formData.diaChi.trim(),
      cccd: formData.cccd.trim(),
      soDienThoai: formData.soDienThoai.trim(),
      email: formData.email.trim(),
      avatar: formData.avatar || PRESET_AVATARS[0],
      chucVu: formData.chucVu,
      ngayThamGia: formData.ngayThamGia || new Date().toISOString().split('T')[0],
      loaiNhanVien: formData.loaiNhanVien,
      luongCoBan: Number(formData.luongCoBan),
      nganHang: formData.nganHang,
      soTaiKhoan: formData.soTaiKhoan.trim(),
      vaiTro: formData.vaiTro,
      trangThai: formData.trangThai,
    };

    const updatedList = [newStaffAccount, ...staffList];
    setStaffList(updatedList);
    staffApi.saveLocal(updatedList);
    setShowAddModal(false);
    setFormData(emptyFormData);
    setFormErrors({});
    showToast(`✅ Đã thêm thành công nhân viên mới: ${newStaffAccount.hoTen} (${newStaffAccount.id})!`);
  };

  // ── Sửa Hồ Sơ Nhân Viên (Submit) ──
  const handleEditProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    if (!validateStaffForm(formData, selectedStaff.id)) return;

    const updatedStaff: StaffAccount = {
      ...selectedStaff,
      hoTen: formData.hoTen.trim(),
      gioiTinh: formData.gioiTinh,
      ngaySinh: formData.ngaySinh,
      diaChi: formData.diaChi.trim(),
      cccd: formData.cccd.trim(),
      soDienThoai: formData.soDienThoai.trim(),
      email: formData.email.trim(),
      avatar: formData.avatar || selectedStaff.avatar,
      chucVu: formData.chucVu,
      ngayThamGia: formData.ngayThamGia,
      loaiNhanVien: formData.loaiNhanVien,
      luongCoBan: Number(formData.luongCoBan),
      nganHang: formData.nganHang,
      soTaiKhoan: formData.soTaiKhoan.trim(),
      vaiTro: formData.vaiTro,
      trangThai: formData.trangThai,
    };

    const updatedList = staffList.map(s => (s.id === selectedStaff.id ? updatedStaff : s));
    setStaffList(updatedList);
    staffApi.saveLocal(updatedList);

    // NV05: Đồng bộ session nếu là chính mình
    syncLoggedInUserSession(updatedStaff);

    setShowEditProfileModal(false);
    setSelectedStaff(updatedStaff);
    showToast(`✅ Đã cập nhật hồ sơ nhân viên: ${updatedStaff.hoTen}!`);
  };

  // ── Đổi Vai Trò Nhanh (RBAC) ──
  const handleSaveRole = () => {
    if (!selectedStaff) return;
    const updatedStaff: StaffAccount = { ...selectedStaff, vaiTro: selectedRole };
    const updatedList = staffList.map(s => (s.id === selectedStaff.id ? updatedStaff : s));
    setStaffList(updatedList);
    staffApi.saveLocal(updatedList);

    // NV05: Đồng bộ session nếu sửa đúng tài khoản đang login
    syncLoggedInUserSession(updatedStaff);

    setShowRoleModal(false);
    setSelectedStaff(null);
    showToast(`🔒 Đã cập nhật vai trò ${roleLabels[selectedRole].label} cho ${selectedStaff.hoTen}!`);
  };

  // Khóa / Mở khóa tài khoản
  const toggleStatus = async (id: string) => {
    const target = staffList.find(s => s.id === id);
    if (!target) return;
    const nextState = target.trangThai === 'HoatDong' ? 'BiKhoa' : 'HoatDong';
    const updatedStaff: StaffAccount = { ...target, trangThai: nextState };
    const updatedList = staffList.map(s => (s.id === id ? updatedStaff : s));
    setStaffList(updatedList);
    staffApi.saveLocal(updatedList);
    await staffApi.toggleStatus(id);

    syncLoggedInUserSession(updatedStaff);
    showToast(
      nextState === 'BiKhoa'
        ? `🔒 Đã khóa tài khoản nhân viên ${target.hoTen}!`
        : `✓ Đã mở khóa tài khoản nhân viên ${target.hoTen}!`
    );
  };

  // Xóa tài khoản nhân viên
  const handleDeleteStaff = (staff: StaffAccount) => {
    if (staff.id === currentStaff?.id) {
      alert('⚠️ Không thể tự xóa tài khoản đang đăng nhập trong phiên làm việc hiện tại!');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản nhân viên "${staff.hoTen}" (${staff.id})?`)) {
      const updatedList = staffList.filter(s => s.id !== staff.id);
      setStaffList(updatedList);
      staffApi.saveLocal(updatedList);
      showToast(`🗑️ Đã xóa tài khoản nhân viên: ${staff.hoTen}`);
    }
  };

  // Mở modal Sửa hồ sơ
  const openEditModal = (staff: StaffAccount) => {
    setSelectedStaff(staff);
    setFormData({
      id: staff.id,
      hoTen: staff.hoTen,
      gioiTinh: staff.gioiTinh || 'Nam',
      ngaySinh: staff.ngaySinh || '1995-01-01',
      diaChi: staff.diaChi || '',
      cccd: staff.cccd || '',
      soDienThoai: staff.soDienThoai,
      email: staff.email,
      avatar: staff.avatar || PRESET_AVATARS[0],
      chucVu: staff.chucVu,
      ngayThamGia: staff.ngayThamGia,
      loaiNhanVien: staff.loaiNhanVien || 'Full-time',
      luongCoBan: staff.luongCoBan || 15000000,
      nganHang: staff.nganHang || POPULAR_BANKS[0],
      soTaiKhoan: staff.soTaiKhoan || '',
      vaiTro: staff.vaiTro,
      trangThai: staff.trangThai,
    });
    setFormErrors({});
    setShowEditProfileModal(true);
  };

  // Mở modal Xem chi tiết
  const openDetailModal = (staff: StaffAccount) => {
    setSelectedStaff(staff);
    setShowDetailModal(true);
  };

  // Mở modal Phân quyền nhanh
  const openRoleModal = (staff: StaffAccount) => {
    setSelectedStaff(staff);
    setSelectedRole(staff.vaiTro);
    setShowRoleModal(true);
  };

  // Đặt lại toàn bộ bộ lọc
  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('All');
    setTitleFilter('All');
    setStatusFilter('All');
    setTypeFilter('All');
    setStartDate('');
    setEndDate('');
    setSortOption('date_desc');
    setHeaderSortField(null);
  };

  const isFilterActive =
    search.trim() !== '' ||
    roleFilter !== 'All' ||
    titleFilter !== 'All' ||
    statusFilter !== 'All' ||
    typeFilter !== 'All' ||
    startDate !== '' ||
    endDate !== '';

  // ── NV06 & NV07: Lọc và Sắp xếp danh sách nhân viên ──
  const processedStaffList = useMemo(() => {
    // 1. Filter
    const filtered = staffList.filter(s => {
      // Keyword match (hoTen, email, phone, cccd, id)
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.hoTen.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.soDienThoai.includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.cccd && s.cccd.includes(q)) ||
        (s.chucVu && s.chucVu.toLowerCase().includes(q));

      // Vai trò
      const matchRole = roleFilter === 'All' || s.vaiTro === roleFilter;

      // Chức danh
      const matchTitle = titleFilter === 'All' || s.chucVu === titleFilter;

      // Trạng thái
      const matchStatus = statusFilter === 'All' || s.trangThai === statusFilter;

      // Loại nhân viên
      const matchType = typeFilter === 'All' || s.loaiNhanVien === typeFilter;

      // Ngày vào làm
      let matchDate = true;
      if (startDate) {
        matchDate = matchDate && s.ngayThamGia >= startDate;
      }
      if (endDate) {
        matchDate = matchDate && s.ngayThamGia <= endDate;
      }

      return matchSearch && matchRole && matchTitle && matchStatus && matchType && matchDate;
    });

    // 2. Sort
    // Ưu tiên click header bảng nếu có
    if (headerSortField) {
      filtered.sort((a, b) => {
        let valA: any = a[headerSortField];
        let valB: any = b[headerSortField];

        if (headerSortField === 'luongCoBan') {
          valA = a.luongCoBan || 0;
          valB = b.luongCoBan || 0;
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB || '').toLowerCase();
        }

        if (valA < valB) return headerSortAsc ? -1 : 1;
        if (valA > valB) return headerSortAsc ? 1 : -1;
        return 0;
      });
      return filtered;
    }

    // Nếu không sort theo header, sort theo dropdown sortOption
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'name_asc':
          return a.hoTen.localeCompare(b.hoTen, 'vi');
        case 'name_desc':
          return b.hoTen.localeCompare(a.hoTen, 'vi');
        case 'date_desc':
          return b.ngayThamGia.localeCompare(a.ngayThamGia);
        case 'date_asc':
          return a.ngayThamGia.localeCompare(b.ngayThamGia);
        case 'status_active':
          return a.trangThai === 'HoatDong' ? -1 : 1;
        case 'status_locked':
          return a.trangThai === 'BiKhoa' ? -1 : 1;
        case 'title_asc':
          return a.chucVu.localeCompare(b.chucVu, 'vi');
        case 'salary_desc':
          return (b.luongCoBan || 0) - (a.luongCoBan || 0);
        case 'salary_asc':
          return (a.luongCoBan || 0) - (b.luongCoBan || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    staffList,
    search,
    roleFilter,
    titleFilter,
    statusFilter,
    typeFilter,
    startDate,
    endDate,
    sortOption,
    headerSortField,
    headerSortAsc,
  ]);

  // Click header table để đảo chiều sắp xếp
  const handleHeaderSort = (field: 'hoTen' | 'chucVu' | 'ngayThamGia' | 'luongCoBan' | 'trangThai') => {
    if (headerSortField === field) {
      setHeaderSortAsc(!headerSortAsc);
    } else {
      setHeaderSortField(field);
      setHeaderSortAsc(true);
    }
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter(s => s.trangThai === 'HoatDong').length;
    const locked = total - active;
    const fullTime = staffList.filter(s => s.loaiNhanVien === 'Full-time' || !s.loaiNhanVien).length;
    const partTime = total - fullTime;
    return { total, active, locked, fullTime, partTime };
  }, [staffList]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-zinc-800 animate-bounce">
          <span className="text-emerald-400 font-bold">●</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--color-zinc-900)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            HỒ SƠ NHÂN SỰ & PHÂN QUYỀN HỆ THỐNG
          </div>
          <p className="text-xs mt-1 text-zinc-500">
            Quản lý toàn diện lý lịch, số CCCD, tài khoản ngân hàng, bậc lương, phân quyền vai trò RBAC và đồng bộ phiên đăng nhập
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFormData(emptyFormData);
              setFormErrors({});
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 transition shadow-sm cursor-pointer"
          >
            <span className="text-base leading-none">＋</span> Thêm nhân viên mới
          </button>
        </div>
      </div>

      {/* Stats Counter Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase">Tổng nhân sự</div>
            <div className="text-xl font-extrabold text-zinc-900 font-mono mt-0.5">{stats.total}</div>
          </div>
          <span className="text-2xl">👥</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between bg-emerald-50/20">
          <div>
            <div className="text-[11px] font-bold text-emerald-700 uppercase">Đang hoạt động</div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono mt-0.5">{stats.active}</div>
          </div>
          <span className="text-2xl">🟢</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-red-200 shadow-xs flex items-center justify-between bg-red-50/20">
          <div>
            <div className="text-[11px] font-bold text-red-700 uppercase">Tài khoản bị khóa</div>
            <div className="text-xl font-extrabold text-red-700 font-mono mt-0.5">{stats.locked}</div>
          </div>
          <span className="text-2xl">🔒</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shadow-xs flex items-center justify-between bg-blue-50/20">
          <div>
            <div className="text-[11px] font-bold text-blue-700 uppercase">Hình thức làm việc</div>
            <div className="text-xs font-extrabold text-blue-800 font-mono mt-1">
              {stats.fullTime} Full-time / {stats.partTime} Part-time
            </div>
          </div>
          <span className="text-2xl">⏱️</span>
        </div>
      </div>

      {/* NV06: Advanced Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
        {/* Row 1: Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              placeholder="🔍 Tìm theo Họ tên, Email, SĐT, CCCD, Mã..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-600 bg-zinc-50/50 focus:bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600 text-zinc-800"
          >
            <option value="All">Tất cả vai trò RBAC</option>
            <option value="SuperAdmin">👑 Super Admin</option>
            <option value="NhanVienBanHang">💼 Nhân viên Bán hàng</option>
            <option value="NhanVienKyThuat">🔧 Nhân viên Kỹ thuật</option>
          </select>

          {/* Job Title Filter (NV03 & NV06) */}
          <select
            value={titleFilter}
            onChange={e => setTitleFilter(e.target.value)}
            className="px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600 text-zinc-800"
          >
            <option value="All">Tất cả chức danh công việc</option>
            {STANDARD_STAFF_TITLES.map(title => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600 text-zinc-800"
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="HoatDong">🟢 Đang hoạt động</option>
            <option value="BiKhoa">🔒 Đã bị khóa</option>
          </select>
        </div>

        {/* Row 2: Date filters, Type filter, Sort dropdown & Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-2 border-t border-zinc-100 items-center">
          {/* Loại nhân viên */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 border rounded-xl text-xs font-medium bg-white focus:outline-none focus:border-red-600 text-zinc-700"
          >
            <option value="All">Mọi loại hợp đồng</option>
            <option value="Full-time">Full-time (Toàn thời gian)</option>
            <option value="Part-time">Part-time (Bán thời gian)</option>
          </select>

          {/* Ngày bắt đầu làm việc từ */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <span className="text-[11px] text-zinc-400 whitespace-nowrap">Từ:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-2 py-1.5 border rounded-xl text-xs focus:outline-none focus:border-red-600 bg-white"
            />
          </div>

          {/* Ngày bắt đầu làm việc đến */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <span className="text-[11px] text-zinc-400 whitespace-nowrap">Đến:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-2 py-1.5 border rounded-xl text-xs focus:outline-none focus:border-red-600 bg-white"
            />
          </div>

          {/* NV07: Dropdown sắp xếp đa tiêu chí */}
          <div className="lg:col-span-2 flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-400 whitespace-nowrap">Sắp xếp:</span>
            <select
              value={sortOption}
              onChange={e => {
                setSortOption(e.target.value as SortKey);
                setHeaderSortField(null);
              }}
              className="w-full px-3 py-1.5 border rounded-xl text-xs font-semibold bg-zinc-50 focus:outline-none focus:border-red-600 text-zinc-800"
            >
              <option value="date_desc">📅 Ngày vào làm: Mới nhất trước</option>
              <option value="date_asc">📅 Ngày vào làm: Cũ nhất trước</option>
              <option value="name_asc">🔤 Họ và tên: A → Z</option>
              <option value="name_desc">🔤 Họ và tên: Z → A</option>
              <option value="title_asc">💼 Chức danh: A → Z</option>
              <option value="salary_desc">💰 Lương cơ bản: Cao nhất trước</option>
              <option value="salary_asc">💰 Lương cơ bản: Thấp nhất trước</option>
              <option value="status_active">🟢 Ưu tiên tài khoản Hoạt động</option>
              <option value="status_locked">🔒 Ưu tiên tài khoản Bị khóa</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="flex justify-end">
            {isFilterActive ? (
              <button
                onClick={handleResetFilters}
                className="w-full sm:w-auto px-3 py-1.5 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-semibold hover:bg-zinc-200 transition cursor-pointer"
              >
                🔄 Đặt lại bộ lọc
              </button>
            ) : (
              <span className="text-[11px] font-mono text-zinc-400 text-right w-full">
                Khớp: <strong>{processedStaffList.length}</strong> / {staffList.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto bg-white rounded-2xl border border-zinc-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-950 text-white font-mono text-xs uppercase select-none">
            <tr>
              <th className="p-3 text-center w-12">STT</th>
              <th
                onClick={() => handleHeaderSort('hoTen')}
                className="p-3 text-left cursor-pointer hover:bg-zinc-900 transition"
                title="Bấm để sắp xếp theo Tên"
              >
                Nhân viên {headerSortField === 'hoTen' ? (headerSortAsc ? '▲' : '▼') : '⇅'}
              </th>
              <th
                onClick={() => handleHeaderSort('chucVu')}
                className="p-3 text-left cursor-pointer hover:bg-zinc-900 transition"
                title="Bấm để sắp xếp theo Chức danh"
              >
                Chức danh công việc {headerSortField === 'chucVu' ? (headerSortAsc ? '▲' : '▼') : '⇅'}
              </th>
              <th className="p-3 text-left">Liên hệ & CCCD</th>
              <th
                onClick={() => handleHeaderSort('luongCoBan')}
                className="p-3 text-left cursor-pointer hover:bg-zinc-900 transition"
                title="Bấm để sắp xếp theo Lương"
              >
                Lương & Ngân hàng {headerSortField === 'luongCoBan' ? (headerSortAsc ? '▲' : '▼') : '⇅'}
              </th>
              <th className="p-3 text-left">Vai trò phân quyền</th>
              <th
                onClick={() => handleHeaderSort('trangThai')}
                className="p-3 text-center cursor-pointer hover:bg-zinc-900 transition"
                title="Bấm để sắp xếp theo Trạng thái"
              >
                Trạng thái {headerSortField === 'trangThai' ? (headerSortAsc ? '▲' : '▼') : '⇅'}
              </th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {processedStaffList.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-zinc-500 text-xs">
                  <div className="text-3xl mb-2">🔍</div>
                  Không tìm thấy tài khoản nhân viên nào khớp với bộ lọc hiện tại.
                  <div className="mt-2">
                    <button
                      onClick={handleResetFilters}
                      className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
                    >
                      Bấm vào đây để xóa bộ lọc
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              processedStaffList.map((staff, idx) => {
                const roleMeta = roleLabels[staff.vaiTro];
                const isCurrent = Boolean(
                  (currentStaff && currentStaff.id === staff.id) ||
                  (currentStaff && currentStaff.email.toLowerCase() === staff.email.toLowerCase())
                );

                return (
                  <tr
                    key={staff.id}
                    className={`hover:bg-zinc-50/80 transition ${isCurrent ? 'bg-amber-50/40' : ''}`}
                  >
                    {/* STT */}
                    <td className="p-3 text-center font-mono text-xs text-zinc-400">{idx + 1}</td>

                    {/* Họ tên & Avatar */}
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={staff.avatar || PRESET_AVATARS[0]}
                          alt={staff.hoTen}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-200 shadow-xs shrink-0"
                          onError={e => {
                            (e.target as HTMLImageElement).src = PRESET_AVATARS[0];
                          }}
                        />
                        <div>
                          <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                            <span
                              onClick={() => openDetailModal(staff)}
                              className="hover:text-red-700 hover:underline cursor-pointer"
                              title="Bấm để xem hồ sơ chi tiết"
                            >
                              {staff.hoTen}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                Bạn
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-zinc-600">{staff.id}</span>
                            <span>•</span>
                            <span>{staff.gioiTinh === 'Nu' ? 'Nữ' : staff.gioiTinh === 'Nam' ? 'Nam' : 'Khác'}</span>
                            <span>•</span>
                            <span>{staff.ngaySinh || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Chức danh & Loại hợp đồng */}
                    <td className="p-3">
                      <div className="font-semibold text-xs text-zinc-900">{staff.chucVu}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                          {staff.loaiNhanVien || 'Full-time'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Vào làm: {staff.ngayThamGia}
                        </span>
                      </div>
                    </td>

                    {/* Liên hệ & CCCD */}
                    <td className="p-3 text-xs font-mono text-zinc-600">
                      <div className="text-zinc-900 font-medium">{staff.email}</div>
                      <div className="text-zinc-600">{staff.soDienThoai}</div>
                      <div className="text-[11px] text-zinc-400">CCCD: {staff.cccd || 'Chưa cập nhật'}</div>
                    </td>

                    {/* Lương & Ngân hàng */}
                    <td className="p-3 text-xs">
                      <div className="font-mono font-bold text-emerald-700">
                        {formatVND(staff.luongCoBan || 0)}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                        {staff.nganHang || 'N/A'}: <span className="font-mono text-zinc-700">{staff.soTaiKhoan || 'N/A'}</span>
                      </div>
                    </td>

                    {/* Vai trò RBAC */}
                    <td className="p-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-bold font-mono inline-block border shadow-xs"
                        style={{
                          background: roleMeta.bg,
                          color: roleMeta.color,
                          borderColor: roleMeta.border,
                        }}
                      >
                        {roleMeta.label}
                      </span>
                    </td>

                    {/* Trạng thái HoatDong / BiKhoa */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleStatus(staff.id)}
                        title="Bấm để Khóa / Mở khóa tài khoản"
                        className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono transition cursor-pointer border ${
                          staff.trangThai === 'HoatDong'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
                        }`}
                      >
                        {staff.trangThai === 'HoatDong' ? '✓ Hoạt động' : '🔒 Đã khóa'}
                      </button>
                    </td>

                    {/* Thao tác */}
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openDetailModal(staff)}
                          className="px-2 py-1 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-lg hover:bg-zinc-200 transition cursor-pointer"
                          title="Xem hồ sơ chi tiết"
                        >
                          👁️ Xem
                        </button>
                        <button
                          onClick={() => openEditModal(staff)}
                          className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium rounded-lg hover:bg-blue-100 transition cursor-pointer"
                          title="Chỉnh sửa toàn bộ hồ sơ"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          onClick={() => openRoleModal(staff)}
                          className="px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                          title="Đổi vai trò RBAC nhanh"
                        >
                          🔒 Quyền
                        </button>
                        <button
                          onClick={() => openPasswordModal(staff)}
                          className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium rounded-lg hover:bg-amber-100 transition cursor-pointer"
                          title="Đổi mật khẩu tài khoản nhân viên"
                        >
                          🔑 MK
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staff)}
                          disabled={isCurrent}
                          className={`px-2 py-1 text-xs font-medium rounded-lg transition ${
                            isCurrent
                              ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                              : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 cursor-pointer'
                          }`}
                          title={isCurrent ? 'Không thể xóa tài khoản đang đăng nhập' : 'Xóa tài khoản nhân viên'}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Permission Matrix Table (RBAC) */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
        <div>
          <h3
            className="text-base font-extrabold text-zinc-900 uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            MA TRẬN PHÂN QUYỀN CHI TIẾT (RBAC PERMISSION MATRIX)
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Bảng ma trận kiểm soát truy cập và phân định ranh giới chức năng giữa các vai trò trong hệ thống Motoshop CRM
          </p>
        </div>

        <div className="overflow-x-auto border border-zinc-200 rounded-xl">
          <table className="min-w-full text-xs">
            <thead className="bg-zinc-100 text-zinc-800 font-mono font-bold border-b border-zinc-200">
              <tr>
                <th className="p-3 text-left">TÍNH NĂNG HỆ THỐNG</th>
                <th className="p-3 text-center w-44 text-red-700 bg-red-50/50">👑 SUPER ADMIN</th>
                <th className="p-3 text-center w-44 text-blue-700 bg-blue-50/50">💼 NHÂN VIÊN BÁN HÀNG</th>
                <th className="p-3 text-center w-44 text-emerald-700 bg-emerald-50/50">🔧 NHÂN VIÊN KỸ THUẬT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {permissionMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50">
                  <td className="p-3 font-semibold text-zinc-900">{item.feature}</td>
                  <td className="p-3 text-center bg-red-50/20">
                    {item.superAdmin ? (
                      <span className="text-emerald-600 font-extrabold text-sm">✓ Toàn quyền</span>
                    ) : (
                      <span className="text-zinc-300">✕</span>
                    )}
                  </td>
                  <td className="p-3 text-center bg-blue-50/20">
                    {item.sale ? (
                      <span className="text-blue-600 font-bold text-sm">✓ Cho phép</span>
                    ) : (
                      <span className="text-zinc-300">✕ Không</span>
                    )}
                  </td>
                  <td className="p-3 text-center bg-emerald-50/20">
                    {item.tech ? (
                      <span className="text-emerald-600 font-bold text-sm">✓ Cho phép</span>
                    ) : (
                      <span className="text-zinc-300">✕ Không</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL 1: THÊM NHÂN VIÊN MỚI (NV01, NV02, NV03, NV04)        */}
      {/* ─────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 uppercase">
                  Thêm Tài Khoản Nhân Viên Mới
                </h3>
                <p className="text-xs text-zinc-500">
                  Điền đầy đủ các trường thông tin nhân sự theo quy định nội bộ Showroom
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              {/* PHẦN 1: THÔNG TIN CÁ NHÂN */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                <div className="text-xs font-bold uppercase text-zinc-700 flex items-center gap-2">
                  <span>👤</span> Thông tin cá nhân & Liên hệ
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Họ tên */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Họ và tên nhân viên <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Trần Đình Trọng"
                      value={formData.hoTen}
                      onChange={e => {
                        setFormData({ ...formData, hoTen: e.target.value });
                        if (formErrors.hoTen) setFormErrors({ ...formErrors, hoTen: '' });
                      }}
                      className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none ${
                        formErrors.hoTen ? 'border-red-500 bg-red-50/20' : 'border-zinc-300 focus:border-red-600'
                      }`}
                    />
                    {formErrors.hoTen && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.hoTen}</p>}
                  </div>

                  {/* Giới tính */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Giới tính <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.gioiTinh}
                      onChange={e => setFormData({ ...formData, gioiTinh: e.target.value as any })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs bg-white focus:outline-none focus:border-red-600"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nu">Nữ</option>
                      <option value="Khac">Khác</option>
                    </select>
                  </div>

                  {/* Ngày sinh */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Ngày sinh <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.ngaySinh}
                      onChange={e => {
                        setFormData({ ...formData, ngaySinh: e.target.value });
                        if (formErrors.ngaySinh) setFormErrors({ ...formErrors, ngaySinh: '' });
                      }}
                      className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none ${
                        formErrors.ngaySinh ? 'border-red-500 bg-red-50/20' : 'border-zinc-300 focus:border-red-600'
                      }`}
                    />
                    {formErrors.ngaySinh && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.ngaySinh}</p>}
                  </div>

                  {/* Số CCCD (NV01 & NV04) */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Số CCCD (12 số) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="079095001234"
                      value={formData.cccd}
                      onChange={e => {
                        setFormData({ ...formData, cccd: e.target.value });
                        if (formErrors.cccd) setFormErrors({ ...formErrors, cccd: '' });
                      }}
                      className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none ${
                        formErrors.cccd ? 'border-red-500 bg-red-50/20' : 'border-zinc-300 focus:border-red-600'
                      }`}
                    />
                    {formErrors.cccd && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.cccd}</p>}
                  </div>

                  {/* Số điện thoại (NV02 & NV04) */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Số điện thoại di động <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="0988777666"
                      value={formData.soDienThoai}
                      onChange={e => {
                        setFormData({ ...formData, soDienThoai: e.target.value });
                        if (formErrors.soDienThoai) setFormErrors({ ...formErrors, soDienThoai: '' });
                      }}
                      className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none ${
                        formErrors.soDienThoai ? 'border-red-500 bg-red-50/20' : 'border-zinc-300 focus:border-red-600'
                      }`}
                    />
                    {formErrors.soDienThoai && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.soDienThoai}</p>}
                    <span className="text-[10px] text-zinc-400 block mt-0.5">10 chữ số, đầu 03, 05, 07, 08, 09</span>
                  </div>

                  {/* Email (NV04) */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Email đăng nhập <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="trong.tran@motoshop.vn"
                      value={formData.email}
                      onChange={e => {
                        setFormData({ ...formData, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                      }}
                      className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none ${
                        formErrors.email ? 'border-red-500 bg-red-50/20' : 'border-zinc-300 focus:border-red-600'
                      }`}
                    />
                    {formErrors.email && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.email}</p>}
                  </div>

                  {/* Địa chỉ */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Địa chỉ cư trú <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Số nhà, đường, phường, quận, TP"
                      value={formData.diaChi}
                      onChange={e => {
                        setFormData({ ...formData, diaChi: e.target.value });
                        if (formErrors.diaChi) setFormErrors({ ...formErrors, diaChi: '' });
                      }}
                      className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none ${
                        formErrors.diaChi ? 'border-red-500 bg-red-50/20' : 'border-zinc-300 focus:border-red-600'
                      }`}
                    />
                    {formErrors.diaChi && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.diaChi}</p>}
                  </div>

                  {/* Chọn Avatar preset */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Chọn ảnh đại diện nhân sự
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {PRESET_AVATARS.map((av, idx) => (
                        <img
                          key={idx}
                          src={av}
                          alt="avatar"
                          onClick={() => setFormData({ ...formData, avatar: av })}
                          className={`w-10 h-10 rounded-full object-cover cursor-pointer border-2 transition ${
                            formData.avatar === av
                              ? 'border-red-600 scale-110 shadow-md ring-2 ring-red-200'
                              : 'border-zinc-200 opacity-60 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: CÔNG VIỆC & PHÂN QUYỀN RBAC (NV01, NV03) */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                <div className="text-xs font-bold uppercase text-zinc-700 flex items-center gap-2">
                  <span>💼</span> Vị trí công việc & Phân quyền
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Chức danh (NV03: Dropdown chuẩn) */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Chức danh công việc <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.chucVu}
                      onChange={e => handleTitleChange(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs bg-white font-medium focus:outline-none focus:border-red-600"
                    >
                      {STANDARD_STAFF_TITLES.map(title => (
                        <option key={title} value={title}>
                          {title}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">
                      (Hệ thống tự động đề xuất vai trò RBAC phù hợp)
                    </span>
                  </div>

                  {/* Vai trò RBAC */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Vai trò phân quyền (RBAC) <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.vaiTro}
                      onChange={e => setFormData({ ...formData, vaiTro: e.target.value as AdminRole })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs bg-white font-bold text-zinc-800 focus:outline-none focus:border-red-600"
                    >
                      <option value="SuperAdmin">👑 Super Admin (Toàn quyền)</option>
                      <option value="NhanVienBanHang">💼 Nhân viên Bán hàng & CRM</option>
                      <option value="NhanVienKyThuat">🔧 Nhân viên Kỹ thuật & Kho</option>
                    </select>
                  </div>

                  {/* Loại nhân viên */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Hình thức làm việc <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.loaiNhanVien}
                      onChange={e => setFormData({ ...formData, loaiNhanVien: e.target.value as any })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs bg-white focus:outline-none focus:border-red-600"
                    >
                      <option value="Full-time">Full-time (Toàn thời gian)</option>
                      <option value="Part-time">Part-time (Bán thời gian)</option>
                    </select>
                  </div>

                  {/* Ngày bắt đầu làm việc */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Ngày bắt đầu làm việc <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.ngayThamGia}
                      onChange={e => setFormData({ ...formData, ngayThamGia: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:outline-none focus:border-red-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* PHẦN 3: LƯƠNG & NGÂN HÀNG (NV01) */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                <div className="text-xs font-bold uppercase text-zinc-700 flex items-center gap-2">
                  <span>💳</span> Chế độ lương & Tài khoản ngân hàng
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Lương cơ bản */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Lương cơ bản (VNĐ) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      step={500000}
                      min={1000000}
                      value={formData.luongCoBan}
                      onChange={e => {
                        setFormData({ ...formData, luongCoBan: Number(e.target.value) });
                        if (formErrors.luongCoBan) setFormErrors({ ...formErrors, luongCoBan: '' });
                      }}
                      className={`w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none ${
                        formErrors.luongCoBan ? 'border-red-500 bg-red-50/20' : 'border-zinc-300 focus:border-red-600'
                      }`}
                    />
                    <span className="text-[10px] text-emerald-600 font-mono font-bold block mt-0.5">
                      = {formatVND(formData.luongCoBan || 0)}
                    </span>
                    {formErrors.luongCoBan && (
                      <p className="text-[11px] text-red-600 mt-0.5">{formErrors.luongCoBan}</p>
                    )}
                  </div>

                  {/* Tên ngân hàng */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Ngân hàng thụ hưởng <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.nganHang}
                      onChange={e => setFormData({ ...formData, nganHang: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs bg-white font-medium focus:outline-none focus:border-red-600"
                    >
                      {POPULAR_BANKS.map(bank => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Số tài khoản */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Số tài khoản <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="1012345678"
                      value={formData.soTaiKhoan}
                      onChange={e => {
                        setFormData({ ...formData, soTaiKhoan: e.target.value });
                        if (formErrors.soTaiKhoan) setFormErrors({ ...formErrors, soTaiKhoan: '' });
                      }}
                      className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none ${
                        formErrors.soTaiKhoan ? 'border-red-500 bg-red-50/20' : 'border-zinc-300 focus:border-red-600'
                      }`}
                    />
                    {formErrors.soTaiKhoan && (
                      <p className="text-[11px] text-red-600 mt-0.5">{formErrors.soTaiKhoan}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 shadow cursor-pointer transition"
                >
                  Lưu & Thêm nhân viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL 2: XEM HỒ SƠ CHI TIẾT NHÂN VIÊN                       */}
      {/* ─────────────────────────────────────────────────────────── */}
      {showDetailModal && selectedStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h3 className="font-extrabold text-base text-zinc-900 uppercase">
                Hồ Sơ Nhân Sự Chi Tiết
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profile Header Card */}
            <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
              <img
                src={selectedStaff.avatar || PRESET_AVATARS[0]}
                alt={selectedStaff.hoTen}
                className="w-16 h-16 rounded-full object-cover border-2 border-red-600 shadow-md shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-zinc-900">{selectedStaff.hoTen}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      selectedStaff.trangThai === 'HoatDong'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedStaff.trangThai === 'HoatDong' ? '🟢 Hoạt động' : '🔒 Đã khóa'}
                  </span>
                </div>
                <div className="text-xs text-zinc-600 font-semibold mt-0.5">{selectedStaff.chucVu}</div>
                <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                  Mã: <strong className="text-zinc-700">{selectedStaff.id}</strong> • Vào làm:{' '}
                  {selectedStaff.ngayThamGia}
                </div>
              </div>
            </div>

            {/* 2-Column Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Số CCCD</span>
                <span className="font-mono font-bold text-zinc-800">{selectedStaff.cccd || 'Chưa cập nhật'}</span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Giới tính & Ngày sinh</span>
                <span className="font-medium text-zinc-800">
                  {selectedStaff.gioiTinh === 'Nu' ? 'Nữ' : 'Nam'} • {selectedStaff.ngaySinh || 'N/A'}
                </span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Số điện thoại</span>
                <span className="font-mono font-bold text-zinc-800">{selectedStaff.soDienThoai}</span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Email công việc</span>
                <span className="font-mono text-zinc-800 break-all">{selectedStaff.email}</span>
              </div>
              <div className="col-span-2 bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Địa chỉ thường trú</span>
                <span className="text-zinc-800">{selectedStaff.diaChi || 'Chưa cập nhật'}</span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Lương cơ bản</span>
                <span className="font-mono font-extrabold text-emerald-700">
                  {formatVND(selectedStaff.luongCoBan || 0)}
                </span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Hình thức hợp đồng</span>
                <span className="font-medium text-zinc-800">{selectedStaff.loaiNhanVien || 'Full-time'}</span>
              </div>
              <div className="col-span-2 bg-emerald-50/40 p-3 rounded-xl border border-emerald-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                  Thông tin thanh toán ngân hàng
                </span>
                <div className="font-mono text-emerald-900 font-bold">
                  {selectedStaff.nganHang || 'N/A'}: {selectedStaff.soTaiKhoan || 'N/A'}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200 cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openEditModal(selectedStaff);
                }}
                className="px-5 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 cursor-pointer"
              >
                ✏️ Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL 3: CHỈNH SỬA HỒ SƠ NHÂN VIÊN                          */}
      {/* ─────────────────────────────────────────────────────────── */}
      {showEditProfileModal && selectedStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 uppercase">
                  Chỉnh Sửa Hồ Sơ Nhân Viên: {selectedStaff.hoTen} ({selectedStaff.id})
                </h3>
                <p className="text-xs text-zinc-500">
                  Cập nhật các thông tin nhân sự và vai trò phân quyền
                </p>
              </div>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditProfileSubmit} className="space-y-4">
              {/* THÔNG TIN CÁ NHÂN */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                <div className="text-xs font-bold uppercase text-zinc-700 flex items-center gap-2">
                  <span>👤</span> Thông tin cá nhân & Liên hệ
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Họ và tên <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.hoTen}
                      onChange={e => {
                        setFormData({ ...formData, hoTen: e.target.value });
                        if (formErrors.hoTen) setFormErrors({ ...formErrors, hoTen: '' });
                      }}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-600 bg-white"
                    />
                    {formErrors.hoTen && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.hoTen}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Giới tính</label>
                    <select
                      value={formData.gioiTinh}
                      onChange={e => setFormData({ ...formData, gioiTinh: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nu">Nữ</option>
                      <option value="Khac">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={formData.ngaySinh}
                      onChange={e => setFormData({ ...formData, ngaySinh: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                    {formErrors.ngaySinh && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.ngaySinh}</p>}
                  </div>

                  {/* CCCD (NV04) */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Số CCCD <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={formData.cccd}
                      onChange={e => {
                        setFormData({ ...formData, cccd: e.target.value });
                        if (formErrors.cccd) setFormErrors({ ...formErrors, cccd: '' });
                      }}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono bg-white"
                    />
                    {formErrors.cccd && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.cccd}</p>}
                  </div>

                  {/* SĐT (NV02 & NV04) */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Số điện thoại <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formData.soDienThoai}
                      onChange={e => {
                        setFormData({ ...formData, soDienThoai: e.target.value });
                        if (formErrors.soDienThoai) setFormErrors({ ...formErrors, soDienThoai: '' });
                      }}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono bg-white"
                    />
                    {formErrors.soDienThoai && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.soDienThoai}</p>}
                  </div>

                  {/* Email (NV04) */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Email đăng nhập <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => {
                        setFormData({ ...formData, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                      }}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                    {formErrors.email && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Địa chỉ cư trú</label>
                    <input
                      type="text"
                      value={formData.diaChi}
                      onChange={e => setFormData({ ...formData, diaChi: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* VỊ TRÍ CÔNG VIỆC & PHÂN QUYỀN */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                <div className="text-xs font-bold uppercase text-zinc-700 flex items-center gap-2">
                  <span>💼</span> Chức vụ & Vai trò
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Chức danh công việc</label>
                    <select
                      value={formData.chucVu}
                      onChange={e => handleTitleChange(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-medium"
                    >
                      {STANDARD_STAFF_TITLES.map(title => (
                        <option key={title} value={title}>
                          {title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Vai trò RBAC</label>
                    <select
                      value={formData.vaiTro}
                      onChange={e => setFormData({ ...formData, vaiTro: e.target.value as AdminRole })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-bold"
                    >
                      <option value="SuperAdmin">👑 Super Admin (Toàn quyền)</option>
                      <option value="NhanVienBanHang">💼 Nhân viên Bán hàng & CRM</option>
                      <option value="NhanVienKyThuat">🔧 Nhân viên Kỹ thuật & Kho</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Hình thức làm việc</label>
                    <select
                      value={formData.loaiNhanVien}
                      onChange={e => setFormData({ ...formData, loaiNhanVien: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    >
                      <option value="Full-time">Full-time (Toàn thời gian)</option>
                      <option value="Part-time">Part-time (Bán thời gian)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Ngày vào làm</label>
                    <input
                      type="date"
                      value={formData.ngayThamGia}
                      onChange={e => setFormData({ ...formData, ngayThamGia: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* LƯƠNG & NGÂN HÀNG */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                <div className="text-xs font-bold uppercase text-zinc-700 flex items-center gap-2">
                  <span>💳</span> Chế độ lương & Ngân hàng
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Lương cơ bản (VNĐ)</label>
                    <input
                      type="number"
                      step={500000}
                      value={formData.luongCoBan}
                      onChange={e => setFormData({ ...formData, luongCoBan: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold bg-white"
                    />
                    <span className="text-[10px] text-emerald-600 font-mono font-bold block mt-0.5">
                      = {formatVND(formData.luongCoBan || 0)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Ngân hàng</label>
                    <select
                      value={formData.nganHang}
                      onChange={e => setFormData({ ...formData, nganHang: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    >
                      {POPULAR_BANKS.map(bank => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Số tài khoản</label>
                    <input
                      type="text"
                      value={formData.soTaiKhoan}
                      onChange={e => setFormData({ ...formData, soTaiKhoan: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 shadow cursor-pointer"
                >
                  Lưu thay đổi hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL 4: PHÂN QUYỀN VAI TRÒ NHANH (NV05)                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      {showRoleModal && selectedStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h3 className="font-extrabold text-base text-zinc-900 uppercase">Phân Quyền Vai Trò Nhân Viên</h3>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-xs font-mono space-y-1">
              <div>
                <span className="text-zinc-500">Nhân viên:</span>{' '}
                <strong className="text-zinc-900">{selectedStaff.hoTen}</strong> ({selectedStaff.id})
              </div>
              <div>
                <span className="text-zinc-500">Email:</span>{' '}
                <span className="text-zinc-800">{selectedStaff.email}</span>
              </div>
              <div>
                <span className="text-zinc-500">Chức danh:</span>{' '}
                <span className="text-zinc-800">{selectedStaff.chucVu}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-2 uppercase">
                Chọn Vai Trò RBAC Mới *
              </label>
              <div className="space-y-2">
                {(['SuperAdmin', 'NhanVienBanHang', 'NhanVienKyThuat'] as AdminRole[]).map(r => {
                  const meta = roleLabels[r];
                  return (
                    <label
                      key={r}
                      onClick={() => setSelectedRole(r)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        selectedRole === r ? 'border-red-600 bg-red-50/30 font-bold' : 'border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="text-xs" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                      <input
                        type="radio"
                        name="staffRole"
                        checked={selectedRole === r}
                        onChange={() => setSelectedRole(r)}
                        className="accent-red-700"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveRole}
                className="px-5 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 shadow cursor-pointer"
              >
                Lưu Phân Quyền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL 5: ĐỔI MẬT KHẨU TÀI KHOẢN NHÂN VIÊN                   */}
      {/* ─────────────────────────────────────────────────────────── */}
      {showPasswordModal && passwordStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 uppercase">
                  🔑 Đổi Mật Khẩu Nhân Viên
                </h3>
                <p className="text-xs text-zinc-500">
                  Cấp lại hoặc cập nhật mật khẩu đăng nhập hệ thống CRM
                </p>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-xs font-mono space-y-1">
              <div>
                <span className="text-zinc-500">Nhân viên:</span>{' '}
                <strong className="text-zinc-900">{passwordStaff.hoTen}</strong> ({passwordStaff.id})
              </div>
              <div>
                <span className="text-zinc-500">Email:</span>{' '}
                <span className="text-zinc-800">{passwordStaff.email}</span>
              </div>
              <div>
                <span className="text-zinc-500">Chức vụ:</span>{' '}
                <span className="text-zinc-800">{passwordStaff.chucVu}</span>
              </div>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mật khẩu mới (Tối thiểu 6 ký tự) *
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    placeholder="Nhập mật khẩu mới..."
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-zinc-300 rounded-xl text-xs focus:outline-none focus:border-red-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-2 text-xs text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    {showPasswordText ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Xác nhận lại mật khẩu mới *
                </label>
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  required
                  placeholder="Nhập lại mật khẩu mới..."
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:outline-none focus:border-red-600 font-mono"
                />
              </div>

              {passwordError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span> {passwordError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 shadow cursor-pointer transition"
                >
                  Lưu Mật Khẩu Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
