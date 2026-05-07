import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth'
import {
  listClasses,
  getClass,
  createClass,
  updateClass,
  deactivateClass,
} from '../controllers/classes-controller'

const router = Router()

// All class routes require authentication
router.use(requireAuth)

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