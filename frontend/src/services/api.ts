import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

/**
 * Interceptor de REQUEST — inyecta el token en cada petición saliente.
 *
 * Si hay token en localStorage, añade el header Authorization con el
 * esquema Bearer. Esto libera a cada llamada individual de tener que
 * adjuntar el header manualmente.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Interceptor de RESPONSE — maneja tokens expirados o inválidos.
 *
 * Cuando el backend responde con 401, el token en localStorage ya no es
 * válido (expirado o revocado). Lo eliminamos y forzamos una redirección
 * a /login mediante window.location para salir del contexto de React Router
 * de forma fiable desde fuera de un componente.
 *
 * Usamos window.location.href en lugar de navigate() porque este módulo
 * es un singleton que vive fuera del árbol de componentes React, donde
 * los hooks no están disponibles.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
