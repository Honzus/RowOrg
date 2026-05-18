import api from './client';
import type { Regatta } from '../types';

export async function getRegattas(): Promise<Regatta[]> {
  const res = await api.get('/regattas/');
  return res.data;
}

export async function createRegatta(data: {
  name: string;
  date: string;
  location?: string;
  registered?: boolean;
  crews_entered?: number;
  note?: string;
}): Promise<Regatta> {
  const res = await api.post('/regattas/', data);
  return res.data;
}

export async function updateRegatta(
  id: number,
  data: Partial<Pick<Regatta, 'name' | 'date' | 'location' | 'registered' | 'crews_entered' | 'note'>>
): Promise<Regatta> {
  const res = await api.patch(`/regattas/${id}/`, data);
  return res.data;
}

export async function deleteRegatta(id: number): Promise<void> {
  await api.delete(`/regattas/${id}/`);
}
