import React, { useState } from 'react';
import { CartProvider } from './contexts/CartContext';
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';
import { type Customer, type StaffAccount, mockStaffAccounts } from './data/mockData';

// Admin pages
import AdminLoginPage from './pages/admin/AdminLogin';
import DashboardPage from './pages/admin/Dashboard';
import ReportsPage from './pages/admin/Reports';
import SalesPage from './pages/admin/Sales';
import CustomersPage from './pages/admin/Customers';
import FeedbackPage from './pages/admin/Feedback';
import PartsPage from './pages/admin/Parts';
import VehiclesPage from './pages/admin/Vehicles';
import StaffRolesPage from './pages/admin/StaffRoles';

// Customer pages
import PartsStore from './pages/customer/PartsStore';
import ServiceBooking from './pages/customer/ServiceBooking';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import Checkout from './pages/customer/Checkout';
import VehiclesShowroom from './pages/customer/VehiclesShowroom';

type Mode = 'admin' | 'customer' | null;
type AdminPage = 'dashboard' | 'sales' | 'appointments' | 'customers' | 'feedback' | 'reports' | 'parts' | 'vehicles' | 'staff';
type CustomerPage = 'store' | 'vehicles' | 'booking' | 'dashboard' | 'checkout';

const adminPages: Record<AdminPage, React.ReactElement> = {
  dashboard: <DashboardPage />, 
  sales: <SalesPage />, 
  appointments: <SalesPage />, 
  customers: <CustomersPage />, 
  feedback: <FeedbackPage />, 
  reports: <ReportsPage />, 
  parts: <PartsPage />, 
  vehicles: <VehiclesPage />, 
  staff: <StaffRolesPage />,
};

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
  return null;
}

/* ── Root ── */
export default function App() {
  const [mode, setModeState] = useState<Mode>(getInitialMode);
  const [adminPage, setAdminPage] = useState<AdminPage>('dashboard');
  const [customerPage, setCustomerPage] = useState<CustomerPage>('vehicles');
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] = useState<string | undefined>(undefined);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  // Admin authentication state (Default to SuperAdmin ST001 for convenience, or null to require login)
  const [currentStaff, setCurrentStaff] = useState<StaffAccount | null>(mockStaffAccounts[0]);

  const setMode = (m: Mode) => {
    setModeState(m);
    if (m === 'admin') window.location.hash = 'admin';
    else if (m === 'customer') window.location.hash = 'customer';
    else window.location.hash = '';
  };

  React.useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash.toLowerCase();
      if (h === '#admin') setModeState('admin');
      else if (h === '#customer') setModeState('customer');
      else setModeState(null);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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
        {adminPages[adminPage]}
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
            onBookTestDrive={(vId) => {
              setSelectedVehicleForBooking(vId);
              setCustomerPage('booking');
            }}
          />
        )}
        {customerPage === 'store' && <PartsStore />}
        {customerPage === 'booking' && (
          <ServiceBooking initialVehicleId={selectedVehicleForBooking} />
        )}
        {customerPage === 'dashboard' && (
          <CustomerDashboard
            currentCustomer={currentCustomer}
            onNavigateToShowroom={() => setCustomerPage('vehicles')}
            onCustomerChange={setCurrentCustomer}
          />
        )}
        {customerPage === 'checkout' && (
          <Checkout
            onBack={() => setCustomerPage('store')}
            onSuccess={() => setCustomerPage('dashboard')}
          />
        )}
      </CustomerLayout>
    </CartProvider>
  );
}
