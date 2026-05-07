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

function makeToken(user: { id: number; email: string; name: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  )
}

// ---------------------------------------------------------------------------
// Seed database before running tests
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // Ensure clean slate
  await prisma.student.deleteMany({ where: {} })
  await prisma.user.deleteMany({ where: {} })

  const passwordHash = await bcrypt.hash('password123', 10)

  const userA = await prisma.user.create({
    data: { email: 'teacher-a@test.com', password: passwordHash, name: 'Teacher A' },
  })
  const userB = await prisma.user.create({
    data: { email: 'teacher-b@test.com', password: passwordHash, name: 'Teacher B' },
  })

  teacherA = { id: userA.id, token: makeToken(userA) }
  teacherB = { id: userB.id, token: makeToken(userB) }
})

afterAll(async () => {
  await prisma.student.deleteMany({ where: {} })
  await prisma.user.deleteMany({ where: {} })
  await prisma.$disconnect()
})

// ---------------------------------------------------------------------------
// Helper: create a student for a teacher
// ---------------------------------------------------------------------------

async function createStudent(token: string, data: object) {
  return request(app)
    .post('/students')
    .set('Authorization', `Bearer ${token}`)
    .send(data)
}

async function listStudents(token: string) {
  return request(app)
    .get('/students')
    .set('Authorization', `Bearer ${token}`)
}

// ---------------------------------------------------------------------------
// Tests: 401 Unauthenticated access
// ---------------------------------------------------------------------------

describe('Unauthenticated access returns 401', () => {
  for (const [method, path] of [
    ['GET', '/students'],
    ['POST', '/students'],
    ['GET', '/students/999'],
    ['PUT', '/students/999'],
    ['DELETE', '/students/999'],
  ] as const) {
    it(`${method} ${path} without token → 401`, async () => {
      let req = request(app)[method.toLowerCase()](path)
      const res = await req
      expect(res.status).toBe(401)
      expect(res.body).toEqual({ error: 'Unauthorized' })
    })
  }
})

// ---------------------------------------------------------------------------
// Tests: Create student
// ---------------------------------------------------------------------------

describe('POST /students', () => {
  it('creates a student with valid data', async () => {
    const res = await createStudent(teacherA.token, {
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      email: 'john@example.com',
    })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      email: 'john@example.com',
      teacherId: teacherA.id,
      active: true,
    })
  })

  it('creates a student without email (optional)', async () => {
    const res = await createStudent(teacherA.token, {
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '0987654321',
    })
    expect(res.status).toBe(201)
    expect(res.body.email).toBeNull()
  })

  it('rejects missing firstName', async () => {
    const res = await createStudent(teacherA.token, {
      lastName: 'Doe',
      phone: '1234567890',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('firstName')
  })

  it('rejects missing lastName', async () => {
    const res = await createStudent(teacherA.token, {
      firstName: 'John',
      phone: '1234567890',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('lastName')
  })

  it('rejects missing phone', async () => {
    const res = await createStudent(teacherA.token, {
      firstName: 'John',
      lastName: 'Doe',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('phone')
  })

  it('rejects empty firstName', async () => {
    const res = await createStudent(teacherA.token, {
      firstName: '   ',
      lastName: 'Doe',
      phone: '1234567890',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('firstName')
  })

  it('rejects empty phone', async () => {
    const res = await createStudent(teacherA.token, {
      firstName: 'John',
      lastName: 'Doe',
      phone: '  ',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('phone')
  })

  it('rejects invalid email format', async () => {
    const res = await createStudent(teacherA.token, {
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      email: 'not-an-email',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('email')
  })

  it('accepts empty string email (treated as omitted)', async () => {
    const res = await createStudent(teacherA.token, {
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      email: '',
    })
    expect(res.status).toBe(201)
    expect(res.body.email).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Tests: List students — active only, teacher-scoped
// ---------------------------------------------------------------------------

describe('GET /students', () => {
  beforeEach(async () => {
    // Clean up students created in this describe block
    await prisma.student.deleteMany({ where: { teacherId: teacherA.id } })
  })

  it('returns only active students owned by the teacher', async () => {
    const active = await prisma.student.create({
      data: { firstName: 'Active', lastName: 'Student', phone: '111', teacherId: teacherA.id, active: true },
    })
    await prisma.student.create({
      data: { firstName: 'Inactive', lastName: 'Student', phone: '222', teacherId: teacherA.id, active: false },
    })

    const res = await listStudents(teacherA.token)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].firstName).toBe('Active')
  })

  it('does not return another teacher\'s students', async () => {
    await prisma.student.create({
      data: { firstName: 'Other Teacher', lastName: 'Student', phone: '333', teacherId: teacherB.id, active: true },
    })

    const res = await listStudents(teacherA.token)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Tests: Get single student
// ---------------------------------------------------------------------------

describe('GET /students/:id', () => {
  it('returns a student owned by the teacher', async () => {
    const student = await prisma.student.create({
      data: { firstName: 'GetMe', lastName: 'Student', phone: '111', teacherId: teacherA.id, active: true },
    })

    const res = await request(app)
      .get(`/students/${student.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)

    expect(res.status).toBe(200)
    expect(res.body.firstName).toBe('GetMe')
  })

  it('returns 404 for another teacher\'s student', async () => {
    const student = await prisma.student.create({
      data: { firstName: 'Other', lastName: 'Student', phone: '222', teacherId: teacherB.id, active: true },
    })

    const res = await request(app)
      .get(`/students/${student.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('student not found')
  })

  it('returns 404 for inactive student', async () => {
    const student = await prisma.student.create({
      data: { firstName: 'Inactive', lastName: 'Student', phone: '333', teacherId: teacherA.id, active: false },
    })

    const res = await request(app)
      .get(`/students/${student.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)

    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Tests: Update student
// ---------------------------------------------------------------------------

describe('PUT /students/:id', () => {
  it('updates own student fields', async () => {
    const student = await prisma.student.create({
      data: { firstName: 'OldName', lastName: 'Student', phone: '111', teacherId: teacherA.id, active: true },
    })

    const res = await request(app)
      .put(`/students/${student.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)
      .send({ firstName: 'NewName', lastName: 'Student', phone: '111' })

    expect(res.status).toBe(200)
    expect(res.body.firstName).toBe('NewName')
    // teacherId should remain unchanged
    expect(res.body.teacherId).toBe(teacherA.id)
  })

  it('cannot update another teacher\'s student', async () => {
    const student = await prisma.student.create({
      data: { firstName: 'Other', lastName: 'Student', phone: '222', teacherId: teacherB.id, active: true },
    })

    const res = await request(app)
      .put(`/students/${student.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)
      .send({ firstName: 'Hacked', lastName: 'Name', phone: '999' })

    expect(res.status).toBe(404)
  })

  it('rejects update with missing required fields', async () => {
    const student = await prisma.student.create({
      data: { firstName: 'Valid', lastName: 'Student', phone: '111', teacherId: teacherA.id, active: true },
    })

    const res = await request(app)
      .put(`/students/${student.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)
      .send({ firstName: '', lastName: 'Student', phone: '111' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('firstName')
  })
})

// ---------------------------------------------------------------------------
// Tests: Delete / Deactivate student
// ---------------------------------------------------------------------------

describe('DELETE /students/:id', () => {
  it('soft-deletes (deactivates) own active student', async () => {
    const student = await prisma.student.create({
      data: { firstName: 'ToDelete', lastName: 'Student', phone: '111', teacherId: teacherA.id, active: true },
    })

    const res = await request(app)
      .delete(`/students/${student.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)

    expect(res.status).toBe(204)

    // Verify it is soft-deleted — student should not appear in active list
    const listRes = await listStudents(teacherA.token)
    expect(listRes.body.some((s: { id: number }) => s.id === student.id)).toBe(false)

    // But still exists in DB with active=false
    const found = await prisma.student.findUnique({ where: { id: student.id } })
    expect(found?.active).toBe(false)
  })

  it('returns 404 when trying to delete another teacher\'s student', async () => {
    const student = await prisma.student.create({
      data: { firstName: 'Other', lastName: 'Student', phone: '222', teacherId: teacherB.id, active: true },
    })

    const res = await request(app)
      .delete(`/students/${student.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)

    expect(res.status).toBe(404)
  })

  it('returns 404 when trying to delete an already inactive student', async () => {
    const student = await prisma.student.create({
      data: { firstName: 'AlreadyInactive', lastName: 'Student', phone: '333', teacherId: teacherA.id, active: false },
    })

    const res = await request(app)
      .delete(`/students/${student.id}`)
      .set('Authorization', `Bearer ${teacherA.token}`)

    expect(res.status).toBe(404)
  })
})