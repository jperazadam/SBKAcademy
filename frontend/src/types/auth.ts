export type Role = 'professor' | 'student'

export interface AuthUser {
  id: number
  email: string
  name: string
  role: Role
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  role: Role
}

export interface AuthResponse {
  token: string
  user: AuthUser
}
