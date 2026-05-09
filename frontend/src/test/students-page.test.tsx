import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import StudentsPage from '../pages/students-page'

const { listStudents } = vi.hoisted(() => ({
  listStudents: vi.fn<() => Promise<never>>(),
}))

vi.mock('../services/students-service', () => ({
  listStudents,
}))

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

function resetServiceMocks() {
  listStudents.mockReset()
  listStudents.mockResolvedValue([])
}

describe('StudentsPage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    resetServiceMocks()
  })

  it('does NOT render a "+ Nuevo alumno" button (REQ-21)', () => {
    renderWithRouter(<StudentsPage />)
    expect(screen.queryByText('+ Nuevo alumno')).not.toBeInTheDocument()
  })

  it('shows loading state while fetching', () => {
    listStudents.mockImplementation(() => new Promise(() => {}))
    renderWithRouter(<StudentsPage />)
    expect(screen.getByText('Cargando alumnos…')).toBeInTheDocument()
  })

  it('shows the spec REQ-22 empty-state copy when no students', async () => {
    renderWithRouter(<StudentsPage />)
    await waitFor(() => {
      expect(
        screen.getByText(
          'Todavía no tenés alumnos inscriptos a tus clases. Pronto vas a poder ver acá a quién se inscribió.',
        ),
      ).toBeInTheDocument()
    })
  })

  it('does NOT show an "Agregar alumno" button in empty state (REQ-21)', async () => {
    renderWithRouter(<StudentsPage />)
    await waitFor(() =>
      expect(
        screen.getByText(
          'Todavía no tenés alumnos inscriptos a tus clases. Pronto vas a poder ver acá a quién se inscribió.',
        ),
      ).toBeInTheDocument(),
    )
    expect(screen.queryByText('Agregar alumno')).not.toBeInTheDocument()
  })

  it('shows error state when API fails', async () => {
    listStudents.mockRejectedValue(new Error('Network error'))
    renderWithRouter(<StudentsPage />)
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
      expect(screen.getByText('Reintentar')).toBeInTheDocument()
    })
  })

  it('renders search input', () => {
    renderWithRouter(<StudentsPage />)
    expect(
      screen.getByPlaceholderText('Buscar por nombre, teléfono o email…'),
    ).toBeInTheDocument()
  })

  it('filters students by name when typing in search input', async () => {
    listStudents.mockResolvedValue([
      {
        id: 1,
        firstName: 'Pedro',
        lastName: 'García',
        phone: '+54 11 1234 5678',
        email: 'pedro@email.com',
        teacherId: 1,
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 2,
        firstName: 'María',
        lastName: 'López',
        phone: '+54 11 9876 5432',
        email: null,
        teacherId: 1,
        active: true,
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      },
    ])
    const user = userEvent.setup()
    renderWithRouter(<StudentsPage />)

    await waitFor(() => screen.getByText('Pedro García'))

    const searchInput = screen.getByPlaceholderText('Buscar por nombre, teléfono o email…')
    await user.type(searchInput, 'María')

    expect(screen.queryByText('Pedro García')).not.toBeInTheDocument()
    expect(screen.getByText('María López')).toBeInTheDocument()
  })
})
