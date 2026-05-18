import { NavLink } from 'react-router-dom';
import { useUser } from '../../hooks/userContext';
import Icon from '../Icon';

const COACH_TABS = [
  { to: '/home', label: 'Overview', icon: 'home' },
  { to: '/sessions', label: 'Sessions', icon: 'calendar' },
  { to: '/crews', label: 'Crews', icon: 'boat' },
  { to: '/team', label: 'Roster', icon: 'users' },
];

const ROWER_TABS = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/lineups', label: 'Lineups', icon: 'boat' },
  { to: '/availability', label: 'Calendar', icon: 'calendar' },
  { to: '/team', label: 'Team', icon: 'users' },
];

export default function MobileTabs() {
  const { user } = useUser();
  if (!user) return null;
  const items = user.role === 'coach' ? COACH_TABS : ROWER_TABS;

  return (
    <nav className="mobile-tabs">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} className={({ isActive }) => `mtab ${isActive ? 'active' : ''}`}>
          <Icon name={it.icon} size={18} />
          <span>{it.label}</span>
          <span className="mdot"></span>
        </NavLink>
      ))}
    </nav>
  );
}
