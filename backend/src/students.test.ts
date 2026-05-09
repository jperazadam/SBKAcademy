import request from 'supertest'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from './app'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Test users and tokens
// ---------------------------------------------------------------------------

let teacherA: { id: number; token: string }
let studentUser: { id: number; token: string }

// Unique email suffix per test process — prevents collisions when this file
// runs in parallel with other test files against the same database, and avoids
// stale-row collisions across consecutive runs that may have failed mid-cleanup.
const RUN_ID = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`
const EMAIL_SUFFIX = `@students-${RUN_ID}.test.local`

function makeToken(user: { id: number; email: string; name: string; role: 'professor' | 'student' }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  )
}

// Scoped cleanup — only touches rows owned by users created in THIS file.
// Order respects FK dependencies: schedules → classes → users.
// Never uses unscoped deleteMany, which would race with other test files
// that share the same database.
async function cleanupOwnRows() {
  await prisma.classScheduleEntry.deleteMany({
    where: { class: { teacher: { email: { endsWith: EMAIL_SUFFIX } } } },
  })
  await prisma.danceClass.deleteMany({
    where: { teacher: { email: { endsWith: EMAIL_SUFFIX } } },
  })
  await prisma.user.deleteMany({
    where: { email: { endsWith: EMAIL_SUFFIX } },
  })
}

// ---------------------------------------------------------------------------
// Seed database before running tests
// ---------------------------------------------------------------------------

beforeAll(async () => {
  await cleanupOwnRows()

  const passwordHash = await bcrypt.hash('password123', 10)

  const userA = await prisma.user.create({
    data: { email: `teacher-a${EMAIL_SUFFIX}`, password: passwordHash, name: 'Teacher A (students)', role: 'professor' },
  })
  const studentRaw = await prisma.user.create({
    data: { email: `student${EMAIL_SUFFIX}`, password: passwordHash, name: 'Student User', role: 'student' },
  })

  teacherA = { id: userA.id, token: makeToken({ ...userA, role: 'professor' }) }
  studentUser = { id: studentRaw.id, token: makeToken({ ...studentRaw, role: 'student' }) }
})

afterAll(async () => {
  await cleanupOwnRows()
  await prisma.$disconnect()
})

// ---------------------------------------------------------------------------
// Tests: 401 Unauthenticated access
// ---------------------------------------------------------------------------

describe('Unauthenticated access returns 401', () => {
  it('GET /students without token → 401', async () => {
    const res = await request(app).get('/students')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
  })
})

// ---------------------------------------------------------------------------
// Tests: GET /students (professor-only)
// ---------------------------------------------------------------------------

describe('GET /students', () => {
  it('returns [] for a professor (no students enrolled yet)', async () => {
    const res = await request(app)
      .get('/students')
      .set('Authorization', `Bearer ${teacherA.token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns 403 when a student-role token is used', async () => {
    const res = await request(app)
      .get('/students')
      .set('Authorization', `Bearer ${studentUser.token}`)

    expect(res.status).toBe(403)
  })
})

// ---------------------------------------------------------------------------
// Tests: Removed endpoints return 404
// REQ-11: POST /students, PUT /students/:id, DELETE /students/:id MUST NOT exist
// ---------------------------------------------------------------------------

describe('Removed student mutation endpoints return 404', () => {
  it('POST /students → 404', async () => {
    const res = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${teacherA.token}`)
      .send({ firstName: 'John', lastName: 'Doe', phone: '1234567890' })

    expect(res.status).toBe(404)
  })

  it('PUT /students/:id → 404', async () => {
    const res = await request(app)
      .put('/students/1')
      .set('Authorization', `Bearer ${teacherA.token}`)
      .send({ firstName: 'John', lastName: 'Doe', phone: '1234567890' })

    expect(res.status).toBe(404)
  })

  it('DELETE /students/:id → 404', async () => {
    const res = await request(app)
      .delete('/students/1')
      .set('Authorization', `Bearer ${teacherA.token}`)

    expect(res.status).toBe(404)
  })
})
