import React, { useState } from 'react';
import { Activity, Mail, Lock, User as UserIcon, Phone, AlertCircle, Loader2, Stethoscope, Building2, TestTube2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Role } from '../../types/index.js';

interface RegisterPageProps {
  navigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ navigate }) => {
  const { register } = useAuth();
  const [role, setRole] = useState<Role>('PATIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Doctor specific fields
  const [specialty, setSpecialty] = useState('Cardiology');
  const [qualification, setQualification] = useState('MD, FACC');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [consultationFee, setConsultationFee] = useState(100);

  // Clinic specific fields
  const [clinicName, setClinicName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Portland, OR');
  const [registrationNo, setRegistrationNo] = useState('');

  // Lab specific fields
  const [labName, setLabName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError('Please fill in all required account fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        role,
        name,
        email,
        password,
        phone,
        specialty: role === 'DOCTOR' ? specialty : undefined,
        qualification: role === 'DOCTOR' ? qualification : undefined,
        licenseNumber: role === 'DOCTOR' ? licenseNumber : undefined,
        consultationFee: role === 'DOCTOR' ? consultationFee : undefined,
        clinicName: role === 'CLINIC' ? clinicName : undefined,
        address: (role === 'CLINIC' || role === 'LABORATORY') ? address : undefined,
        city: (role === 'CLINIC' || role === 'LABORATORY') ? city : undefined,
        registrationNo: role === 'CLINIC' ? registrationNo : undefined,
        labName: role === 'LABORATORY' ? labName : undefined,
        licenseNo: role === 'LABORATORY' ? licenseNo : undefined,
      });

      const paths: Record<Role, string> = {
        PATIENT: '/patient/dashboard',
        DOCTOR: '/doctor/dashboard',
        CLINIC: '/clinic/dashboard',
        LABORATORY: '/laboratory/dashboard',
        ADMIN: '/admin/dashboard',
      };
      navigate(paths[role]);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-50/50">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-blue-500/20">
            <Activity size={26} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Create MediLink Account</h1>
          <p className="text-xs text-slate-500 mt-1">Select your role to configure your verified workspace</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Account Type:</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setRole('PATIENT')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                role === 'PATIENT' ? 'bg-emerald-50 text-emerald-800 border-emerald-500 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserIcon size={16} className={role === 'PATIENT' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Patient</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('DOCTOR')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                role === 'DOCTOR' ? 'bg-blue-50 text-blue-800 border-blue-500 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Stethoscope size={16} className={role === 'DOCTOR' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Doctor</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('CLINIC')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                role === 'CLINIC' ? 'bg-indigo-50 text-indigo-800 border-indigo-500 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 size={16} className={role === 'CLINIC' ? 'text-indigo-600' : 'text-slate-400'} />
              <span>Clinic</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('LABORATORY')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                role === 'LABORATORY' ? 'bg-amber-50 text-amber-800 border-amber-500 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TestTube2 size={16} className={role === 'LABORATORY' ? 'text-amber-600' : 'text-slate-400'} />
              <span>Lab</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('ADMIN')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                role === 'ADMIN' ? 'bg-rose-50 text-rose-800 border-rose-500 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck size={16} className={role === 'ADMIN' ? 'text-rose-600' : 'text-slate-400'} />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Common Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'DOCTOR' ? 'Dr. Jane Smith, MD' : 'Full Name'}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Role specific inputs */}
          {role === 'DOCTOR' && (
            <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-900">Physician Credentials</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Specialty</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Consultation Fee ($)</label>
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Medical License #</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. MD-OR-908122"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          )}

          {role === 'CLINIC' && (
            <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">Clinic Facility Details</p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Clinic Name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Metro Urgent & Specialist Center"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">State Reg. #</label>
                  <input
                    type="text"
                    value={registrationNo}
                    onChange={(e) => setRegistrationNo(e.target.value)}
                    placeholder="OR-CLIN-2026"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {role === 'LABORATORY' && (
            <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Laboratory Certification</p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Lab Legal Name</label>
                <input
                  type="text"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="Apex Bio-Tech Diagnostics"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">CLIA License #</label>
                <input
                  type="text"
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  placeholder="CLIA-OR-77889"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <span>Complete Registration</span>}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already registered?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 font-bold hover:underline cursor-pointer"
          >
            Sign In here
          </button>
        </p>
      </div>
    </div>
  );
};
