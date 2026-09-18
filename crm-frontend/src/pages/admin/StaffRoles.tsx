import { useState } from 'react';
import { mockStaffAccounts, type StaffAccount, type AdminRole } from '../../data/mockData';

const roleLabels: Record<AdminRole, { label: string; bg: string; color: string }> = {
  SuperAdmin: { label: '👑 Super Admin (Quản trị viên)', bg: '#fef2f2', color: '#dc2626' },
  NhanVienBanHang: { label: '💼 Nhân viên Bán hàng & CRM', bg: '#eff6ff', color: '#2563eb' },
  NhanVienKyThuat: { label: '🔧 Nhân viên Kỹ thuật & Kho', bg: '#f0fdf4', color: '#16a34a' },
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

export default function StaffRolesPage() {
  const [staffList, setStaffList] = useState<StaffAccount[]>(mockStaffAccounts);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | AdminRole>('All');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminRole>('NhanVienBanHang');

  const filteredStaff = staffList.filter(s => {
    const matchSearch = !search.trim() || s.hoTen.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()) || s.soDienThoai.includes(search);
    const matchRole = roleFilter === 'All' || s.vaiTro === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleStatus = (id: string) => {
    setStaffList(prev => prev.map(s => {
      if (s.id === id) {
        const nextState = s.trangThai === 'HoatDong' ? 'BiKhoa' : 'HoatDong';
        return { ...s, trangThai: nextState };
      }
      return s;
    }));
  };

  const openRoleModal = (staff: StaffAccount) => {
    setEditingStaff(staff);
    setSelectedRole(staff.vaiTro);
    setShowEditModal(true);
  };

  const handleSaveRole = () => {
    if (!editingStaff) return;
    setStaffList(prev => prev.map(s => s.id === editingStaff.id ? { ...s, vaiTro: selectedRole } : s));
    setShowEditModal(false);
    setEditingStaff(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          PHÂN QUYỀN & QUẢN LÝ NHÂN SỰ
        </div>
        <p className="text-sm mt-1 text-zinc-500">
          Quản lý tài khoản nhân viên, phân quyền vai trò (RBAC) và kiểm soát quyền truy cập hệ thống CRM
        </p>
      </div>

      {/* Staff Accounts Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex-1 flex gap-3">
            <input
              type="text"
              placeholder="🔍 Tìm theo họ tên, email, sđt nhân viên..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full md:w-80 px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-600"
            />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
            >
              <option value="All">Tất cả vai trò</option>
              <option value="SuperAdmin">Super Admin</option>
              <option value="NhanVienBanHang">Nhân viên Bán hàng</option>
              <option value="NhanVienKyThuat">Nhân viên Kỹ thuật</option>
            </select>
          </div>
          <div className="text-xs text-zinc-500 font-mono">
            Tổng số: <strong>{staffList.length}</strong> nhân sự
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto bg-white rounded-2xl border border-zinc-200 shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-950 text-white font-mono text-xs uppercase">
              <tr>
                <th className="p-3 text-center">STT</th>
                <th className="p-3 text-left">Họ & Tên</th>
                <th className="p-3 text-left">Chức danh</th>
                <th className="p-3 text-left">Liên hệ</th>
                <th className="p-3 text-left">Vai trò phân quyền</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500 text-xs">
                    Không tìm thấy tài khoản nhân viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff, idx) => {
                  const roleMeta = roleLabels[staff.vaiTro];
                  return (
                    <tr key={staff.id} className="hover:bg-zinc-50 transition">
                      <td className="p-3 text-center font-mono text-xs text-zinc-500">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-semibold text-zinc-900">{staff.hoTen}</div>
                        <div className="text-[11px] font-mono text-zinc-400">{staff.id} · Tham gia {staff.ngayThamGia}</div>
                      </td>
                      <td className="p-3 text-xs text-zinc-700 font-medium">{staff.chucVu}</td>
                      <td className="p-3 text-xs font-mono text-zinc-600">
                        <div>{staff.email}</div>
                        <div>{staff.soDienThoai}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-bold font-mono inline-block shadow-xs"
                          style={{ background: roleMeta.bg, color: roleMeta.color }}
                        >
                          {roleMeta.label}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleStatus(staff.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition cursor-pointer ${
                            staff.trangThai === 'HoatDong'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {staff.trangThai === 'HoatDong' ? '✓ Hoạt động' : '🔒 Đã khóa'}
                        </button>
                      </td>
                      <td className="p-3 text-center space-x-2">
                        <button
                          onClick={() => openRoleModal(staff)}
                          className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition"
                        >
                          Đổi vai trò
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-zinc-900 uppercase" style={{ fontFamily: 'var(--font-display)' }}>
            MA TRẬN PHÂN QUYỀN CHI TIẾT (RBAC PERMISSION MATRIX)
          </h3>
          <p className="text-xs text-zinc-500 mt-1">Bảng so sánh chi tiết các quyền hạn truy cập chức năng cho từng vai trò</p>
        </div>

        <div className="overflow-x-auto border border-zinc-200 rounded-xl">
          <table className="min-w-full text-xs">
            <thead className="bg-zinc-100 text-zinc-800 font-mono font-bold border-b border-zinc-200">
              <tr>
                <th className="p-3 text-left">TÍNH NĂNG HỆ THỐNG</th>
                <th className="p-3 text-center w-40 text-red-700 bg-red-50/50">SUPER ADMIN</th>
                <th className="p-3 text-center w-40 text-blue-700 bg-blue-50/50">NHÂN VIÊN BÁN HÀNG</th>
                <th className="p-3 text-center w-40 text-emerald-700 bg-emerald-50/50">NHÂN VIÊN KỸ THUẬT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {permissionMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50">
                  <td className="p-3 font-semibold text-zinc-900">{item.feature}</td>
                  <td className="p-3 text-center bg-red-50/20">
                    {item.superAdmin ? <span className="text-emerald-600 font-extrabold text-sm">✓ Full</span> : <span className="text-zinc-300">✕</span>}
                  </td>
                  <td className="p-3 text-center bg-blue-50/20">
                    {item.sale ? <span className="text-blue-600 font-bold text-sm">✓ Cho phép</span> : <span className="text-zinc-300">✕ Không</span>}
                  </td>
                  <td className="p-3 text-center bg-emerald-50/20">
                    {item.tech ? <span className="text-emerald-600 font-bold text-sm">✓ Cho phép</span> : <span className="text-zinc-300">✕ Không</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <h3 className="text-base font-extrabold uppercase text-zinc-900" style={{ fontFamily: 'var(--font-display)' }}>
                ĐỔI VAI TRÒ NHÂN VIÊN
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-zinc-600 font-bold">✕</button>
            </div>

            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-xs font-mono space-y-1">
              <div><span className="text-zinc-500">Nhân viên:</span> <strong className="text-zinc-900">{editingStaff.hoTen}</strong></div>
              <div><span className="text-zinc-500">Email:</span> <span className="text-zinc-800">{editingStaff.email}</span></div>
              <div><span className="text-zinc-500">Chức danh:</span> <span className="text-zinc-800">{editingStaff.chucVu}</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-2 uppercase">Chọn Vai Trò Mới *</label>
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
                      <span className="text-xs" style={{ color: meta.color }}>{meta.label}</span>
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
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveRole}
                className="px-5 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 shadow"
              >
                Lưu Phân Quyền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
