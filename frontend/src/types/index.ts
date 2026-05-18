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

export interface UserMinimal {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
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
  source?: 'template' | 'constraint' | 'manual';
  template_id?: number;
  template_name?: string;
  missing_from_template?: number[];
}

export interface SuggestionResponse {
  suggestions: CrewSuggestion[];
  available_coxswains: { id: number; name: string; email: string }[];
}

export interface LineupTemplateSeatDetail {
  position: number;
  rower: number;
  rower_detail?: UserMinimal;
}

export interface LineupTemplate {
  id: number;
  team: string;
  name: string;
  boat_type: string;
  lineup: number[];
  seats: LineupTemplateSeatDetail[];
  cox: number | null;
  cox_detail?: UserMinimal | null;
  note: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Regatta {
  id: number;
  team: string;
  name: string;
  date: string;
  location: string;
  registered: boolean;
  crews_entered: number;
  note: string;
  created_by: number;
  created_at: string;
}

export interface TeamAvailabilityBlock {
  day_of_week: number;
  start_time: string;
  end_time: string;
  count: number;
  rower_ids?: number[];
}
