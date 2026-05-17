import { useState, useEffect } from 'react';
import type { User, Session as SessionType } from '../types';
import { getSessions, createSession } from '../api/sessions';
import SessionView from '../components/SessionView';

interface Props {
  user: User;
}

export default function CoachDashboard({ user }: Props) {
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newSession, setNewSession] = useState({ date: '', start_time: '', end_time: '', description: '' });
  const [selectedSession, setSelectedSession] = useState<SessionType | null>(null);

  const loadSessions = async () => {
    const data = await getSessions();
    setSessions(data);
  };

  useEffect(() => { loadSessions(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSession(newSession);
    setShowCreate(false);
    setNewSession({ date: '', start_time: '', end_time: '', description: '' });
    loadSessions();
  };

  if (selectedSession) {
    return (
      <div>
        <button onClick={() => { setSelectedSession(null); loadSessions(); }}>Back to Sessions</button>
        <SessionView session={selectedSession} user={user} />
      </div>
    );
  }

  return (
    <div className="coach-dashboard">
      <h2>Practice Sessions</h2>
      <button onClick={() => setShowCreate(!showCreate)}>
        {showCreate ? 'Cancel' : 'Create Session'}
      </button>

      {showCreate && (
        <form onSubmit={handleCreate} className="create-session-form">
          <input type="date" value={newSession.date} onChange={e => setNewSession({ ...newSession, date: e.target.value })} required />
          <input type="time" value={newSession.start_time} onChange={e => setNewSession({ ...newSession, start_time: e.target.value })} required />
          <input type="time" value={newSession.end_time} onChange={e => setNewSession({ ...newSession, end_time: e.target.value })} required />
          <textarea
            placeholder="Workout description (e.g. 4x1000m at rate 28)"
            value={newSession.description}
            onChange={e => setNewSession({ ...newSession, description: e.target.value })}
            rows={2}
          />
          <button type="submit">Create</button>
        </form>
      )}

      <div className="sessions-list">
        {sessions.length === 0 && <p>No sessions yet.</p>}
        {sessions.map(s => (
          <div key={s.id} className="session-card" onClick={() => setSelectedSession(s)}>
            <div>
              <strong>{s.date}</strong>
              <span>{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</span>
              <span>{s.crews.length} crew(s)</span>
            </div>
            {s.description && <div className="session-description">{s.description}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
