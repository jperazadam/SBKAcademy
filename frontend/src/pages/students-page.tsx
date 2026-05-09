/**
 * StudentsPage — lista de alumnos del profesor.
 *
 * REQ-21: Sin botón "Nuevo alumno" ni acciones de editar/desactivar.
 * REQ-22: Empty-state muestra el copy de invitación a inscribirse.
 *
 * La lista siempre devuelve [] en esta fase (el backend retorna [] hasta
 * que exista enrollment). La búsqueda queda disponible para cuando haya datos.
 */
import { useEffect, useState } from 'react'
import type { Student } from '../types/student'
import { listStudents } from '../services/students-service'
import AvatarInitials from '../components/avatar-initials'

function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

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

  const filteredStudents = students.filter((s) =>
    (
      s.firstName +
      ' ' +
      s.lastName +
      ' ' +
      (s.phone ?? '') +
      ' ' +
      (s.email ?? '')
    )
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  return (
    <>
      {/* Search input */}
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email…"
          className="rounded-lg border border-gray-300 px-4 py-2 w-full md:max-w-sm
                     focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        />
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

      {/* Empty state — REQ-22 exact copy */}
      {!loading && !error && students.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-4xl mb-4" aria-hidden="true">
            🎓
          </div>
          <p className="text-gray-500">
            Todavía no tenés alumnos inscriptos a tus clases. Pronto vas a poder ver acá a quién se inscribió.
          </p>
        </div>
      )}

      {/* Student grid */}
      {!loading && !error && students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5
                         hover:shadow-md transition-shadow flex items-start gap-4"
            >
              <AvatarInitials firstName={student.firstName} lastName={student.lastName} />

              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-gray-900 truncate">
                  {student.firstName} {student.lastName}
                </p>
                {student.phone && (
                  <p className="text-sm text-gray-500 mt-0.5">{student.phone}</p>
                )}
                {student.email && (
                  <p className="text-sm text-gray-400 truncate">{student.email}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default StudentsPage
