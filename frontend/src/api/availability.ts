import api from './client';
import type { Availability } from '../types';

export async function getMyAvailability(week_start?: string): Promise<Availability[]> {
  const params = week_start ? { week_start } : {};
  const res = await api.get('/availability/', { params });
  return res.data;
}

export async function createAvailability(data: Omit<Availability, 'id' | 'user'>): Promise<Availability> {
  const res = await api.post('/availability/', data);
  return res.data;
}

export async function deleteAvailability(id: number): Promise<void> {
  await api.delete(`/availability/${id}/`);
}

export async function getTeamAvailability(params: { date?: string; week_start?: string }): Promise<Availability[]> {
  const res = await api.get('/availability/team/', { params });
  return res.data;
}
