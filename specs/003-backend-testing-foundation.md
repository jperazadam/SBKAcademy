# Spec: Backend Testing Foundation

## Problema

El backend todavía no tiene una forma estándar de ejecutar tests. Antes de construir el CRUD de alumnos, necesitamos una base mínima para probar endpoints HTTP de Express sin depender de Railway, PostgreSQL ni una base de datos real.

Además, para testear endpoints con Supertest, la app de Express debe poder importarse sin abrir un puerto. Si la construcción de la app y `app.listen()` están mezclados, los tests quedan acoplados al servidor real, y eso es una mala base para crecer.

## Alcance

Configurar una base mínima de testing para el backend:

- **Test runner:** Vitest en `backend/`.
- **HTTP testing:** Supertest para probar endpoints Express.
- **Arquitectura:** separar construcción de app Express del arranque del servidor.
- **Primer test:** validar `GET /health` sin abrir un puerto real.

CRUD de alumnos, tests E2E y tests contra base de datos real quedan fuera de alcance para este cambio.

## Historias de usuario

1. **Como desarrollador**, quiero ejecutar tests del backend con un comando claro para detectar errores antes de tocar funcionalidades críticas.
2. **Como desarrollador**, quiero testear endpoints Express sin levantar un servidor real ni depender de puertos.
3. **Como desarrollador**, quiero que los tests backend no dependan de Railway/PostgreSQL para poder correrlos rápido y de forma repetible.

## Criterios de aceptación

| # | Criterio |
|---|----------|
| 1 | `backend/package.json` expone un script para ejecutar tests backend |
| 2 | El comando de tests corre desde `backend/` y falla con exit code distinto de cero si un test falla |
| 3 | Los tests backend no requieren conexión real a Railway, PostgreSQL ni `DATABASE_URL` funcional |
| 4 | La app Express puede importarse desde tests sin ejecutar `app.listen()` |
| 5 | El backend sigue arrancando normalmente en desarrollo con el mismo comportamiento actual |
| 6 | Existe al menos un test HTTP con Supertest contra `GET /health` |
| 7 | Los tests están escritos en TypeScript y se ejecutan sin compilar tests manualmente a JavaScript |
| 8 | Este cambio no implementa ni testea CRUD de alumnos |
| 9 | Este cambio no agrega Playwright, Cypress ni infraestructura E2E |

## Requirements

### Requirement: Backend Test Command

The backend package MUST expose a test command runnable from `backend/`. The command MUST execute the backend TypeScript test suite and MUST return a non-zero exit code when tests fail.

#### Scenario: Run backend tests from backend directory

- GIVEN a developer is in the `backend/` directory
- WHEN the developer runs the backend test command
- THEN the TypeScript test suite MUST execute
- AND the command MUST report success or failure via its process exit code

### Requirement: Database-Free Test Execution

Backend tests MUST run without Railway access, PostgreSQL connectivity, or a real `DATABASE_URL`. Tests MUST NOT require migrations, a provisioned database, or network access to database infrastructure.

#### Scenario: Tests run without database environment

- GIVEN no real database connection is available
- AND no real `DATABASE_URL` connectivity can be used
- WHEN the backend test command runs
- THEN tests MUST complete without attempting Railway/PostgreSQL connectivity

#### Scenario: Database-dependent behavior is isolated

- GIVEN a test exercises behavior that would normally depend on persistence
- WHEN the test runs
- THEN database access MUST be replaced by deterministic test doubles or excluded from this foundation

### Requirement: Importable Express App

The Express app MUST be importable by tests without opening a network port. Starting the HTTP listener SHALL remain a runtime concern, separate from app construction.

#### Scenario: Test imports app without listening

- GIVEN an HTTP test imports the Express app
- WHEN the import completes
- THEN no port MUST be bound
- AND the imported app MUST be usable by HTTP test tooling

#### Scenario: Runtime server still starts explicitly

- GIVEN the backend is started normally
- WHEN runtime startup executes
- THEN the server SHALL bind to the configured port using the same Express app

### Requirement: Supertest HTTP Proof

The test suite MUST include at least one HTTP endpoint test proving Supertest can exercise the imported Express app. `GET /health` SHOULD be used as the preferred proof endpoint.

#### Scenario: Health endpoint succeeds through Supertest

- GIVEN the Express app is imported by the test suite
- WHEN Supertest sends `GET /health`
- THEN the response MUST indicate the backend is healthy
- AND the test MUST complete without binding a real port

### Requirement: TypeScript-Compatible Test Workflow

The testing foundation MUST remain compatible with the backend TypeScript workflow. Test files SHALL be written in TypeScript and SHOULD require minimal backend-specific configuration.

#### Scenario: TypeScript test file executes

- GIVEN a backend test file is written in TypeScript
- WHEN the backend test command runs
- THEN the test runner MUST execute the test without requiring compiled JavaScript test files

### Requirement: Scope Boundaries

This foundation MUST NOT implement Students CRUD tests, Students CRUD behavior, browser tests, or E2E tests. Those concerns SHALL remain separate future changes.

#### Scenario: Students CRUD remains out of scope

- GIVEN the backend testing foundation is implemented
- WHEN reviewing the included tests and behavior changes
- THEN they MUST NOT add Students CRUD functionality or Students CRUD test coverage

#### Scenario: Browser and E2E tests remain out of scope

- GIVEN the backend testing foundation is implemented
- WHEN reviewing the test tooling
- THEN it MUST NOT add browser automation or E2E test infrastructure

## Fuera de alcance

- CRUD de alumnos.
- Tests de alumnos.
- Tests contra Railway/PostgreSQL real.
- Migraciones o seeds de base de datos.
- Playwright, Cypress o cualquier infraestructura E2E.
- Coverage mínimo obligatorio.
