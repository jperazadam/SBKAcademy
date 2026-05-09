# Spec: auth-with-roles-and-registration

## 1. Propósito y audiencia

Este spec define el contrato de comportamiento para la introducción de autenticación con roles en SBKAcademy. Establece los requisitos funcionales y no funcionales, el modelo de datos resultante, el contrato de la API y los escenarios de aceptación que el agente `sdd-apply` debe implementar y el agente `sdd-verify` debe validar. El usuario final (instructor de bachata) también puede leerlo para entender qué cambia y por qué.

---

## 2. Requisitos funcionales

| # | Requisito |
|---|-----------|
| REQ-1 | El sistema MUST exponer `POST /auth/register` como endpoint público que acepta `{ email, password, name, role }` y devuelve `{ token, user: { id, email, name, role } }` con status 201. |
| REQ-2 | El campo `role` en `POST /auth/register` MUST aceptar únicamente los valores `professor` o `student`; cualquier otro valor MUST devolver 400. |
| REQ-3 | La contraseña recibida en registro MUST ser hasheada con bcrypt antes de persistirse; el hash MUST NOT almacenarse en texto plano. |
| REQ-4 | El sistema MUST rechazar el registro con status 409 si el `email` ya existe en la tabla `User`. |
| REQ-5 | El sistema MUST rechazar el registro si la contraseña tiene menos de 8 caracteres, devolviendo 400 con mensaje de error en español. |
| REQ-6 | `POST /auth/login` MUST aceptar `{ email, password }` y devolver `{ token, user: { id, email, name, role } }` con status 200 cuando las credenciales son correctas. |
| REQ-7 | El JWT firmado MUST incluir en su payload `{ id, email, name, role }`; el token MUST tener expiración (mínimo 24 h). |
| REQ-8 | El sistema MUST rechazar el login con status 401 y mensaje en español si el email no existe o la contraseña no coincide; MUST NOT indicar cuál de los dos datos es incorrecto. |
| REQ-9 | El middleware `requireAuth` MUST verificar la firma del JWT y poblar `req.user` con `{ id, email, name, role }`; si el token es inválido o ausente MUST devolver 401. |
| REQ-10 | El middleware `requireRole(...allowed)` MUST componer con `requireAuth` y devolver 403 si `req.user.role` no está en `allowed`. |
| REQ-11 | Las rutas `POST /students`, `PUT /students/:id`, `DELETE /students/:id` MUST NOT existir. Cualquier petición a esas rutas MUST devolver 404. |
| REQ-12 | `GET /students` MUST existir, estar protegida con `requireAuth + requireRole('professor')` y devolver `[]` con status 200 (la lista real se implementa en el cambio de enrollment). |
| REQ-13 | Las rutas de `/classes/*` MUST estar protegidas con `requireAuth + requireRole('professor')`. |
| REQ-14 | El tipo `User` en el schema de Prisma MUST incluir el campo `role` como enum `Role` (valores: `professor`, `student`); la tabla `Student` MUST NOT existir en el schema. |
| REQ-15 | El frontend MUST tener un `AuthContext` que decodifique el JWT una sola vez al montar, exponga `{ user, login, logout }` y sea la única fuente de verdad del usuario autenticado en runtime. |
| REQ-16 | Ningún componente ni página MUST leer `localStorage.getItem('token')` o llamar a `decodeJwt` directamente fuera del `AuthContext` o del interceptor de axios. |
| REQ-17 | El frontend MUST tener una página de registro pública (`/registro`) con un campo toggle/radio para seleccionar `professor` o `student`; el formulario MUST incluir los campos `name`, `email`, `password` y `role`. |
| REQ-18 | Tras un login o registro exitoso, el frontend MUST redirigir: `professor` → `/dashboard`; `student` → `/portal`. |
| REQ-19 | El frontend MUST tener un `RoleRoute` que, además de verificar que el token sea válido, verifique que `role` coincida con el requerido; si no coincide MUST redirigir al shell del rol correcto. |
| REQ-20 | El shell del alumno (`student-layout.tsx`) MUST mostrar únicamente la entrada "Inicio" en el sidebar; la página de inicio del alumno MUST mostrar un saludo personalizado con su nombre. |
| REQ-21 | La página `student-form-page.tsx` y sus rutas `/dashboard/students/new` y `/dashboard/students/:studentId/edit` MUST NOT existir. |
| REQ-22 | `students-page.tsx` MUST mostrar la lista vacía con el copy: "Todavía no tenés alumnos inscriptos a tus clases. Pronto vas a poder ver acá a quién se inscribió." |
| REQ-23 | Los tests del backend (`auth.test.ts`, `students.test.ts`, `classes.test.ts`) MUST compilar y pasar con el nuevo payload `{ id, email, name, role }` en factories de token y seed. |
| REQ-24 | Los tests del frontend MUST cubrir: redirección post-login por rol, `AuthContext`, `RoleRoute`, página de registro y ausencia de `student-form`. |
| REQ-25 | `npm test` MUST pasar en `backend/` y en `frontend/` sin errores. |

---

## 3. Requisitos no funcionales

| # | Requisito |
|---|-----------|
| NFR-1 | Contraseñas MUST hashearse con bcrypt con un cost factor ≥ 10. El hash MUST NOT aparecer en logs, respuestas de API ni payloads de error. |
| NFR-2 | El secreto JWT MUST leerse de variable de entorno (`JWT_SECRET`); MUST NOT estar hardcodeado en el código. |
| NFR-3 | Ningún campo PII (`email`, `name`, `password`) MUST aparecer en logs de errores ni en cuerpos de respuesta 4xx/5xx más allá del mensaje de error genérico. |
| NFR-4 | Rate limiting: no se implementa en esta iteración. Riesgo aceptado para MVP; se difiere a Phase 2/3. |
| NFR-5 | El formulario de registro MUST ser accesible por teclado: todos los campos MUST tener `<label>` asociado, los errores MUST anunciarse via `aria-live` o `role="alert"`, y el toggle de rol MUST ser operable con teclado. |
| NFR-6 | Todo el código nuevo MUST estar en TypeScript estricto (`strict: true`); sin `any` explícito en rutas críticas de auth; `req.user` y el payload JWT MUST estar tipados. |

---

## 4. Modelo de datos

### Tabla `User` (nueva forma)

| Campo | Tipo Prisma | Constraints |
|-------|-------------|-------------|
| `id` | `Int` | `@id @default(autoincrement())` |
| `email` | `String` | `@unique` — MUST NOT ser nulo |
| `password` | `String` | hash bcrypt — MUST NOT ser nulo |
| `name` | `String` | MUST NOT ser nulo |
| `role` | `Role` (enum) | `professor \| student` — MUST NOT ser nulo |
| `createdAt` | `DateTime` | `@default(now())` |
| `danceClasses` | relación | `DanceClass[]` — solo usada por profesores; vacía para alumnos |

### Enum `Role`

```
professor
student
```

### Tabla `Student`

MUST NOT existir en el schema después de aplicar la migración. Los datos existentes se descartan (no hay script de migración).

---

## 5. Spec de API

### `POST /auth/register`

- **Auth**: pública (sin token)
- **Request body**: `{ email: string, password: string, name: string, role: "professor" | "student" }`
- **Response 201**: `{ token: string, user: { id: number, email: string, name: string, role: string } }`
- **Response 400**: `{ error: string }` — validación fallida (campo faltante, password < 8 chars, role inválido)
- **Response 409**: `{ error: "Ya existe una cuenta con ese email." }`

### `POST /auth/login`

- **Auth**: pública (sin token)
- **Request body**: `{ email: string, password: string }`
- **Response 200**: `{ token: string, user: { id: number, email: string, name: string, role: string } }`
- **Response 401**: `{ error: "Email o contraseña incorrectos." }`

### `GET /students`

- **Auth**: `requireAuth + requireRole('professor')`
- **Response 200**: `[]` (array vacío; enrollment se implementa en cambio posterior)
- **Response 401**: token ausente o inválido
- **Response 403**: usuario autenticado pero con rol `student`

### Endpoints eliminados

| Método | Ruta | Estado |
|--------|------|--------|
| `POST` | `/students` | MUST NOT existir — 404 |
| `PUT` | `/students/:id` | MUST NOT existir — 404 |
| `DELETE` | `/students/:id` | MUST NOT existir — 404 |

---

## 6. Escenarios

### 6.1 Happy paths

#### Scenario: Registro exitoso como profesor

- GIVEN el usuario no tiene cuenta
- WHEN envía `POST /auth/register` con `{ email, password (≥8 chars), name, role: "professor" }`
- THEN recibe status 201, un JWT válido y `user.role === "professor"`
- AND el hash en DB no coincide con el texto plano de la contraseña

#### Scenario: Registro exitoso como alumno

- GIVEN el usuario no tiene cuenta
- WHEN envía `POST /auth/register` con `{ email, password (≥8 chars), name, role: "student" }`
- THEN recibe status 201, un JWT válido y `user.role === "student"`

#### Scenario: Login exitoso como profesor

- GIVEN existe un `User` con `role: "professor"` y credenciales correctas
- WHEN envía `POST /auth/login` con esas credenciales
- THEN recibe status 200, un JWT que incluye `role: "professor"` en su payload

#### Scenario: Login exitoso como alumno

- GIVEN existe un `User` con `role: "student"` y credenciales correctas
- WHEN envía `POST /auth/login` con esas credenciales
- THEN recibe status 200, un JWT que incluye `role: "student"` en su payload

#### Scenario: Redirección post-login del profesor

- GIVEN un profesor hace login o registro exitoso
- WHEN el frontend recibe el token y decodifica el rol
- THEN el usuario es redirigido a `/dashboard` (shell del profesor)

#### Scenario: Redirección post-login del alumno

- GIVEN un alumno hace login o registro exitoso
- WHEN el frontend recibe el token y decodifica el rol
- THEN el usuario es redirigido a `/portal` (shell del alumno con bienvenida personalizada)

#### Scenario: Shell del alumno muestra bienvenida

- GIVEN un alumno está autenticado y en `/portal`
- WHEN carga la página
- THEN ve su nombre en el saludo y el sidebar muestra únicamente "Inicio"

### 6.2 Edge cases y caminos alternativos

#### Scenario: Registro con email duplicado

- GIVEN ya existe un `User` con `email: "test@test.com"`
- WHEN se envía `POST /auth/register` con el mismo email
- THEN el sistema devuelve 409
- AND el mensaje de error es "Ya existe una cuenta con ese email."

#### Scenario: Registro con contraseña débil

- GIVEN el usuario intenta registrarse
- WHEN envía `password` con menos de 8 caracteres
- THEN el sistema devuelve 400
- AND el mensaje de error indica el mínimo requerido en español

#### Scenario: Registro con rol inválido

- GIVEN el usuario intenta registrarse
- WHEN envía `role: "admin"` u otro valor no permitido
- THEN el sistema devuelve 400 con mensaje de error en español

#### Scenario: Login con contraseña incorrecta

- GIVEN existe un `User` con credenciales conocidas
- WHEN envía `POST /auth/login` con la contraseña incorrecta
- THEN el sistema devuelve 401
- AND el mensaje es "Email o contraseña incorrectos." (sin indicar cuál campo falló)

#### Scenario: Login con email inexistente

- GIVEN no existe ningún `User` con ese email
- WHEN envía `POST /auth/login` con ese email
- THEN el sistema devuelve 401
- AND el mensaje es "Email o contraseña incorrectos."

#### Scenario: Alumno accede a ruta de profesor

- GIVEN un token válido con `role: "student"`
- WHEN se realiza `GET /students` con ese token
- THEN el sistema devuelve 403

#### Scenario: Profesor accede a ruta de alumno en el frontend

- GIVEN un token válido con `role: "professor"` en el frontend
- WHEN navega manualmente a `/portal`
- THEN `RoleRoute` lo redirige a `/dashboard`

#### Scenario: Alumno accede a ruta de profesor en el frontend

- GIVEN un token válido con `role: "student"` en el frontend
- WHEN navega manualmente a `/dashboard`
- THEN `RoleRoute` lo redirige a `/portal`

#### Scenario: Persistencia del token al refrescar la página

- GIVEN un usuario está autenticado y el token está en `localStorage`
- WHEN refresca la página
- THEN `AuthContext` rehidrata el estado desde `localStorage`, el usuario sigue autenticado y en el shell correcto

#### Scenario: Acceso a ruta protegida sin token

- GIVEN no hay token en `localStorage`
- WHEN navega directamente a `/dashboard` o `/portal`
- THEN `PrivateRoute` redirige a `/login`

#### Scenario: Endpoints eliminados devuelven 404

- GIVEN la aplicación está corriendo
- WHEN se envía `POST /students`, `PUT /students/:id` o `DELETE /students/:id`
- THEN el servidor devuelve 404

---

## 7. Criterios de aceptación

El agente `sdd-apply` considera el cambio completo cuando TODOS los siguientes ítems son verdaderos:

- [ ] `POST /auth/register` existe, es público y devuelve 201 con `{ token, user }` incluyendo `role`.
- [ ] `POST /auth/login` devuelve 200 con JWT que incluye `role` en el payload.
- [ ] El JWT contiene `{ id, email, name, role }` y tiene expiración configurada.
- [ ] `requireRole('professor')` devuelve 403 a tokens con `role: "student"`.
- [ ] `GET /students` existe, requiere `requireRole('professor')` y devuelve `[]`.
- [ ] `POST /students`, `PUT /students/:id`, `DELETE /students/:id` devuelven 404.
- [ ] La tabla `Student` no existe en el schema de Prisma ni en la base de datos.
- [ ] La tabla `User` tiene el campo `role` como enum `Role`.
- [ ] Contraseñas se almacenan como hash bcrypt; el texto plano nunca se persiste ni se loguea.
- [ ] `AuthContext` + `useAuth()` existen; ningún componente fuera del contexto/interceptor lee `localStorage.getItem('token')` directamente.
- [ ] La página `/registro` existe con toggle de rol, está accesible por teclado y anuncia errores con `aria-live` o `role="alert"`.
- [ ] El login redirige a `/dashboard` si `role === "professor"` y a `/portal` si `role === "student"`.
- [ ] `RoleRoute` impide que un alumno acceda a rutas de profesor y viceversa.
- [ ] `student-layout.tsx` existe con sidebar solo "Inicio"; página de inicio del alumno muestra bienvenida personalizada.
- [ ] `student-form-page.tsx` y sus rutas no existen.
- [ ] `students-page.tsx` muestra copy explicativo cuando la lista está vacía.
- [ ] `npm test` pasa en `backend/` y en `frontend/` sin errores de compilación ni tests fallidos.
- [ ] Tests de backend cubren: register (ambos roles), login (ambos roles), `requireRole` (200 y 403), endpoints eliminados (404).
- [ ] Tests de frontend cubren: redirección post-login, `AuthContext`, `RoleRoute`, página de registro, ausencia de `student-form`.
