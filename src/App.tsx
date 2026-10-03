import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { NotificationProvider } from './contexts/NotificationContext.js';
import { LocationProvider } from './contexts/LocationContext.js';
import { Navbar } from './components/common/Navbar.js';
import { Sidebar } from './components/common/Sidebar.js';

// Public pages
import { LandingPage } from './pages/public/LandingPage.js';
import { DoctorDiscoveryPage } from './pages/public/DoctorDiscoveryPage.js';
import { DoctorDetailPage } from './pages/public/DoctorDetailPage.js';
import { TestComparisonPage } from './pages/public/TestComparisonPage.js';
import { LabDiscoveryPage } from './pages/public/LabDiscoveryPage.js';
import { LabDetailPage } from './pages/public/LabDetailPage.js';
import { ClinicsPage } from './pages/public/ClinicsPage.js';
import { ClinicDetailPage } from './pages/public/ClinicDetailPage.js';
import { LoginPage } from './pages/public/LoginPage.js';
import { RegisterPage } from './pages/public/RegisterPage.js';

// Patient pages
import { PatientDashboard } from './pages/patient/PatientDashboard.js';
import { PatientAppointmentsPage } from './pages/patient/PatientAppointmentsPage.js';
import { PatientLabBookingsPage } from './pages/patient/PatientLabBookingsPage.js';
import { PatientReportsPage } from './pages/patient/PatientReportsPage.js';
import { PatientReferralsPage } from './pages/patient/PatientReferralsPage.js';
import { PatientProfilePage } from './pages/patient/PatientProfilePage.js';

// Doctor pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard.js';
import { DoctorQueueManagementPage } from './pages/doctor/DoctorQueueManagementPage.js';
import { DoctorAppointmentsPage } from './pages/doctor/DoctorAppointmentsPage.js';
import { DoctorReferralsPage } from './pages/doctor/DoctorReferralsPage.js';
import { DoctorReportsPage } from './pages/doctor/DoctorReportsPage.js';
import { DoctorProfilePage } from './pages/doctor/DoctorProfilePage.js';

// Clinic pages
import { ClinicDashboard } from './pages/clinic/ClinicDashboard.js';
import { ClinicDoctorsPage } from './pages/clinic/ClinicDoctorsPage.js';
import { ClinicQueuesPage } from './pages/clinic/ClinicQueuesPage.js';

// Laboratory pages
import { LabDashboard } from './pages/laboratory/LabDashboard.js';
import { LabTestCataloguePage } from './pages/laboratory/LabTestCataloguePage.js';
import { LabBookingsPage } from './pages/laboratory/LabBookingsPage.js';
import { LabSampleTrackingPage } from './pages/laboratory/LabSampleTrackingPage.js';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { AdminVerificationsPage } from './pages/admin/AdminVerificationsPage.js';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.js';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage.js';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage.js';

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
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      <Navbar currentPath={currentPath} navigate={navigate} />

      {isDashboardRoute && isAuthenticated && user ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <Sidebar currentPath={currentPath} navigate={navigate} />
          <main className="flex-1 overflow-y-auto w-full min-w-0">{renderCurrentView()}</main>
        </div>
      ) : (
        <main className="flex-1 w-full min-w-0">{renderCurrentView()}</main>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <LocationProvider>
          <AppContent />
        </LocationProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
