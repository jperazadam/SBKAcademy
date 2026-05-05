import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
 *    NOTE: For this MVP the dummy-compare optimisation is omitted for
 *    readability, but it is documented here so you know it exists.
 *
 * 3. JWT payload contains only {id, email, name} — no password, no role yet.
 *    Keep tokens lean; sensitive info never goes inside a JWT because the
 *    payload is base-64 encoded, not encrypted.
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
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // --- 4. Sign the JWT ---
    // expiresIn: '7d' means the token is valid for 7 days from now.
    // After that, jwt.verify() in requireAuth will throw and return 401.
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    // --- 5. Return token + safe user object (no password field) ---
    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (err) {
    console.error('[auth-controller] login error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
