import request from 'supertest'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import app from './app'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Test users and tokens
// ---------------------------------------------------------------------------

let teacherA: { id: number; token: string }
let teacherB: { id: number; token: string }

// Unique email suffix per test process — prevents collisions when this file
// runs in parallel with other test files against the same database, and avoids
// stale-row collisions across consecutive runs that may have failed mid-cleanup.
const RUN_ID = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`
const EMAIL_SUFFIX = `@classes-${RUN_ID}.test.local`

function makeToken(user: { id: number; email: string; name: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  )
}

// Scoped cleanup — only touches rows owned by teachers created in THIS file.
// Order respects FK dependencies: schedules → classes → students → users.
// Never uses unscoped deleteMany, which would race with other test files
// that share the same database.
async function cleanupOwnRows() {
  await prisma.classScheduleEntry.deleteMany({
    where: { class: { teacher: { email: { endsWith: EMAIL_SUFFIX } } } },
  })
  await prisma.danceClass.deleteMany({
    where: { teacher: { email: { endsWith: EMAIL_SUFFIX } } },
  })
  await prisma.student.deleteMany({
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
    data: { email: `teacher-a${EMAIL_SUFFIX}`, password: passwordHash, name: 'Teacher A (classes)' },
  })
  const userB = await prisma.user.create({
    data: { email: `teacher-b${EMAIL_SUFFIX}`, password: passwordHash, name: 'Teacher B (classes)' },
  })

  teacherA = { id: userA.id, token: makeToken(userA) }
  teacherB = { id: userB.id, token: makeToken(userB) }
})

afterAll(async () => {
  await cleanupOwnRows()
  await prisma.$disconnect()
})

// ---------------------------------------------------------------------------
// Helper: create a class for a teacher
// ---------------------------------------------------------------------------

async function createClass(token: string, data: object) {
  return request(app)
    .post('/classes')
    .set('Authorization', `Bearer ${token}`)
    .send(data)
}

async function listClasses(token: string) {
  return request(app)
    .get('/classes')
    .set('Authorization', `Bearer ${token}`)
}

// ---------------------------------------------------------------------------
// Tests: 401 Unauthenticated access
// ---------------------------------------------------------------------------

describe('Unauthenticated access returns 401', () => {
  for (const [method, path] of [
    ['GET', '/classes'],
    ['POST', '/classes'],
    ['GET', '/classes/999'],
    ['PUT', '/classes/999'],
    ['DELETE', '/classes/999'],
  ] as const) {
    it(`${method} ${path} without token → 401`, async () => {
      const res = await request(app)[method.toLowerCase()](path)
      expect(res.status).toBe(401)
      expect(res.body).toEqual({ error: 'Unauthorized' })
    })
  }
})

// ---------------------------------------------------------------------------
// Tests: Create class
// ---------------------------------------------------------------------------

describe('POST /classes', () => {
  it('creates a class with valid data and one schedule', async () => {
    const res = await createClass(teacherA.token, {
      type: 'SALSA',
      level: 'MEDIO',
      schedules: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:30' }],
    })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      type: 'SALSA',
      level: 'MEDIO',
      active: true,
      teacherId: teacherA.id,
      displayName: 'Salsa medio',
    })
    expect(res.body.name).toBeNull()
    expect(res.body.schedules).toHaveLength(1)
    expect(res.body.schedules[0]).toMatchObject({
      dayOfWeek: 1,
      startTime: '18:00',
      endTime: '19:30',
    })
  })

  it('creates a class with custom name and multiple schedules', async () => {
    const res = await createClass(teacherA.token, {
      name: 'Mi clase especial',
      type: 'BACHATA',
      level: 'INICIO',
      schedules: [
        { dayOfWeek: 1, startTime: '17:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '17:00', endTime: '18:00' },
      ],
    })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Mi clase especial')
    expect(res.body.displayName).toBe('Mi clase especial')
    expect(res.body.schedules).toHaveLength(2)
  })

  it('rejects missing type', async () => {
    const res = await createClass(teacherA.token, {
      level: 'MEDIO',
      schedules: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:30' }],
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('type')
  })

  it('rejects invalid type value', async () => {
    const res = await createClass(teacherA.token, {
      type: 'MERENGUE',
      level: 'MEDIO',
      schedules: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:30' }],
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('type')
  })

  it('rejects missing level', async () => {
    const res = await createClass(teacherA.token, {
      type: 'SALSA',
      schedules: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:30' }],
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('level')
  })

  it('rejects invalid level value', async () => {
    const res = await createClass(teacherA.token, {
      type: 'SALSA',
      level: 'EXPERTO',
      schedules: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:30' }],
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('level')
  })

  it('rejects missing schedules', async () => {
    const res = await createClass(teacherA.token, {
      type: 'SALSA',
      level: 'MEDIO',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('schedule')
  })

  it('rejects empty schedules array', async () => {
    const res = await createClass(teacherA.token, {
      type: 'SALSA',
      level: 'MEDIO',
      schedules: [],
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('schedule')
  })

  it('rejects schedule with invalid dayOfWeek', async () => {
    const res = await createClass(teacherA.token, {
      type: 'SALSA',
      level: 'MEDIO',
      schedules: [{ dayOfWeek: 7, startTime: '18:00', endTime: '19:30' }],
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('dayOfWeek')
  })

  it('rejects schedule with negative dayOfWeek', async () => {
    const res = await createClass(teacherA.token, {
      type: 'SALSA',
      level: 'MEDIO',
      schedules: [{ dayOfWeek: -1, startTime: '18:00', endTime: '19:30' }],
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('dayOfWeek')
  })

  it('rejects schedule with invalid startTime format', async () => {
    const res = await createClass(teacherA.token, {
      type: 'SALSA',
      level: 'MEDIO',
      schedules: [{ dayOfWeek: 1, startTime: '6pm', endTime: '19:30' }],
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('startTime')
  })

  it('rejects schedule with invalid endTime format', async () => {
    const res = await createClass(teacherA.token, {
      type: 'SALSA',
      level: 'MEDIO',
      schedules: [{ dayOfWeek: 1, startTime: '18:00', endTime: '7:30pm' }],
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('endTime')
  })

  it('rejects schedule where endTime equals startTime', async () => {
    const res = await createClass(teacherA.token, {
      type: 'SALSA',
      level: 'MEDIO',
      schedules: [{ dayOfWeek: 1, startTime: '18:00', endTime: '18:00' }],
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('endTime')
  })

  it('rejects schedule where endTime is before startTime', async () => {
    const res = await createClass(teacherA.token, {
      type: 'SALSA',
      level: 'MEDIO',
      schedules: [{ dayOfWeek: 1, startTime: '19:30', endTime: '18:00' }],
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('endTime')
  })

  it('accepts KIZOMBA type', async () => {
    const res = await createClass(teacherA.token, {
      type: 'KIZOMBA',
      level: 'AVANZADO',
      schedules: [{ dayOfWeek: 5, startTime: '20:00', endTime: '21:30' }],
    })
    expect(res.status).toBe(201) // KIZOMBA is valid
    expect(res.body.type).toBe('KIZOMBA')
  })
})

// ---------------------------------------------------------------------------
// Tests: List classes — active only, teacher-scoped
// ---------------------------------------------------------------------------

describe('GET /classes', () => {
  beforeEach(async () => {
    // Clean up classes created by THIS file only (scoped by per-run email suffix)
    await prisma.classScheduleEntry.deleteMany({
      where: { class: { teacher: { email: { endsWith: EMAIL_SUFFIX } } } },
    })
    await prisma.danceClass.deleteMany({
      where: { teacher: { email: { endsWith: EMAIL_SUFFIX } } },
    })
  })

  it('returns only active classes owned by the teacher', async () => {
    const active = await prisma.danceClass.create({
      data: {
        type: 'SALSA',
        level: 'MEDIO',
        teacherId: teacherA.id,
        active: true,
        schedules: { create: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }] },
      },
    })
    await prisma.danceClass.create({
      data: {
        type: 'BACHATA',
        level: 'INICIO',
        teacherId: teacherA.id,
        active: false,
        schedules: { create: [{ dayOfWeek: 2, startTime: '18:00', endTime: '19:00' }] },
      },
    })

    const res = await listClasses(teacherA.token)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].type).toBe('SALSA')
  })

  it('does not return another teacher\'s classes', async () => {
    await prisma.danceClass.create({
      data: {
        type: 'SALSA',
        level: 'AVANZADO',
        teacherId: teacherB.id,
        active: true,
        schedules: { create: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }] },
      },
    })

    const res = await listClasses(teacherA.token)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })

  it('includes schedules in response ordered by dayOfWeek then startTime', async () => {
    await prisma.danceClass.create({
      data: {
        type: 'SALSA',
        level: 'MEDIO',
        teacherId: teacherA.id,
        active: true,
        schedules: {
          create: [
            { dayOfWeek: 3, startTime: '19:00', endTime: '20:00' },
            { dayOfWeek: 1, startTime: '18:00', endTime: '19:00' },
            { dayOfWeek: 1, startTime: '20:00', endTime: '21:00' },
          ],
        },
      },
    })

    const res = await listClasses(teacherA.token)
    expect(res.status).toBe(200)
    expect(res.body[0].schedules).toHaveLength(3)
    // Monday before Wednesday
    expect(res.body[0].schedules[0].dayOfWeek).toBe(1)
    expect(res.body[0].schedules[0].startTime).toBe('18:00')
    // Monday second slot
    expect(res.body[0].schedules[1].dayOfWeek).toBe(1)
    expect(res.body[0].schedules[1].startTime).toBe('20:00')
    // Wednesday
    expect(res.body[0].schedules[2].dayOfWeek).toBe(3)
  })

  it('includes displayName in response', async () => {
    await prisma.danceClass.create({
      data: {
        type: 'BACHATA',
        level: 'AVANZADO',
        teacherId: teacherA.id,
        active: true,
        schedules: { create: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }] },
      },
    })

    const res = await listClasses(teacherA.token)
    expect(res.status).toBe(200)
    expect(res.body[0].displayName).toBe('Bachata avanzado')
  })

  it('uses custom name as displayName when present', async () => {
    await prisma.danceClass.create({
      data: {
        name: 'Mi clase de salsa',
        type: 'SALSA',
        level: 'MEDIO',
        teacherId: teacherA.id,
        active: true,
        schedules: { create: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }] },
      },
    })

    const res = await listClasses(teacherA.token)
    expect(res.status).toBe(200)
    expect(res.body[0].displayName).toBe('Mi clase de salsa')
  })
})

// ---------------------------------------------------------------------------
// Tests: Get single class
// ---------------------------------------------------------------------------

describe('GET /classes/:id', () => {
  it('returns a class owned by the teacher', async () => {
    const cls = await prisma.danceClass.create({
      data: {
        type: 'SALSA',
        level: 'MEDIO',
        teacherId: teacherA.id,
        active: true,
        schedules: { create: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }] },
      },
    })

    const res = await request(app)
      .get(`/classes/${cls.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)

    expect(res.status).toBe(200)
    expect(res.body.type).toBe('SALSA')
  })

  it('returns 404 for another teacher\'s class', async () => {
    const cls = await prisma.danceClass.create({
      data: {
        type: 'SALSA',
        level: 'MEDIO',
        teacherId: teacherB.id,
        active: true,
        schedules: { create: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }] },
      },
    })

    const res = await request(app)
      .get(`/classes/${cls.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('class not found')
  })

  it('returns 404 for inactive class', async () => {
    const cls = await prisma.danceClass.create({
      data: {
        type: 'SALSA',
        level: 'MEDIO',
        teacherId: teacherA.id,
        active: false,
        schedules: { create: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }] },
      },
    })

    const res = await request(app)
      .get(`/classes/${cls.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)

    expect(res.status).toBe(404)
  })

  it('returns 404 for non-existent class', async () => {
    const res = await request(app)
      .get('/classes/999999')
      .set('Authorization', `Bearer ${teacherA.token}`)

    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Tests: Update class
// ---------------------------------------------------------------------------

describe('PUT /classes/:id', () => {
  it('updates own class fields and replaces schedules transactionally', async () => {
    const cls = await prisma.danceClass.create({
      data: {
        name: 'Old name',
        type: 'SALSA',
        level: 'INICIO',
        teacherId: teacherA.id,
        active: true,
        schedules: {
          create: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }],
        },
      },
    })

    const res = await request(app)
      .put(`/classes/${cls.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)
      .send({
        name: 'New name',
        type: 'BACHATA',
        level: 'AVANZADO',
        schedules: [
          { dayOfWeek: 2, startTime: '19:00', endTime: '20:00' },
          { dayOfWeek: 4, startTime: '19:00', endTime: '20:00' },
        ],
      })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('New name')
    expect(res.body.type).toBe('BACHATA')
    expect(res.body.level).toBe('AVANZADO')
    expect(res.body.displayName).toBe('New name')
    expect(res.body.schedules).toHaveLength(2)
    expect(res.body.schedules.map((s: { dayOfWeek: number }) => s.dayOfWeek)).toEqual([2, 4])
  })

  it('cannot update another teacher\'s class', async () => {
    const cls = await prisma.danceClass.create({
      data: {
        type: 'SALSA',
        level: 'MEDIO',
        teacherId: teacherB.id,
        active: true,
        schedules: { create: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }] },
      },
    })

    const res = await request(app)
      .put(`/classes/${cls.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)
      .send({
        type: 'BACHATA',
        level: 'AVANZADO',
        schedules: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }],
      })

    expect(res.status).toBe(404)
  })

  it('returns 404 when updating inactive class', async () => {
    const cls = await prisma.danceClass.create({
      data: {
        type: 'SALSA',
        level: 'MEDIO',
        teacherId: teacherA.id,
        active: false,
        schedules: { create: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }] },
      },
    })

    const res = await request(app)
      .put(`/classes/${cls.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)
      .send({
        type: 'BACHATA',
        level: 'AVANZADO',
        schedules: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }],
      })

    expect(res.status).toBe(404)
  })

  it('rejects update with invalid schedule', async () => {
    const cls = await prisma.danceClass.create({
      data: {
        type: 'SALSA',
        level: 'MEDIO',
        teacherId: teacherA.id,
        active: true,
        schedules: { create: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }] },
      },
    })

    const res = await request(app)
      .put(`/classes/${cls.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)
      .send({
        type: 'SALSA',
        level: 'MEDIO',
        schedules: [{ dayOfWeek: 1, startTime: '18:00', endTime: '17:00' }], // end before start
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('endTime')
  })
})

// ---------------------------------------------------------------------------
// Tests: Deactivate / Soft-delete class
// ---------------------------------------------------------------------------

describe('DELETE /classes/:id', () => {
  it('soft-deletes (deactivates) own active class', async () => {
    const cls = await prisma.danceClass.create({
      data: {
        type: 'SALSA',
        level: 'MEDIO',
        teacherId: teacherA.id,
        active: true,
        schedules: { create: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }] },
      },
    })

    const res = await request(app)
      .delete(`/classes/${cls.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)

    expect(res.status).toBe(204)

    // Verify it is soft-deleted — class should not appear in active list
    const listRes = await listClasses(teacherA.token)
    expect(listRes.body.some((c: { id: number }) => c.id === cls.id)).toBe(false)

    // But still exists in DB with active=false
    const found = await prisma.danceClass.findUnique({ where: { id: cls.id } })
    expect(found?.active).toBe(false)
  })

  it('returns 404 when trying to delete another teacher\'s class', async () => {
    const cls = await prisma.danceClass.create({
      data: {
        type: 'SALSA',
        level: 'MEDIO',
        teacherId: teacherB.id,
        active: true,
        schedules: { create: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }] },
      },
    })

    const res = await request(app)
      .delete(`/classes/${cls.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)

    expect(res.status).toBe(404)
  })

  it('returns 404 when trying to delete an already inactive class', async () => {
    const cls = await prisma.danceClass.create({
      data: {
        type: 'SALSA',
        level: 'MEDIO',
        teacherId: teacherA.id,
        active: false,
        schedules: { create: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }] },
      },
    })

    const res = await request(app)
      .delete(`/classes/${cls.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)

    expect(res.status).toBe(404)
  })

  it('preserves schedule entries after deactivation (for audit/history)', async () => {
    const cls = await prisma.danceClass.create({
      data: {
        type: 'SALSA',
        level: 'MEDIO',
        teacherId: teacherA.id,
        active: true,
        schedules: {
          create: [
            { dayOfWeek: 1, startTime: '18:00', endTime: '19:00' },
            { dayOfWeek: 3, startTime: '18:00', endTime: '19:00' },
          ],
        },
      },
    })

    await request(app)
      .delete(`/classes/${cls.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)

    const schedules = await prisma.classScheduleEntry.findMany({ where: { classId: cls.id } })
    expect(schedules).toHaveLength(2)
  })
})