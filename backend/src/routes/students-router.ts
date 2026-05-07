import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth'
import {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} from '../controllers/students-controller'

const router = Router()

// All student routes require authentication
router.use(requireAuth)

// GET /students — list all active students for the authenticated teacher
router.get('/', listStudents)

// POST /students — create a new student
router.post('/', createStudent)

// GET /students/:id — get a single student (only if owned by teacher and active)
router.get('/:id', getStudent)

// PUT /students/:id — update a student's fields (only if owned by teacher and active)
router.put('/:id', updateStudent)

// DELETE /students/:id — soft-delete (set active=false)
router.delete('/:id', deleteStudent)

export default router