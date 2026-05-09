import { describe, it, expect } from 'vitest'
import { decodeJwt } from '../utils/decode-jwt'

/**
 * Helper: builds a minimal JWT with the given payload.
 * The header and signature are fake — decode-jwt only reads the middle segment.
 */
function buildToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
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
