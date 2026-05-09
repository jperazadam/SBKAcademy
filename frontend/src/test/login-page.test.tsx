import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/auth-context'
import LoginPage from '../pages/login-page'

function buildToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fakesig`
}

const professorToken = buildToken({ id: 1, email: 'prof@test.com', name: 'Profesor', role: 'professor' })
const studentToken = buildToken({ id: 2, email: 'alumno@test.com', name: 'Alumno', role: 'student' })

const { login: loginMock } = vi.hoisted(() => ({
  login: vi.fn<() => Promise<never>>(),
}))

vi.mock('../services/auth-service', () => ({
  login: loginMock,
  register: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockReset()
    loginMock.mockReset()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('renders email and password fields and submit button', () => {
    renderPage()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('redirects professor to /dashboard after login', async () => {
    loginMock.mockResolvedValue({
      token: professorToken,
      user: { id: 1, email: 'prof@test.com', name: 'Profesor', role: 'professor' },
    })

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/correo electrónico/i), 'prof@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('redirects student to /portal after login', async () => {
    loginMock.mockResolvedValue({
      token: studentToken,
      user: { id: 2, email: 'alumno@test.com', name: 'Alumno', role: 'student' },
    })

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/correo electrónico/i), 'alumno@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/portal')
    })
  })

  it('stores token in localStorage after login via AuthContext', async () => {
    loginMock.mockResolvedValue({
      token: professorToken,
      user: { id: 1, email: 'prof@test.com', name: 'Profesor', role: 'professor' },
    })

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/correo electrónico/i), 'prof@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe(professorToken)
    })
  })

  it('shows error message on failed login', async () => {
    loginMock.mockRejectedValue(new Error('401'))

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/correo electrónico/i), 'wrong@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('has a link to the register page', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /registrate/i })).toBeInTheDocument()
  })
})
