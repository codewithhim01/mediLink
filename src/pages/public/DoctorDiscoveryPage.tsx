import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Stethoscope, MapPin, Calendar, Star, Clock, ShieldCheck, CheckCircle2, UserCheck, Navigation, ArrowUpDown } from 'lucide-react';
import { api } from '../../services/api.js';
import { Doctor } from '../../types/index.js';
import { RatingStars } from '../../components/common/RatingStars.js';
import { Badge } from '../../components/common/Badge.js';
import { BookAppointmentModal } from '../../components/patient/BookAppointmentModal.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useLocation } from '../../contexts/LocationContext.js';
import { LocationPickerModal } from '../../components/common/LocationPickerModal.js';
import { handleImageError } from '../../utils/imageUtils.js';

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
  const { isAuthenticated } = useAuth();
  const { currentLocation, selectedRadius, calculateDistance, formatDistance, isWithinRadius } = useLocation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [maxFee, setMaxFee] = useState<number | ''>('');
  const [minRating, setMinRating] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'nearest' | 'rating' | 'fee_asc' | 'experience'>('nearest');
  const [filterByRadius, setFilterByRadius] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);

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

  const handleBookClick = (doctorId: string) => {
    setBookingDoctorId(doctorId);
    setIsBookingOpen(true);
  };

  const specialtiesList = [
    'All Specialties',
    'Cardiology',
    'Neurology',
    'Endocrinology',
    'Pediatrics',
    'Internal Medicine',
    'Preventive Health',
  ];

  // Dynamic location and proximity filtering + sorting
  const processedDoctors = useMemo(() => {
    let result = [...doctors];

    // Filter by radius if enabled
    if (filterByRadius && selectedRadius !== null) {
      const within = result.filter(d => isWithinRadius(d.latitude, d.longitude));
      // If none within strict radius, keep all but sort by nearest
      if (within.length > 0) {
        result = within;
      }
    }

    // Sort
    result.sort((a, b) => {
      const distA = calculateDistance(a.latitude, a.longitude) ?? 9999;
      const distB = calculateDistance(b.latitude, b.longitude) ?? 9999;

      if (sortBy === 'nearest') {
        return distA - distB;
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'fee_asc') {
        return a.consultationFee - b.consultationFee;
      }
      if (sortBy === 'experience') {
        return b.experienceYears - a.experienceYears;
      }
      return 0;
    });

    return result;
  }, [doctors, filterByRadius, selectedRadius, sortBy, currentLocation]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Consult Specialist Doctors in Lucknow
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Verified specialist doctors, live OPD queue tokens, transparent consultation fees & clinic navigation in Lucknow.
          </p>
        </div>

        {/* Location Indicator & Switcher Button */}
        <button
          onClick={() => setShowLocationModal(true)}
          className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs shrink-0"
        >
          <MapPin size={15} className="text-blue-600 shrink-0" />
          <span>Near {currentLocation.areaName}</span>
          <span className="text-[10px] bg-blue-200/70 text-blue-800 px-1.5 py-0.5 rounded-full">
            {selectedRadius ? `${selectedRadius} km` : 'All Lucknow'}
          </span>
          <span className="text-blue-600 underline text-[11px] ml-1">Change</span>
        </button>
      </div>

      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Location Filter Banner */}
      <div className="p-3.5 bg-gradient-to-r from-blue-50/90 via-slate-50 to-teal-50/70 border border-blue-100 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Navigation size={15} />
          </div>
          <div>
            <p className="font-bold text-slate-900">
              Active Locality: <span className="text-blue-700">{currentLocation.areaName}, Lucknow, UP</span>
            </p>
            <p className="text-[11px] text-slate-500">
              Showing {processedDoctors.length} doctors within {selectedRadius ? `${selectedRadius} km` : 'entire Lucknow metro'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={filterByRadius}
              onChange={(e) => setFilterByRadius(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Filter within {selectedRadius ? `${selectedRadius} km` : 'city'}</span>
          </label>
          <button
            onClick={() => setShowLocationModal(true)}
            className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
          >
            Change Radius / Area
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctor by name, specialty (e.g. Cardiology), or clinic in Lucknow..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-blue-500/20 cursor-pointer shrink-0"
          >
            Search Doctors
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-2 pt-2 border-t border-slate-100">
          {/* Specialty Dropdown */}
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value === 'All Specialties' ? '' : e.target.value)}
            className="w-full lg:w-auto p-2 sm:p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white"
          >
            {specialtiesList.map((spec) => (
              <option key={spec} value={spec === 'All Specialties' ? '' : spec}>
                {spec}
              </option>
            ))}
          </select>

          {/* Max Fee Dropdown (INR) */}
          <select
            value={maxFee}
            onChange={(e) => setMaxFee(e.target.value ? Number(e.target.value) : '')}
            className="w-full lg:w-auto p-2 sm:p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white"
          >
            <option value="">Max Fee: Any</option>
            <option value="600">Up to ₹600</option>
            <option value="800">Up to ₹800</option>
            <option value="1000">Up to ₹1,000</option>
            <option value="1500">Up to ₹1,500</option>
          </select>

          {/* Rating */}
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : '')}
            className="w-full lg:w-auto p-2 sm:p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white"
          >
            <option value="">Rating: Any</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4.8">4.8+ Stars</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1 w-full lg:w-auto lg:ml-auto col-span-2 sm:col-span-1">
            <ArrowUpDown size={13} className="text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full lg:w-auto p-2 sm:p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-blue-900 focus:bg-white"
            >
              <option value="nearest">Sort: Nearest to Me (km)</option>
              <option value="rating">Sort: Highest Rated</option>
              <option value="fee_asc">Sort: Fee (Low to High)</option>
              <option value="experience">Sort: Most Experienced</option>
            </select>
          </div>

          {(specialty || maxFee || minRating || search) && (
            <button
              onClick={() => { setSpecialty(''); setMaxFee(''); setMinRating(''); setSearch(''); }}
              className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer col-span-2 sm:col-span-1 text-center lg:text-left py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs animate-pulse h-64" />
          ))}
        </div>
      ) : processedDoctors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Stethoscope size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-800">No doctors match your criteria in {currentLocation.areaName}</p>
          <p className="text-xs text-slate-500 mt-1">Try expanding your search radius or choosing another Lucknow locality.</p>
          <button
            onClick={() => { setFilterByRadius(false); setSpecialty(''); setMaxFee(''); }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer"
          >
            Show All Doctors in Lucknow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {processedDoctors.map((doc) => {
            const distStr = formatDistance(doc.latitude, doc.longitude);
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Distance & Locality Tag */}
                  <div className="flex items-center justify-between text-[11px] mb-3 pb-2 border-b border-slate-100">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold flex items-center gap-1">
                      <MapPin size={11} className="text-blue-600" />
                      {distStr ? `${distStr}` : 'Lucknow'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold truncate max-w-[170px]">
                      {doc.area || doc.clinicCity || 'Lucknow'}
                    </span>
                  </div>

                  {/* Doctor Head */}
                  <div
                    onClick={() => navigate(`/doctors/${doc.id}`)}
                    className="flex items-start gap-3 mb-3 cursor-pointer group"
                  >
                    <img
                      src={doc.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doc.name)}`}
                      alt={doc.name}
                      onError={(e) => handleImageError(e, doc.name)}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0 group-hover:ring-2 group-hover:ring-blue-500 transition-all"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{doc.name}</h3>
                        {doc.isVerified && (
                          <span title="NMC / State Verified Medical Practitioner">
                            <ShieldCheck size={15} className="text-blue-600 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-blue-700">{doc.specialty}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{doc.qualification} • {doc.experienceYears}y exp</p>
                    </div>
                  </div>

                  {/* Rating & Fee bar in INR (₹) */}
                  <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-3">
                    <RatingStars rating={doc.rating} showScore reviewCount={doc.reviewCount} />
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">₹{doc.consultationFee}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">OPD fee</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                    {doc.bio || 'Dedicated medical specialist committed to evidence-based healthcare and patient well-being in Lucknow.'}
                  </p>

                  {/* Clinic and Location */}
                  <div className="text-[11px] text-slate-500 space-y-1 mb-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{doc.clinicName} • {doc.clinicAddress}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400 shrink-0" />
                      <span>{doc.consultationDuration} min consultation slot</span>
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
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/doctors/${doc.id}`)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => handleBookClick(doc.id)}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Calendar size={13} />
                    <span>Book Token</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {bookingDoctorId && (
        <BookAppointmentModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          preselectedDoctorId={bookingDoctorId}
          onSuccess={() => {
            setSuccessNotice('OPD consultation booked successfully! Your live queue token is generated.');
            setTimeout(() => setSuccessNotice(null), 5000);
          }}
        />
      )}

      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
};
