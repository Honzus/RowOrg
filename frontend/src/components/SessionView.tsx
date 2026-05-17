import { useState, useEffect } from 'react';
import type { Session, User, CrewSuggestion, SuggestionResponse } from '../types';
import { getSuggestions, createCrew, confirmCrew, cancelCrew, getSession } from '../api/sessions';
import CrewBuilder from './CrewBuilder';

interface Props {
  session: Session;
  user: User;
}

export default function SessionView({ session: initialSession, user }: Props) {
  const [session, setSession] = useState(initialSession);
  const [suggestions, setSuggestions] = useState<CrewSuggestion[]>([]);
  const [availableCoxswains, setAvailableCoxswains] = useState<{ id: number; name: string; email: string }[]>([]);
  const [selectedCox, setSelectedCox] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);

  const reloadSession = async () => {
    const updated = await getSession(session.id);
    setSession(updated);
  };

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const data: SuggestionResponse = await getSuggestions(session.id);
      setSuggestions(data.suggestions);
      setAvailableCoxswains(data.available_coxswains);
      if (data.available_coxswains.length > 0 && selectedCox === '') {
        setSelectedCox(data.available_coxswains[0].id);
      }
    } catch {
      setSuggestions([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadSuggestions(); }, [session.id]);

  const handleAcceptSuggestion = async (suggestion: CrewSuggestion) => {
    const seats = suggestion.rowers.map((r, i) => ({
      rower: r.id,
      seat_number: i + 1,
      is_cox: false,
    }));
    // Add selected cox if this boat type is coxed
    const coxedBoats = ['4+', '8+'];
    if (coxedBoats.includes(suggestion.boat_type) && selectedCox) {
      seats.push({ rower: selectedCox as number, seat_number: 0, is_cox: true });
    }
    await createCrew(session.id, {
      boat_type: suggestion.boat_type,
      is_confirmed: false,
      seats,
    });
    await reloadSession();
    await loadSuggestions();
  };

  const handleConfirm = async (crewId: number) => {
    await confirmCrew(session.id, crewId);
    await reloadSession();
    await loadSuggestions();
  };

  const handleCancel = async (crewId: number) => {
    await cancelCrew(session.id, crewId);
    await reloadSession();
    await loadSuggestions();
  };

  const isCoxedBoat = (boatType: string) => ['4+', '8+'].includes(boatType);

  return (
    <div className="session-view">
      <h3>Session: {session.date} ({session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)})</h3>
      {session.description && <p className="workout-description"><strong>Workout:</strong> {session.description}</p>}

      {session.crews.length > 0 && (
        <div className="existing-crews">
          <h4>Assigned Crews</h4>
          {session.crews.map(crew => (
            <div key={crew.id} className={`crew-card ${crew.is_confirmed ? 'confirmed' : ''} ${crew.is_cancelled ? 'cancelled' : ''}`}>
              <div className="crew-card-header">
                <strong>{crew.boat_type}</strong>
                {crew.is_confirmed && <span className="confirmed-badge">Approved</span>}
                {crew.is_cancelled && <span className="cancelled-badge">Cancelled</span>}
                {!crew.is_confirmed && !crew.is_cancelled && <span className="draft-badge">Draft</span>}
              </div>
              <ul>
                {crew.seats.filter(s => !s.is_cox).map(seat => (
                  <li key={seat.id}>
                    Seat {seat.seat_number}: {seat.rower_detail?.first_name} {seat.rower_detail?.last_name}
                  </li>
                ))}
                {crew.seats.filter(s => s.is_cox).map(seat => (
                  <li key={seat.id} className="cox-seat">
                    Cox: {seat.rower_detail?.first_name} {seat.rower_detail?.last_name}
                  </li>
                ))}
              </ul>
              <div className="crew-actions">
                {!crew.is_confirmed && (
                  <button className="approve-btn" onClick={() => handleConfirm(crew.id)}>Approve</button>
                )}
                {!crew.is_cancelled && (
                  <button className="cancel-btn" onClick={() => handleCancel(crew.id)}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="actions">
        <button onClick={loadSuggestions} disabled={loading}>
          {loading ? 'Loading...' : 'Get Suggestions'}
        </button>
        <button onClick={() => setShowBuilder(!showBuilder)}>
          {showBuilder ? 'Hide Builder' : 'Manual Crew Builder'}
        </button>
      </div>

      {availableCoxswains.length > 0 && (
        <div className="cox-selector">
          <label>
            Coxswain:
            <select value={selectedCox} onChange={e => setSelectedCox(e.target.value ? Number(e.target.value) : '')}>
              <option value="">No cox</option>
              {availableCoxswains.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="suggestions">
          <h4>Suggested Crews (ranked by fit)</h4>
          {suggestions.map((s, i) => (
            <div key={i} className="suggestion-card">
              <div className="suggestion-header">
                <strong>{s.boat_type}</strong>
                <span className="score">score: {s.score}</span>
              </div>
              <ul>
                {s.rowers.map(r => <li key={r.id}>{r.name}</li>)}
              </ul>
              {isCoxedBoat(s.boat_type) && !selectedCox && (
                <p className="warning">Select a coxswain above to accept this coxed boat</p>
              )}
              <button
                onClick={() => handleAcceptSuggestion(s)}
                disabled={isCoxedBoat(s.boat_type) && !selectedCox}
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      {showBuilder && (
        <CrewBuilder sessionId={session.id} onCrewSaved={reloadSession} />
      )}
    </div>
  );
}
