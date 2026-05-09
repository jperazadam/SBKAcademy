import { Request, Response } from 'express'

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * listStudents — GET /students
 *
 * Returns an empty array for now. The Student model has been removed from
 * the schema; enrollment is out-of-scope for this phase (REQ-12).
 * When enrollment is implemented in a future phase, this will query
 * the enrollment relation instead.
 */
export async function listStudents(_req: Request, res: Response): Promise<void> {
  res.status(200).json([])
}
