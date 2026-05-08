/**
 * ConfirmDialog — Modal de confirmación accesible con focus trap.
 *
 * Animación: cuando `open` pasa a true, el componente se monta con las
 * clases de estado inicial (opacity-0, scale-95). Un useEffect con
 * requestAnimationFrame aplicca las clases finales (opacity-100, scale-100)
 * en el siguiente frame de pintura, lo que dispara la transición CSS de
 * Tailwind. Esto es el patrón "mount-then-animate" sin librerías externas.
 */
import { useEffect, useRef, useState } from 'react'
import { useFocusTrap } from '../hooks/use-focus-trap'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  tone: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
  /** Defaults to true when tone === 'default'; false when tone === 'danger' */
  closeOnBackdrop?: boolean
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone,
  onConfirm,
  onCancel,
  closeOnBackdrop,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelBtnRef = useRef<HTMLButtonElement>(null)
  // Capture element that had focus before the dialog opened so we can restore it
  const previousFocusRef = useRef<HTMLElement | null>(null)
  // Controls the CSS transition: false = initial state, true = final state
  const [visible, setVisible] = useState(false)

  // Resolve default for closeOnBackdrop based on tone
  const shouldCloseOnBackdrop = closeOnBackdrop ?? tone !== 'danger'

  useFocusTrap(dialogRef, open)

  // When dialog opens: save current focus, trigger animation, move focus to Cancel
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Mount-then-animate: defer the class swap to the next paint frame
      requestAnimationFrame(() => {
        setVisible(true)
      })
      // Focus Cancel button on next tick so the DOM is ready
      setTimeout(() => {
        cancelBtnRef.current?.focus()
      }, 0)
    } else {
      setVisible(false)
      // Restore focus to the element that triggered the dialog
      previousFocusRef.current?.focus()
      previousFocusRef.current = null
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  const confirmButtonClass =
    tone === 'danger'
      ? 'bg-accent-600 hover:bg-accent-700 text-white'
      : 'bg-primary-600 hover:bg-primary-700 text-white'

  const titleId = 'confirm-dialog-title'
  const descId = 'confirm-dialog-description'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-hidden="false"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={shouldCloseOnBackdrop ? onCancel : undefined}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={`relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl transition-all duration-200 ease-out ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <h2
          id={titleId}
          className="text-lg font-semibold text-foreground"
        >
          {title}
        </h2>
        <p
          id={descId}
          className="mt-2 text-sm text-gray-600"
        >
          {description}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${confirmButtonClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
