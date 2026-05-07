import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import ClassesPage from '../pages/classes-page'

const { listClasses, deactivateClass } = vi.hoisted(() => ({
  listClasses: vi.fn<() => Promise<never>>(),
  deactivateClass: vi.fn<() => Promise<void>>(),
}))

vi.mock('../services/classes-service', () => ({
  listClasses,
  deactivateClass,
}))

const mockClasses = [
  {
    id: 1,
    name: null,
    type: 'SALSA',
    level: 'MEDIO',
    active: true,
    displayName: 'Salsa medio',
    teacherId: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    schedules: [
      { id: 1, dayOfWeek: 1, startTime: '18:00', endTime: '19:30', classId: 1 },
      { id: 2, dayOfWeek: 3, startTime: '18:00', endTime: '19:30', classId: 1 },
    ],
  },
  {
    id: 2,
    name: 'Bachata para avanzados',
    type: 'BACHATA',
    level: 'AVANZADO',
    active: true,
    displayName: 'Bachata para avanzados',
    teacherId: 1,
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    schedules: [
      { id: 3, dayOfWeek: 5, startTime: '20:00', endTime: '21:30', classId: 2 },
    ],
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
  listClasses.mockReset()
  deactivateClass.mockReset()
  listClasses.mockResolvedValue([])
  deactivateClass.mockResolvedValue()
}

describe('ClassesPage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    resetServiceMocks()
  })

  it('renders page title and create button', () => {
    renderWithRouter(<ClassesPage />)
    expect(screen.getByText('Clases')).toBeInTheDocument()
    expect(screen.getByText('Gestión de clases activas')).toBeInTheDocument()
    expect(screen.getByText('+ Nueva clase')).toBeInTheDocument()
  })

  it('shows loading state while fetching', () => {
    listClasses.mockImplementation(() => new Promise(() => {}))
    renderWithRouter(<ClassesPage />)
    expect(screen.getByText('Cargando clases…')).toBeInTheDocument()
  })

  it('renders class list once loaded', async () => {
    listClasses.mockResolvedValue([...mockClasses])
    renderWithRouter(<ClassesPage />)
    await waitFor(() => {
      expect(screen.getByText('Salsa medio')).toBeInTheDocument()
      expect(screen.getByText('Bachata para avanzados')).toBeInTheDocument()
    })
  })

  it('shows custom name when present', async () => {
    listClasses.mockResolvedValue([...mockClasses])
    renderWithRouter(<ClassesPage />)
    await waitFor(() => {
      expect(screen.getByText('Bachata para avanzados')).toBeInTheDocument()
      // The custom name should appear, not just the displayName
    })
  })

  it('shows schedule information for each class', async () => {
    listClasses.mockResolvedValue([...mockClasses])
    renderWithRouter(<ClassesPage />)
    await waitFor(() => {
      // Salsa medio has Mon 18:00–19:30, Wed 18:00–19:30
      expect(screen.getByText(/Lun 18:00–19:30/)).toBeInTheDocument()
      expect(screen.getByText(/Mié 18:00–19:30/)).toBeInTheDocument()
      // Bachata advanced has Fri 20:00–21:30
      expect(screen.getByText(/Vie 20:00–21:30/)).toBeInTheDocument()
    })
  })

  it('shows empty state when there are no classes', async () => {
    renderWithRouter(<ClassesPage />)
    await waitFor(() => {
      expect(screen.getByText('Sin clases todavía')).toBeInTheDocument()
    })
    expect(screen.getByText('💃')).toBeInTheDocument()
  })

  it('shows add class button in empty state', async () => {
    renderWithRouter(<ClassesPage />)
    await waitFor(() => {
      expect(screen.getByText('Agregar clase')).toBeInTheDocument()
    })
  })

  it('shows error state when API fails', async () => {
    listClasses.mockRejectedValue(new Error('Network error'))
    renderWithRouter(<ClassesPage />)
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
      expect(screen.getByText('Reintentar')).toBeInTheDocument()
    })
  })

  it('removes class from list after successful deactivation', async () => {
    listClasses.mockResolvedValue([...mockClasses])
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    renderWithRouter(<ClassesPage />)
    await waitFor(() => screen.getByText('Salsa medio'))

    const deactivateBtn = screen.getAllByRole('button', { name: 'Desactivar' })[0]
    fireEvent.click(deactivateBtn)

    await waitFor(() => {
      expect(screen.queryByText('Salsa medio')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Bachata para avanzados')).toBeInTheDocument()

    alertSpy.mockRestore()
  })

  it('does not deactivate if teacher cancels confirmation', async () => {
    listClasses.mockResolvedValue([...mockClasses])
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderWithRouter(<ClassesPage />)
    await waitFor(() => screen.getByText('Salsa medio'))

    const deactivateBtn = screen.getAllByRole('button', { name: 'Desactivar' })[0]
    fireEvent.click(deactivateBtn)

    expect(screen.getByText('Salsa medio')).toBeInTheDocument()
    expect(deactivateClass).not.toHaveBeenCalled()
  })

  it('shows alert when deactivation fails', async () => {
    listClasses.mockResolvedValue([...mockClasses])
    deactivateClass.mockRejectedValue(new Error('Server error'))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    renderWithRouter(<ClassesPage />)
    await waitFor(() => screen.getByText('Salsa medio'))

    const deactivateBtn = screen.getAllByRole('button', { name: 'Desactivar' })[0]
    fireEvent.click(deactivateBtn)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('No se pudo desactivar la clase. Intenta de nuevo.')
    })
    alertSpy.mockRestore()
  })

  it('navigates to edit page when edit button is clicked', async () => {
    listClasses.mockResolvedValue([...mockClasses])
    renderWithRouter(
      <>
        <ClassesPage />
        <LocationDisplay />
      </>,
    )
    await waitFor(() => screen.getByText('Salsa medio'))

    const editBtn = screen.getAllByRole('button', { name: 'Editar' })[0]
    fireEvent.click(editBtn)

    expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard/classes/1/edit')
  })
})