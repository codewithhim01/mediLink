import React, { useState, useEffect } from 'react';
import { Clock, Users, Building2, Stethoscope, Search, MapPin, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.js';
import { Doctor } from '../../types/index.js';
import { LiveQueueCard } from '../../components/queue/LiveQueueCard.js';
import { useLocation } from '../../contexts/LocationContext.js';

export const ClinicQueuesPage: React.FC = () => {
  const { selectedCity } = useLocation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('ALL');

  const fetchDoctors = () => {
    setLoading(true);
    api.getDoctors().then(res => {
      if (res.success && res.data) setDoctors(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(search.toLowerCase()) ||
      (doc.clinicName || '').toLowerCase().includes(search.toLowerCase());

    const docCity = doc.city || doc.clinicCity || '';
    const matchesCity = cityFilter === 'ALL' || docCity.toLowerCase().includes(cityFilter.toLowerCase());

    return matchesSearch && matchesCity;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Multi-Wing OPD Queue Monitor</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synced
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time patient flow across outpatient consultation rooms. Displays live serving tokens and waiting rosters.
          </p>
        </div>

        <button
          onClick={fetchDoctors}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <RefreshCw size={14} />
          <span>Refresh All Rooms</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by physician name, specialty, or clinic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-slate-400 shrink-0" />
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Cities ({doctors.length})</option>
            <option value="Lucknow">Lucknow</option>
            <option value="Delhi">Delhi NCR</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Bengaluru">Bengaluru</option>
          </select>
        </div>
      </div>

      {/* Grid of Live Queues */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          No active physician consultation rooms match your filter. Try selecting "All Cities" or clearing the search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDoctors.map(doc => (
            <div key={doc.id} className="space-y-2">
              <LiveQueueCard
                doctorId={doc.id}
                doctorName={doc.name}
                specialty={doc.specialty}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
