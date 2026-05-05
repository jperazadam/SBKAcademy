# Spec: Autenticación del Profesor (Auth MVP)

## Problema

El frontend ya tiene una pantalla de login funcional y un servicio `auth-service.ts` que llama a `POST /auth/login`, pero el backend no tiene ninguna ruta de autenticación implementada — `backend/src/index.ts` solo expone `/health`. El token JWT que devuelve el login se guarda en `localStorage` pero el cliente HTTP (`api.ts`) nunca lo adjunta a las peticiones posteriores. Además, el dashboard no está protegido: cualquier usuario sin sesión puede navegar directamente a `/dashboard`.

## Alcance

Implementar el flujo completo de autenticación email+contraseña para un profesor:

- **Backend:** endpoint `POST /auth/login` que valida credenciales y devuelve JWT; middleware de protección para rutas autenticadas.
- **Frontend:** interceptor Axios que inyecta el token en cada petición; ruta privada que redirige a `/login` si no hay sesión activa.

Registro de nuevos profesores queda fuera de alcance para este MVP (el profesor se crea directamente en la base de datos o con un seed).

## Historias de usuario

1. **Como profesor**, quiero iniciar sesión con mi correo y contraseña para acceder al panel de gestión de alumnos.
2. **Como profesor autenticado**, quiero que mis peticiones al API lleven mi identidad automáticamente para no tener que adjuntar el token a mano.
3. **Como visitante sin sesión**, quiero ser redirigido a `/login` si intento acceder a `/dashboard` directamente.
4. **Como profesor**, quiero cerrar sesión y que la aplicación me devuelva a la pantalla de login.

## Criterios de aceptación

| # | Criterio |
|---|----------|
| 1 | `POST /auth/login` con credenciales correctas responde HTTP 200 con `{ token, user }` |
| 2 | `POST /auth/login` con contraseña incorrecta responde HTTP 401 con `{ error: "Invalid credentials" }` |
| 3 | `POST /auth/login` con email inexistente responde HTTP 401 con `{ error: "Invalid credentials" }` (mismo mensaje; no revelar si el email existe) |
| 4 | `POST /auth/login` con body incompleto (falta email o password) responde HTTP 400 con `{ error: "email and password are required" }` |
| 5 | El token JWT expira en 7 días |
| 6 | Rutas protegidas sin token responden HTTP 401 con `{ error: "Unauthorized" }` |
| 7 | Rutas protegidas con token válido procesan la petición normalmente |
| 8 | El cliente Axios adjunta automáticamente `Authorization: Bearer <token>` en cada petición cuando hay token en `localStorage` |
| 9 | Navegar a `/dashboard` sin token redirige a `/login` sin renderizar el contenido |
| 10 | El botón "Cerrar sesión" elimina el token y redirige a `/login` |

## Contrato de API

### POST /auth/login

**Request**
```
Content-Type: application/json

{
  "email": "profesor@sbkacademy.com",
  "password": "contraseña_en_texto_plano"
}
```

**Response 200 OK**
```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "profesor@sbkacademy.com",
    "name": "José Iván"
  }
}
```

**Response 400 Bad Request**
```json
{ "error": "email and password are required" }
```

**Response 401 Unauthorized**
```json
{ "error": "Invalid credentials" }
```

---

### Middleware: requireAuth

Se aplica a todas las rutas que requieran sesión activa. Lee el header:
```
Authorization: Bearer <jwt>
```

- Si el header no existe o el token es inválido/expirado → HTTP 401 `{ "error": "Unauthorized" }`
- Si el token es válido → inyecta `req.user = { id, email, name }` y llama `next()`

No hay endpoint de logout en el servidor — el logout es exclusivamente del lado del cliente (eliminar el token de `localStorage`).

## Cambios en base de datos

El modelo `User` en `schema.prisma` ya contiene todos los campos necesarios para este feature:

```prisma
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  password  String    // almacenado como hash bcrypt
  name      String
  createdAt DateTime  @default(now())
  students  Student[]
}
```

**No se requiere ninguna migración de Prisma.**

El campo `password` debe almacenar siempre el hash bcrypt (coste 10). Nunca se persiste ni se devuelve la contraseña en texto plano.

Para el MVP, el profesor se crea mediante un seed script (`backend/prisma/seed.ts`) que hashea la contraseña antes de insertarla.

## Cambios en UI

### Componente: `PrivateRoute`
Nuevo componente wrapper en `frontend/src/components/private-route.tsx`:
- Lee `localStorage.getItem('token')`
- Si no hay token → `<Navigate to="/login" replace />`
- Si hay token → renderiza `{children}`

### Routing en `App.tsx`
```tsx
<Route path="/dashboard" element={
  <PrivateRoute>
    <DashboardPage />
  </PrivateRoute>
} />
```

### Interceptor en `api.ts`
Agregar un interceptor de request a la instancia Axios existente:
```ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Tipos en `auth.ts`
Los tipos `LoginCredentials` y `AuthResponse` ya están definidos correctamente. No requieren cambios.

### `auth-service.ts`
El servicio ya llama a `POST /auth/login` correctamente. No requiere cambios.

### `login-page.tsx`
La lógica de login ya funciona. Mejora opcional: si el interceptor detecta un 401 en una ruta protegida (token expirado), redirigir automáticamente a `/login` y limpiar `localStorage`. Esto se implementa con un interceptor de response en `api.ts`.

## Riesgos y dependencias

| Riesgo | Mitigación |
|--------|------------|
| `JWT_SECRET` no configurado en Railway → el servidor falla al arrancar | Validar al inicio (`if (!process.env.JWT_SECRET) throw new Error(...)`) |
| Token expirado no limpia el `localStorage` → UI queda en estado inconsistente | Interceptor de response 401 en Axios que llama `localStorage.removeItem('token')` y redirige |
| Contraseña almacenada sin hash si el seed se escribe mal | El seed usa `bcrypt.hash` explícitamente antes de `prisma.user.create` |
| CORS demasiado permisivo en producción | Configurar `cors({ origin: process.env.ALLOWED_ORIGIN })` en backend antes del deploy a Railway |

### Variables de entorno requeridas

**backend/.env**
```
DATABASE_URL=postgresql://...   # ya existente
JWT_SECRET=<cadena aleatoria larga>
PORT=3000
```

**frontend/.env**
```
VITE_API_URL=http://localhost:3000   # ya existente
```

## Fuera de alcance

- Registro de nuevos profesores desde la UI
- Recuperación/reset de contraseña
- Autenticación con proveedores externos (Google, etc.)
- Refresh tokens (el token de 7 días es suficiente para el MVP)
- Gestión de múltiples profesores desde el panel
- Rate limiting en el endpoint de login (se añadirá antes del deploy a producción)
- Tests automatizados (se planifican para la Fase 2)
