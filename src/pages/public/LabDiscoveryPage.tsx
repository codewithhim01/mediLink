import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building2, MapPin, Phone, ShieldCheck, Clock, Home, ArrowRight, Navigation, RotateCcw } from 'lucide-react';
import { api } from '../../services/api.js';
import { Laboratory } from '../../types/index.js';
import { RatingStars } from '../../components/common/RatingStars.js';
import { useLocation, SUPPORTED_CITIES } from '../../contexts/LocationContext.js';
import { LocationPickerModal } from '../../components/common/LocationPickerModal.js';

interface LabDiscoveryPageProps {
  navigate: (path: string) => void;
}

export const LabDiscoveryPage: React.FC<LabDiscoveryPageProps> = ({ navigate }) => {
  const { currentLocation, selectedRadius, formatDistance, calculateDistance } = useLocation();
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const fetchLabs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (cityFilter) params.city = cityFilter;

      const res = await api.getLaboratories(params);
      if (res.success && res.data) {
        setLaboratories(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, [cityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLabs();
  };

  const processedLabs = useMemo(() => {
    const list = [...laboratories];
    list.sort((a, b) => {
      const distA = calculateDistance(a.latitude, a.longitude) ?? 9999;
      const distB = calculateDistance(b.latitude, b.longitude) ?? 9999;
      return distA - distB;
    });
    return list;
  }, [laboratories, currentLocation]);

  const activeDisplayCity = cityFilter || currentLocation.city || 'Your Region';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            NABL Certified Pathology Laboratories in {activeDisplayCity}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">
            Accredited diagnostic centers providing clinical testing, digital report delivery, and home phlebotomy.
          </p>
        </div>

        {/* Location Indicator */}
        <button
          onClick={() => setShowLocationModal(true)}
          className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0 self-stretch sm:self-auto justify-center"
        >
          <MapPin size={14} className="text-teal-600 shrink-0" />
          <span className="truncate max-w-[150px] sm:max-w-[200px]">Near {currentLocation.areaName}</span>
          <span className="text-[10px] bg-teal-200/70 text-teal-800 px-1.5 py-0.5 rounded-full shrink-0">
            {selectedRadius ? `${selectedRadius} km` : 'All'}
          </span>
          <span className="text-teal-700 underline text-[11px] ml-1 shrink-0">Change</span>
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
              placeholder={`Search laboratory name, area, or accreditation in ${activeDisplayCity}...`}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 text-center"
          >
            Search Labs
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

      {/* Lab Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs animate-pulse h-48" />
          ))}
        </div>
      ) : processedLabs.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Building2 size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-800">No laboratories found matching your criteria</p>
          <p className="text-xs text-slate-500 mt-1">Try switching to All Regions or searching for another area.</p>
          <button
            onClick={() => { setCityFilter(''); setSearch(''); }}
            className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 cursor-pointer shadow-xs"
          >
            View All Laboratories Nationwide
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {processedLabs.map((lab) => {
            const distStr = formatDistance(lab.latitude, lab.longitude);
            return (
              <div
                key={lab.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 hover:shadow-md transition-all p-4 sm:p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0">
                      <div
                        onClick={() => navigate(`/laboratories/${lab.id}`)}
                        className="flex items-center gap-1.5 cursor-pointer group"
                      >
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors truncate">
                          {lab.name}
                        </h3>
                        {lab.isVerified && (
                          <span title="NABL & ICMR Verified Facility">
                            <ShieldCheck size={16} className="text-teal-600 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-teal-700 mt-0.5 truncate">
                        {lab.accreditation || 'NABL & ICMR Accredited Diagnostic Reference Lab'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <RatingStars rating={lab.rating} showScore reviewCount={lab.reviewCount} />
                    </div>
                  </div>

                  {/* Proximity Pill */}
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold">
                      <MapPin size={11} className="text-teal-600" />
                      <span>{distStr ? distStr : lab.city}</span>
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{lab.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-700">{lab.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400 shrink-0" />
                      <span>TAT: {lab.turnaroundTimeNote || 'Same-Day Digital Delivery'}</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {lab.homeCollectionAvailable && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <Home size={10} /> Home Phlebotomy
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded-md">
                      Digital Report Delivery
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    {lab.testCount ? `${lab.testCount}+ Clinical Tests` : 'Comprehensive Pathology'}
                  </span>
                  <button
                    onClick={() => navigate(`/laboratories/${lab.id}`)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800 cursor-pointer"
                  >
                    <span>View Test Menu</span>
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
