import { useState } from 'react';
import { mockCustomers, mockVehicles } from '../../data/mockData';
import { WarrantyTag } from '../../components/shared/StatusTag';

const customer = mockCustomers[0];
const vehicle = mockVehicles.find(v => v.customerId === customer.id)!;

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function CustomerProfile({ onNavigate }: { onNavigate: (p: string) => void }) {
  const days = daysUntil(vehicle.hanBaoHanh);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-navy-50)' }}>
      {/* Header */}
      <header style={{ background: 'var(--color-navy-900)', borderBottom: '1px solid var(--color-navy-800)' }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: 'var(--color-brand-600)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" />
                <path d="M6 17V7l2-2h5l4 6h1a2 2 0 0 1 0 4h-1" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-700 text-white">Đại lý Xe máy</div>
              <div className="text-xs" style={{ color: 'var(--color-navy-400)', fontFamily: 'var(--font-mono)' }}>CUSTOMER PORTAL</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-full text-sm font-600"
              style={{ width: 36, height: 36, background: 'var(--color-brand-600)', color: 'white' }}>
              {customer.hoTen[0]}
            </div>
            <span className="text-sm font-500 text-white">{customer.hoTen}</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-700" style={{ color: 'var(--color-navy-900)' }}>Xin chào, {customer.hoTen.split(' ').pop()} 👋</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-navy-400)' }}>Đây là trang cá nhân của bạn tại Đại lý Xe máy & Phụ tùng</p>
        </div>

        {/* Vehicle card */}
        <div className="rounded-2xl overflow-hidden mb-5" style={{ background: 'white', border: '1px solid var(--color-navy-100)', boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
          <div className="px-6 pt-6 pb-4" style={{ background: 'linear-gradient(135deg, var(--color-navy-900) 0%, var(--color-brand-800) 100%)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-600 text-white uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', opacity: 0.6 }}>Xe của bạn</span>
              <WarrantyTag status={vehicle.trangThaiBaoHanh} />
            </div>
            <h2 className="text-xl font-700 text-white mb-1">{vehicle.tenXe}</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>{vehicle.bienSo} · {vehicle.mauSac} · {vehicle.namSanXuat}</p>
          </div>

          <div className="px-6 py-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-600 mb-1" style={{ color: 'var(--color-navy-400)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Biển số</div>
                <div className="font-700" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-navy-900)', letterSpacing: '0.1em' }}>{vehicle.bienSo}</div>
              </div>
              <div>
                <div className="text-xs font-600 mb-1" style={{ color: 'var(--color-navy-400)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hạn bảo hành</div>
                <div className="font-600 text-sm" style={{ color: 'var(--color-navy-900)' }}>{vehicle.hanBaoHanh}</div>
              </div>
              <div>
                <div className="text-xs font-600 mb-1" style={{ color: 'var(--color-navy-400)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Còn lại</div>
                <div className="font-700" style={{ color: days > 60 ? 'var(--color-success-500)' : days > 0 ? '#d97706' : 'var(--color-danger-500)' }}>
                  {days > 0 ? `${days} ngày` : 'Đã hết hạn'}
                </div>
              </div>
            </div>

            {days > 0 && days < 90 && (
              <div className="mt-4 rounded-lg px-4 py-3 flex items-center gap-2 text-sm"
                style={{ background: 'var(--color-amber-100)', color: '#92400e' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                Bảo hành còn {days} ngày — hãy liên hệ đại lý để gia hạn
              </div>
            )}
          </div>
        </div>

        {/* Info card */}
        <div className="rounded-xl p-6 mb-5" style={{ background: 'white', border: '1px solid var(--color-navy-100)' }}>
          <h3 className="font-700 text-sm mb-4" style={{ color: 'var(--color-navy-900)' }}>Thông tin cá nhân</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Họ tên', value: customer.hoTen },
              { label: 'Email', value: customer.email },
              { label: 'Số điện thoại', value: customer.soDienThoai },
              { label: 'Ngày đăng ký', value: customer.ngayDangKy },
              { label: 'Địa chỉ', value: customer.diaChi },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs font-600 mb-1" style={{ color: 'var(--color-navy-400)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div className="text-sm font-500" style={{ color: 'var(--color-navy-800)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => onNavigate('review')}
            className="flex items-center gap-3 rounded-xl p-5 text-left transition-all"
            style={{ background: 'white', border: '1.5px solid var(--color-navy-100)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-brand-400)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-navy-100)')}
          >
            <div className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: 'var(--color-amber-100)' }}>
              ⭐
            </div>
            <div>
              <div className="font-600 text-sm" style={{ color: 'var(--color-navy-900)' }}>Gửi đánh giá</div>
              <div className="text-xs" style={{ color: 'var(--color-navy-400)' }}>Chấm điểm sản phẩm & dịch vụ</div>
            </div>
          </button>
          <button onClick={() => onNavigate('survey')}
            className="flex items-center gap-3 rounded-xl p-5 text-left transition-all"
            style={{ background: 'white', border: '1.5px solid var(--color-navy-100)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-brand-400)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-navy-100)')}
          >
            <div className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: 'var(--color-brand-100)' }}>
              📋
            </div>
            <div>
              <div className="font-600 text-sm" style={{ color: 'var(--color-navy-900)' }}>Làm khảo sát</div>
              <div className="text-xs" style={{ color: 'var(--color-navy-400)' }}>Góp ý về mẫu xe mới</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
