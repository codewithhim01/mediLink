import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building2, MapPin, Phone, ShieldCheck, Clock, Home, ArrowRight, Navigation } from 'lucide-react';
import { api } from '../../services/api.js';
import { Laboratory } from '../../types/index.js';
import { RatingStars } from '../../components/common/RatingStars.js';
import { useLocation } from '../../contexts/LocationContext.js';
import { LocationPickerModal } from '../../components/common/LocationPickerModal.js';

interface LabDiscoveryPageProps {
  navigate: (path: string) => void;
}

export const LabDiscoveryPage: React.FC<LabDiscoveryPageProps> = ({ navigate }) => {
  const { currentLocation, selectedRadius, formatDistance, calculateDistance } = useLocation();
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const fetchLabs = async () => {
    setLoading(true);
    try {
      const res = await api.getLaboratories(search ? { search } : undefined);
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
  }, []);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            NABL Certified Pathology Laboratories in Lucknow
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Accredited diagnostic centers providing clinical testing, digital report delivery, and home phlebotomy across Lucknow.
          </p>
        </div>

        {/* Location Indicator */}
        <button
          onClick={() => setShowLocationModal(true)}
          className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs shrink-0"
        >
          <MapPin size={15} className="text-teal-600 shrink-0" />
          <span>Near {currentLocation.areaName}</span>
          <span className="text-[10px] bg-teal-200/70 text-teal-800 px-1.5 py-0.5 rounded-full">
            {selectedRadius ? `${selectedRadius} km` : 'All Lucknow'}
          </span>
          <span className="text-teal-700 underline text-[11px] ml-1">Change</span>
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
            placeholder="Search laboratory name, area (Gomti Nagar, Hazratganj), or accreditation in Lucknow..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          Search
        </button>
      </form>

      {/* Lab Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs animate-pulse h-48" />
          ))}
        </div>
      ) : processedLabs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Building2 size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-800">No laboratories found matching your criteria</p>
          <p className="text-xs text-slate-500 mt-1">Try searching for Gomti Nagar or Hazratganj.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {processedLabs.map((lab) => {
            const distStr = formatDistance(lab.latitude, lab.longitude);
            return (
              <div
                key={lab.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition-colors p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div
                        onClick={() => navigate(`/laboratories/${lab.id}`)}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors">{lab.name}</h3>
                        {lab.isVerified && (
                          <span title="NABL & ICMR Verified Facility">
                            <ShieldCheck size={16} className="text-teal-600 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-teal-700 mt-0.5">
                        {lab.accreditation || 'NABL & ICMR Accredited Diagnostic Reference Lab'}
                      </p>
                    </div>
                    <div className="text-right">
                      <RatingStars rating={lab.rating} showScore reviewCount={lab.reviewCount} />
                    </div>
                  </div>

                  {distStr && (
                    <div className="mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold inline-flex items-center gap-1">
                        <MapPin size={11} className="text-teal-600" />
                        {distStr} • {lab.area || lab.city}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-600 my-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span>{lab.address}, {lab.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400 shrink-0" />
                      <span>Turnaround Guarantee: <strong>{lab.turnaroundTimeNote}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span>{lab.phone} • {lab.email}</span>
                    </div>
                    {lab.homeCollectionAvailable && (
                      <div className="flex items-center gap-2 text-emerald-700 font-semibold pt-1">
                        <Home size={14} />
                        <span>Certified Home Phlebotomy Draw Available Across Lucknow</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    {lab.testCount || 6} tests from ₹{lab.minTestPrice || 299}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/laboratories/${lab.id}`)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      View Facility
                    </button>
                    <button
                      onClick={() => navigate(`/diagnostic-tests?search=${encodeURIComponent(lab.name)}`)}
                      className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-teal-500/20"
                    >
                      <span>Browse Tests</span>
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
