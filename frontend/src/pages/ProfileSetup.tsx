import { useState } from 'react';
import { updateProfile } from '../api/auth';
import type { User } from '../types';

interface Props {
  user: User;
  onComplete: () => void;
}

export default function ProfileSetup({ user, onComplete }: Props) {
  const [role, setRole] = useState(user.role || '');
  const [rowingType, setRowingType] = useState(user.rowing_type || '');
  const [sweepSide, setSweepSide] = useState(user.sweep_side || '');
  const [canCox, setCanCox] = useState(user.can_cox);
  const [weight, setWeight] = useState(user.weight?.toString() || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        role: role as User['role'],
        rowing_type: rowingType as User['rowing_type'],
        sweep_side: sweepSide as User['sweep_side'],
        can_cox: canCox,
        weight: weight ? parseFloat(weight) : null,
      });
      onComplete();
    } catch {
      setError('Failed to update profile');
    }
  };

  return (
    <div className="setup-page">
      <h2>Complete Your Profile</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Role:
          <select value={role} onChange={e => setRole(e.target.value)} required>
            <option value="">Select...</option>
            <option value="coach">Coach</option>
            <option value="oarsman">Oarsman</option>
            <option value="coxswain">Coxswain</option>
          </select>
        </label>

        {(role === 'oarsman' || role === 'coxswain') && (
          <>
            <label>
              Rowing Type:
              <select value={rowingType} onChange={e => setRowingType(e.target.value)}>
                <option value="">Select...</option>
                <option value="sculling">Sculling</option>
                <option value="sweeping">Sweeping</option>
                <option value="both">Both</option>
              </select>
            </label>

            {(rowingType === 'sweeping' || rowingType === 'both') && (
              <label>
                Sweep Side:
                <select value={sweepSide} onChange={e => setSweepSide(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="port">Port</option>
                  <option value="starboard">Starboard</option>
                  <option value="both">Both</option>
                </select>
              </label>
            )}

            <label>
              Weight (kg, optional):
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} step="0.1" />
            </label>
          </>
        )}

        {role === 'oarsman' && (
          <label className="checkbox-label">
            <input type="checkbox" checked={canCox} onChange={e => setCanCox(e.target.checked)} />
            I can also cox
          </label>
        )}

        <button type="submit">Save Profile</button>
      </form>
    </div>
  );
}
