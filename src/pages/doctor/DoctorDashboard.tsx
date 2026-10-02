import React, { useState, useEffect } from 'react';
import { Stethoscope, Clock, Users, ArrowRightLeft, FileText, CheckCircle2, ChevronRight, Activity, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../services/api.js';
import { Appointment, Queue } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';

interface DoctorDashboardProps {
  navigate: (path: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ navigate }) => {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDoctorData = async () => {
    try {
      const aptRes = await api.getAppointments();
      if (aptRes.success && aptRes.data) {
        setAppointments(aptRes.data);
      }

      if (profile?.id) {
        const qRes = await api.getDoctorQueue(profile.id);
        if (qRes.success && qRes.data) {
          setQueue(qRes.data.queue);
          setWaitingCount(qRes.data.waitingCount || 0);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [profile?.id]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === todayStr);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-800 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
            Physician Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {user?.name || 'Dr. Specialist'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Specialty: <strong className="text-white">{profile?.specialty || 'Cardiology'}</strong> • Clinic: Metro Health Specialist Center
          </p>
        </div>

        <button
          onClick={() => navigate('/doctor/queue')}
          className="px-5 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Clock size={16} />
          <span>Launch Live Queue Console</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/doctor/queue')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Clock size={20} />
          </div>
          <p className="text-2xl font-black text-blue-600">Token #{queue?.currentTokenNumber || 0}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Current Patient In Room</p>
        </div>

        <div
          onClick={() => navigate('/doctor/queue')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Users size={20} />
          </div>
          <p className="text-2xl font-black text-amber-600">{waitingCount}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Patients Waiting Outside</p>
        </div>

        <div
          onClick={() => navigate('/doctor/appointments')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Calendar size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900">{todayAppointments.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Appointments Today</p>
        </div>

        <div
          onClick={() => navigate('/doctor/referrals')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <ArrowRightLeft size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900">Active</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Diagnostic Referrals</p>
        </div>
      </div>

      {/* Today's Schedule Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Today's Patient Consultations</h3>
            <p className="text-xs text-slate-500">Live roster synchronizing with OPD patient tokens</p>
          </div>
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold"
          >
            All Appointments ({appointments.length})
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No consultations booked for today.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Token #</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Time Slot</th>
                  <th className="py-2.5 px-3">Format</th>
                  <th className="py-2.5 px-3">Chief Complaint</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayAppointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                      #{apt.queueTicket?.tokenNumber || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{apt.patientName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{apt.timeSlot}</td>
                    <td className="py-2.5 px-3 text-slate-600">{apt.type}</td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{apt.symptoms || 'General clinical check'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Badge
                        variant={
                          apt.status === 'COMPLETED' ? 'success' :
                          apt.status === 'IN_PROGRESS' ? 'warning' : 'primary'
                        }
                        size="sm"
                      >
                        {apt.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
