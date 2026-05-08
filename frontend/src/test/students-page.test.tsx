import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
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

function LocationDisplay() {
  const location = useLocation()
  return <span data-testid="current-path">{location.pathname}</span>
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

  it('renders create button', () => {
    renderWithRouter(<StudentsPage />)
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

  it('opens ConfirmDialog when Desactivar is clicked from action menu', async () => {
    listStudents.mockResolvedValue([...mockStudents])
    const user = userEvent.setup()
    renderWithRouter(<StudentsPage />)

    await waitFor(() => screen.getByText('Pedro García'))

    // Open the action menu for the first student
    const menuButtons = screen.getAllByRole('button', { name: 'Más opciones' })
    await user.click(menuButtons[0])

    // Click "Desactivar" menu item
    const deactivateMenuItem = screen.getByRole('menuitem', { name: 'Desactivar' })
    await user.click(deactivateMenuItem)

    // ConfirmDialog should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Desactivar alumno')).toBeInTheDocument()
  })

  it('removes student from list after confirming deactivation in dialog', async () => {
    listStudents.mockResolvedValue([...mockStudents])
    const user = userEvent.setup()
    renderWithRouter(<StudentsPage />)

    await waitFor(() => screen.getByText('Pedro García'))

    // Open action menu for Pedro García (first student)
    const menuButtons = screen.getAllByRole('button', { name: 'Más opciones' })
    await user.click(menuButtons[0])

    // Click "Desactivar" in the menu
    await user.click(screen.getByRole('menuitem', { name: 'Desactivar' }))

    // Confirm in the dialog — there's a "Desactivar" confirm button
    await user.click(screen.getByRole('button', { name: 'Desactivar' }))

    await waitFor(() => {
      expect(screen.queryByText('Pedro García')).not.toBeInTheDocument()
    })
    expect(screen.getByText('María López')).toBeInTheDocument()
  })

  it('keeps student in list when Cancelar is clicked in dialog', async () => {
    listStudents.mockResolvedValue([...mockStudents])
    const user = userEvent.setup()
    renderWithRouter(<StudentsPage />)

    await waitFor(() => screen.getByText('Pedro García'))

    const menuButtons = screen.getAllByRole('button', { name: 'Más opciones' })
    await user.click(menuButtons[0])
    await user.click(screen.getByRole('menuitem', { name: 'Desactivar' }))

    // Cancel the dialog
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByText('Pedro García')).toBeInTheDocument()
    expect(deactivateStudent).not.toHaveBeenCalled()
  })

  it('shows inline error banner when deactivation fails', async () => {
    listStudents.mockResolvedValue([...mockStudents])
    deactivateStudent.mockRejectedValue(new Error('Server error'))
    const user = userEvent.setup()
    renderWithRouter(<StudentsPage />)

    await waitFor(() => screen.getByText('Pedro García'))

    const menuButtons = screen.getAllByRole('button', { name: 'Más opciones' })
    await user.click(menuButtons[0])
    await user.click(screen.getByRole('menuitem', { name: 'Desactivar' }))
    await user.click(screen.getByRole('button', { name: 'Desactivar' }))

    await waitFor(() => {
      expect(
        screen.getByText('No se pudo desactivar el alumno. Intenta de nuevo.')
      ).toBeInTheDocument()
    })
    // Verify no native alert was called
    expect(vi.isMockFunction(window.alert)).toBe(false)
  })

  it('navigates to edit page when Editar is clicked from action menu', async () => {
    listStudents.mockResolvedValue([...mockStudents])
    const user = userEvent.setup()
    renderWithRouter(
      <>
        <StudentsPage />
        <LocationDisplay />
      </>,
    )
    await waitFor(() => screen.getByText('Pedro García'))

    const menuButtons = screen.getAllByRole('button', { name: 'Más opciones' })
    await user.click(menuButtons[0])
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }))

    expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard/students/1/edit')
  })

  it('filters students by name when typing in search input', async () => {
    listStudents.mockResolvedValue([...mockStudents])
    const user = userEvent.setup()
    renderWithRouter(<StudentsPage />)

    await waitFor(() => screen.getByText('Pedro García'))

    const searchInput = screen.getByPlaceholderText('Buscar por nombre, teléfono o email…')
    await user.type(searchInput, 'María')

    expect(screen.queryByText('Pedro García')).not.toBeInTheDocument()
    expect(screen.getByText('María López')).toBeInTheDocument()
  })

  it('filters students by phone number', async () => {
    listStudents.mockResolvedValue([...mockStudents])
    const user = userEvent.setup()
    renderWithRouter(<StudentsPage />)

    await waitFor(() => screen.getByText('Pedro García'))

    const searchInput = screen.getByPlaceholderText('Buscar por nombre, teléfono o email…')
    await user.type(searchInput, '1234')

    expect(screen.getByText('Pedro García')).toBeInTheDocument()
    expect(screen.queryByText('María López')).not.toBeInTheDocument()
  })

  it('renders avatar initials for each student', async () => {
    listStudents.mockResolvedValue([...mockStudents])
    renderWithRouter(<StudentsPage />)

    await waitFor(() => screen.getByText('Pedro García'))

    // AvatarInitials renders initials PG and ML
    expect(screen.getByText('PG')).toBeInTheDocument()
    expect(screen.getByText('ML')).toBeInTheDocument()
  })
})
