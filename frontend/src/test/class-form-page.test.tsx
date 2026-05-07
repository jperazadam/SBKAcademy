import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ClassFormPage from '../pages/class-form-page'

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------
const mockClass = {
  id: 1,
  name: 'Bachata para avanzados',
  type: 'BACHATA' as const,
  level: 'AVANZADO' as const,
  active: true,
  displayName: 'Bachata para avanzados',
  teacherId: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  schedules: [
    { id: 1, dayOfWeek: 5, startTime: '20:00', endTime: '21:30', classId: 1 },
  ],
}

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const getClassMock = vi.hoisted(() => vi.fn())
const createClassMock = vi.hoisted(() => vi.fn())
const updateClassMock = vi.hoisted(() => vi.fn())

vi.mock('../services/classes-service', () => ({
  getClass: getClassMock,
  createClass: createClassMock,
  updateClass: updateClassMock,
}))

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
function renderWithRouter(ui: React.ReactElement, initialEntry = '/dashboard/classes/new') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/dashboard/classes/new" element={ui} />
        <Route path="/dashboard/classes/:classId/edit" element={ui} />
      </Routes>
    </MemoryRouter>
  )
}

function getSubmitButton(label: string) {
  const buttons = screen.getAllByRole('button')
  return buttons.find((b) => b.type === 'submit' && b.textContent === label)
}

// ---------------------------------------------------------------------------
// Create mode
// ---------------------------------------------------------------------------
describe('ClassFormPage — Create mode', () => {
  afterEach(() => { cleanup() })

  beforeEach(() => {
    getClassMock.mockReset()
    createClassMock.mockReset()
    updateClassMock.mockReset()
    createClassMock.mockResolvedValue(mockClass)
  })

  it('renders the create page title and all form fields', () => {
    renderWithRouter(<ClassFormPage mode="create" />)
    expect(screen.getByText('Nueva clase')).toBeInTheDocument()
    expect(screen.getByLabelText(/Tipo de baile/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Nivel/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Nombre personalizado/)).toBeInTheDocument()
    expect(screen.getByText('Horarios')).toBeInTheDocument()
  })

  it('shows submit button with correct label', () => {
    renderWithRouter(<ClassFormPage mode="create" />)
    expect(getSubmitButton('Crear clase')).toBeInTheDocument()
  })

  it('shows error when submitting without type', async () => {
    renderWithRouter(<ClassFormPage mode="create" />)

    fireEvent.change(screen.getByLabelText(/Nivel/).closest('select')!, { target: { value: 'MEDIO' } })
    // fill at least one schedule
    fireEvent.change(screen.getByLabelText(/Inicio/).closest('input')!, { target: { value: '18:00' } })
    fireEvent.change(screen.getByLabelText(/Fin/).closest('input')!, { target: { value: '19:30' } })

    fireEvent.click(getSubmitButton('Crear clase')!)

    await waitFor(() => {
      expect(screen.getByText('El tipo de baile es obligatorio.')).toBeInTheDocument()
    })
    expect(createClassMock).not.toHaveBeenCalled()
  })

  it('shows error when submitting without level', async () => {
    renderWithRouter(<ClassFormPage mode="create" />)

    fireEvent.change(screen.getByLabelText(/Tipo de baile/).closest('select')!, { target: { value: 'SALSA' } })
    fireEvent.change(screen.getByLabelText(/Inicio/).closest('input')!, { target: { value: '18:00' } })
    fireEvent.change(screen.getByLabelText(/Fin/).closest('input')!, { target: { value: '19:30' } })

    fireEvent.click(getSubmitButton('Crear clase')!)

    await waitFor(() => {
      expect(screen.getByText('El nivel es obligatorio.')).toBeInTheDocument()
    })
    expect(createClassMock).not.toHaveBeenCalled()
  })

  it('shows error when start time is missing', async () => {
    renderWithRouter(<ClassFormPage mode="create" />)

    fireEvent.change(screen.getByLabelText(/Tipo de baile/).closest('select')!, { target: { value: 'SALSA' } })
    fireEvent.change(screen.getByLabelText(/Nivel/).closest('select')!, { target: { value: 'INICIO' } })
    fireEvent.change(screen.getByLabelText(/Fin/).closest('input')!, { target: { value: '19:30' } })

    fireEvent.click(getSubmitButton('Crear clase')!)

    await waitFor(() => {
      expect(screen.getByText(/Usa formato HH:mm/)).toBeInTheDocument()
    })
    expect(createClassMock).not.toHaveBeenCalled()
  })

  it('shows error when end time is not after start time', async () => {
    renderWithRouter(<ClassFormPage mode="create" />)

    fireEvent.change(screen.getByLabelText(/Tipo de baile/).closest('select')!, { target: { value: 'SALSA' } })
    fireEvent.change(screen.getByLabelText(/Nivel/).closest('select')!, { target: { value: 'INICIO' } })
    fireEvent.change(screen.getByLabelText(/Inicio/).closest('input')!, { target: { value: '19:00' } })
    fireEvent.change(screen.getByLabelText(/Fin/).closest('input')!, { target: { value: '18:00' } })

    fireEvent.click(getSubmitButton('Crear clase')!)

    await waitFor(() => {
      expect(screen.getByText('La hora de fin debe ser posterior a la de inicio.')).toBeInTheDocument()
    })
    expect(createClassMock).not.toHaveBeenCalled()
  })

  it('calls createClass with correct data on success', async () => {
    renderWithRouter(<ClassFormPage mode="create" />)

    fireEvent.change(screen.getByLabelText(/Tipo de baile/).closest('select')!, { target: { value: 'SALSA' } })
    fireEvent.change(screen.getByLabelText(/Nivel/).closest('select')!, { target: { value: 'MEDIO' } })
    // Default schedule already has dayOfWeek=1, just set times
    const startInput = screen.getAllByLabelText(/Inicio/)[0].closest('input') as HTMLInputElement
    const endInput = screen.getAllByLabelText(/Fin/)[0].closest('input') as HTMLInputElement
    fireEvent.change(startInput, { target: { value: '18:00' } })
    fireEvent.change(endInput, { target: { value: '19:30' } })

    fireEvent.click(getSubmitButton('Crear clase')!)

    await waitFor(() => {
      expect(createClassMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SALSA',
          level: 'MEDIO',
          schedules: expect.arrayContaining([
            expect.objectContaining({ dayOfWeek: 1, startTime: '18:00', endTime: '19:30' }),
          ]),
        })
      )
    })
  })

  it('sends name field only when custom name is provided', async () => {
    renderWithRouter(<ClassFormPage mode="create" />)

    fireEvent.change(screen.getByLabelText(/Tipo de baile/).closest('select')!, { target: { value: 'BACHATA' } })
    fireEvent.change(screen.getByLabelText(/Nivel/).closest('select')!, { target: { value: 'AVANZADO' } })
    fireEvent.change(screen.getByLabelText(/Nombre personalizado/), { target: { value: 'Mi clase especial' } })
    const startInput = screen.getAllByLabelText(/Inicio/)[0].closest('input') as HTMLInputElement
    const endInput = screen.getAllByLabelText(/Fin/)[0].closest('input') as HTMLInputElement
    fireEvent.change(startInput, { target: { value: '20:00' } })
    fireEvent.change(endInput, { target: { value: '21:30' } })

    fireEvent.click(getSubmitButton('Crear clase')!)

    await waitFor(() => {
      expect(createClassMock).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Mi clase especial' })
      )
    })
  })

  it('can add and fill multiple schedule entries', async () => {
    renderWithRouter(<ClassFormPage mode="create" />)

    fireEvent.change(screen.getByLabelText(/Tipo de baile/).closest('select')!, { target: { value: 'SALSA' } })
    fireEvent.change(screen.getByLabelText(/Nivel/).closest('select')!, { target: { value: 'INICIO' } })

    // Add another schedule entry
    fireEvent.click(screen.getByText('+ Agregar horario'))

    const starts = screen.getAllByLabelText(/Inicio/)
    const ends = screen.getAllByLabelText(/Fin/)
    const days = screen.getAllByLabelText(/Día/)

    // First entry: Monday 18:00-19:30
    fireEvent.change(days[0].closest('select')!, { target: { value: '1' } })
    fireEvent.change(starts[0], { target: { value: '18:00' } })
    fireEvent.change(ends[0], { target: { value: '19:30' } })

    // Second entry: Wednesday 20:00-21:00
    fireEvent.change(days[1].closest('select')!, { target: { value: '3' } })
    fireEvent.change(starts[1], { target: { value: '20:00' } })
    fireEvent.change(ends[1], { target: { value: '21:00' } })

    fireEvent.click(getSubmitButton('Crear clase')!)

    await waitFor(() => {
      expect(createClassMock).toHaveBeenCalledWith(
        expect.objectContaining({
          schedules: expect.arrayContaining([
            expect.objectContaining({ dayOfWeek: 1, startTime: '18:00', endTime: '19:30' }),
            expect.objectContaining({ dayOfWeek: 3, startTime: '20:00', endTime: '21:00' }),
          ]),
        })
      )
    })
  })
})

// ---------------------------------------------------------------------------
// Edit mode — uses serviceOverrides to inject mocks directly
// ---------------------------------------------------------------------------
describe('ClassFormPage — Edit mode', () => {
  afterEach(() => { cleanup() })

  beforeEach(() => {
    getClassMock.mockReset()
    createClassMock.mockReset()
    updateClassMock.mockReset()
  })

  it('renders with edit title and prefills fields from API', async () => {
    getClassMock.mockReset().mockResolvedValue({ ...mockClass })
    renderWithRouter(
      <ClassFormPage
        mode="edit"
        serviceOverrides={{
          getClass: getClassMock,
          createClass: createClassMock,
          updateClass: updateClassMock,
        }}
      />,
      '/dashboard/classes/1/edit'
    )

    await waitFor(() => {
      expect(screen.getByText('Editar clase')).toBeInTheDocument()
    })
    const typeSelect = screen.getByLabelText(/Tipo de baile/).closest('select') as HTMLSelectElement
    expect(typeSelect.value).toBe('BACHATA')
    const levelSelect = screen.getByLabelText(/Nivel/).closest('select') as HTMLSelectElement
    expect(levelSelect.value).toBe('AVANZADO')
    expect(screen.getByLabelText(/Nombre personalizado/)).toHaveValue('Bachata para avanzados')
  })

  it('shows loading state while fetching class', () => {
    getClassMock.mockReset().mockImplementation(() => new Promise(() => {}))
    renderWithRouter(
      <ClassFormPage
        mode="edit"
        serviceOverrides={{
          getClass: getClassMock,
          createClass: createClassMock,
          updateClass: updateClassMock,
        }}
      />,
      '/dashboard/classes/1/edit'
    )
    expect(screen.getByText('Cargando datos de la clase…')).toBeInTheDocument()
  })

  it('shows error and back link when class cannot be loaded', async () => {
    getClassMock.mockReset().mockRejectedValue(new Error('Not found'))
    renderWithRouter(
      <ClassFormPage
        mode="edit"
        serviceOverrides={{
          getClass: getClassMock,
          createClass: createClassMock,
          updateClass: updateClassMock,
        }}
      />,
      '/dashboard/classes/1/edit'
    )

    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar la clase. Intenta de nuevo.')).toBeInTheDocument()
      expect(screen.getByText('Volver a la lista')).toBeInTheDocument()
    })
  })

  it('calls updateClass with all fields on save', async () => {
    getClassMock.mockReset().mockResolvedValue({ ...mockClass })
    updateClassMock.mockReset().mockResolvedValue({ ...mockClass })
    renderWithRouter(
      <ClassFormPage
        mode="edit"
        serviceOverrides={{
          getClass: getClassMock,
          createClass: createClassMock,
          updateClass: updateClassMock,
        }}
      />,
      '/dashboard/classes/1/edit'
    )

    await waitFor(() => screen.getByText('Editar clase'))

    const nameInput = screen.getByLabelText(/Nombre personalizado/)
    fireEvent.change(nameInput, { target: { value: 'Bachata actualizada' } })

    const submitBtn = screen.getAllByRole('button').find((b) => b.type === 'submit' && b.textContent === 'Guardar cambios')!
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(updateClassMock).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: 'Bachata actualizada' })
      )
    })
  })

  it('shows validation errors in edit mode same as create', async () => {
    getClassMock.mockReset().mockResolvedValue({ ...mockClass })
    renderWithRouter(
      <ClassFormPage
        mode="edit"
        serviceOverrides={{
          getClass: getClassMock,
          createClass: createClassMock,
          updateClass: updateClassMock,
        }}
      />,
      '/dashboard/classes/1/edit'
    )

    await waitFor(() => screen.getByText('Editar clase'))

    // Clear the type to trigger validation
    const typeSelect = screen.getByLabelText(/Tipo de baile/).closest('select') as HTMLSelectElement
    fireEvent.change(typeSelect, { target: { value: '' } })

    const submitBtn = screen.getAllByRole('button').find((b) => b.type === 'submit' && b.textContent === 'Guardar cambios')!
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('El tipo de baile es obligatorio.')).toBeInTheDocument()
    })
    expect(updateClassMock).not.toHaveBeenCalled()
  })
})