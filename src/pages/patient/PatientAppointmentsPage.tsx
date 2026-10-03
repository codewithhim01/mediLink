import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Video, UserCheck, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { Appointment } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { BookAppointmentModal } from '../../components/patient/BookAppointmentModal.js';
import { LiveQueueCard } from '../../components/queue/LiveQueueCard.js';

export const PatientAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

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

  const handleExecuteCancel = async (aptId: string) => {
    try {
      setCancellingId(aptId);
      await api.updateAppointmentStatus(aptId, { status: 'CANCELLED' });
      setConfirmCancelId(null);
      await fetchAppointments();
    } catch {
      // ignore
    } finally {
      setCancellingId(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointment = appointments.find(a => a.date === todayStr && a.status !== 'CANCELLED');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Appointments & Queue</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your doctor consultations, live queue positions, and telehealth links.
          </p>
        </div>

        <button
          onClick={() => setIsBookModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} />
          <span>Book New Consultation</span>
        </button>
      </div>

      {/* Today's Live Queue Card if any */}
      {todayAppointment && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} className="text-blue-600" />
            Live Clinic Queue for Today's Visit
          </p>
          <LiveQueueCard
            doctorId={todayAppointment.doctorId}
            doctorName={todayAppointment.doctorName || 'Dr. Specialist'}
            specialty={todayAppointment.doctorSpecialty}
            patientTicket={todayAppointment.queueTicket}
            onRefresh={fetchAppointments}
          />
        </div>
      )}

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">All Scheduled Appointments</h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            You have no appointments booked yet. Click "Book New Consultation" to select a specialist.
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map(apt => (
              <div
                key={apt.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    apt.type === 'TELECONSULT' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {apt.type === 'TELECONSULT' ? <Video size={20} /> : <UserCheck size={20} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{apt.doctorName}</h4>
                      <Badge
                        variant={
                          apt.status === 'COMPLETED' ? 'success' :
                          apt.status === 'CANCELLED' ? 'danger' :
                          apt.status === 'IN_PROGRESS' ? 'warning' : 'primary'
                        }
                        size="sm"
                      >
                        {apt.status}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-blue-700 font-semibold">{apt.doctorSpecialty} • {apt.clinicName}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      📅 Date: <strong>{apt.date}</strong> at <strong>{apt.timeSlot}</strong> ({apt.type}) • Fee: ₹{apt.feePaid}
                    </p>
                    {apt.symptoms && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Notes: {apt.symptoms}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {apt.queueTicket && apt.status !== 'CANCELLED' && (
                    <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <span className="block text-[10px] uppercase font-bold text-blue-600">Queue Token</span>
                      <span className="text-sm font-black text-blue-900">#{apt.queueTicket.tokenNumber}</span>
                    </div>
                  )}

                  {apt.status === 'CONFIRMED' && (
                    confirmCancelId === apt.id ? (
                      <div className="flex items-center gap-1.5 p-1 bg-rose-50 border border-rose-200 rounded-lg">
                        <span className="text-[11px] font-bold text-rose-800 px-1">Cancel?</span>
                        <button
                          onClick={() => handleExecuteCancel(apt.id)}
                          disabled={cancellingId === apt.id}
                          className="px-2 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmCancelId(null)}
                          className="px-2 py-1 text-[11px] font-semibold bg-white text-slate-700 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancelId(apt.id)}
                        disabled={cancellingId === apt.id}
                        className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={() => fetchAppointments()}
      />
    </div>
  );
};
