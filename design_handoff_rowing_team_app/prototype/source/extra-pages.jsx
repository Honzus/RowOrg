// Secondary pages — full views for each sidebar nav item.

// ============ ROWER: Lineups ============
function RowerLineups() {
  const D = window.RowOrgData;
  const me = D.ME_ROWER;
  const myLineups = [];
  D.SESSIONS.forEach(session => {
    session.crews.forEach(crew => {
      const mySeat = crew.seats.find(s => s.rower === me.id);
      if (mySeat) myLineups.push({ session, crew, mySeat });
    });
  });
  const grouped = {
    confirmed: myLineups.filter(l => l.crew.status === 'confirmed'),
    draft:     myLineups.filter(l => l.crew.status === 'draft'),
    cancelled: myLineups.filter(l => l.crew.status === 'cancelled'),
  };

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">YOUR ASSIGNMENTS · {me.first_name.toUpperCase()}</div>
          <h2>Lineups</h2>
        </div>
        <div className="spacer"></div>
        <button className="btn"><Icon name="filter" size={13} /> Filter</button>
        <button className="btn"><Icon name="bell" size={13} /> Notify on new</button>
      </div>

      <div className="metric-row">
        <div className="metric">
          <span className="label">Total this week</span>
          <span className="val tabular">{myLineups.length}</span>
          <span className="trend muted mono">{grouped.confirmed.length} approved · {grouped.draft.length} draft</span>
        </div>
        <div className="metric">
          <span className="label">Hours on water</span>
          <span className="val tabular">5.5 <small>h</small></span>
          <span className="trend">↑ 1.5h vs avg</span>
        </div>
        <div className="metric">
          <span className="label">Most-used boat</span>
          <span className="val tabular" style={{ fontSize: 20 }}>8+ Eight</span>
          <span className="trend muted mono">3 of 3 sessions</span>
        </div>
        <div className="metric">
          <span className="label">Streak</span>
          <span className="val tabular">12 <small>wks</small></span>
          <span className="trend">🏆 club avg 7</span>
        </div>
      </div>

      {grouped.confirmed.length > 0 && (
        <>
          <SectionTitle title="Approved" hint={`${grouped.confirmed.length} confirmed lineup${grouped.confirmed.length === 1 ? '' : 's'}`} />
          <div className="lineups">
            {grouped.confirmed.map(({ session, crew, mySeat }) => (
              <LineupCard key={crew.id} session={session} crew={crew} mySeat={mySeat} />
            ))}
          </div>
        </>
      )}
      {grouped.draft.length > 0 && (
        <>
          <SectionTitle title="Pending" hint={`${grouped.draft.length} awaiting coach approval`} />
          <div className="lineups">
            {grouped.draft.map(({ session, crew, mySeat }) => (
              <LineupCard key={crew.id} session={session} crew={crew} mySeat={mySeat} />
            ))}
          </div>
        </>
      )}
      {grouped.cancelled.length > 0 && (
        <>
          <SectionTitle title="Cancelled" />
          <div className="lineups">
            {grouped.cancelled.map(({ session, crew, mySeat }) => (
              <LineupCard key={crew.id} session={session} crew={crew} mySeat={mySeat} />
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

// ============ ROWER: Availability standalone ============
function RowerAvailability({ tweaks }) {
  const D = window.RowOrgData;
  const totalH = D.MY_AVAIL.reduce((a,s)=>{const [sh,sm]=s.start.split(':').map(Number);const [eh,em]=s.end.split(':').map(Number);return a+((eh-sh)+(em-sm)/60);},0);
  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">RECURRING SCHEDULE · WEEK {Math.ceil(D.today.getDate()/7)} OF MAY</div>
          <h2>Availability</h2>
        </div>
        <div className="spacer"></div>
        <button className="btn"><Icon name="settings" size={13} /> Copy from last week</button>
        <button className="btn primary"><Icon name="plus" size={13} /> Save week</button>
      </div>

      <div className="metric-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="metric">
          <span className="label">Hours available</span>
          <span className="val tabular">{totalH.toFixed(1)} <small>h</small></span>
          <span className="trend">↑ 2.5h vs last wk</span>
        </div>
        <div className="metric">
          <span className="label">Earliest start</span>
          <span className="val tabular">06:00</span>
          <span className="trend muted mono">5× this week</span>
        </div>
        <div className="metric">
          <span className="label">Booked into</span>
          <span className="val tabular">3 <small>of 4</small></span>
          <span className="trend">75% utilization</span>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 620, marginBottom: 20 }}>
        Drag any cell to paint a time range. Click ✕ on a slot to remove it. Coach can see your slots and the team heatmap together.
      </p>

      <AvailabilityCalendar tweaks={tweaks} />
    </>
  );
}

// ============ Team Roster ============
function TeamRoster({ role = 'rower' }) {
  const D = window.RowOrgData;
  const [filter, setFilter] = React.useState('all');
  const list = D.TEAM.filter(u =>
    filter === 'all' ? true :
    filter === 'coach' ? u.role === 'coach' :
    filter === 'cox' ? u.role === 'coxswain' :
    filter === 'port' ? u.sweep_side === 'port' :
    filter === 'starboard' ? u.sweep_side === 'starboard' :
    filter === 'sculler' ? u.rowing_type === 'sculling' || u.rowing_type === 'both' :
    true
  );

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">LAKE BLED RC · 2026 SQUAD</div>
          <h2>{role === 'coach' ? 'Roster' : 'Team'}</h2>
        </div>
        <div className="spacer"></div>
        {role === 'coach' && <button className="btn"><Icon name="plus" size={13} /> Invite rower</button>}
        <button className="btn ghost"><Icon name="search" size={13} /> Search</button>
      </div>

      <div className="filter-strip">
        {[
          ['all','All','12'], ['port','Port','5'], ['starboard','Starboard','5'],
          ['sculler','Scullers','7'], ['cox','Coxswains','2'], ['coach','Coaches','1'],
        ].map(([k, l, c]) => (
          <button key={k} className={`chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
            {l} <span className="muted mono" style={{ marginLeft: 4, fontSize: 10 }}>{c}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {list.map(u => (
          <div key={u.id} className="lineup" style={{ padding: 14 }}>
            <span className="stripe" style={{
              background: u.tint === 'lime' ? 'var(--lime)' : u.tint === 'water' ? 'var(--water)' : 'var(--accent)'
            }}></span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Avatar user={u} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-.02em' }}>
                  {u.first_name} {u.last_name}
                </div>
                <div className="muted mono" style={{ fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  {u.role}
                </div>
              </div>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
              fontSize: 12, marginTop: 4,
            }}>
              <div>
                <div className="muted mono" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em' }}>Side</div>
                <div style={{ marginTop: 2 }}>
                  <SideTag side={u.sweep_side === 'both' ? null : u.sweep_side} />
                  {u.sweep_side === 'both' && <span className="mono muted">P / S</span>}
                </div>
              </div>
              <div>
                <div className="muted mono" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em' }}>Weight</div>
                <div className="mono tabular" style={{ marginTop: 2 }}>{u.weight ? `${u.weight} kg` : '—'}</div>
              </div>
              <div>
                <div className="muted mono" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em' }}>Type</div>
                <div className="mono" style={{ marginTop: 2, textTransform: 'capitalize' }}>{u.rowing_type || '—'}</div>
              </div>
              <div>
                <div className="muted mono" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em' }}>Cox</div>
                <div style={{ marginTop: 2 }}>
                  {u.can_cox
                    ? <span className="badge water"><span className="b-dot"></span>Yes</span>
                    : <span className="muted mono" style={{ fontSize: 11 }}>—</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ============ COACH: Sessions standalone (forces a default open) ============
function CoachSessions({ onOpenSession }) {
  const D = window.RowOrgData;
  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">PRACTICE SCHEDULE · MAY 11 – 17</div>
          <h2>Sessions</h2>
        </div>
        <div className="spacer"></div>
        <button className="btn"><Icon name="calendar" size={13} /> Week</button>
        <button className="btn primary"><Icon name="plus" size={13} /> New session</button>
      </div>

      <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 620, marginBottom: 16 }}>
        Each session shows its assigned crews. Click any row to open the suggestions engine and crew builder.
      </p>

      <SectionTitle title="This week" hint={`${D.SESSIONS.length} scheduled`} />
      <div>
        {D.SESSIONS.map(s => <SessionRow key={s.id} session={s} onOpen={() => onOpenSession(s.id)} />)}
      </div>
    </>
  );
}

// ============ COACH: All Crews ============
function CoachCrews() {
  const D = window.RowOrgData;
  const [status, setStatus] = React.useState('all');
  const allCrews = D.SESSIONS.flatMap(s => s.crews.map(c => ({ session: s, crew: c })));
  const filtered = allCrews.filter(({ crew }) => status === 'all' ? true : crew.status === status);

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">{allCrews.length} CREW{allCrews.length === 1 ? '' : 'S'} · {allCrews.filter(c=>c.crew.status==='draft').length} NEED APPROVAL</div>
          <h2>Crews</h2>
        </div>
        <div className="spacer"></div>
        <button className="btn"><Icon name="bolt" size={13} /> Auto-approve drafts</button>
      </div>

      <div className="filter-strip">
        {[['all','All'],['confirmed','Confirmed'],['draft','Draft'],['cancelled','Cancelled']].map(([k,l]) => (
          <button key={k} className={`chip ${status === k ? 'active' : ''}`} onClick={() => setStatus(k)}>
            {l} <span className="muted mono" style={{ marginLeft: 4, fontSize: 10 }}>
              {k === 'all' ? allCrews.length : allCrews.filter(c => c.crew.status === k).length}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 12 }}>
        {filtered.map(({ session, crew }) => (
          <div key={crew.id} className={`lineup ${crew.status}`} style={{ display: 'block' }}>
            <span className="stripe"></span>
            <div className="lineup-top" style={{ marginBottom: 6 }}>
              <div className="lineup-date">
                <span className="d">{new Date(session.date+'T00:00:00').getDate()}</span>
                <span className="m">{D.MONTHS[new Date(session.date+'T00:00:00').getMonth()]}</span>
              </div>
              <div className="lineup-info">
                <div className="boat">{crew.boat_type}<StatusBadge status={crew.status} /></div>
                <div className="time">{session.start} – {session.end} · {session.title}</div>
              </div>
            </div>
            <div className="seats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 14 }}>
              {crew.seats.filter(s => !s.is_cox).map(s => {
                const u = D.findUser(s.rower);
                return (
                  <div key={s.num} className="seat-row">
                    <span className="pos">{s.num === 1 ? 'BOW' : s.num === crew.seats.filter(x=>!x.is_cox).length ? 'STK' : s.num}</span>
                    <Avatar user={u} size={16} />
                    <span className="name" style={{ fontSize: 12 }}>{u?.first_name}</span>
                  </div>
                );
              })}
              {crew.seats.filter(s => s.is_cox).map(s => {
                const u = D.findUser(s.rower);
                return (
                  <div key="cox" className="seat-row">
                    <span className="pos">COX</span>
                    <Avatar user={u} size={16} />
                    <span className="name" style={{ fontSize: 12 }}>{u?.first_name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ============ COACH: Preferences ============
function CoachPrefs() {
  const D = window.RowOrgData;
  const pairings = [
    { rowers: [1, 4], boat: '8+', note: 'Solid 7-stroke pair' },
    { rowers: [3, 6], boat: '4+', note: 'Matched stroke length' },
    { rowers: [2, 8], boat: 'any', note: 'Keep on starboard' },
    { rowers: [10, 11], boat: '2x', note: 'Best double scull pairing' },
  ];
  const seatPrefs = [
    { rower: 1, seat: 'Bow', boat: '8+', priority: 'High' },
    { rower: 8, seat: 'Stroke', boat: '4+/8+', priority: 'High' },
    { rower: 9, seat: 'Cox', boat: '8+', priority: 'Locked' },
    { rower: 7, seat: '7', boat: '8+', priority: 'Med' },
    { rower: 5, seat: '5/6', boat: '8+', priority: 'Med' },
  ];

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">LINEUP RULES · INFORMS THE SUGGESTION ENGINE</div>
          <h2>Preferences</h2>
        </div>
        <div className="spacer"></div>
        <button className="btn primary"><Icon name="plus" size={13} /> Add rule</button>
      </div>

      <SectionTitle title="Lineup templates" hint="Full stroke-to-bow lineups. Suggestions use these as starting points; the Crew Builder can load them in one click." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 10, marginBottom: 24 }}>
        {D.TEMPLATES.map(t => {
          const boat = D.BOAT_TYPES.find(b => b.value === t.boat_type);
          const stroke = D.findUser(t.lineup[0]);
          return (
            <div key={t.id} className="lineup" style={{ display: 'block' }}>
              <span className="stripe" style={{ background: 'var(--accent)' }}></span>
              <div className="lineup-top" style={{ marginBottom: 6 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text-0)' }}>
                  {t.boat_type}
                </div>
                <div className="lineup-info">
                  <div className="boat" style={{ fontSize: 14 }}>{t.name}</div>
                  <div className="time">{boat?.label}</div>
                </div>
                <button className="btn sm ghost"><Icon name="settings" size={11} /></button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 8 }}>{t.note}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* render stroke first (top) → bow (bottom) */}
                {t.lineup.map((rid, i) => {
                  const u = D.findUser(rid);
                  const isStroke = i === 0;
                  const isBow = i === t.lineup.length - 1;
                  const seatLabel = isStroke ? 'STK' : isBow ? 'BOW' : String(boat.seats - i);
                  const side = boat.value.endsWith('x') ? null : ((boat.seats - i) % 2 === 1 ? 'port' : 'starboard');
                  return (
                    <div key={i} className="seat-row" style={{ padding: '2px 0' }}>
                      <span className="pos">{seatLabel}</span>
                      <Avatar user={u} size={16} />
                      <span className="name" style={{ fontSize: 12 }}>{u?.first_name} {u?.last_name?.[0]}.</span>
                      <span className="side"><SideTag side={side} /></span>
                    </div>
                  );
                })}
                {t.cox && (() => {
                  const u = D.findUser(t.cox);
                  return (
                    <div className="seat-row" style={{ padding: '2px 0', color: 'var(--water)' }}>
                      <span className="pos">COX</span>
                      <Avatar user={u} size={16} />
                      <span className="name" style={{ fontSize: 12 }}>{u?.first_name} {u?.last_name?.[0]}.</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
        {/* Add new template card */}
        <button className="empty-state" style={{
          cursor: 'pointer', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 6,
          border: '1px dashed var(--border-strong)', background: 'transparent',
          color: 'var(--text-2)', minHeight: 180,
        }}>
          <Icon name="plus" size={20} />
          <span style={{ fontSize: 13 }}>New lineup template</span>
          <span className="muted mono" style={{ fontSize: 10 }}>Stroke → bow</span>
        </button>
      </div>

      <div className="detail-grid">
        <div>
          <SectionTitle title="Preferred pairings" hint="Keep these rowers together in the same boat" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pairings.map((p, i) => (
              <div key={i} className="suggestion">
                <div className="suggestion-top">
                  <span className="boat-tag">{p.boat}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1 }}>
                    {p.rowers.map(rid => {
                      const u = D.findUser(rid);
                      return (
                        <div key={rid} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Avatar user={u} size={20} />
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{u?.first_name} {u?.last_name?.[0]}.</span>
                        </div>
                      );
                    })}
                  </div>
                  <span className="muted mono" style={{ fontSize: 11 }}>{p.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle title="Seat preferences" hint="Where each rower performs best" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {seatPrefs.map((sp, i) => {
              const u = D.findUser(sp.rower);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                }}>
                  <Avatar user={u} size={26} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{u?.first_name} {u?.last_name}</div>
                    <div className="muted mono" style={{ fontSize: 10 }}>{sp.boat}</div>
                  </div>
                  <span className="badge water"><span className="b-dot"></span>{sp.seat}</span>
                  <span className={`badge ${sp.priority === 'Locked' ? 'coral' : sp.priority === 'High' ? 'lime' : ''}`}>
                    {sp.priority}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ============ Club: Regattas ============
function Regattas() {
  const D = window.RowOrgData;
  const events = [
    { date: '2026-05-30', name: 'Bled Spring Sprint',     where: 'Lake Bled, SI',   crews: 4, registered: true,  days: 13 },
    { date: '2026-06-14', name: 'Danube Cup',             where: 'Vienna, AT',      crews: 2, registered: true,  days: 28 },
    { date: '2026-07-05', name: 'Adriatic Open',          where: 'Trieste, IT',     crews: 3, registered: false, days: 49 },
    { date: '2026-08-22', name: 'World Rowing Masters',   where: 'Brandenburg, DE', crews: 1, registered: false, days: 97 },
  ];
  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">UPCOMING · 4 SCHEDULED</div>
          <h2>Regattas</h2>
        </div>
        <div className="spacer"></div>
        <button className="btn"><Icon name="filter" size={13} /> Past</button>
        <button className="btn primary"><Icon name="plus" size={13} /> Add regatta</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
        {events.map((e, i) => {
          const dt = new Date(e.date + 'T00:00:00');
          return (
            <div key={i} className="lineup" style={{ display: 'block' }}>
              <span className="stripe" style={{ background: e.registered ? 'var(--accent)' : 'var(--text-3)' }}></span>
              <div className="lineup-top">
                <div className="lineup-date">
                  <span className="d">{dt.getDate()}</span>
                  <span className="m">{D.MONTHS[dt.getMonth()]}</span>
                </div>
                <div className="lineup-info">
                  <div className="boat">{e.name}</div>
                  <div className="time">{e.where}</div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11,
                  padding: '4px 8px', borderRadius: 6,
                  background: e.days < 30 ? 'var(--accent-soft)' : 'var(--bg-3)',
                  color: e.days < 30 ? 'var(--accent)' : 'var(--text-2)',
                  textTransform: 'uppercase', letterSpacing: '.06em',
                }}>
                  {e.days}d
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                {e.registered ? <StatusBadge status="confirmed" /> : <span className="badge"><span className="b-dot"></span>Open</span>}
                <span className="muted mono" style={{ fontSize: 11 }}>{e.crews} crew{e.crews === 1 ? '' : 's'} entered</span>
                <div className="spacer"></div>
                <button className="btn sm">Details</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ============ Club: Equipment ============
function Equipment() {
  const boats = [
    { name: 'Triglav',     type: '8+', material: 'Filippi F35',    year: 2023, status: 'ready',     hours: 412, last: 'Yesterday',  side: null },
    { name: 'Bohinj',      type: '4+', material: 'Empacher D34',   year: 2021, status: 'ready',     hours: 308, last: '3 days ago', side: null },
    { name: 'Pivka',       type: '4x', material: 'Filippi F25',    year: 2022, status: 'ready',     hours: 256, last: 'Today',      side: null },
    { name: 'Soča',        type: '4-', material: 'Vespoli VS-26',  year: 2019, status: 'maintenance', hours: 540, last: '2 weeks',    side: null },
    { name: 'Sava',        type: '2x', material: 'Hudson R47',     year: 2024, status: 'ready',     hours: 89,  last: 'Yesterday',  side: null },
    { name: 'Vrbina',      type: '2-', material: 'Empacher D27',   year: 2020, status: 'ready',     hours: 372, last: '5 days ago', side: null },
    { name: 'Single A',    type: '1x', material: 'Filippi F22',    year: 2024, status: 'ready',     hours: 64,  last: 'Today',      side: null },
    { name: 'Single B',    type: '1x', material: 'Hudson R47',     year: 2023, status: 'reserved',  hours: 122, last: 'Today',      side: null },
  ];

  const statusColor = (s) => s === 'ready' ? 'lime' : s === 'maintenance' ? 'warn' : 'water';

  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">CLUB FLEET · 8 BOATS</div>
          <h2>Equipment</h2>
        </div>
        <div className="spacer"></div>
        <button className="btn"><Icon name="settings" size={13} /> Log maintenance</button>
      </div>

      <div className="metric-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="metric">
          <span className="label">Ready</span>
          <span className="val tabular">6</span>
          <span className="trend">All systems go</span>
        </div>
        <div className="metric">
          <span className="label">In maintenance</span>
          <span className="val tabular" style={{ color: 'var(--warn)' }}>1</span>
          <span className="trend mono" style={{ color: 'var(--warn)' }}>Soča · back Fri</span>
        </div>
        <div className="metric">
          <span className="label">Reserved</span>
          <span className="val tabular">1</span>
          <span className="trend muted mono">today</span>
        </div>
        <div className="metric">
          <span className="label">Total hrs · YTD</span>
          <span className="val tabular">2,163 <small>h</small></span>
          <span className="trend">↑ 8% vs '25</span>
        </div>
      </div>

      <SectionTitle title="Fleet" hint="8 hulls" />
      <div className="card">
        <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)',
                      display: 'grid', gridTemplateColumns: '56px 1fr 80px 1fr 110px 100px 100px',
                      gap: 12, fontFamily: 'var(--font-mono)', fontSize: 10,
                      textTransform: 'uppercase', letterSpacing: '.1em',
                      color: 'var(--text-2)' }}>
          <div>Type</div><div>Name</div><div>Year</div><div>Shell</div><div>Hours</div><div>Last use</div><div>Status</div>
        </div>
        {boats.map((b, i) => (
          <div key={i} style={{
            padding: '10px 16px', borderBottom: i === boats.length - 1 ? 'none' : '1px solid var(--border)',
            display: 'grid', gridTemplateColumns: '56px 1fr 80px 1fr 110px 100px 100px',
            gap: 12, alignItems: 'center', fontSize: 13,
          }}>
            <span className="mono" style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-.02em' }}>{b.type}</span>
            <span style={{ fontWeight: 600 }}>{b.name}</span>
            <span className="muted mono" style={{ fontSize: 11 }}>{b.year}</span>
            <span className="muted" style={{ fontSize: 12 }}>{b.material}</span>
            <span className="mono tabular">{b.hours}h</span>
            <span className="muted mono" style={{ fontSize: 11 }}>{b.last}</span>
            <span className={`badge ${statusColor(b.status)}`}><span className="b-dot"></span>{b.status}</span>
          </div>
        ))}
      </div>
    </>
  );
}

window.RowerLineups = RowerLineups;
window.RowerAvailability = RowerAvailability;
window.TeamRoster = TeamRoster;
window.CoachSessions = CoachSessions;
window.CoachCrews = CoachCrews;
window.CoachPrefs = CoachPrefs;
window.Regattas = Regattas;
window.Equipment = Equipment;
