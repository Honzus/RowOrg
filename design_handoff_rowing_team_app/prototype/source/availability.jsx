// Availability calendar — hero component
// Drag to paint a range on any day. Click a slot to remove.

const HOUR_START = 5;   // 5am
const HOUR_END   = 21;  // 9pm
const SLOT_MIN   = 30;  // 30-min granularity
const ROW_PX     = 18;  // each 30-min row is 18px tall (so an hour = 36px, matches CSS)

// Build the row index (0..N-1) from a "HH:MM" string
function timeToRow(t) {
  const [h, m] = t.split(':').map(Number);
  return (h - HOUR_START) * 2 + (m >= 30 ? 1 : 0);
}
function rowToTime(r) {
  const minutes = HOUR_START * 60 + r * 30;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

const TOTAL_ROWS = (HOUR_END - HOUR_START) * 2;

function AvailabilityCalendar({ tweaks }) {
  const D = window.RowOrgData;
  const [slots, setSlots] = React.useState(() => D.MY_AVAIL.map(s => ({ ...s })));
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [drag, setDrag] = React.useState(null); // {day, startRow, endRow}
  const [hover, setHover] = React.useState(null);

  // Compute current week label
  const weekStart = new Date(D.WEEK_START);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const todayIdx = (() => {
    if (weekOffset !== 0) return -1;
    const d = D.today.getDay();
    return d === 0 ? 6 : d - 1;
  })();

  // Pre-compute day labels (date + month)
  const dayInfo = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return {
      label: D.DAY_LABELS_SHORT[i],
      num: d.getDate(),
      month: D.MONTHS[d.getMonth()],
      isToday: i === todayIdx,
    };
  });

  // sessions for this week
  const sessionsThisWeek = D.SESSIONS.filter(s => {
    const sd = new Date(s.date + 'T00:00:00');
    const diff = (sd - weekStart) / 86400000;
    return diff >= 0 && diff < 7;
  }).map(s => ({ ...s, day: Math.floor((new Date(s.date + 'T00:00:00') - weekStart) / 86400000) }));

  // team heatmap for this week — only show if tweak enabled
  const heat = tweaks.showTeamHeatmap ? D.TEAM_HEATMAP : [];

  // ---- drag handlers ----
  const onCellDown = (day, row, e) => {
    e.preventDefault();
    setDrag({ day, startRow: row, endRow: row });
  };
  const onCellEnter = (day, row) => {
    setHover({ day, row });
    if (drag && drag.day === day) {
      setDrag(d => ({ ...d, endRow: row }));
    }
  };
  const onMouseUp = () => {
    if (!drag) return;
    const a = Math.min(drag.startRow, drag.endRow);
    const b = Math.max(drag.startRow, drag.endRow) + 1; // inclusive end
    if (b - a >= 1) {
      const newSlot = {
        id: Date.now(),
        day: drag.day,
        start: rowToTime(a),
        end: rowToTime(b),
      };
      // remove overlapping existing slots on the same day
      setSlots(prev => {
        const filtered = prev.filter(s => {
          if (s.day !== newSlot.day) return true;
          const sa = timeToRow(s.start), sb = timeToRow(s.end);
          return sb <= a || sa >= b; // no overlap
        });
        return [...filtered, newSlot];
      });
    }
    setDrag(null);
  };

  React.useEffect(() => {
    if (!drag) return;
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  });

  const removeSlot = (id, e) => {
    e.stopPropagation();
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  const monthRange = (() => {
    const a = `${D.MONTHS[weekStart.getMonth()]} ${weekStart.getDate()}`;
    const b = weekStart.getMonth() === weekEnd.getMonth()
      ? weekEnd.getDate()
      : `${D.MONTHS[weekEnd.getMonth()]} ${weekEnd.getDate()}`;
    return `${a} – ${b}`;
  })();

  return (
    <div className="avail">
      <div className="avail-head">
        <div className="week">
          <button onClick={() => setWeekOffset(o => o - 1)} aria-label="Previous week">
            <Icon name="chevL" size={14} />
          </button>
          <span className="week-label">{monthRange}</span>
          <button onClick={() => setWeekOffset(o => o + 1)} aria-label="Next week">
            <Icon name="chevR" size={14} />
          </button>
        </div>
        <button className="btn ghost sm" onClick={() => setWeekOffset(0)}>Today</button>
        <div className="legend">
          <span className="legend-key"><span className="legend-swatch you"></span>You're free</span>
          <span className="legend-key"><span className="legend-swatch session"></span>Practice</span>
          {tweaks.showTeamHeatmap && (
            <span className="legend-key"><span className="legend-swatch team"></span>Team free</span>
          )}
        </div>
      </div>

      <div className="avail-grid-wrap">
        <div className="avail-grid" style={{ position: 'relative' }}>
          {/* time column */}
          <div className="col time-col">
            <div className="col-head">&nbsp;</div>
            {Array.from({ length: TOTAL_ROWS }, (_, r) => (
              <div key={r} className={`time-cell ${r % 2 === 1 ? 'half' : ''}`}>
                {r % 2 === 0 ? `${String(HOUR_START + r/2).padStart(2,'0')}:00` : ''}
              </div>
            ))}
          </div>

          {/* day columns */}
          {dayInfo.map((info, dayIdx) => {
            const daySlots = slots.filter(s => s.day === dayIdx);
            const daySessions = sessionsThisWeek.filter(s => s.day === dayIdx);
            const dayHeat = heat.filter(h => h.day === dayIdx);

            return (
              <div key={dayIdx} className={`col ${info.isToday ? 'today-col' : ''}`}>
                <div className={`col-head ${info.isToday ? 'today' : ''}`}>
                  {info.label}<span className="day-num">{info.num}</span>
                </div>

                {Array.from({ length: TOTAL_ROWS }, (_, r) => (
                  <div
                    key={r}
                    className={`slot-cell ${r % 2 === 1 ? 'half' : ''}`}
                    onMouseDown={(e) => onCellDown(dayIdx, r, e)}
                    onMouseEnter={() => onCellEnter(dayIdx, r)}
                  />
                ))}

                {/* team heatmap underlays */}
                {tweaks.showTeamHeatmap && dayHeat.map((h, i) => {
                  const a = timeToRow(h.start), b = timeToRow(h.end);
                  return (
                    <div key={'h'+i} className="slot team-overlay"
                         style={{
                           top: 32 + a * ROW_PX,
                           height: (b - a) * ROW_PX - 2,
                           zIndex: 1, opacity: 0.45,
                         }}>
                      <span className="slot-time mono">{h.count}/12 free</span>
                    </div>
                  );
                })}

                {/* user availability slots */}
                {daySlots.map(s => {
                  const a = timeToRow(s.start), b = timeToRow(s.end);
                  return (
                    <div key={s.id} className="slot"
                         style={{
                           top: 32 + a * ROW_PX,
                           height: (b - a) * ROW_PX - 2,
                         }}>
                      <span>You're in</span>
                      <span className="slot-time">{s.start} – {s.end}</span>
                      <button className="slot-remove" onClick={(e) => removeSlot(s.id, e)} title="Remove">
                        <Icon name="x" size={10} />
                      </button>
                    </div>
                  );
                })}

                {/* sessions */}
                {daySessions.map(s => {
                  const a = timeToRow(s.start), b = timeToRow(s.end);
                  return (
                    <div key={s.id} className="slot session"
                         style={{
                           top: 32 + a * ROW_PX,
                           height: (b - a) * ROW_PX - 2,
                         }}>
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
                         style={{
                           top: 32 + a * ROW_PX,
                           height: (b - a) * ROW_PX - 2,
                         }}>
                      <span>Drag to set</span>
                      <span className="slot-time">{rowToTime(a)} – {rowToTime(b)}</span>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.AvailabilityCalendar = AvailabilityCalendar;
