import React, { useEffect, useState, useRef } from 'react';
import API from '../api/axios.js';

export default function Datasets() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef();

  const fetchDatasets = () => {
    API.get('/api/datasets/')
      .then(r => setDatasets(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDatasets(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setError(''); setSuccess('');
    const form = new FormData();
    form.append('file', file);
    try {
      await API.post('/api/datasets/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Dataset uploaded and processed successfully!');
      fetchDatasets();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  };

  const handlePreview = async (id) => {
    setPreviewLoading(true); setPreview(null);
    try {
      const { data } = await API.get(`/api/datasets/${id}/preview`);
      setPreview(data);
    } catch (err) {
      setError('Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this dataset?')) return;
    try {
      await API.delete(`/api/datasets/${id}`);
      setSuccess('Dataset deleted');
      setDatasets(ds => ds.filter(d => d.id !== id));
      setPreview(null);
    } catch { setError('Delete failed'); }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Datasets</h1>
        <p className="text-slate-500 text-sm mt-0.5">Upload and manage your sales datasets</p>
      </div>

      {/* Upload area */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-primary-200 p-8 text-center hover:border-primary-400 transition-colors">
        <div className="text-4xl mb-3">📤</div>
        <h3 className="font-semibold text-slate-700 mb-1">Upload Dataset</h3>
        <p className="text-slate-400 text-sm mb-4">CSV or Excel files (.csv, .xlsx, .xls)</p>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} className="hidden" id="file-input" />
        <label htmlFor="file-input" className={`inline-flex items-center gap-2 gradient-bg text-white px-5 py-2.5 rounded-lg font-medium text-sm cursor-pointer hover:opacity-90 transition ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
          {uploading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin"></span>Processing...</> : '+ Choose File'}
        </label>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">{success}</div>}

      {/* Dataset list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-display font-semibold text-slate-700">Your Datasets ({datasets.length})</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center"><span className="w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full spin inline-block"></span></div>
        ) : datasets.length === 0 ? (
          <div className="p-12 text-center text-slate-300 text-sm">No datasets uploaded yet</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {datasets.map(ds => (
              <div key={ds.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🗄️</span>
                  <div>
                    <p className="font-medium text-slate-700 text-sm">{ds.original_filename}</p>
                    <p className="text-xs text-slate-400">{ds.row_count} rows · {ds.column_count} columns · {ds.created_at?.slice(0,10)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ds.status === 'processed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
                    {ds.status}
                  </span>
                  <button onClick={() => handlePreview(ds.id)} className="text-xs text-primary-600 hover:underline font-medium px-2 py-1">Preview</button>
                  <button onClick={() => handleDelete(ds.id)} className="text-xs text-red-500 hover:underline font-medium px-2 py-1">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      {previewLoading && <div className="text-center py-4"><span className="w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full spin inline-block"></span></div>}
      {preview && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-slate-700">Dataset Preview</h3>
              <p className="text-xs text-slate-400 mt-0.5">{preview.total_rows} total rows · First 50 shown</p>
            </div>
            <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
          </div>

          {/* Column info */}
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-2">
            {preview.columns.map(col => (
              <span key={col} className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-600 font-mono">
                {col} <span className="text-slate-400">({preview.dtypes[col]})</span>
                {preview.missing_values[col] > 0 && <span className="text-red-400 ml-1">⚠ {preview.missing_values[col]}</span>}
              </span>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {preview.columns.map(col => (
                    <th key={col} className="text-left px-4 py-2.5 font-semibold text-slate-600 border-b border-slate-100 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    {preview.columns.map(col => (
                      <td key={col} className="px-4 py-2 text-slate-600 font-mono whitespace-nowrap max-w-32 truncate">{String(row[col] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
