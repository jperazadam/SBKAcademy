/**
 * DanceClass DTO types matching the backend API contract.
 * UI text is in Spanish; code identifiers are in English.
 */

export type DanceType = 'SALSA' | 'BACHATA' | 'KIZOMBA'
export type DanceLevel = 'INICIO' | 'MEDIO' | 'AVANZADO'

export interface ClassScheduleEntry {
  id: number
  dayOfWeek: number // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startTime: string // "HH:mm" format
  endTime: string   // "HH:mm" format
  classId: number
}

export interface DanceClass {
  id: number
  name: string | null
  type: DanceType
  level: DanceLevel
  active: boolean
  displayName: string
  teacherId: number
  createdAt: string
  updatedAt: string
  schedules: ClassScheduleEntry[]
}

export interface CreateClassInput {
  name?: string
  type: DanceType
  level: DanceLevel
  schedules: ScheduleInput[]
}

export interface UpdateClassInput {
  name?: string
  type: DanceType
  level: DanceLevel
  schedules: ScheduleInput[]
}

export interface ScheduleInput {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface ClassError {
  error: string
}