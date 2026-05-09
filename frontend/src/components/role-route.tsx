import { Navigate, type ReactNode } from 'react-router-dom'
import { useAuth } from '../context/auth-context'
import type { Role } from '../types/auth'

interface RoleRouteProps {
  allow: Role
  children: ReactNode
}

/**
 * Protects a route by both authentication status and role.
 *
 * - No token / not authenticated → redirect to /login
 * - Authenticated but wrong role → redirect to the correct home for that role:
 *     professor → /dashboard
 *     student   → /portal
 * - Authenticated and correct role → render children
 *
 * Always use <Navigate replace> so the guarded path doesn't stay in history.
 */
function RoleRoute({ allow, children }: RoleRouteProps) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== allow) {
    // Redirect to the correct shell for the user's actual role
    const home = user.role === 'professor' ? '/dashboard' : '/portal'
    return <Navigate to={home} replace />
  }

  return <>{children}</>
}

export default RoleRoute
