import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Student, CreateStudentInput, UpdateStudentInput } from '../types/student'
import { getStudent, createStudent, updateStudent } from '../services/students-service'

interface StudentFormPageProps {
  mode: 'create' | 'edit'
  serviceOverrides?: {
    getStudent?: typeof getStudent
    createStudent?: typeof createStudent
    updateStudent?: typeof updateStudent
  }
}

interface FormErrors {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
}

/**
 * Shared create/edit form for students.
 * - In create mode, submits to POST /students
 * - In edit mode, loads existing student then submits PUT /students/:id
 * - Validates required fields and optional email before submit.
 * - UI text is in Spanish; code identifiers in English.
 *
 * @param serviceOverrides — injectable for tests (defaults to real service)
 */
function StudentFormPage({
  mode,
  serviceOverrides,
}: {
  mode: 'create' | 'edit'
  serviceOverrides?: {
    getStudent?: typeof getStudent
    createStudent?: typeof createStudent
    updateStudent?: typeof updateStudent
  }
}) {
  const navigate = useNavigate()
  const { studentId } = useParams<{ studentId: string }>()

  const sv = serviceOverrides ?? {}
  const getStudentFn = sv.getStudent ?? getStudent
  const createStudentFn = sv.createStudent ?? createStudent
  const updateStudentFn = sv.updateStudent ?? updateStudent

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(mode === 'edit')
  const [loadError, setLoadError] = useState<string | null>(null)

  // In edit mode, load the existing student
  useEffect(() => {
    if (mode === 'edit' && studentId) {
      loadStudent(Number(studentId))
    }
  }, [mode, studentId])

  async function loadStudent(id: number) {
    setLoading(true)
    setLoadError(null)
    try {
      const student = await getStudentFn(id)
      setFirstName(student.firstName)
      setLastName(student.lastName)
      setPhone(student.phone)
      setEmail(student.email ?? '')
    } catch {
      setLoadError('No se pudo cargar el alumno. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedPhone = phone.trim()
    const trimmedEmail = email.trim()

    if (!trimmedFirst) {
      newErrors.firstName = 'El nombre es obligatorio.'
    }
    if (!trimmedLast) {
      newErrors.lastName = 'Los apellidos son obligatorios.'
    }
    if (!trimmedPhone) {
      newErrors.phone = 'El teléfono es obligatorio.'
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'El correo electrónico no es válido.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      if (mode === 'create') {
        const input: CreateStudentInput = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
        }
        await createStudentFn(input)
      } else {
        const input: UpdateStudentInput = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
        }
        await updateStudentFn(Number(studentId), input)
      }
      navigate('/dashboard/students')
    } catch {
      alert('Ocurrió un error al guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Loading state while fetching student in edit mode
  if (mode === 'edit' && loading && !firstName && !loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-gray-400">Cargando datos del alumno…</p>
      </div>
    )
  }

  // Load error in edit mode
  if (mode === 'edit' && loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium mb-3">{loadError}</p>
          <button
            onClick={() => navigate('/dashboard/students')}
            className="text-red-600 hover:text-red-800 underline text-sm"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Nuevo alumno' : 'Editar alumno'}
          </h1>
          <button
            onClick={() => navigate('/dashboard/students')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Cancelar
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="firstName" className="text-sm font-semibold text-foreground">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }))
                }}
                className={`border rounded-lg px-3 py-2.5 text-base outline-none transition-all duration-150
                  focus-visible:ring-2 focus-visible:ring-primary-600/20
                  ${errors.firstName ? 'border-red-400 bg-red-50' : 'border-gray-300 focus-visible:border-primary-600'}`}
                placeholder="Pedro"
              />
              {errors.firstName && (
                <p role="alert" className="text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            {/* Apellidos */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lastName" className="text-sm font-semibold text-foreground">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                  if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }))
                }}
                className={`border rounded-lg px-3 py-2.5 text-base outline-none transition-all duration-150
                  focus-visible:ring-2 focus-visible:ring-primary-600/20
                  ${errors.lastName ? 'border-red-400 bg-red-50' : 'border-gray-300 focus-visible:border-primary-600'}`}
                placeholder="García López"
              />
              {errors.lastName && (
                <p role="alert" className="text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-sm font-semibold text-foreground">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
                }}
                className={`border rounded-lg px-3 py-2.5 text-base outline-none transition-all duration-150
                  focus-visible:ring-2 focus-visible:ring-primary-600/20
                  ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300 focus-visible:border-primary-600'}`}
                placeholder="+54 11 1234 5678"
              />
              {errors.phone && (
                <p role="alert" className="text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Correo electrónico */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-foreground">
                Correo electrónico <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                className={`border rounded-lg px-3 py-2.5 text-base outline-none transition-all duration-150
                  focus-visible:ring-2 focus-visible:ring-primary-600/20
                  ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 focus-visible:border-primary-600'}`}
                placeholder="pedro.garcia@email.com"
              />
              {errors.email && (
                <p role="alert" className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/students')}
                className="px-5 py-2.5 text-gray-600 hover:text-gray-800 text-base font-medium
                           transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60
                           disabled:cursor-not-allowed text-white font-semibold
                           rounded-lg px-6 py-2.5 text-base transition-colors duration-150
                           cursor-pointer focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              >
                {loading
                  ? (mode === 'create' ? 'Guardando…' : 'Guardando…')
                  : (mode === 'create' ? 'Crear alumno' : 'Guardar cambios')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default StudentFormPage