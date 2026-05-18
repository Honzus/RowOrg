import { useCallback, useEffect, useMemo, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { User, LineupTemplate } from '../types';
import { getTeam } from '../api/teams';
import { createCrew } from '../api/sessions';
import { getTemplates } from '../api/templates';
import { useUser } from '../hooks/userContext';
import Avatar from './Avatar';
import Icon from './Icon';
import { BOAT_TYPES } from '../lib/boats';
import type { BoatTypeDef } from '../lib/boats';

interface Props {
  sessionId: number;
  onCrewSaved: () => void;
  initialBoat?: string;
}

interface Seat {
  idx: number;
  num: number; // 0 for cox, 1..N for rowers (1 = bow, N = stroke)
  is_cox: boolean;
  rower: User | null;
  side: 'port' | 'starboard' | null;
}

type Variant = 'hull' | 'list';

function buildSeats(boat: BoatTypeDef): Seat[] {
  const out: Seat[] = [];
  if (boat.coxed) {
    out.push({ idx: 0, num: 0, is_cox: true, rower: null, side: null });
  }
  for (let i = 1; i <= boat.seats; i++) {
    const side = boat.sculling ? null : i % 2 === 1 ? 'port' : 'starboard';
    out.push({ idx: out.length, num: i, is_cox: false, rower: null, side });
  }
  return out;
}

function DraggableRower({ rower }: { rower: User }) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'ROWER',
      item: rower,
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [rower]
  );

  return (
    <div ref={drag as never} className={`rower-chip ${isDragging ? 'dragging' : ''}`}>
      <Avatar user={rower} size={26} />
      <div className="info">
        <div className="nm">
          {rower.first_name} {rower.last_name}
        </div>
        <div className="meta">
          {rower.weight ? <span>{rower.weight}kg</span> : rower.role === 'coxswain' ? <span>COX</span> : null}
          {rower.sweep_side && rower.sweep_side !== 'both' && (
            <span className={rower.sweep_side === 'port' ? 'side-p' : 'side-s'}>{rower.sweep_side.toUpperCase()}</span>
          )}
          {rower.sweep_side === 'both' && <span className="muted">P/S</span>}
          {rower.can_cox && rower.role !== 'coxswain' && <span className="muted">+COX</span>}
        </div>
      </div>
    </div>
  );
}

interface SeatDropProps {
  seat: Seat;
  variant: Variant;
  onDrop: (idx: number, rower: User) => void;
  onRemove: (idx: number) => void;
  emptyLabel: string;
  className?: string;
  style?: React.CSSProperties;
}

function SeatDrop({ seat, variant, onDrop, onRemove, emptyLabel, className, style }: SeatDropProps) {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: 'ROWER',
      drop: (item: User) => onDrop(seat.idx, item),
      collect: (monitor) => ({ isOver: monitor.isOver() }),
    }),
    [seat.idx, onDrop]
  );

  const baseClass = variant === 'hull' ? 'boat-seat' : 'abstract-seat';
  const filledClass = seat.rower ? 'filled' : variant === 'list' ? 'empty' : '';
  const overClass = isOver ? 'over' : '';

  if (variant === 'list') {
    const sideLabel = seat.is_cox ? 'COX' : seat.side ? seat.side.toUpperCase() : 'SCULL';
    const sideKind = seat.is_cox ? 'cox' : seat.side || 'none';
    const sideClass =
      sideKind === 'port' ? 'side-p' : sideKind === 'starboard' ? 'side-s' : sideKind === 'cox' ? 'side-cox' : 'side-none';

    return (
      <div ref={drop as never} className={`${baseClass} ${filledClass} ${overClass} ${className ?? ''}`} style={style}>
        <span className="num">{seat.is_cox ? 'C' : seat.num}</span>
        <div className="name">
          {seat.rower ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar user={seat.rower} size={22} />
              <span>
                {seat.rower.first_name} {seat.rower.last_name}
              </span>
              {seat.rower.weight ? (
                <span className="mono muted" style={{ fontSize: 10 }}>
                  {seat.rower.weight}kg
                </span>
              ) : null}
              <button className="remove" style={{ marginLeft: 'auto' }} onClick={() => onRemove(seat.idx)} title="Remove">
                <Icon name="x" size={10} />
              </button>
            </div>
          ) : (
            emptyLabel
          )}
        </div>
        <span className={sideClass}>{sideLabel}</span>
      </div>
    );
  }

  return (
    <div ref={drop as never} className={`${baseClass} ${filledClass} ${overClass} ${className ?? ''}`} style={style}>
      {seat.rower ? (
        <div className="filled-name">
          <Avatar user={seat.rower} size={22} />
          <span>
            {seat.rower.first_name} {seat.rower.last_name}
          </span>
          <button className="remove" onClick={() => onRemove(seat.idx)} title="Remove">
            <Icon name="x" size={10} />
          </button>
        </div>
      ) : (
        <span className="empty">{emptyLabel}</span>
      )}
    </div>
  );
}

function BoatVisual({
  boat,
  seats,
  onDrop,
  onRemove,
}: {
  boat: BoatTypeDef;
  seats: Seat[];
  onDrop: (idx: number, rower: User) => void;
  onRemove: (idx: number) => void;
}) {
  const cox = seats.find((s) => s.is_cox);
  const rowers = seats.filter((s) => !s.is_cox);
  const ordered = [...rowers].sort((a, b) => b.num - a.num); // stroke at top, bow at bottom

  return (
    <div className="boat">
      <div className="boat-stern">STERN · STROKE</div>
      <div className="boat-hull">
        {cox && (
          <div className="boat-row cox">
            <span className="seat-num">C</span>
            <SeatDrop
              seat={cox}
              variant="hull"
              onDrop={onDrop}
              onRemove={onRemove}
              emptyLabel="Drop cox"
              className="cox-seat"
            />
            <span className="oar">·</span>
          </div>
        )}
        <div className="boat-seats">
          {ordered.map((seat) => {
            const isPort = seat.side === 'port';
            const isStbd = seat.side === 'starboard';
            return (
              <div key={seat.idx} className="boat-row">
                <span className="oar port">{isPort ? '◂' : ''}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="seat-num" style={{ width: 24 }}>
                    {seat.num === boat.seats ? 'S' : seat.num === 1 ? 'B' : seat.num}
                  </span>
                  <SeatDrop
                    seat={seat}
                    variant="hull"
                    onDrop={onDrop}
                    onRemove={onRemove}
                    emptyLabel={`Seat ${seat.num}${seat.side ? ` (${seat.side})` : ''}`}
                    style={{ flex: 1 }}
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

function AbstractList({ seats, onDrop, onRemove }: { seats: Seat[]; onDrop: (idx: number, rower: User) => void; onRemove: (idx: number) => void }) {
  return (
    <div className="abstract-builder">
      <div className="abstract-seats">
        {seats.map((seat) => (
          <SeatDrop
            key={seat.idx}
            seat={seat}
            variant="list"
            onDrop={onDrop}
            onRemove={onRemove}
            emptyLabel={seat.is_cox ? 'Drop cox here' : `Drop ${seat.side || 'rower'} here`}
          />
        ))}
      </div>
    </div>
  );
}

export default function CrewBuilder({ sessionId, onCrewSaved, initialBoat = '8+' }: Props) {
  const { user } = useUser();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<LineupTemplate[]>([]);
  const [boatValue, setBoatValue] = useState(initialBoat);
  const boat = useMemo(() => BOAT_TYPES.find((b) => b.value === boatValue)!, [boatValue]);
  const [seats, setSeats] = useState<Seat[]>(() => buildSeats(boat));
  const [variant, setVariant] = useState<Variant>('hull');
  const [templateValue, setTemplateValue] = useState('');
  const [pendingTemplate, setPendingTemplate] = useState<LineupTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (user?.team) {
      void getTeam(user.team).then((t) => {
        if (cancelled) return;
        setTeamMembers((t.members ?? []).filter((m) => m.role !== 'coach'));
      });
    }
    void getTemplates().then((t) => {
      if (!cancelled) setTemplates(t);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.team]);

  // Rebuild seats whenever the boat type changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeats(buildSeats(boat));
  }, [boat]);

  // Apply pending template after seats are rebuilt
  useEffect(() => {
    if (!pendingTemplate) return;
    if (pendingTemplate.boat_type !== boat.value) return;

    const tplBoat = BOAT_TYPES.find((b) => b.value === pendingTemplate.boat_type);
    if (!tplBoat) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingTemplate(null);
      return;
    }

    const lineup = pendingTemplate.lineup;
    const cox = pendingTemplate.cox;
    let missingCount = 0;

    setSeats((current) =>
      current.map((seat) => {
        if (seat.is_cox) {
          if (cox == null) return { ...seat, rower: null };
          const u = teamMembers.find((m) => m.id === cox);
          if (!u) missingCount++;
          return { ...seat, rower: u ?? null };
        }
        // Seat numbering: seat.num 1 = bow (last in lineup), seat.num N = stroke (first in lineup)
        const tplIdx = tplBoat.seats - seat.num;
        const rid = lineup[tplIdx];
        if (rid == null) return { ...seat, rower: null };
        const u = teamMembers.find((m) => m.id === rid);
        if (!u) missingCount++;
        return { ...seat, rower: u ?? null };
      })
    );

    setWarning(missingCount > 0 ? `${missingCount} seat${missingCount === 1 ? '' : 's'} from template couldn't be filled.` : null);
    setPendingTemplate(null);
    setTemplateValue('');
  }, [pendingTemplate, boat, teamMembers]);

  const assignedIds = new Set(seats.filter((s) => s.rower).map((s) => s.rower!.id));
  const available = teamMembers.filter((m) => !assignedIds.has(m.id));

  const handleDrop = useCallback((idx: number, rower: User) => {
    setSeats((prev) =>
      prev.map((s, i) => {
        if (i === idx) return { ...s, rower };
        if (s.rower && s.rower.id === rower.id) return { ...s, rower: null };
        return s;
      })
    );
    setWarning(null);
  }, []);

  const handleRemove = useCallback((idx: number) => {
    setSeats((prev) => prev.map((s, i) => (i === idx ? { ...s, rower: null } : s)));
  }, []);

  const loadTemplate = (id: string) => {
    if (!id) return;
    const tpl = templates.find((t) => String(t.id) === id);
    if (!tpl) return;
    setTemplateValue(id);
    setBoatValue(tpl.boat_type);
    // Defer until seats rebuild from the new boat type
    setPendingTemplate(tpl);
  };

  const filled = seats.filter((s) => s.rower).length;
  const total = seats.length;
  const portsFilled = seats.filter((s) => s.side === 'port' && s.rower).length;
  const stbdFilled = seats.filter((s) => s.side === 'starboard' && s.rower).length;
  const totalWeight = seats.filter((s) => s.rower && !s.is_cox).reduce((a, s) => a + (s.rower!.weight || 0), 0);
  const rowingCount = seats.filter((s) => !s.is_cox).length;
  const avgWeight = rowingCount && totalWeight ? Math.round(totalWeight / rowingCount) : 0;

  const handleSave = async () => {
    if (filled !== total) return;
    setSaving(true);
    try {
      await createCrew(sessionId, {
        boat_type: boat.value,
        is_confirmed: false,
        seats: seats.map((s) => ({
          rower: s.rower!.id,
          seat_number: s.is_cox ? 0 : s.num,
          is_cox: s.is_cox,
        })),
      });
      setSeats(buildSeats(boat));
      onCrewSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="boat-builder">
        <div className="head">
          <select className="select" value={boatValue} onChange={(e) => setBoatValue(e.target.value)}>
            {BOAT_TYPES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
          <select className="select" value={templateValue} onChange={(e) => loadTemplate(e.target.value)} style={{ marginLeft: 6 }}>
            <option value="">Load template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.boat_type}
              </option>
            ))}
          </select>
          <div className="spacer"></div>
          <div className="builder-tabs">
            <button className={variant === 'hull' ? 'active' : ''} onClick={() => setVariant('hull')}>
              <Icon name="boat" size={12} /> Hull
            </button>
            <button className={variant === 'list' ? 'active' : ''} onClick={() => setVariant('list')}>
              <Icon name="list" size={12} /> List
            </button>
          </div>
        </div>

        <div className="boat-stage">
          <div className="roster">
            <h4>Available · {available.length}</h4>
            {available.map((r) => (
              <DraggableRower key={r.id} rower={r} />
            ))}
            {available.length === 0 && (
              <div className="muted" style={{ fontSize: 12, padding: 8 }}>
                All rostered.
              </div>
            )}
          </div>

          {variant === 'hull' ? (
            <BoatVisual boat={boat} seats={seats} onDrop={handleDrop} onRemove={handleRemove} />
          ) : (
            <AbstractList seats={seats} onDrop={handleDrop} onRemove={handleRemove} />
          )}
        </div>

        <div className="builder-foot">
          <div className="stat">
            <span className="k">Filled</span>
            <span className="v">
              {filled}/{total}
            </span>
          </div>
          <div className="stat">
            <span className="k">Avg weight</span>
            <span className="v">
              {avgWeight || '—'}
              {avgWeight ? (
                <span className="muted" style={{ fontSize: 11 }}>
                  kg
                </span>
              ) : null}
            </span>
          </div>
          {!boat.sculling && (
            <div className="stat">
              <span className="k">P / S</span>
              <span className="v" style={{ color: portsFilled === stbdFilled ? 'var(--lime)' : 'var(--warn)' }}>
                {portsFilled} / {stbdFilled}
              </span>
            </div>
          )}
          {warning && (
            <span className="mono" style={{ fontSize: 11, color: 'var(--warn)' }}>
              {warning}
            </span>
          )}
          <div className="spacer"></div>
          <button className="btn ghost" onClick={() => setSeats(buildSeats(boat))}>
            Clear
          </button>
          <button className="btn primary" disabled={filled !== total || saving} onClick={handleSave}>
            <Icon name="check" size={12} /> {saving ? 'Saving…' : 'Save crew'}
          </button>
        </div>
      </div>
    </DndProvider>
  );
}
