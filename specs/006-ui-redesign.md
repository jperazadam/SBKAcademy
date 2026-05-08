# Spec: UI Redesign — Layout Responsive con Sidebar, Dashboard con Métricas y Rediseño de Páginas

## Problema

La interfaz actual tiene coherencia visual limitada: cada página es una isla con su propio header y botón "Volver", no hay navegación persistente, y las confirmaciones destructivas usan `confirm()` nativo del navegador — que rompe la paleta visual, no respeta la tipografía del proyecto y es inconsistente entre sistemas operativos. En mobile no existe ninguna estructura de navegación. El dashboard muestra solo texto estático sin valor real para el profesor. A medida que el proyecto crece (pagos, asistencia, portal del alumno), estas carencias se van a amplificar. Un layout compartido, responsive y un sistema de confirmación propio son la base que todo lo demás necesita.

## Alcance

| En scope | Fuera de scope |
|---|---|
| Layout con sidebar persistente en `lg:` (≥1024px) | Temas oscuros / light-dark toggle |
| Top bar + drawer lateral en `<lg` (mobile/tablet) | Notificaciones o badges en el sidebar |
| `AppLayout` como wrapper de todas las rutas privadas | Modal genérico reutilizable para formularios |
| `NavLink` activo con highlight visual | Rediseño de páginas de formulario (`StudentFormPage`, `ClassFormPage`) |
| `ConfirmDialog` propio con accesibilidad y focus trap | Tests e2e del flujo completo de navegación |
| Reemplazar `confirm()` y `alert()` en StudentsPage y ClassesPage | Notificaciones tipo toast |
| Dashboard con saludo, fecha y métricas reales (alumnos activos, clases activas, próxima clase) | Endpoint `/auth/me` (solo si el nombre no está en el JWT — ver Riesgos) |
| Lista "Próximas clases de la semana" calculada en cliente | Nueva paleta o cambio de tokens de color |
| Buscador en StudentsPage (filtrado en cliente) | |
| Avatar de iniciales con color determinista | |
| Menú `⋯` (ActionMenu) accesible con popover y navegación por teclado | |
| Grid responsive de cards de alumnos (1 col mobile, 2 cols md:) | |
| Chips de día en ClassesPage (D L M X J V S) | |
| Tests unitarios de `ConfirmDialog` | |

## Historias de usuario

- Como profesor, quiero ver la navegación siempre visible en pantallas grandes, para no perder el contexto de dónde estoy y poder cambiar de sección sin buscar un botón "Volver".
- Como profesor en mobile, quiero acceder a la navegación desde un botón hamburguesa, para poder usar la app en mi celular sin que la navegación ocupe espacio permanentemente.
- Como profesor, quiero que las confirmaciones de desactivación tengan el mismo estilo visual que el resto de la app, para que la experiencia no se sienta rota.
- Como profesor, quiero ver en el dashboard cuántos alumnos activos tengo, cuántas clases activas y cuándo es mi próxima clase, para tener un resumen útil al abrir la app.
- Como profesor, quiero buscar alumnos por nombre, teléfono o email en tiempo real, para encontrar a un alumno específico sin tener que recorrer la lista completa.
- Como desarrollador, quiero un componente `ConfirmDialog` reutilizable, para usarlo en pagos, mensualidades y cualquier otra acción destructiva futura sin duplicar código.

## Criterios de aceptación

### Layout y navegación

- [ ] Todas las rutas privadas renderizan dentro de `AppLayout` sin tocar `App.tsx` individualmente (un solo cambio en el árbol de rutas).
- [ ] En pantallas `lg:` (≥1024px) el sidebar es visible, fijo a la izquierda, con ancho `w-64`, y no hay top bar.
- [ ] En pantallas `<lg` el sidebar está oculto; en su lugar aparece una top bar con botón hamburguesa a la izquierda y el nombre de la app al centro.
- [ ] El ítem activo en el sidebar tiene highlight visual usando la paleta `primary` existente.
- [ ] `StudentsPage` y `ClassesPage` ya no contienen header propio ni botón "Volver".

### Drawer (mobile)

- [ ] Click en hamburguesa abre el drawer lateral desde la izquierda con los mismos ítems del sidebar.
- [ ] El drawer cierra al hacer click en el backdrop semi-transparente.
- [ ] El drawer cierra al presionar `Esc`.
- [ ] El drawer cierra al hacer click en cualquier `NavLink` (después de navegar).
- [ ] El drawer cierra al activarse el breakpoint `lg:` con el drawer abierto (resize/matchMedia).
- [ ] El foco queda atrapado dentro del drawer mientras está abierto (mismo mecanismo que `ConfirmDialog`).
- [ ] El drawer tiene un botón `X` visible arriba a la derecha para cerrarlo.

### ConfirmDialog

- [ ] Al intentar desactivar un alumno o una clase, aparece `ConfirmDialog` en lugar de `confirm()` nativo.
- [ ] `ConfirmDialog` con `tone="danger"` muestra el botón de confirmación en rojo / accent oscuro.
- [ ] Al abrir el diálogo, el foco se mueve al botón "Cancelar".
- [ ] Al cerrar el diálogo (por cualquier vía), el foco vuelve al elemento que lo abrió.
- [ ] Presionar `Esc` cierra el diálogo.
- [ ] Click en backdrop cierra el diálogo cuando `tone !== 'danger'`; no cierra cuando `tone === 'danger'`.
- [ ] El foco no puede salir del diálogo mientras está abierto (focus trap).
- [ ] `ConfirmDialog` tiene tests unitarios que cubren: renderizado, ARIA, cierre con Esc, cierre con backdrop (ambos tones), llamada a `onConfirm`/`onCancel`.

### Dashboard

- [ ] El dashboard muestra el saludo "Hola, {nombre del profesor}" con el nombre real (desde JWT o endpoint).
- [ ] La fecha actual se muestra formateada en español ("viernes 8 de mayo") usando `Date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })`.
- [ ] Las 3 tarjetas de métricas muestran: alumnos activos, clases activas y próxima clase.
- [ ] En mobile las tarjetas son 1 por fila; a partir de `md:` son 3 por fila.
- [ ] "Próxima clase" muestra "—" si no hay clases activas.
- [ ] La lista "Próximas clases de la semana" muestra todas las ocurrencias dentro de los próximos 7 días, ordenadas cronológicamente.
- [ ] En estado loading se muestran skeletons de las tarjetas.
- [ ] En estado error se muestra un banner inline (no `alert()`).
- [ ] Si no hay clases activas, se muestra un CTA "Agregá tu primera clase" en lugar de la lista.
- [ ] Las métricas se refrescan al volver de crear/eliminar un alumno o clase (re-fetch al montar o en foco de ruta).
- [ ] El backend incluye `name` en el payload del JWT al hacer login.
- [ ] El frontend decodifica el JWT con `decodeJwt()` y muestra el nombre real del profesor en el saludo.
- [ ] Si el JWT no contiene `name` (token viejo), el saludo cae a "Hola" sin romper la página.

### Página de Alumnos

- [ ] El buscador filtra en tiempo real la lista local por `firstName + " " + lastName + " " + phone + " " + (email ?? "")` con `includes` case-insensitive.
- [ ] Los avatares muestran las iniciales (primera letra de `firstName` + primera letra de `lastName`) en un círculo de 48px.
- [ ] El color de fondo del avatar es determinista: mismo nombre → siempre mismo color, usando un hash simple (suma de char codes módulo 6) sobre los 6 colores definidos en la spec.
- [ ] Las cards se muestran en 1 columna en mobile y 2 columnas a partir de `md:`.
- [ ] El menú `⋯` reemplaza los botones inline "Editar" y "Desactivar".
- [ ] El menú `⋯` es navegable con flechas arriba/abajo, cierra con `Esc` y con click fuera, y devuelve el foco al botón disparador al cerrar.

### Página de Clases

- [ ] Cada card de clase muestra una fila de 7 chips `D L M X J V S`.
- [ ] Los chips de días sin horario tienen fondo gris claro y opacidad reducida.
- [ ] Los chips de días con horario tienen fondo `primary-600` y texto blanco.
- [ ] Debajo de los chips se lista los horarios de los días activos en formato `Sáb 19:00–20:00`.
- [ ] El menú `⋯` reemplaza los botones inline de Clases (mismo componente `ActionMenu`).

## Contrato de API

Cambio mínimo en backend: extender el payload del JWT firmado en `backend/src/controllers/auth-controller.ts` para incluir el campo `name` del usuario. El campo ya existe en el modelo `User` de Prisma. No hay cambios de schema ni migraciones.

## Cambios en base de datos

Ninguno.

## Cambios en UI

### Wireframes ASCII

#### Dashboard — Mobile (< 768px)

```
┌─────────────────────┐
│ ☰  SBKAcademy       │  ← top bar
├─────────────────────┤
│  Hola, Lucía        │
│  viernes 8 de mayo  │
│                     │
│ ┌─────────────────┐ │
│ │ Alumnos activos │ │
│ │       24        │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Clases activas  │ │
│ │        6        │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Próxima clase   │ │
│ │ Sáb 19:00       │ │
│ │ Bachata Inicial │ │
│ └─────────────────┘ │
│                     │
│ Próximas clases     │
│ ─────────────────   │
│ Sáb 19:00–20:00     │
│ Bachata Inicial      │
│ Sáb 20:30–21:30     │
│ Bachata Intermedio   │
│ Dom 18:00–19:00     │
│ Sensual              │
└─────────────────────┘
```

#### Dashboard — Desktop (≥ 1024px)

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  Hola, Lucía                                     │
│ SBKAca-  │  viernes 8 de mayo                               │
│  demy    │                                                  │
│──────────│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐│
│  Inicio  │  │ Alumnos act.│ │Clases activ.│ │ Próxima clase ││
│  Alumnos │  │     24      │ │      6      │ │  Sáb 19:00    ││
│  Clases  │  └─────────────┘ └─────────────┘ │Bachata Inicial││
│──────────│                                  └──────────────┘│
│          │  Próximas clases de la semana                    │
│          │  ────────────────────────────                    │
│          │  Sáb 19:00–20:00   Bachata Inicial               │
│          │  Sáb 20:30–21:30   Bachata Intermedio            │
│          │  Dom 18:00–19:00   Sensual                       │
│ Cerrar   │                                                  │
│ sesión   │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

#### Alumnos — Mobile (< 768px)

```
┌─────────────────────┐
│ ☰  SBKAcademy       │
├─────────────────────┤
│ Buscar por nombre…  │  ← input search
│ ┌─────────────────┐ │
│ │ 🔵 ML  | María  │⋯│
│ │  López          │ │
│ │  +54 11 1234    │ │
│ │  m@mail.com     │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ 🟢 JP  | Juan   │⋯│
│ │  Pérez          │ │
│ │  +54 11 5678    │ │
│ └─────────────────┘ │
│          + Agregar  │
└─────────────────────┘
```

#### Alumnos — Desktop (≥ 768px)

```
┌──────────┬────────────────────────────────────────────────┐
│          │ Alumnos              [Buscar por nombre…] [+]  │
│ SBKAca-  │                                                │
│  demy    │ ┌──────────────────┐  ┌──────────────────┐    │
│──────────│ │🔵 ML  María López│⋯ │🟢 JP  Juan Pérez │⋯   │
│  Inicio  │ │ +54 11 1234      │  │ +54 11 5678      │    │
│  Alumnos │ │ m@mail.com       │  │ j@mail.com       │    │
│  Clases  │ └──────────────────┘  └──────────────────┘    │
│          │ ┌──────────────────┐  ┌──────────────────┐    │
│          │ │🟡 AC Ana Castillo│⋯ │  ...             │    │
│ Cerrar   │ └──────────────────┘                          │
└──────────┴────────────────────────────────────────────────┘
```

#### Clases — Mobile y Desktop (misma estructura, 1 columna siempre)

```
┌─────────────────────────────────────┐
│  Clases                         [+] │
├─────────────────────────────────────┤
│ ┌──────────────────────────────── ⋯┐│
│ │ Bachata Inicial                   │
│ │ [D][L][M][X][J][V][S]             │
│ │  (D,L,M,X,J sin fondo)            │
│ │  V=primary-600, S=primary-600     │
│ │ Vie 19:00–20:00                   │
│ │ Sáb 20:30–21:30                   │
│ └───────────────────────────────────┘
│ ┌──────────────────────────────── ⋯┐│
│ │ Bachata Intermedio                │
│ │ [D][L][M][X][J][V][S]             │
│ │  S=primary-600                    │
│ │ Sáb 19:00–20:00                   │
│ └───────────────────────────────────┘
└─────────────────────────────────────┘
```

#### Drawer abierto — Mobile

```
┌──────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  ← backdrop semitransparente
│░┌────────────────┐░░░░░░░░░░░░░│
│░│ SBKAcademy  [X]│░░░░░░░░░░░░░│
│░│────────────────│░░░░░░░░░░░░░│
│░│  Inicio        │░░░░░░░░░░░░░│
│░│  Alumnos       │░░░░░░░░░░░░░│
│░│  Clases        │░░░░░░░░░░░░░│
│░│                │░░░░░░░░░░░░░│
│░│                │░░░░░░░░░░░░░│
│░│ Cerrar sesión  │░░░░░░░░░░░░░│
│░└────────────────┘░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└──────────────────────────────────┘
```

### Nuevos componentes a crear

| Componente | Ruta | Responsabilidad |
|---|---|---|
| `app-layout.tsx` | `frontend/src/components/` | Shell con sidebar (lg:) / top bar + drawer (<lg) y `<Outlet />` |
| `sidebar-nav.tsx` | `frontend/src/components/` | Lista de NavLinks con highlight activo; reutilizado por sidebar fijo y drawer |
| `top-bar.tsx` | `frontend/src/components/` | Top bar con botón hamburguesa visible solo en `<lg`; nombre de la app al centro |
| `mobile-drawer.tsx` | `frontend/src/components/` | Drawer lateral con focus trap y backdrop; recibe `open`, `onClose` |
| `confirm-dialog.tsx` | `frontend/src/components/` | Modal de confirmación con accesibilidad completa y focus trap |
| `action-menu.tsx` | `frontend/src/components/` | Menú `⋯` con popover accesible, navegación por teclado y cierre automático |
| `avatar-initials.tsx` | `frontend/src/components/` | Círculo 48px con iniciales y color de fondo determinista |
| `day-chips.tsx` | `frontend/src/components/` | Fila de 7 chips D/L/M/X/J/V/S con destacado según `schedules` activos |
| `metric-card.tsx` | `frontend/src/components/` | Tarjeta con label, valor grande y subtítulo opcional (dashboard) |
| `decode-jwt.ts` | `frontend/src/utils/` | Decodifica el payload del JWT desde localStorage. Devuelve `{ id, email, name } | null`. Sin verificación de firma — solo lectura del payload base64. |

### Componente `AppLayout` — Especificación detallada

#### Estructura general

`AppLayout` es el shell de todas las rutas privadas. Renderiza:
- En `lg:`: sidebar fijo a la izquierda (`lg:fixed lg:inset-y-0 lg:w-64`) con `SidebarNav`. El contenido principal tiene `lg:pl-64` para no solaparse.
- En `<lg`: top bar en la parte superior con `TopBar` (contiene el botón hamburguesa). Cuando el usuario abre el drawer, se monta `MobileDrawer`.
- `<Outlet />` de React Router inyecta la página activa en el área de contenido.

#### Responsive breakpoint `lg:` con drawer abierto

Cuando el usuario tiene el drawer abierto y redimensiona la ventana hasta alcanzar `lg:` (≥1024px), el drawer debe cerrarse automáticamente. Mecanismo: `window.matchMedia('(min-width: 1024px)')` con listener en `MobileDrawer`. Al activarse la media query, llamar `onClose()`.

### Componente `MobileDrawer` — Especificación detallada

#### Animación

- Drawer: slide desde `translate-x-full` (fuera del viewport a la izquierda, negativo) hasta `translate-x-0`. Usar `transition-transform duration-300 ease-out`.
- Backdrop: fade de `opacity-0` a `opacity-100`.

#### Cierre

- Click en backdrop (`onClose`).
- Tecla `Esc` (`keydown` listener mientras está montado).
- Click en cualquier `NavLink` (el componente `SidebarNav` recibe una prop `onNavigate` que llama `onClose`).
- Botón `X` en la parte superior derecha del drawer.
- Media query `lg:` activa (ver AppLayout).

#### Focus trap

Mismo mecanismo que `ConfirmDialog`: interceptar `keydown Tab`/`Shift+Tab`, calcular el primer y último elemento enfocable dentro del drawer, redirigir circularmente. No definir el mecanismo dos veces — referenciar la implementación de `ConfirmDialog` o extraerlo a un hook `useFocusTrap(containerRef, isActive)` compartido entre ambos componentes.

### Componente `ConfirmDialog` — Especificación detallada

#### Props

```
open: boolean
title: string
description: string
confirmLabel: string
cancelLabel: string
tone: 'danger' | 'default'
onConfirm: () => void
onCancel: () => void
closeOnBackdrop?: boolean   // default: true cuando tone === 'default'; false cuando tone === 'danger'
```

#### Comportamiento visual

- Backdrop semi-transparente (`bg-black/40`) con blur sutil (`backdrop-blur-sm`).
- Card centrada, fondo blanco, `rounded-2xl`, sombra `shadow-xl`.
- Animación de entrada/salida: `transition-all duration-200 ease-out`, combinando `opacity-0 → opacity-100` y `scale-95 → scale-100`. Sin librerías de animación.
- Botón de confirmación: `tone === 'danger'` → `bg-accent-600 hover:bg-accent-700 text-white`; `tone === 'default'` → `bg-primary-600 hover:bg-primary-700 text-white`.
- Botón de cancelar: siempre borde neutro (`border-gray-300`), texto en `text-foreground`.

#### Accesibilidad

- `role="dialog"` en el contenedor del panel.
- `aria-modal="true"` en el mismo contenedor.
- `aria-labelledby` apuntando al `id` del `<h2>` que contiene el `title`.
- `aria-describedby` apuntando al `id` del párrafo que contiene el `description`.

#### Gestión de foco

- Al abrirse: mover el foco al botón "Cancelar" (más seguro; evita que un Enter rápido confirme una acción destructiva por accidente).
- Al cerrarse: devolver el foco al elemento DOM que lo tenía antes de abrir el diálogo. Guardar la referencia con `document.activeElement` al momento del montaje.
- Focus trap: interceptar `keydown Tab`/`Shift+Tab`, calcular primer y último elemento enfocable, redirigir circularmente. Si se extrae a un hook `useFocusTrap`, el `ConfirmDialog` lo usa igual que `MobileDrawer`.

#### Cierre

- Tecla `Esc` → llama `onCancel`.
- Click en backdrop → llama `onCancel` solo si `closeOnBackdrop` es `true`.

### Componente `ActionMenu` — Especificación detallada

#### Props

```
items: Array<{ label: string; onClick: () => void; tone?: 'danger' | 'default' }>
triggerLabel?: string   // aria-label para el botón ⋯, default: "Más opciones"
```

#### Comportamiento

- Botón disparador con tres puntos verticales (`⋯`). Al hacer click abre un popover con la lista de ítems.
- Posicionamiento: `position: absolute` dentro de un wrapper `relative`. Sin librerías de positioning externas.
- El popover aparece debajo del botón (o arriba si no hay espacio, pero esto no es requerido para MVP — solo abajo).

#### Accesibilidad

- Botón con `aria-haspopup="menu"` y `aria-expanded` sincronizado con el estado de apertura.
- Popover con `role="menu"`.
- Cada ítem con `role="menuitem"`.
- Navegación con `ArrowDown`/`ArrowUp` entre ítems.
- `Home`/`End` para ir al primero/último ítem (opcional para MVP).
- `Esc` cierra el popover y devuelve foco al botón disparador.
- Click fuera del componente cierra el popover.
- Al cerrar, el foco vuelve al botón disparador.

### Componente `AvatarInitials` — Especificación detallada

#### Props

```
firstName: string
lastName: string
size?: number   // default: 48 (px)
```

#### Algoritmo de color

1. Concatenar `firstName + " " + lastName`.
2. Calcular hash: sumar los `charCodeAt(i)` de todos los caracteres del string.
3. `colorIndex = hash % 6`.
4. Usar el color en el índice correspondiente del array de 6 colores.

#### Paleta de 6 colores (fondo del avatar, texto siempre blanco)

| Índice | Tailwind aproximado | Hex |
|---|---|---|
| 0 | primary-500 | `#6366f1` (indigo) |
| 1 | emerald-500 | `#10b981` |
| 2 | amber-500 | `#f59e0b` |
| 3 | rose-500 | `#f43f5e` |
| 4 | sky-500 | `#0ea5e9` |
| 5 | violet-500 | `#8b5cf6` |

Nota: si el proyecto tiene un token `primary-500` diferente, usar el valor del token. Los hex son valores de referencia para que el diseño sea consistente; ajustar si la paleta del proyecto difiere.

### Componente `DayChips` — Especificación detallada

#### Props

```
schedules: ClassSchedule[]
```

#### Comportamiento

- Renderizar siempre 7 chips en el orden `D L M X J V S` (domingo a sábado).
- Para cada chip, determinar si algún `schedule` del array tiene `dayOfWeek` que corresponda a ese día.
- Mapeo de `dayOfWeek` (del modelo Prisma) a índice de chip: `0=D, 1=L, 2=M, 3=X, 4=J, 5=V, 6=S`.
- Chip activo: `bg-primary-600 text-white opacity-100`.
- Chip inactivo: `bg-gray-100 text-gray-400 opacity-60`.
- Debajo de la fila de chips: lista de horarios de los días activos en formato `Sáb 19:00–20:00`, donde el día abreviado viene de un map `[0:'Dom', 1:'Lun', 2:'Mar', 3:'Mié', 4:'Jue', 5:'Vie', 6:'Sáb']`.

### Dashboard — Algoritmo "próxima clase"

El cálculo se hace completamente en cliente al recibir la lista de clases activas del backend.

**Algoritmo:**
1. Para cada clase activa, iterar sus `schedules`.
2. Para cada `schedule`, calcular el próximo `Date` futuro: tomar `now`, avanzar días hasta encontrar el `dayOfWeek` del schedule. Si hoy es ese día pero la hora ya pasó, avanzar 7 días.
3. Construir un objeto `{ class, schedule, nextDate }`.
4. Ordenar todos los objetos por `nextDate` ascendente.
5. El primero de la lista es la "próxima clase".
6. Para "próximas clases de la semana": filtrar los objetos donde `nextDate <= now + 7 días`, ordenados por `nextDate`.

**Nota:** este cálculo usa la hora local del cliente. Si el cliente tiene la hora desfasada, el resultado es incorrecto (ver Riesgos).

### Páginas a modificar

**`frontend/src/App.tsx`**
Reestructurar rutas privadas para usar `AppLayout` como layout padre con `<Outlet />`. Las rutas `/dashboard`, `/dashboard/students` y `/dashboard/classes` quedan anidadas bajo un único `<Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>`.

**`frontend/src/pages/dashboard-page.tsx`**
Reemplazar el contenido actual por: saludo con nombre del profesor, fecha formateada, 3 `MetricCard`, y lista de próximas clases. Consume la lista de alumnos activos y clases activas del backend (re-fetch al montar). El nombre del profesor se obtiene llamando a `decodeJwt()` desde `utils/decode-jwt.ts`. Si el token no es válido o falta el campo `name`, mostrar el saludo como "Hola" sin nombre (fallback).

**`frontend/src/pages/students-page.tsx`**
Eliminar `<header>` propio. Agregar input de búsqueda. Reemplazar cards existentes con el nuevo diseño (avatar + menú `⋯`). Reemplazar `confirm()` por `ConfirmDialog`. Reemplazar `alert()` por error inline.

**`frontend/src/pages/classes-page.tsx`**
Eliminar `<header>` propio. Reemplazar cards existentes con el nuevo diseño (chips de día + menú `⋯`). Reemplazar `confirm()` por `ConfirmDialog`. Reemplazar `alert()` por error inline.

### Estructura de carpetas resultante

```
frontend/src/
  components/
    action-menu.tsx          ← nuevo
    app-layout.tsx           ← nuevo
    avatar-initials.tsx      ← nuevo
    confirm-dialog.tsx       ← nuevo
    day-chips.tsx            ← nuevo
    metric-card.tsx          ← nuevo
    mobile-drawer.tsx        ← nuevo
    private-route.tsx        ← sin cambios
    sidebar-nav.tsx          ← nuevo
    top-bar.tsx              ← nuevo
  utils/
    decode-jwt.ts            ← nuevo
  hooks/
    use-focus-trap.ts        ← nuevo (opcional; si se extrae de ConfirmDialog/MobileDrawer)
  pages/
    classes-page.tsx         ← modificado
    class-form-page.tsx      ← sin cambios
    dashboard-page.tsx       ← modificado
    login-page.tsx           ← sin cambios
    student-form-page.tsx    ← sin cambios
    students-page.tsx        ← modificado
  test/
    confirm-dialog.test.tsx  ← nuevo
```

## Riesgos y dependencias

- **Nombre del profesor en el JWT**: resuelto — se extiende el payload del JWT con `name` (opción a). Cambio mínimo en `auth-controller.ts`. Riesgo residual: tokens emitidos antes del despliegue del cambio no contendrán `name`. Mitigación: el frontend tiene fallback a "Hola" sin nombre, y el usuario re-loguea para refrescar el token.
- **Rutas anidadas de React Router**: el cambio de rutas planas a anidadas con `<Outlet />` requiere que las páginas existentes no dependan de `min-h-screen` para ocupar el viewport — ese token pasa a ser responsabilidad del layout. Verificar que el diseño no se rompa al eliminar ese wrapper.
- **Cálculo de "próxima clase" en cliente**: usa la hora local del dispositivo. Si el cliente tiene la hora desfasada, el resultado es incorrecto. Aceptable para MVP; documentar para Fase 2 si se agrega agenda compartida.
- **Performance del buscador**: el filtrado en cliente es instantáneo hasta ~300-500 alumnos. Para listas mayores puede notarse lag. No es problema en MVP, pero si el proyecto crece hay que migrar a búsqueda server-side.
- **Eliminación de `confirm()` / `alert()`**: son llamadas síncronas; el `ConfirmDialog` es asíncrono. El estado `deactivatingId` en ambas páginas ya maneja el flujo async correctamente, pero el wiring del diálogo necesita mantener el `id` pendiente de confirmación como estado local.
- **Focus trap en tests**: simular Tab y Shift+Tab en jsdom requiere `userEvent` de `@testing-library/user-event`, que ya está en el proyecto. Verificar que la versión instalada soporte eventos de teclado encadenados.
- **`backdrop-blur-sm` en navegadores legacy**: es CSS `backdrop-filter`, soportado en todos los navegadores modernos. No es un riesgo real para el MVP.
- **Posicionamiento del ActionMenu popover**: sin librería de positioning, el popover puede salirse del viewport en cards cerca del borde derecho o inferior. Para MVP aceptar que aparece siempre abajo; si hay overflow horizontal, usar `right-0` en el popover para anclarlo a la derecha del botón.

## Fuera de alcance

- Sidebar colapsable (distinto a ocultable en mobile — eso SÍ está en scope).
- Temas oscuros.
- Rediseño de páginas de formulario (`StudentFormPage`, `ClassFormPage`).
- Modal genérico reutilizable para formularios.
- Tests e2e del flujo completo de navegación con sidebar.
- Notificaciones de éxito tipo toast.
- Endpoint `/auth/me` como parte de esta spec (queda como riesgo a resolver antes de implementar). (Decisión: se eligió extender el JWT en lugar de crear /auth/me porque el nombre es un dato estático que no requiere request adicional. /auth/me se justificará cuando se necesite traer datos del usuario que cambian, p.ej. foto de perfil o settings.)
- Posicionamiento inteligente del ActionMenu (flip/flip-start para evitar overflow) — solo abajo para MVP.
