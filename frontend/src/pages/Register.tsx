import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, login } from '../api/auth';
import { useUser } from '../hooks/userContext';

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { reload } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      await login(form.email, form.password);
      await reload();
      navigate('/home');
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      setError(
        e.response?.data?.email?.[0] ||
          e.response?.data?.password?.[0] ||
          e.response?.data?.username?.[0] ||
          'Registration failed'
      );
    } finally {
      setBusy(false);
    }
  };

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-mark">R</div>
          <div className="brand-name">
            roworg<span>.</span>
          </div>
        </div>
        <h1>Create your account</h1>
        <p className="sub">Coaches and rowers — same login.</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="field-label">First name</label>
              <input className="input" value={form.first_name} onChange={update('first_name')} required />
            </div>
            <div className="field">
              <label className="field-label">Last name</label>
              <input className="input" value={form.last_name} onChange={update('last_name')} required />
            </div>
          </div>
          <div className="field">
            <label className="field-label">Username</label>
            <input className="input" value={form.username} onChange={update('username')} required />
          </div>
          <div className="field">
            <label className="field-label">Email</label>
            <input className="input" type="email" value={form.email} onChange={update('email')} required />
          </div>
          <div className="field">
            <label className="field-label">Password</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={update('password')}
              required
              minLength={8}
            />
          </div>
          <button className="btn primary lg" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <div className="alt-link">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
