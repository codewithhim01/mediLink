import React, { useState, useEffect } from 'react';
import { Search, Building2, MapPin, Phone, ShieldCheck, Clock, Home, TestTube2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api.js';
import { Laboratory } from '../../types/index.js';
import { RatingStars } from '../../components/common/RatingStars.js';

interface LabDiscoveryPageProps {
  navigate: (path: string) => void;
}

export const LabDiscoveryPage: React.FC<LabDiscoveryPageProps> = ({ navigate }) => {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Certified Diagnostic Laboratories
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Accredited pathology laboratories providing clinical testing, digital report delivery, and home phlebotomy.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search laboratory name, city, or accreditation..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Lab Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map(n => (
            <div key={n} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {laboratories.map(lab => (
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
                        <span title="CLIA Verified Facility">
                          <ShieldCheck size={16} className="text-teal-600 shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-teal-700 mt-0.5">
                      {lab.accreditation || 'CLIA / CAP Accredited Diagnostic Facility'}
                    </p>
                  </div>
                  <div className="text-right">
                    <RatingStars rating={lab.rating} showScore reviewCount={lab.reviewCount} />
                  </div>
                </div>

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
                      <span>Certified Home Phlebotomy Draw Available</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  {lab.testCount || 5} tests from ${lab.minTestPrice || 35}
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
          ))}
        </div>
      )}
    </div>
  );
};
