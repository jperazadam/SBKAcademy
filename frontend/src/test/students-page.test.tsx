import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import StudentsPage from '../pages/students-page'

const { listStudents, deactivateStudent } = vi.hoisted(() => ({
  listStudents: vi.fn<() => Promise<never>>(),
  deactivateStudent: vi.fn<() => Promise<void>>(),
}))

vi.mock('../services/students-service', () => ({
  listStudents,
  deactivateStudent,
}))

const mockStudents = [
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
]

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

function resetServiceMocks() {
  listStudents.mockReset()
  deactivateStudent.mockReset()
  listStudents.mockResolvedValue([])
  deactivateStudent.mockResolvedValue()
}

describe('StudentsPage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    resetServiceMocks()
  })

  it('renders page title and create button', () => {
    renderWithRouter(<StudentsPage />)
    expect(screen.getByText('Alumnos')).toBeInTheDocument()
    expect(screen.getByText('Gestión de alumnos activos')).toBeInTheDocument()
    expect(screen.getByText('+ Nuevo alumno')).toBeInTheDocument()
  })

  it('shows loading state while fetching', () => {
    listStudents.mockImplementation(() => new Promise(() => {}))
    renderWithRouter(<StudentsPage />)
    expect(screen.getByText('Cargando alumnos…')).toBeInTheDocument()
  })

  it('renders student list once loaded', async () => {
    listStudents.mockResolvedValue([...mockStudents])
    renderWithRouter(<StudentsPage />)
    await waitFor(() => {
      expect(screen.getByText('Pedro García')).toBeInTheDocument()
      expect(screen.getByText('María López')).toBeInTheDocument()
    })
  })

  it('shows phone and email for each student', async () => {
    listStudents.mockResolvedValue([...mockStudents])
    renderWithRouter(<StudentsPage />)
    await waitFor(() => {
      expect(screen.getByText('+54 11 1234 5678')).toBeInTheDocument()
      expect(screen.getByText('pedro@email.com')).toBeInTheDocument()
      expect(screen.getByText('+54 11 9876 5432')).toBeInTheDocument()
    })
  })

  it('shows empty state when there are no students', async () => {
    renderWithRouter(<StudentsPage />)
    await waitFor(() => {
      expect(screen.getByText('Sin alumnos todavía')).toBeInTheDocument()
    })
    expect(screen.getByText('🎓')).toBeInTheDocument()
  })

  it('shows add student button in empty state', async () => {
    renderWithRouter(<StudentsPage />)
    await waitFor(() => {
      expect(screen.getByText('Agregar alumno')).toBeInTheDocument()
    })
  })

  it('shows error state when API fails', async () => {
    listStudents.mockRejectedValue(new Error('Network error'))
    renderWithRouter(<StudentsPage />)
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
      expect(screen.getByText('Reintentar')).toBeInTheDocument()
    })
  })

  it('removes student from list after successful deactivation', async () => {
    listStudents.mockResolvedValue([...mockStudents])
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    renderWithRouter(<StudentsPage />)
    await waitFor(() => screen.getByText('María López'))

    const deactivateBtn = screen.getAllByRole('button', { name: 'Desactivar' })[0]
    fireEvent.click(deactivateBtn)

    await waitFor(() => {
      expect(screen.queryByText('Pedro García')).not.toBeInTheDocument()
    })
    expect(screen.getByText('María López')).toBeInTheDocument()

    alertSpy.mockRestore()
  })

  it('does not deactivate if teacher cancels confirmation', async () => {
    listStudents.mockResolvedValue([...mockStudents])
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderWithRouter(<StudentsPage />)
    await waitFor(() => screen.getByText('Pedro García'))

    const deactivateBtn = screen.getAllByRole('button', { name: 'Desactivar' })[0]
    fireEvent.click(deactivateBtn)

    expect(screen.getByText('Pedro García')).toBeInTheDocument()
    expect(deactivateStudent).not.toHaveBeenCalled()
  })

  it('shows alert when deactivation fails', async () => {
    listStudents.mockResolvedValue([...mockStudents])
    deactivateStudent.mockRejectedValue(new Error('Server error'))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    renderWithRouter(<StudentsPage />)
    await waitFor(() => screen.getByText('Pedro García'))

    const deactivateBtn = screen.getAllByRole('button', { name: 'Desactivar' })[0]
    fireEvent.click(deactivateBtn)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('No se pudo desactivar el alumno. Intenta de nuevo.')
    })
    alertSpy.mockRestore()
  })

  it('navigates to edit page when edit button is clicked', async () => {
    // Spy on useNavigate
    const navigate = vi.fn()
    vi.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigate)

    listStudents.mockResolvedValue([...mockStudents])
    renderWithRouter(<StudentsPage />)
    await waitFor(() => screen.getByText('Pedro García'))

    const editBtn = screen.getAllByRole('button', { name: 'Editar' })[0]
    fireEvent.click(editBtn)

    expect(navigate).toHaveBeenCalledWith('/dashboard/students/1/edit')
  })
})