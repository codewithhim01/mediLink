import React, { useState, useEffect } from 'react';
import { TestTube2, ClipboardList, Calendar, FileText, Plus, ShieldCheck, ArrowRight, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../services/api.js';
import { TestBooking, DiagnosticTest, MedicalReport } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { UploadReportModal } from '../../components/laboratory/UploadReportModal.js';
import { DeleteAccountModal } from '../../components/common/DeleteAccountModal.js';

interface LabDashboardProps {
  navigate: (path: string) => void;
}

export const LabDashboard: React.FC<LabDashboardProps> = ({ navigate }) => {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<TestBooking[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [selectedBookingForReport, setSelectedBookingForReport] = useState<TestBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchLabData = async () => {
    try {
      const [bookRes, repRes] = await Promise.all([
        api.getTestBookings(),
        api.getReports(),
      ]);

      if (bookRes.success && bookRes.data) setBookings(bookRes.data);
      if (repRes.success && repRes.data) setReports(repRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabData();
  }, []);

  const pendingBookings = bookings.filter(b => b.status !== 'REPORT_READY' && b.status !== 'CANCELLED');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Lab Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
            Pathology Laboratory Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {profile?.name || 'Precision Diagnostics & Pathology'}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
            License: <strong>{profile?.licenseNo || 'NABL-UP-9912401'}</strong> • Accreditation: {profile?.accreditation || 'NABL & ICMR Accredited'}
          </p>
        </div>

        <button
          onClick={() => navigate('/laboratory/tests')}
          className="px-4 py-2.5 bg-white text-slate-900 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
        >
          Manage Test Menu & Pricing
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/laboratory/bookings')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <Calendar size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900">{bookings.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Total Bookings Received</p>
        </div>

        <div
          onClick={() => navigate('/laboratory/samples')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
            <TestTube2 size={20} />
          </div>
          <p className="text-2xl font-black text-teal-700">{pendingBookings.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Specimens in Processing</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <FileText size={20} />
          </div>
          <p className="text-2xl font-black text-emerald-700">{reports.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Reports Published</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
            <ShieldCheck size={20} />
          </div>
          <p className="text-2xl font-black text-blue-700">100%</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">NABL Quality Compliant</p>
        </div>
      </div>

      {/* Pending Specimens for Report Upload */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Specimens Pending Official Report Publication</h3>
            <p className="text-xs text-slate-500">Sign validated parameters to instantly deliver PDF to patient and physician</p>
          </div>
        </div>

        {pendingBookings.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No pending specimens require report sign-off.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingBookings.map(b => (
              <div
                key={b.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">{b.bookingNumber}</span>
                    <Badge variant="info" size="sm">{b.status}</Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">
                    Patient: {b.patientName} • Test: {b.testName}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Barcode: <strong className="font-mono text-teal-800">{b.sample?.barcode}</strong> • Scheduled: {b.scheduledDate}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedBookingForReport(b)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText size={14} />
                  <span>Publish Certified Report</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <UploadReportModal
        booking={selectedBookingForReport}
        isOpen={!!selectedBookingForReport}
        onClose={() => setSelectedBookingForReport(null)}
        onSuccess={fetchLabData}
      />

      {/* Danger Zone: Laboratory Facility Account Deletion */}
      <div className="bg-white rounded-3xl border border-rose-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-rose-700 flex items-center gap-2">
              <Trash2 size={16} />
              Danger Zone: Delete Laboratory Account
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Permanently close and delete this laboratory diagnostics provider account. This will remove all catalogue test offerings, patient bookings, and certified reporting records.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Trash2 size={14} />
            <span>Delete Lab Account</span>
          </button>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        navigate={navigate}
      />
    </div>
  );
};
