import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, TestTube2, Clock, Home, Building2, ArrowUpDown, CheckCircle2, ShieldCheck, MapPin, Navigation } from 'lucide-react';
import { api } from '../../services/api.js';
import { DiagnosticTest } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { BookTestModal } from '../../components/patient/BookTestModal.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useLocation } from '../../contexts/LocationContext.js';
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
  }, [category, maxTAT]);

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

    if (filterByRadius && selectedRadius !== null) {
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
  }, [tests, filterByRadius, selectedRadius, sort, currentLocation]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Diagnostic Pathology Tests in Lucknow
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compare tests side-by-side across NABL & ICMR accredited laboratories in Lucknow with transparent pricing in Rupees (₹).
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

      {successNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Lucknow Location Banner */}
      <div className="p-3.5 bg-gradient-to-r from-teal-50/90 via-slate-50 to-blue-50/70 border border-teal-100 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck size={16} />
          </div>
          <div>
            <p className="font-bold text-slate-900">
              NABL Certified Labs near <span className="text-teal-700">{currentLocation.areaName}, Lucknow</span>
            </p>
            <p className="text-[11px] text-slate-500">
              Free home phlebotomy blood draw available across Lucknow. Standard reports delivered within 6 to 12 hours.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowLocationModal(true)}
          className="text-xs text-teal-700 font-bold hover:underline cursor-pointer"
        >
          Switch Locality / Distance
        </button>
      </div>

      {/* Search & Filter Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search diagnostic test (e.g. Lipid Profile, HbA1c, Thyroid, CBC, KFT)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Search Tests
          </button>
        </form>

        {/* Filter & Sorting Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-400 flex items-center gap-1">
            <Filter size={13} /> Filters:
          </span>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value === 'All Categories' ? '' : e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={maxTAT}
            onChange={(e) => setMaxTAT(e.target.value ? Number(e.target.value) : '')}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white"
          >
            <option value="">Max Turnaround: Any</option>
            <option value="8">Under 8 Hours</option>
            <option value="12">Under 12 Hours</option>
            <option value="24">Under 24 Hours</option>
          </select>

          <div className="flex items-center gap-1 ml-auto">
            <ArrowUpDown size={13} className="text-slate-400" />
            <span className="font-semibold text-slate-400">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-teal-900 focus:bg-white"
            >
              <option value="nearest">Nearest Lab to Me (km)</option>
              <option value="price_asc">Price: Low to High (₹)</option>
              <option value="price_desc">Price: High to Low (₹)</option>
              <option value="tat_asc">Fastest Turnaround (TAT)</option>
              <option value="rating_desc">Highest Rated Lab</option>
            </select>
          </div>
        </div>
      </div>

      {/* Test Comparison Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs animate-pulse h-32" />
          ))}
        </div>
      ) : processedTests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <TestTube2 size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-800">No diagnostic tests match your query in {currentLocation.areaName}</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting the category filter or searching with different keywords.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {processedTests.map((test) => {
            const effectivePrice = test.discountPrice !== undefined && test.discountPrice !== null ? test.discountPrice : test.price;
            const hasDiscount = test.discountPrice !== undefined && test.discountPrice !== null && test.discountPrice < test.price;
            const distStr = formatDistance(test.latitude, test.longitude);

            return (
              <div
                key={test.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-200 transition-colors p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                {/* Test Info */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
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

                  <h3 className="text-base font-bold text-slate-900">{test.name}</h3>

                  <p className="text-xs text-slate-500 leading-relaxed max-w-2xl line-clamp-2">
                    {test.description || 'Comprehensive clinical laboratory investigation for baseline physiological biomarkers.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <Building2 size={13} className="text-slate-400" />
                      {test.laboratoryName} ({test.laboratoryRating?.toFixed(1)} ⭐)
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-blue-700">
                      <Clock size={13} />
                      {test.turnaroundHours} Hours Digital Report
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <TestTube2 size={13} className="text-slate-400" />
                      Sample: {test.sampleType}
                    </span>
                    {test.homeCollectionAvailable && (
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <Home size={13} />
                        Free Home Sample Collection in Lucknow
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing & Booking Action in INR (₹) */}
                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left md:text-right">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900">₹{effectivePrice}</span>
                      {hasDiscount && (
                        <span className="text-xs line-through text-slate-400 font-medium">
                          ₹{test.price}
                        </span>
                      )}
                    </div>
                    {hasDiscount && (
                      <span className="text-[10px] font-bold text-emerald-600 block">
                        Save ₹{test.price - effectivePrice} (Promotion)
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleBookTest(test)}
                    className="mt-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Book Test</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Test Modal */}
      <BookTestModal
        test={selectedTest}
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={(booking) => {
          setSuccessNotice(`Test booking ${booking.bookingNumber} confirmed! Phlebotomist will contact for collection.`);
        }}
      />

      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
};
