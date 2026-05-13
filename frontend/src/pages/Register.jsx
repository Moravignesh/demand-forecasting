import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex gradient-bg">
      <div className="hidden lg:flex flex-col justify-center px-16 w-1/2 text-white">
        <div className="mb-6 text-5xl">⚡</div>
        <h1 className="font-display text-5xl font-bold leading-tight mb-4">
          Start Forecasting<br />with Confidence
        </h1>
        <p className="text-white/70 text-lg max-w-md">
          Join DemandAI and get accurate demand predictions powered by machine learning.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-navy-800">Create Account</h2>
            <p className="text-slate-500 mt-1 text-sm">Get started with DemandAI for free</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name: 'full_name',  label: 'Full Name',  type: 'text',     placeholder: 'John Doe',          required: false },
              { name: 'username',   label: 'Username',   type: 'text',     placeholder: 'johndoe',            required: true  },
              { name: 'email',      label: 'Email',      type: 'email',    placeholder: 'john@example.com',   required: true  },
              { name: 'password',   label: 'Password',   type: 'password', placeholder: 'Min 6 characters',   required: true  },
            ].map(({ name, label, type, placeholder, required }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input
                  type={type} name={name} value={form[name]} onChange={handleChange}
                  placeholder={placeholder} required={required}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
            ))}
            <button
              type="submit" disabled={loading}
              className="w-full gradient-bg text-white py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin inline-block"></span>Creating...</> : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
