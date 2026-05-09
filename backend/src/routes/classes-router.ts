import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth'
import { requireRole } from '../middleware/require-role'
import {
  listClasses,
  getClass,
  createClass,
  updateClass,
  deactivateClass,
} from '../controllers/classes-controller'

const router = Router()

// All class routes require authentication AND professor role — REQ-13
router.use(requireAuth, requireRole('professor'))

// GET /classes — list all active classes for the authenticated teacher
router.get('/', listClasses)

// POST /classes — create a new class
router.post('/', createClass)

// GET /classes/:id — get a single class (only if owned by teacher and active)
router.get('/:id', getClass)

// PUT /classes/:id — update a class with transactional schedule replacement
router.put('/:id', updateClass)

// DELETE /classes/:id — soft-delete (set active=false)
router.delete('/:id', deactivateClass)

export default router
