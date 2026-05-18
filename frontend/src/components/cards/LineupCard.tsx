import type { Session, CrewAssignment } from '../../types';
import { MONTHS, parseISODate, formatTime } from '../../lib/dates';
import { StatusBadge, SideTag } from '../Badges';
import { crewStatus, seatSide } from '../../lib/crewHelpers';

interface Props {
  session: Session;
  crew: CrewAssignment;
  highlightRowerId?: number;
}

export default function LineupCard({ session, crew, highlightRowerId }: Props) {
  const status = crewStatus(crew);
  const dateObj = parseISODate(session.date);
  const day = dateObj.getDate();
  const month = MONTHS[dateObj.getMonth()];

  const rowers = crew.seats
    .filter((s) => !s.is_cox)
    .slice()
    .sort((a, b) => a.seat_number - b.seat_number);
  const cox = crew.seats.find((s) => s.is_cox);

  return (
    <div className={`lineup ${status}`}>
      <span className="stripe"></span>
      <div className="lineup-top">
        <div className="lineup-date">
          <span className="d">{day}</span>
          <span className="m">{month}</span>
        </div>
        <div className="lineup-info">
          <div className="boat">
            {crew.boat_type}
            <StatusBadge status={status} />
          </div>
          <div className="time">
            {formatTime(session.start_time)} – {formatTime(session.end_time)}
          </div>
        </div>
      </div>
      {session.description && <div className="workout">{session.description}</div>}
      <div className="seats">
        {rowers.map((s, idx) => {
          const pos = idx === 0 ? 'BOW' : idx === rowers.length - 1 ? 'STK' : String(idx + 1);
          const isSelf = highlightRowerId !== undefined && s.rower === highlightRowerId;
          return (
            <div key={s.id} className={`seat-row ${isSelf ? 'self' : ''}`}>
              <span className="pos">{pos}</span>
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
          <div className={`seat-row ${highlightRowerId === cox.rower ? 'self' : ''}`}>
            <span className="pos">COX</span>
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
