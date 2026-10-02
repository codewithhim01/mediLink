import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck, Ban, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { Badge } from '../../components/common/Badge.js';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
      await fetchUsers();
    } catch {
      // ignore
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">User Account Administration</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage user accounts, enforce status changes, and monitor access across all roles.
        </p>
      </div>

      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
              <tr>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{u.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{u.email}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {u.role}
                    </span>
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
                    {u.status === 'SUSPENDED' ? (
                      <button
                        onClick={() => handleStatusChange(u.id, 'VERIFIED')}
                        className="px-2.5 py-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg font-bold border border-emerald-200 cursor-pointer"
                      >
                        Reactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                        className="px-2.5 py-1 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-bold border border-rose-200 cursor-pointer"
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
