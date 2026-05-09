import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/auth-service'
import { useAuth } from '../context/auth-context'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const navigate = useNavigate()
  const auth = useAuth()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await login({ email, password })
      auth.login(response.token)
      navigate(response.user.role === 'professor' ? '/dashboard' : '/portal')
    } catch {
      setErrorMessage('Correo o contraseña incorrectos. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    /* bg-background usa el token semántico definido en theme.css:
       evita valores arbitrarios bg-[#F9FAFB] y centraliza el color
       en un único lugar. Si la paleta cambia, solo se toca theme.css. */
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">

      {/* Card: fondo blanco, sombra suave con anillo de borde tenue.
          w-full + max-w-sm garantiza que en móvil ocupa todo el ancho
          disponible y en desktop se limita a ~384px. */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg ring-1 ring-primary-100 px-8 py-10">

        {/* Acento decorativo: barra de color en la parte superior de la card.
            Usa el degradado primary→accent para introducir la identidad
            visual de forma sutil, sin saturar el formulario. */}
        <div className="h-1 -mx-8 -mt-10 mb-8 rounded-t-2xl bg-gradient-to-r from-primary-600 to-accent-600" />

        {/* Título: primary-600 es el índigo profundo definido en theme.css */}
        <h1 className="text-3xl font-bold text-center text-primary-600 mb-8 tracking-tight">
          SBKAcademy
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Campo email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              /* text-foreground usa el token semántico de theme.css
                 en lugar del valor arbitrario text-[#111827]. */
              className="text-sm font-semibold text-foreground"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              /* focus-visible:ring en vez de focus:ring: la diferencia
                 es que focus-visible solo se activa con teclado/navegación
                 accesible. Con el ratón no aparece el anillo, lo que mejora
                 la experiencia visual sin sacrificar accesibilidad. */
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-base
                         outline-none transition-all duration-150
                         focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-primary-600/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Campo contraseña */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-foreground"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-base
                         outline-none transition-all duration-150
                         focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-primary-600/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {/* Mensaje de error: accent-600 es el rosa intenso, coherente
              con la paleta y más expresivo que el rojo genérico anterior.
              role="alert" hace que lectores de pantalla lo anuncien
              automáticamente cuando aparece. */}
          {errorMessage && (
            <p
              role="alert"
              className="text-sm text-accent-700 bg-accent-50 border border-accent-200
                         rounded-lg px-3 py-2.5"
            >
              {errorMessage}
            </p>
          )}

          {/* Botón principal: primary-600 en reposo, primary-700 al hover.
              disabled:opacity-60 + disabled:cursor-not-allowed cubre el
              estado de carga sin CSS extra.
              focus-visible:ring garantiza la accesibilidad por teclado. */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-60
                       disabled:cursor-not-allowed text-white font-semibold
                       rounded-lg py-3 text-base transition-colors duration-150
                       cursor-pointer focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

          {/* Link al registro */}
          <p className="text-center text-sm text-foreground/60">
            ¿No tenés cuenta?{' '}
            <Link
              to="/registro"
              className="text-primary-600 hover:text-primary-700 font-semibold
                         focus-visible:outline-none focus-visible:underline"
            >
              Registrate
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}

export default LoginPage
