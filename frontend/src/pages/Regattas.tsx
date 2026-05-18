import { useEffect, useState } from 'react';
import { useUser } from '../hooks/userContext';
import { getRegattas, createRegatta, deleteRegatta, updateRegatta } from '../api/regattas';
import type { Regatta } from '../types';
import { MONTHS, parseISODate, formatISODate } from '../lib/dates';
import { StatusBadge } from '../components/Badges';
import Icon from '../components/Icon';

function daysUntil(iso: string): number {
  const target = parseISODate(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export default function Regattas() {
  const { user } = useUser();
  const [regattas, setRegattas] = useState<Regatta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    date: formatISODate(new Date()),
    location: '',
    registered: false,
    crews_entered: 0,
    note: '',
  });

  const isCoach = user?.role === 'coach';

  useEffect(() => {
    let cancelled = false;
    void getRegattas()
      .then((r) => {
        if (!cancelled) setRegattas(r);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const created = await createRegatta(form);
      setRegattas((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
      setShowForm(false);
      setForm({ name: '', date: formatISODate(new Date()), location: '', registered: false, crews_entered: 0, note: '' });
    } catch {
      setError('Failed to add regatta. Coaches only.');
    } finally {
      setSaving(false);
    }
  };

  const toggleRegistered = async (r: Regatta) => {
    const updated = await updateRegatta(r.id, { registered: !r.registered });
    setRegattas((prev) => prev.map((x) => (x.id === r.id ? updated : x)));
  };

  const remove = async (r: Regatta) => {
    if (!confirm(`Delete "${r.name}"?`)) return;
    await deleteRegatta(r.id);
    setRegattas((prev) => prev.filter((x) => x.id !== r.id));
  };

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">UPCOMING · {regattas.length} SCHEDULED</div>
          <h2>Regattas</h2>
        </div>
        <div className="spacer"></div>
        {isCoach && (
          <button className="btn primary" onClick={() => setShowForm((s) => !s)}>
            <Icon name="plus" size={13} /> {showForm ? 'Cancel' : 'Add regatta'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
              {error && <div className="error-msg">{error}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12 }}>
                <div className="field">
                  <label className="field-label">Name</label>
                  <input
                    className="input"
                    placeholder="Bled Spring Sprint"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div className="field">
                  <label className="field-label">Date</label>
                  <input
                    className="input"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
                <div className="field">
                  <label className="field-label">Location</label>
                  <input
                    className="input"
                    placeholder="Lake Bled, SI"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Crews entered</label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={form.crews_entered}
                    onChange={(e) => setForm({ ...form, crews_entered: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Note</label>
                <input
                  className="input"
                  placeholder="Optional"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-1)' }}>
                <input
                  type="checkbox"
                  checked={form.registered}
                  onChange={(e) => setForm({ ...form, registered: e.target.checked })}
                />
                Already registered
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Add regatta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Loading regattas…</div>
      ) : regattas.length === 0 ? (
        <div className="empty-state">
          {isCoach ? 'No regattas yet. Click "Add regatta" to schedule one.' : 'No regattas scheduled by your coach yet.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
          {regattas.map((r) => {
            const dt = parseISODate(r.date);
            const days = daysUntil(r.date);
            const past = days < 0;
            return (
              <div key={r.id} className="lineup" style={{ display: 'block', opacity: past ? 0.55 : 1 }}>
                <span className="stripe" style={{ background: r.registered ? 'var(--accent)' : 'var(--text-3)' }}></span>
                <div className="lineup-top">
                  <div className="lineup-date">
                    <span className="d">{dt.getDate()}</span>
                    <span className="m">{MONTHS[dt.getMonth()]}</span>
                  </div>
                  <div className="lineup-info">
                    <div className="boat">{r.name}</div>
                    <div className="time">{r.location || '—'}</div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: past ? 'var(--bg-3)' : days < 30 ? 'var(--accent-soft)' : 'var(--bg-3)',
                      color: past ? 'var(--text-3)' : days < 30 ? 'var(--accent)' : 'var(--text-2)',
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                    }}
                  >
                    {past ? `${Math.abs(days)}d ago` : `${days}d`}
                  </div>
                </div>
                {r.note && (
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                    {r.note}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  {r.registered ? <StatusBadge status="confirmed" /> : <span className="badge"><span className="b-dot"></span>Open</span>}
                  <span className="muted mono" style={{ fontSize: 11 }}>
                    {r.crews_entered} crew{r.crews_entered === 1 ? '' : 's'} entered
                  </span>
                  <div className="spacer"></div>
                  {isCoach && (
                    <>
                      <button className="btn sm" onClick={() => toggleRegistered(r)}>
                        {r.registered ? 'Mark open' : 'Mark registered'}
                      </button>
                      <button className="btn sm danger" onClick={() => remove(r)} title="Delete regatta">
                        <Icon name="x" size={11} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
