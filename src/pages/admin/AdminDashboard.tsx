import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Stethoscope, TestTube2, DollarSign, Activity, FileText, CheckCircle2, RotateCcw } from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminDashboardProps {
  navigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.getAdminStats();
      if (res.success && res.data) {
        setStats(res.data);
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/verifications')}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
          >
            Review Verifications
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20"
            title="Reset system database to seed data"
          >
            <RotateCcw size={14} />
            <span>Reset Database</span>
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
            Review state medical licenses, CLIA numbers, and clinic registration certificates.
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
    </div>
  );
};
