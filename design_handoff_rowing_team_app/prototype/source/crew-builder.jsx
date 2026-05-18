// Crew builder — TWO variants
// (1) Literal boat: visual boat hull with seats laid bow-to-stern, port/starboard oars
// (2) Abstract: clean numbered seat list with side indicators

function CrewBuilder({ initialBoat = '8+', sessionTitle, variant = 'boat', onSave }) {
  const D = window.RowOrgData;
  const [boatValue, setBoatValue] = React.useState(initialBoat);
  const boat = D.BOAT_TYPES.find(b => b.value === boatValue);
  const [seats, setSeats] = React.useState(() => buildSeats(boat));
  const [dragId, setDragId] = React.useState(null);
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const [autoFill, setAutoFill] = React.useState(true);

  function buildSeats(b) {
    const out = [];
    if (b.coxed) out.push({ idx: 0, num: 0, is_cox: true, rower: null });
    for (let i = 1; i <= b.seats; i++) {
      // alternate port/starboard for sweep boats
      const side =
        b.value === '1x' || b.value.endsWith('x') ? null :
        (i % 2 === 1 ? 'port' : 'starboard');
      out.push({ idx: out.length, num: i, is_cox: false, rower: null, side });
    }
    return out;
  }

  React.useEffect(() => {
    setSeats(buildSeats(boat));
  }, [boatValue]);

  const assignedIds = new Set(seats.filter(s => s.rower).map(s => s.rower.id));
  const teamMembers = D.TEAM.filter(u => u.role !== 'coach');
  const available = teamMembers.filter(u => !assignedIds.has(u.id));

  // Default auto-fill on first mount — only for the 8+ to show off a populated state
  React.useEffect(() => {
    if (!autoFill) return;
    if (boatValue === '8+' && seats.every(s => !s.rower)) {
      const seq = boat.coxed
        ? [9, 1, 2, 3, 4, 5, 6, 7, 8]
        : [1, 2, 3, 4, 5, 6, 7, 8];
      setSeats(prev => prev.map((s, i) => ({ ...s, rower: D.findUser(seq[i]) || null })));
    }
  }, []);  // run once

  const onDragStart = (rower, e) => {
    setDragId(rower.id);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(rower.id)); } catch {}
  };
  const onDragEnd = () => { setDragId(null); setHoverIdx(null); };
  const onDragOverSeat = (idx, e) => { e.preventDefault(); setHoverIdx(idx); };
  const onDragLeaveSeat = () => setHoverIdx(null);
  const onDropSeat = (idx, e) => {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData('text/plain'), 10) || dragId;
    if (!id) return;
    const rower = D.findUser(id);
    if (!rower) return;
    // cox slot only accepts cox-capable
    const target = seats[idx];
    if (target.is_cox && !rower.can_cox && rower.role !== 'coxswain') {
      // accept anyway for prototype; just visually
    }
    setSeats(prev => prev.map((s, i) => {
      if (i === idx) return { ...s, rower };
      // remove this rower from any other seat
      if (s.rower && s.rower.id === id) return { ...s, rower: null };
      return s;
    }));
    setHoverIdx(null);
    setDragId(null);
  };
  const removeSeat = (idx) => {
    setSeats(prev => prev.map((s, i) => i === idx ? { ...s, rower: null } : s));
  };

  const filled = seats.filter(s => s.rower).length;
  const total  = seats.length;
  // crude "balance" — ratio of port/starboard fills
  const portsFilled = seats.filter(s => s.side === 'port' && s.rower).length;
  const stbdFilled  = seats.filter(s => s.side === 'starboard' && s.rower).length;
  const totalWeight = seats.filter(s => s.rower && !s.is_cox).reduce((a,s) => a + (s.rower.weight||0), 0);
  const rowingCount = seats.filter(s => !s.is_cox).length;
  const avgWeight  = rowingCount ? Math.round(totalWeight / rowingCount) : 0;

  const HeadControls = (
    <div className="head">
      <select className="select" value={boatValue} onChange={e => setBoatValue(e.target.value)}>
        {D.BOAT_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
      </select>
      <select
        className="select"
        value=""
        onChange={(e) => {
          const tpl = D.TEMPLATES.find(t => t.id === e.target.value);
          if (!tpl) return;
          setBoatValue(tpl.boat_type);
          // defer the load until the new seats are built
          setTimeout(() => {
            const boat = D.BOAT_TYPES.find(b => b.value === tpl.boat_type);
            const out = [];
            if (boat.coxed) out.push({ idx: 0, num: 0, is_cox: true, rower: tpl.cox ? D.findUser(tpl.cox) : null });
            // tpl.lineup is stroke→bow; map to seat numbers (seat 1 = bow)
            // tpl.lineup[0] = stroke = seat[boat.seats], tpl.lineup[last] = bow = seat 1
            for (let i = 1; i <= boat.seats; i++) {
              const tplIdx = boat.seats - i; // seat 1 (bow) ← last lineup entry
              const rid = tpl.lineup[tplIdx];
              const side =
                boat.value === '1x' || boat.value.endsWith('x') ? null :
                (i % 2 === 1 ? 'port' : 'starboard');
              out.push({ idx: out.length, num: i, is_cox: false, rower: D.findUser(rid) || null, side });
            }
            setSeats(out);
          }, 0);
        }}
        style={{ marginLeft: 6 }}
      >
        <option value="">Load template…</option>
        {D.TEMPLATES.map(t => (
          <option key={t.id} value={t.id}>{t.name} · {t.boat_type}</option>
        ))}
      </select>
      <div className="spacer"></div>
      <div className="builder-tabs">
        <button className={variant === 'boat' ? 'active' : ''} onClick={() => onSave?.({ variant: 'boat' })}>
          <Icon name="boat" size={12} /> Hull
        </button>
        <button className={variant === 'abstract' ? 'active' : ''} onClick={() => onSave?.({ variant: 'abstract' })}>
          <Icon name="list" size={12} /> List
        </button>
      </div>
    </div>
  );

  return (
    <div className="boat-builder">
      {HeadControls}

      <div className="boat-stage">
        {/* ROSTER */}
        <div className="roster">
          <h4>Available · {available.length}</h4>
          {available.map(r => (
            <div
              key={r.id}
              className={`rower-chip ${dragId === r.id ? 'dragging' : ''}`}
              draggable
              onDragStart={(e) => onDragStart(r, e)}
              onDragEnd={onDragEnd}
            >
              <Avatar user={r} size={26} />
              <div className="info">
                <div className="nm">{r.first_name} {r.last_name}</div>
                <div className="meta">
                  <span>{r.weight ? `${r.weight}kg` : (r.role === 'coxswain' ? 'COX' : '')}</span>
                  {r.sweep_side && r.sweep_side !== 'both' && (
                    <span className={r.sweep_side === 'port' ? 'side-p' : 'side-s'}>
                      {r.sweep_side.toUpperCase()}
                    </span>
                  )}
                  {r.sweep_side === 'both' && <span className="muted">P/S</span>}
                  {r.can_cox && r.role !== 'coxswain' && <span className="muted">+COX</span>}
                </div>
              </div>
            </div>
          ))}
          {available.length === 0 && (
            <div className="muted" style={{ fontSize: 12, padding: 8 }}>All rostered.</div>
          )}
        </div>

        {/* BOAT */}
        {variant === 'boat' ? (
          <BoatVisual
            boat={boat} seats={seats} hoverIdx={hoverIdx}
            onDragOverSeat={onDragOverSeat} onDragLeaveSeat={onDragLeaveSeat}
            onDropSeat={onDropSeat} removeSeat={removeSeat}
          />
        ) : (
          <AbstractList
            boat={boat} seats={seats} hoverIdx={hoverIdx}
            onDragOverSeat={onDragOverSeat} onDragLeaveSeat={onDragLeaveSeat}
            onDropSeat={onDropSeat} removeSeat={removeSeat}
          />
        )}
      </div>

      <div className="builder-foot">
        <div className="stat">
          <span className="k">Filled</span>
          <span className="v">{filled}/{total}</span>
        </div>
        <div className="stat">
          <span className="k">Avg weight</span>
          <span className="v">{avgWeight || '—'} {avgWeight ? <span className="muted" style={{fontSize:11}}>kg</span> : null}</span>
        </div>
        <div className="stat">
          <span className="k">P / S</span>
          <span className="v" style={{ color: portsFilled === stbdFilled ? 'var(--lime)' : 'var(--warn)' }}>
            {portsFilled} / {stbdFilled}
          </span>
        </div>
        <div className="spacer"></div>
        <button className="btn ghost" onClick={() => setSeats(buildSeats(boat))}>Clear</button>
        <button className="btn primary" disabled={filled !== total} onClick={() => onSave?.({ save: true })}>
          <Icon name="check" size={12} /> Save crew
        </button>
      </div>
    </div>
  );
}

// ===== Boat visual =====
function BoatVisual({ boat, seats, hoverIdx, onDragOverSeat, onDragLeaveSeat, onDropSeat, removeSeat }) {
  const cox = seats.find(s => s.is_cox);
  const rowers = seats.filter(s => !s.is_cox);
  // for display: stroke at top (highest seat number), bow at bottom (seat 1)
  const ordered = [...rowers].sort((a, b) => b.num - a.num);
  return (
    <div className="boat">
      <div className="boat-stern">STERN · STROKE</div>
      <div className="boat-hull">
        {cox && (
          <div className="boat-row cox" style={{ marginBottom: 10 }}>
            <span className="seat-num">C</span>
            <SeatDrop
              seat={cox} idx={cox.idx} hoverIdx={hoverIdx}
              onDragOverSeat={onDragOverSeat} onDragLeaveSeat={onDragLeaveSeat}
              onDropSeat={onDropSeat} removeSeat={removeSeat}
              extraClass="cox-seat"
              emptyLabel="Drop cox"
            />
            <span className="oar">·</span>
          </div>
        )}
        <div className="boat-seats">
          {ordered.map(seat => {
            const isPort = seat.side === 'port';
            const isStbd = seat.side === 'starboard';
            return (
              <div key={seat.idx} className="boat-row">
                <span className="oar port">{isPort ? '◂' : ''}</span>
                {/* Use a wrapper to display seat num + drop in middle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="seat-num" style={{ width: 24 }}>{seat.num === boat.seats ? 'S' : seat.num === 1 ? 'B' : seat.num}</span>
                  <SeatDrop
                    seat={seat} idx={seat.idx} hoverIdx={hoverIdx}
                    onDragOverSeat={onDragOverSeat} onDragLeaveSeat={onDragLeaveSeat}
                    onDropSeat={onDropSeat} removeSeat={removeSeat}
                    style={{ flex: 1 }}
                    emptyLabel={`Seat ${seat.num}${seat.side ? ` (${seat.side})` : ''}`}
                  />
                </div>
                <span className="oar starboard">{isStbd ? '▸' : ''}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="boat-bow">BOW</div>
    </div>
  );
}

function SeatDrop({ seat, idx, hoverIdx, onDragOverSeat, onDragLeaveSeat, onDropSeat, removeSeat, extraClass = '', emptyLabel = 'Drop rower', style }) {
  return (
    <div
      className={`boat-seat ${extraClass} ${hoverIdx === idx ? 'over' : ''} ${seat.rower ? 'filled' : ''}`}
      style={style}
      onDragOver={(e) => onDragOverSeat(idx, e)}
      onDragLeave={onDragLeaveSeat}
      onDrop={(e) => onDropSeat(idx, e)}
    >
      {seat.rower ? (
        <div className="filled-name">
          <Avatar user={seat.rower} size={22} />
          <span>{seat.rower.first_name} {seat.rower.last_name}</span>
          <button className="remove" onClick={() => removeSeat(idx)} title="Remove">
            <Icon name="x" size={10} />
          </button>
        </div>
      ) : (
        <span className="empty">{emptyLabel}</span>
      )}
    </div>
  );
}

// ===== Abstract list =====
function AbstractList({ boat, seats, hoverIdx, onDragOverSeat, onDragLeaveSeat, onDropSeat, removeSeat }) {
  return (
    <div className="abstract-builder">
      <div className="abstract-seats">
        {seats.map(seat => {
          const sideClass = seat.is_cox ? '' : seat.side || '';
          return (
            <div
              key={seat.idx}
              className={`abstract-seat ${hoverIdx === seat.idx ? 'over' : ''} ${seat.rower ? 'filled' : 'empty'}`}
              onDragOver={(e) => onDragOverSeat(seat.idx, e)}
              onDragLeave={onDragLeaveSeat}
              onDrop={(e) => onDropSeat(seat.idx, e)}
            >
              <span className="num">{seat.is_cox ? 'C' : seat.num}</span>
              <div className="name">
                {seat.rower
                  ? <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Avatar user={seat.rower} size={22} />
                      <span>{seat.rower.first_name} {seat.rower.last_name}</span>
                      {seat.rower.weight ? <span className="mono muted" style={{ fontSize: 10 }}>{seat.rower.weight}kg</span> : null}
                      <button className="remove" onClick={() => removeSeat(seat.idx)} style={{ marginLeft: 'auto' }}>
                        <Icon name="x" size={10} />
                      </button>
                    </div>
                  : (seat.is_cox ? 'Drop cox here' : `Drop ${seat.side || 'rower'} here`)
                }
              </div>
              <span className={`side-tag ${sideClass}`}>
                {seat.is_cox ? 'COX' : (seat.side ? seat.side.toUpperCase() : 'SCULL')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.CrewBuilder = CrewBuilder;
