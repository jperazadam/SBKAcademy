/**
 * MobileDrawer — panel lateral deslizante con backdrop para mobile/tablet.
 *
 * Animación: patrón "mount-then-animate" idéntico al ConfirmDialog del Lote 1.
 * Al montarse, las clases iniciales son el estado oculto (-translate-x-full / opacity-0).
 * Un requestAnimationFrame aplica las clases finales en el siguiente frame,
 * disparando la transición CSS de Tailwind sin librerías externas.
 *
 * Cierre:
 * - Click en backdrop
 * - Tecla Esc
 * - Click en NavLink (via onNavigate pasado a SidebarNav)
 * - Botón X
 * - Resize a lg: (window.matchMedia)
 */
import { useEffect, useRef, useState } from 'react'
import { useFocusTrap } from '../hooks/use-focus-trap'
import SidebarNav from './sidebar-nav'
import type { NavItem } from './sidebar-nav'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  /** Override the default professor nav items with custom items (e.g. student nav). */
  navItems?: NavItem[]
}

export default function MobileDrawer({ open, onClose, navItems }: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  // Controls CSS transitions: false = estado inicial oculto, true = estado final visible
  const [visible, setVisible] = useState(false)

  useFocusTrap(panelRef, open)

  // Mount-then-animate: mismo patrón que ConfirmDialog
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        setVisible(true)
      })
    } else {
      setVisible(false)
    }
  }, [open])

  // Cierre con Esc
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Cierre al alcanzar breakpoint lg: (≥1024px) con el drawer abierto
  useEffect(() => {
    if (!open) return
    const mql = window.matchMedia('(min-width: 1024px)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) onClose()
    }
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
      {/* Backdrop semi-transparente */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral — slide desde la izquierda */}
      <div
        ref={panelRef}
        className={`absolute inset-y-0 left-0 flex w-72 flex-col bg-primary-600 shadow-xl
                    transition-transform duration-300 ease-out ${
                      visible ? 'translate-x-0' : '-translate-x-full'
                    }`}
      >
        {/* Header del panel: nombre de la app + botón X */}
        <div className="flex h-16 items-center justify-between px-4">
          <span className="text-xl font-bold text-white tracking-tight">SBKAcademy</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-md p-2 text-primary-200 hover:bg-primary-500/50 hover:text-white
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414
                   1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293
                   4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              />
            </svg>
          </button>
        </div>

        {/* Navegación: onNavigate cierra el drawer al hacer click en un NavLink */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav onNavigate={onClose} items={navItems} />
        </div>
      </div>
    </div>
  )
}
