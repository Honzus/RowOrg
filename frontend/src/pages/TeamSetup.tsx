import { useState } from 'react';
import { createTeam, joinTeam } from '../api/teams';

interface Props {
  onComplete: () => void;
}

export default function TeamSetup({ onComplete }: Props) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTeam(name);
      onComplete();
    } catch {
      setError('Failed to create team');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await joinTeam(code);
      onComplete();
    } catch {
      setError('Invalid invite code');
    }
  };

  if (mode === 'choose') {
    return (
      <div className="setup-page">
        <h2>Join or Create a Team</h2>
        <button onClick={() => setMode('create')}>Create a New Team</button>
        <button onClick={() => setMode('join')}>Join with Invite Code</button>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="setup-page">
        <h2>Create a Team</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleCreate}>
          <input placeholder="Team Name" value={name} onChange={e => setName(e.target.value)} required />
          <button type="submit">Create</button>
        </form>
        <button onClick={() => setMode('choose')}>Back</button>
      </div>
    );
  }

  return (
    <div className="setup-page">
      <h2>Join a Team</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleJoin}>
        <input placeholder="Invite Code" value={code} onChange={e => setCode(e.target.value)} required />
        <button type="submit">Join</button>
      </form>
      <button onClick={() => setMode('choose')}>Back</button>
    </div>
  );
}
