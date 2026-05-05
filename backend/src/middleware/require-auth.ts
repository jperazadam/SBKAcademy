import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Shape of the data we embed inside the JWT payload.
interface JwtPayload {
  id: number
  email: string
  name: string
}

/**
 * requireAuth — middleware that protects routes behind a valid JWT.
 *
 * Why a middleware instead of inline logic?
 * - Single place to change auth behaviour (e.g. switch from JWT to sessions).
 * - Any route can opt-in with a one-liner: router.get('/...', requireAuth, handler).
 *
 * Flow:
 *  1. Read the Authorization header.
 *  2. Reject immediately if it is missing or malformed.
 *  3. Verify the token's signature and expiry with jwt.verify().
 *  4. On success, attach the decoded payload to req.user and call next().
 *  5. On any failure, return 401 — intentionally vague to avoid leaking info.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']

  // Header must be present and follow the "Bearer <token>" format.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    // jwt.verify throws if the token is expired, tampered, or signed with a
    // different secret — we catch all those cases together on purpose.
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload

    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
    }

    next()
  } catch {
    // Do NOT distinguish between "expired" and "invalid signature" to the
    // client — revealing that difference could help an attacker.
    res.status(401).json({ error: 'Unauthorized' })
  }
}
