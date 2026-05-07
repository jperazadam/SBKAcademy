import api from './api'
import type {
  DanceClass,
  CreateClassInput,
  UpdateClassInput,
} from '../types/class'

/**
 * List all active dance classes for the authenticated teacher.
 * The backend only returns active classes by default.
 */
export async function listClasses(): Promise<DanceClass[]> {
  const response = await api.get<DanceClass[]>('/classes')
  return response.data
}

/**
 * Get a single class by ID, scoped to the authenticated teacher.
 */
export async function getClass(id: number): Promise<DanceClass> {
  const response = await api.get<DanceClass>(`/classes/${id}`)
  return response.data
}

/**
 * Create a new class for the authenticated teacher.
 */
export async function createClass(data: CreateClassInput): Promise<DanceClass> {
  const response = await api.post<DanceClass>('/classes', data)
  return response.data
}

/**
 * Update an existing class owned by the authenticated teacher.
 * Schedules are replaced transactionally on the backend.
 */
export async function updateClass(
  id: number,
  data: UpdateClassInput
): Promise<DanceClass> {
  const response = await api.put<DanceClass>(`/classes/${id}`, data)
  return response.data
}

/**
 * Deactivate a class (soft delete). The class will no longer
 * appear in the default classes list.
 */
export async function deactivateClass(id: number): Promise<void> {
  await api.delete(`/classes/${id}`)
}