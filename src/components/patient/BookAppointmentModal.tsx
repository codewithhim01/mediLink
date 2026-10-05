import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Stethoscope, Calendar, Clock, Video, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { Doctor } from '../../types/index.js';
import { validateDateNotPast, validateMinLength, validateRequired } from '../../utils/validation.js';
import { FieldError } from '../common/FieldError.js';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const docErr = validateRequired(selectedDoctorId, 'Medical Specialist');
    if (docErr) errors.doctorId = docErr;

    const dateErr = validateDateNotPast(date, 'Consultation date');
    if (dateErr) errors.date = dateErr;

    const slotErr = validateRequired(timeSlot, 'Time slot');
    if (slotErr) errors.timeSlot = slotErr;

    const symptomsErr = validateMinLength(symptoms, 5, 'Reason for visit / symptoms');
    if (symptomsErr) errors.symptoms = symptomsErr;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ doctorId: true, date: true, timeSlot: true, symptoms: true });

    if (!validateForm()) {
      setError('Please resolve the required appointment fields.');
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
        symptoms: symptoms.trim(),
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
            Select Medical Specialist: <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedDoctorId}
            onBlur={() => setTouched(prev => ({ ...prev, doctorId: true }))}
            onChange={(e) => {
              setSelectedDoctorId(e.target.value);
              if (fieldErrors.doctorId) setFieldErrors(prev => ({ ...prev, doctorId: '' }));
            }}
            className={`w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 ${
              touched.doctorId && fieldErrors.doctorId
                ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                : 'border-slate-200 focus:ring-blue-500'
            }`}
          >
            <option value="">-- Choose a doctor --</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.specialty} (₹{d.consultationFee} fee)
              </option>
            ))}
          </select>
          {touched.doctorId && <FieldError error={fieldErrors.doctorId} />}
        </div>

        {selectedDoctor && (
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs text-blue-950">
            <div>
              <p className="font-bold">{selectedDoctor.name}</p>
              <p className="text-[11px] text-blue-700">{selectedDoctor.specialty} • {selectedDoctor.clinicName}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-blue-900">₹{selectedDoctor.consultationFee}</span>
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
              Consultation Date: <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onBlur={() => setTouched(prev => ({ ...prev, date: true }))}
              onChange={(e) => {
                setDate(e.target.value);
                if (fieldErrors.date) setFieldErrors(prev => ({ ...prev, date: '' }));
              }}
              className={`w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white ${
                touched.date && fieldErrors.date
                  ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            {touched.date && <FieldError error={fieldErrors.date} />}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Time Slot: <span className="text-rose-500">*</span>
            </label>
            <select
              value={timeSlot}
              onBlur={() => setTouched(prev => ({ ...prev, timeSlot: true }))}
              onChange={(e) => {
                setTimeSlot(e.target.value);
                if (fieldErrors.timeSlot) setFieldErrors(prev => ({ ...prev, timeSlot: '' }));
              }}
              className={`w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white ${
                touched.timeSlot && fieldErrors.timeSlot
                  ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-blue-500'
              }`}
            >
              {timeSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
            {touched.timeSlot && <FieldError error={fieldErrors.timeSlot} />}
          </div>
        </div>

        {/* Symptoms / Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Symptoms / Reason for Visit: <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={symptoms}
            onBlur={() => setTouched(prev => ({ ...prev, symptoms: true }))}
            onChange={(e) => {
              setSymptoms(e.target.value);
              if (fieldErrors.symptoms) setFieldErrors(prev => ({ ...prev, symptoms: '' }));
            }}
            rows={3}
            placeholder="Briefly describe your symptoms (e.g. chest tightness on exertion, fasting sugar check, joint pain)..."
            className={`w-full p-2.5 bg-slate-50 border rounded-xl text-xs text-slate-800 focus:bg-white ${
              touched.symptoms && fieldErrors.symptoms
                ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                : 'border-slate-200 focus:ring-blue-500'
            }`}
          />
          {touched.symptoms && <FieldError error={fieldErrors.symptoms} />}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
          ⚡ <strong>Live Queue Assignment:</strong> If scheduled for today, a live digital queue token and dynamic wait-time ETA will be automatically assigned.
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
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>Confirm & Reserve Appointment</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
