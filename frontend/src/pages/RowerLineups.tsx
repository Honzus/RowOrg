import { useEffect, useMemo, useState } from 'react';
import { useUser } from '../hooks/userContext';
import { getSessions } from '../api/sessions';
import type { Session } from '../types';
import LineupCard from '../components/cards/LineupCard';
import SectionTitle from '../components/SectionTitle';
import Icon from '../components/Icon';
import { crewStatus } from '../lib/crewHelpers';
import { timeToMinutes } from '../lib/dates';

export default function RowerLineups() {
  const { user } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    void getSessions().then(setSessions);
  }, []);

  const myLineups = useMemo(() => {
    if (!user) return [];
    return sessions.flatMap((session) =>
      session.crews
        .filter((crew) => crew.seats.some((seat) => seat.rower === user.id))
        .map((crew) => ({ session, crew }))
    );
  }, [sessions, user]);

  const grouped = {
    confirmed: myLineups.filter(({ crew }) => crewStatus(crew) === 'confirmed'),
    draft: myLineups.filter(({ crew }) => crewStatus(crew) === 'draft'),
    cancelled: myLineups.filter(({ crew }) => crewStatus(crew) === 'cancelled'),
  };

  const onWaterHours = myLineups
    .filter(({ crew }) => crewStatus(crew) !== 'cancelled')
    .reduce((acc, { session }) => acc + (timeToMinutes(session.end_time) - timeToMinutes(session.start_time)) / 60, 0);

  if (!user) return null;

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">YOUR ASSIGNMENTS · {(user.first_name || user.email).toUpperCase()}</div>
          <h2>Lineups</h2>
        </div>
        <div className="spacer"></div>
        <button className="btn">
          <Icon name="bell" size={13} /> Notify on new
        </button>
      </div>

      <div className="metric-row">
        <div className="metric">
          <span className="label">Total assigned</span>
          <span className="val tabular">{myLineups.length}</span>
          <span className="trend muted mono">
            {grouped.confirmed.length} approved · {grouped.draft.length} draft
          </span>
        </div>
        <div className="metric">
          <span className="label">Hours on water</span>
          <span className="val tabular">
            {onWaterHours.toFixed(1)} <small>h</small>
          </span>
          <span className="trend muted mono">excludes cancelled</span>
        </div>
        <div className="metric">
          <span className="label">Cancelled</span>
          <span className="val tabular" style={{ color: grouped.cancelled.length ? 'var(--danger)' : undefined }}>
            {grouped.cancelled.length}
          </span>
          <span className="trend muted mono">{grouped.cancelled.length ? 'review with coach' : 'none'}</span>
        </div>
        <div className="metric">
          <span className="label">Awaiting approval</span>
          <span className="val tabular" style={{ color: grouped.draft.length ? 'var(--warn)' : undefined }}>
            {grouped.draft.length}
          </span>
          <span className="trend warn mono">{grouped.draft.length ? 'draft' : 'all set'}</span>
        </div>
      </div>

      {grouped.confirmed.length > 0 && (
        <>
          <SectionTitle title="Approved" hint={`${grouped.confirmed.length} confirmed`} />
          <div className="lineups">
            {grouped.confirmed.map(({ session, crew }) => (
              <LineupCard key={crew.id} session={session} crew={crew} highlightRowerId={user.id} />
            ))}
          </div>
        </>
      )}
      {grouped.draft.length > 0 && (
        <>
          <SectionTitle title="Pending" hint={`${grouped.draft.length} awaiting coach approval`} />
          <div className="lineups">
            {grouped.draft.map(({ session, crew }) => (
              <LineupCard key={crew.id} session={session} crew={crew} highlightRowerId={user.id} />
            ))}
          </div>
        </>
      )}
      {grouped.cancelled.length > 0 && (
        <>
          <SectionTitle title="Cancelled" />
          <div className="lineups">
            {grouped.cancelled.map(({ session, crew }) => (
              <LineupCard key={crew.id} session={session} crew={crew} highlightRowerId={user.id} />
            ))}
          </div>
        </>
      )}

      {myLineups.length === 0 && (
        <div className="empty-state">No lineups assigned. Add availability so the coach can slot you in.</div>
      )}
    </>
  );
}
