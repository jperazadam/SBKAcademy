import { Router } from 'express'
import { login, register } from '../controllers/auth-controller'

// Why a separate router file instead of defining the route in index.ts?
// - Keeps index.ts as a thin "composition root" (it only wires things together).
// - Each resource (auth, students, ...) owns its own router — easy to add,
//   move, or version independently (e.g. /v2/auth/login later).

const router = Router()

// POST /auth/login — public entry point
router.post('/login', login)

// POST /auth/register — public entry point for new account creation
router.post('/register', register)

export default router
