// Augment Express's Request type so every route can access req.user
// after the requireAuth middleware has validated the JWT.
//
// The `export {}` keeps this file as a module, and `declare global`
// makes the Express namespace augmentation reliable for ts-node-dev,
// tsc, and Vitest.

import type { Role } from '@prisma/client'

export {}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        email: string
        name: string
        role: Role
      }
    }
  }
}
