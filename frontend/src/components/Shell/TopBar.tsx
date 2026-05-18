import { useLocation, useMatch } from 'react-router-dom';
import { useUser } from '../../hooks/userContext';
import Icon from '../Icon';

const TITLE_BY_PATH: Record<string, string> = {
  '/home': 'Home',
  '/lineups': 'Lineups',
  '/availability': 'Availability',
  '/sessions': 'Sessions',
  '/plan': 'Plan',
  '/crews': 'Crews',
  '/team': 'Team',
  '/preferences': 'Preferences',
  '/regattas': 'Regattas',
};

export default function TopBar() {
  const { user } = useUser();
  const location = useLocation();
  const sessionMatch = useMatch('/sessions/:id');

  const roleLabel = user?.role === 'coach' ? 'Coach' : user?.role === 'coxswain' ? 'Coxswain' : 'Rower';

  let title = TITLE_BY_PATH[location.pathname];
  if (!title && sessionMatch) title = 'Session detail';
  if (!title) title = 'Home';

  return (
    <div className="topbar">
      <div className="crumb">
        <b>{roleLabel}</b>
        {' / '}
        <span>{title}</span>
      </div>
      <div className="spacer"></div>
      <button className="btn ghost icon" title="Search">
        <Icon name="search" size={14} />
      </button>
      <button className="btn ghost icon" title="Notifications">
        <Icon name="bell" size={14} />
      </button>
      <span className="kbd">⌘K</span>
    </div>
  );
}
