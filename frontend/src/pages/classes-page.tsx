import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DanceClass } from '../types/class'
import { listClasses, deactivateClass } from '../services/classes-service'
import DayChips from '../components/day-chips'
import ActionMenu from '../components/action-menu'
import ConfirmDialog from '../components/confirm-dialog'

function ClassesPage() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<DanceClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null)
  const [pendingDeactivateId, setPendingDeactivateId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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

  function askDeactivate(id: number) {
    setPendingDeactivateId(id)
  }

  async function handleDeactivate(id: number) {
    setDeactivatingId(id)
    try {
      await deactivateClass(id)
      setClasses((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setActionError('No se pudo desactivar la clase. Intenta de nuevo.')
      setTimeout(() => setActionError(null), 4000)
    } finally {
      setDeactivatingId(null)
    }
  }

  return (
    <>
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

      {/* Action error banner */}
      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

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

      {/* Classes list — always 1 column */}
      {!loading && !error && classes.length > 0 && (
        <div className="flex flex-col gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5
                         hover:shadow-md transition-shadow"
            >
              {/* Header: name + action menu */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {cls.displayName}
                  </h3>
                  {cls.name && cls.name !== cls.displayName && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{cls.name}</p>
                  )}
                </div>
                <ActionMenu
                  items={[
                    {
                      label: 'Editar',
                      onClick: () => navigate(`/dashboard/classes/${cls.id}/edit`),
                    },
                    {
                      label: 'Desactivar',
                      onClick: () => askDeactivate(cls.id),
                      tone: 'danger',
                    },
                  ]}
                />
              </div>

              {/* Day chips + schedule list */}
              <div className="mt-3">
                <DayChips schedules={cls.schedules} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm deactivate dialog */}
      <ConfirmDialog
        open={pendingDeactivateId !== null}
        title="Desactivar clase"
        description="¿Querés desactivar esta clase? No aparecerá más en la lista de activas."
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

export default ClassesPage
