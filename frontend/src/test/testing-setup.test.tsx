import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

describe('testing-setup', () => {
  it('renders a React component with DOM queries', () => {
    render(<div data-testid="test-element">Hello from test</div>)
    expect(screen.getByTestId('test-element')).toBeInTheDocument()
    expect(screen.getByTestId('test-element')).toHaveTextContent('Hello from test')
  })
})