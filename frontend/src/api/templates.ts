import api from './client';
import type { LineupTemplate } from '../types';

export async function getTemplates(): Promise<LineupTemplate[]> {
  const res = await api.get('/templates/');
  return res.data;
}

export async function createTemplate(data: {
  name: string;
  boat_type: string;
  lineup: number[];
  cox?: number | null;
  note?: string;
}): Promise<LineupTemplate> {
  const res = await api.post('/templates/', data);
  return res.data;
}

export async function updateTemplate(
  id: number,
  data: Partial<{ name: string; boat_type: string; lineup: number[]; cox: number | null; note: string }>
): Promise<LineupTemplate> {
  const res = await api.patch(`/templates/${id}/`, data);
  return res.data;
}

export async function deleteTemplate(id: number): Promise<void> {
  await api.delete(`/templates/${id}/`);
}
