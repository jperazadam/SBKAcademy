import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/auth-context'
import RegisterPage from '../pages/register-page'

function buildToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fakesig`
}

const { register: registerMock } = vi.hoisted(() => ({
  register: vi.fn<() => Promise<never>>(),
}))

vi.mock('../services/auth-service', () => ({
  register: registerMock,
  login: vi.fn(),
}))

// Capture navigate calls
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
        <RegisterPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

// Helpers to get specific form fields unambiguously
function getNameInput() { return screen.getByLabelText(/nombre completo/i) }
function getEmailInput() { return screen.getByLabelText(/correo electrónico/i) }
function getPasswordInput() { return screen.getByLabelText('Contraseña') }
function getConfirmInput() { return screen.getByLabelText(/confirmar contraseña/i) }
function getProfessorRadio() { return screen.getByRole('radio', { name: /profesor/i }) }
function getAlumnoRadio() { return screen.getByRole('radio', { name: /alumno/i }) }
function getSubmitButton() { return screen.getByRole('button', { name: /registrar/i }) }

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockReset()
    registerMock.mockReset()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('renders all required fields', () => {
    renderPage()
    expect(getNameInput()).toBeInTheDocument()
    expect(getEmailInput()).toBeInTheDocument()
    expect(getPasswordInput()).toBeInTheDocument()
    expect(getConfirmInput()).toBeInTheDocument()
  })

  it('renders role toggle with professor and student options', () => {
    renderPage()
    expect(getProfessorRadio()).toBeInTheDocument()
    expect(getAlumnoRadio()).toBeInTheDocument()
  })

  it('has a link to login page', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /iniciá sesión/i })).toBeInTheDocument()
  })

  it('navigates to /dashboard after successful professor registration', async () => {
    const token = buildToken({ id: 1, email: 'prof@test.com', name: 'Profesor', role: 'professor' })
    registerMock.mockResolvedValue({ token, user: { id: 1, email: 'prof@test.com', name: 'Profesor', role: 'professor' } })

    const user = userEvent.setup()
    renderPage()

    await user.type(getNameInput(), 'Profesor Test')
    await user.type(getEmailInput(), 'prof@test.com')
    await user.type(getPasswordInput(), 'password123')
    await user.type(getConfirmInput(), 'password123')
    await user.click(getProfessorRadio())
    await user.click(getSubmitButton())

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('navigates to /portal after successful student registration', async () => {
    const token = buildToken({ id: 2, email: 'alumno@test.com', name: 'Alumno', role: 'student' })
    registerMock.mockResolvedValue({ token, user: { id: 2, email: 'alumno@test.com', name: 'Alumno', role: 'student' } })

    const user = userEvent.setup()
    renderPage()

    await user.type(getNameInput(), 'Alumno Test')
    await user.type(getEmailInput(), 'alumno@test.com')
    await user.type(getPasswordInput(), 'password123')
    await user.type(getConfirmInput(), 'password123')
    await user.click(getAlumnoRadio())
    await user.click(getSubmitButton())

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/portal')
    })
  })

  it('shows inline error when passwords do not match', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(getNameInput(), 'Alguien')
    await user.type(getEmailInput(), 'alguien@test.com')
    await user.type(getPasswordInput(), 'password123')
    await user.type(getConfirmInput(), 'diferente99')
    await user.click(getProfessorRadio())
    await user.click(getSubmitButton())

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('shows inline error on duplicate email (409)', async () => {
    registerMock.mockRejectedValue({ response: { status: 409, data: { error: 'Ya existe una cuenta con ese email.' } } })

    const user = userEvent.setup()
    renderPage()

    await user.type(getNameInput(), 'Alguien')
    await user.type(getEmailInput(), 'existe@test.com')
    await user.type(getPasswordInput(), 'password123')
    await user.type(getConfirmInput(), 'password123')
    await user.click(getProfessorRadio())
    await user.click(getSubmitButton())

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/ya existe una cuenta/i)).toBeInTheDocument()
    })
  })

  it('calls register service with correct payload including role', async () => {
    const token = buildToken({ id: 1, email: 'nuevo@test.com', name: 'Nuevo', role: 'professor' })
    registerMock.mockResolvedValue({ token, user: { id: 1, email: 'nuevo@test.com', name: 'Nuevo', role: 'professor' } })

    const user = userEvent.setup()
    renderPage()

    await user.type(getNameInput(), 'Nuevo Profe')
    await user.type(getEmailInput(), 'nuevo@test.com')
    await user.type(getPasswordInput(), 'mipassword')
    await user.type(getConfirmInput(), 'mipassword')
    await user.click(getProfessorRadio())
    await user.click(getSubmitButton())

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: 'Nuevo Profe',
        email: 'nuevo@test.com',
        password: 'mipassword',
        role: 'professor',
      })
    })
  })
})
