import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Emblem } from '../components/layout/GovHeader.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="tricolor" />
      <div className="login-main">
        <div className="card login-card">
          <div className="card-body">
            <div style={{ display: 'flex', gap: '.8rem', alignItems: 'center' }}>
              <Emblem />
              <div>
                <div className="small muted">Forest Department, Government of Maharashtra</div>
                <h1 style={{ fontSize: '1.25rem' }}>Tadoba Andhari Tiger Reserve Monitoring Portal</h1>
              </div>
            </div>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
              {error && <div className="form-error" role="alert">{error}</div>}
              <div className="field">
                <label htmlFor="email">Official email</label>
                <input id="email" className="input" type="email" autoComplete="username" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" className="input" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-green" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
            </form>
            <div className="notice">For authorised forest department personnel only. Activity on this portal may be logged.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
