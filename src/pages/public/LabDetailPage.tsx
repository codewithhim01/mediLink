import React, { useState, useEffect } from 'react';
import {
  TestTube2,
  MapPin,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  Home,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Building2
} from 'lucide-react';
import { api } from '../../services/api.js';
import { DiagnosticTest } from '../../types/index.js';
import { RatingStars } from '../../components/common/RatingStars.js';
import { Badge } from '../../components/common/Badge.js';
import { BookTestModal } from '../../components/patient/BookTestModal.js';
import { useAuth } from '../../contexts/AuthContext.js';

interface LabDetailPageProps {
  labId: string;
  navigate: (path: string) => void;
}

export const LabDetailPage: React.FC<LabDetailPageProps> = ({ labId, navigate }) => {
  const { isAuthenticated, switchDemoRole } = useAuth();
  const [lab, setLab] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<DiagnosticTest | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    api.getLaboratoryById(labId).then(res => {
      if (res.success && res.data) {
        setLab(res.data);
      }
      setLoading(false);
    });
  }, [labId]);

  const handleBookTest = async (test: DiagnosticTest) => {
    if (!isAuthenticated) {
      await switchDemoRole('PATIENT');
    }
    setSelectedTest(test);
    setIsBookModalOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-64 bg-white rounded-3xl border border-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-sm font-bold text-slate-700">Laboratory not found</p>
        <button
          onClick={() => navigate('/laboratories')}
          className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Laboratories
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <button
        onClick={() => navigate('/laboratories')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
      >
        <ArrowLeft size={14} /> Back to Laboratories
      </button>

      {successNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Lab Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{lab.name}</h1>
              {lab.isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  <ShieldCheck size={12} /> CLIA / CAP Accredited
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-teal-700 mt-1">
              CLIA License #{lab.licenseNo} • {lab.accreditation || 'College of American Pathologists (CAP) Certified'}
            </p>

            <div className="mt-2">
              <RatingStars rating={lab.rating} showScore reviewCount={lab.reviewCount} />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 space-y-1.5 min-w-[240px]">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-teal-600 shrink-0" />
              <span>{lab.address}, {lab.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-teal-600 shrink-0" />
              <span>TAT Guarantee: <strong>{lab.turnaroundTimeNote}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-teal-600 shrink-0" />
              <span>{lab.phone}</span>
            </div>
            {lab.homeCollectionAvailable && (
              <div className="flex items-center gap-2 text-emerald-700 font-semibold pt-0.5">
                <Home size={14} />
                <span>Certified Home Blood Draw Available</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Laboratory Test Menu */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <h2 className="text-lg font-black text-slate-900">Diagnostic Tests Offered at this Facility</h2>
          <p className="text-xs text-slate-500">Compare pricing, specimen requirements and turnaround guarantees</p>
        </div>

        {lab.tests?.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No tests currently listed for this lab.</p>
        ) : (
          <div className="space-y-3">
            {lab.tests?.map((test: any) => {
              const effectivePrice = test.discountPrice || test.price;
              const hasDiscount = test.discountPrice && test.discountPrice < test.price;

              return (
                <div
                  key={test.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{test.code}</span>
                      <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                        {test.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{test.name}</h4>
                    <p className="text-xs text-slate-500">
                      Sample: <strong>{test.sampleType}</strong> • Turnaround: <strong>{test.turnaroundHours} Hours</strong>
                    </p>
                    {test.preparationInstructions && (
                      <p className="text-[11px] text-slate-500 italic">
                        {test.preparationInstructions}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900">${effectivePrice}</span>
                      {hasDiscount && (
                        <span className="text-xs text-slate-400 line-through block">${test.price}</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleBookTest(test)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Book Test
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
