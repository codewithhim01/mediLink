import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  navigate?: (path: string) => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, navigate }) => {
  const { user, deleteAccount } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) {
      setError('Please type DELETE in the box below to confirm.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteAccount(password || undefined);
      onClose();
      if (navigate) {
        navigate('/');
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl border border-rose-200/80 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
      >
        {/* Header */}
        <div className="bg-rose-50/70 border-b border-rose-100 p-5 sm:p-6 flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={22} className="stroke-[2.2]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="delete-account-title" className="text-lg font-black text-slate-900">
              Permanently Delete Account
            </h3>
            <p className="text-xs text-rose-700/90 font-medium mt-0.5">
              Irreversible destructive action for <span className="font-bold">{user.email}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-white/80 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleDelete} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <p className="font-bold text-slate-800">By deleting your account, you understand that:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>Your login credentials and account identity will be wiped immediately.</li>
              <li>Your appointments, active queue tokens, and consultation history will be removed.</li>
              <li>All diagnostic test bookings, medical reports, and referrals will be purged.</li>
              <li>This action is irreversible and cannot be recovered.</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Account Password <span className="text-slate-400 font-normal">(Optional for demo users)</span>
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Type <span className="text-rose-600 font-black tracking-wider">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Type DELETE"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-slate-900 tracking-wider font-bold"
              autoComplete="off"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || loading}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isConfirmed && !loading
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Trash2 size={15} />
              <span>{loading ? 'Deleting Account...' : 'Permanently Delete My Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
