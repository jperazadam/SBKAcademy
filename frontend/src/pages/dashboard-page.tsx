import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MetricCard from '../components/metric-card'
import { useAuth } from '../context/auth-context'
import { listStudents } from '../services/students-service'
import { listClasses } from '../services/classes-service'
import { upcomingOccurrences } from '../utils/upcoming-classes'
import type { Student } from '../types/student'
import type { DanceClass } from '../types/class'
import type { UpcomingOccurrence } from '../utils/upcoming-classes'

const DAY_ABBR: Record<number, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
}

function formatShort(date: Date): string {
  return `${DAY_ABBR[date.getDay()]} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatRange(occurrence: UpcomingOccurrence): string {
  const { schedule, nextDate } = occurrence
  const day = DAY_ABBR[nextDate.getDay()]
  return `${day} ${schedule.startTime}–${schedule.endTime}`
}

function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<DanceClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Read teacher name from AuthContext — single source of truth, no localStorage access
  const teacherName = user?.name ?? ''

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [studentsData, classesData] = await Promise.all([
        listStudents(),
        listClasses(),
      ])
      setStudents(studentsData)
      setClasses(classesData)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar los datos'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()
  const occurrences = upcomingOccurrences(classes, now, 7)
  const nextClass = occurrences[0] ?? null

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {teacherName ? `Hola, ${teacherName}` : 'Hola'}
        </h1>
        <p className="mt-1 text-sm text-gray-500 capitalize">{today}</p>
      </div>

      {/* Error banner */}
      {!loading && error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={loadData}
            className="ml-4 text-sm font-medium text-red-700 underline hover:text-red-900"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Metric cards — 1 col mobile, 3 cols md: */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <>
            <MetricCard label="Alumnos activos" value="" loading />
            <MetricCard label="Clases activas" value="" loading />
            <MetricCard label="Próxima clase" value="" loading />
          </>
        ) : (
          <>
            <MetricCard
              label="Alumnos activos"
              value={students.length}
            />
            <MetricCard
              label="Clases activas"
              value={classes.length}
            />
            <MetricCard
              label="Próxima clase"
              value={nextClass ? formatShort(nextClass.nextDate) : '—'}
              subtitle={nextClass ? nextClass.class.displayName : undefined}
            />
          </>
        )}
      </div>

      {/* Upcoming classes this week */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Próximas clases de la semana
        </h2>

        {loading && (
          <div className="space-y-2">
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-44 animate-pulse rounded bg-gray-200" />
          </div>
        )}

        {!loading && !error && occurrences.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              No tenés clases activas esta semana.
            </p>
            <button
              onClick={() => navigate('/dashboard/classes/new')}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 underline"
            >
              Agregá tu primera clase
            </button>
          </div>
        )}

        {!loading && !error && occurrences.length > 0 && (
          <ul className="space-y-2">
            {occurrences.map((occ, index) => (
              <li
                key={`${occ.class.id}-${occ.schedule.id}-${index}`}
                className="flex items-baseline gap-4 rounded-lg border border-gray-100 bg-white px-4 py-3"
              >
                <span className="w-32 flex-shrink-0 text-sm font-medium text-gray-700">
                  {formatRange(occ)}
                </span>
                <span className="text-sm text-gray-500">
                  {occ.class.displayName}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
