import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  Stethoscope,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api.js';
import { RatingStars } from '../../components/common/RatingStars.js';
import { Badge } from '../../components/common/Badge.js';
import { BookAppointmentModal } from '../../components/patient/BookAppointmentModal.js';
import { useAuth } from '../../contexts/AuthContext.js';

interface ClinicDetailPageProps {
  clinicId: string;
  navigate: (path: string) => void;
}

export const ClinicDetailPage: React.FC<ClinicDetailPageProps> = ({ clinicId, navigate }) => {
  const { isAuthenticated, switchDemoRole } = useAuth();
  const [clinic, setClinic] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    api.getClinicById(clinicId).then(res => {
      if (res.success && res.data) {
        setClinic(res.data);
      }
      setLoading(false);
    });
  }, [clinicId]);

  const handleBookWithDoctor = async (docId: string) => {
    if (!isAuthenticated) {
      await switchDemoRole('PATIENT');
    }
    setSelectedDoctorId(docId);
    setIsBookModalOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-64 bg-white rounded-3xl border border-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-sm font-bold text-slate-700">Clinic not found</p>
        <button
          onClick={() => navigate('/clinics')}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Clinics
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <button
        onClick={() => navigate('/clinics')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
      >
        <ArrowLeft size={14} /> Back to Healthcare Centers
      </button>

      {successNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Clinic Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{clinic.name}</h1>
              {clinic.isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <ShieldCheck size={12} /> State Registered Center
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1">
              State License / Registration #{clinic.registrationNo}
            </p>

            <div className="mt-2">
              <RatingStars rating={clinic.rating} showScore reviewCount={clinic.reviewCount} />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 space-y-1.5 min-w-[240px]">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-blue-600 shrink-0" />
              <span>{clinic.address}, {clinic.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-blue-600 shrink-0" />
              <span>Operating Hours: <strong>{clinic.openingTime} - {clinic.closingTime}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-blue-600 shrink-0" />
              <span>{clinic.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-blue-600 shrink-0" />
              <span>{clinic.email}</span>
            </div>
          </div>
        </div>

        {/* Clinical Specialties & Facilities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Outpatient Specialties
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {clinic.services?.map((srv: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-xl text-xs font-semibold border border-blue-100"
                >
                  {srv}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Patient Amenities & Facilities
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {clinic.facilities?.map((fac: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium border border-slate-200"
                >
                  ✓ {fac}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Practicing Specialist Doctors Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <h2 className="text-lg font-black text-slate-900">Physicians Practicing at this Center</h2>
          <p className="text-xs text-slate-500">Book direct consultations with live OPD queue tracking</p>
        </div>

        {clinic.doctors?.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No doctors listed for this location.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clinic.doctors?.map((doc: any) => (
              <div
                key={doc.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                  <p className="text-xs font-semibold text-blue-700">{doc.specialty}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Fee: <strong>${doc.fee}</strong> • Rating: {doc.rating} ⭐ ({doc.reviewCount} reviews)
                  </p>
                </div>

                <button
                  onClick={() => handleBookWithDoctor(doc.id)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Calendar size={13} />
                  <span>Book Visit</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        preselectedDoctorId={selectedDoctorId}
        onSuccess={(apt) => {
          setSuccessNotice(`Appointment successfully booked for ${apt.date} at ${apt.timeSlot}! Live Queue Token #${apt.queueTicket?.tokenNumber || '1'} reserved.`);
        }}
      />
    </div>
  );
};
