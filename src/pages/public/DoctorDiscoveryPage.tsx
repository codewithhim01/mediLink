import React, { useState, useEffect } from 'react';
import { Search, Filter, Stethoscope, MapPin, Calendar, Star, DollarSign, Clock, ShieldCheck, CheckCircle2, UserCheck } from 'lucide-react';
import { api } from '../../services/api.js';
import { Doctor } from '../../types/index.js';
import { RatingStars } from '../../components/common/RatingStars.js';
import { Badge } from '../../components/common/Badge.js';
import { BookAppointmentModal } from '../../components/patient/BookAppointmentModal.js';
import { useAuth } from '../../contexts/AuthContext.js';

interface DoctorDiscoveryPageProps {
  navigate: (path: string) => void;
  initialSearch?: string;
  initialSpecialty?: string;
}

export const DoctorDiscoveryPage: React.FC<DoctorDiscoveryPageProps> = ({
  navigate,
  initialSearch = '',
  initialSpecialty = '',
}) => {
  const { isAuthenticated, switchDemoRole } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [maxFee, setMaxFee] = useState<number | ''>('');
  const [minRating, setMinRating] = useState<number | ''>('');

  // Booking modal
  const [bookingDoctorId, setBookingDoctorId] = useState<string | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (specialty) params.specialty = specialty;
      if (maxFee) params.maxFee = maxFee;
      if (minRating) params.minRating = minRating;

      const res = await api.getDoctors(params);
      if (res.success && res.data) {
        setDoctors(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [specialty, maxFee, minRating]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors();
  };

  const handleBookClick = async (doctorId: string) => {
    if (!isAuthenticated) {
      // Auto switch to patient demo user for immediate seamless booking experience!
      await switchDemoRole('PATIENT');
    }
    setBookingDoctorId(doctorId);
    setIsBookingOpen(true);
  };

  const specialtiesList = [
    'All Specialties',
    'Cardiology',
    'Neurology',
    'Endocrinology',
    'Internal Medicine',
    'Preventive Care'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Find & Book Medical Specialists
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Search credentialed doctors with transparent fees, verified patient ratings, and live queue assignment.
        </p>
      </div>

      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => navigate('/patient/appointments')}
            className="text-emerald-700 underline font-bold"
          >
            View Live Queue Ticket
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctor name, conditions treated, or clinics..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-400 flex items-center gap-1">
            <Filter size={13} /> Filters:
          </span>

          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value === 'All Specialties' ? '' : e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white"
          >
            {specialtiesList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={maxFee}
            onChange={(e) => setMaxFee(e.target.value ? Number(e.target.value) : '')}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white"
          >
            <option value="">Max Fee: Any</option>
            <option value="100">Under $100</option>
            <option value="120">Under $120</option>
            <option value="150">Under $150</option>
          </select>

          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : '')}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white"
          >
            <option value="">Rating: Any</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4.8">4.8+ Stars</option>
          </select>

          {(specialty || maxFee || minRating || search) && (
            <button
              onClick={() => { setSpecialty(''); setMaxFee(''); setMinRating(''); setSearch(''); }}
              className="text-xs text-rose-600 hover:underline font-semibold ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs animate-pulse h-64" />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Stethoscope size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-800">No doctors match your criteria</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting the specialty filter or fee threshold.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map(doc => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              <div>
                {/* Doctor Head */}
                <div 
                  onClick={() => navigate(`/doctors/${doc.id}`)}
                  className="flex items-start gap-3 mb-3 cursor-pointer group"
                >
                  <img
                    src={doc.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doc.name)}`}
                    alt={doc.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0 group-hover:ring-2 group-hover:ring-blue-500 transition-all"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{doc.name}</h3>
                      {doc.isVerified && (
                        <span title="Verified Medical License">
                          <ShieldCheck size={15} className="text-blue-600 shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-blue-700">{doc.specialty}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{doc.qualification} • {doc.experienceYears}y exp</p>
                  </div>
                </div>

                {/* Rating & Fee bar */}
                <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-3">
                  <RatingStars rating={doc.rating} showScore reviewCount={doc.reviewCount} />
                  <div className="text-right">
                    <span className="font-black text-slate-900">${doc.consultationFee}</span>
                    <span className="text-[10px] text-slate-400 block">consult fee</span>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                  {doc.bio || 'Dedicated medical specialist committed to evidence-based preventive care and patient health.'}
                </p>

                {/* Clinic and Location */}
                <div className="text-[11px] text-slate-500 space-y-1 mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{doc.clinicName} • {doc.clinicCity}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span>{doc.consultationDuration}m appointment duration</span>
                  </div>
                </div>

                {/* Schedule Days */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {doc.availability.map((day, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-md">
                      {day.slice(0, 3)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => navigate(`/doctors/${doc.id}`)}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <UserCheck size={14} className="text-slate-500" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => handleBookClick(doc.id)}
                  className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Calendar size={14} />
                  <span>Book</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment booking modal */}
      <BookAppointmentModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedDoctorId={bookingDoctorId}
        onSuccess={(apt) => {
          setSuccessNotice(`Appointment successfully booked for ${apt.date} at ${apt.timeSlot}! Live Queue Token #${apt.queueTicket?.tokenNumber || 'Assigned'} issued.`);
        }}
      />
    </div>
  );
};
