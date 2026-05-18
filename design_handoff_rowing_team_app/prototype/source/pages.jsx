// Rower & Coach pages

// ============ ROWER: My Lineups + Availability ============
function RowerHome({ tweaks }) {
  const D = window.RowOrgData;
  const me = D.ME_ROWER;

  // collect this user's upcoming lineups
  const myLineups = [];
  D.SESSIONS.forEach(session => {
    session.crews.forEach(crew => {
      const mySeat = crew.seats.find(s => s.rower === me.id);
      if (mySeat) myLineups.push({ session, crew, mySeat });
    });
  });

  // metrics
  const confirmedCount = myLineups.filter(l => l.crew.status === 'confirmed').length;
  const hoursThisWeek = myLineups.reduce((acc, l) => {
    const [sh, sm] = l.session.start.split(':').map(Number);
    const [eh, em] = l.session.end.split(':').map(Number);
    return acc + ((eh - sh) + (em - sm) / 60);
  }, 0);
  const avgSlot = (() => {
    if (D.MY_AVAIL.length === 0) return 0;
    const totalH = D.MY_AVAIL.reduce((a, s) => {
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      return a + ((eh - sh) + (em - sm) / 60);
    }, 0);
    return Math.round((totalH / D.MY_AVAIL.length) * 10) / 10;
  })();

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">WELCOME BACK</div>
          <h2>Hey, {me.first_name}.</h2>
        </div>
        <div className="spacer"></div>
        <button className="btn"><Icon name="bell" size={13} /> Notify on lineup</button>
        <button className="btn primary"><Icon name="plus" size={13} /> Add availability</button>
      </div>

      <div className="metric-row">
        <div className="metric">
          <span className="label">Hrs available · this wk</span>
          <span className="val tabular">{D.MY_AVAIL.reduce((a,s)=>{const [sh,sm]=s.start.split(':').map(Number);const [eh,em]=s.end.split(':').map(Number);return a+((eh-sh)+(em-sm)/60);},0).toFixed(1)} <small>h</small></span>
          <span className="trend">↑ 2.5h vs last wk</span>
        </div>
        <div className="metric">
          <span className="label">Practices booked</span>
          <span className="val tabular">{myLineups.length}</span>
          <span className="trend muted mono">{confirmedCount} confirmed · {myLineups.length - confirmedCount} draft</span>
        </div>
        <div className="metric">
          <span className="label">On-water hours</span>
          <span className="val tabular">{hoursThisWeek.toFixed(1)} <small>h</small></span>
          <span className="trend">Sweep · Port</span>
        </div>
        <div className="metric">
          <span className="label">Avg slot length</span>
          <span className="val tabular">{avgSlot} <small>h</small></span>
          <span className="trend muted mono">{D.MY_AVAIL.length} slots set</span>
        </div>
      </div>

      <SectionTitle title="This week's availability" hint="Drag any cell on the grid to add a slot. Click ✕ to remove." />
      <AvailabilityCalendar tweaks={tweaks} />

      <SectionTitle title="My lineups" hint={`${myLineups.length} upcoming`} />
      {myLineups.length === 0
        ? <div className="empty-state">No lineups assigned yet. Set your availability above and the coach will slot you in.</div>
        : (
          <div className="lineups">
            {myLineups.map(({ session, crew, mySeat }) => (
              <LineupCard key={crew.id} session={session} crew={crew} mySeat={mySeat} />
            ))}
          </div>
        )
      }
    </>
  );
}

function LineupCard({ session, crew, mySeat }) {
  const D = window.RowOrgData;
  const dateObj = new Date(session.date + 'T00:00:00');
  const day = dateObj.getDate();
  const month = D.MONTHS[dateObj.getMonth()];
  const me = D.ME_ROWER;
  return (
    <div className={`lineup ${crew.status}`}>
      <span className="stripe"></span>
      <div className="lineup-top">
        <div className="lineup-date">
          <span className="d">{day}</span>
          <span className="m">{month}</span>
        </div>
        <div className="lineup-info">
          <div className="boat">
            {crew.boat_type}
            <StatusBadge status={crew.status} />
          </div>
          <div className="time">{session.start} – {session.end} · {session.title}</div>
        </div>
      </div>
      {session.description && (
        <div className="workout">{session.description}</div>
      )}
      <div className="seats">
        {crew.seats.filter(s => !s.is_cox).map(s => {
          const u = D.findUser(s.rower);
          return (
            <div key={s.num} className={`seat-row ${s.rower === me.id ? 'self' : ''}`}>
              <span className="pos">{s.num === 1 ? 'BOW' : s.num === crew.seats.filter(x=>!x.is_cox).length ? 'STK' : s.num}</span>
              <span className="name">{u?.first_name} {u?.last_name}</span>
              <span className="side"><SideTag side={s.side} /></span>
            </div>
          );
        })}
        {crew.seats.filter(s => s.is_cox).map(s => {
          const u = D.findUser(s.rower);
          return (
            <div key="cox" className={`seat-row ${s.rower === me.id ? 'self' : ''}`}>
              <span className="pos">COX</span>
              <span className="name">{u?.first_name} {u?.last_name}</span>
              <span className="side"><SideTag side="cox" /></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ COACH ============
function CoachHome({ onOpenSession }) {
  const D = window.RowOrgData;
  const sessions = D.SESSIONS;

  const upcomingCount = sessions.length;
  const totalCrews = sessions.reduce((a, s) => a + s.crews.length, 0);
  const draftCrews = sessions.reduce((a, s) => a + s.crews.filter(c => c.status === 'draft').length, 0);

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">COACH DASHBOARD · LAKE BLED RC</div>
          <h2>This week's water time</h2>
        </div>
        <div className="spacer"></div>
        <button className="btn"><Icon name="filter" size={13} /> Filter</button>
        <button className="btn primary"><Icon name="plus" size={13} /> New session</button>
      </div>

      <div className="metric-row">
        <div className="metric">
          <span className="label">Sessions · this wk</span>
          <span className="val tabular">{upcomingCount}</span>
          <span className="trend">↑ 1 vs last wk</span>
        </div>
        <div className="metric">
          <span className="label">Crews scheduled</span>
          <span className="val tabular">{totalCrews}</span>
          <span className="trend mono muted">{totalCrews - draftCrews} confirmed</span>
        </div>
        <div className="metric">
          <span className="label">Active rowers</span>
          <span className="val tabular">11 <small>/ 12</small></span>
          <span className="trend">All available</span>
        </div>
        <div className="metric">
          <span className="label">Drafts awaiting</span>
          <span className="val tabular" style={{ color: 'var(--warn)' }}>{draftCrews}</span>
          <span className="trend mono" style={{ color: 'var(--warn)' }}>needs approval</span>
        </div>
      </div>

      <SectionTitle title="Scheduled sessions" hint={`${sessions.length} this week`} />
      <div>
        {sessions.map(s => <SessionRow key={s.id} session={s} onOpen={() => onOpenSession(s.id)} />)}
      </div>
    </>
  );
}

function SessionRow({ session, onOpen }) {
  const D = window.RowOrgData;
  const dateObj = new Date(session.date + 'T00:00:00');
  return (
    <div className="session-row" onClick={onOpen}>
      <div className="date-block">
        <div className="d">{dateObj.getDate()}</div>
        <div className="m">{D.MONTHS[dateObj.getMonth()]}</div>
      </div>
      <div className="session-meta">
        <div className="when mono">{D.DAY_LABELS[session.day]} · {session.start} – {session.end}</div>
        <div className="title">{session.title}</div>
        <div className="sub mono" style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>
          {session.description}
        </div>
      </div>
      <div className="crew-pill-row">
        {session.crews.length === 0
          ? <span className="crew-pill" style={{ color: 'var(--text-3)' }}>no crew</span>
          : session.crews.map(c => (
              <span key={c.id} className={`crew-pill ${c.status === 'confirmed' ? 'confirmed' : c.status === 'draft' ? 'draft' : ''}`}>
                {c.boat_type}
              </span>
            ))
        }
      </div>
      <div className="muted mono" style={{ fontSize: 11 }}>open <Icon name="chevR" size={11} /></div>
    </div>
  );
}

// ============ COACH: SESSION DETAIL ============
function SessionDetail({ sessionId, onBack, tweaks, setTweaks }) {
  const D = window.RowOrgData;
  const [session, setSession] = React.useState(D.SESSIONS.find(s => s.id === sessionId));
  const suggestions = D.SUGGESTIONS_BY_SESSION[session.id] || [];

  // filters / sort
  const [filterBoat, setFilterBoat] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('score');

  const filtered = suggestions
    .filter(s => filterBoat === 'all' || (filterBoat === 'coxed' ? ['4+','8+'].includes(s.boat_type) : s.boat_type === filterBoat))
    .sort((a, b) => sortBy === 'score' ? b.score - a.score : a.boat_type.localeCompare(b.boat_type));

  const updateCrewStatus = (crewId, status) => {
    setSession(s => ({
      ...s,
      crews: s.crews.map(c => c.id === crewId ? { ...c, status } : c),
    }));
  };

  const dateObj = new Date(session.date + 'T00:00:00');

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">
            <a onClick={onBack} style={{ cursor: 'pointer', color: 'var(--text-2)' }}>
              <Icon name="chevL" size={11} /> SESSIONS
            </a>
            {' · '}
            <span>{D.DAY_LABELS[session.day]} {dateObj.getDate()} {D.MONTHS[dateObj.getMonth()]} · {session.start}–{session.end}</span>
          </div>
          <h2>{session.title}</h2>
        </div>
        <div className="spacer"></div>
        <button className="btn"><Icon name="settings" size={13} /> Edit session</button>
        <button className="btn primary"><Icon name="bolt" size={13} /> Generate suggestions</button>
      </div>

      {session.description && (
        <div className="workout" style={{ marginBottom: 20, maxWidth: 720 }}>
          <strong>Workout · </strong> {session.description}
        </div>
      )}

      <div className="detail-grid">
        {/* LEFT: assigned crews + builder */}
        <div>
          <SectionTitle title="Assigned crews" hint={`${session.crews.length} crew${session.crews.length === 1 ? '' : 's'}`} />
          {session.crews.length === 0
            ? <div className="empty-state">No crews assigned yet. Accept a suggestion or build manually below.</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {session.crews.map(crew => (
                  <CrewCard key={crew.id} crew={crew} updateStatus={updateCrewStatus} />
                ))}
              </div>
            )
          }

          <SectionTitle
            title="Crew builder"
            hint={<>Drag rowers into seats · <span className="kbd">⌘K</span> roster search</>}
          />
          <CrewBuilder
            initialBoat={tweaks.defaultBoat || '8+'}
            variant={tweaks.builderVariant}
            onSave={({ variant }) => {
              if (variant && variant !== tweaks.builderVariant) {
                setTweaks({ builderVariant: variant });
              }
            }}
          />
        </div>

        {/* RIGHT: suggestions */}
        <div>
          <SectionTitle title="Suggested lineups" hint={`${filtered.length} options`} />
          <div className="filter-strip">
            {['all','8+','4+','4x','2-','2x'].map(b => (
              <button key={b}
                className={`chip ${filterBoat === b ? 'active' : ''}`}
                onClick={() => setFilterBoat(b)}>
                {b === 'all' ? 'All' : b}
              </button>
            ))}
            <div className="spacer"></div>
            <select className="select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ fontSize: 11 }}>
              <option value="score">Sort: Best fit</option>
              <option value="boat">Sort: Boat type</option>
            </select>
          </div>
          {filtered.length === 0
            ? <div className="empty-state" style={{ padding: 24 }}>No suggestions match this filter.</div>
            : filtered.map(s => <SuggestionCard key={s.id} suggestion={s} />)
          }
        </div>
      </div>
    </>
  );
}

function CrewCard({ crew, updateStatus }) {
  const D = window.RowOrgData;
  return (
    <div className={`lineup ${crew.status}`} style={{ display: 'block' }}>
      <span className="stripe"></span>
      <div className="lineup-top" style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--text-0)' }}>
          {crew.boat_type}
        </div>
        <StatusBadge status={crew.status} />
        <div className="spacer"></div>
        {crew.status !== 'confirmed' && crew.status !== 'cancelled' && (
          <button className="btn sm success" onClick={() => updateStatus(crew.id, 'confirmed')}>
            <Icon name="check" size={11} /> Approve
          </button>
        )}
        {crew.status !== 'cancelled' && (
          <button className="btn sm danger" onClick={() => updateStatus(crew.id, 'cancelled')}>
            <Icon name="x" size={11} /> Cancel
          </button>
        )}
      </div>
      <div className="seats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 18 }}>
        {crew.seats.filter(s => !s.is_cox).map(s => {
          const u = D.findUser(s.rower);
          return (
            <div key={s.num} className="seat-row">
              <span className="pos">{s.num === 1 ? 'BOW' : s.num === crew.seats.filter(x=>!x.is_cox).length ? 'STK' : s.num}</span>
              <Avatar user={u} size={18} />
              <span className="name">{u?.first_name} {u?.last_name}</span>
              <span className="side"><SideTag side={s.side} /></span>
            </div>
          );
        })}
        {crew.seats.filter(s => s.is_cox).map(s => {
          const u = D.findUser(s.rower);
          return (
            <div key="cox" className="seat-row">
              <span className="pos">COX</span>
              <Avatar user={u} size={18} />
              <span className="name">{u?.first_name} {u?.last_name}</span>
              <span className="side"><SideTag side="cox" /></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion }) {
  const D = window.RowOrgData;
  return (
    <div className="suggestion">
      <div className="suggestion-top">
        <span className="boat-tag">{suggestion.boat_type}</span>
        <span className="muted mono" style={{ fontSize: 11 }}>{suggestion.notes}</span>
        <div className="score-bar">
          <span>score</span>
          <div className="score-fill"><div style={{ width: `${suggestion.score}%` }}></div></div>
          <span style={{ color: 'var(--text-0)' }}>{suggestion.score}</span>
        </div>
      </div>
      <ul className="crew-list">
        {suggestion.rowers.map((r, i) => {
          const u = D.findUser(r.id);
          return (
            <li key={i}>
              <span className="pos">{r.pos}</span>
              <Avatar user={u} size={18} />
              <span>{u?.first_name} {u?.last_name}</span>
              <span className="muted mono" style={{ fontSize: 10, marginLeft: 'auto' }}>
                {u?.weight ? `${u.weight}kg` : ''}
              </span>
            </li>
          );
        })}
      </ul>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn sm">Preview</button>
        <button className="btn sm primary"><Icon name="check" size={11} /> Accept</button>
      </div>
    </div>
  );
}

// ============ shared section title ============
function SectionTitle({ title, hint }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 12,
      margin: '24px 0 12px',
      paddingBottom: 8,
      borderBottom: '1px solid var(--border)',
    }}>
      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: '-.01em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--text-1)', whiteSpace: 'nowrap' }}>
        {title}
      </h3>
      {hint && <span className="muted" style={{ fontSize: 12 }}>{hint}</span>}
    </div>
  );
}

window.RowerHome = RowerHome;
window.CoachHome = CoachHome;
window.SessionDetail = SessionDetail;
window.SectionTitle = SectionTitle;
