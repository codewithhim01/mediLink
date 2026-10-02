import React, { useState, useEffect } from 'react';
import { Calendar, UserCheck, Video, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.js';
import { Appointment } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';

export const DoctorAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const res = await api.getAppointments();
      if (res.success && res.data) {
        setAppointments(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.updateAppointmentStatus(id, { status });
      await fetchAppointments();
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Patient Appointments Roster</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Review patient chief complaints, update clinical consultation status, and view history.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No patient appointments scheduled.
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map(apt => (
              <div
                key={apt.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    apt.type === 'TELECONSULT' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {apt.type === 'TELECONSULT' ? <Video size={20} /> : <UserCheck size={20} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{apt.patientName}</h4>
                      <Badge
                        variant={
                          apt.status === 'COMPLETED' ? 'success' :
                          apt.status === 'IN_PROGRESS' ? 'warning' : 'primary'
                        }
                        size="sm"
                      >
                        {apt.status}
                      </Badge>
                      {apt.queueTicket && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                          Token #{apt.queueTicket.tokenNumber}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      📅 {apt.date} at {apt.timeSlot} • Format: <strong>{apt.type}</strong> • Patient Contact: {apt.patientPhone || apt.patientEmail}
                    </p>

                    {apt.symptoms && (
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 mt-1.5">
                        Chief Complaint: "{apt.symptoms}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {apt.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'IN_PROGRESS')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Start Consult
                    </button>
                  )}

                  {apt.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
