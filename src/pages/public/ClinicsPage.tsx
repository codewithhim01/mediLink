import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building2, MapPin, Phone, Clock, ShieldCheck, ArrowRight, Navigation, ArrowUpDown, RotateCcw } from 'lucide-react';
import { api } from '../../services/api.js';
import { Clinic } from '../../types/index.js';
import { RatingStars } from '../../components/common/RatingStars.js';
import { useLocation, SUPPORTED_CITIES } from '../../contexts/LocationContext.js';
import { LocationPickerModal } from '../../components/common/LocationPickerModal.js';

interface ClinicsPageProps {
  navigate: (path: string) => void;
}

export const ClinicsPage: React.FC<ClinicsPageProps> = ({ navigate }) => {
  const { currentLocation, selectedRadius, formatDistance, calculateDistance } = useLocation();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (cityFilter) params.city = cityFilter;

      const res = await api.getClinics(params);
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
  }, [cityFilter]);

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

  const activeDisplayCity = cityFilter || currentLocation.city || 'Your Region';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Partner Health Centres & Polyclinics in {activeDisplayCity}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">
            Multispecialty outpatient medical centers with integrated diagnostic phlebotomy and live OPD queue screens.
          </p>
        </div>

        {/* Location Indicator */}
        <button
          onClick={() => setShowLocationModal(true)}
          className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0 self-stretch sm:self-auto justify-center"
        >
          <MapPin size={14} className="text-blue-600 shrink-0" />
          <span className="truncate max-w-[150px] sm:max-w-[200px]">Near {currentLocation.areaName}</span>
          <span className="text-[10px] bg-blue-200/70 text-blue-800 px-1.5 py-0.5 rounded-full shrink-0">
            {selectedRadius ? `${selectedRadius} km` : 'All'}
          </span>
          <span className="text-blue-700 underline text-[11px] ml-1 shrink-0">Change</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search clinic name, locality, or services in ${activeDisplayCity}...`}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 text-center"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium text-[11px]">Filter by Region:</span>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white cursor-pointer"
          >
            <option value="">All Regions / Auto Proximity</option>
            {SUPPORTED_CITIES.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {cityFilter && (
            <button
              onClick={() => setCityFilter('')}
              className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer flex items-center gap-1 ml-auto"
            >
              <RotateCcw size={12} />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Clinics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs animate-pulse h-48" />
          ))}
        </div>
      ) : processedClinics.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Building2 size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-800">No polyclinics found matching your search</p>
          <p className="text-xs text-slate-500 mt-1">Try selecting All Regions or searching for another locality.</p>
          <button
            onClick={() => { setCityFilter(''); setSearch(''); }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-xs"
          >
            View All Clinics Nationwide
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {processedClinics.map((clinic) => {
            const distStr = formatDistance(clinic.latitude, clinic.longitude);
            return (
              <div
                key={clinic.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition-all p-4 sm:p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0">
                      <div
                        onClick={() => navigate(`/clinics/${clinic.id}`)}
                        className="flex items-center gap-1.5 cursor-pointer group"
                      >
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {clinic.name}
                        </h3>
                        {clinic.isVerified && (
                          <span title="Verified Healthcare Facility">
                            <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        Reg. #{clinic.registrationNo} • {clinic.city}
                      </p>
                    </div>
                    <RatingStars rating={clinic.rating} showScore reviewCount={clinic.reviewCount} />
                  </div>

                  {/* Proximity Pill */}
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold">
                      <MapPin size={11} className="text-blue-600" />
                      <span>{distStr ? distStr : clinic.city}</span>
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{clinic.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-700">{clinic.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400 shrink-0" />
                      <span>OPD Hours: {clinic.openingTime} - {clinic.closingTime}</span>
                    </div>
                  </div>

                  {/* Services tags */}
                  {clinic.services && clinic.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {clinic.services.slice(0, 3).map((srv, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium">
                          {srv}
                        </span>
                      ))}
                      {clinic.services.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
                          +{clinic.services.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Token OPD
                  </span>
                  <button
                    onClick={() => navigate(`/clinics/${clinic.id}`)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    <span>View Doctors</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
};
