import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, TestTube2, Stethoscope, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api.js';
import { Referral } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';

interface PatientReferralsPageProps {
  navigate: (path: string) => void;
}

export const PatientReferralsPage: React.FC<PatientReferralsPageProps> = ({ navigate }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = async () => {
    try {
      const res = await api.getReferrals();
      if (res.success && res.data) {
        setReferrals(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Diagnostic Referrals from Physicians</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Review lab tests prescribed by your attending doctor with one-click diagnostic test booking.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(n => (
            <div key={n} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : referrals.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <ArrowRightLeft size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-800">No active referrals</p>
          <p className="text-xs text-slate-500 mt-1">
            When a doctor recommends specific diagnostic investigations during consultation, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {referrals.map(ref => (
            <div
              key={ref.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {ref.referralCode}
                  </span>
                  <Badge variant={ref.priority === 'URGENT' ? 'danger' : 'info'} size="sm">
                    {ref.priority}
                  </Badge>
                  <Badge variant={ref.status === 'BOOKED' ? 'success' : 'primary'} size="sm">
                    {ref.status}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-slate-900">
                  Prescribed Investigation: {ref.testName || 'Comprehensive Diagnostic Panel'}
                </h3>

                <p className="text-xs text-slate-600">
                  Referring Physician: <strong className="text-blue-800">{ref.doctorName}</strong> ({ref.doctorSpecialty})
                </p>

                {ref.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    Doctor's Clinical Note: "{ref.notes}"
                  </p>
                )}
              </div>

              <div className="pt-2 md:pt-0 shrink-0">
                {ref.status === 'PENDING' ? (
                  <button
                    onClick={() => navigate(`/diagnostic-tests`)}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Book Referred Test</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={15} /> Booked Online
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
