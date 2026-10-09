import React, { useState, useEffect } from 'react';
import { CartProvider } from './contexts/CartContext';
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';
import { type Customer, type StaffAccount, type Appointment, mockStaffAccounts } from './data/mockData';

// Admin pages
import AdminLoginPage from './pages/admin/AdminLogin';
import DashboardPage from './pages/admin/Dashboard';
import ReportsPage from './pages/admin/Reports';
import SalesPage from './pages/admin/Sales';
import AppointmentsPage from './pages/admin/Appointments';
import CustomersPage from './pages/admin/Customers';
import FeedbackPage from './pages/admin/Feedback';
import PartsPage from './pages/admin/Parts';
import VehiclesPage from './pages/admin/Vehicles';
import SuppliersPage from './pages/admin/Suppliers';
import StaffRolesPage from './pages/admin/StaffRoles';
import InsurancePage from './pages/admin/Insurance';
import PromotionsPage from './pages/admin/Promotions';
import { WarrantyPage } from './pages/admin/Warranty';

// Customer pages
import PartsStore from './pages/customer/PartsStore';
import ServiceBooking from './pages/customer/ServiceBooking';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import Checkout from './pages/customer/Checkout';
import VehiclesShowroom from './pages/customer/VehiclesShowroom';
import SurveyTaking from './pages/customer/SurveyTaking';

type Mode = 'admin' | 'customer' | null;
type AdminPage = 'dashboard' | 'sales' | 'promotions' | 'appointments' | 'warranty' | 'insurance' | 'customers' | 'feedback' | 'reports' | 'parts' | 'vehicles' | 'suppliers' | 'staff';
type CustomerPage = 'store' | 'vehicles' | 'booking' | 'dashboard' | 'checkout' | 'survey';


/* ── Landing / Mode selector ── */
function Landing({ onSelect }: { onSelect: (m: Mode) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--color-zinc-950)' }}>
      {/* Racing stripe diagonal */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(135deg, transparent 0%, rgba(185,28,28,0.15) 40%, transparent 70%)',
      }} />
      <div className="absolute top-0 left-0 w-2 h-full" style={{ background: 'var(--color-red-700)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'var(--color-zinc-800)' }} />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 max-w-2xl w-full">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="flex items-center justify-center rounded-2xl"
              style={{ width: 60, height: 60, background: 'var(--color-red-700)' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/>
                <path d="M6 17V7l2-2h5l4 6h1a2 2 0 0 1 0 4h-1"/>
              </svg>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 800, color: 'white', letterSpacing: '0.06em', lineHeight: 1, textTransform: 'uppercase' }}>
            MOTOSHOP
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--color-red-500)', letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 6 }}>
            ĐẠI LÝ XE MÁY & PHỤ TÙNG CHÍNH HÃNG
          </div>
          <div className="mt-3 text-sm" style={{ color: 'var(--color-zinc-500)' }}>
            Hệ thống CRM & E-Commerce quản lý toàn diện
          </div>
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-2 gap-5 w-full max-w-lg">
          {/* Customer */}
          <button onClick={() => onSelect('customer')}
            className="group flex flex-col items-center gap-4 rounded-2xl p-7 text-center transition-all"
            style={{ background: 'var(--color-zinc-900)', border: '1px solid var(--color-zinc-800)', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget.style.borderColor = 'var(--color-red-700)'); (e.currentTarget.style.background = 'var(--color-zinc-800)'); }}
            onMouseLeave={e => { (e.currentTarget.style.borderColor = 'var(--color-zinc-800)'); (e.currentTarget.style.background = 'var(--color-zinc-900)'); }}
          >
            <div className="flex items-center justify-center rounded-xl transition-all"
              style={{ width: 56, height: 56, background: 'var(--color-red-900)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-red-400)" strokeWidth="2" strokeLinecap="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase' }}>KHÁCH HÀNG</div>
              <div className="mt-1 text-xs" style={{ color: 'var(--color-zinc-500)', lineHeight: 1.5 }}>Mua phụ tùng · Đặt lịch · Trang cá nhân</div>
            </div>
            <div className="text-xs font-600 rounded-full px-3 py-1" style={{ background: 'var(--color-red-700)', color: 'white', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
              PORTAL →
            </div>
          </button>

          {/* Admin */}
          <button onClick={() => onSelect('admin')}
            className="group flex flex-col items-center gap-4 rounded-2xl p-7 text-center transition-all"
            style={{ background: 'var(--color-zinc-900)', border: '1px solid var(--color-zinc-800)', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget.style.borderColor = 'var(--color-red-700)'); (e.currentTarget.style.background = 'var(--color-zinc-800)'); }}
            onMouseLeave={e => { (e.currentTarget.style.borderColor = 'var(--color-zinc-800)'); (e.currentTarget.style.background = 'var(--color-zinc-900)'); }}
          >
            <div className="flex items-center justify-center rounded-xl"
              style={{ width: 56, height: 56, background: 'rgba(185,28,28,0.15)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-red-400)" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase' }}>ADMIN</div>
              <div className="mt-1 text-xs" style={{ color: 'var(--color-zinc-500)', lineHeight: 1.5 }}>Quản lý đơn hàng · CRM · Báo cáo</div>
            </div>
            <div className="text-xs font-600 rounded-full px-3 py-1" style={{ background: 'var(--color-zinc-700)', color: 'white', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
              DASHBOARD →
            </div>
          </button>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-zinc-700)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          MOTOSHOP CRM v2.0 · dailyxemay.vn
        </div>
      </div>
    </div>
  );
}

function getInitialMode(): Mode {
  const hash = window.location.hash.toLowerCase();
  if (hash === '#admin') return 'admin';
  if (hash === '#customer') return 'customer';
  const saved = localStorage.getItem('crm_mode');
  if (saved === 'admin' || saved === 'customer') return saved;
  return null;
}

/* ── Root ── */
export default function App() {
  const [mode, setModeState] = useState<Mode>(getInitialMode);
  const [adminPage, setAdminPageState] = useState<AdminPage>(() => {
    const saved = localStorage.getItem('crm_admin_page');
    return (saved as AdminPage) || 'dashboard';
  });
  const [customerPage, setCustomerPageState] = useState<CustomerPage>(() => {
    const saved = localStorage.getItem('crm_customer_page');
    return (saved as CustomerPage) || 'vehicles';
  });
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] = useState<string | undefined>(undefined);
  const [vehicleOrderPreFill, setVehicleOrderPreFill] = useState<Appointment | null>(null);
  
  const [currentCustomer, setCurrentCustomerState] = useState<Customer | null>(() => {
    try {
      const saved = localStorage.getItem('crm_current_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Admin authentication state (Default to SuperAdmin ST001, or restored from localStorage)
  const [currentStaff, setCurrentStaffState] = useState<StaffAccount | null>(() => {
    try {
      const saved = localStorage.getItem('crm_current_staff');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.trangThai === 'BiKhoa') {
          localStorage.removeItem('crm_current_staff');
          return null;
        }
        return parsed;
      }
    } catch {}
    return mockStaffAccounts[0]?.trangThai === 'BiKhoa' ? null : mockStaffAccounts[0];
  });

  const setCurrentCustomer = (c: Customer | null) => {
    if (c && c.trangThai === 'BiKhoa') {
      alert('⚠️ Tài khoản khách hàng này đang BỊ KHÓA! Không thể tiếp tục đăng nhập.');
      setCurrentCustomerState(null);
      localStorage.removeItem('crm_current_customer');
      return;
    }
    setCurrentCustomerState(c);
    if (c) {
      localStorage.setItem('crm_current_customer', JSON.stringify(c));
    } else {
      localStorage.removeItem('crm_current_customer');
    }
  };

  const setCurrentStaff = (s: StaffAccount | null) => {
    if (s && s.trangThai === 'BiKhoa') {
      alert('⚠️ Tài khoản nhân viên này đang BỊ KHÓA! Không thể đăng nhập quản trị.');
      setCurrentStaffState(null);
      localStorage.removeItem('crm_current_staff');
      return;
    }
    setCurrentStaffState(s);
    if (s) {
      localStorage.setItem('crm_current_staff', JSON.stringify(s));
    } else {
      localStorage.removeItem('crm_current_staff');
    }
  };

  // NV05: Lắng nghe sự kiện đồng bộ tài khoản nhân sự từ StaffRoles
  useEffect(() => {
    const handleStaffChange = () => {
      try {
        const saved = localStorage.getItem('crm_current_staff');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.trangThai === 'BiKhoa') {
            alert('⚠️ Tài khoản nhân viên của bạn vừa bị KHÓA bởi Quản trị viên!');
            localStorage.removeItem('crm_current_staff');
            setCurrentStaffState(null);
            return;
          }
          setCurrentStaffState(parsed);
        }
      } catch {}
    };
    window.addEventListener('crm-staff-change', handleStaffChange);
    return () => window.removeEventListener('crm-staff-change', handleStaffChange);
  }, []);

  const setAdminPage = (p: AdminPage) => {
    setAdminPageState(p);
    localStorage.setItem('crm_admin_page', p);
  };

  const setCustomerPage = (p: CustomerPage) => {
    setCustomerPageState(p);
    localStorage.setItem('crm_customer_page', p);
  };

  const setMode = (m: Mode) => {
    setModeState(m);
    if (m) localStorage.setItem('crm_mode', m);
    else localStorage.removeItem('crm_mode');

    if (m === 'admin') window.location.hash = 'admin';
    else if (m === 'customer') window.location.hash = 'customer';
    else window.location.hash = '';
  };

  React.useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash.toLowerCase();
      if (h === '#admin') {
        setModeState('admin');
        localStorage.setItem('crm_mode', 'admin');
      } else if (h === '#customer') {
        setModeState('customer');
        localStorage.setItem('crm_mode', 'customer');
      } else if (!h) {
        setModeState(null);
        localStorage.removeItem('crm_mode');
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    const handleCustomerChange = (e: any) => {
      if (e.detail && 'customer' in e.detail) {
        setCurrentCustomerState(e.detail.customer);
      }
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'crm_current_customer') {
        try {
          setCurrentCustomerState(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setCurrentCustomerState(null);
        }
      }
    };
    window.addEventListener('crm-customer-change', handleCustomerChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('crm-customer-change', handleCustomerChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  if (!mode) return <Landing onSelect={setMode} />;

  if (mode === 'admin') {
    if (!currentStaff) {
      return (
        <AdminLoginPage
          onLoginSuccess={staff => setCurrentStaff(staff)}
          onBackHome={() => setMode(null)}
        />
      );
    }

    return (
      <AdminLayout
        activePage={adminPage}
        onNavigate={(p) => setAdminPage(p as AdminPage)}
        currentStaff={currentStaff}
        onLogout={() => setCurrentStaff(null)}
        onHome={() => setMode(null)}
      >
        {adminPage === 'dashboard' && <DashboardPage />}
        {adminPage === 'sales' && (
          <SalesPage
            currentStaff={currentStaff}
            initialPreFillVehicleOrder={vehicleOrderPreFill}
            onClearPreFill={() => setVehicleOrderPreFill(null)}
          />
        )}
        {adminPage === 'promotions' && <PromotionsPage />}
        {adminPage === 'appointments' && (
          <AppointmentsPage
            currentStaff={currentStaff}
            onNavigateToCreateVehicleOrder={(appt) => {
              setVehicleOrderPreFill(appt);
              setAdminPage('sales');
            }}
          />
        )}
        {adminPage === 'warranty' && <WarrantyPage />}
        {adminPage === 'insurance' && <InsurancePage />}
        {adminPage === 'customers' && <CustomersPage />}
        {adminPage === 'feedback' && <FeedbackPage currentStaff={currentStaff} />}
        {adminPage === 'reports' && <ReportsPage />}
        {adminPage === 'parts' && <PartsPage />}
        {adminPage === 'vehicles' && <VehiclesPage />}
        {adminPage === 'suppliers' && <SuppliersPage currentStaff={currentStaff} />}
        {adminPage === 'staff' && (
          <StaffRolesPage
            currentStaff={currentStaff}
            onCurrentStaffChange={setCurrentStaff}
          />
        )}
      </AdminLayout>
    );
  }

  return (
    <CartProvider>
      <CustomerLayout
        activePage={customerPage}
        onNavigate={setCustomerPage}
        onHome={() => setMode(null)}
        currentCustomer={currentCustomer}
        onCustomerChange={setCurrentCustomer}
      >
        {customerPage === 'vehicles' && (
          <VehiclesShowroom
            currentCustomer={currentCustomer}
            onRequireLogin={() => window.dispatchEvent(new CustomEvent('crm-open-login'))}
            onBookTestDrive={(vId) => {
              setSelectedVehicleForBooking(vId);
              setCustomerPage('booking');
            }}
            onNavigateToSurvey={() => setCustomerPage('survey')}
            onNavigateToOrders={() => setCustomerPage('dashboard')}
          />
        )}
        {customerPage === 'store' && (
          <PartsStore
            currentCustomer={currentCustomer}
            onRequireLogin={() => window.dispatchEvent(new CustomEvent('crm-open-login'))}
          />
        )}
        {customerPage === 'booking' && (
          <ServiceBooking
            initialVehicleId={selectedVehicleForBooking}
            currentCustomer={currentCustomer}
            onCustomerChange={setCurrentCustomer}
          />
        )}
        {customerPage === 'dashboard' && (
          <CustomerDashboard
            currentCustomer={currentCustomer}
            onNavigateToShowroom={() => setCustomerPage('vehicles')}
            onNavigateToSurvey={() => setCustomerPage('survey')}
            onCustomerChange={setCurrentCustomer}
          />
        )}
        {customerPage === 'survey' && (
          <SurveyTaking
            currentCustomer={currentCustomer}
            onBack={() => setCustomerPage('vehicles')}
            onNavigateToDashboard={() => setCustomerPage('dashboard')}
            onRequireLogin={() => window.dispatchEvent(new CustomEvent('crm-open-login'))}
          />
        )}
        {customerPage === 'checkout' && (
          <Checkout
            onBack={() => setCustomerPage('store')}
            onSuccess={() => setCustomerPage('dashboard')}
            currentCustomer={currentCustomer}
            onCustomerChange={setCurrentCustomer}
          />
        )}
      </CustomerLayout>
    </CartProvider>
  );
}
