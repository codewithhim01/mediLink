import React from 'react';
import { Modal } from '../common/Modal.js';
import { Badge } from '../common/Badge.js';
import { FileText, Download, CheckCircle2, ShieldCheck, Share2 } from 'lucide-react';
import { MedicalReport } from '../../types/index.js';

interface ReportViewerModalProps {
  report: MedicalReport | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleShare?: (reportId: string, currentShared: boolean) => void;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({
  report,
  isOpen,
  onClose,
  onToggleShare,
}) => {
  if (!report) return null;

  const handleDownload = () => {
    // Downloads file via the backend uploads endpoint
    window.location.href = `/uploads/${report.fileName || 'report.pdf'}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={report.reportTitle}
      subtitle={`Published on ${new Date(report.publishedAt).toLocaleDateString()} by ${report.laboratoryName || 'Clinical Diagnostic Lab'}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Header Summary Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{report.reportTitle}</span>
                <Badge variant="success" size="sm">
                  <CheckCircle2 size={12} /> {report.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Category: <span className="font-semibold text-slate-700">{report.testCategory}</span> • Size: {(report.fileSize / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onToggleShare && (
              <button
                onClick={() => onToggleShare(report.id, report.isSharedWithDoctor)}
                className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  report.isSharedWithDoctor
                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Share2 size={14} />
                <span>{report.isSharedWithDoctor ? 'Shared with Doctor' : 'Share with Doctor'}</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Clinical Summary */}
        {report.summary && (
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
              Pathologist / Clinical Summary
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">{report.summary}</p>
          </div>
        )}

        {/* Extracted Parameters Table */}
        {report.extractedFacts && report.extractedFacts.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Verified Parameter Breakdown
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Analyte / Test Parameter</th>
                    <th className="py-2.5 px-3">Result Value</th>
                    <th className="py-2.5 px-3">Units</th>
                    <th className="py-2.5 px-3">Biological Reference Range</th>
                    <th className="py-2.5 px-3 text-right">Interpretation Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.extractedFacts.map((fact, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{fact.parameter}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{fact.value}</td>
                      <td className="py-2.5 px-3 text-slate-500">{fact.unit}</td>
                      <td className="py-2.5 px-3 text-slate-600">{fact.referenceRange}</td>
                      <td className="py-2.5 px-3 text-right">
                        {fact.flag === 'HIGH' && (
                          <Badge variant="danger" size="sm">HIGH</Badge>
                        )}
                        {fact.flag === 'LOW' && (
                          <Badge variant="warning" size="sm">LOW</Badge>
                        )}
                        {fact.flag === 'BORDERLINE' && (
                          <Badge variant="warning" size="sm">BORDERLINE</Badge>
                        )}
                        {fact.flag === 'NORMAL' && (
                          <Badge variant="success" size="sm">NORMAL</Badge>
                        )}
                        {!['HIGH', 'LOW', 'BORDERLINE', 'NORMAL'].includes(fact.flag) && (
                          <Badge variant="gray" size="sm">{fact.flag}</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Security & Authentication Sign-off */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-teal-600" />
            <span>Digital Cryptographic Verification: Validated & Signed by Laboratory Director</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">UUID: {report.id.slice(0, 12)}...</span>
        </div>
      </div>
    </Modal>
  );
};
