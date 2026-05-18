// Coach "Plan" page — team availability heatmap with click-to-create-session.

const PLAN_HOUR_START = 5;
const PLAN_HOUR_END   = 21;
const PLAN_ROW_PX     = 18;
const PLAN_TOTAL_ROWS = (PLAN_HOUR_END - PLAN_HOUR_START) * 2;

function planTimeToRow(t) {
  const [h, m] = t.split(':').map(Number);
  return (h - PLAN_HOUR_START) * 2 + (m >= 30 ? 1 : 0);
}
function planRowToTime(r) {
  const minutes = PLAN_HOUR_START * 60 + r * 30;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// Returns the count of rowers available at (day, row) from TEAM_HEATMAP
function planCountAt(D, day, row) {
  for (const h of D.TEAM_HEATMAP) {
    if (h.day !== day) continue;
    const a = planTimeToRow(h.start);
    const b = planTimeToRow(h.end);
    if (row >= a && row < b) return h.count;
  }
  return 0;
}

function CoachPlan({ onOpenSession }) {
  const D = window.RowOrgData;
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [drag, setDrag] = React.useState(null);
  const [draft, setDraft] = React.useState(null); // {day, startRow, endRow}
  const [sessions, setSessions] = React.useState(() => D.SESSIONS.map(s => ({ ...s })));
  const [workout, setWorkout] = React.useState('');

  const weekStart = new Date(D.WEEK_START);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const todayIdx = (() => {
    if (weekOffset !== 0) return -1;
    const d = D.today.getDay();
    return d === 0 ? 6 : d - 1;
  })();

  const dayInfo = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return {
      label: D.DAY_LABELS_SHORT[i],
      num: d.getDate(),
      month: D.MONTHS[d.getMonth()],
      isToday: i === todayIdx,
      iso: d.toISOString().split('T')[0],
    };
  });

  const sessionsThisWeek = sessions.filter(s => {
    const sd = new Date(s.date + 'T00:00:00');
    const diff = (sd - weekStart) / 86400000;
    return diff >= 0 && diff < 7;
  }).map(s => ({ ...s, day: Math.floor((new Date(s.date + 'T00:00:00') - weekStart) / 86400000) }));

  const onCellDown = (day, row, e) => {
    e.preventDefault();
    setDrag({ day, startRow: row, endRow: row });
    setDraft(null);
  };
  const onCellEnter = (day, row) => {
    if (drag && drag.day === day) setDrag(d => ({ ...d, endRow: row }));
  };
  const onMouseUp = () => {
    if (!drag) return;
    const a = Math.min(drag.startRow, drag.endRow);
    const b = Math.max(drag.startRow, drag.endRow) + 1;
    if (b - a >= 1) setDraft({ day: drag.day, startRow: a, endRow: b });
    setDrag(null);
  };

  React.useEffect(() => {
    if (!drag) return;
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  });

  const createFromDraft = () => {
    if (!draft) return;
    const info = dayInfo[draft.day];
    const newId = Math.max(...sessions.map(s => s.id)) + 1;
    const next = {
      id: newId,
      date: info.iso,
      day: draft.day,
      start: planRowToTime(draft.startRow),
      end: planRowToTime(draft.endRow),
      title: workout || 'Practice',
      description: workout || '',
      crews: [],
    };
    setSessions(prev => [...prev, next]);
    setDraft(null);
    setWorkout('');
  };

  const monthRange = (() => {
    const a = `${D.MONTHS[weekStart.getMonth()]} ${weekStart.getDate()}`;
    const b = weekStart.getMonth() === weekEnd.getMonth()
      ? weekEnd.getDate()
      : `${D.MONTHS[weekEnd.getMonth()]} ${weekEnd.getDate()}`;
    return `${a} – ${b}`;
  })();

  // Stats
  const peak = (() => {
    let max = 0, when = null;
    for (let d = 0; d < 7; d++) {
      for (let r = 0; r < PLAN_TOTAL_ROWS; r++) {
        const c = planCountAt(D, d, r);
        if (c > max) { max = c; when = { day: d, row: r }; }
      }
    }
    return { count: max, when };
  })();

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">PLAN FROM TEAM AVAILABILITY · {monthRange.toUpperCase()}</div>
          <h2>Plan sessions</h2>
        </div>
        <div className="spacer"></div>
        <button className="btn"><Icon name="filter" size={13} /> Min rowers</button>
        <button className="btn primary"><Icon name="plus" size={13} /> Quick add</button>
      </div>

      <div className="metric-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="metric">
          <span className="label">Best availability</span>
          <span className="val tabular" style={{ color: 'var(--lime)' }}>{peak.count}<small>/12</small></span>
          <span className="trend muted mono">
            {peak.when ? `${D.DAY_LABELS_SHORT[peak.when.day]} ${planRowToTime(peak.when.row)}` : '—'}
          </span>
        </div>
        <div className="metric">
          <span className="label">Already scheduled</span>
          <span className="val tabular">{sessionsThisWeek.length}</span>
          <span className="trend muted mono">{sessionsThisWeek.reduce((a,s)=>a+s.crews.length,0)} crews</span>
        </div>
        <div className="metric">
          <span className="label">Avg available · 06:00</span>
          <span className="val tabular">8.6<small>/12</small></span>
          <span className="trend">strong morning squad</span>
        </div>
        <div className="metric">
          <span className="label">Coverage</span>
          <span className="val tabular">72<small>%</small></span>
          <span className="trend muted mono">team-wide this wk</span>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 720, marginBottom: 14 }}>
        Heatmap shows how many rowers are free in each half-hour. <b style={{ color: 'var(--text-0)' }}>Drag across empty cells</b> to draft a session at that time — coverage will be highest where the green is most intense.
      </p>

      <div className="avail">
        <div className="avail-head">
          <div className="week">
            <button onClick={() => setWeekOffset(o => o - 1)}><Icon name="chevL" size={14} /></button>
            <span className="week-label">{monthRange}</span>
            <button onClick={() => setWeekOffset(o => o + 1)}><Icon name="chevR" size={14} /></button>
          </div>
          <button className="btn ghost sm" onClick={() => setWeekOffset(0)}>Today</button>
          <div className="legend">
            <span className="legend-key">
              <span className="legend-swatch" style={{ background: 'linear-gradient(90deg, var(--bg-2), var(--lime))' }}></span>
              Team available
            </span>
            <span className="legend-key"><span className="legend-swatch session"></span>Existing practice</span>
            <span className="legend-key"><span className="legend-swatch" style={{ background: 'var(--accent-soft)', border: '1px dashed var(--accent)' }}></span>Drafting</span>
          </div>
        </div>

        <div className="avail-grid-wrap">
          <div className="avail-grid" style={{ position: 'relative' }}>
            <div className="col time-col">
              <div className="col-head">&nbsp;</div>
              {Array.from({ length: PLAN_TOTAL_ROWS }, (_, r) => (
                <div key={r} className={`time-cell ${r % 2 === 1 ? 'half' : ''}`}>
                  {r % 2 === 0 ? `${String(PLAN_HOUR_START + r/2).padStart(2,'0')}:00` : ''}
                </div>
              ))}
            </div>

            {dayInfo.map((info, dayIdx) => {
              const daySessions = sessionsThisWeek.filter(s => s.day === dayIdx);
              return (
                <div key={dayIdx} className={`col ${info.isToday ? 'today-col' : ''}`}>
                  <div className={`col-head ${info.isToday ? 'today' : ''}`}>
                    {info.label}<span className="day-num">{info.num}</span>
                  </div>

                  {Array.from({ length: PLAN_TOTAL_ROWS }, (_, r) => {
                    const count = planCountAt(D, dayIdx, r);
                    const intensity = Math.min(1, count / 12);
                    const bg = count > 0
                      ? `rgba(182, 240, 106, ${0.08 + intensity * 0.32})`
                      : 'transparent';
                    return (
                      <div
                        key={r}
                        className={`slot-cell ${r % 2 === 1 ? 'half' : ''}`}
                        style={{ background: bg }}
                        onMouseDown={(e) => onCellDown(dayIdx, r, e)}
                        onMouseEnter={() => onCellEnter(dayIdx, r)}
                        title={count > 0 ? `${count}/12 available` : ''}
                      />
                    );
                  })}

                  {/* count labels on each contiguous range from TEAM_HEATMAP */}
                  {D.TEAM_HEATMAP.filter(h => h.day === dayIdx).map((h, i) => {
                    const a = planTimeToRow(h.start), b = planTimeToRow(h.end);
                    return (
                      <div key={'lbl'+i} style={{
                        position: 'absolute',
                        top: 32 + a * PLAN_ROW_PX + 2,
                        // approximate column position by parent col; using transform via parent col makes this a child positioned absolutely inside col
                        left: 4,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--lime)',
                        opacity: 0.9,
                        pointerEvents: 'none',
                        zIndex: 1,
                      }}>
                        {h.count}/12
                      </div>
                    );
                  })}

                  {/* existing sessions */}
                  {daySessions.map(s => {
                    const a = planTimeToRow(s.start), b = planTimeToRow(s.end);
                    return (
                      <div
                        key={s.id}
                        className="slot session"
                        style={{ top: 32 + a * PLAN_ROW_PX, height: (b - a) * PLAN_ROW_PX - 2, cursor: 'pointer' }}
                        onClick={() => onOpenSession && onOpenSession(s.id)}
                      >
                        <span>{s.title}</span>
                        <span className="slot-time">{s.start} – {s.end}</span>
                      </div>
                    );
                  })}

                  {/* drag preview */}
                  {drag && drag.day === dayIdx && (() => {
                    const a = Math.min(drag.startRow, drag.endRow);
                    const b = Math.max(drag.startRow, drag.endRow) + 1;
                    return (
                      <div className="slot drafting"
                           style={{ top: 32 + a * PLAN_ROW_PX, height: (b - a) * PLAN_ROW_PX - 2 }}>
                        <span>New session</span>
                        <span className="slot-time">{planRowToTime(a)} – {planRowToTime(b)}</span>
                      </div>
                    );
                  })()}

                  {/* committed draft */}
                  {draft && draft.day === dayIdx && (
                    <div className="slot drafting"
                         style={{ top: 32 + draft.startRow * PLAN_ROW_PX, height: (draft.endRow - draft.startRow) * PLAN_ROW_PX - 2 }}>
                      <span>Drafting…</span>
                      <span className="slot-time">{planRowToTime(draft.startRow)} – {planRowToTime(draft.endRow)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* draft session form */}
      {draft && (
        <div style={{
          position: 'sticky', bottom: 16, marginTop: 16,
          background: 'var(--bg-2)', border: '1px solid var(--accent)',
          borderRadius: 'var(--r-lg)', padding: 16,
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 12px 32px -8px rgba(0,0,0,.5)',
          zIndex: 5,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              New session draft
            </div>
            <div style={{ marginTop: 4, fontSize: 15, fontWeight: 600 }}>
              {D.DAY_LABELS[draft.day]} · {planRowToTime(draft.startRow)} – {planRowToTime(draft.endRow)}
            </div>
            <div className="muted mono" style={{ fontSize: 11, marginTop: 2 }}>
              {planCountAt(D, draft.day, draft.startRow)}/12 rowers available at this time
            </div>
          </div>
          <input
            type="text"
            className="select"
            placeholder="Workout (e.g. 6×8 min @ rate 20)"
            value={workout}
            onChange={(e) => setWorkout(e.target.value)}
            style={{ width: 320, fontSize: 13 }}
          />
          <button className="btn ghost" onClick={() => { setDraft(null); setWorkout(''); }}>
            Cancel
          </button>
          <button className="btn primary" onClick={createFromDraft}>
            <Icon name="check" size={13} /> Create session
          </button>
        </div>
      )}
    </>
  );
}

window.CoachPlan = CoachPlan;
