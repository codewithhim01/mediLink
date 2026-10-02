import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Download, Share2, CheckCircle2, ShieldCheck, Eye, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.js';
import { MedicalReport } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { ReportViewerModal } from '../../components/reports/ReportViewerModal.js';
import { AIReportAnalysisModal } from '../../components/reports/AIReportAnalysisModal.js';

interface PatientReportsPageProps {
  navigate: (path: string) => void;
}

export const PatientReportsPage: React.FC<PatientReportsPageProps> = ({ navigate }) => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [sharingNotice, setSharingNotice] = useState<string | null>(null);

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

  const handleToggleShare = async (reportId: string, currentShared: boolean) => {
    try {
      const res = await api.toggleShareReport(reportId, !currentShared);
      if (res.success) {
        setSharingNotice(`Report sharing updated: ${!currentShared ? 'Now accessible to your attending doctors.' : 'Restricted to private.'}`);
        await fetchReports();
        setTimeout(() => setSharingNotice(null), 4000);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header and prominent AI button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Medical & Diagnostic Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Access certified lab reports, manage physician sharing permissions, or run AI extraction on previous PDFs.
          </p>
        </div>

        {/* Feature Button: Analyze Previous Report & Find Relevant Care */}
        <button
          onClick={() => setIsAIModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Sparkles size={16} />
          <span>Analyze Previous Report & Find Relevant Care</span>
        </button>
      </div>

      {sharingNotice && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-blue-600" />
          <span>{sharingNotice}</span>
        </div>
      )}

      {/* AI Assistant Banner */}
      <div className="p-5 bg-gradient-to-br from-teal-50/70 via-blue-50/50 to-indigo-50/50 rounded-2xl border border-teal-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-teal-950 uppercase tracking-wider">
              AI Report Assistant & Care Navigation
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Have an older lab result or PDF from an external clinic? Upload it to automatically extract numerical parameters against biological reference ranges, view clear explanations, and match with MediLink specialists.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAIModalOpen(true)}
          className="px-4 py-2 bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs shrink-0"
        >
          Upload PDF to Analyze
        </button>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Archived Clinical Reports</h3>
          <span className="text-xs font-semibold text-slate-400">Total: {reports.length}</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(n => (
              <div key={n} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No medical reports found. Reports from completed diagnostic tests will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(rep => (
              <div
                key={rep.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{rep.reportTitle}</h4>
                      <Badge variant="success" size="sm">
                        <CheckCircle2 size={12} /> {rep.status}
                      </Badge>
                      {rep.isSharedWithDoctor && (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          Shared with Doctor
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Laboratory: <strong className="text-slate-700">{rep.laboratoryName || 'Clinical Diagnostics'}</strong> • Published: {new Date(rep.publishedAt).toLocaleDateString()}
                    </p>

                    {rep.summary && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 max-w-2xl">
                        {rep.summary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleToggleShare(rep.id, rep.isSharedWithDoctor)}
                    className="p-2 text-slate-600 hover:text-blue-700 hover:bg-white rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    title={rep.isSharedWithDoctor ? 'Unshare with doctor' : 'Share with doctor'}
                  >
                    <Share2 size={15} />
                  </button>

                  <a
                    href={`/uploads/${rep.fileName || 'report.pdf'}`}
                    download
                    className="p-2 text-slate-600 hover:text-blue-700 hover:bg-white rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    title="Download PDF"
                  >
                    <Download size={15} />
                  </a>

                  <button
                    onClick={() => setSelectedReport(rep)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Eye size={13} />
                    <span>View Report</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Viewer Modal */}
      <ReportViewerModal
        report={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onToggleShare={handleToggleShare}
      />

      {/* AI Report Analysis Modal */}
      <AIReportAnalysisModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSelectDoctor={(docId) => {
          setIsAIModalOpen(false);
          navigate(`/doctors/${docId}`);
        }}
        onSelectTest={() => {
          setIsAIModalOpen(false);
          navigate('/diagnostic-tests');
        }}
        onReportSaved={() => {
          fetchReports();
        }}
      />
    </div>
  );
};
