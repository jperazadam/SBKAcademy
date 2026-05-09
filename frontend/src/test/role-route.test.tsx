import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/auth-context'
import RoleRoute from '../components/role-route'

/**
 * Builds a minimal JWT with the given payload.
 */
function buildToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fakesig`
}

const professorToken = buildToken({ id: 1, email: 'prof@test.com', name: 'Profesor', role: 'professor' })
const studentToken = buildToken({ id: 2, email: 'alumno@test.com', name: 'Alumno', role: 'student' })

function renderWithRouter(
  token: string | null,
  initialPath: string,
  allowedRole: 'professor' | 'student',
) {
  if (token) {
    localStorage.setItem('token', token)
  } else {
    localStorage.removeItem('token')
  }

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/dashboard" element={<div>Dashboard (profesor)</div>} />
          <Route path="/portal" element={<div>Portal (alumno)</div>} />
          <Route
            path="/protected"
            element={
              <RoleRoute allow={allowedRole}>
                <div>Contenido protegido</div>
              </RoleRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('RoleRoute', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('renders children when authenticated user has the correct role (professor)', () => {
    renderWithRouter(professorToken, '/protected', 'professor')
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })

  it('renders children when authenticated user has the correct role (student)', () => {
    renderWithRouter(studentToken, '/protected', 'student')
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })

  it('redirects unauthenticated user to /login', () => {
    renderWithRouter(null, '/protected', 'professor')
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  it('redirects student trying to access professor route to /portal', () => {
    renderWithRouter(studentToken, '/protected', 'professor')
    expect(screen.getByText('Portal (alumno)')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  it('redirects professor trying to access student route to /dashboard', () => {
    renderWithRouter(professorToken, '/protected', 'student')
    expect(screen.getByText('Dashboard (profesor)')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })
})
