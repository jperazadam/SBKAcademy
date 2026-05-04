# SBKAcademy — Memory (Log de Decisiones)

Registro vivo de decisiones técnicas tomadas durante el desarrollo.
Cada entrada incluye qué se decidió, por qué, y cuándo.

---

## Decisiones de Arquitectura

### [2026-05-04] Stack elegido: Opción A (separación clásica)
**Decisión:** React + Vite / Node.js + Express / PostgreSQL + Prisma / Vercel + Railway
**Por qué:** Separar frontend y backend en proyectos distintos permite aprender cada capa de forma aislada. Prioridad es el aprendizaje sobre la velocidad de desarrollo.
**Alternativas descartadas:** Next.js full-stack (mezcla capas, confuso para aprender), Supabase (enseña menos backend real).

### [2026-05-04] Nombre del proyecto: SBKAcademy
**Decisión:** SBKAcademy (SBK = Sensual Bachata Kizomba).
**Por qué:** Elegido por el usuario entre varias opciones propuestas.

### [2026-05-04] Usuarios del sistema (diseño futuro)
**Decisión:** Diseñar con roles desde el inicio (profesor, alumno).
**Por qué:** En Fase 3 habrá portal para alumnos y soporte multi-profesor. Si no preparamos la arquitectura de roles ahora, habrá que reescribir en el futuro.

---

## Decisiones de Setup

### [2026-05-04] Repositorio creado
**URL:** https://github.com/jperazadam/SBKAcademy
**Visibilidad:** Público
**Branch principal:** main

### [2026-05-04] Execution Policy de PowerShell
**Decisión:** Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
**Por qué:** Windows bloqueaba la ejecución de npm.ps1. Necesario para usar herramientas de desarrollo Node.js en Windows.

---

## Próximas Decisiones Pendientes
- Librería de estilos para el frontend (Tailwind CSS, CSS Modules, etc.)
- Librería de componentes UI (shadcn/ui, MUI, etc.)
- Estrategia de autenticación (JWT, sessions, etc.)
