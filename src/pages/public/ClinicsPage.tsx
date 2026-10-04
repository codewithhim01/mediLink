import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building2, MapPin, Phone, Clock, ShieldCheck, ArrowRight, Navigation, ArrowUpDown } from 'lucide-react';
import { api } from '../../services/api.js';
import { Clinic } from '../../types/index.js';
import { RatingStars } from '../../components/common/RatingStars.js';
import { useLocation } from '../../contexts/LocationContext.js';
import { LocationPickerModal } from '../../components/common/LocationPickerModal.js';

interface ClinicsPageProps {
  navigate: (path: string) => void;
}

export const ClinicsPage: React.FC<ClinicsPageProps> = ({ navigate }) => {
  const { currentLocation, selectedRadius, formatDistance, calculateDistance } = useLocation();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const res = await api.getClinics(search ? { search } : undefined);
      if (res.success && res.data) {
        setClinics(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClinics();
  };

  const processedClinics = useMemo(() => {
    const list = [...clinics];
    list.sort((a, b) => {
      const distA = calculateDistance(a.latitude, a.longitude) ?? 9999;
      const distB = calculateDistance(b.latitude, b.longitude) ?? 9999;
      return distA - distB;
    });
    return list;
  }, [clinics, currentLocation]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Partner Health Centres & Polyclinics in Lucknow
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Multispecialty outpatient medical centers with integrated NABL sample collection and live OPD queue screens across Lucknow.
          </p>
        </div>

        {/* Location Indicator */}
        <button
          onClick={() => setShowLocationModal(true)}
          className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs shrink-0"
        >
          <MapPin size={15} className="text-blue-600 shrink-0" />
          <span>Near {currentLocation.areaName}</span>
          <span className="text-[10px] bg-blue-200/70 text-blue-800 px-1.5 py-0.5 rounded-full">
            {selectedRadius ? `${selectedRadius} km` : 'All Lucknow'}
          </span>
          <span className="text-blue-700 underline text-[11px] ml-1">Change</span>
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clinic name, locality (Gomti Nagar, Hazratganj), or services in Lucknow..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          Search
        </button>
      </form>

      {/* Clinics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs animate-pulse h-48" />
          ))}
        </div>
      ) : processedClinics.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Building2 size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-800">No clinics found matching your search</p>
          <p className="text-xs text-slate-500 mt-1">Try searching another locality in Lucknow.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {processedClinics.map((clinic) => {
            const distStr = formatDistance(clinic.latitude, clinic.longitude);
            return (
              <div
                key={clinic.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-colors p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div
                        onClick={() => navigate(`/clinics/${clinic.id}`)}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{clinic.name}</h3>
                        {clinic.isVerified && (
                          <span title="UP State Registered Healthcare Facility">
                            <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Reg. #{clinic.registrationNo}
                      </p>
                    </div>
                    <RatingStars rating={clinic.rating} showScore reviewCount={clinic.reviewCount} />
                  </div>

                  {distStr && (
                    <div className="mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-xs font-bold inline-flex items-center gap-1">
                        <MapPin size={11} className="text-blue-600" />
                        {distStr} • {clinic.area || clinic.city}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-600 my-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span>{clinic.address}, {clinic.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400 shrink-0" />
                      <span>Operating Hours: {clinic.openingTime} - {clinic.closingTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span>{clinic.phone} • {clinic.email}</span>
                    </div>
                  </div>

                  {/* Services Pills */}
                  {clinic.services && clinic.services.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Available Clinical Specialties
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {clinic.services.map((srv, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                            {srv}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    Integrated with MediLink Live OPD Token System
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/clinics/${clinic.id}`)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      View Clinic
                    </button>
                    <button
                      onClick={() => navigate(`/doctors?search=${encodeURIComponent(clinic.name)}`)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
                    >
                      <span>View Doctors</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
};
