import React, { useState, useEffect } from 'react';
import { Clock, Users, Building2, Stethoscope } from 'lucide-react';
import { api } from '../../services/api.js';
import { Doctor } from '../../types/index.js';
import { LiveQueueCard } from '../../components/queue/LiveQueueCard.js';

export const ClinicQueuesPage: React.FC = () => {
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
        <h1 className="text-2xl font-black text-slate-900">Multi-Wing Queue Monitor</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time patient flow across outpatient consultation rooms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {doctors.map(doc => (
          <div key={doc.id} className="space-y-2">
            <LiveQueueCard
              doctorId={doc.id}
              doctorName={doc.name}
              specialty={doc.specialty}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
