import api from './client';
import type { Session, CrewAssignment, SuggestionResponse } from '../types';

export async function getSessions(week_start?: string): Promise<Session[]> {
  const params = week_start ? { week_start } : {};
  const res = await api.get('/sessions/', { params });
  return res.data;
}

export async function createSession(data: { date: string; start_time: string; end_time: string; description: string }): Promise<Session> {
  const res = await api.post('/sessions/', data);
  return res.data;
}

export async function getSession(id: number): Promise<Session> {
  const res = await api.get(`/sessions/${id}/`);
  return res.data;
}

export async function deleteSession(id: number): Promise<void> {
  await api.delete(`/sessions/${id}/`);
}

export async function createCrew(sessionId: number, data: { boat_type: string; is_confirmed: boolean; seats: { rower: number; seat_number: number; is_cox: boolean }[] }): Promise<CrewAssignment> {
  const res = await api.post(`/sessions/${sessionId}/crews/`, data);
  return res.data;
}

export async function confirmCrew(sessionId: number, crewId: number): Promise<CrewAssignment> {
  const res = await api.patch(`/sessions/${sessionId}/crews/${crewId}/confirm/`);
  return res.data;
}

export async function cancelCrew(sessionId: number, crewId: number): Promise<CrewAssignment> {
  const res = await api.patch(`/sessions/${sessionId}/crews/${crewId}/cancel/`);
  return res.data;
}

export async function getSuggestions(sessionId: number): Promise<SuggestionResponse> {
  const res = await api.get(`/suggestions/${sessionId}/`);
  return res.data;
}
