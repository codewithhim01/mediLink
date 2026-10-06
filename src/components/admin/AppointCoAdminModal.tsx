import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, UserPlus, Users, Search, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { validateEmail, validatePassword } from '../../utils/validation.js';

interface AppointCoAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  existingUsers: any[];
}

export const AppointCoAdminModal: React.FC<AppointCoAdminModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingUsers
}) => {
  const [tab, setTab] = useState<'existing' | 'new'>('existing');

  // Existing user appointment
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // New user appointment
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 522 220 9000');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter candidates (exclude primary admin and users who are already co-admins)
  const candidateUsers = existingUsers.filter(u => {
    const isPrimary = u.id === 'usr-admin-1' || u.adminRole === 'PRIMARY';
    const isCoAdmin = u.role === 'ADMIN' && u.adminRole === 'CO_ADMIN';
    if (isPrimary || isCoAdmin) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  });

  const handleAppointExisting = async () => {
    if (!selectedUserId) {
      setError('Please select a user to appoint as Co-Administrator.');
      return;
    }

    const targetUser = existingUsers.find(u => u.id === selectedUserId);
    setLoading(true);
    setError(null);

    try {
      const res = await api.appointCoAdmin({ userId: selectedUserId });
      if (res.success) {
        setSuccessNotice(res.message || `${targetUser?.name || 'User'} has been appointed as Co-Administrator.`);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          setSelectedUserId(null);
          setSuccessNotice(null);
        }, 1400);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to appoint Co-Administrator.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewCoAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Please provide a full legal name (minimum 2 characters).');
      return;
    }

    const emailErr = validateEmail(email.trim());
    if (emailErr) {
      setError(emailErr);
      return;
    }

    const passErr = validatePassword(password, 6);
    if (passErr) {
      setError(passErr);
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.appointCoAdmin({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || '+91 522 220 9000',
      });

      if (res.success) {
        setSuccessNotice(`Co-Administrator account for ${name} created and appointed.`);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          setName('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setSuccessNotice(null);
        }, 1400);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to provision Co-Administrator account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appoint-co-admin-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 id="appoint-co-admin-title" className="text-base sm:text-lg font-black tracking-tight text-white">
                Appoint Platform Co-Administrator
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Co-Administrators receive administrative access to oversee platform operations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => { setTab('existing'); setError(null); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'existing'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={14} />
            <span>Appoint Existing User</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('new'); setError(null); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'new'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus size={14} />
            <span>Create New Co-Admin Account</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {tab === 'existing' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Search and select any registered user (doctor, patient, clinic, or lab staff) to elevate them to Co-Administrator. You can revoke this anytime.
              </p>

              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter users by name, email, or role..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div className="border border-slate-200 rounded-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
                {candidateUsers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No eligible candidates found.
                  </div>
                ) : (
                  candidateUsers.map((u) => {
                    const isSelected = selectedUserId === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        className={`p-3 text-xs flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                            : 'hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{u.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase">
                            {u.role}
                          </span>
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => setSelectedUserId(u.id)}
                            className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAppointExisting}
                  disabled={loading || !selectedUserId}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                >
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  <span>Appoint as Co-Administrator</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateNewCoAdmin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Alok Kumar"
                  className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coadmin@medilink.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 522 220 9000"
                  className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                >
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  <span>Provision & Appoint Co-Admin</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
