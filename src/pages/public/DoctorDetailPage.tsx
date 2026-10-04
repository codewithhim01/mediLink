import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Star,
  DollarSign,
  UserCheck,
  Award,
  ArrowLeft,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api.js';
import { Doctor, Review } from '../../types/index.js';
import { RatingStars } from '../../components/common/RatingStars.js';
import { Badge } from '../../components/common/Badge.js';
import { BookAppointmentModal } from '../../components/patient/BookAppointmentModal.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { handleImageError } from '../../utils/imageUtils.js';

interface DoctorDetailPageProps {
  doctorId: string;
  navigate: (path: string) => void;
}

export const DoctorDetailPage: React.FC<DoctorDetailPageProps> = ({ doctorId, navigate }) => {
  const { user, isAuthenticated, switchDemoRole } = useAuth();
  const [doctor, setDoctor] = useState<any | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Review Form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchDoctor = async () => {
    try {
      const res = await api.getDoctorById(doctorId);
      if (res.success && res.data) {
        setDoctor(res.data);
        if (res.data.reviews) {
          setReviews(res.data.reviews);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctor();
  }, [doctorId]);

  const handleBook = () => {
    setIsBookModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!isAuthenticated) {
      await switchDemoRole('PATIENT');
    }

    setSubmittingReview(true);
    setReviewError(null);
    try {
      const res = await api.createReview({
        targetType: 'DOCTOR',
        targetId: doctorId,
        rating: newRating,
        comment: newComment,
      });

      if (res.success) {
        setShowReviewForm(false);
        setNewComment('');
        await fetchDoctor();
        setSuccessNotice('Your verified patient review has been posted.');
        setTimeout(() => setSuccessNotice(null), 4000);
      }
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-64 bg-white rounded-3xl border border-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-sm font-bold text-slate-700">Doctor profile not found</p>
        <button
          onClick={() => navigate('/doctors')}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Doctors
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/doctors')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
      >
        <ArrowLeft size={14} /> Back to Doctor Directory
      </button>

      {successNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Doctor Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <img
              src={doctor.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doctor.name)}`}
              alt={doctor.name}
              onError={(e) => handleImageError(e, doctor.name)}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-100 shadow-sm shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{doctor.name}</h1>
                {doctor.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <ShieldCheck size={12} /> Verified NMC License
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-blue-700 mt-0.5">{doctor.specialty}</p>
              {doctor.subSpecialty && (
                <p className="text-xs font-medium text-slate-600">{doctor.subSpecialty}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {doctor.qualification} • {doctor.experienceYears} Years Clinical Experience
              </p>

              <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
                <RatingStars rating={doctor.rating} showScore reviewCount={doctor.reviewCount} />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-center sm:items-center md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 gap-3">
            <div className="text-center sm:text-left md:text-right">
              <span className="text-xs font-semibold text-slate-500">Consultation Fee</span>
              <p className="text-3xl font-black text-slate-900">₹{doctor.consultationFee}</p>
              <span className="text-[11px] text-slate-400">{doctor.consultationDuration} min consultation</span>
            </div>

            <button
              onClick={handleBook}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Calendar size={15} />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

        {/* Bio */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Professional Biography
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
            {doctor.bio || 'Board-certified medical specialist dedicated to evidence-based clinical diagnostics, compassionate preventive care, and individualized therapeutic treatment plans.'}
          </p>
        </div>

        {/* Practice Clinic Location & Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <MapPin size={15} className="text-blue-600" /> Clinic Location
            </h4>
            <p className="text-xs font-semibold text-slate-800">
              {doctor.clinic?.name || 'Awadh Mediplex & Heart Institute'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {doctor.clinic?.address || 'Vibhuti Khand, Gomti Nagar'}, {doctor.clinic?.city || 'Lucknow, UP'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Ph: {doctor.clinic?.phone || '+91 522 409 1200'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Clock size={15} className="text-blue-600" /> Weekly Availability
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {doctor.availability?.map((day: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-white text-blue-800 rounded-lg text-xs font-semibold border border-slate-200"
                >
                  {day}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Integrated with MediLink Live Queue Token Dispatcher
            </p>
          </div>
        </div>
      </div>

      {/* Patient Reviews Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Verified Patient Reviews</h3>
            <p className="text-xs text-slate-500">Based on authenticated clinical consultations</p>
          </div>

          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {showReviewForm ? 'Cancel' : 'Write a Review'}
          </button>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            {reviewError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Rating:</span>
              <RatingStars rating={newRating} max={5} interactive onRatingChange={setNewRating} size={20} />
            </div>

            <div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                placeholder="Share your experience regarding the consultation, bedside manner, or queue wait..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send size={13} />
                <span>Submit Review</span>
              </button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            No patient reviews posted yet. Be the first to leave feedback!
          </p>
        ) : (
          <div className="space-y-3 divide-y divide-slate-100">
            {reviews.map(rev => (
              <div key={rev.id} className="pt-3 first:pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {rev.patientName || 'Verified Patient'}
                    </span>
                    {rev.isVerifiedVisit && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        ✓ Verified Consultation
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="my-1">
                  <RatingStars rating={rev.rating} size={13} />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        preselectedDoctorId={doctor.id}
        onSuccess={(apt) => {
          setSuccessNotice(`Appointment confirmed for ${apt.date} at ${apt.timeSlot}! Live Queue Token #${apt.queueTicket?.tokenNumber || '1'} reserved.`);
        }}
      />
    </div>
  );
};
