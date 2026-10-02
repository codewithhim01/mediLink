import React, { useState, useEffect } from 'react';
import { Stethoscope, MapPin, Star, Clock, Plus, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api.js';
import { Doctor } from '../../types/index.js';
import { RatingStars } from '../../components/common/RatingStars.js';

export const ClinicDoctorsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDoctors().then(res => {
      if (res.success && res.data) setDoctors(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Clinic Doctor Roster</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Physicians and specialists affiliated with clinic outpatient wings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {doctors.map(doc => (
          <div key={doc.id} className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={doc.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doc.name)}`}
                  alt={doc.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-100"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                  <p className="text-xs font-bold text-blue-700">{doc.specialty}</p>
                  <p className="text-[11px] text-slate-500">{doc.qualification}</p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 my-3">
                <p>License: <strong className="font-mono">{doc.licenseNumber}</strong></p>
                <p>Consultation Fee: <strong>${doc.consultationFee}</strong></p>
                <p>Days: {doc.availability.join(', ')}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <RatingStars rating={doc.rating} showScore reviewCount={doc.reviewCount} />
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active Staff
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
