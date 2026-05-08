import { type RefObject, useEffect } from 'react'

/**
 * Traps keyboard focus inside `containerRef` while `isActive` is true.
 *
 * When the user presses Tab or Shift+Tab, focus cycles through all
 * focusable descendants of the container instead of leaving it.
 * The listener is removed when `isActive` becomes false or the
 * component unmounts.
 */

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean
): void {
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const container = containerRef.current
      if (!container) return

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.closest('[hidden]'))

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey) {
        // Shift+Tab: if focus is at the first element, wrap to last
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else {
        // Tab: if focus is at the last element, wrap to first
        if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef, isActive])
}
