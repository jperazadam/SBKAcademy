import { Request, Response } from 'express'
import { PrismaClient, DanceType, DanceLevel } from '@prisma/client'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Spanish display labels
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<DanceType, string> = {
  SALSA: 'Salsa',
  BACHATA: 'Bachata',
  KIZOMBA: 'Kizomba',
}

const LEVEL_LABELS: Record<DanceLevel, string> = {
  INICIO: 'inicio',
  MEDIO: 'medio',
  AVANZADO: 'avanzado',
}

// ---------------------------------------------------------------------------
// Input parsing
// ---------------------------------------------------------------------------

interface ScheduleInput {
  dayOfWeek: unknown
  startTime: unknown
  endTime: unknown
}

interface ClassInput {
  name?: unknown
  type: unknown
  level: unknown
  schedules: unknown
}

function isValidTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
}

function compareTimes(a: string, b: string): number {
  return a.localeCompare(b)
}

function parseScheduleEntry(raw: unknown, index: number): ScheduleInput {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`schedules[${index}] must be an object`)
  }
  const s = raw as Record<string, unknown>

  const dayOfWeek = s['dayOfWeek']
  if (typeof dayOfWeek !== 'number' || !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error(`schedules[${index}].dayOfWeek must be an integer between 0 and 6`)
  }

  const startTime = s['startTime']
  if (typeof startTime !== 'string' || !isValidTimeFormat(startTime)) {
    throw new Error(`schedules[${index}].startTime must be in HH:mm format`)
  }

  const endTime = s['endTime']
  if (typeof endTime !== 'string' || !isValidTimeFormat(endTime)) {
    throw new Error(`schedules[${index}].endTime must be in HH:mm format`)
  }

  if (compareTimes(endTime, startTime) <= 0) {
    throw new Error(`schedules[${index}].endTime must be after startTime`)
  }

  return {
    dayOfWeek,
    startTime,
    endTime,
  }
}

function parseClassInput(body: unknown): ClassInput & { schedules: ScheduleInput[] } {
  if (typeof body !== 'object' || body === null) throw new Error('request body must be an object')
  const b = body as Record<string, unknown>

  const type = b['type']
  if (typeof type !== 'string' || !['SALSA', 'BACHATA', 'KIZOMBA'].includes(type)) {
    throw new Error('type must be one of: SALSA, BACHATA, KIZOMBA')
  }

  const level = b['level']
  if (typeof level !== 'string' || !['INICIO', 'MEDIO', 'AVANZADO'].includes(level)) {
    throw new Error('level must be one of: INICIO, MEDIO, AVANZADO')
  }

  const nameRaw = b['name']
  const name = nameRaw === undefined || nameRaw === null || nameRaw === '' ? null : String(nameRaw).trim() || null

  const schedulesRaw = b['schedules']
  if (!Array.isArray(schedulesRaw) || schedulesRaw.length === 0) {
    throw new Error('at least one schedule entry is required')
  }

  const schedules = schedulesRaw.map((s, i) => parseScheduleEntry(s, i))

  return { name, type, level, schedules }
}

// ---------------------------------------------------------------------------
// Serialization — adds displayName and ordered schedules
// ---------------------------------------------------------------------------

function serializeDanceClass(
  cls: {
    id: number
    name: string | null
    type: DanceType
    level: DanceLevel
    active: boolean
    createdAt: Date
    updatedAt: Date
    teacherId: number
    schedules: { id: number; dayOfWeek: number; startTime: string; endTime: string; classId: number }[]
  }
) {
  const displayName =
    cls.name ?? `${TYPE_LABELS[cls.type]} ${LEVEL_LABELS[cls.level]}`

  return {
    id: cls.id,
    name: cls.name,
    type: cls.type,
    level: cls.level,
    active: cls.active,
    displayName,
    teacherId: cls.teacherId,
    createdAt: cls.createdAt,
    updatedAt: cls.updatedAt,
    schedules: [...cls.schedules].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
      return a.startTime.localeCompare(b.startTime)
    }),
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export async function listClasses(req: Request, res: Response): Promise<void> {
  try {
    const teacherId = req.user!.id
    const classes = await prisma.danceClass.findMany({
      where: { teacherId, active: true },
      include: { schedules: true },
      orderBy: { createdAt: 'desc' },
    })
    res.status(200).json(classes.map(serializeDanceClass))
  } catch (err) {
    console.error('[classes-controller] listClasses error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getClass(req: Request, res: Response): Promise<void> {
  try {
    const teacherId = req.user!.id
    const classId = parseInt(req.params['id'] as string, 10)

    if (isNaN(classId)) {
      res.status(400).json({ error: 'invalid class id' })
      return
    }

    const cls = await prisma.danceClass.findFirst({
      where: { id: classId, teacherId, active: true },
      include: { schedules: true },
    })

    if (!cls) {
      res.status(404).json({ error: 'class not found' })
      return
    }

    res.status(200).json(serializeDanceClass(cls))
  } catch (err) {
    console.error('[classes-controller] getClass error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function createClass(req: Request, res: Response): Promise<void> {
  try {
    const teacherId = req.user!.id
    const { name, type, level, schedules } = parseClassInput(req.body)

    const cls = await prisma.danceClass.create({
      data: {
        name,
        type: type as DanceType,
        level: level as DanceLevel,
        teacherId,
        schedules: {
          create: schedules.map(s => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        },
      },
      include: { schedules: true },
    })

    res.status(201).json(serializeDanceClass(cls))
  } catch (err) {
    if (err instanceof Error) {
      const msg = err.message
      if (
        msg.includes('type') ||
        msg.includes('level') ||
        msg.includes('schedules') ||
        msg.includes('dayOfWeek') ||
        msg.includes('startTime') ||
        msg.includes('endTime') ||
        msg.includes('schedule entry')
      ) {
        res.status(400).json({ error: msg })
        return
      }
    }
    console.error('[classes-controller] createClass error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateClass(req: Request, res: Response): Promise<void> {
  try {
    const teacherId = req.user!.id
    const classId = parseInt(req.params['id'] as string, 10)

    if (isNaN(classId)) {
      res.status(400).json({ error: 'invalid class id' })
      return
    }

    const { name, type, level, schedules } = parseClassInput(req.body)

    // Verify ownership and active status
    const existing = await prisma.danceClass.findFirst({
      where: { id: classId, teacherId, active: true },
    })

    if (!existing) {
      res.status(404).json({ error: 'class not found' })
      return
    }

    // Transactional update: replace schedule entries
    const updated = await prisma.$transaction(async tx => {
      await tx.classScheduleEntry.deleteMany({ where: { classId } })

      return tx.danceClass.update({
        where: { id: classId },
        data: {
          name,
          type: type as DanceType,
          level: level as DanceLevel,
          schedules: {
            create: schedules.map(s => ({
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
            })),
          },
        },
        include: { schedules: true },
      })
    })

    res.status(200).json(serializeDanceClass(updated))
  } catch (err) {
    if (err instanceof Error) {
      const msg = err.message
      if (
        msg.includes('type') ||
        msg.includes('level') ||
        msg.includes('schedules') ||
        msg.includes('dayOfWeek') ||
        msg.includes('startTime') ||
        msg.includes('endTime') ||
        msg.includes('schedule entry')
      ) {
        res.status(400).json({ error: msg })
        return
      }
    }
    console.error('[classes-controller] updateClass error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function deactivateClass(req: Request, res: Response): Promise<void> {
  try {
    const teacherId = req.user!.id
    const classId = parseInt(req.params['id'] as string, 10)

    if (isNaN(classId)) {
      res.status(400).json({ error: 'invalid class id' })
      return
    }

    const existing = await prisma.danceClass.findFirst({
      where: { id: classId, teacherId, active: true },
    })

    if (!existing) {
      res.status(404).json({ error: 'class not found' })
      return
    }

    await prisma.danceClass.update({
      where: { id: classId },
      data: { active: false },
    })

    res.status(204).send()
  } catch (err) {
    console.error('[classes-controller] deactivateClass error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}