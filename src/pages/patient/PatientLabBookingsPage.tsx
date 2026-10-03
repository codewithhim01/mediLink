import React, { useState, useEffect } from 'react';
import { TestTube2, Home, Building2, Clock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api.js';
import { TestBooking } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';

interface PatientLabBookingsPageProps {
  navigate: (path: string) => void;
}

export const PatientLabBookingsPage: React.FC<PatientLabBookingsPageProps> = ({ navigate }) => {
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

  const sampleStages = ['COLLECTED', 'IN_TRANSIT', 'RECEIVED_AT_LAB', 'ANALYZING', 'COMPLETED'];

  const getStageIndex = (status?: string) => {
    if (!status) return 0;
    const idx = sampleStages.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Diagnostic Bookings & Sample Tracking</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time barcode tracking from specimen phlebotomy to pathologist validation.
          </p>
        </div>

        <button
          onClick={() => navigate('/diagnostic-tests')}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer"
        >
          <TestTube2 size={15} />
          <span>Book Diagnostic Test</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(n => (
            <div key={n} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <TestTube2 size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-800">No test bookings found</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Compare tests across certified laboratories to schedule a walk-in or home collection.
          </p>
          <button
            onClick={() => navigate('/diagnostic-tests')}
            className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl"
          >
            Explore Diagnostic Tests
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map(b => {
            const currentStageIdx = getStageIndex(b.sample?.status);

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">{b.bookingNumber}</span>
                      <Badge
                        variant={b.status === 'REPORT_READY' ? 'success' : 'info'}
                        size="sm"
                      >
                        {b.status}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{b.testName}</h3>
                    <p className="text-xs text-slate-500">
                      Laboratory: <strong className="text-slate-700">{b.laboratoryName}</strong> • Category: {b.testCategory}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-lg font-black text-slate-900">₹{b.totalAmount}</span>
                    <span className="text-[11px] text-slate-500 block">
                      Scheduled: {b.scheduledDate} at {b.scheduledTimeSlot}
                    </span>
                  </div>
                </div>

                {/* Sample Tracking Pipeline */}
                {b.sample && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">Specimen Barcode:</span>
                        <code className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-teal-800">
                          {b.sample.barcode}
                        </code>
                        <span className="text-[11px] text-slate-400">({b.sample.sampleType})</span>
                      </div>
                      <span className="text-[11px] font-semibold text-teal-700">
                        ❄️ Cold Chain: {b.sample.temperature || '4°C Controlled'}
                      </span>
                    </div>

                    {/* Progress steps */}
                    <div className="relative pt-2">
                      <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-200">
                        <div
                          style={{ width: `${((currentStageIdx + 1) / sampleStages.length) * 100}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-600 transition-all duration-500"
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-semibold">
                        <span>1. Collected</span>
                        <span>2. In Transit</span>
                        <span>3. Received</span>
                        <span>4. Analyzing</span>
                        <span>5. Ready</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions & Report prompt */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">
                    Collection Mode: <strong className="text-slate-700">{b.collectionType === 'HOME_COLLECTION' ? 'Home Phlebotomy' : 'Walk-in Center'}</strong>
                  </span>

                  {b.status === 'REPORT_READY' && (
                    <button
                      onClick={() => navigate('/patient/reports')}
                      className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Access Medical Report</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
