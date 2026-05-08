/**
 * TopBar — barra superior visible solo en pantallas < lg (mobile/tablet).
 *
 * Muestra el botón hamburguesa a la izquierda y el nombre de la app al centro.
 * En pantallas lg: el sidebar fijo reemplaza esta barra (lg:hidden).
 */

interface TopBarProps {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header
      className="lg:hidden flex h-14 items-center border-b border-gray-200 bg-white px-4"
      role="banner"
    >
      {/* Hamburger button */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú"
        className="mr-3 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        {/* 3-line hamburger SVG — más limpio que el carácter Unicode ☰ */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <rect x="2" y="4" width="16" height="2" rx="1" />
          <rect x="2" y="9" width="16" height="2" rx="1" />
          <rect x="2" y="14" width="16" height="2" rx="1" />
        </svg>
      </button>

      {/* App name centered — flex-1 en el span empuja el nombre al centro visual */}
      <span className="flex-1 text-center text-base font-bold text-gray-900 tracking-tight">
        SBKAcademy
      </span>

      {/* Spacer para balancear el botón izquierdo y mantener el nombre centrado */}
      <div className="w-10" aria-hidden="true" />
    </header>
  )
}
