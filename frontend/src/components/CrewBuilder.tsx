import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { User } from '../types';
import { getTeam } from '../api/teams';
import { getMe } from '../api/auth';
import { createCrew } from '../api/sessions';

const BOAT_TYPES = [
  { value: '1x', label: '1x (Single)', seats: 1, coxed: false },
  { value: '2x', label: '2x (Double)', seats: 2, coxed: false },
  { value: '2-', label: '2- (Pair)', seats: 2, coxed: false },
  { value: '4x', label: '4x (Quad)', seats: 4, coxed: false },
  { value: '4-', label: '4- (Four)', seats: 4, coxed: false },
  { value: '4+', label: '4+ (Coxed Four)', seats: 4, coxed: true },
  { value: '8+', label: '8+ (Eight)', seats: 8, coxed: true },
];

interface Props {
  sessionId: number;
  onCrewSaved: () => void;
}

interface RowerSlot {
  seat_number: number;
  rower: User | null;
  is_cox: boolean;
}

function DraggableRower({ rower }: { rower: User }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ROWER',
    item: rower,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div ref={drag} className="draggable-rower" style={{ opacity: isDragging ? 0.5 : 1 }}>
      {rower.first_name} {rower.last_name}
      <small>{rower.role} | {rower.sweep_side || rower.rowing_type}</small>
    </div>
  );
}

function SeatSlot({ slot, onDrop, onRemove }: { slot: RowerSlot; onDrop: (rower: User) => void; onRemove: () => void }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'ROWER',
    drop: (item: User) => onDrop(item),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }));

  return (
    <div ref={drop} className={`seat-slot ${isOver ? 'hover' : ''}`}>
      <span>{slot.is_cox ? 'Cox' : `Seat ${slot.seat_number}`}:</span>
      {slot.rower ? (
        <span>
          {slot.rower.first_name} {slot.rower.last_name}
          <button onClick={onRemove}>x</button>
        </span>
      ) : (
        <span className="empty">Drop rower here</span>
      )}
    </div>
  );
}

export default function CrewBuilder({ sessionId, onCrewSaved }: Props) {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [boatType, setBoatType] = useState(BOAT_TYPES[0]);
  const [slots, setSlots] = useState<RowerSlot[]>([]);

  useEffect(() => {
    const load = async () => {
      const me = await getMe();
      if (me.team) {
        const team = await getTeam(me.team);
        setTeamMembers(team.members?.filter(m => m.role !== 'coach') || []);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const newSlots: RowerSlot[] = [];
    for (let i = 1; i <= boatType.seats; i++) {
      newSlots.push({ seat_number: i, rower: null, is_cox: false });
    }
    if (boatType.coxed) {
      newSlots.push({ seat_number: 0, rower: null, is_cox: true });
    }
    setSlots(newSlots);
  }, [boatType]);

  const assignedIds = new Set(slots.filter(s => s.rower).map(s => s.rower!.id));
  const availableRowers = teamMembers.filter(m => !assignedIds.has(m.id));

  const handleDrop = (index: number, rower: User) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], rower };
    setSlots(newSlots);
  };

  const handleRemove = (index: number) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], rower: null };
    setSlots(newSlots);
  };

  const handleSave = async () => {
    const filledSlots = slots.filter(s => s.rower);
    if (filledSlots.length !== slots.length) {
      alert('Please fill all seats');
      return;
    }
    await createCrew(sessionId, {
      boat_type: boatType.value,
      is_confirmed: true,
      seats: filledSlots.map(s => ({
        rower: s.rower!.id,
        seat_number: s.seat_number,
        is_cox: s.is_cox,
      })),
    });
    onCrewSaved();
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="crew-builder">
        <h4>Manual Crew Builder</h4>
        <label>
          Boat Type:
          <select value={boatType.value} onChange={e => setBoatType(BOAT_TYPES.find(b => b.value === e.target.value)!)}>
            {BOAT_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </label>

        <div className="builder-layout">
          <div className="available-rowers">
            <h5>Available Rowers</h5>
            {availableRowers.map(r => <DraggableRower key={r.id} rower={r} />)}
          </div>
          <div className="boat-slots">
            <h5>{boatType.label}</h5>
            {slots.map((slot, i) => (
              <SeatSlot key={i} slot={slot} onDrop={(r) => handleDrop(i, r)} onRemove={() => handleRemove(i)} />
            ))}
          </div>
        </div>

        <button onClick={handleSave}>Save Crew</button>
      </div>
    </DndProvider>
  );
}
