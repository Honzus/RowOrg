import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTeam, joinTeam } from '../api/teams';
import { useUser } from '../hooks/userContext';

export default function TeamSetup() {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { reload } = useUser();

  const afterJoin = async () => {
    await reload();
    navigate('/home');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await createTeam(name);
      await afterJoin();
    } catch {
      setError('Failed to create team');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await joinTeam(code);
      await afterJoin();
    } catch {
      setError('Invalid invite code');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-mark">R</div>
          <div className="brand-name">
            roworg<span>.</span>
          </div>
        </div>
        {mode === 'choose' && (
          <>
            <h1>Join or create a team</h1>
            <p className="sub">Every rower belongs to one team. Coaches manage it.</p>
            <button className="btn primary lg" onClick={() => setMode('create')}>
              Create a new team
            </button>
            <button className="btn lg" onClick={() => setMode('join')}>
              Join with invite code
            </button>
          </>
        )}
        {mode === 'create' && (
          <>
            <h1>Create a team</h1>
            <p className="sub">You'll be the founding coach. Invite rowers later with the team code.</p>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="field">
                <label className="field-label">Team name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              </div>
              <button className="btn primary lg" type="submit" disabled={busy}>
                {busy ? 'Creating…' : 'Create team'}
              </button>
            </form>
            <button className="btn ghost" onClick={() => setMode('choose')}>
              ← Back
            </button>
          </>
        )}
        {mode === 'join' && (
          <>
            <h1>Join a team</h1>
            <p className="sub">Paste the 8-character invite code from your coach.</p>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleJoin}>
              <div className="field">
                <label className="field-label">Invite code</label>
                <input
                  className="input mono"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  autoFocus
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
                />
              </div>
              <button className="btn primary lg" type="submit" disabled={busy}>
                {busy ? 'Joining…' : 'Join team'}
              </button>
            </form>
            <button className="btn ghost" onClick={() => setMode('choose')}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
