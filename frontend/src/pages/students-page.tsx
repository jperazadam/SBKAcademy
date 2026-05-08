import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Student } from '../types/student'
import { listStudents, deactivateStudent } from '../services/students-service'
import AvatarInitials from '../components/avatar-initials'
import ActionMenu from '../components/action-menu'
import ConfirmDialog from '../components/confirm-dialog'

function StudentsPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null)
  const [pendingDeactivateId, setPendingDeactivateId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
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

  function askDeactivate(id: number) {
    setPendingDeactivateId(id)
  }

  async function handleDeactivate(id: number) {
    setDeactivatingId(id)
    try {
      await deactivateStudent(id)
      setStudents((prev) => prev.filter((s) => s.id !== id))
    } catch {
      setActionError('No se pudo desactivar el alumno. Intenta de nuevo.')
      setTimeout(() => setActionError(null), 4000)
    } finally {
      setDeactivatingId(null)
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
      .includes(query.toLowerCase())
  )

  return (
    <>
      {/* Header row: search + create */}
      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email…"
          className="rounded-lg border border-gray-300 px-4 py-2 w-full md:max-w-sm
                     focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        />
        <button
          onClick={() => navigate('/dashboard/students/new')}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold
                     rounded-lg px-5 py-2.5 text-base transition-colors duration-150
                     cursor-pointer focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-primary-600 focus-visible:ring-offset-2
                     whitespace-nowrap"
        >
          + Nuevo alumno
        </button>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

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

      {/* Student grid */}
      {!loading && !error && students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5
                         hover:shadow-md transition-shadow flex items-start gap-4"
            >
              {/* Avatar */}
              <AvatarInitials
                firstName={student.firstName}
                lastName={student.lastName}
              />

              {/* Content */}
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

              {/* Action menu */}
              <ActionMenu
                items={[
                  {
                    label: 'Editar',
                    onClick: () => navigate(`/dashboard/students/${student.id}/edit`),
                  },
                  {
                    label: 'Desactivar',
                    onClick: () => askDeactivate(student.id),
                    tone: 'danger',
                  },
                ]}
              />
            </div>
          ))}
        </div>
      )}

      {/* Confirm deactivate dialog */}
      <ConfirmDialog
        open={pendingDeactivateId !== null}
        title="Desactivar alumno"
        description="¿Querés desactivar a este alumno? No aparecerá más en la lista de activos."
        confirmLabel={deactivatingId !== null ? 'Desactivando…' : 'Desactivar'}
        cancelLabel="Cancelar"
        tone="danger"
        onCancel={() => setPendingDeactivateId(null)}
        onConfirm={async () => {
          const id = pendingDeactivateId!
          setPendingDeactivateId(null)
          await handleDeactivate(id)
        }}
      />
    </>
  )
}

export default StudentsPage
