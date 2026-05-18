import type { CrewAssignment } from '../types';

export type CrewStatus = 'confirmed' | 'draft' | 'cancelled';

export function crewStatus(crew: Pick<CrewAssignment, 'is_confirmed' | 'is_cancelled'>): CrewStatus {
  if (crew.is_cancelled) return 'cancelled';
  if (crew.is_confirmed) return 'confirmed';
  return 'draft';
}

export type SideKind = 'port' | 'starboard' | 'cox' | 'both' | 'none';

export function seatSide(seat: { is_cox: boolean; rower_detail?: { sweep_side?: string } }): SideKind {
  if (seat.is_cox) return 'cox';
  const s = seat.rower_detail?.sweep_side;
  if (s === 'port' || s === 'starboard' || s === 'both') return s;
  return 'none';
}
