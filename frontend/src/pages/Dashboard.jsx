import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import API from '../api/axios.js';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className={`stat-card bg-white rounded-2xl p-5 border border-slate-100 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</p>
          <p className={`font-display font-bold text-3xl mt-1 ${color || 'text-slate-800'}`}>{value}</p>
          {sub && <p className="text-slate-400 text-xs mt-1">{sub}</p>}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/api/dashboard/analytics')
      .then(r => setAnalytics(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full spin"></div>
    </div>
  );

  const accuracy = analytics?.avg_r2 != null
    ? `${(analytics.avg_r2 * 100).toFixed(1)}%`
    : '—';

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">
            Good day, {user?.full_name || user?.username} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Here's your forecasting overview</p>
        </div>
        <div className="text-xs text-slate-400 bg-white border border-slate-100 rounded-lg px-3 py-2">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🗄️" label="Datasets" value={analytics?.total_datasets ?? 0} sub="Uploaded" color="text-primary-700" />
        <StatCard icon="🤖" label="Forecasts" value={analytics?.total_forecasts ?? 0} sub="Total runs" color="text-indigo-700" />
        <StatCard icon="✅" label="Completed" value={analytics?.completed_forecasts ?? 0} sub="Successful" color="text-emerald-700" />
        <StatCard icon="🎯" label="Avg R²" value={accuracy} sub="Model accuracy" color="text-amber-700" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly trend */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-display font-semibold text-slate-700 mb-4">Monthly Forecast Runs</h3>
          {analytics?.monthly_forecast_trend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.monthly_forecast_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-300 text-sm">No data yet</div>
          )}
        </div>

        {/* Recent forecasts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-display font-semibold text-slate-700 mb-4">Recent Forecasts</h3>
          {analytics?.recent_forecasts?.length > 0 ? (
            <div className="space-y-2">
              {analytics.recent_forecasts.map(f => (
                <div key={f.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{f.model_type === 'prophet' ? '🔮' : '📈'}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-700 capitalize">{f.model_type.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-400">{f.created_at?.slice(0, 10)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      f.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                      f.status === 'error' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>{f.status}</span>
                    {f.r2_score != null && (
                      <p className="text-xs text-slate-400 mt-0.5">R² {f.r2_score.toFixed(3)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-300 text-sm">Run your first forecast</div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-display font-semibold text-slate-700 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/datasets', label: 'Upload Dataset', icon: '📤', color: 'bg-primary-50 text-primary-700 hover:bg-primary-100' },
            { href: '/forecast', label: 'Run Forecast', icon: '🚀', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
            { href: '/reports', label: 'View Reports', icon: '📋', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
          ].map(({ href, label, icon, color }) => (
            <a key={href} href={href} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${color}`}>
              <span>{icon}</span>{label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
