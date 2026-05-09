import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import React from 'react'
import { AuthProvider, useAuth } from '../context/auth-context'

/**
 * Builds a minimal JWT with the given payload.
 * Only the payload segment matters — decode-jwt reads the middle part only.
 */
function buildToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fakesig`
}

const professorPayload = { id: 1, email: 'prof@test.com', name: 'Profesor Test', role: 'professor' }
const studentPayload = { id: 2, email: 'alumno@test.com', name: 'Alumno Test', role: 'student' }

/** Minimal consumer that exposes context values via data-testid */
function AuthConsumer() {
  const { user, isAuthenticated, isLoading } = useAuth()
  return (
    <div>
      <span data-testid="is-loading">{String(isLoading)}</span>
      <span data-testid="is-authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user-name">{user?.name ?? 'null'}</span>
      <span data-testid="user-role">{user?.role ?? 'null'}</span>
    </div>
  )
}

/** Consumer that triggers login / logout actions */
function AuthActionConsumer({ token }: { token?: string }) {
  const { login, logout } = useAuth()
  return (
    <div>
      <button onClick={() => token && login(token)}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('initial hydration', () => {
    it('starts with isLoading=false and user=null when localStorage is empty', () => {
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>,
      )
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user-name')).toHaveTextContent('null')
    })

    it('hydrates user from a valid professor token in localStorage', () => {
      localStorage.setItem('token', buildToken(professorPayload))
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>,
      )
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('user-name')).toHaveTextContent('Profesor Test')
      expect(screen.getByTestId('user-role')).toHaveTextContent('professor')
    })

    it('hydrates user from a valid student token in localStorage', () => {
      localStorage.setItem('token', buildToken(studentPayload))
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>,
      )
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('user-role')).toHaveTextContent('student')
    })

    it('stays unauthenticated when the stored token has no role (legacy token)', () => {
      // Legacy token: valid JWT structure but missing `role` field
      localStorage.setItem('token', buildToken({ id: 1, email: 'old@test.com', name: 'Viejo' }))
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>,
      )
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user-name')).toHaveTextContent('null')
    })

    it('stays unauthenticated when the stored token is malformed', () => {
      localStorage.setItem('token', 'not.a.jwt')
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>,
      )
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
    })
  })

  describe('login()', () => {
    it('sets user and isAuthenticated=true after login with a professor token', () => {
      const token = buildToken(professorPayload)
      render(
        <AuthProvider>
          <AuthConsumer />
          <AuthActionConsumer token={token} />
        </AuthProvider>,
      )
      act(() => {
        screen.getByRole('button', { name: 'login' }).click()
      })
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('user-name')).toHaveTextContent('Profesor Test')
      expect(screen.getByTestId('user-role')).toHaveTextContent('professor')
    })

    it('persists token to localStorage after login', () => {
      const token = buildToken(professorPayload)
      render(
        <AuthProvider>
          <AuthActionConsumer token={token} />
        </AuthProvider>,
      )
      act(() => {
        screen.getByRole('button', { name: 'login' }).click()
      })
      expect(localStorage.getItem('token')).toBe(token)
    })
  })

  describe('logout()', () => {
    it('clears user and isAuthenticated=false after logout', () => {
      localStorage.setItem('token', buildToken(professorPayload))
      render(
        <AuthProvider>
          <AuthConsumer />
          <AuthActionConsumer />
        </AuthProvider>,
      )
      // Should start authenticated
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')

      act(() => {
        screen.getByRole('button', { name: 'logout' }).click()
      })
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user-name')).toHaveTextContent('null')
    })

    it('removes token from localStorage after logout', () => {
      localStorage.setItem('token', buildToken(professorPayload))
      render(
        <AuthProvider>
          <AuthActionConsumer />
        </AuthProvider>,
      )
      act(() => {
        screen.getByRole('button', { name: 'logout' }).click()
      })
      expect(localStorage.getItem('token')).toBeNull()
    })
  })

  describe('useAuth guard', () => {
    it('throws when useAuth is used outside AuthProvider', () => {
      // Silence the React error boundary noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => render(<AuthConsumer />)).toThrow()
      consoleSpy.mockRestore()
    })
  })
})
