import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  Ban,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  X,
  ShieldAlert,
  UserPlus,
  ShieldMinus,
  Crown
} from 'lucide-react';
import { api } from '../../services/api.js';
import { Badge } from '../../components/common/Badge.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { CreateAdminModal } from '../../components/admin/CreateAdminModal.js';
import { AppointCoAdminModal } from '../../components/admin/AppointCoAdminModal.js';

export const AdminUsersPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showAppointCoAdminModal, setShowAppointCoAdminModal] = useState(false);

  // Deletion modal state
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Remove Co-Admin modal state
  const [coAdminToRemove, setCoAdminToRemove] = useState<any | null>(null);
  const [isRemovingCoAdmin, setIsRemovingCoAdmin] = useState(false);
  const [removeCoAdminError, setRemoveCoAdminError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await api.getAdminUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await api.updateUserStatus(userId, newStatus);
      setNotice({ type: 'success', message: `User status successfully updated to ${newStatus}.` });
      setTimeout(() => setNotice(null), 4000);
      await fetchUsers();
    } catch (err: any) {
      setNotice({ type: 'error', message: err?.message || 'Failed to update user status.' });
    }
  };

  const handleQuickAppointCoAdmin = async (targetUser: any) => {
    try {
      const res = await api.appointCoAdmin({ userId: targetUser.id });
      setNotice({
        type: 'success',
        message: res.message || `${targetUser.name} has been appointed as Co-Administrator.`
      });
      setTimeout(() => setNotice(null), 5000);
      await fetchUsers();
    } catch (err: any) {
      setNotice({ type: 'error', message: err?.message || 'Failed to appoint Co-Administrator.' });
    }
  };

  const handleConfirmRemoveCoAdmin = async () => {
    if (!coAdminToRemove) return;
    setIsRemovingCoAdmin(true);
    setRemoveCoAdminError(null);

    try {
      const res = await api.removeCoAdmin(coAdminToRemove.id);
      setCoAdminToRemove(null);
      setNotice({
        type: 'success',
        message: res.message || `Co-Administrator privileges for ${coAdminToRemove.name} have been removed.`
      });
      setTimeout(() => setNotice(null), 5000);
      await fetchUsers();
    } catch (err: any) {
      setRemoveCoAdminError(err?.message || 'Failed to remove Co-Administrator privileges.');
    } finally {
      setIsRemovingCoAdmin(false);
    }
  };

  const openDeleteModal = (targetUser: any) => {
    setUserToDelete(targetUser);
    setDeleteConfirmationInput('');
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setUserToDelete(null);
    setDeleteConfirmationInput('');
    setDeleteError(null);
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToDelete) return;

    if (deleteConfirmationInput.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account removal.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await api.deleteUserByAdmin(userToDelete.id);
      setUserToDelete(null);
      setNotice({
        type: 'success',
        message: res?.message || `User account for ${userToDelete.name} (${userToDelete.email}) was permanently deleted.`
      });
      setTimeout(() => setNotice(null), 5000);
      await fetchUsers();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete user account.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">User Account Administration</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage user accounts, appoint or remove co-administrators, and control platform access permissions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setShowAppointCoAdminModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck size={15} />
            <span>+ Appoint Co-Admin</span>
          </button>
          <button
            onClick={() => setShowCreateAdminModal(true)}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>+ Add Admin Account</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
              <tr>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Role & Authority</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading user directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filtered.map(u => {
                  const isCurrentAdmin = currentAdmin?.id === u.id;
                  const isPrimaryAdmin = u.id === 'usr-admin-1' || u.adminRole === 'PRIMARY';
                  const isCoAdmin = u.role === 'ADMIN' && (u.adminRole === 'CO_ADMIN' || !isPrimaryAdmin);
                  const totalAdmins = users.filter(usr => usr.role === 'ADMIN').length;
                  const cannotDelete = isCurrentAdmin || isPrimaryAdmin || (u.role === 'ADMIN' && totalAdmins <= 1);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{u.name}</span>
                          {isCurrentAdmin && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                              (You)
                            </span>
                          )}
                          {isPrimaryAdmin && (
                            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-black flex items-center gap-1 shadow-2xs">
                              <Crown size={11} className="text-amber-600" /> Primary Admin
                            </span>
                          )}
                          {isCoAdmin && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold flex items-center gap-1 shadow-2xs">
                              <ShieldCheck size={11} className="text-indigo-600" /> Co-Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold text-[10px] uppercase px-2 py-0.5 rounded-full ${
                            u.role === 'ADMIN'
                              ? isPrimaryAdmin
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={u.status === 'VERIFIED' ? 'success' : u.status === 'SUSPENDED' ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {u.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Co-Admin Appointment & Removal Actions */}
                          {isCoAdmin && !isCurrentAdmin && (
                            <button
                              onClick={() => {
                                setCoAdminToRemove(u);
                                setRemoveCoAdminError(null);
                              }}
                              className="px-2.5 py-1 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Revoke Co-Administrator authority and revert role"
                            >
                              <ShieldMinus size={13} />
                              <span>Remove Co-Admin</span>
                            </button>
                          )}

                          {!isPrimaryAdmin && !isCoAdmin && (
                            <button
                              onClick={() => handleQuickAppointCoAdmin(u)}
                              className="px-2.5 py-1 text-xs text-slate-700 hover:text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Appoint user as Co-Administrator"
                            >
                              <ShieldCheck size={13} className="text-indigo-600" />
                              <span>Appoint Co-Admin</span>
                            </button>
                          )}

                          {/* Suspend / Reactivate */}
                          {u.status === 'SUSPENDED' ? (
                            <button
                              onClick={() => handleStatusChange(u.id, 'VERIFIED')}
                              className="px-2.5 py-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg font-bold border border-emerald-200 cursor-pointer transition-colors"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                              disabled={u.role === 'ADMIN'}
                              title={u.role === 'ADMIN' ? 'Administrator account cannot be suspended' : undefined}
                              className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-colors ${
                                u.role === 'ADMIN'
                                  ? 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed'
                                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200 cursor-pointer'
                              }`}
                            >
                              Suspend
                            </button>
                          )}

                          {/* Delete Account */}
                          <button
                            onClick={() => openDeleteModal(u)}
                            disabled={cannotDelete}
                            title={
                              isCurrentAdmin
                                ? 'Cannot delete your own active administrator account'
                                : isPrimaryAdmin
                                ? 'The Primary Administrator account cannot be deleted'
                                : u.role === 'ADMIN' && totalAdmins <= 1
                                ? 'The only remaining administrator account cannot be deleted'
                                : 'Permanently delete user'
                            }
                            className={`px-2.5 py-1 text-xs rounded-lg font-bold border flex items-center gap-1 transition-colors ${
                              cannotDelete
                                ? 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed'
                                : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200 cursor-pointer'
                            }`}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remove Co-Admin Confirmation Modal */}
      {coAdminToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            className="bg-white rounded-3xl border border-indigo-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-coadmin-title"
          >
            <div className="bg-indigo-50 border-b border-indigo-100 p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <ShieldMinus size={20} className="stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="remove-coadmin-title" className="text-base font-black text-slate-900">
                  Revoke Co-Administrator Privileges
                </h3>
                <p className="text-xs text-indigo-800 font-medium mt-0.5">
                  De-escalate administrator access permissions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCoAdminToRemove(null)}
                disabled={isRemovingCoAdmin}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-white/80 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {removeCoAdminError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{removeCoAdminError}</span>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to remove Co-Administrator privileges for{' '}
                <strong className="text-slate-900">{coAdminToRemove.name}</strong> (
                <span className="font-mono text-slate-700">{coAdminToRemove.email}</span>)?
              </p>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">What happens next:</p>
                <p>• Administrative portal access and verification rights will be revoked.</p>
                <p>• Account role will be reverted to standard user status.</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCoAdminToRemove(null)}
                  disabled={isRemovingCoAdmin}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemoveCoAdmin}
                  disabled={isRemovingCoAdmin}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-2"
                >
                  <ShieldMinus size={15} />
                  <span>{isRemovingCoAdmin ? 'Revoking Privileges...' : 'Confirm Remove Co-Admin'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-delete-title"
          >
            {/* Modal Header */}
            <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} className="stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="admin-delete-title" className="text-base font-black text-slate-900">
                  Delete User Account (Admin Action)
                </h3>
                <p className="text-xs text-rose-700 font-medium mt-0.5">
                  Permanent removal from MediLink healthcare database
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-white/80 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmDelete} className="p-5 space-y-4">
              {deleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500">Target User:</span>
                  <span className="font-bold text-slate-900">{userToDelete.name}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono text-slate-700">{userToDelete.email}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-bold uppercase text-slate-800">{userToDelete.role}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">User ID:</span>
                  <span className="font-mono text-[11px] text-slate-500">{userToDelete.id}</span>
                </div>
              </div>

              <div className="text-xs text-rose-800 bg-rose-50/60 p-3 rounded-xl border border-rose-100 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={13} /> Warning: This action cannot be undone.
                </p>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  All associated profile documents, appointments, test bookings, reports, and logs for this account will be permanently erased.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Type <span className="text-rose-600 font-black tracking-wider">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationInput}
                  onChange={(e) => {
                    setDeleteConfirmationInput(e.target.value);
                    if (deleteError) setDeleteError(null);
                  }}
                  placeholder="Type DELETE"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-slate-900 tracking-wider font-bold"
                  autoComplete="off"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirmationInput.trim().toUpperCase() !== 'DELETE' || isDeleting}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    deleteConfirmationInput.trim().toUpperCase() === 'DELETE' && !isDeleting
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Trash2 size={15} />
                  <span>{isDeleting ? 'Deleting User...' : 'Permanently Delete User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AppointCoAdminModal
        isOpen={showAppointCoAdminModal}
        onClose={() => setShowAppointCoAdminModal(false)}
        onSuccess={fetchUsers}
        existingUsers={users}
      />

      <CreateAdminModal
        isOpen={showCreateAdminModal}
        onClose={() => setShowCreateAdminModal(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
};


