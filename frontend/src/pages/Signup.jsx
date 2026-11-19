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

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

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
      <form className="card shadow-sm auth-card p-4" onSubmit={onSubmit} noValidate>
        <h1 className="h3 mb-3">Create account</h1>
        {error && <p className="alert alert-danger" role="alert">{error}</p>}
        <div className="mb-3"><label className="form-label" htmlFor="username">Username</label>
          <input id="username" className={`form-control ${errors.username ? 'is-invalid' : ''}`} value={form.username} onChange={set('username')} autoComplete="username" autoFocus />
          {errors.username && <div className="invalid-feedback">{errors.username}</div>}</div>
        <div className="mb-3"><label className="form-label" htmlFor="email">Email</label>
          <input id="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} type="email" value={form.email} onChange={set('email')} autoComplete="email" />
          {errors.email && <div className="invalid-feedback">{errors.email}</div>}</div>
        <div className="mb-3"><label className="form-label" htmlFor="password">Password</label>
          <input id="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
          {errors.password && <div className="invalid-feedback">{errors.password}</div>}</div>
        <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
        <p className="text-secondary mt-3 mb-0 text-center">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
