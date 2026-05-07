import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function trimRequired(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') throw new Error(`${fieldName} must be a string`)
  const trimmed = value.trim()
  if (trimmed === '') throw new Error(`${fieldName} is required`)
  return trimmed
}

function validateEmail(email: unknown): string | undefined {
  if (email === undefined || email === null) return undefined
  if (typeof email !== 'string') throw new Error('email must be a string')
  const trimmed = email.trim()
  if (trimmed === '') return undefined
  // Basic email shape: at least one char, an @, at least one char, a dot, at least one char
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error('email must be a valid email address')
  }
  return trimmed
}

function parseStudentInput(body: unknown) {
  if (typeof body !== 'object' || body === null) throw new Error('request body must be an object')
  const b = body as Record<string, unknown>
  return {
    firstName: trimRequired(b.firstName, 'firstName'),
    lastName: trimRequired(b.lastName, 'lastName'),
    phone: trimRequired(b.phone, 'phone'),
    email: validateEmail(b.email),
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export async function listStudents(req: Request, res: Response): Promise<void> {
  try {
    const teacherId = req.user!.id
    const students = await prisma.student.findMany({
      where: { teacherId, active: true },
      orderBy: { createdAt: 'desc' },
    })
    res.status(200).json(students)
  } catch (err) {
    console.error('[students-controller] listStudents error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getStudent(req: Request, res: Response): Promise<void> {
  try {
    const teacherId = req.user!.id
    const studentId = parseInt(req.params['id'] as string, 10)

    if (isNaN(studentId)) {
      res.status(400).json({ error: 'invalid student id' })
      return
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, teacherId, active: true },
    })

    if (!student) {
      res.status(404).json({ error: 'student not found' })
      return
    }

    res.status(200).json(student)
  } catch (err) {
    console.error('[students-controller] getStudent error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function createStudent(req: Request, res: Response): Promise<void> {
  try {
    const teacherId = req.user!.id
    const data = parseStudentInput(req.body)

    const student = await prisma.student.create({
      data: { ...data, teacherId },
    })

    res.status(201).json(student)
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.startsWith('firstName') || err.message.startsWith('lastName') || err.message.startsWith('phone') || err.message.startsWith('email')) {
        res.status(400).json({ error: err.message })
        return
      }
    }
    console.error('[students-controller] createStudent error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateStudent(req: Request, res: Response): Promise<void> {
  try {
    const teacherId = req.user!.id
    const studentId = parseInt(req.params['id'] as string, 10)

    if (isNaN(studentId)) {
      res.status(400).json({ error: 'invalid student id' })
      return
    }

    const data = parseStudentInput(req.body)

    // Check student exists and belongs to this teacher
    const existing = await prisma.student.findFirst({
      where: { id: studentId, teacherId, active: true },
    })

    if (!existing) {
      res.status(404).json({ error: 'student not found' })
      return
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data, // teacherId is not included — ownership never changes
    })

    res.status(200).json(updated)
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.startsWith('firstName') || err.message.startsWith('lastName') || err.message.startsWith('phone') || err.message.startsWith('email')) {
        res.status(400).json({ error: err.message })
        return
      }
    }
    console.error('[students-controller] updateStudent error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function deleteStudent(req: Request, res: Response): Promise<void> {
  try {
    const teacherId = req.user!.id
    const studentId = parseInt(req.params['id'] as string, 10)

    if (isNaN(studentId)) {
      res.status(400).json({ error: 'invalid student id' })
      return
    }

    const existing = await prisma.student.findFirst({
      where: { id: studentId, teacherId, active: true },
    })

    if (!existing) {
      res.status(404).json({ error: 'student not found' })
      return
    }

    // Soft-delete: set active = false
    await prisma.student.update({
      where: { id: studentId },
      data: { active: false },
    })

    res.status(204).send()
  } catch (err) {
    console.error('[students-controller] deleteStudent error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}