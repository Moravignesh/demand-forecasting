import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex gradient-bg">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center px-16 w-1/2 text-white">
        <div className="mb-6 text-5xl">⚡</div>
        <h1 className="font-display text-5xl font-bold leading-tight mb-4">
          Predict Tomorrow's<br />Demand Today
        </h1>
        <p className="text-white/70 text-lg max-w-md">
          AI-powered forecasting that transforms your historical sales data into accurate future demand predictions.
        </p>
        <div className="mt-10 grid grid-cols-3 gap-4">
          {[['📈','ML Models','Linear Regression & Prophet'],['📊','Analytics','Real-time dashboards'],['📄','Reports','Excel & PDF exports']].map(([icon,title,sub])=>(
            <div key={title} className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl mb-2">{icon}</div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-white/60 text-xs mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-navy-800">Welcome back</h2>
            <p className="text-slate-500 mt-1 text-sm">Sign in to your DemandAI account</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input
                name="username" value={form.username} onChange={handleChange}
                placeholder="Enter your username"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password" name="password" value={form.password} onChange={handleChange}
                placeholder="Enter your password"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                required
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full gradient-bg text-white py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin inline-block"></span>Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
