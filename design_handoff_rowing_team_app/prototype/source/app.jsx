// App shell — sidebar, role switcher, top bar, page router, tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "role": "rower",
  "palette": "default",
  "density": "default",
  "builderVariant": "boat",
  "defaultBoat": "8+",
  "showTeamHeatmap": true,
  "primary": "#ff5d3a"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweaks] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState({ page: 'rower-home' });
  const [navItem, setNavItem] = React.useState('home');

  // Apply tweakable palette tweaks via CSS variables / classes
  const appClass = [
    'app',
    tweaks.density === 'compact' ? 'dense' : '',
    tweaks.density === 'airy' ? 'airy' : '',
    tweaks.palette === 'warm' ? 'warm' : '',
    tweaks.palette === 'lake' ? 'lake' : '',
  ].filter(Boolean).join(' ');

  // primary accent override
  const styleVars = tweaks.primary ? { '--accent': tweaks.primary, '--accent-press': shade(tweaks.primary, -12), '--accent-soft': tweaks.primary + '26' } : {};

  const role = tweaks.role || 'rower';

  // Role switch
  const setRole = (r) => {
    setTweaks('role', r);
    setView({ page: r === 'rower' ? 'rower-home' : 'coach-home' });
    setNavItem('home');
  };

  const openSession = (id) => {
    setView({ page: 'session-detail', sessionId: id });
    setNavItem('sessions');
  };

  // Nav handling per role
  const handleNav = (key) => {
    setNavItem(key);
    if (role === 'rower') {
      const map = {
        home: 'rower-home',
        lineups: 'rower-lineups',
        availability: 'rower-availability',
        team: 'team-roster',
        regattas: 'regattas',
      };
      setView({ page: map[key] || 'rower-home' });
    } else {
      const map = {
        home: 'coach-home',
        sessions: 'coach-sessions',
        plan: 'coach-plan',
        crews: 'coach-crews',
        team: 'team-roster',
        prefs: 'coach-prefs',
        regattas: 'regattas',
      };
      setView({ page: map[key] || 'coach-home' });
    }
  };

  return (
    <div className={appClass} style={styleVars} data-screen-label={`${role} · ${view.page}`}>
      <Sidebar role={role} navItem={navItem} onNav={handleNav} onRole={setRole} />

      <main className="main">
        <TopBar view={view} role={role} setRole={setRole} />
        <div className="content">
          {role === 'rower' && view.page === 'rower-home'        && <RowerHome tweaks={tweaks} />}
          {role === 'rower' && view.page === 'rower-lineups'     && <RowerLineups />}
          {role === 'rower' && view.page === 'rower-availability'&& <RowerAvailability tweaks={tweaks} />}
          {view.page === 'team-roster' && <TeamRoster role={role} />}
          {view.page === 'regattas'    && <Regattas />}
          {role === 'coach' && view.page === 'coach-home'     && <CoachHome onOpenSession={openSession} />}
          {role === 'coach' && view.page === 'coach-sessions' && <CoachSessions onOpenSession={openSession} />}
          {role === 'coach' && view.page === 'coach-plan'     && <CoachPlan onOpenSession={openSession} />}
          {role === 'coach' && view.page === 'coach-crews'    && <CoachCrews />}
          {role === 'coach' && view.page === 'coach-prefs'    && <CoachPrefs />}
          {role === 'coach' && view.page === 'session-detail' && (
            <SessionDetail
              sessionId={view.sessionId}
              onBack={() => { setView({ page: 'coach-sessions' }); setNavItem('sessions'); }}
              tweaks={tweaks}
              setTweaks={(patch) => setTweaks(patch)}
            />
          )}
        </div>
      </main>

      <MobileTabs role={role} navItem={navItem} onNav={handleNav} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Role">
          <TweakRadio
            value={tweaks.role}
            onChange={(v) => setRole(v)}
            options={[
              { value: 'rower', label: 'Rower' },
              { value: 'coach', label: 'Coach' },
            ]}
          />
        </TweakSection>

        <TweakSection label="Palette">
          <TweakRadio
            value={tweaks.palette}
            onChange={(v) => setTweaks('palette', v)}
            options={[
              { value: 'default', label: 'Slate' },
              { value: 'lake', label: 'Lake' },
              { value: 'warm', label: 'Dusk' },
            ]}
          />
          <TweakColor
            label="Primary accent"
            value={tweaks.primary}
            onChange={(v) => setTweaks('primary', v)}
            options={['#ff5d3a','#ff9100','#b6f06a','#66a7ff','#e94560','#a47cff']}
          />
        </TweakSection>

        <TweakSection label="Density">
          <TweakRadio
            value={tweaks.density}
            onChange={(v) => setTweaks('density', v)}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'default', label: 'Default' },
              { value: 'airy', label: 'Airy' },
            ]}
          />
        </TweakSection>

        <TweakSection label="Crew builder">
          <TweakRadio
            value={tweaks.builderVariant}
            onChange={(v) => setTweaks('builderVariant', v)}
            options={[
              { value: 'boat', label: 'Hull' },
              { value: 'abstract', label: 'List' },
            ]}
          />
          <TweakSelect
            label="Default boat"
            value={tweaks.defaultBoat}
            onChange={(v) => setTweaks('defaultBoat', v)}
            options={[
              { value: '1x', label: '1× Single' },
              { value: '2x', label: '2× Double' },
              { value: '2-', label: '2− Pair' },
              { value: '4x', label: '4× Quad' },
              { value: '4-', label: '4− Four' },
              { value: '4+', label: '4+ Coxed four' },
              { value: '8+', label: '8+ Eight' },
            ]}
          />
        </TweakSection>

        <TweakSection label="Availability">
          <TweakToggle
            label="Show team heatmap"
            value={tweaks.showTeamHeatmap}
            onChange={(v) => setTweaks('showTeamHeatmap', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

function Sidebar({ role, navItem, onNav, onRole }) {
  const D = window.RowOrgData;
  const me = role === 'rower' ? D.ME_ROWER : D.ME_COACH;

  const rowerNav = [
    { key: 'home',         label: 'Home',          icon: 'home' },
    { key: 'lineups',      label: 'Lineups',       icon: 'boat',     count: 3 },
    { key: 'availability', label: 'Availability',  icon: 'calendar' },
    { key: 'team',         label: 'Team',          icon: 'users' },
  ];
  const coachNav = [
    { key: 'home',     label: 'Overview',  icon: 'home' },
    { key: 'sessions', label: 'Sessions',  icon: 'calendar', count: 4 },
    { key: 'plan',     label: 'Plan',      icon: 'bolt' },
    { key: 'crews',    label: 'Crews',     icon: 'boat',     count: 3 },
    { key: 'team',     label: 'Roster',    icon: 'users',    count: 12 },
    { key: 'prefs',    label: 'Preferences', icon: 'settings' },
  ];
  const items = role === 'rower' ? rowerNav : coachNav;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">R</div>
        <div className="brand-name">roworg<span>.</span></div>
      </div>

      <div className="nav-group">
        <div className="nav-label">{role === 'rower' ? 'You' : 'Coaching'}</div>
        {items.map(item => (
          <button key={item.key} className={`nav-item ${navItem === item.key ? 'active' : ''}`} onClick={() => onNav(item.key)}>
            <span className="nav-dot"></span>
            <Icon name={item.icon} size={14} />
            <span>{item.label}</span>
            {item.count != null && <span className="nav-count">{item.count}</span>}
          </button>
        ))}
      </div>

      <div className="nav-group">
        <div className="nav-label">Club</div>
        <button className={`nav-item ${navItem === 'regattas' ? 'active' : ''}`} onClick={() => onNav('regattas')}><span className="nav-dot"></span><Icon name="trophy" size={14} /><span>Regattas</span></button>
      </div>

      <div className="role-switch" style={{ marginTop: 'auto' }}>
        <span className={`role-pill ${role === 'coach' ? 'right' : ''}`}></span>
        <button className={`role-btn ${role === 'rower' ? 'active' : ''}`} onClick={() => onRole('rower')}>
          Rower
        </button>
        <button className={`role-btn ${role === 'coach' ? 'active' : ''}`} onClick={() => onRole('coach')}>
          Coach
        </button>
      </div>

      <div className="profile">
        <Avatar user={me} size={32} />
        <div className="profile-meta">
          <div className="name">{me.first_name} {me.last_name}</div>
          <div className="sub">Lake Bled RC · {role === 'coach' ? 'Head coach' : me.sweep_side?.toUpperCase()}</div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ view, role, setRole }) {
  return (
    <div className="topbar">
      <div className="crumb">
        <b>{role === 'rower' ? 'Rower' : 'Coach'}</b>
        {' / '}
        <span>{titleFor(view, role)}</span>
      </div>
      <div className="spacer"></div>
      <button className="btn ghost icon" title="Search"><Icon name="search" size={14} /></button>
      <button className="btn ghost icon" title="Notifications"><Icon name="bell" size={14} /></button>
      <span className="kbd">⌘K</span>
    </div>
  );
}

function MobileTabs({ role, navItem, onNav }) {
  const items = role === 'rower'
    ? [
        { key: 'home',         label: 'Home',     icon: 'home' },
        { key: 'lineups',      label: 'Lineups',  icon: 'boat' },
        { key: 'availability', label: 'Calendar', icon: 'calendar' },
        { key: 'team',         label: 'Team',     icon: 'users' },
      ]
    : [
        { key: 'home',     label: 'Overview', icon: 'home' },
        { key: 'sessions', label: 'Sessions', icon: 'calendar' },
        { key: 'crews',    label: 'Crews',    icon: 'boat' },
        { key: 'team',     label: 'Roster',   icon: 'users' },
      ];
  return (
    <nav className="mobile-tabs">
      {items.map(it => (
        <button key={it.key} className={`mtab ${navItem === it.key ? 'active' : ''}`} onClick={() => onNav(it.key)}>
          <Icon name={it.icon} size={18} />
          <span>{it.label}</span>
          <span className="mdot"></span>
        </button>
      ))}
    </nav>
  );
}

function titleFor(view, role) {
  const map = {
    'rower-home': 'Home',
    'rower-lineups': 'Lineups',
    'rower-availability': 'Availability',
    'team-roster': role === 'coach' ? 'Roster' : 'Team',
    'regattas': 'Regattas',
    'coach-home': 'Overview',
    'coach-sessions': 'Sessions',
    'coach-plan': 'Plan',
    'coach-crews': 'Crews',
    'coach-prefs': 'Preferences',
    'session-detail': 'Session detail',
  };
  return map[view.page] || 'Home';
}

// shade hex color (negative=darker)
function shade(hex, amount) {
  const c = hex.replace('#','');
  const r = parseInt(c.slice(0,2),16);
  const g = parseInt(c.slice(2,4),16);
  const b = parseInt(c.slice(4,6),16);
  const adj = (v) => Math.max(0, Math.min(255, v + Math.round(amount * 2.55)));
  return '#' + [adj(r),adj(g),adj(b)].map(v => v.toString(16).padStart(2,'0')).join('');
}

window.App = App;

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
