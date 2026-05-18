import { useEffect, useMemo, useState } from 'react';
import { useUser } from '../hooks/userContext';
import { getTeam } from '../api/teams';
import type { Team, User } from '../types';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import { SideTag } from '../components/Badges';

type Filter = 'all' | 'port' | 'starboard' | 'sculler' | 'cox' | 'coach';

export default function TeamRoster() {
  const { user } = useUser();
  const [team, setTeam] = useState<Team | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (user?.team) void getTeam(user.team).then(setTeam);
  }, [user?.team]);

  const members: User[] = useMemo(() => team?.members ?? [], [team]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: members.length,
      port: members.filter((m) => m.sweep_side === 'port').length,
      starboard: members.filter((m) => m.sweep_side === 'starboard').length,
      sculler: members.filter((m) => m.rowing_type === 'sculling' || m.rowing_type === 'both').length,
      cox: members.filter((m) => m.role === 'coxswain' || m.can_cox).length,
      coach: members.filter((m) => m.role === 'coach').length,
    };
    return c;
  }, [members]);

  const visible = members.filter((u) => {
    if (filter === 'all') return true;
    if (filter === 'coach') return u.role === 'coach';
    if (filter === 'cox') return u.role === 'coxswain' || u.can_cox;
    if (filter === 'port') return u.sweep_side === 'port' || u.sweep_side === 'both';
    if (filter === 'starboard') return u.sweep_side === 'starboard' || u.sweep_side === 'both';
    if (filter === 'sculler') return u.rowing_type === 'sculling' || u.rowing_type === 'both';
    return true;
  });

  const isCoach = user?.role === 'coach';

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">{team?.name?.toUpperCase() ?? 'YOUR TEAM'} · INVITE {team?.invite_code ?? '—'}</div>
          <h2>{isCoach ? 'Roster' : 'Team'}</h2>
        </div>
        <div className="spacer"></div>
        {isCoach && team?.invite_code && (
          <span className="badge" style={{ fontSize: 11 }}>
            <Icon name="plus" size={11} /> share code {team.invite_code}
          </span>
        )}
      </div>

      <div className="filter-strip">
        {(
          [
            ['all', 'All', counts.all],
            ['port', 'Port', counts.port],
            ['starboard', 'Starboard', counts.starboard],
            ['sculler', 'Scullers', counts.sculler],
            ['cox', 'Coxswains', counts.cox],
            ['coach', 'Coaches', counts.coach],
          ] as [Filter, string, number][]
        ).map(([k, l, n]) => (
          <button key={k} className={`chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
            {l}{' '}
            <span className="muted mono" style={{ marginLeft: 4, fontSize: 10 }}>
              {n}
            </span>
          </button>
        ))}
      </div>

      <div className="roster-grid">
        {visible.map((u) => {
          const tintClass =
            u.role === 'coach' ? 'scull' : u.role === 'coxswain' ? 'cox' : u.sweep_side === 'both' ? 'both' : u.sweep_side || 'scull';
          return (
            <div key={u.id} className="roster-card">
              <span className={`tint ${tintClass}`} />
              <Avatar user={u} size={44} />
              <div className="info">
                <div className="nm">
                  {u.first_name} {u.last_name}
                </div>
                <div className="meta">
                  {u.role?.toUpperCase() || 'MEMBER'}
                  {u.sweep_side && ' · '}
                  {u.sweep_side === 'both' ? 'P/S' : u.sweep_side ? <SideTag side={u.sweep_side} /> : ''}
                  {u.weight && ` · ${u.weight}kg`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {visible.length === 0 && <div className="empty-state">No team members match this filter.</div>}
    </>
  );
}
