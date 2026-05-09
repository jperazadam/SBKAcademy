/**
 * SidebarNav — lista de NavLinks + botón de logout reutilizable.
 *
 * Intencionalmente NO incluye el encabezado con el nombre de la app.
 * Quien lo usa (AppLayout para el sidebar fijo, MobileDrawer para el panel)
 * es responsable del encabezado de su contenedor.
 *
 * Recibe `onNavigate` opcional: el drawer lo usa para cerrarse tras navegar;
 * el sidebar fijo no lo necesita y lo omite.
 */
import { NavLink, useNavigate } from 'react-router-dom'

export interface NavItem {
  to: string
  label: string
  end?: boolean
}

interface SidebarNavProps {
  onNavigate?: () => void
  items?: NavItem[]
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Inicio', end: true },
  { to: '/dashboard/students', label: 'Alumnos' },
  { to: '/dashboard/classes', label: 'Clases' },
]

export default function SidebarNav({ onNavigate, items }: SidebarNavProps) {
  const navigate = useNavigate()
  const navItems = items ?? DEFAULT_NAV_ITEMS

  function handleLogout() {
    // Si el drawer llama esto, cerrarlo primero para evitar que el focus trap
    // retenga el foco mientras se navega a /login.
    if (onNavigate) onNavigate()
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Navegación principal">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'text-primary-100 hover:bg-primary-500/50 hover:text-white',
              ].join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout button pinned to bottom */}
      <div className="px-3 py-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium
                     text-primary-200 transition-colors duration-150
                     hover:bg-primary-500/50 hover:text-white
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
