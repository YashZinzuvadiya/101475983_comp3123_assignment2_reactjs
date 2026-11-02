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
      <form className="card auth-card" onSubmit={onSubmit} noValidate>
        <h1>Log in</h1>
        {location.state?.registered && <p className="alert alert-ok">Account created. Please log in.</p>}
        {sessionNotice && <p className="alert alert-warn">{sessionNotice}</p>}
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <label>Username or email
          <input value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} autoComplete="username" autoFocus />
        </label>
        <label>Password
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
        </label>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="muted">No account? <Link to="/signup">Sign up</Link></p>
      </form>
    </div>
  );
}
