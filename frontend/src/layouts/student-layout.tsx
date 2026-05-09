/**
 * StudentLayout — shell persistente para las rutas del alumno (/portal/*).
 *
 * Mirrors AppLayout visually (same primary-600 sidebar, same TopBar/MobileDrawer
 * pattern) but the sidebar shows only "Inicio → /portal".
 *
 * Uses the optional `items` prop added to SidebarNav so the component stays DRY.
 */
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from '../components/top-bar'
import SidebarNav from '../components/sidebar-nav'
import MobileDrawer from '../components/mobile-drawer'
import type { NavItem } from '../components/sidebar-nav'

const STUDENT_NAV_ITEMS: NavItem[] = [
  { to: '/portal', label: 'Inicio', end: true },
]

export default function StudentLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sidebar fijo — visible solo en lg: ── */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-primary-600">
        <div className="flex h-16 items-center px-6">
          <span className="text-xl font-bold text-white tracking-tight">SBKAcademy</span>
        </div>
        <SidebarNav items={STUDENT_NAV_ITEMS} />
      </div>

      {/* ── Área de contenido principal ── */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopBar onMenuClick={() => setDrawerOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Drawer mobile — pasa los ítems del alumno */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navItems={STUDENT_NAV_ITEMS}
      />
    </div>
  )
}
