import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { NotificationProvider } from './contexts/NotificationContext.js';
import { LocationProvider } from './contexts/LocationContext.js';
import { Navbar } from './components/common/Navbar.js';
import { Sidebar } from './components/common/Sidebar.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { Loader2 } from 'lucide-react';

// Core Public Pages (eager loaded for instant first render)
import { LandingPage } from './pages/public/LandingPage.js';
import { DoctorDiscoveryPage } from './pages/public/DoctorDiscoveryPage.js';
import { DoctorDetailPage } from './pages/public/DoctorDetailPage.js';
import { TestComparisonPage } from './pages/public/TestComparisonPage.js';
import { LabDiscoveryPage } from './pages/public/LabDiscoveryPage.js';
import { ClinicsPage } from './pages/public/ClinicsPage.js';
import { LoginPage } from './pages/public/LoginPage.js';
import { RegisterPage } from './pages/public/RegisterPage.js';

// Lazy Loaded Detail & Portal Pages (loaded on demand)
const LabDetailPage = lazy(() => import('./pages/public/LabDetailPage.js').then(m => ({ default: m.LabDetailPage })));
const ClinicDetailPage = lazy(() => import('./pages/public/ClinicDetailPage.js').then(m => ({ default: m.ClinicDetailPage })));

// Patient pages (lazy)
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard.js').then(m => ({ default: m.PatientDashboard })));
const PatientAppointmentsPage = lazy(() => import('./pages/patient/PatientAppointmentsPage.js').then(m => ({ default: m.PatientAppointmentsPage })));
const PatientLabBookingsPage = lazy(() => import('./pages/patient/PatientLabBookingsPage.js').then(m => ({ default: m.PatientLabBookingsPage })));
const PatientReportsPage = lazy(() => import('./pages/patient/PatientReportsPage.js').then(m => ({ default: m.PatientReportsPage })));
const PatientReferralsPage = lazy(() => import('./pages/patient/PatientReferralsPage.js').then(m => ({ default: m.PatientReferralsPage })));
const PatientProfilePage = lazy(() => import('./pages/patient/PatientProfilePage.js').then(m => ({ default: m.PatientProfilePage })));

// Doctor pages (lazy)
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard.js').then(m => ({ default: m.DoctorDashboard })));
const DoctorQueueManagementPage = lazy(() => import('./pages/doctor/DoctorQueueManagementPage.js').then(m => ({ default: m.DoctorQueueManagementPage })));
const DoctorAppointmentsPage = lazy(() => import('./pages/doctor/DoctorAppointmentsPage.js').then(m => ({ default: m.DoctorAppointmentsPage })));
const DoctorReferralsPage = lazy(() => import('./pages/doctor/DoctorReferralsPage.js').then(m => ({ default: m.DoctorReferralsPage })));
const DoctorReportsPage = lazy(() => import('./pages/doctor/DoctorReportsPage.js').then(m => ({ default: m.DoctorReportsPage })));
const DoctorProfilePage = lazy(() => import('./pages/doctor/DoctorProfilePage.js').then(m => ({ default: m.DoctorProfilePage })));

// Clinic pages (lazy)
const ClinicDashboard = lazy(() => import('./pages/clinic/ClinicDashboard.js').then(m => ({ default: m.ClinicDashboard })));
const ClinicDoctorsPage = lazy(() => import('./pages/clinic/ClinicDoctorsPage.js').then(m => ({ default: m.ClinicDoctorsPage })));
const ClinicQueuesPage = lazy(() => import('./pages/clinic/ClinicQueuesPage.js').then(m => ({ default: m.ClinicQueuesPage })));

// Laboratory pages (lazy)
const LabDashboard = lazy(() => import('./pages/laboratory/LabDashboard.js').then(m => ({ default: m.LabDashboard })));
const LabTestCataloguePage = lazy(() => import('./pages/laboratory/LabTestCataloguePage.js').then(m => ({ default: m.LabTestCataloguePage })));
const LabBookingsPage = lazy(() => import('./pages/laboratory/LabBookingsPage.js').then(m => ({ default: m.LabBookingsPage })));
const LabSampleTrackingPage = lazy(() => import('./pages/laboratory/LabSampleTrackingPage.js').then(m => ({ default: m.LabSampleTrackingPage })));

// Admin pages (lazy)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.js').then(m => ({ default: m.AdminDashboard })));
const AdminVerificationsPage = lazy(() => import('./pages/admin/AdminVerificationsPage.js').then(m => ({ default: m.AdminVerificationsPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage.js').then(m => ({ default: m.AdminUsersPage })));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage.js').then(m => ({ default: m.AdminAnalyticsPage })));
const AdminAuditLogsPage = lazy(() => import('./pages/admin/AdminAuditLogsPage.js').then(m => ({ default: m.AdminAuditLogsPage })));

const RouteLoadingSkeleton: React.FC = () => (
  <div className="flex-1 flex items-center justify-center min-h-[50vh] p-8">
    <div className="flex flex-col items-center gap-3 text-slate-500">
      <Loader2 size={28} className="animate-spin text-teal-600" />
      <p className="text-xs font-semibold">Loading MediLink view...</p>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // When logged in as any user or admin, open dashboard instead of home page
  useEffect(() => {
    if (user && (currentPath === '/' || currentPath === '/login')) {
      const getRoleDashboardPath = (role: string) => {
        switch (role) {
          case 'PATIENT': return '/patient/dashboard';
          case 'DOCTOR': return '/doctor/dashboard';
          case 'CLINIC': return '/clinic/dashboard';
          case 'LABORATORY': return '/laboratory/dashboard';
          case 'ADMIN': return '/admin/dashboard';
          default: return '/';
        }
      };
      navigate(getRoleDashboardPath(user.role));
    }
  }, [user, currentPath]);

  const isDashboardRoute =
    currentPath.startsWith('/patient') ||
    currentPath.startsWith('/doctor') ||
    currentPath.startsWith('/clinic') ||
    currentPath.startsWith('/laboratory') ||
    currentPath.startsWith('/admin');

  // Extract query params for search & category preselection
  const urlParams = new URLSearchParams(window.location.search);
  const initialSearch = urlParams.get('search') || '';
  const initialSpecialty = urlParams.get('specialty') || '';
  const initialCategory = urlParams.get('category') || '';

  const renderCurrentView = () => {
    // Public routes
    if (currentPath === '/') return <LandingPage navigate={navigate} />;
    
    // Doctor routes
    if (currentPath.startsWith('/doctors/')) {
      const doctorId = currentPath.split('/doctors/')[1]?.split('?')[0];
      return <DoctorDetailPage doctorId={doctorId} navigate={navigate} />;
    }
    if (currentPath.startsWith('/doctors')) {
      return (
        <DoctorDiscoveryPage
          navigate={navigate}
          initialSearch={initialSearch}
          initialSpecialty={initialSpecialty}
        />
      );
    }

    // Diagnostic test comparison
    if (currentPath.startsWith('/diagnostic-tests')) {
      return (
        <TestComparisonPage
          navigate={navigate}
          initialSearch={initialSearch}
          initialCategory={initialCategory}
        />
      );
    }

    // Laboratory routes
    if (currentPath.startsWith('/laboratories/')) {
      const labId = currentPath.split('/laboratories/')[1]?.split('?')[0];
      return <LabDetailPage labId={labId} navigate={navigate} />;
    }
    if (currentPath.startsWith('/laboratories')) return <LabDiscoveryPage navigate={navigate} />;

    // Clinic routes
    if (currentPath.startsWith('/clinics/')) {
      const clinicId = currentPath.split('/clinics/')[1]?.split('?')[0];
      return <ClinicDetailPage clinicId={clinicId} navigate={navigate} />;
    }
    if (currentPath.startsWith('/clinics')) return <ClinicsPage navigate={navigate} />;

    if (currentPath.startsWith('/login')) return <LoginPage navigate={navigate} />;
    if (currentPath.startsWith('/register')) return <RegisterPage navigate={navigate} />;

    // Patient Routes
    if (currentPath === '/patient/dashboard') return <PatientDashboard navigate={navigate} />;
    if (currentPath === '/patient/appointments') return <PatientAppointmentsPage />;
    if (currentPath === '/patient/lab-bookings') return <PatientLabBookingsPage navigate={navigate} />;
    if (currentPath === '/patient/reports') return <PatientReportsPage navigate={navigate} />;
    if (currentPath === '/patient/referrals') return <PatientReferralsPage navigate={navigate} />;
    if (currentPath === '/patient/profile') return <PatientProfilePage />;

    // Doctor Routes
    if (currentPath === '/doctor/dashboard') return <DoctorDashboard navigate={navigate} />;
    if (currentPath === '/doctor/queue') return <DoctorQueueManagementPage />;
    if (currentPath === '/doctor/appointments') return <DoctorAppointmentsPage />;
    if (currentPath === '/doctor/referrals') return <DoctorReferralsPage />;
    if (currentPath === '/doctor/reports') return <DoctorReportsPage />;
    if (currentPath === '/doctor/profile') return <DoctorProfilePage />;

    // Clinic Routes
    if (currentPath === '/clinic/dashboard') return <ClinicDashboard navigate={navigate} />;
    if (currentPath === '/clinic/doctors') return <ClinicDoctorsPage />;
    if (currentPath === '/clinic/queues') return <ClinicQueuesPage />;

    // Laboratory Routes
    if (currentPath === '/laboratory/dashboard') return <LabDashboard navigate={navigate} />;
    if (currentPath === '/laboratory/tests') return <LabTestCataloguePage />;
    if (currentPath === '/laboratory/bookings') return <LabBookingsPage />;
    if (currentPath === '/laboratory/samples') return <LabSampleTrackingPage />;

    // Admin Routes
    if (currentPath === '/admin/dashboard') return <AdminDashboard navigate={navigate} />;
    if (currentPath === '/admin/verifications') return <AdminVerificationsPage />;
    if (currentPath === '/admin/users') return <AdminUsersPage />;
    if (currentPath === '/admin/analytics') return <AdminAnalyticsPage />;
    if (currentPath === '/admin/audit-logs') return <AdminAuditLogsPage />;

    // Default Fallback
    return <LandingPage navigate={navigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900 w-full max-w-full overflow-x-hidden">
      <Navbar currentPath={currentPath} navigate={navigate} />

      {isDashboardRoute && isAuthenticated && user ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
          <Sidebar currentPath={currentPath} navigate={navigate} />
          <main className="flex-1 overflow-y-auto w-full min-w-0 max-w-full">
            <Suspense fallback={<RouteLoadingSkeleton />}>
              {renderCurrentView()}
            </Suspense>
          </main>
        </div>
      ) : (
        <main className="flex-1 w-full min-w-0 max-w-full">
          <Suspense fallback={<RouteLoadingSkeleton />}>
            {renderCurrentView()}
          </Suspense>
        </main>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <LocationProvider>
            <AppContent />
          </LocationProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
