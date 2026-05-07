import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DanceClass } from '../types/class'
import { listClasses, deactivateClass } from '../services/classes-service'

// Day-of-week labels in Spanish (0 = Sunday)
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatSchedule(schedules: DanceClass['schedules']): string {
  if (!schedules.length) return 'Sin horario'
  return schedules
    .map((s) => `${DAY_LABELS[s.dayOfWeek]} ${s.startTime}–${s.endTime}`)
    .join(', ')
}

/**
 * Classes list page — shows active classes for the authenticated teacher.
 * Default view lists only active classes (backend contract).
 */
function ClassesPage() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<DanceClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null)

  useEffect(() => {
    loadClasses()
  }, [])

  async function loadClasses() {
    setLoading(true)
    setError(null)
    try {
      const data = await listClasses()
      setClasses(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar las clases'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivate(id: number) {
    if (!confirm('¿Quieres desactivar esta clase?')) return
    setDeactivatingId(id)
    try {
      await deactivateClass(id)
      setClasses((prev) => prev.filter((c) => c.id !== id))
    } catch {
      alert('No se pudo desactivar la clase. Intenta de nuevo.')
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
            <h1 className="text-2xl font-bold text-gray-900">Clases</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestión de clases activas</p>
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
            onClick={() => navigate('/dashboard/classes/new')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold
                       rounded-lg px-5 py-2.5 text-base transition-colors duration-150
                       cursor-pointer focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          >
            + Nueva clase
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="text-gray-400 text-base">Cargando clases…</div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium mb-3">{error}</p>
            <button
              onClick={loadClasses}
              className="text-red-600 hover:text-red-800 underline text-sm"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && classes.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">💃</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Sin clases todavía</h2>
            <p className="text-gray-500 mb-6">
              Comienza agregando tu primera clase con el botón de arriba.
            </p>
            <button
              onClick={() => navigate('/dashboard/classes/new')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold
                         rounded-lg px-5 py-2.5 text-base transition-colors duration-150
                         cursor-pointer"
            >
              Agregar clase
            </button>
          </div>
        )}

        {/* Classes list */}
        {!loading && !error && classes.length > 0 && (
          <div className="space-y-3">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white border border-gray-200 rounded-lg p-5
                           flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {cls.displayName}
                  </h3>
                  {cls.name && cls.name !== cls.displayName && (
                    <p className="text-sm text-gray-400 truncate">{cls.name}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-0.5">
                    {formatSchedule(cls.schedules)}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/dashboard/classes/${cls.id}/edit`)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium
                               px-3 py-1.5 rounded border border-primary-200
                               hover:border-primary-300 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeactivate(cls.id)}
                    disabled={deactivatingId === cls.id}
                    className="text-gray-500 hover:text-red-600 text-sm font-medium
                               px-3 py-1.5 rounded border border-gray-200
                               hover:border-red-300 transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deactivatingId === cls.id ? 'Desactivando…' : 'Desactivar'}
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

export default ClassesPage