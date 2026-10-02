import React, { useState, useEffect } from 'react';
import { Search, Filter, TestTube2, Clock, Home, Building2, ArrowUpDown, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api.js';
import { DiagnosticTest } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { BookTestModal } from '../../components/patient/BookTestModal.js';
import { useAuth } from '../../contexts/AuthContext.js';

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
  const { isAuthenticated, switchDemoRole } = useAuth();
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [maxTAT, setMaxTAT] = useState<number | ''>('');
  const [sort, setSort] = useState<string>('price_asc');

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
      if (sort) params.sort = sort;

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
  }, [category, maxTAT, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTests();
  };

  const handleBookTest = async (test: DiagnosticTest) => {
    if (!isAuthenticated) {
      await switchDemoRole('PATIENT');
    }
    setSelectedTest(test);
    setIsBookModalOpen(true);
  };

  const categories = [
    'All Categories',
    'Cardiology & Lipidology',
    'Biochemistry & Renal/Hepatic',
    'Endocrinology & Diabetes',
    'Endocrinology & Thyroid',
    'Hematology & Ferritin'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Compare Diagnostic Tests & Pricing
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Directly compare diagnostic panels across CLIA/CAP certified laboratories by turnaround time, cost, and home collection.
        </p>
      </div>

      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => navigate('/patient/lab-bookings')}
            className="text-emerald-700 underline font-bold"
          >
            Track Specimen Status
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tests (e.g. Lipid, HbA1c, CMP, Thyroid) or laboratory name..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={maxTAT}
            onChange={(e) => setMaxTAT(e.target.value ? Number(e.target.value) : '')}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white"
          >
            <option value="">Max Turnaround: Any</option>
            <option value="12">Under 12 Hours</option>
            <option value="24">Under 24 Hours</option>
            <option value="48">Under 48 Hours</option>
          </select>

          <div className="flex items-center gap-1 ml-auto">
            <ArrowUpDown size={13} className="text-slate-400" />
            <span className="font-semibold text-slate-400">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="tat_asc">Fastest Turnaround (TAT)</option>
              <option value="rating_desc">Highest Rated Lab</option>
            </select>
          </div>
        </div>
      </div>

      {/* Test Comparison Table / Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs animate-pulse h-32" />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <TestTube2 size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-800">No diagnostic tests match your query</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting the category filter or searching with different keywords.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map(test => {
            const effectivePrice = test.discountPrice !== undefined && test.discountPrice !== null ? test.discountPrice : test.price;
            const hasDiscount = test.discountPrice !== undefined && test.discountPrice !== null && test.discountPrice < test.price;

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
                      {test.turnaroundHours} Hours TAT Guarantee
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <TestTube2 size={13} className="text-slate-400" />
                      Sample: {test.sampleType}
                    </span>
                    {test.homeCollectionAvailable && (
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <Home size={13} />
                        Home Draw Available
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing & Booking Action */}
                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left md:text-right">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900">${effectivePrice}</span>
                      {hasDiscount && (
                        <span className="text-xs line-through text-slate-400 font-medium">
                          ${test.price}
                        </span>
                      )}
                    </div>
                    {hasDiscount && (
                      <span className="text-[10px] font-bold text-emerald-600 block">
                        Save ${test.price - effectivePrice} (Promotion)
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleBookTest(test)}
                    className="mt-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Book Diagnostic Test</span>
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
          setSuccessNotice(`Test booking ${booking.bookingNumber} confirmed! Sample barcode ${booking.sample?.barcode || 'SMP-BC'} generated.`);
        }}
      />
    </div>
  );
};
