import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/auth-context'
import StudentHomePage from '../pages/student-home-page'

/**
 * Builds a minimal JWT with the given payload.
 * Only the payload segment matters — decode-jwt reads the middle part only.
 *
 * Payload is encoded as UTF-8 bytes before base64 to match what the backend
 * does with `jsonwebtoken`. btoa() on its own would silently use Latin-1 and
 * break multi-byte characters (accents, ñ).
 */
function buildToken(payload: Record<string, unknown>): string {
  const encode = (obj: unknown): string => {
    const bytes = new TextEncoder().encode(JSON.stringify(obj))
    let binary = ''
    for (const b of bytes) binary += String.fromCharCode(b)
    return btoa(binary)
  }
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const body = encode(payload)
  return `${header}.${body}.fakesig`
}

const studentToken = buildToken({
  id: 2,
  email: 'alumno@test.com',
  name: 'Ana García',
  role: 'student',
})

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  )
}

describe('StudentHomePage', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('greets the student with their name from AuthContext', () => {
    localStorage.setItem('token', studentToken)
    renderWithProviders(<StudentHomePage />)
    expect(screen.getByText(/Ana García/)).toBeInTheDocument()
  })

  it('shows the welcome heading with "Hola"', () => {
    localStorage.setItem('token', studentToken)
    renderWithProviders(<StudentHomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Hola/)
  })

  it('shows the coming-soon message', () => {
    localStorage.setItem('token', studentToken)
    renderWithProviders(<StudentHomePage />)
    expect(
      screen.getByText(/Pronto vas a poder buscar profesores y clases/),
    ).toBeInTheDocument()
  })

  it('renders gracefully when user is null (unauthenticated)', () => {
    // No token in localStorage — user will be null
    renderWithProviders(<StudentHomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
