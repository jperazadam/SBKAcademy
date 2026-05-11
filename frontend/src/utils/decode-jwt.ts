import type { Role } from '../types/auth'

/**
 * Decodes the payload of a JWT token without verifying the signature.
 * This is safe for reading display data from a token already validated
 * by the backend.
 *
 * Contract for the `role` field:
 * - If `role` is absent from the payload (legacy token issued before this
 *   change), `decodeJwt` returns `null`. The caller MUST treat a null result
 *   as "not authenticated" and force re-login. Legacy tokens MUST be rejected.
 *
 * Returns `null` on any parse error: empty token, wrong number of segments,
 * invalid base64, invalid JSON, or missing `role` field.
 */
export interface JwtPayload {
  id: number
  email: string
  name: string
  role: Role
}

export function decodeJwt(token: string): JwtPayload | null {
  if (!token) return null

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    // atob decodes base64url — replace URL-safe chars before decoding
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    // atob yields a binary string (1 char = 1 byte). The backend emits the
    // payload as UTF-8, so we re-interpret the bytes via TextDecoder to
    // preserve multi-byte characters (accents, ñ, etc.).
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const json = new TextDecoder('utf-8').decode(bytes)
    const payload = JSON.parse(json)

    // Reject legacy tokens that have no role field
    if (!payload.role) return null

    return {
      id: payload.id ?? 0,
      email: payload.email ?? '',
      name: payload.name ?? '',
      role: payload.role as Role,
    }
  } catch {
    return null
  }
}
