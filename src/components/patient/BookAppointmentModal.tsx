import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Stethoscope, Calendar, Clock, Video, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { Doctor } from '../../types/index.js';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDoctorId?: string | null;
  onSuccess: (appointment: any) => void;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  preselectedDoctorId,
  onSuccess,
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(preselectedDoctorId || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState<string>('09:30 AM');
  const [type, setType] = useState<'IN_PERSON' | 'TELECONSULT'>('IN_PERSON');
  const [symptoms, setSymptoms] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getDoctors().then(res => {
        if (res.success && res.data) {
          setDoctors(res.data);
          if (preselectedDoctorId) {
            setSelectedDoctorId(preselectedDoctorId);
          } else if (res.data.length > 0 && !selectedDoctorId) {
            setSelectedDoctorId(res.data[0].id);
          }
        }
      });
    }
  }, [isOpen, preselectedDoctorId]);

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setError('Please select a doctor.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.createAppointment({
        doctorId: selectedDoctorId,
        date,
        timeSlot,
        type,
        symptoms,
      });

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setError('Could not complete appointment booking.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Specialist Consultation"
      subtitle="Guaranteed slot reservation with real-time OPD queue token"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Doctor selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Select Medical Specialist:
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.specialty} (${d.consultationFee} fee)
              </option>
            ))}
          </select>
        </div>

        {selectedDoctor && (
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs text-blue-950">
            <div>
              <p className="font-bold">{selectedDoctor.name}</p>
              <p className="text-[11px] text-blue-700">{selectedDoctor.specialty} • {selectedDoctor.clinicName}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-blue-900">${selectedDoctor.consultationFee}</span>
              <p className="text-[10px] text-slate-500">{selectedDoctor.consultationDuration} min consult</p>
            </div>
          </div>
        )}

        {/* Consultation Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Consultation Format:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('IN_PERSON')}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                type === 'IN_PERSON'
                  ? 'border-blue-600 bg-blue-50/80 text-blue-800'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <UserCheck size={16} className={type === 'IN_PERSON' ? 'text-blue-600' : 'text-slate-400'} />
              <span>In-Person Clinic Visit</span>
            </button>

            <button
              type="button"
              onClick={() => setType('TELECONSULT')}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                type === 'TELECONSULT'
                  ? 'border-blue-600 bg-blue-50/80 text-blue-800'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Video size={16} className={type === 'TELECONSULT' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Telehealth Video Call</span>
            </button>
          </div>
        </div>

        {/* Date and Time Slot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Consultation Date:
            </label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Time Slot:
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white"
            >
              {timeSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Symptoms / Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Symptoms / Reason for Visit:
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={3}
            placeholder="Briefly describe your symptoms, recent health changes, or tests you'd like to discuss..."
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
          />
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
          ⚡ <strong>Live Queue Assignment:</strong> If scheduled for today, a live digital queue token and dynamic wait-time ETA will be automatically assigned.
        </div>

        {/* Actions */}
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
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>Confirm & Reserve Appointment</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
