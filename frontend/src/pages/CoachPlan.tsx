import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, getSessions } from '../api/sessions';
import { getTeamAvailabilityBlocks } from '../api/planning';
import { getTeam } from '../api/teams';
import { useUser } from '../hooks/userContext';
import type { Session, TeamAvailabilityBlock, Team } from '../types';
import Icon from '../components/Icon';
import {
  DAY_LABELS,
  DAY_LABELS_LONG,
  GRID_ROWS,
  ROW_HEIGHT,
  rowToTime,
  timeToRow,
  mondayOf,
  addDays,
  formatISODate,
  weekLabel,
  parseISODate,
  dayOfWeek,
  formatTime,
} from '../lib/dates';

const HEAD_HEIGHT = 32;

interface DragRange {
  day: number;
  startRow: number;
  endRow: number;
}

function countAt(blocks: TeamAvailabilityBlock[], day: number, row: number): number {
  for (const h of blocks) {
    if (h.day_of_week !== day) continue;
    const a = timeToRow(h.start_time);
    const b = timeToRow(h.end_time);
    if (row >= a && row < b) return h.count;
  }
  return 0;
}

export default function CoachPlan() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  const [blocks, setBlocks] = useState<TeamAvailabilityBlock[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [drag, setDrag] = useState<DragRange | null>(null);
  const [draft, setDraft] = useState<DragRange | null>(null);
  const [workout, setWorkout] = useState('');
  const [creating, setCreating] = useState(false);

  const weekISO = formatISODate(weekStart);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getTeamAvailabilityBlocks(weekISO), getSessions(weekISO)]).then(([b, s]) => {
      if (cancelled) return;
      setBlocks(b);
      setSessions(s);
    });
    return () => {
      cancelled = true;
    };
  }, [weekISO]);

  useEffect(() => {
    if (user?.team) void getTeam(user.team).then(setTeam);
  }, [user?.team]);

  const teamSize = team?.members?.filter((m) => m.role !== 'coach').length ?? 0;

  const commitDrag = useCallback(() => {
    setDrag((current) => {
      if (!current) return null;
      const a = Math.min(current.startRow, current.endRow);
      const b = Math.max(current.startRow, current.endRow) + 1;
      if (b - a >= 1) setDraft({ day: current.day, startRow: a, endRow: b });
      return null;
    });
  }, []);

  useEffect(() => {
    if (!drag) return;
    const onUp = () => commitDrag();
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [drag, commitDrag]);

  const dayInfo = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(weekStart, i);
        return { label: DAY_LABELS[i], num: d.getDate(), date: d };
      }),
    [weekStart]
  );

  const sessionsForDay = (day: number) =>
    sessions.filter((s) => {
      const d = parseISODate(s.date);
      return dayOfWeek(d) === day && d >= weekStart && d < addDays(weekStart, 7);
    });

  const peak = useMemo(() => {
    let max = 0;
    let when: { day: number; row: number } | null = null;
    for (let d = 0; d < 7; d++) {
      for (let r = 0; r < GRID_ROWS; r++) {
        const c = countAt(blocks, d, r);
        if (c > max) {
          max = c;
          when = { day: d, row: r };
        }
      }
    }
    return { count: max, when };
  }, [blocks]);

  const createFromDraft = async () => {
    if (!draft) return;
    setCreating(true);
    try {
      const day = dayInfo[draft.day].date;
      const newSession = await createSession({
        date: formatISODate(day),
        start_time: rowToTime(draft.startRow),
        end_time: rowToTime(draft.endRow),
        description: workout,
      });
      setSessions((prev) => [...prev, newSession]);
      setDraft(null);
      setWorkout('');
    } finally {
      setCreating(false);
    }
  };

  const draftCount = draft ? countAt(blocks, draft.day, draft.startRow) : 0;

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">PLAN FROM TEAM AVAILABILITY · {weekLabel(weekStart).toUpperCase()}</div>
          <h2>Plan sessions</h2>
        </div>
      </div>

      <div className="metric-row">
        <div className="metric">
          <span className="label">Best availability</span>
          <span className="val tabular" style={{ color: 'var(--lime)' }}>
            {peak.count}
            {teamSize > 0 && <small>/{teamSize}</small>}
          </span>
          <span className="trend muted mono">
            {peak.when ? `${DAY_LABELS[peak.when.day]} ${rowToTime(peak.when.row)}` : '—'}
          </span>
        </div>
        <div className="metric">
          <span className="label">Already scheduled</span>
          <span className="val tabular">{sessions.length}</span>
          <span className="trend muted mono">
            {sessions.reduce((a, s) => a + s.crews.length, 0)} crews
          </span>
        </div>
        <div className="metric">
          <span className="label">Team size</span>
          <span className="val tabular">{teamSize}</span>
          <span className="trend muted mono">rowers</span>
        </div>
        <div className="metric">
          <span className="label">Blocks captured</span>
          <span className="val tabular">{blocks.length}</span>
          <span className="trend muted mono">distinct windows</span>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 720, marginBottom: 14 }}>
        Heatmap shows how many rowers are free in each half-hour. <strong style={{ color: 'var(--text-0)' }}>Drag across empty cells</strong> to draft a session — coverage is highest where the green is most intense.
      </p>

      <div className="avail">
        <div className="avail-head">
          <div className="week">
            <button className="btn ghost icon" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">
              <Icon name="chevL" size={14} />
            </button>
            <span className="week-label">{weekLabel(weekStart)}</span>
            <button className="btn ghost icon" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">
              <Icon name="chevR" size={14} />
            </button>
          </div>
          <button className="btn ghost sm" onClick={() => setWeekStart(mondayOf(new Date()))}>
            Today
          </button>
          <div className="legend">
            <span className="legend-key">
              <span className="legend-swatch" style={{ background: 'linear-gradient(90deg, var(--bg-2), var(--lime))' }}></span>
              Team available
            </span>
            <span className="legend-key">
              <span className="legend-swatch session"></span>Existing practice
            </span>
            <span className="legend-key">
              <span className="legend-swatch" style={{ background: 'var(--accent-soft)', border: '1px dashed var(--accent)' }}></span>
              Drafting
            </span>
          </div>
        </div>

        <div className="avail-grid-wrap">
          <div className="avail-grid">
            <div className="col time-col">
              <div className="col-head">&nbsp;</div>
              {Array.from({ length: GRID_ROWS }, (_, r) => (
                <div key={r} className={`time-cell ${r % 2 === 0 ? 'hour-mark' : ''}`}>
                  {r % 2 === 0 ? rowToTime(r) : ''}
                </div>
              ))}
            </div>

            {dayInfo.map((info, dayIdx) => {
              const daySessions = sessionsForDay(dayIdx);
              const dayBlocks = blocks.filter((b) => b.day_of_week === dayIdx);

              return (
                <div key={dayIdx} className="col">
                  <div className="col-head">
                    {info.label}
                    <span className="day-num">{info.num}</span>
                  </div>

                  {Array.from({ length: GRID_ROWS }, (_, r) => {
                    const count = countAt(blocks, dayIdx, r);
                    const denom = teamSize || 12;
                    const intensity = Math.min(1, count / denom);
                    const bg = count > 0 ? `rgba(182, 240, 106, ${0.08 + intensity * 0.32})` : 'transparent';
                    return (
                      <div
                        key={r}
                        className={`slot-cell ${r % 2 === 1 ? 'hour-mark' : ''}`}
                        style={{ background: bg }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setDrag({ day: dayIdx, startRow: r, endRow: r });
                          setDraft(null);
                        }}
                        onMouseEnter={() => {
                          if (drag && drag.day === dayIdx) setDrag({ ...drag, endRow: r });
                        }}
                        title={count > 0 ? `${count} available` : ''}
                      />
                    );
                  })}

                  {dayBlocks.map((h, i) => {
                    const a = timeToRow(h.start_time);
                    return (
                      <div
                        key={`lbl${i}`}
                        className="heatmap-count"
                        style={{ top: HEAD_HEIGHT + a * ROW_HEIGHT + 2, left: 4 }}
                      >
                        {h.count}
                        {teamSize > 0 ? `/${teamSize}` : ''}
                      </div>
                    );
                  })}

                  {daySessions.map((s) => {
                    const a = timeToRow(s.start_time);
                    const b = timeToRow(s.end_time);
                    return (
                      <div
                        key={s.id}
                        className="slot session"
                        style={{ top: HEAD_HEIGHT + a * ROW_HEIGHT, height: (b - a) * ROW_HEIGHT - 2 }}
                        onClick={() => navigate(`/sessions/${s.id}`)}
                      >
                        <span>{s.description || 'Practice'}</span>
                        <span className="slot-time">
                          {formatTime(s.start_time)} – {formatTime(s.end_time)}
                        </span>
                      </div>
                    );
                  })}

                  {drag && drag.day === dayIdx && (() => {
                    const a = Math.min(drag.startRow, drag.endRow);
                    const b = Math.max(drag.startRow, drag.endRow) + 1;
                    return (
                      <div className="slot drafting" style={{ top: HEAD_HEIGHT + a * ROW_HEIGHT, height: (b - a) * ROW_HEIGHT - 2 }}>
                        <span>New session</span>
                        <span className="slot-time">
                          {rowToTime(a)} – {rowToTime(b)}
                        </span>
                      </div>
                    );
                  })()}

                  {draft && draft.day === dayIdx && (
                    <div
                      className="slot drafting"
                      style={{ top: HEAD_HEIGHT + draft.startRow * ROW_HEIGHT, height: (draft.endRow - draft.startRow) * ROW_HEIGHT - 2 }}
                    >
                      <span>Drafting…</span>
                      <span className="slot-time">
                        {rowToTime(draft.startRow)} – {rowToTime(draft.endRow)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {draft && (
        <div className="plan-draft">
          <div className="label">NEW SESSION DRAFT</div>
          <div className="when">
            {DAY_LABELS_LONG[draft.day]} · {rowToTime(draft.startRow)} – {rowToTime(draft.endRow)}
          </div>
          <div className="count">
            {draftCount}
            {teamSize > 0 && `/${teamSize}`} rowers available at this time
          </div>
          <div className="row">
            <input
              className="input"
              type="text"
              placeholder="Workout (e.g. 6×8 min @ rate 20)"
              value={workout}
              onChange={(e) => setWorkout(e.target.value)}
            />
            <button className="btn ghost" onClick={() => { setDraft(null); setWorkout(''); }}>
              Cancel
            </button>
            <button className="btn primary" onClick={createFromDraft} disabled={creating}>
              <Icon name="check" size={13} /> {creating ? 'Creating…' : 'Create session'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
