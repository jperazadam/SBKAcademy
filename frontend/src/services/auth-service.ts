import api from './api'
import type { AuthResponse, LoginCredentials, RegisterRequest } from '../types/auth'

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', credentials)
  return response.data
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', payload)
  return response.data
}
