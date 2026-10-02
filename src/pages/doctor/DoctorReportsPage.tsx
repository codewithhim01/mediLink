import React, { useState, useEffect } from 'react';
import { FileText, Eye, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { MedicalReport } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { ReportViewerModal } from '../../components/reports/ReportViewerModal.js';

export const DoctorReportsPage: React.FC = () => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);

  const fetchReports = async () => {
    try {
      const res = await api.getReports();
      if (res.success && res.data) {
        setReports(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Authorized Patient Reports</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Access certified diagnostic pathology reports shared by your attending patients.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(n => (
              <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No patient reports currently shared with your profile.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(rep => (
              <div
                key={rep.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{rep.reportTitle}</h4>
                      <Badge variant="success" size="sm">
                        <CheckCircle2 size={12} /> {rep.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Patient: <strong className="text-slate-800">{rep.patientName || 'Verified Patient'}</strong> • Category: {rep.testCategory} • Published: {new Date(rep.publishedAt).toLocaleDateString()}
                    </p>
                    {rep.summary && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {rep.summary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => setSelectedReport(rep)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>Review Clinical Facts</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ReportViewerModal
        report={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
};
