import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, login } from '../api/auth';

export default function Register() {
  const [form, setForm] = useState({ email: '', username: '', password: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.email?.[0] || err.response?.data?.password?.[0] || 'Registration failed');
    }
  };

  return (
    <div className="auth-page">
      <h1>RowOrg</h1>
      <h2>Register</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input placeholder="First Name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
        <input placeholder="Last Name" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
        <input placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
        <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
