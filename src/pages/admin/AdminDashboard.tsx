import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Stethoscope,
  TestTube2,
  DollarSign,
  Activity,
  FileText,
  CheckCircle2,
  RotateCcw,
  UserCog,
  UserPlus
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { handleImageError } from '../../utils/imageUtils.js';
import { EditAdminModal } from '../../components/admin/EditAdminModal.js';
import { CreateAdminModal } from '../../components/admin/CreateAdminModal.js';
import { AppointCoAdminModal } from '../../components/admin/AppointCoAdminModal.js';

interface AdminDashboardProps {
  navigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate }) => {
  const { user: currentAdmin } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showAppointCoAdminModal, setShowAppointCoAdminModal] = useState(false);

  const fetchStats = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers()
      ]);
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExecuteReset = async () => {
    setResetting(true);
    setResetError(null);
    try {
      const res = await api.resetDemoData();
      if (res.success) {
        setResetNotice('System database successfully reseeded to initial state.');
        setShowResetConfirm(false);
        await fetchStats();
        setTimeout(() => setResetNotice(null), 4000);
      }
    } catch (err: any) {
      setResetError('Reset failed: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-800 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
            Platform Master Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            MediLink Executive Command
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Audit provider credential verifications, monitor clinical appointments and diagnostic volumes across Lucknow, Uttar Pradesh healthcare networks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowEditAdminModal(true)}
            className="px-3.5 py-2.5 bg-white text-slate-900 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            title="Modify administrator name, email, phone, or password"
          >
            <UserCog size={15} className="text-rose-600" />
            <span>Modify My Details</span>
          </button>
          <button
            onClick={() => setShowAppointCoAdminModal(true)}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            title="Appoint a Co-Administrator"
          >
            <ShieldCheck size={15} />
            <span>+ Appoint Co-Admin</span>
          </button>
          <button
            onClick={() => setShowCreateAdminModal(true)}
            className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            title="Provision an additional administrator account"
          >
            <UserPlus size={15} />
            <span>+ Add Admin Account</span>
          </button>
          <button
            onClick={() => navigate('/admin/verifications')}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer border border-white/20"
          >
            Review Verifications
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20"
            title="Reset system database to seed data"
          >
            <RotateCcw size={14} />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Administrator Account Management Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <img
            src={currentAdmin?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentAdmin?.name || 'Admin')}`}
            alt="Admin avatar"
            onError={(e) => handleImageError(e, currentAdmin?.name)}
            className="w-14 h-14 rounded-2xl border-2 border-rose-100 object-cover shadow-xs shrink-0"
          />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{currentAdmin?.name || 'MediLink Lucknow Admin'}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                Active Administrator
              </span>
            </div>
            <p className="text-xs text-slate-600 font-mono">
              {currentAdmin?.email || 'admin@medilink.com'} • {currentAdmin?.phone || '+91 522 220 9001'}
            </p>
            <p className="text-[11px] text-slate-400">
              Admin User ID: <span className="font-mono">{currentAdmin?.id || 'usr-admin-1'}</span> • Platform Authority: <span className="font-semibold text-emerald-600">Full Executive Access</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
          <button
            onClick={() => setShowEditAdminModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserCog size={14} className="text-slate-600" />
            <span>Edit My Details</span>
          </button>
          <button
            onClick={() => setShowCreateAdminModal(true)}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus size={14} />
            <span>Add Admin</span>
          </button>
        </div>
      </div>

      {showResetConfirm && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div>
            <strong className="block text-amber-950 font-bold">Reseed Database to Clean State?</strong>
            <span>This will reset all appointments, queues, and test records to initial verified demonstration state.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 rounded-lg font-bold border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteReset}
              disabled={resetting}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
            >
              {resetting ? 'Reseeding...' : 'Confirm Reset'}
            </button>
          </div>
        </div>
      )}

      {resetError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
          <span>{resetError}</span>
        </div>
      )}

      {resetNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{resetNotice}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Users size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats?.totalUsers || 0}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Registered Users</p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {stats?.usersByRole?.patients} Patients • {stats?.usersByRole?.doctors} Doctors
          </span>
        </div>

        <div
          onClick={() => navigate('/admin/verifications')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <ShieldCheck size={20} />
          </div>
          <p className="text-2xl font-black text-rose-600">
            {stats?.providers?.pendingDoctors + stats?.providers?.pendingLabs || 0}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Pending Verifications</p>
          <span className="text-[10px] text-rose-600 font-bold mt-1 block">Action required</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Activity size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats?.activity?.totalAppointments || 0}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Total Consultations</p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {stats?.activity?.activeAppointments} in progress today
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
            <DollarSign size={20} />
          </div>
          <p className="text-2xl font-black text-teal-700">
            ${stats?.financialVolume?.totalTransactions?.toFixed(0) || 0}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Platform GMV Volume</p>
          <span className="text-[10px] text-teal-600 font-semibold mt-1 block">
            Consultations + Lab tests
          </span>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => navigate('/admin/verifications')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-400 transition-colors shadow-xs cursor-pointer space-y-2"
        >
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck size={16} /> Provider Credentials
          </div>
          <h4 className="text-sm font-bold text-slate-900">Credential Verification</h4>
          <p className="text-xs text-slate-500">
            Review NMC registrations, NABL certificates, and UP clinic permits.
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/analytics')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-400 transition-colors shadow-xs cursor-pointer space-y-2"
        >
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
            <Activity size={16} /> Visual Reporting
          </div>
          <h4 className="text-sm font-bold text-slate-900">System Analytics</h4>
          <p className="text-xs text-slate-500">
            Interactive charts displaying appointment trends, test categories, and revenue.
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/audit-logs')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-400 transition-colors shadow-xs cursor-pointer space-y-2"
        >
          <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
            <FileText size={16} /> Compliance & Security
          </div>
          <h4 className="text-sm font-bold text-slate-900">Security Audit Trail</h4>
          <p className="text-xs text-slate-500">
            Track user authentications, medical report access requests, and administrative actions.
          </p>
        </div>
      </div>

      <EditAdminModal
        isOpen={showEditAdminModal}
        onClose={() => setShowEditAdminModal(false)}
        onSuccess={fetchStats}
      />

      <AppointCoAdminModal
        isOpen={showAppointCoAdminModal}
        onClose={() => setShowAppointCoAdminModal(false)}
        onSuccess={fetchStats}
        existingUsers={users}
      />

      <CreateAdminModal
        isOpen={showCreateAdminModal}
        onClose={() => setShowCreateAdminModal(false)}
        onSuccess={fetchStats}
      />
    </div>
  );
};
