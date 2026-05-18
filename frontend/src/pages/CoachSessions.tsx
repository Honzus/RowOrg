import { useCallback, useEffect, useMemo, useState } from 'react';
import { createSession, getSessions } from '../api/sessions';
import type { Session } from '../types';
import SessionRow from '../components/cards/SessionRow';
import SectionTitle from '../components/SectionTitle';
import Icon from '../components/Icon';
import { addDays, formatISODate, mondayOf, weekLabel, parseISODate } from '../lib/dates';

export default function CoachSessions() {
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: formatISODate(new Date()), start_time: '06:00', end_time: '08:00', description: '' });
  const [saving, setSaving] = useState(false);

  const weekISO = formatISODate(weekStart);

  const reload = useCallback(() => {
    void getSessions(weekISO).then(setSessions);
  }, [weekISO]);

  useEffect(() => {
    reload();
  }, [reload]);

  const grouped = useMemo(() => {
    const byDay = new Map<string, Session[]>();
    for (const s of sessions) {
      const key = s.date;
      const arr = byDay.get(key) ?? [];
      arr.push(s);
      byDay.set(key, arr);
    }
    return Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [sessions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createSession(form);
      setShowForm(false);
      setForm({ ...form, description: '' });
      reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">PRACTICE SCHEDULE · {weekLabel(weekStart).toUpperCase()}</div>
          <h2>Sessions</h2>
        </div>
        <div className="spacer"></div>
        <div className="week">
          <button className="btn ghost icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <Icon name="chevL" size={14} />
          </button>
          <button className="btn ghost sm" onClick={() => setWeekStart(mondayOf(new Date()))}>
            This week
          </button>
          <button className="btn ghost icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <Icon name="chevR" size={14} />
          </button>
        </div>
        <button className="btn primary" onClick={() => setShowForm((s) => !s)}>
          <Icon name="plus" size={13} /> {showForm ? 'Cancel' : 'New session'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: 12, alignItems: 'end' }}>
              <div className="field">
                <label className="field-label">Date</label>
                <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="field">
                <label className="field-label">Start</label>
                <input className="input" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
              </div>
              <div className="field">
                <label className="field-label">End</label>
                <input className="input" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
              </div>
              <div className="field" style={{ gridColumn: 'span 1' }}>
                <label className="field-label">Workout</label>
                <input className="input" placeholder="6×8 min @ rate 20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <button className="btn primary" type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}

      <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 620, marginBottom: 16 }}>
        Click any row to open the suggestions engine, assigned crews, and crew builder.
      </p>

      {sessions.length === 0 ? (
        <div className="empty-state">No sessions scheduled this week. Create one above or use the Plan page.</div>
      ) : (
        grouped.map(([date, day]) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <SectionTitle title={parseISODate(date).toDateString()} hint={`${day.length} session${day.length === 1 ? '' : 's'}`} />
            {day.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </div>
        ))
      )}
    </>
  );
}
