import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../api/auth';
import { useUser } from '../hooks/userContext';
import type { User } from '../types';

export default function ProfileSetup() {
  const { user, setUser, reload } = useUser();
  const navigate = useNavigate();
  const [role, setRole] = useState<User['role']>(user?.role || '');
  const [rowingType, setRowingType] = useState<User['rowing_type']>(user?.rowing_type || '');
  const [sweepSide, setSweepSide] = useState<User['sweep_side']>(user?.sweep_side || '');
  const [canCox, setCanCox] = useState(user?.can_cox || false);
  const [weight, setWeight] = useState(user?.weight?.toString() || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const updated = await updateProfile({
        role,
        rowing_type: rowingType,
        sweep_side: sweepSide,
        can_cox: canCox,
        weight: weight ? parseFloat(weight) : null,
      });
      // Update local user state synchronously with the server response so
      // RequireAuth at /home sees the new role on the next render.
      setUser(updated);
      void reload();
      navigate('/home', { replace: true });
    } catch {
      setError('Failed to update profile');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <h1>Complete your profile</h1>
        <p className="sub">Tells the coach (and the suggestion engine) what boat seats you can take.</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label">Role</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value as User['role'])} required>
              <option value="">Select…</option>
              <option value="coach">Coach</option>
              <option value="oarsman">Oarsman</option>
              <option value="coxswain">Coxswain</option>
            </select>
          </div>

          {(role === 'oarsman' || role === 'coxswain') && (
            <>
              <div className="field">
                <label className="field-label">Rowing type</label>
                <select
                  className="input"
                  value={rowingType}
                  onChange={(e) => setRowingType(e.target.value as User['rowing_type'])}
                >
                  <option value="">Select…</option>
                  <option value="sculling">Sculling</option>
                  <option value="sweeping">Sweeping</option>
                  <option value="both">Both</option>
                </select>
              </div>

              {(rowingType === 'sweeping' || rowingType === 'both') && (
                <div className="field">
                  <label className="field-label">Sweep side</label>
                  <select
                    className="input"
                    value={sweepSide}
                    onChange={(e) => setSweepSide(e.target.value as User['sweep_side'])}
                  >
                    <option value="">Select…</option>
                    <option value="port">Port</option>
                    <option value="starboard">Starboard</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              )}

              <div className="field">
                <label className="field-label">Weight (kg, optional)</label>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </>
          )}

          {role === 'oarsman' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-1)' }}>
              <input type="checkbox" checked={canCox} onChange={(e) => setCanCox(e.target.checked)} />
              I can also cox
            </label>
          )}

          <button className="btn primary lg" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
