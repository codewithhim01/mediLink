import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Plus, TestTube2, AlertCircle, CheckCircle2, UserCheck, Loader2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { Referral, DiagnosticTest, Appointment } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';

export const DoctorReferralsPage: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [loading, setLoading] = useState(true);

  // New referral modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [testId, setTestId] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [refRes, aptRes, testRes] = await Promise.all([
        api.getReferrals(),
        api.getAppointments(),
        api.getDiagnosticTests(),
      ]);

      if (refRes.success && refRes.data) setReferrals(refRes.data);
      if (aptRes.success && aptRes.data) {
        setAppointments(aptRes.data);
        if (aptRes.data.length > 0 && !patientId) {
          setPatientId(aptRes.data[0].patientId);
        }
      }
      if (testRes.success && testRes.data) {
        setTests(testRes.data);
        if (testRes.data.length > 0 && !testId) {
          setTestId(testRes.data[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !testId) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const selectedTest = tests.find(t => t.id === testId);
      const res = await api.createReferral({
        patientId,
        testId,
        labId: selectedTest?.labId,
        notes,
        priority,
      });

      if (res.success) {
        setIsModalOpen(false);
        setNotes('');
        await fetchData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create referral');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Diagnostic Referrals Console</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Prescribe targeted clinical laboratory panels to your patients with accredited partner testing.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} />
          <span>Issue New Lab Referral</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Issued Diagnostic Referrals</h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(n => (
              <div key={n} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : referrals.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No diagnostic referrals issued yet. Click "Issue New Lab Referral" to prescribe tests.
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map(ref => (
              <div
                key={ref.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-600">{ref.referralCode}</span>
                    <Badge variant={ref.priority === 'URGENT' ? 'danger' : 'info'} size="sm">
                      {ref.priority}
                    </Badge>
                    <Badge variant={ref.status === 'BOOKED' ? 'success' : 'primary'} size="sm">
                      {ref.status}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Patient: {ref.patientName} • Investigation: {ref.testName}
                  </h4>
                  {ref.notes && (
                    <p className="text-xs text-slate-600 bg-white p-2 rounded-xl border border-slate-200 mt-1">
                      Clinical Note: "{ref.notes}"
                    </p>
                  )}
                </div>

                <div className="text-right text-xs text-slate-400 shrink-0">
                  <span>Issued on {new Date(ref.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Diagnostic Referral"
        subtitle="Select patient and laboratory investigation"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateReferral} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Patient</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
            >
              {appointments.map(a => (
                <option key={a.patientId} value={a.patientId}>
                  {a.patientName} (Appointment: {a.date})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Diagnostic Panel</label>
            <select
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
            >
              {tests.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} — ₹{t.discountPrice || t.price} ({t.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Priority</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPriority('NORMAL')}
                className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                  priority === 'NORMAL' ? 'bg-blue-50 border-blue-600 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Normal Routine
              </button>
              <button
                type="button"
                onClick={() => setPriority('URGENT')}
                className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                  priority === 'URGENT' ? 'bg-rose-50 border-rose-600 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Urgent Priority
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Doctor's Clinical Notes / Indications</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Please evaluate baseline lipid and cardiac biomarkers before initiating medical therapy..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              <span>Issue Referral</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
