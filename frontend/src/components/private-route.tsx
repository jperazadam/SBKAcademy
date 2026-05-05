import { Navigate } from 'react-router-dom'

interface PrivateRouteProps {
  children: React.ReactNode
}

/**
 * Protege rutas que requieren sesión activa.
 *
 * Lee el token de localStorage de forma síncrona — no hace ninguna llamada
 * a la API. La validez real del token la comprueba el backend; si el token
 * existe pero ha expirado, el interceptor de response en api.ts detectará
 * el 401 y redirigirá al login en ese momento.
 *
 * Se usa <Navigate replace> en lugar de <Navigate> para que la ruta
 * protegida no quede en el historial del navegador: si el usuario pulsa
 * "atrás" desde el login no vuelve a una pantalla que no puede ver.
 */
function PrivateRoute({ children }: PrivateRouteProps) {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default PrivateRoute
