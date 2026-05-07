import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import StudentFormPage from '../pages/student-form-page'

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------
const mockStudent = {
  id: 1,
  firstName: 'Pedro',
  lastName: 'García',
  phone: '+54 11 1234 5678',
  email: 'pedro@email.com',
  teacherId: 1,
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

// ---------------------------------------------------------------------------
// Hoisted mocks — stable references used across all tests
// ---------------------------------------------------------------------------
const getStudentMock = vi.hoisted(() => vi.fn())
const createStudentMock = vi.hoisted(() => vi.fn())
const updateStudentMock = vi.hoisted(() => vi.fn())

vi.mock('../services/students-service', () => ({
  getStudent: getStudentMock,
  createStudent: createStudentMock,
  updateStudent: updateStudentMock,
}))

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
function renderWithRouter(ui: React.ReactElement, initialEntry = '/dashboard/students/new') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/dashboard/students/new" element={ui} />
        <Route path="/dashboard/students/:studentId/edit" element={ui} />
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
describe('StudentFormPage — Create mode', () => {
  afterEach(() => { cleanup() })

  beforeEach(() => {
    // Reset all mocks before each test to avoid cross-test pollution
    getStudentMock.mockReset()
    createStudentMock.mockReset()
    updateStudentMock.mockReset()
    // Default: create succeeds
    createStudentMock.mockResolvedValue(mockStudent)
  })

  it('renders the create page title and all form fields', () => {
    renderWithRouter(<StudentFormPage mode="create" />)
    expect(screen.getByText('Nuevo alumno')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Apellidos/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Teléfono/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Correo electrónico/)).toBeInTheDocument()
  })

  it('shows submit button with correct label', () => {
    renderWithRouter(<StudentFormPage mode="create" />)
    expect(getSubmitButton('Crear alumno')).toBeInTheDocument()
  })

  it('shows error when submitting with empty firstName', async () => {
    renderWithRouter(<StudentFormPage mode="create" />)

    fireEvent.change(screen.getByLabelText(/Apellidos/), { target: { value: 'García' } })
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '+54 11 1234 5678' } })
    fireEvent.click(getSubmitButton('Crear alumno')!)

    await waitFor(() => {
      expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
    })
    expect(createStudentMock).not.toHaveBeenCalled()
  })

  it('shows error when submitting with empty lastName', async () => {
    renderWithRouter(<StudentFormPage mode="create" />)

    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Pedro' } })
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '+54 11 1234 5678' } })
    fireEvent.click(getSubmitButton('Crear alumno')!)

    await waitFor(() => {
      expect(screen.getByText('Los apellidos son obligatorios.')).toBeInTheDocument()
    })
    expect(createStudentMock).not.toHaveBeenCalled()
  })

  it('shows error when submitting with empty phone', async () => {
    renderWithRouter(<StudentFormPage mode="create" />)

    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Pedro' } })
    fireEvent.change(screen.getByLabelText(/Apellidos/), { target: { value: 'García' } })
    fireEvent.click(getSubmitButton('Crear alumno')!)

    await waitFor(() => {
      expect(screen.getByText('El teléfono es obligatorio.')).toBeInTheDocument()
    })
    expect(createStudentMock).not.toHaveBeenCalled()
  })

  it('clears field error when user types after an error', async () => {
    renderWithRouter(<StudentFormPage mode="create" />)

    fireEvent.click(getSubmitButton('Crear alumno')!)
    await waitFor(() => screen.getByText('El nombre es obligatorio.'))

    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Pedro' } })
    expect(screen.queryByText('El nombre es obligatorio.')).not.toBeInTheDocument()
  })

  it('accepts empty email (optional field)', async () => {
    renderWithRouter(<StudentFormPage mode="create" />)

    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Pedro' } })
    fireEvent.change(screen.getByLabelText(/Apellidos/), { target: { value: 'García' } })
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '+54 11 1234 5678' } })

    fireEvent.click(getSubmitButton('Crear alumno')!)

    await waitFor(() => {
      expect(createStudentMock).toHaveBeenCalledWith(
        expect.objectContaining({ email: undefined })
      )
    })
  })

  it('shows error for invalid email format', async () => {
    renderWithRouter(<StudentFormPage mode="create" />)

    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Pedro' } })
    fireEvent.change(screen.getByLabelText(/Apellidos/), { target: { value: 'García' } })
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '+54 11 1234 5678' } })
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: 'not-an-email' } })

    fireEvent.click(getSubmitButton('Crear alumno')!)

    await waitFor(() => {
      expect(screen.getByText('El correo electrónico no es válido.')).toBeInTheDocument()
    })
    expect(createStudentMock).not.toHaveBeenCalled()
  })

  it('accepts valid email format', async () => {
    renderWithRouter(<StudentFormPage mode="create" />)

    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Pedro' } })
    fireEvent.change(screen.getByLabelText(/Apellidos/), { target: { value: 'García' } })
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '+54 11 1234 5678' } })
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: 'pedro@email.com' } })

    fireEvent.click(getSubmitButton('Crear alumno')!)

    await waitFor(() => {
      expect(createStudentMock).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'pedro@email.com' })
      )
    })
  })

  it('calls createStudent with trimmed fields on success', async () => {
    renderWithRouter(<StudentFormPage mode="create" />)

    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: '  Pedro  ' } })
    fireEvent.change(screen.getByLabelText(/Apellidos/), { target: { value: ' García ' } })
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '+54 11 1234 5678' } })
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: 'pedro@email.com' } })

    fireEvent.click(getSubmitButton('Crear alumno')!)

    await waitFor(() => {
      expect(createStudentMock).toHaveBeenCalledWith({
        firstName: 'Pedro',
        lastName: 'García',
        phone: '+54 11 1234 5678',
        email: 'pedro@email.com',
      })
    })
  })
})

// ---------------------------------------------------------------------------
// Edit mode — uses serviceOverrides so mocks are injected directly into
// the component without relying on module mock replacement
// ---------------------------------------------------------------------------
describe('StudentFormPage — Edit mode', () => {
  afterEach(() => { cleanup() })

  beforeEach(() => {
    getStudentMock.mockReset()
    createStudentMock.mockReset()
    updateStudentMock.mockReset()
  })

  it('renders with edit title and prefills fields from API', async () => {
    getStudentMock.mockReset().mockResolvedValue({ ...mockStudent })
    renderWithRouter(
      <StudentFormPage
        mode="edit"
        serviceOverrides={{
          getStudent: getStudentMock,
          createStudent: createStudentMock,
          updateStudent: updateStudentMock,
        }}
      />,
      '/dashboard/students/1/edit'
    )

    await waitFor(() => {
      expect(screen.getByText('Editar alumno')).toBeInTheDocument()
    })
    const firstNameInput = await screen.findByDisplayValue('Pedro')
    expect(firstNameInput).toBeInTheDocument()
    expect(screen.getByDisplayValue('García')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+54 11 1234 5678')).toBeInTheDocument()
    expect(screen.getByDisplayValue('pedro@email.com')).toBeInTheDocument()
  })

  it('shows loading state while fetching student', () => {
    getStudentMock.mockReset().mockImplementation(() => new Promise(() => {}))
    renderWithRouter(
      <StudentFormPage
        mode="edit"
        serviceOverrides={{
          getStudent: getStudentMock,
          createStudent: createStudentMock,
          updateStudent: updateStudentMock,
        }}
      />,
      '/dashboard/students/1/edit'
    )
    expect(screen.getByText('Cargando datos del alumno…')).toBeInTheDocument()
  })

  it('shows error and back link when student cannot be loaded', async () => {
    getStudentMock.mockReset().mockRejectedValue(new Error('Not found'))
    renderWithRouter(
      <StudentFormPage
        mode="edit"
        serviceOverrides={{
          getStudent: getStudentMock,
          createStudent: createStudentMock,
          updateStudent: updateStudentMock,
        }}
      />,
      '/dashboard/students/1/edit'
    )

    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar el alumno. Intenta de nuevo.')).toBeInTheDocument()
      expect(screen.getByText('Volver a la lista')).toBeInTheDocument()
    })
  })

  it('calls updateStudent with all fields on save', async () => {
    getStudentMock.mockReset().mockResolvedValue({ ...mockStudent })
    updateStudentMock.mockReset().mockResolvedValue({ ...mockStudent })
    renderWithRouter(
      <StudentFormPage
        mode="edit"
        serviceOverrides={{
          getStudent: getStudentMock,
          createStudent: createStudentMock,
          updateStudent: updateStudentMock,
        }}
      />,
      '/dashboard/students/1/edit'
    )

    const firstNameInput = await screen.findByDisplayValue('Pedro')
    fireEvent.change(firstNameInput, { target: { value: 'Pedro Miguel' } })
    fireEvent.click(getSubmitButton('Guardar cambios')!)

    await waitFor(() => {
      expect(updateStudentMock).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ firstName: 'Pedro Miguel' })
      )
    })
  })

  it('shows validation errors in edit mode same as create', async () => {
    getStudentMock.mockReset().mockResolvedValue({ ...mockStudent })
    renderWithRouter(
      <StudentFormPage
        mode="edit"
        serviceOverrides={{
          getStudent: getStudentMock,
          createStudent: createStudentMock,
          updateStudent: updateStudentMock,
        }}
      />,
      '/dashboard/students/1/edit'
    )

    const firstNameInput = await screen.findByDisplayValue('Pedro')
    fireEvent.change(firstNameInput, { target: { value: '' } })
    fireEvent.click(getSubmitButton('Guardar cambios')!)

    await waitFor(() => {
      expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
    })
    expect(updateStudentMock).not.toHaveBeenCalled()
  })
})