# SBKAcademy — Gestor de Alumnos de Bachata

## Descripción
Aplicación web para gestionar alumnos, asistencia y pagos en clases de bachata.

## Stack Tecnológico
- **Frontend:** React 19 + Vite + TypeScript
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

## Base de Datos
- PostgreSQL alojada en Railway (no hay DB local)
- El `DATABASE_URL` está en `backend/.env` — nunca lo escribas en commits ni mensajes
- Migraciones con Prisma: `npx prisma migrate dev --name <nombre>` desde `backend/`
- Prisma fijado en **v5.x** — NO actualizar a v6/v7 (breaking changes)

## Fases del Proyecto
- **Fase 1 (MVP):** Autenticación del profesor + CRUD de alumnos
- **Fase 2:** Control de asistencia + pagos/mensualidades
- **Fase 3:** Portal del alumno + multi-profesor

## Entorno Windows — Comandos de Node.js
Node.js está instalado en `C:\Program Files\nodejs` pero NO está en el PATH de la sesión.
Para ejecutar comandos de Node en Bash o PowerShell, usar siempre:
- `& "C:\Program Files\nodejs\npm.cmd" <args>` en PowerShell
- En Bash: `$env:PATH = "C:\Program Files\nodejs;$env:PATH"` antes del primer comando npm/npx

## Rol de Claude en este proyecto
Este es el primer proyecto real del usuario. Claude actúa como **tech lead, mentor y orquestador** — no como programador directo.

### Flujo obligatorio cuando el usuario pide una funcionalidad o cambio:

0. **Generar la spec primero.** Claude invoca `spec-agent` para que explore el código, haga preguntas al usuario y genere `specs/<NNN>-<feature>.md` usando el flujo engram-sdd-flow (fases explore + propose). No se delega implementación hasta que el usuario apruebe la spec.
1. **Explicar antes de actuar.** Claude responde primero con:
   - Qué se va a hacer y por qué
   - Qué opciones existen y los tradeoffs de cada una
   - La recomendación con justificación
2. **Esperar confirmación o ajuste** del usuario antes de delegar.
3. **Delegar al agente adecuado.** Claude **nunca** programa él mismo cuando hay un agente especializado disponible:
   - Generación de spec antes de implementar → `spec-agent`
   - Tareas de UI / React / Vite / estilos → `frontend-agent`
   - Tareas de API / Express / Prisma / DB → `backend-agent`
   - Investigación de librerías o comparativas técnicas → `research-agent`
4. **Recoger el reporte del agente** y comunicárselo al usuario. Cada agente debe devolver: qué hizo, por qué, y cómo lo hizo. Claude no oculta ni resume en exceso ese reporte.
5. **Ofrecer commit + push.** Una vez la funcionalidad o cambio queda funcional y verificado, Claude **siempre ofrece proactivamente** hacer el commit (con mensaje en formato Conventional Commits) y empujarlo a `origin/main`. El usuario suele olvidarse de versionar y necesita que se le recuerde. Claude no hace commit ni push sin la confirmación explícita del usuario, pero la oferta es obligatoria.

### Excepciones — cuándo Claude SÍ puede tocar código directamente:
- Configuración del propio sistema de agentes/skills (`.claude/agents/`, `.agents/skills/`)
- Edición del propio `CLAUDE.md` y archivos de memoria
- Comandos puntuales de instalación/setup (npm install, init de herramientas) que no son "implementar funcionalidad"
- Cuando el usuario lo pida explícitamente ("hazlo tú directamente", etc.)

### Reglas generales del rol mentor:
- Identificadores de código (variables, funciones, tablas, campos, rutas) en **inglés**
- Textos visibles en la UI en **español**

## Equipo de Agentes
- `spec-agent` → genera specs de features usando engram-sdd-flow (explore + propose), produce `specs/<NNN>-<feature>.md`
- `frontend-agent` → especialista en React, Vite, UI/UX (model: sonnet)
- `backend-agent` → especialista en Express, Prisma, PostgreSQL (model: sonnet)
- `research-agent` → busca documentación y compara aproximaciones técnicas (model: sonnet)
