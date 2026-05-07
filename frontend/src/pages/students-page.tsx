import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Student } from '../types/student'
import { listStudents, deactivateStudent } from '../services/students-service'

/**
 * Students list page — shows active students for the authenticated teacher.
 * Default view lists only active students (backend contract).
 */
function StudentsPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null)

  useEffect(() => {
    loadStudents()
  }, [])

  async function loadStudents() {
    setLoading(true)
    setError(null)
    try {
      const data = await listStudents()
      setStudents(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar los alumnos'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivate(id: number) {
    if (!confirm('¿Quieres desactivar este alumno?')) return
    setDeactivatingId(id)
    try {
      await deactivateStudent(id)
      setStudents((prev) => prev.filter((s) => s.id !== id))
    } catch {
      alert('No se pudo desactivar el alumno. Intenta de nuevo.')
    } finally {
      setDeactivatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alumnos</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestión de alumnos activos</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Volver
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Create button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => navigate('/dashboard/students/new')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold
                       rounded-lg px-5 py-2.5 text-base transition-colors duration-150
                       cursor-pointer focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          >
            + Nuevo alumno
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="text-gray-400 text-base">Cargando alumnos…</div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium mb-3">{error}</p>
            <button
              onClick={loadStudents}
              className="text-red-600 hover:text-red-800 underline text-sm"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && students.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">🎓</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Sin alumnos todavía</h2>
            <p className="text-gray-500 mb-6">
              Comienza agregando tu primer alumno con el botón de arriba.
            </p>
            <button
              onClick={() => navigate('/dashboard/students/new')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold
                         rounded-lg px-5 py-2.5 text-base transition-colors duration-150
                         cursor-pointer"
            >
              Agregar alumno
            </button>
          </div>
        )}

        {/* Student list */}
        {!loading && !error && students.length > 0 && (
          <div className="space-y-3">
            {students.map((student) => (
              <div
                key={student.id}
                className="bg-white border border-gray-200 rounded-lg p-5
                           flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">{student.phone}</p>
                  {student.email && (
                    <p className="text-sm text-gray-400 truncate">{student.email}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/dashboard/students/${student.id}/edit`)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium
                               px-3 py-1.5 rounded border border-primary-200
                               hover:border-primary-300 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeactivate(student.id)}
                    disabled={deactivatingId === student.id}
                    className="text-gray-500 hover:text-red-600 text-sm font-medium
                               px-3 py-1.5 rounded border border-gray-200
                               hover:border-red-300 transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deactivatingId === student.id ? 'Desactivando…' : 'Desactivar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default StudentsPage