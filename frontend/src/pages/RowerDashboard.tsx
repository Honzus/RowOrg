import { useState, useEffect } from 'react';
import type { User, Session } from '../types';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import { getSessions } from '../api/sessions';

interface Props {
  user: User;
}

export default function RowerDashboard({ user }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    getSessions().then(setSessions);
  }, []);

  // Find sessions where this rower is assigned to a crew
  const myLineups = sessions.flatMap(session =>
    session.crews
      .filter(crew => crew.seats.some(seat => seat.rower === user.id))
      .map(crew => ({ session, crew }))
  );

  return (
    <div className="rower-dashboard">
      <h2>My Lineups</h2>
      {myLineups.length === 0 ? (
        <p>No lineups assigned yet.</p>
      ) : (
        <div className="my-lineups">
          {myLineups.map(({ session, crew }) => {
            const mySeat = crew.seats.find(s => s.rower === user.id);
            return (
              <div key={crew.id} className={`lineup-card ${crew.is_confirmed ? 'confirmed' : ''} ${crew.is_cancelled ? 'cancelled' : ''}`}>
                <div className="lineup-header">
                  <strong>{session.date}</strong>
                  <span>{session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}</span>
                  <strong>{crew.boat_type}</strong>
                  {crew.is_confirmed && <span className="confirmed-badge">Approved</span>}
                  {crew.is_cancelled && <span className="cancelled-badge">Cancelled</span>}
                  {!crew.is_confirmed && !crew.is_cancelled && <span className="draft-badge">Draft</span>}
                </div>
                {session.description && <p className="workout-description"><strong>Workout:</strong> {session.description}</p>}
                <div className="lineup-details">
                  <span>Your position: {mySeat?.is_cox ? 'Cox' : `Seat ${mySeat?.seat_number}`}</span>
                </div>
                <ul>
                  {crew.seats.filter(s => !s.is_cox).map(seat => (
                    <li key={seat.id} className={seat.rower === user.id ? 'highlight' : ''}>
                      Seat {seat.seat_number}: {seat.rower_detail?.first_name} {seat.rower_detail?.last_name}
                    </li>
                  ))}
                  {crew.seats.filter(s => s.is_cox).map(seat => (
                    <li key={seat.id} className={`cox-seat ${seat.rower === user.id ? 'highlight' : ''}`}>
                      Cox: {seat.rower_detail?.first_name} {seat.rower_detail?.last_name}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <h2>My Availability</h2>
      <AvailabilityCalendar />
    </div>
  );
}
