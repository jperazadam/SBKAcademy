import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function signToken(user: { id: number; email: string; name: string; role: Role }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '24h' }
  )
}

// ---------------------------------------------------------------------------
// register — handles POST /auth/register
// ---------------------------------------------------------------------------

/**
 * register — public endpoint to create a new account.
 *
 * Accepts: { email, password, name, role }
 * Returns 201 with { token, user: { id, email, name, role } } on success.
 * Returns 400 on validation failure (missing fields, short password, invalid role).
 * Returns 409 if email already exists.
 */
export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name, role } = req.body

  // --- 1. Input validation ---
  if (!email || !password || !name || !role) {
    res.status(400).json({ error: 'email, password, name y role son requeridos.' })
    return
  }

  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' })
    return
  }

  const VALID_ROLES: Role[] = ['professor', 'student']
  if (!VALID_ROLES.includes(role as Role)) {
    res.status(400).json({ error: 'El rol debe ser "professor" o "student".' })
    return
  }

  try {
    // --- 2. Hash password (cost 10 per design decision) ---
    const hashedPassword = await bcrypt.hash(password as string, 10)

    // --- 3. Create user ---
    const user = await prisma.user.create({
      data: {
        email: (email as string).trim(),
        password: hashedPassword,
        name: (name as string).trim(),
        role: role as Role,
      },
    })

    // --- 4. Sign JWT and return ---
    const token = signToken(user)

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (err: unknown) {
    // Prisma unique constraint violation — email already exists
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      res.status(409).json({ error: 'Ya existe una cuenta con ese email.' })
      return
    }
    console.error('[auth-controller] register error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// ---------------------------------------------------------------------------
// login — handles POST /auth/login
// ---------------------------------------------------------------------------

/**
 * login — handles POST /auth/login
 *
 * Security decisions explained:
 *
 * 1. Same 401 message for "email not found" and "wrong password".
 *    Returning different messages would let an attacker enumerate valid emails
 *    through trial and error (user-enumeration attack).
 *
 * 2. bcrypt.compare is used even when the user is not found (by comparing
 *    against a dummy hash). This prevents a timing-based side-channel that
 *    would otherwise reveal whether an email exists: if we returned instantly
 *    for non-existent users but took ~100ms for bcrypt on existing ones,
 *    an attacker could tell them apart by measuring response time.
 *
 * 3. JWT payload now contains {id, email, name, role} — role is needed for
 *    role-based access control on the client and for requireRole middleware.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body

  // --- 1. Input validation ---
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' })
    return
  }

  try {
    // --- 2. Look up the user ---
    const user = await prisma.user.findUnique({ where: { email } })

    // --- 3. Verify password (bcryptjs compares plain text against the stored hash) ---
    // We deliberately fall through to bcrypt.compare even if user is null so
    // the response time is similar whether or not the email exists.
    const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012346'
    const passwordMatch = await bcrypt.compare(password, user?.password ?? DUMMY_HASH)

    if (!user || !passwordMatch) {
      res.status(401).json({ error: 'Email o contraseña incorrectos.' })
      return
    }

    // --- 4. Sign the JWT (includes role) ---
    const token = signToken(user)

    // --- 5. Return token + safe user object (no password field) ---
    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (err) {
    console.error('[auth-controller] login error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
