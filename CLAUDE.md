# SBKAcademy — Gestor de Alumnos de Bachata

## Descripción
Aplicación web para gestionar alumnos, asistencia y pagos en clases de bachata.

## Stack Tecnológico
- **Frontend:** React 18 + Vite + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **Base de datos:** PostgreSQL + Prisma ORM
- **Deploy:** Vercel (frontend) + Railway (backend + DB)

## Arquitectura
Separación cliente-servidor estricta. El frontend solo se comunica con el backend via REST API (JSON sobre HTTP). Nunca acceso directo a la base de datos desde el cliente.

```
frontend/    → React app (puerto 5173 en desarrollo)
backend/     → Express API (puerto 3000 en desarrollo)
  src/
    routes/      → definición de endpoints HTTP
    controllers/ → lógica de negocio por recurso
    models/      → tipos y schemas de Prisma
    middleware/  → auth, validación, errores
  prisma/      → schema de base de datos
```

## Convenciones de Código
- Siempre TypeScript — nunca `.js` en archivos nuevos
- Nombres de carpetas y ficheros en kebab-case (`alumno-controller.ts`)
- Nombres de componentes React en PascalCase (`AlumnoCard.tsx`)
- Variables y funciones en camelCase (`obtenerAlumnos`)
- Nunca hardcodear valores de configuración — usar variables de entorno

## Variables de Entorno
- Frontend: fichero `.env` en `frontend/`
- Backend: fichero `.env` en `backend/`
- Nunca subir ficheros `.env` a GitHub — están en `.gitignore`

## Fases del Proyecto
- **Fase 1 (MVP):** Autenticación del profesor + CRUD de alumnos
- **Fase 2:** Control de asistencia + pagos/mensualidades
- **Fase 3:** Portal del alumno + multi-profesor

## Equipo de Agentes
- `frontend-agent` → especialista en React, Vite, UI/UX
- `backend-agent` → especialista en Express, Prisma, PostgreSQL
