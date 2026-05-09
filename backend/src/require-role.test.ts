import request from 'supertest'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import app from './app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const RUN_ID = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`
const EMAIL_SUFFIX = `@requirerole-${RUN_ID}.test.local`

let professorToken: string
let studentToken: string

function makeToken(user: { id: number; email: string; name: string; role: 'professor' | 'student' }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  )
}

async function cleanupOwnRows() {
  await prisma.classScheduleEntry.deleteMany({
    where: { class: { teacher: { email: { endsWith: EMAIL_SUFFIX } } } },
  })
  await prisma.danceClass.deleteMany({
    where: { teacher: { email: { endsWith: EMAIL_SUFFIX } } },
  })
  await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_SUFFIX } } })
}

beforeAll(async () => {
  await cleanupOwnRows()
  const hash = await bcrypt.hash('password123', 10)

  const prof = await prisma.user.create({
    data: { email: `prof${EMAIL_SUFFIX}`, password: hash, name: 'Prof RR', role: 'professor' },
  })
  const stud = await prisma.user.create({
    data: { email: `stud${EMAIL_SUFFIX}`, password: hash, name: 'Stud RR', role: 'student' },
  })

  professorToken = makeToken({ ...prof, role: 'professor' })
  studentToken = makeToken({ ...stud, role: 'student' })
})

afterAll(async () => {
  await cleanupOwnRows()
  await prisma.$disconnect()
})

// ---------------------------------------------------------------------------
// requireRole middleware — covered via GET /classes route
// ---------------------------------------------------------------------------

describe('requireRole middleware', () => {
  it('allows a professor token through to a professor-only route (200)', async () => {
    const res = await request(app)
      .get('/classes')
      .set('Authorization', `Bearer ${professorToken}`)

    expect(res.status).toBe(200)
  })

  it('rejects a student token on a professor-only route with 403', async () => {
    const res = await request(app)
      .get('/classes')
      .set('Authorization', `Bearer ${studentToken}`)

    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request (no token) with 401', async () => {
    const res = await request(app).get('/classes')

    expect(res.status).toBe(401)
  })
})
