import React, { useEffect, useState } from 'react';
import API from '../api/axios.js';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';

export default function Forecast() {
  const [datasets, setDatasets] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [form, setForm] = useState({ dataset_id: '', model_type: 'linear_regression', periods: 30, target_column: '', date_column: '' });
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedForecast, setSelectedForecast] = useState(null);
  const [predictions, setPredictions] = useState(null);

  useEffect(() => {
    API.get('/api/datasets/').then(r => setDatasets(r.data));
    API.get('/api/forecasts/').then(r => setForecasts(r.data));
  }, []);

  const handleDatasetChange = async (e) => {
    const id = e.target.value;
    setForm(f => ({ ...f, dataset_id: id, target_column: '', date_column: '' }));
    setColumns([]);
    if (!id) return;
    try {
      const { data } = await API.get(`/api/datasets/${id}/preview`);
      setColumns(data.columns);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.dataset_id || !form.target_column || !form.date_column) {
      setError('Please fill all required fields'); return;
    }
    setError(''); setSuccess(''); setLoading(true);
    try {
      const { data } = await API.post('/api/forecasts/', {
        ...form,
        dataset_id: parseInt(form.dataset_id),
        periods: parseInt(form.periods)
      });
      setForecasts(prev => [data, ...prev]);
      setSuccess('Forecast completed! Click "View" to see results.');
      if (data.status === 'completed') {
        await loadPredictions(data.id);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Forecast failed');
    } finally {
      setLoading(false);
    }
  };

  const loadPredictions = async (forecastId) => {
    try {
      const { data } = await API.get(`/api/forecasts/${forecastId}/predictions`);
      setPredictions(data);
      setSelectedForecast(forecastId);
    } catch (err) {
      setError('Could not load predictions');
    }
  };

  // Combine historical + future for chart
  const chartData = (() => {
    if (!predictions) return [];
    const hist = (predictions.historical || []).map(d => ({ date: d.date, actual: d.actual, predicted: d.predicted }));
    const splitDate = hist.length > 0 ? hist[hist.length - 1].date : null;
    const future = (predictions.future || []).map(d => ({ date: d.date, forecast: d.predicted }));
    return [...hist, ...future];
  })();

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">AI Forecasting</h1>
        <p className="text-slate-500 text-sm mt-0.5">Train models and generate demand predictions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-display font-semibold text-slate-700 mb-4">Configure Forecast</h3>
            {error && <div className="mb-3 bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-xs">{error}</div>}
            {success && <div className="mb-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-2 text-xs">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Dataset *</label>
                <select value={form.dataset_id} onChange={handleDatasetChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Select dataset</option>
                  {datasets.map(d => <option key={d.id} value={d.id}>{d.original_filename}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Model Type *</label>
                <select value={form.model_type} onChange={e => setForm(f => ({ ...f, model_type: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="linear_regression">📈 Linear Regression</option>
                  <option value="prophet">🔮 Prophet (Facebook)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date Column *</label>
                <select value={form.date_column} onChange={e => setForm(f => ({ ...f, date_column: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Select date column</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Target Column *</label>
                <select value={form.target_column} onChange={e => setForm(f => ({ ...f, target_column: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Select target column</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Forecast Periods (days) *</label>
                <input
                  type="number" min={1} max={365} value={form.periods}
                  onChange={e => setForm(f => ({ ...f, periods: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button type="submit" disabled={loading}
                className="w-full gradient-bg text-white py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin"></span>Training & Predicting...</> : '🚀 Run Forecast'}
              </button>
            </form>
          </div>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Chart */}
          {predictions && chartData.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in">
              <h3 className="font-display font-semibold text-slate-700 mb-1">Prediction Chart</h3>
              <p className="text-xs text-slate-400 mb-4">Historical fit + Future forecast</p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={1.5} dot={false} name="Actual" />
                  <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Historical Fit" />
                  <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 3" name="Forecast" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Future predictions table */}
          {predictions?.future && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-display font-semibold text-slate-700">Future Predictions ({predictions.future.length} days)</h3>
              </div>
              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600">#</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Date</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Predicted Demand</th>
                      {predictions.future[0]?.lower !== undefined && <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Lower</th>}
                      {predictions.future[0]?.upper !== undefined && <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Upper</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.future.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-4 py-2 font-mono text-slate-600">{row.date}</td>
                        <td className="px-4 py-2 font-semibold text-primary-700">{row.predicted}</td>
                        {row.lower !== undefined && <td className="px-4 py-2 text-slate-400">{row.lower}</td>}
                        {row.upper !== undefined && <td className="px-4 py-2 text-slate-400">{row.upper}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Past forecasts */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-display font-semibold text-slate-700">Past Forecasts</h3>
            </div>
            {forecasts.length === 0 ? (
              <div className="p-8 text-center text-slate-300 text-sm">No forecasts yet</div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
                {forecasts.map(f => (
                  <div key={f.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <span>{f.model_type === 'prophet' ? '🔮' : '📈'}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-700 capitalize">{f.model_type.replace('_',' ')} — {f.periods}d</p>
                        <p className="text-xs text-slate-400">{f.target_column} · {f.created_at?.slice(0,10)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${f.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : f.status === 'error' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                        {f.status}
                      </span>
                      {f.r2_score != null && <span className="text-xs text-slate-400">R² {f.r2_score.toFixed(3)}</span>}
                      {f.status === 'completed' && (
                        <button onClick={() => loadPredictions(f.id)} className="text-xs text-primary-600 hover:underline font-medium">View</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
