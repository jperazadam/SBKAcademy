# SBKAcademy — Log de Decisiones Técnicas

Registro vivo de decisiones técnicas tomadas durante el desarrollo. Cada entrada incluye **qué** se decidió, **por qué**, y las **alternativas descartadas**. Útil como onboarding y para entender el "porqué" del código actual.

---

## Decisiones de Arquitectura

### [2026-05-04] Stack elegido: separación clásica frontend/backend
**Decisión:** React + Vite / Node.js + Express / PostgreSQL + Prisma / Vercel + Railway.
**Por qué:** Separar frontend y backend permite aprender cada capa de forma aislada. Prioridad es el aprendizaje sobre la velocidad.
**Alternativas descartadas:** Next.js full-stack (mezcla capas), Supabase (enseña menos backend real).

### [2026-05-04] Nombre del proyecto: SBKAcademy
**Decisión:** SBKAcademy.
**Por qué:** Elegido por el usuario entre varias opciones propuestas.

### [2026-05-04] Diseño multi-rol desde el inicio
**Decisión:** Aunque Fase 1 solo tiene al profesor, diseñar la arquitectura con roles (profesor, alumno) desde el principio.
**Por qué:** Añadir roles después obligaría a reescribir gran parte del backend.

### [2026-05-04] Estilos: Tailwind CSS
**Decisión:** Tailwind CSS para los estilos del frontend.
**Por qué:** Estándar del mercado en 2026, muy demandado en empleos frontend.
**Alternativas descartadas:** CSS Modules (más manual), shadcn/ui (demasiado para el MVP inicial).

### [2026-05-05] Tailwind v4 con `@tailwindcss/vite` (no v3, no PostCSS)
**Decisión:** Usar Tailwind v4 mediante el plugin oficial de Vite.
**Por qué:** v4 elimina la necesidad de `tailwind.config.js` y `postcss.config.js`, detecta clases automáticamente y compila ~5x más rápido. Para un primer proyecto = menos archivos que entender.
**Alternativas descartadas:** Tailwind v3 + PostCSS (más boilerplate, ya legacy en 2026).

### [2026-05-05] Paleta de colores: "Elegante y sobria"
**Decisión:** Paleta C (Índigo profundo `#1E1B4B` + Rosa intenso `#E11D48` + Blanco roto `#F9FAFB` + Antracita `#111827`).
**Por qué:** Equilibrio entre identidad visual y profesionalidad. Apta para uso prolongado sin cansar la vista.
**Dónde:** Definida en `frontend/src/styles/theme.css` con la directiva `@theme` de Tailwind v4. Se importa desde `index.css` justo después de `@import "tailwindcss"`. Usa **tokens semánticos** (`--color-background`, `--color-foreground`) además de las gradaciones de `primary` y `accent`.
**Alternativas descartadas:** Paleta A "cálida y pasional" (más bachata pero menos legible), Paleta B "tropical energética" (más energía pero menos profesional).

---

## Decisiones de Agentes y Modelos

### [2026-05-04] Equipo de agentes configurado
**Agentes en `.claude/agents/`:**
- `frontend-agent` (sonnet) → componentes React/Vite/TypeScript
- `backend-agent` (sonnet) → rutas Express, schema Prisma, lógica de negocio
- `research-agent` (sonnet) → busca documentación y compara aproximaciones

**Estrategia de modelos:**
- Tareas críticas puntuales (seguridad, arquitectura compleja) → subir a Opus temporalmente
- Tareas de desarrollo normal → Sonnet
- Haiku descartado por preferencia del usuario

### [2026-05-05] Claude actúa como orquestador, no programador
**Decisión:** Cuando el usuario pide una funcionalidad, Claude (1) explica el qué/por qué/opciones, (2) espera confirmación, (3) delega al agente especializado adecuado, (4) transmite el reporte del agente, (5) ofrece commit + push proactivamente.
**Por qué:** Para un primer proyecto, el usuario aprende mejor viendo el razonamiento explicado y los agentes especializados producen código más coherente con sus dominios. Además, evita que se olvide de versionar.
**Excepciones (Claude SÍ programa directamente):** configuración del propio sistema de agentes/skills, edición de CLAUDE.md y DECISIONS, comandos puntuales de setup, o cuando el usuario lo pida explícitamente.

### [2026-05-05] Workflow obligatorio: agentes consultan skills antes de trabajar
**Decisión:** `frontend-agent` y `backend-agent` deben listar `.agents/skills/` y leer los `SKILL.md` relevantes antes de cualquier tarea. Al terminar deben reportar qué skills usaron y cómo influyeron.
**Por qué:** Las skills son guías escritas por equipos como Vercel, Anthropic o Anthony Fu. Aprovecharlas mejora la calidad del código sin esfuerzo.

### [2026-05-05] PowerShell añadido a los tools de los agentes
**Decisión:** Agregar `PowerShell` a la lista de tools de `frontend-agent` y `backend-agent`, además de Bash. Ampliar permisos en `.claude/settings.json` para cubrir el patrón Windows `& "C:\Program Files\nodejs\npm.cmd"`.
**Por qué:** En un build anterior, el agente no pudo ejecutar `npm run build` porque el comando preferido en Windows usa el call-operator `&` y no encajaba con el patrón `Bash(npm *)`. Con PowerShell + permisos `PowerShell(& *)` el agente puede verificar builds sin pedir aprobación cada vez.

---

## Decisiones de Sistema de Skills

### [2026-05-05] Skills instaladas y reproducibilidad
**Decisión:** Adoptar el ecosistema de skills (`npx skills`) con cuatro skills instaladas:
- `vercel-react-best-practices` (Vercel) → patrones modernos de React
- `anthropics/skills@frontend-design` (Anthropic) → diseño visual de UI
- `antfu/skills@vite` (Anthony Fu) → patrones de Vite
- `wshobson/agents@tailwind-design-system` → sistema de diseño con Tailwind

Más una pre-existente: `find-skills` (vercel-labs/skills) → el slash command `/find-skills`.

**Reproducibilidad en otra máquina:** se versiona `skills-lock.json`. En una máquina nueva basta con `git clone` + `npx skills experimental_install` para recrear todas las skills con los hashes exactos.

**Estructura física en disco:**
- `.agents/skills/<name>/` — directorio real con los archivos de la skill (universal, lo usan todas las herramientas IA)
- `.claude/skills/<name>/` — junction NTFS (puntero) que apunta al directorio real. Ocupa 0 bytes.

Ambas rutas se gitignoran (los archivos son recreables desde el lockfile).

### [2026-05-05] Logs de decisiones en raíz como `DECISIONS.md`
**Decisión:** El log de decisiones técnicas (este archivo) vive en `DECISIONS.md` en la raíz del repo, no dentro de `.claude/`.
**Por qué:** Es documentación del proyecto, no del agente. Renombrar a `DECISIONS.md` evita la confusión con el sistema de auto-memoria del agente. Posición en raíz lo hace visible junto al README.

---

## Decisiones de Setup

### [2026-05-04] Repositorio creado
**URL:** https://github.com/jperazadam/SBKAcademy
**Visibilidad:** Público
**Branch principal:** main (sin feature branches por ahora — MVP solo)

### [2026-05-04] Execution Policy de PowerShell
**Decisión:** `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`.
**Por qué:** Windows bloqueaba `npm.ps1`. Necesario para usar herramientas Node.js en Windows.

### [2026-05-04] Git identity configurada globalmente
- `user.name`: jperazadam
- `user.email`: jperazaperezdam@gmail.com

### [2026-05-05] Convención de commits: Conventional Commits
**Decisión:** Usar prefijos `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `style:`, `test:`. Granularidad: 1 commit por unidad funcional acabada.
**Por qué:** Estándar de la industria; permite generar changelogs automáticamente en el futuro.

### [2026-05-05] Estructura de gitignore
- Ignorados: `node_modules/`, `.env*`, `dist/`, `.claude/settings.local.json`, `.agents/skills/`, `.claude/skills/`
- Versionados: `package-lock.json` (frontend y backend), `skills-lock.json`, `.claude/settings.json`, `.claude/agents/`

---

## Estado actual del MVP (Fase 1)

### Completado
- [x] Estructura de carpetas y configuración base
- [x] Backend inicializado: Node.js + Express + TypeScript + Prisma + migraciones aplicadas
- [x] Frontend inicializado: React 19 + Vite 8 + TypeScript + ESLint
- [x] Tailwind v4 integrado con paleta de colores y tokens semánticos
- [x] Schema Prisma con modelos `User` (profesor) y `Student` (alumno) — 2 migraciones
- [x] Página de login con servicio `auth-service` y cliente `axios` configurado
- [x] Página dashboard básica
- [x] Sistema de agentes operativo con consulta obligatoria de skills

### Por completar para cerrar Fase 1
- [ ] Backend: endpoint de login (POST `/auth/login`) que devuelva JWT
- [ ] Backend: middleware de autenticación que valide el JWT
- [ ] Backend: endpoints CRUD de alumnos (GET/POST/PUT/DELETE) protegidos
- [ ] Frontend: pantalla de listado de alumnos (consume `GET /students`)
- [ ] Frontend: formulario de alta/edición de alumno (POST/PUT)
- [ ] Frontend: gestión de token JWT (almacenamiento + envío en `Authorization` header)
- [ ] Verificar end-to-end: login real → ver listado → añadir alumno

---

## Fases futuras

### Fase 2
- [ ] Control de asistencia (modelo `Attendance`, registro por clase)
- [ ] Control de pagos / mensualidades (modelo `Payment`)

### Fase 3
- [ ] Portal del alumno (login con rol distinto)
- [ ] Soporte multi-profesor en la misma instancia
