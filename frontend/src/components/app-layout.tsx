/**
 * AppLayout — shell persistente para todas las rutas privadas.
 *
 * En lg: (≥1024px):
 *   - Sidebar fijo a la izquierda (lg:fixed lg:inset-y-0 lg:w-64).
 *   - Contenido principal desplazado con lg:pl-64 para no solaparse.
 *   - TopBar oculta (lg:hidden lo gestiona el propio TopBar).
 *
 * En <lg (mobile/tablet):
 *   - TopBar visible en la parte superior.
 *   - Sidebar fijo oculto.
 *   - MobileDrawer controlado por estado local `drawerOpen`.
 *
 * <Outlet /> de React Router inyecta la página activa en el área de contenido.
 */
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from './top-bar'
import SidebarNav from './sidebar-nav'
import MobileDrawer from './mobile-drawer'

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sidebar fijo — visible solo en lg: ── */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-primary-600">
        {/* Header del sidebar con el nombre de la app */}
        <div className="flex h-16 items-center px-6">
          <span className="text-xl font-bold text-white tracking-tight">SBKAcademy</span>
        </div>
        {/* Nav links y logout */}
        <SidebarNav />
      </div>

      {/* ── Área de contenido principal ── */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar — solo visible en <lg */}
        <TopBar onMenuClick={() => setDrawerOpen(true)} />

        {/* Página activa inyectada por React Router */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Drawer mobile — se monta solo cuando está abierto */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
