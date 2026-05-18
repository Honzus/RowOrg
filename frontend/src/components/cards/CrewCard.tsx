import { useState } from 'react';
import type { CrewAssignment } from '../../types';
import { StatusBadge, SideTag } from '../Badges';
import { crewStatus, seatSide } from '../../lib/crewHelpers';
import Avatar from '../Avatar';
import Icon from '../Icon';

interface Props {
  crew: CrewAssignment;
  onApprove?: () => Promise<void> | void;
  onCancel?: () => Promise<void> | void;
}

export default function CrewCard({ crew, onApprove, onCancel }: Props) {
  const status = crewStatus(crew);
  const [busy, setBusy] = useState(false);

  const rowers = crew.seats
    .filter((s) => !s.is_cox)
    .slice()
    .sort((a, b) => a.seat_number - b.seat_number);
  const cox = crew.seats.find((s) => s.is_cox);

  const wrap = async (fn?: () => Promise<void> | void) => {
    if (!fn) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`lineup ${status}`} style={{ display: 'block' }}>
      <span className="stripe"></span>
      <div className="lineup-top" style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--text-0)' }}>
          {crew.boat_type}
        </div>
        <StatusBadge status={status} />
        <div className="spacer"></div>
        {status !== 'confirmed' && status !== 'cancelled' && onApprove && (
          <button className="btn sm success" disabled={busy} onClick={() => wrap(onApprove)}>
            <Icon name="check" size={11} /> Approve
          </button>
        )}
        {status !== 'cancelled' && onCancel && (
          <button className="btn sm danger" disabled={busy} onClick={() => wrap(onCancel)}>
            <Icon name="x" size={11} /> Cancel
          </button>
        )}
      </div>
      <div className="seats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 18 }}>
        {rowers.map((s, idx) => {
          const pos = idx === 0 ? 'BOW' : idx === rowers.length - 1 ? 'STK' : String(idx + 1);
          return (
            <div key={s.id} className="seat-row">
              <span className="pos">{pos}</span>
              <Avatar user={s.rower_detail ?? null} size={18} />
              <span className="name">
                {s.rower_detail ? `${s.rower_detail.first_name} ${s.rower_detail.last_name}` : `Rower #${s.rower}`}
              </span>
              <span className="side">
                <SideTag side={seatSide(s)} />
              </span>
            </div>
          );
        })}
        {cox && (
          <div className="seat-row">
            <span className="pos">COX</span>
            <Avatar user={cox.rower_detail ?? null} size={18} />
            <span className="name">
              {cox.rower_detail ? `${cox.rower_detail.first_name} ${cox.rower_detail.last_name}` : `Rower #${cox.rower}`}
            </span>
            <span className="side">
              <SideTag side="cox" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
