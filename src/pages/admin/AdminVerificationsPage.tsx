import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, AlertCircle, Building2, Stethoscope, TestTube2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { Badge } from '../../components/common/Badge.js';

export const AdminVerificationsPage: React.FC = () => {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVerifications = async () => {
    try {
      const res = await api.getVerifications();
      if (res.success && res.data) {
        setVerifications(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleDecision = async (entityType: string, id: string, approve: boolean) => {
    try {
      await api.updateVerificationStatus(entityType, id, { isVerified: approve });
      await fetchVerifications();
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Provider Credential Verification</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Verify NMC medical registrations, NABL laboratory certificates, and UP clinic permits.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : verifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No providers awaiting verification.
          </div>
        ) : (
          <div className="space-y-3">
            {verifications.map(item => (
              <div
                key={`${item.entityType}-${item.id}`}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    item.entityType === 'DOCTOR' ? 'bg-blue-100 text-blue-700' :
                    item.entityType === 'LABORATORY' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {item.entityType === 'DOCTOR' ? <Stethoscope size={20} /> :
                     item.entityType === 'LABORATORY' ? <TestTube2 size={20} /> : <Building2 size={20} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                      <Badge variant={item.isVerified ? 'success' : 'warning'} size="sm">
                        {item.isVerified ? 'VERIFIED' : 'PENDING APPROVAL'}
                      </Badge>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        {item.entityType}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 font-mono">
                      {item.credentialIdentifier} • {item.qualification}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      Contact: {item.email} • {item.phone} • Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {!item.isVerified ? (
                    <>
                      <button
                        onClick={() => handleDecision(item.entityType, item.id, true)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Check size={14} />
                        <span>Approve & Verify</span>
                      </button>
                      <button
                        onClick={() => handleDecision(item.entityType, item.id, false)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border border-rose-200"
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck size={15} /> Verified Provider
                    </span>
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
