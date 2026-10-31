import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, TestTube2, Clock, Home, Building2, ArrowUpDown, CheckCircle2, ShieldCheck, MapPin, Navigation, RotateCcw } from 'lucide-react';
import { api } from '../../services/api.js';
import { DiagnosticTest } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { BookTestModal } from '../../components/patient/BookTestModal.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useLocation, SUPPORTED_CITIES } from '../../contexts/LocationContext.js';
import { LocationPickerModal } from '../../components/common/LocationPickerModal.js';

interface TestComparisonPageProps {
  navigate: (path: string) => void;
  initialSearch?: string;
  initialCategory?: string;
}

export const TestComparisonPage: React.FC<TestComparisonPageProps> = ({
  navigate,
  initialSearch = '',
  initialCategory = '',
}) => {
  const { isAuthenticated } = useAuth();
  const { currentLocation, selectedRadius, formatDistance, calculateDistance, isWithinRadius } = useLocation();
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [cityFilter, setCityFilter] = useState('');
  const [maxTAT, setMaxTAT] = useState<number | ''>('');
  const [sort, setSort] = useState<string>('price_asc');
  const [filterByRadius, setFilterByRadius] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Booking modal
  const [selectedTest, setSelectedTest] = useState<DiagnosticTest | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (cityFilter) params.city = cityFilter;
      if (maxTAT) params.maxTAT = maxTAT;

      const res = await api.getDiagnosticTests(params);
      if (res.success && res.data) {
        setTests(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [category, cityFilter, maxTAT]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTests();
  };

  const handleBookTest = (test: DiagnosticTest) => {
    setSelectedTest(test);
    setIsBookModalOpen(true);
  };

  const categories = [
    'All Categories',
    'Cardiology & Lipidology',
    'Biochemistry & Renal/Hepatic',
    'Endocrinology & Diabetes',
    'Endocrinology & Thyroid',
    'Hematology'
  ];

  // Dynamic sorting and location processing
  const processedTests = useMemo(() => {
    let result = [...tests];

    if (filterByRadius && selectedRadius !== null && !cityFilter) {
      const within = result.filter(t => isWithinRadius(t.latitude, t.longitude));
      if (within.length > 0) {
        result = within;
      }
    }

    result.sort((a, b) => {
      const priceA = a.discountPrice ?? a.price;
      const priceB = b.discountPrice ?? b.price;

      if (sort === 'nearest') {
        const distA = calculateDistance(a.latitude, a.longitude) ?? 9999;
        const distB = calculateDistance(b.latitude, b.longitude) ?? 9999;
        return distA - distB;
      }
      if (sort === 'price_asc') {
        return priceA - priceB;
      }
      if (sort === 'price_desc') {
        return priceB - priceA;
      }
      if (sort === 'tat_asc') {
        return a.turnaroundHours - b.turnaroundHours;
      }
      if (sort === 'rating_desc') {
        return (b.laboratoryRating || 0) - (a.laboratoryRating || 0);
      }
      return 0;
    });

    return result;
  }, [tests, filterByRadius, selectedRadius, sort, currentLocation, cityFilter]);

  const activeDisplayCity = cityFilter || currentLocation.city || 'Your Region';

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Diagnostic Pathology Tests in {activeDisplayCity}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">
            Compare tests side-by-side across NABL & ICMR accredited laboratories with transparent pricing in Rupees (₹).
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

      {successNotice && (
        <div className="p-3 sm:p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Location Banner */}
      <div className="p-3 sm:p-3.5 bg-gradient-to-r from-teal-50/90 via-slate-50 to-blue-50/70 border border-teal-100 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck size={16} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate">
              NABL Certified Labs near{' '}
              <span className="text-teal-700">
                {currentLocation.areaName}, {currentLocation.city}
              </span>
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              Home phlebotomy blood draw available across {currentLocation.city}. Standard reports delivered in 6 to 12 hours.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowLocationModal(true)}
          className="text-xs text-teal-700 font-bold hover:underline cursor-pointer shrink-0 self-end md:self-auto"
        >
          Switch Locality / Distance
        </button>
      </div>

      {/* Search & Filter Card */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search diagnostic test (e.g. Lipid Profile, HbA1c, Thyroid, CBC, KFT)..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center shrink-0"
          >
            Search Tests
          </button>
        </form>

        {/* Filter & Sorting Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full lg:w-auto p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white cursor-pointer"
          >
            <option value="">Region: {currentLocation.city}</option>
            {SUPPORTED_CITIES.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value === 'All Categories' ? '' : e.target.value)}
            className="w-full lg:w-auto p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c === 'All Categories' ? '' : c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={maxTAT}
            onChange={(e) => setMaxTAT(e.target.value ? Number(e.target.value) : '')}
            className="w-full lg:w-auto p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white cursor-pointer"
          >
            <option value="">Max TAT: Any</option>
            <option value="8">Under 8 Hours</option>
            <option value="12">Under 12 Hours</option>
            <option value="24">Under 24 Hours</option>
          </select>

          <div className="flex items-center gap-1.5 w-full lg:w-auto lg:ml-auto col-span-2 sm:col-span-1">
            <ArrowUpDown size={13} className="text-slate-400 shrink-0" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full lg:w-auto p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-teal-900 focus:bg-white cursor-pointer"
            >
              <option value="nearest">Nearest Lab to Me (km)</option>
              <option value="price_asc">Price: Low to High (₹)</option>
              <option value="price_desc">Price: High to Low (₹)</option>
              <option value="tat_asc">Fastest Turnaround (TAT)</option>
              <option value="rating_desc">Highest Rated Lab</option>
            </select>
          </div>

          {(category || cityFilter || maxTAT || search) && (
            <button
              onClick={() => { setCategory(''); setCityFilter(''); setMaxTAT(''); setSearch(''); }}
              className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer col-span-2 sm:col-span-1 text-center lg:text-left py-1 flex items-center justify-center gap-1"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Test Comparison Cards */}
      {loading ? (
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs animate-pulse h-32" />
          ))}
        </div>
      ) : processedTests.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200">
          <TestTube2 size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-800">
            No diagnostic tests match your query in {activeDisplayCity}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Try resetting filters or viewing all diagnostic tests nationwide.
          </p>
          <button
            onClick={() => { setCategory(''); setCityFilter(''); setMaxTAT(''); setSearch(''); }}
            className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 cursor-pointer shadow-xs"
          >
            Show All Tests Nationwide
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {processedTests.map((test) => {
            const effectivePrice =
              test.discountPrice !== undefined && test.discountPrice !== null
                ? test.discountPrice
                : test.price;
            const hasDiscount =
              test.discountPrice !== undefined &&
              test.discountPrice !== null &&
              test.discountPrice < test.price;
            const distStr = formatDistance(test.latitude, test.longitude);

            return (
              <div
                key={test.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-200 hover:shadow-md transition-all p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5"
              >
                {/* Test Info */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      {test.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Code: {test.code}
                    </span>
                    {distStr && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold flex items-center gap-1">
                        <MapPin size={10} className="text-blue-600" />
                        {distStr}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {test.name}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed max-w-2xl line-clamp-2">
                    {test.description ||
                      'Comprehensive clinical laboratory investigation for baseline physiological biomarkers.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1 text-slate-700 font-medium truncate">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{test.laboratoryName}</span>
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-blue-700 shrink-0">
                      <Clock size={13} />
                      {test.turnaroundHours}h Report
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 shrink-0">
                      <TestTube2 size={13} className="text-slate-400" />
                      Sample: {test.sampleType}
                    </span>
                    {test.homeCollectionAvailable && (
                      <span className="flex items-center gap-1 text-emerald-700 font-medium shrink-0">
                        <Home size={13} />
                        Home Phlebotomy
                      </span>
                    )}
                  </div>
                </div>

                {/* Price & Booking CTA */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left md:text-right">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg sm:text-xl font-black text-slate-900">
                        ₹{effectivePrice}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{test.price}
                        </span>
                      )}
                    </div>
                    {hasDiscount && (
                      <span className="text-[10px] font-bold text-emerald-600">
                        Save ₹{test.price - (test.discountPrice ?? 0)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleBookTest(test)}
                    className="px-5 py-2 sm:py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-teal-500/20 cursor-pointer whitespace-nowrap"
                  >
                    Book Diagnostic Test
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {selectedTest && (
        <BookTestModal
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          test={selectedTest}
          onSuccess={() => {
            setSuccessNotice('Diagnostic test booking requested! Phlebotomist will contact for confirmation.');
            setTimeout(() => setSuccessNotice(null), 5000);
          }}
        />
      )}

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
};
