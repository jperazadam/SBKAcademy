import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type {
  DanceClass,
  CreateClassInput,
  UpdateClassInput,
  ScheduleInput,
  DanceType,
  DanceLevel,
} from '../types/class'
import { getClass, createClass, updateClass } from '../services/classes-service'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DANCE_TYPES: { value: DanceType; label: string }[] = [
  { value: 'SALSA', label: 'Salsa' },
  { value: 'BACHATA', label: 'Bachata' },
  { value: 'KIZOMBA', label: 'Kizomba' },
]

const DANCE_LEVELS: { value: DanceLevel; label: string }[] = [
  { value: 'INICIO', label: 'Inicio' },
  { value: 'MEDIO', label: 'Medio' },
  { value: 'AVANZADO', label: 'Avanzado' },
]

const DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScheduleErrors {
  dayOfWeek?: string
  startTime?: string
  endTime?: string
}

interface FormErrors {
  type?: string
  level?: string
  schedules?: string
  scheduleItems?: ScheduleErrors[]
}

interface ClassFormPageProps {
  mode: 'create' | 'edit'
  serviceOverrides?: {
    getClass?: typeof getClass
    createClass?: typeof createClass
    updateClass?: typeof updateClass
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
}

function isEndAfterStart(start: string, end: string): boolean {
  return end > start
}

function isScheduleValid(s: ScheduleInput): ScheduleErrors {
  const errors: ScheduleErrors = {}
  if (s.dayOfWeek < 0 || s.dayOfWeek > 6) {
    errors.dayOfWeek = 'Selecciona un día válido.'
  }
  if (!isValidTime(s.startTime)) {
    errors.startTime = 'Usa formato HH:mm.'
  }
  if (!isValidTime(s.endTime)) {
    errors.endTime = 'Usa formato HH:mm.'
  } else if (!isEndAfterStart(s.startTime, s.endTime)) {
    errors.endTime = 'La hora de fin debe ser posterior a la de inicio.'
  }
  return errors
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ClassFormPage({
  mode,
  serviceOverrides,
}: {
  mode: 'create' | 'edit'
  serviceOverrides?: {
    getClass?: typeof getClass
    createClass?: typeof createClass
    updateClass?: typeof updateClass
  }
}) {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()

  const sv = serviceOverrides ?? {}
  const getClassFn = sv.getClass ?? getClass
  const createClassFn = sv.createClass ?? createClass
  const updateClassFn = sv.updateClass ?? updateClass

  // Form state
  const [danceType, setDanceType] = useState<DanceType | ''>('')
  const [danceLevel, setDanceLevel] = useState<DanceLevel | ''>('')
  const [customName, setCustomName] = useState('')
  const [schedules, setSchedules] = useState<ScheduleInput[]>([
    { dayOfWeek: 1, startTime: '', endTime: '' },
  ])
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(mode === 'edit')
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load existing class in edit mode
  useEffect(() => {
    if (mode === 'edit' && classId) {
      loadClass(Number(classId))
    }
  }, [mode, classId])

  async function loadClass(id: number) {
    setLoading(true)
    setLoadError(null)
    try {
      const cls = await getClassFn(id)
      setDanceType(cls.type)
      setDanceLevel(cls.level)
      setCustomName(cls.name ?? '')
      setSchedules(
        cls.schedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        }))
      )
    } catch {
      setLoadError('No se pudo cargar la clase. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Schedule entry helpers
  // ---------------------------------------------------------------------------

  function updateSchedule(index: number, field: keyof ScheduleInput, value: string | number) {
    setSchedules((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
    // Clear per-entry errors when user edits
    if (errors.scheduleItems?.[index]) {
      setErrors((prev) => ({
        ...prev,
        scheduleItems: prev.scheduleItems?.map((e, i) =>
          i === index ? { ...e, [field]: undefined } : e
        ),
      }))
    }
  }

  function addSchedule() {
    setSchedules((prev) => [...prev, { dayOfWeek: 1, startTime: '', endTime: '' }])
  }

  function removeSchedule(index: number) {
    if (schedules.length <= 1) return
    setSchedules((prev) => prev.filter((_, i) => i !== index))
    if (errors.scheduleItems) {
      setErrors((prev) => ({
        ...prev,
        scheduleItems: prev.scheduleItems?.filter((_, i) => i !== index),
      }))
    }
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!danceType) {
      newErrors.type = 'El tipo de baile es obligatorio.'
    }
    if (!danceLevel) {
      newErrors.level = 'El nivel es obligatorio.'
    }

    // At least one schedule required (already in UI, but guard here)
    if (schedules.length === 0) {
      newErrors.schedules = 'Agrega al menos un horario.'
    }

    // Validate each schedule entry
    const scheduleErrors: ScheduleErrors[] = []
    let hasAnyScheduleError = false
    for (const s of schedules) {
      const e = isScheduleValid(s)
      scheduleErrors.push(e)
      if (Object.keys(e).length > 0) hasAnyScheduleError = true
    }

    if (hasAnyScheduleError) {
      newErrors.scheduleItems = scheduleErrors
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const baseData = {
        type: danceType as DanceType,
        level: danceLevel as DanceLevel,
        schedules,
        ...(customName.trim() ? { name: customName.trim() } : {}),
      }

      if (mode === 'create') {
        const input: CreateClassInput = baseData
        await createClassFn(input)
      } else {
        const input: UpdateClassInput = baseData
        await updateClassFn(Number(classId), input)
      }
      navigate('/dashboard/classes')
    } catch {
      alert('Ocurrió un error al guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function fieldError(field: keyof FormErrors) {
    return errors[field]
  }

  function scheduleErrors(index: number): ScheduleErrors {
    return errors.scheduleItems?.[index] ?? {}
  }

  // Loading state while fetching class in edit mode
  if (mode === 'edit' && loading && !danceType && !loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-gray-400">Cargando datos de la clase…</p>
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
            onClick={() => navigate('/dashboard/classes')}
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
            {mode === 'create' ? 'Nueva clase' : 'Editar clase'}
          </h1>
          <button
            onClick={() => navigate('/dashboard/classes')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Cancelar
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            {/* Tipo de baile */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="danceType" className="text-sm font-semibold text-foreground">
                Tipo de baile <span className="text-red-500">*</span>
              </label>
              <select
                id="danceType"
                value={danceType}
                onChange={(e) => {
                  setDanceType(e.target.value as DanceType)
                  if (errors.type) setErrors((prev) => ({ ...prev, type: undefined }))
                }}
                className={`border rounded-lg px-3 py-2.5 text-base outline-none transition-all duration-150
                  focus-visible:ring-2 focus-visible:ring-primary-600/20
                  ${errors.type ? 'border-red-400 bg-red-50' : 'border-gray-300 focus-visible:border-primary-600'}`}
              >
                <option value="">Seleccionar tipo…</option>
                {DANCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.type && (
                <p role="alert" className="text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            {/* Nivel */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="danceLevel" className="text-sm font-semibold text-foreground">
                Nivel <span className="text-red-500">*</span>
              </label>
              <select
                id="danceLevel"
                value={danceLevel}
                onChange={(e) => {
                  setDanceLevel(e.target.value as DanceLevel)
                  if (errors.level) setErrors((prev) => ({ ...prev, level: undefined }))
                }}
                className={`border rounded-lg px-3 py-2.5 text-base outline-none transition-all duration-150
                  focus-visible:ring-2 focus-visible:ring-primary-600/20
                  ${errors.level ? 'border-red-400 bg-red-50' : 'border-gray-300 focus-visible:border-primary-600'}`}
              >
                <option value="">Seleccionar nivel…</option>
                {DANCE_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              {errors.level && (
                <p role="alert" className="text-sm text-red-600">{errors.level}</p>
              )}
            </div>

            {/* Nombre personalizado */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="customName" className="text-sm font-semibold text-foreground">
                Nombre personalizado <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                id="customName"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base
                           focus:border-primary-600 focus:outline-none
                           focus-visible:ring-2 focus-visible:ring-primary-600/20
                           transition-all duration-150"
                placeholder="Ej. Clase de los martes"
              />
              {danceType && danceLevel && (
                <p className="text-xs text-gray-400">
                  Sin nombre se muestra como: {danceType.toLowerCase().replace(/^./, c => c.toUpperCase())} {danceLevel.toLowerCase().replace(/^./, c => c.toUpperCase())}
                </p>
              )}
            </div>

            {/* Schedule entries */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Horarios <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addSchedule}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium
                             transition-colors cursor-pointer"
                >
                  + Agregar horario
                </button>
              </div>

              {errors.schedules && (
                <p role="alert" className="text-sm text-red-600">{errors.schedules}</p>
              )}

              <div className="flex flex-col gap-3">
                {schedules.map((s, index) => {
                  const se = scheduleErrors(index)
                  return (
                    <div key={index} className="flex gap-2 items-start flex-wrap bg-gray-50 rounded-lg p-3">
                      {/* Day */}
                      <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                        <label htmlFor={`day-${index}`} className="text-xs text-gray-500">Día</label>
                        <select
                          id={`day-${index}`}
                          value={s.dayOfWeek}
                          onChange={(e) => updateSchedule(index, 'dayOfWeek', Number(e.target.value))}
                          className={`border rounded-lg px-2 py-2 text-sm outline-none transition-all
                            ${se.dayOfWeek ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-primary-600'}`}
                        >
                          {DAY_OPTIONS.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                        {se.dayOfWeek && <p className="text-xs text-red-600">{se.dayOfWeek}</p>}
                      </div>

                      {/* Start time */}
                      <div className="flex flex-col gap-1 flex-1 min-w-[80px]">
                        <label htmlFor={`start-${index}`} className="text-xs text-gray-500">Inicio</label>
                        <input
                          id={`start-${index}`}
                          type="time"
                          value={s.startTime}
                          onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                          className={`border rounded-lg px-2 py-2 text-sm outline-none transition-all
                            ${se.startTime ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-primary-600'}`}
                        />
                        {se.startTime && <p className="text-xs text-red-600">{se.startTime}</p>}
                      </div>

                      {/* End time */}
                      <div className="flex flex-col gap-1 flex-1 min-w-[80px]">
                        <label htmlFor={`end-${index}`} className="text-xs text-gray-500">Fin</label>
                        <input
                          id={`end-${index}`}
                          type="time"
                          value={s.endTime}
                          onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                          className={`border rounded-lg px-2 py-2 text-sm outline-none transition-all
                            ${se.endTime ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-primary-600'}`}
                        />
                        {se.endTime && <p className="text-xs text-red-600">{se.endTime}</p>}
                      </div>

                      {/* Remove button */}
                      {schedules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSchedule(index)}
                          className="mt-5 text-gray-400 hover:text-red-600 text-sm transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/classes')}
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
                  ? 'Guardando…'
                  : (mode === 'create' ? 'Crear clase' : 'Guardar cambios')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default ClassFormPage