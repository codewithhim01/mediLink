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
  Navigation,
  Globe
} from 'lucide-react';
import { useLocation, PRESET_LOCAL_AREAS, SUPPORTED_CITIES } from '../../contexts/LocationContext.js';
import { LocationPickerModal } from '../../components/common/LocationPickerModal.js';

interface LandingPageProps {
  navigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { currentLocation, setArea, setCity, selectedRadius } = useLocation();
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

  // Localities belonging to the current city or diverse major hubs
  const cityLocalities = PRESET_LOCAL_AREAS.filter(
    (a) => a.city.toLowerCase() === (currentLocation.city || 'Delhi NCR').toLowerCase()
  );
  const displayLocalities = cityLocalities.length > 0 ? cityLocalities : PRESET_LOCAL_AREAS.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-12 pb-16 sm:pb-20 bg-gradient-to-b from-white via-blue-50/20 to-slate-50 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            {/* Dynamic City Health Hub Tag */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-[11px] sm:text-xs font-bold mb-4 sm:mb-6 max-w-full truncate">
              <Sparkles size={14} className="text-blue-600 shrink-0" />
              <span className="truncate">
                AI-Powered Healthcare & Live OPD Queues in {currentLocation.city || 'Your City'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] break-words">
              Seamless Consultations, Transparent Testing,{' '}
              <span className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Zero Waiting.
              </span>
            </h1>

            <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto px-2">
              Book verified specialist consultations across {currentLocation.areaName || currentLocation.city || 'your area'}. Compare NABL accredited diagnostic tests with doorstep phlebotomy and analyze medical reports with AI.
            </p>

            {/* Universal Search Card */}
            <div className="mt-6 sm:mt-8 bg-white p-3 sm:p-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 max-w-2xl mx-auto text-left">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 bg-blue-50/60 rounded-xl mb-2.5 text-xs text-blue-900 gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin size={13} className="text-blue-600 shrink-0" />
                  <span className="font-semibold truncate">
                    Near: <strong>{currentLocation.areaName}, {currentLocation.city}</strong>
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
                  Change Location
                </button>
              </div>

              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      searchType === 'DOCTORS'
                        ? `Search doctor, specialty (Cardiology, Ortho) in ${currentLocation.city}...`
                        : 'Search diagnostic tests (Lipid Profile, HbA1c, CBC, Thyroid)...'
                    }
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>Search</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            </div>

            {/* Quick city tags */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs text-slate-500 px-2">
              <span className="font-semibold text-slate-400 text-[11px]">Popular Hubs:</span>
              {SUPPORTED_CITIES.slice(0, 5).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCity(c.name)}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                    currentLocation.city.toLowerCase() === c.name.toLowerCase()
                      ? 'bg-blue-100 text-blue-900 border-blue-300 font-bold'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Unified Platform Features */}
      <section className="py-12 sm:py-16 bg-white px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-1">
              Integrated Healthcare Experience
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Everything Connected In One Single Platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Card 1: Live Queues */}
            <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <Clock size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Real-Time OPD Queue Tracking</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  No more waiting in crowded waiting rooms. Track live token numbers and estimated doctor consultation times straight on your mobile.
                </p>
              </div>
              <button
                onClick={() => navigate('/doctors')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Find Doctors with Live Tokens</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Card 2: Diagnostic Comparison */}
            <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-4">
                  <TestTube2 size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Transparent Diagnostic Pricing (₹)</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Compare test prices side-by-side across NABL certified pathology laboratories. Book certified phlebotomists directly to your doorstep.
                </p>
              </div>
              <button
                onClick={() => navigate('/diagnostic-tests')}
                className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Compare Lab Tests Near You</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Card 3: AI Report Assistant */}
            <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">AI Medical Report Assistant</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Upload your previous diagnostic reports or pathology PDFs to extract values, identify out-of-range markers, and match with verified specialists.
                </p>
              </div>
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

      {/* Dynamic Localities Showcase */}
      <section className="py-12 sm:py-14 bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Local Healthcare Network
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Top Medical Hubs in {currentLocation.city || 'Your Region'}
            </h2>
            <p className="text-xs text-slate-400 mt-2 px-2">
              Select your locality to immediately discover verified doctors and certified pathology laboratories near you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {displayLocalities.slice(0, 4).map((area) => (
              <div
                key={area.id}
                className="p-4 sm:p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {area.pincode ? `PIN ${area.pincode}` : area.city}
                    </span>
                    <MapPin size={15} className="text-teal-400 shrink-0" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{area.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {area.description}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setArea(area);
                    navigate('/doctors');
                  }}
                  className="mt-4 w-full py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>Explore Providers</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setShowLocationModal(true)}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Globe size={14} className="text-teal-300" />
              <span>Switch City / Locality</span>
            </button>
            <button
              onClick={() => setShowLocationModal(true)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2 shadow-sm shadow-teal-500/20"
            >
              <Navigation size={14} />
              <span>Detect Device GPS</span>
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
