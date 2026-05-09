import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/auth-service'
import { useAuth } from '../context/auth-context'
import type { Role } from '../types/auth'

function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const navigate = useNavigate()
  const auth = useAuth()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    // Client-side validation
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    if (!role) {
      setErrorMessage('Elegí un rol para continuar.')
      return
    }

    setIsLoading(true)
    try {
      const response = await register({ name: name.trim(), email, password, role })
      auth.register(response.token)
      navigate(response.user.role === 'professor' ? '/dashboard' : '/portal')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } } }
      if (axiosErr?.response?.status === 409) {
        setErrorMessage(axiosErr.response.data?.error ?? 'Ya existe una cuenta con ese email.')
      } else if (axiosErr?.response?.status === 400) {
        setErrorMessage(axiosErr.response.data?.error ?? 'Error en los datos ingresados.')
      } else {
        setErrorMessage('Ocurrió un error. Intentá de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg ring-1 ring-primary-100 px-8 py-10">

        <div className="h-1 -mx-8 -mt-10 mb-8 rounded-t-2xl bg-gradient-to-r from-primary-600 to-accent-600" />

        <h1 className="text-3xl font-bold text-center text-primary-600 mb-2 tracking-tight">
          SBKAcademy
        </h1>
        <p className="text-center text-foreground/60 text-sm mb-8">
          Creá tu cuenta
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="name"
              className="text-sm font-semibold text-foreground"
            >
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-base
                         outline-none transition-all duration-150
                         focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-primary-600/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Tu nombre y apellido"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-foreground"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-base
                         outline-none transition-all duration-150
                         focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-primary-600/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="tu@correo.com"
            />
          </div>

          {/* Contraseña */}
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
              autoComplete="new-password"
              minLength={8}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          {/* Confirmar contraseña */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-semibold text-foreground"
            >
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-base
                         outline-none transition-all duration-150
                         focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-primary-600/20"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Repetí la contraseña"
            />
          </div>

          {/* Toggle de rol */}
          <fieldset>
            <legend className="text-sm font-semibold text-foreground mb-2">
              Soy...
            </legend>
            <div className="grid grid-cols-2 gap-3">

              {/* Opción: Profesor */}
              <label
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer
                            transition-all duration-150 font-semibold text-sm
                            ${role === 'professor'
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : 'border-gray-200 text-foreground/70 hover:border-primary-300'
                            }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="professor"
                  checked={role === 'professor'}
                  onChange={() => setRole('professor')}
                  className="sr-only"
                />
                Soy profesor
              </label>

              {/* Opción: Alumno */}
              <label
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer
                            transition-all duration-150 font-semibold text-sm
                            ${role === 'student'
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : 'border-gray-200 text-foreground/70 hover:border-primary-300'
                            }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={role === 'student'}
                  onChange={() => setRole('student')}
                  className="sr-only"
                />
                Soy alumno
              </label>

            </div>
          </fieldset>

          {/* Error banner */}
          {errorMessage && (
            <p
              role="alert"
              className="text-sm text-accent-700 bg-accent-50 border border-accent-200
                         rounded-lg px-3 py-2.5"
            >
              {errorMessage}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-60
                       disabled:cursor-not-allowed text-white font-semibold
                       rounded-lg py-3 text-base transition-colors duration-150
                       cursor-pointer focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          >
            {isLoading ? 'Registrando...' : 'Registrarme'}
          </button>

          {/* Link al login */}
          <p className="text-center text-sm text-foreground/60">
            ¿Ya tenés cuenta?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-semibold
                         focus-visible:outline-none focus-visible:underline"
            >
              Iniciá sesión
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}

export default RegisterPage
