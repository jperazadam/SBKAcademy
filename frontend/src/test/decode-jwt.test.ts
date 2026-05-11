import { describe, it, expect } from 'vitest'
import { decodeJwt } from '../utils/decode-jwt'

/**
 * Helper: builds a minimal JWT with the given payload.
 * The header and signature are fake — decode-jwt only reads the middle segment.
 *
 * We encode the payload as UTF-8 bytes before base64 to match what the backend
 * does with `jsonwebtoken`. Using btoa(JSON.stringify(...)) directly would
 * silently encode as Latin-1 and hide the multi-byte bug we are guarding
 * against.
 */
function buildToken(payload: Record<string, unknown>): string {
  const encode = (obj: unknown): string => {
    const bytes = new TextEncoder().encode(JSON.stringify(obj))
    let binary = ''
    for (const b of bytes) binary += String.fromCharCode(b)
    return btoa(binary)
  }
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const body = encode(payload)
  return `${header}.${body}.fakesignature`
}

describe('decodeJwt', () => {
  it('returns the full payload when the token is valid with role', () => {
    const token = buildToken({ id: 42, email: 'teacher@example.com', name: 'Lucía', role: 'professor' })
    const result = decodeJwt(token)
    expect(result).toEqual({ id: 42, email: 'teacher@example.com', name: 'Lucía', role: 'professor' })
  })

  it('returns null for an empty string', () => {
    expect(decodeJwt('')).toBeNull()
  })

  it('returns null for a malformed token (only one segment)', () => {
    expect(decodeJwt('notavalidtoken')).toBeNull()
  })

  it('returns null for a token with invalid base64 in the payload', () => {
    expect(decodeJwt('header.!!!invalid!!!.sig')).toBeNull()
  })

  it('returns null for a legacy token without role field — re-login required', () => {
    // Contract change: tokens without `role` are now rejected (legacy tokens).
    // The SPA must force re-login when this happens.
    const token = buildToken({ id: 7, email: 'old@example.com', name: 'Viejo' })
    const result = decodeJwt(token)
    expect(result).toBeNull()
  })

  it('returns null for a token with no name and no role', () => {
    const token = buildToken({ id: 7, email: 'old@example.com' })
    const result = decodeJwt(token)
    expect(result).toBeNull()
  })

  it('preserves multi-byte UTF-8 characters in the name (accents, ñ)', () => {
    // Regression test: previously decodeJwt used atob() directly and read the
    // resulting binary string as if it were Latin-1, turning "José" into "José".
    const token = buildToken({
      id: 1,
      email: 'jose@example.com',
      name: 'José Iván Peraza Pérez',
      role: 'professor',
    })
    const result = decodeJwt(token)
    expect(result?.name).toBe('José Iván Peraza Pérez')
  })

  it('handles base64url encoding (replaces - and _)', () => {
    // Manually craft a token with base64url chars in the payload segment
    const payload = JSON.stringify({ id: 1, email: 'a@b.com', name: 'Test', role: 'student' })
    // encode as base64url (replace + with - and / with _)
    const base64url = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const token = `header.${base64url}.sig`
    const result = decodeJwt(token)
    expect(result).not.toBeNull()
    expect(result?.name).toBe('Test')
    expect(result?.role).toBe('student')
  })
})
