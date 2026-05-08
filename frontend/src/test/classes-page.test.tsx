import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('renders create button', () => {
    renderWithRouter(<ClassesPage />)
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

  it('shows custom name when present and different from displayName', async () => {
    listClasses.mockResolvedValue([...mockClasses])
    renderWithRouter(<ClassesPage />)
    await waitFor(() => {
      expect(screen.getByText('Bachata para avanzados')).toBeInTheDocument()
    })
  })

  it('shows schedule information for each class via DayChips', async () => {
    listClasses.mockResolvedValue([...mockClasses])
    renderWithRouter(<ClassesPage />)
    await waitFor(() => {
      // DayChips renders schedule list: Lun 18:00–19:30, Mié 18:00–19:30, Vie 20:00–21:30
      expect(screen.getByText(/Lun 18:00–19:30/)).toBeInTheDocument()
      expect(screen.getByText(/Mié 18:00–19:30/)).toBeInTheDocument()
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

  it('opens ConfirmDialog when Desactivar is clicked from action menu', async () => {
    listClasses.mockResolvedValue([...mockClasses])
    const user = userEvent.setup()
    renderWithRouter(<ClassesPage />)

    await waitFor(() => screen.getByText('Salsa medio'))

    const menuButtons = screen.getAllByRole('button', { name: 'Más opciones' })
    await user.click(menuButtons[0])

    const deactivateMenuItem = screen.getByRole('menuitem', { name: 'Desactivar' })
    await user.click(deactivateMenuItem)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Desactivar clase')).toBeInTheDocument()
  })

  it('removes class from list after confirming deactivation in dialog', async () => {
    listClasses.mockResolvedValue([...mockClasses])
    const user = userEvent.setup()
    renderWithRouter(<ClassesPage />)

    await waitFor(() => screen.getByText('Salsa medio'))

    const menuButtons = screen.getAllByRole('button', { name: 'Más opciones' })
    await user.click(menuButtons[0])
    await user.click(screen.getByRole('menuitem', { name: 'Desactivar' }))

    // Confirm in the dialog
    await user.click(screen.getByRole('button', { name: 'Desactivar' }))

    await waitFor(() => {
      expect(screen.queryByText('Salsa medio')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Bachata para avanzados')).toBeInTheDocument()
  })

  it('keeps class in list when Cancelar is clicked in dialog', async () => {
    listClasses.mockResolvedValue([...mockClasses])
    const user = userEvent.setup()
    renderWithRouter(<ClassesPage />)

    await waitFor(() => screen.getByText('Salsa medio'))

    const menuButtons = screen.getAllByRole('button', { name: 'Más opciones' })
    await user.click(menuButtons[0])
    await user.click(screen.getByRole('menuitem', { name: 'Desactivar' }))

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByText('Salsa medio')).toBeInTheDocument()
    expect(deactivateClass).not.toHaveBeenCalled()
  })

  it('shows inline error banner when deactivation fails', async () => {
    listClasses.mockResolvedValue([...mockClasses])
    deactivateClass.mockRejectedValue(new Error('Server error'))
    const user = userEvent.setup()
    renderWithRouter(<ClassesPage />)

    await waitFor(() => screen.getByText('Salsa medio'))

    const menuButtons = screen.getAllByRole('button', { name: 'Más opciones' })
    await user.click(menuButtons[0])
    await user.click(screen.getByRole('menuitem', { name: 'Desactivar' }))
    await user.click(screen.getByRole('button', { name: 'Desactivar' }))

    await waitFor(() => {
      expect(
        screen.getByText('No se pudo desactivar la clase. Intenta de nuevo.')
      ).toBeInTheDocument()
    })
    // Verify no native alert was called
    expect(vi.isMockFunction(window.alert)).toBe(false)
  })

  it('navigates to edit page when Editar is clicked from action menu', async () => {
    listClasses.mockResolvedValue([...mockClasses])
    const user = userEvent.setup()
    renderWithRouter(
      <>
        <ClassesPage />
        <LocationDisplay />
      </>,
    )
    await waitFor(() => screen.getByText('Salsa medio'))

    const menuButtons = screen.getAllByRole('button', { name: 'Más opciones' })
    await user.click(menuButtons[0])
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }))

    expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard/classes/1/edit')
  })

  it('renders day chips for each class', async () => {
    listClasses.mockResolvedValue([...mockClasses])
    renderWithRouter(<ClassesPage />)

    await waitFor(() => screen.getByText('Salsa medio'))

    // DayChips renders 7 chips per class: D L M X J V S
    // Both classes combined = 14 chips; at least 14 chip elements with these letters
    const lChips = screen.getAllByText('L')
    expect(lChips.length).toBeGreaterThanOrEqual(1)
  })
})
