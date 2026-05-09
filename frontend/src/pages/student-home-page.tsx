/**
 * StudentHomePage — página de bienvenida para alumnos (/portal).
 *
 * Reads the user's name from AuthContext (no localStorage, no decodeJwt calls).
 * Warm, minimal design: greeting card on bg-background.
 */
import { useAuth } from '../context/auth-context'

function StudentHomePage() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-[60vh] items-start justify-center pt-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm text-center">
        {/* Warm welcome icon */}
        <div className="mb-6 text-5xl" aria-hidden="true">
          🎶
        </div>

        {/* Personalized greeting */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {user?.name ? `Hola, ${user.name}` : 'Hola'}
        </h1>

        {/* Coming-soon message — exact copy from spec REQ-20 */}
        <p className="text-gray-500 text-base leading-relaxed">
          Pronto vas a poder buscar profesores y clases.
        </p>
      </div>
    </div>
  )
}

export default StudentHomePage
