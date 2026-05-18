import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/userContext';
import { getSessions } from '../api/sessions';
import { getTeam } from '../api/teams';
import type { Session, Team } from '../types';
import SessionRow from '../components/cards/SessionRow';
import SectionTitle from '../components/SectionTitle';
import Icon from '../components/Icon';
import { crewStatus } from '../lib/crewHelpers';
import { mondayOf, formatISODate } from '../lib/dates';

export default function CoachHome() {
  const { user } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [team, setTeam] = useState<Team | null>(null);

  const weekISO = formatISODate(mondayOf(new Date()));

  useEffect(() => {
    void getSessions(weekISO).then(setSessions);
  }, [weekISO]);

  useEffect(() => {
    if (user?.team) void getTeam(user.team).then(setTeam);
  }, [user?.team]);

  const totals = useMemo(() => {
    const crews = sessions.flatMap((s) => s.crews);
    const confirmed = crews.filter((c) => crewStatus(c) === 'confirmed').length;
    const draft = crews.filter((c) => crewStatus(c) === 'draft').length;
    return { total: crews.length, confirmed, draft };
  }, [sessions]);

  const rowerCount = team?.members?.filter((m) => m.role !== 'coach').length ?? 0;

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">COACH DASHBOARD · {team?.name?.toUpperCase() ?? 'YOUR TEAM'}</div>
          <h2>This week's water time</h2>
        </div>
        <div className="spacer"></div>
        <Link to="/plan" className="btn">
          <Icon name="bolt" size={13} /> Plan
        </Link>
        <Link to="/sessions" className="btn primary">
          <Icon name="plus" size={13} /> New session
        </Link>
      </div>

      <div className="metric-row">
        <div className="metric">
          <span className="label">Sessions · this wk</span>
          <span className="val tabular">{sessions.length}</span>
          <span className="trend muted mono">{sessions.length === 0 ? 'no sessions yet' : 'live'}</span>
        </div>
        <div className="metric">
          <span className="label">Crews scheduled</span>
          <span className="val tabular">{totals.total}</span>
          <span className="trend mono muted">{totals.confirmed} confirmed</span>
        </div>
        <div className="metric">
          <span className="label">Active rowers</span>
          <span className="val tabular">{rowerCount}</span>
          <span className="trend">{team ? 'team loaded' : 'loading…'}</span>
        </div>
        <div className="metric">
          <span className="label">Drafts awaiting</span>
          <span className="val tabular" style={{ color: totals.draft ? 'var(--warn)' : undefined }}>
            {totals.draft}
          </span>
          <span className="trend warn mono">{totals.draft ? 'needs approval' : 'all clear'}</span>
        </div>
      </div>

      <SectionTitle title="Scheduled sessions" hint={`${sessions.length} this week`} />
      {sessions.length === 0 ? (
        <div className="empty-state">No sessions scheduled. Use the Plan page or create one directly.</div>
      ) : (
        <div>
          {sessions.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </div>
      )}
    </>
  );
}
