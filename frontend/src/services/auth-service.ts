import api from './api'
import type { AuthResponse, LoginCredentials } from '../types/auth'

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', credentials)
  return response.data
}
