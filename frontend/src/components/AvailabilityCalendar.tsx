import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getMyAvailability, createAvailability, deleteAvailability } from '../api/availability';
import { getSessions } from '../api/sessions';
import type { Availability, Session, TeamAvailabilityBlock } from '../types';
import {
  DAY_LABELS,
  MONTHS,
  GRID_ROWS,
  ROW_HEIGHT,
  rowToTime,
  timeToRow,
  dayOfWeek,
  mondayOf,
  addDays,
  formatISODate,
  weekLabel,
  parseISODate,
  formatTime,
} from '../lib/dates';
import Icon from './Icon';

const HEAD_HEIGHT = 32;

interface Props {
  heatmap?: TeamAvailabilityBlock[];
  showHeatmap?: boolean;
  weekStart?: Date;
  onWeekChange?: (weekStart: Date) => void;
}

interface DragRange {
  day: number;
  startRow: number;
  endRow: number;
}

interface LocalSlot extends Availability {
  pending?: boolean;
  tempId?: number;
}

export default function AvailabilityCalendar({ heatmap = [], showHeatmap = false, weekStart: weekStartProp, onWeekChange }: Props) {
  const [internalWeekStart, setInternalWeekStart] = useState<Date>(() => weekStartProp ?? mondayOf(new Date()));
  const weekStart = weekStartProp ?? internalWeekStart;

  const setWeekStart = (d: Date) => {
    if (onWeekChange) onWeekChange(d);
    else setInternalWeekStart(d);
  };

  const [slots, setSlots] = useState<LocalSlot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [drag, setDrag] = useState<DragRange | null>(null);
  const [loading, setLoading] = useState(true);

  const weekStartISO = formatISODate(weekStart);

  // Keep latest slots in a ref so commitDrag can read them without re-creating the callback
  const slotsRef = useRef<LocalSlot[]>(slots);
  useEffect(() => {
    slotsRef.current = slots;
  });

  const commitDrag = useCallback(async (current: DragRange) => {
    const a = Math.min(current.startRow, current.endRow);
    const b = Math.max(current.startRow, current.endRow) + 1;
    const day = current.day;
    if (b - a < 1) return;

    const start_time = rowToTime(a);
    const end_time = rowToTime(b);

    const overlapping = slotsRef.current.filter(
      (s) => s.day_of_week === day && timeToRow(s.start_time) < b && timeToRow(s.end_time) > a
    );
    const tempId = -Date.now();
    const newSlot: LocalSlot = {
      id: tempId,
      tempId,
      user: 0,
      week_start: weekStartISO,
      day_of_week: day,
      start_time,
      end_time,
      pending: true,
    };

    setSlots((prev) => [...prev.filter((s) => !overlapping.includes(s)), newSlot]);

    try {
      await Promise.all(overlapping.filter((s) => !s.pending).map((s) => deleteAvailability(s.id)));
      const created = await createAvailability({
        week_start: weekStartISO,
        day_of_week: day,
        start_time,
        end_time,
      });
      setSlots((prev) => prev.map((s) => (s.tempId === tempId ? created : s)));
    } catch {
      setSlots((prev) => prev.filter((s) => s.tempId !== tempId).concat(overlapping));
    }
  }, [weekStartISO]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([getMyAvailability(weekStartISO), getSessions(weekStartISO)])
      .then(([a, s]) => {
        if (cancelled) return;
        setSlots(a);
        setSessions(s);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [weekStartISO]);

  useEffect(() => {
    if (!drag) return;
    const onUp = () => {
      const current = drag;
      setDrag(null);
      void commitDrag(current);
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [drag, commitDrag]);

  const removeSlot = async (id: number) => {
    const slot = slots.find((s) => s.id === id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
    if (!slot || slot.pending) return;
    try {
      await deleteAvailability(id);
    } catch {
      setSlots((prev) => [...prev, slot]);
    }
  };

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const dayInfo = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(weekStart, i);
        return {
          label: DAY_LABELS[i],
          num: d.getDate(),
          month: MONTHS[d.getMonth()],
          isToday: d.getTime() === today.getTime(),
        };
      }),
    [weekStart, today]
  );

  const sessionsForDay = (day: number) =>
    sessions.filter((s) => {
      const d = parseISODate(s.date);
      return dayOfWeek(d) === day && d >= weekStart && d < addDays(weekStart, 7);
    });

  const heatmapForDay = (day: number) => heatmap.filter((h) => h.day_of_week === day);

  return (
    <div className="avail">
      <div className="avail-head">
        <div className="week">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">
            <Icon name="chevL" size={14} />
          </button>
          <span className="week-label">{weekLabel(weekStart)}</span>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">
            <Icon name="chevR" size={14} />
          </button>
        </div>
        <button className="btn ghost sm" onClick={() => setWeekStart(mondayOf(new Date()))}>
          Today
        </button>
        <div className="legend">
          <span className="legend-key">
            <span className="legend-swatch you"></span>You're free
          </span>
          <span className="legend-key">
            <span className="legend-swatch session"></span>Practice
          </span>
          {showHeatmap && (
            <span className="legend-key">
              <span className="legend-swatch team"></span>Team free
            </span>
          )}
        </div>
      </div>

      <div className="avail-grid-wrap" style={{ opacity: loading ? 0.6 : 1 }}>
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
            const daySlots = slots.filter((s) => s.day_of_week === dayIdx);
            const daySessions = sessionsForDay(dayIdx);
            const dayHeat = showHeatmap ? heatmapForDay(dayIdx) : [];

            return (
              <div key={dayIdx} className="col">
                <div className={`col-head ${info.isToday ? 'today' : ''}`}>
                  {info.label}
                  <span className="day-num">{info.num}</span>
                </div>

                {Array.from({ length: GRID_ROWS }, (_, r) => (
                  <div
                    key={r}
                    className={`slot-cell ${r % 2 === 1 ? 'hour-mark' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setDrag({ day: dayIdx, startRow: r, endRow: r });
                    }}
                    onMouseEnter={() => {
                      if (drag && drag.day === dayIdx) {
                        setDrag({ ...drag, endRow: r });
                      }
                    }}
                  />
                ))}

                {dayHeat.map((h, i) => {
                  const a = timeToRow(h.start_time);
                  const b = timeToRow(h.end_time);
                  return (
                    <div
                      key={`h${i}`}
                      className="slot team-overlay"
                      style={{
                        top: HEAD_HEIGHT + a * ROW_HEIGHT,
                        height: (b - a) * ROW_HEIGHT - 2,
                        zIndex: 1,
                        opacity: 0.45,
                      }}
                    >
                      <span className="slot-time mono">{h.count} free</span>
                    </div>
                  );
                })}

                {daySlots.map((s) => {
                  const a = timeToRow(s.start_time);
                  const b = timeToRow(s.end_time);
                  return (
                    <div
                      key={s.id}
                      className="slot"
                      style={{ top: HEAD_HEIGHT + a * ROW_HEIGHT, height: (b - a) * ROW_HEIGHT - 2 }}
                    >
                      <span>You're in</span>
                      <span className="slot-time">
                        {formatTime(s.start_time)} – {formatTime(s.end_time)}
                      </span>
                      {!s.pending && (
                        <button
                          className="slot-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            void removeSlot(s.id);
                          }}
                          title="Remove"
                        >
                          <Icon name="x" size={10} />
                        </button>
                      )}
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
                    <div
                      className="slot drafting"
                      style={{ top: HEAD_HEIGHT + a * ROW_HEIGHT, height: (b - a) * ROW_HEIGHT - 2 }}
                    >
                      <span>Drag to set</span>
                      <span className="slot-time">
                        {rowToTime(a)} – {rowToTime(b)}
                      </span>
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
