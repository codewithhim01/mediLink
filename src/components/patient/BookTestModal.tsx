import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { TestTube2, Home, Building2, Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { DiagnosticTest } from '../../types/index.js';

interface BookTestModalProps {
  test: DiagnosticTest | null;
  isOpen: boolean;
  onClose: () => void;
  referralId?: string | null;
  onSuccess: (booking: any) => void;
}

export const BookTestModal: React.FC<BookTestModalProps> = ({
  test,
  isOpen,
  onClose,
  referralId,
  onSuccess,
}) => {
  if (!test) return null;

  const [collectionType, setCollectionType] = useState<'WALK_IN' | 'HOME_COLLECTION'>('WALK_IN');
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string>('08:30 AM');
  const [collectionAddress, setCollectionAddress] = useState<string>('742 Evergreen Terrace, Springfield, OR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = test.discountPrice !== undefined && test.discountPrice !== null ? test.discountPrice : test.price;

  const timeSlots = [
    '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM',
    '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
    '02:00 PM', '03:00 PM', '04:00 PM'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.createTestBooking({
        testId: test.id,
        referralId: referralId || null,
        collectionType,
        scheduledDate,
        scheduledTimeSlot,
        collectionAddress: collectionType === 'HOME_COLLECTION' ? collectionAddress : test.laboratoryAddress,
      });

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setError('Failed to book test.');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating test booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Diagnostic Investigation"
      subtitle={`Laboratory: ${test.laboratoryName || 'MediLink Partner Laboratory'}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Selected Test Details Box */}
        <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TestTube2 size={16} className="text-teal-700" />
              <h4 className="text-xs font-bold text-teal-950">{test.name}</h4>
            </div>
            <p className="text-[11px] text-teal-800 mt-1">
              Sample Type: <strong className="font-semibold">{test.sampleType}</strong> • Turnaround: {test.turnaroundHours}h TAT
            </p>
            {test.preparationInstructions && (
              <p className="text-[10px] text-teal-700 mt-1 italic">
                Instruction: {test.preparationInstructions}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-teal-900">₹{price}</span>
            {test.discountPrice && (
              <span className="block text-[10px] line-through text-slate-400">
                ₹{test.price}
              </span>
            )}
          </div>
        </div>

        {/* Collection Type Choice */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Specimen Collection Preference:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCollectionType('WALK_IN')}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                collectionType === 'WALK_IN'
                  ? 'border-teal-600 bg-teal-50/80 text-teal-900'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Building2 size={16} className={collectionType === 'WALK_IN' ? 'text-teal-600' : 'text-slate-400'} />
              <span>Walk-in to Lab Center</span>
            </button>

            <button
              type="button"
              onClick={() => setCollectionType('HOME_COLLECTION')}
              disabled={!test.homeCollectionAvailable}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                !test.homeCollectionAvailable
                  ? 'opacity-40 cursor-not-allowed border-slate-200'
                  : collectionType === 'HOME_COLLECTION'
                  ? 'border-teal-600 bg-teal-50/80 text-teal-900 cursor-pointer'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer'
              }`}
            >
              <Home size={16} className={collectionType === 'HOME_COLLECTION' ? 'text-teal-600' : 'text-slate-400'} />
              <span>Home Phlebotomy Draw</span>
            </button>
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Scheduled Date:
            </label>
            <input
              type="date"
              value={scheduledDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Time Slot:
            </label>
            <select
              value={scheduledTimeSlot}
              onChange={(e) => setScheduledTimeSlot(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white"
            >
              {timeSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Home Address if home collection */}
        {collectionType === 'HOME_COLLECTION' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Sample Collection Home Address:
            </label>
            <input
              type="text"
              value={collectionAddress}
              onChange={(e) => setCollectionAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
            />
          </div>
        )}

        {/* Barcode & Sample Tracking Explanation */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
          🔬 <strong>Live Specimen Tracking:</strong> A unique barcode tracking ID will be generated upon confirmation, allowing end-to-end status monitoring from sample collection to pathologist verification.
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>Confirm Diagnostic Booking</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
