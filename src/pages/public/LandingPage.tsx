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
  Zap,
  Star,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Role } from '../../types/index.js';

interface LandingPageProps {
  navigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { switchDemoRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'DOCTORS' | 'TESTS'>('DOCTORS');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchType === 'DOCTORS') {
      navigate(`/doctors?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/diagnostic-tests?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleQuickDemo = async (role: Role, path: string) => {
    await switchDemoRole(role);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      {/* Network Trust Header */}
      <div className="bg-slate-900 text-white py-2 px-4 text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <ShieldCheck size={14} /> CLIA Certified & HIPAA Compliant Architecture
            </span>
            <span className="text-slate-400 hidden md:inline">• Verified Specialist Doctors, State Clinics & Pathology Labs</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <span className="text-slate-400 text-[11px]">Portal Quick Switch:</span>
            <button
              onClick={() => handleQuickDemo('PATIENT', '/patient/dashboard')}
              className="text-white hover:text-teal-300 font-semibold cursor-pointer hover:underline"
            >
              Patient
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => handleQuickDemo('DOCTOR', '/doctor/dashboard')}
              className="text-white hover:text-blue-300 font-semibold cursor-pointer hover:underline"
            >
              Doctor
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => handleQuickDemo('CLINIC', '/clinic/dashboard')}
              className="text-white hover:text-indigo-300 font-semibold cursor-pointer hover:underline"
            >
              Clinic
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => handleQuickDemo('LABORATORY', '/laboratory/dashboard')}
              className="text-white hover:text-amber-300 font-semibold cursor-pointer hover:underline"
            >
              Laboratory
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => handleQuickDemo('ADMIN', '/admin/dashboard')}
              className="text-white hover:text-rose-300 font-semibold cursor-pointer hover:underline"
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-white via-blue-50/20 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold mb-6">
              <Sparkles size={14} className="text-blue-600" />
              <span>Unified Healthcare & Diagnostic Marketplace with Live Queue</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Seamless Care, Transparent Testing,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Zero Waiting.
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Book specialist consultations, compare certified diagnostic tests with transparent turnaround times, track live clinic queues in real-time, and analyze previous medical reports with AI.
            </p>

            {/* Universal Search Card */}
            <div className="mt-8 bg-white p-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 max-w-2xl mx-auto">
              <div className="flex border-b border-slate-100 mb-2 px-1">
                <button
                  type="button"
                  onClick={() => setSearchType('DOCTORS')}
                  className={`py-2 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    searchType === 'DOCTORS'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Stethoscope size={14} /> Find Doctors & Clinics
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('TESTS')}
                  className={`py-2 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    searchType === 'TESTS'
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TestTube2 size={14} /> Compare Diagnostic Tests
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
                        ? 'Search doctors, specialties (e.g., Cardiology), or clinics...'
                        : 'Search diagnostic tests (e.g., Lipid Panel, HbA1c, Thyroid)...'
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
              <span className="font-semibold text-slate-400">Popular:</span>
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
                Lipid Biomarkers
              </button>
              <button
                onClick={() => navigate('/doctors?specialty=Endocrinology')}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-full transition-colors cursor-pointer"
              >
                Endocrinology
              </button>
              <button
                onClick={() => navigate('/diagnostic-tests?category=Diabetes')}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-full transition-colors cursor-pointer"
              >
                HbA1c & Glucose
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars Stats */}
      <section className="py-8 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <p className="text-3xl font-black text-slate-900">100%</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Verified Medical Providers</p>
            </div>
            <div className="p-4 border-l border-slate-100">
              <p className="text-3xl font-black text-blue-600">Live</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Digital OPD Queue & ETA</p>
            </div>
            <div className="p-4 border-l border-slate-100">
              <p className="text-3xl font-black text-teal-600">&lt; 12h</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Fastest Diagnostic TAT</p>
            </div>
            <div className="p-4 border-l border-slate-100">
              <p className="text-3xl font-black text-indigo-600">AI-Assisted</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Report Extraction & Navigation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
              Next-Gen Ecosystem
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
              <h3 className="text-base font-bold text-slate-900 mb-2">Real-Time Queue Management</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                No more crowded waiting rooms. Patients track live tokens and dynamic delay times right from their phone without refreshing.
              </p>
              <button
                onClick={() => navigate('/doctors')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View Doctors with Live Queues</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Card 2: Diagnostic Comparison */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <TestTube2 size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Transparent Diagnostic Pricing</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Compare tests side-by-side across accredited laboratories by price, turnaround time (TAT), sample type, and home collection.
              </p>
              <button
                onClick={() => navigate('/diagnostic-tests')}
                className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Compare Lab Tests</span>
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
                Upload previous diagnostic PDFs to extract facts, explain abnormal values in simple words, and connect with relevant care.
              </p>
              <button
                onClick={() => handleQuickDemo('PATIENT', '/patient/reports')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Try Report Assistant</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Role Access / Demo Credentials Interactive Showcase */}
      <section className="py-14 bg-gradient-to-br from-slate-900 to-blue-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Role-Based Access Control (RBAC)
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Explore All 5 Specialized Portals
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Click any role to log in instantly with verified credentials and explore dedicated dashboards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Patient */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PATIENT
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Johnathan Miller</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Book doctors, live queue token tracker, test bookings, sample tracking & AI report assistant.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemo('PATIENT', '/patient/dashboard')}
                className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Log In as Patient
              </button>
            </div>

            {/* Doctor */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  DOCTOR
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Dr. Sarah Jenkins</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Manage patient appointments, call next token in live queue, issue diagnostic referrals & review reports.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemo('DOCTOR', '/doctor/dashboard')}
                className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Log In as Doctor
              </button>
            </div>

            {/* Clinic */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  CLINIC
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Metro Specialist Center</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Facility scheduling, manage specialist doctor rosters, room allocations & multi-wing queue overviews.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemo('CLINIC', '/clinic/dashboard')}
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Log In as Clinic
              </button>
            </div>

            {/* Laboratory */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  LABORATORY
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Precision Diagnostics</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Test catalog pricing, sample barcode tracking, collection workflow & upload official PDF reports.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemo('LABORATORY', '/laboratory/dashboard')}
                className="mt-4 w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Log In as Lab
              </button>
            </div>

            {/* Admin */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  ADMIN
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Platform Admin</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Credential verification (licenses/permits), user management, system analytics & security audit logs.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemo('ADMIN', '/admin/dashboard')}
                className="mt-4 w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Log In as Admin
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              M
            </div>
            <span className="font-bold text-slate-800">MediLink Healthcare & Diagnostic Marketplace</span>
          </div>
          <p>© {new Date().getFullYear()} MediLink Platform. All clinical data presented in demo mode.</p>
        </div>
      </footer>
    </div>
  );
};
