import { useState, useEffect } from 'react';
import type { Availability } from '../types';
import { getMyAvailability, createAvailability, deleteAvailability } from '../api/availability';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export default function AvailabilityCalendar() {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [slots, setSlots] = useState<Availability[]>([]);
  const [adding, setAdding] = useState<{ day: number } | null>(null);
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('18:00');

  const loadSlots = async () => {
    const data = await getMyAvailability(weekStart);
    setSlots(data);
  };

  useEffect(() => { loadSlots(); }, [weekStart]);

  const shiftWeek = (dir: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adding) return;
    await createAvailability({
      week_start: weekStart,
      day_of_week: adding.day,
      start_time: startTime,
      end_time: endTime,
    });
    setAdding(null);
    loadSlots();
  };

  const handleDelete = async (id: number) => {
    await deleteAvailability(id);
    loadSlots();
  };

  return (
    <div className="availability-calendar">
      <div className="week-nav">
        <button onClick={() => shiftWeek(-1)}>&lt; Prev</button>
        <span>Week of {weekStart}</span>
        <button onClick={() => shiftWeek(1)}>Next &gt;</button>
      </div>

      <div className="week-grid">
        {DAYS.map((day, i) => (
          <div key={i} className="day-column">
            <h4>{day}</h4>
            {slots.filter(s => s.day_of_week === i).map(s => (
              <div key={s.id} className="slot">
                {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                <button onClick={() => handleDelete(s.id)}>x</button>
              </div>
            ))}
            <button className="add-slot-btn" onClick={() => setAdding({ day: i })}>+ Add</button>
          </div>
        ))}
      </div>

      {adding !== null && (
        <div className="add-slot-form">
          <h4>Add slot for {DAYS[adding.day]}</h4>
          <form onSubmit={handleAdd}>
            <label>From: <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></label>
            <label>To: <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} /></label>
            <button type="submit">Add</button>
            <button type="button" onClick={() => setAdding(null)}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}
