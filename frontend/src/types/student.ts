/**
 * Student DTO matching the backend API contract.
 * UI text is in Spanish; code identifiers are in English.
 *
 * Form input types (CreateStudentInput, UpdateStudentInput) removed — student
 * creation and editing is not part of this version of the app (REQ-21).
 */

export interface Student {
  id: number
  firstName: string
  lastName: string
  phone: string
  email: string | null
  teacherId: number
  active: boolean
  createdAt: string
  updatedAt: string
}
