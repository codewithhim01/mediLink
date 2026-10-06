import React, { useState } from 'react';
import { Activity, Mail, Lock, User as UserIcon, Phone, AlertCircle, Loader2, Stethoscope, Building2, TestTube2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Role } from '../../types/index.js';
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateRequired,
} from '../../utils/validation.js';
import { FieldError } from '../../components/common/FieldError.js';

interface RegisterPageProps {
  navigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ navigate }) => {
  const { register } = useAuth();
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR' | 'CLINIC' | 'LABORATORY'>('PATIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Doctor specific fields
  const [specialty, setSpecialty] = useState('Cardiology');
  const [qualification, setQualification] = useState('MBBS, MD');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [consultationFee, setConsultationFee] = useState<number>(800);

  // Clinic specific fields
  const [clinicName, setClinicName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lucknow, UP');
  const [registrationNo, setRegistrationNo] = useState('');

  // Lab specific fields
  const [labName, setLabName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const nameErr = validateName(name, role === 'DOCTOR' ? 'Doctor Name' : 'Full Name');
    if (nameErr) errors.name = nameErr;

    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;

    const passErr = validatePassword(password, 6);
    if (passErr) errors.password = passErr;

    const phoneErr = validatePhone(phone, false);
    if (phoneErr) errors.phone = phoneErr;

    if (role === 'DOCTOR') {
      const licErr = validateRequired(licenseNumber, 'Medical Council License Number');
      if (licErr) errors.licenseNumber = licErr;
      if (!consultationFee || consultationFee <= 0) {
        errors.consultationFee = 'Consultation fee must be at least ₹100';
      }
    }

    if (role === 'CLINIC') {
      const clnErr = validateRequired(clinicName, 'Clinic Name');
      if (clnErr) errors.clinicName = clnErr;
      const regErr = validateRequired(registrationNo, 'State Registration Number');
      if (regErr) errors.registrationNo = regErr;
    }

    if (role === 'LABORATORY') {
      const labErr = validateRequired(labName, 'Laboratory Name');
      if (labErr) errors.labName = labErr;
      const licErr = validateRequired(licenseNo, 'NABL / ICMR Registration Number');
      if (licErr) errors.licenseNo = licErr;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
      phone: true,
      licenseNumber: true,
      consultationFee: true,
      clinicName: true,
      registrationNo: true,
      labName: true,
      licenseNo: true,
    });

    if (!validateForm()) {
      setError('Please resolve the highlighted validation errors before submitting.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        role,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        specialty: role === 'DOCTOR' ? specialty : undefined,
        qualification: role === 'DOCTOR' ? qualification : undefined,
        licenseNumber: role === 'DOCTOR' ? licenseNumber.trim() : undefined,
        consultationFee: role === 'DOCTOR' ? Number(consultationFee) : undefined,
        clinicName: role === 'CLINIC' ? clinicName.trim() : undefined,
        address: (role === 'CLINIC' || role === 'LABORATORY') ? (address.trim() || 'Lucknow, Uttar Pradesh') : undefined,
        city: (role === 'CLINIC' || role === 'LABORATORY') ? (city.trim() || 'Lucknow') : undefined,
        registrationNo: role === 'CLINIC' ? registrationNo.trim() : undefined,
        labName: role === 'LABORATORY' ? labName.trim() : undefined,
        licenseNo: role === 'LABORATORY' ? licenseNo.trim() : undefined,
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
      setError(err.message || 'Registration failed. Please check your inputs.');
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-semibold">
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
          </div>
        </div>

        {/* Common Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Legal Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onBlur={() => markTouched('name')}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder={role === 'DOCTOR' ? 'Dr. Jane Smith, MD' : 'Full Name'}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium transition-colors ${
                  touched.name && fieldErrors.name
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
            </div>
            {touched.name && <FieldError error={fieldErrors.name} />}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onBlur={() => markTouched('email')}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="name@domain.com"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium transition-colors ${
                  touched.email && fieldErrors.email
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {touched.email && <FieldError error={fieldErrors.email} />}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onBlur={() => markTouched('password')}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                }}
                placeholder="At least 6 characters"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium transition-colors ${
                  touched.password && fieldErrors.password
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {touched.password && <FieldError error={fieldErrors.password} />}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              value={phone}
              onBlur={() => markTouched('phone')}
              onChange={(e) => {
                setPhone(e.target.value);
                if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
              }}
              placeholder="+91 98765 43210"
              className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium transition-colors ${
                touched.phone && fieldErrors.phone
                  ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            {touched.phone && <FieldError error={fieldErrors.phone} />}
          </div>

          {/* Role specific inputs */}
          {role === 'DOCTOR' && (
            <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-900">Physician Credentials</p>
              <div className="grid grid-cols-2 gap-2.5">
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
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Consultation Fee (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={consultationFee}
                    onBlur={() => markTouched('consultationFee')}
                    onChange={(e) => {
                      setConsultationFee(Number(e.target.value));
                      if (fieldErrors.consultationFee) setFieldErrors(prev => ({ ...prev, consultationFee: '' }));
                    }}
                    className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg ${
                      touched.consultationFee && fieldErrors.consultationFee
                        ? 'border-rose-400 bg-rose-50/20'
                        : 'border-slate-200'
                    }`}
                  />
                  {touched.consultationFee && <FieldError error={fieldErrors.consultationFee} />}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Medical Council License # <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onBlur={() => markTouched('licenseNumber')}
                  onChange={(e) => {
                    setLicenseNumber(e.target.value);
                    if (fieldErrors.licenseNumber) setFieldErrors(prev => ({ ...prev, licenseNumber: '' }));
                  }}
                  placeholder="e.g. UPMC-89124"
                  className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg ${
                    touched.licenseNumber && fieldErrors.licenseNumber
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-slate-200'
                  }`}
                />
                {touched.licenseNumber && <FieldError error={fieldErrors.licenseNumber} />}
              </div>
            </div>
          )}

          {role === 'CLINIC' && (
            <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">Clinic Facility Details</p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Clinic Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onBlur={() => markTouched('clinicName')}
                  onChange={(e) => {
                    setClinicName(e.target.value);
                    if (fieldErrors.clinicName) setFieldErrors(prev => ({ ...prev, clinicName: '' }));
                  }}
                  placeholder="e.g. Gomti Nagar Care Center"
                  className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg ${
                    touched.clinicName && fieldErrors.clinicName
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-slate-200'
                  }`}
                />
                {touched.clinicName && <FieldError error={fieldErrors.clinicName} />}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
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
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    State Reg. # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={registrationNo}
                    onBlur={() => markTouched('registrationNo')}
                    onChange={(e) => {
                      setRegistrationNo(e.target.value);
                      if (fieldErrors.registrationNo) setFieldErrors(prev => ({ ...prev, registrationNo: '' }));
                    }}
                    placeholder="UP-LKO-CLN-2024"
                    className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg ${
                      touched.registrationNo && fieldErrors.registrationNo
                        ? 'border-rose-400 bg-rose-50/20'
                        : 'border-slate-200'
                    }`}
                  />
                  {touched.registrationNo && <FieldError error={fieldErrors.registrationNo} />}
                </div>
              </div>
            </div>
          )}

          {role === 'LABORATORY' && (
            <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Laboratory Certification</p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Lab Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={labName}
                  onBlur={() => markTouched('labName')}
                  onChange={(e) => {
                    setLabName(e.target.value);
                    if (fieldErrors.labName) setFieldErrors(prev => ({ ...prev, labName: '' }));
                  }}
                  placeholder="e.g. Apex Diagnostics Lucknow"
                  className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg ${
                    touched.labName && fieldErrors.labName
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-slate-200'
                  }`}
                />
                {touched.labName && <FieldError error={fieldErrors.labName} />}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  NABL / ICMR Reg. # <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={licenseNo}
                  onBlur={() => markTouched('licenseNo')}
                  onChange={(e) => {
                    setLicenseNo(e.target.value);
                    if (fieldErrors.licenseNo) setFieldErrors(prev => ({ ...prev, licenseNo: '' }));
                  }}
                  placeholder="NABL-UP-77889"
                  className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg ${
                    touched.licenseNo && fieldErrors.licenseNo
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-slate-200'
                  }`}
                />
                {touched.licenseNo && <FieldError error={fieldErrors.licenseNo} />}
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
