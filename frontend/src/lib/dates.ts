export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_LABELS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function parseISODate(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function mondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function weekLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()}–${end.getDate()}`;
  }
  return `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}`;
}

/** day_of_week: 0=Mon ... 6=Sun, matches backend Availability model */
export function dayOfWeek(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** "HH:MM" or "HH:MM:SS" -> minutes since midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Format "HH:MM" stripping seconds if present */
export function formatTime(time: string): string {
  return time.slice(0, 5);
}

/**
 * Availability calendar runs 05:00 → 21:00 in 30-minute rows = 32 rows.
 * Row 0 = 05:00, Row 31 = 20:30 → 21:00.
 */
export const GRID_START_MIN = 5 * 60;
export const GRID_ROW_MIN = 30;
export const GRID_ROWS = 32;
export const GRID_END_MIN = GRID_START_MIN + GRID_ROWS * GRID_ROW_MIN;
export const ROW_HEIGHT = 18;

export function rowToTime(row: number): string {
  return minutesToTime(GRID_START_MIN + row * GRID_ROW_MIN);
}

export function timeToRow(time: string): number {
  const min = timeToMinutes(time);
  return (min - GRID_START_MIN) / GRID_ROW_MIN;
}
