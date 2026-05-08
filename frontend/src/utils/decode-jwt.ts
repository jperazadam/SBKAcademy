/**
 * Decodes the payload of a JWT token without verifying the signature.
 * This is safe for reading display data (e.g., the teacher's name) from
 * a token that was already validated by the backend.
 *
 * Contract for missing fields:
 * - If `name` is absent from the payload (legacy token), the returned object
 *   will have `name: ''`. Callers should treat an empty string as "no name
 *   available" and fall back gracefully (e.g., show "Hola" without a name).
 * - Returns `null` on any parse error: empty token, wrong number of segments,
 *   invalid base64, or invalid JSON.
 */
export interface JwtPayload {
  id: number
  email: string
  name: string
}

export function decodeJwt(token: string): JwtPayload | null {
  if (!token) return null

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    // atob decodes base64url — replace URL-safe chars before decoding
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)
    const payload = JSON.parse(json)

    return {
      id: payload.id ?? 0,
      email: payload.email ?? '',
      name: payload.name ?? '',
    }
  } catch {
    return null
  }
}
