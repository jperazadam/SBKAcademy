import api from './api'
import type { Student } from '../types/student'

/**
 * List all students enrolled in the authenticated professor's classes.
 * Returns [] until the enrollment feature is implemented.
 */
export async function listStudents(): Promise<Student[]> {
  const response = await api.get<Student[]>('/students')
  return response.data
}
