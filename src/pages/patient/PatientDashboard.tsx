import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  TestTube2,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Activity,
  Plus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../services/api.js';
import { Appointment, TestBooking, MedicalReport, QueueTicket } from '../../types/index.js';
import { LiveQueueCard } from '../../components/queue/LiveQueueCard.js';
import { BookAppointmentModal } from '../../components/patient/BookAppointmentModal.js';
import { AIReportAnalysisModal } from '../../components/reports/AIReportAnalysisModal.js';
import { ReportViewerModal } from '../../components/reports/ReportViewerModal.js';
import { Badge } from '../../components/common/Badge.js';

interface PatientDashboardProps {
  navigate: (path: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bookings, setTestBookings] = useState<TestBooking[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);

  const fetchData = async () => {
    try {
      const [aptRes, bookRes, repRes] = await Promise.all([
        api.getAppointments(),
        api.getTestBookings(),
        api.getReports(),
      ]);

      if (aptRes.success && aptRes.data) setAppointments(aptRes.data);
      if (bookRes.success && bookRes.data) setTestBookings(bookRes.data);
      if (repRes.success && repRes.data) setReports(repRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointment = appointments.find(a => a.date === todayStr && a.status !== 'CANCELLED');
  const upcomingAppointments = appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
              Patient Care Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user?.name || 'Johnathan'}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
              Your personal healthcare command center. Track live clinical queue positions, check diagnostic sample progress, and review verified medical reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsBookModalOpen(true)}
              className="px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Book Doctor</span>
            </button>

            <button
              onClick={() => setIsAIModalOpen(true)}
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles size={15} />
              <span>AI Report Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Queue Card if patient has appointment today */}
      {todayAppointment && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Clock size={14} className="text-blue-600" />
            Today's Live Queue Tracker
          </h2>
          <LiveQueueCard
            doctorId={todayAppointment.doctorId}
            doctorName={todayAppointment.doctorName || 'Dr. Specialist'}
            specialty={todayAppointment.doctorSpecialty}
            patientTicket={todayAppointment.queueTicket}
            onRefresh={fetchData}
          />
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/patient/appointments')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Calendar size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900">{upcomingAppointments.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Upcoming Consultations</p>
        </div>

        <div
          onClick={() => navigate('/patient/lab-bookings')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
            <TestTube2 size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {bookings.filter(b => b.status !== 'CANCELLED' && b.status !== 'REPORT_READY').length}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Active Lab Bookings</p>
        </div>

        <div
          onClick={() => navigate('/patient/reports')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <FileText size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900">{reports.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Verified Medical Reports</p>
        </div>

        <div
          onClick={() => setIsAIModalOpen(true)}
          className="bg-gradient-to-br from-teal-50 to-blue-50 p-4 rounded-2xl border border-teal-200 shadow-xs hover:border-teal-400 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-3 shadow-sm">
            <Sparkles size={20} />
          </div>
          <p className="text-sm font-black text-teal-950">Analyze Report</p>
          <p className="text-xs font-medium text-teal-700 mt-0.5">AI Care Navigation</p>
        </div>
      </div>

      {/* Main Grid: Upcoming Consultations & Diagnostic Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Box */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              Upcoming Doctor Consultations
            </h3>
            <button
              onClick={() => navigate('/patient/appointments')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              View All ({appointments.length})
            </button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No upcoming appointments. Schedule a doctor visit anytime.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 3).map(apt => (
                <div
                  key={apt.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{apt.doctorName}</p>
                    <p className="text-[11px] text-blue-700 font-semibold">{apt.doctorSpecialty} • {apt.clinicName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      📅 {apt.date} at {apt.timeSlot} ({apt.type === 'IN_PERSON' ? 'In-Person' : 'Teleconsult'})
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={apt.status === 'CONFIRMED' ? 'success' : 'primary'} size="sm">
                      {apt.status}
                    </Badge>
                    {apt.queueTicket && (
                      <span className="block text-[11px] font-bold text-blue-700 mt-1">
                        Token #{apt.queueTicket.tokenNumber}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnostic Sample Tracking Box */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TestTube2 size={16} className="text-teal-600" />
              Diagnostic Samples & Tests
            </h3>
            <button
              onClick={() => navigate('/patient/lab-bookings')}
              className="text-xs text-teal-600 hover:text-teal-800 font-semibold cursor-pointer"
            >
              Track All ({bookings.length})
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No diagnostic tests booked. Compare accredited labs to book a test.
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 3).map(b => (
                <div
                  key={b.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{b.testName}</p>
                    <p className="text-[11px] text-teal-800 font-medium">{b.laboratoryName}</p>
                    {b.sample && (
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                        Barcode: {b.sample.barcode} ({b.sample.status})
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        b.status === 'REPORT_READY' ? 'success' :
                        b.status === 'SAMPLE_COLLECTED' ? 'info' : 'primary'
                      }
                      size="sm"
                    >
                      {b.status}
                    </Badge>
                    <span className="block text-xs font-bold text-slate-800 mt-1">
                      ${b.totalAmount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Medical Reports Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Medical & Diagnostic Reports</h3>
          </div>
          <button
            onClick={() => navigate('/patient/reports')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
          >
            All Reports ({reports.length})
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No medical reports on file. Completed lab tests will post here automatically.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reports.slice(0, 2).map(rep => (
              <div
                key={rep.id}
                onClick={() => setSelectedReport(rep)}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="success" size="sm">
                      <CheckCircle2 size={12} /> {rep.status}
                    </Badge>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rep.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-2">{rep.reportTitle}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {rep.summary || 'Clinical laboratory findings validated by certified pathologist director.'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-indigo-600 font-bold">
                  <span>View Details & Parameters</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
      />

      <AIReportAnalysisModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSelectDoctor={(docId) => {
          setIsAIModalOpen(false);
          navigate(`/doctors?search=${docId}`);
        }}
        onSelectTest={(testId) => {
          setIsAIModalOpen(false);
          navigate(`/diagnostic-tests`);
        }}
        onReportSaved={() => {
          fetchData();
        }}
      />

      <ReportViewerModal
        report={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
};
