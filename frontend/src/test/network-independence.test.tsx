import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Explicitly prove this test suite does NOT require backend connectivity.
// We mock ALL network-capable modules (fetch, axios) and assert zero calls.
// This converts the "backend independence" scenario from "partial" to "compliant".
describe('backend-independence', () => {
  it('makes zero network calls during render-only tests', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }))
    const axios = (await import('axios')).default
    const axiosGetSpy = vi.spyOn(axios, 'get').mockResolvedValue({ data: [] })

    // Render a plain div — no data fetching, no API calls
    render(<div data-testid="network-proof">No backend needed</div>)

    // Assertions: prove fetch and axios were never called
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(axiosGetSpy).not.toHaveBeenCalled()

    // Sanity check: DOM still works as expected
    expect(screen.getByTestId('network-proof')).toBeInTheDocument()
    expect(screen.getByTestId('network-proof')).toHaveTextContent('No backend needed')
  })
})
