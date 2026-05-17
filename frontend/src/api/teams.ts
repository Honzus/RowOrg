import api from './client';
import type { Team } from '../types';

export async function createTeam(name: string): Promise<Team> {
  const res = await api.post('/teams/', { name });
  return res.data;
}

export async function joinTeam(invite_code: string): Promise<Team> {
  const res = await api.post('/teams/join/', { invite_code });
  return res.data;
}

export async function getTeam(id: string): Promise<Team> {
  const res = await api.get(`/teams/${id}/`);
  return res.data;
}
