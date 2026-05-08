import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ConfirmDialog from '../components/confirm-dialog'

afterEach(() => {
  cleanup()
})

const defaultProps = {
  title: 'Desactivar alumno',
  description: '¿Estás seguro de que querés desactivar este alumno?',
  confirmLabel: 'Desactivar',
  cancelLabel: 'Cancelar',
  tone: 'danger' as const,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

function renderDialog(overrides: Partial<typeof defaultProps & { open: boolean }> = {}) {
  const props = { ...defaultProps, open: true, ...overrides }
  return render(<ConfirmDialog {...props} />)
}

describe('ConfirmDialog', () => {
  it('renders title and description when open=true', () => {
    renderDialog()
    expect(screen.getByText('Desactivar alumno')).toBeInTheDocument()
    expect(
      screen.getByText('¿Estás seguro de que querés desactivar este alumno?')
    ).toBeInTheDocument()
  })

  it('does not render when open=false', () => {
    renderDialog({ open: false })
    expect(screen.queryByText('Desactivar alumno')).not.toBeInTheDocument()
  })

  it('has role="dialog", aria-modal="true", aria-labelledby and aria-describedby', () => {
    renderDialog()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    const labelledById = dialog.getAttribute('aria-labelledby')
    const describedById = dialog.getAttribute('aria-describedby')

    expect(labelledById).toBeTruthy()
    expect(describedById).toBeTruthy()

    // Verify the IDs point to real DOM elements that contain the expected text
    const titleEl = document.getElementById(labelledById!)
    const descEl = document.getElementById(describedById!)

    expect(titleEl).not.toBeNull()
    expect(descEl).not.toBeNull()
    expect(titleEl?.textContent).toBe('Desactivar alumno')
    expect(descEl?.textContent).toBe('¿Estás seguro de que querés desactivar este alumno?')
  })

  it('moves focus to the Cancel button when opened', async () => {
    renderDialog()
    // Focus shift happens in a setTimeout(0) — wait a tick
    await new Promise((r) => setTimeout(r, 10))
    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' })
    expect(document.activeElement).toBe(cancelBtn)
  })

  it('calls onCancel when Escape is pressed (not onConfirm)', async () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    renderDialog({ onCancel, onConfirm })

    const user = userEvent.setup()
    await user.keyboard('{Escape}')

    expect(onCancel).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls onCancel when backdrop is clicked with tone="default"', async () => {
    const onCancel = vi.fn()
    renderDialog({ tone: 'default', onCancel })

    const user = userEvent.setup()
    // The backdrop is the aria-hidden sibling div of the dialog panel
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement
    await user.click(backdrop)

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('does NOT call onCancel when backdrop is clicked with tone="danger"', async () => {
    const onCancel = vi.fn()
    renderDialog({ tone: 'danger', onCancel })

    const user = userEvent.setup()
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement
    await user.click(backdrop)

    expect(onCancel).not.toHaveBeenCalled()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn()
    renderDialog({ onConfirm })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Desactivar' }))

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn()
    renderDialog({ onCancel })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCancel).toHaveBeenCalledOnce()
  })
})
