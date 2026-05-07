/**
 * Student DTO types matching the backend API contract.
 * UI text is in Spanish; code identifiers are in English.
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

export interface CreateStudentInput {
  firstName: string
  lastName: string
  phone: string
  email?: string
}

export interface UpdateStudentInput {
  firstName: string
  lastName: string
  phone: string
  email?: string
}

export interface StudentError {
  error: string
}