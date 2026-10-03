import React, { useState, useEffect } from 'react';
import { TestTube2, Plus, Edit2, Trash2, Clock, DollarSign, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { DiagnosticTest } from '../../types/index.js';
import { Modal } from '../../components/common/Modal.js';

export const LabTestCataloguePage: React.FC = () => {
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Cardiology & Lipidology');
  const [sampleType, setSampleType] = useState('Serum (Blood)');
  const [turnaroundHours, setTurnaroundHours] = useState(24);
  const [price, setPrice] = useState(60);
  const [discountPrice, setDiscountPrice] = useState<number | ''>('');
  const [preparationInstructions, setPreparationInstructions] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTests = async () => {
    try {
      const res = await api.getDiagnosticTests();
      if (res.success && res.data) {
        setTests(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const openAddModal = () => {
    setEditingTestId(null);
    setFormError(null);
    setName('');
    setCode(`TST-${Math.floor(1000 + Math.random() * 9000)}`);
    setCategory('Cardiology & Lipidology');
    setSampleType('Serum (Blood)');
    setTurnaroundHours(24);
    setPrice(60);
    setDiscountPrice('');
    setPreparationInstructions('Fasting required 10-12 hours.');
    setDescription('Clinical assessment panel.');
    setIsModalOpen(true);
  };

  const openEditModal = (test: DiagnosticTest) => {
    setEditingTestId(test.id);
    setFormError(null);
    setName(test.name);
    setCode(test.code);
    setCategory(test.category);
    setSampleType(test.sampleType);
    setTurnaroundHours(test.turnaroundHours);
    setPrice(test.price);
    setDiscountPrice(test.discountPrice || '');
    setPreparationInstructions(test.preparationInstructions || '');
    setDescription(test.description || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (editingTestId) {
        await api.updateDiagnosticTest(editingTestId, {
          name,
          code,
          category,
          sampleType,
          turnaroundHours,
          price,
          discountPrice: discountPrice ? Number(discountPrice) : null,
          preparationInstructions,
          description,
        });
      } else {
        await api.createDiagnosticTest({
          name,
          code,
          category,
          sampleType,
          turnaroundHours,
          price,
          discountPrice: discountPrice ? Number(discountPrice) : null,
          preparationInstructions,
          description,
          parameters: [
            { name: 'Primary Marker', unit: 'mg/dL', normalRange: 'Standard' }
          ]
        });
      }
      setIsModalOpen(false);
      await fetchTests();
    } catch (err: any) {
      setFormError(err.message || 'Error saving test');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteDiagnosticTest(id);
      await fetchTests();
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Diagnostic Test Catalogue</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage test offerings, turnaround guarantees, pricing and sample collection instructions.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} />
          <span>Add New Diagnostic Test</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : tests.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No diagnostic tests in catalog yet. Click "Add New Diagnostic Test" to populate your menu.
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map(test => (
              <div
                key={test.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">{test.code}</span>
                    <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                      {test.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">{test.name}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Sample: <strong>{test.sampleType}</strong> • Turnaround: <strong>{test.turnaroundHours}h TAT</strong>
                  </p>
                  {test.preparationInstructions && (
                    <p className="text-[11px] text-slate-500 mt-0.5 italic">
                      Preparation: {test.preparationInstructions}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 self-end md:self-center">
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900">
                      ₹{test.discountPrice || test.price}
                    </span>
                    {test.discountPrice && (
                      <span className="text-xs text-slate-400 line-through block">
                        ₹{test.price}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(test)}
                      className="p-2 text-slate-600 hover:text-teal-700 hover:bg-white rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(test.id)}
                      className="p-2 text-slate-600 hover:text-rose-700 hover:bg-white rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
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
        title={editingTestId ? 'Edit Diagnostic Test' : 'Add New Diagnostic Test'}
        subtitle="Configure pricing, turnaround time, and specimen guidelines"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
              <span>{formError}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Test Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lipid Panel Advanced"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Test Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Specimen Sample Type</label>
              <input
                type="text"
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Standard Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Discount Price (₹)</label>
              <input
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="Optional"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Turnaround (Hours)</label>
              <input
                type="number"
                value={turnaroundHours}
                onChange={(e) => setTurnaroundHours(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Patient Preparation Instructions</label>
            <input
              type="text"
              value={preparationInstructions}
              onChange={(e) => setPreparationInstructions(e.target.value)}
              placeholder="e.g. 10-12 hour fasting required."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
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
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-teal-500/20 cursor-pointer"
            >
              Save Diagnostic Test
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
