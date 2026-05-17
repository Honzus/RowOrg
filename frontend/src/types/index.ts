export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  team: string | null;
  role: 'coach' | 'oarsman' | 'coxswain' | '';
  rowing_type: 'sculling' | 'sweeping' | 'both' | '';
  sweep_side: 'port' | 'starboard' | 'both' | '';
  can_cox: boolean;
  weight: number | null;
}

export interface Team {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  members?: User[];
}

export interface Availability {
  id: number;
  user: number;
  week_start: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface Session {
  id: number;
  team: string;
  date: string;
  start_time: string;
  end_time: string;
  description: string;
  created_by: number;
  created_at: string;
  crews: CrewAssignment[];
}

export interface CrewAssignment {
  id: number;
  session: number;
  boat_type: string;
  is_confirmed: boolean;
  is_cancelled: boolean;
  seats: CrewSeat[];
}

export interface CrewSeat {
  id: number;
  rower: number;
  rower_detail?: User;
  seat_number: number;
  is_cox: boolean;
}

export interface CoachPreference {
  id: number;
  coach: number;
  rower: number;
  preferred_boat_type: string;
  preferred_seat: number | null;
  priority: number;
}

export interface PreferredPairing {
  id: number;
  coach: number;
  rowers: number[];
  boat_type: string;
  note: string;
}

export interface CrewSuggestion {
  boat_type: string;
  rowers: { id: number; name: string; email: string }[];
  score: number;
}

export interface SuggestionResponse {
  suggestions: CrewSuggestion[];
  available_coxswains: { id: number; name: string; email: string }[];
}
