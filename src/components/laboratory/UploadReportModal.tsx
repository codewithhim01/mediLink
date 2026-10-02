import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { FileText, Plus, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { TestBooking } from '../../types/index.js';

interface UploadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: TestBooking | null;
  onSuccess: () => void;
}

export const UploadReportModal: React.FC<UploadReportModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  if (!booking) return null;

  const [reportTitle, setReportTitle] = useState(booking.testName || 'Diagnostic Investigation Report');
  const [testCategory, setTestCategory] = useState(booking.testCategory || 'Clinical Pathology');
  const [summary, setSummary] = useState('All biological parameters verified against standard laboratory reference boundaries. Clinical correlation advised.');
  const [parameters, setParameters] = useState<Array<{ parameter: string; value: string; unit: string; referenceRange: string; flag: string }>>([
    { parameter: 'Total Cholesterol', value: '185', unit: 'mg/dL', referenceRange: '125 - 200', flag: 'NORMAL' },
    { parameter: 'HDL Direct', value: '52', unit: 'mg/dL', referenceRange: '> 40', flag: 'NORMAL' },
    { parameter: 'LDL Calculated', value: '98', unit: 'mg/dL', referenceRange: '< 100', flag: 'NORMAL' },
  ]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addParam = () => {
    setParameters(prev => [...prev, { parameter: '', value: '', unit: '', referenceRange: '', flag: 'NORMAL' }]);
  };

  const removeParam = (index: number) => {
    setParameters(prev => prev.filter((_, i) => i !== index));
  };

  const updateParam = (index: number, field: string, val: string) => {
    setParameters(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.uploadLabReport({
        testBookingId: booking.id,
        patientId: booking.patientId,
        reportTitle,
        testCategory,
        summary,
        extractedFacts: parameters,
      });

      if (res.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload report. Please check the values and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publish Certified Medical Diagnostic Report"
      subtitle={`Patient: ${booking.patientName} • Booking: ${booking.bookingNumber}`}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
            <span>{errorMessage}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Report Title</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
            <input
              type="text"
              value={testCategory}
              onChange={(e) => setTestCategory(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Pathologist Clinical Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
          />
        </div>

        {/* Parameters Editor Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700">Validated Analyte Parameters</label>
            <button
              type="button"
              onClick={addParam}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} /> Add Row
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto p-1">
            {parameters.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <input
                  type="text"
                  placeholder="Parameter"
                  value={p.parameter}
                  onChange={(e) => updateParam(idx, 'parameter', e.target.value)}
                  className="flex-2 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={p.value}
                  onChange={(e) => updateParam(idx, 'value', e.target.value)}
                  className="flex-1 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={p.unit}
                  onChange={(e) => updateParam(idx, 'unit', e.target.value)}
                  className="flex-1 p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="Range"
                  value={p.referenceRange}
                  onChange={(e) => updateParam(idx, 'referenceRange', e.target.value)}
                  className="flex-1 p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <select
                  value={p.flag}
                  onChange={(e) => updateParam(idx, 'flag', e.target.value)}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="LOW">LOW</option>
                  <option value="BORDERLINE">BORDERLINE</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeParam(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-teal-500/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <ShieldCheck size={15} />
            <span>Sign & Publish Report</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
