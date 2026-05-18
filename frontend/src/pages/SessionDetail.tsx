import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSession, getSuggestions, createCrew, confirmCrew, cancelCrew } from '../api/sessions';
import type { Session, CrewSuggestion } from '../types';
import SectionTitle from '../components/SectionTitle';
import Icon from '../components/Icon';
import CrewCard from '../components/cards/CrewCard';
import SuggestionCard from '../components/cards/SuggestionCard';
import CrewBuilder from '../components/CrewBuilder';
import { DAY_LABELS_LONG, MONTHS, parseISODate, dayOfWeek, formatTime } from '../lib/dates';

type BoatFilter = 'all' | '8+' | '4+' | '4x' | '4-' | '2x' | '2-' | '1x';
type SortBy = 'score' | 'boat';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);
  const [session, setSession] = useState<Session | null>(null);
  const [suggestions, setSuggestions] = useState<CrewSuggestion[]>([]);
  const [availableCoxIds, setAvailableCoxIds] = useState<{ id: number; name: string }[]>([]);
  const [selectedCox, setSelectedCox] = useState<number | ''>('');
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [filterBoat, setFilterBoat] = useState<BoatFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('score');

  useEffect(() => {
    if (!sessionId) return;
    void getSession(sessionId).then(setSession);
  }, [sessionId]);

  const loadSuggestions = useCallback(async () => {
    if (!sessionId) return;
    setLoadingSugg(true);
    try {
      const res = await getSuggestions(sessionId);
      setSuggestions(res.suggestions);
      setAvailableCoxIds(res.available_coxswains);
    } finally {
      setLoadingSugg(false);
    }
  }, [sessionId]);

  const filtered = useMemo(() => {
    return suggestions
      .filter((s) => {
        if (filterBoat === 'all') return true;
        return s.boat_type === filterBoat;
      })
      .sort((a, b) => (sortBy === 'score' ? b.score - a.score : a.boat_type.localeCompare(b.boat_type)));
  }, [suggestions, filterBoat, sortBy]);

  const acceptSuggestion = async (suggestion: CrewSuggestion) => {
    if (!session) return;
    const coxedBoat = ['4+', '8+'].includes(suggestion.boat_type);
    if (coxedBoat && !selectedCox) {
      alert('Choose a coxswain before accepting a coxed-boat suggestion.');
      return;
    }
    const seats = suggestion.rowers.map((r, idx) => ({
      rower: r.id,
      seat_number: idx + 1,
      is_cox: false,
    }));
    if (coxedBoat && selectedCox) {
      seats.push({ rower: Number(selectedCox), seat_number: 0, is_cox: true });
    }
    await createCrew(session.id, { boat_type: suggestion.boat_type, is_confirmed: false, seats });
    await getSession(session.id).then(setSession);
  };

  const onApprove = async (crewId: number) => {
    if (!session) return;
    await confirmCrew(session.id, crewId);
    await getSession(session.id).then(setSession);
  };
  const onCancel = async (crewId: number) => {
    if (!session) return;
    await cancelCrew(session.id, crewId);
    await getSession(session.id).then(setSession);
  };

  if (!session) {
    return <div className="empty-state">Loading session…</div>;
  }

  const dateObj = parseISODate(session.date);
  const dow = dayOfWeek(dateObj);

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">
            <Link to="/sessions" style={{ color: 'var(--text-2)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="chevL" size={11} /> SESSIONS
            </Link>
            {' · '}
            <span>
              {DAY_LABELS_LONG[dow]} {dateObj.getDate()} {MONTHS[dateObj.getMonth()]} · {formatTime(session.start_time)}–{formatTime(session.end_time)}
            </span>
          </div>
          <h2>{session.description || 'Practice'}</h2>
        </div>
        <div className="spacer"></div>
        <button className="btn primary" onClick={loadSuggestions} disabled={loadingSugg}>
          <Icon name="bolt" size={13} /> {loadingSugg ? 'Generating…' : 'Generate suggestions'}
        </button>
      </div>

      {session.description && (
        <div className="workout" style={{ marginBottom: 20, maxWidth: 720 }}>
          <strong>Workout · </strong> {session.description}
        </div>
      )}

      <div className="detail-grid">
        <div>
          <SectionTitle title="Assigned crews" hint={`${session.crews.length} crew${session.crews.length === 1 ? '' : 's'}`} />
          {session.crews.length === 0 ? (
            <div className="empty-state">No crews assigned yet. Accept a suggestion or build manually below.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {session.crews.map((crew) => (
                <CrewCard
                  key={crew.id}
                  crew={crew}
                  onApprove={() => onApprove(crew.id)}
                  onCancel={() => onCancel(crew.id)}
                />
              ))}
            </div>
          )}

          <SectionTitle
            title="Crew builder"
            hint={
              <>
                Drag rowers into seats · <span className="kbd">⌘K</span> roster search
              </>
            }
          />
          <CrewBuilder sessionId={session.id} onCrewSaved={() => getSession(session.id).then(setSession)} />
        </div>

        <div>
          <SectionTitle title="Suggested lineups" hint={`${filtered.length} options`} />

          {availableCoxIds.length > 0 && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-body" style={{ padding: 12 }}>
                <label className="field-label">Coxswain (for coxed-boat suggestions)</label>
                <select className="input" value={selectedCox} onChange={(e) => setSelectedCox(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">— pick a cox —</option>
                  {availableCoxIds.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="filter-strip">
            {(['all', '8+', '4+', '4x', '4-', '2x', '2-'] as BoatFilter[]).map((b) => (
              <button key={b} className={`chip ${filterBoat === b ? 'active' : ''}`} onClick={() => setFilterBoat(b)}>
                {b === 'all' ? 'All' : b}
              </button>
            ))}
            <div className="spacer"></div>
            <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
              <option value="score">Sort: Best fit</option>
              <option value="boat">Sort: Boat type</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              {loadingSugg ? 'Generating suggestions…' : 'No suggestions yet. Click "Generate suggestions" above.'}
            </div>
          ) : (
            filtered.map((s, idx) => {
              const coxed = ['4+', '8+'].includes(s.boat_type);
              return (
                <SuggestionCard
                  key={`${s.boat_type}-${idx}`}
                  suggestion={s}
                  onAccept={() => acceptSuggestion(s)}
                  disabled={coxed && !selectedCox}
                  disabledReason={coxed && !selectedCox ? 'Pick a cox first' : undefined}
                />
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
