import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';

export default function Login() {
  const { login, sessionNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ identifier: location.state?.username || '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.identifier.trim() || !form.password) return setError('Enter your username/email and password');
    setBusy(true);
    try {
      const id = form.identifier.trim();
      await login({ [id.includes('@') ? 'email' : 'username']: id, password: form.password });
      navigate(location.state?.from?.pathname || '/employees', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card shadow-sm auth-card p-4" onSubmit={onSubmit} noValidate>
        <h1 className="h3 mb-3">Log in</h1>
        {location.state?.registered && <p className="alert alert-success">Account created. Please log in.</p>}
        {sessionNotice && <p className="alert alert-warning">{sessionNotice}</p>}
        {error && <p className="alert alert-danger" role="alert">{error}</p>}
        <div className="mb-3"><label className="form-label" htmlFor="identifier">Username or email</label>
          <input id="identifier" className="form-control" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} autoComplete="username" autoFocus /></div>
        <div className="mb-3"><label className="form-label" htmlFor="password">Password</label>
          <input id="password" className="form-control" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" /></div>
        <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="text-secondary mt-3 mb-0 text-center">No account? <Link to="/signup">Sign up</Link></p>
      </form>
    </div>
  );
}
