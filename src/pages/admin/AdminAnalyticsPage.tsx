import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

export const AdminAnalyticsPage: React.FC = () => {
  const consultationTrendData = [
    { month: 'May', consultations: 42, diagnosticTests: 68 },
    { month: 'Jun', consultations: 58, diagnosticTests: 84 },
    { month: 'Jul', consultations: 74, diagnosticTests: 110 },
    { month: 'Aug', consultations: 92, diagnosticTests: 135 },
    { month: 'Sep', consultations: 118, diagnosticTests: 172 },
    { month: 'Oct', consultations: 145, diagnosticTests: 210 },
  ];

  const specialtyDistribution = [
    { name: 'Cardiology', value: 38, color: '#2563eb' },
    { name: 'Endocrinology', value: 24, color: '#0d9488' },
    { name: 'Neurology', value: 18, color: '#4f46e5' },
    { name: 'Internal Med', value: 20, color: '#e11d48' },
  ];

  const revenueData = [
    { month: 'May', volume: 6800 },
    { month: 'Jun', volume: 9400 },
    { month: 'Jul', volume: 13200 },
    { month: 'Aug', volume: 17500 },
    { month: 'Sep', volume: 22800 },
    { month: 'Oct', volume: 29400 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">MediLink Platform Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time metrics on patient consultations, diagnostic testing volume, and GMV growth.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Consultation & Lab Test Activity</h3>
            <p className="text-xs text-slate-500">Monthly patient booking volumes</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consultationTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="consultations" fill="#2563eb" radius={[6, 6, 0, 0]} name="Doctor Visits" />
                <Bar dataKey="diagnosticTests" fill="#0d9488" radius={[6, 6, 0, 0]} name="Diagnostic Tests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Specialty Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Clinical Specialty Breakdown</h3>
            <p className="text-xs text-slate-500">Consultation share across specialties</p>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={specialtyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {specialtyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs">
            {specialtyDistribution.map(s => (
              <div key={s.name} className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span>{s.name} ({s.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Growth Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Gross Platform Transaction Volume ($ USD)</h3>
            <p className="text-xs text-slate-500">Total processed consultations and diagnostic investigations</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Volume']} />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#0d9488"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0d9488' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
