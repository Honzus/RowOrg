import { useEffect, useMemo, useState } from 'react';
import { useUser } from '../hooks/userContext';
import { getSessions } from '../api/sessions';
import { getMyAvailability } from '../api/availability';
import type { Session, Availability } from '../types';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import LineupCard from '../components/cards/LineupCard';
import SectionTitle from '../components/SectionTitle';
import Icon from '../components/Icon';
import { crewStatus } from '../lib/crewHelpers';
import { mondayOf, formatISODate, timeToMinutes } from '../lib/dates';

export default function RowerHome() {
  const { user } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);

  const weekISO = formatISODate(mondayOf(new Date()));

  useEffect(() => {
    void getSessions(weekISO).then(setSessions);
    void getMyAvailability(weekISO).then(setAvailability);
  }, [weekISO]);

  const myLineups = useMemo(() => {
    if (!user) return [];
    return sessions.flatMap((session) =>
      session.crews
        .filter((crew) => crew.seats.some((seat) => seat.rower === user.id))
        .map((crew) => ({ session, crew }))
    );
  }, [sessions, user]);

  const hoursAvailable = availability.reduce((acc, s) => {
    return acc + (timeToMinutes(s.end_time) - timeToMinutes(s.start_time)) / 60;
  }, 0);
  const hoursOnWater = myLineups.reduce((acc, { session }) => {
    return acc + (timeToMinutes(session.end_time) - timeToMinutes(session.start_time)) / 60;
  }, 0);
  const confirmedCount = myLineups.filter(({ crew }) => crewStatus(crew) === 'confirmed').length;
  const draftCount = myLineups.length - confirmedCount - myLineups.filter(({ crew }) => crewStatus(crew) === 'cancelled').length;
  const avgSlot = availability.length
    ? Math.round((hoursAvailable / availability.length) * 10) / 10
    : 0;

  if (!user) return null;

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">WELCOME BACK</div>
          <h2>Hey, {user.first_name || 'rower'}.</h2>
        </div>
        <div className="spacer"></div>
        <button className="btn">
          <Icon name="bell" size={13} /> Notify on lineup
        </button>
      </div>

      <div className="metric-row">
        <div className="metric">
          <span className="label">Hrs available · this wk</span>
          <span className="val tabular">
            {hoursAvailable.toFixed(1)} <small>h</small>
          </span>
          <span className="trend muted mono">{availability.length} slot{availability.length === 1 ? '' : 's'}</span>
        </div>
        <div className="metric">
          <span className="label">Practices booked</span>
          <span className="val tabular">{myLineups.length}</span>
          <span className="trend muted mono">
            {confirmedCount} confirmed · {draftCount} draft
          </span>
        </div>
        <div className="metric">
          <span className="label">On-water hours</span>
          <span className="val tabular">
            {hoursOnWater.toFixed(1)} <small>h</small>
          </span>
          <span className="trend">{user.sweep_side ? `Sweep · ${user.sweep_side}` : user.rowing_type || '—'}</span>
        </div>
        <div className="metric">
          <span className="label">Avg slot length</span>
          <span className="val tabular">
            {avgSlot} <small>h</small>
          </span>
          <span className="trend muted mono">{availability.length} slots set</span>
        </div>
      </div>

      <SectionTitle title="This week's availability" hint="Drag any range on the grid to set a slot. Hover to remove." />
      <AvailabilityCalendar />

      <SectionTitle title="My lineups" hint={`${myLineups.length} upcoming`} />
      {myLineups.length === 0 ? (
        <div className="empty-state">No lineups assigned yet. Set your availability above and the coach will slot you in.</div>
      ) : (
        <div className="lineups">
          {myLineups.map(({ session, crew }) => (
            <LineupCard key={crew.id} session={session} crew={crew} highlightRowerId={user.id} />
          ))}
        </div>
      )}
    </>
  );
}
