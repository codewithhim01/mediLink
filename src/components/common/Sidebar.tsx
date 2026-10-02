import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  FileText,
  TestTube2,
  Stethoscope,
  Building2,
  ShieldCheck,
  User as UserIcon,
  Sparkles,
  ArrowRightLeft,
  Users,
  BarChart3,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Role } from '../../types/index.js';

interface SidebarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, navigate }) => {
  const { user } = useAuth();
  if (!user) return null;

  const roleNavItems: Record<Role, NavItem[]> = {
    PATIENT: [
      { label: 'Overview', path: '/patient/dashboard', icon: LayoutDashboard },
      { label: 'Appointments & Queue', path: '/patient/appointments', icon: Calendar },
      { label: 'Diagnostic Bookings', path: '/patient/lab-bookings', icon: TestTube2 },
      { label: 'Medical Reports', path: '/patient/reports', icon: FileText, badge: 'AI' },
      { label: 'Doctor Referrals', path: '/patient/referrals', icon: ArrowRightLeft },
      { label: 'Health Profile', path: '/patient/profile', icon: UserIcon },
    ],
    DOCTOR: [
      { label: 'Clinical Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
      { label: 'Live Queue Manager', path: '/doctor/queue', icon: Clock, badge: 'Live' },
      { label: 'Patient Appointments', path: '/doctor/appointments', icon: Calendar },
      { label: 'Issue Referrals', path: '/doctor/referrals', icon: ArrowRightLeft },
      { label: 'Patient Reports', path: '/doctor/reports', icon: FileText },
      { label: 'Profile & Schedule', path: '/doctor/profile', icon: UserIcon },
    ],
    CLINIC: [
      { label: 'Clinic Center', path: '/clinic/dashboard', icon: LayoutDashboard },
      { label: 'Doctor Roster', path: '/clinic/doctors', icon: Stethoscope },
      { label: 'Department Queues', path: '/clinic/queues', icon: Clock },
    ],
    LABORATORY: [
      { label: 'Lab Operations', path: '/laboratory/dashboard', icon: LayoutDashboard },
      { label: 'Test Catalogue', path: '/laboratory/tests', icon: ClipboardList },
      { label: 'Test Bookings', path: '/laboratory/bookings', icon: Calendar },
      { label: 'Sample Tracking', path: '/laboratory/samples', icon: TestTube2 },
    ],
    ADMIN: [
      { label: 'Admin Command', path: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Provider Verification', path: '/admin/verifications', icon: ShieldCheck, badge: 'Action' },
      { label: 'Platform Users', path: '/admin/users', icon: Users },
      { label: 'System Analytics', path: '/admin/analytics', icon: BarChart3 },
      { label: 'Security Audit Logs', path: '/admin/audit-logs', icon: FileText },
    ],
  };

  const navItems = roleNavItems[user.role] || [];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Role Banner */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Workspace</p>
        <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
          {user.role === 'PATIENT' && <UserIcon size={16} className="text-emerald-600" />}
          {user.role === 'DOCTOR' && <Stethoscope size={16} className="text-blue-600" />}
          {user.role === 'CLINIC' && <Building2 size={16} className="text-indigo-600" />}
          {user.role === 'LABORATORY' && <TestTube2 size={16} className="text-amber-600" />}
          {user.role === 'ADMIN' && <ShieldCheck size={16} className="text-rose-600" />}
          <span>{user.role.charAt(0) + user.role.slice(1).toLowerCase()} Portal</span>
        </p>
      </div>

      {/* Nav List */}
      <nav className="p-3 space-y-1 flex-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick AI Report prompt for patients */}
      {user.role === 'PATIENT' && (
        <div className="m-3 p-3.5 bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl border border-teal-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles size={16} className="text-teal-600" />
            <span className="text-xs font-bold text-teal-900">AI Report Assistant</span>
          </div>
          <p className="text-[11px] text-slate-600 mb-2.5 leading-relaxed">
            Upload previous diagnostic lab PDFs to extract facts, explore findings, and discover matched doctors.
          </p>
          <button
            onClick={() => navigate('/patient/reports')}
            className="w-full py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center shadow-xs"
          >
            Analyze Report
          </button>
        </div>
      )}
    </aside>
  );
};
