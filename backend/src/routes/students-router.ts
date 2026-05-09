import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth'
import { requireRole } from '../middleware/require-role'
import { listStudents } from '../controllers/students-controller'

const router = Router()

// All student routes require authentication AND professor role.
// Student mutations (POST/PUT/DELETE) are removed — REQ-11.
router.use(requireAuth, requireRole('professor'))

// GET /students — list students for authenticated professor
// Returns [] for now (no enrollment feature yet) — REQ-12
router.get('/', listStudents)

export default router
