import request from 'supertest'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import app from './app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Unique suffix per test run to avoid collisions across parallel runs or
// retries after a failed cleanup (same strategy as students.test.ts).
const RUN_ID = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`
const EMAIL_SUFFIX = `@auth-${RUN_ID}.test.local`

const TEST_EMAIL = `teacher${EMAIL_SUFFIX}`
const TEST_PASSWORD = 'password123'
const TEST_NAME = 'Auth Test Teacher'

async function cleanupOwnRows() {
  await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_SUFFIX } } })
}

beforeAll(async () => {
  await cleanupOwnRows()
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10)
  await prisma.user.create({
    data: { email: TEST_EMAIL, password: passwordHash, name: TEST_NAME },
  })
})

afterAll(async () => {
  await cleanupOwnRows()
  await prisma.$disconnect()
})

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------

describe('POST /auth/login', () => {
  it('returns 200 with a token and safe user object on valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user).toMatchObject({
      email: TEST_EMAIL,
      name: TEST_NAME,
    })
    // password must never appear in the response
    expect(res.body.user.password).toBeUndefined()
  })

  it('JWT payload contains id, email and name', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })

    expect(res.status).toBe(200)

    // Decode without verifying signature so the test is not coupled to
    // JWT_SECRET being available in the test environment.
    // We do check the payload shape, which is what the spec requires.
    const payload = jwt.decode(res.body.token) as Record<string, unknown>

    expect(payload).not.toBeNull()
    expect(payload.id).toBeDefined()
    expect(payload.email).toBe(TEST_EMAIL)
    expect(payload.name).toBe(TEST_NAME)
  })

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrong-password' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
  })

  it('returns 401 on non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: TEST_PASSWORD })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
  })

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ password: TEST_PASSWORD })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('email')
  })

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('password')
  })
})
