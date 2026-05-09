import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { decodeJwt } from '../utils/decode-jwt'
import type { AuthUser } from '../types/auth'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string) => void
  register: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function hydrateFromStorage(): AuthUser | null {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    const payload = decodeJwt(token)
    // decodeJwt returns null for legacy tokens (no role) or malformed tokens
    if (!payload) {
      // Remove the invalid token so next mount starts clean
      localStorage.removeItem('token')
      return null
    }
    return { id: payload.id, email: payload.email, name: payload.name, role: payload.role }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Synchronous hydration on first render — no async needed because we read
  // localStorage directly. isLoading stays false throughout (no network call).
  const [user, setUser] = useState<AuthUser | null>(() => hydrateFromStorage())
  const isLoading = false

  const login = useCallback((token: string) => {
    try {
      localStorage.setItem('token', token)
    } catch {
      // Silently ignore storage quota errors — in-memory state still works
    }
    const payload = decodeJwt(token)
    if (payload) {
      setUser({ id: payload.id, email: payload.email, name: payload.name, role: payload.role })
    }
  }, [])

  // register is semantically equivalent to login on the frontend
  const register = login

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token')
    } catch {
      // Ignore storage errors
    }
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}
