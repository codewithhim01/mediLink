import React, { useState } from 'react';
import { Activity, Lock, Mail, ArrowRight, AlertCircle, Loader2, Sparkles, UserCheck, Stethoscope, Building2, TestTube2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Role } from '../../types/index.js';
import { validateEmail, validatePassword } from '../../utils/validation.js';
import { FieldError } from '../../components/common/FieldError.js';

interface LoginPageProps {
  navigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { login, switchDemoRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;

    const passErr = validatePassword(password, 1);
    if (passErr) errors.password = passErr;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!validateForm()) {
      setError('Please provide a valid email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: Role) => {
    setLoading(true);
    setError(null);
    try {
      await switchDemoRole(role);
      const paths: Record<Role, string> = {
        PATIENT: '/patient/dashboard',
        DOCTOR: '/doctor/dashboard',
        CLINIC: '/clinic/dashboard',
        LABORATORY: '/laboratory/dashboard',
        ADMIN: '/admin/dashboard',
      };
      navigate(paths[role]);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-50/50">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-blue-500/20">
            <Activity size={26} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Sign in to MediLink</h1>
          <p className="text-xs text-slate-500 mt-1">Access your healthcare portal, live queues & reports</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Fill Credentials */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles size={14} className="text-blue-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Quick Fill Credentials (By Role)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleQuickDemo('PATIENT')}
              className="p-2 bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors text-slate-700"
            >
              <UserCheck size={13} className="text-emerald-600" /> Patient
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('DOCTOR')}
              className="p-2 bg-white hover:bg-blue-50 hover:text-blue-800 border border-slate-200 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors text-slate-700"
            >
              <Stethoscope size={13} className="text-blue-600" /> Doctor
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('CLINIC')}
              className="p-2 bg-white hover:bg-indigo-50 hover:text-indigo-800 border border-slate-200 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors text-slate-700"
            >
              <Building2 size={13} className="text-indigo-600" /> Clinic
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('LABORATORY')}
              className="p-2 bg-white hover:bg-amber-50 hover:text-amber-800 border border-slate-200 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors text-slate-700"
            >
              <TestTube2 size={13} className="text-amber-600" /> Lab
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN')}
              className="p-2 bg-white hover:bg-rose-50 hover:text-rose-800 border border-slate-200 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors text-slate-700 col-span-2 sm:col-span-1"
            >
              <ShieldCheck size={13} className="text-rose-600" /> Admin
            </button>
          </div>
        </div>

        {/* Standard Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                }}
                placeholder="name@example.com"
                className={`w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium transition-colors ${
                  touched.email && fieldErrors.email
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
            </div>
            {touched.email && <FieldError error={fieldErrors.email} />}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                }}
                placeholder="••••••••"
                className={`w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium transition-colors ${
                  touched.password && fieldErrors.password
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
            </div>
            {touched.password && <FieldError error={fieldErrors.password} />}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <span>Sign In</span>}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-blue-600 font-bold hover:underline cursor-pointer"
          >
            Create an Account
          </button>
        </p>
      </div>
    </div>
  );
};
