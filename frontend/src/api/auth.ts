import api from './client';
import type { User } from '../types';

export async function register(data: { email: string; username: string; password: string; first_name: string; last_name: string }) {
  const res = await api.post('/auth/register/', data);
  return res.data;
}

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login/', { email, password });
  localStorage.setItem('access_token', res.data.access);
  localStorage.setItem('refresh_token', res.data.refresh);
  return res.data;
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export async function getMe(): Promise<User> {
  const res = await api.get('/auth/me/');
  return res.data;
}

export async function updateProfile(data: Partial<User>): Promise<User> {
  const res = await api.patch('/auth/me/', data);
  return res.data;
}
