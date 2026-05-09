import { Request, Response, NextFunction } from 'express'
import { Role } from '@prisma/client'

/**
 * requireRole — middleware factory that enforces role-based access control.
 *
 * Must be used AFTER requireAuth (requireAuth populates req.user).
 *
 * Returns 401 if req.user or req.user.role is missing (defensive guard —
 * should never happen if requireAuth ran correctly).
 * Returns 403 if the user's role is not in the allowed list.
 * Calls next() if the role is allowed.
 */
export function requireRole(...allowed: Role[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    const user = req.user
    if (!user || !user.role) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    if (!allowed.includes(user.role)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    next()
  }
}
