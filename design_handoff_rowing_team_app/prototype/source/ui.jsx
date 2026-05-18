// ROWORG — Shared UI primitives (icons, avatars, badges)
const Icon = ({ name, size = 14 }) => {
  const paths = {
    home:      'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
    calendar:  'M4 5h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 9h18M8 3v4M16 3v4',
    boat:      'M2 16c2 2 4 2 6 0s4-2 6 0 4 2 6 0M5 14l1-7h12l1 7M9 7V4h6v3',
    users:     'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm6-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM2 20c.5-3 3-5 7-5s6.5 2 7 5M15 14c3 .5 5 2 5 6',
    bolt:      'M13 2L4 14h7l-1 8 9-12h-7z',
    filter:    'M3 5h18l-7 9v6l-4-2v-4z',
    chevL:     'M15 18l-6-6 6-6',
    chevR:     'M9 6l6 6-6 6',
    plus:      'M12 5v14M5 12h14',
    check:     'M5 12l5 5 9-11',
    x:         'M6 6l12 12M18 6L6 18',
    menu:      'M4 7h16M4 12h16M4 17h16',
    search:    'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm6-2l4 4',
    settings:  'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm9 3l-2-1 1-2-2-2-2 1-1-2h-2l-1 2-2-1-2 2 1 2-2 1v2l2 1-1 2 2 2 2-1 1 2h2l1-2 2 1 2-2-1-2 2-1z',
    bell:      'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9zM10 21a2 2 0 0 0 4 0',
    sun:       'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z',
    moon:      'M21 13a8 8 0 1 1-10-10 7 7 0 0 0 10 10z',
    play:      'M6 4l14 8-14 8z',
    flag:      'M5 21V4m0 0h11l-2 4 2 4H5',
    trophy:    'M8 4h8v4a4 4 0 0 1-8 0V4zM6 4H4v2a3 3 0 0 0 4 3M18 4h2v2a3 3 0 0 1-4 3M10 14h4M9 21h6M11 14v7M13 14v7',
    grid:      'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    list:      'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name] || ''} />
    </svg>
  );
};

const Avatar = ({ user, size = 24 }) => {
  if (!user) return null;
  const tintClass = user.tint || 'water';
  return (
    <div className={`av ${tintClass === 'lime' ? 'lime' : tintClass === 'coral' ? '' : 'cool'} avatar-mini`}
         style={{
           width: size, height: size, borderRadius: '50%',
           display: 'grid', placeItems: 'center',
           fontSize: Math.round(size * 0.42),
           fontWeight: 600,
           color: tintClass === 'lime' ? '#0a1500' : '#fff',
           background:
             tintClass === 'lime'   ? 'linear-gradient(135deg, #b6f06a, #6ab022)' :
             tintClass === 'water'  ? 'linear-gradient(135deg, #66a7ff, #2c6fd6)' :
                                      'linear-gradient(135deg, #ff5d3a, #c5350f)',
           flexShrink: 0,
           boxShadow: '0 0 0 1px rgba(255,255,255,.08) inset',
           letterSpacing: '-.02em',
         }}>
      {user.init || (user.first_name?.[0] || '?')}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  if (status === 'confirmed') return <span className="badge lime"><span className="b-dot"></span>Confirmed</span>;
  if (status === 'cancelled') return <span className="badge danger"><span className="b-dot"></span>Cancelled</span>;
  return <span className="badge warn"><span className="b-dot"></span>Draft</span>;
};

const SideTag = ({ side }) => {
  if (side === 'port') return <span className="side-p mono">PORT</span>;
  if (side === 'starboard') return <span className="side-s mono">STBD</span>;
  if (side === 'cox') return <span className="mono" style={{ color: 'var(--water)' }}>COX</span>;
  return <span className="mono muted">—</span>;
};

window.Icon = Icon;
window.Avatar = Avatar;
window.StatusBadge = StatusBadge;
window.SideTag = SideTag;
