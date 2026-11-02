import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';

// Mirrors the backend rules so users get instant feedback (the server still validates everything)
function validate({ username, email, password }) {
  const errs = {};
  if (username.trim().length < 3 || username.trim().length > 30) errs.username = 'Username must be 3-30 characters';
  if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Enter a valid email address';
  if (password.length < 8 || password.length > 72) errs.password = 'Password must be 8-72 characters';
  else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password))
    errs.password = 'Password needs an uppercase letter, a lowercase letter and a number';
  return errs;
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await signup({ ...form, username: form.username.trim(), email: form.email.trim() });
      navigate('/login', { state: { registered: true, username: form.username.trim() } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={onSubmit} noValidate>
        <h1>Create account</h1>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <label>Username
          <input value={form.username} onChange={set('username')} autoComplete="username" autoFocus />
          {errors.username && <span className="field-error">{errors.username}</span>}
        </label>
        <label>Email
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>
        <label>Password
          <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
        <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
