import api from './api'
import type { Student, CreateStudentInput, UpdateStudentInput } from '../types/student'

/**
 * List all active students for the authenticated teacher.
 * The backend only returns active students by default.
 */
export async function listStudents(): Promise<Student[]> {
  const response = await api.get<Student[]>('/students')
  return response.data
}

/**
 * Get a single student by ID, scoped to the authenticated teacher.
 */
export async function getStudent(id: number): Promise<Student> {
  const response = await api.get<Student>(`/students/${id}`)
  return response.data
}

/**
 * Create a new student for the authenticated teacher.
 */
export async function createStudent(data: CreateStudentInput): Promise<Student> {
  const response = await api.post<Student>('/students', data)
  return response.data
}

/**
 * Update an existing student owned by the authenticated teacher.
 */
export async function updateStudent(id: number, data: UpdateStudentInput): Promise<Student> {
  const response = await api.put<Student>(`/students/${id}`, data)
  return response.data
}

/**
 * Deactivate a student (soft delete). The student will no longer
 * appear in the default active list. The backend performs active=false.
 */
export async function deactivateStudent(id: number): Promise<void> {
  await api.delete(`/students/${id}`)
}