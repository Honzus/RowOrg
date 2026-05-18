import api from './client';
import type { TeamAvailabilityBlock } from '../types';

export async function getTeamAvailabilityBlocks(week_start: string): Promise<TeamAvailabilityBlock[]> {
  const res = await api.get('/planning/team-availability/', { params: { week_start } });
  return res.data;
}
