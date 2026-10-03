import React, { useState } from 'react';
import {
  Activity,
  Search,
  Stethoscope,
  TestTube2,
  Clock,
  Sparkles,
  ShieldCheck,
  Building2,
  Users,
  ArrowRight,
  CheckCircle2,
  Star,
  ChevronRight,
  MapPin,
  Calendar,
  Navigation
} from 'lucide-react';
import { useLocation, PRESET_LOCAL_AREAS } from '../../contexts/LocationContext.js';
import { LocationPickerModal } from '../../components/common/LocationPickerModal.js';

interface LandingPageProps {
  navigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { currentLocation, setArea, selectedRadius } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'DOCTORS' | 'TESTS'>('DOCTORS');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchType === 'DOCTORS') {
      navigate(`/doctors?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/diagnostic-tests?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-white via-blue-50/20 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold mb-6">
              <Sparkles size={14} className="text-blue-600" />
              <span>Lucknow's First AI-Powered Healthcare Marketplace & Live OPD Queue</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Seamless Consultations, Transparent Testing,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Zero Waiting.
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Book specialist consultations across Gomti Nagar, Hazratganj, and Aliganj. Compare NABL accredited diagnostic tests with home phlebotomy in Lucknow and analyze previous reports with AI.
            </p>

            {/* Universal Search Card */}
            <div className="mt-8 bg-white p-3 sm:p-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 max-w-2xl mx-auto">
              <div className="flex border-b border-slate-100 mb-2 px-1">
                <button
                  type="button"
                  onClick={() => setSearchType('DOCTORS')}
                  className={`flex-1 py-2 px-2 sm:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    searchType === 'DOCTORS'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Stethoscope size={14} className="shrink-0" />
                  <span className="truncate">Find Doctors</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('TESTS')}
                  className={`flex-1 py-2 px-2 sm:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    searchType === 'TESTS'
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TestTube2 size={14} className="shrink-0" />
                  <span className="truncate">Compare Lab Tests</span>
                </button>
              </div>

              {/* Active Location Indicator inside search box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 bg-blue-50/60 rounded-xl mb-2 text-xs text-blue-900 gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin size={13} className="text-blue-600 shrink-0" />
                  <span className="font-semibold truncate">
                    Searching near: <strong>{currentLocation.areaName}, Lucknow</strong>
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-bold shrink-0">
                    {selectedRadius ? `${selectedRadius} km` : 'All'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="text-blue-700 font-bold hover:underline shrink-0 text-[11px] cursor-pointer self-end sm:self-auto"
                >
                  Change Area
                </button>
              </div>

              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      searchType === 'DOCTORS'
                        ? 'Search doctor, specialty (e.g., Cardiology) in Lucknow...'
                        : 'Search diagnostic tests (e.g., Lipid Profile, HbA1c, Thyroid)...'
                    }
                    className="w-full pl-10 pr-4 py-2.5 text-xs text-slate-800 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>Search</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            </div>

            {/* Quick pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">Popular in Lucknow:</span>
              <button
                onClick={() => navigate('/doctors?specialty=Cardiology')}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-full transition-colors cursor-pointer"
              >
                Cardiology
              </button>
              <button
                onClick={() => navigate('/diagnostic-tests?category=Cardiology')}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-full transition-colors cursor-pointer"
              >
                Lipid Profile (₹499)
              </button>
              <button
                onClick={() => navigate('/doctors?specialty=Endocrinology')}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-full transition-colors cursor-pointer"
              >
                Diabetes & Thyroid
              </button>
              <button
                onClick={() => navigate('/diagnostic-tests?category=Diabetes')}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-full transition-colors cursor-pointer"
              >
                HbA1c Sugar (₹399)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Metrics Section */}
      <section className="py-8 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 text-center">
            <div className="p-3 sm:p-4 rounded-xl bg-slate-50/50 sm:bg-transparent">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">100%</p>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-1">NMC Verified Doctors</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-slate-50/50 sm:bg-transparent md:border-l md:border-slate-100">
              <p className="text-2xl sm:text-3xl font-black text-blue-600">Live</p>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-1">Lucknow OPD Queue & ETA</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-slate-50/50 sm:bg-transparent md:border-l md:border-slate-100">
              <p className="text-2xl sm:text-3xl font-black text-teal-600">6 - 12h</p>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-1">NABL Diagnostic TAT</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-slate-50/50 sm:bg-transparent md:border-l md:border-slate-100">
              <p className="text-2xl sm:text-3xl font-black text-indigo-600">Free</p>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-1">Home Sample Pickup</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
              Next-Gen Healthcare In Lucknow
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Everything Connected In One Single Platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Live Queues */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Clock size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Real-Time OPD Queue Management</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                No more waiting in crowded Lucknow clinics. Track live token numbers and estimated doctor consultation times on your mobile.
              </p>
              <button
                onClick={() => navigate('/doctors')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Find Doctors with Live Tokens</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Card 2: Diagnostic Comparison */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <TestTube2 size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Transparent Diagnostic Pricing (₹)</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Compare test prices side-by-side across NABL certified pathology laboratories in Lucknow. Book certified phlebotomists directly to your doorstep.
              </p>
              <button
                onClick={() => navigate('/diagnostic-tests')}
                className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Compare Lab Tests in Lucknow</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Card 3: AI Report Assistant */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Sparkles size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">AI Medical Report Assistant</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Upload your previous diagnostic reports or pathology PDFs to extract values, identify out-of-range markers, and match with Lucknow specialists.
              </p>
              <button
                onClick={() => navigate('/patient/reports')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Try Report Assistant</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Lucknow Localities Quick Browse Showcase */}
      <section className="py-14 bg-gradient-to-br from-slate-900 to-blue-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Local Area Proximity Network
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Healthcare Across Major Lucknow Hubs
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Select your locality to immediately discover verified doctors and certified pathology laboratories near you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRESET_LOCAL_AREAS.slice(0, 4).map((area) => (
              <div
                key={area.id}
                className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      PIN {area.pincode}
                    </span>
                    <MapPin size={15} className="text-teal-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{area.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {area.description}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setArea(area);
                    navigate('/doctors');
                  }}
                  className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>Explore Providers</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setShowLocationModal(true)}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Navigation size={14} className="text-emerald-400" />
              <span>Change or Detect Location with GPS</span>
            </button>
          </div>
        </div>
      </section>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
};
