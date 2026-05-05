# SBKAcademy — Memory (Log de Decisiones)

Registro vivo de decisiones técnicas tomadas durante el desarrollo.

---

## Decisiones de Arquitectura

### [2026-05-04] Stack elegido: Opción A (separación clásica)
**Decisión:** React + Vite / Node.js + Express / PostgreSQL + Prisma / Vercel + Railway
**Por qué:** Separar frontend y backend permite aprender cada capa de forma aislada. Prioridad es el aprendizaje sobre la velocidad.
**Alternativas descartadas:** Next.js full-stack (mezcla capas), Supabase (enseña menos backend real).

### [2026-05-04] Nombre del proyecto: SBKAcademy
**Decisión:** SBKAcademy.
**Por qué:** Elegido por el usuario entre varias opciones propuestas.

### [2026-05-04] Estilos: Tailwind CSS
**Decisión:** Tailwind CSS para estilos del frontend.
**Por qué:** Estándar del mercado en 2026, muy demandado en empleos frontend.
**Alternativas descartadas:** CSS Modules (más manual), shadcn/ui (demasiado para el MVP inicial).

### [2026-05-04] Usuarios del sistema — diseño con roles desde el inicio
**Decisión:** Aunque Fase 1 solo tiene al profesor, diseñar la arquitectura con roles (profesor, alumno) desde el principio.
**Por qué:** Añadir roles después obligaría a reescribir gran parte del backend.

---

## Decisiones de Agentes y Modelos

### [2026-05-04] Equipo de agentes configurado
**Agentes creados en `.claude/agents/`:**
- `frontend-agent.md` → model: sonnet — implementa componentes React/Vite/TypeScript
- `backend-agent.md` → model: sonnet — implementa rutas Express, schema Prisma, lógica de negocio
- `research-agent.md` → model: sonnet — busca documentación y compara aproximaciones

**Estrategia de modelos:**
- Tareas críticas puntuales (seguridad, arquitectura compleja) → subir a Opus temporalmente
- Tareas de desarrollo normal → Sonnet
- Haiku descartado por preferencia del usuario

---

## Decisiones de Setup

### [2026-05-04] Repositorio creado
**URL:** https://github.com/jperazadam/SBKAcademy
**Visibilidad:** Público
**Branch principal:** main
**Rama por defecto configurada:** main

### [2026-05-04] Execution Policy de PowerShell
**Decisión:** Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
**Por qué:** Windows bloqueaba npm.ps1. Necesario para usar herramientas Node.js en Windows.

### [2026-05-04] Git identity configurada globalmente
- user.name: jperazadam
- user.email: jperazaperezdam@gmail.com

---

## Plan de fases del MVP

### Fase 1 — MVP (en progreso)
- [x] Estructura de carpetas y configuración base
- [ ] **SIGUIENTE SESIÓN:** Inicializar proyecto backend (Node.js + Express + TypeScript + Prisma)
- [ ] **SIGUIENTE SESIÓN:** Inicializar proyecto frontend (React + Vite + TypeScript + Tailwind)
- [ ] Diseñar schema de Prisma (tabla Alumnos con campos y tipos)
- [ ] Endpoints CRUD de alumnos (GET, POST, PUT, DELETE)
- [ ] Componentes React: lista de alumnos + formulario
- [ ] Conectar frontend con backend via fetch/axios
- [ ] Autenticación del profesor (JWT)

### Fase 2
- [ ] Control de asistencia
- [ ] Control de pagos / mensualidades

### Fase 3
- [ ] Portal del alumno
- [ ] Soporte multi-profesor

---

## Próximos pasos concretos (inicio de siguiente sesión)

1. Lanzar `backend-agent` y `frontend-agent` en paralelo para inicializar ambos proyectos
2. Backend: `npm init`, instalar Express + TypeScript + Prisma + dependencias base
3. Frontend: `npm create vite@latest` con React + TypeScript, luego instalar Tailwind
4. Verificar que ambos servidores de desarrollo arrancan (`npm run dev`)
5. Primer commit de los proyectos inicializados
