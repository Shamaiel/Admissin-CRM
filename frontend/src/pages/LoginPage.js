import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
            Edu<span style={{ color: '#6366f1' }}>Merge</span>
          </div>
          <div style={{ color: '#94a3b8', marginTop: 6, fontSize: '0.9rem' }}>Admission Management & CRM</div>
        </div>

        <div className="card" style={{ borderRadius: 16, padding: '32px' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 24, color: '#0f172a' }}>Sign in to your account</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Email Address</label>
              <input className="form-control" type="email" placeholder="you@edumerge.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Password</label>
              <input className="form-control" type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: '14px', background: '#f8fafc', borderRadius: 8, fontSize: '0.78rem', color: '#64748b' }}>
            <strong style={{ display: 'block', marginBottom: 6, color: '#374151' }}>Test Credentials</strong>
            <div>Admin: <code>admin@edumerge.com</code> / <code>admin123</code></div>
            <div>Officer: <code>officer@edumerge.com</code> / <code>officer123</code></div>
            <div>Management: <code>mgmt@edumerge.com</code> / <code>mgmt123</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}
