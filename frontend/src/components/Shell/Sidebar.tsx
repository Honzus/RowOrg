import { NavLink } from 'react-router-dom';
import { useUser } from '../../hooks/userContext';
import Icon from '../Icon';
import Avatar from '../Avatar';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const COACH_NAV: NavItem[] = [
  { to: '/home', label: 'Overview', icon: 'home' },
  { to: '/sessions', label: 'Sessions', icon: 'calendar' },
  { to: '/plan', label: 'Plan', icon: 'bolt' },
  { to: '/crews', label: 'Crews', icon: 'boat' },
  { to: '/team', label: 'Roster', icon: 'users' },
  { to: '/preferences', label: 'Preferences', icon: 'settings' },
];

const ROWER_NAV: NavItem[] = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/lineups', label: 'Lineups', icon: 'boat' },
  { to: '/availability', label: 'Availability', icon: 'calendar' },
  { to: '/team', label: 'Team', icon: 'users' },
];

export default function Sidebar() {
  const { user, logout } = useUser();
  if (!user) return null;
  const isCoach = user.role === 'coach';
  const items = isCoach ? COACH_NAV : ROWER_NAV;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">R</div>
        <div className="brand-name">
          roworg<span>.</span>
        </div>
      </div>

      <div className="nav-group">
        <div className="nav-label">{isCoach ? 'Coaching' : 'You'}</div>
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-dot"></span>
            <Icon name={item.icon} size={14} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="nav-group">
        <div className="nav-label">Club</div>
        <NavLink to="/regattas" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-dot"></span>
          <Icon name="trophy" size={14} />
          <span>Regattas</span>
        </NavLink>
      </div>

      <div className="role-indicator">
        <span>Role</span>
        <strong>{isCoach ? 'Coach' : user.role === 'coxswain' ? 'Coxswain' : 'Rower'}</strong>
      </div>

      <div className="profile">
        <Avatar user={user} size={32} />
        <div className="profile-meta">
          <div className="name">
            {user.first_name || user.email} {user.last_name}
          </div>
          <div className="sub">
            {isCoach ? 'Head coach' : user.sweep_side ? user.sweep_side.toUpperCase() : user.rowing_type?.toUpperCase() || 'Rower'}
          </div>
        </div>
        <button type="button" onClick={logout} title="Log out">
          <Icon name="logout" size={14} />
        </button>
      </div>
    </aside>
  );
}
