import React, { useState, useEffect } from 'react';
import { Building2, Stethoscope, Clock, Users, Calendar, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../services/api.js';
import { Doctor, Appointment } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { handleImageError } from '../../utils/imageUtils.js';

interface ClinicDashboardProps {
  navigate: (path: string) => void;
}

export const ClinicDashboard: React.FC<ClinicDashboardProps> = ({ navigate }) => {
  const { profile } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDoctors(), api.getAppointments()]).then(([docRes, aptRes]) => {
      if (docRes.success && docRes.data) setDoctors(docRes.data);
      if (aptRes.success && aptRes.data) setAppointments(aptRes.data);
      setLoading(false);
    });
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === todayStr);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Clinic Header */}
      <div className="bg-gradient-to-r from-indigo-800 via-blue-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
            Healthcare Center Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {profile?.name || 'Awadh Mediplex & Heart Institute'}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-xl">
            {profile?.address || 'Vibhuti Khand, Gomti Nagar'}, {profile?.city || 'Lucknow, UP'} • Reg: {profile?.registrationNo || 'UP-LKO-CLINIC-2022'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/clinic/doctors')}
            className="px-4 py-2.5 bg-white text-indigo-900 font-bold rounded-xl text-xs hover:bg-indigo-50 transition-colors shadow-sm cursor-pointer"
          >
            Manage Doctor Roster
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Stethoscope size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900">{doctors.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Affiliated Specialists</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Calendar size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900">{todayAppointments.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Appointments Today</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Clock size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900">08:00 - 20:00</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Center Operating Hours</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
            <ShieldCheck size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900">Active</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Digital OPD Queue Status</p>
        </div>
      </div>

      {/* Specialist Doctors on Duty */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Physicians On Duty Roster</h3>
            <p className="text-xs text-slate-500">Scheduled clinical hours across outpatient wings</p>
          </div>
          <button
            onClick={() => navigate('/clinic/doctors')}
            className="text-xs text-blue-600 font-bold hover:underline"
          >
            All Doctors ({doctors.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {doctors.map(doc => (
            <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-3">
                <img
                  src={doc.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doc.name)}`}
                  alt={doc.name}
                  onError={(e) => handleImageError(e, doc.name)}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                  <p className="text-[11px] text-blue-700 font-semibold">{doc.specialty}</p>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-0.5 pt-1 border-t border-slate-200/60">
                <p>Consultation Fee: <strong>₹{doc.consultationFee}</strong></p>
                <p>Days: {doc.availability.slice(0, 3).join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
