import { Link } from 'react-router-dom';
import type { Session } from '../../types';
import { MONTHS, DAY_LABELS, parseISODate, formatTime, dayOfWeek } from '../../lib/dates';
import { crewStatus } from '../../lib/crewHelpers';
import Icon from '../Icon';

interface Props {
  session: Session;
  to?: string;
}

export default function SessionRow({ session, to }: Props) {
  const dateObj = parseISODate(session.date);
  const dow = dayOfWeek(dateObj);
  const href = to ?? `/sessions/${session.id}`;

  return (
    <Link to={href} className="session-row">
      <div className="date-block">
        <div className="d">{dateObj.getDate()}</div>
        <div className="m">{MONTHS[dateObj.getMonth()]}</div>
      </div>
      <div className="session-meta">
        <div className="when mono">
          {DAY_LABELS[dow]} · {formatTime(session.start_time)} – {formatTime(session.end_time)}
        </div>
        <div className="title">{session.description || 'Practice'}</div>
        {session.crews.length > 0 && (
          <div className="sub">
            {session.crews.length} crew{session.crews.length === 1 ? '' : 's'}
          </div>
        )}
      </div>
      <div className="crew-pill-row">
        {session.crews.length === 0 ? (
          <span className="crew-pill" style={{ color: 'var(--text-3)' }}>
            no crew
          </span>
        ) : (
          session.crews.map((c) => {
            const status = crewStatus(c);
            return (
              <span key={c.id} className={`crew-pill ${status === 'confirmed' ? 'confirmed' : status === 'draft' ? 'draft' : ''}`}>
                {c.boat_type}
              </span>
            );
          })
        )}
      </div>
      <div className="muted mono" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        open <Icon name="chevR" size={11} />
      </div>
    </Link>
  );
}
