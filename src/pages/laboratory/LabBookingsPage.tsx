import React, { useState, useEffect } from 'react';
import { Calendar, TestTube2, Home, Building2, CheckCircle2, FileText } from 'lucide-react';
import { api } from '../../services/api.js';
import { TestBooking } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { UploadReportModal } from '../../components/laboratory/UploadReportModal.js';

export const LabBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<TestBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingForReport, setSelectedBookingForReport] = useState<TestBooking | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await api.getTestBookings();
      if (res.success && res.data) {
        setBookings(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id: string, status: string, sampleStatus?: string) => {
    try {
      await api.updateTestBookingStatus(id, { status, sampleStatus });
      await fetchBookings();
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Patient Test Bookings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Process scheduled diagnostic orders, dispatch phlebotomy, and certify final clinical reports.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(n => (
              <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No patient test bookings received.
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map(b => (
              <div
                key={b.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-600">{b.bookingNumber}</span>
                    <Badge variant={b.status === 'REPORT_READY' ? 'success' : 'info'} size="sm">
                      {b.status}
                    </Badge>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {b.collectionType === 'HOME_COLLECTION' ? '🏠 Home Draw' : '🏥 Center Walk-in'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-1">
                    Patient: {b.patientName} • Test: {b.testName} (${b.totalAmount})
                  </h4>

                  <p className="text-xs text-slate-500 mt-0.5">
                    Scheduled: <strong>{b.scheduledDate}</strong> at <strong>{b.scheduledTimeSlot}</strong> • Phone: {b.patientPhone}
                  </p>

                  {b.collectionAddress && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Address: {b.collectionAddress}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {b.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'SAMPLE_COLLECTED', 'RECEIVED_AT_LAB')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Receive Sample
                    </button>
                  )}

                  {b.status !== 'REPORT_READY' && (
                    <button
                      onClick={() => setSelectedBookingForReport(b)}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText size={14} />
                      <span>Publish Report</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UploadReportModal
        booking={selectedBookingForReport}
        isOpen={!!selectedBookingForReport}
        onClose={() => setSelectedBookingForReport(null)}
        onSuccess={fetchBookings}
      />
    </div>
  );
};
