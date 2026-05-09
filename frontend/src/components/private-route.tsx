import { Navigate, type ReactNode } from 'react-router-dom'
import { useAuth } from '../context/auth-context'

interface PrivateRouteProps {
  children: ReactNode
}

/**
 * Protege rutas que requieren sesión activa.
 *
 * Lee el estado de autenticación desde AuthContext — la única fuente de
 * verdad en runtime. El contexto hidrata desde localStorage en el montaje
 * inicial, así que esta comprobación es síncrona y no requiere una llamada
 * a la API.
 *
 * Se usa <Navigate replace> en lugar de <Navigate> para que la ruta
 * protegida no quede en el historial del navegador: si el usuario pulsa
 * "atrás" desde el login no vuelve a una pantalla que no puede ver.
 *
 * Nota: si `isLoading` llegara a ser true (actualmente siempre es false
 * porque la hidratación es síncrona), no redirigimos — esperamos a que
 * el contexto resuelva antes de decidir.
 */
function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    // Loading state: don't redirect while context is initializing
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default PrivateRoute
