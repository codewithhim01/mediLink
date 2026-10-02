import React, { useState, useEffect } from 'react';
import { TestTube2, CheckCircle2, AlertCircle, Clock, Thermometer } from 'lucide-react';
import { api } from '../../services/api.js';
import { TestBooking } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';

export const LabSampleTrackingPage: React.FC = () => {
  const [bookings, setBookings] = useState<TestBooking[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleUpdateSampleStatus = async (bookingId: string, sampleStatus: string) => {
    try {
      await api.updateTestBookingStatus(bookingId, { sampleStatus });
      await fetchBookings();
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Specimen Barcode & Chain of Custody</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Track biological specimens through transit, automated analyzers, and pathologist sign-off.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(n => (
              <div key={n} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No specimen samples logged.
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
                    <span className="font-mono font-bold text-teal-800 bg-white border border-slate-200 px-2 py-0.5 rounded text-xs">
                      {b.sample?.barcode || 'SMP-BC-PENDING'}
                    </span>
                    <Badge variant={b.sample?.status === 'COMPLETED' ? 'success' : 'info'} size="sm">
                      {b.sample?.status || 'COLLECTED'}
                    </Badge>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-1">
                    {b.testName} • Patient: {b.patientName}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Specimen: <strong>{b.sample?.sampleType}</strong> • Temp: {b.sample?.temperature || '4°C Controlled'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <span className="text-[11px] text-slate-400">Advance Status:</span>
                  <select
                    value={b.sample?.status || 'COLLECTED'}
                    onChange={(e) => handleUpdateSampleStatus(b.id, e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="COLLECTED">COLLECTED</option>
                    <option value="IN_TRANSIT">IN_TRANSIT</option>
                    <option value="RECEIVED_AT_LAB">RECEIVED_AT_LAB</option>
                    <option value="ANALYZING">ANALYZING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
