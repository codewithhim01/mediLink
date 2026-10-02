import React, { useState, useEffect } from 'react';
import { FileText, ShieldAlert, Clock, UserCheck, Search } from 'lucide-react';
import { api } from '../../services/api.js';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await api.getAuditLogs();
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.resourceType.toLowerCase().includes(search.toLowerCase()) ||
    (l.userId && l.userId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Security & Compliance Audit Trail</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Immutable logging of access to medical records, authentication attempts, and authorization changes.
        </p>
      </div>

      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by audit action (e.g. REPORT_ACCESSED, USER_LOGGED_IN, etc.)..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Resource</th>
                <th className="py-2.5 px-3">User ID</th>
                <th className="py-2.5 px-3">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleTimeString()} {new Date(l.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-blue-700">{l.action}</td>
                  <td className="py-2.5 px-3 text-slate-700">{l.resourceType} {l.resourceId ? `(${l.resourceId.slice(0, 10)})` : ''}</td>
                  <td className="py-2.5 px-3 text-slate-600">{l.userId || 'ANONYMOUS'}</td>
                  <td className="py-2.5 px-3 text-slate-400">{l.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
