import { useEffect, useMemo, useState } from 'react';
import { useUser } from '../hooks/userContext';
import { getTemplates, createTemplate, deleteTemplate } from '../api/templates';
import { getTeam } from '../api/teams';
import type { LineupTemplate, User } from '../types';
import { BOAT_TYPES } from '../lib/boats';
import SectionTitle from '../components/SectionTitle';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import { SideTag } from '../components/Badges';

export default function CoachPrefs() {
  const { user } = useUser();
  const [templates, setTemplates] = useState<LineupTemplate[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    boat_type: string;
    note: string;
    lineup: (number | null)[];
    cox: number | null;
  }>({ name: '', boat_type: '8+', note: '', lineup: Array(8).fill(null), cox: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reload = () => void getTemplates().then(setTemplates);

  useEffect(() => {
    reload();
    if (user?.team) void getTeam(user.team).then((t) => setMembers((t.members ?? []).filter((m) => m.role !== 'coach')));
  }, [user?.team]);

  const boatDef = useMemo(() => BOAT_TYPES.find((b) => b.value === form.boat_type)!, [form.boat_type]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((f) => ({ ...f, lineup: Array(boatDef.seats).fill(null), cox: boatDef.coxed ? f.cox : null }));
  }, [boatDef]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.lineup.some((id) => id == null)) {
      setError('Fill every seat (stroke → bow) before saving.');
      return;
    }
    if (boatDef.coxed && form.cox == null) {
      setError('Pick a coxswain for this boat type.');
      return;
    }
    setSaving(true);
    try {
      await createTemplate({
        name: form.name,
        boat_type: form.boat_type,
        note: form.note,
        lineup: form.lineup as number[],
        cox: form.cox,
      });
      reload();
      setShowForm(false);
      setForm({ name: '', boat_type: '8+', note: '', lineup: Array(8).fill(null), cox: null });
    } catch {
      setError('Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this template?')) return;
    await deleteTemplate(id);
    reload();
  };

  const setSeat = (idx: number, id: number | null) => {
    setForm((f) => {
      const next = [...f.lineup];
      next[idx] = id;
      return { ...f, lineup: next };
    });
  };

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">LINEUP RULES · INFORMS THE SUGGESTION ENGINE</div>
          <h2>Preferences</h2>
        </div>
        <div className="spacer"></div>
        <button className="btn primary" onClick={() => setShowForm((s) => !s)}>
          <Icon name="plus" size={13} /> {showForm ? 'Cancel' : 'New template'}
        </button>
      </div>

      <SectionTitle
        title="Lineup templates"
        hint="Full stroke-to-bow lineups. Suggestions use these as starting points; the Crew Builder loads them in one click."
      />

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
              {error && <div className="error-msg">{error}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12 }}>
                <div className="field">
                  <label className="field-label">Template name</label>
                  <input
                    className="input"
                    placeholder="Race VIII"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label className="field-label">Boat type</label>
                  <select className="input" value={form.boat_type} onChange={(e) => setForm({ ...form, boat_type: e.target.value })}>
                    {BOAT_TYPES.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="field-label">Note</label>
                <input
                  className="input"
                  placeholder="Race lineup, stroke side wins starts"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Lineup · stroke → bow</label>
                <div style={{ display: 'grid', gap: 6 }}>
                  {form.lineup.map((id, idx) => {
                    const seatNumFromBow = boatDef.seats - idx;
                    const label = idx === 0 ? 'STK' : idx === boatDef.seats - 1 ? 'BOW' : String(seatNumFromBow);
                    const side = boatDef.sculling ? null : seatNumFromBow % 2 === 1 ? 'port' : 'starboard';
                    return (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 70px', gap: 10, alignItems: 'center' }}>
                        <span className="pos mono">{label}</span>
                        <select
                          className="input"
                          value={id ?? ''}
                          onChange={(e) => setSeat(idx, e.target.value ? Number(e.target.value) : null)}
                        >
                          <option value="">— pick rower —</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.first_name} {m.last_name}
                            </option>
                          ))}
                        </select>
                        {side ? <SideTag side={side} /> : <span className="side-none">SCULL</span>}
                      </div>
                    );
                  })}
                  {boatDef.coxed && (
                    <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 70px', gap: 10, alignItems: 'center' }}>
                      <span className="pos mono">COX</span>
                      <select className="input" value={form.cox ?? ''} onChange={(e) => setForm({ ...form, cox: e.target.value ? Number(e.target.value) : null })}>
                        <option value="">— pick cox —</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.first_name} {m.last_name}
                          </option>
                        ))}
                      </select>
                      <SideTag side="cox" />
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn ghost" type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button className="btn primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="empty-state">No lineup templates yet. Create one above — it'll show up as a "Load template…" option in the Crew Builder.</div>
      ) : (
        <div className="template-grid">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} onDelete={() => handleDelete(t.id)} />
          ))}
        </div>
      )}
    </>
  );
}

function TemplateCard({ template, onDelete }: { template: LineupTemplate; onDelete: () => void }) {
  const boat = BOAT_TYPES.find((b) => b.value === template.boat_type);
  return (
    <div className="template-card">
      <div className="head">
        <span className="badge coral" style={{ fontWeight: 600 }}>
          {template.boat_type}
        </span>
        <span className="name">{template.name}</span>
        <button className="btn sm danger" onClick={onDelete} title="Delete template">
          <Icon name="x" size={11} />
        </button>
      </div>
      {template.note && (
        <div className="muted" style={{ fontSize: 11.5 }}>
          {template.note}
        </div>
      )}
      <div className="seats-grid">
        {template.seats
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((s) => {
            const isStroke = s.position === 0;
            const isBow = boat && s.position === boat.seats - 1;
            const seatNumFromBow = boat ? boat.seats - s.position : 0;
            const label = isStroke ? 'STK' : isBow ? 'BOW' : String(seatNumFromBow);
            return (
              <div key={s.position} style={{ display: 'contents' }}>
                <span className="pos mono">{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Avatar user={s.rower_detail ?? null} size={16} />
                  <span>{s.rower_detail ? `${s.rower_detail.first_name} ${s.rower_detail.last_name}` : `#${s.rower}`}</span>
                </div>
              </div>
            );
          })}
        {template.cox_detail && (
          <div style={{ display: 'contents' }}>
            <span className="pos mono" style={{ color: 'var(--water)' }}>
              COX
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar user={template.cox_detail} size={16} />
              <span>
                {template.cox_detail.first_name} {template.cox_detail.last_name}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
