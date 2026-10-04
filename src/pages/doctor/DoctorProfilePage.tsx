import React, { useState, useEffect } from 'react';
import { Stethoscope, DollarSign, Clock, Save, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../services/api.js';
import { handleImageError } from '../../utils/imageUtils.js';

export const DoctorProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();

  const [specialty, setSpecialty] = useState(profile?.specialty || 'Cardiology');
  const [subSpecialty, setSubSpecialty] = useState(profile?.subSpecialty || 'Interventional & Preventive Cardiology');
  const [experienceYears, setExperienceYears] = useState(profile?.experienceYears || 14);
  const [qualification, setQualification] = useState(profile?.qualification || 'MBBS, MD (Medicine), DM (Cardiology)');
  const [consultationFee, setConsultationFee] = useState(profile?.consultationFee || 800);
  const [consultationDuration, setConsultationDuration] = useState(profile?.consultationDuration || 20);
  const [bio, setBio] = useState(profile?.bio || '');
  const [availability, setAvailability] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setSpecialty(profile.specialty || 'Cardiology');
      setSubSpecialty(profile.subSpecialty || '');
      setExperienceYears(profile.experienceYears || 10);
      setQualification(profile.qualification || 'MD');
      setConsultationFee(profile.consultationFee || 100);
      setConsultationDuration(profile.consultationDuration || 20);
      setBio(profile.bio || '');
      try {
        if (profile.availabilityJson) {
          setAvailability(JSON.parse(profile.availabilityJson));
        }
      } catch {}
    }
  }, [profile]);

  const toggleDay = (day: string) => {
    setAvailability(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    setErrorNotice(null);

    try {
      const res = await api.updateDoctorProfile({
        specialty,
        subSpecialty,
        experienceYears,
        qualification,
        consultationFee,
        consultationDuration,
        bio,
        availability,
      });

      if (res.success) {
        setNotice('Doctor clinical profile updated successfully.');
        await refreshProfile();
        setTimeout(() => setNotice(null), 4000);
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Physician Clinical Profile & Fees</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure your medical credentials, consultation fees, duration, and patient availability.
        </p>
      </div>

      {notice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-semibold flex items-center gap-2">
          <span>{errorNotice}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'Doctor')}`}
            alt="Physician avatar"
            onError={(e) => handleImageError(e, user?.name)}
            className="w-16 h-16 rounded-2xl border border-slate-200 object-cover"
          />
          <div>
            <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
            <p className="text-xs text-slate-500">{user?.email} • License: {profile?.licenseNumber}</p>
            <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck size={12} /> {profile?.isVerified ? 'Verified License' : 'Pending Verification'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Primary Specialty</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sub-Specialty Focus</label>
            <input
              type="text"
              value={subSpecialty}
              onChange={(e) => setSubSpecialty(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Qualifications / Degrees</label>
            <input
              type="text"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Years of Practice</label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Fee (₹ INR)</label>
            <input
              type="number"
              value={consultationFee}
              onChange={(e) => setConsultationFee(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Duration (Minutes)</label>
            <input
              type="number"
              value={consultationDuration}
              onChange={(e) => setConsultationDuration(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 font-bold"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Weekly OPD Consultation Schedule</label>
          <div className="flex flex-wrap gap-2">
            {allDays.map(day => {
              const isSelected = availability.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Biography</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 leading-relaxed font-medium"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Save size={15} />
            <span>Save Profile & Availability</span>
          </button>
        </div>
      </form>
    </div>
  );
};
