import React, { useEffect, useState } from 'react';
import API from '../api/axios.js';

export default function Reports() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    API.get('/api/forecasts/')
      .then(r => setForecasts(r.data.filter(f => f.status === 'completed')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const download = async (forecastId, type) => {
    const key = `${forecastId}-${type}`;
    setDownloading(d => ({ ...d, [key]: true }));
    setError(''); setSuccess('');
    try {
      const response = await API.get(`/api/reports/${forecastId}/${type}`, { responseType: 'blob' });
      const ext = type === 'excel' ? 'xlsx' : 'pdf';
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `forecast_${forecastId}_report.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(`Downloaded ${type.toUpperCase()} report for Forecast #${forecastId}`);
    } catch (err) {
      setError(`Failed to download ${type} report`);
    } finally {
      setDownloading(d => ({ ...d, [key]: false }));
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Reports</h1>
        <p className="text-slate-500 text-sm mt-0.5">Export forecast reports in Excel or PDF format</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">✅ {success}</div>}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="text-2xl mb-2">📊</div>
          <p className="font-display font-bold text-2xl text-slate-800">{forecasts.length}</p>
          <p className="text-slate-500 text-sm">Completed Forecasts</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="text-2xl mb-2">🎯</div>
          <p className="font-display font-bold text-2xl text-slate-800">
            {forecasts.length > 0
              ? `${(forecasts.reduce((s, f) => s + (f.r2_score || 0), 0) / forecasts.length * 100).toFixed(1)}%`
              : '—'}
          </p>
          <p className="text-slate-500 text-sm">Avg R² Score</p>
        </div>
      </div>

      {/* Report list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-display font-semibold text-slate-700">Available Reports</h3>
          <p className="text-xs text-slate-400 mt-0.5">Only completed forecasts can be exported</p>
        </div>

        {loading ? (
          <div className="p-8 text-center"><span className="w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full spin inline-block"></span></div>
        ) : forecasts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-400 text-sm">No completed forecasts yet</p>
            <p className="text-slate-300 text-xs mt-1">Run a forecast first, then export reports here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {forecasts.map(f => (
              <div key={f.id} className="px-5 py-4 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl shrink-0">
                      {f.model_type === 'prophet' ? '🔮' : '📈'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">
                        Forecast #{f.id} — <span className="capitalize">{f.model_type.replace('_', ' ')}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Target: <strong>{f.target_column}</strong> · {f.periods} days · Created {f.created_at?.slice(0, 10)}
                      </p>
                      <div className="flex gap-3 mt-1">
                        {f.accuracy != null && (
                          <span className="text-xs text-slate-500">MAE: <strong className="text-slate-700">{f.accuracy.toFixed(4)}</strong></span>
                        )}
                        {f.r2_score != null && (
                          <span className="text-xs text-slate-500">R²: <strong className="text-primary-700">{f.r2_score.toFixed(4)}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Download buttons */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => download(f.id, 'excel')}
                      disabled={downloading[`${f.id}-excel`]}
                      className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-60"
                    >
                      {downloading[`${f.id}-excel`]
                        ? <span className="w-3 h-3 border-2 border-emerald-300 border-t-emerald-700 rounded-full spin"></span>
                        : '📊'}
                      Excel
                    </button>
                    <button
                      onClick={() => download(f.id, 'pdf')}
                      disabled={downloading[`${f.id}-pdf`]}
                      className="flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-60"
                    >
                      {downloading[`${f.id}-pdf`]
                        ? <span className="w-3 h-3 border-2 border-red-200 border-t-red-600 rounded-full spin"></span>
                        : '📄'}
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5">
        <h4 className="font-semibold text-primary-800 text-sm mb-2">📋 Report Contents</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-primary-700">
          <div className="bg-white rounded-lg p-3">
            <p className="font-semibold mb-1">📊 Excel Report</p>
            <ul className="space-y-0.5 text-primary-600">
              <li>• Summary metrics sheet</li>
              <li>• Future predictions sheet</li>
              <li>• Historical data sheet</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="font-semibold mb-1">📄 PDF Report</p>
            <ul className="space-y-0.5 text-primary-600">
              <li>• Forecast summary table</li>
              <li>• Model metrics (MAE, R²)</li>
              <li>• First 20 future predictions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
