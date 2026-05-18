import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSessions } from '../api/sessions';
import type { Session, CrewAssignment } from '../types';
import { StatusBadge, SideTag } from '../components/Badges';
import { crewStatus, seatSide } from '../lib/crewHelpers';
import type { CrewStatus } from '../lib/crewHelpers';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import { MONTHS, parseISODate, formatTime } from '../lib/dates';

type Filter = 'all' | CrewStatus;

export default function CoachCrews() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    void getSessions().then(setSessions);
  }, []);

  const allCrews = useMemo(
    () => sessions.flatMap((s) => s.crews.map((c) => ({ session: s, crew: c }))),
    [sessions]
  );

  const counts: Record<Filter, number> = {
    all: allCrews.length,
    confirmed: allCrews.filter(({ crew }) => crewStatus(crew) === 'confirmed').length,
    draft: allCrews.filter(({ crew }) => crewStatus(crew) === 'draft').length,
    cancelled: allCrews.filter(({ crew }) => crewStatus(crew) === 'cancelled').length,
  };

  const visible = allCrews.filter(({ crew }) => (filter === 'all' ? true : crewStatus(crew) === filter));

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">
            {counts.all} CREW{counts.all === 1 ? '' : 'S'} · {counts.draft} NEED APPROVAL
          </div>
          <h2>Crews</h2>
        </div>
      </div>

      <div className="filter-strip">
        {(
          [
            ['all', 'All'],
            ['confirmed', 'Confirmed'],
            ['draft', 'Draft'],
            ['cancelled', 'Cancelled'],
          ] as [Filter, string][]
        ).map(([k, l]) => (
          <button key={k} className={`chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
            {l}{' '}
            <span className="muted mono" style={{ marginLeft: 4, fontSize: 10 }}>
              {counts[k]}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">No crews to show.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 12 }}>
          {visible.map(({ session, crew }) => (
            <CrewBrief key={crew.id} session={session} crew={crew} />
          ))}
        </div>
      )}
    </>
  );
}

function CrewBrief({ session, crew }: { session: Session; crew: CrewAssignment }) {
  const status = crewStatus(crew);
  const date = parseISODate(session.date);
  const rowers = crew.seats
    .filter((s) => !s.is_cox)
    .slice()
    .sort((a, b) => a.seat_number - b.seat_number);
  const cox = crew.seats.find((s) => s.is_cox);

  return (
    <Link to={`/sessions/${session.id}`} className={`lineup ${status}`} style={{ display: 'block', textDecoration: 'none' }}>
      <span className="stripe"></span>
      <div className="lineup-top" style={{ marginBottom: 6 }}>
        <div className="lineup-date">
          <span className="d">{date.getDate()}</span>
          <span className="m">{MONTHS[date.getMonth()]}</span>
        </div>
        <div className="lineup-info">
          <div className="boat">
            {crew.boat_type}
            <StatusBadge status={status} />
          </div>
          <div className="time">
            {formatTime(session.start_time)} – {formatTime(session.end_time)} · {session.description || 'Practice'}
          </div>
        </div>
        <Icon name="chevR" size={14} />
      </div>
      <div className="seats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 14 }}>
        {rowers.map((s, idx) => {
          const pos = idx === 0 ? 'BOW' : idx === rowers.length - 1 ? 'STK' : String(idx + 1);
          return (
            <div key={s.id} className="seat-row">
              <span className="pos">{pos}</span>
              <Avatar user={s.rower_detail ?? null} size={16} />
              <span className="name" style={{ fontSize: 12 }}>
                {s.rower_detail?.first_name || `#${s.rower}`}
              </span>
              <SideTag side={seatSide(s)} />
            </div>
          );
        })}
        {cox && (
          <div className="seat-row">
            <span className="pos">COX</span>
            <Avatar user={cox.rower_detail ?? null} size={16} />
            <span className="name" style={{ fontSize: 12 }}>
              {cox.rower_detail?.first_name || `#${cox.rower}`}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
